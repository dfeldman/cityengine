/**
 * THE SEA LIONS AT PIER 39 (since 1990): the floating docks in the marina on the pier's west side, given over to
 * California sea lions — dozens of them hauled out in brown heaps, a few upright, the rest sprawled. Seen from the
 * pier's west walkway, which a rider passes on the Embarcadero's end. Placed at the sea's level (`deckAbove: 0`).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'

const FLOAT: Rgb = [0.36, 0.35, 0.33]
const FLOAT_SIDE: Rgb = [0.3, 0.29, 0.27]
const COATS: Rgb[] = [[0.38, 0.28, 0.2], [0.3, 0.22, 0.16], [0.46, 0.35, 0.24], [0.24, 0.18, 0.14]]

const hash = (i: number, k: number): number => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s) }

/** one sea lion along `a` (radians about y), lying (or, sometimes, propped up on its flippers) */
function seaLion(out: MeshBuilder, x: number, y: number, z: number, a: number, i: number): void {
  const c = COATS[Math.floor(hash(i, 3) * COATS.length)]
  const ca = Math.cos(a), sa = Math.sin(a)
  const at = (u: number): [number, number] => [x + sa * u, z + ca * u]
  const up = hash(i, 7) < 0.2
  const L = 0.85 + hash(i, 11) * 0.35
  // body in three tapering pieces, the head at +u
  const parts: [number, number, number][] = [[-L * 0.9, 0.18, 0.2], [-L * 0.2, 0.26, 0.3], [L * 0.45, 0.22, 0.24]]
  for (const [u, hy, hw] of parts) {
    const [px, pz] = at(u)
    box(out, px, y + hy, pz, Math.abs(ca) * hw + Math.abs(sa) * 0.36, hy, Math.abs(sa) * hw + Math.abs(ca) * 0.36, c, 0)
  }
  const [hx, hz] = at(L * 0.95)
  box(out, hx, y + (up ? 0.85 : 0.3), hz, 0.14, 0.14, 0.14, c, 0)
  if (up) { const [nx, nz] = at(L * 0.8); box(out, nx, y + 0.55, nz, 0.17, 0.3, 0.17, c, 0) }
}

export function seaLionFloats(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(12, fit.hx)
  const hz = Math.max(10, fit.hz)
  // the floats: rows of low pontoons with gaps of water between
  let n = 0
  for (let row = 0; row < 3; row++) {
    const z = -hz + (row + 0.5) * (2 * hz / 3)
    for (let k = 0; k < 4; k++) {
      const x = -hx + (k + 0.5) * (2 * hx / 4)
      const w = (2 * hx / 4) * 0.42, d = (2 * hz / 3) * 0.32
      box(out, x, 0.2, z, w, 0.2, d, FLOAT, 0)
      box(out, x, 0.05, z, w + 0.05, 0.12, d + 0.05, FLOAT_SIDE, 0)
      // as many as will fit, heaped
      const m = 4 + Math.floor(hash(row * 4 + k, 1) * 5)
      for (let j = 0; j < m; j++, n++) {
        seaLion(out, x + (hash(n, 2) * 2 - 1) * (w - 0.6), 0.4, z + (hash(n, 5) * 2 - 1) * (d - 0.6), hash(n, 9) * Math.PI * 2, n)
      }
    }
  }
}

export const SEA_LIONS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { seaLionFloats }
