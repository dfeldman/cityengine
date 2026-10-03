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
import { box } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { faceBand } from '../tower.ts'

const CREAM: Rgb = [0.88, 0.84, 0.74]
const GLASS: Rgb = [0.22, 0.27, 0.32]
const PALE: Rgb = [0.84, 0.83, 0.79]
const ROOF: Rgb = [0.55, 0.56, 0.56]

/** Building 1: x along its length, the curved ends at ±x */
export function tiBuildingOne(out: MeshBuilder, fit: Fit): void {
  const L = Math.max(30, fit.hx)
  const W = Math.min(Math.max(10, fit.hz), 22)
  const H = 11
  const stucco = surfaceTag('stucco')
  // the plan: a rectangle with half-round ends
  const ring: { x: number; z: number }[] = []
  const a = L - W
  for (let i = 0; i <= 12; i++) { const t = -Math.PI / 2 + (i / 12) * Math.PI; ring.push({ x: a + Math.cos(t) * W, z: Math.sin(t) * W }) }
  for (let i = 0; i <= 12; i++) { const t = Math.PI / 2 + (i / 12) * Math.PI; ring.push({ x: -a + Math.cos(t) * W, z: Math.sin(t) * W }) }
  faceBand(out, ring, 0, 1, { kind: 'blank', wall: CREAM, material: 'stucco' })
  // two storeys of ribbon glass between the fins
  faceBand(out, ring, 1, H, { kind: 'bands', wall: CREAM, glass: GLASS, floor: 5, solid: 0.45, material: 'stucco' })
  faceBand(out, ring, H, H + 1.2, { kind: 'blank', wall: CREAM, material: 'stucco' })
  capPolygon(out, ring, H + 1.2, ROOF, stucco)
  // the fins up the long faces
  for (let k = -8; k <= 8; k++) for (const s of [-1, 1]) box(out, (k / 8) * a, H / 2 + 0.5, s * (W + 0.25), 0.18, H / 2, 0.35, CREAM, stucco)
  // the entrance pavilion in the middle of the long front (+z), rising above the roof, glass between its piers
  box(out, 0, (H + 7) / 2, W + 1.5, 9, (H + 7) / 2, 3, CREAM, stucco)
  box(out, 0, 8, W + 4.55, 6.5, 6, 0.05, GLASS, surfaceTag('glass'))
  for (let k = -3; k <= 3; k++) box(out, k * 2.2, 8, W + 4.6, 0.25, 6.4, 0.25, CREAM, stucco)
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
