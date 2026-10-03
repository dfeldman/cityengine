/**
 * Steering and movement. The turn-resolution tests are the ones to keep passing: they are the difference
 * between a rider who goes where they asked and one who does not, and no screenshot shows it.
 */
import { describe, expect, it } from 'vitest'
import { buildGraph, exits, resolve, type Edge } from '../src/city/graph.ts'
import { COMMIT_MIN_METRES, Navigator, polylineLength } from '../src/sim/navigate.ts'
import { Ride, cornerRadius } from '../src/sim/ride.ts'
import { NO_READING } from '../src/controls.ts'

/**
 * A plus-shaped crossroads centred on node 0, with arms 100 m long running north, east, south and west.
 * Node 1 is north, 2 east, 3 south, 4 west; every edge runs outward from the centre.
 */
function crossroads(): ReturnType<typeof buildGraph> {
  const arm = (id: number, to: number, x: number, z: number): Edge => ({
    id, a: 0, b: to,
    points: [{ x: 0, z: 0 }, { x, z }],
    length: 100, surface: 'asphalt', width: 7, walk: 1.8, foot: false,
    name: ['', 'North St', 'East St', 'South St', 'West St'][to],
  })
  return buildGraph([
    arm(1, 1, 0, 100), arm(2, 2, 100, 0), arm(3, 3, 0, -100), arm(4, 4, -100, 0),
  ])
}

describe('turns at a junction', () => {
  it('names left, straight and right from the direction of travel', () => {
    const g = crossroads()
    // arriving at the centre along the south arm means travelling north
    const xs = exits(g, 0, 3)
    const byEdge = new Map(xs.map((x) => [x.edgeId, x.turn]))
    expect(byEdge.get(1)).toBe('straight')  // north arm: straight on
    expect(byEdge.get(4)).toBe('left')      // west arm: to the left
    expect(byEdge.get(2)).toBe('right')     // east arm: to the right
  })

  it('never offers a U-turn back down the street just ridden', () => {
    const g = crossroads()
    for (const arrived of [1, 2, 3, 4]) {
      expect(exits(g, 0, arrived).map((e) => e.edgeId)).not.toContain(arrived)
    }
  })

  it('rotates with the rider — what is left depends entirely on which way they came', () => {
    const g = crossroads()
    const leftFrom = (arrived: number) =>
      exits(g, 0, arrived).find((e) => e.turn === 'left')!.edgeId
    expect(leftFrom(3)).toBe(4)   // heading north, left is west
    expect(leftFrom(4)).toBe(1)   // heading east, left is north
    expect(leftFrom(1)).toBe(2)   // heading south, left is east
    expect(leftFrom(2)).toBe(3)   // heading west, left is south
  })

  it('falls back to the straightest exit when the junction cannot honour the request', () => {
    // a T: arriving from the south with only east and west available
    const g = buildGraph([
      { id: 1, a: 0, b: 1, points: [{ x: 0, z: 0 }, { x: 0, z: -100 }], length: 100, surface: 'asphalt', width: 7, walk: 1.8, foot: false },
      { id: 2, a: 0, b: 2, points: [{ x: 0, z: 0 }, { x: 100, z: 0 }], length: 100, surface: 'asphalt', width: 7, walk: 1.8, foot: false },
    ])
    const xs = exits(g, 0, 1)
    expect(resolve(xs, 'left')).not.toBeNull()
    expect(resolve(xs, 'left')!.edgeId).toBe(2)     // only one way to go, so it is taken
    expect(resolve(xs, 'straight')!.edgeId).toBe(2)
  })

  it('prefers the squarest turn when a junction offers two lefts', () => {
    const g = buildGraph([
      { id: 1, a: 0, b: 1, points: [{ x: 0, z: 0 }, { x: 0, z: -100 }], length: 100, surface: 'asphalt', width: 7, walk: 1.8, foot: false },
      { id: 2, a: 0, b: 2, points: [{ x: 0, z: 0 }, { x: -100, z: 0 }], length: 100, surface: 'asphalt', width: 7, walk: 1.8, foot: false },
      { id: 3, a: 0, b: 3, points: [{ x: 0, z: 0 }, { x: -70, z: 70 }], length: 99, surface: 'asphalt', width: 7, walk: 1.8, foot: false },
    ])
    const xs = exits(g, 0, 1)
    expect(xs.filter((e) => e.turn === 'left')).toHaveLength(2)
    expect(resolve(xs, 'left')!.edgeId).toBe(2)   // the square one, not the oblique one
  })
})

describe('the navigator', () => {
  it('carries straight on when the rider touches nothing', () => {
    const g = crossroads()
    const n = new Navigator(g, { edgeId: 3, s: 100, reversed: true }) // on the south arm, heading in
    n.advance(150, 8)
    expect(n.position.edgeId).toBe(1)   // came out on the north arm
  })

  it('turns where asked, and spends the request on one junction only', () => {
    const g = crossroads()
    const n = new Navigator(g, { edgeId: 3, s: 100, reversed: true })
    n.request('left')
    n.advance(150, 8)
    expect(n.position.edgeId).toBe(4)   // went west
    expect(n.requested).toBe('straight') // and the request did not persist to the next junction
  })

  it('latches the choice inside the commit distance so it cannot flip under the rider', () => {
    const g = crossroads()
    const n = new Navigator(g, { edgeId: 3, s: 100, reversed: true })
    n.request('left')
    n.advance(100 - COMMIT_MIN_METRES / 2, 1)   // now inside the commit distance
    expect(n.isCommitted).toBe(true)
    n.request('right')                          // too late for this junction
    n.advance(20, 1)
    expect(n.position.edgeId).toBe(4)           // still went left, as committed
  })

  it('applies a late press to the next junction rather than dropping it', () => {
    const g = crossroads()
    const n = new Navigator(g, { edgeId: 3, s: 100, reversed: true })
    n.advance(99, 1)          // committed to straight
    n.request('left')         // too late for this junction
    n.advance(2, 1)           // so it crosses straight on, as committed
    expect(n.position.edgeId).toBe(1)
    expect(n.requested).toBe('left')  // …and the press carries to the next junction rather than being lost
  })

  it('puts the rider at the junction they just crossed, not at the far end of the new street', () => {
    // The bug this pins made every other turn teleport the rider past the corner and back down the street
    // they had just left, because `s` was being mirrored on edges travelled b→a.
    const g = crossroads()
    const n = new Navigator(g, { edgeId: 3, s: 100, reversed: true })
    n.request('left')
    n.advance(100, 8)                     // arrives exactly at the centre and turns west
    const at = n.at()
    expect(Math.hypot(at.x, at.z)).toBeLessThan(1)   // at the junction, not 100 m away
    n.advance(10, 8)
    const then = n.at()
    expect(then.x).toBeLessThan(-5)       // and now heading west, away from it
    expect(Math.abs(then.z)).toBeLessThan(1)
  })

  it('turns round at a dead end rather than stopping dead', () => {
    const g = buildGraph([
      { id: 1, a: 0, b: 1, points: [{ x: 0, z: 0 }, { x: 0, z: 100 }], length: 100, surface: 'asphalt', width: 7, walk: 1.8, foot: false },
    ])
    const n = new Navigator(g, { edgeId: 1, s: 0, reversed: false })
    n.advance(120, 8)
    expect(n.position.reversed).toBe(true)
  })

  it('reports how far the next junction is and which turns it offers', () => {
    const g = crossroads()
    const n = new Navigator(g, { edgeId: 3, s: 100, reversed: true })
    n.advance(40, 8)
    const j = n.next()!
    expect(j.ahead).toBeCloseTo(60)
    expect([...j.turns].sort()).toEqual(['left', 'right', 'straight'])
    expect(j.names.left).toBe('West St')
  })

  it('measures a polyline the same way the graph does', () => {
    expect(polylineLength([{ x: 0, z: 0 }, { x: 3, z: 4 }, { x: 3, z: 14 }])).toBeCloseTo(15)
  })
})

describe('riding', () => {
  it('coasts on a bike: no power, but the bike keeps rolling', () => {
    const r = new Ride()
    for (let i = 0; i < 100; i++) r.step(0.1, { ...NO_READING, power: 200 }, 'bike', 'asphalt', 0)
    const moving = r.speed
    expect(moving).toBeGreaterThan(5)
    const after = r.step(0.1, { ...NO_READING, power: 0 }, 'bike', 'asphalt', 0)
    expect(after.speed).toBeGreaterThan(moving * 0.9)  // still rolling
    expect(after.coasting).toBe(true)
  })

  // (Until 2026-09-29 this was "speeds up COASTING downhill": zero power coasted. The bike has brakes now —
  // zero power brakes (sim/ride.ts) — so rolling downhill means pedalling, however lightly.)
  it('speeds up soft-pedalling downhill and slows uphill', () => {
    const down = new Ride()
    const up = new Ride()
    for (let i = 0; i < 20; i++) down.step(0.1, { ...NO_READING, power: 150 }, 'bike', 'asphalt', 0)
    for (let i = 0; i < 20; i++) up.step(0.1, { ...NO_READING, power: 150 }, 'bike', 'asphalt', 0)
    const v0 = down.speed
    for (let i = 0; i < 30; i++) down.step(0.1, { ...NO_READING, power: 20 }, 'bike', 'asphalt', -0.06)
    for (let i = 0; i < 30; i++) up.step(0.1, { ...NO_READING, power: 20 }, 'bike', 'asphalt', 0.06)
    expect(down.speed).toBeGreaterThan(v0)
    expect(up.speed).toBeLessThan(v0)
  })

  it('brakes to a stop when the rider stops pedalling, even on a steep descent (owner, 2026-09-29)', () => {
    const r = new Ride()
    for (let i = 0; i < 200; i++) r.step(0.1, { ...NO_READING, power: 250 }, 'bike', 'asphalt', -0.15)
    expect(r.speed).toBeGreaterThan(10)
    let braking = false
    for (let i = 0; i < 150; i++) braking = r.step(0.1, { ...NO_READING, power: 0 }, 'bike', 'asphalt', -0.15).braking || braking
    expect(braking).toBe(true)
    expect(r.speed).toBeLessThan(0.5)
  })

  it('reverses: stopped, negative power backs up slowly; moving, it only brakes (owner, 2026-10-01)', () => {
    const r = new Ride()
    for (let i = 0; i < 100; i++) r.step(0.1, { ...NO_READING, power: 200 }, 'bike', 'asphalt', 0)
    const first = r.step(0.1, { ...NO_READING, power: -45 }, 'bike', 'asphalt', 0)
    expect(first.reverse ?? 0).toBe(0)                 // still rolling forward: the brake, not reverse
    let s = first
    for (let i = 0; i < 100; i++) s = r.step(0.1, { ...NO_READING, power: -45 }, 'bike', 'asphalt', 0.05)
    expect(s.speed).toBe(0)
    expect(s.reverse).toBeGreaterThan(0.8)
    expect(s.reverse).toBeLessThan(1.2)
    for (let i = 0; i < 20; i++) s = r.step(0.1, { ...NO_READING, power: 100 }, 'bike', 'asphalt', 0)
    expect(s.reverse ?? 0).toBe(0)
  })

  it('gives a runner nothing for free: the belt is the speed, downhill or not', () => {
    const r = new Ride()
    for (let i = 0; i < 60; i++) r.step(0.1, { ...NO_READING, speed: 3.2 }, 'treadmill', 'asphalt', -0.1)
    expect(r.speed).toBeCloseTo(3.2, 1)
    for (let i = 0; i < 60; i++) r.step(0.1, { ...NO_READING, speed: 0 }, 'treadmill', 'asphalt', -0.1)
    expect(r.speed).toBeLessThan(0.1)   // stopped, on a descent
  })

  it('brakes for a corner, and only ever downward', () => {
    const r = new Ride()
    for (let i = 0; i < 200; i++) r.step(0.1, { ...NO_READING, power: 320 }, 'bike', 'asphalt', 0)
    const fast = r.speed
    expect(fast).toBeGreaterThan(9)
    let s = r.step(0.1, { ...NO_READING, power: 320 }, 'bike', 'asphalt', 0, cornerRadius(Math.PI / 2), 5)
    expect(s.braking).toBe(true)
    expect(s.speed).toBeLessThan(fast)
    // and a straight never brakes
    s = r.step(0.1, { ...NO_READING, power: 320 }, 'bike', 'asphalt', 0, Infinity, Infinity)
    expect(s.braking).toBe(false)
  })

  it('rolls slower on cobbles than on asphalt for the same watts', () => {
    const smooth = new Ride()
    const rough = new Ride()
    for (let i = 0; i < 300; i++) {
      smooth.step(0.1, { ...NO_READING, power: 200 }, 'bike', 'asphalt', 0)
      rough.step(0.1, { ...NO_READING, power: 200 }, 'bike', 'cobblestone', 0)
    }
    expect(rough.speed).toBeLessThan(smooth.speed)
  })
})

describe('dead ends', () => {
  it('announces one before the rider gets there, and turns them round rather than stopping them', () => {
    const g = buildGraph([
      { id: 1, a: 0, b: 1, points: [{ x: 0, z: 0 }, { x: 0, z: 100 }], length: 100, surface: 'asphalt', width: 7, walk: 1.8, foot: false, name: 'Cul-de-sac' },
    ])
    const n = new Navigator(g, { edgeId: 1, s: 0, reversed: false })
    n.advance(60, 8)
    const j = n.next()!
    expect(j.deadEnd, 'the junction ahead has nowhere to go').toBe(true)
    expect(j.ahead).toBeCloseTo(40)
    expect(j.turns.size).toBe(0)

    n.advance(50, 8)
    expect(n.position.reversed, 'the rider turned round').toBe(true)
    expect(n.turnedAroundAt).toBe(1)
    // and is now heading back down the same street rather than sitting at the end of it
    n.advance(20, 8)
    expect(n.at().z).toBeLessThan(85)
  })

  it('does not call an ordinary junction a dead end', () => {
    const g = crossroads()
    const n = new Navigator(g, { edgeId: 3, s: 100, reversed: true })
    expect(n.next()!.deadEnd).toBe(false)
  })
})

// KEEP RIGHT (owner, 2026-09-29: "the bike should stay to the right of the road, not the center"), 1.2 m in from the
// kerb: on these 7 m streets, 3.5 − 1.2 = 2.3 m right of the line. (Down the middle from 2026-09-21 until then.)
const HOME = 7 / 2 - 1.2

describe('which side of the road', () => {
  it('rides on the right, whichever way it is going', () => {
    const g = crossroads()
    const north = new Navigator(g, { edgeId: 1, s: 10, reversed: false })
    north.advance(20, 5)
    // heading north, right is east
    expect(north.ridePoint().x - north.at().x).toBeCloseTo(HOME)
    const south = new Navigator(g, { edgeId: 1, s: 90, reversed: true })
    south.advance(20, 5)
    expect(south.ridePoint().x - south.at().x).toBeCloseTo(-HOME)
  })

  it('crosses to the new right through a U-turn — smoothly, never in a jump', () => {
    const g = crossroads()
    const n = new Navigator(g, { edgeId: 1, s: 30, reversed: false })
    n.advance(20, 5)
    n.turnAround()
    let prev = n.ridePoint().x - n.at().x
    for (let i = 0; i < 30; i++) {
      n.advance(1, 5)
      const x = n.ridePoint().x - n.at().x
      expect(Math.abs(x - prev), `metre ${i}`).toBeLessThan(0.8)
      prev = x
    }
    // now heading south, whose right is west
    expect(prev).toBeCloseTo(-HOME, 1)
  })
})

describe('rounded corners', () => {
  // A bike turns on an arc. The arc is a VIEW on the graph position — `at()` is untouched — so these only
  // look at `smoothed()`.
  const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a))

  it('takes a right angle smoothly, leaning, and never strays far from the street', () => {
    const g = crossroads()
    const n = new Navigator(g, { edgeId: 3, s: 100, reversed: true })   // heading north towards the centre
    n.request('right')
    let prev = n.smoothed().heading
    let leaned = 0
    let onArc = 0
    // 150 m: through the corner and well down the east arm, short of its dead end (a U-turn is not a corner)
    for (let i = 0; i < 300; i++) {
      n.advance(0.5, 4.2)   // 15 km/h
      const sm = n.smoothed()
      expect(Math.abs(wrap(sm.heading - prev)), `step ${i}`).toBeLessThan(0.35)
      prev = sm.heading
      const at = n.at()
      expect(Math.hypot(sm.point.x - at.x, sm.point.z - at.z)).toBeLessThan(cornerRadius(Math.PI / 2))
      if (sm.lean !== 0) { onArc++; leaned = Math.min(leaned, sm.lean) }
    }
    expect(n.position.edgeId).toBe(2)          // went east
    expect(onArc * 0.5, 'metres ridden on the arc').toBeGreaterThanOrEqual(6)
    expect(leaned, 'leaning right, into the corner').toBeLessThan(0)
  })

  it('is the rider\'s own line on a straight, upright', () => {
    const g = crossroads()
    const n = new Navigator(g, { edgeId: 1, s: 10, reversed: false })
    n.advance(20, 5)
    const sm = n.smoothed()
    expect(sm.point.x).toBeCloseTo(n.at().x + HOME)
    expect(sm.point.z).toBeCloseTo(n.at().z)
    expect(sm.lean).toBe(0)
  })
})

describe('lateral freedom', () => {
  const offLine = (n: Navigator): number => {
    const a = n.at()
    const r = n.ridePoint()
    return Math.hypot(r.x - a.x, r.z - a.z)
  }

  it('never nudges the rider out of the carriageway, however often they press', () => {
    const g = crossroads()                          // 7 m carriageways
    const n = new Navigator(g, { edgeId: 3, s: 100, reversed: true })
    for (let i = 0; i < 10; i++) n.nudge(1)
    for (let i = 0; i < 40; i++) {
      n.advance(1, 5)
      expect(offLine(n)).toBeLessThanOrEqual(7 / 2 - 0.8 + 1e-9)
    }
    expect(offLine(n)).toBeGreaterThan(2)            // it did drift
  })

  // (Until 2026-09-29 the rider went back to the line before EVERY junction, which undid nearly every nudge on short
  // blocks — the owner: "nudging also doesn't actually work a lot of the time". Now only a turn re-centres.)
  it('is back on the line by the time the rider reaches a junction they are turning at', () => {
    const g = crossroads()
    const n = new Navigator(g, { edgeId: 3, s: 100, reversed: true })
    n.nudge(-1)
    n.advance(40, 5)
    expect(offLine(n)).toBeGreaterThan(1)
    n.request('left')
    for (let i = 0; i < 118; i++) n.advance(0.5, 5)  // up to a metre short of the centre
    expect(offLine(n)).toBeLessThan(0.05)
  })

  it('stays where it was nudged a moment, then goes back to the right — not to the middle', () => {
    const g = crossroads()
    const n = new Navigator(g, { edgeId: 3, s: 100, reversed: true })
    for (let i = 0; i < 20; i++) n.advance(1, 5)       // settled on the right: heading north, right is east
    n.nudge(-1)
    for (let i = 0; i < 5; i++) n.advance(1, 5)        // 1 s: moved 1.5 m left
    const nudged = n.ridePoint().x - n.at().x
    expect(nudged).toBeCloseTo(HOME - 1.5, 1)
    for (let i = 0; i < 4; i++) n.advance(1, 5)        // still inside the 2 s
    expect(n.ridePoint().x - n.at().x).toBeCloseTo(nudged, 5)
    for (let i = 0; i < 30; i++) n.advance(1, 5)       // then home, straight on through the junction
    expect(n.ridePoint().x - n.at().x).toBeCloseTo(HOME, 1)
  })

  it('backs up round the corner into the street behind, still facing the same way (owner, 2026-10-02)', () => {
    const g = crossroads()
    // riding south down the south arm, 2 m past the crossroads: backing 5 m goes 3 m up the north arm
    const n = new Navigator(g, { edgeId: 3, s: 2, reversed: false })
    const h0 = n.heading()
    const p0 = n.at()
    n.backUp(5)
    expect(n.position.edgeId).toBe(1)
    expect(Math.hypot(n.at().x - p0.x, n.at().z - p0.z)).toBeCloseTo(5, 0)
    expect(Math.cos(n.heading() - h0)).toBeGreaterThan(0.9)
  })

  it('edges sideways slowly at a standstill — round a stopped car, never through it (owner, 2026-10-02)', () => {
    const g = crossroads()
    const n = new Navigator(g, { edgeId: 3, s: 100, reversed: true })
    n.fast = true
    for (let i = 0; i < 20; i++) n.advance(1, 5)
    const s0 = n.at()
    const o0 = n.nudged
    n.hold(-1)
    for (let i = 0; i < 10; i++) n.sidestep(0.1)    // 1 s held left, stopped
    expect(o0 - n.nudged).toBeCloseTo(0.6, 2)        // a walking shuffle across
    expect(n.at()).toEqual(s0)                       // and not a centimetre along
    n.fence(o0 - 0.3, null)                          // a car beside, on the left: no further
    for (let i = 0; i < 30; i++) n.sidestep(0.1)
    expect(n.nudged).toBeGreaterThanOrEqual(o0 - 0.6 - 1e-6)
  })

  it('moves to the middle for a left turn, and stays right for a right one', () => {
    const g = crossroads()
    const left = new Navigator(g, { edgeId: 3, s: 100, reversed: true })
    left.request('left')
    for (let i = 0; i < 188; i++) left.advance(0.5, 5)  // a metre short of the centre
    expect(offLine(left)).toBeLessThan(0.05)
    const right = new Navigator(g, { edgeId: 3, s: 100, reversed: true })
    right.request('right')
    for (let i = 0; i < 188; i++) right.advance(0.5, 5)
    expect(offLine(right)).toBeCloseTo(HOME, 1)
  })

  it('keeps to the right-hand carriageway of a boulevard drawn twice', () => {
    const e: Edge = { id: 1, a: 0, b: 1, points: [{ x: 0, z: 0 }, { x: 0, z: 200 }], length: 200,
      surface: 'asphalt', width: 7, walk: 2, foot: false, lane: 6 }
    const n = new Navigator(buildGraph([e]), { edgeId: 1, s: 50, reversed: false })
    n.advance(30, 5)
    // heading north, right is east: the right-hand carriageway, and on its right
    expect(n.ridePoint().x).toBeCloseTo(6 + HOME)
  })
})

/**
 * FAST INPUT (owner, 2026-09-29: "you press left, you go left immediately"): holding a direction steers across the
 * street, and the turn taken is whatever is held — or was just tapped — at the corner. Rides north up the south
 * arm of the crossroads at 8 m/s in 1 m steps (a frame is ~0.13 m at 60 fps, but the latch is per step).
 */
describe('fast input', () => {
  const ride = (n: Navigator, metres: number, each?: (left: number) => void): void => {
    for (let i = 0; i < metres; i++) {
      const e = n.position
      each?.(e.edgeId === 3 ? e.s : -1)
      n.advance(1, 8)
    }
  }
  const fastNav = (): Navigator => {
    const n = new Navigator(crossroads(), { edgeId: 3, s: 100, reversed: true })
    n.fast = true
    return n
  }

  it('turns the way that is held at the corner', () => {
    const n = fastNav()
    ride(n, 90)
    n.hold(-1)
    ride(n, 20)
    expect(n.position.edgeId).toBe(4)   // west: left
  })

  it('goes straight on when nothing is held', () => {
    const n = fastNav()
    ride(n, 110)
    expect(n.position.edgeId).toBe(1)
  })

  it('does not turn for a hold let go well before the corner — the rider stays where they steered, then keeps right', () => {
    const n = fastNav()
    ride(n, 40)
    expect(n.nudged).toBeCloseTo(HOME, 5)
    n.hold(-1)
    ride(n, 8)                          // a second of steering left
    n.hold(0)
    const across = n.nudged
    expect(across).toBeLessThan(HOME - 2.5)   // moved left, 3 m/s…
    ride(n, 12)                               // 1.5 s: still where it was steered to
    expect(n.nudged).toBeCloseTo(across, 5)
    ride(n, 50)
    expect(n.position.edgeId).toBe(1)   // …carried straight on
    expect(n.nudged).toBeCloseTo(HOME, 5)     // and back on the right
  })

  it('takes a tap just before the corner, and ignores one long before it', () => {
    const late = fastNav()
    ride(late, 90)                      // 10 m out: the corner starts at 7 m
    late.tap(-1)
    ride(late, 20)
    expect(late.position.edgeId).toBe(4)

    const early = fastNav()
    ride(early, 40)                     // 60 m out
    early.tap(-1)
    ride(early, 70)
    expect(early.position.edgeId).toBe(1)
  })

  it('decides at the corner, not 1.6 s before it: a change of mind 10 m out still counts', () => {
    const n = fastNav()
    n.hold(1)
    ride(n, 90)                         // holding right…
    n.hold(-1)                          // …then left, 1.25 s before the junction
    ride(n, 20)
    expect(n.position.edgeId).toBe(4)
  })

  it('spends a hold on the corner it took: still held, it asks nothing of the next until let go', () => {
    const n = fastNav()
    ride(n, 90)
    n.hold(-1)
    ride(n, 20)
    expect(n.position.edgeId).toBe(4)
    expect(n.requested).toBe('straight')
    n.hold(0)
    n.hold(-1)
    expect(n.requested).toBe('left')
  })

  it('never steers at a standstill, nor past 0.8 m from the kerb', () => {
    const n = fastNav()
    n.hold(1)
    n.advance(0, 0)
    expect(n.nudged).toBe(0)
    ride(n, 30)
    expect(n.nudged).toBeCloseTo(7 / 2 - 0.8, 5)
  })

  it('leaves the slow model alone: a slow navigator ignores holds', () => {
    const n = new Navigator(crossroads(), { edgeId: 3, s: 100, reversed: true })
    n.hold(-1)
    ride(n, 110)
    expect(n.position.edgeId).toBe(1)
    expect(n.nudged).toBeCloseTo(HOME, 5)   // on its own line, not steered left
  })
})
