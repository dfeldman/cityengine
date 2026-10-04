/**
 * THE MISSION'S MURAL ALLEYS (2026-10-04, icons audit): Balmy Alley (24th–25th, murals since 1972) and Clarion Alley
 * (17th–18th, the Clarion Alley Mural Project since 1992) — narrow alleys whose every garage door, fence and wall is
 * painted, floor to roofline, in bright murals. Not modelled before: the alleys were plain. A standalone model laid
 * along the alley (`size` = [length, width between the walls], `front` turning its length along the alley): a run of
 * painted panels on each side, garage-door and fence sized, each a field of colour with bold shapes on it — the
 * painting itself can't be drawn, its density and colour can.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'

const FIELDS: Rgb[] = [[0.2, 0.45, 0.8], [0.9, 0.35, 0.2], [0.95, 0.8, 0.2], [0.2, 0.6, 0.4], [0.6, 0.25, 0.6], [0.95, 0.55, 0.65], [0.15, 0.2, 0.35], [0.3, 0.7, 0.8]]
const hash = (a: number, b: number): number => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s) }

function muralAlley(out: MeshBuilder, fit: Fit): void {
  // along whichever axis is the longer: the entry's `size` is in the world's axes (front 0), as the audit reads it
  const along = fit.hx >= fit.hz
  const L = along ? fit.hx : fit.hz, W = along ? fit.hz : fit.hx
  const B = (x: number, y: number, z: number, hx: number, hy: number, hz: number, c: Rgb): void =>
    along ? box(out, x, y, z, hx, hy, hz, c, 0) : box(out, z, y, x, hz, hy, hx, c, 0)
  for (const side of [-1, 1]) {
    let u = -L
    let k = 0
    while (u < L - 1) {
      const w = 2.5 + hash(k, side) * 3.5
      const h = 2.6 + hash(k, side + 7) * 3.5
      const c = FIELDS[Math.floor(hash(k, side + 3) * FIELDS.length)]
      const z = side * (W + 0.06)
      // the painted door or fence
      B(u + w / 2, h / 2, z, w / 2 - 0.05, h / 2, 0.05, c)
      // bold shapes on it: discs of colour, a band, a figure's block
      for (let j = 0; j < 4; j++) {
        const sc = FIELDS[Math.floor(hash(k * 7 + j, side + 11) * FIELDS.length)]
        const sw = 0.4 + hash(k, j + 20) * (w * 0.4), sh = 0.4 + hash(k, j + 30) * (h * 0.4)
        const sx = u + 0.3 + hash(k, j + 40) * (w - 0.6 - sw) + sw / 2
        const sy = 0.3 + hash(k, j + 50) * (h - 0.6 - sh) + sh / 2
        B(sx, sy, z - side * 0.06, sw / 2, sh / 2, 0.02, sc)
      }
      u += w + 0.15
      k++
    }
  }
}

export const balmyAlley = muralAlley
export const clarionAlley = (out: MeshBuilder, fit: Fit): void => muralAlley(out, fit)

export const MURAL_ALLEYS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { balmyAlley, clarionAlley }
