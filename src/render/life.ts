/**
 * Drawing everything that moves at street level: cars, buses, trains, and people.
 *
 * One mesh per kind, thin instances for the copies, and the matrices rewritten every frame. Forty cars and
 * two hundred people are six draw calls, which is the only reason a street can be this busy.
 *
 * The people are the fiddly part. A walker is three meshes — body, legs, arms — because the limbs have to
 * swing, and they swing by being separate instances whose matrices rotate about a pivot at the hip and the
 * shoulder. It is the cheapest articulation there is and at the distance a rider sees a pavement it is
 * indistinguishable from a skeleton: what reads as walking is the gait, not the joint count.
 */
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { box as boxModel, bus, cableCar, car, carriage, personArm, personBody, personHair, personHead, personLeg } from './models.ts'
import { DAYLIGHT } from './facade-material.ts'
import { blobMaterial, blobQuad, shadowOffset } from './shadows.ts'
import type { Vehicle } from '../sim/traffic.ts'
import type { Walker } from '../sim/crowd.ts'
import type { CityPackage } from '../city/package.ts'
import type { Terrain } from '../city/terrain.ts'
import { unpackPoints } from '../city/package.ts'
import { profileAt } from '../city/terrain.ts'

class Pool {
  readonly mesh: Mesh
  private matrices: Float32Array
  private colours: Float32Array
  private used = 0

  constructor(scene: Scene, name: string, data: MeshBuilder, capacity: number) {
    this.mesh = new Mesh(name, scene)
    data.toVertexData().applyToMesh(this.mesh)
    this.mesh.material = cartoonMaterial(scene)
    this.mesh.isPickable = false
    // the mesh sits at the origin and its copies are spread over the city, so Babylon's frustum test on the
    // source mesh is meaningless and would cull the lot
    this.mesh.alwaysSelectAsActiveMesh = true
    this.mesh.setEnabled(false)     // nothing to draw until the first frame fills it; see `end`
    // The same group the buildings are in. Rendering groups 1–3 clear the depth buffer, so anything left in
    // group 0 is drawn and then buried by the streets: cars and people were being simulated correctly and
    // then painted over by the road they were standing on.
    this.mesh.renderingGroupId = 3
    this.matrices = new Float32Array(capacity * 16)
    this.colours = new Float32Array(capacity * 4)
  }

  begin(): void { this.used = 0 }

  push(m: Matrix, r: number, g: number, b: number, mix = 1): void {
    if ((this.used + 1) * 16 > this.matrices.length) return
    m.copyToArray(this.matrices, this.used * 16)
    this.colours.set([r, g, b, mix], this.used * 4)
    this.used++
  }

  end(): void {
    // A thin-instanced mesh with no instances is still DRAWN, once, as an ordinary mesh — and the instanced
    // shader's `world0..world3` attributes are undefined for that draw, so every vertex is transformed by
    // garbage and the screen fills with huge triangles. An empty pool has to be switched off, not just
    // emptied. This was the flickering in front of the camera.
    this.mesh.setEnabled(this.used > 0)
    if (this.used === 0) {
      this.mesh.thinInstanceCount = 0
      return
    }
    // Exactly `used` entries, not the whole capacity. `thinInstanceSetBuffer` takes the instance count from
    // the buffer's own length, overriding anything set beforehand — so handing it the full array draws the
    // unused tail as well. Those matrices are all zeros, and a zero matrix sends every vertex to w = 0,
    // which projects to infinity: the screen fills with huge triangles radiating from a point.
    this.mesh.thinInstanceSetBuffer('matrix', this.matrices.subarray(0, this.used * 16), 16)
    this.mesh.thinInstanceSetBuffer('instColor', this.colours.subarray(0, this.used * 4), 4)
  }

  get count(): number { return this.used }
}

/** A town bike for the cyclists among the strangers: two wheels, a frame, bars and a saddle. Facing +z. */
function strangerBike(out: MeshBuilder): void {
  const tyre: [number, number, number] = [0.08, 0.08, 0.09]
  for (const z of [-0.52, 0.52]) {
    // a wheel as a thin ring of eight bars in the y–z plane
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2
      const b = ((k + 1) / 8) * Math.PI * 2
      const cy = 0.34
      const y0 = cy + Math.sin(a) * 0.33, z0 = z + Math.cos(a) * 0.33
      const y1 = cy + Math.sin(b) * 0.33, z1 = z + Math.cos(b) * 0.33
      boxModel(out, 0, (y0 + y1) / 2, (z0 + z1) / 2, 0.02, Math.abs(y1 - y0) / 2 + 0.02, Math.abs(z1 - z0) / 2 + 0.02, tyre, 0)
    }
  }
  boxModel(out, 0, 0.6, 0, 0.025, 0.025, 0.46, [1, 1, 1], 1)             // top tube (tinted)
  boxModel(out, 0, 0.47, -0.2, 0.025, 0.16, 0.025, [1, 1, 1], 1)         // seat tube
  boxModel(out, 0, 0.8, -0.24, 0.08, 0.025, 0.12, tyre, 0)               // saddle
  boxModel(out, 0, 0.85, 0.46, 0.25, 0.02, 0.02, tyre, 0)                // bars
  boxModel(out, 0, 0.62, 0.48, 0.025, 0.22, 0.025, [1, 1, 1], 1)         // fork
}

const build = (fn: (out: MeshBuilder) => void): MeshBuilder => {
  const out = new MeshBuilder()
  fn(out)
  return out
}

export class Life {
  private readonly cars: Pool
  private readonly buses: Pool
  private readonly carriages: Pool
  private readonly trams: Pool
  private readonly bodies: Pool
  private readonly legs: Pool
  private readonly arms: Pool
  private readonly heads: Pool
  private readonly hairs: Pool
  /** a stranger's bicycle, frame and wheels, facing +z */
  private readonly bikes: Pool
  private readonly blobs: Pool
  private readonly rails: { points: { x: number; z: number }[]; length: number; tram: boolean; heights?: number[] }[] = []
  private readonly trains: { rail: number; s: number; dir: 1 | -1; speed: number; cars: number }[] = []
  private readonly m = Matrix.Identity()

  constructor(scene: Scene, pkg: CityPackage, budget = { cars: 90, buses: 16, people: 3000 }) {
    this.cars = new Pool(scene, 'cars', build(car), budget.cars)
    this.buses = new Pool(scene, 'buses', build(bus), budget.buses)
    this.carriages = new Pool(scene, 'carriages', build(carriage), 40)
    this.trams = new Pool(scene, 'trams', build(cableCar), 24)
    this.bodies = new Pool(scene, 'people', build(personBody), budget.people)
    this.legs = new Pool(scene, 'legs', build(personLeg), budget.people * 2)
    this.arms = new Pool(scene, 'arms', build(personArm), budget.people * 2)
    this.heads = new Pool(scene, 'heads', build(personHead), budget.people)
    this.hairs = new Pool(scene, 'hairs', build(personHair), budget.people)
    this.bikes = new Pool(scene, 'bikes', build(strangerBike), Math.max(40, Math.round(budget.people / 6)))

    /**
     * A shadow for everything that moves.
     *
     * The buildings and the trees have theirs baked into the tile, but a car and a walker cannot — they are
     * somewhere else next frame. Theirs is a soft blob carried along, offset along the sun and stretched
     * the way a low sun stretches everything. Without one a car sits on the road like a sticker, which is
     * the single clearest way an object can fail to look part of a scene.
     */
    this.blobs = new Pool(scene, 'blobs', build(blobQuad), budget.cars + budget.buses + budget.people + 48)
    this.blobs.mesh.material = blobMaterial(scene)

    this.addRails(pkg.rails)
  }

  private readonly railIds = new Set<number>()

  /** Railways arriving with streamed tiles, each once, with its trains. */
  addRails(rails: CityPackage['rails']): void {
    // Only the railways a rider can actually see. A subway is underground: putting a train on it would mean
    // a train sliding through the road surface, which is worse than no train at all.
    const from = this.rails.length
    for (const r of rails) {
      if (r.kind === 'subway' || this.railIds.has(r.id)) continue
      this.railIds.add(r.id)
      const points = unpackPoints(r.points)
      let length = 0
      for (let i = 1; i < points.length; i++) {
        length += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
      }
      if (length < 60) continue
      this.rails.push({ points, length, tram: r.kind === 'tram', heights: r.heights })
    }
    this.rails.forEach((r, i) => {
      if (i < from) return
      // a tram is one car at a walking-plus pace; a cable car runs at about 15 km/h
      this.trains.push(r.tram
        ? { rail: i, s: (i * 137) % r.length, dir: i % 2 ? 1 : -1, speed: 4.2, cars: 1 }
        : { rail: i, s: (i * 137) % r.length, dir: i % 2 ? 1 : -1, speed: 14 + (i % 3) * 4, cars: 3 })
    })
  }

  /**
   * The player's own shadow, which they see more than any other and would notice the absence of first.
   *
   * Recorded here rather than drawn by the rider, because it belongs in the same instanced pool as every
   * other moving shadow — one more matrix costs nothing, a seventh draw call would not.
   */
  private riderBlob: { at: { x: number; z: number }; heading: number } | null = null
  riderShadow(at: { x: number; z: number }, heading: number, groundY = 0): void {
    this.riderBlob = { at, heading }
    void groundY
  }

  get stats(): { vehicles: number; people: number } {
    return { vehicles: this.cars.count + this.buses.count, people: this.bodies.count }
  }

  update(dt: number, vehicles: readonly Vehicle[], walkers: readonly Walker[], at: { x: number; z: number },
         skip?: ReadonlySet<number>, terrain?: Terrain): void {
    const groundAt = (p: { x: number; z: number }): number => terrain?.heightAt(p.x, p.z) ?? 0
    for (const p of [this.cars, this.buses, this.carriages, this.trams, this.bodies, this.legs, this.arms, this.heads, this.hairs, this.bikes, this.blobs]) p.begin()
    const sun = shadowOffset(DAYLIGHT.sun)

    /** Lay a blob under something `height` tall, `long` by `wide` on the ground, facing `heading`. */
    const blob = (at: { x: number; z: number }, heading: number, long: number, wide: number,
                  height: number): void => {
      const cx = at.x + sun.x * height * 0.5
      const cz = at.z + sun.z * height * 0.5
      // stretched along the sun, because that is what a shadow does
      const stretch = 1 + Math.hypot(sun.x, sun.z) * 0.55
      Matrix.ComposeToRef(
        new Vector3(wide, 1, long * stretch),
        Quaternion.RotationYawPitchRoll(heading, 0, 0),
        new Vector3(cx, 0.185 + groundAt({ x: cx, z: cz }), cz), this.m)
      this.blobs.push(this.m, 1, 1, 1, 0)
    }

    for (const v of vehicles) {
      Matrix.ComposeToRef(
        Vector3.OneReadOnly,
        Quaternion.RotationYawPitchRoll(v.heading, 0, 0),
        new Vector3(v.at.x, 0.06 + (v.y ?? groundAt(v.at)), v.at.z), this.m)
      const pool = v.kind === 'bus' ? this.buses : this.cars
      pool.push(this.m, v.colour[0], v.colour[1], v.colour[2])
      blob(v.at, v.heading, v.kind === 'bus' ? 12 : 4.6, v.kind === 'bus' ? 3 : 2.1,
        v.kind === 'bus' ? 3.2 : 1.4)
    }

    walkers.forEach((w) => {
      // Everyone gets a shadow, including the ones wearing a real avatar-kit body — those are the people
      // NEAREST the camera, so they are exactly the ones whose feet are examined. Skipping the shadow along
      // with the box left the most visible people in the city hovering.
      blob(w.at, w.heading, 1.0, 0.8, 1.7 * w.height)

      // somebody who has been given a real body is not also drawn as a box
      if (skip?.has(w.id)) return
      const swing = Math.sin(w.phase) * (w.kind === 'run' ? 0.95 : 0.62)
      const rot = Quaternion.RotationYawPitchRoll(w.heading, w.kind === 'run' ? 0.12 : w.kind === 'cycle' ? 0.35 : 0, 0)
      const scale = new Vector3(1, w.height, 1)
      const wy = w.y ?? groundAt(w.at)
      if (w.kind === 'cycle') {
        // the bicycle under them, and the rider seated: lifted onto the saddle and leaning to the bars
        Matrix.ComposeToRef(new Vector3(1, 1, 1), Quaternion.RotationYawPitchRoll(w.heading, 0, 0),
          new Vector3(w.at.x, 0.02 + wy, w.at.z), this.m)
        this.bikes.push(this.m, w.shirt[0] * 0.5 + 0.1, w.shirt[1] * 0.5 + 0.1, w.shirt[2] * 0.5 + 0.1)
      }
      const lift = w.kind === 'cycle' ? 0.12 : 0
      const pos = new Vector3(w.at.x, 0.155 + wy + lift, w.at.z)   // standing on the pavement, not the road

      Matrix.ComposeToRef(scale, rot, pos, this.m)
      this.bodies.push(this.m, w.shirt[0], w.shirt[1], w.shirt[2])
      this.heads.push(this.m, w.skin[0], w.skin[1], w.skin[2])
      this.hairs.push(this.m, w.hair[0], w.hair[1], w.hair[2])

      // legs and arms pivot at the top of their box, which is why they swing from the hip and shoulder
      for (const [side, phase] of [[-1, swing], [1, -swing]] as const) {
        const hip = new Vector3(w.at.x, 0.155 + wy + lift + 0.92 * w.height, w.at.z)
        const hipOff = new Vector3(Math.cos(w.heading) * 0.09 * side, 0, -Math.sin(w.heading) * 0.09 * side)
        Matrix.ComposeToRef(scale,
          Quaternion.RotationYawPitchRoll(w.heading, phase, 0), hip.add(hipOff), this.m)
        this.legs.push(this.m, w.trousers[0], w.trousers[1], w.trousers[2])

        const shoulder = new Vector3(w.at.x, 0.155 + wy + lift + 1.52 * w.height, w.at.z)
        const shOff = new Vector3(Math.cos(w.heading) * 0.235 * side, 0, -Math.sin(w.heading) * 0.235 * side)
        Matrix.ComposeToRef(scale,
          Quaternion.RotationYawPitchRoll(w.heading, -phase * 0.7, 0), shoulder.add(shOff), this.m)
        this.arms.push(this.m, w.shirt[0], w.shirt[1], w.shirt[2])
      }
    })

    // trains: they run their line end to end and turn round, which is what a terminus looks like
    for (const t of this.trains) {
      const rail = this.rails[t.rail]
      t.s += t.dir * t.speed * dt
      if (t.s < 0 || t.s > rail.length) { t.dir = (-t.dir) as 1 | -1; t.s = Math.max(0, Math.min(rail.length, t.s)) }
      const head = along(rail.points, t.s)
      if (Math.hypot(head.x - at.x, head.z - at.z) > 420) continue
      for (let c = 0; c < t.cars; c++) {
        const s = t.s - t.dir * c * (rail.tram ? 9.5 : 18.6)
        if (s < 0 || s > rail.length) continue
        const p = along(rail.points, s)
        // the rail's own direction from a chord that stays on it, then turned to the way of travel — the
        // old version reversed a train running b→a twice over, just as the walkers once did
        const s0 = Math.max(0, Math.min(rail.length - 4, s - 2))
        const a = along(rail.points, s0)
        const b = along(rail.points, s0 + 4)
        const heading = t.dir > 0 ? Math.atan2(b.x - a.x, b.z - a.z) : Math.atan2(a.x - b.x, a.z - b.z)
        Matrix.ComposeToRef(Vector3.OneReadOnly,
          Quaternion.RotationYawPitchRoll(heading, 0, 0),
          new Vector3(p.x, 0.25 + (rail.heights ? profileAt(rail.points, rail.heights, s).y : groundAt(p)), p.z), this.m)
        if (rail.tram) {
          // maroon, the Powell Street livery
          this.trams.push(this.m, 0.52, 0.10, 0.12)
          blob(p, heading, 9, 2.6, 2.6)
        } else {
          this.carriages.push(this.m, 0.78, 0.79, 0.82)
          blob(p, heading, 18, 3.4, 3.4)
        }
      }
    }

    if (this.riderBlob) blob(this.riderBlob.at, this.riderBlob.heading, 2.0, 0.7, 1.6)

    for (const p of [this.cars, this.buses, this.carriages, this.trams, this.bodies, this.legs, this.arms, this.heads, this.hairs, this.bikes, this.blobs]) p.end()
  }
}

function along(points: { x: number; z: number }[], s: number): { x: number; z: number } {
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
