import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { buildRoof, safeInset, type Pt } from '../../roofs.ts'
import { block, hex, shade } from '../kit.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL DE CASTRIES (72 rue de Varenne, 7e; Ministère de la Cohésion des territoires; built about 1700 for the Broglie, Castries from 1740;
 * monument historique PA00088703; OSM relation/1076763 = outer way/68556439 minus the cour, wikidata Q3145789).
 * Read off Commons: "Hôtel de Castries 01" / "Façade" (the cour front: three storeys, arched ground windows with scrolled keystones, tall windows with
 * iron balconies, a three-bay avant-corps under a pediment with an oculus, slate mansard with dormers); "Paris Hôtel de Castries 75" (the street gate:
 * a wall with a balustrade each side of a banded pavilion, a plum double door, the plaque HOTEL DE CASTRIES, a cornice and a small pediment with an oculus);
 * the garden front (nine bays, a triangular pediment with an oculus over the middle three, lawn and pond).
 * Plan from OSM's single outline (the cour is its inner ring); roofs from tools/ign-mns.ts at 48.85525 N, 2.31925 E (the mansards read 17-19 m, the
 * annexes 17 m and 12-13 m; the 21-23 m peak north of the garden front is a tree).
 *
 * Drawn in the plan frame: x east, z north, metres from 48.85525 N, 2.31925 E. The street runs along the SW edge, the garden is NE.
 */
// ---- tunable: heights
export const FLOOR = 0.5
export const MAIN_EAVE = 12.4      // the corps de logis' cornice
export const MAIN_TOP = 18.2
export const WEST_EAVE = 11.6
export const WEST_TOP = 17.2
export const STREET_EAVE = 10.6    // the street wing, behind its wall
export const STREET_TOP = 17.0
export const EAST_EAVE = 9.8
export const EAST_TOP = 13.2
export const ANNEX_N = 17.0        // the later ministry blocks, flat
export const ANNEX_S = 12.6
export const STEEP_IN = 2.6
export const DECK_IN = 2.2
// ---- tunable: the plan
export const RING: P[] = [   // the outer way, from its SW corner, clockwise round the east and back along the garden
  [-32.4, 3.4], [-24.6, 0.4], [-16.3, -2.7], [-11.9, -4.3], [-6.8, -6.4], [-1.1, 8.1], [-0.7, 7.9], [0.7, 11.7], [16.2, 5.8], [14.7, 1.8], [15, 1.7],
  [9.6, -12.5], [28.7, -19.8], [35.3, -22.3], [35.8, -21.1], [36, -21.2], [37.6, -17.4], [32.2, -15.4], [32.3, -15.1], [21.4, -10.9], [23, -7], [23.5, -7.2],
  [25.1, -6.5], [26.6, -2.4], [33.8, -5.1], [36.5, 2.4], [32.9, 3.7], [34.4, 8.1], [26.7, 10.9], [27.9, 14], [-3, 25.6], [-4.4, 22.3], [-22.3, 28.7],
  [-22.9, 27.2], [-27.6, 16.1], [-31.8, 5],
]
export const COUR: P[] = [[-24.5, 6.1], [-20.6, 17.1], [-11.2, 13.7], [-15.4, 2.8]]
const R = (i: number): P => RING[i]
const A_: P = [-30.5, 8.4], B_: P = [-4.75, -1.2], N1: P = [-26.1, 19.6]
export const STREET: P[] = [R(0), R(1), R(2), R(3), R(4), B_, COUR[3], COUR[0], A_, R(35)]
export const GATE_AT: P = [-16.3, -2.7]    // OSM's entrance node
export const WALL_BACK = 1.8       // the street wing stands this far behind the wall
const SD: P = (() => { const dx = R(4)[0] - R(0)[0], dz = R(4)[1] - R(0)[1], l = Math.hypot(dx, dz); return [dx / l, dz / l] })()   // along the street front
const NIN: P = [-SD[1], SD[0]]     // into the block
const at0 = (s: number, d: number): P => [R(0)[0] + SD[0] * s + NIN[0] * d, R(0)[1] + SD[1] * s + NIN[1] * d]
export const GATE_S = (GATE_AT[0] - R(0)[0]) * SD[0] + (GATE_AT[1] - R(0)[1]) * SD[1]
export const PASSAGE = 2.4         // half-width of the carriage passage through the street wing, behind the gate
const DC = (COUR[0][0] - R(0)[0]) * NIN[0] + (COUR[0][1] - R(0)[1]) * NIN[1]   // the cour's street edge, measured from the street line
const L4 = Math.hypot(R(4)[0] - R(0)[0], R(4)[1] - R(0)[1])
export const STREET_WING_W: P[] = [at0(0, WALL_BACK), at0(GATE_S - PASSAGE, WALL_BACK), at0(GATE_S - PASSAGE, DC), COUR[0], A_]
export const STREET_WING_E: P[] = [at0(GATE_S + PASSAGE, WALL_BACK), at0(L4, WALL_BACK), B_, at0(GATE_S + PASSAGE, DC)]
export const WEST: P[] = [A_, R(34), N1, COUR[1], COUR[0]]
export const EAST: P[] = [COUR[3], B_, R(5), R(6), R(7), COUR[2]]
export const MAIN: P[] = [N1, COUR[1], COUR[2], R(7), R(8), R(29), R(30), R(31), R(32), R(33)]
const P_: P = [11.7, -7]
export const ANNEX_NORTH: P[] = [R(10), P_, R(20), R(21), R(22), R(23), R(24), R(25), R(26), R(27), R(28), R(29), R(8), R(9)]
export const ANNEX_SOUTH: P[] = [R(11), R(12), R(13), R(14), R(15), R(16), R(17), R(18), R(19), R(20), P_]
// ---- tunable: the street wall and gate (Commons: door 2.9 x 3.9 m, wall 4.2 m, balustrade to 5.3 m, entablature 5.5 m, pediment apex 7.4 m)
export const WALL_H = 4.2
export const BALU_TOP = 5.3
export const PAV_W = 6.4
export const DOOR_W = 2.9
export const DOOR_H = 3.9
export const PAV_ENT = 5.5
export const PAV_APEX = 7.5
export const PAV_PED_W = 5.2
export const BAY_STREET = 3.4
// ---- tunable: the cour and garden fronts
export const STRING_1 = 4.3
export const STRING_2 = 8.6
export const AVANT_OUT = 0.5
export const GARDEN_BAYS = 9
export const GARDEN_AVANT = 3
// ---- tunable: colours (the honey-cream stone of the photographs)
const STONE: Rgb = hex('#d9ccaa')
const STONE_D: Rgb = hex('#c4b690')
const STONE_L: Rgb = hex('#e8dec3')
const COURSE: Rgb = hex('#b3a47e')
const SLATE: Rgb = hex('#4d5666')
const SLATE_HI: Rgb = hex('#5f6b7d')
const GLASS: Rgb = [0.13, 0.16, 0.2]
const IRON: Rgb = [0.06, 0.06, 0.07]
const DOOR: Rgb = hex('#5a2f3a')
const DOOR_D: Rgb = hex('#47232c')
const COURT_PAVE: Rgb = hex('#a89d86')
const PLAQUE: Rgb = hex('#3c3a36')
const CHIMNEY: Rgb = hex('#d3c7a6')
const ANNEX_WALL: Rgb = hex('#cfc4a6')
const ANNEX_ROOF: Rgb = hex('#7d8088')

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

/** A face: origin, tangent, outward normal on the plan, and length. */
type Face = { o: P; t: P; n: P; len: number }
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
  const r = w / 2, h = top - spring, N = 8
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
/** An oriented box on a face: s0..s1 along, y0..y1 up, d0..d1 out. */
function obox(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, d0: number, d1: number, col: Rgb): void {
  rect(q, f, s0, s1, y0, y1, d1, col)
  sheet(q, [at(f, s0, y1, d0), at(f, s1, y1, d0), at(f, s1, y1, d1), at(f, s0, y1, d1)], shade(col, 1.04))
  for (const [s, sg] of [[s0, -1], [s1, 1]] as [number, number][]) {
    const n: V3 = [f.t[0] * sg, 0, f.t[1] * sg]
    q.quad([at(f, s, y0, d0), at(f, s, y0, d1), at(f, s, y1, d1), at(f, s, y1, d0)], n, UV, shade(col, 0.9), FIXED)
  }
}

const inside = (p: P, poly: P[]): boolean => {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j]
    if ((zi > p[1]) !== (zj > p[1]) && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) c = !c
  }
  return c
}
/** The face on edge i of a part (a -> b), its normal pointing out of the polygon. */
function faceOf(poly: P[], i: number): Face {
  const a = poly[i], b = poly[(i + 1) % poly.length]
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz)
  const t: P = [dx / len, dz / len]
  let n: P = [t[1], -t[0]]
  const m: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  if (inside([m[0] + n[0] * 0.3, m[1] + n[1] * 0.3], poly)) n = [-n[0], -n[1]]
  return { o: a, t, n, len }
}

// ---- openings
/** A square window: stone surround, glass in two casements, a sill. `bars` for the ground storey's iron grilles. */
function sqWin(q: MeshBuilder, f: Face, s: number, y0: number, y1: number, w: number, d: number, bars = false): void {
  rect(q, f, s - w / 2 - 0.2, s + w / 2 + 0.2, y0 - 0.12, y1 + 0.22, d + 0.03, STONE_L)
  rect(q, f, s - w / 2, s + w / 2, y0, y1, d + 0.08, bars ? IRON : GLASS)
  if (bars) {
    for (let k = 1; k < 6; k++) { const x = s - w / 2 + (w * k) / 6; rect(q, f, x - 0.018, x + 0.018, y0, y1, d + 0.1, shade(STONE_D, 0.7)) }
  } else {
    rect(q, f, s - 0.025, s + 0.025, y0, y1, d + 0.1, STONE_L)
    const ym = y0 + (y1 - y0) * 0.62
    rect(q, f, s - w / 2, s + w / 2, ym - 0.025, ym + 0.025, d + 0.1, STONE_L)
  }
  ledge(q, f, s - w / 2 - 0.28, s + w / 2 + 0.28, y0 - 0.2, y0 - 0.08, d + 0.14, STONE_L)
}
function archWin(q: MeshBuilder, f: Face, s: number, y0: number, spring: number, top: number, w: number, d: number): void {
  arch(q, f, s, w + 0.5, y0 - 0.05, spring, top + 0.25, d + 0.03, STONE_L)
  arch(q, f, s, w, y0, spring, top, d + 0.08, GLASS)
  rect(q, f, s - 0.025, s + 0.025, y0, spring, d + 0.1, STONE_L)
  rect(q, f, s - w / 2, s + w / 2, spring - 0.03, spring + 0.03, d + 0.1, STONE_L)
  rect(q, f, s - w / 2, s + w / 2, y0 + (spring - y0) * 0.5 - 0.025, y0 + (spring - y0) * 0.5 + 0.025, d + 0.1, STONE_L)
}
/** A tall window with an iron balcony rail. */
function balconyWin(q: MeshBuilder, f: Face, s: number, y0: number, y1: number, w: number, d: number): void {
  sqWin(q, f, s, y0, y1, w, d)
  obox(q, f, s - w / 2 - 0.2, s + w / 2 + 0.2, y0 - 0.02, y0 + 0.9, d + 0.02, d + 0.2, IRON)
  rect(q, f, s - w / 2 - 0.15, s + w / 2 + 0.15, y0 + 0.08, y0 + 0.82, d + 0.22, shade(GLASS, 1.6))
}
/** An oval (oeil-de-boeuf) dormer on the mansard: a stone ring, glass, its cheeks. */
function oval(q: MeshBuilder, f: Face, s: number, y: number, d: number, rw: number, rh: number): void {
  const N = 10
  for (let i = 0; i < N; i++) {
    const a0 = (2 * Math.PI * i) / N, a1 = (2 * Math.PI * (i + 1)) / N
    const p = (a: number, k: number): P => [s + Math.cos(a) * rw * k, y + Math.sin(a) * rh * k]
    tri(q, f, p(a0, 1.25), p(a1, 1.25), [s, y], d, STONE_L)
    tri(q, f, p(a0, 0.82), p(a1, 0.82), [s, y], d + 0.04, GLASS)
  }
  obox(q, f, s - rw * 1.25, s + rw * 1.25, y - rh * 1.3, y + rh * 1.3, d - 0.9, d - 0.02, SLATE)
}

// ---- masses
function skirt(q: MeshBuilder, lower: Pt[], upper: Pt[], y0: number, y1: number, col: Rgb): void {
  const n = lower.length
  for (let i = 0; i < n; i++) {
    const a = lower[i], b = lower[(i + 1) % n], c = upper[(i + 1) % n], d = upper[i]
    const p: [V3, V3, V3, V3] = [[a.x, y0, a.z], [b.x, y0, b.z], [c.x, y1, c.z], [d.x, y1, d.z]]
    sheet(q, p, col)
  }
}
const toPts = (poly: P[]): Pt[] => poly.map(([x, z]) => ({ x, z }))
/** Walls from the ground to `eave`, a cornice course, and a mansard to `top`. */
function mass(q: MeshBuilder, poly: P[], eave: number, top: number): void {
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const f = faceOf(poly, i)
    rect(q, f, 0, f.len, 0, eave, 0, STONE)
    rect(q, f, 0, f.len, 0, 0.6, 0.04, STONE_D)
  }
  const ring = toPts(poly)
  const steep = safeInset(ring, STEEP_IN)
  if (!steep) { buildRoof(q, ring, { shape: 'flat', y: eave, height: 0, colour: SLATE }); return }
  const yMid = eave + (top - eave) * 0.78
  skirt(q, ring, steep, eave, yMid, SLATE)
  const deck = safeInset(steep, DECK_IN)
  if (!deck) { buildRoof(q, steep, { shape: 'flat', y: yMid, height: 0, colour: SLATE_HI }); return }
  skirt(q, steep, deck, yMid, top, SLATE_HI)
  buildRoof(q, deck, { shape: 'flat', y: top, height: 0, colour: SLATE_HI })
}
/** A cornice round a face at `y`. */
function cornice(q: MeshBuilder, f: Face, y: number, out = 0.5): void {
  ledge(q, f, 0, f.len, y - 0.55, y + 0.05, out, STONE_L)
  rect(q, f, 0, f.len, y - 1.05, y - 0.55, 0.05, STONE_D)
}
const chimney = (q: MeshBuilder, x: number, z: number, y: number, h = 2.3): void => {
  block(q, x - 0.55, x + 0.55, z - 0.45, z + 0.45, y - 0.3, y + h, CHIMNEY)
  block(q, x - 0.7, x + 0.7, z - 0.6, z + 0.6, y + h, y + h + 0.22, STONE_D)
}
function windowFace(q: MeshBuilder, f: Face, eave: number, bay: number, rows: [number, number, number][], arched = false): void {
  cornice(q, f, eave, 0.4)
  const nb = Math.max(1, Math.round(f.len / bay)), b = f.len / nb
  for (let i = 0; i < nb; i++) {
    const s = (i + 0.5) * b
    rows.forEach(([y0, y1, w], r) => {
      if (arched && r === 0) archWin(q, f, s, y0, y1 - 1.0, y1, w, 0.04)
      else sqWin(q, f, s, y0, y1, w, 0.04)
    })
  }
}

const along = (f: Face, p: P): number => (p[0] - f.o[0]) * f.t[0] + (p[1] - f.o[1]) * f.t[1]

const flatPoly = (q: MeshBuilder, poly: P[], y: number, col: Rgb): void => buildRoof(q, toPts(poly), { shape: 'flat', y, height: 0, colour: col })

/** A flat-roofed block with plain stone walls. */
function flatMass(q: MeshBuilder, poly: P[], h: number): void {
  for (let i = 0; i < poly.length; i++) {
    const f = faceOf(poly, i)
    rect(q, f, 0, f.len, 0, h, 0, ANNEX_WALL)
    rect(q, f, 0, f.len, 0, 0.5, 0.04, STONE_D)
    ledge(q, f, 0, f.len, h - 0.5, h + 0.1, 0.25, STONE_L)
  }
  flatPoly(q, poly, h + 0.1, ANNEX_ROOF)
}

/** A dormer on the mansard: window, stone frame, a little pediment, slate cheeks. */
function dormer(q: MeshBuilder, f: Face, s: number, y: number, d: number, w = 1.0, h = 1.5): void {
  sqWin(q, f, s, y - h / 2, y + h / 2, w, d)
  q.quad([at(f, s - w / 2 - 0.25, y + h / 2 + 0.22, d + 0.05), at(f, s + w / 2 + 0.25, y + h / 2 + 0.22, d + 0.05), at(f, s, y + h / 2 + 0.75, d + 0.05), at(f, s, y + h / 2 + 0.75, d + 0.05)], nrm(f), UV, STONE_L, FIXED)
  obox(q, f, s - w / 2 - 0.3, s + w / 2 + 0.3, y - h / 2 - 0.2, y + h / 2 + 0.2, d - 1.0, d - 0.02, SLATE)
}
/** A pediment on a face: base at `yb`, apex `ph` above, with its oculus. */
function pediment(q: MeshBuilder, f: Face, s0: number, s1: number, yb: number, ph: number, d: number): void {
  const mid = (s0 + s1) / 2
  q.quad([at(f, s0, yb, d), at(f, s1, yb, d), at(f, mid, yb + ph, d), at(f, mid, yb + ph, d)], nrm(f), UV, STONE, FIXED)
  q.quad([at(f, s0, yb, d + 0.2), at(f, mid, yb + ph, d + 0.2), at(f, mid, yb + ph, d - 0.1), at(f, s0, yb, d - 0.1)], [-f.t[0] * 0.5 + f.n[0] * 0.5, 0.7, -f.t[1] * 0.5 + f.n[1] * 0.5], UV, STONE_L, FIXED)
  q.quad([at(f, mid, yb + ph, d + 0.2), at(f, s1, yb, d + 0.2), at(f, s1, yb, d - 0.1), at(f, mid, yb + ph, d - 0.1)], [f.t[0] * 0.5 + f.n[0] * 0.5, 0.7, f.t[1] * 0.5 + f.n[1] * 0.5], UV, STONE_L, FIXED)
  const N = 10, cy = yb + ph * 0.38, r = Math.min(0.5, ph * 0.26)
  for (let i = 0; i < N; i++) {
    const a0 = (2 * Math.PI * i) / N, a1 = (2 * Math.PI * (i + 1)) / N
    tri(q, f, [mid, cy], [mid + Math.cos(a0) * r * 1.3, cy + Math.sin(a0) * r * 1.3], [mid + Math.cos(a1) * r * 1.3, cy + Math.sin(a1) * r * 1.3], d + 0.04, STONE_L)
    tri(q, f, [mid, cy], [mid + Math.cos(a0) * r, cy + Math.sin(a0) * r], [mid + Math.cos(a1) * r, cy + Math.sin(a1) * r], d + 0.08, GLASS)
  }
}

// ---- the street: a wall, a balustrade, the banded gate pavilion
function streetFront(q: MeshBuilder): void {
  const f = faceOf([R(0), R(4), at0(L4, WALL_BACK), at0(0, WALL_BACK)], 0)
  const gs = along(f, GATE_AT)
  const p0 = gs - PAV_W / 2, p1 = gs + PAV_W / 2
  // the wall: ashlar panels in a plinth and a string, the balustrade above
  for (const [s0, s1] of [[0, p0], [p1, f.len]] as [number, number][]) {
    rect(q, f, s0, s1, 0, WALL_H, 0, STONE)
    rect(q, f, s0, s1, 0, 0.7, 0.05, STONE_D)
    for (let y = 1.1; y < WALL_H - 0.2; y += 0.55) rect(q, f, s0, s1, y, y + 0.04, 0.02, COURSE)
    ledge(q, f, s0, s1, WALL_H - 0.3, WALL_H + 0.15, 0.2, STONE_L)
    const bal = (BALU_TOP - WALL_H - 0.15)
    rect(q, f, s0, s1, WALL_H + 0.15, WALL_H + 0.15 + 0.2, 0.12, STONE_L)
    rect(q, f, s0, s1, BALU_TOP - 0.15, BALU_TOP, 0.14, STONE_L)
    for (let s = s0 + 0.3; s < s1 - 0.2; s += 0.42) obox(q, f, s - 0.1, s + 0.1, WALL_H + 0.35, WALL_H + 0.35 + bal - 0.2, 0.02, 0.2, STONE_L)
    obox(q, f, s0, s1, WALL_H, BALU_TOP, -0.5, 0.0, STONE)    // the wall's thickness, closed at the top behind the rail
  }
  // the pavilion: banded piers (alternating thick/thin ashlar), the door, the lintel and its plaque, the entablature, the pediment
  const pw = (PAV_W - DOOR_W) / 2
  rect(q, f, p0, p1, 0, PAV_ENT, 0.08, STONE)
  for (const [a, b] of [[p0, p0 + pw], [p1 - pw, p1]] as [number, number][]) {
    rect(q, f, a, b, 0, 0.7, 0.14, STONE_D)
    let k = 0
    for (let y = 0.7; y < DOOR_H + 0.55; y += 0.5, k++) {
      const hh = k % 2 ? 0.34 : 0.44
      rect(q, f, a + 0.06, b - 0.06, y, Math.min(y + hh, DOOR_H + 0.55), 0.14, k % 2 ? STONE_D : STONE_L)
      rect(q, f, a + 0.06, b - 0.06, y + hh, y + hh + 0.04, 0.15, COURSE)
    }
  }
  const dl = gs - DOOR_W / 2, dr = gs + DOOR_W / 2
  rect(q, f, dl - 0.1, dr + 0.1, DOOR_H, DOOR_H + 0.7, 0.16, STONE_L)           // the lintel
  rect(q, f, gs - 1.0, gs + 1.0, DOOR_H + 0.18, DOOR_H + 0.5, 0.2, PLAQUE)      // HOTEL DE CASTRIES
  rect(q, f, dl, dr, 0, DOOR_H, 0.0, GLASS)                                        // the passage beyond the leaves
  for (const [a, b] of [[dl, gs - 0.04], [gs + 0.04, dr]] as [number, number][]) {
    rect(q, f, a + 0.05, b - 0.05, 0.1, DOOR_H - 0.05, 0.12, DOOR)
    rect(q, f, a + 0.3, b - 0.3, 0.4, 1.7, 0.14, DOOR_D)
    rect(q, f, a + 0.3, b - 0.3, 2.0, DOOR_H - 0.4, 0.14, DOOR_D)
  }
  ledge(q, f, p0 - 0.2, p1 + 0.2, PAV_ENT - 0.6, PAV_ENT + 0.1, 0.35, STONE_L)    // the entablature
  rect(q, f, p0, p1, PAV_ENT + 0.1, PAV_ENT + 0.5, 0.06, STONE)                    // the attic base under the pediment
  pediment(q, f, gs - PAV_PED_W / 2, gs + PAV_PED_W / 2, PAV_ENT + 0.5, PAV_APEX - PAV_ENT - 0.5, 0.06)
  // the street wing above the wall: a second storey of windows, dormers on the mansard
  for (const wf of [faceOf(STREET_WING_W, 0), faceOf(STREET_WING_E, 0)]) {
    cornice(q, wf, STREET_EAVE, 0.4)
    const nb = Math.max(1, Math.round(wf.len / BAY_STREET)), b = wf.len / nb
    for (let i = 0; i < nb; i++) {
      const s = (i + 0.5) * b
      sqWin(q, wf, s, 6.4, 9.0, 1.2, 0.04)
      if (i % 2 === 0) dormer(q, wf, s, STREET_EAVE + 1.55, STEEP_IN * 0.3)
    }
  }
}

// ---- the cour front of the corps de logis (MAIN edge 1), 3 bays under the pediment
function courFront(q: MeshBuilder): void {
  const f = faceOf(MAIN, 1)
  const nb = 3, bay = f.len / nb, c = (i: number): number => (i + 0.5) * bay
  cornice(q, f, MAIN_EAVE, 0.5)
  ledge(q, f, 0, f.len, STRING_1 - 0.2, STRING_1 + 0.2, 0.15, STONE_L)
  ledge(q, f, 0, f.len, STRING_2 - 0.15, STRING_2 + 0.15, 0.12, STONE_L)
  for (let i = 0; i < nb; i++) {
    const s = c(i)
    archWin(q, f, s, 0.5, 2.7, 3.7, 1.5, 0.05)
    balconyWin(q, f, s, 5.2, 8.0, 1.35, 0.05)
    sqWin(q, f, s, 9.6, 11.4, 1.1, 0.05)
  }
  obox(q, f, 0.6, f.len - 0.6, 0.5, MAIN_EAVE - 0.6, 0, AVANT_OUT, STONE)
  for (let i = 0; i < nb; i++) {
    const s = c(i)
    archWin(q, f, s, 0.5, 2.7, 3.7, 1.5, AVANT_OUT + 0.05)
    balconyWin(q, f, s, 5.2, 8.0, 1.35, AVANT_OUT + 0.05)
    sqWin(q, f, s, 9.6, 11.4, 1.1, AVANT_OUT + 0.05)
  }
  pediment(q, f, -0.3, f.len + 0.3, MAIN_EAVE + 0.05, 2.6, 0.3)
  for (const s of [c(0) - bay * 0.3, c(2) + bay * 0.3]) dormer(q, f, s, MAIN_EAVE + 1.5, STEEP_IN * 0.3)
}

// ---- the garden front: nine bays on MAIN edge 5, the middle three under a pediment
function gardenFront(q: MeshBuilder): void {
  const f = faceOf(MAIN, 5)
  const bay = f.len / GARDEN_BAYS, c = (i: number): number => (i + 0.5) * bay
  const a0 = Math.floor((GARDEN_BAYS - GARDEN_AVANT) / 2), a1 = a0 + GARDEN_AVANT
  cornice(q, f, MAIN_EAVE, 0.6)
  ledge(q, f, 0, f.len, STRING_1 - 0.2, STRING_1 + 0.2, 0.15, STONE_L)
  ledge(q, f, 0, f.len, STRING_2 - 0.15, STRING_2 + 0.15, 0.12, STONE_L)
  for (let i = 0; i < GARDEN_BAYS; i++) {
    const s = c(i), av = i >= a0 && i < a1, d = av ? AVANT_OUT : 0
    archWin(q, f, s, 0.5, 2.7, 3.7, 1.5, d + 0.05)
    balconyWin(q, f, s, 5.2, 8.0, 1.35, d + 0.05)
    sqWin(q, f, s, 9.6, 11.4, 1.1, d + 0.05)
    if (i % 2 === 0) dormer(q, f, s, MAIN_EAVE + 1.5, STEEP_IN * 0.3)
  }
  obox(q, f, a0 * bay, a1 * bay, 0.5, MAIN_EAVE - 0.6, 0, AVANT_OUT, STONE)
  for (let i = a0; i < a1; i++) {
    const s = c(i)
    archWin(q, f, s, 0.5, 2.7, 3.7, 1.5, AVANT_OUT + 0.05)
    balconyWin(q, f, s, 5.2, 8.0, 1.35, AVANT_OUT + 0.05)
    sqWin(q, f, s, 9.6, 11.4, 1.1, AVANT_OUT + 0.05)
  }
  pediment(q, f, a0 * bay - 0.3, a1 * bay + 0.3, MAIN_EAVE + 0.05, 2.7, AVANT_OUT + 0.3)
  for (const s of [bay * 2, bay * 7]) { const p = at(f, s, 0, -5.0); chimney(q, p[0], p[2], MAIN_TOP) }
}

function elevations(q: MeshBuilder): void {
  const rows: [number, number, number][] = [[0.9, 3.5, 1.3], [5.2, 8.0, 1.3], [9.4, 11.2, 1.1]]
  windowFace(q, faceOf(WEST, 0), WEST_EAVE, 3.4, rows, true)            // the west flank on the lane
  windowFace(q, faceOf(WEST, 1), WEST_EAVE, 3.4, rows, true)
  windowFace(q, faceOf(WEST, 3), WEST_EAVE, 3.4, rows, true)            // the cour's west side
  windowFace(q, faceOf(EAST, 5), EAST_EAVE, 3.4, [[0.9, 3.3, 1.3], [4.8, 7.2, 1.2]], true)   // the cour's east side
  windowFace(q, faceOf(EAST, 1), EAST_EAVE, 3.4, [[0.9, 3.3, 1.3], [4.8, 7.2, 1.2]], true)
  const sw: [number, number, number][] = [[0.9, 3.3, 1.3], [5.0, 7.6, 1.2]]
  windowFace(q, faceOf(STREET_WING_W, 1), STREET_EAVE, 3.4, sw)          // the passage's walls
  windowFace(q, faceOf(STREET_WING_E, 3), STREET_EAVE, 3.4, sw)
  windowFace(q, faceOf(STREET_WING_W, 3), STREET_EAVE, 3.4, sw, true)    // the cour's street side
  windowFace(q, faceOf(EAST, 0), EAST_EAVE, 3.4, sw)                       // the passage's far wall
  windowFace(q, faceOf(MAIN, 9), MAIN_EAVE, 3.4, rows, true)
  windowFace(q, faceOf(MAIN, 7), MAIN_EAVE, 3.4, rows, true)
  windowFace(q, faceOf(MAIN, 6), MAIN_EAVE, 3.4, rows)
  windowFace(q, faceOf(MAIN, 3), MAIN_EAVE, 3.6, rows, true)
  for (let i = 0; i < ANNEX_NORTH.length; i++) windowFace(q, faceOf(ANNEX_NORTH, i), ANNEX_N, 3.6, [[1.3, 3.2, 1.2], [5.0, 7.0, 1.2], [9.0, 11.0, 1.2]])
  for (let i = 0; i < ANNEX_SOUTH.length; i++) windowFace(q, faceOf(ANNEX_SOUTH, i), ANNEX_S, 3.6, [[1.3, 3.2, 1.2], [5.0, 7.0, 1.2]])
}

function buildings(q: MeshBuilder): void {
  mass(q, STREET_WING_W, STREET_EAVE, STREET_TOP)
  mass(q, STREET_WING_E, STREET_EAVE, STREET_TOP)
  flatPoly(q, STREET, 0.1, COURT_PAVE)
  mass(q, WEST, WEST_EAVE, WEST_TOP)
  mass(q, EAST, EAST_EAVE, EAST_TOP)
  mass(q, MAIN, MAIN_EAVE, MAIN_TOP)
  flatMass(q, ANNEX_NORTH, ANNEX_N)
  flatMass(q, ANNEX_SOUTH, ANNEX_S)
  flatPoly(q, COUR, 0.12, COURT_PAVE)
  flatPoly(q, [R(0), R(4), at0(L4, WALL_BACK), at0(0, WALL_BACK)], 0.12, COURT_PAVE)   // the strip between wall and wing
  streetFront(q)
  courFront(q)
  gardenFront(q)
  elevations(q)
}

export const HOTEL_CASTRIES_REFS = ['relation/1076763']

export function hotelCastries(out: MeshBuilder): void {
  const first = out.positions.length / 3
  buildings(out)
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
