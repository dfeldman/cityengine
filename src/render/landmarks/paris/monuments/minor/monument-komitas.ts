import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LE MONUMENT A KOMITAS (Cours Albert-1er, Paris 8e/16e; Wikidata Q3323366; David Erevantsi, 2003): a standing bronze
 * Komitas, robe falling in one straight sheet, on a plain limestone cube with the inscription on its front, a thin dark
 * plinth plate between (the figure: Modly `komitas-statue`, attached in paris-statues.json at STATUE_AT). Frame: −z the
 * inscribed front, x across, y up from the ground (G). Dimensions are scaled by eye off Commons photographs, not surveyed.
 */
export const HX = 1.6
export const HZ = 1.4

// tunables (metres above the ground)
const PED_HW = 0.8, PED_HD = 0.7, PED_H = 1.5          // the limestone cube
const SOCLE_H = 0.12, SOCLE_OUT = 0.1                    // plinth step under the cube
const PLATE_H = 0.08, PLATE_HW = 0.62, PLATE_HD = 0.55   // dark bronze-coloured plate under the statue
export const STATUE_AT: [number, number, number] = [0, G + SOCLE_H + PED_H + PLATE_H, 0]

const STONE: Rgb = hex('#c9c2b0')
const DARK: Rgb = hex('#3a3b3a')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  block(q, -PED_HW - SOCLE_OUT, PED_HW + SOCLE_OUT, -PED_HD - SOCLE_OUT, PED_HD + SOCLE_OUT, y(0), y(SOCLE_H), shade(STONE, 0.92))
  block(q, -PED_HW, PED_HW, -PED_HD, PED_HD, y(SOCLE_H), y(SOCLE_H + PED_H), STONE)
  // weathering band under the top edge
  block(q, -PED_HW - 0.02, PED_HW + 0.02, -PED_HD - 0.02, PED_HD + 0.02, y(SOCLE_H + PED_H - 0.1), y(SOCLE_H + PED_H), shade(STONE, 0.88))
  block(q, -PLATE_HW, PLATE_HW, -PLATE_HD, PLATE_HD, y(SOCLE_H + PED_H), y(SOCLE_H + PED_H + PLATE_H), DARK)
  plaque(q, { x: 0, z: -PED_HD - 0.001, y0: y(SOCLE_H + 0.45), w: 1.1, h: 0.7, panel: shade(STONE, 1.03), letters: shade(STONE, 0.5), lines: [0.5, 0.4, 0.85, 0.3, 0.5, 0.6, 0.8] })
}

export function monumentKomitas(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
