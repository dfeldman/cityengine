import type { MeshBuilder } from '../../../buildings.ts'
import { block, classicalColumn, dome, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, extrude, fitted, palette, pedimentOn, pts, rectOn, slabOn } from '../palaces/common.ts'
import { bands, rustic } from './civic.ts'
import { railX } from './modern.ts'

const FIXED = 0
/** the design footprint: OSM relation 659699's box (local −z faces bearing 226.5, the Rue de l'École-de-Médecine) */
const HX = 69.9
const HZ = 40.8

/**
 * OSM's outline and courts in this frame (osmium, 2026-10-30). The first court, x −18.6…13.6, is opened here through to the
 * street as it really is behind the colonnade: OSM's bar across its mouth, the storey over the columns, is drawn by hand.
 */
const OUTER = pts([-67, -35, -30.4, -40.8, -30.4, -37.4, -18.6, -37.4, -18, -9.6, 13.6, -9.7, 13.6, -37.4, 25.3, -37.4, 25.3, -40.8, 67.1, -36.1, 69.9, -31.9, 47.4, 39.9, 45.4, 40.8, -8.9, 15.7, -69.9, -15.7])
const COURTS = [pts([26.9, -27.3, 26.9, -13.3, 32, -14.1, 47.5, -9, 52.3, -24.7]), pts([25.6, -2.8, 18.3, 11.5, 38.1, 21, 42.7, 6.7, 27, -2.3])]

/**
 * L'ancienne Faculté de médecine (Jacques Gondouin's École de chirurgie, 1769–76, extended by Léon Ginain to the Boulevard
 * Saint-Germain at the end of the 19th century), now the seat of the Université Paris Cité. Nothing like the street
 * either side of it:
 *
 * - from the RUE DE L'ÉCOLE-DE-MÉDECINE (local −z): an open screen of free-standing Ionic columns the whole width of the
 *   front and rows deep at its middle, carrying the upper storey as a long plain box over them: tall square-headed windows, a
 *   carved relief panel in the middle, a dentilled cornice, a balustrade;
 * - through the columns, the court, and across the court the temple front of the anatomy theatre: six Corinthian columns and
 *   a pediment, a low dome behind;
 * - from the BOULEVARD SAINT-GERMAIN (local +z and its diagonal): Ginain's long stone wall, rusticated below, its roof over.
 *
 * Plan from OSM's relation 659699. Front and materials from the Commons photograph "Université Paris Descartes, Paris July
 * 2014". The court's temple front and the number and depth of the columns from memory of the building, and from the engraving
 * "Vue des Écoles de médecine et de chirurgie"; the boulevard side from memory alone.
 */
export function faculteMedecine(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d9ccae', '#545a5f')
  const E = 19.2
  extrude(out, [OUTER, ...COURTS], p, { eaves: E, bay: 4.2, win: 1.7, rise: 3.4, inset: 2, dormers: false,
    storeys: [{ y: 0, h: 3.6, sill: 1.3 }, { y: 7.2, h: 4, sill: 0.8 }, { y: 13.4, h: 2.8, sill: 0.8 }] })
  rustic(out, OUTER, 0.2, 6.6, 0.75, p.deep, 8)
  bands(out, OUTER, [6.8], 0.34, 0.2, p.trim, 6)

  // ---- the screen of columns on the street; two more rows behind them across the court's width
  const x0 = -30.4
  const x1 = 25.3
  const f = -40.8
  const Y = 9.6
  const n = 14
  const step = (x1 - x0 - 1.4) / (n - 1)
  const col = (x: number, z: number): void => classicalColumn(out, x, z, 0.6, Y - 0.1, 0.5, p.stone, { order: 'ionic', tier: 'near', tag: FIXED, heading: Math.PI, trim: p.trim })
  for (let i = 0; i < n; i++) col(x0 + 0.7 + step * i, f + 0.7)
  // (the rows behind, a third of a row each so a view through them does not fill)
  for (let i = 4; i < n - 4; i++) {
    col(x0 + 0.7 + step * i, f + 3.8)
    if (i % 2 === 0) col(x0 + 0.7 + step * i, f + 7)
  }
  // the platform they stand on, and the walk's end walls with their big arched windows
  block(out, x0 - 0.3, x1 + 0.3, f - 0.5, f + 7.6, 0, 0.6, shade(p.stone, 0.88))
  for (const a of [x0 + 5.7, x1 - 5.7]) {
    rectOn(out, '-z', -37.4, a - 2.4, a + 2.4, 0.9, 7.8, p.trim, 0.03)
    archOn(out, '-z', -37.4, a, 1.2, 3.8, 6, p.glass, 0.07)
    railX(out, a - 1.9, a + 1.9, -37.55, 0.6, 2.2, 0.28, p.dark)
  }
  // the iron railings between the outer columns
  railX(out, x0 + 0.7 + step, x0 + 0.7 + step * 4, f + 0.7, 0.6, 2.4, 0.3, p.dark)
  railX(out, x0 + 0.7 + step * 9, x0 + 0.7 + step * 12, f + 0.7, 0.6, 2.4, 0.3, p.dark)

  // ---- the upper storey carried over them: the box on the entablature, its windows, the relief, the cornice, the balustrade
  const bz = -33.6
  block(out, x0, x1, f, bz, Y, E, p.stone)
  block(out, x0 - 0.1, x1 + 0.1, f - 0.25, bz, Y - 0.1, Y + 1.25, p.trim)
  rectOn(out, '-z', f - 0.25, x0, x1, Y + 0.95, Y + 1.05, p.deep, 0.03)
  slabOn(out, '-z', f - 0.25, x0 - 0.2, x1 + 0.2, Y + 1.25, Y + 1.55, 0.2, shade(p.trim, 1.03))
  block(out, x0, x1, f, bz, Y - 0.1, Y, shade(p.stone, 0.66))
  const cx = (x0 + x1) / 2
  for (let i = 0; i < 12; i++) {
    const x = x0 + 2.3 + ((x1 - x0 - 4.6) * i) / 11
    if (Math.abs(x - cx) < 8.4) continue
    rectOn(out, '-z', f, x - 1.25, x + 1.25, Y + 2.3, E - 2.1, p.trim, 0.05)
    rectOn(out, '-z', f, x - 1, x + 1, Y + 2.55, E - 2.35, p.glass, 0.09)
    slabOn(out, '-z', f, x - 1.45, x + 1.45, E - 2.1, E - 1.85, 0.16, p.trim)
  }
  // the relief panel over the middle: a framed stone band of draped figures, shown as dim shapes on it
  rectOn(out, '-z', f, cx - 8, cx + 8, Y + 2.2, E - 1.9, p.trim, 0.05)
  rectOn(out, '-z', f, cx - 7.7, cx + 7.7, Y + 2.45, E - 2.15, shade(p.stone, 0.84), 0.07)
  const relief = shade(p.stone, 0.98)
  for (let i = 0; i < 9; i++) {
    const x = cx - 6.6 + (13.2 * i) / 8
    const seated = i === 1 || i === 4 || i === 7
    const top = Y + (seated ? 4.6 : 5.6)
    rectOn(out, '-z', f, x - (seated ? 0.62 : 0.42), x + (seated ? 0.62 : 0.42), Y + 2.6, top, relief, 0.1)
    rectOn(out, '-z', f, x - 0.21, x + 0.21 , top + 0.03, top + 0.52, relief, 0.1)
  }
  slabOn(out, '-z', f, x0 - 0.2, x1 + 0.2, E - 1.3, E - 0.9, 0.2, shade(p.stone, 0.95))
  for (let x = x0 + 0.3; x < x1; x += 0.8) block(out, x, x + 0.34, f - 0.3, f, E - 0.9, E - 0.7, p.trim)
  slabOn(out, '-z', f, x0 - 0.4, x1 + 0.4, E - 0.7, E, 0.55, p.trim)
  balustrade(out, x0, x1, f + 0.2, bz, E, p, { sides: ['-z', '+z'], h: 1.05 })
  block(out, x0, x1, f + 0.2, bz, E - 0.1, E, p.lead)

  // ---- the court's floor, and the temple front across it
  block(out, -18.3, 13.6, f + 7.6, -9.6, 0, 0.08, shade(p.stone, 0.72))
  const tf = -9.6
  const tx = -2.4
  block(out, tx - 12, tx + 12, tf - 0.3, tf + 8, 0, E + 0.3, p.stone)
  for (let i = 0; i < 6; i++) classicalColumn(out, tx - 8.75 + i * 3.5, tf - 2.6, 1.1, 13.6, 0.72, p.stone, { order: 'corinthian', tier: 'near', tag: FIXED, trim: p.trim })
  for (let i = 0; i < 3; i++) block(out, tx - 11 + i * 0.4, tx + 11 - i * 0.4, tf - 4.6 + i * 0.5, tf - 0.3, 0, 0.36 * (i + 1), shade(p.stone, 0.86))
  block(out, tx - 10.5, tx + 10.5, tf - 3.6, tf - 0.3, 13.6, 15.2, p.trim)
  block(out, tx - 10.5, tx + 10.5, tf - 3.6, tf - 0.3, 13.55, 13.6, shade(p.stone, 0.66))
  pedimentOn(out, '-z', tf - 3.6, tx - 10.9, tx + 10.9, 15.2, 3.3, 3.3, p.stone)
  rectOn(out, '-z', tf - 0.3, tx - 8, tx + 8, 1.1, 13.5, shade(p.stone, 0.76), 0.02)
  archOn(out, '-z', tf - 0.3, tx, 1.1, 3.6, 7, p.dark, 0.05)
  dome(out, tx, tf + 13, E, 9.5, 5.2, shade(p.lead, 1.2), 14)
}
