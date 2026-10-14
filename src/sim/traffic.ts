/**
 * The traffic (owner, 2026-09-29): DENSE cars on most streets, turning and going straight at junctions under
 * lights, stop signs or nothing; the rider stuck behind them on a narrow street and riding alongside on a wide
 * one; and the chance of a collision when the rider crosses a junction that has cars in it.
 *
 * It replaces a design built on the opposite premise — "a vehicle must always be able to stop for the rider",
 * straight lines, no junctions, sparse — and keeps only what still holds: vehicles live near the rider, are
 * spawned as streets come into range and vanish as they leave ("cars that are out of view can disappear"), and
 * are seeded so a street's traffic is the same every visit.
 *
 * The rules the owner chose, which everything here serves:
 *
 *   * **Collisions happen only in junctions, from cross traffic.** Along a street a car whose lane the rider is
 *     in treats the rider as the car ahead — it follows, or stops for an oncoming rider — so nothing ever runs
 *     into the rider from behind or down the street.
 *   * **Collisions are RARE.** Lights alternate on a short cycle with an all-red gap (sim/signals.ts), and a car
 *     never enters a junction the rider is already in. What is left is the rider crossing against a red, or
 *     cutting in front of a car already committed to the junction.
 *   * **A collision is not animated**: the car stops for a moment, the game stops the bike and shows a message,
 *     and both carry on. `update` returns the event; `game.ts` does the rest.
 *   * **Held behind a car, except downhill.** `leaderFor` gives the car ahead of the rider for the ride model's
 *     cap (sim/ride.ts). On a descent a car ahead in the rider's lane speeds up instead, so the descent stays the
 *     rider's (README "The descent is a headline feature").
 *
 * Not a traffic simulation in any serious sense: car-following on one lane each way, a turn chosen at random
 * by weight, and first-come-first-served at stops. It only has to look like a busy city from a bicycle.
 *
 * Code frame: x east, z north, metres; heading 0 is +z. Right-hand traffic (Paris and the US alike).
 */
import { distance, type Point } from '../city/geo.ts'
import { exits, type CityGraph, type Edge, type Turn } from '../city/graph.ts'
import { pointAlong } from './navigate.ts'
import { profileAt } from '../city/terrain.ts'
import { SIZE, boxOf, overlap, type Box } from './collide.ts'
import { bearingFrom as bearingOut, drives, type Signals } from './signals.ts'

export type VehicleKind = 'car' | 'bus'

export interface Vehicle {
  id: number
  kind: VehicleKind
  edgeId: number
  /** metres along the edge, measured from its `a` end whichever way the vehicle goes */
  s: number
  /** +1 travelling a→b, −1 the other way */
  dir: 1 | -1
  speed: number
  cruise: number
  /** distance from the centre line to the middle of its lane, metres (always on its own right) */
  lane: number
  colour: [number, number, number]
  /** stopped or slowing hard: the renderer lights the brake lights */
  waiting: boolean
  at: Point
  heading: number
  /** height, on a raised edge (a bridge); absent means "on the ground" */
  y?: number
  /** the street's rise per metre along the direction of travel, where it has a profile (with `level`) */
  slope?: number
  /**
   * The street's own level here (its baked profile), whatever the edge: where the ground answer disagrees with it by
   * metres — a tunnel's cut running under a street that crosses over it (the Stockton Tunnel under Bush Street) —
   * this is where the car really is (render: `nearLevel`).
   */
  level?: number
  /**
   * The footprint the vehicle is DRAWN with, metres (render/street-fleet.ts sets it from the carkit body): a box
   * truck is 7 m, a minivan 5; without it every car was a 4.4 m box and the back of a long one could be ridden through.
   */
  size?: { len: number; wid: number }
  /** a streetcar or cable car standing in for a vehicle (`Traffic.setTransit`): what to call it */
  transit?: string
  /** the exit chosen at the junction ahead, and what kind of turn it is */
  next?: { edgeId: number; dir: 1 | -1; turn: Turn }
  /** while inside a junction: its node, and the arm it came in by */
  inBox?: { nodeId: number; from: number; turn: Turn }
  /**
   * The box it is still curving OUT of, when the next one claimed it first (BUGS.md #250): on a 5–10 m street between
   * two close junctions a car is in the next box the moment it arrives, and the rest of the curve out of the last was
   * skipped — the car snapped round. Kept for `arc` until the car is clear of it.
   */
  prevBox?: { nodeId: number; from: number; turn: Turn }
  /** stopped at the line since this time: a stop sign's first-come-first-served, and a light's patience */
  stoppedAt?: number
  /** has hit the rider already: from then on the two ignore each other, and it drives on */
  bumped?: true
  /** what is holding it back this frame, and why the junction last refused it, for debugging (`window.__traffic`) */
  why?: string
  refused?: string
  /** seconds it has been standing still */
  still?: number
  /** the rider squeezed past it after being held for too long: no longer an obstacle to them */
  passed?: true
  /** until when the junction look-ahead is off for it (the never-stuck valve in `drive`), sim seconds */
  lookOff?: number
  /** a taxi: allowed where private cars are not (`carFree`), and drawn in a taxi livery (render/street-fleet.ts) */
  taxi?: boolean
  /** this driver's own habits (IDM): acceleration, comfortable braking, time gap, standstill gap */
  driver: { a: number; b: number; T: number; s0: number }
}

/** A train, which is several carriages nose to tail on a railway. */
export interface Train {
  railId: number
  s: number
  dir: 1 | -1
  speed: number
  carriages: number
}

export interface TrafficConfig {
  /** vehicles per kilometre of street (both directions), before a zone's multiplier */
  density: number
  /** how far from the rider streets are populated */
  range: number
  /** kept for the old `?traffic=<n>` callers; no longer used */
  clearance?: number
}

export const TRAFFIC: Record<'none' | 'some' | 'busy' | 'dense', TrafficConfig> = {
  none: { density: 0, range: 0 },
  some: { density: 5, range: 190 },
  busy: { density: 11, range: 220 },
  /** the delivery game's city: most streets full (owner, 2026-09-29) */
  /**
   * The delivery game's city: most streets busy, queues and stop-and-go, but flowing. Measured on sf-mini's streets
   * with tools/traffic-soak.ts over 10 simulated minutes: 60/km flows freely, 80 queues and recovers, 100 locks
   * solid in rings round the blocks. A zone's `traffic` multiplier can push past this; the release valve in
   * `update` then keeps a jam from spreading.
   */
  dense: { density: 80, range: 230 },
}

/** What the traffic needs to know about the rider each frame. */
export interface RiderNow {
  at: Point
  heading: number
  speed: number
  /** the edge the rider is on, and where along it (from `a`), and which way */
  edgeId: number
  s: number
  dir: 1 | -1
  /** grade of the road under the rider, rise/run (negative downhill) */
  grade: number
  box: Box
  /**
   * The height of the road under the rider (optional). With it, a vehicle on another LEVEL — a street over a
   * tunnel, a road under a bridge — is not in the rider's way, cannot be hit, and does not wait for them (the
   * Broadway Tunnel, 2026-09-29: six "collisions" in one ride with cars on the streets 25 m overhead).
   */
  y?: number
}

/** vertical separation beyond which the rider and a vehicle are on different levels */
const LEVELS = 3.5

/** a moving vehicle hitting the rider: in a junction (`nodeId`), or anywhere along a street (`nodeId` -1) */
export interface Collision { vehicle: Vehicle; nodeId: number; at: Point }

/** grade below which the rider is on a descent: cars ahead get out of the way instead of holding them */
export const DESCENT = -0.04
/**
 * Seconds standing before a vehicle stops looking ahead in a junction and goes as the rules let it (`drive`): the
 * give-up that turns a ring of waiting into a rare overlap. 2 s until 2026-10-02; 10 s now that a jam has a sure way
 * out (the release valve), because each give-up was a car driving into another (BUGS.md #244): soaked 600 s,
 * deep overlaps 732 → 502 at 6 s, 470 at 10, nothing stuck either way.
 */
export const LOOK_PATIENCE = 10
/** m/s: traffic going the rider's way slower than this is woven round, not followed */
export const CRAWL = 6
/** metres: the grid cell for finding the vehicles near one */
const NEAR_CELL = 16

// Saturated, flat, and a few of them deliberately drab, because a street where every car is a jellybean
// looks like a toy rather than a city.
const CAR_COLOURS: [number, number, number][] = [
  [0.78, 0.20, 0.18], [0.16, 0.30, 0.58], [0.92, 0.88, 0.84], [0.14, 0.15, 0.17],
  [0.35, 0.52, 0.34], [0.86, 0.66, 0.16], [0.55, 0.57, 0.60], [0.28, 0.52, 0.56],
  [0.70, 0.36, 0.14], [0.42, 0.28, 0.48],
]

/** bumper to bumper at a standstill, metres; the centre-to-centre gap adds both vehicles' half-lengths */
const BUMPER = 3
/** how far out a car chooses its turn */
const CHOOSE = 40
/**
 * Seconds a left-turner waits at a green light for the oncoming traffic before it goes anyway, and the oncoming
 * traffic lets it. Without it a steady oncoming stream kept a left turn — and every car queued behind it on a
 * one-lane street — waiting cycle after cycle (92 s in the crossroads test).
 */
const PATIENCE = 8

function rng(seed: number): () => number {
  let a = (seed ^ 0x6d2b79f5) >>> 0
  return () => {
    a = (a + 0x9e3779b9) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** may this edge be driven in this direction */
// never into a tunnel that is not a street tunnel under a hill (`bore`): a motorway tunnel is not drawn, and cars
// that drove into one were drawn along the ground above it
const allowed = (e: Edge, dir: 1 | -1): boolean => drives(e) && !(e.tunnel && !e.bore) && !(e.oneway && dir < 0)
/** the lane: right of the centre, half a lane out, less on a narrow street */
export const laneOf = (e: Edge): number => Math.min(2.6, e.width * 0.24)

export class Traffic {
  private readonly g: CityGraph
  private readonly cfg: TrafficConfig
  private readonly signals: Signals | null
  /** the zone's traffic multiplier at a point (ZoneProps.traffic), 1 where no zone says */
  private readonly zoneFactor: (p: Point) => number
  /**
   * A street private cars may not use — only buses and taxis (owner, 2026-10-03: "Market Street is buses and taxis
   * only … and streetcars of course … and, now, delivery bikes"). The region decides (game.ts: San Francisco's Market
   * Street from 10th to the Embarcadero, car-free since 2020).
   */
  private readonly carFree: (e: Edge) => boolean
  /** no vehicle at all: a driveway through a building (game.ts `closed`) */
  /** how many of a street's usual cars it carries (game.ts: a Slow Street carries a few, for access) */
  private readonly edgeFactor: (e: Edge) => number
  private readonly closed: (e: Edge) => boolean
  /** may this vehicle drive this street at all (a private car on a car-free one may not) */
  private mayUse(v: { kind: VehicleKind; taxi?: boolean }, e: Edge): boolean { return !this.closed(e) && (v.kind === 'bus' || !!v.taxi || !this.carFree(e)) }
  private readonly vehicles: Vehicle[] = []
  /** how many vehicles each street should carry, once it has been seen */
  private readonly target = new Map<number, number>()
  private t = 0
  private lastDt = 0
  private heldBy: Vehicle | null = null
  private heldFor = 0
  private readonly near = new Map<string, Vehicle[]>()
  /** the junction look-ahead in `drive` (off only to measure it: tools/traffic-soak.ts LOOKAHEAD=0) */
  private readonly lookAhead: boolean
  /** this frame's lanes, for the look-ahead into the street a car is turning into */
  private laneCache = new Map<string, Vehicle[]>()
  /** where the rider is and which way they face, for "can the rider see this" */
  private view: { at: Point; fx: number; fz: number } = { at: { x: 0, z: 0 }, fx: 0, fz: 0 }
  private nextId = 1
  private refillAt = 0
  private readonly r = rng(0xc0ffee)

  constructor(graph: CityGraph, level: keyof typeof TRAFFIC | TrafficConfig = 'some',
    opt: { signals?: Signals; zoneFactor?: (p: Point) => number; lookAhead?: boolean; carFree?: (e: Edge) => boolean; closed?: (e: Edge) => boolean; edgeFactor?: (e: Edge) => number } = {}) {
    this.lookAhead = opt.lookAhead ?? true
    this.carFree = opt.carFree ?? (() => false)
    this.closed = opt.closed ?? (() => false)
    this.edgeFactor = opt.edgeFactor ?? (() => 1)
    this.g = graph
    this.cfg = typeof level === 'string' ? TRAFFIC[level] : level
    this.signals = opt.signals ?? null
    this.zoneFactor = opt.zoneFactor ?? (() => 1)
  }

  get all(): readonly Vehicle[] { return this.vehicles }
  get time(): number { return this.t }

  /**
   * Populate the streets near the rider, move everything, retire what has gone out of range, and report any
   * collision with the rider (in a junction, per the rules above). `rider` may be a bare point, for callers that
   * only want the city to look busy.
   */
  /**
   * THE STREETCARS AND CABLE CARS, as obstacles (owner, 2026-10-01: "they have no collision so people, cars, and the
   * player go right through"). render/life.ts runs them on their rails and says, every frame, where each car is; here
   * each becomes a stand-in vehicle — kept by id, so a tram that hit the rider stays `bumped` — that cars queue behind
   * (`drive`), that holds and fences the rider (`leaderFor`, `alongside`, `weave`) and that can hit them (`update`).
   */
  setTransit(bodies: readonly { id: string; x: number; z: number; y: number; heading: number; speed: number; len: number; wid: number; kind: number }[]): void {
    const seen = new Set<string>()
    for (const b of bodies) {
      seen.add(b.id)
      let v = this.trams.get(b.id)
      if (!v) {
        v = { id: -1, kind: 'bus', edgeId: -1, s: 0, dir: 1, speed: 0, cruise: 0, lane: 0, colour: [1, 1, 1], waiting: false,
          at: { x: b.x, z: b.z }, heading: 0, driver: { a: 1, b: 2, T: 1, s0: 2 },
          transit: b.kind === 3 ? 'cable car' : 'streetcar' } as Vehicle
        this.trams.set(b.id, v)
      }
      v.at = { x: b.x, z: b.z }
      v.y = b.y
      v.heading = b.heading
      v.speed = b.speed
      v.size = { len: b.len, wid: b.wid }
      /*
       * …and IN THE LANES, where it runs along a street: the street under it, facing its way, and how far along. The
       * cars behind then follow it as they follow each other (`lanes`, `drive`) — the one rule that keeps a queue
       * from driving into what is ahead of it. A tram on no street it lines up with keeps the swept look (`drive`).
       */
      let best: { e: Edge; s: number; dir: 1 | -1; d: number } | null = null
      for (const e of this.streets) {
        for (let i = 1; i < e.points.length; i++) {
          const a = e.points[i - 1], c = e.points[i]
          const dx = c.x - a.x, dz = c.z - a.z
          const l2 = dx * dx + dz * dz || 1e-9
          const t = Math.max(0, Math.min(1, ((b.x - a.x) * dx + (b.z - a.z) * dz) / l2))
          const d = Math.hypot(a.x + dx * t - b.x, a.z + dz * t - b.z)
          if (d > 4.5 || (best && d >= best.d)) continue
          const cos = (dx * Math.sin(b.heading) + dz * Math.cos(b.heading)) / Math.sqrt(l2)
          if (Math.abs(cos) < 0.85) continue
          let along = 0
          for (let k = 1; k < i; k++) along += Math.hypot(e.points[k].x - e.points[k - 1].x, e.points[k].z - e.points[k - 1].z)
          best = { e, s: along + t * Math.sqrt(l2), dir: cos > 0 ? 1 : -1, d }
        }
      }
      if (best) { v.edgeId = best.e.id; v.s = best.s; v.dir = best.dir; v.lane = laneOf(best.e) }
      else v.edgeId = -1
      /*
       * …and IN A JUNCTION when it is within one (a cable car's stops are at the corners): its box is taken, as if by a
       * car going straight across, so the rules of the junction keep cars out of it until it has gone (`mayEnter`).
       */
      v.inBox = undefined
      if (best) {
        const toA = best.s, toB = best.e.length - best.s
        const node = toA < toB ? best.e.a : best.e.b
        const r = this.signals?.control(node).radius ?? 6
        if (Math.min(toA, toB) < r + b.len / 2) v.inBox = { nodeId: node, from: best.e.id, turn: 'straight' }
      } else {
        /*
         * …and on a CURVE ACROSS A JUNCTION, lined up with no street (owner, 2026-10-07: "cars going right through a
         * streetcar near an intersection"): the F-line turning off Market. Matched to nothing, it was in no lane and no
         * box, and the cross traffic drove through it. It takes the nearest junction box it reaches into instead.
         */
        let near: { node: number; from: number; d: number } | null = null
        for (const e of this.streets) {
          for (const [node, p] of [[e.a, e.points[0]], [e.b, e.points[e.points.length - 1]]] as [number, Point][]) {
            const d = Math.hypot(p.x - b.x, p.z - b.z)
            const r = this.signals?.control(node).radius ?? 6
            if (d < r + b.len / 2 && (!near || d < near.d)) near = { node, from: e.id, d }
          }
        }
        if (near) v.inBox = { nodeId: near.node, from: near.from, turn: 'straight' }
      }
      if ((v.bumped || v.passed) && this.view && Math.hypot(v.at.x - this.view.at.x, v.at.z - this.view.at.z) > 40) { v.bumped = undefined; v.passed = undefined }
    }
    for (const id of [...this.trams.keys()]) if (!seen.has(id)) this.trams.delete(id)
  }
  private readonly trams = new Map<string, Vehicle>()
  /** the trams as the sim sees them (probes) */
  get tramViews(): Vehicle[] { return [...this.trams.values()] }
  /** the streets near the rider, from the last `update` (what a tram is matched to: `setTransit`) */
  private streets: Edge[] = []
  /** the traffic and the trams, for the loops about the rider */
  private *withTrams(): Iterable<Vehicle> { yield* this.vehicles; yield* this.trams.values() }

  update(dt: number, rider: RiderNow | Point, edgesNear: Iterable<Edge>): Collision[] {
    if (this.cfg.density === 0 || dt <= 0) return []
    this.t += dt
    this.lastDt = dt
    const who: RiderNow | null = 'edgeId' in rider ? rider : null
    const at = who ? who.at : (rider as Point)

    this.view = who ? { at, fx: Math.sin(who.heading), fz: Math.cos(who.heading) } : { at, fx: 0, fz: 0 }
    this.streets = [...edgesNear].filter((e) => drives(e))
    this.populate(at, this.streets)
    const lanes = this.lanes()
    this.laneCache = lanes
    const boxes = this.occupancy()

    // who is near whom, for the look-ahead at junctions (`drive`)
    this.near.clear()
    for (const v of this.vehicles) {
      const k = `${Math.floor(v.at.x / NEAR_CELL)},${Math.floor(v.at.z / NEAR_CELL)}`
      const l = this.near.get(k)
      if (l) l.push(v); else this.near.set(k, [v])
    }
    for (const v of this.vehicles) this.drive(v, dt, lanes, boxes, who)

    const hits: Collision[] = []
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i]
      this.move(v, dt)
      // retired only where the rider cannot see it go (owner, 2026-09-29: "cars never disappear while in view")
      if (distance(v.at, at) > this.cfg.range * 1.4 && this.hidden(v.at, 1.4)) { this.vehicles.splice(i, 1); continue }
      /*
       * The RELEASE VALVE: a car stuck for 45 s where the rider cannot see it leaves. A ring of queues round a block
       * never clears on its own (every car waits for the one ahead, all the way round); taking out one car the
       * rider cannot see breaks the ring, and it drains.
       */
      v.still = v.speed < 0.1 ? (v.still ?? 0) + dt : 0
      // a collision or a squeeze-past is forgiven once the two are well apart: a car that hit the rider must not
      // ignore them for the rest of the ride (it would never stop for them again, nor ever hit them)
      if ((v.bumped || v.passed) && who && Math.hypot(v.at.x - who.at.x, v.at.z - who.at.z) > 40) { v.bumped = undefined; v.passed = undefined }
      // (BUGS.md #244: 35 s, and anywhere out of view rather than at the edge of the range — a ring of queues runs
      // round the block behind the rider, and breaking it anywhere unseen lets the queue in front of them drain)
      if ((v.still ?? 0) > 35 && this.hidden(v.at, 0.5)) { this.vehicles.splice(i, 1); continue }
      // only a MOVING car hits the rider: riding into a standing one (or one squeezed past) is not a crash, and nor
      // is a car creeping at walking pace touching them (two such "crashes" in 100 s, measured, at 1–1.9 m/s)
      /*
       * …in a junction, or ALONG A STREET (owner, 2026-10-01: "intersection collision works, but … on non-intersection
       * paths, you can go right through them"): a moving car the rider swerves into, or meets in its own lane. Along a
       * street the rider is otherwise held behind the car ahead (`leaderFor`), so an overlap there is a real crash.
       */
      if (who && !v.bumped && !v.passed && v.speed > 2 && !this.otherLevel(who, v) && overlap(who.box, this.boxOf(v))) {
        // the rider stops (game.ts); the vehicle drives on, and from now on the two ignore each other
        v.bumped = true
        hits.push({ vehicle: v, nodeId: v.inBox?.nodeId ?? -1, at: { ...v.at } })
      }
    }
    // …and a MOVING streetcar or cable car (they do not stop dead for the rider any more than a car does)
    if (who) for (const v of this.trams.values()) {
      if (!v.bumped && !v.passed && v.speed > 1 && !this.otherLevel(who, v) && overlap(who.box, this.boxOf(v))) {
        v.bumped = true
        hits.push({ vehicle: v, nodeId: -1, at: { ...v.at } })
      }
    }
    return hits
  }

  /**
   * WEAVING (owner, 2026-09-29): *"we need to be able to weave through intersections when traffic is stopped. that's
   * the whole advantage of a bike in a gridlocked city."* Looking along the rider's path, which strips across it are
   * blocked by stopped or crawling vehicles, and which is the free strip nearest where the rider already is.
   *
   * `left`/`right` are how far the rider may move across (negative left, positive right, metres) — the street's own
   * room, from the navigator. The answer is a SHIFT from where they are: 0 to stay; null when every strip is
   * blocked (then they are held, `leaderFor`). Moving traffic is not woven round — a car driving away needs no
   * avoiding, and cross traffic is what a rider has to judge for themselves.
   */
  /**
   * How far the rider may move across before touching a vehicle BESIDE them — one whose length overlaps the bike's —
   * at any speed: metres, `left` ≤ 0 ≤ `right`, relative to where they are (Infinity: nothing there). A vehicle the
   * rider already overlaps sets no limit (that is a collision's business, not this).
   */
  /**
   * The NEVER-STUCK valve (`leaderFor`): held long enough by one vehicle, the rider squeezes past it — THROUGH it, as
   * drawn. After 5 s on a trainer (no reverse, slow input). On the keyboard cars are solid and the rider edges round
   * them (Navigator.sidestep), backs up (↓ below 0 W) or turns; only a car that will not move for `squeezeLate` seconds
   * with no way round is passed through, so the game never freezes behind one (owner, 2026-10-02). game.ts sets it.
   */
  squeeze = true
  /** seconds behind a standing vehicle before the squeeze (the trainer modes shorten it: game.ts) */
  squeezeAfter = 5
  /** pick another exit after 8 s refused for room (off by default: it made the crossroads tests overlap; on in the game) */
  rechooseOn = false
  /** …and where it is off, the same valve after this long behind a standing vehicle: a car stopped for good never freezes the game */
  squeezeLate = 15

  /**
   * A car the rider's box at `box` would be INSIDE without it being a crash (standing, crawling, or not on another
   * level) — and was not inside already: game.ts undoes the step that would take them there. Cars are solid.
   */
  solidAt(rider: RiderNow, box: Box): Vehicle | null {
    for (const v of this.withTrams()) {
      if (v.bumped || v.passed || v.speed > 2 || Math.hypot(v.at.x - box.x, v.at.z - box.z) > 20 || this.otherLevel(rider, v)) continue
      const b = this.boxOf(v)
      if (overlap(box, b) && !overlap(rider.box, b)) return v
    }
    return null
  }

  /**
   * THE LAST RESORT (owner, 2026-10-02: a truck face on, a car beside, nothing would move: "sometimes i get in
   * situations that seem to deadlock still"). Whatever holds the rider, once they have been stalled long enough
   * asking to move (game.ts), the standing vehicles round them stop being solid to them — and the rider creeps
   * through, very slowly (game.ts caps the speed while inside one). Returns how many it let go.
   */
  squeezeAround(rider: RiderNow, r = 10): number {
    let n = 0
    for (const v of this.withTrams()) {
      if (v.passed || v.speed > 2 || Math.hypot(v.at.x - rider.at.x, v.at.z - rider.at.z) > r || this.otherLevel(rider, v)) continue
      v.passed = true
      n++
    }
    return n
  }

  /** Is the rider's box inside a vehicle it was let through (`squeezeAround`, the valve)? Then they only creep. */
  creeping(box: Box): boolean {
    for (const v of this.withTrams()) if (v.passed && Math.hypot(v.at.x - box.x, v.at.z - box.z) < 20 && overlap(box, this.boxOf(v))) return true
    return false
  }

  alongside(rider: RiderNow): { left: number; right: number } {
    const fx = Math.sin(rider.heading)
    const fz = Math.cos(rider.heading)
    const rx = Math.cos(rider.heading)
    const rz = -Math.sin(rider.heading)
    const margin = SIZE.bike.wid / 2 + 0.15
    const reach = SIZE.bike.len / 2 + 0.3
    let left = -Infinity
    let right = Infinity
    for (const v of this.withTrams()) {
      if (v.passed || Math.hypot(v.at.x - rider.at.x, v.at.z - rider.at.z) > 16 || this.otherLevel(rider, v)) continue
      const b = this.boxOf(v)
      const bf = [Math.sin(b.heading), Math.cos(b.heading)]
      const br = [Math.cos(b.heading), -Math.sin(b.heading)]
      let f0 = Infinity, f1 = -Infinity, l0 = Infinity, l1 = -Infinity
      for (const [a, c] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const x = b.x + bf[0] * b.halfLen * a + br[0] * b.halfWid * c - rider.at.x
        const z = b.z + bf[1] * b.halfLen * a + br[1] * b.halfWid * c - rider.at.z
        const f = x * fx + z * fz
        const l = x * rx + z * rz
        f0 = Math.min(f0, f); f1 = Math.max(f1, f); l0 = Math.min(l0, l); l1 = Math.max(l1, l)
      }
      if (f1 < -reach || f0 > reach) continue
      if (l1 < 0) left = Math.max(left, l1 + margin)
      else if (l0 > 0) right = Math.min(right, l0 - margin)
    }
    return { left: Math.min(0, left), right: Math.max(0, right) }
  }

  weave(rider: RiderNow, left: number, right: number, prefer = 0, prev: number | null = null): number | null {
    const look = Math.max(10, rider.speed * 3)
    const fx = Math.sin(rider.heading)
    const fz = Math.cos(rider.heading)
    const rx = Math.cos(rider.heading)
    const rz = -Math.sin(rider.heading)
    // 0.2 m of air each side, not 0.5: on a 6–9 m street two opposing stopped lanes leave ~1.1 m down the centre
    // line, and filtering down it IS the bike in gridlock (owner, 2026-09-29: "zooming around gridlocked cars and
    // only occasionally have to wait for them"); must stay above `leaderFor`'s lane tolerance (0.15)
    const margin = SIZE.bike.wid / 2 + 0.2
    const blocked: [number, number][] = []
    for (const v of this.withTrams()) {
      if (Math.hypot(v.at.x - rider.at.x, v.at.z - rider.at.z) > look + 14 || this.otherLevel(rider, v)) continue
      // standing traffic, and traffic crawling the rider's way (a jam creeping at walking pace holds nobody on a
      // bike); cross traffic that is moving is the rider's own judgement
      if (v.speed > 2 && (v.speed > CRAWL || Math.cos(v.heading - rider.heading) < 0.5)) continue
      // the vehicle's corners in the rider's frame: along (f) and across (l)
      const b = this.boxOf(v)
      const bf = [Math.sin(b.heading), Math.cos(b.heading)]
      const br = [Math.cos(b.heading), -Math.sin(b.heading)]
      let f0 = Infinity, f1 = -Infinity, l0 = Infinity, l1 = -Infinity
      for (const [a, c] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const x = b.x + bf[0] * b.halfLen * a + br[0] * b.halfWid * c - rider.at.x
        const z = b.z + bf[1] * b.halfLen * a + br[1] * b.halfWid * c - rider.at.z
        const f = x * fx + z * fz
        const l = x * rx + z * rz
        f0 = Math.min(f0, f); f1 = Math.max(f1, f); l0 = Math.min(l0, l); l1 = Math.max(l1, l)
      }
      if (f1 < -SIZE.bike.len / 2 || f0 > look) continue
      blocked.push([l0 - margin, l1 + margin])
    }
    const free = (l: number): boolean => blocked.every(([a, b]) => l < a || l > b)
    /*
     * PATHFINDING ACROSS ONE STREET (owner, 2026-09-29: "the bike should stay to the right of the road… this often
     * isn't possible with cars on narrower roads, so we need to do some pathfinding on individual edges too"): of
     * the free strips — where the rider is, where they would like to be (`prefer`, the right-hand side), and the
     * edges of every blocked interval — the one nearest where they would like to be, with a little weight on not
     * moving at all so they do not dither between two.
     */
    const want = Math.max(left, Math.min(right, prefer))
    if (free(want) && free(0) && Math.abs(want) < 0.05) return 0
    let best: number | null = null
    let cost = Infinity
    /*
     * …and with a HOLD on last frame's choice (`prev`, where it is now relative to the rider; owner, 2026-10-01:
     * squeezed between the kerb and a line of cars the rider "flips back and forth on each frame between leaning
     * slightly left and leaning slightly right"): two strips costing about the same no longer trade places every
     * frame — the one already chosen wins unless another is better by more than half a metre.
     */
    for (const l of [0, want, ...(prev !== null ? [prev] : []), ...blocked.flatMap(([a, b]) => [a - 0.01, b + 0.01])]) {
      if (l < left - 1e-9 || l > right + 1e-9 || !free(l)) continue
      const c = Math.abs(l - want) + 0.3 * Math.abs(l) - (prev !== null && Math.abs(l - prev) < 0.15 ? 0.5 : 0)
      if (c < cost) { cost = c; best = l }
    }
    return best
  }

  /**
   * The vehicle ahead of the rider in the rider's lane, for the ride model's cap — or null. `shift` is where the rider
   * is weaving to (`weave`): the hold is judged along the strip they are heading for, so a gap means they keep rolling.
   * `probe`: a second look in the same frame (game.ts's swing cap) that must not run the never-stuck valve's clock.
   */
  leaderFor(rider: RiderNow, shift = 0, probe = false): { gap: number; speed: number } | null {
    if (shift !== 0) {
      const rx = Math.cos(rider.heading)
      const rz = -Math.sin(rider.heading)
      rider = { ...rider, at: { x: rider.at.x + rx * shift, z: rider.at.z + rz * shift }, box: { ...rider.box, x: rider.box.x + rx * shift, z: rider.box.z + rz * shift } }
    }
    /*
     * On a DESCENT the car ahead makes way (`drive`: it speeds up) and the rider is not held behind it — but a car
     * STANDING in the way, or coming the other way, still is (owner, 2026-10-02: "i still can go right through cars if
     * i approach from the front"): an oncoming car stops for a rider in its lane, and a standing car is no crash, so
     * on every hill the rider rode straight through its bonnet.
     */
    const descent = rider.grade < DESCENT
    const e = this.g.edges.get(rider.edgeId)
    if (!e) return null
    const lat = this.lateral(e, rider.s, rider.at)
    let best: { gap: number; speed: number } | null = null
    // which vehicle it is, for the never-stuck valve below
    let bestV: Vehicle | null = null
    if (!descent) for (const v of this.vehicles) {
      if (v.edgeId !== e.id || v.dir !== rider.dir || v.bumped || v.passed || v.why === 'rider in lane') continue
      const gap = (v.s - rider.s) * rider.dir
      if (gap <= 0) continue
      if (Math.abs(v.lane * v.dir - lat) > this.halfWid(v) + SIZE.bike.wid / 2 + 0.15) continue
      // nose of the rider to the tail of the car
      const clear = gap - this.halfLen(v) - SIZE.bike.len / 2
      if (!best || clear < best.gap) { best = { gap: clear, speed: v.speed }; bestV = v }
    }
    /*
     * …and anything STANDING in the rider's way, in any lane or junction: a queue stopped across a crossing, a car
     * waiting to turn. The rider sees a stopped car and stops for it — every collision in a 90 s ride through the
     * Haight was the rider riding into the side of one. Swept straight ahead up to 25 m with the rider's own box;
     * only moving cross traffic can hit them now.
     */
    const fx = Math.sin(rider.heading)
    const fz = Math.cos(rider.heading)
    for (const v of this.withTrams()) {
      // …never by a vehicle that is itself waiting for the rider: a car and a rider face to face on a narrow street
      // each waited for the other for ever (owner, 2026-09-29)
      // (a car standing face to face, waiting for the rider, used to be left out here so the two did not wait for each
      // other for ever — and the rider rode straight through its bonnet, owner 2026-10-01. It holds the rider now; the
      // weave takes them round it where there is room, and the never-stuck valve below lets them past where there is not)
      if (v.bumped || v.passed || Math.hypot(v.at.x - rider.at.x, v.at.z - rider.at.z) > 32 || this.otherLevel(rider, v)) continue
      // standing, or going the rider's way (a car ahead turning off still has to be cleared — the rider ran into
      // the back of one): CROSS traffic is left out on purpose, so running a red can still cost you
      if (v.speed > 1.5 && Math.cos(v.heading - rider.heading) < 0.5) continue
      // (downhill, only what stands or comes the other way)
      if (descent && v.speed > 1.5) continue
      const box = this.boxOf(v)
      // nor one BEHIND the rider, or one the rider is already inside: it cannot be in their way, and holding them for it
      // left the rider standing inside a car that had rolled up against them, for the rest of the ride (measured)
      if ((v.at.x - rider.at.x) * fx + (v.at.z - rider.at.z) * fz < 0 || overlap(rider.box, box)) continue
      for (let d = 0.5; d <= 25; d += 0.75) {
        if (best && d > best.gap) break
        if (overlap({ ...rider.box, x: rider.at.x + fx * d, z: rider.at.z + fz * d }, box)) {
          const gap = Math.max(0, d - 0.75)
          if (!best || gap < best.gap) { best = { gap, speed: v.speed }; bestV = v }
          break
        }
      }
    }
    /*
     * NEVER STUCK FOR GOOD: held by the same vehicle for a while, the rider squeezes past it, as a cyclist would, and
     * it stops counting as an obstacle to them. Waiting for ever is a bug, and there were several (a car that believed
     * it was still in a junction, a ring of queues). 5 s behind a car that is STANDING (gridlock is for zooming
     * round, owner 2026-09-29 — 20 s at every junction was "very slow") or crawling under 2 m/s (a car creeping at
     * 0.4 m/s held a rider 12 s, measured), 20 s behind one that is moving.
     */
    if (probe) return best
    const holder = best ? bestV : null
    if (holder && holder === this.heldBy) {
      this.heldFor += this.lastDt
      if (this.heldFor > (holder.speed < 2 ? (this.squeeze ? this.squeezeAfter : this.squeezeLate) : 20)) { holder.passed = true; this.heldBy = null; this.heldFor = 0; return null }
    } else { this.heldBy = holder; this.heldFor = 0 }
    return best
  }

  /**
   * Out of the rider's sight: far enough away (`far` × the range), or behind them and not right beside them. The
   * owner, 2026-09-29: cars must never appear or disappear while in view. With no heading (a bare point) only
   * distance counts.
   */
  private hidden(p: Point, far = 0.95): boolean {
    const dx = p.x - this.view.at.x
    const dz = p.z - this.view.at.z
    const d = Math.hypot(dx, dz)
    if (d > this.cfg.range * far) return true
    if (this.view.fx === 0 && this.view.fz === 0) return false
    return dx * this.view.fx + dz * this.view.fz < -20 && d > 35
  }

  /** Let a street be repopulated once the rider has gone away and come back. */
  forget(edgeId: number): void { this.target.delete(edgeId) }

  // ---- the parts

  private sizeOf(v: Vehicle): { len: number; wid: number } { return v.size ?? (v.kind === 'bus' ? SIZE.bus : SIZE.car) }
  private halfLen(v: Vehicle): number { return this.sizeOf(v).len / 2 }
  private halfWid(v: Vehicle): number { return this.sizeOf(v).wid / 2 }
  /**
   * One intersection that OSM split into several nodes a few metres apart (a divided street, a skewed crossing): the
   * nodes joined by streets shorter than 12 m are one junction, for the look-ahead. Its smallest node id names it.
   * The Haight's worst overlaps were all in one such cluster of 7–9 m edges, a car in it in two "junctions" at once.
   */
  private cluster(node: number): number {
    // streets stream in with tiles: a cluster worked out before its neighbours arrived may have grown
    if (this.g.edges.size !== this.clusteredAt) { this.clusters.clear(); this.clusteredAt = this.g.edges.size }
    const hit = this.clusters.get(node)
    if (hit !== undefined) return hit
    const seen = new Set<number>([node])
    const todo = [node]
    while (todo.length) {
      const n = todo.pop()!
      for (const id of this.g.nodes.get(n)?.edges ?? []) {
        const e = this.g.edges.get(id)
        if (!e || e.length >= 12) continue
        for (const m of [e.a, e.b]) if (!seen.has(m) && seen.size < 12) { seen.add(m); todo.push(m) }
      }
    }
    const name = Math.min(...seen)
    for (const n of seen) this.clusters.set(n, name)
    return name
  }
  private readonly clusters = new Map<number, number>()
  private clusteredAt = -1

  /** the height of the road under a vehicle: its street's own profile (every baked street has one), else unknown */
  private levelOf(v: Vehicle): number | null {
    if (v.y !== undefined) return v.y
    const e = this.g.edges.get(v.edgeId)
    return e?.heights?.length ? profileAt(e.points, e.heights, v.s).y : null
  }

  /** the rider and this vehicle are on different levels (a street over a tunnel, a road under a bridge) */
  private otherLevel(rider: RiderNow, v: Vehicle): boolean {
    if (rider.y === undefined) return false
    const y = this.levelOf(v)
    return y !== null && Math.abs(y - rider.y) > LEVELS
  }

  /** how far `v` can move straight ahead (its own `box`) before touching `other`, up to `reach`; −1 if never */
  private sweep(v: Vehicle, box: Box, reach: number, other: Box): number {
    const fx = Math.sin(v.heading)
    const fz = Math.cos(v.heading)
    for (let d = 0.25; d <= reach; d += 0.75) if (overlap({ ...box, x: box.x + fx * d, z: box.z + fz * d }, other)) return d
    return -1
  }

  boxOf(v: Vehicle): Box { return boxOf(v.at.x, v.at.z, v.heading, this.sizeOf(v)) }

  /** a point's signed distance to the right of an edge's a→b centre line, at `s` */
  private lateral(e: Edge, s: number, p: Point): number {
    const c = pointAlong(e.points, clamp(s, 0, e.length))
    const q = pointAlong(e.points, clamp(s + 1, 0, e.length))
    const back = s + 1 > e.length
    const h = back ? Math.atan2(c.x - q.x, c.z - q.z) + Math.PI : Math.atan2(q.x - c.x, q.z - c.z)
    const nx = Math.cos(h)
    const nz = -Math.sin(h)
    return (p.x - c.x) * nx + (p.z - c.z) * nz
  }

  private populate(at: Point, edgesNear: Iterable<Edge>): void {
    const count = new Map<number, number>()
    for (const v of this.vehicles) count.set(v.edgeId, (count.get(v.edgeId) ?? 0) + 1)
    let refill = this.t >= this.refillAt
    if (refill) this.refillAt = this.t + 1
    /*
     * The TOTAL is bounded, not only each street: cars that drive just out of range are neither counted nor yet
     * retired, and topping every street back up while they piled up in that band grew the city's traffic without
     * limit until it locked solid (tools/traffic-soak.ts: 243 cars at 5 min, 290 and gridlocked at 10).
     */
    let wanted = 0
    let present = 0
    const near: Edge[] = []
    for (const e of edgesNear) {
      if (!drives(e) || e.length < 12) continue
      const mid = pointAlong(e.points, e.length / 2)
      if (distance(mid, at) > this.cfg.range) continue
      near.push(e)
      wanted += this.target.get(e.id) ?? 0
      present += count.get(e.id) ?? 0
    }
    // every vehicle counts, the ones in the band just outside the range too — they are what piled up
    void present
    if (refill && this.vehicles.length >= wanted) refill = false
    for (const e of near) {
      if (!drives(e) || e.length < 12 || this.blindAlley(e, 1) || this.blindAlley(e, -1)) continue
      if (this.closed(e)) continue
      const mid = pointAlong(e.points, e.length / 2)
      if (distance(mid, at) > this.cfg.range) continue
      const known = this.target.get(e.id)
      const first = known === undefined
      let want: number
      if (known === undefined) {
        // (a car-free street carries buses and taxis only, and far fewer of them: 40%)
        const w = (e.length / 1000) * this.cfg.density * this.zoneFactor(mid) * (this.carFree(e) ? 0.4 : 1) * this.edgeFactor(e)
        const r0 = rng(e.id)
        want = Math.floor(w) + (r0() < w - Math.floor(w) ? 1 : 0)
        this.target.set(e.id, want)
      } else want = known
      const have = count.get(e.id) ?? 0
      if (have >= want || (!first && !refill)) continue
      // the first time a street is seen it fills anywhere out of the rider's immediate way; after that it is
      // topped up only well away from the rider, so cars do not appear under their nose
      const r = rng(e.id ^ Math.imul(Math.floor(this.t), 0x9e3779b1))
      for (let k = have, tries = 0; k < want && tries < want * 3; tries++) {
        const dir: 1 | -1 = e.oneway ? 1 : r() < 0.5 ? 1 : -1
        if (!allowed(e, dir)) continue
        const s = 3 + r() * Math.max(0, e.length - 6)
        const p = pointAlong(e.points, s)
        // at the very start the whole ring fills (nothing has been seen yet); after that a car only ever appears
        // where the rider cannot see it appear
        if (this.t > 1.5 ? !this.hidden(p) : distance(p, at) < 25) continue
        // on a car-free street only buses and taxis
        const free = this.carFree(e)
        const bus = free ? r() < 0.35 : r() < 0.08 && e.width >= 8
        // (from the id, not the street's random stream: drawing one more number reshuffled every other choice)
        const taxi = !bus && (free || ((this.nextId * 2654435761) >>> 0) % 100 < 8)
        const half = (bus ? SIZE.bus : SIZE.car).len / 2
        // room for SPEED, not just length: a slow car spawned 8 m ahead of a faster one was inside its stopping
        // distance (seen at 90 cars/km in the crossroads test)
        if (this.vehicles.some((o) => o.edgeId === e.id && o.dir === dir && Math.abs(o.s - s) < half + this.halfLen(o) + BUMPER + 12)) continue
        const q = pointAlong(e.points, clamp(s + dir * 1.5, 0, e.length))
        // `q` is already taken in the direction of travel, so the heading is towards it whichever way that is
        const heading = Math.atan2(q.x - p.x, q.z - p.z)
        this.vehicles.push({
          id: this.nextId++, kind: bus ? 'bus' : 'car', edgeId: e.id, s, dir,
          // 18–27 km/h: the delivery game's joke is that the bike is faster than the traffic (owner, 2026-09-29)
          cruise: (bus ? 4.5 : 5) + r() * 2.5, speed: 2 + r() * 2, lane: laneOf(e),
          // (the colour drawn whatever it is, so a taxi does not reshuffle the street's random stream)
          colour: ((c: [number, number, number]) => bus ? [0.85, 0.35, 0.18] as [number, number, number] : taxi ? [0.95, 0.78, 0.12] as [number, number, number] : c)(bus ? [0, 0, 0] : CAR_COLOURS[Math.floor(r() * CAR_COLOURS.length)]),
          ...(taxi ? { taxi: true as const } : {}),
          waiting: false, at: p, heading,
          // drivers differ: some pull away briskly and sit close, some leave a gap and brake early
          driver: bus ? { a: 0.9, b: 1.8, T: 1.7, s0: 2.5 }
            : { a: 1.2 + r() * 0.9, b: 1.8 + r() * 0.9, T: 1.0 + r() * 0.7, s0: 1.8 + r() * 0.9 },
        })
        k++
      }
    }
  }

  /**
   * A service alley whose far end (going `dir`) leads nowhere a car may drive: Quincy Street off Pine, 51 m and two-way,
   * filled both ways and locked for good in the soak (2026-10-03) — the cars at its end could not turn round with the
   * other lane full, and the other lane could not leave. Traffic neither spawns in one nor turns into one.
   */
  private blindAlley(n: Edge, dir: 1 | -1): boolean {
    if (n.kind !== 'service') return false
    const far = this.g.nodes.get(dir > 0 ? n.b : n.a)
    if (!far) return false
    return !far.edges.some((id) => {
      if (id === n.id) return false
      const o = this.g.edges.get(id)
      return !!o && (allowed(o, 1) || allowed(o, -1))
    })
  }

  /** each lane's vehicles, nearest the far end first */
  private lanes(): Map<string, Vehicle[]> {
    const m = new Map<string, Vehicle[]>()
    // (the trams that run along a street too: `setTransit`)
    for (const v of [...this.vehicles, ...[...this.trams.values()].filter((t) => t.edgeId >= 0)]) {
      const k = `${v.edgeId}:${v.dir}`
      const l = m.get(k)
      if (l) l.push(v)
      else m.set(k, [v])
    }
    for (const l of m.values()) l.sort((p, q) => q.s * q.dir - p.s * p.dir)
    return m
  }

  /** who is in each junction box */
  private occupancy(): Map<number, Vehicle[]> {
    const m = new Map<number, Vehicle[]>()
    // (and the trams in a junction: `setTransit`)
    for (const v of [...this.vehicles, ...this.trams.values()]) {
      if (!v.inBox) continue
      const l = m.get(v.inBox.nodeId)
      if (l) l.push(v)
      else m.set(v.inBox.nodeId, [v])
    }
    return m
  }

  private endNode(v: Vehicle, e: Edge): number { return v.dir > 0 ? e.b : e.a }
  private toGo(v: Vehicle, e: Edge): number { return v.dir > 0 ? e.length - v.s : v.s }

  private choose(v: Vehicle, e: Edge, node: number): void {
    const xs = exits(this.g, node, e.id).map((x) => {
      const n = this.g.edges.get(x.edgeId)!
      return { x, dir: (n.a === node ? 1 : -1) as 1 | -1, n }
    }).filter(({ n, dir }) => allowed(n, dir))
    if (xs.length === 0) return
    // a bus keeps to its route and goes straight wherever it can: a 12 m bus turning swings its body across the
    // next lane, which on these streets meant through the cars in it
    const straight = xs.some(({ x }) => x.turn === 'straight')
    const open = xs.some(({ n, dir }) => !this.blindAlley(n, dir))
    // (a private car never onto a car-free street, unless there is no other way out at all)
    const legal = xs.some(({ n }) => this.mayUse(v, n))
    const w: number[] = xs.map(({ x, n, dir }) => (open && this.blindAlley(n, dir) ? 0
      : legal && !this.mayUse(v, n) ? 0
      : x.turn === 'straight' ? 6 : v.kind === 'bus' && straight ? 0 : 2))
    let u = this.r() * w.reduce((p, q) => p + q, 0)
    let k = 0
    for (; k < xs.length - 1; k++) { u -= w[k]; if (u <= 0) break }
    v.next = { edgeId: xs[k].x.edgeId, dir: xs[k].dir, turn: xs[k].x.turn }
  }

  /** Pick again, among the exits other than the one refused, those with room for this car beyond the junction. */
  private rechoose(v: Vehicle, e: Edge, node: number): void {
    const was = v.next
    if (!was) return
    const r = this.signals?.control(node).radius ?? 6
    const need = r + 2 * this.halfLen(v) + v.driver.s0 + 2
    const xs = exits(this.g, node, e.id).map((x) => {
      const n = this.g.edges.get(x.edgeId)!
      return { x, dir: (n.a === node ? 1 : -1) as 1 | -1, n }
    }).filter(({ x, n, dir }) => x.edgeId !== was.edgeId && allowed(n, dir) && !this.blindAlley(n, dir) && this.mayUse(v, n))
      .filter(({ n, dir }) => {
        const q = this.laneCache.get(`${n.id}:${dir}`) ?? []
        const last = q[q.length - 1]
        const room = last ? (last.dir > 0 ? last.s : n.length - last.s) - this.halfLen(last) : this.roomThrough(n, dir, 0)
        return room >= need
      })
    if (xs.length === 0) return
    const k = Math.floor(this.r() * xs.length)
    v.next = { edgeId: xs[k].x.edgeId, dir: xs[k].dir, turn: xs[k].x.turn }
    v.refused = undefined
  }

  /** two movements through one junction that cannot share it at once */
  private conflicts(a: { from: number; turn: Turn }, b: { from: number; turn: Turn }, node: number): boolean {
    if (a.from === b.from) return false
    const c = this.signals?.control(node)
    const ba = c?.arms.find((x) => x.edgeId === a.from)?.bearing
    const bb = c?.arms.find((x) => x.edgeId === b.from)?.bearing
    // from opposite arms, going straight or right, they pass each other. A left turn crosses the oncoming lane —
    // and opposing lefts cross each other too, because the turn curves here run through the junction's middle
    // (tried 2026-09-29 letting them go together: 104 frames of overlap in the crossroads test). The amber
    // clear-out below is what keeps a left-turner from waiting forever.
    const opposite = ba !== undefined && bb !== undefined && Math.abs(Math.cos(ba - bb)) > Math.SQRT1_2 && Math.cos(ba - bb) < 0
    return !(opposite && a.turn !== 'left' && b.turn !== 'left')
  }

  /** Does a long vehicle (over 7 m) out of any box still reach back into the junction at `node`? */
  private tailIn(o: Vehicle, node: number): boolean {
    const len = 2 * this.halfLen(o)
    if (len < 7) return false
    const nd = this.g.nodes.get(node)
    if (!nd) return false
    const r = this.signals?.control(node).radius ?? 6
    // its back end: half its length behind its centre
    const bx = o.at.x - Math.sin(o.heading) * len / 2
    const bz = o.at.z - Math.cos(o.heading) * len / 2
    return Math.hypot(bx - nd.at.x, bz - nd.at.z) < r
  }

  /** Room on an empty `e` (travelled `dir`), and on beyond it while it is short: see `mayEnter`. */
  private roomThrough(e: Edge, dir: 1 | -1, depth: number): number {
    if (e.length >= 40 || depth >= 2) return Infinity
    const node = dir > 0 ? e.b : e.a
    const r = this.signals?.control(node).radius ?? 6
    // straight on, else the gentlest turn; nowhere to go is no room
    const xs = exits(this.g, node, e.id)
    const on = xs.find((x) => x.turn === 'straight') ?? xs.slice().sort((p, q) => Math.abs(p.angle) - Math.abs(q.angle))[0]
    const n = on ? this.g.edges.get(on.edgeId) : undefined
    if (!n) return e.length
    const nd: 1 | -1 = n.a === node ? 1 : -1
    // anything standing in that junction's box fills it
    // (but not one waiting there to come ONTO this street the other way: it wants the other lane of `e`, and two such
    //  cars facing each other across a short street each refused the other for good — the soak's head-on cycles,
    //  BUGS.md #244, 2026-10-04)
    if (this.vehicles.some((o) => o.inBox?.nodeId === node && o.speed < 0.5 && o.next?.edgeId !== e.id && !(o.edgeId === e.id && o.dir !== dir))) return e.length
    const queue = this.laneCache.get(`${n.id}:${nd}`) ?? []
    const last = queue[queue.length - 1]
    const beyond = last ? (last.dir > 0 ? last.s : n.length - last.s) - this.halfLen(last) : this.roomThrough(n, nd, depth + 1)
    return e.length + 2 * r + beyond
  }

  private impatient(v: Vehicle): boolean { return v.stoppedAt !== undefined && this.t - v.stoppedAt > PATIENCE }

  /** an impatient left-turner waiting at the line of the arm opposite this vehicle's */
  private leftWaiting(v: Vehicle, e: Edge, node: number): boolean {
    const c = this.signals?.control(node)
    const mine = c?.arms.find((x) => x.edgeId === e.id)?.bearing
    if (mine === undefined) return false
    for (const o of this.vehicles) {
      if (o === v || o.inBox || o.next?.turn !== 'left' || !this.impatient(o)) continue
      const oe = this.g.edges.get(o.edgeId)!
      if (oe.id === e.id || this.endNode(o, oe) !== node) continue
      const theirs = c!.arms.find((x) => x.edgeId === oe.id)?.bearing
      if (theirs !== undefined && Math.cos(theirs - mine) < -Math.SQRT1_2) return true
    }
    return false
  }

  /** May this vehicle enter the junction at the end of its edge now? */
  private mayEnter(v: Vehicle, e: Edge, node: number, stopDist: number, boxes: Map<number, Vehicle[]>, rider: RiderNow | null): boolean {
    const me = { from: e.id, turn: v.next?.turn ?? 'straight' as Turn }
    /*
     * DON'T BLOCK THE BOX: go in only if there is room to come out. A queue used to stop across a junction — most
     * of all across the crossings where a path meets a street mid-block — and the rider rode into the side of a
     * car standing in it (every collision in a 90 s ride through the Haight was one of those).
     */
    if (v.next) {
      const out = this.g.edges.get(v.next.edgeId)
      const r = this.signals?.control(node).radius ?? 6
      const want = `${v.next.edgeId}:${v.next.dir}`
      const queue = this.laneCache.get(want) ?? []
      const last = queue[queue.length - 1]
      // cars already committed to the same street out of this junction take room too — two cars from two arms
      // both checked the same gap, both went in, and the second stopped with its tail in the junction
      // …from ANY box, not only this node's (2026-10-02, BUGS.md #244): a San Francisco junction is often a cluster of
      // nodes, and cars entering through two of its nodes claimed the same gap, stopped in the box, and the city locked
      let taken = 0
      for (const o of this.vehicles) {
        if (o === v || !o.inBox || o.edgeId === v.next.edgeId || !o.next || `${o.next.edgeId}:${o.next.dir}` !== want) continue
        taken += 2 * this.halfLen(o) + o.driver.s0
      }
      if (out) {
        /*
         * …and an EMPTY exit is only as roomy as it is long (2026-10-02, BUGS.md #244). An empty street counted as
         * endless room, so a car went in onto a 6 m connector inside a clustered junction with the junction beyond it
         * jammed, and stopped there — in the box, across the cross traffic — and the city locked round it (every deep
         * overlap in the soak was a car on a 5–12 m edge). A short empty exit adds the room on the street it runs
         * straight on into, up to two streets on.
         */
        const room = last ? (last.dir > 0 ? last.s : out.length - last.s) - this.halfLen(last) : this.roomThrough(out, v.next.dir, 0)
        // room for the whole car to be clear of the junction beyond its box, plus a margin
        /*
         * …except after a long wait (owner, 2026-10-06, Market at 5th: "buses are constantly stuck at this
         * intersection"). Market's parallel ways and their short connectors make RINGS of queues there, each waiting for
         * room beyond the next; the valve that retires a car stuck 35 s only works out of view, and the rider sat
         * watching a locked junction. Standing 20 s, a car stops asking for room and goes on its green, rolling up to
         * whatever is ahead (the look-ahead's contact-only valve keeps it from driving through anything).
         */
        if (room - taken < r + 2 * this.halfLen(v) + v.driver.s0 + 2 && (v.still ?? 0) < 20) { v.refused = 'no room beyond'; return false }
      }
    }
    // never into a junction the rider is in (collisions stay rare: only a car ALREADY committed can be hit)
    if (rider) {
      const nd = this.g.nodes.get(node)
      const cr = this.signals?.control(node).radius ?? 6
      // (not a rider on another level: in a tunnel under the junction, or on a bridge over it)
      const sameLevel = !this.otherLevel(rider, v)
      if (sameLevel && nd && distance(rider.at, nd.at) < cr + 1.5) { v.refused = 'rider in junction'; return false }
      /*
       * …nor one the rider is ABOUT to reach, from another arm, before this car would be out of it. The rider could
       * not brake when this was written, and a car pulling out in front of them was a collision they could not
       * avoid. Only a car already committed, too close to stop, can still be hit: rare, as the owner asked.
       */
      const re = this.g.edges.get(rider.edgeId)
      if (sameLevel && nd && re && rider.edgeId !== e.id && (rider.dir > 0 ? re.b : re.a) === node) {
        const clearIn = (stopDist + 2 * cr + 2 * this.halfLen(v)) / Math.max(v.speed, 2.5) + 1
        if (distance(rider.at, nd.at) / Math.max(rider.speed, 1) < clearIn) { v.refused = 'rider arriving'; return false }
      }
    }
    const clear = !(boxes.get(node) ?? []).some((o) => o !== v && o.inBox && this.conflicts(me, o.inBox, node))
    const c = this.signals?.control(node)
    /*
     * A LEFT TURN YIELDS to oncoming traffic going straight or right that is coming up to the junction. Without it
     * the left-turners — committing whenever the box was momentarily empty — starved the oncoming straight traffic
     * of its whole green (a car sat through one in the crossroads test). The left-turner clears out on the amber
     * and the all-red instead, which is what those windows allow below.
     */
    const oncoming = (): boolean => {
      const mine = c?.arms.find((x) => x.edgeId === e.id)?.bearing
      if (mine === undefined) return false
      for (const o of this.vehicles) {
        if (o === v || o.inBox || (o.next?.turn ?? 'straight') === 'left') continue
        const oe = this.g.edges.get(o.edgeId)!
        if (oe.id === e.id || this.endNode(o, oe) !== node || this.toGo(o, oe) > 30) continue
        const theirs = c!.arms.find((x) => x.edgeId === oe.id)?.bearing
        if (theirs !== undefined && Math.cos(theirs - mine) < -Math.SQRT1_2) return true
      }
      return false
    }
    if (!c || c.kind === 'none') return clear
    if (c.kind === 'lights') {
      const a = this.signals!.aspect(node, e.id, this.t)
      if (a === 'green') {
        if (!clear) { v.refused = 'junction busy'; return false }
        if (me.turn === 'left') return !oncoming() || this.impatient(v)
        // …and oncoming traffic that can still stop lets an impatient left-turner go
        if (stopDist > (v.speed * v.speed) / (2 * 3.5) && this.leftWaiting(v, e, node)) return false
        return true
      }
      // amber: go on only if it is too late to stop comfortably — or if you are the left-turner who has been waiting
      // at the line for the oncoming traffic, which is stopping now: the clear-out that keeps a left turn from
      // waiting a whole cycle
      if (a === 'amber') return clear && (stopDist < (v.speed * v.speed) / (2 * 3.5) || (me.turn === 'left' && stopDist < 1.5 && v.speed < 0.5))
      // red: only the waiting left-turner, in the all-red right after this arm's amber
      if (me.turn === 'left' && stopDist < 1.5 && v.speed < 0.5 && this.signals!.clearing(node, e.id, this.t)) return clear
      v.refused = `light ${a}`
      return false
    }
    if (c.kind === 'stop2' && c.major.has(e.id)) return clear
    // a stop: stand at the line first; then go when nothing in the junction crosses your path
    if (v.stoppedAt === undefined) return false
    if (!clear) return false
    if (c.kind === 'stop2') {
      // a side street waits for a gap on the main road: nobody on a major arm within 30 m of the junction
      for (const o of this.vehicles) {
        if (o === v || !c.major.has(o.edgeId)) continue
        const oe = this.g.edges.get(o.edgeId)!
        if (this.endNode(o, oe) === node && this.toGo(o, oe) < 30) return false
      }
      return true
    }
    // all-way stop: first come, first served among those standing at the line whose paths cross yours — two
    // cars facing each other, both going straight, go together, as drivers do
    for (const o of this.vehicles) {
      if (o === v || o.stoppedAt === undefined || o.stoppedAt >= v.stoppedAt || o.inBox) continue
      const oe = this.g.edges.get(o.edgeId)!
      if (this.endNode(o, oe) !== node) continue
      if (this.conflicts(me, { from: o.edgeId, turn: o.next?.turn ?? 'straight' }, node)) return false
    }
    return true
  }

  private drive(v: Vehicle, dt: number, lanes: Map<string, Vehicle[]>, boxes: Map<number, Vehicle[]>, rider: RiderNow | null): void {
    const e = this.g.edges.get(v.edgeId)!
    const toGo = this.toGo(v, e)
    const node = this.endNode(v, e)
    const d = v.driver
    /*
     * THE INTELLIGENT DRIVER MODEL (Treiber, Hennecke & Helbing 2000) — the standard car-following model, and what
     * makes a queue look like a queue: smooth starts, gaps that grow with speed, braking that begins early and
     * gently for a light, stop-and-go waves (owner, 2026-09-29: "make the best car sim possible… believable").
     *
     *   a_free = a · (1 − (v / v0)⁴)
     *   a_obst = −a · (s* / s)²,   s* = s0 + v·T + v·Δv / (2·√(a·b))
     *
     * Everything that can stop a car is an OBSTACLE with a clear gap `s` and a speed: the car ahead, a car still
     * clearing the junction from this arm, the rider, a red light or a stop line (a standing obstacle at the line),
     * a dead end. The driver takes the most cautious answer.
     */
    let v0 = v.cruise
    const obstacles: [number, number][] = []
    const whys: string[] = []

    // the car ahead in this lane (clear road nose to tail; a turning car cuts its corner, so more room)
    const lane = lanes.get(`${v.edgeId}:${v.dir}`) ?? []
    const i = lane.indexOf(v)
    if (i > 0) { obstacles.push([(lane[i - 1].s - v.s) * v.dir - this.halfLen(v) - this.halfLen(lane[i - 1]) - turning(lane[i - 1]), lane[i - 1].speed]); whys.push(`car ${lane[i - 1].id}`) }
    // …near the end of the street, the last car on the street it is turning into
    else if (v.next && toGo < CHOOSE) {
      const nl = lanes.get(`${v.next.edgeId}:${v.next.dir}`) ?? []
      const last = nl[nl.length - 1]
      if (last) {
        const n = this.g.edges.get(v.next.edgeId)!
        obstacles.push([toGo + (last.dir > 0 ? last.s : n.length - last.s) - this.halfLen(v) - this.halfLen(last), last.speed]); whys.push(`next-street car ${last.id}`)
      }
    }
    // …whatever went into the junction ahead of it from THIS arm and has not cleared it (a bus's tail swinging)
    if (toGo < CHOOSE) {
      for (const o of boxes.get(node) ?? []) {
        if (o === v || !o.inBox || o.inBox.from !== e.id || o.edgeId === e.id) continue
        // (the box's occupants include the streetcars and cable cars, `occupancy`; one on no street has edgeId −1 and
        // no edge here — reading its length froze the game, every frame, a few seconds after boarding a cable car on a
        // phone, owner 2026-10-14. It is still an obstacle: the swept test below takes trams on no street)
        const oe = this.g.edges.get(o.edgeId)
        if (!oe) continue
        obstacles.push([toGo + (o.dir > 0 ? o.s : oe.length - o.s) - this.halfLen(v) - this.halfLen(o) - turning(o), o.speed]); whys.push(`box car ${o.id}`)
      }
    }
    // a streetcar or cable car in the way — swept straight ahead from here, as the look-ahead in junctions does: followed
    // at its speed going this way, waited for otherwise
    // (not while its never-stuck valve is open, `lookOff` below: a car and a tram each waiting for the other in a
    // junction otherwise stood there for good)
    if (this.trams.size && this.t >= (v.lookOff ?? 0)) {
      const box = this.boxOf(v)
      const reach = Math.min(30, 6 + v.speed * 2)
      for (const o of this.trams.values()) {
        // (one in this very lane is followed as the car ahead already)
        if (o.edgeId === v.edgeId && o.dir === v.dir) continue
        if (Math.abs(o.at.x - v.at.x) > reach + 15 || Math.abs(o.at.z - v.at.z) > reach + 15) continue
        if (Math.abs((o.y ?? 0) - (this.levelOf(v) ?? o.y ?? 0)) > LEVELS) continue
        const d = this.sweep(v, box, reach, this.boxOf(o))
        if (d < 0) continue
        obstacles.push([Math.max(0, d - 0.75), Math.cos(o.heading - v.heading) > 0.5 ? o.speed : 0]); whys.push(o.transit ?? 'tram')
      }
    }
    // the rider, in this lane, ahead — followed or waited for like a car, so nothing runs into them. Not after a
    // collision: then the two ignore each other and the vehicle drives on (owner: "have the vehicle keep going")
    if (rider && rider.edgeId === v.edgeId && !v.bumped && !v.passed) {
      const ahead = (rider.s - v.s) * v.dir
      if (ahead > 0 && Math.abs(this.lateral(e, rider.s, rider.at) - v.lane * v.dir) < this.halfWid(v) + SIZE.bike.wid / 2 + 0.4) {
        obstacles.push([ahead - this.halfLen(v) - SIZE.bike.len / 2, rider.dir === v.dir ? rider.speed : 0]); whys.push('rider in lane')
      }
      // a car AHEAD of a descending rider in their lane gets out of the way
      const behind = (v.s - rider.s) * rider.dir
      if (rider.dir === v.dir && rider.grade < DESCENT && behind > 0 && behind < 60) v0 = Math.max(v0, rider.speed + 1.5)
    }
    /*
     * LOOK-AHEAD AT JUNCTIONS (owner, 2026-09-29: "I still see vehicles going through other vehicles, especially at
     * intersections"; the soak counted 900 pair-seconds of two cars in one box overlapping in 300 s). The rules
     * decide who may ENTER a box, but a car that went in and then found its way out full stands in the box, and
     * cross traffic on its green drove through it. So near and in a junction every vehicle also sweeps its own box
     * forward and stops for ANY vehicle there. Never for one that is waiting for IT (a car in the box waiting for
     * the last car on its way out, which was sweeping into it: both stood for ever); two that would each stop for
     * the other: the lower id goes first. Longer rings of waiting are broken by time: standing 2 s, a vehicle stops
     * looking ahead and goes as the rules let it (a rare overlap, as before, rather than a city-wide gridlock).
     */
    // only against vehicles IN the same junction, and only a few metres ahead along the heading it has now (in the
    // box that follows its arc): swept straight and far, a turning car stopped for the queue across the street and
    // the whole city seized up
    const boxNode = v.inBox ? v.inBox.nodeId : toGo < 8 ? node : null
    // (the valve holds for 4 s: `still` resets the moment it creeps, so on its own it re-armed at once and the car
    // crawled for ever instead of going)
    // 2 s, not 6: stopping in a box for each other for longer kept boxes full, and in a 600 s soak rings of queues
    // locked the whole city
    if ((v.still ?? 0) > LOOK_PATIENCE) v.lookOff = this.t + 4
    /*
     * …and while the valve has it NOT looking (`lookOff`), it still never drives INTO another vehicle (owner,
     * 2026-10-03: "here's a bus, it's extra long, with a car in it"): it looks only a car's contact distance ahead,
     * 1.2 m, so a ring of waiting still breaks — it rolls up to whatever is in the way — but nothing is driven through.
     */
    const contactOnly = this.t < (v.lookOff ?? 0)
    if (this.lookAhead && boxNode !== null) {
      const box = this.boxOf(v)
      const reach = contactOnly ? 1.2 : Math.min(8, 3 + v.speed)
      const cx = Math.floor(v.at.x / NEAR_CELL)
      const cz = Math.floor(v.at.z / NEAR_CELL)
      let best: [number, number, Vehicle] | null = null
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        for (const o of this.near.get(`${cx + i},${cz + j}`) ?? []) {
          // the car ahead in the same lane is IDM's already
          if (o === v || (o.edgeId === v.edgeId && o.dir === v.dir)) continue
          // (…or a long one whose body still reaches into this junction: a bus's centre leaves the box while its tail
          // is still across it, and the cross traffic drove through the tail — BUGS.md #244)
          const inThis = o.inBox ? this.cluster(o.inBox.nodeId) === this.cluster(boxNode) : this.tailIn(o, boxNode)
          if (!inThis) continue
          // only a MOVING one: waiting in a box for a car standing in it (itself waiting for its way out) filled boxes
          // and rings of queues locked the city after ten minutes of soak — EXCEPT one standing right across this
          // vehicle's way, a few metres ahead (2026-10-02, BUGS.md #244: "cars also go right through other cars at
          // intersections … more obvious with longer buses and trucks"); jams that this makes are broken by the
          // release valve (`update`: a car stuck 35 s out of view is retired)
          if (o.speed < 0.5 && this.sweep(v, box, Math.min(reach, 4), this.boxOf(o)) < 0) continue
          if (o.why === `car ${v.id}` || o.why === `next-street car ${v.id}` || o.why === `box car ${v.id}`) continue
          if (Math.abs(o.at.x - v.at.x) > reach + 10 || Math.abs(o.at.z - v.at.z) > reach + 10) continue
          const hit = this.sweep(v, box, reach, this.boxOf(o))
          if (hit < 0 || (best && hit >= best[0])) continue
          // mutual: the lower id has the way
          if (v.id < o.id && this.sweep(o, this.boxOf(o), Math.min(8, 3 + o.speed), box) >= 0) continue
          best = [hit, Math.max(0, o.speed * Math.cos(o.heading - v.heading)), o]
        }
      }
      if (best) { obstacles.push([Math.max(0, best[0] - 0.75), best[1]]); whys.push(`car ${best[2].id}`) }
    }
    /*
     * A rider STOPPED or DOWN anywhere in its path — in a junction above all — is waited for, whatever street each is
     * on (owner, 2026-09-29: "you can often get hit multiple times in one intersection"). Swept forward with the
     * vehicle's own box. Only a rider at a standstill: one riding across a red is still theirs to judge. The why is
     * 'rider in lane', which the rider's own hold (`leaderFor`) ignores, so the two never wait for each other.
     */
    // …and by any vehicle going slowly enough to stop for them anyway (under 3 m/s: a car creeping through a jammed
    // box, and above all one turning RIGHT across a rider keeping right — the right hook, measured once keeping
    // right came in)
    if (rider && !v.bumped && !v.passed && (rider.speed < 1.5 || v.speed < 3) && Math.hypot(rider.at.x - v.at.x, rider.at.z - v.at.z) < 26 && !this.otherLevel(rider, v)) {
      const box = this.boxOf(v)
      const fx = Math.sin(v.heading)
      const fz = Math.cos(v.heading)
      for (let dd = 0.5; dd <= 20; dd += 0.75) {
        if (overlap({ ...box, x: box.x + fx * dd, z: box.z + fz * dd }, rider.box)) {
          obstacles.push([Math.max(0, dd - 1.5), 0]); whys.push('rider in lane')
          break
        }
      }
    }

    // the junction ahead. A car can still be clearing the junction BEHIND it while it comes up to this one — the
    // Haight splits its streets at every path crossing, some only metres apart — so "in the box" means in THIS
    // one; a car that stopped planning while clearing the last junction stood at the end of a short street with
    // nowhere to go, and everything behind it, the rider included, waited for ever.
    // …and on the street it went IN by: a short street whose far end is the same junction (a little loop in OSM's
    // data) left a car believing it was still inside the junction ahead, so it never planned a turn and stood at the
    // end of the street with nothing in front of it — and the queue behind it, the rider in it, waited for ever
    const boxHere = !!v.inBox && v.inBox.nodeId === node && v.inBox.from === v.edgeId
    let refusedNow = false
    if (toGo < CHOOSE && !v.next && !boxHere) this.choose(v, e, node)
    const c = this.signals?.control(node)
    const radius = c?.radius ?? 6
    // by the NOSE: a bus stopped with its centre at the line had four metres of itself in the junction
    const stopDist = toGo - this.halfLen(v) - radius - 1
    // a standing obstacle at the stop line: IDM brings the nose to rest `s0` short of it, so it sits AT the line
    const atLine = (why: string): void => { obstacles.push([stopDist - 0.3 + d.s0, 0]); whys.push(why) }
    const stopSign = !!c && (c.kind === 'stop4' || (c.kind === 'stop2' && !c.major.has(e.id)))
    if (!boxHere && toGo < CHOOSE) {
      if (!v.next) {
        // a dead end, or nowhere it may drive: stop at the end and turn round — never drive off it and vanish
        obstacles.push([toGo - this.halfLen(v) - 1 + d.s0, 0]); whys.push('dead end')
        const back = (-v.dir) as 1 | -1
        const room = !(lanes.get(`${e.id}:${back}`) ?? []).some((o) => Math.abs(o.s - v.s) < this.halfLen(v) + this.halfLen(o) + BUMPER + 6)
        if (toGo - this.halfLen(v) < 2.5 && v.speed < 0.3 && room && allowed(e, back)) {
          v.dir = back
          v.next = undefined
          v.stoppedAt = undefined
        }
      } else if (!this.mayEnter(v, e, node, stopDist, boxes, rider)) {
        atLine('may not enter')
        refusedNow = true
        /*
         * A DRIVER WHO CANNOT GO ONE WAY GOES ANOTHER (2026-10-03). Refused for want of room beyond, the head of a
         * queue waited on that one exit for ever — Geary at Union Square seized for the whole soak with an open right
         * turn beside it. Standing eight seconds at the line, it picks again among the exits with room.
         */
        if (v.refused === 'no room beyond' && (v.still ?? 0) > 8 && this.rechooseOn) this.rechoose(v, e, node)
      } else if (stopSign && v.stoppedAt === undefined) {
        atLine('stop sign')
      } else if (stopDist < (v.speed * v.speed) / (2 * d.b) + 1.5) {
        /*
         * COMMITTED: allowed in, and too close to stop comfortably. The junction is claimed now, at the decision,
         * not when the nose crosses into it — two conflicting cars that both found it empty would both drive in.
         */
        if (v.inBox && v.inBox.nodeId !== node) v.prevBox = v.inBox
        v.inBox = { nodeId: node, from: e.id, turn: v.next.turn }
        const l = boxes.get(node)
        if (l) l.push(v)
        else boxes.set(node, [v])
      }
      // standing at the line: the clock for a stop's first-come-first-served and a light's patience
      if (stopDist < 1.5 && v.speed < 0.3 && v.stoppedAt === undefined && c && c.kind !== 'none') v.stoppedAt = this.t
    }

    // turning: slow round the corner, whatever the light says (a committed car is still turning)
    if (v.next && v.next.turn !== 'straight' && toGo < CHOOSE) v0 = Math.min(v0, 4 + Math.max(0, toGo - radius) * 0.25)
    if (v.inBox && !boxHere && v.inBox.turn !== 'straight' && v.edgeId !== v.inBox.from) v0 = Math.min(v0, 4.5)

    // the model
    const vv = v.speed
    let acc = d.a * (1 - Math.pow(vv / Math.max(0.5, v0), 4))
    v.why = undefined
    obstacles.forEach(([gap, vl], k) => {
      const sStar = d.s0 + Math.max(0, vv * d.T + (vv * (vv - vl)) / (2 * Math.sqrt(d.a * d.b)))
      const sGap = Math.max(0.05, gap)
      const a = d.a * (1 - Math.pow(vv / Math.max(0.5, v0), 4) - (sStar / sGap) ** 2)
      if (a < acc) { acc = a; v.why = whys[k] }
    })
    // physical limits: nothing brakes harder than an emergency stop
    acc = Math.max(-9, acc)
    v.speed = Math.max(0, vv + acc * dt)
    v.waiting = acc < -1.2 || v.speed < 0.3

    /*
     * …and REFUSED means refused (2026-10-03): where the line is only a metre or two back from the junction (a
     * crosswalk node mid-block) a refused car could not stop short of it, and the step below took it into the box
     * anyway — on Geary at Union Square eighteen cars stood piled on each other at the start of the next street.
     * It stops where it is instead.
     */
    // (stopped where it is, not snapped back to the line: snapped back it landed in the car behind)
    if (refusedNow && !boxHere && toGo - this.halfLen(v) < radius) v.speed = 0
    // into the box
    if (!refusedNow && !boxHere && toGo - this.halfLen(v) < radius && v.next) {
      if (v.inBox && v.inBox.nodeId !== node) v.prevBox = v.inBox
      v.inBox = { nodeId: node, from: e.id, turn: v.next.turn }
      // at once, not next frame: two conflicting cars deciding in the same frame would otherwise both go
      const l = boxes.get(node)
      if (l) l.push(v)
      else boxes.set(node, [v])
    }
  }

  /**
   * Where a vehicle is while it crosses a junction: on a quadratic curve from the point it enters (its incoming lane,
   * `radius` out from the node) to where it leaves (its outgoing lane, `radius` out along the new street), through
   * the point where the two lanes would meet. Null outside a junction.
   *
   * A car used to round a corner by running into the node along one street and out along the next, its heading
   * eased to catch up — which swung a bus's body across the stop line of the arm beside it. The curve is also
   * simply what a turn looks like.
   */
  private arc(v: Vehicle, e: Edge): { at: Point; heading: number } | null {
    let inE: Edge | undefined
    let outE: Edge | undefined
    let outDir: 1 | -1
    let node: number
    let u: number
    /*
     * The curve's reach along each street, at most HALF that street (2026-10-02, BUGS.md #250: "cars turning left seem
     * to stop, then jump 90 degrees"; the soak counted 843 heading jumps of over 20° in one step in 300 s, most of them
     * going straight on 8–9 m edges between the nodes of a clustered junction). With a 6 m radius at both ends of a 9 m
     * street, the curve out of one junction and the curve into the next overlapped, and a car snapped from one to the
     * other half-way along.
     */
    const radius = (n: number, along: Edge | undefined): number => Math.min(this.signals?.control(n).radius ?? 6, along ? along.length / 2 : Infinity)
    if (v.next && this.toGo(v, e) < radius(this.endNode(v, e), e)) {
      node = this.endNode(v, e)
      const r = radius(node, e)
      inE = e
      outE = this.g.edges.get(v.next.edgeId)
      outDir = v.next.dir
      u = (r - this.toGo(v, e)) / (2 * r)
    } else if (v.prevBox && (v.prevBox.from === e.id || v.prevBox.nodeId !== (v.dir > 0 ? e.a : e.b)) && (v.prevBox = undefined, false)) {
      return null
    } else if ((v.inBox && v.inBox.from !== e.id) || (v.prevBox && v.prevBox.from !== e.id)) {
      // (the box it is curving out of: this one, or the last one if the next has already claimed it)
      const box = v.inBox && v.inBox.from !== e.id ? v.inBox : v.prevBox!
      node = box.nodeId
      const r = radius(node, e)
      const gone = v.dir > 0 ? v.s : e.length - v.s
      if (gone >= r) { if (box === v.prevBox) v.prevBox = undefined; return null }
      inE = this.g.edges.get(box.from)
      outE = e
      outDir = v.dir
      u = 0.5 + gone / (2 * r)
    } else return null
    const nd = this.g.nodes.get(node)
    if (!inE || !outE || !nd) return null
    // (in on one street, out on the other: each end of the curve as far along its own street as that street allows)
    const ri = radius(node, inE)
    const ro = radius(node, outE)
    const r = Math.max(ri, ro)
    // arriving: the direction of travel is back along the incoming street's bearing from the node — read on the street
    // where the curve meets it, `ri` / `ro` from the node, not on its first segment: OSM puts a node a metre or two from
    // many corners, and leaving the curve onto a street bent off that first segment snapped the car round (BUGS.md #250)
    const away = (edge: Edge, d: number): { p: Point; h: number } => {
      const fromA = edge.a === node
      const s0 = clamp(fromA ? d : edge.length - d, 0, edge.length)
      const s1 = clamp(fromA ? d + 1.5 : edge.length - d - 1.5, 0, edge.length)
      const p = pointAlong(edge.points, s0)
      const q = pointAlong(edge.points, s1)
      const h = Math.abs(q.x - p.x) + Math.abs(q.z - p.z) > 1e-6 ? Math.atan2(q.x - p.x, q.z - p.z) : bearingOut(edge, node)
      return { p, h }
    }
    const ai = away(inE, ri)
    const ao = away(outE, ro)
    const bi = ai.h + Math.PI
    const bo = ao.h
    const di = { x: Math.sin(bi), z: Math.cos(bi) }
    const dO = { x: Math.sin(bo), z: Math.cos(bo) }
    const li = laneOf(inE)
    const lo = laneOf(outE)
    // the right of each direction of travel is (cos h, −sin h)
    const E = { x: ai.p.x + Math.cos(bi) * li, z: ai.p.z - Math.sin(bi) * li }
    const X = { x: ao.p.x + Math.cos(bo) * lo, z: ao.p.z - Math.sin(bo) * lo }
    // where the incoming lane line (E + t·di) meets the outgoing one (X − k·dO); the middle for a straight run
    const den = di.x * -dO.z - di.z * -dO.x
    let C = { x: (E.x + X.x) / 2, z: (E.z + X.z) / 2 }
    if (Math.abs(den) > 0.2) {
      const t = ((X.x - E.x) * -dO.z - (X.z - E.z) * -dO.x) / den
      if (t > 0 && t < 3 * r) C = { x: E.x + di.x * t, z: E.z + di.z * t }
    }
    void outDir
    const w = clamp(u, 0, 1)
    const a = (1 - w) * (1 - w)
    const b = 2 * w * (1 - w)
    const c = w * w
    const at = { x: a * E.x + b * C.x + c * X.x, z: a * E.z + b * C.z + c * X.z }
    const tx = 2 * (1 - w) * (C.x - E.x) + 2 * w * (X.x - C.x)
    const tz = 2 * (1 - w) * (C.z - E.z) + 2 * w * (X.z - C.z)
    return { at, heading: Math.abs(tx) + Math.abs(tz) > 1e-9 ? Math.atan2(tx, tz) : v.heading }
  }

  /** advance along the street and across the junction; false when the vehicle has nowhere left to go */
  private move(v: Vehicle, dt: number): boolean {
    let e = this.g.edges.get(v.edgeId)
    if (!e) return false
    v.s += v.dir * v.speed * dt
    const over = v.dir > 0 ? v.s - e.length : -v.s
    if (over > 0) {
      // nowhere to go: it waits at the end (and turns round, above) rather than leaving the map in view
      if (!v.next) { v.s = v.dir > 0 ? e.length : 0; v.speed = 0; return true }
      const n = this.g.edges.get(v.next.edgeId)
      if (!n) return false
      v.edgeId = n.id
      v.dir = v.next.dir
      v.s = v.dir > 0 ? over : n.length - over
      v.lane = laneOf(n)
      v.next = undefined
      v.stoppedAt = undefined
      e = n
    }
    // out of the box once clear of the junction on the far side
    if (v.inBox && v.edgeId !== v.inBox.from) {
      const c = this.signals?.control(v.inBox.nodeId)
      // …by the TAIL
      const gone = (v.dir > 0 ? v.s : e.length - v.s) - this.halfLen(v)
      if (gone > (c?.radius ?? 6)) v.inBox = undefined
    }
    // through a junction, along the turn: from the incoming lane to the outgoing one
    const arc = this.arc(v, e)
    if (arc) {
      v.at = arc.at
      v.heading = arc.heading
    } else {
      const s = clamp(v.s, 0, e.length)
      const p = pointAlong(e.points, s)
      const q = pointAlong(e.points, clamp(s + v.dir * 1.5, 0, e.length))
      // `q` is already along the direction of travel. (The old code reversed it again for dir −1, which put both
      // directions of a street in the SAME lane, head-on.)
      let h = Math.atan2(q.x - p.x, q.z - p.z)
      if (!(Math.abs(q.x - p.x) + Math.abs(q.z - p.z) > 1e-6)) h = v.heading
      // the right of the direction of travel: a car keeps to its own side whichever way it goes
      v.at = { x: p.x + Math.cos(h) * v.lane, z: p.z - Math.sin(h) * v.lane }
      v.heading = h
    }
    v.y = e.raised ? profileAt(e.points, e.heights, v.s).y : undefined
    v.level = e.heights?.length ? profileAt(e.points, e.heights, v.s).y : undefined
    // …and its slope there, along the direction of travel: the street's own pitch under the car (render/street-fleet.ts)
    v.slope = e.heights?.length
      ? (profileAt(e.points, e.heights, clamp(v.s + v.dir * 1.5, 0, e.length)).y - profileAt(e.points, e.heights, clamp(v.s - v.dir * 1.5, 0, e.length)).y) / 3
      : undefined
    return true
  }
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))

/**
 * Where a point is along a street — `s` from its `a` end — and which way a heading runs along it there. The rider's
 * navigator works on the ride graph (merged, contracted edges); the traffic on the streets themselves, so the
 * rider is placed on their street by geometry.
 */
export function onEdge(e: Edge, p: Point, heading: number): { s: number; dir: 1 | -1 } {
  let best = Infinity
  let bestS = 0
  let bestH = 0
  let acc = 0
  for (let i = 1; i < e.points.length; i++) {
    const a = e.points[i - 1]
    const b = e.points[i]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const L = Math.hypot(dx, dz) || 1e-9
    const t = clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / (L * L), 0, 1)
    const d = Math.hypot(a.x + dx * t - p.x, a.z + dz * t - p.z)
    if (d < best) { best = d; bestS = acc + t * L; bestH = Math.atan2(dx, dz) }
    acc += L
  }
  return { s: bestS * (e.length / (acc || 1)), dir: Math.cos(heading - bestH) >= 0 ? 1 : -1 }
}

/**
 * Extra room behind a vehicle that is turning: its curve cuts the corner, so in space it is nearer the car behind
 * than its distance along the street says.
 */
const turning = (o: Vehicle): number => ((o.inBox && o.inBox.turn !== 'straight') || (o.next && o.next.turn !== 'straight') ? 2.5 : 0)
