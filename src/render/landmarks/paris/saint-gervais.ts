import { MeshBuilder } from '../../buildings.ts'
import { prism } from '../../models.ts'
import { archedPane, block, column, hex, pediment, pointedPane, roof, rotated, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/**
 * Saint-Gervais-Saint-Protais, behind the Hôtel de Ville: a tall Flamboyant Gothic church with, in front of
 * it, the first classical facade in Paris (Salomon de Brosse, 1616) — three orders of columns stacked one on
 * another, Doric, Ionic, Corinthian, narrowing to a pediment at the top — and the Gothic bell tower beside.
 */
export function saintGervais(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#c9bfa8')
  const trim = shade(stone, 1.06)
  const slate = hex('#4f565e')
  const dark = hex('#2d2c2a')
  const zf = -fit.hz
  const back = fit.hz - 4
  // the nave, high and narrow, under a steep roof; the aisles either side; a polygonal apse at the east end
  block(out, -7, 7, zf + 5, back - 8, 0, 25, stone)
  roof(out, -7.3, 7.3, zf + 5, back - 8, 25, 10, 7.3, 0, slate)
  for (const sx of [-1, 1]) {
    block(out, sx < 0 ? -14 : 7, sx < 0 ? -7 : 14, zf + 7, back - 10, 0, 13, stone)
    roof(out, sx < 0 ? -14.3 : 7, sx < 0 ? -7 : 14.3, zf + 7, back - 10, 13, 3, sx < 0 ? 0 : 7.3, 0, slate)
    // flying buttresses: a slab leaning from the aisle wall to the nave
    for (let z = zf + 11; z < back - 10; z += 7) block(out, sx < 0 ? -14.4 : 13.4, sx < 0 ? -13.4 : 14.4, z - 0.5, z + 0.5, 0, 17, stone)
  }
  prism(out, 0, back - 8, 0, 25, 7, 8, stone)
  prism(out, 0, back - 8, 25, 31, 7.2, 8, slate, FIXED, 0.5)
  // the tall Gothic windows of the nave clerestory, down both sides: drawn on a −z face, turned onto ±x
  // (rotated() by +90° sends a −z face at 7 m to the −x side with t → −z; by −90° to +x with t → z)
  for (const sx of [-1, 1]) {
    const side = new MeshBuilder()
    for (let z = zf + 10; z < back - 10; z += 7) pointedPane(side, -7.06, sx < 0 ? -z : z, 15, 2.6, 8, dark)
    rotated(out, side, sx < 0 ? Math.PI / 2 : -Math.PI / 2)
  }
  // the bell tower on the south side, square, with a balustrade and a small pyramid
  block(out, 8, 16, zf + 12, zf + 20, 0, 38, stone)
  block(out, 7.6, 16.4, zf + 11.6, zf + 20.4, 37, 38.2, trim)
  roof(out, 8, 16, zf + 12, zf + 20, 38.2, 5, 4, 4, slate)
  pointedPane(out, zf + 12, 12, 26, 2, 7, dark)
  // the classical front: three orders stacked, each narrower, and the pediment
  const orders: [number, number, number, number, number][] = [
    // [half width, y0, y1, column radius, columns per side]
    [11, 0, 13, 0.55, 2],
    [8, 13.8, 22.5, 0.45, 2],
    [5.5, 23.3, 30.5, 0.38, 1],
  ]
  for (const [w, y0, y1, cr, per] of orders) {
    block(out, -w, w, zf - 0.6, zf + 5, y0, y1, stone)
    block(out, -w - 0.4, w + 0.4, zf - 1.3, zf + 5, y1, y1 + 0.8, trim)          // the entablature
    for (const sx of [-1, 1]) {
      for (let k = 0; k < per; k++) {
        const x = sx * (w - 0.9 - k * 1.5)
        column(out, x, zf - 1.1, y0, y1, cr, trim)
        column(out, sx * (w * 0.42 + k * 1.3), zf - 1.1, y0, y1, cr, trim)
      }
    }
  }
  pediment(out, -6, 6, zf - 1.3, 31.3, 3.5, 2, trim)
  archedPane(out, zf - 0.62, 0, 0, 3.6, 8, dark)
  archedPane(out, zf - 0.62, 0, 15, 2.6, 5.8, dark)
  archedPane(out, zf - 0.62, 0, 24.5, 2, 4.4, dark)
  block(out, -12, 12, zf - 4, zf - 0.6, 0, 0.5, shade(stone, 0.95))                  // the steps
}
