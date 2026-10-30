import type { MeshBuilder } from '../../../buildings.ts'
import { strut } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, rectOn } from './common.ts'
import { lettersOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM way 316800538's box turned 11° (local −z faces bearing 11, the Rue Saint-Vincent; +x the Rue des Saules) */
const HX = 4.2
const HZ = 6.7
const PINK = hex('#d97f72')
const GREEN = hex('#2f7a55')
const TILES = hex('#5d4a3e')
const ZINC = hex('#8d9498')
const WHITE = hex('#ece9df')
const SIGN = hex('#24524a')
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * Au Lapin Agile, 22 Rue des Saules, the old cabaret of Montmartre, across the lane from the vineyard. A very small thing. A
 * rider coming down the cobbles sees:
 *
 * - the low PINK walls with their green shutters and the framed picture on the upper wall, under a brown tiled roof;
 * - the WHITE GABLE over the lane with AU LAPIN AGILE painted across it in green;
 * - the zinc roof of the little front room below the gable;
 * - the green PICKET FENCE with its yellow tips round the terrace, on its rubble wall, and the pink pier with the old green board.
 *
 * Footprint is OSM's (way 316800538). Massing off photographs from the crossing with the Rue Saint-Vincent (Commons, 2011–2015).
 * Which part of the plan is the gabled house and which the zinc room is my reading: the plan alone does not say. The fence and
 * pier stand on the street side of the footprint, where the terrace is.
 */
export function lapinAgile(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const glass = hex('#2a2c2e')
  // ---- the gabled house: pink under its tiled roof, ridge along x, the gable to the lane
  const x0 = -4.2
  const x1 = 1.4
  const z0 = -6.7
  const z1 = 6.7
  const eaves = 4.5
  const ridge = 7.1
  block(out, x0, x1, z0, z1, 0, eaves, PINK)
  rectOn(out, '-z', z0, x0, x1, 0, 0.6, shade(PINK, 0.7), 0.03)
  // the slopes
  const zm = (z0 + z1) / 2
  const slope = (za: number, sign: number): void => {
    out.quad([[x0 - 0.3, eaves - 0.15, za + sign * 0.35], [x1 + 0.15, eaves - 0.15, za + sign * 0.35], [x1 + 0.15, ridge, zm], [x0 - 0.3, ridge, zm]], [0, 0.85, sign * 0.5], UV, TILES, FIXED)
  }
  slope(z0, -1)
  slope(z1, 1)
  // the white gable on the lane
  const gable: [number, number, number][] = [[x1, eaves - 0.3, z0], [x1, eaves - 0.3, z1], [x1, ridge, zm], [x1, ridge, zm]]
  out.quad(gable, [1, 0, 0], UV, WHITE, FIXED)
  rectOn(out, '+x', x1, z0, z1, 3.6, eaves - 0.3, WHITE, 0)
  out.quad([[x0, eaves, z0], [x0, eaves, z1], [x0, ridge - 0.1, zm], [x0, ridge - 0.1, zm]], [-1, 0, 0], UV, shade(PINK, 0.92), FIXED)
  lettersOn(out, '+x', x1, zm, 5.75, 'AU', { h: 0.38, c: GREEN, wide: 0.7, th: 0.06, d: 0.03 })
  lettersOn(out, '+x', x1, zm, 5, 'LAPIN AGILE', { h: 0.55, c: GREEN, wide: 0.6, th: 0.08, gap: 0.08, d: 0.03 })
  lettersOn(out, '+x', x1, zm, 4.5, 'CABARET ARTISTIQUE', { h: 0.24, c: GREEN, wide: 0.62, th: 0.035, gap: 0.04, d: 0.03 })
  // ---- on the Rue Saint-Vincent wall: green shutters and the framed picture of the rabbit
  rectOn(out, '-z', z0, x0 + 0.5, x0 + 1.5, 2.5, 4.1, GREEN, 0.05)
  for (const x of [x0 + 0.72, x0 + 1, x0 + 1.28]) rectOn(out, '-z', z0, x - 0.02, x + 0.02, 2.5, 4.1, shade(GREEN, 0.65), 0.06)
  rectOn(out, '-z', z0, x0 + 2.2, x0 + 3.8, 2.3, 4.2, hex('#3a2b22'), 0.05)
  rectOn(out, '-z', z0, x0 + 2.35, x0 + 3.65, 2.45, 4.05, hex('#a0764e'), 0.07)
  rectOn(out, '-z', z0, x0 + 0.5, x0 + 1.5, 0.3, 2, GREEN, 0.05)
  rectOn(out, '-z', z0, x0 + 3.9, x0 + 5.3, 0.1, 2.2, GREEN, 0.05)
  for (const x of [x0 + 4.2, x0 + 4.6, x0 + 5]) rectOn(out, '-z', z0, x - 0.02, x + 0.02, 0.1, 2.2, shade(GREEN, 0.65), 0.06)
  // ---- the zinc room toward the lane
  const zx0 = x1
  const zx1 = 4.2
  block(out, zx0, zx1, z0, z1, 0, 3.1, PINK)
  out.quad([[zx0, 3.85, z0 - 0.25], [zx0, 3.85, z1 + 0.25], [zx1 + 0.25, 3.1, z1 + 0.25], [zx1 + 0.25, 3.1, z0 - 0.25]], [0.3, 0.95, 0], UV, ZINC, FIXED)
  for (let z = z0 + 1; z < z1; z += 1.2) strut(out, [zx0, 3.88, z], [zx1 + 0.25, 3.13, z], 0.05, 0.05, shade(ZINC, 0.8), FIXED, false)
  rectOn(out, '+x', zx1, -2.2, -0.2, 0.2, 2.4, GREEN, 0.05)
  rectOn(out, '+x', zx1, 1.2, 3, 0.8, 2.3, glass, 0.05)
  rectOn(out, '+x', zx1, 1, 3.2, 0.65, 0.8, GREEN, 0.06)
  rectOn(out, '-z', z0, zx0 + 0.3, zx1 - 0.3, 0.7, 2.2, glass, 0.05)
  // ---- the terrace on the crossing: rubble wall, the picket fence with yellow tips, a bush of green behind it
  const fz0 = z0 - 3.2
  const fx1 = zx1 + 0.4
  const fx0 = -1.4
  block(out, fx0, fx1, fz0, z0, 0, 0.7, hex('#8b8578'))
  block(out, fx0 + 0.3, fx1 - 0.4, fz0 + 0.3, z0, 0.7, 1.9, hex('#3f7a39'))
  const pale = (a: [number, number], b: [number, number]): void => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    const n = Math.round(L / 0.14)
    for (let i = 0; i <= n; i++) {
      const x = a[0] + ((b[0] - a[0]) * i) / n
      const z = a[1] + ((b[1] - a[1]) * i) / n
      strut(out, [x, 0.7, z], [x, 2.05, z], 0.08, 0.03, GREEN, FIXED, false)
      strut(out, [x, 2.05, z], [x, 2.25, z], 0.08, 0.03, hex('#e0c531'), FIXED, false)
    }
    strut(out, [a[0], 1.0, a[1]], [b[0], 1.0, b[1]], 0.06, 0.05, shade(GREEN, 0.75), FIXED, false)
    strut(out, [a[0], 1.8, a[1]], [b[0], 1.8, b[1]], 0.06, 0.05, shade(GREEN, 0.75), FIXED, false)
  }
  pale([fx0, fz0], [fx1, fz0])
  pale([fx1, fz0], [fx1, z0])
  // ---- the pink pier at the corner of the lane with the old green board
  const px = fx1 + 0.05
  block(out, px - 0.45, px + 0.45, fz0 - 0.55, fz0 + 0.35, 0, 3.7, PINK)
  rectOn(out, '-z', fz0 - 0.55, px - 0.38, px + 0.38, 1.0, 3.0, SIGN, 0.03)
  lettersOn(out, '-z', fz0 - 0.55, px, 2.3, 'LAPIN', { h: 0.2, c: hex('#e6d487'), wide: 0.62, th: 0.035, gap: 0.03, d: 0.05 })
  lettersOn(out, '-z', fz0 - 0.55, px, 2.0, 'AGILE', { h: 0.2, c: hex('#e6d487'), wide: 0.62, th: 0.035, gap: 0.03, d: 0.05 })
  block(out, px - 0.55, px + 0.55, fz0 - 0.65, fz0 + 0.45, 3.7, 3.82, ZINC)
}
