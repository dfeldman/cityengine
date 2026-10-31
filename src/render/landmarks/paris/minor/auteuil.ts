/**
 * L'ESPACE ROBERT-PAPAREMBORDE, in the middle of the Auteuil course (owner, 2026-10-30, #21 and #22: "there's a wide grass track for the
 * hippodrome, and then two rugby fields in the middle. we show grass and trees only"; "another rugby field here").
 *
 * IGN's latest aerial has both grounds under the white gravel of a car park and is no use (a Games' or a tournament's, not checked): these are
 * off ORTHOIMAGERY.ORTHOPHOTOS2018, which has the rugby pitch with all its lines (OSM way/421869751, `rugby_union`) and the upper
 * ground, OSM's football pitch (way/236687127, 105 × 68 m), inside the teal running track of the sports ground, its goal areas drawn for
 * football in that year; the owner calls it rugby and it may be both. The course round them: the wide band of mown turf outside the dirt
 * ring, its white rail on the ring's outer edge, traced off the same photograph.
 *
 * x east, z north (front 180), draped: everything here is paint on the ground. The trees stop in tools/gardens/paris-public.ts (`auteuil`),
 * at the next bake.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade, type Rgb } from '../../kit.ts'
import { UV, surfaceTag, type P2 } from '../rivegauche/common.ts'

const LAT = 48.8504, LON = 2.2559
/** a pixel of ortho-21-2018 (1000 px, north 48.852197, west 2.253170, south 48.848603, east 2.258630) in this frame */
const PX = (px: number, py: number): P2 => ({ x: (2.25317 + (px / 1000) * 0.00546 - LON) * 73270, z: (48.852197 - (py / 1000) * 0.003594 - LAT) * 111320 })

/** A patch lying on the ground `y` above it, cut into squares of about `step` metres so that the drape follows the ground. */
function patch(out: MeshBuilder, a: P2, b: P2, c: P2, d: P2, y: number, col: Rgb, step = 18, tag = 0): void {
  const nu = Math.max(1, Math.ceil(Math.max(Math.hypot(b.x - a.x, b.z - a.z), Math.hypot(c.x - d.x, c.z - d.z)) / step))
  const nv = Math.max(1, Math.ceil(Math.max(Math.hypot(d.x - a.x, d.z - a.z), Math.hypot(c.x - b.x, c.z - b.z)) / step))
  const P = (i: number, j: number): [number, number, number] => {
    const u = i / nu, v = j / nv
    const l = { x: a.x + (d.x - a.x) * v, z: a.z + (d.z - a.z) * v }
    const r = { x: b.x + (c.x - b.x) * v, z: b.z + (c.z - b.z) * v }
    return [l.x + (r.x - l.x) * u, y, l.z + (r.z - l.z) * u]
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) out.quad([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], [0, 1, 0], UV, col, tag)
}

/** A pitch's own frame: four corners, u across (0..1), v along (0..1), and a white line from (u0,v0) to (u1,v1), `w` metres wide */
function pitchLines(out: MeshBuilder, q: P2[], y: number): (u0: number, v0: number, u1: number, v1: number, w?: number) => void {
  const at = (u: number, v: number): P2 => {
    const l = { x: q[0].x + (q[3].x - q[0].x) * v, z: q[0].z + (q[3].z - q[0].z) * v }
    const r = { x: q[1].x + (q[2].x - q[1].x) * v, z: q[1].z + (q[2].z - q[1].z) * v }
    return { x: l.x + (r.x - l.x) * u, z: l.z + (r.z - l.z) * u }
  }
  const white: Rgb = hex('#e8e8e2')
  return (u0, v0, u1, v1, w = 0.3) => {
    const a = at(u0, v0), b = at(u1, v1)
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const nx = (-(b.z - a.z) / L) * w / 2, nz = ((b.x - a.x) / L) * w / 2
    patch(out, { x: a.x + nx, z: a.z + nz }, { x: b.x + nx, z: b.z + nz }, { x: b.x - nx, z: b.z - nz }, { x: a.x - nx, z: a.z - nz }, y, white, 30)
  }
}

export function auteuilGrounds(out: MeshBuilder, fit: Fit): void {
  void fit
  const y = 0.1            // over the ground the drape has put it on
  // ---- the course: the wide band of turf outside the dirt ring, in the paler stripe the mowers leave, and its white rail
  const inner = [[228, 615], [226, 690], [255, 765], [300, 825], [370, 860], [450, 870], [525, 845], [590, 770], [650, 680], [705, 575], [755, 455], [790, 340], [815, 220], [825, 100], [822, 40]].map(([a, b]) => PX(a, b))
  const turf: Rgb = hex('#55803f'), turf2: Rgb = hex('#4c7739')
  const lane = 46
  const normals = inner.map((p, i) => {
    const q = inner[Math.max(0, i - 1)], r = inner[Math.min(inner.length - 1, i + 1)]
    const L = Math.hypot(r.x - q.x, r.z - q.z) || 1
    // the course's outside is to the right going round this way, west and south and east
    return { x: (-(r.z - q.z) / L), z: ((r.x - q.x) / L) }
  })
  for (let i = 0; i + 1 < inner.length; i++) {
    const a = inner[i], b = inner[i + 1], na = normals[i], nb = normals[i + 1]
    const O = (p: P2, n: P2, d: number): P2 => ({ x: p.x - n.x * d, z: p.z - n.z * d })
    for (let k = 0; k < 3; k++) {
      const d0 = 3 + (lane * k) / 3, d1 = 3 + (lane * (k + 1)) / 3
      patch(out, O(a, na, d0), O(b, nb, d0), O(b, nb, d1), O(a, na, d1), y, k % 2 ? turf : turf2, 22)
    }
    // the white rail along the track's inner edge: a post every ten metres or so, a rail on them
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const n = Math.max(1, Math.round(L / 10))
    const rail: Rgb = hex('#e9e9e4')
    const pa = O(a, na, 3), pb = O(b, nb, 3)
    for (let j = 0; j < n; j++) {
      const u0 = j / n, u1 = (j + 1) / n
      const s = { x: pa.x + (pb.x - pa.x) * u0, z: pa.z + (pb.z - pa.z) * u0 }, e = { x: pa.x + (pb.x - pa.x) * u1, z: pa.z + (pb.z - pa.z) * u1 }
      out.quad([[s.x, 0.95, s.z], [e.x, 0.95, e.z], [e.x, 1.1, e.z], [s.x, 1.1, s.z]], [(e.z - s.z), 0, -(e.x - s.x)], UV, rail, 0)
      out.quad([[s.x, 0.95, s.z], [e.x, 0.95, e.z], [e.x, 1.1, e.z], [s.x, 1.1, s.z]], [-(e.z - s.z), 0, (e.x - s.x)], UV, rail, 0)
      for (const sg of [-1, 1]) out.quad([[s.x - 0.05, 0, s.z], [s.x + 0.05, 0, s.z], [s.x + 0.05, 1.05, s.z], [s.x - 0.05, 1.05, s.z]], [0, 0, sg], UV, shade(rail, 0.94), 0)
    }
  }

  // ---- the rugby pitch, OSM's corners, the dark artificial green of 2018, and its lines
  const yp = y + 0.03, yl = y + 0.12
  const R: P2[] = [{ x: -64, z: -131.8 }, { x: 8.5, z: -122.7 }, { x: -7.4, z: 3.2 }, { x: -79.9, z: -5.9 }]
  patch(out, R[0], R[1], R[2], R[3], yp, hex('#2c5237'), 22, surfaceTag('foliage'))
  const r = pitchLines(out, R, yl)
  const m = 0.055                                    // the surround outside the touch lines, the fraction of the width
  const t = 0.05                                     // and the in-goal
  r(m, t, 1 - m, t); r(m, 1 - t, 1 - m, 1 - t); r(m, t, m, 1 - t); r(1 - m, t, 1 - m, 1 - t)
  for (const v of [t + 0.09, 0.5 - 0.09, 0.5, 0.5 + 0.09, 1 - t - 0.09, t + 0.05, 1 - t - 0.05]) {
    if (v === 0.5 || v === t + 0.09 || v === 1 - t - 0.09) r(m, v, 1 - m, v)
    else for (let k = 0; k < 8; k++) { const u = m + ((1 - 2 * m) * (k + 0.25)) / 8; r(u, v, u + 0.05, v) }
  }
  // the posts, thin and white, at each dead-ball end: an H standing on the try line
  for (const v of [t, 1 - t]) {
    const p = (u: number): P2 => {
      const l = { x: R[0].x + (R[3].x - R[0].x) * v, z: R[0].z + (R[3].z - R[0].z) * v }
      const rr = { x: R[1].x + (R[2].x - R[1].x) * v, z: R[1].z + (R[2].z - R[1].z) * v }
      return { x: l.x + (rr.x - l.x) * u, z: l.z + (rr.z - l.z) * u }
    }
    const a = p(0.462), b = p(0.538)
    const post: Rgb = hex('#ededec')
    for (const c of [a, b]) for (const s of [-1, 1]) {
      out.quad([[c.x - 0.09, 0, c.z], [c.x + 0.09, 0, c.z], [c.x + 0.09, 13, c.z], [c.x - 0.09, 13, c.z]], [0, 0, s], UV, post, 0)
      out.quad([[c.x, 0, c.z - 0.09], [c.x, 0, c.z + 0.09], [c.x, 13, c.z + 0.09], [c.x, 13, c.z - 0.09]], [s, 0, 0], UV, post, 0)
    }
    for (const s of [-1, 1]) out.quad([[a.x, 3, a.z], [b.x, 3, b.z], [b.x, 3.16, b.z], [a.x, 3.16, a.z]], [s * (b.z - a.z), 0, -s * (b.x - a.x)], UV, post, 0)
  }

  // ---- the upper ground: the teal track on OSM's pitch's axes, its D-shaped ends in the same colour, the pitch in the middle
  const S: P2[] = [{ x: 18.3, z: 39.5 }, { x: 85.2, z: 27.6 }, { x: 103.7, z: 131 }, { x: 36.7, z: 142.9 }]
  const cx = (S[0].x + S[1].x + S[2].x + S[3].x) / 4, cz = (S[0].z + S[1].z + S[2].z + S[3].z) / 4
  const ax = { x: (S[3].x - S[0].x) / Math.hypot(S[3].x - S[0].x, S[3].z - S[0].z), z: (S[3].z - S[0].z) / Math.hypot(S[3].x - S[0].x, S[3].z - S[0].z) }
  const ac = { x: ax.z, z: -ax.x }
  const TEAL: Rgb = hex('#4d8a86'), TEAL2: Rgb = hex('#568f8c')
  const T = (along: number, across: number): P2 => ({ x: cx + ax.x * along + ac.x * across, z: cz + ax.z * along + ac.z * across })
  const halfS = 52.6, rIn = 36.2, rOut = 44
  // its straights
  for (const s of [-1, 1]) {
    patch(out, T(-halfS, s * rIn), T(halfS, s * rIn), T(halfS, s * rOut), T(-halfS, s * rOut), yp, TEAL, 18)
    for (let k = 1; k < 4; k++) {
      const d = rIn + ((rOut - rIn) * k) / 4
      patch(out, T(-halfS, s * (d - 0.06)), T(halfS, s * (d - 0.06)), T(halfS, s * (d + 0.06)), T(-halfS, s * (d + 0.06)), yl, hex('#d7e0dc'), 30)
    }
  }
  // its bends and what they enclose
  const arcN = 16
  for (const e of [-1, 1]) {
    for (let i = 0; i < arcN; i++) {
      const a0 = ((i / arcN) - 0.5) * Math.PI, a1 = (((i + 1) / arcN) - 0.5) * Math.PI
      const P = (a: number, r0: number): P2 => T(e * (halfS + Math.cos(a) * r0), Math.sin(a) * r0)
      patch(out, P(a0, rIn), P(a1, rIn), P(a1, rOut), P(a0, rOut), yp, TEAL, 30)
      patch(out, T(e * halfS, Math.sin(a0) * rIn), T(e * halfS, Math.sin(a1) * rIn), P(a1, rIn), P(a0, rIn), yp, TEAL2, 30)
      for (let k = 1; k < 4; k++) {
        const d = rIn + ((rOut - rIn) * k) / 4
        patch(out, P(a0, d - 0.06), P(a1, d - 0.06), P(a1, d + 0.06), P(a0, d + 0.06), yl, hex('#d7e0dc'), 30)
      }
    }
  }
  // the pitch
  patch(out, T(-52.5, -34), T(52.5, -34), T(52.5, 34), T(-52.5, 34), yl - 0.05, hex('#36633c'), 22, surfaceTag('foliage'))
  const line = (a0: number, c0: number, a1: number, c1: number): void => {
    const a = T(a0, c0), b = T(a1, c1)
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const nx = (-(b.z - a.z) / L) * 0.07, nz = ((b.x - a.x) / L) * 0.07
    patch(out, { x: a.x + nx, z: a.z + nz }, { x: b.x + nx, z: b.z + nz }, { x: b.x - nx, z: b.z - nz }, { x: a.x - nx, z: a.z - nz }, yl + 0.05, hex('#e8e8e2'), 40)
  }
  line(-52.5, -34, 52.5, -34); line(-52.5, 34, 52.5, 34); line(-52.5, -34, -52.5, 34); line(52.5, -34, 52.5, 34); line(0, -34, 0, 34)
  for (const e of [-1, 1]) {
    const g = e * 52.5, h = e * 36
    line(g, -20.15, h, -20.15); line(g, 20.15, h, 20.15); line(h, -20.15, h, 20.15)
    line(g, -9.15, e * 47, -9.15); line(g, 9.15, e * 47, 9.15); line(e * 47, -9.15, e * 47, 9.15)
    // the goal: two posts and a bar
    const a = T(g, -3.66), b = T(g, 3.66)
    for (const c of [a, b]) for (const s of [-1, 1]) out.quad([[c.x - 0.07, 0, c.z], [c.x + 0.07, 0, c.z], [c.x + 0.07, 2.44, c.z], [c.x - 0.07, 2.44, c.z]], [0, 0, s], UV, hex('#efefef'), 0)
    for (const s of [-1, 1]) out.quad([[a.x, 2.34, a.z], [b.x, 2.34, b.z], [b.x, 2.46, b.z], [a.x, 2.46, a.z]], [s * (b.z - a.z), 0, -s * (b.x - a.x)], UV, hex('#efefef'), 0)
  }
  // the centre circle, in chords
  for (let i = 0; i < 20; i++) {
    const a0 = (i / 20) * Math.PI * 2, a1 = ((i + 1) / 20) * Math.PI * 2
    line(Math.cos(a0) * 9.15, Math.sin(a0) * 9.15, Math.cos(a1) * 9.15, Math.sin(a1) * 9.15)
  }
}

