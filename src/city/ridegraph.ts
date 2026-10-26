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
import { onSurface } from './package.ts'
import { Carriageways } from './carriageways.ts'
import { straightenJunctions, type Outside } from './junction-shape.ts'

export type RideMode = 'bike' | 'run'
export type RideEdge = Edge & { over: OverEntry[] }
export interface RideGraph extends CityGraph { edges: Map<number, RideEdge> }

/** Streets a bike is steered down. Pedestrian streets count: in Paris they ARE streets. */
const BIKE = new Set(['primary', 'secondary', 'tertiary', 'primary_link', 'secondary_link', 'tertiary_link',
  'residential', 'unclassified', 'living_street', 'pedestrian', 'cycleway', 'service'])
/**
 * …and the great bridges, which are motorways and would otherwise be left out with the rest of the freeway
 * network (user, 2026-09-22: "we should expand the box to include the whole east span of the bay bridge. and the
 * golden gate. i want to bike on them!!!"). Only a way that IS the bridge: the tools' wide query fetches
 * motorways only where they are bridges, so nothing else of the freeway is in the graph to begin with.
 */
const RIDEABLE_MOTORWAY = new Set(['motorway', 'trunk', 'motorway_link', 'trunk_link'])
/**
 * …of which these are FREEWAYS: no pavement, no frontage, one way. A `trunk` is not — in an American city it is a
 * big street (Van Ness, Tillary Street, the Brooklyn Bridge's own roadway), ridden either way like any other.
 */
const FREEWAY = new Set(['motorway', 'motorway_link'])
/**
 * …and on foot, the paths as well — and the public stairways. They were left out once ("a treadmill cannot climb
 * them"), but a runner on a treadmill climbs a virtual stair at their own pace like any hill, and in San
 * Francisco the stairways ARE where people run (user, 2026-09-22: "there are SO MANY public stairs… we need to
 * have a way to insert stairs"; the Filbert, Greenwich and Lyon Street steps). The bike graph still has none.
 */
/**
 * `track` and `bridleway` joined footway/path/steps here for the Presidio and Golden Gate Park (user,
 * 2026-09-22: "the stairs down to the Presidio (and trail) are also huge for runners"): a fire road or a
 * bridle path is exactly the kind of ground a runner covers, and until now `classify` would have dropped
 * either even once `tools/overpass.ts` started fetching them. Left out of BIKE on purpose — the handful of
 * `track` ways found in the Presidio box carry `tracktype=grade4`/`grade5` and one is tagged `bicycle=no`,
 * so calling them rideable for a bike would be a guess this data does not support; a bike is still steered
 * down `cycleway`/`pedestrian`/`service` as before.
 */
const RUN_EXTRA = new Set(['footway', 'path', 'steps', 'track', 'bridleway'])
const NOT_A_STREET = new Set(['parking_aisle', 'driveway', 'drive-through', 'emergency_access'])

/**
 * Connector edges shorter than this, between two real junctions, are one junction drawn as several — and the
 * cluster must fit inside the span. An American grid's junctions are far bigger than a European one's: a
 * boulevard with service lanes (San Francisco's Octavia, the Embarcadero) is four or six nodes spread over
 * forty metres, and at Paris's figures they stayed separate and the rider was asked three questions crossing
 * one intersection (BUGS.md #52).
 */
export const CLUSTER_EDGE = 12
export const CLUSTER_SPAN = 30
export const WIDE_CLUSTER_EDGE = 20
export const WIDE_CLUSTER_SPAN = 48

/** Hands out ids that cannot collide with OSM's: negative for nodes, a million upward for edges. */
export class Ids {
  private node = 0
  private edge = 1_000_000
  nextNode(): number { return --this.node }
  nextEdge(): number { return this.edge++ }
}

const layerOf = (e: Edge): number => e.layer ?? 0

/** Rule 1: which ways this rider is steered along at all. Tunnels never — nobody can see them. */
const k0 = (e: Edge): string => e.kind ?? 'residential'

export function classify(edges: Edge[], mode: RideMode): RideEdge[] {
  return edges
    .filter((e) => {
      // tunnels and ways mapped below grade are not drawn (render/city.ts `onSurface`), so nobody rides them — except
      // a street tunnel under a hill (`bore`, tools/tunnels.ts), which is drawn as a tunnel and ridden through
      if (e.a === e.b || (!onSurface(e) && !e.bore)) return false
      // a way rising more than it runs is a lift or a stair core drawn as a bridge (Embarcadero Center's 78924 climbs 8 m
      // in 4) — not drawn (render/city.ts `steeperThanWall`), so not ridden: the route went straight up the air
      // (stairs are exempt: Embarcadero Center's spiral stairs are short OSM ways climbing 8 m, and they ARE the way up)
      if (k0(e) !== 'steps' && e.heights && e.heights.some((h, i) => i > 0 && Math.abs(h - e.heights![i - 1]) > Math.max(1.5,
        Math.hypot(e.points[i].x - e.points[i - 1].x, e.points[i].z - e.points[i - 1].z)))) return false
      const k = e.kind ?? 'residential'
      if (k === 'service' && e.service && NOT_A_STREET.has(e.service)) return false
      // an unnamed service road on a bridge is a garage's own ramp or a loading bridge — San Francisco's beside the
      // Stockton Tunnel's south portal climbs from the Sutter-Stockton garage to Bush Street. Nothing to ride to
      // (owner, 2026-09-29: "parking structures are useless in this game"); the stub left joining it to the street
      // goes with the driveways (`pruneStubs`)
      if (k === 'service' && !e.name && e.bridge) return false
      // a car park's ramp down into it: a dead end into the ground (BUGS.md #20 — 20 of the audit's dead ends)
      if (e.name && /^(Accès|Sortie|Entrée|Rampe)\b.*\b[Pp]arking|^Allée de [Pp]arking/.test(e.name)) return false
      /*
       * A FREEWAY only where the region rides it (`ridden`: the Bay Bridge's decks, the ramps chosen at each end —
       * src/city/sf/bridges.ts). The owner, 2026-09-30: cut off "all the overpasses and on-ramps from the ride
       * network EXCEPT the ones we want cyclists to actually use, otherwise users are going to get lost and stuck
       * in a maze of paths that doesn't quite actually work" — and the route the game plans goes where the network
       * goes. A trunk road is a city street here (Van Ness, Tillary Street), and stays.
       */
      if (FREEWAY.has(k)) return !!e.ridden
      // a trail in a zone that opens its trails to bikes (`trails: 'bike'`): the Lands End trail down to Sutro Baths
      if (e.trail && (k === 'footway' || k === 'path' || k === 'track' || k === 'bridleway')) return true
      return BIKE.has(k) || RIDEABLE_MOTORWAY.has(k) || (mode === 'run' && RUN_EXTRA.has(k))
    })
    .map((e) => ({
      ...e, points: [...e.points], heights: e.heights ? [...e.heights] : undefined,
      over: e.over ?? [{ id: e.id, reversed: false, length: e.length }],
    }))
}

/**
 * Would a rider entering `e` from junction `from` be going the wrong way up a one-way FREEWAY? A bike rides an
 * ordinary one-way street either way in this game (the city is full of them, and nobody is sent round the block);
 * a freeway is another matter — the Bay Bridge's two roadways are one way each, five lanes of traffic, and the
 * rider who took the lower one westbound met all of it head on (2026-09-30). So such an edge is never offered as an
 * exit (`rideExits`) and never routed along (sim/route.ts).
 */
export function againstFreeway(e: Pick<Edge, 'a' | 'b' | 'oneway' | 'onewayBack' | 'kind'>, from: number): boolean {
  if (!e.oneway || !FREEWAY.has(e.kind ?? '')) return false
  return e.onewayBack ? e.a === from : e.b === from
}

/**
 * Rule 1a: a ONE-WAY freeway that leads nowhere, or comes from nowhere, is not ridden. The Bay Bridge's east span
 * runs off the edge of San Francisco's box: eastbound it is three kilometres to a dead end with no way back but
 * the wrong way up a freeway, and it is what "straight on" means out of the Yerba Buena tunnel — so the rider who
 * did nothing was taken there (2026-09-30). Pruned back, one way at a time, to the last junction with another way
 * out (the Treasure Island exit), and the carriageway nobody can get onto likewise, to the first ramp that joins it.
 */
export function pruneFreewayTraps(edges: RideEdge[]): RideEdge[] {
  let cur = edges
  for (;;) {
    const out = new Map<number, number>()
    const into = new Map<number, number>()
    const bump = (m: Map<number, number>, n: number): void => { m.set(n, (m.get(n) ?? 0) + 1) }
    for (const e of cur) {
      // what can be LEFT a junction by, and ARRIVED at it by: a two-way edge both, at both its ends
      bump(out, e.a); bump(into, e.b)
      if (!e.oneway) { bump(out, e.b); bump(into, e.a) }
    }
    const next = cur.filter((e) => !(e.oneway && FREEWAY.has(e.kind ?? '')
      && ((out.get(e.b) ?? 0) === 0 || (into.get(e.a) ?? 0) === 0)))
    if (next.length === cur.length) return cur
    cur = next
  }
}

/**
 * Rule 1b (bike): a dead end that a short run of footpaths joins to another street is not a dead end. The
 * Parc Rives de Seine promenade stops where the car tunnel under the Quai Henri IV begins, and the lower quay
 * carries on to Port Henri IV as four unnamed footway scraps (BUGS.md #9): from each dead end, the shortest
 * footpath chain under `JOIN_PATH` metres that reaches another ridden node is let in.
 */
export const JOIN_PATH = 100
export function joinDeadEnds(ridden: RideEdge[], all: Edge[], blocked?: (a: Point, b: Point) => boolean): RideEdge[] {
  const deg = degrees(ridden)
  // never a path through a building: a courtyard footway joined Passage Lhomme and Cité Popincourt through walls
  const clear = (e: Edge): boolean => !blocked || e.points.every((q, i) => i === 0 || !blocked(e.points[i - 1], q))
  const paths = all.filter((e) => e.a !== e.b && onSurface(e) && RUN_EXTRA.has(e.kind ?? '') && clear(e))
  if (paths.length === 0) return ridden
  const at = new Map<number, Edge[]>()
  for (const e of paths) for (const n of [e.a, e.b]) (at.get(n) ?? at.set(n, []).get(n)!).push(e)
  const added = new Map<number, RideEdge>()
  // the dead ends of driveways are not rescued: an unnamed service stub goes (`pruneStubs`); joined up by footways,
  // the Sutter-Stockton garage's ramp came in as a street down into the Stockton Tunnel's mouth (2026-09-29)
  const driveway = new Set<number>()
  for (const e of ridden) if (e.kind === 'service' && !e.name) { driveway.add(e.a); driveway.add(e.b) }
  // …nor a street's dead end just outside a TUNNEL MOUTH: the mouth is below the streets round it, and a 2 m piece of
  // Stockton beside the Stockton Tunnel's mouth was joined by its pavement up to Bush Street, 4 m above
  const mouths = new Set<number>()
  for (const e of ridden) if (e.bore) { mouths.add(e.a); mouths.add(e.b) }
  for (const e of ridden) {
    if (e.bore) continue
    if (mouths.has(e.a) && (deg.get(e.b) ?? 0) === 1) driveway.add(e.b)
    if (mouths.has(e.b) && (deg.get(e.a) ?? 0) === 1) driveway.add(e.a)
  }
  for (const [start, d] of deg) {
    if (d !== 1 || !at.has(start) || driveway.has(start)) continue
    // Dijkstra over the paths, small: stop at the first ridden node reached
    const dist = new Map<number, number>([[start, 0]])
    const via = new Map<number, Edge>()
    const open: number[] = [start]
    let goal: number | null = null
    while (open.length) {
      open.sort((x, y) => dist.get(x)! - dist.get(y)!)
      const n = open.shift()!
      // (nor rescued INTO one: a join ending on a driveway leads nowhere either)
      if (n !== start && deg.has(n) && !driveway.has(n)) { goal = n; break }
      for (const e of at.get(n) ?? []) {
        const m = e.a === n ? e.b : e.a
        const nd = dist.get(n)! + e.length
        if (nd > JOIN_PATH || nd >= (dist.get(m) ?? Infinity)) continue
        dist.set(m, nd)
        via.set(m, e)
        open.push(m)
      }
    }
    for (let n = goal; n !== null && n !== start;) {
      const e = via.get(n)!
      if (!added.has(e.id)) {
        added.set(e.id, { ...e, points: [...e.points], heights: e.heights ? [...e.heights] : undefined,
          over: e.over ?? [{ id: e.id, reversed: false, length: e.length }] } as RideEdge)
      }
      n = e.a === n ? e.b : e.a
    }
  }
  return added.size ? [...ridden, ...added.values()] : ridden
}

/**
 * Rule 1c: a path that STOPS SHORT. OSM's paths at Lands End and the Sutro Baths end a few metres from the path they
 * plainly meet — never joined at a node — and the rider rode to the end and had to turn round (owner, 2026-10-03,
 * twice). A path's dead end within 12 m of another way's node, at nearly the same height and with nothing built in
 * between, is carried on to that node: its last point moved there, and the node shared.
 */
export function closePathGaps(edges: RideEdge[], blocked?: (a: Point, b: Point) => boolean): RideEdge[] {
  const deg = degrees(edges)
  const nodeAt = new Map<number, { p: Point; y: number | undefined }>()
  for (const e of edges) {
    nodeAt.set(e.a, { p: e.points[0], y: e.heights?.[0] })
    nodeAt.set(e.b, { p: e.points[e.points.length - 1], y: e.heights?.[e.heights.length - 1] })
  }
  const CELL = 10
  const grid = new Map<string, number[]>()
  for (const [n, v] of nodeAt) {
    const k = `${Math.floor(v.p.x / CELL)},${Math.floor(v.p.z / CELL)}`
    ;(grid.get(k) ?? grid.set(k, []).get(k)!).push(n)
  }
  const near = (p: Point): number[] => {
    const out: number[] = []
    const cx = Math.floor(p.x / CELL), cz = Math.floor(p.z / CELL)
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) out.push(...(grid.get(`${cx + i},${cz + j}`) ?? []))
    return out
  }
  const moved = new Map<number, number>()
  // (a node another end has been joined TO stays where it is: two dead ends facing each other each picked the other,
  // and both moved — swapped, not joined)
  const targets = new Set<number>()
  for (const e of edges) {
    if (!RUN_EXTRA.has(e.kind ?? '') && e.kind !== 'pedestrian') continue
    for (const end of ['a', 'b'] as const) {
      const n = e[end]
      if ((deg.get(n) ?? 0) !== 1 || moved.has(n) || targets.has(n)) continue
      const me = nodeAt.get(n)!
      let best: number | null = null
      let bd = 12
      for (const m of near(me.p)) {
        if (m === e.a || m === e.b || moved.has(m)) continue
        const o = nodeAt.get(m)!
        const d = distance(me.p, o.p)
        if (d >= bd) continue
        if (me.y !== undefined && o.y !== undefined && Math.abs(me.y - o.y) > 2.5) continue
        if (blocked?.(me.p, o.p)) continue
        bd = d
        best = m
      }
      if (best !== null) { moved.set(n, best); targets.add(best) }
    }
  }
  if (moved.size === 0) return edges
  return edges.map((e) => {
    const ta = moved.get(e.a)
    const tb = moved.get(e.b)
    if (ta === undefined && tb === undefined) return e
    const points = [...e.points]
    const heights = e.heights ? [...e.heights] : undefined
    if (ta !== undefined) { points.unshift(nodeAt.get(ta)!.p); heights?.unshift(nodeAt.get(ta)!.y ?? heights[0]) }
    if (tb !== undefined) { points.push(nodeAt.get(tb)!.p); heights?.push(nodeAt.get(tb)!.y ?? heights[heights.length - 1]) }
    return { ...e, a: ta ?? e.a, b: tb ?? e.b, points, heights, length: lengthOf(points) }
  })
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

/**
 * BUGS.md #194. An endpoint moved to a cluster centre can land PAST the vertices next to it: the centre of a
 * junction cluster is up to a span away, and on a 10 m stub or the last few metres of a street into the
 * junction it overshoots the neighbouring vertex. Nothing removed the vertices it passed, so the polyline
 * ran out and came back — 43 vertices on 41 SF ride edges turned more than 120°, a rider riding the same
 * ground twice, and a hazard on a fast descent. (Trimming rather than capping the move: a cap would leave
 * the edge short of the junction, which is a gap, and the junction's own position is what #52 depends on.)
 *
 * So: after moving an end, drop the vertices that are now behind it — those the new endpoint has stepped
 * back over (the step onto the endpoint reverses the line by more than 120°), and only within the distance
 * the endpoint moved, so a real hairpin further along the street is never touched. Heights go with them.
 */
const REVERSE = Math.cos(120 * (Math.PI / 180)) // dot below this is a doubling back, not a bend
function trimBehind(points: Point[], heights: number[] | undefined, fromStart: boolean, moved: number)
  : { points: Point[]; heights?: number[] } {
  if (SPIKE_ARM <= 0) return { points, heights }
  const pts = fromStart ? [...points].reverse() : [...points]
  const hs = heights && heights.length === points.length ? (fromStart ? [...heights].reverse() : [...heights]) : undefined
  // pts ends at the moved endpoint; drop the vertex before it while the last step doubles back over it
  for (let guard = 0; guard < 8 && pts.length > 2; guard++) {
    const end = pts[pts.length - 1]
    const v = pts[pts.length - 2]
    const prev = pts[pts.length - 3]
    const inx = v.x - prev.x, inz = v.z - prev.z
    const outx = end.x - v.x, outz = end.z - v.z
    const li = Math.hypot(inx, inz), lo = Math.hypot(outx, outz)
    if (li < 1e-6 || lo < 1e-6) break
    if ((inx * outx + inz * outz) / (li * lo) > REVERSE) break
    if (distance(v, end) > moved + 1) break // beyond the reach of the move: the street's own line
    pts.splice(pts.length - 2, 1)
    hs?.splice(hs.length - 2, 1)
  }
  return fromStart
    ? { points: pts.reverse(), heights: hs?.reverse() }
    : { points: pts, heights: hs }
}

/** Every edge with a node remapped moved onto its new node; edges left joining a node to itself go. */
function reattach(edges: RideEdge[], moved: Map<number, { id: number; at: Point }>, record = false): RideEdge[] {
  /*
   * One height at the new node: the mean of the ends moved onto it. Each end had kept its own, from a node up to 20 m
   * away — with a junction's level held into its streets (tools/bake.ts, BUGS.md #293) those part by a metre and more,
   * and an edge rode its first metres over the street at Bay and Columbus, nothing under the wheel (air-paths, 2026-10-16).
   */
  const sum = new Map<number, [number, number]>()
  const add = (n: number, h: number | undefined): void => {
    const m = moved.get(n)
    if (!m || h === undefined) return
    const v = sum.get(m.id) ?? [0, 0]
    v[0] += h; v[1]++
    sum.set(m.id, v)
  }
  for (const e of edges) if (e.heights && e.heights.length === e.points.length) { add(e.a, e.heights[0]); add(e.b, e.heights[e.heights.length - 1]) }
  const level = (id: number): number | undefined => { const v = sum.get(id); return v ? v[0] / v[1] : undefined }
  const out: RideEdge[] = []
  for (const e of edges) {
    const na = moved.get(e.a)
    const nb = moved.get(e.b)
    if (!na && !nb) { out.push(e); continue }
    const a = na?.id ?? e.a
    const b = nb?.id ?? e.b
    if (a === b) continue // a connector inside the cluster, or a stub across a median: it is the junction now
    let points = [...e.points]
    let heights = e.heights && e.heights.length === e.points.length ? [...e.heights] : e.heights
    let ease = e.ease
    /*
     * EASED, NOT KINKED (owner, 2026-10-24: "we should try to make sure there are no sharp turns within N meters of an
     * intersection"; docs/INTERSECTIONS.md). Moving only the end point onto the junction's centre left a short stub
     * turned sharply across: Powell's west carriageway, its end moved 8 m onto the centre at Bush, turned 63° nine
     * metres out. Instead the approach's last stretch is warped across, each point by the shift times a smooth fall-off
     * from 1 at the junction to 0 at `reach` — 6× the shift, 12 to 30 m, no more than 45% of the edge — so a 4 m shift
     * becomes a drift of about 12° and the street meets the junction square. Too short an edge to warp falls back to
     * the old move-and-trim.
     */
    const warp = (atEnd: boolean, to: Point): boolean => {
      const pts = atEnd ? [...points].reverse() : points
      const hs = heights && heights.length === points.length ? (atEnd ? [...heights].reverse() : heights) : undefined
      const sx = to.x - pts[0].x, sz = to.z - pts[0].z, d = Math.hypot(sx, sz)
      const reach = Math.min(30, Math.max(12, 6 * d), 0.45 * lengthOf(pts))
      if (d < 0.05 || reach < 3 * d || reach < 6) return false
      const fall = (s: number): number => (s >= reach ? 0 : (1 - s / reach) ** 2 * (1 + 2 * (s / reach)))
      const out: Point[] = []
      const hOut: number[] = []
      let s = 0
      for (let i = 0; i < pts.length; i++) {
        const L = i > 0 ? distance(pts[i - 1], pts[i]) : 0
        // (a vertex at `reach`, where the warp ends, so it ends on the edge's own line)
        if (i > 0 && s < reach && s + L > reach) {
          const t = (reach - s) / L
          out.push({ x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, z: pts[i - 1].z + (pts[i].z - pts[i - 1].z) * t })
          if (hs) hOut.push(hs[i - 1] + (hs[i] - hs[i - 1]) * t)
        }
        s += L
        const f = fall(s)
        out.push({ x: pts[i].x + sx * f, z: pts[i].z + sz * f })
        if (hs) hOut.push(hs[i])
      }
      points = atEnd ? out.reverse() : out
      if (hs) heights = atEnd ? hOut.reverse() : hOut
      if (record) {
        // the shift, right of a→b at that end: the rider is kept on the old line by subtracting it (navigate.ts `easeAt`)
        const q0 = pts[0], q1 = pts.find((q) => distance(q, q0) > 0.5) ?? pts[pts.length - 1]
        // (pts runs FROM this end inward; a→b at the end is the reverse of that when it is the b end)
        const fx = (q1.x - q0.x) * (atEnd ? -1 : 1), fz = (q1.z - q0.z) * (atEnd ? -1 : 1), fl = Math.hypot(fx, fz) || 1
        const lat = Math.round(((sx * fz - sz * fx) / fl) * 100) / 100
        ease = ease ? [...ease] : [0, 0, 0, 0]
        if (atEnd) { ease[2] = Math.round(reach * 10) / 10; ease[3] = lat } else { ease[0] = Math.round(reach * 10) / 10; ease[1] = lat }
      }
      return true
    }
    if (na && !warp(false, na.at)) {
      const d = distance(points[0], na.at)
      points[0] = na.at
      const t = trimBehind(points, heights?.length === points.length ? heights : undefined, true, d)
      points = t.points
      if (t.heights) heights = t.heights
    }
    if (nb && !warp(true, nb.at)) {
      const d = distance(points[points.length - 1], nb.at)
      points[points.length - 1] = nb.at
      const t = trimBehind(points, heights?.length === points.length ? heights : undefined, false, d)
      points = t.points
      if (t.heights) heights = t.heights
    }
    if (heights && heights.length === points.length) {
      heights = [...heights]
      const la = na ? level(na.id) : undefined, lb = nb ? level(nb.id) : undefined
      if (la !== undefined) heights[0] = Math.round(la * 100) / 100
      if (lb !== undefined) heights[heights.length - 1] = Math.round(lb * 100) / 100
    }
    out.push({ ...e, a, b, points, length: lengthOf(points),
      heights: heights && heights.length === points.length ? heights : undefined, ...(ease ? { ease } : {}) })
  }
  return out
}

/**
 * Rule 3: junction clusters. A crossroads of two dual carriageways is four OSM nodes joined by four short
 * stubs, and turning left through it meant answering "straight, left, straight" in twenty metres. Short
 * edges between real junctions are unioned; a cluster that fits inside CLUSTER_SPAN becomes one node at its
 * centre. Never across layers — a bridge and the street under it are not a junction.
 */
export function collapseClusters(edges: RideEdge[], ids = new Ids(), wide = false): RideEdge[] {
  const clusterEdge = wide ? WIDE_CLUSTER_EDGE : CLUSTER_EDGE
  const clusterSpan = wide ? WIDE_CLUSTER_SPAN : CLUSTER_SPAN
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
    if (e.a === e.b || e.length >= clusterEdge) continue
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
    if (Math.hypot(x1 - x0, z1 - z0) >= clusterSpan) continue
    /*
     * BUGS.md #183. The centre is the members' centroid PUT BACK ON THE THROUGH STREET'S AXIS.
     *
     * The bare centroid is what shunted a rider off California Street. California crosses Leidesdorff at one
     * clean OSM node, but Leidesdorff's two junction nodes 9 m apart cluster, and the centroid of the pair
     * sits 4.7 m to the SIDE of California. Moving California's two edge-ends onto that point leaves each
     * with a short kinked stub, `departureBearing` reads the kink over its first 8 m, and California's own
     * continuation is offered at 64° while the alley is offered at 57° — so "straight on" took the alley,
     * every time, downhill at speed.
     *
     * So: find the cluster's through axis — the pair of arms leaving most nearly opposite one another,
     * longest first — and slide the centroid along the perpendicular onto it. The centre stays inside the
     * junction (it only moves within the cluster's own span) and the street that runs through it stays
     * straight, which is what the rider is steering by.
     */
    const inCluster = new Set(members)
    const arms: { dir: Point; len: number; from: Point }[] = []
    for (const e of edges) {
      const aIn = inCluster.has(e.a)
      const bIn = inCluster.has(e.b)
      if (aIn === bIn) continue
      const pts = aIn ? e.points : [...e.points].reverse()
      let i = 1
      while (i < pts.length - 1 && distance(pts[0], pts[i]) < 12) i++
      const dx = pts[i].x - pts[0].x
      const dz = pts[i].z - pts[0].z
      const len = Math.hypot(dx, dz)
      if (len > 1e-6) arms.push({ dir: { x: dx / len, z: dz / len }, len: e.length, from: pts[0] })
    }
    let axis: Point | null = null
    let bestLen = 0
    for (let i = 0; i < arms.length; i++) {
      for (let j = i + 1; j < arms.length; j++) {
        // near-opposite: the two halves of one street through the junction
        const dot = arms[i].dir.x * arms[j].dir.x + arms[i].dir.z * arms[j].dir.z
        if (dot > -Math.cos(25 * DEG)) continue
        const len = Math.min(arms[i].len, arms[j].len)
        if (len <= bestLen) continue
        bestLen = len
        const dx = arms[i].dir.x - arms[j].dir.x
        const dz = arms[i].dir.z - arms[j].dir.z
        const n = Math.hypot(dx, dz)
        axis = { x: dx / n, z: dz / n }
      }
    }
    let cx = sx / members.length
    let cz = sz / members.length
    /*
     * TWO STREETS THROUGH IT: the centre is where their lines CROSS (owner, 2026-10-24: "a perpendicular intersection
     * that is not centered in the center of the quad, so creating 4 extra sharp turns on the 4 streets feeding in";
     * docs/INTERSECTIONS.md). Sliding the centroid onto one street's axis (below) puts it on that street but leaves it
     * wherever the members' mean happens to fall ALONG it — and a cluster's members are rarely symmetric: at California
     * and Jones the crosswalk and service-lane nodes run 30 m down Jones and only 13 m up it, so the centroid sat
     * 5.3 m down Jones, off California, and California kinked 20° twelve metres before the junction and 13° after it.
     * Each through street's line runs through the mean of its two arms' ends, along their mean direction; with two or
     * more such lines that are not near parallel (over 30° apart) the centre is their least-squares crossing — kept
     * inside the cluster (its box, 3 m of slack), else the single-axis rule stands.
     */
    // (one line per STREET: every arm along the same axis, both ways, both carriageways of a divided street — so the
    //  line runs down the MEDIAN, through the mean of all their ends; Powell's two carriageways at Bush are 8 m apart,
    //  and a line down one of them sent the other 8 m sideways into the junction)
    const groups: { d: Point; ends: Point[]; pos: boolean; neg: boolean }[] = []
    for (const arm of arms) {
      let gr = groups.find((g) => Math.abs(g.d.x * arm.dir.x + g.d.z * arm.dir.z) > Math.cos(25 * DEG))
      if (!gr) groups.push((gr = { d: arm.dir, ends: [], pos: false, neg: false }))
      if (gr.d.x * arm.dir.x + gr.d.z * arm.dir.z > 0) gr.pos = true
      else gr.neg = true
      gr.ends.push(arm.from)
    }
    const lines: { p: Point; d: Point }[] = groups.filter((g) => g.pos && g.neg).map((g) => ({
      p: { x: g.ends.reduce((s, q) => s + q.x, 0) / g.ends.length, z: g.ends.reduce((s, q) => s + q.z, 0) / g.ends.length },
      d: g.d,
    }))
    let crossed = false
    // (RIDE_CROSS=0 in the environment turns this off, for comparing: tools/junction-survey.ts)
    if (lines.length >= 2 && (typeof process === 'undefined' || process.env?.RIDE_CROSS !== '0')) {
      let a11 = 0, a12 = 0, a22 = 0, b1 = 0, b2 = 0
      for (const { p, d } of lines) {
        const m11 = 1 - d.x * d.x, m12 = -d.x * d.z, m22 = 1 - d.z * d.z
        a11 += m11; a12 += m12; a22 += m22
        b1 += m11 * p.x + m12 * p.z; b2 += m12 * p.x + m22 * p.z
      }
      const det = a11 * a22 - a12 * a12
      if (Math.abs(det) > 0.05) {
        const x = (a22 * b1 - a12 * b2) / det, z = (a11 * b2 - a12 * b1) / det
        if (x > x0 - 3 && x < x1 + 3 && z > z0 - 3 && z < z1 + 3) { cx = x; cz = z; crossed = true }
      }
    }
    if (axis !== null && !crossed) {
      const ax = axis
      /*
       * The line to put the centre on runs through the MEAN of the ends of every arm that runs along the
       * axis, not through any one member. That distinction is what keeps a dual carriageway working: its
       * four lane-ends are symmetric about the median, so their mean is on the median and the centre stays
       * exactly where #52 put it. Anchoring on a single member would slide the junction onto ONE lane's
       * line and hand the other a full median's worth of kink — the very defect this is fixing.
       */
      let ax0 = 0
      let az0 = 0
      let n = 0
      for (const arm of arms) {
        if (Math.abs(arm.dir.x * ax.x + arm.dir.z * ax.z) < Math.cos(25 * DEG)) continue
        ax0 += arm.from.x
        az0 += arm.from.z
        n++
      }
      if (n > 0) {
        const anchor = { x: ax0 / n, z: az0 / n }
        const t = (cx - anchor.x) * ax.x + (cz - anchor.z) * ax.z
        cx = anchor.x + ax.x * t
        cz = anchor.z + ax.z * t
      }
    }
    const c = { id: ids.nextNode(), at: { x: cx, z: cz } }
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
    ...(e.oneway ? { onewayBack: !e.onewayBack } : {}),
    // (the ends swap, and "right of a→b" is the other side)
    ...(e.ease ? { ease: [e.ease[2], -e.ease[3], e.ease[0], -e.ease[1]] } : {}),
  }
}

/** Two edges meeting at `node` as one: the first ends there, the second starts there. */
function join(e1: RideEdge, e2: RideEdge, node: number, id: number): RideEdge {
  const p = e1.b === node ? e1 : reverseEdge(e1)
  const q = e2.a === node ? e2 : reverseEdge(e2)
  const points = [...p.points, ...q.points.slice(1)]
  let heights = p.heights && q.heights && p.heights.length === p.points.length && q.heights.length === q.points.length
    ? [...p.heights, ...q.heights.slice(1)] : undefined
  const longer = p.length >= q.length ? p : q
  if (heights && heights.length !== points.length) heights = undefined
  return {
    ...longer,
    id, a: p.a, b: q.b, points, length: lengthOf(points),
    heights,
    name: p.name ?? q.name,
    over: [...p.over, ...q.over],
    // (the outer ends' warps stand; the inner ends meet in the middle of the new edge)
    ease: p.ease || q.ease ? [p.ease?.[0] ?? 0, p.ease?.[1] ?? 0, q.ease?.[2] ?? 0, q.ease?.[3] ?? 0] : undefined,
  }
}

/**
 * BUGS.md #194, the last pass: no ride edge doubles back on itself.
 *
 * `reattach` trims the vertices an endpoint stepped over as it moves (above), but a TWO-point stub has no
 * interior vertex to trim — its reversal only appears once `contract` makes that endpoint an interior vertex
 * of a longer edge, and the same is true of the split points `dropSidePaths` and `linkCarriageways` make. So
 * the finished polylines are swept once: where a vertex turns more than 120°, the SHORT arm of the spike is
 * the scrap and its outer vertex goes.
 *
 * The short-arm test is what keeps a real switchback: Lombard's hairpins and the Presidio's zig-zags turn
 * this far too, but both of their arms are a street long. Only a spike with an arm under `SPIKE_ARM` metres
 * — an overshot junction centre, a stub folded into one — is removed, and never an endpoint, so no node
 * moves and the graph's topology is untouched.
 */
/*
 * The threshold, and why it is read this way. 30 m comes from the measurement: every one of San Francisco's
 * 43 spikes had an arm under 30 m except three, and those three (Montgomery on Telegraph Hill, a Presidio
 * service road, a Twin Peaks service road) turn on 32 m arms and read as surveyed switchbacks. Raising it
 * further buys one more edge and starts eating real hairpins, so this is where the line is drawn.
 *
 * `process` DOES NOT EXIST IN THE BROWSER, and this module is loaded by the game, not only by the bake: a
 * bare `process.env` here threw `ReferenceError: process is not defined` at load and took the whole app
 * down. A tuning knob in shared code has to be read in a way that works on both sides — hence
 * `globalThis.process`, which is simply undefined in a browser and gives the default.
 */
const SPIKE_ARM = Number(
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.SPIKE_ARM ?? 30,
)
export function despike(edges: RideEdge[]): RideEdge[] {
  if (SPIKE_ARM <= 0) return edges // the counterfactual: SPIKE_ARM=0 measures the graph as it was before #194
  return edges.map((e) => {
    const pts = [...e.points]
    const hs = e.heights && e.heights.length === e.points.length ? [...e.heights] : undefined
    /*
     * A PATH is allowed its zigzags. Of the run graph's 168 reversals, 121 are on footways, steps, paths and
     * pedestrian ways, and a stairway or a hillside trail is genuinely mapped as single-vertex zigzags with
     * 5-25 m landings — the Filbert Steps, the Presidio switchbacks. Cutting those corners would send the
     * runner across the hillside instead of down the path, so on a path only a short scrap goes; the 30 m
     * figure is for streets, where a 20 m single-vertex reversal is always an artefact.
     */
    const arm = e.foot || RUN_EXTRA.has(e.kind ?? '') ? Math.min(SPIKE_ARM, 8) : SPIKE_ARM
    let cut = 0
    for (let guard = 0; guard < 64; guard++) {
      let found = -1
      let drop = -1
      for (let i = 1; i < pts.length - 1; i++) {
        const inx = pts[i].x - pts[i - 1].x, inz = pts[i].z - pts[i - 1].z
        const outx = pts[i + 1].x - pts[i].x, outz = pts[i + 1].z - pts[i].z
        const li = Math.hypot(inx, inz), lo = Math.hypot(outx, outz)
        if (li < 1e-6 || lo < 1e-6) continue
        if ((inx * outx + inz * outz) / (li * lo) > REVERSE) continue
        if (Math.min(li, lo) > arm) continue // a surveyed hairpin, not a scrap
        // the outer end of the short arm is the overshoot; an endpoint is a junction and stays, so then the
        // spike vertex itself goes
        const outer = li <= lo ? i - 1 : i + 1
        drop = outer > 0 && outer < pts.length - 1 ? outer : i
        found = i
        break
      }
      if (found < 0 || pts.length <= 2) break
      pts.splice(drop, 1)
      hs?.splice(drop, 1)
      cut++
    }
    if (cut === 0) return e
    return { ...e, points: pts, length: lengthOf(pts), heights: hs }
  })
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
export function isParallelPair(e: RideEdge, f: RideEdge, ground?: (x: number, z: number) => number): boolean {
  if (!e.name || e.name !== f.name || e.id === f.id) return false
  if (e.length <= 20 || f.length <= 20) return false
  if (e.a === f.a && e.b === f.b) { /* same ends: still a pair if they run side by side */ }
  const mid = (x: RideEdge): Point => resample(x.points, undefined, 2).pts[1]
  if (distance(mid(e), mid(f)) > 25) return false
  // one OVER the other is not a pair: the Bay Bridge's two roadways are 4 m apart in plan and 9.5 m in height, and
  // merged into one two-way road down the lower deck — the rider went west against five lanes (2026-09-30)
  if (layerOf(e) !== layerOf(f)) return false
  if (e.heights && f.heights) {
    const near = (x: RideEdge, p: Point): number => {
      let best = 0
      let bd = Infinity
      for (let i = 0; i < x.points.length; i++) { const d = distance(x.points[i], p); if (d < bd) { bd = d; best = i } }
      return x.heights![best]
    }
    // (and near the ends: a junction's level is held a few metres into each carriageway (tools/bake.ts, BUGS.md #293), so
    // two that agree in the middle can part by a metre and more by the corner — Bay at Columbus, 2026-10-16)
    for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      const p = resample(e.points, undefined, 20).pts[Math.round(t * 20)]
      // (1.5 m, not 4: a SPLIT-LEVEL street — Carolina and De Haro on Potrero Hill, Bridgeway in Sausalito — has its two
      // roadways a couple of metres apart in height, and the averaged midline ran between them over the retaining wall,
      // nothing drawn under the wheel; air-paths, 2026-10-04)
      if (Math.abs(near(e, p) - near(f, p)) > 1.5) return false
      /*
       * …nor two carriageways at one level with something LOWER between them (2026-10-15, Broadway's frontage roads
       * either side of its trench): the midline down the middle rode 1.5 m over the trench, nothing under the wheel.
       */
      if (ground) {
        const q = project(f.points, p)
        const fp = pointAt(f.points, q.s)
        const h = (near(e, p) + near(f, p)) / 2
        if (Math.abs(h - ground((p.x + fp.x) / 2, (p.z + fp.z) / 2)) > 1.5) return false
      }
    }
  }
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
export function mergeParallel(edges: RideEdge[], ids = new Ids(), ground?: (x: number, z: number) => number): RideEdge[] {
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
          if (isParallelPair(g[i], g[j], ground) && midline(g[i], g[j], ids, true)) { pair = [g[i], g[j]]; break search }
        }
      }
    }
    if (!pair) return cur
    const m = midline(pair[0], pair[1], ids, false)!
    cur = reattach(cur.filter((e) => e !== pair![0] && e !== pair![1]), m.moved, true)
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
  /*
   * …nor two carriageways far apart (owner, 2026-10-17, the Embarcadero: "still need to straighten out the paths"; with
   * the path lines on: two lines, one each way, converging to one down the F-line's tracks wherever the median narrowed,
   * then parting again). Over 14 m between them, the median is a place of its own — tracks, a promenade, a park — and
   * each direction keeps its own line.
   */
  {
    const sp = re.pts.map((p, i) => distance(p, rf.pts[i])).sort((a, b) => a - b)
    if (sp[Math.floor(sp.length * 0.1)] > 14) return null
  }
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
  /*
   * Half the distance between the two carriageways' centre lines: where the rider's own carriageway is. ONE number for
   * the whole edge, so the SMALLEST spread along it (the 25th percentile, against a stray sample), not the mean: Market
   * at Beale, the side carriageway 3.6 m off the midline here and veering 9 m away further on, gave a mean of 6.3 m and
   * put the rider 2.7 m past the side carriageway, on the pavement among the BART plaza's planters, the camera through
   * the buildings (owner, 2026-10-15). Too little only keeps the rider nearer the middle of the road.
   */
  const spreads = re.pts.map((p, i) => distance(p, rf.pts[i])).sort((a, b) => a - b)
  // (the smallest spread, less a metre: the rider rides the inner half of their carriageway, away from its kerb — a
  //  merged pair's side carriageway is often a narrow slip lane along the buildings, Market at Beale)
  const lane = Math.round(Math.max(0, spreads[Math.floor(spreads.length * 0.1)] / 2 - 1) * 100) / 100
  const edge: RideEdge = {
    ...longer, id: ids.nextEdge(), a: na.id, b: nb.id, points: pts, heights: hs, length: lengthOf(pts),
    over: [...e.over, ...f.over], ...(lane > 1 ? { lane } : {}),
    // two carriageways, one each way, are one road ridden both ways; two the same way are still one way
    oneway: !!e.oneway && !!f.oneway && !!e.onewayBack === !!f.onewayBack, onewayBack: undefined,
  }
  if (edge.oneway && e.onewayBack) edge.onewayBack = true
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
    // and an unnamed dead end under 30 m of any kind: a courtyard's mouth, a lane's first metres (20 of the
    // audit's dead ends, BUGS.md #20)
    const next = cur.filter((e) => !(dead(e) && ((e.kind === 'service' && !e.name) || e.length < 15 || (!e.name && e.length < 30))))
    if (next.length === cur.length) return cur
    cur = next
  }
  return cur
}

/**
 * Two short edges joining the same two nodes (BUGS.md #44): a loop of a few metres at a junction — a
 * boulevard's side-lane scrap and the link a dead end was joined back by, or the same way mapped twice
 * (Rue Boulle, once named and once not). The rider was offered both ways round it. Kept: the named one, then
 * the shorter. A long way round between the same nodes is a real street and stays.
 */
export function dropLoops(edges: RideEdge[]): RideEdge[] {
  const pairs = new Map<string, RideEdge[]>()
  for (const e of edges) {
    const k = e.a < e.b ? `${e.a}:${e.b}` : `${e.b}:${e.a}`
    const l = pairs.get(k)
    if (l) l.push(e)
    else pairs.set(k, [e])
  }
  const drop = new Set<number>()
  for (const l of pairs.values()) {
    if (l.length < 2 || Math.min(...l.map((e) => e.length)) >= 40) continue
    const keep = [...l].sort((p, q) => (!!p.name !== !!q.name ? (p.name ? -1 : 1) : p.length - q.length))[0]
    // a longer street round the other side of a small block is a real way (Rue Cloche Perce's 71 m beside
    // Rue du Roi de Sicile's 37): only the short and the near-copies go
    for (const e of l) if (e !== keep && (e.length < 40 || e.length < keep.length * 1.25)) drop.add(e.id)
  }
  if (drop.size === 0) return edges
  let es = edges.filter((e) => !drop.has(e.id))
  // a loop hung off the end of a street (a lasso) leaves its tail: a named scrap under 40 m going nowhere,
  // which was only ever a way round and back — it goes too (Richard-Lenoir's 16 m, Rivoli's 18)
  const ends = new Set<number>()
  for (const e of edges) if (drop.has(e.id)) { ends.add(e.a); ends.add(e.b) }
  const deg = degrees(es)
  es = es.filter((e) => !(e.length < 40 && ((ends.has(e.a) && deg.get(e.a) === 1) || (ends.has(e.b) && deg.get(e.b) === 1))))
  return es
}

/**
 * On a bike, the pedestrianised side of a street is not the street. OSM maps the wide paved half of Rue
 * Saint-Antoine as a pedestrian way beside the road, with the road's own name; contraction then stitched it
 * into the street's chain and the rider rode down the pavement. A pedestrian edge running alongside a
 * same-named road (`isParallelPair`) goes; a pedestrian street on its own stays.
 */
/** two ways more than 2.5 m apart in height anywhere they run side by side (one over the other, not beside it) */
function apart(e: RideEdge, r: RideEdge): boolean {
  if (!e.heights || !r.heights) return false
  for (let i = 0; i < e.points.length; i++) {
    const q = project(r.points, e.points[i])
    const k = Math.min(r.heights.length - 1, Math.max(0, Math.round(q.t * (r.heights.length - 1))))
    if (Math.abs(e.heights[i] - r.heights[k]) > 2.5) return true
  }
  return false
}

export function dropSidePaths(edges: RideEdge[], ids = new Ids(), blocked?: (a: Point, b: Point) => boolean): RideEdge[] {
  /*
   * A side path is a way that runs ALONGSIDE a street rather than being one: a pedestrian way or a cycle track
   * named for the street it borders, and an unnamed cycle track or service lane beside any street. Paris maps
   * its bidirectional cycle tracks separately — the Avenue de New York along the Seine came out as a primary
   * and five cycleway pieces weaving round it, and the rider was "swept away" from junction to junction
   * (BUGS.md #27, #28). The rider rides the street; the renderer still draws the track.
   */
  const CELL = 40
  const grid = new Map<string, RideEdge[]>()
  const isRoad = (e: RideEdge): boolean => !e.foot && e.kind !== 'pedestrian' && e.kind !== 'cycleway' && e.kind !== 'service'
  for (const e of edges) {
    if (!isRoad(e)) continue
    const seen = new Set<string>()
    for (const q of e.points) {
      const k = `${Math.floor(q.x / CELL)},${Math.floor(q.z / CELL)}`
      if (seen.has(k)) continue
      seen.add(k)
      ;(grid.get(k) ?? grid.set(k, []).get(k)!).push(e)
    }
  }
  // how much of a street each kind is: a contre-allée (the lesser same-name road beside an avenue) is a side path
  const RANK: Record<string, number> = { primary: 5, primary_link: 4, secondary: 4, secondary_link: 3, tertiary: 3,
    tertiary_link: 2, unclassified: 2, residential: 2, living_street: 1, service: 1 }
  const rank = (e: RideEdge): number => RANK[e.kind ?? 'residential'] ?? 2
  // an unnamed turn lane mapped beside its street (Howard's slip lane onto 2nd, owner 2026-10-16: "two paths on one
  // street that has no median") is the street too: the rider was offered both
  const slip = (e: RideEdge): boolean => !e.name && /^(primary|secondary|tertiary)_link$/.test(e.kind ?? '')
  const candidate = (e: RideEdge): boolean =>
    (e.kind === 'pedestrian' && !!e.name) || e.kind === 'cycleway' || (e.kind === 'service' && !e.name) || (!!e.name && rank(e) <= 3) || slip(e)
  const beside = (e: RideEdge): RideEdge | null => {
    if (e.length < 6) return null
    const near = new Set<RideEdge>()
    for (const q of e.points) {
      const gx = Math.floor(q.x / CELL)
      const gz = Math.floor(q.z / CELL)
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const r of grid.get(`${gx + dx},${gz + dz}`) ?? []) near.add(r)
    }
    const be = bearing(e.points[0], e.points[e.points.length - 1])
    const samples = resample(e.points, undefined, Math.max(3, Math.ceil(e.length / 3))).pts
    for (const r of near) {
      // a named pedestrian way only beside ITS street (a pedestrian avenue is a street of its own); a cycle
      // track beside any — OSM's names lag (the Quai Branly track beside the renamed Quai Jacques Chirac)
      if (e.kind === 'pedestrian' && e.name !== r.name) continue
      // a named street only beside a MORE important road of its own name (the contre-allées of the Avenue de
      // New York beside its carriageways)
      const street = e.kind !== 'pedestrian' && e.kind !== 'cycleway' && !(e.kind === 'service' && !e.name) && !slip(e)
      if (street && (e.name !== r.name || rank(r) <= rank(e))) continue
      // never beside a road on another LEVEL (Stockton at Bush, 2026-09-29): the surface street north of Bush was
      // dropped as a "side path" of lower Stockton, 4 m below it in its cut, and of the tunnel under it
      if (layerOf(e) !== layerOf(r) || !!e.bore !== !!r.bore || (street && apart(e, r))) continue
      // cycle tracks and lanes further out: along the Seine they run under the trees 20 m from the carriageway
      const reach = slip(e) ? r.width / 2 + 6 : e.kind === 'pedestrian' ? Math.max(14, r.width / 2 + r.walk + 9) : Math.max(24, r.width / 2 + r.walk + 12)
      let alongside = 0
      for (const p of samples) {
        const q = project(r.points, p)
        if (q.d >= reach) continue
        // running the same way as the road there, not crossing it
        const i = Math.min(r.points.length - 2, Math.max(0, Math.floor(q.t * (r.points.length - 1))))
        const rb = bearing(r.points[i], r.points[i + 1])
        const d = Math.abs(angleDiff(be, rb))
        if (Math.min(d, Math.PI - d) < (25 * Math.PI) / 180 || e.length < 25) alongside++
      }
      if (alongside >= 0.7 * samples.length) return r
    }
    return null
  }
  /*
   * A BRIDGE'S CYCLEWAY IS THE BIKE ROUTE OVER IT (2026-09-29). The Golden Gate's sidewalks were dropped here as side
   * paths of US 101 beside them, and the rider was sent across the six-lane roadway into its traffic. The other way
   * round: where a cycleway on a bridge runs beside a motorway, the MOTORWAY is what a bike does not ride. (A bridge
   * with no cycleway — the Bay Bridge's west span — keeps its roadway: `classify` lets motorway bridges in.)
   */
  const roadsOut = new Set<RideEdge>()
  // (or on a raised layer: the Golden Gate's sidewalk pieces round the north tower are layer 1 without the bridge tag)
  const bikeway = (e: RideEdge): boolean => e.kind === 'cycleway' && (!!e.bridge || (e.layer ?? 0) > 0)
  for (const e of edges) {
    if (!bikeway(e)) continue
    // every motorway beside it, one at a time (`beside` answers with the first it finds: the Golden Gate has two
    // carriageways, and with only one taken out the sidewalks were dropped as side paths of the other)
    for (let guard = 0; guard < 6; guard++) {
      const r = beside(e)
      if (!r || !(r.kind === 'motorway' || r.kind === 'trunk')) break
      roadsOut.add(r)
      for (const [k, list] of grid) grid.set(k, list.filter((q) => q !== r))
    }
  }
  if (roadsOut.size) edges = edges.filter((e) => !roadsOut.has(e))
  const dropped = new Map<RideEdge, RideEdge>()
  for (const e of edges) {
    // (and a bridge's cycleway is never itself a side path: it is the way over)
    if (!candidate(e) || bikeway(e)) continue
    const r = beside(e)
    if (r) dropped.set(e, r)
  }
  let kept = edges.filter((e) => !dropped.has(e))
  /*
   * And the streets that met the side path rather than the road — a Marais street joined to the Rue de Rivoli's
   * cycle track, not to its carriageway — are carried straight across to the road, which is split there;
   * without it they became dead ends (Rue Pavée, Rue Charlemagne…).
   */
  const deg = new Map<number, number>()
  for (const e of kept) { deg.set(e.a, (deg.get(e.a) ?? 0) + 1); deg.set(e.b, (deg.get(e.b) ?? 0) + 1) }
  const endAt = (e: RideEdge, n: number): { at: Point; h?: number } => n === e.a
    ? { at: e.points[0], h: e.heights?.[0] } : { at: e.points[e.points.length - 1], h: e.heights?.[e.heights.length - 1] }
  // the current pieces of each road that has been split, so a second link finds the right piece
  const pieces = new Map<number, RideEdge[]>()
  const done = new Set<number>()
  for (const [side, road] of dropped) {
    for (const n of [side.a, side.b]) {
      if (done.has(n) || !(deg.get(n) ?? 0) || n === road.a || n === road.b) continue
      done.add(n)
      const from = endAt(side, n)
      const cand = pieces.get(road.id) ?? [road]
      let best: { piece: RideEdge; q: ReturnType<typeof project> } | null = null
      for (const piece of cand) {
        if (!kept.includes(piece)) continue
        const q = project(piece.points, from.at)
        if (!best || q.d < best.q.d) best = { piece, q }
      }
      if (!best || best.q.d > 30) continue
      const { piece, q } = best
      if (blocked?.(from.at, pointAt(piece.points, q.s))) continue
      const P = pointAt(piece.points, q.s)
      const hAt = (e: RideEdge, sAt: number): number | undefined => {
        if (!e.heights || e.heights.length !== e.points.length) return undefined
        const k = Math.min(e.points.length - 1, Math.max(0, Math.round((sAt / Math.max(1e-6, e.length)) * (e.points.length - 1))))
        return e.heights[k]
      }
      let target: number
      // onto the road's own junction when one is near: a second junction a few metres from it is a question
      // asked twice
      if (q.s < 15) target = piece.a
      else if (q.s > piece.length - 15) target = piece.b
      else {
        // split the piece at P
        target = ids.nextNode()
        const cut = (a: number, b: number): Point[] => {
          const out: Point[] = []
          let acc = 0
          const pts = piece.points
          if (a <= 0) out.push(pts[0])
          for (let i = 1; i < pts.length; i++) {
            const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
            const t0 = acc
            acc += seg
            if (acc <= a || t0 >= b) continue
            if (t0 < a) out.push(pointAt(pts, a))
            out.push(acc <= b ? pts[i] : pointAt(pts, b))
            if (acc >= b) break
          }
          return out
        }
        /*
         * The halves' heights, from the road's own profile at each of their points — not a straight line between the
         * cut's two ends: that threw the profile away, and on 18th Street over Potrero Hill the rider rode a chord 5 m over
         * the street's dip (air-paths' worst bike stretch, 2026-10-04).
         */
        const cum = [0]
        for (let i = 1; i < piece.points.length; i++) cum.push(cum[i - 1] + distance(piece.points[i - 1], piece.points[i]))
        const hExact = (sAt: number): number | undefined => {
          const H = piece.heights
          if (!H || H.length !== piece.points.length) return undefined
          let i = 1
          while (i < cum.length - 1 && cum[i] < sAt) i++
          const t = (sAt - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1])
          return H[i - 1] + (H[i] - H[i - 1]) * Math.max(0, Math.min(1, t))
        }
        const hs = (sA: number, _sB: number, pts: Point[]): number[] | undefined => {
          if (hExact(0) === undefined) return undefined
          const out: number[] = []
          let run = sA
          for (let i = 0; i < pts.length; i++) { if (i > 0) run += distance(pts[i - 1], pts[i]); out.push(hExact(run)!) }
          return out
        }
        const p1 = cut(0, q.s)
        const p2 = cut(q.s, piece.length)
        const total = piece.over.reduce((t, o) => t + o.length, 0) || piece.length
        const k = q.s / piece.length
        const e1: RideEdge = { ...piece, id: ids.nextEdge(), b: target, points: p1, length: lengthOf(p1), heights: hs(0, q.s, p1),
          over: piece.over.map((o) => ({ ...o, length: (o.length / total) * total * k })) }
        const e2: RideEdge = { ...piece, id: ids.nextEdge(), a: target, points: p2, length: lengthOf(p2), heights: hs(q.s, piece.length, p2),
          over: piece.over.map((o) => ({ ...o, length: (o.length / total) * total * (1 - k) })) }
        kept = kept.filter((x) => x !== piece)
        kept.push(e1, e2)
        pieces.set(road.id, [...(pieces.get(road.id) ?? [road]).filter((x) => x !== piece), e1, e2])
      }
      const hP = hAt(piece, q.s)
      const snapped = target === piece.a ? piece.points[0] : target === piece.b ? piece.points[piece.points.length - 1] : P
      const pts = [from.at, snapped]
      kept.push({
        id: ids.nextEdge(), a: n, b: target, points: pts, length: lengthOf(pts), surface: piece.surface, width: 4, walk: 0,
        name: undefined, foot: false, kind: 'residential', oneway: false, over: [],
        ...(from.h !== undefined && hP !== undefined ? { heights: [from.h, hP] } : {}),
      })
    }
  }
  return kept
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
  /** an American grid: wider junction clusters (the region's `streetWidth` is 'carriageway') */
  wideJunctions?: boolean
  /** building footprints on the ground (flat x,z rings): no synthetic link is laid through one */
  buildings?: number[][]
  /** the ground, for the new edges' heights (the navigator rides an edge's own profile) */
  heightAt: (x: number, z: number) => number
  /** islands a ferry serves (region `ferryIslands`, local frame): their networks are kept, not only the largest */
  keep?: { x: number; z: number; r: number }[]
  /** the ground, for the links across a split boulevard: none is laid through the air (a trench between) */
  ground?: (x: number, z: number) => number
  /** false: leave the junctions' approaches as the passes made them (tools/junctions.ts measures both ways) */
  straighten?: boolean
  /** streets ridden as one straight path through a stretch (`straightCorridor`) */
  corridors?: Corridor[]
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
export function linkCarriageways(edges: RideEdge[], ids: Ids, ground?: (x: number, z: number) => number): RideEdge[] {
  const named = new Map<string, RideEdge[]>()
  for (const e of edges) {
    // real streets only: not the synthetic circle and spokes of an override, not paths
    if (!e.name || e.foot || e.over.length === 0 || e.kind === 'service') continue
    // …and streets ON THE GROUND: a link across a boulevard's median is a crossing; between the two carriageways of
    // a freeway, or of a viaduct, it is a path through the air (the Bay Bridge's two roadways east of the Yerba
    // Buena tunnel are 10 m one over the other, and were joined every hundred metres)
    if (FREEWAY.has(e.kind ?? '') || e.bridge || e.raised || e.bore || layerOf(e) !== 0) continue
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
          // (nor between two carriageways at different levels, whatever they are)
          const hp = e.heights?.[Math.min(e.points.length - 1, Math.round((s / e.length) * (e.points.length - 1)))]
          const hq = o.heights?.[Math.min(o.points.length - 1, Math.round((pr.s / o.length) * (o.points.length - 1)))]
          if (hp !== undefined && hq !== undefined && Math.abs(hp - hq) > 1.5) continue
          const at = pointAt(o.points, pr.s)
          const cos = Math.abs(((at.x - p.x) * dir.x + (at.z - p.z) * dir.z) / (pr.d * dl))
          if (cos > 0.5) continue
          /*
           * …nor over anything but the ground (2026-10-15, Broadway at Hyde): a centre roadway in a TRENCH runs between
           * its frontage roads, the ends of a link can be at nearly the same level where the trench starts, and the
           * straight line between them still crossed the trench's deep part 3.5 m in the air.
           */
          if (ground && hp !== undefined && hq !== undefined) {
            let off = 0
            for (let k = 1; k < 8; k++) {
              const t = k / 8
              off = Math.max(off, Math.abs(hp + (hq - hp) * t - ground(p.x + (at.x - p.x) * t, p.z + (at.z - p.z) * t)))
            }
            if (off > 1.2) continue
          }
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

/**
 * Two edges at one node must start from the same point. `buildGraph` takes a node's position from the FIRST
 * edge that claims it, so where two ends disagree the rider crossing that junction jumps from one to the
 * other — a 3.3 m teleport at one Marais node (found while measuring #194: San Francisco has none, the
 * Marais one is left over from a synthetic link made early in the chain). Each node's ends are averaged and
 * both edges are pulled onto it; it is a hand's breadth, and it cannot be seen except as the jump it stops.
 */
export function snapEnds(edges: RideEdge[]): RideEdge[] {
  const sum = new Map<number, { x: number; z: number; n: number }>()
  const add = (n: number, p: Point): void => {
    const s = sum.get(n) ?? { x: 0, z: 0, n: 0 }
    s.x += p.x; s.z += p.z; s.n++
    sum.set(n, s)
  }
  for (const e of edges) { add(e.a, e.points[0]); add(e.b, e.points[e.points.length - 1]) }
  const at = new Map<number, Point>()
  for (const [n, s] of sum) at.set(n, { x: s.x / s.n, z: s.z / s.n })
  return edges.map((e) => {
    const A = at.get(e.a)!
    const B = at.get(e.b)!
    if (distance(A, e.points[0]) < 0.01 && distance(B, e.points[e.points.length - 1]) < 0.01) return e
    const points = [...e.points]
    points[0] = A
    points[points.length - 1] = B
    return { ...e, points, length: lengthOf(points) }
  })
}

/** The whole chain. */
/**
 * How far a path strays OUTSIDE the drawn carriageways (the streets as drawn: the map's edges, not the ride graph's),
 * worst over it, sampled every metre — `straightenJunctions`' acceptance test: no junction is straightened if that
 * takes the rider further off the asphalt than they were.
 */
function outsideOf(edges: Edge[]): Outside {
  const drawn = new Carriageways(edges.filter((e) => !e.foot).map((e) => ({ ...e, kind: e.kind ?? 'residential', points: e.points.flatMap((p) => [p.x, p.z]) })))
  return (pts) => {
    let worst = 0
    for (let i = 1; i < pts.length; i++) {
      const L = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
      for (let d = 0; d <= L; d += 1) {
        const t = L > 0 ? d / L : 0
        const near = drawn.near(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, pts[i - 1].z + (pts[i].z - pts[i - 1].z) * t)
        const out = near.length ? Math.min(...near.map((n) => Math.max(0, n.d - n.s.half))) : 50
        if (out > worst) worst = out
      }
    }
    return worst
  }
}

export function rideGraph(edges: Edge[], mode: RideMode, overrides?: RideOverrides): RideGraph {
  const ids = new Ids()
  const keep = overrides?.keep?.length ? (e: Edge): boolean => overrides.keep!.some((k) => e.points.some((p) => Math.hypot(p.x - k.x, p.z - k.z) < k.r)) : undefined
  const largest = <E extends Edge>(es: E[]): E[] => largestComponent(es, keep)
  const blocked = overrides?.buildings ? footprintTest(overrides.buildings) : undefined
  const ridden = pruneFreewayTraps(classify(edges, mode))
  // (the near-miss gaps closed BEFORE the dead ends are rescued too: a rescue through a flight of steps — the Sutro Baths
  // footway's end, 5 m short of the path on — hid the dead end from `closePathGaps`, then went with the steps)
  const gapped = closePathGaps(ridden, blocked)
  const classified = closePathGaps(mode === 'bike' ? joinDeadEnds(gapped, edges, blocked) : gapped, blocked)
  // (the freeways pruned again once the side paths are gone: the carriageway a bridge's sidewalk replaces was the
  // only way onto the freeway beyond it)
  let es = pruneStubs(largest(mode === 'bike' ? pruneFreewayTraps(dropSidePaths(classified, ids, blocked)) : classified))
  es = despike(contract(collapseClusters(es, ids, overrides?.wideJunctions), ids))
  es = mergeParallel(es, ids, overrides?.ground)
  es = largest(despike(contract(collapseClusters(es, ids, overrides?.wideJunctions), ids)))
  for (const o of overrides?.roundabouts ?? []) es = applyRoundabout(es, o, ids, overrides!.heightAt)
  // and the stubs a dropped path leaves behind, pruned as the chain prunes them the first time
  // `?.` on roundabouts too: the optional chain stops at `overrides`, so an overrides object without the field
  // threw here. `roundabouts` is required by the interface, but a caller that casts its way past the compiler
  // can still omit it — tools/bake.ts did, with `as never`, and every San Francisco bake died at this line.
  if (overrides?.roundabouts?.length) es = pruneStubs(largest(es))
  // last, on the finished graph: the links across a split boulevard
  if (mode === 'bike') es = linkCarriageways(es, ids, overrides?.ground)
  // and the little loops all that can leave (BUGS.md #44), and the stubs they leave in turn
  es = pruneStubs(dropLoops(es))
  // …a street ridden straight through its stretch, its cross streets meeting it one node each (straightCorridor)
  for (const c of overrides?.corridors ?? []) es = pruneStubs(largest(straightCorridor(es, c, ids, overrides!.heightAt)))
  // and last of all, no edge doubling back on itself (BUGS.md #194), and every edge meeting its junction
  es = despike(snapEnds(es))
  // …and every ordinary junction's approaches straight, its streets meeting where their lines cross (city/junction-shape.ts)
  if (overrides?.straighten !== false) es = straightenJunctions(es, outsideOf(edges), blocked).edges
  // …and NO SHARP TURN NEAR ANY JUNCTION, whatever made it (below)
  if (overrides?.straighten !== false) es = smoothApproaches(es)
  return buildGraph(es) as RideGraph
}

/** A stretch of one street ridden as ONE straight path (RideOverrides.corridors; local frame). */
export interface Corridor {
  /** the street's name, as OSM has it */
  street: string
  /** the stretch's two ends (a point near the street at each) */
  from: Point
  to: Point
  /** how far right of the centreline the rider holds (the edge's `lane`), m; by default where its carriageways ran */
  lane?: number
}

/**
 * A STREET RIDDEN STRAIGHT (owner, 2026-10-25, Market Street past 8th: "it's impossible to ride straight down market
 * because the paths join and diverge, with many turns that are difficult or impossible to make, and many-way
 * intersections. it should be possible to easily ride straight down market street in a straight line in either
 * direction and easily turn onto any intersecting street with a simple, obvious decision"; docs/INTERSECTIONS.md).
 *
 * Market from 8th to Castro is two carriageways that part round boarding islands and meet again, crossed by the
 * grid on the skew, so the passes above leave it as a chain of splits, rejoins and five- to seven-way clusters: 28
 * junctions in 2.6 km, a turn of 81° at Dolores just to stay on Market. Within a corridor all that is replaced:
 *
 *   1. the street's own edges inside the stretch are removed, and with them the short links between its carriageways;
 *   2. ONE centreline is laid through the middle of all of them (their points binned along the stretch and averaged,
 *      then smoothed), so the street is a single straight path ridden both ways;
 *   3. every edge that met the removed street meets the centreline instead, at the point where ITS OWN line crosses it
 *      (its approach ray, not the old node), so a cross street goes over in one straight line;
 *   4. crossings within 7 m of each other along the centreline are one junction, and the two halves of a cross street
 *      (or a street's two carriageways) within 24 m are one junction: a five-way is one node, one decision.
 *
 * The later passes (`straightenJunctions`, `smoothApproaches`) then square the cross streets' approaches on to it.
 */
export function straightCorridor(edges: RideEdge[], c: Corridor, ids: Ids, heightAt: (x: number, z: number) => number): RideEdge[] {
  const named = (e: Edge): boolean => !e.foot && (e.name === c.street || (e.name ?? '').split(/;\s*/).includes(c.street))
  const dx = c.to.x - c.from.x, dz = c.to.z - c.from.z, L = Math.hypot(dx, dz)
  if (L < 50) return edges
  const ux = dx / L, uz = dz / L
  const S = (p: Point): number => (p.x - c.from.x) * ux + (p.z - c.from.z) * uz
  const O = (p: Point): number => (p.x - c.from.x) * -uz + (p.z - c.from.z) * ux
  // the street's edges reaching into the stretch, whole: the corridor runs on to their far ends (the junction at
  // each end), so it never stops in mid-block where the carriageways would fork off it again
  const inside = (p: Point): boolean => S(p) > 0 && S(p) < L && Math.abs(O(p)) < 70
  const near = (p: Point): boolean => S(p) > -200 && S(p) < L + 200 && Math.abs(O(p)) < 70
  const mine = edges.filter((e) => named(e) && e.points.some(inside) && e.points.every(near))
  if (mine.length < 2) return edges
  const gone = new Set(mine.map((e) => e.id))
  const R = new Set<number>()
  for (const e of mine) { R.add(e.a); R.add(e.b) }
  // the links between the carriageways: short edges both of whose ends were the street's
  for (const e of edges) if (!gone.has(e.id) && R.has(e.a) && R.has(e.b) && e.length < 40) gone.add(e.id)

  // ---- the centreline: the street's points every 4 m, binned every 15 m along the stretch, averaged, then smoothed
  let s0 = Infinity, s1 = -Infinity
  for (const e of mine) for (const p of e.points) { s0 = Math.min(s0, S(p)); s1 = Math.max(s1, S(p)) }
  const BIN = 15, nb = Math.ceil((s1 - s0) / BIN) + 1
  const sx = new Array<number>(nb).fill(0), sz = new Array<number>(nb).fill(0), sn = new Array<number>(nb).fill(0)
  for (const e of mine) {
    if (e.length < 20) continue
    for (let i = 1; i < e.points.length; i++) {
      const p = e.points[i - 1], q = e.points[i], d = distance(p, q), n = Math.max(1, Math.round(d / 4))
      for (let k = 0; k <= n; k++) {
        const x = p.x + ((q.x - p.x) * k) / n, z = p.z + ((q.z - p.z) * k) / n
        const b = Math.round((Math.max(s0, Math.min(s1, S({ x, z }))) - s0) / BIN)
        sx[b] += x; sz[b] += z; sn[b]++
      }
    }
  }
  let line: Point[] = []
  for (let b = 0; b < nb; b++) if (sn[b]) line.push({ x: sx[b] / sn[b], z: sz[b] / sn[b] })
  if (line.length < 3) return edges
  line = line.map((p, i) => {
    if (i === 0 || i === line.length - 1) return p
    return { x: (line[i - 1].x + 2 * p.x + line[i + 1].x) / 4, z: (line[i - 1].z + 2 * p.z + line[i + 1].z) / 4 }
  })
  // arc length along the centreline, and the point at an arc length
  const arc: number[] = [0]
  for (let i = 1; i < line.length; i++) arc.push(arc[i - 1] + distance(line[i - 1], line[i]))
  const total = arc[arc.length - 1]
  const at = (s: number): Point => {
    const t = Math.max(0, Math.min(total, s))
    let i = 1
    while (i < line.length - 1 && arc[i] < t) i++
    const k = (t - arc[i - 1]) / Math.max(1e-6, arc[i] - arc[i - 1])
    return { x: line[i - 1].x + (line[i].x - line[i - 1].x) * k, z: line[i - 1].z + (line[i].z - line[i - 1].z) * k }
  }
  /** the nearest point of the centreline: its arc length and distance */
  const nearest = (p: Point): { s: number; d: number } => {
    let best = { s: 0, d: Infinity }
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1], b = line[i], vx = b.x - a.x, vz = b.z - a.z, ll = vx * vx + vz * vz || 1
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.z - a.z) * vz) / ll))
      const d = Math.hypot(p.x - a.x - vx * t, p.z - a.z - vz * t)
      if (d < best.d) best = { s: arc[i - 1] + t * Math.sqrt(ll), d }
    }
    return best
  }
  /** where the ray from p along (vx, vz) first crosses the centreline within `reach` m, as an arc length */
  const crossing = (p: Point, vx: number, vz: number, reach: number): number | null => {
    let best: { s: number; t: number } | null = null
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1], b = line[i], ex = b.x - a.x, ez = b.z - a.z
      const den = vx * ez - vz * ex
      if (Math.abs(den) < 1e-9) continue
      const t = ((a.x - p.x) * ez - (a.z - p.z) * ex) / den
      const k = ((a.x - p.x) * vz - (a.z - p.z) * vx) / den
      if (t < -2 || t > reach || k < 0 || k > 1) continue
      if (!best || t < best.t) best = { s: arc[i - 1] + k * Math.hypot(ex, ez), t }
    }
    return best ? best.s : null
  }

  // ---- every edge that met the removed street: where its own line meets the centreline
  interface Att { e: RideEdge; atA: boolean; s: number; name?: string }
  const atts: Att[] = []
  const kept = edges.filter((e) => !gone.has(e.id))
  for (const e of kept) {
    for (const atA of [true, false]) {
      if (!R.has(atA ? e.a : e.b)) continue
      const pts = atA ? [...e.points].reverse() : e.points
      // the approach's direction over its last ~12 m
      const end = pts[pts.length - 1]
      let j = pts.length - 2, d = 0
      while (j > 0 && d < 12) { d += distance(pts[j], pts[j + 1]); j-- }
      const from = pts[Math.max(0, j)], len = distance(from, end) || 1
      const s = crossing(from, (end.x - from.x) / len, (end.z - from.z) / len, len + 30) ?? nearest(end).s
      atts.push({ e, atA, s, name: e.name })
    }
  }
  atts.sort((p, q) => p.s - q.s)
  // ---- junctions: crossings within 7 m are one node, and a street's halves within 24 m too
  const groups: Att[][] = []
  for (const a of atts) {
    const g = groups.find((gr) => {
      const m = gr.reduce((t, x) => t + x.s, 0) / gr.length
      return Math.abs(a.s - m) < 7 || (!!a.name && gr.some((x) => x.name === a.name) && Math.abs(a.s - m) < 24)
    })
    if (g) g.push(a)
    else groups.push([a])
  }
  const mean = (gr: Att[]): number => gr.reduce((t, x) => t + x.s, 0) / gr.length
  // (a group's mean drifts as it grows, so two neighbours can end up closer than 7 m: they are one junction)
  groups.sort((p, q) => mean(p) - mean(q))
  for (let i = 1; i < groups.length; i++) {
    if (mean(groups[i]) - mean(groups[i - 1]) < 7) { groups[i - 1].push(...groups[i]); groups.splice(i, 1); i-- }
  }
  const nodes = groups.map((gr) => ({ id: ids.nextNode(), s: mean(gr), gr }))
  // the ends of the centreline are nodes too, where no street meets them (the street's own edges beyond the stretch do)
  if (!nodes.length || nodes[0].s > 3) nodes.unshift({ id: ids.nextNode(), s: 0, gr: [] })
  if (nodes[nodes.length - 1].s < total - 3) nodes.push({ id: ids.nextNode(), s: total, gr: [] })
  const moved = new Map<RideEdge, RideEdge>()
  for (const n of nodes) {
    const p = at(n.s)
    for (const a of n.gr) {
      const cur = moved.get(a.e) ?? a.e
      // the edge's points from its far end, dropping those within 3 m of the centreline, then the node itself
      const pts = a.atA ? [...cur.points].reverse() : [...cur.points]
      while (pts.length > 2 && nearest(pts[pts.length - 1]).d < 3) pts.pop()
      pts.push(p)
      const out = a.atA ? pts.reverse() : pts
      moved.set(a.e, { ...cur, points: out, length: lengthOf(out), heights: out.map((q) => heightAt(q.x, q.z)), ...(a.atA ? { a: n.id } : { b: n.id }) })
    }
  }
  // ---- the centreline itself, node to node, carrying the removed edges' map coverage
  const template = mine.reduce((p, q) => (q.length > p.length ? q : p))
  // the rider holds where a carriageway ran: half their spread less a metre, as mergeParallel sets `lane`
  const spread = mine.filter((e) => e.length >= 20).flatMap((e) => e.points.map((p) => nearest(p).d)).sort((p, q) => p - q)
  const lane = c.lane ?? Math.round(Math.max(0, (spread[Math.floor(spread.length / 2)] ?? 0) - 1) * 100) / 100
  const spans: RideEdge[] = []
  for (let i = 1; i < nodes.length; i++) {
    const s0 = nodes[i - 1].s, s1 = nodes[i].s
    if (s1 - s0 < 0.5) continue
    const pts: Point[] = [at(s0)]
    for (let k = 0; k < line.length; k++) if (arc[k] > s0 + 0.5 && arc[k] < s1 - 0.5) pts.push(line[k])
    pts.push(at(s1))
    const cover = mine.filter((e) => { const m = nearest(e.points[Math.floor(e.points.length / 2)]).s; return m >= s0 && m < s1 })
    const seen = new Set<number>()
    const over = cover.flatMap((e) => e.over).filter((o) => (seen.has(o.id) ? false : (seen.add(o.id), true)))
    spans.push({
      ...template, id: ids.nextEdge(), a: nodes[i - 1].id, b: nodes[i].id, points: pts, length: lengthOf(pts),
      heights: pts.map((q) => heightAt(q.x, q.z)), name: c.street, oneway: false, onewayBack: undefined,
      ease: undefined, over, ...(lane > 1 ? { lane } : { lane: undefined }),
    })
  }
  // ---- scraps: a cross street's junction that stood in the street's median leaves 1–3 m pieces lying on the
  // centreline (16th and Noe); each folds into the corridor's node, so the crossing is one node, not three
  const out = [...kept.map((e) => moved.get(e) ?? e), ...spans]
  const where = new Map<number, Point>()
  for (const n of nodes) where.set(n.id, at(n.s))
  const root = new Map<number, number>()
  const find = (n: number): number => { let r = n; while (root.has(r)) r = root.get(r)!; return r }
  const onLine = (p: Point): boolean => nearest(p).d < 6
  for (let pass = 0; pass < 4; pass++) {
    let changed = false
    for (const e of out) {
      // (by its ends: a scrap may still loop out along the carriageway it was part of, until the later passes trim it)
      if (e.name === c.street || e.length > 40 || distance(e.points[0], e.points[e.points.length - 1]) > 12) continue
      const a = find(e.a), b = find(e.b)
      if (a === b || !onLine(e.points[0]) || !onLine(e.points[e.points.length - 1])) continue
      if (!where.has(a) && !where.has(b)) continue
      // the corridor's node survives
      if (where.has(a)) root.set(b, a)
      else root.set(a, b)
      changed = true
    }
    if (!changed) break
  }
  const folded = !root.size ? out : out.flatMap((e) => {
    const a = find(e.a), b = find(e.b)
    if (a === b) return []
    if (a === e.a && b === e.b) return [e]
    const pts = [...e.points]
    if (a !== e.a) pts[0] = where.get(a) ?? pts[0]
    if (b !== e.b) pts[pts.length - 1] = where.get(b) ?? pts[pts.length - 1]
    return [{ ...e, a, b, points: pts, length: lengthOf(pts), heights: pts.map((q) => heightAt(q.x, q.z)) }]
  })
  // …and of two or three ways from a corridor node to the same node (a cross street and the links that ran beside it
  // between the carriageways), the rider sees one: the named one, else the shortest
  const best = new Map<string, RideEdge>()
  for (const e of folded) {
    if (!where.has(e.a) && !where.has(e.b)) continue
    const k = e.a < e.b ? `${e.a}:${e.b}` : `${e.b}:${e.a}`, o = best.get(k)
    if (!o || (!!e.name && !o.name) || (!!e.name === !!o.name && e.length < o.length)) best.set(k, e)
  }
  return folded.filter((e) => {
    if (!where.has(e.a) && !where.has(e.b)) return true
    const o = best.get(e.a < e.b ? `${e.a}:${e.b}` : `${e.b}:${e.a}`)!
    return o === e || o.length > e.length * 2 || e.length > o.length * 2
  })
}

/**
 * NO SHARP TURN NEAR A JUNCTION (owner, 2026-10-24: "we should try to make sure there are no sharp turns within N meters
 * of an intersection … the bike takes a sharp turn back and forth following the lines … the divided streets merging
 * and separating is also annoying"; docs/INTERSECTIONS.md). The last pass, on the finished graph, so it catches a kink
 * whatever made it: a cluster's centre (`collapseClusters`), a carriageway pulled onto a boulevard's midline
 * (`mergeParallel` — on a carriageway cut short by crosswalk nodes there was no room to ease it, and Guerrero's swung
 * 4.5 m across in its last 6 m, a 45° kink, once `contract` had joined the pieces), or OSM's own geometry.
 *
 * For each end of each street edge at a junction (three or more ways): the street's own LINE, from 12 to 45 m out (at
 * most 70% of the edge) — skipped if that stretch is not straight (a street that really curves); how far the junction
 * sits off that line; and whether the approach turns sharply (over 12°) inside the span. If it does, the approach is
 * rebuilt along the line with the offset faded in smoothly over `reach` (6× the offset, 12 to 30 m, at most 45% of
 * the edge), so the street meets the junction square-on; points beyond `reach` are kept. Where the edge meets its own
 * street's merged midline (a `lane` edge of the same name at that node), the shift is recorded (`ease`) so the rider
 * holds their carriageway's line through the transition (navigate.ts `easeAt`) rather than swinging in and out.
 */
export function smoothApproaches(edges: RideEdge[]): RideEdge[] {
  const deg = degrees(edges)
  const byNode = new Map<number, RideEdge[]>()
  for (const e of edges) for (const n of [e.a, e.b]) (byNode.get(n) ?? byNode.set(n, []).get(n)!).push(e)
  const fall = (s: number, reach: number): number => (s >= reach ? 0 : (1 - s / reach) ** 2 * (1 + 2 * (s / reach)))
  const at = (pts: Point[], d: number): Point => pointAt(pts, Math.max(0, Math.min(lengthOf(pts), d)))
  const out: RideEdge[] = []
  for (const e0 of edges) {
    let e = e0
    if (e.foot || e.bridge || e.tunnel || e.raised || e.lane || e.a === e.b || e.length < 24) { out.push(clampEase(e, byNode)); continue }
    for (const atEnd of [false, true]) {
      const node = atEnd ? e.b : e.a
      if ((deg.get(node) ?? 0) < 3) continue
      const pts = atEnd ? [...e.points].reverse() : e.points
      const len = lengthOf(pts)
      const hi = Math.min(45, 0.7 * len)
      if (hi - 12 < 8) continue
      const p0 = at(pts, 12), p1 = at(pts, hi)
      const L = distance(p0, p1)
      if (L < 6) continue
      const ux = (p1.x - p0.x) / L, uz = (p1.z - p0.z) / L
      // the line's stretch must be straight: no point of it over 0.8 m off the chord
      let s = 0, straight = true, sharp = 0
      for (let i = 1; i < pts.length; i++) {
        s += distance(pts[i - 1], pts[i])
        if (s > 12 && s < hi && Math.abs((pts[i].x - p0.x) * uz - (pts[i].z - p0.z) * ux) > 0.8) { straight = false; break }
      }
      if (!straight) continue
      // a sharp turn inside the span the fade would take?
      s = 0
      for (let i = 1; i < pts.length - 1 && s < 30; i++) {
        s += distance(pts[i - 1], pts[i])
        const ax = pts[i].x - pts[i - 1].x, az = pts[i].z - pts[i - 1].z, bx = pts[i + 1].x - pts[i].x, bz = pts[i + 1].z - pts[i].z
        const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz)
        if (la < 0.2 || lb < 0.2) continue
        sharp = Math.max(sharp, Math.acos(Math.max(-1, Math.min(1, (ax * bx + az * bz) / (la * lb)))) / DEG)
      }
      if (sharp <= 12) continue
      // the junction against the line: where it projects onto it (`t0`, metres along the line from p0, negative), and
      // how far off it is (`d`, along the left normal (−uz, ux)... signed so that `base + n·d` is the node)
      const nd = pts[0]
      const t0 = (nd.x - p0.x) * ux + (nd.z - p0.z) * uz
      const nx = -uz, nz = ux
      const d = (nd.x - p0.x) * nx + (nd.z - p0.z) * nz
      if (Math.abs(d) > 8 || t0 > -4) continue
      const reach = Math.min(30, Math.max(12, 6 * Math.abs(d)), 0.45 * len, -t0 + 12)
      // the new approach: along the line from the node's foot, the offset faded out over `reach`
      const fresh: Point[] = []
      const step = 2
      for (let r = 0; r < reach; r += step) {
        const k = fall(r, reach)
        fresh.push({ x: p0.x + ux * (t0 + r) + nx * d * k, z: p0.z + uz * (t0 + r) + nz * d * k })
      }
      fresh[0] = nd
      // the rest: the original points beyond `reach` along the line
      const keepFrom = pts.findIndex((q) => (q.x - p0.x) * ux + (q.z - p0.z) * uz > t0 + reach)
      if (keepFrom < 1) continue
      const newPts = [...fresh, ...pts.slice(keepFrom)]
      // heights: each new point takes the original's height at the same distance from the junction
      let heights: number[] | undefined
      if (e.heights && e.heights.length === e.points.length) {
        const hs = atEnd ? [...e.heights].reverse() : e.heights
        const cum = [0]
        for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + distance(pts[i - 1], pts[i]))
        const hAt = (dd: number): number => {
          let i = 1
          while (i < cum.length - 1 && cum[i] < dd) i++
          const t = cum[i] > cum[i - 1] ? Math.max(0, Math.min(1, (dd - cum[i - 1]) / (cum[i] - cum[i - 1]))) : 0
          return hs[i - 1] + (hs[i] - hs[i - 1]) * t
        }
        heights = [...fresh.map((_, i) => hAt(i * step)), ...hs.slice(keepFrom)]
        heights[0] = hs[0]
      }
      const merging = (byNode.get(node) ?? []).some((f) => f !== e && f.lane && f.name && f.name === e.name)
      let ease = e.ease ? [...e.ease] : undefined
      if (merging) {
        // the shift, right of a→b: the path moved from the line onto the node by `d` along the left normal of the
        // line's outward direction; right of a→b is the left of outward at the a end, the right of it at the b end
        const lat = Math.round((atEnd ? -d : d) * -1 * 100) / 100
        ease = ease ?? [0, 0, 0, 0]
        if (atEnd) { ease[2] = Math.round(reach * 10) / 10; ease[3] = lat } else { ease[0] = Math.round(reach * 10) / 10; ease[1] = lat }
      }
      if (merging && ease) {
        // (no more than the midline edge's own `lane`: the rider is put back only as far as that edge will carry them, so
        //  at the node the two agree and nothing steps; the rest of the shift is ridden, along the eased approach)
        const lane = Math.max(...(byNode.get(node) ?? []).filter((f) => f.lane && f.name === e.name).map((f) => f.lane!))
        const k = atEnd ? 3 : 1
        if (Math.abs(ease[k]) > lane) ease[k] = Math.round(Math.sign(ease[k]) * lane * 100) / 100
      }
      const finalPts = atEnd ? newPts.reverse() : newPts
      const finalHs = heights ? (atEnd ? heights.reverse() : heights) : undefined
      e = { ...e, points: finalPts, length: lengthOf(finalPts), heights: finalHs && finalHs.length === finalPts.length ? finalHs : undefined,
        ...(ease ? { ease } : {}) }
    }
    out.push(clampEase(e, byNode))
  }
  return out
}

/** An edge's recorded put-back (`ease`) at an end where it meets a merged midline, no more than that edge's `lane`. */
function clampEase(e: RideEdge, byNode: Map<number, RideEdge[]>): RideEdge {
  if (!e.ease) return e
  const ease = [...e.ease]
  for (const [k, node] of [[1, e.a], [3, e.b]] as const) {
    if (!ease[k]) continue
    const lanes = (byNode.get(node) ?? []).filter((f) => f !== e && f.lane && f.name === e.name).map((f) => f.lane!)
    const lane = lanes.length ? Math.max(...lanes) : 0
    if (Math.abs(ease[k]) > lane) ease[k] = Math.round(Math.sign(ease[k]) * lane * 100) / 100
  }
  return { ...e, ease }
}

const DEG = Math.PI / 180

/**
 * What the rider may do at a ride-graph node: `exits()` less the choices that are not real ones. An exit
 * more than 150° round is doubling back onto the other carriageway and is offered only if nothing else is;
 * two exits within 20° of each other are one choice (two carriageways leaving side by side), and the named
 * one, then the longer, is kept.
 */
/** A street's name without its type, so its carriageways and service lanes fold together. */
const STREET_TYPE = /\s+(street|st|boulevard|blvd|avenue|ave|drive|dr|way|place|pl|road|rd|lane|ln|terrace|court|ct|alley|plaza|promenade|embarcadero)$/i
export function trunkName(name: string | undefined): string | undefined {
  if (!name) return undefined
  const base = name.replace(STREET_TYPE, '').trim().toLowerCase()
  return base.length >= 3 ? base : name.toLowerCase()
}

export function rideExits(g: CityGraph, nodeId: number, arrivedOn: number | null): Exit[] {
  const every = exits(g, nodeId, arrivedOn)
  // (not the wrong way up a freeway — unless there is nothing else, which `pruneFreewayTraps` has seen there is not)
  const legal = every.filter((x) => !againstFreeway(g.edges.get(x.edgeId)!, nodeId))
  const all = legal.length > 0 ? legal : every
  let keep = all.filter((x) => Math.abs(x.angle) <= 150 * DEG)
  if (keep.length === 0 && all.length > 0) keep = [all[0]]
  // (the street the rider is on goes first: where its continuation and a cross street leave within 20° of each
  // other, the continuation is the one kept — the Embarcadero at Washington, 2026-10-06)
  const onTrunk = arrivedOn === null ? undefined : trunkName(g.edges.get(arrivedOn)?.name)
  const pref = [...keep].sort((p, q) => {
    const ep = g.edges.get(p.edgeId)!
    const eq = g.edges.get(q.edgeId)!
    if (onTrunk !== undefined) {
      const sp = trunkName(ep.name) === onTrunk, sq = trunkName(eq.name) === onTrunk
      if (sp !== sq) return sp ? -1 : 1
    }
    if (!!ep.name !== !!eq.name) return ep.name ? -1 : 1
    return eq.length - ep.length
  })
  /*
   * Star junctions (BUGS.md #40) are mostly artefacts of the data, and are untangled here, at the choice:
   * - two exits onto the SAME street within 50° are one choice (a boulevard's two carriageways, or its pieces
   *   either side of a median, leaving side by side). The name is compared without its type, so "Octavia Street"
   *   and "Octavia Boulevard" — the same street, its carriageway and its service lane — fold together
   *   (San Francisco, BUGS.md #52);
   * - a service road or alley that leaves within 35° of a named street beside it is that street's service lane,
   *   not a choice of its own;
   * - a short unnamed link (under 40 m: the links across a split boulevard, a slip, a service mouth) is not
   *   offered where the junction already has three or more real streets to choose from.
   */
  const real = pref.filter((x) => { const e = g.edges.get(x.edgeId)!; return !!e.name || e.length >= 40 })
  const offered = real.length >= 3 ? real : pref
  const chosen: Exit[] = []
  for (const x of offered) {
    const e = g.edges.get(x.edgeId)!
    const b = departureBearing(g, x.edgeId, nodeId)
    const base = trunkName(e.name)
    const lane = e.kind === 'service' || e.kind === 'alley'
    if (chosen.some((c) => {
      const ce = g.edges.get(c.edgeId)!
      const d = Math.abs(angleDiff(departureBearing(g, c.edgeId, nodeId), b))
      if (d < 20 * DEG) return true
      if (base !== undefined && trunkName(ce.name) === base) {
        // the same street: its carriageways leaving side by side, or a short stub of it round a bend — but never
        // the other direction along it, which is a real choice
        if (d < 50 * DEG) return true
        if (d < 100 * DEG && Math.min(e.length, ce.length) < 30) return true
      }
      // a service lane beside a street it runs with
      return (lane || ce.kind === 'service' || ce.kind === 'alley') && d < 35 * DEG && (!!ce.name || !!e.name)
    })) continue
    chosen.push(x)
  }
  chosen.sort((p, q) => Math.abs(p.angle) - Math.abs(q.angle))
  /*
   * STRAIGHT ON IS THE SAME STREET (owner, 2026-10-06, the Embarcadero at Washington: "very hard to go straight").
   * OSM's southbound Embarcadero jogs west through that junction to meet Washington Street, so its own continuation
   * leaves at ~70° while Washington, dead straight across, leaves nearer the rider's heading: "straight" took
   * Washington. Where the street the rider arrived on goes on, and only one exit does, within 100°, that exit IS
   * straight on — first in the list, and the others are turns by their side.
   */
  const arrived = arrivedOn === null ? undefined : g.edges.get(arrivedOn)
  const trunk = trunkName(arrived?.name)
  if (trunk !== undefined) {
    // (judged 30 m out, not by the first 8 m that `exits` reads: the jog at the junction is what hid it)
    const out30 = (edgeId: number): number => {
      const e = g.edges.get(edgeId)!
      const pts = e.a === nodeId ? e.points : [...e.points].reverse()
      let i = 1, run = 0
      while (i < pts.length - 1 && (run += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)) < 30) i++
      return bearing(pts[0], pts[i])
    }
    // (both ways: the arrival jogs into the junction just as the continuation jogs out)
    const heading = out30(arrivedOn!) + Math.PI
    const far = (edgeId: number): number => Math.abs(angleDiff(heading, out30(edgeId)))
    const same = chosen.filter((x) => trunkName(g.edges.get(x.edgeId)!.name) === trunk && far(x.edgeId) < 70 * DEG)
    if (same.length === 1 && same[0].turn !== 'straight') {
      const on = same[0]
      for (const x of chosen) if (x !== on && x.turn === 'straight') x.turn = x.angle < 0 ? 'left' : 'right'
      on.turn = 'straight'
      // (and shown as the way the street really goes, not the jog)
      on.angle = angleDiff(heading, out30(on.edgeId))
      chosen.splice(chosen.indexOf(on), 1)
      chosen.unshift(on)
    }
  }
  return chosen
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

/** Does the straight line a→b pass through any of these footprints (sampled every metre)? */
export function footprintTest(rings: number[][]): (a: Point, b: Point) => boolean {
  const CELL = 50
  const grid = new Map<string, number[][]>()
  for (const r of rings) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); z0 = Math.min(z0, r[i + 1]); z1 = Math.max(z1, r[i + 1]) }
    for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++) {
      for (let gz = Math.floor(z0 / CELL); gz <= Math.floor(z1 / CELL); gz++) (grid.get(`${gx},${gz}`) ?? grid.set(`${gx},${gz}`, []).get(`${gx},${gz}`)!).push(r)
    }
  }
  const inside = (r: number[], x: number, z: number): boolean => {
    let o = false
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
    }
    return o
  }
  return (a, b) => {
    const n = Math.max(2, Math.ceil(distance(a, b)))
    // not the last metre at either end: a street's end is often mapped a hand's breadth inside a wall
    for (let k = 1; k < n - 1; k++) {
      const x = a.x + ((b.x - a.x) * k) / n
      const z = a.z + ((b.z - a.z) * k) / n
      for (const r of grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`) ?? []) if (inside(r, x, z)) return true
    }
    return false
  }
}
