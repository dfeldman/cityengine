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
import { TILE } from '../city/tiles.ts'

const WIRE: Rgb = [0.1, 0.1, 0.11]
const POLE: Rgb = [0.3, 0.34, 0.32]
const WIRE_Y = 5.8
const SPAN = 38

export class OverheadLines {
  private readonly done = new Set<string>()

  /** a pole may not stand here (a shelter, a kiosk: owner, 2026-10-16, poles inside a shelter and a toilet) */
  blocked: ((x: number, z: number) => boolean) | null = null

  constructor(private readonly scene: Scene, private readonly terrain: Terrain) {}

  /**
   * A tile's railways: the electric tram track among them gets its wire and poles — the stretch INSIDE this tile. It
   * used to build a whole line the first time any tile holding it arrived, and a line runs through many tiles: the
   * parts in tiles not yet loaded took the coarse ground with no street levelling, so where a street is graded above
   * the terrain (Judah Street by Funston) the wire ran down to pavement height (owner, 2026-10-26: "power lines lying
   * on the sidewalk"). Built per tile, as the tile's own ground and grade are in; the poles stand at fixed arc lengths
   * along the line, so a tile's share joins its neighbours'.
   */
  addRails(rails: PackedRail[], tileKey?: string): void {
    const rect = tileKey ? (() => { const [tx, tz] = tileKey.split(',').map(Number); return { x0: tx * TILE, z0: tz * TILE, x1: (tx + 1) * TILE, z1: (tz + 1) * TILE } })() : null
    const inRect = (x: number, z: number): boolean => !rect || (x >= rect.x0 && x < rect.x1 && z >= rect.z0 && z < rect.z1)
    for (const r of rails) {
      if (r.kind !== 'tram' || r.cable) continue
      if (r.heights) continue                                // (on a viaduct: its own structure carries it)
      const key = `${r.id}|${tileKey ?? ''}`
      if (this.done.has(key)) continue
      this.done.add(key)
      const pts = unpackPoints(r.points)
      const out = new MeshBuilder()
      const ground = (x: number, z: number): number => this.terrain.heightAt(x, z)
      // the contact wire: along the track, a segment every few metres, sagging a little between the poles
      let s = 0                   // arc length along the whole line: the poles' spacing is measured on it
      let lastPole = -SPAN / 2    // where the last pole stood (or should have), along the line
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
          const s0 = s, s1 = s + L / n
          s = s1
          const here = inRect((p0.x + p1.x) / 2, (p0.z + p1.z) / 2)
          const sag = (u: number): number => -0.12 * Math.sin(Math.PI * Math.min(1, (u - lastPole) / SPAN))
          if (here) strut(out, [p0.x, ground(p0.x, p0.z) + WIRE_Y + sag(s0), p0.z], [p1.x, ground(p1.x, p1.z) + WIRE_Y + sag(s1), p1.z],
            0.03, 0.03, WIRE, 0, false)
          // a pole on the right of the track every span, its arm reaching over to the wire
          const nx = (b.z - a.z) / L
          const nz = -(b.x - a.x) / L
          const px = p1.x + nx * 4.6
          const pz = p1.z + nz * 4.6
          // (a pole whose spot is taken goes on along the track to the next clear one, up to half a span late)
          if (s1 - lastPole >= SPAN && (s1 - lastPole > SPAN * 1.5 || !this.blocked?.(px, pz))) {
            lastPole = s1
            if (!here) continue
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
      const m = new Mesh(`overhead:${key}`, this.scene)
      out.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(this.scene, 'cartoonOverhead', false)
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
    }
  }
}
