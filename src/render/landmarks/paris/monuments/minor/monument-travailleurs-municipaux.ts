import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque, obelisk } from './monument-kit.ts'

/*
 * MONUMENT AUX TRAVAILLEURS MUNICIPAUX (Père-Lachaise, Wikidata Q15156042, 48.86271, 2.39276; City of Paris, 1920s):
 * "A la mémoire de ses serviteurs victimes du devoir, la Ville de Paris". A pale-limestone obelisk (names of sewermen,
 * street cleaners, gardeners... on two faces) on a plain pedestal; a veiled seated mourner with a palm sits against the
 * pedestal's front (Modly `travailleurs-figure`, attached in paris-statues.json at FIGURE_AT). The pedestal stands on a low
 * square base with a panelled double door on the front, flanked by two piers with wreath medallions, and a low curved
 * wall sweeping back round a planted bed. Frame: −z the front, x across, y up from G. Sizes by eye from Commons
 * "Monument aux travailleurs municipaux 06/10/19" (Wikidata gives ~5 m), not surveyed.
 */
export const HX = 2.4
export const HZ = 2.4

// tunables (metres above the ground)
const BASE_HW = 0.85, BASE_HD = 0.75, BASE_H = 1.15         // door block
const PIER_X = 1.15, PIER_HW = 0.28, PIER_HD = 0.3, PIER_H = 1.3
const WALL_R = 1.9, WALL_T = 0.3, WALL_H = 0.55            // curved wall radius (about the centre), thickness, height
const PED_HW = 0.8, PED_HD = 0.7, PED_H = 1.2             // pedestal under the obelisk
const OB_W0 = 0.95, OB_W1 = 0.6, OB_H = 3.0, OB_TIP = 0.4  // obelisk
export const FIGURE_AT: [number, number, number] = [0, G + BASE_H + 0.1, -0.5]

const STONE: Rgb = hex('#cfc9b8')
const DARK: Rgb = hex('#6e6f68')
const DOOR: Rgb = hex('#8d9a97')
const INSCR: Rgb = hex('#9a9588')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // low curved wall behind: segments along a half circle on the +z side, from pier to pier
  const n = 14
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (i + 0.5) / n
    const cx = Math.cos(a) * WALL_R, cz = Math.sin(a) * WALL_R * 0.9
    const s = WALL_T * 0.62
    block(q, cx - s, cx + s, cz - s, cz + s, y(0), y(WALL_H), shade(STONE, 0.94))
    block(q, cx - s - 0.03, cx + s + 0.03, cz - s - 0.03, cz + s + 0.03, y(WALL_H), y(WALL_H + 0.07), shade(STONE, 1.04))
  }
  // piers with medallions, and the connecting wing walls to the door block
  for (const sx of [-1, 1]) {
    const px = sx * PIER_X
    block(q, px - PIER_HW, px + PIER_HW, -PIER_HD, PIER_HD, y(0), y(PIER_H), STONE)
    block(q, px - PIER_HW - 0.04, px + PIER_HW + 0.04, -PIER_HD - 0.04, PIER_HD + 0.04, y(PIER_H), y(PIER_H + 0.1), shade(STONE, 1.04))
    block(q, px - 0.15, px + 0.15, -PIER_HD - 0.04, -PIER_HD, y(PIER_H - 0.5), y(PIER_H - 0.2), shade(STONE, 0.85))   // medallion
    block(q, px - 0.08, px + 0.08, -PIER_HD - 0.06, -PIER_HD - 0.04, y(PIER_H - 0.43), y(PIER_H - 0.27), DARK)
    const x0 = sx > 0 ? BASE_HW : PIER_X * -1 + PIER_HW
    block(q, sx > 0 ? BASE_HW : -PIER_X + PIER_HW, sx > 0 ? PIER_X - PIER_HW : -BASE_HW, -0.2, 0.2, y(0), y(0.75), shade(STONE, 0.97))
    void x0
  }
  // door block with a panelled double door
  block(q, -BASE_HW, BASE_HW, -BASE_HD, BASE_HD, y(0), y(BASE_H), STONE)
  block(q, -BASE_HW - 0.05, BASE_HW + 0.05, -BASE_HD - 0.05, BASE_HD + 0.05, y(BASE_H - 0.1), y(BASE_H), shade(STONE, 1.05))
  for (const sx of [-1, 1]) {
    block(q, sx * 0.02 + (sx > 0 ? 0 : -0.36), sx * 0.02 + (sx > 0 ? 0.36 : 0), -BASE_HD - 0.03, -BASE_HD, y(0.12), y(BASE_H - 0.2), DOOR)
    block(q, sx * 0.2 - 0.12, sx * 0.2 + 0.12, -BASE_HD - 0.045, -BASE_HD - 0.03, y(0.25), y(0.6), shade(DOOR, 0.82))
    block(q, sx * 0.2 - 0.12, sx * 0.2 + 0.12, -BASE_HD - 0.045, -BASE_HD - 0.03, y(0.7), y(0.85), shade(DOOR, 0.82))
  }
  block(q, -0.012, 0.012, -BASE_HD - 0.04, -BASE_HD, y(0.12), y(BASE_H - 0.2), DARK)
  // pedestal (a ledge in front for the figure) and inscription band
  const pedY = BASE_H
  block(q, -PED_HW - 0.06, PED_HW + 0.06, -PED_HD - 0.06, PED_HD + 0.06, y(pedY), y(pedY + 0.1), shade(STONE, 1.04))
  block(q, -PED_HW, PED_HW, -PED_HD, PED_HD, y(pedY + 0.1), y(pedY + PED_H), STONE)
  plaque(q, { x: 0, z: -PED_HD, y0: y(pedY + PED_H - 0.5), w: 1.0, h: 0.4, panel: shade(STONE, 0.97), letters: INSCR, lines: [0.8, 0.9, 0.5, 0.9] })
  const oy = pedY + PED_H
  block(q, -OB_W0 / 2 - 0.05, OB_W0 / 2 + 0.05, -OB_W0 / 2 - 0.05, OB_W0 / 2 + 0.05, y(oy), y(oy + 0.12), shade(STONE, 1.03))
  obelisk(q, 0, 0, y(oy + 0.12), y(oy + 0.12 + OB_H), { w0: OB_W0, w1: OB_W1, c: shade(STONE, 1.02), tip: OB_TIP, tipC: shade(STONE, 0.97) })
  // name blocks on the obelisk faces (-z and the sides)
  const wAt = (v: number): number => OB_W0 + (OB_W1 - OB_W0) * (v / OB_H)
  for (const [v, hh] of [[0.5, 0.9], [1.5, 0.9]] as [number, number][]) {
    const w = wAt(v + hh / 2)
    plaque(q, { x: 0, z: -wAt(v) / 2 + 0.001, y0: y(oy + 0.12 + v), w: w * 0.78, h: hh, panel: shade(STONE, 0.95), letters: INSCR, lines: [0.9, 0.9, 0.9, 0.8, 0.9, 0.9, 0.9, 0.8] })
  }
}

export function monumentTravailleursMunicipaux(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
