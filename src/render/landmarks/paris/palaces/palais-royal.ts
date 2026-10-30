import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, classicalColumn, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import {
  archOn, balustrade, clockOn, dormers, extrude, fitted, mansard, palette, pedimentOn, pts, rectOn, slabOn, statue, type F, type Pal,
} from './common.ts'
import { EMIT, lettersOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM relation 3300400's box turned 19.5° to the palace's axes (local −z faces bearing 199.5) */
const HX = 71.8
const HZ = 68.4

/**
 * OSM's outline of the palace (relation 3300400, osmium 2026-10-29), simplified, in this frame — with the Cour d'honneur
 * (its inner ring) and the Galerie d'Orléans' court (its other inner ring) joined and opened to the garden, so the ring
 * goes round the court: the galerie's two low colonnades between them are drawn on their own, not extruded at palace
 * height. The Cour de l'Horloge is the notch open to the Place du Palais-Royal between the wings at x 11.6 and 50. The block at
 * its south-west corner, x −71.8…−28.4, z −44.6…5.1, is the Salle Richelieu, and is left out of this ring and drawn by `salleRichelieu`.
 */
const PLAN = pts([
  -28.5, -35.5, -10.7, -35.2, -10.4, -62.0, -9.4, -64.1, -7.8, -65.6, -6.5, -66.0,
  10.2, -65.9, 11.5, -65.2, 11.5, -62.3, 11.7, -37.0, 12.2, -36.4, 49.9, -36.5, 50.2, -63.3, 50.5, -66.4, 52.3, -66.9, 69.2, -67.8,
  70.6, -67.2, 71.4, -64.9, 71.6, -11.6, 71.4, -5.7, 69.4, -4.2, 69.8, 1.2, 69.7, 6.3, 71.5, 7.5, 71.8, 68.4, 58.7, 68.3, 58.8, 62.3,
  45.0, 62.2, 45.0, 33.6, 46.3, 33.2, 46.6, -16.5, 42.4, -16.8, 40.7, -15.1, 21.0, -15.7, 7.3, -16.8, -13.1, -16.1, -14.7, -17.9,
  -19.2, -17.8, -19.8, 32.7, -20.4, 33.6, -20.6, 61.8, -32.1, 61.7, -32.2, 67.5, -45.5, 67.8, -44.9, 5.1, -28.5, 5.1,
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
 *   between where the glass roof was;
 * - the SALLE RICHELIEU, the Comédie-Française (Victor Louis, 1786–90; rebuilt after the fire of 1900) at the south-west corner of
 *   the same relation, on the Place Colette and the Rue de Richelieu: see `salleRichelieu`.
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
  salleRichelieu(out)
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

/**
 * The Salle Richelieu, the Comédie-Française, on the corner of the Place Colette (−z) and the Rue de Richelieu (−x), in warmer stone than
 * the palace. A rider going round it sees:
 *
 * - the COLONNADE of plain Tuscan columns round both streets, the wall and its arched fanlights in the shade well behind them, lanterns
 *   hanging in the bays;
 * - over its entablature the long iron BALCONY, COMEDIE-FRANCAISE in gold letters on its rail, the red banner hanging above it;
 * - two tall storeys and a low one of windows between pilasters, striped blinds in the tall ones; the cornice, the balustrade, the slate
 *   mansard and its dormers;
 * - the notch OSM draws at the corner, its stone piers rising the whole height.
 *
 * Plan from OSM (the south-west corner of relation 3300400, x −71.8…−28.4, z −44.6…5.1; the outline is the colonnade's outer face, so the
 * upper floors stand over the columns and the wall behind them is 3.6 m back). Heights off photographs from the Place Colette and the Rue de
 * Richelieu (Commons), scaled on the doors: entablature 6.2–7.6, balcony 7.9, cornice 20.2, mansard 24.6. The block behind the fronts,
 * toward the garden, is a plain mass under its roofs: it does not show. I could not confirm how far the colonnade runs up the Rue de Richelieu;
 * it is drawn to the end of OSM's block.
 */
function salleRichelieu(out: MeshBuilder): void {
  const p = palette('#cbbd9b', '#4c5358')
  const X0 = -71.8
  const XR = -65
  const X1 = -28.4
  const ZS = -44.6
  const ZW = -36.9
  const ZN = 5.1
  const deep = 3.6
  const yP = 6.6
  const eaves = 20.2
  // ---- the upper floors, carried over the colonnade
  block(out, XR, X1, ZS, ZW, yP, eaves, p.stone)
  block(out, X0, X1, ZW, ZN, yP, eaves, p.stone)
  // the wall in the shade behind the columns
  block(out, X0 + deep, X1, ZW, ZN, 0, yP, shade(p.stone, 0.92))
  block(out, XR, X1, ZS + deep, ZW, 0, yP, shade(p.stone, 0.92))
  // the piers at the ends of each colonnade
  const pier = (x0: number, x1: number, z0: number, z1: number): void => {
    block(out, x0, x1, z0, z1, 0, yP, p.stone)
    for (let y = 0.6; y < 6; y += 0.6) block(out, x0 - 0.03, x1 + 0.03, z0 - 0.03, z1 + 0.03, y - 0.04, y + 0.04, p.deep)
  }
  pier(XR, XR + 2.8, ZS, ZS + deep)
  pier(X1 - 2.8, X1, ZS, ZS + deep)
  pier(X0, X0 + deep, ZW, ZW + 2.8)
  pier(X0, X0 + deep, ZN - 2.4, ZN)
  // ---- the colonnade on the place, on the street: Tuscan shafts, the entablature, the balcony and its rail
  const glow = hex('#f3d48c')
  const nS = 10
  const stepS = (X1 - XR - 5.6) / nS
  for (let k = 0; k <= nS; k++) {
    classicalColumn(out, XR + 2.8 + k * stepS, ZS + 0.6, 0, 6.2, 0.48, p.trim, { order: 'doric', tier: 'mid', tag: FIXED, trim: p.trim })
  }
  for (let k = 0; k < nS; k++) {
    const x = XR + 2.8 + (k + 0.5) * stepS
    prism(out, x, ZS + 1.9, 4.6, 5.3, 0.17, 6, glow, EMIT, 0.17)
    archOn(out, '-z', ZS + deep, x, 3.6, 2.3, 2.4, p.glass, 0.05)
    if (k === 4 || k === 5) rectOn(out, '-z', ZS + deep, x - 1.1, x + 1.1, 0, 3.4, p.dark, 0.05)
    else {
      rectOn(out, '-z', ZS + deep, x - 0.85, x + 0.85, 0.2, 3.3, shade(p.dark, 2.2), 0.05)
      rectOn(out, '-z', ZS + deep, x - 0.03, x + 0.03, 0.2, 3.3, p.gold, 0.07)
    }
  }
  const nW = 13
  const stepW = (ZN - ZW - 5.2) / nW
  for (let k = 0; k <= nW; k++) {
    classicalColumn(out, X0 + 0.6, ZW + 2.8 + k * stepW, 0, 6.2, 0.48, p.trim, { order: 'doric', tier: 'mid', tag: FIXED, trim: p.trim })
  }
  for (let k = 0; k < nW; k++) {
    const z = ZW + 2.8 + (k + 0.5) * stepW
    prism(out, X0 + 1.9, z, 4.6, 5.3, 0.17, 6, glow, EMIT, 0.17)
    archOn(out, '-x', X0 + deep, z, 0.6, 1.9, 5.2, p.glass, 0.05)
  }
  block(out, XR, X1, ZS - 0.1, ZS + 1.5, 6.2, 7.6, p.trim)
  block(out, X0 - 0.1, X0 + 1.5, ZW, ZN, 6.2, 7.6, p.trim)
  block(out, XR - 0.5, X1 + 0.1, ZS - 0.6, ZS + 1, 7.6, 7.9, shade(p.stone, 1.05))
  block(out, X0 - 0.6, X0 + 1, ZW - 0.1, ZN, 7.6, 7.9, shade(p.stone, 1.05))
  // the iron rail
  const railS = (x: number): void => block(out, x - 0.02, x + 0.02, ZS - 0.56, ZS - 0.52, 7.9, 8.95, p.dark)
  for (let x = XR; x <= X1; x += 1) railS(x)
  block(out, XR - 0.4, X1, ZS - 0.57, ZS - 0.51, 8.9, 9, p.dark)
  block(out, XR - 0.4, X1, ZS - 0.57, ZS - 0.51, 8.1, 8.16, p.dark)
  for (let z = ZW; z <= ZN; z += 1) block(out, X0 - 0.56, X0 - 0.52, z - 0.02, z + 0.02, 7.9, 8.95, p.dark)
  block(out, X0 - 0.57, X0 - 0.51, ZW, ZN, 8.9, 9, p.dark)
  rectOn(out, '-z', ZS - 0.52, (XR + X1) / 2 - 7.2, (XR + X1) / 2 + 7.2, 8.1, 9, p.dark, 0.03)                  // the rail is close-set behind the name
  lettersOn(out, '-z', ZS - 0.52, (XR + X1) / 2, 8.2, 'COMEDIE-FRANCAISE', { h: 0.66, c: hex('#f0cf6a'), wide: 0.62, th: 0.11, gap: 0.12, d: 0.08 })
  // ---- the fronts above: the pilasters and three storeys of windows
  richelieuFront(out, p, '-z', ZS, XR, X1, stepS, XR + 2.8, nS)
  richelieuFront(out, p, '-x', X0, ZW, ZN, stepW, ZW + 2.8, nW)
  richelieuFront(out, p, '-z', ZW, X0, XR, 3.4, X0, 2)
  richelieuFront(out, p, '-x', XR, ZS, ZW, 3.85, ZS, 2)
  richelieuFront(out, p, '+x', X1, ZS, ZW, 3.85, ZS, 2)
  // the red banner
  const bx = (XR + X1) / 2 - 3.5 * stepS
  rectOn(out, '-z', ZS, bx - 0.95, bx + 0.95, 9.2, 19, hex('#b4212b'), 0.3)
  const word = (w: string, x: number, y0: number, step: number): void => {
    for (let i = 0; i < w.length; i++) lettersOn(out, '-z', ZS - 0.3, x, y0 - i * step, w[i], { h: 0.72, c: hex('#f4efe6'), wide: 0.72, th: 0.11, d: 0.02 })
  }
  word('COMEDIE', bx - 0.42, 17.6, 1.24)
  word('FRANCAISE', bx + 0.42, 17.9, 0.98)
  // ---- the cornice, the balustrade, the mansard
  block(out, XR - 0.5, X1 + 0.3, ZS - 0.5, ZW, eaves - 0.8, eaves, shade(p.stone, 1.05))
  block(out, X0 - 0.5, X1 + 0.3, ZW - 0.3, ZN, eaves - 0.8, eaves, shade(p.stone, 1.05))
  // the balustrade along both fronts: a plinth, a rail, a stone post to each bay and its short balusters drawn as one dark band
  block(out, XR, X1, ZS, ZS + 0.5, eaves, eaves + 0.22, p.trim)
  block(out, XR, X1, ZS, ZS + 0.5, eaves + 0.8, eaves + 0.98, p.trim)
  block(out, XR, X1, ZS + 0.1, ZS + 0.4, eaves + 0.22, eaves + 0.8, p.deep)
  block(out, X0, X0 + 0.5, ZW, ZN, eaves, eaves + 0.22, p.trim)
  block(out, X0, X0 + 0.5, ZW, ZN, eaves + 0.8, eaves + 0.98, p.trim)
  block(out, X0 + 0.1, X0 + 0.4, ZW, ZN, eaves + 0.22, eaves + 0.8, p.deep)
  for (let k = 0; k <= nS; k++) block(out, XR + 2.8 + k * stepS - 0.25, XR + 2.8 + k * stepS + 0.25, ZS - 0.02, ZS + 0.52, eaves, eaves + 1, p.trim)
  for (let k = 0; k <= nW; k++) block(out, X0 - 0.02, X0 + 0.52, ZW + 2.8 + k * stepW - 0.25, ZW + 2.8 + k * stepW + 0.25, eaves, eaves + 1, p.trim)
  mansard(out, XR + 0.7, X1, ZS + 0.7, ZW + 2, eaves, 3, 1.3, p.slate, 1.5)
  mansard(out, X0 + 0.7, X1, ZW + 0.5, ZN, eaves, 3, 1.3, p.slate, 1.5)
  dormers(out, '-z', ZS + 0.7, XR + 1, X1 - 1, eaves + 0.3, stepS, p, { round: true, w: 1.1, h: 1.6, set: 0.4, every: 2 })
  dormers(out, '-x', X0 + 0.7, ZW + 1, ZN - 1, eaves + 0.3, stepW, p, { round: true, w: 1.1, h: 1.6, set: 0.4, every: 2 })
}

/** A front of the Salle Richelieu from its balcony to its cornice: `n` bays of `step` from `first`, pilasters between, three storeys. */
function richelieuFront(out: MeshBuilder, p: Pal, f: F, plane: number, t0: number, t1: number, step: number, first: number, n: number): void {
  const blind = hex('#e7e2d4')
  const blind2 = hex('#a3a092')
  for (let k = 0; k <= n; k++) {
    const t = Math.min(t1 - 0.4, Math.max(t0 + 0.4, first + k * step))
    slabOn(out, f, plane, t - 0.38, t + 0.38, 7.9, 19, 0.18, shade(p.stone, 1.03))
    slabOn(out, f, plane, t - 0.5, t + 0.5, 18.5, 19.2, 0.28, p.trim)
  }
  for (let k = 0; k < n; k++) {
    const t = first + (k + 0.5) * step
    const hw = Math.min(0.92, step * 0.3)
    // the tall storey: frame, panes under a striped blind, the little head over it
    rectOn(out, f, plane, t - hw - 0.2, t + hw + 0.2, 9.1, 12.9, p.trim, 0.04)
    rectOn(out, f, plane, t - hw, t + hw, 9.3, 12.7, p.glass, 0.06)
    rectOn(out, f, plane, t - hw, t + hw, 11.1, 12.7, blind, 0.08)
    for (const u of [-hw * 0.5, 0, hw * 0.5]) rectOn(out, f, plane, t + u - 0.07, t + u + 0.07, 11.1, 12.7, blind2, 0.09)
    slabOn(out, f, plane, t - hw - 0.35, t + hw + 0.35, 12.95, 13.2, 0.22, p.trim)
    // the second, shorter, the third, low
    rectOn(out, f, plane, t - hw - 0.14, t + hw + 0.14, 13.8, 16.4, p.trim, 0.04)
    rectOn(out, f, plane, t - hw + 0.04, t + hw - 0.04, 13.95, 16.25, p.glass, 0.06)
    rectOn(out, f, plane, t - hw * 0.8, t + hw * 0.8, 17, 18.3, p.glass, 0.06)
  }
}
