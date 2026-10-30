import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { cap, edgeAt, fitted, hex, noise, panel, pts, shade, wound, type P2, type Rgb, type V3 } from './common.ts'

/** the design footprint: OSM way 626357932's box, −z to the Avenue Pierre Mendès-France, bearing 61.7 */
const HX = 69.8
const HZ = 23.2
const PLAN = pts([-69.8, -23.1, -69.7, 20.1, -33.1, 23.1, -32.7, 7.9, 50.2, 10.7, 49.9, 8.1, 69.8, 8.7, 69.4, -23.2])
const H = 30
const FLOOR = 3.75
/** the arch through the building: its half-width, its crown (from memory of the place; OSM has no such thing) */
const ARCH_HW = 33
const ARCH_C = 4
const ARCH_Y = 14

/** The underside of the building at local x: the ground, or the arch. */
const under = (x: number): number => {
  const u = (x - ARCH_C) / ARCH_HW
  return Math.abs(u) < 1 ? ARCH_Y * (1 - u * u) : 0
}
const PIXELS: Rgb[] = [hex('#c9d3d6'), hex('#dfe5e6'), hex('#aebcc2'), hex('#8ea1aa'), hex('#eef0ee'), hex('#6f858f')]

/**
 * The Le Monde building (Snøhetta with SRA, 2020, by memory), 67–69 avenue Pierre Mendès-France, across the avenue from the Gare
 * d'Austerlitz's tracks: a long seven- or eight-storey bar lifted over a great arch, with the public square running through under
 * it, and a skin of glass "pixels", thousands of small panes each a little more or less transparent, so that the wall reads as
 * a shimmering grey-white image rather than as floors.
 *
 * The plan is OSM's and the 30 m the bake's. No photograph came to hand (the Commons searches found none, the Mapillary frame showed the neighbour), so the
 * arch's span and height, the panes' tones are from memory and should be checked against a photograph.
 */
export function leMonde(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

/** A wall in pixels: a column at a time along the edge, cut off below by the arch. */
function pixelWall(out: MeshBuilder, a: P2, b: P2, inner: V3, seed: number): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  const n = Math.max(1, Math.round(L / 2.6))
  const rows = Math.round(H / FLOOR)
  for (let i = 0; i < n; i++) {
    const pa: P2 = { x: a.x + ((b.x - a.x) * i) / n, z: a.z + ((b.z - a.z) * i) / n }
    const pb: P2 = { x: a.x + ((b.x - a.x) * (i + 1)) / n, z: a.z + ((b.z - a.z) * (i + 1)) / n }
    const ua = under(pa.x), ub = under(pb.x)
    for (let r = 0; r < rows; r++) {
      const y0 = (r * H) / rows, y1 = ((r + 1) * H) / rows
      const ya = Math.max(y0, ua), yb = Math.max(y0, ub)
      if (ya >= y1 && yb >= y1) continue
      const k = noise(seed + i * 1.3, r * 2.1)
      // two tones of pale to one of dark, weighted to the middle of the wall so the mass shimmers and the edges hold
      const c = PIXELS[Math.floor(k * k * PIXELS.length * 0.99)]
      const dark = r === 0 && !ua && !ub
      panel(out, [[pa.x, ya, pa.z], [pb.x, yb, pb.z], [pb.x, Math.max(y1, yb), pb.z], [pa.x, Math.max(y1, ya), pa.z]], inner, dark ? hex('#2d3a40') : c)
    }
  }
}

function draw(out: MeshBuilder): void {
  const plan = wound([PLAN])[0]
  const inner: V3 = [0, H / 2, 0]
  for (let i = 0; i < plan.length; i++) pixelWall(out, plan[i], plan[(i + 1) % plan.length], inner, i * 37 + 1)
  cap(out, plan, H, hex('#7f8a8a'))
  // the parapet's thin line
  for (let i = 0; i < plan.length; i++) {
    const e = edgeAt(plan, i)
    out.quad([[e.a.x, H, e.a.z], [e.b.x, H, e.b.z], [e.b.x, H + 0.5, e.b.z], [e.a.x, H + 0.5, e.a.z]], [e.nx, 0, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], hex('#c9cfcf'), 0)
  }
  // ---- the arch's soffit, one strip a step along it, from the avenue's wall to the back wall; warm, lit from the square
  const z0 = -23.15, z1 = 9.4
  const steps = 22
  for (let i = 0; i < steps; i++) {
    const xa = ARCH_C - ARCH_HW + (2 * ARCH_HW * i) / steps
    const xb = ARCH_C - ARCH_HW + (2 * ARCH_HW * (i + 1)) / steps
    const c = shade(hex('#b9a88e'), 0.78 + noise(i, 8) * 0.14)
    panel(out, [[xa, under(xa), z0], [xb, under(xb), z0], [xb, under(xb), z1], [xa, under(xa), z1]], [(xa + xb) / 2, H, 0], c)
  }
  // the square's dark glazed lobby either side of the arch's feet, set back from the walls
  for (const [x0, x1] of [[ARCH_C - ARCH_HW - 7, ARCH_C - ARCH_HW + 3], [ARCH_C + ARCH_HW - 3, ARCH_C + ARCH_HW + 7]] as const) {
    const q = pts([x0, z0 + 0.1, x1, z0 + 0.1, x1, z1 - 0.1, x0, z1 - 0.1])
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4
      panel(out, [[q[i].x, 0, q[i].z], [q[j].x, 0, q[j].z], [q[j].x, under((q[i].x + q[j].x) / 2) || 6, q[j].z], [q[i].x, under((q[i].x + q[j].x) / 2) || 6, q[i].z]], [(x0 + x1) / 2, 2, 0], hex('#2d3a40'))
    }
  }
}
