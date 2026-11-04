/**
 * The PALAIS DE L'ALMA — Tétaz's Écuries impériales (1861), the Hôtel des Écuries de l'Alma, now the Élysée's annexes —
 * on the Quai Branly, and beside it the Russian spiritual centre's pale banded blocks.
 *
 * Measured from OSM (osmium on the local pbf, 2026-11-03): relation 1084225 is the U of annex ranges round the Cour
 * d'honneur with its hemicycle at the south-east end, the west block round the Cour de la Poste, and the riding hall's
 * spur running on from the hemicycle toward the Rue de l'Université; way 69045411 is the old palace front on the quai
 * that closes the court. The 1930s first-floor plan (owner's reference) matches it. IGN's lidar and orthophoto are
 * blurred over this government site, so the heights are the photographs': the annexes three storeys under a low zinc
 * roof (eaves 13), the quai front two tall storeys and an attic under a slate mansard (eaves 13.5, ridge 18).
 *
 * Drawn in metres east/north of 48.8615 N, 2.3005 E and registered onto the footprint by enframe.ts.
 */
import { capPolygonWithHoles, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { registerRing, tools, type Frame, type P2, type V3 } from '../museums/enframe.ts'

const FIXED = 0
const STUCCO = surfaceTag('stucco')
const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]

const RENDER = hex('#cbc6bb')
const PIER = hex('#c9b893')
const BRICK = hex('#a65a3e')
const SHUTTER = hex('#ecebe6')
const GLASS = hex('#2b3236')
const IRON = hex('#1d1f21')
const ZINC = hex('#6a737b')
const ZINC_TOP = hex('#7a838a')
const STONE = hex('#e3d9c3')
const STONE_TRIM = hex('#d4c8ad')
const SLATE = hex('#4a525c')
const CHIMNEY = hex('#b0604a')
const PAVING = hex('#857f75')
const DOOR = hex('#6d7180')

/** relation 1084225's outer ring (the registration ring) */
const RING: P2[] = [[-115.3, 39.0], [-111.4, 27.4], [-95.8, -17.0], [-62.7, -10.1], [-59.5, -25.5], [-90.5, -31.8], [-87.0, -42.0], [-27.0, -29.5],
  [-20.7, -60.9], [-18.5, -70.9], [-8.9, -68.3], [0.4, -65.8], [-7.2, -28.5], [-7.8, -25.3], [19.1, -19.9], [22.6, -19.2], [17.4, 6.7], [23.9, 8.1],
  [11.6, 68.5], [-0.8, 66.7], [-11.6, 64.5], [1.0, 3.0], [1.6, -1.3], [1.4, -4.2], [0.2, -8.3], [-2.1, -11.6], [-5.6, -14.3], [-9.7, -15.8],
  [-14.2, -16.8], [-15.1, -13.2], [-24.9, -15.2], [-24.1, -18.8], [-28.9, -19.8], [-36.7, -19.2], [-41.0, -16.7], [-43.8, -13.4], [-45.3, -10.0],
  [-45.8, -6.7], [-58.0, 55.0], [-61.6, 54.3], [-76.9, 51.2], [-81.2, 50.3], [-93.1, 46.0], [-102.2, 43.2], [-111.0, 40.6]]
/** the annex ranges: the ring without the riding hall's spur */
const ANNEX: P2[] = RING.filter((p) => !(p[1] < -29 && p[0] > -28 && p[0] < 1))
/** the courts OSM cuts out of it: the Cour de la Poste and the two gores beside the hemicycle */
const COURTS: P2[][] = [
  [[-104.9, 31.2], [-78.9, 39.2], [-71.0, -1.1], [-92.4, -5.5]],
  [[-50.8, -15.3], [-48.5, -18.7], [-44.5, -22.7], [-42.4, -24.2], [-42.7, -26.2], [-48.3, -27.3]],
  [[2.7, -17.0], [5.3, -13.8], [6.7, -11.2], [8.0, -7.8], [8.7, -3.9], [11.0, -15.3]],
]
/** the riding hall (Vide du Manège): its corners, the hemicycle end first */
const MANEGE: P2[] = [[-27.0, -29.5], [-7.2, -28.5], [0.4, -65.8], [-18.5, -70.9]]
/** way 69045411, the old palace front on the quai: SW, SE, NE, NW */
const FRONT: P2[] = [[-50.0, 42.2], [-14.0, 49.2], [-16.9, 65.1], [-53.4, 57.7]]
/** the Cour d'honneur's floor */
const COURT: P2[] = [[-45.8, -6.7], [-58.0, 55.0], [-50.0, 42.2], [-14.0, 49.2], [-11.6, 64.5], [1.0, 3.0], [-9.7, -15.8], [-28.9, -19.8]]

const ccw = (r: P2[]): P2[] => {
  let A = 0
  for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; A += p[0] * q[1] - q[0] * p[1] }
  return A < 0 ? [...r].reverse() : r
}
/** a closed ring moved `d` to the left of travel, mitres clamped */
export function insetRing(r: P2[], d: number): P2[] {
  const n = r.length
  return r.map((p, i) => {
    const a = r[(i + n - 1) % n], b = r[(i + 1) % n]
    const t0 = norm([p[0] - a[0], p[1] - a[1]]), t1 = norm([b[0] - p[0], b[1] - p[1]])
    const l0: P2 = [-t0[1], t0[0]], l1: P2 = [-t1[1], t1[0]]
    const m = norm([l0[0] + l1[0], l0[1] + l1[1]])
    const k = Math.min(3, 1 / Math.max(0.2, m[0] * l1[0] + m[1] * l1[1]))
    return [p[0] + m[0] * d * k, p[1] + m[1] * d * k] as P2
  })
}
const norm = (v: P2): P2 => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l] }

interface Ctx { out: MeshBuilder; F: Frame }

/** a planar polygon in east/north/height, normal toward `hint`, with a surface tag */
function poly(c: Ctx, pts: V3[], col: Rgb, hint: V3, tag = FIXED): void {
  const P = (v: V3): V3 => c.F.p(v[0], v[1], v[2])
  const n = c.F.n(hint)
  const l = Math.hypot(...n) || 1
  const nn: V3 = [n[0] / l, n[1] / l, n[2] / l]
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  if (pts.length === 4) { c.out.quad([P(pts[0]), P(pts[1]), P(pts[2]), P(pts[3])], nn, uv, col, tag); return }
  for (let i = 1; i + 1 < pts.length; i++) c.out.quad([P(pts[0]), P(pts[i]), P(pts[i + 1]), P(pts[i + 1])], nn, uv, col, tag)
}

/** one wall edge a→b (outward to the right) and the means of drawing on it */
function edge(c: Ctx, a: P2, b: P2) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1])
  const t: P2 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]
  const o: P2 = [t[1], -t[0]]
  const at = (u: number, h: number, d: number): V3 => [a[0] + t[0] * u + o[0] * d, a[1] + t[1] * u + o[1] * d, h]
  const hint: V3 = [o[0], o[1], 0]
  const rect = (u0: number, u1: number, h0: number, h1: number, d: number, col: Rgb, tag = FIXED): void =>
    poly(c, [at(u0, h0, d), at(u1, h0, d), at(u1, h1, d), at(u0, h1, d)], col, hint, tag)
  /** a block standing proud: front and its two cheeks and a top */
  const proud = (u0: number, u1: number, h0: number, h1: number, d0: number, d1: number, col: Rgb, tag = FIXED): void => {
    rect(u0, u1, h0, h1, d1, col, tag)
    poly(c, [at(u0, h0, d0), at(u0, h0, d1), at(u0, h1, d1), at(u0, h1, d0)], col, [-t[0], -t[1], 0], tag)
    poly(c, [at(u1, h0, d1), at(u1, h0, d0), at(u1, h1, d0), at(u1, h1, d1)], col, [t[0], t[1], 0], tag)
    poly(c, [at(u0, h1, d0), at(u0, h1, d1), at(u1, h1, d1), at(u1, h1, d0)], col, [0, 0, 1], tag)
  }
  /** a round-headed opening: jambs to `spring`, a half-round over, `d` out */
  const arch = (u: number, h0: number, w: number, spring: number, d: number, col: Rgb, ring?: Rgb, rw = 0.35): void => {
    rect(u - w / 2, u + w / 2, h0, spring, d, col)
    const N = 8, r = w / 2
    const pts: V3[] = [at(u, spring, d)]
    for (let i = 0; i <= N; i++) { const q = Math.PI * (i / N); pts.push(at(u + r * Math.cos(q), spring + r * Math.sin(q), d)) }
    for (let i = 1; i + 1 < pts.length; i++) poly(c, [pts[0], pts[i], pts[i + 1], pts[i + 1]], col, hint)
    if (!ring) return
    for (let i = 0; i < N; i++) {
      const q0 = Math.PI * (i / N), q1 = Math.PI * ((i + 1) / N)
      poly(c, [at(u + r * Math.cos(q0), spring + r * Math.sin(q0), d - 0.02), at(u + (r + rw) * Math.cos(q0), spring + (r + rw) * Math.sin(q0), d - 0.02),
        at(u + (r + rw) * Math.cos(q1), spring + (r + rw) * Math.sin(q1), d - 0.02), at(u + r * Math.cos(q1), spring + r * Math.sin(q1), d - 0.02)], ring, hint)
    }
  }
  return { L, t, o, at, hint, rect, proud, arch }
}

/** walls, a cornice and a low hipped zinc roof over rings (outer first, then courts), heights over the ground */
function ranges(c: Ctx, outer: P2[], courts: P2[][], eaves: number, rise: number, inset: number, wall: Rgb, wallTag: number, roof: Rgb, top: Rgb): void {
  const rings = [ccw(outer), ...courts.map((r) => [...ccw(r)].reverse())]
  const inner = rings.map((r) => insetRing(r, inset))
  for (let k = 0; k < rings.length; k++) {
    const r = rings[k]
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length]
      const e = edge(c, a, b)
      if (e.L < 0.05) continue
      e.rect(0, e.L, 0, eaves, 0, wall, wallTag)
      e.proud(-0.1, e.L + 0.1, eaves - 0.55, eaves, 0, 0.35, STONE_TRIM)
      const ia = inner[k][i], ib = inner[k][(i + 1) % r.length]
      poly(c, [[a[0], a[1], eaves], [b[0], b[1], eaves], [ib[0], ib[1], eaves + rise], [ia[0], ia[1], eaves + rise]], roof, [e.o[0], e.o[1], inset / rise])
    }
  }
  capPolygonWithHoles(c.out, inner.map((r) => r.map(([e, n]) => c.F.xz(e, n))), c.F.y0 + eaves + rise, top, FIXED)
}

/**
 * The annex front (owner's Street View): rendered walls between banded stone piers and quoined corners; tall
 * round-headed ground-floor windows under brick arches, the odd plain door; two storeys of windows with white louvred
 * shutters, brick lintels, and iron balconettes on the first.
 */
function annexFront(c: Ctx, a: P2, b: P2, seed: number): void {
  const e = edge(c, a, b)
  if (e.L < 3) return
  const bay = 3.6
  const nb = Math.max(1, Math.round((e.L - 1.6) / bay))
  const step = (e.L - 1.6) / nb
  // quoins at both ends: alternating long and short blocks
  for (const [u0, s] of [[0, 1], [e.L, -1]] as const) {
    for (let h = 0.3, i = 0; h < 12.4; h += 0.62, i++) {
      const w = i % 2 ? 0.55 : 0.9
      e.proud(s > 0 ? u0 : u0 - w, s > 0 ? u0 + w : u0, h, h + 0.52, 0, 0.06, PIER)
    }
  }
  // the string courses at the floors
  e.rect(0, e.L, 4.55, 4.9, 0.07, PIER)
  e.rect(0, e.L, 8.45, 8.75, 0.07, PIER)
  e.rect(0, e.L, 0, 0.6, 0.05, shadeOf(RENDER, 0.92), STUCCO)
  for (let j = 0; j < nb; j++) {
    const u = 0.8 + step * (j + 0.5)
    // a banded pier every third bay
    if (j % 3 === 0 && j > 0) {
      const pu = 0.8 + step * j
      for (let h = 0.6; h < 12.2; h += 0.55) e.proud(pu - 0.45, pu + 0.45, h, h + 0.45, 0, 0.1, PIER)
    }
    // ground floor: an arched window or, now and then, a door
    if ((j + seed) % 7 === 3 && step > 2.4) {
      e.proud(u - 0.95, u + 0.95, 0, 3.3, 0, 0.08, PIER)
      e.rect(u - 0.7, u + 0.7, 0, 3.0, 0.1, DOOR)
    } else if (step > 2.2) {
      const w = Math.min(1.8, step - 1.0)
      e.arch(u, 0.9, w, 2.9, 0.08, GLASS, BRICK, 0.32)
      e.rect(u - w / 2 - 0.1, u + w / 2 + 0.1, 0.78, 0.9, 0.11, PIER)
      for (let k = 1; k < 4; k++) e.rect(u - w / 2, u + w / 2, 0.9 + k * 0.62, 0.9 + k * 0.62 + 0.05, 0.1, IRON)
    }
    // the upper storeys
    for (const [y, h, balc] of [[5.4, 2.2, true], [9.2, 1.9, false]] as const) {
      const w = 1.1
      e.rect(u - w / 2, u + w / 2, y, y + h, 0.08, GLASS)
      e.rect(u - w / 2 - 0.12, u + w / 2 + 0.12, y + h, y + h + 0.3, 0.09, BRICK)
      e.rect(u - w / 2 - 0.15, u + w / 2 + 0.15, y - 0.14, y, 0.12, PIER)
      for (const s of [-1, 1]) {
        const u0 = u + s * (w / 2 + 0.05), u1 = u + s * (w / 2 + 0.6)
        e.rect(Math.min(u0, u1), Math.max(u0, u1), y - 0.05, y + h + 0.05, 0.14, SHUTTER, STUCCO)
      }
      if (balc) { e.rect(u - w / 2, u + w / 2, y + 0.3, y + 0.38, 0.17, IRON); e.rect(u - w / 2, u + w / 2, y + 0.8, y + 0.88, 0.17, IRON) }
    }
  }
}

const shadeOf = (c: Rgb, f: number): Rgb => [c[0] * f, c[1] * f, c[2] * f]

/**
 * The palace front (owner's photograph from the quai): pale ashlar, rusticated ground floor; nine bays, the middle
 * three brought forward under a pediment, the great arched carriage gate in the centre; the first floor's tall windows
 * with balconettes, an attic storey, the balustrade, the slate mansard with dormers and its tall brick chimneys.
 */
function palaceFront(c: Ctx, a: P2, b: P2, gate: boolean): void {
  const e = edge(c, a, b)
  const nb = 9
  const step = (e.L - 1.4) / nb
  const mid = e.L / 2
  // rustication on the ground floor
  for (let h = 0.5; h < 4.6; h += 0.55) e.rect(0, e.L, h, h + 0.06, 0.04, STONE_TRIM)
  e.proud(0, e.L, 4.6, 5.05, 0, 0.25, STONE_TRIM)
  e.proud(0, e.L, 8.9, 9.2, 0, 0.15, STONE_TRIM)
  // the avant-corps
  const c0 = mid - 1.5 * step - 0.3, c1 = mid + 1.5 * step + 0.3
  e.proud(c0, c1, 0, 13.5, 0, 0.6, STONE)
  // corner chains
  for (const u of [0.35, e.L - 0.35, c0 + 0.35, c1 - 0.35]) for (let h = 0.4; h < 13; h += 0.9) e.proud(u - 0.35, u + 0.35, h, h + 0.6, 0.6 * +(u > c0 && u < c1), 0.6 * +(u > c0 && u < c1) + 0.06, STONE_TRIM)
  for (let j = 0; j < nb; j++) {
    const u = 0.7 + step * (j + 0.5)
    const d = u > c0 && u < c1 ? 0.6 : 0
    if (gate && j === 4) {
      e.arch(u, 0, 3.8, 4.6, d + 0.05, IRON, STONE_TRIM, 0.45)
    } else {
      e.arch(u, 0.7, 1.3, 3.4, d + 0.05, GLASS)
    }
    e.rect(u - 0.7, u + 0.7, 5.6, 8.4, d + 0.05, GLASS)
    e.rect(u - 0.85, u + 0.85, 8.4, 8.75, d + 0.1, STONE_TRIM)
    e.rect(u - 0.7, u + 0.7, 5.6, 5.7, d + 0.12, IRON)
    e.rect(u - 0.7, u + 0.7, 6.2, 6.27, d + 0.12, IRON)
    e.rect(u - 0.55, u + 0.55, 9.8, 11.8, d + 0.05, GLASS)
    e.rect(u - 0.7, u + 0.7, 9.65, 9.8, d + 0.1, STONE_TRIM)
  }
  // the entablature, the pediment over the avant-corps
  e.proud(c0 - 0.1, c1 + 0.1, 12.6, 13.5, 0.6, 0.8, STONE_TRIM)
  const ph = 2.7
  poly(c, [e.at(c0, 13.5, 0.8), e.at(c1, 13.5, 0.8), e.at(mid, 13.5 + ph, 0.8), e.at(mid, 13.5 + ph, 0.8)], STONE, e.hint)
  poly(c, [e.at(c0 + 0.9, 13.75, 0.85), e.at(c1 - 0.9, 13.75, 0.85), e.at(mid, 13.5 + ph - 0.45, 0.85), e.at(mid, 13.5 + ph - 0.45, 0.85)], STONE_TRIM, e.hint)
  // the roof over the pediment's back
  poly(c, [e.at(c0, 13.5, 0.8), e.at(mid, 13.5 + ph, 0.8), e.at(mid, 13.5 + ph, -4), e.at(c0, 13.5, -4)], SLATE, [-e.t[0], -e.t[1], 1])
  poly(c, [e.at(c1, 13.5, 0.8), e.at(c1, 13.5, -4), e.at(mid, 13.5 + ph, -4), e.at(mid, 13.5 + ph, 0.8)], SLATE, [e.t[0], e.t[1], 1])
  // the balustrade along the wings
  for (const [u0, u1] of [[0, c0], [c1, e.L]]) {
    e.proud(u0, u1, 13.5, 13.62, 0, 0.3, STONE_TRIM)
    for (let u = u0 + 0.25; u < u1 - 0.1; u += 0.32) e.proud(u - 0.07, u + 0.07, 13.62, 14.3, 0.08, 0.22, STONE_TRIM)
    e.proud(u0, u1, 14.3, 14.45, 0, 0.3, STONE_TRIM)
  }
  // dormers in the mansard, one over each wing bay
  for (let j = 0; j < nb; j++) {
    const u = 0.7 + step * (j + 0.5)
    if (u > c0 && u < c1) continue
    e.proud(u - 0.6, u + 0.6, 14.4, 16.2, -1.6, -0.9, STONE_TRIM)
    e.rect(u - 0.38, u + 0.38, 14.6, 15.8, -0.86, GLASS)
  }
}

export function palaisAlma(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit)
  const c: Ctx = { out, F }
  const T = tools(out, F)
  // ---- the annexes: the U round the court, the west block round the Cour de la Poste
  ranges(c, ANNEX, COURTS, 13, 2.2, 3.0, RENDER, STUCCO, ZINC, ZINC_TOP)
  const rings = [ccw(ANNEX), ...COURTS.map((r) => [...ccw(r)].reverse())]
  rings.forEach((r, k) => r.forEach((p, i) => annexFront(c, p, r[(i + 1) % r.length], i + k * 5)))
  // ---- the old palace front on the quai
  const fr = ccw(FRONT)
  ranges(c, fr, [], 13.5, 4.6, 2.6, STONE, FIXED, SLATE, shadeOf(SLATE, 0.9))
  // quai face: NE→NW ; court face: SW→SE
  palaceFront(c, FRONT[2], FRONT[3], true)
  palaceFront(c, FRONT[0], FRONT[1], true)
  // the ends: windows only
  for (const [a, b] of [[FRONT[1], FRONT[2]], [FRONT[3], FRONT[0]]] as const) {
    const e = edge(c, a, b)
    for (let j = 0; j < 3; j++) {
      const u = e.L * (j + 0.5) / 3
      e.arch(u, 0.7, 1.3, 3.4, 0.05, GLASS)
      e.rect(u - 0.7, u + 0.7, 5.6, 8.4, 0.05, GLASS)
      e.rect(u - 0.55, u + 0.55, 9.8, 11.8, 0.05, GLASS)
    }
  }
  // chimneys on the mansard's ridge line, and the flag over the centre
  const along: P2 = norm([FRONT[3][0] - FRONT[2][0], FRONT[3][1] - FRONT[2][1]])
  const mid: P2 = [(FRONT[0][0] + FRONT[1][0] + FRONT[2][0] + FRONT[3][0]) / 4, (FRONT[0][1] + FRONT[1][1] + FRONT[2][1] + FRONT[3][1]) / 4]
  const across: P2 = [-along[1], along[0]]
  for (const s of [-15, -9, 9, 15]) for (const q of [-3.6, 3.6]) {
    const p: P2 = [mid[0] + along[0] * s + across[0] * q, mid[1] + along[1] * s + across[1] * q]
    const sq = (dx: number, dz: number): P2 => [p[0] + along[0] * dx + across[0] * dz, p[1] + along[1] * dx + across[1] * dz]
    T.prism([sq(-0.7, -0.4), sq(0.7, -0.4), sq(0.7, 0.4), sq(-0.7, 0.4)], 15, 20.2, CHIMNEY)
    T.prism([sq(-0.8, -0.5), sq(0.8, -0.5), sq(0.8, 0.5), sq(-0.8, 0.5)], 20.2, 20.5, STONE_TRIM)
  }
  const fp: P2 = [mid[0] + across[0] * 3, mid[1] + across[1] * 3]
  T.beam([fp[0], fp[1], 18], [fp[0], fp[1], 24], 0.06, IRON)
  const flag: [Rgb, number][] = [[hex('#1f3f8f'), 0], [hex('#f2f2f2'), 1], [hex('#d42a32'), 2]]
  for (const [col, k] of flag) {
    const p0: P2 = [fp[0] + along[0] * 0.6 * k, fp[1] + along[1] * 0.6 * k]
    const p1: P2 = [fp[0] + along[0] * 0.6 * (k + 1), fp[1] + along[1] * 0.6 * (k + 1)]
    poly(c, [[p0[0], p0[1], 22.6], [p1[0], p1[1], 22.6], [p1[0], p1[1], 23.9], [p0[0], p0[1], 23.9]], col, [across[0], across[1], 0])
    poly(c, [[p1[0], p1[1], 22.6], [p0[0], p0[1], 22.6], [p0[0], p0[1], 23.9], [p1[0], p1[1], 23.9]], col, [-across[0], -across[1], 0])
  }
  // ---- the riding hall: a long rendered hall of tall arched windows under a pitched zinc roof
  const m = ccw(MANEGE)
  for (let i = 0; i < m.length; i++) {
    const e = edge(c, m[i], m[(i + 1) % m.length])
    e.rect(0, e.L, 0, 12, 0, RENDER, STUCCO)
    e.proud(-0.1, e.L + 0.1, 11.5, 12, 0, 0.35, STONE_TRIM)
    const nb = Math.max(1, Math.round(e.L / 5))
    for (let j = 0; j < nb; j++) {
      const u = e.L * (j + 0.5) / nb
      e.arch(u, 1.2, 2.4, 7.8, 0.07, GLASS, BRICK, 0.4)
      if (j > 0) { const pu = e.L * j / nb; for (let h = 0.4; h < 11.4; h += 0.55) e.proud(pu - 0.4, pu + 0.4, h, h + 0.45, 0, 0.09, PIER) }
    }
  }
  const [A, B, C, D] = MANEGE
  const r0: P2 = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], r1: P2 = [(C[0] + D[0]) / 2, (C[1] + D[1]) / 2]
  const RIDGE = 19
  poly(c, [[B[0], B[1], 12], [C[0], C[1], 12], [r1[0], r1[1], RIDGE], [r0[0], r0[1], RIDGE]], ZINC, [1, -0.2, 1])
  poly(c, [[D[0], D[1], 12], [A[0], A[1], 12], [r0[0], r0[1], RIDGE], [r1[0], r1[1], RIDGE]], ZINC, [-1, 0.2, 1])
  poly(c, [[A[0], A[1], 12], [B[0], B[1], 12], [r0[0], r0[1], RIDGE], [r0[0], r0[1], RIDGE]], RENDER, [0, 1, 0], STUCCO)
  poly(c, [[C[0], C[1], 12], [D[0], D[1], 12], [r1[0], r1[1], RIDGE], [r1[0], r1[1], RIDGE]], RENDER, [0, -1, 0], STUCCO)
  // the glazed lantern down the ridge
  const lerp = (p: P2, q: P2, t: number): P2 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]
  for (const s of [-1, 1]) {
    const q0 = lerp(r0, s > 0 ? B : A, 0.18), q1 = lerp(r1, s > 0 ? C : D, 0.18)
    poly(c, [[r0[0], r0[1], RIDGE + 0.05], [r1[0], r1[1], RIDGE + 0.05], [q1[0], q1[1], RIDGE - 1.2], [q0[0], q0[1], RIDGE - 1.2]], GLASS, [s, -0.2 * s, 1])
  }
  // ---- the Cour d'honneur's paving
  T.cap(COURT, 0.04, PAVING)
}

/**
 * The Russian spiritual centre's blocks beside the cathedral (Wilmotte, 2016): pale stone-clad volumes banded
 * horizontally — a solid white band at each floor, a recessed strip of glass between — and planted green roofs.
 * One builder for the cultural centre, the parish centre and the school; each fitted to its own OSM way.
 */
export function russianCentreBlock(out: MeshBuilder, fit: Fit): void {
  const ring = fit.ring && fit.ring.length >= 3 ? fit.ring : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const H = fit.height > 0 ? fit.height : 15
  const floors = Math.max(2, Math.round(H / 3.6))
  const fh = H / floors
  const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length, cz = ring.reduce((s, p) => s + p.z, 0) / ring.length
  const WHITE = hex('#efede6'), GLASSB = hex('#3a4448'), ROOF = hex('#6e8a4c'), MULLION = hex('#d9d8d2')
  const tagW = surfaceTag('stucco')
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.05) continue
    let nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2
    if (nx * (mx - cx) + nz * (mz - cz) < 0) { nx = -nx; nz = -nz }
    const P = (p: { x: number; z: number }, y: number, d: number): V3 => [p.x + nx * d, y, p.z + nz * d]
    const q = (y0: number, y1: number, d: number, col: Rgb, tag = FIXED): void =>
      out.quad([P(a, y0, d), P(b, y0, d), P(b, y1, d), P(a, y1, d)], [nx, 0, nz], uv, col, tag)
    for (let f = 0; f < floors; f++) {
      const y = f * fh
      const band = f === 0 ? 1.2 : 1.0
      q(y, y + band, 0, WHITE, tagW)
      out.quad([P(a, y + band, 0), P(b, y + band, 0), P(b, y + band, -0.6), P(a, y + band, -0.6)], [0, -1, 0], uv, shadeOf(WHITE, 0.8), tagW)
      q(y + band, y + fh, -0.6, GLASSB)
      out.quad([P(a, y + fh, -0.6), P(b, y + fh, -0.6), P(b, y + fh, 0), P(a, y + fh, 0)], [0, 1, 0], uv, WHITE, tagW)
      // slim mullions across the glass
      const n = Math.max(1, Math.round(L / 1.6))
      for (let k = 1; k < n; k++) {
        const t = k / n
        const p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }
        const tx = (b.x - a.x) / L * 0.05, tz = (b.z - a.z) / L * 0.05
        out.quad([[p.x - tx + nx * -0.55, y + band, p.z - tz + nz * -0.55], [p.x + tx + nx * -0.55, y + band, p.z + tz + nz * -0.55],
          [p.x + tx + nx * -0.55, y + fh, p.z + tz + nz * -0.55], [p.x - tx + nx * -0.55, y + fh, p.z - tz + nz * -0.55]], [nx, 0, nz], uv, MULLION, tagW)
      }
    }
    // the parapet
    q(H, H + 0.9, 0, WHITE, tagW)
    q(H, H + 0.9, -0.3, WHITE, tagW)
    out.quad([P(a, H + 0.9, 0), P(b, H + 0.9, 0), P(b, H + 0.9, -0.3), P(a, H + 0.9, -0.3)], [0, 1, 0], uv, WHITE, tagW)
  }
  capPolygonWithHoles(out, [ring], H + 0.35, ROOF, surfaceTag('foliage'))
}
