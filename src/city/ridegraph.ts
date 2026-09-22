/**
 * The graph the rider is steered through — derived from the map graph, never a replacement for it.
 *
 * OSM draws for maps, not for riding. In the Marais three edges in four are footways, half the road edges are
 * under ten metres, and a rider was asked "left, straight or right?" every 41 m — two thirds of the time
 * because a zebra crossing or a courtyard path touched the road (IMPROVEMENTS §1.2). The steering model is
 * right for the platform; the graph it was fed was wrong.
 *
 * So there are two graphs. The MAP graph is everything OSM drew, and the renderer, the crowd, the traffic,
 * the signs and the minimap keep using it — footways must still be painted and walked. The RIDE graph is
 * built from it by a chain of small rules, each testable on its own:
 *
 *    classify ──► largest, pruneStubs ──► collapseClusters ──► contract ──► mergeParallel ──► (collapse, contract again)
 *    which ways    one         a dual-carriageway    a node with     a boulevard drawn as two
 *    a bike or a   island      crossroads drawn as   two edges is    one-way ways becomes one
 *    runner uses               four nodes is one     not a question  street down its middle
 *
 * Every ride edge remembers the map edges it covers (`over`), so anything that needs the real street under
 * the rider — its surface, whether it is a bridge — can still find it, and a place named by a MAP edge id
 * (the package's start, `?start=`, the shot harness) is found on the ride graph with `locate`.
 */
import { angleDiff, bearing, distance, type Point } from './geo.ts'
import {
  UnionFind, buildGraph, departureBearing, exits, largestComponent, lengthOf,
  type CityGraph, type Edge, type Exit, type OverEntry,
} from './graph.ts'

export type RideMode = 'bike' | 'run'
export type RideEdge = Edge & { over: OverEntry[] }
export interface RideGraph extends CityGraph { edges: Map<number, RideEdge> }

/** Streets a bike is steered down. Pedestrian streets count: in Paris they ARE streets. */
const BIKE = new Set(['primary', 'secondary', 'tertiary', 'primary_link', 'secondary_link', 'tertiary_link',
  'residential', 'unclassified', 'living_street', 'pedestrian', 'cycleway', 'service'])
/** …and on foot, the paths as well. Steps stay out: a treadmill cannot climb them. */
const RUN_EXTRA = new Set(['footway', 'path'])
const NOT_A_STREET = new Set(['parking_aisle', 'driveway', 'drive-through', 'emergency_access'])

/** Connector edges shorter than this, between two real junctions, are one junction drawn as several. */
export const CLUSTER_EDGE = 12
/** …as long as the whole cluster fits inside this diagonal. */
export const CLUSTER_SPAN = 30

/** Hands out ids that cannot collide with OSM's: negative for nodes, a million upward for edges. */
export class Ids {
  private node = 0
  private edge = 1_000_000
  nextNode(): number { return --this.node }
  nextEdge(): number { return this.edge++ }
}

const layerOf = (e: Edge): number => e.layer ?? 0

/** Rule 1: which ways this rider is steered along at all. Tunnels never — nobody can see them. */
export function classify(edges: Edge[], mode: RideMode): RideEdge[] {
  return edges
    .filter((e) => {
      // tunnels and ways mapped below grade are not drawn (render/city.ts `onSurface`), so nobody rides them
      if (e.a === e.b || e.tunnel || ((e.layer ?? 0) < 0 && !e.bridge)) return false
      const k = e.kind ?? 'residential'
      if (k === 'service' && e.service && NOT_A_STREET.has(e.service)) return false
      return BIKE.has(k) || (mode === 'run' && RUN_EXTRA.has(k))
    })
    .map((e) => ({
      ...e, points: [...e.points], heights: e.heights ? [...e.heights] : undefined,
      over: e.over ?? [{ id: e.id, reversed: false, length: e.length }],
    }))
}

/** Rule 2: the largest connected island, again — the filter can strand a courtyard's service road. */
export const largest = <E extends Edge>(edges: E[]): E[] => largestComponent(edges)

function degrees(edges: Edge[]): Map<number, number> {
  const d = new Map<number, number>()
  for (const e of edges) {
    if (e.a === e.b) continue
    d.set(e.a, (d.get(e.a) ?? 0) + 1)
    d.set(e.b, (d.get(e.b) ?? 0) + 1)
  }
  return d
}

/** Every edge with a node remapped moved onto its new node; edges left joining a node to itself go. */
function reattach(edges: RideEdge[], moved: Map<number, { id: number; at: Point }>): RideEdge[] {
  const out: RideEdge[] = []
  for (const e of edges) {
    const na = moved.get(e.a)
    const nb = moved.get(e.b)
    if (!na && !nb) { out.push(e); continue }
    const a = na?.id ?? e.a
    const b = nb?.id ?? e.b
    if (a === b) continue // a connector inside the cluster, or a stub across a median: it is the junction now
    const points = [...e.points]
    if (na) points[0] = na.at
    if (nb) points[points.length - 1] = nb.at
    out.push({ ...e, a, b, points, length: lengthOf(points) })
  }
  return out
}

/**
 * Rule 3: junction clusters. A crossroads of two dual carriageways is four OSM nodes joined by four short
 * stubs, and turning left through it meant answering "straight, left, straight" in twenty metres. Short
 * edges between real junctions are unioned; a cluster that fits inside CLUSTER_SPAN becomes one node at its
 * centre. Never across layers — a bridge and the street under it are not a junction.
 */
export function collapseClusters(edges: RideEdge[], ids = new Ids()): RideEdge[] {
  const deg = degrees(edges)
  const layers = new Map<number, Set<number>>()
  const at = new Map<number, Point>()
  for (const e of edges) {
    for (const [n, p] of [[e.a, e.points[0]], [e.b, e.points[e.points.length - 1]]] as const) {
      let s = layers.get(n)
      if (!s) layers.set(n, (s = new Set()))
      s.add(layerOf(e))
      at.set(n, p)
    }
  }
  const sameLayer = (n: number, l: number): boolean => {
    const s = layers.get(n)!
    return s.size === 1 && s.has(l)
  }
  const uf = new UnionFind()
  const joined = new Set<number>()
  for (const e of edges) {
    if (e.a === e.b || e.length >= CLUSTER_EDGE) continue
    if ((deg.get(e.a) ?? 0) < 3 || (deg.get(e.b) ?? 0) < 3) continue
    if (!sameLayer(e.a, layerOf(e)) || !sameLayer(e.b, layerOf(e))) continue
    uf.union(e.a, e.b)
    joined.add(e.a)
    joined.add(e.b)
  }
  const groups = new Map<number, number[]>()
  for (const n of joined) {
    const r = uf.find(n)
    let g = groups.get(r)
    if (!g) groups.set(r, (g = []))
    g.push(n)
  }
  const moved = new Map<number, { id: number; at: Point }>()
  for (const members of groups.values()) {
    if (members.length < 2) continue
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, sx = 0, sz = 0
    for (const n of members) {
      const p = at.get(n)!
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z)
      sx += p.x; sz += p.z
    }
    if (Math.hypot(x1 - x0, z1 - z0) >= CLUSTER_SPAN) continue
    const c = { id: ids.nextNode(), at: { x: sx / members.length, z: sz / members.length } }
    for (const n of members) moved.set(n, c)
  }
  return reattach(edges, moved)
}

/** An edge the other way round: points, heights and the map edges inside it all flip. */
export function reverseEdge(e: RideEdge): RideEdge {
  return {
    ...e, a: e.b, b: e.a,
    points: [...e.points].reverse(),
    heights: e.heights ? [...e.heights].reverse() : undefined,
    over: [...e.over].reverse().map((o) => ({ ...o, reversed: !o.reversed })),
  }
}

/** Two edges meeting at `node` as one: the first ends there, the second starts there. */
function join(e1: RideEdge, e2: RideEdge, node: number, id: number): RideEdge {
  const p = e1.b === node ? e1 : reverseEdge(e1)
  const q = e2.a === node ? e2 : reverseEdge(e2)
  const points = [...p.points, ...q.points.slice(1)]
  const longer = p.length >= q.length ? p : q
  return {
    ...longer,
    id, a: p.a, b: q.b, points, length: lengthOf(points),
    heights: p.heights && q.heights ? [...p.heights, ...q.heights.slice(1)] : undefined,
    name: p.name ?? q.name,
    over: [...p.over, ...q.over],
  }
}

/**
 * Rule 4: a node with exactly two edges is not a decision. Merged when the names agree (or one has none);
 * otherwise the node stays and the navigator treats it as pass-through, which is what a street changing its
 * name halfway along is.
 */
export function contract(edges: RideEdge[], ids = new Ids()): RideEdge[] {
  const byId = new Map<number, RideEdge>()
  const adj = new Map<number, Set<number>>()
  const link = (e: RideEdge): void => {
    byId.set(e.id, e)
    for (const n of [e.a, e.b]) {
      let s = adj.get(n)
      if (!s) adj.set(n, (s = new Set()))
      s.add(e.id)
    }
  }
  const unlink = (e: RideEdge): void => {
    byId.delete(e.id)
    adj.get(e.a)?.delete(e.id)
    adj.get(e.b)?.delete(e.id)
  }
  for (const e of edges) link(e)
  const queue = [...adj.keys()]
  for (let guard = 0; queue.length > 0 && guard < 1_000_000; guard++) {
    const n = queue.pop()!
    const here = adj.get(n)
    if (!here || here.size !== 2) continue
    const [e1, e2] = [...here].map((id) => byId.get(id)!)
    if (e1.a === e1.b || e2.a === e2.b) continue
    if (e1.name && e2.name && e1.name !== e2.name) continue
    const o1 = e1.a === n ? e1.b : e1.a
    const o2 = e2.a === n ? e2.b : e2.a
    if (o1 === o2) continue // the two would close into a loop with no junction on it
    const merged = join(e1, e2, n, ids.nextEdge())
    unlink(e1)
    unlink(e2)
    adj.delete(n)
    link(merged)
    queue.push(o1, o2)
  }
  return [...byId.values()]
}

/** `n + 1` points evenly spaced along a polyline, with heights sampled alongside where there are any. */
function resample(points: Point[], heights: number[] | undefined, n: number): { pts: Point[]; hs?: number[] } {
  const cum = [0]
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + distance(points[i - 1], points[i]))
  const total = cum[cum.length - 1]
  const pts: Point[] = []
  const hs: number[] = []
  let k = 1
  for (let j = 0; j <= n; j++) {
    const s = (total * j) / n
    while (k < points.length - 1 && cum[k] < s) k++
    const seg = cum[k] - cum[k - 1]
    const t = seg === 0 ? 0 : Math.max(0, Math.min(1, (s - cum[k - 1]) / seg))
    pts.push({ x: points[k - 1].x + (points[k].x - points[k - 1].x) * t, z: points[k - 1].z + (points[k].z - points[k - 1].z) * t })
    if (heights) hs.push(heights[k - 1] + (heights[k] - heights[k - 1]) * t)
  }
  return { pts, hs: heights ? hs : undefined }
}

/** Nearest point on a polyline: distance to it, and how far along the polyline it is. */
export function project(points: Point[], p: Point): { d: number; s: number; t: number } {
  let best = { d: Infinity, s: 0, t: 0 }
  let acc = 0
  const total = lengthOf(points)
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len2 = dx * dx + dz * dz
    const len = Math.sqrt(len2)
    const u = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / len2))
    const d = Math.hypot(p.x - (a.x + dx * u), p.z - (a.z + dz * u))
    if (d < best.d) best = { d, s: acc + u * len, t: 0 }
    acc += len
  }
  best.t = total === 0 ? 0 : best.s / total
  return best
}

/** The two edges are one street drawn twice: same name, side by side, pointing the same way (either sense). */
export function isParallelPair(e: RideEdge, f: RideEdge): boolean {
  if (!e.name || e.name !== f.name || e.id === f.id) return false
  if (e.length <= 20 || f.length <= 20) return false
  if (e.a === f.a && e.b === f.b) { /* same ends: still a pair if they run side by side */ }
  const mid = (x: RideEdge): Point => resample(x.points, undefined, 2).pts[1]
  if (distance(mid(e), mid(f)) > 25) return false
  const be = bearing(e.points[0], e.points[e.points.length - 1])
  const bf = bearing(f.points[0], f.points[f.points.length - 1])
  const d = Math.abs(angleDiff(be, bf))
  if (Math.min(d, Math.PI - d) > (15 * Math.PI) / 180) return false
  // at least 60% of the shorter one must lie alongside the longer one, not off its end
  const [short, long] = e.length <= f.length ? [e, f] : [f, e]
  const samples = resample(short.points, undefined, Math.max(4, Math.ceil(short.length / 2))).pts
  let alongside = 0
  for (const p of samples) {
    const q = project(long.points, p)
    if (q.d < 25 && q.t > 0.001 && q.t < 0.999) alongside++
  }
  return alongside >= 0.6 * samples.length
}

/**
 * Rule 7: one path per street. A boulevard drawn as two one-way carriageways is replaced by one edge down
 * its middle, and the four end nodes are moved onto that edge's two ends; the stubs that crossed the median
 * become self-loops and go. The renderer still paints both carriageways from the map graph, so nothing
 * visible changes — the rider simply rides the middle of the boulevard.
 */
export function mergeParallel(edges: RideEdge[], ids = new Ids()): RideEdge[] {
  let cur = edges
  for (let guard = 0; guard < 5000; guard++) {
    const byName = new Map<string, RideEdge[]>()
    for (const e of cur) {
      if (!e.name || e.length <= 20) continue
      let g = byName.get(e.name)
      if (!g) byName.set(e.name, (g = []))
      g.push(e)
    }
    let pair: [RideEdge, RideEdge] | null = null
    search: for (const g of byName.values()) {
      for (let i = 0; i < g.length; i++) {
        for (let j = i + 1; j < g.length; j++) {
          if (isParallelPair(g[i], g[j]) && midline(g[i], g[j], ids, true)) { pair = [g[i], g[j]]; break search }
        }
      }
    }
    if (!pair) return cur
    const m = midline(pair[0], pair[1], ids, false)!
    cur = reattach(cur.filter((e) => e !== pair![0] && e !== pair![1]), m.moved)
    cur.push(m.edge)
  }
  return cur
}

/** The midline of a parallel pair and where the four old end nodes go, or null if the ends do not line up. */
function midline(e: RideEdge, f0: RideEdge, ids: Ids, dryRun: boolean)
  : { edge: RideEdge; moved: Map<number, { id: number; at: Point }> } | null {
  // point both the same way
  const de = { x: e.points[e.points.length - 1].x - e.points[0].x, z: e.points[e.points.length - 1].z - e.points[0].z }
  const df = { x: f0.points[f0.points.length - 1].x - f0.points[0].x, z: f0.points[f0.points.length - 1].z - f0.points[0].z }
  const f = de.x * df.x + de.z * df.z < 0 ? reverseEdge(f0) : f0
  const n = Math.max(2, Math.ceil(Math.max(e.length, f.length) / 5))
  const re = resample(e.points, e.heights, n)
  const rf = resample(f.points, f.heights, n)
  const pts = re.pts.map((p, i) => ({ x: (p.x + rf.pts[i].x) / 2, z: (p.z + rf.pts[i].z) / 2 }))
  const hs = re.hs && rf.hs ? re.hs.map((h, i) => (h + rf.hs![i]) / 2) : undefined
  const A = pts[0]
  const B = pts[pts.length - 1]
  const ends = [e.a, e.b, f.a, f.b]
  const at = [e.points[0], e.points[e.points.length - 1], f.points[0], f.points[f.points.length - 1]]
  const side = at.map((p) => (distance(p, A) <= distance(p, B) ? 0 : 1))
  // each edge must span the midline end to end, and no node may travel far to reach it
  if (side[0] === side[1] || side[2] === side[3]) return null
  for (let i = 0; i < 4; i++) if (distance(at[i], side[i] === 0 ? A : B) > 25) return null
  // a node that is both ends of the pair (a loop) cannot be moved to two places
  if (new Set(ends).size < 4 && (ends[0] === ends[1] || ends[2] === ends[3])) return null
  if (dryRun) return { edge: e, moved: new Map() }
  const na = { id: ids.nextNode(), at: A }
  const nb = { id: ids.nextNode(), at: B }
  const moved = new Map<number, { id: number; at: Point }>()
  for (let i = 0; i < 4; i++) {
    const target = side[i] === 0 ? na : nb
    const prior = moved.get(ends[i])
    if (prior && prior !== target) return null
    moved.set(ends[i], target)
  }
  const longer = e.length >= f.length ? e : f
  // half the distance between the two carriageways' centre lines: where the rider's own carriageway is
  let spread = 0
  for (let i = 0; i < re.pts.length; i++) spread += distance(re.pts[i], rf.pts[i])
  const lane = Math.round((spread / re.pts.length / 2) * 100) / 100
  const edge: RideEdge = {
    ...longer, id: ids.nextEdge(), a: na.id, b: nb.id, points: pts, heights: hs, length: lengthOf(pts),
    over: [...e.over, ...f.over], ...(lane > 1 ? { lane } : {}),
  }
  return { edge, moved }
}

/**
 * Driveways. An unnamed service way that leads nowhere is the way into a garage or a yard, and offering it
 * as a turn only offers a U-turn at the end of it. Pruned repeatedly, so a chain of them goes too; a NAMED
 * dead end is a real cul-de-sac and stays.
 */
export function pruneStubs(edges: RideEdge[]): RideEdge[] {
  let cur = edges
  for (let guard = 0; guard < 20; guard++) {
    const deg = degrees(cur)
    const dead = (e: RideEdge): boolean => (deg.get(e.a) ?? 0) === 1 || (deg.get(e.b) ?? 0) === 1
    // an unnamed service stub, or any dead end under 15 m — a scrap left where a street was cut or merged
    // (Rue de Birague's 6 m, Richard-Lenoir's 3 m), which announced "dead end, turning round" to nobody's benefit
    const next = cur.filter((e) => !(dead(e) && ((e.kind === 'service' && !e.name) || e.length < 15)))
    if (next.length === cur.length) return cur
    cur = next
  }
  return cur
}

/**
 * On a bike, the pedestrianised side of a street is not the street. OSM maps the wide paved half of Rue
 * Saint-Antoine as a pedestrian way beside the road, with the road's own name; contraction then stitched it
 * into the street's chain and the rider rode down the pavement. A pedestrian edge running alongside a
 * same-named road (`isParallelPair`) goes; a pedestrian street on its own stays.
 */
export function dropSidePaths(edges: RideEdge[]): RideEdge[] {
  const roadsByName = new Map<string, RideEdge[]>()
  for (const e of edges) {
    if (!e.name || e.kind === 'pedestrian' || e.foot) continue
    roadsByName.set(e.name, [...(roadsByName.get(e.name) ?? []), e])
  }
  return edges.filter((e) => {
    if (e.kind !== 'pedestrian' || !e.name) return true
    return !(roadsByName.get(e.name) ?? []).some((r) => isParallelPair(e, r))
  })
}

/**
 * A place whose OSM ways are a tangle no rule untangles — the Place de la Bastille: dozens of lanes, islands,
 * crossings and slip roads round the column (user: "paths near the colonne are really messed up … it makes
 * biking that area impossible"). Inside radius `R` of the centre the derived ride graph is thrown away and
 * replaced by what a rider understands: a circle of radius `r` round the centre, and a straight spoke out to
 * every way that crosses the boundary, joined to it where it crosses.
 */
export interface Roundabout { name: string; x: number; z: number; r: number; R: number }

export interface RideOverrides {
  roundabouts: Roundabout[]
  /** the ground, for the new edges' heights (the navigator rides an edge's own profile) */
  heightAt: (x: number, z: number) => number
}

/** Both crossings of a segment p→q with the circle of radius R round c, as t in 0..1 (may be none). */
function circleCuts(p: Point, q: Point, c: Point, R: number): number[] {
  const dx = q.x - p.x
  const dz = q.z - p.z
  const fx = p.x - c.x
  const fz = p.z - c.z
  const a = dx * dx + dz * dz
  const b = 2 * (fx * dx + fz * dz)
  const cc = fx * fx + fz * fz - R * R
  const disc = b * b - 4 * a * cc
  if (a < 1e-9 || disc < 0) return []
  const sq = Math.sqrt(disc)
  return [(-b - sq) / (2 * a), (-b + sq) / (2 * a)].filter((t) => t > 0 && t < 1)
}

/** Where a segment p→q meets the circle of radius R round c, as t in 0..1 (the crossing nearest p). */
function circleCut(p: Point, q: Point, c: Point, R: number): number | null {
  const dx = q.x - p.x
  const dz = q.z - p.z
  const fx = p.x - c.x
  const fz = p.z - c.z
  const a = dx * dx + dz * dz
  const b = 2 * (fx * dx + fz * dz)
  const cc = fx * fx + fz * fz - R * R
  const disc = b * b - 4 * a * cc
  if (a < 1e-9 || disc < 0) return null
  const sq = Math.sqrt(disc)
  const ts = [(-b - sq) / (2 * a), (-b + sq) / (2 * a)].filter((t) => t >= 0 && t <= 1)
  return ts.length ? Math.min(...ts) : null
}

/** The circle and spokes in place of everything inside a roundabout's boundary. */
export function applyRoundabout(es: RideEdge[], o: Roundabout, ids: Ids, heightAt: (x: number, z: number) => number): RideEdge[] {
  const c = { x: o.x, z: o.z }
  const inside = (p: Point): boolean => distance(p, c) < o.R
  const out: RideEdge[] = []
  /*
   * Each cut remembers where its street goes INSIDE the boundary (`inward`): its own points from the cut on
   * toward the centre, as far as the circle. The spoke follows them — a straight line in to the circle ran
   * through the blocks wherever the street curves on its way into the place (Rue de Charenton round the
   * Opéra, Rue de la Bastille).
   */
  const cuts: { node: number; at: Point; angle: number; name?: string; surface: Edge['surface']; inward: Point[] }[] = []
  const inwardFrom = (pts: Point[], i: number, step: 1 | -1, from: Point): Point[] => {
    const got: Point[] = []
    let prev = from
    for (let k = i; k >= 0 && k < pts.length; k += step) {
      if (!inside(pts[k])) break
      if (distance(pts[k], c) <= o.r) {
        // the street's own line carried on to the circle, so the spoke stays on its axis even where the next
        // point is far inside (a junction merged into one point near the centre)
        const t = circleCuts(prev, pts[k], c, o.r)[0]
        if (t !== undefined) got.push({ x: prev.x + (pts[k].x - prev.x) * t, z: prev.z + (pts[k].z - prev.z) * t })
        break
      }
      got.push(pts[k])
      prev = pts[k]
    }
    return got
  }
  const withLength = (e: RideEdge): RideEdge => ({ ...e, length: lengthOf(e.points) })
  const degree = new Map<number, number>()
  for (const e of es) { degree.set(e.a, (degree.get(e.a) ?? 0) + 1); degree.set(e.b, (degree.get(e.b) ?? 0) + 1) }
  for (const e of es) {
    const pts = e.points
    /*
     * A footway or cycle track that reaches the place is not given a spoke: its straight line in to the
     * circle ran through the blocks between the streets (user: "some paths go straight through buildings").
     * Only the streets are joined to the circle, which stands for everything inside it.
     */
    // …and only a street that actually runs into the place: one whose own line gets near the circle. An
    // impasse that merely starts inside the boundary (Impasse Jean Beausire) was spoked through a block.
    let reaches = false
    for (let i = 1; i < pts.length && !reaches; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      const dx = b.x - a.x
      const dz = b.z - a.z
      const t = Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.z - a.z) * dz) / (dx * dx + dz * dz || 1)))
      reaches = Math.hypot(a.x + dx * t - c.x, a.z + dz * t - c.z) <= o.r + 12
    }
    /*
     * …or one that ends at a real junction well inside the boundary: at the Bastille the place's outer lanes
     * run 80–110 m from the column, and the Faubourg Saint-Antoine, Roquette, Charenton and Lyon end at them,
     * short of the circle's reach above — so they were cut at the boundary and pruned (BUGS.md #2).
     */
    // (a real junction: an impasse that merely starts inside the boundary is left out, and so is a name change —
    // Rue Jean Beausire becoming Rue de la Bastille 101 m out was spoked through a block)
    const endsInside = (n: number, p: Point): boolean => (degree.get(n) ?? 0) >= 3 && inside(p)
    if (!reaches) reaches = endsInside(e.a, pts[0]) || endsInside(e.b, pts[pts.length - 1])
    // a cycle track named for its street stands for the street: `mergeParallel` can keep the track's kind for
    // the merged boulevard (Henri IV, Bourdon), and dropping it cut the boulevard off at the place
    const street = e.kind !== 'cycleway' || (e.name !== undefined && e.name !== o.name)
    const joins = !e.foot && street && reaches
    // untouched unless some vertex is inside or some segment dips through the circle between two outside ones
    const dips = (i: number): number[] => circleCuts(pts[i - 1], pts[i], c, o.R)
    let touches = pts.some(inside)
    for (let i = 1; i < pts.length && !touches; i++) if (dips(i).length === 2) touches = true
    if (!touches) { out.push(e); continue }
    const hs = e.heights && e.heights.length === pts.length ? e.heights : null
    // the runs of the edge outside the boundary, each cut where it crosses
    let run: Point[] = []
    let runH: number[] = []
    let runStart: number | null = inside(pts[0]) ? null : e.a
    let startInward: Point[] = []
    const finish = (endNode: number | null, endAt: Point | null, endH: number | null, endInward: Point[] = []): void => {
      if (endAt) { run.push(endAt); runH.push(endH ?? heightAt(endAt.x, endAt.z)) }
      // a path's run that ends at the boundary is dropped, not joined (above); one with both ends outside stays
      if (!joins && (runStart === null || endNode === null)) { run = []; runH = []; return }
      if (run.length >= 2 && lengthOf(run) >= 3) {
        let a = runStart
        let b = endNode
        if (a === null) { a = ids.nextNode(); cuts.push({ node: a, at: run[0], angle: bearing(c, run[0]), name: e.name, surface: e.surface, inward: startInward }) }
        if (b === null) { b = ids.nextNode(); cuts.push({ node: b, at: run[run.length - 1], angle: bearing(c, run[run.length - 1]), name: e.name, surface: e.surface, inward: endInward }) }
        out.push(withLength({ ...e, id: ids.nextEdge(), a, b, points: run, heights: runH }))
      }
      run = []
      runH = []
    }
    for (let i = 0; i < pts.length; i++) {
      const hi = hs ? hs[i] : heightAt(pts[i].x, pts[i].z)
      if (i > 0 && !inside(pts[i - 1]) && !inside(pts[i])) {
        // a segment passing right through the circle: the run ends at the first crossing, a new one begins at the second
        const ts = dips(i)
        if (ts.length === 2) {
          const p = pts[i - 1]
          const q = pts[i]
          const hp = hs ? hs[i - 1] : heightAt(p.x, p.z)
          const at = (t: number): Point => ({ x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t })
          finish(null, at(ts[0]), hp + (hi - hp) * ts[0], [])
          run = [at(ts[1])]
          runH = [hp + (hi - hp) * ts[1]]
          runStart = null
          startInward = []
        }
      }
      if (i > 0 && inside(pts[i - 1]) !== inside(pts[i])) {
        const p = pts[i - 1]
        const q = pts[i]
        const t = circleCut(p, q, c, o.R) ?? 0.5
        const at = { x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t }
        const hp = hs ? hs[i - 1] : heightAt(p.x, p.z)
        const h = hp + (hi - hp) * t
        // leaving the circle: a run begins, and its street inside runs back from i−1; entering: the run ends,
        // and its street inside runs on from i
        if (inside(p)) { run = [at]; runH = [h]; runStart = null; startInward = inwardFrom(pts, i - 1, -1, at) }
        else finish(null, at, h, inwardFrom(pts, i, 1, at))
      }
      if (!inside(pts[i])) { run.push(pts[i]); runH.push(hi) }
    }
    if (!inside(pts[pts.length - 1])) finish(e.b, null, null)
  }
  if (cuts.length === 0) return out
  // where each spoke meets the circle: straight on from the last of its street's inward points
  for (const cut of cuts) {
    const last = cut.inward.length ? cut.inward[cut.inward.length - 1] : cut.at
    cut.angle = bearing(c, last)
  }
  // the ring nodes: one per cut — merged only where two cuts are nearly the same street (within 5°), so each
  // spoke runs straight in along its own street rather than across the block to a shared point
  cuts.sort((p, q) => p.angle - q.angle)
  const ring: { node: number; angle: number; members: typeof cuts }[] = []
  for (const cut of cuts) {
    const last = ring[ring.length - 1]
    if (last && Math.abs(angleDiff(cut.angle, last.angle)) < 5 * DEG) last.members.push(cut)
    else ring.push({ node: ids.nextNode(), angle: cut.angle, members: [cut] })
  }
  if (ring.length > 1 && Math.abs(angleDiff(ring[0].angle, ring[ring.length - 1].angle)) < 5 * DEG) {
    ring[0].members.push(...ring.pop()!.members)
  }
  for (const rn of ring) {
    let sx = 0
    let sz = 0
    for (const m of rn.members) { sx += Math.sin(m.angle); sz += Math.cos(m.angle) }
    rn.angle = Math.atan2(sx, sz)
  }
  ring.sort((p, q) => p.angle - q.angle)
  const onRing = (a: number): Point => ({ x: c.x + Math.sin(a) * o.r, z: c.z + Math.cos(a) * o.r })
  const make = (a: number, b: number, points: Point[], name: string | undefined, surface: Edge['surface']): RideEdge =>
    withLength({
      id: ids.nextEdge(), a, b, points, length: 0, surface, width: 9, walk: 2.5, name, foot: false,
      kind: 'primary', oneway: false, heights: points.map((p) => heightAt(p.x, p.z)), over: [],
    })
  // the spokes: from each cut straight in to its ring node
  for (const rn of ring) {
    const end = onRing(rn.angle)
    for (const m of rn.members) {
      // along the street's own points inward, then the last short straight onto the circle
      const via = [m.at, ...m.inward, end]
      const pts: Point[] = [via[0]]
      for (let i = 1; i < via.length; i++) {
        const n = Math.max(1, Math.ceil(distance(via[i - 1], via[i]) / 5))
        for (let k = 1; k <= n; k++) pts.push({ x: via[i - 1].x + (via[i].x - via[i - 1].x) * (k / n), z: via[i - 1].z + (via[i].z - via[i - 1].z) * (k / n) })
      }
      out.push(make(m.node, rn.node, pts, m.name, m.surface))
    }
  }
  // the circle, as arcs between consecutive ring nodes
  if (ring.length >= 2) {
    for (let i = 0; i < ring.length; i++) {
      const a0 = ring[i].angle
      let a1 = ring[(i + 1) % ring.length].angle
      if (a1 <= a0) a1 += Math.PI * 2
      const n = Math.max(2, Math.ceil(((a1 - a0) / DEG) / 4))
      const pts: Point[] = []
      for (let k = 0; k <= n; k++) pts.push(onRing(a0 + (a1 - a0) * (k / n)))
      out.push(make(ring[i].node, ring[(i + 1) % ring.length].node, pts, o.name, 'asphalt'))
    }
  }
  return out
}

/**
 * A boulevard's two carriageways, too far apart to be merged (Richard-Lenoir runs either side of a 40 m
 * promenade), are two separate one-sided streets with hardly a way across — the rider on one found it ran on
 * for a kilometre and then ended (user: "easy to get trapped on … we should add a few paths to connect the
 * two sides"). So: from every junction node of one carriageway, a short link square across to the nearest
 * node of the other one of the same name, 15–55 m away — at most one every 90 m.
 */
export function linkCarriageways(edges: RideEdge[], ids: Ids): RideEdge[] {
  const named = new Map<string, RideEdge[]>()
  for (const e of edges) {
    // real streets only: not the synthetic circle and spokes of an override, not paths
    if (!e.name || e.foot || e.over.length === 0 || e.kind === 'service') continue
    const list = named.get(e.name)
    if (list) list.push(e)
    else named.set(e.name, [e])
  }
  // the split points wanted on each edge (metres along it), and the links between them
  const cuts = new Map<number, number[]>()
  const links: { a: { e: RideEdge; s: number }; b: { e: RideEdge; s: number } }[] = []
  const made: Point[] = []
  for (const list of named.values()) {
    if (list.length < 2) continue
    for (const e of list) {
      for (let s = 40; s < e.length - 20; s += 100) {
        const p = pointAt(e.points, s)
        if (made.some((q) => distance(q, p) < 90)) continue
        const p2 = pointAt(e.points, Math.min(e.length, s + 2))
        const dir = { x: p2.x - p.x, z: p2.z - p.z }
        const dl = Math.hypot(dir.x, dir.z) || 1
        let best: { o: RideEdge; s: number; d: number; at: Point } | null = null
        for (const o of list) {
          if (o === e) continue
          const pr = project(o.points, p)
          if (pr.d < 15 || pr.d > 55 || pr.s < 10 || pr.s > o.length - 10) continue
          const at = pointAt(o.points, pr.s)
          const cos = Math.abs(((at.x - p.x) * dir.x + (at.z - p.z) * dir.z) / (pr.d * dl))
          if (cos > 0.5) continue
          if (!best || pr.d < best.d) best = { o, s: pr.s, d: pr.d, at }
        }
        if (!best) continue
        ;(cuts.get(e.id) ?? cuts.set(e.id, []).get(e.id)!).push(s)
        ;(cuts.get(best.o.id) ?? cuts.set(best.o.id, []).get(best.o.id)!).push(best.s)
        links.push({ a: { e, s }, b: { e: best.o, s: best.s } })
        made.push({ x: (p.x + best.at.x) / 2, z: (p.z + best.at.z) / 2 })
      }
    }
  }
  if (links.length === 0) return edges
  // split each cut edge at its points, remembering the node made at each
  const nodeFor = new Map<string, number>()
  const out: RideEdge[] = []
  for (const e of edges) {
    const at = [...new Set(cuts.get(e.id) ?? [])].sort((p, q) => p - q)
    if (at.length === 0) { out.push(e); continue }
    const cum = [0]
    for (let i = 1; i < e.points.length; i++) cum.push(cum[i - 1] + distance(e.points[i - 1], e.points[i]))
    const hAt = (s: number): number | undefined => {
      if (!e.heights || e.heights.length !== e.points.length) return undefined
      let i = 1
      while (i < cum.length - 1 && cum[i] < s) i++
      const t = (s - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1])
      return e.heights[i - 1] + (e.heights[i] - e.heights[i - 1]) * Math.max(0, Math.min(1, t))
    }
    const bounds = [0, ...at, e.length]
    let prevNode = e.a
    for (let k = 1; k < bounds.length; k++) {
      const s0 = bounds[k - 1]
      const s1 = bounds[k]
      const pts: Point[] = [pointAt(e.points, s0)]
      const hs: number[] = []
      for (let i = 1; i < e.points.length - 1; i++) if (cum[i] > s0 + 0.01 && cum[i] < s1 - 0.01) pts.push(e.points[i])
      pts.push(pointAt(e.points, s1))
      const node = k === bounds.length - 1 ? e.b : ids.nextNode()
      if (k < bounds.length - 1) nodeFor.set(`${e.id}@${s1}`, node)
      if (e.heights && e.heights.length === e.points.length) {
        let run = s0
        hs.push(hAt(s0)!)
        for (let i = 1; i < pts.length; i++) { run += distance(pts[i - 1], pts[i]); hs.push(hAt(Math.min(s1, run))!) }
      }
      out.push({ ...e, id: ids.nextEdge(), a: prevNode, b: node, points: pts, length: lengthOf(pts),
        heights: hs.length === pts.length ? hs : undefined })
      prevNode = node
    }
  }
  for (const l of links) {
    const na = nodeFor.get(`${l.a.e.id}@${l.a.s}`)
    const nb = nodeFor.get(`${l.b.e.id}@${l.b.s}`)
    if (na === undefined || nb === undefined) continue
    const p = pointAt(l.a.e.points, l.a.s)
    const q = pointAt(l.b.e.points, l.b.s)
    const eh = (e: RideEdge, s: number): number => {
      if (!e.heights || e.heights.length !== e.points.length) return 0
      const k = Math.min(e.points.length - 1, Math.max(0, Math.round((s / e.length) * (e.points.length - 1))))
      return e.heights[k]
    }
    const ha = eh(l.a.e, l.a.s)
    const hb = eh(l.b.e, l.b.s)
    const n = Math.max(2, Math.ceil(distance(p, q) / 5))
    const pts: Point[] = []
    for (let i = 0; i <= n; i++) pts.push({ x: p.x + ((q.x - p.x) * i) / n, z: p.z + ((q.z - p.z) * i) / n })
    out.push({
      id: ids.nextEdge(), a: na, b: nb, points: pts, length: lengthOf(pts), surface: 'asphalt', width: 4, walk: 0,
      name: `${l.a.e.name} (across)`, foot: false, kind: 'residential', oneway: false, over: [],
      heights: pts.map((_, i) => ha + ((hb - ha) * i) / n),
    })
  }
  return out
}

/** The whole chain. */
export function rideGraph(edges: Edge[], mode: RideMode, overrides?: RideOverrides): RideGraph {
  const ids = new Ids()
  const classified = classify(edges, mode)
  let es = pruneStubs(largest(mode === 'bike' ? dropSidePaths(classified) : classified))
  es = contract(collapseClusters(es, ids), ids)
  es = mergeParallel(es, ids)
  es = largest(contract(collapseClusters(es, ids), ids))
  for (const o of overrides?.roundabouts ?? []) es = applyRoundabout(es, o, ids, overrides!.heightAt)
  // and the stubs a dropped path leaves behind, pruned as the chain prunes them the first time
  if (overrides?.roundabouts.length) es = pruneStubs(largest(es))
  // last, on the finished graph: the links across a split boulevard
  if (mode === 'bike') es = linkCarriageways(es, ids)
  return buildGraph(es) as RideGraph
}

const DEG = Math.PI / 180

/**
 * What the rider may do at a ride-graph node: `exits()` less the choices that are not real ones. An exit
 * more than 150° round is doubling back onto the other carriageway and is offered only if nothing else is;
 * two exits within 20° of each other are one choice (two carriageways leaving side by side), and the named
 * one, then the longer, is kept.
 */
export function rideExits(g: CityGraph, nodeId: number, arrivedOn: number | null): Exit[] {
  const all = exits(g, nodeId, arrivedOn)
  let keep = all.filter((x) => Math.abs(x.angle) <= 150 * DEG)
  if (keep.length === 0 && all.length > 0) keep = [all[0]]
  const pref = [...keep].sort((p, q) => {
    const ep = g.edges.get(p.edgeId)!
    const eq = g.edges.get(q.edgeId)!
    if (!!ep.name !== !!eq.name) return ep.name ? -1 : 1
    return eq.length - ep.length
  })
  const chosen: Exit[] = []
  for (const x of pref) {
    const b = departureBearing(g, x.edgeId, nodeId)
    if (chosen.some((c) => Math.abs(angleDiff(departureBearing(g, c.edgeId, nodeId), b)) < 20 * DEG)) continue
    chosen.push(x)
  }
  return chosen.sort((p, q) => Math.abs(p.angle) - Math.abs(q.angle))
}

/** The map edge under a point `s` metres along a ride edge (its own id on a map graph). */
export function mapEdgeAt(e: Edge, s: number): number {
  if (!e.over || e.over.length === 0) return e.id
  const total = e.over.reduce((t, o) => t + o.length, 0)
  // a ride edge's ends may have moved to a cluster centre, so its map edges are spread over it in proportion
  let target = (Math.max(0, Math.min(e.length, s)) / Math.max(1e-9, e.length)) * total
  for (const o of e.over) {
    if (target <= o.length) return o.id
    target -= o.length
  }
  return e.over[e.over.length - 1].id
}

/**
 * Where a place named by a MAP edge id is on the ride graph: the ride edge that covers it, and the point on
 * that edge nearest to `s` metres along the map edge. Geometric rather than by summing lengths, because a
 * ride edge's ends may have moved and a merged boulevard covers two map edges side by side. Null when the
 * map edge is not on the ride graph at all (a footway on a bike, a stub folded into a junction).
 */
export function locate(ride: RideGraph, map: CityGraph, mapEdgeId: number, s: number)
  : { edgeId: number; s: number; reversed: boolean } | null {
  const me = map.edges.get(mapEdgeId)
  if (!me) return null
  let host: RideEdge | null = null
  let entry: OverEntry | null = null
  for (const e of ride.edges.values()) {
    const o = e.over.find((x) => x.id === mapEdgeId)
    if (o) { host = e; entry = o; break }
  }
  if (!host || !entry) return null
  const p = pointAt(me.points, s)
  return { edgeId: host.id, s: project(host.points, p).s, reversed: entry.reversed }
}

function pointAt(points: Point[], s: number): Point {
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    const d = distance(points[i - 1], points[i])
    if (acc + d >= s) {
      const t = d === 0 ? 0 : (s - acc) / d
      return { x: points[i - 1].x + (points[i].x - points[i - 1].x) * t, z: points[i - 1].z + (points[i].z - points[i - 1].z) * t }
    }
    acc += d
  }
  return points[points.length - 1]
}

/** The ride graph's numbers, for the bake's report and the city test. */
export function rideStats(g: CityGraph): {
  edges: number; km: number; decisions: number; perKm: number; medianSpacing: number; nearDuplicates: number
  rawNearDuplicates: number
} {
  let km = 0
  for (const e of g.edges.values()) km += e.length / 1000
  const decision = new Set<number>()
  let dup = 0
  let rawDup = 0
  const within20 = (xs: Exit[], n: number): boolean => {
    for (let i = 0; i < xs.length; i++) {
      for (let j = i + 1; j < xs.length; j++) {
        const d = angleDiff(departureBearing(g, xs[i].edgeId, n), departureBearing(g, xs[j].edgeId, n))
        if (Math.abs(d) < 20 * DEG) return true
      }
    }
    return false
  }
  for (const [id, node] of g.nodes) {
    let isDecision = false
    let d1 = false
    let d2 = false
    for (const arr of node.edges) {
      const xs = rideExits(g, id, arr)
      if (xs.length >= 2) isDecision = true
      if (!d1 && within20(xs, id)) d1 = true
      if (!d2 && within20(exits(g, id, arr), id)) d2 = true
    }
    if (isDecision) decision.add(id)
    if (d1) dup++
    if (d2) rawDup++
  }
  // spacing: from each decision node along each edge, through non-decisions, to the next decision
  const spans: number[] = []
  for (const n of decision) {
    for (const first of g.nodes.get(n)!.edges) {
      let edgeId = first
      let at = n
      let len = 0
      for (let guard = 0; guard < 200; guard++) {
        const e = g.edges.get(edgeId)!
        len += e.length
        const next = e.a === at ? e.b : e.a
        if (decision.has(next) || next === at) break
        const onward = g.nodes.get(next)!.edges.filter((x) => x !== edgeId)
        if (onward.length !== 1) break
        at = next
        edgeId = onward[0]
      }
      spans.push(len)
    }
  }
  spans.sort((a, b) => a - b)
  return {
    edges: g.edges.size, km, decisions: decision.size, perKm: decision.size / Math.max(1e-9, km),
    medianSpacing: spans.length ? spans[Math.floor(spans.length / 2)] : 0,
    nearDuplicates: dup, rawNearDuplicates: rawDup,
  }
}
