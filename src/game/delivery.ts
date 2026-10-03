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
  /** is there anything built at (x, z) — a building-bearing tile of the city (optional; for drop-offs beyond the tiles in) */
  builtAt?(x: number, z: number): boolean
  /** a name for a place not yet loaded, e.g. "Geary Blvd near Fillmore St" (optional) */
  nameAt?(x: number, z: number): string | null
}

/** Something to deliver: a dish, a bottle, a cake. FRAGILE: a collision after pickup spoils it, and the job is off. */
export interface Item { name: string; emoji: string; blurb: string; fragile?: boolean }

/**
 * Where a job starts (owner, 2026-10-01): a kitchen at a fixed place — invented names, plausible places (dim sum in
 * Chinatown, steak downtown; src/city/sf/restaurants.json) — and what it sends out.
 */
export interface Source { id: string; name: string; kind: string; blurb: string; x: number; z: number; items: Item[] }

export interface Stop {
  buildingId: number
  /** the building's centre */
  x: number
  z: number
  ring: number[]
  /** how the player is told where it is: the nearest intersection, for now */
  label: string
  /** a far place not yet pinned to a building: `ring` is a square round the point until its tiles are in */
  far?: boolean
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
  /** the kitchen it comes from and what it is, when the city has sources (the pickup is then the kitchen) */
  source?: Source
  item?: Item
}

/** how much of a crossing's `chance` each level (1-based) gets: none at the first two, the whole of it at the last */
export const CROSSING_BY_LEVEL = [0, 0, 0.1, 0.35, 1]
export const CROSSING_LEVEL = CROSSING_BY_LEVEL.length

export type Phase = 'idle' | 'offered' | 'toPickup' | 'toDropoff'

export type DeliveryEvent =
  | { kind: 'offer'; job: Job }
  | { kind: 'offerExpired'; job: Job }
  | { kind: 'declined'; job: Job }
  | { kind: 'accepted'; job: Job }
  | { kind: 'pickedUp'; job: Job }
  | { kind: 'delivered'; job: Job; seconds: number; bumps: number }
  /** a far stop has been pinned to its building, once its tiles are in */
  | { kind: 'stopMoved'; job: Job; stop: 'pickup' | 'dropoff' }
  /** a fragile item did not survive a collision: the job is off */
  | { kind: 'spoiled'; job: Job }

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
  /**
   * LONG JOBS ACROSS SOMETHING (owner, 2026-09-30: destinations on Yerba Buena and Treasure Island): near `from`,
   * now and then (`chance` of an offer), the drop-off is one of `places` instead — kilometres away, over the Bay
   * Bridge. A place is a point and a name; the building there is found when its tiles have come in.
   */
  crossings?: { name: string; from: { x: number; z: number; r: number }; places: { name: string; x: number; z: number }[]; chance: number }[]
  /** seconds: before the first offer, after an unanswered/declined offer, after a finished job */
  firstOffer: number
  offerLasts: number
  /**
   * Seconds after which an offer is TAKEN rather than left (trainer mode, src/modes.ts: a rider happy with the
   * defaults never touches a control). Absent or null: an unanswered offer goes away after `offerLasts`.
   */
  autoAccept?: number | null
  /** the city's kitchens (`Source`): jobs start at one of them when there is one within `sourceReach` of the rider */
  sources?: Source[]
  sourceReach: number
  /**
   * The farthest a drop-off may be from its kitchen, metres, by LEVEL (1-based; `Delivery.level`): the difficulty.
   * The nearest is a third of it (but never under `minHop`).
   */
  levels: number[]
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
  // level 1 (owner, 2026-10-01: "at level 1 it might be just 500 meter radius deliveries, level 2 it's a bit further")
  sourceReach: 1500, levels: [500, 900, 1400, 2000, 3000],
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
  /** collisions during the job in hand: they cost stars (`rate`) */
  private bumps = 0
  private jobs = 0
  phase: Phase = 'idle'
  job: Job | null = null
  /** the difficulty, 1-based: how far a drop-off may be from its kitchen (`levels`) */
  level = 1
  private settleAt = 0

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
    } else if (this.phase === 'offered' && this.cfg.autoAccept != null && this.t - this.offeredAt > this.cfg.autoAccept) {
      out.push(...this.accept())
    } else if (this.phase === 'offered' && this.t - this.offeredAt > this.cfg.offerLasts) {
      // ignored: it simply goes away, and the ride goes on
      out.push({ kind: 'offerExpired', job: this.job! })
      this.reset(this.cfg.afterDecline)
    } else if ((this.phase === 'offered' || this.phase === 'toPickup') && this.job!.pickup.far && this.settle(this.job!, 'pickup')) {
      // a kitchen beyond the tiles in when it was offered: now a building to light
      out.push({ kind: 'stopMoved', job: this.job!, stop: 'pickup' })
    } else if (this.phase === 'toDropoff' && this.job!.dropoff.far && this.settle(this.job!, 'dropoff')) {
      // a far drop-off's building has come in with its tiles: the same place, now a building to light
      out.push({ kind: 'stopMoved', job: this.job!, stop: 'dropoff' })
    } else if (this.phase === 'toPickup' && this.arrived(this.job!.pickup, at)) {
      this.phase = 'toDropoff'
      out.push({ kind: 'pickedUp', job: this.job! })
    } else if (this.phase === 'toDropoff' && this.arrived(this.job!.dropoff, at)) {
      out.push({ kind: 'delivered', job: this.job!, seconds: this.t - this.startedAt, bumps: this.bumps })
      this.reset(this.cfg.afterDelivery)
    }
    return out
  }

  accept(): DeliveryEvent[] {
    if (this.phase !== 'offered' || !this.job) return []
    this.phase = 'toPickup'
    this.startedAt = this.t
    this.bumps = 0
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
  private stopAt(b: { id: number; ring: number[]; height?: number; baseY?: number }, named = true): Stop | null {
    if (b.ring.length < 6) return null
    const a = area(b.ring)
    if (a < 60 || a > 20000) return null
    const c = centre(b.ring)
    if (this.world.streetDistance && this.world.streetDistance(b.ring) > this.cfg.arrive - 4) return null
    // (a stop that brings its own name — a kitchen, a far place — needs no intersection to be described by)
    const j = named ? this.world.junctionNear(c.x, c.z, this.cfg.labelReach) : null
    if (named && !j) return null
    return { buildingId: b.id, x: c.x, z: c.z, ring: b.ring, label: j?.name ?? '',
      ...(b.height !== undefined ? { height: b.height } : {}), ...(b.baseY !== undefined ? { baseY: b.baseY } : {}) }
  }

  /** A far place as a stop: its building if it is in, else a square round the point, to be settled later. */
  private farStop(p: { name: string; x: number; z: number }): Stop {
    const s = this.nearestStop(p)
    if (s) return { ...s, label: p.name }
    const h = 8
    return { buildingId: -1, x: p.x, z: p.z, label: p.name, far: true,
      ring: [p.x - h, p.z - h, p.x + h, p.z - h, p.x + h, p.z + h, p.x - h, p.z + h] }
  }

  private nearestStop(p: { x: number; z: number }): Stop | null {
    let best: Stop | null = null
    let bd = Infinity
    for (const b of this.world.buildingsNear(p.x, p.z, 90)) {
      const s = this.stopAt(b, false)
      if (!s) continue
      const d = Math.hypot(s.x - p.x, s.z - p.z)
      if (d < bd) { bd = d; best = s }
    }
    return best
  }

  /** pin a far stop to its building, if its tiles are in now; true if it moved */
  private settle(job: Job, which: 'pickup' | 'dropoff'): boolean {
    // (a look through the buildings that are in: once a second is plenty)
    if (this.t < this.settleAt) return false
    this.settleAt = this.t + 1
    const s = this.nearestStop(job[which])
    if (!s) return false
    job[which] = { ...s, label: job[which].label }
    return true
  }

  /**
   * A collision (game.ts, when the rider goes down): a FRAGILE item already picked up is spoiled and the job is off.
   * The ice cream is on the road; the customer will not be told.
   */
  collided(): DeliveryEvent[] {
    if (this.phase === 'toPickup' || this.phase === 'toDropoff') this.bumps++
    if (this.phase !== 'toDropoff' || !this.job?.item?.fragile) return []
    const job = this.job
    this.reset(this.cfg.afterDecline)
    return [{ kind: 'spoiled', job }]
  }

  /**
   * A job from a KITCHEN (`sources`): one of the nearest few within `sourceReach` of the rider, picked up at its
   * building; delivered to a random building between a third of the level's distance and all of it. Beyond the
   * tiles that are in, the drop-off is a point on built ground (`builtAt`), pinned to its building as it loads.
   */
  private kitchenJob(at: { x: number; z: number }): Job | null {
    const near = (this.cfg.sources ?? [])
      .map((src) => ({ src, d: Math.hypot(src.x - at.x, src.z - at.z) }))
      .filter((c) => c.d <= this.cfg.sourceReach && c.src.items.length > 0)
      .sort((a, b) => a.d - b.d)
      .slice(0, 4)
    if (near.length === 0) return null
    const { src, d } = near[Math.floor(this.r() * near.length)]
    const pickup = this.farStop({ name: src.name, x: src.x, z: src.z })
    const hi = this.cfg.levels[Math.max(0, Math.min(this.cfg.levels.length - 1, this.level - 1))]
    const lo = Math.max(this.cfg.minHop, hi / 3)
    const item = src.items[Math.floor(this.r() * src.items.length)]
    const make = (dropoff: Stop): Job => ({ id: ++this.jobs, pickup, dropoff, metres: d + Math.hypot(dropoff.x - src.x, dropoff.z - src.z), source: src, item })
    // a building that is in, first
    const pool = this.world.buildingsNear(src.x, src.z, hi)
    for (let tries = 0; tries < 60 && pool.length; tries++) {
      const b = pool[Math.floor(this.r() * pool.length)]
      const c = centre(b.ring)
      const dd = Math.hypot(c.x - src.x, c.z - src.z)
      if (dd < lo || dd > hi) continue
      const stop = this.stopAt(b)
      if (stop && stop.label !== pickup.label) return make(stop)
    }
    // …else a point on built ground at that distance, to be pinned later
    for (let tries = 0; tries < 40; tries++) {
      const a = this.r() * Math.PI * 2
      const dd = lo + (hi - lo) * this.r()
      const x = src.x + Math.sin(a) * dd
      const z = src.z + Math.cos(a) * dd
      if (this.world.builtAt && !this.world.builtAt(x, z)) continue
      return make(this.farStop({ name: this.world.nameAt?.(x, z) ?? 'a doorstep across town', x, z }))
    }
    return null
  }

  /** A job ACROSS something (`crossings`): picked up near here, delivered to one of the far places. */
  private crossingJob(at: { x: number; z: number }): Job | null {
    for (const c of this.cfg.crossings ?? []) {
      // (MOSTLY at the top levels: the islands are 4–5 km over the bridge, and at level 2 one was a long, unwelcome
      // haul — owner, 2026-10-02: "i just got a delivery to treasure island. i think i'm level 2? that is a LOOOONG
      // ride" … "crossings should be real, but mostly at high levels"): the chance scaled by `CROSSING_BY_LEVEL`
      const scale = CROSSING_BY_LEVEL[Math.max(0, Math.min(CROSSING_BY_LEVEL.length - 1, this.level - 1))]
      if (Math.hypot(at.x - c.from.x, at.z - c.from.z) > c.from.r || this.r() >= c.chance * scale) continue
      const pool = this.world.buildingsNear(at.x, at.z, this.cfg.maxHop)
      for (let tries = 0; tries < 40 && pool.length; tries++) {
        const pb = pool[Math.floor(this.r() * pool.length)]
        const pc = centre(pb.ring)
        const d = Math.hypot(pc.x - at.x, pc.z - at.z)
        if (d < this.cfg.minHop || d > this.cfg.maxHop) continue
        const pickup = this.stopAt(pb)
        if (!pickup) continue
        const place = c.places[Math.floor(this.r() * c.places.length)]
        const dropoff = this.farStop(place)
        return { id: ++this.jobs, pickup, dropoff, metres: d + Math.hypot(place.x - pc.x, place.z - pc.z) }
      }
    }
    return null
  }

  /** A job near the rider: pickup and drop-off both within `radius` of here, each a hop of min–max metres. */
  makeJob(at: { x: number; z: number }): Job | null {
    const across = this.crossingJob(at)
    if (across) return across
    const kitchen = this.kitchenJob(at)
    if (kitchen) return kitchen
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

/** How a delivery went: the customer's stars, the pay, and what they said. */
export interface Rating { stars: number; fee: number; tip: number; line: string }

const LINES: Record<number, string[]> = {
  5: ['Still hot! Best courier in the city.', 'Wow, that was fast!', 'Perfect. You are my new favourite.'],
  4: ['Right on time, thanks!', 'Great, thank you!', 'Nice one, see you next time.'],
  3: ['Got it, thanks.', 'OK, thanks.', 'Cheers.'],
  2: ['A little cold, but fine.', 'Took a while…', 'Hmm, it got a bit shaken.'],
  1: ['Finally.', 'Was that a scenic route?', 'It looks like it fell off the bike.'],
}

/**
 * THE RATING (2026-10-01, for the demo: a delivery should feel like it was worth doing). The time is judged against
 * what the job's distance takes at `pace` m/s (the world speed of a steady rider in this mode, the speedup counted),
 * with a fifth more for the streets not being straight lines; each collision on the way costs a star. The fee is
 * by distance, the tip by stars, both a little richer at higher levels.
 */
export function rate(job: Job, seconds: number, bumps: number, level: number, pace: number, pick = Math.random()): Rating {
  const expected = (job.metres * 1.35) / pace + 15
  const r = seconds / expected
  let stars = r <= 0.8 ? 5 : r <= 1.0 ? 4 : r <= 1.3 ? 3 : r <= 1.7 ? 2 : 1
  stars = Math.max(1, stars - bumps)
  const boost = 1 + 0.25 * (Math.max(1, level) - 1)
  const half = (v: number): number => Math.round(v * 2) / 2
  const fee = half((3 + 2 * job.metres / 1000) * boost)
  const tip = half([0, 0, 0.5, 1.5, 2.5, 4][stars] * boost)
  const lines = LINES[stars]
  return { stars, fee, tip, line: lines[Math.floor(pick * lines.length) % lines.length] }
}
