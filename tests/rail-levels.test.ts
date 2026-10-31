import { describe, expect, it } from 'vitest'
import { bridgesOverStreets, footWaysOnTracks, joinTracks, spanOverRailways, straightDeck, type OverLine } from '../tools/rail-levels.ts'
import type { PackedRail } from '../src/city/package.ts'

// an embankment 8 m high, with a street through it at x 0: the bare earth's gap
const bank = (x: number, _z: number): number => (Math.abs(x) < 10 ? 0 : Math.abs(x) < 20 ? ((Math.abs(x) - 10) / 10) * 8 : 8)
const flat = (): number => 0
const track = (): PackedRail => ({ id: 1, points: [-200, 0, 200, 0], kind: 'rail' })
const street = { points: [0, -50, 0, 50], heights: [0, 0], kind: 'residential' }
let n = 100

describe('which is on top at a crossing (owner, 2026-10-30)', () => {
  it('puts a track on an embankment on a bridge over the street, tagged or not', () => {
    const levelled = new Set<PackedRail>()
    const got = bridgesOverStreets([track()], [street], bank, levelled, () => n++)
    expect(got.spans).toBe(1)
    expect(got.rails.length).toBe(3)
    const deck = got.rails[1]
    expect(deck.bridge).toBe(true)
    expect(levelled.has(deck)).toBe(true)
    expect(Math.min(...deck.heights!)).toBeCloseTo(8)
    // the pieces either side still meet the deck's ends, and keep the way's id for the first
    expect(got.rails[0].id).toBe(1)
    expect(got.rails[0].points.slice(-2)).toEqual(deck.points.slice(0, 2))
    expect(got.rails[2].points.slice(0, 2)).toEqual(deck.points.slice(-2))
  })
  it('leaves a track on flat ground at its crossing, and counts it', () => {
    const got = bridgesOverStreets([track()], [street], flat, new Set(), () => n++)
    expect(got.spans).toBe(0)
    expect(got.flat).toBe(1)
    expect(got.rails.length).toBe(1)
  })
  it('does not touch a footpath, a tunnel or a road on its own bridge', () => {
    const others = [{ ...street, foot: true }, { ...street, tunnel: true }, { ...street, bridge: true }]
    expect(bridgesOverStreets([track()], others, bank, new Set(), () => n++).spans).toBe(0)
  })
  it('judges a crossing with the shoulder on the next way, a track being many ways', () => {
    const ways: PackedRail[] = [{ id: 1, points: [-200, 0, -8, 0], kind: 'rail' }, { id: 2, points: [-8, 0, 200, 0], kind: 'rail' }]
    const got = bridgesOverStreets(ways, [street], bank, new Set(), () => n++)
    expect(got.spans).toBe(1)
    expect(joinTracks(ways).length).toBe(1)
  })
  it('stops a chain at a junction', () => {
    const ways: PackedRail[] = [{ id: 1, points: [-100, 0, 0, 0], kind: 'rail' }, { id: 2, points: [0, 0, 100, 0], kind: 'rail' }, { id: 3, points: [0, 0, 100, 50], kind: 'rail' }]
    expect(joinTracks(ways).length).toBe(3)
  })
  it('makes a street a bridge where the track lies in a cutting under it', () => {
    const cutting = (x: number): number => (Math.abs(x) < 6 ? 8 : 0)
    const road = { points: [0, -50, 0, 50], heights: [8, 8], kind: 'residential' } as { points: number[]; heights: number[]; kind: string; bridge?: boolean }
    const got = bridgesOverStreets([track()], [road], cutting, new Set(), () => n++)
    expect(got.spans).toBe(0)
    expect(got.over).toBe(1)
    expect(road.bridge).toBe(true)
  })
  it('runs a short tagged deck straight between the ground at its ends', () => {
    const r: PackedRail = { id: 2, points: [-30, 0, 0, 0, 30, 0], kind: 'rail', bridge: true }
    straightDeck(r, (x) => (x < 0 ? 10 : 6))
    expect(r.heights).toEqual([10, 8, 6])
  })
})

describe('a street over a railway in the ground (the Boulevard des Batignolles, 2026-10-30)', () => {
  const flatGround = (): number => 0
  // a boulevard along x that falls 5 m to a tunnel at x 0 over 30 m each way, in two ways that meet at x 10
  const west = (): OverLine => ({ a: 1, b: 2, name: 'B', kind: 'primary', points: [-60, 0, -30, 0, -15, 0, 10, 0], heights: [5, 5, 2.5, 1.7] })
  const east = (): OverLine => ({ a: 2, b: 3, name: 'B', kind: 'primary', points: [10, 0, 30, 0, 60, 0], heights: [1.7, 5, 5] })
  const tunnel = { points: [0, -60, 0, 60] }

  it('runs the street straight from top to top, the way over the tracks a bridge', () => {
    const w = west(), e = east()
    expect(spanOverRailways([w, e], [tunnel], [], flatGround)).toBe(1)
    expect(w.bridge).toBe(true)
    expect(Math.min(...w.heights!, ...e.heights!)).toBeCloseTo(5)
    expect(e.bridge).toBeUndefined()
    expect(e.ramp).toBe(true)
  })
  it('leaves a street that goes straight over them, or falls gently: a valley', () => {
    const level: OverLine = { a: 1, b: 2, name: 'B', points: [-60, 0, 60, 0], heights: [5, 5] }
    expect(spanOverRailways([level], [tunnel], [], flatGround)).toBe(0)
    const valley: OverLine = { a: 1, b: 2, name: 'B', points: [-45, 0, 0, 0, 45, 0], heights: [2, 0, 2] }
    const valley2: OverLine = { a: 3, b: 4, name: 'C', points: [-200, 5, 0, 5, 200, 5], heights: [8, 0, 8] }
    expect(spanOverRailways([valley, valley2], [{ points: [0, -60, 0, 60] }], [], flatGround)).toBe(0)
  })
  it('counts a tunnel only near its mouth: a street over the middle of the RER is on its own ground', () => {
    const w = west(), e = east()
    expect(spanOverRailways([w, e], [{ points: [0, -500, 0, 500] }], [], flatGround)).toBe(0)
  })
  it('leaves a street under a track on a bank, and a street on its own bridge', () => {
    const w = west(), e = east()
    expect(spanOverRailways([w, e], [], [{ points: [0, -60, 0, 60] }], () => 8)).toBe(0)
    const on = { ...west(), bridge: true }
    expect(spanOverRailways([on], [tunnel], [], flatGround)).toBe(0)
  })
  it('spans a surface track in its cutting', () => {
    const w = west(), e = east()
    expect(spanOverRailways([w, e], [], [{ points: [0, -60, 0, 60] }], flatGround)).toBe(1)
  })
})

describe('people on the tracks (the Place de l\'Europe, 2026-10-30)', () => {
  const rails: PackedRail[] = [{ id: 1, points: [-200, 0, 200, 0], kind: 'rail' }]
  it('finds a foot way that runs along a track', () => {
    expect(footWaysOnTracks([{ id: 7, foot: true, points: [-50, 1, 50, 1] }], rails).has(7)).toBe(true)
  })
  it('leaves one that crosses it, one beside it, a foot bridge, a tunnel and a street', () => {
    const others = [
      { id: 2, foot: true, points: [0, -40, 0, 40] }, { id: 3, foot: true, points: [-50, 9, 50, 9] },
      { id: 4, foot: true, bridge: true, points: [-50, 1, 50, 1] }, { id: 5, foot: true, tunnel: true, points: [-50, 1, 50, 1] },
      { id: 6, points: [-50, 1, 50, 1] },
    ]
    expect(footWaysOnTracks(others, rails).size).toBe(0)
  })
})
