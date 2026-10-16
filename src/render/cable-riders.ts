/**
 * THE PEOPLE ON THE CABLE CARS (owner, 2026-10-16: "the other passengers in the cable cars should get real avatars
 * too"): the box figures that were baked into the car models, replaced by avatar-kit bodies — standing on the running
 * boards holding on, sitting on the open section's outward benches and along the saloon.
 *
 * The beach crowd's machinery (render/beach-crowd.ts): a handful of low-quality kit bodies, each posed by one of the
 * kit's clips — the standing idle (`Idle_Loop`) or the chair sit (`Sitting_Idle_Loop`) — baked over a few seconds of
 * its breathing and thin-instanced with each passenger's own colours. Placed every frame on the cars `Life` is drawing
 * (`transitBodies`, with each car's pitch), at the car's seats (sf/trains.ts `CABLE_SEATS`), so they ride with it up
 * Hyde Street. Bodies stay upright on a pitched car, as people do.
 *
 * Not every seat is taken: a car's own seed picks about two thirds of them, the same ones every frame.
 */
import { Avatar, GeometryService, cloneSpec, loadClips, normalizeSpec, randomSpec, type AvatarSpec } from 'avatarkit'
import { BakedVertexAnimationManager } from '@babylonjs/core/BakedVertexAnimation/bakedVertexAnimationManager'
import { VertexAnimationBaker } from '@babylonjs/core/BakedVertexAnimation/vertexAnimationBaker'
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { BASE_SKIN, cityClothes, instancedParts, peopleLights, type Part } from './crowd-baked.ts'
import { CABLE_SEATS, type CableSeat } from './sf/trains.ts'
import { initAssets } from '../assets.ts'

type Rgb = [number, number, number]
interface Variant { meshes: { mesh: Mesh; part: Part }[]; manager: BakedVertexAnimationManager; fps: number; standing: boolean; lift: number }
interface CarBody { id: string; x: number; z: number; y: number; heading: number; len: number; kind: number; pitch?: number; seed?: number }

const FRAMES = 16
/** cars further than this from the camera carry nobody (they are not drawn past 420 m, and people are small) */
const RANGE = 220
const CABLE = 3

const SKINS: Rgb[] = [[0.96, 0.8, 0.69], [0.92, 0.72, 0.58], [0.82, 0.6, 0.45], [0.66, 0.45, 0.32], [0.48, 0.32, 0.22], [0.36, 0.23, 0.16]]
const HAIRS: Rgb[] = [[0.1, 0.08, 0.07], [0.24, 0.16, 0.1], [0.45, 0.32, 0.2], [0.75, 0.6, 0.38], [0.55, 0.25, 0.12], [0.6, 0.6, 0.6]]
const TOPS: Rgb[] = [[0.8, 0.2, 0.2], [0.2, 0.35, 0.7], [0.95, 0.85, 0.3], [0.92, 0.92, 0.92], [0.15, 0.15, 0.18], [0.3, 0.6, 0.35], [0.85, 0.5, 0.6], [0.55, 0.4, 0.3], [0.9, 0.55, 0.2]]
const BOTTOMS: Rgb[] = [[0.18, 0.22, 0.35], [0.12, 0.12, 0.14], [0.55, 0.5, 0.42], [0.3, 0.3, 0.32], [0.62, 0.62, 0.66]]

const hash = (a: number, b: number): number => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v) }
const pick = <T>(list: T[], h: number): T => list[Math.floor(h * list.length) % list.length]

export class CableRiders {
  private readonly scene: Scene
  private readonly variants: Variant[] = []
  private time = 0
  private buf: { cap: number; matrices: Float32Array; settings: Float32Array; colours: Record<Part, Float32Array> }[] = []
  readonly ready: Promise<void>

  constructor(scene: Scene, count = 4) {
    this.scene = scene
    this.ready = this.build(count)
  }

  private async build(count: number): Promise<void> {
    const set = await loadClips()
    for (let i = 0; i < count; i++) {
      try {
        const standing = i % 2 === 0
        const seed = 0x3c6ef372 ^ Math.imul(i + 1, 0x9e3779b9)
        const v = await this.variant(cityClothes(randomSpec(seed), seed, 2 + i), i, standing, set)
        if (v) this.variants.push(v)
      } catch (e) {
        console.warn('cable rider variant', i, e instanceof Error ? e.message : String(e))
      }
    }
  }

  private async variant(seedSpec: AvatarSpec, index: number, standing: boolean, set: Awaited<ReturnType<typeof loadClips>>): Promise<Variant | null> {
    // dressed to be tinted, as the street crowd is
    const spec = cloneSpec(normalizeSpec(seedSpec))
    spec.skin.color = '#dc9c70'
    spec.hair.color = '#ffffff'
    for (const c of spec.clothes) c.color = '#ffffff'
    if (spec.clothes.length >= 3) spec.clothes[spec.clothes.length - 1].id = 'shoes06'
    await initAssets()
    const geometry = await new GeometryService().request(spec, 'low')
    if (!geometry) return null
    const avatar = new Avatar(this.scene, spec, { geometry, quality: 'low', name: `cableRider${index}` })
    avatar.root.setEnabled(false)
    await avatar.whenReady()
    const clip = standing ? 'Idle_Loop' : 'Sitting_Idle_Loop'
    avatar.animator.useClips(set)
    avatar.animator.play(clip)
    for (let i = 0; i < 40; i++) avatar.update(1 / 60)
    const loop = Math.min(4, Math.max(1, (set.clips[clip]?.frames ?? 60) / set.fps))
    const meshes = avatar.getMeshes()
    const body = meshes.find((m) => m.name.endsWith('.body')) ?? meshes[0]
    const skeleton = body.skeleton
    if (!skeleton) return null
    const floatsPerFrame = (skeleton.bones.length + 1) * 16
    const data = new Float32Array(floatsPerFrame * (FRAMES + 1))
    const nodes = avatar.root.getChildTransformNodes(false)
    // the lift that puts the posed body's lowest point (the feet, standing or sitting) on the floor
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
    const lift = Number.isFinite(low) ? -low : 0.155
    const manager = new BakedVertexAnimationManager(this.scene)
    manager.texture = new VertexAnimationBaker(this.scene, body).textureFromBakedVertexData(data)
    const parts = instancedParts(this.scene, meshes, spec, manager).map(({ mesh, part }) => ({ mesh, part }))
    peopleLights(this.scene)
    avatar.root.position.setAll(0)
    avatar.root.rotationQuaternion = Quaternion.Identity()
    avatar.root.setEnabled(true)
    for (const { mesh } of parts) mesh.setEnabled(false)
    return { meshes: parts, manager, fps: FRAMES / loop, standing, lift }
  }

  /** Every frame: the people on every cable car near `eye`, from the cars Life drew this frame. */
  update(dt: number, cars: readonly CarBody[], eye: { x: number; z: number }): void {
    this.time += dt
    if (!this.variants.length) return
    const standers = this.variants.map((v, i) => (v.standing ? i : -1)).filter((i) => i >= 0)
    const sitters = this.variants.map((v, i) => (!v.standing ? i : -1)).filter((i) => i >= 0)
    const groups: { seat: CableSeat; car: CarBody; k: number }[][] = this.variants.map(() => [])
    for (const car of cars) {
      if (car.kind !== CABLE || Math.hypot(car.x - eye.x, car.z - eye.z) > RANGE) continue
      const seats = car.len > 8.8 ? CABLE_SEATS.california : CABLE_SEATS.powell
      const seed = car.seed ?? 0
      seats.forEach((seat, k) => {
        if (hash(seed, k) > 0.68) return
        const pool = seat.standing ? standers : sitters
        if (!pool.length) return
        groups[pool[Math.floor(hash(seed + 7, k) * pool.length) % pool.length]].push({ seat, car, k })
      })
    }
    const carM = new Matrix(), m = new Matrix(), local = new Vector3(), world = new Vector3(), one = new Vector3(1, 1, 1)
    this.variants.forEach((v, vi) => {
      v.manager.time = this.time
      const list = groups[vi]
      const n = list.length
      if (!this.buf[vi] || this.buf[vi].cap < n) {
        let cap = 16
        while (cap < n) cap *= 2
        this.buf[vi] = { cap, matrices: new Float32Array(cap * 16), settings: new Float32Array(cap * 4), colours: {
          skin: new Float32Array(cap * 4), top: new Float32Array(cap * 4), bottom: new Float32Array(cap * 4),
          hair: new Float32Array(cap * 4), plain: new Float32Array(cap * 4).fill(1), frame: new Float32Array(cap * 4).fill(1),
        } }
        for (const { mesh, part } of v.meshes) {
          mesh.thinInstanceSetBuffer('matrix', this.buf[vi].matrices, 16, false)
          if (mesh.bakedVertexAnimationManager) mesh.thinInstanceSetBuffer('bakedVertexAnimationSettingsInstanced', this.buf[vi].settings, 4, false)
          mesh.thinInstanceSetBuffer('color', this.buf[vi].colours[part], 4, false)
        }
      }
      const { matrices, settings, colours } = this.buf[vi]
      list.forEach(({ seat, car, k }, i) => {
        // the seat carried by the car: its heading and its pitch (the model's +z is the front, as the car is drawn)
        Matrix.ComposeToRef(one, Quaternion.RotationYawPitchRoll(car.heading, car.pitch ?? 0, 0), new Vector3(car.x, 0.25 + car.y, car.z), carM)
        local.set(seat.x, seat.y, seat.z)
        Vector3.TransformCoordinatesToRef(local, carM, world)
        // upright, whatever the car's pitch; the body's own +z faces the seat's way
        Matrix.ComposeToRef(one, Quaternion.RotationYawPitchRoll(car.heading + seat.yaw, 0, 0), new Vector3(world.x, world.y + v.lift, world.z), m)
        m.copyToArray(matrices, i * 16)
        const seed = (car.seed ?? 0) * 13 + k
        settings.set([0, FRAMES, (seed * 3.7) % FRAMES, v.fps], i * 4)
        const skin = pick(SKINS, hash(seed, 1)), top = pick(TOPS, hash(seed, 2)), bottom = pick(BOTTOMS, hash(seed, 3)), hair = pick(HAIRS, hash(seed, 4))
        colours.skin.set([skin[0] / BASE_SKIN[0], skin[1] / BASE_SKIN[1], skin[2] / BASE_SKIN[2], 1], i * 4)
        colours.top.set([...top, 1], i * 4)
        colours.bottom.set([...bottom, 1], i * 4)
        colours.hair.set([...hair, 1], i * 4)
      })
      for (const { mesh } of v.meshes) {
        mesh.thinInstanceCount = n
        if (n === 0) { mesh.setEnabled(false); continue }
        mesh.thinInstancePartialBufferUpdate('matrix', n, 0)
        if (mesh.bakedVertexAnimationManager) mesh.thinInstancePartialBufferUpdate('bakedVertexAnimationSettingsInstanced', n, 0)
        mesh.thinInstancePartialBufferUpdate('color', n, 0)
        mesh.setEnabled(true)
      }
    })
  }
}
