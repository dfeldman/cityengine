/**
 * Mirrored-glass wedge across the Rue du Colonel Pierre Avia from Aquaboulevard (OSM way/554636238, office, tagged "Colas",
 * no height; a 65 m x 16 m sliver). Owner street photo: a huge mirror-glass prism, ~45 m at its tall end, one face sloping
 * steeply to a sharp edge, a fine square glass grid, flagpoles before it. Plan in metres east/north of 48.831323, 2.275402.
 * Distance fidelity: pale mirror tone, panelled grid, the roof rising linearly along the long axis from the low end.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { ccwEN, hull, registerRing, tools, type P2 } from '../museums/enframe.ts'

// way/554636238, the street edge is G->A (first and last vertices)
const PLAN: P2[] = [[263.1, 113.7], [266.4, 112.4], [250.7, 55.5], [244.3, 52], [237.5, 52], [230, 56.5], [224.1, 62.4]]

export const MIRROR_PRISM = {
  H_TALL: 45, H_LOW: 5, // metres at the tall (north) end and at the low (south) end
  MIRROR: '#aebfcc', GRID: 1.8, GRID_SPREAD: 0.06, ROOF: '#c3ced6', FOOT: '#3a4650', FOOT_H: 3,
  POLES: 4, POLE_H: 11, POLE_STEP: 3.2, POLE_OUT: 5, POLE_R: 0.07, POLE_COLOUR: '#d9dcdd',
}

export const mirrorPrism = (out: MeshBuilder, fit: Fit): void => {
  const K = MIRROR_PRISM, F = registerRing(PLAN, fit), T = tools(out, F), r = ccwEN(hull(PLAN))
  const a = PLAN[6], b = PLAN[0], L = Math.hypot(b[0] - a[0], b[1] - a[1])
  const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L
  const top = (e: number, n: number): number => K.H_LOW + (K.H_TALL - K.H_LOW) * Math.max(0, Math.min(1, ((e - a[0]) * ux + (n - a[1]) * uy) / L))
  T.prism(r, 0, K.FOOT_H, hex(K.FOOT), null)
  T.prism(r, K.FOOT_H, top, hex(K.MIRROR), hex(K.ROOF), K.GRID, K.GRID_SPREAD)
  // flagpoles along the street edge, outward is to the west of the G->A edge
  const nx = uy, ny = -ux
  for (let i = 0; i < K.POLES; i++) {
    const s = L * 0.7 + i * K.POLE_STEP, px = a[0] + ux * s - nx * K.POLE_OUT, py = a[1] + uy * s - ny * K.POLE_OUT
    T.beam([px, py, 0], [px, py, K.POLE_H], K.POLE_R, hex(K.POLE_COLOUR))
  }
}
