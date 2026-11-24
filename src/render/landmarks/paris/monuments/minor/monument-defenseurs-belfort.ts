import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * MONUMENT A LA MEMOIRE DES DEFENSEURS DE BELFORT 1870-1871 (Père-Lachaise division 54, Wikidata Q94997851, 48.86182,
 * 2.39229; 1911; ~4 m tall per Wikidata). A grey-stone tomb-monument: a low block with a projecting plinth ("A LA MEMOIRE
 * DES DEFENSEURS DE BELFORT", 1870 and 1871 in the corners, a bronze lion relief on the plinth), two wings with arched
 * bronze portrait medallions, and between them a tall pedestal with scrolled cornice carrying a bronze bust of an
 * officer. A bronze allegorical woman stands on the plinth with a laurel branch raised (Modly `belfort-figure`, bust
 * `belfort-buste`, attached in paris-statues.json at FIGURE_AT / BUST_AT). Frame: −z the front, x across, y up from G.
 * Sizes read by eye from Commons "Père-Lachaise - Division 54 - Monument à la mémoire des défenseurs de Belfort 1870-71 01"
 * (about 160 px per metre, taking the 4 m height), not surveyed; the depth is a guess.
 */
export const HX = 1.6
export const HZ = 1.5

// tunables (metres above the ground)
const W = 1.8, D = 0.9, BASE_H = 1.0                  // low block under the wings
const PLINTH_HW = 0.38, PLINTH_OUT = 0.17, PLINTH_H = 1.2   // projecting front plinth (half width, proud of the block, top)
const WING_W = 0.5, WING_D = 0.55, WING_H = 2.25      // each wing: width, depth, top (arch shoulders)
const PED_HW = 0.37, PED_HD = 0.27, PED_H = 3.3       // central pedestal half sizes, top of cornice
const MED_W = 0.34, MED_H = 0.5, MED_Y = 1.3          // bronze medallions on the wings
export const FIGURE_AT: [number, number, number] = [0, G + PLINTH_H, -(D / 2 + PLINTH_OUT) + 0.28]
export const BUST_AT: [number, number, number] = [0, G + PED_H, 0]

const STONE: Rgb = hex('#a9a8a2')
const BRONZE: Rgb = hex('#3f5a4f')
const INSCR: Rgb = hex('#7d7c76')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const zf = -D / 2
  // low block with a stepped foot
  block(q, -W / 2 - 0.1, W / 2 + 0.1, zf - 0.1, D / 2 + 0.1, y(0), y(0.08), shade(STONE, 0.9))
  block(q, -W / 2, W / 2, zf, D / 2, y(0.08), y(BASE_H), STONE)
  block(q, -W / 2 - 0.04, W / 2 + 0.04, zf - 0.04, D / 2 + 0.04, y(BASE_H - 0.07), y(BASE_H), shade(STONE, 1.05))
  // projecting plinth with the inscription and the lion tablet
  block(q, -PLINTH_HW, PLINTH_HW, zf - PLINTH_OUT, zf, y(0.08), y(PLINTH_H), shade(STONE, 1.02))
  block(q, -PLINTH_HW - 0.04, PLINTH_HW + 0.04, zf - PLINTH_OUT - 0.04, zf + 0.02, y(PLINTH_H - 0.08), y(PLINTH_H), shade(STONE, 1.06))
  plaque(q, { x: 0, z: zf - PLINTH_OUT, y0: y(0.62), w: 0.66, h: 0.5, panel: shade(STONE, 0.97), letters: INSCR, lines: [0.5, 0.9, 0.7] })
  // bronze lion tablet (arched top by stepped blocks), low down
  block(q, -0.24, 0.24, zf - PLINTH_OUT - 0.05, zf - PLINTH_OUT, y(0.16), y(0.4), BRONZE)
  block(q, -0.16, 0.16, zf - PLINTH_OUT - 0.05, zf - PLINTH_OUT, y(0.4), y(0.5), BRONZE)
  block(q, -0.17, 0.17, zf - PLINTH_OUT - 0.07, zf - PLINTH_OUT - 0.05, y(0.2), y(0.34), shade(BRONZE, 1.25))   // lion mass
  // year panels in the corners of the front face
  for (const sx of [-1, 1]) {
    block(q, sx * 0.62 - 0.12, sx * 0.62 + 0.12, zf - 0.02, zf, y(0.55), y(0.7), INSCR)
  }
  // wings with arched tops, medallions
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? PED_HW - 0.05 : -(PED_HW - 0.05) - WING_W - 0.3
    const xa = sx > 0 ? PED_HW - 0.05 : -(PED_HW - 0.05) - WING_W
    void x0
    const xb = xa + WING_W
    const zw = -WING_D / 2
    const x1 = Math.max(Math.abs(xa), Math.abs(xb)), xm = sx > 0 ? xa : xb   // inner edge (towards the pedestal)
    void x1
    // wing runs from the pedestal side out to the block edge
    const lo = sx > 0 ? PED_HW - 0.05 : -W / 2 + 0.02, hi = sx > 0 ? W / 2 - 0.02 : -(PED_HW - 0.05)
    void xm
    block(q, lo, hi, zw, WING_D / 2, y(BASE_H), y(WING_H - 0.25), STONE)
    // arched head: two stepped blocks narrower
    block(q, lo + 0.04, hi - 0.04, zw + 0.02, WING_D / 2 - 0.02, y(WING_H - 0.25), y(WING_H - 0.1), shade(STONE, 1.03))
    block(q, lo + 0.1, hi - 0.1, zw + 0.04, WING_D / 2 - 0.04, y(WING_H - 0.1), y(WING_H), shade(STONE, 1.05))
    const cx = (lo + hi) / 2
    block(q, cx - MED_W / 2 - 0.03, cx + MED_W / 2 + 0.03, zw - 0.03, zw, y(MED_Y - 0.03), y(MED_Y + MED_H + 0.03), shade(STONE, 1.08))
    block(q, cx - MED_W / 2, cx + MED_W / 2, zw - 0.045, zw - 0.03, y(MED_Y), y(MED_Y + MED_H), BRONZE)
    block(q, cx - MED_W * 0.3, cx + MED_W * 0.3, zw - 0.055, zw - 0.045, y(MED_Y + MED_H * 0.5), y(MED_Y + MED_H * 0.9), shade(BRONZE, 1.3))   // head relief
  }
  // central pedestal rising between the wings, with a scrolled cornice and an "ET" panel
  block(q, -PED_HW, PED_HW, -PED_HD, PED_HD, y(BASE_H), y(PED_H - 0.15), STONE)
  block(q, -PED_HW - 0.06, PED_HW + 0.06, -PED_HD - 0.06, PED_HD + 0.06, y(PED_H - 0.15), y(PED_H), shade(STONE, 1.06))
  block(q, -0.12, 0.12, -PED_HD - 0.02, -PED_HD, y(2.6), y(2.95), shade(STONE, 0.9))
  for (const sx of [-1, 1]) {
    block(q, sx * (PED_HW + 0.02) - 0.08, sx * (PED_HW + 0.02) + 0.08, -PED_HD - 0.03, PED_HD + 0.03, y(PED_H - 0.45), y(PED_H - 0.2), shade(STONE, 1.04))   // scroll
  }
  // low plinth for the bust
  block(q, -0.2, 0.2, -0.2, 0.2, y(PED_H), y(PED_H + 0.04), shade(STONE, 1.04))
}

export function monumentDefenseursBelfort(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
