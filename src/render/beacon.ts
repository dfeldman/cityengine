/**
 * The delivery target, LIT UP (owner, 2026-09-29: "the destination building should actually light up" — without it,
 * "near Clayton St & Page St" was a building nobody could find). Two things:
 *
 *   * a glowing shell just outside the building's walls, pulsing gently, so the building itself reads as lit;
 *   * a tall translucent beam up from its roof, so it can be found over the rooftops from a few blocks away;
 *   * a glowing column ON THE STREET at the building's door — the nearest rideable point, where arriving counts.
 *     From a bike the roof beam is above the top of the screen and the shell hides behind the neighbours until
 *     you are in front of it (owner, 2026-09-29: "did not see the beacon at all"); the column is what you ride to.
 *
 * Amber for the pickup, green for the drop-off. One target at a time; `show(null)` clears it.
 */
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder'
import type { Scene } from '@babylonjs/core/scene'

export interface BeaconTarget {
  /** footprint, flat x, z pairs */
  ring: number[]
  /** where the walls start and how tall, metres */
  baseY: number
  height: number
  kind: 'pickup' | 'dropoff'
  /** the nearest point of a rideable street, and the ground there */
  door?: { x: number; y: number; z: number }
}

const COLOUR = { pickup: new Color3(1, 0.62, 0.08), dropoff: new Color3(0.25, 1, 0.5) }

export class Beacon {
  private readonly scene: Scene
  private shell: Mesh | null = null
  private beam: Mesh | null = null
  private column: Mesh | null = null
  private readonly shellMat: StandardMaterial
  private readonly beamMat: StandardMaterial
  private t = 0

  constructor(scene: Scene) {
    this.scene = scene
    const mat = (name: string): StandardMaterial => {
      const m = new StandardMaterial(name, scene)
      m.disableLighting = true
      m.backFaceCulling = false
      m.diffuseColor = Color3.Black()
      m.specularColor = Color3.Black()
      // no fog: the city's haze at the low opacity a glow wants made it all but invisible (checked in the game)
      m.fogEnabled = false
      return m
    }
    this.shellMat = mat('beacon:shell')
    this.beamMat = mat('beacon:beam')
    this.beamMat.alpha = 0.5
  }

  show(target: BeaconTarget | null): void {
    this.shell?.dispose()
    this.beam?.dispose()
    this.column?.dispose()
    this.shell = null
    this.beam = null
    this.column = null
    if (!target) return
    const c = COLOUR[target.kind]
    this.shellMat.emissiveColor = c
    this.beamMat.emissiveColor = c

    // the shell: each wall, 0.4 m outside the facade, from just under the foot to just over the eaves
    const r = target.ring
    let cx = 0
    let cz = 0
    const n = r.length / 2
    for (let i = 0; i < r.length; i += 2) { cx += r[i]; cz += r[i + 1] }
    cx /= n
    cz /= n
    const out = (i: number): [number, number] => {
      const dx = r[i] - cx
      const dz = r[i + 1] - cz
      const d = Math.hypot(dx, dz) || 1
      return [r[i] + (dx / d) * 0.4, r[i + 1] + (dz / d) * 0.4]
    }
    const y0 = target.baseY - 0.2
    const y1 = target.baseY + target.height + 0.6
    const positions: number[] = []
    const indices: number[] = []
    for (let k = 0; k < n; k++) {
      const [ax, az] = out(2 * k)
      const [bx, bz] = out(2 * ((k + 1) % n))
      const b = positions.length / 3
      positions.push(ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y1, az)
      indices.push(b, b + 1, b + 2, b, b + 2, b + 3)
    }
    const shell = new Mesh('beacon:shell', this.scene)
    const vd = new VertexData()
    vd.positions = positions
    vd.indices = indices
    vd.applyToMesh(shell)
    shell.material = this.shellMat
    shell.renderingGroupId = 3
    shell.isPickable = false
    this.shell = shell

    // the beam: from the roof up, tall enough to clear the neighbours
    const beam = CreateCylinder('beacon:beam', { height: 120, diameterTop: 4, diameterBottom: 6, tessellation: 16 }, this.scene)
    beam.position.set(cx, y1 + 60, cz)
    beam.material = this.beamMat
    beam.renderingGroupId = 3
    beam.isPickable = false
    this.beam = beam

    // the column at the door: from just under the street to well over the cars, narrow enough to ride round
    if (target.door) {
      const col = CreateCylinder('beacon:column', { height: 24, diameterTop: 1.6, diameterBottom: 2.4, tessellation: 20 }, this.scene)
      col.position.set(target.door.x, target.door.y - 1 + 12, target.door.z)
      col.material = this.beamMat
      col.renderingGroupId = 3
      col.isPickable = false
      this.column = col
    }
  }

  /** the gentle pulse */
  update(dt: number): void {
    if (!this.shell) return
    this.t += dt
    this.shellMat.alpha = 0.75 + 0.15 * Math.sin(this.t * 3)
    this.beamMat.alpha = 0.6 + 0.12 * Math.sin(this.t * 3 + 1)
  }
}
