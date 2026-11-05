import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { half, legW } from './eiffel-tower-full.ts'

const FIXED = 0
/** lattice tuning: corner chord width, cross-brace width (m), and the face width below which a face is left solid */
const CHORD = 2.6, BRACE = 1.4, OPEN_MIN = 7

/**
 * The Eiffel Tower, for the skyline, from 1.3 km out (owner, 2026-10-31: "the low lod eiffel tower looks pretty bad. high lod is great"). It was stacked
 * boxes on a taper of its own, which stepped, and braces that broke up under a pixel. Now the silhouette of the full model (./eiffel-tower-full.ts), on the
 * same profile: four solid legs curving in to one shaft, the arch between them, the platforms, the top, in its paint. Turned square to the Champ de Mars.
 */
export function eiffelTower(out: MeshBuilder): void {
  const iron: Rgb = [0.25, 0.195, 0.15]
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
  const L = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  /** a lattice face: the two corner chords and a St Andrew's cross between them, open in the middle so the sky shows through */
  const open = (a0: [number, number], b0: [number, number], y0: number, a1: [number, number], b1: [number, number], y1: number): void => {
    const w0 = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]), w1 = Math.hypot(b1[0] - a1[0], b1[1] - a1[1])
    if (Math.min(w0, w1) < OPEN_MIN) { band(a0, b0, y0, a1, b1, y1); return }
    const c0 = Math.min(CHORD / w0, 0.3), c1 = Math.min(CHORD / w1, 0.3), d0 = Math.min(BRACE / w0, 0.2), d1 = Math.min(BRACE / w1, 0.2)
    band(a0, L(a0, b0, c0), y0, a1, L(a1, b1, c1), y1)
    band(L(a0, b0, 1 - c0), b0, y0, L(a1, b1, 1 - c1), b1, y1)
    band(L(a0, b0, c0), L(a0, b0, c0 + d0), y0, L(a1, b1, 1 - c1 - d1), L(a1, b1, 1 - c1), y1)
    band(L(a0, b0, 1 - c0 - d0), L(a0, b0, 1 - c0), y0, L(a1, b1, c1), L(a1, b1, c1 + d1), y1)
  }
  const tube = (ring: (y: number) => [number, number][], ys: number[]): void => {
    for (let k = 1; k < ys.length; k++) {
      const r0 = ring(ys[k - 1]), r1 = ring(ys[k])
      for (let i = 0; i < 4; i++) open(r0[i], r0[(i + 1) % 4], ys[k - 1], r1[i], r1[(i + 1) % 4], ys[k])
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
