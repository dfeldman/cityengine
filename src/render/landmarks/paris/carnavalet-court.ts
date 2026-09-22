import { MeshBuilder } from '../../buildings.ts'
import { prism } from '../../models.ts'
import { archedPane, beam, block, courtFacade, hex, pane, pediment, placed, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

/**
 * The Musée Carnavalet's court (Hôtel Carnavalet, 1548 and Mansart 1660): the street wing on the Rue de
 * Sévigné with its portal — a round arch between two reclining lions under a relief of Abundance — and
 * behind it the cour d'honneur: Coysevox's bronze Louis XIV standing in the middle, Jean Goujon's Four
 * Seasons in relief on the corps de logis at the head of the court. Standalone at the court; local −z is the
 * street end (Rue de Sévigné).
 */
export function carnavaletCourt(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#cfc2a8')
  const trim = hex('#dacdb3')
  const dark = hex('#2d2c2a')
  const bronze = hex('#3d4a40')
  const slate = hex('#6a7076')
  const { hx, hz } = fit
  const g = 0.5
  block(out, -hx, hx, -hz, hz, 0, 0.56, hex('#cfc6b3'))
  // the corps de logis at the head of the court: its own building, OSM has none here
  block(out, -hx - 2, hx + 2, hz, hz + 10, 0, 12, stone)
  roof(out, -hx - 2.3, hx + 2.3, hz - 0.3, hz + 10.3, 12, 6.5, 2.4, 5.3, slate)
  const q = new MeshBuilder()
  courtFacade(q, 2 * hx + 4, 12, { stone, trim, dark, reliefs: true, lucarnes: true })
  placed(out, q, 0, 0, hz)
  // the Four Seasons: four large pale relief panels between the first-floor windows, the Goujon figures
  for (let k = 0; k < 4; k++) {
    const x = -hx * 0.75 + k * hx * 0.5
    pane(out, '-z', hz - 0.36, x, g + 6.8, 0.9, 2.9, hex('#e6dbc6'), 0.03)
    pane(out, '-z', hz - 0.38, x, g + 7.4, 0.42, 1.8, hex('#c9bfae'), 0.03)
  }
  // Louis XIV: a bronze standing figure on a tall stone plinth, a low railing round it
  block(out, -1.4, 1.4, -1.4, 1.4, g, g + 2.8, trim)
  block(out, -1.6, 1.6, -1.6, 1.6, g + 2.8, g + 3.1, stone)
  prism(out, 0, 0, g + 3.1, g + 4.9, 0.45, 8, bronze, 0, 0.5)                      // the robe, larger than life
  prism(out, 0, 0, g + 4.9, g + 5.9, 0.42, 8, bronze, 0, 0.32)
  prism(out, 0, 0, g + 5.9, g + 6.4, 0.24, 8, bronze)                              // the head and wig
  beam(out, [0.3, g + 5.5, 0], [1.05, g + 4.8, -0.35], 0.09, bronze)              // the arm with the baton
  for (let a = 0; a < 16; a++) {
    const t = (a / 16) * Math.PI * 2
    prism(out, Math.sin(t) * 2.6, Math.cos(t) * 2.6, g, g + 0.9, 0.04, 4, dark)
  }
  // the portal on the street face of the entrance wing, 9 m beyond the court's end
  const zs = -hz - 9
  block(out, -4.5, 4.5, zs, zs + 1.2, 0, 9, stone)
  for (let y = g + 0.6; y < 6; y += 0.7) block(out, -4.6, 4.6, zs - 0.05, zs + 0.1, y, y + 0.08, shade(stone, 0.86))
  archedPane(out, zs - 0.06, 0, g, 3.4, 5.4, dark)
  pane(out, '-z', zs - 0.1, 0, 6.3, 3.2, 1.5, hex('#f4eee0'), 0.03)                // Abundance
  pane(out, '-z', zs - 0.12, 0, 6.5, 1.2, 1.0, hex('#cfc4b1'), 0.03)
  pediment(out, -4.8, 4.8, zs - 0.3, 9, 1.8, 1.5, trim)
  // the lions, reclining on their plinths either side of the arch
  for (const s of [-1, 1]) {
    const x = s * 3.2
    block(out, x - 0.7, x + 0.7, zs - 1.6, zs - 0.1, 0, 1.4, trim)
    block(out, x - 0.55, x + 0.55, zs - 1.5, zs - 0.3, 1.4, 1.95, hex('#d9cdb4'))
    block(out, x - 0.3, x + 0.3, zs - 1.75, zs - 1.2, 1.7, 2.35, hex('#d9cdb4'))
  }
}
