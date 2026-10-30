import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { block, classicalColumn, hex, roof } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, pedimentOn } from '../palaces/common.ts'
import { domeOf, FIXED, graded, quarter } from './common.ts'
import { pal } from './churches.ts'

/*
 * THE CHAPELLE EXPIATOIRE (Percier and Fontaine, 1815–26), raised by Louis XVIII over the cemetery where Louis XVI
 * and Marie-Antoinette had lain, in the Square Louis-XVI off the Boulevard Haussmann: a small DOMED chapel at the head
 * of its walled garden — the Doric portico of four columns and its pediment on a flight of steps, the vestibule
 * block behind, the green copper DOME with its glazed lantern and the three half-domed apses round it (a trefoil),
 * and down both sides of the garden the CENOTAPH GALLERIES: an arcade of gabled tombs for the Swiss Guards and the
 * dead of the Revolution, the porter's pavilion at the far end on the Rue Pasquier.
 *
 * In the city the precinct (OSM relation 1068013) came out as a 20 m block with a hole and the chapel (way 67557301)
 * as a 20 m box (2026-10-29); the model replaces both. Frame: the precinct's box with −z the far end and the chapel's
 * portico facing −z toward the garden (bearing 84.6); the chapel at (−0.25, +17.05).
 */
const HX = 18.55
const HZ = 31.85

export function chapelleExpiatoire(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => expiatoire(q))
}

function expiatoire(out: MeshBuilder): void {
  const p = pal('#ddd4c1', '#59636a')
  const green: Rgb = hex('#7fae98')
  const cx = -0.25
  const cz = 17.05
  // THE GALLERIES down both sides of the garden: a solid back wall, the arcade of tombs each under its gable
  for (const s of [-1, 1]) {
    const xo = s * 17.9
    const xi = s * 13.6
    block(out, Math.min(xo, xi), Math.max(xo, xi), -29.5, 9.0, 0, 4.2, p.stone)
    for (let z = -28.0; z < 8.5; z += 3.1) {
      archOn(out, s < 0 ? '+x' : '-x', xi, z + 1.55, 0.8, 2.0, 2.8, p.dark)
      // the gable over the bay, square to the gallery
      const P = (u: number, y: number): [number, number, number] => [xi - s * 0.04, y, z + 1.55 + u]
      out.quad([P(-1.5, 4.2), P(1.5, 4.2), P(0, 5.7), P(0, 5.7)], [-s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.trim, FIXED)
      roof(out, Math.min(xo, xi) - 0.1, Math.max(xo, xi) + 0.1, z + 0.05, z + 3.05, 4.2, 1.5, 0.01, 1.5, p.stone)
      box(out, xi - s * 0.25, 5.9, z + 1.55, 0.3, 0.25, 0.3, p.trim, FIXED)
    }
  }
  // the porter's pavilion at the far end, its door and pediment toward the street; the low walls either side
  block(out, -6.5, 6.5, -31.85, -24.5, 0, 8.5, p.stone)
  roof(out, -6.8, 6.8, -32.1, -24.3, 8.5, 2.2, 3.2, 3.2, p.slate)
  archOn(out, '-z', -31.85, 0, 0.3, 2.6, 4.6, p.dark)
  pedimentOn(out, '-z', -31.85, -3.0, 3.0, 5.6, 1.4, 0.3, p.trim)
  archOn(out, '+z', -24.5, 0, 0.3, 2.6, 4.6, p.dark)
  for (const s of [-1, 1]) block(out, s < 0 ? -17.9 : 6.5, s < 0 ? -6.5 : 17.9, -31.6, -29.5, 0, 4.2, p.stone)

  // THE CHAPEL: its terrace and steps toward the garden
  block(out, cx - 9.4, cx + 9.4, cz - 13.5, cz + 12.4, 0, 1.6, p.deep)
  for (let k = 0; k < 6; k++) block(out, cx - 4.6, cx + 4.6, cz - 17.0 + k * 0.6, cz - 13.4, 0, 0.27 * (k + 1), p.trim)
  const y0 = 1.6
  // the vestibule: a plain block with its entablature, the door, the portico of four Doric columns and the pediment
  block(out, cx - 5.3, cx + 5.3, cz - 12.0, cz - 0.6, y0, 12.0, p.stone)
  block(out, cx - 5.5, cx + 5.5, cz - 12.2, cz - 0.4, 11.4, 12.6, p.trim)
  archOn(out, '-z', cz - 12.0, cx, y0, 1.8, 3.6, p.dark)
  const zp = cz - 15.6
  for (const x of [-3.3, -1.1, 1.1, 3.3]) classicalColumn(out, cx + x, zp + 0.5, y0, y0 + 6.2, 0.42, p.stone, { order: 'doric', tier: 'mid', heading: Math.PI })
  block(out, cx - 4.1, cx + 4.1, zp, cz - 12.0, y0 + 6.2, y0 + 7.4, p.trim)
  pedimentOn(out, '-z', zp, cx - 4.2, cx + 4.2, y0 + 7.4, 1.9, 0.4, p.trim)
  roof(out, cx - 4.2, cx + 4.2, zp, cz - 12.0, y0 + 7.4, 1.9, 4.2, 0.01, p.slate)
  // the domed square: its walls to 10, the three half-round apses with green half-domes, the drum and dome, the lantern
  const dz = cz + 3.0
  block(out, cx - 5.3, cx + 5.3, dz - 3.6, dz + 3.6, y0, 10.0, p.stone)
  for (const [ax, az] of [[cx - 5.3, dz], [cx + 5.3, dz], [cx, dz + 3.6]] as const) {
    prism(out, ax, az, y0, 8.0, 3.5, 16, p.stone, FIXED)
    prism(out, ax, az, 8.0, 8.6, 3.75, 16, p.trim, FIXED)
    domeOf(out, ax, az, 8.6, 3.5, 2.6, green, quarter, { sides: 16, steps: 5 })
  }
  prism(out, cx, dz, 10.0, 12.6, 5.0, 24, p.stone, FIXED)
  prism(out, cx, dz, 12.6, 13.1, 5.3, 24, p.trim, FIXED)
  domeOf(out, cx, dz, 13.1, 5.0, 4.3, green, (t) => Math.cos(Math.asin(Math.min(1, t))) ** 0.85, { sides: 24, steps: 8 })
  prism(out, cx, dz, 16.9, 18.3, 1.6, 12, hex('#9fb3b5'), FIXED)
  prism(out, cx, dz, 18.3, 18.7, 1.8, 12, green, FIXED, 1.2)
  prism(out, cx, dz, 18.7, 19.4, 0.25, 8, p.gold, FIXED, 0.15)
}
