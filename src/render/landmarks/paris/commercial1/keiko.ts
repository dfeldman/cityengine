/**
 * Keiko — office tower (Loci Anima for Sefri-Cime, 2025), 127 quai du Président Roosevelt, Issy-les-Moulineaux. OSM way/1336812893,
 * 15 storeys, 69 m. Facade photos not found (web search gave only data); styled as Loci Anima's usual white horizontal
 * slab bands over full-height glazing. IGN lidar MNS (taken mid-construction) shows two masses: the west wing lower than
 * the east, so the plan is split at E_SPLIT and the west stops at WEST_H. Plan in metres east/north of 48.82924, 2.26173.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { registerRing, tone, tools, type P2 } from '../museums/enframe.ts'

const RING: P2[] = [[-33.3, -8.7], [-29.1, 8.8], [-6.8, 23.4], [3.6, 20.4], [9.1, 16.6], [5.8, 11.6], [12.7, 6.6], [28.9, 14.8], [43.9, 11], [44.6, 6.4], [7.6, -32.7], [-2.7, -25.9], [0, -15.8], [-6, -10.4], [-11.9, -5], [-31.3, -10]]

export const KEIKO = {
  H: 69, WEST_H: 63, E_SPLIT: 8, // east wing to the full height, west wing a few floors lower (lidar)
  BASE: 6, FLOOR: 4.0, BAND: 0.9, BAND_OUT: 0.35, // double-height lobby, then floors with proud white slab bands
  CROWN: 2.5, PLANT_S: 0.5, PLANT_H: 3,
}

const ccw = (r: P2[]): P2[] => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1] } return a > 0 ? r : [...r].reverse() }
// keep the part of a ring with sign*(x - x0) >= 0
const clip = (r: P2[], x0: number, s: number): P2[] => {
  const o: P2[] = []
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], da = s * (a[0] - x0), db = s * (b[0] - x0)
    if (da >= 0) o.push(a)
    if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); o.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]) }
  }
  return o
}

export const keiko = (out: MeshBuilder, fit: Fit): void => {
  const K = KEIKO, T = tools(out, registerRing(RING, fit))
  const white = hex('#eceae4'), glass = hex('#4a5964'), lobby = hex('#2e3a42'), roofC = hex('#8e8c88')
  const ring = ccw(RING)
  for (const [part, h] of [[ccw(clip(ring, K.E_SPLIT, -1)), K.WEST_H], [ccw(clip(ring, K.E_SPLIT, 1)), K.H]] as [P2[], number][]) {
    T.prism(part, 0, K.BASE, lobby, null)
    T.prism(part, K.BASE, h - K.CROWN, glass, null)
    T.prism(part, h - K.CROWN, h, white, roofC)
    // slab bands: the ring pushed out along each edge normal, one per floor
    for (let i = 0; i < part.length; i++) {
      const a = part[i], b = part[(i + 1) % part.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (l < 0.5) continue
      const nx = (b[1] - a[1]) / l * K.BAND_OUT, ny = -(b[0] - a[0]) / l * K.BAND_OUT
      const A: P2 = [a[0] + nx, a[1] + ny], B: P2 = [b[0] + nx, b[1] + ny]
      for (let y = K.BASE; y < h - K.CROWN - 1; y += K.FLOOR) T.wall(A, B, y, y + K.BAND, white)
    }
    const cx = part.reduce((s, p) => s + p[0], 0) / part.length, cy = part.reduce((s, p) => s + p[1], 0) / part.length
    T.prism(part.map(([e, n]) => [cx + (e - cx) * K.PLANT_S, cy + (n - cy) * K.PLANT_S] as P2), h, h + K.PLANT_H, tone(white, 0.85), roofC)
  }
}
