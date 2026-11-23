import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LE MONUMENT AUX SOLDATS NOIRS MORTS POUR LA FRANCE (Jardin d'agronomie tropicale, Paris 12e; Wikidata Q17745972;
 * OSM memorial node, memorial=stele): a pale stone stele carrying, in bas-relief, a standing woman in a long robe
 * beside a Poilu's helmet on a mound (the figure: Modly `soldatsnoirs-femme`, attached in paris-statues.json); under
 * it the inscribed die, a three-step platform and a low wing wall each side. Frame: −z the front, x across, y up from
 * the ground (G). Dimensions are scaled by eye off Commons photographs (the die ~2 m wide), not surveyed.
 */
export const HX = 4.0
export const HZ = 2.2

// tunables (metres above the ground)
const STEPS: [number, number][] = [[3.9, 0.12], [3.55, 0.12], [3.2, 0.12]]    // half-width, rise (depth is HZ-scaled below)
const DIE_HW = 1.0, DIE_HD = 0.45, DIE_Y1 = 1.1      // inscribed block
const SLAB_HW = 0.62, SLAB_HD = 0.17, SLAB_Y1 = 2.95  // the relief stele
const WING_X0 = 1.15, WING_X1 = 3.4, WING_T = 0.3, WING_H = 0.6
export const RELIEF_AT: [number, number, number] = [0.12, G + DIE_Y1 + 0.35, -SLAB_HD - 0.02]

const STONE: Rgb = hex('#cfc9ba')
const PALE: Rgb = hex('#dcd6c6')
const DARK: Rgb = hex('#aaa393')
const TREAD: Rgb = hex('#b8b2a2')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // three-step platform (deeper toward the front)
  let y0 = 0
  STEPS.forEach(([hw, h], i) => {
    const k = STEPS.length - 1 - i
    block(q, -hw, hw, -1.2 - k * 0.35, 0.7, y(y0), y(y0 + h), shade(TREAD, 1 - 0.03 * i))
    y0 += h
  })
  // die: base course, inscribed face, cap
  block(q, -DIE_HW - 0.08, DIE_HW + 0.08, -DIE_HD - 0.08, DIE_HD + 0.08, y(y0), y(y0 + 0.2), DARK)
  block(q, -DIE_HW, DIE_HW, -DIE_HD, DIE_HD, y(y0 + 0.2), y(DIE_Y1), STONE)
  block(q, -DIE_HW - 0.06, DIE_HW + 0.06, -DIE_HD - 0.06, DIE_HD + 0.06, y(DIE_Y1), y(DIE_Y1 + 0.1), PALE)
  plaque(q, { x: 0, z: -DIE_HD - 0.001, y0: y(y0 + 0.4), w: 1.5, h: 0.5, panel: shade(STONE, 1.02), letters: shade(STONE, 0.5), lines: [0.85, 0.5, 0.6] })
  // stele: a slab with a raised margin (frame) round a sunk relief field
  const y1 = y(DIE_Y1 + 0.1)
  block(q, -SLAB_HW, SLAB_HW, -SLAB_HD, SLAB_HD, y1, y(SLAB_Y1), PALE)
  const f = 0.09, fd = SLAB_HD + 0.03
  block(q, -SLAB_HW, -SLAB_HW + f, -fd, -SLAB_HD, y1, y(SLAB_Y1), STONE)
  block(q, SLAB_HW - f, SLAB_HW, -fd, -SLAB_HD, y1, y(SLAB_Y1), STONE)
  block(q, -SLAB_HW, SLAB_HW, -fd, -SLAB_HD, y(SLAB_Y1) - f, y(SLAB_Y1), STONE)
  block(q, -SLAB_HW, SLAB_HW, -fd, -SLAB_HD, y1, y1 + f, STONE)
  // the mound and helmet of the relief (shallow, procedural; the woman is the Modly piece)
  block(q, -SLAB_HW + f + 0.02, -0.12, -SLAB_HD - 0.07, -SLAB_HD, y1 + f, y1 + f + 0.28, DARK)
  block(q, -SLAB_HW + f + 0.1, -SLAB_HW + f + 0.3, -SLAB_HD - 0.08, -SLAB_HD, y1 + f + 0.28, y1 + f + 0.46, DARK)
  // wing walls
  for (const s of [-1, 1]) {
    const x0 = Math.min(s * WING_X0, s * WING_X1), x1 = Math.max(s * WING_X0, s * WING_X1)
    block(q, x0, x1, -WING_T / 2 - 0.45, WING_T / 2 - 0.45, y(y0), y(y0 + WING_H), STONE)
    block(q, x0 - 0.04, x1 + 0.04, -WING_T / 2 - 0.49, WING_T / 2 - 0.41, y(y0 + WING_H), y(y0 + WING_H + 0.06), PALE)
  }
}

export function monumentSoldatsNoirs(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
