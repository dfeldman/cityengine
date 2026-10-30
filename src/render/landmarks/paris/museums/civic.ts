/**
 * What the civic buildings of this folder share (the Sorbonne, the Hôtel-Dieu, a mairie): the dressing of a real plan.
 * `extrude` in the palace kit (../palaces/common.ts) raises an OSM outline and its courts to a slate mansard with its
 * rows of windows; these go over its walls where a rider looks: rusticated bands, string courses, a row of arched
 * openings, a run of pilasters, all following the ring's edges rather than the box. Not a builder — nothing is registered.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { edgeAt } from '../../parts.ts'
import type { Rgb } from '../../kit.ts'

const FIXED = 0
type P2 = { x: number; z: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const area = (r: P2[]): number => r.reduce((a, p, i) => { const q = r[(i + 1) % r.length]; return a + p.x * q.z - q.x * p.z }, 0)

/** The edges of an outline, wound so each faces out, longer than `min`. */
function edges(ring: P2[], min: number): ReturnType<typeof edgeAt>[] {
  const r = area(ring) > 0 ? ring : [...ring].reverse()
  const out: ReturnType<typeof edgeAt>[] = []
  for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    if (e.L >= min) out.push(e)
  }
  return out
}

/** Bands round an outline, `h` high and `d` proud, at each height in `ys`: string courses, a plinth, rustication's joints. */
export function bands(out: MeshBuilder, ring: P2[], ys: number[], h: number, d: number, c: Rgb, min = 1.5): void {
  for (const e of edges(ring, min)) {
    const P = (u: number, y: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * d, y, e.a.z + e.tz * u + e.nz * d]
    for (const y of ys) {
      out.quad([P(0, y), P(e.L, y), P(e.L, y + h), P(0, y + h)], [e.nx, 0, e.nz], UV, c, FIXED)
      out.quad([P(0, y + h), P(e.L, y + h), [e.b.x, y + h, e.b.z], [e.a.x, y + h, e.a.z]], [0, 1, 0], UV, c, FIXED)
    }
  }
}

/** Rustication's joints: a thin dark line every `step` metres from y0 to y1, on every edge. */
export function rustic(out: MeshBuilder, ring: P2[], y0: number, y1: number, step: number, c: Rgb, min = 1.5): void {
  const ys: number[] = []
  for (let y = y0 + step; y < y1 - 0.1; y += step) ys.push(y)
  bands(out, ring, ys, 0.09, 0.04, c, min)
}

/** Round-headed openings along every edge of an outline: `bay` apart, w wide, sill at y0, crown at y0 + h. */
export function archesRound(out: MeshBuilder, ring: P2[], y0: number, h: number, w: number, bay: number, c: Rgb, d = 0.1, min = 4): void {
  const r = w / 2
  const spring = y0 + Math.max(0, h - r)
  for (const e of edges(ring, min)) {
    const n = Math.max(1, Math.round((e.L - 1.2) / bay))
    const step = (e.L - 1.2) / n
    const P = (u: number, y: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * d, y, e.a.z + e.tz * u + e.nz * d]
    const N: [number, number, number] = [e.nx, 0, e.nz]
    for (let j = 0; j < n; j++) {
      const u = 0.6 + step * (j + 0.5)
      out.quad([P(u - r, y0), P(u + r, y0), P(u + r, spring), P(u - r, spring)], N, UV, c, FIXED)
      for (let k = 0; k < 5; k++) {
        const a0 = (k / 5) * Math.PI
        const a1 = ((k + 1) / 5) * Math.PI
        out.quad([P(u, spring), P(u + Math.cos(a0) * r, spring + Math.sin(a0) * r), P(u + Math.cos(a1) * r, spring + Math.sin(a1) * r), P(u, spring)], N, UV, c, FIXED)
      }
    }
  }
}

/** A chimney stack on a roof: brick or stone, its pots. */
export function stack(out: MeshBuilder, x: number, z: number, y0: number, y1: number, hw: number, hd: number, c: Rgb, pot: Rgb): void {
  out.quad([[x - hw, y0, z - hd], [x + hw, y0, z - hd], [x + hw, y1, z - hd], [x - hw, y1, z - hd]], [0, 0, -1], UV, c, FIXED)
  out.quad([[x + hw, y0, z + hd], [x - hw, y0, z + hd], [x - hw, y1, z + hd], [x + hw, y1, z + hd]], [0, 0, 1], UV, c, FIXED)
  out.quad([[x - hw, y0, z + hd], [x - hw, y0, z - hd], [x - hw, y1, z - hd], [x - hw, y1, z + hd]], [-1, 0, 0], UV, c, FIXED)
  out.quad([[x + hw, y0, z - hd], [x + hw, y0, z + hd], [x + hw, y1, z + hd], [x + hw, y1, z - hd]], [1, 0, 0], UV, c, FIXED)
  out.quad([[x - hw, y1, z - hd], [x + hw, y1, z - hd], [x + hw, y1, z + hd], [x - hw, y1, z + hd]], [0, 1, 0], UV, c, FIXED)
  for (const s of [-0.5, 0.5]) prism(out, x + s * hw, z, y1, y1 + 0.5, 0.14, 6, pot, FIXED, 0.11)
}
