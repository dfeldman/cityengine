import { MeshBuilder } from '../../buildings.ts'
import { block, hex, pane, pediment, pinnacle, placed, pointedPane, roof, shade, turret } from '../kit.ts'
import type { Fit } from '../fit.ts'

/**
 * The Hôtel de Sens (1475–1519), one of the few medieval town palaces left in Paris, as seen from the Rue du
 * Figuier (BUGS.md #7, from a photograph of that front): pale dressed limestone under a very steep slate
 * roof that ends in a stone gable and chimney on the left; two round turrets corbelled out of the front at
 * first-floor height under TALL, sharp slate cones — one at the left corner, one flanking the gateway on its
 * right; a big pointed carriage arch with an iron gate in a moulded frame and a small pointed door beside it;
 * one tall Flamboyant dormer with pinnacles between the turrets; the range to the right lower; the square keep
 * with its pointed roof behind.
 */
export function hotelDeSens(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#dcd2bb')
  const frame = shade(stone, 1.08)
  const slate = hex('#3f454c')
  const dark = hex('#2a2825')
  const inside = hex('#131211')
  const iron = hex('#4a504a')
  const hx = Math.min(fit.hx, 22)
  const hz = Math.min(fit.hz, 14)
  const depth = 10
  const zf = -hz                       // the street front
  const zb = -hz + depth
  // the main range: its left two thirds tall, the right third a storey lower
  const split = hx * 0.35
  const eaves = 12.5
  const low = 10.2
  block(out, -hx, split, zf, zb, 0, eaves, stone)
  roof(out, -hx, split + 0.3, zf - 0.3, zb + 0.3, eaves, 9.5, 0, 5, slate)
  block(out, split, hx, zf, zb, 0, low, stone)
  roof(out, split, hx + 0.3, zf - 0.3, zb + 0.3, low, 7.5, 0.5, 5, slate)
  // the stone gable at the left end, standing proud of the slates, and its chimney
  const gable = new MeshBuilder()
  pediment(gable, -depth / 2 - 0.3, depth / 2 + 0.3, 0, eaves, 10.2, 0.5, stone)
  placed(out, gable, -Math.PI / 2, -hx - 0.2, (zf + zb) / 2)
  block(out, -hx - 0.2, -hx + 1.3, (zf + zb) / 2 - 0.8, (zf + zb) / 2 + 0.8, eaves + 8.5, eaves + 12, stone)
  // the wing back from the right end, round the courtyard
  block(out, hx - 8, hx, zb, hz, 0, low, stone)
  roof(out, hx - 8.3, hx + 0.3, zb, hz + 0.3, low, 7, 4, 0.5, slate)

  // plinth and string courses
  block(out, -hx - 0.15, hx + 0.15, zf - 0.15, zf, 0, 0.8, shade(stone, 0.92))
  block(out, -hx, split, zf - 0.18, zf, 4.3, 4.55, frame)
  block(out, -hx, split, zf - 0.18, zf, 8.5, 8.75, frame)

  // the gateway: a big pointed arch in a deep moulded frame, the iron gate in it, the small door to its right
  const g = -hx * 0.08
  pointedPane(out, zf - 0.06, g, 0, 6.4, 9.2, frame)
  pointedPane(out, zf - 0.08, g, 0, 5.6, 8.6, shade(stone, 0.95))
  pointedPane(out, zf - 0.1, g, 0, 4.8, 8.0, inside)
  // the iron gate, in front of the dark passage so its bars read
  for (let i = -4; i <= 4; i++) block(out, g + i * 0.55 - 0.035, g + i * 0.55 + 0.035, zf - 0.16, zf - 0.12, 0, 6.2, iron)
  for (const y of [0.4, 3.2, 6.1]) block(out, g - 2.35, g + 2.35, zf - 0.17, zf - 0.13, y, y + 0.12, iron)
  const door = g + 4.4
  pointedPane(out, zf - 0.06, door, 0, 2.2, 4.1, frame)
  pointedPane(out, zf - 0.1, door, 0, 1.6, 3.6, dark)

  // mullioned cross windows with pale surrounds, few and small, as the real front has
  for (const t of [-hx * 0.78, -hx * 0.5, g + 7.5, hx * 0.62, hx * 0.84]) {
    const top = t > split ? [5.6] : [2.2, 5.6, 9.4]
    for (const y of top) {
      pane(out, '-z', zf - 0.02, t, y - 0.15, 1.5, 2.3, frame, 0.03)
      pane(out, '-z', zf - 0.04, t, y, 1.15, 2.0, dark)
      pane(out, '-z', zf - 0.05, t, y + 1.05, 1.15, 0.12, frame, 0.05)
      pane(out, '-z', zf - 0.05, t, y, 0.12, 2.0, frame, 0.05)
    }
  }

  // the turrets, corbelled out of the front at first-floor height, with the tall sharp cones that ARE the
  // building's silhouette: one at the left corner, one on the right of the gateway
  const r = 1.75
  for (const x of [-hx + 0.3, door + 3.4]) turret(out, x, zf - r * 0.55, 4.6, eaves + 1.2, r, 10.5, stone, slate)

  // the Flamboyant dormer between them: a tall stone front rising from the wall through the roof, its steep
  // gable, a window, and pinnacles either side and on top
  const dx = (door + 3.4 + (-hx + 0.3)) / 2 + 1.5
  block(out, dx - 1.6, dx + 1.6, zf - 0.2, zf + 2.5, eaves - 0.5, eaves + 4.2, stone)
  pediment(out, dx - 1.7, dx + 1.7, zf - 0.2, eaves + 4.2, 3.2, 2.7, stone)
  pane(out, '-z', zf - 0.22, dx, eaves + 0.5, 1.4, 2.8, dark)
  pane(out, '-z', zf - 0.24, dx, eaves + 0.5, 0.12, 2.8, frame, 0.05)
  for (const s of [-1, 1]) pinnacle(out, dx + s * 1.8, zf - 0.1, eaves + 2.8, 5.2, 0.45, frame)
  pinnacle(out, dx, zf - 0.1, eaves + 7.2, 1.8, 0.35, frame)
  // and two plainer dormers on the lower range
  for (const t of [hx * 0.6, hx * 0.84]) {
    block(out, t - 1.1, t + 1.1, zf + 0.6, zf + 3, low - 0.2, low + 2.4, stone)
    pediment(out, t - 1.2, t + 1.2, zf + 0.6, low + 2.4, 2, 2.4, stone)
    pane(out, '-z', zf + 0.58, t, low + 0.2, 1.0, 1.9, dark)
  }

  // the keep at the back corner: a square tower with a tall pointed roof, over the roofs from the street
  const kx = -hx + 3.4
  const kz = hz - 3.2
  block(out, kx - 3, kx + 3, kz - 3, kz + 3, 0, 19, stone)
  roof(out, kx - 3.3, kx + 3.3, kz - 3.3, kz + 3.3, 19, 9, 3.3, 3.3, slate)
  for (const y of [8, 12.5, 16]) pane(out, '-z', kz - 3, kx, y, 0.9, 1.6, dark)
}
