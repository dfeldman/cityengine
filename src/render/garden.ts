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
import type { Projection } from '../city/geo.ts'
import { topiaryBall, topiaryBox, topiaryCone } from './topiary.ts'
import { lathe } from './models.ts'
import { ROSE, roseBedShape, type RoseBedShape } from './roses.ts'
import { FLOWER_GARDENS, flowerBed, flowerBorder, type Flower } from './flower-gardens.ts'

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
const SHRUB: Rgb[] = [[0.09, 0.2, 0.06], [0.13, 0.25, 0.07], [0.07, 0.17, 0.07], [0.11, 0.21, 0.09], [0.15, 0.085, 0.11]]

const noise = (a: number, b: number): number => {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
  return v - Math.floor(v)
}
const toned = (c: Rgb, f: number): Rgb => [c[0] * f, c[1] * f, c[2] * f]

/*
 * THE CLIPPED BOX HEDGE (owner, 2026-11-18: the Champ de Mars hedges "show very visible holes": plain box prisms whose pieces did not
 * meet — open ends where a run stopped, notches at every bend). Now one profile swept along the line: narrower at the foot, a full belly,
 * rounded shoulders and a barely domed top, as boxwood is clipped. Rings every HEDGE_STEP m, each one's width, height and tone taken from
 * a smooth noise of where it stands — so two pieces that share an end share that end's ring exactly, and a row has no seams. Where a
 * row bends the pieces meet on the mitre; wherever a run just stops it is capped. Profile numbers are shares of the half-width and height.
 */
/** the profile, one side, from foot to crown: [share of the half-width, share of the height] */
const HEDGE_PROFILE: [number, number][] = [[0.8, 0], [1, 0.45], [0.93, 0.84], [0.6, 0.97], [0, 1]]
/** how far the foot is sunk into the ground, m: a slope under a 3 m piece showed light under its straight foot */
const HEDGE_SINK = 0.06
/** metres between rings along the line */
const HEDGE_STEP = 2.2
/** the smooth noise's cell along the hedge, m, and how much it varies the width, the height and the tone (±share) */
const HEDGE_WOBBLE_CELL = 1.7
const HEDGE_WOBBLE_W = 0.07
const HEDGE_WOBBLE_H = 0.06
const HEDGE_TONE = 0.1
/** how far a side's normal leans to the sky: clipped leaves take the light from above, a hedge's shaded side is not black */
const HEDGE_SKY = 0.7
/** the mitre's stretch beyond which a bend is too sharp to mitre (about 130°): both pieces are capped there instead */
const HEDGE_MITRE_MAX = 2.4

/** how a swept hedge is drawn: its profile, rings, wobble, and how high it is lifted (a pleached crown on its trunks) */
interface HedgeLook {
  profile: [number, number][]; step: number; cell: number; wobbleW: number; wobbleH: number; tone: number; sky: number
  /** metres the profile is lifted (0: on the ground, its foot sunk) */
  lift: number
  /** each vertex pushed in and out along its normal by up to this, m, on a noise of this cell, m: leaves, not a wall */
  bump: number; bumpCell: number
}
const BOX_LOOK: HedgeLook = { profile: HEDGE_PROFILE, step: HEDGE_STEP, cell: HEDGE_WOBBLE_CELL, wobbleW: HEDGE_WOBBLE_W, wobbleH: HEDGE_WOBBLE_H, tone: HEDGE_TONE, sky: HEDGE_SKY, lift: 0, bump: 0, bumpCell: 1 }

/*
 * THE PLEACHED CROWN (owner, 2026-11-27: "the hedges are good, but the box trees are still very primitive … essentially a type of
 * hedge even if it isn't a bush"): the limes and planes clipped into a wall or a box on bare trunks — the Champ de Mars, the Palais-Royal,
 * the Tuileries. The box hedge's own sweep, lifted onto the trunks, its profile closed underneath (the underside is what you ride under),
 * coarser and looser than box: bigger leaves, sheared less often, so the faces bulge and dip.
 */
/** the crown's section, one side, from the middle of its underside over the side to the middle of its top */
const CROWN_PROFILE: [number, number][] = [[0, 0], [0.7, 0.01], [0.95, 0.12], [1, 0.4], [0.97, 0.75], [0.82, 0.95], [0.4, 1], [0, 1]]
const CROWN_LOOK: HedgeLook = { profile: CROWN_PROFILE, step: 1.2, cell: 2.6, wobbleW: 0.1, wobbleH: 0.07, tone: 0.16, sky: 0.6, lift: 0, bump: 0.22, bumpCell: 0.8 }
/** a trunk: radius at the foot and under the crown, m; how far it goes up into the crown, m; sides round */
const TRUNK_R0 = 0.17, TRUNK_R1 = 0.12, TRUNK_INTO = 0.6, TRUNK_SIDES = 7

/** a smooth value noise in 0..1 (bilinear over a lattice): unlike `noise` it barely moves for a point a float's width away */
function smooth(x: number, z: number, cell: number, salt: number): number {
  const gx = x / cell, gz = z / cell, ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz)
  const n = (i: number, j: number): number => noise(i + salt * 17.3, j - salt * 5.1)
  const top = n(ix, iz) + (n(ix + 1, iz) - n(ix, iz)) * sx, bot = n(ix, iz + 1) + (n(ix + 1, iz + 1) - n(ix, iz + 1)) * sx
  return top + (bot - top) * sz
}

/** four corners with a normal and a colour each, wound to face their mean normal */
function smoothQuad(out: MeshBuilder, p: V[], n: V[], c: Rgb[], kind: number): void {
  const base = out.positions.length / 3
  for (let i = 0; i < 4; i++) {
    out.positions.push(p[i][0], p[i][1], p[i][2])
    out.normals.push(n[i][0], n[i][1], n[i][2])
    out.uvs.push(UV[i][0], UV[i][1])
    out.colors.push(c[i][0], c[i][1], c[i][2], kind)
  }
  const mx = n[0][0] + n[1][0] + n[2][0] + n[3][0], my = n[0][1] + n[1][1] + n[2][1] + n[3][1], mz = n[0][2] + n[1][2] + n[2][2] + n[3][2]
  const ax = p[1][0] - p[0][0], ay = p[1][1] - p[0][1], az = p[1][2] - p[0][2]
  const bx = p[2][0] - p[0][0], by = p[2][1] - p[0][1], bz = p[2][2] - p[0][2]
  const facing = (ay * bz - az * by) * mx + (az * bx - ax * bz) * my + (ax * by - ay * bx) * mz
  if (facing > 0) out.indices.push(base, base + 2, base + 1, base, base + 3, base + 2)
  else out.indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
}

/**
 * A length of clipped hedge from a to b on the ground, `h` tall and `w` wide. `prev` is the row's direction coming into a and `next`
 * its direction going on from b, where the row goes on (null where it stops: that end is capped). Colours: foot, side, top.
 */
function boxHedge(out: MeshBuilder, a: Point, b: Point, h: number, w: number, foot: Rgb, side: Rgb, top: Rgb, prev: Point | null, next: Point | null,
                  o: HedgeLook = BOX_LOOK): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  if (L < 0.05) return
  const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
  const nx = -uz, nz = ux
  const hw = w / 2
  // (an end's sideways vector: the mitre where the row goes on, square where it stops)
  const end = (d: Point | null): [number, number, boolean] => {
    if (!d) return [nx, nz, true]
    let mx = -d.z + nx, mz = d.x + nz
    const m = Math.hypot(mx, mz)
    if (m < 1e-6) return [nx, nz, true]
    mx /= m; mz /= m
    const s = 1 / (mx * nx + mz * nz)
    return s > HEDGE_MITRE_MAX || s < 0 ? [nx, nz, true] : [mx * s, mz * s, false]
  }
  const [ax, az, capA] = end(prev), [bx, bz, capB] = end(next)
  // (the profile's normals, from its own edges, leaned to the sky)
  const P = o.profile, K = P.length
  const pn: [number, number][] = P.map((_, i) => {
    const p0 = P[Math.max(0, i - 1)], p1 = P[Math.min(K - 1, i + 1)]
    let s = (p1[1] - p0[1]) * h, y = -(p1[0] - p0[0]) * hw
    if (i === K - 1) { s = 0; y = 1 }
    const m = Math.hypot(s, y) || 1
    // (a crown's underside is not leaned to the sky like its sides: it is what is in shade)
    return [s / m, y / m + (o.lift > 0 ? o.sky * Math.max(0.15, Math.min(1, 0.5 + y / m)) : o.sky)]
  })
  const shade: Rgb[] = P.map((_, i) => {
    const t = o.lift > 0 ? P[i][1] : i / (K - 1)
    const from = t < 0.34 ? foot : side, to = t < 0.34 ? side : top, f = t < 0.34 ? t / 0.34 : (t - 0.34) / 0.66
    return [from[0] + (to[0] - from[0]) * f, from[1] + (to[1] - from[1]) * f, from[2] + (to[2] - from[2]) * f]
  })
  const steps = Math.max(1, Math.round(L / o.step))
  // ring[i] = the profile's 2K - 1 points across, left foot to right foot, with their normals and colours
  type Ring = { p: V[]; n: V[]; c: Rgb[] }
  const ring = (t: number): Ring => {
    const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t
    // (the sideways vector, eased from a's mitre to b's: a short piece on a sharp bend never crosses itself)
    const sx = ax + (bx - ax) * t, sz = az + (bz - az) * t
    const ww = hw * (1 + (smooth(x, z, o.cell, 1) - 0.5) * 2 * o.wobbleW)
    const hh = h * (1 + (smooth(x, z, o.cell, 2) - 0.5) * 2 * o.wobbleH)
    const tone = 1 + (smooth(x, z, o.cell * 1.3, 3) - 0.5) * 2 * o.tone
    const r: Ring = { p: [], n: [], c: [] }
    for (let j = -(K - 1); j <= K - 1; j++) {
      const i = K - 1 - Math.abs(j), sg = j < 0 ? 1 : -1
      const [q, y] = P[i]
      const off = q * ww * sg
      const [ns, ny] = pn[i]
      const m = Math.hypot(ns, ny)
      const nv: V = [(nx * ns * sg) / m, ny / m, (nz * ns * sg) / m]
      const pv: V = [x + sx * off, o.lift + (y === 0 && o.lift === 0 ? -HEDGE_SINK : y * hh), z + sz * off]
      // (leaves: each vertex pushed along its normal by a noise of where it is — a shared ring is pushed the same in both pieces)
      if (o.bump > 0 && !(q === 0 && y === 0 && o.lift === 0)) {
        const d = (smooth(pv[0] + pv[1] * 0.7, pv[2] - pv[1] * 0.4, o.bumpCell, 4) - 0.5) * 2 * o.bump
        pv[0] += nv[0] * d; pv[1] += nv[1] * d * 0.6; pv[2] += nv[2] * d
      }
      r.p.push(pv)
      r.n.push(nv)
      r.c.push(toned(shade[i], tone))
    }
    return r
  }
  let r0 = ring(0)
  const first = r0
  for (let s = 1; s <= steps; s++) {
    const r1 = ring(s / steps)
    for (let j = 0; j < r0.p.length - 1; j++) {
      smoothQuad(out, [r0.p[j], r1.p[j], r1.p[j + 1], r0.p[j + 1]], [r0.n[j], r1.n[j], r1.n[j + 1], r0.n[j + 1]], [r0.c[j], r1.c[j], r1.c[j + 1], r0.c[j + 1]], CLIPPED)
    }
    if (s === steps && capB) hedgeCap(out, r1, ux, uz, o.sky)
    r0 = r1
  }
  if (capA) hedgeCap(out, first, -ux, -uz, o.sky)
}

/** a hedge's end: the profile closed along the ground, in quads from the foot up, facing (ux, uz) and leaned to the sky */
function hedgeCap(out: MeshBuilder, r: { p: V[]; c: Rgb[] }, ux: number, uz: number, sky = HEDGE_SKY): void {
  const m = Math.hypot(1, sky), n: V = [ux / m, sky / m, uz / m]
  const N = r.p.length, half = (N - 1) / 2
  // (pair the left and right sides, rung by rung: the profile is convex, so each rung's quad is too)
  for (let k = 0; k < half; k++) {
    const l0 = k, l1 = k + 1, r0 = N - 1 - k, r1 = N - 2 - k
    smoothQuad(out, [r.p[l0], r.p[r0], r.p[r1], r.p[l1]], [n, n, n, n], [r.c[l0], r.c[r0], r.c[r1], r.c[l1]], CLIPPED)
  }
}

/** a trunk: round, tapering, flared at the foot and a little out of true, up into the crown */
function trunk(out: MeshBuilder, p: Point, y1: number, seed = 0): void {
  const lean = (noise(seed, 11) - 0.5) * 0.12
  const prof: [number, number][] = [[TRUNK_R0 * 1.35, -0.1], [TRUNK_R0, 0.35], [(TRUNK_R0 + TRUNK_R1) / 2, y1 * 0.5], [TRUNK_R1, y1]]
  lathe(out, p.x + lean, p.z - lean, prof, TRUNK_SIDES, toned(TRUNK, 0.85 + noise(seed, 12) * 0.3), 0, { phase: seed })
}

/**
 * a clipped yew or box: a cone (0), a ball (1), a cube (2) — or an unclipped shrub (3). The shapes are render/topiary.ts's: one
 * watertight surface each, smooth, sunk into the ground. `h` is the baked height.
 */
function topiary(out: MeshBuilder, x: number, z: number, h: number, shape: number, seed: number): void {
  if (shape === 3) return shrub(out, x, z, h, seed)
  const c = toned(YEW, 0.9 + noise(seed, 1) * 0.3)
  if (shape === 2) return topiaryBox(out, x, 0, z, h * 0.9, h * 0.9, h, c, { seed, heading: noise(seed, 4) * 0.3 })
  if (shape === 0) return topiaryCone(out, x, 0, z, h, h * TOPIARY_CONE_R, c, { seed })
  topiaryBall(out, x, 0, z, h / 2 / 0.93, c, { seed })
}
/** a yew cone's foot radius, share of its height */
const TOPIARY_CONE_R = 0.24

/**
 * A SHRUB, unclipped (Batch 1's parks, 2026-10-31): a laurel, a spiraea, a mound as wide as it is high that belongs to no shape. Seven corners pushed about by where it
 * stands, three bands, leaf on it, and no two the same green. A ball of clipped yew at the foot of an English park's trees read as a topiary show.
 */
function shrub(out: MeshBuilder, x: number, z: number, h: number, seed: number): void {
  const sides = 7
  // (the purple one one time in ten: at one in five, from above, a square's shrubberies read as a scatter of boulders)
  const pick = noise(seed, 3)
  const leaf = pick < 0.1 ? SHRUB[SHRUB.length - 1] : SHRUB[Math.floor(((pick - 0.1) / 0.9) * (SHRUB.length - 1)) % (SHRUB.length - 1)]
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

/** what `squarePlanting` needs of a tile: its park pieces, what's closed to planting in them, its ways, and its statues */
export interface SquareGround {
  parks: { ring: Point[]; holes: Point[][] }[]
  /** a pitch, paving, water, a wood, a building */
  closed: { ring: Point[] }[]
  /** each way's points and the half-width it keeps clear; `walk` for a foot way that gets planted along */
  ways: { pts: Point[]; half: number; walk: boolean }[]
  /** the walks OSM maps as areas */
  paved: Point[][]
  /** OSM's lawns are mapped here: `lawnEdge` is edging them */
  lawns: boolean
  statues: { x: number; z: number; kind: string }[]
}

// (one tile's rasters, a metre to the cell: never two tiles at once)
const RASTER = 200
const rasterPark = new Uint8Array(RASTER * RASTER)
const rasterFree = new Uint8Array(RASTER * RASTER)
const rasterFar = new Float32Array(RASTER * RASTER)

/** set each cell whose centre is inside `ring` to `v` */
function fillRing(ring: Point[], x0: number, z0: number, N: number, v: number, into: Uint8Array): void {
  if (ring.length < 3) return
  let zLo = Infinity, zHi = -Infinity, xLo = Infinity, xHi = -Infinity
  for (const p of ring) { if (p.z < zLo) zLo = p.z; if (p.z > zHi) zHi = p.z; if (p.x < xLo) xLo = p.x; if (p.x > xHi) xHi = p.x }
  if (xHi < x0 || xLo > x0 + N || zHi < z0 || zLo > z0 + N) return
  const crossings: number[] = []
  for (let j = Math.max(0, Math.floor(zLo - z0)); j <= Math.min(N - 1, Math.ceil(zHi - z0)); j++) {
    const z = z0 + j + 0.5
    crossings.length = 0
    for (let i = 0, k = ring.length - 1; i < ring.length; k = i++) {
      const a = ring[i], b = ring[k]
      if ((a.z > z) !== (b.z > z)) crossings.push(a.x + ((z - a.z) * (b.x - a.x)) / (b.z - a.z))
    }
    crossings.sort((p, q) => p - q)
    for (let c = 0; c + 1 < crossings.length; c += 2) {
      const from = Math.max(0, Math.ceil(crossings[c] - x0 - 0.5)), to = Math.min(N - 1, Math.floor(crossings[c + 1] - x0 - 0.5))
      if (to >= from) into.fill(v, j * N + from, j * N + to + 1)
    }
  }
}

/** close every cell within `half` of the line from a to b */
function stampLine(into: Uint8Array, a: Point, b: Point, half: number, x0: number, z0: number, N: number): void {
  const i0 = Math.max(0, Math.floor(Math.min(a.x, b.x) - half - x0)), i1 = Math.min(N - 1, Math.ceil(Math.max(a.x, b.x) + half - x0))
  const j0 = Math.max(0, Math.floor(Math.min(a.z, b.z) - half - z0)), j1 = Math.min(N - 1, Math.ceil(Math.max(a.z, b.z) + half - z0))
  const dx = b.x - a.x, dz = b.z - a.z, LL = dx * dx + dz * dz
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const px = x0 + i + 0.5 - a.x, pz = z0 + j + 0.5 - a.z
      const t = LL > 0 ? Math.max(0, Math.min(1, (px * dx + pz * dz) / LL)) : 0
      const qx = px - dx * t, qz = pz - dz * t
      if (qx * qx + qz * qz <= half * half) into[j * N + i] = 0
    }
  }
}

/** each open cell's distance in metres to the nearest closed one: a chamfer, there and back */
function distanceField(open: Uint8Array, far: Float32Array, N: number): void {
  const D = Math.SQRT2
  for (let i = 0; i < N * N; i++) far[i] = open[i] ? 1e6 : 0
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const c = j * N + i
      if (far[c] === 0) continue
      let d = far[c]
      if (i > 0) d = Math.min(d, far[c - 1] + 1)
      if (j > 0) {
        d = Math.min(d, far[c - N] + 1)
        if (i > 0) d = Math.min(d, far[c - N - 1] + D)
        if (i < N - 1) d = Math.min(d, far[c - N + 1] + D)
      }
      far[c] = d
    }
  }
  for (let j = N - 1; j >= 0; j--) {
    for (let i = N - 1; i >= 0; i--) {
      const c = j * N + i
      if (far[c] === 0) continue
      let d = far[c]
      if (i < N - 1) d = Math.min(d, far[c + 1] + 1)
      if (j < N - 1) {
        d = Math.min(d, far[c + N] + 1)
        if (i < N - 1) d = Math.min(d, far[c + N + 1] + D)
        if (i > 0) d = Math.min(d, far[c + N - 1] + D)
      }
      far[c] = d
    }
  }
}

interface Piece { a: Point; b: Point; h: number; w: number; y0: number; capA: boolean; capB: boolean; /** the row's direction into a and on from b, where it goes on (a box hedge mitres there) */ prev: Point | null; next: Point | null; post: boolean; seed: number }
interface Bed { ring: Point[]; x0: number; z0: number; x1: number; z1: number; seed: number; step: number; rim: boolean; rose?: RoseBedShape; flower?: Flower }

/** A city's garden, filed by tile. */
export class GardenTiles {
  private readonly pieces = new Map<string, Piece[]>()
  private readonly yews = new Map<string, number[]>()
  private readonly beds = new Map<string, Bed[]>()
  private readonly flats = new Map<string, { ring: Point[]; kind: 'gravel' | 'lawn' | 'bed' }[]>()

  /** `proj` places FLOWER_GARDENS (render/flower-gardens.ts): a bed inside one is planted with its flower, or is the lawn it really is */
  constructor(g: PackedGarden, private readonly tile: number, proj?: Projection) {
    const roseRings = proj ? FLOWER_GARDENS.map((r) => ({ flower: r.flower, edgeLawns: r.edgeLawns === true, ring: r.ring.map(([lat, lon]) => proj.toLocal({ lat, lon })) })) : []
    const at = (x: number, z: number): string => `${Math.floor(x / tile)},${Math.floor(z / tile)}`
    const push = <T>(m: Map<string, T[]>, k: string, v: T): void => { const l = m.get(k); if (l) l.push(v); else m.set(k, [v]) }
    // every row, cut into pieces of up to 3 m: a piece belongs to the tile it starts in, and a piece follows the ground
    g.hedges.forEach((row, ri) => {
      const pts = unpackPoints(row.points)
      const spacing = row.y0 ? (row.spacing ?? 4) : 0
      let run = 0, next = spacing / 2
      // (a closed row — a square hedge — has no ends: every corner, the first one too, is a join)
      const closed = pts.length > 3 && Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].z - pts[pts.length - 1].z) < 0.3
      // (each segment's direction, null for one of no length; a closed row's last runs on into its first)
      const dir = (i: number): Point | null => {
        const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.z - a.z)
        return L < 0.05 ? null : { x: (b.x - a.x) / L, z: (b.z - a.z) / L }
      }
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
            capA: i === 1 && k === 0 && !closed, capB: i === pts.length - 1 && k === n - 1 && !closed,
            prev: k > 0 ? dir(i) : i > 1 ? dir(i - 1) : closed ? dir(pts.length - 1) : null,
            next: k < n - 1 ? dir(i) : i < pts.length - 1 ? dir(i + 1) : closed ? dir(1) : null, seed: ri * 31 + i * 7 + k,
          })
        }
      }
    })
    for (let i = 0; i < g.topiary.length; i += 4) push(this.yews, at(g.topiary[i], g.topiary[i + 1]), i)
    this.topiary = g.topiary
    this.formal = g.formal.map(unpackPoints)
    // (a rose garden's own lawns, laid like the plans' over their gravel)
    const extra = proj ? FLOWER_GARDENS.flatMap((r) => (r.lawns ?? []).map((l) => ({ ring: l.map(([lat, lon]) => proj.toLocal({ lat, lon })), kind: 'lawn' as const }))) : []
    for (const f of extra) {
      const xs = f.ring.map((p) => p.x), zs = f.ring.map((p) => p.z)
      for (let tz = Math.floor(Math.min(...zs) / tile); tz <= Math.floor(Math.max(...zs) / tile); tz++) {
        for (let tx = Math.floor(Math.min(...xs) / tile); tx <= Math.floor(Math.max(...xs) / tile); tx++) push(this.flats, `${tx},${tz}`, f)
      }
    }
    g.flats.forEach((f, fi) => {
      const ring = unpackPoints(f.ring)
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
      // (a bed in a rosarium: its shape says whether it is roses, or a lawn the mapper called a bed)
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
      const garden = f.kind === 'bed' || f.kind === 'lawn' ? roseRings.find((r) => insideRing(r.ring, cx, cz) && (f.kind === 'bed' || r.edgeLawns)) : undefined
      const flower = garden?.flower
      // (a lawn in a garden that edges its lawns: a border of its flower, whatever its size)
      const rose = flower ? (f.kind === 'lawn' ? { ...roseBedShape(ring), role: 'border' as const } : roseBedShape(ring)) : undefined
      const kind = rose && rose.role !== 'roses' ? 'lawn' : f.kind
      for (let tz = Math.floor(z0 / tile); tz <= Math.floor(z1 / tile); tz++) {
        for (let tx = Math.floor(x0 / tile); tx <= Math.floor(x1 / tile); tx++) {
          push(this.flats, `${tx},${tz}`, { ring, kind })
          if (rose?.role === 'lawn') continue
          if (f.kind !== 'bed' && !rose) continue
          let a = 0
          for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j].x * ring[i].z - ring[i].x * ring[j].z
          // (never more than about 900 cushions to a bed: the Jardin des Plantes's perspective is a bed too)
          const step = Math.max(0.8, Math.sqrt(Math.abs(a / 2) / 900))
          push(this.beds, `${tx},${tz}`, { ring, x0, z0, x1, z1, seed: fi, step, rim: f.rim === true || (flower === 'rose' && ROSE.EDGE_H > 0), rose, flower })
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
    // (edge e runs ring[e-1] → ring[e]; an edge is planted unless it is short or the tile's cut)
    const N = ring.length
    const edge = (e: number): { p: Point; q: Point; L: number; ux: number; uz: number; nx: number; nz: number; on: boolean } => {
      const p = ring[(e + N - 1) % N], q = ring[e % N], L = Math.hypot(q.x - p.x, q.z - p.z) || 1e-9
      const ux = (q.x - p.x) / L, uz = (q.z - p.z) / L
      return { p, q, L, ux, uz, nx: -uz * inward, nz: ux * inward, on: L >= 1.2 && !onCut(p, q) }
    }
    // (the hedge's line, LAWN_IN in from the edge: at a corner shared with a planted edge, on the mitre, so the two runs meet)
    const LAWN_IN = 0.35
    const corner = (e: { q: Point; nx: number; nz: number }, f: { nx: number; nz: number; on: boolean }): Point => {
      let mx = e.nx, mz = e.nz
      if (f.on) {
        const sx = e.nx + f.nx, sz = e.nz + f.nz, m = Math.hypot(sx, sz), d = m > 1e-6 ? (sx / m) * e.nx + (sz / m) * e.nz : 0
        if (d > 1 / HEDGE_MITRE_MAX) { mx = sx / m / d; mz = sz / m / d }
      }
      return { x: e.q.x + mx * LAWN_IN, z: e.q.z + mz * LAWN_IN }
    }
    for (let i = 0; i < N; i++) {
      const E = edge(i)
      if (!E.on) continue
      const before = edge(i + N - 1), after = edge(i + 1)
      const { L, nx, nz } = E
      if (!longest || L > longest.L) longest = { a: { x: E.p.x + nx * LAWN_IN, z: E.p.z + nz * LAWN_IN }, b: { x: E.q.x + nx * LAWN_IN, z: E.q.z + nz * LAWN_IN }, L, nx, nz }
      const a = corner({ q: E.p, nx, nz }, before), b = corner(E, after)
      const dir = { x: E.ux, z: E.uz }
      const n = Math.max(1, Math.ceil(L / 3))
      for (let k = 0; k < n; k++) {
        const u = { x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n }
        const v = { x: a.x + ((b.x - a.x) * (k + 1)) / n, z: a.z + ((b.z - a.z) * (k + 1)) / n }
        if (pick < 0.62) {
          boxHedge(out, u, v, 0.5, 0.4, HEDGE_FOOT, HEDGE, HEDGE_TOP,
            k > 0 ? dir : before.on ? { x: before.ux, z: before.uz } : null, k < n - 1 ? dir : after.on ? { x: after.ux, z: after.uz } : null)
        } else hoops(out, u, v)
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

  /**
   * THE ORDINARY SQUARE'S COMMON PLANTING (Batch 7, 2026-10-31; owner, 2026-10-30: "hedges, neat rows of shrubs, flowers etc and not a wild landscape of trees"; "A special focus
   * should be park gardens, since in a cycling game they are very obvious, and Paris has a lot of them"). The 330 gardens over 0.3 ha that no plan has traced read as lawn and scattered
   * trees. A city gardener plants them all the same way, so this does it once, from what the tile already knows: the park's outline, OSM's walks, what's mapped in it.
   *   - Along each WALK, in runs of about 16 m to a side: a shrubbery in two ranks, a flower border, the green iron hoops, or a low clipped hedge, or nothing.
   *   - Inside the park's own edge, 2.4 m in: the shrub bank against its railing, or a clipped laurel hedge, in runs, broken at each gate.
   *   - Round a statue on the lawn: a ring of flowers.
   * Which of those is decided by where you are, never by the tile: a run belongs to a 16 m cell of the world, a square's manner to a 260 m cell (one in the English way, one clipped, one
   * of hoops), so a run carries on across a tile's edge and two bakes agree. It keeps out of everything by a metre's raster of the tile, the distance from each cell to what's mapped.
   * Planned gardens (`formal`) are left alone, and a great park's interior takes only a few shrubs: its lawns are meant to be open (Batch 1). OSM's lawns have `lawnEdge` already, so where
   * they're mapped the walks here take shrubs and flowers and leave the hoops and hedges to it. Not a plan in tools/gardens/: it needs no bake, it costs the index nothing, and Batch 6's and later plans take a garden out of it by their rings.
   */
  squarePlanting(out: MeshBuilder, g: SquareGround, tx: number, tz: number): void {
    const T = this.tile, N = RASTER
    if (T !== N) return
    const x0 = tx * T, z0 = tz * T
    const park = rasterPark.fill(0), far = rasterFar
    let inPark = 0
    const span = (ring: Point[], v: number, into: Uint8Array): void => fillRing(ring, x0, z0, N, v, into)
    for (const p of g.parks) { span(p.ring, 1, park); for (const h of p.holes) span(h, 0, park) }
    for (let i = 0; i < N * N; i++) inPark += park[i]
    if (inPark < 150) return
    const free = rasterFree
    free.set(park)
    for (const c of g.closed) span(c.ring, 0, free)
    for (const f of this.formal) span(f, 0, free)
    for (const b of this.beds.get(`${tx},${tz}`) ?? []) span(b.ring, 0, free)
    for (const p of this.pieces.get(`${tx},${tz}`) ?? []) stampLine(free, p.a, p.b, p.w / 2 + 0.3, x0, z0, N)
    for (const i of this.yews.get(`${tx},${tz}`) ?? []) stampLine(free, { x: this.topiary[i], z: this.topiary[i + 1] }, { x: this.topiary[i], z: this.topiary[i + 1] }, 1.2, x0, z0, N)
    for (const w of g.ways) for (let i = 1; i < w.pts.length; i++) stampLine(free, w.pts[i - 1], w.pts[i], w.half, x0, z0, N)
    distanceField(free, far, N)
    const at = (x: number, z: number): number => {
      const i = Math.floor(x - x0), j = Math.floor(z - z0)
      return i < 0 || j < 0 || i >= N || j >= N ? 0 : far[j * N + i]
    }
    const cutByTile = (a: Point, b: Point): boolean => (Math.abs(a.x - b.x) < 0.01 && (Math.abs(a.x - x0) < 0.01 || Math.abs(a.x - x0 - T) < 0.01)) || (Math.abs(a.z - b.z) < 0.01 && (Math.abs(a.z - z0) < 0.01 || Math.abs(a.z - z0 - T) < 0.01))
    const inTile = (x: number, z: number): boolean => x >= x0 && z >= z0 && x < x0 + T && z < z0 + T
    const inParkAt = (x: number, z: number): boolean => {
      const i = Math.floor(x - x0), j = Math.floor(z - z0)
      return i >= 0 && j >= 0 && i < N && j < N && park[j * N + i] === 1
    }
    /** a square's manner, and the flowers it plants this season */
    const manner = (x: number, z: number): number => { const n = noise(Math.floor(x / 260) + 0.5, Math.floor(z / 260) - 0.5); return n < 0.42 ? 0 : n < 0.76 ? 1 : 2 }
    const planting = (x: number, z: number): number => Math.floor(x / 90) * 13 + Math.floor(z / 90) * 7
    // (a tile that's nearly all park is the inside of a great one)
    const great = inPark > N * N * 0.62
    // (…and one that's all park, no edge in it, is a Bois's: no islands of shrubs out in the wood)
    const wild = inPark > N * N * 0.95
    const RUN = 16

    /** a run's shrubs: two ranks back from a line, by the station at (x, z) with its normal (nx, nz) */
    const shrubs = (x: number, z: number, nx: number, nz: number, off: number, tall: number): void => {
      const seed = Math.round(x * 3) + Math.round(z * 7)
      const h = (1 + noise(x, z) * 0.9) * tall
      // (back by its own spread, and only where there's room for all of it: a mound's foot is 0.7 of its height, and the first of these spilled onto the walk)
      const k = off + h * 0.75
      const px = x + nx * k + (noise(z, x) - 0.5) * 1.2, pz = z + nz * k + (noise(x + 2, z) - 0.5) * 1.2
      if (at(px, pz) >= h * 0.7) shrub(out, px, pz, h, seed)
      if (noise(x + 7, z + 3) < 0.55) {
        const h2 = (1.5 + noise(x + 1, z) * 1.3) * tall
        const k2 = k + 1.3 + h2 * 0.35
        const qx = x + nx * k2 + (noise(z + 5, x) - 0.5) * 1.4, qz = z + nz * k2 + (noise(x, z + 5) - 0.5) * 1.4
        if (at(qx, qz) >= h2 * 0.7) shrub(out, qx, qz, h2, seed + 1)
      }
    }
    const border = (a: Point, b: Point, nx: number, nz: number, o0: number, o1: number): void => {
      const ring = [{ x: a.x + nx * o0, z: a.z + nz * o0 }, { x: b.x + nx * o0, z: b.z + nz * o0 }, { x: b.x + nx * o1, z: b.z + nz * o1 }, { x: a.x + nx * o1, z: a.z + nz * o1 }]
      const xs = ring.map((q) => q.x), zs = ring.map((q) => q.z)
      // (its leaf and soil under the flowers, so that a border is one border)
      out.quad([[ring[3].x, 0.07, ring[3].z], [ring[2].x, 0.07, ring[2].z], [ring[1].x, 0.07, ring[1].z], [ring[0].x, 0.07, ring[0].z]], [0, 1, 0], UV, toned(LEAF, 0.75), CLIPPED)
      flowers(out, ring, planting(a.x, a.z), 0.8, Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs))
    }

    /** beside a walk, a station's run: what's planted on one side of the 3 m from (px, pz) along (ux, uz), `half` from the line */
    // (`ahead`: the next station along the walk and its sideways vector on this side, where the walk bends before it: a hedge's piece
    //  runs to it, so the runs round a curving path meet instead of each running 3 m straight on and notching every bend's outside)
    const beside = (px: number, pz: number, ux: number, uz: number, nx: number, nz: number, half: number, chosen: number, ahead?: { x: number; z: number; nx: number; nz: number }): void => {
      let pick = chosen
      if (great) { if (pick < 0.45) return; pick = (pick - 0.45) / 0.55 }
      const m = manner(px, pz)
      const kind = m === 0 ? (pick < 0.38 ? 0 : pick < 0.73 ? 1 : pick < 0.9 ? 2 : 3) : m === 1 ? (pick < 0.3 ? 0 : pick < 0.6 ? 4 : pick < 0.8 ? 2 : pick < 0.92 ? 1 : 3) : (pick < 0.15 ? 0 : pick < 0.65 ? 3 : pick < 0.8 ? 2 : 1)
      // (a great park's inside, the Bois above all, has its shrubs by the path and nothing of a gardener's: the Bois de Boulogne's forest paths came up in begonias, first shot)
      if (kind === 0 || (great && kind !== 1)) return
      const here = { x: px, z: pz }, next = { x: px + ux * 3, z: pz + uz * 3 }
      if (kind === 1) { shrubs(px, pz, nx, nz, half + 0.3, 1); return }
      // (is there ground beside the walk, at both ends of this piece?)
      if (at(px + nx * (half + 1), pz + nz * (half + 1)) < 0.5 || at(next.x + nx * (half + 1), next.z + nz * (half + 1)) < 0.5) return
      if (kind === 2) { border(here, next, nx, nz, half + 0.25, half + 1.65); return }
      if (g.lawns) return
      const k = half + 0.25
      const u = { x: px + nx * k, z: pz + nz * k }, v = ahead ? { x: ahead.x + ahead.nx * k, z: ahead.z + ahead.nz * k } : { x: next.x + nx * k, z: next.z + nz * k }
      if (kind === 3) hoops(out, u, v)
      // (each station's run on its own, capped: where the next one plants something else the old open end was a hole)
      else boxHedge(out, u, v, 0.55, 0.42, HEDGE_FOOT, HEDGE, HEDGE_TOP, null, null)
    }
    /** a run is the walk's own, from where the way begins: a border stops at a junction, as a gardener's does, and a diagonal walk isn't chopped up by the world's grid */
    const RUN_ON = 18
    for (const w of g.ways) {
      if (!w.walk) continue
      const a0 = w.pts[0]
      let left = 1.5, run = 0
      for (let i = 1; i < w.pts.length; i++) {
        const a = w.pts[i - 1], b = w.pts[i]
        const L = Math.hypot(b.x - a.x, b.z - a.z)
        if (L < 0.2) continue
        const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
        let d = left
        for (; d < L; d += 3) {
          const px = a.x + ux * d, pz = a.z + uz * d
          if (!inTile(px, pz) || !inParkAt(px, pz)) continue
          const r = Math.floor((run + d) / RUN_ON)
          // (the next station, 3 m on along the walk: on a later segment where this one ends first)
          let j = i, e = d + 3
          while (j < w.pts.length - 1) {
            const Lj = Math.hypot(w.pts[j].x - w.pts[j - 1].x, w.pts[j].z - w.pts[j - 1].z)
            if (Lj < 0.2) { j++; continue }
            if (e < Lj) break
            e -= Lj; j++
          }
          const A = w.pts[j - 1], B = w.pts[j], Lj = Math.hypot(B.x - A.x, B.z - A.z) || 1
          const vx = (B.x - A.x) / Lj, vz = (B.z - A.z) / Lj
          for (const s of [1, -1]) {
            const ahead = j === i ? undefined : { x: A.x + vx * e, z: A.z + vz * e, nx: -vz * s, nz: vx * s }
            beside(px, pz, ux, uz, -uz * s, ux * s, w.half, noise(Math.round(a0.x * 2) + r * 3.1 + s * 0.31, Math.round(a0.z * 2) - r * 1.7 - s * 0.17), ahead)
          }
        }
        left = d - L
        run += L
      }
    }
    // (a walk OSM maps as an area, `area:highway`, has no line to go along: its outline's the walk's edge)
    for (const ring of g.paved) {
      let area = 0, n = 0
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { area += ring[j].x * ring[i].z - ring[i].x * ring[j].z; if (inParkAt(ring[i].x, ring[i].z)) n++ }
      if (n * 2 < ring.length) continue
      const out1 = -Math.sign(area)
      let run = 0
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[j], b = ring[i]
        const L = Math.hypot(b.x - a.x, b.z - a.z)
        if (L < 0.2) continue
        if (cutByTile(a, b)) { run += L; continue }
        const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
        for (let d = 1.5; d < L; d += 3) {
          const px = a.x + ux * d, pz = a.z + uz * d
          beside(px, pz, ux, uz, -uz * out1, ux * out1, 0.05, noise(Math.round(ring[0].x) + Math.floor((run + d) / RUN_ON) * 3.1, Math.round(ring[0].z) + 0.4))
        }
        run += L
      }
    }

    // the park's own edge, where it isn't the tile's
    for (const p of g.parks) {
      let area = 0
      for (let i = 0, j = p.ring.length - 1; i < p.ring.length; j = i++) area += p.ring[j].x * p.ring[i].z - p.ring[i].x * p.ring[j].z
      if (Math.abs(area) / 2 < 150) continue
      const inward = Math.sign(area)
      for (let i = 0, j = p.ring.length - 1; i < p.ring.length; j = i++) {
        const a = p.ring[j], b = p.ring[i]
        const L = Math.hypot(b.x - a.x, b.z - a.z)
        if (L < 2 || cutByTile(a, b)) continue
        const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
        const nx = -uz * inward, nz = ux * inward
        const n = Math.max(1, Math.round(L / 3))
        for (let c = 0; c < n; c++) {
          const px = a.x + ((b.x - a.x) * (c + 0.5)) / n, pz = a.z + ((b.z - a.z) * (c + 0.5)) / n
          const m = manner(px, pz)
          const on = noise(Math.floor(px / (RUN + 4)) + 0.77, Math.floor(pz / (RUN + 4)) + 0.23)
          if (on > (great ? 0.32 : m === 2 ? 0.48 : 0.64)) continue
          const off = 2.2 + noise(Math.floor(px / 12), Math.floor(pz / 12)) * 0.8
          if (m === 1) {
            const q = { x: px + nx * off, z: pz + nz * off }
            const hh = 1.25 + noise(Math.floor(px / 50), Math.floor(pz / 50)) * 0.45
            const half = (L / n) / 2
            const u = { x: q.x - ux * half, z: q.z - uz * half }, v = { x: q.x + ux * half, z: q.z + uz * half }
            if (at(u.x, u.z) >= 0.6 && at(v.x, v.z) >= 0.6) boxHedge(out, u, v, hh, 0.8, HEDGE_FOOT, HEDGE, HEDGE_TOP, null, null)
          } else shrubs(px, pz, nx, nz, off - 0.8, 1.25)
        }
      }
    }

    // the shrubberies out on the lawn: never many, and only where there's room for them to be islands. On a clipped square, a short row of clipped box
    {
      const CELL = wild ? 1e6 : 44
      for (let cz = Math.floor(z0 / CELL); cz * CELL < z0 + T; cz++) {
        for (let cx = Math.floor(x0 / CELL); cx * CELL < x0 + T; cx++) {
          const ix = (cx + 0.15 + noise(cx, cz) * 0.7) * CELL, iz = (cz + 0.15 + noise(cz + 0.5, cx) * 0.7) * CELL
          if (!inTile(ix, iz) || noise(cx + 0.25, cz + 0.75) > (great ? 0.15 : g.lawns ? 0.3 : 0.55) || at(ix, iz) < 4.5) continue
          const m = manner(ix, iz), seed = cx * 31 + cz * 17
          if (m === 1) {
            const t = noise(cx + 0.6, cz) * Math.PI, dx = Math.cos(t), dz = Math.sin(t)
            for (let q = -2; q <= 2; q++) topiary(out, ix + dx * q * 2.4, iz + dz * q * 2.4, 1.1 + noise(cx, cz + q) * 0.3, 1, seed + q)
            continue
          }
          const count = 5 + Math.floor(noise(cx + 0.9, cz) * 5)
          for (let q = 0; q < count; q++) {
            const ang = q * 2.399 + seed, rad = 1.1 * Math.sqrt(q + 0.5)
            shrub(out, ix + Math.cos(ang) * rad, iz + Math.sin(ang) * rad, 1.2 + noise(cx + q, cz) * 1.5, seed + q)
          }
        }
      }
    }

    // a statue on the lawn, in its ring of flowers
    for (const f of g.statues) {
      const r = f.kind === 'bust' ? 2.2 : 3
      if (!inTile(f.x, f.z) || !inParkAt(f.x, f.z)) continue
      let room = at(f.x, f.z) >= r
      for (let k = 0; k < 8 && room; k++) room = at(f.x + Math.cos((k / 8) * 6.283) * r, f.z + Math.sin((k / 8) * 6.283) * r) > 0.3
      if (!room) continue
      const SIDES = 10
      for (let k = 0; k < SIDES; k++) {
        const a0 = (k / SIDES) * Math.PI * 2, a1 = ((k + 1) / SIDES) * Math.PI * 2
        const ring = [[1.3, a0], [r, a0], [r, a1], [1.3, a1]].map(([q, t]) => ({ x: f.x + Math.cos(t) * q, z: f.z + Math.sin(t) * q }))
        const xs = ring.map((q) => q.x), zs = ring.map((q) => q.z)
        flowers(out, ring, planting(f.x, f.z) + 3, 0.8, Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs))
      }
    }
  }

  /** what stands in a tile: hedges, pleached rows and their trunks, yews and flowers */
  plant(out: MeshBuilder, tx: number, tz: number): void {
    const k = `${tx},${tz}`
    for (const p of this.pieces.get(k) ?? []) {
      const f = 0.92 + noise(p.seed, 3) * 0.16
      if (p.y0 > 0) {
        void f
        boxHedge(out, p.a, p.b, p.h, p.w, LIME_FOOT, LIME, LIME_TOP, p.prev, p.next, { ...CROWN_LOOK, lift: p.y0 })
        if (p.post) trunk(out, { x: (p.a.x + p.b.x) / 2, z: (p.a.z + p.b.z) / 2 }, p.y0 + TRUNK_INTO, p.seed)
      } else boxHedge(out, p.a, p.b, p.h, p.w, HEDGE_FOOT, HEDGE, HEDGE_TOP, p.prev, p.next)
    }
    for (const i of this.yews.get(k) ?? []) topiary(out, this.topiary[i], this.topiary[i + 1], this.topiary[i + 2], this.topiary[i + 3], i)
    const bx0 = tx * this.tile, bz0 = tz * this.tile
    for (const b of this.beds.get(k) ?? []) {
      const rx0 = Math.max(b.x0, bx0), rz0 = Math.max(b.z0, bz0), rx1 = Math.min(b.x1, bx0 + this.tile), rz1 = Math.min(b.z1, bz0 + this.tile)
      if (b.rose && b.flower && b.rose.role === 'roses') flowerBed(out, b.flower, b.ring, b.rose, b.seed, rx0, rz0, rx1, rz1)
      else if (b.rose && b.flower) flowerBorder(out, b.flower, b.ring, b.seed, rx0, rz0, rx1, rz1)
      else flowers(out, b.ring, b.seed, b.step, rx0, rz0, rx1, rz1)
      if (b.rim) {
        const [eh, ew] = b.flower === 'rose' ? [ROSE.EDGE_H, ROSE.EDGE_W] : [0.35, 0.3]
        const R = b.ring, N = R.length
        const dir = (i: number): Point => { const a = R[(i + N - 1) % N], c = R[i], L = Math.hypot(c.x - a.x, c.z - a.z) || 1; return { x: (c.x - a.x) / L, z: (c.z - a.z) / L } }
        for (let i = 0, j = N - 1; i < N; j = i++) {
          const a = R[j], c = R[i]
          if (Math.floor(a.x / this.tile) === tx && Math.floor(a.z / this.tile) === tz) {
            boxHedge(out, a, c, eh, ew, HEDGE_FOOT, HEDGE, HEDGE_TOP, dir(j), dir((i + 1) % N))
          }
        }
      }
    }
  }
}
