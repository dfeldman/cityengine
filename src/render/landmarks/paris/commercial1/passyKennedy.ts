/**
 * Le Passy Kennedy — office building (1970s, restyled), 1 avenue du Président Kennedy, Paris 16e, beside the Maison de la Radio
 * (not modelled here). OSM way/83863766: one curved slab, an 11-storey lobe at the south-west end and a five-part arm that steps
 * down eastward (building:levels 10, 9, 8, 7, 6 on the parts). The plan is traced from OSM (metres east/north of
 * 48.853789, 2.281378) and heights from the IGN lidar MNS: lobe and first arm part 37 m, then 32, 29, 27, 24 m, with a few
 * roof plant boxes ~40 m. Photos (Commons category, passy1 and passy3 show the building; passy2 is the aerial that shows its
 * terraced arm beside the round Maison de la Radio): pale cream spandrel slabs and ribbon glazing on every floor, a dark
 * glazed ground storey, a cream parapet. Tunable in PASSY.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { ccwEN, registerRing, tools, type P2 } from '../museums/enframe.ts'

const RING: P2[] = [[-71.2, -24.9], [-70.2, -34.5], [-68.5, -38.8], [-63.9, -45.1], [-60.6, -48.7], [-56.4, -47.3], [-49.7, -46.3], [-43.2, -46.8], [-36.7, -49.1], [-31.1, -53.4], [-27.4, -58.4], [-24.4, -65.6], [-24.0, -70.8], [-18.9, -69.4], [-9.8, -63.9], [-5.4, -59.7], [-2.4, -54.8], [0.0, -49.1], [1.5, -41.3], [-6.2, -40.6], [-12.9, -38.3], [-17.2, -35.0], [-21.9, -30.0], [-25.0, -24.1], [-26.8, -18.0], [-26.5, -13.5], [-25.3, -7.5], [-22.2, -0.3], [-10.5, 15.5], [-1.4, 24.5], [5.1, 30.0], [21.5, 39.7], [31.2, 43.8], [40.5, 45.7], [51.9, 46.8], [59.6, 46.5], [71.5, 44.9], [93.6, 39.6], [98.8, 37.9], [102.7, 46.8], [103.9, 55.8], [102.4, 64.5], [99.8, 70.1], [94.8, 68.9], [74.7, 66.5], [67.7, 66.1], [55.5, 66.8], [42.6, 66.3], [24.5, 62.6], [18.8, 60.7], [7.4, 55.6], [1.1, 52.2], [-11.4, 42.9], [-23.2, 31.8], [-30.3, 23.8], [-35.5, 16.8], [-41.2, 7.2], [-45.4, -1.9], [-48.5, -6.6], [-53.1, -10.6], [-59.2, -14.2], [-63.3, -15.5], [-70.0, -16.1]]
const PARTS: { ring: P2[], h: number }[] = [
  { h: 37, ring: [[-13.6, 40.8], [1.9, 27.5], [8.1, 32.2], [17.0, 37.4], [31.2, 43.8], [29.4, 53.0], [24.5, 62.6], [18.8, 60.7], [4.1, 53.9], [-7.1, 46.3]] },
  { h: 32, ring: [[24.5, 62.6], [29.4, 53.0], [31.2, 43.8], [40.5, 45.7], [47.3, 46.5], [51.9, 46.8], [52.5, 56.4], [51.7, 66.6], [42.6, 66.3]] },
  { h: 29, ring: [[51.7, 66.6], [52.5, 56.4], [51.9, 46.8], [59.6, 46.5], [67.1, 45.5], [68.7, 54.9], [67.7, 66.1]] },
  { h: 27, ring: [[67.1, 45.5], [71.5, 44.9], [93.6, 39.6], [96.7, 46.1], [98.2, 53.2], [97.4, 62.1], [94.8, 68.9], [67.7, 66.1], [68.7, 54.9]] },
  { h: 24, ring: [[93.6, 39.6], [98.8, 37.9], [101.6, 43.8], [102.7, 46.8], [103.6, 52.7], [103.9, 55.8], [103.2, 61.6], [101.4, 67.3], [99.8, 70.1], [94.8, 68.9], [97.4, 62.1], [98.2, 53.2], [96.7, 46.1]] },
]

export const PASSY = {
  LOBE_H: 37, FLOOR: 3.4, GROUND: 4.6, SPANDREL: 1.15, SLAB_OUT: 0.22, PARAPET: 0.9, PARAPET_OUT: 0.18,
  PLANT_H: 3.2, MIN_EDGE: 1.0, SHARED_TOL: 0.7,
}

// the lobe: the ring from the outer end of the first arm part, round the south-west end, to its inner end
const LOBE: P2[] = [[-13.6, 40.8], ...RING.slice(52), ...RING.slice(0, 31), [1.9, 27.5]]
const PLANTS: { c: P2, w: number, d: number, h: number }[] = [{ c: [-22, 14], w: 9, d: 6, h: 3.2 }, { c: [-50, -38], w: 6, d: 5, h: 2.6 }]

const segDist = (p: P2, a: P2, b: P2): number => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2))
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
}

export const passyKennedy = (out: MeshBuilder, fit: Fit): void => {
  const K = PASSY, T = tools(out, registerRing(RING, fit))
  const cream = hex('#e8e2d3'), creamDk = hex('#cfc8b6'), glass = hex('#566b79'), plinth = hex('#3e464b'), roof = hex('#8c8a86'), plant = hex('#a6a7a4')
  const regions = [{ ring: ccwEN(LOBE), h: K.LOBE_H }, ...PARTS.map((p) => ({ ring: ccwEN(p.ring), h: p.h }))]
  const sharedWith = (a: P2, b: P2, self: number): number => {
    const m: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    for (let j = 0; j < regions.length; j++) {
      if (j === self) continue
      const r = regions[j].ring
      for (let i = 0; i < r.length; i++) if (segDist(m, r[i], r[(i + 1) % r.length]) < K.SHARED_TOL && segDist(a, r[i], r[(i + 1) % r.length]) < K.SHARED_TOL && segDist(b, r[i], r[(i + 1) % r.length]) < K.SHARED_TOL) return j
    }
    return -1
  }
  regions.forEach((reg, ri) => {
    const r = reg.ring, H = reg.h
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (l < 0.05) continue
      const sj = sharedWith(a, b, ri)
      if (sj >= 0) { if (regions[sj].h < H) T.wall(a, b, regions[sj].h, H + K.PARAPET, cream); continue }
      const nx = (b[1] - a[1]) / l, ny = -(b[0] - a[0]) / l
      const off = (d: number): [P2, P2] => [[a[0] + nx * d, a[1] + ny * d], [b[0] + nx * d, b[1] + ny * d]]
      T.wall(a, b, 0, K.GROUND, plinth)
      T.wall(...off(K.SLAB_OUT), K.GROUND - 0.5, K.GROUND, creamDk)
      const top = H - 0.2
      for (let y = K.GROUND, f = 0; y < top - 0.3; y += K.FLOOR, f++) {
        const y1 = Math.min(y + K.FLOOR, top)
        T.wall(a, b, y, y1 - K.SPANDREL, glass)
        if (l >= K.MIN_EDGE) T.wall(...off(K.SLAB_OUT), y1 - K.SPANDREL, y1, cream)
        else T.wall(a, b, y1 - K.SPANDREL, y1, cream)
      }
      T.wall(a, b, top, H, cream)
      T.wall(...off(K.PARAPET_OUT), H, H + K.PARAPET, cream)
    }
    T.cap(r, H + K.PARAPET, roof)
  })
  for (const p of PLANTS) {
    const ring: P2[] = [[p.c[0] - p.w / 2, p.c[1] - p.d / 2], [p.c[0] + p.w / 2, p.c[1] - p.d / 2], [p.c[0] + p.w / 2, p.c[1] + p.d / 2], [p.c[0] - p.w / 2, p.c[1] + p.d / 2]]
    T.prism(ring, K.LOBE_H + K.PARAPET, K.LOBE_H + K.PARAPET + p.h, plant, creamDk)
  }
}
