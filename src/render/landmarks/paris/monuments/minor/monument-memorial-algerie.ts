import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * MÉMORIAL NATIONAL DE LA GUERRE D'ALGÉRIE ET DES COMBATS DU MAROC ET DE LA TUNISIE (quai Branly, Paris 7e; Wikidata
 * Q3333171; Gérard Collin-Thiébaut, 2002): three slim pale columns 5.85 m high in a row, each with a dark vertical display
 * strip on both broad faces scrolling names in blue, white and red. All structure, so procedural; the displays are bright
 * flat panels with a few lit glyph dashes. Frame: columns in a row along x (row axis = the OSM way's long axis), displays
 * facing ±z, y up from the ground (G). Heights are written (5.85 m); widths and spacing are read off a Commons photograph.
 */
export const HX = 9.15
export const HZ = 5.35

// tunables (metres)
const COL_H = 5.85, COL_W = 0.85, COL_D = 0.42           // each column: width across the display face, depth
const SPACING = 2.7                                      // centre to centre
const FOOT_H = 0.1, FOOT_OUT = 0.08                      // thin foot under each column
const STRIP_W = 0.34, STRIP_Y0 = 0.35, STRIP_Y1 = 5.7, STRIP_IN = 0.012 // display strip
const PAVE_HX = 6.2, PAVE_HZ = 2.6, PAVE_H = 0.04        // pale paved apron
const GLYPH_STEP = 0.2                                   // pitch of the lit name dashes
const STONE: Rgb = hex('#d9d6cc')
const SCREEN: Rgb = hex('#0c0d12')
const LIT: Rgb[] = [hex('#2f6bff'), hex('#f2f2ee'), hex('#ee2a2f')] // blue, white, red

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  block(q, -PAVE_HX, PAVE_HX, -PAVE_HZ, PAVE_HZ, y(0), y(PAVE_H), hex('#c4c0b4'))
  for (let i = 0; i < 3; i++) {
    const cx = (i - 1) * SPACING
    const lit = LIT[i]
    block(q, cx - COL_W / 2 - FOOT_OUT, cx + COL_W / 2 + FOOT_OUT, -COL_D / 2 - FOOT_OUT, COL_D / 2 + FOOT_OUT, y(PAVE_H), y(PAVE_H + FOOT_H), shade(STONE, 0.9))
    block(q, cx - COL_W / 2, cx + COL_W / 2, -COL_D / 2, COL_D / 2, y(PAVE_H + FOOT_H), y(COL_H), STONE)
    for (const s of [-1, 1]) {
      const z0 = s < 0 ? -COL_D / 2 - STRIP_IN : COL_D / 2
      const z1 = s < 0 ? -COL_D / 2 : COL_D / 2 + STRIP_IN
      block(q, cx - STRIP_W / 2, cx + STRIP_W / 2, z0, z1, y(STRIP_Y0), y(STRIP_Y1), i === 1 ? shade(SCREEN, 2) : shade(lit, 0.22))
      // scrolling names: short lit dashes of varying length down the strip
      const zl0 = s < 0 ? z0 - 0.006 : z1
      const zl1 = s < 0 ? z0 : z1 + 0.006
      for (let k = 0, v = STRIP_Y1 - 0.15; v > STRIP_Y0 + 0.1; k++, v -= GLYPH_STEP) {
        const run = 0.06 + 0.1 * ((k * 7 + i * 3) % 5) / 4
        if (k % 6 === 5) { v -= GLYPH_STEP * 0.6; continue } // gap between names
        block(q, cx - STRIP_W * 0.3, cx + STRIP_W * 0.3, zl0, zl1, v - run, v, lit)
      }
    }
  }
  // the engraved dedication in the ground in front of the columns
  block(q, -1.8, 1.8, -PAVE_HZ + 0.5, -PAVE_HZ + 1.4, y(PAVE_H), y(PAVE_H + 0.006), shade(STONE, 0.8))
}

export function monumentMemorialAlgerie(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
