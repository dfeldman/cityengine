/**
 * Tour DGA — Cité de l'Air de Balard, Tour A (Pierre Large, 1979; restructured by Di Fiore et Associés 2010–12), Paris 15e.
 * R+18, 66.5 m (pss-archi). OSM relation/538267 covers the whole round low block (about 113 m across, one lens-shaped
 * court on the north) with Tour A a building:part (way/229418339) standing in its southern half: both are modelled.
 * Photos (pss-archi #5300, Sinha / Q_DC): a lens-plan tower in silvery glass with tight vertical mullions and a plain
 * crown, low pale blocks around it. IGN lidar MNS and the HR orthophoto are pixelated over the site (military
 * masking), so the low block's height is a guess (LOW_H) and plans are OSM's, in metres east/north of 48.83347, 2.28090,
 * registered onto the fitted ring by enframe's hull moments.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { registerRing, tone, tools, type P2 } from '../museums/enframe.ts'

const OUTER: P2[] = [[-60.9, -2.8], [-60.5, -10.7], [-59.2, -17.6], [-57, -24.4], [-53.6, -31.5], [-50.1, -37.1], [-45.5, -42.6], [-40.5, -47.3], [-34.6, -51.7], [-28.5, -55], [-21.8, -57.7], [-14.6, -59.5], [-8.2, -60.3], [-0.3, -60.4], [6.4, -59.5], [13.5, -57.7], [19.6, -55.3], [26.3, -51.6], [32, -47.4], [37.3, -42.5], [42, -36.7], [45.6, -30.9], [48.6, -24.7], [50.9, -17.7], [52.2, -10.6], [52.6, -2.9], [52.2, 3.7], [50.9, 10.6], [49.1, 16.1], [46.8, 22.3], [44, 27.3], [48.9, 30.6], [44.9, 36.2], [38.8, 42.9], [32.4, 48], [26, 52], [20.5, 54.7], [18.2, 49.5], [13.4, 51.1], [5.6, 52.9], [-0.1, 53.6], [-8.1, 53.6], [-14.6, 52.9], [-21.8, 51], [-28.6, 48.3], [-35.2, 44.6], [-40.5, 40.6], [-45.5, 35.8], [-50.1, 30.4], [-54.1, 24], [-57.2, 17.2], [-59.3, 10.7], [-60.5, 3.7]]
const COURT: P2[] = [[-20, 39], [-10, 17], [-7, 14], [-4, 11], [1, 10], [5, 9], [9, 10], [11, 11], [32, 24], [27, 30], [22, 34], [15, 38], [11, 40], [4, 41], [-1, 42], [-9, 42], [-17, 40]]
const TOWER: P2[] = [[0.8, -19.5], [1, -21.2], [2.1, -25], [3.3, -26.9], [6.4, -29.2], [9.8, -30.7], [17.8, -32.1], [22.7, -31.9], [29.5, -30.3], [36.5, -26.2], [41.7, -21.1], [42.9, -16.9], [43, -14.7], [42.7, -12.8], [41.8, -10.4], [40.7, -8.8], [39.1, -7.4], [36.6, -6], [30.9, -4.1], [22.5, -3.4], [18.9, -3.8], [12.8, -5.8], [3.9, -11.5], [1.8, -15.2]]

export const DGA = {
  LOW_H: 21, LOW_FLOOR: 3.4, LOW_BASE: 4, // low block: ground storey, then office floors (height guessed: lidar masked)
  WIN_LO: 0.9, WIN_HI: 2.6, BAND_OFF: 0.06,
  TOWER_H: 66.5, T_FLOOR: 3.35, T_BASE: 6, CROWN: 3.2, MULLION: 2.2, FIN_D: 0.35, FIN_W: 0.12,
  CANOPY_W: 14, CANOPY_D: 5, CANOPY_H: 4.2, // entrance canopy on boulevard Victor (south)
}

const ccw = (r: P2[]): P2[] => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1] } return a > 0 ? r : [...r].reverse() }

export const tourDGA = (out: MeshBuilder, fit: Fit): void => {
  const K = DGA, F = registerRing(OUTER, fit), T = tools(out, F)
  const stone = hex('#d6d1c6'), glass = hex('#3c4852'), roofC = hex('#8f8c86'), silver = hex('#aab4bc'), tglass = hex('#8494a0'), fin = hex('#e2e6e9'), dark = hex('#2a3138')
  const outer = ccw(OUTER), court = ccw(COURT), tower = ccw(TOWER)
  // low block: outer walls, court walls (facing in: run the court clockwise), roof with the court as a keyhole
  T.prism(outer, 0, K.LOW_H, stone, null)
  const cw = [...court].reverse()
  for (let i = 0; i < cw.length; i++) T.wall(cw[i], cw[(i + 1) % cw.length], 0, K.LOW_H, stone)
  T.cap([...outer, outer[0], cw[0], ...cw.slice(1), cw[0]], K.LOW_H, roofC)
  // window bands: one dark strip per floor on every outer and court edge, glazed ground storey
  const bands = (ring: P2[]): void => {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (l < 1) continue
      const nx = (b[1] - a[1]) / l * K.BAND_OFF, ny = -(b[0] - a[0]) / l * K.BAND_OFF
      const A: P2 = [a[0] + nx, a[1] + ny], B: P2 = [b[0] + nx, b[1] + ny]
      T.wall(A, B, 0.3, K.LOW_BASE - 0.4, dark)
      for (let y = K.LOW_BASE; y + K.WIN_HI < K.LOW_H - 0.8; y += K.LOW_FLOOR) T.wall(A, B, y + K.WIN_LO, y + K.WIN_HI, glass)
    }
  }
  bands(outer); bands(cw)
  // Tour A: glazed lens with tight mullion fins, a recessed glass base and a solid crown
  const top = K.TOWER_H - K.CROWN
  T.prism(tower, K.LOW_H, top, tglass, null)
  T.prism(tower, top, K.TOWER_H, silver, roofC)
  for (let i = 0; i < tower.length; i++) {
    const a = tower[i], b = tower[(i + 1) % tower.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l
    const n = Math.max(1, Math.round(l / K.MULLION))
    for (let j = 0; j < n; j++) {
      const s = (j + 0.5) * l / n, c: P2 = [a[0] + ux * s, a[1] + uy * s]
      const p: P2 = [c[0] + uy * K.FIN_D - ux * K.FIN_W, c[1] - ux * K.FIN_D - uy * K.FIN_W], q: P2 = [c[0] + uy * K.FIN_D + ux * K.FIN_W, c[1] - ux * K.FIN_D + uy * K.FIN_W]
      T.wall(p, q, K.LOW_H, top, fin)
    }
    // slab edges every floor, slightly proud
    const o = 0.08, A: P2 = [a[0] + uy * o, a[1] - ux * o], B: P2 = [b[0] + uy * o, b[1] - ux * o]
    for (let y = K.LOW_H + K.T_FLOOR; y < top; y += K.T_FLOOR) T.wall(A, B, y - 0.25, y, tone(silver, 0.9))
  }
  // plant enclosure on the crown, set back
  const cx = tower.reduce((s, p) => s + p[0], 0) / tower.length, cy = tower.reduce((s, p) => s + p[1], 0) / tower.length
  T.prism(tower.map(([e, n]) => [cx + (e - cx) * 0.55, cy + (n - cy) * 0.45] as P2), K.TOWER_H, K.TOWER_H + 3, tone(silver, 0.85), roofC)
  // entrance on the south rim: a flat canopy on posts before a full-height glazed lobby
  const se = 4, sn = -60.4, w = K.CANOPY_W / 2
  T.prism([[se - w, sn - K.CANOPY_D], [se + w, sn - K.CANOPY_D], [se + w, sn + 0.5], [se - w, sn + 0.5]], K.CANOPY_H, K.CANOPY_H + 0.45, silver, silver)
  T.wall([se - w + 1, sn - 0.15], [se + w - 1, sn - 0.15], 0, K.CANOPY_H, glass)
  for (const e of [se - w + 0.6, se + w - 0.6]) T.prism([[e - 0.2, sn - K.CANOPY_D + 0.4], [e + 0.2, sn - K.CANOPY_D + 0.4], [e + 0.2, sn - K.CANOPY_D + 0.8], [e - 0.2, sn - K.CANOPY_D + 0.8]], 0, K.CANOPY_H, silver, null)
}
