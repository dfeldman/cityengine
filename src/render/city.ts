/**
 * A baked city package into a scene.
 *
 * The organising idea is **build near, not all**. Le Marais is 7 600 street edges and 2 700 buildings; drawing
 * every one of them would be both slow and pointless, since a rider on a street sees the two hundred metres
 * they are in. So the city is diced into 200 m tiles and only the tiles near the rider are built, with the
 * rest constructed as they come into range and disposed as they go out. That is the same streaming Trail
 * Trainer does along a route, generalised from a line to a plane.
 *
 * Buildings are merged per (tile, style), which is what keeps a street to a few dozen draw calls rather than
 * two thousand. Trail Trainer's expensive lesson was that a triangle budget goes not on detail but on things
 * drawn separately, and a city is the case where that bites hardest.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import type { Scene } from '@babylonjs/core/scene'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { stopSign, uspsBox, billboard, muniStop, plainStop, newsRacks, parkingMeter, utilityPole, pathOfGold, bikeRack, tripleBin, posterBoard, mapKiosk, cafeSet, planterBox } from './us-furniture.ts'
import { streetClockPost } from './street-clock.ts'
import { clockFace } from './landmarks/parts.ts'
import { Clocks } from './clocks.ts'
import { MeshBuilder, buildBuilding, capPolygon, capPolygonWithHoles, type Arch, type AtlasManifest, type Ring } from './buildings.ts'
import { archSize, passageArches } from './passages.ts'
import { inOutline } from './bridge-structures.ts'
import { straightOutline } from '../city/bridge-axis.ts'
import { facadeMaterial } from './facade-material.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { court } from './sports.ts'
import { groundLayerMaterial, roadMaterial } from './road-material.ts'
import { addShadow, shadowMaterial, shadowOffset, SHADOW_Y } from './shadows.ts'
import { DAYLIGHT } from './facade-material.ts'
import {
  bench, bikeDocks, bollard, hydrant, ctaEntrance, drinkingTap, genericEntrance, guimardEntrance, kiosk, lampPost,
  morrisColumn, nycSubwayEntrance, parisNewsstand, trafficLight, trafficLightMast, trafficLightParis, wallaceFountain,
  wallLamp, strut, prism, FIXED,
} from './models.ts'
import { facesStreet, pavementDepth, streetIndex, type StreetIndex } from '../city/frontage.ts'
import { region, type Region } from '../city/region.ts'
import { pointAlong } from '../sim/navigate.ts'
import { waterMaterial } from './water-material.ts'
import { LOOKS_ON, lookFor } from '../city/appearance.ts'
import { flatSignMesh } from './sign-plates.ts'
import { planFacade, type StyleId } from '../city/facade.ts'
import { Terrain, type PackedTerrain } from '../city/terrain.ts'
import { Carriageways } from '../city/carriageways.ts'
import { bartEntrance, sfTrashCan, chainBollard, streetBanners } from './sf/furniture.ts'
import { waterLookup } from './watermask.ts'
import { beachTint, buildShore, revetmentBand, shoreDistance, type ShoreIndex } from './shore.ts'
import { plog } from '../profile.ts'
import { unpackPoints, type CityPackage, type PackedArea, type PackedCourt, type PackedBuilding, type PackedEdge, type PackedFurniture, type PackedRail } from '../city/package.ts'
import { BRIDGE_STYLES, deck, isRaised, railDeck } from './bridges.ts'
import { FREEWAY_KINDS } from './bridge-structures.ts'
import { TILE, nearOf, tileKey, tileOf, tilesOfLine, type Near, type TileData, type TileSource } from '../city/tiles.ts'
import { layoutLot, type Stall } from '../city/parking.ts'

/** A subsystem drawn per tile: `build` returns the tile's meshes (disposed with the tile). */
export interface TileLayer {
  name: string
  build(near: Near, rect: { x0: number; z0: number; x1: number; z1: number }): Mesh[]
  /** how far from the rider's tile it is built, in tiles (Chebyshev); every built tile when absent */
  range?: number
  /** a tile's meshes were dropped: give back anything held for it (atlas cells) */
  release?(key: string): void
}

/** Milliseconds a frame may spend building tiles and layers once the city has loaded. */
/**
 * How long a frame may spend building tiles, in milliseconds.
 *
 * This is an ALLOCATION RATE, which is what it turned out to matter as. Owner, 2026-10-20: *"Still
 * always crashes on iOS. It's fine at the beginning but if I go a few blocks down the hill (even slowly)
 * it always crashes."* Measured at an iPhone viewport while riding: the heap retains a perfectly healthy
 * 229 MB, and the LIVE heap sawtooths to 737 MB — over 384 on 46% of samples. The city is not holding
 * too much; it is making garbage faster than the collector takes it away, and desktop V8 hides that by
 * letting rubbish pile up to gigabytes while a phone is killed at 384 MB.
 *
 * Seven milliseconds a frame is 42% of every second spent allocating geometry. Spending less does not
 * build less in total, it builds it more slowly — which is the whole point, because the collector is
 * rate-limited and the peak is what kills the tab. A phone pays for it in tiles arriving a little later.
 */
let BUILD_MS = 7

/** Per device (tier.ts `buildMs`). Lower where the collector cannot keep up. */
export function setBuildBudget(ms: number): void { BUILD_MS = Math.max(0.5, ms) }
/** The mid ring's reach in tiles (PARIS_EXPAND §2: massing out to ~1200 m). Per device: `setRings`. */
export let MID = 6
import { onSurface, steeperThanWall, waterLevels, wholeWater } from '../city/package.ts'
import { buildingFooting, simplifyRing } from '../map/footing.ts'
import { signalLamps, type SignalHead } from './lamps.ts'
import { StreetGrade } from '../city/grade.ts'

/** Tile size in metres: the ONE grid, shared with the bake (city/tiles.ts). */
export { TILE }
/** How far from the rider tiles are kept built. Per device: `setRings`. */
export let VIEW = 3
/**
 * The grid the DISTANT GROUND and the coarse DEPTH OCCLUDER are built on, as a multiple of the terrain's own step
 * (src/tier.ts; iOS's ultra tier: 2, a quarter of their ~100 MB of vertex buffers). Both are built from the SAME
 * decimated grid, so they agree with each other; near the rider the occluder is rebuilt from the fine ground anyway.
 */
let GROUND_STRIDE = 1
export function setGroundStride(n: number): void { GROUND_STRIDE = Math.max(1, Math.round(n)) }
/** The see-through glass and mesh of a padel court's walls (render/sports.ts `padel`): its vertex colours, mostly clear. */
function courtGlassMaterial(scene: Scene): StandardMaterial {
  const name = 'courtGlass'
  const had = scene.getMaterialByName(name)
  if (had) return had as StandardMaterial
  const m = new StandardMaterial(name, scene)
  m.diffuseColor = new Color3(1, 1, 1)
  m.specularColor = new Color3(0.35, 0.38, 0.4)
  m.alpha = 0.32
  m.backFaceCulling = false
  return m
}

/** a point in a ring of flat x, z pairs */
function pointInFlatRing(r: number[], x: number, z: number): boolean {
  let o = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
  }
  return o
}

function groundGrid(t: PackedTerrain | undefined | null): PackedTerrain | undefined {
  if (!t || GROUND_STRIDE === 1) return t ?? undefined
  const k = GROUND_STRIDE
  const cols = Math.floor((t.cols - 1) / k) + 1
  const rows = Math.floor((t.rows - 1) / k) + 1
  const heights = new Float32Array(cols * rows)
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) heights[r * cols + c] = t.heights[r * k * t.cols + c * k]
  return { ...t, step: t.step * k, cols, rows, heights }
}

/** The rings for this device (src/tier.ts), before the City is made: a phone holds less city round the rider. */
export function setRings(view: number, mid: number): void { VIEW = view; MID = mid }

/**
 * The ground is four near-coplanar layers — the base plane, mapped areas, the carriageway and the pavement —
 * a few centimetres apart. At a grazing angle, which is how a rider sees the street thirty metres ahead, a
 * few centimetres is below what the depth buffer can resolve and the layers tear into each other.
 *
 * Separating them in RENDERING ORDER rather than in height fixes it: Babylon clears the depth buffer between
 * rendering groups, so each layer is drawn over the one below it and the depth buffer never has to resolve
 * two surfaces three centimetres apart. This is the same trick Trail Trainer uses for its two ground rings.
 * Buildings go last, which is safe because nothing in the city is below the ground.
 *
 * That still leaves roads fighting *each other*. At a junction three to six ribbons overlap at exactly the
 * same height, and no amount of layering separates surfaces that are precisely coplanar — which is why the
 * city still shimmered at every corner when it was only the layers that had been fixed. Each edge is given a
 * few tenths of a millimetre of its own from its id: far too little to see, and enough to break every tie
 * the same way on every frame, so nothing flickers. Junction polygons (see the roadmap) are the real answer.
 */
// Babylon has exactly four rendering groups, 0–3. Asking for a fifth silently drops the mesh — which is
// what made every building in the city vanish the moment the ground was split into four layers. The
// pavement and the buildings share the last group, which is safe: they are not coplanar with each other.
// Four groups, 0–3, and Babylon clears depth between them, which is what makes the ground layers stack.
// Asking for a fifth silently drops the mesh — that is how every building in the city once vanished.
/** the through routes: where the cafés and the bigger shops are, and their awnings deep */
const MAIN_STREETS = new Set(['primary', 'secondary', 'tertiary'])

const GROUP = { base: 0, areas: 1, corridor: 1, road: 2, walk: 3, building: 3 } as const

/** A place where streets meet, and which way each of them leaves. */
interface Junction {
  at: { x: number; z: number }
  radius: number
  walk: number
  edges: number
  /** every way meeting here runs through open country (city/park-area.ts), so it gets no concrete apron */
  park: boolean
  /** one per street leaving here; `foot` arms shape the pavement but never the carriageway */
  arms: { ux: number; uz: number; half: number; foot: boolean; surface: string; raised?: boolean; edgeId?: number }[]
}

/** What the city needs up front: the index's global part (city/tiles.ts `CityIndex`). */
export type CityMeta = Pick<CityPackage, 'name' | 'ground' | 'region' | 'terrain' | 'water' | 'box' | 'walls'>
  & {
    /**
     * Where the city's CONTENT actually is, in local metres, from the index's own tile list (BUGS.md #225,
     * #230): the bbox of every tile that holds a building or an edge, at 200 m granularity, which is far finer
     * than a ground occluder needs. `game.ts` computes it; absent, the ground falls back to the box and its
     * margin exactly as it always did.
     */
    contentBox?: { x0: number; x1: number; z0: number; z1: number }
    /** the sea's surface, datum metres (the index's `sea`), for `distantSea`; absent, there is no open sea drawn */
    sea?: number | null
  }

const key = tileKey

const YELLOW: [number, number, number] = [0.89, 0.71, 0.0]

/** The colours of the ground, which are not part of any building's palette. The carriageway is not here:
 * its colour comes from its own painted surface page, through `src/render/road-material.ts`. */
const AREA_TINT: Record<PackedArea['kind'], [number, number, number]> = {
  park: [0.33, 0.44, 0.26], grass: [0.36, 0.47, 0.28],
  /*
   * A FOREST FLOOR IS NOT A LAWN. `wood` was the darkest of the greens, which is what a wood looks like
   * from the air and not at all what it looks like from inside one. Under the cypress and eucalyptus in
   * Golden Gate Park the ground is bare brown duff — needles, bark and fallen leaves — and the owner's
   * complaint that the park *"needs a lot of dirt"* and that the ground is a uniform mown lawn everywhere
   * is largely this one colour. Olive-brown rather than brown: there is still growth in it.
   */
  wood: [0.27, 0.25, 0.17],
  // the beach (BUGS.md #200): pale dry sand above the tide line, not the wet strip, which is what is seen
  sand: [0.80, 0.75, 0.62],
  // bare earth and duff mapped as such: the same ground the wood has, where OSM says so outright
  dirt: [0.34, 0.29, 0.21],
  pitch: [0.32, 0.45, 0.30], water: [0.20, 0.30, 0.38],
  // a paved square: warm stone setts and stabilised sand, paler than a pavement (BUGS.md #22)
  paved: [0.62, 0.58, 0.51],
  // a car park or a pier deck on fill: worn asphalt — pale-stone 'paved' turned Treasure Island's lots white (2026-10-03)
  lot: [0.36, 0.36, 0.35],
}
/**
 * Sand is capped finer than the rest of the ground (BUGS.md #200). The bands are a per-VERTEX colour, and
 * a vertex colour is interpolated across its triangle: at the general area step (two terrain cells, 8 m at
 * best) a nine-metre wet band would be a gradient over the whole beach rather than a tide line. Four metres
 * is enough to put two or three vertices across the band, and beaches are a rounding error in the city's
 * triangle budget — there is one strip of sand in San Francisco, not a network of them.
 */
const SAND_MAX_EDGE = 4
/** planted beds' ground: pale grey-brown bark mulch between low shrubs (the Tunnel Tops, Commons aerial) */
const BEDS: [number, number, number] = [0.47, 0.44, 0.37]
/** bare rock at the waterline: dark, wet */
const WET_ROCK: [number, number, number] = [0.22, 0.21, 0.2]
// Paving is grey, not white. The brighter value washed out every street it was laid in.
const PAVEMENT: [number, number, number] = [0.52, 0.51, 0.485]
/** sand's tint on the road shader's sand page (which is already sand-coloured): Ocean Beach's pale grey-tan, not gold */
const SAND_ON_PAGE: [number, number, number] = [0.64, 0.65, 0.72]
/** a paged square's tint on its page (PackedArea `surface`): weathered grey-brown boards, grey granite setts, red brick —
 *  the brick and plank pages are orange, and the colour grade saturates them further: the tints pull red DOWN against
 *  green and blue, or Ghirardelli's courts and Pier 39's deck came out bright orange (2026-10-17) */
const SURFACE_ON_PAGE: Record<'wood' | 'cobblestone' | 'brick', [number, number, number]> = {
  wood: [0.6, 0.76, 1.0], cobblestone: [0.82, 0.8, 0.78], brick: [0.5, 0.72, 0.88],
}
/** a park's foot way's surface page (public/roads/; #201's park has no concrete): asphalt, earth, gravel, boards */
const TRAIL_PAGE: Record<string, string> = {
  asphalt: 'asphalt', concrete: 'asphalt', dirt: 'dirt', ground: 'dirt', earth: 'dirt', compacted: 'dirt', grass: 'dirt',
  gravel: 'gravel', fine_gravel: 'gravel', pebblestone: 'gravel', sand: 'sand', wood: 'wood', woodchips: 'dirt',
  unpaved: 'dirt', paved: 'asphalt',
  paving_stones: 'cobblestone', sett: 'cobblestone', cobblestone: 'cobblestone', brick: 'brick',
}



/**
 * How wide the pavement is beside a street of this width.
 *
 * A fixed two metres a side is wrong at both ends. OSM's `width` is the carriageway, and on the Marais's
 * service alleys that is three metres — a single lane between two walls, with a kerb if it has one at all.
 * Giving it four metres of pavement anyway produced a street with half a lane of road down the middle of a
 * plaza, which is not what any of those streets look like.
 *
 *   under 4 m   a lane between buildings; no pavement, no kerb
 *   4 – 6 m     one lane and a step at the side
 *   6 – 9 m     two narrow lanes and a proper pavement
 *   over 9 m    a street with room for everything
 *
 * Markings agree with this by construction: the road shader only paints a centre line above a half-width of
 * 2.6 m, so exactly the streets that get two lanes here are the ones that get a line down the middle.
 */
export function pavementFor(width: number): number {
  if (width < 4.0) return 0
  if (width < 6.0) return 1.1
  if (width < 9.0) return 1.8
  return 2.4
}

/**
 * A slice of a polyline, `fromStart` metres in from one end and `fromEnd` in from the other.
 *
 * This is how a junction gets made. Every street is cut back from the node it meets, leaving a hole that the
 * junction pad fills. Without it the ribbons simply overlap: the pavement of one street runs straight across
 * the carriageway of the next, and every corner in the city has a kerb ploughing through the middle of it.
 */
function slice(points: { x: number; z: number }[], fromStart: number, fromEnd: number):
    { x: number; z: number }[] {
  const total = polyLength(points)
  const a = Math.min(fromStart, total * 0.45)
  const b = total - Math.min(fromEnd, total * 0.45)
  if (b <= a) return []
  const out: { x: number; z: number }[] = [pointOn(points, a)]
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
    if (acc + d > a && acc + d < b) out.push(points[i])
    acc += d
  }
  out.push(pointOn(points, b))
  return out
}

function polyLength(points: { x: number; z: number }[]): number {
  let t = 0
  for (let i = 1; i < points.length; i++) {
    t += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
  }
  return t
}

function pointOn(points: { x: number; z: number }[], s: number): { x: number; z: number } {
  if (s <= 0) return points[0]
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dz = points[i].z - points[i - 1].z
    const d = Math.hypot(dx, dz)
    if (acc + d >= s) {
      const t = d === 0 ? 0 : (s - acc) / d
      return { x: points[i - 1].x + dx * t, z: points[i - 1].z + dz * t }
    }
    acc += d
  }
  return points[points.length - 1]
}


/**
 * Stamp a model into a static mesh at a position and a heading.
 *
 * Street furniture does not move, so it is baked into the tile's own mesh rather than instanced: a lamp post
 * is forty triangles and merging them costs less than a second draw call per tile would.
 */
function placeModel(out: MeshBuilder, model: (b: MeshBuilder) => void, x: number, y: number, z: number,
                    heading: number): void {
  const tmp = new MeshBuilder()
  model(tmp)
  const base = out.positions.length / 3
  const cos = Math.cos(heading)
  const sin = Math.sin(heading)
  for (let i = 0; i < tmp.positions.length; i += 3) {
    const px = tmp.positions[i]
    const py = tmp.positions[i + 1]
    const pz = tmp.positions[i + 2]
    out.positions.push(x + px * cos + pz * sin, y + py, z - px * sin + pz * cos)
    const nx = tmp.normals[i]
    const nz = tmp.normals[i + 2]
    out.normals.push(nx * cos + nz * sin, tmp.normals[i + 1], -nx * sin + nz * cos)
  }
  for (let i = 0; i < tmp.uvs.length; i++) out.uvs.push(tmp.uvs[i])
  for (let i = 0; i < tmp.colors.length; i++) out.colors.push(tmp.colors[i])
  for (const idx of tmp.indices) out.indices.push(base + idx)
  RIGID.get(out)?.push([base, tmp.positions.length / 3, x, z])
}

/**
 * Models placed RIGIDLY: a builder registered here has each `placeModel` remembered (its vertices, its anchor), and
 * `drapeRigid` lifts those vertices by the ground under the ANCHOR, not each by the ground under itself. Draped vertex
 * by vertex, a stop sign standing at a kerb — where the levelled street meets the pavement and the ground steps —
 * came out sheared, its plate rolled and its letters torn (owner, 2026-10-15, Minna at Mary: "stop sign is deformed").
 */
const RIGID = new WeakMap<MeshBuilder, [number, number, number, number][]>()
function drapeRigid(out: MeshBuilder, terrain: Terrain): void {
  if (terrain.flat) return
  const pos = out.positions
  const own = new Float64Array(pos.length / 3).fill(NaN)
  for (const [start, count, x, z] of RIGID.get(out) ?? []) {
    const g = terrain.heightAt(x, z)
    for (let v = start; v < start + count; v++) own[v] = g
  }
  for (let v = 0; v < own.length; v++) pos[v * 3 + 1] += Number.isNaN(own[v]) ? terrain.heightAt(pos[v * 3], pos[v * 3 + 2]) : own[v]
}

/** A flat ribbon of the given width along a polyline: one street, one layer. */
/**
 * A polyline with no segment longer than `step`. Draped geometry is flat between its vertices, and across a
 * long segment on a hill that flat chord runs under the ground (or floats over a hollow) — which the terrain
 * occluder then hides, or which the markings, laid in short dashes that DO follow the ground, cover.
 */
export function densify(pts: { x: number; z: number }[], step = 4): { x: number; z: number }[] {
  const out = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
    const n = Math.max(1, Math.ceil(L / step))
    for (let k = 1; k <= n; k++) {
      out.push({ x: pts[i - 1].x + ((pts[i].x - pts[i - 1].x) * k) / n, z: pts[i - 1].z + ((pts[i].z - pts[i - 1].z) * k) / n })
    }
  }
  return out
}

function quadStrip(out: MeshBuilder, pts0: { x: number; z: number }[], width: number, y: number,
                   tint: [number, number, number], ground?: (x: number, z: number) => number): void {
  const pts = densify(pts0)
  const h = width / 2
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len = Math.hypot(dx, dz)
    if (len < 0.02) continue
    const nx = (-dz / len) * h
    const nz = (dx / len) * h
    // a little past each end, so consecutive segments overlap at a bend instead of leaving a notch; the
    // layer is painted rather than unioned, so overlap costs nothing
    const ex = (dx / len) * h * 0.55
    const ez = (dz / len) * h * 0.55
    /*
     * SPLIT ACROSS where the ground is not a plane under it (BUGS.md #234). Draped at its two long edges only, a
     * ~20 m wide pavement strip is a straight chord across the street; on a hillside that bows, the chord stood
     * half a metre off the ground at Green and Taylor, and everything draped on the true ground — the trees'
     * shadows — showed through it as grey lumps. Only where the middle is 0.15 m off the chord: flat streets
     * keep one quad.
     */
    let cols = 1
    if (ground) {
      const mx = (a.x + b.x) / 2
      const mz = (a.z + b.z) / 2
      const bow = Math.max(...[-0.5, 0, 0.5].map((f) => Math.abs(ground(mx + nx * f * 2 * 0.5, mz + nz * f * 2 * 0.5)
        - (ground(mx + nx, mz + nz) * (0.5 + f * 0.5) + ground(mx - nx, mz - nz) * (0.5 - f * 0.5)))))
      if (bow > 0.15) cols = Math.max(2, Math.ceil(width / 2.5))
    }
    for (let c = 0; c < cols; c++) {
      const s0 = 1 - (2 * c) / cols
      const s1 = 1 - (2 * (c + 1)) / cols
      out.quad(
        [[a.x + nx * s0 - ex, y, a.z + nz * s0 - ez], [a.x + nx * s1 - ex, y, a.z + nz * s1 - ez],
         [b.x + nx * s1 + ex, y, b.z + nz * s1 + ez], [b.x + nx * s0 + ex, y, b.z + nz * s0 + ez]],
        [0, 1, 0],
        [[h * s0, 0], [h * s1, 0], [h * s1, len], [h * s0, len]],
        tint, 0,
      )
    }
  }
}

/**
 * The kerb: a vertical face either side of the carriageway, from the road up to the pavement.
 *
 * Fifteen centimetres of geometry that does more for a street than any texture, because it gives the road an
 * edge that catches the sun on one side and falls into shadow on the other.
 */
function kerbStrip(out: MeshBuilder, pts0: { x: number; z: number }[], width: number,
                   bottom: number, top: number): void {
  const pts = densify(pts0)
  const h = width / 2
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len = Math.hypot(dx, dz)
    if (len < 0.02) continue
    const ux = dx / len
    const uz = dz / len
    for (const side of [1, -1]) {
      const ox = -uz * h * side
      const oz = ux * h * side
      const p0: [number, number, number] = [a.x + ox, bottom, a.z + oz]
      const p1: [number, number, number] = [b.x + ox, bottom, b.z + oz]
      const q1: [number, number, number] = [b.x + ox, top, b.z + oz]
      const q0: [number, number, number] = [a.x + ox, top, a.z + oz]
      const order: [number, number, number][] = side > 0 ? [p0, p1, q1, q0] : [q0, q1, p1, p0]
      out.quad(order, [-uz * side, 0, ux * side],
        [[0, 0], [len / 2.4, 0], [len / 2.4, (top - bottom) / 2.4], [0, (top - bottom) / 2.4]],
        PAVEMENT, 0)
    }
  }
}

/**
 * The paved area where several streets meet: the convex hull of their mouths.
 *
 * A disc was the obvious first thing and it is wrong in a way that is very visible — streets meeting at a
 * seven-way junction splay out at angles and the wedges of ground BETWEEN them are covered by no street and
 * by no disc, so they came out as triangles of grass sitting in the middle of the road. The hull is the
 * smallest convex shape containing every street mouth, so there is nothing left between them.
 */
function junctionHull(arms: Junction['arms'], at: { x: number; z: number },
                      widen: number): { x: number; z: number }[] {
  const pts: { x: number; z: number }[] = []
  let reach = 0
  for (const a of arms) reach = Math.max(reach, a.half)
  reach = reach * 1.35 + widen + 0.4
  for (const a of arms) {
    const h = a.half + widen
    const cx = at.x + a.ux * reach
    const cz = at.z + a.uz * reach
    pts.push({ x: cx - a.uz * h, z: cz + a.ux * h })
    pts.push({ x: cx + a.uz * h, z: cz - a.ux * h })
  }
  return convexHull(pts)
}

/**
 * Is the point inside this footprint, allowing a margin so the camera stops short of the wall rather than
 * touching it? The bounding box rejects almost every building before the ray test runs.
 */
function withinRing(ring: number[], x: number, z: number, margin: number): boolean {
  let minx = Infinity; let maxx = -Infinity; let minz = Infinity; let maxz = -Infinity
  for (let i = 0; i < ring.length; i += 2) {
    if (ring[i] < minx) minx = ring[i]
    if (ring[i] > maxx) maxx = ring[i]
    if (ring[i + 1] < minz) minz = ring[i + 1]
    if (ring[i + 1] > maxz) maxz = ring[i + 1]
  }
  if (x < minx - margin || x > maxx + margin || z < minz - margin || z > maxz + margin) return false

  let hit = false
  const n = ring.length / 2
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[2 * i]
    const zi = ring[2 * i + 1]
    const xj = ring[2 * j]
    const zj = ring[2 * j + 1]
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit
  }
  return hit
}

export { onSurface }

/** Distance from a point to a segment, for deciding which street a crossing crosses. */
function pointToSegment(p: { x: number; z: number }, a: { x: number; z: number },
                        b: { x: number; z: number }): number {
  const dx = b.x - a.x
  const dz = b.z - a.z
  const len2 = dx * dx + dz * dz
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / len2))
  return Math.hypot(p.x - (a.x + dx * t), p.z - (a.z + dz * t))
}

const lengthOf = (pts: { x: number; z: number }[]): number => {
  let t = 0
  for (let i = 1; i < pts.length; i++) t += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
  return t
}

/** Andrew's monotone chain. */
function convexHull(pts: { x: number; z: number }[]): { x: number; z: number }[] {
  const p = [...pts].sort((a, b) => (a.x - b.x) || (a.z - b.z))
  const cross = (o: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number =>
    (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x)
  const half = (src: { x: number; z: number }[]): { x: number; z: number }[] => {
    const out: { x: number; z: number }[] = []
    for (const q of src) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop()
      out.push(q)
    }
    out.pop()
    return out
  }
  return [...half(p), ...half([...p].reverse())]
}

/** The thick white line traffic stops at, painted across a junction arm. */
function stopBar(out: MeshBuilder, x: number, z: number, ux: number, uz: number, width: number): void {
  const white: [number, number, number] = [0.88, 0.87, 0.82]
  const hx = (-uz * width) / 2
  const hz = (ux * width) / 2
  const t = 0.3                       // how thick the bar is, along the street
  out.quad(
    [[x + hx - ux * t, 0.064, z + hz - uz * t], [x - hx - ux * t, 0.064, z - hz - uz * t],
     [x - hx + ux * t, 0.064, z - hz + uz * t], [x + hx + ux * t, 0.064, z + hz + uz * t]],
    [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], white, 0,
  )
}

/**
 * A zebra crossing: bars ACROSS the direction of walking, which is along the direction of driving.
 *
 * Drawn from the footway OSM marks as a crossing, so it lands exactly where a crossing really is rather than
 * wherever two ways happen to overlap.
 */
/** The nearest carriageway to a crossing: how wide it is, and where its centre line runs. */
type Point = { x: number; z: number }
type Carriageway = { span: number; on: { a: Point; b: Point } | null }

/**
 * The part of a crossing that is actually ON the road.
 *
 * OSM draws a crossing way from pavement to pavement — sometimes from building line to building line — so
 * painting the whole thing ran zebra bars up over the kerb and out across the footway on both sides.
 *
 * Trimming an equal amount off each end is not enough, which is what was here before. A crossing is very
 * rarely centred on the carriageway it crosses: at a junction it starts at a corner, and the road's centre
 * line can sit well off the middle of the way. Trimming symmetrically then leaves bars on the pavement at
 * one end and stops short of the far kerb at the other.
 *
 * So it is clipped geometrically instead: walk the way, keep the longest run of it that lies within half a
 * carriageway of the road's centre line, and paint only that. Where no road was found, fall back to the
 * old symmetric trim, which is at least bounded.
 */
function onCarriageway(pts: Point[], road: Carriageway): Point[] {
  const len = lengthOf(pts)
  if (!road.on) {
    const trim = Math.max(0, (len - Math.min(len, road.span)) / 2)
    return slice(pts, trim, trim)
  }
  const { a, b } = road.on
  const dx = b.x - a.x
  const dz = b.z - a.z
  const d = Math.hypot(dx, dz)
  if (d < 1e-3) return slice(pts, 0, 0)
  /*
   * Across the road, or not at all. OSM maps some crossings diagonally through the middle of a junction
   * — a scramble, or a mapper's shortcut — and drawn as zebras they laid an X of stripes over the junction
   * box, overlapping the proper crossings on each arm. A zebra is painted square to the traffic; anything
   * within thirty degrees of running along the road is not one.
   */
  const cx = pts[pts.length - 1].x - pts[0].x
  const cz = pts[pts.length - 1].z - pts[0].z
  const cl = Math.hypot(cx, cz)
  if (cl < 1e-3 || Math.abs((cx * dx + cz * dz) / (cl * d)) > 0.5) return []
  // unit normal of the road: distance along it is what says which side of the kerb a point is on
  const nx = -dz / d
  const nz = dx / d
  /*
   * Then painted SQUARE across the road, kerb to kerb, through the point where the footway crosses the
   * road's centre line — not along the footway. OSM's crossings are drawn at whatever angle the mapper
   * clicked, often from a corner, and painted along the way the bars came out slanted and ran up over the
   * kerb at one end while stopping short of the other. A painted crossing is square to the traffic.
   */
  let best = Infinity
  let cx0 = pts[0].x
  let cz0 = pts[0].z
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1]
    const q = pts[i]
    const op = (p.x - a.x) * nx + (p.z - a.z) * nz
    const oq = (q.x - a.x) * nx + (q.z - a.z) * nz
    if (op === oq) continue
    const f = Math.max(0, Math.min(1, op / (op - oq)))
    const x = p.x + (q.x - p.x) * f
    const z = p.z + (q.z - p.z) * f
    const off = Math.abs((x - a.x) * nx + (z - a.z) * nz)
    if (off < best) { best = off; cx0 = x; cz0 = z }
  }
  if (best > road.span) return []
  // onto the centre line itself, then out to each kerb, a little short of it
  const along = ((cx0 - a.x) * dx + (cz0 - a.z) * dz) / d
  const ox = a.x + (dx / d) * along
  const oz = a.z + (dz / d) * along
  const half = Math.max(0.8, road.span / 2 - 0.5)
  return [{ x: ox - nx * half, z: oz - nz * half }, { x: ox + nx * half, z: oz + nz * half }]
}

function zebra(out: MeshBuilder, pts: { x: number; z: number }[], width: number, bar = 0.52, gap = 0.48): void {
  const white: [number, number, number] = [0.88, 0.87, 0.82]
  let travelled = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len = Math.hypot(dx, dz)
    if (len < 0.05) continue
    const ux = dx / len
    const uz = dz / len
    const hx = (-uz * width) / 2
    const hz = (ux * width) / 2
    let t = 0
    while (t < len) {
      const phase = (travelled + t) % (bar + gap)
      if (phase < bar) {
        const seg = Math.max(1e-3, Math.min(bar - phase, len - t))
        const x0 = a.x + ux * t
        const z0 = a.z + uz * t
        const x1 = a.x + ux * (t + seg)
        const z1 = a.z + uz * (t + seg)
        out.quad(
          [[x0 + hx, 0.064, z0 + hz], [x0 - hx, 0.064, z0 - hz],
           [x1 - hx, 0.064, z1 - hz], [x1 + hx, 0.064, z1 + hz]],
          [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], white, 0,
        )
        t += seg
      } else {
        // never zero: a phase that lands exactly on the boundary makes this loop stop advancing, which
        // hangs the tab rather than drawing anything
        t += Math.max(1e-3, bar + gap - phase)
      }
    }
    travelled += len
  }
}

/**
 * Painted road markings, as their own thin quads offset from a street's centre line.
 *
 * `on`/`period` give the dash: 3 m of paint every 9 m for a centre line, or on = period for a solid edge
 * line. Drawn as geometry rather than in the asphalt shader because the road surface is now a single unioned
 * polygon with no notion of which street any given square metre belongs to.
 */
/** San Francisco's transit-only red */
const BUS_RED: [number, number, number] = [0.46, 0.14, 0.12]
const BIKE_GREEN: [number, number, number] = [0.27, 0.52, 0.3]
const RAINBOW: [number, number, number][] = [[0.82, 0.12, 0.12], [0.92, 0.48, 0.1], [0.95, 0.85, 0.15], [0.15, 0.6, 0.25], [0.15, 0.35, 0.8], [0.45, 0.2, 0.6]]

/**
 * The page a CARRIAGEWAY is drawn with. A concrete street (OSM `surface=concrete`: some 1600 of San Francisco's ways —
 * Mason on Nob Hill, many service lanes) is drawn as road, not on the concrete page: that page is the pavement's,
 * and the street vanished into its own sidewalks (owner, 2026-10-15: "Mason street … displays as sidewalk texture").
 * Only the drawing: the ride still reads the surface OSM gives (rolling resistance, graph.ts).
 */
function drawnSurface(e: { surface: string; foot?: boolean }): string {
  return !e.foot && e.surface === 'concrete' ? 'asphalt' : e.surface
}

function dashedLine(out: MeshBuilder, pts: { x: number; z: number }[], offset: number, y: number,
                    width: number, on: number, period: number,
                    white: [number, number, number] = [0.86, 0.85, 0.79]): void {
  let travelled = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len = Math.hypot(dx, dz)
    if (len < 0.02) continue
    const ux = dx / len
    const uz = dz / len
    const ox = (-dz / len) * offset
    const oz = (dx / len) * offset
    let t = 0
    while (t < len) {
      const phase = (travelled + t) % period
      if (phase < on) {
        const seg = Math.max(1e-3, Math.min(on - phase, len - t))
        const x0 = a.x + ux * t + ox
        const z0 = a.z + uz * t + oz
        const x1 = a.x + ux * (t + seg) + ox
        const z1 = a.z + uz * (t + seg) + oz
        /*
         * A wide band (Market's red centre lanes, 6.6 m; a painted busway) is cut ACROSS into strips of at most 1.2 m:
         * the marking is draped vertex by vertex, and across 6 m with only its two edges sampled it hung flat as a chord
         * under the crown of the road between them — the road showed through it in torn patches (owner, 2026-10-06,
         * Market at 6th: "red pavement looks bad here").
         */
        const strips = Math.max(1, Math.ceil(width / 1.2))
        for (let k = 0; k < strips; k++) {
          const f0 = -0.5 + k / strips, f1 = -0.5 + (k + 1) / strips
          const a0x = -uz * width * f0, a0z = ux * width * f0, a1x = -uz * width * f1, a1z = ux * width * f1
          out.quad(
            [[x0 + a1x, y, z0 + a1z], [x0 + a0x, y, z0 + a0z], [x1 + a0x, y, z1 + a0z], [x1 + a1x, y, z1 + a1z]],
            [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], white, 0,
          )
        }
        t += seg
      } else {
        t += Math.max(1e-3, period - phase)   // see the note in `zebra`: a zero step hangs the tab
      }
    }
    travelled += len
  }
}

interface Tile {
  meshes: Mesh[]
  /** each layer's meshes, built and dropped by the layer's own range */
  layers: Map<string, Mesh[]>
}

/**
 * Babylon clears depth between rendering groups by default, but the whole ground scheme depends on it, so it
 * is stated here rather than assumed — a future change to the default would otherwise bring the shimmer back
 * with nothing to point at.
 */
export function setupGroundLayers(scene: Scene): void {
  for (const g of [GROUP.areas, GROUP.road, GROUP.walk]) {
    scene.setRenderingAutoClearDepthStencil(g, true, true, false)
  }
}

/**
 * The whole city's ground, once, as a coarse mesh.
 *
 * The streamed tiles cover about six hundred metres around the rider, which is plenty for the street they
 * are on and not nearly enough for the horizon: on a hill, everything further out — the trees, the distant
 * buildings — stood in mid-air with the sky behind it, because the ground they were standing on had not
 * been built. This is the ground under all of it, at half the grid's resolution, drawn behind everything.
 *
 * It costs one mesh of a few thousand triangles and it is what gives a hilly city a skyline.
 */
/*
 * WHERE THE GROUND HAS TO BE DRAWN: the bbox of everything that is actually built, not the rideable box.
 *
 * BUGS.md #225 (owner, 2026-09-24: "I can see at least 20 buildings THROUGH the hill... on the other side of
 * the hill", at 37.850150,-122.480760 — Sausalito, which he then asked for detail in, because that is where
 * the Golden Gate Bridge lands: "we'll need detail there so people can bike over the bridge").
 *
 * Both ground passes below used `pkg.box` plus a flat 1500 m. That is the RIDEABLE box, and in San Francisco
 * it is a different rectangle from the one the bake fills: the detail box reaches 1000 m further north, and
 * Overpass returns whole ways, so content spills further still. Measured on the baked package:
 *
 *            occluder reached      content reaches
 *   north        6100                  7491     1391 m of built ground with NO occluder over it
 *   south       -5100                 -6043      943 m the same, over Daly City
 *   east         9300                  4661     4639 m of occluder over empty bay
 *
 * Buildings draw in GROUP.building = 3 and the ground in GROUP.base = 0, and Babylon CLEARS THE DEPTH BUFFER
 * BETWEEN RENDERING GROUPS, so terrain cannot hide a building on its own — this occluder mesh is the only
 * thing that does. Past its edge every building behind a hill shows through it. Sausalito's buildings sit at
 * z 6366, 266 m outside it.
 *
 * The bounds are the UNION of the old box + 1500 and the content + 400, never just the content: the baked
 * terrain grid runs east to 17620, so dropping the east strip to where the buildings stop would leave the
 * ground undrawn from 5061 out to the grid's edge — and the skirt below only starts BEYOND the grid, so
 * nothing would cover it. Oakland's shoreline is in that strip and is visible from the Bay Bridge deck, a
 * tier-1 route. The union costs about 29% more ground than the constant did and strictly grows coverage, so
 * it cannot take anything away that was drawing before.
 *
 * Self-maintaining: no city's ground bounds can drift from its content again, and no re-bake is needed to
 * pick it up, because it is measured from the package that is already loaded.
 */
function contentBounds(pkg: CityPackage): { x0: number; x1: number; z0: number; z1: number } | null {
  const B = pkg.box
  const BOX = 1500
  const box = B ? { x0: B.x0 - BOX, x1: B.x1 + BOX, z0: B.z0 - BOX, z1: B.z1 + BOX } : null
  const c = (pkg as CityPackage & CityMeta).contentBox
  if (!c) return box
  // a hill just BEHIND the last building still has to occlude it, so carry on a little past the content
  const PAD = 400
  const grown = { x0: c.x0 - PAD, x1: c.x1 + PAD, z0: c.z0 - PAD, z1: c.z1 + PAD }
  return box === null ? grown : {
    x0: Math.min(grown.x0, box.x0), x1: Math.max(grown.x1, box.x1),
    z0: Math.min(grown.z0, box.z0), z1: Math.max(grown.z1, box.z1),
  }
}


/**
 * THE SEA BEYOND THE TILES (appearance audit, 2026-10-02): water is drawn by the tiles, so past the ring of built
 * tiles the ocean and the bay were the distant GROUND — grass-coloured — and the Pacific off Ocean Beach read as a
 * green field with a strip of water along the shore. One flat plane at the package's sea level, a little under it so
 * the tiles' own water wins where both are drawn, in the distant ground's group: the land stands above it and hides
 * it by depth, and everywhere the ground is below the sea — the bed the bake flattened — the sea shows.
 */
function distantSea(scene: Scene, pkg: CityPackage): Mesh | null {
  const t = pkg.terrain
  const sea = (pkg as CityPackage & CityMeta).sea ?? pkg.seaLevel
  if (!t || sea === null || sea === undefined) return null
  const PAD = 3000
  const SIZE = 2000
  const x0 = t.x0 - PAD, z0 = t.z0 - PAD
  const x1 = t.x0 + (t.cols - 1) * t.step + PAD, z1 = t.z0 + (t.rows - 1) * t.step + PAD
  const y = sea - 0.3
  const pos: number[] = [], nrm: number[] = [], idx: number[] = []
  for (let z = z0; z < z1; z += SIZE) {
    for (let x = x0; x < x1; x += SIZE) {
      const n = pos.length / 3
      const xa = Math.min(x + SIZE, x1), za = Math.min(z + SIZE, z1)
      pos.push(x, y, z, xa, y, z, xa, y, za, x, y, za)
      nrm.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0)
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3)
    }
  }
  const vd = new VertexData()
  vd.positions = pos
  vd.normals = nrm
  vd.indices = idx
  const m = new Mesh('ground:sea', scene)
  vd.applyToMesh(m)
  m.material = waterMaterial(scene)
  m.renderingGroupId = GROUP.base
  m.isPickable = false
  return m
}

function distantGround(scene: Scene, terrain: Terrain, pkg: CityPackage, assets: string): Mesh | null {
  const t = groundGrid(pkg.terrain)
  if (!t) return null
  const out = new MeshBuilder()
  // full resolution, the same grid as the depth occluder: at half resolution the drawn ground ran lower than
  // the occluder on slopes, and buildings beyond the box stood on nothing, their bases hidden (user report)
  const stride = 1
  const step = t.step * stride
  /*
   * BUGS.md #164/#169/#179: bounded to the rideable box + margin, exactly like `groundOccluder` below is
   * already bounded — the occluder was never the expensive one. This loop had NO such bound, so it walked
   * the WHOLE baked terrain grid (San Francisco: 2 588 651 samples) at full resolution on every load, one
   * `quad()` per cell. Measured: `new City(...)` — almost entirely this call — took 86 s and grew the heap by
   * 2.5 GB on its own (`window.__marks`, `city` stage), dwarfing every other load stage combined (a few
   * hundred ms each) and the per-tile `bring()` chain that was the original suspect (93 ms total over 121
   * tiles, see `window.__bringStats()`). The margin matches the occluder's so the two keep meeting past the
   * box edge; the skirt below still carries the ground on out to the horizon beyond that.
   */
  const box = contentBounds(pkg)
  const boxMargin = 0
  /*
   * In 800 m chunks, one vertex per grid point (BUGS.md #242, the iPhone's memory). It was one mesh of four
   * vertices a cell — 3.8 million in San Francisco, 198 MB of vertex buffers, drawn whole every frame — built
   * in one set of JS number arrays. The normal and colour are the same everywhere, so a point shared by four
   * cells is the same vertex; the uvs are world metres from the grid's corner rather than each cell's own
   * 0..step, which is the same page wherever `ROAD_PAGE_METRES` divides the step and seamless where it does not.
   */
  const mat = roadMaterial(scene, pkg.ground, assets)
  const CHUNK = 800
  const per = Math.max(1, Math.round(CHUNK / step))
  const inBox = (c: number, r: number): boolean => {
    const x = t.x0 + c * t.step
    const z = t.z0 + r * t.step
    return !(box && (x + step < box.x0 - boxMargin || x > box.x1 + boxMargin
      || z + step < box.z0 - boxMargin || z > box.z1 + boxMargin))
  }
  let cells = 0
  for (let r0 = 0; r0 + stride < t.rows; r0 += per * stride) {
    for (let c0 = 0; c0 + stride < t.cols; c0 += per * stride) {
      const r1 = Math.min(r0 + per * stride, t.rows - 1)
      const c1 = Math.min(c0 + per * stride, t.cols - 1)
      const W = c1 - c0 + 1
      const id = new Int32Array(W * (r1 - r0 + 1)).fill(-1)
      const pos: number[] = []
      const idx: number[] = []
      const v = (c: number, r: number): number => {
        const k = (r - r0) * W + (c - c0)
        if (id[k] < 0) {
          id[k] = pos.length / 3
          pos.push(t.x0 + c * t.step, t.heights[r * t.cols + c], t.z0 + r * t.step)
        }
        return id[k]
      }
      for (let r = r0; r < r1; r += stride) {
        for (let c = c0; c < c1; c += stride) {
          if (!inBox(c, r)) continue
          // MeshBuilder.quad's winding for these corners facing up
          const a = v(c, r), b = v(c + stride, r), cc = v(c + stride, r + stride), d = v(c, r + stride)
          idx.push(a, b, cc, a, cc, d)
          cells++
        }
      }
      if (idx.length === 0) continue
      const n = pos.length / 3
      const vd = new VertexData()
      vd.positions = new Float32Array(pos)
      vd.normals = new Float32Array(n * 3)
      vd.uvs = new Float32Array(n * 2)
      vd.colors = new Float32Array(n * 4)
      for (let i = 0; i < n; i++) {
        vd.normals[i * 3 + 1] = 1
        vd.uvs[i * 2] = pos[i * 3] - t.x0
        vd.uvs[i * 2 + 1] = pos[i * 3 + 2] - t.z0
        vd.colors.set([0.5, 0.5, 0.5, 0], i * 4)
      }
      vd.indices = n > 65535 ? new Uint32Array(idx) : new Uint16Array(idx)
      const m = new Mesh(`ground:distant:${c0},${r0}`, scene)
      vd.applyToMesh(m)
      m.geometry?.clearCachedData()
      m.material = mat
      m.renderingGroupId = GROUP.base
      m.isPickable = false
    }
  }
  plog('distantGround cells', cells)
  /*
   * And a skirt beyond the grid's edge: 3 km out, flat at the edge's own height. The terrain stops where the
   * bake stopped sampling it, and where the edge is on a hill (Belleville to the north, the Montagne
   * Sainte-Geneviève to the south) the ground ended as a green slab against the sky, seen down every street
   * that points that way (user report). Carried out level, it runs on into the haze.
   */
  const far = 3000
  const x1 = t.x0 + (t.cols - 1) * t.step
  const z1 = t.z0 + (t.rows - 1) * t.step
  const hAt = (c: number, r: number): number => t.heights[r * t.cols + c]
  const skirt = (a: [number, number, number], b: [number, number, number], ox: number, oz: number): void => {
    out.quad([a, b, [b[0] + ox, b[1], b[2] + oz], [a[0] + ox, a[1], a[2] + oz]], [0, 1, 0],
      [[0, 0], [step, 0], [step, far], [0, far]], [0.5, 0.5, 0.5], 0)
  }
  for (let c = 0; c + 1 < t.cols; c++) {
    const xa = t.x0 + c * t.step
    const xb = xa + t.step
    skirt([xa, hAt(c, 0), t.z0], [xb, hAt(c + 1, 0), t.z0], 0, -far)
    skirt([xa, hAt(c, t.rows - 1), z1], [xb, hAt(c + 1, t.rows - 1), z1], 0, far)
  }
  for (let r = 0; r + 1 < t.rows; r++) {
    const za = t.z0 + r * t.step
    const zb = za + t.step
    skirt([t.x0, hAt(0, r), za], [t.x0, hAt(0, r + 1), zb], -far, 0)
    skirt([x1, hAt(t.cols - 1, r), za], [x1, hAt(t.cols - 1, r + 1), zb], far, 0)
  }
  // the four corners
  for (const [cx, cz, c, r, sx, sz] of [[t.x0, t.z0, 0, 0, -1, -1], [x1, t.z0, t.cols - 1, 0, 1, -1],
    [t.x0, z1, 0, t.rows - 1, -1, 1], [x1, z1, t.cols - 1, t.rows - 1, 1, 1]] as const) {
    const h = hAt(c, r)
    out.quad([[cx, h, cz], [cx + sx * far, h, cz], [cx + sx * far, h, cz + sz * far], [cx, h, cz + sz * far]], [0, 1, 0],
      [[0, 0], [far, 0], [far, far], [0, far]], [0.5, 0.5, 0.5], 0)
  }
  void terrain
  const m = new Mesh('ground:distant:skirt', scene)
  out.toVertexData().applyToMesh(m)
  m.geometry?.clearCachedData()
  m.material = mat
  m.renderingGroupId = GROUP.base
  m.isPickable = false
  m.alwaysSelectAsActiveMesh = true
  return m
}

/**
 * The ground again, as DEPTH ONLY, drawn first among the buildings.
 *
 * The ground is painted in ordered layers and the depth buffer is cleared before the buildings draw —
 * which is what ends the z-fighting, and also means nothing solid can ever be hidden BY the ground. On a
 * flat city that never shows. With real terrain it does: a building beyond the crest of a hill, the lock
 * house down in the Bassin de l'Arsenal below the quay, a tree on the far side of a rise — each drew on top
 * of the ground that stands in front of it.
 *
 * So the terrain is drawn once more into the depth buffer, and no colour, at the start of the buildings'
 * group. It is sunk 0.6 m below the real surface, so it never clips anything standing ON the ground — a
 * kerb, a foot, a car's wheel — but it still hides whatever is behind a rise or below the lip of a quay.
 */
/** the occluder's chunks, rebuilt from the fine ground as tiles bring it and back to coarse as they drop it */
export interface GroundOccluder {
  /** a tile's fine ground came or went: its chunk is rebuilt */
  mark(tx: number, tz: number): void
  /** rebuild what was marked, for at most `ms` (at least one chunk) */
  update(ms: number): void
}

function groundOccluder(scene: Scene, pkg: CityPackage, drop = 0, fine?: Terrain): GroundOccluder | null {
  const t = groundGrid(pkg.terrain)
  if (!t) return null
  /*
   * Over water the occluder goes down to just under the river's surface (its lowest bank less the region's
   * drop, as the water is drawn), and nowhere else. It used to sink ten metres at every grid point within a
   * cell of any water — a 20 m band all along the Seine where nothing was hidden, so buildings down on the
   * quay drew over the slope in front of them ("floating" buildings) and the river showed through paving
   * (user reports). Cells that straddle a bank are subdivided to 2 m, so the step at the bank is sharp.
   */
  const water = wholeWater(pkg).map((a) => {
    const ring = unpackPoints(a.ring)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    // the islands are holes in the river: land, not water (the Île de la Cité counted as river without them)
    return { ring, holes: (a.holes ?? []).map(unpackPoints), x0, x1, z0, z1, level: 0 }
  })
  const terrain = new Terrain(t)
  // one level per river, as the bake gave its pieces (city/package.ts waterLevels)
  const levels = waterLevels(wholeWater(pkg), (x, z) => terrain.heightAt(x, z), drop)
  water.forEach((w, k) => { w.level = levels[k] })
  // the LOWEST level of every body at a point: OSM maps the Seine twice over in places (a riverbank and a
  // natural=water polygon, with different lowest banks), and taking the first put the occluder above the lower
  // water along their boundary — shards of ground across the river (BUGS.md #36)
  const wetAt = (x: number, z: number): number | null => {
    const here = wetOnly(x, z)
    if (here !== null) return here
    // a thin dry seam between two water polygons that do not quite meet is river, not a bank: water on two
    // opposite sides within 5 m (BUGS.md #36 — the occluder rose along the seam and cut shards out of the Seine)
    for (const [dx, dz] of [[5, 0], [0, 5], [3.5, 3.5], [3.5, -3.5]]) {
      const a = wetOnly(x + dx, z + dz)
      const b = wetOnly(x - dx, z - dz)
      if (a !== null && b !== null) return Math.min(a, b)
    }
    return null
  }
  /*
   * BUGS.md #179: the same lookup, indexed rather than linear (render/watermask.ts). This used to walk every
   * one of the 49 bodies' rings point by point, and San Francisco's bay ring is 2 648 points with a bounding
   * box over the whole city, so nothing rejected it — 4 million probes x ~2 700 edge tests, and this loop was
   * about two minutes of the cold load. The index is EXACT (a +x ray only meets edges straddling the query's
   * z, and a 200 m broad phase answers points away from water outright), so the geometry below is unchanged:
   * measured over all 578 391 cells, 4 005 327 probes, zero differing answers, 81x faster.
   */
  const wetOnly = waterLookup(water)
  /*
   * The ground it stands for (BUGS.md #240). Built first from the coarse 20 m grid, and that was all it ever was —
   * but near the rider the ground DRAWN is each tile's fine block (4 m in the zones), and on Marin's and Yerba
   * Buena's steep hills the two part by metres: within 200 m of the owner's reports the fine ground stood 3.8 m
   * above the coarse grid at a crest (so the occluder, 0.6 m under the coarse, let the road and the cars behind
   * the crest show through the hill) and 5.2 m below it in a hollow (where it hid what should show). A chunk
   * holding tiles with fine ground is rebuilt from it, at its resolution, as the tiles arrive; and from the
   * coarse grid again when they go.
   */
  let heightOf = (x: number, z: number): number => terrain.heightAt(x, z)
  const occ = (x: number, z: number, lv: number | null): number => {
    const g = heightOf(x, z) - 0.6
    return lv === null ? g : Math.min(g, lv - 0.4)
  }
  /*
   * In chunks of 800 m, so what is off screen is culled (PARIS_EXPAND §6 item 7: the whole grid drawn three
   * times was the biggest single cost in the frame, 4.8 million triangles at the Concorde), and only over the
   * ground that has something standing on it (see `contentBounds`: the box and margin, unioned with the
   * content's own bbox, because in San Francisco the bake fills a different rectangle from the ride box).
   */
  const CHUNK = 800
  const box = contentBounds(pkg)
  const margin = 0
  const mat = new StandardMaterial('occluder', scene)
  mat.disableColorWrite = true
  mat.disableLighting = true
  mat.backFaceCulling = false
  /*
   * Positions and indices ONLY, built and uploaded one chunk at a time (BUGS.md #242, the iPhone's memory).
   *
   * It draws depth and no colour, unlit, so the normals, uvs and colours a `MeshBuilder` carries were three
   * quarters of its buffers for nothing — 326 MB of San Francisco's 1.3 GB of vertex buffers. And every chunk's
   * builder was open at once as JS number arrays (the grid is walked row by row, which touches every chunk
   * across), the largest part of the 730 MB the heap grew by while the City was built. The corners of plain
   * cells are shared (a corner's height depends on the corner alone: a cell is all wet or all dry, so a wet
   * corner is never in a dry cell); a bank's 2 m lattice keeps its own. Same cells, same heights, same
   * winding as before: the SHAPE is #169's and #240's to change, not this.
   */
  let built = 0
  let shared = 0
  const keys: [number, number][] = []
  {
    const seen = new Set<string>()
    for (let r = 0; r + 1 < t.rows; r++) {
      const z = t.z0 + r * t.step
      if (box && (z < box.z0 - margin || z > box.z1 + margin)) continue
      for (let c = 0; c + 1 < t.cols; c++) {
        const x = t.x0 + c * t.step
        if (box && (x < box.x0 - margin || x > box.x1 + margin)) continue
        const kx = Math.floor(x / CHUNK)
        const kz = Math.floor(z / CHUNK)
        const k = `${kx},${kz}`
        if (!seen.has(k)) { seen.add(k); keys.push([kx, kz]) }
      }
    }
  }
  let pos = new Float32Array(1 << 16)
  let idx = new Uint32Array(1 << 16)
  let np = 0
  let ni = 0
  const vert = (q: [number, number, number]): number => {
    if (np + 3 > pos.length) { const g = new Float32Array(pos.length * 2); g.set(pos); pos = g }
    pos[np] = q[0]; pos[np + 1] = q[1]; pos[np + 2] = q[2]
    np += 3
    return np / 3 - 1
  }
  // MeshBuilder.quad's winding for a quad facing +y
  const quad = (p: [number, number, number][], v: number[]): void => {
    if (ni + 6 > idx.length) { const g = new Uint32Array(idx.length * 2); g.set(idx); idx = g }
    const e1x = p[1][0] - p[0][0], e1z = p[1][2] - p[0][2]
    const e2x = p[2][0] - p[0][0], e2z = p[2][2] - p[0][2]
    const facing = e1z * e2x - e1x * e2z
    const o = facing > 0 ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3]
    for (const k of o) idx[ni++] = v[k]
  }
  const meshes = new Map<string, Mesh[]>()
  const build = (kx: number, kz: number, useFine: boolean): void => {
    const ck = `${kx},${kz}`
    for (const m of meshes.get(ck) ?? []) m.dispose()
    meshes.delete(ck)
    heightOf = useFine && fine ? (x, z) => fine.rawHeightAt(x, z) : (x, z) => terrain.heightAt(x, z)
    np = 0
    ni = 0
    // this chunk's cells: the same `floor(x / CHUNK)` test as ever, over a window a cell wider than the chunk
    const c0 = Math.max(0, Math.floor((kx * CHUNK - t.x0) / t.step) - 1)
    const c1 = Math.min(t.cols - 2, Math.ceil(((kx + 1) * CHUNK - t.x0) / t.step) + 1)
    const r0 = Math.max(0, Math.floor((kz * CHUNK - t.z0) / t.step) - 1)
    const r1 = Math.min(t.rows - 2, Math.ceil(((kz + 1) * CHUNK - t.z0) / t.step) + 1)
    const W = c1 - c0 + 2
    const corner = new Int32Array(W * (r1 - r0 + 2)).fill(-1)
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const x = t.x0 + c * t.step
        const z = t.z0 + r * t.step
        if (box && (x < box.x0 - margin || x > box.x1 + margin || z < box.z0 - margin || z > box.z1 + margin)) continue
        if (Math.floor(x / CHUNK) !== kx || Math.floor(z / CHUNK) !== kz) continue
        // does the cell straddle a bank? sample its corners and centre
        const probes = [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]].map(([u, v]) => wetAt(x + u * t.step, z + v * t.step))
        const allDry = probes.every((p) => p === null)
        const allWet = probes.every((p) => p !== null)
        // a tile with fine ground: the cell at the fine ground's own resolution, its lattice shared within it
        const fs = useFine && fine ? fine.stepIn(tileKey(Math.floor((x + t.step / 2) / TILE), Math.floor((z + t.step / 2) / TILE))) : null
        if ((allDry || allWet) && fs !== null && fs < t.step) {
          const n = Math.max(1, Math.round(t.step / fs))
          const sub = t.step / n
          const lat = new Int32Array((n + 1) * (n + 1)).fill(-1)
          const pt = new Array<[number, number, number] | null>((n + 1) * (n + 1)).fill(null)
          const get = (i: number, j: number): [number, number, number] => {
            const k = j * (n + 1) + i
            if (pt[k]) return pt[k]!
            const px = x + i * sub
            const pz = z + j * sub
            return (pt[k] = [px, occ(px, pz, allWet ? wetAt(px, pz) : null), pz])
          }
          const id = (i: number, j: number): number => {
            const k = j * (n + 1) + i
            if (lat[k] < 0) lat[k] = vert(get(i, j))
            return lat[k]
          }
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            quad([get(i, j), get(i + 1, j), get(i + 1, j + 1), get(i, j + 1)], [id(i, j), id(i + 1, j), id(i + 1, j + 1), id(i, j + 1)])
            built++
          }
          continue
        }
        if (allDry || allWet) {
          const h = (u: number, v: number): [number, number, number] => {
            const px = x + u * t.step
            const pz = z + v * t.step
            return [px, occ(px, pz, allWet ? wetAt(px, pz) : null), pz]
          }
          const p = [h(0, 0), h(1, 0), h(1, 1), h(0, 1)]
          const at = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, v], i) => {
            const k = (r - r0 + v) * W + (c - c0 + u)
            if (corner[k] < 0) corner[k] = vert(p[i])
            else shared++
            return corner[k]
          })
          quad(p, at)
          built++
          continue
        }
        /*
         * A bank: a 2 m lattice over the cell (and one step round it), wet flags dilated by one step so the
         * occluder is already down at the river's level a couple of metres before the bank. Otherwise the
         * cells sloping from land height down to the water sliced the quay wall into a sawtooth.
         */
        const n = Math.max(1, Math.round(t.step / 2))
        const sub = t.step / n
        const L = n + 3
        const lvl: (number | null)[] = []
        for (let j = -1; j <= n + 1; j++) for (let i = -1; i <= n + 1; i++) lvl.push(wetAt(x + i * sub, z + j * sub))
        const at = (i: number, j: number): number | null => lvl[(j + 1) * L + (i + 1)]
        const near = (i: number, j: number): number | null => {
          let best: number | null = null
          for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
            const v = at(i + di, j + dj)
            if (v !== null && (best === null || v < best)) best = v
          }
          return best
        }
        const v = (i: number, j: number): [number, number, number] => {
          const px = x + i * sub
          const pz = z + j * sub
          return [px, occ(px, pz, near(i, j)), pz]
        }
        // the lattice's points shared between its quads (a point's height is a function of the point alone)
        const lat = new Int32Array((n + 1) * (n + 1)).fill(-1)
        const pt = new Array<[number, number, number] | null>((n + 1) * (n + 1)).fill(null)
        const get = (i: number, j: number): [number, number, number] => pt[j * (n + 1) + i] ??= v(i, j)
        const id = (i: number, j: number): number => {
          const k = j * (n + 1) + i
          if (lat[k] < 0) lat[k] = vert(get(i, j))
          else shared++
          return lat[k]
        }
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          quad([get(i, j), get(i + 1, j), get(i + 1, j + 1), get(i, j + 1)], [id(i, j), id(i + 1, j), id(i + 1, j + 1), id(i, j + 1)])
          built++
        }
      }
    }
    if (ni === 0) return
    const vd = new VertexData()
    vd.positions = pos.slice(0, np)
    vd.indices = np / 3 > 65535 ? idx.slice(0, ni) : Uint16Array.from(idx.subarray(0, ni))
    /*
     * Twice: at the start of the water's group, so land in front of a river hides it (the water is otherwise
     * painted over everything in its layer, and showed through every rise between the eye and the Seine),
     * and at the start of the buildings' group, so land in front of a building hides that.
     */
    // …and at the start of the carriageway's group, so land in front of a road hides it: on Nob Hill the
    // streets beyond a crest were painted over the hill in front of them
    // one geometry for all three (clones share it): three copies of the whole grid held a quarter of a gigabyte
    // in central Paris, and none of it needs a CPU copy once uploaded
    let first: Mesh | null = null
    const made: Mesh[] = []
    meshes.set(ck, made)
    for (const group of [GROUP.areas, GROUP.road, GROUP.building]) {
      let m: Mesh
      if (!first) {
        m = new Mesh(`ground:occluder:${group}:${ck}`, scene)
        vd.applyToMesh(m)
        m.geometry?.clearCachedData()
        first = m
      } else {
        m = first.clone(`ground:occluder:${group}:${ck}`)
      }
      m.material = mat
      m.renderingGroupId = group
      /*
       * Tighter for the buildings: 0.15 m under the ground, not 0.6. A building on a slope stands sunk to the
       * lowest ground under it, so uphill its wall runs on below the pavement, and the 0.6 m band between the
       * sunk occluder and the surface showed through as a second, lower ground (BUGS.md #14). Roads keep the
       * wider margin: a draped street can dip a little under the grid between its points.
       */
      if (group === GROUP.building) m.position.y = 0.45
      m.isPickable = false
      // culled by the frustum now, chunk by chunk (it was one mesh, always drawn)
      // (without Babylon's cache of every vertex as a Vector3: 60k objects a fine chunk, three times over — BUGS.md #243)
      m.refreshBoundingInfo({ updatePositionsArray: false })
      made.push(m)
    }
  }
  for (const [kx, kz] of keys) build(kx, kz, false)
  plog('groundOccluder quads', built, 'chunks', keys.length, 'shared corners', shared)
  const known = new Set(keys.map(([kx, kz]) => `${kx},${kz}`))
  // chunk → when it was last marked: rebuilt once its tiles have stopped arriving (a chunk is sixteen tiles, and was
  // rebuilt for each of them)
  const dirty = new Map<string, number>()
  const SETTLE = 500
  // what the rebuilds cost (`window.__occluderStats()`): a chunk is rebuilt whole, inside a frame
  const stats = { builds: 0, ms: 0, worst: 0 }
  ;(window as unknown as Record<string, unknown>).__occluderStats = () => ({ ...stats, pending: dirty.size })
  /*
   * The order within each group, stated rather than left to creation order: the occluder first, since
   * everything after has to test against it; then, in the ground's group, parks BEFORE the pavement and
   * paths — a footpath through a park painted first was buried under the grass, and the rider rode
   * across what looked like an unbroken lawn.
   */
  // …except a street tunnel's mouths (render/tunnels.ts), BEFORE the occluder: a mouth is below the raw ground by
  // nature — the road runs down into it in a cut — and the occluder, drawn first, hid its floor and the foot of its
  // portal, so the street outside seemed to run on up into the arch. They are only shown near and in front.
  // (A PORTAL only while the camera is in front of its face, 2026-10-14 — render/tunnels.ts sets `metadata.first`: drawn
  // first from everywhere, the Stockton Tunnel's north portal showed through the hill, standing on surface Stockton's
  // crest 220 m away. From behind it goes after the occluder like any building, and the hill hides it.)
  /*
   * (The road MARKINGS used to go before the occluder too, within 250 m of the eye — owner, 2026-10-06, Market at 6th:
   * where the occluder's coarse triangles stood a few centimetres over the street the red lanes came out in torn
   * patches. But a whole tile's paint went first by its centre's distance, so crosswalks a few hundred metres off
   * showed through the hill in front of them — "crosswalks shining through steep hills", owner, 2026-10-14. They are
   * in the carriageway's own group now, where the occluder is 0.6 m down: see where the markings are built.)
   */
  const rank = (mesh: { name: string }): number =>
    mesh.name.startsWith('tunnel:entry') || (mesh.name.startsWith('tunnel:portals') && (mesh as { metadata?: { first?: boolean } }).metadata?.first) ? -1
      : mesh.name.startsWith('ground:occluder') ? 0 : mesh.name.startsWith('areas:') ? 1 : mesh.name.startsWith('corridor:') ? 2 : 3
  for (const group of [GROUP.areas, GROUP.road, GROUP.building]) {
    scene.setRenderingOrder(group, (a, b) => rank(a.getMesh()) - rank(b.getMesh()))
  }
  return {
    mark(tx, tz) {
      const k = `${Math.floor((tx * TILE) / CHUNK)},${Math.floor((tz * TILE) / CHUNK)}`
      if (known.has(k)) dirty.set(k, performance.now())
    },
    update(ms) {
      const t0 = performance.now()
      for (const [k, at] of dirty) {
        if (ms !== Infinity && t0 - at < SETTLE) continue
        dirty.delete(k)
        const [kx, kz] = k.split(',').map(Number)
        const t1 = performance.now()
        build(kx, kz, true)
        const took = performance.now() - t1
        stats.builds++
        stats.ms += took
        stats.worst = Math.max(stats.worst, took)
        if (performance.now() - t0 > ms) break
      }
    },
  }
}

/** what `Carriageways.noFurniture` kept off the road, for probes (`window.__furnitureSkipped`) */
const SKIPPED: { n: number; at: [number, number, string][] } = { n: 0, at: [] }
if (typeof window !== 'undefined') (window as unknown as Record<string, unknown>).__furnitureSkipped = SKIPPED
function skippedIf(why: string | null, x: number, z: number, what: string): boolean {
  if (why === null) return false
  SKIPPED.n++
  if (SKIPPED.at.length < 200) SKIPPED.at.push([Math.round(x), Math.round(z), `${what} (${why})`])
  return true
}

/** Even-odd point in polygon. */
function insideRing(ring: Point[], x: number, z: number): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) hit = !hit
  }
  return hit
}

/**
 * A LONG GROUND WAY IN PIECES (2026-10-05). Edges are bucketed by the tile their first point is in, and a tile draws
 * the edges bucketed in it, whole. Outside the detail box the bake does not split ways at their junctions, and 324 ways
 * run over 400 m — 33rd Avenue is one edge of 1.3 km — so the street under a rider was drawn only while the tile it
 * STARTED in was in view: five tiles on, the rider rode on grass (ride-graph samples, 33rd Avenue at Ortega). Cut into
 * pieces of about 120 m that share their cut points, each piece is drawn by its own tile; the joins are two-armed
 * nodes, so they get no junction hull and no cutback, and the pieces meet seamlessly.
 */
const PIECE = 120
function splitLong(e: PackedEdge): PackedEdge[] {
  const n = e.points.length / 2
  if (n < 3) return [e]
  let total = 0
  for (let i = 1; i < n; i++) total += Math.hypot(e.points[2 * i] - e.points[2 * i - 2], e.points[2 * i + 1] - e.points[2 * i - 1])
  if (total <= PIECE * 1.6) return [e]
  const out: PackedEdge[] = []
  let start = 0
  let acc = 0
  let k = 0
  const cut = (end: number, last: boolean): void => {
    out.push({
      ...e,
      points: e.points.slice(2 * start, 2 * end + 2),
      ...(e.heights ? { heights: e.heights.slice(start, end + 1) } : {}),
      a: start === 0 ? e.a : -(e.id * 1000 + k),
      b: last ? e.b : -(e.id * 1000 + k + 1),
    })
    k++
    start = end
    acc = 0
  }
  for (let i = 1; i < n; i++) {
    acc += Math.hypot(e.points[2 * i] - e.points[2 * i - 2], e.points[2 * i + 1] - e.points[2 * i - 1])
    if (acc >= PIECE && i < n - 1) cut(i, false)
  }
  cut(n - 1, true)
  return out
}

export class City {
  private readonly scene: Scene
  private readonly pkg: CityPackage
  private readonly atlas: AtlasManifest
  private readonly assets: string
  private readonly roadAssets: string
  readonly terrain: Terrain
  /** the depth occluder, rebuilt from the fine ground where tiles carry it (BUGS.md #240) */
  private occluder: GroundOccluder | null = null
  private readonly tiles = new Map<string, Tile>()
  /** what falls in each tile, worked out once at load */
  private readonly edgesIn = new Map<string, PackedEdge[]>()
  /** the shops and food places by tile, for where the parking meters go (#237) */
  private readonly shopsIn = new Map<string, { x: number; z: number }[]>()
  /** OSM's point furniture (Métro entrances, fountains, columns, kiosks, bike docks) by tile */
  private readonly pointsIn = new Map<string, PackedFurniture[]>()
  /** edges that are structures (bridges, ramps) rather than painted ground; see render/bridges.ts */
  readonly raisedIds = new Set<number>()
  /** raised footways that are a road bridge's own sidewalks, drawn by the road's deck — and (BUGS.md #136)
   *  raised ways a hand-modelled landmark draws itself */
  private readonly coveredDecks = new Set<number>()
  /**
   * The footprints landmarks declared they draw their own raised structure over (`coversRaised`,
   * render/landmarks.ts), in world metres with the band of heights each model occupies. BUGS.md #136.
   */
  private readonly pavedGrounds: { ring: { x: number; z: number }[]; x0: number; x1: number; z0: number; z1: number }[] = []
  private readonly coverAreas: { ring: { x: number; z: number }[]; y0: number; y1: number; x0: number; x1: number; z0: number; z1: number }[] = []
  /** baked bridge outlines (`t.bridges`) inside one of those footprints: bridge-structures.ts skips them */
  private readonly coveredOutlines = new Set<number>()
  /** the viaduct's stations in local metres (region `viaductStations`), set by the game */
  viaductStations: { x: number; z: number }[] = []
  /** each loaded tile's car-park stalls (city/parking.ts), laid out once on first asking */
  private readonly stallCache = new Map<string, Stall[]>()

  /** the stalls of the car parks (PackedArea `parking`) in one tile, avoiding the buildings standing on them */
  stallsIn(k: string): Stall[] {
    const got = this.stallCache.get(k)
    if (got) return got
    const lots = (this.areasIn.get(k) ?? []).filter((a) => a.parking)
    let stalls: Stall[] = []
    if (lots.length) {
      const [tx, tz] = k.split(',').map(Number)
      const near: number[][] = []
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (const b of this.buildingsIn.get(key(tx + dx, tz + dz)) ?? []) near.push(b.ring)
      // (and off the drawn carriageways: OSM maps a big lot's driving aisles as service ways, drawn as road)
      // (from this tile and its neighbours: the street beside a lot is often filed in the next tile — owner, 2026-10-17,
      //  "cars parked on side of street" on Columbus, where OSM's car park polygon runs out over the carriageway)
      const ways: { pts: { x: number; z: number }[]; half: number }[] = []
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (const e of this.edgesIn.get(key(tx + dx, tz + dz)) ?? []) if (!e.foot) ways.push({ pts: unpackPoints(e.points), half: e.width / 2 + Math.max(e.walk, 0.6) })
      const onWay = (x: number, z: number): boolean => ways.some((w) => {
        for (let i = 1; i < w.pts.length; i++) {
          const a = w.pts[i - 1], b = w.pts[i], dx = b.x - a.x, dz = b.z - a.z
          const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1e-9)))
          if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) < w.half) return true
        }
        return false
      })
      const blocked = (x: number, z: number): boolean => near.some((r) => pointInFlatRing(r, x, z)) || onWay(x, z)
      for (const a of lots) stalls = stalls.concat(layoutLot(unpackPoints(a.ring), blocked))
    }
    if (this.areasIn.has(k)) this.stallCache.set(k, stalls)
    return stalls
  }

  /** the occupied stalls within `r` metres: the parked cars render/street-fleet.ts draws */
  parkedNear(x: number, z: number, r: number): Stall[] {
    const out: Stall[] = []
    const [cx, cz] = tileOf(x, z)
    const n = Math.ceil(r / TILE)
    for (let dz = -n; dz <= n; dz++) for (let dx = -n; dx <= n; dx++) {
      const k = key(cx + dx, cz + dz)
      if (!this.areasIn.has(k)) continue
      for (const s of this.stallsIn(k)) if (s.occupied && Math.hypot(s.x - x, s.z - z) < r) out.push(s)
    }
    return out
  }

  /** the region's tourist strips in local metres (Region `touristStrips`), set by the game */
  touristRings: { x: number; z: number }[][] = []
  /** the region's lantern streets in local metres (Region `lanternStreets`), set by the game */
  /** the region's rainbow crossings in local metres (Region `rainbowCrossings`), set by the game */
  rainbowSpots: { x: number; z: number; radius: number }[] = []
  /** zones whose grass is dry (ZoneProps `dry`), set by the game */
  dryZones: { ring: number[]; bbox: [number, number, number, number] }[] = []
  /** the region's striped concrete streets in local metres (Region `stripedStreets`), set by the game */
  stripedStretches: { street: string; a: { x: number; z: number }; b: { x: number; z: number }; cobbles: number }[] = []
  lanternStretches: { street: string; a: { x: number; z: number }; b: { x: number; z: number }; colour: [number, number, number] }[] = []
  /** the bridges' outlines (render/bridge-structures.ts): a way on one draws only its running surfaces */
  private readonly outlines = new Map<number, { ring: { x: number; z: number }[]; x0: number; x1: number; z0: number; z1: number }>()
  private structured(e: PackedEdge): boolean {
    // (never a freeway: see bridge-structures.ts `FREEWAY`)
    if (FREEWAY_KINDS.has(e.kind)) return false
    const n = e.points.length / 2
    const k = Math.floor(n / 2)
    const x = n % 2 ? e.points[2 * k] : (e.points[2 * k - 2] + e.points[2 * k]) / 2
    const z = n % 2 ? e.points[2 * k + 1] : (e.points[2 * k - 1] + e.points[2 * k + 1]) / 2
    for (const o of this.outlines.values()) {
      if (x < o.x0 - 2 || x > o.x1 + 2 || z < o.z0 - 2 || z > o.z1 + 2) continue
      if (inOutline(o.ring, x, z, 1.5)) return true
    }
    return false
  }
  /** a road deck's pavement width, where it has been widened to take in its sidewalk footways */
  private readonly deckWalk = new Map<number, number>()
  /** elevated railways by tile */
  private readonly railsIn = new Map<string, PackedRail[]>()
  private readonly buildingsIn = new Map<string, PackedBuilding[]>()
  /** fitted sports courts by tile (BUGS.md #214, city/sports.ts) */
  private readonly courtsIn = new Map<string, PackedCourt[]>()
  /** the sports courts in the tiles that are in, within `r` of (x, z) — for the players on them (sim/players.ts) */
  courtsNear(x: number, z: number, r: number): PackedCourt[] {
    const out: PackedCourt[] = []
    for (const list of this.courtsIn.values()) for (const c of list) if (Math.abs(c.x - x) < r && Math.abs(c.z - z) < r) out.push(c)
    return out
  }
  private readonly region: Region
  /** the street clocks' hands (render/clocks.ts), set lazily: the material wants the scene */
  private clockHandsLazy?: Clocks
  private get clockHands(): Clocks {
    return this.clockHandsLazy ??= new Clocks(this.scene, cartoonMaterial(this.scene, 'cartoonStatic', false), this.region.timeZone)
  }
  private streets: StreetIndex | undefined
  /** the through streets only, where the shops have deep café awnings */
  private mainStreets: StreetIndex | undefined
  /** every carriageway, with the same generous reach, for the side-street awnings */
  private awningStreets: StreetIndex | undefined
  private readonly areasIn = new Map<string, (PackedArea & { level?: number })[]>()
  /** every node's position, and how far the streets are cut back from it */
  private readonly nodes = new Map<number, Junction>()

  /**
   * Per-tile layers (terraces, quays, signs…): each builds the meshes for one tile from that tile and its
   * neighbours, and they are disposed with the tile — so a subsystem costs only where the rider is.
   */
  private readonly layers: TileLayer[] = []
  /** where the layers' tile data comes from (the prepared city, cut into tiles) */
  source: TileSource | null = null
  private readonly nearCache = new Map<string, Near>()

  addLayer(layer: TileLayer): this { this.layers.push(layer); this.layerByName.set(layer.name, layer); return this }

  /** subsystems to leave out, for isolating a visual fault */
  private off: Set<string> = new Set()

  omit(what: Set<string>): this { this.off = what; return this }
  /** `?pick=1`: keep the tiles pickable and remember which building each triangle belongs to (debugging) */
  pickable = false

  /**
   * The city from its index: only what is global and small (terrain, region, ground, the whole water
   * bodies). Everything else arrives a tile at a time through `ingest` (PARIS_EXPAND §2): the game streams
   * tiles round the rider, and a tile is built once it and its eight neighbours are in.
   */
  constructor(scene: Scene, meta: CityMeta, atlas: AtlasManifest, assets: string) {
    const pkg = { ...meta, edges: [] as PackedEdge[], areas: [] as PackedArea[] } as unknown as CityPackage
    this.scene = scene
    this.pkg = pkg
    this.atlas = atlas
    this.assets = assets
    this.roadAssets = new URL('../roads/', assets).href
    /*
     * ASK FOR THE ASPHALT NOW, not when the rider is standing on it.
     *
     * Owner, 2026-10-20, on an iPhone: *"the road texture only loads when the user is on top of the road,
     * leading to a disconcerting shift... it's just surprising when it suddenly changes."* It was: a
     * surface's page is fetched by the first material that wants it, and that material is made when the
     * first tile containing that surface is built — which, for the road you are riding on, is the moment
     * you arrive. Over a phone's connection, behind every other asset in the queue, it lands late and the
     * road changes under you.
     *
     * Asked for here it goes into the queue with everything else and is almost always there before the
     * first tile needs it. Only the carriageway: every road is asphalt, it is one 512px page, and warming
     * all ten surfaces would be 13 MB spent on cobblestones and boards that most cities never show.
     */
    groundLayerMaterial(scene, this.roadAssets, 'asphalt', 'carriage')
    // …and the pavements' page, which is the grey the owner sees under a road that has not got its own yet
    groundLayerMaterial(scene, this.roadAssets, 'concrete', 'corridor')
    this.terrain = new Terrain(pkg.terrain, TILE)
    // the streets' own level inside their corridors (BUGS.md #38); the occluder keeps the raw ground (its own Terrain)
    this.terrain.grade = (x, z) => (this.off.has('grade') ? null : this.gradeAt(x, z))
    this.terrain.cut = (x, z) => (this.off.has('grade') ? null : this.grade.cutAt(x, z))
    this.region = region(pkg.region)
    const __tg0 = performance.now()
    distantGround(scene, this.terrain, pkg, this.roadAssets)
    distantSea(scene, pkg)
    plog('distantGround total', Math.round(performance.now() - __tg0))
    const __tg1 = performance.now()
    this.occluder = groundOccluder(scene, pkg, this.region.riverDrop ?? 0, this.terrain)
    // the fine ground as tiles bring it (and the coarse again as they drop it): the occluder follows (#240)
    // (`?without=fineocc` keeps it coarse, to see what the fine one changes)
    this.terrain.onTile = (tx, tz) => { if (!this.off.has('fineocc')) this.occluder?.mark(tx, tz) }
    plog('groundOccluder total', Math.round(performance.now() - __tg1))
  }

  /** which tiles' data are in */
  private readonly ingested = new Set<string>()
  private readonly edgeSeen = new Set<number>()
  private readonly railSeen = new Set<number>()
  /** junction node ids by the tile the node stands in */
  private readonly nodesIn = new Map<string, number[]>()
  /** OSM's signal nodes, on a 30 m grid */
  private readonly signalGrid = new Map<string, Point[]>()

  has(k: string): boolean { return this.ingested.has(k) }

  /**
   * Take one tile's data in. Edges come whole in every tile they touch and are filed once, by their first
   * point, as they always were; only what is on or above the ground (a tunnel, or a way mapped below grade —
   * the Loop's Pedway and Lower Wacker — painted at ground level shows through as a road where there is none,
   * and is populated with traffic and walkers, too, since `edgesNear` feeds both).
   */
  /**
   * The streets' corridors for the terrain's `grade` (BUGS.md #38): each segment of each street at grade, with
   * its heights at both ends and its half-width with the pavements, filed in 10 m cells.
   */
  private readonly grade = new StreetGrade()
  private fileGrade(e: PackedEdge): void { this.grade.add(e) }
  /** Dry land at (x, z)? Only when its tile is in and has no water piece there — an unloaded tile is not known dry. */
  dryAt(x: number, z: number): boolean {
    const here = this.areasIn.get(key(...tileOf(x, z)))
    if (!here) {
      /*
       * A tile not loaded yet: the package's WHOLE water decides (no breakwaters then, but the shore). It answered "not dry", and a marina
       * is built when its own tile arrives, often before the land beside it — the Marina East Harbor kept its boats
       * over the Marina Green, their hulls buried at the water's level under the lawn and the roads and only their
       * masts standing out of the ground (owner, 2026-10-06).
       */
      return !this.inWholeWater(x, z)
    }
    if (this.waterLevelAt(x, z) === null) return true
    // …or a land area drawn over the water: a breakwater, a quay, a park on the fill (the marina's mole at Fort Baker)
    for (const a of here) {
      if (a.kind === 'water') continue
      const r = a.ring
      let o = false
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
      }
      if (o) return true
    }
    return false
  }
  /** The surface of the water at (x, z), from the tile's water pieces (each carries its body's level), or null. */
  waterLevelAt(x: number, z: number): number | null {
    for (const a of this.areasIn.get(key(...tileOf(x, z))) ?? []) {
      if (a.kind !== 'water' || a.level === undefined) continue
      const r = a.ring
      let o = false
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
      }
      if (o) return a.level + 0.03
    }
    return null
  }

  /** The level of the street whose corridor (x, z) is in — the nearest, where two overlap — or null. */
  gradeAt(x: number, z: number): number | null { return this.grade.at(x, z) }
  /** the highest road surface drawn over a point (city/grade.ts `deckAt`): what a car stands on */
  deckAt(x: number, z: number): number | null { return this.grade.deckAt(x, z) }

  ingest(t: TileData): void {
    if (this.ingested.has(t.key)) return
    this.ingested.add(t.key)
    /*
     * The tile's own fine ground FIRST, before anything reads a height (BUGS.md #206c). `build()` is gated
     * on all nine neighbours having been ingested (`ready`), so by the time a tile's meshes are draped its
     * own block and its neighbours' are all registered — which is what keeps a building pad or a junction
     * apron that spills over the border off the coarse fallback and onto the same fine ground as the tile
     * it spills into.
     */
    {
      const [tx, tz] = t.key.split(',').map(Number)
      this.terrain.addTile(tx, tz, t.terrain)
    }
    for (const e of t.edges) if (onSurface(e)) this.fileGrade(e)
    for (const b of t.bridges ?? []) {
      if (this.outlines.has(b.id)) continue
      const ring = unpackPoints(b.ring)
      // (a bent outline gets no structure, so its ways keep their own decks: bridge-axis.ts `straightOutline`)
      if (!straightOutline(ring)) continue
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
      this.outlines.set(b.id, { ring, x0, x1, z0, z1 })
    }
    for (const p of t.pois ?? []) if (p.kind === 'shop' || p.kind === 'food') this.bucket(this.shopsIn, p.x, p.z, { x: p.x, z: p.z })
    for (const whole of t.edges) {
      if (!onSurface(whole) || this.edgeSeen.has(whole.id)) continue
      this.edgeSeen.add(whole.id)
      const raised = isRaised(whole, this.terrain)
      if (raised) this.raisedIds.add(whole.id)
      // (a long ground way in pieces, each drawn by the tile it starts in: see `splitLong`)
      for (const e of raised ? [whole] : splitLong(whole)) {
        this.bucket(this.edgesIn, e.points[0], e.points[1], e)
        // Where streets meet, and how far back each one has to be cut. The radius is set by the WIDEST
        // street at the junction: a narrow lane joining a boulevard is cut back to the boulevard's kerb line.
        const pts = unpackPoints(e.points)
        // which way the street leaves each of its ends, taken over its first few metres: a curving street
        // leaves the junction in one direction and arrives somewhere else entirely
        const ends = [
          { id: e.a, from: pts[0], to: pts[Math.min(1, pts.length - 1)] },
          { id: e.b, from: pts[pts.length - 1], to: pts[Math.max(0, pts.length - 2)] },
        ]
        for (const { id, from, to } of ends) {
          const dx = to.x - from.x
          const dz = to.z - from.z
          const len = Math.hypot(dx, dz) || 1
          const arm = { ux: dx / len, uz: dz / len, half: e.width / 2, foot: e.foot, surface: e.surface, raised, edgeId: e.id }
          const r = e.width / 2 + 0.7
          const got = this.nodes.get(id)
          if (got) {
            got.radius = Math.max(got.radius, r)
            got.walk = Math.max(got.walk, e.walk)
            // a junction is in the park only if every way meeting there is: a park road meeting a city street
            // at the Stanyan Street gate still needs the city's apron on the city's side
            got.park = got.park && !!e.park
            got.edges++
            got.arms.push(arm)
          } else {
            this.nodes.set(id, { at: from, radius: r, walk: e.walk, edges: 1, arms: [arm], park: !!e.park })
            this.bucket(this.nodesIn, from.x, from.z, id)
          }
        }
      }
    }
    this.buildingsIn.set(t.key, t.buildings)
    for (const f of t.furniture) {
      if (f.kind === 'signals') {
        const g = `${Math.floor(f.x / 30)},${Math.floor(f.z / 30)}`
        ;(this.signalGrid.get(g) ?? this.signalGrid.set(g, []).get(g)!).push(f)
      } else this.bucket(this.pointsIn, f.x, f.z, f)
    }
    /*
     * And a newsstand by every métro station, where the region has them: the green kiosque stands at the top
     * of the stairs in half of Paris's squares (user request). One per station — entrances within 60 m are
     * one station — seven metres along the pavement from the first entrance; none where a kiosk is near.
     */
    if (this.region.pointFurniture.kiosk === 'paris') {
      const [tx, tz] = t.key.split(',').map(Number)
      const stands: { x: number; z: number }[] = []
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        for (const f of this.pointsIn.get(key(tx + dx, tz + dz)) ?? []) if (f.kind === 'kiosk') stands.push(f)
      }
      for (const f of t.furniture) {
        if (f.kind !== 'metro') continue
        if (stands.some((q) => Math.hypot(q.x - f.x, q.z - f.z) < 60)) continue
        const h = this.streetBearing(f.x, f.z)
        const k = { x: f.x + Math.sin(h) * 7, z: f.z + Math.cos(h) * 7, kind: 'kiosk' as const }
        stands.push(k)
        this.bucket(this.pointsIn, k.x, k.z, k)
      }
    }
    for (const r of t.rails) {
      if (!r.bridge || !r.heights || this.railSeen.has(r.id)) continue
      this.railSeen.add(r.id)
      // in every tile it crosses: each draws its own spans of it (render/bridges.ts railDeck)
      for (const tk of tilesOfLine(r.points)) {
        const list = this.railsIn.get(tk)
        if (list) list.push(r)
        else this.railsIn.set(tk, [r])
      }
    }
    // the tile's own clipped pieces of each area (city/tiles.ts): water carries its whole body's level
    this.areasIn.set(t.key, t.areas.map((a) => ({ ...a, level: a.level })))
    // the sports courts whose CENTRE is in this tile (BUGS.md #214): fitted whole at bake, never clipped
    if (t.courts && t.courts.length > 0) this.courtsIn.set(t.key, t.courts)
  }

  /** Every tile round k has its data in (the ones the city has at all), so k can be built. */
  private ready(k: string): boolean {
    const [tx, tz] = k.split(',').map(Number)
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const n = key(tx + dx, tz + dz)
      if (!this.ingested.has(n) && (this.exists?.(n) ?? true)) return false
    }
    return true
  }

  /** which tiles the city has at all (the index's list); a missing neighbour past the edge is not waited for */
  exists: ((k: string) => boolean) | null = null

  /** every signal head drawn, by tile: which approach it controls and where its red, amber and green lamps are */
  readonly heads = new Map<string, SignalHead[]>()
  /** every junction the renderer has drawn lights at, for the traffic's signal timing (sim/signals.ts) */
  readonly lit = new Set<number>()
  private readonly litTiles = new Set<string>()
  /** has the renderer decided yet whether this junction has lights (its tile has been built)? */
  litDecided(nodeId: number): boolean {
    const n = this.nodes.get(nodeId)
    return !!n && this.litTiles.has(key(...tileOf(n.at.x, n.at.z)))
  }

  /** The junctions of tile k that carry lights: mapped signals within 15 m, or the rule (see below). */
  private lightsIn(k: string): Set<number> {
    const drive = (n: Junction): number => n.arms.filter((a) => !a.foot && a.half >= 3).length
    const [tx, tz] = k.split(',').map(Number)
    const around: [number, Junction][] = []
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      for (const id of this.nodesIn.get(key(tx + dx, tz + dz)) ?? []) around.push([id, this.nodes.get(id)!])
    }
    const signalled = (n: Junction): boolean => {
      if (n.arms.filter((a) => !a.foot).length < 2) return false
      const gx = Math.floor(n.at.x / 30)
      const gz = Math.floor(n.at.z / 30)
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        if ((this.signalGrid.get(`${gx + dx},${gz + dz}`) ?? []).some((q) => Math.hypot(q.x - n.at.x, q.z - n.at.z) < 15)) return true
      }
      return false
    }
    const big = around.filter(([, n]) => drive(n) >= 3)
    const lit: [number, Junction][] = []
    for (const [id, n] of around) {
      const d = drive(n)
      const byRule = d >= 3 && n.walk >= 1.2
      if (!byRule && !signalled(n)) continue
      if (d < 3 && big.some(([, b]) => Math.hypot(b.at.x - n.at.x, b.at.z - n.at.z) < 25)) continue
      if (d < 2) continue
      /*
       * NO TRAFFIC LIGHTS IN THE PARK, and this is a THIRD path — the one the furniture rule and the sign
       * rule both miss. The owner, 2026-09-25: *"it has parking meters and traffic lights everywhere, which
       * don't exist in GGP."* A signal is not drawn from the furniture bucket like a post box; it is drawn
       * per ARM at a junction, from `pads`, so suppressing `signals` in the tile's furniture never touched
       * it. (The `byRule` half is already dead in a park, because the rule wants a pavement and the park has
       * none — what survives is the mapped `highway=traffic_signals` node, and GGP has plenty of those.)
       *
       * The exception is real and is the same one the widths use: where a classified THROUGH-route crosses
       * the park — Crossover Drive, the Great Highway — the lights genuinely exist and the junction is a
       * proper signalled crossroads. A park lane is capped at 6.5 m so its widest arm is 3.25 m of
       * half-width; a through-route keeps its own 13-14 m. Five metres of half-width separates them
       * cleanly, and it separates them by what the road IS rather than by its name.
       */
      if (n.park && !n.arms.some((a) => !a.foot && a.half >= 5)) continue
      lit.push([id, n])
    }
    const out = new Set<number>()
    const mine = new Set(this.nodesIn.get(k) ?? [])
    for (const [id, n] of lit) {
      if (!mine.has(id)) continue
      // of lit junctions within 18 m the one with more roads wins; a tie goes to the lower id
      const beaten = lit.some(([other, o]) => other !== id && Math.hypot(o.at.x - n.at.x, o.at.z - n.at.z) < 18
        && (drive(o) > drive(n) || (drive(o) === drive(n) && other < id)))
      if (!beaten) out.add(id)
    }
    return out
  }

  /**
   * A bridge's sidewalks, mapped as their own footway bridges beside the road bridge (the Pont Marie has
   * two): the road deck's pavements already are them. Drawn separately, each got its own slab and parapets
   * and the bridge came out as three bridges side by side. A named footbridge in its own design (bridges.ts
   * BRIDGE_STYLES) takes in the unnamed footways OSM maps along it, as a road deck takes its sidewalks — else
   * they drew the generic piers over its arch ribs. Worked out over the tile and its neighbours.
   */
  /**
   * A hand-modelled structure claims the OSM ways under it (BUGS.md #136).
   *
   * `sf/yerba-buena.ts` builds both Howard Street skybridges; OSM has them as way/940154716 and
   * way/1116462961, and every raised ride-graph edge gets a deck here and generic piers in bridges.ts — so
   * each bridge rendered twice, and the duplicate's piers were the dark column under the glazed one. A way
   * id cannot be matched (`PackedEdge` carries none: the bake discards it), so the match is GEOMETRIC: the
   * edge's midpoint inside the declared footprint, at a height inside the model's own band.
   *
   * ORDER. Landmarks and tiles arrive in either order, and both are handled, so neither can be wrong:
   *   - tile first: this scans every edge already filed, and DROPS any built tile that drew one of them, so
   *     `update()` builds it again without the duplicate. Synchronous, so a shot tool waiting on `idle`
   *     cannot catch the intermediate state.
   *   - landmark first: `coverEdges()` runs at every tile build against the areas standing then.
   * The two are the same test; only when it runs differs.
   */
  /**
   * Street-level paving a landmark asks for (MeshBuilder.grounds): drawn with the tile's areas, over them, draped like
   * them. Any tile it reaches that is already built is built again.
   */
  paveGround(ring: { x: number; z: number }[]): void {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    this.pavedGrounds.push({ ring, x0, x1, z0, z1 })
    for (let tz = Math.floor(z0 / TILE); tz <= Math.floor(z1 / TILE); tz++) {
      for (let tx = Math.floor(x0 / TILE); tx <= Math.floor(x1 / TILE); tx++) this.rebuild(key(tx, tz))
    }
  }

  coverRaised(c: { ring: { x: number; z: number }[]; y0: number; y1: number }): void {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of c.ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    const a = { ...c, x0, x1, z0, z1 }
    this.coverAreas.push(a)
    const stale = new Set<string>()
    for (const [k, list] of this.edgesIn) {
      for (const e of list) if (this.takeEdge(a, e)) stale.add(k)
    }
    // …and the OSM `building:part` stacks of the structure itself, which are buildings, not raised edges
    for (const [k, list] of this.buildingsIn) {
      if (list.some((b) => this.coversBuilding(b))) stale.add(k)
    }
    // and the bake's own bridge polygon, which bridge-structures.ts builds whole from the tile its centre is
    // in: way/1116462960 is the open bridge's deck, and left alone it doubles the model on its own
    for (const [id, o] of this.outlines) {
      if (this.coveredOutlines.has(id)) continue
      let mx = 0, mz = 0
      for (const q of o.ring) { mx += q.x; mz += q.z }
      mx /= o.ring.length
      mz /= o.ring.length
      if (mx < a.x0 - 2 || mx > a.x1 + 2 || mz < a.z0 - 2 || mz > a.z1 + 2) continue
      if (!inOutline(a.ring, mx, mz, 2)) continue
      this.coveredOutlines.add(id)
      console.info(`cover: bridge outline ${id} is drawn by a hand-built landmark`)
      const [tx, tz] = tileOf(mx, mz)
      stale.add(key(tx, tz))
    }
    // …and the subway-entrance points it draws itself (the BART plazas)
    for (const [k, list] of this.pointsIn) if (list.some((f) => f.kind === 'metro' && this.inCover(f.x, f.z))) stale.add(k)
    for (const [k, list] of this.edgesIn) if (list.some((e) => e.kind === 'steps' && this.inCover(e.points[Math.floor(e.points.length / 4) * 2], e.points[Math.floor(e.points.length / 4) * 2 + 1]))) stale.add(k)
    let dropped = 0
    for (const k of stale) if (this.rebuild(k)) dropped++
    if (stale.size > 0) console.info(`cover: ${stale.size} tile(s) touched, ${dropped} already built and dropped to be built again`)
  }

  /**
   * Is this baked bridge outline drawn by a landmark instead? (render/bridge-structures.ts asks)
   *
   * Answered against the footprints standing NOW, not only against the ones `coverRaised` scanned: an
   * outline ingested after its landmark was placed — a tile that streams in later — is in neither set and
   * would otherwise be drawn. This is to outlines what `coverEdges` is to edges, so both are order-free.
   */
  coversOutline(id: number): boolean {
    if (this.coveredOutlines.has(id)) return true
    const o = this.outlines.get(id)
    if (!o || this.coverAreas.length === 0) return false
    let mx = 0, mz = 0
    for (const q of o.ring) { mx += q.x; mz += q.z }
    mx /= o.ring.length
    mz /= o.ring.length
    for (const a of this.coverAreas) {
      if (mx < a.x0 - 2 || mx > a.x1 + 2 || mz < a.z0 - 2 || mz > a.z1 + 2) continue
      if (!inOutline(a.ring, mx, mz, 2)) continue
      this.coveredOutlines.add(id)
      console.info(`cover: bridge outline ${id} is drawn by a hand-built landmark`)
      return true
    }
    return false
  }

  /**
   * Is this building part of a structure a landmark draws itself? (BUGS.md #211)
   *
   * The Golden Gate and Bay Bridge towers are mapped in OSM as stacks of `building:part=yes` steel pieces
   * — `description=leg_1`, `top_mast_3`, `bridge:support=pier` — each with its own `height` and
   * `min_height`. The classifier gives them a facade, so they stand over the water as the tallest
   * "buildings" in the city (BUGS.md #182 found 63 of them) AND the bridge's own model draws the towers a
   * second time. The owner, 2026-09-24: *"We don't really need anything from OSM except the footprint and
   * the path. The OSM having a somewhat okay representation of the structure is a pure accident, it's not
   * good enough to actually use."*
   *
   * So a building inside a `coversRaised` footprint goes — but only one that is STRUCTURE: stacked
   * (`minHeight > 0`, which every segment above the bottom of a stack is) or tall enough to be part of a
   * bridge rather than under it (> 45 m, #182's own threshold). Fort Point, the Roundhouse and the toll
   * plaza sit under the south approach at a dozen metres and are real buildings; they stay.
   */
  coversBuilding(b: Pick<PackedBuilding, 'ring' | 'height' | 'minHeight'>): boolean {
    if (this.coverAreas.length === 0) return false
    /*
     * Structure, by three signs, any one of which is enough: STACKED (`minHeight > 0` — every segment above
     * the bottom of a `building:part` stack), TALL (> 45 m, #182's own threshold, which no building under a
     * bridge reaches), or PAPER-THIN (a tagged height under half a metre: the south tower's pier and its
     * fender come through at 0.01 m, which is not a building at any threshold). A building with no tagged
     * height at all is NOT thin — it is an ordinary building the bake will give storeys to.
     */
    const tall = (b.height ?? 0) > 45
    const thin = b.height !== undefined && b.height < 0.5
    if ((b.minHeight ?? 0) <= 0 && !tall && !thin) return false
    const r = unpackPoints(b.ring)
    let mx = 0, mz = 0
    for (const q of r) { mx += q.x; mz += q.z }
    mx /= r.length
    mz /= r.length
    for (const a of this.coverAreas) {
      if (mx < a.x0 - 2 || mx > a.x1 + 2 || mz < a.z0 - 2 || mz > a.z1 + 2) continue
      if (inOutline(a.ring, mx, mz, 2)) return true
    }
    return false
  }

  /** one raised edge against one declared footprint; true when it was taken */
  /** Is this point on a roadway slab some bridge model DRAWS? (game.ts: `BridgeDecks.drawn`, src/city/bridge-decks.ts) */
  modelDeck: ((x: number, z: number) => boolean) | null = null

  /** The stretches of a way that lie outside every model's footprint, as ways of their own (for the generic deck). */
  private outsideCovers(e: PackedEdge): PackedEdge[] {
    if (!e.heights) return []
    const n = e.points.length / 2
    const inside = (i: number): boolean => {
      const x = e.points[i * 2]
      const z = e.points[i * 2 + 1]
      // (a bridge model's footprint is the box round its whole mesh — the Golden Gate's is 124 m wide, for the
      // fender round its south pier — so where the models' decks are known, those say what the model draws)
      if (this.modelDeck?.(x, z)) return true
      // …and any OTHER model's footprint counts by its outline: a cover area whose middle is on no declared deck is
      // not a bridge model (the Japanese Tea Garden's two garden bridges were drawn twice, a plank in the air, #238)
      return this.coverAreas.some((a) => x >= a.x0 - 2 && x <= a.x1 + 2 && z >= a.z0 - 2 && z <= a.z1 + 2
        && !(this.modelDeck && this.modelDeck((a.x0 + a.x1) / 2, (a.z0 + a.z1) / 2)) && inOutline(a.ring, x, z, 2))
    }
    const out: PackedEdge[] = []
    let from = -1
    for (let i = 0; i <= n; i++) {
      const outside = i < n && !inside(i)
      if (outside && from < 0) from = i
      if (!outside && from >= 0) {
        // (from the last point inside, so the stretch meets the model's deck; nothing for a scrap)
        const a = Math.max(0, from - 1)
        if (i - a >= 2) out.push({ ...e, points: e.points.slice(a * 2, i * 2), heights: e.heights.slice(a, i) })
        from = -1
      }
    }
    return out
  }

  private takeEdge(a: { ring: { x: number; z: number }[]; y0: number; y1: number; x0: number; x1: number; z0: number; z1: number }, e: PackedEdge): boolean {
    if (!this.raisedIds.has(e.id) || this.coveredDecks.has(e.id)) return false
    const mid = Math.floor(e.points.length / 4) * 2
    const mx = e.points[mid]
    const mz = e.points[mid + 1]
    if (mx < a.x0 - 2 || mx > a.x1 + 2 || mz < a.z0 - 2 || mz > a.z1 + 2) return false
    if (!inOutline(a.ring, mx, mz, 2)) return false
    // at a COMPARABLE height: a street-level way crossing under a skywalk is not the skywalk. 3 m of slack,
    // because the graph's bridge heights come from a rule in tools/bridges.ts, not from this structure.
    const my = e.heights?.[mid / 2]
    if (my !== undefined && (my < a.y0 - 3 || my > a.y1 + 3)) return false
    this.coveredDecks.add(e.id)
    console.info(`cover: raised edge ${e.id} is drawn by a hand-built landmark`)
    return true
  }

  /** inside any hand-built model's declared footprint (`coverRaised`) */
  /** OSM's point furniture within `r` metres (a kiosk, a column, a toilet): what the overhead line's poles keep clear of */
  furnitureNear(x: number, z: number, r: number): boolean {
    const tx = Math.floor(x / TILE), tz = Math.floor(z / TILE)
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      for (const f of this.pointsIn.get(key(tx + dx, tz + dz)) ?? []) if (Math.hypot(f.x - x, f.z - z) < r) return true
    }
    return false
  }

  inCover(x: number, z: number): boolean {
    return this.coverAreas.some((a) => x >= a.x0 - 1 && x <= a.x1 + 1 && z >= a.z0 - 1 && z <= a.z1 + 1 && inOutline(a.ring, x, z, 1))
  }

  /** every raised edge filed in this tile against the footprints declared so far (the landmark-first order) */
  private coverEdges(k: string): void {
    if (this.coverAreas.length === 0) return
    for (const e of this.edgesIn.get(k) ?? []) {
      for (const a of this.coverAreas) if (this.takeEdge(a, e)) break
    }
  }

  /** drop a built tile so `update()` builds it again — the same disposal as going out of range */
  private rebuild(k: string): boolean {
    const t = this.tiles.get(k)
    if (!t) return false
    for (const m of t.meshes) m.dispose()
    for (const [name, ms] of t.layers) { for (const m of ms) m.dispose(); this.layerByName.get(name)?.release?.(k) }
    this.tiles.delete(k)
    this.nearCache.delete(k)
    this.heads.delete(k)
    return true
  }

  private decksNear(k: string): void {
    const [tx, tz] = k.split(',').map(Number)
    const edges: PackedEdge[] = []
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) edges.push(...(this.edgesIn.get(key(tx + dx, tz + dz)) ?? []))
    const raisedRoads = edges.filter((e) => this.raisedIds.has(e.id) && (!e.foot || (e.name !== undefined && BRIDGE_STYLES[e.name] !== undefined)))
    for (const e of edges) {
      if (!e.foot || !this.raisedIds.has(e.id) || this.coveredDecks.has(e.id)) continue
      if (e.name && BRIDGE_STYLES[e.name]) continue
      const mid = Math.floor(e.points.length / 4) * 2
      const mx = e.points[mid]
      const mz = e.points[mid + 1]
      for (const r of raisedRoads) {
        let d = Infinity
        for (let i = 2; i < r.points.length; i += 2) {
          const ax = r.points[i - 2], az = r.points[i - 1], bx = r.points[i], bz = r.points[i + 1]
          const sx = bx - ax, sz = bz - az
          const l2 = sx * sx + sz * sz || 1
          const t = Math.max(0, Math.min(1, ((mx - ax) * sx + (mz - az) * sz) / l2))
          d = Math.min(d, Math.hypot(mx - ax - sx * t, mz - az - sz * t))
        }
        if (d >= r.width / 2 + r.walk + 8) continue
        // the road deck's pavement is widened out to take the footway in — the real deck is that wide
        this.coveredDecks.add(e.id)
        this.deckWalk.set(r.id, Math.max(this.deckWalk.get(r.id) ?? r.walk, d + e.width / 2 - r.width / 2))
        break
      }
    }
  }

  /**
   * How wide the carriageway a crossing spans actually is.
   *
   * A crossing way runs pavement to pavement, which is wider than the road by two pavements, and OSM does
   * not say which street it crosses. The answer is the widest carriageway whose centre line passes close to
   * the crossing's own midpoint — which is the street it is a crossing of.
   */
  private waterRings: { ring: Point[]; holes: Point[][]; x0: number; x1: number; z0: number; z1: number }[] | null = null

  /**
   * The coastline, indexed, for the beach bands (render/shore.ts, BUGS.md #200). Built ONCE for the city
   * rather than per tile: a tile's clipped piece of the sea carries invented edges along the tile border,
   * and sand beside one would paint itself wet. `undefined` = not built yet, `null` = this city has no sea.
   */
  private shore: ShoreIndex | null | undefined = undefined

  /**
   * BAND 1: the revetment, filed by tile (render/shore.ts, BUGS.md #200). A mapped `barrier=retaining_wall`
   * becomes a rip-rap band ONLY where it is a sea defence, because the same tag holds up a terraced garden
   * in Noe Valley and a grey rubble strip across somebody's front steps would be worse than nothing. TWO
   * gates, both from data and neither a list of beach names: within `REVETMENT_OF_SHORE` of the coastline
   * (measured: the Ocean Beach walls sit 80-210 m from it, because the beach is wide), and — at draw time —
   * in a tile that has SAND in it. A wall between a beach and the road is a revetment; a wall 200 m from
   * the water with no sand near it is a wall.
   */
  private revetmentIn: Map<string, Point[][]> | null = null

  private revetments(k: string): Point[][] {
    if (!this.revetmentIn) {
      const REVETMENT_OF_SHORE = 250
      this.revetmentIn = new Map()
      const shore = this.shoreIndex()
      for (const w of this.pkg.walls ?? []) {
        const pts = unpackPoints(w.points)
        if (pts.length < 2) continue
        if (!w.sea) {
          if (!shore) continue
          // the wall's own midpoint answers for it: these ways are tens of metres long, not kilometres
          const m = pts[Math.floor(pts.length / 2)]
          if (shoreDistance(shore, m.x, m.z) >= REVETMENT_OF_SHORE) continue
        }
        // filed by the tile each PIECE falls in, so a long wall is drawn in all of them and only once each
        let run: Point[] = [pts[0]]
        let at = key(...tileOf(pts[0].x, pts[0].z))
        const flush = (): void => {
          if (run.length > 1) {
            const list = this.revetmentIn!.get(at) ?? []
            list.push(run)
            this.revetmentIn!.set(at, list)
          }
        }
        for (let i = 1; i < pts.length; i++) {
          const t = key(...tileOf(pts[i].x, pts[i].z))
          run.push(pts[i])
          if (t !== at) { flush(); at = t; run = [pts[i]] }
        }
        flush()
      }
    }
    return this.revetmentIn.get(k) ?? []
  }

  private shoreIndex(): ShoreIndex | null {
    if (this.shore === undefined) {
      const sea = wholeWater(this.pkg).filter((a) => a.sea)
      const rings: { x: number; z: number }[][] = []
      for (const a of sea) {
        rings.push(unpackPoints(a.ring))
        for (const h of a.holes ?? []) rings.push(unpackPoints(h))
      }
      this.shore = rings.length > 0 ? buildShore(rings, this.pkg.box) : null
    }
    return this.shore
  }

  /**
   * Is (x, z) in the package's water, the whole bodies (an island's hole is land)? Without any tile: the edges of every
   * ring bucketed into 8 m bands of z, so a test counts the crossings of only the edges in its own band.
   */
  private waterBands: Map<number, number[]> | null = null
  inWholeWater(x: number, z: number): boolean {
    const BAND = 8
    if (!this.waterBands) {
      const bands = new Map<number, number[]>()
      for (const a of wholeWater(this.pkg)) {
        for (const ring of [unpackPoints(a.ring), ...(a.holes ?? []).map(unpackPoints)]) {
          for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const p = ring[j], q = ring[i]
            if (p.z === q.z) continue
            for (let r = Math.floor(Math.min(p.z, q.z) / BAND); r <= Math.floor(Math.max(p.z, q.z) / BAND); r++) {
              const list = bands.get(r) ?? []
              list.push(p.x, p.z, q.x, q.z)
              bands.set(r, list)
            }
          }
        }
      }
      this.waterBands = bands
    }
    const e = this.waterBands.get(Math.floor(z / BAND))
    if (!e) return false
    let o = false
    for (let k = 0; k < e.length; k += 4) {
      const ax = e[k], az = e[k + 1], bx = e[k + 2], bz = e[k + 3]
      if ((az > z) !== (bz > z) && x < ((bx - ax) * (z - az)) / (bz - az) + ax) o = !o
    }
    return o
  }

  /** Does the middle of this line lie on water (and not on an island in it)? */
  private overWater(pts: Point[]): boolean {
    if (!this.waterRings) {
      this.waterRings = wholeWater(this.pkg).map((a) => {
        const ring = unpackPoints(a.ring)
        let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
        for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
        return { ring, holes: (a.holes ?? []).map(unpackPoints), x0, x1, z0, z1 }
      })
    }
    const m = pointAlong(pts, lengthOf(pts) / 2)
    return this.waterRings.some((w) => m.x >= w.x0 && m.x <= w.x1 && m.z >= w.z0 && m.z <= w.z1
      && insideRing(w.ring, m.x, m.z) && !w.holes.some((h) => insideRing(h, m.x, m.z)))
  }

  private widestNear(pts: { x: number; z: number }[]): Carriageway {
    const mid = pts[Math.floor(pts.length / 2)]
    const [cx, cz] = tileOf(mid.x, mid.z)
    let best = 0
    let on: { a: Point; b: Point } | null = null
    /*
     * The street the crossing CROSSES first — its centre line meets the crossing's own line — and only failing that
     * the widest near it. A crossing split at the centre node of the street it crosses (the north side of Taylor at
     * California, owner 2026-10-07: "crosswalks … shining through") is two half-crossings, each a few metres from a
     * wider street; trimmed to the wider one's carriageway, each came out a single stray bar in the lane.
     */
    const meets = (a: Point, b: Point): boolean => {
      for (let j = 1; j < pts.length; j++) {
        const p = pts[j - 1], q = pts[j]
        if (pointToSegment(p, a, b) < 0.6 || pointToSegment(q, a, b) < 0.6 || pointToSegment(a, p, q) < 0.6 || pointToSegment(b, p, q) < 0.6) return true
        const d1 = (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x), d2 = (b.x - a.x) * (q.z - a.z) - (b.z - a.z) * (q.x - a.x)
        const d3 = (q.x - p.x) * (a.z - p.z) - (q.z - p.z) * (a.x - p.x), d4 = (q.x - p.x) * (b.z - p.z) - (q.z - p.z) * (b.x - p.x)
        if (d1 * d2 < 0 && d3 * d4 < 0) return true
      }
      return false
    }
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (const e of this.edgesIn.get(key(cx + dx, cz + dz)) ?? []) {
          if (e.foot) continue
          const line = unpackPoints(e.points)
          for (let i = 1; i < line.length; i++) {
            if (e.width > best && meets(line[i - 1], line[i])) { best = e.width; on = { a: line[i - 1], b: line[i] } }
          }
        }
      }
    }
    if (on) return { span: best + 0.4, on }
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (const e of this.edgesIn.get(key(cx + dx, cz + dz)) ?? []) {
          if (e.foot) continue
          const line = unpackPoints(e.points)
          for (let i = 1; i < line.length; i++) {
            if (pointToSegment(mid, line[i - 1], line[i]) < e.width * 0.75 + 2 && e.width > best) {
              best = e.width
              // the segment itself, not just its width: where the road's centre line RUNS is what decides
              // which part of the crossing is on tarmac
              on = { a: line[i - 1], b: line[i] }
            }
          }
        }
      }
    }
    // the carriageway itself, with a whisker for the kerb; no road nearby means a modest default
    return { span: best > 0 ? best + 0.4 : 5.5, on }
  }

  /**
   * How far the camera can back away from `x,z` along `dx,dz` before it would be inside a building.
   *
   * A chase camera set a fixed distance behind the rider spends half a narrow street inside the wall behind
   * it: OSM streets bend, buildings come right up to the kerb, and the camera swings wide of the rider
   * through every corner. Walking the ray back in short steps and stopping at the first building is cheap —
   * a bounding-box test rejects almost everything — and it is the difference between riding a street and
   * watching it through a wall.
   */
  clearBehind(x: number, z: number, dx: number, dz: number, want: number, margin = 0.9): number {
    const [cx, cz] = tileOf(x, z)
    const near: PackedBuilding[] = []
    for (let tz = -1; tz <= 1; tz++) {
      for (let tx = -1; tx <= 1; tx++) {
        const got = this.buildingsIn.get(key(cx + tx, cz + tz))
        if (got) near.push(...got)
      }
    }
    if (near.length === 0) return want

    const step = 0.6
    for (let d = step; d <= want; d += step) {
      const px = x + dx * d
      const pz = z + dz * d
      // down a passage the building round it is not in the way: the camera follows through the vault
      if (this.passageAt(px, pz) !== null) continue
      for (const b of near) {
        if (!withinRing(b.ring, px, pz, margin)) continue
        // back off to just before the wall, and never closer than a usable minimum
        return Math.max(2.2, d - step - 0.3)
      }
    }
    return want
  }

  /**
   * The height of the vault over (x, z) when it is in a passage through a building (render/passages.ts), or
   * null. The chase camera keeps under it: at its usual 3.5 m it sat in the barrel ceiling of the Passage
   * Walter-Benjamin, which filled the screen as a grey curve (BUGS.md #16).
   */
  passageAt(x: number, z: number): number | null {
    const [cx, cz] = tileOf(x, z)
    let top: number | null = null
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (const e of this.edgesIn.get(key(cx + dx, cz + dz)) ?? []) {
          if (!e.passage) continue
          let d = Infinity
          for (let i = 2; i < e.points.length; i += 2) {
            const ax = e.points[i - 2], az = e.points[i - 1], sx = e.points[i] - ax, sz = e.points[i + 1] - az
            const t = Math.max(0, Math.min(1, ((x - ax) * sx + (z - az) * sz) / (sx * sx + sz * sz || 1)))
            d = Math.min(d, Math.hypot(x - ax - sx * t, z - az - sz * t))
          }
          const probe = archSize(e, 99)
          if (d > probe.half) continue
          for (const b of this.buildingsIn.get(key(cx, cz)) ?? []) {
            if ((b.minHeight ?? 0) > 0.5 || !withinRing(b.ring, x, z, 0)) continue
            const h = archSize(e, b.height ?? (b.levels ? b.levels * 3.2 : 12)).top
            top = top === null ? h : Math.min(top, h)
          }
        }
      }
    }
    return top
  }

  /** How far a street is cut back at this node; 0 where it simply ends or bends. */
  private cutback(nodeId: number): number {
    const n = this.nodes.get(nodeId)
    return n && n.edges >= 3 ? n.radius : 0
  }

  private bucket<T>(into: Map<string, T[]>, x: number, z: number, item: T): void {
    const k = key(...tileOf(x, z))
    const list = into.get(k)
    if (list) list.push(item)
    else into.set(k, [item])
  }

  /** Build what is near `x,z` and drop what is not. Cheap when nothing has changed. */
  /**
   * Stream round (x, z). The first call builds everything in view at once (the load); after that tiles and
   * layers are built nearest first within a time budget each frame, so riding into a new area never stalls a
   * frame, and dropped with hysteresis (built within VIEW, kept to VIEW + 1) so a rider on a tile border does
   * not rebuild the same tile back and forth. `idle` says nothing is waiting — the shot tools wait for it.
   */
  update(x: number, z: number): void {
    this.clockHandsLazy?.update()
    const [cx, cz] = tileOf(x, z)
    const dist = (k: string): number => {
      const [tx, tz] = k.split(',').map(Number)
      return Math.max(Math.abs(tx - cx), Math.abs(tz - cz))
    }
    const first = this.tiles.size === 0
    const t0 = performance.now()
    this.occluder?.update(first ? Infinity : 3)
    const spent = (): boolean => !first && performance.now() - t0 > BUILD_MS
    const todo: string[] = []
    for (let dz = -VIEW; dz <= VIEW; dz++) {
      for (let dx = -VIEW; dx <= VIEW; dx++) {
        const k = key(cx + dx, cz + dz)
        if (!this.tiles.has(k)) todo.push(k)
      }
    }
    todo.sort((a, b) => dist(a) - dist(b))
    let waiting = 0
    for (const k of todo) {
      if (!this.ready(k)) { if (this.exists?.(k) ?? true) waiting++; continue }
      if (spent()) { waiting++; continue }
      this.build(k)
    }
    for (const [k, t] of this.tiles) {
      if (dist(k) > VIEW + 1) {
        for (const m of t.meshes) m.dispose()
        for (const [name, ms] of t.layers) { for (const m of ms) m.dispose(); this.layerByName.get(name)?.release?.(k) }
        this.tiles.delete(k)
        this.nearCache.delete(k)
        this.heads.delete(k)
      }
    }
    // the layers, each out to its own range
    const built = [...this.tiles.keys()].sort((a, b) => dist(a) - dist(b))
    for (const layer of this.layers) {
      if (this.off.has(layer.name)) continue
      const range = layer.range ?? VIEW
      for (const k of built) {
        const t = this.tiles.get(k)!
        const d = dist(k)
        const have = t.layers.get(layer.name)
        if (!have && d <= range) {
          if (spent()) { waiting++; continue }
          t.layers.set(layer.name, this.buildLayer(k, layer))
        } else if (have && d > range + 1) {
          for (const m of have) m.dispose()
          t.layers.delete(layer.name)
          layer.release?.(k)
        }
      }
    }
    // the mid ring: massing only, in the tiles beyond the fully built ones, out to MID
    if (this.midBuild && this.source) {
      const want = new Set<string>()
      for (let dz = -MID; dz <= MID; dz++) {
        for (let dx = -MID; dx <= MID; dx++) {
          const k = key(cx + dx, cz + dz)
          if (!this.tiles.has(k)) want.add(k)
        }
      }
      for (const [k, ms] of this.mid) {
        // dropped past MID + 1, or once the tile itself is built in full
        if (this.tiles.has(k) || dist(k) > MID + 1) { for (const m of ms) m.dispose(); this.mid.delete(k) }
      }
      for (const k of [...want].sort((a, b) => dist(a) - dist(b))) {
        if (this.mid.has(k)) continue
        const t = this.source.get(k)
        if (!t) continue
        if (spent()) { waiting++; continue }
        this.mid.set(k, this.midBuild(t))
      }
    }
    this.idle = waiting === 0
  }

  /** massing for a mid-ring tile (game.ts supplies it: every building, city and fringe, as plain walls) */
  midBuild: ((t: TileData) => Mesh[]) | null = null
  private readonly mid = new Map<string, Mesh[]>()

  /** nothing left to build round the last position given to `update` */
  idle = false
  private readonly layerByName = new Map<string, TileLayer>()

  private buildLayer(k: string, layer: TileLayer): Mesh[] {
    if (!this.source) return []
    const near = this.nearCache.get(k) ?? nearOf(this.source, k)
    if (!near) return []
    this.nearCache.set(k, near)
    const [tx, tz] = k.split(',').map(Number)
    const meshes = layer.build(near, { x0: tx * TILE, z0: tz * TILE, x1: (tx + 1) * TILE, z1: (tz + 1) * TILE })
    for (const m of meshes) {
      m.isPickable = this.pickable
      if (!this.pickable) m.geometry?.clearCachedData()
    }
    return meshes
  }

  private build(k: string): void {
    const meshes: Mesh[] = []
    this.coverEdges(k)
    this.decksNear(k)
    const lights = this.lightsIn(k)
    // published for the traffic (sim/signals.ts): what is drawn with lights is what is timed
    for (const id of lights) this.lit.add(id)
    this.litTiles.add(k)
    // the junctions to pave: a node where two or more streets meet on the ground (a node with only raised
    // edges is in mid-air, the middle of a bridge); bends get one too, closing the seam between segments
    const pads = (this.nodesIn.get(k) ?? []).filter((id) => {
      const n = this.nodes.get(id)!
      return n.edges >= 2 && n.arms.length >= 2 && n.arms.some((a) => !a.raised)
    })
    // the streets round this tile, for which way walls and shopfronts face
    const [ktx, ktz] = k.split(',').map(Number)
    const aroundEdges: PackedEdge[] = []
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) aroundEdges.push(...(this.edgesIn.get(key(ktx + dx, ktz + dz)) ?? []))
    this.streets = streetIndex(aroundEdges)
    this.awningStreets = undefined
    this.nearEdges = aroundEdges
    // raised edges — bridges and the ramps onto them — are structures, built below, not painted
    const groundEdges = (this.edgesIn.get(k) ?? []).filter((e) => !this.raisedIds.has(e.id))
    /*
     * …and the streets of this tile AND its neighbours, for every "not in a road" test the furniture makes (BUGS.md #320,
     * owner 2026-10-17: "fire extinguishers in road", "lamp post in street" — "actually at least 4"). Mission Street by
     * Yerba Buena is two one-way carriageways filed in two tiles; a hydrant set on one's inner kerb stood in the other's
     * lanes, which the tile's own list did not have.
     */
    const kerbEdges = aroundEdges.filter((e) => !this.raisedIds.has(e.id))
    const areas = new MeshBuilder()
    const sandOut = new MeshBuilder()
    const pagedOut = new Map<string, MeshBuilder>()
    const walks = new MeshBuilder()
    const markings = new MeshBuilder()
    const corridor = new MeshBuilder()
    const trails = new Map<string, MeshBuilder>()
    const shadows = new MeshBuilder()
    const roads = new Map<string, MeshBuilder>()
    const water = new MeshBuilder()

    // A base plane under the whole tile. Streets and parks only cover what OSM mapped; the courtyards and
    // block interiors between them are not mapped at all, and without this the city is a set of buildings
    // standing in mid-air with sky where the ground should be.
    const [tx, tz] = k.split(',').map(Number)
    const base = roads.get(this.pkg.ground) ?? new MeshBuilder()
    roads.set(this.pkg.ground, base)
    // uv here is metres, as everywhere in the road shader; a half-width of 0 means "no markings on this".
    // the near ground, at full resolution and draped; the distant mesh covers everything beyond
    // flat at 0: the road meshes are all draped below, the base with them — given its height here as well,
    // it stood at TWICE the ground's height (BUGS.md #4)
    const h = (_x: number, _z: number): number => 0
    const N = 4
    /*
     * …in finer cells where the ground under a 50 m cell is not a plane (Alcatraz, 2026-10-05): draped only at its
     * corners, the cell's chord stood 5 m over a cove in the island's cliffs, a lawn in the air with the rock hanging
     * over it. The base is the only ground drawn where no area covers it; flat cells keep one quad.
     */
    const raw = (x: number, z: number): number => this.terrain.rawHeightAt(x, z)
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const x0 = tx * TILE + (c * TILE) / N
        const z0 = tz * TILE + (r * TILE) / N
        const W = TILE / N
        const c00 = raw(x0, z0), c10 = raw(x0 + W, z0), c01 = raw(x0, z0 + W), c11 = raw(x0 + W, z0 + W)
        let err = 0
        for (const [u, v] of [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75], [0.5, 0], [0, 0.5], [1, 0.5], [0.5, 1]]) {
          const lin = c00 * (1 - u) * (1 - v) + c10 * u * (1 - v) + c01 * (1 - u) * v + c11 * u * v
          err = Math.max(err, Math.abs(raw(x0 + u * W, z0 + v * W) - lin))
        }
        const sub = err > 2.5 ? 8 : err > 0.8 ? 4 : 1
        const w = W / sub
        for (let j = 0; j < sub; j++) for (let i = 0; i < sub; i++) {
          const x = x0 + i * w
          const z = z0 + j * w
          base.quad(
            [[x, h(x, z), z], [x + w, h(x + w, z), z],
             [x + w, h(x + w, z + w), z + w], [x, h(x, z + w), z + w]],
            [0, 1, 0], [[x - x0, z - z0], [x - x0 + w, z - z0], [x - x0 + w, z - z0 + w], [x - x0, z - z0 + w]], [0.5, 0.5, 0.5], 0,
          )
        }
      }
    }

    // the paved squares first: the lawns and pools mapped inside them are painted over them
    // …and a square paved by hand last, over the park OSM spreads across it
    /*
     * Paved squares first, the lawns and pools mapped inside them over the top; then the BARE ground, which
     * is painted over the greens because it is the more specific statement about the same piece of land —
     * Ocean Beach is mapped as `natural=beach` inside the park polygon, so without this the park wins by
     * arriving first and the beach is a lawn again at the last moment (BUGS.md #200); then a square paved
     * by hand over the park OSM spreads across it, under what is mapped inside it.
     */
    const rank = (a: { kind: string; top?: boolean; beds?: boolean }): number =>
      // (planted beds over the parks they lie in — the Presidio's own park polygon covers the Tunnel Tops — and the lawns
      //  over the beds)
      // (a square paved by hand goes over the park, but under the lawns, beds and pitches mapped inside it — owner,
      //  2026-10-06: the bowling lawn at the east end of Embarcadero Plaza was brick)
      a.top ? 1.2 : a.kind === 'paved' || a.kind === 'lot' ? 0 : a.kind === 'sand' || a.kind === 'dirt' ? 2 : a.beds ? 1.5 : a.kind === 'grass' ? 1.6 : a.kind === 'pitch' ? 1.7 : 1
    const areasHere = this.areasIn.get(k) ?? []
    const ordered = [...areasHere].sort((p, q) => rank(p) - rank(q))
    /*
     * Shore vs. open water (BUGS.md #154, owner: "you can't go out on the water so much of it CAN be huge
     * triangles. but close to shore, it has to be small triangles"). A tile is "shore" — worth the cost of
     * fine subdivision — if there is anything in it a rider could be near: buildings, roads, or another kind
     * of area (park, paving) sharing the tile with the water. A tile that is pure water and nothing else is
     * open ocean/bay as far as this test is concerned, however big the polygon: nobody reaches it and there
     * is nothing there to occlude. This is a static, build-time classification, not a per-frame LOD.
     */
    const isShoreTile = (this.buildingsIn.get(k) ?? []).length > 0 || groundEdges.length > 0 ||
      areasHere.some((a) => a.kind !== 'water')
    const WATER_SHORE_MAX_EDGE = 16
    /*
     * Twice the ground grid's step, so a park surface can follow the terrain instead of chording across it,
     * and no finer: the drape cannot show detail the grid does not carry, and every halving quadruples the
     * triangles. Taken from the tile's own block, which is where the step now lives (city/terrain.ts).
     */
    const AREA_MAX_EDGE = Math.max(8, (this.terrain.stepIn(k) ?? 20) * 2)
    for (const a of ordered) {
      if (a.kind === 'water') {
        /*
         * Flat, at the level of its lowest bank. Draped like the ground, a river followed every bump in
         * the elevation data and came out as a rumpled sheet — water is the one surface in a city that is
         * certainly level. The level was taken from the whole ring when the area was cut into tiles, so a
         * river cut into many tiles is the same height in all of them.
         */
        capPolygonWithHoles(water, [unpackPoints(a.ring), ...(a.holes ?? []).map(unpackPoints)],
          0.03 + (a.level ?? 0), [0, 0, 0], 0, 2.4, isShoreTile ? WATER_SHORE_MAX_EDGE : undefined)
      }
      else {
        /*
         * Subdivided to about two grid cells (BUGS.md #206c). Earcut gives the MINIMAL triangulation, so a
         * park's piece of a tile was a handful of triangles up to 200 m on a side, draped only at their
         * corners. That was defensible while the ground grid was 20 m and could not represent a hill 30 m
         * across anyway — `subdivideLastTriangles`' own note that parks "do not need it" was written for
         * that world. With a 4 m grid it is the difference between having the fine terrain and being able
         * to SEE it: Golden Gate Park's hollows are tens of metres across, and a flat triangle over the
         * top of one hides exactly the thing this whole change is for.
         */
        /*
         * A BEACH IS BANDS (docs/PARKS.md, BUGS.md #200). Sand is capped FINELY — the wet band is about
         * nine metres wide and a vertex colour interpolated across an 8 m triangle would turn it into a
         * gradient across the whole beach — and then every vertex just laid down is retinted by its
         * distance from the coastline: wet at the surf, pale dry sand above the tide line, dune grass at
         * the landward edge. Nothing else about the polygon changes, which is the point: the shoreline's
         * apparent shape is drawn by the WET BAND, not by geometry, so it costs one pass over the colours.
         */
        const beach = a.kind === 'sand' ? this.shoreIndex() : null
        /*
         * SAND IN ITS OWN MESH, on the road shader's grainy sand page (owner, 2026-10-06: "better sand"). The ground
         * material's page drew sand as long pale stripes, like decking. The bands below still tint it vertex by vertex;
         * its uvs are metres, as the road shader wants.
         */
        // (a square in a material of its own — Pier 39's planks, the Wharf's cobbles — on the road shader's page for it, like sand)
        const into = a.kind === 'sand' ? sandOut : a.surface ? (pagedOut.get(a.surface) ?? pagedOut.set(a.surface, new MeshBuilder()).get(a.surface)!) : areas
        const base = into.positions.length / 3
        // (a square opening off a brick street is laid in its brick: PackedArea `brick`, tools/street-paint.ts)
        // (a park of planted beds is mulch, its lawns drawn over it: PackedArea `beds`, the Tunnel Tops)
        // (bare rock out in the sea — the stacks off Lands End, mapped as natural=bare_rock round their models — is wet
        //  dark rock at the waterline, not a raft of brown earth: views audit 2026-10-04)
        const seaLevel = (this.pkg as CityPackage & CityMeta).sea ?? this.pkg.seaLevel
        // (only a stack's outline — under 60 m across: Point Bonita's whole headland is mapped as bare rock on ground
        //  the bake has too low, #260, and came out a black slab)
        const wet = a.kind === 'dirt' && seaLevel !== null && seaLevel !== undefined && (() => {
          const r = unpackPoints(a.ring)
          const xs = r.map((p) => p.x), zs = r.map((p) => p.z)
          if (Math.max(...xs) - Math.min(...xs) > 60 || Math.max(...zs) - Math.min(...zs) > 60) return false
          const c = r.reduce((q, p) => ({ x: q.x + p.x / r.length, z: q.z + p.z / r.length }), { x: 0, z: 0 })
          return this.terrain.heightAt(c.x, c.z) <= seaLevel + 0.5
        })()
        const tint = a.surface ? SURFACE_ON_PAGE[a.surface] : a.kind === 'sand' ? SAND_ON_PAGE : a.brick && this.region.brickStreets ? this.region.brickStreets.colour : a.beds ? BEDS : wet ? WET_ROCK : AREA_TINT[a.kind]
        capPolygonWithHoles(into, [unpackPoints(a.ring), ...(a.holes ?? []).map(unpackPoints)],
          0.02, tint, 0, a.kind === 'sand' || a.surface ? 1 : 2.4, a.kind === 'sand' ? Math.min(AREA_MAX_EDGE, SAND_MAX_EDGE) : AREA_MAX_EDGE)
        /*
         * DRY GROUND (ZoneProps `dry`; owner, 2026-10-06: the Marin Headlands are "very dry and covered in low shrubs", and
         * a green lawn over them read as a golf course): grass, park and wood inside such a zone take the colours of
         * summer scrub — olive, sage and straw, mixed vertex by vertex on a slow noise so the hills are patched, not
         * one flat sheet.
         */
        if ((a.kind === 'grass' || a.kind === 'park' || a.kind === 'wood') && this.dryZones.length) {
          const n = into.positions.length / 3
          for (let v = base; v < n; v++) {
            const x = into.positions[v * 3], z = into.positions[v * 3 + 2]
            if (!this.dryZones.some((d) => x >= d.bbox[0] && x <= d.bbox[2] && z >= d.bbox[1] && z <= d.bbox[3] && pointInFlatRing(d.ring, x, z))) continue
            const t = 0.5 + 0.5 * Math.sin(x * 0.013 + Math.sin(z * 0.009) * 2.1) * Math.cos(z * 0.011 - x * 0.004)
            const c: [number, number, number] = t < 0.5
              ? [0.42 + 0.1 * t, 0.45 + 0.02 * t, 0.27 + 0.04 * t]     // olive scrub to sage
              : [0.47 + 0.16 * (t - 0.5), 0.46 + 0.06 * (t - 0.5), 0.29 + 0.02 * (t - 0.5)]  // to dry straw
            into.colors[v * 4] = c[0]; into.colors[v * 4 + 1] = c[1]; into.colors[v * 4 + 2] = c[2]
          }
        }
        if (beach) {
          const n = into.positions.length / 3
          for (let v = base; v < n; v++) {
            const x = into.positions[v * 3], z = into.positions[v * 3 + 2]
            const t = beachTint(SAND_ON_PAGE, shoreDistance(beach, x, z), x, z)
            into.colors[v * 4] = t[0]; into.colors[v * 4 + 1] = t[1]; into.colors[v * 4 + 2] = t[2]
          }
        }
      }
    }
    // the paving landmarks asked for (`paveGround`), clipped to this tile, over every area
    for (const g of this.pavedGrounds) {
      const bx0 = ktx * TILE, bz0 = ktz * TILE
      if (g.x1 < bx0 || g.x0 > bx0 + TILE || g.z1 < bz0 || g.z0 > bz0 + TILE) continue
      const piece = clipToBox(g.ring, bx0, bz0, bx0 + TILE, bz0 + TILE)
      if (piece.length >= 3) capPolygonWithHoles(areas, [piece], 0.035, AREA_TINT.paved, 0, 2.4, AREA_MAX_EDGE)
    }
    /*
     * BAND 1, over the areas: the rip-rap revetment along the mapped seawall (docs/PARKS.md). Drawn LAST of
     * the ground areas so it sits over the sand and the scrub it armours, and into the same builder so it is
     * draped with them. NOT scattered boulders — a revetment is a continuous armoured slope, and the
     * deferred rock system (docs/SCOPE-GOLDEN-GATE.md) is for natural outcrops, which is a different thing.
     */
    const armoured = areasHere.some((a) => a.kind === 'sand')
    for (const wall of armoured ? this.revetments(k) : []) {
      revetmentBand(wall, 0.025,
        (x, y, z, c) => {
          const i = areas.positions.length / 3
          areas.positions.push(x, y, z)
          areas.normals.push(0, 1, 0)
          areas.uvs.push(x / 2.4, z / 2.4)
          areas.colors.push(c[0], c[1], c[2], 0)
          return i
        },
        (a, b, c) => { areas.indices.push(a, b, c) })
    }

    /**
     * The ground, as **ordered layers** rather than as a boolean union.
     *
     * The union was the right idea and the wrong tool. Computing (roads ∪ junctions) and then
     * (corridor − road) gives exactly the right shapes, but a polygon clipper fed thousands of overlapping
     * quads built from messy OSM geometry fails on a tile in six — "unable to find segment in SweepLine
     * tree" — and a failed tile is a hole in the city with no road in it at all. Robustness matters more
     * here than exactness, because nobody can see the difference and everybody can see a missing street.
     *
     * So the same result is painted instead of computed:
     *
     *     group 1   the CORRIDOR: every street at its full building-to-building width, in pavement grey
     *     group 2   the CARRIAGEWAY: every street at its road width, over the top
     *     group 3   kerbs, markings, and everything else
     *
     * Babylon clears the depth buffer between rendering groups, so each layer simply covers the one below
     * it, and what is left showing of the corridor layer IS the pavement — the difference, without ever
     * computing one. Overlapping quads within a layer would z-fight, so those two materials test depth with
     * ALWAYS: within a layer the last quad drawn wins, which is exactly what a painter would do.
     *
     * Junctions are the convex hull of their street mouths, in both layers. That is what fills the wedges
     * between streets meeting at an angle — the gaps that showed up as grass islands in the middle of a
     * seven-way junction.
     */
    const brick = this.region.brickStreets
    // the painted transit busways of this tile, for `buswayBeside`
    const zebras: { x: number; z: number; a: { x: number; z: number }; b: { x: number; z: number } }[] = []
    const busways = groundEdges.filter((o) => o.kind === 'busway' && o.paint && o.paint & 1).map((o) => ({ name: o.name, pts: unpackPoints(o.points) }))
    /*
     * …nor a red band that lies on a WIDER painted carriageway of the same street (2026-10-15, owner: "z fighting in red
     * pavement on market street", at 3rd: OSM's one-way side carriageway runs 5 m from the centre one, its red band lay
     * on the centre one's, both at 5.8 cm, and the two fought in patches). The wider one's band is the one kept.
     */
    const reds = groundEdges.filter((o) => o.paint && o.paint & 1 && o.width >= 5 && !o.foot).map((o) => ({ id: o.id, name: o.name, width: o.width, pts: unpackPoints(o.points) }))
    const redUnderWider = (e: PackedEdge, pts: { x: number; z: number }[]): boolean => {
      const m = pts[Math.floor(pts.length / 2)]
      return reds.some((r) => {
        if (r.id === e.id || r.name !== e.name || r.width < e.width) return false
        if (r.width === e.width && r.id < e.id) return false
        for (let i = 1; i < r.pts.length; i++) {
          const a = r.pts[i - 1], b = r.pts[i], dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz || 1e-9
          const t = Math.max(0, Math.min(1, ((m.x - a.x) * dx + (m.z - a.z) * dz) / l2))
          if (Math.hypot(a.x + dx * t - m.x, a.z + dz * t - m.z) < r.width / 2) return true
        }
        return false
      })
    }
    const buswayBeside = (e: PackedEdge, pts: { x: number; z: number }[]): boolean => {
      if (busways.length === 0) return false
      const m = pts[Math.floor(pts.length / 2)]
      return busways.some((b) => b.name === e.name && b.pts.some((q) => Math.hypot(q.x - m.x, q.z - m.z) < e.width / 2 + 12))
    }
    for (const e of groundEdges) {
      const pts = unpackPoints(e.points)
      if (pts.length < 2) continue
      // A little wider than the corridor strictly is, so that two parallel ways — a service road beside a
      // boulevard, a slip road, a square drawn as three ways — have their pavements meet instead of leaving
      // a ribbon of bare ground between them. It is a painted layer, so the overlap costs nothing.
      // Generously wider than the corridor strictly is. Two streets meeting at a shallow angle leave a long
      // thin wedge of ground between them that no junction hull reaches, and a wedge of grass in the middle
      // of a square is far worse than pavement spilling a couple of metres into a courtyard. The layer is
      // painted, so the overlap costs nothing.
      // Wider than the corridor strictly is, so two parallel ways do not leave a ribbon of bare ground
      // between them — but only a little. At seven metres of slop every square in the city became an ocean
      // of pale concrete, which is what made the whole place look washed out and flat.
      /*
       * NOT IN A PARK (`e.park`, city/park-area.ts). The 4.5 m of slop above is a city fix — it keeps a
       * wedge of grass from showing between two ways that meet at a shallow angle — and in a park it is the
       * single most un-park-like thing in the frame: eleven metres of pale concrete beside a road that in
       * the reference photographs (`~/Downloads/ggp-rural-road.png`) has no kerb at all and gives way
       * straight from worn asphalt to a dirt-and-leaf shoulder. There is no wedge of grass to hide out here
       * because grass is what the park IS, so the layer has nothing to do and everything to spoil.
       */
      // (a FOOT way takes a metre of slop, not 4.5: the slop is for streets meeting at shallow angles, and on an open
      //  hillside outside any mapped park — Twin Peaks' slopes — each 3 m trail became a 7.5 m concrete stripe, 2026-10-04)
      if (!e.park) quadStrip(corridor, pts, e.width + 2 * e.walk + (e.foot ? 1 : 4.5), 0.15, PAVEMENT, (x, z) => this.terrain.heightAt(x, z))
      /*
       * …but a park's FOOT way is still drawn, at its own width and in its own surface (Golden Gate Park audit,
       * 2026-10-05). A foot way is only ever drawn in this layer, so taking the park's concrete out (#201) took every
       * trail with it — and the John F. Kennedy Promenade, Music Concourse Drive, Overlook Drive and 8th Avenue in the
       * park, `highway=pedestrian` roads 6.5–12 m wide, were lawn with zebra crossings painted on it, the rider riding
       * across the grass. Asphalt, dirt or gravel, no slop and no kerb: what the park's references show. Each surface
       * its own mesh in the corridor's group, so a drive that crosses a trail paints over it.
       */
      else if (e.foot && e.kind !== 'steps') {
        const page = TRAIL_PAGE[e.surface] ?? 'asphalt'
        const out = trails.get(page) ?? new MeshBuilder()
        trails.set(page, out)
        // (a footway or a path is drawn no wider than 2.2 m: the bake's 3 m default laid the Botanical Garden's web of
        //  paths as a maze of broad dark bands; a car-free road keeps its width)
        const w = e.kind === 'footway' || e.kind === 'path' ? Math.min(e.width, 2.2) : e.width
        // (and a path's asphalt sun-bleached paler than a drive's: the road page at full depth made the web of paths
        //  the darkest thing in the park)
        const tint: [number, number, number] = page === 'asphalt' && w < e.width + 0.01 && e.kind !== 'pedestrian' ? [0.68, 0.68, 0.66] : [0.5, 0.5, 0.5]
        quadStrip(out, pts, w, 0.15, tint, (x, z) => this.terrain.rawHeightAt(x, z))
      }
      // a brick street's pavements (San Francisco's Market Street), drawn over the concrete a hair higher so
      // it wins every overlap the same way each frame — the kerb-to-wall width only, the carriageway is over it
      if (brick && !e.foot && e.walk > 0 && brick.names.includes(e.name ?? '')) {
        quadStrip(corridor, pts, e.width + 2 * e.walk + 1.5, 0.1505, brick.colour)
      }

      if (e.foot) {
        /**
         * A footway lives in the CORRIDOR layer, never the carriageway layer.
         *
         * OSM draws footways straight across roads at every junction, and painting them as their own paved
         * surface laid pale slabs over the asphalt in a jumble — pavement in the middle of the road, which
         * is the one thing a city cannot have. In the corridor layer they show where no road covers them,
         * which is exactly where a pavement belongs, and are painted over where they cross a street.
         *
         * And where OSM says the footway is a marked crossing, it gets a zebra instead: the artifact
         * becomes the feature.
         */
        /*
         * A footway over water is a bridge's own pavement — OSM maps Pont Marie's two sidewalks as
         * separate footways beside its carriageway. Painted in the corridor layer, under the water, they
         * vanished, and the people walking along them stood on the river. So they are raised into the
         * pavement layer, which is drawn after the water.
         */
        if (this.overWater(pts)) quadStrip(walks, pts, e.width, 0.15, PAVEMENT)
        if (e.crossing) {
          /*
           * Trimmed to the carriageway it actually crosses. OSM draws a crossing way from pavement to
           * pavement, so painting the whole thing put zebra stripes up over the kerb and across the footway
           * on both sides — which is not where a crossing is. The nearest street's width is what the bars
           * should span, and the ends are pulled in by a pavement's worth either side.
           */
          // some regions do not paint zebras at all (Paris: see regions.json)
          if (this.region.crossings === 'none') continue
          const road = this.widestNear(pts)
          const inner = onCarriageway(pts, road)
          // Paris's passages piétons: the same bars, wider apart, across a broader crossing
          /*
           * ONE zebra per crossing (owner, 2026-10-05: "sometimes there are two crosswalks on top of each other"). A crossing
           * split at the road's centre node, or mapped twice (a footway and a cycle crossing side by side), gave each piece
           * its own kerb-to-kerb zebra, a metre or two apart. A second one whose middle is within 3.5 m of one already
           * painted in this tile is the same crossing.
           */
          if (inner.length >= 2) {
            const cm = { x: (inner[0].x + inner[inner.length - 1].x) / 2, z: (inner[0].z + inner[inner.length - 1].z) / 2 }
            // (and drawn by the tile its middle is in: a crossing split at the centre line has a piece in each of two
            //  tiles, and each painted the whole zebra)
            if (key(Math.floor(cm.x / TILE), Math.floor(cm.z / TILE)) !== k) continue
            const a0 = inner[0], a1 = inner[inner.length - 1]
            const segD = (p: { x: number; z: number }, s0: { x: number; z: number }, s1: { x: number; z: number }): number => {
              const dx = s1.x - s0.x, dz = s1.z - s0.z
              const t = Math.max(0, Math.min(1, ((p.x - s0.x) * dx + (p.z - s0.z) * dz) / (dx * dx + dz * dz || 1e-9)))
              return Math.hypot(s0.x + dx * t - p.x, s0.z + dz * t - p.z)
            }
            // …or one lying across it at a skew: within 2 m of one already painted and within 45° of parallel
            const same = (q: { x: number; z: number; a: { x: number; z: number }; b: { x: number; z: number } }): boolean => {
              if (Math.hypot(q.x - cm.x, q.z - cm.z) < 3.5) return true
              const ux = a1.x - a0.x, uz = a1.z - a0.z, vx = q.b.x - q.a.x, vz = q.b.z - q.a.z
              const cos = Math.abs(ux * vx + uz * vz) / ((Math.hypot(ux, uz) * Math.hypot(vx, vz)) || 1)
              return cos > 0.7 && Math.min(segD(a0, q.a, q.b), segD(a1, q.a, q.b), segD(cm, q.a, q.b), segD(q, a0, a1)) < 2
            }
            if (zebras.some(same)) continue
            zebras.push({ ...cm, a: a0, b: a1 })
          }
          if (inner.length >= 2) {
            // the Castro's rainbow crossings: six solid bands along the crossing, not white bars (Region `rainbowCrossings`)
            const mid = inner[Math.floor(inner.length / 2)]
            if (this.rainbowSpots.some((r) => Math.hypot(mid.x - r.x, mid.z - r.z) < r.radius)) {
              const W = Math.max(3, Math.min(4.5, e.width))
              RAINBOW.forEach((c, k) => dashedLine(markings, inner, (k - 2.5) * (W / 6), 0.064, W / 6 + 0.01, 1, 1, c))
              continue
            }
            if (this.region.crossings === 'bands') zebra(markings, inner, Math.max(3, Math.min(5, e.width + 1)), 0.5, 0.8)
            // North America's continental crossing: broad bars, as wide as the gaps, the full width of the road
            else if (this.region.crossings === 'continental') zebra(markings, inner, Math.max(3, Math.min(4.5, e.width)), 0.6, 0.6)
            else zebra(markings, inner, Math.max(2.2, Math.min(4, e.width)))
          }
        }
        continue
      }

      /*
       * A striped street (Region `stripedStreets`, Jefferson between Jones and Taylor): the carriageway is laid in cobbles,
       * and the concrete is painted over it as transverse light and dark bands on either side, leaving the cobbles
       * showing only down the middle, round the streetcar tracks.
       */
      const stripe = this.stripedStretches.find((ls) => {
        if (e.name !== ls.street) return false
        const m = pts[Math.floor(pts.length / 2)], dx = ls.b.x - ls.a.x, dz = ls.b.z - ls.a.z, LL = Math.hypot(dx, dz) || 1
        const t = ((m.x - ls.a.x) * dx + (m.z - ls.a.z) * dz) / (LL * LL)
        return t >= 0 && t <= 1 && Math.abs((m.x - ls.a.x) * dz - (m.z - ls.a.z) * dx) / LL < 15
      })
      const drawn = stripe ? 'cobblestone' : drawnSurface(e)
      const out = roads.get(drawn) ?? new MeshBuilder()
      roads.set(drawn, out)
      quadStrip(out, pts, e.width, 0.05, [0.5, 0.5, 0.5])
      if (stripe && e.width > stripe.cobbles + 2) {
        const side = (e.width - stripe.cobbles) / 2, off = stripe.cobbles / 2 + side / 2
        for (const o of [-off, off]) {
          dashedLine(markings, pts, o, 0.056, side, 1, 1, [0.33, 0.325, 0.31])
          dashedLine(markings, pts, o, 0.057, side, 1.5, 3, [0.23, 0.225, 0.215])
        }
      }

      // the kerb, cut back from each junction so it stops at the corner rather than crossing the mouth of
      // the side street
      if (e.walk > 0) {
        const trimmed = slice(pts, this.cutback(e.a), this.cutback(e.b))
        if (trimmed.length >= 2) kerbStrip(walks, trimmed, e.width, 0.05, 0.15)
      }
    }

    for (const id of pads) {
      const n = this.nodes.get(id)
      if (!n || n.arms.length < 2) continue

      // Generously wider than the carriageway hull: the corridor layer's job is to leave no bare ground
      // anywhere near a junction, and being painted rather than unioned it can overlap as much as it likes.
      // no concrete apron where a park's ways meet (see `e.park` above) — in the park the ways simply cross
      if (!n.park) capPolygon(corridor, junctionHull(n.arms, n.at, n.walk + 3), 0.15, PAVEMENT, 0, 2.4)

      /**
       * A carriageway hull is only drawn where one is actually needed, and in the surface the streets that
       * meet there are actually made of.
       *
       * Drawing one at every node in every case laid dark asphalt blobs all over pedestrianised squares —
       * random patches of road with no street attached to them, which is exactly what they looked like.
       * Three rules between them remove almost all of it: footways shape the pavement but never the
       * carriageway; a node where a street merely bends does not need a hull at all, because the two strips
       * already overlap; and the hull takes the surface of the streets meeting there rather than assuming
       * asphalt.
       */
      const drive = n.arms.filter((a) => !a.foot)
      if (drive.length < 2) continue
      if (drive.length === 2 && n.edges <= 2) {
        // a bend: only worth a hull if it actually turns
        const dot = drive[0].ux * -drive[1].ux + drive[0].uz * -drive[1].uz
        if (dot > 0.9) continue      // within about 25° of straight on
      }
      const tally = new Map<string, number>()
      for (const a of drive) { const sf = a.surface === 'concrete' ? 'asphalt' : a.surface; tally.set(sf, (tally.get(sf) ?? 0) + 1) }
      const surface = [...tally].sort((x, y) => y[1] - x[1])[0][0]
      const out = roads.get(surface) ?? new MeshBuilder()
      roads.set(surface, out)
      capPolygon(out, junctionHull(drive, n.at, 0), 0.05, [0.5, 0.5, 0.5], 0, 1)
    }

    // Markings are their own geometry: the road surface is one painted layer with no notion of which street
    // any given square metre belongs to.
    for (const e of groundEdges) {
      // (a painted busway is narrower than any marked road: it is let through for its paint, and only that)
      if (e.foot || (e.width < 5.4 && !(e.paint && e.kind === 'busway'))) continue
      const full = unpackPoints(e.points)
      const pts = slice(full, this.cutback(e.a) + 2.5, this.cutback(e.b) + 2.5)
      /*
       * The region's own lane paint (PackedEdge `paint`, tools/street-paint.ts; owner on Market Street: "the centre lanes
       * with the streetcars is red between Gough St and 3rd St … distinctive green bike lanes between Gough and 8th St").
       * Lane colour runs block to block, so it takes the WHOLE line less 3 m at each end — not the centre line's cutback,
       * which on Market's short blocks between close junctions left nothing at all (views audit, 2026-10-04).
       * On a one-way carriageway the middle of the street is its left side; on a two-way one, the centre.
       */
      const paintPts = e.paint ? slice(full, 3, 3) : []
      if (e.paint && e.paint & 1 && e.kind === 'busway' && paintPts.length >= 2) dashedLine(markings, paintPts, 0, 0.058, e.width + 0.2, 1, 1, BUS_RED)
      if (e.paint && e.width >= 5 && paintPts.length >= 2) {
        if (e.paint & 1 && !buswayBeside(e, paintPts) && !redUnderWider(e, paintPts)) {
          const W = Math.min(3.4, e.width / 2 - 0.5)
          if (e.oneway) dashedLine(markings, paintPts, e.width / 2 - 0.4 - W / 2, 0.058, W, 1, 1, BUS_RED)
          else dashedLine(markings, paintPts, 0, 0.058, Math.min(6.6, e.width - 4), 1, 1, BUS_RED)
        }
        if (e.paint & 2) {
          const W = 1.7
          for (const side of e.oneway ? [-1] : [-1, 1]) dashedLine(markings, paintPts, side * (e.width / 2 - 0.3 - W / 2), 0.0585, W, 1, 1, BIKE_GREEN)
        }
      }
      if (e.width < 5.4) continue
      // a connector a few metres long inside a junction gets no centre line: its stubs were left lying in
      // the junction box as stray bits of double yellow
      if (pts.length < 2 || lengthOf(pts) < 6) continue
      /*
       * The centre line is regional: a dashed white line in Europe, a solid double yellow in North America —
       * which is none at all on a one-way street, and that absence is as much a signal as the line.
       */
      /*
       * NOT IN A PARK, except on a road wide enough to be a real through-route (BUGS.md #213e).
       *
       * A park drive is marked the way a country lane is: nothing, or at most a worn centre line. The owner's
       * own references show it — Middle Drive and the Presidio's roads carry no paint at all, and a double
       * yellow with white edge lines is the single loudest thing that says CITY on a road through a wood.
       * The width test keeps the genuine arterials that cross the parks — the Great Highway, Crossover Drive —
       * which really are marked, and which the park rule already exempts elsewhere.
       */
      const parkLane = e.park && e.width < 9
      if (!parkLane) {
        if (this.region.centreLine === 'doubleYellow') {
          // (not down the F-line's streets, whose middle is the streetcar tracks and their islands: Market, the Embarcadero)
          const trackStreet = e.name === 'Market Street' || e.name === 'The Embarcadero'
          if (!e.oneway && !trackStreet) for (const side of [-1, 1]) dashedLine(markings, pts, side * 0.1, 0.063, 0.1, 1, 1, YELLOW)
        } else {
          dashedLine(markings, pts, 0, 0.063, 0.12, 3, 9)
        }
        for (const side of [-1, 1]) dashedLine(markings, pts, side * (e.width / 2 - 0.5), 0.063, 0.10, 1, 1)
      }
      // the red bus lanes along their curbs (PackedEdge `busSide`; owner: "render bus lanes as red"), just under the paint
      if (e.busSide && e.width >= 7) {
        const W = Math.min(3.3, e.width / 2 - 0.8)
        for (const [bit, side] of [[1, -1], [2, 1]] as const) {
          if (e.busSide & bit) dashedLine(markings, pts, side * (e.width / 2 - 0.55 - W / 2), 0.058, W, 1, 1, BUS_RED)
        }
      }
    }

    if (corridor.triangles > 0 && !this.off.has('walks')) {
      const m = new Mesh(`corridor:${k}`, this.scene)
      this.terrain.drape(corridor.positions)
      corridor.toVertexData().applyToMesh(m)
      m.material = groundLayerMaterial(this.scene, this.roadAssets, 'concrete', 'corridor')
      m.renderingGroupId = GROUP.corridor
      meshes.push(m)
    }
    for (const [page, out] of trails) {
      if (out.triangles === 0 || this.off.has('walks')) continue
      const m = new Mesh(`trail:${page}:${k}`, this.scene)
      // (on the park's own ground, as the park's grass is: on the streets' levelled ground a trail over a hill in Golden Gate
      //  Park stood up to 1.5 m in the air, its walkers with it — owner, 2026-10-06, at 37.767296, −122.4729)
      this.terrain.drapeRaw(out.positions)
      out.toVertexData().applyToMesh(m)
      m.material = groundLayerMaterial(this.scene, this.roadAssets, page, 'trail')
      m.renderingGroupId = GROUP.corridor
      meshes.push(m)
    }

    for (const [builder, group, name] of [[areas, GROUP.areas, 'areas'], [walks, GROUP.walk, 'walks']] as const) {
      if (builder.triangles === 0 || this.off.has(name)) continue
      const m = new Mesh(`${name}:${k}`, this.scene)
      // the parks and squares on the raw ground, the pavements at their streets' level (BUGS.md #38)
      if (name === 'areas') this.terrain.drapeRaw(builder.positions)
      else this.terrain.drape(builder.positions)
      builder.toVertexData().applyToMesh(m)
      // the concrete page is a neutral grain; the vertex tint does the rest. Its own material instance, not
      // the buildings' one, so that culling can be turned off for flat ground without affecting walls.
      const groundMat = facadeMaterial(this.scene, 'brutalist', this.assets, name === 'walks' ? 'pavement' : 'ground')
      groundMat.backFaceCulling = false
      // flat ground at grade hides nothing — the terrain occluder does that — and a park lapping over the
      // river must not hide the river, which is depth-tested after it. Nor the pavement: written into depth,
      // its long quads stood above the ground on a slope and hid the rider's wheels (BUGS.md #26); the walls
      // running on under it are hidden by the buildings' occluder, 0.15 m under the ground (#14).
      groundMat.disableDepthWrite = true
      m.material = groundMat
      m.renderingGroupId = group
      meshes.push(m)
    }
    // (the beaches after the plain areas too: the Presidio's park outline takes in Baker Beach and China Beach, and
    //  drawn first their sand was painted over by its lawn — owner, 2026-10-17)
    if (sandOut.triangles > 0 && !this.off.has('areas')) {
      // (named under `areas:` so the ground group draws it with the areas, before the corridor and the paths on it)
      const m = new Mesh(`areas:sand:${k}`, this.scene)
      this.terrain.drapeRaw(sandOut.positions)
      sandOut.toVertexData().applyToMesh(m)
      m.material = groundLayerMaterial(this.scene, this.roadAssets, 'sand', 'beach')
      m.renderingGroupId = GROUP.areas
      meshes.push(m)
    }
    /*
     * …and the squares in a material of their own AFTER them (2026-10-17): no layer writes depth, so the order they are
     * made is the order they are drawn, and OSM often maps plain paving on the very outline a square re-lays in setts or
     * brick — made first, the square would be painted over by it.
     */
    for (const [surface, b] of pagedOut) {
      if (b.triangles === 0 || this.off.has('areas')) continue
      const m = new Mesh(`areas:${surface}:${k}`, this.scene)
      this.terrain.drapeRaw(b.positions)
      b.toVertexData().applyToMesh(m)
      m.material = groundLayerMaterial(this.scene, this.roadAssets, surface, `square-${surface}`)
      m.renderingGroupId = GROUP.areas
      meshes.push(m)
    }
    /*
     * THE SPORTS COURTS (BUGS.md #214). Its own mesh in the `walk` rendering group, for the same reason the
     * road markings are: Babylon clears the depth buffer between groups, so the court sits cleanly over the
     * `pitch` area in the `areas` group instead of z-fighting it — a 1 cm offset does not survive at the
     * distance a park is seen from. Draped RAW, like the area it stands on and unlike the road markings:
     * a court is on the ground the park is on, not at a street's level (BUGS.md #38).
     */
    const courts = new MeshBuilder()
    // (a padel court's glass and mesh walls, drawn see-through: the court and its players show through them)
    const courtGlass = new MeshBuilder()
    if (!this.off.has('courts')) for (const c of this.courtsIn.get(k) ?? []) court(courts, c, courtGlass)
    if (courts.triangles > 0) {
      const m = new Mesh(`courts:${k}`, this.scene)
      this.terrain.drapeRaw(courts.positions)
      courts.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(this.scene, 'cartoonStatic', false)
      m.renderingGroupId = GROUP.walk
      meshes.push(m)
    }
    if (courtGlass.triangles > 0) {
      const m = new Mesh(`courtGlass:${k}`, this.scene)
      this.terrain.drapeRaw(courtGlass.positions)
      courtGlass.toVertexData().applyToMesh(m)
      m.material = courtGlassMaterial(this.scene)
      m.renderingGroupId = GROUP.walk
      m.isPickable = false
      meshes.push(m)
    }
    // a car park's stall lines: white, down each side of every stall (city/parking.ts)
    this.stallCache.delete(k)
    for (const st of this.stallsIn(k)) {
      const vx = -st.uz, vz = st.ux
      for (const side of [-1.3, 1.3]) {
        const cx = st.x + st.ux * side, cz = st.z + st.uz * side
        dashedLine(markings, [{ x: cx - vx * 2.4, z: cz - vz * 2.4 }, { x: cx + vx * 2.4, z: cz + vz * 2.4 }], 0, 0.058, 0.1, 1, 1, [0.78, 0.78, 0.74])
      }
    }
    if (markings.triangles > 0 && !this.off.has('roads')) {
      const m = new Mesh(`markings:${k}`, this.scene)
      this.terrain.drape(markings.positions)
      markings.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(this.scene, 'cartoonStatic', false)
      /*
       * In the carriageway's own group (2026-10-14; it was the buildings' group): there the ground's occluder is 0.6 m
       * down, the margin the streets themselves need, so the paint is never torn by it — and a crest that hides the
       * street hides its paint. In the buildings' group the occluder is only 0.15 m down, and the paint either tore
       * (Market at 6th) or, drawn before it to stop that, showed through hills ("crosswalks shining through steep
       * hills", owner, 2026-10-14).
       * (6 cm clear of the graded carriageway: it runs straight between the edge's points while the paint is draped
       * point by point, and where they parted the street came through the red lanes in patches)
       */
      m.renderingGroupId = GROUP.road
      m.position.y = 0.06
      meshes.push(m)
    }

    for (const [surface, out] of roads) {
      if (this.off.has('roads')) break
      const m = new Mesh(`road:${surface}:${k}`, this.scene)
      this.terrain.drape(out.positions)
      out.toVertexData().applyToMesh(m)
      m.material = surface === this.pkg.ground
        ? roadMaterial(this.scene, surface, this.roadAssets)
        : groundLayerMaterial(this.scene, this.roadAssets, surface, 'carriage')
      m.renderingGroupId = surface === this.pkg.ground ? GROUP.base : GROUP.road
      meshes.push(m)
      /*
       * …and the carriageway again as DEPTH ONLY, first in the buildings' group, like the ground occluder (owner,
       * 2026-10-01, at 37.796428 −122.468589: "the retaining wall is visible THROUGH the road"). The depth buffer is
       * cleared between groups, so a road drawn in its own group hid nothing in the last one: on a steep slope the
       * retaining wall of a street raised on fill, which runs down under the next street's edge, drew right over
       * that street. 12 cm down, so a car's tyres and a kerb on the road are never clipped. (Named as an occluder,
       * so it is drawn before everything it hides: `rank` above.)
       */
      if (surface !== this.pkg.ground) {
        const occ = this.scene.getMaterialByName('occluder')
        if (occ) {
          const d = m.clone(`ground:occluder:road:${k}`)
          d.material = occ
          d.renderingGroupId = GROUP.building
          d.position.y = -0.12
          d.isPickable = false
          meshes.push(d)
        }
      }
    }
    if (water.triangles > 0 && !this.off.has('water')) {
      const m = new Mesh(`water:${k}`, this.scene)
      // not draped: each body of water was given its own single level above
      water.toVertexData().applyToMesh(m)
      m.material = waterMaterial(this.scene)
      m.renderingGroupId = GROUP.areas
      meshes.push(m)
    }

    // Street furniture. Lamp posts every twenty-odd metres down a street with a pavement, and a bench here
    // and there. Both are cheap boxes, and a street without them reads as a rendering of a street: they are
    // the small evidence that somebody maintains the place.
    const furniture = new MeshBuilder()
    RIGID.set(furniture, [])
    // never in a road, nor in the median of one mapped as two ways (Carriageways.noFurniture)
    const kerbside = new Carriageways(kerbEdges)
    /*
     * THE PARK'S OWN LAMPPOSTS (BUGS.md #202, docs/PARKS.md). The owner: *"Almost [no] sidewalks or street
     * furniture except a few classic lampposts."* — an exception written into a list of removals, and the
     * park lost it by accident: every lamppost in the city is planted by the loop below, which is gated on
     * `e.walk >= 1.2`, and the park rule sets `walk` to zero. Taking the pavements away took the lampposts
     * with them, along with the meters and the newsracks that were the point.
     *
     * So the park plants its own, and the planting says what the references say rather than what a city
     * kerb says: ONE side of the road, not alternating; every seventy-odd metres rather than every twenty;
     * out on the verge past where the kerb would be, because in `~/Downloads/ggp-mlk-dr.png` the one
     * lamppost in the frame stands in the grass between the carriageway and the detached trail. Roads only
     * — nobody lights a dirt trail through a wood.
     */
    for (const e of groundEdges) {
      if (!e.park || e.foot || this.off.has('furniture')) continue
      if (!this.region.furniture.lampPosts) continue
      const pts = unpackPoints(e.points)
      const side = e.id % 2 === 0 ? 1 : -1
      const off = e.width / 2 + 1.4
      let acc = 20 + (e.id % 31)
      let n = 0
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x
        const dz = pts[i].z - pts[i - 1].z
        const seg = Math.hypot(dx, dz)
        while (acc < seg) {
          const t = acc / seg
          const px = pts[i - 1].x + dx * t + (-dz / seg) * off * side
          const pz = pts[i - 1].z + dz * t + (dx / seg) * off * side
          if (!(skippedIf(kerbside.whyNoFurniture(px, pz), px, pz, 'park lamp'))) placeModel(furniture, lampPost, px, 0.15, pz, Math.atan2(dx, dz) + (side > 0 ? Math.PI : 0))
          acc += 70 + ((e.id + n) % 23)
          n++
        }
        acc -= seg
      }
    }
    /*
     * NOT IN A STAIRWAY'S MOUTH (BUGS.md #213d). The Lyon Street Steps' own view up the flight from Vallejo
     * had a lamppost planted dead centre in the approach, splitting the one thing the landmark exists to be
     * looked at. A stairway meets the pavement head-on, so the street's regular spacing will sooner or later
     * put a post right in front of it, on any named stairway in the city. The steps' own ends are the thing
     * to keep clear — not the whole flight, which climbs away from the street anyway.
     */
    const stairMouths: { x: number; z: number }[] = []
    for (const e of groundEdges) {
      if (e.kind !== 'steps') continue
      const q = unpackPoints(e.points)
      if (q.length > 0) stairMouths.push(q[0], q[q.length - 1])
    }
    /*
     * …nor ON a flight anywhere along it (owner, 2026-10-16, Taylor Street at 37.790831 −122.412358: "bench inside some
     * stairs"): a stairway that runs along a sidewalk takes the pavement the furniture is spaced over. Kept clear by its
     * half-width and a metre, from this tile's flights and the neighbours' (a flight crosses tile edges).
     */
    const flights: { a: { x: number; z: number }; b: { x: number; z: number }; clear: number }[] = []
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      for (const e of this.edgesIn.get(key(ktx + dx, ktz + dz)) ?? []) {
        if (e.kind !== 'steps') continue
        const q = unpackPoints(e.points)
        for (let i = 1; i < q.length; i++) flights.push({ a: q[i - 1], b: q[i], clear: (e.width || 2) / 2 + 1 })
      }
    }
    const onFlight = (x: number, z: number): boolean => flights.some(({ a, b, clear }) => {
      const dx = b.x - a.x, dz = b.z - a.z
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
      return Math.hypot(a.x + dx * t - x, a.z + dz * t - z) < clear
    })
    const nearStairMouth = (x: number, z: number): boolean =>
      stairMouths.some((m) => Math.abs(m.x - x) < 6 && Math.abs(m.z - z) < 6) || onFlight(x, z)

    /*
     * A street mapped as TWO ways, one each way (Market at Van Ness, 10th, 8th …): each way's pavement on the inside is
     * the median — tracks, islands, the other carriageway — and its lamps stood in the road there (owner's Market
     * survey, 2026-10-03). A point is on the inside when another way of the same name runs nearer to it than its own.
     */
    const twins = new Map<string, { id: number; pts: { x: number; z: number }[] }[]>()
    // (from this tile and its neighbours: the other way of the pair is often in the next tile)
    const around: typeof groundEdges = []
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) around.push(...(this.edgesIn.get(key(ktx + dx, ktz + dz)) ?? []))
    for (const o of around) {
      if (o.foot || !o.name) continue
      const l = twins.get(o.name) ?? []
      l.push({ id: o.id, pts: unpackPoints(o.points) })
      twins.set(o.name, l)
    }
    const segDist = (pts: { x: number; z: number }[], x: number, z: number): number => {
      let d = Infinity
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], dx = pts[i].x - a.x, dz = pts[i].z - a.z
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1e-9)))
        d = Math.min(d, Math.hypot(a.x + dx * t - x, a.z + dz * t - z))
      }
      return d
    }
    const insideTwin = (e: { id: number; name?: string }, own: { x: number; z: number }[], x: number, z: number): boolean => {
      if (!e.name) return false
      const mine = segDist(own, x, z)
      return (twins.get(e.name) ?? []).some((o) => o.id !== e.id && segDist(o.pts, x, z) < mine + 1)
    }
    for (const e of groundEdges) {
      if (e.foot) continue
      if (e.walk < 1.2) continue
      const walk = e.walk
      const pts = unpackPoints(e.points)
      const off = e.width / 2 + walk * 0.55
      const market = this.region.pointFurniture.american && e.name === 'Market Street'
      let acc = 8 + (e.id % 11)
      let n = 0
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x
        const dz = pts[i].z - pts[i - 1].z
        const seg = Math.hypot(dx, dz)
        while (acc < seg) {
          const t = acc / seg
          const side = n % 2 === 0 ? 1 : -1
          const px = pts[i - 1].x + dx * t + (-dz / seg) * off * side
          const pz = pts[i - 1].z + dz * t + (dx / seg) * off * side
          const heading = Math.atan2(dx, dz) + (side > 0 ? Math.PI : 0)
          if (skippedIf(kerbside.whyNoFurniture(px, pz, market ? 7 : 4), px, pz, 'lamp/bench') || insideTwin(e, pts, px, pz)) { acc += market ? 15 : 22 + ((e.id + n) % 9); n++; continue }
          // what stands on the pavement is regional: Paris hangs its lamps on the buildings
          // a bench only where the pavement has room to sit on it, and not at every other lamp post
          if ((e.id + n) % 14 === 0 && walk >= 2.5) {
            /*
             * Along the kerb, not across the pavement (owner, 2026-10-06: "benches on the street are almost always
             * parallel to the street … all of ours are [perpendicular]"), facing the road, in the slot a lamp post
             * would take (the building side has the racks and bins). `heading` turns a model's +z ALONG the street; a
             * bench is long in x and faces +z, so it takes the normal towards the road.
             */
            if (this.region.furniture.benches && !nearStairMouth(px, pz)) placeModel(furniture, bench, px, 0.15, pz, Math.atan2(dz * side, -dx * side))
          } else if (this.region.furniture.lampPosts && !nearStairMouth(px, pz)) {
            placeModel(furniture, market ? pathOfGold : lampPost, px, 0.15, pz, heading)
          }
          // (Market's Path of Gold stands closer: about every 30 m each side, so ~15 m alternating)
          acc += market ? 15 : 22 + ((e.id + n) % 9)
          n++
        }
        acc -= seg
      }
    }
    /*
     * Fire hydrants, where the region has them (North America): one every sixty metres of pavement wide
     * enough for one, 0.3 m in from the kerb. Small, red, and nowhere in Europe — a cheap, strong signal.
     */
    if (this.region.hydrants) {
      // (not in the road: a street mapped as two parallel ways has one way's kerb in the other's lanes, and a
      // hydrant near a junction was in the cross street — BUGS.md #45)
      const roads = new Carriageways(kerbEdges)
      // the paint, by the hydrant's own position in the street: the same every time the tile is built
      const paint = this.region.hydrantPaint
      const body = paint ? hexRgb(paint.body) : undefined
      const tops = paint?.tops.map(([c, w]) => [hexRgb(c), w] as const) ?? []
      const weight = tops.reduce((t, [, w]) => t + w, 0)
      const paintHydrant = (k: number) => (b: MeshBuilder): void => {
        if (!body) { hydrant(b); return }
        let r = ((Math.imul(k ^ 0x9e3779b9, 0x85ebca6b) >>> 0) / 4294967296) * weight
        let top = tops[0]?.[0] ?? body
        for (const [c, w] of tops) { if (r < w) { top = c; break } r -= w }
        hydrant(b, body, top)
      }
      for (const e of groundEdges) {
        if (e.foot || e.walk < 1.5) continue
        const pts = unpackPoints(e.points)
        const off = e.width / 2 + 0.3
        let total = 0
        for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
        let acc = 20 + (e.id % 23)
        let run = 0
        let n = 0
        for (let i = 1; i < pts.length; i++) {
          const dx = pts[i].x - pts[i - 1].x
          const dz = pts[i].z - pts[i - 1].z
          const seg = Math.hypot(dx, dz)
          while (acc < seg) {
            if (run + acc > total - 12) break
            const t = acc / seg
            const side = (e.id + n) % 2 === 0 ? 1 : -1
            const hx = pts[i - 1].x + dx * t + (-dz / seg) * off * side
            const hz = pts[i - 1].z + dz * t + (dx / seg) * off * side
            if (!(skippedIf(roads.whyNoFurniture(hx, hz), hx, hz, 'hydrant'))) placeModel(furniture, paintHydrant(e.id * 7 + n), hx, 0.15, hz, Math.atan2(dx, dz))
            acc += 60
            n++
          }
          acc -= seg
          run += seg
        }
      }
    }

    /*
     * The busy American pavement (region `furniture.clutter`; user, 2026-09-22: "there is SO MUCH street furniture…
     * some places the sidewalk is quite cluttered with benches, newspaper boxes, ads, utility poles, and trees").
     * Near each corner of a main street a bank of newspaper racks or a green can; parking meters down the kerbs of
     * the commercial streets; wooden utility poles and their wires down the residential ones; and on a brick
     * street (Market) the chain kerb and the bannered standards. Nothing where it would stand in a road.
     */
    /*
     * LANTERN STRINGS across a street (Region `lanternStreets`: Grant Avenue in Chinatown): a wire from wall to wall at
     * about seven metres, sagging a little, every nine metres, with red paper lanterns hung along it.
     */
    for (const ls of this.lanternStretches) {
      const dx = ls.b.x - ls.a.x, dz = ls.b.z - ls.a.z, LL = Math.hypot(dx, dz) || 1
      for (const e of groundEdges) {
        if (e.foot || e.name !== ls.street) continue
        const pts = unpackPoints(e.points)
        let acc = 0
        for (let i = 1; i < pts.length; i++) {
          const p0 = pts[i - 1], p1 = pts[i]
          const L = Math.hypot(p1.x - p0.x, p1.z - p0.z)
          if (L < 0.1) continue
          const ux = (p1.x - p0.x) / L, uz = (p1.z - p0.z) / L
          for (let s = (9 - (acc % 9)) % 9; s < L; s += 9) {
            const x = p0.x + ux * s, z = p0.z + uz * s
            const t = ((x - ls.a.x) * dx + (z - ls.a.z) * dz) / (LL * LL)
            const off = Math.abs((x - ls.a.x) * dz - (z - ls.a.z) * dx) / LL
            if (t < 0 || t > 1 || off > 40) continue
            const half = e.width / 2 + e.walk
            const nx = -uz, nz = ux
            const y = 7   // (over the ground: the furniture mesh is draped)
            strut(furniture, [x - nx * half, y, z - nz * half], [x + nx * half, y, z + nz * half], 0.02, 0.02, [0.1, 0.1, 0.1], 0, false)
            const n = Math.max(3, Math.round((half * 2) / 1.6))
            for (let k = 1; k < n; k++) {
              const f = k / n - 0.5, sag = 0.5 * (1 - 4 * f * f)
              const lx = x + nx * f * half * 2, lz = z + nz * f * half * 2
              // a paper lantern's belly: narrow, full, narrow
              prism(furniture, lx, lz, y - sag - 0.78, y - sag - 0.66, 0.13, 10, ls.colour, 0, 0.23)
              prism(furniture, lx, lz, y - sag - 0.66, y - sag - 0.46, 0.23, 10, ls.colour, 0, 0.23)
              prism(furniture, lx, lz, y - sag - 0.46, y - sag - 0.35, 0.23, 10, ls.colour, 0, 0.13)
              prism(furniture, lx, lz, y - sag - 0.35, y - sag - 0.3, 0.12, 8, [0.85, 0.7, 0.2], 0, 0.12)
            }
          }
          acc += L
        }
      }
    }

    if (this.region.furniture.clutter) {
      const carriage = new Carriageways(kerbEdges)
      const brickNames = this.region.brickStreets?.names ?? []
      const hash = (a: number, b: number): number => ((Math.imul(a ^ Math.imul(b, 0x27d4eb2d), 0x9e3779b1) >>> 0) % 1000) / 1000
      for (const e of groundEdges) {
        if (e.foot || e.walk < 1.2 || !onSurface(e)) continue
        const pts = unpackPoints(e.points)
        let total = 0
        for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
        const at = (s: number): { x: number; z: number; tx: number; tz: number } => {
          let acc = 0
          for (let i = 1; i < pts.length; i++) {
            const dx = pts[i].x - pts[i - 1].x
            const dz = pts[i].z - pts[i - 1].z
            const L = Math.hypot(dx, dz)
            if (acc + L >= s || i === pts.length - 1) {
              const t = L > 0 ? Math.min(1, (s - acc) / L) : 0
              return { x: pts[i - 1].x + dx * t, z: pts[i - 1].z + dz * t, tx: dx / (L || 1), tz: dz / (L || 1) }
            }
            acc += L
          }
          return { x: pts[0].x, z: pts[0].z, tx: 1, tz: 0 }
        }
        const put = (s: number, side: number, off: number, model: (o: MeshBuilder) => void, turn = 0): { x: number; z: number } | null => {
          const p = at(s)
          const x = p.x - p.tz * off * side
          const z = p.z + p.tx * off * side
          // (not in a road, nor in the median of one mapped as two ways: Carriageways.noFurniture)
          if (skippedIf(carriage.whyNoFurniture(x, z), x, z, 'clutter') || insideTwin(e, pts, x, z)) return null
          placeModel(furniture, model, x, 0.15, z, Math.atan2(p.tx, p.tz) + (side > 0 ? Math.PI : 0) + turn)
          return { x, z }
        }
        const main = MAIN_STREETS.has(e.kind ?? '')
        const brick = brickNames.includes(e.name ?? '')
        // the corners: 9 m back from each end, a bank of racks or a can
        if (main && total > 30 && e.walk >= 1.8) {
          for (const [end, s] of [[0, 9], [1, total - 9]] as const) {
            const h = hash(e.id, end + 7)
            const side = h < 0.5 ? 1 : -1
            if (h < 0.35 || (h > 0.5 && h < 0.8)) put(s, side, e.width / 2 + e.walk - 0.45, (o) => newsRacks(o, e.id * 3 + end), Math.PI / 2)
            else put(s + 2, -side, e.width / 2 + 0.55, sfTrashCan)
          }
        }
        // parking meters down the commercial kerbs (not Market, where nobody parks) — and only COMMERCIAL ones: a street
        // lined with shops and places to eat, at least three within 20 m of it and one per 40 m of its length (owner,
        // 2026-10-03: "WAY too many parking meters … most of the city has no parking meters"; every main street had them)
        const shopsAlong = (): number => {
          const [tx0, tz0] = tileOf(pts[0].x, pts[0].z)
          let n = 0
          for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
            for (const q of this.shopsIn.get(key(tx0 + dx, tz0 + dz)) ?? []) {
              for (let i = 1; i < pts.length; i++) {
                const a = pts[i - 1], b = pts[i]
                const vx = b.x - a.x, vz = b.z - a.z, L2 = vx * vx + vz * vz || 1
                const t = Math.max(0, Math.min(1, ((q.x - a.x) * vx + (q.z - a.z) * vz) / L2))
                if (Math.hypot(a.x + vx * t - q.x, a.z + vz * t - q.z) < 20) { n++; break }
              }
            }
          }
          return n
        }
        if (main && !brick && total > 30 && shopsAlong() >= Math.max(3, total / 40)) {
          for (const side of [-1, 1]) {
            if (hash(e.id, side + 3) < 0.35) continue
            for (let s = 12; s < total - 12; s += 6.5) put(s, side, e.width / 2 + 0.35, parkingMeter)
          }
        }
        // utility poles and their wires down a residential street, one side
        if (e.kind === 'residential' && total > 40 && hash(e.id, 11) < 0.7) {
          const side = hash(e.id, 12) < 0.5 ? 1 : -1
          let last: { x: number; z: number } | null = null
          for (let s = 10; s < total - 6; s += 34) {
            // (the crossarm ACROSS the street — the model's local x — with the wires running along it from arm to arm;
            //  a quarter turn here laid every arm along the kerb, owner 2026-10-17: "our electrical poles are oriented the
            //  wrong way - parallel to the street instead of perpendicular")
            const here = put(s, side, e.width / 2 + 0.4, (o) => utilityPole(o, e.id + Math.round(s)))
            if (here && last) {
              const ga = this.terrain.heightAt(last.x, last.z)
              const gb = this.terrain.heightAt(here.x, here.z)
              const span = Math.hypot(here.x - last.x, here.z - last.z) || 1
              const ox = -(here.z - last.z) / span, oz = (here.x - last.x) / span
              for (const k of [-1.05, 0.4, 1.05]) {
                // the wires along the street, one per insulator, sagging 0.35 m between poles
                const a3: [number, number, number] = [last.x + ox * k, ga + 10.4 + 0.15, last.z + oz * k]
                const b3: [number, number, number] = [here.x + ox * k, gb + 10.4 + 0.15, here.z + oz * k]
                const seg = 4
                for (let q = 0; q < seg; q++) {
                  const u0 = q / seg
                  const u1 = (q + 1) / seg
                  const P = (u: number): [number, number, number] => [a3[0] + (b3[0] - a3[0]) * u, a3[1] + (b3[1] - a3[1]) * u - 0.35 * Math.sin(Math.PI * u), a3[2] + (b3[2] - a3[2]) * u]
                  strut(furniture, P(u0), P(u1), 0.012, 0.012, [0.08, 0.08, 0.08], FIXED, false)
                }
              }
            }
            last = here ?? last
          }
        }
        // Market: the chain kerb, and a bannered standard every 40 m each side
        if (brick && total > 20) {
          for (const side of [-1, 1]) {
            let prev: { x: number; z: number } | null = null
            for (let s = 10; s < total - 10; s += 2.6) {
              const here = put(s, side, e.width / 2 + 0.3, chainBollard)
              if (here && prev) {
                const g0 = this.terrain.heightAt(prev.x, prev.z) + 0.15
                const g1 = this.terrain.heightAt(here.x, here.z) + 0.15
                const mid: [number, number, number] = [(prev.x + here.x) / 2, (g0 + g1) / 2 + 0.55, (prev.z + here.z) / 2]
                strut(furniture, [prev.x, g0 + 0.72, prev.z], mid, 0.015, 0.015, [0.1, 0.1, 0.1], FIXED, false)
                strut(furniture, mid, [here.x, g1 + 0.72, here.z], 0.015, 0.015, [0.1, 0.1, 0.1], FIXED, false)
              }
              prev = here
            }
            for (let s = 20; s < total - 10; s += 40) put(s + (side > 0 ? 0 : 20), side, e.width / 2 + 0.8, (o) => streetBanners(o, e.id + Math.round(s)), Math.PI / 2)
          }
        }
      }
    }

    /*
     * THE TOURIST STRIP (Region `touristStrips`, Fisherman's Wharf; owner 2026-10-17: "a LOT of street furniture… in some
     * parts it is impossible to walk in a straight line on the sidewalk"; "bike racks everywhere"). Down both sides of
     * every street with a real pavement inside the strip, about every 5 m, staggered: on the kerb line bike racks (most
     * often), triple bins with their posters, poster boards, the map kiosks and planters; on a wide pavement, by the
     * shopfronts, tables and parasols. Clear of the junctions' last 7 m, never in a road or a median.
     */
    if (this.touristRings.length) {
      const strip = new Carriageways(kerbEdges)
      const inside = (x: number, z: number): boolean => this.touristRings.some((r) => {
        let k = false
        for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) k = !k
        return k
      })
      const hash = (a: number, b: number): number => ((Math.imul(a ^ Math.imul(b, 0x27d4eb2d), 0x9e3779b1) >>> 0) % 1000) / 1000
      // (nothing in a building: where a frontage stands out over the pavement a café table ran into its wall — owner,
      //  2026-10-17, Zea Gallery; tested with a 0.9 m margin all round)
      const [ktx, ktz] = k.split(',').map(Number)
      const near9: number[][] = []
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (const b of this.buildingsIn.get(key(ktx + dx, ktz + dz)) ?? []) near9.push(b.ring)
      const walled = (x: number, z: number): boolean => near9.some((r) =>
        [[0, 0], [0.9, 0], [-0.9, 0], [0, 0.9], [0, -0.9]].some(([ox, oz]) => pointInFlatRing(r, x + ox, z + oz)))
      for (const e of groundEdges) {
        if (e.foot || e.walk < 1.8 || !onSurface(e)) continue
        const pts = unpackPoints(e.points)
        const total = lengthOf(pts)
        if (total < 12) continue
        let acc = 0, n = 0
        for (let i = 1; i < pts.length; i++) {
          const dx = pts[i].x - pts[i - 1].x, dz = pts[i].z - pts[i - 1].z, seg = Math.hypot(dx, dz)
          if (seg < 0.1) continue
          const ux = dx / seg, uz = dz / seg
          for (let s = (3.5 - (acc % 3.5)) % 3.5; s < seg; s += 3.5, n++) {
            const along = acc + s
            if (along < 5 || along > total - 5) continue
            const cx = pts[i - 1].x + ux * s, cz = pts[i - 1].z + uz * s
            if (!inside(cx, cz)) continue
            for (const side of [-1, 1]) {
              // the kerb line every slot but a few, and on a wide pavement the shop side too, staggered against it
              const lines: boolean[] = [false]
              if (e.walk >= 3 && (n + (side > 0 ? 1 : 0)) % 2 === 0) lines.push(true)
              for (const shopSide of lines) {
                const h = hash(e.id * 31 + n, side + 5 + (shopSide ? 17 : 0))
                if (h < 0.12) continue
                const off = shopSide ? e.width / 2 + e.walk - 0.9 : e.width / 2 + 0.7
                const x = cx - uz * off * side, z = cz + ux * off * side
                if (strip.whyNoFurniture(x, z) || walled(x, z)) continue
                const rot = Math.atan2(ux, uz) + (side > 0 ? Math.PI : 0) + Math.PI / 2
                const seed = e.id * 7 + n * 13 + (side > 0 ? 1 : 0) + (shopSide ? 5 : 0)
                let model: (o: MeshBuilder) => void
                if (shopSide) model = h < 0.75 ? (o) => cafeSet(o, seed) : (o) => planterBox(o, seed)
                else model = h < 0.55 ? (o) => bikeRack(o, seed) : h < 0.7 ? (o) => tripleBin(o, seed) : h < 0.82 ? (o) => posterBoard(o, seed) : h < 0.9 ? mapKiosk : (o) => planterBox(o, seed)
                placeModel(furniture, model, x, 0.15, z, rot)
              }
            }
          }
          acc += seg
        }
      }
    }

    /*
     * Bollards along the kerb of a narrow pavement, where the region has them (Paris). Kept clear of the
     * last few metres before each junction, which is where the crossings and the corners are.
     */
    const bol = this.region.furniture.bollards
    if (bol) {
      const post = bollard(hexRgb(bol.colour), bol.height)
      for (const e of groundEdges) {
        if (e.foot || e.walk < 0.9 || e.walk > bol.maxPavement) continue
        const pts = unpackPoints(e.points)
        const total = lengthOf(pts)
        const off = e.width / 2 + 0.28
        let travelled = 0
        let acc = 7
        for (let i = 1; i < pts.length; i++) {
          const dx = pts[i].x - pts[i - 1].x
          const dz = pts[i].z - pts[i - 1].z
          const seg = Math.hypot(dx, dz)
          while (acc < seg) {
            if (travelled + acc > total - 7) break
            const t = acc / seg
            for (const side of [-1, 1]) {
              placeModel(furniture, post,
                pts[i - 1].x + dx * t + (-dz / seg) * off * side, 0.15,
                pts[i - 1].z + dz * t + (dx / seg) * off * side, 0)
            }
            acc += bol.spacing
          }
          acc -= seg
          travelled += seg
        }
      }
    }

    /**
     * Traffic lights, on the approach to a junction big enough to warrant them.
     *
     * One per arm, set back at the kerb on the near side, facing back down the street at the traffic it
     * stops. With the stop bar painted across the carriageway below it, a junction stops being a place where
     * roads merely cross and starts being a place that is controlled — which is most of what separates a
     * city street from a road through a field.
     */
    const signalKerb = new Carriageways(kerbEdges)
    for (const id of pads) {
      const n = this.nodes.get(id)
      if (!n) continue
      const drive = n.arms.filter((a) => !a.foot && a.half >= 3)
      if (!lights.has(id)) continue
      for (const a of drive) {
        const set = n.radius + 1.4
        // on the near-side kerb: to the right of somebody arriving down this arm
        const kerb = a.half + n.walk * 0.55
        const px = n.at.x + a.ux * set - a.uz * kerb
        const pz = n.at.z + a.uz * set + a.ux * kerb
        /*
         * …but never a post standing in another carriageway or its median (owner, 2026-10-06, Market at 4th and at 5th:
         * "traffic light poles in the middle of the street … we could just remove some as there are a lot"). On
         * Market, mapped as several parallel ways, an arm's "kerb" is the next carriageway over. Such a post is left out,
         * with its lamps; its arm's traffic still keeps its timed light (sim/signals.ts), and the other arms' posts
         * still show it.
         */
        if (signalKerb.whyNoFurniture(px, pz, 1.2) !== null) continue
        // the region's own signal: a Paris post, or a North American mast arm out over this arm's lanes
        const signal = this.region.signals === 'mastArm' ? trafficLightMast(a.half * 1.1 + n.walk * 0.55)
          : this.region.signals === 'paris' ? trafficLightParis : trafficLight
        const facing = Math.atan2(-a.ux, -a.uz)
        placeModel(furniture, signal, px, 0.15, pz, facing)
        // where this head's lamps are, for the live lamps (render/lamps.ts): the traffic it stops arrives along
        // this arm, so its light is that arm's
        if (a.edgeId !== undefined) {
          const lamps = signalLamps(this.region.signals, a.half * 1.1 + n.walk * 0.55)
          const cos = Math.cos(facing)
          const sin = Math.sin(facing)
          const list = this.heads.get(k) ?? this.heads.set(k, []).get(k)!
          for (const l of lamps) {
            // each lens at the ground under the POST: the furniture is placed RIGIDLY (`drapeRigid`, the whole model at
            // its anchor's ground), so the head out over a sloping street is at the post's height. (When the mesh was
            // draped vertex by vertex this took the ground under each lens; after the change it put the lit lamp up on
            // the mast arm or down below the head — owner, 2026-10-16, 37.796241 −122.405121, BUGS.md #300.)
            const g = this.terrain.heightAt(px, pz)
            const at = l.at.map(([lx, ly, lz]) => [px + lx * cos + lz * sin, g + 0.15 + ly, pz - lx * sin + lz * cos]) as SignalHead['at']
            list.push({ nodeId: id, edgeId: a.edgeId, facing, scale: l.scale, at })
          }
        }
        // the stop bar across this arm's carriageway
        const bx = n.at.x + a.ux * (n.radius + 1.0)
        const bz = n.at.z + a.uz * (n.radius + 1.0)
        stopBar(markings, bx, bz, a.ux, a.uz, a.half * 1.9)
      }
    }

    /*
     * Retaining walls (BUGS.md #38): a street is level across its width at the highest ground under it, so on
     * a hillside its downhill side stands above the slope. Where it stands more than 0.6 m above the ground
     * just outside its corridor — and no other street's corridor is there — a dressed stone wall runs down
     * from its edge to the ground, with a low parapet where the drop is more than a metre and a half.
     */
    if (!this.off.has('roads')) {
      const pavedRings = (this.areasIn.get(k) ?? []).filter((a) => a.kind === 'paved').map((a) => a.ring)
      const pavedHere = (x: number, z: number): boolean => pavedRings.some((r) => {
        let o = false
        for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
          if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
        }
        return o
      })
      const walls = new MeshBuilder()
      const stone: [number, number, number] = [0.6, 0.57, 0.51]
      const cap: [number, number, number] = [0.7, 0.67, 0.61]
      // (a little darker than the park's ground tint: the wall's lit landmark material brightens what it is given)
      const TURF: [number, number, number] = [0.17, 0.25, 0.12]
      /*
       * A FLAT CARRIAGEWAY over the draped one, where the street is not on the ground (BUGS.md #221c/#221d).
       *
       * The road surface is pooled by surface and draped in one call — `heightAt` added at EVERY vertex,
       * including the kerb edges. On a road benched into a hillside that tilts the asphalt by the whole
       * cross-slope: measured 6.2 m across 24 m at Marine Drive, a 26% fall, while the markings, kerbs,
       * pavements and retaining wall all ride the street's own levelled height (BUGS.md #38). The paint
       * floats clear of the tarmac it is painted on, which is what the owner photographed.
       *
       * Rather than unpick the pooled drape — the most-used path in the renderer — this draws the
       * carriageway a second time, flat, at the street's own heights, in the WALK group. Babylon clears the
       * depth buffer between rendering groups, so a later group covers an earlier one whatever their depths:
       * the same trick the sports courts use to sit over their pitch. So the flat ribbon hides the draped
       * one on both sides, the uphill half included, where a depth test would have let it through.
       *
       * Only segments that are genuinely off the ground get one, by the same measure the wall uses — and
       * BOTH WAYS, unlike the wall: `ha - ga` is a fill (an embankment, which is what the wall marks) and
       * `ga - ha` is a cut (a bench into the slope, which nothing marked before).
       */
      const flat = new Map<string, MeshBuilder>()
      const FLAT_MIN = 0.6
      for (const e of groundEdges) {
        if (!e.heights || e.tunnel) continue
        const pts = unpackPoints(e.points)
        const half = (e.foot ? e.width / 2 : e.width / 2 + Math.max(e.walk, 0.6)) + 0.3
        /*
         * The wall is decided ONCE PER SIDE of the street, not per segment (owner, 2026-09-29, Taylor at Green on
         * Russian Hill: "the ground is very messed up… a very bumpy ground mesh"; "odd rendering glitches on steep
         * terrain changes"). Per segment, a wall came and went wherever the drop wavered round 0.6 m, and its
         * parapet jumped between 0.12 m and 0.9 m wherever it wavered round 1.5 m: a sawtooth along the kerb.
         * Now a side with a drop of 0.6 m anywhere is walled wherever it stands 0.3 m clear, and its parapet is
         * set by its worst drop.
         */
        const sideDrop = { [-1]: 0, [1]: 0 } as Record<number, number>
        for (let i = 1; i < pts.length; i++) {
          const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
          if (l < 0.2) continue
          const ux = (pts[i].x - pts[i - 1].x) / l
          const uz = (pts[i].z - pts[i - 1].z) / l
          for (const side of [-1, 1]) {
            const nx = -uz * side
            const nz = ux * side
            const r = half + 0.6
            sideDrop[side] = Math.max(sideDrop[side],
              e.heights[i - 1] - this.terrain.rawHeightAt(pts[i - 1].x + nx * r, pts[i - 1].z + nz * r),
              e.heights[i] - this.terrain.rawHeightAt(pts[i].x + nx * r, pts[i].z + nz * r))
          }
        }
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1]
          const b = pts[i]
          const l = Math.hypot(b.x - a.x, b.z - a.z)
          if (l < 0.2) continue
          const ux = (b.x - a.x) / l
          const uz = (b.z - a.z) / l
          if (!e.foot && e.width > 0) {
            const ha = e.heights[i - 1]
            const hb = e.heights[i]
            const hw = e.width / 2
            const px = -uz
            const pz = ux
            let off = 0
            for (const sd of [-1, 1]) {
              const gx = a.x + px * hw * sd
              const gz = a.z + pz * hw * sd
              const g = this.terrain.rawHeightAt(gx, gz)
              off = Math.max(off, Math.abs(ha - g))
            }
            if (off >= FLAT_MIN) {
              const out = flat.get(drawnSurface(e)) ?? new MeshBuilder()
              flat.set(drawnSurface(e), out)
              /*
               * TESSELLATED, and lifted a hair (BUGS.md #221d). One quad the full width of the carriageway
               * z-fought with the markings, which share this rendering group — the owner: *"it often has z
               * culling issues. maybe it needs more tesselation"*. A big quad interpolates depth across its
               * whole span, so at distance it trades pixels with anything within a few centimetres; cutting
               * it into ~2 m cells keeps the interpolated depth close to the real surface everywhere. The
               * 4 cm lift puts it clear of the draped carriageway beneath without reaching the markings,
               * which sit 6.3 cm up.
               */
              const LIFT = 0.04
              const nu = Math.max(1, Math.round((hw * 2) / 2))
              const nv = Math.max(1, Math.round(l / 2))
              const at = (u: number, v: number): [number, number, number] => {
                const t = v / nv
                const y = ha + (hb - ha) * t + LIFT
                const sd = -1 + (2 * u) / nu
                return [a.x + (b.x - a.x) * t + px * hw * sd, y, a.z + (b.z - a.z) * t + pz * hw * sd]
              }
              for (let u = 0; u < nu; u++) {
                for (let v = 0; v < nv; v++) {
                  out.quad([at(u, v), at(u, v + 1), at(u + 1, v + 1), at(u + 1, v)], [0, 1, 0],
                    [[0, 0], [0, 1], [1, 1], [1, 0]], [0.5, 0.5, 0.5], 0)
                }
              }
            }
          }
          for (const side of [-1, 1]) {
            const nx = -uz * side
            const nz = ux * side
            const ea = { x: a.x + nx * half, z: a.z + nz * half }
            const eb = { x: b.x + nx * half, z: b.z + nz * half }
            const ha = e.heights[i - 1]
            const hb = e.heights[i]
            const ga = this.terrain.rawHeightAt(ea.x + nx * 0.6, ea.z + nz * 0.6)
            const gb = this.terrain.rawHeightAt(eb.x + nx * 0.6, eb.z + nz * 0.6)
            const drop = Math.max(ha - ga, hb - gb)
            if (sideDrop[side] < 0.6 || drop < 0.3) continue
            const n: [number, number, number] = [nx, 0, nz]
            const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
            const q = (p0: { x: number; z: number }, p1: { x: number; z: number }, y00: number, y10: number, y11: number, y01: number, c: [number, number, number], nn = n): void => {
              walls.quad([[p0.x, y00, p0.z], [p1.x, y10, p1.z], [p1.x, y11, p1.z], [p0.x, y01, p0.z]], nn, UV, c, 0)
            }
            /*
             * A FOOT WAY gets no wall (Golden Gate Park audit, 2026-10-04: Strawberry Hill's trails, benched across its
             * slopes, stood in cream stone walls with parapets). A ground foot way is drawn DRAPED on the terrain (the
             * corridor layer), so a wall — or the earth bank tried first — from its levelled height stood as a ridge
             * beside a path lying on the ground.
             */
            // (any ground FOOT way: all are draped; stairs are drawn at their own heights, and keep theirs)
            if (e.foot && e.kind !== 'steps') continue
            // …nor a stairway in a park: its treads follow the hill (render/stairs.ts), and walls from the steps' levelled
            // heights stood as dark slabs up Strawberry Hill (2026-10-04); a city stair street keeps its walls
            if (e.kind === 'steps' && e.park) continue
            /*
             * A ROAD IN A PARK gets no parapet short of a real embankment, and its face is turf, not stone (Golden Gate
             * Park ride samples, 2026-10-05: JFK Drive by 36th Avenue, 1.5 m over a dip in the meadow by the terrain,
             * ran between a 0.9 m stone parapet like a viaduct's). A drive across a lawn sits on a grassy bank.
             */
            const parkBank = !!e.park && sideDrop[side] <= 3
            const parapet = !parkBank && sideDrop[side] > 1.5 ? 0.9 : 0.12
            const face = parkBank ? TURF : stone
            /*
             * In pieces of about 1.5 m, each built only where the ground beside it is OPEN (owner, 2026-10-01: walls
             * sticking into the crossing street at a junction). One test at the middle of a segment decided the whole
             * of it, so a segment ending in a junction carried its wall and parapet on across the other street's
             * carriageway. Now a piece whose outside is in another street's corridor, or on a paved square, is left
             * out, and the wall stops at the street it meets. The ground is sampled per piece, too, so the foot of a
             * long wall follows the slope instead of a straight line between its ends.
             */
            const span = Math.hypot(eb.x - ea.x, eb.z - ea.z)
            const pieces = Math.max(1, Math.ceil(span / 1.5))
            const P = (t: number): { x: number; z: number } => ({ x: ea.x + (eb.x - ea.x) * t, z: ea.z + (eb.z - ea.z) * t })
            const H = (t: number): number => ha + (hb - ha) * t
            const Gr = (t: number): number => { const p = P(t); return this.terrain.rawHeightAt(p.x + nx * 0.6, p.z + nz * 0.6) }
            for (let j = 0; j < pieces; j++) {
              const t0 = j / pieces
              const t1 = (j + 1) / pieces
              const pm = P((t0 + t1) / 2)
              const ox = pm.x + nx * 0.6
              const oz = pm.z + nz * 0.6
              // (nor, for a foot way, inside a hand-built model's footprint, which draws its own edges: the ferry floats,
              //  2026-10-04 — a STREET keeps its walls there: the bridges' footprints take in Doyle Drive and the Embarcadero)
              if (this.gradeAt(ox, oz) !== null || pavedHere(ox, oz) || (e.foot && this.inCover(ox, oz))) continue
              /*
               * …nor on a narrow ISLAND between two roads at the same level (Marin Headlands audit, 2026-10-05: wall
               * pieces stood like boards on the islands of Conzelman Road's junctions and round its roundabout). The
               * 0.6 m sample lands on the island's bare ground, which the coarse terrain leaves up to 3 m under the
               * levelled roads either side (measured there: island 91.3, the roads 91.3 and 94.7). Another street's
               * corridor within 4 m further out says the drop is an island between two roads, not an embankment.
               */
              let island = false
              for (const k of [1.5, 3, 4]) {
                if (this.gradeAt(ox + nx * k, oz + nz * k) !== null) { island = true; break }
              }
              if (island) continue
              const p0 = P(t0)
              const p1 = P(t1)
              const h0 = H(t0)
              const h1 = H(t1)
              /*
               * A park's bank SLOPES: from the road's edge out to the ground at about 1 in 2, not a vertical turf face
               * (Golden Gate Park views, 2026-10-05: on Transverse Drive the face stood across the meadow like a clipped
               * hedge). Its foot is found on the raw ground where it lands.
               */
              if (parkBank) {
                const run0 = Math.max(0.5, 2 * (h0 - Gr(t0))), run1 = Math.max(0.5, 2 * (h1 - Gr(t1)))
                const f0 = { x: p0.x + nx * run0, z: p0.z + nz * run0 }, f1 = { x: p1.x + nx * run1, z: p1.z + nz * run1 }
                const g0 = this.terrain.rawHeightAt(f0.x, f0.z) - 0.15, g1 = this.terrain.rawHeightAt(f1.x, f1.z) - 0.15
                const slope: [number, number, number] = [nx * 0.45, 0.9, nz * 0.45]
                walls.quad([[f0.x, g0, f0.z], [f1.x, g1, f1.z], [p1.x, h1 + 0.02, p1.z], [p0.x, h0 + 0.02, p0.z]], slope, UV, face, 0)
                continue
              }
              // the face, down to just under the ground, and the parapet's outer face above the street
              q(p0, p1, Gr(t0) - 0.3, Gr(t1) - 0.3, h1 + parapet, h0 + parapet, face)
              if (parapet > 0.2) {
                const i0 = { x: p0.x - nx * 0.3, z: p0.z - nz * 0.3 }
                const i1 = { x: p1.x - nx * 0.3, z: p1.z - nz * 0.3 }
                q(i1, i0, h1, h0, h0 + parapet, h1 + parapet, stone, [-nx, 0, -nz])
                walls.quad([[p0.x, h0 + parapet, p0.z], [p1.x, h1 + parapet, p1.z], [i1.x, h1 + parapet, i1.z], [i0.x, h0 + parapet, i0.z]], [0, 1, 0], UV, cap, 0)
              }
            }
          }
        }
      }
      for (const [surface, out] of flat) {
        if (out.triangles === 0) continue
        const m = new Mesh(`flatroad:${surface}:${k}`, this.scene)
        out.toVertexData().applyToMesh(m)
        m.material = surface === this.pkg.ground
          ? roadMaterial(this.scene, surface, this.roadAssets)
          : groundLayerMaterial(this.scene, this.roadAssets, surface, 'carriage')
        // the WALK group, not the road group: the depth buffer is cleared between groups, so this covers the
        // draped carriageway whatever their relative heights — including the uphill half of a cut
        m.renderingGroupId = GROUP.walk
        m.isPickable = false
        meshes.push(m)
      }
      if (walls.triangles > 0) {
        const m = new Mesh(`retaining:${k}`, this.scene)
        walls.toVertexData().applyToMesh(m)
        m.material = cartoonMaterial(this.scene, 'cartoonLandmark', false)
        m.renderingGroupId = GROUP.building
        m.isPickable = false
        meshes.push(m)
      }
    }

    /*
     * Bridges and ramps: solid decks at their own heights, in the building group, never draped — the one
     * part of the street network that is a structure rather than a painted surface (render/bridges.ts).
     */
    if (!this.off.has('bridges')) {
      const decks = new MeshBuilder()
      /*
       * What passes under a deck, for its piers (render/bridges.ts): the carriageways of this tile and the ones
       * round it, below the deck — a pier is not stood across a road.
       */
      let lower: { pts: { x: number; z: number }[]; h: number[]; half: number; id: number }[] | null = null
      const [dtx, dtz] = k.split(',').map(Number)
      const underDeck = (self: number) => (x: number, z: number, r: number, y: number): boolean => {
        if (!lower) {
          lower = []
          for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (const o of this.edgesIn.get(key(dtx + dx, dtz + dz)) ?? []) {
            if (o.foot || !o.heights || (o.tunnel && !o.bore)) continue
            lower.push({ pts: unpackPoints(o.points), h: o.heights, half: o.width / 2 + 0.5, id: o.id })
          }
        }
        for (const o of lower) {
          if (o.id === self) continue
          for (let i = 1; i < o.pts.length; i++) {
            const a = o.pts[i - 1]
            const dx = o.pts[i].x - a.x
            const dz = o.pts[i].z - a.z
            const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1e-9)))
            if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) > o.half + r) continue
            if (o.h[i - 1] + (o.h[i] - o.h[i - 1]) * t < y - 2.5) return true
          }
        }
        return false
      }
      /*
       * Another raised walk or deck at (x, z), within 1.5 m of height y (and not the edge itself): a deck's parapet is
       * left out where one stands beside it (bridges.ts `openRuns`) — the walks of a podium mapped side by side.
       */
      const raisedHere = [...(this.edgesIn.get(k) ?? []), ...[-1, 0, 1].flatMap((dz) => [-1, 0, 1].flatMap((dx) => (dx || dz) ? (this.edgesIn.get(key(Number(k.split(',')[0]) + dx, Number(k.split(',')[1]) + dz)) ?? []) : []))]
        .filter((o) => this.raisedIds.has(o.id) && o.heights)
        .map((o) => ({ id: o.id, pts: unpackPoints(o.points), h: o.heights!, half: (o.foot ? o.width / 2 : o.width / 2 + Math.max(0.6, o.walk)) + 0.3, road: o.foot ? 0 : o.width / 2 }))
      const besideOf = (self: number) => (x: number, z: number, y: number): boolean => {
        for (const o of raisedHere) {
          if (o.id === self) continue
          for (let i = 1; i < o.pts.length; i++) {
            const a = o.pts[i - 1]
            const dx = o.pts[i].x - a.x
            const dz = o.pts[i].z - a.z
            const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1e-9)))
            if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) > o.half) continue
            if (Math.abs(o.h[i - 1] + (o.h[i] - o.h[i - 1]) * t - y) < 1.5) return true
          }
        }
        return false
      }
      // another raised ROAD's carriageway at (x, z), within 1.5 m of height y (and not the edge itself): a deck's
      // pavement is left off it (bridges.ts `deck`)
      const carriageOf = (self: number) => (x: number, z: number, y: number): boolean => {
        for (const o of raisedHere) {
          if (o.id === self || o.road <= 0) continue
          for (let i = 1; i < o.pts.length; i++) {
            const a = o.pts[i - 1]
            const dx = o.pts[i].x - a.x
            const dz = o.pts[i].z - a.z
            const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1e-9)))
            if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) > o.road) continue
            if (Math.abs(o.h[i - 1] + (o.h[i] - o.h[i - 1]) * t - y) < 1.5) return true
          }
        }
        return false
      }
      for (const e of this.edgesIn.get(k) ?? []) {
        // (a way the region authored is drawn by the model it belongs to — the Bay Bridge Bikeway's helix)
        if (!this.raisedIds.has(e.id) || e.authored) continue
        /*
         * A way a hand-built model draws (`coveredDecks`) is still drawn HERE where it runs on outside the model's
         * footprint: the Golden Gate's carriageways are one way each from mid-span to the toll plaza, the model's
         * deck is straight, and the last 60 m of road swing east off it — where the cars drove on nothing.
         */
        // (a way rising more than it runs is a lift or a stair core OSM drew as a bridge — 78924 at Embarcadero Center
        // climbs 8 m in 4: drawn, it is a slab standing across the walk beneath; not a deck anyone rides)
        if (steeperThanWall(e)) continue
        for (const part of this.coveredDecks.has(e.id) ? this.outsideCovers(e) : [e]) {
          deck(decks, part, this.terrain, this.deckWalk.get(e.id), this.region.riverDrop ?? 0, e.bridge === true && this.structured(e),
            e.name !== undefined && (this.region.elevatedWalks ?? []).some((w) => w.name === e.name), underDeck(e.id), besideOf(e.id),
            carriageOf(e.id))
        }
      }
      const railColour = hexRgb(this.region.elevatedRailColour)
      const [rtx, rtz] = k.split(',').map(Number)
      const railRect = { x0: rtx * TILE, z0: rtz * TILE, x1: (rtx + 1) * TILE, z1: (rtz + 1) * TILE }
      const parisViaduct = this.region.viaduct === 'paris' ? { stations: this.viaductStations } : undefined
      for (const r of this.railsIn.get(k) ?? []) railDeck(decks, r, this.terrain, railColour, railRect, parisViaduct)
      if (decks.triangles > 0) {
        const m = new Mesh(`decks:${k}`, this.scene)
        decks.toVertexData().applyToMesh(m)
        const mat = cartoonMaterial(this.scene, 'cartoonDeck', false)
        mat.backFaceCulling = false
        m.material = mat
        m.renderingGroupId = GROUP.building
        m.isPickable = false
        meshes.push(m)
      }
    }

    /*
     * The furniture OSM mapped at points, in the region's own designs: a Guimard entrance and a Wallace
     * fountain in Paris, globe lamps over a New York stair. Each is turned to run along the nearest street.
     */
    const pf = this.region.pointFurniture
    const bikes = bikeDocks(hexRgb(pf.bikeColour))
    // (the kinds that belong on a pavement, never in a road or its median, whatever OSM says — Carriageways.noFurniture;
    // signals, tram and bus stops and métro entrances do stand in the middle of a road)
    // (from this tile and its neighbours: a stop near the edge of the tile stands by a street that may be in the next one)
    const pointKerb = new Carriageways(around.filter((e) => !this.raisedIds.has(e.id)))
    const kerbOnly = new Set(['column', 'kiosk', 'billboard', 'postbox', 'hydrant', 'bikeshare', 'fountain'])
    // (one billboard where OSM maps two a few metres apart — the two faces of one sign, or one sign twice: 14.6 m boards
    //  2-8 m apart stood through each other and fought — owner, 2026-10-06, "billboards have z fighting")
    const boards: { x: number; z: number }[] = []
    let metroRings: { x: number; z: number }[][] | null = null
    for (const f of this.pointsIn.get(k) ?? []) {
      if (kerbOnly.has(f.kind) && skippedIf(pointKerb.whyNoFurniture(f.x, f.z), f.x, f.z, `osm ${f.kind}`)) continue
      if (f.kind === 'billboard') {
        if (boards.some((q) => Math.hypot(q.x - f.x, q.z - f.z) < 16)) continue
        boards.push({ x: f.x, z: f.z })
      }
      // a subway entrance a model draws itself (its `coversRaised` footprint): the open BART plazas on Mission Street
      if (f.kind === 'metro' && this.inCover(f.x, f.z)) continue
      const heading = this.streetBearing(f.x, f.z, f.kind === 'bikeshare' || f.kind === 'column')
      const model = f.kind === 'metro'
        ? ({ guimard: guimardEntrance, nyc: nycSubwayEntrance, cta: ctaEntrance, generic: genericEntrance, bart: bartEntrance })[pf.metro]
        : f.kind === 'fountain' ? (pf.fountain === 'wallace' || f.wallace ? wallaceFountain : drinkingTap)
        : f.kind === 'column' ? morrisColumn
        : f.kind === 'kiosk' ? (pf.kiosk === 'paris' ? parisNewsstand : kiosk)
        : f.kind === 'bikeshare' ? bikes
        // the American street's (render/us-furniture.ts), in the regions that have one
        : pf.american && f.kind === 'stop' ? stopSign
        : pf.american && f.kind === 'postbox' ? uspsBox
        : pf.american && f.kind === 'billboard' ? (o: MeshBuilder) => billboard(o, Math.round(f.x * 7 + f.z * 13))
        : f.kind === 'busstop' && pf.busStop ? (pf.busStop === 'muni' ? muniStop : plainStop)
        : null          // (drawn elsewhere: tram stops by the trams, hydrants along every pavement)
      /*
       * A street clock on its post (OSM amenity=clock, support=pole): the dark iron column, the drum head and its four
       * dials, which tell the real time (render/clocks.ts; owner, 2026-10-04 — Union Square's sidewalk clock).
       */
      if (f.kind === 'clock') {
        placeModel(furniture, streetClockPost, f.x, 0.15, f.z, heading)
        for (let q = 0; q < 4; q++) {
          const a = heading + (q * Math.PI) / 2
          clockFace(furniture, f.x + Math.sin(a) * 0.42, 0.15 + 4.1, f.z + Math.cos(a) * 0.42, Math.sin(a), Math.cos(a), 0.36,
            { rim: [0.12, 0.16, 0.13], out: 0.01 })
        }
        continue
      }
      if (!model) continue
      /*
       * A stop sign and a bus stop stand ON THE PAVEMENT, not in the road where OSM often puts the node. They were
       * pushed a fixed 5 m to one side, which on a wide street was still the traffic lane (owner, 2026-10-14: Muni's
       * flag pole "in the lane"); now the push is only for a node in a carriageway, and then onto the nearest pavement
       * (city/carriageways.ts `toPavement`).
       */
      const kerb = f.kind === 'stop' || f.kind === 'busstop' ? 5 : 0
      let px = f.x
      let pz = f.z
      if (kerb) {
        if (pointKerb.inside(px, pz, 0.3)) { px += Math.cos(heading) * kerb; pz -= Math.sin(heading) * kerb }
        ;({ x: px, z: pz } = pointKerb.toPavement(px, pz))
      }
      /*
       * A billboard turned to run along the street is a thin edge to anyone riding up it, and only glimpsed at a
       * grazing angle riding past (owner, 2026-10-02: "billboards look really bad"). Real bulletins are angled to the
       * traffic: turned 35° off the street line, half toward each direction, the face reads from a block away and the
       * board overhangs the kerb by no more than its catwalk.
       */
      const turn = f.kind === 'billboard' ? (Math.round(f.x * 7 + f.z * 13) % 2 ? 1 : -1) * 0.61 : 0
      /*
       * A SUBWAY ENTRANCE is big — BART's is 4.4 m wide and 13 m long, laid along the street — and OSM's node is its
       * middle: a node 3 m from the kerb put its outer half in the traffic lane (owner, 2026-10-15, Market at New
       * Montgomery: "metro station partially in road"). Moved away from the nearest carriageway until its whole outline
       * (its long side along the street, `heading`) is clear of every one.
       */
      if (f.kind === 'metro') {
        const along = { x: Math.sin(heading), z: Math.cos(heading) }
        const across = { x: Math.cos(heading), z: -Math.sin(heading) }
        const corners = (cx: number, cz: number): { x: number; z: number }[] => [-1, 1].flatMap((a) => [-1, 1].map((c) =>
          ({ x: cx + along.x * a * 6.9 + across.x * c * 2.3, z: cz + along.z * a * 6.9 + across.z * c * 2.3 })))
        const inLane = (cx: number, cz: number): boolean => corners(cx, cz).some((q) => pointKerb.inside(q.x, q.z, 0.2))
        if (inLane(px, pz)) {
          // which way is away from the road: the side of the nearest carriageway the node is on
          const nr = pointKerb.near(px, pz).sort((a, b) => a.d - b.d)[0]
          const sgn = nr ? Math.sign((px - nr.s.ax) * across.x + (pz - nr.s.az) * across.z) || 1 : 1
          let moved = false
          for (let k = 1; k <= 20 && !moved; k++) {
            const cx = px + across.x * sgn * 0.5 * k, cz = pz + across.z * sgn * 0.5 * k
            if (!inLane(cx, cz)) { px = cx; pz = cz; moved = true }
          }
          if (!moved && skippedIf('road', px, pz, 'metro entrance')) continue
        }
        /*
         * …nor into a building (owner, 2026-10-16, Stockton at Washington: "a muni metro station halfway inside a
         * building", twice): the push off the road, or OSM's node on a narrow pavement, left half the headhouse in the
         * block. Slid along the street until it is clear of both, else not drawn — an entrance with no room for a
         * headhouse is one built into the building, which the building already is.
         */
        metroRings ??= (() => {
          const rs: { x: number; z: number }[][] = []
          for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
            for (const b of this.buildingsIn.get(key(ktx + dx, ktz + dz)) ?? []) if ((b.minHeight ?? 0) < 3) rs.push(unpackPoints(b.ring))
          }
          return rs
        })()
        const inBlock = (cx: number, cz: number): boolean => [{ x: cx, z: cz }, ...corners(cx, cz)].some((q) => metroRings!.some((r) => insideRing(r, q.x, q.z)))
        // OSM's node itself inside a building: the entrance is IN it (Chinatown–Rose Pak's headhouse is its own building)
        if (metroRings.some((r) => insideRing(r, f.x, f.z)) && skippedIf('building', f.x, f.z, 'metro entrance')) continue
        if (inBlock(px, pz)) {
          let found = false
          for (let k = 1; k <= 24 && !found; k++) {
            for (const sg of [1, -1]) {
              const cx = px + along.x * sg * 0.5 * k, cz = pz + along.z * sg * 0.5 * k
              if (!inBlock(cx, cz) && !inLane(cx, cz)) { px = cx; pz = cz; found = true; break }
            }
          }
          if (!found && skippedIf('building', px, pz, 'metro entrance')) continue
        }
      }
      placeModel(furniture, model, px, 0.15, pz, heading + turn)
    }

    /*
     * Lamps on the walls, where the region hangs them there (Paris): on every street-facing wall long
     * enough to carry one, one every sixteen metres or so, at first-floor height.
     */
    if (this.region.furniture.wallLamps) {
      for (const b of this.buildingsIn.get(k) ?? []) {
        if ((b.minHeight ?? 0) > 2) continue
        // under the roofline of a low building, and none at all on a single-storey one — a lantern on a
        // bracket above a shop's parapet is a lantern standing on the roof
        const top = b.height ?? (b.levels ? b.levels * 3.3 : 12)
        if (top < 5.2) continue
        const lampY = Math.min(4.4, top - 1.0)
        const ring = unpackPoints(b.ring)
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i]
          const c = ring[(i + 1) % ring.length]
          const ex = c.x - a.x
          const ez = c.z - a.z
          const len = Math.hypot(ex, ez)
          if (len < 8) continue
          // the ring is anticlockwise, so the outward normal of a→c is (ez, −ex)
          const nx = ez / len
          const nz = -ex / len
          if (!facesStreet(this.streets, (a.x + c.x) / 2, (a.z + c.z) / 2, nx, nz)) continue
          const n = Math.max(1, Math.floor(len / 16))
          for (let j = 0; j < n; j++) {
            const t = (j + 0.5) / n
            placeModel(furniture, wallLamp, a.x + ex * t + nx * 0.02, lampY, a.z + ez * t + nz * 0.02, Math.atan2(nx, nz))
          }
        }
      }
    }

    if (furniture.triangles > 0 && !this.off.has('furniture')) {
      const m = new Mesh(`street:${k}`, this.scene)
      drapeRigid(furniture, this.terrain)
      furniture.toVertexData().applyToMesh(m)
      // the static variant: street furniture is baked into the tile, not instanced
      m.material = cartoonMaterial(this.scene, 'cartoonStatic', false)
      m.renderingGroupId = GROUP.building
      meshes.push(m)
      // the street clocks' hands, on the same ground as the dials they turn over
      if (furniture.clocks.length) {
        for (const c of furniture.clocks) c.y += this.terrain.heightAt(c.x, c.z)
        this.clockHands.raise(furniture.clocks, m, `street:${k}`)
      }
    }

    const byStyleSpans = new Map<StyleId, [number, number][]>()
    const byStyle = new Map<StyleId, MeshBuilder>()
    const sunOff = shadowOffset(DAYLIGHT.sun)
    for (const b of this.buildingsIn.get(k) ?? []) {
      // a `building:part` of a bridge a landmark draws itself (BUGS.md #211)
      if (this.coversBuilding(b)) continue
      // curves as chords a bay or more long: a hemicycle mapped in 3 m pieces had no wall wide enough for one
      // window (the Institut de France's wings were blank)
      const ring = simplifyRing(unpackPoints(b.ring)) as Ring
      /*
       * A building stands on a LEVEL pad, at the ground height under the middle of its footprint. Draping
       * its walls the way the road is draped would shear them: a terraced block on a San Francisco hill
       * would lean, and its windows with it. Real buildings on a slope are cut into it, which is what a pad
       * is — and it puts a small step at the door, which is also what happens.
       */
      /*
       * The pad's floor is a LOW PERCENTILE of the ground under the footprint, not its minimum (BUGS.md
       * #206d). A minimum is precisely the statistic that degrades as sampling gets finer: a 20 m grid puts
       * about three samples under a typical footprint and a 4 m grid about thirty, and the minimum of
       * thirty samples of a real surface — which at 4 m carries kerbs, area steps and tree mounds — sits
       * systematically lower than the minimum of three. Every building would sink and grow a taller plinth
       * on its downhill side, worse the bigger the footprint and the steeper the hill.
       *
       * MEASURED on 7 481 buildings across the steep grid from Nob Hill to the waterfront, comparing the
       * shipped 20 m grid with a zoom-15 4 m one: under a raw minimum the base sinks by a mean of 0.63 m,
       * p90 1.77 m, p99 3.34 m and worst 10.27 m. The 15th percentile of the outline takes that to a mean
       * of 0.37 m, p90 1.52 m, p99 2.92 m — it removes about 40%, which is the part that WAS sampling
       * noise. The rest is the two surfaces genuinely disagreeing about where the ground is, and no
       * statistic should remove that; the finer one is the better measurement.
       *
       * The intent is kept — the building meets the ground low, not at its average — without inheriting the
       * noise floor. A ring with under eight samples keeps the true minimum: there is no distribution to
       * take a percentile of, and those are the footprints where the minimum was never the problem.
       */
      /*
       * The walls start at the LOWEST ground the footprint touches, not at the pad. On a hill the downhill
       * side of a level pad hangs in the air, and a street of buildings on plinths with daylight under them
       * is worse than no terrain at all. Starting low buries the difference in the hillside, which is what
       * a real building cut into a slope does.
       */
      /*
       * EXPLICIT Z (map format v3): a baked city says where each building's walls start (`baseY`), and the
       * renderer takes it rather than sampling the ground. A v2 city has none and is placed exactly as before.
       * `?zcheck=1` computes the old way too and records how far the two disagree (window.__zcheck).
       */
      let foot: number
      let pad: number
      if (b.baseY === undefined) {
        ({ foot, pad } = buildingFooting(ring, (x, z) => this.terrain.heightAt(x, z)))
      } else {
        foot = b.baseY
        let cx = 0
        let cz = 0
        for (const q of ring) { cx += q.x; cz += q.z }
        pad = this.terrain.heightAt(cx / ring.length, cz / ring.length)
        if (ZCHECK) zcheck(b.id, foot, buildingFooting(ring, (x, z) => this.terrain.heightAt(x, z)).foot)
      }
      // (`?labels=1`: a building with a street-photo label is drawn as the label says — src/city/appearance.ts)
      const look = LOOKS_ON ? lookFor(b.id, b.style) : null
      const styleId = look?.style ?? b.style
      // (a label's storey count wins, and the walls are kept within what that many storeys can be: a one-storey shop the
      //  map calls 12 m — its billboard — was drawn with two rows of windows)
      const lv = look?.levels
      // (and the count holds: `stretch` keeps it however the height stretches the storeys)
      const height = lv && b.height ? Math.min(Math.max(b.height, lv * 2.9), lv * 3.3 + 0.8) : b.height
      const plan = planFacade(styleId, b.id, { levels: lv ?? b.levels, height, minHeight: b.minHeight, stretch: b.stretch || !!lv, noShops: b.noShops },
        b.palette ? [b.palette] : this.region.palettes[styleId], look ?? undefined)
      const out = byStyle.get(styleId) ?? new MeshBuilder()
      byStyle.set(styleId, out)
      if (this.pickable) {
        const spans = (byStyleSpans.get(styleId) ?? byStyleSpans.set(styleId, []).get(styleId)!)
        spans.push([out.indices.length / 3, b.id])
      }
      buildBuilding(out, ring, plan, this.atlas, b.id, 0.16 + foot,
        // (a label's roof: a gable, a hip or a mansard is most of a small building's outline against the sky)
        look?.roof ? { shape: look.roof, height: b.roofHeight ?? Math.min(4, 1.2 + plan.height * 0.18), direction: b.roofDirection, colour: b.roofColour }
          : { shape: b.roof, height: b.roofHeight, direction: b.roofDirection, colour: b.roofColour },
        this.region.roofscape, (i) => {
          // the ring is anticlockwise, so the outward normal of a→c is (ez, −ex)
          const a = ring[i]
          const c = ring[(i + 1) % ring.length]
          const len = Math.hypot(c.x - a.x, c.z - a.z) || 1
          /*
           * Generous reach: a boulevard's shops stand behind a wide pavement and often a cycle track. And a
           * street is a main street by its NAME: Rue Saint-Antoine is mapped in pieces — side carriageways as
           * "residential", a cycle track — whose kinds alone would leave its cafés without their awnings.
           */
          if (!this.awningStreets) {
            const mainNames = new Set(this.nearEdges.filter((e) => MAIN_STREETS.has(e.kind) && e.name).map((e) => e.name))
            const road = this.nearEdges.filter((e) => !e.foot)
            this.awningStreets = streetIndex(road, 8)
            this.mainStreets = streetIndex(road.filter((e) => MAIN_STREETS.has(e.kind) || (e.name && mainNames.has(e.name))), 10)
          }
          const nx = (c.z - a.z) / len
          const nz = -(c.x - a.x) / len
          const rate = this.region.awnings ?? 0.3
          const rise = this.terrain.heightAt((a.x + c.x) / 2 + nx * 2, (a.z + c.z) / 2 + nz * 2) - (0.16 + foot)
          // sampled along the wall, not only at its middle: a block-long facade's midpoint can be further
          // from the street's indexed segments than the search looks
          const n = Math.max(1, Math.min(8, Math.round(len / 12)))
          const t = (k: number): [number, number] => {
            const f = (k + 0.5) / n
            return [a.x + (c.x - a.x) * f, a.z + (c.z - a.z) * f]
          }
          const pavement = (): number | null => pavementDepth(this.awningStreets!, (a.x + c.x) / 2, (a.z + c.z) / 2, nx, nz)
          for (let k = 0; k < n; k++) if (facesStreet(this.mainStreets!, ...t(k), nx, nz)) return { rate, main: true, rise, pavement: pavement() }
          for (let k = 0; k < n; k++) if (facesStreet(this.awningStreets, ...t(k), nx, nz)) return { rate: rate * 0.35, main: false, rise, pavement: pavement() }
          return null
        }, this.off.has('courts') ? [] : (b.holes ?? []).map(unpackPoints), this.archesFor(b, ring, plan.height))
      // a label's sign, read off the photograph, over the ground floor of its longest street wall (`?labels=1`)
      if (look?.sign) {
        let best = -1, bestLen = 0
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i], c = ring[(i + 1) % ring.length]
          const len = Math.hypot(c.x - a.x, c.z - a.z)
          const nx = (c.z - a.z) / (len || 1), nz = -(c.x - a.x) / (len || 1)
          const near = this.awningStreets && facesStreet(this.awningStreets, (a.x + c.x) / 2, (a.z + c.z) / 2, nx, nz)
          if (len > 3 && (near ? len + 1000 : len) > bestLen) { best = i; bestLen = near ? len + 1000 : len }
        }
        if (best >= 0) {
          const a = ring[best], c = ring[(best + 1) % ring.length]
          const len = Math.hypot(c.x - a.x, c.z - a.z)
          const nx = (c.z - a.z) / len, nz = -(c.x - a.x) / len
          const m = flatSignMesh(this.scene, {
            spec: { type: 'flat', text: look.sign, h: 0.42, face: 'grotesque', weight: 'bold', colour: [0.97, 0.96, 0.92], panel: [0.12, 0.12, 0.13], lit: 'none', w: Math.min(len * 0.8, 9) },
            x: (a.x + c.x) / 2, y: 0.16 + foot + plan.storeys[0].y1 + 0.45, z: (a.z + c.z) / 2, heading: Math.atan2(nx, nz),
          }, `labelsign:${b.id}`)
          if (m) { m.renderingGroupId = GROUP.building; meshes.push(m) }
        }
      }
      // the shadow this building throws across the street, as geometry; see shadows.ts
      if (!this.off.has('shadows')) {
        addShadow(shadows, ring, plan.height + b.roofHeight * 0.6 + (pad - foot), sunOff, SHADOW_Y)
      }
    }

    if (shadows.triangles > 0) {
      const m = new Mesh(`shadow:${k}`, this.scene)
      this.terrain.drape(shadows.positions)
      shadows.toVertexData().applyToMesh(m)
      m.material = shadowMaterial(this.scene)
      // after the ground and its markings, before nothing: a shadow multiplies whatever it lands on
      m.renderingGroupId = GROUP.walk
      m.isPickable = false
      meshes.push(m)
    }
    for (const [style, out] of byStyle) {
      if (this.off.has('buildings')) break
      const m = new Mesh(`b:${style}:${k}`, this.scene)
      out.toVertexData().applyToMesh(m)
      if (this.pickable) m.metadata = { buildingSpans: byStyleSpans.get(style) ?? [] }
      m.material = facadeMaterial(this.scene, style, this.assets)
      m.renderingGroupId = GROUP.building
      meshes.push(m)
    }

    /*
     * Everything in a tile is static and nothing picks it, so the CPU copy of its vertex data that Babylon
     * keeps after upload is dead weight — and in the Marais it was 1.2 GB of plain JS number arrays for the
     * buildings alone (9 M vertices), enough to run the tab out of memory.
     */
    for (const m of meshes) {
      m.isPickable = this.pickable
      if (!this.pickable) m.geometry?.clearCachedData()
    }
    this.tiles.set(k, { meshes, layers: new Map() })
  }

  /**
   * The streets in and around the rider's tile — what the traffic and the crowd populate. Handing them the
   * same buckets the renderer uses keeps the two in step: a car never appears on a street that has not been
   * built, and never survives on one that has been dropped.
   */
  /**
   * One set of lights per junction. A mapped signal node is near several graph nodes — the junction itself,
   * the node where a crossing meets the road a few metres in, a dual carriageway's second node — and every
   * one of them was getting lights on every arm: a thicket of poles inside the junction. So a two-arm node
   * keeps its lights only as a mid-block crossing, well clear of any real junction, and among light-bearing
   * nodes within 18 m of each other only the one with the most roads keeps them. The same goes for the
   * three-carriageway rule, so a dual-carriageway crossroads drawn as four nodes gets one set, not four.
   */
  /** The bearing of the nearest carriageway to a point, so furniture stands along the street, not across it. */
  /** the passages, bucketed by 50 m cell, built on first use */
  private passageGrid: Map<string, PackedEdge[]> | null = null
  private passageFor: PackedEdge[] | null = null
  /** the edges round the tile being built */
  private nearEdges: PackedEdge[] = []

  /** Where passages cut arches through this building's walls (render/passages.ts), as a per-wall lookup. */
  private archesFor(b: PackedBuilding, ring: { x: number; z: number }[], height: number): ((i: number) => Arch[]) | undefined {
    if (!this.passageGrid || this.passageFor !== this.nearEdges) {
      this.passageGrid = new Map()
      this.passageFor = this.nearEdges
      for (const e of this.nearEdges) {
        if (!e.passage) continue
        const seen = new Set<string>()
        for (let i = 0; i < e.points.length; i += 2) {
          const k = `${Math.floor(e.points[i] / 50)},${Math.floor(e.points[i + 1] / 50)}`
          if (seen.has(k)) continue
          seen.add(k)
          ;(this.passageGrid.get(k) ?? this.passageGrid.set(k, []).get(k)!).push(e)
        }
      }
    }
    if ((b.minHeight ?? 0) > 0.5) return undefined
    const near = new Set<PackedEdge>()
    for (const q of ring) {
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        for (const e of this.passageGrid.get(`${Math.floor(q.x / 50) + dx},${Math.floor(q.z / 50) + dz}`) ?? []) near.add(e)
      }
    }
    if (near.size === 0) return undefined
    const byWall = passageArches(ring, height, [...near])
    return byWall.size === 0 ? undefined : (i) => byWall.get(i) ?? []
  }

  /** the bearing of the nearest carriageway — or, with `pedestrian`, of a pedestrian street too (a dock or
   * stand in one follows it, not the road crossing its end: BUGS.md #17, Rue Tiron) */
  streetBearing(x: number, z: number, pedestrian = false): number {
    const [tx, tz] = tileOf(x, z)
    let best = Infinity
    let heading = 0
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (const e of this.edgesIn.get(key(tx + dx, tz + dz)) ?? []) {
          if (e.foot && !(pedestrian && e.kind === 'pedestrian')) continue
          for (let i = 2; i < e.points.length; i += 2) {
            const ax = e.points[i - 2], az = e.points[i - 1], bx = e.points[i], bz = e.points[i + 1]
            const sx = bx - ax, sz = bz - az
            const l2 = sx * sx + sz * sz || 1
            const t = Math.max(0, Math.min(1, ((x - ax) * sx + (z - az) * sz) / l2))
            const d = Math.hypot(x - ax - sx * t, z - az - sz * t)
            if (d < best) { best = d; heading = Math.atan2(sx, sz) }
          }
        }
      }
    }
    return heading
  }

  edgesNear(x: number, z: number): number[] {
    const [cx, cz] = tileOf(x, z)
    const out: number[] = []
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const got = this.edgesIn.get(key(cx + dx, cz + dz))
        if (got) for (const e of got) out.push(e.id)
      }
    }
    return out
  }

  get built(): number { return this.tiles.size }
  get name(): string { return this.pkg.name }
}

function hexRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255]
}

export { simplifyRing }

const ZCHECK = typeof location !== 'undefined' && new URLSearchParams(location.search).get('zcheck') === '1'
/** `?zcheck=1`: baked building feet against the ones the renderer would have computed, for measuring map v3 */
function zcheck(id: number, baked: number, computed: number): void {
  const w = window as unknown as { __zcheck?: { n: number; sumAbs: number; max: number; worst: number; over5cm: number } }
  const s = (w.__zcheck ??= { n: 0, sumAbs: 0, max: 0, worst: 0, over5cm: 0 })
  const d = Math.abs(baked - computed)
  s.n++
  s.sumAbs += d
  if (d > 0.05) s.over5cm++
  if (d > s.max) { s.max = d; s.worst = id }
}

/** A ring clipped to an axis-aligned box (Sutherland–Hodgman, one side at a time). */
function clipToBox(ring: { x: number; z: number }[], x0: number, z0: number, x1: number, z1: number): { x: number; z: number }[] {
  type P = { x: number; z: number }
  const side = (pts: P[], inside: (p: P) => boolean, cut: (a: P, b: P) => P): P[] => {
    const out: P[] = []
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length]
      const ia = inside(a), ib = inside(b)
      if (ia) out.push(a)
      if (ia !== ib) out.push(cut(a, b))
    }
    return out
  }
  const atX = (x: number) => (a: P, b: P): P => ({ x, z: a.z + ((x - a.x) / (b.x - a.x)) * (b.z - a.z) })
  const atZ = (z: number) => (a: P, b: P): P => ({ x: a.x + ((z - a.z) / (b.z - a.z)) * (b.x - a.x), z })
  let r = ring
  r = side(r, (p) => p.x >= x0, atX(x0))
  r = side(r, (p) => p.x <= x1, atX(x1))
  r = side(r, (p) => p.z >= z0, atZ(z0))
  r = side(r, (p) => p.z <= z1, atZ(z1))
  return r
}

/** a raised way any of whose segments climbs more than it runs (see the deck loop) */
