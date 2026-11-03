/**
 * PARIS'S CHILDREN'S CAROUSELS (owner, 2026-11-03: "around 15 small children's carousels… we have moving working carousels in
 * san francisco, we could copy that approach. the ones in paris are quite a bit smaller but still are interesting street
 * texture"): the manège of a square or a park, at the places OSM maps `attraction=carousel` (public/landmarks/paris/
 * carousels.json, made by tools/paris-carousels.ts).
 *
 * One deck, five to ten metres across: a low round base with its step and its little fence, the posts of the canopy, the
 * canopy itself — a peaked tent in its two colours over a rounding board of painted panels ringed with bulbs, a scalloped
 * valance — and, turning about the centre at a few turns a minute (MeshBuilder.rotors, as the Pier 39 carousel does), the deck
 * with its mirrored drum and its riders: horses on brass poles, and among them what a Paris manège carries for the small
 * ones — a car, an aeroplane, an elephant. The colours and the mix by the carousel's own place, so no two match.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, EMIT, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { horse, tube } from '../sf/wharf-carnival.ts'

type V3 = [number, number, number]
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** the canopy's two colours and the rounding board's panel, by seed */
const SCHEMES: [Rgb, Rgb, Rgb][] = [
  [[0.78, 0.16, 0.16], [0.96, 0.93, 0.86], [0.2, 0.36, 0.6]],
  [[0.16, 0.34, 0.66], [0.96, 0.94, 0.88], [0.8, 0.22, 0.2]],
  [[0.18, 0.44, 0.3], [0.92, 0.84, 0.55], [0.75, 0.2, 0.3]],
  [[0.86, 0.45, 0.6], [0.97, 0.95, 0.92], [0.3, 0.55, 0.75]],
  [[0.92, 0.72, 0.2], [0.96, 0.94, 0.9], [0.22, 0.4, 0.62]],
]

const hash = (seed: number, k: number): number => ((Math.imul((seed ^ Math.imul(k, 0x9e3779b1)) >>> 0, 0x85ebca6b) >>> 0) % 1000) / 1000

/** a child's car on the deck, nose along the way it turns (`a` from +x about the vertical), from (x, y, z) */
function car(mb: MeshBuilder, x: number, y: number, z: number, a: number, c: Rgb, tag: number): void {
  const cs = Math.cos(a), sn = Math.sin(a)
  const P = (u: number, v: number, w: number): V3 => [x + u * cs - w * sn, y + v, z + u * sn + w * cs]
  tube(mb, P(-0.45, 0.32, 0), P(0.45, 0.32, 0), 0.24, 8, c, tag, 0.2)
  tube(mb, P(-0.15, 0.55, 0), P(0.12, 0.55, 0), 0.16, 8, [0.15, 0.15, 0.16], tag, 0.14)      // the seat's back and the driver's space
  for (const [u, w] of [[-0.3, 0.24], [0.3, 0.24], [-0.3, -0.24], [0.3, -0.24]]) tube(mb, P(u, 0.13, w - 0.04), P(u, 0.13, w + 0.04), 0.13, 8, [0.1, 0.1, 0.1], tag)
  tube(mb, P(0.25, 0.55, 0), P(0.3, 0.75, 0), 0.02, 4, [0.85, 0.7, 0.3], tag)              // the steering wheel's column
}

/** an aeroplane on its pole: the fuselage, the wings, the tail, a propeller */
function plane(mb: MeshBuilder, x: number, y: number, z: number, a: number, c: Rgb, tag: number): void {
  const cs = Math.cos(a), sn = Math.sin(a)
  const P = (u: number, v: number, w: number): V3 => [x + u * cs - w * sn, y + v, z + u * sn + w * cs]
  tube(mb, P(-0.6, 0.9, 0), P(0.55, 0.95, 0), 0.2, 8, c, tag, 0.16)
  tube(mb, P(0.05, 0.88, -0.75), P(0.05, 0.88, 0.75), 0.12, 4, [0.95, 0.94, 0.9], tag)       // the wings
  tube(mb, P(-0.55, 1.0, 0), P(-0.6, 1.3, 0), 0.08, 4, c, tag, 0.04)                          // the tail fin
  tube(mb, P(0.58, 0.7, 0), P(0.58, 1.2, 0), 0.03, 4, [0.2, 0.2, 0.2], tag)                    // the propeller
}

/** an elephant: the barrel, the head, the trunk curled down, four legs, the ears */
function elephant(mb: MeshBuilder, x: number, y: number, z: number, a: number, tag: number): void {
  const cs = Math.cos(a), sn = Math.sin(a), G: Rgb = [0.62, 0.62, 0.66]
  const P = (u: number, v: number, w: number): V3 => [x + u * cs - w * sn, y + v, z + u * sn + w * cs]
  tube(mb, P(-0.45, 0.85, 0), P(0.35, 0.88, 0), 0.32, 8, G, tag, 0.3)
  tube(mb, P(0.35, 1.0, 0), P(0.6, 1.05, 0), 0.22, 8, G, tag, 0.18)
  tube(mb, P(0.66, 1.0, 0), P(0.75, 0.45, 0), 0.07, 6, G, tag, 0.045)
  for (const w of [-0.18, 0.18]) {
    tube(mb, P(-0.3, 0.6, w), P(-0.3, 0.1, w), 0.09, 6, G, tag)
    tube(mb, P(0.22, 0.6, w), P(0.22, 0.1, w), 0.09, 6, G, tag)
    tube(mb, P(0.42, 1.05, w * 1.6), P(0.4, 0.85, w * 2.2), 0.14, 4, [0.85, 0.55, 0.6], tag, 0.06)    // the ears
  }
  tube(mb, P(-0.05, 1.18, 0), P(0.15, 1.18, 0), 0.24, 8, [0.8, 0.2, 0.25], tag, 0.24)                    // the saddle cloth
}

export function parisManege(out: MeshBuilder, fit: Fit): void {
  const y0 = fit.grade ?? 0
  const R = Math.max(2.6, Math.min(5, Math.min(fit.hx, fit.hz) - 0.4))
  const seed = Math.round(fit.hx * 1000 + fit.hz * 37 + (fit.ring?.length ?? 0) * 7 + (fit.ring?.[0]?.x ?? 0) * 13)
  const [C1, C2, PANEL] = SCHEMES[Math.floor(hash(seed, 1) * SCHEMES.length)]
  const GOLD: Rgb = [0.86, 0.7, 0.3], BRASS: Rgb = [0.86, 0.72, 0.36], DECK: Rgb = [0.5, 0.36, 0.25]
  const MT = surfaceTag('metal'), WT = surfaceTag('clapboard')
  const TOP = 2.9 + R * 0.12, PEAK = TOP + 1.2 + R * 0.25
  // the standing parts: the base and its step, the little fence round it with its gap, the canopy's posts
  prism(out, 0, 0, y0, y0 + 0.22, R + 0.5, 24, [0.58, 0.56, 0.52], surfaceTag('concrete'))
  const FN = 28
  for (let k = 0; k < FN; k++) {
    if (k === 0 || k === 1) continue                                                       // the way in
    const a0 = (k / FN) * Math.PI * 2, a1 = ((k + 1) / FN) * Math.PI * 2
    const q = (a: number, y: number): V3 => [Math.sin(a) * (R + 1.4), y0 + y, Math.cos(a) * (R + 1.4)]
    tube(out, q(a0, 0), q(a0, 0.75), 0.02, 4, [0.15, 0.25, 0.2], MT)
    tube(out, q(a0, 0.72), q(a1, 0.72), 0.018, 4, [0.15, 0.25, 0.2], MT)
  }
  const POSTS = R > 3.5 ? 12 : 8
  for (let k = 0; k < POSTS; k++) {
    const a = ((k + 0.5) / POSTS) * Math.PI * 2
    tube(out, [Math.sin(a) * (R + 0.3), y0 + 0.22, Math.cos(a) * (R + 0.3)], [Math.sin(a) * (R + 0.3), y0 + TOP, Math.cos(a) * (R + 0.3)], 0.06, 6, k % 2 ? GOLD : C2, MT)
  }
  // the rounding board: painted panels, gilt edges, a ring of bulbs
  const N = 24
  for (let k = 0; k < N; k++) {
    const a0 = (k / N) * Math.PI * 2, a1 = ((k + 1) / N) * Math.PI * 2, am = (a0 + a1) / 2
    const q = (a: number, y: number): V3 => [Math.sin(a) * (R + 0.45), y0 + y, Math.cos(a) * (R + 0.45)]
    out.quad([q(a0, TOP - 0.6), q(a1, TOP - 0.6), q(a1, TOP), q(a0, TOP)], [Math.sin(am), 0, Math.cos(am)], UVQ, k % 2 ? PANEL : C2, WT)
    out.quad([q(a0, TOP - 0.05), q(a1, TOP - 0.05), q(a1, TOP + 0.06), q(a0, TOP + 0.06)], [Math.sin(am), 0, Math.cos(am)], UVQ, GOLD, MT)
    out.quad([q(a0, TOP - 0.66), q(a1, TOP - 0.66), q(a1, TOP - 0.56), q(a0, TOP - 0.56)], [Math.sin(am), 0, Math.cos(am)], UVQ, GOLD, MT)
    const b = q(am, TOP - 0.3)
    box(out, b[0] * 1.01, b[1], b[2] * 1.01, 0.05, 0.05, 0.05, [1, 0.92, 0.6], EMIT)
    // the scalloped valance under it
    const v: V3 = [Math.sin(am) * (R + 0.47), y0 + TOP - 0.95, Math.cos(am) * (R + 0.47)]
    out.quad([q(a0, TOP - 0.66), q(a1, TOP - 0.66), v, v], [Math.sin(am), 0, Math.cos(am)], UVQ, k % 2 ? C1 : C2, WT)
  }
  // the canopy: a peaked tent in its two colours, the finial and its pennant
  const SEG = 16
  for (let k = 0; k < SEG; k++) {
    const a0 = (k / SEG) * Math.PI * 2, a1 = ((k + 1) / SEG) * Math.PI * 2, am = (a0 + a1) / 2
    const rim = (a: number): V3 => [Math.sin(a) * (R + 0.6), y0 + TOP, Math.cos(a) * (R + 0.6)]
    const mid = (a: number): V3 => [Math.sin(a) * (R * 0.45), y0 + TOP + (PEAK - TOP) * 0.6, Math.cos(a) * (R * 0.45)]
    const apex: V3 = [0, y0 + PEAK, 0]
    const col = k % 2 ? C1 : C2
    out.quad([rim(a0), rim(a1), mid(a1), mid(a0)], [Math.sin(am) * 0.6, 1, Math.cos(am) * 0.6], UVQ, col, WT)
    out.quad([mid(a0), mid(a1), apex, apex], [Math.sin(am) * 0.9, 1, Math.cos(am) * 0.9], UVQ, col, WT)
  }
  tube(out, [0, y0 + PEAK - 0.1, 0], [0, y0 + PEAK + 1.0, 0], 0.04, 6, GOLD, MT)
  prism(out, 0, 0, y0 + PEAK + 0.05, y0 + PEAK + 0.3, 0.15, 8, C1, MT, 0.02)
  out.quad([[0, y0 + PEAK + 0.95, 0], [0.7, y0 + PEAK + 0.8, 0.05], [0.7, y0 + PEAK + 0.8, 0.05], [0, y0 + PEAK + 0.6, 0]], [0, 0, 1], UVQ, C1, WT)
  out.quad([[0, y0 + PEAK + 0.95, 0], [0, y0 + PEAK + 0.6, 0], [0.7, y0 + PEAK + 0.8, 0.05], [0.7, y0 + PEAK + 0.8, 0.05]], [0, 0, -1], UVQ, C2, WT)
  /*
   * What turns: the deck, the mirrored drum round the centre pole, the riders on their brass poles — two rings on a big one,
   * one on a small — horses mostly, and a car, a plane or an elephant in their places, noses the way it goes round.
   */
  const turn = new (out.constructor as new () => MeshBuilder)()
  prism(turn, 0, 0, y0 + 0.22, y0 + 0.4, R, 24, DECK, WT)
  prism(turn, 0, 0, y0 + 0.4, y0 + TOP - 0.1, 0.55, 10, C2, WT)
  prism(turn, 0, 0, y0 + 1.0, y0 + 2.0, 0.58, 10, [0.75, 0.82, 0.88], surfaceTag('glass'))
  const coats: Rgb[] = [[0.95, 0.94, 0.9], [0.55, 0.36, 0.22], [0.25, 0.2, 0.18], [0.92, 0.82, 0.62], [0.7, 0.7, 0.72]]
  const others: Rgb[] = [C1, PANEL, [0.95, 0.75, 0.2], [0.3, 0.6, 0.35]]
  const rings: [number, number][] = R > 3.6 ? [[R - 0.6, 12], [R - 1.7, 8]] : [[R - 0.6, Math.max(6, Math.round(R * 2.6))]]
  let n = 0
  for (const [rr, cnt] of rings) {
    for (let k = 0; k < cnt; k++) {
      const a = ((k + (rr < R - 1 ? 0.5 : 0)) / cnt) * Math.PI * 2
      const x = Math.sin(a) * rr, z = Math.cos(a) * rr
      const heading = Math.atan2(-Math.sin(a), Math.cos(a))
      const kind = hash(seed, 10 + n)
      const fl = y0 + 0.4
      if (kind < 0.62) {
        const bob = 0.2 * Math.sin(k * 1.9 + rr)
        tube(turn, [x, fl, z], [x, y0 + TOP - 0.6, z], 0.03, 6, BRASS, MT)
        horse(turn, x, fl + 0.25 + bob, z, heading, coats[n % coats.length], others[n % others.length], WT)
      } else if (kind < 0.8) {
        car(turn, x, fl, z, heading, others[(n + 1) % others.length], WT)
      } else if (kind < 0.92) {
        tube(turn, [x, fl, z], [x, y0 + TOP - 0.6, z], 0.03, 6, BRASS, MT)
        plane(turn, x, fl + 0.3, z, heading, others[(n + 2) % others.length], WT)
      } else {
        elephant(turn, x, fl, z, heading, WT)
      }
      n++
    }
  }
  out.rotors.push({ x: 0, y: 0, z: 0, nx: 0, ny: 1, nz: 0, mb: turn, rpm: 4 + hash(seed, 3) * 2 })
}

export const PARIS_CAROUSELS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { parisManege }
