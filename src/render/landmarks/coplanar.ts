/**
 * COINCIDENT FACES, REMOVED (the goal: "around Union Square, several of our custom buildings … have severe Z fighting").
 *
 * Landmarks are drawn double-sided, so two faces in one plane fight wherever they overlap — whichever way they face. A
 * probe over every model within 250 m of Union Square (triangles bucketed by plane, overlaps clipped exactly) found the
 * causes are all in the builders' own geometry: `box()`'s bottom face lying on the deck or the box beneath it (every
 * pavilion, step and plinth on Union Square's deck), two boxes abutting so their touching faces coincide, a facade band
 * drawn twice over the same storeys (Macy's: 4 400 m² of wall against itself).
 *
 * One rule covers them all: a triangle lying wholly within larger coplanar ones (within a centimetre) is dropped. A face inside another one is either hidden by it or fighting it — never seen alone — and
 * dropping only the contained one leaves no hole. Faces offset on purpose (a window 4 cm proud of its wall) are more than
 * a centimetre away and untouched. Runs on the indices only: the vertices stay where they are.
 */
import type { MeshBuilder } from '../buildings.ts'

const GAP = 0.015
const EPS = 0.01

export function dropCoincidentFaces(mb: MeshBuilder): number {
  const p = mb.positions
  const idx = mb.indices
  const n = idx.length / 3
  if (n < 2) return 0
  // a vertex's position, as one number (to the millimetre), so shared corners compare without strings
  const vkey = (k: number): number => {
    const x = Math.round(p[k] * 1000), y = Math.round(p[k + 1] * 1000), z = Math.round(p[k + 2] * 1000)
    return ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0
  }
  type T = { i: number; down: boolean; up: boolean; keys: [number, number, number]; d: number; uv: [number, number][]; x0: number; x1: number; y0: number; y1: number; area: number }
  const buckets = new Map<number, T[]>()
  for (let t = 0; t < n; t++) {
    const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3
    const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2]
    const vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2]
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
    const L = Math.hypot(nx, ny, nz)
    if (L < 1e-4) continue
    nx /= L; ny /= L; nz /= L
    // (which way it FACES from the declared normal: quad()'s winding does not follow it)
    const dny = mb.normals[idx[t * 3] * 3 + 1]
    const down = dny < -0.9 && Math.abs(ny) > 0.9, up = dny > 0.9 && Math.abs(ny) > 0.9
    if (nx < -1e-6 || (Math.abs(nx) < 1e-6 && (ny < -1e-6 || (Math.abs(ny) < 1e-6 && nz < 0)))) { nx = -nx; ny = -ny; nz = -nz }
    const d = nx * p[a] + ny * p[a + 1] + nz * p[a + 2]
    const ax = Math.abs(nx) > 0.9 ? [0, 1, 0] : [1, 0, 0]
    let ex = ax[1] * nz - ax[2] * ny, ey = ax[2] * nx - ax[0] * nz, ez = ax[0] * ny - ax[1] * nx
    const EL = Math.hypot(ex, ey, ez); ex /= EL; ey /= EL; ez /= EL
    const fx = ny * ez - nz * ey, fy = nz * ex - nx * ez, fz = nx * ey - ny * ex
    const uv: [number, number][] = [[p[a] * ex + p[a + 1] * ey + p[a + 2] * ez, p[a] * fx + p[a + 1] * fy + p[a + 2] * fz],
      [p[b] * ex + p[b + 1] * ey + p[b + 2] * ez, p[b] * fx + p[b + 1] * fy + p[b + 2] * fz],
      [p[c] * ex + p[c + 1] * ey + p[c + 2] * ez, p[c] * fx + p[c + 1] * fy + p[c + 2] * fz]]
    const nk = ((Math.round(nx * 200) + 400) * 1000003 + (Math.round(ny * 200) + 400) * 1009 + (Math.round(nz * 200) + 400)) * 100003
    const tri: T = { i: t, down, up, keys: [vkey(a), vkey(b), vkey(c)], d, uv,
      x0: Math.min(uv[0][0], uv[1][0], uv[2][0]), x1: Math.max(uv[0][0], uv[1][0], uv[2][0]),
      y0: Math.min(uv[0][1], uv[1][1], uv[2][1]), y1: Math.max(uv[0][1], uv[1][1], uv[2][1]), area: L / 2 }
    for (const key of [nk + Math.round(d / (2 * GAP))]) {
      let list = buckets.get(key)
      if (!list) { list = []; buckets.set(key, list) }
      list.push(tri)
    }
  }
  const inside = (qx: number, qy: number, tri: [number, number][]): boolean => {
    let sign = 0
    for (let k = 0; k < 3; k++) {
      const a = tri[k], b = tri[k === 2 ? 0 : k + 1]
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
      const dist = ((b[0] - a[0]) * (qy - a[1]) - (b[1] - a[1]) * (qx - a[0])) / len
      if (dist <= EPS && dist >= -EPS) continue
      const s = dist > 0 ? 1 : -1
      if (sign === 0) sign = s
      else if (s !== sign) return false
    }
    return true
  }
  const drop = new Set<number>()
  const CELL = 4
  const samples = new Float64Array(14)
  for (const list of buckets.values()) {
    if (list.length < 2) continue
    // a grid over the plane, each triangle filed in every cell its box reaches
    const grid = new Map<number, T[]>()
    const cells = (t: T, f: (k: number) => void): void => {
      const i0 = Math.floor((t.x0 - EPS) / CELL), i1 = Math.floor((t.x1 + EPS) / CELL)
      const j0 = Math.floor((t.y0 - EPS) / CELL), j1 = Math.floor((t.y1 + EPS) / CELL)
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) f(i * 1000003 + j)
    }
    for (const t of list) cells(t, (k) => { let c = grid.get(k); if (!c) { c = []; grid.set(k, c) } c.push(t) })
    for (const S of list) {
      const near = new Set<T>()
      cells(S, (k) => { for (const B of grid.get(k) ?? []) if (B !== S) near.add(B) })
      if (!near.size) continue
      const [q0, q1, q2] = S.uv
      samples.set([q0[0], q0[1], q1[0], q1[1], q2[0], q2[1], (q0[0] + q1[0]) / 2, (q0[1] + q1[1]) / 2, (q1[0] + q2[0]) / 2, (q1[1] + q2[1]) / 2,
        (q2[0] + q0[0]) / 2, (q2[1] + q0[1]) / 2, (q0[0] + q1[0] + q2[0]) / 3, (q0[1] + q1[1] + q2[1]) / 3])
      const cover: T[] = []
      let floorOn = false
      for (const B of near) {
        if (drop.has(B.i) || Math.abs(B.d - S.d) > GAP) continue
        if (B.x0 > S.x1 + EPS || B.x1 < S.x0 - EPS || B.y0 > S.y1 + EPS || B.y1 < S.y0 - EPS) continue
        if (S.down && B.up && !floorOn) {
          for (let k = 0; k < 14 && !floorOn; k += 2) if (inside(samples[k], samples[k + 1], B.uv)) floorOn = true
        }
        if (B.area < S.area || (B.area === S.area && B.i > S.i)) continue
        let shared = 0, sk0 = -1, sk1 = -1
        for (let k = 0; k < 3; k++) if (B.keys.includes(S.keys[k])) { shared++; if (sk0 < 0) sk0 = k; else sk1 = k }
        if (shared === 2) {
          // an edge-sharing neighbour — the other half of the same quad — only touches, unless the two third corners
          // lie on the SAME side of that edge (a band drawn twice from the same end: Macy's)
          const e0 = S.uv[sk0], e1 = S.uv[sk1]
          const side = (q: [number, number]): number => (e1[0] - e0[0]) * (q[1] - e0[1]) - (e1[1] - e0[1]) * (q[0] - e0[0])
          const sThird = S.uv[3 - sk0 - sk1]
          let bThird: [number, number] | null = null
          for (let k = 0; k < 3; k++) if (B.keys[k] !== S.keys[sk0] && B.keys[k] !== S.keys[sk1]) bThird = B.uv[k]
          if (!bThird || side(sThird) * side(bThird) <= 0) continue
        }
        cover.push(B)
      }
      let covered = cover.length > 0
      for (let k = 0; k < 14 && covered; k += 2) {
        let any = false
        for (const B of cover) if (inside(samples[k], samples[k + 1], B.uv)) { any = true; break }
        if (!any) covered = false
      }
      if (covered || floorOn) drop.add(S.i)
    }
  }
  if (drop.size === 0) return 0
  const kept: number[] = []
  for (let t = 0; t < n; t++) if (!drop.has(t)) kept.push(idx[t * 3], idx[t * 3 + 1], idx[t * 3 + 2])
  idx.length = 0
  for (const k of kept) idx.push(k)
  return drop.size
}

/**
 * Split every triangle with an edge longer than `max` metres into four, until none is — before a model is DRAPED on
 * the ground (render/landmarks.ts `drape`): a big slab draped only at its corners is a tilted plane, and the smaller
 * layers over it, draped at their own vertices, cut through it and fight (Union Square's deck, 2026-10-03).
 */
export function subdivideLong(mb: MeshBuilder, max: number): void {
  const P = mb.positions, N = mb.normals, U = mb.uvs, C = mb.colors
  const mid = (a: number, b: number): number => {
    P.push((P[a * 3] + P[b * 3]) / 2, (P[a * 3 + 1] + P[b * 3 + 1]) / 2, (P[a * 3 + 2] + P[b * 3 + 2]) / 2)
    N.push(N[a * 3], N[a * 3 + 1], N[a * 3 + 2])
    U.push((U[a * 2] + U[b * 2]) / 2, (U[a * 2 + 1] + U[b * 2 + 1]) / 2)
    C.push(C[a * 4], C[a * 4 + 1], C[a * 4 + 2], C[a * 4 + 3])
    return P.length / 3 - 1
  }
  const len = (a: number, b: number): number => Math.hypot(P[a * 3] - P[b * 3], P[a * 3 + 2] - P[b * 3 + 2])
  let tris = mb.indices.slice()
  for (let pass = 0; pass < 8; pass++) {
    const next: number[] = []
    let split = false
    for (let t = 0; t < tris.length; t += 3) {
      const [a, b, c] = [tris[t], tris[t + 1], tris[t + 2]]
      if (Math.max(len(a, b), len(b, c), len(c, a)) <= max) { next.push(a, b, c); continue }
      split = true
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a)
      next.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca)
    }
    tris = next
    if (!split) break
  }
  mb.indices.length = 0
  for (const k of tris) mb.indices.push(k)
}
