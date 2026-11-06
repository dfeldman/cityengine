/**
 * Pavillon 7 / Paris Convention Centre (OSM way/23811464, ~185 x 186 m; rebuilt for 2017-): a glass-and-metal box, a pale metal roof with raised
 * glazed rooflight strips. No photo read (2026-11-05); colours and the 28 m height are estimates.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, hex } from '../../kit.ts'
import { GLASS, hallWalls, ringOf } from './hall.ts'

export const PAV7 = { BASE: 6, STEP: 40, MULL: 6, LIGHTS: 6, LIGHT_W: 0.06, LIGHT_UP: 1.4, PARAPET: 1.2 }

export const pavilion7 = (out: MeshBuilder, fit: Fit): void => {
  const K = PAV7, ring = ringOf(fit), H = fit.height
  hallWalls(out, ring, () => H, { base: K.BASE, clad: hex('#9aa2a6'), glass: hex('#5f7f90'), step: K.STEP, mull: K.MULL, mullColour: hex('#d5d9db') })
  capPolygon(out, ring, H, hex('#d9dcdd'), 0)
  // rooflight strips along the long axis
  const w = fit.hz * K.LIGHT_W * 2
  for (let i = 0; i < K.LIGHTS; i++) {
    const z = -fit.hz * 0.7 + (i / (K.LIGHTS - 1)) * fit.hz * 1.4
    box(out, 0, H + K.LIGHT_UP / 2, z, fit.hx * 0.7, K.LIGHT_UP / 2, w / 2, hex('#6e8fa0'), GLASS)
  }
}
