import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { half, legW } from './eiffel-tower-full.ts'

const FIXED = 0

/**
 * The Eiffel Tower, for the skyline, from 1.3 km out (owner, 2026-10-31: "the low lod eiffel tower looks pretty bad. high lod is great"). It was stacked
 * boxes on a taper of its own, which stepped, and braces that broke up under a pixel. Now the silhouette of the full model (./eiffel-tower-full.ts), on the
 * same profile: four solid legs curving in to one shaft, the arch between them, the platforms, the top, in its paint. Turned square to the Champ de Mars.
 */
export function eiffelTower(out: MeshBuilder): void {
  const iron: Rgb = [0.34, 0.27, 0.205]
  const c = Math.SQRT1_2
  // (the manifest turns the full model 45°; the skyline's entry has no such thing)
  const T = (x: number, y: number, z: number): [number, number, number] => [(x + z) * c, y, (z - x) * c]
  /** an upright band between two pairs of corners, seen from both sides */
  const band = (a0: [number, number], b0: [number, number], y0: number, a1: [number, number], b1: [number, number], y1: number): void => {
    const q: [number, number, number][] = [T(a0[0], y0, a0[1]), T(b0[0], y0, b0[1]), T(b1[0], y1, b1[1]), T(a1[0], y1, a1[1])]
    const ux = q[1][0] - q[0][0], uz = q[1][2] - q[0][2], vx = q[3][0] - q[0][0], vy = q[3][1] - q[0][1], vz = q[3][2] - q[0][2]
    const nx = -uz * vy, ny = uz * vx - ux * vz, nz = ux * vy, l = Math.hypot(nx, ny, nz) || 1
    const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
    out.quad(q, [nx / l, ny / l, nz / l], uv, iron, FIXED)
    out.quad([q[1], q[0], q[3], q[2]], [-nx / l, -ny / l, -nz / l], uv, iron, FIXED)
  }
  const tube = (ring: (y: number) => [number, number][], ys: number[]): void => {
    for (let k = 1; k < ys.length; k++) {
      const r0 = ring(ys[k - 1]), r1 = ring(ys[k])
      for (let i = 0; i < 4; i++) band(r0[i], r0[(i + 1) % 4], ys[k - 1], r1[i], r1[(i + 1) % 4], ys[k])
    }
  }
  const legYs = [0, 15, 30, 44, 57.6, 72, 85, 100, 115.7]
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    tube((y) => {
      const o = half(y), i = Math.max(0, o - legW(y))
      return [[sx * o, sz * o], [sx * i, sz * o], [sx * i, sz * i], [sx * o, sz * i]]
    }, legYs)
  }
  tube((y) => { const o = half(y); return [[o, o], [-o, o], [-o, -o], [o, -o]] }, [115.7, 150, 180, 210, 240, 276])
  // the arch under the first floor, on each face
  const N = 10
  for (const f of [0, 1, 2, 3]) {
    const turn = (u: number, w: number): [number, number] => (f === 0 ? [u, w] : f === 1 ? [w, u] : f === 2 ? [u, -w] : [-w, u])
    for (let k = 0; k < N; k++) {
      const t0 = (k / N) * Math.PI, t1 = ((k + 1) / N) * Math.PI
      const y0 = 39 * Math.pow(Math.sin(t0), 0.6), y1 = 39 * Math.pow(Math.sin(t1), 0.6)
      const u0 = Math.cos(t0), u1 = Math.cos(t1)
      const at = (u: number, y: number): [number, number] => { const h = half(y) - legW(y) * 0.5; return turn(u * h, h + legW(y) * 0.5) }
      band(at(u0, y0), at(u1, y1), y0, at(u0, y0 + 3), at(u1, y1 + 3), Math.max(y0, y1) + 3)
    }
  }
  for (const [y, h, m] of [[57.6, 3.5, 1.04], [115.7, 2.5, 1.08], [276, 1.8, 1.5]] as const) box(out, 0, y, 0, half(y) * m * 0.9, h, half(y) * m * 0.9, iron, FIXED)
  prism(out, 0, 0, 276, 312, half(276) * 0.8, 8, iron, FIXED, 1.2)
  prism(out, 0, 0, 312, 330, 0.7, 6, iron, FIXED, 0.2)
}

/** Tour Montparnasse: a 210 m dark curtain-wall slab, gently convex. */
