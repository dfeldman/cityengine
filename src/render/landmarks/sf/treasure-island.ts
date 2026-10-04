/**
 * TREASURE ISLAND's 1939 Golden Gate International Exposition survivors (BUGS.md #254; owner: "Treasure Island needs its
 * own kit buildings"). Building 1 (relation/16681702), the Exposition's administration building and then the airport
 * terminal for the China Clippers: Art Moderne, a long two-storey cream block whose ENDS curve round, tall vertical
 * fins between bands of glass, and a central entrance pavilion rising above the roof. Buildings 2 and 3 (way/24274434,
 * way/34313540), the Exposition's palaces and then the Navy's hangars: huge, pale, under shallow BARREL VAULTS, their
 * ends tall walls of steel-framed glass.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { faceBand } from '../tower.ts'
import { boxAlong } from '../parts.ts'

const CREAM: Rgb = [0.88, 0.84, 0.74]
const GLASS: Rgb = [0.22, 0.27, 0.32]
const PALE: Rgb = [0.84, 0.83, 0.79]
const ROOF: Rgb = [0.55, 0.56, 0.56]

/**
 * Building 1, from the Commons photographs ("Administration Building, Treasure Island.jpg", "Building One, Treasure
 * Island 1.JPG", "Rear of Administration Building, Treasure Island.jpg"; the reference wanted since #319): a CRESCENT
 * in plan — the front a concave sweep of tall steel windows between fluted pilasters, three storeys high, the back
 * the convex wall of a great drum with small windows — short two-storey wings running on from its tips, and on the
 * roof at the middle the octagonal glass control cab the China Clippers were watched from. The crescent opens to −z,
 * the parking court (first render had it backwards, the drum to the cars).
 */
export function tiBuildingOne(out: MeshBuilder, fit: Fit): void {
  const stucco = surfaceTag('stucco'), glass = surfaceTag('glass')
  // OSM maps only a slab of it: the crescent is drawn at its real size, about 95 m across the tips
  const half = 60
  const TH = (50 * Math.PI) / 180
  const D = 20, H = 14, HW = 9
  const R2 = (half - 14) / Math.sin(TH), R1 = R2 - D
  // the arcs' centre on the open side, which is −z (the parking court towards the city); the drum's back at +z
  const F = -1
  const cz = F * (R2 - (R2 - R1 * Math.cos(TH)) / 2)
  const N = 20
  const arc = (R: number): { x: number; z: number }[] => {
    const pts: { x: number; z: number }[] = []
    for (let i = 0; i <= N; i++) { const t = -TH + (2 * TH * i) / N; pts.push({ x: R * Math.sin(t), z: cz - F * R * Math.cos(t) }) }
    return pts
  }
  const front = arc(R1), back = arc(R2)
  let ring = [...front, ...[...back].reverse()]
  let A = 0
  for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; A += p.x * q.z - q.x * p.z }
  if (A < 0) ring = ring.reverse()
  faceBand(out, ring, 0, H, { kind: 'blank', wall: CREAM, material: 'stucco' })
  faceBand(out, ring, H, H + 1, { kind: 'blank', wall: CREAM, material: 'stucco' })
  capPolygon(out, ring, H + 1, ROOF, stucco)
  // the front: tall windows between fluted pilasters, on each segment of the concave sweep
  for (let i = 0; i < N; i++) {
    const p = front[i], q = front[i + 1]
    const mx = (p.x + q.x) / 2, mz = (p.z + q.z) / 2, len = Math.hypot(q.x - p.x, q.z - p.z)
    // outward (toward the open side) is from the arc toward its centre
    const nx = -mx, nz = cz - mz, nl = Math.hypot(nx, nz)
    const hd = Math.atan2(nx / nl, nz / nl)
    const at = (o: number): [number, number] => [mx + (nx / nl) * o, mz + (nz / nl) * o]
    const [wx, wz] = at(0.05)
    boxAlong(out, wx, 7.5, wz, len * 0.3, 5.5, 0.04, hd, GLASS, glass)
    const [px, pz] = at(0.3)
    const ex = px + ((q.x - p.x) / len) * (len / 2), ez = pz + ((q.z - p.z) / len) * (len / 2)
    boxAlong(out, ex, H / 2 + 0.5, ez, 0.45, H / 2 + 0.5, 0.35, hd, CREAM, stucco)
    boxAlong(out, ex, H / 2 + 0.5, ez, 0.12, H / 2, 0.45, hd, [0.8, 0.76, 0.66], stucco)
  }
  // the back: the drum's small windows in two rows
  for (let i = 0; i < N; i++) {
    const p = back[i], q = back[i + 1]
    const mx = (p.x + q.x) / 2, mz = (p.z + q.z) / 2
    const nx = mx, nz = mz - cz, nl = Math.hypot(nx, nz)
    const hd = Math.atan2(nx / nl, nz / nl)
    for (const y of [3, 7]) boxAlong(out, mx + (nx / nl) * 0.05, y, mz + (nz / nl) * 0.05, 1.1, 0.8, 0.04, hd, GLASS, glass)
  }
  // the wings, running on from the tips along the crescent's own line (its tangent there), two storeys of ribbon glass
  for (const sgn of [-1, 1]) {
    const tipF = front[sgn < 0 ? 0 : N], tipB = back[sgn < 0 ? 0 : N]
    const ux = sgn * Math.cos(TH), uz = F * Math.sin(TH), WL = 10
    const wing = [tipF, tipB, { x: tipB.x + ux * WL, z: tipB.z + uz * WL }, { x: tipF.x + ux * WL, z: tipF.z + uz * WL }]
    let Aw = 0
    for (let i = 0; i < 4; i++) { const p = wing[i], q = wing[(i + 1) % 4]; Aw += p.x * q.z - q.x * p.z }
    const wr = Aw < 0 ? [...wing].reverse() : wing
    faceBand(out, wr, 0, HW, { kind: 'bands', wall: CREAM, glass: GLASS, floor: 4.5, solid: 0.6, material: 'stucco' })
    capPolygon(out, wr, HW, ROOF, stucco)
  }
  // the control cab on the roof at the middle: an octagon of glass under a flat cap, the flag above
  const cx = 0, cz2 = cz - (F * (R1 + R2)) / 2
  prism(out, cx, cz2, H + 1, H + 3, 5, 8, CREAM, stucco)
  prism(out, cx, cz2, H + 3, H + 6.2, 4.2, 8, GLASS, glass)
  for (let k = 0; k < 8; k++) { const t = (k / 8) * Math.PI * 2 + Math.PI / 8; box(out, cx + Math.cos(t) * 4.1, H + 4.6, cz2 + Math.sin(t) * 4.1, 0.15, 1.6, 0.15, CREAM, stucco) }
  prism(out, cx, cz2, H + 6.2, H + 6.7, 4.8, 8, CREAM, stucco)
  box(out, cx, H + 9, cz2, 0.06, 2.3, 0.06, [0.8, 0.8, 0.8], surfaceTag('metal'))
}

/** Hangars 2 and 3: a long hall under a shallow barrel vault, glazed ends */
export function tiHangar(out: MeshBuilder, fit: Fit): void {
  const L = Math.max(fit.hx, fit.hz)
  const W = Math.min(fit.hx, fit.hz)
  const alongX = fit.hx >= fit.hz
  const P = (u: number, y: number, v: number): [number, number, number] => (alongX ? [u, y, v] : [v, y, u])
  const H = 14
  const RISE = 6
  const metal = surfaceTag('metal')
  // the walls
  const ring = [P(-L, 0, -W), P(L, 0, -W), P(L, 0, W), P(-L, 0, W)].map(([x, , z]) => ({ x, z }))
  faceBand(out, ring, 0, H, { kind: 'bands', wall: PALE, glass: GLASS, floor: H / 2, solid: 0.72, material: 'stucco' })
  // the vault: segments across the width
  const N = 10
  for (let i = 0; i < N; i++) {
    const v0 = -W + (2 * W * i) / N, v1 = -W + (2 * W * (i + 1)) / N
    const y0 = H + RISE * (1 - (v0 / W) ** 2), y1 = H + RISE * (1 - (v1 / W) ** 2)
    const nv = -(y1 - y0) / (v1 - v0)
    const n: [number, number, number] = alongX ? [0, 1, nv] : [nv, 1, 0]
    out.quad([P(-L, y0, v0), P(L, y0, v0), P(L, y1, v1), P(-L, y1, v1)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], ROOF, metal)
    // the vault's ends, closed down to the walls, glazed
    for (const e of [-1, 1]) {
      out.quad([P(e * L, H, v0), P(e * L, H, v1), P(e * L, y1, v1), P(e * L, y0, v0)], alongX ? [e, 0, 0] : [0, 0, e], [[0, 0], [1, 0], [1, 1], [0, 1]], GLASS, surfaceTag('glass'))
    }
  }
  // the ribs across the vault
  for (let k = -6; k <= 6; k++) {
    const u = (k / 6) * L * 0.96
    for (let i = 0; i < N; i++) {
      const v = -W + (2 * W * (i + 0.5)) / N
      const y = H + RISE * (1 - (v / W) ** 2)
      const [x, , z] = P(u, 0, v)
      box(out, x, y + 0.15, z, alongX ? 0.2 : W / N, 0.15, alongX ? W / N : 0.2, PALE, metal)
    }
  }
}
