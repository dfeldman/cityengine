import type { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { ALL, archOn, fitted, rectOn } from '../palaces/common.ts'
import { domeOf, onion, orthodoxCross } from './common.ts'

/*
 * THE CATHÉDRALE DE LA SAINTE-TRINITÉ (Jean-Michel Wilmotte, 2016), the Russian Orthodox cathedral on the Quai Branly by
 * the Pont de l'Alma: what a rider sees over the trees of the quai and along the Avenue Rapp is FIVE GREAT ONIONS of matt
 * gold and palladium, pale and nearly silver in the light, warm at the foot where they catch the stone — the big one in
 * the middle on its drum, the four small ones at the corners, each drawn up to a point and a three-barred cross. Under
 * them there is no ornament at all: a square block of pale Burgundy stone, a corner block at each of the four angles
 * banded in rough STRATA of Massangis, the bay between them set back and smooth, with a round-headed door and three
 * slits of window over it. (That east face, the Avenue Rapp's, is the one in the photograph; the other three doors are
 * by symmetry, not confirmed.)
 *
 * In the city OSM's outline (way 449077939, height 24) and its five `onion` parts came out as a block with five stubs. The
 * model replaces the outline and the parts; the Centre Culturel and the parish centre beside it stay the city's. Frame:
 * OSM's outline turned to the Avenue Rapp, −z toward bearing 79; a plan of four equal arms (osmium, 2026-10-30).
 */
const HX = 11.45
const HZ = 11.55

const STONE: Rgb = hex('#dfd8c8')
const GOLD: Rgb = hex('#f5d67c')
const CROSS: Rgb = hex('#e8d9a6')
const DOOR: Rgb = hex('#4d3a2a')
const SLIT: Rgb = hex('#1d1f24')
/** The plane of the set-back bays, the corner blocks' reach in from each angle. */
const BAY = 9.7
const CORNER = 3.8
const EAVES = 17.8
const CORNER_TOP = 19.6

/** The courses of strata up a corner block: dark and pale, set irregularly (the stone's own beds), as in the photograph. */
const STRATA: [number, number, number][] = [
  [0.5, 1.1, 0.86], [1.5, 1.7, 1.05], [2.3, 2.5, 0.84], [3.0, 3.6, 1.04], [4.0, 4.15, 0.82], [4.8, 5.3, 0.88], [5.9, 6.05, 1.05],
  [6.6, 6.8, 0.84], [7.5, 8.2, 1.04], [8.7, 8.85, 0.82], [9.4, 9.9, 0.88], [10.5, 10.65, 0.83], [11.2, 11.9, 1.05], [12.4, 12.6, 0.84],
  [13.3, 13.5, 1.05], [14.1, 14.7, 0.87], [15.3, 15.45, 0.82], [16.1, 16.6, 1.04], [17.2, 17.4, 0.84], [18.1, 18.8, 0.88],
]

export function sainteTrinite(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => trinite(q))
}

function trinite(out: MeshBuilder): void {
  // the body between the corner blocks, and the corner blocks standing a little higher
  block(out, -BAY, BAY, -BAY, BAY, 0, EAVES, STONE)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x0 = Math.min(sx * CORNER, sx * HX)
      const x1 = Math.max(sx * CORNER, sx * HX)
      const z0 = Math.min(sz * CORNER, sz * HX)
      const z1 = Math.max(sz * CORNER, sz * HX)
      block(out, x0, x1, z0, z1, 0, CORNER_TOP, STONE)
      block(out, x0 - 0.06, x1 + 0.06, z0 - 0.06, z1 + 0.06, CORNER_TOP - 0.22, CORNER_TOP, shade(STONE, 1.04))
      // the strata, on the block's two outer faces and its two returns into the bays
      for (const [y0, y1, f] of STRATA) {
        const c = shade(STONE, f)
        rectOn(out, sz < 0 ? '-z' : '+z', sz * HX, x0, x1, y0, y1, c, 0.05)
        rectOn(out, sx < 0 ? '-x' : '+x', sx * HX, z0, z1, y0, y1, c, 0.05)
        rectOn(out, sz < 0 ? '-z' : '+z', sz * CORNER, x0, x1, y0, y1, c, 0.05)
        rectOn(out, sx < 0 ? '-x' : '+x', sx * CORNER, z0, z1, y0, y1, c, 0.05)
      }
    }
  }
  // the four set-back bays: a coping, the round-headed door, three slits of window over it; a slit in each block's flank
  for (const f of ALL) {
    const s = f === '-z' || f === '-x' ? -1 : 1
    const plane = s * BAY
    rectOn(out, f, plane, -CORNER, CORNER, EAVES - 0.25, EAVES, shade(STONE, 1.04), 0.08)
    archOn(out, f, plane, 0, 0, 3.0, 5.2, shade(STONE, 0.82), 0.06)
    archOn(out, f, plane, 0, 0, 2.5, 4.8, DOOR, 0.09)
    for (const t of [-1.25, 0, 1.25]) rectOn(out, f, plane, t - 0.16, t + 0.16, 7.8, 15.2, SLIT, 0.06)
  }

  // THE ONIONS. The middle one (OSM: 5.2 m round) on its drum, to 37 m at the cross (Wikipedia); the four at the corners
  // (2.5 m round) straight on their blocks
  prism(out, 0, 0, EAVES, 23.0, 5.5, 24, STONE, 0, 5.5, false)
  prism(out, 0, 0, 22.8, 23.2, 5.75, 24, shade(STONE, 1.04), 0, 5.75, true)
  bulb(out, 0, 0, 23.2, 5.2, 9.6, 4.2)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) bulb(out, sx * 7.65, sz * 7.65, CORNER_TOP, 2.55, 5.6, 2.6)
  }
}

/** One gilt onion from y0, `r` round at the swell, `h` to its point; the stem and the three-barred cross on it. */
function bulb(out: MeshBuilder, x: number, z: number, y0: number, r: number, h: number, cross: number): void {
  // (a ring of the same gold darkened under the foot: it is the warm line where the bulb meets the stone)
  prism(out, x, z, y0, y0 + 0.2, r * 0.8, 20, shade(GOLD, 0.78), 0, r * 0.76, false)
  domeOf(out, x, z, y0 + 0.2, r, h - 0.2, GOLD, onion, { sides: r > 4 ? 28 : 20, steps: 16 })
  orthodoxCross(out, x, z, y0 + h - 0.15, cross, CROSS)
}
