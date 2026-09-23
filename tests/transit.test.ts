/**
 * The boarding state machine (src/sim/transit.ts).
 *
 * This is exactly the kind of thing that breaks silently: a rider who can never board, a rider who can board
 * a moving cable car, a rider put down in the middle of a rail yard. None of those shows up as an error —
 * they show up as a feature nobody can get to work. So every transition is pinned here.
 */
import { describe, expect, it } from 'vitest'
import { BOARD_NEAR, BOARD_SPEED, MAX_DROP, SEE_NEAR, Transit, type Placer, type VehicleView } from '../src/sim/transit.ts'

const car = (over: Partial<VehicleView> = {}): VehicleView => ({
  id: 'c1', kind: 'cable', x: 0, z: 0, y: 12, heading: 0, speed: 0, dwelling: true, ...over,
})
const START = { edgeId: 7, s: 33, reversed: false }
const rider = (over: Partial<{ x: number; z: number; speed: number }> = {}) => ({ x: 0, z: 3, speed: 0, ...over })

/** a placer that always finds a street `d` away, on edge 9 */
const placerAt = (d: number): Placer => () => ({ pos: { edgeId: 9, s: 11, reversed: false }, d })
const noStreet: Placer = () => null

describe('who may be boarded', () => {
  it('offers a cable car standing at a stop beside a stopped rider', () => {
    const t = new Transit()
    t.update(rider(), [car()])
    expect(t.boardable?.id).toBe('c1')
    expect(t.prompt()).toMatch(/board/)
  })

  it('does not offer one that is still moving', () => {
    const t = new Transit()
    t.update(rider(), [car({ dwelling: false, speed: 4 })])
    expect(t.boardable).toBeNull()
    // …but it still says there is one about, so the rider knows to wait
    expect(t.prompt()).toMatch(/cable car/)
  })

  it('does not offer one the rider is riding past', () => {
    const t = new Transit()
    t.update(rider({ speed: BOARD_SPEED + 0.5 }), [car()])
    expect(t.boardable).toBeNull()
  })

  it('does not offer one that is too far to step onto', () => {
    const t = new Transit()
    t.update(rider({ z: BOARD_NEAR + 5 }), [car()])
    expect(t.boardable).toBeNull()
    expect(t.prompt()).toMatch(/at the stop/)
  })

  it('says nothing at all about one beyond sight', () => {
    const t = new Transit()
    t.update(rider({ z: SEE_NEAR + 10 }), [car()])
    expect(t.prompt()).toBeNull()
  })

  it('takes the nearest of several', () => {
    const t = new Transit()
    t.update(rider(), [car({ id: 'far', z: 8 }), car({ id: 'near', z: 1 })])
    expect(t.boardable?.id).toBe('near')
  })
})

describe('boarding', () => {
  it('refuses when nothing was offered', () => {
    const t = new Transit()
    t.update(rider(), [car({ dwelling: false })])
    expect(t.board(START)).toBe(false)
    expect(t.aboard).toBeNull()
  })

  it('takes the rider aboard and puts them where the vehicle is', () => {
    const t = new Transit()
    t.update(rider(), [car()])
    expect(t.board(START)).toBe(true)
    expect(t.aboard?.id).toBe('c1')
    expect(t.at).toEqual({ x: 0, z: 0, y: 12, heading: 0 })
  })

  it('follows the vehicle as it runs', () => {
    const t = new Transit()
    t.update(rider(), [car()])
    t.board(START)
    t.update(rider(), [car({ x: 40, z: -120, y: 30, heading: 1.2, speed: 4.2, dwelling: false })])
    expect(t.at).toEqual({ x: 40, z: -120, y: 30, heading: 1.2 })
    // and offers nothing else while aboard
    expect(t.boardable).toBeNull()
  })
})

describe('alighting', () => {
  const boarded = (v = car()): Transit => {
    const t = new Transit()
    t.update(rider(), [v])
    t.board(START)
    return t
  }

  it('is refused between stops, and the rider stays aboard', () => {
    const t = boarded()
    t.update(rider(), [car({ x: 50, dwelling: false, speed: 4 })])
    expect(t.alight(placerAt(2)).status).toBe('moving')
    expect(t.aboard).not.toBeNull()
  })

  it('places the rider on the graph at a stop', () => {
    const t = boarded()
    const r = t.alight(placerAt(4))
    expect(r).toEqual({ status: 'ok', pos: { edgeId: 9, s: 11, reversed: false } })
    expect(t.aboard).toBeNull()
    expect(t.at).toBeNull()
  })

  it('refuses rather than strand the rider when the nearest street is far', () => {
    const t = boarded()
    expect(t.alight(placerAt(MAX_DROP + 1)).status).toBe('no-street')
    expect(t.aboard?.id).toBe('c1')
  })

  it('refuses when there is no graph at all', () => {
    const t = boarded()
    expect(t.alight(noStreet).status).toBe('no-street')
    expect(t.aboard).not.toBeNull()
  })
})

describe('nothing strands the rider', () => {
  const boarded = (): Transit => {
    const t = new Transit()
    t.update(rider(), [car()])
    t.board(START)
    return t
  }

  it('lets the rider off anywhere on demand, however far the street', () => {
    const t = boarded()
    expect(t.abandon(placerAt(MAX_DROP * 10))).toEqual({ edgeId: 9, s: 11, reversed: false })
    expect(t.aboard).toBeNull()
  })

  it('falls back to where they boarded when there is no street near the vehicle', () => {
    const t = boarded()
    expect(t.abandon(noStreet)).toEqual(START)
  })

  it('notices a vehicle that stops being reported, and can still be got off', () => {
    const t = boarded()
    t.update(rider(), [])
    expect(t.vehicleLost).toBe(true)
    // the last known place is still where the rider is, so they are not moved by the loss
    expect(t.at?.x).toBe(0)
    // and getting off works even though the vehicle is not dwelling any more as far as anyone knows
    expect(t.alight(placerAt(3)).status).toBe('ok')
  })

  it('recovers if the vehicle comes back', () => {
    const t = boarded()
    t.update(rider(), [])
    t.update(rider(), [car({ x: 5 })])
    expect(t.vehicleLost).toBe(false)
    expect(t.at?.x).toBe(5)
  })

  it('abandoning when not aboard does nothing', () => {
    const t = new Transit()
    expect(t.abandon(placerAt(1))).toBeNull()
  })
})
