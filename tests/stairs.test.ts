/**
 * Stairways stop at the kerb (render/stairs.ts `kerbTrim`): OSM ends a flight on the street's centre line, and the
 * last half-street of it was built across the carriageway (BUGS.md #233, Macondray Lane at Taylor Street).
 */
import { describe, expect, it } from 'vitest'
import { kerbTrim } from '../src/render/stairs.ts'

describe('stairways at a street', () => {
  // a 9.2 m street along z at x = 0; a flight coming in from the west to its centre line
  const street = { half: 4.6, pts: [{ x: 0, z: -50 }, { x: 0, z: 50 }] }
  const flight = [{ x: -40, z: 0 }, { x: -20, z: 0 }, { x: 0, z: 0 }]
  const ys = [10, 5, 0]

  it('cuts the end that runs onto the carriageway back to the kerb', () => {
    const cut = kerbTrim(flight, ys, [street])!
    const end = cut.pts[cut.pts.length - 1]
    expect(end.x).toBeLessThanOrEqual(-4.9)
    expect(end.x).toBeGreaterThan(-5.5)
    // the height follows the cut, and the far end is untouched
    expect(cut.ys[cut.ys.length - 1]).toBeCloseTo(-end.x * 0.25, 1)
    expect(cut.pts[0]).toEqual({ x: -40, z: 0 })
  })

  it('leaves a flight that never meets a street alone', () => {
    const cut = kerbTrim(flight, ys, [{ half: 4.6, pts: [{ x: 100, z: -50 }, { x: 100, z: 50 }] }])!
    expect(cut.pts).toBe(flight)
  })

  it('drops a "flight" wholly on a street', () => {
    expect(kerbTrim([{ x: -1, z: 0 }, { x: 1, z: 0 }], [0, 0], [street])).toBeNull()
  })
})
