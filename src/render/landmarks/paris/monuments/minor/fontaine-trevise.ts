import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { fountainBowl, jetRing } from './monument-kit.ts'

/*
 * THE FONTAINE DE TRÉVISE (cité de Trévise, Paris 9e; cast iron, mid-19th c.; no Wikidata id): in the middle of the cité's
 * railed garden, a dark-green cast-iron fountain standing straight on the gravel (no pool): a square plinth, a scrolled
 * pedestal (acanthus volutes at the corners), a wide shallow bowl with a moulded, ribbed rim, a small square die, three
 * women standing back to back (a Modly model: statues manifest trevise-graces) holding up a small second bowl that spills
 * into the wide one. The cité was a private gated close until the 1950s, public since 1983, so it can be ridden into.
 * Sizes read off six Commons photos (Fontaine Trévise - Paris IX (FR75) - 2025-04-21 - 1..6) against the ~1.4 m women
 * and the shutters/balconies behind, total height ~5 m, bowl ~3.2 m across: estimated, not surveyed.
 * Frame: centre of the fountain, y up with the gravel at G; the entry's front is arbitrary (the group is round).
 */
export const R = 2.0

// tunables
const PLINTH = 0.85          // half-width of the square plinth
const PLINTH_H = 0.55
const STEM_R0 = 0.62         // the pedestal's waist radius at the plinth
const STEM_R1 = 0.42
const STEM_H = 1.0           // height of the pedestal above the plinth
const BOWL_R = 1.6
const BOWL_D = 0.62
const DIE = 0.42             // half-width of the small die under the women
const DIE_H = 0.62
const TOP_R = 0.8            // the small bowl
const TOP_D = 0.42
const JETS = 14

const IRON: Rgb = hex('#2f3b37')
const TRIM: Rgb = hex('#3b4742')
const WATER: Rgb = hex('#6d8f98')
const FALL: Rgb = hex('#c4d8dc')

/** where the women stand (landmark frame, y above the base): for the statues manifest */
export const GROUP_Y = G + PLINTH_H + STEM_H - 0.05 + BOWL_D * 0.5 + DIE_H
export const GROUP_H = 1.45
export const TOP_Y = GROUP_Y + GROUP_H - 0.1

function draw(q: MeshBuilder): void {
  const y0 = G
  // square plinth with a stepped foot and a cornice
  block(q, -PLINTH - 0.1, PLINTH + 0.1, -PLINTH - 0.1, PLINTH + 0.1, y0, y0 + 0.14, shade(IRON, 0.9))
  block(q, -PLINTH, PLINTH, -PLINTH, PLINTH, y0 + 0.14, y0 + PLINTH_H - 0.1, IRON)
  block(q, -PLINTH - 0.06, PLINTH + 0.06, -PLINTH - 0.06, PLINTH + 0.06, y0 + PLINTH_H - 0.1, y0 + PLINTH_H, TRIM)
  // the pedestal: a waisted stem, volutes at the four corners flaring up from the plinth
  const yp = y0 + PLINTH_H
  lathe(q, 0, 0, [[STEM_R0, yp], [STEM_R1, yp + STEM_H * 0.45], [STEM_R1 * 0.95, yp + STEM_H * 0.8], [STEM_R1 * 1.35, yp + STEM_H]], 14, IRON)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    const ca = Math.sin(a), sa = Math.cos(a)
    for (let k = 0; k < 4; k++) {
      const t = k / 3
      const rr = 0.78 - t * 0.38
      prism(q, ca * rr, sa * rr, yp + 0.05 + t * STEM_H * 0.62, yp + 0.05 + t * STEM_H * 0.62 + 0.2, 0.16 - t * 0.05, 6, TRIM, undefined, 0.16 - t * 0.05, true)
    }
  }
  // the wide shallow bowl, its water just under the rim
  const rim = fountainBowl(q, 0, 0, yp + STEM_H - 0.05, BOWL_R, { depth: BOWL_D, stem: STEM_R1 * 1.35, body: IRON, water: WATER })
  // the die under the women: a plinth, a panelled block, a cornice
  const yd = rim - BOWL_D * 0.5 + 0.0
  const yv = yd
  block(q, -DIE - 0.1, DIE + 0.1, -DIE - 0.1, DIE + 0.1, yv, yv + 0.12, TRIM)
  block(q, -DIE, DIE, -DIE, DIE, yv + 0.12, yv + DIE_H - 0.1, IRON)
  block(q, -DIE - 0.08, DIE + 0.08, -DIE - 0.08, DIE + 0.08, yv + DIE_H - 0.1, yv + DIE_H, TRIM)
  // the small upper bowl, on the women's raised hands
  const ty = TOP_Y
  const trim = fountainBowl(q, 0, 0, ty, TOP_R, { depth: TOP_D, stem: 0.2, body: IRON, water: WATER })
  lathe(q, 0, 0, [[0.06, trim - 0.05], [0.1, trim + 0.2], [0.03, trim + 0.5]], 8, TRIM)
  // water spilling from the small bowl's rim into the wide one
  jetRing(q, 0, 0, JETS, TOP_R * 0.95, trim - 0.12, BOWL_R * 0.8, rim - 0.1, { rise: 0.25, c: FALL, phase: 0.1 })
}

export function fontaineTrevise(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, R, R, draw)
}
