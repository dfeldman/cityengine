import type { MeshBuilder } from '../../buildings.ts'
import { block, hex, pane, pediment, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

/**
 * The Maison de Nicolas Flamel (1407), 51 rue de Montmorency — among the oldest houses in Paris: a narrow
 * front of rough stone, three storeys and an attic under a steep roof, the ground floor opened in shop bays
 * between carved stone piers (the figures of the charitable founders), and the long carved inscription running
 * in a band above them. Replaces its building.
 */
export function flamelHouse(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#a3967d')
  const pier = hex('#968870')
  const dark = hex('#2c2a27')
  const wood = hex('#4a3526')
  const slate = hex('#4f555c')
  const hx = fit.hx
  const hz = fit.hz
  const eaves = 13
  block(out, -hx, hx, -hz, hz, 0, eaves, stone)
  roof(out, -hx - 0.3, hx + 0.3, -hz - 0.3, hz + 0.3, eaves, 6, hx * 0.3, hz + 0.3, slate)
  // the ground floor: five carved piers, shop fronts of dark wood and glass between
  const n = 4
  for (let i = 0; i <= n; i++) {
    const x = -hx + 0.6 + (i * (2 * hx - 1.2)) / n
    block(out, x - 0.35, x + 0.35, -hz - 0.3, -hz, 0.5, 4, pier)
    // the carved figure on each pier: a small niche with a standing shape
    pane(out, '-z', -hz - 0.3, x, 1.6, 0.4, 1.5, shade(pier, 0.8), 0.02)
    pane(out, '-z', -hz - 0.32, x, 1.8, 0.16, 1.0, shade(pier, 1.15), 0.02)
  }
  for (let i = 0; i < n; i++) {
    const x = -hx + 0.6 + ((i + 0.5) * (2 * hx - 1.2)) / n
    pane(out, '-z', -hz, x, 0.5, (2 * hx - 1.2) / n - 0.9, 3.4, wood, 0.03)
    pane(out, '-z', -hz, x, 1.3, (2 * hx - 1.2) / n - 1.4, 2.4, dark, 0.05)
  }
  // the inscription band: a dark stone course with pale lettering in a row of small marks
  block(out, -hx, hx, -hz - 0.25, -hz, 4, 4.6, shade(stone, 0.8))
  for (let x = -hx + 0.4; x < hx - 0.3; x += 0.28) pane(out, '-z', -hz - 0.26, x, 4.14, 0.12, 0.3, hex('#e9e1cf'), 0.01)
  // three storeys of small windows in rough stone surrounds
  for (const y of [5.6, 8.4, 11]) {
    for (const x of [-hx * 0.55, 0, hx * 0.55]) {
      pane(out, '-z', -hz, x, y - 0.12, 1.3, 1.9, shade(stone, 1.08), 0.02)
      pane(out, '-z', -hz, x, y, 1.0, 1.6, dark)
    }
  }
  // two dormers in the steep roof
  for (const x of [-hx * 0.4, hx * 0.4]) {
    block(out, x - 0.8, x + 0.8, -hz + 0.4, -hz + 2.2, eaves - 0.2, eaves + 2.2, stone)
    pediment(out, x - 0.9, x + 0.9, -hz + 0.4, eaves + 2.2, 1.1, 1.8, stone)
    pane(out, '-z', -hz + 0.4, x, eaves + 0.3, 0.8, 1.4, dark)
  }
}
