/**
 * The venues' shared kit: superellipse rings (a stadium's plan is one — an ellipse outside, a rounded rectangle at the
 * pitch), the raked bands a bowl of seats is made of, a curved fin for the Parc des Princes' ribs, and the playing
 * surfaces (a football pitch with its lines and mowing stripes, a clay tennis court).
 *
 * Every builder here works in its own frame: x along the playing axis, z across it, y up from the model's base (the
 * lowest ground under it, half a metre down). Rings are parametrised by the POLAR angle θ, so two rings sampled at the
 * same θ line up radially and a band between them never folds.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, FIXED, type Rgb } from '../../../models.ts'
import type { Fit } from '../../fit.ts'

export type V3 = [number, number, number]
export interface Sup { a: number; b: number; n: number }

/** the superellipse's radius along the polar angle θ */
export function supR(s: Sup, th: number): number {
  const c = Math.abs(Math.cos(th)) / s.a
  const d = Math.abs(Math.sin(th)) / s.b
  return Math.pow(Math.pow(c, s.n) + Math.pow(d, s.n), -1 / s.n)
}
export const supAt = (s: Sup, th: number, y: number): V3 => {
  const r = supR(s, th)
  return [Math.cos(th) * r, y, Math.sin(th) * r]
}
/** a ring of the superellipse, anticlockwise from +x, as plan points */
export const supRing = (s: Sup, segs: number): { x: number; z: number }[] =>
  Array.from({ length: segs }, (_, i) => {
    const p = supAt(s, (i / segs) * Math.PI * 2, 0)
    return { x: p[0], z: p[2] }
  })
/** a superellipse grown by `d` metres all round (approximately: each semi-axis) */
export const grow = (s: Sup, d: number, n = s.n): Sup => ({ a: s.a + d, b: s.b + d, n })

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A quad whose normal is worked out from its corners and turned to agree with `want`. */
export function quadN(out: MeshBuilder, p: V3[], want: V3, c: Rgb, tag = FIXED): void {
  const d1 = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]]
  const d2 = [p[3][0] - p[1][0], p[3][1] - p[1][1], p[3][2] - p[1][2]]
  let n: V3 = [d1[1] * d2[2] - d1[2] * d2[1], d1[2] * d2[0] - d1[0] * d2[2], d1[0] * d2[1] - d1[1] * d2[0]]
  const l = Math.hypot(n[0], n[1], n[2])
  if (l < 1e-9) return
  n = [n[0] / l, n[1] / l, n[2] / l]
  if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0) n = [-n[0], -n[1], -n[2]]
  out.quad(p, n, UV, c, tag)
}

/**
 * A band between two rings: ring A (s0 at height y0) and ring B (s1 at y1), from θ0 to θ1 in `segs` pieces. `face`
 * says which way it looks — 'in' (towards the middle and up: a rake of seats, a roof's top), 'out' (a facade),
 * 'down' (a soffit) — and `colour(i, θ)` paints each piece. Heights may be functions of θ (an undulating roof).
 */
export function band(out: MeshBuilder, s0: Sup, y0: number | ((th: number) => number), s1: Sup, y1: number | ((th: number) => number),
  face: 'in' | 'out' | 'down' | 'up', colour: (i: number, th: number) => Rgb, o: { segs?: number; th0?: number; th1?: number; tag?: number } = {}): void {
  const segs = o.segs ?? 96
  const th0 = o.th0 ?? 0
  const th1 = o.th1 ?? Math.PI * 2
  const Y0 = typeof y0 === 'number' ? (): number => y0 : y0
  const Y1 = typeof y1 === 'number' ? (): number => y1 : y1
  for (let i = 0; i < segs; i++) {
    const ta = th0 + ((th1 - th0) * i) / segs
    const tb = th0 + ((th1 - th0) * (i + 1)) / segs
    const tm = (ta + tb) / 2
    const p = [supAt(s0, ta, Y0(ta)), supAt(s0, tb, Y0(tb)), supAt(s1, tb, Y1(tb)), supAt(s1, ta, Y1(ta))]
    const rx = Math.cos(tm)
    const rz = Math.sin(tm)
    const want: V3 = face === 'in' ? [-rx * 0.3, 1, -rz * 0.3] : face === 'out' ? [rx, 0, rz] : face === 'up' ? [0, 1, 0] : [0, -1, 0]
    quadN(out, p, want, colour(i, tm), o.tag ?? FIXED)
  }
}

/** A filled superellipse at height y, facing up: a pitch's surround, a roof's cap. */
export function disc(out: MeshBuilder, s: Sup, y: number, c: Rgb, segs = 64, tag = FIXED): void {
  for (let i = 0; i < segs; i++) {
    const a = supAt(s, (i / segs) * Math.PI * 2, y)
    const b = supAt(s, ((i + 1) / segs) * Math.PI * 2, y)
    quadN(out, [[0, y, 0], a, b, [0, y, 0]], [0, 1, 0], c, tag)
  }
}

/**
 * A curved fin standing in the vertical plane along direction (dx, dz) from the origin: its outline is a list of
 * cross-sections, each a pair of (r, y) points (the inner/lower edge, then the outer/upper edge), and it is `t`
 * thick. The Parc des Princes' fifty portiques are this: a post outside the stands that bends over into a cantilever.
 */
export function fin(out: MeshBuilder, sections: [[number, number], [number, number]][], dx: number, dz: number, t: number, c: Rgb, tag = FIXED): void {
  const tx = -dz
  const tz = dx
  const P = (r: number, y: number, s: number): V3 => [dx * r + tx * s * t / 2, y, dz * r + tz * s * t / 2]
  for (let k = 0; k + 1 < sections.length; k++) {
    const [a0, a1] = sections[k]
    const [b0, b1] = sections[k + 1]
    for (const s of [-1, 1]) quadN(out, [P(a0[0], a0[1], s), P(a1[0], a1[1], s), P(b1[0], b1[1], s), P(b0[0], b0[1], s)], [tx * s, 0, tz * s], c, tag)
    // the inner/lower edge and the outer/upper edge: normals from the section's own geometry
    const ein: V3 = [-(a1[0] - a0[0]) * dx, -(a1[1] - a0[1]), -(a1[0] - a0[0]) * dz]
    quadN(out, [P(a0[0], a0[1], -1), P(a0[0], a0[1], 1), P(b0[0], b0[1], 1), P(b0[0], b0[1], -1)], ein, c, tag)
    quadN(out, [P(a1[0], a1[1], -1), P(a1[0], a1[1], 1), P(b1[0], b1[1], 1), P(b1[0], b1[1], -1)], [-ein[0], -ein[1], -ein[2]], c, tag)
  }
  const [e0, e1] = sections[sections.length - 1]
  const [f0, f1] = sections[sections.length - 2]
  quadN(out, [P(e0[0], e0[1], -1), P(e1[0], e1[1], -1), P(e1[0], e1[1], 1), P(e0[0], e0[1], 1)], [(e0[0] - f0[0]) * dx, e0[1] - f0[1] + (e1[1] - f1[1]), (e0[0] - f0[0]) * dz], c, tag)
}

/** points spaced equally by arc length round a superellipse: their polar angles */
export function evenly(s: Sup, n: number, phase = 0): number[] {
  const K = 720
  const cum: number[] = [0]
  let prev = supAt(s, 0, 0)
  for (let i = 1; i <= K; i++) {
    const p = supAt(s, (i / K) * Math.PI * 2, 0)
    cum.push(cum[i - 1] + Math.hypot(p[0] - prev[0], p[2] - prev[2]))
    prev = p
  }
  const L = cum[K]
  const out: number[] = []
  let j = 0
  for (let k = 0; k < n; k++) {
    const want = (((k + phase) / n) % 1) * L
    while (j < K && cum[j + 1] < want) j++
    const f = (want - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j])
    out.push(((j + f) / K) * Math.PI * 2)
  }
  return out
}

/** the ground at the middle of the model above its base; half a metre where the loader did not measure it */
export const groundMid = (fit: Fit): number => fit.groundAt?.(0, 0) ?? 0.5

export const LINE: Rgb = [0.93, 0.94, 0.9]

/**
 * A football pitch: the grass of the playing area and its run-off out to `surround` (a superellipse, the foot of the
 * stands), mowed in stripes, with its lines and goals. `L` × `W` is the playing area (105 × 68 at the Parc).
 */
export function footballPitch(out: MeshBuilder, y: number, L: number, W: number, surround: Sup | null, o: { grass?: Rgb; track?: { inner: Sup; outer: Sup; colour: Rgb; lanes: number } } = {}): void {
  const G: Rgb = o.grass ?? [0.24, 0.45, 0.2]
  const G2: Rgb = [G[0] * 1.13, G[1] * 1.1, G[2] * 1.12]
  if (o.track) {
    // a running track round the pitch: the red band and its lane lines, and the grass infield inside it
    band(out, o.track.inner, y, o.track.outer, y, 'up', () => o.track!.colour, { segs: 72 })
    for (let k = 1; k < o.track.lanes; k++) {
      const f = k / o.track.lanes
      const mid = (s: number): Sup => ({ a: o.track!.inner.a + (o.track!.outer.a - o.track!.inner.a) * f + s, b: o.track!.inner.b + (o.track!.outer.b - o.track!.inner.b) * f + s, n: o.track!.inner.n })
      band(out, mid(-0.05), y + 0.02, mid(0.05), y + 0.02, 'up', () => LINE, { segs: 72 })
    }
    disc(out, o.track.inner, y, G, 48)
  }
  if (surround) {
    // the run-off: a ring from the playing area's corners out to the stands, in the darker green
    disc(out, surround, y - 0.01, G, 64)
  }
  // the playing area in mowing stripes across its length
  const N = 12
  for (let i = 0; i < N; i++) {
    const x0 = -L / 2 - 3 + ((L + 6) * i) / N
    const x1 = -L / 2 - 3 + ((L + 6) * (i + 1)) / N
    quadN(out, [[x0, y + 0.03, -W / 2 - 2.5], [x1, y + 0.03, -W / 2 - 2.5], [x1, y + 0.03, W / 2 + 2.5], [x0, y + 0.03, W / 2 + 2.5]], [0, 1, 0], i % 2 ? G : G2)
  }
  let lift = 0
  const line = (x0: number, z0: number, x1: number, z1: number): void => {
    box(out, (x0 + x1) / 2, y + 0.06 + (lift += 0.004), (z0 + z1) / 2, Math.max(0.07, Math.abs(x1 - x0) / 2), 0.01, Math.max(0.07, Math.abs(z1 - z0) / 2), LINE, FIXED)
  }
  const hl = L / 2
  const hw = W / 2
  line(-hl, -hw, hl, -hw); line(-hl, hw, hl, hw); line(-hl, -hw, -hl, hw); line(hl, -hw, hl, hw); line(0, -hw, 0, hw)
  for (const s of [-1, 1]) {
    line(s * hl, -20.16, s * (hl - 16.5), -20.16); line(s * hl, 20.16, s * (hl - 16.5), 20.16); line(s * (hl - 16.5), -20.16, s * (hl - 16.5), 20.16)
    line(s * hl, -9.16, s * (hl - 5.5), -9.16); line(s * hl, 9.16, s * (hl - 5.5), 9.16); line(s * (hl - 5.5), -9.16, s * (hl - 5.5), 9.16)
    // the goal: posts, bar and the net's back
    for (const g of [-3.66, 3.66]) box(out, s * hl, y + 1.22, g, 0.06, 1.22, 0.06, LINE, FIXED)
    box(out, s * hl, y + 2.44, 0, 0.06, 0.06, 3.72, LINE, FIXED)
    box(out, s * (hl + 1.5), y + 1.1, 0, 0.02, 1.1, 3.66, [0.8, 0.8, 0.78], FIXED)
  }
  // the centre circle
  const R = 9.15
  for (let i = 0; i < 32; i++) {
    const a0 = (i / 32) * Math.PI * 2
    const a1 = ((i + 1) / 32) * Math.PI * 2
    const yc = y + 0.13
    const p = (a: number, r: number): V3 => [Math.cos(a) * r, yc, Math.sin(a) * r]
    quadN(out, [p(a0, R - 0.06), p(a0, R + 0.06), p(a1, R + 0.06), p(a1, R - 0.06)], [0, 1, 0], LINE)
  }
}

export const CLAY: Rgb = [0.66, 0.3, 0.16]
export const CLAY_DK: Rgb = [0.58, 0.26, 0.14]

/**
 * A clay court: the ochre-red surround (`hx` × `hz`, half sizes, long axis x) with the doubles court's white lines
 * at its middle and the net across it, at (cx, cz) turned by `ang` (radians, anticlockwise seen from above).
 */
export function clayCourt(out: MeshBuilder, cx: number, cz: number, ang: number, y: number, hx: number, hz: number, o: { net?: boolean; brushed?: boolean } = {}): void {
  const c = Math.cos(ang)
  const s = Math.sin(ang)
  const P = (x: number, yy: number, z: number): V3 => [cx + x * c - z * s, yy, cz + x * s + z * c]
  const flat = (x0: number, z0: number, x1: number, z1: number, yy: number, col: Rgb): void =>
    quadN(out, [P(x0, yy, z0), P(x1, yy, z0), P(x1, yy, z1), P(x0, yy, z1)], [0, 1, 0], col)
  flat(-hx, -hz, hx, hz, y, CLAY)
  // the worn baseline areas a shade darker, where the players stand
  if (o.brushed !== false) for (const e of [-1, 1]) flat(e * 11.9 - 2.5, -4.6, e * 11.9 + 2.5, 4.6, y + 0.03, CLAY_DK)
  const L = 11.885
  const W = 5.485
  const S = 4.115
  const w = 0.05
  const line = (x0: number, z0: number, x1: number, z1: number): void => flat(Math.min(x0, x1) - w, Math.min(z0, z1) - w, Math.max(x0, x1) + w, Math.max(z0, z1) + w, y + 0.06, LINE)
  line(-L, -W, L, -W); line(-L, W, L, W); line(-L, -S, L, -S); line(-L, S, L, S)
  line(-L, -W, -L, W); line(L, -W, L, W)
  line(-6.4, -S, -6.4, S); line(6.4, -S, 6.4, S); line(-6.4, 0, 6.4, 0)
  if (o.net !== false) {
    const n0 = P(0, y, -W - 0.9)
    const n1 = P(0, y, W + 0.9)
    box(out, n0[0], y + 0.53, n0[2], 0.05, 0.53, 0.05, [0.2, 0.22, 0.2], FIXED)
    box(out, n1[0], y + 0.53, n1[2], 0.05, 0.53, 0.05, [0.2, 0.22, 0.2], FIXED)
    // the net as a dark band with its white tape, both faces
    for (const f of [-1, 1]) {
      quadN(out, [P(0.01 * f, y + 0.1, -W - 0.9), P(0.01 * f, y + 0.1, W + 0.9), P(0.01 * f, y + 0.9, W + 0.9), P(0.01 * f, y + 0.9, -W - 0.9)], [c * f, 0, s * f], [0.12, 0.13, 0.12])
      quadN(out, [P(0.012 * f, y + 0.86, -W - 0.9), P(0.012 * f, y + 0.86, W + 0.9), P(0.012 * f, y + 0.94, W + 0.9), P(0.012 * f, y + 0.94, -W - 0.9)], [c * f, 0, s * f], LINE)
    }
  }
}
