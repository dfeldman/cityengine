/**
 * PEOPLE ON THE BEACH (owner, 2026-10-06: "people lounging on the beach; beach umbrellas and towels"). Over the dry
 * sand of every `water: 'beach'` zone, groups of one to three people on towels — lying on their backs or fronts,
 * sitting with their legs out or their knees up — some under a beach umbrella, now and then an empty sling chair
 * beside them. Facing the sea, as people do.
 *
 * The bodies are the street crowd's machinery (render/crowd-baked.ts) with a lounging clip baked instead of a stride:
 * a handful of avatar-kit bodies in beachwear (avatarkit `beachSpec`), each posed by one of the kit's lounging clips
 * (`Lie_Back_Loop` …) and baked over a few seconds of its breathing, then thin-instanced with each person's own
 * colours. The towels, umbrellas and chairs are the kit's beach props, merged per tile into one mesh under the city's
 * cartoon material.
 *
 * Placed per tile, deterministically (a hash of the place), so a group is always where it was: a jittered grid over the
 * tile's sand, kept between the swash (16 m up from the waterline) and the dune grass (80 m).
 */
import { Avatar, GeometryService, LOUNGE_CLIPS, beachChair, beachSpec, beachUmbrella, cloneSpec, loadClips, normalizeSpec, towel, type AvatarSpec, type PropGeometry } from 'avatarkit'
import { BakedVertexAnimationManager } from '@babylonjs/core/BakedVertexAnimation/bakedVertexAnimationManager'
import { VertexAnimationBaker } from '@babylonjs/core/BakedVertexAnimation/vertexAnimationBaker'
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { BASE_SKIN, instancedParts, peopleLights, type Part } from './crowd-baked.ts'
import type { TileLayer } from './city.ts'
import type { Terrain } from '../city/terrain.ts'
import { unpackPoints } from '../city/package.ts'
import { initAssets } from '../assets.ts'

type Rgb = [number, number, number]

/** frames baked over the clip's loop, and how many seconds of the loop */
const FRAMES = 16
/** how far into the towel a lounger's lowest point settles (bodies are soft; the towel is a centimetre up) */
const SINK = 0.0
/** where the sand is lounged on: metres up the beach from the waterline */
const NEAR_WATER = 16
const FAR_WATER = 80
/** a candidate every so many metres, and the share that has a group on it */
const GRID = 9
const SHARE = 0.2

interface Variant { meshes: { mesh: Mesh; part: Part }[]; manager: BakedVertexAnimationManager; fps: number; clip: string; lift: number }

interface Lounger { x: number; y: number; z: number; yaw: number; variant: number; phase: number; skin: Rgb; top: Rgb; bottom: Rgb; hair: Rgb }

const SKINS: Rgb[] = [[0.96, 0.8, 0.69], [0.92, 0.72, 0.58], [0.82, 0.6, 0.45], [0.66, 0.45, 0.32], [0.48, 0.32, 0.22], [0.36, 0.23, 0.16]]
const HAIRS: Rgb[] = [[0.1, 0.08, 0.07], [0.24, 0.16, 0.1], [0.45, 0.32, 0.2], [0.75, 0.6, 0.38], [0.55, 0.25, 0.12], [0.6, 0.6, 0.6]]
const SUITS: Rgb[] = [[0.85, 0.15, 0.15], [0.12, 0.35, 0.85], [0.95, 0.65, 0.1], [0.1, 0.6, 0.45], [0.9, 0.3, 0.55], [0.1, 0.1, 0.12], [0.95, 0.95, 0.93], [0.45, 0.3, 0.75], [0.15, 0.2, 0.4]]
const TOWELS: Rgb[][] = [
  [[0.9, 0.2, 0.2], [0.96, 0.95, 0.9]], [[0.15, 0.4, 0.8], [0.96, 0.95, 0.9]], [[0.98, 0.75, 0.15], [0.95, 0.4, 0.2]],
  [[0.2, 0.65, 0.6], [0.96, 0.95, 0.9], [0.95, 0.55, 0.3]], [[0.55, 0.3, 0.7], [0.95, 0.75, 0.85]], [[0.12, 0.2, 0.35], [0.9, 0.85, 0.7]],
]
const UMBRELLAS: Rgb[][] = [[[0.92, 0.2, 0.18], [0.97, 0.96, 0.92]], [[0.15, 0.45, 0.85], [0.97, 0.96, 0.92]], [[0.98, 0.78, 0.2], [0.97, 0.96, 0.92]], [[0.1, 0.6, 0.5], [0.98, 0.9, 0.3]]]
const CHAIRS: Rgb[] = [[0.2, 0.45, 0.8], [0.9, 0.3, 0.25], [0.15, 0.6, 0.45]]

/**
 * Where on its towel a body lies: the towel's centre along the body's own +z, by pose (a body lying on its back has its
 * head to −z and its feet to +z, from the hips; sitting, its legs run out to +z).
 */
const TOWEL_AT: Record<string, number> = { Lie_Back_Loop: 0.1, Lie_Front_Loop: 0.05, Sit_Ground_Loop: 0.35, Sit_Knees_Loop: 0.15 }

function hash(a: number, b: number, k: number): number {
  const v = Math.sin(a * 127.1 + b * 311.7 + k * 74.7) * 43758.5453
  return v - Math.floor(v)
}

export class BeachCrowd {
  private readonly scene: Scene
  private readonly variants: Variant[] = []
  private readonly byTile = new Map<string, Lounger[]>()
  private dirty = false
  private time = 0
  readonly ready: Promise<void>

  constructor(scene: Scene, count = 8) {
    this.scene = scene
    this.ready = this.build(count)
  }

  private async build(count: number): Promise<void> {
    const set = await loadClips()
    for (let i = 0; i < count; i++) {
      try {
        const clip = LOUNGE_CLIPS[i % LOUNGE_CLIPS.length]
        const v = await this.variant(beachSpec(0x2545f491 ^ Math.imul(i + 1, 0x9e3779b9)), i, clip, set)
        if (v) { this.variants.push(v); this.dirty = true }
      } catch (e) {
        console.warn('beach variant', i, e instanceof Error ? e.message : String(e))
      }
    }
  }

  private async variant(seedSpec: AvatarSpec, index: number, clip: string, set: Awaited<ReturnType<typeof loadClips>>): Promise<Variant | null> {
    // dressed to be tinted, as the street crowd is
    const spec = cloneSpec(normalizeSpec(seedSpec))
    spec.skin.color = '#dc9c70'
    spec.hair.color = '#ffffff'
    for (const c of spec.clothes) c.color = '#ffffff'
    await initAssets()
    const geometry = await new GeometryService().request(spec, 'low')
    if (!geometry) return null
    const avatar = new Avatar(this.scene, spec, { geometry, quality: 'low', name: `beach${index}` })
    avatar.root.setEnabled(false)
    await avatar.whenReady()
    avatar.animator.useClips(set)
    avatar.animator.play(clip)
    // settle into the pose (a clip fades in over a quarter of a second)
    for (let i = 0; i < 40; i++) avatar.update(1 / 60)
    const loop = Math.min(4, Math.max(1, set.clips[clip].frames / set.fps))
    const meshes = avatar.getMeshes()
    const body = meshes.find((m) => m.name.endsWith('.body')) ?? meshes[0]
    const skeleton = body.skeleton
    if (!skeleton) return null
    const floatsPerFrame = (skeleton.bones.length + 1) * 16
    const data = new Float32Array(floatsPerFrame * (FRAMES + 1))
    const nodes = avatar.root.getChildTransformNodes(false)
    // the lift: how high the root must stand for the posed body's lowest point to rest on the ground, from the skinned
    // body over the loop (bodies differ in height, and a pose's hips are set for the source's proportions)
    let low = Infinity
    for (let f = 0; f <= FRAMES; f++) {
      if (f > 0) avatar.update(loop / FRAMES)
      avatar.root.computeWorldMatrix(true)
      for (const n of nodes) n.computeWorldMatrix(true)
      for (const m of meshes) m.computeWorldMatrix(true)
      skeleton.prepare(true)
      data.set(skeleton.getTransformMatrices(body), f * floatsPerFrame)
      if (f % 4 === 0) {
        body.refreshBoundingInfo({ applySkeleton: true })
        low = Math.min(low, body.getBoundingInfo().boundingBox.minimumWorld.y - avatar.root.getAbsolutePosition().y)
      }
    }
    body.refreshBoundingInfo()
    const lift = Number.isFinite(low) ? SINK - low : 0.155
    const manager = new BakedVertexAnimationManager(this.scene)
    manager.texture = new VertexAnimationBaker(this.scene, body).textureFromBakedVertexData(data)
    const parts = instancedParts(this.scene, meshes, spec, manager).map(({ mesh, part }) => ({ mesh, part }))
    peopleLights(this.scene)
    avatar.root.position.setAll(0)
    avatar.root.rotationQuaternion = Quaternion.Identity()
    avatar.root.setEnabled(true)
    for (const { mesh } of parts) mesh.setEnabled(false)
    return { meshes: parts, manager, fps: FRAMES / loop, clip, lift }
  }

  /** The tile layer that places the groups and draws their towels, umbrellas and chairs. */
  layer(terrain: Terrain, shore: (x: number, z: number) => { s: number; nx: number; nz: number } | null,
        inBeach: (x: number, z: number) => boolean): TileLayer {
    const props = {
      towels: TOWELS.map((colors, i) => towel({ colors, stripes: 5 + (i % 3) * 2, seed: i + 1 })),
      umbrellas: UMBRELLAS.map((colors) => beachUmbrella({ colors })),
      chairs: CHAIRS.map((color) => beachChair({ color })),
    }
    const mat = cartoonMaterial(this.scene, 'cartoonStatic', false)
    return {
      name: 'beachCrowd',
      range: 2,
      build: (near, rect) => {
        const sand = near.tile.areas.filter((a) => a.kind === 'sand').map((a) => ({ ring: unpackPoints(a.ring), holes: (a.holes ?? []).map(unpackPoints) }))
        if (!sand.length) return []
        const inside = (r: { x: number; z: number }[], x: number, z: number): boolean => {
          let o = false
          for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
            if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
          }
          return o
        }
        const onSand = (x: number, z: number): boolean => sand.some((a) => inside(a.ring, x, z) && !a.holes.some((h) => inside(h, x, z)))
        const out = new MeshBuilder()
        const people: Lounger[] = []
        const put = (g: PropGeometry, x: number, y: number, z: number, yaw: number, tilt = 0, tiltYaw = 0): void => {
          const base = out.positions.length / 3
          const cy = Math.cos(yaw), sy = Math.sin(yaw)
          const ct = Math.cos(tilt), st = Math.sin(tilt), cty = Math.cos(tiltYaw), sty = Math.sin(tiltYaw)
          const tf = (px: number, py: number, pz: number): [number, number, number] => {
            // a lean of `tilt` towards the heading `tiltYaw` (an umbrella towards the sun), then the yaw
            let ax = px * cty - pz * sty, az = px * sty + pz * cty
            const ay = py * ct - az * st; az = py * st + az * ct
            const bx = ax * cty + az * sty, bz = -ax * sty + az * cty
            ax = bx
            return [ax * cy + bz * sy, ay, -ax * sy + bz * cy]
          }
          for (let i = 0; i < g.positions.length; i += 3) {
            const [px, py, pz] = tf(g.positions[i], g.positions[i + 1], g.positions[i + 2])
            out.positions.push(x + px, y + py, z + pz)
            const [qx, qy, qz] = tf(g.normals[i], g.normals[i + 1], g.normals[i + 2])
            out.normals.push(qx, qy, qz)
            out.uvs.push(0, 0)
          }
          for (let i = 0; i < g.colors.length; i += 4) out.colors.push(g.colors[i], g.colors[i + 1], g.colors[i + 2], 0)
          for (const k of g.indices) out.indices.push(base + k)
        }
        const nVariants = Math.max(1, this.variants.length || 8)
        for (let gz = Math.floor(rect.z0 / GRID) * GRID; gz < rect.z1; gz += GRID) {
          for (let gx = Math.floor(rect.x0 / GRID) * GRID; gx < rect.x1; gx += GRID) {
            if (hash(gx, gz, 1) > SHARE) continue
            const x = gx + (hash(gx, gz, 2) - 0.5) * GRID * 0.7, z = gz + (hash(gx, gz, 3) - 0.5) * GRID * 0.7
            if (x < rect.x0 || x >= rect.x1 || z < rect.z0 || z >= rect.z1) continue
            const f = shore(x, z)
            if (!f || -f.s < NEAR_WATER || -f.s > FAR_WATER || !inBeach(x, z) || !onSand(x, z)) continue
            // facing the sea, give or take; the group strung out along the shore
            const yaw0 = Math.atan2(f.nx, f.nz) + (hash(gx, gz, 4) - 0.5) * 0.8
            const tx = Math.cos(yaw0), tz = -Math.sin(yaw0)
            const n = 1 + Math.floor(hash(gx, gz, 5) * 2.6)
            for (let p = 0; p < n; p++) {
              const off = (p - (n - 1) / 2) * 1.05
              const px = x + tx * off, pz = z + tz * off
              if (!onSand(px, pz)) continue
              const vi = Math.floor(hash(gx + p, gz, 6) * nVariants) % nVariants
              const clip = this.variants[vi]?.clip ?? LOUNGE_CLIPS[vi % LOUNGE_CLIPS.length]
              // someone face down has their head to the sea now and then, the rest their feet
              const yaw = yaw0 + (hash(gx + p, gz, 7) - 0.5) * 0.35 + (clip === 'Lie_Front_Loop' && hash(gx + p, gz, 8) < 0.5 ? Math.PI : 0)
              const y = terrain.rawHeightAt(px, pz)
              const along = TOWEL_AT[clip] ?? 0.2
              put(props.towels[Math.floor(hash(gx + p, gz, 9) * props.towels.length)], px + Math.sin(yaw) * along, y, pz + Math.cos(yaw) * along, yaw)
              const pick = <T>(list: T[], k: number): T => list[Math.floor(hash(gx + p, gz, k) * list.length) % list.length]
              people.push({ x: px, y, z: pz, yaw, variant: vi, phase: hash(gx + p, gz, 10) * FRAMES,
                skin: pick(SKINS, 11), top: pick(SUITS, 12), bottom: pick(SUITS, 13), hair: pick(HAIRS, 14) })
            }
            // an umbrella over some groups, planted behind their heads (a body lying on its back reaches ~0.9 m behind
            // its hips) and between two towels, leaned so the canopy comes over them; an empty chair beside a few
            if (hash(gx, gz, 15) < 0.4) {
              const ux = x - Math.sin(yaw0) * 1.25 + tx * 0.52, uz = z - Math.cos(yaw0) * 1.25 + tz * 0.52
              put(props.umbrellas[Math.floor(hash(gx, gz, 16) * props.umbrellas.length)], ux, terrain.rawHeightAt(ux, uz), uz, hash(gx, gz, 17) * Math.PI * 2, 0.22, yaw0 - Math.PI)
            }
            if (hash(gx, gz, 18) < 0.18) {
              const cx = x + tx * (n * 0.55 + 0.7), cz = z + tz * (n * 0.55 + 0.7)
              put(props.chairs[Math.floor(hash(gx, gz, 19) * props.chairs.length)], cx, terrain.rawHeightAt(cx, cz), cz, yaw0 + Math.PI)
            }
          }
        }
        const key = `${rect.x0},${rect.z0}`
        this.byTile.set(key, people)
        this.dirty = true
        if (out.indices.length === 0) return []
        const m = new Mesh(`beachProps:${key}`, this.scene)
        out.toVertexData().applyToMesh(m)
        m.material = mat
        m.isPickable = false
        m.renderingGroupId = 3
        // the people go when their tile does
        m.onDisposeObservable.add(() => { this.byTile.delete(key); this.dirty = true })
        return [m]
      },
    }
  }

  /**
   * A debug lineup (`window.__beachLineup(x, z)`): every variant once, in a row along x a couple of metres apart, so the
   * poses can be judged side by side.
   */
  lineup(x: number, z: number, heightAt: (x: number, z: number) => number): string[] {
    this.byTile.set('lineup', this.variants.map((_, vi) => ({ x: x + vi * 2.6, y: heightAt(x + vi * 2.6, z), z, yaw: Math.PI / 2, variant: vi, phase: 0,
      skin: SKINS[vi % SKINS.length], top: SUITS[vi % SUITS.length], bottom: SUITS[(vi + 3) % SUITS.length], hair: HAIRS[vi % HAIRS.length] })))
    this.dirty = true
    return this.variants.map((v) => `${v.clip} ${v.lift.toFixed(3)}`)
  }

  /** Once a frame: the clock, and the instance buffers when the placed people changed. */
  update(dt: number): void {
    this.time += dt
    for (const v of this.variants) v.manager.time = this.time
    if (!this.dirty || !this.variants.length) return
    this.dirty = false
    const all = [...this.byTile.values()].flat()
    const m = new Matrix()
    const one = new Vector3(1, 1, 1)
    this.variants.forEach((v, vi) => {
      const list = all.filter((l) => l.variant === vi)
      const n = list.length
      const matrices = new Float32Array(n * 16)
      const settings = new Float32Array(n * 4)
      const colours: Record<Part, Float32Array> = {
        skin: new Float32Array(n * 4), top: new Float32Array(n * 4), bottom: new Float32Array(n * 4),
        hair: new Float32Array(n * 4), plain: new Float32Array(n * 4).fill(1), frame: new Float32Array(n * 4).fill(1),
      }
      list.forEach((l, i) => {
        Matrix.ComposeToRef(one, Quaternion.RotationYawPitchRoll(l.yaw, 0, 0), new Vector3(l.x, l.y + v.lift, l.z), m)
        m.copyToArray(matrices, i * 16)
        settings.set([0, FRAMES, l.phase, v.fps], i * 4)
        colours.skin.set([l.skin[0] / BASE_SKIN[0], l.skin[1] / BASE_SKIN[1], l.skin[2] / BASE_SKIN[2], 1], i * 4)
        colours.top.set([...l.top, 1], i * 4)
        colours.bottom.set([...l.bottom, 1], i * 4)
        colours.hair.set([...l.hair, 1], i * 4)
      })
      for (const { mesh, part } of v.meshes) {
        if (n === 0) { mesh.setEnabled(false); continue }
        mesh.thinInstanceSetBuffer('matrix', matrices, 16, false)
        if (mesh.bakedVertexAnimationManager) mesh.thinInstanceSetBuffer('bakedVertexAnimationSettingsInstanced', settings, 4, false)
        mesh.thinInstanceSetBuffer('color', colours[part], 4, false)
        mesh.setEnabled(true)
      }
    })
  }
}
