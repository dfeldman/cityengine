/**
 * CORRIDOR SURVEY (owner, 2026-10-25: "it should be possible to easily ride straight down market street in a straight line
 * in either direction and easily turn onto any intersecting street with a simple, obvious decision"). Builds the ride
 * graph as the game does and walks ONE named street through a stretch of it, reporting what a rider meets:
 *
 *   - every node on the way, its degree and the turn needed to stay on the street (over --kink degrees is a kink);
 *   - where the street SPLITS (two edges of the same name leave a node in the same direction: carriageways) and rejoins;
 *   - nodes within --near m of each other along the street (clusters a rider meets as several junctions);
 *   - the cross streets met, and at how many separate nodes each one crosses.
 *
 *   node --experimental-strip-types tools/corridor-survey.ts [city] --street="Market Street" --from=lat,lon --to=lat,lon
 *        [--kink 15] [--near 25] [--raw] [--before: without the corridors]
 */
import { rideGraph } from '../src/city/ridegraph.ts'
import { unpackPoints } from '../src/city/package.ts'
import type { CityGraph, Edge } from '../src/city/graph.ts'
import { Terrain } from '../src/city/terrain.ts'
import { Projection } from '../src/city/geo.ts'
import { RIDE_OVERRIDES } from '../src/city/overrides.ts'
import { readPackage } from './bake-files.ts'

type P = { x: number; z: number }
const arg = (n: string, d = ''): string => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=') ?? d
const city = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'san-francisco'
const STREET = arg('street', 'Market Street')
const KINK = Number(arg('kink', '15'))
const NEAR = Number(arg('near', '25'))
const pkg = readPackage(city)
const terrain = new Terrain(pkg.terrain)
const proj = new Projection(pkg.origin)
const [fla, flo] = arg('from', '37.7785,-122.4150').split(',').map(Number)
const [tla, tlo] = arg('to', '37.76189,-122.43733').split(',').map(Number)
const A = proj.toLocal({ lat: fla, lon: flo }), B = proj.toLocal({ lat: tla, lon: tlo })

const edges: Edge[] = pkg.edges.map((e) => {
  const points = unpackPoints(e.points)
  let length = 0
  for (let i = 1; i < points.length; i++) length += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
  return { id: e.id, a: e.a, b: e.b, points, length, surface: e.surface, width: e.width, walk: e.walk, name: e.name,
    foot: e.foot, crossing: e.crossing, heights: e.heights, kind: e.kind, service: e.service, oneway: e.oneway,
    layer: e.layer, bridge: e.bridge, tunnel: e.tunnel, passage: e.passage }
})
const o = RIDE_OVERRIDES[city] ?? RIDE_OVERRIDES[pkg.region ?? '']
const g: CityGraph = rideGraph(edges, 'bike', {
  corridors: process.argv.includes('--before') ? [] : (o?.corridors ?? []).map((c) => ({ street: c.street, from: proj.toLocal(c.from), to: proj.toLocal(c.to), lane: c.lane })),
  roundabouts: (o?.roundabouts ?? []).map((r) => {
    const p = proj.toLocal({ lat: r.lat, lon: r.lon })
    return { name: r.name, r: r.r, R: r.R, x: p.x, z: p.z }
  }),
  heightAt: (x, z) => terrain.heightAt(x, z),
  ground: (x, z) => terrain.heightAt(x, z),
  buildings: pkg.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => b.ring),
  straighten: !process.argv.includes('--raw'),
})
const ll = (p: P): string => { const q = proj.toLatLon(p); return `${q.lat.toFixed(5)},${q.lon.toFixed(5)}` }
const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L
/** how far along the stretch, and how far off its line */
const along = (p: P): { s: number; off: number } => ({ s: (p.x - A.x) * ux + (p.z - A.z) * uz, off: (p.x - A.x) * -uz + (p.z - A.z) * ux })
const inStretch = (p: P): boolean => { const q = along(p); return q.s > -30 && q.s < L + 30 && Math.abs(q.off) < 220 }
const named = (e: Edge): boolean => e.name === STREET || (e.name ?? '').split(/;\s*/).includes(STREET)
const heading = (a: P, b: P): number => Math.atan2(b.x - a.x, b.z - a.z) * 180 / Math.PI
const turn = (h1: number, h2: number): number => { let d = h2 - h1; while (d > 180) d -= 360; while (d < -180) d += 360; return d }
const outward = (e: Edge, node: number): P[] => (e.a === node ? e.points : [...e.points].reverse())
/** the heading of an edge leaving a node, over its first ~12 m */
const leave = (e: Edge, node: number): number => {
  const pts = outward(e, node); let d = 0, i = 1
  for (; i < pts.length - 1 && d < 12; i++) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
  return heading(pts[0], pts[Math.min(i, pts.length - 1)])
}
/** …and arriving at it */
const arrive = (e: Edge, node: number): number => (leave(e, node) + 180) % 360

const street = [...g.edges.values()].filter((e) => named(e) && e.points.some(inStretch))
console.log(`${STREET}: ${street.length} ride edges in the stretch (${L.toFixed(0)} m, ${ll(A)} → ${ll(B)}), lanes ${[...new Set(street.map((e) => (e as Edge & { lane?: number }).lane ?? 0))].join(", ")} m`)
const nodesOn = new Set<number>()
for (const e of street) { nodesOn.add(e.a); nodesOn.add(e.b) }

// ---- splits: a node with two street edges leaving within 35° of each other
let splits = 0
for (const n of nodesOn) {
  const es = (g.nodes.get(n)?.edges ?? []).map((id) => g.edges.get(id)!).filter(named)
  for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
    const t = Math.abs(turn(leave(es[i], n), leave(es[j], n)))
    if (t < 35) { splits++; console.log(`  split/merge at ${ll(g.nodes.get(n)!.at)}: two ${STREET} edges ${t.toFixed(0)}° apart`) }
  }
}

// ---- walk it, both ways: from the node nearest each end, always taking the street edge that turns least
function walk(start: P, dir: 1 | -1): void {
  let best = -1, bd = Infinity
  for (const n of nodesOn) { const at = g.nodes.get(n)!.at, d = Math.hypot(at.x - start.x, at.z - start.z); if (d < bd) { bd = d; best = n } }
  let node = best, came: Edge | null = null, s = 0
  const seen = new Set<number>()
  const stops: string[] = []
  let kinks = 0, junctions = 0, lastJ = -999, clusters = 0
  for (let step = 0; step < 400; step++) {
    const here = g.nodes.get(node)!
    const out = here.edges.map((id) => g.edges.get(id)!).filter((e) => named(e) && e !== came && !seen.has(e.id))
    // (the way on: least turn from the way we came; at the start, the edge heading along the stretch in our direction)
    const want = came ? arrive(came, node) : (dir === 1 ? heading(A, B) : heading(B, A))
    out.sort((p, q) => Math.abs(turn(want, leave(p, node))) - Math.abs(turn(want, leave(q, node))))
    const next = out[0]
    const deg = here.edges.length
    if (came) {
      const t = next ? turn(want, leave(next, node)) : 0
      const cross = here.edges.map((id) => g.edges.get(id)!).filter((e) => !named(e)).map((e) => e.name ?? (e.foot ? '(path)' : '(unnamed)'))
      if (deg >= 3) {
        junctions++
        if (s - lastJ < NEAR) clusters++
        lastJ = s
      }
      if (Math.abs(t) > KINK || deg >= 3) stops.push(`    ${s.toFixed(0).padStart(5)} m  deg ${deg}  turn ${t.toFixed(0).padStart(4)}°  ${cross.join(', ') || '(only the street)'}  ${ll(here.at)}`)
      if (Math.abs(t) > KINK) kinks++
    }
    if (!next) { stops.push(`    END at ${ll(here.at)} — no ${STREET} edge on`); break }
    seen.add(next.id)
    s += next.length
    came = next
    node = next.a === node ? next.b : next.a
    if (!inStretch(g.nodes.get(node)!.at)) break
  }
  console.log(`\n  walking ${dir === 1 ? 'outbound (from → to)' : 'inbound (to → from)'}: ${s.toFixed(0)} m, ${junctions} junctions, ${kinks} turns over ${KINK}°, ${clusters} junctions within ${NEAR} m of the last`)
  for (const l of stops) console.log(l)
}
walk(A, 1)
walk(B, -1)

// ---- the cross streets: at each junction on the street, how far a cross street bends going over it (0° = straight)
console.log(`\n  cross streets going over ${STREET} (bend; 0° is straight over):`)
for (const n of nodesOn) {
  const here = g.nodes.get(n)!
  if (!inStretch(here.at)) continue
  const cross = here.edges.map((id) => g.edges.get(id)!).filter((e) => !named(e) && e.name)
  const byName = new Map<string, Edge[]>()
  for (const e of cross) byName.set(e.name!, [...(byName.get(e.name!) ?? []), e])
  for (const [name, es] of byName) {
    if (es.length < 2) continue
    // (the straightest pair: a street with two carriageways on one side has four edges here)
    let bend = 180
    for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) bend = Math.min(bend, 180 - Math.abs(turn(leave(es[i], n), leave(es[j], n))))
    console.log(`    ${name.padEnd(28)} ${bend.toFixed(0).padStart(4)}°  ${es.length} edges  ${ll(here.at)}`)
  }
}
console.log(`\n  ${splits} split/merge points`)

// ---- --at=lat,lon: every node within 15 m of a point, and its edges (to see why a junction is two)
if (arg('at')) {
  const [ala, alo] = arg('at').split(',').map(Number), P0 = proj.toLocal({ lat: ala, lon: alo })
  for (const [id, n] of g.nodes) {
    if (Math.hypot(n.at.x - P0.x, n.at.z - P0.z) > 15) continue
    console.log(`\n  node ${id} at ${ll(n.at)}`)
    for (const eid of n.edges) {
      const e = g.edges.get(eid)!
      console.log(`    edge ${e.id} ${e.name ?? (e.foot ? '(path)' : '(unnamed)')} ${e.kind ?? ''} ${e.length.toFixed(0)} m → ${ll(outward(e, id).at(-1)!)}`)
    }
  }
}
