/**
 * The American street's furniture (SF_PLAN.md §6; user: "it's America so it has stoplights, more signs, billboards
 * and ads"), placed where OSM maps it (PackedFurniture kinds `stop`, `busstop`, `billboard`, `postbox`). Shared: New
 * York, Chicago and San Francisco all have them; the colours that differ come in through the region.
 *
 * - **the stop sign**: the red octagon on its pole, turned to face the traffic it stops;
 * - **the bus stop**: the pole with its flag — in San Francisco Muni's yellow band round the pole and the orange-red
 *   sign; a shelter where the stop is a big one;
 * - **the billboard**: a big panel on its steel post and catwalk, the ad on it a composition of colour blocks and
 *   "type" that varies board to board — the rhythm of a billboard, which is all a rider reads at 20 km/h;
 * - **the post box**: the USPS blue box on its legs.
 *
 * Local frames: +z toward the street, the foot at the origin.
 */
import type { MeshBuilder } from './buildings.ts'
import { box, prism, strut, EMIT, FIXED, type Rgb } from './models.ts'

const STEEL: Rgb = [0.5, 0.52, 0.54]
const DARK: Rgb = [0.14, 0.14, 0.15]
const WHITE: Rgb = [0.94, 0.94, 0.92]

export function stopSign(out: MeshBuilder): void {
  box(out, 0, 1.2, 0, 0.035, 1.2, 0.035, STEEL, FIXED)
  // the octagon, a white border and the red face, on the side toward the traffic (+z)
  const oct = (r: number, z: number, c: Rgb): void => {
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2 + Math.PI / 8
      const a1 = ((i + 1) / 8) * Math.PI * 2 + Math.PI / 8
      out.quad([[0, 2.25, z], [Math.cos(a0) * r, 2.25 + Math.sin(a0) * r, z], [Math.cos(a1) * r, 2.25 + Math.sin(a1) * r, z], [0, 2.25, z]],
        [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
    }
  }
  oct(0.4, 0.05, WHITE)
  oct(0.36, 0.055, [0.78, 0.1, 0.1])
  // "STOP": a white bar of letters
  box(out, 0, 2.25, 0.06, 0.24, 0.07, 0.005, WHITE, FIXED)
  oct(0.4, 0.035, [0.6, 0.6, 0.62])        // the back
}

/** San Francisco's Muni stop: the yellow band round the pole, the sign flag at the top. */
export function muniStop(out: MeshBuilder): void {
  box(out, 0, 1.5, 0, 0.04, 1.5, 0.04, STEEL, FIXED)
  box(out, 0, 1.9, 0, 0.05, 0.25, 0.05, [0.95, 0.78, 0.1], FIXED)        // the yellow band
  box(out, 0.28, 2.8, 0, 0.26, 0.18, 0.02, [0.86, 0.3, 0.14], FIXED)     // the flag: Muni's orange-red
  box(out, 0.28, 2.8, 0.021, 0.18, 0.05, 0.002, WHITE, FIXED)
}

/** A plain bus stop: the pole and its flag, the city's own colours left to the flag. */
export function plainStop(out: MeshBuilder): void {
  box(out, 0, 1.5, 0, 0.04, 1.5, 0.04, STEEL, FIXED)
  box(out, 0.26, 2.75, 0, 0.24, 0.2, 0.02, [0.2, 0.4, 0.7], FIXED)
  box(out, 0.26, 2.75, 0.021, 0.16, 0.05, 0.002, WHITE, FIXED)
}

/** A glass bus shelter: its roof, the back and end panels, the bench, the lit ad panel at one end. */
export function busShelter(out: MeshBuilder, seed = 0): void {
  const glass: Rgb = [0.55, 0.64, 0.68]
  box(out, 0, 2.5, 0, 1.9, 0.05, 0.8, DARK, FIXED)
  for (const x of [-1.85, 1.85]) box(out, x, 1.25, -0.75, 0.04, 1.25, 0.04, DARK, FIXED)
  box(out, 0, 1.3, -0.78, 1.8, 0.95, 0.02, glass, FIXED)
  box(out, -1.85, 1.3, -0.1, 0.02, 0.95, 0.65, glass, FIXED)
  box(out, 0, 0.45, -0.55, 1.4, 0.04, 0.18, STEEL, FIXED)
  // the ad panel at the open end, lit from inside
  box(out, 1.85, 1.3, -0.1, 0.06, 0.95, 0.6, DARK, FIXED)
  adFace(out, [1.92, 1.3, -0.1], 0.58, 0.9, 'x', seed)
}

/** An ad, painted as blocks: a background, a photo block, a headline, a line of small type, a logo. */
function adFace(out: MeshBuilder, c: [number, number, number], hw: number, hh: number, axis: 'x' | 'z', seed: number): void {
  const r = (k: number): number => ((Math.imul(seed ^ (k * 0x9e3779b1), 0x85ebca6b) >>> 0) % 1000) / 1000
  const palettes: Rgb[][] = [
    [[0.96, 0.84, 0.2], [0.1, 0.1, 0.12], [0.9, 0.2, 0.2]],
    [[0.12, 0.36, 0.72], [0.96, 0.96, 0.94], [0.95, 0.72, 0.2]],
    [[0.92, 0.92, 0.9], [0.8, 0.1, 0.14], [0.14, 0.14, 0.16]],
    [[0.1, 0.12, 0.14], [0.96, 0.96, 0.94], [0.3, 0.8, 0.5]],
    [[0.88, 0.3, 0.5], [0.98, 0.94, 0.9], [0.2, 0.2, 0.3]],
    [[0.2, 0.6, 0.64], [0.98, 0.98, 0.96], [0.98, 0.5, 0.2]],
  ]
  const [bg, ink, accent] = palettes[Math.floor(r(1) * palettes.length)]
  const face = (u: number, v: number, w: number, h: number, col: Rgb, lift: number, glow = false): void => {
    const [x, y, z] = c
    if (axis === 'z') box(out, x + u, y + v, z + lift, w, h, 0.002, col, glow ? EMIT : FIXED)
    else box(out, x + lift, y + v, z + u, 0.002, h, w, col, glow ? EMIT : FIXED)
  }
  face(0, 0, hw, hh, bg, 0, true)
  const photoLeft = r(2) < 0.5
  face((photoLeft ? -1 : 1) * hw * 0.45, 0, hw * 0.5, hh * 0.9, accent, 0.004, true)
  face((photoLeft ? 1 : -1) * hw * 0.42, hh * 0.35, hw * 0.4, hh * 0.14, ink, 0.004)
  face((photoLeft ? 1 : -1) * hw * 0.42, hh * 0.05, hw * 0.36, hh * 0.06, ink, 0.004)
  face((photoLeft ? 1 : -1) * hw * 0.42, -hh * 0.12, hw * 0.3, hh * 0.05, ink, 0.004)
  face((photoLeft ? 1 : -1) * hw * 0.6, -hh * 0.62, hw * 0.16, hh * 0.16, accent, 0.004)
}

/** A billboard: 14.6 × 4.3 m (the "bulletin"), on a steel post, with its catwalk and the lamps along it. */
export function billboard(out: MeshBuilder, seed = 0): void {
  const top = 11
  const hw = 7.3
  const hh = 2.15
  strut(out, [0, 0, -0.6], [0, top - hh, -0.6], 0.9, 0.9, STEEL, FIXED)
  box(out, 0, top, -0.35, hw + 0.2, hh + 0.2, 0.2, DARK, FIXED)                 // the frame
  adFace(out, [0, top, -0.13], hw, hh, 'z', seed)
  box(out, 0, top - hh - 0.35, 0.3, hw, 0.05, 0.5, STEEL, FIXED)                // the catwalk
  for (let x = -hw + 1; x < hw; x += 3.2) {
    strut(out, [x, top - hh - 0.3, 0.5], [x, top - hh - 0.1, 1.2], 0.06, 0.06, STEEL, FIXED)
    box(out, x, top - hh - 0.05, 1.25, 0.2, 0.06, 0.12, [1, 0.96, 0.85], EMIT)
  }
  // the back, plain steel
  box(out, 0, top, -0.56, hw, hh, 0.02, [0.42, 0.44, 0.46], FIXED)
}

/** The USPS collection box: the blue box on its four legs, the rounded top, the pull-down slot. */
export function uspsBox(out: MeshBuilder): void {
  const blue: Rgb = [0.12, 0.24, 0.52]
  for (const [x, z] of [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]]) box(out, x, 0.12, z, 0.03, 0.12, 0.03, blue, FIXED)
  box(out, 0, 0.72, 0, 0.3, 0.48, 0.26, blue, FIXED)
  prism(out, 0, 0, 1.2, 1.36, 0.3, 10, blue, FIXED, 0.22)
  box(out, 0, 1.0, 0.27, 0.18, 0.04, 0.01, [0.72, 0.72, 0.7], FIXED)
  box(out, 0, 0.6, 0.265, 0.12, 0.08, 0.005, WHITE, FIXED)                        // the eagle
}
