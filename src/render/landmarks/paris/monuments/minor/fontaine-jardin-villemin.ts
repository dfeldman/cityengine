import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * LA FONTAINE DU JARDIN VILLEMIN (Wikidata Q3076294; Marie-Auguste Martin, cast at the Val d'Osne 1846; moved here from
 * the rue du Faubourg-Saint-Martin in the 1970s; monument historique 1970): a human-sized, dark-green cast-iron fountain on
 * a rectangular moulded plinth, set on a footing of pale slabs beside a path of the jardin Villemin. The plinth, the
 * footing and the arms-of-Paris panels are procedural; the two tritons, the shell-edged bowl and the child with dolphins
 * above are one Modly piece (`villemin-fontaine`, placed at GROUP_AT). The mascaron spouts run only on a push-button, so
 * no water is drawn. Frame: −z the front (the face with the push-button), x across, y up from the ground (G). Sizes are
 * scaled off Commons photographs against a lamp post and the child (about 2.0 m in all), not surveyed.
 */
export const HX = 1.0
export const HZ = 0.8

// tunables (metres above the ground)
const FOOT_HX = 0.78, FOOT_HZ = 0.62, FOOT_H = 0.08          // the pale stone footing slabs
const BASE_HX = 0.53, BASE_HZ = 0.42, BASE_H = 0.12           // the splayed foot of the plinth
const DIE_HX = 0.47, DIE_HZ = 0.36                            // the plinth die
const CAP_HX = 0.52, CAP_HZ = 0.41, CAP_H = 0.07              // the cornice
const PLINTH_H = 0.62                                         // top of the plinth above the ground

export const GROUP_AT: [number, number, number] = [0, G + PLINTH_H, 0]

const IRON: Rgb = hex('#2d4538')
const STONE: Rgb = hex('#cfcabc')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // pale footing: two slabs with a dark joint between (the real one has a gap at the front)
  block(q, -FOOT_HX, -0.04, -FOOT_HZ, FOOT_HZ, y(0), y(FOOT_H), STONE)
  block(q, 0.04, FOOT_HX, -FOOT_HZ, FOOT_HZ, y(0), y(FOOT_H), shade(STONE, 0.96))
  block(q, -0.04, 0.04, -FOOT_HZ, FOOT_HZ, y(0), y(FOOT_H * 0.7), shade(STONE, 0.4))
  // plinth: foot, die, cornice
  block(q, -BASE_HX, BASE_HX, -BASE_HZ, BASE_HZ, y(FOOT_H), y(FOOT_H + BASE_H), shade(IRON, 0.9))
  block(q, -DIE_HX, DIE_HX, -DIE_HZ, DIE_HZ, y(FOOT_H + BASE_H), y(PLINTH_H - CAP_H), IRON)
  block(q, -CAP_HX, CAP_HX, -CAP_HZ, CAP_HZ, y(PLINTH_H - CAP_H), y(PLINTH_H), shade(IRON, 1.08))
  // the panels: a raised frame on each face, a mascaron boss in the middle, the push-button on the front
  const pw = 0.3, py0 = FOOT_H + BASE_H + 0.06, py1 = PLINTH_H - CAP_H - 0.06
  for (const s of [-1, 1]) {
    block(q, -pw, pw, s * DIE_HZ - (s < 0 ? 0.02 : 0), s * DIE_HZ + (s > 0 ? 0.02 : 0), y(py0), y(py1), shade(IRON, 1.12))
    block(q, -0.1, 0.1, s * (DIE_HZ + 0.02) - (s < 0 ? 0.03 : 0), s * (DIE_HZ + 0.02) + (s > 0 ? 0.03 : 0), y(py0 + 0.1), y(py1 - 0.07), shade(IRON, 1.3))
  }
  for (const s of [-1, 1]) block(q, s * DIE_HX - (s < 0 ? 0.02 : 0), s * DIE_HX + (s > 0 ? 0.02 : 0), -0.22, 0.22, y(py0), y(py1), shade(IRON, 1.12))
  block(q, 0.2, 0.23, -DIE_HZ - 0.03, -DIE_HZ, y(0.4), y(0.43), hex('#b8a45a'))   // the push-button
}

export function fontaineJardinVillemin(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
