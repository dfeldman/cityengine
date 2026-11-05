import { capPolygonWithHoles, type MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { block, hex, shade } from '../kit.ts'
import { edgeAt } from '../parts.ts'
import { VENDOME_HOTELS } from './place-vendome-plan.ts'
import { along, cornice } from './louvre-palace.ts'
import { arcade } from './palaces/common.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type P2 = { x: number; z: number }
type V2 = [number, number]

/**
 * THE PLACE VENDÔME (Hardouin-Mansart, 1699–1720): one facade, built once and handed to nineteen owners. The square is a rectangle 139 × 124.5 m
 * with its four corners cut, and every hôtel round it carries the same front (read off Commons photographs of nos. 13 and 19, 2026-11-05):
 *
 * - a rusticated ground storey of round arches, a string course;
 * - over it a giant order of Corinthian pilasters through the two principal floors (tall windows with balconies under, shorter ones above),
 *   a plain entablature with a modillioned cornice;
 * - the steep slate mansard (brisis, then the flatter terrasson) with an oeil-de-boeuf dormer in every bay and stone stacks on the ridge;
 * - a pedimented avant-corps of three bays, engaged columns, at the middle of the two long sides and of each cut corner.
 *
 * The roof heights are IGN LiDAR HD's (MNS): the wall head 18–19 m, the ridge 24–26 m about 5–6 m behind it (see docs/landmarks/MODEL-PLACE-VENDOME.md).
 *
 * Plan metres east / north of the column (the entry stands on it). The square is an octagon turned 57° to the grid, so it is described in
 * (u, v) — u along the Rue de la Paix, v across — and turned to (x, z) at the last moment. Each building's OSM outline is raised behind its front:
 * the edges lying on one of the eight sides are snapped onto the side's line and left without a wall (the facade is that wall); every other
 * edge is a plain wall with windows, and a mansard of the same section runs round all of it.
 */
// ---- tunable: the square
export const ROT = (57 * Math.PI) / 180
/** The octagon's corners in (u, v), anticlockwise from the south-east one; each side is the walk from one to the next, the square on its left. */
export const OCT: V2[] = [[53.9, -65], [68.8, -50.1], [68.8, 45.1], [54.4, 59.5], [-55.5, 59.5], [-70.5, 44.5], [-70.5, -50.5], [-56, -65]]
/** How far from a side's line an OSM edge may lie and still be on the square (metres); and the gap between two fronts that is still one front. */
export const SNAP = 1.7
export const JOIN = 1.6
/** A front's run is trimmed to the corner when it stops this near it. */
export const CORNER = 1.8
// ---- tunable: the elevation
export const BAY = 3.7          // the pilaster pitch
export const PIL_W = 0.62       // pilaster width
export const PIL_D = 0.3        // and how far it stands out
export const G = 5.8            // the arcade's top (the string course)
export const EAVES = 18.5       // the wall head, under the cornice
export const TOP = 25.0         // the terrasson's level (the ridge)
export const BRISIS_H = 3.6     // the lower, steep slope's rise
export const BRISIS_T = 0.33    // and its share of the mansard's depth
export const INSET = 5.6        // the mansard's depth in plan
export const ARCH_W = 0.62      // the arch's share of the bay
export const ARCH_H = 4.5
export const ARCH_N = 5         // segments in an arch's head
export const F1 = [6.9, 10.9]   // the first floor's window, y0..y1
export const F2 = [12.1, 15.0]
export const WIN1 = 0.33        // window widths as a share of the bay
export const WIN2 = 0.3
export const CAP0 = 15.4        // the capitals' foot; their head is the entablature's
export const ENT0 = 16.2
export const FRIEZE0 = 16.9
export const CORN0 = 17.65
export const CORN_D = 0.85
export const PAV_D = 0.8        // how far the avant-corps stands out
export const PAV_BAYS = 3
export const PED_RISE = 2.1
export const DORMER_BAY = 1     // a dormer every n-th bay
export const DORMER_Z = 0.5     // its face, this far back of the wall line
export const DORMER_Y = 0.9     // its foot over the eaves
export const DORMER_W = 0.8
export const DORMER_BACK = 1.4
export const STACK_BAY = 3
export const BACK_BAY = 4.4     // the plain walls: window pitch
export const BACK_ROWS = [4.6, 8.3, 11.9, 15.4]

// ---- tunable: colours
const STONE: Rgb = hex('#cdc3b0')
const TRIM: Rgb = shade(STONE, 1.06)
const DEEP: Rgb = shade(STONE, 0.84)
const WALL: Rgb = shade(STONE, 0.97)
const SLATE: Rgb = hex('#4b5059')
const SLATE_HI: Rgb = hex('#5a606a')
const GLASS: Rgb = [0.2, 0.23, 0.27]
const ARCADE_BACK: Rgb = [0.09, 0.1, 0.12]
const IRON: Rgb = [0.12, 0.12, 0.13]
const BRICK: Rgb = hex('#8a5a46')

const c57 = Math.cos(ROT), s57 = Math.sin(ROT)
const toUV = (x: number, z: number): V2 => [x * c57 + z * s57, -x * s57 + z * c57]
const toXZ = (u: number, v: number): V2 => [u * c57 - v * s57, u * s57 + v * c57]

interface Side { a: V2; t: V2; n: V2; L: number; runs: [number, number][] }
function sides(): Side[] {
  return OCT.map((a, i) => {
    const b = OCT[(i + 1) % OCT.length]
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    const t: V2 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]
    return { a, t, n: [t[1], -t[0]], L, runs: [] }
  })
}

function area(r: P2[]): number {
  let s = 0
  for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; s += r[i].x * r[j].z - r[j].x * r[i].z }
  return s / 2
}

interface Ring { pts: P2[]; side: number[]; party: boolean[] }

/** The outlines turned anticlockwise (courtyards clockwise), the edges on the square found, snapped to its sides and gathered into runs. */
function prepare(S: Side[]): Ring[][] {
  const all: Ring[][] = VENDOME_HOTELS.map((h) => h.rings.map((flat, k) => {
    let pts: P2[] = []
    for (let i = 0; i < flat.length; i += 2) pts.push({ x: flat[i], z: flat[i + 1] })
    if ((area(pts) > 0) !== (k === 0)) pts = pts.reverse()
    return { pts, side: pts.map(() => -1), party: pts.map(() => false) }
  }))
  const along1 = (s: Side, u: number, v: number): number => (u - s.a[0]) * s.t[0] + (v - s.a[1]) * s.t[1]
  const dist = (s: Side, u: number, v: number): number => (u - s.a[0]) * s.n[0] + (v - s.a[1]) * s.n[1]
  for (const rings of all) {
    const ring = rings[0]
    const n = ring.pts.length
    // which edges lie on a side (outward normal agreeing): by their endpoints in (u, v)
    for (let i = 0; i < n; i++) {
      const p = ring.pts[i], q = ring.pts[(i + 1) % n]
      const [pu, pv] = toUV(p.x, p.z), [qu, qv] = toUV(q.x, q.z)
      if (Math.hypot(qu - pu, qv - pv) < 1.2) continue
      for (let k = 0; k < S.length; k++) {
        const s = S[k]
        const mid = along1(s, (pu + qu) / 2, (pv + qv) / 2)
        const dir = ((qu - pu) * s.t[0] + (qv - pv) * s.t[1]) / Math.hypot(qu - pu, qv - pv)
        if (Math.abs(dist(s, pu, pv)) < SNAP && Math.abs(dist(s, qu, qv)) < SNAP && dir < -0.9 && mid > -SNAP && mid < s.L + SNAP) ring.side[i] = k
      }
    }
    // vertices: onto the side line
    for (let i = 0; i < n; i++) {
      const sa = ring.side[(i + n - 1) % n], sb = ring.side[i]
      const [u, v] = toUV(ring.pts[i].x, ring.pts[i].z)
      let nu = u, nv = v
      if (sa >= 0 && sb >= 0 && sa !== sb) {
        const A = S[sa], B = S[sb]
        // the corner: the two lines' crossing
        const da = A.n[0] * A.a[0] + A.n[1] * A.a[1], db = B.n[0] * B.a[0] + B.n[1] * B.a[1]
        const det = A.n[0] * B.n[1] - A.n[1] * B.n[0]
        if (Math.abs(det) > 1e-3) { nu = (da * B.n[1] - db * A.n[1]) / det; nv = (A.n[0] * db - B.n[0] * da) / det }
      } else if (sa >= 0 || sb >= 0) {
        const s = S[sa >= 0 ? sa : sb]
        const d = dist(s, u, v)
        nu = u - d * s.n[0]; nv = v - d * s.n[1]
      }
      const [x, z] = toXZ(nu, nv)
      ring.pts[i] = { x, z }
    }
    for (let i = 0; i < n; i++) {
      const k = ring.side[i]
      if (k < 0) continue
      const s = S[k]
      const [pu, pv] = toUV(ring.pts[i].x, ring.pts[i].z), [qu, qv] = toUV(ring.pts[(i + 1) % n].x, ring.pts[(i + 1) % n].z)
      const a = along1(s, pu, pv), b = along1(s, qu, qv)
      s.runs.push([Math.max(0, Math.min(a, b)), Math.min(s.L, Math.max(a, b))])
    }
  }
  // party walls: an edge another building's edge lies back to back against has no wall of its own
  const edges: { ri: number; i: number; a: P2; b: P2 }[] = []
  all.forEach((rings, ri) => rings.forEach((r, k) => { if (k === 0) r.pts.forEach((a, i) => edges.push({ ri, i, a, b: r.pts[(i + 1) % r.pts.length] })) }))
  for (const e of edges) {
    const L = Math.hypot(e.b.x - e.a.x, e.b.z - e.a.z)
    if (L < 1) continue
    const tx = (e.b.x - e.a.x) / L, tz = (e.b.z - e.a.z) / L
    for (const f of edges) {
      if (f.ri === e.ri) continue
      const L2 = Math.hypot(f.b.x - f.a.x, f.b.z - f.a.z)
      if (L2 < 1) continue
      const ux = (f.b.x - f.a.x) / L2, uz = (f.b.z - f.a.z) / L2
      if (tx * ux + tz * uz > -0.97) continue
      const off = (f.a.x - e.a.x) * tz - (f.a.z - e.a.z) * tx
      const off2 = (f.b.x - e.a.x) * tz - (f.b.z - e.a.z) * tx
      if (Math.abs(off) > 1.1 || Math.abs(off2) > 1.1) continue
      const s0 = (f.b.x - e.a.x) * tx + (f.b.z - e.a.z) * tz, s1 = (f.a.x - e.a.x) * tx + (f.a.z - e.a.z) * tz
      const ov = Math.min(L, s1) - Math.max(0, s0)
      if (ov > 0.55 * Math.min(L, L2)) { all[e.ri][0].party[e.i] = true; break }
    }
  }
  // the runs of each side, joined, trimmed to the corners
  for (const s of S) {
    const r = s.runs.sort((a, b) => a[0] - b[0])
    const joined: [number, number][] = []
    for (const q of r) {
      const last = joined[joined.length - 1]
      if (last && q[0] - last[1] < JOIN) last[1] = Math.max(last[1], q[1])
      else joined.push([q[0], q[1]])
    }
    for (const q of joined) { if (q[0] < CORNER) q[0] = 0; if (s.L - q[1] < CORNER) q[1] = s.L }
    s.runs = joined.filter((q) => q[1] - q[0] > 3)
  }
  return all
}

/** An inward offset of a ring, edge by edge (a party edge stays where it is), for the mansard's top. */
function inset(pts: P2[], d: number[]): P2[] {
  const n = pts.length
  const lines = pts.map((_, i) => {
    const e = edgeAt(pts, i)
    return { px: e.a.x + e.nx * d[i], pz: e.a.z + e.nz * d[i], tx: e.tx, tz: e.tz }
  })
  return pts.map((p, i) => {
    const l0 = lines[(i + n - 1) % n], l1 = lines[i]
    const det = l0.tx * l1.tz - l0.tz * l1.tx
    if (Math.abs(det) < 1e-6) return { x: l1.px, z: l1.pz }
    const s = ((l1.px - l0.px) * l1.tz - (l1.pz - l0.pz) * l1.tx) / det
    const q = { x: l0.px + l0.tx * s, z: l0.pz + l0.tz * s }
    return Math.hypot(q.x - p.x, q.z - p.z) > Math.abs(d[i]) * 5 + 2 ? p : q
  })
}

/** The offset that keeps every edge's direction (a thin wing cannot take the whole depth): the first of these that holds, per building. */
const DEBUG: number[] | null = typeof process !== "undefined" && process.env.VDBG ? [] : null
export function debugOffsets(): number[] { return DEBUG ?? [] }
function offsets(rings: Ring[]): P2[][] {
  for (const front of [INSET, 3.6, 2.4, 1.5]) for (const back of [INSET, 3.6, 2.4, 1.5, 0.8, 0.3]) {
    if (back > front) continue
    const out = rings.map((r) => inset(r.pts, r.pts.map((_, i) => (r.party[i] ? 0 : -(r.side[i] >= 0 ? front : back)))))
    const ok = out.every((o, k) => {
      const r = rings[k].pts
      if (Math.abs(area(o)) < 0.08 * Math.abs(area(r)) || (area(o) > 0) !== (area(r) > 0)) return false
      return r.every((_, i) => {
        const e = edgeAt(r, i), f = edgeAt(o, i)
        return e.L < 3 || e.tx * f.tx + e.tz * f.tz > 0.3
      })
    })
    if (ok) { if (DEBUG) DEBUG.push(front * 10 + back); return out }
  }
  if (DEBUG) DEBUG.push(-1)
  return rings.map((r) => r.pts)
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/** One building's mass: plain walls with windows, the two-slope mansard all round (the fronts' walls are the facade's), the roof. */
function mass(out: MeshBuilder, rings: Ring[]): void {
  const inner = offsets(rings)
  rings.forEach((r, k) => {
    const n = r.pts.length
    for (let i = 0; i < n; i++) {
      if (r.party[i]) continue
      const e = edgeAt(r.pts, i)
      const a = r.pts[i], b = r.pts[(i + 1) % n], ia = inner[k][i], ib = inner[k][(i + 1) % n]
      const N: [number, number, number] = [e.nx, 0, e.nz]
      const front = r.side[i] >= 0
      if (!front) {
        out.quad([[a.x, -0.5, a.z], [b.x, -0.5, b.z], [b.x, EAVES, b.z], [a.x, EAVES, a.z]], N, UV, WALL, FIXED)
        if (e.L >= 3) {
          const nb = Math.max(1, Math.round((e.L - 1) / BACK_BAY)), step = (e.L - 1) / nb
          for (let j = 0; j < nb; j++) {
            const u = 0.5 + step * (j + 0.5)
            for (const y of BACK_ROWS) {
              const w = 0.85
              const P = (uu: number, yy: number): [number, number, number] => [a.x + e.tx * uu + e.nx * 0.05, yy, a.z + e.tz * uu + e.nz * 0.05]
              out.quad([P(u - w, y), P(u + w, y), P(u + w, y + 1.9), P(u - w, y + 1.9)], N, UV, GLASS, FIXED)
            }
          }
        }
        // the cornice
        out.quad([[a.x + e.nx * 0.4, EAVES - 0.35, a.z + e.nz * 0.4], [b.x + e.nx * 0.4, EAVES - 0.35, b.z + e.nz * 0.4], [b.x + e.nx * 0.4, EAVES, b.z + e.nz * 0.4], [a.x + e.nx * 0.4, EAVES, a.z + e.nz * 0.4]], N, UV, TRIM, FIXED)
      }
      // the mansard: the brisis, then the terrasson up to the roof's edge
      const m = (p: P2, q: P2, t: number): [number, number] => [lerp(p.x, q.x, t), lerp(p.z, q.z, t)]
      const [ax, az] = m(a, ia, BRISIS_T), [bx, bz] = m(b, ib, BRISIS_T)
      out.quad([[a.x, EAVES, a.z], [b.x, EAVES, b.z], [bx, EAVES + BRISIS_H, bz], [ax, EAVES + BRISIS_H, az]], [e.nx * 0.85, 0.5, e.nz * 0.85], UV, SLATE, FIXED)
      out.quad([[ax, EAVES + BRISIS_H, az], [bx, EAVES + BRISIS_H, bz], [ib.x, TOP, ib.z], [ia.x, TOP, ia.z]], [e.nx * 0.3, 0.95, e.nz * 0.3], UV, SLATE_HI, FIXED)
    }
  })
  capPolygonWithHoles(out, inner, TOP, shade(SLATE, 0.9), FIXED)
}

// ---- the facade, drawn on z = 0 looking at −z, x from 0 to L
const face = (q: MeshBuilder, x0: number, x1: number, y0: number, y1: number, d: number, c: Rgb): void => {
  q.quad([[x0, y0, -d], [x1, y0, -d], [x1, y1, -d], [x0, y1, -d]], [0, 0, -1], UV, c, FIXED)
}

function dormer(q: MeshBuilder, x: number): void {
  // an oeil-de-boeuf in a stone surround with scrolled shoulders, standing out of the brisis a little way up it
  const z = DORMER_Z, y0 = EAVES + DORMER_Y, w = DORMER_W
  const cy = y0 + 0.9
  q.quad([[x - w, y0, z], [x + w, y0, z], [x + w, cy, z], [x - w, cy, z]], [0, 0, -1], UV, TRIM, FIXED)
  const N = 6
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * (i / N), a1 = Math.PI * ((i + 1) / N)
    q.quad([[x, cy, z], [x + Math.cos(a0) * w, cy + Math.sin(a0) * w, z], [x + Math.cos(a1) * w, cy + Math.sin(a1) * w, z], [x, cy, z]], [0, 0, -1], UV, TRIM, FIXED)
  }
  // the round window
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2
    q.quad([[x, cy - 0.05, z - 0.05], [x + Math.cos(a0) * 0.5, cy - 0.05 + Math.sin(a0) * 0.5, z - 0.05], [x + Math.cos(a1) * 0.5, cy - 0.05 + Math.sin(a1) * 0.5, z - 0.05], [x, cy - 0.05, z - 0.05]], [0, 0, -1], UV, GLASS, FIXED)
  }
  // the cheeks, back into the slope
  for (const s of [-1, 1]) q.quad([[x + s * w, y0, z], [x + s * w, y0, z + DORMER_BACK], [x + s * w, cy + 0.2, z + DORMER_BACK], [x + s * w, cy + 0.2, z]], [s, 0, 0], UV, DEEP, FIXED)
}

function pavilionFront(q: MeshBuilder, x0: number, x1: number): void {
  // the avant-corps: the wall stood out, engaged columns at its bays' lines, the entablature carried on, the pediment
  block(q, x0, x1, -PAV_D, 0.1, G, EAVES, WALL)
  const w = x1 - x0
  const bay = w / PAV_BAYS
  for (let i = 0; i <= PAV_BAYS; i++) {
    const x = x0 + i * bay
    const cx = Math.min(Math.max(x, x0 + 0.5), x1 - 0.5)
    prism(q, cx, -PAV_D - 0.1, G + 0.4, CAP0, 0.42, 8, TRIM, FIXED, 0.38)
    box(q, cx, G + 0.35, -PAV_D - 0.1, 0.62, 0.2, 0.62, TRIM, FIXED)
    box(q, cx, (CAP0 + ENT0) / 2, -PAV_D - 0.1, 0.62, (ENT0 - CAP0) / 2, 0.62, shade(TRIM, 1.03), FIXED)
  }
  // the entablature over it, projecting
  face(q, x0 - 0.1, x1 + 0.1, ENT0, FRIEZE0, PAV_D + 0.5, shade(TRIM, 0.97))
  face(q, x0 - 0.1, x1 + 0.1, FRIEZE0, CORN0, PAV_D + 0.45, DEEP)
  cornice(q, x0 - 0.2, x1 + 0.2, CORN0, EAVES, PAV_D + CORN_D, TRIM)
  // the pediment, its raking cornice and the arms in the tympanum
  const xm = (x0 + x1) / 2
  const zf = -PAV_D - CORN_D
  q.quad([[x0 - 0.2, EAVES, zf + 0.02], [x1 + 0.2, EAVES, zf + 0.02], [xm, EAVES + PED_RISE, zf + 0.02], [xm, EAVES + PED_RISE, zf + 0.02]], [0, 0, -1], UV, DEEP, FIXED)
  for (const s of [-1, 1]) {
    const xa = xm + s * (w / 2 + 0.2)
    const t = 0.4
    q.quad([[xa, EAVES, zf - 0.15], [xm, EAVES + PED_RISE, zf - 0.15], [xm, EAVES + PED_RISE + t, zf - 0.15], [xa, EAVES + t * 0.6, zf - 0.15]], [0, 0, -1], UV, TRIM, FIXED)
  }
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2
    q.quad([[xm, EAVES + 0.85, zf - 0.04], [xm + Math.cos(a0) * 0.5, EAVES + 0.85 + Math.sin(a0) * 0.5, zf - 0.04], [xm + Math.cos(a1) * 0.5, EAVES + 0.85 + Math.sin(a1) * 0.5, zf - 0.04], [xm, EAVES + 0.85, zf - 0.04]], [0, 0, -1], UV, TRIM, FIXED)
  }
  // the pediment's roof: slate behind it, leaning back
  for (const s of [-1, 1]) {
    const xa = xm + s * (w / 2 + 0.2)
    q.quad([[xa, EAVES, zf], [xm, EAVES + PED_RISE, zf], [xm, EAVES + PED_RISE, 0.6], [xa, EAVES, 0.6]], [s * 0.3, 0.9, -0.2], UV, SLATE, FIXED)
  }
}

function facade(q: MeshBuilder, L: number, runIndex: number, total: number, pavilion: boolean): void {
  const n = Math.max(1, Math.round((L - PIL_W) / BAY))
  const b = (L - PIL_W) / n
  const cx = (i: number): number => PIL_W / 2 + i * b
  // an avant-corps of PAV_BAYS bays at the middle, on the runs that have the length
  let p0 = -1
  if (pavilion && n >= PAV_BAYS + 2) p0 = Math.round((n - PAV_BAYS) / 2)
  const inPav = (j: number): boolean => p0 >= 0 && j >= p0 && j < p0 + PAV_BAYS
  void runIndex
  void total

  // ---- the ground storey: rusticated piers, the arches (the arcade's own jambs and soffits), the string course
  const centres = Array.from({ length: n }, (_, j) => cx(j) + b / 2)
  arcade(q, 0, 0, L, -0.5, G, centres, b * ARCH_W, ARCH_H, 0.8, WALL, DEEP, ARCADE_BACK, ARCH_N)
  for (let y = 0.6; y < ARCH_H - 1.4; y += 0.85) for (let j = 0; j <= n; j++) {
    const xm = cx(j), w2 = (b * (1 - ARCH_W)) / 2
    face(q, Math.max(0, xm - w2 + 0.04), Math.min(L, xm + w2 - 0.04), y, y + 0.06, 0.03, DEEP)
  }
  for (let y = ARCH_H + 0.2; y < G - 0.3; y += 0.7) face(q, 0, L, y, y + 0.06, 0.03, DEEP)
  cornice(q, 0, L, G - 0.05, G + 0.3, 0.25, TRIM)

  // ---- the upper wall, the pilasters, the windows
  face(q, 0, L, G + 0.3, EAVES, 0, WALL)
  for (let j = 0; j < n; j++) {
    const x = cx(j) + b / 2
    const d = inPav(j) ? PAV_D : 0
    const w1 = b * WIN1, w2 = b * WIN2
    // first floor: the tall window with its surround, the mullion and the balcony
    face(q, x - w1 - 0.18, x + w1 + 0.18, F1[0] - 0.12, F1[1] + 0.25, d + 0.05, TRIM)
    face(q, x - w1, x + w1, F1[0], F1[1], d + 0.09, GLASS)
    face(q, x - 0.035, x + 0.035, F1[0], F1[1], d + 0.12, TRIM)
    face(q, x - w1 - 0.22, x + w1 + 0.22, F1[0] - 0.2, F1[0] + 0.6, d + 0.4, IRON)
    q.quad([[x - w1 - 0.6, F1[0] - 0.35, -d], [x + w1 + 0.6, F1[0] - 0.35, -d], [x + w1 + 0.6, F1[0] - 0.35, -d - 0.5], [x - w1 - 0.6, F1[0] - 0.35, -d - 0.5]], [0, 1, 0], UV, TRIM, FIXED)
    // second floor
    face(q, x - w2 - 0.16, x + w2 + 0.16, F2[0] - 0.12, F2[1] + 0.2, d + 0.05, TRIM)
    face(q, x - w2, x + w2, F2[0], F2[1], d + 0.09, GLASS)
    face(q, x - 0.03, x + 0.03, F2[0], F2[1], d + 0.12, TRIM)
    face(q, x - w2 - 0.12, x + w2 + 0.12, F2[0] - 0.3, F2[0] + 0.15, d + 0.2, IRON)
  }
  for (let i = 0; i <= n; i++) {
    const x = cx(i)
    if (p0 >= 0 && i >= p0 && i <= p0 + PAV_BAYS) continue
    box(q, x, (G + 0.3 + CAP0) / 2, -PIL_D / 2, PIL_W / 2, (CAP0 - G - 0.3) / 2, PIL_D / 2, TRIM, FIXED)
    box(q, x, (CAP0 + ENT0) / 2, -PIL_D / 2 - 0.05, PIL_W / 2 + 0.12, (ENT0 - CAP0) / 2, PIL_D / 2 + 0.05, shade(TRIM, 1.04), FIXED)
  }
  if (p0 >= 0) pavilionFront(q, cx(p0), cx(p0 + PAV_BAYS))

  // ---- the entablature (the avant-corps carries its own over its bays)
  const segs: [number, number][] = p0 >= 0 ? [[0, cx(p0) - 0.05], [cx(p0 + PAV_BAYS) + 0.05, L]] : [[0, L]]
  for (const [s0, s1] of segs) {
    if (s1 - s0 < 0.3) continue
    face(q, s0, s1, ENT0, FRIEZE0, 0.1, shade(TRIM, 0.97))
    face(q, s0, s1, FRIEZE0, CORN0, 0.05, DEEP)
    cornice(q, s0, s1, CORN0, EAVES, CORN_D, TRIM)
  }

  // ---- the roof's dressing: a dormer in the bays, a stone stack over every few of them
  for (let j = 0; j < n; j += DORMER_BAY) dormer(q, cx(j) + b / 2)
  for (let j = 1; j < n; j += STACK_BAY) {
    const x = cx(j)
    block(q, x - 0.5, x + 0.5, 2.6, 3.4, TOP - 3, TOP + 1.9, shade(STONE, 0.95))
    block(q, x - 0.6, x + 0.6, 2.5, 3.5, TOP + 1.9, TOP + 2.35, BRICK)
  }
}

/** Where the 19 hôtels stand: for the manifest. */
export const VENDOME_REFS = VENDOME_HOTELS.map((h) => h.ref)

export function placeVendome(out: MeshBuilder): void {
  const S = sides()
  const all = prepare(S)
  for (const rings of all) mass(out, rings)
  // the avant-corps: the middle of the two long sides and of each cut corner
  S.forEach((s, k) => {
    // sides 0 (south-east chamfer's start) … the walk: 0 = SE cut corner, 1 = NE end, 2 = NE-NW cut corner, 3 = NW long side,
    // 4 = SW-NW cut corner, 5 = SW end, 6 = SW-SE cut corner, 7 = SE long side
    s.runs.forEach((r, ri) => {
      // (walked with the square on the right, which is how `along` faces its front: against the octagon's own sense)
      const A = toXZ(s.a[0] + s.t[0] * r[1], s.a[1] + s.t[1] * r[1])
      const B = toXZ(s.a[0] + s.t[0] * r[0], s.a[1] + s.t[1] * r[0])
      const chamfer = k % 2 === 0
      const pavilion = chamfer || k === 3 || k === 7
      along(out, A, B, (q, L) => facade(q, L, ri, s.runs.length, pavilion))
    })
  })
}
