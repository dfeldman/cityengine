import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LA FONTAINE DU SQUARE LAMARTINE (Paris 16e; Wikidata Q3076297, "Fontaine à l'Albien", the Passy artesian well): since
 * the late 1950s (architect Dupuis) a plain travertine-clad block with a grey inscription plaque on its broad face and a
 * drinking tap on its narrow one, a low step and a small white basin at the tap. Frame: −z the plaque face (broad),
 * −x the tap face, x across, y up from the ground (G). Dimensions are scaled by eye off one Commons photo, not surveyed.
 */
export const HX = 2.4
export const HZ = 1.8

// tunables (metres)
const HW = 1.6, HD = 1.0, H = 2.6                 // the block: half width (x), half depth (z), height
const PLINTH_H = 0.12, PLINTH_OUT = 0.08          // projecting stone foot
const CAP_H = 0.1, CAP_OUT = 0.04                 // coping slab
const COURSE = 0.28                               // travertine course height (joint every COURSE)
const PLAQUE_W = 0.62, PLAQUE_H = 0.55, PLAQUE_Y = 1.45, PLAQUE_X = 0.8
const STEP_W = 0.9, STEP_D = 0.5, STEP_H = 0.1    // paved step at the tap face
const BASIN_R = 0.17, BASIN_H = 0.42              // small white basin / bollard by the tap

const STONE: Rgb = hex('#c8c0ab')
const JOINT: Rgb = hex('#a9a18b')
const GREY: Rgb = hex('#8e918f')
const STEEL: Rgb = hex('#9aa0a2')
const WHITE: Rgb = hex('#e6e6e0')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  block(q, -HW - PLINTH_OUT, HW + PLINTH_OUT, -HD - PLINTH_OUT, HD + PLINTH_OUT, y(0), y(PLINTH_H), shade(STONE, 0.9))
  block(q, -HW, HW, -HD, HD, y(PLINTH_H), y(H), STONE)
  // course joints: thin darker bands just proud of the plaque face and the tap face
  for (let h = PLINTH_H + COURSE; h < H - 0.05; h += COURSE) {
    block(q, -HW - 0.004, HW + 0.004, -HD - 0.006, -HD, y(h), y(h + 0.012), JOINT)
    block(q, -HW - 0.006, -HW, -HD, HD, y(h), y(h + 0.012), JOINT)
  }
  block(q, -HW - CAP_OUT, HW + CAP_OUT, -HD - CAP_OUT, HD + CAP_OUT, y(H), y(H + CAP_H), shade(STONE, 1.04))
  plaque(q, { x: PLAQUE_X, z: -HD - 0.001, y0: y(PLAQUE_Y), w: PLAQUE_W, h: PLAQUE_H, panel: GREY, frame: shade(STONE, 0.8), letters: shade(GREY, 1.45), lines: [0.8, 0.5, 0.7, 0.6, 0.4] })
  // tap face: step, small basin, spout and plate
  block(q, -HW - STEP_D, -HW, -STEP_W / 2, STEP_W / 2, y(0), y(STEP_H), shade(STONE, 0.95))
  block(q, -HW - STEP_D * 0.6 - BASIN_R, -HW - STEP_D * 0.6 + BASIN_R, -BASIN_R, BASIN_R, y(STEP_H), y(STEP_H + BASIN_H), WHITE)
  block(q, -HW - 0.12, -HW, -0.06, 0.06, y(1.05), y(1.2), STEEL)
  block(q, -HW - 0.2, -HW - 0.1, -0.025, 0.025, y(1.05), y(1.1), STEEL)
}

export function fontaineSquareLamartine(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
