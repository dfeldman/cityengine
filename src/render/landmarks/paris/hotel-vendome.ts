import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { beam, block, hex, shade } from '../kit.ts'
import { into } from './louvre-palace.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL DE VENDÔME, the École des Mines (60 boulevard Saint-Michel, 6e; Hôtel de Vendôme 1707, the school's since 1815; MH 1994, PA00088508;
 * OSM relation/975976, Q772886). Read off Commons: "Front gate of Ecole des Mines" and the "Ecole superieure des mines" files (the arched gate with its
 * sculpted tympanum, balustrades, blue plaque and green iron gate), "P1250413"/"École nationale supérieure des Mines de Paris" (the rusticated street front
 * with the wooden carriage door, arched first-floor windows, a mansard with dormers), "Ecole des Mines vue du Jardin du Luxembourg"/"Mines facade" (the
 * hôtel's garden front: three storeys, arched piano nobile, a central pediment), the court photograph (a glazed hall beside the stone wings). Heights
 * from the IGN LiDAR HD surface model (tools/ign-mns.ts at 48.8453 N, 2.3392 E): the south corner block 25-28 m, the street wings 19-21 m under slate,
 * the hôtel 20-24 m, the north pavilion 22-24 m; the 13-14 m "flat" along the street is plane-tree canopy, not roof, and is ignored.
 *
 * Drawn in the front's frame: x along boulevard Saint-Michel from its south end (running north-north-east, 19.9 deg east of north), z inward (west-north-west)
 * from the street line; turned into the plan by `into`. OSM's own outline is a 142 m front with the entry court notched in and a big north court.
 */
// ---- tunable: the frame (the ring's south street corner, metres east/north of the entry's lat/lon)
export const TURN = (70.1 * Math.PI) / 180
export const ORIGIN: P = [-5.5, -75.4]
export const FLOOR = 0.5
// ---- tunable: storeys
export const PLINTH = 1.5          // the rusticated basement course
export const FH = 3.7              // a storey
export const BAY = 4.2             // window rhythm
export const QUOIN = 0.9
// ---- tunable: the blocks along the street (x0, x1, depth, storeys, mansard height)
export const CORNER = { x0: 0, x1: 22, z1: 26, floors: 5, mans: 5.8 }
export const WING_S = { x0: 22, x1: 46, z1: 24, floors: 3, mans: 6.0 }
export const WING_N = { x0: 83, x1: 109, z1: 19, floors: 3, mans: 5.6 }
export const FRONT_60 = { x0: 109, x1: 129, z1: 14, floors: 3, mans: 5.0 }
export const DOOR_X = 119.7        // the carriage door (OSM entrance 60 main, u 46.7)
// ---- tunable: the gate (OSM entrance 60 bis, u -15)
export const GATE_X0 = 51
export const GATE_X1 = 65
export const GATE_WALL_H = 9.0
export const GATE_W = 6.4
export const GATE_SPRING = 3.4
export const GATE_TOP = 6.6
// ---- tunable: the glazed hall
export const HALL_X0 = 65
export const HALL_X1 = 81
export const HALL_Z1 = 22
export const HALL_BASE = 3.4
export const HALL_EAVE = 8.2
export const HALL_TOP = 10.0
// ---- tunable: the hôtel proper (its garden front looks west-north-west)
export const HOTEL = { x0: 42, x1: 75, z0: 22, z1: 43, eave: 15.4, top: 21.5, floors: 3, bays: 8 }
export const PEDIMENT_BAYS = 3
// ---- tunable: the north blocks
export const TRANSVERSE = { x0: 104, x1: 114, z0: 14, z1: 65, eave: 13.5, top: 18.5 }
export const NORTH_BLOCK = { x0: 114, x1: 129, z0: 42, z1: 63, eave: 17.2, top: 23.5 }
export const WALL_X1 = 143          // the garden wall's end
export const WALL_H = 2.6
export const DEPTH_MAX = 70
// ---- tunable: colours
const STONE: Rgb = hex('#cfc5ae')
const STONE_D: Rgb = hex('#b5aa90')
const STONE_L: Rgb = hex('#ddd4bf')
const SLATE: Rgb = hex('#454d5e')
const SLATE_HI: Rgb = hex('#566074')
const GLASS: Rgb = [0.16, 0.2, 0.25]
const GLASS_HALL: Rgb = hex('#7f9ba3')
const IRON_GREEN: Rgb = hex('#1f3a30')
const PLAQUE: Rgb = hex('#3c5ea8')
const DOOR_WOOD: Rgb = hex('#7a4a22')
const DOOR_GILT: Rgb = hex('#c4a04a')
const COURT_PAVE: Rgb = hex('#a69c88')
const CHIMNEY: Rgb = hex('#c8bba2')
const STEEL: Rgb = hex('#1e2a30')

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
/** A fan-filled arch-headed opening: rectangle to `spring`, a semicircle (squashed to `top`) over it. */
function arch(q: MeshBuilder, f: Face, sc: number, w: number, y0: number, spring: number, top: number, d: number, col: Rgb, n = 5): void {
  rect(q, f, sc - w / 2, sc + w / 2, y0, spring, d, col)
  const r = w / 2, h = top - spring
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n
    tri(q, f, [sc, spring], [sc - Math.cos(a0) * r, spring + Math.sin(a0) * h], [sc - Math.cos(a1) * r, spring + Math.sin(a1) * h], d, col)
  }
}
function ledge(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, out: number, col: Rgb): void {
  rect(q, f, s0, s1, y0, y1, out, col)
  sheet(q, [at(f, s0, y1, 0), at(f, s1, y1, 0), at(f, s1, y1, out), at(f, s0, y1, out)], shade(col, 0.92))
}
/** A square window: surround, glass, a meeting bar, a sill. */
function sqWin(q: MeshBuilder, f: Face, s: number, y0: number, y1: number, w: number, d: number): void {
  rect(q, f, s - w / 2 - 0.2, s + w / 2 + 0.2, y0 - 0.1, y1 + 0.28, d + 0.04, STONE_L)
  rect(q, f, s - w / 2, s + w / 2, y0, y1, d + 0.09, GLASS)
  rect(q, f, s - 0.03, s + 0.03, y0, y1, d + 0.11, STONE_L)
  rect(q, f, s - w / 2 - 0.3, s + w / 2 + 0.3, y0 - 0.22, y0 - 0.08, d + 0.16, STONE_L)
}
/** An arch-headed window (the piano nobile) with a keystone block. */
function archWin(q: MeshBuilder, f: Face, s: number, y0: number, spring: number, top: number, w: number, d: number): void {
  arch(q, f, s, w + 0.5, y0 - 0.08, spring, top + 0.25, d + 0.04, STONE_L, 4)
  arch(q, f, s, w, y0, spring, top, d + 0.09, GLASS, 4)
  rect(q, f, s - 0.03, s + 0.03, y0, spring, d + 0.11, STONE_L)
  rect(q, f, s - w / 2, s + w / 2, spring - 0.04, spring + 0.04, d + 0.11, STONE_L)
  rect(q, f, s - 0.2, s + 0.2, top + 0.05, top + 0.55, d + 0.12, STONE_L)
}
/** A rusticated strip with a joint every `step`. */
function strip(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, d: number, step = 0.7): void {
  rect(q, f, s0, s1, y0, y1, d, STONE_D)
  for (let y = y0 + step; y < y1 - 0.1; y += step) rect(q, f, s0, s1, y, y + 0.07, d + 0.02, shade(STONE_D, 0.72))
}
/** The mansard on a rectangle: a steep slope to a flat top, inset `inset`, its ridge line a beam. */
function mansard(q: MeshBuilder, u0: number, u1: number, v0: number, v1: number, eave: number, top: number, inset: number): void {
  const inn = Math.min(inset, Math.min(u1 - u0, v1 - v0) / 2 - 0.2)
  const ring = (i: number, y: number): V3[] => [[u0 + i, y, v0 + i], [u1 - i, y, v0 + i], [u1 - i, y, v1 - i], [u0 + i, y, v1 - i]]
  const rE = ring(0.1, eave), rT = ring(inn, top)
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; sheet(q, [rE[i], rE[j], rT[j], rT[i]], SLATE) }
  sheet(q, [rT[0], rT[1], rT[2], rT[3]], SLATE_HI)
  beam(q, [u0 + inn, top + 0.05, (v0 + v1) / 2], [u1 - inn, top + 0.05, (v0 + v1) / 2], 0.04, SLATE)
}
const chimney = (q: MeshBuilder, x: number, z: number, y: number): void => {
  block(q, x - 0.5, x + 0.5, z - 0.4, z + 0.4, y - 0.2, y + 1.8, CHIMNEY)
  block(q, x - 0.6, x + 0.6, z - 0.5, z + 0.5, y + 1.8, y + 2.0, STONE_D)
}
/** A dormer on a face: a stone box with a window, a little gable roof. s along, y base, d the face's offset out from the slope. */
function dormer(q: MeshBuilder, f: Face, s: number, y: number, d: number): void {
  rect(q, f, s - 0.85, s + 0.85, y, y + 2.0, d, STONE_L)
  rect(q, f, s - 0.5, s + 0.5, y + 0.3, y + 1.7, d + 0.05, GLASS)
  tri(q, f, [s - 1.0, y + 2.0], [s + 1.0, y + 2.0], [s, y + 2.9], d + 0.05, SLATE_HI)
}

const STREET = (x0: number): Face => ({ o: [x0, 0], t: [1, 0], n: [0, -1] })

/** The storeys of a street front: rusticated plinth, quoins, a string course per floor, arched piano nobile over square upper windows, a cornice, dormers on the slope. */
function wingFront(q: MeshBuilder, f: Face, len: number, floors: number, mans: number, skipBay: number | null = null): number {
  const eave = PLINTH + floors * FH
  const nb = Math.max(1, Math.round(len / BAY)), bay = len / nb
  rect(q, f, 0, len, 0, PLINTH, 0.05, STONE_D)
  for (let y = 0.5; y < PLINTH; y += 0.5) rect(q, f, 0, len, y, y + 0.05, 0.07, shade(STONE_D, 0.72))
  strip(q, f, 0, QUOIN, PLINTH, eave, 0.1)
  strip(q, f, len - QUOIN, len, PLINTH, eave, 0.1)
  for (let k = 1; k <= floors; k++) ledge(q, f, 0, len, PLINTH + k * FH - 0.18, PLINTH + k * FH + 0.12, 0.22, STONE_L)
  ledge(q, f, 0, len, eave - 0.1, eave + 0.45, 0.55, STONE_L)
  for (let i = 0; i < nb; i++) {
    const s = (i + 0.5) * bay
    if (skipBay === i) continue
    // ground floor: small arched windows over the basement grille
    arch(q, f, s, 0.7, 0.35, 0.65, 0.95, 0.07, STEEL, 3)
    for (let k = 0; k < floors; k++) {
      const y0 = PLINTH + k * FH + 0.55
      if (k === 0) archWin(q, f, s, y0 + 0.2, y0 + 2.2, y0 + 3.0, 1.45, 0.05)
      else sqWin(q, f, s, y0, y0 + 2.25, 1.3, 0.05)
    }
  }
  // dormers on the slope, every other bay
  for (let i = 0; i < nb; i += 2) dormer(q, f, (i + 0.5) * bay, eave + 0.6, -0.2)
  return eave
}

/** One street wing: walls, front, mansard, chimneys. */
function wing(q: MeshBuilder, w: { x0: number; x1: number; z1: number; floors: number; mans: number }, skipBay: number | null = null): void {
  const len = w.x1 - w.x0
  const eave = PLINTH + w.floors * FH
  block(q, w.x0, w.x1, 0, w.z1, 0, eave, STONE)
  mansard(q, w.x0, w.x1, 0, w.z1, eave, eave + w.mans, 2.4)
  wingFront(q, STREET(w.x0), len, w.floors, w.mans, skipBay)
  for (let x = w.x0 + 3; x < w.x1 - 2; x += 8) chimney(q, x, w.z1 * 0.55, eave + w.mans - 0.2)
}

/** The monumental gate: a wall with a great arch, sculpted tympanum, blue plaque, balustrades and the green iron gate. */
function gate(q: MeshBuilder): void {
  const x0 = GATE_X0, x1 = GATE_X1, W = x1 - x0, gc = W / 2
  const f = STREET(x0)
  block(q, x0, x1, 0, 1.4, 0, GATE_WALL_H, STONE)
  rect(q, f, 0, W, 0, 0.9, 0.04, STONE_D)
  for (const [a, b] of [[0, 3.1], [W - 3.1, W]]) {
    strip(q, f, a, b, 0.9, GATE_WALL_H - 0.9, 0.1, 0.9)
    rect(q, f, a + 0.3, b - 0.3, 2.0, 3.0, 0.14, STONE_L)
    rect(q, f, a + 0.3, b - 0.3, 4.8, 5.8, 0.14, STONE_L)
  }
  // the arch: a stone ring, the dark passage, the green gate leaves, a keystone
  arch(q, f, gc, GATE_W + 1.4, 0, GATE_SPRING, GATE_TOP + 0.7, 0.12, STONE_L, 8)
  arch(q, f, gc, GATE_W, 0, GATE_SPRING, GATE_TOP, 0.14, shade(STONE_D, 0.45), 8)
  arch(q, f, gc, GATE_W - 0.8, 0, 3.0, 3.6, 0.2, IRON_GREEN, 6)
  for (let s = -GATE_W / 2 + 0.7; s < GATE_W / 2 - 0.6; s += 0.55) rect(q, f, gc + s - 0.03, gc + s + 0.03, 0.2, 3.5, 0.24, shade(IRON_GREEN, 1.4))
  rect(q, f, gc - 0.03, gc + 0.03, 0.2, 3.7, 0.26, DOOR_GILT)
  rect(q, f, gc - 0.4, gc + 0.4, GATE_TOP + 0.3, GATE_TOP + 1.4, 0.2, STONE_L)
  // the entablature, the blue plaque, the tympanum and the balustrades either side
  ledge(q, f, 0, W, GATE_WALL_H - 0.9, GATE_WALL_H - 0.4, 0.4, STONE_L)
  rect(q, f, gc - 3.4, gc + 3.4, GATE_WALL_H - 3.0, GATE_WALL_H - 1.7, 0.16, PLAQUE)
  rect(q, f, gc - 2.2, gc + 2.2, GATE_WALL_H - 2.65, GATE_WALL_H - 2.05, 0.18, STONE_L)
  rect(q, f, gc - 3.7, gc + 3.7, GATE_WALL_H - 0.4, GATE_WALL_H + 0.3, 0.3, STONE_L)
  const N = 8, hh = 2.1
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N, r = 3.6
    tri(q, f, [gc, GATE_WALL_H + 0.3], [gc - Math.cos(a0) * r, GATE_WALL_H + 0.3 + Math.sin(a0) * hh], [gc - Math.cos(a1) * r, GATE_WALL_H + 0.3 + Math.sin(a1) * hh], 0.32, STONE_L)
  }
  rect(q, f, gc - 2.4, gc + 2.4, GATE_WALL_H + 0.45, GATE_WALL_H + 1.1, 0.34, STONE_D)
  for (const [a, b] of [[0, gc - 3.7], [gc + 3.7, W]]) {
    rect(q, f, a, b, GATE_WALL_H - 0.4, GATE_WALL_H + 0.2, 0.3, STONE_L)
    rect(q, f, a, b, GATE_WALL_H + 0.2, GATE_WALL_H + 0.95, 0.24, shade(STONE_D, 1.05))
    for (let s = a + 0.3; s < b - 0.2; s += 0.7) rect(q, f, s - 0.1, s + 0.1, GATE_WALL_H + 0.2, GATE_WALL_H + 0.95, 0.31, STONE_L)
    rect(q, f, a, b, GATE_WALL_H + 0.95, GATE_WALL_H + 1.15, 0.3, STONE_L)
  }
}

/** The glazed hall: a stone plinth with grilles, a steel-framed glass band, a cornice and a glass roof. */
function hall(q: MeshBuilder): void {
  const x0 = HALL_X0, x1 = HALL_X1, W = x1 - x0, f = STREET(x0)
  block(q, x0, x1, 0, HALL_Z1, 0, HALL_EAVE, STONE)
  rect(q, f, 0, W, 0, HALL_BASE, 0.05, STONE_D)
  for (let s = 0.8; s < W - 0.5; s += 2.0) rect(q, f, s, s + 1.0, 0.5, 1.5, 0.08, STEEL)
  ledge(q, f, 0, W, HALL_BASE - 0.2, HALL_BASE + 0.1, 0.25, STONE_L)
  rect(q, f, 0.4, W - 0.4, HALL_BASE + 0.15, HALL_EAVE - 0.5, 0.06, STEEL)
  const nb = 8, bw = (W - 0.8) / nb
  for (let i = 0; i < nb; i++) {
    rect(q, f, 0.4 + i * bw + 0.1, 0.4 + (i + 1) * bw - 0.1, HALL_BASE + 0.3, HALL_EAVE - 0.65, 0.1, GLASS)
    rect(q, f, 0.4 + i * bw - 0.05, 0.4 + i * bw + 0.07, HALL_BASE + 0.15, HALL_EAVE - 0.5, 0.12, STEEL)
  }
  ledge(q, f, 0, W, HALL_EAVE - 0.5, HALL_EAVE + 0.1, 0.4, STONE_L)
  // the glass roof: a hipped light over the length
  const rg = (i: number, y: number): V3[] => [[x0 + 0.6 + i, y, 0.6 + i], [x1 - 0.6 - i, y, 0.6 + i], [x1 - 0.6 - i, y, HALL_Z1 - 0.6 - i], [x0 + 0.6 + i, y, HALL_Z1 - 0.6 - i]]
  const g0 = rg(0, HALL_EAVE), g1 = rg(3.2, HALL_TOP)
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; sheet(q, [g0[i], g0[j], g1[j], g1[i]], GLASS_HALL) }
  sheet(q, [g1[0], g1[1], g1[2], g1[3]], GLASS_HALL)
  for (let i = 1; i < 5; i++) { const x = x0 + 0.6 + 3.2 + (W - 8.0) * i / 5; beam(q, [x, HALL_TOP + 0.03, 0.6 + 3.2], [x, HALL_TOP + 0.03, HALL_Z1 - 0.6 - 3.2], 0.04, STEEL) }
}

/** The carriage door on the 3-storey front: a rusticated pier each side, a wooden arched leaf with two gilt medallions and a mask keystone. */
function carriageDoor(q: MeshBuilder, x0: number): void {
  const f = STREET(x0)
  const s = DOOR_X - x0
  strip(q, f, s - 2.5, s - 1.6, 0, PLINTH + 2 * FH, 0.14, 0.65)
  strip(q, f, s + 1.6, s + 2.5, 0, PLINTH + 2 * FH, 0.14, 0.65)
  arch(q, f, s, 3.4, 0, 2.7, 4.0, 0.12, STONE_L, 6)
  arch(q, f, s, 2.9, 0, 2.7, 3.7, 0.18, shade(DOOR_WOOD, 0.8), 6)
  rect(q, f, s + 0.02, s + 1.4, 0.1, 3.4, 0.22, DOOR_WOOD)
  for (const sg of [-0.7, 0.7]) rect(q, f, s + sg - 0.25, s + sg + 0.25, 3.0, 3.5, 0.24, DOOR_GILT)
  rect(q, f, s - 0.25, s + 0.25, 4.0, 4.8, 0.2, STONE_L)
}

/** A court or garden elevation of the hôtel: arched ground openings, tall arched piano nobile windows, square second-floor windows, a balustrade, a pediment. */
function hotelFace(q: MeshBuilder, f: Face, len: number, nb: number, eave: number, pediment: boolean): void {
  const bay = len / nb
  rect(q, f, 0, len, 0, 0.9, 0.05, STONE_D)
  ledge(q, f, 0, len, PLINTH + 0.1, PLINTH + 0.35, 0.28, STONE_L)
  ledge(q, f, 0, len, 8.1, 8.4, 0.3, STONE_L)
  ledge(q, f, 0, len, eave - 0.6, eave, 0.5, STONE_L)
  for (let i = 0; i <= nb; i++) rect(q, f, Math.max(0, i * bay - 0.22), Math.min(len, i * bay + 0.22), 0.9, eave - 0.6, 0.14, STONE_L)
  for (let i = 0; i < nb; i++) {
    const s = (i + 0.5) * bay
    archWin(q, f, s, 1.1, 3.1, 4.0, bay - 1.5, 0.08)
    archWin(q, f, s, 4.9, 7.7, 8.8, bay - 1.4, 0.08)
    sqWin(q, f, s, 10.4, eave - 1.4, bay - 1.7, 0.08)
  }
  // the iron balcony of the middle bays
  rect(q, f, len / 2 - bay, len / 2 + bay, 4.9, 5.7, 0.4, STEEL)
  rect(q, f, 0, len, eave, eave + 0.2, 0.46, STONE_L)
  rect(q, f, 0, len, eave + 0.2, eave + 0.85, 0.4, shade(STONE_D, 1.05))
  if (pediment) {
    const pw = PEDIMENT_BAYS * bay / 2
    tri(q, f, [len / 2 - pw, eave + 0.2], [len / 2 + pw, eave + 0.2], [len / 2, eave + 0.2 + 2.6], 0.3, STONE_L)
    tri(q, f, [len / 2 - pw + 0.6, eave + 0.45], [len / 2 + pw - 0.6, eave + 0.45], [len / 2, eave + 0.2 + 2.1], 0.34, shade(STONE_D, 0.95))
    rect(q, f, len / 2 - 0.9, len / 2 + 0.9, eave + 0.45, eave + 0.85, 0.36, STONE_L)
  }
}

function buildings(q: MeshBuilder): void {
  // the south corner block and the street wings
  wing(q, CORNER)
  wing(q, WING_S)
  wing(q, WING_N)
  wing(q, FRONT_60)
  carriageDoor(q, FRONT_60.x0)
  gate(q)
  hall(q)
  // the entry court behind the gate: paving
  sheet(q, [[GATE_X0, 0.45, 1.4], [GATE_X1, 0.45, 1.4], [GATE_X1, 0.45, HOTEL.z0], [GATE_X0, 0.45, HOTEL.z0]], COURT_PAVE)
  // the hôtel
  const H = HOTEL
  block(q, H.x0, H.x1, H.z0, H.z1, 0, H.eave, STONE)
  mansard(q, H.x0, H.x1, H.z0, H.z1, H.eave, H.top, 3.0)
  hotelFace(q, { o: [H.x0, H.z0], t: [1, 0], n: [0, -1] }, H.x1 - H.x0, H.bays, H.eave, false)
  hotelFace(q, { o: [H.x1, H.z1], t: [-1, 0], n: [0, 1] }, H.x1 - H.x0, H.bays, H.eave, true)
  for (const x of [H.x0 + 5, H.x0 + 14, H.x1 - 14, H.x1 - 5]) chimney(q, x, (H.z0 + H.z1) / 2, H.top - 0.2)
  // the block behind the south wing and the court: a plain mass with a slate roof
  block(q, WING_S.x1 - 4, GATE_X0 + 2, 6, 31, 0, 16.8, STONE)
  mansard(q, WING_S.x1 - 4, GATE_X0 + 2, 6, 31, 16.8, 22.8, 2.0)
  block(q, CORNER.x0, CORNER.x1 + 12, CORNER.z1 - 1, CORNER.z1 + 12, 0, 20.5, STONE)
  mansard(q, CORNER.x0, CORNER.x1 + 12, CORNER.z1 - 1, CORNER.z1 + 12, 20.5, 25.4, 2.4)
  // the north: the transverse wing, the north pavilion, the garden wall and the open court
  const T = TRANSVERSE, N = NORTH_BLOCK
  block(q, T.x0, T.x1, T.z0, T.z1, 0, T.eave, STONE)
  mansard(q, T.x0, T.x1, T.z0, T.z1, T.eave, T.top, 2.0)
  block(q, N.x0, N.x1, N.z0, N.z1, 0, N.eave, STONE)
  mansard(q, N.x0, N.x1, N.z0, N.z1, N.eave, N.top, 2.6)
  chimney(q, T.x0 + 5, T.z0 + 20, T.top - 0.2)
  chimney(q, N.x0 + 7, N.z0 + 10, N.top - 0.2)
  // the north pavilion's court face and the transverse wing's: rows of windows
  const nf: Face = { o: [N.x0, N.z0], t: [1, 0], n: [0, -1] }
  for (let i = 0; i < 3; i++) for (let k = 0; k < 4; k++) sqWin(q, nf, (i + 0.5) * 5, 2.4 + k * FH, 4.7 + k * FH, 1.4, 0.05)
  const tf: Face = { o: [T.x1, T.z0 + 1], t: [0, 1], n: [1, 0] }
  for (let i = 0; i < 5; i++) for (let k = 0; k < 3; k++) sqWin(q, tf, 3 + i * 5.6, 2.4 + k * FH, 4.7 + k * FH, 1.4, 0.05)
  // the garden wall on the boulevard, with its railing
  const wf = STREET(FRONT_60.x1)
  block(q, FRONT_60.x1, WALL_X1, 0, 0.7, 0, WALL_H, STONE)
  rect(q, wf, 0, WALL_X1 - FRONT_60.x1, 0, 0.8, 0.04, STONE_D)
  rect(q, wf, 0, WALL_X1 - FRONT_60.x1, WALL_H - 0.2, WALL_H + 0.1, 0.12, STONE_L)
  sheet(q, [[FRONT_60.x1, 0.45, 0.7], [WALL_X1, 0.45, 0.7], [WALL_X1, 0.45, DEPTH_MAX - 6], [FRONT_60.x1, 0.45, DEPTH_MAX - 6]], COURT_PAVE)
}

export const HOTEL_VENDOME_REFS = ['relation/975976']

export function hotelVendome(out: MeshBuilder): void {
  const first = out.positions.length / 3
  const q = new MeshBuilder()
  buildings(q)
  const c = Math.cos(TURN), s = Math.sin(TURN)
  into(out, q, ORIGIN, c, s)
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
