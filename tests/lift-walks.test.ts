import { describe, it, expect } from 'vitest'
import { liftWalksOffTheSea } from '../tools/bridges.ts'

const SEA = -84.5
const square = (x0: number, z0: number, s: number) => [{ x: x0, z: z0 }, { x: x0 + s, z: z0 }, { x: x0 + s, z: z0 + s }, { x: x0, z: z0 + s }]
const walk = (heights: number[]) => ({ id: 1, kind: 'footway', points: heights.flatMap((_, i) => [5 + i * 10, 5]), heights: [...heights] })

describe('liftWalksOffTheSea', () => {
  it('lifts a walk on the sea bed inside a fixed pier onto its deck', () => {
    const e = walk([-86, -86])
    liftWalksOffTheSea([e], SEA, [{ ring: square(0, 0, 40), floating: false }])
    expect(e.heights).toEqual([SEA + 3.5, SEA + 3.5])
  })
  it('puts a walk inside a floating pier on its float', () => {
    const e = walk([-86])
    liftWalksOffTheSea([e], SEA, [{ ring: square(0, 0, 40), floating: true }])
    expect(e.heights[0]).toBeCloseTo(SEA + 0.5)
  })
  it('leaves DRY land inside a pier outline alone (the Ferry Building plaza)', () => {
    const e = walk([-83, -82.6, -86])
    liftWalksOffTheSea([e], SEA, [{ ring: square(0, 0, 40), floating: false }])
    expect(e.heights.slice(0, 2)).toEqual([-83, -82.6])
    // (and the wet point goes to the dry land's level: below)
    expect(e.heights[2]).toBe(-82.6)
  })
  it('floats a walk under the water outside any pier, and never touches streets', () => {
    const e = walk([-86])
    const road = { ...walk([-86]), id: 2, kind: 'residential' }
    liftWalksOffTheSea([e, road], SEA, [])
    expect(e.heights[0]).toBeCloseTo(SEA + 0.5)
    expect(road.heights[0]).toBe(-86)
  })
  it('puts a pier that leaves from land level with that land (its dry walks), not at the generic deck', () => {
    const e = walk([-81.7, -86, -86])
    liftWalksOffTheSea([e], SEA, [{ ring: square(0, 0, 40), floating: false }])
    expect(e.heights).toEqual([-81.7, -81.7, -81.7])
  })
  it('with the water given, decks what is over the water — even where the tiles read it as low land (the South Basin)', () => {
    // a promenade on land (x < 10) at -81.7, then a walk out over the water whose tiles read -83
    const e = walk([-81.7, -83, -83.4])
    const wet = (x: number): boolean => x > 10
    liftWalksOffTheSea([e], SEA, [{ ring: square(0, 0, 40), floating: false }], 3.5, (x) => wet(x))
    expect(e.heights).toEqual([-81.7, -81.7, -81.7])
  })
  it('with the water given, a pier off LOW land is level with it, not lifted onto the generic deck (Pier 45, 2026-10-17)', () => {
    // the Wharf's ground reads 0.1 m over the sea: the walks on it are land all the same, and the deck is theirs
    const e = walk([SEA + 0.1, SEA + 0.1, SEA + 0.1])
    const wet = (x: number): boolean => x > 10
    liftWalksOffTheSea([e], SEA, [{ ring: square(0, 0, 40), floating: false }], 3.5, (x) => wet(x))
    expect(e.heights.map((h) => +h.toFixed(2))).toEqual([SEA + 0.1, SEA + 0.1, SEA + 0.1].map((h) => +h.toFixed(2)))
  })
  it('with the water given, a walk off land onto a pier with no dry walks of its own keeps its land end\'s level', () => {
    // the pier's outline only over the water (x > 10); the walk starts on land at SEA + 0.1
    const e = walk([SEA + 0.1, -86, -86])
    const wet = (x: number): boolean => x > 10
    liftWalksOffTheSea([e], SEA, [{ ring: square(11, 0, 40), floating: false }], 3.5, (x) => wet(x))
    expect(e.heights.map((h) => +h.toFixed(2))).toEqual([SEA + 0.1, SEA + 0.1, SEA + 0.1].map((h) => +h.toFixed(2)))
  })
})

