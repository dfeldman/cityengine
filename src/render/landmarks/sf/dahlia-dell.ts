/**
 * THE DAHLIA DELL (Golden Gate Park, east of the Conservatory of Flowers; OSM node/3077094260, "Dahlia Dell") — the owner,
 * 2026-10-27: "and the dahlia garden… we'll need a plant model for dahlias". The dahlias are the plant library's
 * `dahlia` (assetkit plantgen, `library-dahlia.json`: sixteen entries — decorative, cactus, pompon and bicolour heads,
 * crimson to white, 0.9–1.6 m; built 2026-10-27, needs `assets:upload` to reach the bucket, `?assets=local` until then).
 *
 * OSM maps the garden only as a point among its paths, and no picture of the beds was to hand, so the LAYOUT IS A
 * PLACEHOLDER: a round show garden on the point — four ring beds of turned soil, cross walks at the quarters, two
 * staggered rows of dahlias in each (the library entry picked per plant, so the colours mix), every bed kept 3 m off
 * the footways round it. Local x east, z north (rotateDeg 0) about the point.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'

type V3 = [number, number, number]
const SOIL: Rgb = [0.29, 0.21, 0.15]
/** the point, city metres */
const AT: [number, number] = [-4035.6, -2266.2]
/** the footways round the dell (OSM way/1093949905, 123056534, 644902844), city metres: no bed within 3 m of them */
const PATHS: [number, number][][] = [
  [[-4051.4, -2241.3], [-4059.5, -2262.2], [-4071.3, -2275.2], [-4074.7, -2277.3]],
  [[-4074.7, -2277.3], [-4065.2, -2285.7], [-4053.6, -2296.4], [-4038.8, -2305.1], [-4026.3, -2317.3]],
  [[-4026.3, -2317.3], [-4017.0, -2278.1], [-4011.3, -2260.1], [-4007.9, -2249.8], [-4003.7, -2236.4]],
]
/** the ring beds' middle radii, their width, the walks' width, the planting pitch along a row */
const RINGS = [4.5, 8, 11.5, 15]
const BED = 1.7
const WALK = 2.4
const PITCH = 0.85

export function dahliaDell(out: MeshBuilder, fit: Fit): void {
  const ground = (x: number, z: number): number => (fit.groundAt ? fit.groundAt(x, z) : 0.5)
  const clear = (x: number, z: number): boolean => PATHS.every((p) => distToLine(x + AT[0], z + AT[1], p) > 3)
  let k = 0
  for (const r of RINGS) {
    const n = Math.max(16, Math.round((2 * Math.PI * r) / 1.2))
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2
      // the cross walks at the quarters: no bed within half a walk's width of the axes
      const along = (a: number): number => Math.min(...[0, 1, 2, 3].map((q) => Math.abs(Math.sin(a - (q * Math.PI) / 2)) * r))
      if (along(am) < WALK / 2 + 0.4) continue
      const P = (a: number, rr: number): V3 => { const x = Math.sin(a) * rr, z = Math.cos(a) * rr; return [x, ground(x, z) + 0.04, z] }
      const mx = Math.sin(am) * r, mz = Math.cos(am) * r
      if (!clear(mx, mz)) continue
      out.quad([P(a0, r - BED / 2), P(a1, r - BED / 2), P(a1, r + BED / 2), P(a0, r + BED / 2)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], SOIL, 0)
    }
    // the dahlias: two staggered rows along the bed
    for (const [dr, off] of [[-0.42, 0], [0.42, 0.5]] as const) {
      const rr = r + dr
      const m = Math.round((2 * Math.PI * rr) / PITCH)
      for (let j = 0; j < m; j++) {
        const a = ((j + off) / m) * Math.PI * 2
        const x = Math.sin(a) * rr, z = Math.cos(a) * rr
        const nearWalk = Math.min(...[0, 1, 2, 3].map((q) => Math.abs(Math.sin(a - (q * Math.PI) / 2)) * rr))
        if (nearWalk < WALK / 2 + 0.6 || !clear(x, z)) continue
        const h = 0.95 + 0.55 * frac(Math.sin(++k * 12.9898) * 43758.5453)
        out.plants.push({ x, z, species: 'dahlia', h, spin: k * 2.399 })
      }
    }
  }
}

const frac = (v: number): number => v - Math.floor(v)
function distToLine(x: number, z: number, line: [number, number][]): number {
  let best = Infinity
  for (let i = 0; i + 1 < line.length; i++) {
    const [ax, az] = line[i], [bx, bz] = line[i + 1]
    const L2 = (bx - ax) ** 2 + (bz - az) ** 2
    const t = L2 ? Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / L2)) : 0
    best = Math.min(best, Math.hypot(x - ax - t * (bx - ax), z - az - t * (bz - az)))
  }
  return best
}
