import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { block, hex, shade } from '../kit.ts'

const FIXED = 0

/**
 * The parvis of the Palais de Chaillot, the Trocadéro's terrace between the two wings (backlog, user
 * 2026-09-22): the eight gilded bronze figures on their pedestals, four down each side of the axis, and the
 * balustrade over the gardens with the stair gap in the middle — the place every photograph of the Eiffel
 * Tower from across the Seine is taken from. The wings themselves are OSM's (a `classical` restyle).
 *
 * Local frame: +z down the axis towards the Eiffel Tower (the manifest turns it), the terrace's edge at +31.
 */
export function trocaderoParvis(out: MeshBuilder): void {
  const stone = hex('#e2d9c6')
  const gilt: Rgb = [0.88, 0.7, 0.3]
  // the figures, on pedestals: a stepped base, the die, a cornice, then the gilded figure
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = sx * 15.5
      const z = -18 + i * 12
      block(out, x - 1.1, x + 1.1, z - 1.1, z + 1.1, 0, 0.35, shade(stone, 0.92))
      block(out, x - 0.85, x + 0.85, z - 0.85, z + 0.85, 0.35, 2.3, stone)
      block(out, x - 0.95, x + 0.95, z - 0.95, z + 0.95, 2.3, 2.5, shade(stone, 1.03))
      // a standing figure, facing the axis: the robe widening to the feet, the torso, an arm raised
      prism(out, x, z, 2.5, 4.3, 0.42, 8, gilt, FIXED, 0.3)
      prism(out, x, z, 4.3, 5.0, 0.3, 8, gilt, FIXED, 0.24)
      prism(out, x, z, 5.0, 5.35, 0.14, 8, gilt, FIXED, 0.13)
      box(out, x - sx * 0.25, 5.2, z + (i % 2 ? 0.2 : -0.2), 0.08, 0.45, 0.08, gilt, FIXED)
    }
  }
  // the balustrade along the terrace's edge, a gap for the stairs down to the gardens in the middle
  for (const sx of [-1, 1]) {
    const x0 = sx * 9
    const x1 = sx * 42
    const lo = Math.min(x0, x1)
    const hi = Math.max(x0, x1)
    block(out, lo, hi, 30.6, 31.4, 0, 0.25, shade(stone, 0.95))
    for (let x = lo + 0.25; x < hi; x += 0.35) box(out, x, 0.6, 31, 0.07, 0.35, 0.07, stone, FIXED)
    block(out, lo, hi, 30.55, 31.45, 0.95, 1.1, shade(stone, 1.04))
    for (let x = lo; x <= hi + 0.01; x += 5.5) block(out, x - 0.3, x + 0.3, 30.5, 31.5, 0, 1.15, stone)
  }
}
