/**
 * La Barge, 136 quai du Président Roosevelt, Issy (OSM way/712556637, building=boat, restaurant): a moored barge on the Seine, about 40 x 11 m.
 * No photo checked; a dark steel hull with a white two-deck superstructure of continuous glazing and a flat roof. Plan in metres east/north of 48.8335, 2.2700.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { ccwEN, registerRing, tools, type P2 } from '../museums/enframe.ts'

const PLAN: P2[] = [[-660.6, -302.9], [-649.4, -287.4], [-643.2, -278.0], [-640.2, -270.9], [-646.0, -266.9], [-657.0, -281.2], [-668.0, -298.7]]

export const LA_BARGE = {
  HULL_H: 1.6, DECK_H: 3.2, TOP_H: 7, SUPER_INSET: 0.12, GLASS_OFF: 0.1, GLASS_LO: 0.5, GLASS_H: 2.2,
  HULL: '#2f3a44', WALL: '#e8e6e0', GLASS: '#3f5568', ROOF: '#b9b9b4',
}

export const laBarge = (out: MeshBuilder, fit: Fit): void => {
  const K = LA_BARGE, F = registerRing(PLAN, fit), T = tools(out, F), r = ccwEN(PLAN)
  const cx = r.reduce((s, p) => s + p[0], 0) / r.length, cy = r.reduce((s, p) => s + p[1], 0) / r.length
  const k = 1 - K.SUPER_INSET
  const sup = r.map(([e, n]) => [cx + (e - cx) * k, cy + (n - cy) * k] as P2)
  T.prism(r, 0, K.HULL_H, hex(K.HULL), hex(K.HULL))
  T.prism(sup, K.HULL_H, K.TOP_H, hex(K.WALL), hex(K.ROOF), 8, 0.03)
  for (let i = 0; i < sup.length; i++) {
    const a = sup[i], b = sup[(i + 1) % sup.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 1) continue
    const nx = (b[1] - a[1]) / l * K.GLASS_OFF, ny = -(b[0] - a[0]) / l * K.GLASS_OFF
    const A: P2 = [a[0] + nx, a[1] + ny], B: P2 = [b[0] + nx, b[1] + ny]
    for (const y0 of [K.HULL_H, K.DECK_H]) T.wall(A, B, y0 + K.GLASS_LO, y0 + K.GLASS_LO + K.GLASS_H, hex(K.GLASS))
  }
}
