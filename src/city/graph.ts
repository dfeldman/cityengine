/**
 * The street network, and the one question the whole game is built on: **when the rider reaches this
 * junction, which way is left?**
 *
 * OSM gives a pile of ways sharing node ids. Joined at the shared nodes they become a graph, and a junction
 * is simply a node with more than two edges meeting at it. What a rider can do there is not a list of edges —
 * it is left, straight and right, resolved from the direction they are travelling:
 *
 *                     ↑ incoming heading
 *                     │
 *      left  ◄───────( )───────►  right        an edge is 'left' if the turn onto it is
 *                     │                        between about 30° and 150° anticlockwise
 *                     ▼ straight
 *
 * Two details matter and both are tested. **Straight is whatever is closest to straight on**, not "the edge
 * that continues the same OSM way" — ways are split arbitrarily and a rider going straight through a junction
 * does not care which way id they end up on. And **U-turns are not offered**: the edge the rider came in on is
 * excluded, because a button press that spins you around is never what the press meant.
 */
import { angleDiff, bearing, distance, type Point } from './geo.ts'

export type Turn = 'left' | 'straight' | 'right'

export interface Edge {
  id: number
  /** node ids at each end */
  a: number
  b: number
  /** the shape, a→b, in local metres; includes both endpoints */
  points: Point[]
  length: number
  /** what OSM said it is made of, which the ride model reads for rolling resistance */
  surface: 'asphalt' | 'concrete' | 'cobblestone' | 'gravel' | 'dirt' | 'wood'
  /** carriageway width in metres — the corridor less its pavements */
  width: number
  /** the pavement either side, in metres; 0 on a lane too narrow to have one */
  walk: number
  name?: string
  /** true for footways and paths: a runner may use them, a bike is discouraged but not forbidden */
  foot: boolean
  /** a marked place where a footway crosses a carriageway: nobody walks ALONG it */
  crossing?: boolean
  /** a structure (a bridge, a ramp onto one): things on it take their height from `heights`, not the ground */
  raised?: boolean
  /**
   * On a ride edge that is the midline of a boulevard drawn twice: how far right of the midline the rider's
   * own carriageway is. Riding the midline itself put the rider on the median (Rue Saint-Antoine).
   */
  lane?: number
  /** ground height at each point, parallel to `points`; absent on a city baked flat */
  heights?: number[]
  /** optional so hand-built test graphs need not say; an edge with no kind counts as a residential street */
  /** the OSM `highway` value — what kind of way this is, which decides whether the rider is steered down it */
  kind?: string
  /** through a building at grade (an arch, a covered passage): ridden, and drawn as an arch */
  passage?: boolean
  /** OSM `service=*`: a parking aisle or a driveway is not a street */
  service?: string
  oneway?: boolean
  /** the one way runs from `b` to `a`: a ride edge joined from map edges, turned round to join (ridegraph.ts) */
  onewayBack?: boolean
  /** OSM `layer`, for keeping a bridge and the street under it apart */
  layer?: number
  bridge?: boolean
  tunnel?: boolean
  /** a street tunnel under a hill, ridden and drawn as a tunnel (tools/tunnels.ts) */
  bore?: boolean
  /** a freeway way the bike rides (package.ts `ridden`) */
  ridden?: boolean
  /** a way the region drew (package.ts `authored`) */
  authored?: boolean
  /**
   * On a RIDE graph (ridegraph.ts), the map edges this edge was built from, in order from its `a` end, with
   * `reversed` true where that map edge runs b→a inside it. Absent on the map graph.
   */
  over?: OverEntry[]
}

export interface OverEntry { id: number; reversed: boolean; length: number }

export interface Node {
  id: number
  at: Point
  /** edge ids meeting here */
  edges: number[]
}

export interface CityGraph {
  nodes: Map<number, Node>
  edges: Map<number, Edge>
}

export function buildGraph(edges: Edge[]): CityGraph {
  const g: CityGraph = { nodes: new Map(), edges: new Map() }
  addEdges(g, edges)
  return g
}

/** Add edges to a graph in place (a streamed city grows as its tiles arrive); an edge already in is skipped. */
export function addEdges(g: CityGraph, edges: Edge[]): void {
  const nodes = g.nodes
  const byId = g.edges
  for (const e of edges) {
    if (byId.has(e.id)) continue
    byId.set(e.id, e)
    for (const [id, at] of [[e.a, e.points[0]], [e.b, e.points[e.points.length - 1]]] as const) {
      const n = nodes.get(id as number) ?? { id: id as number, at: at as Point, edges: [] }
      if (!n.edges.includes(e.id)) n.edges.push(e.id)
      nodes.set(id as number, n)
    }
  }
}

/** The direction an edge leaves `nodeId` in — the bearing of its first few metres, not of its whole length. */
export function departureBearing(g: CityGraph, edgeId: number, nodeId: number): number {
  const e = g.edges.get(edgeId)!
  const pts = e.a === nodeId ? e.points : [...e.points].reverse()
  // A long curving street leaves the junction in one direction and ends up pointing somewhere else entirely;
  // what the rider sees and steers by is the first bit.
  let i = 1
  while (i < pts.length - 1 && distance(pts[0], pts[i]) < 8) i++
  return bearing(pts[0], pts[i])
}

/** The direction the rider is travelling as they ARRIVE at `nodeId` along `edgeId`. */
export function arrivalBearing(g: CityGraph, edgeId: number, nodeId: number): number {
  return departureBearing(g, edgeId, nodeId) + Math.PI
}

export interface Exit {
  edgeId: number
  /** the node at the far end of that edge */
  to: number
  turn: Turn
  /** radians, signed, negative = to the left */
  angle: number
}

/**
 * Everything the rider may do at this junction, classified. Sorted so the straightest option comes first,
 * which is also the order the HUD shows them in.
 */
export function exits(g: CityGraph, nodeId: number, arrivedOn: number | null): Exit[] {
  const node = g.nodes.get(nodeId)
  if (!node) return []
  // `arrivalBearing` already points the way the rider is travelling; adding π again turned every left into
  // a right and every straight into a U-turn.
  const heading = arrivedOn === null ? 0 : arrivalBearing(g, arrivedOn, nodeId)

  const out: Exit[] = []
  for (const edgeId of node.edges) {
    if (edgeId === arrivedOn) continue // never offer a U-turn
    const e = g.edges.get(edgeId)!
    const angle = angleDiff(heading, departureBearing(g, edgeId, nodeId))
    out.push({
      edgeId,
      to: e.a === nodeId ? e.b : e.a,
      angle,
      turn: Math.abs(angle) < Math.PI / 4 ? 'straight' : angle < 0 ? 'left' : 'right',
    })
  }
  return out.sort((p, q) => Math.abs(p.angle) - Math.abs(q.angle))
}

/**
 * Which exit a turn intent picks.
 *
 * The rider presses left; there may be two left turns, or none. So: prefer an exit of the requested kind,
 * taking the one closest to a square turn when there are several, and fall back to whatever is straightest
 * when the junction cannot honour the request. Falling back rather than stopping is deliberate — a rider
 * pedalling at 25 km/h who asked for a left that is not there should keep moving, and the HUD only ever
 * offers turns that exist.
 */
export function resolve(exits_: Exit[], want: Turn): Exit | null {
  if (exits_.length === 0) return null
  const matching = exits_.filter((e) => e.turn === want)
  if (matching.length > 0) {
    if (want === 'straight') return matching[0] // already sorted straightest-first
    // the most convincing left is the one nearest a right angle, not the one nearest straight on
    return matching.reduce((best, e) =>
      Math.abs(Math.abs(e.angle) - Math.PI / 2) < Math.abs(Math.abs(best.angle) - Math.PI / 2) ? e : best)
  }
  return exits_[0]
}

/** Which turns this junction can actually offer, for the HUD to light up. */
export function available(exits_: Exit[]): Set<Turn> {
  return new Set(exits_.map((e) => e.turn))
}

/** The length of a polyline, in metres. */
export function lengthOf(points: Point[]): number {
  let t = 0
  for (let i = 1; i < points.length; i++) t += distance(points[i - 1], points[i])
  return t
}

/** Union-find over ids, for connected components and junction clusters. One copy, used by the bake and the ride graph. */
export class UnionFind {
  private readonly parent = new Map<number, number>()
  find(x: number): number {
    if (!this.parent.has(x)) this.parent.set(x, x)
    let r = this.parent.get(x)!
    while (r !== this.parent.get(r)) r = this.parent.get(r)!
    // path compression
    let c = x
    while (c !== r) { const n = this.parent.get(c)!; this.parent.set(c, r); c = n }
    return r
  }
  union(a: number, b: number): void { this.parent.set(this.find(a), this.find(b)) }
}

/** The edges of the largest connected island. An island the rider can never reach is worse than none. */
export function largestComponent<E extends { a: number; b: number }>(edges: E[]): E[] {
  const uf = new UnionFind()
  for (const e of edges) uf.union(e.a, e.b)
  const size = new Map<number, number>()
  for (const e of edges) {
    const r = uf.find(e.a)
    size.set(r, (size.get(r) ?? 0) + 1)
  }
  let best = -1
  let bestN = 0
  for (const [r, n] of size) if (n > bestN) { best = r; bestN = n }
  return edges.filter((e) => uf.find(e.a) === best)
}
