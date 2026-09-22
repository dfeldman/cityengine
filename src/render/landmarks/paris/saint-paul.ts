import type { MeshBuilder } from '../../buildings.ts'
import { box, prism } from '../../models.ts'
import { archedPane, block, column, dome, hex, pediment, roof, shade, windows } from '../kit.ts'
import type { Fit } from '../fit.ts'

/**
 * Église Saint-Paul-Saint-Louis, the Jesuit church on Rue Saint-Antoine (1627–41): a tall frontispiece of
 * three superimposed orders — paired Corinthian columns either side of a central bay, each tier narrower, the
 * top one under a pediment — and behind it the first great dome in Paris, on a drum over the crossing, with a
 * lantern. The facade stands ON the footprint's street edge (local −z), so the name plate is on it.
 */
export function saintPaul(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#e6dcc8')
  const dark = hex('#2c2a28')
  const slate = hex('#565d66')
  const lead = hex('#5c636b')
  const gold = hex('#c9a646')
  const front = -fit.hz
  const back = fit.hz
  const W = Math.min(2 * fit.hx, 30)
  const naveW = Math.min(W * 0.62, 16)
  // the nave and its aisles behind the facade
  block(out, -naveW / 2, naveW / 2, front + 1.5, back, 0, 22, stone)
  roof(out, -naveW / 2 - 0.4, naveW / 2 + 0.4, front + 1.5, back, 22, 7, naveW / 2 + 0.4, 0, slate)
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -W / 2 : naveW / 2
    const x1 = s < 0 ? -naveW / 2 : W / 2
    block(out, x0, x1, front + 1.5, back - 4, 0, 13, stone)
    roof(out, x0, x1, front + 1.5, back - 4, 13, 2.5, 0, 0, slate)
    windows(out, s < 0 ? '-x' : '+x', s < 0 ? -W / 2 : W / 2, front + 6, back - 8, 5, 2.2, 5, 7, dark)
  }
  windows(out, '-x', -naveW / 2, front + 6, back - 4, 15, 2, 5, 8, dark)
  windows(out, '+x', naveW / 2, front + 6, back - 4, 15, 2, 5, 8, dark)

  // the frontispiece: three tiers, each set back a little and narrower
  const tiers: [number, number, number, number][] = [[0, 17, W, 0], [17, 31, W * 0.72, 0.4], [31, 41, W * 0.46, 0.8]]
  for (const [y0, y1, w, back0] of tiers) {
    const z = front + back0
    block(out, -w / 2, w / 2, z, z + 3, y0, y1, stone)
    // the entablature above the tier, proud of it
    block(out, -w / 2 - 0.5, w / 2 + 0.5, z - 0.5, z + 3, y1 - 1.1, y1, shade(stone, 1.04))
    // paired columns either side of the central bay, standing proud of the tier
    const cr = Math.max(0.35, (y1 - y0) * 0.035)
    for (const s of [-1, 1]) {
      for (const k of [0.16, 0.24, 0.38, 0.46]) {
        if (w < 16 && k > 0.3) continue
        column(out, s * w * k, z - 0.7, y0, y1 - 1.1, cr, stone)
      }
    }
    // the central opening: the great door on the ground tier, a tall window above
    if (y0 === 0) {
      archedPane(out, z, 0, 0.5, 4.2, 9, dark)
      for (const s of [-1, 1]) archedPane(out, z, s * w * 0.31, 0.5, 2.2, 5.5, dark)
    } else {
      archedPane(out, z, 0, y0 + 2, 3.2, (y1 - y0) * 0.6, dark)
    }
    // the scrolled consoles that step each upper tier down to the one below: low stepped blocks either side
    if (y0 > 0) {
      for (const s of [-1, 1]) {
        const x = s * (w / 2 + 1.2)
        box(out, x, y0 + 0.7, z + 1.5, 1.2, 0.7, 1.4, stone, 0)
        box(out, x - s * 0.4, y0 + 2, z + 1.5, 0.8, 0.6, 1.3, stone, 0)
        box(out, x - s * 0.8, y0 + 3, z + 1.5, 0.4, 0.4, 1.2, stone, 0)
      }
    }
  }
  pediment(out, -W * 0.25, W * 0.25, front + 0.8, 41, 4.5, 3, stone)
  prism(out, 0, front + 1.5, 45.5, 47.5, 0.12, 4, gold, 0, 0.12)                // the cross on the pediment

  // the dome over the crossing, well back from the street, rising behind the facade
  const cz = front + 1.5 + (back - front) * 0.58
  prism(out, 0, cz, 22, 32, 9, 16, stone)                                        // the drum
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    box(out, Math.sin(a) * 9.1, 27, cz + Math.cos(a) * 9.1, 0.4, 5, 0.4, shade(stone, 1.05), 0)   // its pilasters
  }
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    box(out, Math.sin(a) * 9.02, 27.5, cz + Math.cos(a) * 9.02, 0.9, 2.2, 0.9, dark, 0)            // its windows
  }
  block(out, -9.6, 9.6, cz - 9.6, cz + 9.6, 32, 32.6, shade(stone, 1.03))
  dome(out, 0, cz, 32.6, 9.2, 15, lead, 16, shade(lead, 1.25))
  prism(out, 0, cz, 47, 51.5, 1.8, 8, stone)                                     // the lantern
  dome(out, 0, cz, 51.5, 1.9, 1.6, lead, 8)
  prism(out, 0, cz, 53, 55.5, 0.1, 4, gold, 0, 0.1)
  box(out, 0, 54.6, cz, 0.6, 0.08, 0.08, gold, 0)
}
