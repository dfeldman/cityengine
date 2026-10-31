/**
 * Figures in stone (2026-10-30), for the Arc de Triomphe's groups and whatever else in Paris stands out of its wall as people: a
 * RELIEF is a frame on a wall, u along it to the viewer's right, v up, w out of the wall, and a figure is its joints in that frame.
 * Read off a photograph, the joints are what makes Rude's Marseillaise that group and not any other: nothing here is more than
 * tubes, lumps, pleated sheets and fans of feathers, but they stand where the sculptor's limbs stand.
 *
 * The frame faces local −z, as every builder here is drawn (render/landmarks/kit.ts): u = x, w = −z. A stone figure on a stone wall
 * has nothing but its shading to tell it from the wall and there are no cast shadows here, so colour darkens toward the wall
 * (`tone`): the deep folds and the gaps between the limbs are in shadow, as they are in the photographs.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Rgb } from '../../kit.ts'

export type V = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const add = (a: V, b: V, k = 1): V => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]
const len = (a: V): number => Math.hypot(a[0], a[1], a[2])
const unit = (a: V): V => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const lerp = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export class Relief {
  /** plain stone, not the dressed courses the material cuts into a pale wall: a limb has no mortar joints */
  private readonly tag = surfaceTag('stucco')
  constructor(
    private readonly out: MeshBuilder,
    /** the point of the wall that is the frame's origin */
    private readonly ox: number, private readonly oy: number, private readonly oz: number,
    private readonly stone: Rgb,
    /** how far out of the wall the shading has reached the stone's own colour */
    private readonly deep = 1.5,
    /** a mirrored copy: u runs to the viewer's left */
    private readonly flip = false,
  ) {}

  private w(p: V): V { return [this.ox + (this.flip ? -p[0] : p[0]), this.oy + p[1], this.oz - p[2]] }
  /**
   * The normal, leant out of the wall. A relief is lit as a relief: its turning-away is a matter of degree, and on the true normals the
   * material's hard sun band left half of every torso black.
   */
  private n(p: V): V { const q = unit([p[0], p[1], p[2] + 0.75]); return [this.flip ? -q[0] : q[0], q[1], -q[2]] }
  /** the stone at this depth */
  tone(d: number): Rgb {
    const k = 0.74 + 0.26 * Math.min(1, Math.max(0, d / this.deep))
    return [this.stone[0] * k, this.stone[1] * k, this.stone[2] * k]
  }
  /** one four-cornered face, its normal given in the frame */
  face(a: V, b: V, c: V, d: V, n: V, col?: Rgb): void {
    const depth = (a[2] + b[2] + c[2] + d[2]) / 4
    this.out.quad([this.w(a), this.w(b), this.w(c), this.w(d)], unit(this.n(unit(n))), UV, col ?? this.tone(depth), this.tag)
  }
  /**
   * The same with a normal at each corner, so the light rolls round a limb: the material's sun is a hard band on the interpolated normal,
   * which on a rounded limb is a clean drawn terminator, where flat facets broke a figure into shards.
   */
  round(a: V, b: V, c: V, d: V, na: V, nb: V, nc: V, nd: V, col?: Rgb): void {
    const depth = (a[2] + b[2] + c[2] + d[2]) / 4
    const tint = col ?? this.tone(depth)
    const o = this.out
    const base = o.positions.length / 3
    const P = [this.w(a), this.w(b), this.w(c), this.w(d)]
    const N = [na, nb, nc, nd].map((n) => unit(this.n(unit(n))))
    for (let i = 0; i < 4; i++) {
      o.positions.push(P[i][0], P[i][1], P[i][2])
      o.normals.push(N[i][0], N[i][1], N[i][2])
      o.uvs.push(UV[i][0], UV[i][1])
      o.colors.push(tint[0], tint[1], tint[2], this.tag)
    }
    // wound to face its normal, as MeshBuilder.quad does
    const e1 = sub(P[1], P[0]), e2 = sub(P[2], P[0])
    const f = cross(e1, e2)
    const m: V = [N[0][0] + N[2][0], N[0][1] + N[2][1], N[0][2] + N[2][2]]
    if (f[0] * m[0] + f[1] * m[1] + f[2] * m[2] > 0) o.indices.push(base, base + 2, base + 1, base, base + 3, base + 2)
    else o.indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
  /**
   * A tube from a to b, radius ra to rb, its section squashed to `flat` across the wall (a limb in relief is wider than it is deep).
   * `sides` faces; `half` draws only those that look out of the wall, for the small figures of a frieze.
   */
  tube(a: V, b: V, ra: number, rb: number, sides = 6, flat = 0.85, half = false): void {
    const ax = unit(sub(b, a))
    // across the limb in the plane of the wall, and out of the wall
    let across = cross(ax, [0, 0, 1])
    if (len(across) < 1e-3) across = [1, 0, 0]
    across = unit(across)
    const outw = unit(cross(across, ax))
    const dir: V = outw[2] < 0 ? [-outw[0], -outw[1], -outw[2]] : outw
    const P = (c: V, r: number, t: number): V => add(add(c, across, Math.cos(t) * r), dir, Math.sin(t) * r * flat)
    const t0 = half ? 0 : 0
    const dt = (half ? Math.PI : Math.PI * 2) / sides
    for (let i = 0; i < sides; i++) {
      const s = t0 + i * dt, e = s + dt
      const ns = add(add([0, 0, 0], across, Math.cos(s)), dir, Math.sin(s))
      const ne = add(add([0, 0, 0], across, Math.cos(e)), dir, Math.sin(e))
      this.round(P(a, ra, s), P(a, ra, e), P(b, rb, e), P(b, rb, s), ns, ne, ne, ns)
    }
  }
  /** a lump: an ellipsoid, n faces round and three bands up; its back, against the wall, is left off when `half` */
  lump(c: V, rx: number, ry = rx, rw = rx, n = 6, half = true, bands = 3): void {
    for (let j = 0; j < bands; j++) {
      const p0 = -Math.PI / 2 + (j / bands) * Math.PI, p1 = -Math.PI / 2 + ((j + 1) / bands) * Math.PI
      const span = half ? Math.PI : Math.PI * 2
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * span, a1 = ((i + 1) / n) * span
        const Q = (p: number, a: number): V => [c[0] + Math.cos(p) * Math.cos(a) * rx, c[1] + Math.sin(p) * ry, c[2] + Math.cos(p) * Math.sin(a) * rw]
        const N = (p: number, a: number): V => [Math.cos(p) * Math.cos(a) / rx, Math.sin(p) / ry, Math.cos(p) * Math.sin(a) / rw]
        this.round(Q(p0, a0), Q(p0, a1), Q(p1, a1), Q(p1, a0), N(p0, a0), N(p0, a1), N(p1, a1), N(p1, a0))
      }
    }
  }
  /** a thick body lofted through rings: each ring a centre and its half-widths across and out; for a torso, a skirt, a horse's barrel */
  loft(rings: { c: V; rx: number; rw: number }[], sides = 8): void {
    for (let k = 0; k + 1 < rings.length; k++) {
      const a = rings[k], b = rings[k + 1]
      const ax = unit(sub(b.c, a.c))
      let across = cross(ax, [0, 0, 1])
      if (len(across) < 1e-3) across = [1, 0, 0]
      across = unit(across)
      const dir: V = [0, 0, 1]
      const P = (r: typeof a, t: number): V => add(add(r.c, across, Math.cos(t) * r.rx), dir, Math.sin(t) * r.rw)
      for (let i = 0; i < sides; i++) {
        const s = (i / sides) * Math.PI, e = ((i + 1) / sides) * Math.PI
        const ns = add(add([0, 0, 0], across, Math.cos(s)), dir, Math.sin(s))
        const ne = add(add([0, 0, 0], across, Math.cos(e)), dir, Math.sin(e))
        this.round(P(a, s), P(a, e), P(b, e), P(b, s), ns, ne, ne, ns)
      }
    }
  }
  /**
   * Cloth: a sheet along the polyline, `widths` its half-width at each point, in `folds` pleats across that stand out and fall back by
   * `fold`. Flat-shaded, the pleats are what reads as drapery from the street.
   */
  drape(line: V[], widths: number[], fold = 0.22, folds = 4): void {
    const across = (i: number): V => {
      const p = line[Math.max(0, i - 1)], q = line[Math.min(line.length - 1, i + 1)]
      const t = sub(q, p)
      return unit([-t[1], t[0], 0])
    }
    for (let i = 0; i + 1 < line.length; i++) {
      const A = across(i), B = across(i + 1)
      for (let k = 0; k < folds; k++) {
        const u0 = (k / folds) * 2 - 1, u1 = ((k + 1) / folds) * 2 - 1
        const dw = (j: number): number => (j % 2 ? fold : 0)
        const a0 = add(add(line[i], A, u0 * widths[i]), [0, 0, 1], dw(k))
        const a1 = add(add(line[i], A, u1 * widths[i]), [0, 0, 1], dw(k + 1))
        const b0 = add(add(line[i + 1], B, u0 * widths[i + 1]), [0, 0, 1], dw(k))
        const b1 = add(add(line[i + 1], B, u1 * widths[i + 1]), [0, 0, 1], dw(k + 1))
        const n = cross(sub(a1, a0), sub(b0, a0))
        this.face(a0, a1, b1, b0, n[2] < 0 ? [-n[0], -n[1], -n[2]] : n)
      }
    }
  }
  /** a slim flat leaf or feather from a to b, widest `r`, tilted so it catches the light */
  blade(a: V, b: V, r: number, tilt = 0.12): void {
    const t = sub(b, a)
    const A = unit([-t[1], t[0], 0])
    const m = lerp(a, b, 0.45)
    const l = add(m, A, r), rr = add(m, A, -r)
    const lift: V = [0, 0, tilt]
    this.face(a, add(l, lift), add(b, lift, 0.5), add(b, lift, 0.5), [A[0] * 0.3, A[1] * 0.3, 1])
    this.face(a, add(b, lift, 0.5), add(b, lift, 0.5), add(rr, [0, 0, -tilt * 0.4]), [-A[0] * 0.3, -A[1] * 0.3, 1])
  }
  /**
   * A wing: its bone from the shoulder out along bearing `a1` (radians, 0 = viewer's right, π/2 up), the feathers hanging from the bone, those
   * at the tip carrying on along it and those at the shoulder falling along `a0`. A thick leading edge, a sheet under the feathers.
   */
  wing(root: V, a0: number, a1: number, length: number, n = 9): void {
    const tip: V = [root[0] + Math.cos(a1) * length * 0.8, root[1] + Math.sin(a1) * length * 0.8, Math.max(0.1, root[2] - 0.3)]
    const bend = (a1 - a0 > 0 ? 1 : -1) * length * 0.16
    const elbow: V = add(lerp(root, tip, 0.5), [-Math.sin(a1) * bend, Math.cos(a1) * bend, 0.05])
    const bone = (t: number): V => lerp(lerp(root, elbow, t), lerp(elbow, tip, t), t)
    const feather = (i: number): [V, V] => {
      const t = i / (n - 1)
      const a = a0 + (a1 - a0) * t
      const b = bone(t)
      const L = length * (0.42 + 0.42 * Math.sin(t * Math.PI * 0.62 + 0.55)) * (i === n - 1 ? 0.5 : 1)
      return [b, [b[0] + Math.cos(a) * L, b[1] + Math.sin(a) * L, Math.max(0.1, b[2] - 0.25)]]
    }
    for (let i = 0; i + 1 < n; i++) {
      const [b0, t0] = feather(i), [b1, t1] = feather(i + 1)
      this.face(b0, b1, t1, t0, [0, 0, 1], this.tone(0.5 + (i % 2) * 0.35))
      this.blade(b0, add(t0, [0, 0, 0.1]), length * 0.075, 0.1)
    }
    for (let i = 0; i < 4; i++) this.tube(bone(i / 4), bone((i + 1) / 4), length * (0.13 - i * 0.02), length * (0.11 - i * 0.02), 4)
  }
  /** a round boss on the wall: a bevelled ring and a flat field. A shield, a rosette */
  disc(c: V, r: number, h: number, n = 10): void {
    const P = (a: number, rr: number, w: number): V => [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr, c[2] + w]
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, m = (a0 + a1) / 2
      this.face(P(a0, r, 0), P(a1, r, 0), P(a1, r * 0.82, h), P(a0, r * 0.82, h), [Math.cos(m) * 0.7, Math.sin(m) * 0.7, 1])
      this.face(P(a0, r * 0.82, h), P(a1, r * 0.82, h), P(a1, r * 0.66, h * 0.7), P(a0, r * 0.66, h * 0.7), [-Math.cos(m) * 0.4, -Math.sin(m) * 0.4, 1])
      this.face(P(a0, r * 0.66, h * 0.7), P(a1, r * 0.66, h * 0.7), [c[0], c[1], c[2] + h * 0.9], [c[0], c[1], c[2] + h * 0.9], [0, 0, 1])
    }
  }
  /** a palm or a sheaf of wheat: blades fanned from a point, for the trophies behind the Triomphe and the Paix's wheat */
  fan(root: V, a0: number, a1: number, length: number, n = 7, width = 0.14): void {
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / Math.max(1, n - 1)
      const L = length * (0.8 + 0.2 * Math.sin(i * 2.3))
      this.blade(root, [root[0] + Math.cos(a) * L, root[1] + Math.sin(a) * L, root[2] * 0.7], width)
    }
  }
  /** the leafy crown of a tree in relief: the Paix's olive and oak */
  foliage(c: V, r: number, n = 9): void {
    for (let i = 0; i < n; i++) {
      const a = i * 2.399963
      const d = r * Math.sqrt((i + 0.5) / n)
      this.lump([c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d, c[2] + 0.06 * (i % 3)], r * 0.4, r * 0.36, 0.3, 5)
    }
  }
}

/** A person's joints in a relief's frame. `k` is the figure's size: 1 is about the colossal 5.5 m of the Arc's groups. */
export interface Pose {
  hip: V; chest: V; head: V
  /** elbow and hand; the shoulders follow from the chest */
  armL?: [V, V]; armR?: [V, V]
  /** knee and foot */
  legL?: [V, V]; legR?: [V, V]
  k?: number
  /** a robe from the hip to these feet: a flared pleated skirt, for the draped figures */
  skirt?: { to: V; w: number }
  /** a helmet's crest, a mural crown: what makes this head somebody */
  helmet?: boolean
  coarse?: boolean
}

/**
 * A figure: a lofted torso, a head, tubes for the limbs, lumps at the joints that show. `coarse` for the battles of a panel, 30 m up: half
 * tubes and no joints. The proportions are the groups' own (measured off the Résistance: a head 1.15 m across, a chest 2.7 m, a thigh
 * 1.5 m, for a group of 12 m): they are colossal, and heavy, and a figure on these numbers read as a stick man until they said so.
 */
export function figure(r: Relief, p: Pose): void {
  const k = p.k ?? 1
  const c = p.coarse ?? false
  const up = unit(sub(p.chest, p.hip))
  const across = unit([up[1], -up[0], 0])
  const shoulder = (s: number): V => add(add(p.chest, across, s * 1.2 * k), up, 0.38 * k)
  // the torso: hips, waist, chest, shoulders
  r.loft(c ? [
    { c: p.hip, rx: 1.0 * k, rw: 0.66 * k },
    { c: p.chest, rx: 1.2 * k, rw: 0.7 * k },
    { c: add(p.chest, up, 0.72 * k), rx: 0.8 * k, rw: 0.5 * k },
  ] : [
    { c: add(p.hip, up, -0.42 * k), rx: 0.86 * k, rw: 0.56 * k },
    { c: p.hip, rx: 1.04 * k, rw: 0.7 * k },
    { c: lerp(p.hip, p.chest, 0.5), rx: 0.92 * k, rw: 0.64 * k },
    { c: p.chest, rx: 1.26 * k, rw: 0.76 * k },
    { c: add(p.chest, up, 0.7 * k), rx: 0.96 * k, rw: 0.56 * k },
  ], c ? 4 : 6)
  // the neck and head
  const nb = add(p.chest, up, 0.7 * k)
  if (!c) r.tube(nb, p.head, 0.36 * k, 0.32 * k, 4)
  r.lump(p.head, 0.54 * k, 0.66 * k, 0.56 * k, c ? 4 : 6, true, c ? 2 : 3)
  if (p.helmet) {
    r.lump(add(p.head, [0, 0.32 * k, 0]), 0.6 * k, 0.44 * k, 0.6 * k, c ? 3 : 5, true, 2)
    if (!c) r.blade(add(p.head, [0, 0.55 * k, 0.1]), add(p.head, [0, 1.75 * k, 0.1]), 0.34 * k, 0.1)
  }
  const T = (a: V, b: V, ra: number, rb: number): void => { if (c) r.tube(a, b, ra, rb, 3, 0.85, true); else r.tube(a, b, ra, rb, 5) }
  for (const [arm, s] of [[p.armL, -1], [p.armR, 1]] as const) {
    if (!arm) continue
    const sh = shoulder(s)
    if (!c) r.lump(sh, 0.46 * k, 0.46 * k, 0.44 * k, 4)
    T(sh, arm[0], 0.42 * k, 0.32 * k)
    T(arm[0], arm[1], 0.32 * k, 0.19 * k)
    if (!c) r.lump(arm[1], 0.24 * k, 0.24 * k, 0.2 * k, 3, true, 2)
  }
  for (const [leg, s] of [[p.legL, -1], [p.legR, 1]] as const) {
    if (!leg) continue
    const h = add(p.hip, across, s * 0.56 * k)
    T(h, leg[0], 0.7 * k, 0.44 * k)
    if (!c) r.lump(leg[0], 0.44 * k, 0.46 * k, 0.42 * k, 4)
    T(leg[0], leg[1], 0.44 * k, 0.22 * k)
    // the foot, lying along the plinth toward the viewer's side it steps to
    const dir = Math.sign(leg[1][0] - leg[0][0]) || s
    if (!c) r.tube(leg[1], add(leg[1], [dir * 0.8 * k, -0.08 * k, 0.2 * k]), 0.25 * k, 0.15 * k, 4)
  }
  if (p.skirt) {
    const t = p.skirt.to
    const m = lerp(p.hip, t, 0.55)
    r.drape([add(p.hip, up, 0.05), m, t], [1.04 * k, (1.04 * k + p.skirt.w) * 0.55, p.skirt.w], (c ? 0.2 : 0.34) * k, c ? 3 : 5)
  }
}

/** A horse or a bull in relief, from its rump, chest and head, its legs given as knee-and-hoof pairs. */
export function beast(r: Relief, o: { rump: V; chest: V; poll: V; muzzle: V; legs: [V, V, V][]; tail: V[]; girth?: number; bull?: boolean }): void {
  const g = o.girth ?? 1
  const mid = lerp(o.rump, o.chest, 0.5)
  r.loft([
    { c: add(o.rump, sub(o.rump, o.chest), 0.14), rx: 0.5 * g, rw: 0.45 * g },
    { c: o.rump, rx: 1.0 * g, rw: 0.6 * g },
    { c: mid, rx: 1.05 * g, rw: 0.68 * g },
    { c: o.chest, rx: 1.0 * g, rw: 0.62 * g },
    { c: add(o.chest, sub(o.chest, o.rump), 0.12), rx: 0.6 * g, rw: 0.45 * g },
  ], 6)
  r.tube(o.chest, o.poll, 0.86 * g, o.bull ? 0.66 * g : 0.44 * g, 5, 0.7)
  r.tube(o.poll, o.muzzle, o.bull ? 0.56 * g : 0.38 * g, o.bull ? 0.34 * g : 0.24 * g, 5, 0.8)
  for (const [hip, knee, hoof] of o.legs) {
    r.tube(hip, knee, 0.42 * g, 0.24 * g, 4)
    r.tube(knee, hoof, 0.22 * g, 0.15 * g, 4)
    r.lump(hoof, 0.24 * g, 0.2 * g, 0.2 * g, 3, true, 2)
  }
  if (o.tail.length > 1) r.drape(o.tail, o.tail.map((_, i) => 0.34 * (1 - (i / o.tail.length) * 0.5)), 0.14, 3)
}

/**
 * One small figure of a frieze or a panel, no more than a dozen faces a limb and half-tubes only: `pose` steps through a march so that a
 * line of them is an army and not a fence.
 */
export function smallFigure(r: Relief, u: number, v: number, h: number, pose: number, w = 0.05): void {
  const s = h / 6
  const lean = [0.25, 0.1, 0.35, -0.1][pose % 4] * s
  const hip: V = [u, v + 3.1 * s, w + 0.1 * s]
  const chest: V = [u + lean, v + 4.6 * s, w + 0.14 * s]
  const head: V = [u + lean * 1.3, v + 5.5 * s, w + 0.12 * s]
  const stride = [0.9, 0.6, 1.1, 0.4][pose % 4] * s
  r.tube(hip, chest, 0.8 * s, 0.95 * s, 3, 0.5, true)
  r.lump(head, 0.46 * s, 0.56 * s, 0.32 * s, 3, true, 2)
  r.tube(hip, [u + stride, v, w], 0.42 * s, 0.24 * s, 2, 0.6, true)
  r.tube(hip, [u - stride * 0.8, v, w], 0.42 * s, 0.24 * s, 2, 0.6, true)
  const hand: V = pose % 2 ? [u + 1.4 * s, v + 5.6 * s, w] : [u + 1.1 * s, v + 3.5 * s, w]
  r.tube(chest, hand, 0.3 * s, 0.17 * s, 2, 0.6, true)
}
