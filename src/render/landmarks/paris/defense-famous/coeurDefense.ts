/**
 * CŒUR DÉFENSE (Jean-Paul Viguier, 2001; 161 m above the street, 39 storeys), La Défense: Europe's largest office
 * complex. Two lens-plan towers (A east, B west: OSM way 229148698's building:part rings 1158726203/204, local pbf)
 * stand on a 36 m block whose three south fingers end in half-rounds (relation 3071676's outline). Tops are the IGN
 * LiDAR HD MNS (tools/ign-mns.ts, 2026-11-16) above the dalle (MNS ~4.5 m over the 55.95 NGF ground): tower roofs
 * 149 with plant to 154, block 36.5. The skin (Commons "Cœur Défense and buildings around it, La Défense, Paris.jpg"):
 * pale cream-silver aluminium spandrels banded with grey-green glass at every floor, a deeper cornice band at the top;
 * the block below is darker grey glass in a grid.
 * Coordinates are metres east/north of (48.89083, 2.24427), registered on fit.ring by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { ccwEN, hull, mix, registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS = surfaceTag('glass')
const METAL = surfaceTag('metal')

// tunables
const CD_PANEL = '#e8dcbc'       // pale cream-silver spandrel
const CD_PANEL_SHADE = '#cbbf9f' // the spandrel on the shaded side
const CD_GLASS = '#8a9088'       // grey-green window band
const CD_GLASS_SKY = '#b3bab2'   // the window band catching sky
const CD_CORNICE = '#e8e4d6'
const CD_BLOCK_GLASS = '#5d6a72' // the lower block's grid glass
const CD_BLOCK_FRAME = '#c9ccc9'
const CD_ROOF = '#8a8a86'
const CD_PLANT = '#a3a39c'
const CD_FLOOR = 3.75            // storey height, m
const CD_WIN = 1.25               // window band height within a storey
const CD_FOOT = -6               // walls run below the dalle so the foot never floats
const CD_SKY_DIR: P2 = [0.3, -0.95]
const TOWER_TOP = 149
const PLANT_TOP = 154
const CORNICE_H = 4
const BLOCK_TOP = 36.5

const TOWER_A: P2[] = [[-42.4, 26.6], [-42.2, 25.2], [-41.8, 23.6], [-41.0, 21.8], [-40.0, 20.2], [-38.5, 18.5], [-37.0, 17.3], [-34.1, 16.0], [-31.7, 15.5], [-29.6, 15.4], [-28.2, 15.6], [-25.9, 16.2], [-24.4, 16.9], [-22.7, 18.0], [-21.4, 19.3], [-20.2, 21.0], [-10.6, 40.6], [-9.5, 42.9], [-7.8, 46.4], [4.5, 72.0], [5.0, 73.7], [5.2, 75.7], [5.0, 77.4], [4.5, 79.6], [4.0, 81.0], [2.9, 82.8], [0.7, 85.1], [-1.3, 86.5], [-3.0, 87.2], [-5.3, 87.7], [-7.2, 87.8], [-9.1, 87.6], [-10.8, 87.2], [-12.0, 86.7], [-13.8, 85.6], [-15.1, 84.6], [-16.4, 83.0], [-29.3, 56.8], [-31.4, 52.3], [-37.0, 41.1], [-41.3, 32.2], [-42.0, 30.3], [-42.3, 28.7]]
const TOWER_B: P2[] = [[-87.5, 18.9], [-87.5, 16.9], [-87.1, 14.7], [-86.6, 13.5], [-85.7, 11.6], [-84.4, 9.8], [-82.9, 8.6], [-81.7, 7.7], [-79.1, 6.5], [-76.6, 6.1], [-74.0, 6.1], [-71.8, 6.7], [-69.3, 7.8], [-68.5, 8.4], [-67.2, 9.5], [-66.6, 10.3], [-64.2, 14.0], [-48.6, 46.6], [-43.0, 58.2], [-41.0, 62.4], [-40.3, 63.6], [-39.8, 65.7], [-39.7, 68.0], [-40.0, 70.3], [-40.7, 72.3], [-41.6, 74.0], [-43.2, 75.9], [-44.7, 77.2], [-46.5, 78.3], [-48.5, 79.0], [-50.4, 79.3], [-52.3, 79.4], [-54.4, 79.1], [-55.8, 78.7], [-57.7, 77.8], [-59.4, 76.7], [-60.9, 75.1], [-62.3, 73.0], [-62.5, 72.7], [-86.7, 22.6], [-87.3, 20.8]]
/** relation 3071676's outline: the spine and the three south fingers (small entrance bumps dropped) */
const BLOCK: P2[] = [[-67.2, 9.5], [-51.4, -1.0], [-58.6, -16.1], [-59.1, -18.0], [-59.2, -20.4], [-58.5, -23.0], [-57.3, -25.2], [-55.5, -26.9], [-53.4, -28.1], [-51.2, -28.7], [-48.6, -28.7], [-46.2, -28.1], [-44.3, -27.0], [-42.7, -25.5], [-41.8, -24.2], [-34.5, -9.1], [-24.5, -13.8], [-18.1, -16.9], [-25.5, -32.1], [-25.8, -33.7], [-26.0, -35.8], [-25.6, -38.0], [-24.7, -40.2], [-23.0, -42.2], [-22.1, -43.0], [-20.6, -43.9], [-18.1, -44.6], [-15.5, -44.7], [-13.3, -44.1], [-11.0, -42.9], [-9.7, -41.7], [-8.6, -40.2], [-1.2, -24.9], [15.2, -32.8], [8.0, -47.7], [7.4, -50.2], [7.3, -51.8], [7.6, -53.6], [8.7, -56.1], [10.3, -58.1], [12.4, -59.5], [15.0, -60.4], [17.2, -60.5], [19.8, -60.0], [22.1, -58.8], [23.8, -57.2], [24.8, -55.8], [32.0, -40.8], [36.7, -31.2], [48.9, -5.8], [67.0, 31.6], [42.1, 43.5], [34.7, 26.4], [33.0, 22.6], [24.0, 26.7], [25.7, 30.4], [33.7, 47.6], [8.9, 59.4], [0.7, 42.4], [-1.0, 38.8], [-9.5, 42.9], [-10.6, 40.6], [-20.2, 21.0], [-21.4, 19.3], [-22.7, 18.0], [-24.4, 16.9], [-25.9, 16.2], [-28.2, 15.6], [-29.6, 15.4], [-31.7, 15.5], [-34.1, 16.0], [-37.0, 17.3], [-38.5, 18.5], [-40.0, 20.2], [-41.0, 21.8], [-41.8, 23.6], [-42.2, 25.2], [-42.4, 26.6], [-42.3, 28.7], [-42.0, 30.3], [-41.3, 32.2], [-37.0, 41.1], [-48.6, 46.6], [-64.2, 14.0], [-66.6, 10.3]]

const hullArea = (r: P2[]): number => { const h = hull(r); let A = 0; for (let i = 0; i < h.length; i++) { const p = h[i], q = h[(i + 1) % h.length]; A += p[0] * q[1] - q[0] * p[1] }; return Math.abs(A) / 2 }
/** a plant box inset along a tower's long axis (the middle 60%, 55% of the width) */
const plantOf = (r: P2[]): P2[] => {
  const c = r.reduce((s, p) => [s[0] + p[0] / r.length, s[1] + p[1] / r.length] as P2, [0, 0] as P2)
  return r.map((p) => [c[0] + (p[0] - c[0]) * 0.55, c[1] + (p[1] - c[1]) * 0.55] as P2)
}

export function coeurDefense(out: MeshBuilder, fit: Fit): void {
  // the loader hands the relation outline, the towers' outline, or the hull of everything: register on the nearest
  const all = [...BLOCK, ...TOWER_A, ...TOWER_B]
  const cands = [all, BLOCK, [...TOWER_A, ...TOWER_B], TOWER_A, TOWER_B]
  let reg: P2[] = all
  if (fit.ring && fit.ring.length >= 3) {
    const g = hullArea(fit.ring.map((q) => [q.x, q.z] as P2))
    reg = cands.reduce((b, c) => (Math.abs(hullArea(c) - g) < Math.abs(hullArea(b) - g) ? c : b), all)
  }
  const F = registerRing(reg, fit), T = tools(out, F)

  const skin = (ring: P2[], top: number, wall: (f: number) => Rgb, band: ((f: number) => Rgb) | null, cornice: boolean): void => {
    const r = ccwEN(ring)
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length]
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (L < 0.2) continue
      const ne: P2 = [(b[1] - a[1]) / L, -(b[0] - a[0]) / L]
      const n = F.n([ne[0], ne[1], 0])
      const f = 0.5 + 0.5 * (ne[0] * CD_SKY_DIR[0] + ne[1] * CD_SKY_DIR[1])
      const at = (p: P2, h: number, o: number): V3 => F.p(p[0] + ne[0] * o, p[1] + ne[1] * o, h)
      const q = (y0: number, y1: number, o: number, c: Rgb, tag: number): void => out.quad([at(a, y0, o), at(b, y0, o), at(b, y1, o), at(a, y1, o)], n, UV, c, tag)
      q(CD_FOOT, top, 0, wall(f), METAL)
      if (band) for (let y = CD_FLOOR * 1.4; y < top - (cornice ? CORNICE_H : 1); y += CD_FLOOR) q(y, y + CD_WIN, 0.06, band(f), GLASS)
      if (cornice) q(top - CORNICE_H, top + 0.6, 0.35, hex(CD_CORNICE), METAL)
    }
  }
  const panel = (f: number): Rgb => mix(hex(CD_PANEL_SHADE), hex(CD_PANEL), f)
  const glass = (f: number): Rgb => mix(hex(CD_GLASS), hex(CD_GLASS_SKY), f)
  for (const t of [TOWER_A, TOWER_B]) {
    skin(t, TOWER_TOP, panel, glass, true)
    T.cap(t, TOWER_TOP + 0.6, hex(CD_ROOF))
    const p = plantOf(t)
    skin(p, PLANT_TOP, () => hex(CD_PLANT), null, false)
    T.cap(p, PLANT_TOP, hex(CD_PLANT))
  }
  // the block: grid glass with pale floor lines
  const bg = hex(CD_BLOCK_GLASS), bs = hex(CD_GLASS_SKY)
  skin(BLOCK, BLOCK_TOP, (f) => mix(bg, bs, 0.35 * f), () => hex(CD_BLOCK_FRAME), false)
  T.cap(BLOCK, BLOCK_TOP, hex(CD_ROOF))
}
