/**
 * The delivery game logic (src/game/delivery.ts), on a synthetic grid town: buildings on a 100 m grid of blocks,
 * intersections named "N<i> St & E<j> Ave".
 */
import { describe, expect, it } from 'vitest'
import { DEFAULTS, Delivery, distanceToRing, type DeliveryWorld } from '../src/game/delivery.ts'

const sq = (cx: number, cz: number, h: number): number[] => [cx - h, cz - h, cx + h, cz - h, cx + h, cz + h, cx - h, cz + h]

function town(): DeliveryWorld {
  const buildings: { id: number; ring: number[] }[] = []
  let id = 1
  for (let i = -15; i <= 15; i++) for (let j = -15; j <= 15; j++) buildings.push({ id: id++, ring: sq(i * 100 + 50, j * 100 + 50, 20) })
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
})
