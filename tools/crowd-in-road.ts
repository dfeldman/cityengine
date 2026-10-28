/**
 * PEOPLE WALKING IN THE ROAD (owner, 2026-10-27: "there are still far too many NPCs walking in the middle of the street
 * … busy arterials don't normally have dozens of people walking in them"). Runs the crowd (src/sim/crowd.ts) headless on
 * a REAL city's streets round a few places and counts the walkers and runners (not the cyclists, who belong there)
 * standing inside a drawn carriageway — within half its width, less a kerb, of a road's centreline — by the edge they
 * are walking and why.
 *
 *   [STAGED=1] npx vite-node tools/crowd-in-road.ts -- [city=san-francisco] [lat,lon …]
 *
 * STAGED=1 makes the crowd first on a tile a kilometre off and loads the place's tiles after, as the game's graph grows;
 * without it everything is loaded before the crowd starts, which hid the stale road grid (2026-10-27: 7% in the road
 * loaded whole, 15% staged). Walkers "crossing at a junction" are on the pavement's line across the other street.
 */
import { readPackage, readV2, readV2Tile } from './bake-files.ts'
import { Projection, type Point } from '../src/city/geo.ts'
import { Terrain } from '../src/city/terrain.ts'
import { mapEdges } from '../src/city/ridefile.ts'
import { addEdges, type CityGraph, type Edge } from '../src/city/graph.ts'
import { onSurface } from '../src/city/package.ts'
import { Crowd } from '../src/sim/crowd.ts'

const args = process.argv.slice(2).filter((a) => a !== '--')
const city = args.find((a) => !a.includes(',')) ?? 'san-francisco'
const PLACES: Record<string, [number, number]> = {
  'Market & 5th': [37.7837, -122.4075],
  'Geary & Masonic': [37.7826, -122.4475],
  '19th Ave & Irving': [37.7639, -122.4766],
  'Van Ness & Geary': [37.7856, -122.4214],
  'Lincoln & 9th Ave': [37.7660, -122.4664],
  'Mission & 16th': [37.7650, -122.4194],
}
const asked = args.filter((a) => a.includes(',')).map((a) => a.split(',').map(Number) as [number, number])
const places = asked.length ? Object.fromEntries(asked.map((p) => [p.join(','), p])) : PLACES
const pkg = readPackage(city)
const proj = new Projection(pkg.origin)
const index = readV2(city, false).index
const terrain = new Terrain(null)
const CELL = 50
let total = 0, inRoadAll = 0
const why = new Map<string, number>()
const byEdge = new Map<number, { n: number; e: Edge; road: string; med: number; sides: string }>()

for (const [label, [lat, lon]] of Object.entries(places)) {
  const at = proj.toLocal({ lat, lon })
  const graph: CityGraph = { nodes: new Map(), edges: new Map() }
  /*
   * STAGED=1: as the game does it — the graph grows tile by tile as the rider moves, and the crowd is made (and first
   * asked about streets) while only the tiles round where the ride began are in. Here: one far tile first, the rest after.
   */
  const load = (near: (d: number) => boolean): void => {
    for (const t of index.tiles) {
      if (!near(Math.hypot((t.tx + 0.5) * 200 - at.x, (t.tz + 0.5) * 200 - at.z))) continue
      const tile = readV2Tile(city, t.tx, t.tz)
      if (!tile) continue
      addEdges(graph, mapEdges(tile.edges.filter((x) => onSurface(x) && !graph.edges.has(x.id)), terrain))
    }
  }
  const staged = process.env.STAGED === '1'
  let crowd: Crowd
  if (staged) {
    // a tile a kilometre off, where the ride began; the crowd is asked about its streets first
    const t0 = index.tiles.find((t) => Math.abs(Math.hypot((t.tx + 0.5) * 200 - at.x, (t.tz + 0.5) * 200 - at.z) - 1100) < 100)!
    const t = readV2Tile(city, t0.tx, t0.tz)!
    addEdges(graph, mapEdges(t.edges.filter((x) => onSurface(x)), terrain))
    crowd = new Crowd(graph, 'busy')
    const start = { x: (t0.tx + 0.5) * 200, z: (t0.tz + 0.5) * 200 }
    for (let k = 0; k < 5; k++) crowd.update(0.1, start, [...graph.edges.values()])
  }
  load((d) => d <= 700)
  crowd ??= new Crowd(graph, 'busy')
  const edges = [...graph.edges.values()]
  // the drawn carriageways, by 50 m cell
  const grid = new Map<string, { a: Point; b: Point; half: number; e: Edge }[]>()
  for (const e of edges) {
    if (e.foot || e.raised || e.width < 2.8) continue
    const p = e.points
    for (let i = 1; i < p.length; i++) {
      const s = { a: p[i - 1], b: p[i], half: e.width / 2 - 0.3, e }
      const x0 = Math.floor((Math.min(s.a.x, s.b.x) - 10) / CELL), x1 = Math.floor((Math.max(s.a.x, s.b.x) + 10) / CELL)
      const z0 = Math.floor((Math.min(s.a.z, s.b.z) - 10) / CELL), z1 = Math.floor((Math.max(s.a.z, s.b.z) + 10) / CELL)
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) (grid.get(`${x},${z}`) ?? grid.set(`${x},${z}`, []).get(`${x},${z}`)!).push(s)
    }
  }
  const inRoad = (q: Point): Edge | null => {
    for (const s of grid.get(`${Math.floor(q.x / CELL)},${Math.floor(q.z / CELL)}`) ?? []) {
      const dx = s.b.x - s.a.x, dz = s.b.z - s.a.z, L2 = dx * dx + dz * dz || 1
      const t = Math.max(0, Math.min(1, ((q.x - s.a.x) * dx + (q.z - s.a.z) * dz) / L2))
      if (Math.hypot(s.a.x + dx * t - q.x, s.a.z + dz * t - q.z) < s.half) return s.e
    }
    return null
  }
  const near = edges.filter((e) => Math.hypot(e.points[0].x - at.x, e.points[0].z - at.z) < 260)
  let n = 0, bad = 0
  const dt = 0.1
  for (let step = 0; step < 1200; step++) {
    crowd.update(dt, at, near)
    if (step % 50 !== 49) continue
    for (const w of crowd.all) {
      if (w.kind === 'cycle' || distance2(w.at, at) > 160) continue
      n++
      const r = inRoad(w.at)
      if (!r) continue
      bad++
      const e = graph.edges.get(w.edgeId)!
      // at a junction (crossing the other street where the pavement meets it) or out along the block
      const atJunction = [r.a, r.b, e.a, e.b].some((id) => { const nd = graph.nodes.get(id); return !!nd && distance2(nd.at, w.at) < r.width / 2 + e.width / 2 + e.walk + 2 && nd.edges.includes(r.id) && nd.edges.includes(e.id) })
      const med = e.foot ? 0 : (crowd as unknown as { median(e: Edge): number }).median(e)
      const k = `${e.foot ? 'footway' : 'street'}${atJunction ? ' crossing at a junction' : ' MID-BLOCK'}${e.foot ? '' : ` median=${med} side=${w.side}`}`
      why.set(k, (why.get(k) ?? 0) + 1)
      if (atJunction) continue
      const b = byEdge.get(e.id) ?? { n: 0, e, road: `${r.id} ${r.name ?? r.kind ?? '?'} w=${r.width}`, med, sides: '' }
      b.n++
      if (b.sides.length < 12) b.sides += w.side > 0 ? '+' : '-'
      byEdge.set(e.id, b)
    }
  }
  console.log(`${label}: ${bad}/${n} walker-samples in a carriageway (${(100 * bad / Math.max(1, n)).toFixed(1)}%)`)
  total += n
  inRoadAll += bad
}
console.log(`\nall: ${inRoadAll}/${total} (${(100 * inRoadAll / Math.max(1, total)).toFixed(1)}%)`)
for (const [k, v] of [...why].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`)
console.log('\nworst edges:')
for (const b of [...byEdge.values()].sort((a, b) => b.n - a.n).slice(0, 25)) {
  const e = b.e
  const m = e.points[Math.floor(e.points.length / 2)]
  const ll = proj.toLatLon(m)
  console.log(`  ${b.n}\tedge ${e.id} ${e.foot ? 'foot' : e.kind} "${e.name ?? ''}" w=${e.width} walk=${e.walk} len=${e.length.toFixed(0)} med=${b.med} sides=${b.sides} → in "${b.road}" at ${ll.lat.toFixed(5)},${ll.lon.toFixed(5)}`)
}

function distance2(a: Point, b: Point): number { return Math.hypot(a.x - b.x, a.z - b.z) }
