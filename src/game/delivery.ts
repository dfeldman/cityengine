/**
 * The delivery game, as pure logic (owner, 2026-09-29) — the first, very basic version of the final game:
 *
 *   * a POPUP offers a job: two buildings, a pickup and a drop-off, each named for now by its nearest
 *     intersection ("Haight St & Cole St");
 *   * both are close to the rider and close to each other — a few blocks, everything within a 600 m circle;
 *   * accept it, ride to the first, then the second, and a message says you did it;
 *   * ignore it, and nothing at all happens: it is a free ride. An unanswered offer goes away by itself and another
 *     comes along later.
 *
 * No route is drawn: finding the way is the game, with a compass, the stops on the map and the building lit up. No Babylon and no DOM here — the
 * game (src/game.ts) answers two questions about the city and turns the events into a card and banners
 * (src/ui/delivery-card.ts), so this can be tested headless.
 *
 * Code frame: x east, z north, metres; times in seconds.
 */

/** What the game logic needs to know about the city. */
export interface DeliveryWorld {
  /** buildings whose centre is within `r` metres of (x, z): their id and footprint (flat x, z pairs) */
  buildingsNear(x: number, z: number, r: number): { id: number; ring: number[]; height?: number; baseY?: number }[]
  /** the nearest intersection of two or more NAMED streets within `reach` metres, or null */
  junctionNear(x: number, z: number, reach: number): { name: string; d: number } | null
  /**
   * The nearest rideable street to a footprint, metres (optional). A building set back inside a block, further than
   * `arrive` from any street, could never be reached, so it is never offered.
   */
  streetDistance?(ring: number[]): number
}

export interface Stop {
  buildingId: number
  /** the building's centre */
  x: number
  z: number
  ring: number[]
  /** how the player is told where it is: the nearest intersection, for now */
  label: string
  /** the building's height and where its walls start, metres, when the game knows them (for lighting it up) */
  height?: number
  baseY?: number
}

export interface Job {
  id: number
  pickup: Stop
  dropoff: Stop
  /** straight-line metres rider → pickup → drop-off, for the offer's "about 1.2 km" */
  metres: number
}

export type Phase = 'idle' | 'offered' | 'toPickup' | 'toDropoff'

export type DeliveryEvent =
  | { kind: 'offer'; job: Job }
  | { kind: 'offerExpired'; job: Job }
  | { kind: 'declined'; job: Job }
  | { kind: 'accepted'; job: Job }
  | { kind: 'pickedUp'; job: Job }
  | { kind: 'delivered'; job: Job; seconds: number }

export interface DeliveryConfig {
  /** everything — the rider, the pickup, the drop-off — within this radius of where the offer is made */
  radius: number
  /** how near the pickup may be to the rider, and the drop-off to the pickup, metres */
  minHop: number
  maxHop: number
  /** close enough to a building to count as there: distance from the rider to its footprint, metres */
  arrive: number
  /** a stop must have a named intersection within this of it, or it cannot be described */
  labelReach: number
  /** seconds: before the first offer, after an unanswered/declined offer, after a finished job */
  firstOffer: number
  offerLasts: number
  afterDecline: number
  afterDelivery: number
}

export const DEFAULTS: DeliveryConfig = {
  // `labelReach` 70, not 140: "near Clayton St & Page St" with the building 140 m from that corner, down any of
  // four streets, was a building the owner could not find (2026-09-29) — the lit building and the compass are the
  // real answer, but "near" should also mean near
  // short hops (owner, 2026-09-29: "a few turns, we're starting with very short deliveries"): 120–280 m as the
  // crow flies is two or three blocks in the Haight (at 350 m a probe's legs ran to 6 junctions and 680 m)
  radius: 600, minHop: 120, maxHop: 280, arrive: 26, labelReach: 70,
  firstOffer: 8, offerLasts: 30, afterDecline: 45, afterDelivery: 8,
}

/** a small seeded random, so a test is repeatable */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const centre = (ring: number[]): { x: number; z: number } => {
  let x = 0
  let z = 0
  const n = ring.length / 2
  for (let i = 0; i < ring.length; i += 2) { x += ring[i]; z += ring[i + 1] }
  return { x: x / n, z: z / n }
}

/** area of a footprint, m² */
const area = (ring: number[]): number => {
  let a = 0
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) a += ring[j] * ring[i + 1] - ring[i] * ring[j + 1]
  return Math.abs(a) / 2
}

const inside = (r: number[], x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
  }
  return o
}

/** distance from a point to a footprint (0 inside it) */
export function distanceToRing(ring: number[], x: number, z: number): number {
  if (inside(ring, x, z)) return 0
  let best = Infinity
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const ax = ring[j]
    const az = ring[j + 1]
    const dx = ring[i] - ax
    const dz = ring[i + 1] - az
    const l2 = dx * dx + dz * dz || 1e-9
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2))
    best = Math.min(best, Math.hypot(ax + dx * t - x, az + dz * t - z))
  }
  return best
}

export class Delivery {
  private readonly world: DeliveryWorld
  private readonly cfg: DeliveryConfig
  private readonly r: () => number
  private t = 0
  private nextOfferAt: number
  private offeredAt = 0
  private startedAt = 0
  private jobs = 0
  phase: Phase = 'idle'
  job: Job | null = null

  constructor(world: DeliveryWorld, cfg: Partial<DeliveryConfig> = {}, seed = Date.now()) {
    this.world = world
    this.cfg = { ...DEFAULTS, ...cfg }
    this.r = rng(seed)
    this.nextOfferAt = this.cfg.firstOffer
  }

  /** seconds since the job was taken (the big timer), or null with no job under way */
  get elapsed(): number | null { return this.phase === 'toPickup' || this.phase === 'toDropoff' ? this.t - this.startedAt : null }

  /** where the player should be heading now, or null (for the HUD line, the compass and the lit building) */
  get target(): Stop | null {
    if (!this.job) return null
    return this.phase === 'toPickup' ? this.job.pickup : this.phase === 'toDropoff' ? this.job.dropoff : null
  }

  /** Advance time and check the rider against the current stop. */
  update(dt: number, at: { x: number; z: number }): DeliveryEvent[] {
    this.t += dt
    const out: DeliveryEvent[] = []
    if (this.phase === 'idle' && this.t >= this.nextOfferAt) {
      const job = this.makeJob(at)
      if (job) {
        this.job = job
        this.phase = 'offered'
        this.offeredAt = this.t
        out.push({ kind: 'offer', job })
      } else this.nextOfferAt = this.t + 5   // nothing suitable loaded yet: try again shortly
    } else if (this.phase === 'offered' && this.t - this.offeredAt > this.cfg.offerLasts) {
      // ignored: it simply goes away, and the ride goes on
      out.push({ kind: 'offerExpired', job: this.job! })
      this.reset(this.cfg.afterDecline)
    } else if (this.phase === 'toPickup' && this.arrived(this.job!.pickup, at)) {
      this.phase = 'toDropoff'
      out.push({ kind: 'pickedUp', job: this.job! })
    } else if (this.phase === 'toDropoff' && this.arrived(this.job!.dropoff, at)) {
      out.push({ kind: 'delivered', job: this.job!, seconds: this.t - this.startedAt })
      this.reset(this.cfg.afterDelivery)
    }
    return out
  }

  accept(): DeliveryEvent[] {
    if (this.phase !== 'offered' || !this.job) return []
    this.phase = 'toPickup'
    this.startedAt = this.t
    return [{ kind: 'accepted', job: this.job }]
  }

  decline(): DeliveryEvent[] {
    if (this.phase !== 'offered' || !this.job) return []
    const job = this.job
    this.reset(this.cfg.afterDecline)
    return [{ kind: 'declined', job }]
  }

  private reset(wait: number): void {
    this.phase = 'idle'
    this.job = null
    this.nextOfferAt = this.t + wait
  }

  private arrived(s: Stop, at: { x: number; z: number }): boolean {
    return distanceToRing(s.ring, at.x, at.z) <= this.cfg.arrive
  }

  /** a stop at a building, if it is a sensible one: a real footprint, standing near a named intersection */
  private stopAt(b: { id: number; ring: number[]; height?: number; baseY?: number }): Stop | null {
    if (b.ring.length < 6) return null
    const a = area(b.ring)
    if (a < 60 || a > 20000) return null
    const c = centre(b.ring)
    if (this.world.streetDistance && this.world.streetDistance(b.ring) > this.cfg.arrive - 4) return null
    const j = this.world.junctionNear(c.x, c.z, this.cfg.labelReach)
    if (!j) return null
    return { buildingId: b.id, x: c.x, z: c.z, ring: b.ring, label: j.name,
      ...(b.height !== undefined ? { height: b.height } : {}), ...(b.baseY !== undefined ? { baseY: b.baseY } : {}) }
  }

  /** A job near the rider: pickup and drop-off both within `radius` of here, each a hop of min–max metres. */
  makeJob(at: { x: number; z: number }): Job | null {
    const { radius, minHop, maxHop } = this.cfg
    const pool = this.world.buildingsNear(at.x, at.z, radius)
    if (pool.length < 2) return null
    const pick = <T>(l: T[]): T => l[Math.floor(this.r() * l.length)]
    const within = (x: number, z: number, cx: number, cz: number, lo: number, hi: number): boolean => {
      const d = Math.hypot(x - cx, z - cz)
      return d >= lo && d <= hi
    }
    for (let tries = 0; tries < 60; tries++) {
      const pb = pick(pool)
      const pc = centre(pb.ring)
      if (!within(pc.x, pc.z, at.x, at.z, minHop, maxHop)) continue
      const pickup = this.stopAt(pb)
      if (!pickup) continue
      for (let k = 0; k < 40; k++) {
        const db = pick(pool)
        if (db.id === pb.id) continue
        const dc = centre(db.ring)
        if (!within(dc.x, dc.z, pc.x, pc.z, minHop, maxHop) || Math.hypot(dc.x - at.x, dc.z - at.z) > radius) continue
        const dropoff = this.stopAt(db)
        // two stops with the same description would be a puzzle, not a job
        if (!dropoff || dropoff.label === pickup.label) continue
        const metres = Math.hypot(pc.x - at.x, pc.z - at.z) + Math.hypot(dc.x - pc.x, dc.z - pc.z)
        return { id: ++this.jobs, pickup, dropoff, metres }
      }
    }
    return null
  }
}
