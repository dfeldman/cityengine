/**
 * THE CATHEDRAL OF SAINT MARY OF THE ASSUMPTION (Pier Luigi Nervi and Pietro Belluschi, 1971; relation/7814696).
 *
 * Found in the appearance audit (2026-10-02): one of the city's best-known buildings was a 19 m "classical"
 * restyle — a stone box. The real one is a square of about 78 m, its roof four great saddle-shaped shells that
 * spring from the four corners and sweep up 58 m to meet in two straight ridges crossing at the top — the
 * ridges glazed, so the cross is drawn in light — the shells white travertine and concrete, each side a tall
 * glass gable between two shells, a slender gold cross standing on the crossing.
 *
 * Built as the gist (docs/SALESFORCE-PARK.md's method: recognisable, not surveyed): each quarter of the roof is
 * the bilinear patch between the crossing, two arm ends at ridge height and a corner on the plinth — which IS a
 * hyperbolic paraboloid — and each side's gable is the vertical triangle between two quarters, glazed.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const SHELL: Rgb = [0.86, 0.85, 0.81]
const GLASS: Rgb = [0.22, 0.27, 0.34]
const RIDGE: Rgb = [0.30, 0.36, 0.52]
const PLINTH: Rgb = [0.70, 0.68, 0.63]
const GOLD: Rgb = [0.78, 0.62, 0.28]
/** the ridges' height over the plinth, and the plinth's */
const H = 55
const BASE = 3

type V = [number, number, number]
const lerp = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export function stMarysCathedral(out: MeshBuilder, fit: Fit): void {
  const a = Math.max(20, Math.min(fit.hx, fit.hz, 40))
  const shell = surfaceTag('concrete')
  const glass = surfaceTag('glass')
  const stone = surfaceTag('ashlar')

  // the plinth the cathedral stands on
  box(out, 0, BASE / 2, 0, a + 3, BASE / 2, a + 3, PLINTH, stone)

  const top = BASE + H
  const C: V = [0, top, 0]
  const N = 24
  // the four quarters, each between two arms of the cross and the corner they span
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]] as const) {
    const X: V = [sx * a, top, 0]
    const Z: V = [0, top, sz * a]
    const K: V = [sx * a, BASE, sz * a]
    const at = (u: number, v: number): V => lerp(lerp(C, X, u), lerp(Z, K, u), v)
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const p00 = at(i / N, j / N), p10 = at((i + 1) / N, j / N), p11 = at((i + 1) / N, (j + 1) / N), p01 = at(i / N, (j + 1) / N)
        // the face normal, turned to point out and up (away from the cathedral's axis)
        const e1 = [p10[0] - p00[0], p10[1] - p00[1], p10[2] - p00[2]]
        const e2 = [p01[0] - p00[0], p01[1] - p00[1], p01[2] - p00[2]]
        let n: V = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
        // outward is towards this quarter's corner and up, the same test for every face of it
        if (n[0] * sx + n[2] * sz + n[1] * 0.6 < 0) n = [-n[0], -n[1], -n[2]]
        const L = Math.hypot(n[0], n[1], n[2]) || 1
        n = [n[0] / L, n[1] / L, n[2] / L]
        // the glazed ridges: the first strip of each quarter along both arms of the cross
        const c = j === 0 ? RIDGE : SHELL
        out.quad([p00, p10, p11, p01], n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, j === 0 ? glass : shell)
      }
    }
  }
  // each side's gable: the vertical triangle between two quarters, glazed, from the plinth to the arm's end
  for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const tx = -nz, tz = nx
    const apex: V = [nx * a, top, nz * a]
    const left: V = [nx * a + tx * a, BASE, nz * a + tz * a]
    const right: V = [nx * a - tx * a, BASE, nz * a - tz * a]
    // set a hand's breadth in, so the shells' edges stand proud of the glass
    const inset = (p: V): V => [p[0] - nx * 0.4, p[1], p[2] - nz * 0.4]
    out.quad([inset(left), inset(right), inset(apex), inset(apex)], [nx, 0, nz], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], GLASS, glass)
    // the mullions up the gable
    for (let k = 1; k < 8; k++) {
      const t = k / 8
      const lo = lerp(left, right, t)
      const h = (1 - Math.abs(t - 0.5) * 2) * H
      box(out, lo[0] - nx * 0.2, BASE + h / 2, lo[2] - nz * 0.2, Math.abs(tz) * 0.15 + Math.abs(nx) * 0.15, h / 2, Math.abs(tx) * 0.15 + Math.abs(nz) * 0.15, SHELL, shell)
    }
  }
  // the gold cross on the crossing
  box(out, 0, top + 8, 0, 0.35, 8, 0.35, GOLD, surfaceTag('metal'))
  box(out, 0, top + 11.5, 0, 2.6, 0.3, 0.3, GOLD, surfaceTag('metal'))
}
