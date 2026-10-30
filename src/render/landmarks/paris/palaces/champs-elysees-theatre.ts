import type { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts, rectOn, slabOn } from './common.ts'
import { lettersOn, litOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM way 69486335's box turned to the avenue (local −z faces bearing 142.4, the Avenue Montaigne) */
const HX = 22.3
const HZ = 46.3
const MARBLE = hex('#cdd0ce')
const GILT = hex('#caa548')
const GREEN = hex('#3e5548')

/** Way 69486335 in the model's frame, the corner drum drawn separately. */
const PLAN = pts([-22.3, 44.8, -14.5, -45.9, 12, -46, 22.2, -38, 17.1, 24.8, 13.5, 28.6, 13.7, 31.5, 9.8, 32.3, 0.2, 32.8, -0.9, 46.3])

/**
 * The Théâtre des Champs-Élysées (Auguste Perret, after Van de Velde, 1913), 15 Avenue Montaigne: the first great
 * concrete building in Paris, clad in pale marble, and almost flat. It has no columns and no roof to see; what a rider
 * sees is one severe pale PAVILION standing a little forward on the avenue:
 *
 * - the two broad corner piers, rising whole to the deep flat cornice, a thin shadow line up each;
 * - between them the three tall windows in their GILT frames with the three small square ones below, flat pilasters
 *   running up between, a thin gilt line at their head and THEATRE DES CHAMPS-ELYSEES cut under the frieze;
 * - across the top BOURDELLE'S FRIEZE, the three long reliefs of Apollo and the muses, pale figures in shallow panels;
 * - at the foot, the row of bronze-and-glass doors under the thin flat canopy, dark green over it, the name again in gilt;
 * - to the right the round corner drum, its bays, its little relief panels.
 *
 * Plan is OSM's (way 69486335, whose south-west neighbour way 69486350 is the same marble's left wing and stays the
 * city's). Heights off photographs from the avenue (Commons, 2011–2022), scaled on the doors: cornice at 28 m. The hall and
 * stage behind were never photographed from the street and are plain masses at 24 and 30 m, a guess from the aerial shape.
 */
export function theatreChampsElysees(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#cdd0ce', '#737676')
  // ---- the body behind: the marble plan with its plain windows, the stage house rising out of it
  extrude(out, [PLAN], p, { eaves: 24, bay: 4.4, win: 1.6, rise: 0.6, inset: 0.3, dormers: false,
    storeys: [{ y: 6.5, h: 2.4 }, { y: 11, h: 3.2 }, { y: 16, h: 2.4 }, { y: 20.2, h: 2 }] })
  block(out, -14, 11, -14, 26, 24, 32, shade(MARBLE, 0.97))
  block(out, -14.3, 11.3, -14.3, 26.3, 31.6, 32.3, MARBLE)
  // ---- the pavilion
  const X0 = -14.5
  const X1 = 12
  const cx = (X0 + X1) / 2
  const z = -46.6
  block(out, X0, X1, z, -40, 0, 27.4, MARBLE)
  // the deep flat cornice: its soffit in shadow, its coffer lines
  block(out, X0 - 1.0, X1 + 1.0, z - 1.5, -39.4, 27.0, 28, shade(MARBLE, 1.04))
  rectOn(out, '-z', z - 1.5, X0 - 1.0, X1 + 1.0, 27.0, 27.15, shade(MARBLE, 0.68), 0.01)
  block(out, X0 - 0.4, X1 + 0.4, z - 0.8, -39.4, 26.5, 27, shade(MARBLE, 0.97))
  // the corner piers, a hair forward; the shadow line and the little panels at their heads
  for (const [a, b] of [[X0, X0 + 3.9], [X1 - 3.9, X1]] as const) {
    slabOn(out, '-z', z, a, b, 4.8, 26.5, 0.22, shade(MARBLE, 1.02))
    rectOn(out, '-z', z - 0.22, a + 0.2, b - 0.2, 24.2, 24.34, shade(MARBLE, 0.74), 0.015)
    rectOn(out, '-z', z - 0.22, a + 0.2, a + 0.3, 8, 24.2, shade(MARBLE, 0.78), 0.015)
    rectOn(out, '-z', z - 0.22, b - 0.3, b - 0.2, 8, 24.2, shade(MARBLE, 0.78), 0.015)
    rectOn(out, '-z', z - 0.22, a + 0.9, b - 0.9, 21.2, 23.4, shade(MARBLE, 0.88), 0.015)
  }
  // the three bays between: tall window, small square window, flat pilasters, recessed spandrels
  const span = X1 - X0 - 7.8
  const bay = span / 3
  const first = X0 + 3.9
  for (let k = 0; k <= 3; k++) {
    const x = first + k * bay
    if (k > 0 && k < 3) slabOn(out, '-z', z, x - 0.62, x + 0.62, 5.2, 18.2, 0.14, shade(MARBLE, 1.02))
    if (k > 0 && k < 3) for (const t of [-0.28, 0.28]) rectOn(out, '-z', z - 0.14, x + t - 0.04, x + t + 0.04, 5.2, 18.2, shade(MARBLE, 0.74), 0.012)
  }
  for (let k = 0; k < 3; k++) {
    const x = first + (k + 0.5) * bay
    gilt(out, z, x, 10.0, 15.8, 1.45, p.glass, GILT)
    gilt(out, z, x, 6.9, 8.5, 1.0, p.glass, GILT)
    rectOn(out, '-z', z, x - 1.5, x + 1.5, 16.2, 17.6, shade(MARBLE, 0.9), 0.02)                               // the spandrel
  }
  // the gilt line at the head of the pilasters
  for (const x of [first + bay, first + 2 * bay, first - 0.1, first + 3 * bay + 0.1]) litOn(out, '-z', z - 0.15, x - 0.62, x + 0.62, 18.15, 18.3, GILT, 0.01)
  lettersOn(out, '-z', z, cx, 18.9, 'THEATRE DES CHAMPS-ELYSEES', { h: 0.62, c: GILT, wide: 0.66, th: 0.075, gap: 0.14, d: 0.02 })
  // ---- Bourdelle's frieze: three shallow panels, the figures raised pale in each
  const fy0 = 20.6
  const fy1 = 24.6
  const fw = (span - 0.8) / 3
  for (let k = 0; k < 3; k++) {
    const x0 = first + 0.2 + k * (fw + 0.2)
    rectOn(out, '-z', z, x0, x0 + fw, fy0, fy1, shade(MARBLE, 0.74), 0.015)
    figures(out, z, x0, x0 + fw, fy0, fy1, k)
  }
  // ---- the foot: the doors, the flat canopy, its green top and the gilt name
  rectOn(out, '-z', z, X0 + 2, X1 - 2, 0, 3.6, hex('#3a3b37'), 0.05)
  for (let i = 0; i < 9; i++) {
    const x = X0 + 3.3 + ((X1 - X0 - 6.6) * i) / 8
    rectOn(out, '-z', z, x - 0.95, x + 0.95, 0.05, 3.2, i % 2 ? hex('#6a6f5a') : hex('#8a7c4a'), 0.08)
    rectOn(out, '-z', z, x - 0.7, x + 0.7, 0.3, 2.9, hex('#2b2e2d'), 0.1)
    rectOn(out, '-z', z, x - 0.04, x + 0.04, 0.3, 2.9, GILT, 0.12)
  }
  block(out, X0 + 0.3, X1 - 0.3, z - 2.3, z, 3.95, 4.5, shade(MARBLE, 1.03))
  block(out, X0 + 2.8, X1 - 2.8, z - 1.8, z, 4.5, 4.72, GREEN)
  lettersOn(out, '-z', z - 2.3, cx, 4.03, 'THEATRE DES CHAMPS-ELYSEES', { h: 0.4, c: GILT, wide: 0.66, th: 0.06, gap: 0.1, d: 0.02 })
  for (const s of [-1, 1]) rectOn(out, '-z', z, cx + s * 11.6 - 0.65, cx + s * 11.6 + 0.65, 0.8, 2.9, hex('#2d3036'), 0.08)
  // ---- the corner drum on the right, its windows, its little reliefs
  const dx = 16.2
  const dz = -40.2
  const R = 6
  prism(out, dx, dz, 0, 22.3, R, 20, MARBLE, FIXED, R, false)
  prism(out, dx, dz, 21.9, 22.7, R + 0.3, 20, shade(MARBLE, 1.04), FIXED, R + 0.3)
  prism(out, dx, dz, 22.7, 24.0, R - 0.5, 20, shade(MARBLE, 0.97), FIXED, R - 0.5)
  for (const a of [-0.2, 0.35, 0.9, 1.45]) {
    drumPane(out, dx, dz, R, a, 11, 15, 0.8, p.glass, GILT)
    drumPane(out, dx, dz, R, a, 17.3, 19.4, 0.7, p.glass, GILT)
    drumPane(out, dx, dz, R, a, 7, 8.4, 0.6, p.glass, GILT)
    drumPane(out, dx, dz, R, a, 4.2, 6.2, 0.7, shade(MARBLE, 0.72), shade(MARBLE, 1.0))
    drumPane(out, dx, dz, R, a, 0, 3.2, 0.9, hex('#35352f'), GILT)
  }
}

/** A window in a gilt frame, centred at x: a stepped surround, the frame, the panes. */
function gilt(out: MeshBuilder, z: number, x: number, y0: number, y1: number, hw: number, glass: Rgb, frame: Rgb): void {
  rectOn(out, '-z', z, x - hw - 0.16, x + hw + 0.16, y0 - 0.16, y1 + 0.16, shade(MARBLE, 0.8), 0.02)
  rectOn(out, '-z', z, x - hw, x + hw, y0, y1, frame, 0.04)
  rectOn(out, '-z', z, x - hw + 0.14, x + hw - 0.14, y0 + 0.14, y1 - 0.14, glass, 0.06)
  rectOn(out, '-z', z, x - 0.035, x + 0.035, y0 + 0.14, y1 - 0.14, frame, 0.08)
  rectOn(out, '-z', z, x - hw + 0.14, x + hw - 0.14, y0 + (y1 - y0) * 0.6, y0 + (y1 - y0) * 0.6 + 0.06, frame, 0.08)
}

/** A pane on the drum, centred on angle `a` from its front. */
function drumPane(out: MeshBuilder, cx: number, cz: number, R: number, a: number, y0: number, y1: number, hw: number, c: Rgb, frame: Rgb): void {
  const sx = Math.sin(a)
  const sz = -Math.cos(a)
  const P = (u: number, y: number, d: number): [number, number, number] => [cx + sx * (R + d) + Math.cos(a) * u, y, cz + sz * (R + d) + Math.sin(a) * u]
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  out.quad([P(-hw - 0.1, y0 - 0.1, 0.02), P(hw + 0.1, y0 - 0.1, 0.02), P(hw + 0.1, y1 + 0.1, 0.02), P(-hw - 0.1, y1 + 0.1, 0.02)], [sx, 0, sz], uv, frame, FIXED)
  out.quad([P(-hw, y0, 0.05), P(hw, y0, 0.05), P(hw, y1, 0.05), P(-hw, y1, 0.05)], [sx, 0, sz], uv, c, FIXED)
}

/**
 * The frieze's figures: not the reliefs, which no rider can read at 25 m, but their rhythm: pale bodies leaning into one
 * another across the panel, drawn as tapering limbs. The middle panel is Apollo, upright between the muses.
 */
function figures(out: MeshBuilder, z: number, x0: number, x1: number, y0: number, y1: number, k: number): void {
  const pale = shade(MARBLE, 1.1)
  const w = x1 - x0
  const n = k === 1 ? 5 : 4
  const lean = k === 0 ? 0.35 : k === 2 ? -0.35 : 0
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    const x = x0 + t * w
    const h = y1 - y0 - 0.4
    const up = (k === 1 && i === 2) ? 1 : 0.88 - (i % 2) * 0.16
    const by = y0 + 0.2
    const ty = by + h * up
    const tilt = lean * (i % 2 ? 1 : 0.5)
    const hw = w / n / 3.6
    // the body: a tall tapered quad, and the head
    out.quad([[x - hw, by, z - 0.05], [x + hw, by, z - 0.05], [x + hw * 0.7 + tilt, ty - 0.45, z - 0.05], [x - hw * 0.7 + tilt, ty - 0.45, z - 0.05]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], pale, FIXED)
    out.quad([[x - 0.17 + tilt, ty - 0.42, z - 0.05], [x + 0.17 + tilt, ty - 0.42, z - 0.05], [x + 0.17 + tilt, ty, z - 0.05], [x - 0.17 + tilt, ty, z - 0.05]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], pale, FIXED)
    // an arm flung out toward the next figure
    const s = i % 2 ? -1 : 1
    out.quad([[x, ty - 1.1, z - 0.05], [x + s * hw * 1.9, ty - 0.75 + 0.12 * s, z - 0.05], [x + s * hw * 1.9, ty - 0.55 + 0.12 * s, z - 0.05], [x, ty - 0.8, z - 0.05]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], pale, FIXED)
  }
}
