import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LE MONUMENT AUX VICTIMES DE L'OPERA-COMIQUE (Père-Lachaise, division 96; Wikidata Q15156006; 1888): the common grave
 * of the unidentified dead of the fire of 25 May 1887, read off Commons photos (Père-Lachaise - Division 96 - Opéra-Comique
 * 01/03): two broad grey stone steps (a ledger-like tomb) with a thick round-shouldered stele on the back, its face
 * inscribed. No sculpture. Frame: −z the inscribed front, x across, y up from the ground (G). Sizes scaled by eye.
 */
export const HX = 1.7
export const HZ = 1.7

// tunables (metres)
const STEP1_HW = 1.45, STEP1_HD = 1.35, STEP1_H = 0.3     // lower, wider step
const STEP2_HW = 1.2, STEP2_HD = 1.0, STEP2_H = 0.3       // upper step (the tomb slab)
const STELE_HW = 0.5, STELE_T = 0.2, STELE_H = 1.35       // stele: half-width, thickness, height above step 2
const SHOULDER = 0.28                                       // height of the rounded head (stepped in 4 slices)
const STELE_Z = 0.55                                        // stele centre behind the tomb centre

const STONE: Rgb = hex('#9a9a94')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  block(q, -STEP1_HW, STEP1_HW, -STEP1_HD, STEP1_HD, y(0), y(STEP1_H), shade(STONE, 0.95))
  block(q, -STEP2_HW, STEP2_HW, -STEP2_HD, STEP2_HD, y(STEP1_H), y(STEP1_H + STEP2_H), STONE)
  const y0 = STEP1_H + STEP2_H
  const body = STELE_H - SHOULDER
  block(q, -STELE_HW, STELE_HW, STELE_Z - STELE_T, STELE_Z + STELE_T, y(y0), y(y0 + body), shade(STONE, 1.04))
  // rounded head approximated by 4 narrowing slices
  for (let i = 0; i < 4; i++) {
    const a = (i + 0.5) / 4
    const hw = STELE_HW * Math.sqrt(1 - a * a * 0.85)
    block(q, -hw, hw, STELE_Z - STELE_T, STELE_Z + STELE_T, y(y0 + body + (SHOULDER * i) / 4), y(y0 + body + (SHOULDER * (i + 1)) / 4), shade(STONE, 1.04))
  }
  plaque(q, { x: 0, z: STELE_Z - STELE_T - 0.001, y0: y(y0 + 0.35), w: 0.78, h: 0.75, panel: shade(STONE, 0.9), letters: shade(STONE, 0.55), lines: [0.4, 0.7, 0.9, 0.6, 0.8, 0.5] })
}

export function monumentVictimesOperaComique(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
