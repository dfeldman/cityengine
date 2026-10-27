/**
 * Statues from real models (the user's own GLBs, `public/models/<region>/`, packed by tools/glb/pack.ts).
 *
 * A GLB holds its textures and a full-resolution mesh, so it costs real memory; the pool keeps AT MOST
 * `MAX_LOADED` in the scene (user, 2026-09-22: "limit to having say 3 onscreen at once"), the nearest within
 * each one's range, loading one at a time and letting go of one only when it is well out of range or a
 * nearer one needs its place. The pedestals are procedural and always there — cheap, and a plinth without
 * its statue for a moment reads as a plinth, not as a hole.
 *
 * Where a statue goes: its own lat/lon, standing on its pedestal and facing `bearing` (compass degrees); or
 * ATTACHED to a procedural landmark (`attach.to`), at a point in that landmark's own frame once it is placed —
 * the Génie de la Liberté on the Colonne de Juillet, the Cirque d'Hiver's two horsemen, Marianne on her
 * monument. Models face along `front`, one of their own axes (as the loader leaves them: tools/glb/preview.ts
 * shows which), and are scaled to `height` metres.
 *
 * Or an ASSETKIT MODEL (`asset`: an id in assetkit's assetkit-models-sf index, made by assetkit tools/modelpack): the
 * model's own facts — real size, front axis, waterline — come from the index (assets.ts `modelInfo`), so the entry only
 * says where it goes. It has one file per LOD (`models/sf/<id>.lod<N>.glb`) and the pool loads the one its distance
 * asks for (`lodRanges`, with a margin so it doesn't flicker at the boundary), swapping without a gap. A ship `float`s:
 * its waterline on the sea. And while it is loaded, the procedural landmark it `replaces` (the cheap far stand-in, always
 * built) is hidden.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import '@babylonjs/loaders/glTF/2.0'
import type { Scene } from '@babylonjs/core/scene'
import type { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Plane } from '@babylonjs/core/Maths/math.plane'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { PBRMetallicRoughnessMaterial } from '@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { block, hex, shade } from './landmarks/kit.ts'
import { Projection } from '../city/geo.ts'
import type { Terrain } from '../city/terrain.ts'
import { assetRootAndFile, modelInfo } from '../assets.ts'

export interface StatueEntry {
  id: string
  name: string
  /** under `models/`, e.g. "paris/henri-iv.glb" (an `asset` names its own files) */
  model?: string
  /** an assetkit-models-sf model id: its files, size, front and draft come from the index */
  asset?: string
  /** which of the model's axes it faces, as loaded (an `asset` has its own) */
  front?: '+z' | '-z' | '+x' | '-x'
  /** the statue's own height in metres (its bounding box is scaled to it; an `asset` has its own scale) */
  height?: number
  /** an `asset`'s LOD n is loaded within lodRanges[n] metres; beyond the last, none (the `replaces` stand-in shows) */
  lodRanges?: number[]
  /** stands on the sea: its waterline (the model's `draft`) at sea level — a ship */
  float?: boolean
  /** the procedural landmark (its manifest `name`) hidden while this is loaded */
  replaces?: string
  /** the procedural monument it deliberately stands beside (the audit's 15 m duplicate check lets the pair be) */
  beside?: string
  /** placed at a point… */
  lat?: number
  lon?: number
  /** …facing this compass bearing (degrees) */
  bearing?: number
  /** its pedestal: width across its face, depth, height (m); the statue stands on top */
  plinth?: [number, number, number]
  plinthColour?: string
  /** stands on a deck this many metres above sea level (the landmarks' `deckAbove`): a plaza on piles, which the ground
   *  under it — the flattened sea bed — knows nothing of (Gandhi on the Ferry Plaza deck, 2026-10-18) */
  deckAbove?: number
  /** …or on a procedural landmark: at [x, y, z] in its frame (−z is its front), facing `bearing` in that frame */
  attach?: { to: string; at: [number, number, number]; bearing: number; draped?: boolean }
  /** how far away it is loaded (m); a tall one is seen from further */
  range?: number
  note?: string
}

/** (3 for the Paris statues, owner 2026-09-22; 4 since Hyde Street Pier's four ships stand within 200 m of each other,
 *  2026-10-18 — a ship's LOD 0 is ~1 MB of file and one 1024 px texture; 24 since the Japanese Tea Garden's twenty
 *  GLBs — its pagoda, gates, tea house, ten lanterns, the stone pagoda, the tsukubai, the cranes — stand within 100 m of
 *  each other and the four nearest were all lanterns, so the pagoda showed its stand-in "unless I get extremely close"
 *  (owner, 2026-10-26). A lantern's LOD 0 is ~250 kB; the ships keep their own short ranges.) */
export const MAX_LOADED = 24

interface Placement { x: number; y: number; z: number; rotation: number }

interface Slot {
  e: StatueEntry
  at: Placement | null
  holder: TransformNode | null
  /** the LOD in `holder` (an asset's), or 0 */
  lod: number
  loading: boolean
  failed: boolean
}
/**
 * An UNTEXTURED model's metal (assetkit `extra.model.material`, assetmgr's SHADER_PRESETS): most AI statues are bare
 * geometry, and a bronze texture would only say "bronze". One shared material per shader, kept with the scene, never
 * disposed with a model. Real outdoor bronze and verdigris are nearly black (owner, 2026-10-18: "both close to black … they
 * should be closer"): dark, with a little sheen so the form still reads.
 */
/**
 * PBR, as the trees and the GLB statues are lit (render/vegetation.ts `foliageLights`): a StandardMaterial under those
 * lights came out three times too bright — a dark bronze shone orange (owner, 2026-10-18: "too light").
 */
const SHADERS: Record<string, { colour: [number, number, number]; metallic: number; roughness: number }> = {
  bronze: { colour: [0.2, 0.14, 0.09], metallic: 0.85, roughness: 0.5 },
  copper: { colour: [0.6, 0.38, 0.28], metallic: 0.9, roughness: 0.4 },
  copperoxide: { colour: [0.09, 0.16, 0.13], metallic: 0.2, roughness: 0.75 },
  marble: { colour: [0.78, 0.76, 0.72], metallic: 0, roughness: 0.35 },
  plaster: { colour: [0.75, 0.73, 0.68], metallic: 0, roughness: 0.9 },
  concrete: { colour: [0.5, 0.49, 0.46], metallic: 0, roughness: 0.95 },
  whitestone: { colour: [0.75, 0.73, 0.68], metallic: 0, roughness: 0.85 },
  silver: { colour: [0.7, 0.72, 0.74], metallic: 1, roughness: 0.3 },
}
const shaderMats = new Map<string, PBRMetallicRoughnessMaterial>()
function shaderMaterial(scene: Scene, name: string): PBRMetallicRoughnessMaterial {
  const key = name in SHADERS ? name : 'bronze'
  let m = shaderMats.get(key)
  if (!m || m.getScene() !== scene) {
    const p = SHADERS[key]
    m = new PBRMetallicRoughnessMaterial(`statue-shader:${key}`, scene)
    m.baseColor = new Color3(...p.colour)
    m.metallic = p.metallic
    m.roughness = p.roughness
    m.doNotSerialize = true
    shaderMats.set(key, m)
  }
  return m
}

/** the margin a LOD boundary is crossed by before the other file is loaded: no flicker at the line */
const LOD_HYSTERESIS = 0.12

/** the model's facing axis turned to a compass bearing: Babylon's rotation.y θ sends +z to (sin θ, cos θ) */
function rotationFor(front: NonNullable<StatueEntry['front']>, bearing: number): number {
  const b = (bearing * Math.PI) / 180
  return front === '+z' ? b : front === '+x' ? b - Math.PI / 2 : front === '-x' ? b + Math.PI / 2 : b + Math.PI
}

export class Statues {
  private readonly scene: Scene
  private readonly base: string
  private readonly slots: Slot[]
  private readonly terrain: Terrain
  private readonly placed: () => { name: string; x: number; y?: number; z: number; rotation?: number }[]
  private last = 0

  constructor(scene: Scene, entries: StatueEntry[], origin: { lat: number; lon: number }, terrain: Terrain, base: string,
    placed: () => { name: string; x: number; y?: number; z: number; rotation?: number }[], seaLevel: number | null = null) {
    this.scene = scene
    this.base = base
    this.terrain = terrain
    this.placed = placed
    const proj = new Projection(origin)
    this.slots = entries.map((e) => ({ e, at: null, holder: null, lod: 0, loading: false, failed: false }))
    const mat = cartoonMaterial(scene, 'cartoonLandmark', false)
    for (const s of this.slots) {
      const e = s.e
      if (e.lat === undefined || e.lon === undefined) continue
      const p = proj.toLocal({ lat: e.lat, lon: e.lon })
      const ground = seaLevel !== null && (e.float || e.deckAbove !== undefined) ? seaLevel + (e.deckAbove ?? 0) : terrain.heightAt(p.x, p.z)
      const top = e.plinth ? e.plinth[2] : 0
      // (an asset's front is its index's, read when it loads: the rotation is finished then)
      s.at = { x: p.x, y: ground + top, z: p.z, rotation: e.front ? rotationFor(e.front, e.bearing ?? 0) : (((e.bearing ?? 0) * Math.PI) / 180) }
      if (e.plinth) {
        // the pedestal: a step, the die, a cornice — turned square to the statue
        const [w, d, h] = e.plinth
        const stone = hex(e.plinthColour ?? '#bdb6a8')
        const pb = new MeshBuilder()
        block(pb, -w / 2 - 0.35, w / 2 + 0.35, -d / 2 - 0.35, d / 2 + 0.35, 0, Math.min(0.4, h * 0.15), shade(stone, 0.92))
        block(pb, -w / 2, w / 2, -d / 2, d / 2, Math.min(0.4, h * 0.15), h - 0.35, stone)
        block(pb, -w / 2 - 0.18, w / 2 + 0.18, -d / 2 - 0.18, d / 2 + 0.18, h - 0.35, h, shade(stone, 0.95))
        const m = new Mesh(`plinth:${e.id}`, scene)
        pb.toVertexData().applyToMesh(m)
        m.material = mat
        m.position.set(p.x, ground - 0.1, p.z)
        m.rotation.y = (((e.bearing ?? 0) * Math.PI) / 180)
        m.renderingGroupId = 3
        m.isPickable = false
        m.freezeWorldMatrix()
      }
    }
  }

  /** How many models are in the scene now (for the HUD and the tests of the cap). */
  get loaded(): number { return this.slots.filter((s) => s.holder).length }

  /** Four times a second: resolve attachments, pick the nearest few, load one, let go of the far. */
  update(eye: Vector3): void {
    const now = performance.now()
    if (now - this.last < 250) return
    this.last = now
    for (const s of this.slots) {
      if (s.at || !s.e.attach) continue
      const host = this.placed().find((q) => q.name === s.e.attach!.to)
      if (!host || host.rotation === undefined) continue
      const [ax, ay, az] = s.e.attach.at
      const c = Math.cos(host.rotation)
      const sn = Math.sin(host.rotation)
      // the host's frame to the world: rotation.y θ sends local (x, z) to (x cos θ + z sin θ, −x sin θ + z cos θ)
      const wx = host.x + ax * c + az * sn, wz = host.z - ax * sn + az * c
      // (a DRAPED host — `drape: true` in its manifest, Union Square — has its heights over the ground under each point, not
      //  over its own base: the Dewey Victory stood 3 m down inside her column)
      const base = s.e.attach.draped ? this.terrain.heightAt(wx, wz) : host.y ?? this.terrain.heightAt(host.x, host.z)
      s.at = { x: wx, y: base + ay, z: wz,
        rotation: host.rotation + rotationFor(s.e.front ?? '+z', s.e.attach.bearing) }
    }
    const dist = (s: Slot): number => (s.at ? Math.hypot(s.at.x - eye.x, s.at.z - eye.z) : Infinity)
    const range = (s: Slot): number => s.e.lodRanges?.at(-1) ?? s.e.range ?? 300
    const ranked = this.slots.filter((s) => s.at && !s.failed && dist(s) < range(s)).sort((a, b) => dist(a) - dist(b))
    const wanted = new Set(ranked.slice(0, MAX_LOADED))
    // let go first: out of range (with a margin), or not among the nearest while one of those waits for room
    for (const s of this.slots) {
      if (!s.holder) continue
      const far = dist(s) > range(s) * (1 + LOD_HYSTERESIS)
      const crowded = !wanted.has(s) && [...wanted].some((w) => !w.holder) && this.loaded >= MAX_LOADED
      if (far || crowded) this.unload(s)
    }
    // the procedural stand-ins: hidden while the model is in, shown again when it goes (re-applied every tick: the
    // landmarks of a tile are rebuilt when it comes back into range)
    for (const s of this.slots) {
      if (!s.e.replaces) continue
      const name = `landmark:${s.e.replaces}`
      for (const m of this.scene.meshes) if (m.name === name || m.name === `landmark:shadow:${s.e.replaces}`) m.isVisible = !s.holder
    }
    if (this.slots.some((s) => s.loading)) return
    // a loaded asset whose distance now asks for another LOD: that file is loaded, then swapped in
    const relod = ranked.find((s) => wanted.has(s) && s.holder && s.e.asset && this.lodFor(s, dist(s)) !== s.lod)
    if (relod) { void this.load(relod, this.lodFor(relod, dist(relod))); return }
    const next = ranked.find((s) => wanted.has(s) && !s.holder)
    if (next && this.loaded < MAX_LOADED) void this.load(next, this.lodFor(next, dist(next)))
  }

  /** the LOD an asset's distance asks for, sticking with the one it has inside the margin */
  private lodFor(s: Slot, d: number): number {
    const r = s.e.lodRanges
    if (!s.e.asset || !r) return 0
    let want = r.findIndex((x) => d < x)
    if (want < 0) want = r.length - 1
    if (s.holder && want !== s.lod) {
      const edge = r[Math.min(want, s.lod)]
      if (Math.abs(d - edge) < edge * LOD_HYSTERESIS) return s.lod
    }
    return want
  }

  private async load(s: Slot, lod = 0): Promise<void> {
    s.loading = true
    const info = s.e.asset ? modelInfo(s.e.asset) : null
    if (s.e.asset && !info) { s.failed = true; s.loading = false; console.warn(`statue ${s.e.name}: ${s.e.asset} is not in the asset bucket`); return }
    const file = info ? `sf/${s.e.asset}.lod${Math.min(lod, info.lods.length - 1)}.glb` : s.e.model!
    try {
      const r = await SceneLoader.ImportMeshAsync('', ...assetRootAndFile(`${this.base}models/`, file), this.scene)
      const root = r.meshes.find((m) => m.name === '__root__') ?? r.meshes[0]
      // the loader's root converts glTF's handedness; our holder places, turns and scales everything under it
      const holder = new TransformNode(`statue:${s.e.id}`, this.scene)
      root.parent = holder
      const { min, max } = root.getHierarchyBoundingVectors(true)
      const k = info ? { x: 0, y: 1, z: 2 }[info.scale.axis] : 1
      const along = info ? [max.x - min.x, max.y - min.y, max.z - min.z][k] : max.y - min.y
      const scale = (info ? info.scale.metres : s.e.height ?? 3) / Math.max(0.01, along)
      const at = s.at!
      holder.scaling.setAll(scale)
      holder.rotation.y = info ? at.rotation + rotationFor(info.front, 0) : at.rotation
      // its foot on the ground (or plinth); a floating one with its waterline (`draft` up from its lowest point) on the sea
      holder.position.set(at.x, at.y - min.y * scale - (s.e.float ? info?.draft ?? 0 : 0), at.z)
      // a floating one is CUT at the waterline as it is drawn: the sea is drawn in an earlier rendering group, whose depth
      // is cleared before this one, so the hull under the water would otherwise be drawn over it (2026-10-18, the
      // Balclutha's red bottom stood out of the bay). The model itself stays whole: it is a shared asset.
      const cut = s.e.float ? new Plane(0, -1, 0, at.y) : null
      // (an untextured one: its shared metal, in place of the loader's default grey)
      const metal = info && info.material !== 'textured' ? shaderMaterial(this.scene, info.material) : null
      for (const m of r.meshes) {
        m.renderingGroupId = 3
        m.isPickable = false
        if (metal && m.getTotalVertices() > 0) { m.material?.dispose(); m.material = metal }
        if (cut && m instanceof Mesh) {
          m.onBeforeRenderObservable.add(() => { this.scene.clipPlane = cut })
          m.onAfterRenderObservable.add(() => { this.scene.clipPlane = null })
        }
      }
      // a swap of LODs: the new one is in before the old one goes, so there is never a gap
      if (s.holder) this.unload(s)
      s.holder = holder
      s.lod = lod
    } catch (err) {
      s.failed = true
      console.warn(`statue ${s.e.name}: ${s.e.model} did not load`, err)
    } finally {
      s.loading = false
    }
  }

  private unload(s: Slot): void {
    // meshes, their materials and textures: each model's are its own
    // (a shared metal is not this model's to dispose: let go of it first)
    for (const m of s.holder?.getChildMeshes() ?? []) if (m.material && [...shaderMats.values()].includes(m.material as PBRMetallicRoughnessMaterial)) m.material = null
    s.holder?.dispose(false, true)
    s.holder = null
  }
}

/** The statues for a city or its region: `landmarks/<name>-statues.json`, or none. */
export async function statueManifest(base: string, city: string, region?: string): Promise<StatueEntry[]> {
  for (const name of region ? [city, region] : [city]) {
    try {
      const r = await fetch(new URL(`landmarks/${name}-statues.json`, base).href)
      const text = await r.text()
      if (r.ok && text.trimStart().startsWith('[')) return JSON.parse(text) as StatueEntry[]
    } catch {
      // the next
    }
  }
  return []
}
