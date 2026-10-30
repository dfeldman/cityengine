import { describe, expect, it } from 'vitest'
import { bridgesOverStreets, straightDeck } from '../tools/rail-levels.ts'
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
  it('runs a short tagged deck straight between the ground at its ends', () => {
    const r: PackedRail = { id: 2, points: [-30, 0, 0, 0, 30, 0], kind: 'rail', bridge: true }
    straightDeck(r, (x) => (x < 0 ? 10 : 6))
    expect(r.heights).toEqual([10, 8, 6])
  })
})
