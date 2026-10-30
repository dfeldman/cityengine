/**
 * The show kit: what the theatres, cinemas and music halls of this folder have that a palace has not. Their names on
 * their fronts, in tube and channel letters; marquees that bend; bands round a drum; and all of it lit after dark.
 *
 * The letters are drawn into the model rather than asked for with `sign()` (render/landmarks/signage.ts), for two
 * reasons particular to these fronts: `fitted()` hands on the geometry alone, so a sign asked for inside it is lost; and
 * half of these names go ROUND something (the Moulin Rouge's drum, the Rex's curved corner), which a flat quad cannot
 * do. A stroke alphabet is a few quads a letter, tagged EMIT where it is neon, and it scales with its model.
 *
 * Frames as everywhere in this folder: faces '-z' '+z' '-x' '+x', `plane` the face's coordinate, `t` along it.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { EMIT, FIXED, type Rgb } from '../../../models.ts'
import type { F } from './common.ts'

export { EMIT }

type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** Strokes of each capital on a grid 4 wide, 6 tall. */
const GLYPH: Record<string, number[][]> = {
  A: [[0, 0, 0, 4.6, 1, 6, 3, 6, 4, 4.6, 4, 0], [0, 2.4, 4, 2.4]],
  B: [[0, 0, 0, 6, 3, 6, 4, 5.2, 4, 4, 3, 3.2, 0, 3.2], [3, 3.2, 4, 2.4, 4, 0.8, 3, 0, 0, 0]],
  C: [[4, 4.9, 3, 6, 1, 6, 0, 4.9, 0, 1.1, 1, 0, 3, 0, 4, 1.1]],
  D: [[0, 0, 0, 6, 2.6, 6, 4, 4.6, 4, 1.4, 2.6, 0, 0, 0]],
  E: [[4, 6, 0, 6, 0, 0, 4, 0], [0, 3.2, 3, 3.2]],
  F: [[4, 6, 0, 6, 0, 0], [0, 3.2, 3, 3.2]],
  G: [[4, 4.9, 3, 6, 1, 6, 0, 4.9, 0, 1.1, 1, 0, 3, 0, 4, 1.1, 4, 2.8, 2.2, 2.8]],
  H: [[0, 0, 0, 6], [4, 0, 4, 6], [0, 3.2, 4, 3.2]],
  I: [[2, 0, 2, 6]],
  J: [[4, 6, 4, 1, 3, 0, 1, 0, 0, 1]],
  K: [[0, 0, 0, 6], [4, 6, 0, 2.4], [1.3, 3.6, 4, 0]],
  L: [[0, 6, 0, 0, 4, 0]],
  M: [[0, 0, 0, 6, 2, 2.2, 4, 6, 4, 0]],
  N: [[0, 0, 0, 6, 4, 0, 4, 6]],
  O: [[1, 0, 0, 1.1, 0, 4.9, 1, 6, 3, 6, 4, 4.9, 4, 1.1, 3, 0, 1, 0]],
  P: [[0, 0, 0, 6, 3, 6, 4, 5.1, 4, 3.5, 3, 2.6, 0, 2.6]],
  Q: [[1, 0, 0, 1.1, 0, 4.9, 1, 6, 3, 6, 4, 4.9, 4, 1.1, 3, 0, 1, 0], [2.4, 1.6, 4, 0]],
  R: [[0, 0, 0, 6, 3, 6, 4, 5.1, 4, 3.5, 3, 2.6, 0, 2.6], [1.9, 2.6, 4, 0]],
  S: [[4, 4.9, 3, 6, 1, 6, 0, 4.9, 0, 4, 1, 3.1, 3, 2.9, 4, 2, 4, 1.1, 3, 0, 1, 0, 0, 1.1]],
  T: [[0, 6, 4, 6], [2, 6, 2, 0]],
  U: [[0, 6, 0, 1.1, 1, 0, 3, 0, 4, 1.1, 4, 6]],
  V: [[0, 6, 2, 0, 4, 6]],
  W: [[0, 6, 1, 0, 2, 3.6, 3, 0, 4, 6]],
  X: [[0, 0, 4, 6], [0, 6, 4, 0]],
  Y: [[0, 6, 2, 3, 4, 6], [2, 3, 2, 0]],
  Z: [[0, 6, 4, 6, 0, 0, 4, 0]],
  0: [[1, 0, 0, 1.1, 0, 4.9, 1, 6, 3, 6, 4, 4.9, 4, 1.1, 3, 0, 1, 0]],
  1: [[0.8, 4.8, 2.2, 6, 2.2, 0]],
  2: [[0, 4.9, 1, 6, 3, 6, 4, 4.9, 4, 3.8, 0, 0, 4, 0]],
  3: [[0, 4.9, 1, 6, 3, 6, 4, 4.9, 4, 4, 3, 3.2, 1.6, 3.2], [3, 3.2, 4, 2.4, 4, 1.1, 3, 0, 1, 0, 0, 1.1]],
  4: [[3.2, 0, 3.2, 6, 0, 1.8, 4, 1.8]],
  5: [[4, 6, 0.4, 6, 0, 3.2, 3, 3.4, 4, 2.4, 4, 1.1, 3, 0, 1, 0, 0, 1.1]],
  6: [[4, 4.9, 3, 6, 1, 6, 0, 4.9, 0, 1.1, 1, 0, 3, 0, 4, 1.1, 4, 2.2, 3, 3.2, 1, 3.2, 0, 2.2]],
  7: [[0, 6, 4, 6, 1.4, 0]],
  8: [[1, 3.2, 0, 4, 0, 4.9, 1, 6, 3, 6, 4, 4.9, 4, 4, 3, 3.2, 1, 3.2, 0, 2.3, 0, 1.1, 1, 0, 3, 0, 4, 1.1, 4, 2.3, 3, 3.2]],
  9: [[0, 1.1, 1, 0, 3, 0, 4, 1.1, 4, 4.9, 3, 6, 1, 6, 0, 4.9, 0, 3.8, 1, 2.8, 3, 2.8, 4, 3.8]],
  "'": [[2, 6, 2, 4.4]],
  '-': [[0.6, 3, 3.4, 3]],
  '.': [[2, 0, 2, 0.5]],
}

export interface LetterOpts {
  /** cap height, metres */
  h: number
  c: Rgb
  /** how wide a cap is against its height (default 0.62: 1 is square, 0.35 is the Moulin Rouge's tall tube letters) */
  wide?: number
  /** stroke thickness, metres (default h / 8) */
  th?: number
  /** the gap between letters, metres (default a quarter of the letter's width) */
  gap?: number
  /** FIXED by default; EMIT for neon */
  tag?: number
  /** how far proud of the surface (default 0.08) */
  d?: number
  /** also from behind, for letters that stand free against the sky */
  both?: boolean
}

const advance = (ch: string, o: LetterOpts): number => {
  const w = o.h * (o.wide ?? 0.62)
  const gap = o.gap ?? w * 0.25
  if (ch === ' ') return w * 0.75 + gap
  if (ch === 'I' || ch === "'" || ch === '.') return w * 0.4 + gap
  return w + gap
}

/** How long a word comes to on the wall, metres. */
export function lettersWidth(text: string, o: LetterOpts): number {
  let n = 0
  for (const ch of text) n += advance(ch, o)
  return n - (o.gap ?? o.h * (o.wide ?? 0.62) * 0.25)
}

/**
 * Letters laid out by `map`: (u along the line, v up from the base, d proud) to a point, and the outward normal at u.
 * The line is centred on u = 0.
 */
function lay(out: MeshBuilder, text: string, o: LetterOpts, map: (u: number, v: number, d: number) => V3, normal: (u: number) => V3): void {
  const w = o.h * (o.wide ?? 0.62)
  const th = o.th ?? o.h / 8
  const d = o.d ?? 0.08
  const tag = o.tag ?? FIXED
  let u = -lettersWidth(text, o) / 2
  for (const ch of text) {
    const strokes = GLYPH[ch]
    if (strokes) {
      const narrow = ch === 'I' || ch === "'" || ch === '.'
      const off = narrow ? -w * 0.5 + w * 0.2 : 0
      for (const s of strokes) {
        const m = s.length / 2
        const closed = m > 2 && s[0] === s[2 * m - 2] && s[1] === s[2 * m - 1]
        const pt = (i: number): [number, number] => [u + off + (s[2 * i] / 4) * w, (s[2 * i + 1] / 6) * o.h]
        // how far a stroke runs past its end to meet the next one: the mitre, nothing at a free end
        const mitre = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number => {
          const a0 = Math.atan2(by - ay, bx - ax)
          const a1 = Math.atan2(cy - by, cx - bx)
          let t = Math.abs(a1 - a0)
          if (t > Math.PI) t = 2 * Math.PI - t
          return (th / 2) * Math.min(1.5, Math.tan(t / 2))
        }
        for (let i = 0; i + 1 < m; i++) {
          const [ax, ay] = pt(i)
          const [bx, by] = pt(i + 1)
          const L = Math.hypot(bx - ax, by - ay) || 1
          const tx = (bx - ax) / L
          const ty = (by - ay) / L
          const before = i > 0 ? pt(i - 1) : closed ? pt(m - 2) : null
          const after = i + 2 < m ? pt(i + 2) : closed ? pt(1) : null
          const e0 = before ? mitre(before[0], before[1], ax, ay, bx, by) : 0
          const e1 = after ? mitre(ax, ay, bx, by, after[0], after[1]) : 0
          const a0 = ax - tx * e0
          const a1 = ay - ty * e0
          const b0 = bx + tx * e1
          const b1 = by + ty * e1
          const nx = -ty * th / 2
          const ny = tx * th / 2
          const q: [number, number][] = [[a0 - nx, a1 - ny], [b0 - nx, b1 - ny], [b0 + nx, b1 + ny], [a0 + nx, a1 + ny]]
          const n = normal((a0 + b0) / 2)
          out.quad(q.map(([x, y]) => map(x, y, d)), n, UV, o.c, tag)
          if (o.both) out.quad(q.map(([x, y]) => map(x, y, d)), [-n[0], -n[1], -n[2]], UV, o.c, tag)
        }
      }
    }
    u += advance(ch, o)
  }
}

/** A name on a flat face, centred at t, its feet at y. It reads the right way round from in front of that face. */
export function lettersOn(out: MeshBuilder, f: F, plane: number, t: number, y: number, text: string, o: LetterOpts): void {
  const map = (u: number, v: number, d: number): V3 => {
    switch (f) {
      case '-z': return [t + u, y + v, plane - d]
      case '+z': return [t - u, y + v, plane + d]
      case '-x': return [plane - d, y + v, t - u]
      default: return [plane + d, y + v, t + u]
    }
  }
  const n: V3 = f === '-z' ? [0, 0, -1] : f === '+z' ? [0, 0, 1] : f === '-x' ? [-1, 0, 0] : [1, 0, 0]
  lay(out, text, o, map, () => n)
}

/**
 * The point on an ellipse round (cx, cz) at angle `a` from its front: a = 0 is its −z vertex, positive toward +x.
 * Everything that bends in this folder goes round this.
 */
export const onRound = (cx: number, cz: number, rx: number, rz: number, a: number): [number, number] => [cx + Math.sin(a) * rx, cz - Math.cos(a) * rz]
const roundNormal = (rx: number, rz: number, a: number): V3 => {
  const nx = Math.sin(a) / rx
  const nz = -Math.cos(a) / rz
  const l = Math.hypot(nx, nz) || 1
  return [nx / l, 0, nz / l]
}

/** A name round an ellipse, centred on angle `at`, its feet at y, reading from outside. */
export function lettersRound(out: MeshBuilder, cx: number, cz: number, rx: number, rz: number, at: number, y: number, text: string, o: LetterOpts): void {
  // arc length to angle by a table: the ellipse's speed changes round it
  const N = 200
  const table: number[] = [0]
  const A = (i: number): number => -Math.PI + (i / N) * 2 * Math.PI
  for (let i = 1; i <= N; i++) {
    const [a, b] = onRound(0, 0, rx, rz, A(i - 1))
    const [c, e] = onRound(0, 0, rx, rz, A(i))
    table.push(table[i - 1] + Math.hypot(c - a, e - b))
  }
  const s0 = table[Math.round(((at + Math.PI) / (2 * Math.PI)) * N)]
  const angle = (u: number): number => {
    const s = s0 + u
    let i = 1
    while (i < N && table[i] < s) i++
    const f = (s - table[i - 1]) / Math.max(1e-6, table[i] - table[i - 1])
    return A(i - 1) + (f * 2 * Math.PI) / N
  }
  const map = (u: number, v: number, d: number): V3 => {
    const a = angle(u)
    const [x, z] = onRound(cx, cz, rx, rz, a)
    const n = roundNormal(rx, rz, a)
    return [x + n[0] * d, y + v, z + n[2] * d]
  }
  lay(out, text, o, map, (u) => roundNormal(rx, rz, angle(u)))
}

/** A wall on an ellipse from angle a0 to a1, y0 to y1, facing out; `y1` may stand further out than `y0` by `flare`. */
export function bandRound(out: MeshBuilder, cx: number, cz: number, rx: number, rz: number, a0: number, a1: number, y0: number, y1: number, c: Rgb,
  o: { segs?: number; tag?: number; flare?: number } = {}): void {
  const segs = o.segs ?? 10
  const flare = o.flare ?? 0
  for (let i = 0; i < segs; i++) {
    const p = a0 + ((a1 - a0) * i) / segs
    const q = a0 + ((a1 - a0) * (i + 1)) / segs
    const [ax, az] = onRound(cx, cz, rx, rz, p)
    const [bx, bz] = onRound(cx, cz, rx, rz, q)
    const [ax1, az1] = onRound(cx, cz, rx + flare, rz + flare, p)
    const [bx1, bz1] = onRound(cx, cz, rx + flare, rz + flare, q)
    const n = roundNormal(rx, rz, (p + q) / 2)
    out.quad([[ax, y0, az], [bx, y0, bz], [bx1, y1, bz1], [ax1, y1, az1]], n, UV, c, o.tag ?? FIXED)
  }
}

/** The flat top or soffit of an ellipse's slice from a0 to a1: a fan from its centre. */
export function capRound(out: MeshBuilder, cx: number, cz: number, rx: number, rz: number, a0: number, a1: number, y: number, c: Rgb, up = true, segs = 10): void {
  for (let i = 0; i < segs; i++) {
    const [ax, az] = onRound(cx, cz, rx, rz, a0 + ((a1 - a0) * i) / segs)
    const [bx, bz] = onRound(cx, cz, rx, rz, a0 + ((a1 - a0) * (i + 1)) / segs)
    out.quad([[cx, y, cz], [ax, y, az], [bx, y, bz], [cx, y, cz]], [0, up ? 1 : -1, 0], UV, c, FIXED)
  }
}

/** A flat rectangle on a face, that glows after dark: a lit fascia, a neon line. */
export function litOn(out: MeshBuilder, f: F, plane: number, t0: number, t1: number, y0: number, y1: number, c: Rgb, d = 0.08): void {
  const P = (t: number, y: number): V3 => {
    switch (f) {
      case '-z': return [t, y, plane - d]
      case '+z': return [t, y, plane + d]
      case '-x': return [plane - d, y, t]
      default: return [plane + d, y, t]
    }
  }
  const n: V3 = f === '-z' ? [0, 0, -1] : f === '+z' ? [0, 0, 1] : f === '-x' ? [-1, 0, 0] : [1, 0, 0]
  out.quad([P(t0, y0), P(t1, y0), P(t1, y1), P(t0, y1)], n, UV, c, EMIT)
}

/** A round disc on a −z face, at (x, y), `z` its plane. */
export function discFront(out: MeshBuilder, x: number, y: number, z: number, r: number, c: Rgb, tag = FIXED, n = 14): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const b = ((i + 1) / n) * Math.PI * 2
    out.quad([[x, y, z], [x + Math.cos(a) * r, y + Math.sin(a) * r, z], [x + Math.cos(b) * r, y + Math.sin(b) * r, z], [x, y, z]], [0, 0, -1], UV, c, tag)
  }
}

/**
 * A name along a wall in any direction, a to b, centred `at` metres from a, its feet at y: for the walls of a plan that are
 * not square to the frame. It reads the right way round from outside a wall whose outward normal is (tz, −tx).
 */
export function lettersAlong(out: MeshBuilder, a: { x: number; z: number }, b: { x: number; z: number }, at: number, y: number, text: string, o: LetterOpts): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const n: V3 = [tz, 0, -tx]
  lay(out, text, o, (u, v, d) => [a.x + tx * (at + u) + n[0] * d, y + v, a.z + tz * (at + u) + n[2] * d], () => n)
}
