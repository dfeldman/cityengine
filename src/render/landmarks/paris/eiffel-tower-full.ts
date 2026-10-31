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
 * In the top-25 audit of 2026-10-30 (it read tan, its first floor a solid box): the paint darkened, the lattice twice as fine, and the floors
 * made of what they are made of: a girder frieze of little arches round the first and second, open in the middle as the first is, the two
 * long pavilions on the first, the galleries' rails, the ties between the arches' ribs.
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
  const iron: Rgb = [0.34, 0.27, 0.205]
  const deck: Rgb = [0.27, 0.215, 0.165]
  type P = [number, number, number]
  // corners of a leg's square section at height y, for the leg standing on corner (sx, sz)
  const legCorners = (y: number, sx: number, sz: number): P[] => {
    const o = half(y)
    const i = Math.max(0, o - legW(y))
    return [[sx * o, y, sz * o], [sx * i, y, sz * o], [sx * i, y, sz * i], [sx * o, y, sz * i]]
  }
  const r0 = (y: number): number => Math.max(0.35, 0.9 - y / 400)
  const levels: number[] = []
  for (let y = 0; y < 115.7; y += 5.8) levels.push(y)
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
          beam(out, a[c], b[n], r0(levels[k]) * 0.26, iron)
          beam(out, a[n], b[c], r0(levels[k]) * 0.26, iron)
          beam(out, b[c], b[n], r0(levels[k]) * 0.34, iron)
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
  for (let y = 115.7; y < 276; y += 8) upper.push(y)
  upper.push(276)
  for (let k = 1; k < upper.length; k++) {
    const a = shaft(upper[k - 1])
    const b = shaft(upper[k])
    for (let c = 0; c < 4; c++) {
      const n = (c + 1) % 4
      beam(out, a[c], b[c], 0.5, iron)
      beam(out, a[c], b[n], 0.13, iron)
      beam(out, a[n], b[c], 0.13, iron)
      beam(out, b[c], b[n], 0.2, iron)
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
    const n = 14
    const rib = (lift: number, depth: number, i: number): P => {
      const u = -1 + (2 * i) / n
      // springing 16 m up at the legs, apex just under the first-floor band
      return face(u, 16 + lift + (40 - lift) * Math.sqrt(Math.max(0, 1 - u * u)), depth)
    }
    for (let i = 0; i < n; i++) {
      beam(out, rib(0, 1, i), rib(0, 1, i + 1), 0.6, iron)
      beam(out, rib(3, 4, i), rib(3, 4, i + 1), 0.6, iron)
      // the ties between the ribs, and a little lattice
      beam(out, rib(0, 1, i), rib(3, 4, i), 0.16, iron)
      beam(out, rib(0, 1, i), rib(3, 4, i + 1), 0.11, iron)
    }
  }
  // the first and second floors: a girder frieze round the outside, an open deck, the galleries' rail
  const floor = (y: number, w: number, hb: number, hole: number, bays: number): void => {
    const R = (u: number, yy: number, f: number): P => {
      const a = u * w
      return f === 0 ? [a, yy, -w] : f === 1 ? [w, yy, a] : f === 2 ? [-a, yy, w] : [-w, yy, -a]
    }
    for (let f = 0; f < 4; f++) {
      // the chords
      for (const [yy, r] of [[y, 0.45], [y + hb * 0.62, 0.3], [y + hb, 0.4]] as const) beam(out, R(-1, yy, f), R(1, yy, f), r, deck)
      for (let i = 0; i < bays; i++) {
        const u0 = -1 + (2 * i) / bays, u1 = -1 + (2 * (i + 1)) / bays, um = (u0 + u1) / 2
        // the post, and the little arch springing from it in the frieze
        beam(out, R(u0, y, f), R(u0, y + hb, f), 0.18, iron)
        beam(out, R(u0, y + hb * 0.25, f), R((u0 + um) / 2, y + hb * 0.55, f), 0.11, iron)
        beam(out, R((u0 + um) / 2, y + hb * 0.55, f), R((um + u1) / 2, y + hb * 0.55, f), 0.11, iron)
        beam(out, R((um + u1) / 2, y + hb * 0.55, f), R(u1, y + hb * 0.25, f), 0.11, iron)
        // the rail over it
        beam(out, R(u0, y + hb, f), R(u0, y + hb + 1.3, f), 0.05, iron)
      }
      beam(out, R(-1, y + hb + 1.3, f), R(1, y + hb + 1.3, f), 0.07, iron)
    }
    // the deck: four slabs round the opening
    const dy = y + hb * 0.62
    box(out, 0, dy, -(w + hole) / 2, w, 0.3, (w - hole) / 2, deck, FIXED)
    box(out, 0, dy, (w + hole) / 2, w, 0.3, (w - hole) / 2, deck, FIXED)
    box(out, -(w + hole) / 2, dy, 0, (w - hole) / 2, 0.3, hole, deck, FIXED)
    box(out, (w + hole) / 2, dy, 0, (w - hole) / 2, 0.3, hole, deck, FIXED)
  }
  const w1 = half(57.6) * 1.06
  floor(57.6, w1, 7, w1 * 0.55, 14)
  // the first floor's two long pavilions, glass and dark frames
  for (const s of [-1, 1]) {
    box(out, 0, 57.6 + 7 + 2.2, s * w1 * 0.76, w1 * 0.72, 2.2, 3.6, [0.19, 0.2, 0.21], FIXED)
    box(out, 0, 57.6 + 7 + 4.6, s * w1 * 0.76, w1 * 0.74, 0.25, 3.9, deck, FIXED)
  }
  const w2 = half(115.7) * 1.1
  floor(115.7, w2, 3.4, w2 * 0.55, 8)
  box(out, 0, 115.7 + 3.4 + 2, 0, w2 * 0.72, 2, w2 * 0.72, [0.2, 0.2, 0.21], FIXED)
  box(out, 0, 115.7 + 3.4 + 4.2, 0, w2 * 0.8, 0.25, w2 * 0.8, deck, FIXED)
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
