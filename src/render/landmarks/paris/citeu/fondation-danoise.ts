/**
 * THE FONDATION DANOISE (Kaj Gottlob, 1932): a plain six-storey block of grey-brown Danish brick under a low red-tiled
 * hipped roof with deep eaves. The entrance front (SW) has seven bays of white-framed casements, the door in the middle
 * bay up a flight of steps, a clock over it; small hipped dormer cupolas sit on the roof. The NE garden face is closer
 * set, eleven bays. The SE end carries a central stack of white balconies before glazed loggias, crowned by a gabled
 * bay that breaks the eaves. Refs: Commons (docs/landmarks/refs/citeu/danoise/, 2026-11-04). Plan from OSM way 30898832
 * (≈22 × 14 m), facing from the entrance steps (way 353020222) on its SW side.
 * Local frame: −z toward bearing 240 (the entrance), x toward bearing 150 (the loggia end); origin the outline's vertex mean.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { clockOn, hipRoof, palette, rectOn } from '../palaces/common.ts'

const BRICK: Rgb = hex('#7d6358'), BASE: Rgb = hex('#5e4c45'), FRAME: Rgb = hex('#eeeeea'), GLASS: Rgb = hex('#2f3437')
const TILE: Rgb = hex('#6a3a2d'), SOFFIT: Rgb = hex('#3b3330'), WHITE: Rgb = hex('#f2f2ee'), STEP: Rgb = hex('#b9b4aa')
const brick = surfaceTag('brick'), stucco = surfaceTag('stucco')
const PAL = palette()

// plan (OSM, rotated) and storeys
const HX = 11.0, HZ = 7.0
const FL = 3.0, LEVELS = 6, PLINTH = 0.6
// roof: rise, eave overhang, eave board depth
const ROOF_H = 3.4, EAVE = 0.9, BOARD = 0.35
// windows: width and height, sill above floor, frame margin
const WIN_W = 1.3, WIN_H = 1.75, SILL = 0.75, FR = 0.12
const FRONT_BAYS = 7, BACK_BAYS = 11, END_BAYS = 3
// entrance: door width/height, steps, clock
const DOOR_W = 1.8, DOOR_H = 2.9, STEP_N = 4, STEP_RISE = 0.16, STEP_RUN = 0.35, STEP_W = 6, CLOCK_R = 0.45
// the loggia stack on the SE end: width, balcony depth, gabled bay over the eaves
const LOG_W = 4.6, BALC_D = 1.0, BALC_H = 1.0, GABLE_H = 3.0
// dormer cupolas: front pair and garden row, box size
const CUP_W = 1.6, CUP_H = 1.3, CUP_ROOF = 0.8
const CUPS_FRONT = [-3.2, 3.2], CUPS_BACK = [-8, -4, 0, 4, 8]

type Face = '-z' | '+z' | '-x' | '+x'

function windowOn(out: MeshBuilder, f: Face, plane: number, t: number, y: number, w = WIN_W, h = WIN_H): void {
  rectOn(out, f, plane, t - w / 2 - FR, t + w / 2 + FR, y - FR, y + h + FR, FRAME, 0.05)
  rectOn(out, f, plane, t - w / 2, t + w / 2, y, y + h, GLASS, 0.07)
}

function bays(out: MeshBuilder, f: Face, plane: number, half: number, n: number, g: number, skip?: (b: number, s: number) => boolean): void {
  const step = (2 * half) / n
  for (let b = 0; b < n; b++) for (let s = 0; s < LEVELS; s++) {
    if (skip?.(b, s)) continue
    windowOn(out, f, plane, -half + step * (b + 0.5), g + PLINTH + s * FL + SILL)
  }
}

function cupola(out: MeshBuilder, x: number, z: number, y: number): void {
  block(out, x - CUP_W / 2, x + CUP_W / 2, z - CUP_W / 2, z + CUP_W / 2, y, y + CUP_H, WHITE, stucco)
  rectOn(out, '-z', z - CUP_W / 2, x - 0.45, x + 0.45, y + 0.25, y + CUP_H - 0.2, GLASS, 0.05)
  rectOn(out, '+z', z + CUP_W / 2, x - 0.45, x + 0.45, y + 0.25, y + CUP_H - 0.2, GLASS, 0.05)
  hipRoof(out, x - CUP_W / 2, x + CUP_W / 2, z - CUP_W / 2, z + CUP_W / 2, y + CUP_H, CUP_ROOF, TILE, 0.2)
}

export function fondationDanoise(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0, eaves = g + PLINTH + LEVELS * FL
  block(out, -HX - 0.05, HX + 0.05, -HZ - 0.05, HZ + 0.05, g - 0.3, g + PLINTH, BASE, brick)
  block(out, -HX, HX, -HZ, HZ, g + PLINTH, eaves, BRICK, brick)
  // the eave board and its dark soffit, then the roof
  block(out, -HX - EAVE, HX + EAVE, -HZ - EAVE, HZ + EAVE, eaves - BOARD, eaves, SOFFIT, stucco)
  hipRoof(out, -HX, HX, -HZ, HZ, eaves, ROOF_H, TILE, EAVE)

  // the entrance front: seven bays, the middle one the door, clock and a tall stair window over it
  const mid = (FRONT_BAYS - 1) / 2
  bays(out, '-z', -HZ, HX, FRONT_BAYS, g, (b, s) => b === mid && s === 0)
  rectOn(out, '-z', -HZ, -DOOR_W / 2 - FR, DOOR_W / 2 + FR, g + PLINTH, g + PLINTH + DOOR_H + FR, FRAME, 0.05)
  rectOn(out, '-z', -HZ, -DOOR_W / 2, DOOR_W / 2, g + PLINTH, g + PLINTH + DOOR_H, GLASS, 0.07)
  clockOn(out, '-z', -HZ, 0, g + PLINTH + FL + 0.35, CLOCK_R, PAL)
  for (let i = 0; i < STEP_N; i++) {
    const z1 = -HZ - i * STEP_RUN, w = STEP_W + i * 0.6
    block(out, -w / 2, w / 2, z1 - STEP_RUN, z1, g - 0.3, g + PLINTH - i * STEP_RISE, STEP, stucco)
  }

  // the garden face, closer set; the NW end, three bays
  bays(out, '+z', HZ, HX, BACK_BAYS, g)
  bays(out, '-x', -HX, HZ, END_BAYS, g)

  // the SE end: windows either side of a stack of white balconies before glazed loggias
  const side = HZ - (HZ - LOG_W / 2) / 2
  for (let s = 0; s < LEVELS; s++) {
    const y = g + PLINTH + s * FL
    windowOn(out, '+x', HX, -side, y + SILL)
    windowOn(out, '+x', HX, side, y + SILL)
    rectOn(out, '+x', HX, -LOG_W / 2 + 0.4, LOG_W / 2 - 0.4, y + 0.1, y + FL - 0.5, GLASS, 0.04)
    if (s === 0) continue
    block(out, HX, HX + BALC_D, -LOG_W / 2, LOG_W / 2, y - 0.15, y + 0.1, WHITE, stucco)
    block(out, HX + BALC_D - 0.08, HX + BALC_D, -LOG_W / 2, LOG_W / 2, y + 0.1, y + BALC_H, WHITE, stucco)
  }
  // the gabled bay over the stack, breaking the eaves
  const gz = LOG_W / 2 + 0.3, gx0 = HX - 2.5, gx1 = HX + BALC_D
  block(out, gx0, gx1, -gz, gz, eaves - BOARD, eaves + 1.0, BRICK, brick)
  rectOn(out, '+x', gx1, -1.2, 1.2, eaves - 0.2, eaves + 0.9, GLASS, 0.05)
  const ridge = eaves + 1.0 + GABLE_H, ov = 0.5
  out.quad([[gx1 + ov, eaves + 1.0, -gz - ov], [gx0, eaves + 1.0, -gz - ov], [gx0, ridge, 0], [gx1 + ov, ridge, 0]],
    [0, 0.8, -0.6], [[0, 0], [1, 0], [1, 1], [0, 1]], TILE, 0)
  out.quad([[gx0, eaves + 1.0, gz + ov], [gx1 + ov, eaves + 1.0, gz + ov], [gx1 + ov, ridge, 0], [gx0, ridge, 0]],
    [0, 0.8, 0.6], [[0, 0], [1, 0], [1, 1], [0, 1]], TILE, 0)
  out.quad([[gx1, eaves + 1.0, -gz], [gx1, eaves + 1.0, gz], [gx1, ridge - 0.3, 0], [gx1, ridge - 0.3, 0]],
    [1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], WHITE, stucco)

  // dormer cupolas on the slopes
  const cy = eaves + ROOF_H * 0.3
  for (const x of CUPS_FRONT) cupola(out, x, -HZ + 2.2, cy)
  for (const x of CUPS_BACK) cupola(out, x, HZ - 2.2, cy)
}
