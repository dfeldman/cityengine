/**
 * MISSING AND FLATTENED TALL BUILDINGS (the other way round from tools/tall-audit.ts, which finds the too tall) (owner, 2026-10-15: "search more generally through lidar for missing high
 * rises"). Two independent measures against the baked package:
 *
 *   lidar   DataSF's building footprints (ynuv-fyni) carry a 2010 LiDAR median height; every footprint over 25 m is
 *           looked up in the package: none of ours under it is MISSING, ours under 60 % of it is LOW.
 *   rolls   the Assessor's records built since 2008 with 7+ storeys (tools/sf-parcels.ts cache): what LiDAR could not
 *           see. Noisy — a parcel point in a courtyard reads NO BUILDING, and a few records say 900 storeys.
 *
 * A LOW or MISSING row is a candidate, not a verdict: look at it (tools/photo.ts) before writing a restyle with its
 * height (public/landmarks/san-francisco/lidar-heights.json). A building claimed by a model is drawn by the model.
 *   node --experimental-strip-types tools/missing-tall.ts           both, to stdout
 */
import { readPackage } from './bake-files.ts'
import { Projection } from '../src/city/geo.ts'
import { unpackPoints } from '../src/city/package.ts'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const pkg = readPackage('san-francisco'); const proj = new Projection(pkg.origin)
const FP = resolve(import.meta.dirname, 'cache', 'sf-footprints-tall.json')
if (!existsSync(FP)) {
  const r = await fetch('https://data.sf.gov/resource/ynuv-fyni.json?' + new URLSearchParams({ $where: 'hgt_median_m::number>25', $limit: '50000', $select: 'sf16_bldgid,hgt_median_m,peak_1st_m,shape' }))
  writeFileSync(FP, await r.text())
}
const fps = JSON.parse(readFileSync(FP, 'utf8')) as any[]
const CELL = 50
const grid = new Map<string, { ring: { x: number; z: number }[]; h: number; id: number; min: number }[]>()
let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
for (const b of pkg.buildings as any[]) {
  const ring = typeof b.ring[0] === 'object' ? b.ring : unpackPoints(b.ring)
  let a = Infinity, c = -Infinity, d = Infinity, e = -Infinity
  for (const p of ring) { a = Math.min(a, p.x); c = Math.max(c, p.x); d = Math.min(d, p.z); e = Math.max(e, p.z) }
  x0 = Math.min(x0, a); x1 = Math.max(x1, c); z0 = Math.min(z0, d); z1 = Math.max(z1, e)
  const rec = { ring, h: b.height ?? 0, id: b.id, min: b.minHeight ?? 0 }
  for (let gx = Math.floor(a / CELL); gx <= Math.floor(c / CELL); gx++) for (let gz = Math.floor(d / CELL); gz <= Math.floor(e / CELL); gz++) {
    const k = `${gx},${gz}`; const l = grid.get(k); if (l) l.push(rec); else grid.set(k, [rec])
  }
}
const inside = (r: { x: number; z: number }[], x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
  return o
}
const out: string[] = []
let n = 0, missing = 0, low = 0, outside = 0
for (const f of fps) {
  const h = Number(f.hgt_median_m), pk = Number(f.peak_1st_m)
  const ring = (f.shape.coordinates[0][0] as [number, number][]).map(([lon, lat]) => proj.toLocal({ lat, lon }))
  let cx = 0, cz = 0; for (const p of ring) { cx += p.x; cz += p.z }; cx /= ring.length; cz /= ring.length
  if (cx < x0 || cx > x1 || cz < z0 || cz > z1) { outside++; continue }
  let A = 0; for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; A += p.x * q.z - q.x * p.z }; A = Math.abs(A) / 2
  if (A < 150) continue
  n++
  const pts = [{ x: cx, z: cz }, ...ring.filter((_, i) => i % Math.max(1, Math.floor(ring.length / 10)) === 0).map((p) => ({ x: p.x * 0.6 + cx * 0.4, z: p.z * 0.6 + cz * 0.4 }))]
  let best = 0, cov = 0
  for (const p of pts) {
    let m = 0
    for (const b of grid.get(`${Math.floor(p.x / CELL)},${Math.floor(p.z / CELL)}`) ?? []) if (inside(b.ring, p.x, p.z)) m = Math.max(m, b.h)
    if (m > 0) cov++
    best = Math.max(best, m)
  }
  const ll = proj.toLatLon({ x: cx, z: cz })
  if (cov === 0) { missing++; out.push(`MISSING lidar ${h.toFixed(0)} m (peak ${pk.toFixed(0)}) A ${A.toFixed(0)} m2  ${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)}  ${f.sf16_bldgid}`) }
  else if (best < h * 0.6) { low++; out.push(`LOW     lidar ${h.toFixed(0)} m, ours ${best.toFixed(0)} m  A ${A.toFixed(0)} m2  ${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)}  ${f.sf16_bldgid}`) }
}
console.log(out.sort().join('\n'))
console.log(`${n} tall footprints checked (${outside} outside the bake): ${missing} missing, ${low} far too low`)

// ---- the rolls: built since the LiDAR flew
const rolls = JSON.parse(readFileSync(resolve(import.meta.dirname, 'cache', 'sf-rolls-2025-37.7526_-122.5234_37.8765_-122.3608.json'), 'utf8')) as any[]
// one row per parcel point: the most storeys any record there gives, and how many records (units)
const pts = new Map<string, { lon: number; lat: number; year: number; st: number; n: number; use: string }>()
for (const r of rolls) {
  if (!(r[2] >= 2008)) continue
  const k = `${r[0].toFixed(6)},${r[1].toFixed(6)}`
  const p = pts.get(k) ?? { lon: r[0], lat: r[1], year: r[2], st: 0, n: 0, use: r[5] }
  p.st = Math.max(p.st, r[3]); p.n++; pts.set(k, p); 
}
const rows: string[] = []
for (const p of pts.values()) {
  if (p.st < 7) continue
  const q = proj.toLocal({ lat: p.lat, lon: p.lon })
  let m = 0, id = 0
  for (const b of grid.get(`${Math.floor(q.x / CELL)},${Math.floor(q.z / CELL)}`) ?? []) if (inside(b.ring, q.x, q.z) && b.h > m) { m = b.h; id = b.id }
  const want = p.st * 3.2
  if (m < want * 0.6) rows.push(`${m === 0 ? 'NO BUILDING' : 'LOW'}  ${p.year} ${p.use} ${p.st} storeys (~${want.toFixed(0)} m), ours ${m.toFixed(0)} m way/${id}  ${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}  (${p.n} records)`)
}
console.log(rows.sort().join('\n'))
