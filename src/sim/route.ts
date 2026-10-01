/**
 * The GPS (PARIS_EXPAND §6 item 11): the shortest way along the ride graph from where the rider is to a
 * destination, as the sequence of junctions and the edge to leave each one by.
 *
 * The rider is ON an edge, going one way along it: the search starts from the node ahead (the rest of this
 * edge) and, at a cost, from the node behind (turning round, which a rider can do but should not be told to
 * lightly). The destination is a point; the route ends at the nearest point of the ride graph to it, reached
 * from either end of its edge.
 */
import type { CityGraph } from '../city/graph.ts'
import type { Position } from './navigate.ts'
import { againstFreeway } from '../city/ridegraph.ts'

type P = { x: number; z: number }

/** metres a U-turn is worth: turn round only when going on costs more than this extra */
export const TURN_ROUND_COST = 250

export interface Route {
  /** the destination on the graph */
  target: { edgeId: number; s: number; at: P }
  /** the rider's direction when the route starts: false = carry on, true = turn round first */
  turnRound: boolean
  /** node → the edge the route leaves it by, for every junction on the way */
  leave: Map<number, number>
  /** the nodes in order, from the first junction ahead */
  nodes: number[]
  /** the route's shape, for the maps */
  line: P[]
  /** metres from the rider to the destination along it */
  length: number
}

function pointAlong(points: P[], s: number): P {
  let run = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const l = Math.hypot(b.x - a.x, b.z - a.z)
    if (run + l >= s) {
      const t = l > 0 ? (s - run) / l : 0
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }
    }
    run += l
  }
  return points[points.length - 1]
}

/** The point of the graph nearest `p`: its edge and distance along it from `a`. */
export function nearestOnGraph(g: CityGraph, p: P): { edgeId: number; s: number; at: P; d: number } | null {
  let best: { edgeId: number; s: number; at: P; d: number } | null = null
  for (const e of g.edges.values()) {
    let run = 0
    for (let i = 1; i < e.points.length; i++) {
      const a = e.points[i - 1]
      const b = e.points[i]
      const dx = b.x - a.x
      const dz = b.z - a.z
      const len = Math.hypot(dx, dz) || 1e-6
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (len * len)))
      const q = { x: a.x + dx * t, z: a.z + dz * t }
      const d = Math.hypot(q.x - p.x, q.z - p.z)
      if (!best || d < best.d) best = { edgeId: e.id, s: run + len * t, at: q, d }
      run += len
    }
  }
  return best
}

/** A small binary heap of [cost, node]. */
class Heap {
  private readonly a: [number, number][] = []
  get size(): number { return this.a.length }
  push(v: [number, number]): void {
    const a = this.a
    a.push(v)
    let i = a.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (a[p][0] <= a[i][0]) break
      ;[a[p], a[i]] = [a[i], a[p]]
      i = p
    }
  }
  pop(): [number, number] {
    const a = this.a
    const top = a[0]
    const last = a.pop()!
    if (a.length) {
      a[0] = last
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = l + 1
        let m = i
        if (l < a.length && a[l][0] < a[m][0]) m = l
        if (r < a.length && a[r][0] < a[m][0]) m = r
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]
        i = m
      }
    }
    return top
  }
}

/** The shortest route from the rider's position to the target point, or null if none reaches it. */
export function planRoute(g: CityGraph, from: Position, target: P,
  onGraph: { edgeId: number; s: number; at: P } | null = nearestOnGraph(g, target)): Route | null {
  const here = g.edges.get(from.edgeId)
  if (!here || !onGraph) return null
  const goal = g.edges.get(onGraph.edgeId)!
  // on the destination's own edge already, heading to it: no junction in between
  if (goal.id === here.id) {
    const ahead = from.reversed ? onGraph.s <= from.s : onGraph.s >= from.s
    if (ahead) {
      const s0 = Math.min(from.s, onGraph.s)
      const s1 = Math.max(from.s, onGraph.s)
      const line: P[] = []
      for (let s = s0; s <= s1; s += 5) line.push(pointAlong(here.points, s))
      line.push(pointAlong(here.points, s1))
      if (from.reversed) line.reverse()
      return { target: onGraph, turnRound: false, leave: new Map(), nodes: [], line, length: Math.abs(onGraph.s - from.s) }
    }
  }
  const aheadNode = from.reversed ? here.a : here.b
  const behindNode = from.reversed ? here.b : here.a
  const toAhead = from.reversed ? from.s : here.length - from.s
  const toBehind = here.length - toAhead
  // the graph's adjacency, by node
  const adj = new Map<number, number[]>()
  for (const e of g.edges.values()) {
    for (const n of [e.a, e.b]) (adj.get(n) ?? adj.set(n, []).get(n)!).push(e.id)
  }
  const dist = new Map<number, number>()
  const via = new Map<number, { edge: number; prev: number }>()
  const first = new Map<number, 'ahead' | 'behind'>()
  const heap = new Heap()
  const seed = (n: number, d: number, how: 'ahead' | 'behind'): void => {
    if (d < (dist.get(n) ?? Infinity)) { dist.set(n, d); first.set(n, how); heap.push([d, n]) }
  }
  seed(aheadNode, toAhead, 'ahead')
  seed(behindNode, toBehind + TURN_ROUND_COST, 'behind')
  // the goal is reached from either end of its edge — and back into the rider's own edge from the node ahead
  // only by turning round there
  const goalCost = (n: number): number => {
    // (the goal's own edge entered from this end: not the wrong way up a freeway)
    const c = againstFreeway(goal, n) ? Infinity : n === goal.a ? onGraph.s : n === goal.b ? goal.length - onGraph.s : Infinity
    return goal.id === here.id && n === aheadNode ? c + TURN_ROUND_COST : c
  }
  // null, not −1: the ride graph's own synthetic nodes have negative ids (ridegraph.ts `Ids`)
  let bestEnd: number | null = null
  let bestCost = Infinity
  while (heap.size) {
    const [d, n] = heap.pop()
    if (d > (dist.get(n) ?? Infinity)) continue
    if (d >= bestCost) break
    const gc = goalCost(n)
    if (d + gc < bestCost) { bestCost = d + gc; bestEnd = n }
    for (const eid of adj.get(n) ?? []) {
      // not back along the rider's own edge from the node ahead (that is the U-turn, seeded separately)
      if (eid === here.id) continue
      const e = g.edges.get(eid)!
      if (againstFreeway(e, n)) continue
      const m = e.a === n ? e.b : e.a
      const nd = d + e.length
      if (nd < (dist.get(m) ?? Infinity)) {
        dist.set(m, nd)
        via.set(m, { edge: eid, prev: n })
        first.set(m, first.get(n)!)
        heap.push([nd, m])
      }
    }
  }
  // on the destination's own edge with it behind: turning round on the spot is a route of its own
  if (goal.id === here.id) {
    const direct = Math.abs(onGraph.s - from.s) + TURN_ROUND_COST
    if (direct <= bestCost) {
      const s0 = Math.min(from.s, onGraph.s)
      const s1 = Math.max(from.s, onGraph.s)
      const line: P[] = []
      for (let q = s0; q <= s1; q += 5) line.push(pointAlong(here.points, q))
      line.push(pointAlong(here.points, s1))
      if (onGraph.s < from.s) line.reverse()
      return { target: onGraph, turnRound: true, leave: new Map(), nodes: [], line, length: direct }
    }
  }
  if (bestEnd === null) return null
  // walk back from the end to the start node
  const end = bestEnd
  const nodes: number[] = [end]
  const leave = new Map<number, number>()
  for (let n = end; via.has(n);) {
    const v = via.get(n)!
    leave.set(v.prev, v.edge)
    nodes.unshift(v.prev)
    n = v.prev
  }
  leave.set(end, goal.id)
  // the shape: the rest of this edge (or the U-turn back along it), then each edge in turn, then into the goal
  const line: P[] = []
  const startTurn = first.get(end) === 'behind'
  const addEdge = (eid: number, fromNode: number, sEnd?: number): void => {
    const e = g.edges.get(eid)!
    const forward = e.a === fromNode
    const pts = forward ? e.points : [...e.points].reverse()
    if (sEnd === undefined) { line.push(...pts); return }
    const lim = forward ? sEnd : e.length - sEnd
    let run = 0
    line.push(pts[0])
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
      if (run + l >= lim) { line.push(pointAlong(pts, lim)); return }
      line.push(pts[i])
      run += l
    }
  }
  // the part of the rider's own edge to the first node
  {
    const pts: P[] = []
    const endS = (startTurn ? !from.reversed : from.reversed) ? 0 : here.length
    const step = endS > from.s ? 5 : -5
    for (let s = from.s; step > 0 ? s < endS : s > endS; s += step) pts.push(pointAlong(here.points, s))
    pts.push(pointAlong(here.points, endS))
    line.push(...pts)
  }
  for (let i = 0; i + 1 < nodes.length; i++) addEdge(leave.get(nodes[i])!, nodes[i])
  addEdge(goal.id, end, onGraph.s)
  return { target: onGraph, turnRound: startTurn, leave, nodes, line, length: bestCost }
}
