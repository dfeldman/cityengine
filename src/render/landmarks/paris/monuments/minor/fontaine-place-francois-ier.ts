import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { FIXED } from '../common.ts'
import { G } from '../plaza-common.ts'
import { jetRing, roundBasin } from './monument-kit.ts'

/*
 * LA FONTAINE DE LA PLACE FRANÇOIS-Ier (Q3076214; Gabriel Davioud architect, François-Théophile Murguet sculptor, 1865, made for the
 * place de la Madeleine, moved here about 1909; 8e): a wide round basin (OSM way 553172931, water=basin, ring radius ~2.8 m), a
 * lobed foot with four winged griffins seated at its corners (one Modly model, placed 4x), a gadrooned drum, the shallow marble
 * vasque with eight lion-head spouts and an openwork gallery rim, and a shaft carrying four paired female masks with swags, ending in
 * a flared openwork cup (Modly: the whole upper shaft, `FUT_AT`). Heights are scaled off the Commons photographs ('vue globale',
 * 'socle', 'haut') against the basin ring, not surveyed. Frame: centred on the basin, y up from the pavement (G). Tunables below.
 */
export const HX = 3.0
export const HZ = 3.0

const BASIN_R = 2.8, RIM_W = 0.42, RIM_H = 0.5
const FOOT_R = 1.0, FOOT_H = 0.28          // lobed foot standing in the water
export const GRIFFIN_H = 0.85; const GRIFFIN_R = 0.62   // griffins' radius from the axis and their height
const PAD_W = 0.44, PAD_H = 0.26            // each griffin's plinth block
const DRUM_R = 0.5, DRUM_H = 1.0            // gadrooned drum between the griffins
const VAS_R = 0.98, VAS_H = 0.36, GAL_H = 0.2
const SHAFT_R = 0.16
export const FUT_H = 1.25                          // the Modly shaft + cup, base to rim (keep equal to --height)
const NSPOUT = 8, NGAL = 28

const STONE: Rgb = hex('#d9d5c8')
const MARBLE: Rgb = hex('#e4e1d8')
const WATER: Rgb = hex('#86a8ae')
const JET: Rgb = hex('#dfeaec')

const W0 = G + RIM_H - 0.1                         // water surface
const Y_FOOT = W0 - 0.04
const Y_PAD = Y_FOOT + FOOT_H
const Y_DRUM = Y_PAD + 0.1
const Y_VAS = Y_DRUM + DRUM_H
const Y_RIM = Y_VAS + VAS_H
/** Where the Modly shaft stands (landmark frame) and the four griffins (bearing 0 = +z; each faces outward). */
export const FUT_AT: [number, number, number] = [0, Y_RIM - 0.12, 0]
export const GRIFFINS: { at: [number, number, number]; bearing: number }[] = [0, 1, 2, 3].map((i) => {
  const a = (i * Math.PI) / 2
  return { at: [Math.sin(a) * GRIFFIN_R, Y_PAD + PAD_H, Math.cos(a) * GRIFFIN_R] as [number, number, number], bearing: (i * 90) % 360 }
})

function draw(q: MeshBuilder): void {
  roundBasin(q, 0, 0, G, BASIN_R, { rim: RIM_W, depth: RIM_H, lip: 0.05, stone: STONE, water: WATER, sides: 48 })
  // lobed foot (a four-lobed plinth under the water line) and the griffins' corner blocks
  prism(q, 0, 0, Y_FOOT, Y_PAD, FOOT_R, 16, shade(STONE, 0.95), FIXED, FOOT_R * 0.95, true)
  for (const g of GRIFFINS) {
    const [x, , z] = g.at
    const k = GRIFFIN_R * 1.05
    block(q, x / GRIFFIN_R * k - PAD_W / 2, x / GRIFFIN_R * k + PAD_W / 2, z / GRIFFIN_R * k - PAD_W / 2, z / GRIFFIN_R * k + PAD_W / 2, Y_PAD - 0.02, Y_PAD + PAD_H, shade(STONE, 0.9))
  }
  // gadrooned drum rising between the griffins, with a moulded neck under the vasque
  lathe(q, 0, 0, [[DRUM_R, Y_PAD], [DRUM_R * 0.92, Y_PAD + 0.15], [DRUM_R * 1.0, Y_PAD + DRUM_H * 0.45], [DRUM_R * 0.8, Y_PAD + DRUM_H * 0.9], [DRUM_R * 0.9, Y_VAS]], 20, shade(STONE, 1.02))
  // the vasque: shallow marble dish with its frieze, a rim, water inside and the openwork gallery above
  lathe(q, 0, 0, [[DRUM_R * 0.9, Y_VAS], [VAS_R * 0.75, Y_VAS + 0.05], [VAS_R * 0.98, Y_VAS + VAS_H * 0.35], [VAS_R, Y_VAS + VAS_H * 0.8], [VAS_R * 1.03, Y_RIM]], 32, MARBLE)
  prism(q, 0, 0, Y_RIM - 0.08, Y_RIM - 0.07, VAS_R * 0.97, 32, WATER, FIXED, VAS_R * 0.97, true)
  prism(q, 0, 0, Y_RIM, Y_RIM + 0.03, VAS_R * 1.03, 32, shade(MARBLE, 1.04), FIXED, VAS_R * 1.03, true)
  for (let i = 0; i < NGAL; i++) {
    const a = ((i + 0.5) / NGAL) * Math.PI * 2
    prism(q, Math.sin(a) * VAS_R * 0.99, Math.cos(a) * VAS_R * 0.99, Y_RIM, Y_RIM + GAL_H, 0.04, 4, MARBLE, FIXED, 0.03, true, a)
  }
  prism(q, 0, 0, Y_RIM + GAL_H - 0.03, Y_RIM + GAL_H, VAS_R * 1.0, 32, shade(MARBLE, 1.03), FIXED, VAS_R * 1.0, true)
  // lion-head spouts on the vasque face, and the thin falls into the basin
  for (let i = 0; i < NSPOUT; i++) {
    const a = (i / NSPOUT) * Math.PI * 2 + Math.PI / NSPOUT
    prism(q, Math.sin(a) * (VAS_R + 0.02), Math.cos(a) * (VAS_R + 0.02), Y_VAS + VAS_H * 0.45, Y_VAS + VAS_H * 0.75, 0.05, 4, shade(STONE, 0.85), FIXED, 0.05, true, a)
  }
  jetRing(q, 0, 0, NSPOUT, VAS_R + 0.05, Y_VAS + VAS_H * 0.5, VAS_R + 0.95, W0, { rise: 0.1, r: 0.012, c: JET, phase: Math.PI / NSPOUT })
  // a plain short shaft rising out of the vasque into the Modly piece
  prism(q, 0, 0, Y_VAS + VAS_H * 0.5, FUT_AT[1] + 0.2, SHAFT_R, 12, shade(MARBLE, 0.98), FIXED, SHAFT_R, true)
}

export function fontainePlaceFrancoisIer(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
