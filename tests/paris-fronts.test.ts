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
  it('the 15th and 16th are never brick, and glass only where OSM says so', () => {
    for (const at of [AT.convention, AT.passy]) for (const period of [3, 4, 5]) expect(share(styles(at, period), 'brick')).toBe(0)
    expect(share(styles(AT.convention, 9), 'skyscraper')).toBe(0)
    expect(share(styles(AT.convention, 9, { tags: { building: 'office' } }), 'skyscraper')).toBe(0)
    expect(share(styles(AT.convention, 9, { tags: { 'building:material': 'glass' } }), 'skyscraper')).toBe(1)
  })
  it('further out, brick is one in many, and a school is likelier', () => {
    const flats = share(styles(AT.belleville, 4), 'brick')
    expect(flats).toBeGreaterThan(0.02)
    expect(flats).toBeLessThan(0.12)
    expect(share(styles(AT.belleville, 4, { tags: { amenity: 'school' } }), 'brick')).toBeGreaterThan(0.25)
    expect(share(styles(AT.belleville, 4, { area: 2000 }), 'brick')).toBeLessThan(0.03)
  })
  it('a hospital outside the centre is likelier glass than its neighbours, not always', () => {
    const glass = share(styles(AT.belleville, 9, { tags: { amenity: 'hospital' } }), 'skyscraper')
    expect(glass).toBeGreaterThan(0.25)
    expect(glass).toBeLessThan(0.45)
  })
  it('a modern building is cream or white; glass is the rare one, except at La Défense', () => {
    // (owner, 2026-10-31: "in Paris many are cream or white"; "a few curtain wall buildings around, especially in la defense")
    expect(share(styles(AT.belleville, 9), 'skyscraper')).toBeLessThan(0.05)
    const offices = share(styles(AT.belleville, 9, { tags: { building: 'office' } }), 'skyscraper')
    expect(offices).toBeGreaterThan(0.1)
    expect(offices).toBeLessThan(0.3)
    expect(share(styles([48.8917, 2.24], 9, { tags: { building: 'office' } }), 'skyscraper')).toBeGreaterThan(0.8)
    expect(share(styles(AT.belleville, 5), 'skyscraper')).toBe(0)
  })
})

describe('BD TOPO wall and roof material', () => {
  const rec = (period: number, walls: string) => ({ record: { construction: String(period), units: 0, parcels: 1, walls } })
  it('reads the codes: only pure brick is brick, millstone with brick is millstone, a stone mix is stone', async () => {
    const { wallKind, roofKind } = await import('../src/city/paris/materials.ts')
    expect(wallKind('40')).toBe('brick'); expect(wallKind('04')).toBe('brick'); expect(wallKind('44')).toBe('brick')
    expect(wallKind('14')).toBe('stone'); expect(wallKind('24')).toBe('millstone'); expect(wallKind('00')).toBeUndefined()
    expect(roofKind('10')).toBe('tile'); expect(roofKind('23')).toBeUndefined(); expect(roofKind('30')).toBe('zinc')
  })
  it('a pure-brick building is brick even in the cream centre-west; a stone-and-brick one stays cream', () => {
    expect(share(styles(AT.elysee, 3, rec(3, '40')), 'brick')).toBe(1)
    expect(share(styles(AT.passy, 3, rec(3, '14')), 'brick')).toBe(0)
  })
  it('known non-brick walls roll no brick dice; unknown walls still do', () => {
    expect(share(styles(AT.belleville, 5, rec(5, '10')), 'brick')).toBe(0)
    expect(share(styles(AT.outside, 5), 'brick')).toBeGreaterThan(0.2)
  })
})
