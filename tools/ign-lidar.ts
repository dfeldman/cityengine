/**
 * France's bare-earth lidar, for the bake's fine ground (PARIS_BUGS.md, "Better data than OSM"; owner, 2026-10-30: the
 * Seine banks "way too wavy", "the ways are out of sync with the ground many times").
 *
 * The terrarium pyramid the bake samples is SRTM-class over France — about 30 m of real detail under its zoom-15 pixels —
 * and it smears a quay wall into a slope several cells wide: the waves along the Seine, and streets that stand off the
 * ground they cross. IGN's LiDAR HD MNT (Etalab 2.0) is ground only, buildings and trees removed, at 0.5–1 m; Paris is
 * covered (checked 2026-10-30: the Pont Neuf, the quays, the Louvre's courts all read).
 *
 * Fetched from the Géoplateforme's WMS-R as float32 GeoTIFFs, in EPSG:4326 tiles of `TILE_DEG` at `TILE_PX` pixels
 * (≈2.9 × 4.3 m a pixel at Paris's latitude: under the bake's 4 m grid), cached in tools/cache/ign-mnt/.
 *
 *   node --experimental-strip-types tools/ign-lidar.ts 48.855 2.330     # the height there, and a fetch to test
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const WMS = 'https://data.geopf.fr/wms-r/wms'
const LAYER = 'IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.LAMB93'
const DIR = resolve(import.meta.dirname, 'cache', 'ign-mnt')
const TILE_DEG = 0.01
const TILE_PX = 256

interface Grid { w: number; h: number; data: Float32Array; lat0: number; lon0: number }

/** An uncompressed, single-band float32 TIFF (what the WMS returns): its pixels, row by row from the top. */
function readFloatTiff(buf: Buffer): { w: number; h: number; data: Float32Array } {
  const le = buf.toString('latin1', 0, 2) === 'II'
  const u16 = (o: number): number => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o))
  const u32 = (o: number): number => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o))
  const ifd = u32(4)
  const n = u16(ifd)
  const tags = new Map<number, { type: number; count: number; at: number }>()
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12
    tags.set(u16(e), { type: u16(e + 2), count: u32(e + 4), at: e + 8 })
  }
  const value = (tag: number): number[] => {
    const t = tags.get(tag)
    if (!t) return []
    const size = t.type === 3 ? 2 : 4
    const base = t.count * size > 4 ? u32(t.at) : t.at
    return Array.from({ length: t.count }, (_, i) => (t.type === 3 ? u16(base + i * 2) : u32(base + i * 4)))
  }
  const w = value(256)[0], h = value(257)[0]
  if (value(259)[0] !== 1 || value(258)[0] !== 32) throw new Error('ign-lidar: expected an uncompressed float32 TIFF')
  const offsets = value(273), counts = value(279)
  const data = new Float32Array(w * h)
  let k = 0
  for (let s = 0; s < offsets.length; s++) {
    for (let o = offsets[s]; o < offsets[s] + counts[s] && k < data.length; o += 4) data[k++] = le ? buf.readFloatLE(o) : buf.readFloatBE(o)
  }
  return { w, h, data }
}

const key = (lat0: number, lon0: number): string => `${lat0.toFixed(2)}_${lon0.toFixed(2)}`

async function fetchTile(lat0: number, lon0: number): Promise<Grid | null> {
  const file = resolve(DIR, `${key(lat0, lon0)}.tif`)
  if (!existsSync(file)) {
    mkdirSync(DIR, { recursive: true })
    const q = new URLSearchParams({
      SERVICE: 'WMS', VERSION: '1.3.0', REQUEST: 'GetMap', LAYERS: LAYER, STYLES: '', CRS: 'EPSG:4326',
      BBOX: `${lat0},${lon0},${lat0 + TILE_DEG},${lon0 + TILE_DEG}`, WIDTH: String(TILE_PX), HEIGHT: String(TILE_PX), FORMAT: 'image/geotiff',
    })
    for (let attempt = 0; ; attempt++) {
      try {
        const r = await fetch(`${WMS}?${q}`)
        if (!r.ok || !(r.headers.get('content-type') ?? '').includes('tiff')) throw new Error(`${r.status} ${r.headers.get('content-type')}`)
        writeFileSync(file, Buffer.from(await r.arrayBuffer()))
        break
      } catch (e) {
        if (attempt >= 4) { console.warn(`  ign-lidar: tile ${key(lat0, lon0)} not fetched (${(e as Error).message})`); return null }
        await new Promise((ok) => setTimeout(ok, 1500 * (attempt + 1)))
      }
    }
  }
  const { w, h, data } = readFloatTiff(readFileSync(file))
  return { w, h, data, lat0, lon0 }
}

/**
 * The lidar ground over a box: a sampler `at(lat, lon)` giving metres above IGN69 (NGF, within a few decimetres of the
 * terrarium's mean sea level), or null where the survey has no value (outside its coverage, a withheld zone, a hole).
 */
export async function ignLidar(box: { south: number; north: number; west: number; east: number }):
  Promise<{ at: (lat: number, lon: number) => number | null; tiles: number }> {
  const grids = new Map<string, Grid>()
  const la0 = Math.floor(box.south / TILE_DEG) * TILE_DEG, lo0 = Math.floor(box.west / TILE_DEG) * TILE_DEG
  const jobs: Promise<void>[] = []
  let inFlight = 0
  const queue: (() => void)[] = []
  const slot = async (): Promise<void> => { if (inFlight < 6) { inFlight++; return } await new Promise<void>((ok) => queue.push(ok)); inFlight++ }
  const free = (): void => { inFlight--; queue.shift()?.() }
  for (let lat = la0; lat < box.north; lat += TILE_DEG) {
    for (let lon = lo0; lon < box.east; lon += TILE_DEG) {
      const a = +lat.toFixed(2), b = +lon.toFixed(2)
      jobs.push((async () => { await slot(); try { const g = await fetchTile(a, b); if (g) grids.set(key(a, b), g) } finally { free() } })())
    }
  }
  await Promise.all(jobs)
  const px = (g: Grid, i: number, j: number): number | null => {
    const v = g.data[Math.max(0, Math.min(g.h - 1, j)) * g.w + Math.max(0, Math.min(g.w - 1, i))]
    return Number.isFinite(v) && v > -500 && v < 5000 ? v : null
  }
  const at = (lat: number, lon: number): number | null => {
    const a = Math.floor(lat / TILE_DEG + 1e-9) * TILE_DEG, b = Math.floor(lon / TILE_DEG + 1e-9) * TILE_DEG
    const g = grids.get(key(a, b))
    if (!g) return null
    // pixel centres: column i at lon0 + (i + 0.5)·Δ, row j from the TOP at lat0 + TILE − (j + 0.5)·Δ
    const fx = (lon - g.lon0) / TILE_DEG * g.w - 0.5
    const fy = (g.lat0 + TILE_DEG - lat) / TILE_DEG * g.h - 0.5
    const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j
    const p00 = px(g, i, j), p10 = px(g, i + 1, j), p01 = px(g, i, j + 1), p11 = px(g, i + 1, j + 1)
    if (p00 === null || p10 === null || p01 === null || p11 === null) return p00 ?? p10 ?? p01 ?? p11
    return (p00 * (1 - tx) + p10 * tx) * (1 - ty) + (p01 * (1 - tx) + p11 * tx) * ty
  }
  return { at, tiles: grids.size }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const lat = Number(process.argv[2] ?? 48.857), lon = Number(process.argv[3] ?? 2.341)
  const l = await ignLidar({ south: lat - 0.001, north: lat + 0.001, west: lon - 0.001, east: lon + 0.001 })
  console.log(`${l.tiles} tile(s); ground at ${lat}, ${lon}: ${l.at(lat, lon)?.toFixed(2)} m`)
}
