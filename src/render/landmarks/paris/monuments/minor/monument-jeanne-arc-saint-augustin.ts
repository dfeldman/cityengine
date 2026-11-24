import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * JEANNE D'ARC (place Saint-Augustin, Paris 8e; Paul Dubois, bronze 1896): the rearing-horse equestrian bronze on a tall
 * limestone pedestal, a stepped socle, a die with the inscription JEANNE D'ARC 1412-1431 on its long side, and a deep
 * moulded cornice. The horse and rider are the Modly piece `jeanne-augustin-equestre` (paris-statues.json, attached at
 * STATUE_AT). Frame: x along the horse (its head toward +x), z across, −z the inscribed face, y up from the ground (G).
 * Dimensions are estimated off Commons photographs against the plaza, not surveyed.
 */
export const HX = 2.6
export const HZ = 1.6

// tunables (metres above the ground / half-extents)
const SOCLE: [number, number][] = [[0.18, 0.2], [0.1, 0.2]]  // [outset beyond the die base, height] per step, widest first
const BASE_HW = 1.55, BASE_HD = 0.78, BASE_H = 0.35         // moulded foot of the die
const DIE_HW = 1.4, DIE_HD = 0.65, DIE_H = 1.75             // the plain die
const COR: [number, number][] = [[0.06, 0.1], [0.14, 0.14], [0.24, 0.14]]  // cornice courses: outset beyond the die, height
const CAP_H = 0.12                                          // flat top slab the bronze plinth sits on
export const STATUE_AT: [number, number, number] = [0, 0, 0]  // set below from the stack

const STONE: Rgb = hex('#cfc8b6')

function stack(): { top: number } {
  let y = SOCLE.reduce((s, [, h]) => s + h, 0) + BASE_H + DIE_H + COR.reduce((s, [, h]) => s + h, 0) + CAP_H
  return { top: y }
}
STATUE_AT[1] = G + stack().top

function draw(q: MeshBuilder): void {
  let y = G
  SOCLE.forEach(([o, h], i) => {
    block(q, -BASE_HW - o - 0.1, BASE_HW + o + 0.1, -BASE_HD - o - 0.1, BASE_HD + o + 0.1, y, y + h, shade(STONE, 0.9 - 0.02 * (SOCLE.length - 1 - i)))
    y += h
  })
  block(q, -BASE_HW, BASE_HW, -BASE_HD, BASE_HD, y, y + BASE_H, shade(STONE, 0.95))
  block(q, -BASE_HW + 0.08, BASE_HW - 0.08, -BASE_HD + 0.08, BASE_HD - 0.08, y + BASE_H * 0.6, y + BASE_H, shade(STONE, 1.03))
  y += BASE_H
  block(q, -DIE_HW, DIE_HW, -DIE_HD, DIE_HD, y, y + DIE_H, STONE)
  // inscription panel on the long −z face
  plaque(q, { x: 0, z: -DIE_HD, y0: y + DIE_H * 0.5, w: 1.5, h: 0.55, panel: shade(STONE, 1.04), letters: shade(STONE, 0.5), lines: [0.9, 0.55] })
  y += DIE_H
  COR.forEach(([o, h], i) => {
    block(q, -DIE_HW - o, DIE_HW + o, -DIE_HD - o, DIE_HD + o, y, y + h, shade(STONE, 1.02 - 0.03 * (COR.length - 1 - i)))
    y += h
  })
  const o = COR[COR.length - 1][0] - 0.1
  block(q, -DIE_HW - o, DIE_HW + o, -DIE_HD - o, DIE_HD + o, y, y + CAP_H, shade(STONE, 0.92))
}

export function monumentJeanneArcSaintAugustin(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
