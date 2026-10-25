/**
 * JUNCTION SURVEY (owner, 2026-10-24: "the single biggest issue for real players is not buildings, it's intersections that
 * should be perpendicular but due to bad OSM data have crazy angles … many appear to have a perpendicular intersection
 * that is not centered in the center of the quad (so creating 4 extra sharp turns on the 4 streets feeding in) … we should
 * try to make sure there are no sharp turns within N meters of an intersection"). docs/INTERSECTIONS.md.
 *
 * Builds the ride graph exactly as the game does (the "paths" overlay, J, is this graph) and, at EVERY node where three
 * or more ways meet — footways, five-way junctions and short links included, which tools/junctions.ts and
 * `straightenJunctions` leave out — measures, per street approach:
 *
 *   turn   the sharpest turn at any vertex within N m of the junction (degrees; N = --near, default 15), and where
 *   off    how far the junction sits from where its streets' LINES cross: each street's line is fitted to its approach
 *          from N to 40 m out (past the corner's jitter); the off-centre distance is the junction's distance from the
 *          least-squares crossing point of those lines — the "centre of the quad"
 *   angle  the angle between crossing streets (how far from 90° for a four-way with two through pairs)
 *
 * and says, for each junction with a sharp turn (over --sharp degrees, default 25) near it, why `straightenJunctions`
 * did not take it (a footway at it, more than four ways, an approach under 6 m, no through pair, a bridge…).
 *
 *   node --experimental-strip-types tools/junction-survey.ts [city] [--near 15] [--sharp 25] [--list N] [--raw]
 */
import { rideGraph } from '../src/city/ridegraph.ts'
import { unpackPoints } from '../src/city/package.ts'
import type { CityGraph, Edge } from '../src/city/graph.ts'
import { Terrain } from '../src/city/terrain.ts'
import { Projection } from '../src/city/geo.ts'
import { RIDE_OVERRIDES } from '../src/city/overrides.ts'
import { readPackage } from './bake-files.ts'
import { along } from '../src/city/junction-shape.ts'

const arg = (k: string, d: number): number => { const i = process.argv.indexOf(k); return i > 0 ? Number(process.argv[i + 1]) : d }
const city = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'san-francisco'
const NEAR = arg('--near', 15)
const SHARP = arg('--sharp', 25)
const LIST = arg('--list', 25)
const FIT_TO = 40

const pkg = readPackage(city)
const terrain = new Terrain(pkg.terrain)
const proj = new Projection(pkg.origin)
const edges: Edge[] = pkg.edges.map((e) => {
  const points = unpackPoints(e.points)
  let length = 0
  for (let i = 1; i < points.length; i++) length += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
  return { id: e.id, a: e.a, b: e.b, points, length, surface: e.surface, width: e.width, walk: e.walk, name: e.name,
    foot: e.foot, crossing: e.crossing, heights: e.heights, kind: e.kind, service: e.service, oneway: e.oneway,
    layer: e.layer, bridge: e.bridge, tunnel: e.tunnel, passage: e.passage }
})
// --drawn: the streets AS DRAWN — the map's own edges, which the road surface and its painted lines follow — instead of
// the ride graph the rider follows
const DRAWN = process.argv.includes('--drawn')
const drawnGraph = (): CityGraph => {
  const nodes = new Map<number, { id: number; at: P; edges: number[] }>()
  const em = new Map<number, Edge>()
  for (const e of edges) {
    if (e.foot || e.tunnel || e.bridge) continue
    em.set(e.id, e)
    for (const [nid, p] of [[e.a, e.points[0]], [e.b, e.points[e.points.length - 1]]] as const) {
      const n = nodes.get(nid) ?? { id: nid, at: p, edges: [] }
      n.edges.push(e.id)
      nodes.set(nid, n)
    }
  }
  return { nodes, edges: em } as unknown as CityGraph
}
type P = { x: number; z: number }
const g: CityGraph = DRAWN ? drawnGraph() : rideGraph(edges, 'bike', {
  roundabouts: ((RIDE_OVERRIDES[city] ?? RIDE_OVERRIDES[pkg.region ?? ''])?.roundabouts ?? []).map((r) => {
    const p = proj.toLocal({ lat: r.lat, lon: r.lon })
    return { name: r.name, r: r.r, R: r.R, x: p.x, z: p.z }
  }),
  heightAt: (x, z) => terrain.heightAt(x, z),
  ground: (x, z) => terrain.heightAt(x, z),
  buildings: pkg.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => b.ring),
  straighten: !process.argv.includes('--raw'),
})
const ll = (x: number, z: number): string => { const q = proj.toLatLon({ x, z }); return `${q.lat.toFixed(6)}, ${q.lon.toFixed(6)}` }

/** the edge's points from `node` outward */
const outward = (e: Edge, node: number): P[] => (e.a === node ? e.points : [...e.points].reverse())

/** the sharpest turn at a vertex within `near` m of the start, and how far along it is */
function sharpest(pts: P[], near: number): { turn: number; at: number } {
  let d = 0, best = { turn: 0, at: 0 }
  for (let i = 1; i < pts.length - 1; i++) {
    const ax = pts[i].x - pts[i - 1].x, az = pts[i].z - pts[i - 1].z
    d += Math.hypot(ax, az)
    if (d > near) break
    const bx = pts[i + 1].x - pts[i].x, bz = pts[i + 1].z - pts[i].z
    const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz)
    if (la < 0.2 || lb < 0.2) continue
    const t = (Math.acos(Math.max(-1, Math.min(1, (ax * bx + az * bz) / (la * lb)))) * 180) / Math.PI
    if (t > best.turn) best = { turn: t, at: d }
  }
  return best
}

/** the street's line from `from` to `to` m out: a point on it and its unit direction (outward), or null if too short */
function line(pts: P[], len: number, from: number, to: number): { p: P; d: P } | null {
  const hi = Math.min(to, len * 0.6)
  if (hi - from < 6) return null
  const a = along(pts, from).p, b = along(pts, hi).p
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  return { p: a, d: { x: (b.x - a.x) / L, z: (b.z - a.z) / L } }
}

/** the least-squares point nearest a set of lines (each a point and a unit direction), or null if they are near parallel */
function crossing(ls: { p: P; d: P }[]): P | null {
  let a11 = 0, a12 = 0, a22 = 0, b1 = 0, b2 = 0
  for (const { p, d } of ls) {
    // (I - d dᵀ)
    const m11 = 1 - d.x * d.x, m12 = -d.x * d.z, m22 = 1 - d.z * d.z
    a11 += m11; a12 += m12; a22 += m22
    b1 += m11 * p.x + m12 * p.z; b2 += m12 * p.x + m22 * p.z
  }
  const det = a11 * a22 - a12 * a12
  if (Math.abs(det) < 0.05) return null
  return { x: (a22 * b1 - a12 * b2) / det, z: (a11 * b2 - a12 * b1) / det }
}

// --divided: where a merged boulevard (one path down the middle, `lane` set) meets its own carriageways drawn apart —
// the path merging and splitting again (owner: "the divided streets merging and separating is also annoying")
if (process.argv.includes('--divided')) {
  let merged = 0, trans = 0
  const rows: string[] = []
  for (const e of g.edges.values()) if ((e as unknown as { lane?: number }).lane) merged++
  for (const n of g.nodes.values()) {
    const es = n.edges.map((id) => g.edges.get(id)!)
    for (const m of es) {
      const lane = (m as unknown as { lane?: number }).lane
      if (!lane || !m.name) continue
      const split = es.filter((e) => e !== m && e.name === m.name && !(e as unknown as { lane?: number }).lane && e.oneway)
      if (split.length >= 1) { trans++; if (rows.length < 30) rows.push(`${ll(n.at.x, n.at.z)}  ${m.name}: merged (lane ${lane} m) meets ${split.length} one-way carriageway(s)`) }
    }
  }
  console.log(`merged boulevard edges: ${merged}; places a merged edge meets its own street's separate one-way carriageways: ${trans}`)
  for (const r of rows) console.log('  ' + r)
  process.exit(0)
}
// --around x,z,r: print every ride edge within r m of a point, with its turns (degrees) and where along it they are
{
  const i = process.argv.indexOf('--around')
  if (i > 0) {
    const [ax, az, ar] = process.argv[i + 1].split(',').map(Number)
    for (const e of g.edges.values()) {
      if (!e.points.some((p) => Math.hypot(p.x - ax, p.z - az) < ar)) continue
      const turns: string[] = []
      let d = 0
      for (let k = 1; k < e.points.length - 1; k++) {
        const a = e.points[k - 1], b = e.points[k], c = e.points[k + 1]
        d += Math.hypot(b.x - a.x, b.z - a.z)
        const ux = b.x - a.x, uz = b.z - a.z, vx = c.x - b.x, vz = c.z - b.z
        const la = Math.hypot(ux, uz), lb = Math.hypot(vx, vz)
        if (la < 0.2 || lb < 0.2) continue
        const t = (Math.acos(Math.max(-1, Math.min(1, (ux * vx + uz * vz) / (la * lb)))) * 180) / Math.PI
        if (t > 5) turns.push(`${t.toFixed(0)}° at ${d.toFixed(1)} m (${b.x.toFixed(1)},${b.z.toFixed(1)})`)
      }
      console.log(`edge ${e.id} ${e.name ?? e.kind ?? '?'}${e.foot ? ' (foot)' : ''} ${e.a}->${e.b} ${e.length.toFixed(0)} m  ends (${e.points[0].x.toFixed(1)},${e.points[0].z.toFixed(1)}) (${e.points[e.points.length - 1].x.toFixed(1)},${e.points[e.points.length - 1].z.toFixed(1)})  turns: ${turns.join('; ') || 'none'}`)
    }
    process.exit(0)
  }
}
const q = (a: number[], f: number): number => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(f * (s.length - 1))] ?? 0 }
let nodes = 0
const offs: number[] = []
const why: Record<string, number> = {}
const byDeg: Record<string, [number, number]> = {}
const sharpRows: { at: string; turn: number; dist: number; off: number; reasons: string[]; names: string; deg: number }[] = []
let withSharp = 0, offOver2 = 0, offOver2Sharp = 0
const jogs: number[] = []
const jogRows: { at: string; jog: number; names: string }[] = []
const angleOff: number[] = []
for (const n of g.nodes.values()) {
  if (n.edges.length < 3) continue
  const es = n.edges.map((id) => g.edges.get(id)!)
  const streets = es.filter((e) => !e.foot)
  if (streets.length < 2) continue
  nodes++
  // the sharpest turn near the junction on any street approach
  let worst = { turn: 0, at: 0, name: '' }
  for (const e of streets) {
    const s = sharpest(outward(e, n.id), NEAR)
    if (s.turn > worst.turn) worst = { ...s, name: e.name ?? e.kind ?? '?' }
  }
  // the off-centre distance: the junction against its streets' lines' crossing
  const ls = streets.map((e) => line(outward(e, n.id), e.length, NEAR, FIT_TO)).filter((l): l is { p: P; d: P } => !!l)
  const c = ls.length >= 2 ? crossing(ls) : null
  const off = c ? Math.hypot(c.x - n.at.x, c.z - n.at.z) : NaN
  if (Number.isFinite(off) && off < 30) offs.push(off)
  if (off > 2 && off < 30) offOver2++
  // the JOG: at a junction with two streets running through, how far the junction sits off each street's line
  // (sideways) — the owner's "perpendicular intersection not centred in the quad": each street must step across by
  // this much to reach it, and back
  {
    const thr: { p: P; d: P }[] = []
    for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) {
      if (ls[i].d.x * ls[j].d.x + ls[i].d.z * ls[j].d.z > -Math.cos((20 * Math.PI) / 180)) continue
      const dx = ls[i].d.x - ls[j].d.x, dz = ls[i].d.z - ls[j].d.z, L = Math.hypot(dx, dz)
      thr.push({ p: { x: (ls[i].p.x + ls[j].p.x) / 2, z: (ls[i].p.z + ls[j].p.z) / 2 }, d: { x: dx / L, z: dz / L } })
    }
    if (thr.length >= 2) {
      const jog = Math.max(...thr.map(({ p, d }) => Math.abs((n.at.x - p.x) * d.z - (n.at.z - p.z) * d.x)))
      jogs.push(jog)
      if (jog > 1.5) jogRows.push({ at: ll(n.at.x, n.at.z), jog, names: [...new Set(streets.map((e) => e.name ?? '?'))].join(' / ') })
    }
  }
  // the crossing angle of a four-way: the two through pairs' lines
  if (streets.length === 4 && ls.length === 4) {
    let best = 0
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const dot = ls[i].d.x * ls[j].d.x + ls[i].d.z * ls[j].d.z
      best = Math.max(best, -dot)
    }
    if (best > Math.cos((20 * Math.PI) / 180)) {
      // (two lines nearly opposite form a through street; the angle between the two streets)
      const pairs: [number, number][] = []
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (ls[i].d.x * ls[j].d.x + ls[i].d.z * ls[j].d.z < -Math.cos((20 * Math.PI) / 180)) pairs.push([i, j])
      if (pairs.length === 2) {
        const [i] = pairs[0], [k] = pairs[1]
        const ang = (Math.acos(Math.abs(ls[i].d.x * ls[k].d.x + ls[i].d.z * ls[k].d.z)) * 180) / Math.PI
        angleOff.push(90 - ang)
      }
    }
  }
  const deg = es.length
  const key = deg > 5 ? '6+' : String(deg)
  byDeg[key] ??= [0, 0]
  byDeg[key][0]++
  if (worst.turn > SHARP) {
    withSharp++
    byDeg[key][1]++
    if (off > 2 && off < 30) offOver2Sharp++
    // why straightenJunctions passed it by (its own tests, in its order)
    const reasons: string[] = []
    if (es.length < 3 || es.length > 4) reasons.push(`${es.length} ways`)
    if (es.some((e) => e.foot)) reasons.push('a footway at it')
    if (es.some((e) => e.bridge || e.tunnel || (e as unknown as { raised?: boolean }).raised)) reasons.push('a bridge, tunnel or raised way')
    if (es.some((e) => e.length < 6)) reasons.push('an approach under 6 m')
    if (!reasons.length) reasons.push('taken, but left or declined (a corner, no through pair, or it would leave the asphalt)')
    for (const r of reasons) why[r] = (why[r] ?? 0) + 1
    sharpRows.push({ at: ll(n.at.x, n.at.z), turn: worst.turn, dist: worst.at, off, reasons, names: [...new Set(streets.map((e) => e.name ?? '?'))].join(' / '), deg })
  }
}
sharpRows.sort((a, b) => b.turn - a.turn)
console.log(`${city}: ${nodes} ${DRAWN ? 'DRAWN-street' : 'ride-graph'} junctions (3+ ways, 2+ of them streets)${process.argv.includes('--raw') ? ' — RAW, before straightening' : ''}`)
console.log(`  with a turn sharper than ${SHARP}° within ${NEAR} m on a street approach: ${withSharp} (${((100 * withSharp) / nodes).toFixed(1)}%)`)
console.log(`  by number of ways (junctions, with a sharp turn near): ${JSON.stringify(byDeg)}`)
console.log(`  why straightenJunctions did not take those: ${JSON.stringify(why)}`)
console.log(`  off the centre of its streets' lines: median ${q(offs, 0.5).toFixed(2)} m, 90% ${q(offs, 0.9).toFixed(2)}, 99% ${q(offs, 0.99).toFixed(2)}; over 2 m: ${offOver2} (${offOver2Sharp} of them with a sharp turn near)`)
console.log(`  four-way crossing angle, degrees from 90: median ${q(angleOff.map(Math.abs), 0.5).toFixed(1)}, 90% ${q(angleOff.map(Math.abs), 0.9).toFixed(1)}, 99% ${q(angleOff.map(Math.abs), 0.99).toFixed(1)} (n ${angleOff.length})`)
console.log(`  JOG at junctions with two streets through (n ${jogs.length}): median ${q(jogs, 0.5).toFixed(2)} m, 90% ${q(jogs, 0.9).toFixed(2)}, 99% ${q(jogs, 0.99).toFixed(2)}; over 1 m ${jogs.filter((j) => j > 1).length}, over 2 m ${jogs.filter((j) => j > 2).length}, over 3 m ${jogs.filter((j) => j > 3).length}`)
if (process.argv.includes('--jogs')) for (const r of jogRows.sort((a, b) => b.jog - a.jog).slice(0, LIST)) console.log(`  jog ${r.jog.toFixed(1)} m  ${r.at}  ${r.names}`)
for (const r of sharpRows.slice(0, LIST)) console.log(`  ${r.at}  ${r.turn.toFixed(0)}° at ${r.dist.toFixed(1)} m, off-centre ${Number.isFinite(r.off) ? r.off.toFixed(1) : '?'} m, ${r.deg} ways  ${r.names}  [${r.reasons.join('; ')}]`)
