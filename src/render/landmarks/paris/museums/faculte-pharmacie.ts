import type { MeshBuilder } from '../../../buildings.ts'
import { block, classicalColumn, shade } from '../../kit.ts'
import { sign } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archOn, clockOn, extrude, fitted, palette, pts, rectOn, slabOn, statue } from '../palaces/common.ts'
import { bands, rustic } from './civic.ts'
import { railX } from './modern.ts'

const FIXED = 0
/** the design footprint: OSM relation 1004404's box (local −z faces bearing 92.5, the Avenue de l'Observatoire) */
const HX = 52.6
const HZ = 98.2

/**
 * OSM's outline and two courts in this frame (osmium, 2026-10-30), its buttresses' metre jogs ironed flat and a slit
 * of a light well dropped: the cour d'honneur's three sides on −z, the garden's U behind it, on +z, and its long west wing.
 */
const OUTER = pts([52.5, 98.2, 36.9, 87.4, 37.3, -37.8, 33.3, -37.9, 33, -32, 32.7, 53.6, 18.2, 53.5, 18.1, -5.6, -38, -5.7, -38.3, -19.1, -37.7, -37.8, -52.6, -38.1, -52.2, -98.1, -38.6, -98.2,
  -38.5, -73.3, 16.8, -73, 16.9, -98.1, 52.5, -97.8, 52.6, -81.2, 47.2, -82.9, 47.2, -88.7, 30.6, -89.8, 30.6, -71.9, 52.6, -71.9])
const COURTS = [pts([-38.7, -46.2, -15.1, -46.1, -15, -59.3, -38.6, -59]), pts([-6.8, -46.1, 16.8, -46, 16.7, -59.2, -6.7, -59.3])]

/**
 * La Faculté de Pharmacie (Charles Laisné, 1876–82), on the Avenue de l'Observatoire: pale, regular, and behind iron railings
 * and a small cour d'honneur, so a rider going down the avenue past the Luxembourg's gardens gets the whole front at once:
 *
 * - the ARCADE: thirteen bays of round arches on paired Doric columns standing on plinths, a covered walk behind;
 * - over it a long first floor of round-headed windows with a carved medallion between each, its middle bay wider, a
 *   full-height arched window between pairs of pilasters and the clock in its head;
 * - a low square-windowed second floor, a heavy cornice, an attic in the middle with FACULTÉ DE PHARMACIE between
 *   two pairs of draped figures in relief, a mansard with its dormers;
 * - bronze figures on plinths before the arcade;
 * - and the two wings forward either side, plain, in the same stone, on the avenue.
 *
 * Plan from OSM's relation 1004404. Front from the Commons photographs "Faculté de pharmacie de Paris.JPG", "Paris 75006 Avenue
 * de l'Observatoire no 4 Faculté de Pharmacie" and "Faculté de Pharmacie, Paris May 2012" (1–5), its heights read off them. The
 * west wing and the garden range I saw only in the 1880s engraving "La Nouvelle École de pharmacie".
 */
export function facultePharmacie(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
  sign(out, { type: 'flat', text: 'FACULTÉ DE PHARMACIE', h: 0.52, face: 'roman', colour: [0.3, 0.26, 0.2], tracking: 0.08, lit: 'none', w: 8.5 },
    { x: -10.85 * fit.hx / HX, y: 19.4, z: -73.45 * fit.hz / HZ, heading: Math.PI })
}

function draw(out: MeshBuilder): void {
  const p = palette('#d8ccb2', '#535a60')
  const E = 18
  extrude(out, [OUTER, ...COURTS], p, { eaves: E, bay: 4.2, win: 1.7, rise: 4.2, inset: 2.2, dormers: true,
    storeys: [{ y: 0, h: 3.2, sill: 1.4 }, { y: 7.2, h: 3.6, sill: 0.8 }, { y: 13.4, h: 2.4, sill: 0.6 }] })
  rustic(out, OUTER, 0.2, 6.8, 0.8, p.deep, 6)
  bands(out, OUTER, [6.8], 0.34, 0.2, p.trim, 6)
  bands(out, OUTER, [12.9], 0.26, 0.12, p.trim, 6)

  // ---- the front across the court, x −38.5…16.8 at z −73, proud of the plan
  const x0 = -38.5
  const x1 = 16.8
  const cx = (x0 + x1) / 2
  const f = -73.4
  block(out, x0, x1, f, f + 4, 0, E, p.stone)
  const n = 13
  const bay = (x1 - x0) / n
  const X = (i: number): number => x0 + bay * (i + 0.5)
  // the walk's dark behind the arches, and the arches
  rectOn(out, '-z', f, x0, x1, 0.6, 6.5, shade(p.stone, 0.96), 0.01)
  slabOn(out, '-z', f, x0 - 0.1, x1 + 0.1, 0, 0.55, 0.3, shade(p.stone, 0.84))
  for (let i = 0; i < n; i++) archOn(out, '-z', f, X(i), 0.55, bay - 1.5, 5.7, i === 6 ? p.dark : shade(p.glass, 1.2), 0.04)
  // the paired columns on each pier
  for (let i = 0; i <= n; i++) {
    const x = x0 + bay * i
    for (const s of [-0.34, 0.34]) classicalColumn(out, x + s, f - 0.5, 0.6, 6.15, 0.26, p.trim, { order: 'doric', tier: 'mid', tag: FIXED })
  }
  slabOn(out, '-z', f, x0 - 0.2, x1 + 0.2, 6.15, 6.95, 0.8, p.trim)
  slabOn(out, '-z', f, x0 - 0.3, x1 + 0.3, 6.95, 7.2, 0.95, shade(p.trim, 1.03))
  // the first floor: arched windows, medallions, the middle bay
  for (let i = 0; i < n; i++) {
    const x = X(i)
    if (i === 6) continue
    rectOn(out, '-z', f, x - 1.25, x + 1.25, 8.2, 11.5, p.trim, 0.04)
    archOn(out, '-z', f, x, 8.3, 2, 3.8, p.glass, 0.08)
    rectOn(out, '-z', f, x - 1.15, x + 1.15, 8.05, 8.25, shade(p.trim, 0.92), 0.1)
    if (i < n - 1 && i !== 5) medallion(out, x + bay / 2, f, 10.4, 0.62, p.trim, p.deep)
  }
  const m = X(6)
  rectOn(out, '-z', f, m - 2, m + 2, 7.2, 12.7, p.trim, 0.05)
  archOn(out, '-z', f, m, 7.6, 2.7, 5, p.glass, 0.09)
  clockOn(out, '-z', f, m, 11, 0.72, p)
  for (const s of [-2.4, -1.9, 1.9, 2.4]) slabOn(out, '-z', f, m + s - 0.17, m + s + 0.17, 7.2, 12.9, 0.16, p.trim)
  railX(out, m - 1.4, m + 1.4, f - 0.25, 7.3, 1, 0.3, p.dark)
  // the second floor and the cornice
  slabOn(out, '-z', f, x0 - 0.1, x1 + 0.1, 12.8, 13.15, 0.2, p.trim)
  for (let i = 0; i < n; i++) {
    rectOn(out, '-z', f, X(i) - 1.3, X(i) + 1.3, 13.65, 16.4, p.trim, 0.04)
    rectOn(out, '-z', f, X(i) - 1.1, X(i) + 1.1, 13.85, 16.2, p.glass, 0.08)
  }
  slabOn(out, '-z', f, x0 - 0.3, x1 + 0.3, E - 0.9, E, 0.7, p.trim)
  // the attic: the name between its two pairs of figures
  block(out, m - 9, m + 9, f + 0.3, f + 3, E, E + 3, p.stone)
  slabOn(out, '-z', f + 0.3, m - 9.2, m + 9.2, E + 2.7, E + 3.1, 0.4, p.trim)
  for (const s of [-1, 1]) {
    block(out, m + s * 6.3 - 2, m + s * 6.3 + 2, f - 0.1, f + 0.3, E, E + 0.55, p.trim)
    for (const d of [-0.8, 0.8]) statue(out, m + s * 6.3 + d, f + 0.05, E + 0.3, 2.2, shade(p.trim, 0.98))
  }

  // ---- the bronze figures on their plinths before the arcade
  for (const x of [X(1), X(4), X(8), X(11)]) statue(out, x + bay / 2, f - 2.4, 0.9, 2.6, [0.17, 0.2, 0.18])
  for (const x of [X(1), X(4), X(8), X(11)]) block(out, x + bay / 2 - 0.65, x + bay / 2 + 0.65, f - 3.05, f - 1.75, 0, 1, shade(p.stone, 0.9))

  // ---- the railing across the court's mouth on the avenue, with its piers and gate
  const z = -97.8
  block(out, x0, x1, z - 0.2, z + 0.2, 0, 0.8, shade(p.stone, 0.9))
  railX(out, x0, x1, z, 0.8, 2.4, 0.4, p.dark)
  for (const x of [x0, x0 + 18, cx + 4.5, cx - 4.5, x1 - 18, x1]) block(out, x - 0.6, x + 0.6, z - 0.6, z + 0.6, 0, 3.8, p.trim)
}

/** A carved medallion on a −z wall: a raised disc and a darker one in it. */
function medallion(out: MeshBuilder, x: number, f: number, y: number, r: number, c: [number, number, number], d: [number, number, number]): void {
  for (const [rr, cc, dd] of [[r, c, 0.06], [r * 0.72, d, 0.08]] as const) {
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2
      const a1 = ((i + 1) / 8) * Math.PI * 2
      out.quad([[x, y, f - dd], [x + Math.cos(a1) * rr, y + Math.sin(a1) * rr, f - dd], [x + Math.cos(a0) * rr, y + Math.sin(a0) * rr, f - dd], [x, y, f - dd]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], cc, FIXED)
    }
  }
}
