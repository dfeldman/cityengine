/**
 * Quick landmarks (BUGS.md #41): the marks that make the buildings people steer by stand out, for the hundreds
 * no manifest entry names — cheaply, by kind, per tile:
 *
 * - a FLAG over the entrance of every civic building, school and museum (the tricolour in Paris, the Stars and
 *   Stripes in the American cities): the one thing that says "public building" from a block away;
 * - a BELL TOWER with its spire at the front of every church, sized to the church.
 *
 * The buildings' own dress by kind is render/prepare.ts.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { box, prism, type Rgb } from './models.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import type { TileLayer } from './city.ts'
import type { Terrain } from '../city/terrain.ts'
import { unpackPoints } from '../city/package.ts'

const FIXED = 0

function flag(out: MeshBuilder, x: number, y: number, z: number, nx: number, nz: number, paris: boolean): void {
  // the pole, out from the wall and up at 35°, and the flag hanging from its end, turned along the wall
  const L = 3
  const tx = x + nx * L * 0.82
  const tz = z + nz * L * 0.82
  const ty = y + L * 0.57
  const steps = 8
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps
    box(out, x + (tx - x) * t, y + (ty - y) * t, z + (tz - z) * t, 0.04, 0.04, 0.04, [0.85, 0.85, 0.82], FIXED)
  }
  // the flag: along the pole's outer half, hanging down, in the plane that contains the pole
  const bands: Rgb[] = paris ? [[0.18, 0.28, 0.62], [0.95, 0.95, 0.95], [0.82, 0.15, 0.18]] : [[0.72, 0.12, 0.16], [0.95, 0.95, 0.95], [0.72, 0.12, 0.16]]
  const w = 1.6
  const h = 1.05
  for (let b = 0; b < 3; b++) {
    const t0 = 1 - (w / L) + (b / 3) * (w / L)
    const t1 = 1 - (w / L) + ((b + 1) / 3) * (w / L)
    const p0 = [x + (tx - x) * t0, y + (ty - y) * t0, z + (tz - z) * t0] as const
    const p1 = [x + (tx - x) * t1, y + (ty - y) * t1, z + (tz - z) * t1] as const
    // Paris's bands are vertical (hoist to fly); the US flag's stripes run along it
    if (paris) {
      out.quad([[p0[0], p0[1] - h, p0[2]], [p1[0], p1[1] - h, p1[2]], [p1[0], p1[1], p1[2]], [p0[0], p0[1], p0[2]]], [-nz, 0, nx], [[0, 0], [1, 0], [1, 1], [0, 1]], bands[b], FIXED)
    } else {
      const q0 = [x + (tx - x) * (1 - w / L), y + (ty - y) * (1 - w / L), z + (tz - z) * (1 - w / L)] as const
      const yb = (k: number): number => -h * (k / 3)
      out.quad([[q0[0], q0[1] + yb(b + 1), q0[2]], [tx, ty + yb(b + 1), tz], [tx, ty + yb(b), tz], [q0[0], q0[1] + yb(b), q0[2]]], [-nz, 0, nx], [[0, 0], [1, 0], [1, 1], [0, 1]], bands[b], FIXED)
    }
  }
  if (!paris) {
    const q0 = [x + (tx - x) * (1 - w / L), y + (ty - y) * (1 - w / L), z + (tz - z) * (1 - w / L)] as const
    const mid = [x + (tx - x) * (1 - w / L / 2.2), y + (ty - y) * (1 - w / L / 2.2), z + (tz - z) * (1 - w / L / 2.2)] as const
    out.quad([[q0[0], q0[1] - h * 0.55, q0[2]], [mid[0], mid[1] - h * 0.55, mid[2]], [mid[0], mid[1] + 0.01, mid[2]], [q0[0], q0[1] + 0.01, q0[2]]], [-nz, 0, nx], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.15, 0.2, 0.45], FIXED)
  }
}

export function quickMarksLayer(scene: Scene, terrain: Terrain, region: string | undefined): TileLayer {
  const paris = region === 'paris'
  return {
    name: 'quickmarks',
    range: 4,
    build(near) {
      const out = new MeshBuilder()
      const byId = new Map(near.tile.buildings.map((b) => [b.id, b]))
      for (const l of near.tile.landmarks) {
        const b = byId.get(l.id)
        // a manifest landmark took its building away (replaced) — it has its own model
        if (!b || (b.minHeight ?? 0) > 1) continue
        const f = l.frontage
        const g = terrain.heightAt(f.x, f.z)
        const eaves = b.height ?? (b.levels ? b.levels * 3.3 : 12)
        if (l.kind === 'civic' || l.kind === 'school' || l.kind === 'museum') {
          flag(out, f.x + f.nx * 0.1, g + Math.min(eaves - 2, 8.5), f.z + f.nz * 0.1, f.nx, f.nz, paris)
        } else if (l.kind === 'church') {
          // a bell tower at the front, inside the footprint, its spire in slate
          const ring = unpackPoints(b.ring)
          let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
          for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
          const size = Math.max(4.5, Math.min(9, Math.min(x1 - x0, z1 - z0) * 0.4, f.len * 0.4))
          const cx = f.x - f.nx * (size / 2 + 0.2)
          const cz = f.z - f.nz * (size / 2 + 0.2)
          const base = Math.min(...[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => terrain.heightAt(cx + u * size / 2, cz + v * size / 2))) - 0.3
          const top = base + Math.max(eaves + 10, 24)
          const stone: Rgb = [0.8, 0.76, 0.67]
          const slate: Rgb = [0.4, 0.43, 0.46]
          prism(out, cx, cz, base, top, size * 0.71, 4, stone, FIXED)
          // the belfry openings, dark, on each face near the top
          for (let k = 0; k < 4; k++) {
            const a = (k / 4) * Math.PI * 2
            box(out, cx + Math.sin(a) * size * 0.51, top - 3.2, cz + Math.cos(a) * size * 0.51, Math.abs(Math.cos(a)) * size * 0.18 + 0.05, 1.8, Math.abs(Math.sin(a)) * size * 0.18 + 0.05, [0.18, 0.18, 0.2], FIXED)
          }
          prism(out, cx, cz, top, top + 0.6, size * 0.78, 4, [0.72, 0.68, 0.6], FIXED)
          prism(out, cx, cz, top + 0.6, top + 0.6 + size * 2.1, size * 0.62, 8, slate, FIXED, 0.08)
          // the cross
          box(out, cx, top + 0.6 + size * 2.1 + 0.9, cz, 0.06, 0.9, 0.06, [0.8, 0.66, 0.3], FIXED)
          box(out, cx, top + 0.6 + size * 2.1 + 1.2, cz, 0.4, 0.06, 0.06, [0.8, 0.66, 0.3], FIXED)
        }
      }
      if (out.triangles === 0) return []
      const m = new Mesh(`quickmarks:${near.key}`, scene)
      out.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(scene, 'cartoonLandmark', false)
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
      return [m]
    },
  }
}
