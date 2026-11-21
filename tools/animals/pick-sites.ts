/**
 * Where to put a free-roaming herd (render/zoo.ts patch()), picked from the baked package — no browser:
 *   npx tsx tools/animals/pick-sites.ts shore  <lat,lon in the lake> [K=2] [apart=150]
 *     K points on a drawn lake's edge within 12 m of a footpath or cycleway (swans, geese)
 *   npx tsx tools/animals/pick-sites.ts forest <lat,lon> [K=2] [apart=150] [radius=800]
 *     K points 8 m off a path inside a `wood` area, dry, 60 m and more from any road (rabbits; deer, boar, foxes…)
 *   … park <lat,lon> … the same without the wood test
 * Random within the rules: run again for other picks. paris-centre only (CITY=… for another package).
 */
import { readPackage } from '../bake-files.ts'
import { unpackPoints, wholeWater } from '../../src/city/package.ts'
import { Projection } from '../../src/city/geo.ts'
import { waterLookup } from '../../src/render/watermask.ts'
const pkg = readPackage(process.env.CITY ?? 'paris-centre') as any, pr = new Projection(pkg.origin)
const bodies = wholeWater(pkg).map((a: any) => { const ring = unpackPoints(a.ring); let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
  return { ring, holes: (a.holes ?? []).map(unpackPoints), x0, x1, z0, z1, level: 0 } })
const look = waterLookup(bodies), wet = (x: number, z: number) => look(x, z) !== null
const PATHS = new Set(['footway', 'path', 'cycleway', 'track', 'pedestrian', 'bridleway'])
const ROADS = new Set(['primary', 'secondary', 'tertiary', 'trunk', 'motorway', 'residential', 'unclassified', 'service'])
const edges = pkg.edges.map((e: any) => ({ kind: e.kind, p: unpackPoints(e.points) }))
const woods = pkg.areas.filter((a: any) => a.kind === 'wood').map((a: any) => unpackPoints(a.ring))
const inside = (p: any, r: any[]) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i].z > p.z) !== (r[j].z > p.z) && p.x < (r[j].x - r[i].x) * (p.z - r[i].z) / (r[j].z - r[i].z) + r[i].x) c = !c; return c }
const segd = (p: any, a: any, b: any) => { const dx = b.x - a.x, dz = b.z - a.z, l = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l)); return Math.hypot(a.x + dx * t - p.x, a.z + dz * t - p.z) }
const near = (p: any, set: Set<string>, R: number, es: any[]) => { let d = R; for (const e of es) if (set.has(e.kind)) for (let i = 1; i < e.p.length; i++) d = Math.min(d, segd(p, e.p[i - 1], e.p[i])); return d }
const local = (e: any[], c: any, R: number) => e.filter((x) => x.p.some((q: any) => Math.abs(q.x - c.x) < R && Math.abs(q.z - c.z) < R))
const ll = (p: any) => { const q = pr.toLatLon(p); return `[${q.lat.toFixed(6)}, ${q.lon.toFixed(6)}]` }
const mode = process.argv[2], [lat, lon] = process.argv[3].split(',').map(Number), K = Number(process.argv[4] ?? 2), SEP = Number(process.argv[5] ?? 150)
const c = pr.toLocal({ lat, lon })
const picks: any[] = []
if (mode === 'shore') {
  // the drawn water body containing the point
  const b = bodies.find((w: any) => inside(c, w.ring)); if (!b) throw new Error('not in drawn water')
  const es = local(edges, c, Math.max(b.x1 - b.x0, b.z1 - b.z0))
  const cand: any[] = []
  for (let i = 0; i < b.ring.length; i++) { const a = b.ring[i], q = b.ring[(i + 1) % b.ring.length], n = Math.ceil(Math.hypot(q.x - a.x, q.z - a.z) / 8)
    for (let k = 0; k < n; k++) { const p = { x: a.x + (q.x - a.x) * k / n, z: a.z + (q.z - a.z) * k / n }; const d = near(p, PATHS, 30, es); if (d < 12) cand.push({ p, d: d + Math.random() * 6 }) } }
  cand.sort((u, v) => u.d - v.d)
  for (const q of cand) if (picks.length < K && picks.every((s) => Math.hypot(s.p.x - q.p.x, s.p.z - q.p.z) > SEP)) picks.push(q)
} else {
  const R = Number(process.argv[6] ?? 800), es = local(edges, c, R)
  const cand: any[] = []
  for (const e of es) if (PATHS.has(e.kind)) for (let i = 1; i < e.p.length; i++) { const a = e.p[i - 1], b = e.p[i], L = Math.hypot(b.x - a.x, b.z - a.z)
    for (let s = 0; s < L; s += 40) { const t = s / L, nx = -(b.z - a.z) / L, nz = (b.x - a.x) / L, p = { x: a.x + (b.x - a.x) * t + nx * 8, z: a.z + (b.z - a.z) * t + nz * 8 }
      if (Math.hypot(p.x - c.x, p.z - c.z) > R || wet(p.x, p.z) || (mode === 'forest' && !woods.some((w: any) => inside(p, w)))) continue
      const road = near(p, ROADS, 120, es); if (road < 60) continue
      cand.push({ p, d: -road + Math.random() * 40 }) } }
  cand.sort((u, v) => u.d - v.d)
  for (const q of cand) if (picks.length < K && picks.every((s) => Math.hypot(s.p.x - q.p.x, s.p.z - q.p.z) > SEP)) picks.push(q)
}
for (const q of picks) console.log(ll(q.p), q.d.toFixed(1))
