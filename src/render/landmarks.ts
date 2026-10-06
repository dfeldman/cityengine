/**
 * Landmarks: the buildings a rider steers by, drawn as themselves rather than as another generated facade.
 *
 * Three sources, one manifest per city (`public/landmarks/<city>.json`):
 *
 *   `procedural`  a builder in landmarks/procedural.ts — the Colonne de Juillet, the Pompidou — for shapes
 *                 simple enough that code beats sourcing a model;
 *   `file`        a downloaded glTF model in `public/landmarks/<city>/`, fetched only with the user's go-ahead
 *                 per file and credited in CREDITS.md (see tools/skp2glb/ for getting one out of SketchUp);
 *   neither       nothing is drawn, but the OSM building is still left alone — a placeholder entry.
 *
 * Every OSM id an entry names is REMOVED from the generated city before any tile is built, so its walls, its
 * shadow and its shop signs all go with it. Way ids match a packed building's id; relation ids match
 * `id * 2 + 1`, the way the bake keeps the two id spaces apart.
 *
 * And the skyline: far landmarks outside the city box (package `skyline`), which the camera's far plane
 * cannot reach. Each is drawn in the sky's rendering group and re-placed every frame CAMERA-RELATIVE — moved
 * toward the camera along its true direction and scaled by the same factor — so its bearing and angular size
 * are exactly right from wherever the rider is, and it never slides along the horizon as they ride.
 */
import { dropCoincidentFaces, subdivideLong } from './landmarks/coplanar.ts'
/** time spent in `dropCoincidentFaces`, for probes (`window.__coplanarMs`) */
export let coplanarMs = 0
export const slowCoplanar: [string, number, number][] = []
if (typeof window !== 'undefined') Object.defineProperty(window, '__slowCoplanar', { get: () => slowCoplanar })
if (typeof window !== 'undefined') Object.defineProperty(window, '__coplanarMs', { get: () => coplanarMs })
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import type { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { DAYLIGHT } from './facade-material.ts'
import { fogIsOff } from './photo.ts'
import { SHADOW_Y, addShadow, shadowMaterial, shadowOffset } from './shadows.ts'
import { offsetRing } from './landmarks/parts.ts'
import { PROCEDURAL, type Fit } from './landmarks/procedural.ts'
import { TILE, type TileData } from '../city/tiles.ts'
import { MID } from './city.ts'

/**
 * Whether a placed model keeps a CPU copy of its vertices once they are on the GPU (src/tier.ts, BUGS.md #242).
 * Only picking reads them — `__pick` and the probes in tools/ — so a phone, where the landmarks' copies were ~70 MB
 * of the JS heap, drops them; the desktop keeps them for the probes.
 */
let KEEP_GEOMETRY = true
export function setKeepGeometry(keep: boolean): void { KEEP_GEOMETRY = keep }
const shed = (m: Mesh): void => {
  if (KEEP_GEOMETRY) return
  m.refreshBoundingInfo({ updatePositionsArray: false })
  m.geometry?.clearCachedData()
}
import { signCut, type PlacedSign } from './landmarks/signage.ts'
import { flatSignMesh } from './sign-plates.ts'
import { Clocks } from './clocks.ts'
import { Rotors } from './rotors.ts'
import { Water } from './water.ts'
import { region } from '../city/region.ts'
import { expandIncludes } from '../city/manifest.ts'
import { Projection } from '../city/geo.ts'
import { unpackPoints, type CityPackage, type PackedBuilding, type PackedLandmark } from '../city/package.ts'
import type { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import type { Terrain } from '../city/terrain.ts'

export interface LandmarkEntry {
  osm?: string | string[]
  /** false: pale surfaces stay plain paint, not dressed stone (cartoon-material.ts `dressed`) */
  stone?: boolean
  name: string
  procedural?: string
  file?: string
  /** where it stands when there is no OSM building to put it on (a monument) */
  lat?: number
  lon?: number
  height?: number
  scale?: number
  rotateDeg?: number
  offset?: [number, number, number]
  source?: string
  licence?: string
  author?: string
  /** false: no name sign for it (item K) */
  sign?: boolean
  /**
   * A NONBUILDING, and which kind — a fountain, a plaza, a pier, a bridge, a statue, a sign, a vessel. Not
   * read at run time: the category exists for the checks in `tools/nonbuildings.ts`, which otherwise derives
   * it from the builder's own module (`ART`, `PIERS`) or from the explicit list there. This key is the
   * override, so a new entry can declare itself and a wrong default can be corrected in the data.
   */
  kind?: string
  /**
   * The bearing, in degrees, that the model's main facade faces (0 north, 90 east), or "street" to take it
   * from the building's baked frontage. The builder is written with its front facing local +z — that is what
   * `edgeFacing(ring, 0)` returns and what every district builder assumes. (Said −z until 2026-09-22; checked
   * empirically, the comment was wrong, not the code.)
   */
  front?: number | 'street'
  /**
   * This model draws its OWN raised structure — a skybridge, a canopy, a skywalk, a pergola — over the
   * footprint it is placed on (BUGS.md #136). OSM maps those structures too, as `bridge=yes` ways the ride
   * graph raises and `city.ts` gives a deck and generic piers, so without this the thing renders twice.
   *
   * Declared here rather than inferred from geometry: an entry that hand-builds a bridge should say so, and
   * a way id cannot be used — `PackedEdge` carries no OSM id (BUGS.md #136 CORRECTION). What it suppresses
   * is worked out geometrically by `City.coverRaised`: any raised edge whose midpoint falls inside the
   * placed footprint at a comparable height, and any baked bridge outline centred in it.
   */
  coversRaised?: boolean
  /** a restyle entry: these buildings (its `osm` ids, and every one near `within`) take this facade style */
  restyle?: string
  /** and the parts of them that start above the ground take this one instead — the Opéra's glass tiers */
  restyleAloft?: string
  /** a restyle of every named building (the package's `landmarks`) whose name matches this pattern */
  named?: string
  /** a ring of [lat, lon] corners — a square, a park — whose surrounding buildings the restyle takes */
  within?: [number, number][]
  /** how far outside `within` a building's nearest wall may be and still be taken, metres (default 20) */
  margin?: number
  /** "around" (default): the buildings round the ring, not in it — a square's houses; "inside": the ones
   *  whose centre is inside it — a building's parts, the Opéra's sixty-one */
  take?: 'around' | 'inside'
  /** a restyle's roof, where the style's own default is wrong for the building ("flat" for the Opéra) */
  roof?: 'flat' | 'hipped' | 'gabled' | 'mansard'
  /** draw a model's footprint this many metres in all round (a tower sharing its podium's walls): see `place` */
  inset?: number
  /**
   * "union": a builder fitted to its parts gets their TRUE outline as `fit.ring`, not their convex hull. The hull is
   * right for most (a tower and its podium), wrong for a plan that wraps round a neighbour: SFMOMA's L round the W
   * hotel's corner lot, whose hull took the W's footprint in and raised the Snøhetta wing through the hotel (owner,
   * 2026-10-03: "another intersecting buildings issue here 37.785513, -122.400479"). Opt-in, so models already
   * checked against their photographs keep the ring they were built on.
   */
  plan?: 'union'
  /**
   * A restyle's BASE: the building stands this many metres up — on a podium — keeping its own height above it. OSM maps
   * Golden Gateway Center's townhouses as `layer=1` buildings with their own 12–13 m on top of a 12 m garage podium,
   * and drawn from the ground they stood entirely INSIDE the podium (owner, 2026-10-03).
   */
  base?: number
  /** a restyle's wall height, storeys (with the ground floor) and roof, where OSM's are not the building's own */
  eaves?: number
  levels?: number
  roofHeight?: number
  /** a restyle whose houses OSM maps twice — the whole house, and again as parts above the arcade — draws
   *  the houses and drops the parts, which would otherwise show through them as extra rows of windows */
  dropParts?: boolean
  /**
   * Stand ON this building without replacing it (its OSM massing stays): a model of details added to a real
   * building — a courtyard's facades, a portal. With `court`, fitted to the building's largest courtyard
   * (PackedBuilding.holes) instead of its outline.
   */
  on?: string
  court?: boolean
  /** a restyle's roof colour, where the style's own would be wrong (Paris slate for the hôtels particuliers) */
  roofColour?: string
  /*
   * A restyle's own paint, where the style's palette is not this building's colour. San Francisco's houses are
   * defined by it — a blue Victorian is a blue Victorian, and the style alone will not get you there (user,
   * 2026-09-22: "that blue victorian really needs the blue color"). Hex, any or all of them.
   */
  wall?: string
  trim?: string
  /** a restyle in a shopfront style (`brick`, `tenement`, `chinatown`…) on a building with no shops — a consulate,
   *  a library, a hospital: its ground floor takes the style's windows (BUGFIX #320) */
  noShops?: boolean
  accent?: string
  /** the ground floor where it is painted differently from the rest — a dark shopfront under pale flats */
  groundWall?: string
  /** false: no footprint shadow (a model that is not a solid on flat ground: a cascade down a hillside) */
  shadow?: boolean
  /** for a standalone model: its footprint, for the shadow and the fit, in metres (width × depth) */
  size?: [number, number]
  /**
   * A structure standing on piles over water (a pier, a boathouse, a floating dock) does NOT sit on the
   * terrain under it — that terrain is the sea bed, flattened below the waterline by `tools/bake.ts`, and
   * draping the model on it submerges the whole thing (BUGS.md #181). This gives the model's own y=0 origin
   * instead: metres above the package's `seaLevel` (its datum-frame sea surface), a sensible freeboard for a
   * real pier deck being about 3–5 m. Takes precedence over the terrain-draped placement below.
   */
  deckAbove?: number
  /** every vertex lifted onto the ground under it (a model that follows a slope: Lombard Street's hedges) */
  drape?: boolean
  /** only what stands over the water is drawn (a marina's boats, not on its breakwater) */
  waterOnly?: boolean
  /**
   * The model's own y = 0, in DATUM metres, instead of draping it on the terrain under it (BUGS.md #211).
   *
   * `deckAbove` is the same idea measured off the sea. (Until 2026-10-02 the city index carried no sea level, so
   * `deckAbove` silently fell through to the drape — BUGS.md #258; it now arrives as the index's `sea`.) This is the
   * absolute form, for a model whose datum is not the sea's.
   *
   * It exists for the Golden Gate Bridge, whose footprint is 2.7 km long and whose terrain is the sea bed:
   * draped, the whole bridge stands 70 m under the water. The number is not the real water line either — it
   * is fitted so the model's ROADWAY meets the ride graph's own height profile, because the rider rides the
   * profile and must not be inside the slab.
   */
  baseY?: number
  note?: string
}

/** What kind of entry: a model that replaces its building, a restyle, or a model standing on its own. */
export function entryKind(e: LandmarkEntry): 'replace' | 'restyle' | 'standalone' | 'placeholder' {
  if (e.restyle) return 'restyle'
  if (e.on) return 'standalone'
  if ((e.procedural || e.file) && e.osm && (Array.isArray(e.osm) ? e.osm.length > 0 : true)) return 'replace'
  if (e.procedural || e.file) return 'standalone'
  return 'placeholder'
}

/** The manifest, or nothing: a city with no landmarks file is an ordinary city. */
/**
 * The manifest: the city's own (`landmarks/<city>.json`), else its region's (`landmarks/<region>.json`) — the
 * Marais and central Paris are both Paris, and a landmark is where it is whichever box it falls in: every
 * entry names its building by OSM id or its place by lat/lon, and one outside the box is simply never placed.
 */
export async function landmarkManifest(base: string, city: string, region?: string): Promise<LandmarkEntry[]> {
  for (const name of region ? [city, region] : [city]) {
    try {
      const r = await fetch(new URL(`landmarks/${name}.json`, base).href)
      const text = await r.text()
      // Vite answers a missing file with index.html and a 200
      if (r.ok && text.trimStart().startsWith('[')) {
        // (a manifest may be split in files: city/manifest.ts)
        // (each entry knows the file it came from: the inspector, ui/inspector.ts, says where to edit it)
        const tag = (list: unknown[], file: string): unknown[] => list.map((x) => (x && typeof x === 'object' && !('include' in x) ? { ...x, _file: file } : x))
        return expandIncludes<LandmarkEntry>(tag(JSON.parse(text), `${name}.json`) as (LandmarkEntry | { include: string })[], async (p) => {
          const got = await fetch(new URL(`landmarks/${p}`, base).href).then((q) => (q.ok ? q.text() : '')).catch(() => '')
          return got.trimStart().startsWith('[') ? tag(JSON.parse(got) as unknown[], p) : null
        })
      }
    } catch {
      // try the next
    }
  }
  return []
}

/** Packed building ids an entry names: way/N → N, relation/N → N·2+1. Nothing, for an entry without `osm`. */
export function packedIds(e: LandmarkEntry): number[] {
  if (!e.osm) return []
  return (Array.isArray(e.osm) ? e.osm : [e.osm]).map((ref) => {
    const [kind, n] = ref.split('/')
    return kind === 'relation' ? Number(n) * 2 + 1 : Number(n)
  })
}

/**
 * The same entry with its MASSING overrides taken off, for a `building:part` claimed through its outline.
 *
 * `height`, `eaves` and `levels` are the whole building's, and `render/prepare.ts` applies them to every
 * grounded building the entry takes. Handed to the parts of a superseded outline that would be badly wrong:
 * a tower's entry says 58 m, and its 4 m canopy is a part too.
 *
 * `dropParts` goes too, and it is the dangerous one. It means "OSM maps this house twice, whole and again as
 * parts above the arcade — draw the house, drop the parts". A superseded outline has NO whole house: the
 * parts are all there is, and its aloft parts stand over their own grounded siblings, which is exactly what
 * `dropParts` deletes. Only the Place des Vosges sets it today, on a `within` entry that names no ids and so
 * cannot reach this path at all — but the flag is meaningless here, not merely unused.
 */
function styleOnly(e: LandmarkEntry): LandmarkEntry {
  const { height: _h, eaves: _e, levels: _l, dropParts: _d, ...rest } = e
  return rest
}

/**
 * The restyles: building id → the entry restyling it. A building is taken if the entry names it, or if it is
 * a `building:part` of an outline the entry names and the bake replaced (`claims`, BUGS.md #102), or if its
 * centre is outside the entry's `within` ring and its nearest corner no further from it than `margin` — the
 * houses fronting a square, however deep they run back, and not whatever stands in its garden. Applied when
 * the package is loaded, before any tile is built, so a restyle needs no re-bake.
 */
export function restyles(entries: LandmarkEntry[], pkg: Pick<CityPackage, 'origin' | 'buildings' | 'landmarks'>): Map<number, LandmarkEntry> {
  const out = new Map<number, LandmarkEntry>()
  const proj = new Projection(pkg.origin)
  // only a `building:part` can be claimed through its outline, and a tile holds few of them — so the parts
  // are picked out once and each entry walks those, not all of a tile's buildings (BUGS.md #102)
  const parted = pkg.buildings.filter((b) => b.partOf !== undefined)
  for (const e of entries) {
    if (!e.restyle) continue
    /*
     * FIRST entry wins, exactly as the procedural claim does in the constructor. The manifest's includes are
     * ordered strongest-first — the hand-modelled districts, then what the strong model refaced, then the
     * cheap sweep — so a level only ever fills in what the level above it left alone (user, 2026-09-22: "we
     * can just have separate files for each level and merge"). Last-wins here quietly let the cheapest pass
     * overwrite work that had been looked at properly.
     */
    for (const id of packedIds(e)) if (!out.has(id)) out.set(id, e)
    /*
     * And an id that names an OUTLINE the bake replaced with its `building:part`s claims those parts instead
     * — the same rule `isReplaced` gives the replace path (BUGS.md #100), applied here for BUGS.md #102: 36
     * of San Francisco's 600 restyles named such an outline and silently did nothing, so the building kept
     * the classifier's glass box instead of the style somebody chose for it. `partOf` is stamped ONLY on the
     * parts of an outline the bake actually superseded, so this can never reach the parts of one it kept.
     *
     * The MASSING overrides are dropped on the way (`styleOnly`): `height`, `eaves` and `levels` describe the
     * whole building, and every grounded part would take them — the United States Appraisers Building's entry
     * says 10 m over a 72 m part, and 300 Montgomery's says 58 m over a 4 m canopy. Each part carries OSM's
     * own height already; what the entry has to give a part is its DRESS.
     */
    if (parted.length) {
      const mine = new Set(packedIds(e))
      let only: LandmarkEntry | undefined
      // `claims` is `isReplaced`'s rule, named once and used by both paths
      for (const b of parted) if (!out.has(b.id) && claims(mine, b)) out.set(b.id, (only ??= styleOnly(e)))
    }
    if (e.named) {
      const re = new RegExp(e.named, 'i')
      // never over another entry's building: a replaced or specially restyled landmark keeps its own treatment
      for (const l of pkg.landmarks ?? []) if (re.test(l.name) && !out.has(l.id)) out.set(l.id, e)
    }
    if (!e.within) continue
    const ring = e.within.map(([lat, lon]) => proj.toLocal({ lat, lon }))
    const margin = e.margin ?? 20
    for (const b of pkg.buildings) {
      const r = b.ring
      let x = 0
      let z = 0
      let near = Infinity
      for (let i = 0; i < r.length; i += 2) {
        x += r[i]
        z += r[i + 1]
        near = Math.min(near, distanceToRing(r[i], r[i + 1], ring))
      }
      x /= r.length / 2
      z /= r.length / 2
      const inside = pointInRing(x, z, ring)
      // never over another entry's building (the Louvre along the Rue de Rivoli keeps its own dress)
      if (out.has(b.id) && out.get(b.id) !== e) continue
      if (e.take === 'inside') { if (inside) out.set(b.id, e); continue }
      if (inside) continue
      if (near <= margin) out.set(b.id, e)
    }
  }
  return out
}

/**
 * A footprint in the model's own frame: world = centre + (x cos θ + z sin θ, −x sin θ + z cos θ).
 *
 * EVERY fitted landmark gets one (it used to be only a `court` entry's courtyard). A builder that raises the
 * building from its own outline — the tower grammar, the piers — was being handed the fitted RECTANGLE in the
 * city while the model viewer passed the real ring, so a flatiron was a flatiron in the shots and a box in the
 * city (reported by the market-west batch, 2026-09-22).
 */
function inFrame(ring: { x: number; z: number }[], cx: number, cz: number, rotation: number): { x: number; z: number }[] {
  const c = Math.cos(rotation)
  const sn = Math.sin(rotation)
  return ring.map((p) => ({ x: (p.x - cx) * c - (p.z - cz) * sn, z: (p.x - cx) * sn + (p.z - cz) * c }))
}

function pointInRing(x: number, z: number, ring: { x: number; z: number }[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside
  }
  return inside
}

function distanceToRing(x: number, z: number, ring: { x: number; z: number }[]): number {
  let best = Infinity
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j]
    const b = ring[i]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
    best = Math.min(best, Math.hypot(x - a.x - dx * t, z - a.z - dz * t))
  }
  return best
}

/** The buildings the manifest removes: only a replace entry's (a restyle keeps its buildings, by design). */
export function replacedIds(entries: LandmarkEntry[]): Set<number> {
  return new Set(entries.filter((e) => entryKind(e) === 'replace' || entryKind(e) === 'placeholder').flatMap(packedIds))
}

/**
 * **The rule, in one place.** Do these manifest ids name this building? Its own id — or the id of the
 * OUTLINE it is a part of.
 *
 * `tools/bake.ts` drops an outline whose grounded `building:part`s cover it (`superseded`) and stamps each
 * part with `partOf: <that outline's id>`. An entry naming only the outline therefore matched nothing: on the
 * replace path the classifier's plain box stood where the landmark should be — sixty-nine of them, the
 * Transamerica Pyramid and the Ferry Building among them (BUGS.md #100) — and on the restyle path the
 * building kept the classifier's dress instead of the style somebody chose for it (BUGS.md #102).
 *
 * `partOf` is set ONLY for a superseded outline's parts, so this can never reach the parts of an outline the
 * bake kept. That property is what makes it safe, and both paths rely on it.
 */
export function claims(ids: { has(id: number): boolean }, b: { id: number; partOf?: number }): boolean {
  return ids.has(b.id) || (b.partOf !== undefined && ids.has(b.partOf))
}

/** Is this building one the manifest removes? `claims`, against the replace entries' ids. */
export function isReplaced(replaced: Set<number>, b: { id: number; partOf?: number }): boolean {
  return claims(replaced, b)
}

/**
 * Fit a footprint to a facing: the model's local −z faces `bearing` (degrees), so it is rotated by
 * bearing + 180°; the ring is measured across (local x) and along (local z) that facing, and the centre is
 * the middle of that box. Babylon's rotation.y = θ sends local +x to (cos θ, −sin θ) and +z to (sin θ, cos θ).
 */
export function fitFront(ring: { x: number; z: number }[], bearing: number)
  : { cx: number; cz: number; rotation: number; hx: number; hz: number } {
  return fitAt(ring, bearing)
}

/**
 * `fitFront`, but turned to the footprint's own axes: of the bearings within ±40° of the one asked for, the
 * one whose box fits the footprint tightest. The manifest's bearing says which SIDE is the front; the
 * building's walls say exactly which way that side runs. Fitted to exactly 270°, the Hôtel de Ville — turned
 * some degrees off due west — got a box twice its own area, and the model stood across Rue de Lobau and Rue
 * de Rivoli (user report).
 */
export function fitSnug(ring: { x: number; z: number }[], bearing: number)
  : { cx: number; cz: number; rotation: number; hx: number; hz: number } {
  const given = fitAt(ring, bearing)
  let best = given
  let worst = given.hx * given.hz
  for (let d = -40; d <= 40; d += 0.5) {
    const f = fitAt(ring, bearing + d)
    worst = Math.max(worst, f.hx * f.hz)
    if (f.hx * f.hz < best.hx * best.hz - 1e-6) best = f
  }
  // only when the footprint HAS axes: a round one (the Cirque d'Hiver's twenty sides) fits every turn within a
  // percent or two, and the search turned its porch 35° off the street (BUGS.md #6) — keep the bearing given
  const round = worst < best.hx * best.hz * 1.04
  return round ? given : best
}

function fitAt(ring: { x: number; z: number }[], bearing: number)
  : { cx: number; cz: number; rotation: number; hx: number; hz: number } {
  const b = (bearing * Math.PI) / 180
  const rotation = b + Math.PI
  const rx = Math.cos(rotation)
  const rz = -Math.sin(rotation)
  const fx = Math.sin(rotation)
  const fz = Math.cos(rotation)
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) {
    const u = p.x * rx + p.z * rz
    const v = p.x * fx + p.z * fz
    x0 = Math.min(x0, u); x1 = Math.max(x1, u); z0 = Math.min(z0, v); z1 = Math.max(z1, v)
  }
  const cu = (x0 + x1) / 2
  const cv = (z0 + z1) / 2
  return { cx: cu * rx + cv * fx, cz: cu * rz + cv * fz, rotation, hx: (x1 - x0) / 2, hz: (z1 - z0) / 2 }
}

/** A footprint's long axis, half-extents along and across it, its centre, and the rotation to stand on it. */
function fitTo(ring: { x: number; z: number }[], height: number): { fit: Fit; cx: number; cz: number; rotation: number } {
  let best = 0
  let dir = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const c = ring[(i + 1) % ring.length]
    const len = Math.hypot(c.x - a.x, c.z - a.z)
    if (len > best) { best = len; dir = Math.atan2(c.z - a.z, c.x - a.x) }
  }
  return fitAlong(ring, dir, height)
}

/**
 * The MINIMUM-AREA box round a footprint, by the rotating-calipers fact that one of its sides lies along an
 * edge of the convex hull. For the union of a building's `building:part`s (below), where `fitTo`'s longest
 * edge means nothing: Salesforce Tower's ten wedges give a hull of short chords, and the longest of them is
 * whichever the geometry happened to leave — the hand fix in the manifest measured this box instead.
 */
function fitMinArea(hull: { x: number; z: number }[], height: number): { fit: Fit; cx: number; cz: number; rotation: number } {
  let best: ReturnType<typeof fitAlong> | null = null
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]
    const c = hull[(i + 1) % hull.length]
    if (Math.hypot(c.x - a.x, c.z - a.z) < 1e-6) continue
    const f = fitAlong(hull, Math.atan2(c.z - a.z, c.x - a.x), height)
    if (!best || f.fit.hx * f.fit.hz < best.fit.hx * best.fit.hz - 1e-9) best = f
  }
  return best ?? fitTo(hull, height)
}

/** The box round a footprint on a given axis: local +x along it, +z across it. */
function fitAlong(ring: { x: number; z: number }[], dir: number, height: number): { fit: Fit; cx: number; cz: number; rotation: number } {
  const ux = Math.cos(dir)
  const uz = Math.sin(dir)
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) {
    const u = p.x * ux + p.z * uz
    const v = -p.x * uz + p.z * ux
    x0 = Math.min(x0, u); x1 = Math.max(x1, u); z0 = Math.min(z0, v); z1 = Math.max(z1, v)
  }
  const cu = (x0 + x1) / 2
  const cv = (z0 + z1) / 2
  // local +x along the long axis, local +z across it; turn half a circle if +z would face west, because the
  // builders are written with +z the EAST side (the Pompidou's ducts face the rue du Renard)
  // Babylon's rotation.y = θ sends local +x to (cos θ, −sin θ) and local +z to (sin θ, cos θ)
  let rotation = -dir
  if (Math.sin(rotation) < 0) rotation += Math.PI
  return {
    fit: { hx: (x1 - x0) / 2, hz: (z1 - z0) / 2, height },
    cx: cu * ux - cv * uz, cz: cu * uz + cv * ux, rotation,
  }
}

/*
 * ---- a building the bake replaced with its own `building:part`s (BUGS.md #100)
 *
 * The outline is not in the package; only the parts are, each stamped `partOf: <the outline's id>`. An entry
 * naming the outline must therefore claim all of them and be fitted to their UNION. Fitting to one is the
 * trap: each Salesforce part is a ~250 m² wedge and the tower would stand a quarter of its size.
 */
export type PartLike = Pick<PackedBuilding, 'id' | 'ring' | 'height' | 'minHeight'>

/**
 * The parts that carry the building's FOOTPRINT: the ones that start at the ground, which is the bake's own
 * notion (`tools/bake.ts`: a part is grounded when it has neither `min_height` nor `building:min_level`, and
 * packs that as `minHeight`; the 2 m threshold is what the rest of the code uses). Unioning a roof plate or a
 * cantilevered upper storey with the podium gives a footprint the building does not have. Every part with no
 * grounded one among them — nothing else to go on.
 */
export function groundedParts(parts: PartLike[]): PartLike[] {
  const grounded = parts.filter((p) => (p.minHeight ?? 0) < 2)
  return grounded.length > 0 ? grounded : parts
}

/** The convex hull of some points (Andrew's monotone chain), anticlockwise in the city's x/z frame. */
export function convexHull(pts: { x: number; z: number }[]): { x: number; z: number }[] {
  if (pts.length < 3) return [...pts]
  const p = [...pts].sort((a, b) => a.x - b.x || a.z - b.z)
  const cross = (o: typeof p[0], a: typeof p[0], b: typeof p[0]): number =>
    (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x)
  const lower: typeof p = []
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop()
    lower.push(q)
  }
  const upper: typeof p = []
  for (let i = p.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p[i]) <= 0) upper.pop()
    upper.push(p[i])
  }
  lower.pop(); upper.pop()
  return lower.concat(upper)
}

/** The union of a building's parts: the hull of the grounded ones' rings, and the tallest part's height. */
export function partsUnion(parts: PartLike[]): { hull: { x: number; z: number }[]; height: number } | null {
  if (parts.length === 0) return null
  const hull = convexHull(groundedParts(parts).flatMap((p) => unpackPoints(p.ring)))
  if (hull.length < 3) return null
  // the WHOLE building's height, from every part: the crown is usually not a grounded one
  return { hull, height: Math.max(...parts.map((p) => p.height ?? 0)) }
}

/**
 * The true outline of a building's grounded parts — their union, concave where it is concave — anticlockwise in the
 * city's x/z frame: rasterised at half a metre, the outer boundary of the largest piece traced cell edge by cell
 * edge, and simplified back to its corners. Null when there is nothing to trace.
 */
export function partsOutline(parts: PartLike[]): { x: number; z: number }[] | null {
  const rings = groundedParts(parts).map((p) => unpackPoints(p.ring))
  if (rings.length === 0) return null
  const C = 0.5
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const r of rings) for (const q of r) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
  const nx = Math.ceil((x1 - x0) / C) + 2, nz = Math.ceil((z1 - z0) / C) + 2
  if (nx * nz > 4e6) return null
  const ox = x0 - C, oz = z0 - C
  const inside = (r: { x: number; z: number }[], x: number, z: number): boolean => {
    let c = false
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) c = !c
    }
    return c
  }
  const fill = new Uint8Array(nx * nz)
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = ox + (i + 0.5) * C, z = oz + (j + 0.5) * C
    if (rings.some((r) => inside(r, x, z))) fill[j * nx + i] = 1
  }
  const at = (i: number, j: number): boolean => i >= 0 && j >= 0 && i < nx && j < nz && fill[j * nx + i] === 1
  // every boundary edge, directed with the filled cell on its LEFT (anticlockwise round the filled region)
  const next = new Map<number, number[]>()
  const key = (i: number, j: number): number => j * (nx + 1) + i
  const add = (a: number, b: number): void => { const l = next.get(a); if (l) l.push(b); else next.set(a, [b]) }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (!at(i, j)) continue
    if (!at(i, j - 1)) add(key(i, j), key(i + 1, j))
    if (!at(i + 1, j)) add(key(i + 1, j), key(i + 1, j + 1))
    if (!at(i, j + 1)) add(key(i + 1, j + 1), key(i, j + 1))
    if (!at(i - 1, j)) add(key(i, j + 1), key(i, j))
  }
  // link them into loops; the longest is the outer boundary of the largest piece
  let best: number[] = []
  while (next.size) {
    const start = next.keys().next().value as number
    const loop: number[] = []
    let k = start
    for (let guard = 0; guard < 1e6; guard++) {
      const l = next.get(k)
      if (!l || !l.length) break
      const n = l.pop()!
      if (!l.length) next.delete(k)
      loop.push(k)
      k = n
      if (k === start) break
    }
    if (loop.length > best.length) best = loop
  }
  if (best.length < 4) return null
  const pts = best.map((v) => ({ x: ox + (v % (nx + 1)) * C, z: oz + Math.floor(v / (nx + 1)) * C }))
  // back to corners: Douglas–Peucker on the closed loop, split at its two farthest-apart points
  const simplify = (p: { x: number; z: number }[], tol: number): { x: number; z: number }[] => {
    if (p.length < 3) return p
    const a = p[0], b = p[p.length - 1]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1e-9
    let far = 0, at2 = 0
    for (let i = 1; i < p.length - 1; i++) {
      const d = Math.abs((b.x - a.x) * (a.z - p[i].z) - (a.x - p[i].x) * (b.z - a.z)) / L
      if (d > far) { far = d; at2 = i }
    }
    if (far <= tol) return [a, b]
    return [...simplify(p.slice(0, at2 + 1), tol).slice(0, -1), ...simplify(p.slice(at2), tol)]
  }
  let half = 0, dmax = -1
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[0].x, pts[i].z - pts[0].z); if (d > dmax) { dmax = d; half = i } }
  const tol = C * 1.2
  const out = [...simplify(pts.slice(0, half + 1), tol).slice(0, -1), ...simplify([...pts.slice(half), pts[0]], tol).slice(0, -1)]
  return out.length >= 3 ? out : null
}

/**
 * How far outside the parts seen so far another part of the same building could start, metres. A part
 * narrower than this could sit across a tile boundary without its ring reaching into the bbox — buildings are
 * filed by their CENTRE (city/tiles.ts), so the tile a part is in says nothing about where its neighbours are.
 */
const PART_REACH = 30

/**
 * Are all of this building's parts here? A part that has not arrived is in a tile that has not arrived — a
 * tile's buildings all come at once — so the answer is yes exactly when every tile the parts' bounding box
 * reaches into, grown by `PART_REACH`, has been seen. The Ferry Building is 200 m long and Madrone spans
 * three tiles; placed on the first two parts to land, they would be built a fraction of their size.
 */
export function partsComplete(parts: PartLike[], seenTiles: ReadonlySet<string>): boolean {
  const t = partsTiles(parts)
  if (!t) return false
  for (let tx = t.tx0; tx <= t.tx1; tx++) for (let tz = t.tz0; tz <= t.tz1; tz++) if (!seenTiles.has(`${tx},${tz}`)) return false
  return true
}

/** The tiles a building's parts reach into, `PART_REACH` included. Null when there are no parts. */
export function partsTiles(parts: PartLike[]): { tx0: number; tx1: number; tz0: number; tz1: number } | null {
  if (parts.length === 0) return null
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of parts) {
    for (let i = 0; i < p.ring.length; i += 2) {
      x0 = Math.min(x0, p.ring[i]); x1 = Math.max(x1, p.ring[i])
      z0 = Math.min(z0, p.ring[i + 1]); z1 = Math.max(z1, p.ring[i + 1])
    }
  }
  return {
    tx0: Math.floor((x0 - PART_REACH) / TILE), tx1: Math.floor((x1 + PART_REACH) / TILE),
    tz0: Math.floor((z0 - PART_REACH) / TILE), tz1: Math.floor((z1 + PART_REACH) / TILE),
  }
}

/**
 * Is this tile in the building's own neighbourhood — within `slack` tiles of the ones its parts reach into?
 *
 * The backstop below counts only these. A tile arriving a kilometre away says nothing about whether the rest
 * of THIS building is coming; counting every tile, a landmark seen once from across the city was placed on
 * whichever part happened to be loaded (303 Second Street: one part of seven), and stayed that size. When
 * the neighbourhood itself has streamed and a tile the building reaches into still has not, it never will.
 */
export function tileNearParts(parts: PartLike[], tx: number, tz: number, slack = 2): boolean {
  const t = partsTiles(parts)
  return t !== null && tx >= t.tx0 - slack && tx <= t.tx1 + slack && tz >= t.tz0 - slack && tz <= t.tz1 + slack
}

/** A skyline landmark: its true position, and how much larger than true it is drawn (see skylineBoost). */
interface SkyItem { name: string; mesh: Mesh; x: number; y: number; z: number; boost: number; haze: { fog: number } }

/**
 * Far landmarks are drawn larger than true, growing with distance: 1× inside 1.5 km, 1.8× by 5 km. At its true
 * size the Eiffel Tower from the Marais is 4° tall — a sliver in a 70° view, far smaller than it is remembered
 * (the eye singles it out; a screen does not). Scaled about its base, so it still stands on the horizon.
 */
export function skylineBoost(d: number): number {
  return 1 + 0.8 * Math.min(1, Math.max(0, (d - 1500) / 3500))
}

/**
 * How far a point is from a placed model's own footprint rectangle (0 inside it). The rectangle is the
 * landmark's `hx`/`hz` turned by its `rotation`; a model with no fitted size falls back to its centre.
 */
function distanceToPlaced(p: { x: number; z: number; hx?: number; hz?: number; rotation?: number }, x: number, z: number): number {
  if (p.hx === undefined || p.hz === undefined) return Math.hypot(p.x - x, p.z - z)
  const r = p.rotation ?? 0
  const c = Math.cos(r)
  const s = Math.sin(r)
  const dx = x - p.x
  const dz = z - p.z
  // into the model's own frame, the inverse of the placement in `place()`
  const lx = Math.abs(dx * c - dz * s) - p.hx
  const lz = Math.abs(dx * s + dz * c) - p.hz
  return Math.hypot(Math.max(0, lx), Math.max(0, lz))
}

/** A rectangle footprint for a standalone model, rotated like the model. */
function rectRing(cx: number, cz: number, hx: number, hz: number, rotation: number): { x: number; z: number }[] {
  const c = Math.cos(rotation)
  const s = Math.sin(rotation)
  return [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([x, z]) => ({ x: cx + x * c + z * s, z: cz - x * s + z * c }))
}

/** How tall a built model is: its highest vertex. */
function modelHeight(mb: MeshBuilder): number {
  let top = 0
  for (let i = 1; i < mb.positions.length; i += 3) top = Math.max(top, mb.positions[i])
  return top
}

export class Landmarks {
  private readonly sky: SkyItem[] = []
  /** how many landmarks stand in the city (not counting the skyline) */
  count = 0
  /** where each drawn landmark stands, for the jump-to menu */
  /** every landmark drawn, with its fitted half-sizes, turn and height where it has them (for tools/views.ts) */
  readonly placed: { name: string; x: number; y?: number; z: number; hx?: number; hz?: number; rotation?: number; height?: number }[] = []

  /**
   * Every raised deck a procedural landmark planted on itself (`MeshBuilder.decks`, docs/SKYPARKS.md), turned
   * from the model's local frame into world metres by the same rotation/translation/scale the model itself
   * got. render/plants.ts reads this list (via game.ts) to lattice-plant a skypark exactly where its deck
   * actually is — including any standing placement error, which this deliberately does not correct.
   */
  readonly decks: { ring: { x: number; z: number }[]; y: number; keepOff?: number; trees?: boolean; shrubs?: boolean; spacing?: number }[] = []

  /**
   * Every footprint a landmark declared it draws its own raised structure over (`coversRaised`), in world
   * metres, with the band of heights the model occupies. BUGS.md #136.
   *
   * Handed STRAIGHT ON to whoever is listening (`onCover`, game.ts wires it to `City.coverRaised`) rather
   * than drained on a later frame. Landmarks and tiles stream in either order, and the two orders are what
   * caused #100: a per-frame drain would let `city.update()` report `idle` — which the shot tools wait on —
   * with a tile still holding the duplicate. Published synchronously, the suppression is in place before the
   * call that placed the landmark returns, and `coverRaised` corrects any tile already built.
   */
  readonly covers: { ring: { x: number; z: number }[]; y0: number; y1: number }[] = []
  /** told of each cover the instant it is placed; set by game.ts before any tile is handed over */
  onCover: ((c: { ring: { x: number; z: number }[]; y0: number; y1: number }) => void) | null = null
  /** told of each street-level paving a model asks for (MeshBuilder.grounds); set by game.ts like `onCover` */
  onGround: ((ring: { x: number; z: number }[]) => void) | null = null
  /**
   * Each placed model's footprint, for the trees: the park scatter knows nothing of models, and planted Rincon Park's
   * trees through Cupid's Span (2026-10-03). Not for an AREA — a plaza, a garden, a park — whose own trees stand in it.
   */
  onFootprint: ((ring: { x: number; z: number }[]) => void) | null = null
  /** is (x, z) known dry land (the city's water pieces)? for `waterOnly`; set by game.ts */
  dryAt: ((x: number, z: number) => boolean) | null = null

  /**
   * Every sign a model put on itself (render/landmarks/signage.ts), with the distance beyond which it is not
   * drawn. Signs are LOD-gated exactly the way the trees are (render/vegetation.ts `NEAR_LOD`, plants.ts):
   * one distance per copy, tested against the eye each frame and switched with `setEnabled`. There is no
   * Babylon `addLODLevel` anywhere in this project and this is not the place to introduce one.
   */
  private readonly signs: { mesh: Mesh; x: number; z: number; cut: number; on: boolean }[] = []

  private readonly scene: Scene
  private readonly base: string

  private readonly terrain: Terrain
  /** the package's sea surface, datum-frame metres (BUGS.md #181) — null where the city has no sea */
  private seaLevel: number | null = null

  /** the city's buildings seen so far (city and fringe), by id, for fitting a landmark to its own */
  private readonly byId = new Map<number, Pick<PackedBuilding, 'id' | 'ring' | 'height' | 'holes' | 'minHeight'>>()
  /** and the `building:part`s of a wanted OUTLINE the bake replaced with them: outline id → part id → part */
  private readonly partsOf = new Map<number, Map<number, PartLike>>()
  /** every tile that has arrived, so `partsComplete` can tell "not here yet" from "not there" */
  private readonly seenTiles = new Set<string>()
  private readonly wanted = new Set<number>()
  /**
   * The model entry that names each building id ITSELF (not through an outline). An entry fitted to an OUTLINE takes
   * the union of its parts — but not a part another model names for itself: the Paramount's entry named the 3-storey
   * outline that also holds the St. Regis Museum Tower's part, the Westin St. Francis's the outline round the Westin's
   * own tower, and each model was drawn over the other (owner, 2026-10-03: "in most cases, we are probably replacing a
   * whole building and keeping the buildingparts, OR maybe the other way around").
   */
  private readonly ownedBy = new Map<number, LandmarkEntry>()
  /** entries not yet placed: each waits for the tile its building, or its point, is in */
  private pending: LandmarkEntry[]
  private readonly named: PackedLandmark[]
  private readonly proj: Projection
  private readonly mat: ShaderMaterial
  /** the public clocks' hands (render/clocks.ts), turned to the city's own time */
  private readonly clockHands: Clocks
  /** what turns on a model — the park's windmills' sails (render/rotors.ts) */
  private readonly rotors: Rotors
  /** fountains' and falls' moving water (render/water.ts) */
  private readonly water: Water
  private plain: ShaderMaterial | null = null
  private plainMat(): ShaderMaterial {
    if (!this.plain) {
      this.plain = cartoonMaterial(this.scene, 'cartoonLandmarkPlain', false)
      this.plain.backFaceCulling = false
    }
    return this.plain
  }

  /**
   * The skyline now, the landmarks as their tiles arrive (`addTile`): a streamed city does not have every
   * building at load, and a landmark is fitted to its own building's footprint.
   */
  constructor(scene: Scene, pkg: Pick<CityPackage, 'origin' | 'skyline' | 'landmarks' | 'seaLevel'>, entries: LandmarkEntry[], terrain: Terrain, base: string) {
    this.terrain = terrain
    this.scene = scene
    this.base = base
    this.proj = new Projection(pkg.origin)
    this.named = pkg.landmarks ?? []
    this.seaLevel = pkg.seaLevel ?? null
    /*
     * One entry per building. The districts are modelled in parallel and two batches can both claim a building on
     * their boundary (reported 2026-09-22); placed twice, its two models stand in each other. The first entry
     * wins, and the clash is logged so it can be taken out of a manifest.
     */
    const claimed = new Map<number, string>()
    this.pending = entries.filter((e) => entryKind(e) !== 'restyle' && entryKind(e) !== 'placeholder').filter((e) => {
      const ids = packedIds(e)
      const clash = ids.find((id) => claimed.has(id))
      if (clash !== undefined) {
        console.warn(`landmark "${e.name}" claims a building already taken by "${claimed.get(clash)}" — the second is skipped`)
        return false
      }
      for (const id of ids) claimed.set(id, e.name)
      return true
    })
    for (const e of this.pending) for (const id of [...packedIds(e), ...(e.on ? packedIds({ name: e.name, osm: e.on }) : [])]) this.wanted.add(id)
    for (const e of this.pending) for (const id of packedIds(e)) if (!this.ownedBy.has(id)) this.ownedBy.set(id, e)
    const mat = cartoonMaterial(scene, 'cartoonLandmark', false)
    // drawn both sides: one mesh per landmark, and a builder's hand-wound quads need not all agree
    mat.backFaceCulling = false
    this.mat = mat
    this.clockHands = new Clocks(scene, mat, region((pkg as { region?: string }).region).timeZone)
    this.rotors = new Rotors(scene, mat)
    this.water = new Water(scene)

    // ---- the skyline
    const skyMat = cartoonMaterial(scene, 'cartoonSkyline', false)
    skyMat.setFloat('fogDensity', 0.00002)
    for (const s of pkg.skyline ?? []) {
      const build = PROCEDURAL[s.procedural]
      if (!build) continue
      const mb = new MeshBuilder()
      build(mb, { hx: 20, hz: 20, height: s.heightM })
      // (hazed per frame by its distance from the EYE — `update` — not baked from the origin's: baked, the Bay Bridge
      //  was 38 % hazed with the city between it and the rider 90 % hazed, and Yerba Buena hung over the water as a
      //  dark saucer — appearance audit, 2026-10-02)
      const d = Math.hypot(s.x, s.z)
      const m = new Mesh(`skyline:${s.name}`, scene)
      mb.toVertexData().applyToMesh(m)
      // the fog it gets, set just before its own draw: the shared material's density, scaled so that its fake depth
      // (it is drawn shrunk to about R metres out) fogs it as its true distance would
      const item = { fog: 0 }
      m.onBeforeRenderObservable.add(() => skyMat.setFloat('fogDensity', fogIsOff() ? 0 : item.fog))
      shed(m)
      m.material = skyMat
      // group 0, with the sky dome: every solid thing in the city draws over it, so it shows only where
      // there is sky — which is exactly where a tower five kilometres away should show
      m.renderingGroupId = 0
      m.isPickable = false
      m.alwaysSelectAsActiveMesh = true
      // turned to its bearing (a bridge), degrees clockwise from north; local +z is the model's own axis
      if (s.bearing) m.rotation.y = (s.bearing * Math.PI) / 180
      /*
       * Where the city also places this landmark near (a manifest entry of the same name at its own point — the
       * Golden Gate's NEAR level, public/landmarks/<city>/bridges.json), the far copy stands exactly where the near
       * one does: same point, bearing and datum. It stood at the sea bed (−180 m) with the near one 80 m higher,
       * and the swap at 1.3 km jumped.
       */
      const near = entries.find((e) => e.name === s.name && e.lat !== undefined && e.lon !== undefined)
      let at = { x: s.x, y: s.baseY ?? 0, z: s.z }
      if (near) {
        const p = this.proj.toLocal({ lat: near.lat!, lon: near.lon! })
        const [ox, oy, oz] = near.offset ?? [0, 0, 0]
        at = { x: p.x + ox, y: (near.baseY ?? at.y) + oy, z: p.z + oz }
        if (near.rotateDeg !== undefined) m.rotation.y = (near.rotateDeg * Math.PI) / 180
      }
      // a long thing needs less of the distance boost a slender tower does (the Golden Gate is 2.7 km of it)
      this.sky.push({ name: s.name, mesh: m, x: at.x, y: at.y, z: at.z, boost: s.boost ?? skylineBoost(d), haze: item })
    }
  }

  /** A tile's data arrived: place every landmark that was waiting for it. */
  addTile(t: TileData): void {
    this.seenTiles.add(t.key)
    if (this.pending.length === 0) return
    // only the buildings some landmark is fitted to: a streamed city passes every one of them through here
    for (const b of t.fringe) if (this.wanted.has(b.id)) this.byId.set(b.id, b)
    for (const b of t.buildings) {
      if (this.wanted.has(b.id)) this.byId.set(b.id, b)
      // …and the parts of a wanted outline the bake dropped: they ARE the building (BUGS.md #100)
      if (b.partOf !== undefined && this.wanted.has(b.partOf)) {
        const got = this.partsOf.get(b.partOf) ?? new Map<number, PartLike>()
        got.set(b.id, b)
        this.partsOf.set(b.partOf, got)
      }
    }
    const [tx, tz] = t.key.split(',').map(Number)
    this.pending = this.pending.filter((e) => {
      const ids = e.on ? packedIds({ name: e.name, osm: e.on }) : packedIds(e)
      /*
       * An entry at its own point waits for the tile the point is in (the Colonne de Juillet: its ids are
       * the base parts it replaces, and the first is not a building at all — waiting for it, it was never
       * placed, BUGS.md #19). One fitted to a building waits for the FIRST it names (the Hôtel de Ville lists
       * its thirteen courtyard wings after its outline: placed on whichever came first, it was fitted to a wing).
       */
      const ready = e.lat !== undefined && e.lon !== undefined
        ? (() => {
          const p = this.proj.toLocal({ lat: e.lat!, lon: e.lon! })
          return Math.floor(p.x / TILE) === tx && Math.floor(p.z / TILE) === tz
        })()
        /*
         * An entry that names an outline the bake replaced with its parts waits for the PARTS — all of them
         * — however many other buildings it names, because the union of them is what it is fitted to and
         * what `replacedIds` takes out of the massing (BUGS.md #100). Every other entry is unchanged.
         */
        : ids.length > 0 && (this.claims(ids).length > 0
          ? this.partsReady(e, ids, tx, tz)
          : this.byId.has(ids[0]) || this.waitedEnough(e, ids))
      if (!ready) return true
      this.place(e)
      return false
    })
  }

  /**
   * The outline an entry names first is the one to fit to — but the bake DROPS an outline that its own
   * `building:part`s supersede (tools/bake.ts), and an entry that led with such an outline waited for a building
   * that never came and was never placed at all (reported by the market-east batch, 2026-09-22). So after a few
   * tiles have gone by with some other part of it present, the entry is placed on what has arrived.
   */
  /**
   * The parts of an outline the bake dropped. The entry is ready when they are ALL here — every tile their
   * union reaches into has arrived (`partsComplete`) — because the union is what it is fitted to and a
   * half-arrived union is a half-sized building.
   *
   * With a backstop, because `render/prepare.ts` has already taken the parts out of the massing by the time
   * this is asked: an entry that never becomes ready leaves bare ground where the building was, which is
   * worse than a building fitted to most of itself. After forty-eight tiles of ITS OWN NEIGHBOURHOOD have
   * gone by (`tileNearParts`) with one still missing, it is placed on what is here and says so — a tile that
   * has not come while the streets round it have, over and over, is one the loader is not going to send.
   * Deliberately patient: placing short is permanent, and bare ground a block away is not yet visible.
   */
  private readonly partsSince = new Map<LandmarkEntry, number>()

  /**
   * Everything an entry's ids claim once one of them is an outline the bake replaced: the parts carrying that
   * outline's id, AND any building the entry names outright. Fourteen entries name both — the Federal Reserve
   * Bank names three of its own parts beside the outline, One Sansome nine — and taking the parts out of the
   * massing while fitting to one named part would leave a small model in a hole. Empty when no id names such
   * an outline, which is how every other entry keeps its old path.
   */
  private claims(ids: number[], self?: LandmarkEntry): PartLike[] {
    if (!ids.some((id) => this.partsOf.has(id))) return []
    const out = new Map<number, PartLike>()
    for (const id of ids) {
      for (const p of this.partsOf.get(id)?.values() ?? []) {
        // (a part another model names for itself is that model's, not this outline's: see `ownedBy`)
        const owner = this.ownedBy.get(p.id)
        if (owner && owner !== self && !ids.includes(p.id)) continue
        out.set(p.id, p)
      }
      const own = this.byId.get(id)
      if (own) out.set(own.id, own)
    }
    return [...out.values()]
  }

  private partsReady(e: LandmarkEntry, ids: number[], tx: number, tz: number): boolean {
    const parts = this.claims(ids, e)
    if (parts.length === 0) return false
    if (partsComplete(parts, this.seenTiles)) return true
    if (!tileNearParts(parts, tx, tz)) return false
    const n = (this.partsSince.get(e) ?? 0) + 1
    this.partsSince.set(e, n)
    if (n < 48) return false
    console.warn(`landmark "${e.name}": placed on the ${parts.length} part(s) that arrived — a tile its `
      + 'building reaches into never did, so it may be fitted short')
    return true
  }

  private readonly waited = new Map<LandmarkEntry, number>()
  private waitedEnough(e: LandmarkEntry, ids: number[]): boolean {
    if (!ids.some((id) => this.byId.has(id))) return false
    const n = (this.waited.get(e) ?? 0) + 1
    this.waited.set(e, n)
    return n >= 4
  }

  private place(e: LandmarkEntry): void {
    const onId = e.on ? packedIds({ name: e.name, osm: e.on })[0] : undefined
    // of those that have arrived, the biggest footprint: the outline where there is one, else the largest part
    const arrived = packedIds(e).map((id) => this.byId.get(id)).filter((b): b is PackedBuilding => !!b)
    const area = (b: PackedBuilding): number => {
      const r = unpackPoints(b.ring)
      let a = 0
      for (let i = 0; i < r.length; i++) { const p = r[i]; const q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z }
      return Math.abs(a) / 2
    }
    /*
     * The first id that RESOLVES, not the first id listed. An entry names every way of its building, and
     * OSM's order is nobody's design: the Federal Reserve Bank listed `way/944098106` first, which is a
     * `building:part`, and parts are dropped at bake. So the lookup missed, the entry drew nothing, and
     * because the claim had already taken the real building out of the massing the result was the building's
     * own footprint as bare grass — with its name plate still standing on it, names being drawn by another
     * path entirely. A label on a lawn where a 66 m tower should be.
     */
    const building = onId !== undefined ? this.byId.get(onId)
      : packedIds(e).map((id) => this.byId.get(id)).find((b) => b !== undefined)
        ?? arrived.sort((x, y) => area(y) - area(x))[0]
    /*
     * Unless one of its ids is an outline the bake replaced with the building's own `building:part`s, which
     * are in the package carrying that outline's id in `partOf`. Then the entry claims ALL of them — and any
     * building it names outright — and is fitted to their union, which is exactly what `replacedIds` takes
     * out of the massing (BUGS.md #100). The Federal Reserve Bank names three of its parts beside the
     * outline, and fitting to the first of those would put a third of the building in a hole the size of the
     * whole one. An entry that names its own lat/lon, or stands `on` a host, is placed exactly as before.
     */
    const unionId = onId !== undefined || (e.lat !== undefined && e.lon !== undefined)
      ? undefined : packedIds(e).find((id) => this.partsOf.has(id))
    const union = unionId === undefined ? null : partsUnion(this.claims(packedIds(e), e))
    const height = e.height ?? (union ? union.height : building?.height) ?? 30
    let cx: number
    let cz: number
    let rotation = ((e.rotateDeg ?? 0) * Math.PI) / 180
    let fit: Fit = { hx: (e.size?.[0] ?? 20) / 2, hz: (e.size?.[1] ?? 20) / 2, height }
    let ring: { x: number; z: number }[] | null = null
    // a point AND a size: placed there at that size, whatever its buildings are — the Grand Palais is eight
    // OSM parts, and fitted to the first it came out a third of its size, off to one side
    const atPoint = e.lat !== undefined && e.lon !== undefined && e.size !== undefined
    if ((building || union) && !atPoint) {
      ring = union ? (e.plan === 'union' ? partsOutline(this.claims(packedIds(e), e)) ?? union.hull : union.hull) : unpackPoints(building!.ring)
      if (e.court && union) { console.warn(`landmark ${e.name}: no courtyard (its outline is only parts)`); return }
      if (e.court && building) {
        // the largest courtyard, turned back to anticlockwise like an outline
        const holes = (building.holes ?? []).map(unpackPoints)
        const area = (r: { x: number; z: number }[]): number => {
          let a = 0
          for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; a += r[i].x * r[j].z - r[j].x * r[i].z }
          return Math.abs(a / 2)
        }
        const big = holes.sort((p, q) => area(q) - area(p))[0]
        if (!big) { console.warn(`landmark ${e.name}: no courtyard`); return }
        ring = [...big].reverse()
      }
      let bearing: number | undefined = typeof e.front === 'number' ? e.front : undefined
      if (e.front === 'street') {
        // by the OUTLINE's id where the bake kept only the parts: it keeps a superseded outline's name and
        // frontage in the package's `landmarks` precisely because the parts do not carry them
        const l = this.named.find((x) => x.id === (union ? unionId : building!.id))
        if (l) bearing = (Math.atan2(l.frontage.nx, l.frontage.nz) * 180) / Math.PI
      }
      if (bearing !== undefined) {
        const f = fitSnug(ring!, bearing)
        cx = f.cx; cz = f.cz; rotation = f.rotation
        fit = { hx: f.hx, hz: f.hz, height, ring: inFrame(ring!, f.cx, f.cz, rotation) }
      } else {
        // a union has no long edge worth the name — its hull is chords of a dozen parts — so the box round
        // it is the minimum-area one, which is what the manifest's hand-written Salesforce fix measured
        const f = union ? fitMinArea(ring!, height) : fitTo(ring!, height)
        cx = f.cx; cz = f.cz; fit = f.fit
        if (e.rotateDeg === undefined) rotation = f.rotation
        // the outline too, so a builder raised from its own footprint (render/landmarks/tower.ts) has one
        fit.ring = inFrame(ring!, f.cx, f.cz, rotation)
      }
    } else if (e.lat !== undefined && e.lon !== undefined) {
      const p = this.proj.toLocal({ lat: e.lat, lon: e.lon })
      cx = p.x; cz = p.z
      if (typeof e.front === 'number') rotation = ((e.front + 180) * Math.PI) / 180
    } else return
    const [ox, oy, oz] = e.offset ?? [0, 0, 0]
    const under = ring ?? rectRing(cx, cz, fit.hx, fit.hz, rotation)
    /*
     * (…nor a BRIDGE, a mooring field or a tower: their rectangle is the span over open ground, not a footprint. The
     * Golden Gate's 130 × 2650 m and the Bay Bridge's 60 × 2890 m cleared every tree under them as their tiles came in —
     * the Presidio's forest at Fort Point and the trees on Rincon Hill vanished as the rider came near, which is the
     * owner's "trees sometimes disappear when the rider gets close", 2026-10-05.)
     */
    const spans = /bridge|moorings/i.test(`${e.name} ${e.procedural ?? ''}`) || /^sutroTower/.test(e.procedural ?? '')
    if (!spans && !/^(plaza|garden|park)$/.test(e.kind ?? '') && !/plaza|park|garden|square|marina|harbo|deck|podium|paddock|labyrinth|court/i.test(`${e.name} ${e.procedural ?? ''}`)) this.onFootprint?.(under)
    // a structure on piles takes its own deck datum off the sea, not the sea bed under it (BUGS.md #181):
    // the terrain there is deliberately below the waterline, and draping the model on it submerges it
    const y = e.baseY !== undefined
      ? e.baseY + oy
      : e.deckAbove !== undefined && this.seaLevel !== null
      ? this.seaLevel + e.deckAbove + oy
      // sunk to the lowest ground under it, as the city's own buildings are, so a slope shows no daylight
      : Math.min(...under.map((q) => this.terrain.heightAt(q.x, q.z)), this.terrain.heightAt(cx, cz)) - 0.5 + oy
    // (the ground at the front's middle over that base: Fit.grade; the model's local (0, −hz), placed as Babylon does)
    fit.grade = this.terrain.heightAt(cx - fit.hz * Math.sin(rotation), cz - fit.hz * Math.cos(rotation)) - y
    fit.groundAt = (lx: number, lz: number): number =>
      this.terrain.heightAt(cx + lx * Math.cos(rotation) + lz * Math.sin(rotation), cz - lx * Math.sin(rotation) + lz * Math.cos(rotation)) - y

    /*
     * A model that draws its own raised structure — a skybridge, a canopy, a skywalk, a pergola — claims
     * whatever OSM mapped under it as a bridge way, because that way IS this same object and only one of
     * them may be drawn (BUGS.md #136). `City.coverRaised` does the matching, geometrically: a way id
     * cannot be used, since `PackedEdge` carries none.
     *
     * What is claimed is the model's OWN extent, not `size`: `size` is a fitting hint a builder may ignore
     * (`mosconeSkybridge` takes no `fit` at all), so the box round the vertices it actually wrote is the
     * honest footprint and the tightest claim that still binds. For a `file` entry, whose glTF is loaded
     * later, the entry's own rectangle and height are all there is.
     */
    const publishCover = (ring: { x: number; z: number }[], y0: number, y1: number): void => {
      const cover = { ring, y0, y1 }
      this.covers.push(cover)
      this.onCover?.(cover)
    }
    if (e.coversRaised && e.file) publishCover(under.map((q) => ({ x: q.x + ox, z: q.z + oz })), y, y + (e.height ?? 30))

    if (e.procedural) {
      const build = PROCEDURAL[e.procedural]
      if (!build) { console.warn(`landmark ${e.name}: no procedural builder "${e.procedural}"`); return }
      const mb = new MeshBuilder()
      /*
       * INSET (`"inset": 0.12`): the footprint drawn in by that much all round. A tower that is a building:part of its
       * podium's outline — the Four Seasons on Market, the Westin St. Francis tower on the hotel — shares the
       * podium's walls from the ground up, and the two models' faces in one plane z-fought (owner, 2026-10-03:
       * "Around Union Square, several of our custom buildings (the glassy ones) have severe Z fighting"). 40 cm in, the
       * tower's lower walls are hidden inside the podium and its upper walls look the same. (Not 12: that put the
       * Westin tower's wall exactly on the plane of the hotel's recessed window glass, and they fought just the same.)
       */
      // (inward whichever way the ring winds: `offsetRing` moves along each edge's own normal)
      const inward = (r: { x: number; z: number }[], d: number): { x: number; z: number }[] => {
        let a = 0
        for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; a += r[i].x * r[j].z - r[j].x * r[i].z }
        // (an edge shorter than the inset comes out REVERSED, a fold that doubles the wall back on itself in one plane
        // — the ICA's 1 800 m² of fighting glass: each reversed edge is collapsed to its middle)
        let o = offsetRing(r, a > 0 ? -d : d)
        if (o.length !== r.length) return o
        for (let pass = 0; pass < 4; pass++) {
          let fixed = false
          const out: { x: number; z: number }[] = []
          for (let i = 0; i < o.length; i++) {
            const j = (i + 1) % o.length
            const rx = r[j].x - r[i].x, rz = r[j].z - r[i].z
            const ox = o[j].x - o[i].x, oz = o[j].z - o[i].z
            if (rx * ox + rz * oz < 0 && j !== 0) {
              out.push({ x: (o[i].x + o[j].x) / 2, z: (o[i].z + o[j].z) / 2 })
              i++
              fixed = true
            } else out.push(o[i])
          }
          if (!fixed || out.length < 3) break
          // (the original ring with the same collapse, so the next pass compares like with like)
          const rr: { x: number; z: number }[] = []
          for (let i = 0, k = 0; i < r.length && k < out.length; i++, k++) {
            const j = (i + 1) % r.length
            const ox = o[j].x - o[i].x, oz = o[j].z - o[i].z
            if ((r[j].x - r[i].x) * ox + (r[j].z - r[i].z) * oz < 0 && j !== 0) { rr.push({ x: (r[i].x + r[j].x) / 2, z: (r[i].z + r[j].z) / 2 }); i++ }
            else rr.push(r[i])
          }
          o = out
          r = rr
        }
        return o
      }
      // (every model fitted to a footprint is drawn 5 cm in: two neighbours fitted to buildings that share a party wall
      // drew that wall twice in one plane and fought — Saks and Tiffany on Union Square, 900 m² — and 10 cm apart they
      // do not; 5 cm is nothing to the eye)
      // (SCALED about its middle so the farthest wall comes 5 cm in, not offset: an offset folds a short edge back on
      // itself and the doubled wall fights — the ICA's glass)
      const shrink = (r: { x: number; z: number }[]): { x: number; z: number }[] => {
        // each corner along its own bisector by 5 cm / cos(half the turn), clamped: every wall comes in 5 cm, a sharp
        // corner a little less, and nothing can cross over (an offset left a sharp corner where it was and folded)
        let area = 0
        for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; area += r[i].x * r[j].z - r[j].x * r[i].z }
        const sgn = area > 0 ? 1 : -1
        const nrm = (i: number): [number, number] => {
          const j = (i + 1) % r.length
          const dx = r[j].x - r[i].x, dz = r[j].z - r[i].z, L = Math.hypot(dx, dz) || 1
          return [(-dz / L) * sgn, (dx / L) * sgn]   // inward for this winding
        }
        return r.map((q, i) => {
          const n0 = nrm((i - 1 + r.length) % r.length), n1 = nrm(i)
          const mx = n0[0] + n1[0], mz = n0[1] + n1[1], m = Math.hypot(mx, mz)
          if (m < 0.2) return q
          const cosHalf = m / 2
          const d = Math.min(0.15, 0.05 / Math.max(cosHalf, 0.33))
          return { x: q.x + (mx / m) * d, z: q.z + (mz / m) * d }
        })
      }
      const built = e.inset === 0 ? fit : e.inset ? { ...fit, hx: fit.hx - e.inset, hz: fit.hz - e.inset, ring: fit.ring ? inward(fit.ring, e.inset) : undefined }
        : ring && !atPoint && fit.ring ? { ...fit, hx: fit.hx - 0.05, hz: fit.hz - 0.05, ring: shrink(fit.ring) } : fit
      build(mb, built)
      // faces lying inside larger coplanar ones — a box's floor on the deck under it, two abutting boxes' touching
      // faces, a band drawn twice — fight, drawn double-sided as landmarks are: dropped (landmarks/coplanar.ts)
      const tc = performance.now()
      dropCoincidentFaces(mb)
      coplanarMs += performance.now() - tc
      if (performance.now() - tc > 40) slowCoplanar.push([e.name, Math.round(performance.now() - tc), mb.triangles])
      /*
       * DRAPED (`"drape": true`): every vertex lifted by the ground under it, relative to the placement's y — for a model
       * that follows a slope rather than standing on one level: Lombard Street's hedges down the 27% crooked block.
       */
      if (e.drape) {
        subdivideLong(mb, 4)
        const sc = e.scale ?? 1, cr = Math.cos(rotation), sr = Math.sin(rotation)
        for (let i = 0; i < mb.positions.length; i += 3) {
          const px = mb.positions[i], pz = mb.positions[i + 2]
          const wx = cx + ox + (px * cr + pz * sr) * sc
          const wz = cz + oz + (-px * sr + pz * cr) * sc
          mb.positions[i + 1] += (this.terrain.heightAt(wx, wz) - y) / sc
        }
      }
      /*
       * WATER ONLY (`"waterOnly": true`): every triangle whose middle stands over land is dropped — a marina's rectangle
       * takes in its breakwaters and car parks, and its boats were moored on them (appearance pass, 2026-10-02).
       */
      if (e.waterOnly && this.dryAt) {
        const sc = e.scale ?? 1, cr = Math.cos(rotation), sr = Math.sin(rotation)
        const keep: number[] = []
        const P = mb.positions
        for (let t = 0; t < mb.indices.length; t += 3) {
          const [a, b, c] = [mb.indices[t], mb.indices[t + 1], mb.indices[t + 2]]
          const px = (P[a * 3] + P[b * 3] + P[c * 3]) / 3, pz = (P[a * 3 + 2] + P[b * 3 + 2] + P[c * 3 + 2]) / 3
          const wx = cx + ox + (px * cr + pz * sr) * sc
          const wz = cz + oz + (-px * sr + pz * cr) * sc
          if (!this.dryAt(wx, wz)) keep.push(a, b, c)
        }
        mb.indices.length = 0
        mb.indices.push(...keep)
      }
      const m = new Mesh(`landmark:${e.name}`, this.scene)
      mb.toVertexData().applyToMesh(m)
      // plain, not dressed stone, where the white is paint on steel (the Pompidou): `"stone": false`
      m.material = e.stone === false ? this.plainMat() : this.mat
      m.position.set(cx + ox, y, cz + oz)
      m.rotation.y = rotation
      m.scaling.setAll(e.scale ?? 1)
      m.renderingGroupId = 3
      m.isPickable = false
      this.count++
      // any deck the builder planted on itself, turned into world metres by the same transform as the mesh
      const scale = e.scale ?? 1
      const cosR = Math.cos(rotation)
      const sinR = Math.sin(rotation)
      for (const d of mb.decks) {
        const ring = d.ring.map((p) => ({
          x: cx + ox + (p.x * cosR + p.z * sinR) * scale,
          z: cz + oz + (-p.x * sinR + p.z * cosR) * scale,
        }))
        this.decks.push({ ring, y: y + d.y * scale, keepOff: d.keepOff, trees: d.trees, shrubs: d.shrubs, spacing: d.spacing ? d.spacing * scale : undefined })
      }
      // and the ground it paves at street level (MeshBuilder.grounds), in world metres, for the city to drape
      for (const g of mb.grounds) {
        this.onGround?.(g.map((p) => ({
          x: cx + ox + (p.x * cosR + p.z * sinR) * scale,
          z: cz + oz + (-p.x * sinR + p.z * cosR) * scale,
        })))
      }
      // and the footprint it claims from the ride graph, measured off the mesh it just wrote and turned
      // into world metres by the same transform as the decks above (BUGS.md #136)
      if (e.coversRaised) {
        let lx0 = Infinity, lx1 = -Infinity, lz0 = Infinity, lz1 = -Infinity, ly0 = Infinity, ly1 = -Infinity
        for (let i = 0; i < mb.positions.length; i += 3) {
          lx0 = Math.min(lx0, mb.positions[i]); lx1 = Math.max(lx1, mb.positions[i])
          ly0 = Math.min(ly0, mb.positions[i + 1]); ly1 = Math.max(ly1, mb.positions[i + 1])
          lz0 = Math.min(lz0, mb.positions[i + 2]); lz1 = Math.max(lz1, mb.positions[i + 2])
        }
        if (lx0 <= lx1) {
          const corners = [[lx0, lz0], [lx1, lz0], [lx1, lz1], [lx0, lz1]].map(([px, pz]) => ({
            x: cx + ox + (px * cosR + pz * sinR) * scale,
            z: cz + oz + (-px * sinR + pz * cosR) * scale,
          }))
          publishCover(corners, y + ly0 * scale, y + ly1 * scale)
        }
      }
      // the names the model asked for, as their own meshes, gated by distance (`signs` above)
      this.raiseSigns(mb.signs, m, e.name)
      // and its clocks' hands, to the real time (render/clocks.ts)
      if (mb.clocks.length) this.clockHands.raise(mb.clocks, m, e.name)
      if (mb.rotors.length) this.rotors.raise(mb.rotors, m, e.name)
      if (mb.water.length) this.water.raise(mb.water, m, e.name)
      // every placed model is on the list (fountains, statues and the landmark card find their host by it)
      this.placed.push({ name: e.name, x: cx + ox, y, z: cz + oz, hx: fit.hx, hz: fit.hz, rotation, height: modelHeight(mb) })
      /*
       * And its shadow, from the footprint it STANDS ON, the height it reaches — which is why a model given
       * its own datum (`baseY`) gets none. The shadow is draped on the terrain, and a model floated to a
       * datum of its own is not standing on that terrain: the Golden Gate's would be a 130 × 2 650 m dark
       * rectangle draped from the sea bed up onto the headlands at either end, reaching y -12.8 m — above
       * the deck the rider is on. A bridge over water casts its shadow on the water, which we do not draw.
       */
      const shadows = new MeshBuilder()
      // …and nor does one standing on piles over the water (`deckAbove`): its shadow draped on the sea bed showed
      // up through the water as a dark box round every pier (appearance audit, 2026-10-02: Hyde Street Pier,
      // the Ferry Building's floats)
      // …nor a LOW model (under 6 m): the shadow is its whole footprint projected at its tallest point, which for a solid
      // building is right, but a low one spread over a big outline — a coastal battery's parapets and pits on 63 × 114 m
      // (2026-10-04) — came out a dark field; a low solid one loses only a metre or two of shadow past its walls
      const mh = modelHeight(mb)
      // (…nor one that says it casts none: a cascade down a hillside is not a box, and its footprint's shadow, draped only
      //  at its corners, lay across Strawberry Hill as dark planes through the slope — Huntington Falls, 2026-10-05)
      if (e.baseY === undefined && e.deckAbove === undefined && e.shadow !== false && mh >= 6) addShadow(shadows, under, mh * 0.85, shadowOffset(DAYLIGHT.sun), SHADOW_Y)
      if (shadows.triangles > 0) {
        const sm = new Mesh(`landmark:shadow:${e.name}`, this.scene)
        this.terrain.drape(shadows.positions)
        shadows.toVertexData().applyToMesh(sm)
        sm.material = shadowMaterial(this.scene)
        sm.renderingGroupId = 3
        sm.isPickable = false
        shed(sm)
      }
      shed(m)
    } else if (e.file) {
      void this.loadModel(e, cx + ox, y, cz + oz, rotation)
    }
  }

  /**
   * The signs a model asked for, as meshes PARENTED to it — so each one keeps the landmark's position, turn
   * and scale without any of that arithmetic being repeated, and the builder's coordinates stay local.
   *
   * A flat sign is two triangles and a texture made here and now (render/sign-plates.ts), with no asset and
   * no Blender. An extruded one is the GLB tools/signgen baked, loaded like any other model; when it is
   * missing — Blender was not on the PATH at bake time — the landmark simply has no sign, which is the same
   * bargain tools/signs.ts already makes.
   */
  private raiseSigns(signs: PlacedSign[], host: Mesh, name: string): void {
    for (const p of signs) {
      // never drawn beyond the ring the city itself is drawing at (§Soon.0a: that ring is a Paris number)
      const cut = signCut(p.spec.h, MID * TILE)
      if (p.spec.type === 'flat') {
        const m = flatSignMesh(this.scene, p, `sign:${name}:${p.spec.text}`)
        if (!m) continue
        m.parent = host
        m.renderingGroupId = 3
        // gated at the SIGN, not the host's origin: on a 438 m terminal the gondola's board is 150 m from it
        // and was never switched on for a rider standing under it
        const at = Vector3.TransformCoordinates(new Vector3(p.x, p.y, p.z), host.computeWorldMatrix(true))
        this.signs.push({ mesh: m, x: at.x, z: at.z, cut, on: true })
      } else if (p.spec.model) {
        void this.loadSignModel(p, host, name, cut)
      } else {
        console.warn(`landmark ${name}: an extruded sign "${p.spec.text}" with no \`model\` (see tools/signgen/signs.json)`)
      }
    }
  }

  private async loadSignModel(p: PlacedSign, host: Mesh, name: string, cut: number): Promise<void> {
    try {
      const [root, file] = this.modelUrl(`models/${p.spec.model!}`)
      const r = await SceneLoader.ImportMeshAsync('', root, file, this.scene)
      for (const m of r.meshes) {
        if (!(m instanceof Mesh) || m.getTotalVertices() === 0) continue
        m.setParent(null)
        m.bakeCurrentTransformIntoVertices()
        m.parent = host
        // signgen writes the lettering facing +z with its front face at z = 0, which is this file's
        // convention too, so the heading is the only turn it needs
        m.position.set(p.x, p.y, p.z)
        m.rotation.y = p.heading
        m.renderingGroupId = 3
        m.isPickable = false
        // gated at the SIGN, not the host's origin: on a 438 m terminal the gondola's board is 150 m from it
        // and was never switched on for a rider standing under it
        const at = Vector3.TransformCoordinates(new Vector3(p.x, p.y, p.z), host.computeWorldMatrix(true))
        this.signs.push({ mesh: m, x: at.x, z: at.z, cut, on: true })
      }
      for (const m of r.meshes) if (m.name === '__root__') m.dispose()
    } catch (err) {
      console.warn(`landmark ${name}: sign model ${p.spec.model} did not load (npm run signs)`, err)
    }
  }

  /**
   * Every frame: each skyline landmark moved to 800 m along its true direction from the camera and scaled by
   * 800 / its true distance. Uniform scaling about the eye preserves every angle, so the tower is exactly
   * where and exactly as big as it would be at five kilometres.
   */
  update(eye: Vector3): void {
    this.clockHands.update()
    this.rotors.update()
    /*
     * The signs, first: a name too far to read is not drawn at all. A 5 % band round the cut, so a rider
     * sitting exactly on it does not make the sign flicker on and off between frames.
     */
    for (const s of this.signs) {
      const d = Math.hypot(s.x - eye.x, s.z - eye.z)
      const on = s.on ? d < s.cut * 1.05 : d < s.cut
      if (on !== s.on) { s.on = on; s.mesh.setEnabled(on) }
    }
    const R = 800
    for (const s of this.sky) {
      // a skyline stand-in gives way to the landmark's own model within the camera's reach (the Eiffel Tower
      // in central Paris): drawn behind everything, it showed through the lattice
      /*
       * ...measured to the model's own EXTENT, not to its centre. Written for a point landmark (the Eiffel
       * Tower), a centre test puts the switch 1.3 km from the middle of a 2.7 km bridge — which is halfway
       * along its own side span, in mid-air over the strait, exactly where a rider crossing at speed is
       * (BUGS.md #211). Against the rectangle, a rider anywhere on the bridge is 0 m away and has the real
       * model; the stand-in comes back 1.3 km clear of the structure, where the swap cannot be seen.
       */
      const real = this.placed.find((p) => p.name === s.name)
      const near = real !== undefined && distanceToPlaced(real, eye.x, eye.z) < 1300
      s.mesh.setEnabled(!near)
      if (near) continue
      const dx = s.x - eye.x
      const dy = s.y - eye.y
      const dz = s.z - eye.z
      const d = Math.hypot(dx, dy, dz)
      const k = R / Math.max(R, d)
      const px = eye.x + dx * k
      const pz = eye.z + dz * k
      /*
       * Never above the ground it is drawn over. At its true angle a tower's foot five kilometres off is a
       * fraction of a degree below the eye, but the stand-in stands 800 m out, where the city's own ground
       * can be higher than that — and then the tower hung in the sky over a field. Sunk to a little under
       * the ground there, the foot is hidden by it, as it would be by the city in between.
       */
      const py = Math.min(eye.y + dy * k, this.terrain.heightAt(px, pz) - 3)
      s.mesh.position.set(px, py, pz)
      s.mesh.scaling.setAll(k * s.boost)
      // as hazed as the city would be at its true distance, but never past 0.8 — a little under what the city's own fog has
      // reached at the 1.3 km where the real model hands over to this one
      const f = Math.min(0.8, 1 - Math.exp(-d * DAYLIGHT.fogDensity))
      s.haze.fog = -Math.log(1 - f) / Math.max(R, d * k)
    }
  }

  /**
   * Where a model's file actually lives, as [rootUrl, filename].
   *
   * A landmark's own model is next to its manifest, in `landmarks/<region>/`. A SIGN is not: tools/signs.ts
   * writes the generated lettering into `models/signs/`, shared by every city, and a `file` that began
   * "signs/" was being looked for under the region's own directory — so both of the signs the project had
   * (Ghirardelli's and Ripley's) 404ed and silently drew nothing. Anything named "models/..." is resolved
   * from the site root instead.
   */
  private modelUrl(file: string): [string, string] {
    const base = file.startsWith('models/') ? new URL('../../', this.base).href : this.base
    const url = new URL(file, base).href
    const cut = url.lastIndexOf('/') + 1
    return [url.slice(0, cut), url.slice(cut)]
  }

  /** A downloaded model: imported, its glTF `__root__` baked into the vertices (see vegetation.ts), placed. */
  private async loadModel(e: LandmarkEntry, x: number, y: number, z: number, rotation: number): Promise<void> {
    try {
      const [root, file] = this.modelUrl(e.file!)
      const r = await SceneLoader.ImportMeshAsync('', root, file, this.scene)
      for (const m of r.meshes) {
        if (!(m instanceof Mesh) || m.getTotalVertices() === 0) continue
        m.setParent(null)
        m.bakeCurrentTransformIntoVertices()
        m.position.set(x, y, z)
        m.rotation.y = rotation
        m.scaling.setAll(e.scale ?? 1)
        m.renderingGroupId = 3
        m.isPickable = false
        shed(m)
      }
      for (const m of r.meshes) if (m.name === '__root__') m.dispose()
      this.count++
    } catch (err) {
      console.warn(`landmark ${e.name}: model ${e.file} did not load`, err)
    }
  }
}
