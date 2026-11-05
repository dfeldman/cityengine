/**
 * "Home" (Hamonic+Masson, 2015), Avenue de France / Place Farhat Hached, Paris 13e, OSM way/364765319. Planted from
 * IGN lidar MNS (tools/ign-mns.ts, 2026-11-04) and the 2024 aerial: two blocks turned ~31 deg off east to the avenue
 * (a 43 m NW one with two 46 m lift cores, a 51 m SE one with solar roof panels), joined by a terraced mass that steps
 * down SE from 37 m to 15 m in 3 m storeys with green planted terraces (red/orange awnings seen on the aerial). The
 * facades are the architects' stacked, offset projecting boxes: loggia boxes in warm timber/white, hashed over the
 * bays so no two floors line up. Geometry is written in metres east/north of the OSM box centre and carried into the
 * model's frame by matching the fitted ring to the outline's vertices, so any `front` works.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

type P = [number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const HOME = {
  GROUND: 4.5, FLOOR: 3.0, PARAPET: 1.0, BAY: 4.5, MARGIN: 0.8, WIN_BOT: 0.35, WIN_TOP: 2.5, SLAB: 0.3,
  BOX_DEPTH: 1.8, BOX_W: 3.6, BOX_CHANCE: 0.42, BOX_LAYERS: 2, // projecting loggia boxes
  CORE_H: 3, CORE_SHARE: 0.12, PANEL_H: 0.6,
  TERRACE_PLANTER: 0.5, SEED: 7,
}
// OSM outline vertices, metres east/north of the box centre (for registering the fitted frame)
const OUTLINE: P[] = [[-11.4, 34.7], [-9.6, 32.3], [-8.8, 31.1], [-0.7, 19.6], [-0.7, 4.9], [8.5, -9.8], [16, -5.3], [20.3, -2.6], [30.4, -19.3], [26.3, -21.8], [5, -34.8], [-5.2, -18.1], [-7.5, -14.4], [-22.2, 9.2], [-30.4, 22.7], [-14.8, 32.6]]
const NW_BLOCK: P[] = [[-30.3, 23.9], [-13.8, 33.6], [-10, 30.3], [-10, 24], [-4.8, 23.1], [-2.9, 20.5], [-2.9, 10], [-19.8, 5.9]]
const SE_BLOCK: P[] = [[-4.8, -17.7], [7.9, -7.2], [18.4, -3.4], [26, -16], [4.2, -33.8]]
const TERRACE: P[] = [[-19.8, 5.9], [-2.9, 10], [1.9, 1], [7.2, -7.9], [-4.8, -18.1], [-10, -11.7], [-16.8, -0.8]]
// north edge of each step and its roof height (lidar rows z = 12 .. -6)
const STEPS: [number, number][] = [[9, 37], [7, 34], [5, 31.5], [3, 28.5], [1, 25], [-1, 22], [-3, 19], [-5, 16.5]]
const TERRACE_BASE = 15
const NW_H = 43.5, SE_H = 51

const area = (p: P[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2
const ccw = (p: P[]): P[] => (area(p) < 0 ? [...p].reverse() : p)
const hash = (a: number, b: number, c: number): number => { let h = (a * 374761393 + b * 668265263 + c * 2147483647 + HOME.SEED * 1274126177) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }

/** polygon clipped to z >= zk */
const clipZ = (p: P[], zk: number): P[] => {
  const o: P[] = []
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], ia = a[1] >= zk, ib = b[1] >= zk
    if (ia) o.push(a)
    if (ia !== ib) { const t = (zk - a[1]) / (b[1] - a[1]); o.push([a[0] + (b[0] - a[0]) * t, zk]) }
  }
  return o
}

export const homeHamonicMasson = (out: MeshBuilder, fit: Fit): void => {
  const K = HOME
  // registration: rotation + shift taking the ENU outline onto the fitted ring
  const ring: P[] = fit.ring?.length ? fit.ring.map((q) => [q.x, q.z]) : OUTLINE
  let th = 0, tx = 0, tz = 0, best = Infinity
  const xf = (p: P, t: number, ax: number, az: number): P => [p[0] * Math.cos(t) - p[1] * Math.sin(t) + ax, p[0] * Math.sin(t) + p[1] * Math.cos(t) + az]
  const cen = (p: P[]): P => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length]
  const cr = cen(ring), co = cen(OUTLINE)
  for (let d = 0; d < 720; d++) {
    const t = (d / 720) * Math.PI * 2, c0 = xf(co, t, 0, 0)
    const ax = cr[0] - c0[0], az = cr[1] - c0[1]
    let e = 0
    for (const v of OUTLINE) { const w = xf(v, t, ax, az); e += Math.min(...ring.map((q) => Math.hypot(q[0] - w[0], q[1] - w[1]))) }
    if (e < best) { best = e; th = t; tx = ax; tz = az }
  }
  const T = (p: P): P => xf(p, th, tx, tz)
  const flipped = area(ring) < 0 // keep walls outward whichever way the fitted ring runs
  const plaster = hex('#dcd9d0'), slab = hex('#f1efe8'), glass = hex('#34414c'), roofC = hex('#8e8c86'), green = hex('#5f8a3c'), wood = hex('#b9753f'), white = hex('#f4f2ec'), awn = hex('#c9553a'), solar = hex('#23324f')
  const boxCols: Rgb[] = [wood, white, hex('#d7a15f'), plaster]

  const wall = (a: P, b: P, y0: number, y1: number, c: Rgb, off = 0): void => {
    if (y1 - y0 < 0.01) return
    const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = dz / l, nz = -dx / l
    const A = T(a), B = T(b), N = T([a[0] + nx, a[1] + nz]), nxl = N[0] - A[0], nzl = N[1] - A[1]
    const f = flipped ? -1 : 1
    out.quad([[A[0] + nxl * off, y0, A[1] + nzl * off], [B[0] + nxl * off, y0, B[1] + nzl * off], [B[0] + nxl * off, y1, B[1] + nzl * off], [A[0] + nxl * off, y1, A[1] + nzl * off]], [nxl * f, 0, nzl * f], UV, c, 0)
  }
  const top = (pts: P[], y: number, c: Rgb): void => { // ear-clipped roof
    const p = ccw(pts), idx = p.map((_, i) => i)
    const cross = (a: P, b: P, c2: P): number => (b[0] - a[0]) * (c2[1] - a[1]) - (b[1] - a[1]) * (c2[0] - a[0])
    let guard = 0
    while (idx.length > 3 && guard++ < 200) {
      let cut = false
      for (let i = 0; i < idx.length && !cut; i++) {
        const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length], a = p[ia], b = p[ib], c2 = p[ic]
        if (cross(a, b, c2) <= 1e-9) continue
        if (idx.some((k) => k !== ia && k !== ib && k !== ic && cross(a, b, p[k]) >= 0 && cross(b, c2, p[k]) >= 0 && cross(c2, a, p[k]) >= 0)) continue
        tri(a, b, c2, y, c); idx.splice(i, 1); cut = true
      }
      if (!cut) break
    }
    if (idx.length === 3) tri(p[idx[0]], p[idx[1]], p[idx[2]], y, c)
  }
  const tri = (a: P, b: P, c2: P, y: number, c: Rgb): void => {
    const A = T(a), B = T(b), C = T(c2)
    out.quad(flipped ? [[A[0], y, A[1]], [B[0], y, B[1]], [C[0], y, C[1]], [A[0], y, A[1]]] : [[C[0], y, C[1]], [B[0], y, B[1]], [A[0], y, A[1]], [C[0], y, C[1]]], [0, 1, 0], UV, c, 0)
  }
  /** an outward-projecting box on a wall at metre s..s+w along it */
  const proj = (a: P, b: P, s: number, w: number, y0: number, y1: number, c: Rgb): void => {
    const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l, nx = uz, nz = -ux
    const p: P = [a[0] + ux * s, a[1] + uz * s], q: P = [a[0] + ux * (s + w), a[1] + uz * (s + w)]
    const pe: P = [p[0] + nx * K.BOX_DEPTH, p[1] + nz * K.BOX_DEPTH], qe: P = [q[0] + nx * K.BOX_DEPTH, q[1] + nz * K.BOX_DEPTH]
    wall(p, q, y0, y1, c, K.BOX_DEPTH)
    wall(qe, q, y0, y1, shade2(c)); wall(p, pe, y0, y1, shade2(c))
    top([p, q, qe, pe], y1, slab)
    wall(p, q, y0 + 0.5, y1 - 0.5, glass, K.BOX_DEPTH + 0.04) // dark loggia opening in the front
  }
  const shade2 = (c: Rgb): Rgb => [c[0] * 0.85, c[1] * 0.85, c[2] * 0.85]

  /** walls of a polygon prism from yBase to yTop with window bays, slab lines and hashed projecting boxes */
  const tower = (poly: P[], yBase: number, yTop: number, tag: number, skip: (a: P, b: P) => boolean = () => false, boxes = true, yWall0 = 0): void => {
    const p = ccw(poly), floors = Math.max(1, Math.floor((yTop - yBase - K.PARAPET) / K.FLOOR))
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (l < 0.3) continue
      const cutEdge = skip(a, b)
      wall(a, b, cutEdge ? yBase : yWall0, yTop, plaster)
      if (l < 3) continue
      const n = Math.max(1, Math.floor((l - 2 * K.MARGIN) / K.BAY)), bw = (l - 2 * K.MARGIN) / n
      for (let f = 0; f < floors; f++) {
        const y = yBase + f * K.FLOOR + (yBase > 1 ? 0 : K.GROUND - K.FLOOR)
        if (y + K.FLOOR > yTop - K.PARAPET + 0.01) break
        const ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l
        for (let w = 0; w < n; w++) {
          const s = K.MARGIN + w * bw
          const pa: P = [a[0] + ux * s + ux * 0.3, a[1] + uz * s + uz * 0.3], pb: P = [a[0] + ux * (s + bw) - ux * 0.3, a[1] + uz * (s + bw) - uz * 0.3]
          if (boxes && hash(tag * 17 + i, f, w) < K.BOX_CHANCE && f > 0 && bw > K.BOX_W) {
            const off = (hash(tag, f * 7 + i, w) - 0.5) * (bw - K.BOX_W)
            proj(a, b, s + (bw - K.BOX_W) / 2 + off, K.BOX_W, y + 0.2, y + K.FLOOR - 0.2, boxCols[Math.floor(hash(tag + 3, f, w + i * 5) * boxCols.length)])
          } else wall(pa, pb, y + K.WIN_BOT, y + K.WIN_TOP, glass, 0.04)
        }
        wall(a, b, y + K.FLOOR - K.SLAB, y + K.FLOOR, slab, 0.05)
      }
    }
  }

  // --- NW block (43.5 m), ground storey recessed glazing, roof with lift cores
  tower(NW_BLOCK, 0, NW_H, 1)
  top(NW_BLOCK, NW_H, roofC)
  const cores: P[][] = [[[-27, 22], [-24.5, 23.5], [-23.5, 21.7], [-26, 20.2]], [[-14, 25], [-11.5, 26.5], [-10.6, 24.8], [-13, 23.3]]]
  for (const c of cores) { tower(c, NW_H, NW_H + K.CORE_H, 5, () => false, false); top(c, NW_H + K.CORE_H, roofC) }
  // --- SE block (51 m), solar roof
  tower(SE_BLOCK, 0, SE_H, 2)
  top(SE_BLOCK, SE_H, roofC)
  const panels: [P, P][] = [[[3, -14], [8, -11]], [[5, -19], [10, -16]], [[7, -24], [12, -21]], [[12, -9], [16, -7]], [[14, -14], [18, -12]], [[11, -20], [16, -17]]]
  for (const [a, b] of panels) {
    const q: P[] = [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]]
    tower(q, SE_H, SE_H + K.PANEL_H, 6, () => false, false); top(q, SE_H + K.PANEL_H, solar)
  }
  // --- terraced mass: each step a prism clipped at its north edge, its riser glazed, its roof planted
  for (let k = 0; k < STEPS.length + 1; k++) {
    const [zk, h] = k < STEPS.length ? STEPS[k] : [-99, TERRACE_BASE]
    const poly = clipZ(TERRACE, zk)
    if (poly.length < 3) continue
    const lower = k < STEPS.length ? (k + 1 < STEPS.length ? STEPS[k + 1][1] : TERRACE_BASE) : 0
    tower(poly, lower, h, 10 + k, (a, b) => Math.abs(a[1] - zk) < 1e-3 && Math.abs(b[1] - zk) < 1e-3, false, lower)
    top(poly, h, green)
    // the planter lip and an awning along the riser
    const ra = poly.filter((q) => Math.abs(q[1] - zk) < 1e-3).sort((u, v) => u[0] - v[0])
    if (ra.length === 2 && k < STEPS.length) { wall(ra[0], ra[1], h - 0.9, h, awn, 0.1); wall(ra[1], ra[0], h - 0.9, h, awn, -0.1) }
  }
  void K.TERRACE_PLANTER; void K.CORE_SHARE
}
