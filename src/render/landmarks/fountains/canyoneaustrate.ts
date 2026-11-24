/**
 * The CANYONEAUSTRATE (Gérard Singer, 1988), Parc de Bercy beside the Accor Arena: a canyon poured in concrete,
 * some 22 m across and 4.4 m deep, sunk into the north-west corner of a paved square. Its walls are hundreds of
 * stacked slabs, each with a rounded edge, gathered into beehive lobes and free-standing cones; on the north and
 * west a shallow moat (−0.7 m) wraps round it, and water pumped up spills from the rim over the strata into a pool
 * on the floor (Commons, "Canyoneaustrate Paris (2014)" 01–05, Flickr "Bercy @ Paris").
 *
 * The shape is MEASURED, not drawn: the IGN LiDAR HD surface model at 0.5 m (./canyoneaustrate-lidar.ts), smoothed
 * between posts, with lobes added on the steep walls where half a metre blurs them, then cut into strata
 * (./terraced.ts). The square is the paving round it, which also hides the ground the regions.json `pit` lowers.
 *
 * Local frame: x east, z north, metres from the entry's lat/lon (the lidar grid's centre); y = 0 the paving.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import polygonClipping from 'polygon-clipping'
import earcut from 'earcut'
import { LIDAR } from './canyoneaustrate-lidar.ts'
import { cascade, terraced, TerraceGrid } from './terraced.ts'

type P = [number, number]

// ---- tunables
/** slab thickness: the moat (−0.7) sits on a whole number of slabs */
const STEP = 0.7 / 3
/** sampling grid, metres */
const CELL = 0.25
/** rounded edge: how far each slab's middle bulges past its outline */
const BULGE = 0.11
/** lobes on the steep walls: height added (m), lattice spacing (m), radius (m) */
const LOBE_AMP = 1.5
const LOBE_SPACING = 2.0
const LOBE_R = 0.9
/** lidar noise on the flat paving; anything above it (a low kerb, a tree crown) is read as paving */
const FLAT = 0.15
/** the lidar is faded to the paving over this many metres from its edge */
const FEATHER = 2
/** the paved rim around the canyon, blending into the park: a rounded box around PIT grown by RIM_MARGIN,
 *  corners of RIM_RADIUS, the edge wandering out by up to RIM_WOBBLE (never in, so the pit stays covered) */
/** at least one ground post (4 m) beyond PIT, so the pit's ramp stays under the slab */
const RIM_MARGIN = 4.5
const RIM_RADIUS = 6.5
const RIM_WOBBLE = 1.6
const RIM_LOBES = 7
/** ground lowered under the canyon (regions.json `pit`), which the paving must cover: local metres */
//  (the canyon's lidar extent, deeper than 0.2 m, grown 1 m: the 4 m ground grid ramps out one post beyond it, under the rim)
const PIT: P[] = [[-12.2, -13.2], [12.7, -13.2], [12.7, 10.7], [-12.2, 10.7]]
/** the paving's skirt, metres below it */
const SKIRT = 0.7
/** the tree clearing (out.grounds) is drawn this far inside the rim's edge */
const GROUNDS_IN = 2.5
/** colours: the pale concrete, the wet algae-dark low down, the paving */
const CONCRETE: Rgb = [0.34, 0.35, 0.36]
const WET: Rgb = [0.22, 0.24, 0.21]
/** the rim beyond the lidar grid: the plaza ledge's own colour (tint at k=0, top), on the same rock surface */
const PAVING: Rgb = [CONCRETE[0] * 1.05, CONCRETE[1] * 1.05, CONCRETE[2] * 1.05]
/** cascades: how many, their breadth, how far apart; the moat's and floor pool's water a little over their slab */
const FALLS = 8
const FALL_WIDTH = 0.55
const FALL_SEP = 2.6
const WATER_UP = 0.05
/** the moat's water is cut into strips this wide (a pool can't have holes) */
const MOAT_STRIP = 1.5
/** the moat's water: only a channel this wide along the terrace's outer wall (IGN ortho: the rest is dry concrete) */
const MOAT_CHANNEL = 1.6

/** the rim's outline, local metres, counter-clockwise; also regions.json's `level` ring for the site */
export const RIM: P[] = (() => {
  const xs = PIT.map((p) => p[0]), zs = PIT.map((p) => p[1])
  const r = RIM_RADIUS, m = RIM_MARGIN
  const ax = Math.min(...xs) - m + r, bx = Math.max(...xs) + m - r, az = Math.min(...zs) - m + r, bz = Math.max(...zs) + m - r
  const ring: P[] = []
  const corners: [number, number, number][] = [[bx, bz, 0], [ax, bz, 0.5], [ax, az, 1], [bx, az, 1.5]]
  const N = 14
  // walk the four arcs; the straight sides come from joining them
  for (const [cx, cz, a0] of corners) {
    for (let i = 0; i <= N; i++) {
      const a = (a0 + (i / N) * 0.5) * Math.PI
      ring.push([cx + r * Math.cos(a), cz + r * Math.sin(a)])
    }
  }
  // wander the edge outward, measured from the box's centre
  const ox = (ax + bx) / 2, oz = (az + bz) / 2
  const dense: P[] = []
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i], [x1, z1] = ring[(i + 1) % ring.length]
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.2))
    for (let j = 0; j < n; j++) dense.push([x0 + ((x1 - x0) * j) / n, z0 + ((z1 - z0) * j) / n])
  }
  return dense.map(([x, z]) => {
    const t = Math.atan2(z - oz, x - ox), d = Math.hypot(x - ox, z - oz)
    const w = RIM_WOBBLE * (0.5 + 0.3 * Math.sin(RIM_LOBES * t + 1.3) + 0.2 * Math.sin(2 * RIM_LOBES * t + 4.1))
    return [x + ((x - ox) / d) * w, z + ((z - oz) / d) * w] as P
  })
})()

const ROCK = surfaceTag('rock')

/** the lidar, Catmull-Rom between posts, in metres */
function lidar(x: number, z: number): number {
  const { cols, rows, dx, dz, dm } = LIDAR
  const fc = x / dx + (cols - 1) / 2, fr = (rows - 1) / 2 - z / dz
  const c = Math.floor(fc), r = Math.floor(fr), u = fc - c, w = fr - r
  const post = (cc: number, rr: number): number => {
    const v = dm[Math.max(0, Math.min(rows - 1, rr)) * cols + Math.max(0, Math.min(cols - 1, cc))] / 10
    return v > -FLAT ? 0 : v
  }
  const cr = (a: number, b: number, c2: number, d: number, t: number): number => b + 0.5 * t * (c2 - a + t * (2 * a - 5 * b + 4 * c2 - d + t * (3 * (b - c2) + d - a)))
  const row = (rr: number): number => cr(post(c - 1, rr), post(c, rr), post(c + 1, rr), post(c + 2, rr), u)
  const v = cr(row(r - 1), row(r), row(r + 1), row(r + 2), w)
  const hx = ((cols - 1) / 2) * dx, hz = ((rows - 1) / 2) * dz
  const edge = Math.min(hx - Math.abs(x), hz - Math.abs(z))
  const f = Math.max(0, Math.min(1, edge / FEATHER))
  return v * f * f * (3 - 2 * f)
}

const h2 = (a: number, b: number): number => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s) }

/** beehive lobes: round bumps on a jittered lattice, only where the measured wall is steep */
function lobes(x: number, z: number): number {
  const e = 0.5
  const g = Math.hypot(lidar(x + e, z) - lidar(x - e, z), lidar(x, z + e) - lidar(x, z - e)) / (2 * e)
  const steep = Math.max(0, Math.min(1, (g - 0.4) / 1.2))
  if (steep <= 0) return 0
  let s = 0
  const i0 = Math.floor(x / LOBE_SPACING), j0 = Math.floor(z / LOBE_SPACING)
  for (let i = i0 - 1; i <= i0 + 2; i++) {
    for (let j = j0 - 1; j <= j0 + 2; j++) {
      const cx = (i + 0.2 + 0.6 * h2(i, j)) * LOBE_SPACING, cz = (j + 0.2 + 0.6 * h2(j + 7, i)) * LOBE_SPACING
      const r = LOBE_R * (0.75 + 0.5 * h2(i + 3, j + 5))
      const d = Math.hypot(x - cx, z - cz) / r
      s = Math.max(s, Math.exp(-d * d))
    }
  }
  return LOBE_AMP * steep * (s - 0.35)
}

function field(x: number, z: number): number {
  const v = lidar(x, z)
  return v < -0.05 ? Math.min(-0.05, v + lobes(x, z)) : v
}

function tint(k: number, x: number, z: number, top: boolean): Rgb {
  const deep = Math.max(0, Math.min(1, (-k * STEP - 0.8) / 3.6)) ** 1.5
  const n = 0.95 + 0.07 * h2(k, Math.floor(x * 0.7) + Math.floor(z * 0.7) * 13)
  const lift = top ? 1.05 : 1
  return [0, 1, 2].map((i) => (CONCRETE[i] * (1 - deep * 0.6) + WET[i] * deep * 0.6) * n * lift) as Rgb
}

export function canyoneaustrate(out: MeshBuilder): void {
  const hx = ((LIDAR.cols - 1) / 2) * LIDAR.dx, hz = ((LIDAR.rows - 1) / 2) * LIDAR.dz
  const keep: P[][][] = [[RIM]]
  const g = terraced(out, {
    field, x0: -hx, x1: hx, z0: -hz, z1: hz, cell: CELL, step: STEP, bulge: BULGE, tint, tag: ROCK,
    keep: keep.map((poly) => poly[0] as P[]), minSeg: 0.28,
  })
  // the paving beyond the measured grid, and its skirt down to the ground
  const rect: P[] = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]]
  for (const poly of polygonClipping.difference(keep, [rect])) flat(out, poly as P[][], 0, PAVING, ROCK)
  for (const poly of keep) skirt(out, poly[0] as P[], 0, -SKIRT, PAVING, ROCK)
  // all of it is paved: no park trees on the rim or in the canyon (render/vegetation.ts clearings)
  // (shrunk under the slab: the city drapes it on the ground, and where the ground eases down beyond the rim it showed)
  const ox = RIM.reduce((a, p) => a + p[0], 0) / RIM.length, oz = RIM.reduce((a, p) => a + p[1], 0) / RIM.length
  out.grounds.push(RIM.map(([x, z]) => { const d = Math.hypot(x - ox, z - oz) || 1; return { x: x - ((x - ox) / d) * GROUNDS_IN, z: z - ((z - oz) / d) * GROUNDS_IN } }))
  water(out, g)
}

/** the moat, the floor's pool and the cascades over the strata */
function water(out: MeshBuilder, g: TerraceGrid): void {
  // the moat: the broad slab at −0.7 (three down), less everything lower
  const moatK = -3
  // the channel: posts on the terrace with the paving's edge within MOAT_CHANNEL, contoured from a 0/1 field
  const onTerrace = (x: number, z: number): boolean => Math.abs(g.h(x, z) - moatK * STEP) < STEP * 0.5
  const nearRim = (x: number, z: number): boolean => {
    for (let a = 0; a < 12; a++) {
      const px = x + Math.cos(a * Math.PI / 6) * MOAT_CHANNEL, pz = z + Math.sin(a * Math.PI / 6) * MOAT_CHANNEL
      if (g.h(px, pz) > -STEP * 0.5) return true
    }
    return false
  }
  const t = g.t
  const mask = new TerraceGrid({ ...t, cell: 0.25, field: (x, z) => (onTerrace(x, z) && nearRim(x, z) ? 1 : 0) })
  const moat = mask.region(0.5)
  // a pool is one ring with no holes, so the moat goes in strips across the canyon it wraps round
  const [x0, x1] = [-20, 20]
  for (let x = x0; x < x1; x += MOAT_STRIP) {
    const strip: P[] = [[x, -20], [x + MOAT_STRIP, -20], [x + MOAT_STRIP, 20], [x, 20]]
    for (const poly of polygonClipping.intersection(moat, [strip])) {
      const ring = poly[0] as P[]
      if (Math.abs(area(ring)) < 0.5) continue
      out.water.push({ kind: 'pool', ring: ring.map(([px, pz]) => ({ x: px, z: pz })), y: moatK * STEP + WATER_UP })
    }
  }
  // the floor's pool: the two lowest slabs
  const [lo] = g.levels()
  for (const ring of g.contours((lo + 1.5) * STEP)) {
    if (Math.abs(area(ring)) < 1.5) continue
    const [cx, cz] = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0])
    if (g.h(cx, cz) > (lo + 1.5) * STEP) continue
    out.water.push({ kind: 'pool', ring: ring.map(([x, z]) => ({ x, z })), y: (lo + 1) * STEP + WATER_UP })
  }
  // the cascades: where the rim drops furthest, from the moat's lip and the paving's edge
  const cands: { x: number; z: number; s: number }[] = []
  for (const level of [(moatK - 0.5) * STEP, -0.5 * STEP]) {
    for (const ring of g.contours(level)) {
      for (const [x, z] of ring) {
        const [dx, dz] = g.down(x, z)
        cands.push({ x, z, s: g.h(x, z) - g.h(x + dx * 1.5, z + dz * 1.5) })
      }
    }
  }
  cands.sort((a, b) => b.s - a.s)
  const picked: typeof cands = []
  for (const c of cands) {
    if (picked.length >= FALLS || c.s < 1) break
    if (picked.every((p) => Math.hypot(p.x - c.x, p.z - c.z) > FALL_SEP)) picked.push(c)
  }
  for (const p of picked) {
    const [dx, dz] = g.down(p.x, p.z)
    cascade(out, g, p.x - dx * 0.05, p.z - dz * 0.05, FALL_WIDTH)
  }
}

const area = (r: P[]): number => r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1] }, 0) / 2

function flat(out: MeshBuilder, poly: P[][], y: number, c: Rgb, tag: number): void {
  const pts: number[] = [], holes: number[] = []
  poly.forEach((ring, i) => { if (i) holes.push(pts.length / 2); for (const p of ring.slice(0, -1)) pts.push(p[0], p[1]) })
  const tris = earcut(pts, holes), base = out.positions.length / 3
  for (let j = 0; j < pts.length; j += 2) { out.positions.push(pts[j], y, pts[j + 1]); out.normals.push(0, 1, 0); out.uvs.push(pts[j], pts[j + 1]); out.colors.push(c[0], c[1], c[2], tag) }
  for (let j = 0; j < tris.length; j += 3) {
    const a = tris[j], b = tris[j + 1], d = tris[j + 2]
    const cross = (pts[2 * b + 1] - pts[2 * a + 1]) * (pts[2 * d] - pts[2 * a]) - (pts[2 * b] - pts[2 * a]) * (pts[2 * d + 1] - pts[2 * a + 1])
    if (cross > 0) out.indices.push(base + a, base + d, base + b)
    else out.indices.push(base + a, base + b, base + d)
  }
}

function skirt(out: MeshBuilder, ring: P[], y1: number, y0: number, c: Rgb, tag: number): void {
  const pts = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.slice(0, -1) : ring
  const ccw = area(pts) > 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    // outward: right of the edge for an anticlockwise ring
    const nx = ccw ? (b[1] - a[1]) / l : -(b[1] - a[1]) / l, nz = ccw ? -(b[0] - a[0]) / l : (b[0] - a[0]) / l
    out.quad([[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
}
