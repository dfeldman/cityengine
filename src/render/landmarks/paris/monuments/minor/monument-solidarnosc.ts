import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * MONUMENT DE SOLIDARNOSC (esplanade des Invalides, rue de Constantine side; Wikidata Q112865915): a low pale limestone
 * slab laid on the ground with a square notch cut at the back for a plane tree, and a dark bronze plaque set flat in
 * its top, edged in red and white (Polish colours), with a small red-white / white-red flag mark. Read off Commons
 * 'Monument de Solidarność (1)'; the slab size (~3.4 x 3.0 m, 0.45 m high) is estimated against the benches and tree,
 * not surveyed. Frame: x across, z toward the back (the tree notch at +x,+z), y up from the ground (G).
 */
export const HX = 1.9
export const HZ = 1.7

// tunables (metres)
const HW = 1.7, HL = 1.5                       // half width / half length of the slab
const SLAB_H = 0.42                            // slab body
const NOTCH = 1.0                              // square tree notch at the +x,+z corner
const PLQ_HW = 0.62, PLQ_HL = 0.42, PLQ_Z = -0.2, PLQ_H = 0.025, RIM = 0.05
const FLAG_W = 0.3, FLAG_H = 0.1

const STONE: Rgb = hex('#d9d4c6')
const LIP: Rgb = hex('#cfc9ba')
const BRONZE: Rgb = hex('#3b3631')
const RED: Rgb = hex('#b3262a')
const WHITE: Rgb = hex('#f0eee8')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // slab as three blocks round the notch
  const nx = HW - NOTCH, nz = HL - NOTCH
  block(q, -HW, HW, -HL, nz, y(0), y(SLAB_H), STONE)
  block(q, -HW, nx, nz, HL, y(0), y(SLAB_H), STONE)
  // thin lip course on the top, inset
  block(q, -HW + 0.08, HW - 0.08, -HL + 0.08, nz, y(SLAB_H), y(SLAB_H + 0.01), shade(LIP, 0.97))
  block(q, -HW + 0.08, nx, nz, HL - 0.08, y(SLAB_H), y(SLAB_H + 0.01), shade(LIP, 0.97))
  const top = SLAB_H + 0.01
  // plaque: white then red edging, then dark bronze field
  block(q, -PLQ_HW - 2 * RIM, PLQ_HW + 2 * RIM, PLQ_Z - PLQ_HL - 2 * RIM, PLQ_Z + PLQ_HL + 2 * RIM, y(top), y(top + 0.01), WHITE)
  block(q, -PLQ_HW - RIM, PLQ_HW + RIM, PLQ_Z - PLQ_HL - RIM, PLQ_Z + PLQ_HL + RIM, y(top + 0.01), y(top + 0.02), RED)
  block(q, -PLQ_HW, PLQ_HW, PLQ_Z - PLQ_HL, PLQ_Z + PLQ_HL, y(top + 0.02), y(top + PLQ_H), BRONZE)
  // small flag mark (white over red, red over white) at the plaque's centre-front
  const fz = PLQ_Z - 0.1
  block(q, -FLAG_W, 0, fz, fz + FLAG_H, y(top + PLQ_H), y(top + PLQ_H + 0.004), WHITE)
  block(q, -FLAG_W, 0, fz - FLAG_H, fz, y(top + PLQ_H), y(top + PLQ_H + 0.004), RED)
  block(q, 0.02, FLAG_W, fz, fz + FLAG_H, y(top + PLQ_H), y(top + PLQ_H + 0.004), RED)
  block(q, 0.02, FLAG_W, fz - FLAG_H, fz, y(top + PLQ_H), y(top + PLQ_H + 0.004), WHITE)
}

export function monumentSolidarnosc(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
