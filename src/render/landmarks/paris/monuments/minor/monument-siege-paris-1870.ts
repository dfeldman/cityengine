import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, roof, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * MONUMENT A LA MEMOIRE DES SOLDATS MORTS PENDANT LE SIEGE DE PARIS 1870-1871 (Père-Lachaise division 72, Q94696967,
 * 48.86339, 2.39082; Wikidata's label is the Buzenval national-guards memorial of 1877). A grey-limestone pylon with a
 * moulded cornice over a dentil band, a wreath roundel high on its face, a low hipped cap, the dedication "A LA MEMOIRE"
 * and a carved palm below; a low wing wall each side carries a garland-and-rosette frieze; an iron railing across the
 * front. No sculpture in the round (roundel, palm and garlands are shallow relief), so no Modly piece. Frame: -z the
 * front, x across, y up from G. Sizes by eye from Commons "Père-Lachaise - Division 72 - Siège de Paris 02" (railing
 * about 1.1 m as scale), not surveyed.
 */
export const HX = 4.2
export const HZ = 1.6

// tunables (metres)
const PY_HW = 0.62, PY_HD = 0.5, PY_H = 4.3                  // pylon half width/depth, height to cornice top
const BASE_H = 0.35                                          // plinth under the pylon
const CORN_H = 0.3, CORN_OVER = 0.1, CAP_H = 0.45            // cornice, overhang, hipped cap
const WING_X = 3.5, WING_H = 1.15, WING_T = 0.5              // wings out to x, height, thickness
const ROUND_R = 0.36, ROUND_Y = 3.15                         // roundel radius, centre height
const FENCE_Z = -1.15, FENCE_H = 1.1, FENCE_X = 3.9, BAR_PITCH = 0.16

const STONE: Rgb = hex('#aaa89f')
const DARK: Rgb = hex('#6f706a')
const INSCR: Rgb = hex('#85837a')
const IRON: Rgb = hex('#23282a')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // wings with a coping and a garland frieze on the front face
  for (const sx of [-1, 1]) {
    const a = sx * PY_HW, b = sx * WING_X
    const x0 = Math.min(a, b), x1 = Math.max(a, b)
    block(q, x0, x1, -WING_T / 2, WING_T / 2, y(0), y(WING_H), shade(STONE, 0.96))
    block(q, x0, x1 + sx * 0.04, -WING_T / 2 - 0.05, WING_T / 2 + 0.05, y(WING_H), y(WING_H + 0.1), shade(STONE, 1.04))
    const n = 6, step = (WING_X - PY_HW) / n
    for (let i = 0; i < n; i++) {
      const cx = sx * (PY_HW + step * (i + 0.5))
      block(q, cx - 0.07, cx + 0.07, -WING_T / 2 - 0.04, -WING_T / 2, y(WING_H - 0.4), y(WING_H - 0.2), DARK)     // rosette
      block(q, cx - step * 0.4, cx + step * 0.4, -WING_T / 2 - 0.02, -WING_T / 2, y(WING_H - 0.38), y(WING_H - 0.3), shade(STONE, 0.84))   // garland sag
    }
  }
  // plinth and pylon
  block(q, -PY_HW - 0.12, PY_HW + 0.12, -PY_HD - 0.12, PY_HD + 0.12, y(0), y(BASE_H), shade(STONE, 1.03))
  block(q, -PY_HW, PY_HW, -PY_HD, PY_HD, y(BASE_H), y(PY_H - CORN_H), STONE)
  // cornice: dentil band then overhanging slab
  const dy = PY_H - CORN_H
  for (let i = -4; i <= 4; i++) block(q, i * 0.13 - 0.04, i * 0.13 + 0.04, -PY_HD - 0.04, -PY_HD, y(dy - 0.1), y(dy), shade(STONE, 0.8))
  block(q, -PY_HW - CORN_OVER, PY_HW + CORN_OVER, -PY_HD - CORN_OVER, PY_HD + CORN_OVER, y(dy), y(PY_H), shade(STONE, 1.05))
  roof(q, -PY_HW - 0.02, PY_HW + 0.02, -PY_HD - 0.02, PY_HD + 0.02, y(PY_H), CAP_H, PY_HW * 0.8, PY_HD * 0.8, shade(STONE, 0.82))
  // roundel with a wreath ring
  const nr = 18
  block(q, -ROUND_R, ROUND_R, -PY_HD - 0.025, -PY_HD, y(ROUND_Y - ROUND_R * 0.7), y(ROUND_Y + ROUND_R * 0.7), shade(STONE, 0.93))
  for (let i = 0; i < nr; i++) {
    const a = (i / nr) * Math.PI * 2, cx = Math.cos(a) * ROUND_R * 0.85, cy = Math.sin(a) * ROUND_R * 0.85
    block(q, cx - 0.045, cx + 0.045, -PY_HD - 0.05, -PY_HD, y(ROUND_Y + cy - 0.045), y(ROUND_Y + cy + 0.045), DARK)
  }
  // dedication and a palm leaf in relief
  plaque(q, { x: 0, z: -PY_HD, y0: y(2.0), w: 0.85, h: 0.5, panel: shade(STONE, 0.98), letters: INSCR, lines: [0.7, 0.9, 0.9, 0.6] })
  for (let i = 0; i < 9; i++) {
    const t = i / 8, cx = 0.18 - 0.1 * t, cy = 1.9 - 1.45 * t
    block(q, cx - 0.06 - 0.12 * (1 - t), cx + 0.06 + 0.12 * (1 - t), -PY_HD - 0.03, -PY_HD, y(cy - 0.1), y(cy + 0.1), shade(STONE, 0.86))
  }
  // iron railing: posts, two rails, thin bars
  const x0 = -FENCE_X, x1 = FENCE_X
  for (let x = x0; x <= x1 + 0.01; x += 1.3) block(q, x - 0.05, x + 0.05, FENCE_Z - 0.05, FENCE_Z + 0.05, y(0), y(FENCE_H + 0.08), IRON)
  for (const h of [0.12, FENCE_H - 0.06]) block(q, x0, x1, FENCE_Z - 0.02, FENCE_Z + 0.02, y(h), y(h + 0.05), IRON)
  for (let x = x0 + BAR_PITCH; x < x1; x += BAR_PITCH) block(q, x - 0.01, x + 0.01, FENCE_Z - 0.01, FENCE_Z + 0.01, y(0.1), y(FENCE_H - 0.02), IRON)
}

export function monumentSiegeParis1870(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
