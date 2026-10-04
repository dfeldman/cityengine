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
/**
 * The PODIUM (owner, 2026-10-03, with a Street View from Gough: "the real building has a large concrete podium and is
 * mostly concrete on top"): about 13 m of travertine piers and glass under a deep flat overhang, much wider than the
 * cupola, which rises from its roof to 58 m. Until then the shells sprang from a 3 m plinth at the full width.
 */
const BASE = 13.5
/** the ridges' height over the podium's roof */
const H = 44.5
const TRAVERTINE: Rgb = [0.8, 0.77, 0.7]
const DARK_GLASS: Rgb = [0.12, 0.14, 0.17]

type V = [number, number, number]
const lerp = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export function stMarysCathedral(out: MeshBuilder, fit: Fit): void {
  const P = Math.max(24, Math.min(fit.hx, fit.hz, 48))
  // the cupola, set well in from the podium's edge
  const a = P * 0.6
  const shell = surfaceTag('concrete')
  const glass = surfaceTag('glass')
  const stone = surfaceTag('ashlar')

  // the podium: a glass core, travertine piers across each face leaving glass bays at the corners, the overhang on top
  box(out, 0, 0.4, 0, P + 2, 0.4, P + 2, PLINTH, stone)
  box(out, 0, BASE / 2, 0, P - 1.2, BASE / 2, P - 1.2, DARK_GLASS, glass)
  for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const tx = -nz, tz = nx
    const piers = 6
    for (let k = 0; k < piers; k++) {
      const u = -P * 0.62 + (k + 0.5) * ((P * 1.24) / piers)
      const cx = nx * (P - 0.6) + tx * u, cz = nz * (P - 0.6) + tz * u
      const half = (P * 1.24) / piers / 2 - 0.35
      box(out, cx, BASE / 2, cz, Math.abs(tx) * half + Math.abs(nx) * 0.7, BASE / 2 - 0.6, Math.abs(tz) * half + Math.abs(nz) * 0.7, TRAVERTINE, stone)
    }
  }
  box(out, 0, BASE - 0.5, 0, P + 3.5, 0.6, P + 3.5, TRAVERTINE, stone)

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
  // each side's gable: the vertical triangle between two quarters — travertine like the shells, a dark slot of glass
  // up its middle to the ridge, the cross of light that the four make
  for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const tx = -nz, tz = nx
    const apex: V = [nx * a, top, nz * a]
    const left: V = [nx * a + tx * a, BASE, nz * a + tz * a]
    const right: V = [nx * a - tx * a, BASE, nz * a - tz * a]
    // set a hand's breadth in, so the shells' edges stand proud of the glass
    const inset = (p: V): V => [p[0] - nx * 0.4, p[1], p[2] - nz * 0.4]
    out.quad([inset(left), inset(right), inset(apex), inset(apex)], [nx, 0, nz], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], SHELL, shell)
    // the slot: a narrow dark band from the podium's roof to the ridge, a little proud of the gable
    const w = 1.6
    const slot = (u: number, y: number): V => [nx * (a - 0.25) + tx * u, y, nz * (a - 0.25) + tz * u]
    out.quad([slot(-w, BASE + 0.6), slot(w, BASE + 0.6), slot(w, top), slot(-w, top)], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], GLASS, glass)
  }
  // the gold cross on the crossing
  box(out, 0, top + 8, 0, 0.35, 8, 0.35, GOLD, surfaceTag('metal'))
  box(out, 0, top + 11.5, 0, 2.6, 0.3, 0.3, GOLD, surfaceTag('metal'))
}
