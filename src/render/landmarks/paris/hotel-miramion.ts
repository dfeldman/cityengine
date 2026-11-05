import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { beam, block, hex, roof, shade } from '../kit.ts'
import { into } from './louvre-palace.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL DE MIRAMION (47 quai de la Tournelle, 5e; 17th c., attributed to François Mansart; hôtel entre cour et jardin; court and garden façades
 * listed 1926; later the pharmacy and the Musée de l'Assistance publique; OSM relation/568776).
 * Read off Commons photographs ("Musée de l'Assistance Publique" = the quai front; "Hôtel de Miramion - Cour intérieure"; "- Jardin des plantes
 * médicinales") and the IGN LiDAR HD surface model (tools/ign-mns.ts at 48.850576 N, 2.35190 E, 55 m): the quai front is a two-storey cream
 * stone range under a hipped slate roof with pedimented dormers and a central portal (pilasters, entablature with a lettered plaque, a tall
 * arched blue leaf, a small window over it); behind the gate a cobbled court with the main house at its far end (rusticated ground storey with
 * mask keystones, tall first-floor windows, a cornice, a steep slate roof alternating pedimented dormers with round oeils-de-boeuf); a west
 * wing, a flat-roofed east wing at 13 m. Roofs (relative to the median ground): quai range 16-17, main house 20-24, wings 13-19.
 * The OSM ring sits a few metres off the ortho, so this is placed on the lidar, not on the ring.
 *
 * Drawn in the quai's frame (x along it, +z out toward the quai, the building at negative z) and turned into the plan by `into`; x = 0 is the
 * west end of the quai front. The quai runs 23.4 degrees south of east.
 */
// ---- tunable: the frame (the plan origin is the entry's lat/lon, 48.850576 N 2.35190 E; metres east, north)
export const TURN = -Math.atan2(22.6, 52.3)
export const ORIGIN: P = [-18.3, 28.9]     // the quai front's west end in the plan
export const FLOOR = 0.5
// ---- tunable: the quai range
export const FRONT_LEN = 56
export const RANGE_DEPTH = 10
export const EAVE = 8.8
export const RIDGE = 12.8
export const BAY = 3.4
export const PLINTH = 0.7
export const SILL0 = 1.0, HEAD0 = 3.3        // ground-floor windows (barred)
export const SILL1 = 4.6, HEAD1 = 7.6        // first-floor windows
export const GATE_U = 20.5                   // the portal's centre
export const GATE_W = 3.1
export const GATE_H = 3.9
export const PORTAL_H = 5.6
export const DORMER_EVERY = 6.8
// ---- tunable: the east pavilion on the quai
export const EAST_U0 = 31, EAST_U1 = 47
export const EAST_EAVE = 10.0, EAST_RIDGE = 15.8
// ---- tunable: wings and the main house
export const WEST_W = 9.5, WING_BACK = 38
export const WING_EAVE = 9.4, WING_RIDGE = 16.5
export const COURT_Z = -9.5, MAIN_Z = -19, MAIN_BACK = -38
export const MAIN_U0 = 9.5, MAIN_U1 = 36.5
export const MAIN_EAVE = 10.6, MAIN_RIDGE = 22
export const EASTWING_U0 = 36.5, EASTWING_U1 = 50, EASTWING_TOP = 12.8
// ---- tunable: colours
const STONE: Rgb = hex('#d6c9a5')
const STONE_D: Rgb = hex('#b8a984')
const STONE_L: Rgb = hex('#e6dcc0')
const COURT_STONE: Rgb = hex('#c9b78c')
const SLATE: Rgb = hex('#6a6f77')
const SLATE_HI: Rgb = hex('#7b8088')
const GLASS: Rgb = [0.2, 0.24, 0.3]
const FRAME: Rgb = hex('#e9e6dc')
const DOOR: Rgb = hex('#2d4a78')
const IRON: Rgb = [0.1, 0.1, 0.11]
const PAVE: Rgb = hex('#7d7a74')
const ZINC: Rgb = hex('#8e9aa3')
const BRICK: Rgb = hex('#a56a50')

type Face = { o: P; t: P; n: P }
const faceN = (o: P, n: P): Face => ({ o, n, t: [n[1], -n[0]] })
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
  const r = w / 2, h = top - spring, N = 7
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N
    tri(q, f, [sc, spring], [sc - Math.cos(a0) * r, spring + Math.sin(a0) * h], [sc - Math.cos(a1) * r, spring + Math.sin(a1) * h], d, col)
  }
}
/** A round window (oeil-de-boeuf): a fan, with a stone ring. */
function oculus(q: MeshBuilder, f: Face, s: number, y: number, r: number, d: number): void {
  const N = 10
  for (const [rr, col, dd] of [[r + 0.22, STONE_L, d], [r, GLASS, d + 0.04]] as [number, Rgb, number][]) {
    for (let i = 0; i < N; i++) {
      const a0 = 2 * Math.PI * i / N, a1 = 2 * Math.PI * (i + 1) / N
      tri(q, f, [s, y], [s + Math.cos(a0) * rr, y + Math.sin(a0) * rr], [s + Math.cos(a1) * rr, y + Math.sin(a1) * rr], dd, col)
    }
  }
}
/** A pedimented dormer: stone cheeks, glass, a triangular head, a slate hip; on slope from `y0` at depth d0. */
function dormer(q: MeshBuilder, f: Face, s: number, y0: number, w: number, h: number, d: number): void {
  rect(q, f, s - w / 2 - 0.25, s + w / 2 + 0.25, y0, y0 + h + 0.1, d, STONE_L)
  rect(q, f, s - w / 2, s + w / 2, y0 + 0.25, y0 + h - 0.1, d + 0.04, GLASS)
  rect(q, f, s - 0.04, s + 0.04, y0 + 0.25, y0 + h - 0.1, d + 0.07, FRAME)
  rect(q, f, s - w / 2, s + w / 2, y0 + h * 0.55, y0 + h * 0.55 + 0.06, d + 0.07, FRAME)
  tri(q, f, [s - w / 2 - 0.4, y0 + h + 0.1], [s + w / 2 + 0.4, y0 + h + 0.1], [s, y0 + h + w * 0.45], d + 0.08, STONE_L)
  tri(q, f, [s - w / 2 - 0.2, y0 + h + 0.12], [s + w / 2 + 0.2, y0 + h + 0.12], [s, y0 + h + w * 0.4], d + 0.1, STONE)
}
/** A tall paned window with a stone surround on face f at s. */
function window(q: MeshBuilder, f: Face, s: number, y0: number, y1: number, w: number, d: number, bars = false, surround = STONE_L): void {
  rect(q, f, s - w / 2 - 0.22, s + w / 2 + 0.22, y0 - 0.12, y1 + 0.3, d, surround)
  rect(q, f, s - w / 2, s + w / 2, y0, y1, d + 0.04, GLASS)
  if (bars) {
    for (let k = 1; k < 4; k++) rect(q, f, s - w / 2 + (k * w) / 4 - 0.03, s - w / 2 + (k * w) / 4 + 0.03, y0, y1, d + 0.07, IRON)
    rect(q, f, s - w / 2, s + w / 2, (y0 + y1) / 2 - 0.03, (y0 + y1) / 2 + 0.03, d + 0.07, IRON)
    return
  }
  rect(q, f, s - 0.04, s + 0.04, y0, y1, d + 0.07, FRAME)
  for (let y = y0 + (y1 - y0) / 4; y < y1 - 0.1; y += (y1 - y0) / 4) rect(q, f, s - w / 2, s + w / 2, y - 0.03, y + 0.03, d + 0.07, FRAME)
  rect(q, f, s - w / 2, s + w / 2, y0 - 0.1, y0, d + 0.12, STONE_D)
}

/** The quai front: plinth, banded ground storey, cornice, windows per bay, the portal, dormers. */
function quaiFront(q: MeshBuilder): void {
  const f = faceN([0, 0], [0, 1])
  const L = FRONT_LEN
  rect(q, f, 0, L, 0, PLINTH, 0.08, STONE_D)
  rect(q, f, 0, L, 3.75, 3.95, 0.1, STONE_L)               // the string course between storeys
  rect(q, f, 0, L, EAVE - 0.5, EAVE, 0.3, STONE_L)           // the cornice
  rect(q, f, 0, L, EAVE - 0.7, EAVE - 0.5, 0.2, STONE_D)
  const nb = Math.round(L / BAY)
  const du = L / nb
  const gateBay = Math.round((GATE_U - du / 2) / du)
  for (let i = 0; i < nb; i++) {
    const s = (i + 0.5) * du
    if (i === gateBay) continue
    window(q, f, s, SILL0, HEAD0, 1.1, 0.06, true, STONE_D)
    window(q, f, s, SILL1, HEAD1, 1.2, 0.06)
  }
  // the portal on the gate bay (its centre is the bay's centre)
  const c = (gateBay + 0.5) * du
  portal(q, f, c)
  // pedimented dormers in the slate over alternate stretches
  for (let s = 6; s < L - 4; s += DORMER_EVERY) {
    const ok = s > EAST_U0 - 1 && s < EAST_U1 + 1
    if (ok) continue
    dormer(q, f, s, EAVE + 0.1, 1.1, 2.1, 0.05)
  }
}
function portal(q: MeshBuilder, f: Face, c: number): void {
  const W = GATE_W + 2.1
  rect(q, f, c - W / 2, c + W / 2, 0, PORTAL_H, 0.12, STONE_D)                       // the piers
  for (let y = 0.4; y < PORTAL_H; y += 0.45) for (const sg of [-1, 1]) rect(q, f, c + sg * (GATE_W / 2 + 0.1), c + sg * (W / 2), y, y + 0.04, 0.16, shade(STONE_D, 0.75))
  arch(q, f, c, GATE_W + 0.5, 0, GATE_H - 1.1, GATE_H + 0.35, 0.16, STONE_L)       // the surround
  arch(q, f, c, GATE_W, 0, GATE_H - 1.5, GATE_H, 0.2, DOOR)                          // the leaves
  rect(q, f, c - 0.03, c + 0.03, 0, GATE_H - 1.5, 0.24, IRON)
  for (let y = 0.5; y < GATE_H - 1.3; y += 0.6) rect(q, f, c - GATE_W / 2, c + GATE_W / 2, y, y + 0.04, 0.23, shade(DOOR, 0.7))
  rect(q, f, c - W / 2 - 0.3, c + W / 2 + 0.3, PORTAL_H, PORTAL_H + 0.45, 0.4, STONE_L)  // entablature
  rect(q, f, c - W / 2 + 0.3, c + W / 2 - 0.3, GATE_H + 0.7, PORTAL_H - 0.2, 0.2, STONE_L) // the lettered plaque band
  rect(q, f, c - W / 2 + 0.6, c + W / 2 - 0.6, GATE_H + 0.95, GATE_H + 1.25, 0.24, DOOR)
  // the small window over the portal with its hood
  window(q, f, c, PORTAL_H + 0.7, PORTAL_H + 1.9, 1.0, 0.08)
  dormer(q, f, c, EAVE + 0.1, 1.3, 2.3, 0.05)
}

function chimney(q: MeshBuilder, x: number, z: number, y0: number, y1: number): void {
  block(q, x - 0.5, x + 0.5, z - 0.35, z + 0.35, y0, y1, BRICK)
  block(q, x - 0.6, x + 0.6, z - 0.45, z + 0.45, y1, y1 + 0.2, STONE_L)
}

/** The quai range, west wing, main house, east wing: boxes, hip roofs, the court between. */
function body(q: MeshBuilder): void {
  const L = FRONT_LEN
  // the range along the quai, split to carry the taller east pavilion
  block(q, 0, EAST_U0, -RANGE_DEPTH, 0, 0, EAVE, STONE)
  block(q, EAST_U1, L, -RANGE_DEPTH, 0, 0, EAVE, STONE)
  block(q, EAST_U0, EAST_U1, -RANGE_DEPTH - 2, 0, 0, EAST_EAVE, STONE)
  // hipped slate roofs: ridge along the range
  const hip = (x0: number, x1: number, z0: number, z1: number, eave: number, ridge: number, ix: number, iz: number): void => {
    roof(q, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, eave, ridge - eave, ix, iz, SLATE)
  }
  hip(0, EAST_U0, -RANGE_DEPTH, 0, EAVE, RIDGE, 3.4, (RANGE_DEPTH + 0.6) / 2)
  hip(EAST_U1, L, -RANGE_DEPTH, 0, EAVE, RIDGE, 3.4, (RANGE_DEPTH + 0.6) / 2)
  hip(EAST_U0, EAST_U1, -RANGE_DEPTH - 2, 0, EAST_EAVE, EAST_RIDGE, 4.5, (RANGE_DEPTH + 2.6) / 2 - 0.4)
  // the west wing, ridge along the depth, hipped at the back
  block(q, 0, WEST_W, -WING_BACK, -RANGE_DEPTH + 0.1, 0, WING_EAVE, STONE)
  roof(q, -0.3, WEST_W + 0.3, -WING_BACK - 0.3, -RANGE_DEPTH + 0.1, WING_EAVE, WING_RIDGE - WING_EAVE, (WEST_W + 0.6) / 2, 3.5, SLATE)
  // the main house at the court's far end
  block(q, MAIN_U0, MAIN_U1, MAIN_BACK, MAIN_Z, 0, MAIN_EAVE, COURT_STONE)
  roof(q, MAIN_U0 - 0.4, MAIN_U1 + 0.4, MAIN_BACK - 0.4, MAIN_Z + 0.4, MAIN_EAVE, MAIN_RIDGE - MAIN_EAVE, 4.2, 4.6, SLATE)
  // the east wing: flat zinc roof behind a parapet
  block(q, EASTWING_U0, EASTWING_U1, MAIN_BACK + 1, -RANGE_DEPTH + 0.1, 0, EASTWING_TOP, STONE)
  block(q, EASTWING_U0 + 0.4, EASTWING_U1 - 0.4, MAIN_BACK + 1.4, -RANGE_DEPTH - 0.3, EASTWING_TOP, EASTWING_TOP + 0.12, ZINC)
  // the court: cobbles, between the range and the main house
  q.quad([[WEST_W, 0.04, COURT_Z - 0.01], [EASTWING_U0, 0.04, COURT_Z - 0.01], [EASTWING_U0, 0.04, MAIN_Z], [WEST_W, 0.04, MAIN_Z]], [0, 1, 0], UV, PAVE, FIXED)
  q.quad([[0, 0.05, 0.2], [FRONT_LEN, 0.05, 0.2], [FRONT_LEN, 0.05, 3.0], [0, 0.05, 3.0]], [0, 1, 0], UV, PAVE, FIXED)  // the quai pavement
  // chimneys
  for (const u of [6, 14, 26, 44, 52]) chimney(q, u, -RANGE_DEPTH * 0.45, RIDGE - 0.5, RIDGE + 1.6)
  chimney(q, 14, -33, MAIN_RIDGE - 0.6, MAIN_RIDGE + 1.8)
  chimney(q, 30, -33, MAIN_RIDGE - 0.6, MAIN_RIDGE + 1.8)
  chimney(q, 4.5, -25, WING_RIDGE - 0.4, WING_RIDGE + 1.6)
  // rear wall windows (the garden front is twice the court front's length: tall windows, plain)
  const back = faceN([MAIN_U1, MAIN_BACK], [0, -1])
  const gl = MAIN_U1 - MAIN_U0
  for (let s = 1.5; s < gl - 0.5; s += 3.3) { window(q, back, s, 1.2, 4.3, 1.1, 0.05); window(q, back, s, 5.2, 8.6, 1.1, 0.05) }
  rect(q, back, 0, gl, MAIN_EAVE - 0.5, MAIN_EAVE, 0.25, STONE_L)
}

/** The court front of the main house: rusticated ground storey with mask keystones, tall windows over, cornice, dormers on the roof. */
function mainFront(q: MeshBuilder): void {
  const f = faceN([MAIN_U0, MAIN_Z], [0, 1])
  const L = MAIN_U1 - MAIN_U0
  rect(q, f, 0, L, 0, 0.8, 0.06, STONE_D)
  for (let y = 0.9; y < 4.1; y += 0.62) rect(q, f, 0, L, y, y + 0.05, 0.04, STONE_D)
  rect(q, f, 0, L, 4.45, 4.8, 0.12, STONE_L)                // the sill band
  rect(q, f, 0, L, MAIN_EAVE - 0.7, MAIN_EAVE, 0.35, STONE_L)
  rect(q, f, 0, L, MAIN_EAVE - 0.9, MAIN_EAVE - 0.7, 0.2, STONE_D)
  const nb = Math.round(L / 3.4)
  const du = L / nb
  const mid = Math.floor(nb / 2)
  for (let i = 0; i < nb; i++) {
    const s = (i + 0.5) * du
    if (i === mid) {
      // the door, steps, a window over it with a mask and a hood
      rect(q, f, s - 1.0, s + 1.0, 0.8, 3.6, 0.1, STONE_L)
      rect(q, f, s - 0.8, s + 0.8, 0.8, 3.2, 0.14, FRAME)
      rect(q, f, s - 0.02, s + 0.02, 0.8, 3.2, 0.18, IRON)
      for (let k = 0; k < 3; k++) block(q, MAIN_U0 + s - 1.0 - k * 0.15, MAIN_U0 + s + 1.0 + k * 0.15, MAIN_Z, MAIN_Z + 0.5 - k * 0.15, 0, 0.18 * (3 - k), STONE_L)
    } else {
      window(q, f, s, 1.1, 3.8, 1.2, 0.08, false, STONE_L)
    }
    window(q, f, s, 5.3, 9.0, 1.2, 0.08, false, STONE_L)
    rect(q, f, s - 0.4, s + 0.4, 4.0, 4.4, 0.12, STONE_D)            // the mask
    // the dormers: round, round, pedimented ... centre one pedimented
    const y0 = MAIN_EAVE + 0.1
    if (i % 2 === (mid % 2)) dormer(q, f, s, y0, 1.2, 2.3, 0.05)
    else oculus(q, f, s, y0 + 1.3, 0.7, 0.05)
  }
}

export const HOTEL_MIRAMION_REFS = ['relation/568776']

export function hotelMiramion(out: MeshBuilder): void {
  const first = out.positions.length / 3
  const q = new MeshBuilder()
  body(q)
  quaiFront(q)
  mainFront(q)
  // the iron lamp and bollards on the quai
  for (let u = 2; u < FRONT_LEN; u += 4.5) beam(q, [u, 0.05, 2.2], [u, 0.8, 2.2], 0.06, IRON)
  const c = Math.cos(TURN), s = Math.sin(TURN)
  into(out, q, ORIGIN, c, s)
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
