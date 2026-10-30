import type { MeshBuilder } from '../../../buildings.ts'
import { strut } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { balustrade, clockOn, dormers, extrude, fitted, mansard, palette, pts, rectOn, slabOn, segmentOn } from './common.ts'
import { lettersOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM way 63201555's box turned to its street (local −z faces bearing 38.8, the Rue du Château-d'Eau) */
const HX = 25.15
const HZ = 21.65

/** Way 63201555 in the model's frame, its front drawn on its own and set in from the street here (the great hall is inside). */
const PLAN = pts([
  25.1, 3.6, 8, 21.6, 4.8, 18.6, 4.8, 17, 0.3, 17.7, -6.1, 15.6, -10, 12, -18, 20.3, -23.7, 15.3, -20.5, 11.7, -25.2, 7.5, -21.9, 3.9, -19.8, 5.9, -19.7, 3.9, -17.7, 4,
  -17.7, 1.8, -20, 1.7, -17.3, -1.2, -17.6, -4.4, -21.3, -7.6, -16.7, -12.9, -19.5, -15, 19.8, -15, 21.8, -11, 19.8, -9.7, 20.2, 2.6, 24.9, 2.5,
])

/**
 * La Bourse du Travail (Joseph Bouvard, 1892), 3 Rue du Château-d'Eau, a step from the Place de la République: the Paris
 * unions' palace, deliberately dressed like a government's. Its one front on the narrow street is what a rider sees:
 *
 * - the RUSTICATED ground floor, its three tall iron gates in the middle under their carved lintels, barred windows beside;
 * - the stone BALCONY over the gates, the flags on it;
 * - the GIANT ORDER: seven fluted pilasters rising through two tall storeys of big three-light windows to their Corinthian heads;
 * - BOURSE DU TRAVAIL cut in the frieze over them, the cornice, the balustraded attic;
 * - the CLOCK in its carved gable breaking through the slate mansard, the round-headed dormers along it.
 *
 * Plan is OSM's (way 63201555, and its part 1448693889, the octagonal great hall, which no rider sees: it is roofed over here).
 * Heights off photographs from the street (Commons), scaled on the gates: balcony 6.4 m, order to 16.8, cornice 18.6, attic 21,
 * mansard 24.6, gable 24.4. The sides and the rear are plain masses, which is how little of them shows between the neighbours.
 */
export function bourseTravail(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d9d0ba', '#4e5459')
  extrude(out, [PLAN], p, { eaves: 18.6, bay: 3.6, win: 1.4, rise: 4, inset: 1.8, dormers: false,
    storeys: [{ y: 0, h: 3, sill: 1 }, { y: 7, h: 3.2 }, { y: 12, h: 2.6 }, { y: 18, h: 0.01, sill: 0 }] })
  const z = -21.4
  const X0 = -15.2
  const X1 = 19.4
  const cx = (X0 + X1) / 2
  block(out, X0, X1, z, -15, 0, 18.6, p.stone)
  // ---- the rusticated ground floor
  for (let y = 0.55; y < 6; y += 0.55) rectOn(out, '-z', z, X0, X1, y - 0.04, y + 0.04, p.deep, 0.03)
  for (const s of [-1, 0, 1]) {
    const x = cx + s * 4.7
    rectOn(out, '-z', z, x - 1.8, x + 1.8, 0, 5.3, shade(p.deep, 0.95), 0.05)
    rectOn(out, '-z', z, x - 1.5, x + 1.5, 0, 5, p.dark, 0.07)
    for (let t = -1.25; t <= 1.3; t += 0.42) rectOn(out, '-z', z, x + t - 0.03, x + t + 0.03, 0, 5, shade(p.dark, 2.6), 0.09)
    rectOn(out, '-z', z, x - 1.5, x + 1.5, 3.2, 3.32, shade(p.dark, 2.6), 0.09)
    // the carved lintel over it
    rectOn(out, '-z', z, x - 2, x + 2, 5.3, 6.1, shade(p.stone, 1.06), 0.1)
    segmentOn(out, '-z', z, x, 5.5, 2.6, 0.5, shade(p.stone, 0.82), 0.12)
  }
  for (const x of [cx - 12.6, cx - 9.4, cx + 9.4, cx + 12.6]) {
    rectOn(out, '-z', z, x - 0.8, x + 0.8, 0.9, 4.4, p.glass, 0.06)
    for (let t = -0.6; t <= 0.65; t += 0.3) rectOn(out, '-z', z, x + t - 0.02, x + t + 0.02, 0.9, 4.4, p.dark, 0.08)
  }
  slabOn(out, '-z', z, X0 - 0.1, X1 + 0.1, 6.1, 6.5, 0.28, p.trim)
  // the balcony over the gates, the flags
  block(out, cx - 8.2, cx + 8.2, z - 1, z, 6.5, 6.75, p.trim)
  balustrade(out, cx - 8.2, cx + 8.2, z - 1, z, 6.75, p, { sides: ['-z'], h: 0.95 })
  for (const s of [-1, 1]) {
    const x = cx + s * 1.5
    strut(out, [x, 7, z - 0.6], [x, 10.4, z - 1.4], 0.05, 0.05, p.dark, FIXED, false)
    for (const [i, c] of [[0, '#23408e'], [1, '#f2f2f2'], [2, '#d0232b']] as const) {
      const y = 8.3 + (2 - i) * 0.58
      out.quad([[x - 0.45, y - 0.58, z - 1.2], [x + 0.45, y - 0.58, z - 1.2], [x + 0.45, y, z - 1.2], [x - 0.45, y, z - 1.2]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], hex(c), FIXED)
    }
  }
  // ---- the giant order and the two storeys of windows between
  const pitch = 4.7
  for (let k = -3; k <= 3; k++) {
    const x = cx + k * pitch
    block(out, x - 0.62, x + 0.62, z - 0.34, z, 6.5, 15.8, shade(p.stone, 1.03))
    for (const t of [-0.3, 0, 0.3]) rectOn(out, '-z', z - 0.34, x + t - 0.05, x + t + 0.05, 7, 15.4, p.deep, 0.015)
    block(out, x - 0.8, x + 0.8, z - 0.5, z, 15.8, 16.8, p.trim)
    block(out, x - 0.7, x + 0.7, z - 0.42, z, 6.5, 7, p.trim)
  }
  for (let k = 0; k < 6; k++) {
    const x = cx + (k - 2.5) * pitch
    rectOn(out, '-z', z, x - 1.42, x + 1.42, 7.4, 11.3, p.trim, 0.04)
    rectOn(out, '-z', z, x - 1.22, x + 1.22, 7.55, 11.15, p.glass, 0.06)
    for (const t of [-0.4, 0.4]) rectOn(out, '-z', z, x + t - 0.04, x + t + 0.04, 7.55, 11.15, shade(p.stone, 1.1), 0.08)
    rectOn(out, '-z', z, x - 1.22, x + 1.22, 10.2, 10.27, shade(p.stone, 1.1), 0.08)
    // the plaque with its names between the storeys
    rectOn(out, '-z', z, x - 1.5, x + 1.5, 11.5, 12.2, shade(p.stone, 0.9), 0.04)
    rectOn(out, '-z', z, x - 1.05, x + 1.05, 12.5, 15.3, p.trim, 0.04)
    rectOn(out, '-z', z, x - 0.88, x + 0.88, 12.65, 15.15, p.glass, 0.06)
    rectOn(out, '-z', z, x - 0.04, x + 0.04, 12.65, 15.15, shade(p.stone, 1.1), 0.08)
    rectOn(out, '-z', z, x - 0.88, x + 0.88, 14.3, 14.36, shade(p.stone, 1.1), 0.08)
  }
  // the end bays beyond the order, a smaller window each
  for (const x of [X0 + 1.7, X1 - 1.7]) {
    for (const [y, h] of [[8, 2.8], [12.6, 2.3]] as const) {
      rectOn(out, '-z', z, x - 0.72, x + 0.72, y, y + h, p.glass, 0.06)
    }
  }
  // ---- the frieze, its name, the cornice, the attic and its balustrade
  rectOn(out, '-z', z, X0, X1, 16.8, 18, p.trim, 0.02)
  lettersOn(out, '-z', z, cx, 17.08, 'BOURSE DU TRAVAIL', { h: 0.62, c: shade(p.stone, 0.56), wide: 0.72, th: 0.09, gap: 0.2, d: 0.04 })
  block(out, X0 - 0.3, X1 + 0.3, z - 0.55, -15, 18, 18.6, shade(p.stone, 1.05))
  block(out, X0 + 0.2, X1 - 0.2, z + 0.1, -15, 18.6, 20.7, p.stone)
  for (let k = -3; k <= 3; k++) {
    const x = cx + (k < 0 ? k + 0.5 : k > 0 ? k - 0.5 : 0) * pitch
    if (k === 0) continue
    rectOn(out, '-z', z + 0.1, x - 0.62, x + 0.62, 19, 20.4, p.glass, 0.05)
    rectOn(out, '-z', z + 0.1, x - 0.78, x + 0.78, 18.85, 20.55, p.trim, 0.03)
  }
  block(out, X0 + 0.1, X1 - 0.1, z, -15, 20.7, 21, p.trim)
  mansard(out, X0 + 0.2, X1 - 0.2, z + 0.1, -15, 21, 2.6, 1, p.slate, 1.3)
  dormers(out, '-z', z + 0.1, X0 + 1, cx - 3.2, 21.2, 3.2, p, { round: true, w: 1.2, h: 1.7, set: 0.5 })
  dormers(out, '-z', z + 0.1, cx + 3.2, X1 - 1, 21.2, 3.2, p, { round: true, w: 1.2, h: 1.7, set: 0.5 })
  // ---- the clock gable in the middle of the attic
  const gz = z - 0.05
  block(out, cx - 3, cx + 3, gz, gz + 1.6, 18.6, 22.8, shade(p.stone, 1.03))
  segmentOn(out, '-z', gz, cx, 22.8, 6.4, 1.5, shade(p.stone, 1.03), 0.02)
  clockOn(out, '-z', gz, cx, 20.9, 1.0, p)
  for (const s of [-1, 1]) rectOn(out, '-z', gz, cx + s * 2.3 - 0.3, cx + s * 2.3 + 0.3, 19, 22.3, p.deep, 0.02)
  block(out, cx - 3.2, cx + 3.2, gz - 0.2, gz + 1.6, 22.7, 22.95, p.trim)
}
