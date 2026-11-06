/**
 * The fountain on the Expo's entrance plaza (OSM node/6993689786, amenity=fountain): a round basin, a low rim, a central jet and a ring of arcing jets. No photo (2026-11-05); sizes and look are estimates. Point entry.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, prism } from '../../kit.ts'

export const FOUNTAIN = { R: 9, RIM_W: 0.8, RIM_H: 0.7, WATER_Y: 0.5, JET_H: 9, JET_R: 0.22, RING_N: 10, RING_R: 5, RING_H: 3.2, SIDES: 20, SPRAY_R: 1.6 }

export const fountainExpo = (out: MeshBuilder, _fit: Fit): void => {
  const K = FOUNTAIN, stone = hex('#b9b5aa'), water = hex('#5d94a8'), spray = hex('#f2f7f8')
  prism(out, 0, 0, 0, K.RIM_H, K.R + K.RIM_W, K.SIDES, stone)
  prism(out, 0, 0, K.RIM_H, K.RIM_H + 0.01, K.R, K.SIDES, water)
  prism(out, 0, 0, K.WATER_Y, K.WATER_Y + K.JET_H, K.JET_R * 2.2, 6, spray, undefined, K.JET_R)
  prism(out, 0, 0, K.WATER_Y + K.JET_H - 0.2, K.WATER_Y + K.JET_H + 1.2, K.SPRAY_R * 0.3, 8, spray, undefined, K.SPRAY_R)
  for (let i = 0; i < K.RING_N; i++) {
    const a = (i / K.RING_N) * Math.PI * 2, x = Math.sin(a) * K.RING_R, z = Math.cos(a) * K.RING_R
    prism(out, x, z, K.WATER_Y, K.WATER_Y + K.RING_H, 0.3, 5, spray, undefined, 0.1)
    prism(out, x * 0.8, z * 0.8, K.WATER_Y + K.RING_H - 0.6, K.WATER_Y + K.RING_H + 0.1, 0.12, 4, spray)
  }
}
