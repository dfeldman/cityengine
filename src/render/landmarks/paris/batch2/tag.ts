import type { MeshBuilder } from '../../../buildings.ts'
import { box, type Rgb } from '../../kit.ts'

/** kit.ts `block` with a surface tag, which every stone and concrete of this folder wants (cartoon-material.ts SURFACES) */
export function block(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, colour: Rgb, tag = 0): void {
  box(out, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, colour, tag)
}
