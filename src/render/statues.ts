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
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import '@babylonjs/loaders/glTF/2.0'
import type { Scene } from '@babylonjs/core/scene'
import type { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { block, hex, shade } from './landmarks/kit.ts'
import { Projection } from '../city/geo.ts'
import type { Terrain } from '../city/terrain.ts'

export interface StatueEntry {
  id: string
  name: string
  /** under `models/`, e.g. "paris/henri-iv.glb" */
  model: string
  /** which of the model's axes it faces, as loaded */
  front: '+z' | '-z' | '+x' | '-x'
  /** the statue's own height in metres (its bounding box is scaled to it) */
  height: number
  /** placed at a point… */
  lat?: number
  lon?: number
  /** …facing this compass bearing (degrees) */
  bearing?: number
  /** its pedestal: width across its face, depth, height (m); the statue stands on top */
  plinth?: [number, number, number]
  plinthColour?: string
  /** …or on a procedural landmark: at [x, y, z] in its frame (−z is its front), facing `bearing` in that frame */
  attach?: { to: string; at: [number, number, number]; bearing: number }
  /** how far away it is loaded (m); a tall one is seen from further */
  range?: number
  note?: string
}

export const MAX_LOADED = 3

interface Placement { x: number; y: number; z: number; rotation: number }

interface Slot {
  e: StatueEntry
  at: Placement | null
  holder: TransformNode | null
  loading: boolean
  failed: boolean
}

/** the model's facing axis turned to a compass bearing: Babylon's rotation.y θ sends +z to (sin θ, cos θ) */
function rotationFor(front: StatueEntry['front'], bearing: number): number {
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
    placed: () => { name: string; x: number; y?: number; z: number; rotation?: number }[]) {
    this.scene = scene
    this.base = base
    this.terrain = terrain
    this.placed = placed
    const proj = new Projection(origin)
    this.slots = entries.map((e) => ({ e, at: null, holder: null, loading: false, failed: false }))
    const mat = cartoonMaterial(scene, 'cartoonLandmark', false)
    for (const s of this.slots) {
      const e = s.e
      if (e.lat === undefined || e.lon === undefined) continue
      const p = proj.toLocal({ lat: e.lat, lon: e.lon })
      const ground = terrain.heightAt(p.x, p.z)
      const top = e.plinth ? e.plinth[2] : 0
      s.at = { x: p.x, y: ground + top, z: p.z, rotation: rotationFor(e.front, e.bearing ?? 0) }
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
      s.at = { x: host.x + ax * c + az * sn, y: (host.y ?? this.terrain.heightAt(host.x, host.z)) + ay, z: host.z - ax * sn + az * c,
        rotation: host.rotation + rotationFor(s.e.front, s.e.attach.bearing) }
    }
    const dist = (s: Slot): number => (s.at ? Math.hypot(s.at.x - eye.x, s.at.z - eye.z) : Infinity)
    const ranked = this.slots.filter((s) => s.at && !s.failed && dist(s) < (s.e.range ?? 300)).sort((a, b) => dist(a) - dist(b))
    const wanted = new Set(ranked.slice(0, MAX_LOADED))
    // let go first: out of range (with a margin), or not among the nearest while one of those waits for room
    for (const s of this.slots) {
      if (!s.holder) continue
      const far = dist(s) > (s.e.range ?? 300) * 1.2
      const crowded = !wanted.has(s) && [...wanted].some((w) => !w.holder) && this.loaded >= MAX_LOADED
      if (far || crowded) this.unload(s)
    }
    if (this.slots.some((s) => s.loading)) return
    const next = ranked.find((s) => wanted.has(s) && !s.holder)
    if (next && this.loaded < MAX_LOADED) void this.load(next)
  }

  private async load(s: Slot): Promise<void> {
    s.loading = true
    try {
      const r = await SceneLoader.ImportMeshAsync('', `${this.base}models/`, s.e.model, this.scene)
      const root = r.meshes.find((m) => m.name === '__root__') ?? r.meshes[0]
      // the loader's root converts glTF's handedness; our holder places, turns and scales everything under it
      const holder = new TransformNode(`statue:${s.e.id}`, this.scene)
      root.parent = holder
      const { min, max } = root.getHierarchyBoundingVectors(true)
      const scale = s.e.height / Math.max(0.01, max.y - min.y)
      const at = s.at!
      holder.scaling.setAll(scale)
      holder.rotation.y = at.rotation
      holder.position.set(at.x, at.y - min.y * scale, at.z)
      for (const m of r.meshes) {
        m.renderingGroupId = 3
        m.isPickable = false
      }
      s.holder = holder
    } catch (err) {
      s.failed = true
      console.warn(`statue ${s.e.name}: ${s.e.model} did not load`, err)
    } finally {
      s.loading = false
    }
  }

  private unload(s: Slot): void {
    // meshes, their materials and textures: each model's are its own
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
