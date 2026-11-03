/**
 * IGN LiDAR HD surface (MNS) minus ground (MNT) over the Bercy ministry, resampled into the builder's local frame:
 * u along the slab (+u toward Rue de Bercy, bearing 50.5), v across it (+v = +z, bearing 320.5), origin at the entry.
 * Prints a text grid (metres above the quai) and writes a greyscale PPM of the rotated frame at 0.5 m/px.
 *   node --experimental-strip-types lidar.ts <outdir>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const WMS = 'https://data.geopf.fr/wms-r/wms'
const MNS = 'IGNF_LIDAR-HD_MNS_ELEVATION.ELEVATIONGRIDCOVERAGE.LAMB93'
const MNT = 'IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.LAMB93'
const out = process.argv[2]
mkdirSync(out, { recursive: true })

const LAT = 48.83999, LON = 2.376945
const HALF = 260 // m
const PX = 1040 // 0.5 m
const dLat = HALF / 111320
const dLon = HALF / (111320 * Math.cos((LAT * Math.PI) / 180))
const [south, north, west, east] = [LAT - dLat, LAT + dLat, LON - dLon, LON + dLon]

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
  if (value(259)[0] !== 1 || value(258)[0] !== 32) throw new Error('expected an uncompressed float32 TIFF')
  const offsets = value(273), counts = value(279)
  const data = new Float32Array(w * h)
  let k = 0
  for (let s = 0; s < offsets.length; s++) {
    for (let o = offsets[s]; o < offsets[s] + counts[s] && k < data.length; o += 4) data[k++] = le ? buf.readFloatLE(o) : buf.readFloatBE(o)
  }
  return { w, h, data }
}

async function layer(name: string, file: string): Promise<{ w: number; h: number; data: Float32Array }> {
  const f = resolve(out, file)
  if (!existsSync(f)) {
    const q = new URLSearchParams({
      SERVICE: 'WMS', VERSION: '1.3.0', REQUEST: 'GetMap', LAYERS: name, STYLES: '', CRS: 'EPSG:4326',
      BBOX: `${south},${west},${north},${east}`, WIDTH: String(PX), HEIGHT: String(PX), FORMAT: 'image/geotiff',
    })
    const r = await fetch(`${WMS}?${q}`)
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('tiff')) throw new Error(`${name}: ${r.status} ${r.headers.get('content-type')} ${(await r.text()).slice(0, 300)}`)
    writeFileSync(f, Buffer.from(await r.arrayBuffer()))
  }
  return readFloatTiff(readFileSync(f))
}

const mns = await layer(MNS, 'mns.tif')
const mnt = await layer(MNT, 'mnt.tif')
console.log(`grids ${mns.w}x${mns.h}, ${mnt.w}x${mnt.h}`)

// sample in metres east/north of the origin
const mPerDegLat = 111320
const mPerDegLon = 111320 * Math.cos((LAT * Math.PI) / 180)
function at(g: { w: number; h: number; data: Float32Array }, e: number, n: number): number {
  const lat = LAT + n / mPerDegLat, lon = LON + e / mPerDegLon
  const px = ((lon - west) / (east - west)) * g.w
  const py = ((north - lat) / (north - south)) * g.h
  const x = Math.min(g.w - 1, Math.max(0, Math.round(px))), y = Math.min(g.h - 1, Math.max(0, Math.round(py)))
  return g.data[y * g.w + x]
}
// ground: the MNT median over the frame
const vals = Array.from(mnt.data).filter((v) => v > -1000 && v < 1000).sort((a, b) => a - b)
const ground = vals[Math.floor(vals.length / 2)]
console.log(`MNT median ${ground.toFixed(1)} NGF; MNT at origin ${at(mnt, 0, 0).toFixed(1)}; MNS at origin ${at(mns, 0, 0).toFixed(1)}`)

// local frame: +u bearing 50.5, +v bearing 320.5
const bu = (50.5 * Math.PI) / 180, bv = (320.5 * Math.PI) / 180
const en = (u: number, v: number): [number, number] => [u * Math.sin(bu) + v * Math.sin(bv), u * Math.cos(bu) + v * Math.cos(bv)]
const h = (u: number, v: number): number => {
  const [e, n] = en(u, v)
  const s = at(mns, e, n), g = at(mnt, e, n)
  return s - (Number.isFinite(g) && g > -1000 ? ground : ground)
}
// text grid: u −230…+210 step 5, v −40…+40 step 2.5
let txt = 'v\\u   ' + Array.from({ length: 89 }, (_, i) => String(-230 + i * 5).padStart(4)).join('') + '\n'
for (let v = 40; v >= -40; v -= 2.5) {
  let row = String(v).padStart(5) + ' '
  for (let i = 0; i < 89; i++) {
    const u = -230 + i * 5
    const z = h(u, v)
    row += (Number.isFinite(z) && z > -50 ? String(Math.round(z)) : '.').padStart(4)
  }
  txt += row + '\n'
}
writeFileSync(resolve(out, 'grid.txt'), txt)
console.log(txt)
// ground along the axis (MNT, NGF) to see the quai and the river bed
let gl = 'MNT NGF along v=0: '
for (let u = -230; u <= 210; u += 10) { const [e, n] = en(u, 0); gl += `${u}:${at(mnt, e, n).toFixed(1)} ` }
console.log(gl)
let gl2 = 'MNT NGF along v=+40: '
for (let u = -230; u <= 210; u += 10) { const [e, n] = en(u, 40); gl2 += `${u}:${at(mnt, e, n).toFixed(1)} ` }
console.log(gl2)
let gl3 = 'MNT NGF along v=-40: '
for (let u = -230; u <= 210; u += 10) { const [e, n] = en(u, -40); gl3 += `${u}:${at(mnt, e, n).toFixed(1)} ` }
console.log(gl3)

// rotated-frame image, 0.5 m/px: u −240…220, v −80…80 (+v up)
const W = 920, H = 320
const img = Buffer.alloc(W * H * 3)
for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
  const u = -240 + px * 0.5, v = 80 - py * 0.5
  const z = h(u, v)
  // shade: height 0..60 → 40..255, with 5 m contour darkening
  let g = Number.isFinite(z) ? Math.max(0, Math.min(255, 40 + (z / 60) * 215)) : 0
  const zr = h(u + 0.5, v), zd = h(u, v - 0.5)
  const steep = Math.abs(zr - z) + Math.abs(zd - z)
  if (steep > 3) g *= 0.35
  const frac = ((z % 5) + 5) % 5
  if (frac < 0.3 && steep > 0.2) g *= 0.7
  const i = (py * W + px) * 3
  img[i] = img[i + 1] = img[i + 2] = g
  // grid every 50 m in u, 20 m in v, in red
  if (Math.abs(((u % 50) + 50) % 50) < 0.26 || Math.abs(((v % 20) + 20) % 20) < 0.26) { img[i] = 200; img[i + 1] = 40; img[i + 2] = 40 }
}
writeFileSync(resolve(out, 'rot.ppm'), Buffer.concat([Buffer.from(`P6 ${W} ${H} 255\n`), img]))
console.log('wrote rot.ppm')
