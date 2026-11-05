import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { beam, block, hex, shade } from '../kit.ts'
import { into } from './louvre-palace.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL COLBERT DE TORCY (the Hôtel Tubeuf; 16 rue Vivienne, 2e; Pierre Le Muet, 1640; monument historique 1984; OSM relation/546795).
 * Read off Commons: two photographs of the street front ("Hôtel Colbert de Torcy 16 rue Vivienne - Northern/Southern Part of the Western facade"), Jean Marot's
 * engraved elevations of the entrance, the court and the garden (the "Jean Marot", "côté cour" and "côté jardin" files); IGN LiDAR HD surface model
 * (tools/ign-mns.ts at 48.867846 N, 2.33994 E): street wing roofs 14 m, pavilions and court wings 15-16 m, the main block on the garden 19-20 m,
 * the old garden under a 6-10 m glazed hall, a 15 x 20 m open court.
 *
 * Drawn in the lot's frame: x along rue Vivienne from its north end (running south-south-west), z inward (east-south-east) from the street; turned into the plan by `into`.
 * The street front: two pavilions (arched two-storey windows, rusticated quoins, hipped slate), five square upper windows between them over smooth recessed
 * panels, the rusticated arched carriage gate (blue leaves) on the axis, a string course at the first floor and a long slate mansard.
 */
// ---- tunable: the frame (measured from OSM relation/546795's outer ring: 36.6 m along the street, 52.3 m back)
export const TURN = (-109.9 * Math.PI) / 180  // the lot's x axis runs along the street SSW (plan x east, z north); z inward is then ESE
export const ORIGIN: P = [-17.4, 28.7]        // the street front's NORTH end, metres east/north of the entry's lat/lon
export const FLOOR = 0.5
export const LOT_W = 36.6
export const LOT_D = 52.3
// ---- tunable: the street front
export const FRONT_D = 5.4          // the street wing's depth
export const PAV_W = 8.2            // pavilions' width (and the court wings')
export const STRING = 6.1           // string course at the first floor
export const EAVE = 9.8             // street and court wings' cornice
export const FRONT_TOP = 14.3       // the long mansard's flat
export const FRONT_IN = 1.9
export const PAV_TOP = 16.0
export const PAV_IN = 2.6
export const WING_TOP = 15.0
export const WING_IN = 2.3
export const QUOIN = 0.95           // rusticated strip width
export const GATE_W = 3.2
export const GATE_SPRING = 2.9
export const GATE_TOP = 4.5
export const GATE_PIER = 1.3        // the rusticated reveal each side
export const WIN_W = 1.4
export const UP_SILL = 6.9
export const UP_HEAD = 9.1
export const ARCH_W = 1.8
export const BAYS_BODY = [2.0, 6.0, 10.1, 14.2, 18.2]   // upper windows' centres, body-relative
// ---- tunable: the court and the main block
export const COURT_V0 = FRONT_D
export const COURT_V1 = 29.0        // where the main block begins
export const LOGIS_V1 = 36.3
export const LOGIS_EAVE = 14.6
export const LOGIS_TOP = 19.8
export const LOGIS_IN = 2.9
export const GARDEN_WING_S = 5.4    // the wings that run on beside the old garden (x = 0 end: north)
export const GARDEN_WING_N = 6.5   
export const GARDEN_TOP = 18.0
export const HALL_EAVE = 7.0
export const HALL_TOP = 9.4
// ---- tunable: colours
const STONE: Rgb = hex('#d3c8ae')
const STONE_D: Rgb = hex('#bdb08f')
const STONE_L: Rgb = hex('#e2d9c1')
const PANEL: Rgb = hex('#cfc6b4')
const SLATE: Rgb = hex('#3f4759')
const SLATE_HI: Rgb = hex('#4d566a')
const GLASS: Rgb = [0.17, 0.21, 0.27]
const GLASS_HALL: Rgb = hex('#7d98a0')
const DOOR: Rgb = hex('#2a4a9c')
const DOOR_D: Rgb = hex('#1d3678')
const IRON: Rgb = [0.07, 0.07, 0.08]
const COURT_PAVE: Rgb = hex('#aa9f89')
const CHIMNEY: Rgb = hex('#c9bda4')

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
/** A projecting moulding: its face, and its top where it meets the wall. */
function ledge(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, out: number, col: Rgb): void {
  rect(q, f, s0, s1, y0, y1, out, col)
  sheet(q, [at(f, s0, y1, 0), at(f, s1, y1, 0), at(f, s1, y1, out), at(f, s0, y1, out)], shade(col, 0.92))
}
/** A rusticated strip (quoins, piers): a darker base with a joint every `step` metres. */
function strip(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, d: number, step = 0.62): void {
  rect(q, f, s0, s1, y0, y1, d, STONE_D)
  for (let y = y0 + step; y < y1 - 0.1; y += step) rect(q, f, s0, s1, y, y + 0.07, d + 0.02, shade(STONE_D, 0.72))
}
/** A square window with a stone surround, a sill, and a lintel. */
function sqWin(q: MeshBuilder, f: Face, s: number, y0: number, y1: number, w: number, d: number): void {
  rect(q, f, s - w / 2 - 0.22, s + w / 2 + 0.22, y0 - 0.15, y1 + 0.3, d + 0.04, STONE_L)
  rect(q, f, s - w / 2, s + w / 2, y0, y1, d + 0.09, GLASS)
  rect(q, f, s - 0.03, s + 0.03, y0, y1, d + 0.11, STONE_L)
  rect(q, f, s - w / 2, s + w / 2, (y0 + y1) / 2 + 0.2, (y0 + y1) / 2 + 0.26, d + 0.11, STONE_L)
  ledge(q, f, s - w / 2 - 0.3, s + w / 2 + 0.3, y0 - 0.25, y0 - 0.1, d + 0.2, STONE_L)
}
function archWin(q: MeshBuilder, f: Face, s: number, y0: number, spring: number, top: number, w: number, d: number): void {
  arch(q, f, s, w + 0.6, y0 - 0.1, spring, top + 0.3, d + 0.04, STONE_L)
  arch(q, f, s, w, y0, spring, top, d + 0.09, GLASS)
  rect(q, f, s - 0.03, s + 0.03, y0, spring, d + 0.11, STONE_L)
  rect(q, f, s - w / 2, s + w / 2, spring - 0.04, spring + 0.04, d + 0.11, STONE_L)
}

/** The mansard on a rectangle (u0..u1, v0..v1): a steep lower slope to a flat top, inset `inset`. */
function mansard(q: MeshBuilder, u0: number, u1: number, v0: number, v1: number, eave: number, top: number, inset: number): void {
  const inn = Math.min(inset, Math.min(u1 - u0, v1 - v0) / 2 - 0.2)
  const ring = (i: number, y: number): V3[] => [[u0 + i, y, v0 + i], [u1 - i, y, v0 + i], [u1 - i, y, v1 - i], [u0 + i, y, v1 - i]]
  const rE = ring(0.1, eave), rT = ring(inn, top)
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; sheet(q, [rE[i], rE[j], rT[j], rT[i]], SLATE) }
  sheet(q, [rT[0], rT[1], rT[2], rT[3]], SLATE_HI)
  beam(q, [u0 + inn, top + 0.05, (v0 + v1) / 2], [u1 - inn, top + 0.05, (v0 + v1) / 2], 0.04, SLATE)
}
const chimney = (q: MeshBuilder, x: number, z: number, y: number): void => {
  block(q, x - 0.5, x + 0.5, z - 0.4, z + 0.4, y - 0.2, y + 1.9, CHIMNEY)
  block(q, x - 0.6, x + 0.6, z - 0.5, z + 0.5, y + 1.9, y + 2.1, STONE_D)
}

const STREET: Face = { o: [0, 0], t: [1, 0], n: [0, -1] }

/** The street front: wall bands, quoins, the pavilions' arched windows, five bays between, the gate. */
function streetFront(q: MeshBuilder): void {
  const f = STREET, W = LOT_W
  const gc = W / 2, bodyS = PAV_W, bodyE = W - PAV_W
  // the smooth plastered walls with a plinth, the string course and the cornice
  rect(q, f, 0, W, 0, 0.7, 0.04, STONE_D)
  ledge(q, f, 0, W, STRING - 0.25, STRING + 0.18, 0.28, STONE_L)
  ledge(q, f, 0, W, EAVE - 0.55, EAVE + 0.05, 0.5, STONE_L)
  rect(q, f, 0, W, EAVE - 1.1, EAVE - 0.55, 0.06, STONE_D)
  // quoins up both pavilions' edges and each side of the body's
  for (const [a, b] of [[0, QUOIN], [PAV_W - QUOIN, PAV_W], [W - PAV_W, W - PAV_W + QUOIN], [W - QUOIN, W]]) strip(q, f, a, b, 0, EAVE - 0.55, 0.12)
  // the pavilions: a ground arched window and an upper one, in smooth recessed panels
  for (const c of [PAV_W / 2, W - PAV_W / 2]) {
    rect(q, f, c - 2.45, c + 2.45, 0.9, STRING - 0.45, 0.06, PANEL)
    rect(q, f, c - 2.45, c + 2.45, STRING + 0.4, EAVE - 1.25, 0.06, PANEL)
    archWin(q, f, c, 1.3, 3.1, 4.1, ARCH_W, 0.06)
    rect(q, f, c - 1.1, c + 1.1, 0.75, 1.15, 0.12, STONE_L)
    archWin(q, f, c, UP_SILL - 0.1, 8.3, 9.3, ARCH_W, 0.06)
    ledge(q, f, c - 1.3, c + 1.3, UP_SILL - 0.4, UP_SILL - 0.25, 0.24, STONE_L)
  }
  // the body: recessed panels on the ground storey flanking the gate, rusticated strips between them, five upper windows
  const bs = (r: number): number => bodyS + r
  for (const r of [4.0, 16.2]) strip(q, f, bs(r - 0.4), bs(r + 0.4), 0.7, STRING - 0.25, 0.1)
  for (const [a, b] of [[0.9, 3.5], [4.5, 7.3], [12.9, 15.8], [16.9, 19.3]]) {
    rect(q, f, bs(a), bs(b), 1.1, STRING - 0.7, 0.07, PANEL)
    rect(q, f, bs(a) + 0.08, bs(b) - 0.08, 1.18, STRING - 0.78, 0.09, shade(PANEL, 1.05))
  }
  for (const r of BAYS_BODY) {
    rect(q, f, bs(r - 1.25), bs(r + 1.25), UP_SILL - 0.9, EAVE - 1.25, 0.05, PANEL)
    sqWin(q, f, bs(r), UP_SILL, UP_HEAD, WIN_W, 0.05)
  }
  for (const r of [4.0, 16.2]) strip(q, f, bs(r - 0.4), bs(r + 0.4), STRING + 0.2, EAVE - 0.6, 0.1)
  // the carriage gate: rusticated piers and arch ring, the blue panelled leaves, a medallion in the fan, a keystone
  const piers = GATE_W / 2 + GATE_PIER
  strip(q, f, gc - piers, gc - GATE_W / 2, 0, GATE_SPRING, 0.2, 0.55)
  strip(q, f, gc + GATE_W / 2, gc + piers, 0, GATE_SPRING, 0.2, 0.55)
  arch(q, f, gc, 2 * piers, GATE_SPRING - 0.01, GATE_SPRING, GATE_TOP + GATE_PIER, 0.2, STONE_D)
  // the arch ring in voussoirs: joints radiating from the spring line
  for (let i = 1; i < 7; i++) {
    const a = Math.PI * i / 7, r0 = GATE_W / 2, r1 = piers
    const p0 = at(f, gc - Math.cos(a) * r0, GATE_SPRING + Math.sin(a) * (GATE_TOP - GATE_SPRING), 0.23)
    const p1 = at(f, gc - Math.cos(a) * r1, GATE_SPRING + Math.sin(a) * (GATE_TOP - GATE_SPRING + GATE_PIER), 0.23)
    beam(q, p0, p1, 0.035, shade(STONE_D, 0.7))
  }
  rect(q, f, gc - 0.35, gc + 0.35, GATE_TOP - 0.1, GATE_TOP + GATE_PIER + 0.35, 0.3, STONE_L)
  arch(q, f, gc, GATE_W, 0.0, GATE_SPRING, GATE_TOP, 0.26, DOOR)
  rect(q, f, gc - 0.03, gc + 0.03, 0.0, GATE_SPRING, 0.3, DOOR_D)
  for (const sg of [-1, 1]) for (const [y0, y1] of [[0.25, 1.35], [1.55, 2.65]]) {
    const s0 = gc + sg * 0.2, s1 = gc + sg * (GATE_W / 2 - 0.2)
    rect(q, f, Math.min(s0, s1), Math.max(s0, s1), y0, y1, 0.29, DOOR_D)
  }
  // the fan's medallion (a ring on the lunette)
  const N = 10
  for (let i = 0; i < N; i++) {
    const a0 = 2 * Math.PI * i / N, a1 = 2 * Math.PI * (i + 1) / N, cy = GATE_SPRING + 0.7, r = 0.5
    tri(q, f, [gc, cy], [gc + Math.cos(a0) * r, cy + Math.sin(a0) * r], [gc + Math.cos(a1) * r, cy + Math.sin(a1) * r], 0.3, DOOR_D)
  }
  // the lintel course over the gate bay carries the string course forward
  ledge(q, f, gc - piers - 0.2, gc + piers + 0.2, STRING - 0.4, STRING + 0.22, 0.42, STONE_L)
}

/** A court or garden elevation (Marot): arched ground openings, tall first-floor windows, a frieze, attic windows; `tiers` is 2 or 3 storeys. */
function courtFace(q: MeshBuilder, f: Face, len: number, nb: number, tiers: 2 | 3, eave: number): void {
  const bay = len / nb
  rect(q, f, 0, len, 0, 0.6, 0.04, STONE_D)
  const ground = tiers === 3 ? 5.0 : 4.6
  for (let i = 0; i <= nb; i++) {
    const s = i * bay, a = Math.max(0, s - 0.28), b = Math.min(len, s + 0.28)
    rect(q, f, a, b, 0.6, eave - 0.9, 0.2, STONE_L)
  }
  ledge(q, f, 0, len, ground - 0.3, ground + 0.3, 0.32, STONE_L)
  ledge(q, f, 0, len, eave - 0.9, eave, 0.5, STONE_L)
  for (let i = 0; i < nb; i++) {
    const s = (i + 0.5) * bay
    archWin(q, f, s, 0.9, ground - 1.5, ground - 0.5, bay - 1.25, 0.08)
    if (tiers === 3) {
      sqWin(q, f, s, ground + 1.0, ground + 4.3, bay - 1.5, 0.08)
      sqWin(q, f, s, ground + 6.0, ground + 7.7, bay - 1.9, 0.08)
    } else sqWin(q, f, s, ground + 1.0, eave - 1.6, bay - 1.6, 0.08)
  }
  if (tiers === 3) ledge(q, f, 0, len, ground + 4.9, ground + 5.15, 0.3, STONE_L)
  // the balustrade over the cornice
  rect(q, f, 0, len, eave, eave + 0.18, 0.4, STONE_L)
  rect(q, f, 0, len, eave + 0.18, eave + 0.78, 0.38, STONE_D)
  for (let s = 0.3; s < len - 0.1; s += 0.8) rect(q, f, s - 0.12, s + 0.12, eave + 0.18, eave + 0.78, 0.42, STONE_L)
  rect(q, f, 0, len, eave + 0.78, eave + 0.95, 0.4, STONE_L)
}

/** A dormer fronton on the mansard (the garden's coat-of-arms pediment). */
function fronton(q: MeshBuilder, f: Face, s: number, y: number, d: number): void {
  rect(q, f, s - 1.4, s + 1.4, y, y + 1.5, d, STONE_L)
  rect(q, f, s - 0.7, s + 0.7, y + 0.3, y + 1.2, d + 0.05, GLASS)
  tri(q, f, [s - 1.6, y + 1.5], [s + 1.6, y + 1.5], [s, y + 2.5], d + 0.05, STONE_L)
}

function buildings(q: MeshBuilder): void {
  const W = LOT_W
  const eS = PAV_W, eN = W - PAV_W
  // walls
  block(q, 0, W, 0, FRONT_D, 0, EAVE, STONE)
  block(q, 0, PAV_W, 0, COURT_V1, 0, EAVE, STONE)
  block(q, W - PAV_W, W, 0, COURT_V1, 0, EAVE, STONE)
  block(q, 0, W, COURT_V1, LOGIS_V1, 0, LOGIS_EAVE, STONE)
  block(q, 0, GARDEN_WING_S, LOGIS_V1, LOT_D, 0, LOGIS_EAVE, STONE)
  block(q, W - GARDEN_WING_N, W, LOGIS_V1, LOT_D, 0, LOGIS_EAVE, STONE)
  block(q, GARDEN_WING_S, W - GARDEN_WING_N, LOGIS_V1, LOT_D, 0, HALL_EAVE, shade(STONE_D, 0.9))
  // roofs
  mansard(q, 0, W, 0, FRONT_D, EAVE, FRONT_TOP, FRONT_IN)
  for (const [x0, x1] of [[0, PAV_W], [W - PAV_W, W]]) {
    mansard(q, x0, x1, 0, PAV_W, EAVE, PAV_TOP, PAV_IN)
    mansard(q, x0, x1, PAV_W, COURT_V1, EAVE, WING_TOP, WING_IN)
  }
  mansard(q, 0, W, COURT_V1, LOGIS_V1, LOGIS_EAVE + 0.95, LOGIS_TOP, LOGIS_IN)
  mansard(q, 0, GARDEN_WING_S, LOGIS_V1, LOT_D, LOGIS_EAVE, GARDEN_TOP, 2.2)
  mansard(q, W - GARDEN_WING_N, W, LOGIS_V1, LOT_D, LOGIS_EAVE, GARDEN_TOP, 2.1)
  // the glazed hall over the old garden: a flat steel-and-glass roof with a hipped light
  const h0 = GARDEN_WING_S + 0.1, h1 = W - GARDEN_WING_N - 0.1
  sheet(q, [[h0, HALL_EAVE + 0.02, LOGIS_V1], [h1, HALL_EAVE + 0.02, LOGIS_V1], [h1, HALL_EAVE + 0.02, LOT_D], [h0, HALL_EAVE + 0.02, LOT_D]], shade(SLATE_HI, 1.1))
  const lv0 = LOGIS_V1 + 4, lv1 = LOT_D - 3
  const rg = (i: number, y: number): V3[] => [[h0 + 1.5 + i, y, lv0 + i], [h1 - 1.5 - i, y, lv0 + i], [h1 - 1.5 - i, y, lv1 - i], [h0 + 1.5 + i, y, lv1 - i]]
  const g0 = rg(0, HALL_EAVE), g1 = rg(3.5, HALL_TOP)
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; sheet(q, [g0[i], g0[j], g1[j], g1[i]], GLASS_HALL) }
  sheet(q, [g1[0], g1[1], g1[2], g1[3]], GLASS_HALL)
  // the court's paving
  sheet(q, [[eS, 0.7, COURT_V0], [eN, 0.7, COURT_V0], [eN, 0.7, COURT_V1], [eS, 0.7, COURT_V1]], COURT_PAVE)
  // chimneys on the main block and the wings
  for (const [x, z, y] of [[4, 32.5, LOGIS_TOP], [14, 32.5, LOGIS_TOP], [24, 32.5, LOGIS_TOP], [33, 32.5, LOGIS_TOP], [4.1, 14, WING_TOP], [W - 4.1, 14, WING_TOP]] as [number, number, number][]) chimney(q, x, z, y)
  // the court's elevations (Marot): the main block in three storeys, the wings and the street wing's back in two
  courtFace(q, { o: [eN, COURT_V1], t: [-1, 0], n: [0, -1] }, eN - eS, 5, 3, LOGIS_EAVE)
  courtFace(q, { o: [eS, COURT_V0], t: [0, 1], n: [1, 0] }, COURT_V1 - COURT_V0, 3, 2, EAVE)
  courtFace(q, { o: [eN, COURT_V1], t: [0, -1], n: [-1, 0] }, COURT_V1 - COURT_V0, 3, 2, EAVE)
  courtFace(q, { o: [eS, COURT_V0], t: [1, 0], n: [0, 1] }, eN - eS, 5, 2, EAVE)
  // the garden elevation: ten bays and the central fronton on the mansard
  const G: Face = { o: [W, LOGIS_V1], t: [-1, 0], n: [0, 1] }
  const gl = W
  courtFace(q, G, gl, 10, 3, LOGIS_EAVE)
  fronton(q, G, W / 2, LOGIS_EAVE + 1.6, 0.6)
  // the east end of the hall
  rect(q, { o: [W - GARDEN_WING_N, LOT_D], t: [-1, 0], n: [0, 1] }, 0, W - GARDEN_WING_N - GARDEN_WING_S, 0, HALL_EAVE, 0.02, shade(STONE_D, 0.95))
  rect(q, { o: [W, LOT_D], t: [-1, 0], n: [0, 1] }, 0, W, 0, LOGIS_EAVE, 0.01, shade(STONE, 0.93))
}

export const HOTEL_COLBERT_TORCY_REFS = ['relation/546795']

export function hotelColbertTorcy(out: MeshBuilder): void {
  const first = out.positions.length / 3
  const q = new MeshBuilder()
  buildings(q)
  streetFront(q)
  const c = Math.cos(TURN), s = Math.sin(TURN)
  into(out, q, ORIGIN, c, s)
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
