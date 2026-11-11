/**
 * BRIDGE SCOREBOARD: a before/after number per rideable bridge, from the shipped city alone (no plans/bridgeheads/legs.json).
 *
 *   npx vite-node tools/bridge-scoreboard.ts -- --city=<id> [--bridge=<name substring>] [-v] [--json=<out path>]
 *
 * (a) LEGS, generated from the geometry and routed on the baked bike ride graph the way tools/bridgehead-legs.ts does
 *     (same routing, walk/stretch/steepest/crossings, snap / missing-link / join / height causes): per bridge — the deck each way;
 *     the upper quai each way at each end (the cross way nearest the deck end, 150 m either side, followed along its name);
 *     a lower-quay leg wherever a BD TOPO sol-0 road passes under a sol-1 troncon of the deck (must cross the deck's ride edges
 *     >= UNDER_CLEAR m below it; either direction may pass); a slip leg to each BD TOPO 'Bretelle' ending near a deck end.
 * (b) STATIC AUDITS over the ride graph within AUDIT_R of either deck end (counts; the bridge's row is the union of its two ends):
 *     step      nodes of the package's ways (all of them, not only the bike graph's; no stairs) where the ways meeting differ by > STEP_DH
 *     deckEnd   deck ends whose height differs from the adjoining non-bridge edge's (same node, else nearest edge end <= 10 m) by > DECK_DH
 *     offGround non-bridge/tunnel/ramp edges that BD TOPO matches to a sol-0 road yet ride > OFF_DH above the shipped ground
 *     grade     ride edges steeper than MAX_GRADE over GRADE_WINDOW m
 *     wallGap   gaps > WALL_GAP m in BD TOPO Quai / Mur de soutenement lines (sol != -1) that have a shipped quay wall (<= WALL_NEAR m) somewhere
 *     railBridge rails flagged bridge whose every node is within RAIL_DH of the ground (a deck at grade)
 *     trench    non-bridge, non-tunnel ride edges with a vertex > TRENCH_DH under the lidar MNT while its neighbour vertices agree with it (<= 1 m)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { packageFile, readPackage, shippedDir } from './bake-files.ts'
import { unpackRide, type RideFile } from '../src/city/ridefile.ts'
import type { RideEdge } from '../src/city/ridegraph.ts'
import type { CityPackage, PackedEdge } from '../src/city/package.ts'
import { Terrain } from '../src/city/terrain.ts'
import { Projection } from '../src/city/geo.ts'
import { nearestOnGraph, planRoute, type Route } from '../src/sim/route.ts'
import { btMatchEdge, btName, btSegs, btSol, fetchBdTopo, fillNoZ, type BtFeature } from './bdtopo-zones.ts'
import { ignLidar } from './ign-lidar.ts'

/** ---- tunables ---- */
const MAX_GRADE = 0.08, GRADE_WINDOW = 15, MAX_SNAP = 30
const DECK_RATIO = 1.3, QUAI_RATIO = 1.5, SLIP_RATIO = 1.8, LOWER_RATIO = 1.8
const QUAI_LEN = 150, QUAI_ANGLE = 45, QUAI_FIND = 60
/** a cross way whose quai leg spans less than this (m) is a stub at the bridgehead (Pont de Tolbiac's 20 m residential link from
 *  the deck's at-grade end to Quai de Bercy: a leg that must use the bridge's name), and the next nearest cross way is taken */
const QUAI_MIN_LEG = 60
const BT_DECK_NEAR = 15, BT_PARALLEL_DEG = 25, LOWER_HALF = 150, LOWER_MIN = 40, LOWER_BACK = 10, LOWER_TURN_DEG = 50, LOWER_JOIN = 1, UNDER_CLEAR = 3, LOWER_DEDUPE = 25, LOWER_MAX = 6
const SLIP_NEAR = 100, SLIP_LEN = 80, SLIP_ROAD = 20
const MIN_WATER_DECK = 60, AUDIT_R = 300, BOX_PAD = 300
/** (AUDIT_R 300: the band reaches 90 m past a deck's end plus 120 m off the water; Pont National's 6.1 m step stood 234 m off it)
 *  deckEnd also walks DECK_REACH m along each way leaving a deck end: a vertex DECK_DH off the line from the end to there is a dip */
const DECK_REACH = 40
const STEP_DH = 1, DECK_DH = 1, OFF_DH = 1.5, WALL_GAP = 3, WALL_NEAR = 3, RAIL_DH = 1.5
const TRENCH_DH = 2, TRENCH_NEIGH = 1, TRENCH_BRIDGE_R = 10
/** zigzag (2026-11-08): a ride edge whose heights reverse (a turn after a rise or fall of > ZIG_DH m) ZIG_N or more times within
 *  ZIG_WIN m along it (the band's unmatched footways flipped per vertex between the roads each vertex saw) */
const ZIG_DH = 0.2, ZIG_N = 3, ZIG_WIN = 60
/** the arc positions where an edge's heights reverse by more than ZIG_DH (hysteresis), and whether ZIG_N fall within ZIG_WIN m */
function zigzag(e: RideEdge): P | null {
  const h = e.heights!, rev: number[] = [], at: P[] = []
  let s = 0, dir = 0, hi = h[0], hiS = 0, hiI = 0, lo = h[0], loS = 0, loI = 0
  for (let i = 1; i < h.length; i++) {
    s += Math.hypot(e.points[i].x - e.points[i - 1].x, e.points[i].z - e.points[i - 1].z)
    if (h[i] > hi) { hi = h[i]; hiS = s; hiI = i }
    if (h[i] < lo) { lo = h[i]; loS = s; loI = i }
    if (dir !== -1 && hi - h[i] > ZIG_DH) { if (dir === 1) { rev.push(hiS); at.push(e.points[hiI]) } dir = -1; lo = h[i]; loS = s; loI = i }
    else if (dir !== 1 && h[i] - lo > ZIG_DH) { if (dir === -1) { rev.push(loS); at.push(e.points[loI]) } dir = 1; hi = h[i]; hiS = s; hiI = i }
  }
  for (let k = 0; k + ZIG_N - 1 < rev.length; k++) if (rev[k + ZIG_N - 1] - rev[k] <= ZIG_WIN) return at[k]
  return null
}
const ROAD_KINDS = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|road)(_link)?$/
const CROSS_NAME = /^(Quai|Avenue|Boulevard|Rue|Port)\b/i

const args = process.argv.slice(2)
const opt = (k: string, d = ''): string => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d
const city = opt('city'), only = opt('bridge'), verbose = args.includes('-v'), jsonOut = opt('json')
if (!city) { console.error('bridge-scoreboard: --city=<id> is required'); process.exit(0) }
if (!existsSync(resolve(shippedDir(city), 'index.json'))) { console.error(`bridge-scoreboard: ${city} has no shipped index.json (mid-bake?)`); process.exit(0) }

const index = JSON.parse(readFileSync(resolve(shippedDir(city), 'index.json'), 'utf8'))
const datum: number = index.datumMsl ?? 32.94
let pkg: CityPackage
try { pkg = readPackage(city) } catch (e) {
  if (!existsSync(packageFile(city))) { console.error(`bridge-scoreboard: ${(e as Error).message}`); process.exit(0) }
  console.error(`warning: ${(e as Error).message.slice(0, 90)} - reading the private package anyway`)
  pkg = JSON.parse(readFileSync(packageFile(city), 'utf8')) as CityPackage
}
const g = unpackRide(JSON.parse(readFileSync(resolve(shippedDir(city), 'ride-bike.json'), 'utf8')) as RideFile)
const proj = new Projection(index.origin)
const terrain = pkg.terrain ? new Terrain(pkg.terrain) : null
interface P { x: number; z: number }
interface S { x: number; z: number; h: number; e: number }
const dist = (a: P, b: P): number => Math.hypot(a.x - b.x, a.z - b.z)
const edges = [...g.edges.values()]
// (audit check: SB_INJECT=lat,lon,dz,R moves the ride graph's heights within R m of the point by dz, cosine-eased: a known-bad case)
if (process.env.SB_INJECT) {
  const [la, lo, dz, R] = process.env.SB_INJECT.split(',').map(Number), c = proj.toLocal({ lat: la, lon: lo })
  for (const e of edges) if (e.heights) e.points.forEach((p, i) => { const d = Math.hypot(p.x - c.x, p.z - c.z); if (d < R) e.heights![i] += dz * (0.5 + 0.5 * Math.cos(Math.PI * d / R)) })
}

/** ---- routing machinery (tools/bridgehead-legs.ts, unchanged) ---- */
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
function cross(p1: P, p2: P, q1: P, q2: P): [number, number] | null {
  const rx = p2.x - p1.x, rz = p2.z - p1.z, sx = q2.x - q1.x, sz = q2.z - q1.z
  const d = rx * sz - rz * sx
  if (Math.abs(d) < 1e-9) return null
  const t = ((q1.x - p1.x) * sz - (q1.z - p1.z) * sx) / d, u = ((q1.x - p1.x) * rz - (q1.z - p1.z) * rx) / d
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [t, u] : null
}
function crossings(ss: S[], names: string[]): number[] {
  const deck = edges.filter((e) => names.includes(e.name ?? '') && e.heights)
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

interface Leg { bridge: string; leg: string; from: P; to: P; fromName?: string; toName?: string; maxRatio: number; under?: number; avoid?: string[]
  /** lower quay: the leg passes if either direction does */ either?: boolean
  /** snap the ends to non-bridge edges only (a lower-quay leg's ends are on the road under the deck, not on the deck) */ offDeck?: boolean }
interface LegResult { bridge: string; leg: string; pass: boolean; line: string; cause: string; why: string[] }

function routeLeg(l: Leg): LegResult {
  const named = (n?: string) => n ? (e: { name?: string; bridge?: boolean }) => !(e.name ?? '').includes(n) || (!!l.offDeck && !!e.bridge) : l.offDeck ? (e: { bridge?: boolean }) => !!e.bridge : undefined
  const a = l.from, b = l.to
  const sa = nearestOnGraph(g, a, named(l.fromName)), sb = nearestOnGraph(g, b, named(l.toName))
  const why: string[] = []
  if (!sa || sa.d > MAX_SNAP) why.push(`start ${sa ? Math.round(sa.d) + ' m' : 'nowhere'} from ${l.fromName ?? 'the graph'}`)
  if (!sb || sb.d > MAX_SNAP) why.push(`end ${sb ? Math.round(sb.d) + ' m' : 'nowhere'} from ${l.toName ?? 'the graph'}`)
  let route: Route | null = null
  if (sa && sb && !why.length) {
    for (const reversed of [false, true]) {
      const r = planRoute(g, { edgeId: sa.edgeId, s: sa.s, reversed }, b, sb)
      if (r && (!route || r.length < route.length)) route = r
    }
    if (!route) why.push('no route')
  }
  let line = ''
  if (route && sa) {
    const ss = walk(sa, route)
    const straight = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const ratio = route.length / straight, grade = steepest(ss)
    if (ratio > l.maxRatio) why.push(`detour ×${ratio.toFixed(2)}`)
    if (grade > MAX_GRADE) why.push(`grade ${(grade * 100).toFixed(0)}%`)
    if (l.under !== undefined) {
      const cs = crossings(ss, [l.bridge])
      if (!cs.length) why.push('never crosses the bridge line')
      else if (!cs.some((d) => d >= l.under!)) why.push(`crosses ${cs.map((d) => d.toFixed(1)).join('/')} m under the deck (< ${l.under})`)
    }
    const used = [...new Set(ss.map((q) => q.e))]
    const touched = (l.avoid ?? []).filter((n) => used.some((e) => (g.edges.get(e)!.name ?? '').includes(n)))
    if (touched.length) why.push(`touches ${touched.join(', ')}`)
    const hs = ss.map((q) => q.h).filter(Number.isFinite)
    line = `${Math.round(route.length)} m ×${ratio.toFixed(2)}, max grade ${(grade * 100).toFixed(1)}%, h ${Math.min(...hs).toFixed(1)}..${Math.max(...hs).toFixed(1)}`
    if (verbose) line += `\n      via ${used.map((e) => `${e}:${(g.edges.get(e)!.name ?? g.edges.get(e)!.kind ?? '').slice(0, 16)}`).join(' > ')}`
  }
  const cause = why.some((w) => /^(start|end) /.test(w)) ? 'snap' : !route ? 'missing-link' : why.some((w) => w.startsWith('detour')) ? 'join' : 'height'
  if (why.length) why.unshift(`[${cause}]`)
  return { bridge: l.bridge, leg: l.leg, pass: !why.length, line, cause: why.length ? cause : '', why }
}
function runLeg(l: Leg): LegResult {
  const r = routeLeg(l)
  if (r.pass || !l.either) return r
  const r2 = routeLeg({ ...l, from: l.to, to: l.from, fromName: l.toName, toName: l.fromName })
  return r2.pass ? { ...r2, leg: l.leg } : r
}

/** ---- bridges: ride edges flagged bridge, named Pont/Passerelle/Viaduc, grouped by name ---- */
const ringOf = (a: unknown): number[] | null => (a as { ring?: number[] }).ring ?? null
const waterRings: number[][] = [...(pkg.areas ?? []).filter((a) => a.kind === 'water'), ...(pkg.water ?? [])].map(ringOf).filter((r): r is number[] => !!r)
const inRing = (ring: number[], x: number, z: number): boolean => {
  let hit = false
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const ax = ring[i], az = ring[i + 1], bx = ring[j], bz = ring[j + 1]
    if ((az > z) !== (bz > z) && x < ((bx - ax) * (z - az)) / (bz - az) + ax) hit = !hit
  }
  return hit
}
const inWater = (x: number, z: number): boolean => waterRings.some((r) => inRing(r, x, z))
const box = pkg.box ?? { x0: -pkg.radius, x1: pkg.radius, z0: -pkg.radius, z1: pkg.radius }
const inBox = (p: P): boolean => p.x >= box.x0 && p.x <= box.x1 && p.z >= box.z0 && p.z <= box.z1

interface Bridge { name: string; edges: RideEdge[]; endA: P; endB: P; nodeA: number; nodeB: number; hA: number; hB: number; length: number }
const groups = new Map<string, RideEdge[]>()
for (const e of edges) if (e.bridge && /^(Pont|Passerelle|Viaduc)/i.test(e.name ?? '') && (!only || (e.name ?? '').toLowerCase().includes(only.toLowerCase()))) {
  const l = groups.get(e.name!) ?? []
  l.push(e); groups.set(e.name!, l)
}
const bridges: Bridge[] = []
for (const [name, es] of groups) {
  // terminal nodes: used by one of the group's edges only (a chain's two ends; a dual deck's four, the farthest pair is taken)
  const cnt = new Map<number, { p: P; h: number; n: number }>()
  for (const e of es) for (const [n, i] of [[e.a, 0], [e.b, e.points.length - 1]] as [number, number][]) {
    const c = cnt.get(n) ?? { p: e.points[i], h: e.heights?.[i] ?? NaN, n: 0 }
    c.n++; cnt.set(n, c)
  }
  let ends = [...cnt].filter(([, c]) => c.n === 1)
  if (ends.length < 2) ends = [...cnt]
  let best: [number, number] | null = null, bd = -1
  for (const [na, ca] of ends) for (const [nb, cb] of ends) if (na < nb && dist(ca.p, cb.p) > bd) { bd = dist(ca.p, cb.p); best = [na, nb] }
  if (!best) continue
  const A = cnt.get(best[0])!, B = cnt.get(best[1])!
  const pts: P[] = []
  for (const e of es) for (let i = 1; i < e.points.length; i++) {
    const d = dist(e.points[i - 1], e.points[i]), n = Math.max(1, Math.ceil(d / 5))
    for (let k = 0; k <= n; k++) pts.push({ x: e.points[i - 1].x + (e.points[i].x - e.points[i - 1].x) * k / n, z: e.points[i - 1].z + (e.points[i].z - e.points[i - 1].z) * k / n })
  }
  if (!pts.some(inBox)) continue
  const crosses = waterRings.length ? pts.some((p) => inWater(p.x, p.z)) : bd >= MIN_WATER_DECK
  if (!crosses) continue
  bridges.push({ name, edges: es, endA: A.p, endB: B.p, nodeA: best[0], nodeB: best[1], hA: A.h, hB: B.h, length: bd })
}
if (!bridges.length) { console.log(`${city}: no rideable bridge found${only ? ` matching "${only}"` : ''}`); process.exit(0) }

/** ---- BD TOPO and lidar around the bridgeheads ---- */
let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity
for (const b of bridges) for (const p of [b.endA, b.endB]) { bx0 = Math.min(bx0, p.x); bx1 = Math.max(bx1, p.x); bz0 = Math.min(bz0, p.z); bz1 = Math.max(bz1, p.z) }
const sw = proj.toLatLon({ x: bx0 - BOX_PAD, z: bz0 - BOX_PAD }), ne = proj.toLatLon({ x: bx1 + BOX_PAD, z: bz1 + BOX_PAD })
const ll = (p: P) => proj.toLatLon(p)
const toLocal = (lat: number, lon: number): P => proj.toLocal({ lat, lon })
const guard = async <T>(label: string, f: () => Promise<T>, d: T): Promise<T> => { try { return await f() } catch (e) { console.error(`${label}: ${(e as Error).message.slice(0, 80)} (skipped)`); return d } }
const roads: BtFeature[] = await guard('BD TOPO roads', () => fetchBdTopo('troncon_de_route', sw.lat, sw.lon, ne.lat, ne.lon), [])
const lines: BtFeature[] = await guard('BD TOPO lines', () => fetchBdTopo('construction_lineaire', sw.lat, sw.lon, ne.lat, ne.lon), [])
fillNoZ(roads)
const rsegs = btSegs(roads, toLocal)
const lidar = await guard('lidar', () => ignLidar({ south: sw.lat, north: ne.lat, west: sw.lon, east: ne.lon }, 1024), null)
const lidarH = (p: P): number | null => { if (!lidar) return null; const q = ll(p), v = lidar.at(q.lat, q.lon); return v === null ? null : v - datum }
const ground = (p: P): number | null => terrain ? terrain.rawHeightAt(p.x, p.z) : lidarH(p)

/** ---- geometry helpers ---- */
const nodes = new Map<number, RideEdge[]>()
for (const e of edges) for (const n of [e.a, e.b]) { const l = nodes.get(n); if (l) l.push(e); else nodes.set(n, [e]) }
const endH = (e: RideEdge, n: number): number => e.heights?.[n === e.a ? 0 : e.heights.length - 1] ?? NaN
const endPt = (e: RideEdge, n: number): P => e.points[n === e.a ? 0 : e.points.length - 1]
function nearSeg(a: P, b: P, p: P): { d: number; t: number } {
  const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1e-9
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / L2))
  return { d: Math.hypot(a.x + dx * t - p.x, a.z + dz * t - p.z), t }
}
const distToEdge = (e: RideEdge, p: P): number => { let d = Infinity; for (let i = 1; i < e.points.length; i++) d = Math.min(d, nearSeg(e.points[i - 1], e.points[i], p).d); return d }
const inWindow = (br: Bridge, p: P): boolean => dist(p, br.endA) <= AUDIT_R || dist(p, br.endB) <= AUDIT_R
const edgeInWindow = (br: Bridge, e: RideEdge): boolean => e.points.some((p) => inWindow(br, p))
const unit = (a: P, b: P): P => { const L = dist(a, b) || 1; return { x: (b.x - a.x) / L, z: (b.z - a.z) / L } }

/** a way followed along its name from point `q` of edge `e` in direction `dir`, `len` metres (continuing on the straightest same-named edge) */
/** LOWER_HALF m along BD TOPO's sol-0 roads from parameter t of seg s0, forward (+1) or back (-1): at each joint the next sol-0 seg
 *  with an end within LOWER_JOIN m and the smallest turn (<= LOWER_TURN_DEG) */
function followBt(s0: (typeof rsegs)[number], t: number, dir: 1 | -1, len: number): P {
  let ax = s0.ax + (s0.bx - s0.ax) * t, az = s0.az + (s0.bz - s0.az) * t
  let ex = dir > 0 ? s0.bx : s0.ax, ez = dir > 0 ? s0.bz : s0.az, left = len
  const used = new Set([s0])
  for (let n = 0; n < 200; n++) {
    const L = Math.hypot(ex - ax, ez - az)
    if (L >= left) return { x: ax + (ex - ax) * left / (L || 1), z: az + (ez - az) * left / (L || 1) }
    left -= L
    const ux = (ex - ax) / (L || 1), uz = (ez - az) / (L || 1)
    let best: { nx: number; nz: number; s: (typeof rsegs)[number]; c: number } | null = null
    for (const s of rsegs) {
      if (used.has(s) || btSol(s.f) !== '0' || String(s.f.props.nature) === 'Escalier') continue
      for (const [px, pz, qx, qz] of [[s.ax, s.az, s.bx, s.bz], [s.bx, s.bz, s.ax, s.az]]) {
        if (Math.hypot(px - ex, pz - ez) > LOWER_JOIN) continue
        const l2 = Math.hypot(qx - px, qz - pz) || 1, c = ((qx - px) * ux + (qz - pz) * uz) / l2
        if (c >= Math.cos(LOWER_TURN_DEG * Math.PI / 180) && (!best || c > best.c)) best = { nx: qx, nz: qz, s, c }
      }
    }
    if (!best) return { x: ex, z: ez }
    used.add(best.s); ax = ex; az = ez; ex = best.nx; ez = best.nz
  }
  return { x: ex, z: ez }
}
function follow(e: RideEdge, q: P, dir: P, len: number): P {
  let cur = e, at = q, d = dir, left = len
  const seen = new Set<number>()
  for (let n = 0; n < 40 && left > 0; n++) {
    seen.add(cur.id)
    let bestI = 1, bestD = Infinity
    for (let i = 1; i < cur.points.length; i++) { const s = nearSeg(cur.points[i - 1], cur.points[i], at); if (s.d < bestD) { bestD = s.d; bestI = i } }
    const fwd = (cur.points[bestI].x - cur.points[bestI - 1].x) * d.x + (cur.points[bestI].z - cur.points[bestI - 1].z) * d.z >= 0
    const pts = fwd ? cur.points.slice(bestI) : cur.points.slice(0, bestI).reverse()
    for (const p of pts) {
      const s = dist(at, p)
      if (s >= left) return { x: at.x + (p.x - at.x) * left / (s || 1), z: at.z + (p.z - at.z) * left / (s || 1) }
      left -= s; if (s > 0.01) d = unit(at, p); at = p
    }
    const node = fwd ? cur.b : cur.a
    let pick: RideEdge | null = null, pc = -2
    for (const o of (nodes.get(node) ?? []).filter((o) => !seen.has(o.id) && (o.name ?? '') === (cur.name ?? '') && !o.bridge)) {
      const away = o.a === node ? o.points[Math.min(1, o.points.length - 1)] : o.points[Math.max(0, o.points.length - 2)]
      const u = unit(at, away), c = u.x * d.x + u.z * d.z
      if (c > pc) { pc = c; pick = o }
    }
    if (!pick || pc < 0.3) break
    cur = pick
  }
  return at
}

/** ---- (a) legs ---- */
function legsOf(br: Bridge): { legs: Leg[]; info: string[] } {
  const legs: Leg[] = [], info: string[] = []
  const nm = br.name
  legs.push({ bridge: nm, leg: 'deck A>B', from: br.endA, to: br.endB, fromName: nm, toName: nm, maxRatio: DECK_RATIO })
  legs.push({ bridge: nm, leg: 'deck B>A', from: br.endB, to: br.endA, fromName: nm, toName: nm, maxRatio: DECK_RATIO })
  const ends: [string, P, P][] = [['A', br.endA, br.endB], ['B', br.endB, br.endA]]
  // upper quai: the nearest non-bridge road-like way crossing the deck's line at an angle > QUAI_ANGLE
  for (const [tag, E, O] of ends) {
    const du = unit(O, E)
    const cands: { e: RideEdge; q: P; t: P; d: number }[] = []
    for (const e of edges) {
      let best: { e: RideEdge; q: P; t: P; d: number } | null = null
      if (e.bridge || e.tunnel || (e.name ?? '') === nm || !(CROSS_NAME.test(e.name ?? '') || ROAD_KINDS.test(e.kind ?? ''))) continue
      for (let i = 1; i < e.points.length; i++) {
        const s = nearSeg(e.points[i - 1], e.points[i], E)
        if (s.d > QUAI_FIND || (best && s.d >= best.d)) continue
        const t = unit(e.points[i - 1], e.points[i])
        if (Math.abs(t.x * du.x + t.z * du.z) > Math.cos(QUAI_ANGLE * Math.PI / 180)) continue
        best = { e, q: { x: e.points[i - 1].x + (e.points[i].x - e.points[i - 1].x) * s.t, z: e.points[i - 1].z + (e.points[i].z - e.points[i - 1].z) * s.t }, t, d: s.d }
      }
      if (best) cands.push(best)
    }
    cands.sort((a, b) => a.d - b.d)
    let best: { e: RideEdge; q: P; t: P; d: number } | null = null, P1: P = E, P2: P = E, stubs = 0
    for (const c of cands) {
      P1 = follow(c.e, c.q, c.t, QUAI_LEN); P2 = follow(c.e, c.q, { x: -c.t.x, z: -c.t.z }, QUAI_LEN)
      if (dist(P1, P2) >= QUAI_MIN_LEG) { best = c; break }
      stubs++
    }
    if (!best) { info.push(`upper quai ${tag}: no cross way within ${QUAI_FIND} m${stubs ? ` (${stubs} stubs under ${QUAI_MIN_LEG} m)` : ''} (no leg)`); continue }
    const qn = best.e.name || undefined, lab = (qn ?? best.e.kind ?? '').slice(0, 14)
    legs.push({ bridge: nm, leg: `quai ${tag} ${lab} >`, from: P2, to: P1, fromName: qn, toName: qn, maxRatio: QUAI_RATIO, avoid: [nm] })
    legs.push({ bridge: nm, leg: `quai ${tag} ${lab} <`, from: P1, to: P2, fromName: qn, toName: qn, maxRatio: QUAI_RATIO, avoid: [nm] })
  }
  // lower quai: BD TOPO sol-0 roads under sol-1 troncons that lie along this deck
  const bridgeSegs = rsegs.filter((s) => {
    if (btSol(s.f) !== '1') return false
    const m = { x: (s.ax + s.bx) / 2, z: (s.az + s.bz) / 2 }
    let near: { d: number; u: P } | null = null
    for (const e of br.edges) for (let i = 1; i < e.points.length; i++) {
      const d = nearSeg(e.points[i - 1], e.points[i], m).d
      if (d <= BT_DECK_NEAR && (!near || d < near.d)) near = { d, u: unit(e.points[i - 1], e.points[i]) }
    }
    if (!near) return false
    const u = unit({ x: s.ax, z: s.az }, { x: s.bx, z: s.bz })
    return Math.abs(u.x * near.u.x + u.z * near.u.z) >= Math.cos(BT_PARALLEL_DEG * Math.PI / 180)
  })
  // (a sol-0 road passes under only where BD TOPO's own deck z there stands UNDER_CLEAR m over it, inside both segments: a quai
  //  meeting the deck's end at grade is not a lower quai)
  const xs: { x: P; s0: (typeof rsegs)[number]; t: number }[] = []
  for (const s0 of rsegs) {
    if (btSol(s0.f) !== '0' || String(s0.f.props.nature) === 'Escalier') continue
    for (const s1 of bridgeSegs) {
      const c = cross({ x: s0.ax, z: s0.az }, { x: s0.bx, z: s0.bz }, { x: s1.ax, z: s1.az }, { x: s1.bx, z: s1.bz })
      if (!c) continue
      const z0 = s0.za + (s0.zb - s0.za) * c[0], z1 = s1.za + (s1.zb - s1.za) * c[1]
      if (z0 < -900 || z1 < -900 || z1 - z0 < UNDER_CLEAR) continue
      const x = { x: s0.ax + (s0.bx - s0.ax) * c[0], z: s0.az + (s0.bz - s0.az) * c[0] }
      if (xs.some((o) => dist(o.x, x) < LOWER_DEDUPE)) continue
      xs.push({ x, s0, t: c[0] })
    }
  }
  if (!xs.length) info.push('lower quai: no sol-0 road passes under the deck (no leg)')
  xs.slice(0, LOWER_MAX).forEach(({ x, s0, t }, i) => {
    // the leg's ends: LOWER_HALF m each way ALONG the BD TOPO road (its sol-0 chain, the straightest turn at each joint)
    // (an end off the ride graph, past the city's edge or on a road bikes may not ride, steps back LOWER_BACK m at a time to LOWER_MIN)
    const pick = (dir: 1 | -1): P | null => {
      for (let L = LOWER_HALF; L >= LOWER_MIN; L -= LOWER_BACK) {
        const q = followBt(s0, t, dir, L); if (dist(q, followBt(s0, t, dir, L + 1)) < 0.01) { if (process.env.SB_DEBUG) console.log(`  dbg ${btName(s0.f)} dir ${dir} chain ends before ${L}`); continue } // (the chain ends short of L)
        const sn = nearestOnGraph(g, q, (e) => !!(e as RideEdge).bridge); if (sn && sn.d <= MAX_SNAP) return q
        if (process.env.SB_DEBUG) { const a = ll(q); console.log(`  dbg ${btName(s0.f)} dir ${dir} L ${L} at ${a.lat.toFixed(5)},${a.lon.toFixed(5)} snap ${sn?.d.toFixed(0)}`) }
      }
      return null
    }
    const P1 = pick(1), P2 = pick(-1), en = btName(s0.f) || undefined
    if (!P1 || !P2) { info.push(`lower quai ${en ?? 'unnamed'}: the road under the deck has no ride-graph way within ${MAX_SNAP} m ${LOWER_MIN}..${LOWER_HALF} m along it on ${!P1 && !P2 ? 'either side' : 'one side'} (no leg)`); return }
    legs.push({ bridge: nm, leg: `lower quai #${i + 1} ${(en ?? 'unnamed').slice(0, 14)}`, from: P2, to: P1,
      maxRatio: LOWER_RATIO, under: UNDER_CLEAR, either: true, offDeck: true })
    void x
  })
  // slips: Bretelle troncons with an end near a deck end
  const seen = new Set<string>()
  const rideNear = (p: P) => { const q = nearestOnGraph(g, p, (e) => !!(e as RideEdge).bridge); return q && q.d <= SLIP_ROAD ? g.edges.get(q.edgeId)! : null }
  for (const f of roads) {
    if (String(f.props.nature) !== 'Bretelle') continue
    for (const part of f.coords) {
      const pl = part.map((v) => toLocal(v[1], v[0]))
      for (const [tag, E] of ends) for (const rev of [false, true]) {
        const line = rev ? [...pl].reverse() : pl
        if (dist(line[0], E) > SLIP_NEAR || seen.has(f.id + tag)) continue
        seen.add(f.id + tag)
        let left = SLIP_LEN, at = line[0]
        const mid: P[] = [at]
        for (let i = 1; i < line.length && left > 0; i++) {
          const s = dist(at, line[i])
          if (s >= left) { at = { x: at.x + (line[i].x - at.x) * left / s, z: at.z + (line[i].z - at.z) * left / s }; left = 0 } else { left -= s; at = line[i] }
          mid.push(at)
        }
        const m1 = rideNear(mid[Math.floor(mid.length / 2)]), m2 = rideNear(at)
        if (!m1 || !m2) { info.push(`slip ${tag} ${btName(f) || f.id}: not rideable (no OSM ride edge within ${SLIP_ROAD} m)`); continue }
        legs.push({ bridge: nm, leg: `slip ${tag} ${(m2.name ?? m2.kind ?? '').slice(0, 14)}`, from: E, to: at, fromName: nm, toName: m2.name || undefined, maxRatio: SLIP_RATIO })
      }
    }
  }
  return { legs, info }
}

/** ---- (b) audits ---- */
interface Audits { step: number; deckEnd: number; offGround: number; grade: number; wallGap: number | null; railBridge: number; trench: number; zigzag: number }
/** where each audit hit is (lat,lon), printed under the bridge (the first AT_MAX) */
const AT_MAX = 12
const at = (p: P): string => { const q = ll(p); return `${q.lat.toFixed(6)},${q.lon.toFixed(6)}` }
let where: string[] = []
function audit(br: Bridge): Audits {
  where = []
  const win = edges.filter((e) => edgeInWindow(br, e) && e.heights && e.heights.length === e.points.length)
  // 1 step
  // (over the PACKAGE's ways, not the bike graph: Pont National's 6.1 m step was between an unnamed secondary and Quai de Bercy 96,
  //  neither of them in the bike graph; stairs and lifts out)
  const nodeH = new Map<number, number[]>(), nodeP = new Map<number, P>()
  for (const e of pkg.edges as PackedEdge[]) {
    if (!e.heights || e.kind === 'steps' || e.kind === 'elevator') continue
    const m = e.heights.length
    for (const [n, i] of [[e.a, 0], [e.b, m - 1]] as [number, number][]) {
      const p = { x: e.points[2 * i], z: e.points[2 * i + 1] }; if (!inWindow(br, p)) continue
      const l = nodeH.get(n) ?? []; l.push(e.heights[i]); nodeH.set(n, l); nodeP.set(n, p)
    }
  }
  let step = 0
  for (const [n, hs] of nodeH) { const f = hs.filter(Number.isFinite); if (f.length > 1 && Math.max(...f) - Math.min(...f) > STEP_DH) { step++; where.push(`step ${at(nodeP.get(n)!)} ${(Math.max(...f) - Math.min(...f)).toFixed(1)} m`) } }
  // 2 deckEnd
  let deckEnd = 0
  for (const [n, E] of [[br.nodeA, br.endA], [br.nodeB, br.endB]] as [number, P][]) {
    const dh = br.edges.map((e) => e.a === n || e.b === n ? endH(e, n) : NaN).find(Number.isFinite)
    if (dh === undefined) continue
    let h = (nodes.get(n) ?? []).filter((e) => !e.bridge).map((e) => endH(e, n)).filter(Number.isFinite)
    if (!h.length) {
      let best = 10, bh = NaN
      for (const e of edges) if (!e.bridge && e.heights) for (const m of [e.a, e.b]) { const d = dist(endPt(e, m), E); if (d < best) { best = d; bh = endH(e, m) } }
      h = Number.isFinite(bh) ? [bh] : []
    }
    // (a dip or hump just off the end: Pont National's Bd Poniatowski 38.4 at the deck, 34.4, 37.2 within 30 m, round 2)
    let dip = 0
    for (const e of nodes.get(n) ?? []) {
      if (e.bridge || !e.heights) continue
      const pts = e.a === n ? e.points : [...e.points].reverse(), hs = e.a === n ? e.heights : [...e.heights].reverse(), L = [0]
      for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + dist(pts[i - 1], pts[i]))
      let k = L.findIndex((v) => v >= DECK_REACH); if (k < 0) k = pts.length - 1
      for (let i = 1; i < k; i++) dip = Math.max(dip, Math.abs(hs[i] - (hs[0] + (hs[k] - hs[0]) * L[i] / (L[k] || 1))))
    }
    if (dip > DECK_DH) { deckEnd++; where.push(`deckEnd ${at(E)} dip/hump ${dip.toFixed(1)} m within ${DECK_REACH} m`) }
    else if (h.some((v) => Math.abs(v - dh) > DECK_DH)) { deckEnd++; where.push(`deckEnd ${at(E)} ${Math.max(...h.map((v) => Math.abs(v - dh))).toFixed(1)} m`) }
  }
  // 3 offGround ('others' for the mutual-nearest rule: the ride edges around the bridgeheads)
  const packedNear = edges.filter((e) => e.points.some((p) => dist(p, br.endA) <= AUDIT_R + 60 || dist(p, br.endB) <= AUDIT_R + 60))
    .map((e) => ({ id: e.id, points: e.points.flatMap((p) => [p.x, p.z]), oneway: e.oneway, bridge: e.bridge }) as unknown as PackedEdge)
  const packedById = new Map(packedNear.map((p) => [p.id, p]))
  let offGround = 0
  for (const e of win) {
    if (e.bridge || e.tunnel || (e as { ramp?: boolean }).ramp || (e as { raised?: boolean }).raised) continue
    const m = btMatchEdge(packedById.get(e.id)!, rsegs, (s) => btSol(s.f) === '0', packedNear)
    if (m.filter(Boolean).length < Math.ceil(e.points.length / 2)) continue
    if (e.points.some((p, i) => { const gr = ground(p); return m[i] && gr !== null && e.heights![i] - gr > OFF_DH })) { offGround++; if (process.env.SB_DEBUG) console.log(`  offGround edge ${e.id} ${e.name ?? ''}`) }
  }
  // 4 grade
  let grade = 0
  for (const e of win) { const ss = stretch(e, 0, e.length); if (ss.length > 1 && steepest(ss) > MAX_GRADE) grade++ }
  // 5 wallGap
  let wallGap: number | null = null
  const walls = pkg.quayWalls ?? []
  if (walls.length) {
    wallGap = 0
    const cellOf = new Map<string, number[]>()
    const key = (x: number, z: number) => `${Math.floor(x / 25)},${Math.floor(z / 25)}`
    walls.forEach((w, i) => { for (const [x, z] of [[w.ax, w.az], [w.bx, w.bz], [(w.ax + w.bx) / 2, (w.az + w.bz) / 2]]) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const k = key(x + dx * 25, z + dz * 25); const l = cellOf.get(k); if (l) l.push(i); else cellOf.set(k, [i]) } })
    const covered = (p: P): boolean => (cellOf.get(key(p.x, p.z)) ?? []).some((i) => nearSeg({ x: walls[i].ax, z: walls[i].az }, { x: walls[i].bx, z: walls[i].bz }, p).d <= WALL_NEAR)
    for (const f of lines) {
      if (!/^(Quai|Mur de soutènement)$/.test(String(f.props.nature)) || btSol(f) === '-1') continue
      for (const part of f.coords) {
        const smp: { p: P; c: boolean }[] = []
        for (let i = 1; i < part.length; i++) {
          const a = toLocal(part[i - 1][1], part[i - 1][0]), b = toLocal(part[i][1], part[i][0]), n = Math.max(1, Math.ceil(dist(a, b)))
          for (let k = 0; k < n; k++) { const p = { x: a.x + (b.x - a.x) * k / n, z: a.z + (b.z - a.z) * k / n }; smp.push({ p, c: covered(p) }) }
        }
        if (!smp.some((s) => s.c)) continue
        let run = 0
        const close = (): void => { if (run > WALL_GAP) wallGap!++; run = 0 }
        for (const s of smp) { if (!inWindow(br, s.p)) { close(); continue } if (s.c) close(); else run++ }
        close()
      }
    }
  }
  // 6 railBridge
  let railBridge = 0
  for (const r of pkg.rails ?? []) {
    if (!r.bridge || !r.heights) continue
    const pts: P[] = []
    for (let i = 0; i < r.points.length; i += 2) pts.push({ x: r.points[i], z: r.points[i + 1] })
    if (!pts.some((p) => inWindow(br, p))) continue
    if (pts.every((p, i) => { const gr = ground(p); return gr !== null && Math.abs(r.heights![i] - gr) <= RAIL_DH })) railBridge++
  }
  // 7 trench
  let trench = 0
  const bridgeEdges = edges.filter((e) => e.bridge && e.heights)
  if (lidar) for (const e of win) {
    if (e.bridge || e.tunnel) continue
    const L = e.points.map(lidarH)
    const dip = e.points.some((p, i) => {
      if (L[i] === null || L[i]! - e.heights![i] <= TRENCH_DH) return false
      if (bridgeEdges.some((b) => distToEdge(b, p) <= TRENCH_BRIDGE_R)) return false
      const ns = [i - 1, i + 1].filter((j) => j >= 0 && j < e.points.length)
      return ns.length > 0 && ns.every((j) => L[j] !== null && Math.abs(L[j]! - e.heights![j]) <= TRENCH_NEIGH)
    })
    if (dip) trench++
  }
  // 8 zigzag
  let zz = 0
  for (const e of win) { const p = zigzag(e); if (p) { zz++; where.push(`zigzag ${at(p)} edge ${e.id} ${e.name ?? e.kind}`) } }
  return { step, deckEnd, offGround, grade, wallGap, railBridge, trench, zigzag: zz }
}

/** ---- run ---- */
const rows: { name: string; pass: number; total: number; a: Audits; sum: number; legs: LegResult[]; info: string[] }[] = []
for (const br of bridges) {
  const { legs, info } = legsOf(br)
  const res = legs.map(runLeg)
  const a = audit(br)
  console.log(`\n== ${br.name} (${Math.round(br.length)} m, ends h ${br.hA.toFixed(1)} / ${br.hB.toFixed(1)}) ==`)
  for (const r of res) console.log(`${r.pass ? 'pass' : 'FAIL'}  ${r.leg.padEnd(34).slice(0, 34)} ${r.line}${r.pass ? '' : '\n      ' + r.why.join('; ')}`)
  for (const i of info) console.log(`  info: ${i}`)
  for (const w of where.slice(0, AT_MAX)) console.log(`  at: ${w}`)
  rows.push({ name: br.name, pass: res.filter((r) => r.pass).length, total: res.length, a, sum: a.step + a.deckEnd + a.offGround + a.grade + (a.wallGap ?? 0) + a.railBridge + a.trench + a.zigzag, legs: res, info })
}
rows.sort((p, q) => q.sum - p.sum)
const cellS = (v: number | null): string => v === null ? 'n/a' : String(v)
console.log(`\n${city} (datum ${datum}${pkg.quayWalls?.length ? '' : '; no quay walls shipped: wallGap skipped'}${lidar ? '' : '; no lidar: trench skipped'})`)
console.log(`${'bridge'.padEnd(26)} legs  | step deckEnd offGround grade wallGap railBridge trench zigzag | total`)
const tot = { pass: 0, total: 0, step: 0, deckEnd: 0, offGround: 0, grade: 0, wallGap: 0, railBridge: 0, trench: 0, zigzag: 0, sum: 0 }
for (const r of rows) {
  console.log(`${r.name.slice(0, 26).padEnd(26)} ${`${r.pass}/${r.total}`.padEnd(5)} | ${cellS(r.a.step).padStart(4)} ${cellS(r.a.deckEnd).padStart(7)} ${cellS(r.a.offGround).padStart(9)} ${cellS(r.a.grade).padStart(5)} ${cellS(r.a.wallGap).padStart(7)} ${cellS(r.a.railBridge).padStart(10)} ${cellS(r.a.trench).padStart(6)} ${cellS(r.a.zigzag).padStart(6)} | ${r.sum}`)
  tot.pass += r.pass; tot.total += r.total; tot.sum += r.sum
  for (const k of ['step', 'deckEnd', 'offGround', 'grade', 'wallGap', 'railBridge', 'trench', 'zigzag'] as const) tot[k] += r.a[k] ?? 0
}
console.log(`${'TOTAL'.padEnd(26)} ${`${tot.pass}/${tot.total}`.padEnd(5)} | ${String(tot.step).padStart(4)} ${String(tot.deckEnd).padStart(7)} ${String(tot.offGround).padStart(9)} ${String(tot.grade).padStart(5)} ${String(tot.wallGap).padStart(7)} ${String(tot.railBridge).padStart(10)} ${String(tot.trench).padStart(6)} ${String(tot.zigzag).padStart(6)} | ${tot.sum}`)
// the zigzag city-wide (every ride edge, not only the bridgehead windows)
const zigHits = [...g.edges.values()].filter((e) => e.heights && e.heights.length === e.points.length && zigzag(e)), zigCity = zigHits.length
console.log(`zigzag city-wide: ${zigCity} of ${g.edges.size} ride edges (>= ${ZIG_N} reversals > ${ZIG_DH} m within ${ZIG_WIN} m)`)
for (const e of zigHits.slice(0, AT_MAX)) console.log(`  at: zigzag ${at(zigzag(e)!)} edge ${e.id} ${e.name ?? e.kind}`)
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ city, datum, bridges: rows.map((r) => ({ name: r.name, legsPass: r.pass, legsTotal: r.total, ...r.a, total: r.sum, legs: r.legs.map((l) => ({ leg: l.leg, pass: l.pass, cause: l.cause, why: l.why })), info: r.info })), total: tot, zigzagCity: zigCity }, null, 1) + '\n')
process.exit(0)
