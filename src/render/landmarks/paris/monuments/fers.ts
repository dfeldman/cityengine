import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { block, hex } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { FIXED, UV } from './common.ts'
import { G } from './plaza-common.ts'

/*
 * FERS (Driss Sans-Arcidet, 2009), the monument to General Thomas-Alexandre Dumas on the Place du Général-Catroux, OSM node
 * 7952476083. Compared with Commons "Unchained (64188317).jpeg" (2026-11-04): rusted steel on a lawn, two pieces. At −x a thin
 * ring ~4 m high standing on its rim, two links rising from its top and curling over, the last broken; at +x a wide manacle
 * cuff standing on edge, axis along x, a chain of links hanging from its rim down to the grass. Sizes by eye from that photo.
 */
const RUST: Rgb = hex('#7a4026')
const SHINE: Rgb = hex('#94532f')
const BED: Rgb = hex('#5f7a3a') // the lawn
const PLAQUE: Rgb = hex('#c9c4b6')
const RING_X = -2.6, RING_R = 1.85, RING_T = 0.11 // the tall ring: centre x, radius and bar radius
const CUFF_X = 2.4, CUFF_R = 1.6, CUFF_W = 1.5, CUFF_T = 0.07 // the cuff: centre x, radius, band width along x, plate half-thickness
const LINK_LEN = 0.65, LINK_W = 0.34, LINK_T = 0.1 // a link's half-length, half-width, bar radius
const BROKEN_GAP = 1.1 // radians missing from the ring chain's last link
const SEG = 28
const SIDES = 10
export const FERS_HX = 4.5
export const FERS_HZ = 2.2

type V3 = [number, number, number]

/** A tube along a closed centreline path(t), t in [t0, t1] of 0..1, swept with radius r; frame given by the path plane's normal. */
function tube(q: MeshBuilder, path: (t: number) => V3, axis: V3, r: number, t0: number, t1: number, c: Rgb): void {
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
  const n = Math.max(2, Math.ceil(SEG * (t1 - t0)))
  const rings: { p: V3; n: V3 }[][] = []
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n
    const p = path(t)
    const tan = norm(sub(path(t + 1e-3), path(t - 1e-3)))
    const u = norm(cross(tan, axis))
    const v = norm(cross(u, tan))
    const ring: { p: V3; n: V3 }[] = []
    for (let k = 0; k < SIDES; k++) {
      const a = (k / SIDES) * Math.PI * 2
      const d: V3 = [u[0] * Math.cos(a) + v[0] * Math.sin(a), u[1] * Math.cos(a) + v[1] * Math.sin(a), u[2] * Math.cos(a) + v[2] * Math.sin(a)]
      ring.push({ p: [p[0] + d[0] * r, p[1] + d[1] * r, p[2] + d[2] * r], n: d })
    }
    rings.push(ring)
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < SIDES; k++) {
    const a = rings[i][k], b = rings[i][(k + 1) % SIDES], cc = rings[i + 1][(k + 1) % SIDES], d = rings[i + 1][k]
    const m: V3 = norm([a.n[0] + b.n[0] + cc.n[0] + d.n[0], a.n[1] + b.n[1] + cc.n[1] + d.n[1], a.n[2] + b.n[2] + cc.n[2] + d.n[2]])
    q.quad([a.p, b.p, cc.p, d.p], m, UV, k % 4 === 0 ? SHINE : c, FIXED)
  }
}

/** An oval chain link (stadium centreline) centred at (cx, cy, cz), long axis along `dir`, lying in the plane with normal `axis`. */
function link(q: MeshBuilder, cx: number, cy: number, cz: number, dir: V3, axis: V3, gapFrom = 1, c: Rgb = RUST): void {
  const side: V3 = [axis[1] * dir[2] - axis[2] * dir[1], axis[2] * dir[0] - axis[0] * dir[2], axis[0] * dir[1] - axis[1] * dir[0]]
  const straight = 2 * (LINK_LEN - LINK_W), arc = Math.PI * LINK_W, per = 2 * straight + 2 * arc
  const path = (t: number): V3 => {
    let s = (((t % 1) + 1) % 1) * per
    let a: number, b: number
    if (s < straight) { a = -(LINK_LEN - LINK_W) + s; b = LINK_W }
    else if ((s -= straight) < arc) { const th = s / LINK_W; a = LINK_LEN - LINK_W + Math.sin(th) * LINK_W; b = Math.cos(th) * LINK_W }
    else if ((s -= arc) < straight) { a = LINK_LEN - LINK_W - s; b = -LINK_W }
    else { s -= straight; const th = s / LINK_W; a = -(LINK_LEN - LINK_W) - Math.sin(th) * LINK_W; b = -Math.cos(th) * LINK_W }
    return [cx + dir[0] * a + side[0] * b, cy + dir[1] * a + side[1] * b, cz + dir[2] * a + side[2] * b]
  }
  tube(q, path, axis, LINK_T, 0, gapFrom, c)
}

/** A short open cylinder, axis along x: the cuff's band, outer and inner faces. */
function band(q: MeshBuilder, cx: number, cy: number, r: number, w: number, c: Rgb): void {
  const n = 32
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2
    for (const [rr, sg] of [[r + CUFF_T, 1], [r - CUFF_T, -1]] as const) {
      const P = (a: number, x: number): V3 => [x, cy + Math.sin(a) * rr, Math.cos(a) * rr]
      const nn: V3 = [0, Math.sin(am) * sg, Math.cos(am) * sg]
      const quad: V3[] = [P(a0, cx - w / 2), P(a1, cx - w / 2), P(a1, cx + w / 2), P(a0, cx + w / 2)]
      q.quad(sg > 0 ? quad : quad.reverse(), nn, UV, i % 5 === 0 ? SHINE : c, FIXED)
    }
    for (const sx of [-1, 1]) { // the two rims
      const x = cx + (sx * w) / 2
      const R = (a: number, rr: number): V3 => [x, cy + Math.sin(a) * rr, Math.cos(a) * rr]
      const quad: V3[] = [R(a0, r - CUFF_T), R(a1, r - CUFF_T), R(a1, r + CUFF_T), R(a0, r + CUFF_T)]
      q.quad(sx > 0 ? quad : quad.reverse(), [sx, 0, 0], UV, c, FIXED)
    }
  }
}

export function fers(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, FERS_HX, FERS_HZ, (q) => {
    const g0 = G + 0.05
    block(q, -FERS_HX, FERS_HX, -FERS_HZ, FERS_HZ, 0, g0, BED)
    block(q, -0.5, 0.5, -FERS_HZ + 0.3, -FERS_HZ + 0.9, g0, g0 + 0.55, PLAQUE) // the plaque stone in front
    // the tall ring, standing in the x–y plane
    const ry = g0 + RING_R + RING_T
    tube(q, (t) => [RING_X + Math.sin(t * Math.PI * 2) * RING_R, ry + Math.cos(t * Math.PI * 2) * RING_R, 0], [0, 0, 1], RING_T, 0, 1, RUST)
    // its chain: a link through the top, on edge across the ring; a second rising and leaning over toward +x, snapped
    const top = ry + RING_R
    link(q, RING_X, top + LINK_LEN - 0.15, 0, [0, 1, 0], [1, 0, 0])
    const lean: V3 = [Math.sin(0.7), Math.cos(0.7), 0]
    link(q, RING_X + lean[0] * (LINK_LEN * 1.6), top + 2 * LINK_LEN - 0.3 + lean[1] * LINK_LEN * 0.9, 0, lean, [0, 0, 1], 1 - BROKEN_GAP / (Math.PI * 2))
    // the cuff, standing on edge
    const cy = g0 + CUFF_R + CUFF_T
    band(q, CUFF_X, cy, CUFF_R, CUFF_W, RUST)
    // its chain, from the face toward −z, near the top down to the grass, links alternating in plane, the last lying on the ground
    const fx = CUFF_X + CUFF_W * 0.3, fz = -(CUFF_R + CUFF_T + LINK_T)
    let y = cy + CUFF_R * 0.75
    for (let i = 0; i < 4; i++) {
      y -= 2 * LINK_LEN - 2 * LINK_T - 0.1
      link(q, fx + 0.1 * i, y, fz, [0, 1, 0], i % 2 ? [1, 0, 0] : [0, 0, 1])
    }
    link(q, fx + LINK_LEN + 0.3, g0 + LINK_T, fz, [1, 0, 0], [0, 1, 0])
  })
}
