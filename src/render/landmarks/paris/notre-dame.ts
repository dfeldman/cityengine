import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'

const FIXED = 0

export function notreDame(out: MeshBuilder): void {
  const stone: Rgb = [0.8, 0.76, 0.68]
  const lead: Rgb = [0.35, 0.38, 0.42]
  box(out, 20, 17, 0, 60, 17, 20, stone, FIXED)
  box(out, 20, 38, 0, 58, 4, 9, lead, FIXED)
  for (const z of [-11, 11]) box(out, -40, 34, z, 8, 34, 7, stone, FIXED)       // the west towers
  prism(out, 26, 0, 42, 96, 3, 8, lead, FIXED, 0.2)                              // the spire
}
