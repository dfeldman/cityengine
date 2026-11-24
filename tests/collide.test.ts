import { describe, expect, it } from 'vitest'
import { SIZE, boxOf, overlap, segmentHits } from '../src/sim/collide.ts'

describe('collision boxes', () => {
  it('overlap when they touch and not when they do not', () => {
    const car = boxOf(0, 0, 0, SIZE.car)                        // 4.4 long north–south, 1.9 wide
    expect(overlap(car, boxOf(0, 3, 0, SIZE.bike))).toBe(true)   // nose 2.2, bike tail at 3 − 0.9 = 2.1
    expect(overlap(car, boxOf(0, 3.2, 0, SIZE.bike))).toBe(false)
    expect(overlap(car, boxOf(1.2, 0, 0, SIZE.bike))).toBe(true)  // side 0.95, bike edge 1.2 − 0.3 = 0.9
    expect(overlap(car, boxOf(1.3, 0, 0, SIZE.bike))).toBe(false)
  })

  it('turn with their heading', () => {
    // a car heading east is long in x: a bike 2 m east of its centre is inside it, 2 m north is not
    const east = boxOf(0, 0, Math.PI / 2, SIZE.car)
    expect(overlap(east, boxOf(2, 0, 0, SIZE.bike))).toBe(true)
    expect(overlap(east, boxOf(0, 2, Math.PI / 2, SIZE.bike))).toBe(false)
  })

  it('catch a diagonal near miss an axis-aligned test would get wrong', () => {
    // two cars at 45°, corner to corner: their axis-aligned bounds overlap, the cars do not
    const a = boxOf(0, 0, Math.PI / 4, SIZE.car)
    const b = boxOf(2.4, 2.4, Math.PI / 4 + Math.PI / 2, SIZE.car)
    expect(overlap(a, b)).toBe(false)
    expect(overlap(a, boxOf(1.2, 1.2, Math.PI / 4, SIZE.car))).toBe(true)
  })
})

describe('a dog\'s lead', () => {
  // a bike heading north at the origin: 1.8 m long, 0.6 m wide
  const bike = boxOf(0, 0, 0, SIZE.bike)
  it('is hit when strung across the bike\'s path', () => {
    expect(segmentHits(bike, -1, 0.5, 1, 0.5)).toBe(true)
  })
  it('is hit when it ends inside the box', () => {
    expect(segmentHits(bike, 0.1, 0.2, 2, 2)).toBe(true)
  })
  it('is missed when it runs alongside, off the bars', () => {
    expect(segmentHits(bike, 0.6, -2, 0.6, 2)).toBe(false)
  })
  it('is missed when it stops short of the bike', () => {
    expect(segmentHits(bike, -2, 0.5, -0.5, 0.5)).toBe(false)
  })
  it('turns with the box', () => {
    const east = boxOf(0, 0, Math.PI / 2, SIZE.bike)
    expect(segmentHits(east, 0.8, -1, 0.8, 1)).toBe(true)
    expect(segmentHits(east, -1, 0.8, 1, 0.8)).toBe(false)
  })
})
