/**
 * Dressing on ANY edge of a plan: common.ts's rectOn and its fellows work on the axis-aligned faces of a builder's frame,
 * and the halls and department stores of this folder have street walls that are not (the Poste du Louvre's cut corner,
 * the Palais de la Femme's on its crossing). A `Wall` is the same small vocabulary on the edge a→b, the outward normal the
 * `edgeAt` one (a→b in the order of an anticlockwise ring): `u` metres along from a, which is the viewer's left, `y` up,
 * `d` out.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { boxAlong, edgeAt } from '../../parts.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type P2 = { x: number; z: number }

export interface Wall {
  L: number
  /** the point `u` along it, `d` out */
  at(u: number, d: number): P2
  /** a flat rectangle */
  rect(u0: number, u1: number, y0: number, y1: number, c: Rgb, d?: number): void
  /** a round-headed opening: `h` from y0 to the crown, flat `d` out */
  arch(u: number, y0: number, w: number, h: number, c: Rgb, d?: number): void
  /** a disc, as a fan */
  disc(u: number, y: number, r: number, c: Rgb, d?: number): void
  /** a box out of the wall: from `back` behind it to `d` out */
  slab(u0: number, u1: number, y0: number, y1: number, d: number, c: Rgb, back?: number): void
  /** a triangular pediment `h` high over u0..u1, its raking tops running back `d` */
  ped(u0: number, u1: number, y0: number, h: number, d: number, c: Rgb): void
  /** a run of real arches, see `ArchRun` */
  arches(u0: number, u1: number, n: number, o: ArchRun): void
}

/**
 * An arcade with depth, which a flat dark arch on a wall has not: the piers and the spandrels in the plane `front` metres
 * out, the jambs and the soffit running back to the void at `back`. About 60 triangles a bay.
 */
export interface ArchRun {
  y0: number
  /** the springing, and the head of the wall over the arches */
  spring: number
  top: number
  /** the opening's share of a bay (default 0.72) */
  open?: number
  front: number
  back: number
  stone: Rgb
  /** the jambs and soffit (default the stone, darkened) */
  reveal?: Rgb
  void: Rgb
}

export function wallOn(out: MeshBuilder, a: P2, b: P2): Wall {
  const e = edgeAt([a, b], 0)
  const n: [number, number, number] = [e.nx, 0, e.nz]
  const P = (u: number, y: number, d: number): [number, number, number] => [a.x + e.tx * u + e.nx * d, y, a.z + e.tz * u + e.nz * d]
  const rect: Wall['rect'] = (u0, u1, y0, y1, c, d = 0.06) => out.quad([P(u0, y0, d), P(u1, y0, d), P(u1, y1, d), P(u0, y1, d)], n, UV, c, FIXED)
  return {
    L: e.L,
    at: (u, d) => { const p = P(u, 0, d); return { x: p[0], z: p[2] } },
    rect,
    arch(u, y0, w, h, c, d = 0.07) {
      const r = w / 2
      const spring = y0 + Math.max(0, h - r)
      rect(u - r, u + r, y0, spring, c, d)
      const k = Math.max(7, Math.ceil(w * 1.6))
      for (let i = 0; i < k; i++) {
        const a0 = (i / k) * Math.PI
        const a1 = ((i + 1) / k) * Math.PI
        out.quad([P(u, spring, d), P(u + Math.cos(a0) * r, spring + Math.sin(a0) * r, d), P(u + Math.cos(a1) * r, spring + Math.sin(a1) * r, d), P(u, spring, d)], n, UV, c, FIXED)
      }
    },
    disc(u, y, r, c, d = 0.07) {
      const k = 14
      for (let i = 0; i < k; i++) {
        const a0 = (i / k) * 2 * Math.PI
        const a1 = ((i + 1) / k) * 2 * Math.PI
        out.quad([P(u, y, d), P(u + Math.cos(a0) * r, y + Math.sin(a0) * r, d), P(u + Math.cos(a1) * r, y + Math.sin(a1) * r, d), P(u, y, d)], n, UV, c, FIXED)
      }
    },
    slab(u0, u1, y0, y1, d, c, back = 0) {
      const m = P((u0 + u1) / 2, (y0 + y1) / 2, (d - back) / 2)
      boxAlong(out, m[0], m[1], m[2], (u1 - u0) / 2, (y1 - y0) / 2, (d + back) / 2, e.heading, c)
    },
    arches(u0, u1, count, o) {
      const bay = (u1 - u0) / count
      const r = (bay * (o.open ?? 0.72)) / 2
      const reveal = o.reveal ?? [o.stone[0] * 0.72, o.stone[1] * 0.72, o.stone[2] * 0.72] as Rgb
      const k = 8
      for (let i = 0; i < count; i++) {
        const c = u0 + bay * (i + 0.5)
        rect(c - bay / 2, c - r, o.y0, o.top, o.stone, o.front)
        rect(c + r, c + bay / 2, o.y0, o.top, o.stone, o.front)
        rect(c - r, c + r, o.y0, o.top, o.void, o.back)
        for (const s of [-1, 1]) {
          out.quad([P(c + s * r, o.y0, o.front), P(c + s * r, o.spring, o.front), P(c + s * r, o.spring, o.back), P(c + s * r, o.y0, o.back)],
            [-s * e.tx, 0, -s * e.tz], UV, reveal, FIXED)
        }
        for (let j = 0; j < k; j++) {
          const a0 = Math.PI * (1 - j / k)
          const a1 = Math.PI * (1 - (j + 1) / k)
          const u = (a: number): number => c + Math.cos(a) * r
          const y = (a: number): number => o.spring + Math.sin(a) * r
          out.quad([P(u(a0), y(a0), o.front), P(u(a1), y(a1), o.front), P(u(a1), o.top, o.front), P(u(a0), o.top, o.front)], n, UV, o.stone, FIXED)
          const am = (a0 + a1) / 2
          out.quad([P(u(a0), y(a0), o.front), P(u(a1), y(a1), o.front), P(u(a1), y(a1), o.back), P(u(a0), y(a0), o.back)],
            [-Math.cos(am) * e.tx, -Math.sin(am), -Math.cos(am) * e.tz], UV, reveal, FIXED)
        }
      }
    },
    ped(u0, u1, y0, h, d, c) {
      const m = (u0 + u1) / 2
      out.quad([P(u0, y0, d), P(u1, y0, d), P(m, y0 + h, d), P(m, y0 + h, d)], n, UV, c, FIXED)
      const run = Math.hypot((u1 - u0) / 2, h) || 1
      const up = ((u1 - u0) / 2) / run
      const side = h / run
      for (const [ua, ub, s] of [[u0, m, -1], [u1, m, 1]] as const) {
        out.quad([P(ua, y0, d), P(ub, y0 + h, d), P(ub, y0 + h, 0), P(ua, y0, 0)], [e.tx * s * side, up, e.tz * s * side], UV, c, FIXED)
      }
    },
  }
}

/** The bays of a wall: `n` of about `bay` metres between `margin`s, as their middles, and the step. */
export function baysOf(L: number, bay: number, margin = 0.6): { mids: number[]; step: number } {
  const n = Math.max(1, Math.round((L - 2 * margin) / bay))
  const step = (L - 2 * margin) / n
  return { mids: Array.from({ length: n }, (_, i) => margin + step * (i + 0.5)), step }
}
