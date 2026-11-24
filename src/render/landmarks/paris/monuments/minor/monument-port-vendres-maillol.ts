import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * MONUMENT AUX MORTS DE PORT-VENDRES (cast of Maillol's reclining figure, Jardin du Carrousel / Tuileries, 1er): a low
 * granite block under the bronze (Modly `port-vendres-maillol-figure`, attached in paris-statues.json at STATUE_AT).
 * Frame: −z the long front, x along it, y up from the ground (G). Sizes scaled by eye off Commons photos, not surveyed.
 */
export const HX = 1.6
export const HZ = 1.2

// tunables (metres)
const BLK_HW = 1.0, BLK_HD = 0.5, BLK_H = 0.85      // the granite block
const FOOT_H = 0.1, FOOT_OUT = 0.08                    // darker footing course
export const STATUE_AT: [number, number, number] = [0, G + BLK_H, 0]

const GRANITE: Rgb = hex('#6f6c68')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  block(q, -BLK_HW - FOOT_OUT, BLK_HW + FOOT_OUT, -BLK_HD - FOOT_OUT, BLK_HD + FOOT_OUT, y(0), y(FOOT_H), shade(GRANITE, 0.85))
  block(q, -BLK_HW, BLK_HW, -BLK_HD, BLK_HD, y(FOOT_H), y(BLK_H), GRANITE)
  block(q, -BLK_HW - 0.02, BLK_HW + 0.02, -BLK_HD - 0.02, BLK_HD + 0.02, y(BLK_H - 0.08), y(BLK_H), shade(GRANITE, 1.08))
}

export function monumentPortVendresMaillol(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
