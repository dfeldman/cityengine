/**
 * THINGS THAT TURN on a landmark (owner, 2026-10-06, of the park's windmills: "they should really turn"). A model
 * draws the turning part into a MeshBuilder of its own, about its hub at the origin, and records it on its
 * `rotors`; when the model is placed the part becomes its own mesh, parented to the model (so it keeps its place,
 * turn and scale) and spun about its axis at its own pace. The same as a clock's hands (render/clocks.ts), but
 * turned by the clock of the frame rather than the time of day.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import type { Material } from '@babylonjs/core/Materials/material'
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { MeshBuilder } from './buildings.ts'

interface Spinning { mesh: Mesh; axis: Vector3; rate: number; phase: number }

export class Rotors {
  private readonly spinning: Spinning[] = []

  constructor(private readonly scene: Scene, private readonly material: Material) {}

  /** The turning parts a model asked for, parented to it (`host`), each about its hub in the model's own frame. */
  raise(rotors: MeshBuilder['rotors'], host: Mesh, name: string): void {
    for (const [k, r] of rotors.entries()) {
      const m = new Mesh(`rotor:${name}:${k}`, this.scene)
      r.mb.toVertexData().applyToMesh(m)
      m.material = this.material
      m.parent = host
      m.position.set(r.x, r.y, r.z)
      m.isPickable = false
      m.renderingGroupId = host.renderingGroupId
      // (each mill starts at its own angle, so two side by side are not in step)
      this.spinning.push({ mesh: m, axis: new Vector3(r.nx, r.ny ?? 0, r.nz), rate: (r.rpm / 60) * Math.PI * 2, phase: (k * 1.3 + name.length) % (Math.PI * 2) })
    }
  }

  /** Once a frame. */
  update(nowMs = performance.now()): void {
    if (this.spinning.length === 0) return
    const t = nowMs / 1000
    for (let i = this.spinning.length - 1; i >= 0; i--) if (this.spinning[i].mesh.isDisposed()) this.spinning.splice(i, 1)
    for (const s of this.spinning) s.mesh.rotationQuaternion = Quaternion.RotationAxis(s.axis, s.phase + t * s.rate)
  }
}
