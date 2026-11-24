import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade, roof } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque, hoop } from './monument-kit.ts'

/*
 * MONUMENT DE L'ASSISTANCE PUBLIQUE (Père-Lachaise, division 2, against the rue du Repos wall; Wikidata Q15155995,
 * 48.85984, 2.39060): the tomb-memorial "Au personnel des hôpitaux de Paris victime du devoir" (built 1911-1930, land
 * conceded 1903). Pale limestone: a wide stele with a taller central pillar (pedimented top, wreath roundel, red
 * inscription, a black bronze wreath hung on it), a name panel either side (17 names) under a cornice, and a tall
 * narrow pylon with a palm-leaf relief at each end; a stone-kerbed flower bed in front. All relief is shallow and the
 * wreath is a ring, so it is all procedural: no Modly piece. Frame: −z the inscribed front, x across, y up from G.
 * Dimensions are estimated by eye from Commons photos (the pillar taken as ~0.9 m wide), not surveyed.
 */
export const HX = 2.0
export const HZ = 1.6

// tunables (metres)
const HW = 1.7, D = 0.2                       // half-width of the stele, half-thickness
const PYL_W = 0.3, PYL_H = 2.35, PYL_D = 0.22 // end pylons
const WING_H = 1.55                           // name-panel wings
const PIL_HW = 0.45, PIL_D = 0.24, PIL_H = 2.95, PED_H = 0.3 // central pillar and pediment
const BASE_H = 0.12, BASE_OUT = 0.12          // plinth course
const BED_D = 1.2, BED_H = 0.14, KERB = 0.1   // flower bed in front
const WREATH_R = 0.36, WREATH_W = 0.07, WREATH_Y = 1.15

const STONE: Rgb = hex('#cfc9ba')
const INSCR: Rgb = hex('#8a857a')
const RED: Rgb = hex('#a8322a')
const BRONZE: Rgb = hex('#26231f')
const SOIL: Rgb = hex('#5b4a3a')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // plinth course under everything
  block(q, -HW - BASE_OUT, HW + BASE_OUT, -D - BASE_OUT, D, y(0), y(BASE_H), shade(STONE, 0.9))
  const y0 = BASE_H
  // wings, panel faces and cornice band
  block(q, -HW, HW, -D, D, y(y0), y(y0 + WING_H), STONE)
  block(q, -HW, HW, -D - 0.04, D, y(y0 + WING_H), y(y0 + WING_H + 0.1), shade(STONE, 1.04))
  block(q, -HW, HW, -D - 0.02, D, y(y0 + 0.05), y(y0 + 0.28), shade(STONE, 0.95))
  for (const s of [-1, 1]) {
    const xc = s * 1.08
    plaque(q, { x: xc, z: -D, y0: y(y0 + 0.4), w: 1.1, h: 0.85, panel: shade(STONE, 0.93), letters: INSCR,
      lines: [0.8, 0.9, 0.7, 0.85, 0.9, 0.75, 0.8, 0.9, 0.7] })
  }
  // end pylons with palm relief
  for (const s of [-1, 1]) {
    const x0 = s * (HW - PYL_W / 2)
    block(q, x0 - PYL_W / 2, x0 + PYL_W / 2, -PYL_D, PYL_D, y(y0), y(y0 + PYL_H), shade(STONE, 1.02))
    block(q, x0 - PYL_W / 2 - 0.02, x0 + PYL_W / 2 + 0.02, -PYL_D - 0.01, PYL_D + 0.01, y(y0 + PYL_H), y(y0 + PYL_H + 0.07), shade(STONE, 1.06))
    block(q, x0 - 0.025, x0 + 0.025, -PYL_D - 0.03, -PYL_D, y(y0 + 0.45), y(y0 + PYL_H - 0.3), INSCR)   // palm stem
    for (let i = 0; i < 6; i++) {
      const yy = y0 + 0.7 + i * 0.22
      block(q, x0 - 0.1, x0 + 0.1, -PYL_D - 0.025, -PYL_D, y(yy), y(yy + 0.05), INSCR)               // fronds
    }
  }
  // central pillar
  block(q, -PIL_HW - 0.05, PIL_HW + 0.05, -PIL_D - 0.04, PIL_D, y(y0), y(y0 + 0.5), shade(STONE, 0.95)) // pillar foot
  block(q, -PIL_HW, PIL_HW, -PIL_D, PIL_D, y(y0 + 0.5), y(y0 + PIL_H), STONE)
  block(q, -PIL_HW - 0.03, PIL_HW + 0.03, -PIL_D - 0.02, PIL_D, y(y0 + PIL_H - 0.12), y(y0 + PIL_H), shade(STONE, 1.05))
  roof(q, -PIL_HW - 0.03, PIL_HW + 0.03, -PIL_D, PIL_D, y(y0 + PIL_H), PED_H, 0, PIL_D - 0.02, shade(STONE, 0.92))
  // roundel under the pediment, red inscription above the wreath
  block(q, -0.17, 0.17, -PIL_D - 0.04, -PIL_D, y(y0 + PIL_H - 0.62), y(y0 + PIL_H - 0.28), shade(STONE, 0.86))
  block(q, -0.09, 0.09, -PIL_D - 0.055, -PIL_D - 0.04, y(y0 + PIL_H - 0.55), y(y0 + PIL_H - 0.35), INSCR)
  plaque(q, { x: 0, z: -PIL_D, y0: y(y0 + 1.7), w: 0.7, h: 0.48, panel: shade(STONE, 0.95), letters: RED, lines: [0.8, 0.9, 0.7, 0.6] })
  // bronze wreath hung on the pillar
  for (const r of [WREATH_R, WREATH_R * 0.86]) hoop(q, [0, y(y0 + WREATH_Y), -PIL_D - 0.06], [0, 0, 1], r, WREATH_W, BRONZE, 18)
  // flower bed with its low stone kerb
  const bx = HW + 0.15
  block(q, -bx, bx, -D - BED_D, -D - BASE_OUT, y(0), y(BED_H - 0.02), SOIL)
  block(q, -bx, bx, -D - BED_D - KERB, -D - BED_D, y(0), y(BED_H), shade(STONE, 0.88))
  for (const s of [-1, 1]) block(q, Math.min(s * bx, s * (bx + KERB)), Math.max(s * bx, s * (bx + KERB)), -D - BED_D - KERB, -D - BASE_OUT, y(0), y(BED_H), shade(STONE, 0.88))
}

export function monumentAssistancePublique(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
