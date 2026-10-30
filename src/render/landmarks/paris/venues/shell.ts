/**
 * What the halls of wave 4 share (2026-10-30): a building drawn from its plan's edges. Each edge knows its outward normal,
 * so a pier, a window or a pane is placed by how far along the edge it stands and how far proud of the wall. Rings are
 * anticlockwise, as towerRing and shapes.ts `ccw` give them. Not a builder: nothing is registered.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { FIXED, type Rgb } from '../../../models.ts'
import { quadN, type V3 } from './bowl.ts'

export type P2 = { x: number; z: number }
export interface Edge { a: P2; b: P2; L: number; tx: number; tz: number; nx: number; nz: number }
type Paint = Rgb | ((edge: number) => Rgb)

export const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi)

/** the ring's edges, each with its outward normal */
export function edgesOf(ring: P2[]): Edge[] {
  return ring.map((a, i) => {
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const tx = (b.x - a.x) / L
    const tz = (b.z - a.z) / L
    return { a, b, L, tx, tz, nx: tz, nz: -tx }
  })
}

/** the band between two rings of the same count: a wall ('out'), a roof's slope ('up'), an eave's soffit ('down') */
export function skirt(out: MeshBuilder, a: P2[], ya: number, b: P2[], yb: number, want: 'out' | 'up' | 'down', c: Paint, tag = FIXED): void {
  for (let i = 0; i < a.length; i++) {
    const j = (i + 1) % a.length
    const L = Math.hypot(a[j].x - a[i].x, a[j].z - a[i].z)
    if (L < 0.02) continue
    const n: V3 = want === 'out' ? [(a[j].z - a[i].z) / L, 0, -(a[j].x - a[i].x) / L] : want === 'up' ? [0, 1, 0] : [0, -1, 0]
    quadN(out, [[a[i].x, ya, a[i].z], [a[j].x, ya, a[j].z], [b[j].x, yb, b[j].z], [b[i].x, yb, b[i].z]], n, typeof c === 'function' ? c(i) : c, tag)
  }
}

export const walls = (out: MeshBuilder, ring: P2[], y0: number, y1: number, c: Paint, tag = FIXED): void => skirt(out, ring, y0, ring, y1, 'out', c, tag)

/** a point `t` along the edge and `off` out from it */
export const onEdge = (e: Edge, t: number, off = 0): P2 => ({ x: e.a.x + e.tx * t + e.nx * off, z: e.a.z + e.tz * t + e.nz * off })

/** one flat pane on the edge from t0 to t1, `off` proud of the wall */
export function sheet(out: MeshBuilder, e: Edge, t0: number, t1: number, y0: number, y1: number, off: number, c: Rgb, tag = FIXED): void {
  const p = onEdge(e, t0, off)
  const q = onEdge(e, t1, off)
  quadN(out, [[p.x, y0, p.z], [q.x, y0, q.z], [q.x, y1, q.z], [p.x, y1, p.z]], [e.nx, 0, e.nz], c, tag)
}

/** a pier or a fin standing out from the wall: its face, its two cheeks and its head */
export function pier(out: MeshBuilder, e: Edge, t: number, w: number, d: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  const P = (s: number, o: number, y: number): V3 => { const q = onEdge(e, t + s, o); return [q.x, y, q.z] }
  quadN(out, [P(-w / 2, d, y0), P(w / 2, d, y0), P(w / 2, d, y1), P(-w / 2, d, y1)], [e.nx, 0, e.nz], c, tag)
  quadN(out, [P(-w / 2, 0, y0), P(-w / 2, d, y0), P(-w / 2, d, y1), P(-w / 2, 0, y1)], [-e.tx, 0, -e.tz], c, tag)
  quadN(out, [P(w / 2, 0, y0), P(w / 2, d, y0), P(w / 2, d, y1), P(w / 2, 0, y1)], [e.tx, 0, e.tz], c, tag)
  quadN(out, [P(-w / 2, 0, y1), P(w / 2, 0, y1), P(w / 2, d, y1), P(-w / 2, d, y1)], [0, 1, 0], c, tag)
}

/** panes along the edge at about `pitch`, `w` wide, centred in their bays; `margin` clear at each end */
export function row(out: MeshBuilder, e: Edge, y0: number, h: number, pitch: number, w: number, off: number, c: Rgb, tag = FIXED, margin = 1): void {
  const span = e.L - 2 * margin
  if (span < w) return
  const n = Math.max(1, Math.floor(span / pitch))
  for (let i = 0; i < n; i++) {
    const t = margin + (span * (i + 0.5)) / n
    sheet(out, e, t - w / 2, t + w / 2, y0, y0 + h, off, c, tag)
  }
}

/** a triangle seen from both sides: a membrane, a sail */
export function sail(out: MeshBuilder, a: V3, b: V3, c: V3, col: Rgb, tag = FIXED): void {
  const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const v: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  quadN(out, [a, b, c, c], n, col, tag)
  quadN(out, [a, b, c, c], [-n[0], -n[1], -n[2]], col, tag)
}

/** the corners where the plan turns back on itself between two long edges: where a stair tower stands in a notch */
export function reflexCorners(ring: P2[], minEdge: number): P2[] {
  const es = edgesOf(ring)
  const found: P2[] = []
  for (let i = 0; i < es.length; i++) {
    const p = es[(i - 1 + es.length) % es.length]
    const q = es[i]
    if (p.tx * q.tz - p.tz * q.tx < -0.3 && p.L >= minEdge && q.L >= minEdge) found.push(q.a)
  }
  return found
}
