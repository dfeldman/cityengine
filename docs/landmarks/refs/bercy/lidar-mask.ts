import { readFileSync } from 'node:fs'
const LAT = 48.83999, LON = 2.376945, HALF = 260
const dLat = HALF / 111320, dLon = HALF / (111320 * Math.cos((LAT * Math.PI) / 180))
const [south, north, west, east] = [LAT - dLat, LAT + dLat, LON - dLon, LON + dLon]
function readFloatTiff(buf: Buffer) {
  const le = buf.toString('latin1', 0, 2) === 'II'
  const u16 = (o: number) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o)), u32 = (o: number) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o))
  const ifd = u32(4), n = u16(ifd); const tags = new Map<number, { type: number; count: number; at: number }>()
  for (let i = 0; i < n; i++) { const e = ifd + 2 + i * 12; tags.set(u16(e), { type: u16(e + 2), count: u32(e + 4), at: e + 8 }) }
  const value = (tag: number): number[] => { const t = tags.get(tag); if (!t) return []; const size = t.type === 3 ? 2 : 4; const base = t.count * size > 4 ? u32(t.at) : t.at; return Array.from({ length: t.count }, (_, i) => (t.type === 3 ? u16(base + i * 2) : u32(base + i * 4))) }
  const w = value(256)[0], h = value(257)[0]; const offsets = value(273), counts = value(279); const data = new Float32Array(w * h); let k = 0
  for (let s = 0; s < offsets.length; s++) for (let o = offsets[s]; o < offsets[s] + counts[s] && k < data.length; o += 4) data[k++] = le ? buf.readFloatLE(o) : buf.readFloatBE(o)
  return { w, h, data }
}
const mns = readFloatTiff(readFileSync('refs/mns.tif'))
const mlat = 111320, mlon = 111320 * Math.cos((LAT * Math.PI) / 180)
const bu = (50.5 * Math.PI) / 180, bv = (320.5 * Math.PI) / 180
const at = (u: number, v: number) => { const e = u * Math.sin(bu) + v * Math.sin(bv), n = u * Math.cos(bu) + v * Math.cos(bv); const lat = LAT + n / mlat, lon = LON + e / mlon; const x = Math.round(((lon - west) / (east - west)) * mns.w), y = Math.round(((north - lat) / (north - south)) * mns.h); return mns.data[y * mns.w + x] }
const ch = (h: number) => (h < 40 ? ' ' : h < 55 ? '.' : h < 66 ? '-' : h < 70 ? '+' : h < 74 ? '#' : '@')
for (const [u0, u1] of [[-205, -105], [95, 185]]) {
  console.log(`u ${u0}..${u1} step 1; v +12 (top) .. -20 (bottom); ' '<40 '.'<55 '-'<66 '+'<70 '#'<74 '@'>=74 NGF`)
  let hdr = '     '; for (let u = u0; u <= u1; u++) hdr += (u % 10 === 0 ? '|' : ' '); console.log(hdr)
  for (let v = 12; v >= -20; v--) { let s = String(v).padStart(4) + ' '; for (let u = u0; u <= u1; u++) s += ch(at(u, v)); console.log(s) }
}
