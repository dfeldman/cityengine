/**
 * ÉGLISE SAINT-THOMAS-D'AQUIN (place Saint-Thomas-d'Aquin, 7e; OSM way/63536576; the Jesuit novitiate chapel, 1682-1722). A
 * Baroque stone church: a two-storey front 28 m wide (six engaged columns below, four paired above, a clock window under
 * a pediment, concave scroll wings ending in obelisks), a slate-roofed nave (ridge ~28 m) between low aisles (~13 m),
 * a transept and a lower choir. Measured from the IGN LiDAR HD surface model and a Commons photograph
 * (docs/landmarks/MODEL-ST-THOMAS-AQUIN.md). Frame: church (u, v) turned AXIS_DEG from east, u along the nave toward the
 * choir, v across; the nave axis is at v = VC. Registered onto the footprint by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 61.7                 // nave direction, anticlockwise from east (front faces the opposite way)
const VC = 3.9                        // the nave axis's v
const U_FRONT = -27, NAVE_U1 = 14, AISLE_U1 = -5
const NAVE_HALF = 7, AISLE_V0 = -10.4, AISLE_V1 = 17.9
const AISLE_H = 13, EAVE_H = 22, RIDGE_H = 28
const TR_U0 = -5, TR_U1 = 11, TR_V0 = -10.8, TR_V1 = 16, TR_EAVE = 18, TR_RIDGE = 22.5
const CHOIR_U1 = 28.3, CHOIR_V0 = -5.3, CHOIR_V1 = 10, CHOIR_EAVE = 14, CHOIR_RIDGE = 18
const LOWER_H = 12.9, UPPER_H = 24.8, APEX_H = 28.2, CROSS_H = 31.5
const LOWER_COLS = [13.2, 7.1, 3.6], UPPER_COLS = [3.4, 6.9], COL_R = 0.8, UP_COL_R = 0.62, UPPER_HALF = 7.75, WING_HALF = 14.1
const STONE = '#b4a78e', TRIM = '#c9bda4', ROOF = '#575d67', GLASS = '#2d3646', DOOR = '#4b2a2d', DARK = '#26272c', CLOCK = '#e6e0c8'

export const RING: P2[] = [[3.4,27.6],[-4.1,16.8],[-4.7,16.8],[-5.5,17.2],[-5.7,16.8],[-7.2,15.2],[-8.2,15.8],[-15.8,4.1],[-18.2,0.4],[-19,-0.7],[-21.4,-4.5],[-22.2,-5.6],[-24.6,-9.4],[-25.4,-10.5],[-26.9,-12.7],[-27,-12.7],[-27.7,-13.7],[-27.2,-13.9],[-28,-14.9],[-27,-15.6],[-24,-17.5],[-23,-18.2],[-23.7,-19.2],[-21.6,-20.5],[-20.4,-21.2],[-16.2,-24],[-13.2,-26],[-12.5,-25.1],[-11.5,-25.8],[-8.5,-27.7],[-7.4,-28.4],[-6.7,-27.4],[-6.2,-27.7],[-6.1,-27.4],[-3.8,-29],[-3.2,-28.2],[12.8,-4.6],[10.2,-2.9],[13.4,1.9],[8.2,5.2],[9,6.9],[14.4,14.8],[22.3,9.5],[26.9,16.4],[27.9,17.9],[21.8,21.8],[20.8,20.4],[19,21.6],[18.4,20.8],[8.2,27.8],[7.8,28.9]]

export function saintThomasAquin(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK), clock: Rgb = hex(CLOCK)
  const { en, P, solid, decal, round, disc, cornice, ridge, gable } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 16, corniceH: 0.6, corniceOut: 0.3 })
  /** a front-wall decal at lateral offset x from the nave axis (positive toward +v) */
  const fd = (off: number, x: number, pts: [number, number][], col: Rgb, uw = U_FRONT): void => decal(uw, VC, -1, 0, off, pts.map(([t, y]) => [t - x, y] as [number, number]), col)
  const shaft = (u: number, v: number, r: number, y0: number, y1: number, col: Rgb): void =>
    T.prism(Array.from({ length: 10 }, (_, i) => en(u + r * Math.cos((i / 10) * Math.PI * 2), v + r * Math.sin((i / 10) * Math.PI * 2))), y0, y1, col, col, 2)
  const win = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.04, round(t, y0 - 0.2, w + 0.6, h + 0.4), trim)
    decal(u, v, nu, nv, 0.09, round(t, y0, w, h), glass)
  }

  // ── footprint base: aisle-level slab so every corner of the outline is closed ──
  T.prism(RING, 0, 6, stone, shade(roofC, 1.1), 2)

  // ── aisles (low, flat lean-to roofs) and the nave's walls ──
  for (const [v0, v1, s] of [[AISLE_V0, VC - NAVE_HALF, -1], [VC + NAVE_HALF, AISLE_V1, 1]] as [number, number, number][]) {
    solid(U_FRONT, AISLE_U1, v0, v1, 0, AISLE_H, stone, null, 3)
    T.poly([P(U_FRONT, s > 0 ? v1 + 0.3 : v0 - 0.3, AISLE_H - 0.3), P(AISLE_U1, s > 0 ? v1 + 0.3 : v0 - 0.3, AISLE_H - 0.3), P(AISLE_U1, s > 0 ? v0 : v1, AISLE_H + 3), P(U_FRONT, s > 0 ? v0 : v1, AISLE_H + 3)], roofC, [...en(0, s), 0.8] as V3)
    cornice(U_FRONT, AISLE_U1, s > 0 ? v1 - 0.1 : v0, s > 0 ? v1 : v0 + 0.1, AISLE_H, 0.6, 0.3)
    for (let u = U_FRONT + 3.5; u < AISLE_U1 - 2; u += 5) win(u, s > 0 ? v1 : v0, 0, s, 0, 4.5, 1.8, 5.2)
  }
  solid(U_FRONT, NAVE_U1, VC - NAVE_HALF, VC + NAVE_HALF, AISLE_H - 0.5, EAVE_H, stone, null, 3)
  cornice(U_FRONT, NAVE_U1, VC - NAVE_HALF, VC + NAVE_HALF, EAVE_H, 0.7, 0.35)
  ridge('u', U_FRONT, NAVE_U1, VC, NAVE_HALF + 0.35, EAVE_H, RIDGE_H)
  gable('u', NAVE_U1, VC, NAVE_HALF + 0.35, EAVE_H, RIDGE_H, 1)
  for (let u = U_FRONT + 4; u < NAVE_U1 - 1; u += 5) {
    if (u > TR_U0 - 1.5 && u < TR_U1 + 1.5) continue
    for (const s of [-1, 1]) win(u, VC + s * NAVE_HALF, 0, s, 0, 15.2, 1.8, 5)
  }

  // ── transept: gabled arms ──
  const tc = (TR_U0 + TR_U1) / 2, th = (TR_U1 - TR_U0) / 2
  solid(TR_U0, TR_U1, TR_V0, TR_V1, AISLE_H - 0.5, TR_EAVE, stone, null, 3)
  for (const [a, b] of [[TR_V0, VC - NAVE_HALF], [VC + NAVE_HALF, TR_V1]]) solid(TR_U0, TR_U1, a, b, 0, AISLE_H - 0.5, stone, null, 3)
  cornice(TR_U0, TR_U1, TR_V0, TR_V1, TR_EAVE, 0.6, 0.3)
  ridge('v', TR_V0, TR_V1, tc, th + 0.3, TR_EAVE, TR_RIDGE)
  for (const [v, s] of [[TR_V0, -1], [TR_V1, 1]] as [number, 1 | -1][]) {
    gable('v', v, tc, th + 0.3, TR_EAVE, TR_RIDGE, s)
    win(tc, v, 0, s, 0, 8, 2.4, 8)
  }
  solid(3, 15, -15, -10.4, 0, 18, stone, shade(roofC, 1.05), 3)         // south chapel block
  solid(19, 29.4, -15.5, -6.3, 0, 8, stone, shade(roofC, 1.1), 3)       // low annex

  // ── choir: a lower gabled block behind the crossing ──
  const cc = (CHOIR_V0 + CHOIR_V1) / 2, ch = (CHOIR_V1 - CHOIR_V0) / 2
  solid(NAVE_U1, CHOIR_U1, CHOIR_V0, CHOIR_V1, AISLE_H - 0.5, CHOIR_EAVE, stone, null, 3)
  solid(NAVE_U1, CHOIR_U1, CHOIR_V0, CHOIR_V1, 0, AISLE_H - 0.5, stone, null, 3)
  cornice(NAVE_U1, CHOIR_U1, CHOIR_V0, CHOIR_V1, CHOIR_EAVE, 0.5, 0.25)
  ridge('u', NAVE_U1, CHOIR_U1, cc, ch + 0.3, CHOIR_EAVE, CHOIR_RIDGE)
  gable('u', CHOIR_U1, cc, ch + 0.3, CHOIR_EAVE, CHOIR_RIDGE, 1)

  // ── the front: two storeys, the lower the full 28 m, the upper the nave's width ──
  solid(U_FRONT, U_FRONT + 1.5, AISLE_V0, AISLE_V1, 0, LOWER_H, stone, null, 3)
  solid(U_FRONT - 1.4, U_FRONT + 0.2, AISLE_V0 - 0.3, AISLE_V1 + 0.3, LOWER_H - 1.5, LOWER_H, trim, trim, 0)          // entablature
  solid(U_FRONT - 0.1, U_FRONT + 1.3, VC - UPPER_HALF, VC + UPPER_HALF, LOWER_H, UPPER_H, stone, null, 3)
  for (const s of [-1, 1]) {
    for (const x of LOWER_COLS) {
      solid(U_FRONT - 1.7, U_FRONT - 0.1, VC + s * x - 0.95, VC + s * x + 0.95, 0, 0.9, trim, trim, 0)
      shaft(U_FRONT - 0.9, VC + s * x, COL_R, 0.9, LOWER_H - 1.5, shade(stone, 1.03))
      solid(U_FRONT - 1.7, U_FRONT - 0.1, VC + s * x - 0.95, VC + s * x + 0.95, LOWER_H - 2.3, LOWER_H - 1.5, trim, trim, 0)
    }
    for (const x of UPPER_COLS) {
      shaft(U_FRONT - 0.6, VC + s * x, UP_COL_R, LOWER_H + 0.4, UPPER_H - 1.2, shade(stone, 1.03))
      solid(U_FRONT - 1.3, U_FRONT - 0.1, VC + s * x - 0.8, VC + s * x + 0.8, UPPER_H - 1.9, UPPER_H - 1.2, trim, trim, 0)
    }
    // concave scroll wings in steps, ending in an obelisk
    const n = 8
    for (let k = 0; k < n; k++) {
      const a = UPPER_HALF + ((WING_HALF - UPPER_HALF) * k) / n, b = UPPER_HALF + ((WING_HALF - UPPER_HALF) * (k + 1)) / n
      const hgt = LOWER_H + 4.2 * Math.pow(1 - (k + 0.5) / n, 2.4)
      solid(U_FRONT, U_FRONT + 1.4, s > 0 ? VC + a : VC - b, s > 0 ? VC + b : VC - a, LOWER_H - 0.3, hgt, stone, trim, 0)
    }
    const ov = VC + s * (WING_HALF - 0.55)
    solid(U_FRONT - 0.5, U_FRONT + 1.0, ov - 0.75, ov + 0.75, LOWER_H, LOWER_H + 1.6, trim, trim, 0)
    solid(U_FRONT - 0.3, U_FRONT + 0.8, ov - 0.5, ov + 0.5, LOWER_H + 1.6, LOWER_H + 4.2, stone, trim, 0)
    solid(U_FRONT - 0.1, U_FRONT + 0.6, ov - 0.25, ov + 0.25, LOWER_H + 4.2, LOWER_H + 5.6, trim, trim, 0)
    // lower niches and side doors
    fd(0.06, s * 10.4, [[-1.3, 3.6], [1.3, 3.6], [1.3, 7.8], [-1.3, 7.8]], shade(stone, 0.9), U_FRONT)
    fd(0.06, s * 10.4, [[-1.3, 0], [1.3, 0], [1.3, 5.6], [-1.3, 5.6]], shade(stone, 0.9), U_FRONT)
    fd(0.12, s * 10.4, round(0, 0, 2.6, 5.4), door)
  }
  // central portal
  fd(0.06, 0, round(0, 0, 5.0, 9.4), trim); fd(0.12, 0, round(0, 0, 4.2, 8.8), door)
  fd(0.06, 0, [[-1.9, 0.6], [1.9, 0.6], [1.9, 0.7], [-1.9, 0.7]], dark)
  for (let k = 0; k < 4; k++) solid(U_FRONT - 2.2 - k * 0.5, U_FRONT - 1.5, VC - 3.6 + k * 0.4, VC + 3.6 - k * 0.4, 0, 0.55 - k * 0.12, shade(stone, 0.95), shade(stone, 0.9), 0)
  // frieze above the lower order
  fd(0.05, 0, [[-14, LOWER_H - 1.5], [14, LOWER_H - 1.5], [14, LOWER_H - 0.4], [-14, LOWER_H - 0.4]], shade(stone, 0.9), U_FRONT - 1.45)
  // upper entablature, clock window and pediment
  solid(U_FRONT - 1.4, U_FRONT + 0.2, VC - UPPER_HALF - 0.45, VC + UPPER_HALF + 0.45, UPPER_H - 1.2, UPPER_H, trim, trim, 0)
  fd(0.05, 0, round(0, 15.4, 3.6, 6.4), trim, U_FRONT + 1.3); fd(0.09, 0, round(0, 15.6, 3.0, 6.0), glass, U_FRONT + 1.3)
  fd(0.13, 0, disc(0, 19.4, 1.15), clock, U_FRONT + 1.3)
  fd(0.17, 0, [[-0.05, 19.4], [0.05, 19.4], [0.05, 20.35], [-0.05, 20.35]], dark, U_FRONT + 1.3); fd(0.17, 0, [[0, 19.35], [0.55, 19.35], [0.55, 19.45], [0, 19.45]], dark, U_FRONT + 1.3)
  solid(U_FRONT - 0.6, U_FRONT + 1.3, VC - 2, VC + 2, 13.2, 14.2, trim, trim, 0)                                            // balustrade
  gable('v', U_FRONT - 0.2, VC, UPPER_HALF + 0.7, UPPER_H, APEX_H + 0.45, -1, trim)
  gable('v', U_FRONT - 0.5, VC, UPPER_HALF + 0.35, UPPER_H, APEX_H, -1, shade(stone, 1.02))
  fd(0.0, 0, [[-1.8, UPPER_H + 0.5], [1.8, UPPER_H + 0.5], [0.6, UPPER_H + 1.5], [-0.6, UPPER_H + 1.5]], shade(stone, 0.9), U_FRONT - 0.55)   // relief
  solid(U_FRONT - 0.5, U_FRONT + 0.5, VC - 0.2, VC + 0.2, APEX_H, CROSS_H, trim, trim, 0)
  solid(U_FRONT - 0.5, U_FRONT + 0.5, VC - 1.1, VC + 1.1, APEX_H + 1.7, APEX_H + 2.3, trim, trim, 0)
  void door
}
