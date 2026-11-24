import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, roof, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * TOMBE DE L'ABBE DELILLE (Pere-Lachaise, division 11, avenue Delille; Wikidata Q3323390, d. 1813; Commons "Delille
 * div. 11 Pere-Lachaise", Guyot's drawing "Grave of Delille 02"): a small plain stone tomb house (a box with a
 * moulded cornice and a low gable, a blank panel on its front) standing in a railed plot on a low retaining kerb.
 * The plot is OSM building way 1210797358 (3.7 x 3.0 m, gabled); the entry claims it. Frame: -z the front, x across
 * the long side, y up from G. Heights and the tomb's 2.4 x 1.4 m body are estimated by eye from the photographs.
 * No sculpture: nothing for Modly.
 */
export const HX = 1.83
export const HZ = 1.5

// tunables (metres)
export const KERB_H = 0.42, KERB_T = 0.18              // retaining kerb round the plot
export const TOMB_HW = 1.2, TOMB_HD = 0.72, TOMB_H = 1.45, TOMB_Z = 0.25 // body (centre offset TOMB_Z towards +z)
export const CORNICE_H = 0.14, CORNICE_OUT = 0.09
export const GABLE_H = 0.4
export const RAIL_H = 0.95, POST = 0.045, BAR_STEP = 0.16 // iron railing
const STONE: Rgb = hex('#c9c3b2')
const KERB: Rgb = hex('#a9a396')
const IRON: Rgb = hex('#22252a')
const PANEL: Rgb = hex('#e6e2d6')

function railX(q: MeshBuilder, x0: number, x1: number, z: number, y0: number): void {
  const n = Math.max(1, Math.round((x1 - x0) / BAR_STEP))
  for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n; block(q, x - POST / 2, x + POST / 2, z - POST / 2, z + POST / 2, y0, y0 + RAIL_H, IRON) }
  block(q, x0, x1, z - POST / 2, z + POST / 2, y0 + RAIL_H - 0.06, y0 + RAIL_H - 0.02, IRON)
  block(q, x0, x1, z - POST / 2, z + POST / 2, y0 + 0.1, y0 + 0.14, IRON)
}
function railZ(q: MeshBuilder, z0: number, z1: number, x: number, y0: number): void {
  const n = Math.max(1, Math.round((z1 - z0) / BAR_STEP))
  for (let i = 0; i <= n; i++) { const z = z0 + ((z1 - z0) * i) / n; block(q, x - POST / 2, x + POST / 2, z - POST / 2, z + POST / 2, y0, y0 + RAIL_H, IRON) }
  block(q, x - POST / 2, x + POST / 2, z0, z1, y0 + RAIL_H - 0.06, y0 + RAIL_H - 0.02, IRON)
  block(q, x - POST / 2, x + POST / 2, z0, z1, y0 + 0.1, y0 + 0.14, IRON)
}

function draw(q: MeshBuilder): void {
  const y0 = G
  // kerb ring (four walls) on which the railing stands
  block(q, -HX, HX, -HZ, -HZ + KERB_T, y0, y0 + KERB_H, KERB)
  block(q, -HX, HX, HZ - KERB_T, HZ, y0, y0 + KERB_H, KERB)
  block(q, -HX, -HX + KERB_T, -HZ, HZ, y0, y0 + KERB_H, KERB)
  block(q, HX - KERB_T, HX, -HZ, HZ, y0, y0 + KERB_H, KERB)
  block(q, -HX + KERB_T, HX - KERB_T, -HZ + KERB_T, HZ - KERB_T, y0, y0 + KERB_H * 0.8, shade(KERB, 0.8)) // earth/slab fill
  const ry = y0 + KERB_H
  railX(q, -HX + KERB_T / 2, HX - KERB_T / 2, -HZ + KERB_T / 2, ry)
  railX(q, -HX + KERB_T / 2, HX - KERB_T / 2, HZ - KERB_T / 2, ry)
  railZ(q, -HZ + KERB_T / 2, HZ - KERB_T / 2, -HX + KERB_T / 2, ry)
  railZ(q, -HZ + KERB_T / 2, HZ - KERB_T / 2, HX - KERB_T / 2, ry)
  // the tomb house
  const by = y0 + KERB_H * 0.8
  const z0 = TOMB_Z - TOMB_HD, z1 = TOMB_Z + TOMB_HD
  block(q, -TOMB_HW - 0.06, TOMB_HW + 0.06, z0 - 0.06, z1 + 0.06, by, by + 0.18, shade(STONE, 0.9)) // plinth
  block(q, -TOMB_HW, TOMB_HW, z0, z1, by + 0.18, by + TOMB_H, STONE)
  block(q, -0.7, 0.7, z0 - 0.015, z0, by + 0.45, by + TOMB_H - 0.3, PANEL)            // blank front panel
  const cy = by + TOMB_H
  block(q, -TOMB_HW - CORNICE_OUT, TOMB_HW + CORNICE_OUT, z0 - CORNICE_OUT, z1 + CORNICE_OUT, cy, cy + CORNICE_H, shade(STONE, 1.06))
  roof(q, -TOMB_HW - CORNICE_OUT, TOMB_HW + CORNICE_OUT, z0 - CORNICE_OUT, z1 + CORNICE_OUT, cy + CORNICE_H, GABLE_H, 0, TOMB_HD + CORNICE_OUT, shade(STONE, 0.95)) // ridge along x
}

export function tombeAbbeDelille(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
