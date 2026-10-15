/**
 * Where the poles stand (owner, 2026-10-14: street-name poles "a short distance away from the sidewalk", Muni stops
 * "in the lane"): every OSM stop sign and bus stop, placed the way render/city.ts places it — the node, pushed 5 m off
 * the carriageway if it is in one, then onto the nearest pavement (city/carriageways.ts `toPavement`) — and counted:
 * on a pavement, in a road, or off any pavement (a street with none). `old` is the fixed 5 m push it replaced.
 *   node tools/kerb-audit.ts
 */
import { readPackage } from './bake-files.ts'
import { Carriageways } from '../src/city/carriageways.ts'
const pkg = readPackage('san-francisco') as any
const edges = pkg.edges.filter((e: any) => !e.bridge && !e.tunnel)
const cw = new Carriageways(edges)
const roads = edges.filter((e: any) => !e.foot)
// a coarse index for the bearing
const idx = new Map<string, any[]>()
for (const e of roads) for (let i = 0; i < e.points.length; i += 2) { const k = `${Math.floor(e.points[i] / 50)},${Math.floor(e.points[i + 1] / 50)}`; (idx.get(k) ?? idx.set(k, []).get(k)!).push(e) }
const bearing = (x: number, z: number): number => {
  let best = Infinity, h = 0
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const e of idx.get(`${Math.floor(x / 50) + dx},${Math.floor(z / 50) + dz}`) ?? []) {
    for (let i = 2; i < e.points.length; i += 2) { const ax = e.points[i - 2], az = e.points[i - 1], sx = e.points[i] - ax, sz = e.points[i + 1] - az, l2 = sx * sx + sz * sz || 1
      const t = Math.max(0, Math.min(1, ((x - ax) * sx + (z - az) * sz) / l2)); const d = Math.hypot(x - ax - sx * t, z - az - sz * t); if (d < best) { best = d; h = Math.atan2(sx, sz) } } }
  return h
}
const state = (x: number, z: number): 'road' | 'pavement' | 'off' => {
  const near = cw.near(x, z)
  if (near.some((n) => n.d < n.s.half + 0.3)) return 'road'
  if (near.some((n) => n.s.walk > 0.5 && n.d >= n.s.half + 0.3 && n.d <= n.s.half + n.s.walk + 0.05)) return 'pavement'
  return 'off'
}
const tally: Record<string, Record<string, number>> = {}
const bad: string[] = []
for (const f of pkg.furniture) {
  if (f.kind !== 'busstop' && f.kind !== 'stop') continue
  const h = bearing(f.x, f.z)
  const old = state(f.x + Math.cos(h) * 5, f.z - Math.sin(h) * 5)
  let px = f.x, pz = f.z
  if (cw.inside(px, pz, 0.3)) { px += Math.cos(h) * 5; pz -= Math.sin(h) * 5 }
  ;({ x: px, z: pz } = cw.toPavement(px, pz))
  const now = state(px, pz)
  const k = `${f.kind}`
  tally[k] ??= {}
  tally[k][`old ${old}`] = (tally[k][`old ${old}`] ?? 0) + 1
  tally[k][`new ${now}`] = (tally[k][`new ${now}`] ?? 0) + 1
  if (now === 'road' && bad.length < 8) bad.push(`${f.kind} ${f.x.toFixed(0)},${f.z.toFixed(0)}`)
}
console.log(JSON.stringify(tally, null, 1))
console.log('still in road:', bad.join(' | '))
const pick: string[] = []
for (const f of pkg.furniture) {
  if (f.kind !== 'busstop' || Math.abs(f.x) > 900 || Math.abs(f.z) > 900) continue
  const h = bearing(f.x, f.z)
  if (state(f.x + Math.cos(h) * 5, f.z - Math.sin(h) * 5) !== 'road') continue
  let px = f.x, pz = f.z
  if (cw.inside(px, pz, 0.3)) { px += Math.cos(h) * 5; pz -= Math.sin(h) * 5 }
  ;({ x: px, z: pz } = cw.toPavement(px, pz))
  pick.push(JSON.stringify({ node: [f.x, f.z].map((v: number) => +v.toFixed(1)), at: [px, pz].map((v) => +v.toFixed(1)), h: +h.toFixed(2) }))
}
console.log(pick.slice(0, 4).join('\n'))
