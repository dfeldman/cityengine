/**
 * THE EMBARCADERO, from the owner's Street View (2026-10-06): the pieces of Embarcadero Plaza and the waterfront that
 * were generic or missing.
 *
 * bocceLanes — the two lawn-bowling lanes on the lawn at the plaza's east end (OSM way/196662091 and way/1083917974,
 * `sport=boules`; the owner: "a palm-tree-lined plaza with two lawn bowling lanes … and grass"). Two gravel lanes
 * side by side, each about 28 x 4 m inside a low concrete kerb, blue steel railings across their ends, and the big
 * granite balls on square plinths that stand about the lawn. Local x along the lanes.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const CONCRETE: Rgb = [0.72, 0.71, 0.68]
const GRAVEL: Rgb = [0.52, 0.5, 0.45]
const RAIL_BLUE: Rgb = [0.2, 0.38, 0.5]
const GRANITE: Rgb = [0.62, 0.61, 0.58]

/** a ball of radius r centred at (x, y, z) */
export function ball(out: MeshBuilder, x: number, y: number, z: number, r: number, c: Rgb, tag: number, rings = 16, segs = 26): void {
  const pt = (i: number, j: number): [number, number, number] => {
    const t = (i / rings) * Math.PI, a = (j / segs) * Math.PI * 2
    return [x + r * Math.sin(t) * Math.cos(a), y + r * Math.cos(t), z + r * Math.sin(t) * Math.sin(a)]
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) {
    const p = [pt(i, j), pt(i, j + 1), pt(i + 1, j + 1), pt(i + 1, j)]
    const m = p.reduce((s, q) => [s[0] + q[0] / 4, s[1] + q[1] / 4, s[2] + q[2] / 4], [0, 0, 0])
    out.quad([p[0], p[3], p[2], p[1]], [m[0] - x, m[1] - y, m[2] - z], UV, c, tag)
  }
}

/** a low steel railing panel across z from z0 to z1 at x: posts, a top and a bottom rail, a few bars */
function railing(out: MeshBuilder, x: number, z0: number, z1: number, h: number): void {
  const n = Math.max(2, Math.round((z1 - z0) / 1.4))
  for (let i = 0; i <= n; i++) box(out, x, h / 2, z0 + ((z1 - z0) * i) / n, 0.04, h / 2, 0.04, RAIL_BLUE, surfaceTag('metal'))
  const zm = (z0 + z1) / 2, hz = (z1 - z0) / 2
  box(out, x, h, zm, 0.03, 0.03, hz, RAIL_BLUE, surfaceTag('metal'))
  box(out, x, 0.25, zm, 0.025, 0.025, hz, RAIL_BLUE, surfaceTag('metal'))
  for (let i = 0; i < n; i++) {
    const za = z0 + ((z1 - z0) * i) / n, zb = z0 + ((z1 - z0) * (i + 1)) / n
    for (const f of [1 / 3, 2 / 3]) box(out, x, (h + 0.25) / 2, za + (zb - za) * f, 0.015, (h - 0.25) / 2, 0.015, RAIL_BLUE, surfaceTag('metal'))
  }
}

export function bocceLanes(out: MeshBuilder, fit: Fit): void {
  const v0 = out.positions.length
  const conc = surfaceTag('concrete')
  const L = 14, W = 2.1, K = 0.22
  for (const zc of [-2.65, 2.65]) {
    // the gravel, a little below the kerb's top
    out.quad([[-L, 0.08, zc - W], [L, 0.08, zc - W], [L, 0.08, zc + W], [-L, 0.08, zc + W]], [0, 1, 0], UV, GRAVEL, conc)
    // the kerb: the two long sides and the ends
    for (const s of [-1, 1]) box(out, 0, 0.13, zc + s * (W + K / 2), L + K, 0.13, K / 2, CONCRETE, conc)
    for (const s of [-1, 1]) box(out, s * (L + K / 2), 0.13, zc, K / 2, 0.13, W, CONCRETE, conc)
    // the railings across the ends, stood on the kerb, and the backboards behind the gravel
    for (const s of [-1, 1]) {
      railing(out, s * (L + K / 2), zc - W, zc + W, 1.0)
      box(out, s * (L - 0.04), 0.3, zc, 0.04, 0.2, W, [0.5, 0.42, 0.32], 0)
    }
  }
  // the granite balls on their plinths, on the lawn beyond the lanes' ends
  for (const [x, z] of [[-18.5, -4], [18.5, 4]] as [number, number][]) {
    box(out, x, 0.2, z, 0.85, 0.2, 0.85, [0.5, 0.49, 0.47], conc)
    ball(out, x, 0.4 + 0.75, z, 0.78, GRANITE, conc)
  }
  drapeOn(out, fit, v0)
}

/**
 * Lay what was drawn since vertex `v0` on the ground under each vertex: a landmark stands at the lowest ground in its
 * box, and flat work on a lawn (sunken here, and drawn higher than that lowest point) was buried under it.
 */
export function drapeOn(out: MeshBuilder, fit: Fit, v0: number): void {
  const g = fit.groundAt
  if (!g) return
  for (let i = v0; i < out.positions.length; i += 3) out.positions[i + 1] += g(out.positions[i], out.positions[i + 2])
}

export const EMBARCADERO_PLAZA: Record<string, (out: MeshBuilder, fit: Fit) => void> = { bocceLanes }
