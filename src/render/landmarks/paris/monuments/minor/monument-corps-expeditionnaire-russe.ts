import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LE MONUMENT A LA MEMOIRE DU CORPS EXPEDITIONNAIRE RUSSE (place du Canada, cours la Reine, Paris 8e; Wikidata
 * Q18168657; Vladimir Sourovtsev, 2011): a bronze Russian soldier standing beside his grazing horse, on a low
 * black granite plinth carrying a bronze plaque in French on the long face and a cap band lettered in Russian (the
 * group: Modly `russe-soldat-cheval`, attached in paris-statues.json at GROUP_AT). Frame: −z the plaque face, x along
 * the plinth, y up from the ground (G). Dimensions are scaled by eye off Commons photographs, not surveyed.
 */
export const HX = 2.4
export const HZ = 1.4

// tunables (metres above the ground)
const PL_HW = 1.5, PL_HD = 0.62, PL_H = 0.9           // the granite block
const STEP_OUT = 0.12, STEP_H = 0.1                    // low plinth step under it
const CAP_OUT = 0.05, CAP_H = 0.22                     // lettered cap band
export const GROUP_AT: [number, number, number] = [0, G + STEP_H + PL_H + CAP_H, 0]

const GRANITE: Rgb = hex('#2e3032')
const BRONZE: Rgb = hex('#6b5a3c')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  block(q, -PL_HW - STEP_OUT, PL_HW + STEP_OUT, -PL_HD - STEP_OUT, PL_HD + STEP_OUT, y(0), y(STEP_H), shade(GRANITE, 1.25))
  block(q, -PL_HW, PL_HW, -PL_HD, PL_HD, y(STEP_H), y(STEP_H + PL_H), GRANITE)
  block(q, -PL_HW - CAP_OUT, PL_HW + CAP_OUT, -PL_HD - CAP_OUT, PL_HD + CAP_OUT, y(STEP_H + PL_H), y(STEP_H + PL_H + CAP_H), shade(GRANITE, 1.1))
  // lettered cap band (both long faces) and bronze plaque on the front long face
  for (const s of [-1, 1]) {
    plaque(q, { x: 0, z: s * (PL_HD + CAP_OUT + 0.001), y0: y(STEP_H + PL_H + 0.04), w: 2.6, h: 0.14, panel: shade(GRANITE, 1.1), letters: hex('#7d7f80'), lines: [0.95] })
  }
  plaque(q, { x: 0, z: -PL_HD - 0.001, y0: y(STEP_H + 0.28), w: 1.5, h: 0.5, panel: BRONZE, letters: shade(BRONZE, 0.55), lines: [0.9, 0.85, 0.9, 0.7] })
}

export function monumentCorpsExpeditionnaireRusse(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
