/**
 * MISSING AND FLATTENED TALL BUILDINGS — the other way round from tools/tall-audit.ts, which finds the too tall
 * (owner, 2026-10-15: "search more generally through lidar for missing high rises"). Two independent measures
 * against the baked package, each building at the height the game draws it — a landmark entry's own `height` where
 * one claims it (a restyle or a model; a model with no height is taken as right):
 *
 *   lidar   DataSF's building footprints (ynuv-fyni) carry a 2010 LiDAR median height. Every footprint over --min
 *           metres (default 20) is looked up: none of ours under it is MISSING, ours under 60 % of it and at least
 *           10 m short is LOW.
 *   rolls   the Assessor's records built since 2005 with 6+ storeys (tools/sf-parcels.ts cache): what the LiDAR
 *           could not see. The tallest of ours within 12 m of the parcel point, since a point often falls in a
 *           courtyard or on a podium beside its tower. Records over 70 storeys are junk and skipped.
 *
 * A row is a candidate, not a verdict: look at it (tools/photo.ts) before writing a restyle with its height
 * (public/landmarks/san-francisco/lidar-heights.json). Demolished since 2010 reads MISSING too.
 *   node --experimental-strip-types tools/missing-tall.ts [--min=20]
 */
import { readPackage } from './bake-files.ts'
import { Projection } from '../src/city/geo.ts'
import { unpackPoints } from '../src/city/package.ts'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MIN = Number(process.argv.find((a) => a.startsWith('--min='))?.slice(6) ?? 20)
const pkg = readPackage('san-francisco'); const proj = new Projection(pkg.origin)

const FP = resolve(import.meta.dirname, 'cache', `sf-footprints-over-${MIN}.json`)
if (!existsSync(FP)) {
  const r = await fetch('https://data.sf.gov/resource/ynuv-fyni.json?' + new URLSearchParams({ $where: `hgt_median_m::number>${MIN}`, $limit: '50000', $select: 'sf16_bldgid,hgt_median_m,peak_1st_m,shape' }))
  if (!r.ok) throw new Error(`DataSF ${r.status}`)
  writeFileSync(FP, await r.text())
}
const fps = JSON.parse(readFileSync(FP, 'utf8')) as any[]

// what the landmark manifests say a building's height is (packed ids: way N → N, relation N → 2N+1)
const claimed = new Map<number, number>()
const dir = resolve(import.meta.dirname, '..', 'public', 'landmarks', 'san-francisco')
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.json')) continue
  let list: any[]
  try { list = JSON.parse(readFileSync(resolve(dir, f), 'utf8')) } catch { continue }
  if (!Array.isArray(list)) continue
  for (const e of list) {
    for (const ref of e.osm ? (Array.isArray(e.osm) ? e.osm : [e.osm]) : []) {
      const [kind, n] = String(ref).split('/')
      const id = kind === 'relation' ? Number(n) * 2 + 1 : Number(n)
      claimed.set(id, Math.max(claimed.get(id) ?? 0, e.height ?? (e.restyle ? 0 : Infinity)))
    }
  }
}

const CELL = 50
type B = { ring: { x: number; z: number }[]; h: number; id: number }
const grid = new Map<string, B[]>()
let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
for (const b of pkg.buildings as any[]) {
  const ring = typeof b.ring[0] === 'object' ? b.ring : unpackPoints(b.ring)
  let a = Infinity, c = -Infinity, d = Infinity, e = -Infinity
  for (const p of ring) { a = Math.min(a, p.x); c = Math.max(c, p.x); d = Math.min(d, p.z); e = Math.max(e, p.z) }
  x0 = Math.min(x0, a); x1 = Math.max(x1, c); z0 = Math.min(z0, d); z1 = Math.max(z1, e)
  const own = claimed.get(b.id)
  const rec = { ring, h: own ? Math.max(own, b.height ?? 0) : (b.height ?? 0), id: b.id }
  for (let gx = Math.floor(a / CELL); gx <= Math.floor(c / CELL); gx++) for (let gz = Math.floor(d / CELL); gz <= Math.floor(e / CELL); gz++) {
    const k = `${gx},${gz}`; const l = grid.get(k); if (l) l.push(rec); else grid.set(k, [rec])
  }
}
const inside = (r: { x: number; z: number }[], x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
  return o
}
const edgeDist = (r: { x: number; z: number }[], x: number, z: number): number => {
  if (inside(r, x, z)) return 0
  let best = Infinity
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const ax = r[j].x, az = r[j].z, dx = r[i].x - ax, dz = r[i].z - az
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)))
    best = Math.min(best, Math.hypot(ax + dx * t - x, az + dz * t - z))
  }
  return best
}
/** the tallest of ours within `r` metres of a point, and its id */
const tallestNear = (x: number, z: number, r: number): { h: number; id: number } => {
  let h = 0, id = 0
  const seen = new Set<B>()
  for (let gx = Math.floor((x - r) / CELL); gx <= Math.floor((x + r) / CELL); gx++) for (let gz = Math.floor((z - r) / CELL); gz <= Math.floor((z + r) / CELL); gz++) {
    for (const b of grid.get(`${gx},${gz}`) ?? []) {
      if (seen.has(b)) continue
      seen.add(b)
      if (b.h > h && edgeDist(b.ring, x, z) <= r) { h = b.h; id = b.id }
    }
  }
  return { h, id }
}
// (a package id is a way's own, or a relation's packed 2N+1: the two cannot be told apart from the number, so it is
// printed as it is — an odd one may be either; ask OSM)
const ref = (id: number): string => `#${id}`

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
  let best = 0, bestId = 0, cov = 0
  for (const p of pts) {
    for (const b of grid.get(`${Math.floor(p.x / CELL)},${Math.floor(p.z / CELL)}`) ?? []) {
      if (!inside(b.ring, p.x, p.z)) continue
      cov++
      if (b.h > best) { best = b.h; bestId = b.id }
    }
  }
  const ll = proj.toLatLon({ x: cx, z: cz })
  const at = `${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)}`
  if (cov === 0) { missing++; out.push(`lidar MISSING  ${h.toFixed(0)} m (peak ${pk.toFixed(0)})  A ${A.toFixed(0)} m2  ${at}  fp ${f.sf16_bldgid}`) }
  else if (best < h * 0.6 && h - best >= 10) { low++; out.push(`lidar LOW      ${h.toFixed(0)} m, ours ${best.toFixed(0)} m ${ref(bestId)}  A ${A.toFixed(0)} m2  ${at}  fp ${f.sf16_bldgid}`) }
}
console.log(out.sort().join('\n'))
console.log(`${n} footprints over ${MIN} m checked (${outside} outside the bake): ${missing} missing, ${low} far too low\n`)

// ---- the rolls: built since the LiDAR flew
const rolls = JSON.parse(readFileSync(resolve(import.meta.dirname, 'cache', 'sf-rolls-2025-37.7526_-122.5234_37.8765_-122.3608.json'), 'utf8')) as any[]
// one row per parcel point: the most storeys any record there gives, and how many records (units)
const pts = new Map<string, { lon: number; lat: number; year: number; st: number; n: number; use: string }>()
for (const r of rolls) {
  if (!(r[2] >= 2005) || r[3] > 70) continue
  const k = `${r[0].toFixed(6)},${r[1].toFixed(6)}`
  const p = pts.get(k) ?? { lon: r[0], lat: r[1], year: r[2], st: 0, n: 0, use: r[5] }
  p.st = Math.max(p.st, r[3]); p.n++; pts.set(k, p)
}
const rows: string[] = []
for (const p of pts.values()) {
  if (p.st < 6) continue
  const q = proj.toLocal({ lat: p.lat, lon: p.lon })
  const { h, id } = tallestNear(q.x, q.z, 12)
  const want = p.st * 3.2
  if (h < want * 0.6) rows.push(`rolls ${h === 0 ? 'NOTHING' : 'LOW    '}  ${p.year} ${p.use} ${p.st} storeys (~${want.toFixed(0)} m), ours ${h.toFixed(0)} m ${id ? ref(id) : ''}  ${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}  (${p.n} records)`)
}
console.log(rows.sort().join('\n'))
console.log(`${rows.length} Assessor records of 6+ storeys since 2005 with nothing near as tall within 12 m`)
