import { describe, expect, it } from 'vitest'
import { bboxOf, extentOf } from '../tools/cities.ts'

describe('a city box that is not a square (BUGS.md #2, PARIS_EXPAND)', () => {
  const centre = { lat: 48.8577, lon: 2.3622 }
  it('is the old square when no box is given', () => {
    const b = bboxOf({ centre, radius: 700 })
    const dLat = 700 / 111_320
    const dLon = 700 / (111_320 * Math.cos((centre.lat * Math.PI) / 180))
    expect(b.south).toBeCloseTo(centre.lat - dLat, 9)
    expect(b.north).toBeCloseTo(centre.lat + dLat, 9)
    expect(b.west).toBeCloseTo(centre.lon - dLon, 9)
    expect(b.east).toBeCloseTo(centre.lon + dLon, 9)
  })
  it('reaches each side by its own extent, the rest by the radius, plus the pad', () => {
    const c = { centre, radius: 700, box: { east: 1050, south: 900 } }
    expect(extentOf(c)).toEqual({ west: 700, east: 1050, south: 900, north: 700 })
    expect(extentOf(c, 100)).toEqual({ west: 800, east: 1150, south: 1000, north: 800 })
    const b = bboxOf(c)
    const mLon = 111_320 * Math.cos((centre.lat * Math.PI) / 180)
    expect((b.east - centre.lon) * mLon).toBeCloseTo(1050, 3)
    expect((centre.lon - b.west) * mLon).toBeCloseTo(700, 3)
    expect((centre.lat - b.south) * 111_320).toBeCloseTo(900, 3)
  })
})
