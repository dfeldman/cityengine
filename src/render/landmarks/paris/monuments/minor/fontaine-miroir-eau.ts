import type { MeshBuilder } from '../../../../buildings.ts'
import { hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { ring } from '../common.ts'
import { basin, G } from './monument-kit.ts'

/*
 * LE MIROIR D'EAU, LA SEINE ET SES AFFLUENTS (square Jean-Perrin, 8e, west flank of the Grand Palais; Raoul Larche, 1900-1901;
 * Wikidata Q3076034): a low, lobed oval basin of white marble in the lawn, the water one shallow step below a broad rim, and the
 * sculpture groups (the Seine reclining among her tributaries, putti, reeds) seated ON the rim. The plan is OSM's own:
 * ways 66758129 (outer edge) and 66758138 (water), re-centred on the basin (11 x 9.5 m, measured off OSM). The rim height
 * (~0.6 m) and the group sizes are by eye against the people in Commons photos, not surveyed.
 * The groups are Modly (statues manifest `miroir-*`): this builder is the basin only.
 * Frame: builder x east, z north (rotateDeg 0), −z is the south edge, where the main group sits facing the basin.
 */
export const HX = 5.8
export const HZ = 5.0
export const RIM_H = 0.62            // top of the rim above the lawn
const MARBLE = hex('#cfcab9')
const WATER = hex('#4a6a60')
/** The two lobed rings, metres from the basin centre: [x, z, …]. */
const OUTER = [
  4.0, -2.8, 3.9, -3.8, 2.5, -3.6, 1.5, -4.4,
  0.0, -4.7, -1.6, -4.5, -2.6, -4.0, -3.6, -3.2,
  -4.9, -3.1, -4.8, -2.0, -5.4, -1.2, -5.6, -0.3,
  -5.5, 1.1, -4.9, 2.3, -4.4, 2.8, -4.3, 3.7,
  -2.8, 3.6, -1.8, 4.5, -0.4, 4.8, 1.2, 4.7,
  2.2, 4.1, 3.2, 3.1, 4.5, 3.0, 4.4, 2.0,
  5.1, 1.3, 5.5, 0.3, 5.4, -1.1, 4.8, -2.1,
]
const INNER = [
  3.0, -2.8, 2.0, -2.7, 1.2, -3.5, 0.2, -3.9,
  -1.3, -3.8, -2.4, -3.2, -2.8, -2.3, -3.8, -2.2,
  -3.8, -1.7, -4.7, -0.8, -4.9, 0.4, -4.4, 1.7,
  -3.5, 2.0, -3.4, 2.7, -2.6, 2.6, -1.5, 3.6,
  -0.6, 3.8, 0.8, 3.7, 1.8, 3.3, 2.6, 2.2,
  3.5, 2.1, 3.4, 1.2, 4.3, 0.7, 4.4, -0.4,
  4.1, -1.5, 3.1, -2.0,
]
/** Where the main (south) group stands on the rim, in the builder frame (statues manifest `at`, y = G + RIM_H). */
export const GROUP_AT: [number, number, number] = [-0.3, G + RIM_H, -3.9]

function draw(q: MeshBuilder): void {
  const outer = ring(OUTER)
  const inner = ring(INNER)
  // a thin stone kerb round the foot, then the basin: wall to the rim, the rim as a flat band, water below
  const kerb = outer.map((p) => ({ x: p.x * 1.04, z: p.z * 1.04 }))
  basin(q, kerb, outer, G, G + 0.06, shade(MARBLE, 0.9), shade(MARBLE, 0.9))
  basin(q, outer, inner, G + 0.05, G + RIM_H, MARBLE, WATER)
}

export function fontaineMiroirEau(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
