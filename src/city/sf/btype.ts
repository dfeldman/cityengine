/**
 * What kind of building an SF building is, when OSM says only `building=yes` (SF_PLAN.md §2). Nine in ten say
 * nothing else — but three in four carry a measured height, and the city's pattern is legible from geometry and
 * place: a 25-foot lot three storeys high on Russian Hill is a Victorian; the same height in the Marina is a
 * 1930s stucco house; a big six-storey block in SoMa is a brick loft; anything over 60 m is a tower.
 *
 * Pure, and run at bake time (tools/bake.ts), so a building is the same every session. The style each
 * archetype wears is `STYLE_OF` — the existing styles for now, the SF styles (stucco, sfapartment, chinatown)
 * as they are painted (SF_PLAN.md §3).
 */
import type { StyleId } from '../facade.ts'
import DISTRICTS from './districts.json' with { type: 'json' }

export type Archetype =
  | 'rowhouse' | 'marinaHouse' | 'apartment' | 'chinatown' | 'loft' | 'prewarOffice' | 'tower' | 'modern'
  | 'retailBox' | 'civic' | 'church' | 'hotel' | 'pier'

export type District = keyof typeof DISTRICTS.districts

const seeds: { d: District; lat: number; lon: number }[] = []
for (const [d, v] of Object.entries(DISTRICTS.districts)) for (const [lat, lon] of v.seeds) seeds.push({ d: d as District, lat, lon })
const COS = Math.cos((37.79 * Math.PI) / 180)

/** The district a point is in: its nearest seed's. */
export function districtOf(lat: number, lon: number): District {
  let best = seeds[0]
  let bd = Infinity
  for (const s of seeds) {
    const d = (s.lat - lat) ** 2 + ((s.lon - lon) * COS) ** 2
    if (d < bd) { bd = d; best = s }
  }
  return best.d
}

export interface Features {
  lat: number
  lon: number
  /** metres, measured (the import) or from levels; undefined when neither */
  height?: number
  levels?: number
  /** footprint area, m² */
  area: number
  /** the short and long sides of the footprint's smallest enclosing rectangle, m: the lot's width and depth */
  frontage: number
  depth: number
  tags: Record<string, string>
  /** a 0..1 from the building's id, for the choices the data leaves open */
  roll: number
}

const RESIDENTIAL = new Set<District>(['russian', 'nob', 'pacific', 'cowhollow', 'marina', 'western', 'hayes', 'polk',
  'telegraph', 'northbeach', 'japantown', 'fortmason'])
const DOWNTOWN = new Set<District>(['fidi', 'rincon', 'soma', 'yerbabuena', 'embarcadero', 'unionsquare'])

export function archetypeOf(f: Features): { archetype: Archetype; district: District } {
  const district = districtOf(f.lat, f.lon)
  const t = f.tags
  const h = f.height ?? (f.levels !== undefined ? f.levels * 3.3 : 10)
  const a = (archetype: Archetype): { archetype: Archetype; district: District } => ({ archetype, district })

  // what the mapper said, when they said anything
  if (t.amenity === 'place_of_worship' || /^(church|cathedral|chapel|synagogue|temple)$/.test(t.building ?? '')) return a('church')
  if (t.building === 'parking' || t.amenity === 'parking') return a('retailBox')
  if (t.man_made === 'pier' || /^Pier \d+/.test(t.name ?? '')) return a('pier')
  if (/^(civic|government|public|townhall|museum)$/.test(t.building ?? '') || t.amenity === 'townhall') return a('civic')

  // height decides first: nothing over 60 m is anything but a tower, and downtown the line is lower
  if (h >= 60 || (h >= 40 && DOWNTOWN.has(district))) {
    // the pre-war office: narrow, under 90 m, on the old downtown grid (the Russ, the Shell, the Hunter-Dulin)
    if ((district === 'fidi' || district === 'unionsquare') && h < 90 && f.area < 1100) return a('prewarOffice')
    return a('tower')
  }
  // the 1960s–80s superblocks: Golden Gateway and Embarcadero Center, the Western Addition's redevelopment
  if (f.area > 3000 && h >= 20 && (district === 'embarcadero' || district === 'fidi' || district === 'western' || district === 'japantown')) return a('modern')
  if (district === 'civic' && f.area > 2000 && h >= 15) return a('civic')
  if (t.tourism === 'hotel' && h >= 20) return a('hotel')
  if (district === 'chinatown' && h < 26) return a('chinatown')
  // the big low box: a supermarket, a garage, a showroom
  if (h <= 8 && f.area > 1500) return a('retailBox')
  // SoMa and the old waterfront: brick warehouses and lofts
  if ((district === 'soma' || district === 'yerbabuena' || district === 'rincon' || district === 'embarcadero'
    || (district === 'northbeach' && f.lon > -122.405) || district === 'wharf') && f.area > 500) return a('loft')
  if (DOWNTOWN.has(district)) return a(h >= 20 ? 'prewarOffice' : district === 'soma' ? 'loft' : 'apartment')
  if (district === 'tenderloin') return a(h >= 9 ? 'apartment' : 'rowhouse')
  // the 25-foot lot: a house, of the Victorian city or of the Marina's 1930s
  if (f.frontage <= 11 && h <= 15) {
    if (district === 'marina') return a('marinaHouse')
    if (district === 'cowhollow' && f.roll < 0.4) return a('marinaHouse')
    return a('rowhouse')
  }
  if (RESIDENTIAL.has(district) || district === 'wharf') return a(h <= 9 && f.area < 400 ? 'rowhouse' : 'apartment')
  return a('apartment')
}

/** The style each archetype wears (SF_PLAN.md §3). */
export const STYLE_OF: Record<Archetype, StyleId> = {
  rowhouse: 'victorian',
  marinaHouse: 'stucco',
  apartment: 'sfapartment',
  chinatown: 'chinatown',
  loft: 'brick',
  prewarOffice: 'chicago',
  tower: 'skyscraper',
  modern: 'brutalist',
  retailBox: 'bauhaus',
  civic: 'classical',
  church: 'classical',
  hotel: 'classical',
  pier: 'classical',
}

/** The smallest enclosing rectangle's sides, for frontage and depth (a ring in metres). */
export function lotSides(ring: { x: number; z: number }[]): { frontage: number; depth: number } {
  let best = { a: Infinity, s: 0, l: 0 }
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    const L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.5) continue
    const ux = (q.x - p.x) / L
    const uz = (q.z - p.z) / L
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
    for (const r of ring) {
      const u = r.x * ux + r.z * uz
      const v = -r.x * uz + r.z * ux
      u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v)
    }
    const w = u1 - u0
    const d = v1 - v0
    if (w * d < best.a) best = { a: w * d, s: Math.min(w, d), l: Math.max(w, d) }
  }
  return { frontage: best.s, depth: best.l }
}

/** The bake's entry (src/city/building-types.ts): an archetype and its style, or null where a tagged material decides. */
export function classifySF(b: { tags: Record<string, string>; ring: { x: number; z: number }[]; height?: number; levels?: number; lat: number; lon: number; id: number; area: number }): { archetype: Archetype; style: StyleId } | null {
  if (b.tags['building:material']) return null
  const { frontage, depth } = lotSides(b.ring)
  const roll = ((Math.imul(b.id ^ 0x2c1b3c6d, 0x297a2d39) >>> 0) % 1000) / 1000
  const { archetype } = archetypeOf({ lat: b.lat, lon: b.lon, height: b.height, levels: b.levels, area: b.area, frontage, depth, tags: b.tags, roll })
  return { archetype, style: STYLE_OF[archetype] }
}
