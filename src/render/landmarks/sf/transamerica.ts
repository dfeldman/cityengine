/**
 * The Transamerica Pyramid (William Pereira, 1972; SF_PLAN.md §4), from photographs (Wikimedia Commons: "SF
 * Transamerica full CA", "Transamerica Pyramid base") and its figures — 260 m to the spire, 48 floors on a base about
 * 53 m square:
 *
 * - a four-sided **taper**, banded floor by floor: white quartz-aggregate panels over a dark strip of windows;
 * - two **wings** on opposite faces — the lift shafts on one side, the stairs on the other — that rise straight up
 *   from about two-fifths of the height while the body narrows away from them, stopping flat at about the 48th
 *   floor: the "ears" that make it read as the Pyramid and not a spire;
 * - the tall smooth **spire** above, white, lit at its tip;
 * - at the foot an **arcade of inclined legs**, the triangulated truss the building stands on.
 *
 * Local frame: centred on the footprint, the wings on the ±x faces (east and west), front −z; fitted to OSM's way.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { beam } from './golden-gate.ts'

type V3 = [number, number, number]
const WHITE: Rgb = [0.9, 0.89, 0.86]
const WINDOW: Rgb = [0.22, 0.25, 0.3]
const SHADOW: Rgb = [0.72, 0.71, 0.69]

/** A square frustum's four trapezoid faces between half-widths a (at y0) and b (at y1). */
function frustum(out: MeshBuilder, y0: number, y1: number, a: number, b: number, c: Rgb, faces = [0, 1, 2, 3]): void {
  const slope = (a - b) / Math.max(0.01, y1 - y0)
  for (const f of faces) {
    const ang = (f * Math.PI) / 2
    const cs = Math.cos(ang)
    const sn = Math.sin(ang)
    // the face toward +z rotated by ang about y: corners (−w, y, w) … (w, y, w)
    const P = (x: number, y: number, z: number): V3 => [x * cs + z * sn, y, -x * sn + z * cs]
    const n = P(0, slope, 1)
    out.quad([P(-a, y0, a), P(a, y0, a), P(b, y1, b), P(-b, y1, b)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
  }
}

export function transamericaPyramid(out: MeshBuilder, fit: Fit): void {
  const base = Math.min(28, Math.max(20, Math.min(fit.hx, fit.hz)))        // half-width at the foot, ~26.5
  const roofY = 212
  const topHalf = 6.5                                                    // half-width at the 48th floor
  const halfAt = (y: number): number => base + (topHalf - base) * (y / roofY)
  const floors = 48
  // the arcade at the foot: the inclined legs, with the building's first floor on them
  const legTop = 16
  for (let f = 0; f < 4; f++) {
    const ang = (f * Math.PI) / 2
    const P = (x: number, y: number, z: number): V3 => [x * Math.cos(ang) + z * Math.sin(ang), y, -x * Math.sin(ang) + z * Math.cos(ang)]
    const n = 5
    for (let i = 0; i <= n; i++) {
      const x = -base + (2 * base * i) / n
      const w = halfAt(legTop)
      // a leg up from the ground to the ring above, leaning in, and its neighbour's partner making the triangle
      if (i < n) beam(out, P(x, 0, base), P(-w + (2 * w * (i + 0.5)) / n, legTop, w), 1.2, 1.2, WHITE)
      if (i > 0) beam(out, P(x, 0, base), P(-w + (2 * w * (i - 0.5)) / n, legTop, w), 1.2, 1.2, WHITE)
    }
  }
  // the recessed lobby behind the legs
  box(out, 0, 6, 0, base - 5, 6, base - 5, [0.3, 0.33, 0.36], 0)
  // the body, storey by storey: a white spandrel band and a darker window band a little recessed
  for (let i = 0; i < floors; i++) {
    const y0 = legTop + ((roofY - legTop) * i) / floors
    const y1 = legTop + ((roofY - legTop) * (i + 1)) / floors
    const ym = y0 + (y1 - y0) * 0.66          // two thirds white panel, a third window
    frustum(out, y0, ym, halfAt(y0), halfAt(ym), WHITE)
    frustum(out, ym, y1, halfAt(ym) - 0.35, halfAt(y1) - 0.35, WINDOW)
  }
  // the wings: rising straight from where the body has narrowed to them, on the ±x faces, to the roof
  const wingHalf = 12.8
  const wingDepth = 7.5
  const wingStart = roofY * ((base - wingHalf) / (base - topHalf))
  const wingTop = roofY + 8
  for (const s of [-1, 1]) {
    // the wing's outer face stays plumb at |x| = wingHalf; it is as wide as the face there, narrowing along z
    const segs = 6
    for (let k = 0; k < segs; k++) {
      const y0 = wingStart + ((wingTop - wingStart) * k) / segs
      const y1 = wingStart + ((wingTop - wingStart) * (k + 1)) / segs
      const inner = Math.max(topHalf, halfAt(y0))
      const zHalf = Math.max(4, wingDepth - k * 0.4)
      box(out, s * (inner + wingHalf) / 2, (y0 + y1) / 2, 0, (wingHalf - inner) / 2 + 0.3, (y1 - y0) / 2, zHalf, WHITE, 0)
      // a slot of windows down the wing's outer face
      box(out, s * (wingHalf + 0.05), (y0 + y1) / 2, 0, 0.05, (y1 - y0) / 2 - 0.4, 1.2, SHADOW, 0)
    }
  }
  // the roof and the spire: four faces tapering to the tip, and its beacon
  frustum(out, roofY, roofY + 6, topHalf, topHalf - 0.4, WHITE)
  frustum(out, roofY + 6, 258, topHalf - 0.4, 0.25, WHITE)
  box(out, 0, 259, 0, 0.3, 1, 0.3, [1, 0.35, 0.25], 0.5)
}
