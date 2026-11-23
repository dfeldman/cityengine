import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { obelisk, steppedBase } from './monument-kit.ts'

/*
 * LA PYRAMIDE (OBELISQUE) DU BOIS DE VINCENNES (carrefour de la Pyramide, Paris 12e; Wikidata Q3411287; 1731, Slodtz brothers,
 * for Louis XV's replanting of the wood): a grey-stone rustic obelisk on a rusticated square pedestal with banded courses, rising
 * from three low round steps; on each of the four faces a rocaille cartouche (arms of France east and west, Latin inscription
 * north and south), a round ball and a thin gilt spike on top. Measured nowhere: heights are scaled by eye off Commons
 * "Paris - Pyramide du bois de Vincennes - 020" (pedestal taken as ~5 m), total ~17 m. Every number below is a tunable.
 * Frame: x across, y up from G, cartouches on all four faces. The reliefs are shallow and procedural.
 */
export const HX = 6
export const HZ = 6

const STONE: Rgb = hex('#9a9889')
const GILT: Rgb = hex('#c9a640')

const STEPS: [number, number][] = [[5.2, 0.32], [4.6, 0.32], [4.0, 0.32]]   // radius, height of the three round steps
const PED_HW = 1.9, PED_H = 4.6          // pedestal half-width and height
const PLINTH_OUT = 0.14, PLINTH_H = 0.55  // moulded foot
const CORNICE_OUT = 0.22, CORNICE_H = 0.45
const BAND_H = 0.2, BAND_OUT = 0.06, BAND_YS = [1.5, 2.55, 3.6]   // rustic bands across the pedestal
const OBE_H = 8.2, OBE_W0 = 2.1, OBE_W1 = 0.85, OBE_TIP = 0.7     // shaft height, widths at foot and top, pyramidion
const CART_W = 1.0, CART_H = 1.5, CART_Y = 0.9, CART_T = 0.12       // cartouche on each shaft face (above its foot)
const BALL_R = 0.38, SPIKE_H = 1.6, SPIKE_R = 0.05

function draw(q: MeshBuilder): void {
  const top = steppedBase(q, 0, 0, G, STEPS, STONE, true)
  block(q, -PED_HW - PLINTH_OUT, PED_HW + PLINTH_OUT, -PED_HW - PLINTH_OUT, PED_HW + PLINTH_OUT, top, top + PLINTH_H, shade(STONE, 0.9))
  const p0 = top + PLINTH_H, p1 = top + PED_H
  block(q, -PED_HW, PED_HW, -PED_HW, PED_HW, p0, p1, STONE)
  for (const by of BAND_YS) {
    const y = top + by
    block(q, -PED_HW - BAND_OUT, PED_HW + BAND_OUT, -PED_HW - BAND_OUT, PED_HW + BAND_OUT, y, y + BAND_H, shade(STONE, 0.86))
  }
  // a plain inscribed panel on each pedestal face between the bands
  const py = top + (BAND_YS[0] + BAND_H + 0.1), ph = BAND_YS[1] - BAND_YS[0] - BAND_H - 0.2
  for (const s of [-1, 1]) {
    block(q, -0.7, 0.7, s * (PED_HW + 0.03) - 0.03, s * (PED_HW + 0.03) + 0.03, py, py + ph, shade(STONE, 1.07))
    block(q, s * (PED_HW + 0.03) - 0.03, s * (PED_HW + 0.03) + 0.03, -0.7, 0.7, py, py + ph, shade(STONE, 1.07))
  }
  block(q, -PED_HW - CORNICE_OUT, PED_HW + CORNICE_OUT, -PED_HW - CORNICE_OUT, PED_HW + CORNICE_OUT, p1, p1 + CORNICE_H, shade(STONE, 1.05))
  // the shaft: a slight shoulder, then the tapering obelisk
  const s0 = p1 + CORNICE_H
  block(q, -OBE_W0 / 2 - 0.12, OBE_W0 / 2 + 0.12, -OBE_W0 / 2 - 0.12, OBE_W0 / 2 + 0.12, s0, s0 + 0.35, shade(STONE, 0.93))
  const o0 = s0 + 0.35
  obelisk(q, 0, 0, o0, o0 + OBE_H, { w0: OBE_W0, w1: OBE_W1, c: STONE, tip: OBE_TIP, tipC: shade(STONE, 1.04) })
  // cartouches: a raised oval plaque with a frame, one per face, centred on the lower shaft
  const half = (t: number): number => (OBE_W0 + (OBE_W1 - OBE_W0) * t) / 2
  const cy = o0 + CART_Y, tMid = (CART_Y + CART_H / 2) / OBE_H, hw = half(tMid)
  for (const s of [-1, 1]) {
    const a = s * (hw + CART_T / 2 - 0.02)
    block(q, -CART_W / 2 - 0.12, CART_W / 2 + 0.12, a - CART_T / 2, a + CART_T / 2, cy - 0.12, cy + CART_H + 0.12, shade(STONE, 0.84))
    block(q, -CART_W / 2, CART_W / 2, a - CART_T / 2 - 0.03 * s, a + CART_T / 2 + 0.03 * s, cy, cy + CART_H, shade(STONE, 1.1))
    block(q, a - CART_T / 2, a + CART_T / 2, -CART_W / 2 - 0.12, CART_W / 2 + 0.12, cy - 0.12, cy + CART_H + 0.12, shade(STONE, 0.84))
    block(q, a - CART_T / 2 - 0.03 * s, a + CART_T / 2 + 0.03 * s, -CART_W / 2, CART_W / 2, cy, cy + CART_H, shade(STONE, 1.1))
  }
  // ball and gilt spike
  const yt = o0 + OBE_H + OBE_TIP
  lathe(q, 0, 0, [[0.01, yt], [BALL_R * 0.9, yt + BALL_R * 0.4], [BALL_R, yt + BALL_R], [BALL_R * 0.9, yt + BALL_R * 1.6], [0.01, yt + BALL_R * 2]], 14, shade(STONE, 0.95))
  lathe(q, 0, 0, [[SPIKE_R, yt + BALL_R * 2 - 0.05], [SPIKE_R * 0.8, yt + BALL_R * 2 + SPIKE_H], [0.01, yt + BALL_R * 2 + SPIKE_H + 0.1]], 8, GILT)
}

export function obelisquePyramideVincennes(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
