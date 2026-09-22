import { MeshBuilder } from '../../buildings.ts'
import { prism } from '../../models.ts'
import { beam, block, hex, pane, pediment, pinnacle, pointedPane, roof, rotated, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

/**
 * Saint-Merri (1500–1550), the parish church of the Pompidou's quarter: Flamboyant Gothic throughout — a tall
 * nave under a steep roof between aisles, the west front on the Rue Saint-Martin with its three pointed
 * portals under gables and pinnacles, the rose-mullioned window above, and the square bell tower at the
 * north-west corner with its little turret. Replaces its building in the outer ring.
 */
export function saintMerri(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#b9ad95')
  const trim = shade(stone, 1.05)
  const slate = hex('#4b525a')
  const dark = hex('#2d2c2a')
  const hx = Math.min(fit.hx, 16)
  const zf = -fit.hz
  const zb = fit.hz
  // the aisles and the nave, the nave's steep roof, the polygonal apse at the east
  block(out, -hx, hx, zf + 2, zb - 8, 0, 13, stone)
  roof(out, -hx - 0.2, hx + 0.2, zf + 2, zb - 8, 13, 3, hx * 0.5, 0, slate)
  block(out, -6.5, 6.5, zf, zb - 8, 0, 25, stone)
  roof(out, -6.8, 6.8, zf, zb - 8, 25, 9, 6.8, 0, slate)
  prism(out, 0, zb - 8, 0, 25, 6.5, 7, stone)
  prism(out, 0, zb - 8, 25, 31, 6.8, 7, slate, 0, 0.3)
  // flying buttresses: slabs from the aisle wall up to the nave, and pinnacles on their piers
  for (let z = zf + 7; z < zb - 10; z += 6) {
    for (const sx of [-1, 1]) {
      block(out, sx * hx - 0.5, sx * hx + 0.5, z - 0.5, z + 0.5, 0, 16, stone)
      pinnacle(out, sx * hx, z, 16, 4, 0.7, trim)
      beam(out, [sx * hx, 15, z], [sx * 6.6, 21.5, z], 0.3, stone, 0.5)
    }
  }
  // the aisles' tall windows between the buttresses, both sides
  for (const sx of [-1, 1]) {
    const side = new MeshBuilder()
    for (let z = zf + 7; z < zb - 12; z += 6) pointedPane(side, -hx - 0.02, sx < 0 ? -(z + 3) : z + 3, 3, 2.4, 7.5, dark)
    rotated(out, side, sx < 0 ? Math.PI / 2 : -Math.PI / 2)
  }
  // clerestory lancets down the nave, both sides
  for (const sx of [-1, 1]) {
    const side = new MeshBuilder()
    for (let z = zf + 7; z < zb - 12; z += 6) pointedPane(side, -6.56, sx < 0 ? -(z + 3) : z + 3, 15, 2.2, 7.5, dark)
    rotated(out, side, sx < 0 ? Math.PI / 2 : -Math.PI / 2)
  }
  // the west front: three portals under crocketed gables, the great window, the gable, pinnacles
  for (const [x, w, h] of [[-4.2, 2.4, 6.5], [0, 3.4, 8], [4.2, 2.4, 6.5]] as const) {
    pointedPane(out, zf - 0.02, x, 0.5, w + 0.8, h + 0.8, trim)
    pointedPane(out, zf - 0.04, x, 0.5, w, h, dark)
    pediment(out, x - w / 2 - 0.5, x + w / 2 + 0.5, zf - 0.3, h + 1.1, 2.8, 0.4, trim)
  }
  pointedPane(out, zf - 0.02, 0, 11, 5.4, 10, dark)
  for (let k = -2; k <= 2; k++) pane(out, '-z', zf - 0.05, k * 0.9, 11, 0.12, 7, trim, 0.04)
  pediment(out, -6.5, 6.5, zf - 0.1, 25, 8, 1, stone)
  for (const x of [-6.5, 6.5]) pinnacle(out, x, zf + 0.3, 23, 7, 0.9, trim)
  // the bell tower at the north-west corner (local −x is north) and its stair turret
  const tx = -hx + 3.5
  const tz = zf + 3.5
  block(out, tx - 3.5, tx + 3.5, tz - 3.5, tz + 3.5, 0, 34, stone)
  block(out, tx - 3.8, tx + 3.8, tz - 3.8, tz + 3.8, 33, 34.6, trim)
  for (const y of [18, 26]) pointedPane(out, tz - 3.52, tx, y, 1.6, 5.2, dark)
  prism(out, tx + 3, tz - 3, 20, 38, 1.1, 8, stone)
  prism(out, tx + 3, tz - 3, 38, 41, 1.3, 8, slate, 0, 0.1)
}
