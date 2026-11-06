/**
 * Three crescent "boat" wings by Tour Sequana, rue Henry Farman, Issy (OSM ways 89564254, 89564258, 89564260: each
 * office, glass, 43 m, a bowed 14-25 m wide hull about 70-90 m long). Owner (2026-11-05): "a cool one with 3 big boat-like
 * wings". No photo found (search turned up only Le Farman by Wilmotte and Eqwater by Arquitectonica nearby, unconfirmed
 * as these); the plans are OSM's, in metres east/north of 48.8343, 2.2654, registered by hull moments over the three
 * together. Distance fidelity: blue-grey glass, a pale band at every floor, a lifted prow at each hull's end.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { ccwEN, registerRing, tools, type P2 } from '../museums/enframe.ts'

const A: P2[] = [[76.9, -44.9], [75.4, -38.2], [73.6, -30.9], [71.9, -24.4], [69, -15.3], [66.1, -7.7], [62.6, -0.4], [58.4, 6.6], [53.6, 13.2], [51.4, 15.5], [50.2, 8.3], [49.5, 0.2], [49.6, -7.8], [50.4, -15.9], [51.7, -23.9], [53.3, -31.8], [55.3, -39.7], [56.9, -44.9], [59.1, -51.9], [61.8, -59.9], [63.2, -63.9]]
const B: P2[] = [[47.1, -82.3], [42.9, -72.1], [39.4, -65], [35.8, -57.8], [32.1, -50.5], [28.4, -43.4], [24.6, -36.2], [20.6, -29.2], [16.3, -22.3], [11.4, -15.7], [6.2, -9.7], [0.3, -4.1], [-5.3, 0.4], [-5.4, -2.7], [-4.6, -10.7], [-3.2, -18.7], [-0.9, -26.6], [2, -34.3], [5.2, -41.7], [8.7, -49], [12.5, -56.2], [16.2, -63.3], [19.9, -70.6], [23.7, -77.7], [27, -83.5], [31.4, -90.7], [36.1, -97.5]]
const C: P2[] = [[10.8, -132.5], [21.2, -117.9], [18.4, -112], [14.9, -105.4], [11, -99.1], [4.6, -89.4], [-0.2, -82.8], [-3.7, -78.4], [-7.9, -73.6], [-13.8, -68], [-20.1, -63], [-26, -59], [-25.9, -62.2], [-24.4, -70], [-22.2, -77.8], [-19.3, -85.4], [-15.8, -92.8], [-9.9, -103.5], [-3.3, -113.8], [1, -119.9], [4.2, -124.2], [8.3, -129.5]]

// the glass spine joining the hulls' backs (way 89564255, office, 7 levels; owner 2026-11-05: "a real glass structure")
const S: P2[] = [[-8.4,-132.1],[2.6,-146.3],[2.4,-146.4],[2.9,-147.1],[10.7,-136.3],[21.8,-121.0],[39.0,-97.1],[50.2,-81.5],[63.2,-63.5],[62.7,-62.0],[61.8,-59.5],[61.0,-57.1],[59.9,-54.0],[59.1,-51.5],[58.3,-49.2],[57.4,-46.4],[56.9,-44.6],[56.2,-42.5],[51.4,-49.1],[45.0,-58.1],[39.8,-65.2],[41.3,-68.2],[42.9,-71.7],[44.3,-74.9],[45.7,-78.4],[47.1,-81.7],[36.1,-96.9],[34.7,-94.9],[33.1,-92.9],[31.4,-90.1],[29.5,-87.0],[28.6,-85.5],[27.0,-82.9],[20.0,-92.6],[13.3,-101.9],[14.9,-104.7],[16.5,-107.5],[18.4,-111.2],[19.8,-114.1],[21.2,-117.1],[10.8,-131.6],[9.5,-130.0],[8.3,-128.6],[6.8,-126.7],[5.5,-125.1],[4.2,-123.4],[3.0,-121.7],[1.0,-119.1]]

export const WINGS = {
  H: 43, FLOOR: 3.6, BASE: 5, // 43 m (OSM); ground storey of darker glass
  PROW: 3.5, PROW_LEN: 14, // the roof rises this much over the last PROW_LEN metres of each hull end (a boat's sheer)
  BAND_OFF: 0.12, BAND_H: 0.9,
  SPINE_H: 25.5, SPINE_GLASS: '#9fb6c4', SPINE_BAND: '#e8ecee', // 7 storeys, paler glass than the hulls
  GLASS: '#5f7f96', BAND: '#d7dde0', ROOF: '#9a9d9f', FOOT: '#3a4650',
}

export const boatWings = (out: MeshBuilder, fit: Fit): void => {
  const K = WINGS, all = [...A, ...B, ...C, ...S], F = registerRing(all, fit), T = tools(out, F)
  const glass = hex(K.GLASS), band = hex(K.BAND), roof = hex(K.ROOF), foot = hex(K.FOOT)
  {
    const r = ccwEN(S)
    T.prism(r, 0, K.BASE, foot, null)
    T.prism(r, K.BASE, K.SPINE_H, hex(K.SPINE_GLASS), roof, 6, 0.03)
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (l < 0.5) continue
      const nx = (b[1] - a[1]) / l * K.BAND_OFF, ny = -(b[0] - a[0]) / l * K.BAND_OFF
      for (let y = K.BASE + K.FLOOR; y < K.SPINE_H; y += K.FLOOR) T.wall([a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], y - K.BAND_H, y, hex(K.SPINE_BAND))
    }
  }
  for (const raw of [A, B, C]) {
    const r = ccwEN(raw)
    // the hull's long axis: from the centroid's farthest vertex pair, to lift the ends
    let p0 = r[0], p1 = r[0], best = 0
    for (const p of r) for (const q of r) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d > best) { best = d; p0 = p; p1 = q } }
    const ux = (p1[0] - p0[0]) / best, uy = (p1[1] - p0[1]) / best
    const top = (e: number, n: number): number => {
      const s = (e - p0[0]) * ux + (n - p0[1]) * uy
      const d = Math.min(s, best - s)
      return K.H + (d < K.PROW_LEN ? K.PROW * (1 - Math.max(0, d) / K.PROW_LEN) : 0)
    }
    T.prism(r, 0, K.BASE, foot, null)
    // the shaft in glass; the prow-lifted roof as band at the top (flat cap at H, then a sloped fascia)
    T.prism(r, K.BASE, K.H, glass, roof, 6, 0.03)
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (l < 0.5) continue
      const nx = (b[1] - a[1]) / l * K.BAND_OFF, ny = -(b[0] - a[0]) / l * K.BAND_OFF
      const a2: P2 = [a[0] + nx, a[1] + ny], b2: P2 = [b[0] + nx, b[1] + ny]
      for (let y = K.BASE + K.FLOOR; y < K.H - 0.5; y += K.FLOOR) T.wall(a2, b2, y - K.BAND_H, y, band)
      T.wall(a2, b2, K.H, (e, n) => top(e, n), band) // sheer fascia rising to the prows
    }
  }
}
