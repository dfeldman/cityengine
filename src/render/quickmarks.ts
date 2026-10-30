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
import { buildingIndex, faceFor } from './signs.ts'

const FIXED = 0

function flag(out: MeshBuilder, x: number, y: number, z: number, nx: number, nz: number, paris: boolean, eu = false, own?: Rgb[]): void {
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
  const w = 1.6
  const h = 1.05
  if (eu) {
    // the European flag: blue, its twelve gold stars in a ring
    const t0 = 1 - w / L
    const at = (t: number, dy: number): [number, number, number] => [x + (tx - x) * t, y + (ty - y) * t + dy, z + (tz - z) * t]
    out.quad([at(t0, -h), at(1, -h), at(1, 0), at(t0, 0)], [-nz, 0, nx], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.0, 0.2, 0.58], FIXED)
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2, tc = t0 + (w / L) * (0.5 + Math.cos(a) * 0.3), yc = -h / 2 + Math.sin(a) * h * 0.33, d = 0.035
      const p = at(tc, yc)
      const ux = (tx - x) / L, uz = (tz - z) / L
      out.quad([[p[0] - ux * d + nx * 0.005, p[1] - d, p[2] - uz * d + nz * 0.005], [p[0] + ux * d + nx * 0.005, p[1] - d, p[2] + uz * d + nz * 0.005],
        [p[0] + ux * d + nx * 0.005, p[1] + d, p[2] + uz * d + nz * 0.005], [p[0] - ux * d + nx * 0.005, p[1] + d, p[2] - uz * d + nz * 0.005]],
        [-nz, 0, nx], [[0, 0], [1, 0], [1, 1], [0, 1]], [1.0, 0.82, 0.0], FIXED)
    }
    return
  }
  const bands: Rgb[] = own ?? (paris ? [[0.18, 0.28, 0.62], [0.95, 0.95, 0.95], [0.82, 0.15, 0.18]] : [[0.72, 0.12, 0.16], [0.95, 0.95, 0.95], [0.72, 0.12, 0.16]])
  for (let b = 0; b < 3; b++) {
    const t0 = 1 - (w / L) + (b / 3) * (w / L)
    const t1 = 1 - (w / L) + ((b + 1) / 3) * (w / L)
    const p0 = [x + (tx - x) * t0, y + (ty - y) * t0, z + (tz - z) * t0] as const
    const p1 = [x + (tx - x) * t1, y + (ty - y) * t1, z + (tz - z) * t1] as const
    // Paris's bands are vertical (hoist to fly); the US flag's stripes run along it
    if (paris || own) {
      out.quad([[p0[0], p0[1] - h, p0[2]], [p1[0], p1[1] - h, p1[2]], [p1[0], p1[1], p1[2]], [p0[0], p0[1], p0[2]]], [-nz, 0, nx], [[0, 0], [1, 0], [1, 1], [0, 1]], bands[b], FIXED)
    } else {
      const q0 = [x + (tx - x) * (1 - w / L), y + (ty - y) * (1 - w / L), z + (tz - z) * (1 - w / L)] as const
      const yb = (k: number): number => -h * (k / 3)
      out.quad([[q0[0], q0[1] + yb(b + 1), q0[2]], [tx, ty + yb(b + 1), tz], [tx, ty + yb(b), tz], [q0[0], q0[1] + yb(b), q0[2]]], [-nz, 0, nx], [[0, 0], [1, 0], [1, 1], [0, 1]], bands[b], FIXED)
    }
  }
  if (!paris && !own) {
    const q0 = [x + (tx - x) * (1 - w / L), y + (ty - y) * (1 - w / L), z + (tz - z) * (1 - w / L)] as const
    const mid = [x + (tx - x) * (1 - w / L / 2.2), y + (ty - y) * (1 - w / L / 2.2), z + (tz - z) * (1 - w / L / 2.2)] as const
    out.quad([[q0[0], q0[1] - h * 0.55, q0[2]], [mid[0], mid[1] - h * 0.55, mid[2]], [mid[0], mid[1] + 0.01, mid[2]], [q0[0], q0[1] + 0.01, q0[2]]], [-nz, 0, nx], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.15, 0.2, 0.45], FIXED)
  }
}

/** a hotel's third flag, beside the tricolour and the EU's: Italy, Belgium, Ireland — vertical tricolours all */
const GUESTS: Rgb[][] = [
  [[0.0, 0.55, 0.27], [0.95, 0.95, 0.95], [0.8, 0.13, 0.17]],
  [[0.08, 0.08, 0.08], [0.98, 0.85, 0.15], [0.86, 0.15, 0.18]],
  [[0.08, 0.6, 0.35], [0.95, 0.95, 0.95], [0.98, 0.52, 0.15]],
]

export function quickMarksLayer(scene: Scene, terrain: Terrain, region: string | undefined): TileLayer {
  const paris = region === 'paris'
  return {
    name: 'quickmarks',
    range: 4,
    build(near) {
      const out = new MeshBuilder()
      /*
       * A HOTEL's flags over its door (Mapillary, Rue du Faubourg-Saint-Martin, 2026-10-29): the tricolour, the EU's and
       * a guest's, on short poles above the entrance. OSM gives a hotel only as a named `service` point, so it is found
       * by name and put on the wall of the building it stands in, as a shop's sign is (render/signs.ts `faceFor`).
       */
      if (paris) {
        let index: ReturnType<typeof buildingIndex> | null = null
        for (const p of near.tile.pois ?? []) {
          if (p.kind !== 'service' || !p.name || !/\bh[oô]tel\b/i.test(p.name) || /h[oô]tel (de ville|des ventes|de police|particulier)/i.test(p.name)) continue
          index ??= buildingIndex(near.tile.buildings)
          const s = faceFor(p, index)
          if (!s) continue
          const g = terrain.heightAt(s.x, s.z)
          const ax = -s.nz, az = s.nx
          const h = Math.imul(Math.round(p.x * 10) ^ Math.round(p.z * 10), 2654435761) >>> 0
          for (let i = 0; i < 3; i++) {
            const o = (i - 1) * 1.7
            flag(out, s.x + s.nx * 0.1 + ax * o, g + 4.3, s.z + s.nz * 0.1 + az * o, s.nx, s.nz, true, i === 1, i === 2 ? GUESTS[h % GUESTS.length] : undefined)
          }
        }
      }
      const byId = new Map(near.tile.buildings.map((b) => [b.id, b]))
      for (const l of near.tile.landmarks) {
        const b = byId.get(l.id)
        // a manifest landmark took its building away (replaced) — it has its own model
        if (!b || (b.minHeight ?? 0) > 1) continue
        const f = l.frontage
        const g = terrain.heightAt(f.x, f.z)
        const eaves = b.height ?? (b.levels ? b.levels * 3.3 : 12)
        /*
         * Paris's flags are not everywhere (owner, 2026-10-29: "French flags are not that common but are a nice touch on
         * government buildings especially" — "Also EU flags"): every civic building flies the tricolour with the EU flag
         * beside it; two schools and museums in five the tricolour alone.
         */
        const some = (Math.imul(l.id, 2654435761) >>> 0) % 5 < 2
        if (l.kind === 'civic' || ((l.kind === 'school' || l.kind === 'museum') && (!paris || some))) {
          flag(out, f.x + f.nx * 0.1, g + Math.min(eaves - 2, 8.5), f.z + f.nz * 0.1, f.nx, f.nz, paris)
          if (paris && l.kind === 'civic') {
            const ax = -f.nz * 2.2, az = f.nx * 2.2
            flag(out, f.x + f.nx * 0.1 + ax, g + Math.min(eaves - 2, 8.5), f.z + f.nz * 0.1 + az, f.nx, f.nz, paris, true)
          }
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
