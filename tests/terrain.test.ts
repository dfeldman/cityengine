/**
 * The ground.
 *
 * These pin the two things a flat city got wrong and a hilly one must get right: that the height under a
 * point is interpolated rather than stepped, and that the grade a street reports is the grade of the street
 * — including the sign, which is the difference between a climb and a descent and which a rider going the
 * other way up the same hill experiences in reverse.
 */
import { describe, expect, it } from 'vitest'
import { Terrain, profileAt, type PackedTerrain } from '../src/city/terrain.ts'

/** A 3×3 grid, 10 m apart, that slopes evenly from 0 at the west edge to 20 at the east. */
const ramp: PackedTerrain = {
  x0: 0, z0: 0, step: 10, cols: 3, rows: 3,
  heights: [0, 10, 20, 0, 10, 20, 0, 10, 20],
}

describe('Terrain', () => {
  it('interpolates between samples rather than stepping', () => {
    const t = new Terrain(ramp)
    expect(t.heightAt(0, 0)).toBeCloseTo(0)
    expect(t.heightAt(10, 0)).toBeCloseTo(10)
    expect(t.heightAt(5, 0), 'halfway between two samples is halfway up').toBeCloseTo(5)
    expect(t.heightAt(2.5, 7)).toBeCloseTo(2.5)
  })

  it('clamps outside the grid rather than falling off it', () => {
    const t = new Terrain(ramp)
    expect(t.heightAt(-500, -500)).toBeCloseTo(0)
    expect(t.heightAt(9999, 9999)).toBeCloseTo(20)
  })

  it('is a no-op for a city baked flat, so nothing needs to check first', () => {
    const t = new Terrain(undefined)
    expect(t.flat).toBe(true)
    expect(t.heightAt(123, -456)).toBe(0)
    const pos = [1, 2, 3, 4, 5, 6]
    t.drape(pos)
    expect(pos).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('drapes a mesh by adding the ground, keeping what each vertex was built at', () => {
    const t = new Terrain(ramp)
    // a kerb 0.15 above the road at x = 10, where the ground is 10
    const pos = [10, 0.15, 0]
    t.drape(pos)
    expect(pos[1]).toBeCloseTo(10.15)
  })
})

describe('street profiles', () => {
  const points = [{ x: 0, z: 0 }, { x: 50, z: 0 }, { x: 100, z: 0 }]
  const heights = [0, 5, 10]        // a steady 10% climb

  it('reports the height along the street', () => {
    expect(profileAt(points, heights, 0).y).toBeCloseTo(0)
    expect(profileAt(points, heights, 50).y).toBeCloseTo(5)
    expect(profileAt(points, heights, 75).y).toBeCloseTo(7.5)
  })

  it('reports the grade the rider actually feels', () => {
    expect(profileAt(points, heights, 50).grade).toBeCloseTo(0.1, 2)
  })

  it('returns a flat street when the city has no heights, rather than throwing', () => {
    expect(profileAt(points, undefined, 50)).toEqual({ y: 0, grade: 0 })
    expect(profileAt(points, [1, 2], 50)).toEqual({ y: 0, grade: 0 })
  })

  it('never reports a wild grade from quantised data on flat ground', () => {
    // heights rounded to a centimetre on ground that is level: the window has to absorb this
    const noisy = [0, 0.01, 0]
    expect(Math.abs(profileAt(points, noisy, 50).grade)).toBeLessThan(0.01)
  })
})
