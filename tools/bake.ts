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
 *              public/cities/<id>.json
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
import { applyStreetPaint, markBrickSquares } from './street-paint.ts'
import { boreTunnels } from './tunnels.ts'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { CITIES, bboxOf, city, detailBboxOf, extentOf, type CitySpec } from './cities.ts'
import { joinNearMisses } from './gaps.ts'
import { bridgesQuery, campusQuery, sandQuery, wallsQuery, squaresQuery, stepsQuery, wideQuery, fringeQuery, cityQuery, furnitureQuery, partRelationsQuery, innerRings, outerRings, overpassTiled, type Bbox, type OsmWay, type LatLon } from './overpass.ts'
import { Elevation, ATTRIBUTION as TERRAIN_CREDIT, metresPerPixel } from './terrarium.ts'
import { Terrain, type PackedTerrain } from '../src/city/terrain.ts'
import { TILE, splitPackage, tilesOfLine, type CityIndex, type TileEntry } from '../src/city/tiles.ts'
import { waterLookup } from '../src/render/watermask.ts'
import { MIN_SPACING, TREE_CAP, TREES_PER_KM2, newPlantReport, packPlantings, plantCity, type PlantReport } from '../src/city/plantings.ts'
import { PlantZones } from '../src/city/zone-planting.ts'
import { mapEdges, packRide, rideFor } from '../src/city/ridefile.ts'
import { Projection, haversine } from '../src/city/geo.ts'
import { COURT_MAX_M2, courtEligible, courtSport, fitCourt, ringArea } from '../src/city/sports.ts'
import { chooseStyle, style as styleOf, type StyleId } from '../src/city/facade.ts'
import { packPoints, unpackPoints, waterLevels, type CityPackage, type PackedPoi, type PackedArea, type PackedBuilding, type PackedFringe, type PackedEdge, type PackedCourt, type PackedFurniture, type PackedLandmark, type PackedRail, type RoofShape } from '../src/city/package.ts'
import { pavementFor } from '../src/city/pavement.ts'
import { ringForm, thresholds, type RingForm } from '../src/city/ring-forms.ts'
import { largestComponent, lengthOf, type Edge } from '../src/city/graph.ts'
import { rideGraph, rideStats } from '../src/city/ridegraph.ts'
import { frontageOf, totemPoint } from '../src/city/landmark-place.ts'
import { landmarkKind, score } from './landmark-rank.ts'
import { bridgeHeights, liftWalksOffTheSea, rampFootBridgeEnds } from './bridges.ts'
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
import { buildSigns } from './signs.ts'
import { insetNested } from '../src/city/nesting.ts'
import { GroundModel } from '../src/map/ground.ts'
import { writeV3 } from './v3-writer.ts'
import { HUGE_AREA_SPAN, tooBigForAnArea } from '../src/city/park-planting.ts'
import { localZones, zoneTouchesRect, zonesAt, type LocalZone, type ZoneFile } from '../src/map/zones.ts'
import { NeighbourGrid, centroid, hasHeightTag, inferLevels, taggedLevels, type TaggedNeighbour } from './heights.ts'

const OUT = resolve(import.meta.dirname, '..', 'public', 'cities')
const DOCS = resolve(import.meta.dirname, '..', 'docs')
/** how far beyond the box the fringe of plain massing reaches, metres */
const FRINGE = 700
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
  const near = await overpassTiled(cityQuery, detailBox)
  const wider = sameBox(detailBox, wholeBox) ? { ways: [], nodes: [], relations: [] } : await overpassTiled(wideQuery, wholeBox)
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
    const got = await overpassTiled(stepsQuery, bbox(spec), 3200).catch((e) => {
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
  const campusWays = await overpassTiled(campusQuery, bbox(spec), 3200).then((g) => [...g.ways,
    ...(g.relations ?? []).flatMap((r) => outerRings(r).filter((q) => q.length >= 4).map((q) => ({ type: 'way' as const, id: r.id, nodes: [], geometry: q, tags: r.tags }) as unknown as OsmWay))]).catch((e) => {
    console.warn(`  campuses: not fetched (${String(e).slice(0, 120)})`)
    return [] as OsmWay[]
  })
  console.log(`  ${campusWays.length} hospital / university / college / school grounds`)
  // the region's own AUTHORED ways (src/city/sf/bridges.ts: the Bay Bridge Bikeway), joined to the real junctions
  // they name, their heights their own (kept aside here, put back by tools/deck-conform.ts)
  const authored = authoredWays(spec.region ?? spec.id, spec.centre, ways)
  ways.push(...authored.ways)
  if (authored.ways.length) console.log(`  ${authored.ways.length} authored ways of the region's own`)

  const proj = new Projection(spec.centre)
  const streetRegion = region(spec.region)
  const streets = ways.filter((w) => w.tags.highway && w.geometry && w.geometry.length === w.nodes.length)
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
  const railways = ways.filter((w) => RUNNING.test(w.tags.railway ?? '') && !/^(abandoned|disused|razed|construction|proposed)$/.test(w.tags.usage ?? '')
    && !(w.tags.service === 'yard' && w.tags.usage === 'industrial'))
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
    || parseFloat(t.layer ?? '0') < 0 || (t.level !== undefined && t.level.split(';').every((v) => parseFloat(v) < 0))
  // boats moored on the river are drawn as boats (render/boats.ts), not as twenty-metre blocks in the water
  /*
   * …and the historic SHIPS (BUGS.md #229, #251): OSM tags the waterfront's vessels `building=ship`, which went down
   * the building path — the owner: "two permanently placed ships … that render as victorian buildings in the water".
   * A ship is a boat (a hull at the water) unless a landmark entry claims its way for a model of its own (USS
   * Pampanito, manual-1.json): that one stays a building for the model to replace.
   */
  const shipModels = landmarkClaims(spec.region ?? spec.id)
  const isBoat = (w: { id: number; tags: Record<string, string> }): boolean => w.tags.building === 'boat' || w.tags.building === 'houseboat'
    || (w.tags.building === 'ship' && !shipModels.has(w.id))
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
  const partRels = await overpassTiled(partRelationsQuery, detailBboxOf(spec)).catch((e) => {
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
            points: packPoints(pts), surface: surfaceOf(w.tags),
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
      if (!/^(footway|path|track|bridleway)$/.test(e.kind ?? '') || /^(sand|mud|grass|rock|stone|wood)$/.test(e.surface ?? '')) continue
      const pts = unpackPoints(e.points)
      const mid = pts[Math.floor(pts.length / 2)]
      if (trailZones.some((zn) => zonesAt([zn], mid.x, mid.z).length > 0)) { e.trail = true; n++ }
    }
    if (n) console.log(`  ${n} trails opened to bikes (zones with trails: 'bike')`)
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
  const recordOf = spec.region === 'san-francisco'
    ? await import('./sf-parcels.ts').then(async (m) => m.parcelIndex(await m.fetchRolls(detailBboxOf(spec))))
      .catch((e: unknown) => { console.warn(`  sf-parcels: not fetched (${String(e).slice(0, 120)})`); return null })
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
  const withLevels = (tags: Record<string, string>, ring: { x: number; z: number }[] | null)
    : { tags: Record<string, string>; inferred: boolean } => {
    // a part hung in the air by min_level/min_height is left to the tag layer: a guessed total would fight it
    if (!ring || tags['building:min_level'] !== undefined || tags.min_height !== undefined) {
      return { tags, inferred: false }
    }
    const c = centroid(ring)
    const lv = inferLevels(tags, ring, grid.near(c.x, c.z, reg.levelInference.radius), reg.defaultLevels,
      reg.levelInference)
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
  const HOME_STYLE = new Set<string>(['sfapartment', 'tenement', 'victorian', 'edwardian'])
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
    if (ring.length < 3 || area(ring) < 12) continue
    const own = withLevels(w.tags, ring)
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
      ...roofFor(w.tags, p, styleId, ccwRing, w.id),
      ...(own.inferred ? { levelsInferred: true as const } : {}),
      ...(kind ? { archetype: kind.archetype } : {}),
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
  if (streetRegion.streetWidth === 'carriageway') fitStreetsBetweenBuildings(kept, buildings)

  // ---- the green and the wet, and the paved squares (their own query: only as areas, never as streets)
  const squares = await overpassTiled(squaresQuery, detailBboxOf(spec)).catch((e) => {
    console.warn(`  squares: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
    return { ways: [] as OsmWay[], relations: [] as typeof relations }
  })
  // the bare ground — sand and dirt — on its own query, so the street query's cache is untouched (#200)
  const bare = await overpassTiled(sandQuery, detailBboxOf(spec)).catch((e) => {
    console.warn(`  sand: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
    return { ways: [] as OsmWay[], relations: [] as typeof relations }
  })
  const areaWays = [...ways, ...squares.ways, ...bare.ways]
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
    const kind = areaKind(w)
    if (!kind || !w.geometry || w.geometry.length < 4) continue
    const ring = w.geometry.slice(0, -1).map((g) => proj.toLocal(g))
    if (area(ring) < 40) continue
    areas.push({ kind, ring: packPoints(ccw(ring)) })
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
    const sport = courtSport(w.tags.sport)
    if (!sport) continue
    const ring = w.geometry.slice(0, -1).map((g) => proj.toLocal(g))
    const m2 = ringArea(ring)
    const c = { x: ring.reduce((s, p) => s + p.x, 0) / ring.length, z: ring.reduce((s, p) => s + p.z, 0) / ring.length }
    const venue = venues.find((v) => pointInRing(v.ring, c.x, c.z))
    if (!courtEligible(w.tags, m2, venue?.name)) { courtsExcluded++; continue }
    const fit = fitCourt(ring, sport)
    if (!fit) { courtsExcluded++; continue }
    sportsCourts.push({
      sport: fit.sport, x: Math.round(fit.x * 100) / 100, z: Math.round(fit.z * 100) / 100,
      heading: Math.round(fit.heading * 10000) / 10000,
      len: Math.round(fit.len * 100) / 100, wid: Math.round(fit.wid * 100) / 100,
      ...(fit.half ? { half: true as const } : {}),
    })
    courtsBySport.set(fit.sport, (courtsBySport.get(fit.sport) ?? 0) + 1)
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
    areas.push({ kind: 'paved', ring: packPoints(ccw(ring)), top: true, ...(sq.brick ? { brick: true as const } : {}) })
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
        areas.push({ kind: kind!, ring: packPoints(ccw(pts)), ...(holes.length > 0 ? { holes } : {}) })
      }
      fromRelations++
    }
  }
  if (fromRelations > 0) console.log(`  ${fromRelations} more from relations (multipolygons)`)
  if (hugeAreas > 0) console.log(`  ${hugeAreas} reserve-sized green relations dropped (over ${HUGE_AREA_SPAN / 1000} km across)`)
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
  for (const w of railways) {
    if (!w.geometry || w.geometry.length < 2) continue
    // A tunnel is a railway you cannot see, and a train on one drives straight through the buildings above
    // it. OSM tags Paris full of these; `layer` below zero catches the rest.
    if (w.tags.tunnel && w.tags.tunnel !== 'no') continue
    if (w.tags.covered === 'yes') continue
    if (parseInt(w.tags.layer ?? '0', 10) < 0) continue
    const pts = w.geometry.map((g) => proj.toLocal(g))
    let len = 0
    for (let k = 1; k < w.geometry.length; k++) len += haversine(w.geometry[k - 1], w.geometry[k])
    if (len < 30) continue
    const r = w.tags.railway
    const layer = parseInt(w.tags.layer ?? '', 10)
    rails.push({
      id: w.id, points: packPoints(pts),
      kind: r === 'tram' || r === 'light_rail' ? 'tram' : r === 'subway' ? 'subway' : 'rail',
      ...(r === 'tram' && w.tags.electrified === 'no' ? { cable: true as const } : {}),
      ...(r === 'light_rail' ? { light: true as const } : {}),
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
  const box = bbox(spec, Math.max(...Object.values(extentOf(spec))))
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
  /*
   * Sampled well beyond the city itself. The grid is what the distant ground is built from, and anything
   * outside it has no ground under it — on Nob Hill that left the trees on the far crest standing in open
   * sky. Twice the radius costs a few thousand more samples and gives the city a horizon.
   */
  // (a box that is not square: its own extent each side, padded by its largest half-width)
  const ext = extentOf(spec)
  const tpad = Math.max(ext.west, ext.east, ext.south, ext.north)
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
    if (shoreline.length > 0) {
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
  const datum = sampleGridF(fineGround, fcols, frows, fx0, fz0, FINE_STEP, 0, 0)
  const datumRaw = datum
  for (let i = 0; i < ground.length; i++) ground[i] = Math.round((ground[i] - datum) * 100) / 100
  for (let i = 0; i < fineGround.length; i++) fineGround[i] = Math.round((fineGround[i] - datum) * 100) / 100
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
  let shipped = new GroundModel({
    coarse: { x0: tx0, z0: tz0, step: STEP, cols, rows, h: ground },
    fine: { x0: fx0, z0: fz0, step: FINE_STEP, cols: fcols, rows: frows, h: fineGround },
    fineTiles, tiles: blockTiles, fineStep: FINE_STEP, tile: TILE,
  })
  for (const [k, b] of shipped.blocks) {
    if (shipped.fineTiles.has(k)) { b.src = terrainFine.src; b.resM = terrainFine.resM } else { b.src = terrain.src; b.resM = terrain.resM }
  }
  console.log(`  terrain model: ${zones.length} zone(s); ${fineTiles.size} of ${blockTiles.length} tiles ship fine ground `
    + `(${FINE_STEP} m), the rest coarse (${STEP} m)`)
  const groundFine = (x: number, z: number): number => shipped.heightAt(x, z)

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
    const raw = pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)]
      const b = pts[Math.min(pts.length - 1, i + 1)]
      const l = Math.hypot(b.x - a.x, b.z - a.z) || 1
      const nx = -(b.z - a.z) / l
      const nz = (b.x - a.x) / l
      let h = centre[i]
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
    for (const e of kept) {
      const pts = unpackPoints(e.points)
      const h = e.heights!
      const cum = [0]
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z))
      const L = cum[cum.length - 1]
      const ha = nodeH.get(e.a) ?? h[0]
      const hb = nodeH.get(e.b) ?? h[h.length - 1]
      const EASE = Math.min(12, L / 2)
      e.heights = h.map((v, i) => {
        let out = v
        if (cum[i] < EASE) out = ha + (v - ha) * (cum[i] / EASE)
        if (L - cum[i] < EASE) out = hb + (out - hb) * ((L - cum[i]) / EASE)
        return Math.round(out * 100) / 100
      })
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
    const bedZones = zones.filter((zn) => zn.props.ground === 'beds')
    let n = 0
    if (bedZones.length) for (const a of areas) {
      if (a.kind !== 'park') continue
      const r = unpackPoints(a.ring)
      const c = centroid(r)
      if (bedZones.some((zn) => c.x >= zn.bbox[0] && c.x <= zn.bbox[2] && c.z >= zn.bbox[1] && c.z <= zn.bbox[3] && inRing(zn.ring, c.x, c.z))) { a.beds = true; n++ }
    }
    if (bedZones.length) console.log(`  ${n} parks laid out as planted beds`)
  }
  const layerCaps = (streetRegion.footBridgeLayers ?? []).map((c) => ({ ...proj.toLocal({ lat: c.lat, lon: c.lon }), radius: c.radius, layer: c.layer }))
  const decks = bridgeHeights(kept.filter((e) => !e.authored), { water: waterBodies, ground: groundAt, buried, layerCaps })
  // the ways lifted onto a deck are ramps: said outright, for the renderer (city/package.ts isRaised)
  for (const e of kept) if (decks.raised.has(e.id) && !e.bridge) e.ramp = true
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
    const r = rampFootBridgeEnds(kept)
    if (r.size) console.log(`  ${r.size} foot-bridge ends graded down to the paths they join`)
  }
  // street tunnels under a hill: their own mouth-to-mouth profile, and `bore` — ridden and drawn (tools/tunnels.ts)
  const bores = boreTunnels(kept, groundAt, (name, why) => console.log(`  tunnel not ridden: ${name} — ${why}`))
  if (bores.size > 0) console.log(`  ${bores.size} street-tunnel ways made rideable bores (their pavements included)`)
  /*
   * The ways over a MODELLED bridge take the model's deck heights, and the chain off each end of it is regraded to
   * meet them (src/city/bridge-decks.ts, tools/deck-conform.ts): the Golden Gate's roadway and sidewalks, both
   * decks of the Bay Bridge and the ramps on Rincon Hill. Before the cuts are carved: a deck that comes out of a
   * hill below the ground (the Bay Bridge's lower roadway, east of the Yerba Buena tunnel) is a `cut`, and the
   * ground is brought down to it. What it changed is kept (`decks-undo.json`), for `--decks`.
   */
  const deckWork = conformWithUndo(spec.region ?? spec.id, spec.centre, kept, groundAt)
  if (deckWork) console.log(`  bridge decks: ${describe(deckWork.report)}`)
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
    if (cuts.length) {
      const MARGIN = 8
      const carve = (h: ArrayLike<number> & { [i: number]: number }, x0: number, z0: number, step: number, ncols: number, nrows: number): number => {
        let lowered = 0
        for (const e of cuts) {
          const pts = unpackPoints(e.points)
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
              // alongside this piece only (the street's own ends included, never beyond them)
              const endA = i === 1 ? 0 : -0.05
              const endB = i === pts.length - 1 ? 1 : 1.05
              if (t < endA || t > endB) continue
              const tt = Math.max(0, Math.min(1, t))
              const d = Math.hypot(x - (a.x + dx * tt), z - (a.z + dz * tt))
              if (d > reach + 12) continue
              const level = e.heights![i - 1] + (e.heights![i] - e.heights![i - 1]) * tt
              const want = level + Math.max(0, d - reach) * 2
              const k = r * ncols + c
              if (want < h[k]) { h[k] = want; lowered++ }
            }
          }
        }
        return lowered
      }
      const nf = carve(fineGround, fx0, fz0, FINE_STEP, fcols, frows)
      const nc = carve(ground, tx0, tz0, STEP, cols, rows)
      // the tiles the cuts touch ship the fine ground, so the cutting keeps its sides
      for (const e of cuts) for (const q of unpackPoints(e.points)) {
        for (const [dx, dz] of [[0, 0], [30, 0], [-30, 0], [0, 30], [0, -30]]) {
          const k = `${Math.floor((q.x + dx) / TILE)},${Math.floor((q.z + dz) / TILE)}`
          if (blockTiles.some(([tx, tz]) => `${tx},${tz}` === k)) fineTiles.add(k)
        }
      }
      shipped = new GroundModel({
        coarse: { x0: tx0, z0: tz0, step: STEP, cols, rows, h: ground },
        fine: { x0: fx0, z0: fz0, step: FINE_STEP, cols: fcols, rows: frows, h: fineGround },
        fineTiles, tiles: blockTiles, fineStep: FINE_STEP, tile: TILE,
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
  let railDecks = 0
  for (const r of rails) {
    if (!r.bridge) continue
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
  console.log(`  bridges: ${decks.bridges} deck edges, ${decks.ramps} ramps; ${railDecks} elevated rail ways`)
  /*
   * Walks on a viaduct's roof (BUGS.md #32): the Coulée Verte runs along the top of the Viaduc des Arts, which
   * OSM gives no height; its ways came out at street level, inside the viaduct, with only its street crossings
   * standing up as lone footbridges. Each runs at the region's height over the ground, smoothed along it, and
   * where it is not over a building it is a bridge (render/bridges.ts draws the slab and piers).
   */
  const walks = new Map((streetRegion.elevatedWalks ?? []).map((w) => [w.name, w.height]))
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
      const h = e.name ? walks.get(e.name) : undefined
      if (h === undefined) continue
      const ps = unpackPoints(e.points)
      e.heights = ps.map((q) => Math.round((groundAt(q.x, q.z) + h) * 100) / 100)
      const mid = ps[Math.floor(ps.length / 2)]
      e.bridge = !overBuilding(mid.x, mid.z) || undefined
      lifted++
    }
  }
  if (lifted) console.log(`  ${lifted} walks lifted onto their viaduct`)

  // ---- named places, for the signs
  const FOOD = new Set(['cafe', 'restaurant', 'bar', 'pub', 'bakery'])
  const CULTURE = new Set(['theatre', 'cinema', 'library', 'museum', 'gallery', 'attraction'])
  const pois: PackedPoi[] = []
  const seen = new Set<string>()
  for (const n of nodes) {
    const name = n.tags.name
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
  console.log(`  ${pois.length} named places`)

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
    for (const w of fringeWays) {
      if (!w.geometry || w.geometry.length < 4 || w.tags['building:part']) continue
      // not one the city already has: a building straddling the box's edge came back from both queries
      if (cityIds.has(w.id)) continue
      const ring = w.geometry.slice(0, -1).map((g) => proj.toLocal(g))
      if (ring.length < 3 || area(ring) < 20) continue
      const c = centroidOf(ring)
      // only outside the box: inside it the city's own buildings stand
      if (c.x >= -ext.west && c.x <= ext.east && c.z >= -ext.south && c.z <= ext.north) continue
      const ccwRing = ccw(ring)
      const own = withLevels(w.tags, ring)
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
    console.log(`  fringe: ${fringe.length} buildings in the ${FRINGE} m round the box`)
  }

  // ---- street furniture, from its own small query
  const furniture: PackedFurniture[] = []
  {
    // optional: a busy Overpass must not stop a bake, it only leaves the street furniture out
    const f = await overpassTiled(furnitureQuery, detailBboxOf(spec)).catch((e) => {
      console.warn(`  furniture: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
      return { nodes: [] as { lat: number; lon: number; tags: Record<string, string> }[] }
    })
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
        : t.amenity === 'post_box' ? 'postbox'
        : t.emergency === 'fire_hydrant' ? 'hydrant'
        // a street clock on a post (owner, 2026-10-04: the sidewalk clock by Union Square); a wall clock needs its wall
        : t.amenity === 'clock' && /^(pole|ground|pedestal)$/.test(t.support ?? '') ? 'clock' : null
      if (!kind) continue
      const p = proj.toLocal(n)
      const wallace = kind === 'fountain' && /wallace/i.test(`${t.name ?? ''} ${t.brand ?? ''} ${t.model ?? ''} ${t['fountain'] ?? ''} ${t.description ?? ''}`)
      furniture.push({ x: Math.round(p.x * 10) / 10, z: Math.round(p.z * 10) / 10, kind, ...(wallace ? { wallace: true as const } : {}) })
    }
    const count = (k: string): number => furniture.filter((x) => x.kind === k).length
    console.log(`  furniture: ${count('metro')} métro entrances, ${count('fountain')} fountains `
      + `(${furniture.filter((x) => x.wallace).length} Wallace), ${count('column')} columns, ${count('kiosk')} kiosks, `
      + `${count('bikeshare')} bike docks, ${count('signals')} signal nodes, ${count('tramstop')} tram stops, `
      + `${count('billboard')} billboards, ${count('stop')} stop signs, ${count('busstop')} bus stops, ${count('postbox')} post boxes, ${count('hydrant')} hydrants`)
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
      furniture.push(...outside)
      console.log(`  open country: ${touched} ways restyled at source (${fixed} from a photographed row in `
        + `city/park-roads.json), ${before - outside.length} pieces of street furniture dropped inside it`)
    }
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
  buildings.push(...nested)
  const pkg: CityPackage = {
    id: spec.id, name: spec.name, origin: spec.centre, radius: spec.radius, ground: spec.ground, region: spec.region,
    seaLevel,
    box: { x0: -ext.west, x1: ext.east, z0: -ext.south, z1: ext.north },
    start: { edgeId: start.e.id, s: 0 },
    edges: kept, buildings, areas, trees, rails, pois, furniture, landmarks, terrain, fringe,
    ...(sportsCourts.length ? { courts: sportsCourts } : {}),
    ...(spec.skyline ? {
      skyline: spec.skyline.map((s) => {
        const p = proj.toLocal(s)
        // Sacré-Cœur stands on Montmartre: the ground under a far landmark comes from the same tiles
        const baseY = Math.round((elevation.at(s) - datumRaw) * 10) / 10
        return { name: s.name, x: Math.round(p.x), z: Math.round(p.z), procedural: s.procedural, heightM: s.heightM, baseY,
          ...(s.bearing !== undefined ? { bearing: s.bearing } : {}), ...(s.boost !== undefined ? { boost: s.boost } : {}) }
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
    const got = await overpassTiled(wallsQuery, detailBboxOf(spec)).catch((e) => {
      console.warn(`  walls: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
      return null
    })
    const walls: NonNullable<CityPackage['walls']> = []
    for (const w of got?.ways ?? []) {
      if (!w.geometry || w.geometry.length < 2) continue
      const pts = w.geometry.map((g) => proj.toLocal(g))
      walls.push({ id: w.id, points: packPoints(pts), ...(w.tags?.barrier === 'seawall' ? { sea: true as const } : {}) })
    }
    pkg.walls = walls
    console.log(`  ${walls.length} retaining/sea walls`)
  }
  // the bridges' outlines, what each bridge's structure is built from (render/bridges.ts)
  {
    const got = await overpassTiled(bridgesQuery, bbox(spec)).catch((e) => {
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
    pkg.bridges = out
    console.log(`  ${out.length} bridge outlines (${out.filter((b) => b.name).length} named)`)
  }
  // every tree, decided here so a streamed tile always grows the same ones (city/plantings.ts)
  // a ceiling by AREA, not per city: 1,900 over the Marais's box is ~680 a square kilometre, and a city-wide
  // 1,900 would have left twenty square kilometres of central Paris almost bare
  const ex = extentOf(spec)
  const km2 = ((ex.west + ex.east) * (ex.south + ex.north)) / 1e6
  const cap = Math.max(TREE_CAP, Math.round(TREES_PER_KM2 * km2))
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
  pkg.plantings = packPlantings(plantCity(pkg, cap, street, plantZones, planted))
  logPlanting(pkg.plantings.length / 5, planted, plantZones.count, cap, km2)
  await mkdir(OUT, { recursive: true })
  const file = resolve(OUT, `${spec.id}.json`)
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
  console.log(`  → public/cities/${spec.id}.json  ${kb} kB`)
  await writeTiles(pkg, streetRegion.riverDrop ?? 0, shipped, zones, datumRaw)
  await writeRides(pkg)
  if (deckWork) await writeFile(resolve(OUT, spec.id, 'decks-undo.json'), JSON.stringify(deckWork.undo))
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
    // the Presidio's and the parks' Army buildings: red tile, gabled — hipped where the block is too wide for a gable
    // to stay low (owner, 2026-10-02: "white with gabled red tile roofs"); the Main Post's brick barracks the same
    else if (styleId === 'presidio' || styleId === 'presidioBrick') shape = span < 16 ? 'gabled' : 'hipped'
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
  // (a Spanish Colonial roof is low-pitched: about 17°, not a Victorian's steep gable)
  if ((styleId === 'presidio' || styleId === 'presidioBrick') && !p.buildingRoofHeight && shape !== 'flat') height = Math.min(span * 0.16, 3.2)

  return {
    roof: shape,
    roofHeight: Math.round(height * 100) / 100,
    roofDirection: p.buildingRoofDirection !== undefined && Number.isFinite(p.buildingRoofDirection)
      ? (p.buildingRoofDirection * Math.PI) / 180
      : undefined,
    roofColour: colour,
  }
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
function fitStreetsBetweenBuildings(edges: PackedEdge[], buildings: PackedBuilding[]): void {
  const CELL = 40
  const grid = new Map<string, number[][]>()
  for (const b of buildings) {
    const r = b.ring
    for (let i = 0; i < r.length; i += 2) {
      const j = (i + 2) % r.length
      const seg = [r[i], r[i + 1], r[j], r[j + 1]]
      const k = `${Math.floor((seg[0] + seg[2]) / 2 / CELL)},${Math.floor((seg[1] + seg[3]) / 2 / CELL)}`
      grid.set(k, [...(grid.get(k) ?? []), seg])
    }
  }
  let shrunk = 0
  for (const e of edges) {
    if (e.foot) continue
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
        const gx = Math.floor(px / CELL)
        const gz = Math.floor(pz / CELL)
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
    if (gaps.length < 2) continue
    gaps.sort((a, b) => a - b)
    const gap = gaps[Math.floor(gaps.length / 2)]
    const want = e.width + 2 * e.walk
    if (want <= gap) continue
    const walk = Math.max(e.walk > 0 ? 1 : 0, Math.min(e.walk, (gap - e.width) / 2))
    e.walk = Math.round(walk * 100) / 100
    if (e.width + 2 * e.walk > gap) e.width = Math.round(Math.max(3, gap - 2 * e.walk) * 100) / 100
    shrunk++
  }
  console.log(`  ${shrunk} streets fitted between their buildings`)
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
      const pkg = JSON.parse(readFileSync(resolve(OUT, `${spec.id}.json`), 'utf8')) as CityPackage
      console.log(`${spec.id}:`)
      // (the bike trails again, from the zones as they are now: a zone edit then needs only --rides)
      const proj = new Projection(pkg.origin)
      const trailZones = loadZones(spec, (lat, lon) => proj.toLocal({ lat, lon })).filter((zn) => zn.props.trails === 'bike')
      let opened = 0
      for (const e of pkg.edges) {
        if (e.trail || !/^(footway|path|track|bridleway)$/.test(e.kind ?? '') || /^(sand|mud|grass|rock|stone|wood)$/.test(e.surface ?? '')) continue
        const pts = unpackPoints(e.points)
        const mid = pts[Math.floor(pts.length / 2)]
        if (trailZones.some((zn) => zonesAt([zn], mid.x, mid.z).length > 0)) { e.trail = true; opened++ }
      }
      if (opened) { console.log(`  ${opened} more trails opened to bikes`); await writeFile(resolve(OUT, `${spec.id}.json`), JSON.stringify(pkg)) }
      await writeRides(pkg)
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
      const file = resolve(OUT, `${spec.id}.json`)
      const pkg = JSON.parse(readFileSync(file, 'utf8')) as CityPackage
      const undoFile = resolve(OUT, spec.id, 'decks-undo.json')
      const touched = existsSync(undoFile) ? undoDecks(pkg.edges, JSON.parse(readFileSync(undoFile, 'utf8')) as DeckUndo) : new Set<number>()
      const terrain = new Terrain(pkg.terrain)
      // (and the foot bridges' ends, which a package baked before rampFootBridgeEnds still has standing in the air)
      for (const id of rampFootBridgeEnds(pkg.edges)) touched.add(id)
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
        const f = resolve(OUT, spec.id, 'tiles', `${tx}_${tz}.json`)
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
      const pkg = JSON.parse(readFileSync(resolve(OUT, `${spec.id}.json`), 'utf8')) as CityPackage
      // (the reserve boundaries a bake now drops, out of a package baked before it did)
      const before = pkg.areas.length
      pkg.areas = pkg.areas.filter((a) => a.kind === 'water' || !tooBigForAnArea(unpackPoints(a.ring)))
      if (pkg.areas.length < before) console.log(`  ${before - pkg.areas.length} reserve-sized green areas dropped`)
      const proj = new Projection(pkg.origin)
      const ex = extentOf(spec)
      const km2 = ((ex.west + ex.east) * (ex.south + ex.north)) / 1e6
      const cap = Math.max(TREE_CAP, Math.round(TREES_PER_KM2 * km2))
      const street = spec.streetTrees === 'datasf'
        ? await Promise.all([import('./sf-trees.ts'), import('../src/city/sf/trees.ts')])
          // (clipped to the package's own extent: it may be from before the box grew)
          .then(async ([t, f]) => f.sfPlantings(await t.fetchStreetTrees(bboxOf(spec)), (g) => proj.toLocal(g),
            (x, z) => Math.abs(x) <= pkg.radius && Math.abs(z) <= pkg.radius))
        : undefined
      const plantZones = new PlantZones(loadZones(spec, (lat, lon) => proj.toLocal({ lat, lon })))
      const planted = newPlantReport()
      pkg.plantings = packPlantings(plantCity(pkg, cap, street, plantZones, planted))
      logPlanting(pkg.plantings.length / 5, planted, plantZones.count, cap, km2)
      console.log(`${spec.id}: ${pkg.plantings.length / 5} trees planted${street ? ` (${street.length} from the city's list)` : ''}`)
      await writeFile(resolve(OUT, `${spec.id}.json`), JSON.stringify(withoutFineGrid(pkg)))
      await writeTiles(pkg, region(spec.region).riverDrop ?? 0)
    }
    return
  }
  for (const c of list) await bake(c)
  // what the page's city menu lists: every city in cities.ts that has been baked
  const { existsSync } = await import('node:fs')
  // with where each one is, so a pasted "lat, lon" (the page's go-to) can find the city it falls in
  const { readFileSync } = await import('node:fs')
  // `live` gates the menu, not the bake: an unfinished city's package can sit in public/cities without being
  // offered to the player, so baking one to look at it does not put it in front of anybody.
  const index = CITIES.filter((c) => c.live && existsSync(resolve(OUT, `${c.id}.json`))).map((c) => {
    const pkg = JSON.parse(readFileSync(resolve(OUT, `${c.id}.json`), 'utf8')) as CityPackage
    // `box` as well as `radius`: the go-to decides what is in the city from the box (BUGS.md #163)
    return { id: c.id, name: c.name, lat: pkg.origin.lat, lon: pkg.origin.lon, radius: pkg.radius, box: pkg.box }
  })
  await writeFile(resolve(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n')
  console.log(`\n  → public/cities/index.json  ${index.length} cities`)
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
 * The same city cut into tiles and an index, beside the single package (PARIS_EXPAND.md §2, §8):
 * `public/cities/<id>/index.json` and `public/cities/<id>/tiles/<tx>_<tz>.json`. The old tiles are cleared
 * first, so a smaller box leaves none behind.
 */
/*
 * `shipped` is absent only on the replant-only path (`--trees`), which rebuilds tiles from the saved monolith: that
 * never held per-tile ground (the fine grid was always left out of it), so those tiles carry none, as before, and
 * no v3 is written from them.
 */
async function writeTiles(pkg: CityPackage, riverDrop: number, shipped?: GroundModel, zones: LocalZone[] = [], datumRaw?: number): Promise<void> {
  const { rm } = await import('node:fs/promises')
  const terrain = new Terrain(pkg.terrain)
  // one level per river, however many polygons OSM draws it as (city/package.ts waterLevels)
  const water = pkg.areas.filter((a) => a.kind === 'water')
  const levels = waterLevels(water, (x, z) => terrain.heightAt(x, z), riverDrop, pkg.seaLevel ?? null)
  const byRing = new Map(water.map((a, k) => [a.ring, levels[k]]))
  const { index, tiles } = splitPackage(pkg, (_ring, area) => byRing.get(area.ring), shipped?.blocks)
  const dir = resolve(OUT, pkg.id)
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
    const v3 = writeV3(dir, { ...full, terrain: full.terrain ? { ...full.terrain, heights: index.terrain!.heights } : undefined },
      [...tiles.values()], { raw: (x, z) => shipped.heightAt(x, z), zones, datumMsl: datumRaw })
    console.log(`  → public/cities/${pkg.id}/v3/  ${v3.index.tiles.length} tiles, ${Math.round(v3.bytes / 1024)} kB · zFloor ${v3.index.zFloor} cm, `
      + `datum ${v3.index.datumMsl} m above sea level · ${v3.stats.zOverrides} streets with their own junction z, `
      + `${v3.stats.belowFloor} heights below the floor`)
    if (v3.stats.belowFloor > 0) throw new Error('map v3: a real height fell at or below zFloor, where it would read as "no height"')
  }
  const biggest = entries.reduce((m, e) => Math.max(m, e.bytes), 0)
  console.log(`  → public/cities/${pkg.id}/  ${entries.length} tiles, ${Math.round(total / 1024)} kB `
    + `(largest ${Math.round(biggest / 1024)} kB), index ${Math.round(text.length / 1024)} kB`
    + (sidecar ? `, terrain.bin ${Math.round(sidecar / 1024)} kB` : ''))
}

/**
 * The ride graphs, bike and run, with the city's overrides, as the game would have built them at load
 * (city/ridefile.ts): `public/cities/<id>/ride-bike.json`, `ride-run.json`.
 */
async function writeRides(pkg: CityPackage): Promise<void> {
  const terrain = new Terrain(pkg.terrain)
  const edges = mapEdges(pkg.edges, terrain)
  for (const mode of ['bike', 'run'] as const) {
    const g = rideFor(pkg.id, pkg.origin, edges, mode, (x, z) => terrain.heightAt(x, z), pkg.region,
      pkg.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => b.ring))
    const text = JSON.stringify(packRide(g, mode))
    await writeFile(resolve(OUT, pkg.id, `ride-${mode}.json`), text)
    console.log(`  → public/cities/${pkg.id}/ride-${mode}.json  ${g.edges.size} edges, ${Math.round(text.length / 1024)} kB`)
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
