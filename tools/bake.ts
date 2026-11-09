import { applySurveyPins } from './survey-pins.ts'
import { applyLevelPlans } from './level-plans.ts'
import { bdTopoZone } from './bdtopo-zones.ts'
import { bandDeckZones, type BandBridgeShape } from './seine-band.ts'
import type { DeckZoneSpec } from './deck-zones.ts'
import { deckZonesOf, levelGroundGrid, applyDeckZoneRoutes, conformDeckRails, bdTopoRails, dedupeWalls, DZ_GROUND_STEP, DZ_SINK_MARGIN, DZ_BED, DZ_BED_TOL, DZ_BED_FOOT } from './deck-zones.ts'
import './bake-lock.ts'
/**
 * Heights (m) for untagged buildings whose neighbour guess is badly wrong, by OSM way id. Read off aerials.
 * The Boulogne tennis club by the A13 (48.8479, 2.2297, owner 2026-11-04): two low sheds guessed at 28 m.
 */
const HEIGHT_FIXES: Record<number, number> = {
  72055805: 6, // the long white hall along the courts' east end
  72056047: 4.5, // the grey shed at the loop's east end
}
/** Pitches whose courts are red clay though OSM gives no surface: the same club's bank of four. */
const CLAY_PITCHES = new Set<number>([24732817])

/**
 * Turn a real place into a city package, once, offline.
 *
 *   npm run bake                     every city in tools/cities.ts
 *   npm run bake -- paris-marais     just the one
 *
 *      Overpass ──► streets ──► a graph: ways split at every shared node
 *               ──► buildings ──► streets-gl's tag layer ──► a style, levels, a height
 *               ──► parks, water, trees
 *                          │
 *                          ▼
 *              public/cities/<id>/v3/          shipped: what the game reads, under a bake number
 *              tools/cache/bake/<id>/          bake-private: the package and v2 tiles the tools read (tools/bake-files.ts)
 *
 * Two things here are worth explaining because they are not obvious.
 *
 * **Streets are split at every shared node**, not kept as whole OSM ways. A way is a mapper's convenience: it
 * runs through six junctions and changes name halfway. What steering needs is an edge between two junctions,
 * so that "the next junction" is a real question with a real answer. Splitting is how a pile of ways becomes
 * a network a rider can be navigated through.
 *
 * **The style comes from the tag layer plus the neighbourhood's mix.** streets-gl's `getBuildingParamsFromOSMTags`
 * reads what the mapper actually said — levels, height, material, roof shape — and `chooseStyle` decides the
 * rest from the city's own character. Baking it in rather than deciding at runtime means the same building is
 * the same every session, which is what makes two rides down the same street comparable.
 */
import { openElevatedWalks } from './elevated-walks.ts'
import { SHIPPED, assertFresh, decksUndoFile, isBaked, newBakeId, packageFile, recordBake, shippedDir, workDir } from './bake-files.ts'
import { applyStreetPaint, applyStreetWidths, markBrickSquares } from './street-paint.ts'
import { Carriageways } from '../src/city/carriageways.ts'
import { StreetGrade } from '../src/city/grade.ts'
import { boreTunnels, lidDeckIds, lidRoadIds, lidTunnels, sinkRoadMouths, type LidSlab } from './tunnels.ts'
/** the lids' slabs, from the streets pass to the bridge outlines (filled by `lidTunnels`) */
const lidSlabsOut: LidSlab[] = []
const LID_SLAB_ID0 = 9e14
/** how far along a lid road from its slab the trench is walled (m; render/city.ts TRENCH_*): the ramps are tunnels.ts LID_RAMP */
const LID_WALL_REACH = Number(process.env.LID_WALL_REACH ?? 70)
import { inRing as inRingTT } from '../src/city/terrain-tweaks.ts'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { CITIES, bboxOf, city, detailBboxOf, detailOf, extentOf, type CitySpec } from './cities.ts'
import { detailKm2, detailOutlines, detailTest, filterToRegion, mergeResults, regionBbox, regionsOf } from './detail.ts'
import { joinNearMisses } from './gaps.ts'
import { bakeGardens, rowPoints } from './gardens/index.ts'
import { bridgesQuery, campusQuery, fencesQuery, gardenPartsQuery, sandQuery, wallsQuery, squaresQuery, stepsQuery, wideQuery, fringeQuery, cityQuery, furnitureQuery, partRelationsQuery, innerRings, outerRings, overpassTiled, type Bbox, type OsmWay, type LatLon, type OverpassResult } from './overpass.ts'

/** the trees a city plants by hand (data/trees/<city>.json: the Japanese Tea Garden's lanes), local metres */
function handTreesOf(id: string, toLocal: (lat: number, lon: number) => { x: number; z: number }): Planting[] {
  const f = resolve(import.meta.dirname, '..', 'data', 'trees', `${id}.json`)
  if (!existsSync(f)) return []
  const out = handTrees(JSON.parse(readFileSync(f, 'utf8')) as Parameters<typeof handTrees>[0], toLocal)
  console.log(`  ${out.length} trees planted by hand (${f})`)
  return out
}
import { Elevation, ATTRIBUTION as TERRAIN_CREDIT, metresPerPixel } from './terrarium.ts'
import { Terrain, type PackedTerrain } from '../src/city/terrain.ts'
import { PARIS_STANDS } from '../src/city/paris/stands.ts'
import { TILE, splitPackage, tilesOfLine, type CityIndex, type TileEntry } from '../src/city/tiles.ts'
import { layBikeRamps } from '../src/city/bike-ramps.ts'
import { waterLookup } from '../src/render/watermask.ts'
import { MIN_SPACING, TREE_CAP, TREES_PER_KM2, newPlantReport, packPlantings, plantCity, handTrees, type Planting, type PlantReport } from '../src/city/plantings.ts'
import { inside } from '../src/city/park-planting.ts'
import { classifyParis } from '../src/city/paris/btype.ts'
import { formCode } from '../src/city/tree-forms.ts'
import { PlantZones } from '../src/city/zone-planting.ts'
import { mapEdges, packRide, rideFor } from '../src/city/ridefile.ts'
import { Projection, haversine } from '../src/city/geo.ts'
import { COURT_MAX_M2, courtEligible, courtSport, fitCourt, ringArea, tileCourts } from '../src/city/sports.ts'
import { chooseStyle, style as styleOf, type StyleId } from '../src/city/facade.ts'
import { packPoints, unpackPoints, waterLevels, type CityPackage, type PackedPoi, type QuayWall, type PackedArea, type PackedBuilding, type PackedFringe, type PackedEdge, type PackedCourt, type PackedFurniture, type PackedLandmark, type PackedRail, type RoofShape } from '../src/city/package.ts'
import { pavementFor } from '../src/city/pavement.ts'
import { ringForm, thresholds, type RingForm } from '../src/city/ring-forms.ts'
import { largestComponent, lengthOf, type Edge } from '../src/city/graph.ts'
import { rideGraph, rideStats } from '../src/city/ridegraph.ts'
import { frontageOf, totemPoint } from '../src/city/landmark-place.ts'
import { landmarkKind, score } from './landmark-rank.ts'
import { bridgeHeights, liftWalksOffTheSea, meetDecks, rampFootBridgeEnds, footBridgeLinks, mergeBridgeLanes } from './bridges.ts'
import { bedPosts, footWaysOnTracks, levelParisRails, parisRailRecord, railFineTiles, stationShells, straightDeck } from './rail-levels.ts'
import { levelFootOnDecks } from '../src/render/rail-overbridge.ts'
import { RAIL_DECKS } from '../src/city/paris/rail-decks.ts'
import { gardenPaths } from './gardens/paths.ts'
import { authoredWays, conformWithUndo, describe, undoDecks, type DeckUndo } from './deck-conform.ts'
import { cityParkMask, parkEdge, roadFix } from '../src/city/park-area.ts'

/**
 * A church is not a row of shops. Places of worship take the classical style — its ground floor is an arcade,
 * and a shop sign is only ever hung over a shopfront — whatever the neighbourhood's mix would have given them.
 */
const worship = (t: Record<string, string>): boolean =>
  t.amenity === 'place_of_worship' || /^(church|cathedral|chapel|basilica|synagogue|mosque|temple)$/.test(t.building ?? '')
/*
 * And a hospital is not a walk-up. The owner, flying over UCSF Parnassus 2026-09-23: "the buildings are all
 * generic, but someone on OSM did a good job, they are all the right shapes. They are coded as TENEMENTS
 * though - that's wrong... let's just make sure the buildings are refaced to look like hospitals in that
 * campus."
 *
 * The shapes were right because OSM's footprints are good there; the STYLE came from the neighbourhood's
 * weighted mix, which for the Inner Sunset includes `tenement` — a five-storey walk-up, fire escapes and
 * all, hung on a hospital block.
 *
 * So medical and university buildings take a plain modern institutional style whatever the mix would have
 * given them, exactly as places of worship take `classical`. SCHOOLS ARE DELIBERATELY LEFT OUT: they are
 * 182 of the 330 buildings this would otherwise catch, San Francisco's are genuinely various (brick,
 * classical, stucco), and nobody has complained about them.
 */
const institution = (t: Record<string, string>): boolean =>
  /^(hospital|university|college)$/.test(t.building ?? '')
  || /^(hospital|clinic|university|college|doctors)$/.test(t.amenity ?? '')
const styleFor = (t: Record<string, string>, pick: () => StyleId): StyleId =>
  (worship(t) ? 'classical' : institution(t) ? 'bauhaus' : pick())

/** How many landmark name plates a city gets: the cells in the plate texture (render/signs.ts). */
const LANDMARK_CAP = 256
/** Ranked high enough, or a church, school, museum or town hall whatever its rank: a rider steers by those. */
const worthNaming = (t: Record<string, string>): boolean =>
  score(t) >= 2 || ['church', 'school', 'museum', 'civic'].includes(landmarkKind(t))
import getBuildingParamsFromOSMTags from '../src/vendor/streets-gl/osm/getBuildingParamsFromOSMTags.ts'
import { region } from '../src/city/region.ts'
import { classifierFor } from '../src/city/building-types.ts'
import { districtOf } from '../src/city/sf/btype.ts'
import { buildSigns } from './signs.ts'
import { insetNested } from '../src/city/nesting.ts'
import { GroundModel } from '../src/map/ground.ts'
import { writeV3 } from './v3-writer.ts'
import { HUGE_AREA_SPAN, tooBigForAnArea } from '../src/city/park-planting.ts'
import { localZones, zoneTouchesRect, zonesAt, type LocalZone, type ZoneFile } from '../src/map/zones.ts'
import { ROOF_RGB, roofKind } from '../src/city/paris/materials.ts'
import { NeighbourGrid, centroid, hasHeightTag, inferLevels, taggedLevels, type TaggedNeighbour } from './heights.ts'
/** how far round a road bridge's end its junction reaches, and the most a point of it is brought up (bake: bridgeheads) */
const JUNCTION_R = 45
const JUNCTION_MAX_STEP = 6
/** …eased back to each way's own height over this far past JUNCTION_R */
const JUNCTION_EASE = 30
/** bridge ends this close are one bridgehead plate; its level is this quantile of its roads; a way above it comes down at most this far */
const PLATE_MERGE = 30, PLATE_QUANTILE = Number(process.env.PLATE_QUANTILE ?? 0.75), PLATE_MAX_DROP = 3
/** a plate needs this many road points in JUNCTION_R; a motorway/trunk way or slip road neither founds a plate nor counts in its level
 *  (Pont Amont's trunk_link end founded its own plate on Quai de Bercy, beside Pont National's, and lifted the quay to 8.2) */
const PLATE_MIN_ROADS = 8, PLATE_FREEWAY = /^(motorway|trunk)(_link)?$/
/** …and a road with a node this near a bridge end is of its junction though OSM does not join them (Pont National's right end
 *  joined only the Boulevard Poniatowski; Quai de Bercy, 14 m off, was left out of the plate and the level was one way's) */
const PLATE_SEED_R = Number(process.env.PLATE_SEED_R ?? 15)
/** …or any POINT of a road (distance to its segments) this near an end, its height there within PLATE_SEED_DH of the end's: Quai de
 *  Bercy passes 8 m from Pont National's right end at its level with no node near (PLATE_SEED_SEG=0 off). Its level: that of the
 *  roads the end's own joins gathered (the end's height is the lidar's, what a plate corrects). A way well under or over passes */
const PLATE_SEED_SEG = Number(process.env.PLATE_SEED_SEG ?? PLATE_SEED_R), PLATE_SEED_DH = Number(process.env.PLATE_SEED_DH ?? 1.5)
/** an underpass (tunnel / layer < 0) mouth this near a plate's centre: the ways into it are never of the plate (PLATE_MOUTH_R=0 off) */
const PLATE_MOUTH_R = Number(process.env.PLATE_MOUTH_R ?? JUNCTION_R)
/** (the lower-quay roads by name — Port, Voie, Berges: never of a plate, always cleared under a road deck; DECK_LOW_NAME env) */
const DECK_LOW_NAME = new RegExp(process.env.DECK_LOW_NAME ?? '^(Port|Voie|Berges?) ')
/** a deck clears an at-grade way passing under it (not joined to it, not of a plate) by this much, road / foot or service; short,
 *  the deck is lifted, eased back at DECK_LIFT_GRADE, at most DECK_LIFT_MAX — or, within JUNCTION_R of a plated end (the street's
 *  level), the way under is lowered, at most UNDER_MAX_DROP, eased at UNDER_GRADE (bake: deck clearance) */
const DECK_CLEAR_ROAD = Number(process.env.DECK_CLEAR_ROAD ?? 4.2), DECK_CLEAR_FOOT = 3, DECK_LIFT_GRADE = 0.03, DECK_LIFT_MAX = 4
const UNDER_MAX_DROP = 3, UNDER_GRADE = 0.06
/** …a way less than this under the deck meets it there (an unjoined level crossing), it does not pass under; freeway decks are left be */
const DECK_MIN_GAP = 1
/** …except a lower-quay way (on the quay shelf found from the ground, or named Port / Voie / Berge) under a road deck: it never meets
 *  the deck at level, whatever the gap (Pont Mirabeau's ends sag to the lidar's quay: Voie Georges Pompidou 1.0, Port de Javel 0.1
 *  under them); cleared from DECK_LOW_MIN_GAP up, and lifted where a plated end could not lower it far enough. DECK_LOW=0 off */
const DECK_LOW_MIN_GAP = -0.5
/** a way whose own heights near a plate sit this far under it is a lower path (a quay walk), not of the junction; ways leaving it climb no steeper than PLATE_GRADE */
const PLATE_LOW = 2.5, PLATE_GRADE = Number(process.env.PLATE_GRADE ?? 0.1)

// the shipped bake (public/cities/<id>/v3/) and the bake-private files (tools/cache/bake/<id>/): tools/bake-files.ts
const OUT = SHIPPED
const DOCS = resolve(import.meta.dirname, '..', 'docs')
/** how far beyond the box the fringe of plain massing reaches, metres */
const FRINGE = 700
/** …and beyond each detail region (docs/VERSAILLES.md: 300 m is ~10k buildings round the ride to Versailles) */
const REGION_FRINGE = 300
/**
 * The coarse ground's reach beyond the box, metres, at most: the box's largest half-width, capped. Paris's box grew to
 * 19 km west to hold Versailles, which uncapped would have made its coarse grid four times the size. 9800 is San
 * Francisco's own, so it is unchanged.
 */
const COARSE_PAD_MAX = 9800
/*
 * How big a `park`/`wood` polygon has to be before the bake treats it as open country: four hectares, a
 * 200 m square. Deliberately far above the per-TILE threshold the renderer uses (10 000 m², `default.park.
 * minPieceM2`), and for a different reason — a tile holds a clipped fragment and asks "how much of me is
 * park", while the bake holds whole polygons and asks "is this thing a park at all". Golden Gate Park is
 * 4.1 km², the Presidio 6 km², and a residential square is a few hundred square metres, so nothing lives
 * anywhere near this line.
 */
const PARK_RING_M2 = 40000

const bbox = (c: CitySpec, pad = 0): Bbox => bboxOf(c, pad)

/**
 * A DETAIL-ONLY query: over the detail box exactly as before (the same query text, so its cache answers), and over
 * each detail region's bbox, cut down to the region (tools/detail.ts `filterToRegion`; docs/VERSAILLES.md).
 */
async function overpassDetail(query: (b: Bbox) => string, spec: CitySpec, step?: number, single?: number): Promise<OverpassResult> {
  const main = await overpassTiled(query, detailBboxOf(spec), step, single)
  const regs = regionsOf(spec)
  if (regs.length === 0) return main
  const parts = [main]
  for (const r of regs) parts.push(filterToRegion(await overpassTiled(query, regionBbox(r), step, single), r))
  return mergeResults(parts)
}

/** a query over the WHOLE box — or the detail only, where the box has no wide layer (`wide: false`: grown for regions) */
const overpassBox = (query: (b: Bbox) => string, spec: CitySpec, step?: number, single?: number): Promise<OverpassResult> =>
  spec.wide === false ? overpassDetail(query, spec, step, single) : overpassTiled(query, bbox(spec), step, single)

/** Where a region's landmark entries stand by point (lat, lon and a size): each one's centre and the half of its larger side. */
function landmarkSpots(region: string): { lat: number; lon: number; r: number }[] {
  const out: { lat: number; lon: number; r: number }[] = []
  const dir = resolve(import.meta.dirname, '..', 'public', 'landmarks')
  const files = [resolve(dir, `${region}.json`)]
  const sub = resolve(dir, region)
  if (existsSync(sub)) for (const f of readdirSync(sub)) if (f.endsWith('.json')) files.push(resolve(sub, f))
  for (const f of files) {
    if (!existsSync(f)) continue
    const d = JSON.parse(readFileSync(f, 'utf8')) as { lat?: number; lon?: number; size?: number[] }[] | { landmarks?: { lat?: number; lon?: number; size?: number[] }[] }
    for (const e of Array.isArray(d) ? d : d.landmarks ?? []) {
      if (typeof e.lat === 'number' && typeof e.lon === 'number') out.push({ lat: e.lat, lon: e.lon, r: Math.max(6, ...(e.size ?? [12, 12])) / 2 })
    }
  }
  return out
}

/** The kinds only Paris's street draws (Region pointFurniture.parisStreet). */
function parisStreetKind(t: Record<string, string>): PackedFurniture['kind'] | null {
  if (t.indoor === 'yes') return null
  if (t.amenity === 'waste_basket') return 'litter'
  if (t.amenity === 'recycling') return 'recycling'
  // (the Sanisette: JCDecaux's, or a public one standing free; a café's or a park building's are not one)
  if (t.amenity === 'toilets') return t.building === undefined && (t.operator === 'JCDecaux' || t.access === 'yes') ? 'sanisette' : null
  if (t.amenity === 'marketplace') return t.covered !== 'yes' && t.building === undefined ? 'market' : null
  if (t.tourism !== 'artwork' && t.historic !== 'memorial') return null
  // (a figure on a wall, or on some floor of a building, is not a figure on a plinth)
  if (t.level !== undefined || /wall|building|facade/.test(`${t.support ?? ''} ${t.location ?? ''}`)) return null
  const what = t.artwork_type ?? t.memorial ?? ''
  return what === 'bust' ? 'bust' : what === 'statue' ? 'statue' : what === 'sculpture' ? 'sculpture' : null
}

/** The OSM ways a region's landmark manifests claim (public/landmarks/<region>/*.json and <region>.json), packed ids. */
function landmarkClaims(region: string): Set<number> {
  const out = new Set<number>()
  const dir = resolve(import.meta.dirname, '..', 'public', 'landmarks')
  const files = [resolve(dir, `${region}.json`)]
  const sub = resolve(dir, region)
  if (existsSync(sub)) for (const f of readdirSync(sub)) if (f.endsWith('.json')) files.push(resolve(sub, f))
  for (const f of files) {
    if (!existsSync(f)) continue
    const d = JSON.parse(readFileSync(f, 'utf8')) as { osm?: string | string[] }[] | { landmarks?: { osm?: string | string[] }[] }
    for (const e of Array.isArray(d) ? d : d.landmarks ?? []) {
      for (const ref of e.osm ? (Array.isArray(e.osm) ? e.osm : [e.osm]) : []) {
        const [kind, n] = ref.split('/')
        if (kind === 'way') out.add(Number(n))
      }
    }
  }
  return out
}

const SURFACES: Record<string, PackedEdge['surface']> = {
  asphalt: 'asphalt', paved: 'asphalt', concrete: 'concrete', paving_stones: 'concrete',
  sett: 'cobblestone', cobblestone: 'cobblestone', unhewn_cobblestone: 'cobblestone',
  // Lombard Street's crooked block (owner's appearance pass, 2026-10-02): red brick, not the asphalt it fell back to
  bricks: 'brick', brick: 'brick', clay: 'brick',
  gravel: 'gravel', fine_gravel: 'gravel', compacted: 'gravel',
  ground: 'dirt', dirt: 'dirt', earth: 'dirt', grass: 'dirt', sand: 'dirt', wood: 'wood',
}

/** Street classes whose `paving_stones` is Paris pavés (bake's edge surface): every carriageway and pedestrian street, not footways or paths. */
const PAVE_STREETS = new Set(['pedestrian', 'living_street', 'residential', 'unclassified', 'tertiary', 'secondary', 'primary', 'service',
  'tertiary_link', 'secondary_link', 'primary_link'])

/** What a street is made of, when the mapper did not say: a guess from what kind of street it is. */
function surfaceOf(tags: Record<string, string>): PackedEdge['surface'] {
  const tagged = SURFACES[tags.surface ?? '']
  if (tagged) return tagged
  const h = tags.highway
  if (h === 'path' || h === 'track') return 'dirt'
  if (h === 'footway' || h === 'pedestrian') return 'concrete'
  return 'asphalt'
}

function widthOf(tags: Record<string, string>): number {
  const w = parseFloat(tags.width ?? '')
  if (Number.isFinite(w) && w > 0.5 && w < 40) return w
  // a flight of steps IN a sidewalk (OSM steps=sidewalk: Lombard's crooked block, Kearny, Filbert) is a sidewalk's width,
  // not the 3 m of a free-standing stairway (owner, 2026-10-16: Lombard's stairs "much narrower than in our model")
  if (tags.highway === 'steps' && tags.steps === 'sidewalk') return 1.5
  // an ALLEY is one lane between walls, whatever class OSM gives it (Montclair Terrace, above Lombard's crooked block: a
  // residential street's 9 m and pavements made an 8 m corridor that levelled the Lombard beds and stairs 4 m up, 2026-10-16)
  if (tags.service === 'alley') return 4
  const lanes = parseInt(tags.lanes ?? '', 10)
  if (Number.isFinite(lanes) && lanes > 0) return Math.min(24, lanes * 3.2)
  switch (tags.highway) {
    case 'primary': return 12
    case 'secondary': return 10
    case 'tertiary': return 8.5
    case 'residential': case 'unclassified': return 7
    case 'living_street': return 6
    case 'pedestrian': return 6
    case 'service': return 4.5
    case 'cycleway': return 2.5
    default: return 3
  }
}

/** What the ride graph and the bridge builder need to know about a way, beyond its shape. */
/**
 * Which curbs carry a bus lane (PackedEdge `busSide`), from the tags San Francisco and Paris use: `lanes:bus`/`lanes:psv`
 * (with :forward/:backward), `bus:lanes`/`psv:lanes` (with :forward/:backward; any `designated`), `busway`, `busway:right`,
 * `busway:left`, `busway:both`. Forward lanes are on the right of the way's direction, backward ones on its left; on a
 * one-way street an undirected lane is on the right unless `busway:left` says otherwise.
 */
export function busSide(t: Record<string, string>): 1 | 2 | 3 | undefined {
  const oneway = t.oneway === 'yes' || t.oneway === '-1'
  const n = (k: string): boolean => { const v = parseInt(t[k] ?? '', 10); return Number.isFinite(v) && v > 0 }
  const des = (k: string): boolean => /designated/.test(t[k] ?? '')
  const lane = (k: string): boolean => /^(lane|opposite_lane)$/.test(t[k] ?? '')
  let right = n('lanes:bus:forward') || n('lanes:psv:forward') || des('bus:lanes:forward') || des('psv:lanes:forward') || lane('busway:right')
  let left = n('lanes:bus:backward') || n('lanes:psv:backward') || des('bus:lanes:backward') || des('psv:lanes:backward') || lane('busway:left')
  const any = n('lanes:bus') || n('lanes:psv') || des('bus:lanes') || des('psv:lanes') || lane('busway')
  if (lane('busway:both')) { right = true; left = true }
  if (any && !right && !left) { if (oneway) right = true; else { right = true; left = true } }
  return right && left ? 3 : right ? 1 : left ? 2 : undefined
}

function wayTags(t: Record<string, string>): Pick<PackedEdge, 'kind' | 'service' | 'oneway' | 'layer' | 'bridge' | 'tunnel' | 'passage' | 'busSide'> {
  const layer = parseInt(t.layer ?? '', 10)
  const yes = (v: string | undefined): true | undefined => (v !== undefined && v !== 'no' ? true : undefined)
  return {
    kind: t.highway,
    ...(t.service ? { service: t.service } : {}),
    ...(t.oneway === 'yes' || t.oneway === '-1' ? { oneway: true } : {}),
    ...(Number.isFinite(layer) && layer !== 0 ? { layer } : {}),
    ...(yes(t.bridge) ? { bridge: true } : {}),
    ...(busSide(t) ? { busSide: busSide(t) } : {}),
    /*
     * A way through a building at street level — the arches through the Place des Vosges's Pavillon du Roi
     * (Rue de Birague) and Pavillon de la Reine (Rue de Béarn), a passage under an apartment block — is a
     * PASSAGE, not a tunnel: at grade, rideable, and drawn as an arch (render/passages.ts). As a tunnel it
     * was dropped from the ride graph and both classic ways into the Place des Vosges were dead ends.
     */
    ...(t.tunnel === 'building_passage' || (t.covered === 'yes' && !yes(t.tunnel)) ? { passage: true }
      : yes(t.tunnel) ? { tunnel: true } : {}),
  }
}

/** A North American street, kerb to kerb: the tagged width, or what a US street of this class is. */
function widthOfNA(tags: Record<string, string>): number {
  const w = parseFloat(tags.width ?? '')
  if (Number.isFinite(w) && w > 0.5 && w < 40) return w
  // steps in a sidewalk are a sidewalk's width (see widthOf)
  if (tags.highway === 'steps' && tags.steps === 'sidewalk') return 1.5
  // an ALLEY is one lane between walls, whatever class OSM gives it (Montclair Terrace, above Lombard's crooked block: a
  // residential street's 9 m and pavements made an 8 m corridor that levelled the Lombard beds and stairs 4 m up, 2026-10-16)
  if (tags.service === 'alley') return 4
  const lanes = parseInt(tags.lanes ?? '', 10)
  if (Number.isFinite(lanes) && lanes > 0) return Math.min(24, lanes * 3.4 + 2.4)   // lanes plus parking
  switch (tags.highway) {
    case 'primary': return 14
    case 'secondary': return 12.5
    case 'tertiary': return 11
    case 'residential': case 'unclassified': return 9
    case 'living_street': return 7
    case 'pedestrian': return 8
    case 'service': return 5
    case 'cycleway': return 2.5
    // (a ramp with no lanes tagged is one lane and its shoulders — at the default 3 m no car would use it)
    case 'motorway_link': case 'trunk_link': return 5.8
    case 'motorway': case 'trunk': return 9.2
    default: return 3
  }
}

/** The sidewalk beside a North American street: wide, outside the kerb, and none beside an alley. */
function pavementForNA(width: number): number {
  if (width < 5.5) return 0
  if (width < 9) return 2.4
  if (width < 13) return 3.2
  return 3.8
}

// track/bridleway added alongside footway/path/pedestrian/steps: a Presidio fire road or a park bridle path
// IS the trail, with no separate pavement to carve out of a phantom carriageway either side of it
const isFoot = (t: Record<string, string>): boolean =>
  t.highway === 'footway' || t.highway === 'path' || t.highway === 'pedestrian' || t.highway === 'steps'
  || t.highway === 'track' || t.highway === 'bridleway'

/** two boxes the same, to the metre: then the wide fetch would only repeat the near one */
const sameBox = (a: { south: number; north: number; west: number; east: number }, b: typeof a): boolean =>
  Math.abs(a.south - b.south) < 1e-6 && Math.abs(a.north - b.north) < 1e-6 && Math.abs(a.west - b.west) < 1e-6 && Math.abs(a.east - b.east) < 1e-6

/**
 * The landmark audit, spawned under vite-node because it needs the REAL selection code from
 * src/render/landmarks.ts and that imports Babylon with extensionless specifiers, which plain node — the
 * bake's own runtime — cannot resolve.
 *
 * Staged, and the early stages are the point (owner, 2026-09-23: *"hopefully it terminates EARLY because we
 * don't want to get errors at the end of a 4 hour bake job"*). A stage that FAILS stops the bake there; a
 * stage that could not RUN AT ALL also stops it, because a check that quietly skipped is how Paris printed
 * green for weeks (BUGS.md #101).
 *
 *   `npm run bake -- --no-audit`  skips it, for working on the bake itself.
 */
function auditStage(stage: string, spec: CitySpec, extra: string[] = []): void {
  if (process.argv.includes('--no-audit')) return
  // a test area is a small cut of a real city: its region's manifest names buildings mostly outside it, so the
  // manifest audit cannot pass there and says nothing about the city it came from
  if (spec.test) { console.log(`  (bake audit stage ${stage} skipped: ${spec.id} is a test area)`); return }
  const bin = resolve(import.meta.dirname, '..', 'node_modules', '.bin', 'vite-node')
  const r = spawnSync(bin, [resolve(import.meta.dirname, 'bake-audit.ts'), '--', `--city=${spec.id}`,
    `--stage=${stage}`, ...extra], { stdio: 'inherit' })
  if (r.status === 0) return
  console.error(`\n  !! BAKE AUDIT stage ${stage} DID NOT PASS for ${spec.id}`
    + `${r.error ? ` — it could not even run: ${r.error.message}` : ''}`)
  console.error('     Nothing below this point has been baked. Fix the manifest, or re-run with --no-audit.')
  process.exit(1)
}

async function bake(spec: CitySpec): Promise<void> {
  console.log(`\n${spec.name}`)
  // BEFORE a single Overpass call: every check that needs nothing but the manifests. A landmark entry naming
  // a builder that does not exist must never cost four hours to discover.
  auditStage('1', spec)
  /*
   * Two fetches, two boxes (tools/cities.ts `detail`): the city in detail over the blocks that are modelled, and
   * the wide box — roads, rails, water, the coast and the motorway BRIDGES — over everything the box reaches.
   * San Francisco's box runs out to both bridges so they can be ridden; its detail box stops at the city, so
   * Oakland's buildings are never baked.
   */
  const detailBox = detailBboxOf(spec)
  const wholeBox = bbox(spec)
  const near = await overpassDetail(cityQuery, spec)
  // (none where the box was grown only to hold detail regions: it would bake every suburban street between them)
  const wider = spec.wide === false || sameBox(detailBox, wholeBox) ? { ways: [], nodes: [], relations: [] } : await overpassTiled(wideQuery, wholeBox)
  const seenWay = new Set(near.ways.map((w) => w.id))
  const seenNode = new Set(near.nodes.map((n) => n.id))
  const seenRel = new Set(near.relations.map((r) => r.id))
  const ways = [...near.ways, ...wider.ways.filter((w) => !seenWay.has(w.id))]
  const nodes = [...near.nodes, ...wider.nodes.filter((n) => !seenNode.has(n.id))]
  const relations = [...near.relations, ...wider.relations.filter((r) => !seenRel.has(r.id))]
  const { copyright, timestamp } = near
  console.log(`  ${ways.length} ways, ${nodes.length} nodes, ${relations.length} relations`
    + (wider.ways.length ? ` (${wider.ways.length} from the wide box)` : ''))
  // the public stairways, from their own query (tools/overpass.ts stepsQuery), and the region's own where OSM
  // has not mapped them — each a polyline, its ends joined to the paths beside them (joinNearMisses below)
  {
    // (a light query: big chunks, so a busy Overpass is asked four times rather than twenty)
    const got = await overpassBox(stepsQuery, spec, 3200).catch((e) => {
      console.warn(`  steps: not fetched (${String(e).slice(0, 120)})`)
      return { ways: [] as OsmWay[] }
    })
    const have = new Set(ways.map((w) => w.id))
    let n = 0
    for (const w of got.ways) if (!have.has(w.id) && w.tags.highway === 'steps') { ways.push(w); n++ }
    let own = 0
    for (const [k, st] of (region(spec.region).stairways ?? []).entries()) {
      const id = -(900000 + k)
      ways.push({ type: 'way', id, tags: { highway: 'steps', name: st.name, ...(st.width ? { width: String(st.width) } : {}) },
        nodes: st.points.map((_, i) => -(900000 + k) * 1000 - i), geometry: st.points.map(([lat, lon]) => ({ lat, lon })) } as unknown as OsmWay)
      own++
    }
    console.log(`  ${n} stairways from OSM, ${own} of the region's own`)
  }
  // the hospital, university and college grounds (tools/overpass.ts campusQuery), for dressing the buildings on them
  // (a multipolygon's grounds too — Galileo High's are a relation — as one way per outer ring)
  const campusWays = await overpassBox(campusQuery, spec, 3200).then((g) => [...g.ways,
    ...(g.relations ?? []).flatMap((r) => outerRings(r).filter((q) => q.length >= 4).map((q) => ({ type: 'way' as const, id: r.id, nodes: [], geometry: q, tags: r.tags }) as unknown as OsmWay))]).catch((e) => {
    console.warn(`  campuses: not fetched (${String(e).slice(0, 120)})`)
    return [] as OsmWay[]
  })
  console.log(`  ${campusWays.length} hospital / university / college / school grounds`)
  // the region's own AUTHORED ways (src/city/sf/bridges.ts: the Bay Bridge Bikeway), joined to the real junctions
  // they name, their heights their own (kept aside here, put back by tools/deck-conform.ts)
  const authored = authoredWays(spec.region ?? spec.id, spec.centre, ways, (() => {
    // (padded a little: the OSM fetched over `wholeBox` can carry a way's end just past it, and those were always kept)
    const b = bbox(spec, 150), p = new Projection(spec.centre)
    const a = p.toLocal({ lat: b.south, lon: b.west }), c = p.toLocal({ lat: b.north, lon: b.east })
    return { x0: Math.min(a.x, c.x), x1: Math.max(a.x, c.x), z0: Math.min(a.z, c.z), z1: Math.max(a.z, c.z) }
  })())
  ways.push(...authored.ways)
  if (authored.ways.length) console.log(`  ${authored.ways.length} authored ways of the region's own`)

  const proj = new Projection(spec.centre)
  // BDTOPO_ZONES=1 (tools/bdtopo-zones.ts, pilot): each hand deck zone replaced in memory by its BD TOPO version, hand facts merged
  // BDTOPO_BAND=1 (tools/seine-band.ts, 2026-11-08): ONE Seine band from BD TOPO (water + bridges), the hand zones as overrides on
  //  top; `bandAt` (local x, z) stands the inference passes down inside it (plates, deck clearance, the lower-quay shelf, sunk
  //  tunnel mouths, meetDecks)
  const seine = process.env.BDTOPO_BAND === '1' ? await (async () => {
    const r = region(spec.region), t0 = Date.now()
    // (bandExclude by location: the excluded bridges' OSM outlines (bridgesQuery, cached; fetched again for the outlines below)
    //  and their named bridge-tagged deck ways)
    const exN = new Set((r.bandExclude ?? []).map((q) => q.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()))
    const isEx = (n?: string): boolean => !!n && exN.has(n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
    const osmB: BandBridgeShape[] = []
    if (exN.size) {
      const got = await overpassBox(bridgesQuery, spec).catch(() => null)
      for (const w of got?.ways ?? []) if (isEx(w.tags?.name) && w.geometry) osmB.push({ name: w.tags.name!, pts: w.geometry.map((q) => proj.toLocal(q)), ring: true })
      for (const rl of got?.relations ?? []) if (isEx(rl.tags?.name)) for (const g of outerRings(rl)) osmB.push({ name: rl.tags.name!, pts: g.map((q) => proj.toLocal(q)), ring: true })
      for (const w of ways) if (w.tags.bridge && w.tags.bridge !== 'no' && isEx(w.tags.name) && w.geometry) osmB.push({ name: w.tags.name!, pts: w.geometry.map((q) => proj.toLocal(q)) })
    }
    const b = await bandDeckZones(spec.centre, spec.radius ?? 1000, r.deckZones ?? [], r.bandExclude ?? [], (lat, lon) => proj.toLocal({ lat, lon }), (t) => console.log(`  ${t}`), r.riverLevel, osmB)
    console.log(`  timing: seine band built in ${((Date.now() - t0) / 1000).toFixed(1)} s`)
    return { region: { ...r, deckZones: b.zones }, band: b.band }
  })() : null
  const bandAt = (x: number, z: number): boolean => !!seine && seine.band.inside(x, z)
  const bandAny = (e: { points: ArrayLike<number> }): boolean => { if (!seine) return false; for (let i = 0; i < e.points.length; i += 2) if (seine.band.inside(e.points[i], e.points[i + 1])) return true; return false }
  const streetRegion = seine ? seine.region : process.env.BDTOPO_ZONES === '1' && region(spec.region).deckZones?.length ? await (async () => {
    const r = region(spec.region), log: string[] = []
    const dz = await Promise.all(r.deckZones!.map((z: DeckZoneSpec) => bdTopoZone(z, log)))
    for (const t of log) console.log(`  ${t}`)
    return { ...r, deckZones: dz }
  })() : region(spec.region)
  /*
   * No driving aisles inside a surface CAR PARK (owner, 2026-10-17: "we should probably not draw roads inside parking lots
   * (since they are guesses from OSM and don't line up with the cars)"): the lot is laid out with its own stall rows and
   * parked cars (city/parking.ts). `service=parking_aisle` goes, and an untagged service way lying mostly inside a surface
   * `amenity=parking` polygon. Neither was ridden (city/ridegraph.ts NOT_A_STREET), only drawn.
   */
  const carParks = ways.filter((w) => w.tags.amenity === 'parking' && !/^(multi-storey|underground|rooftop)$/.test(w.tags.parking ?? '') && w.geometry && w.geometry.length >= 4)
    .map((w) => {
      const r = w.geometry!.map((g) => [g.lat, g.lon] as [number, number])
      return { r, a0: Math.min(...r.map((p) => p[0])), a1: Math.max(...r.map((p) => p[0])), o0: Math.min(...r.map((p) => p[1])), o1: Math.max(...r.map((p) => p[1])) }
    })
  const inCarPark = (lat: number, lon: number): boolean => carParks.some(({ r, a0, a1, o0, o1 }) => {
    if (lat < a0 || lat > a1 || lon < o0 || lon > o1) return false
    let c = false
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][0] > lat) !== (r[j][0] > lat) && lon < ((r[j][1] - r[i][1]) * (lat - r[i][0])) / (r[j][0] - r[i][0]) + r[i][1]) c = !c
    return c
  })
  const aisle = (w: OsmWay): boolean => {
    if (w.tags.highway !== 'service') return false
    if (w.tags.service === 'parking_aisle') return true
    if (w.tags.service || !w.geometry || w.geometry.length < 2) return false
    return w.geometry.filter((g) => inCarPark(g.lat, g.lon)).length / w.geometry.length > 0.6
  }
  /*
   * Ways OSM tags as bridges that a rider meets AT GRADE (region `atGrade`): Cyril Magnin Street over the sunken half of
   * Hallidie Plaza is `bridge=yes layer=1 level=0` — a street at the street's own level spanning a hole — and the bridge
   * rules lifted it and its traffic, a car riding over a bus at Market (BUGS.md #318, 2026-10-17).
   */
  for (const w of ways) if ((streetRegion.atGrade ?? []).includes(w.id)) { delete w.tags.bridge; delete w.tags.layer }
  const allStreets = ways.filter((w) => w.tags.highway && w.geometry && w.geometry.length === w.nodes.length)
  const streets = allStreets.filter((w) => !aisle(w))
  console.log(`  ${allStreets.length - streets.length} car-park aisles left out (drawn as the lot's own stall rows)`)
  // the paths that stop a few metres short of the way they obviously run into, joined to it (tools/gaps.ts)
  const joins = joinNearMisses(streets, (g) => proj.toLocal(g))
  console.log(`  ${joins} near-miss path ends joined to the way beside them`)
  /*
   * Only the lines trains RUN on. Any `railway=` was taken, and an abandoned or razed line is a railway in OSM to the
   * end of time: the Mill Valley - Sausalito Path and the rest of the Northwestern Pacific's old bed in Marin carry
   * `railway=abandoned|razed` beside `highway=cycleway`, and Sausalito filled with trains running down its bike path
   * (owner, 2026-10-02: "Sausalito also displays with way too many trains").
   */
  const RUNNING = /^(rail|light_rail|tram|subway|narrow_gauge|funicular|monorail)$/
  // (and not industrial yard track: Sausalito's boatyard slipways are `railway=rail, service=yard, usage=industrial`)
  /*
   * …and in Paris the PETITE CEINTURE (2026-10-31, the audit of every line, tools/rail-audit.ts: it is the first line the owner names). Closed to passengers in 1934 and to
   * freight in 1993 and tagged railway=disused, 25 km of it are still rails in the open round the whole city, on their own bridges over the boulevards: drawn, with no train.
   */
  const disusedRun = spec.region === 'paris'
  const railways = ways.filter((w) => (RUNNING.test(w.tags.railway ?? '') || (disusedRun && w.tags.railway === 'disused')) && !/^(abandoned|disused|razed|construction|proposed)$/.test(w.tags.usage ?? '')
    && !(w.tags.service === 'yard' && w.tags.usage === 'industrial'))
  /*
   * THE ROUNDABOUTS OSM MAPS (owner, 2026-10-29: "we also have to handle all the traffic circles, which is already done for
   * a few cases"): a ring of junction=roundabout road ways, joined end to end, is a place the ride graph draws as a circle
   * and its spokes (ridegraph.ts applyRoundabout) — as the seven placed by hand in city/overrides.ts are. Its centre and
   * radius from its own points; cut out to R, past the junctions round it. Only rings going most of the way round, of
   * 14 to 120 m: a mini-roundabout is an ordinary junction to a rider, and a half-mapped one is not a circle.
   */
  const roundabouts: NonNullable<CityPackage['roundabouts']> = []
  {
    // (Paris tags its great places — the Étoile, the Nation, the Place d'Italie — junction=circular: 483 ways in the box to
    //  117 junction=roundabout, 2026-10-30; the first two bakes found 14 rings, nearly all in the suburbs)
    const rings = ways.filter((w) => /^(roundabout|circular)$/.test(w.tags.junction ?? '') && w.tags.highway && !/^(footway|path|cycleway|steps|pedestrian)$/.test(w.tags.highway) && w.geometry && w.geometry.length >= 2)
    const key = (g: LatLon): string => `${g.lat.toFixed(6)},${g.lon.toFixed(6)}`
    const parent = rings.map((_, i) => i)
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
    const byEnd = new Map<string, number>()
    rings.forEach((w, i) => {
      for (const g of [w.geometry![0], w.geometry![w.geometry!.length - 1]]) {
        const k = key(g), j = byEnd.get(k)
        if (j === undefined) byEnd.set(k, i); else parent[find(i)] = find(j)
      }
    })
    const groups = new Map<number, typeof rings>()
    rings.forEach((w, i) => { const r = find(i); groups.set(r, [...(groups.get(r) ?? []), w]) })
    for (const g of groups.values()) {
      const pts = g.flatMap((w) => w.geometry!.map((q) => proj.toLocal(q)))
      const cx = pts.reduce((t, q) => t + q.x, 0) / pts.length, cz = pts.reduce((t, q) => t + q.z, 0) / pts.length
      const r = pts.reduce((t, q) => t + Math.hypot(q.x - cx, q.z - cz), 0) / pts.length
      // round, and most of the way round: its points' bearings from the centre cover at least 300°
      const bins = new Set(pts.map((q) => Math.floor(((Math.atan2(q.z - cz, q.x - cx) + Math.PI) / (2 * Math.PI)) * 12) % 12))
      const spread = pts.reduce((t, q) => t + Math.abs(Math.hypot(q.x - cx, q.z - cz) - r), 0) / pts.length
      if (r < 14 || r > 120 || bins.size < 10 || spread > r * 0.35) continue
      const ll = proj.toLatLon({ x: cx, z: cz })
      const name = g.find((w) => w.tags.name)?.tags.name
      roundabouts.push({ lat: +ll.lat.toFixed(6), lon: +ll.lon.toFixed(6), r: Math.round(r), R: Math.round(r + Math.max(30, r * 0.6)), ...(name ? { name } : {}) })
    }
    console.log(`  ${roundabouts.length} roundabouts from OSM's junction=roundabout rings (of ${groups.size} ring groups)`)
  }
  /**
   * Buildings, minus the outlines that have been superseded by their own parts.
   *
   * OSM's Simple 3D Buildings scheme maps a building that is not one simple box — a tower on a podium, a
   * church with a spire, anything stepped — as a plain `building` outline for the footprint PLUS a set of
   * `building:part` ways inside it carrying the real heights. Both are ways with a shape and a height, so
   * taking every one of them builds the detailed parts AND the crude single-height box they are meant to
   * replace, one inside the other with coincident walls. That is what made a glass tower in San Francisco
   * appear to have a brick building inside it: the podium's walls and the outline's walls are the same
   * walls, and the depth test picks per pixel.
   *
   * It is not a rare case — a third of the Loop's buildings are parts nested inside an outline.
   *
   * So: if an outline contains a part, the parts win and the outline is dropped. If it contains none, the
   * outline IS the building and is kept, which is the ordinary case for almost every house on a street.
   */
  /*
   * A `building=roof` on a layer above the ground is a canopy over an elevated platform — the Loop has a
   * hundred of them along the L. The facade grammar can only draw a box, and a one-storey brick box standing
   * on the L is worse than the canopy being missing, so they are left out.
   */
  const canopy = (t: Record<string, string>): boolean => t.building === 'roof' && parseInt(t.layer ?? '0', 10) >= 1
  /*
   * Nothing below the ground and nothing indoors: OSM maps the Métro's big stations room by room — corridors,
   * stairways, ticket halls as `building:part` with `indoor=*`, `location=underground` and negative layers —
   * and each came out as a 20 m block on the square above it (the Place de la République was full of them,
   * BUGS.md #29). A building standing at grade with a basement keeps its own non-negative layer.
   */
  const belowGround = (t: Record<string, string>): boolean => t.location === 'underground' || t.indoor !== undefined
    || (parseFloat(t.layer ?? '0') < 0 && t.location !== 'surface') || (t.level !== undefined && t.level.split(';').every((v) => parseFloat(v) < 0))
  // boats moored on the river are drawn as boats (render/boats.ts), not as twenty-metre blocks in the water
  /*
   * …and the historic SHIPS (BUGS.md #229, #251): OSM tags the waterfront's vessels `building=ship`, which went down
   * the building path — the owner: "two permanently placed ships … that render as victorian buildings in the water".
   * A ship is a boat (a hull at the water) unless a landmark entry claims its way for a model of its own (USS
   * Pampanito, manual-1.json): that one stays a building for the model to replace.
   */
  const shipModels = landmarkClaims(spec.region ?? spec.id)
  const isBoat = (w: { id: number; tags: Record<string, string> }): boolean => ['boat', 'houseboat', 'ship'].includes(w.tags.building) && !shipModels.has(w.id)
  const boatWays = ways.filter((w) => isBoat(w) && w.geometry && w.geometry.length >= 4)
  /*
   * BUGS.md #150, #151. Infrastructure wearing a building tag. The Bay Bridge's four western-span suspension
   * towers carry `building=tower` beside `bridge:support=pylon`, so they were extruded as buildings and drawn
   * ON TOP of the `bayBridge` builder's own towers (owner: "bay bridge pier buildings are still showing up as
   * buildings"). They also reached a kit batch, where four consecutive 160 m ids over water looked like a
   * development — the same trap as the three Oracle Park floodlight masts in #127.
   *
   * NAMED masts and towers are kept: Sutro Tower is a landmark and is drawn as one. It is the UNNAMED ones
   * that are never worth a building.
   */
  const isInfrastructure = (t: Record<string, string>): boolean => t['bridge:support'] !== undefined
    || (t.name === undefined && (t.power !== undefined || t['tower:type'] !== undefined
      || /^(tower|mast|chimney|silo|storage_tank|water_tower|communications_tower)$/.test(t.man_made ?? '')))
  /*
   * `building:part=no` says the way is NOT a part (Sutro Tower's outline at its foot carries it, beside `building=tower`)
   * — and it was taken as one by the truthy test, then drawn as a 12 m apartment block round the tower (#236).
   */
  const isPart = (t: Record<string, string>): boolean => !!t['building:part'] && t['building:part'] !== 'no'
  // (`building=no` is OSM saying it is NOT one — unless a landmark entry claims the way for a model of its own, as the
  //  Yerba Buena Gardens Esplanade stage's is: the bake audit stopped bake 33 when it went missing, 2026-10-05)
  const outlines = ways.filter((w) => w.tags.building && (w.tags.building !== 'no' || shipModels.has(w.id)) && !isPart(w.tags) && !canopy(w.tags) && !belowGround(w.tags) && !isBoat(w) && !isInfrastructure(w.tags))
  /*
   * The parts mapped as multipolygon RELATIONS, each outer ring standing in as a part way (packed `rel.id * 2 + 1`,
   * the id space every relation building uses), so the coverage, `partOf` and dressing below treat them exactly as
   * part ways. Own query (overpass.ts `partRelationsQuery`); none fetched only costs those buildings.
   */
  const partRels = await overpassDetail(partRelationsQuery, spec).catch((e) => {
    console.warn(`  part relations: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
    return { ways: [] as OsmWay[], relations: [] as typeof relations }
  })
  const partRelWays: OsmWay[] = partRels.relations
    .filter((r) => isPart(r.tags) && r.tags.building === undefined && !belowGround(r.tags))
    .flatMap((r) => outerRings(r).filter((g) => g.length >= 4).map((g) => ({ type: 'way' as const, id: r.id * 2 + 1, nodes: [], geometry: g, tags: r.tags })))
  if (partRelWays.length) console.log(`  ${partRelWays.length} building parts from multipolygon relations`)
  const parts = [...ways.filter((w) => isPart(w.tags) && !belowGround(w.tags)), ...partRelWays]
  const partSeeds = parts
    .filter((w) => w.geometry && w.geometry.length >= 3)
    // the part's centre, not its first vertex: parts share the outline's edges, and a vertex exactly ON
    // the boundary lands inside or outside by rounding — which is how a tower's upper floors lost their owner
    .map((w) => {
      const pts = w.geometry!.slice(0, -1).map((g) => proj.toLocal(g))
      let x = 0
      let z = 0
      for (const q of pts) { x += q.x; z += q.z }
      return { way: w, at: { x: x / pts.length, z: z / pts.length } }
    })
  const superseded = new Set<number>()
  // which outline each part belongs to, so the parts of one building can be dressed as one building
  const ownerOf = new Map<number, OsmWay>()
  // which RELATION outline a part belongs to (a relation has no OsmWay-shaped tags/geometry to dress with,
  // so this only ever feeds `partOf` — the part keeps dressing itself, as it already did)
  const relOwnerOf = new Map<number, number>()
  // outlines kept alongside parts that float above them, and the height they must reach
  const raiseTo = new Map<number, number>()
  // outlines kept round GROUNDED parts that cover only a little of them — a podium with buildings on it — and the
  // height they are held to, under those buildings
  const capTo = new Map<number, number>()
  for (const w of outlines) {
    if (!w.geometry || w.geometry.length < 4) continue
    const ring = w.geometry.map((g) => proj.toLocal(g))
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of ring) {
      if (p.x < x0) x0 = p.x
      if (p.x > x1) x1 = p.x
      if (p.z < z0) z0 = p.z
      if (p.z > z1) z1 = p.z
    }
    /*
     * The parts replace the outline only if they actually stand in for it: at least one of them starts
     * at the ground, and between them they cover most of the footprint. Some towers have only their
     * crown mapped as parts (a Brooklyn tower's stacked rings of balconies), and dropping the outline for
     * those left the crown hanging in the sky with nothing under it.
     */
    let covered = 0
    let grounded = false
    for (const { way, at: s } of partSeeds) {
      if (s.x < x0 || s.x > x1 || s.z < z0 || s.z > z1) continue
      if (!pointInRing(ring, s.x, s.z)) continue
      ownerOf.set(way.id, w)
      covered += area(way.geometry!.slice(0, -1).map((g) => proj.toLocal(g)))
      const t = way.tags
      if (!t.min_height && !t['building:min_level']) grounded = true
    }
    if (grounded && covered >= 0.5 * area(ring)) superseded.add(w.id)
    else if (covered > 0) {
      // kept, with parts floating above it: the tower's top floors are mapped and the floors between are
      // not, so the outline is raised to meet the highest part rather than leaving a gap of sky
      let top = 0
      let lowest = Infinity
      let floating = false
      for (const { way, at: q } of partSeeds) {
        if (ownerOf.get(way.id) !== w) continue
        const pp = getBuildingParamsFromOSMTags(way.tags) as { buildingHeight?: number }
        if (pp.buildingHeight) top = Math.max(top, pp.buildingHeight)
        if (way.tags.min_height || way.tags['building:min_level']) floating = true
        else if (pp.buildingHeight) lowest = Math.min(lowest, pp.buildingHeight)
        void q
      }
      /*
       * Raised only to meet parts that FLOAT (a crown mapped, the floors under it not). Parts standing on the ground
       * that cover a little of the outline are buildings on a podium — Golden Gateway Commons' townhouses on their
       * garage — and raising the podium to the townhouses' 14 m put identical blocks one inside the other (owner,
       * 2026-10-03: "intersections here that can't possibly be right"). There an outline with no height of its own is
       * held UNDER its parts, as the podium it is.
       */
      if (floating && top > 0) raiseTo.set(w.id, top)
      else if (lowest < Infinity && !w.tags.height && !w.tags['building:levels']) capTo.set(w.id, Math.max(3.5, lowest * 0.45))
    }
  }
  if (capTo.size) console.log(`  ${capTo.size} podium outlines held under the buildings standing on them`)
  /*
   * The same supersession, for a building outline mapped as a RELATION (a multipolygon) rather than a way —
   * Simple 3D Buildings does not care which one carries the footprint, but this pipeline, until now, only
   * ever looked at ways: `outlines` above is `ways.filter(...)`, so a relation outline's `building:part`
   * ways were never marked superseded or given an owner, and stood inside it unclaimed. The relation itself
   * is emitted separately below (the `areaRels` loop, "Multipolygon relations"), so the result was the
   * relation's own crude box AND every one of its parts, both drawn, coincident walls and all — the "old
   * generic model showing through the new model" the owner reported for the Marriott Marquis, whose
   * `building:part`s (three `chicago`-styled 24 m boxes) sit inside `relation/6483285`'s footprint with no
   * way outline to claim them (BUGS.md #171). Packed as `rel.id * 2 + 1`, the same id space `packedIds` and
   * the `areaRels` loop below already use for a relation, so the manifest's `isReplaced`/`claims` (which
   * follow a part's `partOf` to its owner) reach these exactly as they do a superseded way's parts.
   */
  for (const rel of relations) {
    if (rel.tags.building === undefined) continue
    const relId = rel.id * 2 + 1
    for (const ring of outerRings(rel)) {
      const pts = ring.slice(0, -1).map((g) => proj.toLocal(g))
      if (pts.length < 3) continue
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const p of pts) {
        if (p.x < x0) x0 = p.x
        if (p.x > x1) x1 = p.x
        if (p.z < z0) z0 = p.z
        if (p.z > z1) z1 = p.z
      }
      let covered = 0
      let grounded = false
      for (const { way, at: s } of partSeeds) {
        if (ownerOf.has(way.id)) continue // a way outline already claims it; a relation never overrides that
        if (s.x < x0 || s.x > x1 || s.z < z0 || s.z > z1) continue
        if (!pointInRing(pts, s.x, s.z)) continue
        relOwnerOf.set(way.id, relId)
        covered += area(way.geometry!.slice(0, -1).map((g) => proj.toLocal(g)))
        const t = way.tags
        if (!t.min_height && !t['building:min_level']) grounded = true
      }
      if (grounded && covered >= 0.5 * area(pts)) superseded.add(relId)
    }
  }
  const buildingWays = [...outlines.filter((w) => !superseded.has(w.id)), ...parts]
  console.log(`  ${outlines.length} outlines + ${parts.length} parts → ${buildingWays.length} `
    + `(${superseded.size} outlines replaced by their parts)`)

  // ---- streets: split every way at every node shared with another way
  const useCount = new Map<number, number>()
  for (const w of streets) for (const n of w.nodes) useCount.set(n, (useCount.get(n) ?? 0) + 1)

  const edges: PackedEdge[] = []
  let edgeId = 1
  for (const w of streets) {
    if (!w.geometry || w.geometry.length < 2) continue
    let startIdx = 0
    let last: PackedEdge | null = null
    for (let i = 1; i < w.nodes.length; i++) {
      const isJunction = (useCount.get(w.nodes[i]) ?? 0) > 1
      const isEnd = i === w.nodes.length - 1
      if (!isJunction && !isEnd) continue
      const geom = w.geometry.slice(startIdx, i + 1)
      let emitted = false
      if (geom.length >= 2) {
        const pts = geom.map((g) => proj.toLocal(g))
        let len = 0
        for (let k = 1; k < geom.length; k++) len += haversine(geom[k - 1], geom[k])
        if (len > 0.5) {
          const kerbToKerb = streetRegion.streetWidth === 'carriageway'
          const corridor = kerbToKerb ? widthOfNA(w.tags) : widthOf(w.tags)
          const foot = isFoot(w.tags)
          // mapped separately (`sidewalk=separate`, or its lanes counted): the tagged width is the carriageway —
          // the Pont Notre-Dame's two lanes came out as one 2.8 m lane between 4 m pavements
          // …but only when the width IS the carriageway's, from its lanes or its own width: without them the
          // class default is a whole corridor, and the Champs-Élysées' contre-allées spread over their pavements
          const measured = w.tags.width !== undefined || w.tags.lanes !== undefined
          const separate = measured && (/^(separate|no|none)$/.test(w.tags.sidewalk ?? '') || w.tags['sidewalk:both'] === 'separate')
          // (no pavement beside a freeway: the Bay Bridge's approaches had 3.8 m of paving each side, and people on it)
          const freeway = w.tags.highway === 'motorway' || w.tags.highway === 'motorway_link'
          const walk = foot || freeway ? 0 : kerbToKerb ? pavementForNA(corridor) : separate ? 0.6 : pavementFor(corridor)
          edges.push({
            id: edgeId++, a: w.nodes[startIdx], b: w.nodes[i],
            // (Paris's lower quays, the "Port de …" roads along the Seine, are cobbled whatever OSM says — owner, 2026-10-30,
            //  at the Port de Javel: "this road is actually cobblestone which may not be reflected in OSM")
            // (and a Paris STREET OSM gives as paving_stones — Montorgueil, Vendôme, the Marais's pedestrian lanes — is laid in
            //  pavés, not the concrete the generic table gives it, which a carriageway then drew as asphalt; owner, 2026-11-06.
            //  Footways keep concrete: there it is the pavement's slabs.)
            points: packPoints(pts), surface: streetRegion.roadPaint === 'paris' && ((w.tags.highway === 'service' && /^Port (de|du|des|d') /.test(w.tags.name ?? '') && /^(|paving_stones|concrete|sett|cobblestone)$/.test(w.tags.surface ?? '')) ||
              (w.tags.surface === 'paving_stones' && PAVE_STREETS.has(w.tags.highway))) ? 'cobblestone' : surfaceOf(w.tags),
            // the carriageway is the corridor less its two pavements, never narrower than a single lane —
            // or, where the region measures kerb to kerb, the width itself
            width: foot || kerbToKerb || separate || freeway ? corridor : Math.max(2.8, corridor - 2 * walk),
            walk,
            name: w.tags.name, foot,
            // OSM marks these itself, which is far better than guessing from where two ways overlap
            crossing: w.tags.footway === 'crossing' || w.tags.path === 'crossing'
              || w.tags.crossing !== undefined || w.tags.highway === 'crossing' || undefined,
            ...wayTags(w.tags),
            // (its own heights, at its nodes: the bake puts more points along long ways later, so they are kept with
            // where they are, and laid along every point at the end — tools/deck-conform.ts)
            ...(w.tags['sr:authored'] ? { authored: true, _y: pts.map((p, k) => [p.x, p.z, authored.y.get(w.nodes[startIdx + k]) ?? 0]) } : {}),
          })
          last = edges[edges.length - 1]
          emitted = true
        }
      }
      /*
       * …and a piece under half a metre at the END of a way is folded BACK into the one before: there is no
       * next one. Rue de l'Archevêché's last 0.3 m, from the footway crossing to the node the Pont de
       * l'Archevêché starts from, was lost that way, and the bridge was a dead end (BUGS.md #9).
       */
      if (!emitted && isEnd && last && i > startIdx) {
        const pts = unpackPoints(last.points)
        pts.push(proj.toLocal(w.geometry[i]))
        last.points = packPoints(pts)
        last.b = w.nodes[i]
      }
      /*
       * A piece under half a metre is not dropped but folded into the next one: dropping it cut the graph.
       * The Pavillon du Roi's arch ends 0.4 m before the junction where Rue de Birague runs on into the Place
       * des Vosges, and without that 0.4 m the arch was a dead-end stub the ride graph pruned away.
       */
      if (emitted || isEnd) startIdx = i
    }
  }

  // ---- keep only the largest connected component: an island of three streets the rider can never
  // reach is worse than not having it, because it appears on the map and cannot be ridden to.
  /*
   * TRAILS a bike rides (owner, 2026-10-02: "there should be a trail to the baths"): in a zone with `trails: 'bike'`,
   * a footway, path or track with a riding surface (not steps, not sand) joins the bike network.
   */
  {
    const trailZones = loadZones(spec, (lat, lon) => proj.toLocal({ lat, lon })).filter((zn) => zn.props.trails === 'bike')
    let n = 0
    if (trailZones.length) for (const e of edges) {
      // (a bridge rides whatever its deck is: the Pont Suspendu's is timber)
      if (!/^(footway|path|track|bridleway)$/.test(e.kind ?? '') || (!e.bridge && /^(sand|mud|grass|rock|stone|wood)$/.test(e.surface ?? ''))) continue
      const pts = unpackPoints(e.points)
      const mid = pts[Math.floor(pts.length / 2)]
      if (trailZones.some((zn) => zonesAt([zn], mid.x, mid.z).length > 0)) { e.trail = true; n++ }
    }
    if (n) console.log(`  ${n} trails opened to bikes (zones with trails: 'bike')`)
    if (region(spec.region).rideFootBridges) {
      const ids = footBridgeLinks(edges)
      for (const e of edges) if (ids.has(e.id)) e.trail = true
      console.log(`  ${ids.size} ways of named foot bridges opened to bikes`)
    }
  }
  // (and the islands a ferry serves: their paths are kept though no street reaches them — region `ferryIslands`)
  const ferryIslands = (region(spec.region ?? spec.id).ferryIslands ?? []).map((k) => ({ ...proj.toLocal({ lat: k.lat, lon: k.lon }), r: k.radius }))
  const kept = largestComponent(edges, ferryIslands.length ? (e) => unpackPoints(e.points).some((p) => ferryIslands.some((k) => Math.hypot(p.x - k.x, p.z - k.z) < k.r)) : undefined)
  console.log(`  ${edges.length} edges → ${kept.length} in the largest connected network`)
  if (ferryIslands.length) {
    const near = (e: (typeof edges)[number]): boolean => unpackPoints(e.points).some((p) => ferryIslands.some((k) => Math.hypot(p.x - k.x, p.z - k.z) < k.r))
    console.log(`  ferry islands: ${edges.filter(near).length} edges near them, ${kept.filter(near).length} kept`)
  }

  // ---- buildings
  /*
   * Heights nobody tagged. The tag layer would call every one of them a single storey; the region's own
   * method guesses better (tools/heights.ts). The guess goes in as a `building:levels` tag so the tag layer
   * does everything else exactly as it would for a mapper's number.
   */
  const reg = region(spec.region)
  // the city's own sign lettering (tools/signgen): generated, never checked in
  buildSigns(spec.id)

  const classify = classifierFor(spec.region)
  /** one row per building: what the classifier decided and which rule decided it (written out below) */
  const audit: string[] = []
  // and the city's own records, where the region has them: SF's Assessor rolls (tools/sf-parcels.ts)
  // (over a box half a kilometre wider than the detail box: Overpass returns whole buildings, so those on its edge reach
  // past it, and with the rolls cut at the same line the ~5 900 south of 37.7526 had no record and fell to the default —
  // 24th Street's houses and shops drawn as SoMa's brick lofts, 2026-10-21)
  const PAD = 0.005
  const rollBox = (b: ReturnType<typeof detailBboxOf>) => ({ south: b.south - PAD, west: b.west - PAD, north: b.north + PAD, east: b.east + PAD })
  const recordOf = spec.region === 'san-francisco'
    ? await import('./sf-parcels.ts').then(async (m) => m.parcelIndex(await m.fetchRolls(rollBox(detailBboxOf(spec)))))
      .catch((e: unknown) => { console.warn(`  sf-parcels: not fetched (${String(e).slice(0, 120)})`); return null })
    // Paris: every building's age and whether it is a public facility, from APUR (tools/paris-apur.ts)
    : spec.region === 'paris'
      ? await Promise.all([
        import('./paris-apur.ts').then(async (m) => m.apurIndex(await m.fetchApur()))
          .catch((e: unknown) => { console.warn(`  apur: not fetched (${String(e).slice(0, 120)})`); return null }),
        // and every building's wall and roof material, from BD TOPO (tools/paris-bdtopo.ts), suburbs too
        import('./paris-bdtopo.ts').then(async (m) => m.topoIndex(await m.fetchTopoFor(spec)))
          .catch((e: unknown) => { console.warn(`  bdtopo: not fetched (${String(e).slice(0, 120)})`); return null }),
      ]).then(([apur, topo]) => apur || topo
        ? (ring: { lat: number; lon: number }[]) => {
            const a = apur?.(ring) ?? null, t = topo?.(ring) ?? null
            // APUR's surveyed height wins inside Paris; BD TOPO's measures the suburbs
            return a || t ? { ...(a ?? { construction: '99', units: 0, parcels: 1 }), ...(t ?? {}), ...(a?.height ? { height: a.height } : {}) } : null
          }
        : null)
    : null
  const taggedNear: TaggedNeighbour[] = []
  const ringOfWay = (w: OsmWay): { x: number; z: number }[] | null =>
    w.geometry && w.geometry.length >= 4 ? w.geometry.slice(0, -1).map((g) => proj.toLocal(g)) : null
  for (const w of [...outlines, ...parts]) {
    const lv = taggedLevels(w.tags)
    const r = lv !== undefined ? ringOfWay(w) : null
    if (r) taggedNear.push({ ...centroid(r), levels: lv! })
  }
  for (const rel of relations) {
    const lv = rel.tags.building !== undefined ? taggedLevels(rel.tags) : undefined
    if (lv === undefined) continue
    for (const ring of outerRings(rel)) {
      const pts = ring.slice(0, -1).map((g) => proj.toLocal(g))
      if (pts.length >= 3) taggedNear.push({ ...centroid(pts), levels: lv })
    }
  }
  const grid = new NeighbourGrid(taggedNear)
  /** the tags to hand the tag layer: the mapper's, plus a guessed level count where they gave none */
  const withLevels = (tags0: Record<string, string>, ring: { x: number; z: number }[] | null, id?: number)
    : { tags: Record<string, string>; inferred: boolean } => {
    const fix = id === undefined ? undefined : HEIGHT_FIXES[id]
    const tags = fix === undefined ? tags0 : { ...tags0, height: String(fix) }
    // a part hung in the air by min_level/min_height is left to the tag layer: a guessed total would fight it
    if (!ring || tags['building:min_level'] !== undefined || tags.min_height !== undefined) {
      return { tags, inferred: false }
    }
    /*
     * The city's own count of storeys, where the mapper gave none and the record is a building's own: an office or
     * shop on one or two parcels. 559 Clay Street (nine storeys, 1908) and its neighbours by the Transamerica Pyramid
     * were guessed at three from the houses round about (owner, 2026-10-15: "heights and such are wrong"). Homes are
     * left to the guess — a condominium's storeys are its units' floors — and the record only ever RAISES the guess,
     * and only in the Financial District for now: city-wide it lowered 566 buildings, a shop condominium on the ground
     * floor being recorded as one storey, and raised a few on a stray parcel point.
     */
    /*
     * PARIS HAS A HEIGHT LIMIT (owner, 2026-10-31: "We also display some tall buildings that I'm fairly sure don't exist, so check for buildings over
     * the 37 meter height limit"). A mapper's storeys with no height went to the tag layer at 4 m each, so an ordinary ten-storey block of the
     * thirteenth stood at 40 m where APUR's survey measures 30: 1,200 of the 2,100 buildings over the limit were that. A Paris storey is about
     * 3.1 m. APUR's measure where it has one that makes sense of the storeys (it reads a tower on a podium by the podium, and 0.2 m under the BnF's
     * esplanade, so a tower keeps its storeys), else the storeys at their true height.
     */
    if (spec.region === 'paris' && !tags.height && tags['building:levels'] !== undefined) {
      const stated = Number(tags['building:levels'])
      if (stated > 0) {
        const byStoreys = 1 + stated * 3.1
        const rec = tags['building:part'] === undefined && recordOf ? recordOf(ring.map((q) => proj.toLatLon(q))) as { height?: number } | null : null
        const measured = rec?.height && rec.height >= 3 && rec.height >= byStoreys * 0.65 && rec.height <= byStoreys * 1.35 ? rec.height : undefined
        return { tags: { ...tags, height: (measured ?? byStoreys).toFixed(1) }, inferred: false }
      }
    }
    const c = centroid(ring)
    const lv = inferLevels(tags, ring, grid.near(c.x, c.z, reg.levelInference.radius), reg.defaultLevels,
      reg.levelInference)
    if (lv !== undefined && tags['building:part'] === undefined && recordOf) {
      const ll = ring.map((q) => proj.toLatLon(q))
      const rec = recordOf(ll) as (ReturnType<NonNullable<typeof recordOf>> & { height?: number }) | null
      /*
       * Paris: the building's MEASURED height (APUR's survey median, tools/paris-apur.ts) where the mapper gave none — OSM
       * has a height for few of Paris's buildings, and the guess was seven storeys everywhere (owner, 2026-10-30: OSM "is
       * often weird on buildings"). Storeys from it at about 3.1 m, the ground storey taller.
       */
      if (spec.region === 'paris' && rec?.height) {
        const levels = Math.max(1, Math.round((rec.height - 1) / 3.1))
        return { tags: { ...tags, height: rec.height.toFixed(1), 'building:levels': String(levels) }, inferred: true }
      }
      if (rec?.stories && rec.stories > lv && rec.stories <= 60 && rec.parcels <= 2 && rec.use && rec.use !== 'SRES' && rec.use !== 'MRES'
        && districtOf(ll[0].lat, ll[0].lon) === 'fidi') {
        return { tags: { ...tags, 'building:levels': String(rec.stories) }, inferred: true }
      }
    }
    return lv === undefined ? { tags, inferred: false } : { tags: { ...tags, 'building:levels': String(lv) }, inferred: true }
  }
  let inferredCount = 0

  // the tallest part of each owned building, in levels, which is what its style has to accommodate
  const tallest = new Map<number, number>()
  for (const [partId, owner] of ownerOf) {
    const part = parts.find((w) => w.id === partId)
    // only a part someone gave a height counts: the tag layer calls an untagged part one storey, and that
    // would pin its owner at one storey too while the part itself is inferred at six
    if (!part || !hasHeightTag(part.tags)) continue
    const pp = getBuildingParamsFromOSMTags(part.tags) as { buildingLevels?: number; buildingHeight?: number }
    const lv = pp.buildingLevels ?? (pp.buildingHeight ? Math.round(pp.buildingHeight / 3.5) : undefined)
    if (lv !== undefined) tallest.set(owner.id, Math.max(tallest.get(owner.id) ?? 0, lv))
  }
  const buildings: PackedBuilding[] = []
  const raisedOutlines = new Set<number>()
  /*
   * The footprint-form scan (src/city/ring-forms.ts, PLAN §Soon.0): which buildings the slot kit cannot
   * express, so the queue routes them to from-scratch modelling (LADDER §3c treatment 4+) instead of
   * flattening them into the kit. A stage of the classifier rather than a script somebody remembers to run:
   * it costs nothing per building and needs no photograph, which is what makes it affordable across the
   * hundreds the owner expects in future cities.
   *
   * Scored ONCE PER OUTLINE and cached. A building:part is dressed as its owner (see below) and must be
   * flagged as its owner too — an outline the bake replaces with its parts never becomes a PackedBuilding at
   * all, so a flag that lived only on outlines would miss exactly the towers that most need it.
   */
  const FORM = thresholds(spec.ringForms)
  const formOf = new Map<number, RingForm | null>()
  const formed: { id: number; name: string; h: number; f: RingForm }[] = []
  let formScanned = 0
  // named buildings worth a name plate on the street (item K), gathered as they are packed — plus the
  // outlines replaced by their parts, which carry the name the parts do not (Saint-Louis-en-l'Île)
  const named: { id: number; tags: Record<string, string>; ring: { x: number; z: number }[] }[] = []
  for (const w of outlines) {
    if (!superseded.has(w.id) || !w.tags.name || !worthNaming(w.tags) || !w.geometry) continue
    named.push({ id: w.id, tags: w.tags, ring: ccw(w.geometry.slice(0, -1).map((g) => proj.toLocal(g))) })
  }
  /*
   * A building ON a hospital, university or college campus that the neighbourhood mix dressed as a HOME — a
   * walk-up, a Victorian, an Edwardian flat — is dressed as the campus's instead: the institutional style and no
   * shopfronts (Mount Zion's ward blocks were sfapartment with bay stacks, 2026-10-04). Every other style stands:
   * the Academy of Art's old hotels and Golden Gate University's brick are what they look like. Only buildings
   * big enough to be a ward or a lab block — 400 m² and up — with no amenity of their own (a car park stays a
   * car park) and never one tagged as a home: the old houses a campus has swallowed stay houses. On SCHOOL grounds
   * the same, dressed `stucco` (below) rather than institutional: 103 school buildings were walk-ups (2026-10-04).
   */
  const campuses = campusWays.filter((c) => c.geometry && c.geometry.length >= 4 && /^(hospital|university|college|school)$/.test(c.tags?.amenity ?? '')).map((c) => {
    const r = c.geometry!.map((g) => proj.toLocal(g))
    const xs = r.map((q) => q.x), zs = r.map((q) => q.z)
    return { r, amenity: c.tags.amenity, x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }
  })
  const HOME = /^(house|residential|apartments|detached|semidetached_house|terrace|dormitory|garage|garages|shed)$/
  const HOME_STYLE = new Set<string>(['sfapartment', 'tenement', 'victorian', 'edwardian', 'aptclassical', 'aptbrick', 'aptmed', 'aptmodern', 'aptluxe'])
  let campusDressed = 0
  let bigNonHomes = 0
  const campusAmenity = (t: Record<string, string>, r: { x: number; z: number }[], style: string): Record<string, string> => {
    if (campuses.length === 0 || !HOME_STYLE.has(style) || t.amenity || HOME.test(t.building ?? '') || area(r) < 400) return t
    const c = centroid(r)
    for (const k of campuses) {
      if (c.x < k.x0 || c.x > k.x1 || c.z < k.z0 || c.z > k.z1) continue
      let inside = false
      for (let i = 0, j = k.r.length - 1; i < k.r.length; j = i++) {
        const a = k.r[i], b = k.r[j]
        if ((a.z > c.z) !== (b.z > c.z) && c.x < ((b.x - a.x) * (c.z - a.z)) / (b.z - a.z) + a.x) inside = !inside
      }
      if (inside) { campusDressed++; return { ...t, amenity: k.amenity } }
    }
    return t
  }
  for (const w of buildingWays) {
    if (!w.geometry || w.geometry.length < 4) continue
    const ring = w.geometry.slice(0, -1).map((g) => proj.toLocal(g))  // OSM closes the ring; we do not
    // (a landmark's own tiny outline stays: Ville-d'Avray's Fontaine du Roi is 4 x 3 m, and dropping it dropped its model)
    if (ring.length < 3 || (area(ring) < 12 && !shipModels.has(w.id))) continue
    const own = withLevels(w.tags, ring, w.id)
    if (own.inferred) inferredCount++
    const p = getBuildingParamsFromOSMTags(own.tags) as {
      buildingLevels?: number; buildingHeight?: number; buildingMinHeight?: number
      buildingFacadeMaterial?: string; buildingRoofType?: string; buildingRoofHeight?: number
      buildingRoofDirection?: number
    }
    const ccwRing = ccw(ring)
    /*
     * A part is dressed as its BUILDING, not as itself. Each part choosing its own style put a brick
     * lump on the side of a Haussmann block — an overhang, a bay, a stair tower, each one a different
     * building to the style picker. The owner's tags and the owner's seed decide, and the height that
     * decides feasibility is the tallest part's, so a glass tower and its podium stay one building.
     */
    const owner = ownerOf.get(w.id)
    /*
     * The owner's level count: the mapper's if they gave one, else the tallest part's (the parts ARE the
     * building's height), and only failing both a guess.
     */
    const ownerTags = !owner ? undefined
      : taggedLevels(owner.tags) !== undefined || owner.tags.height !== undefined ? owner.tags
      : tallest.has(owner.id) ? { ...owner.tags, 'building:levels': String(tallest.get(owner.id)) }
      : withLevels(owner.tags, ringOfWay(owner)).tags
    const ownerP = owner ? getBuildingParamsFromOSMTags(ownerTags!) as typeof p : undefined
    // a region that knows its own city says what the building is (src/city/building-types.ts): SF's Victorians,
    // lofts and towers from height, lot and district where OSM says only building=yes
    const ownerRing = owner ? ringOfWay(owner) ?? ring : ring
    const kind = classify?.(owner
      ? { record: recordOf?.(ownerRing.map((q) => proj.toLatLon(q))) ?? undefined, tags: owner.tags, ring: ownerRing, height: ownerP!.buildingHeight, levels: ownerP!.buildingLevels ?? tallest.get(owner.id),
          lat: w.geometry[0].lat, lon: w.geometry[0].lon, id: owner.id, area: area(ownerRing) }
      : { record: recordOf?.(w.geometry) ?? undefined, tags: w.tags, ring, height: p.buildingHeight, levels: p.buildingLevels, lat: w.geometry[0].lat, lon: w.geometry[0].lon, id: w.id, area: area(ring) }) ?? null
    const styleChosen = kind ? styleFor(owner?.tags ?? w.tags, () => kind.style) : owner
      ? styleFor(owner.tags, () => chooseStyle({ levels: ownerP!.buildingLevels ?? tallest.get(owner.id),
        height: ownerP!.buildingHeight, material: ownerP!.buildingFacadeMaterial ?? p.buildingFacadeMaterial,
        building: owner.tags.building }, spec.styles, owner.id))
      : styleFor(w.tags, () => chooseStyle(
        { levels: p.buildingLevels, height: p.buildingHeight, material: p.buildingFacadeMaterial,
          building: w.tags.building },
        spec.styles, w.id))
    const dressTags = campusAmenity(owner?.tags ?? w.tags, ownerRing, styleChosen)
    // (a school is not an `institution` — the city's schools are various — but a school dressed as a HOME is wrong
    //  everywhere: San Francisco's public schools are stucco and concrete, Spanish or Moderne, so stucco it is)
    /*
     * And a BIG building whose own tags say it is not a home — a store, an office, a phone exchange, a school building
     * off its grounds — that the mix dressed as one: Office Depot on Geary, Marin City's shopping centre, the AT&T
     * exchanges were 60-metre walk-ups with bay stacks (census of house-styled buildings over 1 500 m², 2026-10-04).
     * Shops and offices take the plain modern block; the institutions stucco without shopfronts.
     */
    const ownTags = owner?.tags ?? w.tags
    const bigNonHome = HOME_STYLE.has(styleChosen) && area(ownerRing) >= 1500
      ? /^(retail|commercial|supermarket|office|kiosk)$/.test(ownTags.building ?? '') || ownTags.shop ? 'shop'
        : /^(school|utility|civic|public|government|hospital|university|college|sports_centre|sports_hall)$/.test(ownTags.building ?? '') ? 'institution' : null
      : null
    const styleId = bigNonHome === 'shop' ? 'bauhaus' : bigNonHome === 'institution' ? 'stucco'
      : dressTags === ownTags ? styleChosen
      : dressTags.amenity === 'school' ? 'stucco' : styleFor(dressTags, () => styleChosen)
    if (bigNonHome) bigNonHomes++
    const formKey = owner?.id ?? w.id
    if (!formOf.has(formKey)) {
      const fh = (owner ? ownerP!.buildingHeight : p.buildingHeight) ?? 0
      if (fh >= FORM.minHeight) formScanned++
      const f = ringForm(ownerRing, fh, FORM)
      formOf.set(formKey, f)
      if (f) formed.push({ id: formKey, name: (owner?.tags ?? w.tags).name ?? '—', h: fh, f })
    }
    const form = formOf.get(formKey) ?? undefined
    /*
     * The audit row: which rule gave this building its look. Without it a systematically wrong style — every
     * residential tower drawn as a glass office block — can only be found by riding past one (user,
     * 2026-09-22). With it, `docs/<city>-archetypes.csv` groups the whole city by rule.
     */
    audit.push([owner?.id ?? w.id, w.geometry[0].lat.toFixed(6), w.geometry[0].lon.toFixed(6),
      Math.round((owner ? ownerP!.buildingHeight : p.buildingHeight) ?? 0), Math.round(area(ownerRing)),
      kind?.district ?? '', kind?.archetype ?? '', kind ? kind.rule : 'chooseStyle',
      styleId, styleId !== (kind?.style ?? styleId) ? 'overridden' : '',
      // and whether the slot kit can express this building's form at all (LADDER §3c): the column the queue
      // reads to route a building to from-scratch modelling. Appended, so the readers that index by
      // position (tools/sf-rules.ts, tools/review-page.ts) are untouched.
      form ? `${form.fired}:${form[form.fired]}` : ''].join(','))
    const raised = raiseTo.get(w.id)
    const tall = raised !== undefined && raised > (p.buildingHeight ?? 0)
    const capped = capTo.get(w.id)
    const low = capped !== undefined && capped < (p.buildingHeight ?? Infinity)
    /*
     * Mark the buildings whose storeys we GUESSED. Every building leaves the bake with a height, so nothing
     * downstream can otherwise tell a surveyed twelve metres from an invented one — and a refacing entry that
     * counted the floors in a photograph should be allowed to correct the invention while never touching the
     * survey (src/render/prepare.ts).
     */
    // (a whole building raised by its tags — not a part, a bridge or a canopy: grounded below if nothing holds it up)
    if (!w.tags['building:part'] && !/^(roof|carport|shelter|gazebo|bridge)$/.test(w.tags.building ?? '')
      && (w.tags['building:min_level'] !== undefined || w.tags.min_height !== undefined)) raisedOutlines.add(w.id)
    buildings.push({
      id: w.id,
      ring: packPoints(ccwRing),
      style: styleId,
      // a raised outline's own level count would fight its new height, so the height decides
      levels: tall || low ? undefined : p.buildingLevels,
      height: tall ? raised : low ? capped : p.buildingHeight,
      /*
       * A `building=roof` (or carport, shelter, gazebo) at the ground is a CANOPY — a petrol station's, a shelter's, a market roof — with no walls
       * under it (the raised ones are dropped above, `canopy`). Drawn from the ground it was a walled house: two of the
       * Palace of Fine Arts' stood beside the hall as a 21 m tenement (2026-10-05). So: a half-metre roof slab at the
       * top, nothing under it.
       */
      minHeight: /^(roof|carport|shelter|gazebo)$/.test(w.tags.building ?? '') && (p.buildingHeight ?? 0) > 1.5
        ? Math.max(p.buildingMinHeight ?? 0, (tall ? raised! : low ? capped! : p.buildingHeight!) - 0.5)
        : p.buildingMinHeight,
      ...withRoofMaterial(roofFor(w.tags, p, styleId, ccwRing, w.id), spec.region === 'paris' ? recordOf?.(w.geometry) as { roofMat?: string } | null : null),
      ...(own.inferred ? { levelsInferred: true as const } : {}),
      ...(kind ? { archetype: kind.archetype } : {}),
      ...(kind?.wall ? { wall: kind.wall } : {}),
      ...(form ? { form } : {}),
      ...(noShopsFor(dressTags) || bigNonHome === 'institution' ? { noShops: true } : {}),
      // a part of a building whose outline its parts replace: that outline's id (a church's towers and apse
      // are the church, for its quick dress: render/prepare.ts)
      ...(ownerOf.has(w.id) && superseded.has(ownerOf.get(w.id)!.id) ? { partOf: ownerOf.get(w.id)!.id }
        : relOwnerOf.has(w.id) && superseded.has(relOwnerOf.get(w.id)!) ? { partOf: relOwnerOf.get(w.id)! } : {}),
    })
    if (w.tags.name && worthNaming(w.tags)) named.push({ id: w.id, tags: w.tags, ring: ccwRing })
  }
  console.log(`  ${campusDressed} buildings dressed as their hospital / university / college / school campus`)
  console.log(`  ${bigNonHomes} big shops, offices and institutions no longer dressed as homes`)
  console.log(`  ${buildings.length} buildings`)
  reportRingForms(formScanned, formed, FORM)
  // (a region's own measure of a street, where OSM's lanes are wrong: before the fit, which only ever shrinks)
  if (streetRegion.streetWidths?.length) {
    const n = applyStreetWidths(kept, streetRegion.streetWidths.map((r) => ({ street: r.street, width: r.width,
      walk: r.walk ?? pavementForNA(r.width), from: proj.toLocal({ lat: r.from[0], lon: r.from[1] }), to: proj.toLocal({ lat: r.to[0], lon: r.to[1] }) })))
    console.log(`  street widths by hand: ${n.join(' / ')} edges`)
  }
  if (streetRegion.streetWidth === 'carriageway') fitStreetsBetweenBuildings(kept, buildings)
  if (streetRegion.roadPaint === 'paris') parisParkingLanes(kept, buildings)

  // ---- the green and the wet, and the paved squares (their own query: only as areas, never as streets)
  const squares = await overpassDetail(squaresQuery, spec).catch((e) => {
    console.warn(`  squares: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
    return { ways: [] as OsmWay[], relations: [] as typeof relations }
  })
  // the bare ground — sand and dirt — on its own query, so the street query's cache is untouched (#200)
  const bare = await overpassDetail(sandQuery, spec).catch((e) => {
    console.warn(`  sand: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
    return { ways: [] as OsmWay[], relations: [] as typeof relations }
  })
  // …and the water OSM does not map, drawn by hand (data/water/<city>.json: the Japanese Tea Garden's ponds, traced from
  // the garden's own map and checked against the lidar ground — owner, 2026-10-25)
  const handWaterFile = resolve(import.meta.dirname, '..', 'data', 'water', `${spec.id}.json`)
  const handWater: OsmWay[] = !existsSync(handWaterFile) ? [] : (JSON.parse(readFileSync(handWaterFile, 'utf8')) as { ponds: { name: string; ring: [number, number][] }[] }).ponds
    .map((p, k) => ({ type: 'way' as const, id: -1 - k, nodes: [], tags: { natural: 'water', water: 'pond', name: p.name },
      geometry: [...p.ring, p.ring[0]].map(([lat, lon]) => ({ lat, lon })) }))
  if (handWater.length) console.log(`  ${handWater.length} ponds drawn by hand (${handWaterFile})`)
  const areaWays = [...ways, ...squares.ways, ...bare.ways, ...handWater]
  const areaRels = [...relations, ...squares.relations.filter((r) => r.tags.building === undefined),
    ...bare.relations.filter((r) => r.tags.building === undefined)]
  const areas: PackedArea[] = []
  // and the water that runs underground: never drawn, but a "bridge" over it is at grade (tools/bridges.ts)
  const buried: { x: number; z: number }[][] = []
  for (const w of ways) {
    const t = w.tags
    if (!(t.natural === 'water' || t.waterway === 'riverbank') || !w.geometry || w.geometry.length < 4) continue
    if ((t.tunnel && t.tunnel !== 'no') || t.location === 'underground' || t.covered === 'yes' || Number(t.layer ?? 0) < 0) {
      buried.push(w.geometry.slice(0, -1).map((g) => proj.toLocal(g)))
    }
  }
  for (const w of areaWays) {
    // (a pitch the region says is gone — `courtSports` 'none' — leaves no patch of turf either)
    const kind = streetRegion.courtSports?.[String(w.id)] === 'none' ? null : areaKind(w)
    if (!kind || !w.geometry || w.geometry.length < 4) continue
    const ring = w.geometry.slice(0, -1).map((g) => proj.toLocal(g))
    if (area(ring) < 40) continue
    areas.push({ kind, ring: packPoints(ccw(ring)), ...(kind === 'lot' && w.tags.amenity === 'parking' && /^(surface)?$/.test(w.tags.parking ?? '') ? { parking: true as const } : {}), ...(kind === 'water' && isRiver(w.tags) ? { river: true as const } : {}) })
  }
  /*
   * ---- THE SPORTS-PITCH KIT (BUGS.md #214, src/city/sports.ts, src/render/sports.ts)
   *
   * 779 of the box's 1,421 sports areas are the same object — a flat rectangle with painted lines — so the
   * bake fits a correctly-proportioned court inside each eligible pitch and files it as a POINT. It has to
   * happen here, on the whole ring: `splitPackage` clips areas at every tile border, and a court straddling
   * one would be fitted twice to two half-polygons.
   *
   * The exclusion is #214a's measured threshold — unnamed, under 5,000 m², not a stadium — plus the name of
   * any `leisure=sports_centre`/`stadium` polygon that CONTAINS the pitch (Beach Chalet Soccer Fields is a
   * sports_centre with `courts=4` whose inner pitches are unnamed).
   *
   * **A known gap, deliberately not closed today:** `cityQuery` in tools/overpass.ts fetches
   * `leisure~^(park|garden|pitch|nature_reserve)$` and does NOT fetch `sports_centre` or `stadium`, so
   * `venues` below is empty in practice and the enclosure test cannot fire. Widening the query invalidates
   * every cached Overpass response and every osmium cut, which is not a thing to do while a four-hour bake
   * is running. The size threshold still catches the big venues on its own: no basketball, tennis,
   * pickleball or four-square polygon in the San Francisco cut exceeds 5,000 m², and the 21 soccer and 8
   * baseball areas that do are not drawn by the `court` part at all.
   */
  const venues = areaWays.filter((w) => (w.tags.leisure === 'sports_centre' || w.tags.leisure === 'stadium')
    && (w.tags.name ?? '') !== '' && w.geometry && w.geometry.length >= 4)
    .map((w) => ({ name: w.tags.name!, ring: w.geometry!.slice(0, -1).map((g) => proj.toLocal(g)) }))
  const sportsCourts: PackedCourt[] = []
  const courtsBySport = new Map<string, number>()
  let courtsExcluded = 0
  for (const w of areaWays) {
    if (w.tags.leisure !== 'pitch' || !w.geometry || w.geometry.length < 4) continue
    // (a region's own word on a pitch, by id, overrides OSM's sport AND the landmark exclusion: it was looked at)
    const told = streetRegion.courtSports?.[String(w.id)]
    const sport = courtSport(told ?? w.tags.sport, told !== undefined)
    if (!sport) continue
    const ring = w.geometry.slice(0, -1).map((g) => proj.toLocal(g))
    const m2 = ringArea(ring)
    const c = { x: ring.reduce((s, p) => s + p.x, 0) / ring.length, z: ring.reduce((s, p) => s + p.z, 0) / ring.length }
    const venue = venues.find((v) => pointInRing(v.ring, c.x, c.z))
    if (!told && !courtEligible(w.tags, m2, venue?.name)) { courtsExcluded++; continue }
    const bank = tileCourts(ring, sport)
    const one = bank ? null : fitCourt(ring, sport)
    if (!bank && !one) { courtsExcluded++; continue }
    const clay = w.tags.surface === 'clay' || CLAY_PITCHES.has(w.id)
    for (const fit of bank ?? [one!]) sportsCourts.push({
      sport: fit.sport, x: Math.round(fit.x * 100) / 100, z: Math.round(fit.z * 100) / 100,
      heading: Math.round(fit.heading * 10000) / 10000,
      len: Math.round(fit.len * 100) / 100, wid: Math.round(fit.wid * 100) / 100,
      ...(fit.half ? { half: true as const } : {}),
      ...(clay ? { clay: true as const } : {}),
    })
    courtsBySport.set(sport, (courtsBySport.get(sport) ?? 0) + (bank?.length ?? 1))
  }
  // …and the PLAYGROUNDS (owner, 2026-10-03): every leisure=playground, fitted as its own box and furnished at run time
  // from the playground kit (render/playground.ts) — it travels with the courts as sport `playground`
  let playgrounds = 0
  for (const w of areaWays) {
    if (w.tags.leisure !== 'playground' || !w.geometry || w.geometry.length < 4) continue
    const ring = w.geometry.slice(0, -1).map((g) => proj.toLocal(g))
    if (ringArea(ring) > 6000) continue
    const fit = fitCourt(ring, 'playground')
    if (!fit) continue
    sportsCourts.push({ sport: 'playground', x: Math.round(fit.x * 100) / 100, z: Math.round(fit.z * 100) / 100,
      heading: Math.round(fit.heading * 10000) / 10000, len: Math.round(fit.len * 100) / 100, wid: Math.round(fit.wid * 100) / 100 })
    playgrounds++
  }
  if (playgrounds) console.log(`  ${playgrounds} playgrounds furnished`)
  if (sportsCourts.length || courtsExcluded) {
    console.log(`  ${sportsCourts.length} sports courts (${[...courtsBySport].map(([s, n]) => `${s} ${n}`).join(', ')}), `
      + `${courtsExcluded} pitches excluded (named, over ${COURT_MAX_M2} m², a venue, or too small to fit a court)`)
  }
  // the ocean and the bay (BUGS.md #159): natural=coastline, stitched/clipped/closed against the box -- see
  // coastlineWater's own comment for how
  {
    const { areas: coastAreas, islandsSkipped } = coastlineWater(ways, wholeBox, proj)
    for (const a of coastAreas) areas.push({ kind: 'water', sea: true, ...a })
    if (coastAreas.length > 0 || islandsSkipped > 0) {
      console.log(`  ${coastAreas.length} coastline water area(s) from natural=coastline`
        + (islandsSkipped > 0 ? `, ${islandsSkipped} island(s) straddling the box left un-subtracted` : ''))
    }
    /*
     * BUGS.md #159/#161: a warning nobody reads is not a safety net. "1 chain skipped, the rest of the water
     * is built" read like a footnote the first time this shipped, and it was actually a total loss -- the
     * ocean and most of the bay, gone, with three tiny areas left standing in for them. If a city's own
     * `natural=coastline` data exists at all, the built sea has to actually reach toward the edges of the box
     * it was clipped to; a sea that covers only a sliver of the box is exactly the failure mode a skipped
     * chain produces, and it must fail loudly, not log a line that looks like routine bookkeeping.
     */
    if (coastAreas.length > 0) {
      const bx0 = proj.toLocal({ lat: proj.origin.lat, lon: wholeBox.west }).x
      const bx1 = proj.toLocal({ lat: proj.origin.lat, lon: wholeBox.east }).x
      const bz0 = proj.toLocal({ lat: wholeBox.south, lon: proj.origin.lon }).z
      const bz1 = proj.toLocal({ lat: wholeBox.north, lon: proj.origin.lon }).z
      let sx0 = Infinity, sx1 = -Infinity, sz0 = Infinity, sz1 = -Infinity
      for (const a of coastAreas) for (let i = 0; i < a.ring.length; i += 2) {
        sx0 = Math.min(sx0, a.ring[i]); sx1 = Math.max(sx1, a.ring[i])
        sz0 = Math.min(sz0, a.ring[i + 1]); sz1 = Math.max(sz1, a.ring[i + 1])
      }
      const tol = 500 // metres: how close the sea must come to the box edge to count as "reaching" it
      const reachesX = sx0 <= bx0 + tol && sx1 >= bx1 - tol
      const reachesZ = sz0 <= bz0 + tol && sz1 >= bz1 - tol
      if (!reachesX && !reachesZ) {
        console.error(`  !! FAILED BAKE: the coastline water does not reach across the box (box x `
          + `${bx0.toFixed(0)}..${bx1.toFixed(0)} z ${bz0.toFixed(0)}..${bz1.toFixed(0)}, sea x `
          + `${sx0.toFixed(0)}..${sx1.toFixed(0)} z ${sz0.toFixed(0)}..${sz1.toFixed(0)}) -- a skipped or `
          + 'mis-stitched coastline chain almost certainly left most of the ocean/bay unbuilt (BUGS.md #159). '
          + 'Do not trust this bake\'s water.')
      }
    }
  }
  // squares OSM draws only as lines, paved by hand from the region (the Trocadéro's parvis)
  for (const sq of streetRegion.pavedSquares ?? []) {
    const ring = sq.ring.map(([lat, lon]) => proj.toLocal({ lat, lon }))
    // (`lot`: a car park's asphalt, not a square's pale paving — the Wharf's lots, 2026-10-17)
    areas.push({ kind: sq.lot || sq.parking ? 'lot' : 'paved', ring: packPoints(ccw(ring)), top: true, ...(sq.parking ? { parking: true as const } : {}), ...(sq.brick ? { brick: true as const } : {}), ...(sq.surface ? { surface: sq.surface } : {}) })
  }
  // a waterfront street's wharf apron (region `wharfAprons`): a strip of paving on its bay side, segment by segment,
  // wherever water lies 40–55 m out on that side — under the parks and the water, which are painted over it
  {
    const waters = areas.filter((a) => a.kind === 'water').map((a) => unpackPoints(a.ring))
    const inside = (r: { x: number; z: number }[], x: number, z: number): boolean => {
      let c = false
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const a = r[i], b = r[j]
        if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) c = !c
      }
      return c
    }
    const wet = (x: number, z: number): boolean => waters.some((r) => inside(r, x, z))
    for (const ap of streetRegion.wharfAprons ?? []) {
      let n = 0
      for (const e of edges) {
        if (e.name !== ap.street || e.foot) continue
        const p = unpackPoints(e.points)
        for (let i = 1; i < p.length; i++) {
          const a = p[i - 1], b = p[i]
          const L = Math.hypot(b.x - a.x, b.z - a.z)
          if (L < 1) continue
          const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
          const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2
          const side = [1, -1].find((s) => wet(mx - uz * s * 40, mz + ux * s * 40) || wet(mx - uz * s * 55, mz + ux * s * 55))
          if (!side) continue
          const nx = -uz * side, nz = ux * side
          const k0 = e.width / 2 + e.walk - 0.5, k1 = Math.max(k0 + 5, ap.reach)
          // (each a little longer than its segment, so the strips overlap at the bends)
          const A = { x: a.x - ux * 1.5, z: a.z - uz * 1.5 }, B = { x: b.x + ux * 1.5, z: b.z + uz * 1.5 }
          const ring = [{ x: A.x + nx * k0, z: A.z + nz * k0 }, { x: B.x + nx * k0, z: B.z + nz * k0 },
            { x: B.x + nx * k1, z: B.z + nz * k1 }, { x: A.x + nx * k1, z: A.z + nz * k1 }]
          areas.push({ kind: 'paved', ring: packPoints(ccw(ring)) })
          n++
        }
      }
      console.error(`  wharf apron along ${ap.street}: ${n} segments`)
    }
  }
  // Multipolygon relations: the Seine is one, and so is every courtyard block. Skipping them is why the
  // water shader had no water and why the Loop came back with half the buildings it should have.
  let fromRelations = 0
  let hugeAreas = 0
  for (const rel of areaRels) {
    const kind = areaKind({ tags: rel.tags } as OsmWay)
    const isBuilding = rel.tags.building !== undefined
    if (!kind && !isBuilding) continue
    for (const ring of outerRings(rel)) {
      const pts = ring.slice(0, -1).map((g) => proj.toLocal(g))
      if (pts.length < 3 || area(pts) < 40) continue
      if (isBuilding && superseded.has(rel.id * 2 + 1)) {
        // its `building:part`s cover it (see the loop by `outlines` above): drop the crude box, exactly as
        // a superseded way outline is dropped, and leave the parts (already pushed, with `partOf` set) to
        // stand for it
        continue
      }
      if (isBuilding) {
        const own = withLevels(rel.tags, pts)
        if (own.inferred) inferredCount++
        const p = getBuildingParamsFromOSMTags(own.tags) as {
          buildingLevels?: number; buildingHeight?: number; buildingMinHeight?: number
          buildingFacadeMaterial?: string; buildingRoofType?: string; buildingRoofHeight?: number
          buildingRoofDirection?: number
        }
        const ccwPts = ccw(pts)
        // through the region's classifier like a way (a multipolygon skipped it and drew a style at random — the Fairmont,
        // schools and 10 000 m2 Wharf blocks came out Victorian, 2026-10-03), the random mix only where it declines
        const relKind = classify?.({ record: recordOf?.(pts.map((q) => proj.toLatLon(q))) ?? undefined, tags: rel.tags, ring: pts,
          height: p.buildingHeight, levels: p.buildingLevels, lat: proj.toLatLon(pts[0]).lat, lon: proj.toLatLon(pts[0]).lon,
          id: rel.id * 2 + 1, area: area(pts) }) ?? null
        const styleId = relKind ? styleFor(rel.tags, () => relKind.style) : styleFor(rel.tags, () => chooseStyle({ levels: p.buildingLevels, height: p.buildingHeight,
          material: p.buildingFacadeMaterial, building: rel.tags.building }, spec.styles, rel.id))
        // its courtyards: inner rings inside this outer ring, wound clockwise (see PackedBuilding.holes)
        const courts = innerRings(rel)
          .map((h) => h.slice(0, -1).map((g) => proj.toLocal(g)))
          .filter((h) => h.length >= 3 && area(h) >= 12 && pointInRing(pts, h[0].x, h[0].z))
          .map((h) => packPoints([...ccw(h)].reverse()))
        buildings.push({
          id: rel.id * 2 + 1,   // relation ids and way ids share a space here; keep them apart
          ring: packPoints(ccwPts),
          ...(courts.length > 0 ? { holes: courts } : {}),
          style: styleId,
          levels: p.buildingLevels, height: p.buildingHeight, minHeight: p.buildingMinHeight,
          ...roofFor(rel.tags, p, styleId, ccwPts, rel.id),
          ...(own.inferred ? { levelsInferred: true as const } : {}),
        })
        if (rel.tags.name && worthNaming(rel.tags)) named.push({ id: rel.id * 2 + 1, tags: rel.tags, ring: ccwPts })
      } else {
        /*
         * With its holes. Île Saint-Louis is an inner ring of the Seine, and without the inner rings the
         * island was river — the buildings on it stood in the water.
         */
        const holes = innerRings(rel)
          .map((h) => h.slice(0, -1).map((g) => proj.toLocal(g)))
          .filter((h) => h.length >= 3 && pointInRing(pts, h[0].x, h[0].z))
          .map((h) => packPoints(h))
        // A "park" tens of kilometres across is a reserve's boundary, not a park: growing SF's box south in
        // 2026-10 brought in nature_reserve relations running 228 km down the coast, which hung the planting
        // (45 million candidate points on a 6 663-point ring) and would have greened the whole city.
        if (kind !== 'water' && tooBigForAnArea(pts)) { hugeAreas++; continue }
        areas.push({ kind: kind!, ring: packPoints(ccw(pts)), ...(kind === 'water' && isRiver(rel.tags) ? { river: true as const } : {}), ...(holes.length > 0 ? { holes } : {}), ...(kind === 'lot' && rel.tags.amenity === 'parking' && /^(surface)?$/.test(rel.tags.parking ?? '') ? { parking: true as const } : {}) })
      }
      fromRelations++
    }
  }
  if (fromRelations > 0) console.log(`  ${fromRelations} more from relations (multipolygons)`)
  if (hugeAreas > 0) console.log(`  ${hugeAreas} reserve-sized green relations dropped (over ${HUGE_AREA_SPAN / 1000} km across)`)
  /*
   * PARIS: THE BUILDINGS OSM DOES NOT HAVE, from APUR's footprints (owner, 2026-10-30: OSM "gets roads but is often weird
   * on buildings" — "try … APUR footprints and heights for Paris"; and earlier, "there is almost never a visible gap
   * between buildings"). Of APUR's 128,206 footprints 13,548 have no OSM building at their centre, 9,780 of them 6 m or
   * more: the holes in the street wall. Each is added where no OSM building overlaps it at all — not at its centre, nor
   * at any of its corners pulled a little inward, nor any OSM building's corner inside it — so a landmark's claimed
   * building (hidden at run time under its model) keeps its ground clear too. Style by its period, as the classifier
   * dresses OSM's; height APUR's measured median.
   */
  /*
   * A BUILDING ON THE WATER is a boat's deckhouse (owner, 2026-10-30, 48.860148 2.293350: "a classic French building ON
   * TOP of a barge"): a moored péniche's cabin mapped as `building:part`, height 5.5, and nothing to say it floats, was
   * dressed as the city's stone. One whose centre is in the water (not on an island in it) and no taller than a deckhouse
   * wears the plain modern style, flat-roofed.
   */
  {
    const water = areas.filter((a) => a.kind === 'water').map((a) => ({ ring: unpackPoints(a.ring), holes: (a.holes ?? []).map((h) => unpackPoints(h)) }))
    let afloat = 0
    for (const b of buildings) {
      if ((b.height ?? 99) > 10) continue
      const c = centroid(unpackPoints(b.ring))
      if (!water.some((w) => pointInRing(w.ring, c.x, c.z) && !w.holes.some((h) => pointInRing(h, c.x, c.z)))) continue
      b.style = 'bauhaus'
      b.roof = 'flat'
      b.roofHeight = 0
      afloat++
    }
    if (afloat) console.log(`  ${afloat} buildings on the water dressed as boats' deckhouses`)
    /*
     * …and a TINY building is a cube, a kiosk, a vent or a shed, not a town house (owner, 2026-10-30, the Institut du monde
     * arabe's parvis, 48.849176 2.356543: "little default buildings which are in fact plaza elements" — four 14–17 m²
     * `building=yes historic=yes` cubes drawn with mansards, chimneys and shopfronts). Under 30 m² of footprint and no
     * landmark's: the plain style, flat, no shops.
     */
    let tiny = 0
    for (const b of buildings) {
      if (b.style === 'bauhaus' && b.roof === 'flat') continue
      const r = unpackPoints(b.ring)
      if (area(r) >= 30 || (b.height ?? 0) > 8) continue
      b.style = 'bauhaus'
      b.roof = 'flat'
      b.roofHeight = 0
      b.noShops = true
      tiny++
    }
    if (tiny) console.log(`  ${tiny} tiny buildings (under 30 m²) drawn as plain boxes: cubes, kiosks, sheds`)
  }
  if (spec.region === 'paris') {
    const rings = await import('./paris-apur.ts').then((m) => m.fetchApurRings()).catch((e: unknown) => { console.warn(`  apur rings: not fetched (${String(e).slice(0, 120)})`); return [] })
    const apurIn = detailTest(spec)
    const CELL = 40
    const cellsOf = new Map<string, { x: number; z: number }[][]>()
    const file = (r: { x: number; z: number }[]): void => {
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const q of r) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
      for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++) for (let gz = Math.floor(z0 / CELL); gz <= Math.floor(z1 / CELL); gz++) {
        const k = `${gx},${gz}`
        const l = cellsOf.get(k)
        if (l) l.push(r)
        else cellsOf.set(k, [r])
      }
    }
    for (const b of buildings) file(unpackPoints(b.ring))
    // …and the landmarks' ground: every way a manifest claims, whatever the bake made of it, and every entry placed by
    // point (a Villette folie came back as a generic block under its model, its own OSM way not among the buildings)
    const claimed = landmarkClaims(spec.region ?? spec.id)
    for (const w of ways) if (claimed.has(w.id) && w.geometry && w.geometry.length >= 4) file(w.geometry.slice(0, -1).map((g) => proj.toLocal(g)))
    const spots = landmarkSpots(spec.region ?? spec.id).map((s) => ({ ...proj.toLocal({ lat: s.lat, lon: s.lon }), r: s.r }))
    const near = (x: number, z: number): { x: number; z: number }[][] => cellsOf.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`) ?? []
    const covered = (x: number, z: number): boolean => near(x, z).some((r) => pointInRing(r, x, z))
    let added = 0
    rings.forEach(([period, h, facility, flat], i) => {
      if (!(h >= 3)) return
      const pts: { x: number; z: number }[] = []
      for (let k = 0; k < flat.length; k += 2) pts.push(proj.toLocal({ lon: flat[k], lat: flat[k + 1] }))
      if (pts.length < 3 || area(pts) < 15) return
      const c = centroid(pts)
      // (only where the city is modelled: APUR covers all of Paris, and a city whose detail is elsewhere — the Versailles
      //  test area — took 106,000 of them. Paris's detail box holds the whole survey, so there it drops nothing)
      { const g = proj.toLatLon(c); if (!apurIn(g.lat, g.lon)) return }
      if (covered(c.x, c.z)) return
      if (spots.some((s) => Math.hypot(s.x - c.x, s.z - c.z) < s.r + 4)) return
      if (pts.some((q) => covered(q.x + (c.x - q.x) * 0.15, q.z + (c.z - q.z) * 0.15))) return
      const others = new Set<{ x: number; z: number }[]>()
      for (const q of pts) for (const r of near(q.x, q.z)) others.add(r)
      for (const r of near(c.x, c.z)) others.add(r)
      for (const r of others) {
        const rc = centroid(r)
        if (r.some((q) => pointInRing(pts, q.x + (rc.x - q.x) * 0.15, q.z + (rc.z - q.z) * 0.15)) || pointInRing(pts, rc.x, rc.z)) return
      }
      const id = 2e12 + i * 2
      const levels = Math.max(1, Math.round((h - 1) / 3.1))
      // (as the classifier has it: city/paris/btype.ts, by age and arrondissement)
      const at = proj.toLatLon(centroid(pts))
      const style: StyleId = classifyParis({ tags: {}, ring: pts, height: h, levels, lat: at.lat, lon: at.lon, id: id % 2147483647, area: Math.abs(area(pts)),
        record: { construction: String(period), units: 0, parcels: 1, ...(facility ? { use: 'facility' } : {}) } })?.style ?? 'haussmann'
      const ring = ccw(pts)
      buildings.push({ id, ring: packPoints(ring), style, levels, height: h, ...roofFor({}, {}, style, ring, id) })
      file(ring)
      added++
    })
    console.log(`  APUR: ${added} buildings OSM does not have, added from their footprints (of ${rings.length})`)
  }
  /*
   * OSM's `height` is to the top of the roof, and the city's walls go up to `height` with the roof on top of that. On most roofs the difference is
   * a storey, but a tower with a tall slope (the Tours Société Générale: 167 m, roof:height=30) stood at 197 m (owner, 2026-10-30: "the roofs are
   * tilted into the sky"). Paris's: its walls stop at the eaves.
   */
  if (spec.region === 'paris') for (const b of buildings) if (b.roof === 'skillion' && b.roofHeight >= 6 && (b.height ?? 0) - b.roofHeight > 3) b.height = Math.round((b.height! - b.roofHeight) * 100) / 100
  reportLevels(buildings, inferredCount)

  /*
   * The EARLIEST point at which "does every landmark entry name a building that will exist?" can be asked:
   * supersession has been decided and the relations are in, so the set of building ids is final. Everything
   * after this — terrain, tiles, textures, trees — is the expensive part, and this is the check that caught
   * the sixty-nine of BUGS.md #100 and the thirty-six restyles of #102.
   *
   * Handed over as a FILE of ids rather than by re-reading the tiles: the audit's own tile scan is 2.3 s
   * unloaded but was measured at 190 s against a disk a bake was thrashing, and the early gate must be cheap.
   */
  {
    const ids = buildings.map((b) => b.id)
    const partOf = [...new Set(buildings.map((b) => b.partOf).filter((x): x is number => x !== undefined))]
    const f = resolve(tmpdir(), `bake-ids-${spec.id}.json`)
    await writeFile(f, JSON.stringify({ ids, partOf }))
    auditStage('2', spec, [`--ids=${f}`])
  }

  /*
   * And the streets that run under a building without saying so: OSM draws a porte cochère or an arcade
   * through a block and often leaves off tunnel=building_passage (Passage Saint-Paul). A way at grade with 6 m
   * or more of its length inside a ground-standing building is a passage too — drawn as an arch, not as a
   * street through a wall.
   */
  {
    const CELL = 50
    const grid = new Map<string, { ring: { x: number; z: number }[]; x0: number; x1: number; z0: number; z1: number }[]>()
    for (const b of buildings) {
      if ((b.minHeight ?? 0) > 2) continue
      const ring = unpackPoints(b.ring)
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
      const item = { ring, x0, x1, z0, z1 }
      for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++) {
        for (let gz = Math.floor(z0 / CELL); gz <= Math.floor(z1 / CELL); gz++) {
          const k = `${gx},${gz}`
          ;(grid.get(k) ?? grid.set(k, []).get(k)!).push(item)
        }
      }
    }
    let found = 0
    for (const e of kept) {
      if (e.passage || e.tunnel || e.bridge || (e.layer ?? 0) !== 0) continue
      const pts = unpackPoints(e.points)
      let run = 0
      let worst = 0
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i]
        const len = Math.hypot(b.x - a.x, b.z - a.z)
        for (let t = 0; t < len; t += 1) {
          const x = a.x + ((b.x - a.x) * t) / len
          const z = a.z + ((b.z - a.z) * t) / len
          const hit = (grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`) ?? [])
            .some((q) => x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1 && pointInRing(q.ring, x, z))
          run = hit ? run + 1 : 0
          worst = Math.max(worst, run)
        }
      }
      if (worst >= 6) { e.passage = true; found++ }
    }
    console.log(`  ${found} untagged passages under buildings found`)
  }

  // ---- the railways trains run on
  const rails: PackedRail[] = []
  const sunkRails: PackedRail[] = []
  // (the tracks in tunnels, not drawn: a street that dips over one near its mouth is on a deck the bare earth has not got: rail-levels.ts `spanOverRailways`)
  const buriedRails: { points: number[] }[] = []
  for (const w of railways) {
    if (!w.geometry || w.geometry.length < 2) continue
    // A tunnel is a railway you cannot see, and a train on one drives straight through the buildings above
    // it. OSM tags Paris full of these; `layer` below zero catches the rest.
    // (Paris: which of those are really under something is `railFate`'s and the ground's: tools/rail-levels.ts)
    if (spec.region === 'paris') {
      const got = parisRailRecord(w.tags, w.id, packPoints(w.geometry.map((g) => proj.toLocal(g))))
      if (got.rail) (got.fate === 'sunk' ? sunkRails : rails).push(got.rail)
      else if (got.buried) buriedRails.push({ points: packPoints(w.geometry.map((g) => proj.toLocal(g))) })
      continue
    }
    if ((w.tags.tunnel && w.tags.tunnel !== 'no') || w.tags.covered === 'yes' || parseInt(w.tags.layer ?? '0', 10) < 0) {
      if (w.tags.railway === 'rail') buriedRails.push({ points: packPoints(w.geometry.map((g) => proj.toLocal(g))) })
      continue
    }
    /*
     * …and a railway OSM puts below the street some other way: `level` below zero, or `cutting=yes`, with no layer to
     * say otherwise. The RER C along the Quai André-Citroën is mapped so (level=-1, cutting=yes, no layer), and drawn at
     * the surface it ran at grade across the port roads — when, as the owner says (2026-10-30), "Paris has essentially
     * no at-grade rail crossings, so when one appears … it is because the levels are coded incorrectly in OSM".
     * Set aside until the ground is known: where the ground really has the cutting, the track lies in it (below).
     */
    const sunk = !(parseInt(w.tags.layer ?? '', 10) >= 0) && (parseFloat(w.tags.level ?? '') < 0 || w.tags.cutting === 'yes')
    const pts = w.geometry.map((g) => proj.toLocal(g))
    let len = 0
    for (let k = 1; k < w.geometry.length; k++) len += haversine(w.geometry[k - 1], w.geometry[k])
    if (len < 30) continue
    const r = w.tags.railway
    const layer = parseInt(w.tags.layer ?? '', 10)
    ;(sunk ? sunkRails : rails).push({
      id: w.id, points: packPoints(pts),
      kind: r === 'tram' || r === 'light_rail' ? 'tram' : r === 'subway' ? 'subway' : 'rail',
      ...(r === 'tram' && w.tags.electrified === 'no' ? { cable: true as const } : {}),
      ...(r === 'light_rail' ? { light: true as const } : {}),
      // (the Montmartre funicular: one cabin a track shuttling up and down the butte, boarded like a cable car — its
      //  heights are the ground's, laid below once the ground is sampled)
      ...(r === 'funicular' ? { funicular: true as const } : {}),
      ...(w.tags.bridge && w.tags.bridge !== 'no' ? { bridge: true } : {}),
      ...(Number.isFinite(layer) && layer !== 0 ? { layer } : {}),
    })
  }
  console.log(`  ${rails.length} railways`)

  /*
   * ---- the ground
   *
   * Sampled once, offline, and normalised so the city's own start point is zero. Streets get a height per
   * point of their polyline, which is what the ride model differentiates for the grade; the rest of the
   * world gets a grid, which is what the renderer drapes everything else over.
   */
  // the whole grid, which reaches a box's largest half-width beyond it (below)
  const box = bbox(spec, Math.min(COARSE_PAD_MAX, Math.max(...Object.values(extentOf(spec)))))
  /*
   * TWO grids, from TWO zooms, and the pairing is the whole of BUGS.md #206.
   *
   * **The coarse grid**, zoom 12 at `STEP` 20 m, over the whole footprint — out past the box to the
   * skyline objects twenty kilometres away. It goes in the index. It is what answers for everywhere the
   * rider is not, and it is what `distantGround` and `groundOccluder` walk cell by cell at load; making it
   * finer would multiply their quad counts by 25 and undo the load-time fix of #179.
   *
   * **The fine grid**, zoom 15 at `FINE_STEP` 4 m, over the rideable box and a ring's margin — cut up into
   * the tiles, so the client only ever holds the ~225 of them round the rider (#206c: 19 KB a tile, 4.3 MB
   * resident, against 511 MB if this went in the index, which no browser would parse).
   *
   * Both numbers or neither (#206). `terrarium.ts`'s header used to claim zoom 12 is native and more zoom
   * "only interpolates" — true for SRTM, WRONG over the United States, where the model is USGS 3DEP at 1/3
   * arc-second, lidar-derived. Measured on a transect across Golden Gate Park, roughness triples from zoom
   * 12 to 15 while total relief is unchanged, which is the signature of real detail arriving.
   *
   * And zoom 15 is the FLOOR: zoom 16 is a 404 on this pyramid, so 3.78 m per pixel here is the finest the
   * source has and a grid finer than 4 m would store interpolation, not data (#206e). 3DEP's 1 m lidar over
   * San Francisco exists but is not in these tiles; `TileTerrain.step` is per tile so it can be taken where
   * it exists later without re-architecting (#206f).
   */
  const COARSE_ZOOM = 12
  const FINE_ZOOM = 15
  const elevation = new Elevation(COARSE_ZOOM)
  elevation.require({ minLat: box.south, maxLat: box.north, minLon: box.west, maxLon: box.east })
  // and the ground under each far landmark on the skyline, kilometres outside the box
  for (const s of spec.skyline ?? []) {
    elevation.require({ minLat: s.lat - 0.001, maxLat: s.lat + 0.001, minLon: s.lon - 0.001, maxLon: s.lon + 0.001 })
  }
  /*
   * The fine grid reaches a ring's width beyond the rideable box, not the whole footprint: the rider cannot
   * leave the box, and tiles stream 1.5 km round them. Everything further away is the coarse grid's job.
   */
  const FINE_MARGIN = 1500
  const fineBox = bbox(spec, FINE_MARGIN)
  const fineElev = new Elevation(FINE_ZOOM)
  fineElev.require({ minLat: fineBox.south, maxLat: fineBox.north, minLon: fineBox.west, maxLon: fineBox.east })
  await elevation.load()
  await fineElev.load()

  const STEP = 20
  const FINE_STEP = 4
  // the quays' detail ground (below, by the GroundModel): its post spacing — 4, the fine grid's own (1 m shipped 367 tiles at 16x the posts for the same profile, 2026-11-06); (0 = off), how far from the water a quay street counts, the survey fetch
  const QD_STEP = Number(process.env.QD_STEP ?? 4), QD_REACH = 60, QD_PX = 1024, QD_DECK_PAD = 1.5,
    QD_BOAT_PAD = 1, QD_WATER_EPS = 0.4, QD_UNDER = 0.6, QD_RIVER_AREA = 8000, QD_HOUSE_PAD = 1,
    QD_BAND = 45, QD_FADE = 10
  // QD_MODE=fake: no 1 m survey; an artificial lower quay along OSM's lower roads, a wall elsewhere (owner, 2026-11-06)
  // the quay walls (render/quays.ts): the shelf runs LQ_UNDER_WALL under the wall's cap; a wall where the high side stands QW_MIN_DROP
// over the low, its top read QW_TOP_AT out, its cap reaching (at most QW_CAP_MAX) to where the ground is within QW_CAP_EPS of the top
  const LQ_UNDER_WALL = 4, QW_MIN_DROP = 1.2, QW_TOP_AT = 9, QW_CAP_MAX = 6, QW_CAP_EPS = 0.25, QW_PIECE = 4, QW_SEEK = 40, QW_DUP = 2, QW_SPILL_MAX = 5, QW_SPILL_EPS = 0.1, QW_SMOOTH = 3, QW_TOP_FIND = 25
  /** a wall whose ground QW_NEAR_AT behind it is this far under the street beyond tops out at that ground (a shelf's river edge) */
  const QW_NEAR_AT = 3, QW_STREET_GAP = 2
  const QD_FAKE = process.env.QD_MODE !== 'lidar', LQ_H = 2.1, LQ_MARGIN = 3, LQ_FIND = 40, LQ_RAMP = 0.08, LQ_LOW_MAX = 4.5, LQ_DROP = 2.5, LQ_DROP_R = 25, LQ_UPPER_R = 60
  const LQ_NEAR = 30
  /*
   * Sampled well beyond the city itself. The grid is what the distant ground is built from, and anything
   * outside it has no ground under it — on Nob Hill that left the trees on the far crest standing in open
   * sky. Twice the radius costs a few thousand more samples and gives the city a horizon.
   */
  // (a box that is not square: its own extent each side, padded by its largest half-width)
  const ext = extentOf(spec)
  const tpad = Math.min(COARSE_PAD_MAX, Math.max(ext.west, ext.east, ext.south, ext.north))
  const tx0 = Math.floor((-ext.west - tpad) / STEP) * STEP
  const tz0 = Math.floor((-ext.south - tpad) / STEP) * STEP
  const cols = Math.ceil((ext.east + tpad - tx0) / STEP) + 1
  const rows = Math.ceil((ext.north + tpad - tz0) / STEP) + 1
  const heights: number[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = tx0 + c * STEP
      const z = tz0 + r * STEP
      heights.push(elevation.at(proj.toLatLon({ x, z })))
    }
  }
  /*
   * The fine grid, snapped so its posts fall on the TILE lattice: `city/tiles.ts` cuts a block per tile
   * whose samples are `tx * TILE + c * FINE_STEP`, so the origin must be a whole number of tiles and
   * `FINE_STEP` must divide `TILE`, or the block would be resampled and the tiles would no longer share
   * their edge posts exactly — which is what keeps the ground from cracking along every border.
   */
  /*
   * …and CLAMPED INSIDE the coarse grid, which is not the formality it looks like. The coarse grid reaches
   * the box's own largest half-width beyond it, so in San Francisco (9.8 km) it dwarfs box + 1.5 km — but in
   * a small city (Brooklyn Heights: a 700 m radius, so a 700 m pad) the fine box is the LARGER of the two.
   * Where the fine grid poked out, every check against the coarse grid below was comparing against its
   * clamped edge value: the NODATA guard replaced thousands of perfectly good samples with one repeated
   * number, and the agreement check would have compared a real surface with a constant.
   */
  const cx1 = tx0 + (cols - 1) * STEP
  const cz1 = tz0 + (rows - 1) * STEP
  const fx0 = Math.max(Math.ceil(tx0 / TILE) * TILE, Math.floor((-ext.west - FINE_MARGIN) / TILE) * TILE)
  const fz0 = Math.max(Math.ceil(tz0 / TILE) * TILE, Math.floor((-ext.south - FINE_MARGIN) / TILE) * TILE)
  const fx1 = Math.min(cx1, ext.east + FINE_MARGIN)
  const fz1 = Math.min(cz1, ext.north + FINE_MARGIN)
  const fcols = Math.floor((fx1 - fx0) / FINE_STEP) + 1
  const frows = Math.floor((fz1 - fz0) / FINE_STEP) + 1
  // typed, not `number[]`: 14 million JS numbers is 115 MB per array and `bareEarth` makes several
  const fine = new Float64Array(fcols * frows)
  for (let r = 0; r < frows; r++) {
    for (let c = 0; c < fcols; c++) {
      fine[r * fcols + c] = fineElev.at(proj.toLatLon({ x: fx0 + c * FINE_STEP, z: fz0 + r * FINE_STEP }))
    }
  }
  /*
   * ---- NODATA, which zoom 12 hid and zoom 15 does not.
   *
   * The terrarium pyramid has holes, and the coarser levels average them away. Measured over a 4.4 km box
   * on Brooklyn Heights, 4 449 of 1.2 M zoom-15 samples differ from zoom 12 by more than 100 m and the
   * minimum reads **-22 626 m** — a NODATA pixel, not bathymetry. One of those is not a cosmetic problem:
   * `bareEarth` is an OPENING, which removes peaks and PRESERVES pits, so a single bad pixel survives as a
   * 20 m crater in the ground with a street running into it.
   *
   * The coarse grid is the trusted large-scale surface, so a fine sample that disagrees with it by more
   * than `NODATA_GAP` is replaced by it. The threshold is taken from measurement, not taste: over San
   * Francisco (9.0 M samples) the largest GENUINE disagreement between the two zooms is 9.7 m and the
   * 99.9th percentile is 6.3 m, so 30 m is three times the worst real difference and still catches every
   * Brooklyn hole. This fires zero times in San Francisco — it is here so that New York, which #176 names
   * as where this is all going, does not bake a cratered city in silence.
   */
  const inFineGrid = (x: number, z: number): boolean =>
    x >= fx0 && z >= fz0 && x <= fx0 + (fcols - 1) * FINE_STEP && z <= fz0 + (frows - 1) * FINE_STEP
  const NODATA_GAP = 30
  {
    let fixed = 0
    for (let r = 0; r < frows; r++) {
      for (let c = 0; c < fcols; c++) {
        const i = r * fcols + c
        const ref = sampleGrid(heights, cols, rows, tx0, tz0, STEP, fx0 + c * FINE_STEP, fz0 + r * FINE_STEP)
        if (Math.abs(fine[i] - ref) > NODATA_GAP) { fine[i] = ref; fixed++ }
      }
    }
    if (fixed > 0) {
      console.log(`  WARNING: ${fixed} of ${fcols * frows} fine samples (${(100 * fixed / (fcols * frows)).toFixed(2)}%) disagreed with zoom ${COARSE_ZOOM} by over ${NODATA_GAP} m and were replaced by it — NODATA in the zoom ${FINE_ZOOM} tiles`)
    }
  }
  console.log(`  fine ground sampled: ${fcols}x${frows} at ${FINE_STEP} m from zoom ${FINE_ZOOM} (${(fcols * frows / 1e6).toFixed(1)} M samples)`)
  /*
   * PARIS'S LIDAR (owner, 2026-10-30: the Seine banks "way too wavy", "the ways are out of sync with the ground many times";
   * tools/ign-lidar.ts). The terrarium is SRTM-class over France and smears every quay wall into a slope; IGN's LiDAR HD
   * MNT is bare earth at 0.5–1 m. Where it has a value it replaces the fine sample, and the coarse posts inside it too, so
   * the far ground and the near agree; elsewhere (beyond the survey, a withheld zone) the terrarium stands.
   */
  let lidarPosts: Uint8Array | null = null
  // the structure mask (below, in the lidar's branch), kept for the street levelling
  let structMask: Uint8Array | null = null
  if (spec.region === 'paris') {
    const lidar = await (await import('./ign-lidar.ts')).ignLidar(fineBox)
    lidarPosts = new Uint8Array(fine.length)
    let taken = 0
    const diffs: number[] = []
    for (let r = 0; r < frows; r++) {
      for (let c = 0; c < fcols; c++) {
        const ll = proj.toLatLon({ x: fx0 + c * FINE_STEP, z: fz0 + r * FINE_STEP })
        const v = lidar.at(ll.lat, ll.lon)
        if (v === null) continue
        const i = r * fcols + c
        if ((r * 7 + c) % 97 === 0) diffs.push(v - fine[i])
        fine[i] = v
        lidarPosts[i] = 1
        taken++
      }
    }
    let coarse = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ll = proj.toLatLon({ x: tx0 + c * STEP, z: tz0 + r * STEP })
        const v = lidar.at(ll.lat, ll.lon)
        if (v !== null) { heights[r * cols + c] = v; coarse++ }
      }
    }
    diffs.sort((a, b) => a - b)
    console.log(`  IGN LiDAR HD: ${lidar.tiles} tiles; ${taken} of ${fcols * frows} fine samples and ${coarse} coarse posts from the lidar `
      + `(lidar − terrarium: median ${diffs[diffs.length >> 1]?.toFixed(2)} m, 5–95% ${diffs[Math.floor(diffs.length * 0.05)]?.toFixed(1)}…${diffs[Math.floor(diffs.length * 0.95)]?.toFixed(1)} m)`)
  }
  // everything is relative to where the rider starts, so the numbers stay small and the HUD reads sensibly
  /**
   * Bare earth, not rooftops.
   *
   * The terrain tiles are a SURFACE model: in a dense city a 30 m pixel over a block of six-storey
   * buildings reads several metres higher than the pixel over the street beside it. The Marais, which is
   * flat, came out with ±12 m of jitter at block scale. The rider follows the streets (the low pixels) and
   * the ground between them followed the grid (the high ones), so in places the grass in a courtyard stood
   * five metres above the rider's eye — and the camera, looking up at the underside of it, saw a green
   * ceiling where the sky should be. No sun, no clouds, the whole scene dark.
   *
   * An OPENING removes it: the minimum over ~60 m takes every block down to the level of the streets around
   * it, the maximum over the same distance puts real slopes back where it had eroded them, and a blur takes
   * off the steps. Anything the size of a building goes; anything the size of a hill — Nob Hill is half a
   * kilometre across — survives.
   */
  /*
   * …over LAND. Water samples are left out of the minimum: the river, a basin or a lock is metres below its
   * quays, and the 60 m minimum dragged every street along the water down to it — so the bake ramped the
   * streets round the Pont Morland up 3–4 m to their own bridge, over a place painted at the foot of the ramps
   * (BUGS.md #31). The water keeps its own level (its lowest bank less the region's drop).
   */
  const wetRings = areas.filter((a) => a.kind === 'water').map((a) => ({ ring: a.ring, holes: a.holes ?? [] }))
  const inRing = (r: number[], x: number, z: number): boolean => {
    let o = false
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
    }
    return o
  }
  const wetMask: boolean[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = tx0 + c * STEP
      const z = tz0 + r * STEP
      wetMask.push(wetRings.some((w) => inRing(w.ring, x, z) && !w.holes.some((h) => inRing(h, x, z))))
    }
  }
  /*
   * The same mask on the fine grid, through the INDEX rather than a linear scan. The loop above is 2.6 M
   * samples against 49 rings; the fine grid is 14 M, and San Francisco's bay ring is ~2 600 points whose
   * bounding box covers the whole city, so nothing rejects it — that is BUGS.md #179's ten-billion-edge-test
   * disaster, relocated from the browser into the bake. `waterLookup` is the exact index that fixed it
   * there (verified: 4 005 327 probes, zero differing answers, 81x faster), so it is reused here rather
   * than written again.
   */
  const wetIndex = waterLookup(wetRings.map((w) => {
    const ring = unpackPoints(w.ring)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    return { ring, holes: w.holes.map(unpackPoints), x0, x1, z0, z1, level: 0 }
  }))
  const fineWet = new Uint8Array(fine.length)
  for (let r = 0; r < frows; r++) {
    for (let c = 0; c < fcols; c++) {
      fineWet[r * fcols + c] = wetIndex(fx0 + c * FINE_STEP, fz0 + r * FINE_STEP) === null ? 0 : 1
    }
  }
  const ground = bareEarth(heights, cols, rows, 3, wetMask)
  /*
   * The opening is a PHYSICAL 60 m, not three cells: it exists to take a block of buildings down to the
   * level of the streets round it (a surface model reads rooftops), and a building is the size it is
   * whatever the grid step. At `FINE_STEP` 4 that is a radius of 15, not 3 — and getting this wrong would
   * have been silent, since a 12 m opening still looks like an opening.
   *
   * MEASURED cost of keeping it (Golden Gate Park transect, high-pass relief below 120 m, all at 4 m
   * spacing): raw zoom-15 detail is 1.182 m; the 60 m opening leaves 0.808 m; a 24 m opening would leave
   * 0.974 m and none at all 1.116 m. Today's pipeline leaves 0.572 m, so this is still a 1.41x gain, but
   * the opening is eating about a third of what zoom 15 buys. Shrinking it is NOT free — a 24 m kernel
   * cannot take the top off a 40 m city block, which is the green-ceiling bug this was written for — so it
   * stays at 60 m until it can be made conditional on there being buildings there at all.
   */
  const fineGround = bareEarthF(fine, fcols, frows, Math.round(60 / FINE_STEP), fineWet)
  /*
   * …except where a zone asks for the RAW relief (`relief: 'raw'`): the 60 m opening is for city blocks, and on a
   * narrow steep island it takes the summit off — Alcatraz, 150 m across, came out 11 m high where the data says
   * 41 (BUGS.md #257, measured 2026-10-02). There the elevation is bare ground already.
   */
  {
    const rawZones = loadZones(spec, (lat, lon) => proj.toLocal({ lat, lon })).filter((zn) => zn.props.relief === 'raw')
    // (the raw relief BLURRED as the opened ground is — a zero-radius opening is the blur alone: the tile's 4 m posts
    //  unsmoothed read as corrugation along a trail; 2026-10-04, Strawberry Hill)
    const rawGround = rawZones.length ? bareEarthF(fine, fcols, frows, 0, fineWet) : fine
    let n = 0
    for (const zn of rawZones) {
      const [x0, z0, x1, z1] = zn.bbox
      for (let r = Math.max(0, Math.floor((z0 - fz0) / FINE_STEP)); r < Math.min(frows, Math.ceil((z1 - fz0) / FINE_STEP)); r++) {
        for (let c = Math.max(0, Math.floor((x0 - fx0) / FINE_STEP)); c < Math.min(fcols, Math.ceil((x1 - fx0) / FINE_STEP)); c++) {
          if (!zonesAt([zn], fx0 + c * FINE_STEP, fz0 + r * FINE_STEP).length || fineWet[r * fcols + c]) continue
          fineGround[r * fcols + c] = rawGround[r * fcols + c]
          n++
        }
      }
    }
    if (n) console.log(`  raw relief kept in ${rawZones.length} zone(s): ${n} fine samples unopened`)
  }
  /*
   * …nor where the ground is IGN's lidar: an MNT is bare earth already, so there are no rooftops for the opening to take,
   * and all it can take is real ground narrower than 120 m. The Buttes-Chaumont's island, a rock 31 m over its lake, came
   * out flat at the water, the Temple de la Sibylle at the foot of its own cliff, and the Pont des Suicidés (on the rock
   * either side of a gorge, 18 m up) a way humped over the lakeside path (owner, 2026-10-30, 48.880332, 2.383315).
   */
  if (lidarPosts) {
    /*
     * …and kept SHARP at the structures (owner, 2026-11-06: "for buildings, we mask out the buildings so they don't affect the lidar
     * smoothing. but we don't do this on tunnel entrances, bridge entrances, and overpasses"). The blur took a trench's walls and an
     * approach's bank into the ground round them, and that ground into the cut: a post in a structure's corridor (`structureMask`) is
     * blurred only with the corridor's posts, and the ground round it only with its own.
     */
    /*
     * …and no DECK in it (owner, 2026-11-06: "a very sharp rise in the quai footpath up to bridge level, likely because the bridge is
     * reading as a lidar surface"; "a footbridge with a giant broken hill under it"). Where the survey kept a bridge's deck as ground,
     * every post under the deck — strictly between its ends, not in the water — takes the ground just outside the deck either side,
     * straight across: the quay under the arch, the road under the overpass. Not the abutments' approaches: those are earth.
     */
    {
      const n = deckOff(fine, kept, fx0, fz0, fcols, frows, FINE_STEP, fineWet, lidarPosts)
      if (n) console.log(`  bridge decks taken out of the survey: ${n} fine posts under them set from the ground either side`)
    }
    const struct = structureMask(kept, fx0, fz0, fcols, frows, FINE_STEP)
    structMask = struct
    const bare = classBlur(fine, fcols, frows, struct)
    {
      const old = bareEarthF(fine, fcols, frows, 0, fineWet)
      let n = 0, sOld = 0, sNew = 0
      const worst: [number, number][] = []
      for (let i = 0; i < fine.length; i++) {
        if (!struct[i] || !lidarPosts[i]) continue
        n++; sOld += Math.abs(old[i] - fine[i]); sNew += Math.abs(bare[i] - fine[i])
        worst.push([Math.abs(old[i] - bare[i]), i])
      }
      worst.sort((a, b) => b[0] - a[0])
      const at = worst.slice(0, 400).filter((w, k, all) => all.slice(0, k).every((v) => Math.hypot((v[1] % fcols) - (w[1] % fcols), Math.floor(v[1] / fcols) - Math.floor(w[1] / fcols)) > 25)).slice(0, 6)
        .map(([d, i]) => { const ll = proj.toLatLon({ x: fx0 + (i % fcols) * FINE_STEP, z: fz0 + Math.floor(i / fcols) * FINE_STEP }); return `${ll.lat.toFixed(5)},${ll.lon.toFixed(5)} (${d.toFixed(1)} m)` })
      console.log(`  structure mask: ${n} fine posts at bridges, their heads and tunnel mouths; blur off the survey there ${n ? (sOld / n).toFixed(2) : 0} m → ${n ? (sNew / n).toFixed(2) : 0} m; most changed: ${at.join('; ')}`)
    }
    /*
     * …except a sharp bump at a big building: there the survey has taken the building for ground (owner, 2026-10-30, the Fondation
     * Louis Vuitton: 18 m of "hill" over a lawn at 36 m, 40 m across, its slopes through the sails). Within 25 m of a footprint of
     * 800 m² or more, what stands over a 48 m opening of the ground by more than 2-4 m goes back to it. The small buildings on the
     * Buttes-Chaumont's rock are too small to count, and the wider things are real: the esplanade of the Bibliothèque François-
     * Mitterrand is in the survey, 60 m and more across, 22 m over its sunken garden, with its footways on it.
     */
    const narrow = bareEarthF(fine, fcols, frows, Math.round(24 / FINE_STEP), fineWet)
    const reach = new Float32Array(fineGround.length)
    const REACH = 25
    for (const b of buildings) {
      const r = b.ring
      let a2 = 0, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        a2 += r[j] * r[i + 1] - r[i] * r[j + 1]
        x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); z0 = Math.min(z0, r[i + 1]); z1 = Math.max(z1, r[i + 1])
      }
      if (Math.abs(a2) / 2 < 800) continue
      for (let rr = Math.max(0, Math.floor((z0 - REACH - fz0) / FINE_STEP)); rr <= Math.min(frows - 1, Math.ceil((z1 + REACH - fz0) / FINE_STEP)); rr++) {
        for (let c = Math.max(0, Math.floor((x0 - REACH - fx0) / FINE_STEP)); c <= Math.min(fcols - 1, Math.ceil((x1 + REACH - fx0) / FINE_STEP)); c++) {
          const i = rr * fcols + c
          if (reach[i] >= 1) continue
          const x = fx0 + c * FINE_STEP, z = fz0 + rr * FINE_STEP
          let w = 0
          if (inRing(r, x, z)) w = 1
          else {
            let d = Infinity
            for (let q = 0, j = r.length - 2; q < r.length; j = q, q += 2) {
              const ax = r[j], az = r[j + 1], dx = r[q] - ax, dz = r[q + 1] - az
              const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)))
              d = Math.min(d, Math.hypot(ax + dx * t - x, az + dz * t - z))
            }
            w = 1 - d / REACH
          }
          if (w > reach[i]) reach[i] = w
        }
      }
    }
    let n = 0, flattened = 0
    for (let i = 0; i < fineGround.length; i++) {
      if (!lidarPosts[i] || fineWet[i]) continue
      const bump = bare[i] - narrow[i]
      const k = reach[i] > 0 ? reach[i] * Math.max(0, Math.min(1, (bump - 2) / 2)) : 0
      if (k > 0.5) flattened++
      fineGround[i] = bare[i] - bump * k
      n++
    }
    console.log(`  lidar's relief kept: ${n} fine samples unopened, ${flattened} of them buildings the survey took for ground`)
  }
  /*
   * …and where a zone says `lidar: true`, the LIDAR bare earth (tools/lidar/dtm.py → tools/cache/lidar/dtm-<city>.json):
   * the zoom-15 tiles top out at ~37° at Lands End however little they are smoothed, the data itself being blurred,
   * and the cliffs "look wrong when smoothed over" (owner, 2026-10-06). The lidar has them at up to 81°. Sampled
   * bilinearly at each fine post; shifted by the median difference between the two over the zone, so the datums
   * (NAVD88 and the tiles') agree; a post with no lidar ground under it, or in the water, keeps the tile's height.
   */
  {
    const dtmFile = resolve(import.meta.dirname, 'cache', 'lidar', `dtm-${spec.id}.json`)
    const lidarZones = loadZones(spec, (lat, lon) => proj.toLocal({ lat, lon })).filter((zn) => zn.props.lidar)
    if (lidarZones.length && !existsSync(dtmFile)) console.log(`  !! ${lidarZones.length} zone(s) ask for lidar ground, and there is no ${dtmFile} — run tools/lidar/dtm.py`)
    if (lidarZones.length && existsSync(dtmFile)) {
      const dtm = JSON.parse(readFileSync(dtmFile, 'utf8')) as { zones: { name: string; x0: number; z0: number; step: number; cols: number; rows: number; h: (number | null)[] }[] }
      for (const g of dtm.zones) {
        const zn = lidarZones.find((q) => q.name === g.name)
        if (!zn) continue
        const at = (x: number, z: number): number | null => {
          const fc = (x - g.x0) / g.step, fr = (z - g.z0) / g.step
          const c = Math.floor(fc), r = Math.floor(fr)
          if (c < 0 || r < 0 || c + 1 >= g.cols || r + 1 >= g.rows) return null
          const v = [g.h[r * g.cols + c], g.h[r * g.cols + c + 1], g.h[(r + 1) * g.cols + c], g.h[(r + 1) * g.cols + c + 1]]
          if (v.some((q) => q === null)) return null
          const tx = fc - c, tz = fr - r
          return ((v[0]! * (1 - tx) + v[1]! * tx) * (1 - tz) + (v[2]! * (1 - tx) + v[3]! * tx) * tz)
        }
        const posts: [number, number][] = []
        const diffs: number[] = []
        const [x0, z0, x1, z1] = zn.bbox
        for (let r = Math.max(0, Math.floor((z0 - fz0) / FINE_STEP)); r < Math.min(frows, Math.ceil((z1 - fz0) / FINE_STEP)); r++) {
          for (let c = Math.max(0, Math.floor((x0 - fx0) / FINE_STEP)); c < Math.min(fcols, Math.ceil((x1 - fx0) / FINE_STEP)); c++) {
            const i = r * fcols + c
            if (fineWet[i] || !zonesAt([zn], fx0 + c * FINE_STEP, fz0 + r * FINE_STEP).length) continue
            const v = at(fx0 + c * FINE_STEP, fz0 + r * FINE_STEP)
            if (v === null) continue
            posts.push([i, v])
            diffs.push(fineGround[i] - v)
          }
        }
        if (!posts.length) continue
        diffs.sort((p, q) => p - q)
        const shift = diffs[diffs.length >> 1]
        for (const [i, v] of posts) fineGround[i] = v + shift
        console.log(`  lidar ground in ${g.name}: ${posts.length} fine posts (datum shift ${shift.toFixed(2)} m)`)
      }
    }
  }
  /*
   * THE COUR NAPOLÉON IS NOT A PIT (owner, 2026-10-30, 48.860979, 2.336218). Through the Pyramid's glass and its basins the survey read the
   * hall under the court: bare earth at −6 m, against +1 m at the court's west end, and water drawn at its lowest bank less the river's drop
   * stood in a stone pit 6 m deep, the pyramids at the bottom of it. A ring a region names (`levelGrounds`) is levelled at the median
   * height of its edge, eased back into the ground over 12 m outside it.
   */
  for (const lv of streetRegion.levelGrounds ?? []) {
    const r: number[] = lv.ring.flatMap(([lat, lon]) => { const q = proj.toLocal({ lat, lon }); return [q.x, q.z] })
    const edge: number[] = []
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    const seg = (i: number, x: number, z: number): number => {
      const j = (i + 2) % r.length, dx = r[j] - r[i], dz = r[j + 1] - r[i + 1]
      const t = Math.max(0, Math.min(1, ((x - r[i]) * dx + (z - r[i + 1]) * dz) / (dx * dx + dz * dz || 1)))
      return Math.hypot(r[i] + dx * t - x, r[i + 1] + dz * t - z)
    }
    for (let i = 0; i < r.length; i += 2) {
      x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); z0 = Math.min(z0, r[i + 1]); z1 = Math.max(z1, r[i + 1])
      const j = (i + 2) % r.length, L = Math.hypot(r[j] - r[i], r[j + 1] - r[i + 1])
      for (let d = 0; d < L; d += FINE_STEP) edge.push(sampleGridF(fineGround, fcols, frows, fx0, fz0, FINE_STEP, r[i] + ((r[j] - r[i]) * d) / L, r[i + 1] + ((r[j + 1] - r[i + 1]) * d) / L))
    }
    edge.sort((a, b) => a - b)
    // (`at`: the level is the ground's height at that point, for a platform whose rim is lower than its middle — the
    // Château de Versailles' courts, whose edge median sat 9 m under the cour royale: the datum-free way to say "as high as there")
    const atP = lv.at ? proj.toLocal({ lat: lv.at[0], lon: lv.at[1] }) : null
    const y = lv.y ?? (atP ? sampleGridF(fineGround, fcols, frows, fx0, fz0, FINE_STEP, atP.x, atP.z) : edge[edge.length >> 1])
    const FADE = lv.fade ?? 12
    let n = 0
    for (let rr = Math.max(0, Math.floor((z0 - FADE - fz0) / FINE_STEP)); rr <= Math.min(frows - 1, Math.ceil((z1 + FADE - fz0) / FINE_STEP)); rr++) {
      for (let c = Math.max(0, Math.floor((x0 - FADE - fx0) / FINE_STEP)); c <= Math.min(fcols - 1, Math.ceil((x1 + FADE - fx0) / FINE_STEP)); c++) {
        const i = rr * fcols + c
        const x = fx0 + c * FINE_STEP, z = fz0 + rr * FINE_STEP
        let k = 1
        if (!inRing(r, x, z)) {
          let d = Infinity
          for (let q = 0; q < r.length; q += 2) d = Math.min(d, seg(q, x, z))
          if (d >= FADE) continue
          k = 1 - d / FADE
        }
        fineGround[i] += (y - fineGround[i]) * k
        n++
      }
    }
    console.log(`  ${lv.name}: ${n} fine posts levelled at ${y.toFixed(2)} m`)
  }
  /*
   * THE LOWER QUAYS ARE A SHELF, NOT A SLOPE (owner, 2026-11-05, Port du Louvre 48.860476, 2.330698): the survey's ground
   * between a quay street and the Seine is a smooth grass bank, where Paris has a vertical wall and a wide cobbled lower
   * quay at one level. Every LQ_STEP m along every `Quai ` street, stepping out to the water: a sample is a lower quay
   * where the ground falls LQ_MIN_DROP or more from the street to LQ_BANK m short of the water. OSM cuts a quay into
   * many short ways, so the samples are pooled across ALL of them: each one's shelf is the median level of the good
   * samples within LQ_LEVEL_R m (a single sample on the slope reads too high), and a majority over LQ_VOTE_R m decides
   * where the shelf is, so it neither stops and starts nor reaches a stray bank. From the slope's top to the water the
   * ground is set to the shelf; render/quays.ts finds it and draws the wall, the setts and the stairs.
   */
  // the shelf's posts, so the tiles they are in ship the 4 m ground (a 20 m post cannot hold a wall)
  const shelfPosts: number[] = []
  {
    const LQ_STEP = 2, LQ_REACH = 80, LQ_TOP_FALL = 0.8, LQ_MIN_DROP = 2.5, LQ_BANK = 3, LQ_LEVEL_R = 250, LQ_VOTE_R = 35, LQ_VOTE = 0.5
    const G = (x: number, z: number): number => sampleGridF(fineGround, fcols, frows, fx0, fz0, FINE_STEP, x, z)
    // never at a bridge's end: the square a bridge lands on stays at the street's level (Pont d'Iéna, Place de Varsovie)
    const LQ_BRIDGE_CLEAR = 8
    const bridgeLines = kept.filter((b) => b.bridge).map((b) => ({ p: unpackPoints(b.points), r: b.width / 2 + LQ_BRIDGE_CLEAR }))
    const nearBridge = (x: number, z: number): boolean => bridgeLines.some(({ p, r }) => {
      for (let i = 1; i < p.length; i++) {
        const a = p[i - 1], b = p[i], dx = b.x - a.x, dz = b.z - a.z
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
        if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) < r) return true
      }
      return false
    })
    type S = { x: number; z: number; vx: number; vz: number; l: number; top: number; edge: number; street: number; y: number; ok: boolean }
    const ss: S[] = []
    const lq = streetRegion.lowerQuays ? new Set(streetRegion.lowerQuays) : null
    for (const e of kept) {
      if (!e.name || !/^Quai /.test(e.name) || e.foot || e.bridge || e.tunnel || (lq && !lq.has(e.name))) continue
      const pts = unpackPoints(e.points)
      const d = e.width / 2 + e.walk + 0.15
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i]
        const seg = Math.hypot(b.x - a.x, b.z - a.z)
        if (seg < 0.1) continue
        const ux = (b.x - a.x) / seg, uz = (b.z - a.z) / seg
        for (let t = 0; t < seg - 1e-6; t += LQ_STEP) {
          const l = Math.min(LQ_STEP, seg - t)
          const x = a.x + ux * (t + l / 2), z = a.z + uz * (t + l / 2)
          let side = 0, edge = Infinity
          for (const sd of [-1, 1]) for (let o = d; o <= d + LQ_REACH; o += 1) {
            if (wetIndex(x - uz * sd * o, z + ux * sd * o) !== null) { if (o < edge) { edge = o; side = sd } break }
          }
          if (side === 0 || nearBridge(x, z)) continue
          const st: S = { x, z, vx: -uz * side, vz: ux * side, l, top: -1, edge, street: 0, y: 0, ok: false }
          const at = (o: number): number => G(x + st.vx * o, z + st.vz * o)
          st.street = at(d)
          // (the wall's top scanned back in from the water, not the first fall out from the street: a trench between them —
          //  the Quai de Bercy's lid tunnel, 2026-11-07 — took the cycle track beyond it down to the shelf)
          for (let o = Math.floor(edge - LQ_BANK); o >= d; o -= 1) if (at(o) >= st.street - LQ_TOP_FALL) { st.top = o + 1 < edge - LQ_BANK ? o + 1 : -1; break }
          st.y = at(edge - LQ_BANK)
          st.ok = st.top > 0 && st.street - st.y >= LQ_MIN_DROP && !nearBridge(x + st.vx * st.top, z + st.vz * st.top)
          ss.push(st)
        }
      }
    }
    // a coarse bucket grid for the neighbourhood queries
    const CELL = LQ_LEVEL_R
    const buckets = new Map<string, S[]>()
    for (const q of ss) { const k = `${Math.floor(q.x / CELL)},${Math.floor(q.z / CELL)}`; (buckets.get(k) ?? buckets.set(k, []).get(k)!).push(q) }
    const near = (q: S, r: number): S[] => {
      const out: S[] = []
      const cx = Math.floor(q.x / CELL), cz = Math.floor(q.z / CELL)
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const o of buckets.get(`${cx + i},${cz + j}`) ?? []) if (Math.hypot(o.x - q.x, o.z - q.z) < r) out.push(o)
      return out
    }
    const level = ss.map((q) => {
      const ys = near(q, LQ_LEVEL_R).filter((o) => o.ok).map((o) => o.y).sort((a, b) => a - b)
      return ys.length ? ys[ys.length >> 1] : NaN
    })
    const good = ss.map((q, i) => {
      const n = near(q, LQ_VOTE_R)
      return n.filter((o) => o.ok).length >= LQ_VOTE * n.length && Number.isFinite(level[i]) && q.street - level[i] >= LQ_MIN_DROP
    })
    let posts = 0, kept2 = 0
    // (a post whose ground is still up at the street's level is not the bank: on the 4 m grid the post nearest the wall's top
    //  is often the cycle track along it — the Quai de Bercy's, 2026-11-07 — and it went down to the shelf)
    const g0 = fineGround.slice()
    ss.forEach((st, i) => {
      if (!good[i]) return
      kept2++
      const y = level[i]
      // the slope's top for a sample that had none: where the ground first falls under the street, else a third of the way out
      let top = st.top
      if (top <= 0) { top = st.edge / 3; for (let o = Math.floor(st.edge); o >= 1; o -= 1) if (G(st.x + st.vx * o, st.z + st.vz * o) >= st.street - LQ_TOP_FALL) { top = o + 1; break } }
      const ux = st.vz, uz = -st.vx
      for (let o = top + 1; o <= st.edge + 2; o += 1) for (let a = -st.l / 2 - 1; a <= st.l / 2 + 1; a += 1) {
        const px = st.x + st.vx * o + ux * a, pz = st.z + st.vz * o + uz * a
        const c = Math.round((px - fx0) / FINE_STEP), r = Math.round((pz - fz0) / FINE_STEP)
        if (c < 0 || r < 0 || c >= fcols || r >= frows) continue
        const k = r * fcols + c
        if (g0[k] >= st.street - LQ_TOP_FALL) continue
        if (bandAt(px, pz)) continue // (the Seine band: no lower-quay shelf; BD TOPO's ground)
        if (fineGround[k] !== y) { fineGround[k] = y; posts++ }
        shelfPosts.push(px, pz)
      }
    })
    console.log(`  lower quays: ${kept2} of ${ss.length} quay samples levelled, ${posts} fine posts set`)
  }
  /*
   * POND BEDS (2026-10-26). The lidar has no ground returns over water, and the tiles' height there is a smoothed
   * blur of the banks round it — so a pond came out as a MOUND under its water plane: in the garden test area the
   * Japanese Tea Garden's Main Pond's bed stood 1.7 m over its own water (a pond's level is its lowest bank,
   * city/package.ts waterLevels), and from the south bank the water plane cut across a green hill with the far
   * bank's rocks in the air over it. A small body of water — a pond, a lake; not the sea or a river, which keep #58's
   * rule below — has a bed: every fine post well inside its ring goes down to half a metre under its level, the level
   * taken as waterLevels takes it, off its ring's vertices. Posts within a grid step of the ring are left, so the
   * vertices' own samples (and so the level) do not move. The coarse grid is averaged down from the fine one later,
   * and follows.
   */
  {
    const edgeDist = (r: number[], x: number, z: number): number => {
      let best = Infinity
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        const ax = r[j], az = r[j + 1], dx = r[i] - ax, dz = r[i + 1] - az
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)))
        best = Math.min(best, Math.hypot(ax + dx * t - x, az + dz * t - z))
      }
      return best
    }
    let beds = 0, ponds = 0
    for (const a of areas) {
      if (a.kind !== 'water' || a.sea) continue
      const r = a.ring
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); z0 = Math.min(z0, r[i + 1]); z1 = Math.max(z1, r[i + 1]) }
      // (a lake at most — Stow Lake is 150 m across; the bay and the rivers are kilometres)
      if ((x1 - x0) * (z1 - z0) > 250_000) continue
      const hs: number[] = []
      for (let i = 0; i < r.length; i += 2) hs.push(sampleGridF(fineGround, fcols, frows, fx0, fz0, FINE_STEP, r[i], r[i + 1]))
      hs.sort((p, q) => p - q)
      const lv = hs[0]
      if (!Number.isFinite(lv)) continue
      /*
       * …and only where the level can be trusted: it is the LOWEST bank vertex (waterLevels), and round Stow Lake the
       * banks the tiles give run 8 m apart (median 6 m over the lowest), so the lake is drawn 6 m under most of its
       * shore. Lowering its bed to that cut 5 m cliffs round the lake and left the Golden Gate Pavilion half in the
       * ground (owner, 2026-10-26). A ring whose median bank stands more than 1.5 m over its lowest has a terrain
       * problem the bed cannot fix, and is left as it was.
       */
      if (hs[hs.length >> 1] - lv > 1.5) continue
      const bed = lv - 0.5
      let n = 0
      for (let rr = Math.max(0, Math.floor((z0 - fz0) / FINE_STEP)); rr <= Math.min(frows - 1, Math.ceil((z1 - fz0) / FINE_STEP)); rr++) {
        for (let c = Math.max(0, Math.floor((x0 - fx0) / FINE_STEP)); c <= Math.min(fcols - 1, Math.ceil((x1 - fx0) / FINE_STEP)); c++) {
          const i = rr * fcols + c
          if (fineGround[i] <= bed) continue
          const x = fx0 + c * FINE_STEP, z = fz0 + rr * FINE_STEP
          if (!inRing(r, x, z) || (a.holes ?? []).some((h) => inRing(h, x, z)) || edgeDist(r, x, z) < FINE_STEP * 0.9) continue
          fineGround[i] = bed
          n++
        }
      }
      if (n) { beds += n; ponds++ }
    }
    if (ponds) console.log(`  pond beds: ${beds} fine posts in ${ponds} ponds lowered to half a metre under their water`)
  }
  /*
   * THE LIDAR'S RIVER IS ITS SURFACE, not its bed: an MNT reads the water, not unevenly but a metre out here and there, and the
   * plane is drawn from the banks, so strips of "bed" stood over the water all along the Seine as flat grey-blue mudflats (Pont
   * Neuf, 2026-10-30). So every wet post not on the shore goes under. The shore keeps its height, and the quays their walls.
   */
  if (lidarPosts) {
    let under = 0
    for (let r = 1; r < frows - 1; r++) {
      for (let c = 1; c < fcols - 1; c++) {
        const i = r * fcols + c
        if (!lidarPosts[i] || !fineWet[i] || !fineWet[i - 1] || !fineWet[i + 1] || !fineWet[i - fcols] || !fineWet[i + fcols]) continue
        fineGround[i] -= 3
        under++
      }
    }
    console.log(`  river beds: ${under} fine posts of lidar's water surface taken 3 m down`)
  }
  /*
   * The sea bed is not the ground (BUGS.md #58). The elevation tiles carry BATHYMETRY: off the Embarcadero the
   * bay floor drops to −108 m, so the shoreline came out as a cliff, the water plane sat in a pit far out from
   * the quays, and the piers — which stand on the bed — hung over a canyon or appeared to be on dry land.
   * A bay is flat and shallow as far as a rider can tell: every wet sample well below the shore is brought up
   * to just under the level of the land round it, which is what the water plane is drawn at.
   */
  /*
   * `shore` is hoisted because the SEA'S SURFACE is the same number (BUGS.md #161). Note the frame: this runs
   * BEFORE the datum subtraction below, so `shore` and `shore − 1.5` are RAW elevations — true metres above
   * sea level, which is why `shore` reads a sensible 0.6 m on a coastline. Converting it to the datum frame
   * is done once, at the datum, and nowhere else.
   */
  let shoreRaw: number | null = null
  {
    const shoreline: number[] = []
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        const i = r * cols + c
        if (wetMask[i]) continue
        const wetBeside = wetMask[i - 1] || wetMask[i + 1] || wetMask[i - cols] || wetMask[i + cols]
        if (wetBeside) shoreline.push(ground[i])
      }
    }
    // (only where there IS a sea: a bake with none — jtg-mini, 450 m round the Japanese Tea Garden — took its "shore"
    //  from the ponds' own banks and raised every pond's bed to it, 3 m over the water, a mound under each water plane
    //  with the bank's rocks in the air round it, 2026-10-26)
    if (shoreline.length > 0 && areas.some((a) => a.kind === 'water' && a.sea)) {
      shoreline.sort((a, b) => a - b)
      const shore = shoreline[Math.floor(shoreline.length * 0.35)]
      shoreRaw = shore
      let raised = 0
      for (let i = 0; i < ground.length; i++) {
        if (wetMask[i] && ground[i] < shore - 3) { ground[i] = shore - 1.5; raised++ }
      }
      // the SAME shore, on the fine grid: two grids flattened to two different levels is a step at the
      // waterline and a seam between the ocean and the bay, which is exactly what BUGS.md #161 cost a day to
      for (let i = 0; i < fineGround.length; i++) {
        if (fineWet[i] && fineGround[i] < shore - 3) fineGround[i] = shore - 1.5
      }
      if (raised > 0) console.log(`  sea bed flattened: ${raised} samples brought up to ${(shore - 1.5).toFixed(1)} m (shore ${shore.toFixed(1)} m)`)
    }
  }
  /*
   * ONE datum for both grids, taken from the FINE one (BUGS.md #161: local 0 is the origin's ground, about
   * 82 m above sea level here, not sea level). If the coarse grid and the tiles were normalised against
   * different datums the city would STEP at the edge of every loaded tile — and by the height of a house,
   * because the two grids disagree about the ground at the origin by whatever the fine detail there is.
   */
  // a test area may borrow its parent city's datum (CitySpec `datum`), so its heights read the same as the parent's
  const datum = spec.datum ?? sampleGridF(fineGround, fcols, frows, fx0, fz0, FINE_STEP, 0, 0)
  const datumRaw = datum
  for (let i = 0; i < ground.length; i++) ground[i] = Math.round((ground[i] - datum) * 100) / 100
  for (let i = 0; i < fineGround.length; i++) fineGround[i] = Math.round((fineGround[i] - datum) * 100) / 100
  /*
   * DECKS (ZoneProps `deck`): a pier on fill or piles is level, and the elevation tiles smear it down toward the sea bed
   * round its edges — Pier 39 sank to 6 m under its own carousel plaza (2026-10-17). Inside the zone the fine ground is
   * set to sea level + `deck`; within 3 m outside it, blended back to the ground. The coarse grid is averaged from the
   * fine one below, so both agree.
   */
  {
    const deckZones = loadZones(spec, (lat, lon) => proj.toLocal({ lat, lon })).filter((zn) => typeof zn.props.deck === 'number')
    let n = 0
    const BLEND = 3
    for (const zn of deckZones) {
      const ring: { x: number; z: number }[] = []
      for (let i = 0; i < zn.ring.length; i += 2) ring.push({ x: zn.ring[i], z: zn.ring[i + 1] })
      const target = -datumRaw + zn.props.deck!
      const edgeDist = (x: number, z: number): number => {
        let best = Infinity
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i], b = ring[(i + 1) % ring.length], dx = b.x - a.x, dz = b.z - a.z
          const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1e-9)))
          best = Math.min(best, Math.hypot(a.x + dx * t - x, a.z + dz * t - z))
        }
        return best
      }
      const [bx0, bz0, bx1, bz1] = zn.bbox
      const c0 = Math.max(0, Math.floor((bx0 - BLEND - fx0) / FINE_STEP)), c1 = Math.min(fcols - 1, Math.ceil((bx1 + BLEND - fx0) / FINE_STEP))
      const r0 = Math.max(0, Math.floor((bz0 - BLEND - fz0) / FINE_STEP)), r1 = Math.min(frows - 1, Math.ceil((bz1 + BLEND - fz0) / FINE_STEP))
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const x = fx0 + c * FINE_STEP, z = fz0 + r * FINE_STEP
        const i = r * fcols + c
        if (zonesAt([zn], x, z).length) { fineGround[i] = Math.round(target * 100) / 100; n++; continue }
        const d = edgeDist(x, z)
        if (d < BLEND) { const k = d / BLEND; fineGround[i] = Math.round((target * (1 - k) + fineGround[i] * k) * 100) / 100; n++ }
      }
    }
    if (n) console.log(`  ${n} fine ground samples laid as decks (zones with deck)`)
  }
  /*
   * ---- and the coarse grid is DERIVED from the fine one where the fine one reaches.
   *
   * Two independent samplings of one noisy source disagree by exactly the amount of noise, and the seam
   * between them would sit at the edge of the loaded ring, all the way round the rider. Averaging the fine
   * samples in each coarse cell (rather than taking the one that lands on the post) is a low-pass before a
   * downsample — the textbook order, and the reason matters here: the roads read the coarse grid, and a
   * decimation that ALIASES the 4 m detail onto 20 m posts would put a ripple into every street in the box
   * (BUGS.md #206d). Averaged, the coarse grid stays as smooth as it is today and simply agrees with the
   * fine one about the big shape.
   */
  {
    // a WHOLE number of fine cells either side of the post: `n / 2` would be 2.5 here, and a fractional
    // index into a `Float64Array` is `undefined`, so the average came out NaN and the decimation silently
    // did nothing at all while still reporting every post done
    const half = Math.floor(Math.round(STEP / FINE_STEP) / 2)
    let done = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const gx = Math.round((tx0 + c * STEP - fx0) / FINE_STEP)
        const gz = Math.round((tz0 + r * STEP - fz0) / FINE_STEP)
        if (gx - half < 0 || gz - half < 0 || gx + half >= fcols || gz + half >= frows) continue
        let sum = 0
        let k = 0
        for (let dz = -half; dz <= half; dz++) for (let dx = -half; dx <= half; dx++) {
          sum += fineGround[(gz + dz) * fcols + (gx + dx)]
          k++
        }
        ground[r * cols + c] = Math.round((sum / k) * 100) / 100
        done++
      }
    }
    /*
     * And CHECK it, because the failure above was invisible: the bake logged every post done, the city
     * looked plausible, and the only symptom was the coarse grid sitting a house's height away from the
     * tiles — which nothing would have noticed until a rider crossed the edge of the loaded ring.
     */
    const gaps: number[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = tx0 + c * STEP
        const z = tz0 + r * STEP
        if (!inFineGrid(x, z)) continue
        gaps.push(Math.abs(ground[r * cols + c] - sampleGridF(fineGround, fcols, frows, fx0, fz0, FINE_STEP, x, z)))
      }
    }
    gaps.sort((a, b) => a - b)
    const at = (q: number): number => gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * q))]
    /*
     * The MEDIAN, not the maximum. What this is guarding against is the two grids being in different
     * FRAMES — the failure it was written for put a constant ~25 m between them everywhere — and a median
     * catches that outright. A maximum cannot be the test: a 20 m box average legitimately differs from a
     * point sample by metres on a cliff, and by more than that next to a NODATA hole the guard above only
     * partly cleaned up. Those are single posts; a frame error moves all of them.
     */
    console.log(`  coarse grid: ${done} of ${cols * rows} posts averaged down from the fine grid `
      + `(post-for-post gap: p50 ${at(0.5).toFixed(2)} p99 ${at(0.99).toFixed(2)} max ${at(1).toFixed(2)} m)`)
    if (!Number.isFinite(at(0.5)) || at(0.5) > 2) {
      throw new Error(`the coarse grid and the fine one are not in the same frame (median gap ${at(0.5).toFixed(2)} m) — the decimation is broken`)
    }
  }
  /*
   * The sea's surface in the DATUM frame, for `waterLevels` (BUGS.md #161). `shoreRaw − 1.5` is exactly the
   * level #58 flattened the bed to, so the water plane and the bed it covers are by construction the same
   * surface. The conversion happens here and only here, because here is where the datum exists.
   */
  /*
   * THE SEA IS AT MEAN SEA LEVEL, which in this datum frame is exactly `-datumRaw`. Nothing else is needed.
   *
   * This started as `shoreRaw - 1.5 - datumRaw`, a proxy: take the shoreline's 35th percentile and drop a
   * metre and a half. That was reasonable while the only water was ponds and a sliver of bay, and it broke
   * the moment BUGS.md #159 was properly fixed and the WHOLE coast entered `wetMask` — the shoreline sample
   * set changed underneath it and `shoreRaw` fell from +0.6 m to -1.4 m, putting the sea 2.9 m too low.
   *
   * Measured on the bake that exposed it: the Ferry Building plaza stood 5.7 m above the water where it
   * should stand about 3, the Embarcadero at Green Street 5.0 m, Pier 39 4.8 m. A render could not show this
   * — pier sheds genuinely do stand over water, so "too low" and "correct" look alike from the shore.
   */
  const seaLevel = shoreRaw === null ? null : Math.round(-datumRaw * 100) / 100
  // a loop, not a spread: central Paris's grid is 340 000 samples, past what a call's arguments can hold
  let lo = Infinity
  let hi = -Infinity
  for (const g of ground) { if (g < lo) lo = g; if (g > hi) hi = g }
  const relief = hi - lo
  console.log(`  ground sampled: ${cols}x${rows} at ${STEP} m, ${relief.toFixed(0)} m of relief (bare earth)`)

  const terrain: PackedTerrain = {
    x0: tx0, z0: tz0, step: STEP, cols, rows, heights: ground,
    src: `terrarium z${COARSE_ZOOM}+z${FINE_ZOOM}`, resM: Math.round(metresPerPixel(spec.centre.lat, COARSE_ZOOM) * 10) / 10,
  }
  /*
   * The fine grid as a package field. `splitPackage` cuts it into the tiles and it never reaches the index
   * — that is the whole point (#176: terrain was 20.5 MB of a 26.2 MB index, 78% of it, parsed on the main
   * thread before anything renders). `resM` is the SOURCE's resolution, not `step`: a tile must never
   * overstate its data, because everything downstream believes it.
   */
  const terrainFine: PackedTerrain = {
    // only its provenance is used now (the shipped model's fine blocks carry it); the tiles are cut from `shipped`
    x0: fx0, z0: fz0, step: FINE_STEP, cols: fcols, rows: frows, heights: [],
    src: `terrarium z${FINE_ZOOM}`, resM: Math.round(metresPerPixel(spec.centre.lat, FINE_ZOOM) * 100) / 100,
  }

  /**
   * The ground the way the GAME will see it: the fine grid where it reaches, the coarse one beyond.
   *
   * This must be the same rule as `Terrain.rawHeightAt` (city/terrain.ts), or the street the rider follows
   * and the ground it is drawn on would come from different surfaces — which is the one thing BUGS.md #38
   * was written to prevent ("two samplings of one noisy source disagree by exactly the amount of noise").
   *
   * Note what does NOT use it: `groundAt` below, which the bridges read. A bridge's clearance is tuned
   * against the water level (#31, #37), it spans water where the fine and coarse grids are both the
   * flattened sea bed and agree by construction, and it is not worth disturbing for no gain.
   */
  /*
   * ---- THE TERRAIN MODEL (docs/MAP-FORMAT.md §5.7, owner 2026-09-28).
   *
   * Fine ground only where a ZONE asks for it — the big parks, the coast — and the coarse grid everywhere else,
   * so the streets and the buildings stand on smooth ground rather than on every kerb and mound the 4 m
   * samples carry. The fine grid above is still sampled over the whole detail box, because the coarse grid is
   * averaged down from it; what changes is only which of the two each tile SHIPS.
   *
   * Everything baked from here on — the streets' levels below, and every height map format v3 writes — reads
   * `shipped`, which is the renderer's own sampler over exactly the blocks the tiles carry. Zones decide the
   * model; nothing that samples it knows zones exist.
   */
  const zones = loadZones(spec, (lat, lon) => proj.toLocal({ lat, lon }))
  const blockTiles: [number, number][] = []
  const fineTiles = new Set<string>()
  {
    // the tiles fully inside the fine grid, as `splitPackage` has always cut them
    const ta = Math.ceil(fx0 / TILE)
    const tb = Math.ceil(fz0 / TILE)
    const tc = Math.floor((fx0 + (fcols - 1) * FINE_STEP) / TILE) - 1
    const td = Math.floor((fz0 + (frows - 1) * FINE_STEP) / TILE) - 1
    const fineZones = zones.filter((zn) => zn.props.terrain === 'fine')
    for (let tx = ta; tx <= tc; tx++) for (let tz = tb; tz <= td; tz++) {
      blockTiles.push([tx, tz])
      const r = [tx * TILE, tz * TILE, (tx + 1) * TILE, (tz + 1) * TILE] as const
      if (fineZones.some((zn) => zoneTouchesRect(zn, ...r))) fineTiles.add(`${tx},${tz}`)
    }
  }
  /*
   * A RAILWAY'S TILES SHIP THE 4 M GROUND (Paris; 2026-10-31, the audit of every line; owner: "all train tracks from OSM are in bad shape vertically"). The lidar along a
   * track is the smoothest thing in the survey (the Saint-Germain line out of Saint-Lazare: 4.5, 4.3, 3.9, 4.3, 4.7 m over 1.3 km), and its trench is there too, from a 40 m floor to a
   * wall of 10-15 m in 8 m. Read at 20 m posts the wall's foot and top came through as noise: the track rode 1-2 m up and down its own floor (drawn − lidar: 18% of all track over 1 m,
   * 7% over 2 m), the yard's ground chords stood over the sleepers in patches, and the trench was a slope. It was already the rule for a street's cut ("so the cutting keeps its sides").
   * The tiles: 575 of 5,074.
   */
  if (spec.region === 'paris') {
    const blocks = new Set(blockTiles.map(([tx, tz]) => `${tx},${tz}`))
    let n = 0
    for (const k of railFineTiles([...rails, ...sunkRails], TILE)) if (blocks.has(k) && !fineTiles.has(k)) { fineTiles.add(k); n++ }
    console.log(`  ${n} tiles ship fine ground for the railway through them`)
    let nq = 0
    for (let i = 0; i < shelfPosts.length; i += 2) {
      const k = `${Math.floor(shelfPosts[i] / TILE)},${Math.floor(shelfPosts[i + 1] / TILE)}`
      if (blocks.has(k) && !fineTiles.has(k)) { fineTiles.add(k); nq++ }
    }
    console.log(`  ${nq} tiles ship fine ground for the lower quays in them`)
  }
  /*
   * THE QUAYS AT THE SURVEY'S OWN RESOLUTION (owner, 2026-11-05: "the quays probably ARE on lidar, but we smooth the lidar data …
   * we could use finer grained lidar near the river"). At 4 m posts a quay's wall is a grass bank a cell or two wide, the lower
   * quay's level reaches up under the parapet, and walkers on the pavement go down it. Every tile with a `Quai ` street within
   * QD_REACH m of the water ships the bare-earth lidar at QD_STEP m, fetched at QD_PX pixels a 0.01° tile (≈0.7–1.1 m). Not in
   * the water: the survey interpolates across the river, and the fine ground (lowered under it) stands there.
   */
  let quayDetail: { tiles: Set<string>; step: number; at: (x: number, z: number) => number | null; stepOf?: (tx: number, tz: number) => number | undefined } | undefined
  // the quays' walls as lines, from the ground as finally shipped (below, at the package)
  // the lower quays' segment ends (nodeKey), found from the ground in the quay detail: the bridgehead plates leave them and their ramps alone
  const lowKeys = new Set<string>()
  const quayNodeKey = (q: { x: number; z: number }) => `${Math.round(q.x * 2)},${Math.round(q.z * 2)}`
  let quayWallsOf: ((G: (x: number, z: number) => number) => QuayWall[]) | null = null
  if (spec.region === 'paris' && QD_STEP > 0) {
    const blocks = new Set(blockTiles.map(([tx, tz]) => `${tx},${tz}`))
    const tiles = new Set<string>()
    // the river only (owner: "we're shipping 1m ground for things like ponds"): a river body of QD_RIVER_AREA m² or more, as
    // the river's level is set further down; not a pond, a lake or a canal
    // (its own lookup: `wetIndex` answers a level, not which body)
    const riverBodies = areas.filter((a) => a.kind === 'water' && a.river && Math.abs(area(unpackPoints(a.ring))) >= QD_RIVER_AREA)
    const riverIndex = waterLookup(riverBodies.map((w) => {
      const ring = unpackPoints(w.ring)
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
      return { ring, holes: (w.holes ?? []).map(unpackPoints), x0, x1, z0, z1, level: 0 }
    }))
    const inRiver = (x: number, z: number): boolean => riverIndex(x, z) !== null
    for (const e of kept) {
      if (!e.name || !/^(Quai |Port |Voie Georges)/.test(e.name) || e.bridge || e.tunnel) continue
      for (const q of unpackPoints(e.points)) {
        let wet = false
        for (const [dx, dz] of [[QD_REACH, 0], [-QD_REACH, 0], [0, QD_REACH], [0, -QD_REACH], [0, 0]]) { if (inRiver(q.x + dx, q.z + dz)) wet = true }
        if (!wet) continue
        for (const [dx, dz] of [[0, 0], [QD_REACH, 0], [-QD_REACH, 0], [0, QD_REACH], [0, -QD_REACH]]) {
          const k = `${Math.floor((q.x + dx) / TILE)},${Math.floor((q.z + dz) / TILE)}`
          if (blocks.has(k)) { fineTiles.add(k); tiles.add(k) }
        }
      }
    }
    // fetched tile by tile: only the survey tiles under the quays, not the whole city's at 16x the pixels
    const { ignLidar } = await import('./ign-lidar.ts')
    const by = new Map<string, (lat: number, lon: number) => number | null>()
    let surveyed = 0
    for (const k of QD_FAKE ? [] : tiles) {
      const [tx, tz] = k.split(',').map(Number)
      const a = proj.toLatLon({ x: tx * TILE - 2, z: tz * TILE - 2 }), b = proj.toLatLon({ x: (tx + 1) * TILE + 2, z: (tz + 1) * TILE + 2 })
      const l = await ignLidar({ south: Math.min(a.lat, b.lat), north: Math.max(a.lat, b.lat), west: Math.min(a.lon, b.lon), east: Math.max(a.lon, b.lon) }, QD_PX)
      by.set(k, l.at)
      surveyed += l.tiles
    }
    // the survey reads true metres (IGN69); the ground here is already in the datum frame, `datumRaw` under them
    const raw = (x: number, z: number): number | null => {
      const at = by.get(`${Math.floor(x / TILE)},${Math.floor(z / TILE)}`) ?? by.get(`${Math.floor((x - 1) / TILE)},${Math.floor((z - 1) / TILE)}`)
      if (!at) return null
      const ll = proj.toLatLon({ x, z })
      const v = at(ll.lat, ll.lon)
      return v === null ? null : v - datumRaw
    }
    /*
     * …but not a bridge's deck (owner, 2026-11-06): at 1 m the survey keeps the Pont du Carrousel's deck where the lower quay runs
     * under it, 35 m over a 29 m quay, and the bridge would stand on "ground" that is itself the bridge. In a bridge's corridor
     * the ground is the mean of the survey just outside it either side, across the bridge (along the river): the lower quay
     * under the arch, the street at the bridge's head.
     */
    const decks = kept.filter((b) => b.bridge && !b.tunnel).map((b) => {
      const p = unpackPoints(b.points), r = b.width / 2 + (b.foot ? 0.5 : b.walk) + QD_DECK_PAD
      return { p, r, x0: Math.min(...p.map((q) => q.x)) - r, x1: Math.max(...p.map((q) => q.x)) + r, z0: Math.min(...p.map((q) => q.z)) - r, z1: Math.max(...p.map((q) => q.z)) + r }
    })
    const underDeck = (x: number, z: number): { ux: number; uz: number; r: number; d: number } | null => {
      for (const { p, r, x0, x1, z0, z1 } of decks) if (x >= x0 && x <= x1 && z >= z0 && z <= z1) for (let i = 1; i < p.length; i++) {
        const a = p[i - 1], b = p[i], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (L * L)))
        const ox = x - (a.x + dx * t), oz = z - (a.z + dz * t)
        const d = Math.hypot(ox, oz)
        if (d < r && t > 0 && t < 1) return { ux: -dz / L, uz: dx / L, r, d: ox * (-dz / L) + oz * (dx / L) }
      }
      return null
    }
    /*
     * …nor a boat, nor the waterline (owner, 2026-11-06: "if things aren't aligned exactly with the map … they'll cause steep bumps").
     * The river's outline is often traced round the péniches, and the survey under one is the water's surface: at the drawn
     * water's own level it fights the plane, and an outline a metre off makes a ridge. Within QD_BOAT_PAD of a boat, and
     * wherever the survey is within QD_WATER_EPS of the river's level, the ground goes QD_UNDER under the water.
     */
    const river = streetRegion.riverLevel !== undefined ? streetRegion.riverLevel - datumRaw : null
    const hulls = boatWays.map((w) => {
      const r = w.geometry.slice(0, -1).map((g) => proj.toLocal(g))
      return { r, x0: Math.min(...r.map((q) => q.x)) - QD_BOAT_PAD, x1: Math.max(...r.map((q) => q.x)) + QD_BOAT_PAD, z0: Math.min(...r.map((q) => q.z)) - QD_BOAT_PAD, z1: Math.max(...r.map((q) => q.z)) + QD_BOAT_PAD }
    })
    const nearHull = (x: number, z: number): boolean => hulls.some((h) => {
      if (x < h.x0 || x > h.x1 || z < h.z0 || z > h.z1) return false
      let o = false
      for (let i = 0, j = h.r.length - 1; i < h.r.length; j = i++) {
        const a = h.r[i], b = h.r[j]
        if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) o = !o
        const dx = b.x - a.x, dz = b.z - a.z, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
        if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) < QD_BOAT_PAD) return true
      }
      return o
    })
    const sink = (v: number | null): number | null => (v === null || river === null ? v : v <= river + QD_WATER_EPS ? Math.min(v, river - QD_UNDER) : v)
    /*
     * …nor a building the survey kept (owner: "the 1m ground will in fact contain some buildings"): the 4 m ground has been opened and
     * its building bumps taken out (above); the 1 m survey has not. Inside a footprint and QD_HOUSE_PAD round it, the fine ground stands.
     */
    const HB = 50
    const houses = new Map<string, number[][]>()
    for (const b of buildings) {
      const r = b.ring
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); z0 = Math.min(z0, r[i + 1]); z1 = Math.max(z1, r[i + 1]) }
      for (let cx = Math.floor((x0 - QD_HOUSE_PAD) / HB); cx <= Math.floor((x1 + QD_HOUSE_PAD) / HB); cx++)
        for (let cz = Math.floor((z0 - QD_HOUSE_PAD) / HB); cz <= Math.floor((z1 + QD_HOUSE_PAD) / HB); cz++) {
          const k = `${cx},${cz}`
          if (!tiles.has(`${Math.floor(cx * HB / TILE)},${Math.floor(cz * HB / TILE)}`)) continue
          ;(houses.get(k) ?? houses.set(k, []).get(k)!).push(r)
        }
    }
    const inHouse = (x: number, z: number): boolean => {
      for (const r of houses.get(`${Math.floor(x / HB)},${Math.floor(z / HB)}`) ?? []) {
        if (inRing(r, x, z)) return true
        for (let q = 0, j = r.length - 2; q < r.length; j = q, q += 2) {
          const ax = r[j], az = r[j + 1], dx = r[q] - ax, dz = r[q + 1] - az
          const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)))
          if (Math.hypot(ax + dx * t - x, az + dz * t - z) < QD_HOUSE_PAD) return true
        }
      }
      return false
    }
    /*
     * …and only near the river (owner: "only use 1m ground on the seine … places it's needed, not whole tiles"): within QD_BAND m of
     * the river's water, eased into the fine ground over its last QD_FADE m. A tile stores one spacing, so a quay tile ships 1 m
     * posts throughout, but away from the bank they carry the fine ground's own surface. The distance is a chamfer over the
     * fine grid's cells, from the river's.
     */
    const riverDist = new Float32Array(fcols * frows).fill(Infinity)
    {
      const queue: number[] = []
      for (const k of tiles) {
        const [tx, tz] = k.split(',').map(Number)
        const c0 = Math.max(0, Math.floor((tx * TILE - QD_BAND - fx0) / FINE_STEP)), c1 = Math.min(fcols - 1, Math.ceil(((tx + 1) * TILE + QD_BAND - fx0) / FINE_STEP))
        const r0 = Math.max(0, Math.floor((tz * TILE - QD_BAND - fz0) / FINE_STEP)), r1 = Math.min(frows - 1, Math.ceil(((tz + 1) * TILE + QD_BAND - fz0) / FINE_STEP))
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
          const i = r * fcols + c
          if (riverDist[i] === 0) continue
          if (inRiver(fx0 + c * FINE_STEP, fz0 + r * FINE_STEP)) { riverDist[i] = 0; queue.push(i) }
        }
      }
      // Dijkstra-ish on 8 neighbours, out to the band only
      for (let h = 0; h < queue.length; h++) {
        const i = queue[h], r = Math.floor(i / fcols), c = i - r * fcols, d0 = riverDist[i]
        for (const [dc, dr, w] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]]) {
          const cc = c + dc, rr = r + dr
          if (cc < 0 || rr < 0 || cc >= fcols || rr >= frows) continue
          const j = rr * fcols + cc, d = d0 + w * FINE_STEP
          if (d < riverDist[j] && d <= QD_BAND + FINE_STEP) { riverDist[j] = d; queue.push(j) }
        }
      }
    }
    const distAt = (x: number, z: number): number => riverDist[Math.min(frows - 1, Math.max(0, Math.round((z - fz0) / FINE_STEP))) * fcols + Math.min(fcols - 1, Math.max(0, Math.round((x - fx0) / FINE_STEP)))]
    const fineAt = (x: number, z: number): number => sampleGridF(fineGround, fcols, frows, fx0, fz0, FINE_STEP, x, z)
    const lidarAt = (x: number, z: number): number | null => {
      if (wetIndex(x, z) !== null) return null
      if (inHouse(x, z)) return null
      if (river !== null && nearHull(x, z)) return river - QD_UNDER
      const u = underDeck(x, z)
      if (!u) return sink(raw(x, z))
      const a = raw(x + u.ux * (u.r - u.d + 1), z + u.uz * (u.r - u.d + 1))
      const b = raw(x - u.ux * (u.r + u.d + 1), z - u.uz * (u.r + u.d + 1))
      if (a === null || b === null) return sink(a ?? b)
      // weighted by nearness, so the ground under the deck runs straight from one side to the other
      const wa = (u.r + u.d + 1) / (2 * u.r + 2)
      return sink(a * wa + b * (1 - wa))
    }
    /*
     * THE FAKE QUAY. Lower roads (Port …, Voie Georges Pompidou) carry a level: LQ_H over the river, rising at LQ_RAMP to the
     * street where a way joins one that is not a lower road (owner: "the lower quay rises up a hill and merges with the upper",
     * 48.862884, 2.300680). Between such a road's landward edge (+LQ_MARGIN) and the water the ground is that level; elsewhere
     * between a Quai street and the water it is held up to the street's level, a wall straight into the river.
     */
    type Seg = { ax: number; az: number; bx: number; bz: number; la: number; lb: number; hw: number }
    const segBuckets = (segs: Seg[]) => {
      const m = new Map<string, Seg[]>(), C = 50
      for (const g of segs) for (let cx = Math.floor((Math.min(g.ax, g.bx) - LQ_FIND) / C); cx <= Math.floor((Math.max(g.ax, g.bx) + LQ_FIND) / C); cx++)
        for (let cz = Math.floor((Math.min(g.az, g.bz) - LQ_FIND) / C); cz <= Math.floor((Math.max(g.az, g.bz) + LQ_FIND) / C); cz++) { const k = `${cx},${cz}`; (m.get(k) ?? m.set(k, []).get(k)!).push(g) }
      return (x: number, z: number) => {
        let best: { d: number; px: number; pz: number; l: number; hw: number } | null = null
        for (const g of m.get(`${Math.floor(x / C)},${Math.floor(z / C)}`) ?? []) {
          const dx = g.bx - g.ax, dz = g.bz - g.az, t = Math.max(0, Math.min(1, ((x - g.ax) * dx + (z - g.az) * dz) / (dx * dx + dz * dz || 1)))
          const px = g.ax + dx * t, pz = g.az + dz * t, d = Math.hypot(x - px, z - pz)
          if (d <= LQ_FIND && (!best || d < best.d)) best = { d, px, pz, l: g.la + (g.lb - g.la) * t, hw: g.hw }
        }
        return best
      }
    }
    const fineAt0 = (x: number, z: number): number => sampleGridF(fineGround, fcols, frows, fx0, fz0, FINE_STEP, x, z)
    const nodeKey = quayNodeKey
    /*
     * Which pieces are low: names can't say (upper and lower roads are both "Quai …"; Port de la Concorde is a road, then
     * footways under other names, then a road), so it is decided per SEGMENT, by the 4 m ground: any way, road or footway,
     * not a bridge or tunnel, within LQ_NEAR of the river whose segment's middle is under LQ_LOW_MAX over the water (or is
     * tagged layer < 0). The 4 m ground smears the shelf but its middle still reads metres under the street.
     */
    const shelfY = river === null ? 0 : river + LQ_H
    type RS = { a: { x: number; z: number }; b: { x: number; z: number }; hw: number; name?: string }
    const lowSegs: RS[] = [], cand: RS[] = [], otherNodes = new Set<string>()
    const nearRiver = (x: number, z: number): boolean => [[0, 0], [LQ_NEAR, 0], [-LQ_NEAR, 0], [0, LQ_NEAR], [0, -LQ_NEAR]].some(([dx, dz]) => inRiver(x + dx, z + dz))
    for (const e of kept) {
      if (e.tunnel) continue
      const p = unpackPoints(e.points), hw = e.width / 2 + (e.foot ? 0 : e.walk)
      for (let i = 1; i < p.length; i++) {
        const mx = (p[i - 1].x + p[i].x) / 2, mz = (p[i - 1].z + p[i].z) / 2
        const g0 = fineAt0(mx, mz)
        // …with a real drop beside it: ground LQ_DROP higher within LQ_DROP_R (not a low town by the river, Île Seguin, Issy)
        const drop = () => { let m = -Infinity; for (let k = 0; k < 8; k++) m = Math.max(m, fineAt0(mx + Math.cos(k * Math.PI / 4) * LQ_DROP_R, mz + Math.sin(k * Math.PI / 4) * LQ_DROP_R)); return m - g0 >= LQ_DROP }
        const low = !e.bridge && river !== null && nearRiver(mx, mz) && ((e.layer ?? 0) < 0 || g0 < river + LQ_LOW_MAX) && drop()
        if (low) cand.push({ a: p[i - 1], b: p[i], hw, name: e.name }); else { otherNodes.add(nodeKey(p[i - 1])); otherNodes.add(nodeKey(p[i])) }
      }
    }
    /*
     * …and only below an upper quay the region lists (owner: "enumerate all the lower quays"; island streets are within reach of
     * the water too and may or may not have one): the nearest named street within LQ_UPPER_R that is not itself low must be in
     * regions.json `lowerQuays`. Otherwise the piece stays as it was, a high street.
     */
    const lqNames = new Set(streetRegion.lowerQuays ?? [])
    const candSet = new Set(cand.map((g) => nodeKey(g.a) + '|' + nodeKey(g.b)))
    const uppers: { ax: number; az: number; bx: number; bz: number; name: string }[] = []
    for (const e of kept) {
      if (!e.name || e.foot || e.bridge || e.tunnel) continue
      const p = unpackPoints(e.points)
      for (let i = 1; i < p.length; i++) if (!candSet.has(nodeKey(p[i - 1]) + '|' + nodeKey(p[i]))) uppers.push({ ax: p[i - 1].x, az: p[i - 1].z, bx: p[i].x, bz: p[i].z, name: e.name })
    }
    const UB = new Map<string, typeof uppers>(), UC = 60
    for (const u of uppers) for (let cx = Math.floor((Math.min(u.ax, u.bx) - LQ_UPPER_R) / UC); cx <= Math.floor((Math.max(u.ax, u.bx) + LQ_UPPER_R) / UC); cx++)
      for (let cz = Math.floor((Math.min(u.az, u.bz) - LQ_UPPER_R) / UC); cz <= Math.floor((Math.max(u.az, u.bz) + LQ_UPPER_R) / UC); cz++) { const k = `${cx},${cz}`; (UB.get(k) ?? UB.set(k, []).get(k)!).push(u) }
    const upperName = (x: number, z: number): string | null => {
      let best = LQ_UPPER_R, name: string | null = null
      for (const u of UB.get(`${Math.floor(x / UC)},${Math.floor(z / UC)}`) ?? []) {
        const dx = u.bx - u.ax, dz = u.bz - u.az, t = Math.max(0, Math.min(1, ((x - u.ax) * dx + (z - u.az) * dz) / (dx * dx + dz * dz || 1)))
        const d = Math.hypot(x - u.ax - dx * t, z - u.az - dz * t)
        if (d < best) { best = d; name = u.name }
      }
      return name
    }
    for (const g of cand) {
      const n = upperName((g.a.x + g.b.x) / 2, (g.a.z + g.b.z) / 2)
      if (n && lqNames.has(n)) lowSegs.push(g); else { otherNodes.add(nodeKey(g.a)); otherNodes.add(nodeKey(g.b)) }
    }
    // Dijkstra along the low pieces from every node they share with a high one: the ramp's distance from its top
    const adj = new Map<string, { k: string; w: number }[]>(), pos = new Map<string, { x: number; z: number }>()
    for (const g of lowSegs) {
      const k = nodeKey(g.a), j = nodeKey(g.b), w = Math.hypot(g.b.x - g.a.x, g.b.z - g.a.z)
      pos.set(k, g.a); pos.set(j, g.b)
      ;(adj.get(k) ?? adj.set(k, []).get(k)!).push({ k: j, w }); (adj.get(j) ?? adj.set(j, []).get(j)!).push({ k, w })
    }
    const lvl = new Map<string, number>()
    const open: string[] = []
    for (const [k, q] of pos) if (otherNodes.has(k)) { lvl.set(k, Math.max(shelfY, fineAt0(q.x, q.z))); open.push(k) }
    while (open.length) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (lvl.get(open[i])! > lvl.get(open[bi])!) bi = i
      const k = open.splice(bi, 1)[0], l = lvl.get(k)!
      for (const { k: j, w } of adj.get(k) ?? []) { const nl = Math.max(shelfY, l - w * LQ_RAMP); if (nl > (lvl.get(j) ?? -Infinity)) { lvl.set(j, nl); open.push(j) } }
    }
    const L = (q: { x: number; z: number }) => lvl.get(nodeKey(q)) ?? shelfY
    const lowerAt = segBuckets(lowSegs.map((g) => ({ ax: g.a.x, az: g.a.z, bx: g.b.x, bz: g.b.z, la: L(g.a), lb: L(g.b), hw: g.hw })))
    const lowers = lowSegs
    for (const g of lowSegs) { lowKeys.add(nodeKey(g.a)); lowKeys.add(nodeKey(g.b)) }
    const segsOf = (es: typeof kept, level: (q: { x: number; z: number }) => number): Seg[] => es.flatMap((e) => {
      const p = unpackPoints(e.points), hw = e.width / 2 + (e.foot ? 0 : e.walk)
      return p.slice(1).map((b, i) => ({ ax: p[i].x, az: p[i].z, bx: b.x, bz: b.z, la: level(p[i]), lb: level(b), hw }))
    })
    const streetAt = segBuckets(segsOf(kept.filter((e) => e.name && /^(Quai |Cours |Avenue de New-York|Port )/.test(e.name) && !e.bridge && !e.tunnel && !e.foot && !(e.layer ?? 0)), (q) => fineAt0(q.x, q.z)))
    const rd = Float64Array.from(riverDist, (v) => (Number.isFinite(v) ? v : QD_BAND * 4))
    const wdist = (x: number, z: number): number => sampleGridF(rd, fcols, frows, fx0, fz0, FINE_STEP, x, z)
    const fakeAt = (x: number, z: number): number | null => {
      if (wetIndex(x, z) !== null || inHouse(x, z)) return null
      const dw = wdist(x, z)
      const lo = lowerAt(x, z)
      if (lo && dw <= wdist(lo.px, lo.pz) + lo.hw + LQ_MARGIN + LQ_UNDER_WALL) return lo.l
      const st = streetAt(x, z)
      if (st && dw < wdist(st.px, st.pz)) return Math.max(fineAt0(x, z), st.l)
      return null
    }
    /*
     * THE WALLS, as lines (owner, 2026-11-06: "the walls on lower quays look really bad (both sides)"). The 4 m ground can only
     * slope between two levels; the renderer (render/quays.ts) stands a vertical face on each of these lines and a paved cap on its
     * high side over the slope. Two kinds: the wall between a lower road's shelf and the street above it, LQ_MARGIN beyond the road's
     * landward edge (the shelf runs LQ_UNDER_WALL further, under the cap, so the ground in front of the face is flat); and the
     * river wall, along the water's outline wherever the land beside it stands QW_MIN_DROP over the river. Measured on the ground as
     * SHIPPED (`G`), so the cap covers exactly the slope the game will draw.
     */
    quayWallsOf = (G) => {
      const out: QuayWall[] = []
      let shelfEdges = 0
      const capOf = (x: number, z: number, nx: number, nz: number, top: number): number => {
        for (let o = 0.5; o <= QW_CAP_MAX; o += 0.5) if (G(x + nx * o, z + nz * o) >= top - QW_CAP_EPS) return o + 0.3
        return QW_CAP_MAX
      }
      // pieces are staged in runs (one ring, one road) and smoothed along them before they are kept: the spill and the top read
      // piece by piece jog the face in and out and step the cap (2026-11-06, the Quai des Tuileries from the water)
      type Cand = { ax: number; az: number; bx: number; bz: number; nx: number; nz: number; low: number; top: number; off: number; med: boolean }
      let run: Cand[] = []
      const flush = () => {
        for (let i = 0; i < run.length; i++) {
          const win = run.slice(Math.max(0, i - QW_SMOOTH), i + QW_SMOOTH + 1)
          // a river wall goes out as far as its neighbours' (clear of the slope); a shelf wall takes their median line (no jogs)
          const offs = win.map((c) => c.off).sort((a, b) => a - b)
          const c = run[i], { nx, nz } = c
          const off = c.med ? offs[offs.length >> 1] : offs[0]
          const tops = win.map((c) => c.top).sort((a, b) => a - b), top = tops[tops.length >> 1]
          const ax = c.ax + nx * off, az = c.az + nz * off, bx = c.bx + nx * off, bz = c.bz + nz * off
          const left = (bx - ax) * nz - (bz - az) * nx < 0
          const r = (v: number) => Math.round(v * 10) / 10
          out.push({ ax: r(left ? ax : bx), az: r(left ? az : bz), bx: r(left ? bx : ax), bz: r(left ? bz : az), top: r(top), low: r(c.low), cap: r(capOf((ax + bx) / 2, (az + bz) / 2, nx, nz, top)) })
        }
        run = []
      }
      const push = (ax: number, az: number, bx: number, bz: number, nx: number, nz: number, low: number, floor: number, o = 0, med = false) => {
        // the high side is (nx, nz); stored so that it is to the LEFT of a→b. (a→b is the base line; the wall stands `o` out from it)
        const mx = (ax + bx) / 2 + nx * o, mz = (az + bz) / 2 + nz * o
        // the top is the street's above it (its own heights, as ridden), else the ground QW_TOP_AT out
        // (only where the ground behind really rises: a street 25 m off does not make a wall in the middle of a lower quay)
        const rise = G(mx + nx * QW_TOP_AT, mz + nz * QW_TOP_AT)
        // (…but not over a lower level between: a lower quay's river edge took the street's top 14 m on, past the street's own wall,
        //  and its cap stood over the shelf at street height, a lid — owner, 2026-11-06, the Port de la Concorde, 48.863382, 2.321998)
        const st = streetTop(mx, mz, nx, nz), near = G(mx + nx * QW_NEAR_AT, mz + nz * QW_NEAR_AT)
        const top = st !== null && st - near > QW_STREET_GAP ? (shelfEdges++, near) : st ?? rise
        if (rise - low < QW_MIN_DROP || top - low < QW_MIN_DROP || inHouse(mx, mz)) { flush(); return }
        // the face goes out past the slope's foot: where the shipped ground is down to the floor (the water, the shelf), so no
        // ground stands proud in front of it — the 4 m posts put the slope across the river's outline, not behind it
        let spill = 0
        while (spill < QW_SPILL_MAX && G(mx - nx * spill, mz - nz * spill) > floor + QW_SPILL_EPS) spill += 0.25
        run.push({ ax, az, bx, bz, nx, nz, low, top, off: o - spill, med })
      }
      // the streets above: every named road or footway piece not on a shelf, not a bridge or a tunnel, with its heights
      const ST = new Map<string, { ax: number; az: number; bx: number; bz: number; ha: number; hb: number }[]>(), SC = 30
      const streetTop = (x: number, z: number, nx: number, nz: number): number | null => {
        let best = QW_TOP_FIND, y: number | null = null
        for (const q of ST.get(`${Math.floor(x / SC)},${Math.floor(z / SC)}`) ?? []) {
          const dx = q.bx - q.ax, dz = q.bz - q.az, t = Math.max(0, Math.min(1, ((x - q.ax) * dx + (z - q.az) * dz) / (dx * dx + dz * dz || 1)))
          const px = q.ax + dx * t - x, pz = q.az + dz * t - z, d = Math.hypot(px, pz)
          // on the high side, more or less square to the wall
          if (d < best && px * nx + pz * nz > d * 0.6) { best = d; y = q.ha + (q.hb - q.ha) * t }
        }
        return y
      }
      const onShelf = (x: number, z: number): boolean => {
        if (wetIndex(x, z) !== null) return false
        const lo = lowerAt(x, z)
        return !!lo && wdist(x, z) <= wdist(lo.px, lo.pz) + lo.hw + LQ_MARGIN + LQ_UNDER_WALL
      }
      for (const e of kept) {
        if (!e.name || e.bridge || e.tunnel || !e.heights?.length) continue
        const p = unpackPoints(e.points)
        if (e.heights.length !== p.length) continue
        for (let i = 1; i < p.length; i++) {
          const a = p[i - 1], b = p[i]
          if (onShelf((a.x + b.x) / 2, (a.z + b.z) / 2)) continue
          const q = { ax: a.x, az: a.z, bx: b.x, bz: b.z, ha: e.heights[i - 1], hb: e.heights[i] }
          for (let cx = Math.floor((Math.min(a.x, b.x) - QW_TOP_FIND) / SC); cx <= Math.floor((Math.max(a.x, b.x) + QW_TOP_FIND) / SC); cx++)
            for (let cz = Math.floor((Math.min(a.z, b.z) - QW_TOP_FIND) / SC); cz <= Math.floor((Math.max(a.z, b.z) + QW_TOP_FIND) / SC); cz++) {
              const k = `${cx},${cz}`
              ;(ST.get(k) ?? ST.set(k, []).get(k)!).push(q)
            }
        }
      }
      const made = new Map<string, { x: number; z: number }[]>()
      const seen = (x: number, z: number): boolean => {
        const k = `${Math.floor(x / 10)},${Math.floor(z / 10)}`
        for (let cx = -1; cx <= 1; cx++) for (let cz = -1; cz <= 1; cz++)
          for (const q of made.get(`${Math.floor(x / 10) + cx},${Math.floor(z / 10) + cz}`) ?? []) if (Math.hypot(q.x - x, q.z - z) < QW_DUP) return true
        ;(made.get(k) ?? made.set(k, []).get(k)!).push({ x, z })
        return false
      }
      // the shelf's walls
      for (const g of lowSegs) {
        const L0 = L(g.a), L1 = L(g.b), dx = g.b.x - g.a.x, dz = g.b.z - g.a.z, len = Math.hypot(dx, dz)
        if (len < 0.5) continue
        let nx = -dz / len, nz = dx / len
        const mx = (g.a.x + g.b.x) / 2, mz = (g.a.z + g.b.z) / 2, o0 = g.hw + LQ_MARGIN
        if (wdist(mx + nx * (o0 + 6), mz + nz * (o0 + 6)) < wdist(mx - nx * (o0 + 6), mz - nz * (o0 + 6))) { nx = -nx; nz = -nz }
        const n = Math.max(1, Math.round(len / QW_PIECE))
        for (let k = 0; k < n; k++) {
          const t0 = k / n, t1 = (k + 1) / n
          // out to where the shelf ENDS, whichever lower road's it is (a footway's shelf inside a road's has no wall of its own)
          const px = g.a.x + dx * (t0 + t1) / 2, pz = g.a.z + dz * (t0 + t1) / 2
          let o = o0
          while (o < QW_SEEK && onShelf(px + nx * (o + LQ_UNDER_WALL + 0.5), pz + nz * (o + LQ_UNDER_WALL + 0.5))) o += 0.5
          if (seen(px + nx * o, pz + nz * o)) { flush(); continue }
          push(g.a.x + dx * t0, g.a.z + dz * t0, g.a.x + dx * t1, g.a.z + dz * t1, nx, nz, L0 + (L1 - L0) * (t0 + t1) / 2, L0 + (L1 - L0) * (t0 + t1) / 2, o, true)
        }
      }
      flush()
      // the river's walls: every ring of the river, cut into pieces, the land side found by a probe
      if (river !== null) for (const w of riverBodies) for (const ring of [unpackPoints(w.ring), ...(w.holes ?? []).map(unpackPoints)]) {
        flush()
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i], b = ring[(i + 1) % ring.length], dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz)
          if (len < 0.5) continue
          const n = Math.max(1, Math.round(len / QW_PIECE))
          for (let k = 0; k < n; k++) {
            const t0 = k / n, t1 = (k + 1) / n, mx = a.x + dx * (t0 + t1) / 2, mz = a.z + dz * (t0 + t1) / 2
            if (!(distAt(mx, mz) <= QD_BAND)) { flush(); continue }
            let nx = -dz / len, nz = dx / len
            const wetL = inRiver(mx + nx * 2, mz + nz * 2), wetR = inRiver(mx - nx * 2, mz - nz * 2)
            if (wetL === wetR) { flush(); continue }
            if (wetL) { nx = -nx; nz = -nz }
            push(a.x + dx * t0, a.z + dz * t0, a.x + dx * t1, a.z + dz * t1, nx, nz, river - QD_UNDER, river)
          }
        }
      }
      flush()
      console.log(`  quay walls: ${shelfEdges} pieces topped at the shelf behind them, not the street beyond`)
      return out
    }
    let fakeLog = 0; if (QD_FAKE) console.log(`  lower roads: ${[...new Set(lowers.map((e) => e.name ?? '(unnamed)'))].join(', ')}`)
    quayDetail = { tiles, step: QD_STEP, at: (x, z) => {
      if (QD_FAKE) {
        const d = distAt(x, z)
        if (!(d <= QD_BAND)) return null
        const v = fakeAt(x, z)
        if (v !== null) fakeLog++
        return v
      }
      const d = distAt(x, z)
      if (!(d <= QD_BAND)) return null
      const v = lidarAt(x, z)
      if (v === null) return null
      const w = Math.min(1, (QD_BAND - d) / QD_FADE)
      return w >= 1 ? v : fineAt(x, z) + (v - fineAt(x, z)) * w
    } }
    console.log(`  quay detail (${QD_FAKE ? `fake, ${lowers.length} low segments` : 'lidar'}): ${tiles.size} tiles ship the ground at ${QD_STEP} m (${surveyed} survey-tile reads at ${QD_PX} px)`)
  }
  /*
   * THE BRIDGE ENDS ARE LAID, NOT MEASURED (owner, 2026-11-06: "maybe we totally ignore the measured terrain near bridges and just
   * make a fake gentle slope to the water. then the bridge renderer can build on top of that"). Round every road bridge's end on land
   * near the water, out to BE_R and blended into the survey over BE_FADE more, the ground is the end's street level — the upper
   * quartile of the survey in a ring just outside — falling at BE_SLOPE to BE_ABOVE over the river at its edge. The streets round the
   * end level from it, the deck lands on it, and the lower quays (above, the quay detail) still cut their shelf through it.
   */
  if (spec.region === 'paris' && streetRegion.riverLevel !== undefined && process.env.BRIDGE_ENDS !== '0') {
    const riverY = streetRegion.riverLevel - datumRaw
    const BE_R = 50, BE_FADE = 25, BE_SLOPE = Number(process.env.BE_SLOPE ?? 1), BE_ABOVE = 0.6, BE_NEAR_WATER = 80, BE_SEEK = 60
    const gAt = (x: number, z: number): number => sampleGridF(fineGround, fcols, frows, fx0, fz0, FINE_STEP, x, z)
    const wetAt = (x: number, z: number): boolean => wetIndex(x, z) !== null
    const roadAt = new Set<number>()
    for (const e of kept) if (!e.bridge && !e.foot && !e.tunnel) { roadAt.add(e.a); roadAt.add(e.b) }
    const ends: { x: number; z: number }[] = []
    for (const e of kept) {
      if (!e.bridge || e.foot || e.tunnel) continue
      const p = e.points
      for (const [n, x, z] of [[e.a, p[0], p[1]], [e.b, p[p.length - 2], p[p.length - 1]]] as const) {
        if (!roadAt.has(n) || wetAt(x, z) || ends.some((q) => Math.hypot(q.x - x, q.z - z) < 20)) continue
        let near = false
        for (let k = 0; k < 16 && !near; k++) for (let r = 10; r <= BE_NEAR_WATER && !near; r += 10) near = wetAt(x + Math.cos(k * Math.PI / 8) * r, z + Math.sin(k * Math.PI / 8) * r)
        if (near) ends.push({ x, z })
      }
    }
    let posts = 0
    for (const c of ends) {
      const ring: number[] = []
      for (let k = 0; k < 24; k++) for (const r of [BE_R, BE_R + 10, BE_R + 20, BE_R + 30]) {
        const x = c.x + Math.cos(k * Math.PI / 12) * r, z = c.z + Math.sin(k * Math.PI / 12) * r
        if (!wetAt(x, z)) ring.push(gAt(x, z))
      }
      if (ring.length < 12) continue
      ring.sort((a, b) => a - b)
      const level = ring[Math.floor(ring.length * 0.75)]
      const R = BE_R + BE_FADE
      const c0 = Math.max(0, Math.floor((c.x - R - fx0) / FINE_STEP)), c1 = Math.min(fcols - 1, Math.ceil((c.x + R - fx0) / FINE_STEP))
      const r0 = Math.max(0, Math.floor((c.z - R - fz0) / FINE_STEP)), r1 = Math.min(frows - 1, Math.ceil((c.z + R - fz0) / FINE_STEP))
      for (let rr = r0; rr <= r1; rr++) for (let cc = c0; cc <= c1; cc++) {
        const x = fx0 + cc * FINE_STEP, z = fz0 + rr * FINE_STEP, d = Math.hypot(x - c.x, z - c.z)
        if (d > R || wetAt(x, z)) continue
        let dw = BE_SEEK
        for (let k = 0; k < 16; k++) for (let r = 2; r < dw; r += 2) if (wetAt(x + Math.cos(k * Math.PI / 8) * r, z + Math.sin(k * Math.PI / 8) * r)) { dw = r; break }
        const laid = Math.min(level, riverY + BE_ABOVE + dw * BE_SLOPE)
        const w = Math.min(1, (R - d) / BE_FADE), i = rr * fcols + cc
        fineGround[i] = fineGround[i] + (laid - fineGround[i]) * w
        posts++
      }
      for (const [dx, dz] of [[0, 0], [R, 0], [-R, 0], [0, R], [0, -R]]) {
        const k = `${Math.floor((c.x + dx) / TILE)},${Math.floor((c.z + dz) / TILE)}`
        if (blockTiles.some(([tx, tz]) => `${tx},${tz}` === k)) fineTiles.add(k)
      }
    }
    console.log(`  bridge ends laid: ${ends.length} road bridge ends by the water, ${posts} fine posts set to their street level and a ${BE_SLOPE * 100}% bank`)
  }
  let shipped = new GroundModel({
    coarse: { x0: tx0, z0: tz0, step: STEP, cols, rows, h: ground },
    fine: { x0: fx0, z0: fz0, step: FINE_STEP, cols: fcols, rows: frows, h: fineGround },
    fineTiles, tiles: blockTiles, fineStep: FINE_STEP, tile: TILE, detail: quayDetail,
  })
  for (const [k, b] of shipped.blocks) {
    if (shipped.fineTiles.has(k)) { b.src = terrainFine.src; b.resM = terrainFine.resM } else { b.src = terrain.src; b.resM = terrain.resM }
  }
  console.log(`  terrain model: ${zones.length} zone(s); ${fineTiles.size} of ${blockTiles.length} tiles ship fine ground `
    + `(${FINE_STEP} m), the rest coarse (${STEP} m)`)
  const groundFine = (x: number, z: number): number => shipped.heightAt(x, z)
  // a funicular climbs the ground it is laid on: its heights from the same grid the streets take theirs from
  // (a straight incline, from station to station: 108 m of the same grade, where the butte's own ground has a stair of retaining walls in it, 7 m up and down: rail-audit.ts, 2026-10-31)
  for (const r of rails) if (r.funicular) { if (spec.region === 'paris') straightDeck(r, groundFine); else r.heights = unpackPoints(r.points).map((q) => Math.round(groundFine(q.x, q.z) * 100) / 100) }

  /*
   * Street heights come from the SAME grid, not from the tiles directly. Two samplings of one noisy
   * source disagree by exactly the amount of noise; one sampling cannot disagree with itself, so the rider
   * and the ground they ride on now agree by construction.
   */
  /*
   * Every street gets a point at least every 8 m first. A street's height is read between its points in a
   * straight line; on Nob Hill a block is one 100 m segment, and the chord across a convex hill runs metres
   * under the ground — the rider rode inside the hill, and the road markings, which follow the ground, were
   * drawn on top of them.
   */
  /*
   * TUNNEL MOUTHS (the Stockton Tunnel, 2026-09-29): nodes where a way goes underground. A street running into one
   * is in a CUT — the one place "a fill, never a cut" below is wrong: levelled to the highest ground across its
   * corridor, lower Stockton climbed the side of its own cutting to 2.6 m under Bush Street, which crosses over the
   * mouth. So a street's last 30 m to a mouth follow the ground along its centre line, easing into the level
   * street beyond; and a tunnel's own heights (the hill above it) never raise the node where it meets the street.
   */
  const underground = (e: PackedEdge): boolean => !!e.tunnel || (e.layer ?? 0) < 0
  const mouthNodes = new Set<number>()
  {
    const kinds = new Map<number, number>()
    for (const e of kept) for (const n of [e.a, e.b]) kinds.set(n, (kinds.get(n) ?? 0) | (underground(e) ? 1 : 2))
    for (const [n, k] of kinds) if (k === 3) mouthNodes.add(n)
  }
  const CUT = 30
  for (const e of kept) {
    const src = unpackPoints(e.points)
    const dense: { x: number; z: number }[] = [src[0]]
    for (let i = 1; i < src.length; i++) {
      const L = Math.hypot(src[i].x - src[i - 1].x, src[i].z - src[i - 1].z)
      const n = Math.max(1, Math.ceil(L / 8))
      for (let k = 1; k <= n; k++) {
        dense.push({ x: src[i - 1].x + ((src[i].x - src[i - 1].x) * k) / n, z: src[i - 1].z + ((src[i].z - src[i - 1].z) * k) / n })
      }
    }
    e.points = packPoints(dense)
    const pts = unpackPoints(e.points)
    /*
     * LEVEL across its width (BUGS.md #38): a street is flat from kerb to kerb, however the hillside falls
     * across it — the elevation data never has the cut or the fill a real road sits on, and draped, every
     * street along a slope was tipped towards the downhill side (the quais above the Seine, all of San
     * Francisco). Its height at each point is the HIGHEST ground across its corridor, pavements included:
     * a fill, never a cut, so the road stands at or above the ground on both sides and nothing the terrain
     * hides (the ground occluder, just under the raw surface) can hide it. The renderer draws the downhill side's
     * retaining wall (render/city.ts `retainingWalls`).
     */
    const half = e.foot ? e.width / 2 : e.width / 2 + Math.max(e.walk, 0.6)
    /*
     * From the FINE grid where it reaches, because the ground the street is drawn on is now the fine grid:
     * a street levelled from the 20 m grid would sit up to a metre off the ground beside it, and the whole
     * point of the corridor maximum is that the road is a FILL and never a cut.
     */
    const centre = pts.map((p) => groundFine(p.x, p.z))
    const inApproach = (x: number, z: number): boolean => {
      if (!structMask) return false
      const c = Math.round((x - fx0) / FINE_STEP), r = Math.round((z - fz0) / FINE_STEP)
      return c >= 0 && r >= 0 && c < fcols && r < frows && structMask[r * fcols + c] === STRUCT_MOUTH_CLASS
    }
    const raw = pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)]
      const b = pts[Math.min(pts.length - 1, i + 1)]
      const l = Math.hypot(b.x - a.x, b.z - a.z) || 1
      const nx = -(b.z - a.z) / l
      const nz = (b.x - a.x) / l
      let h = centre[i]
      // (into a tunnel's mouth: its centre line — the corridor's highest is the trench's side and the ground over the tunnel, 2026-11-06)
      if (inApproach(p.x, p.z)) return h
      for (const o of [-half, -half / 2, half / 2, half]) h = Math.max(h, groundFine(p.x + nx * o, p.z + nz * o))
      return h
    })
    /*
     * ---- and then SMOOTHED along its length (BUGS.md #206d).
     *
     * The corridor statistic is a MAXIMUM, and a maximum can only rise as the sampling gets finer — by a
     * different amount at each point, because what it seizes on (a kerb, a tree mound, a berm, the lip of a
     * path) is in a different place at each point. At 20 m that noise was averaged away by the source; at
     * 4 m from lidar-derived 3DEP it is real and it is sharp, and it would put a ripple into a street that
     * is smooth today. California Street downhill at speed is how this game is judged.
     *
     * A [1,2,1] pass over points that are at most 8 m apart is a ~16 m window — shorter than anything a
     * rider reads as a gradient (the ride model's own window is 20 m either side) and long enough to take
     * out point-to-point chatter. Then the maximum against the CENTRELINE is restored, so smoothing can
     * never turn the fill into a cut: the road still stands at or above the real ground under itself, and
     * the downhill side gets its retaining wall as before.
     */
    const smooth = raw.map((v, i) => {
      const a = raw[Math.max(0, i - 1)]
      const b = raw[Math.min(raw.length - 1, i + 1)]
      return Math.max((a + 2 * v + b) / 4, centre[i])
    })
    // into a tunnel mouth: the centre line's ground at the mouth, easing to the levelled street 30 m out
    if (!underground(e) && (mouthNodes.has(e.a) || mouthNodes.has(e.b))) {
      const cum = [0]
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z))
      const L = cum[cum.length - 1]
      for (let i = 0; i < pts.length; i++) {
        const d = Math.min(mouthNodes.has(e.a) ? cum[i] : Infinity, mouthNodes.has(e.b) ? L - cum[i] : Infinity)
        if (d < CUT) smooth[i] = centre[i] + (smooth[i] - centre[i]) * (d / CUT)
      }
    }
    e.heights = smooth
  }
  // (TRACE=x,z: every way within 4 m of that point, its heights, after each stage of the levelling — for chasing a step)
  const trace = (stage: string): void => {
    if (!process.env.TRACE) return
    const [tx, tz] = process.env.TRACE.split(',').map(Number)
    for (const e of kept) {
      if (!e.heights) continue
      let near = Infinity
      for (let i = 0; i < e.points.length; i += 2) near = Math.min(near, Math.hypot(e.points[i] - tx, e.points[i + 1] - tz))
      if (near < 4) console.log(`  TRACE ${stage}: ${e.id} ${e.name ?? e.kind}${e.foot ? ' F' : ''}${e.bridge ? ' B' : ''}${e.ramp ? ' R' : ''} [${e.heights.map((h) => h.toFixed(1)).join(' ')}]`)
    }
    // the fine ground there, a row of posts across x (−12…+12 m)
    const c = Math.round((tx - fx0) / FINE_STEP), r = Math.round((tz - fz0) / FINE_STEP)
    console.log(`  TRACE ${stage}: ground ${[-3, -2, -1, 0, 1, 2, 3].map((k) => fineGround[r * fcols + c + k]?.toFixed(1)).join(' ')}`)
  }
  trace('levelled')
  // …and one height where streets meet: every end at a node takes the highest of them, eased in over 12 m, so
  // the level streets join without a step (the rider's profile and the drawn surface both)
  {
    const nodeH = new Map<number, number>()
    for (const e of kept) {
      // (a tunnel's heights are the hill over it: they must not lift the street at its mouth)
      if (underground(e)) continue
      const h = e.heights!
      nodeH.set(e.a, Math.max(nodeH.get(e.a) ?? -Infinity, h[0]))
      nodeH.set(e.b, Math.max(nodeH.get(e.b) ?? -Infinity, h[h.length - 1]))
    }
    /*
     * Eased along CHAINS, not single pieces (owner, 2026-10-16, Sacramento at Stockton: "definitely do the sacramento ramp
     * issue too"). A street is split into pieces wherever anything joins it, and the ease was at most half a PIECE: a short
     * last piece into a junction took a 1.9 m step in 8 m (24 %), a crest that hid the cars below it. Now consecutive
     * pieces meeting end to end (a node with two street ends) are one run; at each run end the junction's level is HELD
     * out to the crossing carriageways' edge (the flat surface the renderer draws there), then eased into the street's own
     * line over a length that grows with the step — at most about 8 % on top of the street's grade — up to half the run.
     */
    const done = new Set<PackedEdge>()
    const streetEnds = new Map<number, PackedEdge[]>()
    for (const e of kept) {
      if (underground(e) || e.foot) continue
      for (const n of [e.a, e.b]) (streetEnds.get(n) ?? streetEnds.set(n, []).get(n)!).push(e)
    }
    /*
     * ONE LEVEL PER INTERSECTION (BUGS.md #316, owner 2026-10-17, Powell at California: "submerged car"). A boulevard
     * crossing — twin carriageways meeting twin carriageways — is four nodes joined by short connector pieces, and each
     * node took its own level: across California at Powell they parted by 1.1 m, the higher crossing's flat surface over
     * the lower street, and the cars on it sunk to the windows. Nodes joined by a connector — a street piece under 22 m
     * between two junctions of three or more street ends, rising at most 2 m (a short steep BLOCK is never flattened) —
     * are one intersection: they take the highest of their levels, and the connectors are laid flat at it (below).
     */
    const flatConnectors = new Set<PackedEdge>()
    {
      const parent = new Map<number, number>()
      const find = (n: number): number => { let r = n; while (parent.has(r) && parent.get(r) !== r) r = parent.get(r)!; return r }
      for (const e of kept) {
        if (underground(e) || e.foot || !e.heights) continue
        if ((streetEnds.get(e.a)?.length ?? 0) < 3 || (streetEnds.get(e.b)?.length ?? 0) < 3) continue
        const pts = unpackPoints(e.points)
        let L = 0
        for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
        if (L >= 22 || Math.abs((nodeH.get(e.a) ?? 0) - (nodeH.get(e.b) ?? 0)) > 2) continue
        flatConnectors.add(e)
        const ra = find(e.a), rb = find(e.b)
        if (!parent.has(ra)) parent.set(ra, ra)
        if (ra !== rb) parent.set(rb, ra)
      }
      const level = new Map<number, number>()
      for (const n of parent.keys()) { const r = find(n); level.set(r, Math.max(level.get(r) ?? -Infinity, nodeH.get(n) ?? -Infinity)) }
      let raised = 0
      for (const n of parent.keys()) { const h = level.get(find(n))!; if (h > (nodeH.get(n) ?? h) + 0.05) raised++; nodeH.set(n, h) }
      for (const e of flatConnectors) { const h = nodeH.get(e.a)!; e.heights = e.heights!.map(() => h); done.add(e) }
      console.log(`  ${flatConnectors.size} intersection connectors laid flat, ${raised} junction nodes raised to their intersection's level`)
    }
    const holdAt = (n: number, self: PackedEdge): number => {
      let w = 0
      for (const o of streetEnds.get(n) ?? []) if (o !== self) w = Math.max(w, o.width / 2)
      return w
    }
    let footReady = false
    const easeRun = (run: { e: PackedEdge; rev: boolean }[]): void => {
      // every point of the run in order; a node shared by two pieces is one point carrying both pieces' indices
      const seq: { x: number; z: number; h: number; refs: { e: PackedEdge; i: number }[] }[] = []
      run.forEach(({ e, rev }, k) => {
        const pts = unpackPoints(e.points), h = e.heights!
        for (let j = 0; j < pts.length; j++) {
          const i = rev ? pts.length - 1 - j : j
          if (k > 0 && j === 0) { seq[seq.length - 1].refs.push({ e, i }); continue }
          seq.push({ x: pts[i].x, z: pts[i].z, h: h[i], refs: [{ e, i }] })
        }
      })
      const C = [0]
      for (let i = 1; i < seq.length; i++) C.push(C[i - 1] + Math.hypot(seq[i].x - seq[i - 1].x, seq[i].z - seq[i - 1].z))
      const L = C[C.length - 1]
      const H = seq.map((q) => q.h)
      const first = run[0], last = run[run.length - 1]
      const na = first.rev ? first.e.b : first.e.a, nb = last.rev ? last.e.a : last.e.b
      const ha = nodeH.get(na) ?? H[0], hb = nodeH.get(nb) ?? H[H.length - 1]
      const lineAt = (d: number): number => {
        let k = 0
        while (k < C.length - 2 && C[k + 1] < d) k++
        const t = C[k + 1] > C[k] ? Math.max(0, Math.min(1, (d - C[k]) / (C[k + 1] - C[k]))) : 0
        return H[k] + (H[k + 1] - H[k]) * t
      }
      const holdA = Math.min(L / 4, holdAt(na, first.e)), holdB = Math.min(L / 4, holdAt(nb, last.e))
      const span = (step: number): number => Math.max(0.01, Math.min(L / 2, Math.max(12, Math.abs(step) / 0.08)))
      /*
       * The step is the junction's level against the street's own at the END OF THE HOLD, and it is eased out as an
       * OFFSET on the street's own line — so the street keeps its grade and gains at most ~8 % on top of it (BUGS.md #317,
       * owner 2026-10-17, Powell between Pine and Bush: "road in the air"). It was measured 12 m further down the street,
       * which on a 25 % hill is 3 m of the street's own fall, and the ease then blended the street toward the junction's
       * flat level over 30 m: Powell's east carriageway (the one an alley joins) stood 2.6 m over its twin, a shelf with
       * the traffic on it.
       */
      const stepA = ha - lineAt(Math.min(L, holdA)), stepB = hb - lineAt(Math.max(0, L - holdB))
      const EA = span(stepA), EB = span(stepB)
      seq.forEach((q, i) => {
        let o = H[i]
        const da = C[i], db = L - C[i]
        if (da <= holdA) o = ha
        else if (da < holdA + EA) o = H[i] + stepA * (1 - (da - holdA) / EA)
        if (db <= holdB) o = hb
        else if (db < holdB + EB) o = o + stepB * (1 - (db - holdB) / EB)
        o = Math.round(o * 100) / 100
        for (const r of q.refs) r.e.heights![r.i] = o
      })
    }
    // the streets first; then the foot ways, against the levels the streets ended with (a crosswalk node on a street
    // eased into its junction took the street's OLD height and was left 1.9 m under the new one, Sacramento at Stockton)
    for (const e of [...kept.filter((k) => !k.foot), ...kept.filter((k) => k.foot)]) {
      if (done.has(e) || underground(e)) continue
      if (e.foot && !footReady) {
        footReady = true
        const streetH = new Map<number, number>()
        for (const s of done) {
          const h = s.heights!
          streetH.set(s.a, Math.max(streetH.get(s.a) ?? -Infinity, h[0]))
          streetH.set(s.b, Math.max(streetH.get(s.b) ?? -Infinity, h[h.length - 1]))
        }
        for (const [n, h] of streetH) nodeH.set(n, h)
      }
      if (e.foot) {
        // (a foot way: one piece, the old ease)
        const pts = unpackPoints(e.points), h = e.heights!, cum = [0]
        for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z))
        const L = cum[cum.length - 1], ha = nodeH.get(e.a) ?? h[0], hb = nodeH.get(e.b) ?? h[h.length - 1], EASE = Math.min(12, L / 2)
        e.heights = h.map((v, i) => { let out = v; if (cum[i] < EASE) out = ha + (v - ha) * (cum[i] / EASE); if (L - cum[i] < EASE) out = hb + (out - hb) * ((L - cum[i]) / EASE); return Math.round(out * 100) / 100 })
        done.add(e); continue
      }
      // walk back to the run's start (a node that is not a plain two-piece joint), then forward along it
      const through = (n: number): boolean => (streetEnds.get(n)?.length ?? 0) === 2
      let cur = e, from = e.a, guard = 0
      while (through(from) && guard++ < 500) {
        // (none: both ends at this node are the same piece, a way closing on itself — a loop, Paris 2026-10-29)
        const o = streetEnds.get(from)!.find((x) => x !== cur)
        if (!o || o === e) break
        from = o.a === from ? o.b : o.a
        cur = o
      }
      // `cur` is the first piece, `from` its outer end; walk forward
      const run: { e: PackedEdge; rev: boolean }[] = []
      let node = from, piece: PackedEdge | undefined = cur
      guard = 0
      while (piece && !done.has(piece) && guard++ < 500) {
        const rev = piece.b === node
        run.push({ e: piece, rev })
        done.add(piece)
        node = rev ? piece.a : piece.b
        piece = through(node) ? streetEnds.get(node)!.find((x) => x !== piece) : undefined
      }
      if (run.length) easeRun(run)
    }
  }


  /*
   * ---- bridges: their own heights, and ramps onto them (tools/bridges.ts). Before anything reads the
   * heights — the ride graph's grade, the renderer's decks.
   */
  const groundAt = (x: number, z: number): number => sampleGrid(ground, cols, rows, tx0, tz0, STEP, x, z)
  // the water's own surface, as the renderer draws it: one level per river, its lowest bank less the region's
  // drop (city/package.ts waterLevels). Taken at bank level, every bridge over the Seine — and the Pont
  // Morland over the Arsenal's mouth — was lifted the full clearance above its own quays (BUGS.md #31, #37)
  const wetAreas = areas.filter((a) => a.kind === 'water')
  // (a river of real size, where the region knows its level: the channels and the basins that touch it take it from there. A RIVER: until Batch 4, 2026-10-31, every water over 8000 m² took the Seine's
  //  surface, so the Bois's lakes, Daumesnil, the Buttes-Chaumont and Montsouris all lay at −6 m in pits of pale bank, Lac Inférieur's a cream strip 40 m wide. They keep their own lowest bank)
  if (streetRegion.riverLevel !== undefined) {
    for (const a of wetAreas) if (a.river && Math.abs(area(unpackPoints(a.ring))) >= 8000) a.level = Math.round((streetRegion.riverLevel - datumRaw) * 100) / 100
  }
  const wetLevels = waterLevels(wetAreas, groundAt, streetRegion.riverDrop ?? 0, seaLevel)
  const waterBodies = wetAreas.map((a, k) => ({ ring: unpackPoints(a.ring), level: wetLevels[k] }))
  /*
   * Where the SEA ends up, against where #58 put the sea bed (the "sea bed flattened" line above) and against
   * true mean sea level, which in this datum frame is −datumRaw. All three should agree within a metre or two.
   * If the sea comes out tens of metres low, a ring vertex on the BOX EDGE is sampling unflattened bathymetry
   * — the terrain grid extends past the box, and `inRing` on a vertex exactly on the edge is ambiguous — and
   * the union-find's minimum then sinks the whole bay. This line is how we find that out from a bake log
   * instead of from a render, which cannot tell "water too low" from "water missing" (BUGS.md #161).
   */
  {
    const seas = wetAreas.map((a, k) => [a, wetLevels[k]] as const).filter(([a]) => a.sea)
    if (seas.length > 0) {
      console.log(`  sea level: ${seas.map(([, lv]) => lv.toFixed(1)).join(', ')} m`
        + ` (true MSL in this frame is ${(-datumRaw).toFixed(1)} m)`)
    }
  }
  // (not the region's authored ways: their heights are their own, and nothing is ramped up to them)
  // the region's street paint and brick squares (tools/street-paint.ts: Market Street, owner 2026-10-04)
  const painted = applyStreetPaint(kept, (streetRegion.streetPaint ?? []).map((r) => ({ street: r.street, paint: r.paint,
    from: proj.toLocal({ lat: r.from[0], lon: r.from[1] }), to: proj.toLocal({ lat: r.to[0], lon: r.to[1] }) })))
  const bricked = markBrickSquares(areas, kept, streetRegion.brickStreets?.names ?? [])
  if (painted.length || bricked) console.log(`  street paint: ${painted.join(' / ')} edges; ${bricked} squares laid in brick`)
  // the parks a zone says are planted BEDS (`ground: 'beds'`: the Presidio Tunnel Tops) — mulch and low shrubs, the
  // lawns mapped inside them the only grass (PackedArea `beds`)
  {
    /*
     * A mapped lawn a zone says is not one (`ground: 'scrub'`): Francisco Park's steep upper slope is grass in OSM and
     * native scrub on the ground (owner's Street View photographs, 2026-10-21) — it becomes park, and so the beds round it.
     */
    const scrubZones = zones.filter((zn) => zn.props.ground === 'scrub' || zn.props.ground === 'garden')
    for (const a of areas) {
      if (a.kind !== 'grass' || !scrubZones.length) continue
      const c = centroid(unpackPoints(a.ring))
      if (scrubZones.some((zn) => c.x >= zn.bbox[0] && c.x <= zn.bbox[2] && c.z >= zn.bbox[1] && c.z <= zn.bbox[3] && inRing(zn.ring, c.x, c.z))) a.kind = 'park'
    }
    const bedZones = zones.filter((zn) => zn.props.ground === 'beds' || zn.props.ground === 'garden')
    let n = 0
    if (bedZones.length) for (const a of areas) {
      if (a.kind !== 'park') continue
      const r = unpackPoints(a.ring)
      const c = centroid(r)
      const zn = bedZones.find((q) => c.x >= q.bbox[0] && c.x <= q.bbox[2] && c.z >= q.bbox[1] && c.z <= q.bbox[3] && inRing(q.ring, c.x, c.z))
      if (zn) { a.beds = true; if (zn.props.ground === 'garden') a.moss = true; n++ }
    }
    if (bedZones.length) console.log(`  ${n} parks laid out as planted beds`)
    /*
     * …and a LAWN a zone lays down where OSM maps none (`ground: 'grass'`): the one grass in a park of beds is what OSM
     * says is grass, and at Francisco Park that is the steep upper slope while the mown lawn — the dog run along Bay
     * Street — is not mapped at all (owner, 2026-10-21: "the front is a grass dog park").
     */
    const lawnZones = zones.filter((zn) => zn.props.ground === 'grass')
    for (const zn of lawnZones) {
      const pts: { x: number; z: number }[] = []
      for (let i = 0; i < zn.ring.length; i += 2) pts.push({ x: zn.ring[i], z: zn.ring[i + 1] })
      areas.push({ kind: 'grass', ring: packPoints(ccw(pts)) })
    }
    if (lawnZones.length) console.log(`  ${lawnZones.length} lawn(s) laid by zone`)
  }
  // (the Boulevard Circulaire: a narrow lane between two wide pavements, on a viaduct with no pedestrians, read as a promenade)
  for (const v of streetRegion.bareViaducts ?? []) {
    const c = proj.toLocal({ lat: v.lat, lon: v.lon })
    for (const e of kept) {
      if (!e.bridge || e.foot || !/^(primary|secondary|trunk|tertiary)(_link)?$/.test(e.kind ?? '') || Math.hypot(e.points[0] - c.x, e.points[1] - c.z) > v.radius) continue
      e.walk = 0.6
      e.width = Math.max(e.width, 7)
    }
  }
  if (spec.region === 'paris') {
    const merged = mergeBridgeLanes(kept)
    if (merged.lanes) {
      kept.length = 0
      for (const e of merged.edges) kept.push(e)
      console.log(`  bridges: ${merged.lanes} cycle lanes merged into their roadways, ${merged.stubs} stubs of lane gone`)
    }
  }
  const layerCaps = (streetRegion.footBridgeLayers ?? []).map((c) => ({ ...proj.toLocal({ lat: c.lat, lon: c.lon }), radius: c.radius, layer: c.layer }))
  // (each way's heights before any bridge lifts them: a bridge found later to be at grade over a cut goes back to them)
  /*
   * A bridgehead's junction at ONE level (owner, 2026-11-05, the Pont de Saint-Cloud: "a spaghetti of roads in the air"). The ground
   * model smears the river's bank into a slope, so the street-level roads round a bridge end sat anywhere from the street's level
   * to 5 m under it, and the ramps up to the deck, laid from those heights, left the junction's ways at as many heights as it has
   * ways. Each surface road point near a road bridge's end comes up to the junction's own level: the upper quartile of the road
   * heights there — the streets that are on the street. Only ever up, and only by a step a bank's smear makes.
   */
  /*
   * …made a PLATE (owner, 2026-11-06: "the bridge head is of course flat on both sides, at street level, and all the roads in the
   * intersection are at the same level"). Road bridge ends within PLATE_MERGE of each other are one junction; every way at grade
   * joined to it — roads, footways, crossings, the bridge's own sidewalks where they land — takes ONE level, the upper quartile of
   * its roads, out to JUNCTION_R and eased back over JUNCTION_EASE; the bridges' ends that land on it take it too, so the decks
   * (bridgeHeights) start from the street and not from the bank's lidar. The lower quays and the ways that join them (their
   * ramps) and steps keep their own heights: the rider chooses the ramp up or the quay under.
   */
  // (the plates' ways and their bridge ends, for the deck clearance after bridgeHeights)
  const plateWays = new Set<PackedEdge>(), plateEnds: { x: number; z: number }[] = []
  if (spec.region === 'paris' && process.env.PLATES !== '0') {
    const isRoad = (e: PackedEdge): boolean => !e.foot && /^(primary|secondary|trunk|tertiary|unclassified|residential|living_street)(_link)?$/.test(e.kind ?? '')
    const levelRoad = (e: PackedEdge): boolean => isRoad(e) && !PLATE_FREEWAY.test(e.kind ?? '')
    const lowNames = new Set(streetRegion.lowerQuays ?? [])
    const lowNodes = new Set<number>()
    const isLow = (e: PackedEdge): boolean => { const p = unpackPoints(e.points); for (let i = 1; i < p.length; i++) if (lowKeys.has(quayNodeKey(p[i - 1])) && lowKeys.has(quayNodeKey(p[i]))) return true; return false }
    // (regions.json lowerQuays names the UPPER quay streets that have a lower quay under them, not the lower quays: excluding them by
    //  name left Quai de Bercy, Quai d'Orsay… out of their bridgeheads' plates. PLATE_LOW_NAMES=1 brings the old exclusion back)
    for (const e of kept) if ((process.env.PLATE_LOW_NAMES === '1' && lowNames.has(e.name ?? '')) || isLow(e)) { lowNodes.add(e.a); lowNodes.add(e.b) }
    const flat = (e: PackedEdge): boolean => !e.bridge && !e.tunnel && (e.layer ?? 0) === 0 && !!e.heights && e.kind !== 'steps' && e.kind !== 'elevator'
      && !lowNodes.has(e.a) && !lowNodes.has(e.b)
    const plates: { x: number; z: number; n: number; ends: { x: number; z: number; n: number; h?: number }[] }[] = []
    for (const e of kept) {
      if (!e.bridge || e.tunnel || !levelRoad(e)) continue
      const p = e.points
      for (const c of [{ x: p[0], z: p[1], n: e.a, h: e.heights?.[0] }, { x: p[p.length - 2], z: p[p.length - 1], n: e.b, h: e.heights?.[e.heights.length - 1] }]) {
        if (bandAt(c.x, c.z)) continue // (the Seine band: no bridgehead plates)
        const q = plates.find((t) => Math.hypot(t.x - c.x, t.z - c.z) < PLATE_MERGE)
        if (q) { q.ends.push(c); q.x = q.ends.reduce((s, t) => s + t.x, 0) / q.ends.length; q.z = q.ends.reduce((s, t) => s + t.z, 0) / q.ends.length }
        else plates.push({ ...c, ends: [c] })
      }
    }
    // (a way into an UNDERPASS mouth near a plate runs at the level under the junction, not on it: Quai de Bercy dives under Pont
    //  National's right bridgehead in three 40 m layer -1 tunnels, the IGN ground there 32.0 m against Bd Poniatowski's 38.4 —
    //  plated, its mouths and the "short underpass ridden in the open" stood at the junction's 5.6 and the quay fell 6 m in 30 m)
    const mouthNodes = new Set<number>()
    if (PLATE_MOUTH_R > 0) for (const e of kept) if (e.tunnel || (e.layer ?? 0) < 0) for (const n of [e.a, e.b]) {
      const p = e.points, q = n === e.a ? { x: p[0], z: p[1] } : { x: p[p.length - 2], z: p[p.length - 1] }
      if (plates.some((c) => Math.hypot(q.x - c.x, q.z - c.z) < PLATE_MOUTH_R)) mouthNodes.add(n)
    }
    let mouthWays = 0
    const flatP = (e: PackedEdge): boolean => flat(e) && !mouthNodes.has(e.a) && !mouthNodes.has(e.b)
    for (const e of kept) if (flat(e) && !flatP(e)) mouthWays++
    if (process.env.PLATE_DEBUG) console.log(`  [plate] ${mouthNodes.size} underpass mouths near plates, ${mouthWays} ways into them kept off the plates`)
    const atNode = new Map<number, PackedEdge[]>()
    for (const e of kept) if (flatP(e)) for (const n of [e.a, e.b]) (atNode.get(n) ?? atNode.set(n, []).get(n)!).push(e)
    const nodeXZ = (e: PackedEdge, n: number): { x: number; z: number } => n === e.a ? { x: e.points[0], z: e.points[1] } : { x: e.points[e.points.length - 2], z: e.points[e.points.length - 1] }
    const reach = JUNCTION_R + JUNCTION_EASE
    const flatRoads = kept.filter((e) => flatP(e) && isRoad(e))
    let levelled = 0, made = 0, landed = 0, segTotal = 0
    for (const c of plates) {
      // (the ways OF the junction, walked from its ends through joins within reach: a way passing under it, joined nowhere near — the
      //  périphérique under the Grande Armée at Porte Maillot — is not one of them)
      const got = new Set<PackedEdge>(), seen = new Set<number>(c.ends.map((t) => t.n))
      for (const [n, es] of atNode) if (!seen.has(n) && es.some(isRoad)) {
        const q = nodeXZ(es[0], n)
        if (c.ends.some((t) => Math.hypot(q.x - t.x, q.z - t.z) < PLATE_SEED_R)) seen.add(n)
      }
      const walk = (todo: number[]): void => {
        while (todo.length) {
          const n = todo.pop()!
          for (const e of atNode.get(n) ?? []) {
            got.add(e)
            const m = n === e.a ? e.b : e.a, q = nodeXZ(e, m)
            if (!seen.has(m) && Math.hypot(q.x - c.x, q.z - c.z) < reach) { seen.add(m); todo.push(m) }
          }
        }
      }
      walk([...seen])
      // (seeded by a segment: a road passing the end at the level of the ways joined to it is of the junction, its nodes within
      //  reach walked on from. It never FOUNDS a plate — bake 3 let Quai d'Ivry under Pont National's elevated left end found one at
      //  the quay's 1.8 — and a lower-quay road (DECK_LOW_NAME: Voie Georges Pompidou under Pont Mirabeau) is never of one)
      let segSeeded = 0
      const base = [...got].flatMap((e) => e.heights!.filter((_, i) => levelRoad(e) && Math.hypot(e.points[2 * i] - c.x, e.points[2 * i + 1] - c.z) < JUNCTION_R)).sort((x, y) => x - y)
      if (PLATE_SEED_SEG > 0 && base.length >= PLATE_MIN_ROADS) {
        const baseLevel = base[Math.floor(base.length * PLATE_QUANTILE)], more: number[] = []
        for (const e of flatRoads) {
          if (got.has(e) || DECK_LOW_NAME.test(e.name ?? '')) continue
          const p = e.points, h = e.heights!
          let hit = false
          for (let i = 1; i < h.length && !hit; i++) {
            const ax = p[2 * i - 2], az = p[2 * i - 1], rx = p[2 * i] - ax, rz = p[2 * i + 1] - az, L2 = rx * rx + rz * rz
            for (const t of c.ends) {
              const u = L2 > 0 ? Math.max(0, Math.min(1, ((t.x - ax) * rx + (t.z - az) * rz) / L2)) : 0
              if (Math.hypot(ax + rx * u - t.x, az + rz * u - t.z) < PLATE_SEED_SEG && Math.abs(h[i - 1] + (h[i] - h[i - 1]) * u - baseLevel) < PLATE_SEED_DH) { hit = true; break }
            }
          }
          if (!hit) continue
          got.add(e); segSeeded++
          for (const n of [e.a, e.b]) { const q = nodeXZ(e, n); if (!seen.has(n) && Math.hypot(q.x - c.x, q.z - c.z) < reach) { seen.add(n); more.push(n) } }
        }
        walk(more)
      }
      const pts: { e: PackedEdge; i: number; d: number }[] = []
      for (const e of got) for (let i = 0; i < e.heights!.length; i++) {
        const d = Math.hypot(e.points[2 * i] - c.x, e.points[2 * i + 1] - c.z)
        if (d < reach) pts.push({ e, i, d })
      }
      const roads = pts.filter((q) => q.d < JUNCTION_R && levelRoad(q.e)).map((q) => q.e.heights![q.i]).sort((a, b) => a - b)
      if (roads.length < PLATE_MIN_ROADS) {
        if (process.env.PLATE_DEBUG) console.log(`  [plate] ${Math.round(c.x)},${Math.round(c.z)} none: ${roads.length} road points (an elevated approach?), ways ${got.size}`)
        continue
      }
      const level = roads[Math.floor(roads.length * PLATE_QUANTILE)]
      made++; segTotal += segSeeded
      for (const e of got) plateWays.add(e)
      for (const t of c.ends) plateEnds.push({ x: t.x, z: t.z })
      if (process.env.PLATE_DEBUG) {
        const qn = (f: number): string => roads[Math.floor(roads.length * f)].toFixed(1)
        console.log(`  [plate] ${Math.round(c.x)},${Math.round(c.z)} level ${level.toFixed(2)} (q25 ${qn(0.25)} q50 ${qn(0.5)} q75 ${qn(0.75)} of ${roads.length}) ends ${c.ends.map((t) => `${Math.round(t.x)},${Math.round(t.z)}`).join(' ')} ways ${got.size}${segSeeded ? ` (${segSeeded} seeded by a segment)` : ''}`)
      }
      // (a quay walk joined to the junction, its plate-side end well under it, stays down: the plate pulled their ends up to the
      //  street. The end, not the way's median: a street's carriageway and its sidewalk then agree)
      const low = new Set<PackedEdge>(), seen0 = new Set(c.ends.map((t) => t.n))
      for (const e of got) {
        const h = e.heights!, p = e.points
        const da = Math.hypot(p[0] - c.x, p[1] - c.z), db = Math.hypot(p[p.length - 2] - c.x, p[p.length - 1] - c.z)
        // (…but never a way off the bridge's own end, which the lidar takes at quay level under the abutment)
        if (seen0.has(e.a) || seen0.has(e.b)) continue
        if ((da <= db ? h[0] : h[h.length - 1]) < level - PLATE_LOW) low.add(e)
      }
      const lifted = new Map<PackedEdge, Set<number>>()
      for (const q of pts) {
        if (low.has(q.e)) continue
        const h = q.e.heights![q.i], w = Math.min(1, (reach - q.d) / JUNCTION_EASE)
        if (level - h > JUNCTION_MAX_STEP || h - level > PLATE_MAX_DROP) continue
        q.e.heights![q.i] = Math.round((h + (level - h) * w) * 100) / 100; levelled++
        if (w > 0) (lifted.get(q.e) ?? lifted.set(q.e, new Set()).get(q.e)!).add(q.i)
      }
      // ways leaving the plate fall from it no steeper than PLATE_GRADE (a quay road's 4.7 m in 22 m was a 20% ramp; a point
      //  skipped as too far under the plate stood a cliff below its eased neighbour): lift only, outward from what was levelled
      for (const [e, seeds] of lifted) {
        const h = e.heights!, seg = (i: number): number => Math.hypot(e.points[2 * i] - e.points[2 * i - 2], e.points[2 * i + 1] - e.points[2 * i - 1])
        let go = false
        for (let i = 0; i < h.length; i++) { if (go && i) h[i] = Math.max(h[i], Math.round((h[i - 1] - PLATE_GRADE * seg(i)) * 100) / 100); if (seeds.has(i)) go = true }
        go = false
        for (let i = h.length - 1; i >= 0; i--) { if (go && i < h.length - 1) h[i] = Math.max(h[i], Math.round((h[i + 1] - PLATE_GRADE * seg(i + 1)) * 100) / 100); if (seeds.has(i)) go = true }
      }
      // the bridges' ends that land on the plate (their roadways and their own sidewalks)
      const onPlate = new Set<number>()
      for (const e of got) for (const n of [e.a, e.b]) { const q = nodeXZ(e, n); if (Math.hypot(q.x - c.x, q.z - c.z) < JUNCTION_R) onPlate.add(n) }
      for (const t of c.ends) onPlate.add(t.n)
      for (const e of kept) {
        if (!e.bridge || e.tunnel || !e.heights) continue
        if (onPlate.has(e.a)) { e.heights[0] = level; landed++ }
        if (onPlate.has(e.b)) { e.heights[e.heights.length - 1] = level; landed++ }
      }
    }
    if (made) console.log(`  bridgehead plates: ${made} junctions at one level, ${levelled} way points on them, ${landed} bridge ends landed, ${segTotal} ways seeded by a segment`)
  }
  /*
   * UNMARKED OVERPASSES (owner, 2026-11-06: "highway overpasses aren't modeled at all"; Porte Maillot, where the avenues cross the
   * périphérique's cut on ways OSM does not call bridges). Levelled from the ground like any street, such a way stood on a fill,
   * and the fill's retaining walls ran down to the trench floor as stone fins. Where a surface road crosses over another at
   * OVER_CLEAR or more, the stretch of it with the ground OVER_GAP or more under it (to OVER_SPAN at most, OVER_PAD beyond) is
   * cut out of its way and made a bridge: the deck code below lays it straight from end to end, and the renderer draws a deck.
   */
  if (spec.region === 'paris') {
    const OVER_CLEAR = 4.5, OVER_GAP = 2.5, OVER_SPAN = 90, OVER_PAD = 1, OVER_STEP = 1
    const roadKind = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service)(_link)?$/
    const surf = kept.filter((e) => !e.foot && !e.bridge && !e.tunnel && !e.authored && e.heights && e.heights.length * 2 === e.points.length && roadKind.test(e.kind ?? ''))
    type Sg = { e: PackedEdge; i: number; ax: number; az: number; bx: number; bz: number; s0: number }
    const B = new Map<string, Sg[]>(), C = 40
    const along = new Map<PackedEdge, number[]>()
    for (const e of surf) {
      const p = e.points, cum = [0]
      for (let i = 2; i < p.length; i += 2) cum.push(cum[cum.length - 1] + Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]))
      along.set(e, cum)
      for (let i = 1; i < cum.length; i++) {
        const g = { e, i, ax: p[2 * i - 2], az: p[2 * i - 1], bx: p[2 * i], bz: p[2 * i + 1], s0: cum[i - 1] }
        for (let cx = Math.floor(Math.min(g.ax, g.bx) / C); cx <= Math.floor(Math.max(g.ax, g.bx) / C); cx++)
          for (let cz = Math.floor(Math.min(g.az, g.bz) / C); cz <= Math.floor(Math.max(g.az, g.bz) / C); cz++) { const k = `${cx},${cz}`; (B.get(k) ?? B.set(k, []).get(k)!).push(g) }
      }
    }
    const hAt = (e: PackedEdge, s: number): number => {
      const cum = along.get(e)!, h = e.heights!
      let i = 1
      while (i < cum.length - 1 && cum[i] < s) i++
      const t = Math.max(0, Math.min(1, (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1)))
      return h[i - 1] + (h[i] - h[i - 1]) * t
    }
    const xzAt = (e: PackedEdge, s: number): { x: number; z: number } => {
      const cum = along.get(e)!, p = e.points
      let i = 1
      while (i < cum.length - 1 && cum[i] < s) i++
      const t = Math.max(0, Math.min(1, (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1)))
      return { x: p[2 * i - 2] + (p[2 * i] - p[2 * i - 2]) * t, z: p[2 * i - 1] + (p[2 * i + 1] - p[2 * i - 1]) * t }
    }
    // the spans to cut out, per upper way
    const spans = new Map<PackedEdge, [number, number][]>()
    const dbg: [number, string][] = []
    const done = new Set<string>()
    for (const segs of B.values()) for (const u of segs) for (const l of segs) {
      if (u.e === l.e || u.e.a === l.e.a || u.e.a === l.e.b || u.e.b === l.e.a || u.e.b === l.e.b) continue
      const key = `${u.e.id}:${u.i}:${l.e.id}:${l.i}`
      if (done.has(key)) continue
      done.add(key)
      const rx = u.bx - u.ax, rz = u.bz - u.az, sx = l.bx - l.ax, sz = l.bz - l.az, den = rx * sz - rz * sx
      if (Math.abs(den) < 1e-9) continue
      const t = ((l.ax - u.ax) * sz - (l.az - u.az) * sx) / den, w = ((l.ax - u.ax) * rz - (l.az - u.az) * rx) / den
      if (t < 0 || t > 1 || w < 0 || w > 1) continue
      const su = u.s0 + t * Math.hypot(rx, rz), sl = l.s0 + w * Math.hypot(sx, sz)
      const hu = hAt(u.e, su)
      if (process.env.OVER_DEBUG) dbg.push([hu - hAt(l.e, sl), `${u.e.name ?? u.e.kind} over ${l.e.name ?? l.e.kind}`])
      if (hu - hAt(l.e, sl) < OVER_CLEAR) continue
      const L = along.get(u.e)!.at(-1)!
      const deep = (s: number): boolean => { const q = xzAt(u.e, s); return hAt(u.e, s) - groundFine(q.x, q.z) >= OVER_GAP }
      let s0 = su, s1 = su
      while (s0 - OVER_STEP > 0 && su - s0 < OVER_SPAN / 2 && deep(s0 - OVER_STEP)) s0 -= OVER_STEP
      while (s1 + OVER_STEP < L && s1 - su < OVER_SPAN / 2 && deep(s1 + OVER_STEP)) s1 += OVER_STEP
      s0 = Math.max(0, s0 - OVER_PAD - l.e.width / 2); s1 = Math.min(L, s1 + OVER_PAD + l.e.width / 2)
      ;(spans.get(u.e) ?? spans.set(u.e, []).get(u.e)!).push([s0, s1])
    }
    if (process.env.OVER_DEBUG) console.log(`  overpass debug: ${surf.length} surface roads of ${kept.length}; bridges ${kept.filter((e) => e.bridge).length}, tunnels ${kept.filter((e) => e.tunnel).length}; with heights ${kept.filter((e) => e.heights).length}, aligned ${kept.filter((e) => e.heights && e.heights.length * 2 === e.points.length).length}`)
    if (process.env.OVER_DEBUG) { dbg.sort((x, y) => y[0] - x[0]); console.log(`  overpass debug: ${dbg.length} crossings; ${dbg.slice(0, 8).map(([d, n]) => `${d.toFixed(1)} ${n}`).join('; ')}`) }
    let nextNode = 8e14, nextId = kept.reduce((m, e) => Math.max(m, e.id), 0) + 1, made = 0
    const named: string[] = []
    for (const [e, list] of spans) {
      list.sort((a, b) => a[0] - b[0])
      const merged: [number, number][] = []
      for (const sp of list) { const m = merged.at(-1); if (m && sp[0] <= m[1] + 2) m[1] = Math.max(m[1], sp[1]); else merged.push([...sp]) }
      const L = along.get(e)!.at(-1)!
      // the cuts: 0 … s0 (ground), s0 … s1 (bridge), … L; a cut within 2 m of an end takes the end itself
      const cuts: { s: number; bridge: boolean }[] = []
      for (const [s0, s1] of merged) cuts.push({ s: s0 < 2 ? 0 : s0, bridge: true }, { s: s1 > L - 2 ? L : s1, bridge: false })
      const pieces: { from: number; to: number; bridge: boolean }[] = []
      let at = 0, br = false
      for (const c of cuts) { if (c.s > at + 0.01) pieces.push({ from: at, to: c.s, bridge: br }); at = c.s; br = c.bridge }
      if (L > at + 0.01) pieces.push({ from: at, to: L, bridge: br })
      const cum = along.get(e)!
      const out: PackedEdge[] = []
      let nodeA = e.a
      for (let k = 0; k < pieces.length; k++) {
        const { from, to, bridge } = pieces[k]
        const pts: number[] = [], hs: number[] = []
        const add = (s: number): void => { const q = xzAt(e, s); pts.push(q.x, q.z); hs.push(hAt(e, s)) }
        add(from)
        for (let i = 0; i < cum.length; i++) if (cum[i] > from + 0.01 && cum[i] < to - 0.01) { pts.push(e.points[2 * i], e.points[2 * i + 1]); hs.push(e.heights![i]) }
        add(to)
        const nodeB = k === pieces.length - 1 ? e.b : nextNode++
        const piece: PackedEdge = { ...e, id: k === 0 ? e.id : nextId++, a: nodeA, b: nodeB, points: pts, heights: hs }
        if (bridge) { piece.bridge = true; piece.layer = Math.max(1, e.layer ?? 0); made++ }
        out.push(piece)
        nodeA = nodeB
      }
      if (out.length > 1 || out[0]?.bridge) {
        kept.splice(kept.indexOf(e), 1, ...out)
        if (e.name && !named.includes(e.name)) named.push(e.name)
      }
    }
    if (made) console.log(`  overpasses OSM does not call bridges: ${made} decks cut out of ${spans.size} ways (${named.slice(0, 8).join(', ')}${named.length > 8 ? '…' : ''})`)
  }
  trace('bridgeheads')
  const preBridge = new Map(kept.map((e) => [e.id, e.heights ? [...e.heights] : undefined]))
  const decks = bridgeHeights(kept.filter((e) => !e.authored), { water: waterBodies, ground: groundAt, buried, layerCaps,
    straight: new Set(kept.filter((e) => e.bridge && (streetRegion.straightDecks ?? []).includes(e.name ?? '')).map((e) => e.id)),
    liftAbutments: spec.region === 'paris',
    // (not in Paris, whose tracks are all on viaducts, in cuttings or in tunnels: there the bridge stays at grade and the
    //  rail goes down — owner, 2026-10-30; PARIS_BUGS.md "Sunken rails")
    rails: streetRegion.roadPaint === 'paris' ? [] : rails.filter((r) => !r.bridge && !r.heights && r.kind !== 'tram').map((r) => ({ points: r.points, layer: r.layer })) })
  // the ways lifted onto a deck are ramps: said outright, for the renderer (city/package.ts isRaised)
  for (const e of kept) if (decks.raised.has(e.id) && !e.bridge) e.ramp = true
  trace('decks')
  /*
   * DECK CLEARANCE (2026-11-07, Pont National: its left end, at the lidar's 4.0, stood 2.3 m over the Quai d'Ivry passing under it,
   * drawn as a wall across the quay — the approach there is an elevated boulevard, so no plate levels that end). An at-grade way
   * crossing under a deck, joined to no bridge and not one of a plate's own ways, is cleared by DECK_CLEAR_ROAD (DECK_CLEAR_FOOT
   * for a footway, cycleway or service way). The deck comes up — lift only, eased along the decks and elevated ways it joins at
   * DECK_LIFT_GRADE; but near a plated end (that end is the street) the way under goes down instead, eased at UNDER_GRADE.
   * DECK_CLEAR=0 skips it; DECK_CLEAR_DEBUG=1 lists what moved.
   */
  if (spec.region === 'paris' && process.env.DECK_CLEAR !== '0') {
    const aligned = (e: PackedEdge): boolean => !!e.heights && e.heights.length * 2 === e.points.length && !e.authored && !e.tunnel && e.kind !== 'steps' && e.kind !== 'elevator'
    const decksC = kept.filter((e) => e.bridge && aligned(e) && !PLATE_FREEWAY.test(e.kind ?? ''))
    const bridgeNode = new Set<number>(); for (const e of decksC) { bridgeNode.add(e.a); bridgeNode.add(e.b) }
    const underC = kept.filter((e) => !e.bridge && (e.layer ?? 0) <= 0 && aligned(e) && !plateWays.has(e) && !bridgeNode.has(e.a) && !bridgeNode.has(e.b))
    const C = 40, B = new Map<string, { e: PackedEdge; i: number }[]>()
    for (const e of underC) for (let i = 1; i < e.heights!.length; i++) {
      const p = e.points
      for (let cx = Math.floor(Math.min(p[2 * i - 2], p[2 * i]) / C); cx <= Math.floor(Math.max(p[2 * i - 2], p[2 * i]) / C); cx++)
        for (let cz = Math.floor(Math.min(p[2 * i - 1], p[2 * i + 1]) / C); cz <= Math.floor(Math.max(p[2 * i - 1], p[2 * i + 1]) / C); cz++) { const k = `${cx},${cz}`; (B.get(k) ?? B.set(k, []).get(k)!).push({ e, i }) }
    }
    const nearPlate = (x: number, z: number): boolean => plateEnds.some((t) => Math.hypot(t.x - x, t.z - z) < JUNCTION_R)
    const lowMemo = new Map<PackedEdge, boolean>()
    const lowUnder = (e: PackedEdge): boolean => {
      if (process.env.DECK_LOW === '0') return false
      let v = lowMemo.get(e)
      if (v === undefined) {
        v = DECK_LOW_NAME.test(e.name ?? '')
        if (!v) { const q = unpackPoints(e.points); for (let i = 1; i < q.length && !v; i++) v = lowKeys.has(quayNodeKey(q[i - 1])) && lowKeys.has(quayNodeKey(q[i])) }
        lowMemo.set(e, v)
      }
      return v
    }
    // the raise each point needs (deck) / the drop (way under), spread later
    const up = new Map<PackedEdge, number[]>(), down = new Map<PackedEdge, number[]>()
    const need = (m: Map<PackedEdge, number[]>, e: PackedEdge, i: number, v: number): void => { if (bandAt(e.points[2 * i], e.points[2 * i + 1])) return; const a = m.get(e) ?? m.set(e, e.heights!.map(() => 0)).get(e)!; a[i] = Math.max(a[i], v) }
    const dbg: string[] = []
    for (const d of decksC) {
      const p = d.points, h = d.heights!
      for (let i = 1; i < h.length; i++) {
        const ax = p[2 * i - 2], az = p[2 * i - 1], rx = p[2 * i] - ax, rz = p[2 * i + 1] - az
        const seen = new Set<{ e: PackedEdge; i: number }>()
        for (let cx = Math.floor(Math.min(ax, ax + rx) / C); cx <= Math.floor(Math.max(ax, ax + rx) / C); cx++)
          for (let cz = Math.floor(Math.min(az, az + rz) / C); cz <= Math.floor(Math.max(az, az + rz) / C); cz++) for (const g of B.get(`${cx},${cz}`) ?? []) {
            if (seen.has(g)) continue
            seen.add(g)
            const l = g.e.points, lh = g.e.heights!, bx = l[2 * g.i - 2], bz = l[2 * g.i - 1], sx = l[2 * g.i] - bx, sz = l[2 * g.i + 1] - bz
            const den = rx * sz - rz * sx
            if (Math.abs(den) < 1e-9) continue
            const t = ((bx - ax) * sz - (bz - az) * sx) / den, w = ((bx - ax) * rz - (bz - az) * rx) / den
            if (t < 0 || t > 1 || w < 0 || w > 1) continue
            const hu = h[i - 1] + (h[i] - h[i - 1]) * t, hl = lh[g.i - 1] + (lh[g.i] - lh[g.i - 1]) * w
            const clear = !g.e.foot && g.e.kind !== 'service' && g.e.kind !== 'cycleway' && g.e.kind !== 'track' ? DECK_CLEAR_ROAD : DECK_CLEAR_FOOT
            const gap = hu - hl
            const low = lowUnder(g.e) && !d.foot && d.kind !== 'footway' && d.kind !== 'cycleway' && d.kind !== 'path'
            if (gap < (low ? DECK_LOW_MIN_GAP : DECK_MIN_GAP) || gap >= clear) continue
            const short = clear - gap
            if (nearPlate(ax + rx * t, az + rz * t) && (!low || short <= UNDER_MAX_DROP)) {
              if (short > UNDER_MAX_DROP) continue
              need(down, g.e, g.i - 1, short); need(down, g.e, g.i, short)
              if (process.env.DECK_CLEAR_DEBUG) dbg.push(`${g.e.name ?? g.e.kind} down ${short.toFixed(1)} under ${d.name ?? d.kind} at ${Math.round(ax + rx * t)},${Math.round(az + rz * t)}`)
            } else {
              if (short > DECK_LIFT_MAX) continue
              need(up, d, i - 1, short); need(up, d, i, short)
              if (process.env.DECK_CLEAR_DEBUG) dbg.push(`${d.name ?? d.kind} up ${short.toFixed(1)} over ${g.e.name ?? g.e.kind}${low && gap < DECK_MIN_GAP ? ' (lower quay)' : ''} at ${Math.round(ax + rx * t)},${Math.round(az + rz * t)}`)
            }
          }
      }
    }
    // spread each need along its way and on through the ways joined to it (of the same kind: decks and elevated ways / ways at
    //  grade), falling off by grade × distance; then applied, up or down
    const spread = (m: Map<PackedEdge, number[]>, pool: PackedEdge[], grade: number): number => {
      const at = new Map<number, PackedEdge[]>()
      for (const e of pool) for (const n of [e.a, e.b]) (at.get(n) ?? at.set(n, []).get(n)!).push(e)
      const seg = (e: PackedEdge, i: number): number => Math.hypot(e.points[2 * i] - e.points[2 * i - 2], e.points[2 * i + 1] - e.points[2 * i - 1])
      for (let pass = 0; pass < 6; pass++) {
        let moved = false
        for (const [e, a] of [...m]) {
          for (let i = 1; i < a.length; i++) a[i] = Math.max(a[i], a[i - 1] - grade * seg(e, i))
          for (let i = a.length - 2; i >= 0; i--) a[i] = Math.max(a[i], a[i + 1] - grade * seg(e, i + 1))
          for (const [n, v] of [[e.a, a[0]], [e.b, a[a.length - 1]]] as const) {
            if (v <= 0.05) continue
            for (const o of at.get(n) ?? []) {
              if (o === e) continue
              const b = m.get(o) ?? m.set(o, o.heights!.map(() => 0)).get(o)!, k = o.a === n ? 0 : b.length - 1
              if (b[k] < v - 0.01) { b[k] = v; moved = true }
            }
          }
        }
        if (!moved) break
      }
      let n = 0
      for (const a of m.values()) for (const v of a) if (v > 0.05) n++
      return n
    }
    const lifted = spread(up, kept.filter((e) => (e.bridge || (e.layer ?? 0) > 0) && aligned(e)), DECK_LIFT_GRADE)
    const lowered = spread(down, kept.filter((e) => !e.bridge && (e.layer ?? 0) <= 0 && aligned(e) && !plateWays.has(e)), UNDER_GRADE)
    for (const [e, a] of up) e.heights = e.heights!.map((v, i) => Math.round((v + a[i]) * 100) / 100)
    for (const [e, a] of down) e.heights = e.heights!.map((v, i) => Math.round((v - a[i]) * 100) / 100)
    if (lifted || lowered) {
      const met = meetDecks(kept.filter((e) => !e.authored && !bandAny(e)), true, true)
      console.log(`  deck clearance: ${lifted} deck points lifted over the ways under them, ${lowered} points of ways under a plated end lowered; ${met.length} ways met the lifted decks`)
    }
    if (process.env.DECK_CLEAR_DEBUG) console.log(dbg.map((t) => `    ${t}`).join('\n'))
  }
  // the walks over the bay off the sea bed: onto their piers' decks, or a float (tools/bridges.ts `liftWalksOffTheSea`)
  if (seaLevel !== null) {
    const piers: { ring: { x: number; z: number }[]; floating: boolean }[] = []
    for (const w of ways) {
      if (w.tags.man_made !== 'pier' || !w.geometry || w.geometry.length < 4) continue
      const a = w.geometry[0], b = w.geometry[w.geometry.length - 1]
      if (Math.abs(a.lat - b.lat) > 1e-9 || Math.abs(a.lon - b.lon) > 1e-9) continue   // (a pier drawn as a line has no outline)
      piers.push({ ring: w.geometry.slice(0, -1).map((g) => proj.toLocal(g)), floating: w.tags.floating === 'yes' })
    }
    for (const r of relations) {
      if (r.tags.man_made !== 'pier') continue
      for (const ring of outerRings(r)) piers.push({ ring: ring.slice(0, -1).map((g) => proj.toLocal(g)), floating: r.tags.floating === 'yes' })
    }
    // (over the water by the bake's own sea and lakes, the coastline being the shore — not by the elevation tiles)
    const waterAt = waterLookup(wetAreas.map((a) => {
      const ring = unpackPoints(a.ring)
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
      return { ring, holes: (a.holes ?? []).map(unpackPoints), x0, x1, z0, z1, level: 0 }
    }))
    const lifted = liftWalksOffTheSea(kept, seaLevel, piers, 3.5, (x, z) => waterAt(x, z) !== null)
    if (lifted.size) console.log(`  ${lifted.size} walks lifted off the sea bed onto ${piers.length} piers' decks and floats`)
  }
  // a foot bridge's ends down to the paths they meet (tools/bridges.ts `rampFootBridgeEnds`)
  {
    const r = rampFootBridgeEnds(kept, spec.region === 'paris')
    if (r.size) console.log(`  ${r.size} foot-bridge ends graded down to the paths they join`)
  }
  // street tunnels under a hill: their own mouth-to-mouth profile, and `bore` — ridden and drawn (tools/tunnels.ts)
  const bores = boreTunnels(kept, groundAt,
    (name, why) => console.log(why.startsWith('the street') ? `  ${name}: ${why}` : `  tunnel not ridden: ${name} — ${why}`),
    // (the fine ground, where a trench into a mouth shows — tools/tunnels.ts TRENCH_RUN — and only the LIDAR's: the
    //  zoom-15 ground has blurred hollows by every underpass that are no trench, and lowered Geary's and Stockton's)
    (() => {
      const lidar = zones.filter((zn) => zn.props.lidar)
      return (x: number, z: number): number => zonesAt(lidar, x, z).length ? sampleGridF(fineGround, fcols, frows, fx0, fz0, FINE_STEP, x, z) : NaN
    })())
  if (bores.size > 0) console.log(`  ${bores.size} street-tunnel ways made rideable bores (their pavements included)`)
  trace('bores')
  // a mouth inside a deck zone, or within DZ_SINK_MARGIN of its ring, is left to the zone (tools/deck-zones.ts)
  const dzRings = (streetRegion.deckZones ?? []).map((z: { ring: [number, number][] }) => z.ring.flatMap(([lat, lon]) => { const q = proj.toLocal({ lat, lon }); return [q.x, q.z] }))
  const nearDz = (x: number, z: number): boolean => bandAt(x, z) || dzRings.filter((r: number[]) => r.length).some((r: number[]) => {
    if (inRingTT(r, x, z)) return true
    for (let i = 0; i < r.length; i += 2) {
      const j = (i + 2) % r.length, dx = r[j] - r[i], dz = r[j + 1] - r[i + 1]
      const t = Math.max(0, Math.min(1, ((x - r[i]) * dx + (z - r[i + 1]) * dz) / (dx * dx + dz * dz || 1)))
      if (Math.hypot(r[i] + dx * t - x, r[i + 1] + dz * t - z) < DZ_SINK_MARGIN) return true
    }
    return false
  })
  // short covered trenches under a street: ridden through as low bores, the ground filled to the street (tools/tunnels.ts `lidTunnels`)
  {
    const drop = spec.region !== 'paris' || process.env.LIDS === '0' ? new Set<number>() : lidTunnels(kept, (name, why) => console.log(`  ${name}: ${why}`), nearDz, lidSlabsOut, groundFine)
    if (drop.size) { const k = kept.filter((e) => !drop.has(e.id)); kept.length = 0; for (const e of k) kept.push(e); console.log(`  ${drop.size} near-miss joins at lid mouths dropped`) }
  }
  // road tunnels no bore takes, with a street over the mouth: the mouth sunk under it, the road ramped down (tools/tunnels.ts)
  {
    const drop = sinkRoadMouths(kept, (name, why) => console.log(`  ${name}: ${why}`), nearDz)
    if (drop.size) { const k = kept.filter((e) => !drop.has(e.id)); kept.length = 0; for (const e of k) kept.push(e); console.log(`  ${drop.size} near-miss joins at sunk mouths dropped`) }
  }
  /*
   * A SHORT UNDERPASS is a street, not a tunnel (owner, 2026-10-16, Geary under the Fillmore overpass: "hard to go
   * straight under, most paths go in the air to the overpass above"). OSM maps the 26 m of Geary's main lanes beneath
   * the Fillmore deck as tunnel=yes; no bore takes it (no hill), so it was neither drawn nor ridden, and the main
   * lanes dead-ended at both mouths. A road tunnel under 60 m that no bore took is ridden in the open at its cut's
   * level, its heights run straight between the streets that meet its two ends.
   */
  {
    const endsAt = new Map<number, number[]>()
    for (const e of kept) {
      if (e.tunnel || !e.heights?.length) continue
      ;(endsAt.get(e.a) ?? endsAt.set(e.a, []).get(e.a)!).push(e.heights[0])
      ;(endsAt.get(e.b) ?? endsAt.set(e.b, []).get(e.b)!).push(e.heights[e.heights.length - 1])
    }
    let n = 0
    for (const e of kept) {
      if (!e.tunnel || e.bore || e.foot || /^(footway|path|cycleway|pedestrian|steps|service)$/.test(e.kind ?? '')) continue
      const pts = unpackPoints(e.points)
      let L = 0
      for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
      const ha = endsAt.get(e.a), hb = endsAt.get(e.b)
      if (L >= 60 || !ha?.length || !hb?.length) continue
      const y0 = Math.min(...ha), y1 = Math.min(...hb)
      let c = 0
      e.heights = pts.map((p, i) => { if (i) c += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z); return Math.round((y0 + (y1 - y0) * (L ? c / L : 0)) * 100) / 100 })
      delete e.tunnel
      if ((e.layer ?? 0) < 0) delete e.layer
      n++
    }
    if (n) console.log(`  short road underpasses ridden in the open: ${n}`)
  }
  trace('underpasses')
  /*
   * …and a ROAD that ends at a node only footways use, metres above or below it, is a false link between levels:
   * Geary's main lanes, in their cut, each ran a few metres on to a node of the Fillmore overpass's sidewalks
   * overhead, and the ride graph sent the rider up them into the air (owner, 2026-10-16). Dropped.
   */
  {
    const footY = new Map<number, number[]>(), roadAt = new Map<number, number>()
    const isFootKind = (e: PackedEdge): boolean => !!e.foot || /^(footway|path|cycleway|pedestrian|steps)$/.test(e.kind ?? '')
    for (const e of kept) {
      if (!e.heights?.length) continue
      for (const [nd, y] of [[e.a, e.heights[0]], [e.b, e.heights[e.heights.length - 1]]] as const) {
        // (the footway on a BRIDGE at that node: the crossings down to it from the street take the stub's own level)
        if (isFootKind(e) && e.bridge) (footY.get(nd) ?? footY.set(nd, []).get(nd)!).push(y)
        else if (isFootKind(e)) continue
        else roadAt.set(nd, (roadAt.get(nd) ?? 0) + 1)
      }
    }
    const drop = new Set<number>()
    for (const e of kept) {
      if (isFootKind(e) || !e.heights?.length) continue
      for (const [nd, y] of [[e.a, e.heights[0]], [e.b, e.heights[e.heights.length - 1]]] as const) {
        const f = footY.get(nd)
        if (f?.length && (roadAt.get(nd) ?? 0) === 1 && Math.min(...f.map((fy) => Math.abs(fy - y))) > 2) drop.add(e.id)
      }
    }
    if (drop.size) {
      for (let i = kept.length - 1; i >= 0; i--) if (drop.has(kept[i].id)) kept.splice(i, 1)
      console.log(`  roads ending on a footway at another level, dropped: ${drop.size}`)
    }
  }
  /*
   * The ways over a MODELLED bridge take the model's deck heights, and the chain off each end of it is regraded to
   * meet them (src/city/bridge-decks.ts, tools/deck-conform.ts): the Golden Gate's roadway and sidewalks, both
   * decks of the Bay Bridge and the ramps on Rincon Hill. Before the cuts are carved: a deck that comes out of a
   * hill below the ground (the Bay Bridge's lower roadway, east of the Yerba Buena tunnel) is a `cut`, and the
   * ground is brought down to it. What it changed is kept (`decks-undo.json`), for `--decks`.
   */
  const deckWork = conformWithUndo(spec.region ?? spec.id, spec.centre, kept, groundAt)
  trace('conformed')
  if (deckWork) console.log(`  bridge decks: ${describe(deckWork.report)}`)
  // …and the ways meeting a deck the model moved meet it again (tools/bridges.ts `meetDecks`: Pont au Change, the Alma)
  if (deckWork) {
    const met = meetDecks(kept.filter((e) => !e.authored && !bandAny(e)), false, spec.region === 'paris')
    if (met.length) console.log(`  ${met.length} ways met their modelled bridge's conformed deck`)
  }
  /*
   * CARVE THE CUTS into the ground (2026-09-29): a street running down into a tunnel mouth is in a cutting the
   * elevation data does not have — the coarse ground stood over lower Stockton and over the approach to the
   * Stockton Tunnel's north mouth, and the ground occluder hid the whole street beyond it from inside the tunnel.
   * Each cut street's corridor, and 8 m either side, is lowered to the street's own level, rising at 2:1 beyond
   * that; only alongside the street — never past its ends, which would dig a hole in the hill over the mouth.
   * The tiles it touches ship fine ground (4 m), so the cutting has sides.
   */
  {
    const cuts = kept.filter((e) => e.cut && e.heights?.length)
    /*
     * …and FILL THE HILL BACK OVER THE BORES (2026-10-14, owner: the Stockton Tunnel's north portal seen from behind,
     * "should be occluded and I think is in the wrong place"; Broadway's entrance "open top"). Behind a portal the
     * real ground is a sheer wall up to the street over it, and the elevation data smears that wall into a slope a
     * few metres deep — so the ground just inside a mouth stood BELOW the tube's crown, a pit where the back of the
     * portal and the bore's own top stood in the open (surface Stockton dead-ends 10 m short of the north mouth,
     * and from it the whole arch showed). Over each bore, mouth to mouth and never past a mouth (the cut in front
     * stays open), the ground is at least the crown and a little cover, falling away at 2:1 beside it. Never lower.
     */
    const boreEdges = kept.filter((e) => e.bore && !e.foot && e.heights?.length)
    if (cuts.length || boreEdges.length) {
      const MARGIN = 8
      const PAST_MOUTH = 5
      const mouthNodes = new Set<number>()
      for (const e of boreEdges) { mouthNodes.add(e.a); mouthNodes.add(e.b) }
      /*
       * …never under another street standing above the cut (2026-10-14, the same junction): the 8 m margin and the 2:1
       * banks dug out the ground under Broadway's frontage roads, which then stood on decks over a hole. Beside a
       * street a cutting is a wall. (Built when the carving runs: after the bridges over cuts are back at grade.)
       */
      let banks: StreetGrade | null = null
      const streetsAtGrade = (): StreetGrade => {
        if (!banks) {
          banks = new StreetGrade()
          for (const o of kept) if (!o.cut && !o.bore && !o.tunnel && !o.bridge && !o.foot && o.heights?.length) banks.add(o)
        }
        return banks
      }
      const carve = (h: ArrayLike<number> & { [i: number]: number }, x0: number, z0: number, step: number, ncols: number, nrows: number): number => {
        streetsAtGrade()
        let lowered = 0
        for (const e of cuts) {
          const pts = unpackPoints(e.points)
          const lid = lidRoadIds.has(e.id)
          const half = (e.foot ? e.width / 2 : e.width / 2 + Math.max(e.walk, 0.6)) + 0.3
          const reach = half + MARGIN
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1]
            const b = pts[i]
            const dx = b.x - a.x
            const dz = b.z - a.z
            const l2 = dx * dx + dz * dz
            if (l2 < 1e-6) continue
            const c0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - reach - x0) / step))
            const c1 = Math.min(ncols - 1, Math.ceil((Math.max(a.x, b.x) + reach - x0) / step))
            const r0 = Math.max(0, Math.floor((Math.min(a.z, b.z) - reach - z0) / step))
            const r1 = Math.min(nrows - 1, Math.ceil((Math.max(a.z, b.z) + reach - z0) / step))
            for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
              const x = x0 + c * step
              const z = z0 + r * step
              const t = ((x - a.x) * dx + (z - a.z) * dz) / l2
              // alongside this piece only (the street's own ends included, never beyond them)…
              const endA = i === 1 ? 0 : -0.05
              const endB = i === pts.length - 1 ? 1 : 1.05
              // …but for PAST_MOUTH metres on into a tunnel mouth, as wide as a portal's face (the street and 4 m:
              // render/landmarks/sf/tunnels.ts faces reach the bore's half + 7): on the 4 m grid the step from the cut
              // up to the hill otherwise straddled the face, and the raw hill stood in front of its lower corners
              // (2026-10-14, the Stockton Tunnel's south face) — behind the face, the face hides it
              const len = Math.sqrt(l2)
              const extA = i === 1 && mouthNodes.has(e.a) ? PAST_MOUTH / len : 0
              const extB = i === pts.length - 1 && mouthNodes.has(e.b) ? PAST_MOUTH / len : 0
              if (t < endA - extA || t > endB + extB) continue
              const tt = Math.max(0, Math.min(1, t))
              const past = t < endA || t > endB
              const d = past ? Math.abs((x - a.x) * dz - (z - a.z) * dx) / len : Math.hypot(x - (a.x + dx * tt), z - (a.z + dz * tt))
              if (past && d > half + 4) continue
              if (d > reach + 12) continue
              const level = e.heights![i - 1] + (e.heights![i] - e.heights![i - 1]) * tt
              const want = level + Math.max(0, d - reach) * 2
              const k = r * ncols + c
              const street = d > half ? banks!.at(x, z) : null
              if (street !== null && street > level + 0.5) continue
              if (want < h[k]) { h[k] = want; lowered++ }
              // (and under the road itself the ground IS the road: a dip in the lidar under a cut road left it 1.5 m
              //  over a hole — Broadway's trench, 2026-10-15, tools/air-paths.ts)
              else if (d <= half && h[k] < level - 0.3) { h[k] = level - 0.3; lowered++ }
              // (an open lid's road and ramps: the ground beside them, out to the margin, IS their level — lidar's trench
              //  is deeper than the ramp laid into it, and the posts left below it stood as spikes and made the ramp a deck)
              else if (lid && d <= reach && h[k] < level) { h[k] = level; lowered++ }
            }
          }
        }
        return lowered
      }
      // the tube is 5.4 m high (tools/tunnels.ts CLEAR); 0.6 m of cover over its crown
      const OVER = 6
      /*
       * …starting this far in from a mouth (the cut is carved on 5 m past it: PAST_MOUTH). On the 4 m grid the step
       * from the cut's level up to the fill is one cell wide, and centred on the portal's face it stood in front of the
       * face's lower corners — and the portals are
       * drawn after the ground's occluder (render/city.ts `rank`), which then hid them.
       */
      const INSET = 7
      const boreEnds = new Map<number, number>()
      for (const e of boreEdges) for (const n of [e.a, e.b]) boreEnds.set(n, (boreEnds.get(n) ?? 0) + 1)
      const fill = (h: ArrayLike<number> & { [i: number]: number }, x0: number, z0: number, step: number, ncols: number, nrows: number): number => {
        let raised = 0
        for (const e of boreEdges) {
          const pts = unpackPoints(e.points)
          const half = e.width / 2 + Math.max(e.walk ?? 0, 0.6) + 1
          const cum = [0]
          for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z))
          const L = cum[cum.length - 1]
          const mouthA = (boreEnds.get(e.a) ?? 0) === 1
          const mouthB = (boreEnds.get(e.b) ?? 0) === 1
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1]
            const b = pts[i]
            const dx = b.x - a.x
            const dz = b.z - a.z
            const l2 = dx * dx + dz * dz
            if (l2 < 1e-6) continue
            const reach = half + 8
            const c0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - reach - x0) / step))
            const c1 = Math.min(ncols - 1, Math.ceil((Math.max(a.x, b.x) + reach - x0) / step))
            const r0 = Math.max(0, Math.floor((Math.min(a.z, b.z) - reach - z0) / step))
            const r1 = Math.min(nrows - 1, Math.ceil((Math.max(a.z, b.z) + reach - z0) / step))
            for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
              const x = x0 + c * step
              const z = z0 + r * step
              const t = ((x - a.x) * dx + (z - a.z) * dz) / l2
              // within the bore's own length: an edge's end is exact (a mouth), a bend between pieces overlaps a little
              if (t < (i === 1 ? 0 : -0.05) || t > (i === pts.length - 1 ? 1 : 1.05)) continue
              const tt = Math.max(0, Math.min(1, t))
              // not right at a mouth: the fill's slope down to the cut would stand in front of the portal's foot
              const s = cum[i - 1] + (cum[i] - cum[i - 1]) * tt
              if ((mouthA && s < INSET) || (mouthB && L - s < INSET)) continue
              const d = Math.hypot(x - (a.x + dx * tt), z - (a.z + dz * tt))
              if (d > reach) continue
              const level = e.heights![i - 1] + (e.heights![i] - e.heights![i - 1]) * tt
              let want = level + (e.lid ?? OVER) - Math.max(0, d - half) * 2
              /*
               * …never over a street standing on the cover (owner, 2026-10-29, Broadway at Mason: "cars all get
               * submerged here"). The streets were levelled before the fill, so where one runs over a shallow bore (surface
               * Broadway beside the Broadway Tunnel, Mason over it: 4–6 m above the tunnel's road, not the 6 m the fill
               * assumes) the fill rose a metre and more over their profiles, and the road drawn on it stood over the cars
               * driving the profile. Inside a street's corridor the ground stops at the street. (The tube is only drawn
               * from inside it, render/tunnels.ts, so its crown under the street shows nowhere.)
               */
              const street = streetsAtGrade().at(x, z)
              if (street !== null) want = Math.min(want, street)
              const k = r * ncols + c
              if (want > h[k]) { h[k] = want; raised++ }
            }
          }
        }
        return raised
      }
      const ff = fill(fineGround, fx0, fz0, FINE_STEP, fcols, frows)
      const fc = fill(ground, tx0, tz0, STEP, cols, rows)
      console.log(`  bores filled over: ${boreEdges.length} ways, ${ff} fine and ${fc} coarse samples raised to their crown`)
      /*
       * A BRIDGE OVER A CUT IS AT GRADE (2026-10-14, owner at 37.796299 −122.418596: "a somewhat broken underpass").
       * Bridges are lifted before the tunnels are found (bridgeHeights, above), and then the street under the bridge
       * had its level as "the highest ground across its corridor" — the bank, not the trench. So Hyde Street's short
       * bridge over Broadway's trench stood 4.5 m over the BANKS, every street meeting it became a ramp on a deck, and
       * the decks roofed the junction in a grey slab — while the trench was dug as well. Now: a bridge of a street
       * (not a freeway) under 80 m that crosses a CUT goes back to its heights before the lifting, with the ramps that
       * lead onto it, when the cut gives it the clearance itself (its ends at least CUT_CLEARS over the cut road).
       */
      {
        const CUT_CLEARS = 3.5
        const cutEdges = kept.filter((e) => e.cut && e.heights?.length)
        const crossesAt = (e: typeof kept[number], o: typeof kept[number]): number | null => {
          const p = unpackPoints(e.points), q = unpackPoints(o.points)
          for (let i = 1; i < p.length; i++) for (let j = 1; j < q.length; j++) {
            const r = { x: p[i].x - p[i - 1].x, z: p[i].z - p[i - 1].z }, s2 = { x: q[j].x - q[j - 1].x, z: q[j].z - q[j - 1].z }
            const den = r.x * s2.z - r.z * s2.x
            if (Math.abs(den) < 1e-9) continue
            const t = ((q[j - 1].x - p[i - 1].x) * s2.z - (q[j - 1].z - p[i - 1].z) * s2.x) / den
            const u = ((q[j - 1].x - p[i - 1].x) * r.z - (q[j - 1].z - p[i - 1].z) * r.x) / den
            if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return o.heights![j - 1] + (o.heights![j] - o.heights![j - 1]) * u
          }
          return null
        }
        const byNode = new Map<number, (typeof kept)[number][]>()
        for (const e of kept) for (const n of [e.a, e.b]) (byNode.get(n) ?? byNode.set(n, []).get(n)!).push(e)
        // back to the heights before the lifting: the same points if it kept them, else (densified by the lifting) a
        // straight line between its two ends' former heights
        const restore = (e: (typeof kept)[number], pre: number[]): number[] => {
          if (pre.length === e.heights!.length && pre.length > 2) return [...pre]
          const p = unpackPoints(e.points)
          const c = [0]
          for (let i = 1; i < p.length; i++) c.push(c[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z))
          const L = c[c.length - 1] || 1
          return c.map((d) => Math.round((pre[0] + (pre[pre.length - 1] - pre[0]) * (d / L)) * 100) / 100)
        }
        let lowered = 0, unramped = 0
        for (const b of kept) {
          if (!b.bridge || b.tunnel || !b.heights || lidDeckIds.has(b.id) || ['motorway', 'trunk', 'motorway_link', 'trunk_link'].includes(b.kind ?? '')) continue
          const pts = unpackPoints(b.points)
          // (a bridge had no heights of its own before the lifting: then the ground at its two ends, the fine ground,
          //  which inside a lidar zone has the banks as they are)
          const fineAt = (q: { x: number; z: number }): number => sampleGridF(fineGround, fcols, frows, fx0, fz0, FINE_STEP, q.x, q.z)
          const had = preBridge.get(b.id)
          const pre = had && had.length >= 2 ? had : [fineAt(pts[0]), fineAt(pts[pts.length - 1])]
          let L = 0
          for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
          if (L >= 80) continue
          let under = Infinity
          for (const c of cutEdges) { const h = crossesAt(b, c); if (h !== null) under = Math.min(under, h) }
          if (under === Infinity) continue
          // (a span's ends are on the banks; one sampled on the trench's slope is not the bank)
          const clears = Math.max(pre[0], pre[pre.length - 1]) - under
          console.log(`  bridge ${b.id} ${b.name ?? b.kind} over a cut: ends ${pre[0].toFixed(1)}/${pre[pre.length - 1].toFixed(1)}, cut road ${under.toFixed(1)}, ${clears >= CUT_CLEARS ? 'at grade' : 'stays lifted'}`)
          if (clears < CUT_CLEARS) continue
          // a deck at grade runs straight from bank to bank (its old heights followed the ground down into the trench)
          b.heights = restore(b, [pre[0], pre[pre.length - 1]])
          lowered++
          // …and the ramps that led onto it, back to theirs, chain by chain away from its ends
          const todo = [b.a, b.b]
          const seen = new Set<number>(todo)
          while (todo.length) {
            const n = todo.pop()!
            for (const r of byNode.get(n) ?? []) {
              if (!r.ramp || r.bridge) continue
              const rp = preBridge.get(r.id)
              if (!rp || !r.heights || rp.length < 2) continue
              r.heights = restore(r, rp)
              delete r.ramp
              unramped++
              for (const m of [r.a, r.b]) if (!seen.has(m)) { seen.add(m); todo.push(m) }
            }
          }
        }
        if (lowered) console.log(`  bridges over a cut at grade: ${lowered}, their ${unramped} ramp ways back on the ground`)
      }
      const nf = carve(fineGround, fx0, fz0, FINE_STEP, fcols, frows)
      const nc = carve(ground, tx0, tz0, STEP, cols, rows)
      trace('carved')
      // the tiles the cuts touch ship the fine ground, so the cutting keeps its sides
      for (const e of [...cuts, ...boreEdges]) for (const q of unpackPoints(e.points)) {
        for (const [dx, dz] of [[0, 0], [30, 0], [-30, 0], [0, 30], [0, -30]]) {
          const k = `${Math.floor((q.x + dx) / TILE)},${Math.floor((q.z + dz) / TILE)}`
          if (blockTiles.some(([tx, tz]) => `${tx},${tz}` === k)) fineTiles.add(k)
        }
      }
      shipped = new GroundModel({
        coarse: { x0: tx0, z0: tz0, step: STEP, cols, rows, h: ground },
        fine: { x0: fx0, z0: fz0, step: FINE_STEP, cols: fcols, rows: frows, h: fineGround },
        fineTiles, tiles: blockTiles, fineStep: FINE_STEP, tile: TILE, detail: quayDetail,
      })
      for (const [k, b] of shipped.blocks) {
        if (shipped.fineTiles.has(k)) { b.src = terrainFine.src; b.resM = terrainFine.resM } else { b.src = terrain.src; b.resM = terrain.resM }
      }
      console.log(`  cuts carved into the ground: ${cuts.length} streets into tunnel mouths, ${nf} fine and ${nc} coarse samples lowered`)
    }
  }
  /*
   * Elevated railways (the Loop's L) by a direct rule rather than the street chains: an L structure runs at
   * a steady 6–7 m, and chained through a whole loop of track the street rule took the worst crossing
   * anywhere and put the entire L 24 m up. The ground under it is taken as the highest within 40 m along the
   * track, so the deck does not dip into the river bed where it crosses the river, then smoothed.
   */
  /*
   * Paris: tools/rail-levels.ts `levelParisRails`, the whole stage: which sunk ways the ground has, which is on top at a crossing, decks straight from bank to bank or lifted as a viaduct,
   * and a viaduct's true ends down to the ground, all on the 4 m ground its tiles ship. tools/rail-audit.ts dry-runs the same code.
   */
  let railDecks = 0
  if (spec.region === 'paris') {
    let nextRail = 900_000_000_000
    const got = levelParisRails(rails, sunkRails, buriedRails, kept, groundFine, (beds) => {
      const posts = bedPosts(beds, fx0, fz0, FINE_STEP)
      let moved = 0
      for (const [k, y] of posts) {
        const [c, r] = k.split(',').map(Number)
        if (c < 0 || r < 0 || c >= fcols || r >= frows) continue
        fineGround[r * fcols + c] = y
        moved++
      }
      shipped = new GroundModel({
        coarse: { x0: tx0, z0: tz0, step: STEP, cols, rows, h: ground },
        fine: { x0: fx0, z0: fz0, step: FINE_STEP, cols: fcols, rows: frows, h: fineGround },
        fineTiles, tiles: blockTiles, fineStep: FINE_STEP, tile: TILE, detail: quayDetail,
      })
      for (const [k2, b] of shipped.blocks) {
        if (shipped.fineTiles.has(k2)) { b.src = terrainFine.src; b.resM = terrainFine.resM } else { b.src = terrain.src; b.resM = terrain.resM }
      }
      return moved
    }, () => nextRail++)
    rails.length = 0
    rails.push(...got.rails)
    for (const r of got.roofed) buriedRails.push({ points: r.points })
    railDecks = got.viaducts
    const shells = stationShells(buildings, rails, (streetRegion.viaductStations ?? []).map((q) => proj.toLocal(q)))
    if (shells.size) {
      const stay = buildings.filter((b) => !shells.has(b.id) && !(b.partOf !== undefined && shells.has(b.partOf)))
      console.log(`  ${buildings.length - stay.length} station shells over the viaducts left to the viaducts' own canopies`)
      buildings.length = 0
      for (const b of stay) buildings.push(b)
    }
    console.log(`  rail crossings: ${got.lying} of ${sunkRails.length} sunk railways in a cutting or beside tracks in the open, ${got.holes} decks over holes in the ground, ${got.posts} ground posts laid to a track's level, ${got.spans} untagged bridges over streets, ${got.over} streets made bridges over cuttings, ${got.straight} decks on their track's level, ${got.flat} crossings with no bank to stand on`)
    console.log(`  streets dipping over a railway run straight: ${got.dips}; ${got.eased} viaducts eased down at their true ends`)
  } else {
    /*
     * A track OSM calls sunk lies in its cutting where the ground has one: IGN's lidar does, 5.5 m under the street bridges
     * over a main line (the median; 14 m at the Batignolles), and the track drapes down into it. Where the ground shows
     * none (the RER C under the Quai André-Citroën, roofed over: the lidar reads the roof) it stays undrawn.
     */
    {
      let lying = 0
      for (const r of sunkRails) {
        const ps = unpackPoints(r.points)
        const depths: number[] = []
        for (let i = 1; i < ps.length; i++) {
          const dx = ps[i].x - ps[i - 1].x, dz = ps[i].z - ps[i - 1].z, len = Math.hypot(dx, dz)
          for (let d = 15; d < len; d += 30) {
            const x = ps[i - 1].x + (dx / len) * d, z = ps[i - 1].z + (dz / len) * d
            const side = (s: number): number => Math.max(...[25, 40, 60, 80].map((o) => groundFine(x + (s * dz / len) * o, z - (s * dx / len) * o)))
            depths.push(Math.min(side(1), side(-1)) - groundFine(x, z))
          }
        }
        depths.sort((a, b) => a - b)
        if (depths.length && depths[depths.length >> 1] >= 3) { rails.push(r); lying++ }
      }
      if (sunkRails.length) console.log(`  ${lying} of ${sunkRails.length} sunk railways lie in a cutting the ground has`)
    }
    const levelled = new Set<PackedRail>()
    for (const r of rails) {
      if (!r.bridge || levelled.has(r)) continue
      const ps = unpackPoints(r.points)
      const cum = [0]
      for (let i = 1; i < ps.length; i++) cum.push(cum[i - 1] + Math.hypot(ps[i].x - ps[i - 1].x, ps[i].z - ps[i - 1].z))
      const g = ps.map((q) => groundAt(q.x, q.z))
      // a metre and a half per layer at most: Paris's métro viaducts are layer 2, and 5.5 m a layer put Line 6
      // twelve metres over the Boulevard de Grenelle, out of every view of it (BUGS.md #34)
      const lift = 6.5 + 1.5 * Math.min(2, Math.max(0, (r.layer ?? 1) - 1))
      const high = ps.map((_, i) => {
        let m = g[i]
        for (let k = 0; k < ps.length; k++) if (Math.abs(cum[k] - cum[i]) <= 40) m = Math.max(m, g[k])
        return m + lift
      })
      r.heights = high.map((_, i) => {
        let sum = 0
        let n = 0
        for (let k = 0; k < ps.length; k++) if (Math.abs(cum[k] - cum[i]) <= 20) { sum += high[k]; n++ }
        return Math.round((sum / n) * 100) / 100
      })
      railDecks++
    }
    /*
     * …and a deck's TRUE END comes down to the ground (owner, 2026-10-30: "the train only bridge at 48.852558, 2.285579 looks
     * great, but has a dropoff at the end"; Bir-Hakeim "is discontinuous on one end"). The lift above runs the whole length of
     * the way, so where the next track is not a bridge — a line going into a hill or a cutting — the deck stopped in the air.
     * An end with no other bridge rail's end within 5 m eases to the ground over up to 80 m.
     */
    {
      const decks2 = rails.filter((r) => r.bridge && r.heights)
      const ends = decks2.filter((r) => !levelled.has(r)).map((r) => { const p = unpackPoints(r.points); return { r, a: p[0], b: p[p.length - 1] } })
      const joined = (me: PackedRail, q: { x: number; z: number }): boolean => ends.some((o) => o.r !== me
        && (Math.hypot(o.a.x - q.x, o.a.z - q.z) < 5 || Math.hypot(o.b.x - q.x, o.b.z - q.z) < 5))
      let eased = 0
      for (const { r, a, b } of ends) {
        const ps = unpackPoints(r.points)
        const cum = [0]
        for (let i = 1; i < ps.length; i++) cum.push(cum[i - 1] + Math.hypot(ps[i].x - ps[i - 1].x, ps[i].z - ps[i - 1].z))
        const L = cum[cum.length - 1]
        const EASE = Math.min(80, L * 0.45)
        const atA = !joined(r, a), atB = !joined(r, b)
        if (!atA && !atB) continue
        r.heights = r.heights!.map((h, i) => {
          const d = Math.min(atA ? cum[i] : Infinity, atB ? L - cum[i] : Infinity)
          if (d >= EASE) return h
          const g = groundAt(ps[i].x, ps[i].z)
          return Math.round((g + (h - g) * (d / EASE)) * 100) / 100
        })
        eased++
      }
      if (eased) console.log(`  ${eased} rail decks eased down to the ground at their true ends`)
    }
  }
  console.log(`  bridges: ${decks.bridges} deck edges, ${decks.ramps} ramps; ${railDecks} elevated rail ways`)
  /*
   * THE PONT NEUF CROSSES THE CITÉ AT ONE LEVEL (owner, 2026-10-31: "the bridge is really messed up where it goes over the island. there are a bunch of
   * stray staircases imported from osm around the statue"). Over the island it is mapped as streets at grade, with foot bridges and tunnels between the
   * steps round Henri IV, and the ramps up to those stood the road 5 m over both of its own arms. Every way in the ring takes the bridge's level, easing back to
   * its own over `fade` outside; and the terre-plein's steps and walks go, for the model that draws the platform (landmarks/paris/bugs/terre-plein.ts).
   */
  for (const f of streetRegion.flatStreets ?? []) {
    const flat = (ring: [number, number][]): number[] => ring.flatMap(([lat, lon]) => { const q = proj.toLocal({ lat, lon }); return [q.x, q.z] })
    const ring = flat(f.ring)
    const heads: number[] = []
    for (const e of kept) {
      if (!e.bridge || e.name !== f.deck || !e.heights) continue
      unpackPoints(e.points).forEach((q, i) => { if (inRing(ring, q.x, q.z)) heads.push(e.heights![i]) })
    }
    if (!heads.length) { console.warn(`  ${f.name}: no deck in the ring`); continue }
    heads.sort((a, b) => a - b)
    const y = heads[heads.length >> 1]
    const FADE = f.fade ?? 18
    const off = (x: number, z: number): number => {
      let d = Infinity
      for (let i = 0; i < ring.length; i += 2) {
        const j = (i + 2) % ring.length, dx = ring[j] - ring[i], dz = ring[j + 1] - ring[i + 1]
        const t = Math.max(0, Math.min(1, ((x - ring[i]) * dx + (z - ring[i + 1]) * dz) / (dx * dx + dz * dz || 1)))
        d = Math.min(d, Math.hypot(ring[i] + dx * t - x, ring[i + 1] + dz * t - z))
      }
      return d
    }
    const platform = f.clearWalks ? flat(f.clearWalks) : null
    let flattened = 0, cleared = 0, w = 0
    for (const e of kept) {
      const ps = unpackPoints(e.points)
      const within = ps.filter((q) => inRing(ring, q.x, q.z)).length
      const onPlatform = platform ? ps.filter((q) => inRing(platform, q.x, q.z)).length : 0
      const walk = e.foot || e.kind === 'steps'
      if (walk && (onPlatform * 2 >= ps.length || (e.kind === 'steps' && within > 0))) { cleared++; continue }
      kept[w++] = e
      if (!e.heights || (within === 0 && !ps.some((q) => off(q.x, q.z) < FADE))) continue
      e.heights = e.heights.map((h, i) => {
        const q = ps[i]
        const k = inRing(ring, q.x, q.z) ? 1 : Math.max(0, 1 - off(q.x, q.z) / FADE)
        return Math.round((h + (y - h) * k) * 100) / 100
      })
      if (within === ps.length) delete e.ramp
      flattened++
    }
    kept.length = w
    console.log(`  ${f.name}: ${flattened} ways at ${y.toFixed(2)} m, ${cleared} walks and steps gone`)
  }
  // walks on a model's own paved levels (region `modelWalks`: the Trocadéro's parvis, whose paths were draped on the ground under its paving)
  for (const m of streetRegion.modelWalks ?? []) {
    const c = proj.toLocal({ lat: m.at[0], lon: m.at[1] }), r = (m.rotateDeg * Math.PI) / 180, lift = m.lift ?? 0.06
    const levelAt = (x: number, z: number): number | null => {
      const dx = x - c.x, dz = z - c.z
      const lx = dx * Math.cos(r) - dz * Math.sin(r), lz = dx * Math.sin(r) + dz * Math.cos(r)
      for (const [x0, x1, z0, z1, ya, yb] of m.levels) {
        if (lx >= x0 && lx <= x1 && lz >= z0 && lz <= z1) return m.baseY + ya + ((yb - ya) * (lz - z0)) / (z1 - z0 || 1) + lift
      }
      return null
    }
    let lifted = 0, cleared = 0, w = 0
    for (const e of kept) {
      const walk = e.foot || e.kind === 'steps'
      const ps = walk ? unpackPoints(e.points) : []
      const ys = ps.map((q) => levelAt(q.x, q.z))
      const on = ys.filter((y) => y !== null).length
      if (walk && e.kind === 'steps' && on * 2 >= ps.length) { cleared++; continue }
      kept[w++] = e
      if (!walk || !on || !e.heights) continue
      e.heights = e.heights.map((h, i) => ys[i] ?? h)
      delete e.ramp
      lifted++
    }
    kept.length = w
    console.log(`  ${m.name}: ${lifted} walks on its levels, ${cleared} steps gone`)
  }
  /*
   * Walks on a viaduct's roof (BUGS.md #32): the Coulée Verte runs along the top of the Viaduc des Arts, which
   * OSM gives no height; its ways came out at street level, inside the viaduct, with only its street crossings
   * standing up as lone footbridges. Each runs at the region's height over the ground, smoothed along it, and
   * where it is not over a building it is a bridge (render/bridges.ts draws the slab and piers).
   */
  const walks = new Map((streetRegion.elevatedWalks ?? []).map((w) => [w.name, w]))
  let lifted = 0
  if (walks.size) {
    const overBuilding = (x: number, z: number): boolean => buildings.some((b) => {
      const r = b.ring
      let o = false
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
      }
      return o
    })
    for (const e of kept) {
      const w = e.name ? walks.get(e.name) : undefined
      if (w === undefined) continue
      const h = w.height
      const ps = unpackPoints(e.points)
      // (the Coulée verte's name runs on past the Viaduc des Arts to the Bois de Vincennes, on the ground and in its tunnels)
      if (w.eastTo !== undefined && ps[Math.floor(ps.length / 2)].x > proj.toLocal({ lat: spec.centre.lat, lon: w.eastTo }).x) continue
      e.heights = ps.map((q) => Math.round((groundAt(q.x, q.z) + h) * 100) / 100)
      const mid = ps[Math.floor(ps.length / 2)]
      e.bridge = !overBuilding(mid.x, mid.z) || undefined
      lifted++
    }
  }
  if (lifted) console.log(`  ${lifted} walks lifted onto their viaduct`)
  {
    const o = openElevatedWalks(kept, streetRegion.elevatedWalks ?? [], (lon) => proj.toLocal({ lat: spec.centre.lat, lon }).x)
    if (o.opened) console.log(`  elevated walks ridden: ${o.opened} ways, ${o.flights} flights up, ${o.ramped} ways ramped down`)
  }

  // ---- named places, for the signs
  const FOOD = new Set(['cafe', 'restaurant', 'bar', 'pub', 'bakery'])
  const CULTURE = new Set(['theatre', 'cinema', 'library', 'museum', 'gallery', 'attraction'])
  const pois: PackedPoi[] = []
  const seen = new Set<string>()
  /*
   * In a district whose shops sign in another language (Chinatown: region shopDistricts), a place OSM also names in
   * that language shows that name on its board half the time — the real Chinese names (owner, 2026-10-16: "many signs
   * in chinese. not all ... maybe half").
   */
  const zhRings = (region(spec.region).shopDistricts ?? []).filter((d) => d.lang === 'zh').map((d) => d.ring)
  const inZh = (lat: number, lon: number): boolean => zhRings.some((r) => {
    let c = false
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][0] > lat) !== (r[j][0] > lat) && lon < ((r[j][1] - r[i][1]) * (lat - r[i][0])) / (r[j][0] - r[i][0]) + r[i][1]) c = !c
    return c
  })
  let zhNamed = 0
  for (const n of nodes) {
    let name = n.tags.name
    const zh = n.tags['name:zh-Hant'] ?? n.tags['name:yue'] ?? n.tags['name:zh']
    if (name && zh && zh.length <= 12 && inZh(n.lat, n.lon) && (n.id % 2 === 0)) { name = zh; zhNamed++ }
    if (!name || name.length > 26) continue
    const amenity = n.tags.amenity ?? n.tags.tourism ?? ''
    if (!n.tags.shop && !amenity) continue
    const p = proj.toLocal(n)
    // one of each name is plenty: a chain with six branches in one neighbourhood is not six signs
    const key = `${name}|${Math.round(p.x / 40)}|${Math.round(p.z / 40)}`
    if (seen.has(key)) continue
    seen.add(key)
    pois.push({
      x: Math.round(p.x * 10) / 10, z: Math.round(p.z * 10) / 10, name,
      kind: n.tags.shop ? 'shop' : FOOD.has(amenity) ? 'food' : CULTURE.has(amenity) ? 'culture' : 'service',
    })
  }
  console.log(`  ${pois.length} named places${zhNamed ? ` (${zhNamed} in Chinatown by their Chinese name)` : ''}`)

  /*
   * ---- names on the buildings that matter: a plate on the street-facing wall, and for the top tier a
   * totem at the kerb. Ranked by tools/landmark-rank.ts, capped at LANDMARK_CAP (the plate texture's cells).
   * A building with no wall facing a street gets nothing — a plate on a courtyard wall helps nobody.
   */
  const surfaceEdges = kept.filter((e) => !e.tunnel && ((e.layer ?? 0) >= 0 || e.bridge))
  const landmarks: PackedLandmark[] = []
  const seenName = new Set<string>()
  for (const n of named.sort((a, b) => score(b.tags) - score(a.tags))) {
    if (landmarks.length >= LANDMARK_CAP) break
    // a church mapped as three parts is one name, once
    if (seenName.has(n.tags.name)) continue
    const front = frontageOf(n.ring, surfaceEdges)
    if (!front) continue
    seenName.add(n.tags.name)
    const tier: 1 | 2 = score(n.tags) >= 5 || n.tags.wikidata ? 1 : 2
    const c = centroidOf(n.ring)
    const r2 = (v: number): number => Math.round(v * 100) / 100
    const totem = tier === 1 ? totemPoint(front, surfaceEdges) : null
    landmarks.push({
      id: n.id, name: n.tags.name, kind: landmarkKind(n.tags), tier, x: r2(c.x), z: r2(c.z),
      frontage: { x: r2(front.x), z: r2(front.z), nx: r2(front.nx), nz: r2(front.nz), len: r2(front.len) },
      ...(totem ? { totem: { x: r2(totem.x), z: r2(totem.z) } } : {}),
    })
  }
  console.log(`  landmarks named: ${landmarks.length} (${landmarks.filter((l) => l.tier === 1).length} tier 1, `
    + `${landmarks.filter((l) => l.totem).length} totems) of ${named.length} candidates`)

  // ---- the fringe: the buildings beyond the box, as massing, so the city does not end in a field
  const fringe: PackedFringe[] = []
  {
    const cityIds = new Set(buildings.map((b) => b.id))
    /*
     * In four strips round the box — north and south the full width, east and west between them — because
     * the whole 2.8 km square in one query timed out on every Overpass server. Each strip is cached on its own.
     */
    const inner = detailBboxOf(spec)
    const outer = detailBboxOf(spec, FRINGE)
    const strips: Bbox[] = [
      { south: inner.north, north: outer.north, west: outer.west, east: outer.east },
      { south: outer.south, north: inner.south, west: outer.west, east: outer.east },
      { south: inner.south, north: inner.north, west: outer.west, east: inner.west },
      { south: inner.south, north: inner.north, west: inner.east, east: outer.east },
    ]
    const fringeWays: OsmWay[] = []
    const seen = new Set<number>()
    for (const strip of strips) {
      const f = await overpassTiled(fringeQuery, strip, 1500, 4000).catch((e) => {
        console.warn(`  fringe strip: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
        return { ways: [] as OsmWay[] }
      })
      for (const w of f.ways) if (!seen.has(w.id)) { seen.add(w.id); fringeWays.push(w) }
    }
    /*
     * …and round each DETAIL REGION, `REGION_FRINGE` deep (owner, 2026-11-04: "we'll need low-detail or fringe massing
     * around the new sections"): the towns beside the parks as massing, so the forest does not end in a field. Only
     * outside every region and the detail box — inside them the city's own buildings stand.
     */
    const inDetail = detailTest(spec)
    const regionFringe = new Set<number>()
    for (const r of regionsOf(spec)) {
      const f = await overpassTiled(fringeQuery, regionBbox(r, REGION_FRINGE), 1500, 4000).catch((e) => {
        console.warn(`  fringe round ${r.name}: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
        return { ways: [] as OsmWay[] }
      })
      for (const w of f.ways) {
        if (seen.has(w.id) || !w.geometry || w.geometry.length < 4) continue
        const g = w.geometry.slice(0, -1)
        const lat = g.reduce((a, q) => a + q.lat, 0) / g.length, lon = g.reduce((a, q) => a + q.lon, 0) / g.length
        if (inDetail(lat, lon) || !inDetail(lat, lon, REGION_FRINGE)) continue
        seen.add(w.id); fringeWays.push(w); regionFringe.add(w.id)
      }
    }
    // the box the strips' buildings must lie outside: the DETAIL box where the box was grown for regions (Paris's grew
    // over its own west strip), the box itself elsewhere (San Francisco's east strip is inside its box, and stays out)
    const shut = regionsOf(spec).length ? detailOf(spec) : ext
    for (const w of fringeWays) {
      if (!w.geometry || w.geometry.length < 4 || w.tags['building:part']) continue
      // not one the city already has: a building straddling the box's edge came back from both queries
      if (cityIds.has(w.id)) continue
      const ring = w.geometry.slice(0, -1).map((g) => proj.toLocal(g))
      if (ring.length < 3 || area(ring) < 20) continue
      const c = centroidOf(ring)
      // only outside the box: inside it the city's own buildings stand
      if (!regionFringe.has(w.id) && c.x >= -shut.west && c.x <= shut.east && c.z >= -shut.south && c.z <= shut.north) continue
      const ccwRing = ccw(ring)
      const own = withLevels(w.tags, ring, w.id)
      const p = getBuildingParamsFromOSMTags(own.tags) as {
        buildingLevels?: number; buildingHeight?: number; buildingFacadeMaterial?: string
        buildingRoofType?: string; buildingRoofHeight?: number; buildingRoofDirection?: number
      }
      const styleId = styleFor(w.tags, () => chooseStyle({ levels: p.buildingLevels, height: p.buildingHeight,
        material: p.buildingFacadeMaterial, building: w.tags.building }, spec.styles, w.id))
      const height = p.buildingHeight ?? (p.buildingLevels ?? reg.defaultLevels.residential) * 3.2
      const roof = roofFor(w.tags, p, styleId, ccwRing, w.id)
      fringe.push({ id: w.id, ring: packPoints(ccwRing), height: Math.round(height * 10) / 10, style: styleId,
        roof: roof.roof, roofHeight: roof.roofHeight, roofColour: roof.roofColour })
    }
    console.log(`  fringe: ${fringe.length} buildings in the ${FRINGE} m round the box`
      + (regionFringe.size ? `, ${regionFringe.size} fetched round the detail regions` : ''))
  }

  // ---- street furniture, from its own small query
  const furniture: PackedFurniture[] = []
  {
    // optional: a busy Overpass must not stop a bake, it only leaves the street furniture out
    const f = await overpassDetail(furnitureQuery, spec).catch((e) => {
      console.warn(`  furniture: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
      return { nodes: [] as { lat: number; lon: number; tags: Record<string, string> }[] }
    })
    const parisStreet = streetRegion.pointFurniture.parisStreet === true
    for (const n of f.nodes) {
      const t = n.tags
      const kind: PackedFurniture['kind'] | null = t.railway === 'subway_entrance' ? 'metro'
        : t.amenity === 'drinking_water' ? 'fountain'
        : t.advertising === 'column' ? 'column'
        : t.shop === 'kiosk' || t.amenity === 'kiosk' ? 'kiosk'
        : t.amenity === 'bicycle_rental' ? 'bikeshare'
        : t.highway === 'traffic_signals' ? 'signals'
        : t.railway === 'tram_stop' ? 'tramstop'
        /*
         * BUGS.md #152. OSM's `advertising=billboard` covers everything from a highway bulletin to a poster
         * frame screwed to a wall, and us-furniture.ts draws ONE thing: a 14.6 x 4.3 m freestanding bulletin
         * on a steel post. San Francisco's cut has 103 of these nodes and only 19 are tagged as standing on
         * their own (`support=ground|pole|pedestal`); 15 say outright they are on a wall or roof, and 69 say
         * nothing. Drawing all of them put big roadside hoardings all over a city where, as the owner puts
         * it, "freestanding billboards are rare".
         *
         * So the freestanding form is drawn only where OSM says it stands freely. The rest are dropped
         * rather than guessed at — a wall-mounted ad wants to be painted on the wall it is on, which is the
         * mural path (SignSource {kind:'image'}), and that is still dead code.
         */
        : t.advertising === 'billboard' && /^(ground|pole|pedestal)$/.test(t.support ?? '') ? 'billboard'
        : t.highway === 'stop' ? 'stop'
        : t.highway === 'bus_stop' ? 'busstop'
        // (bike parking at the kerb, Paris's, almost always full — owner, 2026-10-29: drawn where the region asks)
        : t.amenity === 'bicycle_parking' && t.covered !== 'yes' && t.indoor !== 'yes' && (t.bicycle_parking ?? 'stands') !== 'building' ? 'bikeparking'
        : t.amenity === 'motorcycle_parking' && t.covered !== 'yes' && t.indoor !== 'yes' && t.parking !== 'underground' ? 'motoparking'
        : t.amenity === 'post_box' ? 'postbox'
        : t.emergency === 'fire_hydrant' ? 'hydrant'
        // the street fire alarm box (render/us-furniture.ts); one inside a building is a pull station on a wall
        : t.emergency === 'fire_alarm_box' && t.indoor !== 'yes' ? 'callbox'
        // a street clock on a post (owner, 2026-10-04: the sidewalk clock by Union Square); a wall clock needs its wall
        : t.amenity === 'clock' && /^(pole|ground|pedestal)$/.test(t.support ?? '') ? 'clock'
        : parisStreet ? parisStreetKind(t) : null
      if (!kind) continue
      const p = proj.toLocal(n)
      const wallace = kind === 'fountain' && /wallace/i.test(`${t.name ?? ''} ${t.brand ?? ''} ${t.model ?? ''} ${t['fountain'] ?? ''} ${t.description ?? ''}`)
      // (a bus stop with its shelter: OSM's shelter=yes, two in three of Paris's — the rest are the post alone)
      const shelter = kind === 'busstop' && t.shelter === 'yes'
      furniture.push({ x: Math.round(p.x * 10) / 10, z: Math.round(p.z * 10) / 10, kind, ...(wallace ? { wallace: true as const } : {}),
        ...(shelter ? { shelter: true as const } : {}) })
    }
    /*
     * …and what stands where the visitors are, which OSM does not map; no statue on a modelled landmark's ground, which draws
     * its own (a palace's court and a park's model carry theirs), and none in a claimed way's ring.
     */
    if (parisStreet) {
      for (const s of PARIS_STANDS) {
        const p = proj.toLocal(s)
        furniture.push({ x: Math.round(p.x * 10) / 10, z: Math.round(p.z * 10) / 10, kind: s.kind })
      }
      const spots = landmarkSpots(spec.region ?? spec.id).map((s) => ({ ...proj.toLocal({ lat: s.lat, lon: s.lon }), r: s.r }))
      const claimed = landmarkClaims(spec.region ?? spec.id)
      const rings = ways.filter((w) => claimed.has(w.id) && w.geometry && w.geometry.length >= 4).map((w) => w.geometry!.slice(0, -1).map((g) => proj.toLocal(g)))
      const figures = new Set(['statue', 'bust', 'sculpture'])
      // (and a roundabout's island has its monument: render/paris/roundabout-monuments.ts)
      const isles = roundabouts.map((q) => ({ ...proj.toLocal({ lat: q.lat, lon: q.lon }), r: q.r }))
      // (…and none out in the river: a bridge's own reliefs are nodes on its face, the Alexandre III's nymphs and the Alma's Zouave, and each stood on a white plinth
      //  on the water, mid-stream. The structure has them: render/bridge-structures.ts. The Seine audit, 2026-10-30)
      const inRiver = (x: number, z: number): boolean => waterBodies.some((w) => Math.abs(area(w.ring)) >= 300_000 && pointInRing(w.ring, x, z))
      const clear = furniture.filter((x) => !figures.has(x.kind) || !(spots.some((s) => Math.hypot(s.x - x.x, s.z - x.z) < s.r + 2)
        || isles.some((s) => Math.hypot(s.x - x.x, s.z - x.z) < s.r) || rings.some((r) => pointInRing(r, x.x, x.z)) || inRiver(x.x, x.z)))
      console.log(`  ${furniture.length - clear.length} statues on modelled ground left to the models`)
      furniture.length = 0
      for (const x of clear) furniture.push(x)
    }
    const count = (k: string): number => furniture.filter((x) => x.kind === k).length
    if (parisStreet) console.log(`  paris street: ${count('litter')} litter hoops, ${count('recycling')} glass bells, ${count('sanisette')} sanisettes, ${count('statue')} statues, ${count('bust')} busts, ${count('sculpture')} sculptures, ${count('market')} markets`)
    console.log(`  furniture: ${count('metro')} métro entrances, ${count('fountain')} fountains `
      + `(${furniture.filter((x) => x.wallace).length} Wallace), ${count('column')} columns, ${count('kiosk')} kiosks, `
      + `${count('bikeshare')} bike docks, ${count('signals')} signal nodes, ${count('tramstop')} tram stops, `
      + `${count('billboard')} billboards, ${count('stop')} stop signs, ${count('busstop')} bus stops, ${count('postbox')} post boxes, ${count('hydrant')} hydrants, ${count('callbox')} fire alarm boxes, `
      + `${count('bikeparking')} bike parkings, ${count('motoparking')} two-wheeler parkings`)
  }

  const trees = nodes.filter((n) => n.tags.natural === 'tree')
    .flatMap((n) => { const p = proj.toLocal(n); return [Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10] })
  console.log(`  ${areas.length} areas, ${trees.length / 2} mapped trees`)

  /*
   * ---- OPEN COUNTRY, AT SOURCE (docs/PARKS.md; BUGS.md #201, #202).
   *
   * The park already has its own rendering path (`src/city/park-area.ts`), applied per tile as it streams
   * in, and it will stay: it is what makes the rule true of a package baked before the rule existed. But a
   * package that ships a sixteen-metre carriageway with 3.8 m of pavement either side through the middle of
   * Golden Gate Park is shipping a wrong answer and asking the renderer to correct it every time, and every
   * other consumer of the package — the ride graph built four lines below, the audits, anything written
   * later — reads the wrong number. So the SAME functions run here, over the whole city, and the bake emits
   * what the place actually is.
   *
   * Why the same functions and not a second implementation of the rule: two copies of "how wide is a park
   * road" drift, and the drift is invisible until somebody stands in a square and cannot say which layer is
   * lying. `parkEdge` is imported, not reimplemented; the photographed corrections in `park-roads.json` are
   * read by it, so a row added to that table corrects the bake and the renderer together.
   *
   * The mask is per RING here rather than per tile (`cityParkMask`), because a bake holds whole parks.
   */
  {
    const style = reg.park
    const mask = cityParkMask(areas, PARK_RING_M2)
    if (mask) {
      const midIn = (points: number[]): boolean => {
        const i = ((points.length / 2) >> 1) * 2
        return mask(points[i], points[i + 1])
      }
      let touched = 0
      let fixed = 0
      for (let i = 0; i < kept.length; i++) {
        if (!midIn(kept[i].points)) continue
        if (roadFix(kept[i])) fixed++
        // `park` is a per-tile render-time flag by contract (city/package.ts) and is not baked into the file
        const { park: _park, ...e } = parkEdge(kept[i], style)
        kept[i] = e
        touched++
      }
      /*
       * And the furniture. The owner counted *"thousands of parking meters"* in the park — those are
       * procedural and are already gone with the pavements — but what IS baked here is stop signs, bus
       * stops, hydrants and signal nodes, and a national park has none of them. `keepFurniture` is the
       * "unless something says otherwise" half of the inverted default, and it is the region's list, not
       * this file's.
       */
      const keep = new Set(style.keepFurniture)
      const before = furniture.length
      /*
       * SIGNALS ARE LEFT IN, and that is not an oversight. A `highway=traffic_signals` node is not drawn
       * where it stands; `render/city.ts` uses it to decide whether a JUNCTION is lit, and the park's rule
       * keeps the lights where a classified through-route crosses — Crossover Drive really does have
       * signals. Dropping the nodes here would empty `signalGrid` inside the park and take those lights
       * with them, which is precisely the bake/render drift this whole block exists to avoid. The bake does
       * not have the junction context to make that call, so it does not make it.
       */
      const outside = furniture.filter((f) => keep.has(f.kind) || f.kind === 'signals' || !mask(f.x, f.z))
      furniture.length = 0
      for (const f of outside) furniture.push(f)
      console.log(`  open country: ${touched} ways restyled at source (${fixed} from a photographed row in `
        + `city/park-roads.json), ${before - outside.length} pieces of street furniture dropped inside it`)
    }
  }

  /*
   * KERB-SIDE FURNITURE ON THE PAVEMENT (2026-10-15, owner at 37.788538 −122.406212: "posters hanging in free spaces in
   * the middle of the road"). OSM's node for a poster column, a post box, a hydrant is often in the carriageway. The
   * renderer dropped such a column — and the posters layer, which reads the same nodes, still hung its posters round
   * the column that was not there. Settled once, here, so every layer agrees: moved onto the nearest pavement
   * (city/carriageways.ts `toPavement`), and dropped when there is none to move to.
   */
  {
    const KERB_ONLY = new Set(['column', 'kiosk', 'postbox', 'hydrant', 'callbox', 'bikeshare', 'bikeparking', 'motoparking', 'fountain', 'billboard',
      'litter', 'recycling', 'sanisette', 'crepes', 'glaces', 'souvenirs'])
    const lanes = new Carriageways(kept.filter((e) => !e.bridge && !e.tunnel && !e.bore))
    let moved = 0, dropped = 0
    const keepF = furniture.filter((f) => {
      if (!KERB_ONLY.has(f.kind) || lanes.whyNoFurniture(f.x, f.z) === null) return true
      const q = lanes.toPavement(f.x, f.z)
      if (lanes.whyNoFurniture(q.x, q.z) !== null) { dropped++; return false }
      f.x = Math.round(q.x * 10) / 10
      f.z = Math.round(q.z * 10) / 10
      moved++
      return true
    })
    furniture.length = 0
    for (const f of keepF) furniture.push(f)
    console.log(`  kerb-side furniture: ${moved} moved out of the road onto the pavement, ${dropped} with none near dropped`)
  }

  /*
   * NEVER UNDER THE GROUND (owner, 2026-10-16, BUGS.md #298: "more underground path here"; "we should do some checks
   * for underground paths on steep hills"). The renderer draws the ground at the higher of the hillside and a street's
   * level (city/terrain.ts `heightAt`) — it lifts the ground to a street, never cuts it down to one — so a street the
   * smoothing above and the junction easing sag below a crest is drawn buried, the rider riding inside the hill (Mason
   * between Pine and Bush, 2.1 m down; tools/underground.ts found 13 km of such stretches, most on grades over 10 %).
   * Last of all the passes that set heights (the bridges and the decks regrade against the COARSE grid, and parks are
   * drawn on the fine one, so a lift any earlier was undone there), against the ground as shipped: every surface way is
   * lifted back onto the ground where it lies more than 0.3 m under it: the same ground at a shared
   * node for every way that ends there, so junctions still agree. Tunnels, bores, cuts and underground layers keep their
   * depth.
   */
  {
    let lifted = 0, inserted = 0
    for (const e of kept) {
      if (underground(e) || e.tunnel || e.bore || e.cut || (e.layer ?? 0) < 0 || !e.heights) continue
      const pts = unpackPoints(e.points)
      const hs = e.heights
      const G = (x: number, z: number): number => shipped.heightAt(x, z)
      let moved = false
      // (and between the vertices: where the ground humps over the straight chord between two of them, a vertex on the
      // ground at the hump's top — a 7 m chord across a crest was still 2 m into the hill)
      const outP: { x: number; z: number }[] = [], outH: number[] = []
      for (let i = 0; i < pts.length; i++) {
        if (i > 0) {
          const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.z - a.z)
          let worst = 0, at = -1
          for (let k = 1; k * 2 < L; k++) {
            const t = (k * 2) / L
            const d = G(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t) - (hs[i - 1] + (hs[i] - hs[i - 1]) * t)
            if (d > worst) { worst = d; at = t }
          }
          if (worst > 0.3 && at > 0) {
            const q = { x: a.x + (b.x - a.x) * at, z: a.z + (b.z - a.z) * at }
            outP.push(q); outH.push(Math.round(G(q.x, q.z) * 100) / 100); inserted++; moved = true
          }
        }
        const g = G(pts[i].x, pts[i].z)
        outP.push(pts[i])
        if (hs[i] < g - 0.3) { outH.push(Math.round(g * 100) / 100); moved = true } else outH.push(hs[i])
      }
      if (moved) { e.points = packPoints(outP); e.heights = outH; lifted++ }
    }
    console.log(`  ${lifted} ways lifted out of the ground (more than 0.3 m under it), ${inserted} vertices added on humps`)
    // (the lift can take a deck's end up from the way that met it, so they meet once more: the Alma's and the Carrousel's cycleways)
    const met = meetDecks(kept.filter((e) => !e.authored && !bandAny(e)), true, spec.region === 'paris')
    if (met.length) console.log(`  ${met.length} ways met their decks again after the lift`)
  }
  /*
   * A FOOTWAY ON A STREET'S CENTRELINE is the same alley mapped twice (owner, 2026-10-17, BUGS.md #307: "a street that has
   * a fire extinguisher and people walking right down the center"): OSM draws Spofford, Lynch, Water, Genoa Place… as a
   * street AND as a footway along its middle, and the crowd walked that footway — down the middle of the traffic — with
   * the furniture on it. A foot way 80 % of whose length lies within 2 m of a street's centreline (a street under 14 m
   * wide, at grade) is dropped; the street stays, its sidewalks carry the walkers. tools/footways-in-road.ts lists them.
   */
  {
    const CELL = 50
    const grid = new Map<string, [number, number, number, number][]>()
    for (const e of kept) {
      if (e.foot || e.bridge || e.tunnel || (e.layer ?? 0) !== 0 || e.width >= 14 || e.width < 3) continue
      const p = unpackPoints(e.points)
      for (let i = 1; i < p.length; i++) {
        const sgm: [number, number, number, number] = [p[i - 1].x, p[i - 1].z, p[i].x, p[i].z]
        for (let x = Math.floor(Math.min(sgm[0], sgm[2]) / CELL); x <= Math.floor(Math.max(sgm[0], sgm[2]) / CELL); x++)
          for (let z = Math.floor(Math.min(sgm[1], sgm[3]) / CELL); z <= Math.floor(Math.max(sgm[1], sgm[3]) / CELL); z++)
            (grid.get(`${x},${z}`) ?? grid.set(`${x},${z}`, []).get(`${x},${z}`)!).push(sgm)
      }
    }
    const onCentre = (x: number, z: number): boolean => (grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`) ?? []).some(([ax, az, bx, bz]) => {
      const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)))
      return Math.hypot(ax + dx * t - x, az + dz * t - z) < 2
    })
    const before = kept.length
    const dropped = new Set<number>()
    for (const e of kept) {
      if (!e.foot || e.bridge || e.tunnel || (e.layer ?? 0) !== 0 || e.kind === 'steps') continue
      const p = unpackPoints(e.points)
      let on = 0, all = 0
      for (let i = 1; i < p.length; i++) {
        const L = Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z), n = Math.max(1, Math.ceil(L))
        for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; all += L / n; if (onCentre(p[i - 1].x + (p[i].x - p[i - 1].x) * t, p[i - 1].z + (p[i].z - p[i - 1].z) * t)) on += L / n }
      }
      if (all >= 10 && on >= 0.8 * all) dropped.add(e.id)
    }
    if (dropped.size) {
      const keepE = kept.filter((e) => !dropped.has(e.id))
      kept.length = 0
      // (not `push(...keepE)`: Paris's edges as arguments overflowed the stack)
      for (const e of keepE) kept.push(e)
    }
    console.log(`  ${before - kept.length} foot ways dropped that ran down a street's own centreline (the same alley mapped twice)`)
  }
  // (Paris: nor on the tracks, with nothing under them: tools/rail-levels.ts `footWaysOnTracks`)
  if (spec.region === 'paris') {
    const onTracks = footWaysOnTracks(kept, rails)
    if (onTracks.size) {
      const keepE = kept.filter((e) => !onTracks.has(e.id))
      kept.length = 0
      for (const e of keepE) kept.push(e)
    }
    console.log(`  ${onTracks.size} foot ways dropped that ran along a railway track`)
  }
  // ---- the ride graph, built here only to be measured (the game builds its own at load, IMPROVEMENTS §2.2)
  const asEdges: Edge[] = kept.map((e) => {
    const points = unpackPoints(e.points)
    return { ...e, points, length: lengthOf(points) }
  })
  let covered = new Set<number>()
  for (const mode of ['bike', 'run'] as const) {
    // an American grid's junctions are wide: a boulevard with service lanes is one junction, not four (BUGS.md #52)
    /*
     * For the STATS and the coverage set only; the ride files themselves are written from `rideFor` below,
     * which supplies the region's roundabouts. `as never` used to stand where the real type goes, and it hid
     * a missing `roundabouts` from the compiler — every San Francisco bake then died inside rideGraph.
     */
    const rg = rideGraph(asEdges, mode, {
      roundabouts: [],
      wideJunctions: streetRegion.streetWidth === 'carriageway',
      // only ever called to give a roundabout's new edges their heights, and there are none here
      heightAt: () => 0,
      keep: (streetRegion.ferryIslands ?? []).map((k) => ({ ...proj.toLocal({ lat: k.lat, lon: k.lon }), r: k.radius })),
    })
    const st = rideStats(rg)
    console.log(`  ride graph (${mode}): ${st.edges} edges over ${st.km.toFixed(1)} km, `
      + `${st.perKm.toFixed(1)} decisions/km, median ${st.medianSpacing.toFixed(0)} m between them, `
      + `${st.nearDuplicates} nodes with exits within 20° (${st.rawNearDuplicates} before dedup)`)
    if (mode === 'bike') covered = new Set([...rg.edges.values()].flatMap((e) => e.over.map((o) => o.id)))
  }

  // ---- where a ride starts: the longest edge nearest the centre, so the first thing seen is a street —
  // and one the bike's ride graph covers, or the navigator would have nowhere to put the rider
  const start = kept
    .map((e) => ({ e, d: Math.hypot(e.points[0], e.points[1]) }))
    .filter((x) => !x.e.foot && covered.has(x.e.id))
    .sort((p, q) => p.d - q.d)[0]
  if (!start) throw new Error('no rideable street near the centre')

  /*
   * The road and pavement polygons used to be unioned here, offline, with a polygon clipper. That produced
   * exactly the right shapes and failed on roughly one tile in six — and a failed tile is a street with no
   * road surface in it. The renderer now paints the same result as ordered layers instead
   * (`src/render/city.ts`), which cannot fail, so the bake no longer computes them.
   */

  // a building mapped inside another pulled in a hand's width, so their shared walls stop z-fighting — here,
  // over the whole city: per streamed tile the pair were often in different tiles and never met (BUGS.md #24)
  // the audit trail, grouped by rule so a systematically wrong style is one sort away (docs/BUILDINGS.md)
  await writeFile(resolve(DOCS, `${spec.id}-archetypes.csv`),
    ['osm,lat,lon,height,area,district,archetype,rule,style,note,form', ...audit].join('\n') + '\n')
  const byRule = new Map<string, number>()
  for (const row of audit) { const r = row.split(',')[7]; byRule.set(r, (byRule.get(r) ?? 0) + 1) }
  console.log(`  ${audit.length} buildings classified by ${byRule.size} rules → docs/${spec.id}-archetypes.csv`)

  const nested = insetNested(buildings)
  buildings.length = 0
  for (const b of nested) buildings.push(b)
  /*
   * APUR'S PUBLIC BUILDINGS OF THE OLD CITY (its `b_ee`), whatever OSM calls them: most of a government quarter is `building=yes`, and
   * had shops, balconies and shutters. No shops, which is what asks for the government's front (city/facade.ts); and the old hôtels
   * among them in stone, not in the Marais's plaster and shutters.
   */
  if (recordOf && spec.region === 'paris') {
    let dressed = 0
    for (const b of buildings) {
      if ((b.minHeight ?? 0) > 2 || !/^(haussmann|marais|brick)$/.test(b.style ?? '')) continue
      const rec = recordOf(unpackPoints(b.ring).map((q) => proj.toLatLon(q))) as { use?: string; construction?: string } | null
      if (rec?.use !== 'facility' || Number(rec.construction) > 5) continue
      b.noShops = true
      if (b.style === 'marais') b.style = 'haussmann'
      dressed++
    }
    console.log(`  ${dressed} public buildings of the old city: no shops, balconies or shutters`)
  }
  /*
   * A SLAB IN THE AIR inside an outline that has parts is one of them, whatever OSM's relation says: four of the Panthéon's parapets
   * (1459134825…) are in no relation, so when its model took the outline away they stayed, hanging over the roof (owner, 2026-10-30:
   * "some random floating stuff near the roof").
   */
  {
    // (the outline itself is gone by now: what stands for it is its parts on the ground, within a metre or two of the slab)
    const CELL = 50
    const grounded = new Map<string, PackedBuilding[]>()
    for (const b of buildings) {
      if (b.partOf === undefined || (b.minHeight ?? 0) > 2) continue
      const keys = new Set<string>()
      for (let i = 0; i < b.ring.length; i += 2) keys.add(`${Math.floor(b.ring[i] / CELL)},${Math.floor(b.ring[i + 1] / CELL)}`)
      for (const k of keys) (grounded.get(k) ?? grounded.set(k, []).get(k)!).push(b)
    }
    let adopted = 0
    for (const b of buildings) {
      if (b.partOf !== undefined || (b.minHeight ?? 0) <= 2) continue
      let cx = 0, cz = 0
      for (let i = 0; i < b.ring.length; i += 2) { cx += b.ring[i]; cz += b.ring[i + 1] }
      cx /= b.ring.length / 2; cz /= b.ring.length / 2
      const inside = (r: number[], x: number, z: number): boolean => {
        let o = false
        for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
          if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
        }
        return o
      }
      const near = new Set<PackedBuilding>()
      const gx = Math.floor(cx / CELL), gz = Math.floor(cz / CELL)
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (const o of grounded.get(`${gx + dx},${gz + dz}`) ?? []) near.add(o)
      // a slab is thin and may ring a court: inside a part at its middle, or at any of its own corners
      const host = [...near].find((o) => inside(o.ring, cx, cz) || (() => { for (let i = 0; i < b.ring.length; i += 2) if (inside(o.ring, b.ring[i], b.ring[i + 1])) return true; return false })())
      if (host) { b.partOf = host.partOf; adopted++ }
    }
    if (adopted) console.log(`  ${adopted} floating slabs adopted by the outline they hang inside`)
  }
  /*
   * A BUILDING IN THE AIR with nothing under it (BUGS.md #279, 2026-10-16): OSM raises a whole building by
   * `building:min_level` where its shop floor is a separate way — or is not mapped at all, and then the apartments over
   * Mission & 18th hung 4 m over the sidewalk. A raised OUTLINE (not a part: a part is raised on purpose, over its own
   * podium) with no building under its centre that reaches its base comes down to the ground.
   */
  {
    const rings = buildings.map((b) => {
      const r = unpackPoints(b.ring)
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const q of r) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
      return { b, r, x0, x1, z0, z1 }
    })
    let grounded = 0
    for (const R of rings) {
      const mh = R.b.minHeight ?? 0
      if (mh < 2 || !raisedOutlines.has(R.b.id)) continue
      let cx = 0, cz = 0
      for (const q of R.r) { cx += q.x; cz += q.z }
      cx /= R.r.length; cz /= R.r.length
      const held = rings.some((o) => o.b.id !== R.b.id && cx >= o.x0 && cx <= o.x1 && cz >= o.z0 && cz <= o.z1
        && (o.b.minHeight ?? 0) < mh && o.b.height !== undefined && o.b.height >= mh - 1.5 && pointInRing(o.r, cx, cz))
      if (!held) { delete R.b.minHeight; grounded++ }
    }
    if (grounded) console.log(`  raised buildings with nothing under them, grounded: ${grounded}`)
  }
  /*
   * SURVEY PINS (2026-11-07, Pont National's right bank: Quai de Bercy dives under the bridgehead in three 40 m layer -1 tunnels, the
   * IGN bare earth 31.9–32.4 m all along it, Bd Poniatowski on its embankment at 37–38. The bake's ground there is the embankment, the
   * tunnels were ridden in the open at the min of their end streets — both stood at the junction's 5.6 — and the quay fell 6 m in 30 m.)
   * A region's `surveyPins` names a ring, the ways in it (`ways`: a name regex; `kinds`: a kind regex for unnamed ones) and a few
   * surveyed points [lat, lon, IGN m]: every such way's points in the ring take the points' inverse-distance height less `datum`
   * (bake height = IGN − datum, ≈ 32.8 by Pont National), eased back to its own over `fade` m outside the ring. Last, so no pass undoes
   * it. SURVEY_PINS=0 off.
   */
  // DECK ZONES (tools/deck-zones.ts): a bridgehead's ground as authored flat levels — last over the ground (the quay detail's lidar
  // included), then its routes after the pins and the level plans below. DECK_ZONES=0 off.
  const tDz0 = Date.now()
  const deckZones = process.env.DECK_ZONES === '0' ? [] : deckZonesOf(streetRegion.deckZones, (lat, lon) => proj.toLocal({ lat, lon }), datumRaw)
  if (deckZones.length) {
    for (const zn of deckZones) {
      const n = zn.markRiver((x, z) => { const c = Math.round((x - fx0) / FINE_STEP), r = Math.round((z - fz0) / FINE_STEP); return c >= 0 && r >= 0 && c < fcols && r < frows ? fineGround[r * fcols + c] : Infinity })
      console.log(`  deck zone ${zn.spec.name}: ${n} outline segments on the river`)
    }
    const nf = levelGroundGrid(deckZones, fineGround, fcols, frows, fx0, fz0, FINE_STEP), nc = levelGroundGrid(deckZones, ground, cols, rows, tx0, tz0, STEP)
    if (quayDetail) {
      const at0 = quayDetail.at
      quayDetail.at = (x, z) => { let v = at0(x, z); if (v === null) return null; for (const zn of deckZones) { const y = zn.groundAt(x, z, v); if (y !== null) v = y } return v } // (in order, as levelGroundGrid: a hand zone over the band)
      // (the tiles a zone touches ship at DZ_GROUND_STEP: a 4 m grid draws each wall's foot as a 4 m grey wedge in front of it)
      const zt = new Set<string>()
      for (const zn of deckZones) {
        const [x0, z0, x1, z1] = zn.box()
        for (let tz = Math.floor(z0 / TILE); tz <= Math.floor(z1 / TILE); tz++) for (let tx = Math.floor(x0 / TILE); tx <= Math.floor(x1 / TILE); tx++) zt.add(`${tx},${tz}`)
      }
      quayDetail.stepOf = (tx, tz) => zt.has(`${tx},${tz}`) ? DZ_GROUND_STEP : undefined
      console.log(`  deck zones: ${[...zt].filter((k) => quayDetail!.tiles.has(k)).length} of ${zt.size} touched tiles ship ground at ${DZ_GROUND_STEP} m`)
    }
    shipped = new GroundModel({
      coarse: { x0: tx0, z0: tz0, step: STEP, cols, rows, h: ground },
      fine: { x0: fx0, z0: fz0, step: FINE_STEP, cols: fcols, rows: frows, h: fineGround },
      fineTiles, tiles: blockTiles, fineStep: FINE_STEP, tile: TILE, detail: quayDetail,
    })
    for (const [k2, b] of shipped.blocks) {
      if (shipped.fineTiles.has(k2)) { b.src = terrainFine.src; b.resM = terrainFine.resM } else { b.src = terrain.src; b.resM = terrain.resM }
    }
    console.log(`  deck zones: ${deckZones.map((z) => z.spec.name).join(', ')}: ${nf} fine and ${nc} coarse posts laid as levels`)
  }
  if (process.env.SURVEY_PINS !== '0') for (const t of applySurveyPins(kept, streetRegion.surveyPins ?? [], (lat, lon) => proj.toLocal({ lat, lon })).log) console.log(`  ${t}`)
  // LEVEL PLANS (tools/level-plans.ts): authored flat tiers and graded ramps, after the pins. LEVEL_PLANS=0 off.
  if (process.env.LEVEL_PLANS !== '0') for (const t of applyLevelPlans(kept, streetRegion.levelPlans ?? [], (lat, lon) => proj.toLocal({ lat, lon })).log) console.log(`  ${t}`)
  trace('pre-zones')
  const tDz1 = Date.now()
  for (const t of applyDeckZoneRoutes(kept, deckZones, (lat, lon) => proj.toLocal({ lat, lon }), true).log) console.log(`  ${t}`)
  if (deckZones.length) console.log(`  timing: deck zones ground ${((tDz1 - tDz0) / 1000).toFixed(1)} s, routes ${((Date.now() - tDz1) / 1000).toFixed(1)} s`)
  trace('zones')
  // THE ROAD BED in the band (deck-zones.ts DZ_BED): after the routes, the ground inside a car road's corridor is raised to the way
  if (DZ_BED && deckZones.some((z) => z.shape)) {
    const sg = new StreetGrade()
    for (const e of kept) if ((DZ_BED_FOOT || !e.foot) && e.heights?.length && deckZones.some((z) => z.shape && e.points.some((_, i) => i % 2 === 0 && z.bandW(e.points[i], e.points[i + 1]) > 0))) sg.add(e)
    const bed = (x: number, z: number, v: number): number => { const w = sg.at(x, z); return w !== null && v < w - DZ_BED_TOL ? w - DZ_BED_TOL : v }
    let nb = 0
    const grid = (h: ArrayLike<number> & { [i: number]: number }, cols: number, rows: number, x0: number, z0: number, step: number) => {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const i = r * cols + c, y = bed(x0 + c * step, z0 + r * step, h[i]); if (y !== h[i]) { h[i] = y; nb++ } }
    }
    grid(fineGround, fcols, frows, fx0, fz0, FINE_STEP); grid(ground, cols, rows, tx0, tz0, STEP)
    if (quayDetail) { const at1 = quayDetail.at; quayDetail.at = (x, z) => { const v = at1(x, z); return v === null ? null : bed(x, z, v) } }
    shipped = new GroundModel({
      coarse: { x0: tx0, z0: tz0, step: STEP, cols, rows, h: ground },
      fine: { x0: fx0, z0: fz0, step: FINE_STEP, cols: fcols, rows: frows, h: fineGround },
      fineTiles, tiles: blockTiles, fineStep: FINE_STEP, tile: TILE, detail: quayDetail,
    })
    for (const [k2, b] of shipped.blocks) {
      if (shipped.fineTiles.has(k2)) { b.src = terrainFine.src; b.resM = terrainFine.resM } else { b.src = terrain.src; b.resM = terrain.resM }
    }
    console.log(`  road bed: ${nb} grid posts raised to the car roads over them in the band (detail posts on demand)`)
  }
  if (deckZones.length) for (const t of conformDeckRails(rails, kept, deckZones)) console.log(`  ${t}`)
  if (deckZones.some((z) => z.rOf)) for (const t of bdTopoRails(rails, deckZones, (x, z) => shipped.heightAt(x, z))) console.log(`  ${t}`)
  // (an open lid's road is in its cut, never a structure: deck-conform and the zones judged it on the lidar before the carve)
  for (const e of kept) if (lidRoadIds.has(e.id) && e.ramp) delete e.ramp
  /*
   * TRENCH WALLS, by distance from the slab along the lid roads: a node inside a slab is 0, and a lid road is walled out to
   * LID_WALL_REACH m from it (render/city.ts). A ramp's chain walks on along the quay at its own grade, where the ground
   * rising beside it is a hillside, not a bank (the Quai de Bercy's, 60 m of 4 m walls along the park). Neither a height
   * rule (under the way's higher end: a side street meets the ramp halfway down) nor what the lid pass lowered (the ways
   * stood on the old tunnel's and embankment's profiles before it) told the two apart.
   */
  if (lidSlabsOut.length) {
    const inRing = (r: { x: number; z: number }[], x: number, z: number): boolean => {
      let o = false
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
      return o
    }
    const roads = kept.filter((e) => lidRoadIds.has(e.id) && e.cut && e.heights)
    const lenOf = new Map(roads.map((e) => { const p = unpackPoints(e.points); let l = 0; for (let i = 1; i < p.length; i++) l += Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z); return [e.id, l] as const }))
    const dist = new Map<number, number>()
    for (const e of roads) {
      const p = unpackPoints(e.points)
      for (const [n, q] of [[e.a, p[0]], [e.b, p[p.length - 1]]] as const) if (lidSlabsOut.some((s) => inRing(s.ring, q.x, q.z))) dist.set(n, 0)
    }
    for (let changed = true; changed;) {
      changed = false
      for (const e of roads) {
        const l = lenOf.get(e.id)!, da = dist.get(e.a) ?? Infinity, db = dist.get(e.b) ?? Infinity
        if (da + l < db) { dist.set(e.b, da + l); changed = true }
        if (db + l < da) { dist.set(e.a, db + l); changed = true }
      }
    }
    let walled = 0
    for (const e of roads) {
      const l = lenOf.get(e.id)!, da = dist.get(e.a) ?? Infinity, db = dist.get(e.b) ?? Infinity
      if (Math.min(da, db) >= LID_WALL_REACH) continue
      e.trench = true
      walled++
      if (Math.max(da, db) > LID_WALL_REACH) e.trenchTo = da <= db ? Math.min(l, LID_WALL_REACH - da) : -Math.min(l, LID_WALL_REACH - db)
    }
    console.log(`  lid tunnels: ${walled} trench ways walled, to ${LID_WALL_REACH} m from the slab`)
  }
  trace('final')
  const pkg: CityPackage = {
    id: spec.id, name: spec.name, origin: spec.centre, radius: spec.radius, ground: spec.ground, region: spec.region,
    seaLevel,
    box: { x0: -ext.west, x1: ext.east, z0: -ext.south, z1: ext.north },
    ...(regionsOf(spec).length ? { detail: detailOutlines(spec, (g) => proj.toLocal(g)) } : {}),
    start: { edgeId: start.e.id, s: 0 },
    edges: kept, buildings, areas, trees, rails, pois, furniture, landmarks, terrain, fringe, roundabouts,
    ...(quayWallsOf ? { quayWalls: (() => {
      const city = quayWallsOf((x, z) => shipped.heightAt(x, z)).filter((q) => !deckZones.some((z) => z.near((q.ax + q.bx) / 2, (q.az + q.bz) / 2, 3)))
      // (deduped ACROSS the zones, 2026-11-08: a hand zone's BD TOPO override and the Seine band under it draw the same BD TOPO wall lines; per zone, 116 pairs z-fought at Pont National)
      const zone = dedupeWalls(deckZones.flatMap((z) => { const v = z.walls(), rv = z.riverWalls((x, zz) => shipped.heightAt(x, zz)); console.log(`  deck zone ${z.spec.name}: ${v.length} wall pieces between levels, ${rv.length} on the river`); return [...v, ...rv] }))
      // (a zone's wall out in its band, on a line the city already walls: the city's stands)
      const zk = zone.filter((q) => { const mx = (q.ax + q.bx) / 2, mz = (q.az + q.bz) / 2; return deckZones.some((z) => !z.shape && z.inside(mx, mz)) || !city.some((o) => Math.hypot((o.ax + o.bx) / 2 - mx, (o.az + o.bz) / 2 - mz) < 1.5) })
      const w = [...city, ...zk]; console.log(`  quay walls: ${w.length} pieces (${zone.length - zk.length} zone pieces in a band dropped for the city's)`); return w })() } : {}),
    ...(sportsCourts.length ? { courts: sportsCourts } : {}),
    ...(spec.skyline ? {
      skyline: spec.skyline.map((s) => {
        const p = proj.toLocal(s)
        // Sacré-Cœur stands on Montmartre: the ground under a far landmark comes from the same tiles
        const baseY = Math.round((elevation.at(s) - datumRaw) * 10) / 10
        return { name: s.name, x: Math.round(p.x), z: Math.round(p.z), procedural: s.procedural, heightM: s.heightM, baseY,
          ...(s.bearing !== undefined ? { bearing: s.bearing } : {}), ...(s.boost !== undefined ? { boost: s.boost } : {}),
          ...(s.hx !== undefined ? { hx: s.hx } : {}), ...(s.hz !== undefined ? { hz: s.hz } : {}) }
      }),
    } : {}),
    attribution: [copyright, `OSM base ${timestamp}`, TERRAIN_CREDIT],
    baked: new Date().toISOString().slice(0, 10),
  }
  pkg.boats = boatWays.map((w) => ({ id: w.id, ring: packPoints(w.geometry.slice(0, -1).map((g) => proj.toLocal(g))),
    ...(w.tags.name ? { name: w.tags.name } : {}) }))
  console.log(`  ${pkg.boats.length} boats moored`)
  /*
   * The seawall (docs/PARKS.md "Beaches are BANDS", BUGS.md #200). The rip-rap band at the top of Ocean
   * Beach is mapped as `barrier=retaining_wall` and as nothing else - there is no `natural=shingle` and no
   * `natural=bare_rock` along that shore - so the revetment is PLACED from this while the sand's wet and
   * dry bands are GENERATED from distance to the coastline. Its own query, so the street query's cache is
   * untouched; `barrier` is a kept key in the local extract, so it costs no network.
   */
  {
    const got = await overpassDetail(wallsQuery, spec).catch((e) => {
      console.warn(`  walls: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
      return null
    })
    const walls: NonNullable<CityPackage['walls']> = []
    for (const w of got?.ways ?? []) {
      if (!w.geometry || w.geometry.length < 2) continue
      const pts = w.geometry.map((g) => proj.toLocal(g))
      walls.push({ id: w.id, points: packPoints(pts), ...(w.tags?.barrier === 'seawall' ? { sea: true as const } : {}) })
    }
    /*
     * PARIS'S PARKS ARE RAILED (owner, 2026-10-30, the Luxembourg at the Porte Gay-Lussac: "parks are often surrounded by tall
     * fences or even walls … probably because they are palace grounds that close"). OSM has 13,700 fences and walls in the
     * box, nearly all private; those along a park's edge (within 12 m of its boundary, and a park of real size) are kept,
     * as bars — or stone where OSM says a wall — and drawn by the city (render/city.ts `railings`).
     */
    if (spec.region === 'paris') {
      const fences = await overpassDetail(fencesQuery, spec).catch((e) => {
        console.warn(`  fences: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
        return null
      })
      const CELL = 40
      const edges = new Map<string, number[][]>()
      for (const a of areas) {
        if (a.kind !== 'park') continue
        const r = unpackPoints(a.ring)
        if (area(r) < 3000) continue
        for (let i = 0; i < r.length; i++) {
          const q = r[i], n = r[(i + 1) % r.length]
          const steps = Math.max(1, Math.ceil(Math.hypot(n.x - q.x, n.z - q.z) / CELL))
          for (let s = 0; s <= steps; s++) {
            const k = `${Math.floor((q.x + (n.x - q.x) * s / steps) / CELL)},${Math.floor((q.z + (n.z - q.z) * s / steps) / CELL)}`
            const l = edges.get(k)
            if (l) l.push([q.x, q.z, n.x, n.z])
            else edges.set(k, [[q.x, q.z, n.x, n.z]])
          }
        }
      }
      const nearEdge = (x: number, z: number): boolean => {
        const gx = Math.floor(x / CELL), gz = Math.floor(z / CELL)
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
          for (const [ax, az, bx, bz] of edges.get(`${gx + dx},${gz + dz}`) ?? []) {
            const sx = bx - ax, sz = bz - az
            const t = Math.max(0, Math.min(1, ((x - ax) * sx + (z - az) * sz) / (sx * sx + sz * sz || 1)))
            if (Math.hypot(ax + sx * t - x, az + sz * t - z) < 12) return true
          }
        }
        return false
      }
      let kept = 0
      for (const w of fences?.ways ?? []) {
        if (!w.geometry || w.geometry.length < 2) continue
        const pts = w.geometry.map((g) => proj.toLocal(g))
        // (most of it along the edge, not a garden fence that merely starts there)
        const along = pts.filter((q) => nearEdge(q.x, q.z)).length
        if (along < Math.max(2, pts.length * 0.6)) continue
        walls.push({ id: w.id, points: packPoints(pts), railing: w.tags?.barrier === 'wall' ? 'wall' : 'bars' })
        kept++
      }
      console.log(`  ${kept} park railings and walls (of ${fences?.ways.length ?? 0} fences and walls)`)
    }
    pkg.walls = walls
    console.log(`  ${walls.length} retaining/sea walls`)
  }
  /*
   * PARIS'S GARDENS ARE PLANTED BY HAND (owner, 2026-10-30: "hedges, neat rows of shrubs, flowers etc and not a wild landscape of
   * trees"). OSM maps some 1,600 hedges, 1,000 beds and 900 rows of trees in the box; tools/gardens/ adds what the aerial photographs
   * show of the gardens it does not, and takes those gardens out of the scatter (city/plantings.ts).
   */
  let gardenRows: Planting[] = []
  let gardenClears: { x: number; z: number }[][] = []
  if (spec.region === 'paris') {
    const got = await overpassDetail(gardenPartsQuery, spec).catch((e) => {
      console.warn(`  garden parts: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
      return null
    })
    const g = bakeGardens(got?.ways ?? [], (q) => proj.toLocal(q))
    pkg.garden = g.garden
    gardenClears = g.clearMapped
    // (the hand-traced plans are Paris-wide: only those where the city is modelled, so a test area elsewhere has none)
    const planIn = detailTest(spec)
    const modelled = (p: { x: number; z: number }): boolean => { const q = proj.toLatLon(p); return planIn(q.lat, q.lon, 50) }
    gardenRows = g.rows.flatMap((r, ri) => rowPoints(r).filter((p) => modelled(p) && (!r.osm || !g.clearMapped.some((c) => inside(c, p.x, p.z)))).map((p, i) => ({
      ...p, height: r.h ?? 11 + ((ri * 7 + i * 3) % 5), spin: (i * 2.399) % 6.28, park: true, ...(r.form ? { form: formCode(r.form) } : {}),
    })))
    console.log(`  gardens: ${g.counts.hedges} hedges, ${g.counts.beds} beds and ${g.counts.rows} tree rows from OSM, ${g.counts.plans} plans traced; ${gardenRows.length} trees in rows`)
  }
  // the bridges' outlines, what each bridge's structure is built from (render/bridges.ts)
  {
    const got = await overpassBox(bridgesQuery, spec).catch((e) => {
      console.warn(`  bridges: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
      return null
    })
    const out: NonNullable<CityPackage['bridges']> = []
    const ring = (g: { lat: number; lon: number }[], id: number, name?: string): void => {
      const pts = g.map((q) => proj.toLocal(q))
      if (pts.length > 2 && Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].z - pts[pts.length - 1].z) < 0.5) pts.pop()
      if (pts.length < 3) return
      out.push({ id, ring: packPoints(pts), ...(name ? { name } : {}) })
    }
    for (const w of got?.ways ?? []) if (w.geometry && w.geometry.length >= 4) ring(w.geometry, w.id, w.tags?.name)
    for (const r of got?.relations ?? []) for (const g of outerRings(r)) ring(g, r.id, r.tags?.name)
    // the lids' slabs (tools/tunnels.ts `lidSlabs`), ids clear of OSM's
    lidSlabsOut.forEach((l, i) => out.push({ id: LID_SLAB_ID0 + i, ring: packPoints(l.ring), lid: { dx: Math.round(l.dir.x * 1000) / 1000, dz: Math.round(l.dir.z * 1000) / 1000, y: l.y } }))
    pkg.bridges = out
    console.log(`  ${out.length} bridge outlines (${out.filter((b) => b.name).length} named)`)
    /*
     * What stands ON a Seine bridge is part of it (the Seine audit, 2026-10-30). OSM maps the Pont Alexandre III's four pylons as `building=yes` with a height of
     * 17 m, and they came out as four little Haussmann blocks with windows, each beside the pylon the structure draws (render/bridge-structures.ts). A small building
     * whose middle is inside a river bridge's own outline goes. Paris only; and not a boat or a houseboat, which an outline has never taken in.
     */
    if (spec.region === 'paris') {
      const rings = out.filter((b) => /^(Pont|Passerelle)\b/.test(b.name ?? '')).map((b) => unpackPoints(b.ring))
      const pylons = out.filter((b) => b.name === 'Pont Alexandre III').map((b) => unpackPoints(b.ring))
      const before = pkg.buildings.length
      pkg.buildings = pkg.buildings.filter((q) => {
        const r = unpackPoints(q.ring)
        if (r.length < 3 || Math.abs(area(r)) > 250) return true
        const cx = r.reduce((v, u) => v + u.x, 0) / r.length, cz = r.reduce((v, u) => v + u.z, 0) / r.length
        if (rings.some((g) => pointInRing(g, cx, cz))) return false
        // (the Alexandre III's four stand just off the ends of its outline, on their own plinths at the bank)
        return !pylons.some((g) => g.some((u, i) => {
          const v = g[(i + 1) % g.length], dx = v.x - u.x, dz = v.z - u.z
          const t = Math.max(0, Math.min(1, ((cx - u.x) * dx + (cz - u.z) * dz) / (dx * dx + dz * dz || 1)))
          return Math.hypot(u.x + dx * t - cx, u.z + dz * t - cz) < 16
        }))
      })
      if (pkg.buildings.length < before) console.log(`  ${before - pkg.buildings.length} buildings on the bridges' outlines gone (the Alexandre III's pylons)`)
      // the pavements on a street's bridge over tracks, at its level (render/rail-overbridge.ts)
      const onDecks = levelFootOnDecks([...out, ...RAIL_DECKS], pkg.edges, pkg.rails ?? [], groundFine)
      if (onDecks) console.log(`  ${onDecks} foot ways on streets' bridges over tracks taken to the deck's level`)
    }
  }
  // every tree, decided here so a streamed tile always grows the same ones (city/plantings.ts)
  // a ceiling by AREA, not per city: 1,900 over the Marais's box is ~680 a square kilometre, and a city-wide
  // 1,900 would have left twenty square kilometres of central Paris almost bare
  const ex = extentOf(spec)
  // (the area MODELLED where there are detail regions: Paris's box grew by the empty country on the way to Versailles)
  const km2 = regionsOf(spec).length ? detailKm2(spec) : ((ex.west + ex.east) * (ex.south + ex.north)) / 1e6
  // (Paris twice over: OSM maps 166 000 of its trees — the city's own register — before the Bois's forest is planted)
  const cap = Math.max(TREE_CAP, Math.round(TREES_PER_KM2 * km2 * (spec.region === 'paris' ? 2 : 1)))
  // the city's own record of its street trees, where the region has one (SF: tools/sf-trees.ts), in place of the
  // mapped and the guessed ones
  const street = spec.streetTrees === 'datasf'
    ? await Promise.all([import('./sf-trees.ts'), import('../src/city/sf/trees.ts')])
      .then(async ([t, f]) => f.sfPlantings(await t.fetchStreetTrees(detailBboxOf(spec)), (g) => proj.toLocal(g), () => true))
      .catch((e: unknown) => { console.warn(`  sf-trees: not fetched (${String(e).slice(0, 120)})`); return undefined })
    : undefined
  // everything else by ZONE (src/city/zone-planting.ts): the parks' planting, and invented street rows wherever a
  // zone says the register does not reach. A city with no planting zones keeps the old rules.
  const plantZones = new PlantZones(zones)
  const planted = newPlantReport()
  // the gardens' rows are planted by hand, ahead of the rest. A planned garden's rows replace the trees mapped in it; anywhere else
  // the register's own tree stands where it stands, and a row only fills what it has not got
  if (gardenClears.length) {
    const kept: number[] = []
    for (let i = 0; i < pkg.trees.length; i += 2) if (!gardenClears.some((r) => inside(r, pkg.trees[i], pkg.trees[i + 1]))) kept.push(pkg.trees[i], pkg.trees[i + 1])
    pkg.trees = kept
  }
  let underDeck: (x: number, z: number) => boolean = () => false
  // no tree grows through a bridge (owner, 2026-11-07: "a stray tree going right through the bridge", Pont National 48.828518, 2.387919):
  // none within a deck way's half-width + TREE_DECK_PAD (a crown's reach) of it, filed by 20 m cell
  {
    const TREE_DECK_PAD = 4, C = 20, segs = new Map<string, [number, number, number, number, number][]>()
    for (const e of pkg.edges) {
      if (!e.bridge) continue
      const r = (e.width ?? 6) / 2 + TREE_DECK_PAD
      for (let i = 2; i < e.points.length; i += 2) {
        const ax = e.points[i - 2], az = e.points[i - 1], bx = e.points[i], bz = e.points[i + 1]
        for (let cx = Math.floor((Math.min(ax, bx) - r) / C); cx <= Math.floor((Math.max(ax, bx) + r) / C); cx++)
          for (let cz = Math.floor((Math.min(az, bz) - r) / C); cz <= Math.floor((Math.max(az, bz) + r) / C); cz++) {
            const k = `${cx},${cz}`; (segs.get(k) ?? segs.set(k, []).get(k)!).push([ax, az, bx, bz, r])
          }
      }
    }
    underDeck = (x: number, z: number): boolean => (segs.get(`${Math.floor(x / C)},${Math.floor(z / C)}`) ?? []).some(([ax, az, bx, bz, r]) => {
      const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)))
      return Math.hypot(ax + dx * t - x, az + dz * t - z) < r
    })
    const kept: number[] = []
    for (let i = 0; i < pkg.trees.length; i += 2) if (!underDeck(pkg.trees[i], pkg.trees[i + 1])) kept.push(pkg.trees[i], pkg.trees[i + 1])
    if (kept.length < pkg.trees.length) console.log(`  trees: ${(pkg.trees.length - kept.length) / 2} mapped under bridge decks taken out`)
    pkg.trees = kept
  }
  const mappedNear = new Set<string>()
  for (let i = 0; i < pkg.trees.length; i += 2) mappedNear.add(`${Math.floor(pkg.trees[i] / 5)},${Math.floor(pkg.trees[i + 1] / 5)}`)
  // …and no row tree stands in the water or within GARDEN_TREE_WATER_MARGIN of it (the Grand Canal's allées are drawn on a straight
  // axis, the water is OSM's: where the two part, the tree goes — Versailles, owner 2026-11-05)
  const GARDEN_TREE_WATER_MARGIN = 2.5
  const treeWater = pkg.areas.filter((a) => a.kind === 'water').map((a) => {
    const ring = unpackPoints(a.ring)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    return { ring, holes: (a.holes ?? []).map((h) => unpackPoints(h)), x0, x1, z0, z1 }
  })
  const inWater = (x: number, z: number): boolean => treeWater.some((w) => {
    const m = GARDEN_TREE_WATER_MARGIN
    if (x < w.x0 - m || x > w.x1 + m || z < w.z0 - m || z > w.z1 + m) return false
    const near = (r: { x: number; z: number }[]): boolean => {
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const a = r[j], b = r[i], dx = b.x - a.x, dz = b.z - a.z
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
        if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) < m) return true
      }
      return false
    }
    if (near(w.ring)) return true
    return inside(w.ring, x, z) && !w.holes.some((h) => inside(h, x, z))
  })
  const rowed = gardenRows.filter((p) => {
    if (inWater(p.x, p.z)) return false
    const gx = Math.floor(p.x / 5), gz = Math.floor(p.z / 5)
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (mappedNear.has(`${gx + dx},${gz + dz}`)) return false
    return true
  })
  pkg.plantings = packPlantings(plantCity(pkg, cap, street, plantZones, planted, [...rowed, ...handTreesOf(spec.id, (lat, lon) => proj.toLocal({ lat, lon }))]))
  logPlanting(pkg.plantings.length / 5, planted, plantZones.count, cap, km2)
  { const n0 = pkg.plantings.length, kept: number[] = []
    for (let i = 0; i < n0; i += 5) if (!underDeck(pkg.plantings[i], pkg.plantings[i + 1])) kept.push(...pkg.plantings.slice(i, i + 5))
    pkg.plantings = kept
    if (kept.length < n0) console.log(`  plantings: ${(n0 - kept.length) / 5} under bridge decks taken out`) }
  {
    // the declared bike ramps beside bridgeheads' stairs (src/city/bike-ramps.ts; `--rides` lays them again without a bake)
    const pj = new Projection(pkg.origin), r = layBikeRamps(pkg.edges, spec.region ?? spec.id, (lat, lon) => pj.toLocal({ lat, lon }))
    for (const t of r.log) console.log(`  bike ramp: ${t}`)
  }
  await mkdir(workDir(spec.id), { recursive: true })
  // (bake-private: what the secondary tools read — tools/bake-files.ts; never published)
  const file = packageFile(spec.id)
  const bake = newBakeId()
  /*
   * The monolith goes out WITHOUT the fine grid — but `writeTiles` below is given the package that still
   * has it, because cutting it into the tiles is the only thing it is for.
   *
   * `terrainFine` is 14.4 M samples in San Francisco: about +100 MB on a 346 MB file, and a 14.4 M-element
   * array pushed through `JSON.stringify` for a field nothing reads from here. Measured on Brooklyn
   * Heights, which is a fortieth of the size: 3 174 kB -> 6 333 kB.
   */
  await writeFile(file, JSON.stringify(withoutFineGrid(pkg)))
  const kb = Math.round((await import('node:fs')).statSync(file).size / 1024)
  console.log(`  → ${file}  ${kb} kB (bake-private)`)
  await writeTiles(pkg, streetRegion.riverDrop ?? 0, bake, shipped, zones, datumRaw)
  await writeRides(pkg)
  if (deckWork) await writeFile(decksUndoFile(spec.id), JSON.stringify(deckWork.undo))
  recordBake(spec.id, bake)
  await dropOldLayout(spec.id)
  console.log(`  bake ${bake}`)
  // and last, the checks that genuinely need the finished tiles: direction A confirmed against what was
  // actually written, and direction B — what is standing in the city with nothing but the classifier
  auditStage('3', spec)
}


/**
 * What roof a building gets.
 *
 * OSM wins where a mapper said anything — `roof:shape` is the whole point of having the tag layer. Where it
 * is silent, which is almost always, the answer comes from what the building IS: a Haussmann block gets its
 * zinc mansard, a small detached footprint gets a pitched roof because that is what small buildings have,
 * and everything urban and large stays flat behind its parapet. Guessing from the style and the footprint is
 * how a city gets a skyline without every mapper having to draw one.
 */
function roofFor(
  tags: Record<string, string>,
  p: { buildingRoofType?: string; buildingRoofHeight?: number; buildingRoofDirection?: number },
  styleId: StyleId,
  ringPts: { x: number; z: number }[],
  seed: number,
): { roof: RoofShape; roofHeight: number; roofDirection?: number; roofColour: [number, number, number] } {
  const st = styleOf(styleId)
  const pal = st.palettes[Math.abs(seed) % st.palettes.length]
  const colour = hexRgb(pal.roof)

  // the footprint's smaller dimension, which is what decides whether a pitched roof is plausible
  let minx = Infinity; let maxx = -Infinity; let minz = Infinity; let maxz = -Infinity
  for (const q of ringPts) {
    minx = Math.min(minx, q.x); maxx = Math.max(maxx, q.x)
    minz = Math.min(minz, q.z); maxz = Math.max(maxz, q.z)
  }
  const span = Math.min(maxx - minx, maxz - minz)

  // Only a roof shape the MAPPER actually wrote counts. The vendored helper falls back to 'flat' when there
  // is no tag, so trusting its answer made every building in Paris flat-roofed and threw away the whole
  // point of guessing from the style.
  const tagged = (tags['roof:shape'] ?? tags['building:roof:shape']) ? p.buildingRoofType : undefined
  const map: Record<string, RoofShape> = {
    flat: 'flat', gabled: 'gabled', hipped: 'hipped', pyramidal: 'pyramidal', skillion: 'skillion',
    mansard: 'mansard', gambrel: 'gabled', saltbox: 'gabled', quadrupleSaltbox: 'hipped',
    dome: 'dome', onion: 'pyramidal', round: 'hipped',
  }
  let shape: RoofShape | undefined = tagged ? map[tagged] : undefined

  if (!shape) {
    // A HOUSE has a pitched roof. A narrow urban building does not necessarily: a Brooklyn brownstone is six
    // metres wide and flat on top behind its cornice, so guessing from width alone put gables on a whole
    // neighbourhood that has none. Only an explicit house-ish tag counts; everything else takes the style's
    // own roofline, which is what the style was chosen for.
    const houses = new Set(['house', 'detached', 'semidetached_house', 'bungalow', 'cabin', 'hut',
      'farm', 'chalet', 'static_caravan'])
    if (houses.has(tags.building ?? '')) shape = span < 11 ? 'gabled' : 'hipped'
    else if (st.top === 'mansard') shape = 'mansard'
    // the pre-Haussmann Marais: a steep slate roof, pitched, with dormers — never flat
    else if (styleId === 'marais') shape = 'hipped'
    // the Presidio's and the old forts' Army buildings — clapboard, brick and Mission stucco alike — under red roofs,
    // gabled, hipped where the block is too wide for a gable to stay low (owner, 2026-10-02: "white with gabled red
    // tile roofs"; 2026-10-17: "bright white clapboard with red roofs, OR brick with red roofs")
    else if (styleId === 'presidio' || styleId === 'presidioBrick' || styleId === 'presidioStucco') shape = span < 16 ? 'gabled' : 'hipped'
    else if (styleId === 'capecod') shape = 'gabled'
    else if (span < 7 && tags.building === 'garage') shape = 'skillion'
    else shape = 'flat'
  }

  // a roof height OSM gave us, else one that suits the shape and the building's size
  let height = p.buildingRoofHeight ?? 0
  if (!height || height <= 0) {
    height = shape === 'mansard' ? Math.min(4.2, span * 0.5)
      : shape === 'flat' ? 0
      : Math.min(span * 0.42, shape === 'pyramidal' ? 7 : 5.5)
  }
  if (shape === 'flat') height = 0
  /*
   * The pitches (Presidio research, 2026-10-17, Mapillary): the Mission Revival stucco's tile roof is low, about 17°
   * (Fort Scott); the East Housing's and the Main Post's brick roofs a little steeper, about 24°; the frame quarters'
   * gables steeper again, about 30° (Funston Avenue, Fort Baker) — never a Victorian's.
   */
  if (!p.buildingRoofHeight && shape !== 'flat') {
    if (styleId === 'presidioStucco') height = Math.min(span * 0.16, 3.2)
    else if (styleId === 'presidioBrick') height = Math.min(span * 0.22, 3.8)
    else if (styleId === 'presidio') height = Math.min(span * 0.29, 4.6)
  }

  return {
    roof: shape,
    roofHeight: Math.round(height * 100) / 100,
    roofDirection: p.buildingRoofDirection !== undefined && Number.isFinite(p.buildingRoofDirection)
      ? (p.buildingRoofDirection * Math.PI) / 180
      : undefined,
    // (a FLAT stucco roof is tar and gravel, not the palette's tile: the Sunset and the Marina were acres of orange slabs
    //  seen from any hill — Golden Gate Heights, 2026-10-06; render/buildings.ts does the same where no colour is baked)
    roofColour: shape === 'flat' && styleId === 'stucco' ? [0.5, 0.49, 0.47] : colour,
  }
}

/** a pitched roof in the colour BD TOPO's roof material says (tiles red, slate dark, zinc grey); a flat one keeps its own */
function withRoofMaterial<R extends { roof: RoofShape; roofColour: [number, number, number] }>(r: R, rec: { roofMat?: string } | null | undefined): R {
  const k = roofKind(rec?.roofMat)
  return k && k !== 'concrete' && r.roof !== 'flat' ? { ...r, roofColour: ROOF_RGB[k] } : r
}

const hexRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
}

/** How many heights were guessed, and what the city's skyline came out as. */
function reportLevels(buildings: PackedBuilding[], inferred: number): void {
  const pct = (n: number): string => `${((100 * n) / Math.max(1, buildings.length)).toFixed(0)}%`
  console.log(`  inferred ${inferred} of ${buildings.length} buildings (${pct(inferred)})`)
  const bins: [string, (l: number) => boolean][] = [
    ['1', (l) => l <= 1], ['2', (l) => l === 2], ['3-4', (l) => l >= 3 && l <= 4],
    ['5-7', (l) => l >= 5 && l <= 7], ['8+', (l) => l >= 8],
  ]
  const lv = (b: PackedBuilding): number => b.levels ?? Math.max(1, Math.round((b.height ?? 4) / 4))
  console.log(`  levels: ${bins.map(([k, f]) => `${k}: ${pct(buildings.filter((b) => f(lv(b))).length)}`).join('  ')}`)
  const styles = new Map<string, number>()
  for (const b of buildings) styles.set(b.style, (styles.get(b.style) ?? 0) + 1)
  console.log(`  styles: ${[...styles].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${pct(n)}`).join('  ')}`)
}

/**
 * Fit each street into the gap its buildings actually leave. Kerb-to-kerb defaults are right for a Brooklyn
 * avenue and far too wide for Love Lane, where they put the roadway wall to wall and the sidewalks inside
 * the buildings. Every 10 m along a street, the distance to the nearest wall on each side; the median of
 * the sums is the street's real corridor. Only ever shrinks: the pavements first (to 1 m), then the roadway
 * (to 3 m). Streets with open ground on a side (a park, a plaza) keep their width.
 */
const GAP_CELL = 40
/** the buildings' walls, filed by 40 m cell, for `medianGap` */
function wallGrid(buildings: PackedBuilding[]): Map<string, number[][]> {
  const grid = new Map<string, number[][]>()
  for (const b of buildings) {
    const r = b.ring
    for (let i = 0; i < r.length; i += 2) {
      const j = (i + 2) % r.length
      const seg = [r[i], r[i + 1], r[j], r[j + 1]]
      const k = `${Math.floor((seg[0] + seg[2]) / 2 / GAP_CELL)},${Math.floor((seg[1] + seg[3]) / 2 / GAP_CELL)}`
      // (pushed, not spread into a fresh array: that copied every cell's list once per wall — fine for a borough,
      //  quadratic for Paris's 150,000 buildings)
      const list = grid.get(k)
      if (list) list.push(seg)
      else grid.set(k, [seg])
    }
  }
  return grid
}

/** Every 10 m along a street, the distance to the nearest wall on each side: the median of the sums, or null */
function medianGap(e: PackedEdge, grid: Map<string, number[][]>): number | null {
  const pts = unpackPoints(e.points)
  const gaps: number[] = []
  let acc = 0
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x
    const dz = pts[i].z - pts[i - 1].z
    const L = Math.hypot(dx, dz)
    if (L < 0.01) continue
    const nx = -dz / L
    const nz = dx / L
    for (let t = acc; t < L; t += 10) {
      const px = pts[i - 1].x + (dx * t) / L
      const pz = pts[i - 1].z + (dz * t) / L
      let left = 20
      let right = 20
      const gx = Math.floor(px / GAP_CELL)
      const gz = Math.floor(pz / GAP_CELL)
      for (let ox = -1; ox <= 1; ox++) {
        for (let oz = -1; oz <= 1; oz++) {
          for (const [ax, az, bx, bz] of grid.get(`${gx + ox},${gz + oz}`) ?? []) {
            // where the perpendicular through p meets this wall, if it does
            const sx = bx - ax
            const sz = bz - az
            const den = nx * sz - nz * sx
            if (Math.abs(den) < 1e-6) continue
            const d = ((ax - px) * sz - (az - pz) * sx) / den
            const u = ((ax - px) * nz - (az - pz) * nx) / den
            if (u < 0 || u > 1) continue
            if (d > 0) left = Math.min(left, d)
            else right = Math.min(right, -d)
          }
        }
      }
      if (left < 20 && right < 20) gaps.push(left + right)
    }
    acc = (acc + 10 - (L % 10)) % 10
  }
  if (gaps.length < 2) return null
  gaps.sort((a, b) => a - b)
  return gaps[Math.floor(gaps.length / 2)]
}

/**
 * Fit each street into the gap its buildings actually leave. Kerb-to-kerb defaults are right for a Brooklyn
 * avenue and far too wide for Love Lane, where they put the roadway wall to wall and the sidewalks inside
 * the buildings. Every 10 m along a street, the distance to the nearest wall on each side; the median of
 * the sums is the street's real corridor. Only ever shrinks: the pavements first (to 1 m), then the roadway
 * (to 3 m). Streets with open ground on a side (a park, a plaza) keep their width.
 */
function fitStreetsBetweenBuildings(edges: PackedEdge[], buildings: PackedBuilding[]): void {
  const grid = wallGrid(buildings)
  let shrunk = 0
  for (const e of edges) {
    if (e.foot) continue
    const gap = medianGap(e, grid)
    if (gap === null) continue
    const want = e.width + 2 * e.walk
    if (want <= gap) continue
    const walk = Math.max(e.walk > 0 ? 1 : 0, Math.min(e.walk, (gap - e.width) / 2))
    e.walk = Math.round(walk * 100) / 100
    if (e.width + 2 * e.walk > gap) e.width = Math.round(Math.max(3, gap - 2 * e.walk) * 100) / 100
    shrunk++
  }
  console.log(`  ${shrunk} streets fitted between their buildings`)
}

/**
 * PARIS'S PARKING LANE (Mapillary sampling and the owner's street view, 2026-10-29: cars parked along the kerbs of
 * nearly every street; "parking bays marked in dashes along the kerb"). The class defaults make a Paris rue one lane
 * between its pavements — 3.4 m of carriageway on 184 km of one-way street in the core — where the real street is
 * that lane AND a parking lane, 6 m kerb to kerb. Where the buildings leave the room (the median gap between the walls
 * has 2.4 m to spare beyond the street as drawn), the carriageway gains the parking lane: to 5.6 m on a one-way rue, and
 * on a two-way street of 6 m or more one each side (render/city.ts `kerbBays` paints the bays and parks the cars,
 * only where a parked car clears the traffic lane). Never narrows anything; a street with open ground beside it (no
 * wall within 20 m on a side) is left as it is.
 */
function parisParkingLanes(edges: PackedEdge[], buildings: PackedBuilding[]): void {
  const grid = wallGrid(buildings)
  let widened = 0
  for (const e of edges) {
    if (e.foot || e.bridge || e.tunnel || !/^(residential|tertiary|secondary|unclassified)$/.test(e.kind ?? '')) continue
    const need = e.oneway ? (e.width < 5.6 ? 5.6 - e.width : 0) : e.width >= 6 && e.width < 11.6 ? 11.6 - e.width : 0
    if (need <= 0 || need > 5.6) continue
    const gap = medianGap(e, grid)
    if (gap === null || gap < e.width + 2 * e.walk + need + 0.4) continue
    e.width = Math.round((e.width + need) * 100) / 100
    widened++
  }
  console.log(`  ${widened} Paris streets given their parking lane`)
}

function centroidOf(ring: { x: number; z: number }[]): { x: number; z: number } {
  let x = 0
  let z = 0
  for (const p of ring) { x += p.x; z += p.z }
  return { x: x / ring.length, z: z / ring.length }
}

/** Shoelace area of a ring, always positive. */
function area(ring: { x: number; z: number }[]): number {
  let a = 0
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    a += p.x * q.z - q.x * p.z
  }
  return Math.abs(a) / 2
}

/** Counter-clockwise, which is what the wall builder assumes when it works out which way is outward. */
function ccw(ring: { x: number; z: number }[]): { x: number; z: number }[] {
  let a = 0
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    a += p.x * q.z - q.x * p.z
  }
  return a < 0 ? [...ring].reverse() : ring
}

/** OSM's river, as opposed to a lake, a pond or a canal's basin: what a region's `riverLevel` is the surface of */
const isRiver = (t: Record<string, string>): boolean => t.water === 'river' || t.waterway === 'riverbank'

function areaKind(w: OsmWay): PackedArea['kind'] | null {
  const t = w.tags
  /*
   * Nothing underground: the Canal Saint-Martin runs in a tunnel under the Boulevard Richard-Lenoir and the
   * Place de la Bastille ("Voûte Richard Lenoir", tunnel=yes, location=underground, layer=-2), and drawn as a
   * surface it showed through every gap between the boulevard's road polygons as a strip of river.
   */
  if ((t.tunnel && t.tunnel !== 'no') || t.location === 'underground' || t.covered === 'yes'
    || Number(t.layer ?? 0) < 0) return null
  if (t.natural === 'water' || t.waterway === 'riverbank') return 'water'
  /*
   * THE BARE GROUND FIRST, before the greens (BUGS.md #200). Ocean Beach is mapped as `natural=beach`
   * INSIDE the Golden Gate Park and Ocean Beach `leisure=park`/`nature_reserve` polygons, and Baker Beach
   * the same inside the Presidio's — so whichever test runs first decides, and for years the park test ran
   * first and the beach was a lawn. Sand is the more specific statement about the ground and wins.
   */
  if (/^(beach|sand|shingle|dune)$/.test(t.natural ?? '') || t.surface === 'sand') return 'sand'
  if (/^(scree|bare_rock|mud|earth)$/.test(t.natural ?? '') || t.landuse === 'quarry') return 'dirt'
  if (t.natural === 'wood' || t.landuse === 'forest') return 'wood'
  // nature_reserve: most of the Presidio's wild edge and Lands End are tagged this way and nothing else
  if (t.leisure === 'park' || t.leisure === 'garden' || t.leisure === 'nature_reserve') return 'park'
  if (t.leisure === 'pitch') return 'pitch'
  // scrub is the dune and coastal-bluff planting of the Presidio and Lands End: grass to look at, and the
  // park rule plants it thinly rather than as forest
  if (t.landuse === 'grass' || t.landuse === 'meadow' || t.natural === 'scrub') return 'grass'
  if ((t.highway === 'pedestrian' && (t.area === 'yes' || t.type === 'multipolygon')) || t['area:highway'] || t.place === 'square') return 'paved'
  /*
   * A pier's deck and a surface car park are concrete and asphalt (appearance audit, 2026-10-02): unclaimed, they
   * were the city's default ground, so Pier 30-32 — a 13-acre parking deck in the bay — was a lawn with its
   * aisles drawn across it. Not a multi-storey or underground car park: that is a building, or nothing to see.
   */
  // (a pier's deck stands on piles over the water, and an area drawn at the ground lies on the flattened sea bed, under
  //  the bay — the ferry gates came out as grey shapes under the water behind the Ferry Building, owner 2026-10-02.
  //  Only a pier on FILL, at grade, is ground: Pier 30-32's deck is mapped `man_made=pier` with a `surface`.)
  if (t.man_made === 'pier' && t.floating !== 'yes' && t.surface !== undefined) return 'lot'
  if (t.amenity === 'parking' && !/^(multi-storey|underground|rooftop)$/.test(t.parking ?? '')) return 'lot'
  // (a station's throat and yards: unclaimed they were the default lawn, the Gare du Nord's fan laid on grass, owner 2026-10-30)
  if (t.landuse === 'railway') return 'lot'
  return null
}

/**
 * The ocean and the bay (BUGS.md #159). OSM never maps a coastline as a closed polygon the way a pond is
 * mapped: `natural=coastline` is a pile of open ways, split arbitrarily, each carrying land on its LEFT and
 * water on its RIGHT in the direction it was drawn — the standard OSM convention, maintained by editors, so a
 * way is never flipped here (flipping would swap which side is water). `areaKind`/the water loop above only
 * ever look at closed rings, so the coast was fetched (tools/overpass.ts's wide query) and never used.
 *
 * Three steps:
 *  1. **Stitch** the ways end-to-end into chains, by matching endpoints — exactly San Francisco's coastline
 *     turned out to be almost entirely ONE chain (the bay shore, the Golden Gate, and Ocean Beach are one
 *     continuous OSM way sequence), plus a handful of separate closed rings.
 *  2. **Clip** each chain to the city box. `Projection.toLocal` is linear in lat (z) and lon (x), so the box
 *     is an exact axis-aligned rectangle in local metres — clipping is plain segment-vs-rectangle, no
 *     projection distortion to worry about at this scale.
 *  3. **Close** each clipped run into a polygon by tracing the box boundary from where it leaves the box to
 *     where the next run enters. The direction matters: naively following the SHORT way round encloses the
 *     LAND (verified against San Francisco's own data — that ring contains the Ferry Building and the
 *     Presidio); the correct closure is the LONG way round, which is what "water is on the right" actually
 *     means once the coastline hits an artificial box edge instead of more coastline.
 *
 * A CLOSED coastline ring is an island (Alcatraz, Treasure Island, Yerba Buena Island here) — the opposite
 * winding from a lake, since the sea is on the outside of it rather than the inside — and becomes a hole in
 * the sea, never water of its own. One entirely inside the box is used as a hole outright (fixing its winding
 * to be opposite the outer ring's, the usual hole convention); one that straddles the box edge is left alone
 * (not subtracted) and logged, since properly clipping a hole is a different problem from clipping the
 * outer ring and none of San Francisco's islands need it. A box corner sitting entirely at sea, or a chain
 * that crosses the box more than once, both fall out of the same general algorithm — nothing here treats the
 * single-crossing case specially — but they are exercised for San Francisco: `natural=coastline` clips into
 * one run entering and leaving near the Golden Gate/Lands End corner and a second run of two pieces where it
 * crosses the box's east edge twice, near Alcatraz/Angel Island.
 */
export function coastlineWater(ways: OsmWay[], box: Bbox, proj: Projection): { areas: { ring: number[]; holes?: number[][] }[]; islandsSkipped: number } {
  const coast = ways.filter((w) => w.tags.natural === 'coastline' && w.geometry && w.geometry.length >= 2)
  if (coast.length === 0) return { areas: [], islandsSkipped: 0 }
  const same = (a: LatLon, b: LatLon): boolean => Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lon - b.lon) < 1e-7

  // stitch, direction-preserving: never flip a way, since flipping would swap land and water
  const parts = coast.map((w) => w.geometry!.filter(Boolean))
  const used = new Array(parts.length).fill(false)
  const chains: LatLon[][] = []
  for (let i = 0; i < parts.length; i++) {
    if (used[i]) continue
    used[i] = true
    let chain = [...parts[i]]
    let grew = true
    while (grew) {
      grew = false
      const tail = chain[chain.length - 1]
      if (same(tail, chain[0]) && chain.length > 3) break
      for (let j = 0; j < parts.length; j++) {
        if (used[j]) continue
        if (same(tail, parts[j][0])) { chain.push(...parts[j].slice(1)); used[j] = true; grew = true; break }
      }
    }
    grew = true
    while (grew) {
      grew = false
      const head = chain[0]
      if (same(head, chain[chain.length - 1]) && chain.length > 3) break
      for (let j = 0; j < parts.length; j++) {
        if (used[j]) continue
        const p = parts[j]
        if (same(p[p.length - 1], head)) { chain = [...p.slice(0, -1), ...chain]; used[j] = true; grew = true; break }
      }
    }
    chains.push(chain)
  }
  const closedChains = chains.filter((c) => same(c[0], c[c.length - 1]))
  const openChains = chains.filter((c) => !same(c[0], c[c.length - 1]))
  if (openChains.length === 0) return { areas: [], islandsSkipped: 0 }

  type Pt = { x: number; z: number }
  const local = (p: LatLon): Pt => proj.toLocal(p)
  // the box as an exact axis-aligned rectangle in local metres (toLocal is linear in lon/lat separately)
  const x0 = proj.toLocal({ lat: proj.origin.lat, lon: box.west }).x
  const x1 = proj.toLocal({ lat: proj.origin.lat, lon: box.east }).x
  const z0 = proj.toLocal({ lat: box.south, lon: proj.origin.lon }).z
  const z1 = proj.toLocal({ lat: box.north, lon: proj.origin.lon }).z
  const inside = (p: Pt): boolean => p.x >= x0 && p.x <= x1 && p.z >= z0 && p.z <= z1

  // clip a polyline (local coords) to the box, one crossing at a time; every maximal inside run comes out as
  // its own arc, so a chain that dips in and out of the box more than once yields more than one arc
  function boundaryHit(a: Pt, b: Pt): Pt {
    const ts: number[] = []
    if (b.x !== a.x) { ts.push((x0 - a.x) / (b.x - a.x)); ts.push((x1 - a.x) / (b.x - a.x)) }
    if (b.z !== a.z) { ts.push((z0 - a.z) / (b.z - a.z)); ts.push((z1 - a.z) / (b.z - a.z)) }
    let best = -1
    for (const t of ts) {
      if (t < -1e-9 || t > 1 + 1e-9) continue
      const q = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }
      if (q.x >= x0 - 1e-6 && q.x <= x1 + 1e-6 && q.z >= z0 - 1e-6 && q.z <= z1 + 1e-6) {
        if (best < 0 || Math.abs(t - 0.5) < Math.abs(best - 0.5)) best = t
      }
    }
    const t = best < 0 ? 0.5 : best
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }
  }
  function clipChain(chain: Pt[]): Pt[][] {
    const segs: Pt[][] = []
    let cur: Pt[] = []
    for (let i = 0; i < chain.length; i++) {
      const p = chain[i]
      const pin = inside(p)
      if (i === 0) { if (pin) cur.push(p); continue }
      const prev = chain[i - 1]
      const prevIn = inside(prev)
      if (prevIn && pin) cur.push(p)
      else if (prevIn && !pin) { cur.push(boundaryHit(prev, p)); segs.push(cur); cur = [] }
      else if (!prevIn && pin) cur = [boundaryHit(prev, p), p]
      // both outside: at this scale no coastline segment clips a corner without an intervening inside point
    }
    if (cur.length >= 2) segs.push(cur)
    return segs
  }

  const arcs: Pt[][] = []
  for (const chain of openChains) for (const seg of clipChain(chain.map(local))) if (seg.length >= 2) arcs.push(seg)
  if (arcs.length === 0) return { areas: [], islandsSkipped: 0 }

  // the box perimeter, walked counter-clockwise (NW -> SW -> SE -> NE -> NW) as a single 0..perim parameter
  const W = x1 - x0, H = z1 - z0, perim = 2 * W + 2 * H
  const clampV = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
  const tOf = (p: Pt): number => {
    const dTop = Math.abs(p.z - z1), dBot = Math.abs(p.z - z0), dRight = Math.abs(p.x - x1), dLeft = Math.abs(p.x - x0)
    const m = Math.min(dTop, dBot, dRight, dLeft)
    if (m === dLeft) return clampV(z1 - p.z, 0, H)
    if (m === dBot) return H + clampV(p.x - x0, 0, W)
    if (m === dRight) return H + W + clampV(p.z - z0, 0, H)
    return H + W + H + clampV(x1 - p.x, 0, W)
  }
  const CORNERS: { t: number; p: Pt }[] = [
    { t: 0, p: { x: x0, z: z1 } }, { t: H, p: { x: x0, z: z0 } },
    { t: H + W, p: { x: x1, z: z0 } }, { t: H + W + H, p: { x: x1, z: z1 } },
  ]
  // the corners crossed walking FORWARD (increasing t) from tFrom to tTo (tTo > tFrom, already unwrapped)
  function cornersForward(tFrom: number, tTo: number): Pt[] {
    return CORNERS
      .map((c) => { let ct = c.t; while (ct <= tFrom) ct += perim; return { ct, p: c.p } })
      .filter((c) => c.ct < tTo)
      .sort((a, b) => a.ct - b.ct)
      .map((c) => c.p)
  }

  if (process.env.COASTLINE_DEBUG) console.error('box', { x0, x1, z0, z1, W, H, perim })
  const withT = arcs.map((a) => ({ arc: a, tIn: tOf(a[0]), tOut: tOf(a[a.length - 1]) }))
  type Break = { t: number; kind: 'in' | 'out'; arc: number }
  const breaks: Break[] = []
  withT.forEach((w, i) => { breaks.push({ t: w.tIn, kind: 'in', arc: i }); breaks.push({ t: w.tOut, kind: 'out', arc: i }) })
  breaks.sort((a, b) => a.t - b.t)
  const posOfOut = new Map<number, number>()
  breaks.forEach((b, k) => { if (b.kind === 'out') posOfOut.set(b.arc, k) })

  /*
   * Merge every arc's entry and exit into one sequence sorted around the perimeter: an entry and an exit
   * alternate around it (each crossing flips inside/outside), so from an arc's exit, the box connector runs
   * to the ENTRY that is its immediate neighbour in this merged order — not the entry that happens to belong
   * to the "next" arc by its own tIn, which is a different (and wrong) pairing when arcs' own tIn/tOut are not
   * in perimeter order. And the connector goes the LONG way round (backward in this parameterization) — see
   * the function comment for why the short way encloses land instead of water.
   */
  const visited = new Array(withT.length).fill(false)
  const rings: Pt[][] = []
  let skipped = 0
  for (let s = 0; s < withT.length; s++) {
    if (visited[s]) continue
    const ring: Pt[] = []
    let cur = s
    do {
      visited[cur] = true
      const w = withT[cur]
      ring.push(...w.arc)
      const pos = posOfOut.get(cur)!
      const next = breaks[(pos - 1 + breaks.length) % breaks.length]
      if (next.kind !== 'in') {
        /*
         * BUGS.md #159. One malformed chain must not cost us the whole ocean.
         *
         * The alternation invariant above is correct, and REAL DATA still breaks it: a way digitised
         * backwards (land-left/water-right reversed), a chain whose end the extract cut so it dangles
         * inside the box, or an arc whose entry and exit coincide at a corner. Each is a single-chain
         * problem, so abandoning that one ring is safe.
         *
         * This was a `throw`, which aborted the entire bake — and the state it aborted into is the one San
         * Francisco is in today: NO bay and NO ocean at all, because `natural=coastline` was never consumed.
         * Nine chains of water beat zero. Skip the bad one, say so loudly enough that it is not forgotten,
         * and keep the rest.
         */
        if (process.env.COASTLINE_DEBUG) {
          console.error('breaks:', breaks.map((b) => `${b.kind}${b.arc}@${b.t.toFixed(0)}`).join(' '))
          console.error('arcs:', withT.map((a, i) => `#${i} len=${a.arc.length} tIn=${a.tIn.toFixed(0)} tOut=${a.tOut.toFixed(0)} start=${JSON.stringify(proj.toLatLon(a.arc[0]))} end=${JSON.stringify(proj.toLatLon(a.arc[a.arc.length - 1]))}`).join('\n'))
        }
        const at = proj.toLatLon(w.arc[w.arc.length - 1])
        console.warn(`  coastline: SKIPPED a chain — no entry precedes arc ${cur}'s exit near `
          + `${at.lat.toFixed(5)},${at.lon.toFixed(5)} (non-alternating crossings). `
          + `Set COASTLINE_DEBUG=1 for the crossing list.`)
        skipped++
        ring.length = 0
        break
      }
      const fwd = cornersForward(next.t, next.t <= w.tOut ? w.tOut : w.tOut + perim)
      ring.push(...[...fwd].reverse())
      cur = next.arc
    } while (cur !== s)
    if (ring.length >= 3) rings.push(ring)
  }
  if (skipped > 0) console.warn(`  coastline: ${skipped} chain(s) skipped; the rest of the water is built`)

  const pointInRing = (pt: Pt, poly: Pt[]): boolean => {
    let inRing = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, zi = poly[i].z, xj = poly[j].x, zj = poly[j].z
      if (((zi > pt.z) !== (zj > pt.z)) && (pt.x < ((xj - xi) * (pt.z - zi)) / (zj - zi) + xi)) inRing = !inRing
    }
    return inRing
  }
  const ringArea = (poly: Pt[]): number => {
    let a = 0
    for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p.x * q.z - q.x * p.z }
    return a / 2
  }

  // islands: a closed ring entirely inside the box becomes a hole (opposite winding from the outer ring, the
  // usual convention); one straddling the box edge is left un-subtracted and counted, rather than clipped as
  // if it were open coastline -- none of San Francisco's islands need it, and clipping a hole ring correctly
  // is a different problem from clipping the outer ring
  let islandsSkipped = 0
  const holesByRing: number[][][] = rings.map(() => [])
  for (const isl of closedChains) {
    const pts = isl.map(local)
    const allIn = pts.every(inside)
    const anyIn = pts.some(inside)
    if (!anyIn) continue
    if (!allIn) { islandsSkipped++; continue }
    for (let r = 0; r < rings.length; r++) {
      if (!pointInRing(pts[0], rings[r])) continue
      const outerCCW = ringArea(rings[r]) > 0
      const holeCCW = ringArea(pts) > 0
      const hole = outerCCW === holeCCW ? [...pts].reverse() : pts
      holesByRing[r].push(packPoints(hole))
      break
    }
  }

  // outward-facing CCW, like every other area (ccw() above) -- flip both the ring and its holes together if not
  const areas = rings.map((ring, r) => {
    const ccwOut = ringArea(ring) > 0
    const outRing = ccwOut ? ring : [...ring].reverse()
    const holes = holesByRing[r].map((h) => ccwOut ? h : [...unpackPoints(h)].reverse().flatMap((p) => [p.x, p.z]))
    return { ring: packPoints(outRing), ...(holes.length ? { holes } : {}) }
  })
  return { areas, islandsSkipped }
}

async function main(): Promise<void> {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const list = only.length > 0 ? only.map(city) : CITIES
  /*
   * --rides: only the ride files, rewritten from the package already baked. The ride graph is built entirely
   * from `pkg.edges` (`writeRides` → `rideFor`), so a change to `src/city/ridegraph.ts` — the junction
   * clustering, the exits, the roundabouts — reaches the game through two minutes of this rather than four
   * hours of Overpass. Nothing else in the package is touched. (BUGS.md #183: the collapseClusters fix that
   * stops a rider being shunted off California Street landed mid-bake and needed exactly this.)
   */
  if (process.argv.includes('--rides')) {
    const { readFileSync } = await import('node:fs')
    for (const spec of list) {
      assertFresh(spec.id)
      const pkg = JSON.parse(readFileSync(packageFile(spec.id), 'utf8')) as CityPackage
      console.log(`${spec.id}:`)
      // (the bike trails again, from the zones as they are now: a zone edit then needs only --rides)
      const proj = new Projection(pkg.origin)
      const trailZones = loadZones(spec, (lat, lon) => proj.toLocal({ lat, lon })).filter((zn) => zn.props.trails === 'bike')
      let opened = 0
      for (const e of pkg.edges) {
        if (e.trail || !/^(footway|path|track|bridleway)$/.test(e.kind ?? '') || (!e.bridge && /^(sand|mud|grass|rock|stone|wood)$/.test(e.surface ?? ''))) continue
        const pts = unpackPoints(e.points)
        const mid = pts[Math.floor(pts.length / 2)]
        if (trailZones.some((zn) => zonesAt([zn], mid.x, mid.z).length > 0)) { e.trail = true; opened++ }
      }
      if (region(spec.region).rideFootBridges) {
        const ids = footBridgeLinks(pkg.edges as unknown as Parameters<typeof footBridgeLinks>[0])
        for (const e of pkg.edges) if (ids.has(e.id) && !e.trail) { e.trail = true; opened++ }
      }
      {
        const o = openElevatedWalks(pkg.edges, region(spec.region).elevatedWalks ?? [], (lon) => proj.toLocal({ lat: pkg.origin.lat, lon }).x)
        if (o.opened) { console.log(`  elevated walks ridden: ${o.opened} ways, ${o.flights} flights up, ${o.ramped} ways ramped down`); opened += o.opened }
      }
      if (opened) console.log(`  ${opened} more trails opened to bikes`)
      // the declared bike ramps, laid again: the package, the tiles they (and the last ones) lie in, then v3
      const old = new Map(pkg.edges.filter((e) => e.bikeRamp).map((e) => [e.id, e]))
      const r = layBikeRamps(pkg.edges, spec.region ?? spec.id, (lat, lon) => proj.toLocal({ lat, lon }))
      for (const t of r.log) console.log(`  bike ramp: ${t}`)
      const ramps = r.removed.length + r.added.length > 0
      // the survey pins again (tools/survey-pins.ts): the ways they move rewritten in their tiles
      const pins = process.env.SURVEY_PINS === '0' ? { moved: new Set<PackedEdge>(), log: [] } : applySurveyPins(pkg.edges, region(spec.region).surveyPins ?? [], (lat, lon) => proj.toLocal({ lat, lon }))
      for (const t of pins.log) console.log(`  ${t}`)
      // the level plans again (tools/level-plans.ts), after the pins: their ways join the pins' in the tile rewrite
      if (process.env.LEVEL_PLANS !== '0') {
        const lp = applyLevelPlans(pkg.edges, region(spec.region).levelPlans ?? [], (lat, lon) => proj.toLocal({ lat, lon }))
        for (const t of lp.log) console.log(`  ${t}`)
        for (const e of lp.moved) pins.moved.add(e)
      }
      // the deck zones again (tools/deck-zones.ts): re-pinned and re-graded only (ground, walls and laid routes need the full bake)
      if (process.env.DECK_ZONES !== '0' && (region(spec.region).deckZones?.length || process.env.BDTOPO_BAND === '1')) {
        if (spec.datum === undefined) console.log('  deck zones: skipped (--rides needs the CitySpec datum)')
        else {
          // (BDTOPO_BAND=1: the Seine band again, from BD TOPO's cached pages, the hand zones over it: the same zones as the bake)
          const r = region(spec.region), toL = (lat: number, lon: number) => proj.toLocal({ lat, lon })
          // (the excluded bridges' shapes from the package: its outlines and its named bridge edges; the bake used OSM's ways)
          const osmB: BandBridgeShape[] = [...(pkg.bridges ?? []).filter((q) => q.name).map((q) => ({ name: q.name!, pts: unpackPoints(q.ring), ring: true })),
            ...pkg.edges.filter((e) => e.bridge && e.name).map((e) => ({ name: e.name!, pts: unpackPoints(e.points) }))]
          const specs = process.env.BDTOPO_BAND === '1' ? (await bandDeckZones(spec.centre, spec.radius ?? 1000, r.deckZones ?? [], r.bandExclude ?? [], toL, (t) => console.log(`  ${t}`), r.riverLevel, osmB)).zones : r.deckZones
          const dz = applyDeckZoneRoutes(pkg.edges, deckZonesOf(specs, toL, spec.datum), toL, false)
          for (const t of dz.log) console.log(`  ${t}`)
          for (const e of dz.moved) pins.moved.add(e)
        }
      }
      if (pins.moved.size) {
        const { existsSync, writeFileSync } = await import('node:fs')
        const byTile = new Map<string, PackedEdge[]>()
        for (const e of pins.moved) for (const k of tilesOfLine(e.points)) (byTile.get(k) ?? byTile.set(k, []).get(k)!).push(e)
        for (const [k, es] of byTile) {
          const [tx, tz] = k.split(',').map(Number)
          const f = resolve(workDir(spec.id), 'tiles', `${tx}_${tz}.json`)
          if (!existsSync(f)) continue
          const t = JSON.parse(readFileSync(f, 'utf8')) as { edges: PackedEdge[] }
          const ids = new Map(es.map((e) => [e.id, e]))
          t.edges = t.edges.map((e) => { const m = ids.get(e.id); return m ? { ...e, heights: m.heights, ramp: m.ramp } : e })
          writeFileSync(f, JSON.stringify(t))
        }
        console.log(`  survey pins: ${pins.moved.size} ways, ${byTile.size} tiles rewritten`)
      }
      if (opened || ramps || pins.moved.size) await writeFile(packageFile(spec.id), JSON.stringify(pkg))
      if (ramps) {
        const { existsSync, writeFileSync } = await import('node:fs')
        const tiles = new Set<string>()
        for (const e of [...old.values(), ...r.added]) for (const k of tilesOfLine(e.points)) tiles.add(k)
        for (const k of tiles) {
          const [tx, tz] = k.split(',').map(Number)
          const f = resolve(workDir(spec.id), 'tiles', `${tx}_${tz}.json`)
          if (!existsSync(f)) continue
          const t = JSON.parse(readFileSync(f, 'utf8')) as { edges: PackedEdge[] }
          t.edges = t.edges.filter((e) => !e.bikeRamp)
          for (const e of r.added) if (tilesOfLine(e.points).has(k)) t.edges.push(e)
          writeFileSync(f, JSON.stringify(t))
        }
        console.log(`  bike ramps: ${r.removed.length} stripped, ${r.added.length} laid, ${tiles.size} tiles rewritten`)
      }
      await writeRides(pkg)
      if (ramps || pins.moved.size) {
        const { execFileSync } = await import('node:child_process')
        execFileSync('node', ['--max-old-space-size=8192', '--experimental-strip-types', 'tools/map-v3.ts', spec.id], { stdio: 'inherit', cwd: resolve(import.meta.dirname, '..') })
      }
      // (shipped files rewritten: a new bake number, so no phone pairs the new ride graph with the old one's tiles)
      console.log(`  bake ${recordBake(spec.id)}`)
    }
    return
  }
  /*
   * --decks: only the bridge decks, on the package already baked — for working on a bridge model's deck profile
   * (src/render/landmarks/sf/bay-bridge.ts `lowerY`) without the twenty minutes of a bake. The ways are conformed
   * again from what they were BEFORE the last conform (kept beside the package as `decks-undo.json`, so a changed
   * declaration does not build on the last one's heights), written into the package, the tiles they lie in, the
   * ride files, and v3 (`npm run map:v3`, which keeps the zones and the datum a bake wrote).
   */
  if (process.argv.includes('--decks')) {
    const { readFileSync, existsSync, writeFileSync } = await import('node:fs')
    const { execFileSync } = await import('node:child_process')
    for (const spec of list) {
      assertFresh(spec.id)
      const file = packageFile(spec.id)
      const pkg = JSON.parse(readFileSync(file, 'utf8')) as CityPackage
      const undoFile = decksUndoFile(spec.id)
      const touched = existsSync(undoFile) ? undoDecks(pkg.edges, JSON.parse(readFileSync(undoFile, 'utf8')) as DeckUndo) : new Set<number>()
      const terrain = new Terrain(pkg.terrain)
      // (and the foot bridges' ends, which a package baked before rampFootBridgeEnds still has standing in the air)
      for (const id of rampFootBridgeEnds(pkg.edges, spec.region === 'paris')) touched.add(id)
      const work = conformWithUndo(spec.region ?? spec.id, pkg.origin, pkg.edges, (x, z) => terrain.rawHeightAt(x, z))
      if (!work) { console.log(`${spec.id}: no bridge decks declared for region ${spec.region}`); continue }
      console.log(`${spec.id}: ${describe(work.report)}`)
      for (const id of work.report.changed) touched.add(id)
      writeFileSync(undoFile, JSON.stringify(work.undo))
      await writeFile(file, JSON.stringify(pkg))
      // the tiles those ways lie in: the same records, by id
      const byId = new Map(pkg.edges.filter((e) => touched.has(e.id)).map((e) => [e.id, e]))
      const tiles = new Set<string>()
      for (const e of byId.values()) for (const k of tilesOfLine(e.points)) tiles.add(k)
      let rewritten = 0
      for (const k of tiles) {
        const [tx, tz] = k.split(',').map(Number)
        const f = resolve(workDir(spec.id), 'tiles', `${tx}_${tz}.json`)
        if (!existsSync(f)) continue
        const t = JSON.parse(readFileSync(f, 'utf8')) as { edges: PackedEdge[] }
        t.edges = t.edges.map((e) => byId.get(e.id) ?? e)
        writeFileSync(f, JSON.stringify(t))
        rewritten++
      }
      console.log(`  ${touched.size} ways written into the package and ${rewritten} tiles`)
      await writeRides(pkg)
      execFileSync('node', ['--max-old-space-size=8192', '--experimental-strip-types', 'tools/map-v3.ts', spec.id], { stdio: 'inherit', cwd: resolve(import.meta.dirname, '..') })
    }
    return
  }
  // --replant: only the trees, on the package already baked (city/plantings.ts), and its tiles rewritten — for
  // working on the plants without the hours a full bake spends waiting on Overpass
  if (process.argv.includes('--replant')) {
    /*
     * STALE — refuses to run (2026-10-04). It re-tiles from the package JSON alone, which covers only the detail box: a
     * run on San Francisco left 7 746 tiles of the full bake's 9 206 (deleting the wider ring's) and 46 864 street trees
     * of 72 204 (clipped to the package's old radius). Re-plant with a full bake until this path is brought back in step
     * with `bake()` — the tiling and the street-tree box both.
     */
    if (!process.argv.includes('--replant-anyway')) {
      console.error('--replant is stale: it drops the tiles outside the package box and the street trees past its radius. Run a full bake (see the comment in tools/bake.ts).')
      process.exit(1)
    }
    const { readFileSync } = await import('node:fs')
    for (const spec of list) {
      assertFresh(spec.id)
      const pkg = JSON.parse(readFileSync(packageFile(spec.id), 'utf8')) as CityPackage
      // (the reserve boundaries a bake now drops, out of a package baked before it did)
      const before = pkg.areas.length
      pkg.areas = pkg.areas.filter((a) => a.kind === 'water' || !tooBigForAnArea(unpackPoints(a.ring)))
      if (pkg.areas.length < before) console.log(`  ${before - pkg.areas.length} reserve-sized green areas dropped`)
      const proj = new Projection(pkg.origin)
      const ex = extentOf(spec)
      const km2 = regionsOf(spec).length ? detailKm2(spec) : ((ex.west + ex.east) * (ex.south + ex.north)) / 1e6
      const cap = Math.max(TREE_CAP, Math.round(TREES_PER_KM2 * km2 * (spec.region === 'paris' ? 2 : 1)))
      const street = spec.streetTrees === 'datasf'
        ? await Promise.all([import('./sf-trees.ts'), import('../src/city/sf/trees.ts')])
          // (clipped to the package's own extent: it may be from before the box grew)
          .then(async ([t, f]) => f.sfPlantings(await t.fetchStreetTrees(bboxOf(spec)), (g) => proj.toLocal(g),
            (x, z) => Math.abs(x) <= pkg.radius && Math.abs(z) <= pkg.radius))
        : undefined
      const plantZones = new PlantZones(loadZones(spec, (lat, lon) => proj.toLocal({ lat, lon })))
      const planted = newPlantReport()
      pkg.plantings = packPlantings(plantCity(pkg, cap, street, plantZones, planted, handTreesOf(spec.id, (lat, lon) => proj.toLocal({ lat, lon }))))
      logPlanting(pkg.plantings.length / 5, planted, plantZones.count, cap, km2)
      console.log(`${spec.id}: ${pkg.plantings.length / 5} trees planted${street ? ` (${street.length} from the city's list)` : ''}`)
      await writeFile(packageFile(spec.id), JSON.stringify(withoutFineGrid(pkg)))
      const bake = newBakeId()
      await writeTiles(pkg, region(spec.region).riverDrop ?? 0, bake)
      recordBake(spec.id, bake)
    }
    return
  }
  for (const c of list) await bake(c)
  /*
   * The Search screen's positions come from the bake (tools/landmark-where.ts), so they are written with it: Paris was
   * never run through the tool by hand, and 2,600 of its 2,800 landmarks read "not placed" (owner, 2026-10-30).
   */
  {
    const { execFileSync } = await import('node:child_process')
    for (const c of list) {
      try {
        execFileSync(process.execPath, ['--experimental-strip-types', resolve(import.meta.dirname, 'landmark-where.ts'), c.id], { stdio: ['ignore', 'pipe', 'inherit'] })
      } catch (e) { console.warn(`  landmark-where ${c.id}: ${(e as Error).message}`) }
    }
  }
  // what the page's city menu lists: every city in cities.ts that has been baked
  const { existsSync } = await import('node:fs')
  // with where each one is, so a pasted "lat, lon" (the page's go-to) can find the city it falls in
  const { readFileSync } = await import('node:fs')
  // `live` gates the menu, not the bake: an unfinished city's package can sit in public/cities without being
  // offered to the player, so baking one to look at it does not put it in front of anybody.
  void existsSync
  const index = CITIES.filter((c) => c.live && isBaked(c.id)).map((c) => {
    const pkg = JSON.parse(readFileSync(packageFile(c.id), 'utf8')) as CityPackage
    // `box` as well as `radius`: the go-to decides what is in the city from the box (BUGS.md #163)
    return { id: c.id, name: c.name, lat: pkg.origin.lat, lon: pkg.origin.lon, radius: pkg.radius, box: pkg.box }
  })
  // (a file of this repo, bundled into the game, not a bake file: commit it — src/main.ts imports it)
  await writeFile(resolve(import.meta.dirname, '..', 'src', 'cities.json'), JSON.stringify(index, null, 2) + '\n')
  console.log(`\n  → src/cities.json  ${index.length} cities (commit it)`)
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch((e) => { console.error(e); process.exit(1) })
}

/**
 * What the footprint-form scan found (src/city/ring-forms.ts). Printed on every bake of every city, named,
 * because the point of moving this out of a hand-run script is that nobody has to remember to look.
 *
 * Deliberately not a bare count. `arc`, `stair` and `saw` are different findings — a smooth curve, a curve
 * drawn as a staircase, and per-bay depth — and the thresholds are printed with them because they are
 * per-city (`CitySpec.ringForms`) and a new city's mapping conventions will want them checked.
 */
function reportRingForms(scanned: number, formed: { id: number; name: string; h: number; f: RingForm }[],
  t: ReturnType<typeof thresholds>): void {
  const by = (k: RingForm['fired']): number => formed.filter((x) => x.f.fired === k).length
  console.log(`  ring forms: ${scanned} outlines over ${t.minHeight} m scanned, ${formed.length} the slot kit `
    + `cannot express (arc ${by('arc')}, stair ${by('stair')}, saw ${by('saw')}) `
    + `— route to from-scratch modelling, LADDER §3c treatment 4+`)
  console.log(`    thresholds: curved arc+stair >= ${t.curvedM} m, saw >= ${t.sawM} m, `
    + `stair >= ${t.stairMinRun} steps under ${t.stairMaxMean} m, saw ${t.sawMinMean}-${t.sawMaxMean} m teeth, `
    + `cv < ${t.sawMaxCv} (per-city: CitySpec.ringForms)`)
  const CAP = 40
  for (const x of [...formed].sort((a, b) => b.h - a.h).slice(0, CAP)) {
    console.log(`      way/${String(x.id).padEnd(11)} ${String(Math.round(x.h)).padStart(4)} m  ${x.f.fired.padEnd(5)} `
      + `arc=${x.f.arc}m stair=${x.f.stair}m saw=${x.f.saw}m ortho=${x.f.ortho}%  ${x.name}`)
  }
  if (formed.length > CAP) console.log(`      …and ${formed.length - CAP} more (docs/<city>-archetypes.csv, column \`form\`)`)
}

/** Even-odd point in polygon, for deciding whether a part sits inside an outline. */
function pointInRing(ring: { x: number; z: number }[], x: number, z: number): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) hit = !hit
  }
  return hit
}

/** Min over a square window of `r` cells, then max over the same, then two box blurs. */
function bareEarth(h: number[], cols: number, rows: number, r: number, wet?: boolean[]): number[] {
  const at = (a: number[], c: number, w: number): number =>
    a[Math.max(0, Math.min(rows - 1, w)) * cols + Math.max(0, Math.min(cols - 1, c))]
  const pass = (src: number[], f: (a: number, b: number) => number, rad: number): number[] => {
    // separable: along rows, then along columns
    const tmp = new Array<number>(src.length)
    for (let w = 0; w < rows; w++) {
      for (let c = 0; c < cols; c++) {
        let v = at(src, c, w)
        for (let k = -rad; k <= rad; k++) v = f(v, at(src, c + k, w))
        tmp[w * cols + c] = v
      }
    }
    const out = new Array<number>(src.length)
    for (let w = 0; w < rows; w++) {
      for (let c = 0; c < cols; c++) {
        let v = at(tmp, c, w)
        for (let k = -rad; k <= rad; k++) v = f(v, at(tmp, c, w + k))
        out[w * cols + c] = v
      }
    }
    return out
  }
  // water left out of the minimum (+∞) and the maximum (−∞); a cell with only water round it keeps its own
  const lowered = pass(wet ? h.map((v, i) => (wet[i] ? Infinity : v)) : h, Math.min, r).map((v, i) => (Number.isFinite(v) ? v : h[i]))
  const opened = pass(wet ? lowered.map((v, i) => (wet[i] ? -Infinity : v)) : lowered, Math.max, r).map((v, i) => (Number.isFinite(v) ? v : lowered[i]))
  const mean = (a: number, b: number): number => a + b
  let blurred = opened
  for (let i = 0; i < 2; i++) {
    const sum = pass(blurred, mean, 1)
    // each axis starts from the centre and then adds [left, centre, right], so the kernel is [1, 2, 1]
    // on each axis and 16 in total: a small binomial blur
    blurred = sum.map((v) => v / 16)
  }
  return blurred
}

/**
 * `bareEarth` on a typed grid — the fine grid is 14 million samples and this makes several working copies,
 * which as `number[]` is 115 MB each and enough allocation churn to matter in a four-hour bake.
 *
 * `r` is a radius in CELLS: the caller converts from metres, because the physical size of a building does
 * not change when the grid step does (see the call site).
 */
function bareEarthF(h: Float64Array, cols: number, rows: number, r: number, wet?: Uint8Array): Float64Array {
  const at = (a: Float64Array, c: number, w: number): number =>
    a[Math.max(0, Math.min(rows - 1, w)) * cols + Math.max(0, Math.min(cols - 1, c))]
  const pass = (src: Float64Array, f: (a: number, b: number) => number, rad: number): Float64Array => {
    const tmp = new Float64Array(src.length)
    for (let w = 0; w < rows; w++) {
      for (let c = 0; c < cols; c++) {
        let v = at(src, c, w)
        for (let k = -rad; k <= rad; k++) v = f(v, at(src, c + k, w))
        tmp[w * cols + c] = v
      }
    }
    const out = new Float64Array(src.length)
    for (let w = 0; w < rows; w++) {
      for (let c = 0; c < cols; c++) {
        let v = at(tmp, c, w)
        for (let k = -rad; k <= rad; k++) v = f(v, at(tmp, c, w + k))
        out[w * cols + c] = v
      }
    }
    return out
  }
  const masked = (src: Float64Array, fill: number): Float64Array => {
    if (!wet) return src
    const out = new Float64Array(src.length)
    for (let i = 0; i < src.length; i++) out[i] = wet[i] ? fill : src[i]
    return out
  }
  const restore = (out: Float64Array, was: Float64Array): Float64Array => {
    for (let i = 0; i < out.length; i++) if (!Number.isFinite(out[i])) out[i] = was[i]
    return out
  }
  const lowered = restore(pass(masked(h, Infinity), Math.min, r), h)
  let blurred = restore(pass(masked(lowered, -Infinity), Math.max, r), lowered)
  for (let i = 0; i < 2; i++) {
    const sum = pass(blurred, (a, b) => a + b, 1)
    for (let k = 0; k < sum.length; k++) sum[k] /= 16
    blurred = sum
  }
  return blurred
}

/*
 * THE STRUCTURE MASK: the fine posts in the corridor of a bridge or an overpass (the ground under the deck, its banks), of the
 * first STRUCT_BRIDGE_HEAD m of road off each end of one, and of the first STRUCT_MOUTH m of road out of a tunnel's mouth (its cut).
 * A corridor is the way's half width, its pavement, and STRUCT_PAD.
 */
const STRUCT_PAD = 3
const STRUCT_BRIDGE_HEAD = 40
const STRUCT_MOUTH = 80
/** the mask's class for a tunnel's approach (1 is a bridge, its head): there a street is levelled from its centre line, not its corridor's highest */
const STRUCT_MOUTH_CLASS = 2
function structureMask(edges: PackedEdge[], x0: number, z0: number, cols: number, rows: number, step: number): Uint8Array {
  const m = new Uint8Array(cols * rows)
  // (STRUCT_MASK=0 bakes without it, for an A/B)
  if (process.env.STRUCT_MASK === '0') return m
  const paint = (p: { x: number; z: number }[], r: number, k = 1): void => {
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1
      const c0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - r - x0) / step)), c1 = Math.min(cols - 1, Math.ceil((Math.max(a.x, b.x) + r - x0) / step))
      const r0 = Math.max(0, Math.floor((Math.min(a.z, b.z) - r - z0) / step)), r1 = Math.min(rows - 1, Math.ceil((Math.max(a.z, b.z) + r - z0) / step))
      for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) {
        const x = x0 + c * step, z = z0 + rr * step
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L2))
        if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) <= r) m[rr * cols + c] = Math.max(m[rr * cols + c], k)
      }
    }
  }
  const radius = (e: PackedEdge): number => e.width / 2 + (e.foot ? 0 : e.walk) + STRUCT_PAD
  // the first `len` metres of a way from one of its ends
  const head = (p: { x: number; z: number }[], fromStart: boolean, len: number): { x: number; z: number }[] => {
    const q = fromStart ? p : [...p].reverse()
    const out = [q[0]]
    let run = 0
    for (let i = 1; i < q.length && run < len; i++) {
      const d = Math.hypot(q[i].x - q[i - 1].x, q[i].z - q[i - 1].z)
      if (run + d <= len) { out.push(q[i]); run += d; continue }
      const t = (len - run) / d
      out.push({ x: q[i - 1].x + (q[i].x - q[i - 1].x) * t, z: q[i - 1].z + (q[i].z - q[i - 1].z) * t })
      run = len
    }
    return out
  }
  const ends = new Map<number, 'bridge' | 'mouth'>()
  for (const e of edges) {
    if (e.foot) continue
    if (e.bridge && !e.tunnel) {
      paint(unpackPoints(e.points), radius(e))
      for (const n of [e.a, e.b]) if (!ends.has(n)) ends.set(n, 'bridge')
    } else if (e.tunnel) for (const n of [e.a, e.b]) ends.set(n, 'mouth')
  }
  for (const e of edges) {
    if (e.foot || e.bridge || e.tunnel) continue
    const p = unpackPoints(e.points)
    for (const [n, fromStart] of [[e.a, true], [e.b, false]] as const) {
      const k = ends.get(n)
      if (k) paint(head(p, fromStart, k === 'mouth' ? STRUCT_MOUTH : STRUCT_BRIDGE_HEAD), radius(e), k === 'mouth' ? STRUCT_MOUTH_CLASS : 1)
    }
  }
  return m
}

/** how far past a deck's edge the ground either side is read, and how far out to look for it past a neighbouring deck or the water */
const DECK_PAD = 1.5
const DECK_SEEK = 30
function deckOff(h: Float64Array, edges: PackedEdge[], x0: number, z0: number, cols: number, rows: number, step: number, wet: Uint8Array, survey: Uint8Array): number {
  // pass 1: which posts are under a deck, and across which way
  const under = new Int32Array(cols * rows).fill(-1)
  const across: { ux: number; uz: number }[] = []
  for (const e of edges) {
    if (!e.bridge || e.tunnel) continue
    const p = unpackPoints(e.points), r = e.width / 2 + (e.foot ? 0.5 : e.walk) + DECK_PAD
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz)
      if (L < 0.5) continue
      const k = across.push({ ux: -dz / L, uz: dx / L }) - 1
      // (strictly inside the way's run: its first and last segment stop short of the ends, where the abutment is earth)
      const t0 = i === 1 ? 2 / L : 0, t1 = i === p.length - 1 ? 1 - 2 / L : 1
      const c0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - r - x0) / step)), c1 = Math.min(cols - 1, Math.ceil((Math.max(a.x, b.x) + r - x0) / step))
      const r0 = Math.max(0, Math.floor((Math.min(a.z, b.z) - r - z0) / step)), r1 = Math.min(rows - 1, Math.ceil((Math.max(a.z, b.z) + r - z0) / step))
      for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) {
        const x = x0 + c * step, z = z0 + rr * step
        const t = ((x - a.x) * dx + (z - a.z) * dz) / (L * L)
        if (t <= t0 || t >= t1) continue
        if (Math.abs((x - a.x) * (-dz / L) + (z - a.z) * (dx / L)) <= r) under[rr * cols + c] = k
      }
    }
  }
  // pass 2: each such post from the nearest open ground out either side, weighted by nearness
  const free = (x: number, z: number): number | null => {
    const c = Math.round((x - x0) / step), r = Math.round((z - z0) / step)
    if (c < 0 || r < 0 || c >= cols || r >= rows) return null
    const i = r * cols + c
    return under[i] >= 0 || wet[i] || !survey[i] ? null : h[i]
  }
  const out = Float64Array.from(h)
  let n = 0
  for (let i = 0; i < under.length; i++) {
    const k = under[i]
    if (k < 0 || wet[i] || !survey[i]) continue
    const { ux, uz } = across[k], x = x0 + (i % cols) * step, z = z0 + Math.floor(i / cols) * step
    let ya: number | null = null, yb: number | null = null, da = 0, db = 0
    for (let o = step; o <= DECK_SEEK && ya === null; o += step / 2) { ya = free(x + ux * o, z + uz * o); da = o }
    for (let o = step; o <= DECK_SEEK && yb === null; o += step / 2) { yb = free(x - ux * o, z - uz * o); db = o }
    const v = ya !== null && yb !== null ? (ya * db + yb * da) / (da + db) : ya ?? yb
    if (v === null || v >= h[i]) continue
    out[i] = v
    n++
  }
  h.set(out)
  return n
}

/** the bare-earth blur ([1,2,1] twice each way), each post averaged only with the posts of its own class */
function classBlur(h: Float64Array, cols: number, rows: number, cls: Uint8Array): Float64Array {
  let a = Float64Array.from(h)
  for (let it = 0; it < 2; it++) {
    for (const [dc, dr] of [[1, 0], [0, 1]]) {
      const b = new Float64Array(a.length)
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = r * cols + c
        let s = 2 * a[i], w = 2
        for (const k of [-1, 1]) {
          const cc = c + dc * k, rr = r + dr * k
          if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue
          const j = rr * cols + cc
          if (cls[j] !== cls[i]) continue
          s += a[j]; w++
        }
        b[i] = s / w
      }
      a = b
    }
  }
  return a
}

/** `sampleGrid` on a typed grid. */
function sampleGridF(h: Float64Array, cols: number, rows: number, ox: number, oz: number, step: number,
                     x: number, z: number): number {
  const fx = (x - ox) / step
  const fz = (z - oz) / step
  const ix = Math.floor(fx)
  const iz = Math.floor(fz)
  const tx = fx - ix
  const tz = fz - iz
  const g = (c: number, w: number): number =>
    h[Math.max(0, Math.min(rows - 1, w)) * cols + Math.max(0, Math.min(cols - 1, c))]
  const a = g(ix, iz) * (1 - tx) + g(ix + 1, iz) * tx
  const b = g(ix, iz + 1) * (1 - tx) + g(ix + 1, iz + 1) * tx
  return a * (1 - tz) + b * tz
}

/** One line for the planting, and a second for what it turned away. */
function logPlanting(n: number, r: PlantReport, zoneCount: number, cap: number, km2: number): void {
  if (!r.zoned) {
    console.log(`  ${n} trees planted by the old rules (no planting zones for this city); `
      + `${r.tooClose} turned away within ${MIN_SPACING} m of a tree already planted`)
    return
  }
  console.log(`  ${n} trees planted by ${zoneCount} planting zone(s): ${r.register} from the city's register, ${r.mapped} mapped, `
    + `${r.streetRows} invented along streets, ${r.parks} in parks`)
  console.log(`    turned away: ${r.tooClose} within ${MIN_SPACING} m of a tree already planted, `
    + `${r.crownInBuilding} whose crown would have reached into a building`
    + (r.capped ? `, ${r.capped} by the old city-wide ceiling of ${cap} (${km2.toFixed(1)} km²) — a zone's density is being overruled` : ''))
}

/**
 * The city's zones (src/map/zones.ts): `data/zones/<region>.json` then `data/zones/<city>.json`, both optional,
 * in local metres. A test area cut from a city (sf-mini) gets its region's zones exactly as the city does.
 */
function loadZones(spec: CitySpec, toLocal: (lat: number, lon: number) => { x: number; z: number }): LocalZone[] {
  const out: LocalZone[] = []
  const seen = new Set<string>()
  for (const name of [...(spec.region && spec.region !== spec.id ? [spec.region] : []), spec.id]) {
    const f = resolve(import.meta.dirname, '..', 'data', 'zones', `${name}.json`)
    if (!existsSync(f)) continue
    const file = JSON.parse(readFileSync(f, 'utf8')) as ZoneFile
    for (const zn of localZones(file.zones, toLocal)) {
      // a city's zone of the same ref replaces its region's
      if (seen.has(zn.ref)) out.splice(out.findIndex((q) => q.ref === zn.ref), 1)
      seen.add(zn.ref)
      out.push(zn)
    }
  }
  return out
}

/** The package as it ships as one file: everything except the fine ground grid, which only the tiles want. */
function withoutFineGrid(pkg: CityPackage): CityPackage {
  const { terrainFine: _fine, ...rest } = pkg
  return rest as CityPackage
}

/** Bilinear sample of a height grid at world metres. */
function sampleGrid(h: number[], cols: number, rows: number, ox: number, oz: number, step: number,
                    x: number, z: number): number {
  const fx = (x - ox) / step
  const fz = (z - oz) / step
  const ix = Math.floor(fx)
  const iz = Math.floor(fz)
  const tx = fx - ix
  const tz = fz - iz
  const g = (c: number, w: number): number =>
    h[Math.max(0, Math.min(rows - 1, w)) * cols + Math.max(0, Math.min(cols - 1, c))]
  const a = g(ix, iz) * (1 - tx) + g(ix + 1, iz) * tx
  const b = g(ix, iz + 1) * (1 - tx) + g(ix + 1, iz + 1) * tx
  return a * (1 - tz) + b * tz
}


/**
 * The same city cut into tiles and an index (PARIS_EXPAND.md §2, §8): the v2 tiles, bake-private
 * (`tools/cache/bake/<id>/index.json`, `tiles/<tx>_<tz>.json`, tools/bake-files.ts), and from them the shipped v3
 * (`public/cities/<id>/v3/`). The old tiles are cleared first, so a smaller box leaves none behind.
 */
/*
 * `shipped` is absent only on the replant-only path (`--trees`), which rebuilds tiles from the saved monolith: that
 * never held per-tile ground (the fine grid was always left out of it), so those tiles carry none, as before, and
 * no v3 is written from them.
 */
async function writeTiles(pkg: CityPackage, riverDrop: number, bake: string, shipped?: GroundModel, zones: LocalZone[] = [], datumRaw?: number): Promise<void> {
  const { rm } = await import('node:fs/promises')
  const terrain = new Terrain(pkg.terrain)
  // one level per river, however many polygons OSM draws it as (city/package.ts waterLevels)
  const water = pkg.areas.filter((a) => a.kind === 'water')
  const levels = waterLevels(water, (x, z) => terrain.heightAt(x, z), riverDrop, pkg.seaLevel ?? null)
  const byRing = new Map(water.map((a, k) => [a.ring, levels[k]]))
  const { index, tiles } = splitPackage(pkg, (_ring, area) => byRing.get(area.ring), shipped?.blocks)
  // the v2 tiles, index and terrain.bin are BAKE-PRIVATE (tools/bake-files.ts): what v3 is converted from, and what
  // the secondary tools read; only v3 ships
  const dir = workDir(pkg.id)
  await rm(resolve(dir, 'tiles'), { recursive: true, force: true })
  await mkdir(resolve(dir, 'tiles'), { recursive: true })
  const entries: TileEntry[] = []
  let total = 0
  for (const t of [...tiles.values()].sort((a, b) => a.key.localeCompare(b.key))) {
    const [tx, tz] = t.key.split(',').map(Number)
    const text = JSON.stringify(t)
    await writeFile(resolve(dir, 'tiles', `${tx}_${tz}.json`), text)
    total += text.length
    entries.push({ key: t.key, tx, tz, bytes: text.length, buildings: t.buildings.length, edges: t.edges.length })
  }
  /*
   * ---- the coarse grid leaves the index as a BINARY SIDECAR (BUGS.md #176).
   *
   * Even reduced to its coarse self, the grid was 20.5 MB of San Francisco's 26.2 MB index — 78% of a file
   * the client fetches and `JSON.parse`s on the main thread before anything renders, measured at 330 ms of
   * parse and 20 MB of heap held for the whole session. As `Int16` decimetres it is 5.2 MB, an
   * `ArrayBuffer`, and costs NO parse at all: the numbers were only ever stored to a centimetre and a
   * decimetre is finer than anything the DISTANT ground and the depth occluder — the only two things that
   * read it — can show.
   *
   * The index keeps the grid's shape and drops only the numbers, so a reader that does not know about the
   * sidecar sees an empty grid rather than a wrong one.
   */
  let sidecar = 0
  const packed = index.terrain
  if (packed && packed.heights.length > 0) {
    const dm = new Int16Array(packed.heights.length)
    for (let i = 0; i < dm.length; i++) dm[i] = Math.max(-32768, Math.min(32767, Math.round(packed.heights[i] * 10)))
    await writeFile(resolve(dir, 'terrain.bin'), Buffer.from(dm.buffer))
    sidecar = dm.byteLength
  }
  const full: CityIndex = {
    ...index, tiles: entries,
    ...(sidecar ? { terrain: { ...packed!, heights: [], bin: 'terrain.bin' } } : {}),
  }
  const text = JSON.stringify(full)
  await writeFile(resolve(dir, 'index.json'), text)
  /*
   * ---- and the same city in MAP FORMAT v3 (docs/MAP-FORMAT.md), beside it in `v3/`: integer centimetres, every
   * height baked from the terrain model the tiles ship (`shipped`), the zones in the index, the datum's true
   * elevation recorded. The game reads v3 when it is there.
   */
  if (shipped) {
    const v3 = writeV3(resolve(OUT, pkg.id), { ...full, terrain: full.terrain ? { ...full.terrain, heights: index.terrain!.heights } : undefined },
      [...tiles.values()], { raw: (x, z) => shipped.heightAt(x, z), zones, datumMsl: datumRaw, bake })
    console.log(`  → public/cities/${pkg.id}/v3/  ${v3.index.tiles.length} tiles, ${Math.round(v3.bytes / 1024)} kB · zFloor ${v3.index.zFloor} cm, `
      + `datum ${v3.index.datumMsl} m above sea level · ${v3.stats.zOverrides} streets with their own junction z, `
      + `${v3.stats.belowFloor} heights below the floor`)
    if (v3.stats.belowFloor > 0) throw new Error('map v3: a real height fell at or below zFloor, where it would read as "no height"')
  }
  const biggest = entries.reduce((m, e) => Math.max(m, e.bytes), 0)
  console.log(`  → ${dir}/  (bake-private v2) ${entries.length} tiles, ${Math.round(total / 1024)} kB `
    + `(largest ${Math.round(biggest / 1024)} kB), index ${Math.round(text.length / 1024)} kB`
    + (sidecar ? `, terrain.bin ${Math.round(sidecar / 1024)} kB` : ''))
}

/**
 * The layout before 2026-10-14, gone from public/: the single package beside the city's folder, and the v2 tiles,
 * index, terrain.bin, ride graphs and decks undo in it. Everything shipped is in v3/ now, and the rest is
 * bake-private (tools/bake-files.ts) — left in public/, they would be published and could be read stale.
 */
async function dropOldLayout(id: string): Promise<void> {
  const { rm } = await import('node:fs/promises')
  const old = [resolve(OUT, `${id}.json`), ...['tiles', 'index.json', 'terrain.bin', 'ride-bike.json', 'ride-run.json', 'decks-undo.json', 'river.json'].map((f) => resolve(OUT, id, f))]
  for (const f of old) await rm(f, { recursive: true, force: true })
}

/**
 * The ride graphs, bike and run, with the city's overrides, as the game would have built them at load
 * (city/ridefile.ts): `public/cities/<id>/v3/ride-bike.json`, `ride-run.json`.
 */
async function writeRides(pkg: CityPackage): Promise<void> {
  const terrain = new Terrain(pkg.terrain)
  const edges = mapEdges(pkg.edges, terrain)
  // (the traced gardens' walks OSM has not got, ridden but not drawn — their gravel is: tools/gardens/paths.ts)
  if (pkg.region === 'paris') {
    const walks = gardenPaths(pkg.origin, edges, (x, z) => terrain.heightAt(x, z), pkg.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => b.ring))
    edges.push(...walks.edges)
    console.log(`  garden walks laid in ${walks.gardens.length} gardens: ${walks.gardens.join('; ')}`)
    if (walks.skipped.length) console.log(`  garden walks not laid: ${walks.skipped.join('; ')}`)
  }
  for (const mode of ['bike', 'run'] as const) {
    const g = rideFor(pkg.id, pkg.origin, edges, mode, (x, z) => terrain.heightAt(x, z), pkg.region,
      pkg.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => b.ring), pkg.roundabouts)
    const text = JSON.stringify(packRide(g, mode))
    await mkdir(shippedDir(pkg.id), { recursive: true })
    await writeFile(resolve(shippedDir(pkg.id), `ride-${mode}.json`), text)
    console.log(`  → public/cities/${pkg.id}/v3/ride-${mode}.json  ${g.edges.size} edges, ${Math.round(text.length / 1024)} kB`)
  }
}

/**
 * A building whose OSM tags say it is a school, a library, a hospital, a fire station, a church, a museum or a
 * government office has no shops on its ground floor, whatever style the classifier gives it — `brick`'s ground
 * floor is shopfronts with PHARMACY and BOOKS painted on them (BUGFIX #320; render/prepare.ts does the same for
 * the restyles). PackedBuilding.noShops.
 */
const NO_SHOP_AMENITY = new Set(['school', 'college', 'university', 'kindergarten', 'library', 'hospital', 'clinic',
  'fire_station', 'police', 'townhall', 'courthouse', 'place_of_worship', 'community_centre', 'arts_centre', 'theatre',
  'social_facility', 'prison', 'post_office'])
const NO_SHOP_BUILDING = new Set(['school', 'college', 'university', 'kindergarten', 'hospital', 'church', 'cathedral',
  'chapel', 'temple', 'synagogue', 'mosque', 'civic', 'government', 'public', 'fire_station', 'museum', 'library',
  // and the works: a factory, a shed, a warehouse has loading doors, not PHARMACY (Pier 70's shipyard, 2026-10-04)
  'industrial', 'warehouse', 'factory', 'manufacture', 'hangar', 'shed', 'storage_tank', 'service', 'transportation', 'train_station'])
function noShopsFor(tags: Record<string, string>): boolean {
  return NO_SHOP_AMENITY.has(tags.amenity ?? '') || NO_SHOP_BUILDING.has(tags.building ?? '') || tags.tourism === 'museum'
    || tags.office === 'government' || tags.power === 'substation' || tags.power === 'plant'
}
