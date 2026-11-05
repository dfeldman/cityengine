/**
 * THE MAISON DU LIBAN — JEAN VERNON & BRUNO PHILIPPE (1965): two seven-storey white slabs running north–south, the
 * long east one and a shorter west one, their narrow ends clad in pale ashlar with a stack of horizontal window strips
 * and a grid of small square vents. A single-storey link joins them across the front, its entrance under a
 * cantilevered concrete canopy on splayed V legs beside the east slab's stone end, the name in blue letters on that
 * end. West of the link a tall single-storey hall with a Mondrian grid of red, blue, yellow and green panels.
 * Refs: Commons "Maison du Liban @ Cité internationale universitaire @ Paris (32464601915/31652994603)",
 * "Lebanese house CIUP 2019-09-03" (docs/landmarks/refs/citeu/liban/).
 * Plan from OSM way 260185586 (cadastre). Local frame: −z toward bearing 4.5 (the service road and the entrance),
 * x toward 94.5; origin the bbox centre.
 */
import { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

const STONE: Rgb = hex('#d9d0bc'), RENDER: Rgb = hex('#e6e3da'), WIN: Rgb = hex('#3e4852'), GLASS: Rgb = hex('#4a5860')
const CONC: Rgb = hex('#b9b5ab'), ROOF: Rgb = hex('#8c8a84'), FRAME: Rgb = hex('#9da0a0'), LETTER: Rgb = hex('#3d5a9a')
const VENT: Rgb = hex('#7c7a72')
const PANELS: Rgb[] = [hex('#c43a32'), hex('#2f4f9a'), hex('#e3c43a'), hex('#2f7a6a')]

export const W = 58.0, D = 52.7
const GF = 3.3, FLOOR = 2.85, UPPER = 6                // glazed ground storey, room storeys
const TOP = GF + UPPER * FLOOR                          // ≈20.4
const PARAPET = 0.5
// slabs [x0, x1, z0, z1]
const EAST: number[] = [18.8, 29.0, -26.4, 25.1]
const WEST: number[] = [-16.0, -5.6, -2.3, 24.7]
const COLW = 2.7                                        // window module along the long sides
// the low pieces
const LINK: number[] = [-5.6, 18.8, -9.2, -0.6], LINK_H = 4.2
const STUB: number[] = [1.9, 6.6, -16.1, -9.2]
const PORCH: number[] = [14.0, 18.8, -16.1, -9.2]
const CANOPY: number[] = [10.6, 20.4, -19.5, -9.2], CANOPY_Y = 3.9
const HALL: number[] = [-29.0, -5.6, -14.4, -2.3], HALL_H = 6.8

/** a long white side: punched windows on a module, a dark glazed ground floor */
function longFace(out: MeshBuilder, f: '-x' | '+x', plane: number, z0: number, z1: number, g: number): void {
  const n = Math.max(1, Math.round((z1 - z0) / COLW)), step = (z1 - z0) / n
  for (let k = 0; k < n; k++) {
    const m = z0 + (k + 0.5) * step
    for (let j = 0; j < UPPER; j++) {
      const y = g + GF + j * FLOOR
      rectOn(out, f, plane, m - 0.55, m + 0.55, y + 0.9, y + 2.3, WIN, 0.05)
    }
  }
  rectOn(out, f, plane, z0 + 0.3, z1 - 0.3, g + 0.2, g + GF - 0.3, GLASS, 0.04)
}

/** a stone end: horizontal window strips off to one side, a column of small vents beside them */
function stoneEnd(out: MeshBuilder, f: '-z' | '+z', plane: number, x0: number, x1: number, g: number): void {
  rectOn(out, f, plane, x0, x1, g + GF * 0.3, g + TOP, STONE, 0.07)
  const wa = x0 + (x1 - x0) * 0.55, wb = x1 - 0.8
  for (let j = 0; j < UPPER; j++) {
    const y = g + GF + j * FLOOR
    rectOn(out, f, plane, wa, wb, y + 1.2, y + 1.95, WIN, 0.1)
    for (let v = 0; v < 3; v++) rectOn(out, f, plane, wa + 0.4 + v * 0.9, wa + 0.65 + v * 0.9, y + 0.35 + (v % 2) * 0.3, y + 0.6 + (v % 2) * 0.3, VENT, 0.1)
  }
}

function slab(out: MeshBuilder, b: number[], g: number): void {
  const [x0, x1, z0, z1] = b
  block(out, x0, x1, z0, z1, g - 0.3, g + TOP, RENDER)
  block(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, g + TOP, g + TOP + PARAPET, RENDER)
  block(out, x0 + 0.3, x1 - 0.3, z0 + 0.3, z1 - 0.3, g + TOP + PARAPET, g + TOP + PARAPET + 0.05, ROOF)
  longFace(out, '-x', x0, z0, z1, g)
  longFace(out, '+x', x1, z0, z1, g)
  stoneEnd(out, '-z', z0, x0, x1, g)
  stoneEnd(out, '+z', z1, x0, x1, g)
}

export function maisonLiban(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  slab(out, EAST, g)
  slab(out, WEST, g)
  // name in blue letters low on the east slab's front end
  for (let x = EAST[0] + 1.6; x < EAST[0] + 6.6; x += 0.5) rectOn(out, '-z', EAST[2], x, x + 0.32, g + 1.9, g + 2.25, LETTER, 0.12)
  // the low link, glazed front, concrete fascia
  for (const b of [LINK, STUB, PORCH]) {
    const [x0, x1, z0, z1] = b
    block(out, x0, x1, z0, z1, g - 0.3, g + LINK_H - 0.9, GLASS)
    block(out, x0 - 0.15, x1 + 0.15, z0 - 0.15, z1 + 0.15, g + LINK_H - 0.9, g + LINK_H, CONC)
    for (let x = x0 + 1.5; x < x1 - 0.5; x += 2.2) rectOn(out, '-z', z0, x - 0.05, x + 0.05, g, g + LINK_H - 0.9, FRAME, 0.03)
  }
  // the cantilevered canopy and its splayed V legs
  const [cx0, cx1, cz0, cz1] = CANOPY
  block(out, cx0, cx1, cz0, cz1, g + CANOPY_Y, g + CANOPY_Y + 0.45, CONC)
  const lz = cz0 + 2.2
  for (const x of [cx0 + 2.2, cx1 - 2.2]) {
    block(out, x - 0.2, x + 0.2, lz - 0.2, lz + 0.2, g, g + 0.6, CONC)
    for (const s of [-1, 1]) {   // two raked legs from one foot, stepped up in three pieces
      for (let k = 0; k < 3; k++) {
        const t = x + s * (0.35 + k * 0.45), y = g + 0.6 + k * 1.1
        block(out, t - 0.2, t + 0.2, lz - 0.2, lz + 0.2, y, y + 1.15, CONC)
      }
    }
  }
  block(out, cx0 + 2, cx1 - 2, cz0 + 2.5, cz1, g - 0.3, g + 0.45, CONC)   // entrance steps
  // the Mondrian hall: rendered box, its long front glazed in a coloured grid
  const [hx0, hx1, hz0, hz1] = HALL
  block(out, hx0, hx1, hz0, hz1, g - 0.3, g + HALL_H, RENDER)
  block(out, hx0 - 0.1, hx1 + 0.1, hz0 - 0.1, hz1 + 0.1, g + HALL_H, g + HALL_H + 0.3, CONC)
  for (const [f, z] of [['-z', hz0], ['+z', hz1]] as const) {
    rectOn(out, f, z, hx0 + 0.6, hx1 - 0.6, g + 0.3, g + HALL_H - 1.4, GLASS, 0.04)
    const n = 9, step = (hx1 - hx0 - 1.2) / n
    for (let k = 0; k < n; k++) {
      const a = hx0 + 0.6 + k * step
      rectOn(out, f, z, a - 0.07, a + 0.07, g + 0.3, g + HALL_H - 1.4, FRAME, 0.06)
      const c = PANELS[(k * 3) % PANELS.length], lo = g + 2.0 + (k % 3) * 0.7
      if (k % 2 === 0 || k === 5) rectOn(out, f, z, a + 0.15, a + step - 0.15, lo, lo + 1.5, c, 0.07)
    }
    rectOn(out, f, z, hx0 + 0.6, hx1 - 0.6, g + 2.0, g + 2.12, FRAME, 0.06)
  }
}
