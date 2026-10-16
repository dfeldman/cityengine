/**
 * The overhead line over electric tram track (SF_PLAN.md §7): the contact wire 5.8 m above the rails, and the poles
 * that carry it on bracket arms — Market Street and the Embarcadero under the F-line's wires, which are half of what
 * those streets look like. Shared: any city's electric trams get it. Cable-car track (PackedRail.cable) has none;
 * its cable runs in a slot under the street.
 *
 * Built once per railway as it streams in (render/city.ts tiles), on the ground under it; a dozen draw calls for a
 * city's worth, and nothing moves.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { box, strut, type Rgb } from './models.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import type { Terrain } from '../city/terrain.ts'
import { unpackPoints, type PackedRail } from '../city/package.ts'

const WIRE: Rgb = [0.1, 0.1, 0.11]
const POLE: Rgb = [0.3, 0.34, 0.32]
const WIRE_Y = 5.8
const SPAN = 38

export class OverheadLines {
  private readonly done = new Set<number>()

  /** a pole may not stand here (a shelter, a kiosk: owner, 2026-10-16, poles inside a shelter and a toilet) */
  blocked: ((x: number, z: number) => boolean) | null = null

  constructor(private readonly scene: Scene, private readonly terrain: Terrain) {}

  /** A tile's railways: the electric tram track among them gets its wire and poles (once each). */
  addRails(rails: PackedRail[]): void {
    for (const r of rails) {
      if (r.kind !== 'tram' || r.cable || this.done.has(r.id)) continue
      if (r.heights) continue                                // (on a viaduct: its own structure carries it)
      this.done.add(r.id)
      const pts = unpackPoints(r.points)
      const out = new MeshBuilder()
      const ground = (x: number, z: number): number => this.terrain.heightAt(x, z)
      // the contact wire: along the track, a segment every few metres, sagging a little between the poles
      let sinceLast = SPAN / 2
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]
        const b = pts[i]
        const L = Math.hypot(b.x - a.x, b.z - a.z)
        if (L < 0.1) continue
        const n = Math.max(1, Math.ceil(L / 6))
        for (let k = 0; k < n; k++) {
          const t0 = k / n
          const t1 = (k + 1) / n
          const p0 = { x: a.x + (b.x - a.x) * t0, z: a.z + (b.z - a.z) * t0 }
          const p1 = { x: a.x + (b.x - a.x) * t1, z: a.z + (b.z - a.z) * t1 }
          const sag = (u: number): number => -0.12 * Math.sin(Math.PI * Math.min(1, u / SPAN))
          strut(out, [p0.x, ground(p0.x, p0.z) + WIRE_Y + sag(sinceLast), p0.z], [p1.x, ground(p1.x, p1.z) + WIRE_Y + sag(sinceLast + L / n), p1.z],
            0.03, 0.03, WIRE, 0, false)
          sinceLast += L / n
          // a pole on the right of the track every span, its arm reaching over to the wire
          const nx = (b.z - a.z) / L
          const nz = -(b.x - a.x) / L
          const px = p1.x + nx * 4.6
          const pz = p1.z + nz * 4.6
          // (a pole whose spot is taken goes on along the track to the next clear one, up to half a span late)
          if (sinceLast >= SPAN && (sinceLast > SPAN * 1.5 || !this.blocked?.(px, pz))) {
            sinceLast = 0
            const g = ground(px, pz)
            box(out, px, g + 3.9, pz, 0.12, 3.9, 0.12, POLE, 0)
            box(out, px, g + 0.3, pz, 0.22, 0.3, 0.22, POLE, 0)
            strut(out, [px, g + WIRE_Y + 0.55, pz], [p1.x, ground(p1.x, p1.z) + WIRE_Y + 0.55, p1.z], 0.06, 0.06, POLE, 0, false)
            strut(out, [px, g + WIRE_Y + 1.3, pz], [p1.x + nx * 1.2, ground(p1.x, p1.z) + WIRE_Y + 0.6, p1.z + nz * 1.2], 0.04, 0.04, POLE, 0, false)
            // the dropper from the arm down to the wire
            box(out, p1.x, ground(p1.x, p1.z) + WIRE_Y + 0.28, p1.z, 0.02, 0.27, 0.02, WIRE, 0)
          }
        }
      }
      if (out.triangles === 0) continue
      const m = new Mesh(`overhead:${r.id}`, this.scene)
      out.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(this.scene, 'cartoonOverhead', false)
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
    }
  }
}
