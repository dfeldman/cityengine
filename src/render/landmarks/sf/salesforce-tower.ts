/**
 * Salesforce Tower (Pelli Clarke Pelli, 2018; SF_PLAN.md §4), from photographs (Wikimedia Commons: "Salesforce Tower
 * SF 2017") and its figures — 326 m, the tallest thing in the city, on a plan about 51 m square:
 *
 * - a **rounded-square plan** — a square with its corners softened — that tapers gently as it rises and then closes
 *   over at the top in a curve, the bullet profile seen from every hill;
 * - **glass** in a fine grid: pale vertical mullion fins and a white sunshade band at every floor, so the tower reads
 *   as pale silver-blue, not as a dark slab;
 * - the **crown**: the top sixty metres are an open lattice screen continuing the curve over the last floor, pale,
 *   where the LED artwork plays at night.
 *
 * Local frame: centred on the footprint, +y up; fitted to OSM's way.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'

type V3 = [number, number, number]
const GLASS: Rgb = [0.5, 0.62, 0.74]
const FIN: Rgb = [0.86, 0.88, 0.9]
const CROWN: Rgb = [0.74, 0.8, 0.86]         // the screen reads as a paler continuation of the glass
const SLOT: Rgb = [0.62, 0.68, 0.76]

const TOP = 326
const GLASS_TOP = 268

/** The half-width at height y: a slight straight taper, then the curve closing over the top. */
function half(y: number, base: number): number {
  const straight = base - (base * 0.1 * Math.min(y, 190)) / 190
  if (y <= 190) return straight
  // from 190 m the sides begin to close, slowly at first: the curve is most of the crown's height
  const t = Math.min(1, (y - 190) / (TOP - 190))
  return straight * Math.pow(Math.max(0, 1 - Math.pow(t, 2.4) * 0.92), 0.5)
}

/** A point on the rounded-square plan: angle a, half-width w (a superellipse, n = 4 at the corners). */
function plan(a: number, w: number): [number, number] {
  const c = Math.cos(a)
  const s = Math.sin(a)
  const n = 4
  const k = w / Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), 1 / n)
  return [c * k, s * k]
}

export function salesforceTower(out: MeshBuilder, fit: Fit): void {
  const base = Math.min(27, Math.max(20, Math.min(fit.hx, fit.hz)))
  const sides = 48
  const floor = 4.35
  const ring = (y: number): V3[] => {
    const w = half(y, base)
    const pts: V3[] = []
    for (let i = 0; i < sides; i++) { const [x, z] = plan((i / sides) * Math.PI * 2, w); pts.push([x, y, z]) }
    return pts
  }
  const band = (y0: number, y1: number, c: Rgb, every = 1, alt?: Rgb): void => {
    const a = ring(y0)
    const b = ring(y1)
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides
      const mx = (a[i][0] + a[j][0]) / 2
      const mz = (a[i][2] + a[j][2]) / 2
      const l = Math.hypot(mx, mz) || 1
      const col = alt && i % every === 0 ? alt : c
      out.quad([a[i], a[j], b[j], b[i]], [mx / l, 0.1, mz / l], [[0, 0], [1, 0], [1, 1], [0, 1]], col, 0)
    }
  }
  // the lobby, taller and darker
  band(0, 12, [0.3, 0.36, 0.42])
  // the curtain wall: a glass storey and a white sunshade band at every floor, mullions every other facet
  for (let y = 12; y < GLASS_TOP; y += floor) {
    band(y, y + floor - 0.7, GLASS, 2, [0.62, 0.72, 0.8])
    band(y + floor - 0.7, y + floor, FIN)
  }
  // the crown: the open lattice screen, pale, slotted, closing the curve
  for (let y = GLASS_TOP; y < TOP - 2; y += 3) {
    band(y, Math.min(TOP - 2, y + 3), CROWN, 3, SLOT)
  }
  // the top, closed
  const top = ring(TOP - 2)
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides
    out.quad([top[i], top[j], [0, TOP, 0], [0, TOP, 0]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], CROWN, 0)
  }
}
