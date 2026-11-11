import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { beam, block, column, hex, shade } from '../kit.ts'
import { into } from './louvre-palace.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL DE GÜNZBURG / GUNSBURG (7 rue de Tilsitt, 17e; Hittorff's plans of 1853 built by Rohault de Fleury 1868 for Baron Joseph de Günzburg; Second Empire;
 * MH 1983; OSM way/84323015; now a hotel behind the Étoile). Read off Commons photographs ("Paris 17 - Hôtel de Gunsburg 7 rue de Tilsitt -373", "-372", "Hôtel de Gunsburg, 14
 * February 2012"): an ashlar street front behind a black iron railing, two shallow corner pavilions with canted oriels under taller hipped zinc roofs, between them
 * arched carriage gates either side of a great arched entry (a glazed rotunda in it) with carved trophies, reclining river figures, a balconied pair of arched
 * windows held by two caryatids, a pediment, a second-floor pair with iron balconies, a modillion cornice and a blue-grey zinc mansard with dormers and a pedimented
 * oculus dormer; teal bronze caryatids bearing lamps on the ground. The garden front (from the Arc) is a long block of 13 bays with a glass conservatory in the garden.
 * IGN LiDAR HD surface model (tools/ign-mns.ts at 48.87505 N, 2.2955 E): main roofs 17-20 m, the pavilion tops 20-23 m, an octagonal glass lantern at about 21 m inside.
 *
 * Drawn in the street's frame (u along rue de Tilsitt, which runs 21 deg south of east here; v out toward the street) and turned into the plan by `into`.
 */
// ---- tunable: the frame
export const TURN = (-21 * Math.PI) / 180
export const ANCHOR: P = [8, 12.5]    // the frame's origin in plan metres east/north of the entry's lat/lon
export const FLOOR = 0.4
// ---- tunable: plan (street frame)
export const U0 = -17.5               // the front's left end
export const U1 = 11.5                // and right end
export const FRONT_V = 4              // the street wall
export const BLOCK_DEPTH = 14
export const PAV_W = 6.4              // corner pavilions' width
export const PAV_OUT = 1.1            // how far they stand proud
export const WING_W = 7.2             // side wings' width
export const BACK_V = -27             // the garden wall
export const REAR_DEPTH = 7
// ---- tunable: heights
export const GROUND_TOP = 5.6         // the ground storey's course
export const FIRST_TOP = 11.4         // the first floor's entablature
export const EAVE = 16.4              // top of the modillion cornice
export const MANSARD_TOP = 20.4
export const MANSARD_IN = 4.2
export const PAV_TOP = 22.8
export const GATE_W = 3.4
export const ENTRY_W = 5.4
export const ENTRY_TOP = 5.0
export const CARY_H = 2.6             // the bronze lamp-bearers
export const PED_RISE = 1.5
// ---- tunable: court
export const COURT_ROOF = 13
export const LANTERN: P = [-3, -18]
export const LANTERN_R = 5.2
export const LANTERN_EAVE = 17.2
export const LANTERN_TOP = 21
// ---- tunable: railing
export const RAIL_OUT = 4.4           // railing stands this far out of the front
export const RAIL_H = 2.2
export const RAIL_EVERY = 0.4
// ---- tunable: colours
const STONE: Rgb = hex('#dccfae')
const STONE_D: Rgb = hex('#bfb08c')
const STONE_L: Rgb = hex('#ebe2c8')
const ZINC: Rgb = hex('#8d97a4')
const ZINC_HI: Rgb = hex('#a2abb6')
const GLASS: Rgb = [0.2, 0.25, 0.3]
const GLASS_LIT: Rgb = hex('#6d7c82')
const IRON: Rgb = [0.06, 0.06, 0.07]
const GILT: Rgb = hex('#c9a14a')
const BRONZE: Rgb = hex('#4a8a82')
const PAVE: Rgb = hex('#77736a')
const BRICK: Rgb = hex('#9a6a52')

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
function normalOf(a: V3, b: V3, c: V3): V3 {
  const u = sub(b, a), v = sub(c, a)
  const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const l = Math.hypot(...n) || 1
  return [n[0] / l, n[1] / l, n[2] / l]
}
function sheet(q: MeshBuilder, p: [V3, V3, V3, V3], col: Rgb): void {
  let n = normalOf(p[0], p[1], p[2])
  if (n[1] < 0) n = [-n[0], -n[1], -n[2]]
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
/** a balcony: slab with an iron rail */
function balcony(q: MeshBuilder, f: Face, s0: number, s1: number, y: number, d: number, stone: boolean): void {
  rect(q, f, s0, s1, y - 0.22, y, d, STONE_L)
  if (stone) {
    rect(q, f, s0, s1, y, y + 0.9, d - 0.05, STONE_D)
    rect(q, f, s0, s1, y + 0.8, y + 0.95, d, STONE_L)
    for (let s = s0 + 0.4; s < s1 - 0.2; s += 0.7) rect(q, f, s - 0.1, s + 0.1, y, y + 0.8, d + 0.02, STONE_L)
  } else {
    rect(q, f, s0, s1, y + 0.05, y + 0.1, d, IRON); rect(q, f, s0, s1, y + 0.9, y + 0.95, d, IRON)
    for (let s = s0 + 0.15; s < s1; s += 0.3) rect(q, f, s - 0.02, s + 0.02, y + 0.1, y + 0.9, d, IRON)
  }
}
/** a window: stone surround, glass, mullion, optional pediment, optional iron balcony */
function window(q: MeshBuilder, f: Face, sc: number, w: number, y0: number, y1: number, opt: { arched?: boolean; ped?: boolean; bal?: 'iron' | 'stone' }): void {
  const sp = y1 - w / 2
  if (opt.arched) {
    arch(q, f, sc, w + 0.5, y0 - 0.05, sp, y1 + 0.28, 0.08, STONE_L)
    arch(q, f, sc, w, y0, sp, y1, 0.14, GLASS)
  } else {
    rect(q, f, sc - w / 2 - 0.22, sc + w / 2 + 0.22, y0 - 0.1, y1 + 0.3, 0.08, STONE_L)
    rect(q, f, sc - w / 2, sc + w / 2, y0, y1, 0.14, GLASS)
  }
  rect(q, f, sc - 0.04, sc + 0.04, y0, y1 - (opt.arched ? 0.6 : 0), 0.16, STONE_L)
  rect(q, f, sc - w / 2, sc + w / 2, y0 + (y1 - y0) * 0.62, y0 + (y1 - y0) * 0.62 + 0.05, 0.16, STONE_L)
  if (opt.ped) {
    const t = y1 + 0.35
    rect(q, f, sc - w / 2 - 0.45, sc + w / 2 + 0.45, t, t + 0.2, 0.18, STONE_L)
    tri(q, f, [sc - w / 2 - 0.45, t + 0.2], [sc + w / 2 + 0.45, t + 0.2], [sc, t + 0.2 + 0.55], 0.18, STONE_L)
  }
  if (opt.bal) balcony(q, f, sc - w / 2 - 0.35, sc + w / 2 + 0.35, y0 + 0.05, 0.4, opt.bal === 'stone')
}
function dormer(q: MeshBuilder, f: Face, s: number, y0: number, d: number, w: number, big: boolean): void {
  const h = big ? 2.4 : 1.8
  rect(q, f, s - w / 2 - 0.3, s + w / 2 + 0.3, y0, y0 + h, d, STONE_L)
  rect(q, f, s - w / 2, s + w / 2, y0 + 0.25, y0 + h - 0.35, d + 0.05, GLASS)
  rect(q, f, s - 0.04, s + 0.04, y0 + 0.25, y0 + h - 0.35, d + 0.07, STONE_L)
  const a = at(f, s - w / 2 - 0.45, y0 + h, d + 0.1), b = at(f, s + w / 2 + 0.45, y0 + h, d + 0.1), c = at(f, s, y0 + h + 0.9, d - 0.5)
  sheet(q, [a, b, c, c], ZINC_HI)
}

/** A hipped/mansard roof over a rectangle; `top` flat part inset `inset`. Dormers on the named sides. */
function mansard(q: MeshBuilder, u0: number, u1: number, v0: number, v1: number, eave: number, top: number, inset: number, dormerSides: string, dbay = 3.0): void {
  const ring = (i: number, y: number): V3[] => [[u0 + i, y, v0 + i], [u1 - i, y, v0 + i], [u1 - i, y, v1 - i], [u0 + i, y, v1 - i]]
  const inn = Math.min(inset, Math.min(u1 - u0, v1 - v0) / 2 - 0.3)
  const rE = ring(0.2, eave), rT = ring(inn, top)
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; sheet(q, [rE[i], rE[j], rT[j], rT[i]], ZINC) }
  sheet(q, [rT[0], rT[1], rT[2], rT[3]], ZINC_HI)
  const sides: Record<string, Face & { L: number }> = {
    N: { o: [u0, v1], t: [1, 0], n: [0, 1], L: u1 - u0 }, S: { o: [u0, v0], t: [1, 0], n: [0, -1], L: u1 - u0 },
    E: { o: [u1, v0], t: [0, 1], n: [1, 0], L: v1 - v0 }, W: { o: [u0, v0], t: [0, 1], n: [-1, 0], L: v1 - v0 },
  }
  for (const k of dormerSides) {
    const f = sides[k]
    const nb = Math.max(1, Math.round(f.L / dbay))
    for (let i = 0; i < nb; i++) dormer(q, f, (i + 0.5) * f.L / nb, eave + (top - eave) * 0.14, inn * 0.24, 0.8, false)
  }
}

const FRONT = (): Face => ({ o: [U0, FRONT_V], t: [1, 0], n: [0, 1] })
const PAVS: [number, number][] = [[U0, U0 + PAV_W], [U1 - PAV_W, U1]]
const MID0 = U0 + PAV_W, MID1 = U1 - PAV_W
const CENTRE = (MID0 + MID1) / 2

/** horizontal courses over [s0, s1] of face f (stone body is a block behind) */
function courses(q: MeshBuilder, f: Face, s0: number, s1: number, d: number): void {
  rect(q, f, s0, s1, 0, 0.9, d + 0.12, STONE_D)
  for (let y = 1.3; y < GROUND_TOP - 0.4; y += 0.65) rect(q, f, s0, s1, y, y + 0.05, d + 0.03, STONE_D)       // ground-storey rustication
  rect(q, f, s0, s1, GROUND_TOP - 0.45, GROUND_TOP + 0.2, d + 0.12, STONE_L)
  rect(q, f, s0, s1, FIRST_TOP - 0.5, FIRST_TOP + 0.1, d + 0.1, STONE_L)
  rect(q, f, s0, s1, EAVE - 1.2, EAVE - 0.4, d + 0.2, STONE_D)                                                // frieze
  rect(q, f, s0, s1, EAVE - 0.4, EAVE, d + 0.45, STONE_L)                                                     // cornice
  for (let s = s0 + 0.3; s < s1 - 0.1; s += 0.7) rect(q, f, s - 0.12, s + 0.12, EAVE - 0.95, EAVE - 0.4, d + 0.3, STONE_L)  // modillions
}

function frontWall(q: MeshBuilder): void {
  const S = (u: number): number => u - U0
  // body
  block(q, U0, U1, FRONT_V - BLOCK_DEPTH, FRONT_V, 0, EAVE, STONE)
  // pavilions
  for (const [a, b] of PAVS) {
    block(q, a, b, FRONT_V - 0.2, FRONT_V + PAV_OUT, 0, EAVE, shade(STONE, 0.97))
    const pf: Face = { o: [U0, FRONT_V + PAV_OUT], t: [1, 0], n: [0, 1] }
    courses(q, pf, S(a), S(b), 0)
    const c = S((a + b) / 2)
    window(q, pf, c, 1.3, 1.6, 4.8, { arched: false })
    // canted oriels on the first and second floors
    block(q, (a + b) / 2 - 1.5, (a + b) / 2 + 1.5, FRONT_V + PAV_OUT, FRONT_V + PAV_OUT + 0.7, 5.6, 14.6, STONE_L)
    for (const [y0, y1] of [[6.7, 10.4], [12.2, 14.9]]) {
      rect(q, pf, c - 1.1, c + 1.1, y0, y1, 0.74, GLASS)
      rect(q, pf, c - 0.04, c + 0.04, y0, y1, 0.76, STONE_L)
      rect(q, pf, c - 1.25, c + 1.25, y1 + 0.05, y1 + 0.3, 0.76, STONE_D)
    }
    rect(q, pf, c - 1.7, c + 1.7, 14.6, 14.9, 0.8, STONE_L)
    // corner quoins
    for (const e of [S(a) + 0.35, S(b) - 0.35]) rect(q, pf, e - 0.35, e + 0.35, 0.9, EAVE - 1.2, 0.06, STONE_D)
  }
  // between: the wings of the front and the centre
  const mf: Face = { o: [U0, FRONT_V], t: [1, 0], n: [0, 1] }
  courses(q, mf, S(MID0), S(MID1), 0)
  const gates = [MID0 + (CENTRE - ENTRY_W / 2 - 1.4 - MID0) / 2, MID1 - (MID1 - CENTRE - ENTRY_W / 2 - 1.4) / 2]
  for (const g of gates) {
    const c = S(g)
    arch(q, mf, c, GATE_W + 0.8, 0.9, 3.4, 5.1, 0.14, STONE_L)
    arch(q, mf, c, GATE_W, 0.9, 3.2, 4.8, 0.2, IRON)
    for (let s = c - GATE_W / 2 + 0.3; s < c + GATE_W / 2 - 0.1; s += 0.3) rect(q, mf, s - 0.02, s + 0.02, 0.9, 3.2, 0.24, GILT)
    // first floor: blind aedicule panel with pediment
    rect(q, mf, c - 1.7, c + 1.7, 6.7, 10.2, 0.1, STONE_D)
    rect(q, mf, c - 1.45, c + 1.45, 6.95, 9.95, 0.14, STONE_L)
    rect(q, mf, c - 1.9, c + 1.9, 10.2, 10.45, 0.2, STONE_L)
    tri(q, mf, [c - 1.9, 10.45], [c + 1.9, 10.45], [c, 10.45 + 0.8], 0.2, STONE_L)
    // second floor: a window with an iron balcony
    window(q, mf, c, 1.2, 12.3, 14.6, { arched: true, bal: 'iron' })
  }
  // the centre: entry, trophies, caryatids, balcony, pair of windows, pediment
  const c = S(CENTRE)
  arch(q, mf, c, ENTRY_W + 1.6, 0.9, ENTRY_TOP - 1.2, ENTRY_TOP + 1.0, 0.16, STONE_L)
  arch(q, mf, c, ENTRY_W, 0.9, ENTRY_TOP - 1.9, ENTRY_TOP, 0.22, GLASS_LIT)
  rect(q, mf, c - 0.04, c + 0.04, 0.9, ENTRY_TOP - 1.9, 0.26, GILT)
  // the glazed rotunda in the entry
  for (let k = 0; k < 6; k++) {
    const a0 = Math.PI * k / 6 - Math.PI / 2 + 0, a1 = Math.PI * (k + 1) / 6 - Math.PI / 2
    q.quad([at(mf, c + Math.sin(a0) * 1.7, 0.9, 0.4 + Math.cos(a0) * 0.9), at(mf, c + Math.sin(a1) * 1.7, 0.9, 0.4 + Math.cos(a1) * 0.9), at(mf, c + Math.sin(a1) * 1.7, 3.5, 0.4 + Math.cos(a1) * 0.9), at(mf, c + Math.sin(a0) * 1.7, 3.5, 0.4 + Math.cos(a0) * 0.9)],
      [mf.n[0], 0, mf.n[1]], UV, shade(GILT, 0.8), FIXED)
  }
  rect(q, mf, c - 1.8, c + 1.8, 3.5, 3.9, 0.45, BRONZE)
  // carved trophy panels each side of the entry, and carved pilaster strips
  for (const sgn of [-1, 1]) {
    rect(q, mf, c + sgn * 4.6 - 0.9, c + sgn * 4.6 + 0.9, 1.8, 5.0, 0.1, STONE_D)
    rect(q, mf, c + sgn * 4.6 - 0.55, c + sgn * 4.6 + 0.55, 2.2, 4.6, 0.14, STONE_L)
    rect(q, mf, c + sgn * (ENTRY_W / 2 + 0.55) - 0.3, c + sgn * (ENTRY_W / 2 + 0.55) + 0.3, 1.0, ENTRY_TOP + 0.5, 0.2, STONE_L)
    // the bronze lamp-bearers on plinths at the foot
    const s = c + sgn * (ENTRY_W / 2 + 1.7)
    block(q, mf.o[0] + s - 0.35, mf.o[0] + s + 0.35, FRONT_V + 0.5, FRONT_V + 1.2, 0, 0.9, STONE_D)
    column(q, mf.o[0] + s, FRONT_V + 0.85, 0.9, 0.9 + CARY_H, 0.24, BRONZE)
    block(q, mf.o[0] + s - 0.22, mf.o[0] + s + 0.22, FRONT_V + 0.63, FRONT_V + 1.07, 0.9 + CARY_H, 0.9 + CARY_H + 0.4, GILT)
  }
  // the lintel with the sculptor's signature and the reclining river figures
  rect(q, mf, c - ENTRY_W / 2 - 1.5, c + ENTRY_W / 2 + 1.5, GROUND_TOP - 0.5, GROUND_TOP, 0.4, STONE_L)
  rect(q, mf, c - ENTRY_W / 2 - 0.6, c + ENTRY_W / 2 + 0.6, GROUND_TOP, GROUND_TOP + 0.9, 0.5, STONE)
  rect(q, mf, c - 2.4, c + 2.4, GROUND_TOP + 0.2, GROUND_TOP + 0.9, 0.62, STONE_L)
  // first floor: balcony, two arched windows, caryatids
  balcony(q, mf, c - 3.5, c + 3.5, GROUND_TOP + 1.2, 0.8, true)
  rect(q, mf, c - 3.7, c + 3.7, GROUND_TOP + 0.9, GROUND_TOP + 1.0, 0.85, STONE_L)
  for (const sgn of [-1, 1]) {
    window(q, mf, c + sgn * 1.25, 1.6, GROUND_TOP + 1.6, 9.6, { arched: true })
    column(q, mf.o[0] + c + sgn * 3.15, FRONT_V + 0.45, GROUND_TOP + 1.2, 9.5, 0.38, STONE_L)
    block(q, mf.o[0] + c + sgn * 3.15 - 0.45, mf.o[0] + c + sgn * 3.15 + 0.45, FRONT_V + 0.05, FRONT_V + 0.85, GROUND_TOP + 1.2, GROUND_TOP + 1.5, STONE_D)
  }
  // a pediment over the pair, then the second-floor pair with balconies
  rect(q, mf, c - 3.9, c + 3.9, 10.4, 10.7, 0.3, STONE_L)
  tri(q, mf, [c - 3.9, 10.7], [c + 3.9, 10.7], [c, 10.7 + PED_RISE], 0.3, STONE_L)
  tri(q, mf, [c - 2.7, 10.75], [c + 2.7, 10.75], [c, 10.75 + PED_RISE * 0.6], 0.32, STONE_D)
  for (const sgn of [-1, 1]) window(q, mf, c + sgn * 1.25, 1.2, 12.3, 14.8, { arched: true, bal: 'iron' })
  rect(q, mf, c - 3.2, c + 3.2, 11.9, 15.4, 0.06, shade(STONE, 0.95))
}

/** the street's wall's mansards: a long zinc roof between taller hipped pavilions, the oculus dormer in the middle. */
function frontRoofs(q: MeshBuilder): void {
  const f = FRONT()
  mansard(q, MID0, MID1, FRONT_V - BLOCK_DEPTH, FRONT_V, EAVE, MANSARD_TOP, MANSARD_IN, 'N', 3.6)
  for (const [a, b] of PAVS) mansard(q, a, b, FRONT_V - BLOCK_DEPTH, FRONT_V + PAV_OUT, EAVE, PAV_TOP, 2.6, 'N')
  // the pedimented oculus dormer
  const c = CENTRE - U0
  rect(q, f, c - 1.6, c + 1.6, EAVE + 0.4, EAVE + 3.6, 1.2, STONE_L)
  rect(q, f, c - 0.9, c + 0.9, EAVE + 1.0, EAVE + 2.8, 1.3, GLASS)
  rect(q, f, c - 1.9, c + 1.9, EAVE + 3.6, EAVE + 3.8, 1.4, STONE_L)
  tri(q, f, [c - 1.9, EAVE + 3.8], [c + 1.9, EAVE + 3.8], [c, EAVE + 5.0], 1.4, STONE_L)
  // chimneys
  for (const u of [U0 + 9, U1 - 9, CENTRE - 3, CENTRE + 3]) block(q, u - 0.5, u + 0.5, FRONT_V - 8.5, FRONT_V - 7.5, MANSARD_TOP - 0.2, MANSARD_TOP + 2.2, BRICK)
}

/** wings, rear block, court roof and lantern; bays on the outer faces and the garden front */
function body(q: MeshBuilder): void {
  const vb = FRONT_V - BLOCK_DEPTH
  block(q, U0, U0 + WING_W, BACK_V, vb, 0, EAVE, STONE)
  block(q, U1 - WING_W, U1, BACK_V, vb, 0, EAVE, STONE)
  block(q, U0, U1, BACK_V, BACK_V + REAR_DEPTH, 0, EAVE, STONE)
  // the court roof
  const cu0 = U0 + WING_W, cu1 = U1 - WING_W, cv0 = BACK_V + REAR_DEPTH, cv1 = vb + 0.1
  block(q, cu0, cu1, cv0, cv1, 0, COURT_ROOF, STONE)
  q.quad([[cu0, COURT_ROOF + 0.02, cv0], [cu1, COURT_ROOF + 0.02, cv0], [cu1, COURT_ROOF + 0.02, cv1], [cu0, COURT_ROOF + 0.02, cv1]], [0, 1, 0], UV, shade(ZINC, 0.9), FIXED)
  // roofs
  mansard(q, U0, U0 + WING_W, BACK_V, vb, EAVE, MANSARD_TOP - 0.6, 2.6, 'W')
  mansard(q, U1 - WING_W, U1, BACK_V, vb, EAVE, MANSARD_TOP - 0.6, 2.6, 'E')
  mansard(q, U0, U1, BACK_V, BACK_V + REAR_DEPTH, EAVE, MANSARD_TOP, MANSARD_IN, 'S', 3.0)
  // side faces: window rows
  for (const sgn of [-1, 1]) {
    const f: Face = sgn < 0 ? { o: [U0, BACK_V], t: [0, 1], n: [-1, 0] } : { o: [U1, vb], t: [0, -1], n: [1, 0] }
    const len = vb - BACK_V
    const nb = Math.round(len / 3.2)
    for (let i = 0; i < nb; i++) {
      const s = (i + 0.5) * len / nb
      for (const [y0, y1] of [[1.5, 4.7], [6.9, 10.5], [12.2, 14.9]]) {
        rect(q, f, s - 0.62, s + 0.62, y0 - 0.08, y1 + 0.12, 0.04, STONE_L)
        rect(q, f, s - 0.55, s + 0.55, y0, y1, 0.08, GLASS)
      }
    }
    rect(q, f, 0, len, EAVE - 1.2, EAVE, 0.3, STONE_L)
    rect(q, f, 0, len, 5.6, 5.9, 0.12, STONE_L); rect(q, f, 0, len, FIRST_TOP - 0.4, FIRST_TOP, 0.12, STONE_L)
  }
  // the garden front: 13 bays, arched ground, balconied first, pavilion ends, the glass conservatory and the garden railing
  const g: Face = { o: [U1, BACK_V], t: [-1, 0], n: [0, -1] }
  const W = U1 - U0, nb = 13
  rect(q, g, 0, W, 0, 0.8, 0.12, STONE_D)
  rect(q, g, 0, W, 5.6, 5.9, 0.12, STONE_L); rect(q, g, 0, W, FIRST_TOP - 0.4, FIRST_TOP, 0.12, STONE_L)
  rect(q, g, 0, W, EAVE - 1.2, EAVE, 0.3, STONE_L)
  for (let i = 0; i < nb; i++) {
    const s = (i + 0.5) * W / nb
    const mid = Math.abs(i - 6) <= 1
    if (!mid || i !== 6) window(q, g, s, 1.15, 1.2, 4.9, { arched: true })
    window(q, g, s, 1.15, 6.9, 10.6, { ped: i % 3 === 0 })
    window(q, g, s, 1.0, 12.4, 14.9, { bal: 'iron' })
  }
  // the conservatory
  const cu = (U0 + U1) / 2 - 3
  block(q, cu - 4.5, cu + 4.5, BACK_V - 5.2, BACK_V - 0.1, 0, 0.5, STONE_D)
  block(q, cu - 4.5, cu + 4.5, BACK_V - 5.2, BACK_V - 0.1, 0.5, 4.2, GLASS)
  block(q, cu - 4.7, cu + 4.7, BACK_V - 5.4, BACK_V + 0.1, 4.2, 4.5, IRON)
  for (let k = 0; k <= 6; k++) block(q, cu - 4.5 + k * 1.5 - 0.05, cu - 4.5 + k * 1.5 + 0.05, BACK_V - 5.25, BACK_V - 5.15, 0.5, 4.2, IRON)
  // the octagonal lantern
  const [lu, lv] = LANTERN
  const ring = (r: number, y: number): V3[] => Array.from({ length: 8 }, (_, k) => { const a = (k + 0.5) * Math.PI / 4; return [lu + Math.sin(a) * r, y, lv + Math.cos(a) * r] as V3 })
  const rb = ring(LANTERN_R, COURT_ROOF), re = ring(LANTERN_R - 0.2, LANTERN_EAVE), rt = ring(1.6, LANTERN_TOP)
  for (let k = 0; k < 8; k++) {
    const j = (k + 1) % 8
    sheet(q, [rb[k], rb[j], re[j], re[k]], GLASS)
    sheet(q, [re[k], re[j], rt[j], rt[k]], ZINC)
    beam(q, [rb[k][0], COURT_ROOF, rb[k][2]], [re[k][0], LANTERN_EAVE, re[k][2]], 0.07, STONE_D)
  }
  sheet(q, [rt[0], rt[1], rt[2], rt[3]], ZINC); sheet(q, [rt[4], rt[5], rt[6], rt[7]], ZINC); sheet(q, [rt[0], rt[3], rt[4], rt[7]], ZINC)
}

/** the black iron railing: dado, bars, gilt points, stone piers at the gates; and the forecourt paving. */
function railing(q: MeshBuilder): void {
  const u0 = U0 - 1.5, u1 = U1 + 1.5, rv = FRONT_V + RAIL_OUT
  block(q, u0, u1, rv - 0.25, rv + 0.25, 0, 0.6, STONE_D)
  block(q, u0, u1, rv - 0.1, rv + 0.1, 0.6, 0.72, IRON)
  block(q, u0, u1, rv - 0.08, rv + 0.08, RAIL_H - 0.12, RAIL_H, IRON)
  for (let u = u0 + RAIL_EVERY / 2; u < u1; u += RAIL_EVERY) {
    block(q, u - 0.025, u + 0.025, rv - 0.025, rv + 0.025, 0.72, RAIL_H, IRON)
    block(q, u - 0.045, u + 0.045, rv - 0.045, rv + 0.045, RAIL_H, RAIL_H + 0.25, GILT)
  }
  for (const u of [u0 + 0.35, MID0 + 0.4, MID1 - 0.4, u1 - 0.35]) {
    block(q, u - 0.35, u + 0.35, rv - 0.35, rv + 0.35, 0, 2.6, STONE)
    block(q, u - 0.17, u + 0.17, rv - 0.17, rv + 0.17, 2.6, 3.0, GILT)
  }
  q.quad([[u0, 0.04, rv], [u1, 0.04, rv], [u1, 0.04, FRONT_V], [u0, 0.04, FRONT_V]], [0, 1, 0], UV, PAVE, FIXED)
}

export const HOTEL_GUNSBURG_REFS = ['way/84323015']

export function hotelGunsburg(out: MeshBuilder): void {
  const first = out.positions.length / 3
  const q = new MeshBuilder()
  body(q)
  frontWall(q)
  frontRoofs(q)
  railing(q)
  const c = Math.cos(TURN), s = Math.sin(TURN)
  into(out, q, [ANCHOR[0], ANCHOR[1]], c, s)
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
