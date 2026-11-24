import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * LE MONUMENT AUX COMBATTANTS DE LA CAMPAGNE DE TUNISIE 1942-1943 (cours Albert-1er, Paris 8e/16e; Wikidata Q23639904):
 * a low flat memorial in the lawn in front of a clipped hedge: three stacked slabs of pink granite stepping up at the west
 * end, an inscription and a small bronze portrait medallion on the top slab, and a long green (patinated bronze) table
 * running east at the height of the first slab, with a green iron railing along its south side and east end. No figures
 * (nothing for Modly). Frame: x east, z north, y up from the ground (G). Dimensions are scaled by eye off Commons
 * photographs (2015 set), not surveyed.
 */
export const HX = 3.1
export const HZ = 1.5

// tunables (metres)
const X_W = -2.8, X_JOIN = -0.3, X_E = 2.8             // west end, where the tiers end and the green table starts, east end
const Z_S = -1.1, Z_N = 1.1                              // south and north edges
const TIER_H = 0.32                                      // each pink slab
const TIER2_X1 = -0.9, TIER2_Z0 = -0.7                   // second slab: its east end and south edge
const TIER3_X1 = -1.5, TIER3_Z0 = -0.3                   // top slab
const TABLE_H = 0.42                                     // green table top above the ground
const PLINTH_H = 0.12, PLINTH_OUT = 0.12                 // granite kerb under everything
const RAIL_H = 0.85, RAIL_W = 0.04, POST_STEP = 1.4
const MED_R = 0.2, MED_AT: [number, number] = [-2.15, 0.55]

const PINK: Rgb = hex('#9a6a5e')
const GREEN: Rgb = hex('#5f8a72')
const BRONZE: Rgb = hex('#4a4a38')
const IRON: Rgb = hex('#2f5a4a')
const LETTER: Rgb = hex('#ece6d6')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // granite kerb all round
  block(q, X_W - PLINTH_OUT, X_E + PLINTH_OUT, Z_S - PLINTH_OUT, Z_N + PLINTH_OUT, y(0), y(PLINTH_H), shade(PINK, 0.8))
  // the three stepped slabs, each with a paler edge band under a polished top
  const slab = (x1: number, z0: number, h0: number): void => {
    block(q, X_W, x1, z0, Z_N, y(h0), y(h0 + TIER_H), shade(PINK, 0.85))
    block(q, X_W - 0.02, x1 + 0.02, z0 - 0.02, Z_N + 0.02, y(h0 + TIER_H - 0.07), y(h0 + TIER_H), PINK)
  }
  slab(X_JOIN, Z_S, PLINTH_H)
  slab(TIER2_X1, TIER2_Z0, PLINTH_H + TIER_H)
  slab(TIER3_X1, TIER3_Z0, PLINTH_H + 2 * TIER_H)
  // green table: a granite frame round a patinated top
  const th = TABLE_H
  block(q, X_JOIN, X_E, Z_S, Z_N, y(PLINTH_H), y(th), shade(PINK, 0.85))
  block(q, X_JOIN + 0.12, X_E - 0.12, Z_S + 0.12, Z_N - 0.12, y(th), y(th + 0.03), GREEN)
  // inscription strips on the second slab and its riser (white lettering)
  const t2 = PLINTH_H + 2 * TIER_H
  block(q, X_W + 0.3, TIER2_X1 - 0.2, TIER2_Z0 + 0.25, TIER2_Z0 + 0.4, y(t2), y(t2 + 0.005), LETTER)
  block(q, X_W + 0.3, TIER2_X1 - 0.6, TIER2_Z0 + 0.55, TIER2_Z0 + 0.65, y(t2), y(t2 + 0.005), LETTER)
  // bronze portrait medallion on the top slab (a shallow relief, tilted a little toward the viewer)
  const t3 = PLINTH_H + 3 * TIER_H
  const [mx, mz] = MED_AT
  block(q, mx - MED_R, mx + MED_R, mz - MED_R, mz + MED_R, y(t3), y(t3 + 0.04), BRONZE)
  block(q, mx - MED_R * 0.6, mx + MED_R * 0.6, mz - MED_R * 0.7, mz + MED_R * 0.7, y(t3 + 0.04), y(t3 + 0.075), shade(BRONZE, 1.2))
  // green iron railing along the south side and the east end, outside the kerb
  const rz = Z_S - PLINTH_OUT - 0.12
  const re = X_E + PLINTH_OUT + 0.12
  const rail = (x0: number, x1: number, z0: number, z1: number): void => {
    block(q, x0, x1, z0, z1, y(RAIL_H - RAIL_W), y(RAIL_H), IRON)
    block(q, x0, x1, z0, z1, y(0.25), y(0.25 + RAIL_W), IRON)
  }
  rail(X_W - PLINTH_OUT, re, rz, rz + RAIL_W)
  rail(re - RAIL_W, re, rz, Z_N + PLINTH_OUT)
  for (let x = X_W - PLINTH_OUT; x <= re + 0.01; x += POST_STEP) block(q, x, x + RAIL_W, rz, rz + RAIL_W, y(0), y(RAIL_H), IRON)
  for (let z = rz; z <= Z_N + PLINTH_OUT; z += POST_STEP) block(q, re - RAIL_W, re, z, z + RAIL_W, y(0), y(RAIL_H), IRON)
}

export function monumentCampagneTunisie(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
