/**
 * PARIS'S TWO TETHERED BALLOONS (owner, 2026-11-04: "they should go up and down every few minutes… it should be possible
 * to ride either of them"): the Ballon de Paris over the Parc André-Citroën and the Vasque Paris 2024 over the Tuileries'
 * Grand Bassin Rond. Not realistic — neither flies all day and the Vasque takes no passengers — but both do here.
 *
 * The pads are the landmarks (`citroenBallon`, `vasque`); what rises is drawn here from their `…Float` builders, one
 * instance moved every frame, with its cable paid out from the pad. A cycle: moored (boardable) → up → aloft → down.
 * Boarding is a transit vehicle of kind 'wheel' (sim/transit.ts), like the ferris wheels; aboard, the rider goes up
 * once and is put off when it moors again. game.ts drives these through the same `Ride` face as the wheels.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from '../buildings.ts'
import { cartoonMaterial, surfaceTag } from '../cartoon-material.ts'
import { box } from '../models.ts'
import type { VehicleView } from '../../sim/transit.ts'
import { citroenBallonFloat } from '../landmarks/paris/batch1/parks.ts'
import { vasqueFloat } from '../landmarks/paris/bugs/artworks.ts'

export interface BalloonSpec {
  id: string; name: string; lat: number; lon: number
  /** the rising part's local y = 0 over the ground, moored; how high it goes, metres */
  moored: number; top: number
  /** seconds: moored (boardable), climbing, aloft, coming down */
  dwell: number; climb: number; hover: number; descend: number
  /** where in the cycle it starts, seconds (so the two are not in step) */
  phase: number
  /** the rider's floor and eye over the rising part's origin */
  floor: number
  build: (out: MeshBuilder) => void
  offBanner: string
}

/** tunables: the real Ballon goes to 150 m in ~6 min; shortened so it goes up and down every few minutes */
export const BALLON_DE_PARIS: BalloonSpec = {
  id: 'ballon', name: 'Ballon de Paris', lat: 48.841365, lon: 2.273985, moored: 0.55, top: 150,
  dwell: 50, climb: 80, hover: 45, descend: 80, phase: 0, floor: 0.3, build: citroenBallonFloat, offBanner: 'Back in the Parc André-Citroën',
}
export const VASQUE: BalloonSpec = {
  id: 'vasque', name: 'Vasque Paris 2024', lat: 48.862889, lon: 2.3292925, moored: 0, top: 60,
  dwell: 50, climb: 60, hover: 60, descend: 60, phase: 130, floor: 2.2, build: vasqueFloat, offBanner: 'Back in the Tuileries',
}

/** what game.ts needs of any ride it can board (the ferris wheels have the same) */
export interface Ride {
  update(dt: number): void
  views(): VehicleView[]
  boarded(id: string): void
  askOff(): boolean
  dueOff(): boolean
  alighted(): void
  cameraAboard(): { eye: Vector3; look: Vector3 } | null
  readonly aboard: boolean
  readonly spec: { id: string; name: string; offBanner?: string }
  /** banner and menu wording; the wheels' when absent */
  readonly words?: { sub: string; wait: string; menu: string }
}

const smooth = (t: number): number => t * t * (3 - 2 * t)

export class Balloon implements Ride {
  private float: Mesh
  private cable: Mesh
  private fm = new Float32Array(16)
  private cm = new Float32Array(16)
  private t: number
  private riding: { up: boolean; t: number } | null = null
  private readonly base: Vector3
  readonly words = { sub: 'up on its cable and back', wait: 'off when it is moored again', menu: '🎈 Ride the' }

  constructor(scene: Scene, x: number, z: number, ground: number, readonly spec: BalloonSpec) {
    this.base = new Vector3(x, ground, z)
    this.t = spec.phase
    const mk = (name: string, mb: MeshBuilder, buf: Float32Array): Mesh => {
      const m = new Mesh(name, scene)
      mb.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(scene)
      m.isPickable = false
      m.alwaysSelectAsActiveMesh = true
      // the buildings' group, as the ferris wheels: left in group 0 (the coarse ground and the skyline, whose
      // depth is cleared before the city draws) everything drew over it, so a balloon near by read as a giant
      // far off on the horizon
      m.renderingGroupId = 3
      m.thinInstanceSetBuffer('matrix', buf, 16, false)
      m.thinInstanceSetBuffer('instColor', new Float32Array(4), 4, true)
      return m
    }
    const fb = new MeshBuilder()
    spec.build(fb)
    this.float = mk(`${spec.id}:float`, fb, this.fm)
    const cb = new MeshBuilder()
    box(cb, 0, 0.5, 0, 0.04, 0.5, 0.04, [0.2, 0.2, 0.22], surfaceTag('metal'))
    this.cable = mk(`${spec.id}:cable`, cb, this.cm)
    this.update(0)
  }

  private get period(): number { const s = this.spec; return s.dwell + s.climb + s.hover + s.descend }

  /** the rising part's height over its moored place, now */
  height(): number {
    const s = this.spec
    let u = this.t % this.period
    if (u < s.dwell) return 0
    u -= s.dwell
    if (u < s.climb) return s.top * smooth(u / s.climb)
    u -= s.climb
    if (u < s.hover) return s.top
    u -= s.hover
    return s.top * (1 - smooth(u / s.descend))
  }

  private get moored(): boolean { return this.t % this.period < this.spec.dwell }

  update(dt: number): void {
    this.t += dt
    if (this.riding) { this.riding.t += dt; if (!this.moored) this.riding.up = true }
    const h = this.height()
    const y = this.base.y + this.spec.moored + h
    // a little sway aloft, more the higher it is
    const sw = Math.min(1, h / 40) * 0.02
    Matrix.RotationX(sw * Math.sin(this.t * 0.4)).multiply(Matrix.RotationZ(sw * Math.cos(this.t * 0.31)))
      .multiply(Matrix.Translation(this.base.x, y, this.base.z)).copyToArray(this.fm, 0)
    this.float.thinInstancePartialBufferUpdate('matrix', this.fm, 0)
    Matrix.Scaling(1, Math.max(0.01, this.spec.moored + h), 1).multiply(Matrix.Translation(this.base.x, this.base.y, this.base.z)).copyToArray(this.cm, 0)
    this.cable.thinInstancePartialBufferUpdate('matrix', this.cm, 0)
  }

  private view(dwelling: boolean): VehicleView {
    const y = this.base.y + this.spec.moored + this.height() + this.spec.floor
    return { id: `${this.spec.id}:0`, kind: 'wheel', x: this.base.x, z: this.base.z, y, heading: 0, speed: 0, dwelling, name: this.spec.name }
  }

  /** boardable while moored; aboard, the one being ridden */
  views(): VehicleView[] {
    if (this.riding) return [this.view(false)]
    return this.moored ? [this.view(true)] : []
  }

  boarded(): void { this.riding = { up: false, t: 0 } }
  askOff(): boolean { return !this.riding || this.moored }
  /** put off once it has been up and is moored again */
  dueOff(): boolean { return !!this.riding && this.riding.up && this.moored }
  alighted(): void { this.riding = null }
  get aboard(): boolean { return this.riding !== null }

  /** standing in the gondola, looking out and slowly round; down at the city as it climbs */
  cameraAboard(): { eye: Vector3; look: Vector3 } | null {
    if (!this.riding) return null
    const eye = this.base.add(new Vector3(2.2, this.spec.moored + this.height() + this.spec.floor + 1.6, 0))
    const pan = this.riding.t * 0.06
    const up = this.height() / this.spec.top
    return { eye, look: eye.add(new Vector3(Math.cos(pan) * 60, -5 - 25 * up, Math.sin(pan) * 60)) }
  }
}

/** several rides as one: game.ts's `skystar` — each call goes to the ride the rider is on, or that is offered */
export class Rides implements Ride {
  private on: Ride | null = null
  constructor(private readonly all: Ride[]) {}
  update(dt: number): void { for (const r of this.all) r.update(dt) }
  views(): VehicleView[] { return this.on ? this.on.views() : this.all.flatMap((r) => r.views()) }
  private byId(id: string): Ride | undefined { return this.all.find((r) => r.views().some((v) => v.id === id)) ?? this.all.find((r) => id.startsWith(`${r.spec.id}:`)) }
  /** the ride a vehicle view belongs to, for its wording */
  of(id: string): Ride | undefined { return this.byId(id) }
  boarded(id: string): void { this.on = this.byId(id) ?? null; this.on?.boarded(id) }
  askOff(): boolean { return this.on ? this.on.askOff() : true }
  dueOff(): boolean { return this.on?.dueOff() ?? false }
  alighted(): void { this.on?.alighted(); this.on = null }
  cameraAboard(): { eye: Vector3; look: Vector3 } | null { return this.on?.cameraAboard() ?? null }
  get aboard(): boolean { return this.on !== null }
  get spec(): { id: string; name: string; offBanner?: string } { return this.on?.spec ?? this.all[0].spec }
  get words(): Ride['words'] { return this.on?.words }
}
