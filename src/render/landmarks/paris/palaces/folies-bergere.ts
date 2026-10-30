import type { MeshBuilder } from '../../../buildings.ts'
import { strut, type Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, extrude, fitted, palette, pts, rectOn } from './common.ts'
import { EMIT, lettersOn, litOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM way 69220738's box, square to the meridian (local −z faces south, the Rue Richer) */
const HX = 14.75
const HZ = 43.35
const WALL = hex('#e2dfd2')
const GREY = hex('#9b9c90')
const GOLD = hex('#c9a24a')
const GOLD_D = hex('#94752e')
const GOLD_L = hex('#e8cf85')
const NEON = hex('#d42a22')

const PLAN = pts([-14.7, -43.2, 9.4, -43.3, 14.8, 41, -10.9, 43.3])

/**
 * The Folies Bergère (1869; the front by Maurice Pico, 1926–29), 32 Rue Richer: the Art Deco front in the narrow street. A flat
 * pale wall with almost nothing on it but one huge gilded thing. A rider sees:
 *
 * - in the middle, Pico's GILDED RELIEF of the dancer in her swirling drapery, deep in its stepped frame between the fluted
 *   grey bands, on its shelf with the small green windows and the red neon under it;
 * - FOLIES BERGERE across the top of the wall in thin stretched letters, and again on the frame on the roof behind;
 * - two small round-headed NICHES either side with their own gilt figures, and small windows beneath them;
 * - at the foot the long fringed gold CANOPY with its row of bulbs, the lit bill on its edge, the red doors below.
 *
 * Footprint is OSM's (way 69220738, untagged beyond building=yes; placed from the street number and the photographs: there is
 * no OSM name on it). Heights off photographs from the street, 2011–2023, scaled on the doors: canopy 4.2–5.2 m, wall 19.5 m.
 * The relief is not Pico's drawing but its rhythm: a leaning body and bands of gold wheeling round it. The hall behind is a
 * plain mass I could not see from the street.
 */
export function foliesBergere(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e2dfd2', '#6e7276')
  extrude(out, [PLAN], p, { eaves: 19.5, bay: 9, storeys: [], rise: 1, inset: 0.6, dormers: false })
  const z = -43.6
  const cx = -2.65
  const X0 = -14.7
  const X1 = 9.4
  block(out, X0, X1, z, -42, 0, 19.5, WALL)
  // the stepped cornice
  block(out, X0 - 0.2, X1 + 0.2, z - 0.4, -42, 18.9, 19.5, shade(WALL, 1.03))
  block(out, X0 - 0.45, X1 + 0.45, z - 0.65, -42, 19.5, 19.8, shade(WALL, 1.05))
  // the name at the head of the wall
  lettersOn(out, '-z', z, cx, 16.9, 'FOLIES  BERGERE', { h: 1.25, c: hex('#3b372d'), wide: 0.92, th: 0.13, gap: 0.26, d: 0.04 })
  // ---- the fluted bands and the stepped frame, the relief in it
  const rx = 4.4
  const ry0 = 8.4
  const ry1 = 15.4
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const a = cx + s * (rx + 1.1 + k * 0.92)
      rectOn(out, '-z', z, a - 0.28, a + 0.28, 6.2, 16.4, GREY, 0.05)
      block(out, a - 0.05, a + 0.05, z - 0.14, z, 6.2, 16.4, shade(GREY, 1.25))
    }
  }
  rectOn(out, '-z', z, cx - rx - 0.9, cx + rx + 0.9, ry0 - 0.9, ry1 + 0.9, shade(WALL, 0.88), 0.03)
  rectOn(out, '-z', z, cx - rx - 0.45, cx + rx + 0.45, ry0 - 0.45, ry1 + 0.45, shade(GREY, 0.9), 0.05)
  relief(out, z, cx - rx, cx + rx, ry0, ry1)
  // the shelf under it, the small green windows, the neon
  block(out, cx - rx - 1.6, cx + rx + 1.6, z - 0.7, z, 7.1, 7.5, shade(WALL, 1.04))
  rectOn(out, '-z', z, cx - rx - 1.2, cx + rx + 1.2, 5.6, 7.1, hex('#59644f'), 0.05)
  for (const x of [-3, -1, 1, 3]) rectOn(out, '-z', z, cx + x - 0.08, cx + x + 0.08, 5.6, 7.1, shade(WALL, 0.9), 0.07)
  lettersOn(out, '-z', z - 0.7, cx, 7.55, 'FOLIES BERGERE', { h: 0.48, c: NEON, wide: 0.72, th: 0.08, gap: 0.09, tag: EMIT, d: 0.02 })
  lettersOn(out, '-z', z, cx, 5.28, 'LE PLUS CELEBRE MUSIC-HALL DU MONDE', { h: 0.3, c: NEON, wide: 0.62, th: 0.055, gap: 0.05, tag: EMIT, d: 0.08 })
  // ---- the two niches, a pale gilt figure in each, the little window under
  for (const s of [-1, 1]) {
    const x = cx + s * 9.6
    archOn(out, '-z', z, x, 7.2, 3, 7, shade(WALL, 0.84), 0.03)
    archOn(out, '-z', z, x, 7.3, 2.4, 6.7, shade(WALL, 0.97), 0.05)
    archOn(out, '-z', z, x, 8.6, 1.6, 5, GOLD, 0.07)
    for (let t = 0; t < 5; t++) rectOn(out, '-z', z, x - 0.72 + t * 0.09, x + 0.72 - t * 0.09, 9 + t * 0.85, 9.25 + t * 0.85, t % 2 ? GOLD_L : GOLD_D, 0.08)
    rectOn(out, '-z', z, x - 0.7, x + 0.7, 7.3, 8.3, p.glass, 0.07)
  }
  // ---- the canopy: its dark soffit, the gold fringe, the bulbs and the lit bill
  const cz = z - 2.6
  block(out, X0, X1, cz, z, 4.25, 4.45, shade(p.dark, 1.3))
  rectOn(out, '-z', cz, X0, X1, 4.45, 4.95, shade(GOLD, 0.85), 0.01)
  for (let x = X0 + 0.2; x < X1; x += 0.4) rectOn(out, '-z', cz, x - 0.09, x + 0.09, 4.45, 4.95, GOLD_L, 0.03)
  out.quad([[X0, 4.95, cz], [X1, 4.95, cz], [X1, 5.2, z], [X0, 5.2, z]], [0, 0.99, -0.1], [[0, 0], [1, 0], [1, 1], [0, 1]], GOLD, FIXED)
  litOn(out, '-z', cz, X0 + 0.1, X1 - 0.1, 4.05, 4.25, hex('#fff3cf'), 0.03)
  litOn(out, '-z', cz, cx - 6, cx + 6, 3.45, 4.05, hex('#f6f2e5'), 0.03)
  lettersOn(out, '-z', cz, cx, 3.55, 'FOLIES BERGERE', { h: 0.4, c: NEON, wide: 0.7, th: 0.07, gap: 0.09, d: 0.05 })
  // ---- the street: nine sets of red doors between bronze posts
  rectOn(out, '-z', z, X0 + 0.2, X1 - 0.2, 0, 3.4, shade(p.dark, 1.2), 0.04)
  const n = 9
  const W = (X1 - X0 - 6) / n
  for (let i = 0; i < n; i++) {
    const x = X0 + 3 + W * (i + 0.5)
    rectOn(out, '-z', z, x - W * 0.42, x + W * 0.42, 0, 3.2, hex('#a4222a'), 0.06)
    rectOn(out, '-z', z, x - W * 0.26, x + W * 0.26, 1.1, 2.9, hex('#3a2a28'), 0.08)
    rectOn(out, '-z', z, x - 0.02, x + 0.02, 0, 3.2, p.dark, 0.09)
  }
  for (const x of [X0 + 1.5, X1 - 1.5]) rectOn(out, '-z', z, x - 1, x + 1, 0.3, 3.2, hex('#2e3f62'), 0.06)
  // ---- the frame on the roof: the name again, against the sky, standing back from the wall
  const rz = -36
  for (let x = cx - 8; x <= cx + 8; x += 4) strut(out, [x, 19.6, rz], [x, 22.2, rz], 0.07, 0.07, p.dark, FIXED, false)
  strut(out, [cx - 8.5, 20.1, rz], [cx + 8.5, 20.1, rz], 0.07, 0.07, p.dark, FIXED, false)
  lettersOn(out, '-z', rz, cx, 20.25, 'FOLIES BERGERE', { h: 1.7, c: hex('#ded9cc'), wide: 0.64, th: 0.22, gap: 0.22, tag: EMIT, d: 0.06, both: true })
}

/** The relief, on z, in its rectangle: a dark gold ground, the wheeling bands, the dancer's leaning body and flung arm. */
function relief(out: MeshBuilder, z: number, x0: number, x1: number, y0: number, y1: number): void {
  rectOn(out, '-z', z, x0, x1, y0, y1, GOLD_D, 0.07)
  const W = x1 - x0
  const H = y1 - y0
  const P = (u: number, v: number, d = 0.1): [number, number, number] => [x0 + u * W, y0 + v * H, z - d]
  const N: [number, number, number] = [0, 0, -1]
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  // a band wheeling round (cu, cv), from angle a to b, radius r, width w
  const wheel = (cu: number, cv: number, r: number, w: number, a: number, b: number, c: Rgb): void => {
    const m = 9
    for (let i = 0; i < m; i++) {
      const t0 = a + ((b - a) * i) / m
      const t1 = a + ((b - a) * (i + 1)) / m
      const aspect = H / W
      const A = (rr: number, t: number): [number, number, number] => {
        const u = Math.max(0, Math.min(1, cu + (Math.cos(t) * rr) * aspect))
        const v = Math.max(0, Math.min(1, cv + Math.sin(t) * rr))
        return P(u, v)
      }
      out.quad([A(r - w, t0), A(r - w, t1), A(r, t1), A(r, t0)], N, UV, c, FIXED)
    }
  }
  // the drapery: great arcs from the lower left and the upper right
  for (let k = 0; k < 4; k++) {
    wheel(0.12, 0.08, 0.34 + k * 0.17, 0.075, -0.1, 1.65, k % 2 ? GOLD : GOLD_L)
    wheel(0.92, 0.9, 0.28 + k * 0.15, 0.065, 3.3, 4.75, k % 2 ? GOLD_L : GOLD)
  }
  wheel(0.2, 0.92, 0.3, 0.08, 4.5, 6, GOLD_L)
  wheel(0.82, 0.14, 0.28, 0.08, 1.4, 3.1, GOLD)
  // the body: leaning from the lower right to the head at the upper left, pale
  const pale = hex('#f0dfa8')
  out.quad([P(0.6, 0.06, 0.14), P(0.76, 0.2, 0.14), P(0.5, 0.74, 0.14), P(0.38, 0.62, 0.14)], N, UV, pale, FIXED)
  out.quad([P(0.38, 0.62, 0.14), P(0.5, 0.74, 0.14), P(0.46, 0.84, 0.14), P(0.33, 0.78, 0.14)], N, UV, pale, FIXED)
  out.quad([P(0.33, 0.78, 0.14), P(0.46, 0.84, 0.14), P(0.42, 0.95, 0.14), P(0.3, 0.9, 0.14)], N, UV, GOLD_L, FIXED)
  out.quad([P(0.42, 0.68, 0.17), P(0.47, 0.72, 0.17), P(0.16, 0.92, 0.17), P(0.12, 0.88, 0.17)], N, UV, pale, FIXED)
  out.quad([P(0.5, 0.56, 0.17), P(0.55, 0.62, 0.17), P(0.88, 0.5, 0.17), P(0.86, 0.44, 0.17)], N, UV, pale, FIXED)
}
