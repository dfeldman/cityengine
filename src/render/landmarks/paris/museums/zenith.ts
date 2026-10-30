import type { MeshBuilder } from '../../../buildings.ts'
import { beam, block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { sheet, type V3 } from './shapes.ts'

/**
 * Le Zénith de Paris (Philippe Chaix and Jean-Paul Morel, 1983), the concert hall at La Villette: built as a two-year
 * stopgap and never taken down, a double polyester tent over a steel frame:
 *
 * - from anywhere in the park or the Canal: the great grey-white membrane, the fabric drawn up between its steel arch ribs
 *   and scalloped down to its low wall;
 * - the tall red lattice mast with its sign at the entrance (local −z), and the bright cables out from the frame to the
 *   ground anchors round it;
 * - the low dark wall of doors round the foot.
 *
 * On OSM's way 63971432, kite-shaped, 76 × 90 m, height 20 in OSM's tag and the same in memory. The ribs' count and the
 * mast are from memory: no photograph was checked.
 */
export function zenith(out: MeshBuilder, fit: Fit): void {
  const hx = fit.hx
  const hz = fit.hz
  const H = Math.min(Math.max(fit.height || 20, 15), 24)
  const fabric = hex('#b6b8b6')
  const dark = hex('#2f3336')
  const steel = hex('#8d9498')
  const red = hex('#b63a2c')
  const rim = (a: number, k: number): V3 => {
    // a slightly squared ellipse, on the footprint
    const c = Math.cos(a)
    const s = Math.sin(a)
    const e = 0.72
    return [Math.sign(c) * Math.pow(Math.abs(c), e) * hx * k, 0, Math.sign(s) * Math.pow(Math.abs(s), e) * hz * k]
  }
  const nr = 20
  // the low wall of doors
  const wallH = 3.2
  for (let i = 0; i < nr; i++) {
    const a0 = (i / nr) * Math.PI * 2
    const a1 = ((i + 1) / nr) * Math.PI * 2
    const p0 = rim(a0, 0.86)
    const p1 = rim(a1, 0.86)
    sheet(out, (u, v) => [p0[0] + (p1[0] - p0[0]) * u, v * wallH, p0[2] + (p1[2] - p0[2]) * u], 1, 1, dark, 0.04)
  }
  // the membrane, scalloped between the ribs: higher along each rib, slack between them
  const membrane = (u: number, v: number): V3 => {
    const a = u * Math.PI * 2
    const k = 0.86 * (1 - v) + 0.14 * v
    const p = rim(a, k)
    const sag = Math.abs(Math.sin((u * nr * Math.PI))) * 1.6 * Math.sin(v * Math.PI)
    const y = wallH + (H - 1.4 - wallH) * Math.pow(Math.sin((v * Math.PI) / 2), 0.8) + (1 - v) * (2 - Math.abs(Math.sin(u * nr * Math.PI)) * 2) - sag * 0.25
    return [p[0], y, p[2]]
  }
  sheet(out, membrane, nr * 2, 7, (u, v) => shade(fabric, 0.88 + 0.12 * v + (Math.floor(u * nr * 2) % 2) * 0.05), 0.05)
  // the crown: a low steel ring and the small upper tent
  const top = H - 1.4
  sheet(out, (u, v) => {
    const p = rim(u * Math.PI * 2, 0.14 * (1 - v))
    return [p[0], top + v * 1.4, p[2]]
  }, 14, 1, shade(fabric, 1.03), 0.05)
  // the ribs and their cables out to the ground
  for (let i = 0; i < nr; i += 2) {
    const a = ((i + 0.5) / nr) * Math.PI * 2
    const P = (t: number): V3 => membrane((i + 0.5) / nr, t)
    for (let k = 0; k < 7; k++) {
      const p = P(k / 7)
      const q = P((k + 1) / 7)
      beam(out, [p[0], p[1] + 0.12, p[2]], [q[0], q[1] + 0.12, q[2]], 0.09, steel)
    }
    const p = rim(a, 1)
    const hi = P(0.15)
    beam(out, [p[0] * 1.05, 0.2, p[2] * 1.05], [hi[0], hi[1] + 0.15, hi[2]], 0.04, shade(steel, 1.2))
    block(out, p[0] * 1.05 - 0.4, p[0] * 1.05 + 0.4, p[2] * 1.05 - 0.4, p[2] * 1.05 + 0.4, 0, 0.5, dark)
  }
  // the entrance's red mast, on −z
  const mx = 0
  const mz = -hz * 0.92
  for (const [dx, dz] of [[-0.7, -0.7], [0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]] as const) block(out, mx + dx - 0.09, mx + dx + 0.09, mz + dz - 0.09, mz + dz + 0.09, 0, 34, red)
  for (let y = 1.5; y < 34; y += 2.4) {
    block(out, mx - 0.8, mx + 0.8, mz - 0.75, mz - 0.65, y, y + 0.1, red)
    block(out, mx - 0.8, mx + 0.8, mz + 0.65, mz + 0.75, y, y + 0.1, red)
    block(out, mx - 0.75, mx - 0.65, mz - 0.8, mz + 0.8, y, y + 0.1, red)
    block(out, mx + 0.65, mx + 0.75, mz - 0.8, mz + 0.8, y, y + 0.1, red)
  }
  block(out, mx - 3.5, mx + 3.5, mz - 1, mz - 0.75, 22, 25, shade(red, 1.05))
}
