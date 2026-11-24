import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * AUX PLUS JEUNES COMBATTANTS VOLONTAIRES DE LA RESISTANCE (Père-Lachaise, division 82; Wikidata Q96117713): a plain
 * grey granite grave, a dark band round its upper edge, with a pale cream-painted wooden-looking cross laid flat on the
 * top slab and a small copper plaque at the cross's head. Read off one Commons photo (Division 82 - Résistance 01);
 * dimensions estimated against the neighbouring tombs. Frame: x across (short side), z along the grave, the cross's
 * foot toward −z, y up from the ground (G).
 */
export const HX = 1.0
export const HZ = 1.4

// tunables (metres)
const HW = 0.55, HL = 1.0                       // half width / half length of the grave
const BASE_H = 0.32, BAND_H = 0.07, SLAB_H = 0.2 // base block, dark band, top slab
const SLAB_OUT = 0.03
const CROSS_T = 0.1, CROSS_LEN = 1.2, CROSS_Z0 = -0.7, ARM_HW = 0.6, ARM_Z = 0.66, CROSS_H = 0.06
const PLAQ_W = 0.5, PLAQ_D = 0.14, PLAQ_Z = 0.72

const GRANITE: Rgb = hex('#a9aaa8')
const BAND: Rgb = hex('#2e2f31')
const CROSS: Rgb = hex('#d9d6a6')
const COPPER: Rgb = hex('#b0603a')
const STONE_HEAD: Rgb = hex('#9a9b99')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  block(q, -HW, HW, -HL, HL, y(0), y(BASE_H), shade(GRANITE, 0.9))
  block(q, -HW - SLAB_OUT, HW + SLAB_OUT, -HL - SLAB_OUT, HL + SLAB_OUT, y(BASE_H), y(BASE_H + BAND_H), BAND)
  const top = BASE_H + BAND_H + SLAB_H
  block(q, -HW - SLAB_OUT, HW + SLAB_OUT, -HL - SLAB_OUT, HL + SLAB_OUT, y(BASE_H + BAND_H), y(top), GRANITE)
  // low headstone block at the head end carrying the plaque
  block(q, -0.3, 0.3, HL - 0.2, HL, y(top), y(top + 0.2), STONE_HEAD)
  block(q, -PLAQ_W / 2, PLAQ_W / 2, PLAQ_Z - PLAQ_D / 2, PLAQ_Z + PLAQ_D / 2, y(top), y(top + 0.015), COPPER)
  // the cross lying flat: long beam, cross-arm
  block(q, -CROSS_T / 2, CROSS_T / 2, CROSS_Z0, CROSS_Z0 + CROSS_LEN, y(top), y(top + CROSS_H), CROSS)
  block(q, -ARM_HW, ARM_HW, CROSS_Z0 + ARM_Z - CROSS_T / 2, CROSS_Z0 + ARM_Z + CROSS_T / 2, y(top), y(top + CROSS_H), CROSS)
}

export function monumentJeunesResistants(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
