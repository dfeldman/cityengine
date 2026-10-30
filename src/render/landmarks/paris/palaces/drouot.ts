import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts } from './common.ts'
import { baysOf, wallOn, type Wall } from './wall.ts'

/** the design footprint: OSM relation 1085247's box turned to the Rue Drouot (local −z faces bearing 98) */
const HX = 35
const HZ = 28.8
const EAVES = 22.5

/** The relation's outer ring in the model's frame, its smallest jogs left out. */
const PLAN = pts([
  -22.8, 28.8, -27.9, 24.5, -35, -23, -29.2, -28.8, 21.9, -28.8, 21.9, -12.4, 35, -12.2, 34.5, 25.3, 33.5, 27.1, 9.6, 26, 9.6, 28.3,
])

interface Tones { metal: Rgb; rib: Rgb; stone: Rgb; glass: Rgb; red: Rgb; white: Rgb }

/**
 * L'Hôtel Drouot, the Paris auction house, 9 Rue Drouot, on the corner of the Rue Rossini: rebuilt 1976–80 (Jean-Jacques Fernier and André
 * Biro) behind a front like nothing else in the 9th. What a rider sees:
 *
 * - the dark METAL BAYS, standing proud of the wall and running the full height, closely ribbed like a radiator, a row of
 *   upright oval lights across their heads;
 * - between them the narrow pale recesses, and the long RED BANNERS hung down them with a white medallion each;
 * - at the foot the glazed salerooms' lobby, and on the cut corner the red canopy over the door.
 *
 * Plan is OSM's. Commons "P1030038 Paris IX Rue Drouot" (the Rue Drouot from the Rossini corner), heights scaled off the
 * people on the pavement. Only that one photograph: the bays' number and the Rue Rossini's being the same as the Rue Drouot's are
 * readings of it, and the back on the Rue Chauchat is a plain mass.
 */
export function drouot(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#cfc6b2', '#4a4d4f')
  const t: Tones = { metal: hex('#46494b'), rib: hex('#6d7174'), stone: p.stone, glass: [0.19, 0.22, 0.24], red: hex('#a5262c'), white: hex('#e6e1d4') }
  extrude(out, [PLAN], p, { eaves: EAVES, storeys: [{ y: 4, h: 2 }, { y: 8, h: 2 }, { y: 12, h: 2 }, { y: 16, h: 2 }], bay: 3.6, win: 1.5, rise: 1.8, inset: 2.2, dormers: false })
  // ---- the two metal fronts, in ring order
  front(wallOn(out, { x: -29.2, z: -28.8 }, { x: 21.9, z: -28.8 }), t)
  front(wallOn(out, { x: -27.9, z: 24.5 }, { x: -35, z: -23 }), t)
  // ---- the cut corner: the door under the canopy
  const c = wallOn(out, { x: -35, z: -23 }, { x: -29.2, z: -28.8 })
  c.rect(0, c.L, 0, EAVES, shade(t.metal, 0.9), 0.08)
  c.rect(0.5, c.L - 0.5, 0.1, 3.7, t.glass, 0.12)
  c.slab(-1.4, c.L + 1.4, 3.7, 4.5, 2.6, t.red)
  c.slab(-1.2, c.L + 1.2, 4.5, 5, 2, shade(t.red, 0.8))
  for (const y of [7, 10.5, 14, 17.5]) c.rect(1, c.L - 1, y, y + 2.2, t.glass, 0.12)
}

function front(w: Wall, t: Tones): void {
  const { mids, step } = baysOf(w.L, 8.4, 0.6)
  // the lobby's glass along the foot, under its beam
  w.rect(0, w.L, 0, 3.7, t.glass, 0.1)
  for (let u = 0.6; u < w.L; u += 2.1) w.rect(u - 0.05, u + 0.05, 0, 3.7, t.metal, 0.13)
  w.slab(0, w.L, 3.7, 4.5, 0.35, shade(t.metal, 0.8))
  // the pale wall the bays stand in front of
  w.rect(0, w.L, 4.5, EAVES, t.stone, 0.1)
  mids.forEach((m, i) => {
    const hw = step * 0.33
    w.slab(m - hw, m + hw, 4.5, EAVES - 0.2, 1.1, t.metal)
    // the ribs, close, in pairs, standing out from the bay
    for (let u = -hw + 0.32; u < hw - 0.1; u += 0.62) w.slab(m + u - 0.1, m + u + 0.1, 4.8, EAVES - 3.2, 1.28, t.rib)
    // the slot of glass down its middle
    w.rect(m - 0.5, m + 0.5, 5, EAVES - 3.4, t.glass, 1.3)
    // the row of upright ovals across its head
    for (let k = -2; k <= 2; k++) w.arch(m + k * 0.92, EAVES - 2.75, 0.56, 1.5, t.glass, 1.12)
    // the banners in the recess beside it
    if (i < mids.length - 1 && i % 2 === 0) {
      const u = m + step / 2
      w.slab(u - 0.56, u + 0.56, 6.2, 18.6, 0.7, t.red)
      w.disc(u, 15.6, 0.46, t.white, 0.72)
    }
  })
  w.slab(-0.1, w.L + 0.1, EAVES - 0.3, EAVES, 0.5, shade(t.metal, 0.75))
}
