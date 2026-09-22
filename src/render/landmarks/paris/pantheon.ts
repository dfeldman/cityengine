import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'

const FIXED = 0

export function pantheon(out: MeshBuilder): void {
  const stone: Rgb = [0.86, 0.83, 0.76]
  box(out, 0, 14, 0, 55, 14, 42, stone, FIXED)
  prism(out, 0, 0, 28, 50, 16, 24, stone)
  prism(out, 0, 0, 50, 54, 17, 24, stone)
  prism(out, 0, 0, 54, 76, 15, 24, [0.55, 0.6, 0.62], FIXED, 3)
  prism(out, 0, 0, 76, 83, 2.5, 8, stone, FIXED, 0.5)
}

/** Notre-Dame: the nave's long roof, the two square west towers, and Viollet-le-Duc's spire (rebuilt 2024). */
