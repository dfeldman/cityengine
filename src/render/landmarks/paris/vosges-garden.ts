import { MeshBuilder } from '../../buildings.ts'
import { box, prism } from '../../models.ts'
import { beam, block, fourSides, hex } from '../kit.ts'

const FIXED = 0

/**
 * The Square Louis-XIII, the garden in the middle of the Place des Vosges: a 113 m square inside a black
 * iron railing with gilded tips; gravel paths round it and crossing it; four lawns edged with clipped box;
 * a tiered fountain in the middle of each lawn; and at the centre the white marble Louis XIII on horseback.
 * The lime trees are OSM's own mapped trees, drawn by the city. Symbolic throughout — plants as clipped
 * shapes, never modelled leaves. Model ground level is y = 0.5 (the loader sinks every base half a metre).
 */
export function vosgesGarden(out: MeshBuilder): void {
  const g = 0.5
  const half = 55
  const iron = hex('#1d1f21')
  const gilt = hex('#c9a646')
  const gravel = hex('#bdb095')
  const box_ = hex('#3f6433')
  const stoneC = hex('#e3ddd0')
  const marble = hex('#eeeae2')
  const water = hex('#6f8a96')
  // the railing: posts every 2.5 m with gilded tips, a top and bottom rail, a gate in the middle of each side
  const side = new MeshBuilder()
  for (let x = -half; x <= half + 0.01; x += 2.5) {
    if (Math.abs(x) < 3) continue
    block(side, x - 0.04, x + 0.04, -half - 0.04, -half + 0.04, g, g + 2.1, iron)
    prism(side, x, -half, g + 2.1, g + 2.35, 0.07, 4, gilt, FIXED, 0.01)
  }
  for (const y of [g + 0.25, g + 1.9]) {
    block(side, -half, -3, -half - 0.03, -half + 0.03, y, y + 0.06, iron)
    block(side, 3, half, -half - 0.03, -half + 0.03, y, y + 0.06, iron)
  }
  for (const s of [-1, 1]) block(side, s * 3 - 0.18, s * 3 + 0.18, -half - 0.18, -half + 0.18, g, g + 2.8, stoneC)
  fourSides(out, side)
  // the gravel: a path round inside the railing and the cross through the middle
  block(out, -half, half, -half, -half + 5, g, g + 0.06, gravel)
  block(out, -half, half, half - 5, half, g, g + 0.06, gravel)
  block(out, -half, -half + 5, -half + 5, half - 5, g, g + 0.06, gravel)
  block(out, half - 5, half, -half + 5, half - 5, g, g + 0.06, gravel)
  block(out, -3, 3, -half + 5, half - 5, g, g + 0.06, gravel)
  block(out, -half + 5, half - 5, -3, 3, g, g + 0.06, gravel)
  block(out, -12, 12, -12, 12, g, g + 0.06, gravel)
  // four lawns, each edged with clipped box and holding a fountain
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x0 = sx < 0 ? -half + 5 : 3
      const x1 = sx < 0 ? -3 : half - 5
      const z0 = sz < 0 ? -half + 5 : 3
      const z1 = sz < 0 ? -3 : half - 5
      block(out, x0, x1, z0, z1, g, g + 0.08, hex('#4f7539'))
      for (const [a0, a1, b0, b1] of [[x0, x1, z0, z0 + 0.6], [x0, x1, z1 - 0.6, z1], [x0, x0 + 0.6, z0, z1], [x1 - 0.6, x1, z0, z1]]) {
        block(out, a0, a1, b0, b1, g, g + 0.55, box_)
      }
      // the fountain: a round stone basin with water in it, a pedestal, two bowls and the jet
      const fx = (x0 + x1) / 2
      const fz = (z0 + z1) / 2
      prism(out, fx, fz, g, g + 0.6, 3.4, 20, stoneC)
      prism(out, fx, fz, g + 0.5, g + 0.62, 3.1, 20, water)
      prism(out, fx, fz, g + 0.6, g + 1.8, 0.35, 10, stoneC, FIXED, 0.25)
      prism(out, fx, fz, g + 1.8, g + 2.1, 0.3, 14, stoneC, FIXED, 1.4)
      prism(out, fx, fz, g + 2.1, g + 2.9, 0.2, 10, stoneC, FIXED, 0.15)
      prism(out, fx, fz, g + 2.9, g + 3.1, 0.15, 12, stoneC, FIXED, 0.8)
      prism(out, fx, fz, g + 3.1, g + 4.2, 0.08, 6, hex('#dfe8ec'), FIXED, 0.02)
    }
  }
  // Louis XIII: a white marble horse and rider on a tall plinth in the middle, behind a little railing
  block(out, -3.4, 3.4, -2, 2, g, g + 0.5, stoneC)
  block(out, -2.6, 2.6, -1.3, 1.3, g + 0.5, g + 4.2, marble)
  block(out, -2.8, 2.8, -1.5, 1.5, g + 4.2, g + 4.5, marble)
  const y = g + 4.5
  block(out, -1.4, 1.2, -0.45, 0.45, y + 1.3, y + 2.3, marble)                 // the horse's body
  for (const [lx, lz] of [[-1.15, -0.3], [-1.15, 0.3], [0.95, -0.3], [0.95, 0.3]]) block(out, lx - 0.12, lx + 0.12, lz - 0.12, lz + 0.12, y, y + 1.4, marble)
  beam(out, [1.1, y + 2.1, 0], [1.7, y + 3.0, 0], 0.22, marble, 0.28)           // the neck
  beam(out, [1.6, y + 3.0, 0], [2.1, y + 2.7, 0], 0.18, marble, 0.22)           // the head
  beam(out, [-1.4, y + 2.1, 0], [-1.9, y + 1.1, 0], 0.08, marble)               // the tail
  prism(out, -0.1, 0, y + 2.3, y + 3.3, 0.32, 8, marble, FIXED, 0.26)            // the king
  prism(out, -0.1, 0, y + 3.3, y + 3.75, 0.2, 8, marble)                          // his head
  box(out, -0.1, y + 3.8, 0, 0.32, 0.06, 0.32, marble, FIXED)                     // the hat's brim
  beam(out, [0, y + 3.0, 0], [0.8, y + 3.4, 0.3], 0.07, marble)                   // the arm, holding the reins
}
