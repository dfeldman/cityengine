import type { MeshBuilder } from '../../../buildings.ts'
import { box } from '../../../models.ts'
import { block, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { palette, pts, slab } from './common.ts'

const FIXED = 0

/**
 * The Palais de Tokyo's parvis (Dondel, Aubert, Viard and Dastugue for the 1937 Exhibition): the court between its two
 * wings — the Palais de Tokyo itself east, the Musée d'Art Moderne de Paris west (both OSM's massing, in the stone
 * dress: palaces.json) — which is what the building IS to anyone passing on the Avenue de New-York or the river:
 *
 * - the PERISTYLE of tall, slender square columns standing free in front of both wings' inner faces and across the
 *   head of the court, roofed back to the walls under a flat attic band;
 * - the PORTICO on the Avenue du Président-Wilson side, its row of columns following the avenue's slant;
 * - the court falling in broad TERRACES toward the Seine, the long pool on the lowest, Bourdelle's France on the
 *   upper terrace (a tall bronze figure on her plinth).
 *
 * Every column is where OSM maps it (the `building:part=column` ways 1214526961… and the portico roof, way 79219265,
 * both claimed by the entry, since this draws them), measured in this frame with osmium, 2026-10-29: nothing stands in the wings'
 * footprints (ways 79219351 and 79219308 — their inner faces here at x −16.9 and +18.0, the court widening to
 * −27.7 / +29.0 from z +1.8). Local frame: the court along z, the Seine at +z (bearing 162), the avenue at −z.
 *
 * Drawn in plain metres, not fitted to the entry's `size`: the court runs at 18° to the meridian, and `size` is the
 * world-square box inscribed in it (the nonbuildings audit measures a standalone entry by that box, unrotated).
 */
export function tokyoParvis(out: MeshBuilder, fit: Fit): void {
  // the court falls toward the river: each terrace stands on the ground measured under it, where the loader measured
  // it; otherwise on the design levels, the river terrace the datum
  const design = [3.4, 1.8, 0]
  const level = (i: number, z: number): number => (fit.groundAt ? fit.groundAt(0, z) : design[i])
  draw(out, [level(0, -20), level(1, 3), level(2, 31)])
}

function draw(out: MeshBuilder, lv: number[]): void {
  const p = palette('#bdb6a3')
  const pier = shade(p.stone, 1.03)
  const u = lv[0]
  const h = 13.2 + u
  const col = (x: number, z: number): void => block(out, x - 0.5, x + 0.5, z - 0.5, z + 0.5, u - 0.3, h, pier)
  // ---- the peristyle: down both sides and across the head of the court, as OSM maps the columns
  const zs = [-2.65, -6.7, -10.75, -14.8, -18.8, -22.9]
  for (const z of zs) { col(-13.4, z); col(14.2, z) }
  for (const x of [-13.4, -9.4, -5.5, -1.55, 2.3, 6.3, 10.2, 14.2]) col(x, -27.0)
  // its roof back to the wings' faces, the attic band over the columns
  slab(out, pts([-16.85, -2.1, -12.85, -2.1, -12.85, -26.45, 13.65, -26.45, 13.65, -2.1, 17.95, -2.1, 17.95, -30.4, -16.85, -30.4]), h, h + 1.6, p.stone)
  // ---- the portico on the avenue, its columns on the avenue's slant, between the wings' ends
  const front: [number, number][] = [[-9.15, -39.55], [-5.5, -39.6], [-1.85, -40.05], [1.75, -41.0], [5.15, -42.2], [8.4, -43.75]]
  for (const [x, z] of front) col(x, z)
  slab(out, pts([-13.2, -30.4, 13.8, -30.4, 13.8, -34.4, 9.5, -34.5, 9.5, -40.2, 9.1, -44.6, -8.9, -40.3, -8.9, -34.6, -13.1, -34.5]), h, h + 1.6, p.stone)
  block(out, -13, 13.6, -34.4, -30.4, u - 0.3, u, shade(p.stone, 0.95))                           // its floor
  block(out, -8.8, 9.4, -39.4, -34.4, u - 0.3, u, shade(p.stone, 0.95))
  // ---- the terraces stepping down the court toward the river, the pool on the lowest, the steps between
  const steps: [number, number, number][] = [[-30.4, -8, lv[0]], [-8, 14, lv[1]], [14, 48, lv[2]]]
  for (const [z0, z1, y] of steps) block(out, -16.6, 16.6, z0, z1, y - 0.3, y, shade(p.stone, 0.95))
  for (const [z, ya, yb] of [[-8, lv[0], lv[1]], [14, lv[1], lv[2]]] as const) {
    for (let i = 0; i < 6; i++) block(out, -10, 10, z + i * 0.45, z + (i + 1) * 0.45, yb - 0.3, ya - ((ya - yb) * i) / 6, shade(p.stone, 0.9))
  }
  const w = lv[2]
  block(out, -9, 9, 20, 44, w, w + 0.1, [0.32, 0.44, 0.48])                                       // the pool
  for (const x of [-9.2, 9.2]) block(out, x - 0.2, x + 0.2, 20, 44, w, w + 0.5, p.trim)
  for (const z of [20, 44]) block(out, -9.2, 9.2, z - 0.2, z + 0.2, w, w + 0.5, p.trim)
  // Bourdelle's France on the upper terrace
  block(out, -1.2, 1.2, -20, -17.6, u, u + 3.2, p.trim)
  box(out, 0, u + 6.4, -18.8, 0.5, 3.2, 0.45, [0.24, 0.3, 0.26], FIXED)
  box(out, 0.6, u + 9.2, -18.8, 0.12, 2.4, 0.12, [0.24, 0.3, 0.26], FIXED)                      // her spear
}
