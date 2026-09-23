/**
 * The cities. Adding one is an entry here and a re-bake — which is what "anywhere on the planet" means in
 * practice: anywhere someone has run `npm run bake`, and doing so is one command.
 *
 * Each is a small box rather than a whole city, because a bake grows with area and because a rider covers a
 * few kilometres in half an hour. A square kilometre or two of somewhere dense is a far better ride than
 * twenty kilometres of somewhere that is mostly car parks.
 *
 * `styles` is the neighbourhood's architectural mix, and it is the single most important field here: it is
 * what stops every city on earth from looking like the same city. OSM almost never tags architectural style,
 * so this is the local knowledge the data cannot supply. The weights are relative.
 */
import type { StyleId } from '../src/city/facade.ts'

export interface CitySpec {
  id: string
  name: string
  /** where the ride starts, and the origin of the local metre grid */
  centre: { lat: number; lon: number }
  /** half-width of the box, in metres */
  radius: number
  /**
   * A box that is not a square round the centre: how far it reaches from the centre on each side, metres.
   * Absent sides are `radius`. The centre stays the origin of the metre grid and where the ride starts.
   */
  box?: { west?: number; east?: number; south?: number; north?: number }
  /**
   * The DETAIL box: how far the buildings, their facades and the street furniture are modelled, when that is
   * smaller than the box itself. The box reaches the places worth riding to — San Francisco's goes out to both
   * bridges — while the detail stays over the city (nobody wants Oakland's buildings baked because the Bay
   * Bridge's far end is in the box). Absent sides fall back to the box's.
   */
  detail?: { west?: number; east?: number; south?: number; north?: number }
  /**
   * What the ground is where OSM mapped nothing — yards, verges, the inside of a block. Most cities are green
   * there; a dry one is not. Painting it concrete makes every courtyard read as a car park.
   */
  ground: 'grass' | 'sand' | 'dirt'
  styles: { id: StyleId; weight: number }[]
  /** regional character from src/city/regions.json; omitted means 'default' */
  region?: string
  /**
   * Landmarks beyond the edge of the city box, drawn on the horizon (render/landmarks.ts). The camera's far
   * plane cannot reach them, so they are sky furniture, not scene meshes. `procedural` names a builder in
   * src/render/landmarks/procedural.ts.
   */
  skyline?: { name: string; lat: number; lon: number; procedural: string; heightM: number; bearing?: number; boost?: number }[]
  note: string
}

export const CITIES: CitySpec[] = [
  {
    id: 'paris-marais',
    region: 'paris',
    skyline: [
      { name: 'Tour Eiffel', lat: 48.8584, lon: 2.2945, procedural: 'eiffelTower', heightM: 330 },
      { name: 'Tour Montparnasse', lat: 48.8421, lon: 2.3220, procedural: 'montparnasse', heightM: 210 },
      // Montmartre is 130 m above the Seine; the basilica stands on it
      { name: 'Sacré-Cœur', lat: 48.8867, lon: 2.3431, procedural: 'sacreCoeur', heightM: 83 },
      { name: 'Panthéon', lat: 48.8462, lon: 2.3464, procedural: 'pantheon', heightM: 83 },
      { name: 'Notre-Dame', lat: 48.8530, lon: 2.3499, procedural: 'notreDame', heightM: 96 },
    ],
    name: 'Le Marais, Paris',
    centre: { lat: 48.8577, lon: 2.3622 },
    radius: 700,
    // east and south past the Bastille, so every street leaving the place goes somewhere (BUGS.md #2): at 700 m
    // the edge cut them all within 150 m of the circle and the ride graph pruned them as dead ends
    box: { east: 1050, south: 900 },
    ground: 'grass',
    styles: [
      // the Marais is mostly OLDER than Haussmann: narrow plastered fronts, shuttered casements, slate roofs
      { id: 'haussmann', weight: 5 },
      { id: 'marais', weight: 4 },
      { id: 'classical', weight: 2 },
    ],
    note: 'Tight medieval street pattern with Haussmann facades over it — the densest junction count of any '
      + 'of these, which makes it the one to test steering on.',
  },
  {
    /*
     * Central Paris (PARIS_EXPAND.md §1): the Étoile and the Trocadéro/Eiffel Tower in the west to past the
     * Bastille in the east (2.378, so every street leaving the place goes somewhere — BUGS.md #2), the Opéra
     * and Saint-Lazare edge in the north, Line 6's viaduct at Cambronne and La Motte-Picquet in the south.
     * About 6.7 × 3.5 km. Centred on the Palais-Royal, so the ride starts in the middle of it.
     */
    id: 'paris-centre',
    region: 'paris',
    skyline: [
      // placeholders on the horizon until each has its model (PARIS_EXPAND §6 step 4); those beyond the box stay
      { name: 'Tour Eiffel', lat: 48.8584, lon: 2.2945, procedural: 'eiffelTower', heightM: 330 },
      { name: 'Tour Montparnasse', lat: 48.8421, lon: 2.3220, procedural: 'montparnasse', heightM: 210 },
      { name: 'Sacré-Cœur', lat: 48.8867, lon: 2.3431, procedural: 'sacreCoeur', heightM: 83 },
      { name: 'Panthéon', lat: 48.8462, lon: 2.3464, procedural: 'pantheon', heightM: 83 },
      { name: 'Notre-Dame', lat: 48.8530, lon: 2.3499, procedural: 'notreDame', heightM: 96 },
    ],
    name: 'Central Paris',
    centre: { lat: 48.8605, lon: 2.3320 },
    radius: 3400,
    box: { west: 3370, east: 3370, north: 1725, south: 1725 },
    ground: 'grass',
    styles: [
      // Haussmann's Paris: the boulevards and the west are his; the older centre keeps the Marais's mix
      { id: 'haussmann', weight: 7 },
      { id: 'classical', weight: 3 },
      { id: 'marais', weight: 1 },
    ],
    note: 'The tourist centre as one rideable city: tiled and streamed (PARIS_EXPAND.md).',
  },
  {
    id: 'brooklyn-heights',
    region: 'new-york',
    name: 'Brooklyn Heights, New York',
    centre: { lat: 40.6962, lon: -73.9950 },
    radius: 700,
    ground: 'grass',
    styles: [
      { id: 'brownstone', weight: 6 },
      { id: 'tenement', weight: 3 },
      { id: 'brick', weight: 1 },
      { id: 'classical', weight: 1 },
    ],
    note: 'A grid of row houses with stoops. The grid is the opposite test from the Marais: long straight '
      + 'runs and square junctions.',
  },
  {
    id: 'chicago-loop',
    region: 'chicago',
    name: 'The Loop, Chicago',
    centre: { lat: 41.8825, lon: -87.6300 },
    radius: 650,
    ground: 'grass',
    styles: [
      { id: 'skyscraper', weight: 4 },
      { id: 'chicago', weight: 4 },
      { id: 'classical', weight: 2 },
      { id: 'brick', weight: 1 },
      { id: 'brutalist', weight: 1 },
    ],
    note: 'Tall buildings on a grid, to see whether the curtain wall holds up and what a street canyon costs '
      + 'in triangles.',
  },
  {
    /*
     * San Francisco at Paris's scale (user, 2026-09-22: "roughly the size of the paris map"): the northeast of
     * the city, from the Palace of Fine Arts and the Marina in the west to the Embarcadero and the Ferry
     * Building in the east, Fisherman's Wharf and the north shore down past Market Street, Civic Center and
     * Alamo Square's Painted Ladies. About 5.6 × 4.5 km. The origin stays on Nob Hill, where the ride starts —
     * the hills are the point: Russian Hill, Telegraph Hill, Pacific Heights all touch 17% and more.
     */
    id: 'san-francisco',
    region: 'san-francisco',
    skyline: [
      // the middle of the main span (between the towers at 37.8141,−122.4772 and 37.8255,−122.4792), N 7° W
      { name: 'Golden Gate Bridge', lat: 37.81980, lon: -122.47822, procedural: 'goldenGateBridge', heightM: 227, bearing: -7.05, boost: 1.15 },
      // on Mount Sutro, 254 m up: the ground under it comes from the terrain tiles, as Montmartre's does
      // the west span's central anchorage, from the bridge's axis in OSM (bearing 40.2°) and the published spans
      { name: 'Bay Bridge', lat: 37.79738, lon: -122.37870, procedural: 'bayBridge', heightM: 160, bearing: 40.24, boost: 1 },
      { name: 'Sutro Tower', lat: 37.75523, lon: -122.45277, procedural: 'sutroTower', heightM: 298 },
    ],
    name: 'San Francisco',
    centre: { lat: 37.7930, lon: -122.4120 },
    radius: 3340,
    /*
     * Out to the places worth riding to (user, 2026-09-22): east to the Bay Bridge's Oakland touchdown, west and
     * north to the Golden Gate and its Marin end. Most of that is water, and the detail box below keeps the
     * buildings over the city itself — Oakland is in the box only as roads and shoreline.
     */
    box: { west: 9800, east: 7800, north: 4600, south: 3600 },
    /*
     * West to the ocean and south past Golden Gate Park. The park runs five kilometres from Stanyan Street to
     * Ocean Beach and the Presidio fills the north-west corner; a game whose players spend their time riding
     * and running in parks cannot stop a third of the way along the biggest one (user, 2026-09-22: "I
     * definitely want to walk or run through the big parks"). The detail box now reaches the same way west,
     * because the parks have buildings in them worth drawing. Some of Marin and Daly City fall inside the
     * corners; nothing is spent on them.
     */
    detail: { west: 9800, east: 2400, north: 2400, south: 3600 },
    ground: 'grass',
    styles: [
      { id: 'victorian', weight: 5 },
      { id: 'brownstone', weight: 2 },
      { id: 'classical', weight: 2 },
      { id: 'skyscraper', weight: 1 },
    ],
    note: 'The hills. A grid laid over terrain that does not care about grids, which is the whole point of '
      + 'having elevation at all — the streets here touch 17% and riding them flat would be a lie about the '
      + 'place rather than a simplification of it.',
  },
]

export const city = (id: string): CitySpec => {
  const c = CITIES.find((x) => x.id === id)
  if (!c) throw new Error(`unknown city ${id}; known: ${CITIES.map((x) => x.id).join(', ')}`)
  return c
}

/** How far the box reaches from the centre on each side, in metres, plus `pad` all round. */
export function extentOf(c: Pick<CitySpec, 'radius' | 'box'>, pad = 0): { west: number; east: number; south: number; north: number } {
  return {
    west: (c.box?.west ?? c.radius) + pad, east: (c.box?.east ?? c.radius) + pad,
    south: (c.box?.south ?? c.radius) + pad, north: (c.box?.north ?? c.radius) + pad,
  }
}

/** The DETAIL extents: where buildings and facades are modelled (the box's, where there is no detail box). */
export function detailOf(c: Pick<CitySpec, 'radius' | 'box' | 'detail'>, pad = 0): { west: number; east: number; south: number; north: number } {
  const b = extentOf(c, 0)
  const d = c.detail
  return {
    west: (d?.west ?? b.west) + pad, east: (d?.east ?? b.east) + pad,
    south: (d?.south ?? b.south) + pad, north: (d?.north ?? b.north) + pad,
  }
}

/** The detail box as a lat/lon rectangle. */
export function detailBboxOf(c: Pick<CitySpec, 'radius' | 'box' | 'centre' | 'detail'>, pad = 0): { south: number; north: number; west: number; east: number } {
  const e = detailOf(c, pad)
  const mLat = 111_320
  const mLon = 111_320 * Math.cos((c.centre.lat * Math.PI) / 180)
  return {
    south: c.centre.lat - e.south / mLat, north: c.centre.lat + e.north / mLat,
    west: c.centre.lon - e.west / mLon, east: c.centre.lon + e.east / mLon,
  }
}

/** The box as a lat/lon rectangle, `pad` metres bigger all round. */
export function bboxOf(c: Pick<CitySpec, 'radius' | 'box' | 'centre'>, pad = 0): { south: number; north: number; west: number; east: number } {
  const e = extentOf(c, pad)
  const mLat = 111_320
  const mLon = 111_320 * Math.cos((c.centre.lat * Math.PI) / 180)
  return {
    south: c.centre.lat - e.south / mLat, north: c.centre.lat + e.north / mLat,
    west: c.centre.lon - e.west / mLon, east: c.centre.lon + e.east / mLon,
  }
}
