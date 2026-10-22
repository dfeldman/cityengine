import { describe, expect, it } from 'vitest'
import { PlaceIndex, landmarkPlaces, normalize } from '../src/ui/search.ts'

const toLatLon = (p: { x: number; z: number }): { lat: number; lon: number } => ({ lat: 37.8 + p.z / 1e5, lon: -122.4 + p.x / 1e5 })

const places = landmarkPlaces([
  { name: 'Coit Tower', osm: 'way/1', procedural: 'coitTower', _file: 'san-francisco/sights.json' },
  { name: 'Transamerica Pyramid', lat: 37.7952, lon: -122.4028, procedural: 'transamericaPyramid' },
  { name: 'Église Saint-Eustache', osm: 'way/2' },
  { name: 'Golden Gateway Commons house', osm: 'way/3' },
  { name: 'Golden Gateway Commons house', osm: 'way/4' },
  { name: '', osm: 'way/256477865', restyle: 'towerblock' },
  { name: 'Lost', osm: 'way/99' },
  { name: '', _removed: 'x' } as never,
], { 'way/1': [37.8024, -122.4058], 'way/2': [48.8634, 2.3451], 'way/3': [37.79, -122.40], 'way/4': [37.791, -122.401], 'way/256477865': [37.78, -122.42] },
[{ id: 11009073, name: 'Fort Point', kind: 'historic', x: 0, z: 0 }, { id: 1, name: 'Coit Tower (OSM)', kind: 'other', x: 0, z: 0 }], toLatLon)
const idx = new PlaceIndex(places)
const names = (q: string): string[] => idx.find(q).map((p) => p.name)

describe('landmark search', () => {
  it('normalizes accents, case, punctuation and camelCase', () => {
    expect(normalize('Église Saint-Eustache')).toBe('eglise saint eustache')
    expect(normalize('coitTower')).toBe('coit tower')
    expect(normalize("Ripley's")).toBe('ripleys')
  })
  it('keeps every entry, duplicates and unnamed ones too, and drops tombstones', () => {
    expect(places.filter((p) => p.name === 'Golden Gateway Commons house')).toHaveLength(2)
    expect(names('')).toContain('restyle towerblock way/256477865')
    // the OSM-named building an entry already claims is not listed twice
    expect(names('')).not.toContain('Coit Tower (OSM)')
    expect(names('')).toContain('Fort Point')
    expect(idx.size).toBe(8)
  })
  it('lists named places alphabetically first when nothing is typed', () => {
    expect(names('').slice(0, 3)).toEqual(['Coit Tower', 'Église Saint-Eustache', 'Fort Point'])
  })
  it('matches word prefixes, accents and punctuation insensitively', () => {
    expect(names('eglise zq')).toEqual([])
    expect(names('eglise saint')[0]).toBe('Église Saint-Eustache')
    expect(names('saint-eust')[0]).toBe('Église Saint-Eustache')
    expect(names('pyr')[0]).toBe('Transamerica Pyramid')
    expect(names('gold comm')).toHaveLength(2)
  })
  it('forgives one typo', () => {
    expect(names('transamerca')[0]).toBe('Transamerica Pyramid')
    // …but only when nothing is spelt that way
    expect(names('coit')).toEqual(['Coit Tower'])
  })
  it('finds by builder, OSM id and file, for debugging', () => {
    expect(names('coitTower')[0]).toBe('Coit Tower')
    expect(names('256477865')).toHaveLength(1)
    expect(names('sights.json')[0]).toBe('Coit Tower')
    expect(names('towerblock')).toHaveLength(1)
  })
  it('ranks a name that starts with the query above one that merely contains it', () => {
    expect(names('tower')[0]).toBe('Coit Tower')
    expect(names('tower')).toContain('restyle towerblock way/256477865')
  })
  it('says where each is, and when it is not placed', () => {
    const lost = idx.find('lost')[0]
    expect(lost.lat).toBeUndefined()
    expect(lost.detail).toContain('not placed')
    const coit = idx.find('coit')[0]
    expect([coit.lat, coit.lon]).toEqual([37.8024, -122.4058])
    expect(coit.detail).toContain('san-francisco/sights.json')
  })
  it('offers typed coordinates as a place', () => {
    const p = idx.find('37.80, -122.41')[0]
    expect([p.lat, p.lon]).toEqual([37.8, -122.41])
  })
})
