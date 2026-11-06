/**
 * DGAC, 50 rue Henry Farman, Issy (OSM way/100135446, office, 7 levels): a wedge-shaped slab about 140 m long, 70 m deep, "very large and
 * unique" (owner, 2026-11-05). No photo checked; distance fidelity only: a pale concrete block with a dark glazed band
 * at every floor, a recessed glazed ground storey and a dark plant box on the roof. Plan in metres east/north of 48.8335, 2.2700.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { ccwEN, registerRing, tools, type P2 } from '../museums/enframe.ts'

const PLAN: P2[] = [[128.8, 119], [93.4, 121], [54.2, 123.3], [40.2, 124.1], [49.5, 112], [57.7, 106.1], [67.6, 99], [85.3, 86.1], [78.3, 80.5], [70.1, 75.7], [84.6, 57], [92.5, 46.8], [98.6, 54], [106.3, 59.5], [111.3, 63.3], [122.8, 70.8], [138.2, 83.2], [169.6, 106.2], [182.3, 115.3], [164.3, 116.9]]

export const DGAC = {
  H: 27, FLOOR: 3.6, BASE: 4.5, // 7 levels: ground storey then six floors
  BAND_OFF: 0.1, BAND_H: 1.7, BAND_LO: 0.9,
  WALL: '#d9d5cb', GLASS: '#47596a', ROOF: '#8c8c88', PLANT: '#6c7074', PLANT_H: 3, PLANT_INSET: 0.35,
}

export const dgac = (out: MeshBuilder, fit: Fit): void => {
  const K = DGAC, F = registerRing(PLAN, fit), T = tools(out, F), r = ccwEN(PLAN)
  const wall = hex(K.WALL), glass = hex(K.GLASS)
  T.prism(r, 0, K.H, wall, hex(K.ROOF), 8, 0.03)
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 1) continue
    const nx = (b[1] - a[1]) / l * K.BAND_OFF, ny = -(b[0] - a[0]) / l * K.BAND_OFF
    const A: P2 = [a[0] + nx, a[1] + ny], B: P2 = [b[0] + nx, b[1] + ny]
    T.wall(A, B, 0.3, K.BASE - 0.4, glass)
    for (let y = K.BASE; y + K.BAND_LO + K.BAND_H < K.H; y += K.FLOOR) T.wall(A, B, y + K.BAND_LO, y + K.BAND_LO + K.BAND_H, glass)
  }
  const cx = r.reduce((s, p) => s + p[0], 0) / r.length, cy = r.reduce((s, p) => s + p[1], 0) / r.length
  const k = 1 - K.PLANT_INSET
  T.prism(r.map(([e, n]) => [cx + (e - cx) * k, cy + (n - cy) * k] as P2), K.H, K.H + K.PLANT_H, hex(K.PLANT), hex(K.ROOF))
}
