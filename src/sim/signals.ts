/**
 * Who may go at a junction (owner, 2026-09-29). Four kinds:
 *
 *   * **lights** — exactly the junctions the renderer draws signals at (render/city.ts `lightsIn`, published as
 *     `City.lit`): what you see is what is timed. The approaches split into TWO groups by bearing — a street
 *     and its continuation across the junction go together, the cross street is the other group — and the
 *     groups alternate on a SHORT cycle, so a rider waiting at red always gets a chance soon ("we don't want
 *     them waiting forever"). Each junction starts at its own point in the cycle, so the city is not in
 *     lockstep.
 *   * **stop4** — an all-way stop: three or more driving arms of about the same size.
 *   * **stop2** — the bigger road runs free and the side streets stop.
 *   * **none** — uncontrolled: two-arm joins, service lanes, dead ends.
 *
 * The signs for the two stop kinds are not drawn yet; the behaviour is here already so the traffic is right.
 *
 * Code frame: x east, z north, metres; bearing 0 is +z.
 */
import type { CityGraph, Edge } from '../city/graph.ts'

export type ControlKind = 'lights' | 'stop4' | 'stop2' | 'none'
export type Aspect = 'green' | 'amber' | 'red'

/** seconds */
export const GREEN = 15
export const AMBER = 3
export const ALL_RED = 2.5
export const CYCLE = 2 * (GREEN + AMBER + ALL_RED)

export interface Arm { edgeId: number; bearing: number; width: number }

export interface Control {
  nodeId: number
  kind: ControlKind
  arms: Arm[]
  /** lights: each arm's group, 0 or 1 */
  group: Map<number, 0 | 1>
  /** stop2: the arms of the road that does not stop */
  major: Set<number>
  /** lights: where in the cycle this junction starts, seconds */
  offset: number
  /** the box: metres from the node a vehicle is "in" the junction */
  radius: number
}

/** a driving arm: not a footway, wide enough to carry a car */
// (never a cycleway, however wide: the Bay Bridge Trail is 4.7 m, and cars queued along it over the east span)
// …and always a freeway ramp, however narrow the bake made it: an untagged `motorway_link` came out 3 m wide, and
// the only way onto the Bay Bridge's upper deck from Yerba Buena was closed to every car
export const drives = (e: Edge): boolean => !e.foot && (e.width >= 4.2 || e.kind === 'motorway_link') && e.kind !== 'cycleway'

/** the bearing an edge LEAVES a node along */
export function bearingFrom(e: Edge, nodeId: number): number {
  const p = e.points
  const [a, b] = e.a === nodeId ? [p[0], p[Math.min(1, p.length - 1)]] : [p[p.length - 1], p[Math.max(0, p.length - 2)]]
  return Math.atan2(b.x - a.x, b.z - a.z)
}

const hash = (n: number): number => {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export class Signals {
  private readonly g: CityGraph
  private readonly lit: (nodeId: number) => boolean
  private readonly decided: (nodeId: number) => boolean
  private readonly cache = new Map<number, Control>()

  /**
   * `lit`: does the renderer draw lights at this node (City.lit). `decided`: has it decided yet — a junction asked
   * about before its tile is built is answered for now but not remembered, or it would be "no lights" for good.
   */
  constructor(graph: CityGraph, lit: (nodeId: number) => boolean, decided: (nodeId: number) => boolean = () => true) {
    this.g = graph
    this.lit = lit
    this.decided = decided
  }

  control(nodeId: number): Control {
    const had = this.cache.get(nodeId)
    if (had) return had
    const node = this.g.nodes.get(nodeId)
    const arms: Arm[] = []
    for (const id of node?.edges ?? []) {
      const e = this.g.edges.get(id)
      if (e && drives(e) && e.a !== e.b) arms.push({ edgeId: id, bearing: bearingFrom(e, nodeId), width: e.width })
    }
    // generous: a 12 m bus turning inside a tight box swung its nose across the next arm's stop line
    const radius = Math.max(5, ...arms.map((a) => a.width / 2 + 4))
    const group = new Map<number, 0 | 1>()
    const major = new Set<number>()
    let kind: ControlKind = 'none'
    if (arms.length >= 3 || (arms.length === 2 && this.lit(nodeId))) {
      if (this.lit(nodeId)) kind = 'lights'
      else {
        const ws = arms.map((a) => a.width).sort((p, q) => q - p)
        // a clearly bigger road (the two widest arms well above the rest) runs free; otherwise all stop
        kind = ws.length >= 3 && ws[1] >= ws[2] * 1.35 ? 'stop2' : 'stop4'
        if (kind === 'stop2') for (const a of arms) if (a.width >= ws[1]) major.add(a.edgeId)
      }
    }
    if (kind === 'lights') {
      // group by axis: an arm goes with the first arm if it runs along the same line (either way), else across
      const ref = arms[0].bearing
      for (const a of arms) group.set(a.edgeId, Math.abs(Math.cos(a.bearing - ref)) >= Math.SQRT1_2 ? 0 : 1)
    }
    const c: Control = { nodeId, kind, arms, group, major, offset: hash(nodeId) * CYCLE, radius }
    if (this.decided(nodeId)) this.cache.set(nodeId, c)
    return c
  }

  /** The light facing traffic that ARRIVES along `edgeId`, at time `t` seconds; null where there are no lights. */
  aspect(nodeId: number, edgeId: number, t: number): Aspect | null {
    const c = this.control(nodeId)
    if (c.kind !== 'lights') return null
    const g = c.group.get(edgeId)
    if (g === undefined) return null
    const half = GREEN + AMBER + ALL_RED
    // where in the cycle, then shifted so group 1 runs the second half
    const u = ((t + c.offset) % CYCLE + CYCLE) % CYCLE
    const w = g === 0 ? u : (u + half) % CYCLE
    return w < GREEN ? 'green' : w < GREEN + AMBER ? 'amber' : 'red'
  }

  /**
   * The all-red just after this arm's amber: every approach is red. A left-turner still waiting at the line clears
   * out now — oncoming traffic has stopped and the cross street has not started — which is what keeps a left turn
   * from waiting cycle after cycle behind a steady oncoming stream.
   */
  clearing(nodeId: number, edgeId: number, t: number): boolean {
    const c = this.control(nodeId)
    const g = c.group.get(edgeId)
    if (c.kind !== 'lights' || g === undefined) return false
    const u = ((t + c.offset) % CYCLE + CYCLE) % CYCLE
    const w = g === 0 ? u : (u + GREEN + AMBER + ALL_RED) % CYCLE
    return w >= GREEN + AMBER && w < GREEN + AMBER + ALL_RED
  }

  /** seconds until the arm's light next turns green (0 while green) — for the tests' "nobody waits forever" */
  waitFor(nodeId: number, edgeId: number, t: number): number {
    for (let d = 0; d <= CYCLE; d += 0.25) if (this.aspect(nodeId, edgeId, t + d) === 'green') return d
    return Infinity
  }
}
