/**
 * The roof heights of a Paris landmark from IGN's LiDAR HD SURFACE model (MNS), the measurement that beat every
 * photograph for the Philharmonie and the Cinémathèque (docs/landmarks/MODEL-PHILHARMONIE.md, MODEL-CINEMATHEQUE.md):
 * every roof, slab and terrace at half a metre, as metres above the bare-earth MNT's median — the ground.
 *
 *   node --experimental-strip-types tools/ign-mns.ts --lat=48.837002 --lon=2.382646 --out=<dir> [--radius=60] [--ring=x,z,x,z,...]
 *
 * Writes to <dir>: grid.txt (a 2 m grid of heights, east across and north down, '.' under 1.5 m), relief.png (a hillshade,
 * 2 m contours, red every 10 m, green grid every 10 m), bands.png (height classes with the legend in the console, the
 * builder's --ring in cyan: the picture to trace a builder from), ortho.png (the 0.2 m HR orthophoto with the ring and a
 * 10 m grid). Coordinates are metres east and north of --lat/--lon, which for a fitted builder is the OSM box's centre:
 * what the builder's own frame is. Needs only pngjs; the TIFF reader is tools/ign-lidar.ts's.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PNG } from 'pngjs'

const WMS = 'https://data.geopf.fr/wms-r/wms'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const LAT = Number(arg('lat')), LON = Number(arg('lon')), R = Number(arg('radius', '60'))
const OUT = arg('out')
if (!Number.isFinite(LAT) || !Number.isFinite(LON) || !OUT) throw new Error('ign-mns: --lat=<deg> --lon=<deg> --out=<dir> [--radius=<m>] [--ring=x,z,...]')
mkdirSync(OUT, { recursive: true })
const ring = arg('ring').split(',').map(Number).filter((v) => Number.isFinite(v))
const MX = 73228, MZ = 111320 // metres a degree at Paris
const LAT0 = LAT - R / MZ, LAT1 = LAT + R / MZ, LON0 = LON - R / MX, LON1 = LON + R / MX
const PX = Math.round((2 * R) / 0.3), PY = PX

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
  if (value(259)[0] !== 1 || value(258)[0] !== 32) throw new Error('ign-mns: expected an uncompressed float32 TIFF')
  const offsets = value(273), counts = value(279)
  const data = new Float32Array(w * h)
  let k = 0
  for (let s = 0; s < offsets.length; s++) {
    for (let o = offsets[s]; o < offsets[s] + counts[s] && k < data.length; o += 4) data[k++] = le ? buf.readFloatLE(o) : buf.readFloatBE(o)
  }
  return { w, h, data }
}

async function get(layer: string, fmt: string, file: string): Promise<Buffer> {
  const at = resolve(OUT, file)
  if (existsSync(at)) return readFileSync(at)
  const u = `${WMS}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${layer}&STYLES=&CRS=EPSG:4326&BBOX=${LAT0},${LON0},${LAT1},${LON1}&WIDTH=${PX}&HEIGHT=${PY}&FORMAT=${encodeURIComponent(fmt)}`
  const r = await fetch(u)
  if (!r.ok) throw new Error(`${layer}: ${r.status}`)
  const b = Buffer.from(await r.arrayBuffer())
  writeFileSync(at, b)
  return b
}

const mns = readFloatTiff(await get('IGNF_LIDAR-HD_MNS_ELEVATION.ELEVATIONGRIDCOVERAGE.LAMB93', 'image/geotiff', 'mns.tif'))
const mnt = readFloatTiff(await get('IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.LAMB93', 'image/geotiff', 'mnt.tif'))
const ortho = PNG.sync.read(await get('HR.ORTHOIMAGERY.ORTHOPHOTOS', 'image/png', 'ortho-raw.png'))
const W = mns.w, H = mns.h
const sorted = Array.from(mnt.data).filter((v) => v > -1000).sort((a, b) => a - b)
const ground = sorted[sorted.length >> 1]
const mx = (2 * R) / W, mz = (2 * R) / H
/** the height above ground at metres east/north of the centre */
const hAt = (e: number, n: number): number => {
  const px = Math.min(W - 1, Math.max(0, Math.round(W / 2 + e / mx))), py = Math.min(H - 1, Math.max(0, Math.round(H / 2 - n / mz)))
  return mns.data[py * W + px] - ground
}
console.log(`ign-mns: ${W}×${H} px, ${mx.toFixed(2)} m a pixel, ground ${ground.toFixed(2)} m NGF`)

// grid.txt
const step = 2, half = Math.floor(R / step)
let txt = '     ' + Array.from({ length: 2 * half + 1 }, (_, i) => String((i - half) * step).padStart(4)).join('') + '\n'
for (let n = half; n >= -half; n--) {
  let row = String(n * step).padStart(5)
  for (let e = -half; e <= half; e++) {
    const h = hAt(e * step, n * step)
    row += h < 1.5 ? '   .' : String(Math.round(h)).padStart(4)
  }
  txt += row + '\n'
}
writeFileSync(resolve(OUT, 'grid.txt'), txt)

const drawRing = (png: PNG, toPx: (e: number, n: number) => [number, number], rgb: [number, number, number]): void => {
  for (let i = 0; i + 1 < ring.length; i += 2) {
    const j = (i + 2) % ring.length
    const a = toPx(ring[i], ring[i + 1]), b = toPx(ring[j], ring[j + 1])
    const k = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]))
    for (let s = 0; s <= k; s++) {
      const t = s / k
      for (const d of [0, 1]) {
        const x = Math.round(a[0] + (b[0] - a[0]) * t) + d, y = Math.round(a[1] + (b[1] - a[1]) * t)
        if (x < 0 || y < 0 || x >= png.width || y >= png.height) continue
        const q = (y * png.width + x) * 4
        png.data[q] = rgb[0]; png.data[q + 1] = rgb[1]; png.data[q + 2] = rgb[2]; png.data[q + 3] = 255
      }
    }
  }
}
const onGrid = (e: number, n: number, every: number, tol: number): boolean => Math.abs(((e % every) + every) % every) < tol || Math.abs(((n % every) + every) % every) < tol

// relief.png: hillshade, 2 m contours (red every 10), green 10 m grid
{
  const S = 2
  const png = new PNG({ width: W * S, height: H * S })
  const h2 = (x: number, y: number): number => mns.data[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))] - ground
  for (let y = 0; y < H * S; y++) for (let x = 0; x < W * S; x++) {
    const X = Math.floor(x / S), Y = Math.floor(y / S)
    const h = h2(X, Y)
    const nx = -(h2(X + 1, Y) - h2(X - 1, Y)) / (2 * mx), nz = -(h2(X, Y - 1) - h2(X, Y + 1)) / (2 * mz)
    const l = Math.hypot(nx, 1, nz)
    const s = Math.max(0, (nx * -0.5 + 0.6 + nz * 0.6) / l) * 0.8 + 0.2
    const t = Math.max(0, Math.min(1, h / 30))
    let r = s * 255 * (0.6 + 0.4 * t), g = s * 255 * 0.75, b = s * 255 * (1 - 0.5 * t)
    const c = Math.floor(h / 2), cr = Math.floor(h2(X + 1, Y) / 2), cd = Math.floor(h2(X, Y + 1) / 2)
    if (c !== cr || c !== cd) {
      if (Math.floor(h / 10) !== Math.floor(h2(X + 1, Y) / 10) || Math.floor(h / 10) !== Math.floor(h2(X, Y + 1) / 10)) { r = 230; g = 40; b = 40 } else { r *= 0.5; g *= 0.5; b *= 0.5 }
    }
    const e = (X + 0.5 - W / 2) * mx, n = (H / 2 - (Y + 0.5)) * mz
    if (onGrid(e, n, 10, mx * 0.6)) { g = 200; r *= 0.5; b *= 0.5 }
    const i = (y * W * S + x) * 4
    png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = 255
  }
  drawRing(png, (e, n) => [W / 2 * S + (e / mx) * S, H / 2 * S - (n / mz) * S], [255, 255, 0])
  writeFileSync(resolve(OUT, 'relief.png'), PNG.sync.write(png))
}

// bands.png: height classes, a 5 m grid (black every 10), the ring in cyan
{
  const BANDS: [number, [number, number, number]][] = [[2, [60, 60, 70]], [5, [90, 90, 110]], [9, [120, 120, 160]], [13, [70, 140, 90]], [17, [150, 200, 90]], [20, [230, 220, 90]], [23.5, [240, 170, 70]], [26.5, [230, 110, 60]], [29.5, [200, 60, 60]], [31.5, [160, 40, 120]], [36, [255, 255, 255]], [45, [255, 200, 255]], [999, [120, 200, 255]]]
  const S = 4
  const png = new PNG({ width: W * S, height: H * S })
  for (let y = 0; y < H * S; y++) for (let x = 0; x < W * S; x++) {
    const e = (x / S + 0.5 - W / 2) * mx, n = (H / 2 - (y / S + 0.5)) * mz
    const h = hAt(e, n)
    let c = BANDS[BANDS.length - 1][1]
    for (const [lim, col] of BANDS) if (h < lim) { c = col; break }
    let [r, g, b] = c
    if (onGrid(e, n, 5, 0.12)) { r = onGrid(e, n, 10, 0.12) ? 0 : 255; g = r; b = r }
    const i = (y * W * S + x) * 4
    png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = 255
  }
  drawRing(png, (e, n) => [W / 2 * S + (e / mx) * S, H / 2 * S - (n / mz) * S], [0, 255, 255])
  writeFileSync(resolve(OUT, 'bands.png'), PNG.sync.write(png))
  console.log('bands: ' + BANDS.map(([lim, col]) => `<${lim} m rgb(${col.join(',')})`).join(' | '))
}

// ortho.png: the orthophoto with a 10 m grid (the axes in yellow) and the ring in red
{
  const png = ortho
  const toPx = (e: number, n: number): [number, number] => [png.width / 2 + (e / (2 * R)) * png.width, png.height / 2 - (n / (2 * R)) * png.height]
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const e = ((x + 0.5) / png.width - 0.5) * 2 * R, n = (0.5 - (y + 0.5) / png.height) * 2 * R
    const tol = (2 * R) / png.width
    if (!onGrid(e, n, 10, tol)) continue
    const axis = Math.abs(e) < tol || Math.abs(n) < tol
    const i = (y * png.width + x) * 4
    png.data[i] = axis ? 255 : 0; png.data[i + 1] = 255; png.data[i + 2] = 0
  }
  drawRing(png, toPx, [255, 40, 40])
  writeFileSync(resolve(OUT, 'ortho.png'), PNG.sync.write(png))
}
console.log(`ign-mns: ${OUT}/grid.txt, relief.png, bands.png, ortho.png`)
