import { describe, expect, it } from 'vitest'
import { Carriageways } from '../src/city/carriageways.ts'

// two streets crossing square at the origin: 10 m carriageways (half 5) with 3 m pavements
const street = (id: number, points: number[]) => ({ id, points, width: 10, walk: 3, foot: false, kind: 'residential' })
const cw = new Carriageways([street(1, [-60, 0, 60, 0]), street(2, [0, -60, 0, 60])])

describe('Carriageways.toPavement (poles on the sidewalk, owner 2026-10-14)', () => {
  it('leaves a point already on a pavement where it is', () => {
    expect(cw.toPavement(20, 6.5)).toEqual({ x: 20, z: 6.5 })
  })
  it('moves a point in a traffic lane onto the nearer pavement, just in from the kerb', () => {
    const q = cw.toPavement(20, 2)
    expect(q.x).toBeCloseTo(20)
    expect(q.z).toBeCloseTo(5.5)
    expect(cw.onPavement(q.x, q.z)).toBe(true)
  })
  it('moves a point in the middle of the junction onto a corner, clear of both streets', () => {
    const q = cw.toPavement(1, 1.5)
    expect(cw.onPavement(q.x, q.z)).toBe(true)
    expect(Math.abs(q.x)).toBeGreaterThan(5.3)
    expect(Math.abs(q.z)).toBeGreaterThan(5.3)
  })
  it('pulls a point from beyond the pavement (in a building) back onto it', () => {
    const q = cw.toPavement(20, 11)
    expect(q.z).toBeCloseTo(7.8)
    expect(cw.onPavement(q.x, q.z)).toBe(true)
  })
})
