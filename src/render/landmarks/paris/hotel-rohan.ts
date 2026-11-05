import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { buildRoof, safeInset, type Pt } from '../../roofs.ts'
import { beam, block, column, hex, shade } from '../kit.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL DE ROHAN (the Hôtel de Rohan-Strasbourg; 87 rue Vieille-du-Temple, 3e; Pierre-Alexis Delamair, 1705-08; Archives nationales;
 * monument historique PA00086155; OSM way/251136638, wikidata Q1125932).
 * Read off Commons: "Hôtel Rohan - Paris III (FR75) - 2024-06-05 - 1 / 2" (the street gate: a great round-headed gate in ashlar with a keystone
 * console, entablature and a pedimented attic with an oculus, a barred window and an upper window each side); "Hôtel de Rohan 2017" (the garden
 * front: thirteen bays, three storeys, a three-bay avant-corps of four columns under a pediment, arched French windows below, oval dormers);
 * "Hôtel de Rohan Paris 3e 001" (the garden front at dusk, chimneys); Le Lorrain's "Chevaux d'Apollon" (a rectangular relief panel over a
 * round-headed stable door); the plan from OSM's single outline: a horseshoe round the Cour de Rohan, the corps de logis on the garden, a wing along
 * the Ruelle de la Roche, the street wing with the gate (OSM's entrance node), the stable wing toward the Cour des Chevaux du Soleil.
 * IGN LiDAR HD surface model (tools/ign-mns.ts at 48.8596 N, 2.3598 E): the corps de logis ridge 17-18 m, the wings 13-16 m; the court area reads
 * 13-24 m in the lidar (a temporary hall since removed, the court is a building site in the 2024 orthophoto): not used.
 *
 * Drawn in the plan frame: x east, z north, metres from the entry's lat/lon (the OSM ring's own frame). Five parts, each a polygon with an eave,
 * a mansard top and its faces dressed by style.
 */
// ---- tunable: heights
export const FLOOR = 0.5
export const BLOCK_EAVE = 12.9      // the corps de logis' cornice (garden front, ground storey + two)
export const BLOCK_TOP = 17.4       // the mansard's deck (lidar ridge 17-18)
export const SWING_EAVE = 9.4
export const SWING_TOP = 13.6
export const STREET_EAVE = 7.5      // the street wing's cornice (entablature 7.3 m in the gate photographs)
export const STREET_TOP = 13.2
export const STRIP_EAVE = 8.6
export const STRIP_TOP = 13.8
export const NEWING_EAVE = 9.0
export const NEWING_TOP = 15.4
export const STEEP_IN = 2.6         // the mansard's steep slope, inset at its foot
export const DECK_IN = 2.0
// ---- tunable: the plan (metres east / north of 48.8596 N 2.3598 E; OSM way/251136638, simplified)
export const BLOCK: P[] = [[-42.4, 5.4], [-12.4, 44.2], [0.2, 34.7], [-31.2, -3.4]]
export const SWING: P[] = [[-31.2, -3.4], [-24.8, 4.0], [-9.74, -8.13], [-11.2, -19.5]]
export const STREET: P[] = [[-12.8, -33.8], [3.1, -17.8], [4.5, -11.3], [-0.3, -12.8], [-9.74, -8.13], [-11.2, -19.5], [-15.3, -24.0]]
export const STRIP: P[] = [[-12.8, -33.8], [-38.1, -13.3], [-34.4, -8.4], [-15.3, -24.0]]
export const NEWING: P[] = [[-11.2, 20.5], [-6.65, 26.6], [15.8, 8.2], [20.4, -0.5], [8.4, -7.2], [10.4, -0.2], [3.7, 8.2]]
export const GATE_AT: P = [-7.65, -28.1]   // OSM's entrance node on the street front
export const OSM_RING: P[] = [   // the claimed way's outline (used by the test to check the parts cover it)
  [20.4, -0.5], [8.4, -7.2], [10.4, -0.2], [3.7, 8.2], [-11.2, 20.5], [-24.85, 4.0], [-9.74, -8.13], [-0.3, -12.8], [4.5, -11.3], [3.1, -17.8],
  [-12.8, -33.8], [-38.1, -13.3], [-34.4, -8.4], [-15.3, -24.0], [-11.2, -19.5], [-35.1, -0.4], [-42.4, 5.4], [-12.4, 44.2], [0.2, 34.7], [-6.65, 26.6], [15.8, 8.2],
]
// ---- tunable: the gate (photographs: arch 2.8 m wide, springing 3.2 m, 5.2 m to the crown; entablature 7.3 m, pediment apex 8.8 m)
export const GATE_W = 2.8
export const GATE_SPRING = 3.2
export const GATE_TOP = 5.2
export const GATE_FRAME = 0.55      // the stone ring round the opening
export const GATE_PED_W = 6.7
export const GATE_ENT = 7.3
export const GATE_PED_TOP = 8.8
export const BAY_STREET = 3.5       // the street front's window spacing
// ---- tunable: the garden front (13 bays, avant-corps of 3)
export const GARDEN_BAYS = 13
export const AVANT = 3              // bays in the central projecting part
export const AVANT_OUT = 1.1
export const STRING_1 = 4.9         // cornice over the ground storey
export const STRING_2 = 9.1         // cornice over the piano nobile
// ---- tunable: the stable relief (Le Lorrain's Chevaux d'Apollon) on the stable wing's court face
export const RELIEF_W = 6.2
export const RELIEF_H = 4.0
export const RELIEF_Y = 4.4
export const RELIEF_S = 14.0        // along the stable face from its west end
// ---- tunable: colours
const STONE: Rgb = hex('#cbc3b0')
const STONE_D: Rgb = hex('#b0a791')
const STONE_L: Rgb = hex('#dcd5c4')
const COURSE: Rgb = hex('#9c9380')
const SLATE: Rgb = hex('#454d5e')
const SLATE_HI: Rgb = hex('#566074')
const GLASS: Rgb = [0.13, 0.16, 0.2]
const IRON: Rgb = [0.06, 0.06, 0.07]
const DOOR: Rgb = hex('#7e5849')
const DOOR_D: Rgb = hex('#6d4638')
const COURT_PAVE: Rgb = hex('#a89d86')
const RELIEF_C: Rgb = hex('#c9bfa4')
const CHIMNEY: Rgb = hex('#cabd9f')

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

// ---- the garden front (BLOCK edge 0: SW end to NE end)
function gardenFront(q: MeshBuilder): void {
  const f = faceOf(BLOCK, 0)
  const bay = f.len / GARDEN_BAYS
  const c = (i: number): number => (i + 0.5) * bay
  const a0 = Math.floor((GARDEN_BAYS - AVANT) / 2), a1 = a0 + AVANT   // avant-corps bays a0..a1-1
  cornice(q, f, BLOCK_EAVE, 0.6)
  ledge(q, f, 0, f.len, STRING_1 - 0.2, STRING_1 + 0.2, 0.2, STONE_L)
  ledge(q, f, 0, f.len, STRING_2 - 0.18, STRING_2 + 0.18, 0.18, STONE_L)
  // the end bays are set back and rusticated at the angles
  for (const [s0, s1] of [[0, 0.5], [f.len - 0.5, f.len]] as [number, number][]) rect(q, f, s0, s1, 0.6, BLOCK_EAVE - 1, 0.12, STONE_D)
  for (let i = 0; i < GARDEN_BAYS; i++) {
    const s = c(i), av = i >= a0 && i < a1
    const d = av ? AVANT_OUT : 0
    if (i === 0 || i === GARDEN_BAYS - 1 || i === 1 || i === GARDEN_BAYS - 2) sqWin(q, f, s, 1.0, 3.7, 1.3, 0.05)
    else archWin(q, f, s, 0.45, 2.7, 3.9, 1.5, d + 0.05)
    balconyWin(q, f, s, 5.7, 8.5, 1.3, d + 0.05)
    sqWin(q, f, s, 10.1, 11.9, 1.15, d + 0.05)
  }
  // the avant-corps: a projecting body, four columns across the two lower storeys, a balcony slab, the pediment
  const s0 = a0 * bay, s1 = a1 * bay
  obox(q, f, s0, s1, 0.5, BLOCK_EAVE, 0, AVANT_OUT, STONE)
  for (let i = 0; i < GARDEN_BAYS; i++) if (i >= a0 && i < a1) {
    const s = c(i)
    archWin(q, f, s, 0.45, 2.7, 3.9, 1.5, AVANT_OUT + 0.05)
    balconyWin(q, f, s, 5.7, 8.5, 1.3, AVANT_OUT + 0.05)
    sqWin(q, f, s, 10.1, 11.9, 1.15, AVANT_OUT + 0.05)
  }
  for (const s of [s0 + 0.35, s0 + (s1 - s0) / 3, s0 + (2 * (s1 - s0)) / 3, s1 - 0.35]) {
    const p = at(f, s, 0, AVANT_OUT + 0.55)
    column(q, p[0], p[2], 0.5, STRING_2 - 0.2, 0.3, STONE_L)
  }
  ledge(q, f, s0 - 0.2, s1 + 0.2, STRING_1 - 0.3, STRING_1 + 0.2, AVANT_OUT + 1.1, STONE_L)
  ledge(q, f, s0 - 0.2, s1 + 0.2, STRING_2 - 0.2, STRING_2 + 0.3, AVANT_OUT + 1.0, STONE_L)
  // the pediment over the avant-corps (a prism on the cornice)
  const pw = s1 - s0 + 0.6, ph = 2.1, yb = BLOCK_EAVE + 0.05
  const mid = (s0 + s1) / 2
  q.quad([at(f, mid - pw / 2, yb, AVANT_OUT + 0.3), at(f, mid + pw / 2, yb, AVANT_OUT + 0.3), at(f, mid, yb + ph, AVANT_OUT + 0.3), at(f, mid, yb + ph, AVANT_OUT + 0.3)], nrm(f), UV, STONE_L, FIXED)
  q.quad([at(f, mid - pw / 2, yb, AVANT_OUT + 0.3), at(f, mid, yb + ph, AVANT_OUT + 0.3), at(f, mid, yb + ph, 0), at(f, mid - pw / 2, yb, 0)], [-f.t[0] * 0.5 + f.n[0] * 0.5, 0.7, -f.t[1] * 0.5 + f.n[1] * 0.5], UV, shade(STONE_L, 0.9), FIXED)
  q.quad([at(f, mid, yb + ph, AVANT_OUT + 0.3), at(f, mid + pw / 2, yb, AVANT_OUT + 0.3), at(f, mid + pw / 2, yb, 0), at(f, mid, yb + ph, 0)], [f.t[0] * 0.5 + f.n[0] * 0.5, 0.7, f.t[1] * 0.5 + f.n[1] * 0.5], UV, shade(STONE_L, 0.9), FIXED)
  // oval dormers, one over each bay, on the mansard's steep slope
  const dy = BLOCK_EAVE + 1.35, dd = STEEP_IN * 0.3
  for (let i = 0; i < GARDEN_BAYS; i += 2) oval(q, f, c(i), dy, dd, 0.55, 0.42)
  // chimneys along the ridge
  for (const s of [bay * 3, bay * 10]) {
    const p = at(f, s, 0, -7.2)
    chimney(q, p[0], p[2], BLOCK_TOP)
  }
}

// ---- the street front (STREET edge 0, from the corner at the ruelle to the court passage)
function streetFront(q: MeshBuilder): void {
  const f = faceOf(STREET, 0)
  const gs = (GATE_AT[0] - f.o[0]) * f.t[0] + (GATE_AT[1] - f.o[1]) * f.t[1]
  // ashlar courses and the plinth
  for (let y = 0.9; y < STREET_EAVE - 0.7; y += 0.62) rect(q, f, 0, f.len, y, y + 0.045, 0.02, COURSE)
  rect(q, f, 0, f.len, 0, 0.9, 0.05, STONE_D)
  ledge(q, f, 0, f.len, 4.1, 4.3, 0.12, STONE_L)
  cornice(q, f, STREET_EAVE, 0.45)
  // the window rhythm either side of the gate
  for (let k = -3; k <= 3; k++) {
    if (k === 0) continue
    const s = gs + k * BAY_STREET
    if (s < 1.2 || s > f.len - 1.0) continue
    sqWin(q, f, s, 1.2, 3.3, 1.25, 0.05, true)
    sqWin(q, f, s, 4.8, 6.6, 1.25, 0.05)
  }
  // the gate: a stone ring with its keystone console, the round-headed leaves, the entablature and the pedimented attic
  const fr = GATE_FRAME, w = GATE_W
  rect(q, f, gs - w / 2 - fr - 0.35, gs + w / 2 + fr + 0.35, 0, GATE_ENT, 0.1, STONE_L)       // the pier face behind the ring
  arch(q, f, gs, w + 2 * fr, 0, GATE_SPRING, GATE_TOP + fr, 0.16, STONE_D)
  for (let i = 1; i < 8; i++) {
    const a = (Math.PI * i) / 8, r0 = w / 2, r1 = w / 2 + fr
    const p0 = at(f, gs - Math.cos(a) * r0, GATE_SPRING + Math.sin(a) * (GATE_TOP - GATE_SPRING), 0.19)
    const p1 = at(f, gs - Math.cos(a) * r1, GATE_SPRING + Math.sin(a) * (GATE_TOP - GATE_SPRING + fr), 0.19)
    beam(q, p0, p1, 0.03, shade(STONE_D, 0.7))
  }
  // keystone console reaching up to the entablature
  rect(q, f, gs - 0.32, gs + 0.32, GATE_TOP + 0.05, GATE_ENT - 0.1, 0.22, STONE_L)
  rect(q, f, gs - 0.2, gs + 0.2, GATE_TOP - 0.3, GATE_TOP + 0.05, 0.22, STONE_D)
  arch(q, f, gs, w, 0, GATE_SPRING, GATE_TOP, 0.2, DOOR)
  rect(q, f, gs - 0.025, gs + 0.025, 0, GATE_SPRING, 0.23, DOOR_D)
  rect(q, f, gs - w / 2, gs + w / 2, GATE_SPRING - 0.04, GATE_SPRING + 0.04, 0.23, DOOR_D)
  for (const sg of [-1, 1]) {
    const a = gs + sg * 0.12, b = gs + sg * (w / 2 - 0.15)
    rect(q, f, Math.min(a, b), Math.max(a, b), 0.2, 0.95, 0.24, DOOR_D)
    rect(q, f, Math.min(a, b), Math.max(a, b), 1.1, 2.9, 0.24, shade(DOOR, 0.92))
  }
  // the roundel in the lunette
  const N = 12
  for (let i = 0; i < N; i++) {
    const a0 = (2 * Math.PI * i) / N, a1 = (2 * Math.PI * (i + 1)) / N, cy = GATE_SPRING + 0.75, r = 0.5
    tri(q, f, [gs, cy], [gs + Math.cos(a0) * r, cy + Math.sin(a0) * r], [gs + Math.cos(a1) * r, cy + Math.sin(a1) * r], 0.24, DOOR_D)
  }
  // entablature and the pediment with its oculus
  ledge(q, f, gs - GATE_PED_W / 2 - 0.2, gs + GATE_PED_W / 2 + 0.2, GATE_ENT - 0.55, GATE_ENT + 0.1, 0.34, STONE_L)
  const pb = GATE_ENT + 0.1, pw = GATE_PED_W
  q.quad([at(f, gs - pw / 2, pb, 0.2), at(f, gs + pw / 2, pb, 0.2), at(f, gs, GATE_PED_TOP, 0.2), at(f, gs, GATE_PED_TOP, 0.2)], nrm(f), UV, STONE, FIXED)
  q.quad([at(f, gs - pw / 2, pb, 0.34), at(f, gs, GATE_PED_TOP, 0.34), at(f, gs, GATE_PED_TOP, 0), at(f, gs - pw / 2, pb, 0)], [-f.t[0] * 0.5 + f.n[0] * 0.5, 0.7, -f.t[1] * 0.5 + f.n[1] * 0.5], UV, STONE_L, FIXED)
  q.quad([at(f, gs, GATE_PED_TOP, 0.34), at(f, gs + pw / 2, pb, 0.34), at(f, gs + pw / 2, pb, 0), at(f, gs, GATE_PED_TOP, 0)], [f.t[0] * 0.5 + f.n[0] * 0.5, 0.7, f.t[1] * 0.5 + f.n[1] * 0.5], UV, STONE_L, FIXED)
  for (let i = 0; i < 10; i++) {
    const a0 = (2 * Math.PI * i) / 10, a1 = (2 * Math.PI * (i + 1)) / 10, cy = pb + 0.62, r = 0.4
    tri(q, f, [gs, cy], [gs + Math.cos(a0) * r, cy + Math.sin(a0) * r], [gs + Math.cos(a1) * r, cy + Math.sin(a1) * r], 0.22, shade(GLASS, 1.8))
  }
}

/** A plain elevation of windows: `rows` of [sill, head, width], one per bay, with a cornice. */
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

/** The stable wing's court face with Le Lorrain's relief over the round-headed door and the two troughs. */
function stableFace(q: MeshBuilder, f: Face): void {
  windowFace(q, f, NEWING_EAVE, 3.4, [[1.4, 3.3, 1.2], [5.3, 7.3, 1.2]])
  const s = Math.min(RELIEF_S, f.len - RELIEF_W / 2 - 1)
  // the door's frame and leaves, the arched fanlight above, the relief's panel
  rect(q, f, s - 2.1, s + 2.1, 0, RELIEF_Y + RELIEF_H + 0.3, 0.12, STONE_L)
  arch(q, f, s, 3.0, 0, 2.6, 3.9, 0.17, DOOR)
  rect(q, f, s - 0.025, s + 0.025, 0, 2.6, 0.2, DOOR_D)
  rect(q, f, s - RELIEF_W / 2 - 0.35, s + RELIEF_W / 2 + 0.35, RELIEF_Y - 0.35, RELIEF_Y + RELIEF_H + 0.3, 0.14, STONE_D)
  rect(q, f, s - RELIEF_W / 2, s + RELIEF_W / 2, RELIEF_Y, RELIEF_Y + RELIEF_H, 0.2, RELIEF_C)
  // the high relief: two horses' heads, Apollo's servant, clouds
  const rel = (s0: number, s1: number, y0: number, y1: number, d: number, col: Rgb): void => obox(q, f, s - RELIEF_W / 2 + s0 * RELIEF_W, s - RELIEF_W / 2 + s1 * RELIEF_W, RELIEF_Y + y0 * RELIEF_H, RELIEF_Y + y1 * RELIEF_H, 0.2, 0.2 + d, col)
  rel(0.06, 0.94, 0.06, 0.32, 0.22, shade(RELIEF_C, 0.9))     // the cloud bank
  rel(0.22, 0.46, 0.32, 0.88, 0.3, shade(RELIEF_C, 1.04))     // the near horse, rearing
  rel(0.5, 0.74, 0.3, 0.74, 0.28, shade(RELIEF_C, 0.96))      // the second horse
  rel(0.4, 0.5, 0.3, 0.62, 0.34, shade(RELIEF_C, 1.1))        // the servant
  rel(0.78, 0.92, 0.5, 0.9, 0.2, shade(RELIEF_C, 0.88))       // the flying figure
  // the two troughs
  for (const sg of [-1, 1]) obox(q, f, s + sg * 2.6 - 0.9, s + sg * 2.6 + 0.9, 0, 0.7, 0.1, 0.65, STONE_D)
}

/** Where a plan point falls along a face. */
const along = (f: Face, p: P): number => (p[0] - f.o[0]) * f.t[0] + (p[1] - f.o[1]) * f.t[1]

function courtFaces(q: MeshBuilder): void {
  // the corps de logis on the court: a vestibule on the axis, ground arches, two storeys over (its exposed stretch, between the wings)
  const fb = faceOf(BLOCK, 2)    // the SE face (NE end -> SW end)
  const c0 = along(fb, [-11.2, 20.5]), c1 = along(fb, [-24.8, 4.0]), sc = (c0 + c1) / 2
  cornice(q, fb, BLOCK_EAVE, 0.4)
  ledge(q, fb, 0, fb.len, STRING_1 - 0.2, STRING_1 + 0.2, 0.15, STONE_L)
  const bay = (s0: number, s1: number, skip?: number): void => {
    const nb = Math.max(1, Math.round((s1 - s0) / 3.4)), b = (s1 - s0) / nb
    for (let i = 0; i < nb; i++) {
      const s = s0 + (i + 0.5) * b
      if (skip !== undefined && Math.abs(s - skip) < 1.7) continue
      archWin(q, fb, s, 0.45, 2.9, 4.0, 1.4, 0.05)
      sqWin(q, fb, s, 5.7, 8.4, 1.25, 0.05)
      sqWin(q, fb, s, 10.0, 11.8, 1.1, 0.05)
    }
  }
  bay(c0, c1, sc)
  bay(0.8, along(fb, [-6.65, 26.6]) - 0.3)     // the NE end of the block, on the stable court
  arch(q, fb, sc, 2.4, 0, 3.0, 4.2, 0.1, STONE_D)
  arch(q, fb, sc, 1.8, 0, 3.0, 3.8, 0.14, DOOR)
  sqWin(q, fb, sc, 5.7, 8.4, 1.25, 0.05)
  sqWin(q, fb, sc, 10.0, 11.8, 1.1, 0.05)
  // the wings (two storeys with brisis roofs)
  windowFace(q, faceOf(SWING, 1), SWING_EAVE, 3.5, [[1.4, 3.6, 1.2], [5.2, 7.4, 1.2]], true)
  windowFace(q, faceOf(SWING, 3), SWING_EAVE, 3.7, [[1.4, 3.4, 1.2], [5.2, 7.4, 1.2]])
  windowFace(q, faceOf(STREET, 2), STREET_EAVE, 3.5, [[1.4, 3.5, 1.2], [4.8, 6.4, 1.2]], true)
  windowFace(q, faceOf(STREET, 3), STREET_EAVE, 3.5, [[1.4, 3.5, 1.2], [4.8, 6.4, 1.2]], true)
  windowFace(q, faceOf(STREET, 1), STREET_EAVE, 3.5, [[1.4, 3.5, 1.2], [4.8, 6.4, 1.2]])
  windowFace(q, faceOf(NEWING, 5), NEWING_EAVE, 3.5, [[1.4, 3.6, 1.2], [5.3, 7.4, 1.2]], true)
  windowFace(q, faceOf(NEWING, 6), NEWING_EAVE, 3.5, [[1.4, 3.6, 1.2], [5.3, 7.4, 1.2]], true)
}

function ends(q: MeshBuilder): void {
  windowFace(q, faceOf(BLOCK, 3), BLOCK_EAVE, 3.6, [[1.1, 3.6, 1.3], [5.7, 8.4, 1.25], [10.0, 11.8, 1.1]])   // the SW end over the ruelle
  windowFace(q, faceOf(BLOCK, 1), BLOCK_EAVE, 3.6, [[1.1, 3.6, 1.3], [5.7, 8.4, 1.25], [10.0, 11.8, 1.1]])   // the NE end
  stableFace(q, faceOf(NEWING, 1))
  for (const i of [2, 3, 4]) windowFace(q, faceOf(NEWING, i), NEWING_EAVE, 3.4, [[1.4, 3.3, 1.2], [5.3, 7.3, 1.2]])   // the stables' street gable
  for (const i of [0, 1, 2]) windowFace(q, faceOf(STRIP, i), STRIP_EAVE, 3.6, [[1.3, 3.2, 1.1], [4.9, 6.9, 1.1]])    // the wing over the ruelle
  windowFace(q, faceOf(STREET, 5), STREET_EAVE, 3.5, [[1.4, 3.5, 1.2], [4.8, 6.4, 1.2]])
}

function buildings(q: MeshBuilder): void {
  mass(q, BLOCK, BLOCK_EAVE, BLOCK_TOP)
  mass(q, SWING, SWING_EAVE, SWING_TOP)
  mass(q, STREET, STREET_EAVE, STREET_TOP)
  mass(q, STRIP, STRIP_EAVE, STRIP_TOP)
  mass(q, NEWING, NEWING_EAVE, NEWING_TOP)
  // the court's paving, over the ground the city draws
  const court: P[] = [[-24.8, 4.0], [-11.2, 20.5], [3.7, 8.2], [10.4, -0.2], [8.4, -7.2], [4.5, -11.3], [-0.3, -12.8], [-9.74, -8.13]]
  const poly = toPts(court)
  buildRoof(q, poly, { shape: 'flat', y: 0.12, height: 0, colour: COURT_PAVE })
  gardenFront(q)
  streetFront(q)
  courtFaces(q)
  ends(q)
}

export const HOTEL_ROHAN_REFS = ['way/251136638']

export function hotelRohan(out: MeshBuilder): void {
  const first = out.positions.length / 3
  buildings(out)
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
