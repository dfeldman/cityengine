/**
 * The traffic, and the one rule it is built around: **a vehicle must always be able to stop for the rider.**
 *
 * That is a safety property, not a courtesy. A game you ride at 25 km/h on a trainer, steering with two
 * buttons and a second of latency, cannot also ask you to avoid moving cars — being hit would be
 * unavoidable, unfair and, on an exercise bike, genuinely unpleasant. So the traffic is tuned so that it is
 * never a hazard:
 *
 *   * **Cars go in straight lines.** They drive the edge they spawned on from one end to the other and
 *     vanish. No turning, no junction negotiation, no queueing model — none of which the rider can see, and
 *     all of which would cost far more than it returns.
 *   * **They stop for the rider, always.** Any vehicle whose path brings it within a few metres of the rider
 *     brakes to a halt and waits. It can always do this because the density is capped low enough that a
 *     stopped car never has another car close behind it.
 *   * **Density is per kilometre of street, not per city.** A handful of cars on the street you are actually
 *     on reads as a living city; the same number spread over the Marais reads as an abandoned one.
 *
 * Vehicles live only near the rider — spawned as streets come into range, dropped as they leave — so the
 * count is bounded by what is on screen, not by the size of the city.
 */
import { distance, type Point } from '../city/geo.ts'
import type { CityGraph, Edge } from '../city/graph.ts'
import { pointAlong } from './navigate.ts'
import { profileAt } from '../city/terrain.ts'

export type VehicleKind = 'car' | 'bus'

export interface Vehicle {
  kind: VehicleKind
  edgeId: number
  /** metres along the edge, a→b */
  s: number
  /** +1 travelling a→b, −1 the other way */
  dir: 1 | -1
  speed: number
  cruise: number
  /** lateral offset from the centre line, so they keep to their side */
  offset: number
  colour: [number, number, number]
  /** true while stopped for the rider, so the renderer can light the brake lights */
  waiting: boolean
  at: Point
  heading: number
  /** height, on a raised edge (a bridge); absent means "on the ground" */
  y?: number
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
  /** vehicles per kilometre of street, at 'some' */
  density: number
  /** how far from the rider streets are populated */
  range: number
  /** how close a vehicle may come to the rider before it stops */
  clearance: number
}

export const TRAFFIC: Record<'none' | 'some' | 'busy', TrafficConfig> = {
  none: { density: 0, range: 0, clearance: 0 },
  some: { density: 5, range: 190, clearance: 7 },
  busy: { density: 11, range: 220, clearance: 7 },
}

// Saturated, flat, and a few of them deliberately drab, because a street where every car is a jellybean
// looks like a toy rather than a city.
const CAR_COLOURS: [number, number, number][] = [
  [0.78, 0.20, 0.18], [0.16, 0.30, 0.58], [0.92, 0.88, 0.84], [0.14, 0.15, 0.17],
  [0.35, 0.52, 0.34], [0.86, 0.66, 0.16], [0.55, 0.57, 0.60], [0.28, 0.52, 0.56],
  [0.70, 0.36, 0.14], [0.42, 0.28, 0.48],
]

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

export class Traffic {
  private readonly g: CityGraph
  private readonly cfg: TrafficConfig
  private readonly vehicles: Vehicle[] = []
  /** edges that already have their traffic, so a street is not repopulated every frame */
  private readonly populated = new Set<number>()

  /*
   * A preset name, or a config of its own — `?crowd=`/`?traffic=` take a NUMBER for a quick density test
   * beyond the named levels (src/game.ts). The presets are what the game ships; a number is for measuring.
   */
  constructor(graph: CityGraph, level: keyof typeof TRAFFIC | TrafficConfig = 'some') {
    this.g = graph
    this.cfg = typeof level === 'string' ? TRAFFIC[level] : level
  }

  get all(): readonly Vehicle[] { return this.vehicles }

  /**
   * Populate the streets near the rider, retire what has gone, and move everything.
   *
   * `rider` and `riderSpeed` are what the yielding is computed against.
   */
  update(dt: number, rider: Point, edgesNear: Iterable<Edge>): void {
    if (this.cfg.density === 0) return

    for (const e of edgesNear) {
      if (this.populated.has(e.id) || e.foot || e.width < 4.2) continue
      this.populated.add(e.id)
      if (distance(midpoint(e), rider) > this.cfg.range) { this.populated.delete(e.id); continue }
      const r = rng(e.id)
      // how many vehicles this street's length earns, rounded probabilistically so short streets are not
      // always empty and long ones are not always full
      const want = (e.length / 1000) * this.cfg.density
      let n = Math.floor(want)
      if (r() < want - n) n++
      for (let i = 0; i < n; i++) {
        const dir: 1 | -1 = r() < 0.5 ? 1 : -1
        const bus = r() < 0.12 && e.width >= 8
        this.vehicles.push({
          kind: bus ? 'bus' : 'car',
          edgeId: e.id,
          s: r() * e.length,
          dir,
          cruise: (bus ? 6.5 : 8.5) + r() * 3,
          speed: 0,
          // keep left or right of the centre line by half a lane
          offset: dir * Math.min(2.6, e.width * 0.24),
          colour: bus ? [0.85, 0.35, 0.18] : CAR_COLOURS[Math.floor(r() * CAR_COLOURS.length)],
          waiting: false,
          at: { x: 0, z: 0 },
          heading: 0,
        })
      }
    }

    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i]
      const e = this.g.edges.get(v.edgeId)
      if (!e) { this.vehicles.splice(i, 1); continue }

      // Yielding. A vehicle stops if the rider is near the point it is about to occupy — which, because
      // density is capped, it can always do without anything running into the back of it.
      const ahead = pointAlong(e.points, clamp(v.s + v.dir * 8, 0, e.length))
      const gap = Math.min(distance(v.at, rider), distance(ahead, rider))
      v.waiting = gap < this.cfg.clearance
      const target = v.waiting ? 0 : v.cruise
      // brake hard, accelerate gently: a car that stops for you should look like it meant to
      const rate = target < v.speed ? 7 : 2.2
      v.speed += Math.max(-rate * dt, Math.min(rate * dt, target - v.speed))

      v.s += v.dir * v.speed * dt
      if (v.s < -2 || v.s > e.length + 2) {
        // off the end of its street: retire it, and let the street be repopulated later
        this.vehicles.splice(i, 1)
        this.populated.delete(e.id)
        continue
      }

      const p = pointAlong(e.points, clamp(v.s, 0, e.length))
      const q = pointAlong(e.points, clamp(v.s + v.dir * 1.5, 0, e.length))
      v.heading = v.dir > 0 ? Math.atan2(q.x - p.x, q.z - p.z) : Math.atan2(p.x - q.x, p.z - q.z)
      // sit in the correct lane rather than on the centre line
      const nx = Math.cos(v.heading)
      const nz = -Math.sin(v.heading)
      const lane = Math.abs(v.offset)
      v.at = { x: p.x + nx * lane * Math.sign(v.offset), z: p.z + nz * lane * Math.sign(v.offset) }
      v.y = e.raised ? profileAt(e.points, e.heights, v.s).y : undefined

      if (distance(v.at, rider) > this.cfg.range * 1.5) {
        this.vehicles.splice(i, 1)
        this.populated.delete(e.id)
      }
    }
  }

  /** Let a street be repopulated once the rider has gone away and come back. */
  forget(edgeId: number): void { this.populated.delete(edgeId) }
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
const midpoint = (e: Edge): Point => e.points[Math.floor(e.points.length / 2)]
