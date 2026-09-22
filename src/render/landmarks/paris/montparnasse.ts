import type { MeshBuilder } from '../../buildings.ts'
import { box, type Rgb } from '../../models.ts'


const FIXED = 0

export function montparnasse(out: MeshBuilder): void {
  const dark: Rgb = [0.16, 0.17, 0.19]
  box(out, 0, 105, 0, 25, 105, 16, dark, FIXED)
  box(out, 0, 211, 0, 22, 1.5, 13, [0.3, 0.3, 0.32], FIXED)
}

/** Sacré-Cœur: a white travertine block crowned by a tall dome and its campanile, on the hill of Montmartre. */
