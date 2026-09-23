/**
 * What grows inside San Francisco's parks (city/park-planting.ts).
 *
 * The city's street tree register stops at the railings, and the two places the rider will spend most of a
 * ride are precisely the two the register knows nothing about. Both were planted, deliberately and within
 * living memory, on bare sand:
 *
 *   * **Golden Gate Park** — five kilometres of it, Stanyan Street to Ocean Beach. William Hammond Hall and
 *     John McLaren planted it out of dunes with the three trees that would hold sand: Monterey cypress,
 *     Monterey pine and blue gum. The east end (Stanyan to the Conservatory, the oldest planting) is the
 *     densest and the most mixed, with the ornamentals and the flowering trees of a Victorian pleasure
 *     garden under the canopy. The middle opens out: the Music Concourse is a formal square of pollarded
 *     plane and elm around a sunken lawn, and the meadows — Speedway, Lindley, the polo field — are grass
 *     with specimen trees standing alone on them. The west end back towards the ocean is cypress and pine
 *     again, close and wind-shaped, a windbreak more than a wood.
 *   * **The Presidio** — the Army's forest, planted in the 1880s in blocks on the ridges: blue gum and
 *     Monterey cypress and Monterey pine, still standing in rows where they were planted. Its west side
 *     towards Baker Beach and the Golden Gate is the thickest. The north shore — Crissy Field, the marsh,
 *     the airfield — is open ground with cypress windbreaks along its edges, not forest.
 *
 * Everywhere else the rule gives the ordinary city park: oak, laurel, plane and blossom, thin, with the
 * lawns left as lawns. A park that is one species at one spacing reads worse than no trees at all, so every
 * zone here is a mix and the density varies inside it (`clump`).
 *
 * The zones are lat/lon rectangles, converted to local metres once. Rough edges are the point: a Voronoi of
 * seeds or a hand-drawn polygon would both be more precise than the planting they describe.
 */
import type { ParkRule, ParkSpecies, ParkSpot } from '../park-planting.ts'
import type { LatLon, Point } from '../geo.ts'

/** a zone: the lat/lon box it covers, and what grows there in each kind of green */
interface Zone {
  name: string
  lat: [number, number]
  lon: [number, number]
  /** the closed planting: a `wood` polygon, and a `park` one where the zone has nothing else to say */
  wood: ParkSpot
  /**
   * What a `leisure=park` inside this zone gets, where that is NOT forest.
   *
   * Golden Gate Park and the Presidio are drawn as one enormous `leisure=park` each and really are forest
   * inside, so they leave this unset and take `wood`. The hills are not: the zone that has to cover Mount
   * Sutro's eucalyptus also covers Dolores Park and Twin Peaks, which are famous for being open — grass,
   * a view, and a handful of trees round the edge. A zone that means "the woods here are gum" and not "every
   * park here is a wood" sets this, and only the polygons OSM actually tagged `natural=wood` get the forest.
   */
  park?: ParkSpot
  /** what stands on a mown lawn drawn inside it: specimens, far apart */
  lawn: ParkSpot
}

const CYPRESS: ParkSpecies = { form: 'cypress', weight: 1, h: [12, 20] }
const GUM: ParkSpecies = { form: 'eucalyptus', weight: 1, h: [16, 28] }
const PINE: ParkSpecies = { form: 'pine', weight: 1, h: [12, 21] }
const OAK: ParkSpecies = { form: 'oak', weight: 1, h: [10, 17] }
const LAUREL: ParkSpecies = { form: 'laurel', weight: 1, h: [7, 12] }
const PLANE: ParkSpecies = { form: 'plane', weight: 1, h: [11, 18] }
const ELM: ParkSpecies = { form: 'deciduous', weight: 1, h: [11, 18] }
const BLOSSOM: ParkSpecies = { form: 'blossom', weight: 1, h: [5, 8] }
const OLIVE: ParkSpecies = { form: 'olive', weight: 1, h: [5, 9] }
const FERN: ParkSpecies = { form: 'spiky', weight: 1, h: [3, 6] }
const MYRTLE: ParkSpecies = { form: 'myrtle', weight: 1, h: [7, 12] }

/** the same species with another share of the mix */
const w = (s: ParkSpecies, weight: number): ParkSpecies => ({ ...s, weight })

/**
 * Densities. 0.0075 a square metre is a trunk every eleven metres — a closed canopy you cannot see through,
 * which is what the Presidio's west blocks and the deep of Golden Gate Park actually are, and the most
 * park-planting.ts will accept (`MAX_DENSITY`, set by what a 7 × 7 block of tiles can afford). 0.0007 is an
 * open lawn with a specimen tree every forty metres. The clumping then swings each of these up and down by
 * a lot locally, which is where the thickets and the glades come from; what is written here is the average.
 */
const ZONES: Zone[] = [
  {
    // the Presidio's forest, west of Arguello: the Army's planted blocks on the ridges above Baker Beach
    name: 'presidio-forest',
    lat: [37.7880, 37.8055], lon: [-122.4880, -122.4560],
    wood: { density: 0.0075, clump: 0.7, species: [w(CYPRESS, 4), w(GUM, 4), w(PINE, 3), w(OAK, 1), w(LAUREL, 1)] },
    lawn: { density: 0.0011, clump: 0.5, species: [w(CYPRESS, 3), w(PINE, 2), w(OAK, 2), w(OLIVE, 1)] },
  },
  {
    // Crissy Field, the marsh and the airfield: open ground with the cypress windbreaks along its edges
    name: 'presidio-shore',
    lat: [37.8035, 37.8130], lon: [-122.4750, -122.4380],
    wood: { density: 0.0018, clump: 0.85, species: [w(CYPRESS, 4), w(PINE, 2), w(OLIVE, 2), w(MYRTLE, 1)] },
    lawn: { density: 0.0004, clump: 0.6, species: [w(CYPRESS, 2), w(PINE, 1), w(OLIVE, 1)] },
  },
  {
    // the Presidio's east: the Main Post, the Lombard gate, Julius Kahn — forest, but thinner and more mixed
    name: 'presidio-east',
    lat: [37.7885, 37.8060], lon: [-122.4560, -122.4400],
    wood: { density: 0.0060, clump: 0.65, species: [w(GUM, 3), w(CYPRESS, 3), w(PINE, 2), w(OAK, 2), w(LAUREL, 2), w(BLOSSOM, 1)] },
    lawn: { density: 0.0009, clump: 0.5, species: [w(OAK, 3), w(CYPRESS, 2), w(PLANE, 1), w(BLOSSOM, 1)] },
  },
  {
    // Golden Gate Park, the ocean end: Stow Lake west to the beach, cypress and pine shaped by the wind
    name: 'ggp-west',
    lat: [37.7640, 37.7760], lon: [-122.5130, -122.4770],
    wood: { density: 0.0070, clump: 0.6, species: [w(CYPRESS, 5), w(PINE, 4), w(GUM, 2), w(OAK, 1), w(OLIVE, 1)] },
    lawn: { density: 0.0007, clump: 0.55, species: [w(CYPRESS, 3), w(PINE, 2), w(OAK, 1)] },
  },
  {
    // the middle: the Concourse, the museums, Stow Lake — planted, formal, and more open than either end
    name: 'ggp-middle',
    lat: [37.7645, 37.7760], lon: [-122.4770, -122.4640],
    wood: { density: 0.0050, clump: 0.55, species: [w(GUM, 3), w(CYPRESS, 3), w(PINE, 2), w(OAK, 2), w(LAUREL, 2), w(PLANE, 2), w(ELM, 1), w(FERN, 1)] },
    lawn: { density: 0.0008, clump: 0.45, species: [w(PLANE, 3), w(ELM, 2), w(OAK, 2), w(BLOSSOM, 1)] },
  },
  {
    // the east end and the Panhandle: the oldest planting, the densest, and the one with the ornamentals in it
    // (up to the Panhandle's own latitude at its east end, and no wider: the blocks either side are the
    //  Haight and the Richmond, where a small park is a city park)
    name: 'ggp-east',
    lat: [37.7650, 37.7745], lon: [-122.4640, -122.4410],
    wood: { density: 0.0075, clump: 0.6, species: [w(GUM, 4), w(CYPRESS, 3), w(PINE, 2), w(OAK, 3), w(LAUREL, 3), w(PLANE, 2), w(ELM, 1), w(BLOSSOM, 2), w(MYRTLE, 1), w(FERN, 1)] },
    lawn: { density: 0.0010, clump: 0.45, species: [w(OAK, 3), w(PLANE, 2), w(ELM, 2), w(BLOSSOM, 2), w(MYRTLE, 1)] },
  },
  {
    // Mount Sutro, Twin Peaks, Buena Vista, Mount Davidson: the city's other woods, which are blue gum
    name: 'the-hills',
    lat: [37.7380, 37.7720], lon: [-122.4650, -122.4250],
    wood: { density: 0.0068, clump: 0.7, species: [w(GUM, 5), w(CYPRESS, 2), w(PINE, 2), w(OAK, 2), w(LAUREL, 2), w(FERN, 1)] },
    // Dolores, Twin Peaks, Corona Heights, Alamo Square: open, and a gum forest on Dolores Park would be
    // the most obviously wrong thing in the city
    park: { density: 0.0022, clump: 0.6, species: [w(GUM, 2), w(OAK, 3), w(CYPRESS, 2), w(PLANE, 2), w(BLOSSOM, 2), w(LAUREL, 1), w(OLIVE, 1)] },
    lawn: { density: 0.0008, clump: 0.5, species: [w(GUM, 2), w(OAK, 2), w(CYPRESS, 1)] },
  },
  {
    // Lands End, the Sutro Baths, Sutro Heights and the Cliff House above the ocean
    name: 'lands-end',
    lat: [37.7740, 37.7880], lon: [-122.5200, -122.4930],
    wood: { density: 0.0065, clump: 0.75, species: [w(CYPRESS, 5), w(PINE, 3), w(GUM, 2), w(OLIVE, 1)] },
    lawn: { density: 0.0006, clump: 0.6, species: [w(CYPRESS, 3), w(PINE, 1)] },
  },
]

/**
 * The ordinary city park: a square in the Mission, a playground in the Sunset. Thin, mixed, and with its
 * lawn left as lawn — this is the planting the old scatter was tuned to and it was right about it.
 */
const CITY_PARK: ParkSpot = {
  density: 0.0026, clump: 0.5,
  species: [w(OAK, 3), w(LAUREL, 3), w(PLANE, 2), w(CYPRESS, 2), w(BLOSSOM, 2), w(OLIVE, 1), w(MYRTLE, 1), w(PINE, 1)],
}
const CITY_LAWN: ParkSpot = {
  density: 0.0005, clump: 0.5,
  species: [w(OAK, 3), w(PLANE, 2), w(BLOSSOM, 2), w(LAUREL, 1)],
}
/** a wood nobody here has an opinion about: blue gum, like every unplanned wood in this city */
const CITY_WOOD: ParkSpot = {
  density: 0.0060, clump: 0.7,
  species: [w(GUM, 4), w(CYPRESS, 2), w(PINE, 2), w(OAK, 2), w(LAUREL, 1)],
}

/**
 * San Francisco's park rule, in local metres.
 *
 * `grass` is a mown lawn — a meadow in the park, a playing field's surround — and gets the zone's specimen
 * planting, not its forest, which is how the meadows and the Concourse stay open without being listed one
 * by one. `wood` is forest wherever it is drawn. `park` takes the zone's closed planting: inside Golden Gate
 * Park and the Presidio that is right, and the smallest-polygon rule in park-planting.ts hands the lawns
 * drawn on top of it back to `grass`.
 */
export function sfParkRule(toLocal: (g: LatLon) => Point): ParkRule {
  const zones = ZONES.map((zone) => {
    const a = toLocal({ lat: zone.lat[0], lon: zone.lon[0] })
    const b = toLocal({ lat: zone.lat[1], lon: zone.lon[1] })
    return { zone, x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z) }
  })
  return (x, z, kind) => {
    for (const { zone, x0, x1, z0, z1 } of zones) {
      if (x < x0 || x > x1 || z < z0 || z > z1) continue
      if (kind === 'grass') return zone.lawn
      return kind === 'park' && zone.park ? zone.park : zone.wood
    }
    return kind === 'grass' ? CITY_LAWN : kind === 'wood' ? CITY_WOOD : CITY_PARK
  }
}

/** the zones, for the tests and for anything that wants to name where it is standing */
export const SF_PARK_ZONES = ZONES.map((z) => z.name)
