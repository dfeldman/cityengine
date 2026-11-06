/**
 * Cirque Bormann-Moreno (OSM way/652247192, a ~34 m round footprint, rue Lucien Bossoutrot, Paris 15e): a striped big top,
 * a cylinder wall under a cone roof with a scalloped hem, a mast and flag, and a few caravans beside it. Owner's plan
 * (plans/expo-area.md): "cone + catenary skirt, tunable stripe count". Colours are a guess (red and white, no photo).
 * Drawn in the model's own x/z about the footprint's centre; radius is taken from the fitted ring.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tools, type Frame, type P2, type V3 } from '../museums/enframe.ts'

export const CIRCUS = {
  STRIPES: 20, A: '#c9242d', B: '#f3efe6', // stripe count (even) and the two colours
  WALL_H: 4.5, PEAK_H: 15, SAG: 1.1, SCALLOP_SEG: 1, // eave height, apex height, hem scallop depth
  MAST_H: 4, FLAG: '#f2c230', ROOF_OVER: 1.04, // roof overhang factor on the radius
  CARAVANS: [[1.25, 0.2, 0], [1.3, 0.6, 20], [1.22, 1.0, -10], [1.28, -0.5, 85], [1.35, 3.8, 5]] as [number, number, number][], // radius factor, angle (rad), heading deg
  CARAVAN_SIZE: [7, 2.5, 2.6] as [number, number, number], CARAVAN_C: ['#f1f1ee', '#e9e2cf', '#d8dde0'],
}

const frame = (): Frame => ({ p: (e, n, h) => [e, h, n], n: (v) => [v[0], v[2], v[1]], xz: (e, n) => ({ x: e, z: n }), y0: 0 })

export const cirqueBormann = (out: MeshBuilder, fit: Fit): void => {
  const K = CIRCUS, T = tools(out, frame())
  const ring = fit.ring ?? []
  const cx = ring.length ? ring.reduce((s, p) => s + p.x, 0) / ring.length : 0, cz = ring.length ? ring.reduce((s, p) => s + p.z, 0) / ring.length : 0
  const R = ring.length ? ring.reduce((s, p) => s + Math.hypot(p.x - cx, p.z - cz), 0) / ring.length : Math.min(fit.hx, fit.hz)
  const pt = (a: number, r: number, h: number): V3 => [cx + Math.cos(a) * r, cz + Math.sin(a) * r, h]
  const n = K.STRIPES
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2, col = hex(i % 2 ? K.B : K.A)
    const hint: V3 = [Math.cos(am), Math.sin(am), 0]
    // wall with a scalloped hem
    T.poly([pt(a0, R, K.WALL_H), pt(a1, R, K.WALL_H), pt(a1, R, 0.2), pt(am, R, 0.2 - K.SAG * 0), pt(a0, R, 0.2)], col, hint)
    // roof: a cone, eaves slightly proud of the wall
    const ro = R * K.ROOF_OVER
    T.poly([pt(a0, ro, K.WALL_H - 0.3), pt(a1, ro, K.WALL_H - 0.3), [cx, cz, K.PEAK_H]], col, [hint[0], hint[1], 0.5])
    // hem drape: a skirt hanging below the eave, sagging in the middle of each stripe
    T.poly([pt(a0, ro, K.WALL_H - 0.3), pt(a1, ro, K.WALL_H - 0.3), pt(a1, ro, K.WALL_H - 0.3 - K.SAG * 0.2), pt(am, ro, K.WALL_H - 0.3 - K.SAG), pt(a0, ro, K.WALL_H - 0.3 - K.SAG * 0.2)], col, hint)
  }
  T.beam([cx, cz, K.PEAK_H - 0.3], [cx, cz, K.PEAK_H + K.MAST_H], 0.15, hex('#8f9296'))
  T.poly([[cx, cz, K.PEAK_H + K.MAST_H], [cx + 2.2, cz, K.PEAK_H + K.MAST_H - 0.5], [cx, cz, K.PEAK_H + K.MAST_H - 1.2]], hex(K.FLAG), [0, 1, 0])
  // caravans
  K.CARAVANS.forEach(([rf, ang, hd], i) => {
    const c: P2 = [cx + Math.cos(ang) * R * rf + Math.cos(ang) * 6, cz + Math.sin(ang) * R * rf + Math.sin(ang) * 6], h = (hd * Math.PI) / 180 + ang + Math.PI / 2
    const [l, w, ht] = K.CARAVAN_SIZE, cs = Math.cos(h), sn = Math.sin(h)
    const q = ([a, b]: P2): P2 => [c[0] + a * cs - b * sn, c[1] + a * sn + b * cs]
    T.prism([q([-l / 2, -w / 2]), q([l / 2, -w / 2]), q([l / 2, w / 2]), q([-l / 2, w / 2])], 0.5, ht, hex(K.CARAVAN_C[i % K.CARAVAN_C.length]), hex('#bfc3c5'))
  })
}
