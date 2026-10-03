/**
 * Sutro Tower (SF_PLAN.md §4): the three-legged TV mast on Mount Sutro, 298 m tall on a hill 254 m high, seen from
 * everywhere in the city — the thing San Franciscans steer by when the fog lets them. From photographs (Wikimedia
 * Commons: "Sutro Tower in 2012", "Sutro Tower from Grandview") and the published height:
 *
 * - **three lattice legs** in a triangle, wide at the foot, drawing in to a waist two thirds of the way up, then
 *   out again a little; banded in aviation red and white;
 * - **horizontal frames** tying the legs at intervals — a low one over the equipment building, one at the waist, the
 *   white truss above it — and at about 190 m **the crossarm**: the big triangular platform whose arms reach well
 *   past the legs, the tower's signature from any side;
 * - **three masts** above it, one on each leg, splaying outward, carrying the antennas, each hung with guys.
 *
 * Local frame: +y up from the foot of the legs, the centre of the triangle at the origin, one leg toward −z.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { beam } from './golden-gate.ts'

type V3 = [number, number, number]
const RED: Rgb = [0.6, 0.27, 0.22]           // aviation red, faded by fifty years of fog
const WHITE: Rgb = [0.86, 0.85, 0.82]
const GREY: Rgb = [0.55, 0.56, 0.57]

/**
 * `beam()`, chopped into consecutive shorter struts so no single quad's long edge exceeds `maxLen` — the
 * same defect as the bridges (BUGS.md #154, extended to Sutro Tower by the owner, 2026-09-24: *"you can get
 * pretty close to it, it's no longer a distant horizon object"*). A leg band or a crossarm chord was one
 * strut the full length of the member; up close that is exactly the "huge polygon" the bridges were fixed
 * for, just thin rather than wide. Interior caps are skipped — the segments butt against each other, so an
 * end cap between them is never seen.
 */
function beamChopped(out: MeshBuilder, a: V3, b: V3, w: number, h: number, c: Rgb, maxLen: number): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const n = Math.max(1, Math.ceil(len / maxLen))
  const at = (t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
  for (let i = 0; i < n; i++) beam(out, at(i / n), at((i + 1) / n), w, h, c, i === 0 || i === n - 1)
}

/** the three legs' centre line, radius from the axis at height y (the waist at 150 m) */
const legR = (y: number): number => {
  if (y <= 150) return 19 - (19 - 11) * (y / 150)
  return 11 + (y - 150) * 0.05
}
const CROSSARM = 200
const TOP_LEG = 212
const MAST_TOP = 298

export function sutroTower(out: MeshBuilder, _fit?: Fit): void {
  const legAngle = (k: number): number => (k / 3) * Math.PI * 2 + Math.PI      // one leg toward −z
  const at = (k: number, y: number, r = legR(y)): V3 => [Math.sin(legAngle(k)) * r, y, Math.cos(legAngle(k)) * r]
  // the legs, banded: seven bands to the crossarm, alternating red and white, each a square lattice column (a solid
  // core, and its four corner chords proud of it so the edge breaks up against the sky)
  const bands = 7
  // the legs and their corner chords are what a rider now walks right up to (owner, 2026-09-24: the box has
  // grown south and west and Sutro Tower "is no longer a distant horizon object") — chopped to 5 m so no
  // single quad on a leg spans most of a band, same fix as the bridges' deck slabs (BUGS.md #154).
  const LEG_MAX = 5
  for (let k = 0; k < 3; k++) {
    for (let b = 0; b < bands; b++) {
      const y0 = (TOP_LEG * b) / bands
      const y1 = (TOP_LEG * (b + 1)) / bands
      const c = b % 2 === 0 ? RED : WHITE
      const w = 3.4 - b * 0.12
      beamChopped(out, at(k, y0), at(k, y1), w, w, c, LEG_MAX)
      for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const o = (p: V3): V3 => [p[0] + dx * w * 0.55, p[1], p[2] + dz * w * 0.55]
        beamChopped(out, o(at(k, y0)), o(at(k, y1)), 0.35, 0.35, c, LEG_MAX)
      }
    }
  }
  // the horizontal frames between the legs
  const frame = (y: number, depth: number, c: Rgb, reach = 0): void => {
    for (let k = 0; k < 3; k++) {
      const a = at(k, y, legR(y) + reach)
      const b = at((k + 1) % 3, y, legR(y) + reach)
      // the chord between two legs is ~33 m in one strut otherwise — the same "long thin polygon" defect,
      // chopped the same way as the legs (BUGS.md #154)
      beamChopped(out, a, b, 1.6, depth, c, LEG_MAX)
      // its lattice: a zigzag of diagonals under the chord
      const n = 6
      for (let i = 0; i < n; i++) {
        const p = (t: number, dy: number): V3 => [a[0] + (b[0] - a[0]) * t, y + dy, a[2] + (b[2] - a[2]) * t]
        beam(out, p(i / n, 0), p((i + 1) / n, i % 2 ? depth * 2.2 : -depth * 2.2), 0.4, 0.4, c)
      }
    }
  }
  frame(22, 1.8, RED)                 // over the equipment building
  frame(78, 1.4, RED)
  frame(132, 1.4, RED)
  frame(158, 2.2, WHITE)              // the white truss at the waist
  // the crossarm: a deep triangular platform whose corners reach far past the legs, and its arms out to them
  frame(CROSSARM, 2.6, RED, 21)
  frame(CROSSARM - 5, 1.2, RED, 21)
  for (let k = 0; k < 3; k++) {
    beam(out, at(k, CROSSARM), at(k, CROSSARM, legR(CROSSARM) + 21), 2.4, 2.8, RED)
    beam(out, [0, CROSSARM, 0], at(k, CROSSARM), 1.6, 2, RED)
  }
  // the masts: from each leg's top up and out, tapering, banded, with the antenna bays near their tops
  for (let k = 0; k < 3; k++) {
    const segs = 8
    for (let i = 0; i < segs; i++) {
      const y0 = TOP_LEG + ((MAST_TOP - TOP_LEG) * i) / segs
      const y1 = TOP_LEG + ((MAST_TOP - TOP_LEG) * (i + 1)) / segs
      const r0 = legR(TOP_LEG) + (y0 - TOP_LEG) * 0.17
      const r1 = legR(TOP_LEG) + (y1 - TOP_LEG) * 0.17
      beam(out, at(k, y0, r0), at(k, y1, r1), 1.8 - i * 0.15, 1.8 - i * 0.15, i % 2 ? WHITE : RED)
    }
    // antenna panels on the upper mast
    for (const y of [248, 262, 276]) {
      const p = at(k, y, legR(TOP_LEG) + (y - TOP_LEG) * 0.17)
      box(out, p[0], y, p[2], 1.2, 3, 1.2, GREY, 0)
    }
    // the guys: from the mast head down to the crossarm's corners
    const head = at(k, MAST_TOP - 4, legR(TOP_LEG) + (MAST_TOP - 4 - TOP_LEG) * 0.17)
    for (const j of [k, (k + 1) % 3, (k + 2) % 3]) beam(out, head, at(j, CROSSARM + 2, legR(CROSSARM) + 21), 0.12, 0.12, GREY)
  }
  // the equipment building at the foot, and the three footings
  box(out, 0, 5, 0, 16, 5, 12, [0.78, 0.76, 0.72], 0)
  for (let k = 0; k < 3; k++) {
    const p = at(k, 0)
    box(out, p[0], 1.5, p[2], 4, 1.5, 4, [0.7, 0.7, 0.68], 0)
  }
}

/**
 * THE NEAR LEVEL (owner, 2026-10-02: "rework our sutro tower model into high and low levels of detail like the bridges
 * so it looks ok when you get close … right now the polys are huge so occlusion doesn't work"). The far level is the
 * skyline stand-in — drawn shrunk toward the eye, BEHIND everything (render group 0), which is right at 5 km and wrong
 * at the foot of Mount Sutro, where it showed through the hill and the trees. This is the same tower as a real
 * landmark on the ground (public/landmarks/san-francisco/bridges.json), which the stand-in hands over to within 1.3 km
 * (render/landmarks.ts), with the lattice a rider at its foot sees: X-bracing between the corner chords in every
 * panel of every leg, and the crossarm's walkway grating.
 */
export function sutroTowerNear(out: MeshBuilder, fit?: Fit): void {
  sutroTower(out, fit)
  const legAngle = (k: number): number => (k / 3) * Math.PI * 2 + Math.PI
  const at = (k: number, y: number, r = legR(y)): V3 => [Math.sin(legAngle(k)) * r, y, Math.cos(legAngle(k)) * r]
  const bands = 7
  for (let k = 0; k < 3; k++) {
    for (let b = 0; b < bands; b++) {
      const y0 = (TOP_LEG * b) / bands
      const y1 = (TOP_LEG * (b + 1)) / bands
      const c = b % 2 === 0 ? RED : WHITE
      const w = 3.4 - b * 0.12
      // panels every ~6 m up the band, an X on each of the column's four faces
      const n = Math.max(2, Math.round((y1 - y0) / 6))
      for (let i = 0; i < n; i++) {
        const ya = y0 + ((y1 - y0) * i) / n
        const yb = y0 + ((y1 - y0) * (i + 1)) / n
        const A = at(k, ya), B = at(k, yb)
        for (const [dx, dz, ex, ez] of [[1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1], [-1, 1, 1, 1]]) {
          const o = (p: V3, sx: number, sz: number): V3 => [p[0] + sx * w * 0.58, p[1], p[2] + sz * w * 0.58]
          beam(out, o(A, dx, dz), o(B, ex, ez), 0.16, 0.16, c, false)
          beam(out, o(A, ex, ez), o(B, dx, dz), 0.16, 0.16, c, false)
        }
      }
    }
  }
  // the crossarm's walkway: a grating between the arms
  for (let k = 0; k < 3; k++) {
    const a = at(k, CROSSARM + 1.5, legR(CROSSARM) + 21)
    const b = at((k + 1) % 3, CROSSARM + 1.5, legR(CROSSARM) + 21)
    beamChopped(out, a, b, 2.4, 0.12, GREY, 5)
  }
}
