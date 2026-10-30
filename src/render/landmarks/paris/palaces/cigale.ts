import type { MeshBuilder } from '../../../buildings.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts, rectOn } from './common.ts'
import { discFront, EMIT, lettersOn, litOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM way 77807777's box turned to the boulevard (local −z faces bearing 162.5, the Boulevard de Rochechouart) */
const HX = 21.05
const HZ = 22.6
const WHITE = hex('#e9e8e2')
const NEON = hex('#d6301f')
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const PLAN = pts([-21.1, 3.1, -14.8, -3.4, -16.5, -13.5, 10.2, -13.5, 12.3, -9.3, 21, 13.6, -3.8, 22.5, -5.5, 17.8])

/**
 * La Cigale, 120 Boulevard de Rochechouart: the old café-concert refaced by Philippe Starck in 1987 as a blank white wall with a
 * wave along its top. Nothing on the boulevard looks like it. A rider sees:
 *
 * - the WHITE WALL, its head a soft wave against the sky, a row of round portholes wandering up and down across it;
 * - the tall red BANNER hanging from a mast near its left end, the name down it;
 * - the white tile of the street storey, its dark doors, LA CIGALE in lit letters on a little gable over the entrance;
 * - to the right, the house's own white tower: three bowed windows stacked up, the glazed loggia at the top.
 *
 * Plan is OSM's (way 77807777). Heights off photographs from the boulevard (Commons, 2011-): tile to 3.6 m, wave 12–15.5,
 * tower 22 to the loggia at 25.
 */
export function cigale(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

/** The wave along the wall's head at x. */
const wave = (x: number): number => {
  // a hump at the left end, a valley in the middle, rising to the tower
  const t = (x + 19.3) / 20.3
  const hump = 15.4 - 3.4 * Math.pow(Math.min(1, Math.abs(t - 0.2) / 0.42), 2)
  const rise = t > 0.62 ? (t - 0.62) * 9 : 0
  const left = t < 0.2 ? -6 * (0.2 - t) * (0.2 - t) * 25 : 0
  return hump + rise * rise * 0.35 + rise * 0.25 + left
}

function draw(out: MeshBuilder): void {
  const p = palette('#e9e8e2', '#6c7276')
  extrude(out, [PLAN], p, { eaves: 11.5, bay: 9, storeys: [], rise: 1, inset: 0.7, dormers: false })
  const z = -22
  const X0 = -19.3
  const X1 = 1
  // ---- the wave: the wall a strip of quads, its head following the curve, thick enough to have a top
  const m = 22
  for (let i = 0; i < m; i++) {
    const a = X0 + ((X1 - X0) * i) / m
    const b = X0 + ((X1 - X0) * (i + 1)) / m
    out.quad([[a, 0, z], [b, 0, z], [b, wave(b), z], [a, wave(a), z]], [0, 0, -1], UV, WHITE, FIXED)
    out.quad([[a, wave(a), z], [b, wave(b), z], [b, wave(b) - 0.5, z + 8], [a, wave(a) - 0.5, z + 8]], [0, 1, 0], UV, shade(WHITE, 0.94), FIXED)
    out.quad([[a, 0, z + 8], [b, 0, z + 8], [b, wave(b) - 0.5, z + 8], [a, wave(a) - 0.5, z + 8]], [0, 0, 1], UV, shade(WHITE, 0.9), FIXED)
    // the thin lip
    out.quad([[a, wave(a), z - 0.08], [b, wave(b), z - 0.08], [b, wave(b) - 0.22, z - 0.08], [a, wave(a) - 0.22, z - 0.08]], [0, 0, -1], UV, shade(WHITE, 1.04), FIXED)
  }
  // the end wall on the left, up to the wave
  out.quad([[X0, 0, z], [X0, wave(X0), z], [X0, wave(X0) - 0.5, z + 8], [X0, 0, z + 8]], [-1, 0, 0], UV, shade(WHITE, 0.9), FIXED)
  // the portholes, wandering
  for (const [x, y] of [[-16.9, 10.1], [-13.8, 9.3], [-10.7, 9], [-7.7, 8.5], [-4.8, 8.9], [-2.2, 9.5], [-0.4, 11.2]] as const) {
    discFront(out, x, y, z - 0.03, 0.62, shade(WHITE, 0.72))
    discFront(out, x, y, z - 0.05, 0.5, hex('#3f4247'))
  }
  // ---- the tiles of the street storey, its doors, the entrance's lit gable
  rectOn(out, '-z', z, X0, X1 + 8, 0, 3.6, shade(WHITE, 0.98), 0.03)
  for (let x = X0 + 0.5; x < X1 + 8; x += 0.5) rectOn(out, '-z', z, x - 0.012, x + 0.012, 0, 3.6, shade(WHITE, 0.8), 0.04)
  for (let y = 0.5; y < 3.6; y += 0.5) rectOn(out, '-z', z, X0, X1 + 8, y - 0.012, y + 0.012, shade(WHITE, 0.8), 0.04)
  for (const [a, b] of [[-18, -16.2], [-13.5, -11.7], [-4.6, -2.8], [-1.6, 0.2]] as const) rectOn(out, '-z', z, a, b, 0, 2.6, hex('#55524e'), 0.06)
  rectOn(out, '-z', z, -10, -5.8, 0, 2.8, hex('#26292c'), 0.06)
  litOn(out, '-z', z, -9.6, -6.2, 0.2, 2.5, hex('#a68c5e'), 0.07)
  for (const x of [-8.7, -7.9, -7.1]) rectOn(out, '-z', z, x - 0.03, x + 0.03, 0.2, 2.5, hex('#26292c'), 0.08)
  out.quad([[-10.2, 3, z - 0.4], [-5.6, 3, z - 0.4], [-7.9, 3.8, z - 0.4], [-7.9, 3.8, z - 0.4]], [0, 0, -1], UV, shade(WHITE, 1.03), FIXED)
  block(out, -10.2, -5.6, z - 0.4, z, 2.9, 3, hex('#40403f'))
  lettersOn(out, '-z', z, -7.9, 3.25, 'LA CIGALE', { h: 0.72, c: NEON, wide: 0.72, th: 0.13, gap: 0.14, tag: EMIT, d: 0.5 })
  // ---- the banner on its mast
  const bx = -13.9
  block(out, bx - 0.04, bx + 0.04, z - 0.42, z - 0.34, 4, 15.3, hex('#c6c6c0'))
  block(out, bx - 0.75, bx + 0.75, z - 0.45, z - 0.38, 4.4, 13.2, NEON)
  const word = 'LACIGALE'
  for (let i = 0; i < word.length; i++) {
    lettersOn(out, '-z', z - 0.45, bx, 12.1 - i * 0.93, word[i], { h: 0.76, c: hex('#f6efe2'), wide: 0.9, th: 0.15, tag: EMIT, d: 0.02 })
  }
  // ---- the tower on the right: three bows stacked, the plain side panels, the loggia
  const T0 = 1
  const T1 = 9
  block(out, T0, T1, z, z + 8, 0, 22, WHITE)
  for (const [y0, y1] of [[4.8, 7.5], [9.9, 12.6], [15, 17.7]] as const) bow(out, (T0 + T1) / 2 + 0.2, z, y0, y1)
  block(out, T0 + 1.1, T1 - 0.4, z + 0.6, z + 7.5, 22, 25.2, hex('#d3dadb'))
  for (let x = T0 + 1.3; x < T1 - 0.4; x += 0.7) rectOn(out, '-z', z + 0.6, x - 0.03, x + 0.03, 22, 25.2, WHITE, 0.03)
  block(out, T0 + 0.8, T1 - 0.1, z + 0.3, z + 7.8, 25.2, 25.5, shade(WHITE, 1.02))
  block(out, T0, T1, z - 0.1, z + 8, 21.8, 22.1, shade(WHITE, 1.03))
  // the rest of the plan, a plain white block up to the mass behind
  block(out, -10, 9, z + 8, z + 16, 0, 17, shade(WHITE, 0.96))
}

/** A bowed bay: its projecting body, flat-curved in three facets, two windows, the band under and over it. */
function bow(out: MeshBuilder, x: number, z: number, y0: number, y1: number): void {
  const hw = 2.7
  const d = 1.15
  const f = hex('#3f4247')
  const pts3: [number, number][] = [[-hw, 0], [-hw + 0.9, d], [hw - 0.9, d], [hw, 0]]
  for (let i = 0; i < 3; i++) {
    const [a, ad] = pts3[i]
    const [b, bd] = pts3[i + 1]
    const L = Math.hypot(b - a, bd - ad) || 1
    const n: [number, number, number] = [(bd - ad) / L * -1, 0, -(b - a) / L]
    out.quad([[x + a, y0 - 0.45, z - ad], [x + b, y0 - 0.45, z - bd], [x + b, y1 + 0.45, z - bd], [x + a, y1 + 0.45, z - ad]], n, UV, WHITE, FIXED)
  }
  rectOn(out, '-z', z - d, x - 1.7, x - 0.15, y0 + 0.3, y1 - 0.2, f, 0.03)
  rectOn(out, '-z', z - d, x + 0.15, x + 1.7, y0 + 0.3, y1 - 0.2, f, 0.03)
  for (const y of [y0 - 0.5, y1 + 0.45]) block(out, x - hw + 0.75, x + hw - 0.75, z - d - 0.18, z, y - 0.09, y + 0.09, shade(WHITE, 1.04))
}
