/**
 * WeWork, 198 avenue de France, Paris 13e (Paris Rive Gauche, on place Tina Turner), 2018 glass office, OSM way/62379740,
 * 9 levels, 31 m. Facade photos could not be fetched (Commons thumbnails refused), so it is styled as a modern glass
 * curtain wall with proud pale slab bands and a dark glazed ground floor. IGN lidar MNS (tools/ign-mns.ts) says: the
 * OSM plan's north tip (y > NORTH_CUT) is open ground, not roof, and the south-east half stands about 5 m above the
 * north-west (the l-class roof, 60 against 55 on the model's raw grid), so the plan is cut there and split along the
 * line x - STEP_SLOPE*y = STEP_C. Plan in metres east/north of 48.83602, 2.37216.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { registerRing, tone, tools, type P2 } from '../museums/enframe.ts'

const RING: P2[] = [[-2.4, 39.9], [-3.9, 38.8], [-8.7, 35.3], [-13.9, 31.5], [-22.2, 25.4], [-25.2, 23.2], [-26.5, 21.4], [-27.8, 18.9], [-28.6, 16.5], [-29.0, 13.5], [-28.6, 10.9], [-24.5, 4.4], [-19.0, -4.4], [-14.2, -12.0], [-9.5, -19.5], [-7.5, -22.8], [-6.8, -23.9], [2.8, -39.2], [12.7, -31.2], [14.2, -29.9], [17.8, -27.0], [16.4, -25.3], [17.7, -24.2], [19.2, -25.9], [20.6, -24.7], [28.6, -18.1], [35.7, -12.1], [38.6, -9.7], [34.1, -4.2], [26.9, 4.5], [19.1, 13.9], [11.0, 23.7], [2.7, 33.8]]

export const WEWORK_FRANCE = {
  H_NW: 31, H_SE: 34, // OSM 31 m; the south-east half a storey-ish higher (lidar +5 raw)
  NORTH_CUT: 27, STEP_SLOPE: 0.33, STEP_C: -3, // lidar: roof stops at y 27; the higher half is x - 0.33 y >= -3
  BASE: 5.2, FLOOR: 3.2, BAND: 0.55, BAND_OUT: 0.25, // dark glazed ground floor, then floors with pale slab edges
  CROWN: 1.2, PLANT_S: 0.45, PLANT_H: 2.8, // parapet, then a set-back plant box
}

const ccw = (r: P2[]): P2[] => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1] } return a > 0 ? r : [...r].reverse() }
/** keep the part of a ring with a*x + b*y >= c */
const clip = (r: P2[], a: number, b: number, c: number): P2[] => {
  const o: P2[] = [], f = (p: P2): number => a * p[0] + b * p[1] - c
  for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length], dp = f(p), dq = f(q)
    if (dp >= 0) o.push(p)
    if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq); o.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]) }
  }
  return o
}

export const weworkFrance = (out: MeshBuilder, fit: Fit): void => {
  const K = WEWORK_FRANCE, T = tools(out, registerRing(RING, fit))
  const white = hex('#e6e6e2'), glass = hex('#5d7684'), lobby = hex('#2a343b'), roofC = hex('#8c8b88')
  const ring = clip(ccw(RING), 0, -1, -K.NORTH_CUT)
  for (const [part, h] of [[ccw(clip(ring, -1, K.STEP_SLOPE, K.STEP_C)), K.H_NW], [ccw(clip(ring, 1, -K.STEP_SLOPE, -K.STEP_C)), K.H_SE]] as [P2[], number][]) {
    if (part.length < 3) continue
    T.prism(part, 0, K.BASE, lobby, null)
    T.prism(part, K.BASE, h - K.CROWN, glass, null)
    T.prism(part, h - K.CROWN, h, white, roofC)
    // slab bands: the plan pushed out along each edge normal, one per floor
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
