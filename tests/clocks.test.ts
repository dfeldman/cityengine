import { describe, expect, it } from 'vitest'
import { clockTime, handAngles } from '../src/render/clocks.ts'

describe('the public clocks tell the city\'s own time', () => {
  // 2026-10-04 15:49:30 UTC is 08:49:30 in San Francisco (PDT) and 17:49:30 in Paris (CEST)
  const t = new Date(Date.UTC(2026, 9, 4, 15, 49, 30))
  it('reads the time in the region\'s time zone', () => {
    const sf = clockTime(t, 'America/Los_Angeles')
    expect(sf.h).toBeCloseTo(8 + 49.5 / 60, 5)
    expect(sf.m).toBeCloseTo(49.5, 5)
    expect(clockTime(t, 'Europe/Paris').h).toBeCloseTo(5 + 49.5 / 60, 5)
  })
  it('turns the hands clockwise from twelve', () => {
    const a = handAngles({ h: 3, m: 15 })
    expect(a.hour).toBeCloseTo(Math.PI / 2)
    expect(a.minute).toBeCloseTo(Math.PI / 2)
    expect(handAngles({ h: 9, m: 45 }).minute).toBeCloseTo(1.5 * Math.PI)
  })
  it('keeps going on an unknown zone, on the device\'s own time', () => {
    expect(() => clockTime(t, 'Mars/Olympus_Mons')).not.toThrow()
  })
})
