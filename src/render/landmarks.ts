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
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import type { Scene } from '@babylonjs/core/scene'
import type { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { DAYLIGHT } from './facade-material.ts'
import { SHADOW_Y, addShadow, shadowMaterial, shadowOffset } from './shadows.ts'
import { PROCEDURAL, type Fit } from './landmarks/procedural.ts'
import { TILE, type TileData } from '../city/tiles.ts'
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
   * The bearing, in degrees, that the model's main facade faces (0 north, 90 east), or "street" to take it
   * from the building's baked frontage. The builder is written with its front facing local −z.
   */
  front?: number | 'street'
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
  /** for a standalone model: its footprint, for the shadow and the fit, in metres (width × depth) */
  size?: [number, number]
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
      if (r.ok && text.trimStart().startsWith('[')) return JSON.parse(text) as LandmarkEntry[]
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
 * The restyles: building id → the entry restyling it. A building is taken if the entry names it, or if its
 * centre is outside the entry's `within` ring and its nearest corner no further from it than `margin` — the
 * houses fronting a square, however deep they run back, and not whatever stands in its garden. Applied when
 * the package is loaded, before any tile is built, so a restyle needs no re-bake.
 */
export function restyles(entries: LandmarkEntry[], pkg: Pick<CityPackage, 'origin' | 'buildings' | 'landmarks'>): Map<number, LandmarkEntry> {
  const out = new Map<number, LandmarkEntry>()
  const proj = new Projection(pkg.origin)
  for (const e of entries) {
    if (!e.restyle) continue
    for (const id of packedIds(e)) out.set(id, e)
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
      if (e.take === 'inside') { if (inside) out.set(b.id, e); continue }
      if (inside) continue
      if (near <= margin) out.set(b.id, e)
    }
  }
  return out
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
function fitTo(b: Pick<PackedBuilding, 'ring'>, height: number): { fit: Fit; cx: number; cz: number; rotation: number } {
  const ring = unpackPoints(b.ring)
  let best = 0
  let dir = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const c = ring[(i + 1) % ring.length]
    const len = Math.hypot(c.x - a.x, c.z - a.z)
    if (len > best) { best = len; dir = Math.atan2(c.z - a.z, c.x - a.x) }
  }
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

/** A skyline landmark: its true position, and how much larger than true it is drawn (see skylineBoost). */
interface SkyItem { name: string; mesh: Mesh; x: number; y: number; z: number; boost: number }

/**
 * Far landmarks are drawn larger than true, growing with distance: 1× inside 1.5 km, 1.8× by 5 km. At its true
 * size the Eiffel Tower from the Marais is 4° tall — a sliver in a 70° view, far smaller than it is remembered
 * (the eye singles it out; a screen does not). Scaled about its base, so it still stands on the horizon.
 */
export function skylineBoost(d: number): number {
  return 1 + 0.8 * Math.min(1, Math.max(0, (d - 1500) / 3500))
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

  private readonly scene: Scene
  private readonly base: string

  private readonly terrain: Terrain

  /** the city's buildings seen so far (city and fringe), by id, for fitting a landmark to its own */
  private readonly byId = new Map<number, Pick<PackedBuilding, 'id' | 'ring' | 'height' | 'holes'>>()
  private readonly wanted = new Set<number>()
  /** entries not yet placed: each waits for the tile its building, or its point, is in */
  private pending: LandmarkEntry[]
  private readonly named: PackedLandmark[]
  private readonly proj: Projection
  private readonly mat: ShaderMaterial
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
  constructor(scene: Scene, pkg: Pick<CityPackage, 'origin' | 'skyline' | 'landmarks'>, entries: LandmarkEntry[], terrain: Terrain, base: string) {
    this.terrain = terrain
    this.scene = scene
    this.base = base
    this.proj = new Projection(pkg.origin)
    this.named = pkg.landmarks ?? []
    this.pending = entries.filter((e) => entryKind(e) !== 'restyle' && entryKind(e) !== 'placeholder')
    for (const e of this.pending) for (const id of [...packedIds(e), ...(e.on ? packedIds({ name: e.name, osm: e.on }) : [])]) this.wanted.add(id)
    const mat = cartoonMaterial(scene, 'cartoonLandmark', false)
    // drawn both sides: one mesh per landmark, and a builder's hand-wound quads need not all agree
    mat.backFaceCulling = false
    this.mat = mat

    // ---- the skyline
    const skyMat = cartoonMaterial(scene, 'cartoonSkyline', false)
    skyMat.setFloat('fogDensity', 0.00002)
    const fog = DAYLIGHT.fogColour
    for (const s of pkg.skyline ?? []) {
      const build = PROCEDURAL[s.procedural]
      if (!build) continue
      const mb = new MeshBuilder()
      build(mb, { hx: 20, hz: 20, height: s.heightM })
      // hazed toward the horizon by distance, baked in: at kilometres the change as the rider moves is nil
      const d = Math.hypot(s.x, s.z)
      const haze = Math.min(0.85, 1 - Math.exp(-d / 6000))
      for (let i = 0; i < mb.colors.length; i += 4) {
        mb.colors[i] += (fog.r - mb.colors[i]) * haze
        mb.colors[i + 1] += (fog.g - mb.colors[i + 1]) * haze
        mb.colors[i + 2] += (fog.b - mb.colors[i + 2]) * haze
      }
      const m = new Mesh(`skyline:${s.name}`, scene)
      mb.toVertexData().applyToMesh(m)
      m.material = skyMat
      // group 0, with the sky dome: every solid thing in the city draws over it, so it shows only where
      // there is sky — which is exactly where a tower five kilometres away should show
      m.renderingGroupId = 0
      m.isPickable = false
      m.alwaysSelectAsActiveMesh = true
      this.sky.push({ name: s.name, mesh: m, x: s.x, y: s.baseY ?? 0, z: s.z, boost: skylineBoost(d) })
    }
  }

  /** A tile's data arrived: place every landmark that was waiting for it. */
  addTile(t: TileData): void {
    if (this.pending.length === 0) return
    // only the buildings some landmark is fitted to: a streamed city passes every one of them through here
    for (const b of t.fringe) if (this.wanted.has(b.id)) this.byId.set(b.id, b)
    for (const b of t.buildings) if (this.wanted.has(b.id)) this.byId.set(b.id, b)
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
        : ids.length > 0 && this.byId.has(ids[0])
      if (!ready) return true
      this.place(e)
      return false
    })
  }

  private place(e: LandmarkEntry): void {
    const onId = e.on ? packedIds({ name: e.name, osm: e.on })[0] : undefined
    const building = onId !== undefined ? this.byId.get(onId)
      : this.byId.get(packedIds(e)[0]) ?? packedIds(e).map((id) => this.byId.get(id)).find((b) => b)
    const height = e.height ?? building?.height ?? 30
    let cx: number
    let cz: number
    let rotation = ((e.rotateDeg ?? 0) * Math.PI) / 180
    let fit: Fit = { hx: (e.size?.[0] ?? 20) / 2, hz: (e.size?.[1] ?? 20) / 2, height }
    let ring: { x: number; z: number }[] | null = null
    // a point AND a size: placed there at that size, whatever its buildings are — the Grand Palais is eight
    // OSM parts, and fitted to the first it came out a third of its size, off to one side
    const atPoint = e.lat !== undefined && e.lon !== undefined && e.size !== undefined
    if (building && !atPoint) {
      ring = unpackPoints(building.ring)
      if (e.court) {
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
        const l = this.named.find((x) => x.id === building.id)
        if (l) bearing = (Math.atan2(l.frontage.nx, l.frontage.nz) * 180) / Math.PI
      }
      if (bearing !== undefined) {
        const f = fitSnug(ring!, bearing)
        cx = f.cx; cz = f.cz; rotation = f.rotation
        fit = { hx: f.hx, hz: f.hz, height }
        if (e.court) {
          // the court's outline in the model's frame: world = c + (x cos θ + z sin θ, −x sin θ + z cos θ)
          const c = Math.cos(rotation)
          const sn = Math.sin(rotation)
          fit.ring = ring!.map((p) => {
            const dx = p.x - f.cx
            const dz = p.z - f.cz
            return { x: dx * c - dz * sn, z: dx * sn + dz * c }
          })
        }
      } else {
        const f = fitTo(building, height)
        cx = f.cx; cz = f.cz; fit = f.fit
        if (e.rotateDeg === undefined) rotation = f.rotation
      }
    } else if (e.lat !== undefined && e.lon !== undefined) {
      const p = this.proj.toLocal({ lat: e.lat, lon: e.lon })
      cx = p.x; cz = p.z
      if (typeof e.front === 'number') rotation = ((e.front + 180) * Math.PI) / 180
    } else return
    const [ox, oy, oz] = e.offset ?? [0, 0, 0]
    // sunk to the lowest ground under it, as the city's own buildings are, so a slope shows no daylight
    const under = ring ?? rectRing(cx, cz, fit.hx, fit.hz, rotation)
    const y = Math.min(...under.map((q) => this.terrain.heightAt(q.x, q.z)), this.terrain.heightAt(cx, cz)) - 0.5 + oy

    if (e.procedural) {
      const build = PROCEDURAL[e.procedural]
      if (!build) { console.warn(`landmark ${e.name}: no procedural builder "${e.procedural}"`); return }
      const mb = new MeshBuilder()
      build(mb, fit)
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
      if (e.sign !== false) this.placed.push({ name: e.name, x: cx + ox, y, z: cz + oz, hx: fit.hx, hz: fit.hz, rotation, height: modelHeight(mb) })
      // and its shadow, from the footprint it stands on, the height it reaches
      const shadows = new MeshBuilder()
      addShadow(shadows, under, modelHeight(mb) * 0.85, shadowOffset(DAYLIGHT.sun), SHADOW_Y)
      if (shadows.triangles > 0) {
        const sm = new Mesh(`landmark:shadow:${e.name}`, this.scene)
        this.terrain.drape(shadows.positions)
        shadows.toVertexData().applyToMesh(sm)
        sm.material = shadowMaterial(this.scene)
        sm.renderingGroupId = 3
        sm.isPickable = false
      }
    } else if (e.file) {
      void this.loadModel(e, cx + ox, y, cz + oz, rotation)
    }
  }

  /**
   * Every frame: each skyline landmark moved to 800 m along its true direction from the camera and scaled by
   * 800 / its true distance. Uniform scaling about the eye preserves every angle, so the tower is exactly
   * where and exactly as big as it would be at five kilometres.
   */
  update(eye: Vector3): void {
    const R = 800
    for (const s of this.sky) {
      // a skyline stand-in gives way to the landmark's own model within the camera's reach (the Eiffel Tower
      // in central Paris): drawn behind everything, it showed through the lattice
      const real = this.placed.find((p) => p.name === s.name)
      const near = real !== undefined && Math.hypot(real.x - eye.x, real.z - eye.z) < 1300
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
    }
  }

  /** A downloaded model: imported, its glTF `__root__` baked into the vertices (see vegetation.ts), placed. */
  private async loadModel(e: LandmarkEntry, x: number, y: number, z: number, rotation: number): Promise<void> {
    try {
      const r = await SceneLoader.ImportMeshAsync('', this.base, e.file!, this.scene)
      for (const m of r.meshes) {
        if (!(m instanceof Mesh) || m.getTotalVertices() === 0) continue
        m.setParent(null)
        m.bakeCurrentTransformIntoVertices()
        m.position.set(x, y, z)
        m.rotation.y = rotation
        m.scaling.setAll(e.scale ?? 1)
        m.renderingGroupId = 3
        m.isPickable = false
      }
      for (const m of r.meshes) if (m.name === '__root__') m.dispose()
      this.count++
    } catch (err) {
      console.warn(`landmark ${e.name}: model ${e.file} did not load`, err)
    }
  }
}
