/**
 * SEA STACKS (appearance pass, 2026-10-03): Seal Rocks off the Cliff House are steep dark stacks streaked white with
 * guano, the sea breaking round them — drawn as a flat brown patch at the waterline. A cluster of rough faceted
 * crags, deterministic from the seed, standing out of the water (placed with `deckAbove: 0`).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const h = (a: number, b: number): number => { const v = Math.sin(a * 91.3 + b * 47.7) * 43758.5; return v - Math.floor(v) }

export function seaStacks(out: MeshBuilder, fit: Fit): void {
  const R = Math.max(10, Math.min(fit.hx, fit.hz))
  const rock = surfaceTag('concrete')
  const n = 7
  for (let i = 0; i < n; i++) {
    const a = h(i, 1) * Math.PI * 2, d = (i === 0 ? 0 : 0.35 + h(i, 2) * 0.55) * R
    const x = Math.cos(a) * d, z = Math.sin(a) * d
    const r = R * (i === 0 ? 0.55 : 0.18 + h(i, 3) * 0.22)
    const H = (i === 0 ? 0.9 : 0.35 + h(i, 4) * 0.5) * R * 0.9
    const dark: [number, number, number] = [0.24 + h(i, 5) * 0.06, 0.22 + h(i, 5) * 0.05, 0.2]
    // a fat rough base, a narrower craggy top, and the guano-white cap on the tallest
    prism(out, x, z, -2, H * 0.55, r, 7, dark, rock, r * 0.75)
    prism(out, x + r * 0.12, z - r * 0.1, H * 0.55, H, r * 0.72, 6, dark, rock, r * 0.28)
    if (H > R * 0.4) prism(out, x + r * 0.12, z - r * 0.1, H - 0.4, H + 0.6, r * 0.3, 6, [0.82, 0.8, 0.74], rock, r * 0.1)
  }
}
