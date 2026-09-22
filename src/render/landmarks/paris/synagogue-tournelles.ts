import type { MeshBuilder } from '../../buildings.ts'
import { disc, prism } from '../../models.ts'
import { archedPane, beam, block, hex, pediment, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/**
 * The synagogue of the rue des Tournelles (Marcellin Varcollier, 1876; iron frame from Eiffel's workshops).
 * A symmetrical Romano-Byzantine front of pale stone: a tall central bay under a gable, a great rose window
 * in a round arch over the triple doorway, lower side bays with arched windows, the Tablets of the Law on
 * the gable's peak, and the long hall behind under a pitched roof.
 */
export function synagogueTournelles(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#ddd3bf')
  const trim = shade(stone, 1.06)
  const dark = hex('#2c2b2a')
  const slate = hex('#56606a')
  const hx = Math.min(fit.hx, 12)
  const hz = Math.max(8, fit.hz)
  const cw = hx * 0.42                     // half-width of the central bay
  // the hall behind, and its pitched roof
  block(out, -hx * 0.9, hx * 0.9, -hz + 2, hz, 0, 17, stone)
  roof(out, -hx * 0.9, hx * 0.9, -hz + 2, hz, 17, 6, hx * 0.9, 0, slate)
  // the side bays of the front
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -hx : cw
    const x1 = s < 0 ? -cw : hx
    block(out, x0, x1, -hz, -hz + 2.5, 0, 14, stone)
    block(out, x0 - 0.2, x1 + 0.2, -hz - 0.25, -hz + 2.6, 13.4, 14.2, trim)
    const xm = (x0 + x1) / 2
    archedPane(out, -hz, xm, 1.5, 1.8, 4.2, dark)
    archedPane(out, -hz, xm, 8, 1.6, 3.8, dark)
  }
  // the central bay: taller, under a gable, with the rose window in its round arch
  block(out, -cw, cw, -hz - 0.6, -hz + 2.5, 0, 21, stone)
  pediment(out, -cw - 0.4, cw + 0.4, -hz - 0.6, 21, 4.2, 3, trim)
  block(out, -cw - 0.4, cw + 0.4, -hz - 0.9, -hz + 2.5, 20.4, 21.2, trim)
  // pilasters either side of the central bay
  for (const s of [-1, 1]) block(out, s * cw - 0.5, s * cw + 0.5, -hz - 1, -hz - 0.5, 0, 21, trim)
  // the great arch and the rose inside it: a disc of glass in a ring of stone, with its tracery spokes
  archedPane(out, -hz - 0.6, 0, 9.5, cw * 1.5, 10, shade(stone, 0.92))
  disc(out, 0, 14.6, -hz - 0.68, cw * 0.62, dark, FIXED, 24)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    beam(out, [0, 14.6, -hz - 0.72], [Math.cos(a) * cw * 0.6, 14.6 + Math.sin(a) * cw * 0.6, -hz - 0.72], 0.08, trim)
  }
  // the triple doorway under it
  for (const x of [-cw * 0.55, 0, cw * 0.55]) archedPane(out, -hz - 0.62, x, 0, x === 0 ? 2.2 : 1.6, x === 0 ? 5.2 : 4.4, dark)
  // the Tablets of the Law on the gable's peak: two round-topped slabs
  for (const s of [-1, 1]) {
    block(out, s * 0.55 - 0.45, s * 0.55 + 0.45, -hz - 0.3, -hz + 0.1, 25.2, 26.6, trim)
    prism(out, s * 0.55, -hz - 0.1, 26.6, 27, 0.45, 10, trim, FIXED, 0.3)
  }
}
