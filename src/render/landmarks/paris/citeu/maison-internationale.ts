/**
 * THE MAISON INTERNATIONALE of the Cité Universitaire (Jean-Frédéric Larson, 1936; Rockefeller's gift): a Louis XIII château
 * after Fontainebleau, on the north side of the great lawn. Pale stone dressings — quoins, window surrounds, string courses —
 * on fields of pink brick; four storeys under steep slate roofs with stone dormers and tall brick chimneys. The plan is OSM's
 * (way/28754150) in seven ranges: the low central hall with its arched ground floor (the theatre and the salons), two cross
 * wings that come forward to the lawn as tall pavilions under pyramid roofs and run back north as the courts' sides, the two
 * long ranges under mansards and the two end pavilions. Refs: Commons (lawn front from the south and south-east, 2026-11-04).
 * Local frame: x along the front (west → east), −z the lawn front (bearing 198.5), origin the OSM outline's vertex mean.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, roof, shade, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

const STONE: Rgb = hex('#e4d8bf'), BRICK: Rgb = hex('#d2a690'), SLATE: Rgb = hex('#4b5359'), GLASS: Rgb = hex('#3a4248'), CHIM: Rgb = hex('#b0664c')
const stone = surfaceTag('ashlar'), brick = surfaceTag('brick')

// storeys: the ground floor taller, then three; eaves height above grade
const G = 4.6, FL = 3.4, EAVES = G + 3 * FL
// window: width, height, spacing along a face; the stone surround's margin
const WIN_W = 1.3, WIN_H = 2.1, BAY = 3.6, SUR = 0.22
const CORNICE = 0.7, QUOIN = 1.1
// roofs: mansard height and inset for the ranges, steep pyramid height for the pavilions
const MANSARD_H = 5.2, MANSARD_IN = 2.2, PAV_H = 10, PAV_LIFT = 1.6

type Kind = 'range' | 'pavilion' | 'hall'
/** [x0, x1, z0, z1, kind] in the local frame (OSM's outline, rotated) */
const PARTS: [number, number, number, number, Kind][] = [
  [-63.2, -51.1, -22.3, 13.1, 'pavilion'],   // west end pavilion
  [-51.1, -24.5, -20.8, 13.5, 'range'],
  [-24.6, -11.0, -33.8, 35.7, 'range'],       // west cross wing (its lawn end a pavilion, below)
  [-11.0, 26.4, -24.9, 2.6, 'hall'],
  [26.4, 40.2, -33.7, 35.5, 'range'],         // east cross wing
  [40.0, 55.7, -14.7, 9.6, 'range'],
  [55.7, 69.1, -18.9, 9.7, 'pavilion'],      // east end pavilion
]
/** the tall pyramid pavilions at the lawn ends of the cross wings: [x0, x1, z0, z1] */
const FRONT_PAVILIONS: [number, number, number, number][] = [[-24.6, -11.0, -33.8, -20.8], [26.4, 40.2, -33.7, -20.7]]

function chimney(out: MeshBuilder, x: number, z: number, y0: number, h: number): void {
  block(out, x - 0.6, x + 0.6, z - 0.9, z + 0.9, y0, y0 + h, CHIM, brick)
  block(out, x - 0.75, x + 0.75, z - 1.05, z + 1.05, y0 + h, y0 + h + 0.35, STONE, stone)
}

/** walls, stone dressings and windows of one rectangle, eaves at y + e */
function walls(out: MeshBuilder, y: number, x0: number, x1: number, z0: number, z1: number, e: number, arcade: boolean): void {
  block(out, x0, x1, z0, z1, y, y + e, BRICK, brick)
  block(out, x0 - 0.12, x1 + 0.12, z0 - 0.12, z1 + 0.12, y, y + 1.0, STONE, stone)                     // plinth
  block(out, x0 - 0.25, x1 + 0.25, z0 - 0.25, z1 + 0.25, y + e - CORNICE, y + e, STONE, stone)         // cornice
  for (const yb of [G, G + FL]) block(out, x0 - 0.08, x1 + 0.08, z0 - 0.08, z1 + 0.08, y + yb - 0.25, y + yb, STONE, stone)
  for (const [qx, qz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
    block(out, qx - QUOIN / 2, qx + QUOIN / 2, qz - QUOIN / 2, qz + QUOIN / 2, y, y + e - CORNICE, STONE, stone)
  }
  const faces: ['-z' | '+z' | '-x' | '+x', number, number, number][] = [['-z', z0, x0, x1], ['+z', z1, x0, x1], ['-x', x0, z0, z1], ['+x', x1, z0, z1]]
  for (const [f, plane, t0, t1] of faces) {
    const n = Math.max(1, Math.floor((t1 - t0 - 2 * QUOIN) / BAY)), step = (t1 - t0 - 2 * QUOIN) / n
    for (let i = 0; i < n; i++) {
      const t = t0 + QUOIN + step * (i + 0.5)
      for (let s = 0; s < 4; s++) {
        const ys = s === 0 ? y + 1.3 : y + G + (s - 1) * FL + 0.7, h = s === 0 ? (arcade ? G - 1.6 : WIN_H + 0.3) : WIN_H
        const w = s === 0 && arcade ? WIN_W * 1.5 : WIN_W
        rectOn(out, f, plane, t - w / 2 - SUR, t + w / 2 + SUR, ys - SUR, ys + h + SUR, STONE, 0.04)
        rectOn(out, f, plane, t - w / 2, t + w / 2, ys, ys + h, GLASS, 0.07)
        if (s === 0 && arcade) rectOn(out, f, plane, t - w / 2 - SUR, t + w / 2 + SUR, ys + h - 0.5, ys + h + SUR, STONE, 0.08)  // the arch's keystone band
      }
    }
  }
}

/** stone dormers along a long face of a mansard, in step with the bays below */
function dormers(out: MeshBuilder, y: number, x0: number, x1: number, z: number, out_: -1 | 1): void {
  const n = Math.max(1, Math.floor((x1 - x0 - 2 * QUOIN) / BAY)), step = (x1 - x0 - 2 * QUOIN) / n
  for (let i = 0; i < n; i++) {
    const t = x0 + QUOIN + step * (i + 0.5), zf = z - out_ * 0.6, zb = zf - out_ * 1.6
    block(out, t - 0.95, t + 0.95, Math.min(zf, zb), Math.max(zf, zb), y, y + 2.4, STONE, stone)
    rectOn(out, out_ < 0 ? '-z' : '+z', zf, t - 0.55, t + 0.55, y + 0.3, y + 2.0, GLASS, 0.05)
    roof(out, t - 1.1, t + 1.1, Math.min(zf, zb) - 0.1, Math.max(zf, zb) + 0.1, y + 2.4, 1.2, 1.1, 0, SLATE)
  }
}

export function maisonInternationale(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  for (const [x0, x1, z0, z1, kind] of PARTS) {
    const e = kind === 'hall' ? EAVES - FL : kind === 'pavilion' ? EAVES + PAV_LIFT : EAVES
    walls(out, y, x0, x1, z0, z1, e, kind === 'hall')
    const yr = y + e
    if (kind === 'pavilion') {
      roof(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, yr, PAV_H * 0.7, Math.min(3, (x1 - x0) / 3), Math.min(3, (z1 - z0) / 3), SLATE)
      roof(out, x0 + 2.7, x1 - 2.7, z0 + 2.7, z1 - 2.7, yr + PAV_H * 0.7, PAV_H * 0.3, (x1 - x0) / 2 - 3, 0.5, SLATE)
      chimney(out, (x0 + x1) / 2, z0 + 5, yr, PAV_H + 2)
      chimney(out, (x0 + x1) / 2, z1 - 5, yr, PAV_H + 2)
      continue
    }
    const along = x1 - x0 > z1 - z0
    roof(out, x0 - 0.25, x1 + 0.25, z0 - 0.25, z1 + 0.25, yr, MANSARD_H, MANSARD_IN, MANSARD_IN, SLATE)
    if (along) {
      dormers(out, yr, x0, x1, z0 + 0.4, -1)
      dormers(out, yr, x0, x1, z1 - 0.4, 1)
      for (const cx of [x0 + 4, x1 - 4]) chimney(out, cx, (z0 + z1) / 2, yr, MANSARD_H + 2.5)
    } else {
      for (const cz of [z0 + 18, (z0 + z1) / 2 + 8, z1 - 4]) chimney(out, x0 + 2.5, cz, yr, MANSARD_H + 2)
    }
  }
  // the two lawn pavilions of the cross wings: a storey higher, under the great steep pyramids that mark the front
  for (const [x0, x1, z0, z1] of FRONT_PAVILIONS) {
    const e = EAVES + PAV_LIFT
    walls(out, y, x0, x1, z0, z1, e, false)
    roof(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, y + e, PAV_H * 1.25, (x1 - x0) / 2 + 0.3, (z1 - z0) / 2 + 0.3, SLATE)
    block(out, (x0 + x1) / 2 - 0.15, (x0 + x1) / 2 + 0.15, (z0 + z1) / 2 - 0.15, (z0 + z1) / 2 + 0.15, y + e + PAV_H * 1.25, y + e + PAV_H * 1.25 + 2, shade(SLATE, 0.7))
    chimney(out, x0 + 1.5, z1 + 1.5, y + e, PAV_H * 0.8)
    chimney(out, x1 - 1.5, z1 + 1.5, y + e, PAV_H * 0.8)
  }
}
