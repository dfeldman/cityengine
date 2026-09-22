import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'

const FIXED = 0

export function sacreCoeur(out: MeshBuilder): void {
  const white: Rgb = [0.94, 0.93, 0.9]
  box(out, 0, 20, 0, 40, 20, 26, white, FIXED)
  prism(out, 0, -6, 40, 58, 12, 16, white)
  prism(out, 0, -6, 58, 80, 13, 16, white, FIXED, 3)
  prism(out, 0, -6, 80, 86, 2, 8, white, FIXED, 0.5)
  for (const [x, z] of [[-26, 12], [26, 12], [-26, -20], [26, -20]]) {
    prism(out, x, z, 40, 50, 4, 12, white)
    prism(out, x, z, 50, 58, 4.5, 12, white, FIXED, 0.8)
  }
  box(out, 0, 50, -34, 6, 50, 6, white, FIXED)                                  // the campanile
  prism(out, 0, -34, 100, 112, 5, 8, white, FIXED, 0.5)
}

/** The Panthéon: a temple front and a drum with its colonnade and dome. */
