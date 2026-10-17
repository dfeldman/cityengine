/**
 * The AQUATIC PARK BLEACHERS: the 1930s concrete grandstand along the cove between the Maritime Museum's east end and
 * the east speaker tower — the "long-unused giant speaker for events at the bleachers" (owner, 2026-10-17, with a
 * Street View from the foot of them: long level tiers, steel pipe rails down the stairs, the speaker tower at the top).
 * OSM has no outline for them, only a few step lines.
 *
 * A RAISED STRUCTURE (owner: "they are in fact a large raised structure, not built into the slope"): the foot on the
 * beach promenade, fourteen steep tiers up to a walkway along the top, and a solid concrete back wall down to the lawn
 * behind — our ground there is a gentle slope, so the stand stands proud of it, as the real one does of its own.
 * Placed from the owner's satellite view (2026-10-17: "note it's 2 sets"), scaled from the east speaker tower and the
 * museum's rounded east end (~0.076 m a pixel): two stands side by side on one foot line along the beach promenade,
 * running at a bearing of ~56° (the shore turns north-east here), ~18 m deep; the west one ~37 m long from the
 * museum's end, a gap, the east one ~43 m. Anchored at the middle of the foot line. Point model: x east, z north.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { strut, type Rgb } from '../../models.ts'
import { boxAlong } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const CONCRETE: Rgb = [0.5, 0.495, 0.48]
const TREAD: Rgb = [0.56, 0.555, 0.54]
const RAIL: Rgb = [0.6, 0.63, 0.66]

// along the foot line (east-north-east) and back from it (south-south-east, away from the water)
const U = { x: 0.834, z: 0.552 }
const B = { x: 0.552, z: -0.834 }
const HEADING = Math.atan2(-U.z, U.x)   // boxAlong: local x along U, local +z toward the water

export function aquaticBleachers(out: MeshBuilder, fit: Fit): void {
  const g = fit.groundAt ?? (() => 0)
  const T = 1.25, R = 0.45, N = 14, WALK = 3
  const metal = surfaceTag('metal')
  const conc = surfaceTag('concrete')
  const at = (s: number, d: number): { x: number; z: number } => ({ x: U.x * s + B.x * d, z: U.z * s + B.z * d })
  // a box spanning s0..s1 along the line and d0..d1 back from the foot, from y0 up to y1
  const slab = (s0: number, s1: number, d0: number, d1: number, y0: number, y1: number, c: Rgb, tag: number): void => {
    const m = at((s0 + s1) / 2, (d0 + d1) / 2)
    boxAlong(out, m.x, (y0 + y1) / 2, m.z, (s1 - s0) / 2, (y1 - y0) / 2, (d1 - d0) / 2, HEADING, c, tag)
  }
  const rail = (a: { x: number; z: number }, b: { x: number; z: number }, y0: number, y1: number): void => {
    for (const h of [0.5, 1.0]) strut(out, [a.x, y0 + h, a.z], [b.x, y1 + h, b.z], 0.05, 0.05, RAIL, metal, false)
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    for (let t = 0; t <= L; t += 2.5) {
      const f = t / L
      strut(out, [a.x + (b.x - a.x) * f, y0 + (y1 - y0) * f, a.z + (b.z - a.z) * f], [a.x + (b.x - a.x) * f, y0 + (y1 - y0) * f + 1.02, a.z + (b.z - a.z) * f], 0.05, 0.05, RAIL, metal, false)
    }
  }
  for (const [s0, s1] of [[-40.5, -3.8], [-2.3, 40.5]] as const) {
    const foot = at((s0 + s1) / 2, 0)
    const base = g(foot.x, foot.z)
    const top = base + N * R
    for (let i = 0; i < N; i++) slab(s0, s1, i * T, (i + 1) * T, base - 1, base + (i + 1) * R, i % 2 ? CONCRETE : TREAD, conc)
    // the walkway along the top and its solid back wall down to the lawn, with pilasters
    slab(s0, s1, N * T, N * T + WALK, base - 1, top, CONCRETE, conc)
    for (let s = s0 + 2; s <= s1 - 2; s += 6) slab(s - 0.35, s + 0.35, N * T + WALK, N * T + WALK + 0.35, base - 1, top - 0.1, [0.46, 0.455, 0.44], conc)
    // stairs down each end and the middle, two half-steps to a tier, pipe rails both sides
    for (const sc of [s0 + 2.5, (s0 + s1) / 2, s1 - 2.5]) {
      for (let i = 0; i < N; i++) for (const half of [0, 0.5]) {
        slab(sc - 0.9, sc + 0.9, (i + half) * T, (i + half + 0.5) * T, base + i * R, base + i * R + (half ? R / 2 : 0) + 0.22, [0.62, 0.615, 0.6], conc)
      }
      for (const side of [-1.05, 1.05]) rail(at(sc + side, 0), at(sc + side, N * T), base + 0.45, top + 0.45)
    }
    /*
     * The END WALLS (owner's Street View from the side, 2026-10-17): smooth white concrete cheeks rising from the foot to
     * the walkway, standing a little proud of the tiers, a pipe rail along their sloping top — not the tiers' stepped
     * edge. The east stand's east end has the roll-up door of the building underneath.
     */
    const WHITE: Rgb = [0.8, 0.79, 0.76]
    const D = N * T + WALK
    for (const [se, out_] of [[s0, -1], [s1, 1]] as const) {
      for (const off of [0, 0.3]) {
        const sx = se + out_ * off
        const P = (d: number, y: number): [number, number, number] => { const q = at(sx, d); return [q.x, y, q.z] }
        const n: [number, number, number] = [U.x * out_ * (off ? 1 : -1), 0, U.z * out_ * (off ? 1 : -1)]
        out.quad([P(0, base - 1), P(0, base + 0.6), P(N * T, top + 0.6), P(N * T, base - 1)], n, [[0, 0], [0, 1], [1, 1], [1, 0]], WHITE, conc)
        out.quad([P(N * T, base - 1), P(N * T, top + 0.6), P(D, top + 0.6), P(D, base - 1)], n, [[0, 0], [0, 1], [1, 1], [1, 0]], WHITE, conc)
      }
      // the coping along the sloping top, and its rail
      const c0 = at(se + out_ * 0.15, 0), c1 = at(se + out_ * 0.15, N * T), c2 = at(se + out_ * 0.15, D)
      strut(out, [c0.x, base + 0.6, c0.z], [c1.x, top + 0.6, c1.z], 0.34, 0.06, WHITE, conc, false)
      strut(out, [c1.x, top + 0.6, c1.z], [c2.x, top + 0.6, c2.z], 0.34, 0.06, WHITE, conc, false)
      rail(c0, c1, base + 0.6, top + 0.6)
      if (s1 > 0 && out_ > 0) {
        // the roll-up door and a service door, near the back of the wall
        const dq = at(se + 0.32, N * T - 2)
        boxAlong(out, dq.x, base + 1.3, dq.z, 0.04, 1.3, 1.5, HEADING, [0.6, 0.6, 0.6], metal)
        const sq = at(se + 0.32, N * T - 4.4)
        boxAlong(out, sq.x, base + 1.05, sq.z, 0.04, 1.05, 0.5, HEADING, [0.55, 0.56, 0.55], metal)
      }
    }
    // rails along both edges of the top walkway
    rail(at(s0, N * T), at(s1, N * T), top, top)
    rail(at(s0, N * T + WALK - 0.1), at(s1, N * T + WALK - 0.1), top, top)
  }
  // the beach promenade along the foot of both
  const pm = at(0, -2)
  const pb = g(pm.x, pm.z)
  boxAlong(out, pm.x, pb - 0.4, pm.z, 42, 0.45, 2, HEADING, [0.56, 0.555, 0.54], conc)
}
