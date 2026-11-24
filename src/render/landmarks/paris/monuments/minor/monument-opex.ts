import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { pavedPatch } from './monument-kit.ts'

/*
 * LE MONUMENT AUX MORTS POUR LA FRANCE EN OPERATIONS EXTERIEURES (parc André-Citroën, 15e; Wikidata Q74555507; inaugurated
 * 11 Nov 2019; Stéphane Vigny): a square slate-grey plaza, 37 m a side (OSM way 672001632, corners measured), edged by a
 * low black-granite planted wall whose inner face carries the names of the dead in gilt rows, a tall flagpole with the
 * tricolour, and six bronze soldiers carrying an invisible coffin (the Modly group, attached at the plaza's middle).
 * Read off Commons photos (Djiril5c, Aug 2022, 1 and 3; "Monument OPEX - Paris 15e"). Wall height, thickness, entrance gap
 * and the flag's place are by eye. Frame: x, z across the square (axis-aligned; the entry's rotateDeg turns it to the
 * OSM square), y up from the ground (G).
 */
export const HX = 18.5
export const HZ = 18.5

// tunables (metres)
const WALL_T = 1.5, WALL_H = 0.85         // the ring wall: thickness, height
const GAP_W = 5                           // entrance gap, centred on the −z side
const PLAZA_T = 0.45                      // paving slab above G
const POLE_X = -3.6, POLE_Z = -2.2, POLE_H = 8.5, FLAG_W = 1.7, FLAG_H = 1.1
const NAMES = { rows: 3, rowH: 0.1, rowGap: 0.14, y0: 0.18 }

const GRANITE: Rgb = hex('#26272a'), SLATE: Rgb = hex('#7d8084'), GRASS: Rgb = hex('#58724a'), GILT: Rgb = hex('#b9a064')
const BLUE: Rgb = hex('#1f3a8a'), WHITE: Rgb = hex('#e8e8e8'), RED: Rgb = hex('#c4222b'), STEEL: Rgb = hex('#b8bcc0')

/** Where the soldiers stand, in the entry's frame (statues attach at this x, z; y = ATTACH_Y). */
export const GROUP_AT: [number, number] = [0, 0]
export const ATTACH_Y = G + PLAZA_T

function hash(i: number): number { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }

/** Rows of gilt name-blocks on a wall face running along `axis` from a to b at fixed `at`, facing `dir` (+1 toward +perp). */
function names(q: MeshBuilder, axis: 'x' | 'z', a: number, b: number, at: number, dir: number, seed: number): void {
  const d = 0.012
  for (let r = 0; r < NAMES.rows; r++) {
    const y = G + NAMES.y0 + r * (NAMES.rowH + NAMES.rowGap)
    let t = a + 0.25, i = 0
    while (t < b - 0.3) {
      const w = 0.25 + hash(seed + r * 131 + i) * 0.6
      const t1 = Math.min(t + w, b - 0.2)
      const p0 = at, p1 = at + dir * d
      if (axis === 'x') block(q, t, t1, Math.min(p0, p1), Math.max(p0, p1), y, y + NAMES.rowH, GILT)
      else block(q, Math.min(p0, p1), Math.max(p0, p1), t, t1, y, y + NAMES.rowH, GILT)
      t = t1 + 0.12 + hash(seed + i * 7 + r) * 0.1
      i++
    }
  }
}

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const hi = HX - WALL_T
  pavedPatch(q, -HX, HX, -HZ, HZ, y(-0.3), y(PLAZA_T), SLATE, 1.5)
  // ring wall: four runs (the −z one split by the entrance gap); granite sides, a planted top
  const run = (x0: number, x1: number, z0: number, z1: number): void => {
    block(q, x0, x1, z0, z1, y(0), y(WALL_H), GRANITE)
    block(q, x0 + 0.12, x1 - 0.12, z0 + 0.12, z1 - 0.12, y(WALL_H), y(WALL_H + 0.1), GRASS)
  }
  const g = GAP_W / 2
  run(-HX, -g, -HZ, -HZ + WALL_T)
  run(g, HX, -HZ, -HZ + WALL_T)
  run(-HX, HX, HZ - WALL_T, HZ)
  run(-HX, -HX + WALL_T, -HZ + WALL_T, HZ - WALL_T)
  run(HX - WALL_T, HX, -HZ + WALL_T, HZ - WALL_T)
  // names on the inner faces (not at the gap)
  names(q, 'x', -hi, -g, -HZ + WALL_T, 1, 11)
  names(q, 'x', g, hi, -HZ + WALL_T, 1, 23)
  names(q, 'x', -hi, hi, HZ - WALL_T, -1, 37)
  names(q, 'z', -hi, hi, -HX + WALL_T, 1, 53)
  names(q, 'z', -hi, hi, HX - WALL_T, -1, 71)
  // flagpole and tricolour
  block(q, POLE_X - 0.06, POLE_X + 0.06, POLE_Z - 0.06, POLE_Z + 0.06, y(0), y(POLE_H), STEEL)
  const fy = POLE_H - FLAG_H - 0.15, fw = FLAG_W / 3
  ;[BLUE, WHITE, RED].forEach((c, i) => block(q, POLE_X + 0.07 + i * fw, POLE_X + 0.07 + (i + 1) * fw, POLE_Z - 0.015, POLE_Z + 0.015, y(fy), y(fy + FLAG_H), c))
  void shade
}

export function monumentOpex(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
