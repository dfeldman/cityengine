import type { MeshBuilder } from '../../../buildings.ts'
import { box } from '../../../models.ts'
import { block, classicalColumn, roof } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, fitted, palette, pedimentOn, range, rectOn, statue } from './common.ts'

const FIXED = 0
const HX = 27
const HZ = 7

/**
 * The Palais Bourbon's entrance on the Place du Palais-Bourbon (the palace of 1722–28 for the Duchesse de Bourbon, its
 * court front remade in the 1760s and under the Empire): the Corinthian COLONNADE screening the cour d'honneur from
 * the place, on its stylobate, under an entablature and a balustrade, between the two square PAVILIONS that close it,
 * with their low pyramid roofs. The Seine front's portico is `assembleePortico` (paris.json); the rest of the palace is
 * OSM's own massing in the classical dress (palaces.json, "Palais Bourbon").
 *
 * OSM: the pavilions are building:parts 1459866038 / 1459866039 (19.4 m), the colonnade 1459866062 (its entablature,
 * 10.3–12.2 m) over the steps 1459919806 / 1459919807. Local −z faces the place (south, bearing 188.5).
 */
export function bourbonGate(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e3dac6', '#4d5459')
  // ---- the pavilions: two storeys of tall windows in arched recesses, the cornice, a balustrade, the low pyramid
  for (const [x0, x1] of [[-27, -12.7], [11.6, 27]]) {
    range(out, x0, x1, -7, 7, p, {
      eaves: 15.9, bay: 4.6, win: 1.8, quoins: true, pediments: true,
      storeys: [{ y: 0, h: 4.6, arched: true, sill: 0.8 }, { y: 7.4, h: 4.4 }],
    })
    roof(out, x0 + 0.6, x1 - 0.6, -6.4, 6.4, 15.9, 3.5, (x1 - x0) / 2 - 0.6, 6.4, p.slate)
    balustrade(out, x0, x1, -7, 7, 15.9, p, { sides: ['-z', '+z'], h: 0.9 })
  }
  // ---- the colonnade between them: the stylobate and its steps, the paired Corinthian columns, the entablature
  const xa = -12.7
  const xb = 11.6
  for (let i = 0; i < 4; i++) block(out, xa, xb, -6.6 + i * 0.45, 3.5, i * 0.5, (i + 1) * 0.5, p.trim)
  const cols = 8
  for (let i = 0; i < cols; i++) {
    const x = xa + 1.4 + ((xb - xa - 2.8) * i) / (cols - 1)
    for (const z of [-3.1, 2.6]) {
      classicalColumn(out, x, z, 2.0, 10.3, 0.42, p.stone, { order: 'corinthian', tier: z < 0 ? 'near' : 'mid', tag: FIXED, flutes: z < 0, trim: p.trim })
    }
  }
  block(out, xa, xb, -3.8, 3.3, 10.3, 11.0, p.trim)                                              // architrave
  block(out, xa, xb, -3.9, 3.4, 11.0, 11.6, p.stone)                                             // frieze
  block(out, xa - 0.2, xb + 0.2, -4.3, 3.6, 11.6, 12.2, p.trim)                                  // cornice
  balustrade(out, xa, xb, -4.3, 3.6, 12.2, p, { sides: ['-z'], h: 1.0 })
  // the court seen through it: the shadowed gate and the far side of the colonnade
  rectOn(out, '-z', 3.5, xa, xb, 2.0, 10.3, [0.3, 0.3, 0.29], 0)
  archOn(out, '-z', 3.45, (xa + xb) / 2, 2.0, 4.0, 7.4, [0.16, 0.16, 0.17], 0.02)
  // a trophy group over the middle, and statues on the pavilions' fronts
  pedimentOn(out, '-z', -4.3, (xa + xb) / 2 - 3.5, (xa + xb) / 2 + 3.5, 12.2, 1.6, 0.4, p.trim)
  box(out, (xa + xb) / 2, 14.0, -3.9, 0.9, 0.5, 0.3, p.trim, FIXED)
  for (const x of [-20, 19.3]) statue(out, x, -7.6, 0, 3.2, p.trim)
}
