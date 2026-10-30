import type { MeshBuilder } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { ALL, archOn, fitted, rectOn } from '../palaces/common.ts'
import { pointedOn } from './churches.ts'
import { FIXED } from './common.ts'

/*
 * THE TOUR JEAN-SANS-PEUR (1409–11), Rue Étienne-Marcel, the last piece of the Hôtel de Bourgogne, which the Duke of Burgundy
 * built on to his house after having the Duke of Orleans murdered: a square Gothic keep in a school's yard, 27 m to the
 * eaves and ridge, of plain limestone, darker and more patched below. Three stages between string courses — a door under a small
 * ogee hood, a tall pointed window to each face, two small square windows above — then a heavy row of stone corbels with a
 * walk on them and a steep little hip of red tile. Against its west side stands a tall sheer wall of rubble, what is left of
 * the house.
 *
 * OSM has only a node (250657151, height 27); the school (relation 550212, 4 levels) draws its own outline round it. The model
 * stands on the node, above the school's roofs, without claiming the school. Its size and the rubble wall are from two Commons
 * photographs, and its bearing from the school's plan and the street: the east side was not seen.
 */
const HX = 4.5
const HZ = 4.5

const STONE: Rgb = hex('#c8bea6')
const LOW: Rgb = hex('#a69c86')
const PALE: Rgb = hex('#d5ccb6')
const RUBBLE: Rgb = hex('#8f8676')
const TILE: Rgb = hex('#a2553c')
const DARK: Rgb = hex('#1f1f22')

export function jeanSansPeur(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => tour(q))
}

function tour(out: MeshBuilder): void {
  // the stages, stepping in a little at each string course
  block(out, -HX, HX, -HZ, HZ, 0, 8.6, LOW)
  block(out, -HX + 0.12, HX - 0.12, -HZ + 0.12, HZ - 0.12, 8.6, 15.8, STONE)
  block(out, -HX + 0.2, HX - 0.2, -HZ + 0.2, HZ - 0.2, 15.8, 23.4, PALE)
  for (const y of [8.4, 15.6]) block(out, -HX - 0.12, HX + 0.12, -HZ - 0.12, HZ + 0.12, y, y + 0.4, shade(PALE, 1.03))
  for (const f of ALL) {
    const s = f === '-z' || f === '-x' ? -1 : 1
    const plane = s * (HX - 0.12)
    // the tall pointed window in the middle stage, the two small windows of the top one
    pointedOn(out, f, plane, 0, 9.5, 2.5, 5.3, shade(STONE, 0.62), 0.06)
    pointedOn(out, f, plane, 0, 9.8, 2.0, 4.8, DARK, 0.1)
    for (const y of [17.6, 21.0]) {
      rectOn(out, f, s * (HX - 0.2), -0.62, 0.62, y, y + 1.3, shade(PALE, 0.72), 0.05)
      rectOn(out, f, s * (HX - 0.2), -0.46, 0.46, y + 0.1, y + 1.2, DARK, 0.08)
    }
  }
  // the door on the street side, and its little ogee hood
  archOn(out, '-z', -HZ, 0, 0, 2.2, 3.5, shade(LOW, 0.72), 0.06)
  archOn(out, '-z', -HZ, 0, 0.1, 1.5, 3.0, hex('#3b2c22'), 0.1)
  // the machicolation: a heavy row of corbels, the walk's parapet on them, the tile hip
  const n = 6
  for (const f of ALL) {
    for (let i = 0; i < n; i++) {
      const t = -HX + 0.4 + ((2 * HX - 0.8) * (i + 0.5)) / n
      const d = HX - 0.05
      const [x, z] = f === '-z' ? [t, -d] : f === '+z' ? [t, d] : f === '-x' ? [-d, t] : [d, t]
      box(out, x, 23.7, z, f === '-z' || f === '+z' ? 0.23 : 0.45, 0.42, f === '-z' || f === '+z' ? 0.45 : 0.23, STONE, FIXED)
    }
  }
  block(out, -HX - 0.5, HX + 0.5, -HZ - 0.5, HZ + 0.5, 24.1, 25.3, PALE)
  block(out, -HX - 0.6, HX + 0.6, -HZ - 0.6, HZ + 0.6, 25.3, 25.45, shade(PALE, 0.9))
  roof(out, -HX - 0.3, HX + 0.3, -HZ - 0.3, HZ + 0.3, 25.45, 2.2, 3.2, 1.8, TILE)

  // the wall of rubble on the west, the old house's, sheer to 21 m with its few small windows
  block(out, -14.5, -HX, 2.3, HZ, 0, 21.0, RUBBLE)
  for (const [x, y] of [[-6.2, 16.5], [-10.5, 15.0], [-7, 9.5], [-11.5, 5.5], [-6.4, 4.8]]) rectOn(out, '-z', 2.3, x - 0.25, x + 0.25, y, y + 0.7, DARK, 0.05)
  // a pale masonry buttress in the angle
  block(out, -HX - 1.2, -HX, 1.0, 2.3, 0, 12.5, PALE)
}
