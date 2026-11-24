/**
 * TERRACED GROUND for the special-case fountain library: a height field cut into strata — slabs of a fixed
 * thickness stacked like pancakes, each with a rounded (bullnose) edge — the way the Canyoneaustrate's poured
 * concrete steps down into its canyon, and the way any stepped cascade or rock-cut basin can be drawn.
 *
 * The field is sampled on a grid; level k's slab is every point where the field rounds to k or above, so its
 * outline is the field's contour at (k − ½)·STEP (marching squares). Each outline becomes a wall from
 * (k − 1)·STEP up to k·STEP that bulges out by `bulge` at mid-height, smooth-shaded so the stack reads as rounded
 * layers; the visible part of each level's top (its slab less the one above it) is a flat ledge. Steep ground
 * gives a wall of close-stacked pancakes, gentle ground wide steps — the field decides, nothing is hand-placed.
 *
 * Also from the same contours: still pools over a basin, and cascades that follow the steepest way down,
 * one water sheet (render/water.ts) per lip they pass over.
 */
import earcut from 'earcut'
import polygonClipping from 'polygon-clipping'
import type { MeshBuilder } from '../../buildings.ts'
import type { Rgb } from '../../models.ts'

type P = [number, number]
type Ring = P[]
type MultiPoly = P[][][]

export interface Terrace {
  /** the ground, metres above the model's base, at local (x, z) */
  field: (x: number, z: number) => number
  /** the sampled rectangle, local metres */
  x0: number; x1: number; z0: number; z1: number
  /** grid spacing, metres */
  cell: number
  /** slab thickness, metres */
  step: number
  /** how far each slab's edge bulges past its outline at mid-height, metres */
  bulge: number
  /** colour of a wall or ledge at level k (y = k·step), at (x, z); `top` for ledges */
  tint: (k: number, x: number, z: number, top: boolean) => Rgb
  /** the material tag (cartoon-material `surfaceTag`) */
  tag: number
  /** ledges are kept only inside this region (local rings, any number); walls everywhere */
  keep?: Ring[]
  /** outline points closer than this are merged, metres */
  minSeg?: number
}

/** a sampled field with its contours, ready for walls, ledges, pools and cascades */
export class TerraceGrid {
  readonly cols: number
  readonly rows: number
  readonly v: Float32Array
  constructor(readonly t: Terrace) {
    this.cols = Math.round((t.x1 - t.x0) / t.cell) + 1
    this.rows = Math.round((t.z1 - t.z0) / t.cell) + 1
    this.v = new Float32Array(this.cols * this.rows)
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) this.v[r * this.cols + c] = t.field(t.x0 + c * t.cell, t.z0 + r * t.cell)
  }

  /** bilinear height */
  h(x: number, z: number): number {
    const t = this.t
    const fc = Math.max(0, Math.min(this.cols - 1.001, (x - t.x0) / t.cell)), fr = Math.max(0, Math.min(this.rows - 1.001, (z - t.z0) / t.cell))
    const c = Math.floor(fc), r = Math.floor(fr), u = fc - c, w = fr - r, i = r * this.cols + c
    return (this.v[i] * (1 - u) + this.v[i + 1] * u) * (1 - w) + (this.v[i + this.cols] * (1 - u) + this.v[i + this.cols + 1] * u) * w
  }

  /** the way down at (x, z): a unit horizontal vector against the gradient (smoothed over a cell each side) */
  down(x: number, z: number): P {
    const e = this.t.cell * 1.5
    const gx = this.h(x + e, z) - this.h(x - e, z), gz = this.h(x, z + e) - this.h(x, z - e)
    const l = Math.hypot(gx, gz) || 1
    return [-gx / l, -gz / l]
  }

  /** the closed outlines of {field ≥ level} (marching squares, saddles by the cell's mean), lightly smoothed */
  contours(level: number): Ring[] {
    const { cols, rows, v } = this, t = this.t
    const val = (c: number, r: number): number => (c < 0 || r < 0 || c >= cols || r >= rows ? v[Math.max(0, Math.min(rows - 1, r)) * cols + Math.max(0, Math.min(cols - 1, c))] : v[r * cols + c]) - level
    // edge ids: horizontal edge (c,r)-(c+1,r) = 2*(r*W+c), vertical (c,r)-(c,r+1) = 2*(r*W+c)+1, over a grid padded by one
    const W = cols + 2
    const id = (c: number, r: number, vert: boolean): number => 2 * ((r + 1) * W + (c + 1)) + (vert ? 1 : 0)
    const pt = new Map<number, P>()
    const link = new Map<number, number[]>()
    const at = (c: number, r: number, vert: boolean): number => {
      const k = id(c, r, vert)
      if (!pt.has(k)) {
        const a = val(c, r), b = vert ? val(c, r + 1) : val(c + 1, r)
        const f = Math.max(0.02, Math.min(0.98, a / (a - b)))
        pt.set(k, vert ? [t.x0 + c * t.cell, t.z0 + (r + f) * t.cell] : [t.x0 + (c + f) * t.cell, t.z0 + r * t.cell])
      }
      return k
    }
    const seg = (a: number, b: number): void => {
      if (!link.has(a)) link.set(a, [])
      if (!link.has(b)) link.set(b, [])
      link.get(a)!.push(b); link.get(b)!.push(a)
    }
    // one cell beyond the grid on every side, so an outline that reaches the edge still closes
    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        const a = val(c, r) >= 0 ? 1 : 0, b = val(c + 1, r) >= 0 ? 1 : 0, d = val(c + 1, r + 1) >= 0 ? 1 : 0, e = val(c, r + 1) >= 0 ? 1 : 0
        const code = a | (b << 1) | (d << 2) | (e << 3)
        if (code === 0 || code === 15) continue
        const S = (): number => at(c, r, false), E = (): number => at(c + 1, r, true), N = (): number => at(c, r + 1, false), Wv = (): number => at(c, r, true)
        switch (code) {
          case 1: case 14: seg(S(), Wv()); break
          case 2: case 13: seg(S(), E()); break
          case 4: case 11: seg(E(), N()); break
          case 8: case 7: seg(N(), Wv()); break
          case 3: case 12: seg(Wv(), E()); break
          case 6: case 9: seg(S(), N()); break
          case 5: case 10: {
            const mid = (val(c, r) + val(c + 1, r) + val(c + 1, r + 1) + val(c, r + 1)) / 4 >= 0 ? 1 : 0
            if ((code === 5) === (mid === 1)) { seg(S(), E()); seg(N(), Wv()) } else { seg(S(), Wv()); seg(E(), N()) }
          }
        }
      }
    }
    const rings: Ring[] = []
    const used = new Set<number>()
    for (const start of link.keys()) {
      if (used.has(start)) continue
      const ring: Ring = []
      let prev = -1, cur = start
      while (!used.has(cur)) {
        used.add(cur); ring.push(pt.get(cur)!)
        const nb = link.get(cur)!
        const next = nb[0] !== prev ? nb[0] : nb[1]
        prev = cur; cur = next
        if (cur === undefined) break
      }
      if (ring.length >= 4) rings.push(this.tidy(ring))
    }
    return rings.filter((g) => g.length >= 4)
  }

  /** one Chaikin pass, then drop points closer than minSeg */
  private tidy(ring: Ring): Ring {
    const n = ring.length, sm: Ring = []
    for (let i = 0; i < n; i++) {
      const a = ring[i], b = ring[(i + 1) % n]
      sm.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75])
    }
    const min = this.t.minSeg ?? 0.3, out: Ring = [sm[0]]
    for (const p of sm) { const q = out[out.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= min) out.push(p) }
    return out
  }

  /** {field ≥ level} as a region */
  region(level: number): MultiPoly {
    const rings = this.contours(level)
    const t = this.t
    const rect: Ring = [[t.x0, t.z0], [t.x1, t.z0], [t.x1, t.z1], [t.x0, t.z1]]
    // the outlines nest; even-odd (xor) sorts out which are holes. The border is in the region when its posts are.
    const border = this.v[0] >= level
    const geoms = rings.map((r) => [r] as P[][])
    if (geoms.length === 0) return border ? [[rect]] : []
    return border ? polygonClipping.xor([rect], ...geoms) as MultiPoly : polygonClipping.xor(geoms[0], ...geoms.slice(1)) as MultiPoly
  }

  /** the integer levels the field spans */
  levels(): [number, number] {
    let lo = Infinity, hi = -Infinity
    for (const x of this.v) { lo = Math.min(lo, x); hi = Math.max(hi, x) }
    return [Math.round(lo / this.t.step), Math.round(hi / this.t.step)]
  }
}

/** PROFILE: the fractions up a slab where its wall has a ring of vertices (more = rounder, dearer) */
const PROFILE = [0, 0.5, 1]

/** Build the strata: every wall and every visible ledge. Returns the grid for pools and cascades. */
export function terraced(out: MeshBuilder, t: Terrace): TerraceGrid {
  const g = new TerraceGrid(t)
  const [lo, hi] = g.levels()
  const S = t.step
  const regions = new Map<number, MultiPoly>()
  const regionOf = (k: number): MultiPoly => {
    if (!regions.has(k)) regions.set(k, g.region((k - 0.5) * S))
    return regions.get(k)!
  }
  const kg = (t.keep ?? []).map((r) => [r] as P[][])
  const keep = kg.length ? polygonClipping.union(kg[0], ...kg.slice(1)) as MultiPoly : null
  for (let k = lo; k <= hi; k++) {
    // the ledge: this level's slab less the one above, inside `keep`
    let ledge: MultiPoly = k === lo ? [[[[t.x0, t.z0], [t.x1, t.z0], [t.x1, t.z1], [t.x0, t.z1]]]] : regionOf(k)
    if (k < hi) ledge = polygonClipping.difference(ledge, regionOf(k + 1)) as MultiPoly
    if (keep) ledge = polygonClipping.intersection(ledge, keep) as MultiPoly
    for (const poly of ledge) cap(out, poly, k * S, (x, z) => t.tint(k, x, z, true), t.tag)
    if (k === lo) continue
    // the wall up to this level, on the outline of its slab
    for (const ring of g.contours((k - 0.5) * S)) wall(out, g, ring, (k - 1) * S, k * S, t)
  }
  return g
}

function cap(out: MeshBuilder, poly: P[][], y: number, tint: (x: number, z: number) => Rgb, tag: number): void {
  const flat: number[] = [], holes: number[] = []
  for (let i = 0; i < poly.length; i++) {
    const ring = poly[i]
    const n = ring.length - (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? 1 : 0)
    if (i > 0) holes.push(flat.length / 2)
    for (let j = 0; j < n; j++) flat.push(ring[j][0], ring[j][1])
  }
  const tris = earcut(flat, holes)
  if (tris.length === 0) return
  const base = out.positions.length / 3
  for (let j = 0; j < flat.length; j += 2) {
    const c = tint(flat[j], flat[j + 1])
    out.positions.push(flat[j], y, flat[j + 1]); out.normals.push(0, 1, 0); out.uvs.push(flat[j], flat[j + 1]); out.colors.push(c[0], c[1], c[2], tag)
  }
  for (let j = 0; j < tris.length; j += 3) {
    const a = tris[j], b = tris[j + 1], c = tris[j + 2]
    // face up: (b − a) × (c − a) must point down for the drawn side (MeshBuilder.quad's convention)
    const cross = (flat[2 * b + 1] - flat[2 * a + 1]) * (flat[2 * c] - flat[2 * a]) - (flat[2 * b] - flat[2 * a]) * (flat[2 * c + 1] - flat[2 * a + 1])
    if (cross > 0) out.indices.push(base + a, base + c, base + b)
    else out.indices.push(base + a, base + b, base + c)
  }
}

function wall(out: MeshBuilder, g: TerraceGrid, ring: Ring, y0: number, y1: number, t: Terrace): void {
  const n = ring.length, base = out.positions.length / 3, m = PROFILE.length
  const k = Math.round(y1 / t.step)
  for (let i = 0; i < n; i++) {
    const [x, z] = ring[i]
    // outward = downhill; averaged with the outline's own normal so a corner stays smooth
    const a = ring[(i + n - 1) % n], b = ring[(i + 1) % n]
    let nx = -(b[1] - a[1]), nz = b[0] - a[0]
    const l = Math.hypot(nx, nz) || 1
    nx /= l; nz /= l
    const [dx, dz] = g.down(x, z)
    if (nx * dx + nz * dz < 0) { nx = -nx; nz = -nz }
    const c = t.tint(k, x, z, false)
    for (const f of PROFILE) {
      const r = t.bulge * Math.sin(Math.PI * f)
      const slope = (t.bulge * Math.PI / (y1 - y0)) * Math.cos(Math.PI * f)
      const ny = -slope, nl = Math.hypot(1, ny)
      out.positions.push(x + nx * r, y0 + (y1 - y0) * f, z + nz * r)
      out.normals.push(nx / nl, ny / nl, nz / nl)
      out.uvs.push(i * 0.3, y0 + (y1 - y0) * f)
      out.colors.push(c[0], c[1], c[2], t.tag)
    }
  }
  const P = out.positions, N = out.normals
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    for (let q = 0; q < m - 1; q++) {
      const a = base + i * m + q, b = base + j * m + q, c = base + j * m + q + 1, d = base + i * m + q + 1
      // wound to face the vertex normal (the drawn side is where (b − a) × (c − a) points against it)
      const ax = P[3 * b] - P[3 * a], ay = P[3 * b + 1] - P[3 * a + 1], az = P[3 * b + 2] - P[3 * a + 2]
      const bx = P[3 * c] - P[3 * a], by = P[3 * c + 1] - P[3 * a + 1], bz = P[3 * c + 2] - P[3 * a + 2]
      const facing = (ay * bz - az * by) * N[3 * a] + (az * bx - ax * bz) * N[3 * a + 1] + (ax * by - ay * bx) * N[3 * a + 2]
      if (facing > 0) out.indices.push(a, c, b, a, d, c)
      else out.indices.push(a, b, c, a, c, d)
    }
  }
}

/** still water over {field < level}: one pool per basin, its surface at y */
export function pools(out: MeshBuilder, g: TerraceGrid, level: number, y: number, minArea = 2): void {
  for (const ring of g.contours(level)) {
    // a hole in {field ≥ level} is a basin; the outline round a raised island is not
    const [cx, cz] = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0])
    if (Math.abs(area(ring)) < minArea || g.h(cx, cz) >= level) continue
    out.water.push({ kind: 'pool', ring: ring.map(([x, z]) => ({ x, z })), y })
  }
}

const area = (r: Ring): number => r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1] }, 0) / 2

/**
 * A cascade from (x, z) down the steepest way: a sheet over each lip it crosses (lips closer than `merge` m make
 * one taller fall), a splash where it lands for good. `width` is each sheet's breadth.
 */
export function cascade(out: MeshBuilder, g: TerraceGrid, x: number, z: number, width: number, merge = 0.4, maxRun = 25): void {
  const S = g.t.step
  const lvl = (px: number, pz: number): number => Math.round(g.h(px, pz) / S)
  let px = x, pz = z, k = lvl(px, pz)
  const lips: { x: number; z: number; d: P; from: number; to: number }[] = []
  for (let run = 0; run < maxRun; run += 0.08) {
    const d = g.down(px, pz)
    const qx = px + d[0] * 0.08, qz = pz + d[1] * 0.08
    const kq = lvl(qx, qz)
    if (kq < k) {
      const last = lips[lips.length - 1]
      if (last && Math.hypot(px - last.x, pz - last.z) < merge + S * (last.from - last.to)) last.to = kq
      else lips.push({ x: px, z: pz, d, from: k, to: kq })
      k = kq
    } else if (kq > k) break
    px = qx; pz = qz
    if (g.h(px + d[0] * 0.6, pz + d[1] * 0.6) > g.h(px, pz) - 0.02 && lips.length && run > 1) break
  }
  for (const l of lips) {
    const [dx, dz] = l.d, hx = -dz * width / 2, hz = dx * width / 2
    const y = l.from * S
    out.water.push({ kind: 'sheet', a: [l.x - hx, y + 0.02, l.z - hz], b: [l.x + hx, y + 0.02, l.z + hz], out: 0.35, drop: (l.from - l.to) * S + 0.02 })
  }
  const end = lips[lips.length - 1]
  if (end) out.water.push({ kind: 'splash', at: [end.x + end.d[0] * 0.3, end.to * S + 0.03, end.z + end.d[1] * 0.3], r: 0.5 + 0.1 * (end.from - end.to) })
}
