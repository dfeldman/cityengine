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
import type { Scene } from '@babylonjs/core/scene'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { MeshBuilder, buildBuilding, capPolygon, capPolygonWithHoles, type Arch, type AtlasManifest, type Ring } from './buildings.ts'
import { archSize, passageArches } from './passages.ts'
import { inOutline } from './bridge-structures.ts'
import { facadeMaterial } from './facade-material.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { groundLayerMaterial, roadMaterial } from './road-material.ts'
import { addShadow, shadowMaterial, shadowOffset, SHADOW_Y } from './shadows.ts'
import { DAYLIGHT } from './facade-material.ts'
import {
  bench, bikeDocks, bollard, hydrant, ctaEntrance, drinkingTap, genericEntrance, guimardEntrance, kiosk, lampPost,
  morrisColumn, nycSubwayEntrance, parisNewsstand, trafficLight, trafficLightMast, trafficLightParis, wallaceFountain,
  wallLamp,
} from './models.ts'
import { facesStreet, pavementDepth, streetIndex, type StreetIndex } from '../city/frontage.ts'
import { region, type Region } from '../city/region.ts'
import { pointAlong } from '../sim/navigate.ts'
import { waterMaterial } from './water-material.ts'
import { planFacade, type StyleId } from '../city/facade.ts'
import { Terrain } from '../city/terrain.ts'
import { unpackPoints, type CityPackage, type PackedArea, type PackedBuilding, type PackedEdge, type PackedFurniture, type PackedRail } from '../city/package.ts'
import { BRIDGE_STYLES, deck, isRaised, railDeck } from './bridges.ts'
import { TILE, nearOf, tileKey, tileOf, type Near, type TileData, type TileSource } from '../city/tiles.ts'

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
const BUILD_MS = 7
/** The mid ring's reach in tiles (PARIS_EXPAND §2: massing out to ~1200 m). */
export const MID = 6
import { onSurface, waterLevels, wholeWater } from '../city/package.ts'

/** Tile size in metres: the ONE grid, shared with the bake (city/tiles.ts). */
export { TILE }
/** How far from the rider tiles are kept built. */
export const VIEW = 3

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
  /** one per street leaving here; `foot` arms shape the pavement but never the carriageway */
  arms: { ux: number; uz: number; half: number; foot: boolean; surface: string; raised?: boolean }[]
}

/** What the city needs up front: the index's global part (city/tiles.ts `CityIndex`). */
export type CityMeta = Pick<CityPackage, 'name' | 'ground' | 'region' | 'terrain' | 'water'>

const key = tileKey

const YELLOW: [number, number, number] = [0.89, 0.71, 0.0]

/** The colours of the ground, which are not part of any building's palette. The carriageway is not here:
 * its colour comes from its own painted surface page, through `src/render/road-material.ts`. */
const AREA_TINT: Record<PackedArea['kind'], [number, number, number]> = {
  park: [0.33, 0.44, 0.26], grass: [0.36, 0.47, 0.28], wood: [0.24, 0.34, 0.20],
  pitch: [0.32, 0.45, 0.30], water: [0.20, 0.30, 0.38],
  // a paved square: warm stone setts and stabilised sand, paler than a pavement (BUGS.md #22)
  paved: [0.62, 0.58, 0.51],
}
// Paving is grey, not white. The brighter value washed out every street it was laid in.
const PAVEMENT: [number, number, number] = [0.52, 0.51, 0.485]



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
                   tint: [number, number, number]): void {
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
    out.quad(
      [[a.x + nx - ex, y, a.z + nz - ez], [a.x - nx - ex, y, a.z - nz - ez],
       [b.x - nx + ex, y, b.z - nz + ez], [b.x + nx + ex, y, b.z + nz + ez]],
      [0, 1, 0],
      [[h, 0], [-h, 0], [-h, len], [h, len]],
      tint, 0,
    )
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
        const hx = (-uz * width) / 2
        const hz = (ux * width) / 2
        out.quad(
          [[x0 + hx, y, z0 + hz], [x0 - hx, y, z0 - hz], [x1 - hx, y, z1 - hz], [x1 + hx, y, z1 + hz]],
          [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], white, 0,
        )
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
function distantGround(scene: Scene, terrain: Terrain, pkg: CityPackage, assets: string): Mesh | null {
  const t = pkg.terrain
  if (!t) return null
  const out = new MeshBuilder()
  // full resolution, the same grid as the depth occluder: at half resolution the drawn ground ran lower than
  // the occluder on slopes, and buildings beyond the box stood on nothing, their bases hidden (user report)
  const stride = 1
  const step = t.step * stride
  for (let r = 0; r + stride < t.rows; r += stride) {
    for (let c = 0; c + stride < t.cols; c += stride) {
      const x = t.x0 + c * t.step
      const z = t.z0 + r * t.step
      const h = (cx: number, cz: number): number => t.heights[cz * t.cols + cx]
      out.quad(
        [[x, h(c, r), z], [x + step, h(c + stride, r), z],
         [x + step, h(c + stride, r + stride), z + step], [x, h(c, r + stride), z + step]],
        [0, 1, 0],
        [[0, 0], [step, 0], [step, step], [0, step]],
        [0.5, 0.5, 0.5], 0,
      )
    }
  }
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
  const m = new Mesh('ground:distant', scene)
  out.toVertexData().applyToMesh(m)
  m.geometry?.clearCachedData()
  m.material = roadMaterial(scene, pkg.ground, assets)
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
function groundOccluder(scene: Scene, pkg: CityPackage, drop = 0): void {
  const t = pkg.terrain
  if (!t) return
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
  const wetOnly = (x: number, z: number): number | null => {
    let lv: number | null = null
    for (const w of water) {
      if (x < w.x0 || x > w.x1 || z < w.z0 || z > w.z1) continue
      if (insideRing(w.ring, x, z) && !w.holes.some((h) => insideRing(h, x, z))) lv = lv === null ? w.level : Math.min(lv, w.level)
    }
    return lv
  }
  const occ = (x: number, z: number, lv: number | null): number => {
    const g = terrain.heightAt(x, z) - 0.6
    return lv === null ? g : Math.min(g, lv - 0.4)
  }
  const out = new MeshBuilder()
  const quad = (p: [number, number, number][]): void => {
    out.quad(p, [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0, 0, 0], 0)
  }
  for (let r = 0; r + 1 < t.rows; r++) {
    for (let c = 0; c + 1 < t.cols; c++) {
      const x = t.x0 + c * t.step
      const z = t.z0 + r * t.step
      // does the cell straddle a bank? sample its corners and centre
      const probes = [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]].map(([u, v]) => wetAt(x + u * t.step, z + v * t.step))
      const allDry = probes.every((p) => p === null)
      const allWet = probes.every((p) => p !== null)
      if (allDry || allWet) {
        const h = (u: number, v: number): [number, number, number] => {
          const px = x + u * t.step
          const pz = z + v * t.step
          return [px, occ(px, pz, allWet ? wetAt(px, pz) : null), pz]
        }
        quad([h(0, 0), h(1, 0), h(1, 1), h(0, 1)])
        continue
      }
      /*
       * A bank: a 2 m lattice over the cell (and one step round it), wet flags dilated by one step so the
       * occluder is already down at the river's level a couple of metres before the bank. Otherwise the
       * cells sloping from land height down to the water sliced the quay wall into a sawtooth.
       */
      const n = Math.max(1, Math.round(t.step / 2))
      const sub = t.step / n
      const W = n + 3
      const lvl: (number | null)[] = []
      for (let j = -1; j <= n + 1; j++) for (let i = -1; i <= n + 1; i++) lvl.push(wetAt(x + i * sub, z + j * sub))
      const at = (i: number, j: number): number | null => lvl[(j + 1) * W + (i + 1)]
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
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) quad([v(i, j), v(i + 1, j), v(i + 1, j + 1), v(i, j + 1)])
    }
  }
  const mat = new StandardMaterial('occluder', scene)
  mat.disableColorWrite = true
  mat.disableLighting = true
  mat.backFaceCulling = false
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
  for (const group of [GROUP.areas, GROUP.road, GROUP.building]) {
    let m: Mesh
    if (!first) {
      m = new Mesh(`ground:occluder:${group}`, scene)
      out.toVertexData().applyToMesh(m)
      m.geometry?.clearCachedData()
      first = m
    } else {
      m = first.clone(`ground:occluder:${group}`)
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
    m.alwaysSelectAsActiveMesh = true
    /*
     * The order within the group, stated rather than left to creation order: the occluder first, since
     * everything after has to test against it; then, in the ground's group, parks BEFORE the pavement and
     * paths — a footpath through a park painted first was buried under the grass, and the rider rode
     * across what looked like an unbroken lawn.
     */
    const rank = (mesh: { name: string }): number =>
      mesh === m ? 0 : mesh.name.startsWith('areas:') ? 1 : mesh.name.startsWith('corridor:') ? 2 : 3
    scene.setRenderingOrder(group, (a, b) => rank(a.getMesh()) - rank(b.getMesh()))
  }
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

export class City {
  private readonly scene: Scene
  private readonly pkg: CityPackage
  private readonly atlas: AtlasManifest
  private readonly assets: string
  private readonly roadAssets: string
  readonly terrain: Terrain
  private readonly tiles = new Map<string, Tile>()
  /** what falls in each tile, worked out once at load */
  private readonly edgesIn = new Map<string, PackedEdge[]>()
  /** OSM's point furniture (Métro entrances, fountains, columns, kiosks, bike docks) by tile */
  private readonly pointsIn = new Map<string, PackedFurniture[]>()
  /** edges that are structures (bridges, ramps) rather than painted ground; see render/bridges.ts */
  readonly raisedIds = new Set<number>()
  /** raised footways that are a road bridge's own sidewalks, drawn by the road's deck */
  private readonly coveredDecks = new Set<number>()
  /** the bridges' outlines (render/bridge-structures.ts): a way on one draws only its running surfaces */
  private readonly outlines = new Map<number, { ring: { x: number; z: number }[]; x0: number; x1: number; z0: number; z1: number }>()
  private structured(e: PackedEdge): boolean {
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
  private readonly region: Region
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
    this.terrain = new Terrain(pkg.terrain)
    this.region = region(pkg.region)
    distantGround(scene, this.terrain, pkg, this.roadAssets)
    groundOccluder(scene, pkg, this.region.riverDrop ?? 0)
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
  ingest(t: TileData): void {
    if (this.ingested.has(t.key)) return
    this.ingested.add(t.key)
    for (const b of t.bridges ?? []) {
      if (this.outlines.has(b.id)) continue
      const ring = unpackPoints(b.ring)
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
      this.outlines.set(b.id, { ring, x0, x1, z0, z1 })
    }
    for (const e of t.edges) {
      if (!onSurface(e) || this.edgeSeen.has(e.id)) continue
      this.edgeSeen.add(e.id)
      this.bucket(this.edgesIn, e.points[0], e.points[1], e)
      const raised = isRaised(e, this.terrain)
      if (raised) this.raisedIds.add(e.id)
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
        const arm = { ux: dx / len, uz: dz / len, half: e.width / 2, foot: e.foot, surface: e.surface, raised }
        const r = e.width / 2 + 0.7
        const got = this.nodes.get(id)
        if (got) {
          got.radius = Math.max(got.radius, r)
          got.walk = Math.max(got.walk, e.walk)
          got.edges++
          got.arms.push(arm)
        } else {
          this.nodes.set(id, { at: from, radius: r, walk: e.walk, edges: 1, arms: [arm] })
          this.bucket(this.nodesIn, from.x, from.z, id)
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
      this.bucket(this.railsIn, r.points[0], r.points[1], r)
    }
    // the tile's own clipped pieces of each area (city/tiles.ts): water carries its whole body's level
    this.areasIn.set(t.key, t.areas.map((a) => ({ ...a, level: a.level })))
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
    const [cx, cz] = tileOf(x, z)
    const dist = (k: string): number => {
      const [tx, tz] = k.split(',').map(Number)
      return Math.max(Math.abs(tx - cx), Math.abs(tz - cz))
    }
    const first = this.tiles.size === 0
    const t0 = performance.now()
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
    this.decksNear(k)
    const lights = this.lightsIn(k)
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
    const areas = new MeshBuilder()
    const walks = new MeshBuilder()
    const markings = new MeshBuilder()
    const corridor = new MeshBuilder()
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
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const x = tx * TILE + (c * TILE) / N
        const z = tz * TILE + (r * TILE) / N
        const w = TILE / N
        base.quad(
          [[x, h(x, z), z], [x + w, h(x + w, z), z],
           [x + w, h(x + w, z + w), z + w], [x, h(x, z + w), z + w]],
          [0, 1, 0], [[0, 0], [w, 0], [w, w], [0, w]], [0.5, 0.5, 0.5], 0,
        )
      }
    }

    // the paved squares first: the lawns and pools mapped inside them are painted over them
    const ordered = [...(this.areasIn.get(k) ?? [])].sort((p, q) => Number(q.kind === 'paved') - Number(p.kind === 'paved'))
    for (const a of ordered) {
      if (a.kind === 'water') {
        /*
         * Flat, at the level of its lowest bank. Draped like the ground, a river followed every bump in
         * the elevation data and came out as a rumpled sheet — water is the one surface in a city that is
         * certainly level. The level was taken from the whole ring when the area was cut into tiles, so a
         * river cut into many tiles is the same height in all of them.
         */
        capPolygonWithHoles(water, [unpackPoints(a.ring), ...(a.holes ?? []).map(unpackPoints)],
          0.03 + (a.level ?? 0), [0, 0, 0], 0, 2.4)
      }
      else {
        capPolygonWithHoles(areas, [unpackPoints(a.ring), ...(a.holes ?? []).map(unpackPoints)],
          0.02, AREA_TINT[a.kind], 0, 2.4)
      }
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
      quadStrip(corridor, pts, e.width + 2 * e.walk + 4.5, 0.15, PAVEMENT)

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
          if (inner.length >= 2) {
            if (this.region.crossings === 'bands') zebra(markings, inner, Math.max(3, Math.min(5, e.width + 1)), 0.5, 0.8)
            // North America's continental crossing: broad bars, as wide as the gaps, the full width of the road
            else if (this.region.crossings === 'continental') zebra(markings, inner, Math.max(3, Math.min(4.5, e.width)), 0.6, 0.6)
            else zebra(markings, inner, Math.max(2.2, Math.min(4, e.width)))
          }
        }
        continue
      }

      const out = roads.get(e.surface) ?? new MeshBuilder()
      roads.set(e.surface, out)
      quadStrip(out, pts, e.width, 0.05, [0.5, 0.5, 0.5])

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
      capPolygon(corridor, junctionHull(n.arms, n.at, n.walk + 3), 0.15, PAVEMENT, 0, 2.4)

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
      for (const a of drive) tally.set(a.surface, (tally.get(a.surface) ?? 0) + 1)
      const surface = [...tally].sort((x, y) => y[1] - x[1])[0][0]
      const out = roads.get(surface) ?? new MeshBuilder()
      roads.set(surface, out)
      capPolygon(out, junctionHull(drive, n.at, 0), 0.05, [0.5, 0.5, 0.5], 0, 1)
    }

    // Markings are their own geometry: the road surface is one painted layer with no notion of which street
    // any given square metre belongs to.
    for (const e of groundEdges) {
      if (e.foot || e.width < 5.4) continue
      const full = unpackPoints(e.points)
      const pts = slice(full, this.cutback(e.a) + 2.5, this.cutback(e.b) + 2.5)
      // a connector a few metres long inside a junction gets no centre line: its stubs were left lying in
      // the junction box as stray bits of double yellow
      if (pts.length < 2 || lengthOf(pts) < 6) continue
      /*
       * The centre line is regional: a dashed white line in Europe, a solid double yellow in North America —
       * which is none at all on a one-way street, and that absence is as much a signal as the line.
       */
      if (this.region.centreLine === 'doubleYellow') {
        if (!e.oneway) for (const side of [-1, 1]) dashedLine(markings, pts, side * 0.1, 0.063, 0.1, 1, 1, YELLOW)
      } else {
        dashedLine(markings, pts, 0, 0.063, 0.12, 3, 9)
      }
      for (const side of [-1, 1]) dashedLine(markings, pts, side * (e.width / 2 - 0.5), 0.063, 0.10, 1, 1)
    }

    if (corridor.triangles > 0 && !this.off.has('walks')) {
      const m = new Mesh(`corridor:${k}`, this.scene)
      this.terrain.drape(corridor.positions)
      corridor.toVertexData().applyToMesh(m)
      m.material = groundLayerMaterial(this.scene, this.roadAssets, 'concrete', 'corridor')
      m.renderingGroupId = GROUP.corridor
      meshes.push(m)
    }

    for (const [builder, group, name] of [[areas, GROUP.areas, 'areas'], [walks, GROUP.walk, 'walks']] as const) {
      if (builder.triangles === 0 || this.off.has(name)) continue
      const m = new Mesh(`${name}:${k}`, this.scene)
      this.terrain.drape(builder.positions)
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
    if (markings.triangles > 0 && !this.off.has('roads')) {
      const m = new Mesh(`markings:${k}`, this.scene)
      this.terrain.drape(markings.positions)
      markings.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(this.scene, 'cartoonStatic', false)
      m.renderingGroupId = GROUP.walk      // after the road surface, before the buildings
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
    for (const e of groundEdges) {
      if (e.foot) continue
      if (e.walk < 1.2) continue
      const walk = e.walk
      const pts = unpackPoints(e.points)
      const off = e.width / 2 + walk * 0.55
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
          // what stands on the pavement is regional: Paris hangs its lamps on the buildings
          // a bench only where the pavement has room to sit on it, and not at every other lamp post
          if ((e.id + n) % 14 === 0 && walk >= 2.5) {
            if (this.region.furniture.benches) placeModel(furniture, bench, px, 0.15, pz, heading)
          } else if (this.region.furniture.lampPosts) {
            placeModel(furniture, lampPost, px, 0.15, pz, heading)
          }
          acc += 22 + ((e.id + n) % 9)
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
      for (const e of groundEdges) {
        if (e.foot || e.walk < 1.5) continue
        const pts = unpackPoints(e.points)
        const off = e.width / 2 + 0.3
        let acc = 20 + (e.id % 23)
        let n = 0
        for (let i = 1; i < pts.length; i++) {
          const dx = pts[i].x - pts[i - 1].x
          const dz = pts[i].z - pts[i - 1].z
          const seg = Math.hypot(dx, dz)
          while (acc < seg) {
            const t = acc / seg
            const side = (e.id + n) % 2 === 0 ? 1 : -1
            placeModel(furniture, hydrant, pts[i - 1].x + dx * t + (-dz / seg) * off * side, 0.15,
              pts[i - 1].z + dz * t + (dx / seg) * off * side, Math.atan2(dx, dz))
            acc += 60
            n++
          }
          acc -= seg
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
        // the region's own signal: a Paris post, or a North American mast arm out over this arm's lanes
        const signal = this.region.signals === 'mastArm' ? trafficLightMast(a.half * 1.1 + n.walk * 0.55)
          : this.region.signals === 'paris' ? trafficLightParis : trafficLight
        placeModel(furniture, signal, px, 0.15, pz, Math.atan2(-a.ux, -a.uz))
        // the stop bar across this arm's carriageway
        const bx = n.at.x + a.ux * (n.radius + 1.0)
        const bz = n.at.z + a.uz * (n.radius + 1.0)
        stopBar(markings, bx, bz, a.ux, a.uz, a.half * 1.9)
      }
    }

    /*
     * Bridges and ramps: solid decks at their own heights, in the building group, never draped — the one
     * part of the street network that is a structure rather than a painted surface (render/bridges.ts).
     */
    if (!this.off.has('bridges')) {
      const decks = new MeshBuilder()
      for (const e of this.edgesIn.get(k) ?? []) {
        if (this.raisedIds.has(e.id) && !this.coveredDecks.has(e.id)) {
          deck(decks, e, this.terrain, this.deckWalk.get(e.id), this.region.riverDrop ?? 0, e.bridge === true && this.structured(e))
        }
      }
      const railColour = hexRgb(this.region.elevatedRailColour)
      for (const r of this.railsIn.get(k) ?? []) railDeck(decks, r, this.terrain, railColour)
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
    for (const f of this.pointsIn.get(k) ?? []) {
      const heading = this.streetBearing(f.x, f.z, f.kind === 'bikeshare' || f.kind === 'column')
      const model = f.kind === 'metro'
        ? ({ guimard: guimardEntrance, nyc: nycSubwayEntrance, cta: ctaEntrance, generic: genericEntrance })[pf.metro]
        : f.kind === 'fountain' ? (pf.fountain === 'wallace' || f.wallace ? wallaceFountain : drinkingTap)
        : f.kind === 'column' ? morrisColumn
        : f.kind === 'kiosk' ? (pf.kiosk === 'paris' ? parisNewsstand : kiosk)
        : bikes
      placeModel(furniture, model, f.x, 0.15, f.z, heading)
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
      this.terrain.drape(furniture.positions)
      furniture.toVertexData().applyToMesh(m)
      // the static variant: street furniture is baked into the tile, not instanced
      m.material = cartoonMaterial(this.scene, 'cartoonStatic', false)
      m.renderingGroupId = GROUP.building
      meshes.push(m)
    }

    const byStyleSpans = new Map<StyleId, [number, number][]>()
    const byStyle = new Map<StyleId, MeshBuilder>()
    const sunOff = shadowOffset(DAYLIGHT.sun)
    for (const b of this.buildingsIn.get(k) ?? []) {
      const ring = unpackPoints(b.ring) as Ring
      /*
       * A building stands on a LEVEL pad, at the ground height under the middle of its footprint. Draping
       * its walls the way the road is draped would shear them: a terraced block on a San Francisco hill
       * would lean, and its windows with it. Real buildings on a slope are cut into it, which is what a pad
       * is — and it puts a small step at the door, which is also what happens.
       */
      let padX = 0
      let padZ = 0
      let lowest = Infinity
      for (const q of ring) {
        padX += q.x
        padZ += q.z
        lowest = Math.min(lowest, this.terrain.heightAt(q.x, q.z))
      }
      const pad = this.terrain.heightAt(padX / ring.length, padZ / ring.length)
      /*
       * The walls start at the LOWEST ground the footprint touches, not at the pad. On a hill the downhill
       * side of a level pad hangs in the air, and a street of buildings on plinths with daylight under them
       * is worse than no terrain at all. Starting low buries the difference in the hillside, which is what
       * a real building cut into a slope does.
       */
      const foot = Math.min(pad, lowest) - 0.3
      const plan = planFacade(b.style, b.id, { levels: b.levels, height: b.height, minHeight: b.minHeight },
        this.region.palettes[b.style])
      const out = byStyle.get(b.style) ?? new MeshBuilder()
      byStyle.set(b.style, out)
      if (this.pickable) {
        const spans = (byStyleSpans.get(b.style) ?? byStyleSpans.set(b.style, []).get(b.style)!)
        spans.push([out.indices.length / 3, b.id])
      }
      buildBuilding(out, ring, plan, this.atlas, b.id, 0.16 + foot,
        { shape: b.roof, height: b.roofHeight, direction: b.roofDirection, colour: b.roofColour },
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
