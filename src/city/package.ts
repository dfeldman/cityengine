/**
 * What a baked city is, on disk and in memory.
 *
 * The rule Trail Trainer set and this game keeps: **the game touches no network service while it runs.** Everything
 * comes from Overpass once, offline, and ships as a static file. A rider halfway through a session does not
 * want a tile server outage, and a platform that runs on a machine in a garage may not have internet at all.
 *
 * JSON rather than a binary format, for now: a square kilometre of Paris is about a megabyte and gzips to
 * a fraction of that, and being able to read a city package in a text editor while debugging is worth more
 * at this stage than the bytes. If a city ever gets big enough for that to hurt, the geometry arrays are
 * already shaped so they can become typed arrays without touching anything that reads them.
 */
import type { StyleId } from './facade.ts'
import type { PackedTerrain } from './terrain.ts'
import type { RingForm } from './ring-forms.ts'

export interface PackedEdge {
  id: number
  a: number
  b: number
  /** flattened x,z pairs in local metres */
  points: number[]
  surface: 'asphalt' | 'concrete' | 'cobblestone' | 'gravel' | 'dirt' | 'wood' | 'brick'
  /**
   * The CARRIAGEWAY, not the corridor. The pavement is carved out of what OSM calls the street's width
   * rather than added outside it, so that `width + 2 * walk` is the building-to-building corridor and every
   * street that should have a pavement visibly has one. Adding it outside instead made the carriageway fill
   * the gap between the buildings on Paris's narrow streets and squeezed the pavement to nothing.
   */
  width: number
  /** the pavement either side, in metres; 0 on a lane too narrow to have one */
  walk: number
  /**
   * This way runs through open country — a big park, a forest, a nature reserve — and is drawn by the park's
   * rules rather than the street's (city/park-area.ts). Not baked: set per tile as it arrives, from the park
   * polygons the tile carries, so it costs nothing in the package and follows a re-bake automatically.
   */
  park?: boolean
  name?: string
  foot: boolean
  /**
   * A bus lane along a curb (OSM `lanes:bus`, `bus:lanes`, `busway:*`, `psv` the same): 1 the right of a→b, 2 the left,
   * 3 both — painted red (owner, 2026-10-03: "ideally we would also render bus lanes as red").
   */
  busSide?: 1 | 2 | 3
  /** lanes painted by the region (tools/street-paint.ts): 1 the transit lanes down the middle (red), 2 the bike lanes at the kerbs (green) */
  paint?: number
  /** a marked place where a footway crosses a carriageway — drawn as a zebra rather than as pavement */
  crossing?: boolean
  /** ground height at each point of `points`, in metres; absent on a city baked flat */
  heights?: number[]
  /** the OSM `highway` value — what kind of way this is, which decides whether the rider is steered down it */
  kind: string
  /** OSM `service=*`: a parking aisle or a driveway is not a street */
  service?: string
  oneway?: boolean
  /** OSM `layer`, for keeping a bridge and the street under it apart */
  layer?: number
  bridge?: boolean
  tunnel?: boolean
  /**
   * A street tunnel a rider goes through (tools/tunnels.ts): under a hill, a street class, heights straight from
   * mouth to mouth. Ridden and driven like a street, drawn as a tunnel (render/tunnels.ts), never as a street.
   */
  bore?: boolean
  /**
   * A street in a CUT, running down into a tunnel mouth (tools/tunnels.ts): below the ground beside it, so what is
   * drawn along it follows it rather than the ground (city/grade.ts `cutAt`).
   */
  cut?: boolean
  /**
   * A way the REGION drew, not OSM (src/city/sf/bridges.ts `BAY_BIKEWAY`): its heights are fixed, and a model draws
   * it, so nothing else does (render/city.ts).
   */
  authored?: boolean
  /** a FREEWAY way the bike rides (a bridge deck, a ramp the region chose): every other is out of the ride network */
  ridden?: boolean
  /** a TRAIL the bike rides: a footway or path inside a zone with `trails: 'bike'` (Lands End down to Sutro Baths) */
  trail?: boolean
  /** through a building at grade (tunnel=building_passage, covered=yes): rideable, drawn as an arch */
  passage?: boolean
  /** a way the bake lifted onto a bridge's deck (tools/bridges.ts): drawn as a structure, like the bridge */
  ramp?: true
}

export type RoofShape = 'flat' | 'gabled' | 'hipped' | 'pyramidal' | 'skillion' | 'mansard' | 'dome'

export interface PackedBuilding {
  /** the OSM way id, which is also the seed: a re-bake leaves every building exactly as it was */
  id: number
  /** flattened x,z pairs, counter-clockwise, first point not repeated */
  ring: number[]
  style: StyleId
  levels?: number
  height?: number
  minHeight?: number
  /** a part standing in for its building's outline (dropped at bake): the outline's id */
  partOf?: number
  /** few storeys, as tall as they need to be (a church's great windows): set by render/prepare.ts */
  stretch?: boolean
  /**
   * No shops on the ground floor, whatever the style draws there: set by render/prepare.ts on the buildings the
   * classifier dresses as schools in the `brick` style, whose ground floor is a row of shopfronts with PHARMACY
   * and BOOKS painted on them (USF's library and the city's schools, 2026-10-04). The ground floor takes the
   * style's own windows instead.
   */
  noShops?: boolean
  /** what the roof is, after OSM's own tags and the style's default have both had their say */
  roof: RoofShape
  /** how tall the roof is above the eaves, in metres */
  roofHeight: number
  /** the ridge bearing in radians, where a shape has a ridge */
  roofDirection?: number
  /** rgb 0–1 */
  roofColour: [number, number, number]
  /**
   * Paint forced by a landmark entry, in place of the style's own seeded palette — this is what a reface
   * writes. Set in render/prepare.ts and read in render/city.ts; it was working only because the packed
   * city arrives as untyped JSON, so neither end was ever checked against this interface.
   */
  palette?: { wall: string; trim: string; roof: string; accent: string; ground?: string }
  /**
   * Courtyards: the inner rings of a multipolygon building, flattened x,z pairs, CLOCKWISE — so the wall
   * builder's outward normal for each points into the court. 726 of the Marais's 730 building relations have
   * one; without them every courtyard was roofed over.
   */
  holes?: number[][]
  /** nobody tagged a height and the bake guessed the level count (tools/heights.ts); for the report and debugging */
  levelsInferred?: true
  /** what kind of building the region's classifier says it is (src/city/building-types.ts): 'rowhouse', 'loft'… */
  archetype?: string
  /**
   * **The slot kit cannot express this building's form** — route it up to from-scratch modelling, treatment
   * 4 or 5 in docs/LADDER.md §3c. Written by the bake from the FOOTPRINT alone (src/city/ring-forms.ts), for
   * every building in every city, before any model is spent: the scan costs nothing per building and needs
   * no photograph, which is what makes it affordable at the scale of hundreds across many cities.
   *
   * It carries WHICH score fired and all of the values, not a boolean: `arc` (a smooth curve), `stair` (a
   * curve some mapper digitised as a staircase) and `saw` (per-bay depth) mean different things and a later
   * reader needs to know which one to trust.
   *
   * Absent means only "the footprint does not say so". A twist, a taper, a vault and a temple front are all
   * invisible from above, and per-bay depth is caught only where a mapper drew the bays — so this is a cheap
   * first pass and never a complete answer. A `building:part` carries its OWNER's flag: the outline is what
   * was scored, and the bake may have dropped it.
   */
  form?: RingForm
  /**
   * EXPLICIT Z (map format v3, docs/MAP-FORMAT.md rule 3): where the walls start, metres in this package's datum
   * frame, as the bake decided it. When present the renderer uses it and does not sample the ground itself;
   * absent on a city read from v2, which is placed as it always was (src/map/footing.ts).
   */
  baseY?: number
}

/**
 * A building beyond the rideable box, drawn as plain massing so the city does not end in a field (the
 * "fringe", render/fringe.ts). Only what massing needs: footprint, height, the style whose far page and
 * palette it wears, and its roof.
 */
export interface PackedFringe {
  ring: number[]
  height: number
  style: StyleId
  roof: RoofShape
  roofHeight: number
  roofColour: [number, number, number]
  /** paint forced by a landmark entry, in place of the style's own seeded palette */
  palette?: { wall: string; trim: string; roof: string; accent: string; ground?: string }
  /** the OSM way id: the seed for its palette */
  id: number
  /** explicit Z (map format v3): its foot, metres, datum frame — the lowest corner less 0.3 m, as render/fringe.ts */
  baseY?: number
}

/** Hedges, beds and clipped yews (tools/gardens/). Local metres; heights off the ground. */
export interface PackedGarden {
  /** a clipped row. With `y0` it is a pleached crown on trunks `spacing` apart, its underside `y0` up */
  hedges: { points: number[]; h: number; w: number; y0?: number; spacing?: number }[]
  /** the gravel, lawns and flower beds, flat on the ground */
  flats: { ring: number[]; kind: 'gravel' | 'lawn' | 'bed'; rim?: true }[]
  /** x, z, height, shape (0 cone, 1 ball, 2 cube) */
  topiary: number[]
  /** where nothing is scattered: the only plants inside are the ones planned or mapped */
  formal: number[][]
}

export interface PackedArea {
  /**
   * `sand` and `dirt` were missing and the beach was a lawn (BUGS.md #200). The owner: *"the beach should
   * also have sand"*, and *"as a natural area with millions of plants and lots of dirt, it needs fairly
   * different mechanics"*. `sand` is `natural=sand|beach|shingle|dune`; `dirt` is `natural=bare_rock|
   * mud|earth` and `landuse=landfill|quarry` — the ground OSM says outright is not growing anything.
   * Neither is GREEN and neither is planted.
   */
  kind: 'park' | 'grass' | 'water' | 'wood' | 'pitch' | 'paved' | 'sand' | 'dirt' | 'lot'
  /**
   * A river's surface, metres in this package's datum, where the region knows it (`riverLevel`) and its lowest bank would not do: one
   * level per connected body meant the whole Seine took the lowest bank anywhere along it, and ran 12 m under central Paris (2026-10-30).
   */
  level?: number
  /** a paved square laid in the region's street brick: it opens off a brick street (tools/street-paint.ts) */
  brick?: true
  /**
   * a square laid in a material of its own, drawn on the road shader's page for it (owner, 2026-10-17: Fisherman's Wharf
   * "even cobblestone streets where appropriate"; Pier 39 is a plank boardwalk): `wood`, `cobblestone` or `brick`
   */
  surface?: 'wood' | 'cobblestone' | 'brick'
  /** a park laid out as planted BEDS — mulch and low native shrubs between its paths, its mapped lawns the only grass
   *  (a zone's `ground: 'beds'`, tools/bake.ts: the Presidio Tunnel Tops, owner's reference list 2026-10-04) */
  beds?: true
  /** …whose ground is MOSS, not mulch (a zone's `ground: 'garden'`: the Japanese Tea Garden) */
  moss?: true
  /**
   * a surface CAR PARK (OSM `amenity=parking` drawn as a lot, or a region square marked `lot`): render/city.ts lays out
   * stalls on it and render/street-fleet.ts parks cars in them (owner, 2026-10-17: "surface parking lots look like big
   * empty asphalt areas right now") — not a pier deck, which is a lot with no cars
   */
  parking?: true
  ring: number[]
  /** inner rings: the islands in a river, the courtyard in a park */
  holes?: number[][]
  /** drawn over the other areas (a square paved by hand over the park OSM spreads across it) */
  top?: boolean
  /**
   * This is the sea: built from `natural=coastline` rather than a mapped polygon. Its surface is sea level
   * by definition and must NOT be inferred from the ground under it — see `waterLevels` (BUGS.md #161).
   */
  sea?: boolean
}

/**
 * A named place — a café, a pharmacy, a museum. OSM has thousands of these and almost none of them has a
 * modelled building, which is precisely why they are worth drawing: a name on a fascia needs no building to
 * hang on and does more for "this is the Marais" than another window variant would.
 */
export interface PackedPoi {
  x: number
  z: number
  name: string
  kind: 'shop' | 'food' | 'culture' | 'service'
}

/**
 * A fitted sports court (BUGS.md #214, city/sports.ts): where it is, which way it points, and how big the
 * kit decided it could honestly be. `render/sports.ts` draws it; nothing downstream needs the polygon.
 */
export interface PackedCourt {
  sport: 'tennis' | 'pickleball' | 'padel' | 'american_football' | 'basketball' | 'four_square' | 'volleyball' | 'playground'
  x: number
  z: number
  /** the long axis, radians: the court's length runs along (cos h, sin h) */
  heading: number
  len: number
  wid: number
  /** a basketball half-court: one hoop, one key, no centre line */
  half?: boolean
}

/**
 * A piece of street furniture OSM mapped at a point: the things that say which city this is. Placed where
 * the mapper put it; the renderer turns it to face the nearest street.
 */
export interface PackedFurniture {
  x: number
  z: number
  kind: 'metro' | 'fountain' | 'column' | 'kiosk' | 'bikeshare' | 'signals'
    // and the American street's (SF_PLAN.md §6): a streetcar stop, a billboard, a stop sign, a bus stop, a post box,
    // a fire hydrant
    | 'tramstop' | 'billboard' | 'stop' | 'busstop' | 'postbox' | 'hydrant'
    // a street fire alarm box (emergency=fire_alarm_box), in the city's own design (Region pointFurniture.callBox)
    | 'callbox'
    // a street clock on its post (amenity=clock, support=pole), whose dials tell the real time (render/clocks.ts)
    | 'clock'
    // bike parking (amenity=bicycle_parking): a row of hoops, full of bikes, where the region draws it (pointFurniture.bikeParking)
    | 'bikeparking'
    // two-wheeler parking (amenity=motorcycle_parking): a row of scooters at the kerb (pointFurniture.motoParking)
    | 'motoparking'
    // Paris's street (pointFurniture.parisStreet): the litter hoop, the glass bell, the Sanisette; a statue, a bust or a
    // sculpture on its plinth (tourism=artwork, historic=memorial); a street market's row of stalls (amenity=marketplace);
    // the stands OSM does not map (city/paris/stands.ts)
    | 'litter' | 'recycling' | 'sanisette' | 'statue' | 'bust' | 'sculpture' | 'market' | 'crepes' | 'glaces' | 'souvenirs' | 'painter'
  /** a Wallace fountain, as opposed to any drinking tap */
  wallace?: true
  /** a bus stop with a shelter (OSM shelter=yes): the shelter drawn, not only the post */
  shelter?: true
  /** explicit Z (map format v3): the ground at the point, metres, datum frame */
  y?: number
}

/**
 * A named building worth naming on the street (item K): a church, a school, a museum, a town hall. Ranked by
 * tools/landmark-rank.ts; placed by src/city/landmark-place.ts.
 */
export interface PackedLandmark {
  /** the packed building id it belongs to */
  id: number
  name: string
  kind: 'church' | 'school' | 'museum' | 'civic' | 'shop' | 'historic' | 'other'
  /** 1: a big plate and a totem on the pavement; 2: a smaller plate */
  tier: 1 | 2
  /** the building's centre */
  x: number
  z: number
  /** the wall the plate hangs on: its midpoint, outward normal and length */
  frontage: { x: number; z: number; nx: number; nz: number; len: number }
  /** where the totem stands, tier 1 only, when there is a pavement to stand it on */
  totem?: { x: number; z: number }
}

/** A boat moored on a river (OSM `building=boat|houseboat`): the Seine's péniches — bars, homes, a fire station. */
export interface PackedBoat {
  id: number
  /** its footprint, flattened x,z */
  ring: number[]
  name?: string
}

/** A bridge's outline (OSM `man_made=bridge`), what render/bridges.ts builds its structure from. */
export interface PackedBridge {
  id: number
  /** the outline, flattened x,z */
  ring: number[]
  name?: string
}

/**
 * A mapped hard edge: `barrier=retaining_wall` or `seawall`, as a polyline.
 *
 * Fetched for ONE thing at present, and it is the beach's first band (docs/PARKS.md "Beaches are BANDS",
 * BUGS.md #200). The rip-rap holding up the top of Ocean Beach is mapped as a retaining wall - 33 ways
 * along that strip - and is nowhere tagged as natural ground, so the revetment can be PLACED from data
 * while the sand's own bands are GENERATED from distance to the coastline. Optional: a package baked
 * before this field simply has no revetment.
 */
export interface PackedWall {
  id: number
  /** x,z pairs */
  points: number[]
  /** a seawall as such, as opposed to any retaining wall (a terraced garden's is one too) */
  sea?: true
  /** a park's enclosure, not a retaining wall at all (Paris's parks close at night): iron bars, or a stone wall */
  railing?: 'bars' | 'wall'
}

/** A railway, for the trains that run on it. Straight through; trains do not steer. */
export interface PackedRail {
  id: number
  points: number[]
  kind: 'rail' | 'tram' | 'subway'
  /** an elevated structure — the Loop's L — and how high it runs (tools/bridges.ts) */
  bridge?: boolean
  layer?: number
  heights?: number[]
  /** a tram track with no power — San Francisco's cable cars (OSM electrified=no): its own rolling stock */
  cable?: true
  /** light rail (a modern tram on its own right of way, Muni Metro's surface lines), not a main-line railway */
  light?: true
  /** a gondola's inclined track (not baked: game.ts adds Salesforce Park's), its heights absolute */
  gondola?: true
  /** a funicular (OSM railway=funicular: Montmartre's), its heights the ground's: drawn and boarded as a gondola */
  funicular?: true
  /** track with no train: a line out of service with its rails still down (OSM railway=disused: Paris's Petite Ceinture), a métro yard. Drawn as track */
  disused?: true
}

export interface CityPackage {
  /** the roundabouts OSM maps (junction=roundabout rings, tools/bake.ts), for the ride graph beside the hand-made ones */
  roundabouts?: { lat: number; lon: number; r: number; R: number; name?: string }[]
  id: string
  name: string
  origin: { lat: number; lon: number }
  radius: number
  /** the rideable box in local metres (x east, z north); absent on an older package, which is ±radius */
  box?: { x0: number; x1: number; z0: number; z1: number }
  /** what the ground is where nothing is mapped */
  ground: 'grass' | 'sand' | 'dirt'
  /** regional character (src/city/regions.json) */
  region?: string
  /**
   * The sea's surface in this package's datum frame (BUGS.md #161), or absent where nothing is sea. Baked
   * as `shore − 1.5 − datum`, the level `tools/bake.ts` flattened the sea bed to, so the water plane and the
   * bed beneath it are the same surface. NOT metres above sea level — see `waterLevels`.
   */
  seaLevel?: number | null
  /** where a session starts: an edge id and how far along it */
  start: { edgeId: number; s: number }
  edges: PackedEdge[]
  buildings: PackedBuilding[]
  areas: PackedArea[]
  /** mapped retaining walls and seawalls (optional: absent on a package baked before them) */
  walls?: PackedWall[]
  /** a city's formal planting: OSM's hedges and beds and the plans traced from aerial photographs (render/garden.ts) */
  garden?: PackedGarden
  /** x,z pairs of individual mapped trees */
  trees: number[]
  rails: PackedRail[]
  pois: PackedPoi[]
  /** named buildings, for their name plates and totems */
  landmarks?: PackedLandmark[]
  /** far landmarks on the horizon, in local metres (tools/cities.ts `skyline`) */
  skyline?: { name: string; x: number; z: number; procedural: string; heightM: number; baseY?: number; bearing?: number; boost?: number }[]
  /** mapped street furniture (tools/overpass.ts `furnitureQuery`); absent on a package baked before it */
  furniture?: PackedFurniture[]
  /**
   * SPORTS COURTS (BUGS.md #214): one record per pitch the kit claims, POINT-like rather than a polygon.
   *
   * The fit has to happen on the WHOLE ring, at bake time: `splitPackage` clips an area at every tile
   * border, and a court straddling one would otherwise be fitted twice, to two half-polygons, and come out
   * as two wrong little courts. So the bake fits the court once (city/sports.ts) and files the result by
   * its centre, exactly as a piece of furniture is filed. Absent on a package baked before the kit, which
   * then renders pitches as the flat coloured polygons they were.
   */
  courts?: PackedCourt[]
  /** the ground, sampled on a grid; absent on a city baked flat */
  terrain?: PackedTerrain
  /**
   * The FINE ground grid (BUGS.md #206c), over the rideable box and a ring's margin only. `splitPackage`
   * cuts it into one block per tile and it NEVER reaches the index — at step 4 it is 511 MB for San
   * Francisco, against 19 KB a tile. Absent from a city baked before per-tile terrain, which then falls
   * back to `terrain` everywhere, exactly as it did.
   */
  terrainFine?: PackedTerrain
  attribution: string[]
  baked: string
  /** buildings beyond the box, as massing (optional: older packages have none) */
  fringe?: PackedFringe[]
  /** moored boats (render/boats.ts); drawn afloat, never as buildings */
  boats?: PackedBoat[]
  /** the bridges' outlines (render/bridges.ts) */
  bridges?: PackedBridge[]
  /** every tree, decided at bake time (city/plantings.ts): x, z, height, spin, park (0/1) per tree */
  plantings?: number[]
  /** the water bodies WHOLE, when `areas` are tile pieces (quays, the occluder and the crowd need the whole) */
  water?: PackedArea[]
}

export const unpackPoints = (flat: number[]): { x: number; z: number }[] => {
  const out: { x: number; z: number }[] = []
  for (let i = 0; i < flat.length; i += 2) out.push({ x: flat[i], z: flat[i + 1] })
  return out
}

export const packPoints = (pts: { x: number; z: number }[]): number[] =>
  pts.flatMap((p) => [Math.round(p.x * 100) / 100, Math.round(p.z * 100) / 100])

/** A structure (a bridge, or a ramp standing off the ground) rather than painted ground. */
export function isRaised(e: PackedEdge, _terrain?: { heightAt(x: number, z: number): number }): boolean {
  // marked at bake (tools/bake.ts, from tools/bridges.ts): inferring it from how far the heights stand off the
  // terrain stopped working once every street on a hillside was levelled above it (BUGS.md #38) — ordinary
  // streets came out as decks on embankments
  return !!e.bridge || !!e.ramp
}

/** The water bodies whole: from the index when `areas` are tile pieces, else the package's own. */
export const wholeWater = (pkg: Pick<CityPackage, 'areas' | 'water'>): PackedArea[] =>
  pkg.water ?? pkg.areas.filter((a) => a.kind === 'water')

/** On or above the ground: not a tunnel, not mapped below grade (a bridge over a cutting is still above it). */
/**
 * Is a way on the open ground (drawn, and ridden)? Not a tunnel; and at layer −1 only a walk or a cycle track
 * that is not a tunnel: the Seine's riverside promenades (the Berges, André Gorz) are layer −1 where they pass
 * under the bridges, in the open, and dropping them made every bridge a dead end on the river path (BUGS.md
 * #20). A layer −1 ROAD is an underpass or a car park's ramp, and stays out.
 */
const SHALLOW = new Set(['footway', 'path', 'pedestrian', 'cycleway'])
export const onSurface = (e: { tunnel?: boolean; layer?: number; bridge?: boolean; kind?: string }): boolean =>
  !e.tunnel && ((e.layer ?? 0) >= 0 || !!e.bridge || ((e.layer ?? 0) === -1 && SHALLOW.has(e.kind ?? '')))

/**
 * A way that rises more than it runs: a lift shaft or a stair core OSM filed as a bridge (78924 at
 * Embarcadero Center climbs 8 m in 4). Drawn as a road surface it is a slab standing on its edge across
 * the walk beneath, so neither the full-detail tiles (render/city.ts) nor the mid ring (render/fringe.ts)
 * draws one. Steps are exempt: a flight is meant to climb.
 */
export function steeperThanWall(e: PackedEdge): boolean {
  if (!e.heights || e.kind === 'steps') return false
  for (let i = 1; i < e.heights.length; i++) {
    const run = Math.hypot(e.points[i * 2] - e.points[i * 2 - 2], e.points[i * 2 + 1] - e.points[i * 2 - 1])
    if (Math.abs(e.heights[i] - e.heights[i - 1]) > Math.max(1.5, run)) return true
  }
  return false
}

/** water smaller than this, in m², is a basin in a square or a garden, not a river (the seven of the Cour Napoléon come to 2,900; the Tuileries's Grand Bassin to 6,000) */
const POND = 8000
/** …and how far under its kerb it lies */
const POND_DROP = 0.3
const ringArea = (r: number[]): number => {
  let a = 0
  for (let i = 0; i < r.length; i += 2) {
    const j = (i + 2) % r.length
    a += r[i] * r[j + 1] - r[j] * r[i + 1]
  }
  return Math.abs(a / 2)
}

/**
 * The level of each body of water: its lowest bank less the region's drop — and ONE level for bodies that
 * touch, the lowest of them. OSM maps the Seine as several polygons meeting along lines across the river,
 * each with its own lowest bank; drawn at their own levels they stepped a metre at the seam, and the depth
 * occluder of the higher cut shards out of the lower (BUGS.md #36). Touching = a vertex of one within 3 m of
 * a vertex of the other.
 *
 * HEIGHTS HERE ARE IN THE DATUM FRAME, NOT METRES ABOVE SEA LEVEL. `tools/bake.ts` stores the ground as
 * `raw − datum`, where the datum is the elevation at local (0, 0) — the rider's start. In San Francisco that
 * is lower Nob Hill, so **local 0 is about 82 m above mean sea level** and the sea is near −82. Do not write
 * a sea level of 0 into this function: it would put the bay 82 m up and drown the Embarcadero. Measured on
 * `index.json`: Ferry Building −84.7, Ocean Beach −82.4, Civic Center −81.4, Alamo Square −81.4.
 *
 * THE SEA IS PINNED, and measurement is why. Once `natural=coastline` became a water area (BUGS.md #159) the
 * bay entered the bake's `wetMask` and the sea-bed flattening of #58 applied to it for the first time, which
 * very nearly sufficed. But a bake reported the three sea components at −94.1, −86.3 and −99.1 m against a
 * flattened bed at −85.0: one right, the other two leaking 9 and 14 m low, and disagreeing with each other —
 * a step at the waterline and a seam between the ocean and the bay. The cause is at the BOX EDGE, where the
 * polygon is clipped but the terrain grid runs `tpad` further and a vertex lying on the edge samples ground
 * that `inRing` never marked wet, so `min` takes the unflattened value.
 *
 * So `seaLevel` — `shore − 1.5` in the datum frame, the very number #58 flattened the bed to — is passed in,
 * and any component containing sea water takes it. Pinning rather than taking the component minimum is the
 * point: one leaking vertex must not drag the bay down, and all three components must agree, because they are
 * one body of water.
 */
export function waterLevels(water: PackedArea[], heightAt: (x: number, z: number) => number, drop: number,
  seaLevel: number | null = null): number[] {
  const own = water.map((a) => {
    let lv = Infinity
    for (let i = 0; i < a.ring.length; i += 2) lv = Math.min(lv, heightAt(a.ring[i], a.ring[i + 1]))
    return lv
  })
  const parent = water.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const CELL = 3
  const grid = new Map<string, number[]>()
  water.forEach((a, k) => {
    for (let i = 0; i < a.ring.length; i += 2) {
      const gx = Math.floor(a.ring[i] / CELL)
      const gz = Math.floor(a.ring[i + 1] / CELL)
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        for (const o of grid.get(`${gx + dx},${gz + dz}`) ?? []) if (o !== k) parent[find(o)] = find(k)
      }
      const key = `${gx},${gz}`
      const list = grid.get(key)
      if (!list) grid.set(key, [k])
      else if (!list.includes(k)) list.push(k)
    }
  })
  const low = new Map<number, number>()
  own.forEach((lv, k) => { const r = find(k); low.set(r, Math.min(low.get(r) ?? Infinity, lv)) })
  /*
   * The drop is a river's, between its quays, and not a fountain's (owner, 2026-10-30, the Place André-Malraux: "this is a fountain
   * but looks more like a hole"): 100 m² of water at the bottom of a 2.5 m stone pit. A body this small lies just under its kerb.
   */
  const size = new Map<number, number>()
  water.forEach((a, k) => { const r = find(k); size.set(r, (size.get(r) ?? 0) + ringArea(a.ring)) })
  low.forEach((lv, r) => low.set(r, lv - ((size.get(r) ?? 0) < POND ? Math.min(drop, POND_DROP) : drop)))
  // a river whose surface is known outright takes it (PackedArea `level`), however low one of its banks lies downstream
  water.forEach((a, k) => { if (a.level !== undefined) low.set(find(k), a.level) })
  // a component that reaches the sea IS the sea: it takes the sea's level rather than its lowest member
  const salt = new Set<number>()
  if (seaLevel !== null) water.forEach((a, k) => { if (a.sea) salt.add(find(k)) })
  return own.map((_, k) => (salt.has(find(k)) ? seaLevel! : low.get(find(k))!))
}
