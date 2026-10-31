import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { shade } from '../kit.ts'

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
  // (top-25 audit, 2026-10-30) the round plinth of white marble it really stands on, Napoleon's elephant's basin, then the bronze square base
  // with its Gallic cock at each corner and the lion in relief on the south face, the wreathed drum over it
  prism(out, 0, 0, 0, 1.1, 8.6, 24, marble, FIXED)
  prism(out, 0, 0, 1, 1.6, 8, 24, shade(marble, 0.92), FIXED)
  box(out, 0, 2.9, 0, 4.6, 1.3, 4.6, marble, FIXED)                    // the pedestal
  box(out, 0, 5.2, 0, 3.7, 1, 3.7, bronze, FIXED)
  box(out, 0, 6.32, 0, 4, 0.08, 4, shade(bronze, 0.85), FIXED)
  for (const [x, z] of [[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]]) {
    box(out, x, 6.8, z, 0.3, 0.42, 0.3, bronze, FIXED)
    prism(out, x, z, 7.2, 7.6, 0.2, 5, bronze, FIXED, 0.08)
  }
  box(out, 0, 5.2, -3.74, 1.9, 0.5, 0.05, shade(bronze, 1.25), FIXED)
  prism(out, 0, 0, 6.4, 7.6, 2.5, 20, bronze, FIXED, 2)                 // the base drum
  prism(out, 0, 0, 7.6, 8.1, 2.05, 20, gold, FIXED)                     // its wreath
  // the shaft, fluted: 24 faces, every other one set back
  const y0 = 8.1
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
  // the three bands of names, the gilded rings that divide the shaft
  for (let y = 16; y < y1; y += 8) {
    prism(out, 0, 0, y, y + 0.5, 1.28, 16, bronze)
    prism(out, 0, 0, y + 0.5, y + 0.58, 1.3, 16, gold)
  }
  prism(out, 0, 0, y1, y1 + 1.2, 1.2, 16, bronze, FIXED, 1.8)          // the capital
  box(out, 0, y1 + 1.4, 0, 1.9, 0.2, 1.9, bronze, FIXED)                // the gallery
  for (const [x, z, wx, wz] of [[-1.85, 0, 0.04, 1.85], [1.85, 0, 0.04, 1.85], [0, -1.85, 1.85, 0.04], [0, 1.85, 1.85, 0.04]]) box(out, x, y1 + 1.95, z, wx, 0.04, wz, shade(bronze, 0.8), FIXED)
  prism(out, 0, 0, y1 + 1.6, y1 + 2.4, 0.9, 12, bronze, FIXED, 0.7)     // the lantern
  // the Génie de la Liberté on his globe is the user's model (public/landmarks/paris-statues.json), standing
  // on the lantern's top at y1 + 2.4
}
