import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, roof, shade } from '../../kit.ts'
import { sign } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archOn, clockOn, dormers, extrude, fitted, palette, pedimentOn, pts, rectOn, slabOn } from '../palaces/common.ts'
import { bands, rustic, stack } from './civic.ts'

const FIXED = 0
/** the design footprint: OSM relation 1187504's box (local −z faces bearing 178.3, the Place d'Italie) */
const HX = 40.7
const HZ = 27.6

/** OSM's outline and courts in this frame (osmium, 2026-10-30): the front on the place, its wings slanting back along the two streets that leave it */
const OUTER = pts([-40.7, 19.9, -39.3, 14.2, -24.2, -20.4, -21.2, -20.3, -21.1, -27.6, 18.1, -27.5, 18.2, -20.5, 21.8, -20.5, 38.7, 10.9, 40.7, 17.9, 39.2, 23.7, 25.5, 24.3,
  25.5, 25.6, -24.6, 27.6, -24.7, 26.4, -38.7, 27])
const COURTS = [pts([-16.1, -7.4, -15, 12.7, 14.6, 11, 13.8, -9.3])]

/**
 * La Mairie du 13e (Paul-Émile Bonnet, 1866–77), on the north side of the Place d'Italie. A square-shouldered Second
 * Empire town hall in pale stone under a very steep slate roof, and what a rider crossing the place sees:
 *
 * - from the PLACE D'ITALIE (local −z): the 39 m front. Three round-headed doors in the banded ground floor, a tall
 *   first floor of paired mullioned windows between pilasters, a low second floor under a heavy cornice;
 * - over it the roof, its five stone dormers, and in the middle the stone gable with the clock, standing up through the
 *   slates with the little octagonal bell lantern on its back: the mark of the building from across the place;
 * - tall stone chimney stacks at the front's two shoulders;
 * - along the streets either side, the same storeys slanting back on the outline's two diagonal wings.
 *
 * Plan from OSM's relation 1187504. The front, the gable and the lantern from the Commons photographs "Mairie du 13e
 * arrondissement de Paris.JPG" and "Mairie 13e arrondissement Paris 1, 4, 13"; their heights are read off those, not measured.
 */
export function mairie13e(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
  sign(out, { type: 'flat', text: "MAIRIE DU XIIIᵉ ARRONDISSEMENT", h: 0.42, face: 'roman', colour: [0.25, 0.22, 0.17], tracking: 0.12, lit: 'none', w: 15 },
    { x: -1.5 * fit.hx / HX, y: E + 0.42, z: (F - 1.6) * fit.hz / HZ, heading: Math.PI })
}

/** the cornice; the front's plane */
const E = 17
const F = -27.6

function draw(out: MeshBuilder): void {
  const p = palette('#d9cdb2', '#4c5359')
  const rise = 7
  extrude(out, [OUTER, ...COURTS], p, { eaves: E, bay: 3.9, win: 1.7, rise, inset: 3.6, dormers: false,
    storeys: [{ y: 0, h: 3.2, sill: 1.6 }, { y: 6.8, h: 4.4, sill: 0.8 }, { y: 12.8, h: 2.2, sill: 0.7 }] })
  rustic(out, OUTER, 0.3, 6.5, 0.72, p.deep, 5)
  bands(out, OUTER, [6.5], 0.36, 0.2, p.trim, 5)
  bands(out, OUTER, [12.3], 0.26, 0.14, p.trim, 5)

  // ---- the front on the place, a block a little proud of the plan, its own storeys drawn over the plan's
  const x0 = -21.3
  const x1 = 18.3
  const cx = (x0 + x1) / 2
  const pf = F - 0.5
  block(out, x0, x1, pf, F + 7, 0, E, p.stone)
  for (let y = 0.9; y < 6.4; y += 0.72) rectOn(out, '-z', pf, x0, x1, y - 0.05, y + 0.05, p.deep, 0.03)
  slabOn(out, '-z', pf, x0 - 0.15, x1 + 0.15, 0, 0.7, 0.14, shade(p.stone, 0.82))
  slabOn(out, '-z', pf, x0 - 0.15, x1 + 0.15, 6.4, 6.9, 0.28, p.trim)
  slabOn(out, '-z', pf, x0 - 0.1, x1 + 0.1, 12.3, 12.6, 0.2, p.trim)
  // the three doors, and the windows of the ground floor either side
  for (const dx of [-4.6, 0, 4.6]) {
    rectOn(out, '-z', pf, cx + dx - 1.9, cx + dx + 1.9, 0.7, 6.1, shade(p.stone, 0.92), 0.04)
    archOn(out, '-z', pf, cx + dx, 0.5, 3, 5.2, shade(p.bronze, 0.9), 0.07)
    archOn(out, '-z', pf, cx + dx, 3.4, 2.5, 2, p.glass, 0.09)
  }
  for (const s of [-1, 1]) {
    for (const d of [9.6, 13.2, 16.8]) {
      rectOn(out, '-z', pf, cx + s * d - 1, cx + s * d + 1, 1.9, 5.3, p.trim, 0.04)
      rectOn(out, '-z', pf, cx + s * d - 0.8, cx + s * d + 0.8, 2.1, 5.1, p.glass, 0.08)
    }
  }
  // the first floor: seven bays of tall mullioned windows between pilasters, each under a cornice; the second floor over
  const bays = [-16.8, -11.2, -5.6, 0, 5.6, 11.2, 16.8]
  for (const dx of bays) {
    const x = cx + dx
    rectOn(out, '-z', pf, x - 1.75, x + 1.75, 7.2, 12.1, p.trim, 0.05)
    rectOn(out, '-z', pf, x - 1.45, x + 1.45, 7.4, 11.8, p.glass, 0.09)
    rectOn(out, '-z', pf, x - 0.07, x + 0.07, 7.4, 11.8, p.trim, 0.12)
    rectOn(out, '-z', pf, x - 1.45, x + 1.45, 10.2, 10.34, p.trim, 0.12)
    slabOn(out, '-z', pf, x - 1.95, x + 1.95, 11.95, 12.25, 0.26, p.trim)
    rectOn(out, '-z', pf, x - 1.3, x + 1.3, 13.1, 15.4, p.trim, 0.05)
    rectOn(out, '-z', pf, x - 1.1, x + 1.1, 13.3, 15.2, p.glass, 0.09)
  }
  for (const dx of [-19.4, -14, -8.4, -2.8, 2.8, 8.4, 14, 19.4]) slabOn(out, '-z', pf, cx + dx - 0.34, cx + dx + 0.34, 6.9, E - 1.1, 0.14, p.trim)
  // the heavy cornice
  slabOn(out, '-z', pf, x0 - 0.1, x1 + 0.1, E - 1.1, E - 0.7, 0.16, shade(p.stone, 0.95))
  slabOn(out, '-z', pf, x0 - 0.4, x1 + 0.4, E - 0.7, E, 0.55, p.trim)

  // ---- the roof over the front, steeper and higher than the plan's: a hip across the front's width
  const rx0 = x0 - 0.1
  const rx1 = x1 + 0.1
  const rz0 = pf + 0.05
  const rz1 = F + 16
  roof(out, rx0, rx1, rz0, rz1, E, 8.2, 5.2, 5.2, p.slate)
  dormers(out, '-z', pf + 1.1, x0 + 1.4, cx - 4, E + 0.25, 5.6, p, { w: 1.7, h: 2.5, set: 0 })
  dormers(out, '-z', pf + 1.1, cx + 4, x1 - 1.4, E + 0.25, 5.6, p, { w: 1.7, h: 2.5, set: 0 })
  // upper row of small skylights
  for (const dx of [-8.4, 8.4]) rectOn(out, '-z', pf + 3.9, cx + dx - 0.5, cx + dx + 0.5, E + 4.9, E + 5.8, p.glass, 0.02)

  // ---- the clock gable through the roof: stone, scrolled shoulders, its pediment, the bell lantern behind it
  const gf = pf - 0.15
  block(out, cx - 2.7, cx + 2.7, gf, gf + 3.6, E, E + 6.2, p.stone)
  slabOn(out, '-z', gf, cx - 2.9, cx + 2.9, E, E + 0.5, 0.14, p.trim)
  slabOn(out, '-z', gf, cx - 3, cx + 3, E + 5.8, E + 6.2, 0.22, p.trim)
  rectOn(out, '-z', gf, cx - 1.9, cx + 1.9, E + 1.1, E + 5.3, shade(p.stone, 0.93), 0.03)
  clockOn(out, '-z', gf, cx, E + 3.2, 1.25, p)
  pedimentOn(out, '-z', gf, cx - 3.1, cx + 3.1, E + 6.2, 1.5, 0.3, p.trim)
  for (const s of [-1, 1]) {
    // the scrolls at the gable's foot, and the urns on its corners
    block(out, cx + s * 3.1 - 0.5, cx + s * 3.1 + 0.5, gf, gf + 1.2, E, E + 1.8, p.trim)
    prism(out, cx + s * 3.05, gf + 0.3, E + 6.2, E + 7.2, 0.26, 6, p.trim, FIXED, 0.12)
  }
  // the bell lantern: a stone octagon, its iron balcony, the open arches, a little lead dome and its spike
  const lz = gf + 2.2
  const ly = E + 6.2
  prism(out, cx, lz, ly, ly + 1.4, 1.5, 8, p.stone, FIXED, 1.15)
  prism(out, cx, lz, ly + 1.4, ly + 1.55, 1.42, 8, p.lead, FIXED, 1.42)
  prism(out, cx, lz, ly + 1.55, ly + 2.25, 1.38, 8, p.dark, FIXED, 1.38)
  prism(out, cx, lz, ly + 1.55, ly + 4.1, 0.84, 8, p.stone, FIXED, 0.8)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    block(out, cx + Math.cos(a) * 0.72 - 0.3, cx + Math.cos(a) * 0.72 + 0.3, lz + Math.sin(a) * 0.72 - 0.3, lz + Math.sin(a) * 0.72 + 0.3, ly + 2, ly + 3.5, p.dark)
  }
  prism(out, cx, lz, ly + 4.1, ly + 4.32, 1.22, 8, p.lead, FIXED, 1.22)
  prism(out, cx, lz, ly + 4.32, ly + 5.3, 1.1, 8, p.lead, FIXED, 0.5)
  prism(out, cx, lz, ly + 5.3, ly + 6.3, 0.2, 6, p.lead, FIXED, 0.03)

  // ---- the stone chimneys at the front's shoulders, and two on each wing
  const stone = shade(p.stone, 0.95)
  for (const [x, z] of [[x0 + 2.4, F + 8.6], [x1 - 2.4, F + 8.6], [x0 + 8, F + 13], [x1 - 8, F + 13], [-30, 14], [30, 14]] as const) {
    stack(out, x, z, E + 3, E + 11.5, 0.75, 1.2, stone, p.lead)
  }
}
