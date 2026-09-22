import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam } from '../kit.ts'

const FIXED = 0

/**
 * The Eiffel Tower up close (PARIS_EXPAND §5 A, the first icon): central Paris puts the rider under it, so
 * the skyline silhouette will not do. The gist, from the tower's own dimensions:
 *
 * - four lattice legs, each a braced square column about 25 m across at its foot, standing on the corners of
 *   a 125 m square and curving in along the tower's profile until they meet above the second floor;
 * - the decorative arches between the legs under the first floor;
 * - the first floor at 57.6 m (a deep band), the second at 115.7 m, the third at 276 m, the top and its
 *   antenna to 330 m;
 * - "Eiffel Tower brown", the bronze-brown it is painted.
 *
 * Built in the tower's own frame, faces on ±x and ±z; the manifest turns it square to the Champ de Mars.
 */

/** The outer half-width of the tower at height y, from its profile. */
const PROFILE: [number, number][] = [[0, 62.5], [30, 48], [57.6, 36], [85, 27], [115.7, 20], [180, 13], [240, 10], [276, 8.5], [300, 5]]
function half(y: number): number {
  for (let i = 1; i < PROFILE.length; i++) {
    const [y0, w0] = PROFILE[i - 1]
    const [y1, w1] = PROFILE[i]
    if (y <= y1) return w0 + ((w1 - w0) * (y - y0)) / (y1 - y0)
  }
  return PROFILE[PROFILE.length - 1][1]
}
/** a leg's width at y: 25 m at the foot, narrowing; above the second floor the four are one shaft */
const legW = (y: number): number => (y < 115.7 ? 25 - (y / 115.7) * 13 : 12 * (1 - (y - 115.7) / 200))

export function eiffelTowerFull(out: MeshBuilder): void {
  const iron: Rgb = [0.43, 0.35, 0.27]
  const deck: Rgb = [0.36, 0.29, 0.22]
  type P = [number, number, number]
  // corners of a leg's square section at height y, for the leg standing on corner (sx, sz)
  const legCorners = (y: number, sx: number, sz: number): P[] => {
    const o = half(y)
    const i = Math.max(0, o - legW(y))
    return [[sx * o, y, sz * o], [sx * i, y, sz * o], [sx * i, y, sz * i], [sx * o, y, sz * i]]
  }
  const r0 = (y: number): number => Math.max(0.35, 0.9 - y / 400)
  const levels: number[] = []
  for (let y = 0; y < 115.7; y += 11.6) levels.push(y)
  levels.push(115.7)
  // the four legs, each braced on its four faces between levels
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (let k = 1; k < levels.length; k++) {
        const a = legCorners(levels[k - 1], sx, sz)
        const b = legCorners(levels[k], sx, sz)
        for (let c = 0; c < 4; c++) beam(out, a[c], b[c], r0(levels[k]), iron)
        for (let c = 0; c < 4; c++) {
          const n = (c + 1) % 4
          // an X across each face of the leg, and a strut round it at the level
          beam(out, a[c], b[n], r0(levels[k]) * 0.4, iron)
          beam(out, a[n], b[c], r0(levels[k]) * 0.4, iron)
          beam(out, b[c], b[n], r0(levels[k]) * 0.5, iron)
        }
      }
    }
  }
  // above the second floor: one shaft, its four corners braced on each face
  const shaft = (y: number): P[] => {
    const o = half(y)
    return [[o, y, o], [-o, y, o], [-o, y, -o], [o, y, -o]]
  }
  const upper: number[] = []
  for (let y = 115.7; y < 276; y += 16) upper.push(y)
  upper.push(276)
  for (let k = 1; k < upper.length; k++) {
    const a = shaft(upper[k - 1])
    const b = shaft(upper[k])
    for (let c = 0; c < 4; c++) {
      const n = (c + 1) % 4
      beam(out, a[c], b[c], 0.55, iron)
      beam(out, a[c], b[n], 0.2, iron)
      beam(out, a[n], b[c], 0.2, iron)
      beam(out, b[c], b[n], 0.25, iron)
    }
  }
  // the four great arches under the first floor, one on each face between two legs: two ribs each
  for (let f = 0; f < 4; f++) {
    const face = (u: number, y: number, dz: number): P => {
      // u across the face, from −1 to 1; the face lies at ±x or ±z
      const o = half(y) - dz
      const across = u * Math.max(0, half(y) - legW(y))
      return f === 0 ? [across, y, -o] : f === 1 ? [o, y, across] : f === 2 ? [-across, y, o] : [-o, y, -across]
    }
    for (const [lift, depth] of [[0, 1], [3, 4]] as const) {
      const n = 14
      let prev: P | null = null
      for (let i = 0; i <= n; i++) {
        const u = -1 + (2 * i) / n
        // springing 16 m up at the legs, apex just under the first-floor band
        const y = 16 + lift + (40 - lift) * Math.sqrt(Math.max(0, 1 - u * u))
        const p = face(u, y, depth)
        if (prev) beam(out, prev, p, 0.7, iron)
        prev = p
      }
    }
  }
  // the floors: the first a deep band with its parapet, the second, the third's small room
  const w1 = half(57.6) * 1.06
  box(out, 0, 57.6 + 2.5, 0, w1, 2.5, w1, deck, FIXED)
  box(out, 0, 57.6 + 6.2, 0, w1 * 0.98, 1.2, w1 * 0.98, iron, FIXED)
  const w2 = half(115.7) * 1.1
  box(out, 0, 115.7 + 1.6, 0, w2, 1.6, w2, deck, FIXED)
  box(out, 0, 115.7 + 4, 0, w2 * 0.8, 0.8, w2 * 0.8, iron, FIXED)
  const w3 = half(276) * 1.15
  box(out, 0, 276 + 2, 0, w3, 2, w3, deck, FIXED)
  prism(out, 0, 0, 280, 292, w3 * 0.8, 8, iron, FIXED, w3 * 0.55)
  prism(out, 0, 0, 292, 300, w3 * 0.55, 8, iron, FIXED, 1.4)
  prism(out, 0, 0, 300, 330, 0.9, 6, [0.78, 0.76, 0.72], FIXED, 0.25)                 // the antenna
  // the pillars' stone feet
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const c = half(0) - 12.5
      box(out, sx * c, 1.5, sz * c, 13.5, 1.5, 13.5, [0.62, 0.58, 0.52], FIXED)
    }
  }
}
