/**
 * The sports-pitch kit's FIT (BUGS.md #214, src/city/sports.ts).
 *
 * #214's two cautions are both testable without a browser, and this is them: a court is fitted INSIDE the
 * polygon with the right proportions rather than stretched to its corners, and its orientation comes from
 * the polygon's longest edge rather than from north. Every ring here is deliberately rotated and slightly
 * off-square, because an axis-aligned rectangle would pass either way.
 */
import { describe, expect, it } from 'vitest'
import { COURT_MAX_M2, courtEligible, courtSport, fitCourt, ringArea } from '../src/city/sports.ts'

/** A rectangle `len` along the heading by `wid` across it, centred at (cx, cz). */
const rect = (len: number, wid: number, ang: number, cx = 0, cz = 0): { x: number; z: number }[] => {
  const c = Math.cos(ang)
  const s = Math.sin(ang)
  return [[-len / 2, -wid / 2], [len / 2, -wid / 2], [len / 2, wid / 2], [-len / 2, wid / 2]]
    .map(([a, b]) => ({ x: cx + a * c - b * s, z: cz + a * s + b * c }))
}

/** The heading two rotations may differ by π and still be the same axis. */
const axisDiff = (a: number, b: number): number => {
  let d = Math.abs(a - b) % Math.PI
  if (d > Math.PI / 2) d = Math.PI - d
  return d
}

describe('courtSport', () => {
  it('takes the first sport it knows out of a `;` list', () => {
    expect(courtSport('basketball;tennis')).toBe('basketball')
    expect(courtSport('soccer;basketball')).toBe('basketball')
    expect(courtSport('beachvolleyball')).toBe('volleyball')
  })
  it('claims nothing it cannot draw — including `multi`, which is whatever lines its owner painted', () => {
    expect(courtSport('multi')).toBeNull()
    expect(courtSport('baseball')).toBeNull()
    expect(courtSport(undefined)).toBeNull()
  })
})

describe('the exclusion (BUGS.md #214a)', () => {
  it('leaves a named pitch, a venue-sized one, and a stadium to the landmark ladder', () => {
    expect(courtEligible({ sport: 'tennis' }, 258)).toBe(true)
    expect(courtEligible({ sport: 'tennis', name: 'Kezar Stadium' }, 258)).toBe(false)
    expect(courtEligible({ sport: 'soccer' }, COURT_MAX_M2 + 1)).toBe(false)
    expect(courtEligible({ sport: 'soccer', leisure: 'stadium' }, 900)).toBe(false)
  })
  it('leaves an unnamed pitch inside a NAMED sports centre alone (Beach Chalet)', () => {
    expect(courtEligible({ sport: 'soccer' }, 3000, 'Beach Chalet Soccer Fields')).toBe(false)
  })
})

describe('fitCourt', () => {
  it('takes the orientation from the longest edge, not from north', () => {
    for (const ang of [0, 0.4, 1.1, -2.3, 3.0]) {
      const fit = fitCourt(rect(23.7, 10.9, ang), 'tennis')!
      expect(fit).not.toBeNull()
      expect(axisDiff(fit.heading, ang)).toBeLessThan(0.02)
    }
  })

  it('draws a REAL tennis court in a polygon traced to the lines, not a stretched one', () => {
    // as the data actually measures: p50 23.6 x 10.9, which is the published court to a decimetre
    const fit = fitCourt(rect(23.6, 10.9, 0.9, 40, -12), 'tennis')!
    expect(fit.len).toBeCloseTo(23.77, 2)
    expect(fit.wid).toBeCloseTo(10.97, 2)
    expect(fit.x).toBeCloseTo(40, 6)
    expect(fit.z).toBeCloseTo(-12, 6)
  })

  it('never stretches: a badly-traced polygon gets a court with the RIGHT aspect ratio', () => {
    // a 2:1 blob where a tennis court is 2.17:1 — the court must keep its own shape
    const fit = fitCourt(rect(26, 13, -0.6), 'tennis')!
    expect(fit.len / fit.wid).toBeCloseTo(23.77 / 10.97, 3)
    expect(fit.len).toBeLessThanOrEqual(26)
    expect(fit.wid).toBeLessThanOrEqual(13)
  })

  it('never scales a court UP to fill a polygon bigger than it', () => {
    const fit = fitCourt(rect(40, 20, 0.2), 'pickleball')!
    expect(fit.len).toBeCloseTo(13.41, 2)
    expect(fit.wid).toBeCloseTo(6.10, 2)
  })

  it('walks the basketball ladder down: full court, then the American one, then a half court', () => {
    expect(fitCourt(rect(29, 16, 0.3), 'basketball')!.len).toBeCloseTo(28, 2)
    expect(fitCourt(rect(26, 15.3, 0.3), 'basketball')!.len).toBeCloseTo(25.6, 2)
    const half = fitCourt(rect(16, 15.3, 0.3), 'basketball')!
    expect(half.half).toBe(true)
    expect(half.len).toBeCloseTo(14, 2)
  })

  it('shrinks the half court UNIFORMLY for a park slab that fits no rung (the measured median)', () => {
    const fit = fitCourt(rect(18.4, 12.0, 1.4), 'basketball')!
    expect(fit.half).toBe(true)
    expect(fit.len / fit.wid).toBeCloseTo(14 / 15.24, 3)
    expect(fit.len).toBeLessThanOrEqual(18.4)
    expect(fit.wid).toBeLessThanOrEqual(12.0001)
  })

  it('draws nothing on a scrap too small to hold a court', () => {
    expect(fitCourt(rect(3, 2, 0.5), 'basketball')).toBeNull()
    expect(fitCourt(rect(0.2, 0.1, 0), 'tennis')).toBeNull()
  })

  it('fits inside a rough, non-rectangular trace — every corner of the court is within the polygon', () => {
    // the polygon a mapper actually draws: a rectangle with one corner pulled in and a nudged edge
    const ring = [
      { x: -12.0, z: -5.6 }, { x: 11.6, z: -5.9 }, { x: 12.1, z: 5.4 }, { x: -11.4, z: 5.7 },
    ]
    const fit = fitCourt(ring, 'tennis')!
    expect(fit.len).toBeCloseTo(23.77, 2)
    // the court's own corners, in local metres
    const c = Math.cos(fit.heading)
    const s = Math.sin(fit.heading)
    const box = ringArea(ring)
    expect(box).toBeGreaterThan(fit.len * fit.wid * 0.95)
    for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const lx = (a * fit.len) / 2
      const lz = (b * fit.wid) / 2
      const x = fit.x + lx * c - lz * s
      const z = fit.z + lx * s + lz * c
      // inside the polygon's own extent, with the decimetre of slack OSM traces are worth
      expect(Math.abs(x)).toBeLessThan(12.3)
      expect(Math.abs(z)).toBeLessThan(6.0)
    }
  })
})
