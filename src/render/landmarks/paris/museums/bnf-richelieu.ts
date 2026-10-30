import type { MeshBuilder } from '../../../buildings.ts'
import { block, dome, shade, type Rgb } from '../../kit.ts'
import { sign } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archOn, extrude, fitted, palette, pavilionRoof, pedimentOn, pts, rectOn, segmentOn, slabOn } from '../palaces/common.ts'
import { bands, rustic, stack } from './civic.ts'
import { railX } from './modern.ts'

/** the design footprint: OSM relation 545655's box (local −z faces bearing 289, the Rue de Richelieu) */
const HX = 88
const HZ = 47

/** OSM's outline and courts in this frame (osmium, 2026-10-30): the Jardin Vivienne's bay on +z, the Tubeuf court's on +x */
const OUTER = pts([83.1, -46.6, 86.9, -41, 87.5, 13.1, 55.4, 13.6, 55.7, 37.6, 87.9, 37.3, 88, 45, 40.3, 46.3, 40.3, 6.8, -16.1, 7.4, -13.6, 15.8, -14.5, 45.6, -85.3, 46.8, -88, 44.7, -87.4, -46.7])
const COURTS = [pts([81.2, -2.4, 55.1, -2.1, 55.3, 5.7, 81.4, 5.5]), pts([-27, -35.7, -75.6, -35.5, -75.9, -6.7, -27, -7])]
/** the front on the Rue de Richelieu */
const F = -47.2

/**
 * La Bibliothèque nationale de France, site Richelieu: the old royal library, a whole block of the 2e between the Rue de
 * Richelieu and the Rue Vivienne, grown out of Mazarin's palace. Mostly Henri Labrouste's, finished in the 1870s by Pascal,
 * and to a rider going up the Rue de Richelieu past the Square Louvois a single immense grey wall:
 *
 * - the BASE, banded in deep horizontal rustication, with barred square windows between keystones;
 * - the PIANO NOBILE over it on a heavy string course, tall windows under triangular pediments with small iron balconies, a
 *   stone pilaster between each, a cartouche in the bay beside the pavilion;
 * - a low attic of oculi and square windows, a cornice, a slate roof;
 * - the PAVILIONS that interrupt it, each with a curved pediment on its attic and a steep roof of its own; and the door to the
 *   Cour d'honneur, with BIBLIOTHÈQUE NATIONALE over it and 1873 in the frieze;
 * - from the RUE DES PETITS-CHAMPS (local +x), the Hôtel Tubeuf's brick and stone in its court, the one old thing still in view;
 * - from high up, the nine lead domes of Labrouste's reading room.
 *
 * Plan from OSM's relation 545655. The wall from the Commons photographs "Bibliothèque nationale de France - site Richelieu -
 * façade rue de Richelieu" and "Fronton d'entrée de la Bibliothèque nationale de France"; and the bays' order from the
 * old survey elevation "Façade de la Bibliothèque Royale sur la rue de Richelieu". The door's place on the court's axis, the Tubeuf brick
 * and the domes' place are from memory of the building, not checked against a plan.
 */
export function bnfRichelieu(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
  sign(out, { type: 'flat', text: 'BIBLIOTHÈQUE NATIONALE', h: 0.34, face: 'roman', colour: [0.82, 0.68, 0.34], tracking: 0.05, lit: 'none', w: 4.4 },
    { x: DOOR * fit.hx / HX, y: 5.5, z: (F - 0.65) * fit.hz / HZ, heading: Math.PI })
}

/** the door to the Cour d'honneur, on its axis */
const DOOR = -51

function draw(out: MeshBuilder): void {
  const p = palette('#beb29a', '#555b60')
  const E = 19.6
  extrude(out, [OUTER, ...COURTS], p, { eaves: E, bay: 4.6, win: 1.8, rise: 4.6, inset: 2.4, dormers: false,
    storeys: [{ y: 0, h: 2.8, sill: 1.8 }, { y: 8.4, h: 4.2, sill: 0.8 }, { y: 15.2, h: 1.8, sill: 0.8 }] })
  rustic(out, OUTER, 0.3, 8, 0.72, p.deep, 8)
  bands(out, OUTER, [0], 0.6, 0.12, shade(p.stone, 0.8), 8)
  bands(out, OUTER, [8], 0.42, 0.26, p.trim, 8)
  bands(out, OUTER, [14.4], 0.26, 0.14, p.trim, 8)

  // ---- the long wall on the Rue de Richelieu: drawn over the plan's, its bays and pilasters
  const x0 = -87.5
  const x1 = 84
  block(out, x0, x1, F, F + 2.4, 0, E, p.stone)
  for (let y = 1; y < 8; y += 0.72) rectOn(out, '-z', F, x0, x1, y - 0.07, y + 0.07, shade(p.deep, 0.86), 0.03)
  slabOn(out, '-z', F, x0 - 0.2, x1 + 0.2, 0, 0.7, 0.16, shade(p.stone, 0.8))
  slabOn(out, '-z', F, x0 - 0.2, x1 + 0.2, 7.7, 8.5, 0.34, p.trim)
  const bay = 7.2
  const pav: [number, number][] = [[-87.5, -71.5], [DOOR - 8.5, DOOR + 8.5], [68, 84]]
  const inPav = (x: number): boolean => pav.some(([a, b]) => x > a - 1 && x < b + 1)
  for (let x = x0 + bay / 2; x < x1; x += bay) {
    if (inPav(x)) continue
    window(out, p, x, F)
    slabOn(out, '-z', F, x + bay / 2 - 0.55, x + bay / 2 + 0.55, 8.5, 14.3, 0.22, shade(p.stone, 0.97))
  }
  slabOn(out, '-z', F, x0 - 0.1, x1 + 0.1, 14.3, 14.7, 0.26, p.trim)
  // the attic: oculi and square windows in turn
  let k = 0
  for (let x = x0 + bay / 2; x < x1; x += bay) {
    if (inPav(x)) continue
    if (k++ % 3 === 2) {
      archOn(out, '-z', F, x, 16.4, 1.5, 0.75, p.trim, 0.05)
      archOn(out, '-z', F, x, 16.5, 1.1, 0.55, p.glass, 0.09)
    } else {
      rectOn(out, '-z', F, x - 1.3, x + 1.3, 15.5, 17.8, p.trim, 0.05)
      rectOn(out, '-z', F, x - 1.1, x + 1.1, 15.7, 17.6, p.glass, 0.09)
    }
  }
  slabOn(out, '-z', F, x0 - 0.2, x1 + 0.2, E - 1.4, E - 0.9, 0.26, shade(p.stone, 0.95))
  slabOn(out, '-z', F, x0 - 0.5, x1 + 0.5, E - 0.9, E, 0.7, p.trim)

  // ---- the pavilions: a step proud, their own storeys, a curved pediment on the attic, a steep roof
  for (const [a, b] of pav) {
    const f = F - 0.7
    const m = (a + b) / 2
    block(out, a, b, f, F + 6, 0, E + 1.6, p.stone)
    for (let y = 1; y < 8; y += 0.72) rectOn(out, '-z', f, a, b, y - 0.07, y + 0.07, shade(p.deep, 0.86), 0.03)
    slabOn(out, '-z', f, a - 0.2, b + 0.2, 7.7, 8.5, 0.34, p.trim)
    for (const s of [-1, 1]) slabOn(out, '-z', f, m + s * (b - a) / 2 - s * 0.9 - 0.75, m + s * (b - a) / 2 - s * 0.9 + 0.75, 8.5, E - 1, 0.3, shade(p.stone, 1.02))
    for (const dx of [-4, 4]) window(out, p, m + dx, f)
    // the cartouche on the pier between the two windows
    rectOn(out, '-z', f, m - 1.5, m + 1.5, 11.2, 13.6, shade(p.stone, 0.9), 0.05)
    archOn(out, '-z', f, m, 11.6, 1.4, 1.4, p.trim, 0.08)
    slabOn(out, '-z', f, a - 0.3, b + 0.3, E - 0.9, E + 0.2, 0.7, p.trim)
    rectOn(out, '-z', f, m - 3.4, m + 3.4, 15.7, 17.7, p.trim, 0.05)
    rectOn(out, '-z', f, m - 3.1, m + 3.1, 15.9, 17.5, p.glass, 0.09)
    block(out, m - 5.5, m + 5.5, f + 0.1, f + 2, E + 0.2, E + 1.6, p.stone)
    segmentOn(out, '-z', f + 0.1, m, E + 1.6, 11.2, 2.6, p.trim, 0.12)
    segmentOn(out, '-z', f + 0.1, m, E + 1.7, 8.6, 1.8, shade(p.stone, 0.88), 0.16)
    pavilionRoof(out, a + 0.2, b - 0.2, f + 0.4, F + 11, E + 0.2, 7.5, p, { top: 4 })
  }

  // ---- the door on the Rue de Richelieu: stone arch, bronze leaves, name and the head over it
  const f = F - 0.7
  rectOn(out, '-z', f, DOOR - 3.7, DOOR + 3.7, 0.4, 7.7, shade(p.stone, 1.03), 0.04)
  archOn(out, '-z', f, DOOR, 0.05, 5.4, 7, shade(p.lead, 0.82), 0.08)
  rectOn(out, '-z', f, DOOR - 2.7, DOOR + 2.7, 4.9, 5.75, shade(p.lead, 0.62), 0.11)

  // ---- the Tubeuf court's brick and stone, the walls of the bay on the Rue des Petits-Champs
  const brick: Rgb = [0.57, 0.3, 0.23]
  rectOn(out, '+z', 13.4, 55.8, 87.3, 0.8, E - 1, brick, 0.1)
  rectOn(out, '-z', 37.8, 55.8, 87.3, 0.8, E - 1, brick, 0.1)
  rectOn(out, '+x', 55.5, 13.8, 37.5, 0.8, E - 1, brick, 0.1)
  for (let x = 58; x < 87; x += 4.6) {
    for (const [y0, y1] of [[1.8, 5], [8, 12.5], [15, 17.6]] as const) {
      rectOn(out, '+z', 13.4, x - 1.2, x + 1.2, y0 - 0.25, y1 + 0.25, p.trim, 0.13)
      rectOn(out, '+z', 13.4, x - 0.95, x + 0.95, y0, y1, p.glass, 0.17)
    }
  }
  // ---- the reading room's nine domes, up among the roofs, and a row of the stacks
  for (const x of [-4, 13, 30]) for (const z of [-30, -16, -2]) dome(out, x, z, E + 3.2, 6, 2.5, shade(p.lead, 1.15), 10)
  for (const x of [-88 + 10, 60, 40, 10, -20]) stack(out, x, 30, E + 2, E + 7, 0.8, 1.5, shade(p.stone, 0.9), p.lead)
}

/** One bay of the Rue de Richelieu: a barred window in the banded base, and the tall pedimented window with its balcony on it. */
function window(out: MeshBuilder, p: ReturnType<typeof palette>, x: number, f: number): void {
  rectOn(out, '-z', f, x - 1.2, x + 1.2, 2, 5.6, shade(p.stone, 1.02), 0.04)
  rectOn(out, '-z', f, x - 0.95, x + 0.95, 2.2, 5.4, p.glass, 0.08)
  railX(out, x - 0.95, x + 0.95, f - 0.1, 2.2, 3.2, 0.3, p.dark)
  slabOn(out, '-z', f, x - 0.5, x + 0.5, 5.6, 7.7, 0.08, shade(p.stone, 0.98))
  rectOn(out, '-z', f, x - 1.55, x + 1.55, 9, 13.2, p.trim, 0.05)
  rectOn(out, '-z', f, x - 1.25, x + 1.25, 9.25, 12.9, p.glass, 0.09)
  rectOn(out, '-z', f, x - 0.05, x + 0.05, 9.25, 12.9, p.trim, 0.11)
  rectOn(out, '-z', f, x - 1.25, x + 1.25, 11.4, 11.48, p.trim, 0.11)
  slabOn(out, '-z', f, x - 1.65, x + 1.65, 8.5, 8.95, 0.3, p.trim)
  railX(out, x - 1.4, x + 1.4, f - 0.26, 8.95, 0.75, 0.22, shade(p.stone, 0.72))
  pedimentOn(out, '-z', f, x - 1.95, x + 1.95, 13.2, 1, 0.34, p.trim)
}
