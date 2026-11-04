/**
 * A builder's own EAST/NORTH/HEIGHT frame, registered onto the footprint the loader hands it — for a building
 * measured off the lidar and the orthophoto in metres from its OSM centroid (the Philharmonie first, then the Opéra
 * Bastille), so that the measurements go straight into the code and the fit is worked out once, here.
 *
 * `registerRing` matches the builder's own outline to `fit.ring` by the AREA MOMENTS of the two convex hulls: the
 * centroid and the principal axis. That survives everything the loader does to a ring — simplifying it, replacing a
 * superseded outline by its parts' hull or their rasterised union — where a vertex-by-vertex fit would not. The
 * half-turn and the mirror (east/north against the city's x/z) are settled by which of the four candidates lands the
 * hull's vertices nearest the given ones; a building that is not symmetric end to end settles it clearly.
 *
 * The primitives (`tools`) draw in that frame: a planar polygon, a prism over a plan, a mottled quad for a panelled
 * wall, a square tube. Every normal is given by a hint (outward, up, down), so concave plans draw correctly.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import type { Rgb } from '../../../models.ts'

const FIXED = 0

export type V3 = [number, number, number]
export type P2 = [number, number]

export const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
export const tone = (c: Rgb, f: number): Rgb => [c[0] * f, c[1] * f, c[2] * f]
/** a deterministic jitter in [0, 1) from a cell's position */
export const hash = (a: number, b: number): number => {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
  return s - Math.floor(s)
}

export interface Frame {
  /** (east, north, height) → the builder's local (x, y, z) */
  p: (e: number, n: number, h: number) => V3
  /** a direction in east/north/height → local */
  n: (v: V3) => V3
  /** (east, north) → local (x, z) */
  xz: (e: number, n: number) => { x: number; z: number }
  /** the ground level everything stands on, local y */
  y0: number
}

/** the convex hull, anticlockwise (Andrew's monotone chain) */
export function hull(pts: P2[]): P2[] {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (s.length < 3) return s
  const cross = (o: P2, a: P2, b: P2): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: P2[] = []
  for (const p of s) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p) }
  const upper: P2[] = []
  for (let i = s.length - 1; i >= 0; i--) { const p = s[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p) }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

/** a polygon's area centroid and the bearing (from the first axis) of its principal axis */
function moments(r: P2[]): { c: P2; theta: number } {
  let A = 0, cx = 0, cy = 0, xx = 0, yy = 0, xy = 0
  for (let i = 0; i < r.length; i++) {
    const [x0, y0] = r[i], [x1, y1] = r[(i + 1) % r.length]
    const k = x0 * y1 - x1 * y0
    A += k; cx += (x0 + x1) * k; cy += (y0 + y1) * k
    xx += (x0 * x0 + x0 * x1 + x1 * x1) * k
    yy += (y0 * y0 + y0 * y1 + y1 * y1) * k
    xy += (x0 * y1 + 2 * x0 * y0 + 2 * x1 * y1 + x1 * y0) * k
  }
  A /= 2
  if (Math.abs(A) < 1e-6) return { c: [0, 0], theta: 0 }
  cx /= 6 * A; cy /= 6 * A
  const vxx = xx / (12 * A) - cx * cx, vyy = yy / (12 * A) - cy * cy, vxy = xy / (24 * A) - cx * cy
  return { c: [cx, cy], theta: 0.5 * Math.atan2(2 * vxy, vxx - vyy) }
}

/**
 * The frame for a builder whose outline is `ring` (east/north metres of its own origin) on the footprint the loader
 * fitted. Without a ring (tests, a bare `?model=`) east is local +x and north local +z.
 */
export function registerRing(ring: P2[], fit: Fit): Frame {
  // x = a e + b n + c; z = d e + f n + g
  let M: [number, number, number, number, number, number] = [1, 0, 0, 0, 1, 0]
  const given = fit.ring
  if (given && given.length >= 3) {
    const G = hull(given.map((q) => [q.x, q.z] as P2))
    const mg = moments(G)
    let best = Infinity
    for (const mirror of [1, -1]) {
      const R = hull(ring.map(([e, n]) => [e, mirror * n] as P2))
      const mr = moments(R)
      for (const k of [0, Math.PI]) {
        const phi = mg.theta - mr.theta + k
        const c = Math.cos(phi), s = Math.sin(phi)
        const map = ([e, n]: P2): P2 => [c * (e - mr.c[0]) - s * (n - mr.c[1]) + mg.c[0], s * (e - mr.c[0]) + c * (n - mr.c[1]) + mg.c[1]]
        const T = R.map(map)
        let err = 0
        const near = (p: P2, set: P2[]): number => { let d = Infinity; for (const q of set) d = Math.min(d, (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2); return d }
        for (const p of T) err += near(p, G)
        for (const p of G) err += near(p, T)
        if (err < best) {
          best = err
          // the map applied to (e, mirror·n) − mr.c, then rotated, then + mg.c
          M = [c, -s * mirror, -c * mr.c[0] + s * mr.c[1] + mg.c[0], s, c * mirror, -s * mr.c[0] - c * mr.c[1] + mg.c[1]]
        }
      }
    }
  }
  const [a, b, c, d, f, g] = M
  const y0 = fit.grade ?? 0.5
  return {
    p: (e, n, h) => [a * e + b * n + c, y0 + h, d * e + f * n + g],
    n: (v) => [a * v[0] + b * v[1], v[2], d * v[0] + f * v[1]],
    xz: (e, n) => ({ x: a * e + b * n + c, z: d * e + f * n + g }),
    y0,
  }
}

/** anticlockwise in east/north (east × north = up) */
export function ccwEN(r: P2[]): P2[] {
  let A = 0
  for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; A += p[0] * q[1] - q[0] * p[1] }
  return A < 0 ? [...r].reverse() : r
}

/** points along an arc about `c`, radius `r`, from bearing `b0` to `b1` (degrees clockwise from north), `n` steps */
export function arc(c: P2, r: number, b0: number, b1: number, n: number): P2[] {
  const out: P2[] = []
  for (let i = 0; i <= n; i++) {
    const b = ((b0 + ((b1 - b0) * i) / n) * Math.PI) / 180
    out.push([c[0] + r * Math.sin(b), c[1] + r * Math.cos(b)])
  }
  return out
}

/** a polyline moved `d` metres to the LEFT of its direction of travel (mitred at the joints) */
export function offsetPath(path: P2[], d: number): P2[] {
  const out: P2[] = []
  const dir = (i: number): P2 => {
    const a = path[Math.max(0, i)], b = path[Math.min(path.length - 1, i + 1)]
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
  }
  for (let i = 0; i < path.length; i++) {
    const d0 = dir(i - 1), d1 = dir(i)
    const t: P2 = i === 0 ? d1 : i === path.length - 1 ? d0 : [d0[0] + d1[0], d0[1] + d1[1]]
    const l = Math.hypot(t[0], t[1]) || 1
    const left: P2 = [-t[1] / l, t[0] / l]
    const cosHalf = Math.max(0.5, (d0[0] * t[0] + d0[1] * t[1]) / l)
    out.push([path[i][0] + (left[0] * d) / cosHalf, path[i][1] + (left[1] * d) / cosHalf])
  }
  return out
}

export interface Tools {
  /** a planar polygon as a fan (convex), facing the way `hint` points */
  poly: (pts: V3[], colour: Rgb, hint: V3) => void
  /** a quad split into cells of about `cell` metres, each its own tone: a panelled wall */
  mottled: (q: [V3, V3, V3, V3], colour: Rgb, hint: V3, cell?: number, spread?: number) => void
  /** a flat polygon at `h` facing up, any plan (earcut) */
  cap: (ring: P2[], h: number, colour: Rgb) => void
  /** one wall from `a` to `b` between heights, facing out of an anticlockwise ring */
  wall: (a: P2, b: P2, lo: number | ((e: number, n: number) => number), hi: number | ((e: number, n: number) => number), colour: Rgb, mottle?: number, spread?: number) => void
  /**
   * a prism over a plan: walls facing out (the ring is put anticlockwise), a flat top (`top`, any plan) or a sloped
   * one (`hi` a function: a fan, so convex plans only), and `mottle` the cell size of the walls' panelling
   */
  prism: (ring: P2[], lo: number | ((e: number, n: number) => number), hi: number | ((e: number, n: number) => number), side: Rgb, top?: Rgb | null, mottle?: number, spread?: number) => void
  /** a square tube between two points */
  beam: (a: V3, b: V3, r: number, colour: Rgb, rv?: number) => void
  /**
   * a terrace: the solid between an outer path and an inner one (both running the same way), from `lo` to `h`, its
   * outer walls panelled and its ends plain — and NO inner wall, since the next terrace up stands against it
   */
  band: (outer: P2[], inner: P2[], lo: number, h: number, side: Rgb, top: Rgb, mottle?: number, spread?: number) => void
}

export function tools(out: MeshBuilder, F: Frame): Tools {
  const P = F.p
  const poly = (pts: V3[], colour: Rgb, hint: V3): void => {
    if (pts.length < 3) return
    let nx = 0, ny = 0, nz = 0
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length]
      nx += (p[1] - q[1]) * (p[2] + q[2]); ny += (p[2] - q[2]) * (p[0] + q[0]); nz += (p[0] - q[0]) * (p[1] + q[1])
    }
    const l = Math.hypot(nx, ny, nz)
    if (l < 1e-6) return
    nx /= l; ny /= l; nz /= l
    if (nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) { nx = -nx; ny = -ny; nz = -nz }
    const n = F.n([nx, ny, nz])
    // a quad is one quad (two triangles); anything else a fan of triangles, each a quad with a doubled corner
    if (pts.length === 4) { out.quad([P(...pts[0]), P(...pts[1]), P(...pts[2]), P(...pts[3])], n, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED); return }
    for (let i = 1; i + 1 < pts.length; i++) {
      out.quad([P(...pts[0]), P(...pts[i]), P(...pts[i + 1]), P(...pts[i + 1])], n, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
    }
  }
  const mottled = (q: [V3, V3, V3, V3], colour: Rgb, hint: V3, cell = 3, spread = 0.035): void => {
    const [p00, p10, p11, p01] = q
    const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
    const at = (u: number, v: number): V3 => lerp(lerp(p00, p10, u), lerp(p01, p11, u), v)
    const nu = Math.max(1, Math.round(Math.hypot(p10[0] - p00[0], p10[1] - p00[1], p10[2] - p00[2]) / cell))
    const nv = Math.max(1, Math.round(Math.hypot(p01[0] - p00[0], p01[1] - p00[1], p01[2] - p00[2]) / cell))
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const t = 1 + (hash(p00[0] + i * 3.1 + p00[1] * 0.7, p00[2] + j * 1.7 + p00[0] * 0.3) - 0.5) * 2 * spread
        poly([at(i / nu, j / nv), at((i + 1) / nu, j / nv), at((i + 1) / nu, (j + 1) / nv), at(i / nu, (j + 1) / nv)], tone(colour, t), hint)
      }
    }
  }
  const cap = (ring: P2[], h: number, colour: Rgb): void => {
    capPolygon(out, ring.map(([e, n]) => F.xz(e, n)), F.y0 + h, colour, FIXED)
  }
  const wall: Tools['wall'] = (a, b, lo, hi, colour, mottle = 0, spread = 0.035) => {
    const L = typeof lo === 'number' ? () => lo : lo
    const H = typeof hi === 'number' ? () => hi : hi
    const l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 0.05) return
    // outward of an anticlockwise ring is to the right of travel
    const hint: V3 = [(b[1] - a[1]) / l, -(b[0] - a[0]) / l, 0]
    const q: [V3, V3, V3, V3] = [[a[0], a[1], L(...a)], [b[0], b[1], L(...b)], [b[0], b[1], H(...b)], [a[0], a[1], H(...a)]]
    if (mottle) mottled(q, colour, hint, mottle, spread)
    else poly(q, colour, hint)
  }
  const prism: Tools['prism'] = (ring0, lo, hi, side, top = side, mottle = 0, spread = 0.035) => {
    const ring = ccwEN(ring0)
    for (let i = 0; i < ring.length; i++) wall(ring[i], ring[(i + 1) % ring.length], lo, hi, side, mottle, spread)
    if (!top) return
    if (typeof hi === 'number') cap(ring, hi, top)
    else poly(ring.map(([e, n]) => [e, n, hi(e, n)] as V3), top, [0, 0, 1])
  }
  const beam = (a: V3, b: V3, r: number, colour: Rgb, rv = r): void => {
    const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const len = Math.hypot(...d)
    if (len < 1e-3) return
    const dn: V3 = [d[0] / len, d[1] / len, d[2] / len]
    let u: V3 = [-dn[1], dn[0], 0]
    const ul = Math.hypot(u[0], u[1])
    u = ul < 1e-3 ? [1, 0, 0] : [u[0] / ul, u[1] / ul, 0]
    const v: V3 = [dn[1] * u[2] - dn[2] * u[1], dn[2] * u[0] - dn[0] * u[2], dn[0] * u[1] - dn[1] * u[0]]
    const c = (p: V3, su: number, sv: number): V3 => [p[0] + u[0] * r * su + v[0] * rv * sv, p[1] + u[1] * r * su + v[1] * rv * sv, p[2] + u[2] * r * su + v[2] * rv * sv]
    for (const [su0, sv0, su1, sv1] of [[1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1], [-1, -1, 1, -1]] as const) {
      const hint: V3 = [u[0] * (su0 + su1) + v[0] * (sv0 + sv1), u[1] * (su0 + su1) + v[1] * (sv0 + sv1), u[2] * (su0 + su1) + v[2] * (sv0 + sv1)]
      poly([c(a, su0, sv0), c(b, su0, sv0), c(b, su1, sv1), c(a, su1, sv1)], colour, hint)
    }
    poly([c(a, -1, -1), c(a, 1, -1), c(a, 1, 1), c(a, -1, 1)], colour, [-dn[0], -dn[1], -dn[2]])
    poly([c(b, -1, -1), c(b, 1, -1), c(b, 1, 1), c(b, -1, 1)], colour, dn)
  }
  const band: Tools['band'] = (outer, inner, lo, h, side, top, mottle = 0, spread = 0.035) => {
    const ring = ccwEN([...outer, ...[...inner].reverse()])
    // the walls of the outer path, facing out of the anticlockwise ring, whichever way the paths were given
    const forward = ring[0] === outer[0]
    const o = forward ? outer : [...outer].reverse()
    for (let i = 0; i + 1 < o.length; i++) wall(o[i], o[i + 1], lo, h, side, mottle, spread)
    const inn = forward ? [...inner].reverse() : inner
    wall(o[o.length - 1], inn[0], lo, h, side, mottle, spread)
    wall(inn[inn.length - 1], o[0], lo, h, side, mottle, spread)
    cap(ring, h, top)
  }
  return { poly, mottled, cap, wall, prism, beam, band }
}
