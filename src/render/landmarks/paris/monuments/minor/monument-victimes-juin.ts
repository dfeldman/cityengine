import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade, roof } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * MONUMENT AUX VICTIMES DE JUIN (Père-Lachaise, division 6, chemin de Lesseps; Wikidata Q15156018, 48.85908, 2.39373):
 * the City of Paris's tomb-stele for the dead of the June 1832 rising (Commons "Division 6 - Monument aux victimes de
 * juin 01/02"). Pale limestone: a rock-faced two-step plinth, a tall panel carrying three columns of names under three
 * wreath medallions, a dedication band "Aux victimes de juin, la Ville de Paris reconnaissante", then a die with a
 * shallow wreath-and-eagle relief over "Liberté, ordre public", and a cornice with a low gable and corner acroteria.
 * The relief is shallow, so it stays procedural: no Modly piece. Frame: −z the inscribed front, x across, y up from G.
 * Dimensions are estimated by eye from the photographs against the 1.6 m panel width guess, not surveyed.
 */
export const HX = 1.6
export const HZ = 1.5

// tunables (metres)
const PLINTH1_HW = 1.1, PLINTH1_HD = 0.62, PLINTH1_H = 0.3  // lower rock-faced step
const PLINTH2_HW = 1.0, PLINTH2_HD = 0.55, PLINTH2_H = 0.5  // upper rock-faced block
const PANEL_HW = 0.82, PANEL_HD = 0.4, PANEL_H = 2.1        // name panel
const BAND_HW = 0.88, BAND_HD = 0.45, BAND_H = 0.22         // dedication band
const DIE_HW = 0.7, DIE_HD = 0.34, DIE_H = 1.15             // relief die
const CORN_HW = 0.78, CORN_HD = 0.4, CORN_H = 0.14          // top cornice
const GABLE_H = 0.2                                         // low pediment
const ACRO = 0.12                                           // corner acroteria size
const COLS = 3, MEDAL = 0.17                                // name columns, medallion half-size

const STONE: Rgb = hex('#c8c3b6')
const ROCK: Rgb = hex('#a39e92')
const INSCR: Rgb = hex('#9a9588')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  let h = 0
  block(q, -PLINTH1_HW, PLINTH1_HW, -PLINTH1_HD, PLINTH1_HD, y(h), y(h + PLINTH1_H), shade(ROCK, 0.92)); h += PLINTH1_H
  block(q, -PLINTH2_HW, PLINTH2_HW, -PLINTH2_HD, PLINTH2_HD, y(h), y(h + PLINTH2_H), ROCK)
  // rock-faced roughness: a few proud blocks on the front of the upper plinth
  for (let i = 0; i < 6; i++) {
    const x0 = -PLINTH2_HW + 0.12 + i * 0.33
    block(q, x0, x0 + 0.22, -PLINTH2_HD - 0.03, -PLINTH2_HD, y(h + 0.08 + (i % 2) * 0.18), y(h + 0.22 + (i % 2) * 0.18), shade(ROCK, 1.06))
  }
  h += PLINTH2_H
  // name panel with its column grooves, name blocks and wreath medallions
  block(q, -PANEL_HW, PANEL_HW, -PANEL_HD, PANEL_HD, y(h), y(h + PANEL_H), STONE)
  const colW = (2 * PANEL_HW) / COLS
  for (let c = 0; c < COLS; c++) {
    const xc = -PANEL_HW + colW * (c + 0.5)
    plaque(q, { x: xc, z: -PANEL_HD, y0: y(h + 0.1), w: colW * 0.8, h: PANEL_H - 0.55, panel: shade(STONE, 0.97), letters: INSCR, lines: [0.9, 0.8, 0.9, 0.7, 0.9, 0.85, 0.8, 0.9, 0.7, 0.9, 0.8, 0.85, 0.9, 0.7] })
    block(q, xc - MEDAL, xc + MEDAL, -PANEL_HD - 0.05, -PANEL_HD, y(h + PANEL_H - 0.2 - 2 * MEDAL), y(h + PANEL_H - 0.2), shade(STONE, 0.88))
    block(q, xc - MEDAL * 0.55, xc + MEDAL * 0.55, -PANEL_HD - 0.075, -PANEL_HD - 0.05, y(h + PANEL_H - 0.2 - 1.55 * MEDAL), y(h + PANEL_H - 0.2 - 0.45 * MEDAL), INSCR)
    if (c > 0) block(q, -PANEL_HW + colW * c - 0.01, -PANEL_HW + colW * c + 0.01, -PANEL_HD - 0.02, -PANEL_HD, y(h + 0.08), y(h + PANEL_H - 0.45), shade(STONE, 0.8))
  }
  h += PANEL_H
  // dedication band
  block(q, -BAND_HW, BAND_HW, -BAND_HD, BAND_HD, y(h), y(h + BAND_H), shade(STONE, 1.03))
  plaque(q, { x: 0, z: -BAND_HD, y0: y(h + 0.04), w: BAND_HW * 1.7, h: BAND_H - 0.08, panel: shade(STONE, 0.95), letters: INSCR, lines: [0.9, 0.8] })
  h += BAND_H
  // die: wreath-and-eagle relief panel over the motto
  block(q, -DIE_HW, DIE_HW, -DIE_HD, DIE_HD, y(h), y(h + DIE_H), STONE)
  plaque(q, { x: 0, z: -DIE_HD, y0: y(h + 0.05), w: 0.9, h: 0.14, panel: shade(STONE, 0.95), letters: INSCR, lines: [0.7] })
  const ry = h + 0.25, rh = DIE_H - 0.4
  block(q, -0.5, 0.5, -DIE_HD - 0.03, -DIE_HD, y(ry), y(ry + rh), shade(STONE, 0.94))         // relief field
  block(q, -0.07, 0.07, -DIE_HD - 0.06, -DIE_HD - 0.03, y(ry + rh * 0.3), y(ry + rh * 0.78), INSCR) // the eagle
  block(q, -0.3, 0.3, -DIE_HD - 0.055, -DIE_HD - 0.03, y(ry + rh * 0.5), y(ry + rh * 0.62), INSCR)  // spread wings
  block(q, -0.42, -0.34, -DIE_HD - 0.05, -DIE_HD - 0.03, y(ry + 0.05), y(ry + rh - 0.05), INSCR)     // wreath, left arm
  block(q, 0.34, 0.42, -DIE_HD - 0.05, -DIE_HD - 0.03, y(ry + 0.05), y(ry + rh - 0.05), INSCR)       // wreath, right arm
  h += DIE_H
  // cornice, low gable (ridge along z), corner acroteria
  block(q, -CORN_HW, CORN_HW, -CORN_HD, CORN_HD, y(h), y(h + CORN_H), shade(STONE, 1.04)); h += CORN_H
  roof(q, -CORN_HW + 0.04, CORN_HW - 0.04, -CORN_HD + 0.04, CORN_HD - 0.04, y(h), GABLE_H, CORN_HW - 0.04, 0, shade(STONE, 0.92))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = sx * (CORN_HW - ACRO / 2), cz = sz * (CORN_HD - ACRO / 2)
    block(q, cx - ACRO / 2, cx + ACRO / 2, cz - ACRO / 2, cz + ACRO / 2, y(h), y(h + ACRO * 1.2), STONE)
  }
}

export function monumentVictimesJuin(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
