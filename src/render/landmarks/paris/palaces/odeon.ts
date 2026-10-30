import type { MeshBuilder } from '../../../buildings.ts'
import { block, classicalColumn, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, fitted, hipRoof, palette, range, rectOn, slabOn } from './common.ts'

const FIXED = 0
/** the design footprint: OSM way 338641511's box turned 1.5° off the meridian (local −z faces bearing 358.5, the place) */
const HX = 18.4
const HZ = 29.9

/**
 * The Odéon, Théâtre de l'Europe (Marie-Joseph Peyre and Charles de Wailly, 1779–82; rebuilt inside after the fires of
 * 1799 and 1818 to the same exterior): a free-standing neoclassical block on its half-round place, square to the axis
 * of the Rue de l'Odéon and the Luxembourg behind it. Severe, almost without ornament — what a rider sees is:
 *
 * - from the PLACE DE L'ODÉON (local −z): the PORTICO of eight Doric columns, two rows deep, on its low steps, under a
 *   plain entablature and attic, the three tall doorways in its shadow; the front above it, rusticated, to the cornice;
 * - along the RUES ROTROU and CORNEILLE (±x): the ARCADES of the ground floor the length of both flanks (where the
 *   booksellers sat), two storeys of plain windows over them between the string courses;
 * - over the cornice, a flat strip at the front and the slate roofs: the hipped roof over the hall, the high stage
 *   house behind it toward the garden.
 *
 * Everything where OSM maps it in 3D (osmium, 2026-10-29): the block x ±18, z −24.8…+25.4 under its 17 m cornice, the
 * string courses at 11.7 and 15.7 m (relations 4791435/6), the sixteen columns (ways 338637698…730: x ±1.85, ±5.5,
 * ±9.2, ±12.9 at z −24.7 and −27.6, 10 m), the portico's entablature 10–12 and attic 12–13 m, the hall's hipped roof
 * (way 338637776, eaves 20, ridge 26) and the stage house (ways 338637779/781, 21→28 m).
 */
export function odeon(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#ddd3bd', '#4d5459')
  const wall = -24.4
  // ---- the block: rusticated to the first floor, two storeys of windows, the cornice at 17 m
  range(out, -18, 18, wall, 25.4, p, {
    eaves: 17, bay: 3.4, win: 1.5, faces: ['-z', '+z'], rustic: 0.55, rusticTo: 6.6, courses: false, cornice: 0.7,
    storeys: [{ y: 6.8, h: 3.1, sill: 0.6 }, { y: 12.0, h: 2.2, sill: 0.5 }],
  })
  range(out, -17.4, 17.9, 25.4, 29.8, p, { eaves: 17, bay: 3.4, win: 1.4, faces: ['+z'], courses: false,
    storeys: [{ y: 0, h: 3.2 }, { y: 6.8, h: 3.1, sill: 0.6 }, { y: 12.0, h: 2.2, sill: 0.5 }] })
  for (const y of [11.7, 15.7]) block(out, -18.3, 18.3, wall - 0.3, 29.9, y, y + 0.3, p.trim)            // the string courses
  // the flanks: the ground-floor arcade the whole length, its arches deep in shadow, windows over it
  for (const [f, x] of [['-x', -18], ['+x', 18]] as const) {
    for (let k = 0; k < 13; k++) {
      const z = -21.6 + k * 3.6
      archOn(out, f, x, z, 0, 2.6, 5.4, shade(p.dark, 1.6), 0.06)
      rectOn(out, f, x, z - 0.75, z + 0.75, 7.4, 10.5, p.glass, 0.08)
      rectOn(out, f, x, z - 0.95, z + 0.95, 7.2, 10.7, p.trim, 0.05)
      rectOn(out, f, x, z - 0.6, z + 0.6, 12.5, 14.7, p.glass, 0.08)
    }
    for (let y = 0.55; y < 6.6; y += 0.55) rectOn(out, f, x, -23.8, 24.8, y - 0.06, y + 0.06, p.deep, 0.04)
    slabOn(out, f, x, -23.8, 24.8, 6.4, 6.8, 0.25, p.trim)
  }
  // ---- the portico: eight Doric columns two deep on the steps, the entablature and attic over them
  for (let i = 0; i < 4; i++) block(out, -14.6 + i * 0.25, 14.6 - i * 0.25, -29.8 + i * 0.35, wall, 0, 0.25 * (i + 1), shade(p.stone, 0.92 + (i % 2) * 0.04))
  const y0 = 1.0
  for (const x of [-12.9, -9.2, -5.5, -1.85, 1.85, 5.5, 9.2, 12.9]) {
    for (const z of [-27.6, -25.1]) classicalColumn(out, x, z, y0, 10, 0.62, p.stone, { order: 'doric', tier: 'near', tag: FIXED, trim: p.trim })
  }
  block(out, -14.3, 14.3, -28.6, wall, 10, 11.6, p.trim)                                          // the entablature
  block(out, -14.5, 14.5, -28.8, wall, 11.6, 12, shade(p.trim, 1.02))
  block(out, -13.4, 13.4, -28.4, wall, 12, 13, p.stone)                                           // the attic
  block(out, -14.3, 14.3, -28.6, wall, 9.95, 10, shade(p.stone, 0.7))                             // its soffit
  // the three tall doorways and the windows in the portico's shadow
  for (const x of [-5.5, 0, 5.5]) archOn(out, '-z', wall, x, y0, 2.6, 6.2, shade(p.dark, 1.5), 0.05)
  for (const x of [-11, 11]) rectOn(out, '-z', wall, x - 0.8, x + 0.8, 3.0, 6.6, p.glass, 0.05)
  // ---- the roofs: the flat leads behind the front cornice, the hall's hipped slate roof, the side roofs, the stage house
  balustrade(out, -18, 18, wall, -13.8, 17, p, { sides: ['-z'], h: 0.9 })
  block(out, -17.6, 17.6, wall + 0.6, -13.8, 16.95, 17.05, p.lead)
  block(out, -12.4, 12.4, -13.9, 17.7, 17, 20, shade(p.stone, 0.95))
  hipRoof(out, -12.4, 12.4, -13.9, 17.7, 20, 6, p.slate, 0.3)
  for (const s of [-1, 1]) {
    const a = s * 12.4
    const b = s * 17.7
    // the low roofs either side of the hall, lean-to up to it
    out.quad([[b, 17, -13.9], [b, 17, 9], [a, 19, 9], [a, 19, -13.9]], [s * 0.7, 0.7, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
  }
  block(out, -15.2, 15.2, 9, 26.9, 17, 21, shade(p.stone, 0.95))                                   // the stage house
  hipRoof(out, -15.2, 15.2, 9, 26.9, 21, 7, p.slate, 0.25)
}
