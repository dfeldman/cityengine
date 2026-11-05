import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { beam, block, column, hex, shade } from '../kit.ts'
import { into } from './louvre-palace.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL POTOCKI (27 avenue de Friedland, 8e; Jules Reboul 1878-84, Louis XIV revival; since 1908 the Paris Chamber of Commerce; OSM relation/1104615).
 * Read off Commons photographs ("Hôtel Potocki - Paris VIII - 2024-11-16" 1-5, "CCI Paris", "CCI Paris Île-de-France - avenue Friedland", "Paris - Avenue de
 * Friedland Handelskammer"): a long stone front on the avenue behind an iron railing with gilt flames; a central avant-corps that is a rusticated podium with
 * a tall arched door, groups of three Corinthian columns either side of it, a second order of paired free columns around a great grilled window and a
 * balcony, a broken entablature and a pediment, over it a dome roof; wings of arched ground windows, balconied upper windows, a balustrade over the
 * cornice and a low slate mansard with dormers. IGN LiDAR HD surface model (tools/ign-mns.ts at 48.87397 N, 2.30155 E): the wing roofs 16-19 m, the
 * pavilion's roof crown 23 m, a flat 13 m roof over the inner court, a glazed octagonal lantern ~23 m behind it, side wings running 50 m back.
 *
 * Drawn in the avenue's frame (u along it, v toward it; the avenue runs 11 deg north of east) and turned into the plan by `into`; u = 0 is the pavilion's axis.
 */
// ---- tunable: the frame
export const TURN = (11 * Math.PI) / 180
export const AXIS_U = -3            // the pavilion's axis, u from the entry's origin (metres along the avenue)
export const FLOOR = 0.5            // the model's ground (the loader sinks every base by it)
// ---- tunable: the front block
export const FRONT_V = 27           // the wings' front wall, v
export const BLOCK_HALF = 27.5      // the front's half-width
export const BLOCK_DEPTH = 18
export const SIDE_W = 10            // the side wings' width
export const SIDE_BACK = 52         // how far back from the front the side wings run
export const BASE_H = 1.1           // the plinth (rusticated courses)
export const EAVE = 12.8            // the cornice's top on the wings
export const BAL_H = 1.1            // the balustrade over it
export const MANSARD_TOP = 16.2
export const MANSARD_IN = 4.4
export const BAY = 3.6
export const GROUND_WIN = [1.6, 6.2]    // the arched windows, base, spring+top done in code
export const UPPER_WIN = [7.6, 11.6]
// ---- tunable: the pavilion
export const PAV_HALF = 7.6
export const PAV_OUT = 3.6          // how far it stands proud of the wings
export const PAV_PODIUM = 3.0       // the column plinths' height
export const PAV_STOREY = 7.4       // the first order's entablature
export const PAV_ORDER2 = 14.4      // the second order's entablature
export const PAV_PED = 3.1          // the pediment's rise
export const DOOR_W = 3.8
export const DOOR_TOP = 6.9
export const WIN_W = 4.4            // the great window
export const COL_R = 0.46
export const DOME_TOP = 23.4
export const STEPS = 5
// ---- tunable: the court roof and lantern
export const COURT_ROOF = 13
export const LANTERN = [-2, -9]     // octagon centre, u v (rel. axis)
export const LANTERN_R = 7.2
export const LANTERN_EAVE = 17.5
export const LANTERN_TOP = 23.2
// ---- tunable: the railing
export const RAIL_V = FRONT_V + 8.5
export const RAIL_H = 2.4
export const RAIL_EVERY = 0.38
// ---- tunable: colours
const STONE: Rgb = hex('#d8ccaa')
const STONE_D: Rgb = hex('#b9aa86')
const STONE_L: Rgb = hex('#e8dfc4')
const SLATE: Rgb = hex('#566070')
const SLATE_HI: Rgb = hex('#667284')
const ZINC: Rgb = hex('#8a98a4')
const GLASS: Rgb = [0.18, 0.23, 0.29]
const DOOR: Rgb = hex('#2b3a36')
const IRON: Rgb = [0.07, 0.07, 0.08]
const GILT: Rgb = hex('#d4a63a')
const PAVE: Rgb = hex('#6e6f72')

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
function normalOf(a: V3, b: V3, c: V3): V3 {
  const u = sub(b, a), v = sub(c, a)
  const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const l = Math.hypot(...n) || 1
  return [n[0] / l, n[1] / l, n[2] / l]
}
/** A sheet whose normal is taken from its corners and flipped to point up. */
function sheet(q: MeshBuilder, p: [V3, V3, V3, V3], col: Rgb): void {
  let n = normalOf(p[0], p[1], p[2])
  if (n[1] < 0) n = [-n[0], -n[1], -n[2]]
  q.quad(p, n, UV, col, FIXED)
}

/** A face: origin, tangent and outward normal on the plan; `at` gives a point s along, y up, d out. */
type Face = { o: P; t: P; n: P }
const at = (f: Face, s: number, y: number, d: number): V3 => [f.o[0] + f.t[0] * s + f.n[0] * d, y, f.o[1] + f.t[1] * s + f.n[1] * d]
const nrm = (f: Face): V3 => [f.n[0], 0, f.n[1]]
function rect(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, d: number, col: Rgb): void {
  q.quad([at(f, s0, y0, d), at(f, s1, y0, d), at(f, s1, y1, d), at(f, s0, y1, d)], nrm(f), UV, col, FIXED)
}
function tri(q: MeshBuilder, f: Face, a: P, b: P, c: P, d: number, col: Rgb): void {
  q.quad([at(f, a[0], a[1], d), at(f, b[0], b[1], d), at(f, c[0], c[1], d), at(f, c[0], c[1], d)], nrm(f), UV, col, FIXED)
}
/** A fan-filled arch-headed opening: rectangle to `spring`, a semicircle (squashed to `top`) over it. */
function arch(q: MeshBuilder, f: Face, sc: number, w: number, y0: number, spring: number, top: number, d: number, col: Rgb): void {
  rect(q, f, sc - w / 2, sc + w / 2, y0, spring, d, col)
  const r = w / 2, h = top - spring, N = 6
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N
    tri(q, f, [sc, spring], [sc - Math.cos(a0) * r, spring + Math.sin(a0) * h], [sc - Math.cos(a1) * r, spring + Math.sin(a1) * h], d, col)
  }
}
/** A horizontal run of balustrade: rails and posts. */
function balustrade(q: MeshBuilder, f: Face, s0: number, s1: number, y: number, h: number, d: number): void {
  rect(q, f, s0, s1, y, y + h * 0.18, d, STONE_L)
  rect(q, f, s0, s1, y + h * 0.18, y + h * 0.82, d - 0.05, STONE_D)
  rect(q, f, s0, s1, y + h * 0.82, y + h, d, STONE_L)
  for (let s = s0 + 0.35; s < s1 - 0.2; s += 0.9) rect(q, f, s - 0.12, s + 0.12, y + h * 0.18, y + h * 0.82, d + 0.02, STONE_L)
}
const FRONT = (): Face => ({ o: [-BLOCK_HALF, FRONT_V], t: [1, 0], n: [0, 1] })

/** A bay of a wing on `f` at s: arched ground-floor window, balconied upper window, a medallion on the spandrel. */
function wingBay(q: MeshBuilder, f: Face, s: number): void {
  const hw = 0.7
  // ground: arched window with a stone surround
  arch(q, f, s, 2 * hw + 0.55, GROUND_WIN[0] - 0.05, GROUND_WIN[1] - 0.8, GROUND_WIN[1] + 0.6, 0.05, STONE_L)
  arch(q, f, s, 2 * hw, GROUND_WIN[0], GROUND_WIN[1] - 0.8, GROUND_WIN[1], 0.1, GLASS)
  rect(q, f, s - 0.04, s + 0.04, GROUND_WIN[0], GROUND_WIN[1] - 0.8, 0.12, STONE_L)
  // upper: rectangular window with a surround, a balcony rail
  rect(q, f, s - hw - 0.25, s + hw + 0.25, UPPER_WIN[0] - 0.1, UPPER_WIN[1] + 0.45, 0.05, STONE_L)
  rect(q, f, s - hw, s + hw, UPPER_WIN[0], UPPER_WIN[1], 0.1, GLASS)
  rect(q, f, s - 0.04, s + 0.04, UPPER_WIN[0], UPPER_WIN[1], 0.12, STONE_L)
  rect(q, f, s - hw, s + hw, UPPER_WIN[1] - 1.3, UPPER_WIN[1] - 1.22, 0.12, STONE_L)
  balustrade(q, f, s - hw - 0.3, s + hw + 0.3, UPPER_WIN[0] - 0.05, 0.9, 0.3)
  rect(q, f, s - hw - 0.4, s + hw + 0.4, UPPER_WIN[0] - 0.25, UPPER_WIN[0] - 0.05, 0.34, STONE_L)
  // the pediment-less lintel over it
  rect(q, f, s - hw - 0.35, s + hw + 0.35, UPPER_WIN[1] + 0.45, UPPER_WIN[1] + 0.75, 0.12, STONE_D)
}

/** The mansard on a rectangle (u0..u1, v0..v1): lower steep slope, flat top; dormers on the sides named. */
function mansard(q: MeshBuilder, u0: number, u1: number, v0: number, v1: number, eave: number, top: number, inset: number, dormerSides: string): void {
  const ring = (i: number, y: number): V3[] => [[u0 + i, y, v0 + i], [u1 - i, y, v0 + i], [u1 - i, y, v1 - i], [u0 + i, y, v1 - i]]
  const inn = Math.min(inset, Math.min(u1 - u0, v1 - v0) / 2 - 0.3)
  const rE = ring(0.25, eave), rT = ring(inn, top)
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; sheet(q, [rE[i], rE[j], rT[j], rT[i]], SLATE) }
  sheet(q, [rT[0], rT[1], rT[2], rT[3]], SLATE_HI)
  // dormers: a stone front, glass, a hipped lid
  const sides: Record<string, Face & { L: number }> = {
    N: { o: [u0, v1], t: [1, 0], n: [0, 1], L: u1 - u0 }, S: { o: [u0, v0], t: [1, 0], n: [0, -1], L: u1 - u0 },
    E: { o: [u1, v0], t: [0, 1], n: [1, 0], L: v1 - v0 }, W: { o: [u0, v0], t: [0, 1], n: [-1, 0], L: v1 - v0 },
  }
  for (const k of dormerSides) {
    const f = sides[k]
    const nb = Math.max(1, Math.round(f.L / BAY))
    for (let i = 0; i < nb; i++) {
      const s = (i + 0.5) * f.L / nb
      const y0 = eave + (top - eave) * 0.18, d = inn * 0.28
      rect(q, f, s - 0.65, s + 0.65, y0, y0 + 1.7, d, STONE_L)
      rect(q, f, s - 0.4, s + 0.4, y0 + 0.25, y0 + 1.45, d + 0.04, GLASS)
      const a = at(f, s - 0.75, y0 + 1.7, d + 0.1), b = at(f, s + 0.75, y0 + 1.7, d + 0.1), c = at(f, s, y0 + 2.3, d - 0.7)
      sheet(q, [a, b, c, c], SLATE_HI)
    }
  }
  beam(q, [u0 + inn, top + 0.2, (v0 + v1) / 2], [u1 - inn, top + 0.2, (v0 + v1) / 2], 0.05, IRON)
}

/** The stone front: block, plinth, wings' bays and the cornice, one stretch along the front from s0 to s1 (u values). */
function frontStretch(q: MeshBuilder, u0: number, u1: number): void {
  const f = FRONT()
  const s0 = u0 - f.o[0], s1 = u1 - f.o[0]
  rect(q, f, s0, s1, 0, BASE_H, 0.12, STONE_D)
  for (let y = 0.45; y < BASE_H; y += 0.45) rect(q, f, s0, s1, y, y + 0.04, 0.14, shade(STONE_D, 0.8))
  // rustication on the ground storey
  for (let y = BASE_H + 0.7; y < 6.9; y += 0.7) rect(q, f, s0, s1, y, y + 0.05, 0.04, STONE_D)
  // the string course at the first floor and the cornice
  rect(q, f, s0, s1, 7.0, 7.3, 0.14, STONE_L)
  rect(q, f, s0, s1, EAVE - 0.9, EAVE, 0.4, STONE_L)
  rect(q, f, s0, s1, EAVE - 1.2, EAVE - 0.9, 0.25, STONE_D)
  balustrade(q, f, s0, s1, EAVE, BAL_H, 0.3)
  const nb = Math.max(1, Math.round((s1 - s0) / BAY))
  for (let i = 0; i < nb; i++) wingBay(q, f, s0 + (i + 0.5) * (s1 - s0) / nb)
}

function pavilion(q: MeshBuilder): void {
  const H = PAV_HALF, F = FRONT_V + PAV_OUT
  const f: Face = { o: [-H, F], t: [1, 0], n: [0, 1] }
  const W = 2 * H
  block(q, -H, H, FRONT_V - 0.2, F, 0, PAV_ORDER2, shade(STONE, 0.86))
  // the rusticated podium: banded courses to the first order's plinth line, steps at the door
  rect(q, f, 0, W, 0, PAV_PODIUM, 0.1, STONE_D)
  for (let y = 0.5; y < PAV_PODIUM; y += 0.5) rect(q, f, 0, W, y, y + 0.05, 0.12, shade(STONE_D, 0.78))
  rect(q, f, -0.2, W + 0.2, PAV_PODIUM, PAV_PODIUM + 0.3, 0.3, STONE_L)
  // the first storey: the door under an arched surround, a gilt-and-bronze leaf, panels each side
  const c = H
  arch(q, f, c, DOOR_W + 1.5, PAV_PODIUM - 0.1, DOOR_TOP - 1.4, DOOR_TOP + 1.3, 0.14, STONE_L)
  arch(q, f, c, DOOR_W, 0.0, DOOR_TOP - 1.9, DOOR_TOP, 0.2, DOOR)
  rect(q, f, c - 0.04, c + 0.04, 0.0, DOOR_TOP - 1.9, 0.24, GILT)
  rect(q, f, c - 0.9, c + 0.9, DOOR_TOP - 1.1, DOOR_TOP - 0.55, 0.26, GILT)     // the Paris ship arms over the door
  for (const sgn of [-1, 1]) {
    rect(q, f, c + sgn * 3.6 - 0.7, c + sgn * 3.6 + 0.7, PAV_PODIUM + 1.2, PAV_STOREY - 1.6, 0.15, STONE_D)
  }
  // the lintel with its inscription band, the first order's entablature
  rect(q, f, 0, W, PAV_STOREY - 0.9, PAV_STOREY, 0.55, STONE_L)
  rect(q, f, 1.2, W - 1.2, PAV_STOREY - 0.7, PAV_STOREY - 0.3, 0.6, STONE_D)
  // the great window: grilled glass in a stone frame, with a balcony
  const wc = c
  rect(q, f, wc - WIN_W / 2 - 0.4, wc + WIN_W / 2 + 0.4, PAV_STOREY + 0.3, PAV_ORDER2 - 1.6, 0.14, STONE_L)
  rect(q, f, wc - WIN_W / 2, wc + WIN_W / 2, PAV_STOREY + 1.0, PAV_ORDER2 - 2.0, 0.2, GLASS)
  for (let s = wc - WIN_W / 2 + 0.55; s < wc + WIN_W / 2 - 0.2; s += 0.55) rect(q, f, s - 0.03, s + 0.03, PAV_STOREY + 1.0, PAV_ORDER2 - 2.0, 0.22, IRON)
  for (let y = PAV_STOREY + 1.6; y < PAV_ORDER2 - 2.2; y += 0.55) rect(q, f, wc - WIN_W / 2, wc + WIN_W / 2, y, y + 0.03, 0.22, IRON)
  balustrade(q, f, wc - WIN_W / 2 - 0.6, wc + WIN_W / 2 + 0.6, PAV_STOREY + 0.1, 0.95, 0.55)
  rect(q, f, wc - WIN_W / 2 - 0.8, wc + WIN_W / 2 + 0.8, PAV_STOREY - 0.05, PAV_STOREY + 0.1, 0.62, STONE_L)
  // medallions on the side panels (the wreathed ovals)
  for (const sgn of [-1, 1]) rect(q, f, c + sgn * 5.5 - 0.6, c + sgn * 5.5 + 0.6, PAV_STOREY + 2.4, PAV_STOREY + 4.2, 0.18, STONE_D)
  // the second entablature, broken forward over the columns, and the pediment
  rect(q, f, -0.5, W + 0.5, PAV_ORDER2 - 1.1, PAV_ORDER2, 0.8, STONE_L)
  rect(q, f, -0.3, W + 0.3, PAV_ORDER2 - 1.6, PAV_ORDER2 - 1.1, 0.55, STONE_D)
  rect(q, f, -0.7, W + 0.7, PAV_ORDER2, PAV_ORDER2 + 0.35, 0.95, STONE_L)
  tri(q, f, [-0.7, PAV_ORDER2 + 0.35], [W + 0.7, PAV_ORDER2 + 0.35], [c, PAV_ORDER2 + 0.35 + PAV_PED], 0.95, STONE_L)
  tri(q, f, [0.9, PAV_ORDER2 + 0.6], [W - 0.9, PAV_ORDER2 + 0.6], [c, PAV_ORDER2 + PAV_PED - 0.3], 0.88, STONE_D)
  // columns: three each side of the door on the first order (the third set back), four on the second order
  const shaft = (x: number, z: number, y0: number, y1: number): void => { column(q, x, z, y0, y1, COL_R, STONE_L) }
  for (const sgn of [-1, 1]) {
    shaft(sgn * 3.55, F + 0.45, PAV_PODIUM + 0.3, PAV_STOREY - 0.9)
    shaft(sgn * 5.15, F + 0.45, PAV_PODIUM + 0.3, PAV_STOREY - 0.9)
    shaft(sgn * 6.75, F + 0.45, PAV_PODIUM + 0.3, PAV_STOREY - 0.9)
    shaft(sgn * 3.35, F + 0.45, PAV_STOREY, PAV_ORDER2 - 1.1)
    shaft(sgn * 5.0, F + 0.45, PAV_STOREY, PAV_ORDER2 - 1.1)
    shaft(sgn * 6.65, F + 0.45, PAV_STOREY, PAV_ORDER2 - 1.1)
  }
  // the dome-roof behind the pediment: a square drum of slate with a low zinc cap and a flag
  const yd = PAV_ORDER2 + 0.35
  block(q, -H + 0.6, H - 0.6, FRONT_V - 1.5, F - 1.2, PAV_ORDER2 - 1, yd + 1.2, STONE)
  const top = DOME_TOP
  const ringAt = (i: number, y: number): V3[] => [[-H + 0.6 + i, y, FRONT_V - 1.5 + i], [H - 0.6 - i, y, FRONT_V - 1.5 + i], [H - 0.6 - i, y, F - 1.2 - i], [-H + 0.6 + i, y, F - 1.2 - i]]
  const r0 = ringAt(0, yd + 1.2), r1 = ringAt(2.0, yd + 3.4), r2 = ringAt(4.2, top)
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; sheet(q, [r0[i], r0[j], r1[j], r1[i]], SLATE); sheet(q, [r1[i], r1[j], r2[j], r2[i]], ZINC) }
  sheet(q, [r2[0], r2[1], r2[2], r2[3]], ZINC)
  beam(q, [0, top, (FRONT_V - 1.5 + F - 1.2) / 2], [0, top + 3, (FRONT_V - 1.5 + F - 1.2) / 2], 0.05, IRON)
  // the shallow steps
  for (let k = 0; k < STEPS; k++) block(q, -DOOR_W / 2 - 1.2 - k * 0.5, DOOR_W / 2 + 1.2 + k * 0.5, F, F + 0.4 + (STEPS - k) * 0.4, 0, (k + 1) * 0.2, STONE_L)
}

/** The block, its two side wings, the court roof and the lantern. */
function body(q: MeshBuilder): void {
  const f0 = FRONT_V, b0 = FRONT_V - BLOCK_DEPTH, L = BLOCK_HALF
  const sideBack = FRONT_V - SIDE_BACK
  // walls
  block(q, -L, L, b0, f0, 0, EAVE, STONE)
  block(q, -L, -L + SIDE_W, sideBack, b0, 0, EAVE, STONE)
  block(q, L - SIDE_W, L, sideBack, b0, 0, EAVE, STONE)
  // the court roof: flat, with a parapet
  block(q, -L + SIDE_W, L - SIDE_W, sideBack + 6, b0 + 0.1, 0, COURT_ROOF, STONE)
  q.quad([[-L + SIDE_W, COURT_ROOF + 0.02, sideBack + 6], [L - SIDE_W, COURT_ROOF + 0.02, sideBack + 6], [L - SIDE_W, COURT_ROOF + 0.02, b0 + 0.1], [-L + SIDE_W, COURT_ROOF + 0.02, b0 + 0.1]], [0, 1, 0], UV, shade(SLATE, 1.15), FIXED)
  // roofs
  mansard(q, -L, L, b0, f0, EAVE + BAL_H * 0.3, MANSARD_TOP, MANSARD_IN, 'N')
  mansard(q, -L, -L + SIDE_W, sideBack, b0, EAVE, MANSARD_TOP - 1, 3, 'W')
  mansard(q, L - SIDE_W, L, sideBack, b0, EAVE, MANSARD_TOP - 1, 3, 'E')
  // the side-wing windows on the outer faces (rows of upper windows) and the rear
  for (const sgn of [-1, 1]) {
    const f: Face = sgn < 0 ? { o: [-L, sideBack], t: [0, 1], n: [-1, 0] } : { o: [L, b0], t: [0, -1], n: [1, 0] }
    const len = b0 - sideBack
    const nb = Math.round(len / BAY)
    for (let i = 0; i < nb; i++) {
      const s = (i + 0.5) * len / nb
      rect(q, f, s - 0.7, s + 0.7, 2.2, 5.6, 0.06, GLASS)
      rect(q, f, s - 0.7, s + 0.7, 7.6, 11.4, 0.06, GLASS)
    }
    rect(q, f, 0, len, EAVE - 0.9, EAVE, 0.35, STONE_L)
    rect(q, f, 0, len, 6.8, 7.1, 0.1, STONE_L)
  }
  // the glazed octagonal lantern over the inner hall
  const [lu, lv] = LANTERN
  const ring = (r: number, y: number): V3[] => Array.from({ length: 8 }, (_, k) => { const a = (k + 0.5) * Math.PI / 4; return [lu + Math.sin(a) * r, y, lv + Math.cos(a) * r] as V3 })
  const rb = ring(LANTERN_R, COURT_ROOF), re = ring(LANTERN_R - 0.2, LANTERN_EAVE), rt = ring(2.2, LANTERN_TOP)
  for (let k = 0; k < 8; k++) {
    const j = (k + 1) % 8
    sheet(q, [rb[k], rb[j], re[j], re[k]], GLASS)
    sheet(q, [re[k], re[j], rt[j], rt[k]], ZINC)
  }
  sheet(q, [rt[0], rt[1], rt[2], rt[3]], ZINC); sheet(q, [rt[4], rt[5], rt[6], rt[7]], ZINC); sheet(q, [rt[0], rt[3], rt[4], rt[7]], ZINC)
  // the lantern's ribs
  for (let k = 0; k < 8; k++) beam(q, [rb[k][0], COURT_ROOF, rb[k][2]], [re[k][0], LANTERN_EAVE, re[k][2]], 0.08, STONE_D)
}

/** The iron railing on the avenue: posts and bars, a stone dado, gilt flames on the pickets, piers with scrolls at the gate and the ends. */
function railing(q: MeshBuilder): void {
  const u0 = -BLOCK_HALF - 4, u1 = BLOCK_HALF + 4
  block(q, u0, u1, RAIL_V - 0.3, RAIL_V + 0.3, 0, 0.9, STONE_D)
  block(q, u0, u1, RAIL_V - 0.12, RAIL_V + 0.12, 0.9, 1.05, IRON)
  block(q, u0, u1, RAIL_V - 0.1, RAIL_V + 0.1, 2.25, 2.4, IRON)
  for (let u = u0 + RAIL_EVERY / 2; u < u1; u += RAIL_EVERY) {
    block(q, u - 0.03, u + 0.03, RAIL_V - 0.03, RAIL_V + 0.03, 1.05, RAIL_H, IRON)
    block(q, u - 0.05, u + 0.05, RAIL_V - 0.05, RAIL_V + 0.05, RAIL_H, RAIL_H + 0.28, GILT)
  }
  for (const u of [u0 + 0.4, -DOOR_W / 2 - 1.4, DOOR_W / 2 + 1.4, u1 - 0.4]) {
    block(q, u - 0.45, u + 0.45, RAIL_V - 0.45, RAIL_V + 0.45, 0, 3.0, STONE)
    block(q, u - 0.2, u + 0.2, RAIL_V - 0.2, RAIL_V + 0.2, 3.0, 3.5, GILT)
  }
  // the forecourt paving
  q.quad([[u0, 0.04, RAIL_V], [u1, 0.04, RAIL_V], [u1, 0.04, FRONT_V], [u0, 0.04, FRONT_V]], [0, 1, 0], UV, PAVE, FIXED)
}

export const HOTEL_POTOCKI_REFS = ['relation/1104615']

export function hotelPotocki(out: MeshBuilder): void {
  const first = out.positions.length / 3
  const q = new MeshBuilder()
  body(q)
  frontStretch(q, -BLOCK_HALF, -PAV_HALF)
  frontStretch(q, PAV_HALF, BLOCK_HALF)
  pavilion(q)
  railing(q)
  const c = Math.cos(TURN), s = Math.sin(TURN)
  into(out, q, [AXIS_U * c, AXIS_U * s], c, s)
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
