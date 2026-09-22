import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam, block } from '../kit.ts'

const FIXED = 0

/**
 * The Colonne Vendôme (1810), in the middle of the Place Vendôme (PARIS_EXPAND §5 A): a Trajan's column in
 * bronze — the guns of Austerlitz — 44 m high. The gist: the square pedestal with its reliefs and an eagle at
 * each corner; the shaft with the spiral frieze winding up it; the capital, the railed gallery, the domed
 * lantern and Napoleon as Caesar on top. All dark bronze, which is what it is.
 *
 * Local frame: centred on the column; its reliefs face ±x and ±z.
 */
export function colonneVendome(out: MeshBuilder): void {
  const bronze: Rgb = [0.3, 0.28, 0.22]
  const light: Rgb = [0.4, 0.37, 0.29]
  const dark: Rgb = [0.22, 0.2, 0.16]
  const stone: Rgb = [0.72, 0.69, 0.62]
  // the steps and the pedestal: plinth, the relief-panelled die, the cornice, the eagles on the corners
  block(out, -4.6, 4.6, -4.6, 4.6, 0, 0.5, stone)
  block(out, -4.1, 4.1, -4.1, 4.1, 0.5, 1.2, bronze)
  block(out, -3.6, 3.6, -3.6, 3.6, 1.2, 6.2, bronze)
  for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    // the relief panel on each face, a little proud, lighter where the light catches the figures
    box(out, nx * 3.62, 3.7, nz * 3.62, nz ? 2.7 : 0.03, 2.0, nx ? 2.7 : 0.03, light, FIXED)
  }
  block(out, -3.9, 3.9, -3.9, 3.9, 6.2, 6.8, dark)
  for (const [x, z] of [[-3.4, -3.4], [3.4, -3.4], [-3.4, 3.4], [3.4, 3.4]]) {
    box(out, x, 7.2, z, 0.35, 0.4, 0.35, bronze, FIXED)
    box(out, x, 7.4, z, 0.7, 0.12, 0.25, bronze, FIXED)                                   // the spread wings
  }
  // the shaft, a little tapered, with its base mouldings
  prism(out, 0, 0, 6.8, 7.8, 2.2, 16, dark, FIXED, 2.0)
  prism(out, 0, 0, 7.8, 38.5, 1.8, 16, bronze, FIXED, 1.6)
  // the spiral frieze: a raised band winding up the shaft 22 times
  const turns = 22
  const steps = turns * 16
  // a continuous thin fillet along the helix (short flat boxes read as a stack of rings)
  let prev: [number, number, number] | null = null
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = t * turns * Math.PI * 2
    const y = 8.2 + t * 29.8
    const r = 1.8 - 0.2 * ((y - 7.8) / 30.7) + 0.05
    const p: [number, number, number] = [Math.sin(a) * r, y, Math.cos(a) * r]
    if (prev) beam(out, prev, p, 0.09, light)
    prev = p
  }
  // the capital, the gallery with its railing, the lantern, and Napoleon
  block(out, -2.3, 2.3, -2.3, 2.3, 38.5, 39.4, dark)
  block(out, -2.05, 2.05, -2.05, 2.05, 39.4, 39.6, bronze)
  for (const [x0, x1, z0, z1] of [[-2, 2, -2.02, -1.98], [-2, 2, 1.98, 2.02], [-2.02, -1.98, -2, 2], [1.98, 2.02, -2, 2]]) block(out, x0, x1, z0, z1, 39.6, 40.5, dark)
  prism(out, 0, 0, 39.6, 41.6, 1.1, 12, bronze, FIXED, 0.95)
  prism(out, 0, 0, 41.6, 42.3, 0.95, 12, bronze, FIXED, 0.4)
  // Napoleon as Caesar: the robed figure, the arm with the globe raised
  prism(out, 0, 0, 42.3, 43.7, 0.34, 8, bronze, FIXED, 0.24)
  prism(out, 0, 0, 43.7, 44.1, 0.14, 8, bronze, FIXED, 0.13)
  box(out, 0.3, 43.9, 0, 0.07, 0.3, 0.07, bronze, FIXED)
  box(out, 0.33, 44.25, 0, 0.1, 0.1, 0.1, bronze, FIXED)
}
