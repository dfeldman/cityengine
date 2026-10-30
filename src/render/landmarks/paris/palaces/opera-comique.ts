import type { MeshBuilder } from '../../../buildings.ts'
import { box } from '../../../models.ts'
import { block, classicalColumn, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, dormers, fitted, hipRoof, mansard, palette, range, rectOn, slabOn, statue } from './common.ts'

const FIXED = 0
/** the design footprint: OSM way 54572719's box turned 15.5° to the theatre's axes (local −z faces bearing 195.5) */
const HX = 15.2
const HZ = 28.5

/**
 * The Opéra-Comique, the third Salle Favart (Louis Bernier, 1893–98), its front on the little Place Boieldieu and its
 * flanks down the Rues Favart and Marivaux. The street front is the building, and it is a Beaux-Arts piece:
 *
 * - a PERRON of six steps; the rusticated ground floor with its three tall round-arched doorways;
 * - the first floor's three great arched windows between paired Corinthian columns, the statues of Music and Poetry in
 *   the niches of the side bays;
 * - the ATTIC of six windows alternating with six caryatids, the cornice with its masks and acroteria;
 * - over it all a slate mansard, and behind it the stage house's taller roof.
 *
 * Plan: way 54572719 in this frame (osmium, 2026-10-29): the block x ±15.2 by z −25.6…+28.5, the front's middle
 * standing proud to z −27.4 between x ±10.2, the four column bases mapped at x ±2.7, ±8.1 on its face.
 */
export function operaComique(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e6dcc6', '#4c5358')
  const eaves = 20.6
  const dark = shade(p.dark, 1.5)
  // ---- the block, its flanks on the two streets: five storeys of windows, rusticated below, the mansard over
  range(out, -15.2, 15.2, -25.6, 28.5, p, {
    eaves, bay: 3.3, win: 1.5, faces: ['-x', '+x', '+z'], rustic: 0.6, rusticTo: 7.6, quoins: true, cornice: 0.7,
    storeys: [{ y: 0, h: 3.6, sill: 0.8 }, { y: 4.6, h: 1.6, sill: 0.3 }, { y: 8.2, h: 3.2, sill: 0.6 }, { y: 12.6, h: 2.6, sill: 0.5 }, { y: 16.4, h: 2.2, sill: 0.5 }],
  })
  mansard(out, -15.2, 15.2, -25.6, 28.5, eaves, 3.6, 1.8, p.slate, 1.6)
  for (const [f, x] of [['-x', -15.2], ['+x', 15.2]] as const) dormers(out, f, x, -22, 25, eaves, 4.4, p, { set: 0.9, every: 2, round: true })
  // the stage house toward the back, its roof over the mansard
  block(out, -11, 11, 6, 26, eaves, 24.4, shade(p.stone, 0.95))
  hipRoof(out, -11, 11, 6, 26, 24.4, 4.2, p.slate, 0.3)
  // ---- the front on the Place Boieldieu: the proud middle and the side bays
  const fz = -27.4
  block(out, -10.2, 10.2, fz, -25.6, 0, eaves, p.stone)
  // the perron
  for (let i = 0; i < 6; i++) block(out, -9.4 + i * 0.12, 9.4 - i * 0.12, fz - 2.4 + i * 0.4, fz, 0, 0.18 * (i + 1), shade(p.stone, 0.9 + (i % 2) * 0.05))
  // the rusticated ground floor and its three doorways
  for (let y = 0.6; y < 7.4; y += 0.6) rectOn(out, '-z', fz, -10.2, 10.2, y - 0.05, y + 0.05, p.deep, 0.035)
  for (const x of [-5.4, 0, 5.4]) {
    archOn(out, '-z', fz, x, 1.1, 3.4, 6.0, dark, 0.06)
    archOn(out, '-z', fz, x, 1.1, 3.9, 6.3, p.trim, 0.04)
  }
  slabOn(out, '-z', fz, -10.6, 10.6, 7.4, 8.1, 0.7, p.trim)
  balustrade(out, -10, 10, fz - 0.7, fz, 8.1, p, { sides: ['-z'], h: 0.9 })
  // the first floor: three great arched windows between paired Corinthian columns, the band with the name over them
  for (const x of [-5.4, 0, 5.4]) archOn(out, '-z', fz, x, 9.2, 2.8, 5.6, p.glass, 0.06)
  for (const x of [-8.1, -2.7, 2.7, 8.1]) {
    for (const d of [-0.55, 0.55]) classicalColumn(out, x + d, fz - 0.55, 8.1, 15.2, 0.36, p.trim, { order: 'corinthian', tier: 'mid', tag: FIXED, trim: p.trim })
  }
  slabOn(out, '-z', fz, -10.6, 10.6, 15.2, 16.2, 1.0, p.trim)                                        // the entablature
  rectOn(out, '-z', fz - 1.0, -6.5, 6.5, 15.45, 15.95, dark, 0.03)                                    // the name
  // the attic: six windows and six caryatids, the cornice and its acroteria
  for (let k = 0; k < 6; k++) {
    const x = -8.75 + k * 3.5
    rectOn(out, '-z', fz, x - 0.6, x + 0.6, 16.9, 19.0, p.glass, 0.06)
    const cx = x + 1.75
    if (k < 5) box(out, cx, 17.9, fz - 0.35, 0.32, 1.25, 0.3, shade(p.trim, 0.97), FIXED)
  }
  box(out, -10.25 + 0.3, 17.9, fz - 0.35, 0.32, 1.25, 0.3, shade(p.trim, 0.97), FIXED)
  slabOn(out, '-z', fz, -10.8, 10.8, 19.6, eaves + 0.3, 0.9, p.trim)
  for (const x of [-10, -3.4, 3.4, 10]) box(out, x, eaves + 0.9, fz - 0.4, 0.45, 0.6, 0.3, p.trim, FIXED)
  box(out, 0, eaves + 1.4, fz - 0.4, 1.5, 1.1, 0.25, p.trim, FIXED)                                  // the Republic's cartouche
  // the side bays: a window over each door, the niches with Music and Poetry
  for (const s of [-1, 1]) {
    const x = s * 12.7
    archOn(out, '-z', -25.6, x, 1.0, 2.0, 4.6, dark, 0.06)
    archOn(out, '-z', -25.6, x, 8.8, 1.9, 4.6, shade(p.stone, 0.72), 0.06)
    statue(out, x, -26.0, 8.9, 3.2, p.trim)
    rectOn(out, '-z', -25.6, x - 0.7, x + 0.7, 16.9, 19.0, p.glass, 0.06)
  }
}
