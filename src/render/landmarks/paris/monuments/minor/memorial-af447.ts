import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * MEMORIAL DES VICTIMES DU VOL AIR FRANCE 447 (Père-Lachaise, division 84; Wikidata Q96106655; 2009 Rio-Paris crash, 228
 * dead): a long low black-granite slab carrying the victims' names on a sloping face, and rising behind it a tall pane of
 * glass engraved with the flight's route and the cities' names. Four paving slabs lie in front. Frame: −z the front (the
 * names face), x along the memorial, y up from the ground (G). No sculpture. Sizes scaled by eye off one Commons photograph.
 */
export const HX = 2.6
export const HZ = 1.6

// tunables (metres)
const BASE_HW = 2.1, BASE_D = 0.8, BASE_H = 0.5    // black granite slab (half-width, depth, height at the back)
const FRONT_H = 0.28                                 // the names face's lower edge height (front of the slope)
const PANE_HW = 1.95, PANE_T = 0.06, PANE_H = 1.5    // glass pane
const PANE_Z = 0.15                                  // pane centre z (behind the base middle)
const SLAB_N = 4, SLAB_W = 1.0, SLAB_D = 0.55, SLAB_GAP = 0.04, SLAB_Z = -1.15, SLAB_H = 0.03

const BLACK: Rgb = hex('#1c1d1f')
const GLASS: Rgb = hex('#7d8b88')
const PAVE: Rgb = hex('#8e8c85')
const ETCH: Rgb = hex('#c4cdc9')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // slab: a stepped slope (back high, front low), names panel on the front step
  block(q, -BASE_HW, BASE_HW, -BASE_D / 2, BASE_D / 2, y(0), y(BASE_H), BLACK)
  block(q, -BASE_HW, BASE_HW, -BASE_D / 2 - 0.12, -BASE_D / 2, y(0), y(FRONT_H), shade(BLACK, 1.1))
  plaque(q, { x: 0, z: -BASE_D / 2 - 0.12, y0: y(0.06), w: BASE_HW * 1.9, h: FRONT_H - 0.1, panel: shade(BLACK, 1.25), letters: ETCH,
    lines: [0.9, 0.9, 0.9, 0.9, 0.9] })
  // glass pane, set on the back of the slab, with etched route lines
  block(q, -PANE_HW, PANE_HW, PANE_Z - PANE_T / 2, PANE_Z + PANE_T / 2, y(BASE_H), y(BASE_H + PANE_H), GLASS)
  for (const [yy, w] of [[0.35, 0.8], [0.62, 0.55], [0.95, 0.7], [1.2, 0.3]] as const) {
    block(q, -PANE_HW * w, PANE_HW * w, PANE_Z - PANE_T / 2 - 0.01, PANE_Z - PANE_T / 2, y(BASE_H + yy), y(BASE_H + yy + 0.02), ETCH)
  }
  // paving slabs in front
  for (let i = 0; i < SLAB_N; i++) {
    const x0 = (i - SLAB_N / 2) * (SLAB_W + SLAB_GAP)
    block(q, x0, x0 + SLAB_W, SLAB_Z - SLAB_D / 2, SLAB_Z + SLAB_D / 2, y(0), y(SLAB_H), PAVE)
  }
}

export function memorialAf447(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
