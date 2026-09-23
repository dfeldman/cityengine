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
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { CITIES, bboxOf, city, detailBboxOf, extentOf, type CitySpec } from './cities.ts'
import { joinNearMisses } from './gaps.ts'
import { bridgesQuery, squaresQuery, stepsQuery, wideQuery, fringeQuery, cityQuery, furnitureQuery, innerRings, outerRings, overpassTiled, type Bbox, type OsmWay } from './overpass.ts'
import { Elevation, ATTRIBUTION as TERRAIN_CREDIT } from './terrarium.ts'
import { Terrain, type PackedTerrain } from '../src/city/terrain.ts'
import { splitPackage, type CityIndex, type TileEntry } from '../src/city/tiles.ts'
import { TREE_CAP, TREES_PER_KM2, packPlantings, plantCity } from '../src/city/plantings.ts'
import { mapEdges, packRide, rideFor } from '../src/city/ridefile.ts'
import { Projection, haversine } from '../src/city/geo.ts'
import { chooseStyle, style as styleOf, type StyleId } from '../src/city/facade.ts'
import { packPoints, unpackPoints, waterLevels, type CityPackage, type PackedPoi, type PackedArea, type PackedBuilding, type PackedFringe, type PackedEdge, type PackedFurniture, type PackedLandmark, type PackedRail, type RoofShape } from '../src/city/package.ts'
import { pavementFor } from '../src/city/pavement.ts'
import { largestComponent, lengthOf, type Edge } from '../src/city/graph.ts'
import { rideGraph, rideStats } from '../src/city/ridegraph.ts'
import { frontageOf, totemPoint } from '../src/city/landmark-place.ts'
import { landmarkKind, score } from './landmark-rank.ts'
import { bridgeHeights } from './bridges.ts'

/**
 * A church is not a row of shops. Places of worship take the classical style — its ground floor is an arcade,
 * and a shop sign is only ever hung over a shopfront — whatever the neighbourhood's mix would have given them.
 */
const worship = (t: Record<string, string>): boolean =>
  t.amenity === 'place_of_worship' || /^(church|cathedral|chapel|basilica|synagogue|mosque|temple)$/.test(t.building ?? '')
const styleFor = (t: Record<string, string>, pick: () => StyleId): StyleId => (worship(t) ? 'classical' : pick())

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
import { NeighbourGrid, centroid, hasHeightTag, inferLevels, taggedLevels, type TaggedNeighbour } from './heights.ts'

const OUT = resolve(import.meta.dirname, '..', 'public', 'cities')
const DOCS = resolve(import.meta.dirname, '..', 'docs')
/** how far beyond the box the fringe of plain massing reaches, metres */
const FRINGE = 700

const bbox = (c: CitySpec, pad = 0): Bbox => bboxOf(c, pad)

const SURFACES: Record<string, PackedEdge['surface']> = {
  asphalt: 'asphalt', paved: 'asphalt', concrete: 'concrete', paving_stones: 'concrete',
  sett: 'cobblestone', cobblestone: 'cobblestone', unhewn_cobblestone: 'cobblestone',
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
function wayTags(t: Record<string, string>): Pick<PackedEdge, 'kind' | 'service' | 'oneway' | 'layer' | 'bridge' | 'tunnel' | 'passage'> {
  const layer = parseInt(t.layer ?? '', 10)
  const yes = (v: string | undefined): true | undefined => (v !== undefined && v !== 'no' ? true : undefined)
  return {
    kind: t.highway,
    ...(t.service ? { service: t.service } : {}),
    ...(t.oneway === 'yes' || t.oneway === '-1' ? { oneway: true } : {}),
    ...(Number.isFinite(layer) && layer !== 0 ? { layer } : {}),
    ...(yes(t.bridge) ? { bridge: true } : {}),
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

async function bake(spec: CitySpec): Promise<void> {
  console.log(`\n${spec.name}`)
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

  const proj = new Projection(spec.centre)
  const streetRegion = region(spec.region)
  const streets = ways.filter((w) => w.tags.highway && w.geometry && w.geometry.length === w.nodes.length)
  // the paths that stop a few metres short of the way they obviously run into, joined to it (tools/gaps.ts)
  const joins = joinNearMisses(streets, (g) => proj.toLocal(g))
  console.log(`  ${joins} near-miss path ends joined to the way beside them`)
  const railways = ways.filter((w) => w.tags.railway)
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
  const isBoat = (t: Record<string, string>): boolean => t.building === 'boat' || t.building === 'houseboat'
  const boatWays = ways.filter((w) => isBoat(w.tags) && w.geometry && w.geometry.length >= 4)
  const outlines = ways.filter((w) => w.tags.building && !w.tags['building:part'] && !canopy(w.tags) && !belowGround(w.tags) && !isBoat(w.tags))
  const parts = ways.filter((w) => w.tags['building:part'] && !belowGround(w.tags))
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
  // outlines kept alongside parts that float above them, and the height they must reach
  const raiseTo = new Map<number, number>()
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
      for (const { way, at: q } of partSeeds) {
        if (ownerOf.get(way.id) !== w) continue
        const pp = getBuildingParamsFromOSMTags(way.tags) as { buildingHeight?: number }
        if (pp.buildingHeight) top = Math.max(top, pp.buildingHeight)
        void q
      }
      if (top > 0) raiseTo.set(w.id, top)
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
          const walk = foot ? 0 : kerbToKerb ? pavementForNA(corridor) : separate ? 0.6 : pavementFor(corridor)
          edges.push({
            id: edgeId++, a: w.nodes[startIdx], b: w.nodes[i],
            points: packPoints(pts), surface: surfaceOf(w.tags),
            // the carriageway is the corridor less its two pavements, never narrower than a single lane —
            // or, where the region measures kerb to kerb, the width itself
            width: foot || kerbToKerb || separate ? corridor : Math.max(2.8, corridor - 2 * walk),
            walk,
            name: w.tags.name, foot,
            // OSM marks these itself, which is far better than guessing from where two ways overlap
            crossing: w.tags.footway === 'crossing' || w.tags.path === 'crossing'
              || w.tags.crossing !== undefined || w.tags.highway === 'crossing' || undefined,
            ...wayTags(w.tags),
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
  const kept = largestComponent(edges)
  console.log(`  ${edges.length} edges → ${kept.length} in the largest connected network`)

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
  // named buildings worth a name plate on the street (item K), gathered as they are packed — plus the
  // outlines replaced by their parts, which carry the name the parts do not (Saint-Louis-en-l'Île)
  const named: { id: number; tags: Record<string, string>; ring: { x: number; z: number }[] }[] = []
  for (const w of outlines) {
    if (!superseded.has(w.id) || !w.tags.name || !worthNaming(w.tags) || !w.geometry) continue
    named.push({ id: w.id, tags: w.tags, ring: ccw(w.geometry.slice(0, -1).map((g) => proj.toLocal(g))) })
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
    const styleId = kind ? styleFor(owner?.tags ?? w.tags, () => kind.style) : owner
      ? styleFor(owner.tags, () => chooseStyle({ levels: ownerP!.buildingLevels ?? tallest.get(owner.id),
        height: ownerP!.buildingHeight, material: ownerP!.buildingFacadeMaterial ?? p.buildingFacadeMaterial,
        building: owner.tags.building }, spec.styles, owner.id))
      : styleFor(w.tags, () => chooseStyle(
        { levels: p.buildingLevels, height: p.buildingHeight, material: p.buildingFacadeMaterial,
          building: w.tags.building },
        spec.styles, w.id))
    /*
     * The audit row: which rule gave this building its look. Without it a systematically wrong style — every
     * residential tower drawn as a glass office block — can only be found by riding past one (user,
     * 2026-09-22). With it, `docs/<city>-archetypes.csv` groups the whole city by rule.
     */
    audit.push([owner?.id ?? w.id, w.geometry[0].lat.toFixed(6), w.geometry[0].lon.toFixed(6),
      Math.round((owner ? ownerP!.buildingHeight : p.buildingHeight) ?? 0), Math.round(area(ownerRing)),
      kind?.district ?? '', kind?.archetype ?? '', kind ? kind.rule : 'chooseStyle',
      styleId, styleId !== (kind?.style ?? styleId) ? 'overridden' : ''].join(','))
    const raised = raiseTo.get(w.id)
    const tall = raised !== undefined && raised > (p.buildingHeight ?? 0)
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
      levels: tall ? undefined : p.buildingLevels,
      height: tall ? raised : p.buildingHeight,
      minHeight: p.buildingMinHeight,
      ...roofFor(w.tags, p, styleId, ccwRing, w.id),
      ...(own.inferred ? { levelsInferred: true as const } : {}),
      ...(kind ? { archetype: kind.archetype } : {}),
      // a part of a building whose outline its parts replace: that outline's id (a church's towers and apse
      // are the church, for its quick dress: render/prepare.ts)
      ...(ownerOf.has(w.id) && superseded.has(ownerOf.get(w.id)!.id) ? { partOf: ownerOf.get(w.id)!.id } : {}),
    })
    if (w.tags.name && worthNaming(w.tags)) named.push({ id: w.id, tags: w.tags, ring: ccwRing })
  }
  console.log(`  ${buildings.length} buildings`)
  if (streetRegion.streetWidth === 'carriageway') fitStreetsBetweenBuildings(kept, buildings)

  // ---- the green and the wet, and the paved squares (their own query: only as areas, never as streets)
  const squares = await overpassTiled(squaresQuery, detailBboxOf(spec)).catch((e) => {
    console.warn(`  squares: not fetched (${(e as Error).message.split('\n')[0].slice(0, 120)})`)
    return { ways: [] as OsmWay[], relations: [] as typeof relations }
  })
  const areaWays = [...ways, ...squares.ways]
  const areaRels = [...relations, ...squares.relations.filter((r) => r.tags.building === undefined)]
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
  // squares OSM draws only as lines, paved by hand from the region (the Trocadéro's parvis)
  for (const sq of streetRegion.pavedSquares ?? []) {
    const ring = sq.ring.map(([lat, lon]) => proj.toLocal({ lat, lon }))
    areas.push({ kind: 'paved', ring: packPoints(ccw(ring)), top: true })
  }
  // Multipolygon relations: the Seine is one, and so is every courtyard block. Skipping them is why the
  // water shader had no water and why the Loop came back with half the buildings it should have.
  let fromRelations = 0
  for (const rel of areaRels) {
    const kind = areaKind({ tags: rel.tags } as OsmWay)
    const isBuilding = rel.tags.building !== undefined
    if (!kind && !isBuilding) continue
    for (const ring of outerRings(rel)) {
      const pts = ring.slice(0, -1).map((g) => proj.toLocal(g))
      if (pts.length < 3 || area(pts) < 40) continue
      if (isBuilding) {
        const own = withLevels(rel.tags, pts)
        if (own.inferred) inferredCount++
        const p = getBuildingParamsFromOSMTags(own.tags) as {
          buildingLevels?: number; buildingHeight?: number; buildingMinHeight?: number
          buildingFacadeMaterial?: string; buildingRoofType?: string; buildingRoofHeight?: number
          buildingRoofDirection?: number
        }
        const ccwPts = ccw(pts)
        const styleId = styleFor(rel.tags, () => chooseStyle({ levels: p.buildingLevels, height: p.buildingHeight,
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
        areas.push({ kind: kind!, ring: packPoints(ccw(pts)), ...(holes.length > 0 ? { holes } : {}) })
      }
      fromRelations++
    }
  }
  if (fromRelations > 0) console.log(`  ${fromRelations} more from relations (multipolygons)`)
  reportLevels(buildings, inferredCount)

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
  const elevation = new Elevation(12)
  elevation.require({ minLat: box.south, maxLat: box.north, minLon: box.west, maxLon: box.east })
  // and the ground under each far landmark on the skyline, kilometres outside the box
  for (const s of spec.skyline ?? []) {
    elevation.require({ minLat: s.lat - 0.001, maxLat: s.lat + 0.001, minLon: s.lon - 0.001, maxLon: s.lon + 0.001 })
  }
  await elevation.load()

  const STEP = 20
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
  const ground = bareEarth(heights, cols, rows, 3, wetMask)
  /*
   * The sea bed is not the ground (BUGS.md #58). The elevation tiles carry BATHYMETRY: off the Embarcadero the
   * bay floor drops to −108 m, so the shoreline came out as a cliff, the water plane sat in a pit far out from
   * the quays, and the piers — which stand on the bed — hung over a canyon or appeared to be on dry land.
   * A bay is flat and shallow as far as a rider can tell: every wet sample well below the shore is brought up
   * to just under the level of the land round it, which is what the water plane is drawn at.
   */
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
      let raised = 0
      for (let i = 0; i < ground.length; i++) {
        if (wetMask[i] && ground[i] < shore - 3) { ground[i] = shore - 1.5; raised++ }
      }
      if (raised > 0) console.log(`  sea bed flattened: ${raised} samples brought up to ${(shore - 1.5).toFixed(1)} m (shore ${shore.toFixed(1)} m)`)
    }
  }
  const datum = sampleGrid(ground, cols, rows, tx0, tz0, STEP, 0, 0)
  const datumRaw = datum
  for (let i = 0; i < ground.length; i++) ground[i] = Math.round((ground[i] - datum) * 100) / 100
  // a loop, not a spread: central Paris's grid is 340 000 samples, past what a call's arguments can hold
  let lo = Infinity
  let hi = -Infinity
  for (const g of ground) { if (g < lo) lo = g; if (g > hi) hi = g }
  const relief = hi - lo
  console.log(`  ground sampled: ${cols}x${rows} at ${STEP} m, ${relief.toFixed(0)} m of relief (bare earth)`)

  const terrain: PackedTerrain = { x0: tx0, z0: tz0, step: STEP, cols, rows, heights: ground }

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
    e.heights = pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)]
      const b = pts[Math.min(pts.length - 1, i + 1)]
      const l = Math.hypot(b.x - a.x, b.z - a.z) || 1
      const nx = -(b.z - a.z) / l
      const nz = (b.x - a.x) / l
      let h = sampleGrid(ground, cols, rows, tx0, tz0, STEP, p.x, p.z)
      for (const o of [-half, -half / 2, half / 2, half]) h = Math.max(h, sampleGrid(ground, cols, rows, tx0, tz0, STEP, p.x + nx * o, p.z + nz * o))
      return h
    })
  }
  // …and one height where streets meet: every end at a node takes the highest of them, eased in over 12 m, so
  // the level streets join without a step (the rider's profile and the drawn surface both)
  {
    const nodeH = new Map<number, number>()
    for (const e of kept) {
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
      const ha = nodeH.get(e.a)!
      const hb = nodeH.get(e.b)!
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
  const wetLevels = waterLevels(wetAreas, groundAt, streetRegion.riverDrop ?? 0)
  const waterBodies = wetAreas.map((a, k) => ({ ring: unpackPoints(a.ring), level: wetLevels[k] }))
  const decks = bridgeHeights(kept, { water: waterBodies, ground: groundAt, buried })
  // the ways lifted onto a deck are ramps: said outright, for the renderer (city/package.ts isRaised)
  for (const e of kept) if (decks.raised.has(e.id) && !e.bridge) e.ramp = true
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
        : t.advertising === 'billboard' ? 'billboard'
        : t.highway === 'stop' ? 'stop'
        : t.highway === 'bus_stop' ? 'busstop'
        : t.amenity === 'post_box' ? 'postbox'
        : t.emergency === 'fire_hydrant' ? 'hydrant' : null
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
    ['osm,lat,lon,height,area,district,archetype,rule,style,note', ...audit].join('\n') + '\n')
  const byRule = new Map<string, number>()
  for (const row of audit) { const r = row.split(',')[7]; byRule.set(r, (byRule.get(r) ?? 0) + 1) }
  console.log(`  ${audit.length} buildings classified by ${byRule.size} rules → docs/${spec.id}-archetypes.csv`)

  const nested = insetNested(buildings)
  buildings.length = 0
  buildings.push(...nested)
  const pkg: CityPackage = {
    id: spec.id, name: spec.name, origin: spec.centre, radius: spec.radius, ground: spec.ground, region: spec.region,
    box: { x0: -ext.west, x1: ext.east, z0: -ext.south, z1: ext.north },
    start: { edgeId: start.e.id, s: 0 },
    edges: kept, buildings, areas, trees, rails, pois, furniture, landmarks, terrain, fringe,
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
  const street = spec.region === 'san-francisco'
    ? await Promise.all([import('./sf-trees.ts'), import('../src/city/sf/trees.ts')])
      .then(async ([t, f]) => f.sfPlantings(await t.fetchStreetTrees(detailBboxOf(spec)), (g) => proj.toLocal(g), () => true))
      .catch((e: unknown) => { console.warn(`  sf-trees: not fetched (${String(e).slice(0, 120)})`); return undefined })
    : undefined
  // what grows INSIDE the parks, where the city's street tree list stops (city/park-planting.ts)
  const parks = spec.region === 'san-francisco'
    ? await import('../src/city/sf/parks.ts').then((m) => m.sfParkRule((g) => proj.toLocal(g)))
    : undefined
  pkg.plantings = packPlantings(plantCity(pkg, cap, street, parks))
  console.log(`  ${pkg.plantings.length / 5} trees planted (${street ? `${street.length} street trees from the city's list, ` : ''}mapped, parks, boulevards; cap ${cap} over ${km2.toFixed(1)} km²)`)
  await mkdir(OUT, { recursive: true })
  const file = resolve(OUT, `${spec.id}.json`)
  await writeFile(file, JSON.stringify(pkg))
  const kb = Math.round((await import('node:fs')).statSync(file).size / 1024)
  console.log(`  → public/cities/${spec.id}.json  ${kb} kB`)
  await writeTiles(pkg, streetRegion.riverDrop ?? 0)
  await writeRides(pkg)
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
  if (t.natural === 'wood' || t.landuse === 'forest') return 'wood'
  // nature_reserve: most of the Presidio's wild edge and Lands End are tagged this way and nothing else
  if (t.leisure === 'park' || t.leisure === 'garden' || t.leisure === 'nature_reserve') return 'park'
  if (t.leisure === 'pitch') return 'pitch'
  // scrub is the dune and coastal-bluff planting of the Presidio and Lands End: grass to look at, and the
  // park rule plants it thinly rather than as forest
  if (t.landuse === 'grass' || t.landuse === 'meadow' || t.natural === 'scrub') return 'grass'
  if ((t.highway === 'pedestrian' && (t.area === 'yes' || t.type === 'multipolygon')) || t['area:highway'] || t.place === 'square') return 'paved'
  return null
}

async function main(): Promise<void> {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const list = only.length > 0 ? only.map(city) : CITIES
  // --replant: only the trees, on the package already baked (city/plantings.ts), and its tiles rewritten — for
  // working on the plants without the hours a full bake spends waiting on Overpass
  if (process.argv.includes('--replant')) {
    const { readFileSync } = await import('node:fs')
    for (const spec of list) {
      const pkg = JSON.parse(readFileSync(resolve(OUT, `${spec.id}.json`), 'utf8')) as CityPackage
      const proj = new Projection(pkg.origin)
      const ex = extentOf(spec)
      const km2 = ((ex.west + ex.east) * (ex.south + ex.north)) / 1e6
      const cap = Math.max(TREE_CAP, Math.round(TREES_PER_KM2 * km2))
      const street = spec.region === 'san-francisco'
        ? await Promise.all([import('./sf-trees.ts'), import('../src/city/sf/trees.ts')])
          // (clipped to the package's own extent: it may be from before the box grew)
          .then(async ([t, f]) => f.sfPlantings(await t.fetchStreetTrees(bboxOf(spec)), (g) => proj.toLocal(g),
            (x, z) => Math.abs(x) <= pkg.radius && Math.abs(z) <= pkg.radius))
        : undefined
      const parks = spec.region === 'san-francisco'
        ? await import('../src/city/sf/parks.ts').then((m) => m.sfParkRule((g) => proj.toLocal(g)))
        : undefined
      pkg.plantings = packPlantings(plantCity(pkg, cap, street, parks))
      console.log(`${spec.id}: ${pkg.plantings.length / 5} trees planted${street ? ` (${street.length} from the city's list)` : ''}`)
      await writeFile(resolve(OUT, `${spec.id}.json`), JSON.stringify(pkg))
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
    return { id: c.id, name: c.name, lat: pkg.origin.lat, lon: pkg.origin.lon, radius: pkg.radius }
  })
  await writeFile(resolve(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n')
  console.log(`\n  → public/cities/index.json  ${index.length} cities`)
}

main().catch((e) => { console.error(e); process.exit(1) })

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
async function writeTiles(pkg: CityPackage, riverDrop: number): Promise<void> {
  const { rm } = await import('node:fs/promises')
  const terrain = new Terrain(pkg.terrain)
  // one level per river, however many polygons OSM draws it as (city/package.ts waterLevels)
  const water = pkg.areas.filter((a) => a.kind === 'water')
  const levels = waterLevels(water, (x, z) => terrain.heightAt(x, z), riverDrop)
  const byRing = new Map(water.map((a, k) => [a.ring, levels[k]]))
  const { index, tiles } = splitPackage(pkg, (_ring, area) => byRing.get(area.ring))
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
  const full: CityIndex = { ...index, tiles: entries }
  const text = JSON.stringify(full)
  await writeFile(resolve(dir, 'index.json'), text)
  const biggest = entries.reduce((m, e) => Math.max(m, e.bytes), 0)
  console.log(`  → public/cities/${pkg.id}/  ${entries.length} tiles, ${Math.round(total / 1024)} kB `
    + `(largest ${Math.round(biggest / 1024)} kB), index ${Math.round(text.length / 1024)} kB`)
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
