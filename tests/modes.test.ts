/**
 * The three modes (src/modes.ts) and what they switch on: the energy bar (sim/energy.ts), the speedup
 * (sim/ride.ts), deliveries taken without an answer (game/delivery.ts `autoAccept`).
 */
import { describe, expect, it } from 'vitest'
import { chooseMode, MODES } from '../src/modes.ts'
import { Energy, ENERGY_DEFAULTS } from '../src/sim/energy.ts'
import { DEFAULTS as RIDE, Ride } from '../src/sim/ride.ts'
import { Delivery, DEFAULTS, type DeliveryWorld } from '../src/game/delivery.ts'

const watts = (power: number) => ({ power, speed: null, cadence: 85, heartRate: null })

describe('the modes', () => {
  it('Dandyhorse is the trainer; otherwise couch unless asked', () => {
    expect(chooseMode(null, true)).toBe('trainer')
    expect(chooseMode('debug', true)).toBe('trainer')
    expect(chooseMode(null, false)).toBe('couch')
    expect(chooseMode('debug', false)).toBe('debug')
    expect(chooseMode('nonsense', false)).toBe('couch')
  })

  it('couch has the energy bar and fast input; the trainer is slow input and takes its deliveries', () => {
    expect(MODES.couch).toMatchObject({ energy: true, input: 'fast', autoAccept: null })
    expect(MODES.trainer).toMatchObject({ energy: false, input: 'slow' })
    expect(MODES.trainer.autoAccept).toBeGreaterThan(0)
    expect(MODES.debug).toMatchObject({ energy: false, input: 'slow', speedup: 1, autoAccept: null })
    expect(MODES.couch.speedup).toBeGreaterThan(MODES.trainer.speedup)
  })
})

describe('the energy bar', () => {
  const run = (e: Energy, w: number, s: number) => { for (let t = 0; t < s; t += 0.1) e.spend(e.allowed(w), 0.1) }

  it('holds at the sustainable effort, drains above it and refills below', () => {
    const e = new Energy()
    run(e, ENERGY_DEFAULTS.sustainable, 60)
    expect(e.level).toBeCloseTo(1, 5)
    run(e, ENERGY_DEFAULTS.sustainable * 1.5, 30)
    expect(e.level).toBeCloseTo(1 - 30 / 90, 2)          // 300 W: a full bar lasts 90 s
    run(e, 100, 20)
    expect(e.level).toBeCloseTo(1 - 30 / 90 + 20 / 80, 2) // 100 W refills a full bar in 80 s
  })

  it('caps an empty rider until a quarter is back, then lets them go', () => {
    const e = new Energy()
    run(e, 400, 46)                                      // 400 W: empty in 45 s (then capped, so it creeps back)
    expect(e.level).toBeLessThan(0.02)
    expect(e.bonked).toBe(true)
    expect(e.allowed(500)).toBe(ENERGY_DEFAULTS.sustainable * ENERGY_DEFAULTS.bonkCap)
    run(e, 0, 5)
    expect(e.bonked).toBe(true)                          // 5 s of coasting is an eighth, not a quarter
    run(e, 0, 6)
    expect(e.bonked).toBe(false)
    expect(e.allowed(500)).toBe(500)
  })
})

describe('the speedup', () => {
  it('covers k times the ground at the same watts, on the flat (under the top speed)', () => {
    const a = new Ride(), b = new Ride()
    b.speedup = 2
    let va = 0, vb = 0
    for (let i = 0; i < 600; i++) {
      va = a.step(0.1, watts(100), 'bike', 'asphalt', 0).speed
      vb = b.step(0.1, watts(100), 'bike', 'asphalt', 0).speed
    }
    expect(vb).toBeCloseTo(va * 2, 5)
  })

  it('eases off above the top speed in the world: a hard sprint or a steep descent settles, it does not run away', () => {
    const settle = (w: number, grade: number, surface = 'asphalt', foot = false): number => {
      const r = new Ride()
      r.speedup = 2
      let v = 0
      for (let i = 0; i < 3000; i++) v = r.step(0.1, watts(w), 'bike', surface, grade, Infinity, Infinity, null, foot).speed
      return v
    }
    const top = RIDE.topSpeed + RIDE.topBand
    expect(settle(700, 0)).toBeLessThan(top)
    expect(settle(150, -0.1)).toBeLessThan(top)
    // …a harder effort is still a little faster
    expect(settle(700, 0)).toBeGreaterThan(settle(150, 0))
    // and a rough surface or a path is slower than the road
    expect(settle(250, 0, 'cobblestone')).toBeLessThan(settle(250, 0) * 0.75)
    expect(settle(250, 0, 'asphalt', true)).toBeLessThan(settle(250, 0) * 0.75)
  })

  it('still takes a corner at the world speed it can hold, and never passes through the car ahead', () => {
    const r = new Ride()
    r.speedup = 2
    for (let i = 0; i < 600; i++) r.step(0.1, watts(400), 'bike', 'asphalt', 0)
    // a 10 m bend just ahead: held to √(a·r) in the world, whatever the speedup
    let v = 0
    for (let i = 0; i < 400; i++) v = r.step(0.1, watts(400), 'bike', 'asphalt', 0, 10, 2).speed
    expect(v).toBeLessThanOrEqual(Math.sqrt(2.6 * 10) + 0.5)
    // a car 1 m ahead at 4 m/s: no faster than it
    for (let i = 0; i < 50; i++) v = r.step(0.1, watts(400), 'bike', 'asphalt', 0, Infinity, Infinity, { speed: 4, gap: 0.3 }).speed
    expect(v).toBeLessThanOrEqual(4 + 1e-9)
  })
})

describe('deliveries taken without an answer (the trainer)', () => {
  const world = (): DeliveryWorld => {
    const blocks: { id: number; ring: number[]; height: number; baseY: number }[] = []
    for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
      const x = i * 60, z = j * 60
      blocks.push({ id: blocks.length + 1, ring: [x, z, x + 20, z, x + 20, z + 20, x, z + 20], height: 10, baseY: 0 })
    }
    return {
      buildingsNear: (x, z, r) => blocks.filter((b) => Math.hypot(b.ring[0] - x, b.ring[1] - z) <= r),
      streetDistance: () => 5,
      junctionNear: (x, z) => ({ name: `N${Math.round(x / 60)} St & E${Math.round(z / 60)} Ave`, d: 10 }),
    }
  }

  it('is taken after `autoAccept` seconds rather than going away', () => {
    const g = new Delivery(world(), { autoAccept: 12 }, 5)
    const all: string[] = []
    for (let t = 0; t < DEFAULTS.firstOffer + 14; t += 0.5) all.push(...g.update(0.5, { x: 0, z: 0 }).map((e) => e.kind))
    expect(all).toEqual(['offer', 'accepted'])
    expect(g.phase).toBe('toPickup')
  })
})
