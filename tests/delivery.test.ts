/**
 * The delivery game logic (src/game/delivery.ts), on a synthetic grid town: buildings on a 100 m grid of blocks,
 * intersections named "N<i> St & E<j> Ave".
 */
import PARIS_KITCHENS from '../src/city/paris/restaurants.json'
import { describe, expect, it } from 'vitest'
import { CROSSING_LEVEL, DEFAULTS, Delivery, distanceToRing, rate, type DeliveryWorld, type Source } from '../src/game/delivery.ts'

const sq = (cx: number, cz: number, h: number): number[] => [cx - h, cz - h, cx + h, cz - h, cx + h, cz + h, cx - h, cz + h]

function town(): DeliveryWorld {
  const buildings: { id: number; ring: number[] }[] = []
  let id = 1
  // each building 30 m along and 30 m across from a corner: 42 m from its intersection, inside the 70 m of "near"
  for (let i = -15; i <= 15; i++) for (let j = -15; j <= 15; j++) buildings.push({ id: id++, ring: sq(i * 100 + 30, j * 100 + 30, 20) })
  return {
    buildingsNear: (x, z, r) => buildings.filter((b) => Math.hypot(b.ring[0] + 20 - x, b.ring[1] + 20 - z) <= r),
    junctionNear: (x, z, reach) => {
      const i = Math.round(x / 100)
      const j = Math.round(z / 100)
      const d = Math.hypot(i * 100 - x, j * 100 - z)
      return d <= reach ? { name: `N${i} St & E${j} Ave`, d } : null
    },
  }
}

const tick = (g: Delivery, seconds: number, at: { x: number; z: number }) => {
  const out = []
  for (let t = 0; t < seconds; t += 0.5) out.push(...g.update(0.5, at))
  return out
}

describe('the delivery game', () => {
  it('offers a job after a moment: two buildings, near the rider and each other, named by an intersection', () => {
    const g = new Delivery(town(), {}, 42)
    const ev = tick(g, DEFAULTS.firstOffer + 1, { x: 0, z: 0 })
    const offer = ev.find((e) => e.kind === 'offer')
    expect(offer).toBeTruthy()
    const job = offer!.job
    expect(g.phase).toBe('offered')
    for (const s of [job.pickup, job.dropoff]) {
      expect(Math.hypot(s.x, s.z)).toBeLessThanOrEqual(DEFAULTS.radius)
      expect(s.label).toMatch(/^N-?\d+ St & E-?\d+ Ave$/)
    }
    expect(Math.hypot(job.dropoff.x - job.pickup.x, job.dropoff.z - job.pickup.z)).toBeLessThanOrEqual(DEFAULTS.maxHop)
    expect(job.pickup.label).not.toBe(job.dropoff.label)
  })

  it('does nothing at all if the rider ignores it: the offer goes away and the ride goes on', () => {
    const g = new Delivery(town(), {}, 7)
    tick(g, DEFAULTS.firstOffer + 1, { x: 0, z: 0 })
    const ev = tick(g, DEFAULTS.offerLasts + 1, { x: 0, z: 0 })
    expect(ev.map((e) => e.kind)).toEqual(['offerExpired'])
    expect(g.phase).toBe('idle')
    expect(g.target).toBeNull()
    // and a new one comes along later, not straight away
    expect(tick(g, DEFAULTS.afterDecline - 2, { x: 0, z: 0 }).length).toBe(0)
    expect(tick(g, 5, { x: 0, z: 0 }).some((e) => e.kind === 'offer')).toBe(true)
  })

  it('runs a whole job: accept, the pickup, then the drop-off, and says so — in that order only', () => {
    const g = new Delivery(town(), {}, 3)
    const offer = tick(g, DEFAULTS.firstOffer + 1, { x: 0, z: 0 }).find((e) => e.kind === 'offer')!
    const { pickup, dropoff } = offer.job
    expect(g.accept().map((e) => e.kind)).toEqual(['accepted'])
    // riding past the drop-off first counts for nothing
    expect(tick(g, 2, { x: dropoff.x, z: dropoff.z + 21 })).toEqual([])
    expect(g.phase).toBe('toPickup')
    // at the pickup's front door (within `arrive` of its wall, out on the street)
    const p = tick(g, 1, { x: pickup.x, z: pickup.z + 20 + 15 })
    expect(p.map((e) => e.kind)).toEqual(['pickedUp'])
    expect(g.target).toBe(dropoff)
    const d = tick(g, 1, { x: dropoff.x + 20 + 10, z: dropoff.z })
    expect(d.map((e) => e.kind)).toEqual(['delivered'])
    expect(g.phase).toBe('idle')
  })

  it('eating the order is the pass: only with it on board, and the job is over (owner, 2026-10-03)', () => {
    const g = new Delivery(town(), {}, 3)
    const offer = tick(g, DEFAULTS.firstOffer + 1, { x: 0, z: 0 }).find((e) => e.kind === 'offer')!
    g.accept()
    // not before it has been picked up
    expect(g.eat()).toEqual([])
    tick(g, 1, { x: offer.job.pickup.x, z: offer.job.pickup.z + 20 + 15 })
    expect(g.phase).toBe('toDropoff')
    expect(g.eat().map((e) => e.kind)).toEqual(['eaten'])
    expect(g.phase).toBe('idle')
    expect(g.job).toBeNull()
  })

  it('a jump on the map forfeits the job in hand — no jumping to the door (owner, 2026-10-03)', () => {
    const g = new Delivery(town(), {}, 3)
    const offer = tick(g, DEFAULTS.firstOffer + 1, { x: 0, z: 0 }).find((e) => e.kind === 'offer')!
    g.accept()
    tick(g, 1, { x: offer.job.pickup.x, z: offer.job.pickup.z + 20 + 15 })
    expect(g.phase).toBe('toDropoff')
    expect(g.forfeit().map((e) => e.kind)).toEqual(['forfeit'])
    expect(g.phase).toBe('idle')
    // arriving at the old drop-off now counts for nothing
    expect(tick(g, 1, { x: offer.job.dropoff.x + 30, z: offer.job.dropoff.z })).toEqual([])
    // and with nothing in hand there is nothing to forfeit
    expect(g.forfeit()).toEqual([])
  })

  it('declining is the same as ignoring', () => {
    const g = new Delivery(town(), {}, 9)
    tick(g, DEFAULTS.firstOffer + 1, { x: 0, z: 0 })
    expect(g.decline().map((e) => e.kind)).toEqual(['declined'])
    expect(g.phase).toBe('idle')
    expect(g.accept()).toEqual([])
  })

  it('measures arrival to the footprint, not the centre', () => {
    const ring = sq(0, 0, 20)
    expect(distanceToRing(ring, 0, 0)).toBe(0)
    expect(distanceToRing(ring, 0, 35)).toBeCloseTo(15)
  })

  it('never offers a building no street reaches', () => {
    const w = town()
    const g = new Delivery({ ...w, streetDistance: () => 40 }, {}, 5)
    expect(tick(g, DEFAULTS.firstOffer + 1, { x: 0, z: 0 }).some((e) => e.kind === 'offer')).toBe(false)
    const ok = new Delivery({ ...w, streetDistance: () => 8 }, {}, 5)
    expect(tick(ok, DEFAULTS.firstOffer + 1, { x: 0, z: 0 }).some((e) => e.kind === 'offer')).toBe(true)
  })

  it('offers a long job across to a far place, and pins it to a building once one is in', () => {
    const world = town()
    // the far place's buildings are not loaded at first
    let loaded = false
    const far = { name: 'The Island', x: 5000, z: 0 }
    const w: DeliveryWorld = { ...world, buildingsNear: (x, z, r) => (x > 4000 ? (loaded ? [{ id: 999, ring: sq(5010, 10, 15) }] : []) : world.buildingsNear(x, z, r)) }
    const g = new Delivery(w, { crossings: [{ name: 'across', from: { x: 0, z: 0, r: 500 }, places: [far], chance: 1 }] }, 7)
    g.level = CROSSING_LEVEL   // (only offered at the top level)
    const offer = tick(g, DEFAULTS.firstOffer + 1, { x: 0, z: 0 }).find((e) => e.kind === 'offer')!
    expect(offer.job.dropoff.label).toBe('The Island')
    expect(offer.job.dropoff.far).toBe(true)
    expect(offer.job.metres).toBeGreaterThan(4500)
    g.accept()
    const p = offer.job.pickup
    tick(g, 1, { x: p.x, z: p.z })
    expect(g.phase).toBe('toDropoff')
    loaded = true
    const moved = tick(g, 1, { x: 1000, z: 0 }).find((e) => e.kind === 'stopMoved')
    expect(moved!.job.dropoff.buildingId).toBe(999)
    expect(moved!.job.dropoff.label).toBe('The Island')
  })
})

describe('kitchens, dishes and levels (owner, 2026-10-01)', () => {
  const kitchen = (over: Partial<Source> = {}): Source => ({
    id: 'k', name: 'The Test Kitchen', kind: 'test', blurb: 'it is a test', x: 230, z: 330,
    items: [{ name: 'ice cream', emoji: '🍦', blurb: 'melts', fragile: true }], ...over,
  })
  const at = { x: 200, z: 300 }

  it('picks up at the kitchen, by its name, with a dish from its menu', () => {
    const g = new Delivery(town(), { sources: [kitchen()] }, 4)
    const offer = tick(g, DEFAULTS.firstOffer + 1, at).find((e) => e.kind === 'offer')
    expect(offer).toBeTruthy()
    const job = offer!.job
    expect(job.source?.id).toBe('k')
    expect(job.item?.emoji).toBe('🍦')
    expect(job.pickup.label).toBe('The Test Kitchen')
    expect(Math.hypot(job.pickup.x - 230, job.pickup.z - 330)).toBeLessThan(60)
  })

  it('sends the drop-off as far as the level allows, and no further', () => {
    for (const level of [1, 3]) {
      for (let seed = 1; seed < 12; seed++) {
        const g = new Delivery(town(), { sources: [kitchen()] }, seed)
        g.level = level
        const job = tick(g, DEFAULTS.firstOffer + 1, at).find((e) => e.kind === 'offer')!.job
        const d = Math.hypot(job.dropoff.x - job.source!.x, job.dropoff.z - job.source!.z)
        expect(d).toBeLessThanOrEqual(DEFAULTS.levels[level - 1] + 30)
        expect(d).toBeGreaterThanOrEqual(DEFAULTS.levels[level - 1] / 3 - 30)
      }
    }
  })

  it('a collision spoils a fragile dish once it is picked up — not before, and not a sturdy one', () => {
    const g = new Delivery(town(), { sources: [kitchen()] }, 4)
    const job = tick(g, DEFAULTS.firstOffer + 1, at).find((e) => e.kind === 'offer')!.job
    g.accept()
    expect(g.collided()).toEqual([])                    // on the way to the kitchen: nothing to spill
    tick(g, 1, { x: job.pickup.x, z: job.pickup.z })
    expect(g.phase).toBe('toDropoff')
    expect(g.collided().map((e) => e.kind)).toEqual(['spoiled'])
    expect(g.phase).toBe('idle')

    const sturdy = new Delivery(town(), { sources: [kitchen({ items: [{ name: 'bagel', emoji: '🥯', blurb: 'sturdy' }] })] }, 4)
    const j2 = tick(sturdy, DEFAULTS.firstOffer + 1, at).find((e) => e.kind === 'offer')!.job
    sturdy.accept()
    tick(sturdy, 1, { x: j2.pickup.x, z: j2.pickup.z })
    expect(sturdy.collided()).toEqual([])
    expect(sturdy.phase).toBe('toDropoff')
  })

  it('without a kitchen in reach, the old building-to-building job', () => {
    const g = new Delivery(town(), { sources: [kitchen({ x: 9000, z: 9000 })] }, 4)
    const job = tick(g, DEFAULTS.firstOffer + 1, at).find((e) => e.kind === 'offer')!.job
    expect(job.source).toBeUndefined()
    expect(job.pickup.label).toMatch(/St & /)
  })
})

describe('the rating (2026-10-01)', () => {
  const job = { id: 1, pickup: {} as never, dropoff: {} as never, metres: 1000 }
  it('is five stars when quick and clean, fewer when slow, and loses a star a bump', () => {
    // expected: 1000·1.35/13 + 15 ≈ 119 s
    expect(rate(job, 80, 0, 1, 13, 0).stars).toBe(5)
    expect(rate(job, 130, 0, 1, 13, 0).stars).toBe(3)
    expect(rate(job, 400, 0, 1, 13, 0).stars).toBe(1)
    expect(rate(job, 80, 2, 1, 13, 0).stars).toBe(3)
    expect(rate(job, 80, 9, 1, 13, 0).stars).toBe(1)
  })
  it('offers no job across to the islands below the top level (owner, 2026-10-02)', () => {
    const g = new Delivery(town(), { crossings: [{ name: 'across', from: { x: 0, z: 0, r: 500 }, places: [{ name: 'The Island', x: 5000, z: 0 }], chance: 1 }] }, 7)
    g.level = 2
    const offer = tick(g, DEFAULTS.firstOffer + 1, { x: 0, z: 0 }).find((e) => e.kind === 'offer')
    expect(offer?.job.dropoff.label).not.toBe('The Island')
  })
  it('pays by distance and tips by stars, more at higher levels', () => {
    const a = rate(job, 80, 0, 1, 13, 0)
    expect(a.fee).toBe(5)
    expect(a.tip).toBe(4)
    expect(rate(job, 80, 0, 3, 13, 0).tip).toBeGreaterThan(a.tip)
    expect(rate(job, 400, 0, 1, 13, 0).tip).toBe(0)
    expect(a.line.length).toBeGreaterThan(0)
  })
})

describe("Paris's kitchens (owner, 2026-10-30: \"regionally appropriate\", \"a smattering of curry and bagels\")", () => {
  const FOREIGN = new Set(['indian', 'bagel', 'falafel', 'japanese', 'vietnamese', 'chinese', 'maghrebi'])
  const all = PARIS_KITCHENS.restaurants
  const names = all.flatMap((k) => k.items.map((i) => i.name)).join(' ')
  it('are mostly French, with the rest a smattering', () => {
    const foreign = all.filter((k) => FOREIGN.has(k.kind)).length
    expect(foreign).toBeGreaterThan(3)
    expect(foreign / all.length).toBeLessThan(0.35)
  })
  it('send out what the owner asked for', () => {
    for (const food of ['baguette', 'croissant', 'camembert', 'quiche', 'escargot', 'bouillabaisse', 'curry|vindaloo|butter chicken', 'bagel']) {
      expect(names).toMatch(new RegExp(food))
    }
  })
  it('have unique ids, and lie in the Paris box', () => {
    expect(new Set(all.map((k) => k.id)).size).toBe(all.length)
    for (const k of all) {
      expect(k.items.length).toBeGreaterThan(0)
      expect(k.lat).toBeGreaterThan(48.81); expect(k.lat).toBeLessThan(48.91)
      expect(k.lon).toBeGreaterThan(2.22); expect(k.lon).toBeLessThan(2.42)
    }
  })
})
