/**
 * THE UNESCO HOUSE (Breuer, Nervi and Zehrfuss, 1958; Place de Fontenoy): the three-pointed Y of the Secretariat, eight floors on great concrete pilotis, its long fronts in deep travertine-and-concrete sun grids; the pleated concrete roof of the Conference building beside it, green with weather in the aerial; Nervi's dead-flat wave of a canopy at the
 * door. OSM has the outlines and calls it offices. Plans: OSM way/249680748 (the Y), way/249680750 (the hall), in their own frames round their middles, simplified to 0.7 m. x east, z north (front 180) about the Y's middle.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { strut } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade, type Rgb } from '../../kit.ts'
import { block } from './tag.ts'

const Y_RING: [number, number][] = [[-0.1, -59.1], [11.0, -85.5], [22.8, -81.0], [0.0, -25.4], [-1.5, -11.6], [1.1, -1.5], [6.5, 8.1], [35.5, 37.5], [25.8, 47.1], [-5.7, 16.1], [-13.5, 11.8], [-22.6, 9.5], [-29.8, 9.2], [-38.8, 11.2], [-79.7, 27.9], [-84.6, 15.3], [-40.8, -2.6], [-29.9, -9.7], [-22.1, -16.7], [-12.0, -31.0]]
/** the hall's outline, from way/249680750's middle, with its offset from the Y's */
const HALL_RING: [number, number][] = [[14.1, -34.4], [45.7, -2.0], [-11.8, 36.7], [-36.1, 11.9], [3.4, -45.3]]
const HALL_AT: [number, number] = [-36.2, -104.7]

const CONC: Rgb = hex('#a9a598'), CONC_DK: Rgb = hex('#7d7a6f'), GLASS: Rgb = hex('#7f9aa6'), COPPER: Rgb = hex('#7fa693')
const conc = surfaceTag('concrete')
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const P = (r: [number, number][]): { x: number; z: number }[] => r.map(([x, z]) => ({ x, z }))

export function unescoSiege(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, Y0 = y + 5, Y1 = y + 28, FL = 3.3
  const ring = P(Y_RING), n = ring.length
  // the wings are the ring's edges; the outline is wound anticlockwise on x east, z north, so right of a→b is outward
  let area = 0
  for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; area += a.x * b.z - b.x * a.z }
  const sgn = area > 0 ? 1 : -1
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.5) continue
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, nx = tz * sgn, nz = -tx * sgn
    const at = (u: number, h: number, d: number): [number, number, number] => [a.x + tx * u + nx * d, h, a.z + tz * u + nz * d]
    const N: [number, number, number] = [nx, 0, nz]
    const q = (u0: number, u1: number, y0: number, y1: number, d: number, c: Rgb, tag = 0): void => out.quad([at(u0, y0, d), at(u1, y0, d), at(u1, y1, d), at(u0, y1, d)], N, UVQ, c, tag)
    // the glazed ground storey set back between the pilotis
    q(0, L, y, Y0, -2.4, shade(GLASS, 0.78), surfaceTag('glass'))
    // above, the wall and the sun grid: a glass plane, then a concrete fin at each bay and slab at each floor standing out 0.8 m
    q(0, L, Y0, Y1, 0, GLASS, surfaceTag('glass'))
    const floors = Math.round((Y1 - Y0) / FL), bays = Math.max(1, Math.round(L / 3.4))
    for (let f = 0; f <= floors; f++) {
      const yy = Y0 + f * FL
      const A = at(0, yy, 0.8), B = at(L, yy, 0.8), C = at(L, yy, 0), D = at(0, yy, 0)
      out.quad([D, C, B, A], [0, 1, 0], UVQ, CONC, conc)
      q(0, L, yy - 0.22, yy, 0.8, shade(CONC, 0.94), conc)
    }
    for (let b_ = 0; b_ <= bays; b_++) {
      const u = (b_ * L) / bays
      const A = at(u, Y0, 0), B = at(u, Y0, 0.8), C = at(u, Y1, 0.8), D = at(u, Y1, 0)
      out.quad([A, B, C, D], [tx, 0, tz], UVQ, shade(CONC, 0.88), conc)
      q(u - 0.1, u + 0.1, Y0, Y1, 0.8, CONC, conc)
    }
    // the blind travertine ends of a short edge: where the wing stops
    if (i === 1 || i === 7 || i === 14) q(0, L, Y0, Y1 + 0.4, 0.82, shade(CONC, 1.08), surfaceTag('ashlar'))
    // the pilotis, Y-shaped tapering, every other bay, set a little in
    for (let k = 0; k * 6.8 < L; k++) {
      const u = 3.4 + k * 6.8
      if (u > L) break
      const bx = a.x + tx * u - nx * 0.9, bz = a.z + tz * u - nz * 0.9
      block(out, bx - 0.5, bx + 0.5, bz - 0.5, bz + 0.5, y, Y0 - 1.3, CONC_DK, conc)
      strut(out, [bx, Y0 - 1.3, bz], [bx + nx * 0.8, Y0, bz + nz * 0.8], 0.9, 0.9, CONC_DK, conc)
    }
  }
  capPolygon(out, ring, Y0 - 0.2, CONC_DK, conc)
  capPolygon(out, ring, Y1, hex('#77756d'), conc)
  // the roof: a low plant house on the knot of the Y and a thin parapet line
  block(out, -22, -8, -10, 2, Y1, Y1 + 3, CONC_DK, conc)
  // the canopy over the door on the Place de Fontenoy's concave side (the north-west crotch of the Y): Nervi's lifted, wave-edged slab on two legs
  const CX = -14, CZ = 28
  for (let i = 0; i < 12; i++) {
    const x0 = CX - 11 + i * (22 / 12), x1 = x0 + 22 / 12
    const h = (x: number): number => Y0 - 0.2 - 1.2 * Math.cos(((x - CX) / 11) * Math.PI * 1.5) ** 2
    out.quad([[x0, h(x0), CZ - 6], [x1, h(x1), CZ - 6], [x1, h(x1) + 0.7, CZ + 6], [x0, h(x0) + 0.7, CZ + 6]], [0, 1, 0], UVQ, shade(CONC, 0.85), conc)
    out.quad([[x0, h(x0), CZ + 6], [x1, h(x1), CZ + 6], [x1, h(x1) + 0.7, CZ + 6], [x0, h(x0) + 0.7, CZ + 6]], [0, 0, 1], UVQ, CONC, conc)
    out.quad([[x1, h(x1) - 0.25, CZ - 6], [x0, h(x0) - 0.25, CZ - 6], [x0, h(x0) + 0.45, CZ + 6], [x1, h(x1) + 0.45, CZ + 6]], [0, -1, 0], UVQ, CONC_DK, conc)
  }
  for (const s of [-1, 1]) strut(out, [CX + s * 5.5, y, CZ - 2], [CX + s * 5.5, Y0 - 1, CZ - 2], 1.1, 0.7, CONC_DK, conc)
  // the Conference building: 13 m walls, low-glazed, under the pleated folded plate, its folds across the long side, green with its copper
  const hall = HALL_RING.map(([x, z]): [number, number] => [x + HALL_AT[0], z + HALL_AT[1]])
  const m = hall.length, H0 = y + 10, H1 = y + 15
  for (let i = 0; i < m; i++) {
    const [ax, az] = hall[i], [bx, bz] = hall[(i + 1) % m], L = Math.hypot(bx - ax, bz - az)
    const nx = (bz - az) / L, nz = -(bx - ax) / L
    out.quad([[ax, y, az], [bx, y, bz], [bx, y + 3.4, bz], [ax, y + 3.4, az]], [nx, 0, nz], UVQ, shade(GLASS, 0.85), surfaceTag('glass'))
    out.quad([[ax, y + 3.4, az], [bx, y + 3.4, bz], [bx, H0, bz], [ax, H0, az]], [nx, 0, nz], UVQ, CONC, conc)
  }
  // (folds on bearing 135; each strip clipped to the hall's outline by its crossings)
  const t = (135 * Math.PI) / 180, ux = Math.sin(t), uz = Math.cos(t), vx = uz, vz = -ux
  const coords = hall.map(([x, z]) => ({ u: x * ux + z * uz, v: x * vx + z * vz }))
  const v0 = Math.min(...coords.map((c) => c.v)), v1 = Math.max(...coords.map((c) => c.v))
  const span = (v: number): [number, number] | null => {
    const us: number[] = []
    for (let i = 0; i < m; i++) { const a = coords[i], b = coords[(i + 1) % m]; if ((a.v - v) * (b.v - v) <= 0 && a.v !== b.v) us.push(a.u + ((v - a.v) / (b.v - a.v)) * (b.u - a.u)) }
    return us.length >= 2 ? [Math.min(...us), Math.max(...us)] : null
  }
  const W = 3.6, W2 = (v1 - v0) / Math.round((v1 - v0) / W), toW = (u: number, v: number, h: number): [number, number, number] => [ux * u + vx * v, h, uz * u + vz * v]
  for (let k = 0, v = v0; v < v1 - 0.01; k++, v += W2) {
    const a = span(v + 0.01), b = span(v + W2 - 0.01)
    if (!a || !b) continue
    const ya = k % 2 ? H1 : H0 + 1, yb = k % 2 ? H0 + 1 : H1
    const nn: [number, number, number] = [vx * (ya - yb), W2, vz * (ya - yb)]
    out.quad([toW(a[0], v, ya), toW(a[1], v, ya), toW(b[1], v + W2, yb), toW(b[0], v + W2, yb)], nn, UVQ, shade(COPPER, 0.92 + (k % 2) * 0.16), surfaceTag('copper'))
    // the fold's fascia on each end
    for (const [ua, ub, s] of [[a[0], b[0], -1], [a[1], b[1], 1]] as const) {
      out.quad([toW(ua, v, H0), toW(ub, v + W2, H0), toW(ub, v + W2, yb), toW(ua, v, ya)], [ux * s, 0, uz * s], UVQ, CONC, conc)
    }
  }
}
