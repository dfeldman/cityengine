import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { beam, block, hex, shade } from '../kit.ts'
import { along } from './louvre-palace.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL GAILLARD (Jules Février, 1878–82; Place du Général-Catroux, 17e; now the Banque de France's Citéco), OSM relation/1261334.
 * Read off Commons photographs (P1060415, "Place du Général Catroux 2016": red and dark-brick diaper panels between stone dressings, mullioned
 * windows, a stone balustrade at the eaves, tall stone-gabled dormers with pinnacles, very steep slate roofs with iron cresting, square corner
 * pavilions under pyramid roofs) and IGN's LiDAR HD surface model (wing ridges 17–20 m, the pavilions 21–24 m, the court roofed at ~13 m).
 *
 * Plan metres east / north of 48.8818 N, 2.3105 E. The block is a four-sided ring of wings round a glazed court: its corners are the OSM outline's
 * four extreme vertices, walked counter-clockwise (outside on the right, as `along` wants); the court's ring and the ridges' ring are that ring inset.
 */
// ---- tunable: the plan (counter-clockwise from the west corner: the outside on the right of each walk, as `along` wants)
export const CORNERS: P[] = [[-33.5, -7.3], [5.2, -34.8], [36.5, 1.9], [-8.3, 34.1]]
export const WING = 13.5          // the wings' depth: the court's inset
export const FLOOR = 0.5          // the model's ground (the loader sinks every base by it)
// ---- tunable: the elevation (metres over the pavement)
export const BASE = [0, 2.7]      // the stone ground floor
export const F1 = [3.1, 7.7]      // the first floor, brick
export const F2 = [8.1, 11.2]     // the second floor, brick
export const EAVES = 12.4         // the balustrade's top, where the slate starts
export const RIDGE = 18.8
export const COURT_ROOF = 12.9    // the glass over the court
export const BAY = 4.4
export const WIN_W = 0.5          // a window's width over the bay
export const DORMER_EVERY = 2     // a gabled dormer over every n-th bay
export const DORMER_W = 2.3
export const DORMER_UP = 5.6      // from the eaves to the dormer's apex
export const POST = 2.6           // spacing of the cresting's posts
export const DIAPER = 1.6        // the lozenges' pitch
/** The pavilions: centre east, north; side; the wall's top; the pyramid's apex. Measured: lidar peaks 24 / 21 / 23 / 23 / 21. */
export const TOWERS: { c: P; side: number; top: number; apex: number }[] = [
  { c: [-8, -4], side: 13, top: 15.5, apex: 24.6 },     // the stair tower in the court's west corner
  { c: [-22, -1], side: 11, top: 14.2, apex: 21.4 },    // the west corner pavilion
  { c: [-6, 26], side: 10, top: 14.5, apex: 23.2 },     // the north corner
  { c: [14, 13.5], side: 10, top: 14.8, apex: 23.2 },   // the front on the place
  { c: [5, -27], side: 10, top: 14.0, apex: 21.4 },     // the south corner
  { c: [29, 1], side: 8, top: 13.6, apex: 17.6 },       // the east corner, lower
]
// ---- tunable: colours
const BRICK: Rgb = hex('#a24d38')
const BRICK_D: Rgb = hex('#5b2b2a')
const STONE: Rgb = hex('#cfc4a9')
const STONE_D: Rgb = shade(STONE, 0.8)
const SLATE: Rgb = hex('#454d5c')
const SLATE_HI: Rgb = hex('#566073')
const GLASS: Rgb = [0.17, 0.2, 0.25]
const SKY_GLASS: Rgb = hex('#6f8794')
const IRON: Rgb = [0.1, 0.1, 0.11]
const hash = (n: number): number => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }

const face = (q: MeshBuilder, x0: number, x1: number, y0: number, y1: number, d: number, c: Rgb): void => {
  q.quad([[x0, y0, -d], [x1, y0, -d], [x1, y1, -d], [x0, y1, -d]], [0, 0, -1], UV, c, FIXED)
}
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
function normalOf(a: V3, b: V3, c: V3): V3 {
  const u = sub(b, a), v = sub(c, a)
  const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const l = Math.hypot(...n) || 1
  return [n[0] / l, n[1] / l, n[2] / l]
}
/** A sheet whose normal is taken from its corners and flipped to point up (or down). */
function sheet(q: MeshBuilder, p: [V3, V3, V3, V3], col: Rgb, up = true): void {
  let n = normalOf(p[0], p[1], p[2])
  if ((n[1] < 0) === up) n = [-n[0], -n[1], -n[2]]
  q.quad(p, n, UV, col, FIXED)
}
/** A sheet that faces away from the point `from`. */
function sheetAway(q: MeshBuilder, p: [V3, V3, V3, V3], col: Rgb, from: V3): void {
  let n = normalOf(p[0], p[1], p[2])
  const m: V3 = [(p[0][0] + p[2][0]) / 2, (p[0][1] + p[2][1]) / 2, (p[0][2] + p[2][2]) / 2]
  if (n[0] * (m[0] - from[0]) + n[1] * (m[1] - from[1]) + n[2] * (m[2] - from[2]) < 0) n = [-n[0], -n[1], -n[2]]
  q.quad(p, n, UV, col, FIXED)
}

/** A counter-clockwise ring inset by `d` (each edge's line moved to its left, the inside). */
export function inset(ring: P[], d: number): P[] {
  const n = ring.length
  const lines = ring.map((a, i) => {
    const b = ring[(i + 1) % n]
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    const t: P = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]
    const nl: P = [-t[1], t[0]]
    return { p: [a[0] + nl[0] * d, a[1] + nl[1] * d] as P, t }
  })
  return ring.map((_, i) => {
    const l0 = lines[(i + n - 1) % n], l1 = lines[i]
    const den = l0.t[0] * l1.t[1] - l0.t[1] * l1.t[0]
    const s = ((l1.p[0] - l0.p[0]) * l1.t[1] - (l1.p[1] - l0.p[1]) * l1.t[0]) / den
    return [l0.p[0] + l0.t[0] * s, l0.p[1] + l0.t[1] * s] as P
  })
}

// ---- the walls
/** The brick panel between two stone piers: red brick with a diaper of dark lozenges. */
function diaper(q: MeshBuilder, x0: number, x1: number, y0: number, y1: number, seed: number): void {
  face(q, x0, x1, y0, y1, 0.02, BRICK)
  const sx = DIAPER, sy = DIAPER
  const nx = Math.max(1, Math.round((x1 - x0) / sx)), ny = Math.max(1, Math.round((y1 - y0) / sy))
  const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      if (hash(seed + i * 7 + j * 13) < 0.08) continue
      const cx = x0 + dx * (i + 0.5), cy = y0 + dy * (j + 0.5)
      // alternate rows lean the lozenge's weight a little: the diaper of the wall is a lattice of diamonds
      const ox = (j % 2) * 0
      q.quad([[cx - dx * 0.42 + ox, cy, -0.06], [cx, cy - dy * 0.42, -0.06], [cx + dx * 0.42 + ox, cy, -0.06], [cx, cy + dy * 0.42, -0.06]], [0, 0, -1], UV, BRICK_D, FIXED)
    }
  }
}

/** A mullioned and transomed window in a stone frame, with a pointed stone drip over the first floor's. */
function window(q: MeshBuilder, x: number, y0: number, y1: number, w: number, big: boolean): void {
  const hw = w / 2, f = 0.28
  face(q, x - hw - f, x - hw, y0 - 0.05, y1 + f, 0.2, STONE)
  face(q, x + hw, x + hw + f, y0 - 0.05, y1 + f, 0.2, STONE)
  face(q, x - hw - f, x + hw + f, y1, y1 + f, 0.22, STONE)
  face(q, x - hw - f - 0.1, x + hw + f + 0.1, y0 - 0.22, y0 - 0.02, 0.34, STONE)
  face(q, x - hw, x + hw, y0, y1, 0.05, GLASS)
  face(q, x - 0.04, x + 0.04, y0, y1, 0.12, STONE)
  face(q, x - hw, x + hw, y0 + (y1 - y0) * 0.66, y0 + (y1 - y0) * 0.66 + 0.08, 0.12, STONE)
  if (big) {
    // the drip: a stone triangle over the lintel, the corbels at its feet
    q.quad([[x - hw - f, y1 + f, -0.26], [x + hw + f, y1 + f, -0.26], [x, y1 + f + 0.9, -0.26], [x, y1 + f + 0.9, -0.26]], [0, 0, -1], UV, STONE_D, FIXED)
  }
}

/** A stone gable-dormer (a lucarne) on the wall head: two piers with pinnacles, the pointed gable, the window. */
function dormer(q: MeshBuilder, x: number, w: number, up: number, seed: number): void {
  const y0 = EAVES - 0.8, y1 = EAVES + up
  const hw = w / 2
  block(q, x - hw, x - hw + 0.42, -0.5, 1.9, y0, y1 - 1.6, STONE)
  block(q, x + hw - 0.42, x + hw, -0.5, 1.9, y0, y1 - 1.6, STONE)
  face(q, x - hw + 0.42, x + hw - 0.42, y0 + 0.5, y1 - 1.9, 0.4, hash(seed) < 0.5 ? GLASS : shade(GLASS, 1.3))
  face(q, x - 0.04, x + 0.04, y0 + 0.5, y1 - 1.9, 0.46, STONE)
  face(q, x - hw + 0.42, x + hw - 0.42, y0 + (y1 - y0) * 0.45, y0 + (y1 - y0) * 0.45 + 0.07, 0.46, STONE)
  // the gable: a stone triangle on a heavy base, a finial on its apex
  q.quad([[x - hw - 0.1, y1 - 1.6, -0.5], [x + hw + 0.1, y1 - 1.6, -0.5], [x, y1, -0.5], [x, y1, -0.5]], [0, 0, -1], UV, STONE, FIXED)
  q.quad([[x - hw + 0.5, y1 - 1.9, -0.52], [x + hw - 0.5, y1 - 1.9, -0.52], [x, y1 - 0.5, -0.52], [x, y1 - 0.5, -0.52]], [0, 0, -1], UV, shade(GLASS, 1.15), FIXED)
  // the gable's two slate flanks seen from the side
  sheet(q, [[x - hw, y1 - 1.6, -0.5], [x, y1, -0.5], [x, y1, 1.9], [x - hw, y1 - 1.6, 1.9]], SLATE_HI, true)
  sheet(q, [[x + hw, y1 - 1.6, -0.5], [x, y1, -0.5], [x, y1, 1.9], [x + hw, y1 - 1.6, 1.9]], SLATE_HI, true)
  beam(q, [x, y1, -0.5], [x, y1 + 1.0, -0.5], 0.05, STONE)
  for (const sx of [x - hw + 0.2, x + hw - 0.2]) {
    q.quad([[sx - 0.2, y1 - 1.6, -0.5], [sx + 0.2, y1 - 1.6, -0.5], [sx, y1 - 0.45, -0.5], [sx, y1 - 0.45, -0.5]], [0, 0, -1], UV, STONE, FIXED)
  }
}

/** One wing's front on z = 0 (x from 0 to L, outside −z): base, two brick storeys, the string courses and the balustrade, the dormers over it. */
function front(q: MeshBuilder, L: number, seed: number, court: boolean): void {
  const nb = Math.max(2, Math.round(L / BAY)), bw = L / nb
  // the plain stone and brick wall bodies
  face(q, 0, L, BASE[0] - 1, BASE[1], 0, STONE)
  face(q, 0, L, BASE[1], BASE[1] + 0.4, 0.14, STONE)
  face(q, 0, L, F1[1] + 0.05, F1[1] + 0.45, 0.14, STONE)
  face(q, 0, L, F2[1] + 0.1, EAVES - 0.7, 0.1, STONE_D)
  // the eaves: a cornice and the open balustrade over it
  face(q, 0, L, EAVES - 0.7, EAVES - 0.45, 0.4, STONE)
  face(q, 0, L, EAVES - 0.45, EAVES - 0.05, 0.3, IRON)
  face(q, 0, L, EAVES - 0.05, EAVES + 0.12, 0.34, STONE)
  for (let i = 0; i < nb; i++) {
    const x0 = i * bw, x1 = x0 + bw, xc = x0 + bw / 2, s = seed + i * 31
    const hw = bw * WIN_W / 2
    // the brick between the piers, a lozenge diaper
    diaper(q, x0 + 0.3, x1 - 0.3, F1[0] - 0.2, F1[1], s)
    if (!court) diaper(q, x0 + 0.3, x1 - 0.3, F2[0], F2[1] + 0.1, s + 5)
    window(q, xc, F1[0] + 0.5, F1[1] - 0.6, hw * 2, !court)
    window(q, xc, F2[0] + 0.45, F2[1] - 0.5, hw * 2, false)
    // the ground floor: a small barred window
    face(q, xc - 0.55, xc + 0.55, 1.1, 2.1, 0.06, GLASS)
    face(q, xc - 0.03, xc + 0.03, 1.1, 2.1, 0.1, IRON)
    // the pier between bays: a buttress up to a pinnacle over the balustrade
    block(q, x0 - 0.2, x0 + 0.2, -0.42, 0, 0, EAVES - 0.05, STONE)
    face(q, x0 - 0.13, x0 + 0.13, EAVES, EAVES + 1.1, 0.3, STONE)
    q.quad([[x0 - 0.18, EAVES + 1.1, -0.34], [x0 + 0.18, EAVES + 1.1, -0.34], [x0, EAVES + 1.8, -0.16], [x0, EAVES + 1.8, -0.16]], [0, 0, -1], UV, STONE, FIXED)
    if (!court && i % DORMER_EVERY === 0) dormer(q, xc, DORMER_W, DORMER_UP, s)
    else if (i % DORMER_EVERY === 0) dormer(q, xc, DORMER_W * 0.8, DORMER_UP * 0.8, s)
    else {
      // between the tall ones a small slate dormer in the roof's slope
      face(q, xc - 0.5, xc + 0.5, EAVES + 1.5, EAVES + 3.0, -1.35, STONE_D)
      face(q, xc - 0.38, xc + 0.38, EAVES + 1.65, EAVES + 2.85, -1.4, GLASS)
    }
  }
  block(q, L - 0.2, L + 0.2, -0.42, 0, 0, EAVES - 0.05, STONE)
  // the door in the middle of the front on the place
  if (!court && seed === 17) {
    const xc = L / 2
    q.quad([[xc - 1.4, 0, -0.5], [xc + 1.4, 0, -0.5], [xc + 1.4, 3.4, -0.5], [xc - 1.4, 3.4, -0.5]], [0, 0, -1], UV, shade(STONE, 0.7), FIXED)
    face(q, xc - 1.0, xc + 1.0, 0, 2.7, 0.55, shade(BRICK_D, 0.8))
  }
}

// ---- the roofs
function roofRing(out: MeshBuilder, outer: P[], ridge: P[], inner: P[], from: V3): void {
  const n = outer.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const oa: V3 = [outer[i][0], EAVES, outer[i][1]], ob: V3 = [outer[j][0], EAVES, outer[j][1]]
    const ra: V3 = [ridge[i][0], RIDGE, ridge[i][1]], rb: V3 = [ridge[j][0], RIDGE, ridge[j][1]]
    const ia: V3 = [inner[i][0], EAVES, inner[i][1]], ib: V3 = [inner[j][0], EAVES, inner[j][1]]
    // outer slope, then inner slope; slate, with a pale course near the ridge
    sheet(out, [oa, ob, rb, ra], SLATE, true)
    sheet(out, [ra, rb, ib, ia], shade(SLATE, 1.07), true)
    // the iron cresting along the ridge: a thin standing strip and a finial at each corner
    beam(out, [ra[0], RIDGE, ra[2]], [rb[0], RIDGE + 0.0, rb[2]], 0.09, IRON)
    beam(out, [ra[0], RIDGE, ra[2]], [ra[0], RIDGE + 1.6, ra[2]], 0.07, IRON)
    const L = Math.hypot(rb[0] - ra[0], rb[2] - ra[2]), k = Math.max(1, Math.round(L / POST))
    for (let s = 0; s < k; s++) {
      const t = (s + 0.5) / k, px = ra[0] + (rb[0] - ra[0]) * t, pz = ra[2] + (rb[2] - ra[2]) * t
      block(out, px - 0.04, px + 0.04, pz - 0.04, pz + 0.04, RIDGE, RIDGE + 0.55, IRON)
    }
  }
  void from
}

/** A corner pavilion: brick shafts above the roofs on four sides, a steep pyramid roof, a finial. */
function tower(out: MeshBuilder, c: P, side: number, top: number, apex: number, th: number, seed: number): void {
  const h = side / 2
  const co = Math.cos(th), si = Math.sin(th)
  const R = (x: number, z: number): P => [c[0] + x * co - z * si, c[1] + x * si + z * co]
  const pts: P[] = [R(-h, h), R(-h, -h), R(h, -h), R(h, h)] // counter-clockwise from above (x east, z north)
  const y0 = EAVES - 4.4
  for (let i = 0; i < 4; i++) {
    const A = pts[i], B = pts[(i + 1) % 4]
    along(out, A, B, (q, L) => {
      face(q, 0, L, y0, top, 0, BRICK)
      for (let k = 0; k < 2; k++) diaper(q, 0.9, L - 0.9, y0 + 0.2 + k * 2.4, y0 + 2.1 + k * 2.4, seed + i * 11 + k)
      window(q, L / 2, top - 4.1, top - 1.8, Math.min(1.4, L * 0.16), false)
      // corner quoins and the string course
      block(q, -0.2, 0.35, -0.3, 0.3, y0, top, STONE)
      block(q, L - 0.35, L + 0.2, -0.3, 0.3, y0, top, STONE)
      face(q, -0.2, L + 0.2, top - 0.5, top + 0.1, 0.45, STONE)
      face(q, -0.2, L + 0.2, top - 0.1, top + 0.45, 0.35, IRON)
      face(q, -0.2, L + 0.2, top + 0.45, top + 0.6, 0.4, STONE)
    })
  }
  // the pyramid: eaves a little out from the walls
  const ov = 0.35
  const e = pts.map((_, i) => {
    const p = pts[i]
    return [p[0] + (p[0] - c[0]) * (ov / h), p[1] + (p[1] - c[1]) * (ov / h)] as P
  })
  const ap: V3 = [c[0], apex, c[1]]
  for (let i = 0; i < 4; i++) {
    const a = e[i], b = e[(i + 1) % 4]
    const A: V3 = [a[0], top + 0.4, a[1]], B: V3 = [b[0], top + 0.4, b[1]]
    // a kink: the lower slope steep, the upper steeper still, as the photographs' pavilions
    const mid = (u: V3, v: V3, t: number): V3 => [u[0] + (v[0] - u[0]) * t, u[1] + (v[1] - u[1]) * t, u[2] + (v[2] - u[2]) * t]
    const A2 = mid(A, ap, 0.62), B2 = mid(B, ap, 0.62)
    sheetAway(out, [A, B, B2, A2], SLATE, [c[0], 0, c[1]])
    sheetAway(out, [A2, B2, ap, ap], SLATE_HI, [c[0], 0, c[1]])
    // a small dormer in each face
    const m = mid(A, B, 0.5), m2 = mid(m, ap, 0.18)
    sheetAway(out, [[m[0] - (B[0] - A[0]) * 0.08, m[1] + 0.2, m[2] - (B[2] - A[2]) * 0.08], [m[0] + (B[0] - A[0]) * 0.08, m[1] + 0.2, m[2] + (B[2] - A[2]) * 0.08], [m2[0] + (B[0] - A[0]) * 0.05, m2[1] + 0.3, m2[2] + (B[2] - A[2]) * 0.05], [m2[0] - (B[0] - A[0]) * 0.05, m2[1] + 0.3, m2[2] - (B[2] - A[2]) * 0.05]], shade(STONE, 0.9), [c[0], 0, c[1]])
  }
  beam(out, [c[0], apex - 0.5, c[1]], [c[0], apex + 2.8, c[1]], 0.07, IRON)
  block(out, c[0] - 0.2, c[0] + 0.2, c[1] - 0.2, c[1] + 0.2, apex - 0.6, apex - 0.2, IRON)
}

export const HOTEL_GAILLARD_REFS = ['relation/1261334']

/** Twist of the block: the angle of its first (south-west) edge. */
export const TURN = Math.atan2(CORNERS[1][1] - CORNERS[0][1], CORNERS[1][0] - CORNERS[0][0])

export function hotelGaillard(out: MeshBuilder): void {
  const first = out.positions.length / 3
  const outer = CORNERS
  const ridge = inset(outer, WING / 2)
  const court = inset(outer, WING)
  // the outer fronts (the one facing the place is the north-east: corners 2 to 3)
  for (let i = 0; i < 4; i++) {
    const A = outer[i], B = outer[(i + 1) % 4]
    along(out, A, B, (q, L) => front(q, L, i === 2 ? 17 : 100 + i * 50, false))
  }
  // the court's fronts: walked the other way, clockwise, the court is on the right
  for (let i = 0; i < 4; i++) {
    const A = court[(i + 1) % 4], B = court[i]
    along(out, A, B, (q, L) => front(q, L, 400 + i * 50, true))
  }
  roofRing(out, outer, ridge, court, [0, 0, 0])
  // the glazed roof over the court, with its ribs
  sheet(out, [[court[0][0], COURT_ROOF, court[0][1]], [court[1][0], COURT_ROOF, court[1][1]], [court[2][0], COURT_ROOF, court[2][1]], [court[3][0], COURT_ROOF, court[3][1]]], SKY_GLASS, true)
  // the back of the roof's eave on the court side, and the street's end walls are covered by the wing fronts
  for (const t of TOWERS) tower(out, t.c, t.side, t.top, t.apex, TURN, Math.round(t.c[0] * 7 + t.c[1]))
  // chimney stacks on the ridge
  for (let i = 0; i < 4; i++) {
    const a = ridge[i], b = ridge[(i + 1) % 4]
    for (const t of [0.25, 0.7]) {
      const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t
      block(out, x - 0.7, x + 0.7, z - 0.5, z + 0.5, RIDGE - 1, RIDGE + 3.0, BRICK)
      block(out, x - 0.8, x + 0.8, z - 0.6, z + 0.6, RIDGE + 3.0, RIDGE + 3.3, STONE)
    }
  }
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
