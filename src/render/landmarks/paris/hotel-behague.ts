import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { beam, block, hex, shade } from '../kit.ts'
import { into } from './louvre-palace.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL DE BÉHAGUE (Hôtel de Béarn; Romanian embassy; 123 rue Saint-Dominique, 7e; OSM way/69859760): a Louis XVI hôtel (1770s) enlarged
 * by Destailleur from 1866. Read off Commons photographs (Paris - Hôtel de Béarn - 123 rue Saint-Dominique - 001 and "Hôtel de Béarn.jpg": from the
 * street only a low, curved, rusticated stone screen with two arched carriage gates, a cornice with urns, and over it the pedimented pavilion of the
 * court's end under a slate mansard) and IGN's LiDAR HD surface model (the garden-side logis ridge 23-24 m, its mansard eaves ~19 m, the street
 * pavilion 21-24 m, east wing ridge 19 m, the lower links 13 m).
 *
 * Plan metres east / north of 48.85818 N, 2.30308 E, but drawn in the street's own frame (x = u along rue Saint-Dominique, 25 deg north of east;
 * z = v toward the street) and turned into the plan by `into`. The street's kerb line is at v = 51; the screen stands at v ~ 45.
 */
// ---- tunable: the frame
export const TURN = (25 * Math.PI) / 180
export const FLOOR = 0.5            // the model's ground (the loader sinks every base by it)
// ---- tunable: the street screen
export const SCREEN_U = [-2.5, 17.5]   // from, to (u)
export const SCREEN_V = 45          // v at the ends
export const SCREEN_SAG = 2.0       // the middle stands this far back from the ends (concave to the street)
export const SCREEN_H = 5.9         // the wall's top, under the cornice
export const SCREEN_THICK = 0.7
export const RUST = 0.85            // spacing of the rustication joints
export const GATE_U = [5.1, 9.9]   // the two carriage gates, centres
export const GATE_W = 2.9
export const GATE_SPRING = 3.2      // where the arch springs
export const GATE_TOP = 4.7
// ---- tunable: the masses. u0, u1, v0, v1, eave, ridge-break, top; sides to put windows on (N toward the street)
export type Mass = { u0: number; u1: number; v0: number; v1: number; eave: number; brk: number; top: number; inB: number; inT: number; sides: string; storeys: number[]; ped?: boolean }
export const MASSES: Mass[] = [
  // the garden-side logis: 24 m ridge, mansard
  { u0: -22, u1: 0, v0: -10, v1: 10, eave: 14, brk: 19, top: 23.5, inB: 3.2, inT: 7.5, sides: 'NSEW', storeys: [0.6, 5.2, 9.6] },
  // the pedimented pavilion at the court's end behind the screen
  { u0: 0.5, u1: 14.5, v0: 29, v1: 40, eave: 11.6, brk: 15.5, top: 19.5, inB: 2.4, inT: 4.4, sides: 'NSEW', storeys: [0.6, 5.0, 8.4], ped: true },
  // the link between logis and pavilion
  { u0: 0.5, u1: 14.5, v0: 10, v1: 29, eave: 9, brk: 11.5, top: 13, inB: 2.2, inT: 5, sides: 'EW', storeys: [0.6, 4.6] },
  // the east wing
  { u0: 8, u1: 28, v0: -8, v1: 12, eave: 12.5, brk: 16.5, top: 19, inB: 3, inT: 7, sides: 'NSE', storeys: [0.6, 5, 8.8] },
  // the low gallery between logis and east wing
  { u0: 0, u1: 8, v0: -8, v1: 10, eave: 9, brk: 11.5, top: 13, inB: 2.2, inT: 3.5, sides: 'NS', storeys: [0.6, 4.6] },
  // the west arms
  { u0: -25.5, u1: -14, v0: 10, v1: 26, eave: 11.5, brk: 14.5, top: 17.5, inB: 2.5, inT: 4.5, sides: 'NWE', storeys: [0.6, 4.8, 8.2] },
  { u0: -25.5, u1: -14, v0: -22, v1: -10, eave: 11.5, brk: 14.5, top: 17.5, inB: 2.5, inT: 4.5, sides: 'SWE', storeys: [0.6, 4.8, 8.2] },
]
export const BAY = 3.3
export const WIN_W = 1.25
export const WIN_H = 2.7
export const DORMER_EVERY = 1
export const PED_RISE = 2.6         // the pediment's height
export const URNS = [-2.5, 2.4, 7.5, 12.6, 17.5]   // urns on the screen's cornice (u)
// ---- tunable: colours
const STONE: Rgb = hex('#d8c298')
const STONE_D: Rgb = shade(STONE, 0.82)
const STONE_L: Rgb = hex('#e6d9b8')
const SLATE: Rgb = hex('#4a5163')
const SLATE_HI: Rgb = hex('#5a6377')
const GLASS: Rgb = [0.2, 0.25, 0.3]
const DOOR: Rgb = hex('#9b6a38')
const DOOR_D: Rgb = hex('#5d3e22')
const IRON: Rgb = [0.1, 0.1, 0.11]
const BRICK: Rgb = hex('#9b6a55')

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

/** A face: its origin, tangent and outward normal on the plan; `at` gives a point s along, y up, d out. */
type Face = { o: P; t: P; n: P }
const at = (f: Face, s: number, y: number, d: number): V3 => [f.o[0] + f.t[0] * s + f.n[0] * d, y, f.o[1] + f.t[1] * s + f.n[1] * d]
const nrm = (f: Face): V3 => [f.n[0], 0, f.n[1]]
function rect(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, d: number, col: Rgb): void {
  q.quad([at(f, s0, y0, d), at(f, s1, y0, d), at(f, s1, y1, d), at(f, s0, y1, d)], nrm(f), UV, col, FIXED)
}
/** A triangle (a quad with a repeated corner). */
function tri(q: MeshBuilder, f: Face, a: P, b: P, c: P, d: number, col: Rgb): void {
  q.quad([at(f, a[0], a[1], d), at(f, b[0], b[1], d), at(f, c[0], c[1], d), at(f, c[0], c[1], d)], nrm(f), UV, col, FIXED)
}
/** A fan-filled arch-headed opening: the rectangle to `spring`, a semicircle over it, in `n` slices. */
function archOpening(q: MeshBuilder, f: Face, sc: number, w: number, y0: number, spring: number, top: number, d: number, col: Rgb): void {
  rect(q, f, sc - w / 2, sc + w / 2, y0, spring, d, col)
  const r = w / 2, h = top - spring, N = 6
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N
    const p0: P = [sc - Math.cos(a0) * r, spring + Math.sin(a0) * h], p1: P = [sc - Math.cos(a1) * r, spring + Math.sin(a1) * h]
    tri(q, f, [sc, spring], p0, p1, d, col)
  }
}

/** A window on a face at s: stone surround, glass, a central bar; the piano nobile (first storey) carries an iron balcony. */
function window(q: MeshBuilder, f: Face, s: number, y: number, nobile: boolean): void {
  const hw = WIN_W / 2
  const h = nobile ? WIN_H + 0.6 : WIN_H
  rect(q, f, s - hw - 0.22, s + hw + 0.22, y - 0.1, y + h + 0.25, 0.04, STONE_L)
  rect(q, f, s - hw, s + hw, y, y + h, 0.08, GLASS)
  rect(q, f, s - 0.04, s + 0.04, y, y + h, 0.1, STONE_L)
  rect(q, f, s - hw, s + hw, y + h * 0.65, y + h * 0.65 + 0.07, 0.1, STONE_L)
  if (nobile) {
    rect(q, f, s - hw - 0.3, s + hw + 0.3, y, y + 0.9, 0.34, IRON)
    rect(q, f, s - hw - 0.35, s + hw + 0.35, y - 0.12, y + 0.02, 0.36, STONE_L)
  }
}

const OUT: Record<string, { o: (m: Mass) => P; t: P; n: P; len: (m: Mass) => number }> = {
  N: { o: (m) => [m.u0, m.v1], t: [1, 0], n: [0, 1], len: (m) => m.u1 - m.u0 },
  S: { o: (m) => [m.u0, m.v0], t: [1, 0], n: [0, -1], len: (m) => m.u1 - m.u0 },
  E: { o: (m) => [m.u1, m.v0], t: [0, 1], n: [1, 0], len: (m) => m.v1 - m.v0 },
  W: { o: (m) => [m.u0, m.v0], t: [0, 1], n: [-1, 0], len: (m) => m.v1 - m.v0 },
}

function mass(q: MeshBuilder, m: Mass): void {
  block(q, m.u0, m.u1, m.v0, m.v1, 0, m.eave, STONE)
  for (const k of m.sides) {
    const g = OUT[k]
    const f: Face = { o: g.o(m), t: g.t, n: g.n }
    const L = g.len(m)
    const nb = Math.max(1, Math.round(L / BAY)), bw = L / nb
    // string courses and the cornice
    rect(q, f, 0, L, m.storeys[1] - 0.35, m.storeys[1] - 0.1, 0.06, STONE_D)
    rect(q, f, -0.1, L + 0.1, m.eave - 0.55, m.eave, 0.4, STONE_L)
    rect(q, f, 0, L, m.eave - 0.8, m.eave - 0.55, 0.2, STONE_D)
    for (let i = 0; i < nb; i++) {
      const s = (i + 0.5) * bw
      m.storeys.forEach((y, j) => {
        // the pavilion's street face shows only its attic over the screen: three small square lights, no tall windows
        if (m.ped && k === 'N') {
          if (j === m.storeys.length - 1) {
            const hw = 0.65
            rect(q, f, s - hw - 0.2, s + hw + 0.2, y + 0.3, y + 2.1, 0.04, STONE_L)
            rect(q, f, s - hw, s + hw, y + 0.5, y + 1.9, 0.08, GLASS)
          }
          return
        }
        if (j === 0) {
          // the ground floor: arched windows
          archOpening(q, f, s, WIN_W + 0.2, y + 0.3, y + 2.2, y + 3.1, 0.07, GLASS)
        } else window(q, f, s, y, j === 1 && m.storeys.length > 2)
      })
    }
    // quoins
    rect(q, f, 0, 0.4, 0, m.eave - 0.8, 0.05, STONE_L)
    rect(q, f, L - 0.4, L, 0, m.eave - 0.8, 0.05, STONE_L)
  }
  roof(q, m)
}

/** The mansard: a steep lower slope, a shallow upper one, a flat top; dormers in the lower slope; an iron crest on the top. */
function roof(q: MeshBuilder, m: Mass): void {
  const ov = 0.35
  const ring = (inset: number, y: number): V3[] => {
    const u0 = m.u0 + inset - (inset === 0 ? ov : 0), u1 = m.u1 - inset + (inset === 0 ? ov : 0)
    const v0 = m.v0 + inset - (inset === 0 ? ov : 0), v1 = m.v1 - inset + (inset === 0 ? ov : 0)
    return [[u0, y, v0], [u1, y, v0], [u1, y, v1], [u0, y, v1]]
  }
  const rE = ring(0, m.eave), rB = ring(m.inB, m.brk)
  const inT = Math.min(m.inT, Math.min(m.u1 - m.u0, m.v1 - m.v0) / 2 - 0.2)
  const rT = ring(inT, m.top)
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    sheet(q, [rE[i], rE[j], rB[j], rB[i]], SLATE)
    sheet(q, [rB[i], rB[j], rT[j], rT[i]], SLATE_HI)
  }
  sheet(q, [rT[0], rT[1], rT[2], rT[3]], SLATE_HI)
  // dormers on the lower slope of each long side (and the ends of the long masses)
  for (const k of 'NSEW') {
    const g = OUT[k]
    const L = g.len(m)
    const nb = Math.max(1, Math.round(L / BAY))
    const bw = L / nb
    const f: Face = { o: g.o(m), t: g.t, n: g.n }
    for (let i = 0; i < nb; i += DORMER_EVERY) {
      const s = (i + 0.5) * bw
      if (m.ped && k === 'N' && Math.abs(s - L / 2) < L * 0.4) continue   // the pediment stands there
      const y0 = m.eave + (m.brk - m.eave) * 0.12, d = m.inB * 0.5
      // a stone dormer: front, glass, side cheeks, a little hipped lid
      rect(q, f, s - 0.7, s + 0.7, y0, y0 + 1.9, d, STONE_L)
      rect(q, f, s - 0.45, s + 0.45, y0 + 0.3, y0 + 1.6, d + 0.04, GLASS)
      const a = at(f, s - 0.8, y0 + 1.9, d + 0.1), b = at(f, s + 0.8, y0 + 1.9, d + 0.1), c = at(f, s, y0 + 2.6, d - 0.8)
      sheet(q, [a, b, c, c], SLATE_HI)
    }
  }
  // iron crest and a pair of chimney stacks on the flat top
  const lx = (m.u0 + m.u1) / 2, lz = (m.v0 + m.v1) / 2
  const long = m.u1 - m.u0 >= m.v1 - m.v0
  if (long) beam(q, [rT[0][0], m.top + 0.4, lz], [rT[1][0], m.top + 0.4, lz], 0.06, IRON)
  else beam(q, [lx, m.top + 0.4, rT[0][2]], [lx, m.top + 0.4, rT[3][2]], 0.06, IRON)
  for (const t of [0.3, 0.7]) {
    const x = long ? m.u0 + (m.u1 - m.u0) * t : lx, z = long ? lz : m.v0 + (m.v1 - m.v0) * t
    block(q, x - 0.6, x + 0.6, z - 0.4, z + 0.4, m.top - 0.5, m.top + 2.3, BRICK)
    block(q, x - 0.7, x + 0.7, z - 0.5, z + 0.5, m.top + 2.3, m.top + 2.6, STONE_L)
  }
}

/** The pediment on the street face of the pavilion: the raised centre, the triangle, a cartouche. */
function pediment(q: MeshBuilder, m: Mass): void {
  const g = OUT.N
  const f: Face = { o: g.o(m), t: g.t, n: g.n }
  const L = g.len(m)
  const c = L / 2, hw = L * 0.34
  // a slightly proud central avant-corps, the triangle on top
  rect(q, f, c - hw, c + hw, m.eave - 0.8, m.eave, 0.5, STONE_L)
  tri(q, f, [c - hw - 0.3, m.eave], [c + hw + 0.3, m.eave], [c, m.eave + PED_RISE], 0.5, STONE_L)
  tri(q, f, [c - hw + 0.4, m.eave + 0.25], [c + hw - 0.4, m.eave + 0.25], [c, m.eave + PED_RISE - 0.7], 0.56, STONE_D)
  rect(q, f, c - 0.5, c + 0.5, m.eave + 0.35, m.eave + 1.15, 0.62, STONE_L)   // the cartouche
  // the slate roof behind it, seen as the gable's back
}

function screen(q: MeshBuilder): void {
  const N = 16
  const [u0, u1] = SCREEN_U
  const c = (u0 + u1) / 2, hw = (u1 - u0) / 2
  const vAt = (u: number): number => SCREEN_V - SCREEN_SAG * (1 - ((u - c) / hw) ** 2)
  const pts: P[] = []
  for (let i = 0; i <= N; i++) { const u = u1 - (u1 - u0) * i / N; pts.push([u, vAt(u)]) }
  const dir = (a: P, b: P): { t: P; n: P } => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const t: P = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; return { t, n: [t[1], -t[0]] } }
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[i + 1]
    const { t, n } = dir(a, b)
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    const f: Face = { o: a, t, n }
    rect(q, f, 0, L, 0, SCREEN_H, 0, STONE)
    for (let y = RUST; y < SCREEN_H - 0.3; y += RUST) rect(q, f, 0, L, y, y + 0.06, 0.03, STONE_D)
    // the cornice with its overhang, and a plinth
    rect(q, f, -0.02, L + 0.02, SCREEN_H, SCREEN_H + 0.35, 0.28, STONE_L)
    rect(q, f, -0.02, L + 0.02, SCREEN_H + 0.35, SCREEN_H + 0.75, 0.1, STONE)
    rect(q, f, -0.02, L + 0.02, 0, 0.35, 0.08, STONE_D)
    // the back of the wall, facing the court (its normal reversed)
    const g: Face = { o: [a[0] - n[0] * SCREEN_THICK, a[1] - n[1] * SCREEN_THICK], t, n: [-n[0], -n[1]] }
    rect(q, g, 0, L, 0, SCREEN_H + 0.2, 0, shade(STONE, 0.9))
    // the cornice's top
    q.quad([at(f, 0, SCREEN_H + 0.75, 0.1), at(f, L, SCREEN_H + 0.75, 0.1), at(f, L, SCREEN_H + 0.75, -SCREEN_THICK), at(f, 0, SCREEN_H + 0.75, -SCREEN_THICK)], [0, 1, 0], UV, STONE, FIXED)
  }
  // the gates: arched leaves in a stone surround with keystone and voussoirs, a pier of flags between
  for (const gu of GATE_U) {
    // the segment that holds u = gu
    const i = Math.min(N - 1, Math.max(0, Math.floor((u1 - gu) / ((u1 - u0) / N))))
    const a = pts[i], b = pts[i + 1]
    const { t, n } = dir(a, b)
    const f: Face = { o: a, t, n }
    const s = Math.hypot(gu - a[0], vAt(gu) - a[1]) // along the chord
    archOpening(q, f, s, GATE_W + 0.9, 0.35, GATE_SPRING, GATE_TOP + 0.45, 0.06, STONE_L)
    archOpening(q, f, s, GATE_W, 0.35, GATE_SPRING, GATE_TOP, 0.1, DOOR_D)
    archOpening(q, f, s, GATE_W - 0.5, 0.35, GATE_SPRING - 0.05, GATE_TOP - 0.3, 0.12, DOOR)
    rect(q, f, s - 0.05, s + 0.05, 0.35, GATE_SPRING + 0.9, 0.14, DOOR_D)
    for (let k = 0; k < 7; k++) {
      const a0 = Math.PI * (k + 0.5) / 7
      const px = s - Math.cos(a0) * (GATE_W / 2 + 0.2), py = GATE_SPRING + Math.sin(a0) * (GATE_TOP - GATE_SPRING + 0.1)
      rect(q, f, px - 0.07, px + 0.07, py - 0.12, py + 0.12, 0.16, STONE_D)
    }
    rect(q, f, s - 0.3, s + 0.3, GATE_TOP + 0.1, GATE_TOP + 0.75, 0.18, STONE_L) // keystone
  }
  // the urns
  for (const u of URNS) {
    const v = vAt(u)
    block(q, u - 0.45, u + 0.45, v - 0.4, v + 0.1, SCREEN_H + 0.75, SCREEN_H + 1.1, STONE_L)
    block(q, u - 0.28, u + 0.28, v - 0.25, v + 0.0, SCREEN_H + 1.1, SCREEN_H + 1.8, STONE_L)
    block(q, u - 0.38, u + 0.38, v - 0.33, v + 0.08, SCREEN_H + 1.8, SCREEN_H + 2.2, STONE_L)
  }
  // the return walls at the two ends and the piers there
  for (const u of [u0, u1]) block(q, u - 0.5, u + 0.5, vAt(u) - 4, vAt(u) + 0.1, 0, SCREEN_H + 0.75, STONE)
}

export const HOTEL_BEHAGUE_REFS = ['way/69859760']

export function hotelBehague(out: MeshBuilder): void {
  const first = out.positions.length / 3
  const q = new MeshBuilder()
  for (const m of MASSES) {
    mass(q, m)
    if (m.ped) pediment(q, m)
  }
  screen(q)
  into(out, q, [0, 0], Math.cos(TURN), Math.sin(TURN))
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
