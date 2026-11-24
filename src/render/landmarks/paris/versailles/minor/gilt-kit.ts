import type { MeshBuilder } from '../../../../buildings.ts'
import { surfaceTag } from '../../../../cartoon-material.ts'
import type { Rgb } from '../../../../models.ts'
import { hex, shade } from '../../../kit.ts'

/* Small sculpture helpers for the Versailles basins: tagged ellipsoids along an axis (limbs, bodies, heads), gilded creatures. */
export const GILT: Rgb = hex('#d4a82e')
export const giltTag = surfaceTag('metal')
export type V3 = [number, number, number]

/** an ellipsoid from a to b (the long axis), radius r across (rv vertical-ish squash), n slices round, 4 rings along */
export function ell(out: MeshBuilder, a: V3, b: V3, r: number, c: Rgb, rv = r, tag = giltTag, n = 6): void {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const len = Math.hypot(...d) || 1e-6
  const t: V3 = [d[0] / len, d[1] / len, d[2] / len]
  let u: V3 = [t[2], 0, -t[0]]
  const ul = Math.hypot(u[0], u[2])
  if (ul < 1e-3) u = [1, 0, 0]
  else u = [u[0] / ul, 0, u[2] / ul]
  const v: V3 = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]]
  const K = 4
  const ring = (k: number, j: number): V3 => {
    const s = (k / K) * 2 - 1, rad = Math.sqrt(Math.max(0, 1 - s * s)), th = (j / n) * Math.PI * 2
    const m = [a[0] + d[0] * (0.5 + 0.5 * s), a[1] + d[1] * (0.5 + 0.5 * s), a[2] + d[2] * (0.5 + 0.5 * s)]
    const cu = Math.cos(th) * r * rad, cv = Math.sin(th) * rv * rad
    return [m[0] + u[0] * cu + v[0] * cv, m[1] + u[1] * cu + v[1] * cv, m[2] + u[2] * cu + v[2] * cv]
  }
  for (let k = 0; k < K; k++) {
    for (let j = 0; j < n; j++) {
      const p0 = ring(k, j), p1 = ring(k, j + 1), p2 = ring(k + 1, j + 1), p3 = ring(k + 1, j)
      const mid: V3 = [(p0[0] + p1[0] + p2[0] + p3[0]) / 4, (p0[1] + p1[1] + p2[1] + p3[1]) / 4, (p0[2] + p1[2] + p2[2] + p3[2]) / 4]
      const cen: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
      const nn: V3 = [mid[0] - cen[0], mid[1] - cen[1], mid[2] - cen[2]]
      const l = Math.hypot(...nn) || 1
      out.quad([p0, p1, p2, p3], [nn[0] / l, nn[1] / l, nn[2] / l], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(c, 0.9 + 0.2 * (j % 2)), tag)
    }
  }
}

/** a gilded lizard at (x,y,z) heading yaw (radians, 0 = +z, clockwise to +x), body length L: body, head, curved tail, four splayed legs */
export function lizard(out: MeshBuilder, x: number, y: number, z: number, yaw: number, L: number, c: Rgb = GILT): void {
  const fx = Math.sin(yaw), fz = Math.cos(yaw), sx = fz, sz = -fx
  const P = (f: number, s: number, h: number): V3 => [x + fx * f * L + sx * s * L, y + h * L, z + fz * f * L + sz * s * L]
  ell(out, P(-0.25, 0, 0.1), P(0.3, 0, 0.12), 0.19 * L, c, 0.14 * L)
  ell(out, P(0.28, 0, 0.12), P(0.5, 0, 0.14), 0.13 * L, c, 0.1 * L)                // head
  ell(out, P(-0.25, 0, 0.1), P(-0.65, 0.05, 0.07), 0.1 * L, c, 0.07 * L)
  ell(out, P(-0.65, 0.05, 0.07), P(-1.0, 0.2, 0.04), 0.06 * L, c, 0.045 * L)         // tail, curving
  for (const f of [0.15, -0.12]) for (const s of [-1, 1]) {
    ell(out, P(f, s * 0.08, 0.1), P(f + 0.05, s * 0.3, 0.02), 0.06 * L, c, 0.05 * L, giltTag, 4)
  }
}

/** a gilded frog: squat body, big head with bulging eyes, folded hind legs */
export function frog(out: MeshBuilder, x: number, y: number, z: number, yaw: number, L: number, c: Rgb = GILT): void {
  const fx = Math.sin(yaw), fz = Math.cos(yaw), sx = fz, sz = -fx
  const P = (f: number, s: number, h: number): V3 => [x + fx * f * L + sx * s * L, y + h * L, z + fz * f * L + sz * s * L]
  ell(out, P(-0.35, 0, 0.2), P(0.25, 0, 0.3), 0.36 * L, c, 0.28 * L)
  ell(out, P(0.2, 0, 0.3), P(0.55, 0, 0.3), 0.26 * L, c, 0.18 * L)
  for (const s of [-1, 1]) {
    ell(out, P(0.42, s * 0.12, 0.42), P(0.46, s * 0.12, 0.5), 0.07 * L, c, 0.07 * L, giltTag, 4)
    ell(out, P(-0.3, s * 0.28, 0.2), P(-0.55, s * 0.4, 0.05), 0.13 * L, c, 0.1 * L, giltTag, 5)
    ell(out, P(0.25, s * 0.2, 0.15), P(0.4, s * 0.3, 0.02), 0.05 * L, c, 0.04 * L, giltTag, 4)
  }
}

export const rockTag = surfaceTag('rock')
/** a rough rock pile: n half-buried stubby boulders heaped round (x,z), footprint radius R, top ~H, dark stone, no moss */
export function rockPile(out: MeshBuilder, x: number, y: number, z: number, R: number, H: number, c: Rgb, seed: number, n = 9): void {
  const h = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233 + seed) * 43758.5453; return v - Math.floor(v) }
  for (let i = 0; i < n; i++) {
    const centre = i === 0, a = h(i, 1) * Math.PI * 2, d = centre ? 0 : R * (0.35 + 0.45 * h(i, 2))
    const bh = centre ? H : H * (0.45 + 0.35 * (1 - d / R) + 0.2 * h(i, 3)), br = centre ? R * 0.5 : R * (0.28 + 0.14 * h(i, 4))
    const bx = x + Math.sin(a) * d, bz = z + Math.cos(a) * d
    ell(out, [bx, y - 0.3, bz], [bx + (h(i, 5) - 0.5) * 0.3, y + bh, bz + (h(i, 6) - 0.5) * 0.3], br, shade(c, 0.8 + 0.4 * h(i, 7)), br * 0.9, rockTag, 7)
  }
}

/** the half-transformed peasant: an upright gilded figure h high, a frog's head and splayed arms, bent knees */
export function upright(out: MeshBuilder, x: number, y: number, z: number, h: number, c: Rgb = GILT): void {
  ell(out, [x, y, z], [x, y + h * 0.5, z], h * 0.16, c, h * 0.14, giltTag, 7)
  ell(out, [x, y + h * 0.45, z], [x, y + h * 0.8, z], h * 0.17, c, h * 0.13, giltTag, 7)
  ell(out, [x, y + h * 0.78, z], [x + h * 0.08, y + h * 0.98, z], h * 0.14, c, h * 0.11, giltTag, 7)
  for (const s of [-1, 1]) {
    ell(out, [x + s * h * 0.12, y + h * 0.7, z], [x + s * h * 0.42, y + h * 0.9, z + h * 0.1], h * 0.06, c, h * 0.06, giltTag, 5)
    ell(out, [x + s * h * 0.1, y + h * 0.9, z + h * 0.08], [x + s * h * 0.1, y + h * 1.0, z + h * 0.1], h * 0.06, c, h * 0.06, giltTag, 5)
  }
}
