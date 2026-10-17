/**
 * FOOTWAYS DOWN THE MIDDLE OF A ROAD (owner, 2026-10-17, BUGS.md #307: "one street that has a fire extinguisher and
 * people walking right down the center"). A foot way whose line runs INSIDE a carriageway — inside half its width of the
 * street's centreline — for more than `--min` metres puts the crowd (and any furniture on it) in the traffic. Lists them,
 * longest first.
 *
 *   npx tsx tools/footways-in-road.ts [city] [--min=15]
 */
import { readPackage } from './bake-files.ts'
import { Projection } from '../src/city/geo.ts'
import { unpackPoints } from '../src/city/package.ts'

const args = process.argv.slice(2)
const city = args.find((a) => !a.startsWith('--')) ?? 'san-francisco'
const MIN = Number(args.find((a) => a.startsWith('--min='))?.split('=')[1] ?? 15)
/** how near the centreline counts: `--centre=2` (metres); the default, the whole carriageway */
const CENTRE = Number(args.find((a) => a.startsWith('--centre='))?.split('=')[1] ?? 0)
const pkg = readPackage(city)
const proj = new Projection(pkg.origin)
const CELL = 50
const grid = new Map<string, { a: { x: number; z: number }; b: { x: number; z: number }; half: number; name: string }[]>()
for (const e of pkg.edges) {
  if (e.foot || e.bridge || e.tunnel || (e.layer ?? 0) !== 0 || e.width < 5) continue
  const p = unpackPoints(e.points)
  for (let i = 1; i < p.length; i++) {
    const s = { a: p[i - 1], b: p[i], half: e.width / 2 - 0.3, name: e.name ?? e.kind }
    const x0 = Math.floor(Math.min(s.a.x, s.b.x) / CELL), x1 = Math.floor(Math.max(s.a.x, s.b.x) / CELL)
    const z0 = Math.floor(Math.min(s.a.z, s.b.z) / CELL), z1 = Math.floor(Math.max(s.a.z, s.b.z) / CELL)
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) (grid.get(`${x},${z}`) ?? grid.set(`${x},${z}`, []).get(`${x},${z}`)!).push(s)
  }
}
const inRoad = (x: number, z: number): string | null => {
  for (const s of grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`) ?? []) {
    const dx = s.b.x - s.a.x, dz = s.b.z - s.a.z, L2 = dx * dx + dz * dz || 1
    const t = Math.max(0, Math.min(1, ((x - s.a.x) * dx + (z - s.a.z) * dz) / L2))
    if (Math.hypot(s.a.x + dx * t - x, s.a.z + dz * t - z) < (CENTRE > 0 ? CENTRE : s.half)) return s.name
  }
  return null
}
const hits: { id: number; kind: string; len: number; road: string; lat: number; lon: number }[] = []
for (const e of pkg.edges) {
  if (!e.foot || e.bridge || e.tunnel || (e.layer ?? 0) !== 0) continue
  const p = unpackPoints(e.points)
  let run = 0, best = 0, road = '', at = p[0]
  for (let i = 1; i < p.length; i++) {
    const L = Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z)
    for (let k = 0; k < Math.ceil(L); k++) {
      const t = k / Math.ceil(L), x = p[i - 1].x + (p[i].x - p[i - 1].x) * t, z = p[i - 1].z + (p[i].z - p[i - 1].z) * t
      const r = inRoad(x, z)
      if (r) { run += L / Math.ceil(L); if (run > best) { best = run; road = r; at = { x, z } } } else run = 0
    }
  }
  if (best >= MIN) { const ll = proj.toLatLon(at); hits.push({ id: e.id, kind: e.kind, len: best, road, lat: ll.lat, lon: ll.lon }) }
}
hits.sort((a, b) => b.len - a.len)
console.log(`${city}: ${hits.length} foot ways running ${MIN} m or more inside a carriageway`)
for (const h of hits.slice(0, 40)) console.log(`  ${h.id} ${h.kind} ${h.len.toFixed(0)} m inside ${h.road} at ${h.lat.toFixed(6)}, ${h.lon.toFixed(6)}`)
