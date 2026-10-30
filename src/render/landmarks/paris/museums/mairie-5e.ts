import type { MeshBuilder } from '../../../buildings.ts'
import { MeshBuilder as Mesh } from '../../../buildings.ts'
import { block, classicalColumn, placed, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, extrude, fitted, palette, pedimentOn, pts, rectOn, slabOn } from '../palaces/common.ts'
import { rustic } from './civic.ts'

const FIXED = 0
/** the design footprint: OSM relation 660657's box (local −z faces bearing 111.5, the Place du Panthéon's south arm) */
const HX = 40.7
const HZ = 26.9

/** OSM's outline and court in this frame (osmium, 2026-10-30), the diagonal to the Panthéon's axis drawn as one chord */
const OUTER = pts([-24.8, 26.9, -40.7, -24.7, -39.0, -26.9, 10.3, -24.3, 10.0, -18.6, 40.6, 9.5, 40.2, 22.5, 27.7, 22.2, 15.3, 26.9, 10.9, 15.4])
const COURT = pts([-11.6, 13.2, 4.5, 6.2, 5.0, -7.6, -19.4, -8.8, -19.4, -4.4, -14.4, 11.7])

/**
 * La Mairie du 5e (Jean-Baptiste Guénepin, 1844–50), built a hundred years after and to the same elevation as Soufflot's
 * École de Droit across the Rue Soufflot, so the two are a pair framing the road down from the Panthéon's portico. What a
 * rider sees, standing on the Place:
 *
 * - from the PANTHÉON (the outline's diagonal, between local −z and +x): the frontispiece, four tall Ionic columns on a
 *   rusticated arched base, a pediment over them with the city's arms, and the front curving away either side;
 * - along the Place to the south (local −z) and the Rue Soufflot to the north (local +x): the same three-storey dress,
 *   the rusticated ground floor, the plain tall first-floor windows, a low attic, a slate roof.
 *
 * Plan from OSM's relation 660657; its front's curve is drawn as a straight chord. Its heights and dressing are from memory
 * of the twin fronts, and no photograph was checked.
 */
export function mairie5e(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d8ccb2', '#4d5459')
  const E = 17
  extrude(out, [OUTER, COURT], p, { eaves: E, bay: 4, win: 1.6, rise: 3.2, inset: 1.5, dormers: true,
    storeys: [{ y: 0, h: 3, sill: 1 }, { y: 6.2, h: 3.8, sill: 0.8 }, { y: 11.8, h: 2.4, sill: 0.6 }] })
  rustic(out, OUTER, 0.2, 6, 0.65, p.deep, 5)

  // ---- the frontispiece, on the middle of the diagonal, facing the Panthéon's axis
  const q = new Mesh()
  const hw = 9.4
  block(q, -hw, hw, -1.6, 1, 0, E + 1.6, p.stone)
  for (let y = 0.8; y < 7; y += 0.65) rectOn(q, '-z', -1.6, -hw, hw, y - 0.04, y + 0.04, p.deep, 0.03)
  for (let i = 0; i < 4; i++) block(q, -8.5 + i * 0.3, 8.5 - i * 0.3, -3.8 + i * 0.5, -1.6, 0, 0.26 * (i + 1), shade(p.stone, 0.88 + (i % 2) * 0.05))
  for (const x of [-5.2, 0, 5.2]) archOn(q, '-z', -1.6, x, 0.9, 3, 5.4, x === 0 ? p.dark : p.glass, 0.06)
  slabOn(q, '-z', -1.6, -hw - 0.1, hw + 0.1, 7, 7.5, 0.3, p.trim)
  rectOn(q, '-z', -1.6, -7, 7, 7.5, E - 1.5, shade(p.stone, 0.76), 0.02)
  for (const x of [-5.2, 0, 5.2]) {
    rectOn(q, '-z', -1.6, x - 1.2, x + 1.2, 8.9, 13.4, p.trim, 0.04)
    archOn(q, '-z', -1.6, x, 9.1, 1.9, 4.2, p.glass, 0.07)
  }
  for (const x of [-7.8, -2.6, 2.6, 7.8]) classicalColumn(q, x, -3.1, 7.5, E - 1.7, 0.56, p.stone, { order: 'ionic', tier: 'near', tag: FIXED, trim: p.trim })
  block(q, -hw, hw, -3.9, -1.6, 7.4, 7.5, p.trim)
  block(q, -hw, hw, -3.9, -1.6, E - 1.7, E - 0.2, p.trim)
  block(q, -hw - 0.3, hw + 0.3, -4.2, -1.6, E - 0.2, E + 0.2, shade(p.trim, 1.03))
  pedimentOn(q, '-z', -4.2, -hw - 0.4, hw + 0.4, E + 0.2, 3, 3, p.stone)
  block(q, -1, 1, -3.9, -3.7, E + 0.5, E + 1.8, shade(p.trim, 0.8))
  placed(out, q, -0.742, 25.3, -4.55)
}
