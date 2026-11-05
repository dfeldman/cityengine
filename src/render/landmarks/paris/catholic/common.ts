/**
 * Helpers the Paris Catholic church builders share: a church's own (u, v) frame turned AXIS_DEG from east, the
 * primitives drawn in it (prism, wall decal, arches, discs, cornice, gabled roof, gable end) over museums/enframe.ts.
 */
import type { Rgb } from '../../../models.ts'
import type { P2, V3 } from '../museums/enframe.ts'
import type { tools } from '../museums/enframe.ts'

export interface ChurchKitOpts {
  /** the nave's direction, degrees anticlockwise from east */
  axisDeg: number
  /** the primitives of museums/enframe.ts for this builder's frame */
  T: ReturnType<typeof tools>
  roofC: Rgb
  /** the default colour of gable ends and the cornice band */
  stone: Rgb
  trim: Rgb
  /** segments of `disc` (16 and 14 in the two first churches) */
  discN?: number
  /** the cornice's default depth and overhang */
  corniceH?: number
  corniceOut?: number
}

export function churchKit(o: ChurchKitOpts) {
  const { T, roofC, stone, trim } = o
  const A = (o.axisDeg * Math.PI) / 180, CA = Math.cos(A), SA = Math.sin(A)
  const en = (u: number, v: number): P2 => [u * CA - v * SA, u * SA + v * CA]
  const rect = (u0: number, u1: number, v0: number, v1: number): P2[] => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => en(u, v))
  const P = (u: number, v: number, h: number): V3 => { const [e, n] = en(u, v); return [e, n, h] }
  const solid = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, side: Rgb, top: Rgb | null = side, mottle = 3): void =>
    T.prism(rect(u0, u1, v0, v1), y0, y1, side, top, mottle)
  /** a flat shape standing on a wall: wall point (u, v), outward normal (nu, nv), points (t along the wall, height) */
  const decal = (u: number, v: number, nu: number, nv: number, off: number, pts: [number, number][], col: Rgb): void =>
    T.poly(pts.map(([t, y]) => P(u - nv * t + nu * off, v + nu * t + nv * off, y)), col, [...en(nu, nv), 0] as V3)
  /** a round-headed arch: width w, total height h */
  const round = (t: number, y0: number, w: number, h: number): [number, number][] => {
    const r = w / 2, ys = y0 + h - r, pts: [number, number][] = [[t - r, y0], [t + r, y0], [t + r, ys]]
    for (let i = 1; i < 8; i++) { const a = (i / 8) * Math.PI; pts.push([t + r * Math.cos(a), ys + r * Math.sin(a)]) }
    pts.push([t - r, ys])
    return pts
  }
  /** a pointed (lancet) arch: width w, total height h */
  const pointed = (t: number, y0: number, w: number, h: number): [number, number][] => {
    const r = w / 2, ys = y0 + h - r * 1.2, pts: [number, number][] = [[t - r, y0], [t + r, y0], [t + r, ys]]
    for (let i = 1; i < 5; i++) { const a = (i / 5) * (Math.PI / 2); pts.push([t + r - r * (1 - Math.cos(a)) * 1, ys + r * 1.2 * Math.sin(a) * 0.999]) }
    pts.push([t, y0 + h])
    for (let i = 4; i >= 1; i--) { const a = (i / 5) * (Math.PI / 2); pts.push([t - r + r * (1 - Math.cos(a)) * 1, ys + r * 1.2 * Math.sin(a) * 0.999]) }
    pts.push([t - r, ys])
    return pts
  }
  const N = o.discN ?? 16
  const disc = (t: number, y: number, r: number): [number, number][] => Array.from({ length: N }, (_, i) => [t + r * Math.cos((i / N) * Math.PI * 2), y + r * Math.sin((i / N) * Math.PI * 2)] as [number, number])
  const cornice = (u0: number, u1: number, v0: number, v1: number, y: number, h = o.corniceH ?? 0.7, out_ = o.corniceOut ?? 0.3): void =>
    solid(u0 - out_, u1 + out_, v0 - out_, v1 + out_, y - h, y, trim, trim, 0)
  /** a gabled roof, ridge along u (`along`='u') or v: eave edge at `c ± half`, rising to the ridge at c */
  const ridge = (along: 'u' | 'v', a0: number, a1: number, c: number, half: number, hE: number, hR: number, over = 0.4): void => {
    const q = (a: number, d: number, h: number): V3 => (along === 'u' ? P(a, c + d, h) : P(c + d, a, h))
    for (const s of [-1, 1]) T.poly([q(a0 - over, s * (half + over), hE - over * 0.8), q(a1 + over, s * (half + over), hE - over * 0.8), q(a1 + over, 0, hR), q(a0 - over, 0, hR)], roofC, [...(along === 'u' ? en(0, s) : en(s, 0)), 1] as V3)
  }
  const gable = (along: 'u' | 'v', a: number, c: number, half: number, hE: number, hR: number, outward: 1 | -1, col: Rgb = stone): void => {
    const q = (d: number, h: number): V3 => (along === 'u' ? P(c + d, a, h) : P(a, c + d, h))
    T.poly([q(-half, hE), q(half, hE), q(0, hR)], col, [...(along === 'u' ? en(0, outward) : en(outward, 0)), 0] as V3)
  }
  return { en, rect, P, solid, decal, round, pointed, disc, cornice, ridge, gable }
}
