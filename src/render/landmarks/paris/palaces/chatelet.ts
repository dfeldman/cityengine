import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, dome, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, fitted, hipRoof, palette, pavilionRoof, range, rectOn, slabOn, statue, type Pal } from './common.ts'

const FIXED = 0

/**
 * Gabriel Davioud's twin theatres facing each other across the Place du Châtelet (1860–62), built with the place
 * Haussmann cut at the head of the Boulevard de Sébastopol: the Théâtre du Châtelet on the west side, the Théâtre
 * Sarah-Bernhardt, now the Théâtre de la Ville, on the east. One design, mirrored across the fountain; what a rider in
 * the place sees of either is:
 *
 * - the FRONT on the place: the ground floor an ARCADE of round arches (the porch, open), a balustraded terrace over it;
 *   the first floor the LOGGIA of five tall round-headed windows between pilasters; the attic with its allegories;
 * - the long FLANKS on the quai and the avenue, arcaded at street level the same way, two storeys of windows over;
 * - the ROOFS: the slate hipped roof over the block and, rising out of the middle, the auditorium's round-hipped
 *   roof with its lantern — the shape that tells the two from the apartment blocks round them.
 *
 * Plans and heights are OSM's (osmium, 2026-10-29): the block 15 m to its hipped roof (relation 3349071, way 248804635),
 * the auditorium's round-hipped roof to 25 m (ways 248804636, 248804661), the lantern to 29 (ways 248804664/665).
 * Local −z is the place.
 */

/** Théâtre du Châtelet: way 53574718's box turned to its axes (local −z faces bearing 112.5, the place) */
export function chateletTheatre(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 23.1, 45.75, (q) => {
    const p = palette('#e3d9c3', '#4d5459')
    theatre(q, p, { x0: -21.2, x1: 19.5, z0: -42.5, z1: 45.5, hall: [-15.1, 11.4, -29.4, 26.5], lantern: [-2.05, -1.15] })
    // the low corner block on the avenue side of the front (way 248804634), a terrace over it
    range(q, 11.5, 23.1, -45.8, -25.3, p, { eaves: 5.2, bay: 3.2, win: 1.6, faces: ['-z', '+x'], courses: false, storeys: [{ y: 0, h: 3.2, sill: 0.4 }] })
    balustrade(q, 11.5, 23.1, -45.8, -25.3, 5.2, p, { sides: ['-z', '+x'], h: 0.9 })
  })
}

/** Théâtre de la Ville: way 53582122's box turned to its axes (local −z faces bearing 292.5, the place) */
export function theatreDeLaVille(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 23.0, 24.1, (q) => {
    const p = palette('#e3d9c3', '#4d5459')
    theatre(q, p, { x0: -20.3, x1: 21.6, z0: -21.0, z1: 24.1, hall: [-12.3, 13.0, -13.8, 24.0], lantern: [1.3, 3.2] })
    // the low corner blocks either side of the front (ways 248804662/663)
    for (const [x0, x1, z0, z1] of [[13.3, 23.0, -22.6, -9.1], [-23.0, -12.2, -24.1, -12.9]]) {
      range(q, x0, x1, z0, z1, p, { eaves: 5.2, bay: 3.2, win: 1.6, faces: ['-z', x0 > 0 ? '+x' : '-x'], courses: false, storeys: [{ y: 0, h: 3.2, sill: 0.4 }] })
      balustrade(q, x0, x1, z0, z1, 5.2, p, { sides: ['-z', x0 > 0 ? '+x' : '-x'], h: 0.9 })
    }
  })
}

interface Plan { x0: number; x1: number; z0: number; z1: number; hall: [number, number, number, number]; lantern: [number, number] }

function theatre(out: MeshBuilder, p: Pal, o: Plan): void {
  const { x0, x1, z0, z1 } = o
  const eaves = 15.2
  const dark = shade(p.dark, 1.5)
  // ---- the block: arcaded at street level all round, two storeys over, the cornice and the hipped slate roof
  range(out, x0, x1, z0, z1, p, {
    eaves, bay: 3.8, win: 1.6, faces: ['+z', '-x', '+x'], quoins: true, cornice: 0.7,
    storeys: [{ y: 7.0, h: 2.9, sill: 0.6 }, { y: 11.0, h: 2.2, sill: 0.4 }],
  })
  for (const [f, x] of [['-x', x0], ['+x', x1]] as const) {
    const n = Math.round((z1 - z0 - 6) / 3.8)
    const step = (z1 - z0 - 6) / n
    for (let k = 0; k < n; k++) archOn(out, f, x, z0 + 3 + step * (k + 0.5), 0, 2.4, 5.0, dark, 0.07)
    slabOn(out, f, x, z0, z1, 6.3, 6.9, 0.3, p.trim)
  }
  hipRoof(out, x0, x1, z0, z1, eaves, 3.2, p.slate, 0.4)
  // ---- the front on the place, a pavilion standing a little proud and taller: arcade, terrace, loggia, attic
  const fz = z0 - 0.8
  const fx0 = x0 + 4
  const fx1 = x1 - 4
  const fm = (fx0 + fx1) / 2
  const fw = fx1 - fx0
  block(out, fx0, fx1, fz, z0 + 4, 0, 18.4, p.stone)
  // the porch: five round arches, open, the vaults dark behind
  const bay = fw / 5
  for (let k = 0; k < 5; k++) {
    const x = fx0 + bay * (k + 0.5)
    archOn(out, '-z', fz, x, 0, bay * 0.62, 6.0, dark, 0.06)
    rectOn(out, '-z', fz, x - bay * 0.5 + 0.2, x - bay * 0.31, 0, 6.2, p.deep, 0.03)                    // the piers' rustication
  }
  for (let y = 0.6; y < 6.4; y += 0.6) rectOn(out, '-z', fz, fx0, fx1, y - 0.05, y + 0.05, p.deep, 0.035)
  // the terrace over the porch, its balustrade
  block(out, fx0 - 0.3, fx1 + 0.3, fz - 1.6, fz, 6.6, 7.2, p.trim)
  balustrade(out, fx0, fx1, fz - 1.6, fz, 7.2, p, { sides: ['-z'], h: 1.0 })
  // the loggia: five tall round-headed windows between paired pilasters
  for (let k = 0; k < 5; k++) {
    const x = fx0 + bay * (k + 0.5)
    archOn(out, '-z', fz, x, 7.6, bay * 0.5, 6.2, p.glass, 0.06)
    rectOn(out, '-z', fz, x - bay * 0.5 + 0.25, x - bay * 0.5 + 0.75, 7.4, 14.2, p.trim, 0.12)
  }
  rectOn(out, '-z', fz, fx1 - 0.75, fx1 - 0.25, 7.4, 14.2, p.trim, 0.12)
  slabOn(out, '-z', fz, fx0 - 0.4, fx1 + 0.4, 14.3, 15.1, 0.6, p.trim)                                 // the entablature
  // the attic: the panel with the allegories, statues over its piers, the pavilion's roof
  rectOn(out, '-z', fz, fm - 5, fm + 5, 15.8, 17.6, p.deep, 0.06)
  slabOn(out, '-z', fz, fx0 - 0.5, fx1 + 0.5, 18.0, 18.6, 0.7, p.trim)
  for (const x of [fx0 + 1, fx0 + bay * 2, fx1 - bay * 2, fx1 - 1]) statue(out, x, fz - 0.4, 18.6, 2.6, p.trim)
  pavilionRoof(out, fx0, fx1, fz, z0 + 4, 18.6, 3.0, p, { top: 2.4, crest: false })
  // ---- the auditorium: its drum of wall rising out of the block, the round-hipped slate roof, the lantern
  const [hx0, hx1, hz0, hz1] = o.hall
  block(out, hx0, hx1, hz0, hz1, eaves, 20.8, shade(p.stone, 0.96))
  for (const [f, x] of [['-x', hx0], ['+x', hx1]] as const) {
    for (let z = hz0 + 3; z < hz1 - 2; z += 4.2) archOn(out, f, x, z, 16.4, 1.4, 3.0, p.glass, 0.05)
  }
  block(out, hx0 - 0.4, hx1 + 0.4, hz0 - 0.4, hz1 + 0.4, 20.6, 21.2, p.trim)
  // round-hipped: a hipped roof whose slopes curve, drawn as two stacked hips, the steep lower one first
  hipRoof(out, hx0, hx1, hz0, hz1, 21.2, 2.4, p.slate, 0.2)
  const ins = 3.4
  hipRoof(out, hx0 + ins, hx1 - ins, hz0 + ins, hz1 - ins, 23.4, 1.6, shade(p.slate, 0.94), 0)
  const [lx, lz] = o.lantern
  prism(out, lx, lz, 24.8, 27.6, 2.3, 8, p.stone, FIXED)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8
    block(out, lx + Math.sin(a) * 2.25 - 0.3, lx + Math.sin(a) * 2.25 + 0.3, lz + Math.cos(a) * 2.25 - 0.3, lz + Math.cos(a) * 2.25 + 0.3, 25.3, 27.2, p.glass)
  }
  dome(out, lx, lz, 27.6, 2.5, 1.6, p.lead, 8)
  prism(out, lx, lz, 29.1, 30.2, 0.12, 6, p.gold, FIXED, 0.03)
}
