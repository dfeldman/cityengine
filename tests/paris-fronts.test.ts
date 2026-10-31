/**
 * Paris's fronts by arrondissement (owner, 2026-10-30): the centre-west is cream with a Haussmann front whatever its age, the 15th and 16th
 * cream with no brick, and further out brick is one building in several blocks.
 */
import { describe, expect, it } from 'vitest'
import { arrondissementOf, frontZone } from '../src/city/paris/arrondissements.ts'
import { classifyParis } from '../src/city/paris/btype.ts'
import type { BuildingFacts } from '../src/city/building-types.ts'

const AT = { elysee: [48.8704, 2.3167], tour: [48.8584, 2.2945], convention: [48.8373, 2.2965], passy: [48.8580, 2.2800], belleville: [48.8650, 2.3985], outside: [48.8850, 2.2200] } as const
const facts = (at: readonly [number, number], period: number, id: number, more: Partial<BuildingFacts> = {}): BuildingFacts =>
  ({ tags: {}, ring: [], lat: at[0], lon: at[1], id, area: 300, record: { construction: String(period), units: 0, parcels: 1 }, ...more })
const styles = (at: readonly [number, number], period: number, more: Partial<BuildingFacts> = {}): string[] =>
  Array.from({ length: 1000 }, (_, i) => classifyParis(facts(at, period, i * 7919 + 13, more))?.style ?? 'none')
const share = (l: string[], s: string): number => l.filter((q) => q === s).length / l.length

describe('Paris\'s arrondissements', () => {
  it('knows where it is', () => {
    expect(arrondissementOf(...AT.elysee)).toBe(8)
    expect(arrondissementOf(...AT.tour)).toBe(7)
    expect(arrondissementOf(...AT.convention)).toBe(15)
    expect(arrondissementOf(...AT.passy)).toBe(16)
    expect(arrondissementOf(...AT.belleville)).toBe(20)
    expect(arrondissementOf(...AT.outside)).toBe(null)
    expect(frontZone(...AT.elysee)).toBe('haussmann')
    expect(frontZone(...AT.convention)).toBe('cream')
    expect(frontZone(...AT.belleville)).toBe('varied')
  })
})

describe('Paris\'s fronts', () => {
  it('the centre-west is a Haussmann front whatever its age', () => {
    for (const period of [3, 4, 5, 6, 9, 12]) expect(new Set(styles(AT.elysee, period))).toEqual(new Set(['haussmann']))
    expect(new Set(styles(AT.tour, 9, { tags: { building: 'office' } }))).toEqual(new Set(['haussmann']))
  })
  it('the 15th and 16th are never brick, and glass only says so', () => {
    for (const at of [AT.convention, AT.passy]) for (const period of [3, 4, 5]) expect(share(styles(at, period), 'brick')).toBe(0)
    expect(share(styles(AT.convention, 9), 'skyscraper')).toBe(0)
    expect(share(styles(AT.convention, 9, { tags: { building: 'office' } }), 'skyscraper')).toBe(1)
  })
  it('further out, brick is one in many, and a school is likelier', () => {
    const flats = share(styles(AT.belleville, 4), 'brick')
    expect(flats).toBeGreaterThan(0.02)
    expect(flats).toBeLessThan(0.12)
    expect(share(styles(AT.belleville, 4, { tags: { amenity: 'school' } }), 'brick')).toBeGreaterThan(0.25)
    expect(share(styles(AT.belleville, 4, { area: 2000 }), 'brick')).toBeLessThan(0.03)
  })
  it('a hospital outside the centre is still glass', () => {
    expect(share(styles(AT.belleville, 9, { tags: { amenity: 'hospital' } }), 'skyscraper')).toBe(1)
  })
})
