/**
 * Posters (PARIS_EXPAND §6 item 9): the Morris columns' ring of posters, twelve round each drum. The designs are the
 * street-ad library's events (render/affiches.ts, src/city/affiches/<set>.json: invented theatre, concerts,
 * exhibitions — never anyone's real campaign), on plain paper, unlit at night.
 */
import { afficheCell, afficheMaterial } from './affiches.ts'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import type { TileLayer } from './city.ts'
import type { Terrain } from '../city/terrain.ts'

/** a cell of the street-ad library's events (render/affiches.ts): the Morris column wears the city's theatre and concerts */
const cell = (region: string | undefined, i: number): [number, number, number, number] => afficheCell(region, 'portrait', i, 'event')

/**
 * The posters of the Morris columns in a tile: twelve round each drum, in two staggered tiers, each design
 * picked by the column's place so a column always wears the same.
 */
export function postersLayer(scene: Scene, terrain: Terrain, region: string | undefined): TileLayer {
  return {
    name: 'posters',
    range: 2,
    build(near, rect) {
      const cols = near.tile.furniture.filter((f) => f.kind === 'column' && f.x >= rect.x0 && f.x < rect.x1 && f.z >= rect.z0 && f.z < rect.z1)
      if (cols.length === 0) return []
      const out = new MeshBuilder()
      for (const f of cols) {
        const g = terrain.heightAt(f.x, f.z) + 0.15
        const seed = Math.abs(Math.round(f.x * 13 + f.z * 7))
        // six a tier, two tiers staggered: each 0.62 m by 0.93 m, the poster's own 2:3
        const n = 6
        for (let k = 0; k < n * 2; k++) {
          const tier = Math.floor(k / n)
          const a0 = ((k % n + tier * 0.5) / n) * Math.PI * 2
          const a1 = ((k % n + tier * 0.5 + 0.94) / n) * Math.PI * 2
          const r = 0.625
          const y0 = g + 0.5 + tier * 1.0
          const y1 = y0 + 0.93
          const [u0, v0, u1, v1] = cell(region, seed + k * 5)
          // bent round the drum in four facets: one flat chord over a sixth of the circle cut into the column
          const F = 4
          for (let q = 0; q < F; q++) {
            const b0 = a0 + ((a1 - a0) * q) / F
            const b1 = a0 + ((a1 - a0) * (q + 1)) / F
            const bm = (b0 + b1) / 2
            const ua = u1 + ((u0 - u1) * q) / F
            const ub = u1 + ((u0 - u1) * (q + 1)) / F
            out.quad([[f.x + Math.sin(b0) * r, y0, f.z + Math.cos(b0) * r], [f.x + Math.sin(b1) * r, y0, f.z + Math.cos(b1) * r],
              [f.x + Math.sin(b1) * r, y1, f.z + Math.cos(b1) * r], [f.x + Math.sin(b0) * r, y1, f.z + Math.cos(b0) * r]],
            [Math.sin(bm), 0, Math.cos(bm)], [[ua, v0], [ub, v0], [ub, v1], [ua, v1]], [1, 1, 1], 0)
          }
        }
      }
      const m = new Mesh(`posters:${near.key}`, scene)
      out.toVertexData().applyToMesh(m)
      m.material = afficheMaterial(scene, region, false)
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
      return [m]
    },
  }
}
