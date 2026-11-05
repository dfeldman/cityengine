import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { classicalColumn } from '../column.ts'
import { beam, block, hex, shade } from '../kit.ts'
import { into } from './louvre-palace.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL DE SAINT-FLORENTIN (Hôtel de Talleyrand; US consulate; 2 rue Saint-Florentin, 1er; OSM way/54177935): Chalgrin's hôtel of
 * 1767-69 on the corner of the Concorde, Rue de Rivoli and Rue Saint-Florentin. Read off Commons photographs ("Hôtel de Saint-Florentin
 * (34890590695)": the south front from the Tuileries terrace; "P1030437 Paris Ier rue Saint-Florentin n°2": the Doric screen of the court and the
 * north wing) and IGN's LiDAR HD surface model (cornice 18-19 m, the low zinc roof behind its balustrade 20-22 m, the lower annex on the east).
 *
 * The south front (the one the Place sees, 38.8 m): a basement of low barred lights, a rusticated ground storey of tall windows with iron
 * railings, a frieze of consoles on the piers, the piano nobile over a balustraded balcony band with pedimented windows (three bays of
 * pediments in the middle), the attic under the cornice, the stone balustrade, a low zinc roof and brick chimneys. Colour and storey lines agree with
 * Gabriel's palaces across the street (gabriel-palaces.ts: ground storey to 7.1 m, entablature 18.4-20.7 m): the balcony band here is at 7.0-8.0 m.
 * The court (24 x 17.5 m) opens west to Rue Saint-Florentin and is closed by a screen of free Doric columns round a central arched gate.
 *
 * Drawn in the south front's own frame (x east along Rue de Rivoli, z north along Rue Saint-Florentin; the south front stands at z = 0, outward
 * -z) with its south-west corner at the origin (48.8665724 N, 2.3236766 E), and turned 26.08 deg into the plan by `into`.
 */
// ---- tunable: the frame
export const TURN = (-26.08 * Math.PI) / 180
export const FLOOR = 0.0
// ---- tunable: the masses (x0, x1, z0, z1, eave = cornice's top, kind)
export type Mass = { x0: number; x1: number; z0: number; z1: number; eave: number; low?: boolean }
export const EAVE = 18.0          // the cornice's top; the lidar says 18-19
export const PARAPET = 1.5        // balustrade above it
export const RIDGE = 21.0         // the flat top of the zinc roof
export const MASSES: Mass[] = [
  { x0: 0, x1: 38.8, z0: 0, z1: 16.6, eave: EAVE },                       // the south wing, the front on the Concorde
  { x0: 24, x1: 38.7, z0: 16.4, z1: 37, eave: EAVE },                     // the east block, rue de Mondovi
  { x0: 24, x1: 34, z0: 37, z1: 56, eave: EAVE },
  { x0: -0.3, x1: 34, z0: 34.2, z1: 50.9, eave: EAVE },                   // the north wing
  { x0: 7.5, x1: 34, z0: 50.9, z1: 56, eave: EAVE },
  { x0: 34, x1: 38.6, z0: 37, z1: 56, eave: 10.5, low: true },            // the lower annex on the east (lidar 8-14 m)
]
// ---- tunable: the elevation (heights above the ground)
export const H = {
  basementTop: 1.9, basementSill: 0.5,
  groundSill: 2.7, groundTop: 6.0, railTop: 3.6, consoleTop: 6.5, string: 7.0,
  balconyTop: 8.0, nobileTop: 12.2, hood: 12.7, atticSill: 14.5, atticTop: 16.9, frieze: 17.0,
}
export const BAY_PITCH = 3.64     // the south front's bay (ten of them)
export const WIN_W = 1.3
export const PED_RISE = 1.0
export const RUST = 0.78          // rustication joints on the ground storey
// ---- tunable: the screen of the court (rue Saint-Florentin)
export const SCREEN_H = 6.6       // its entablature's underside
export const SCREEN_COLS = [18.9, 21.2, 23.0, 28.0, 29.8, 32.1]   // free Doric columns (z)
export const COL_R = 0.36
export const GATE = [23.7, 27.3]  // the arched gate's wall (z)
export const GATE_TOP = 5.3
// ---- tunable: colours
const STONE: Rgb = hex('#cbbb98')
const TRIM: Rgb = shade(STONE, 1.13)
const BAND: Rgb = shade(STONE, 0.8)
const DEEP: Rgb = shade(STONE, 0.62)
const GLASS: Rgb = [0.15, 0.17, 0.19]
const IRON: Rgb = [0.09, 0.09, 0.1]
const ZINC: Rgb = hex('#6f777b')
const BRICK: Rgb = hex('#8b5a48')
const GATE_C: Rgb = hex('#2e4a3d')

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
function sheet(q: MeshBuilder, p: [V3, V3, V3, V3], col: Rgb): void {
  const u = sub(p[1], p[0]), v = sub(p[2], p[0])
  let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const l = Math.hypot(...n) || 1
  n = [n[0] / l, n[1] / l, n[2] / l]
  if (n[1] < 0) n = [-n[0], -n[1], -n[2]]
  q.quad(p, n, UV, col, FIXED)
}

/** A face: its origin, tangent and outward normal on the plan; `at` gives a point s along, y up, d out. */
type Face = { o: P; t: P; n: P }
const at = (f: Face, s: number, y: number, d: number): V3 => [f.o[0] + f.t[0] * s + f.n[0] * d, y, f.o[1] + f.t[1] * s + f.n[1] * d]
const nrm = (f: Face): V3 => [f.n[0], 0, f.n[1]]
function rect(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, d: number, col: Rgb): void {
  q.quad([at(f, s0, y0, d), at(f, s1, y0, d), at(f, s1, y1, d), at(f, s0, y1, d)], nrm(f), UV, col, FIXED)
}
function tri(q: MeshBuilder, f: Face, a: P, b: P, c: P, d: number, col: Rgb): void {
  q.quad([at(f, a[0], a[1], d), at(f, b[0], b[1], d), at(f, c[0], c[1], d), at(f, c[0], c[1], d)], nrm(f), UV, col, FIXED)
}
/** a segmental or round head: a fan of `n` slices from the springing line */
function arch(q: MeshBuilder, f: Face, sc: number, w: number, y0: number, spring: number, top: number, d: number, col: Rgb): void {
  rect(q, f, sc - w / 2, sc + w / 2, y0, spring, d, col)
  const r = w / 2, h = top - spring, N = 6
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N
    tri(q, f, [sc, spring], [sc - Math.cos(a0) * r, spring + Math.sin(a0) * h], [sc - Math.cos(a1) * r, spring + Math.sin(a1) * h], d, col)
  }
}

export type Style = { bays: number; margin: number; pediments?: boolean; consoles?: boolean; balusters?: boolean; ground?: boolean }

/** One face's whole elevation (the mass behind it is a plain block): basement lights, the ground storey, the balcony band, the nobile, the attic, the cornice. */
function elevation(q: MeshBuilder, f: Face, L: number, st: Style, eave = EAVE): void {
  const top = Math.min(eave, EAVE)
  const pitch = (L - 2 * st.margin) / st.bays
  const hw = WIN_W / 2
  // rustication joints on the basement and ground storey
  for (let y = RUST; y < H.consoleTop - 0.2; y += RUST) rect(q, f, 0, L, y, y + 0.05, 0.02, BAND)
  // the plinth course under the ground storey and the string over it
  rect(q, f, -0.05, L + 0.05, H.consoleTop, H.string, 0.14, TRIM)
  // the piano nobile's string and the course under the attic
  rect(q, f, -0.05, L + 0.05, H.hood + 0.55, H.hood + 0.7, 0.07, BAND)
  // the cornice: frieze, modillion band, corona, and the balustrade's plinth
  rect(q, f, -0.05, L + 0.05, H.frieze, top - 0.55, 0.05, BAND)
  rect(q, f, -0.1, L + 0.1, top - 0.55, top - 0.25, 0.32, TRIM)
  rect(q, f, -0.15, L + 0.15, top - 0.25, top, 0.55, TRIM)
  // the quoins: rusticated piers at the corners
  rect(q, f, 0, 0.9, 0, top - 0.5, 0.06, TRIM)
  rect(q, f, L - 0.9, L, 0, top - 0.5, 0.06, TRIM)
  for (let i = 0; i < st.bays; i++) {
    const s = st.margin + (i + 0.5) * pitch
    const mid = st.pediments && i >= 3 && i <= 5
    // the basement's low barred light
    rect(q, f, s - 0.55, s + 0.55, H.basementSill, H.basementTop, 0.05, GLASS)
    rect(q, f, s - 0.55, s + 0.55, H.basementSill, H.basementTop, 0.1, IRON)
    rect(q, f, s - 0.5, s + 0.5, H.basementSill + 0.12, H.basementTop - 0.12, 0.11, GLASS)
    // the ground storey: a tall window with its railing
    rect(q, f, s - hw - 0.12, s + hw + 0.12, H.groundSill - 0.1, H.groundTop + 0.12, 0.06, BAND)
    rect(q, f, s - hw, s + hw, H.groundSill, H.groundTop, 0.1, GLASS)
    rect(q, f, s - 0.03, s + 0.03, H.groundSill, H.groundTop, 0.12, TRIM)
    rect(q, f, s - hw - 0.1, s + hw + 0.1, H.groundSill, H.railTop, 0.3, IRON)
    // a console at the head of each pier
    if (st.consoles) rect(q, f, s + pitch / 2 - 0.25, s + pitch / 2 + 0.25, H.consoleTop - 0.9, H.consoleTop, 0.12, TRIM)
    // the nobile's balcony: a stone balustrade the width of the window (the three middle bays run together)
    rect(q, f, s - hw - (mid ? pitch / 2 - hw : 0.18), s + hw + (mid ? pitch / 2 - hw : 0.18), H.string, H.balconyTop, 0.3, TRIM)
    rect(q, f, s - hw - 0.1, s + hw + 0.1, H.string + 0.2, H.balconyTop - 0.2, 0.31, BAND)
    // the nobile window, its architrave and its hood
    rect(q, f, s - hw - 0.16, s + hw + 0.16, H.balconyTop - 0.05, H.nobileTop + 0.1, 0.06, TRIM)
    rect(q, f, s - hw, s + hw, H.balconyTop + 0.1, H.nobileTop, 0.1, GLASS)
    rect(q, f, s - 0.04, s + 0.04, H.balconyTop + 0.1, H.nobileTop, 0.12, TRIM)
    rect(q, f, s - hw, s + hw, H.nobileTop - 1.2, H.nobileTop - 1.14, 0.12, TRIM)
    if (mid) {
      if (i === 4) arch(q, f, s, 2 * hw + 0.5, H.nobileTop + 0.1, H.nobileTop + 0.1, H.nobileTop + 0.1 + PED_RISE * 0.8, 0.2, TRIM)
      else tri(q, f, [s - hw - 0.35, H.nobileTop + 0.1], [s + hw + 0.35, H.nobileTop + 0.1], [s, H.nobileTop + 0.1 + PED_RISE], 0.22, TRIM)
      rect(q, f, s - hw - 0.35, s + hw + 0.35, H.nobileTop, H.nobileTop + 0.15, 0.24, TRIM)
    } else {
      rect(q, f, s - hw - 0.3, s + hw + 0.3, H.nobileTop, H.hood, 0.22, TRIM)
    }
    // the attic window, plainer, with a sill
    rect(q, f, s - 0.6 - 0.12, s + 0.6 + 0.12, H.atticSill - 0.08, H.atticTop + 0.1, 0.05, TRIM)
    rect(q, f, s - 0.6, s + 0.6, H.atticSill, H.atticTop, 0.09, GLASS)
    rect(q, f, s - 0.03, s + 0.03, H.atticSill, H.atticTop, 0.11, TRIM)
    rect(q, f, s - 0.75, s + 0.75, H.atticSill - 0.16, H.atticSill - 0.06, 0.16, TRIM)
  }
  // the balustrade: plinth, balusters as paired panels, rail
  const y0 = top, y1 = top + PARAPET
  rect(q, f, -0.1, L + 0.1, y0, y0 + 0.25, 0.3, TRIM)
  rect(q, f, -0.1, L + 0.1, y1 - 0.2, y1, 0.3, TRIM)
  rect(q, f, 0, L, y0 + 0.25, y1 - 0.2, 0.2, BAND)
  if (st.balusters) {
    const n = Math.round(L / 0.55)
    for (let i = 0; i < n; i++) {
      const s = (i + 0.5) * (L / n)
      rect(q, f, s - 0.1, s + 0.1, y0 + 0.25, y1 - 0.2, 0.22, TRIM)
    }
  }
}

const FRONT: Style = { bays: 10, margin: 1.2, pediments: true, consoles: true, balusters: true }
const FLANK = (bays: number): Style => ({ bays, margin: 1.0, consoles: true, balusters: true })
const COURT = (bays: number): Style => ({ bays, margin: 1.0 })
const PLAIN = (bays: number): Style => ({ bays, margin: 1.0 })

/** The mansard-less zinc roof: a low slope from just inside the balustrade to a flat top, and the chimneys. */
function roof(q: MeshBuilder, m: Mass): void {
  if (m.low) return
  const ring = (inset: number, y: number): V3[] => [
    [m.x0 + inset, y, m.z0 + inset], [m.x1 - inset, y, m.z0 + inset], [m.x1 - inset, y, m.z1 - inset], [m.x0 + inset, y, m.z1 - inset]]
  const w = Math.min(m.x1 - m.x0, m.z1 - m.z0)
  const rE = ring(0.35, m.eave + 0.2), rT = ring(Math.min(3.2, w / 2 - 0.3), RIDGE)
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; sheet(q, [rE[i], rE[j], rT[j], rT[i]], ZINC) }
  sheet(q, [rT[0], rT[1], rT[2], rT[3]], ZINC)
}
function chimney(q: MeshBuilder, x: number, z: number): void {
  block(q, x - 0.5, x + 0.5, z - 0.35, z + 0.35, RIDGE - 0.4, RIDGE + 2.2, BRICK)
  block(q, x - 0.6, x + 0.6, z - 0.45, z + 0.45, RIDGE + 2.2, RIDGE + 2.45, TRIM)
}

/** The court's end wall (the east block's west face): a portico of two columns over an arched door. */
function courtEnd(q: MeshBuilder): void {
  const f: Face = { o: [24, 16.4], t: [0, 1], n: [-1, 0] }
  elevation(q, f, 18.4, COURT(5))
  const sc = 9.2
  arch(q, f, sc, 2.6, 0, 3.3, 5.1, 0.14, DEEP)
  arch(q, f, sc, 2.2, 0, 3.2, 4.8, 0.17, GATE_C)
  for (const s of [sc - 2.0, sc + 2.0]) classicalColumn(q, 24 - 0.9, 16.4 + s, 0, 5.3, 0.3, TRIM, { order: 'doric', tier: 'mid' })
  block(q, 24 - 1.2, 24, 16.4 + sc - 2.5, 16.4 + sc + 2.5, 5.3, 5.8, TRIM)
}

/** The screen on Rue Saint-Florentin: piers at the ends, free Doric columns, iron grilles, the gate in its wall, an entablature. */
function screen(q: MeshBuilder): void {
  const x = -0.55
  const z0 = 16.7, z1 = 34.2
  const f: Face = { o: [x, 0], t: [0, 1], n: [-1, 0] }
  // end piers
  for (const [a, b] of [[z0, z0 + 1.4], [z1 - 1.4, z1]]) block(q, x - 0.5, x + 0.5, a, b, 0, SCREEN_H, STONE)
  // the gate's wall
  block(q, x - 0.3, x + 0.4, GATE[0], GATE[1], 0, SCREEN_H, STONE)
  const gc = (GATE[0] + GATE[1]) / 2
  arch(q, f, gc, 2.6, 0.2, 3.2, GATE_TOP + 0.4, 0.34, DEEP)
  arch(q, f, gc, 2.3, 0.2, 3.2, GATE_TOP, 0.37, GATE_C)
  rect(q, f, gc - 0.04, gc + 0.04, 0.2, 3.9, 0.39, IRON)
  rect(q, f, gc - 0.3, gc + 0.3, GATE_TOP + 0.05, GATE_TOP + 0.65, 0.4, TRIM)
  // grilles between the columns
  for (const [a, b] of [[z0 + 1.4, GATE[0]], [GATE[1], z1 - 1.4]]) {
    rect(q, f, a, b, 0.3, 3.4, 0.0, IRON)
    block(q, x - 0.1, x + 0.1, a, b, 0, 0.3, BAND)
  }
  for (const z of SCREEN_COLS) classicalColumn(q, x - 0.35, z, 0.2, SCREEN_H, COL_R, TRIM, { order: 'doric', tier: 'mid' })
  // entablature, cornice, parapet
  block(q, x - 0.9, x + 0.5, z0 - 0.1, z1 + 0.1, SCREEN_H, SCREEN_H + 0.7, TRIM)
  block(q, x - 1.05, x + 0.5, z0 - 0.15, z1 + 0.15, SCREEN_H + 0.7, SCREEN_H + 1.0, STONE)
  block(q, x - 0.7, x + 0.3, z0, z1, SCREEN_H + 1.0, SCREEN_H + 1.5, BAND)
}

export const HOTEL_SAINT_FLORENTIN_REFS = ['way/54177935']

export function hotelSaintFlorentin(out: MeshBuilder): void {
  const first = out.positions.length / 3
  const q = new MeshBuilder()
  for (const m of MASSES) {
    block(q, m.x0, m.x1, m.z0, m.z1, 0, m.eave, STONE)
    roof(q, m)
  }
  // the annex's parapet
  block(q, 34, 38.6, 37, 56, 10.5, 11.2, BAND)
  // ---- the fronts
  elevation(q, { o: [0, 0], t: [1, 0], n: [0, -1] }, 38.8, FRONT)                                  // the Concorde / Rivoli front
  elevation(q, { o: [38.7, 0], t: [0, 1], n: [1, 0] }, 37, FLANK(10))                                  // rue de Mondovi
  elevation(q, { o: [0, 0], t: [0, 1], n: [-1, 0] }, 16.6, FLANK(4))                                   // rue Saint-Florentin, the south wing's end
  elevation(q, { o: [-0.3, 34.2], t: [0, 1], n: [-1, 0] }, 16.7, FLANK(4))                            // ... the north wing's end
  elevation(q, { o: [7.5, 56], t: [1, 0], n: [0, 1] }, 26.5, PLAIN(7))                                // the north side
  elevation(q, { o: [-0.3, 50.9], t: [1, 0], n: [0, 1] }, 7.8, PLAIN(2))
  elevation(q, { o: [7.5, 50.9], t: [0, 1], n: [-1, 0] }, 5.0, PLAIN(1))
  // the court
  elevation(q, { o: [0, 16.6], t: [1, 0], n: [0, 1] }, 24, COURT(7))
  elevation(q, { o: [0, 34.2], t: [1, 0], n: [0, -1] }, 24, COURT(7))
  courtEnd(q)
  screen(q)
  // iron crest and chimneys on the roofs
  for (const [x, z] of [[8, 5], [19, 5], [30, 5], [8, 11], [30, 11], [28, 25], [30, 44], [16, 41], [16, 47], [4, 41]] as P[]) chimney(q, x, z)
  beam(q, [8, RIDGE + 0.4, 8], [31, RIDGE + 0.4, 8], 0.05, IRON)
  into(out, q, [0, 0], Math.cos(TURN), Math.sin(TURN))
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
