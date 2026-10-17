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
import ZONES from '../../../data/zones/san-francisco.json' with { type: 'json' }

export type Archetype =
  | 'rowhouse' | 'marinaHouse' | 'apartment' | 'chinatown' | 'loft' | 'prewarOffice' | 'tower' | 'modern'
  | 'retailBox' | 'civic' | 'church' | 'hotel' | 'pier' | 'midcentury' | 'contemporary' | 'edwardianHouse'
  | 'apartmentTower' | 'presidio' | 'presidioBrick' | 'presidioStucco' | 'capeCod' | 'wharf'

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
  /**
   * The Assessor's record of the parcels inside it (tools/sf-parcels.ts), where there is one: the year built
   * (1900 is the Assessor's "before the 1906 fire"), the use (SRES single-family, MRES multi-family, COMM, COMO
   * office, COMR retail, COMH hotel, IND, GOVT…), and the construction type (A steel frame, B reinforced
   * concrete, C masonry, D wood frame).
   */
  record?: { year?: number; stories?: number; units: number; use?: string; construction?: string; parcels: number }
}

/** The city's building eras, by the year it was built. */
export type Era = 'victorian' | 'edwardian' | 'interwar' | 'midcentury' | 'modern'
export const eraOf = (year: number): Era =>
  year <= 1905 ? 'victorian' : year <= 1924 ? 'edwardian' : year <= 1945 ? 'interwar' : year <= 1979 ? 'midcentury' : 'modern'

const RESIDENTIAL = new Set<District>(['russian', 'nob', 'pacific', 'cowhollow', 'marina', 'western', 'hayes', 'polk',
  'telegraph', 'northbeach', 'japantown', 'fortmason'])
const DOWNTOWN = new Set<District>(['fidi', 'rincon', 'soma', 'yerbabuena', 'embarcadero', 'unionsquare'])

/**
 * Every rule carries a short name, and the name travels with the building into docs/sf-archetypes.csv at bake
 * time. That is what makes a wrong style fixable in bulk (user, 2026-09-22: "I hope we recorded which buildings
 * were refaced and by which method so that we can fix ones that are consistently wrong"): the answer to "why is
 * this a glass tower" is one column, and every other building that rule touched is one grep away.
 */
export function archetypeOf(f: Features): { archetype: Archetype; district: District; rule: string } {
  const district = districtOf(f.lat, f.lon)
  const t = f.tags
  const h = f.height ?? (f.levels !== undefined ? f.levels * 3.3 : 10)
  const a = (archetype: Archetype, rule: string): { archetype: Archetype; district: District; rule: string } => ({ archetype, district, rule })

  /*
   * THE PRESIDIO AND GOLDEN GATE PARK (owner, 2026-10-02): "colonial-style buildings … white with gabled red tile
   * roofs — simple buildings, obviously government-owned, built as military housing mostly … some stretches of the
   * presidio buildings are brick, like around the walt disney museum. There are no tenements or victorians or normal
   * city buildings in these areas." Inside either park's real outline (the `buildings: 'presidio'` zones), whatever
   * the lot and height say; the Main Post's barracks row in brick. A tower is left to the rules below (there are none
   * to speak of; the museums are landmark models).
   */
  if (h <= 30 && inBuiltZone('presidio', f.lat, f.lon)) return a(presidioLook(f.lat, f.lon), presidioRule(f.lat, f.lon))
  /*
   * FORT MASON, outside the zones (Presidio research, 2026-10-17): the Army's post on the bluff north of Bay Street,
   * the one former-military neighbourhood just outside the Presidio that photographs as the Presidio does — Upper
   * Fort Mason's white clapboard officers' quarters and barracks (Mapillary 869075771406569, 853882468804038,
   * 667682784022755) and Lower Fort Mason's cream stucco, red-tile piers sheds (1479423183264580). The district rules
   * had them as Victorians and flats. (The Presidio's other edges — Lyon Street, West Pacific, Sea Cliff, Lake Street —
   * are ordinary city houses: 198042566116258, 1071199301854676, 1541293026853279.)
   */
  if (h <= 30 && inFortMason(f.lat, f.lon)) {
    return f.area > 800 ? a('presidioStucco', 'fort-mason-sheds') : a('presidio', 'fort-mason-quarters')
  }
  /*
   * SAUSALITO (owner, 2026-10-02: "a very different architectural style, many low stucco Spanish colonial buildings,
   * not big boxy buildings"): the white stucco and red tile of the Presidio's revival for most, pastel stucco houses
   * for the rest — never the city's flats, offices or Victorians.
   */
  if (h <= 30 && inBuiltZone('mediterranean', f.lat, f.lon)) {
    // …but not MARINSHIP: the wartime shipyard's sheds and warehouses along the north waterfront (the Bay Model's is
    // 26 000 m²) came out as pink palazzi under acres of tile (Sausalito audit, 2026-10-05). A footprint past 2000 m²
    // in a town of houses is a shed, plain and flat-roofed.
    if (f.area > 2000) return a('retailBox', 'sausalito-marinship')
    /*
     * …and its houses are CAPE COD and MODERN (owner, 2026-10-06: "it doesn't have the edwardian/victorian houses.
     * instead it's much more cape cod style and modern style"): shingled gabled houses for most, flat-roofed modern ones
     * on the hillsides, a few stucco ones left of the old mix.
     */
    return f.roll < 0.55 ? a('capeCod', 'sausalito-capecod') : f.roll < 0.85 ? a('contemporary', 'sausalito-modern') : a('marinaHouse', 'sausalito-stucco')
  }

  /*
   * TIBURON AND BELVEDERE (museum census, 2026-10-05): a waterfront village and a hillside of houses, drawn with the
   * city's mix as flats, Victorians and tenements. Pastel stucco houses for most and plain modern ones for the rest
   * (the hillsides are mostly post-war); a big footprint is a shed or a store, flat-roofed. Not Sausalito's Spanish
   * revival: the two towns look different.
   */
  if (h <= 30 && inBuiltZone('marin', f.lat, f.lon)) {
    if (f.area > 2000) return a('retailBox', 'marin-store')
    return f.roll < 0.35 ? a('contemporary', 'marin-modern') : a('marinaHouse', 'marin-house')
  }

  /*
   * TREASURE ISLAND (owner, 2026-10-02: "YB Island and Treasure Island … need a lot of work"): the Navy's island,
   * filled since 1940 with plain stucco quarters and, since 2020, new mid-rise blocks — never the city's brick lofts,
   * Victorians or tenements, which the district rules gave it. The Exposition's survivors are landmark models.
   */
  if (h <= 40 && inBuiltZone('navy', f.lat, f.lon)) {
    return h <= 12 ? a('marinaHouse', 'treasure-island-quarters') : a('contemporary', 'treasure-island-new')
  }

  // what the mapper said, when they said anything
  if (t.amenity === 'place_of_worship' || /^(church|cathedral|chapel|synagogue|temple)$/.test(t.building ?? '')) return a('church', 'worship')
  if (t.building === 'parking' || t.amenity === 'parking') return a('retailBox', 'parking')
  // PG&E's substations (Stations E, G, I, J, K…): windowless masonry blocks behind louvres, never flats with shopfronts
  // (they came out as `sfapartment`; substation census 2026-10-05)
  if (t.power === 'substation' || t.power === 'plant') return a('loft', 'power-substation')
  if (t.man_made === 'pier' || /^Pier \d+/.test(t.name ?? '')) return a('pier', 'pier-tag')
  if (/^(civic|government|public|townhall|museum)$/.test(t.building ?? '') || t.amenity === 'townhall') return a('civic', 'civic-tag')

  const rec = f.record
  const era = rec?.year ? eraOf(rec.year) : undefined
  const use = rec?.use ?? ''
  const wood = rec?.construction === 'D' || rec?.construction === 'WOO'
  const masonry = rec?.construction === 'C'

  /*
   * A block of flats is not an office block, however tall it is. The height rule below sent every tower to
   * `tower` and so to the glass curtain wall, which put downtown on top of Russian Hill, Nob Hill and the
   * Marina — the crests where San Francisco's post-war apartment towers actually stand (user, 2026-09-22:
   * "the style of The Royal Towers and nearby buildings is very wrong"). The Assessor says MRES, and OSM
   * often says apartments; either is enough.
   */
  const homes = use === 'MRES' || t.building === 'apartments' || t.building === 'residential'
  // (over 3000 m2 is not a tower but a redevelopment slab, which the superblock rule below already handles)
  if (homes && h >= 30 && f.area <= 3000 && !DOWNTOWN.has(district)) return a('apartmentTower', 'residential-tower')

  // height decides first: nothing over 60 m is anything but a tower, and downtown the line is lower
  if (h >= 60 || (h >= 40 && DOWNTOWN.has(district))) {
    // the pre-war office: the Russ, the Shell, the Hunter-Dulin — by its date where the record has one, else by
    // being narrow and under 90 m on the old downtown grid
    if (era ? era === 'victorian' || era === 'edwardian' || era === 'interwar'
      : (district === 'fidi' || district === 'unionsquare') && h < 90 && f.area < 1100) return a(use === 'COMH' ? 'hotel' : 'prewarOffice', 'prewar-office-tall')
    return a('tower', 'tall')
  }
  if (use === 'COMH' && h >= 20) return a('hotel', 'hotel-use')
  if (district === 'chinatown' && h < 26 && (!era || era === 'edwardian' || era === 'victorian' || era === 'interwar')) return a('chinatown', 'chinatown')
  /*
   * FISHERMAN'S WHARF (owner, 2026-10-16: "the feel of Fisherman's Wharf, with the unique buildings, restaurants,
   * stores, and decorations … It does NOT need to be a perfect copy"): the low restaurants and gift shops of Jefferson,
   * Beach and Taylor came out as SoMa's brick lofts and the city's flats, lettered PHARMACY and LAUNDRY. Every era —
   * the Wharf's 1960s-70s tourist blocks are as much its look as the 1900s ones. Only the strip itself (WHARF_CORE:
   * North Point to the water, Hyde to Powell — the nearest-seed district runs up Russian Hill and out to Alcatraz),
   * and only the small ones: the Cannery, the Anchorage and the Pier 45 sheds (over 1 500 m2) stay brick. Pier 39 is
   * landmark models and left out of the box. Landmarks, piers, churches and civic buildings are decided above.
   */
  if (district === 'wharf' && h < 26 && f.area <= 1500 && inWharfCore(f.lat, f.lon)) return a('wharf', 'wharf')

  // what the record says, where it says it
  if (era) {
    const house = use === 'SRES' || (use === 'MRES' && (rec!.units <= 4 || h <= 13))
    if (era === 'victorian' && wood && house && h <= 16) return a('rowhouse', 'victorian-house')
    if (era === 'edwardian' && house && h <= 16) return a('edwardianHouse', 'edwardian-house')
    if (era === 'interwar' && house && h <= 13) return a(wood && district !== 'marina' && district !== 'cowhollow' && district !== 'sunset' && f.roll < 0.35 ? 'rowhouse' : 'marinaHouse', 'interwar-house')
    // a post-war house — Golden Gate Heights, the outer Sunset, the Excelsior — is stucco, never a Victorian: with no rule
    // of its own it fell through to the 25-foot-lot default and was drawn as a painted rowhouse (owner's photos of
    // Golden Gate Heights, 2026-10-06)
    if ((era === 'midcentury' || era === 'modern') && house && h <= 13) return a(era === 'modern' && f.roll < 0.4 ? 'contemporary' : 'marinaHouse', 'postwar-house')
    if (use === 'IND' || ((masonry || use === 'COMM') && f.area > 500 && (era === 'victorian' || era === 'edwardian' || era === 'interwar')
      && (district === 'soma' || district === 'yerbabuena' || district === 'rincon' || district === 'embarcadero' || district === 'northbeach' || district === 'wharf' || district === 'fidi'))) return a('loft', 'industrial-loft')
    if (era === 'midcentury' && h >= 12) return a(rec!.construction === 'B' && f.area > 1500 ? 'modern' : 'midcentury', 'midcentury-tall')
    if (era === 'modern' && h >= 10) return a(f.area > 3000 && h >= 20 && DOWNTOWN.has(district) ? 'modern' : 'contemporary', 'modern-tall')
    if ((use === 'MRES' || use === 'COMR') && h > 13 && era !== 'midcentury') return a(DOWNTOWN.has(district) && use !== 'MRES' ? 'prewarOffice' : 'apartment', 'mres-comr-mid')
    if (use === 'COMO' && h >= 15) return a(era === 'midcentury' || era === 'modern' ? 'contemporary' : 'prewarOffice', 'office-use')
  }

  // the 1960s–80s superblocks: Golden Gateway and Embarcadero Center, the Western Addition's redevelopment
  if (f.area > 3000 && h >= 20 && (district === 'embarcadero' || district === 'fidi' || district === 'western' || district === 'japantown')) return a('modern', 'superblock')
  if (district === 'civic' && f.area > 2000 && h >= 15) return a('civic', 'civic-big')
  if (t.tourism === 'hotel' && h >= 20) return a('hotel', 'hotel-tag')
  // the big low box: a supermarket, a garage, a showroom
  if (h <= 8 && f.area > 1500) return a('retailBox', 'big-low-box')
  // SoMa and the old waterfront: brick warehouses and lofts
  if ((district === 'soma' || district === 'yerbabuena' || district === 'rincon' || district === 'embarcadero'
    || (district === 'northbeach' && f.lon > -122.405) || district === 'wharf') && f.area > 500) return a('loft', 'soma-warehouse')
  /*
   * The old commercial city under 20 m — Jackson Square, Commercial and Clay Streets round the Transamerica Pyramid:
   * 1906-1915 brick and terracotta, shops below, never flats. With no rule of their own they fell to the downtown
   * default and were drawn as bay-windowed apartments (owner, 2026-10-15: "the view looks different"). The
   * Financial District only: across all of downtown it also turned 159 SoMa brick lofts to terracotta.
   */
  if (district === 'fidi' && era && era !== 'midcentury' && era !== 'modern' && use && use !== 'MRES' && use !== 'SRES') {
    return a(masonry || use === 'IND' ? 'loft' : 'prewarOffice', 'downtown-commercial-lowrise')
  }
  if (DOWNTOWN.has(district)) return a(h >= 20 ? 'prewarOffice' : district === 'soma' ? 'loft' : 'apartment', 'downtown-default')
  if (district === 'tenderloin') return a(h >= 9 ? 'apartment' : 'rowhouse', 'tenderloin')
  // the 25-foot lot: a house, of the Victorian city or of the Marina's 1930s
  // the Sunset and Golden Gate Heights: the 1920s-50s stucco rows, not Victorians (owner's photos, 2026-10-06)
  if (district === 'sunset' && h <= 13) return a('marinaHouse', 'sunset-house')
  if (f.frontage <= 11 && h <= 15) {
    if (district === 'marina') return a('marinaHouse', 'marina-lot')
    if (district === 'cowhollow' && f.roll < 0.4) return a('marinaHouse', 'cowhollow-lot')
    return a('rowhouse', 'narrow-lot')
  }
  if (RESIDENTIAL.has(district) || district === 'wharf') return a(h <= 9 && f.area < 400 ? 'rowhouse' : 'apartment', 'residential-district')
  return a('apartment', 'default')
}

/** the zones that say what is built in them (ZoneProps.buildings), in [lat, lon] */
const BUILT = (ZONES as { zones: { props: { buildings?: string }; ring: number[][] }[] }).zones.filter((z) => z.props.buildings)
function inBuiltZone(kind: string, lat: number, lon: number): boolean {
  for (const z of BUILT) {
    if (z.props.buildings !== kind) continue
    let hit = false
    const r = z.ring
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      if ((r[i][0] > lat) !== (r[j][0] > lat) && lon < ((r[j][1] - r[i][1]) * (lat - r[i][0])) / (r[j][0] - r[i][0]) + r[i][1]) hit = !hit
    }
    if (hit) return true
  }
  return false
}
/**
 * Fisherman's Wharf's tourist strip, [lat, lon]: North Point Street (37.8064) to the water (37.8115), Hyde Street
 * (-122.4232) to Powell (-122.4085), less Pier 39, 41 and 43 (north of Jefferson, east of -122.4125).
 */
const WHARF_CORE = { s: 37.8064, n: 37.8115, w: -122.4232, e: -122.4085, piers: { s: 37.8086, w: -122.4125 } }
const inWharfCore = (lat: number, lon: number): boolean =>
  lat >= WHARF_CORE.s && lat <= WHARF_CORE.n && lon >= WHARF_CORE.w && lon <= WHARF_CORE.e
  && !(lat >= WHARF_CORE.piers.s && lon > WHARF_CORE.piers.w)
/** the Main Post's brick barracks along Montgomery Street, by the Walt Disney Family Museum */
const MAIN_POST = { lat: 37.8013, lon: -122.4590 }
const near = (lat: number, lon: number, c: { lat: number; lon: number }, m: number): boolean =>
  Math.hypot((lat - c.lat) * 111_000, (lon - c.lon) * 111_000 * COS) < m

/*
 * THE PRESIDIO'S LOOKS, by neighbourhood (owner, 2026-10-17: "in the presidio area, buildings are unique bright white
 * clapboard with red roofs, OR brick with red roofs"; the areas from Mapillary panoramas, 2023 — the ids are cited
 * at each). Three looks and the post-war blocks; anything not named here is the white clapboard, which is also what
 * Fort Baker (Commons "Fort Baker (Sausalito, CA).jpg"), Fort Barry, Angel Island and the Letterman and Funston
 * Avenue rows are. Areas are boxes and circles in [lat, lon], checked in order.
 */
type Area = { box: [number, number, number, number] } | { at: [number, number]; r: number }
const inArea = (lat: number, lon: number, x: Area): boolean => 'box' in x
  ? lat > x.box[0] && lat < x.box[1] && lon > x.box[2] && lon < x.box[3]
  : near(lat, lon, { lat: x.at[0], lon: x.at[1] }, x.r)
const PRESIDIO_AREAS: { name: string; area: Area; look: Archetype }[] = [
  // the WHERRY and BAKER BEACH apartments (1950s): plain grey-tan two- and three-storey blocks, not the Army's
  // houses at all (Mapillary 1046526822991060 Pershing Drive, 255803160430612 Johnstone Drive) — the city's plain
  // stucco, as Treasure Island's quarters of the same years are (not `midcentury`'s glazed ground floors)…
  { name: 'presidio-baker-beach-apartments', area: { box: [37.7895, 37.7945, -122.4830, -122.4745] }, look: 'marinaHouse' },
  // …and the Wallen Court Wherry block below East Housing (1312597209687929, 1001662070825054)
  { name: 'presidio-wallen-wherry', area: { at: [37.7945, -122.4566], r: 120 }, look: 'marinaHouse' },
  // the Main Post's brick: the Montgomery Street barracks and the Riley Avenue duplexes (306302501733129,
  // 1073064896995947), under red roofs
  { name: 'presidio-main-post', area: { at: [MAIN_POST.lat, MAIN_POST.lon], r: 220 }, look: 'presidioBrick' },
  // the Hardie Avenue / Barnard Avenue barracks south of it (1255041638546569, 810089917175168)
  { name: 'presidio-hardie-barracks', area: { at: [37.7968, -122.4580], r: 70 }, look: 'presidioBrick' },
  // EAST HOUSING (owner: "Housing on Liggett Ave … are all uniform brick … also Portola St"): the 1930s Georgian
  // Revival brick duplexes of Liggett, Clarke, Sanches, Morton, Rodriguez and Portola under red-brown roofs
  // (797055755405312, 237668289059428, 2366241453559394, 3500112376932569). Not Simonds Loop and Ruger Street to its
  // east, which are white frame cottages (6099618843476146, 3582064655453272).
  { name: 'presidio-east-housing', area: { box: [37.7922, 37.7975, -122.4565, -122.4500] }, look: 'presidioBrick' },
  // Fort Scott's brick: Wright Loop, Pope and Todd Streets (809997674114962, 657798199149613, 287865083719649)
  { name: 'fort-scott-brick', area: { at: [37.7983, -122.4737], r: 100 }, look: 'presidioBrick' },
  // FORT WINFIELD SCOTT round its parade ground: Mission Revival barracks and officers' rows, white stucco and red
  // tile (1298821577386783 Ralston, 1359139001338251 Upton, 1324647778487839 Greenough, 1019003606126178 Kinzey,
  // 1419593392151266 Pilots' Row)
  { name: 'fort-scott-mission', area: { box: [37.7990, 37.8075, -122.4795, -122.4680] }, look: 'presidioStucco' },
  // the Amatury Loop housing: cream stucco under red tile (1349986875932665, 296268076301593)
  { name: 'presidio-amatury', area: { at: [37.7960, -122.4683], r: 130 }, look: 'presidioStucco' },
]
/** Golden Gate Park's share of the zones: its lodges and stables are stucco and red tile, not frame houses */
const inGGP = (lat: number, lon: number): boolean => lat < 37.7760 && lat > 37.7630 && lon < -122.4520 && lon > -122.5120
function presidioArea(lat: number, lon: number): { name: string; look: Archetype } | undefined {
  for (const x of PRESIDIO_AREAS) if (inArea(lat, lon, x.area)) return x
  if (inGGP(lat, lon)) return { name: 'ggp-park', look: 'presidioStucco' }
  return undefined
}
const presidioLook = (lat: number, lon: number): Archetype => presidioArea(lat, lon)?.look ?? 'presidio'
const presidioRule = (lat: number, lon: number): string => presidioArea(lat, lon)?.name ?? 'presidio-park'
/** Fort Mason (outside the zones): north of Bay Street, Laguna Street to Van Ness — the Safeway at Marina and Laguna left out */
const inFortMason = (lat: number, lon: number): boolean => lat > 37.8040 && lat < 37.8095 && lon > -122.4325 && lon < -122.4250

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
  edwardianHouse: 'edwardian',
  apartmentTower: 'towerblock',
  presidio: 'presidio',
  presidioBrick: 'presidioBrick',
  presidioStucco: 'presidioStucco',
  capeCod: 'capecod',
  wharf: 'wharf',
  midcentury: 'bauhaus',
  contemporary: 'bauhaus',
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
export function classifySF(b: { tags: Record<string, string>; ring: { x: number; z: number }[]; height?: number; levels?: number; lat: number; lon: number; id: number; area: number; record?: Features['record'] }): { archetype: Archetype; style: StyleId; district: District; rule: string } | null {
  if (b.tags['building:material']) return null
  const { frontage, depth } = lotSides(b.ring)
  const roll = ((Math.imul(b.id ^ 0x2c1b3c6d, 0x297a2d39) >>> 0) % 1000) / 1000
  const { archetype, district, rule } = archetypeOf({ lat: b.lat, lon: b.lon, height: b.height, levels: b.levels, area: b.area, frontage, depth, tags: b.tags, roll, record: b.record })
  return { archetype, style: STYLE_OF[archetype], district, rule }
}
