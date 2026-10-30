import type { MeshBuilder } from '../../../buildings.ts'
import { block, classicalColumn, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, dormers, extrude, fitted, hipRoof, palette, pedimentOn, pts, range, rectOn, slabOn } from '../palaces/common.ts'

const FIXED = 0
/** the design footprint: OSM relation 572442 and ways 55353483, 55353488 in one box (local −z faces bearing 19.5, the Rue des Écoles and the Place Marcelin-Berthelot) */
const HX = 60.2
const HZ = 35.25

/** OSM's three blocks in this frame (osmium, 2026-10-30), the jogs ironed flat */
const CHALGRIN = pts([60.0, 6.4, -14.3, 8.8, -15.7, -33.1, -6.0, -33.5, -5.2, -2.2, 16.9, -3.0, 15.9, -34.4, 59.8, -35.2, 59.9, -21.3, 43.6, -21.0, 44.1, -9.4, 59.9, -9.9])
const CHALGRIN_COURT = pts([39.4, -4.2, 38.6, -25.9, 25.6, -25.6, 26.6, -3.8])
const EAST_WING = pts([-12.1, 31.9, -13.8, 33.8, -58.0, 32.9, -60.2, 31.6, -60.0, 23.1, -58.0, 20.8, -43.2, 21.0, -43.0, 6.0, -59.7, 6.5, -59.4, -4.7, -38.0, -31.8, -25.4, -32.2, -24.5, 2.7, -26.1, 5.2,
  -30.0, 5.6, -29.5, 21.1, -13.8, 21.5, -12.0, 23.4])
const BACK_WING = pts([60.2, 35.2, -1.1, 34.1, -1.4, 18.5, 60.1, 16.4])

/**
 * Le Collège de France on the Place Marcelin-Berthelot, across the Rue Saint-Jacques from the Sorbonne: Jean-François
 * Chalgrin's building (1774–80) round its cour d'honneur open to the Rue des Écoles, and the later wings of Letarouilly
 * (1831–42) and Guilbert (1930s) beside and behind it. Modest, set back, and the only open forecourt on this street:
 *
 * - from the RUE DES ÉCOLES (local −z): the U of the court, its two wings' stone ends and low arcaded walls coming forward,
 *   and at the back of the court Chalgrin's centre, a pedimented portico of Doric columns; Champollion on his plinth;
 * - beside it, the later ranges, one each side of the block;
 * - over them, plain slate roofs.
 *
 * Plan from OSM. Chalgrin's U is taken to be relation 572442 and the other two ways the later wings, which is my reading
 * and not a tag; heights are not in OSM, and 14 m to the cornice and the portico's six columns are from memory, with no
 * photograph checked.
 */
export function collegeDeFrance(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d8ccb2', '#4d5459')
  const E = 13.5
  const st = [{ y: 0, h: 2.7, sill: 1.1 }, { y: 5, h: 3, sill: 0.9 }, { y: 9.6, h: 2, sill: 0.8 }]
  extrude(out, [EAST_WING], p, { eaves: E + 2, bay: 3.8, win: 1.5, rise: 3.2, inset: 1.5, storeys: [...st, { y: 12.6, h: 1.4, sill: 0.4 }] })
  extrude(out, [BACK_WING], p, { eaves: E + 4, bay: 3.8, win: 1.5, rise: 3.4, inset: 1.5, storeys: [...st, { y: 13.2, h: 2, sill: 0.8 }] })
  extrude(out, [CHALGRIN, CHALGRIN_COURT], p, { eaves: E, bay: 3.8, win: 1.5, rise: 3, inset: 1.4, storeys: st })

  // ---- the front of the open court (x −6…+16, z −33…−3): Chalgrin's portico at its back, on the Rue des Écoles' axis
  const cx = 5.5
  const back = -2.6
  for (let i = 0; i < 3; i++) block(out, cx - 9 + i * 0.3, cx + 9 - i * 0.3, back - 4.9 + i * 0.5, back, 0, 0.3 * (i + 1), shade(p.stone, 0.88 + (i % 2) * 0.05))
  rectOn(out, '-z', back, cx - 8, cx + 8, 1, E - 2, shade(p.stone, 0.76), 0.03)
  for (const x of [-6, 0, 6]) archOn(out, '-z', back, cx + x, 1, 2.6, 5, p.dark, 0.06)
  for (const x of [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5]) classicalColumn(out, cx + x, back - 3.6, 0.9, E - 2.2, 0.48, p.stone, { order: 'doric', tier: 'mid', tag: FIXED, trim: p.trim })
  block(out, cx - 9, cx + 9, back - 4.3, back, E - 2.2, E - 0.8, p.trim)
  block(out, cx - 9.2, cx + 9.2, back - 4.5, back, E - 0.8, E - 0.45, shade(p.trim, 1.03))
  block(out, cx - 9, cx + 9, back - 4.3, back, E - 2.25, E - 2.2, shade(p.stone, 0.7))
  pedimentOn(out, '-z', back - 4.5, cx - 9.4, cx + 9.4, E - 0.45, 2.8, 0.1, p.stone)
  hipRoof(out, cx - 8.8, cx + 8.8, back - 4.4, back + 0.5, E - 0.45, 2.7, p.slate, 0)

  // ---- the wings' ends on the street: stone, a tall arched blind bay, the low wall and railing across the mouth of the court
  for (const [a, b] of [[-15.7, -6], [15.9, 30]] as const) {
    const pl = -34.5
    block(out, a, b, pl, pl + 2, 0, E + 0.6, p.stone)
    for (let y = 0.7; y < 4.6; y += 0.6) rectOn(out, '-z', pl, a, b, y - 0.04, y + 0.04, p.deep, 0.03)
    const m = (a + b) / 2
    archOn(out, '-z', pl, m, 1.2, 2.8, 3.6, p.glass, 0.07)
    rectOn(out, '-z', pl, m - 1.6, m + 1.6, 6, 10, p.trim, 0.05)
    rectOn(out, '-z', pl, m - 1.25, m + 1.25, 6.2, 9.8, p.glass, 0.08)
    slabOn(out, '-z', pl, a - 0.1, b + 0.1, 4.7, 5.1, 0.2, p.trim)
    slabOn(out, '-z', pl, a - 0.4, b + 0.4, E - 0.2, E + 0.6, 0.45, p.trim)
    hipRoof(out, a, b, pl, pl + 8, E + 0.6, 2.8, p.slate, 0.1)
  }
  // the court's railing to the street
  block(out, -6, 15.9, -33.6, -33, 0, 0.9, p.stone)
  for (let x = -5.8; x < 15.8; x += 0.5) block(out, x - 0.03, x + 0.03, -33.34, -33.28, 0.9, 2.6, p.dark)
  block(out, -6, 15.9, -33.36, -33.26, 2.5, 2.6, p.dark)
  // Champollion in the court, on his plinth
  block(out, cx - 1, cx + 1, -24, -22, 0, 2.5, p.stone)
  block(out, cx - 0.42, cx + 0.42, -23.42, -22.58, 2.5, 4.5, shade(p.stone, 0.72))

  // ---- the wing to the east, x 16…60, its own plain range on the street
  range(out, 30, 59.8, -35.2, -33, p, { eaves: E, bay: 3.8, win: 1.5, faces: ['-z'], storeys: st })
  balustrade(out, 30, 59.8, -35.2, -33, E, p, { sides: ['-z'], h: 0.9 })
  dormers(out, '-z', -34.5, 30, 59.8, E + 0.1, 7.6, p, { w: 1.3, h: 1.9, set: 1.1 })
}
