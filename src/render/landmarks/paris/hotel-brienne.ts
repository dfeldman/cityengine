import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { block, hex, shade } from '../kit.ts'
import { into } from './louvre-palace.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL DE BRIENNE (14-16 rue Saint-Dominique, 7e; Debias-Aubry 1724, later Mme Mère, now the Ministry of the Armed Forces; OSM way/65090118).
 * Read off Commons: "Hôtel Brienne - Paris VII - 2024-08-07 - 1" (the gate at no. 16 and the street front), "Brienne facade 1",
 * "Jielbeaumadier hotel de brienne exterieur paris 2008" (the court front: seven arched ground openings, tall first-floor windows with balconies,
 * a three-bay pedimented avant-corps, hipped slate); IGN LiDAR HD surface model (tools/ign-mns.ts at 48.8598 N, 2.3192 E): the Duret street block
 * 13-14 m, the low street wing 8-10 m, court wings 10 and 14 m, the main block 15-18 m, an open court about 40 x 18 m.
 *
 * Drawn in the street's frame: x along rue Saint-Dominique (running east-south-east), z inward (north-north-east) from the street front;
 * turned into the plan by `into`. Only the stone hôtel is drawn; the Ministry's later wings in the rest of the OSM outline are not.
 */
// ---- tunable: the frame (the street wall at its lidar position, the street's bearing from OSM)
export const TURN = (-28.2 * Math.PI) / 180
export const ORIGIN: P = [-0.7, -26.3]   // metres east/north of the entry's lat/lon at local (0, 0)
export const FLOOR = 0.5
// ---- tunable: the Duret block with the great gate (no. 16)
export const DURET_X0 = -58, DURET_X1 = -36, DURET_D = 20
export const DURET_EAVE = 10.3, DURET_TOP = 13.8, DURET_IN = 3.0
export const GATE_X = -47
export const GATE_W = 3.5, GATE_SPRING = 4.4, GATE_TOP = 5.7
export const GATE_RING = 1.6
// ---- tunable: the street wing and the court gate
export const STREET_X0 = -36, STREET_X1 = 34, STREET_D = 8
export const STREET_EAVE = 6.9, STREET_TOP = 9.6, STREET_IN = 2.2
export const COURT_GATE_X = 1.5, COURT_GATE_W = 3.6, COURT_GATE_TOP = 4.6
// ---- tunable: court wings and the main block
export const WWING_X0 = -28, WWING_X1 = -19, WWING_Z1 = 29, WWING_EAVE = 7.4, WWING_TOP = 10.4
export const EWING_X0 = 22, EWING_X1 = 37, EWING_Z1 = 48, EWING_EAVE = 11.0, EWING_TOP = 14.6
export const MAIN_X0 = -13, MAIN_X1 = 22, MAIN_Z0 = 29, MAIN_Z1 = 50
export const MAIN_EAVE = 12.2, MAIN_TOP = 16.6, MAIN_IN = 4.2
export const LINK_X0 = -28, LINK_X1 = -13, LINK_EAVE = 10.0, LINK_TOP = 12.8
export const BAYS = 9
export const AVANT = 3             // central bays under the pediment
export const AVANT_OUT = 1.1
export const PED_H = 3.0
export const ARCH_TOP = 5.3        // ground openings' crown
export const FIRST_SILL = 6.3, FIRST_HEAD = 11.0
export const STRING = 5.9
// ---- tunable: colours
const STONE: Rgb = hex('#d9cba0')
const STONE_D: Rgb = hex('#c4b588')
const STONE_L: Rgb = hex('#e6dbb8')
const WALL_LO: Rgb = hex('#d1be93')
const SLATE: Rgb = hex('#454c59')
const SLATE_HI: Rgb = hex('#535b69')
const GLASS: Rgb = [0.3, 0.34, 0.4]
const DOOR: Rgb = hex('#1f5a56')
const DOOR_D: Rgb = hex('#174642')
const IRON: Rgb = [0.07, 0.07, 0.08]
const GRAVEL: Rgb = hex('#b8ab8f')
const CHIMNEY: Rgb = hex('#cbbd98')

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
function sheet(q: MeshBuilder, p: [V3, V3, V3, V3], col: Rgb): void {
  const u = sub(p[1], p[0]), v = sub(p[2], p[0])
  let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const l = Math.hypot(...n) || 1
  n = [n[0] / l, n[1] / l, n[2] / l]
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
/** An arch-headed panel: a rectangle to `spring`, a squashed semicircle fan to `top`. */
function arch(q: MeshBuilder, f: Face, sc: number, w: number, y0: number, spring: number, top: number, d: number, col: Rgb): void {
  rect(q, f, sc - w / 2, sc + w / 2, y0, spring, d, col)
  const r = w / 2, h = top - spring, N = 6
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N
    tri(q, f, [sc, spring], [sc - Math.cos(a0) * r, spring + Math.sin(a0) * h], [sc - Math.cos(a1) * r, spring + Math.sin(a1) * h], d, col)
  }
}
function ledge(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, out: number, col: Rgb): void {
  rect(q, f, s0, s1, y0, y1, out, col)
  sheet(q, [at(f, s0, y1, 0), at(f, s1, y1, 0), at(f, s1, y1, out), at(f, s0, y1, out)], shade(col, 0.92))
}
function strip(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, d: number, step = 0.6): void {
  rect(q, f, s0, s1, y0, y1, d, STONE_D)
  for (let y = y0 + step; y < y1 - 0.1; y += step) rect(q, f, s0, s1, y, y + 0.07, d + 0.02, shade(STONE_D, 0.72))
}
/** A tall window with a stone surround, a sill and a balcony rail. */
function tallWin(q: MeshBuilder, f: Face, s: number, y0: number, y1: number, w: number, d: number, rail: boolean, round = false): void {
  rect(q, f, s - w / 2 - 0.2, s + w / 2 + 0.2, y0 - 0.12, y1 + 0.25, d + 0.03, STONE_L)
  if (round) {
    arch(q, f, s, w + 0.5, y0 - 0.1, y1 - w / 2 - 0.1, y1 + 0.3, d + 0.03, STONE_L)
    arch(q, f, s, w, y0, y1 - w / 2, y1, d + 0.08, GLASS)
  } else rect(q, f, s - w / 2, s + w / 2, y0, y1, d + 0.08, GLASS)
  rect(q, f, s - 0.03, s + 0.03, y0, y1 - (round ? w / 2 : 0), d + 0.1, STONE_L)
  rect(q, f, s - w / 2, s + w / 2, y0 + (y1 - y0) * 0.55, y0 + (y1 - y0) * 0.55 + 0.06, d + 0.1, STONE_L)
  if (rail) {
    rect(q, f, s - w / 2 - 0.15, s + w / 2 + 0.15, y0 + 0.9, y0 + 0.97, d + 0.32, IRON)
    rect(q, f, s - w / 2 - 0.15, s + w / 2 + 0.15, y0, y0 + 0.07, d + 0.32, IRON)
    for (let k = -2; k <= 2; k++) rect(q, f, s + k * w / 5 - 0.02, s + k * w / 5 + 0.02, y0, y0 + 0.95, d + 0.31, IRON)
  }
  ledge(q, f, s - w / 2 - 0.3, s + w / 2 + 0.3, y0 - 0.22, y0 - 0.1, d + 0.18, STONE_L)
}

/** A hipped mansard on a rectangle: steep slope to a flat top, inset `inset`. */
function mansard(q: MeshBuilder, u0: number, u1: number, v0: number, v1: number, eave: number, top: number, inset: number): void {
  const inn = Math.min(inset, Math.min(u1 - u0, v1 - v0) / 2 - 0.2)
  const ring = (i: number, y: number): V3[] => [[u0 + i, y, v0 + i], [u1 - i, y, v0 + i], [u1 - i, y, v1 - i], [u0 + i, y, v1 - i]]
  const rE = ring(0.1, eave), rT = ring(inn, top)
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; sheet(q, [rE[i], rE[j], rT[j], rT[i]], SLATE) }
  sheet(q, [rT[0], rT[1], rT[2], rT[3]], SLATE_HI)
}
const chimney = (q: MeshBuilder, x: number, z: number, y: number): void => {
  block(q, x - 0.6, x + 0.6, z - 0.4, z + 0.4, y - 0.2, y + 1.8, CHIMNEY)
  block(q, x - 0.7, x + 0.7, z - 0.5, z + 0.5, y + 1.8, y + 2.0, STONE_D)
}
/** A dormer on the street slope of a mansard whose eave is at z = 0.1: a stone box with a window and a small gable. */
function dormer(q: MeshBuilder, x: number, eave: number, top: number, inn: number, frac: number): void {
  const y = eave + (top - eave) * frac, z = 0.1 + (inn - 0.1) * frac
  block(q, x - 0.6, x + 0.6, z - 0.2, z + 1.0, y - 0.1, y + 1.2, STONE_L)
  const f: Face = { o: [0, z - 0.2], t: [1, 0], n: [0, -1] }
  rect(q, f, x - 0.4, x + 0.4, y + 0.1, y + 1.0, 0.03, GLASS)
  rect(q, f, x - 0.03, x + 0.03, y + 0.1, y + 1.0, 0.05, STONE_L)
  sheet(q, [[x - 0.7, y + 1.2, z - 0.3], [x + 0.7, y + 1.2, z - 0.3], [x + 0.7, y + 1.5, z + 0.6], [x - 0.7, y + 1.5, z + 0.6]], SLATE)
}

const SOUTH = (x0: number, z0: number): Face => ({ o: [x0, z0], t: [1, 0], n: [0, -1] })
const NORTH = (x1: number, z1: number): Face => ({ o: [x1, z1], t: [-1, 0], n: [0, 1] })
const EAST = (x1: number, z0: number): Face => ({ o: [x1, z0], t: [0, 1], n: [1, 0] })
const WEST = (x0: number, z1: number): Face => ({ o: [x0, z1], t: [0, -1], n: [-1, 0] })

/** The great gate of no. 16: a relieving arch on rusticated piers with masks, the arched inner ring, green leaves with a fanlight. */
function greatGate(q: MeshBuilder, f: Face, gc: number): void {
  const w = GATE_W, ring = GATE_RING, out = w + 2 * ring
  strip(q, f, gc - out / 2 - 0.2, gc - w / 2, 0.5, GATE_SPRING + 0.4, 0.22, 0.5)
  strip(q, f, gc + w / 2, gc + out / 2 + 0.2, 0.5, GATE_SPRING + 0.4, 0.22, 0.5)
  rect(q, f, gc - out / 2 - 0.3, gc + out / 2 + 0.3, 0, 0.5, 0.26, STONE_D)
  // the recessed tympanum of the big arch, the arch ring, the inner arch ring
  arch(q, f, gc, out + 0.4, GATE_SPRING + 0.35, GATE_SPRING + 0.4, GATE_TOP + ring + 0.6, 0.12, shade(STONE_D, 0.86))
  arch(q, f, gc, out - 0.4, GATE_SPRING, GATE_SPRING + 0.4, GATE_TOP + ring + 0.2, 0.16, shade(STONE, 0.94))
  arch(q, f, gc, w + 0.6, 0.5, GATE_SPRING, GATE_TOP + 0.3, 0.3, STONE_L)
  arch(q, f, gc, w, 0.5, GATE_SPRING, GATE_TOP, 0.34, DOOR)
  // transom, leaves and their panels
  rect(q, f, gc - w / 2, gc + w / 2, 3.15, 3.28, 0.38, DOOR_D)
  rect(q, f, gc - 0.03, gc + 0.03, 0.5, 3.15, 0.38, DOOR_D)
  for (const sg of [-1, 1]) for (const [y0, y1] of [[0.9, 2.9], [0.7, 0.85]]) {
    const a = gc + sg * 0.18, b = gc + sg * (w / 2 - 0.2)
    rect(q, f, Math.min(a, b), Math.max(a, b), y0, y1, 0.37, DOOR_D)
  }
  rect(q, f, gc - w / 2 + 0.2, gc + w / 2 - 0.2, GATE_SPRING, GATE_SPRING + 0.7, 0.37, GLASS)
  // the cartouche in the arch and the masks on the imposts
  rect(q, f, gc - 0.55, gc + 0.55, GATE_TOP + 0.5, GATE_TOP + 1.4, 0.4, shade(STONE, 0.8))
  rect(q, f, gc - 0.8, gc + 0.8, GATE_TOP + 1.3, GATE_TOP + 1.5, 0.38, STONE_L)
  for (const sg of [-1, 1]) {
    const c = gc + sg * (out / 2 - 0.35)
    rect(q, f, c - 0.4, c + 0.4, GATE_SPRING - 1.6, GATE_SPRING + 0.2, 0.34, shade(STONE, 0.82))
    ledge(q, f, c - 0.7, c + 0.7, GATE_SPRING + 0.2, GATE_SPRING + 0.5, 0.45, STONE_L)
  }
}

/** A street front of `len` along `f`: bays of two or three storeys, each with a ground window and tall upper windows; `gates` leaves a gap. */
function streetBays(q: MeshBuilder, f: Face, s0: number, s1: number, pitch: number, storeys: 2 | 3, eave: number, skip: (s: number) => boolean): void {
  const n = Math.max(1, Math.round((s1 - s0) / pitch)), bay = (s1 - s0) / n
  rect(q, f, s0, s1, 0, 0.8, 0.06, shade(STONE_D, 0.85))
  ledge(q, f, s0, s1, STRING - 0.2, STRING + 0.12, 0.2, STONE_L)
  ledge(q, f, s0, s1, eave - 0.5, eave + 0.05, 0.42, STONE_L)
  if (storeys === 3) ledge(q, f, s0, s1, 8.4, 8.55, 0.16, STONE_L)
  for (let i = 0; i < n; i++) {
    const s = s0 + (i + 0.5) * bay
    if (skip(s)) continue
    const w = Math.min(1.25, bay - 1.5)
    tallWin(q, f, s, 1.0, 3.7, w, 0.04, false)
    tallWin(q, f, s, STRING + 0.55, STRING + 3.0, w, 0.04, true, false)
    if (storeys === 3) tallWin(q, f, s, 8.9, eave - 0.9, w, 0.04, false)
  }
  // quoin strips at the ends
  strip(q, f, s0, s0 + 0.55, 0.8, eave - 0.5, 0.08)
  strip(q, f, s1 - 0.55, s1, 0.8, eave - 0.5, 0.08)
}

/** A court or garden front on a seven/nine-bay block: arched ground openings, tall first-floor windows, a pedimented avant-corps. */
function mainFront(q: MeshBuilder, f: Face, len: number, door: boolean): void {
  const bay = len / BAYS, a0 = (BAYS - AVANT) / 2 * bay, a1 = a0 + AVANT * bay
  rect(q, f, 0, len, 0, 0.6, 0.05, STONE_D)
  rect(q, f, a0 - 0.3, a1 + 0.3, 0.3, STRING + 0.1, AVANT_OUT, STONE)
  ledge(q, f, 0, len, STRING - 0.2, STRING + 0.12, 0.2, STONE_L)
  ledge(q, f, a0 - 0.3, a1 + 0.3, STRING - 0.25, STRING + 0.14, AVANT_OUT + 0.2, STONE_L)
  // rusticated pilasters at the corners and the avant-corps' sides
  for (const [x0, x1] of [[0, 0.8], [len - 0.8, len]]) strip(q, f, x0, x1, 0.6, MAIN_EAVE - 0.7, 0.1, 0.65)
  for (const [x0, x1, d] of [[a0 - 0.3, a0 + 0.3, AVANT_OUT + 0.08], [a1 - 0.3, a1 + 0.3, AVANT_OUT + 0.08]]) strip(q, f, x0, x1, 0.6, MAIN_EAVE - 0.7, d, 0.65)
  for (let i = 0; i < BAYS; i++) {
    const s = (i + 0.5) * bay, c = i >= (BAYS - AVANT) / 2 && i < (BAYS + AVANT) / 2
    const d = c ? AVANT_OUT + 0.02 : 0.04
    const w = bay - 1.55
    // ground: an arched window (the middle one a door to the steps)
    const mid = i === Math.floor(BAYS / 2)
    const g0 = mid && door ? 0.55 : 0.9
    arch(q, f, s, w + 0.5, g0 - 0.1, ARCH_TOP - 1.2, ARCH_TOP + 0.15, d + 0.03, STONE_L)
    arch(q, f, s, w, g0, ARCH_TOP - 1.2, ARCH_TOP, d + 0.07, mid && door ? DOOR_D : GLASS)
    rect(q, f, s - 0.03, s + 0.03, g0, ARCH_TOP - 1.2, d + 0.09, STONE_L)
    rect(q, f, s - w / 2, s + w / 2, ARCH_TOP - 1.25, ARCH_TOP - 1.17, d + 0.09, STONE_L)
    rect(q, f, s - 0.3, s + 0.3, ARCH_TOP + 0.15, ARCH_TOP + 0.55, d + 0.1, shade(STONE, 0.85)) // keystone mask
    // first floor: a tall window, balcony rail
    tallWin(q, f, s, FIRST_SILL, FIRST_HEAD, w - 0.05, d, true)
  }
  if (door) {
    const s = (Math.floor(BAYS / 2) + 0.5) * bay
    for (let k = 0; k < 4; k++) {
      const e = AVANT_OUT + 0.6 + k * 0.28
      sheet(q, [at(f, s - 2.2, 0.15 * (3 - k) + 0.05, e), at(f, s + 2.2, 0.15 * (3 - k) + 0.05, e), at(f, s + 2.2, 0.15 * (3 - k) + 0.05, e + 0.28), at(f, s - 2.2, 0.15 * (3 - k) + 0.05, e + 0.28)], GRAVEL)
    }
  }
  // the cornice, frieze, and the pediment over the avant-corps
  ledge(q, f, 0, len, MAIN_EAVE - 0.9, MAIN_EAVE, 0.55, STONE_L)
  rect(q, f, 0, len, MAIN_EAVE - 1.5, MAIN_EAVE - 0.9, 0.08, shade(STONE, 0.95))
  ledge(q, f, a0 - 0.5, a1 + 0.5, MAIN_EAVE - 0.95, MAIN_EAVE + 0.05, AVANT_OUT + 0.7, STONE_L)
  const pm = len / 2, ph = (a1 - a0) / 2 + 0.6
  tri(q, f, [pm - ph, MAIN_EAVE + 0.05], [pm + ph, MAIN_EAVE + 0.05], [pm, MAIN_EAVE + 0.05 + PED_H], AVANT_OUT + 0.65, STONE_L)
  tri(q, f, [pm - ph + 0.5, MAIN_EAVE + 0.2], [pm + ph - 0.5, MAIN_EAVE + 0.2], [pm, MAIN_EAVE + PED_H - 0.4], AVANT_OUT + 0.7, shade(STONE, 0.9))
  rect(q, f, pm - 0.5, pm + 0.5, MAIN_EAVE + 0.5, MAIN_EAVE + 1.3, AVANT_OUT + 0.75, shade(STONE, 0.75)) // the cartouche
  // consoles over the pilasters
  for (let i = 0; i <= BAYS; i += 1) {
    const s = i * bay
    if (i > 0 && i < BAYS && !(i === (BAYS - AVANT) / 2 || i === (BAYS + AVANT) / 2)) continue
    rect(q, f, Math.max(0, s - 0.3), Math.min(len, s + 0.3), MAIN_EAVE - 1.5, MAIN_EAVE - 0.9, 0.12 + (i === 0 || i === BAYS ? 0 : AVANT_OUT), shade(STONE_D, 0.9))
  }
}
/** The pediment's two raking faces on the roof: the gable seen from the side is a small prism on the slate. */
function pedimentRoof(q: MeshBuilder, x0: number, x1: number, z0: number, d: number): void {
  const y0 = MAIN_EAVE + 0.05
  sheet(q, [[x0, y0, z0 - d], [x0, y0, z0 + 3], [(x0 + x1) / 2, y0 + PED_H, z0 + 3], [(x0 + x1) / 2, y0 + PED_H, z0 - d]], SLATE_HI)
  sheet(q, [[x1, y0, z0 - d], [x1, y0, z0 + 3], [(x0 + x1) / 2, y0 + PED_H, z0 + 3], [(x0 + x1) / 2, y0 + PED_H, z0 - d]], SLATE_HI)
}

/** The wings' plain faces: two storeys of tall windows. */
function plainFace(q: MeshBuilder, f: Face, len: number, pitch: number, eave: number): void {
  const n = Math.max(1, Math.round(len / pitch)), bay = len / n
  rect(q, f, 0, len, 0, 0.6, 0.05, STONE_D)
  ledge(q, f, 0, len, eave - 0.5, eave, 0.4, STONE_L)
  const upper = eave > 9
  ledge(q, f, 0, len, upper ? STRING - 0.2 : 3.9, upper ? STRING + 0.1 : 4.1, 0.15, STONE_L)
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) * bay, w = Math.min(1.25, bay - 1.5)
    if (upper) {
      tallWin(q, f, s, 0.9, ARCH_TOP - 0.7, w, 0.04, false, true)
      tallWin(q, f, s, FIRST_SILL, eave - 1.7, w, 0.04, true)
    } else { tallWin(q, f, s, 0.9, 3.5, w, 0.04, false, true); tallWin(q, f, s, 4.5, eave - 1.0, w, 0.04, true) }
  }
}

// ---- tunable: the Ministry's plain massing in the rest of the OSM outline, traced from the lidar [x0, x1, z0, z1, height] in the street frame
export const FILL: [number, number, number, number, number][] = [[-65,-62,-4,-1,20],[-62,-56,-4,-1,18],[-56,-47,-4,-1,14],[-47,-38,-4,-1,12],[-35,-32,-4,-1,10],[-65,-59,-1,2,20],[34,37,-1,2,8],[34,37,2,5,10],[34,37,5,8,20],[-17,-2,8,11,8],[10,19,8,11,8],[-68,-65,17,20,12],[-65,-62,17,20,14],[-62,-59,17,20,12],[-32,-29,20,23,8],[-59,-47,20,23,12],[-47,-44,20,23,14],[-11,-8,26,29,12],[16,22,26,29,12],[-71,-65,35,38,16],[-71,-68,38,41,14],[-68,-56,38,41,16],[-56,-53,38,41,14],[-53,-50,38,41,10],[-50,-47,38,41,16],[-47,-35,38,41,10],[-65,-47,41,44,16],[-47,-29,41,44,10],[-44,-38,44,47,10],[-38,-32,44,47,12],[-32,-29,44,47,10],[-29,-26,47,50,14],[-26,-20,47,50,16],[-20,-17,47,50,14],[-17,-14,47,50,16],[-26,-23,50,53,14],[-2,1,50,53,10],[1,7,50,53,16],[7,10,50,53,6],[10,19,50,53,14],[22,28,50,53,14],[28,31,50,53,8],[31,37,50,53,14]]
export const FILL_STOREY = 3.3, FILL_PITCH = 3.2, FILL_WIN_W = 1.1
const WALL_MIN: Rgb = hex('#cfc3a6')
const ZINC: Rgb = hex('#7f8791')
/** The Ministry's later wings: limestone boxes, a zinc roof slab, rows of plain windows on faces that look onto open ground. */
function ministry(q: MeshBuilder): void {
  const taken = (x: number, z: number): boolean =>
    FILL.some(([a, b, c, d]) => x > a + 0.2 && x < b - 0.2 && z > c + 0.2 && z < d - 0.2) ||
    [[DURET_X0, DURET_X1, 0, DURET_D], [STREET_X0, STREET_X1, 0, STREET_D], [WWING_X0, WWING_X1, STREET_D, WWING_Z1], [EWING_X0, EWING_X1, STREET_D, EWING_Z1], [MAIN_X0, MAIN_X1, MAIN_Z0, MAIN_Z1], [LINK_X0, LINK_X1, MAIN_Z0 - 8, MAIN_Z1 - 4]].some(([a, b, c, d]) => x > a && x < b && z > c && z < d)
  for (const [x0, x1, z0, z1, h] of FILL) {
    block(q, x0, x1, z0, z1, 0, h, WALL_MIN)
    block(q, x0, x1, z0, z1, h, h + 0.35, ZINC)
    const faces: [Face, number, P][] = [[SOUTH(x0, z0), x1 - x0, [(x0 + x1) / 2, z0 - 1.5]], [NORTH(x1, z1), x1 - x0, [(x0 + x1) / 2, z1 + 1.5]], [EAST(x1, z0), z1 - z0, [x1 + 1.5, (z0 + z1) / 2]], [WEST(x0, z1), z1 - z0, [x0 - 1.5, (z0 + z1) / 2]]]
    for (const [f, len, probe] of faces) {
      if (len < 3 || taken(probe[0], probe[1])) continue
      const n = Math.max(1, Math.floor(len / FILL_PITCH)), bay = len / n
      for (let i = 0; i < n; i++) for (let y = 1.0; y + 1.8 < h; y += FILL_STOREY) rect(q, f, (i + 0.5) * bay - FILL_WIN_W / 2, (i + 0.5) * bay + FILL_WIN_W / 2, y, y + 1.8, 0.03, GLASS)
    }
  }
}

function buildings(q: MeshBuilder): void {
  const E = STONE
  ministry(q)
  // ---- walls
  block(q, DURET_X0, DURET_X1, 0, DURET_D, 0, DURET_EAVE, E)
  block(q, STREET_X0, STREET_X1, 0, STREET_D, 0, STREET_EAVE, E)
  block(q, WWING_X0, WWING_X1, STREET_D, WWING_Z1, 0, WWING_EAVE, E)
  block(q, LINK_X0, LINK_X1, MAIN_Z0 - 8, MAIN_Z1 - 4, 0, LINK_EAVE, E)
  block(q, EWING_X0, EWING_X1, STREET_D, EWING_Z1, 0, EWING_EAVE, E)
  block(q, MAIN_X0, MAIN_X1, MAIN_Z0, MAIN_Z1, 0, MAIN_EAVE, E)
  // ---- roofs
  mansard(q, DURET_X0, DURET_X1, 0, DURET_D, DURET_EAVE, DURET_TOP, DURET_IN)
  mansard(q, STREET_X0, STREET_X1, 0, STREET_D, STREET_EAVE, STREET_TOP, STREET_IN)
  mansard(q, WWING_X0, WWING_X1, STREET_D, WWING_Z1, WWING_EAVE, WWING_TOP, 2.2)
  mansard(q, LINK_X0, LINK_X1, MAIN_Z0 - 8, MAIN_Z1 - 4, LINK_EAVE, LINK_TOP, 3.0)
  mansard(q, EWING_X0, EWING_X1, STREET_D, EWING_Z1, EWING_EAVE, EWING_TOP, 3.2)
  mansard(q, MAIN_X0, MAIN_X1, MAIN_Z0, MAIN_Z1, MAIN_EAVE, MAIN_TOP, MAIN_IN)
  const pm = (MAIN_X0 + MAIN_X1) / 2, ph = (MAIN_X1 - MAIN_X0) / BAYS * AVANT / 2 + 0.6
  pedimentRoof(q, pm - ph, pm + ph, MAIN_Z0, AVANT_OUT + 0.65)
  pedimentRoof(q, pm - ph, pm + ph, MAIN_Z1 + 0, -3.2)
  // ---- the court's paving
  sheet(q, [[WWING_X1, 0.12, STREET_D], [EWING_X0, 0.12, STREET_D], [EWING_X0, 0.12, MAIN_Z0 - 0.1], [WWING_X1, 0.12, MAIN_Z0 - 0.1]], GRAVEL)
  // ---- chimneys
  for (const [x, z, y] of [[-8, 38, MAIN_TOP], [4, 44, MAIN_TOP], [16, 38, MAIN_TOP], [-52, 12, DURET_TOP], [-42, 12, DURET_TOP], [28, 40, EWING_TOP]] as [number, number, number][]) chimney(q, x, z, y)
  // ---- dormers on the street slopes
  for (const x of [-55.5, -52, -44, -41, -38.2]) dormer(q, x, DURET_EAVE, DURET_TOP, DURET_IN, 0.4)
  for (let x = -32; x < 33; x += 3.8) dormer(q, x, STREET_EAVE, STREET_TOP, STREET_IN, 0.4)
  // ---- the Duret block's street front with the great gate (no. 16)
  const gx = GATE_X, wGate = GATE_W + 2 * GATE_RING
  streetBays(q, SOUTH(0, 0), DURET_X0, DURET_X1, 3.2, 3, DURET_EAVE, (s) => Math.abs(s - gx) < wGate / 2 + 0.3)
  greatGate(q, SOUTH(0, 0), gx)
  // ---- the street wing, with the carriage gate to the court
  streetBays(q, SOUTH(0, 0), STREET_X0, STREET_X1, 3.4, 2, STREET_EAVE, (s) => Math.abs(s - COURT_GATE_X) < 2.6)
  const cg = COURT_GATE_X
  strip(q, SOUTH(0, 0), cg - COURT_GATE_W / 2 - 0.9, cg - COURT_GATE_W / 2, 0.5, 3.4, 0.16, 0.55)
  strip(q, SOUTH(0, 0), cg + COURT_GATE_W / 2, cg + COURT_GATE_W / 2 + 0.9, 0.5, 3.4, 0.16, 0.55)
  arch(q, SOUTH(0, 0), cg, COURT_GATE_W + 1.8, 3.3, 3.4, COURT_GATE_TOP + 0.9, 0.17, STONE_D)
  arch(q, SOUTH(0, 0), cg, COURT_GATE_W, 0.5, 3.4, COURT_GATE_TOP, 0.24, DOOR)
  rect(q, SOUTH(0, 0), cg - 0.03, cg + 0.03, 0.5, 3.4, 0.28, DOOR_D)
  for (const sg of [-1, 1]) rect(q, SOUTH(0, 0), Math.min(cg + sg * 0.2, cg + sg * 1.6), Math.max(cg + sg * 0.2, cg + sg * 1.6), 0.8, 2.8, 0.27, DOOR_D)
  ledge(q, SOUTH(0, 0), cg - 2.0, cg + 2.0, STRING - 0.3, STRING + 0.1, 0.32, STONE_L)
  // ---- the Duret block's east and west ends, the wings' faces
  plainFace(q, WEST(DURET_X0, DURET_D), DURET_D, 3.4, DURET_EAVE)
  plainFace(q, NORTH(DURET_X1, DURET_D), DURET_X1 - DURET_X0, 3.4, DURET_EAVE)
  plainFace(q, EAST(WWING_X1, STREET_D), WWING_Z1 - STREET_D, 3.6, WWING_EAVE)
  plainFace(q, WEST(EWING_X0, EWING_Z1), EWING_Z1 - STREET_D, 3.6, EWING_EAVE)
  plainFace(q, NORTH(EWING_X0, STREET_D), EWING_X0 - WWING_X1, 3.6, STREET_EAVE)
  plainFace(q, EAST(EWING_X1, STREET_D), EWING_Z1 - STREET_D, 3.8, EWING_EAVE)
  // ---- the main block: court front (south) and garden front (north)
  mainFront(q, SOUTH(MAIN_X0, MAIN_Z0), MAIN_X1 - MAIN_X0, true)
  mainFront(q, NORTH(MAIN_X1, MAIN_Z1), MAIN_X1 - MAIN_X0, false)
  plainFace(q, WEST(MAIN_X0, MAIN_Z1), MAIN_Z1 - MAIN_Z0, 3.8, MAIN_EAVE)
  plainFace(q, WEST(LINK_X0, MAIN_Z1 - 4), MAIN_Z1 - 4 - (MAIN_Z0 - 8), 3.6, LINK_EAVE)
  plainFace(q, SOUTH(LINK_X0, MAIN_Z0 - 8), LINK_X1 - LINK_X0, 3.6, LINK_EAVE)
}

export const HOTEL_BRIENNE_REFS = ['way/65090118']

export function hotelBrienne(out: MeshBuilder): void {
  const first = out.positions.length / 3
  const q = new MeshBuilder()
  buildings(q)
  const c = Math.cos(TURN), s = Math.sin(TURN)
  into(out, q, ORIGIN, c, s)
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
