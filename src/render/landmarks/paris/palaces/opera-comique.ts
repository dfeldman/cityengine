import type { MeshBuilder } from '../../../buildings.ts'
import { box } from '../../../models.ts'
import { block, classicalColumn, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, dormers, fitted, hipRoof, mansard, palette, range, rectOn, slabOn, statue } from './common.ts'

const FIXED = 0
/** the stone is a warm honey cream (Commons photo P1030058, 2010s), gilt on the great windows' frames */
const STONE = '#e6d8b0'
const GILT: [number, number, number] = [0.78, 0.62, 0.25]
const GLASS_LANTERN: [number, number, number] = [0.45, 0.58, 0.66]
/** the design footprint: OSM way 54572719's box turned 15.5° to the theatre's axes (local −z faces bearing 195.5) */
const HX = 15.2
const HZ = 28.5
/** the front columns' radius (metres) */
const COL_R = 0.45

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
  const p = palette(STONE, '#3f464b')
  const eaves = 20.6
  const dark = shade(p.dark, 1.5)
  // ---- the block, its flanks on the two streets: five storeys of windows, rusticated below, the mansard over
  range(out, -15.2, 15.2, -25.6, 28.5, p, {
    eaves, bay: 3.3, win: 1.5, faces: ['+z'], rustic: 0.6, rusticTo: 7.6, quoins: true, cornice: 0.7,
    storeys: [{ y: 0, h: 3.6, sill: 0.8 }, { y: 4.6, h: 1.6, sill: 0.3 }, { y: 8.2, h: 3.2, sill: 0.6 }, { y: 12.6, h: 2.6, sill: 0.5 }, { y: 16.4, h: 2.2, sill: 0.5 }],
  })
  mansard(out, -15.2, 15.2, -25.6, 28.5, eaves, 2.6, 1.4, p.slate, 1.6)
  // the flanks on the two streets are mostly blank ashlar, as photographed: a rusticated base with a door, one aedicule with its
  // statue near the front, and three tall windows high up, spaced wide
  for (const [f, x] of [['-x', -15.2], ['+x', 15.2]] as const) {
    for (let y = 0.6; y < 7.4; y += 0.6) rectOn(out, f, x, -25.6, 28.5, y - 0.05, y + 0.05, p.deep, 0.035)
    slabOn(out, f, x, -25.9, 28.8, 7.4, 8.1, 0.45, p.trim)
    archOn(out, f, x, 14, 0.8, 2.4, 5.2, shade(p.dark, 1.5), 0.06)
    rectOn(out, f, x, -17.2, -13.8, 9.4, 15.2, shade(p.stone, 1.06), 0.12)
    archOn(out, f, x, -15.5, 10.0, 1.7, 3.6, shade(p.stone, 0.7), 0.16)
    statue(out, f === '-x' ? x - 0.3 : x + 0.3, -15.5, 10.0, 2.6, p.trim)
    for (const z of [-4, 6, 16]) for (const [y0, y1] of [[9.0, 13.2], [16.6, 18.6]] as const) {
      rectOn(out, f, x, z - 0.9, z + 0.9, y0, y1, p.trim, 0.06)
      rectOn(out, f, x, z - 0.7, z + 0.7, y0 + 0.15, y1 - 0.15, p.glass, 0.1)
    }
    dormers(out, f, x, -22, 25, eaves, 4.4, p, { set: 0.9, every: 3, round: true })
  }
  // the stage house toward the back, its roof over the mansard
  block(out, -11, 11, 6, 26, eaves, 24.4, shade(p.stone, 0.95))
  hipRoof(out, -11, 11, 6, 26, 24.4, 3.4, p.slate, 0.3)
  block(out, -5, 5, 12, 20, 27.4, 29.2, GLASS_LANTERN)                                                // the glass roof over the hall
  // ---- the front on the Place Boieldieu: the proud middle and the side bays
  const fz = -27.4
  const RB = 25.6   // the recessed loggia wall: the columns stand COL_D proud of it
  block(out, -10.2, 10.2, fz, -RB, 0, 8.1, p.stone)                                                   // the base: rusticated ground floor
  block(out, -10.2, 10.2, fz, -RB, 16.2, eaves, p.stone)                                              // the attic, carried on the columns
  // the perron
  for (let i = 0; i < 6; i++) block(out, -9.4 + i * 0.12, 9.4 - i * 0.12, fz - 2.4 + i * 0.4, fz, 0, 0.18 * (i + 1), shade(p.stone, 0.9 + (i % 2) * 0.05))
  // the rusticated ground floor and its three doorways, the doors dark behind gilt-edged iron
  for (let y = 0.6; y < 7.4; y += 0.6) rectOn(out, '-z', fz, -10.2, 10.2, y - 0.05, y + 0.05, p.deep, 0.035)
  for (const x of [-5.4, 0, 5.4]) {
    archOn(out, '-z', fz, x, 1.1, 3.4, 6.0, dark, 0.06)
    archOn(out, '-z', fz, x, 1.1, 3.9, 6.3, p.trim, 0.04)
    rectOn(out, '-z', fz, x - 1.5, x + 1.5, 0.6, 3.0, shade(p.dark, 0.7), 0.1)
    for (let k = -2; k <= 2; k++) rectOn(out, '-z', fz, x + k * 0.62 - 0.05, x + k * 0.62 + 0.05, 0.6, 3.0, GILT, 0.14)
  }
  box(out, 0, 7.75, fz - 0.35, 10.6, 0.35, 0.35, p.trim, FIXED)                                         // the balcony's cornice, proud
  balustrade(out, -10, 10, fz - 0.7, fz, 8.1, p, { sides: ['-z'], h: 0.9 })
  box(out, 0, 8.14, (fz - 0.7 - RB) / 2, 10.2, 0.04, (-fz + 0.7 - RB) / 2, shade(p.stone, 0.92), FIXED)
  // the first floor: the loggia. Three great arched openings in the recessed wall, deep dark, gilt-framed windows in them,
  // and between them four pairs of fat Corinthian columns standing on the balcony
  rectOn(out, '-z', -RB, -10.2, 10.2, 8.1, 16.2, shade(p.stone, 0.8), 0.03)
  for (const x of [-5.4, 0, 5.4]) {
    rectOn(out, '-z', -RB, x - 2.1, x + 2.1, 8.1, 14.3, shade(p.dark, 0.6), 0.06)
    archOn(out, '-z', -RB, x, 8.1, 4.2, 6.6, shade(p.dark, 0.6), 0.07)
    archOn(out, '-z', -RB, x, 9.0, 3.5, 6.1, GILT, 0.1)
    archOn(out, '-z', -RB, x, 9.4, 2.8, 5.6, p.glass, 0.13)
  }
  for (const x of [-8.1, -2.7, 2.7, 8.1]) {
    for (const d of [-0.62, 0.62]) classicalColumn(out, x + d, fz - 0.4, 8.1, 15.2, COL_R, p.trim, { order: 'corinthian', tier: 'mid', tag: FIXED, trim: p.trim })
  }
  // the entablature, deep and shadowing, the name band on it; the keystone masks over the arches
  box(out, 0, 15.7, (fz - 1.0 - RB) / 2, 10.8, 0.5, (-fz + 1.0 - RB) / 2, p.trim, FIXED)
  rectOn(out, '-z', fz - 1.0, -6.5, 6.5, 15.45, 15.95, dark, 0.03)                                    // the name
  for (const x of [-5.4, 0, 5.4]) box(out, x, 14.6, fz - 0.45, 0.4, 0.6, 0.25, p.deep, FIXED)
  // the attic: six windows and six caryatids on their pilasters, the cornice and its acroteria
  for (let k = 0; k < 6; k++) {
    const x = -8.75 + k * 3.5
    rectOn(out, '-z', fz, x - 0.6, x + 0.6, 16.9, 19.0, p.glass, 0.06)
    const cx = x + 1.75
    if (k < 5) { box(out, cx, 17.9, fz - 0.35, 0.35, 1.2, 0.25, shade(p.trim, 0.97), FIXED); box(out, cx, 19.35, fz - 0.35, 0.45, 0.15, 0.35, p.trim, FIXED) }
  }
  box(out, -10.25 + 0.3, 17.9, fz - 0.35, 0.35, 1.2, 0.25, shade(p.trim, 0.97), FIXED)
  slabOn(out, '-z', fz, -10.8, 10.8, 19.6, eaves + 0.3, 1.1, p.trim)
  for (const x of [-10, -3.4, 3.4, 10]) box(out, x, eaves + 1.0, fz - 0.4, 0.3, 0.5, 0.2, p.trim, FIXED)
  box(out, 0, eaves + 1.6, fz - 0.4, 1.1, 0.8, 0.18, p.trim, FIXED)                                  // the Republic's cartouche
  // the side bays: a window over each door, the niches with Music and Poetry
  for (const s of [-1, 1]) {
    const x = s * 12.7
    archOn(out, '-z', -25.6, x, 1.0, 2.0, 4.6, dark, 0.06)
    archOn(out, '-z', -25.6, x, 8.8, 1.9, 4.6, shade(p.stone, 0.72), 0.06)
    statue(out, x, -26.0, 8.9, 3.2, p.trim)
    rectOn(out, '-z', -25.6, x - 0.7, x + 0.7, 16.9, 19.0, p.glass, 0.06)
  }
}
