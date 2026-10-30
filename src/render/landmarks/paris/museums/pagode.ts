import type { MeshBuilder } from '../../../buildings.ts'
import { block, hex, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { sheet, type V3 } from './shapes.ts'
import { fitted } from '../palaces/common.ts'

/** the design footprint: OSM way 68739427's box (local −z faces bearing 349, the Rue de Babylone) */
const HX = 14.85
const HZ = 11.6

/**
 * La Pagode (Alexandre Marcel, 1896), a Japanese temple built in the Rue de Babylone by the director of the Bon Marché
 * as a present for his wife, and a cinema since 1931: the one building in Paris that looks like this, in a garden behind
 * a wall, its roofs up over the neighbours. From the street (local −z):
 *
 * - the two-tier roofs, deep green-grey tile swept out at the eaves and up at the corners, with the short third tier;
 * - the entrance porch with its curved gable, dark timber, carved panels in ochre and gold under the eaves;
 * - dark painted timber framing on the pale ochre walls below.
 *
 * Plan from OSM's way 68739427 (the main hall at the back, the porch on its thin wing). OSM has 1 level and no height.
 * The 15 m to the top and the tier count are from memory; no photograph came back from Mapillary (2026-10-30).
 */
export function pagode(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

/** A swept roof: from the eaves ring (flared and lifted at the corners) up to a narrower ring, curved like a temple's. */
function sweep(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, ix: number, iz: number, flare: number, lift: number, c: Rgb): void {
  const p = (t: number, v: number, side: 0 | 1 | 2 | 3): V3 => {
    // t along the side, v from eaves to top
    const ease = v * v
    const out0 = flare * (1 - v) * (1 - v)
    const cx0 = x0 - out0 + (ix + 0) * ease
    const cx1 = x1 + out0 - ix * ease
    const cz0 = z0 - out0 + iz * ease
    const cz1 = z1 + out0 - iz * ease
    const edge = Math.abs(t * 2 - 1)
    const y = y0 + (y1 - y0) * (v * 0.35 + ease * 0.65) + lift * Math.pow(edge, 4) * (1 - v) * (1 - v)
    switch (side) {
      case 0: return [cx0 + (cx1 - cx0) * t, y, cz0]
      case 1: return [cx1, y, cz0 + (cz1 - cz0) * t]
      case 2: return [cx1 - (cx1 - cx0) * t, y, cz1]
      default: return [cx0, y, cz1 - (cz1 - cz0) * t]
    }
  }
  for (const side of [0, 1, 2, 3] as const) sheet(out, (u, v) => p(u, v, side), 8, 4, (u, v) => shade(c, 0.9 + 0.12 * Math.floor(v * 4) / 4 + (Math.floor(u * 8) % 2) * 0.03), 0.04)
  // the ridge's flat, capping the top ring
  block(out, x0 + ix - 0.02, x1 - ix + 0.02, z0 + iz - 0.02, z1 - iz + 0.02, y1 - 0.06, y1 + 0.16, shade(c, 0.72))
}

function draw(out: MeshBuilder): void {
  const wall = hex('#d8bf8f')
  const timber = hex('#3a2a22')
  const tile = hex('#4f6a5c')
  const gold = hex('#b98f3a')
  const red = hex('#8a3a2b')
  const glass: Rgb = [0.15, 0.17, 0.18]
  // ---- the main hall, at the back of the plan, pale walls and dark frame
  const x0 = -14
  const x1 = 14.8
  const z0 = 2
  const z1 = 11.6
  block(out, x0, x1, z0, z1, 0, 7.4, wall)
  for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 8) {
    block(out, x - 0.16, x + 0.16, z0 - 0.08, z0 + 0.1, 0, 7.4, timber)
    block(out, x - 0.16, x + 0.16, z1 - 0.1, z1 + 0.08, 0, 7.4, timber)
  }
  for (const y of [0.9, 3.6, 7]) {
    block(out, x0 - 0.05, x1 + 0.05, z0 - 0.09, z1 + 0.09, y, y + 0.22, timber)
  }
  const stepX = (x1 - x0) / 8
  for (let i = 0; i < 8; i++) {
    const x = x0 + (i + 0.5) * stepX
    block(out, x - 1.1, x + 1.1, z0 - 0.11, z0, 4.3, 6.5, gold)
    block(out, x - 0.7, x + 0.7, z0 - 0.13, z0 - 0.1, 4.6, 6.2, red)
    block(out, x - 0.8, x + 0.8, z1, z1 + 0.11, 1.4, 3, glass)
  }
  // the two tiers and the third, shorter one
  sweep(out, x0, x1, z0, z1, 7.4, 11, 2.2, 2.2, 1.7, 0.9, tile)
  block(out, x0 + 3, x1 - 3, z0 + 2.4, z1 - 2.4, 10.7, 12.6, timber)
  sweep(out, x0 + 3.2, x1 - 3.2, z0 + 2.5, z1 - 2.5, 12.4, 15, 1.1, 1.3, 1.2, 0.7, shade(tile, 1.05))
  block(out, x0 + 5, x1 - 5, 6.6, 7, 15, 15.5, shade(tile, 0.7))
  // ---- the wing and its porch toward the street: the curved gable over the door
  const a = 4.8
  const b = 14.8
  const c = -7.2
  block(out, a, b, c, z0, 0, 6, wall)
  for (const x of [a, (a + b) / 2, b]) block(out, x - 0.16, x + 0.16, c - 0.08, c, 0, 6, timber)
  block(out, a - 0.05, b + 0.05, c - 0.09, z0, 5.7, 6, timber)
  sweep(out, a, b, c, z0, 6, 9.2, 2.4, 2.4, 1.3, 0.8, tile)
  block(out, 4.5, 8.6, -11.6, c, 0, 4.6, shade(wall, 0.95))
  block(out, 5.6, 7.5, -11.65, -11.6, 0.1, 3.5, timber)
  block(out, 4.4, 8.7, -11.7, -11.5, 3.6, 4, timber)
  sweep(out, 4.5, 8.6, -11.6, c, 4.6, 6.8, 1.4, 1.4, 1, 1.1, tile)
  // the carved panel under the porch's gable
  block(out, 5.4, 7.7, -11.74, -11.68, 4, 4.5, gold)
}
