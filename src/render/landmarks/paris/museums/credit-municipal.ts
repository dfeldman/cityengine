import type { MeshBuilder } from '../../../buildings.ts'
import { block, shade } from '../../kit.ts'
import { sign } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archOn, extrude, fitted, palette, pedimentOn, pts, rectOn, slabOn } from '../palaces/common.ts'
import { bands, rustic, stack } from './civic.ts'

/** the design footprint: OSM relation 570126's box (local −z faces bearing 226, the Rue des Blancs-Manteaux) */
const HX = 48
const HZ = 38.2

/** OSM's outline and courts in this frame (osmium, 2026-10-30), the parts' metre jogs ironed flat */
const OUTER = pts([-40.8, -38.2, -33.6, -35.5, -3.5, -28.6, 42, -22.6, 43.5, -16.2, 40.2, 14.2, 38.4, 25.3, 47.4, 24.4, 48, 35.6, -39.9, 38.2, -39, 26.1, -11.7, 25.5, -10.7, 17.7, -35.3, 13.8, -37.8, 23.2,
  -48, 21.3, -46, 21.2, -38.3, -12.6, -47.9, -15.1])
const COURTS = [
  pts([-25.2, -22.2, -29.2, -3.7, -10.4, -0.8, -7.9, -18.5]),
  pts([3.7, -17, 2, -4, 19.9, -0.2, 23.5, -14.6]),
  pts([0, 9.5, -1.7, 22.5, 16.9, 26.7, 20, 11.6]),
]
/** where the portal stands on the wall (−3.5, −28.6) → (42, −22.6) */
const DOOR_X = 8
const DOOR_Z = -27.1

/**
 * Le Crédit Municipal de Paris, the old Mont-de-Piété, the city's pawnshop, founded by Louis XVI in the Hôtel de Nouvion in
 * 1777 and spread from the Rue des Francs-Bourgeois through the block to the Rue des Blancs-Manteaux. In these narrow Marais
 * streets a rider gets it from close and low:
 *
 * - on the RUE DES BLANCS-MANTEAUX (local −z): a tall plain front in banded and then plain stone, a mansard over, and in it the
 *   portal: a great arch two storeys high under a pediment on a swag and scrolls, MONT DE PIÉTÉ on a dark board over its green
 *   doors, LIBERTÉ ÉGALITÉ FRATERNITÉ either side;
 * - the rest of the block's walls in the same plain dress, four storeys and a slate roof with its dormers.
 *
 * Plan from OSM's relation 570126. Portal and walls from the Commons photographs "Mont de Piété de Paris.JPG" and "Immeuble du
 * Crédit municipal de Paris 2013-09-22". I put the portal on the wall by the "16" of the street number's plate without a survey:
 * its place along the wall is an estimate.
 */
export function creditMunicipal(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
  sign(out, { type: 'flat', text: 'MONT DE PIÉTÉ', h: 0.34, face: 'roman', colour: [0.86, 0.84, 0.76], tracking: 0.14, lit: 'none', w: 3.2 },
    { x: DOOR_X * fit.hx / HX, y: 5.1, z: (DOOR_Z - 0.95) * fit.hz / HZ, heading: Math.PI })
}

function draw(out: MeshBuilder): void {
  const p = palette('#d3c7ad', '#4f565b')
  const E = 18
  extrude(out, [OUTER, ...COURTS], p, { eaves: E, bay: 3.6, win: 1.5, rise: 4, inset: 2, dormers: true,
    storeys: [{ y: 0, h: 2.8, sill: 1.2 }, { y: 5, h: 3, sill: 0.8 }, { y: 9.4, h: 2.8, sill: 0.8 }, { y: 13.6, h: 2.4, sill: 0.7 }] })
  rustic(out, OUTER, 0.2, 4.8, 0.55, p.deep, 5)
  bands(out, OUTER, [4.8], 0.28, 0.14, p.trim, 5)
  bands(out, OUTER, [9.2], 0.18, 0.1, p.trim, 5)

  // ---- the portal, square to −z where the wall is near enough to it, a little proud of the wall
  const f = DOOR_Z - 0.8
  const m = DOOR_X
  const w = 5.2
  block(out, m - w, m + w, f, DOOR_Z + 1.6, 0, 13.8, p.stone)
  for (let y = 0.6; y < 9.4; y += 0.55) rectOn(out, '-z', f, m - w, m + w, y - 0.04, y + 0.04, p.deep, 0.03)
  // the great arch, its leaves, the board and the name, the window in its head
  rectOn(out, '-z', f, m - 3.6, m + 3.6, 0.2, 9.1, shade(p.stone, 1.03), 0.04)
  archOn(out, '-z', f, m, 0, 5.4, 8.9, shade(p.stone, 0.78), 0.06)
  rectOn(out, '-z', f, m - 2.7, m + 2.7, 0, 4.5, [0.13, 0.26, 0.19], 0.09)
  rectOn(out, '-z', f, m - 0.05, m + 0.05, 0, 4.5, [0.07, 0.15, 0.11], 0.11)
  rectOn(out, '-z', f, m - 2.5, m + 2.5, 4.75, 5.45, [0.2, 0.21, 0.22], 0.09)
  rectOn(out, '-z', f, m - 1.05, m + 1.05, 6.2, 8.5, p.glass, 0.08)
  // the swag and two scrolls over the arch, and the pediment
  slabOn(out, '-z', f, m - w - 0.2, m + w + 0.2, 9.3, 9.6, 0.2, p.trim)
  for (const s of [-1, 1]) block(out, m + s * 3.3 - 0.45, m + s * 3.3 + 0.45, f - 0.3, f, 9.6, 11.2, p.trim)
  for (let i = 0; i < 7; i++) {
    const t = i / 6
    const y = 10.9 - 0.8 * (1 - (2 * t - 1) * (2 * t - 1))
    block(out, m - 2.9 + 5.8 * t - 0.42, m - 2.9 + 5.8 * t + 0.42, f - 0.22, f, y - 0.16, y + 0.16, shade(p.trim, 1.02))
  }
  slabOn(out, '-z', f, m - w - 0.3, m + w + 0.3, 11.3, 11.75, 0.45, p.trim)
  pedimentOn(out, '-z', f - 0.2, m - w - 0.3, m + w + 0.3, 11.75, 2, 0.5, p.trim)
  rectOn(out, '-z', f - 0.2, m - 3.6, m + 3.6, 11.8, 12.1, shade(p.stone, 0.92), 0.07)

  for (const [x, z] of [[-30, 32], [20, 32], [-20, -29], [28, -18], [-42, 2]] as const) stack(out, x, z, E + 2, E + 6, 0.7, 1.4, shade(p.stone, 0.9), p.lead)
}
