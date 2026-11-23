import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LE CÉNOTAPHE DE BAUDELAIRE (cimetière du Montparnasse, division 27, at the end of the avenue Transversale against the
 * boundary wall; Wikidata Q3010223; José de Charmoy, 1902; OSM memorial=sculpture node, no building way). A tall plain
 * limestone stele with the poet and his bat-winged genie of Evil carved in high relief down its face (Modly
 * `baudelaire-poete`), and in front a long sloping-topped slab inscribed BAUDELAIRE with the poet's wrapped recumbent
 * figure lying on it, head to the stele (Modly `baudelaire-gisant`). Frame: −z the front (the avenue side), x across,
 * y up from the ground (G). The cemetery wall behind is the game's, not drawn here. Dimensions scaled by eye off Commons
 * photographs (the wall's stone courses as the yardstick), not surveyed.
 */
export const HX = 1.0
export const HZ = 1.4

// tunables (metres above the ground)
const SLAB_HW = 0.78, SLAB_Z0 = -1.2, SLAB_Z1 = 0.8, SLAB_H = 0.62, SLAB_LIP = 0.1   // the inscribed slab (z from front to stele)
const SLOPE = 0.12                                      // the slab top falls this much toward the front
const STELE_HW = 0.66, STELE_Z0 = 0.8, STELE_Z1 = 1.25, STELE_TOP = 4.0   // the stele: half-width, depth range, top above ground
const FOOT_H = 0.42, FOOT_OUT = 0.08                    // the plinth block under the stele
const CAP_H = 0.12, CAP_OUT = 0.05                      // coping on the stele
export const POET_AT: [number, number, number] = [0, G + SLAB_H + FOOT_H - SLOPE, STELE_Z0]          // relief figure standing on the foot
export const GISANT_AT: [number, number, number] = [0, G + SLAB_H, -0.1]                           // recumbent figure on the slab

const STONE: Rgb = hex('#cfc9ba')
const SLAB: Rgb = hex('#a9a595')
const MOSS: Rgb = hex('#7f8466')
const LETTER: Rgb = hex('#4d4a42')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // slab: dark moulded lip, body, a mossy sloping top (two wedges to fake the fall)
  block(q, -SLAB_HW - SLAB_LIP, SLAB_HW + SLAB_LIP, SLAB_Z0 - SLAB_LIP, SLAB_Z1, y(0), y(0.12), shade(SLAB, 0.85))
  block(q, -SLAB_HW, SLAB_HW, SLAB_Z0, SLAB_Z1, y(0.12), y(SLAB_H - SLOPE), SLAB)
  const steps = 6
  for (let i = 0; i < steps; i++) {   // top surface stepping down toward the front, in thin bands
    const z0 = SLAB_Z1 - ((i + 1) * (SLAB_Z1 - SLAB_Z0)) / steps, z1 = SLAB_Z1 - (i * (SLAB_Z1 - SLAB_Z0)) / steps
    block(q, -SLAB_HW, SLAB_HW, z0, z1, y(SLAB_H - SLOPE), y(SLAB_H - SLOPE + (SLOPE * (steps - 1 - i)) / (steps - 1) + 0.001), i < 2 ? MOSS : SLAB)
  }
  // the inscription BAUDELAIRE on the front face
  plaque(q, { x: 0, z: SLAB_Z0, y0: 0.22, w: 1.12, h: 0.2, panel: shade(SLAB, 0.93), letters: LETTER, lines: [0.92] })
  // plinth block under the stele, then the stele and its coping
  block(q, -STELE_HW - FOOT_OUT, STELE_HW + FOOT_OUT, STELE_Z0 - FOOT_OUT, STELE_Z1 + FOOT_OUT, y(SLAB_H - SLOPE), y(SLAB_H - SLOPE + FOOT_H), shade(STONE, 0.94))
  block(q, -STELE_HW, STELE_HW, STELE_Z0, STELE_Z1, y(SLAB_H - SLOPE + FOOT_H), y(STELE_TOP), STONE)
  block(q, -STELE_HW - CAP_OUT, STELE_HW + CAP_OUT, STELE_Z0 - CAP_OUT, STELE_Z1 + CAP_OUT, y(STELE_TOP), y(STELE_TOP + CAP_H), shade(STONE, 1.04))
}

export function tombeCenotapheBaudelaire(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
