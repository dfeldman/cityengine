import type { MeshBuilder } from '../../buildings.ts'
import { block, hex, pane, pediment, pinnacle, pointedPane, roof, shade, turret } from '../kit.ts'
import type { Fit } from '../fit.ts'

/**
 * The Hôtel de Sens (1475–1519), one of the few medieval town palaces left in Paris: grey-ochre stone, very
 * steep slate roofs, round turrets corbelled out at the street corners under pointed roofs, a square keep
 * tower with a tall pointed roof at the back, big stone dormers with pinnacles, and a pointed gateway.
 */
export function hotelDeSens(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#d4c8ae')
  const slate = hex('#454b52')
  const dark = hex('#2e2b27')
  const hx = Math.min(fit.hx, 22)
  const hz = Math.min(fit.hz, 14)
  const eaves = 12
  // the main range along the street, and a wing back from one end (an L round the courtyard)
  block(out, -hx, hx, -hz, -hz + 9, 0, eaves, stone)
  roof(out, -hx - 0.3, hx + 0.3, -hz - 0.3, -hz + 9.3, eaves, 9, 0.6, 4.8, slate)
  block(out, hx - 9, hx, -hz + 9, hz, 0, eaves, stone)
  roof(out, hx - 9.3, hx + 0.3, -hz + 9, hz + 0.3, eaves, 8, 4.8, 0.6, slate)
  // a plinth and a string course: the only horizontal lines on the plain rubble wall
  block(out, -hx - 0.15, hx + 0.15, -hz - 0.15, -hz, 0, 0.9, shade(stone, 0.9))
  block(out, -hx, hx, -hz - 0.2, -hz, 7.1, 7.4, shade(stone, 1.06))
  // the gateway: a big pointed arch in a pale dressed-stone frame, and the pedestrian door beside it
  const g = -hx * 0.3
  pointedPane(out, -hz + 0.04, g, 0, 5.4, 7.6, shade(stone, 1.12))
  pointedPane(out, -hz, g, 0, 4.2, 6.6, dark)
  pointedPane(out, -hz + 0.04, g + 4, 0, 1.9, 3.5, shade(stone, 1.12))
  pointedPane(out, -hz, g + 4, 0, 1.3, 3, dark)
  // mullioned cross windows, as a late-Gothic front has — paired, with pale surrounds
  for (const t of [-hx * 0.75, -hx * 0.62, hx * 0.18, hx * 0.3, hx * 0.58, hx * 0.7]) {
    for (const y of [3.4, 8.3]) {
      pane(out, '-z', -hz + 0.02, t, y - 0.2, 1.9, 2.8, shade(stone, 1.12), 0.03)
      pane(out, '-z', -hz, t, y, 1.5, 2.4, dark)
      pane(out, '-z', -hz, t, y + 1.2, 1.5, 0.14, stone, 0.08)             // the transom
      pane(out, '-z', -hz, t, y, 0.14, 2.4, stone, 0.08)                   // the mullion
    }
  }
  // the dormers rise straight out of the street wall: stone fronts, a steep gable, a pinnacle each side
  for (const t of [-hx * 0.68, hx * 0.24, hx * 0.64]) {
    const z = -hz
    block(out, t - 1.4, t + 1.4, z, z + 3, eaves - 0.3, eaves + 3.4, stone)
    pediment(out, t - 1.5, t + 1.5, z, eaves + 3.4, 3, 3, stone)
    pane(out, '-z', z, t, eaves + 0.4, 1.3, 2.5, dark)
    pane(out, '-z', z, t, eaves + 0.4, 0.14, 2.5, stone, 0.08)
    for (const s of [-1, 1]) pinnacle(out, t + s * 1.65, z + 0.2, eaves + 2.6, 4.4, 0.4, stone)
  }
  // the corbelled turrets at the two street corners
  for (const s of [-1, 1]) turret(out, s * (hx - 0.4), -hz - 0.4, 4.5, eaves + 0.5, 1.7, 5.5, stone, slate)
  // the keep at the back corner: a square tower with a tall pointed roof
  const kx = -hx + 3.2
  const kz = hz - 3.2
  block(out, kx - 3, kx + 3, kz - 3, kz + 3, 0, 18, stone)
  roof(out, kx - 3.3, kx + 3.3, kz - 3.3, kz + 3.3, 18, 8.5, 3.3, 3.3, slate)
  for (const y of [7, 12, 15]) pane(out, '-z', kz - 3, kx, y, 0.9, 1.6, dark)
}
