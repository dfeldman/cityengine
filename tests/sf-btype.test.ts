import { describe, expect, it } from 'vitest'
import { archetypeOf, districtOf, type Features } from '../src/city/sf/btype.ts'

const f = (lat: number, lon: number, o: Partial<Features>): Features => ({ lat, lon, area: 250, frontage: 7.6, depth: 30, tags: { building: 'yes' }, roll: 0.5, ...o })

describe('San Francisco building types from geometry and place (SF_PLAN.md §2)', () => {
  it('knows the districts', () => {
    expect(districtOf(37.7952, -122.4028)).toBe('fidi')
    expect(districtOf(37.7941, -122.4078)).toBe('chinatown')
    expect(districtOf(37.8025, -122.4400)).toBe('marina')
    expect(districtOf(37.7762, -122.4328)).toBe('western')
    expect(districtOf(37.7800, -122.4000)).toBe('soma')
    expect(districtOf(37.8080, -122.4160)).toBe('wharf')
  })
  const cases: [string, Features, string][] = [
    ['the Painted Ladies, Steiner St', f(37.7762, -122.4328, { height: 11 }), 'rowhouse'],
    ['a Russian Hill Victorian', f(37.7990, -122.4200, { height: 10 }), 'rowhouse'],
    ['a Marina house', f(37.8025, -122.4400, { height: 9, frontage: 8.5 }), 'marinaHouse'],
    ['a SoMa loft', f(37.7800, -122.4000, { height: 18, area: 1500, frontage: 25, depth: 60 }), 'loft'],
    ['the Transamerica Pyramid', f(37.7952, -122.4028, { height: 260, area: 2500, frontage: 45, depth: 55 }), 'tower'],
    ['the Hallidie Building', f(37.7907, -122.4037, { height: 30, area: 700, frontage: 20, depth: 35 }), 'prewarOffice'],
    ['a Chinatown walk-up', f(37.7945, -122.4070, { height: 13, area: 400, frontage: 12 }), 'chinatown'],
    ['a Nob Hill apartment block', f(37.7920, -122.4160, { height: 24, area: 900, frontage: 25 }), 'apartment'],
    ['Embarcadero Center', f(37.7950, -122.3970, { height: 30, area: 6000, frontage: 60, depth: 100 }), 'modern'],
    ['a Safeway', f(37.8020, -122.4350, { height: 7, area: 4000, frontage: 50, depth: 80 }), 'retailBox'],
    ['Grace Cathedral', f(37.7919, -122.4133, { height: 40, area: 3000, tags: { building: 'cathedral', amenity: 'place_of_worship' } }), 'church'],
  ]
  for (const [name, feat, want] of cases) it(name, () => expect(archetypeOf(feat).archetype).toBe(want))

  // and with the Assessor's record (tools/sf-parcels.ts), which decides where the geometry could only guess
  const rec = (year: number, use: string, construction: string, units = 1) => ({ year, use, construction, units, parcels: 1 })
  const withRecords: [string, Features, string][] = [
    ['a pre-1906 wood house, wide lot, Russian Hill', f(37.7990, -122.4200, { height: 11, frontage: 14, area: 380, record: rec(1900, 'SRES', 'D') }), 'rowhouse'],
    ['a 1932 Marina house', f(37.8025, -122.4400, { height: 9, frontage: 9, record: rec(1932, 'SRES', 'D') }), 'marinaHouse'],
    ['a 1918 masonry warehouse in SoMa', f(37.7800, -122.4000, { height: 16, area: 1500, frontage: 25, depth: 60, record: rec(1918, 'IND', 'C') }), 'loft'],
    ['a 1965 concrete slab block, Western Addition', f(37.7820, -122.4300, { height: 30, area: 3200, frontage: 40, depth: 80, record: rec(1965, 'MRES', 'B', 120) }), 'modern'],
    ['a 2005 SoMa condo block', f(37.7780, -122.4020, { height: 30, area: 1800, frontage: 30, depth: 60, record: rec(2005, 'MRES', 'A', 80) }), 'contemporary'],
    ['a 1926 office tower downtown', f(37.7910, -122.4010, { height: 80, area: 1600, frontage: 35, depth: 45, record: rec(1926, 'COMO', 'A') }), 'prewarOffice'],
    ['a 1928 hotel tower', f(37.7880, -122.4090, { height: 75, area: 2000, frontage: 40, depth: 50, record: rec(1928, 'COMH', 'A') }), 'hotel'],
    ['a 1912 flat, Pacific Heights', f(37.7925, -122.4340, { height: 10, frontage: 8, record: rec(1912, 'MRES', 'D', 2) }), 'edwardianHouse'],
  ]
  for (const [name, feat, want] of withRecords) it(name, () => expect(archetypeOf(feat).archetype).toBe(want))
})
