import type { MeshBuilder } from '../../../buildings.ts'
import { block, classicalColumn, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import {
  archOn, balustrade, clockOn, extrude, fitted, palette, pedimentOn, pts, rectOn, slabOn, statue, type F, type Pal,
} from './common.ts'

const FIXED = 0
/** the design footprint: OSM relation 3300400's box turned 19.5° to the palace's axes (local −z faces bearing 199.5) */
const HX = 71.8
const HZ = 68.4

/**
 * OSM's outline of the palace (relation 3300400, osmium 2026-10-29), simplified, in this frame — with the Cour d'honneur
 * (its inner ring) and the Galerie d'Orléans' court (its other inner ring) joined and opened to the garden, so the ring
 * goes round the court: the galerie's two low colonnades between them are drawn on their own, not extruded at palace
 * height. The Cour de l'Horloge is the notch open to the Place du Palais-Royal between the wings at x 11.6 and 50.
 */
const PLAN = pts([
  -71.8, -36.9, -64.8, -36.5, -65.0, -44.6, -28.3, -44.4, -28.5, -35.5, -10.7, -35.2, -10.4, -62.0, -9.4, -64.1, -7.8, -65.6, -6.5, -66.0,
  10.2, -65.9, 11.5, -65.2, 11.5, -62.3, 11.7, -37.0, 12.2, -36.4, 49.9, -36.5, 50.2, -63.3, 50.5, -66.4, 52.3, -66.9, 69.2, -67.8,
  70.6, -67.2, 71.4, -64.9, 71.6, -11.6, 71.4, -5.7, 69.4, -4.2, 69.8, 1.2, 69.7, 6.3, 71.5, 7.5, 71.8, 68.4, 58.7, 68.3, 58.8, 62.3,
  45.0, 62.2, 45.0, 33.6, 46.3, 33.2, 46.6, -16.5, 42.4, -16.8, 40.7, -15.1, 21.0, -15.7, 7.3, -16.8, -13.1, -16.1, -14.7, -17.9,
  -19.2, -17.8, -19.8, 32.7, -20.4, 33.6, -20.6, 61.8, -32.1, 61.7, -32.2, 67.5, -45.5, 67.8, -44.9, 5.1, -71.7, 5.0,
])

/**
 * The Palais-Royal (Lemercier for Richelieu, 1630s; the fronts on the place by Moreau-Desproux after the fire of 1763,
 * the central building and the north front on the Cour d'honneur by Contant d'Ivry; the Galerie d'Orléans by Fontaine,
 * 1829), the Conseil d'État and the Ministry of Culture. Three things a rider meets:
 *
 * - the FRONT ON THE PLACE DU PALAIS-ROYAL: the two wings come forward to the place, each ending in a frontispiece of
 *   columns under a pediment; between them the COUR DE L'HORLOGE is closed toward the place by a Doric COLONNADE framed
 *   by two sets of grilled ARCADES; at the back of that court the central pavilion with its columns, pediment, clock
 *   and statues, and the triple passage through to the Cour d'honneur;
 * - the COUR D'HONNEUR (Buren's columns are the city's own: `burenColumns`): arcaded at the ground floor on three sides,
 *   Contant d'Ivry's front with its columns and Pajou's statues on the south;
 * - the GALERIE D'ORLÉANS closing it toward the garden: two long Doric colonnades, single-storey, with the open space
 *   between where the glass roof was.
 *
 * Everything stone, three storeys over an arcaded ground floor to a cornice at 17.5 m, slate roofs.
 */
export function palaisRoyal(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e3d9c4', '#4c5358')
  const eaves = 17.5
  extrude(out, [PLAN], p, { eaves, bay: 3.6, win: 1.5, rise: 4.6, inset: 2.6,
    storeys: [{ y: 0, h: 3.4, sill: 0.8 }, { y: 6.6, h: 3.4, sill: 0.7 }, { y: 11.4, h: 2.8, sill: 0.6 }, { y: 15.2, h: 1.2, sill: 0.4 }] })
  const dark = shade(p.dark, 1.5)
  // ---- the arcaded ground floor round the Cour d'honneur and along the wings on the place
  arcadeOn(out, p, '+z', -16.4, -12.5, 40, 3.6)
  arcadeOn(out, p, '+x', -19.5, -17, 32, 3.6)
  arcadeOn(out, p, '-x', 46.45, -16, 32.6, 3.6)
  arcadeOn(out, p, '+x', 11.6, -62, -37.5, 3.6)
  arcadeOn(out, p, '-x', 50.0, -63, -37.5, 3.6)
  // ---- the wings' frontispieces on the place: columns over the arcade, the pediment
  frontispiece(out, p, '-z', -66.0, 0.0, 14)
  frontispiece(out, p, '-z', -67.6, 60.6, 14)
  // ---- the screen closing the Cour de l'Horloge: the Doric colonnade in the middle, the grilled arcades either side
  const sz = -65.6
  for (const [a, b] of [[11.6, 22.6], [39.2, 50.2]]) {
    block(out, a, b, sz, sz + 1.6, 0, 8.4, p.stone)
    for (let k = 0; k < 3; k++) {
      const t = a + ((b - a) * (k + 0.5)) / 3
      archOn(out, '-z', sz, t, 0, 2.6, 6.2, dark, 0.06)
      for (let g = -1; g <= 1; g++) rectOn(out, '-z', sz, t + g * 0.55 - 0.05, t + g * 0.55 + 0.05, 0, 5.4, p.dark, 0.1)       // the grille
    }
    for (let y = 0.7; y < 8; y += 0.7) rectOn(out, '-z', sz, a, b, y - 0.05, y + 0.05, p.deep, 0.035)
    block(out, a - 0.2, b + 0.2, sz - 0.2, sz + 1.8, 8.4, 9.2, p.trim)
    balustrade(out, a, b, sz, sz + 1.6, 9.2, p, { sides: ['-z', '+z'], h: 0.9 })
  }
  for (let k = 0; k < 8; k++) {
    const x = 23.4 + k * 2.2
    for (const z of [sz + 0.5, sz + 2.6]) classicalColumn(out, x, z, 0, 7.8, 0.42, p.stone, { order: 'doric', tier: 'mid', tag: FIXED, trim: p.trim })
  }
  block(out, 22.6, 39.2, sz - 0.2, sz + 3.3, 7.8, 9.2, p.trim)
  balustrade(out, 22.6, 39.2, sz - 0.2, sz + 3.3, 9.2, p, { sides: ['-z', '+z'], h: 0.9 })
  // ---- the central pavilion at the back of the court: the triple passage, columns, the clock in the pediment, statues
  const cz = -36.45
  block(out, 22.0, 40.0, cz - 1.6, cz, 0, eaves + 1.0, p.stone)
  const fz = cz - 1.6
  for (const x of [26.4, 31.0, 35.6]) archOn(out, '-z', fz, x, 0, 3.0, 6.0, dark, 0.06)
  for (const x of [23.2, 28.7, 33.3, 38.8]) {
    classicalColumn(out, x, fz - 0.5, 0, 6.6, 0.42, p.trim, { order: 'doric', tier: 'mid', tag: FIXED, trim: p.trim })
    classicalColumn(out, x, fz - 0.5, 7.0, 14.6, 0.38, p.trim, { order: 'ionic', tier: 'mid', tag: FIXED, trim: p.trim })
  }
  slabOn(out, '-z', fz, 22.0, 40.0, 6.6, 7.0, 1.0, p.trim)
  slabOn(out, '-z', fz, 21.8, 40.2, 14.6, 15.8, 1.0, p.trim)
  for (const x of [26.0, 31.0, 36.0]) rectOn(out, '-z', fz, x - 0.85, x + 0.85, 8.0, 12.8, p.glass, 0.06)
  pedimentOn(out, '-z', fz, 21.8, 40.2, eaves + 1.0, 3.6, 1.0, p.trim)
  clockOn(out, '-z', fz - 0.9, 31.0, eaves + 2.2, 0.9, p)
  for (const x of [22.4, 39.6]) statue(out, x, fz - 0.5, eaves + 1.0, 2.6, p.trim)
  statue(out, 31.0, fz - 0.5, eaves + 4.6, 2.6, p.trim)
  // ---- Contant d'Ivry's front on the Cour d'honneur: the avant-corps, its columns, Pajou's statues over the balustrade
  const hz = -16.3
  block(out, 3.0, 25.0, hz, hz + 1.4, 0, eaves + 0.8, p.stone)
  const gz = hz + 1.4
  for (const x of [8.4, 14.0, 19.6]) archOn(out, '+z', gz, x, 0, 3.0, 6.0, dark, 0.06)
  for (let k = 0; k < 8; k++) {
    const x = 4.4 + k * (19.2 / 7)
    classicalColumn(out, x, gz + 0.5, 7.0, 15.4, 0.38, p.trim, { order: 'corinthian', tier: 'mid', tag: FIXED, trim: p.trim })
    statue(out, x, gz + 0.5, eaves + 1.7, 2.4, p.trim)
  }
  slabOn(out, '+z', gz, 2.8, 25.2, 6.6, 7.0, 0.8, p.trim)
  slabOn(out, '+z', gz, 2.8, 25.2, 15.4, 16.6, 1.0, p.trim)
  balustrade(out, 3.0, 25.0, gz, gz + 1.0, eaves + 0.8, p, { sides: ['+z'], h: 0.9 })
  // ---- the Galerie d'Orléans: two single-storey Doric colonnades across the garden end of the court, roofed flat
  for (const [z0, z1] of [[32.9, 36.2], [56.3, 61.9]]) {
    // (the far tier's plain shafts: eighty-odd columns, and the palace's triangle budget)
    for (let x = -18.8; x <= 44.0; x += 3.1) {
      for (const z of [z0 + 0.5, z1 - 0.5]) classicalColumn(out, x, z, 0, 6.2, 0.34, p.stone, { order: 'doric', tier: 'far', tag: FIXED, trim: p.trim })
    }
    block(out, -20.4, 45.0, z0, z1, 6.2, 7.4, p.trim)
    for (const z of [z0, z1]) block(out, -20.4, 45.0, z - 0.2, z + 0.2, 7.4, 8.2, p.trim)
  }
}

/** Round-headed arches down a face's ground floor, `bay` apart, deep in shadow, a cornice band over them. */
function arcadeOn(out: MeshBuilder, p: Pal, f: F, plane: number, t0: number, t1: number, bay: number): void {
  const n = Math.max(1, Math.round((t1 - t0) / bay))
  const step = (t1 - t0) / n
  for (let k = 0; k < n; k++) archOn(out, f, plane, t0 + step * (k + 0.5), 0, step * 0.62, 5.0, shade(p.dark, 1.6), 0.13)
  slabOn(out, f, plane, t0, t1, 5.8, 6.2, 0.25, p.trim)
}

/** A frontispiece on a wing's end: four columns over the rusticated arcade, the entablature, a pediment with the arms. */
function frontispiece(out: MeshBuilder, p: Pal, f: F, plane: number, t: number, w: number): void {
  const d = 1.2
  const z = plane - d
  block(out, t - w / 2, t + w / 2, z, plane, 0, 17.9, p.stone)
  for (let y = 0.7; y < 6.2; y += 0.7) rectOn(out, f, z, t - w / 2, t + w / 2, y - 0.05, y + 0.05, p.deep, 0.035)
  for (const x of [t - 3.6, t, t + 3.6]) archOn(out, f, z, x, 0, 2.4, 5.0, shade(p.dark, 1.6), 0.07)
  slabOn(out, f, z, t - w / 2 - 0.2, t + w / 2 + 0.2, 6.0, 6.6, 0.6, p.trim)
  for (const x of [t - 5.4, t - 1.8, t + 1.8, t + 5.4]) classicalColumn(out, x, z - 0.5, 6.6, 15.6, 0.42, p.trim, { order: 'ionic', tier: 'mid', tag: FIXED, trim: p.trim })
  for (const x of [t - 3.6, t, t + 3.6]) {
    rectOn(out, f, z, x - 0.8, x + 0.8, 7.4, 11.0, p.glass, 0.06)
    rectOn(out, f, z, x - 0.7, x + 0.7, 12.0, 14.6, p.glass, 0.06)
  }
  slabOn(out, f, z, t - w / 2 - 0.3, t + w / 2 + 0.3, 15.6, 17.0, 1.0, p.trim)
  pedimentOn(out, f, z, t - w / 2 - 0.3, t + w / 2 + 0.3, 17.0, 3.2, 1.0, p.trim)
  rectOn(out, f, z - 1.0, t - 1.4, t + 1.4, 17.6, 18.9, shade(p.stone, 0.84), 0.03)                   // the arms, scraped off in 1848
}
