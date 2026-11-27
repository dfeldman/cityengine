/**
 * CLIPPED TOPIARY: box balls, yew cones and clipped cubes (owner, 2026-11-27: Paris's gardens have "box, conical, spherical hedges …
 * they look quite bad. Often light shows through the seams and the spherical ones are insufficiently subdivided").
 *
 * The old shapes were eight flat facets, each its own quad: shaded facet by facet, their feet stood exactly on a ground that is
 * draped vertex by vertex (so the terrain showed light under the foot ring between its corners), and the "ball" was a cone on a
 * dish on a stalk. Here every shape is ONE indexed surface — each vertex shared by every triangle that touches it, so there is no
 * seam to open — with smooth normals from the true shape, its foot sunk into the ground and its bottom closed (it may stand on a
 * planter or a stem), subdivided by its size. A clipped plant is never a perfect solid: the surface is pushed in and out a little
 * by a smooth noise of where each vertex is (shared vertices, so it can't crack), and toned darker at the foot and lighter on top.
 * The 'clipped' surface (cartoon-material.ts) puts the clumps and cavities of the leaf on it.
 *
 * Frames: (x, z) on the ground, y up, `y0` the ground (0 for draped furniture). Colours are linear-ish Rgb as everywhere.
 */
import type { MeshBuilder } from './buildings.ts'
import { surfaceTag } from './cartoon-material.ts'

type Rgb = [number, number, number]
type V = [number, number, number]

const CLIPPED = surfaceTag('clipped')

// tunables
/** how far a foot goes into the ground, m (a draped ground showed light under a foot standing on it) */
export const TOPIARY_SINK = 0.12
/** sides round, per metre of radius, and the bounds */
const SIDES_PER_M = 16, SIDES_MIN = 10, SIDES_MAX = 22
/** a ball's bands from pole to pole, per metre of radius, and the bounds (≤ 22° a band: smooth at any size it is drawn) */
const BANDS_PER_M = 10, BANDS_MIN = 8, BANDS_MAX = 14
/** a ball is a little flattened, as box is clipped (height / width) */
const BALL_SQUASH = 0.93
/** the surface's push in and out, as a share of the radius, and the noise's cell in metres */
const WOBBLE = 0.035, WOBBLE_CELL = 0.55
/** tone from the foot to the crown (shares of the colour), and the mottle (±share) */
const TONE_FOOT = 0.7, TONE_CROWN = 1.22, MOTTLE = 0.07
/** a cone's foot: how far the swell runs up (share of h) and how much narrower the very foot is (share of r) */
const CONE_FOOT = 0.09, CONE_FOOT_IN = 0.86
/** a cone's tip: the share of h rounded over, and the radius share where the rounding starts */
const CONE_TIP = 0.07, CONE_TIP_R = 0.1
/** a clipped box's rounded edges, as a share of its smallest half-size */
const BOX_ROUND = 0.28

// ---- noise (own, so the module imports nothing that imports it)
function hash(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return s - Math.floor(s)
}
/** smooth 3D value noise in 0..1 */
function vnoise(x: number, y: number, z: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const fx = x - ix, fy = y - iy, fz = z - iz
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz)
  const l = (a: number, b: number, t: number): number => a + (b - a) * t
  const c = (dx: number, dy: number, dz: number): number => hash(ix + dx, iy + dy, iz + dz)
  return l(l(l(c(0, 0, 0), c(1, 0, 0), sx), l(c(0, 1, 0), c(1, 1, 0), sx), sy),
           l(l(c(0, 0, 1), c(1, 0, 1), sx), l(c(0, 1, 1), c(1, 1, 1), sx), sy), sz)
}

/** a vertex pushed `amt` metres along its normal by the noise where it is */
function wobble(p: V, n: V, amt: number, seed: number): V {
  const w = (vnoise(p[0] / WOBBLE_CELL + seed * 7.1, p[1] / WOBBLE_CELL, p[2] / WOBBLE_CELL - seed * 3.3) - 0.5) * 2 * amt
  return [p[0] + n[0] * w, p[1] + n[1] * w, p[2] + n[2] * w]
}

/** the tone at height share t (0 foot … 1 crown), mottled by where the vertex is */
function tone(c: Rgb, t: number, p: V, seed: number): Rgb {
  const k = (TONE_FOOT + (TONE_CROWN - TONE_FOOT) * Math.min(1, Math.max(0, t))) * (1 + (vnoise(p[0] * 1.3 + seed, p[1] * 1.3, p[2] * 1.3) - 0.5) * 2 * MOTTLE)
  return [c[0] * k, c[1] * k, c[2] * k]
}

/** an indexed mesh's vertices, appended to the builder; returns its first index */
function vert(out: MeshBuilder, p: V, n: V, c: Rgb, tag: number): number {
  out.positions.push(p[0], p[1], p[2])
  out.normals.push(n[0], n[1], n[2])
  out.uvs.push(0, 0)
  out.colors.push(c[0], c[1], c[2], tag)
  return out.positions.length / 3 - 1
}

/** a triangle wound to face its vertices' mean normal (the builder draws the side where (p1−p0)×(p2−p0) points against it) */
function tri(out: MeshBuilder, a: number, b: number, c: number): void {
  const P = out.positions, N = out.normals
  const ax = P[b * 3] - P[a * 3], ay = P[b * 3 + 1] - P[a * 3 + 1], az = P[b * 3 + 2] - P[a * 3 + 2]
  const bx = P[c * 3] - P[a * 3], by = P[c * 3 + 1] - P[a * 3 + 1], bz = P[c * 3 + 2] - P[a * 3 + 2]
  const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx
  if (cx * cx + cy * cy + cz * cz < 1e-14) return
  const mx = N[a * 3] + N[b * 3] + N[c * 3], my = N[a * 3 + 1] + N[b * 3 + 1] + N[c * 3 + 1], mz = N[a * 3 + 2] + N[b * 3 + 2] + N[c * 3 + 2]
  if (cx * mx + cy * my + cz * mz > 0) out.indices.push(a, c, b)
  else out.indices.push(a, b, c)
}

const sidesFor = (r: number): number => Math.max(SIDES_MIN, Math.min(SIDES_MAX, Math.round(r * SIDES_PER_M)))

/**
 * A surface of revolution as ONE indexed grid: `profile` is [radius, height] from the bottom up, `normals` its [radial, up] unit
 * normals (from the true shape, so the shading is smooth across every band). The bottom is closed with a flat disc on the same ring.
 */
function revolve(out: MeshBuilder, x: number, y0: number, z: number, profile: [number, number][], normals: [number, number][],
                 sides: number, colour: Rgb, tag: number, seed: number, wob: number): void {
  const H = profile[profile.length - 1][1] - profile[0][1] || 1
  const phase = hash(seed, 1, 2) * Math.PI * 2
  const rings: number[][] = []
  for (let k = 0; k < profile.length; k++) {
    const [r, y] = profile[k], [nr, ny] = normals[k]
    const row: number[] = []
    // (a ring of radius 0 is the pole: one vertex, so the fan closes on a point and no sliver opens)
    const count = r < 1e-5 ? 1 : sides
    for (let j = 0; j < count; j++) {
      const a = (j / sides) * Math.PI * 2 + phase
      const s = Math.sin(a), c = Math.cos(a)
      const n: V = count === 1 ? [0, ny >= 0 ? 1 : -1, 0] : [s * nr, ny, c * nr]
      let p: V = [x + s * r, y0 + y, z + c * r]
      if (count > 1 && k > 0) p = wobble(p, n, wob * r, seed)
      row.push(vert(out, p, n, tone(colour, (y - profile[0][1]) / H, p, seed), tag))
    }
    rings.push(row)
  }
  for (let k = 0; k + 1 < rings.length; k++) {
    const A = rings[k], B = rings[k + 1]
    for (let j = 0; j < sides; j++) {
      const j1 = (j + 1) % sides
      if (A.length === 1) tri(out, A[0], B[j], B[j1])
      else if (B.length === 1) tri(out, A[j], A[j1], B[0])
      else { tri(out, A[j], A[j1], B[j1]); tri(out, A[j], B[j1], B[j]) }
    }
  }
  // the bottom: a disc on the first ring's own positions, facing down
  const first = rings[0]
  if (first.length > 1) {
    const [r, y] = profile[0]
    const foot = tone(colour, 0, [x, y0 + y, z], seed)
    const c = vert(out, [x, y0 + y, z], [0, -1, 0], foot, tag)
    const ring = first.map((i) => vert(out, [out.positions[i * 3], out.positions[i * 3 + 1], out.positions[i * 3 + 2]], [0, -1, 0], foot, tag))
    for (let j = 0; j < sides; j++) tri(out, c, ring[(j + 1) % sides], ring[j])
    void r
  }
}

export interface TopiaryOpts {
  /** the surface the colours go on (default 'clipped') */
  tag?: number
  /** a seed, so no two are the same */
  seed?: number
  /** how far the foot is sunk below y0, m (default TOPIARY_SINK; 0 on a planter or a stem) */
  sink?: number
  /** the push in and out, share of the radius (default WOBBLE) */
  wobble?: number
}

/**
 * A CLIPPED BALL of box or yew, `r` its radius (half its width), sitting on y0 (sunk a little into it). Bands and sides grow with
 * its size, ≤ 22° a band, so it reads round however near.
 */
export function topiaryBall(out: MeshBuilder, x: number, y0: number, z: number, r: number, colour: Rgb, o: TopiaryOpts = {}): void {
  const sink = o.sink ?? TOPIARY_SINK, seed = o.seed ?? 0, ry = r * BALL_SQUASH
  const bands = Math.max(BANDS_MIN, Math.min(BANDS_MAX, Math.round(r * BANDS_PER_M)))
  // from where the sphere goes into the ground (or its foot, on a planter: a little flat) to the crown
  const cy = ry - sink
  const theta0 = sink > 0 ? Math.acos(Math.min(1, (cy) / ry)) : 0.35   // polar angle from the bottom pole where y = 0 … sink
  const profile: [number, number][] = [], normals: [number, number][] = []
  // (start a band below the ground line, so the foot ring is underground everywhere on a slope)
  const t0 = Math.max(0.05, theta0 - Math.PI / bands)
  for (let k = 0; k <= bands; k++) {
    const t = t0 + ((Math.PI - t0) * k) / bands   // polar angle from the bottom pole
    const s = Math.sin(t), c = -Math.cos(t)
    profile.push([k === bands ? 0 : r * s, cy + ry * c])
    const nr = s / r, ny = c / ry, m = Math.hypot(nr, ny) || 1
    normals.push(k === bands ? [0, 1] : [nr / m, ny / m])
  }
  revolve(out, x, y0, z, profile, normals, sidesFor(r), colour, o.tag ?? CLIPPED, seed, o.wobble ?? WOBBLE)
}

/**
 * A CLIPPED CONE of yew, `h` tall and `r` round at its foot: a slight swell at the foot, straight flanks, the tip rounded over.
 */
export function topiaryCone(out: MeshBuilder, x: number, y0: number, z: number, h: number, r: number, colour: Rgb, o: TopiaryOpts = {}): void {
  const sink = o.sink ?? TOPIARY_SINK, seed = o.seed ?? 0
  const slope = Math.atan2(r, h)           // the flank's lean from vertical
  const flank: [number, number] = [Math.cos(slope), Math.sin(slope)]   // its normal (radial, up)
  const rAt = (y: number): number => r * (1 - y / h)
  const yF = h * CONE_FOOT, yT = h * (1 - CONE_TIP)
  const profile: [number, number][] = [[r * CONE_FOOT_IN, -sink], [r * (CONE_FOOT_IN + 1) / 2, yF * 0.3], [rAt(yF) * 1.01, yF]]
  const normals: [number, number][] = [[1, -0.25], [0.97, 0], flank]
  // the flanks in bands (for the wobble and the tone to have somewhere to go)
  const FL = Math.max(3, Math.min(7, Math.round(h * 1.4)))
  for (let k = 1; k <= FL; k++) {
    const y = yF + ((Math.min(yT, h * (1 - CONE_TIP_R)) - yF) * k) / FL
    profile.push([rAt(y), y]); normals.push(flank)
  }
  // the tip rounded over
  const [rt, yt] = profile[profile.length - 1]
  profile.push([rt * 0.45, yt + (h - yt) * 0.65]); normals.push([flank[0] * 0.6, 0.8])
  profile.push([0, h]); normals.push([0, 1])
  for (const n of normals) { const m = Math.hypot(n[0], n[1]); n[0] /= m; n[1] /= m }
  revolve(out, x, y0, z, profile, normals, sidesFor(r), colour, o.tag ?? CLIPPED, seed, o.wobble ?? WOBBLE * 0.8)
}

/**
 * A CLIPPED BOX: a cube or block of box `w` (x) by `d` (z) by `h`, its edges rounded over as shears leave them, one watertight
 * surface (a lattice on the cube with every vertex shared), turned `heading` radians about y.
 */
export function topiaryBox(out: MeshBuilder, x: number, y0: number, z: number, w: number, d: number, h: number, colour: Rgb,
                           o: TopiaryOpts & { heading?: number; round?: number } = {}): void {
  const sink = o.sink ?? TOPIARY_SINK, seed = o.seed ?? 0, tag = o.tag ?? CLIPPED
  const hx = w / 2, hz = d / 2, hy = (h + sink) / 2
  const rad = Math.min(hx, hy, hz) * (o.round ?? BOX_ROUND)
  const inner: V = [hx - rad, hy - rad, hz - rad]
  const cosH = Math.cos(o.heading ?? 0), sinH = Math.sin(o.heading ?? 0)
  // the lattice's values along each axis, crowded at the edges where the rounding is: -1 … 1
  const e = 0.5   // (the rounding's own two steps, as shares of it)
  const axis = (half: number): number[] => {
    const f = rad / half
    const mids = Math.max(1, Math.round((half - rad) / 0.6))
    const v = [-1, -1 + f * e, -1 + f]
    for (let k = 1; k < mids; k++) v.push(-1 + f + ((2 - 2 * f) * k) / mids)
    v.push(1 - f, 1 - f * e, 1)
    return v
  }
  const AX = [axis(hx), axis(hy), axis(hz)], HALF = [hx, hy, hz]
  const index = new Map<string, number>()
  const at = (i: number, j: number, k: number): number => {
    const key = `${i},${j},${k}`
    const have = index.get(key)
    if (have !== undefined) return have
    const q = [AX[0][i] * hx, AX[1][j] * hy, AX[2][k] * hz]
    // the point on the rounded box: the nearest point of the inner box, then out by the rounding along the way to the lattice point
    const cl = q.map((v, a) => Math.max(-inner[a], Math.min(inner[a], v)))
    const dv = q.map((v, a) => v - cl[a])
    const m = Math.hypot(dv[0], dv[1], dv[2]) || 1
    let n: V = [dv[0] / m, dv[1] / m, dv[2] / m]
    let p: V = [cl[0] + n[0] * rad, cl[1] + n[1] * rad, cl[2] + n[2] * rad]
    // (the faces' flat middles: the lattice point itself is on the face)
    p = wobble(p, n, (o.wobble ?? WOBBLE) * Math.min(hx, hy, hz) * 0.7, seed)
    const t = (p[1] + hy) / (2 * hy)
    // to the world: turned, then on the ground (the box's bottom `sink` under y0)
    const wp: V = [x + p[0] * cosH + p[2] * sinH, y0 - sink + hy + p[1], z - p[0] * sinH + p[2] * cosH]
    n = [n[0] * cosH + n[2] * sinH, n[1], -n[0] * sinH + n[2] * cosH]
    const id = vert(out, wp, n, tone(colour, t, wp, seed), tag)
    index.set(key, id)
    return id
  }
  const L = AX.map((a) => a.length - 1)
  // the six faces: for each axis, the two ends; quads over the other two axes' lattice
  for (let a = 0; a < 3; a++) {
    const b = (a + 1) % 3, c = (a + 2) % 3
    for (const end of [0, L[a]]) {
      for (let u = 0; u < L[b]; u++) for (let v = 0; v < L[c]; v++) {
        const ijk = (uu: number, vv: number): number => {
          const g = [0, 0, 0]; g[a] = end; g[b] = uu; g[c] = vv
          return at(g[0], g[1], g[2])
        }
        const p00 = ijk(u, v), p10 = ijk(u + 1, v), p11 = ijk(u + 1, v + 1), p01 = ijk(u, v + 1)
        tri(out, p00, p10, p11); tri(out, p00, p11, p01)
      }
    }
  }
  void HALF
}

/** A standard: a clipped ball on a bare stem (a "tige"), the ball's foot at `stem` m. */
export function topiaryStandard(out: MeshBuilder, x: number, y0: number, z: number, stem: number, r: number, colour: Rgb, trunk: Rgb,
                                o: TopiaryOpts = {}): void {
  const sides = 6, tr = Math.max(0.04, r * 0.08)
  const prof: [number, number][] = [[tr * 1.3, -TOPIARY_SINK], [tr, stem * 0.5], [tr * 0.85, stem + r * 0.5]]
  revolve(out, x, y0, z, prof, prof.map(() => [1, 0] as [number, number]), sides, trunk, 0, o.seed ?? 0, 0)
  topiaryBall(out, x, y0 + stem, z, r, colour, { ...o, sink: 0 })
}
