/**
 * BRIDGEHEAD LEGS: every leg in plans/bridgeheads/legs.json routed on the baked bike ride graph the way the game
 * routes (src/sim/route.ts, as tools/check-tours.ts does), and judged: pass/fail, length and its ratio to the straight
 * line, steepest grade, whether a lower-quay leg really passes UNDER the bridge, and any ride edge on it that
 * tools/air-paths.ts finds in the air or under something.
 *
 *   npx vite-node tools/bridgehead-legs.ts -- [--city=paris-centre] [--bridge=Pont National] [--no-air] [-v]
 *
 * A leg: { bridge, leg, from: [lat, lon], to, fromName?, toName?, expect? }. fromName/toName snap only onto ride edges
 * whose name contains it (a lower quay runs metres from the upper one). expect: maxRatio (default MAX_RATIO),
 * maxGrade (default MAX_GRADE, over GRADE_WINDOW m), under: { clear } (the route crosses the bridge's own ride edges —
 * the edges named `bridge`, or `bridgeNames` — at least `clear` m below the deck), noAir (default true). mode: 'run' routes
 * on the foot graph (a foot-only footbridge); a bike leg with no route says whether it exists on foot. (The air check
 * reads air-paths' BIKE graph only: a run leg's edges are not checked for air.)
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { shippedDir } from './bake-files.ts'
import { unpackRide, type RideFile } from '../src/city/ridefile.ts'
import type { RideEdge } from '../src/city/ridegraph.ts'
import { Projection } from '../src/city/geo.ts'
import { nearestOnGraph, planRoute, type Route } from '../src/sim/route.ts'

/** defaults for a leg's expectations, and the snap a leg's end may be from the graph */
const MAX_RATIO = 1.8, MAX_GRADE = 0.08, GRADE_WINDOW = 15, MAX_SNAP = 30
const args = process.argv.slice(2)
const opt = (k: string, d = ''): string => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d
const city = opt('city', 'paris-centre')
const only = opt('bridge')
const verbose = args.includes('-v')
interface Leg { bridge: string; leg: string; from: [number, number]; to: [number, number]; fromName?: string; toName?: string
  /** the ride graph: bike (default) or run (a foot-only footbridge, steps) */
  mode?: 'bike' | 'run'
  /** the deck's ride-edge names when not `bridge` (an unnamed footbridge's footway, a deck in two named parts) */
  bridgeNames?: string[]
  expect?: { maxRatio?: number; maxGrade?: number; under?: { clear?: number }; noAir?: boolean; /** no route edge whose name contains one of these */ avoid?: string[] } }
const legs = (JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'plans', 'bridgeheads', 'legs.json'), 'utf8')) as { legs: Leg[] }).legs
  .filter((l) => !only || l.bridge === only)
const index = JSON.parse(readFileSync(resolve(shippedDir(city), 'index.json'), 'utf8'))
const graphs = new Map<string, ReturnType<typeof unpackRide>>()
const graph = (mode: string): ReturnType<typeof unpackRide> => graphs.get(mode)
  ?? graphs.set(mode, unpackRide(JSON.parse(readFileSync(resolve(shippedDir(city), `ride-${mode}.json`), 'utf8')) as RideFile)).get(mode)!
let g = graph('bike')
const proj = new Projection(index.origin)
interface S { x: number; z: number; h: number; e: number }

/** an edge's points and heights between two distances along it, in the order from → to */
function stretch(e: RideEdge, from: number, to: number): S[] {
  const out: (S & { s: number })[] = []
  let run = 0
  const lo = Math.min(from, to), hi = Math.max(from, to)
  for (let i = 0; i < e.points.length; i++) {
    if (i) run += Math.hypot(e.points[i].x - e.points[i - 1].x, e.points[i].z - e.points[i - 1].z)
    if (run >= lo - 0.01 && run <= hi + 0.01) out.push({ ...e.points[i], h: e.heights?.[i] ?? NaN, e: e.id, s: run })
  }
  if (from > to) out.reverse()
  return out
}
/** the route's samples, junction by junction (check-tours.ts heightsAlong, with the points) */
function walk(start: { edgeId: number; s: number }, r: Route): S[] {
  const first = g.edges.get(start.edgeId)!
  if (r.nodes.length === 0) return stretch(first, start.s, r.target.s)
  const out = stretch(first, start.s, first.a === r.nodes[0] ? 0 : first.length)
  for (let i = 0; i < r.nodes.length; i++) {
    const n = r.nodes[i], e = g.edges.get(r.leave.get(n)!)
    if (!e) continue
    const fromA = e.a === n
    out.push(...stretch(e, fromA ? 0 : e.length, i === r.nodes.length - 1 ? r.target.s : fromA ? e.length : 0))
  }
  return out
}
function steepest(ss: S[]): number {
  const cum = [0]
  for (let i = 1; i < ss.length; i++) cum.push(cum[i - 1] + Math.hypot(ss[i].x - ss[i - 1].x, ss[i].z - ss[i - 1].z))
  let worst = 0
  for (let i = 0, j = 0; i < ss.length; i++) {
    while (j < ss.length && cum[j] - cum[i] < GRADE_WINDOW) j++
    if (j >= ss.length) break
    worst = Math.max(worst, Math.abs(ss[j].h - ss[i].h) / (cum[j] - cum[i]))
  }
  return worst
}
/** segment crossing p1p2 × q1q2: the parameters, or null */
function cross(p1: S, p2: S, q1: { x: number; z: number }, q2: { x: number; z: number }): [number, number] | null {
  const rx = p2.x - p1.x, rz = p2.z - p1.z, sx = q2.x - q1.x, sz = q2.z - q1.z
  const d = rx * sz - rz * sx
  if (Math.abs(d) < 1e-9) return null
  const t = ((q1.x - p1.x) * sz - (q1.z - p1.z) * sx) / d, u = ((q1.x - p1.x) * rz - (q1.z - p1.z) * rx) / d
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [t, u] : null
}
/** every place the route crosses the bridge's own ride edges: how far under the deck (+) */
function crossings(ss: S[], names: string[]): number[] {
  const deck = [...g.edges.values()].filter((e) => names.includes(e.name ?? '') && e.heights)
  const out: number[] = []
  for (let i = 1; i < ss.length; i++) for (const e of deck) {
    if (ss[i].e === e.id) continue
    for (let k = 1; k < e.points.length; k++) {
      const c = cross(ss[i - 1], ss[i], e.points[k - 1], e.points[k])
      if (!c) continue
      const h = ss[i - 1].h + (ss[i].h - ss[i - 1].h) * c[0], dh = e.heights![k - 1] + (e.heights![k] - e.heights![k - 1]) * c[1]
      out.push(dh - h)
    }
  }
  return out
}
/** air-paths.ts's stretches near each bridge: edge id → worst gap (m; + in the air, − under something) */
const air = new Map<number, number>()
if (!args.includes('--no-air')) {
  for (const b of new Set(legs.map((l) => l.bridge))) {
    const pts = legs.filter((l) => l.bridge === b).flatMap((l) => [l.from, l.to])
    const c = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]
    const cl = proj.toLocal({ lat: c[0], lon: c[1] })
    const r = Math.max(...pts.map((p) => { const q = proj.toLocal({ lat: p[0], lon: p[1] }); return Math.hypot(q.x - cl.x, q.z - cl.z) })) + 150
    const out = execFileSync('npx', ['vite-node', resolve(import.meta.dirname, 'air-paths.ts'), '--', city, `--near=${c[0]},${c[1]},${Math.round(r)}`, '--top=9999'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 26 })
    for (const line of out.split('\n')) {
      const m = /^\s+(\d+) .*?\s([+-]?\d+\.\d) m from the nearest way/.exec(line)
      const v = m ? Number(m[2]) : NaN
      if (m && Number.isFinite(v) && Math.abs(v) >= Math.abs(air.get(Number(m[1])) ?? 0)) air.set(Number(m[1]), v)
    }
  }
}

let failed = 0
const causes = new Map<string, number>()
for (const l of legs) {
  g = graph(l.mode ?? 'bike')
  const named = (n?: string) => n ? (e: { name?: string }) => !(e.name ?? '').includes(n) : undefined
  const a = proj.toLocal({ lat: l.from[0], lon: l.from[1] }), b = proj.toLocal({ lat: l.to[0], lon: l.to[1] })
  const sa = nearestOnGraph(g, a, named(l.fromName)), sb = nearestOnGraph(g, b, named(l.toName))
  const why: string[] = []
  if (!sa || sa.d > MAX_SNAP) why.push(`start ${sa ? Math.round(sa.d) + ' m' : 'nowhere'} from ${l.fromName ?? 'the graph'}`)
  if (!sb || sb.d > MAX_SNAP) why.push(`end ${sb ? Math.round(sb.d) + ' m' : 'nowhere'} from ${l.toName ?? 'the graph'}`)
  let route: Route | null = null
  if (sa && sb && !why.length) {
    // either way the rider might be facing at the start: the shorter
    for (const reversed of [false, true]) {
      const r = planRoute(g, { edgeId: sa.edgeId, s: sa.s, reversed }, b, sb)
      if (r && (!route || r.length < route.length)) route = r
    }
    if (!route) {
      // (a bike leg with no route: is it there on foot — steps, a foot-only footbridge?)
      const gr = graph('run'), ra = nearestOnGraph(gr, a), rb = nearestOnGraph(gr, b)
      const foot = (l.mode ?? 'bike') === 'bike' && ra && rb && planRoute(gr, { edgeId: ra.edgeId, s: ra.s, reversed: false }, b, rb)
      why.push(foot ? 'no bike route (foot only: steps or a foot-only deck)' : 'no route')
    }
  }
  let line = ''
  if (route && sa) {
    const ss = walk(sa, route)
    const straight = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const ratio = route.length / straight, grade = steepest(ss)
    const x = l.expect ?? {}
    if (ratio > (x.maxRatio ?? MAX_RATIO)) why.push(`detour ×${ratio.toFixed(2)}`)
    if (grade > (x.maxGrade ?? MAX_GRADE)) why.push(`grade ${(grade * 100).toFixed(0)}%`)
    if (x.under) {
      const cs = crossings(ss, l.bridgeNames ?? [l.bridge]), clear = x.under.clear ?? 3
      if (!cs.length) why.push('never crosses the bridge line')
      else if (!cs.some((d) => d >= clear)) why.push(`crosses ${cs.map((d) => d.toFixed(1)).join('/')} m under the deck (< ${clear})`)
    }
    const edges = [...new Set(ss.map((q) => q.e))]
    const touched = (x.avoid ?? []).filter((n) => edges.some((e) => (g.edges.get(e)!.name ?? '').includes(n)))
    if (touched.length) why.push(`touches ${touched.join(', ')}`)
    const flying = edges.filter((e) => air.has(e))
    if (x.noAir !== false && flying.length) why.push(`air/under: ${flying.map((e) => `${e} ${air.get(e)! > 0 ? '+' : ''}${air.get(e)!.toFixed(1)}`).join(', ')}`)
    const hs = ss.map((q) => q.h).filter(Number.isFinite)
    line = `${Math.round(route.length)} m ×${ratio.toFixed(2)}, max grade ${(grade * 100).toFixed(1)}%, h ${Math.min(...hs).toFixed(1)}..${Math.max(...hs).toFixed(1)}`
    if (verbose) line += `\n      via ${edges.map((e) => `${e}:${(g.edges.get(e)!.name ?? g.edges.get(e)!.kind ?? '').slice(0, 16)}`).join(' > ')}`
  }
  // the cause, for the fixer: a leg end off its named way (snap: the leg's own coordinates), no path at all (missing-link: a ramp or a way to add), a path that goes round (join: the bridge
  // end not joined to the way beside it, a ride-graph fix), or joined but steep / too low under the deck / in the air (height: the bake)
  const cause = why.some((w) => /^(start|end) /.test(w)) ? 'snap' : !route ? 'missing-link' : why.some((w) => w.startsWith('detour')) ? 'join' : 'height'
  if (why.length) { failed++; causes.set(cause, (causes.get(cause) ?? 0) + 1); why.unshift(`[${cause}]`) }
  console.log(`${why.length ? 'FAIL' : 'pass'}  ${l.bridge.padEnd(14).slice(0, 14)} ${l.leg.padEnd(34)} ${line}${why.length ? '\n      ' + why.join('; ') : ''}`)
}
console.log(`${legs.length - failed}/${legs.length} legs pass${causes.size ? ` (fails: ${[...causes].map(([c, n]) => `${n} ${c}`).join(', ')})` : ''}`)
process.exit(failed ? 1 : 0)
