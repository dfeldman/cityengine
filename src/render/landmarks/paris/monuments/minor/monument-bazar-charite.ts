import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, hex, shade, roof } from '../../../kit.ts'
import { FIXED } from '../common.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * MONUMENT AUX VICTIMES NON RECONNUES DE L'INCENDIE DU BAZAR DE LA CHARITÉ (Père-Lachaise, division 92; Wikidata
 * Q29650332, 48.86098, 2.39676; 1899, offered by the City of Paris): a grey-stone pedestal on two dark granite steps: a
 * moulded round shaft with a leaf collar, a square abacus carrying a die lettered LA VILLE DE PARIS, and a little gabled
 * top whose front tympanum bears the inscription "Aux victimes non reconnues de l'incendie du Bazar de la Charité,
 * 4 mai 1897". Nothing in the round, so no Modly piece. Frame: −z the inscribed front, x across, y up from G. Dimensions
 * are estimated by eye from two Commons photographs (the Wikidata width is 2 m, taken as the step), not surveyed.
 */
export const HX = 1.3
export const HZ = 1.2

// tunables (metres above the ground)
const STEP1_HW = 0.98, STEP1_HD = 0.88, STEP_H = 0.16     // lower granite step
const STEP2_HW = 0.8, STEP2_HD = 0.7                       // upper step
const PL_HW = 0.6, PL_HD = 0.52, PL_H = 0.3                // square plinth block
const FOOT_R = 0.46, FOOT_H = 0.16                         // moulded foot of the shaft
const SHAFT_R = 0.36, SHAFT_H = 0.78                       // round shaft
const COLLAR_R = 0.5, COLLAR_H = 0.14                      // leaf collar flaring under the abacus
const ABAC_HW = 0.62, ABAC_HD = 0.5, ABAC_H = 0.1          // abacus slab
const DIE_HW = 0.5, DIE_HD = 0.4, DIE_H = 0.62             // die with LA VILLE DE PARIS
const GABLE_H = 0.5                                        // pitched top

const STONE: Rgb = hex('#9e9a90')
const GRANITE: Rgb = hex('#4a4a4a')
const PANEL: Rgb = hex('#aaa699')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  let h = 0
  block(q, -STEP1_HW, STEP1_HW, -STEP1_HD, STEP1_HD, y(h), y(h + STEP_H), GRANITE); h += STEP_H
  block(q, -STEP2_HW, STEP2_HW, -STEP2_HD, STEP2_HD, y(h), y(h + STEP_H), shade(GRANITE, 1.08)); h += STEP_H
  block(q, -PL_HW, PL_HW, -PL_HD, PL_HD, y(h), y(h + PL_H), shade(STONE, 0.95)); h += PL_H
  prism(q, 0, 0, y(h), y(h + FOOT_H), FOOT_R, 16, shade(STONE, 0.92), FIXED, SHAFT_R * 1.04, true); h += FOOT_H
  prism(q, 0, 0, y(h), y(h + SHAFT_H), SHAFT_R, 16, STONE, FIXED, SHAFT_R * 0.97, true); h += SHAFT_H
  prism(q, 0, 0, y(h), y(h + COLLAR_H), SHAFT_R * 0.97, 16, shade(STONE, 1.05), FIXED, COLLAR_R, true); h += COLLAR_H
  block(q, -ABAC_HW, ABAC_HW, -ABAC_HD, ABAC_HD, y(h), y(h + ABAC_H), shade(STONE, 0.9)); h += ABAC_H
  block(q, -DIE_HW, DIE_HW, -DIE_HD, DIE_HD, y(h), y(h + DIE_H), STONE)
  // "LA VILLE DE PARIS" band low on the die's front
  plaque(q, { x: 0, z: -DIE_HD - 0.001, y0: y(h + 0.06), w: DIE_HW * 1.5, h: 0.14, panel: shade(STONE, 1.0), letters: shade(STONE, 0.5), lines: [0.8] })
  h += DIE_H
  // gabled top: ridge along z, tympanum facing −z with the inscription
  roof(q, -DIE_HW, DIE_HW, -DIE_HD, DIE_HD, y(h), GABLE_H, DIE_HW, 0, shade(STONE, 0.9))
  plaque(q, { x: 0, z: -DIE_HD - 0.001, y0: y(h + 0.02), w: 0.34, h: 0.22, panel: PANEL, letters: shade(STONE, 0.45), lines: [0.5, 0.8, 0.7, 0.6, 0.5] })
}

export function monumentBazarCharite(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
