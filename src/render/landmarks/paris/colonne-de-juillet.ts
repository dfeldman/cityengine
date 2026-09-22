import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'

const FIXED = 0

/**
 * The Colonne de Juillet in the Place de la Bastille: a marble pedestal, a fluted bronze column, a capital
 * with a gallery, and the gilded Génie de la Liberté on a globe at the top. 46.3 m. At the distance a rider
 * sees it from, the silhouette and the gold at the top are the whole of it.
 */
export function colonneDeJuillet(out: MeshBuilder): void {
  const marble: Rgb = [0.86, 0.84, 0.8]
  const bronze: Rgb = [0.25, 0.36, 0.3]
  const gold: Rgb = [0.86, 0.68, 0.24]
  box(out, 0, 0.6, 0, 6, 0.6, 6, marble, FIXED)                        // the step
  box(out, 0, 2.6, 0, 4.6, 1.4, 4.6, marble, FIXED)                    // the pedestal
  box(out, 0, 4.2, 0, 3.4, 0.2, 3.4, bronze, FIXED)
  prism(out, 0, 0, 4.4, 6.4, 2.4, 16, bronze)                          // the base drum
  // the shaft, fluted: 24 faces, every other one set back
  const y0 = 6.4
  const y1 = 40.4
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2
    const a1 = ((i + 1) / 24) * Math.PI * 2
    const am = (a0 + a1) / 2
    const r = i % 2 === 0 ? 1.2 : 1.1
    out.quad([
      [Math.sin(a0) * r, y0, Math.cos(a0) * r], [Math.sin(a1) * r, y0, Math.cos(a1) * r],
      [Math.sin(a1) * r, y1, Math.cos(a1) * r], [Math.sin(a0) * r, y1, Math.cos(a0) * r],
    ], [Math.sin(am), 0, Math.cos(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], bronze, FIXED)
  }
  for (let y = 10; y < y1; y += 8) prism(out, 0, 0, y, y + 0.35, 1.3, 16, bronze)   // the bands
  prism(out, 0, 0, y1, y1 + 1.2, 1.2, 16, bronze, FIXED, 1.8)          // the capital
  box(out, 0, y1 + 1.4, 0, 1.9, 0.2, 1.9, bronze, FIXED)                // the gallery
  prism(out, 0, 0, y1 + 1.6, y1 + 2.4, 0.9, 12, bronze, FIXED, 0.7)     // the lantern
  prism(out, 0, 0, y1 + 2.4, y1 + 3.0, 0.6, 12, gold)                   // the globe (as a drum)
  prism(out, 0, 0, y1 + 3.0, y1 + 5.2, 0.28, 8, gold, FIXED, 0.18)      // the figure
  box(out, 0, y1 + 4.6, 0, 1.2, 0.08, 0.12, gold, FIXED)                // its outstretched wings
  prism(out, 0, 0, y1 + 5.2, y1 + 5.9, 0.08, 6, gold, FIXED, 0)         // the torch
}
