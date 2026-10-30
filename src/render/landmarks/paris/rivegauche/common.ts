/**
 * What the Rive Gauche, Bercy and Ménagerie models of this folder share: a plan lofted between two levels (the Tours Duo's leaning
 * shafts, the Cinémathèque's tumbling blocks), a hipped roof over any polygon (the Ménagerie's pavilions), a low bed on the
 * ground (the Jardin's parterres), arcs of quads (the Fauverie's stepped roof). The rest is the palace kit's and modern.ts's,
 * re-exported here so a builder imports from one place. Not a builder: nothing is registered.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygonWithHoles } from '../../../buildings.ts'
import { shade, type Rgb } from '../../kit.ts'
import { edgeAt, offsetRing } from '../../parts.ts'
import { wound } from '../museums/modern.ts'

export { block, hex, shade, type Rgb } from '../../kit.ts'
export { box, prism } from '../../../models.ts'
export { edgeAt, offsetRing, boxAlong } from '../../parts.ts'
export { fitted, pts, rectOn, slabOn, archOn, type F } from '../palaces/common.ts'
export { hull, piers, ribbons, wound } from '../museums/modern.ts'
export { wallOn, baysOf, type Wall } from '../palaces/wall.ts'
export { lettersOn } from '../palaces/showfront.ts'
export { sign } from '../../signage.ts'
export { surfaceTag } from '../../../cartoon-material.ts'

export const FIXED = 0
export const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
export type P2 = { x: number; z: number }
export type V3 = [number, number, number]

export const areaOf = (r: P2[]): number => r.reduce((a, p, i) => { const q = r[(i + 1) % r.length]; return a + p.x * q.z - q.x * p.z }, 0) / 2
export const centroid = (r: P2[]): P2 => ({ x: r.reduce((s, p) => s + p.x, 0) / r.length, z: r.reduce((s, p) => s + p.z, 0) / r.length })

/** A seeded 0..1, the same on every load: no bed, plant or panel may change between two visits. */
export const noise = (a: number, b: number): number => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v) }

/** The normal of a quad a, b, c, d (from its diagonals, so a corner gone to a point does no harm), turned away from `inner`. */
function normalOf(a: V3, b: V3, c: V3, d: V3, inner: V3): V3 {
  const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2]
  const vx = d[0] - b[0], vy = d[1] - b[1], vz = d[2] - b[2]
  let n: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
  const l = Math.hypot(n[0], n[1], n[2]) || 1
  n = [n[0] / l, n[1] / l, n[2] / l]
  const mx = (a[0] + b[0] + c[0] + d[0]) / 4, my = (a[1] + b[1] + c[1] + d[1]) / 4, mz = (a[2] + b[2] + c[2] + d[2]) / 4
  return n[0] * (mx - inner[0]) + n[1] * (my - inner[1]) + n[2] * (mz - inner[2]) < 0 ? [-n[0], -n[1], -n[2]] : n
}

/** One four-cornered panel with its normal turned away from `inner`: for faces that are neither upright nor flat. */
export function panel(out: MeshBuilder, q: [V3, V3, V3, V3], inner: V3, c: Rgb, tag = FIXED): void {
  out.quad(q, normalOf(q[0], q[1], q[2], q[3], inner), UV, c, tag)
}

/** Walls lofted from ring `a` at ya to ring `b` at yb, vertex for vertex (same length): a leaning or tapering plan. */
export function loft(out: MeshBuilder, a: P2[], ya: number, b: P2[], yb: number, c: Rgb, tag = FIXED): void {
  const m = centroid(a)
  const inner: V3 = [m.x, (ya + yb) / 2, m.z]
  for (let i = 0; i < a.length; i++) {
    const j = (i + 1) % a.length
    panel(out, [[a[i].x, ya, a[i].z], [a[j].x, ya, a[j].z], [b[j].x, yb, b[j].z], [b[i].x, yb, b[i].z]], inner, c, tag)
  }
}

/** The same, each ring moved: `f(u)` is a ring at the fraction u of the way up, for a ribbon laid on a leaning wall. */
export function ringAt(a: P2[], b: P2[], u: number): P2[] {
  return a.map((p, i) => ({ x: p.x + (b[i].x - p.x) * u, z: p.z + (b[i].z - p.z) * u }))
}

/** A flat lid on any plan. */
export function cap(out: MeshBuilder, ring: P2[], y: number, c: Rgb, tag = FIXED): void {
  capPolygonWithHoles(out, wound([ring]), y, c, tag)
}

/** A hipped roof over any plan: its eaves `over` beyond the wall, every slope up to one point `rise` above (or `top`, a smaller ring). */
export function hipFan(out: MeshBuilder, ring: P2[], y: number, rise: number, c: Rgb, over = 0.5, top?: P2[]): void {
  const r = wound([ring])[0]
  const e = over ? offsetRing(r, over) : r
  const m = centroid(r)
  const inner: V3 = [m.x, y - 1, m.z]
  for (let i = 0; i < e.length; i++) {
    const j = (i + 1) % e.length
    const pa = e[i], pb = e[j]
    if (top) {
      const qa = top[i], qb = top[j]
      panel(out, [[pa.x, y, pa.z], [pb.x, y, pb.z], [qb.x, y + rise, qb.z], [qa.x, y + rise, qa.z]], inner, c)
    } else {
      panel(out, [[pa.x, y, pa.z], [pb.x, y, pb.z], [m.x, y + rise, m.z], [m.x, y + rise, m.z]], inner, c)
    }
  }
}

/** A low bed on the ground: its top `h` up and a kerb round it. No underside: nobody sees one. */
export function bed(out: MeshBuilder, ring: P2[], h: number, top: Rgb, kerb: Rgb = shade(top, 0.72)): void {
  const r = wound([ring])[0]
  capPolygonWithHoles(out, [r], h, top, FIXED)
  for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    out.quad([[e.a.x, 0, e.a.z], [e.b.x, 0, e.b.z], [e.b.x, h, e.b.z], [e.a.x, h, e.a.z]], [e.nx, 0, e.nz], UV, kerb, FIXED)
  }
}

/** A ring's points in a run of arcs about (cx, cz): `n` segments from bearing-free angle a0 to a1, radius r, flat `c` at y. */
export function arc(cx: number, cz: number, r: number, a0: number, a1: number, n: number): P2[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n
    return { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r }
  })
}

/** An open strip of wall along a polyline, y0..y1, its normals turned away from `inner`. */
export function stripWall(out: MeshBuilder, line: P2[], y0: number, y1: number, inner: P2, c: Rgb, tag = FIXED): void {
  for (let i = 0; i + 1 < line.length; i++) {
    const a = line[i], b = line[i + 1]
    panel(out, [[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [inner.x, (y0 + y1) / 2, inner.z], c, tag)
  }
}

/** A sloped band between two polylines of the same length: a stepped roof's lid, a zinc skirt. */
export function stripSlope(out: MeshBuilder, a: P2[], ya: number, b: P2[], yb: number, inner: V3, c: Rgb, tag = FIXED): void {
  for (let i = 0; i + 1 < a.length; i++) {
    panel(out, [[a[i].x, ya, a[i].z], [a[i + 1].x, ya, a[i + 1].z], [b[i + 1].x, yb, b[i + 1].z], [b[i].x, yb, b[i].z]], inner, c, tag)
  }
}
