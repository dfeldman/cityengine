/**
 * The traffic (src/sim/traffic.ts) and the junction rules (src/sim/signals.ts), run headless on a crossroads.
 */
import { describe, expect, it } from 'vitest'
import { buildGraph, type Edge } from '../src/city/graph.ts'
import { CYCLE, GREEN, Signals } from '../src/sim/signals.ts'
import { Traffic, type RiderNow } from '../src/sim/traffic.ts'
import { SIZE, boxOf, overlap } from '../src/sim/collide.ts'

/**
 * A crossroads at the origin, four arms, `width` wide. The arms run out past the traffic's range (400 m against
 * 230 m) so traffic has somewhere to go, as it does in a city: with 180 m dead-end arms every car had to turn round
 * at the end, the outbound streets backed up, and "don't block the junction" (rightly) held the lights' queues.
 */
function crossroads(width = 9, length = 400): ReturnType<typeof buildGraph> {
  const arm = (id: number, to: number, x: number, z: number): Edge => ({
    id, a: 0, b: to, points: [{ x: 0, z: 0 }, { x, z }], length, surface: 'asphalt', width, walk: 2, foot: false,
  })
  return buildGraph([arm(1, 1, 0, length), arm(2, 2, length, 0), arm(3, 3, 0, -length), arm(4, 4, -length, 0)])
}

function run(lit: boolean, seconds: number, rider?: RiderNow, width = 9) {
  const g = crossroads(width)
  const signals = new Signals(g, (id) => lit && id === 0)
  const traffic = new Traffic(g, 'dense', { signals })
  const edges = [...g.edges.values()]
  let worstOverlap = 0
  // the known approximation: two cars from the SAME approach, one turning, clip at the corner, because a car
  // rounds a corner through the junction's centre point rather than along an arc (to come with better cars)
  let cornerClips = 0
  let frames = 0
  let crossed = 0
  const waitingSince = new Map<number, number>()
  let longestWait = 0
  let last = new Map<number, number>()
  const hits: number[] = []
  const through = new Set<number>()
  const seen = new Set<number>()
  // cars that appeared or vanished where the rider (at the centre, or `rider`) could see: must stay zero
  let poppedInView = 0
  let prevPos = new Map<number, { x: number; z: number }>()
  for (let t = 0; t < seconds; t += 0.05) {
    const got = traffic.update(0.05, rider ?? { x: 0, z: 0 }, edges)
    hits.push(...got.map((h) => h.vehicle.id))
    const vs = traffic.all
    frames++
    for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) {
      if (!overlap(traffic.boxOf(vs[i]), traffic.boxOf(vs[j]))) continue
      const a = vs[i].inBox
      const b = vs[j].inBox
      const near = Math.hypot(vs[i].at.x, vs[i].at.z) < 8 && Math.hypot(vs[j].at.x, vs[j].at.z) < 8
      if (near && (!a || !b || a.from === b.from)) cornerClips++
      else worstOverlap++
    }
    for (const v of vs) { seen.add(v.id); if (v.inBox) through.add(v.id) }
    const eye = rider?.at ?? { x: 0, z: 0 }
    if (t > 2) {
      const nowIds = new Set(vs.map((v) => v.id))
      for (const v of vs) if (!prevPos.has(v.id) && Math.hypot(v.at.x - eye.x, v.at.z - eye.z) < 200) poppedInView++
      for (const [id, p] of prevPos) if (!nowIds.has(id) && Math.hypot(p.x - eye.x, p.z - eye.z) < 200) poppedInView++
    }
    prevPos = new Map(vs.map((v) => [v.id, { ...v.at }]))
    const now = new Map(vs.map((v) => [v.id, v.edgeId]))
    for (const [id, e] of now) if (last.has(id) && last.get(id) !== e) crossed++
    last = now
    // how long anyone has stood still near the junction
    for (const v of vs) {
      const near = Math.hypot(v.at.x, v.at.z) < 40
      if (near && v.speed < 0.3) {
        if (!waitingSince.has(v.id)) waitingSince.set(v.id, t)
        longestWait = Math.max(longestWait, t - waitingSince.get(v.id)!)
      } else waitingSince.delete(v.id)
    }
  }
  return { signals, worstOverlap, cornerClips, frames, crossed, longestWait, hits, traffic, through: through.size, seen: seen.size, poppedInView }
}

describe('junction control', () => {
  it('alternates the two directions at a light, with an all-red gap, and nobody waits a full cycle', () => {
    const g = crossroads()
    const s = new Signals(g, () => true)
    const c = s.control(0)
    expect(c.kind).toBe('lights')
    expect(c.group.get(1)).toBe(c.group.get(3))   // north and south go together
    expect(c.group.get(2)).toBe(c.group.get(4))
    expect(c.group.get(1)).not.toBe(c.group.get(2))
    for (let t = 0; t < 2 * CYCLE; t += 0.5) {
      // never both green
      expect(s.aspect(0, 1, t) === 'green' && s.aspect(0, 2, t) === 'green').toBe(false)
      // the longest wait is from the start of your own amber to your next green: the rest of the cycle
      expect(s.waitFor(0, 1, t)).toBeLessThanOrEqual(CYCLE - GREEN + 0.25)
    }
  })

  it('makes an unlit crossroads of equal streets an all-way stop, and a clearly bigger road a two-way stop', () => {
    expect(new Signals(crossroads(), () => false).control(0).kind).toBe('stop4')
    const g = buildGraph([
      { id: 1, a: 0, b: 1, points: [{ x: 0, z: 0 }, { x: 0, z: 100 }], length: 100, surface: 'asphalt', width: 14, walk: 2, foot: false },
      { id: 3, a: 0, b: 3, points: [{ x: 0, z: 0 }, { x: 0, z: -100 }], length: 100, surface: 'asphalt', width: 14, walk: 2, foot: false },
      { id: 2, a: 0, b: 2, points: [{ x: 0, z: 0 }, { x: 100, z: 0 }], length: 100, surface: 'asphalt', width: 6, walk: 1.5, foot: false },
    ])
    const c = new Signals(g, () => false).control(0)
    expect(c.kind).toBe('stop2')
    expect([...c.major].sort()).toEqual([1, 3])
  })
})

describe('the traffic, headless', () => {
  for (const [lit, width] of [[true, 9], [false, 9], [true, 6], [false, 6], [true, 14], [false, 14]] as const) {
    it(`keeps moving through a ${lit ? 'signalled crossroads' : 'four-way stop'} of ${width} m streets with no cars overlapping`, () => {
      const r = run(lit, 200, undefined, width)
      expect(r.traffic.all.length).toBeGreaterThan(10)
      expect(r.worstOverlap).toBe(0)
      expect(r.cornerClips / r.frames).toBeLessThan(0.01)
      // the traffic keeps flowing: many vehicles through the junction, and vehicles retiring (more seen than alive)
      // (a single lane each way: a left-turner yielding to oncoming traffic holds the cars behind it until the
      // amber, which is what real single-lane junctions do — measured 36 through the lights, 40+ at the stop)
      // (an all-way stop is slow by nature: each car starts from standing and crosses a ~21 m path before a
      // conflicting car may go — measured 25–28 through in 200 s with IDM drivers, about one every 7 s)
      expect(r.through).toBeGreaterThan(lit ? 30 : 20)
      // cars never appear or disappear in view (owner, 2026-09-29) — at a dead end they turn round instead
      expect(r.poppedInView).toBe(0)
      // nobody waits forever: a light's wait is under a cycle; a stop's queue clears
      expect(r.longestWait).toBeLessThan(lit ? CYCLE + 10 : 60)
    }, 60_000)   // 200 simulated seconds of a busy crossroads: ~5 s of work, more under load
  }

  it('never drives into a rider standing in the junction', () => {
    const box = boxOf(0, 0, 0, SIZE.bike)
    const rider: RiderNow = { at: { x: 0, z: 0 }, heading: 0, speed: 0, edgeId: 3, s: 0.5, dir: -1, grade: 0, box }
    const r = run(true, 120, rider)
    expect(r.hits).toEqual([])
  }, 60_000)
})

describe('weaving past stopped traffic (Traffic.weave)', () => {
  // a single long street along +z, the rider heading north at the centre line
  const street = (width: number) => buildGraph([{ id: 1, a: 0, b: 1, points: [{ x: 0, z: 0 }, { x: 0, z: 400 }], length: 400, surface: 'asphalt', width, walk: 2, foot: false }])
  const rider = (): RiderNow => ({ at: { x: 0, z: 100 }, heading: 0, speed: 5, edgeId: 1, s: 100, dir: 1, grade: 0, box: boxOf(0, 100, 0, SIZE.bike) })
  const park = (t: Traffic, x: number, z: number, speed = 0): void => {
    ;(t.all as unknown as Record<string, unknown>[]).push({ id: 900 + t.all.length, kind: 'car', edgeId: 1, s: z, dir: 1, speed, cruise: 5, lane: x, colour: [1, 1, 1], waiting: true, at: { x, z }, heading: 0, driver: { a: 1.5, b: 2, T: 1.2, s0: 2 } })
  }

  it('steers round a stopped car dead ahead, to the nearer side', () => {
    const t = new Traffic(street(14), 'dense')
    park(t, 0.4, 110)   // a little right of the centre line
    const shift = t.weave(rider(), -6, 6)
    expect(shift).not.toBeNull()
    expect(shift!).toBeLessThan(0)          // the car sits right: the gap on the left is nearer
    expect(Math.abs(shift!)).toBeGreaterThan(1)   // the car's near side (−0.55) plus 0.5 m: half the bike and 0.2 m of air
    // and along that strip the rider is not held by it
    expect(t.leaderFor(rider(), shift!)).toBeNull()
    expect(t.leaderFor(rider(), 0)).not.toBeNull()
  })

  it('finds no way through a street blocked kerb to kerb, and holds the rider', () => {
    const t = new Traffic(street(6), 'dense')
    park(t, -1.3, 110)
    park(t, 1.3, 111)
    expect(t.weave(rider(), -2.2, 2.2)).toBeNull()
  })

  it('does not weave round a car driving away, but does round one crawling', () => {
    const t = new Traffic(street(14), 'dense')
    park(t, 0, 110, 8)
    expect(t.weave(rider(), -6, 6)).toBe(0)
    const c = new Traffic(street(14), 'dense')
    park(c, 0, 110, 3)
    expect(c.weave(rider(), -6, 6)).not.toBe(0)
  })

  it('keeps right when it can: an open road takes the rider to the right-hand side it prefers', () => {
    const t = new Traffic(street(14), 'dense')
    expect(t.weave(rider(), -6, 6, 5.8)).toBeCloseTo(5.8)
  })

  it('pulls out round a car standing on the right, and no further than it must', () => {
    const t = new Traffic(street(14), 'dense')
    park(t, 5, 110)   // on the right-hand side, 10 m ahead (its left flank at 4.05)
    const shift = t.weave(rider(), -6, 6, 5.8)!
    // not behind it on the right, and not far across: just outside its left flank (4.05 − 0.5 of bike and air)
    expect(shift).toBeLessThan(4.05 - 0.49)
    expect(shift).toBeGreaterThan(2.5)
  })

  it('filters down the centre line between two stopped lanes of a 9 m street', () => {
    const t = new Traffic(street(9), 'dense')
    park(t, 1.7, 110)    // the rider's lane…
    park(t, -1.7, 114)   // …and the oncoming one, standing: 1.5 m between them
    const shift = t.weave(rider(), -3.7, 3.7)
    expect(shift).not.toBeNull()
    expect(t.leaderFor(rider(), shift!)).toBeNull()
  })
})

