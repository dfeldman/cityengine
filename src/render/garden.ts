/**
 * The planted parts of a French garden (PackedGarden; owner, 2026-10-30: "in Paris many of the parks have hedges, neat rows of
 * shrubs, flowers etc and not a wild landscape of trees"): clipped hedges, a pleached row of limes on its trunks, flower beds,
 * clipped yews, and the gravel and lawn they stand in. OSM's hedges and beds and the plans traced from the aerial photographs
 * (tools/gardens/) all arrive here the same way.
 *
 * Filed by tile the first time they are asked for, like the park railings. Heights are off the ground: the tile drapes them.
 */
import { MeshBuilder } from './buildings.ts'
import { surfaceTag } from './cartoon-material.ts'
import { unpackPoints, type PackedGarden } from '../city/package.ts'

type Point = { x: number; z: number }
type Rgb = [number, number, number]
type V = [number, number, number]
const UV: [[number, number], [number, number], [number, number], [number, number]] = [[0, 0], [1, 0], [1, 1], [0, 1]]

// (linear colours: they come out a good deal lighter than these numbers read)
const HEDGE: Rgb = [0.035, 0.085, 0.03]
const HEDGE_FOOT: Rgb = [0.02, 0.045, 0.018]
const HEDGE_TOP: Rgb = [0.06, 0.13, 0.042]
const LIME: Rgb = [0.07, 0.125, 0.05]
const LIME_FOOT: Rgb = [0.04, 0.08, 0.028]
const LIME_TOP: Rgb = [0.09, 0.155, 0.055]
const TRUNK: Rgb = [0.17, 0.13, 0.1]
const YEW: Rgb = [0.05, 0.11, 0.055]

/** the ground's own tints: the pale raked stabilisé, the mown grass, the bed's soil */
export const GARDEN_TINT: Record<'gravel' | 'lawn' | 'bed', Rgb> = {
  gravel: [0.72, 0.67, 0.55], lawn: [0.3, 0.45, 0.2], bed: [0.2, 0.17, 0.11],
}

/** a season's planting: each bed takes one, massed, as a gardener does it, its leaf showing through */
const PLANTINGS: Rgb[][] = [
  [[0.5, 0.05, 0.05], [0.58, 0.09, 0.06]],
  [[0.68, 0.64, 0.56], [0.56, 0.54, 0.48]],
  [[0.5, 0.13, 0.27], [0.62, 0.27, 0.38]],
  [[0.17, 0.08, 0.34], [0.28, 0.17, 0.45]],
  [[0.64, 0.3, 0.04], [0.6, 0.16, 0.04]],
  [[0.64, 0.5, 0.07], [0.68, 0.62, 0.22]],
]
const LEAF: Rgb = [0.05, 0.12, 0.04]
const plantingOf = (seed: number): number => Math.floor(noise(seed, 7) * PLANTINGS.length) % PLANTINGS.length

const CLIPPED = surfaceTag('clipped')
const BLOSSOM = surfaceTag('blossom')
const FOLIAGE = surfaceTag('foliage')
/** an English park's shrubs: laurel, spiraea's lighter leaf, box, a purple-leaved berberis */
const SHRUB: Rgb[] = [[0.09, 0.2, 0.06], [0.13, 0.25, 0.07], [0.07, 0.17, 0.07], [0.11, 0.21, 0.09], [0.17, 0.12, 0.09]]

const noise = (a: number, b: number): number => {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
  return v - Math.floor(v)
}
const toned = (c: Rgb, f: number): Rgb => [c[0] * f, c[1] * f, c[2] * f]

/** the vertical face from a to b, from y0 to y1, facing the way a→b's left hand does */
function face(out: MeshBuilder, a: Point, b: Point, y0: number, y1: number, nx: number, nz: number, c: Rgb): void {
  out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [nx, 0, nz], UV, c, 0)
}

/** the same for clipped leaves, which take the light from above whichever way they face: a hedge's shaded side is not black */
function leafFace(out: MeshBuilder, a: Point, b: Point, y0: number, y1: number, nx: number, nz: number, c: Rgb): void {
  out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [nx * 0.55, 0.83, nz * 0.55], UV, c, CLIPPED)
}

/** a length of clipped hedge from a to b: its sides darker at the foot, a lighter top; the ends only where it `caps` */
function hedgePiece(out: MeshBuilder, a: Point, b: Point, y0: number, h: number, w: number, foot: Rgb, side: Rgb, top: Rgb, capA: boolean, capB: boolean): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  if (L < 0.05) return
  const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
  const nx = -uz, nz = ux
  const hw = w / 2
  const P = (p: Point, s: number): Point => ({ x: p.x + nx * hw * s, z: p.z + nz * hw * s })
  const al = P(a, 1), ar = P(a, -1), bl = P(b, 1), br = P(b, -1)
  const y1 = y0 + h
  const band = y0 + h * 0.3
  // (each side wound to face out: the left side a→b, the right side b→a)
  if (y0 > 1) {
    leafySide(out, bl, al, y0, y1, nx, nz, side)
    leafySide(out, ar, br, y0, y1, -nx, -nz, side)
  } else {
    leafFace(out, bl, al, y0, band, nx, nz, foot)
    leafFace(out, bl, al, band, y1, nx, nz, side)
    leafFace(out, ar, br, y0, band, -nx, -nz, foot)
    leafFace(out, ar, br, band, y1, -nx, -nz, side)
  }
  if (y0 > 1) {
    // (a crown's top, a shallow ridge down its middle: it is leaves, not a slab)
    const rise = 0.3 + noise(a.x, a.z) * 0.5
    const am: V = [a.x, y1 + rise, a.z], bm: V = [b.x, y1 + rise, b.z]
    const up = hw / Math.hypot(hw, rise), lean = rise / Math.hypot(hw, rise)
    out.quad([[al.x, y1, al.z], [bl.x, y1, bl.z], bm, am], [nx * lean, up, nz * lean], UV, top, CLIPPED)
    out.quad([am, bm, [br.x, y1, br.z], [ar.x, y1, ar.z]], [-nx * lean, up, -nz * lean], UV, toned(top, 1.14), CLIPPED)
  } else out.quad([[al.x, y1, al.z], [bl.x, y1, bl.z], [br.x, y1, br.z], [ar.x, y1, ar.z]], [0, 1, 0], UV, top, CLIPPED)
  if (capA) leafFace(out, al, ar, y0, y1, -ux, -uz, side)
  if (capB) leafFace(out, br, bl, y0, y1, ux, uz, side)
  // (a crown on trunks: its underside is what you ride under)
  if (y0 > 1) out.quad([[ar.x, y0, ar.z], [br.x, y0, br.z], [bl.x, y0, bl.z], [al.x, y0, al.z]], [0, -1, 0], UV, foot, CLIPPED)
}

/**
 * A pleached crown's side from a to b, facing (nx, nz): leaves, so a grid pushed in and out by where each corner stands (a piece's
 * corners meet its neighbour's) and mottled cell by cell. The clipped wall of limes is even from afar and never flat from under it.
 */
function leafySide(out: MeshBuilder, a: Point, b: Point, y0: number, y1: number, nx: number, nz: number, c: Rgb): void {
  const COLS = 2, ROWS = 3
  const corner = (i: number, j: number): V => {
    const u = i / COLS
    const x = a.x + (b.x - a.x) * u, z = a.z + (b.z - a.z) * u
    const y = y0 + ((y1 - y0) * j) / ROWS
    const push = (noise(x * 1.7 + j * 3.1, z * 1.7) - 0.5) * 0.7
    return [x + nx * push, y + (j > 0 && j < ROWS ? (noise(z + j, x) - 0.5) * 0.5 : 0), z + nz * push]
  }
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const lit = 0.72 + (0.34 * (j + 0.5)) / ROWS + noise(a.x + i * 5.3, a.z + j * 7.9) * 0.3
      out.quad([corner(i, j), corner(i + 1, j), corner(i + 1, j + 1), corner(i, j + 1)], [nx * 0.55, 0.83, nz * 0.55], UV, toned(c, lit), CLIPPED)
    }
  }
}

/** a trunk, a plain square post */
function trunk(out: MeshBuilder, p: Point, y1: number): void {
  const r = 0.14
  const q = [{ x: p.x + r, z: p.z + r }, { x: p.x + r, z: p.z - r }, { x: p.x - r, z: p.z - r }, { x: p.x - r, z: p.z + r }]
  const n: [number, number][] = [[1, 0], [0, -1], [-1, 0], [0, 1]]
  for (let i = 0; i < 4; i++) face(out, q[(i + 1) % 4], q[i], 0, y1, n[i][0], n[i][1], TRUNK)
}

/** a clipped yew: a cone, a ball on a short foot, or a cube */
function topiary(out: MeshBuilder, x: number, z: number, h: number, shape: number, seed: number): void {
  if (shape === 3) return shrub(out, x, z, h, seed)
  const c = toned(YEW, 0.9 + noise(seed, 1) * 0.3)
  if (shape === 2) {
    const w = h * 0.45
    hedgePiece(out, { x: x - w, z }, { x: x + w, z }, 0, h, w * 2, toned(c, 0.8), c, toned(c, 1.3), true, true)
    return
  }
  const sides = 8
  const ring = (r: number, k: number): Point => ({ x: x + Math.sin((k / sides) * Math.PI * 2) * r, z: z + Math.cos((k / sides) * Math.PI * 2) * r })
  // radii up the shape: a cone tapers, a ball swells and closes
  const levels: [number, number][] = shape === 0
    ? [[0, h * 0.2], [h * 0.12, h * 0.2], [h, 0]]
    : [[0, 0.1], [h * 0.22, 0.1], [h * 0.3, h * 0.38], [h * 0.65, h * 0.48], [h, 0]]
  for (let l = 1; l < levels.length; l++) {
    const [y0, r0] = levels[l - 1], [y1, r1] = levels[l]
    const tone = toned(c, 0.82 + (0.42 * l) / levels.length)
    for (let k = 0; k < sides; k++) {
      const a = ring(r0, k), b = ring(r0, k + 1), p = ring(r1, k), q = ring(r1, k + 1)
      const mx = Math.sin(((k + 0.5) / sides) * Math.PI * 2), mz = Math.cos(((k + 0.5) / sides) * Math.PI * 2)
      const up = (r0 - r1) / Math.max(0.01, y1 - y0)
      const len = Math.hypot(1, up)
      out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [q.x, y1, q.z], [p.x, y1, p.z]], [mx / len, up / len, mz / len], UV, tone, CLIPPED)
    }
  }
}

/**
 * A SHRUB, unclipped (Batch 1's parks, 2026-10-31): a laurel, a spiraea, a mound as wide as it is high that belongs to no shape. Seven corners pushed about by where it
 * stands, three bands, leaf on it, and no two the same green. A ball of clipped yew at the foot of an English park's trees read as a topiary show.
 */
function shrub(out: MeshBuilder, x: number, z: number, h: number, seed: number): void {
  const sides = 7
  const leaf = SHRUB[Math.floor(noise(seed, 3) * SHRUB.length) % SHRUB.length]
  const levels: [number, number][] = [[0, 0.62], [h * 0.38, 0.82], [h * 0.75, 0.56], [h, 0.12]]
  const R = h * (0.62 + noise(seed, 5) * 0.28)
  const corner = (k: number, l: number): V => {
    const a = ((k % sides) / sides) * Math.PI * 2 + seed * 0.7
    const m = levels[l][1] * R * (0.78 + noise(seed + (k % sides), l + 2) * 0.44)
    return [x + Math.sin(a) * m, levels[l][0], z + Math.cos(a) * m]
  }
  for (let l = 0; l + 1 < levels.length; l++) {
    const tone = toned(leaf, 0.72 + (0.42 * (l + 1)) / levels.length)
    for (let k = 0; k < sides; k++) {
      const a = ((k + 0.5) / sides) * Math.PI * 2 + seed * 0.7
      out.quad([corner(k, l), corner(k + 1, l), corner(k + 1, l + 1), corner(k, l + 1)], [Math.sin(a) * 0.5, 0.86, Math.cos(a) * 0.5], UV, toned(tone, 0.9 + noise(k + seed, l) * 0.22), FOLIAGE)
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

/** a bed's flowers in the part of it in this rectangle: low mounds in lines, one planting to a bed, the leaf between them */
function flowers(out: MeshBuilder, ring: Point[], seed: number, step: number, x0: number, z0: number, x1: number, z1: number): void {
  const palette = PLANTINGS[plantingOf(seed)]
  for (let x = Math.ceil(x0 / step) * step; x < x1; x += step) {
    for (let z = Math.ceil(z0 / step) * step; z < z1; z += step) {
      const px = x + (noise(x, z + 3) - 0.5) * step * 0.5, pz = z + (noise(x + 3, z) - 0.5) * step * 0.5
      if (!insideRing(ring, px, pz)) continue
      const n = noise(x, z)
      const f = toned(palette[n < 0.7 ? 0 : 1], 0.9 + noise(z, x + 9) * 0.3)
      const h = 0.14 + noise(z, x) * 0.1
      const w = step * (0.42 + noise(x + 5, z) * 0.2)
      // a cushion of its own leaves
      const P: V[] = [[px - w, 0.06, pz - w], [px + w, 0.06, pz - w], [px + w, 0.06, pz + w], [px - w, 0.06, pz + w]]
      const t = w * 0.62
      const Q: V[] = [[px - t, h, pz - t], [px + t, h, pz - t], [px + t, h, pz + t], [px - t, h, pz + t]]
      const normals: V[] = [[0, 0.7, -0.7], [0.7, 0.7, 0], [0, 0.7, 0.7], [-0.7, 0.7, 0]]
      const sides = toned(LEAF, 0.8)
      for (let i = 0; i < 4; i++) out.quad([P[(i + 1) % 4], P[i], Q[i], Q[(i + 1) % 4]], normals[i], UV, n < 0.25 ? sides : f, n < 0.25 ? CLIPPED : BLOSSOM)
      // (its blossoms in the shader: the library's real flowers are about 5,000 triangles each, twelve million in view at the Luxembourg)
      out.quad([Q[3], Q[2], Q[1], Q[0]], [0, 1, 0], UV, f, BLOSSOM)
    }
  }
}

/** the low iron hoops along a Paris lawn, dark green, knee high, a metre to a hoop */
function hoops(out: MeshBuilder, a: Point, b: Point): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  const n = Math.max(1, Math.round(L / 1.1))
  const IRON: Rgb = [0.015, 0.05, 0.03]
  const nx = -(b.z - a.z) / L, nz = (b.x - a.x) / L
  const at = (k: number, u: number, y: number): V => {
    const t = (k + u) / n
    return [a.x + (b.x - a.x) * t, y, a.z + (b.z - a.z) * t]
  }
  const shape: [number, number][] = [[0, 0], [0.12, 0.34], [0.5, 0.44], [0.88, 0.34], [1, 0]]
  for (let k = 0; k < n; k++) {
    for (let i = 1; i < shape.length; i++) {
      const [u0, y0] = shape[i - 1], [u1, y1] = shape[i]
      const p = at(k, u0, y0), q = at(k, u1, y1)
      const lift = 0.025
      out.quad([p, q, [q[0], q[1] + lift, q[2]], [p[0], p[1] + lift, p[2]]], [nx, 0, nz], UV, IRON, 0)
      out.quad([[p[0], p[1] + lift, p[2]], [q[0], q[1] + lift, q[2]], q, p], [-nx, 0, -nz], UV, IRON, 0)
    }
  }
}

interface Piece { a: Point; b: Point; h: number; w: number; y0: number; capA: boolean; capB: boolean; post: boolean; seed: number }
interface Bed { ring: Point[]; x0: number; z0: number; x1: number; z1: number; seed: number; step: number; rim: boolean }

/** A city's garden, filed by tile. */
export class GardenTiles {
  private readonly pieces = new Map<string, Piece[]>()
  private readonly yews = new Map<string, number[]>()
  private readonly beds = new Map<string, Bed[]>()
  private readonly flats = new Map<string, { ring: Point[]; kind: 'gravel' | 'lawn' | 'bed' }[]>()

  constructor(g: PackedGarden, private readonly tile: number) {
    const at = (x: number, z: number): string => `${Math.floor(x / tile)},${Math.floor(z / tile)}`
    const push = <T>(m: Map<string, T[]>, k: string, v: T): void => { const l = m.get(k); if (l) l.push(v); else m.set(k, [v]) }
    // every row, cut into pieces of up to 3 m: a piece belongs to the tile it starts in, and a piece follows the ground
    g.hedges.forEach((row, ri) => {
      const pts = unpackPoints(row.points)
      const spacing = row.y0 ? (row.spacing ?? 4) : 0
      let run = 0, next = spacing / 2
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i]
        const L = Math.hypot(b.x - a.x, b.z - a.z)
        const n = Math.max(1, Math.ceil(L / 3))
        for (let k = 0; k < n; k++) {
          const p = { x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n }
          const q = { x: a.x + ((b.x - a.x) * (k + 1)) / n, z: a.z + ((b.z - a.z) * (k + 1)) / n }
          const m = L / n
          const post = spacing > 0 && run + m >= next
          if (post) next += spacing
          run += m
          push(this.pieces, at(p.x, p.z), {
            a: p, b: q, h: row.h, w: row.w, y0: row.y0 ?? 0, post,
            capA: i === 1 && k === 0, capB: i === pts.length - 1 && k === n - 1, seed: ri * 31 + i * 7 + k,
          })
        }
      }
    })
    for (let i = 0; i < g.topiary.length; i += 4) push(this.yews, at(g.topiary[i], g.topiary[i + 1]), i)
    this.topiary = g.topiary
    this.formal = g.formal.map(unpackPoints)
    g.flats.forEach((f, fi) => {
      const ring = unpackPoints(f.ring)
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
      for (let tz = Math.floor(z0 / tile); tz <= Math.floor(z1 / tile); tz++) {
        for (let tx = Math.floor(x0 / tile); tx <= Math.floor(x1 / tile); tx++) {
          push(this.flats, `${tx},${tz}`, { ring, kind: f.kind })
          if (f.kind !== 'bed') continue
          let a = 0
          for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j].x * ring[i].z - ring[i].x * ring[j].z
          // (never more than about 900 cushions to a bed: the Jardin des Plantes's perspective is a bed too)
          const step = Math.max(0.8, Math.sqrt(Math.abs(a / 2) / 900))
          push(this.beds, `${tx},${tz}`, { ring, x0, z0, x1, z1, seed: fi, step, rim: f.rim === true })
        }
      }
    })
  }
  private readonly topiary: number[]
  private readonly formal: Point[][]

  /** the gravel, lawns and beds in a tile, in the order they are laid: each over the last */
  flatsIn(tx: number, tz: number): { ring: Point[]; kind: 'gravel' | 'lawn' | 'bed' }[] {
    const order = { gravel: 0, lawn: 1, bed: 2 }
    return [...(this.flats.get(`${tx},${tz}`) ?? [])].sort((a, b) => order[a.kind] - order[b.kind])
  }

  /**
   * The edge of an ordinary square's lawn (owner, 2026-10-30: "hedges, neat rows of shrubs"): a Paris lawn is not left open to the
   * path. Decided by where the lawn is: some get a low clipped hedge, some the green iron hoops, some a run of flowers along their
   * longest side as well, some nothing. A great lawn is left alone, and so is a garden with a plan of its own. `ring` is the lawn's
   * piece in this tile, whose cut edges along the tile's sides are not edges of anything.
   */
  lawnEdge(out: MeshBuilder, ring: Point[], tx: number, tz: number): void {
    if (ring.length < 3) return
    let area = 0, cx = 0, cz = 0
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      area += ring[j].x * ring[i].z - ring[i].x * ring[j].z
      cx += ring[i].x; cz += ring[i].z
    }
    cx /= ring.length; cz /= ring.length
    if (Math.abs(area) / 2 < 25 || Math.abs(area) / 2 > 6000 || this.formal.some((f) => insideRing(f, cx, cz))) return
    const pick = noise(Math.round(ring[0].x), Math.round(ring[0].z))
    if (pick < 0.2) return
    const inward = Math.sign(area)
    const x0 = tx * this.tile, z0 = tz * this.tile, x1 = x0 + this.tile, z1 = z0 + this.tile
    const onCut = (a: Point, b: Point): boolean => (Math.abs(a.x - b.x) < 0.01 && (Math.abs(a.x - x0) < 0.01 || Math.abs(a.x - x1) < 0.01))
      || (Math.abs(a.z - b.z) < 0.01 && (Math.abs(a.z - z0) < 0.01 || Math.abs(a.z - z1) < 0.01))
    let longest: { a: Point; b: Point; L: number; nx: number; nz: number } | null = null
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const p = ring[j], q = ring[i]
      const L = Math.hypot(q.x - p.x, q.z - p.z)
      if (L < 1.2 || onCut(p, q)) continue
      const nx = (-(q.z - p.z) / L) * inward, nz = ((q.x - p.x) / L) * inward
      const a = { x: p.x + nx * 0.35, z: p.z + nz * 0.35 }, b = { x: q.x + nx * 0.35, z: q.z + nz * 0.35 }
      if (!longest || L > longest.L) longest = { a, b, L, nx, nz }
      const n = Math.max(1, Math.ceil(L / 3))
      for (let k = 0; k < n; k++) {
        const u = { x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n }
        const v = { x: a.x + ((b.x - a.x) * (k + 1)) / n, z: a.z + ((b.z - a.z) * (k + 1)) / n }
        if (pick < 0.62) hedgePiece(out, u, v, 0, 0.5, 0.4, HEDGE_FOOT, HEDGE, HEDGE_TOP, false, false)
        else hoops(out, u, v)
      }
    }
    if (longest && longest.L > 6 && pick > 0.45 && pick < 0.8) {
      const { a, b, nx, nz } = longest
      const w = 1.5
      const strip = [{ x: a.x + nx * 0.4, z: a.z + nz * 0.4 }, { x: b.x + nx * 0.4, z: b.z + nz * 0.4 }, { x: b.x + nx * (0.4 + w), z: b.z + nz * (0.4 + w) }, { x: a.x + nx * (0.4 + w), z: a.z + nz * (0.4 + w) }]
      const xs = strip.map((q) => q.x), zs = strip.map((q) => q.z)
      flowers(out, strip, Math.round(ring[0].x * 3), 0.8, Math.max(Math.min(...xs), x0), Math.max(Math.min(...zs), z0), Math.min(Math.max(...xs), x1), Math.min(Math.max(...zs), z1))
    }
  }

  /** what stands in a tile: hedges, pleached rows and their trunks, yews and flowers */
  plant(out: MeshBuilder, tx: number, tz: number): void {
    const k = `${tx},${tz}`
    for (const p of this.pieces.get(k) ?? []) {
      const f = 0.92 + noise(p.seed, 3) * 0.16
      if (p.y0 > 0) {
        hedgePiece(out, p.a, p.b, p.y0, p.h, p.w, toned(LIME_FOOT, f), toned(LIME, f), toned(LIME_TOP, f), p.capA, p.capB)
        if (p.post) trunk(out, { x: (p.a.x + p.b.x) / 2, z: (p.a.z + p.b.z) / 2 }, p.y0 + 0.4)
      } else hedgePiece(out, p.a, p.b, 0, p.h, p.w, toned(HEDGE_FOOT, f), toned(HEDGE, f), toned(HEDGE_TOP, f), p.capA, p.capB)
    }
    for (const i of this.yews.get(k) ?? []) topiary(out, this.topiary[i], this.topiary[i + 1], this.topiary[i + 2], this.topiary[i + 3], i)
    const bx0 = tx * this.tile, bz0 = tz * this.tile
    for (const b of this.beds.get(k) ?? []) {
      flowers(out, b.ring, b.seed, b.step, Math.max(b.x0, bx0), Math.max(b.z0, bz0), Math.min(b.x1, bx0 + this.tile), Math.min(b.z1, bz0 + this.tile))
      if (b.rim) {
        for (let i = 0, j = b.ring.length - 1; i < b.ring.length; j = i++) {
          const a = b.ring[j], c = b.ring[i]
          if (Math.floor(a.x / this.tile) === tx && Math.floor(a.z / this.tile) === tz) {
            hedgePiece(out, a, c, 0, 0.35, 0.3, HEDGE_FOOT, HEDGE, HEDGE_TOP, false, false)
          }
        }
      }
    }
  }
}
