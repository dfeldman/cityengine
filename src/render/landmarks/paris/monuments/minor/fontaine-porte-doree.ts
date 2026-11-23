import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * LA FONTAINE DE LA PORTE DORÉE (place Édouard-Renard, 12e; 1931 for the Exposition coloniale, Léon-Ernest Drivier's gilded
 * bronze Athena "La France apportant la paix et la prospérité aux colonies" on a granite column; Wikidata Q3076201; OSM way
 * 130888780 = the water, natural=water + barrier=wall): a cascade of stepped rectangular basins in pale stone running ~68 m
 * down a lawn between rows of palms, the column and the gilded goddess at the high (south-east) end. The goddess is Modly's
 * (statues manifest `porte-doree-athena`); the cascade, the column and the gilt base are procedural.
 * Frame: x along the cascade from its foot (-x, north-west) to the column (+x, bearing 118.7 deg); z across; y up from the base,
 * the ground at G. OSM's water outline gives the 7 steps of ~8.2 m, 4 m of water in a channel and the column's node (+33.6);
 * the ground climbs 2.2 m foot to column (terrain). Widths of the cheeks, heights and the column are read off Commons photos
 * ("Fontaine de la Porte-Dorée.JPG", "Athena porte dorée2.JPG") against the plinth, not surveyed.
 */
export const HX = 36.5
export const HZ = 5.5

// tunables (metres)
const X_FOOT = -34.2             // the cascade's foot
const STEPS = 7, STEP_LEN = 8.2  // the channel basins
const X_TOP = X_FOOT + STEPS * STEP_LEN // = 23.2: where the top pool begins
const TOP_POOL_LEN = 8, TOP_POOL_W = 8  // the wide pool under the column
const COL_X = 33.6               // the column's axis
const WATER_W = 4.0              // the channel's water width
const CHEEK = 1.1                // the stone beside the water, each side
const RISE_FOOT = 0.0, RISE_TOP = 2.2 // the terrain's climb under the cascade (fixed here so the statue's `at` is static)
const WATER_BELOW = 0.12         // water under the rim
const RIM_ABOVE = 0.55           // the rim over the pool's own ground
const MIN_DROP = 0.24            // least fall between pools
const PED_W = 1.7, PED_H = 3.4   // the granite column
const GILT_H = [0.45, 0.45], GILT_W = [1.5, 1.2]
const PLAT_W = 2.9, PLAT_H = 0.4

const STONE: Rgb = hex('#cdc6b2')
const WATER: Rgb = hex('#7fa3ad')
const FALL: Rgb = hex('#dbe8ea')
const GRANITE: Rgb = hex('#b6b9b2')
const GILT: Rgb = hex('#d9a92c')

/** The ground under the cascade at x (a straight climb), above the base. */
const ground = (x: number): number => G + RISE_FOOT + ((RISE_TOP - RISE_FOOT) * (x - X_FOOT)) / (COL_X - X_FOOT)

/** Pool levels (water surface) from the foot: each at least MIN_DROP over the one before, and a rim's height over the ground. */
function levels(): number[] {
  const out: number[] = []
  for (let k = 0; k <= STEPS; k++) {
    const xm = k < STEPS ? X_FOOT + (k + 0.5) * STEP_LEN : X_TOP + TOP_POOL_LEN / 2
    const w = ground(xm) + RIM_ABOVE - WATER_BELOW
    out.push(k ? Math.max(w, out[k - 1] + MIN_DROP) : w)
  }
  return out
}
const LEVELS = levels()
/** Where the goddess stands: on the gilt base over the granite column over its platform (landmark frame). */
export const STATUE_AT: [number, number, number] = [COL_X, LEVELS[STEPS] + WATER_BELOW + 0.02 + PLAT_H + PED_H + GILT_H[0] + GILT_H[1], 0]

function pool(q: MeshBuilder, x0: number, x1: number, w: number, wl: number, cheek: number, skirt: number): void {
  const rim = wl + WATER_BELOW
  // floor and water
  block(q, x0, x1, -w / 2, w / 2, skirt, wl - 0.03, shade(STONE, 0.85))
  block(q, x0, x1, -w / 2, w / 2, wl - 0.03, wl, WATER)
  // the two cheeks with a coping a hand proud
  for (const s of [-1, 1]) {
    const a = s * w / 2, b = s * (w / 2 + cheek)
    block(q, x0, x1, Math.min(a, b), Math.max(a, b), skirt, rim - 0.07, STONE)
    block(q, x0 - 0.03, x1 + 0.03, Math.min(a, b) - (s < 0 ? 0.06 : 0), Math.max(a, b) + (s > 0 ? 0.06 : 0), rim - 0.07, rim, shade(STONE, 1.07))
  }
}

function draw(q: MeshBuilder): void {
  const SK = G - 0.5
  // the foot: a broad parapet across the cascade's end
  const w0 = WATER_W / 2 + CHEEK
  block(q, X_FOOT - 1.0, X_FOOT, -w0 - 1.2, w0 + 1.2, SK, LEVELS[0] + WATER_BELOW + 0.1, STONE)
  block(q, X_FOOT - 1.05, X_FOOT + 0.03, -w0 - 1.26, w0 + 1.26, LEVELS[0] + WATER_BELOW + 0.1, LEVELS[0] + WATER_BELOW + 0.18, shade(STONE, 1.07))
  for (let k = 0; k < STEPS; k++) {
    const x0 = X_FOOT + k * STEP_LEN, x1 = x0 + STEP_LEN
    pool(q, x0, x1, WATER_W, LEVELS[k], CHEEK, SK)
    // the end block of each step: a wider pier on either side of the weir
    if (k) for (const s of [-1, 1]) {
      const a = s * (WATER_W / 2 + CHEEK), b = s * (WATER_W / 2 + CHEEK + 0.7)
      block(q, x0 - 0.9, x0 + 0.2, Math.min(a, b), Math.max(a, b), SK, LEVELS[k] + WATER_BELOW + 0.2, shade(STONE, 0.97))
    }
    // the weir at the foot of each step above the first: a low wall the water spills over, and the falling sheet
    if (k) {
      block(q, x0, x0 + 0.35, -WATER_W / 2, WATER_W / 2, SK, LEVELS[k] + 0.04, STONE)
      block(q, x0 - 0.04, x0, -WATER_W / 2 + 0.2, WATER_W / 2 - 0.2, LEVELS[k - 1] - 0.02, LEVELS[k] + 0.02, FALL)
    }
  }
  // the top pool, wide, under the column
  pool(q, X_TOP, X_TOP + TOP_POOL_LEN, TOP_POOL_W, LEVELS[STEPS], CHEEK, SK)
  block(q, X_TOP, X_TOP + 0.35, -WATER_W / 2, WATER_W / 2, SK, LEVELS[STEPS] + 0.04, STONE)
  block(q, X_TOP - 0.04, X_TOP, -WATER_W / 2 + 0.2, WATER_W / 2 - 0.2, LEVELS[STEPS - 1] - 0.02, LEVELS[STEPS] + 0.02, FALL)
  // the platform, the granite column, the gilded base
  const yTop = LEVELS[STEPS] + WATER_BELOW + 0.02
  block(q, X_TOP + TOP_POOL_LEN, COL_X + PLAT_W / 2 + 1.4, -TOP_POOL_W / 2 - CHEEK, TOP_POOL_W / 2 + CHEEK, SK, yTop, STONE)
  block(q, COL_X - PLAT_W / 2, COL_X + PLAT_W / 2, -PLAT_W / 2, PLAT_W / 2, yTop, yTop + PLAT_H, shade(STONE, 1.05))
  const yc = yTop + PLAT_H
  block(q, COL_X - PED_W / 2, COL_X + PED_W / 2, -PED_W / 2, PED_W / 2, yc, yc + PED_H, GRANITE)
  block(q, COL_X - PED_W / 2 - 0.08, COL_X + PED_W / 2 + 0.08, -PED_W / 2 - 0.08, PED_W / 2 + 0.08, yc + PED_H - 0.12, yc + PED_H, shade(GRANITE, 1.06))
  let y = yc + PED_H
  GILT_H.forEach((h, i) => {
    const hw = GILT_W[i] / 2
    block(q, COL_X - hw, COL_X + hw, -hw, hw, y, y + h, GILT)
    y += h
  })
}

export function fontainePorteDoree(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
