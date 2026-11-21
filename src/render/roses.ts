/**
 * ROSES (owner, 2026-11-20: "build out the famous Bois de Boulogne rose garden. Use the roses for any other famous rose
 * gardens"). The plant library has no rose (Trail Trainer's plantgen), so they are drawn here, a few quads each, in the
 * shared cartoon surfaces: a bush is a leafy foot (`foliage`) under a cap of bloom (`blossom`, whose shader dots each
 * 22 cm cell with a flower in the cap's colour). One variety to a bed, as a rosarium plants them.
 *
 * Two ways in:
 *  - the BAKED beds (render/garden.ts): an OSM `landuse=flowerbed` inside one of FLOWER_GARDENS' rings (render/flower-gardens.ts) is planted with roses
 *    instead of the season's cushions. No rebake: the ring is read at runtime.
 *  - a LANDMARK builder (Bagatelle's pergola and garlands, the Jardin des Plantes's roseraie, Golden Gate Park's Rose
 *    Garden): `roseBed`, `standardRose`, `climber`, `swag` and `pergola` in its own frame.
 *
 * Heights are off the ground. Every number a look depends on is in ROSE.
 */
import type { MeshBuilder } from './buildings.ts'
import { surfaceTag } from './cartoon-material.ts'

type Rgb = [number, number, number]
type V = [number, number, number]
type Point = { x: number; z: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const ROSE = {
  /** metres between bushes in a bed, on a staggered grid */
  BUSH_STEP: 0.72,
  /** a bush's height, from..to */
  BUSH_H: [0.55, 0.85] as [number, number],
  /** a bush's half-width as a share of its height */
  BUSH_R: 0.5,
  BUSH_SIDES: 6,
  /** never more than this many bushes to a bed (the step widens instead) */
  BED_MAX: 900,
  /** the leafy share of a bush's height, under the bloom */
  LEAF_SHARE: 0.42,
  /** standard ("tige") roses down a narrow bed's spine: metres apart (0: none), head height, head radius */
  STANDARD_STEP: 2.6,
  STANDARD_H: 1.55,
  STANDARD_HEAD: 0.36,
  /** a weeping standard's umbrella: crown height, its spread, how far the skirt falls */
  WEEPING_H: 2.3,
  WEEPING_R: 0.95,
  WEEPING_FALL: 1.5,
  /** a bed wider than this (its narrow way across) is a lawn the mapper called a bed: lawn, with a rose border if small */
  BED_MAX_W: 4.2,
  /** …and a border only when it is no bigger than this, m² (Bagatelle's long lawns are bare) */
  BORDER_MAX_AREA: 200,
  /** a border row's distance in from the edge */
  BORDER_IN: 0.55,
  /** the box edging round a rose bed: height, width (0 height: none) */
  EDGE_H: 0.24,
  EDGE_W: 0.22,
  /** a climber on its post: how tall, how fat */
  CLIMBER_H: 2.5,
  CLIMBER_R: 0.36,
  /** a garland between two posts: the sag at mid-span and the thickness of the rope of roses */
  SWAG_SAG: 0.55,
  SWAG_T: 0.26,
  /** a pergola: post spacing along it, width, height, cross-beam spacing */
  PERGOLA_STEP: 2.4,
  PERGOLA_W: 2.6,
  PERGOLA_H: 2.55,
  PERGOLA_BEAM: 0.8,
}

/** varieties, linear colours (they come out a good deal lighter than they read): reds, pinks, salmon, apricot, yellow, white, mauve */
export const ROSE_VARIETIES: Rgb[] = [
  [0.42, 0.025, 0.04], [0.3, 0.015, 0.05], [0.58, 0.05, 0.06], [0.62, 0.17, 0.3], [0.72, 0.42, 0.48],
  [0.7, 0.26, 0.17], [0.72, 0.44, 0.17], [0.7, 0.56, 0.1], [0.74, 0.71, 0.6], [0.66, 0.15, 0.12],
  [0.45, 0.22, 0.42], [0.55, 0.06, 0.26], [0.75, 0.6, 0.45],
]
export const ROSE_LEAF: Rgb = [0.035, 0.085, 0.03]
const STEM: Rgb = [0.1, 0.085, 0.05]
/** posts, beams and pergolas: Paris's park green */
export const TRELLIS: Rgb = [0.03, 0.07, 0.05]

const FOLIAGE = surfaceTag('foliage')
const BLOSSOM = surfaceTag('blossom')
const FIXED = 0

export const roseNoise = (a: number, b: number): number => {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
  return v - Math.floor(v)
}
const toned = (c: Rgb, f: number): Rgb => [c[0] * f, c[1] * f, c[2] * f]
/** the bed's variety, from its seed */
export const varietyOf = (seed: number): Rgb => ROSE_VARIETIES[Math.floor(roseNoise(seed, 11) * ROSE_VARIETIES.length) % ROSE_VARIETIES.length]

/**
 * A round lump about (x, z): rings of [height, radius] from the bottom up, each band its own colour and surface, closed by a
 * flat top. `phase` turns it so no two neighbours line up.
 */
export function lump(out: MeshBuilder, x: number, y: number, z: number, levels: [number, number][], bands: { c: Rgb; tag: number }[], sides: number, phase: number, seed: number): void {
  const at = (k: number, l: number): V => {
    const a = (k / sides) * Math.PI * 2 + phase
    const r = levels[l][1] * (0.84 + roseNoise(seed + (k % sides), l) * 0.32)
    return [x + Math.sin(a) * r, y + levels[l][0], z + Math.cos(a) * r]
  }
  for (let l = 0; l + 1 < levels.length; l++) {
    const [y0, r0] = levels[l], [y1, r1] = levels[l + 1]
    const up = (r0 - r1) / Math.max(0.01, y1 - y0), len = Math.hypot(1, up)
    const b = bands[Math.min(l, bands.length - 1)]
    for (let k = 0; k < sides; k++) {
      const a = ((k + 0.5) / sides) * Math.PI * 2 + phase
      out.quad([at(k, l), at(k + 1, l), at(k + 1, l + 1), at(k, l + 1)], [Math.sin(a) / len, up / len, Math.cos(a) / len], UV, toned(b.c, 0.88 + roseNoise(k + seed, l) * 0.24), b.tag)
    }
  }
  const top = levels.length - 1, c = bands[bands.length - 1].c
  for (let k = 0; k + 2 < sides; k += 2) out.quad([at(0, top), at(k + 1, top), at(k + 2, top), at(Math.min(k + 3, sides), top)], [0, 1, 0], UV, c, bands[bands.length - 1].tag)
}

/** A bush rose: a leafy foot under a cap of bloom, `h` tall. */
export function roseBush(out: MeshBuilder, x: number, y: number, z: number, h: number, bloom: Rgb, seed: number): void {
  const R = h * ROSE.BUSH_R, L = h * ROSE.LEAF_SHARE
  lump(out, x, y, z, [[0, R * 0.45], [L, R], [h * 0.82, R * 0.86], [h, R * 0.42]],
    [{ c: ROSE_LEAF, tag: FOLIAGE }, { c: bloom, tag: BLOSSOM }, { c: bloom, tag: BLOSSOM }], ROSE.BUSH_SIDES, seed * 0.9, seed)
}

/** a thin upright of square section */
function stake(out: MeshBuilder, x: number, z: number, y0: number, y1: number, r: number, c: Rgb): void {
  const q: Point[] = [{ x: x + r, z: z + r }, { x: x + r, z: z - r }, { x: x - r, z: z - r }, { x: x - r, z: z + r }]
  const n: [number, number][] = [[1, 0], [0, -1], [-1, 0], [0, 1]]
  for (let i = 0; i < 4; i++) {
    const a = q[(i + 1) % 4], b = q[i]
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [n[i][0], 0, n[i][1]], UV, c, FIXED)
  }
}

/** A standard ("rosier tige"): a bare stem with a ball of roses on top at `h`. `weeping`: a pleureur on its umbrella frame. */
export function standardRose(out: MeshBuilder, x: number, y: number, z: number, bloom: Rgb, seed: number, weeping = false, h = weeping ? ROSE.WEEPING_H : ROSE.STANDARD_H): void {
  if (weeping) {
    const R = ROSE.WEEPING_R, F = ROSE.WEEPING_FALL
    stake(out, x, z, y, y + h, 0.035, STEM)
    // the crown and the curtain of shoots falling from it, bloom all the way down
    lump(out, x, y + h - F, z, [[0, R * 0.98], [F * 0.55, R], [F, R * 0.86], [F + 0.25, R * 0.5], [F + 0.38, 0.12]],
      [{ c: bloom, tag: BLOSSOM }, { c: bloom, tag: BLOSSOM }, { c: ROSE_LEAF, tag: FOLIAGE }, { c: bloom, tag: BLOSSOM }], 8, seed, seed)
    return
  }
  const r = ROSE.STANDARD_HEAD
  stake(out, x, z, y, y + h - r * 0.6, 0.022, STEM)
  lump(out, x, y + h - r, z, [[0, r * 0.3], [r * 0.5, r * 0.95], [r * 1.25, r * 0.9], [r * 1.7, r * 0.35]],
    [{ c: ROSE_LEAF, tag: FOLIAGE }, { c: bloom, tag: BLOSSOM }, { c: bloom, tag: BLOSSOM }], 6, seed, seed)
}

/** A climber trained up a post, `h` tall: the green post and a column of leaf and bloom round it. */
export function climber(out: MeshBuilder, x: number, y: number, z: number, bloom: Rgb, seed: number, h = ROSE.CLIMBER_H, post = true): void {
  if (post) stake(out, x, z, y, y + h + 0.12, 0.05, TRELLIS)
  const R = ROSE.CLIMBER_R
  lump(out, x, y, z, [[0, R * 0.55], [h * 0.3, R], [h * 0.65, R * 1.05], [h, R * 0.7]],
    [{ c: ROSE_LEAF, tag: FOLIAGE }, { c: bloom, tag: BLOSSOM }, { c: bloom, tag: BLOSSOM }], 6, seed, seed)
}

/** a square tube along a polyline: a rope of roses, a beam */
function tube(out: MeshBuilder, pts: V[], w: number, h: number, c: Rgb, tag: number): void {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]
    const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz) || 1
    const nx = -dz / L, nz = dx / L
    const hw = w / 2, hh = h / 2
    const P = (p: V, s: number, t: number): V => [p[0] + nx * hw * s, p[1] + hh * t, p[2] + nz * hw * s]
    out.quad([P(a, 1, -1), P(b, 1, -1), P(b, 1, 1), P(a, 1, 1)], [nx, 0, nz], UV, c, tag)
    out.quad([P(b, -1, -1), P(a, -1, -1), P(a, -1, 1), P(b, -1, 1)], [-nx, 0, -nz], UV, c, tag)
    out.quad([P(a, -1, 1), P(a, 1, 1), P(b, 1, 1), P(b, -1, 1)], [0, 1, 0], UV, toned(c, 1.1), tag)
    out.quad([P(a, 1, -1), P(a, -1, -1), P(b, -1, -1), P(b, 1, -1)], [0, -1, 0], UV, toned(c, 0.7), tag)
  }
}

/** A garland of roses hung between two posts' heads, sagging `sag` at mid-span. Heights are each end's own. */
export function swag(out: MeshBuilder, a: V, b: V, bloom: Rgb, sag = ROSE.SWAG_SAG): void {
  const n = 7, pts: V[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t])
  }
  tube(out, pts, ROSE.SWAG_T, ROSE.SWAG_T, bloom, BLOSSOM)
}

/**
 * A rose PERGOLA from a to b: pairs of green posts every PERGOLA_STEP, a beam along each side, cross-pieces over the walk,
 * a climber up every post and roses run along the top in places. `ground(x, z)` the ground under a point.
 */
export function pergola(out: MeshBuilder, a: Point, b: Point, ground: (x: number, z: number) => number, seed: number, w = ROSE.PERGOLA_W, h = ROSE.PERGOLA_H): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  if (L < 1) return
  const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L, nx = -uz, nz = ux
  const n = Math.max(1, Math.round(L / ROSE.PERGOLA_STEP))
  const at = (t: number, s: number): Point => ({ x: a.x + ux * L * t + nx * s * w / 2, z: a.z + uz * L * t + nz * s * w / 2 })
  for (const s of [-1, 1]) {
    const beam: V[] = []
    for (let k = 0; k <= n; k++) {
      const p = at(k / n, s), y = ground(p.x, p.z)
      stake(out, p.x, p.z, y, y + h, 0.06, TRELLIS)
      climber(out, p.x - nx * s * 0.15, y, p.z - nz * s * 0.15, varietyOf(seed + k * 2 + (s > 0 ? 1 : 0)), seed + k * 7 + s, h * 0.96, false)
      beam.push([p.x, y + h + 0.05, p.z])
    }
    tube(out, beam, 0.1, 0.16, TRELLIS, FIXED)
  }
  const m = Math.max(1, Math.round(L / ROSE.PERGOLA_BEAM))
  for (let k = 0; k <= m; k++) {
    const p = at(k / m, -1.15), q = at(k / m, 1.15)
    const y = ground((p.x + q.x) / 2, (p.z + q.z) / 2) + h + 0.18
    tube(out, [[p.x, y, p.z], [q.x, y, q.z]], 0.07, 0.1, TRELLIS, FIXED)
  }
  // the roses over the top: a mat along each side, and across in places where the shoots have met
  for (let k = 0; k < n; k++) {
    const bloom = varietyOf(seed + k * 2)
    for (const s of [-1, 1]) {
      const p = at((k + 0.1) / n, s * 0.82), q = at((k + 0.9) / n, s * 0.82)
      const y = ground(p.x, p.z) + h + 0.26
      tube(out, [[p.x, y, p.z], [q.x, y, q.z]], 0.7, 0.3, bloom, BLOSSOM)
    }
    if (roseNoise(seed, k) < 0.45) {
      const p = at((k + 0.5) / n, -0.5), q = at((k + 0.5) / n, 0.5)
      const y = ground(p.x, p.z) + h + 0.3
      tube(out, [[p.x, y, p.z], [q.x, y, q.z]], 0.9, 0.26, bloom, BLOSSOM)
    }
  }
}

export const insideRing = (r: Point[], x: number, z: number): boolean => {
  let c = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) c = !c
  }
  return c
}
const areaOf = (r: Point[]): number => {
  let a = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j].x * r[i].z - r[i].x * r[j].z
  return Math.abs(a / 2)
}

/** What a bed is to a rosarium, from its shape: a rose bed, a lawn with a rose border, or a lawn. The spine is a rose bed's long axis. */
export interface RoseBedShape { role: 'roses' | 'border' | 'lawn'; width: number; spine: [Point, Point]; area: number }
export function roseBedShape(ring: Point[]): RoseBedShape {
  let width = Infinity, spine: [Point, Point] = [ring[0], ring[0]]
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length]
    const L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.4) continue
    const ux = (q.x - p.x) / L, uz = (q.z - p.z) / L
    let v0 = Infinity, v1 = -Infinity, u0 = Infinity, u1 = -Infinity
    for (const r of ring) {
      const v = -(r.x - p.x) * uz + (r.z - p.z) * ux, u = (r.x - p.x) * ux + (r.z - p.z) * uz
      v0 = Math.min(v0, v); v1 = Math.max(v1, v); u0 = Math.min(u0, u); u1 = Math.max(u1, u)
    }
    if (v1 - v0 < width) {
      width = v1 - v0
      const vm = (v0 + v1) / 2, m = Math.min(1.2, (u1 - u0) / 4)
      const P = (u: number): Point => ({ x: p.x + ux * u - uz * vm, z: p.z + uz * u + ux * vm })
      spine = [P(u0 + m), P(u1 - m)]
    }
  }
  const area = areaOf(ring)
  const role = width <= ROSE.BED_MAX_W ? 'roses' : area <= ROSE.BORDER_MAX_AREA ? 'border' : 'lawn'
  return { role, width, spine, area }
}

/** the step that keeps a bed under BED_MAX bushes */
export const bushStep = (area: number): number => Math.max(ROSE.BUSH_STEP, Math.sqrt(area / ROSE.BED_MAX))

/**
 * A bed's roses in the part of it inside x0..x1, z0..z1: bushes on a staggered grid, the bed's one variety, and standards
 * down the spine of a narrow bed. `y(x, z)` the height of the bed's top there (0 for a draped tile).
 */
export function roseBed(out: MeshBuilder, ring: Point[], shape: RoseBedShape, seed: number, x0: number, z0: number, x1: number, z1: number, y: (x: number, z: number) => number = () => 0): void {
  const bloom = varietyOf(seed)
  const step = bushStep(shape.area)
  const [h0, h1] = ROSE.BUSH_H
  for (let zi = Math.ceil(z0 / step); zi * step < z1; zi++) {
    const z = zi * step
    for (let x = (Math.ceil(x0 / step - (zi & 1) * 0.5) + (zi & 1) * 0.5) * step; x < x1; x += step) {
      const px = x + (roseNoise(x, z + 3) - 0.5) * step * 0.3, pz = z + (roseNoise(x + 3, z) - 0.5) * step * 0.3
      if (!insideRing(ring, px, pz)) continue
      roseBush(out, px, y(px, pz), pz, h0 + roseNoise(z, x) * (h1 - h0), toned(bloom, 0.9 + roseNoise(x, z + 9) * 0.2), Math.floor(px * 7 + pz * 13))
    }
  }
  if (ROSE.STANDARD_STEP <= 0) return
  const [a, b] = shape.spine
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  const n = Math.max(1, Math.round(L / ROSE.STANDARD_STEP))
  for (let k = 0; k <= n; k++) {
    const px = a.x + ((b.x - a.x) * k) / n, pz = a.z + ((b.z - a.z) * k) / n
    if (px < x0 || px >= x1 || pz < z0 || pz >= z1) continue
    standardRose(out, px, y(px, pz), pz, toned(bloom, 1.05), seed * 31 + k)
  }
}

/** A row of bushes just inside a lawn's edge, its part in x0..x1, z0..z1 (a lawn the mapper called a bed, edged with roses). */
export function roseBorder(out: MeshBuilder, ring: Point[], seed: number, x0: number, z0: number, x1: number, z1: number, y: (x: number, z: number) => number = () => 0): void {
  const bloom = varietyOf(seed)
  const N = ring.length
  // (each vertex pulled in along its bisector: the beds are convex or nearly so)
  let cx = 0, cz = 0
  for (const p of ring) { cx += p.x; cz += p.z }
  cx /= N; cz /= N
  const inner = ring.map((p) => { const d = Math.hypot(p.x - cx, p.z - cz) || 1, k = Math.max(0, d - ROSE.BORDER_IN) / d; return { x: cx + (p.x - cx) * k, z: cz + (p.z - cz) * k } })
  const [h0, h1] = ROSE.BUSH_H
  for (let i = 0; i < N; i++) {
    const p = inner[i], q = inner[(i + 1) % N]
    const L = Math.hypot(q.x - p.x, q.z - p.z)
    const n = Math.floor(L / ROSE.BUSH_STEP)
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, px = p.x + (q.x - p.x) * t, pz = p.z + (q.z - p.z) * t
      if (px < x0 || px >= x1 || pz < z0 || pz >= z1 || !insideRing(ring, px, pz)) continue
      roseBush(out, px, y(px, pz), pz, h0 + roseNoise(pz, px) * (h1 - h0), toned(bloom, 0.9 + roseNoise(px, pz) * 0.2), i * 37 + k)
    }
  }
}
