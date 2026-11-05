import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { beam, block, hex, shade } from '../kit.ts'
import { into } from './louvre-palace.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL DE ROQUELAURE (246 boulevard Saint-Germain, 7e; Jean Cailleteau called Lassurance 1722-24, then Leroux; now the Ministry of Ecology; OSM way/63564122).
 * Read off Commons (Atget's "Hôtel de Roquelaure" court and porch plates): between boulevard and garden a stone hôtel entre cour et jardin. On the boulevard a
 * low screen of rusticated stone broken by a pedimented porch block (an arched carriage passage, a half-moon window and mask keystones over it, a pediment, arched
 * windows each side, balustrades); behind it a round-ended cour d'honneur flanked by low wings of tall arched openings; across the court's end the corps de logis,
 * seven bays on a rusticated ground floor, a pedimented three-bay centre, tall first-floor windows with balconies, a balustraded attic, a low slate hip behind.
 * OSM's outline is the whole parcel (garden included): boulevard front on its SW edge. The IGN MNS around it is crowded by neighbours and trees, so heights are read
 * from the photographs (two storeys + attic ~ 11.5 m, the screen ~ 5 m) and the plan from the outline.
 *
 * Drawn in the boulevard's frame (u along it, v toward it) about the outline's centre, turned into the plan by `into`; u = AXIS_U is the porch's axis.
 */
// ---- tunable: the frame
export const TURN = (132.7 * Math.PI) / 180  // u runs north-west along the boulevard (north is +z in the plan)
export const AXIS_U = -3
export const FLOOR = 0.5
// ---- tunable: the screen on the boulevard
export const SCREEN_V = 23.5
export const SCREEN_HALF = 24
export const SCREEN_H = 5.4
export const SCREEN_T = 1.2
export const PORCH_HALF = 5.4
export const PORCH_H = 9.6
export const PORCH_T = 4
export const PED_RISE = 2.1
export const PASS_W = 3.8
export const PASS_TOP = 4.6
// ---- tunable: the wings and the court
export const WING_IN = 17           // the court's half-width
export const WING_W = 6.2
export const WING_H = 8.2
export const COURT_BACK = 5         // v of the corps de logis' front wall
// ---- tunable: the corps de logis
export const CORPS_HALF = 19
export const CORPS_DEPTH = 13
export const CORPS_EAVE = 10.6
export const BAL_H = 1.1
export const ROOF_TOP = 14.2
export const BAYS = 9
export const CENTRE_HALF = 5.2
export const CENTRE_OUT = 0.8
export const PED_C = 2.3
export const BASE_H = 5.0           // the ground storey's height (rusticated)
export const FIRST = [5.9, 9.4]
// ---- tunable: the garden
export const GARDEN_V = -38
export const GARDEN_HALF = 36
// ---- tunable: colours
const STONE: Rgb = hex('#d6c9a6')
const STONE_D: Rgb = hex('#bdae8a')
const STONE_L: Rgb = hex('#e6dcc0')
const SLATE: Rgb = hex('#58606c')
const SLATE_HI: Rgb = hex('#687484')
const GLASS: Rgb = [0.2, 0.25, 0.3]
const IRON: Rgb = [0.07, 0.07, 0.08]
const DOOR: Rgb = hex('#3a4a40')
const COBBLE: Rgb = hex('#8a8478')
const LAWN: Rgb = hex('#6d8a55')

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
function sheet(q: MeshBuilder, p: [V3, V3, V3, V3], col: Rgb): void {
  const u = sub(p[1], p[0]), v = sub(p[2], p[0])
  let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const l = Math.hypot(...n) || 1
  n = n[1] < 0 ? [-n[0] / l, -n[1] / l, -n[2] / l] : [n[0] / l, n[1] / l, n[2] / l]
  q.quad(p, n, UV, col, FIXED)
}
type Face = { o: P; t: P; n: P }
const at = (f: Face, s: number, y: number, d: number): V3 => [f.o[0] + f.t[0] * s + f.n[0] * d, y, f.o[1] + f.t[1] * s + f.n[1] * d]
const nrm = (f: Face): V3 => [f.n[0], 0, f.n[1]]
function rect(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, d: number, col: Rgb): void {
  q.quad([at(f, s0, y0, d), at(f, s1, y0, d), at(f, s1, y1, d), at(f, s0, y1, d)], nrm(f), UV, col, FIXED)
}
function tri(q: MeshBuilder, f: Face, a: P, b: P, c: P, d: number, col: Rgb): void {
  q.quad([at(f, a[0], a[1], d), at(f, b[0], b[1], d), at(f, c[0], c[1], d), at(f, c[0], c[1], d)], nrm(f), UV, col, FIXED)
}
function arch(q: MeshBuilder, f: Face, sc: number, w: number, y0: number, spring: number, top: number, d: number, col: Rgb): void {
  rect(q, f, sc - w / 2, sc + w / 2, y0, spring, d, col)
  const r = w / 2, h = top - spring, N = 6
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N
    tri(q, f, [sc, spring], [sc - Math.cos(a0) * r, spring + Math.sin(a0) * h], [sc - Math.cos(a1) * r, spring + Math.sin(a1) * h], d, col)
  }
}
function balustrade(q: MeshBuilder, f: Face, s0: number, s1: number, y: number, h: number, d: number): void {
  rect(q, f, s0, s1, y, y + h * 0.2, d, STONE_L)
  rect(q, f, s0, s1, y + h * 0.2, y + h * 0.8, d - 0.05, STONE_D)
  rect(q, f, s0, s1, y + h * 0.8, y + h, d, STONE_L)
  for (let s = s0 + 0.3; s < s1 - 0.2; s += 0.8) rect(q, f, s - 0.1, s + 0.1, y + h * 0.2, y + h * 0.8, d + 0.02, STONE_L)
}
/** A face along u at depth v looking toward +v (the boulevard) or -v. */
const along = (v: number, toward: 1 | -1, u0: number): Face => (toward > 0 ? { o: [u0, v], t: [1, 0], n: [0, 1] } : { o: [u0, v], t: [-1, 0], n: [0, -1] })
/** A hipped slate roof on a rectangle. */
function hip(q: MeshBuilder, u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, ridgeIn: number): void {
  const a: V3[] = [[u0, y0, v0], [u1, y0, v0], [u1, y0, v1], [u0, y0, v1]]
  const r: V3[] = [[u0 + ridgeIn, y1, v0 + ridgeIn], [u1 - ridgeIn, y1, v0 + ridgeIn], [u1 - ridgeIn, y1, v1 - ridgeIn], [u0 + ridgeIn, y1, v1 - ridgeIn]]
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; sheet(q, [a[i], a[j], r[j], r[i]], SLATE) }
  sheet(q, [r[0], r[1], r[2], r[3]], SLATE_HI)
}

/** The screen: rusticated wall with blind arches, a coping, and the porch block with its passage and pediment. */
function screen(q: MeshBuilder): void {
  const U0 = AXIS_U - SCREEN_HALF, U1 = AXIS_U + SCREEN_HALF, V = SCREEN_V
  block(q, U0, U1, V - SCREEN_T, V, 0, SCREEN_H, STONE)
  const f = along(V, 1, U0), W = U1 - U0
  rect(q, f, 0, W, 0, 0.8, 0.1, STONE_D)
  for (let y = 1.3; y < SCREEN_H - 0.6; y += 0.62) rect(q, f, 0, W, y, y + 0.05, 0.04, STONE_D)
  rect(q, f, 0, W, SCREEN_H - 0.5, SCREEN_H, 0.3, STONE_L)
  const mid = W / 2
  const nb = 6
  for (let i = 0; i < nb; i++) for (const sg of [-1, 1]) {
    const s = mid + sg * (PORCH_HALF + 2.6 + i * 3.4)
    if (Math.abs(s - mid) > SCREEN_HALF - 1.6) continue
    arch(q, f, s, 1.9, 0.9, 2.5, 3.5, 0.08, STONE_D)
    arch(q, f, s, 1.4, 1.0, 2.5, 3.3, 0.12, GLASS)
  }
  // the porch block
  const PH = PORCH_HALF, T = PORCH_T
  block(q, AXIS_U - PH, AXIS_U + PH, V - T, V + 0.5, 0, PORCH_H, STONE)
  const pf = along(V + 0.5, 1, AXIS_U - PH), w = 2 * PH, c = PH
  rect(q, pf, 0, w, 0, 0.6, 0.1, STONE_D)
  for (let y = 0.9; y < 5.4; y += 0.6) rect(q, pf, 0, w, y, y + 0.05, 0.05, STONE_D)
  for (const sg of [-1, 1]) {   // quoin strips at the corners
    for (let y = 0.9; y < PORCH_H - 1.6; y += 0.9) rect(q, pf, sg < 0 ? 0 : w - 0.55, sg < 0 ? 0.55 : w, y, y + 0.4, 0.14, STONE_L)
  }
  // the carriage passage and its inner arch, mask keystone, the half-moon window above it, the 'tympan' panel
  arch(q, pf, c, PASS_W + 1.0, 0, PASS_TOP - 1.0, PASS_TOP + 0.9, 0.12, STONE_L)
  arch(q, pf, c, PASS_W, 0, PASS_TOP - 1.5, PASS_TOP, 0.2, DOOR)
  rect(q, pf, c - 0.1, c + 0.1, 0, PASS_TOP - 1.5, 0.24, IRON)
  rect(q, pf, c - 0.35, c + 0.35, PASS_TOP + 0.4, PASS_TOP + 1.3, 0.3, STONE_L)
  rect(q, pf, c - 2.0, c + 2.0, PASS_TOP + 1.0, PASS_TOP + 1.2, 0.3, STONE_L)
  arch(q, pf, c, 2.6, PASS_TOP + 1.4, PASS_TOP + 2.6, PASS_TOP + 3.9, 0.12, STONE_L)
  arch(q, pf, c, 2.0, PASS_TOP + 1.6, PASS_TOP + 2.6, PASS_TOP + 3.5, 0.18, GLASS)
  for (const sg of [-1, 1]) {   // arched windows each side, upper sashes and lower
    const s = c + sg * 3.55
    arch(q, pf, s, 1.5, 0.9, 4.0, 5.0, 0.14, GLASS)
    rect(q, pf, s - 0.8, s + 0.8, 5.3, 6.2, 0.12, STONE_D)
    rect(q, pf, s - 0.55, s + 0.55, 6.4, 8.0, 0.14, GLASS)
  }
  // the cornice, the pediment
  rect(q, pf, -0.3, w + 0.3, PORCH_H - 0.9, PORCH_H, 0.45, STONE_L)
  rect(q, pf, -0.3, w + 0.3, PORCH_H - 1.15, PORCH_H - 0.9, 0.3, STONE_D)
  tri(q, pf, [-0.3, PORCH_H], [w + 0.3, PORCH_H], [c, PORCH_H + PED_RISE], 0.45, STONE_L)
  tri(q, pf, [0.8, PORCH_H + 0.12], [w - 0.8, PORCH_H + 0.12], [c, PORCH_H + PED_RISE - 0.45], 0.4, STONE_D)
  // the roof behind the pediment: a pitched slate ridge back along v
  const ridge = PORCH_H + PED_RISE
  for (const sg of [-1, 1]) sheet(q, [[AXIS_U + sg * PH, PORCH_H, V + 0.45], [AXIS_U + sg * PH, PORCH_H, V - T], [AXIS_U, ridge, V - T], [AXIS_U, ridge, V + 0.45]], SLATE)
  // wing-balustrades on the screen over the arches
  balustrade(q, f, 0, mid - PH, SCREEN_H, 0.9, 0.2)
  balustrade(q, f, mid + PH, W, SCREEN_H, 0.9, 0.2)
  // the screen's back face is plain; the steps are a pair of flat treads at the porch
  for (let k = 0; k < 3; k++) block(q, AXIS_U - 3.2 - k * 0.3, AXIS_U + 3.2 + k * 0.3, V + 0.5, V + 1.9 - k * 0.45, 0, (3 - k) * 0.12, STONE_L)
}

/** The two court wings: long low blocks of tall arched openings under a balustrade. */
function wings(q: MeshBuilder): void {
  const V0 = SCREEN_V - SCREEN_T, V1 = COURT_BACK
  for (const sg of [-1, 1]) {
    const ua = AXIS_U + sg * WING_IN, ub = AXIS_U + sg * (WING_IN + WING_W)
    block(q, Math.min(ua, ub), Math.max(ua, ub), V1, V0, 0, WING_H, STONE)
    const f: Face = sg < 0
      ? { o: [ua, V1], t: [0, 1], n: [1, 0] }       // inner face looks +u from the west wing
      : { o: [ua, V0], t: [0, -1], n: [-1, 0] }     // east wing looks -u
    const L = V0 - V1, nb = Math.max(1, Math.round(L / 3.6))
    rect(q, f, 0, L, 0, 0.7, 0.1, STONE_D)
    for (let y = 1.0; y < 5.2; y += 0.6) rect(q, f, 0, L, y, y + 0.05, 0.05, STONE_D)
    for (let i = 0; i < nb; i++) {
      const s = (i + 0.5) * L / nb
      arch(q, f, s, 2.0, 0.7, 4.0, 5.3, 0.06, STONE_L)
      arch(q, f, s, 1.6, 0.8, 4.0, 5.1, 0.1, GLASS)
      rect(q, f, s - 0.55, s + 0.55, 6.1, 7.4, 0.08, GLASS)
    }
    rect(q, f, 0, L, WING_H - 0.7, WING_H, 0.3, STONE_L)
    hip(q, Math.min(ua, ub) - 0.1, Math.max(ua, ub) + 0.1, V1 - 0.1, V0 + 0.1, WING_H, WING_H + 1.8, 1.8)
  }
}

/** The corps de logis: rusticated ground floor, tall first floor, pedimented centre, balustraded attic, hip behind. */
function corps(q: MeshBuilder): void {
  const V1 = COURT_BACK, V0 = V1 - CORPS_DEPTH, U0 = AXIS_U - CORPS_HALF, U1 = AXIS_U + CORPS_HALF
  block(q, U0, U1, V0, V1, 0, CORPS_EAVE, STONE)
  const f = along(V1, 1, U0), W = U1 - U0, c = W / 2
  rect(q, f, 0, W, 0, 0.8, 0.1, STONE_D)
  for (let y = 1.2; y < BASE_H; y += 0.6) rect(q, f, 0, W, y, y + 0.05, 0.05, STONE_D)
  rect(q, f, 0, W, BASE_H, BASE_H + 0.35, 0.18, STONE_L)
  rect(q, f, 0, W, CORPS_EAVE - 1.0, CORPS_EAVE, 0.4, STONE_L)
  rect(q, f, 0, W, CORPS_EAVE - 1.3, CORPS_EAVE - 1.0, 0.25, STONE_D)
  balustrade(q, f, 0, W, CORPS_EAVE, BAL_H, 0.3)
  const bw = (W - 2 * 2.2) / (BAYS - 2)   // the end bays are wider-spaced piers
  for (let i = 0; i < BAYS; i++) {
    const s = i === 0 ? 1.5 : i === BAYS - 1 ? W - 1.5 : 2.2 + (i - 0.5) * bw
    const ctr = Math.abs(s - c) < CENTRE_HALF + 0.2
    // ground: doors on the centre bays (glazed, tall), arched lights on the rest
    if (Math.abs(s - c) < CENTRE_HALF) { rect(q, f, s - 0.85, s + 0.85, 0.5, 4.3, 0.1, GLASS); rect(q, f, s - 0.05, s + 0.05, 0.5, 4.3, 0.14, IRON) }
    else arch(q, f, s, 1.4, 0.9, 3.2, 4.2, 0.1, GLASS)
    // first floor: tall rectangular window, a wrought balcony, a keystone mask
    rect(q, f, s - 0.95, s + 0.95, FIRST[0] - 0.1, FIRST[1] + 0.4, 0.06, STONE_L)
    rect(q, f, s - 0.75, s + 0.75, FIRST[0], FIRST[1], 0.1, GLASS)
    rect(q, f, s - 0.04, s + 0.04, FIRST[0], FIRST[1], 0.14, STONE_L)
    rect(q, f, s - 0.95, s + 0.95, FIRST[0] - 0.05, FIRST[0] + 0.85, 0.28, IRON)
    rect(q, f, s - 0.2, s + 0.2, FIRST[1] + 0.4, FIRST[1] + 0.8, 0.12, STONE_D)
    if (ctr) rect(q, f, s - 1.2, s + 1.2, FIRST[0] - 0.1, FIRST[0] - 0.02, 0.32, STONE_L)
  }
  // the centre: shallow avant-corps with a low pediment
  rect(q, f, c - CENTRE_HALF - 0.9, c + CENTRE_HALF + 0.9, 0.1, CORPS_EAVE, 0.01 + CENTRE_OUT, STONE_D)
  for (let y = 1.2; y < BASE_H; y += 0.6) rect(q, f, c - CENTRE_HALF - 0.9, c + CENTRE_HALF + 0.9, y, y + 0.05, CENTRE_OUT + 0.05, STONE_L)
  tri(q, f, [c - CENTRE_HALF - 1.2, CORPS_EAVE + BAL_H], [c + CENTRE_HALF + 1.2, CORPS_EAVE + BAL_H], [c, CORPS_EAVE + BAL_H + PED_C], 0.9, STONE_L)
  tri(q, f, [c - CENTRE_HALF, CORPS_EAVE + BAL_H + 0.15], [c + CENTRE_HALF, CORPS_EAVE + BAL_H + 0.15], [c, CORPS_EAVE + BAL_H + PED_C - 0.5], 0.85, STONE_D)
  // steps to the court
  for (let k = 0; k < 4; k++) block(q, AXIS_U - 4.5 - k * 0.4, AXIS_U + 4.5 + k * 0.4, V1 + CENTRE_OUT, V1 + CENTRE_OUT + 0.4 + (4 - k) * 0.3, 0, (k + 1) * 0.18, STONE_L)
  // the garden front: a plain face with tall windows; the roof, a low hip behind the balustrade
  const gf: Face = { o: [U1, V0], t: [-1, 0], n: [0, -1] }
  for (let i = 0; i < BAYS; i++) { const s = (i + 0.5) * W / BAYS; rect(q, gf, s - 0.7, s + 0.7, 0.9, 4.6, 0.06, GLASS); rect(q, gf, s - 0.8, s + 0.8, FIRST[0], FIRST[1], 0.06, GLASS) }
  rect(q, gf, 0, W, CORPS_EAVE - 0.9, CORPS_EAVE, 0.3, STONE_L)
  balustrade(q, gf, 0, W, CORPS_EAVE, BAL_H, 0.25)
  hip(q, U0 + 1.0, U1 - 1.0, V0 + 1.0, V1 - 1.0, CORPS_EAVE + BAL_H * 0.5, ROOF_TOP, 4.6)
  for (const sg of [-1, 1]) { const ch = AXIS_U + sg * 8; block(q, ch - 0.6, ch + 0.6, V0 + 4.5, V0 + 5.7, ROOF_TOP - 1.4, ROOF_TOP + 1.9, STONE_D) }
}

/** The cour d'honneur's paving, the garden lawn, and a low garden wall at its end. */
function ground(q: MeshBuilder): void {
  const U0 = AXIS_U - SCREEN_HALF, U1 = AXIS_U + SCREEN_HALF
  q.quad([[AXIS_U - WING_IN, 0.05, SCREEN_V - SCREEN_T], [AXIS_U + WING_IN, 0.05, SCREEN_V - SCREEN_T], [AXIS_U + WING_IN, 0.05, COURT_BACK], [AXIS_U - WING_IN, 0.05, COURT_BACK]], [0, 1, 0], UV, COBBLE, FIXED)
  const V0 = COURT_BACK - CORPS_DEPTH
  q.quad([[U0, 0.04, V0], [U1, 0.04, V0], [U1, 0.04, GARDEN_V], [U0, 0.04, GARDEN_V]], [0, 1, 0], UV, LAWN, FIXED)
  void beam; void shade; void GARDEN_HALF
}

export const HOTEL_ROQUELAURE_REFS = ['way/63564122']

export function hotelRoquelaure(out: MeshBuilder): void {
  const first = out.positions.length / 3
  const q = new MeshBuilder()
  ground(q)
  screen(q)
  wings(q)
  corps(q)
  const c = Math.cos(TURN), s = Math.sin(TURN)
  into(out, q, [0, 0], c, s)
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
