import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LE MONUMENT AUX VOLONTAIRES AMERICAINS (square Thomas-Jefferson / place des États-Unis, Paris 16e; Wikidata Q19945167;
 * Jean Boucher, 1923, for the Americans who volunteered for France in 1914-17): a low, wide block of pale limestone
 * (winged panels either side, a cornice, a small attic plinth) on two broad steps and a figure ledge. On its front the
 * relief group (a French and an American soldier clasping hands before a winged, draped Victory: Modly
 * `volontaires-groupe`) and on top the bronze American soldier with his arm raised (Modly `volontaires-soldat`). Frame:
 * −z the front with the steps, x across, y up from the ground (G). The block is the OSM building way's box (3.5 x 5.7 m);
 * the heights are scaled by eye off Commons photographs (soldiers ~1.8 m), not surveyed.
 */
export const HX = 2.85
export const HZ = 1.75

// tunables (metres above the ground, half-widths about the centre)
const STEP1_HW = 3.9, STEP1_OUT = 1.15, STEP1_H = 0.16     // lower step (out = depth in front of the block)
const STEP2_HW = 3.5, STEP2_OUT = 0.8, STEP2_H = 0.16      // upper step
const LEDGE_HW = 2.55, LEDGE_OUT = 0.5, LEDGE_H = 0.26     // the ledge the relief figures stand on
const BASE_H = 0.5, BASE_OUT = 0.06                        // the block's plinth course
const BLOCK_H = 2.75                                        // top of the cornice course, from the step-2 top
const CORNICE_H = 0.22, CORNICE_OUT = 0.1
const ATTIC_HW = 0.75, ATTIC_HD = 0.65, ATTIC_H = 0.3      // the plinth for the bronze
const WING_Y = 1.75, WING_H = 0.62, WING_FROM = 0.55, WING_TO = 2.55, WING_ROWS = 4   // carved feather rows each side

const STONE: Rgb = hex('#d6d0c0')
const DARK: Rgb = hex('#3a3b3a')
const WEATHER: Rgb = hex('#bcb5a3')

const TOP_Y = STEP1_H + STEP2_H + BLOCK_H + CORNICE_H
/** Where the bronze soldier stands, in the model's own frame. */
export const SOLDIER_AT: [number, number, number] = [0, G + TOP_Y + ATTIC_H, 0]
/** Where the relief group stands: on the ledge, against the block's front face. */
export const GROUP_AT: [number, number, number] = [0, G + STEP1_H + STEP2_H + LEDGE_H, -HZ - 0.02]

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  block(q, -STEP1_HW, STEP1_HW, -HZ - STEP1_OUT, HZ + 0.4, y(0), y(STEP1_H), shade(STONE, 0.9))
  block(q, -STEP2_HW, STEP2_HW, -HZ - STEP2_OUT, HZ + 0.3, y(STEP1_H), y(STEP1_H + STEP2_H), shade(STONE, 0.94))
  const y2 = STEP1_H + STEP2_H
  block(q, -LEDGE_HW, LEDGE_HW, -HZ - LEDGE_OUT, HZ, y(y2), y(y2 + LEDGE_H), shade(STONE, 0.97))
  // plinth course, then the main body
  block(q, -HX - BASE_OUT, HX + BASE_OUT, -HZ - BASE_OUT, HZ + BASE_OUT, y(y2), y(y2 + BASE_H), shade(STONE, 0.95))
  block(q, -HX, HX, -HZ, HZ, y(y2 + BASE_H), y(y2 + BLOCK_H), STONE)
  // weathering band under the cornice
  block(q, -HX - 0.015, HX + 0.015, -HZ - 0.015, HZ + 0.015, y(y2 + BLOCK_H - 0.3), y(y2 + BLOCK_H - 0.2), WEATHER)
  block(q, -HX - CORNICE_OUT, HX + CORNICE_OUT, -HZ - CORNICE_OUT, HZ + CORNICE_OUT, y(y2 + BLOCK_H), y(TOP_Y), shade(STONE, 1.03))
  block(q, -ATTIC_HW, ATTIC_HW, -ATTIC_HD, ATTIC_HD, y(TOP_Y), y(TOP_Y + ATTIC_H), shade(STONE, 0.97))
  // the bronze's own dark plate
  block(q, -0.5, 0.5, -0.45, 0.45, y(TOP_Y + ATTIC_H), y(TOP_Y + ATTIC_H + 0.04), DARK)
  // carved feather rows of the two wings (shallow relief, front face)
  for (const s of [-1, 1]) {
    for (let r = 0; r < WING_ROWS; r++) {
      const yy = y2 + WING_Y + r * (WING_H / WING_ROWS)
      const a = WING_FROM + r * 0.08, b = WING_TO - r * 0.12
      block(q, s > 0 ? a : -b, s > 0 ? b : -a, -HZ - 0.035, -HZ, y(yy), y(yy + WING_H / WING_ROWS * 0.62), shade(STONE, 0.9 - r * 0.015))
    }
  }
  // inscription panel low on the front, under the figures' feet
  plaque(q, { x: 0, z: -HZ - 0.001, y0: y(y2 + BASE_H + 0.1), w: 1.5, h: 0.45, panel: shade(STONE, 1.04), letters: shade(STONE, 0.5), lines: [0.8, 0.6] })
}

export function monumentVolontairesAmericains(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
