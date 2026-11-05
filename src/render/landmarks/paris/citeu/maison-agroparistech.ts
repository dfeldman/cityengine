/**
 * THE MAISON INTERNATIONALE AGROPARISTECH (ex-Maison de l'Institut National Agronomique) — RENÉ PATOUILLARD (1928):
 * a U round a cour d'honneur open to the north-north-west, five storeys under a steep slate mansard with gabled
 * dormers; pale render on the lower storeys, buff brick above, the wing ends rising into steep pointed gables,
 * tall brick chimneys, ivy climbing the lower walls.
 * Refs: Commons "France Paris Cite Universitaire Maison Institut National Agronomique 01.JPG", "…PH83164.jpg"
 * (docs/landmarks/refs/citeu/agroparistech/). Plan from OSM way 28754392; the court mouth faces bearing ~322.
 */
import earcut from 'earcut'
import type { MeshBuilder } from '../../../buildings.ts'
import { FIXED } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

const RENDER: Rgb = hex('#ebe6d8'), BRICK: Rgb = hex('#d6bf8c'), SLATE: Rgb = hex('#4b5059'), ROOF: Rgb = hex('#5e626a')
const GLASS: Rgb = hex('#3a4048'), SILL: Rgb = hex('#f3f0e7'), IVY: Rgb = hex('#4d6a2c'), CHIMNEY: Rgb = hex('#b89a6a')
const plaster = surfaceTag('stucco'), brickTag = surfaceTag('brick'), glassTag = surfaceTag('glass')

const STOREYS = 5, GF = 3.6, FL = 3.0           // ground storey, upper storeys
const RENDER_TOP = 3                            // storeys of pale render before the brick
const MANSARD_H = 3.4, MANSARD_IN = 1.0         // the slate slope: rise and inset
const GABLE_H = 5.5, GABLE_MIN = 8, GABLE_MAX = 13, GABLE_NEIGHBOUR = 15
const BAY = 3.1, WIN_W = 1.25, WIN_H = 1.75, GF_WIN_H = 2.1, SILL_Y = 0.9
const DORMER_W = 1.5, DORMER_H = 1.9, DORMER_PEAK = 0.8, DORMER_MIN_EDGE = 6
const IVY_TOP = 10, IVY_EVERY = 2               // ivy on every other long wall, up to this height
const CHIMNEY_W = 1.1, CHIMNEY_D = 0.7, CHIMNEY_UP = 2.2

type P = { x: number; z: number }
type V = [number, number, number]

function onWall(out: MeshBuilder, a: P, b: P, n: V, t0: number, t1: number, y0: number, y1: number, c: Rgb, d: number, tag = FIXED): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z), ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
  const p = (t: number, y: number): V => [a.x + ux * t + n[0] * d, y, a.z + uz * t + n[2] * d]
  out.quad([p(t0, y0), p(t1, y0), p(t1, y1), p(t0, y1)], n, [[0, 0], [t1 - t0, 0], [t1 - t0, y1 - y0], [0, y1 - y0]], c, tag)
}

const tri = (out: MeshBuilder, p: V, q: V, r: V, n: V, c: Rgb, tag = FIXED): void =>
  out.quad([p, q, r, r], n, [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], c, tag)

function box(out: MeshBuilder, cx: number, cz: number, ux: number, uz: number, w: number, d: number, y0: number, y1: number, c: Rgb): void {
  const vx = -uz, vz = ux, hw = w / 2, hd = d / 2
  const k = (s: number, t: number): P => ({ x: cx + ux * s + vx * t, z: cz + uz * s + vz * t })
  const cs = [k(-hw, -hd), k(hw, -hd), k(hw, hd), k(-hw, hd)]
  for (let i = 0; i < 4; i++) {
    const a = cs[i], b = cs[(i + 1) % 4], L = Math.hypot(b.x - a.x, b.z - a.z)
    onWall(out, a, b, [(b.z - a.z) / L, 0, -(b.x - a.x) / L], 0, L, y0, y1, c, 0)
  }
  out.quad(cs.map(p => [p.x, y1, p.z] as V).reverse() as [V, V, V, V], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
}

function cap(out: MeshBuilder, ring: P[], y: number, c: Rgb): void {
  const ix = earcut(ring.flatMap(p => [p.x, p.z]))
  for (let i = 0; i < ix.length; i += 3) {
    const p = ring[ix[i]], q = ring[ix[i + 1]], r = ring[ix[i + 2]]
    out.quad([[p.x, y, p.z], [q.x, y, q.z], [r.x, y, r.z], [r.x, y, r.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
}

const ringOf = (fit: Fit): P[] => fit.ring && fit.ring.length >= 3 ? fit.ring : [
  { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]

export function maisonAgroParisTech(out: MeshBuilder, fit: Fit): void {
  const ring = ringOf(fit), N = ring.length, eave = GF + (STOREYS - 1) * FL, top = eave + MANSARD_H
  let area = 0
  for (let i = 0; i < N; i++) { const a = ring[i], b = ring[(i + 1) % N]; area += a.x * b.z - b.x * a.z }
  const ccw = area > 0
  const len = ring.map((a, i) => { const b = ring[(i + 1) % N]; return Math.hypot(b.x - a.x, b.z - a.z) })
  const nrm = ring.map((a, i): V => {
    const b = ring[(i + 1) % N], L = len[i] || 1, dx = (b.x - a.x) / L, dz = (b.z - a.z) / L
    return ccw ? [dz, 0, -dx] : [-dz, 0, dx]
  })
  const gable = len.map((L, i) => L >= GABLE_MIN && L <= GABLE_MAX && len[(i + N - 1) % N] > GABLE_NEIGHBOUR && len[(i + 1) % N] > GABLE_NEIGHBOUR)
  // the mansard's upper ring: every corner mitred inward
  const inner = ring.map((p, i): P => {
    const n1 = nrm[(i + N - 1) % N], n2 = nrm[i], s = 1 + n1[0] * n2[0] + n1[2] * n2[2]
    return { x: p.x - MANSARD_IN * (n1[0] + n2[0]) / s, z: p.z - MANSARD_IN * (n1[2] + n2[2]) / s }
  })
  const renderY = GF + (RENDER_TOP - 1) * FL

  for (let i = 0; i < N; i++) {
    const a = ring[i], b = ring[(i + 1) % N], L = len[i], n = nrm[i]
    if (L < 0.3) continue
    onWall(out, a, b, n, 0, L, -0.3, renderY, RENDER, 0, plaster)
    onWall(out, a, b, n, 0, L, renderY, eave, BRICK, 0, brickTag)
    onWall(out, a, b, n, 0, L, eave - 0.25, eave + 0.1, SILL, 0.06)              // the cornice
    onWall(out, a, b, n, 0, L, renderY - 0.1, renderY + 0.15, SILL, 0.04)         // string course at the brick
    // the mansard slope
    const ia = inner[i], ib = inner[(i + 1) % N]
    const sn: V = [n[0] * 0.95, 0.3, n[2] * 0.95]
    out.quad([[a.x, eave, a.z], [b.x, eave, b.z], [ib.x, top, ib.z], [ia.x, top, ia.z]], sn,
      [[0, 0], [L, 0], [L, MANSARD_H], [0, MANSARD_H]], SLATE, FIXED)
    if (L < 2.4) continue
    const cols = Math.max(1, Math.round(L / BAY)), step = L / cols
    const ivy = !gable[i] && L > 15 && i % IVY_EVERY === 0
    for (let s = 0; s < STOREYS; s++) {
      const fy = s === 0 ? 0 : GF + (s - 1) * FL, wy = fy + (s === 0 ? 0.8 : SILL_Y), wh = s === 0 ? GF_WIN_H : WIN_H
      for (let k = 0; k < cols; k++) {
        const t = (k + 0.5) * step, w = Math.min(WIN_W, step - 0.5)
        onWall(out, a, b, n, t - w / 2, t + w / 2, wy, wy + wh, GLASS, 0.04, glassTag)
        onWall(out, a, b, n, t - w / 2 - 0.12, t + w / 2 + 0.12, wy - 0.15, wy, SILL, 0.08)
      }
    }
    if (ivy) for (let k = 0; k <= cols; k++) {
      const t = k * step, w = Math.min(step - WIN_W - 0.3, 1.4), h = IVY_TOP * (0.6 + 0.4 * ((k * 7 + i) % 3) / 2)
      if (w > 0.3) onWall(out, a, b, n, Math.max(0, t - w / 2), Math.min(L, t + w / 2), 0, h, IVY, 0.1)
    }
    if (gable[i]) {
      // the wing end rises into a steep pointed gable, a chimney stack behind its apex
      const m: P = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }
      tri(out, [a.x, eave, a.z], [b.x, eave, b.z], [m.x, eave + GABLE_H, m.z], n, BRICK)
      const s0 = 0.4, k0: P = { x: a.x + n[0] * s0, z: a.z + n[2] * s0 }, k1: P = { x: b.x + n[0] * s0, z: b.z + n[2] * s0 }
      const r0: V = [m.x - n[0] * L, eave + GABLE_H, m.z - n[2] * L], apex: V = [m.x + n[0] * s0, eave + GABLE_H + 0.2, m.z + n[2] * s0]
      // two slate pitches running back from the gable onto the mansard
      tri(out, [k0.x, eave - 0.1, k0.z], apex, r0, [-(b.z - a.z) / L, 0.7, (b.x - a.x) / L], SLATE)
      tri(out, apex, [k1.x, eave - 0.1, k1.z], r0, [(b.z - a.z) / L, 0.7, -(b.x - a.x) / L], SLATE)
      box(out, m.x - n[0] * 1.2, m.z - n[2] * 1.2, (b.x - a.x) / L, (b.z - a.z) / L, CHIMNEY_W, CHIMNEY_D, eave, eave + GABLE_H + CHIMNEY_UP, CHIMNEY)
      continue
    }
    if (L >= DORMER_MIN_EDGE) {
      // gabled dormers, one over each window column
      const d = MANSARD_IN * 0.45, y0 = eave + 0.25, y1 = y0 + DORMER_H
      for (let k = 0; k < cols; k++) {
        const t = (k + 0.5) * step, h = DORMER_W / 2
        onWall(out, a, b, n, t - h, t + h, y0, y1, RENDER, -d, plaster)
        onWall(out, a, b, n, t - h + 0.25, t + h - 0.25, y0 + 0.2, y1 - 0.15, GLASS, -d + 0.03, glassTag)
        const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
        const at = (tt: number, y: number, dd: number): V => [a.x + ux * tt + n[0] * dd, y, a.z + uz * tt + n[2] * dd]
        tri(out, at(t - h, y1, -d), at(t + h, y1, -d), at(t, y1 + DORMER_PEAK, -d), n, RENDER, plaster)
        const back = -MANSARD_IN
        out.quad([at(t - h - 0.1, y1, -d + 0.05), at(t, y1 + DORMER_PEAK + 0.05, -d + 0.05), at(t, y1 + DORMER_PEAK, back), at(t - h, y1, back)],
          [-ux, 0.8, -uz], [[0, 0], [1, 0], [1, 1], [0, 1]], SLATE, FIXED)
        out.quad([at(t, y1 + DORMER_PEAK + 0.05, -d + 0.05), at(t + h + 0.1, y1, -d + 0.05), at(t + h, y1, back), at(t, y1 + DORMER_PEAK, back)],
          [ux, 0.8, uz], [[0, 0], [1, 0], [1, 1], [0, 1]], SLATE, FIXED)
      }
      if (L > 18) box(out, inner[i].x + (ib.x - ia.x) * 0.5 - n[0] * 0.6, inner[i].z + (ib.z - ia.z) * 0.5 - n[2] * 0.6,
        (b.x - a.x) / L, (b.z - a.z) / L, CHIMNEY_W, CHIMNEY_D, top - 0.5, top + CHIMNEY_UP, CHIMNEY)
    }
  }
  cap(out, inner, top, ROOF)    // the flat zinc top of the mansard, its own colour
}
