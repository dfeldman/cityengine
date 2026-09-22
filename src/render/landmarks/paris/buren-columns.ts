import type { MeshBuilder } from '../../buildings.ts'
import type { Rgb } from '../../models.ts'

const FIXED = 0
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * Les Deux Plateaux — Daniel Buren's columns (1986) in the Cour d'Honneur of the Palais-Royal (PARIS_EXPAND
 * §5 A): some 260 octagonal columns in black and white vertical stripes, on a grid across the court, their
 * heights stepping from ankle-high stumps to a little over three metres, and the channel of water under the
 * court glimpsed through grilles. Each column is eight facets, alternately black and white — which is exactly
 * what the stripes are.
 *
 * Local frame: centred on the court, the grid along x and z.
 */
export function burenColumns(out: MeshBuilder): void {
  const white: Rgb = [0.92, 0.92, 0.9]
  const black: Rgb = [0.1, 0.1, 0.11]
  const r = 0.35
  const nx = 19
  const nz = 14
  const step = 3.15
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const x = (i - (nx - 1) / 2) * step
      const z = (j - (nz - 1) / 2) * step
      // the heights rise in steps across the court, from stumps on one side to the tallest by the gallery
      const h = 0.1 + Math.max(0, Math.min(3.2, ((i + j * 0.6) / (nx + nz * 0.6)) * 4.2 + ((i * 7 + j * 3) % 5) * 0.12 - 0.5))
      for (let k = 0; k < 8; k++) {
        const a0 = (k / 8) * Math.PI * 2
        const a1 = ((k + 1) / 8) * Math.PI * 2
        const am = (a0 + a1) / 2
        const p0: [number, number, number] = [x + Math.sin(a0) * r, 0, z + Math.cos(a0) * r]
        const p1: [number, number, number] = [x + Math.sin(a1) * r, 0, z + Math.cos(a1) * r]
        out.quad([p0, p1, [p1[0], h, p1[2]], [p0[0], h, p0[2]]], [Math.sin(am), 0, Math.cos(am)], UVQ, k % 2 ? black : white, FIXED)
      }
      // the top, white
      for (let k = 0; k < 8; k += 2) {
        const pt = (q: number): [number, number, number] => { const a = (q / 8) * Math.PI * 2; return [x + Math.sin(a) * r, h, z + Math.cos(a) * r] }
        out.quad([pt(k), pt(k + 1), pt(k + 2), [x, h, z]], [0, 1, 0], UVQ, white, FIXED)
      }
    }
  }
}
