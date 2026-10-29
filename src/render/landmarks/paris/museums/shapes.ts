/**
 * Shapes the modern museums share (Louis Vuitton's sails, Branly's bridge, the Géode): an extruded plan, a plan
 * given in a reference frame and stretched to the fit, and a curved sheet. Not a builder — nothing is registered.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'

const FIXED = 0
export type P2 = { x: number; z: number }
export type V3 = [number, number, number]

/** `[x, z]` pairs drawn at a reference half-size, stretched to the fitted one (sx = fit.hx / ref.hx…) */
export const plan = (pts: [number, number][], sx: number, sz: number): P2[] => pts.map(([x, z]) => ({ x: x * sx, z: z * sz }))

const area2 = (r: P2[]): number => r.reduce((a, p, i) => { const q = r[(i + 1) % r.length]; return a + p.x * q.z - q.x * p.z }, 0)

/** anticlockwise, as `faceBand` and the walls below want it (outward normal (tz, −tx)) */
export const ccw = (r: P2[]): P2[] => (area2(r) < 0 ? [...r].reverse() : r)

/** An upright prism on a plan: its walls (each edge facing out) and a flat top. */
export function slab(out: MeshBuilder, ring: P2[], y0: number, y1: number, wall: Rgb, top: Rgb = wall, cap = true): void {
  const r = ccw(ring)
  for (let i = 0; i < r.length; i++) {
    const a = r[i]
    const b = r[(i + 1) % r.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.05) continue
    const n: V3 = [(b.z - a.z) / L, 0, -(b.x - a.x) / L]
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], n, [[0, 0], [1, 0], [1, 1], [0, 1]], wall, FIXED)
  }
  if (cap) capPolygon(out, r, y1, top, FIXED)
}

/** A rounded rectangle's plan, corners of radius `r`, `n` steps a corner. */
export function rounded(x0: number, x1: number, z0: number, z1: number, r: number, n = 3): P2[] {
  const rr = Math.max(0, Math.min(r, (x1 - x0) / 2 - 0.01, (z1 - z0) / 2 - 0.01))
  const out: P2[] = []
  const corners: [number, number, number][] = [[x1 - rr, z0 + rr, -Math.PI / 2], [x1 - rr, z1 - rr, 0], [x0 + rr, z1 - rr, Math.PI / 2], [x0 + rr, z0 + rr, Math.PI]]
  for (const [cx, cz, a0] of corners) {
    for (let k = 0; k <= n; k++) {
      const a = a0 + (k / n) * (Math.PI / 2)
      out.push({ x: cx + Math.cos(a) * rr, z: cz + Math.sin(a) * rr })
    }
  }
  return out
}

/** An ellipse's plan. */
export const ellipse = (cx: number, cz: number, rx: number, rz: number, n = 20): P2[] =>
  Array.from({ length: n }, (_, i) => ({ x: cx + Math.cos((i / n) * Math.PI * 2) * rx, z: cz + Math.sin((i / n) * Math.PI * 2) * rz }))

/**
 * A curved sheet: `at(u, v)` for u, v in [0, 1], `nu × nv` quads, each normalled by its own corners. Landmarks are
 * drawn double-sided in the city (render/landmarks.ts) but not in the showcase, and a back face is lit by the
 * front's normal; `back` (metres) draws the other side too, that far behind, normalled its own way.
 */
export function sheet(out: MeshBuilder, at: (u: number, v: number) => V3, nu: number, nv: number, colour: Rgb | ((u: number, v: number) => Rgb),
                      back = 0): void {
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const p00 = at(i / nu, j / nv)
      const p10 = at((i + 1) / nu, j / nv)
      const p11 = at((i + 1) / nu, (j + 1) / nv)
      const p01 = at(i / nu, (j + 1) / nv)
      const e1 = [p11[0] - p00[0], p11[1] - p00[1], p11[2] - p00[2]]
      const e2 = [p01[0] - p10[0], p01[1] - p10[1], p01[2] - p10[2]]
      const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
      const l = Math.hypot(n[0], n[1], n[2]) || 1
      const c = typeof colour === 'function' ? colour((i + 0.5) / nu, (j + 0.5) / nv) : colour
      const nn: V3 = [n[0] / l, n[1] / l, n[2] / l]
      out.quad([p00, p10, p11, p01], nn, [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
      if (back > 0) {
        const m = (p: V3): V3 => [p[0] - nn[0] * back, p[1] - nn[1] * back, p[2] - nn[2] * back]
        out.quad([m(p00), m(p10), m(p11), m(p01)], [-nn[0], -nn[1], -nn[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
      }
    }
  }
}
