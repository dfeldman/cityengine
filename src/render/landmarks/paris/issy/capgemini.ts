/**
 * Capgemini HQ "Aquarel", 147 quai du Président Roosevelt, Issy (OSM relation/14953001, office, 9 levels, Loci Anima / Arte Charpentier, 2019):
 * a wide glazed campus block on the Seine. Medium fidelity from knowledge, no photo checked: a pale stone-and-glass facade with a glazed band
 * per floor and white spandrels, a recessed glazed ground storey and a roof plant box. Outer ring of way/547046812 (the courtyard way/1118279942
 * is sunk as a dark glazed well). Plan in metres east/north of 48.8335, 2.2700.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { ccwEN, registerRing, tools, type P2 } from '../museums/enframe.ts'

const PLAN: P2[] = [[-643.9, -497.0], [-625.3, -520.5], [-628.1, -529.9], [-619.7, -527.3], [-601.9, -521.8], [-597.5, -521.5], [-596.0, -516.3], [-584.8, -506.1], [-553.5, -474.8], [-582.5, -546.9], [-592.0, -586.9], [-613.0, -580.1], [-642.9, -591.1], [-644.6, -598.0], [-655.8, -595.4], [-667.0, -592.7], [-663.2, -578.4]]
const COURT: P2[] = [[-633.9, -544.7], [-640.7, -566.9], [-610.8, -554.0], [-604.1, -538.0]]

export const CAPGEMINI = {
  H: 36, FLOOR: 3.8, BASE: 5, // 9 levels
  BAND_OFF: 0.12, BAND_H: 2.3, BAND_LO: 0.7,
  WALL: '#e2dfd6', GLASS: '#5d7585', ROOF: '#9a9a96', PLANT: '#7a7e82', PLANT_H: 3, PLANT_INSET: 0.4, COURT_H: 0.4, COURT: '#3c4650',
}

export const capgemini = (out: MeshBuilder, fit: Fit): void => {
  const K = CAPGEMINI, F = registerRing(PLAN, fit), T = tools(out, F), r = ccwEN(PLAN)
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
  T.prism(ccwEN(COURT), K.H, K.H + K.COURT_H, hex(K.COURT), hex(K.COURT))
}
