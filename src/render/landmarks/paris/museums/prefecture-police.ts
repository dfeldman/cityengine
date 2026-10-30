import type { MeshBuilder } from '../../../buildings.ts'
import { block, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, extrude, fitted, palette, pavilionRoof, pedimentOn, pts, rectOn, slabOn, squareDome, type Pal } from '../palaces/common.ts'
import { archesRound, bands, rustic } from './civic.ts'

/** the design footprint: OSM relation 537263's box (local −z faces bearing 111, the Rue de la Cité and the Parvis) */
const HX = 63.8
const HZ = 48.3

/** OSM's outline and court in this frame (osmium, 2026-10-30), its pavilions' metre jogs left to the blocks drawn over it */
const OUTER = pts([-50.5, 47.6, -63.8, -47.2, -63.1, -48.3, 53.5, -47.7, 63.8, 44.8, 34.8, 48.3, 34, 42.2, 44.4, 40.8, 44.4, 43.3, 53.2, 42.2, 52.5, 35.6])
const COURT = pts([-34.8, 27.7, 42.3, 18.7, 36.7, -30.5, -42.9, -30.8])

/** the storeys */
const E = 22

/**
 * La Préfecture de police (Pierre-Louis Calmels, 1863–67, built as the Caserne de la Cité for the Garde républicaine), the
 * whole block on the Île de la Cité between the Parvis and the Palais de Justice: a barracks dressed as a palace, in Paris's
 * dark-weathered stone, and what the Parvis has on its west side:
 *
 * - everywhere: stone banded the full height of two storeys, round arches along the ground, four storeys of windows and a
 *   heavy cornice;
 * - at each corner and the middle of each front, a pavilion a storey higher under a steep slate roof of its own, and on
 *   the QUAI DU MARCHÉ-NEUF (local −x) the great middle one with a curved dome, oculi and a lantern;
 * - from the RUE DE LA CITÉ (local −z): the front on the Parvis, its middle pavilion with a triple arch.
 *
 * Plan from OSM's relation 537263 and the part heights (30 m) of its building:parts. The rhythm and roofs from the Commons
 * views "Caserne de la Cite Paris 1900" and "Tout Paris 328 M. Quai du Marché Neuf" and the plan sheets "Caserne Municipale de
 * la Cité"; those are early-1900s views, and I could not compare them with the building today.
 */
export function prefecturePolice(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#c6b99c', '#4a5157')
  extrude(out, [OUTER, COURT], p, { eaves: E, bay: 4.2, win: 1.7, rise: 4.2, inset: 2.4, dormers: true,
    storeys: [{ y: 5.6, h: 3, sill: 0.6 }, { y: 10.6, h: 3, sill: 0.6 }, { y: 15.2, h: 2.8, sill: 0.6 }, { y: 19.2, h: 1.7, sill: 0.3 }] })
  rustic(out, OUTER, 0.3, 10.3, 0.62, p.deep, 6)
  bands(out, OUTER, [0], 0.7, 0.12, shade(p.stone, 0.8), 6)
  bands(out, OUTER, [5.2], 0.28, 0.15, p.trim, 6)
  bands(out, OUTER, [10.3], 0.3, 0.2, p.trim, 6)
  bands(out, OUTER, [18.9], 0.22, 0.12, p.trim, 6)
  archesRound(out, OUTER, 0.8, 3.9, 2.2, 4.2, p.glass, 0.1, 8)

  // ---- the corner pavilions
  for (const [a, b, c, d] of [[-65, -46, -49.5, -34.5], [-53, -35, 32, 48.8], [35, 54.5, -49, -34.5], [45, 65, 29, 46]] as const) pavilion(out, p, a, b, c, d, E + 3, 7)

  // ---- the middle of the Parvis front: its triple arch and pediment
  const a = -15.3
  const b = 7.2
  const f = -48.9
  block(out, a, b, f, -33, 0, E + 3, p.stone)
  dress(out, p, '-z', f, a, b, E + 3)
  for (const x of [-9.6, -4.05, 1.5]) {
    rectOn(out, '-z', f, x - 2.4, x + 2.4, 0.6, 6.6, shade(p.stone, 0.92), 0.1)
    archOn(out, '-z', f, x, 0.4, 3.8, 6.1, p.dark, 0.13)
  }
  pedimentOn(out, '-z', f, a - 0.3, b + 0.3, E + 3, 3, 0.6, p.trim)
  pavilionRoof(out, a, b, f + 0.2, -33, E + 3, 7, p, { top: 6 })

  // ---- the great middle pavilion on the quay, the curved dome and its lantern
  const qx0 = -60
  const qx1 = -40
  const z0 = -13
  const z1 = 13
  block(out, qx0, qx1, z0, z1, 0, E + 5, p.stone)
  dress(out, p, '-x', qx0, z0, z1, E + 5)
  squareDome(out, (qx0 + qx1) / 2, 0, E + 5, 10, 8.5, p.slate, 6, 13)
  block(out, -53.2, -46.8, -3.2, 3.2, E + 13.4, E + 15, p.trim)
  squareDome(out, -50, 0, E + 15, 3.4, 2.4, p.lead, 3)
  for (const z of [-7.5, 0, 7.5]) {
    archOn(out, '-x', qx0 + 2.8, z, E + 6.2, 2.1, 2.4, p.trim, 0.1)
    archOn(out, '-x', qx0 + 2.8, z, E + 6.4, 1.5, 1.9, p.glass, 0.14)
  }
}

/** A pavilion: stone block with its storeys drawn on all four faces, a cornice, a steep roof. */
function pavilion(out: MeshBuilder, p: Pal, x0: number, x1: number, z0: number, z1: number, y: number, h: number): void {
  block(out, x0, x1, z0, z1, 0, y, p.stone)
  dress(out, p, '-z', z0, x0, x1, y)
  dress(out, p, '+z', z1, x0, x1, y)
  dress(out, p, '-x', x0, z0, z1, y)
  dress(out, p, '+x', x1, z0, z1, y)
  pavilionRoof(out, x0, x1, z0, z1, y, h, p, { top: Math.min(x1 - x0, z1 - z0) * 0.32 })
}

/** A pavilion's face: rustic bands, its windows at each storey, the string courses and the cornice. */
function dress(out: MeshBuilder, p: Pal, f: '-z' | '+z' | '-x' | '+x', plane: number, t0: number, t1: number, y: number): void {
  for (let v = 0.9; v < 10.3; v += 0.62) rectOn(out, f, plane, t0, t1, v - 0.04, v + 0.05, p.deep, 0.03)
  slabOn(out, f, plane, t0 - 0.1, t1 + 0.1, 5.2, 5.5, 0.16, p.trim)
  slabOn(out, f, plane, t0 - 0.1, t1 + 0.1, 10.3, 10.65, 0.22, p.trim)
  const n = Math.max(2, Math.round((t1 - t0) / 5))
  for (let i = 0; i < n; i++) {
    const t = t0 + ((t1 - t0) * (i + 0.5)) / n
    archOn(out, f, plane, t, 1, 2.2, 3.6, p.glass, 0.08)
    for (const [y0, y1] of [[6.2, 9.4], [11.2, 14.4], [15.8, 18.6], [19.8, 22.6]] as const) {
      if (y1 > y - 0.4) continue
      rectOn(out, f, plane, t - 1.05, t + 1.05, y0 - 0.2, y1 + 0.2, p.trim, 0.05)
      rectOn(out, f, plane, t - 0.85, t + 0.85, y0, y1, p.glass, 0.09)
    }
  }
  slabOn(out, f, plane, t0 - 0.3, t1 + 0.3, y - 0.7, y, 0.55, p.trim)
}
