/**
 * ÉGLISE SAINT-JEAN-DES-DEUX-MOULINS (185-187 rue du Château-des-Rentiers, 13e; OSM way/962298895 the church part and
 * way/79083142 the 11-level apartment slab whose outline wraps it). A 1960s parish church built into the foot of a
 * housing slab: a low flat-roofed white-rendered hall (7 m by IGN LiDAR) with rows of small projecting window boxes along
 * its long side, a Marian mosaic on the end wall, and a white bell tower with an open bell bay and a cross, all behind a
 * hedge and green railings. The slab (33 m by LiDAR) is drawn too, since the entry replaces its outline.
 * Photos and lidar: docs/landmarks/refs/st-jean-deux-moulins/; notes docs/landmarks/MODEL-ST-JEAN-DEUX-MOULINS.md.
 * Frame: metres east/north of the church part's rough centre; u along the hall (AXIS_DEG from east), v across.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres) ──────────────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 27             // the hall's long axis, anticlockwise from east (parallel to the slab)
const HALL_H = 7, PARAPET_H = 0.55
const SLAB_H = 33, SLAB_BAY = 3.2, SLAB_FLOOR = 3, SLAB_FLOORS = 11, WIN_W = 1.3, WIN_H = 1.4
const TOWER_C: P2 = [4, -2], TOWER_HALF = 2.7, TOWER_H = 15, BELL_H = 11.5, CROSS_H = 6.2   // tower centre (E,N), size, bell bay, gold cross
const BOX_V = -7.0, BOX_U0 = -19, BOX_U1 = -2, BOX_STEP = 1.55, BOX_Y0 = 2.7, BOX_Y1 = 5.1    // window boxes on the long side
const RENDER = '#e8e4d8', TOWER = '#ebe8de', SLABC = '#d6cbb6', PANEL = '#a68a72', GLASS = '#4a5668', DARK = '#2a2b2e', CROSS = '#d6b13a', WOOD = '#5a3d2b', MOSAIC = '#8fb2d4'
const HALL_ROOF = '#8a8882', SLAB_ROOF = '#9b958a'
const ORIGIN: P2 = [24, 10]     // the OSM frame of the first pass (east/north of 48.8308, 2.3605) → this builder's centre

// OSM way/962298895 (the church) and the slab's own outline (way/79083142 without the church), first-pass metres
const CHURCH_OSM: P2[] = [[1.7, 5.2], [7.4, -6.1], [18.4, -0.5], [19, -1.7], [35.1, 6.4], [25.5, 25.3], [24.4, 24.8], [23.8, 26], [9.3, 18.6], [11.3, 14.8], [4.8, 11.5], [6.7, 7.8]]
const SLAB_OSM: P2[] = [[-80.9, -51], [7.4, -6.1], [1.7, 5.2], [-0.2, 9], [-23.8, -3], [-21.8, -6.8], [-26.8, -9.3], [-28.7, -5.6], [-52.2, -17.6], [-50.3, -21.3], [-55.3, -23.8], [-57.2, -20.1], [-88.4, -36], [-84.9, -43], [-83.4, -45.9]]
const loc = ([e, n]: P2): P2 => [e - ORIGIN[0], n - ORIGIN[1]]
const CHURCH = CHURCH_OSM.map(loc), SLAB = SLAB_OSM.map(loc)
/** the whole of way/79083142: the slab with the church's bay folded in (the outline the loader fits) */
export const RING: P2[] = [[-80.9, -51], [7.4, -6.1], [18.4, -0.5], [19, -1.7], [35.1, 6.4], [25.5, 25.3], [24.4, 24.8], [23.8, 26], [9.3, 18.6], [11.3, 14.8], [4.8, 11.5], [6.7, 7.8], [1.7, 5.2], [-0.2, 9], [-23.8, -3], [-21.8, -6.8], [-26.8, -9.3], [-28.7, -5.6], [-52.2, -17.6], [-50.3, -21.3], [-55.3, -23.8], [-57.2, -20.1], [-88.4, -36], [-84.9, -43], [-83.4, -45.9]].map(([e, n]) => loc([e, n]))

export function saintJeanDeuxMoulins(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const render: Rgb = hex(RENDER), tower: Rgb = hex(TOWER), slabC: Rgb = hex(SLABC), panel: Rgb = hex(PANEL), glass: Rgb = hex(GLASS), dark: Rgb = hex(DARK), cross: Rgb = hex(CROSS), wood: Rgb = hex(WOOD), mosaic: Rgb = hex(MOSAIC)
  const { en, P, solid, decal } = churchKit({ axisDeg: AXIS_DEG, T, roofC: render, stone: render, trim: render })
  const A = (AXIS_DEG * Math.PI) / 180, CA = Math.cos(A), SA = Math.sin(A)
  const uv = ([e, n]: P2): P2 => [e * CA + n * SA, -e * SA + n * CA]
  const rectc = (cu: number, cv: number, hu: number, hv: number, y0: number, y1: number, side: Rgb, top: Rgb | null = side): void => solid(cu - hu, cu + hu, cv - hv, cv + hv, y0, y1, side, top, 2)

  // ── the hall: a flat-roofed block on the church part's outline, with a parapet band ──
  T.prism(CHURCH, 0, HALL_H, render, hex(HALL_ROOF), 2)
  T.prism(CHURCH.map(([e, n]) => [e * 1.015, n * 1.015] as P2), HALL_H - 0.1, HALL_H + PARAPET_H, shade(render, 1.02), shade(render, 0.9), 0)

  // ── window boxes along the long side: small projecting boxes with a dark glazed face ──
  for (let u = BOX_U0; u <= BOX_U1; u += BOX_STEP) {
    solid(u - 0.45, u + 0.45, BOX_V - 0.5, BOX_V + 0.1, BOX_Y0, BOX_Y1, shade(render, 0.88), shade(render, 0.8), 0)
    decal(u, BOX_V - 0.5, 0, -1, 0.03, [[-0.3, BOX_Y0 + 0.4], [0.3, BOX_Y0 + 0.4], [0.3, BOX_Y1 - 0.4], [-0.3, BOX_Y1 - 0.4]], glass)
  }

  // ── bell tower (flush with the hall's end), open bell bay and cross on each long face ──
  const [tu, tv] = uv(loc([TOWER_C[0] + ORIGIN[0], TOWER_C[1] + ORIGIN[1]]))
  rectc(tu, tv, TOWER_HALF, TOWER_HALF, 0, TOWER_H, tower, shade(tower, 0.9))
  solid(tu - TOWER_HALF - 0.2, tu + TOWER_HALF + 0.2, tv - TOWER_HALF - 0.2, tv + TOWER_HALF + 0.2, TOWER_H - 0.4, TOWER_H, shade(tower, 0.95), shade(tower, 0.88), 0)
  for (const [nu, nv] of [[0, -1], [1, 0]] as [number, number][]) {
    const wu = tu + nu * TOWER_HALF, wv = tv + nv * TOWER_HALF
    decal(wu, wv, nu, nv, 0.04, [[-0.75, BELL_H], [0.75, BELL_H], [0.75, BELL_H + 2.2], [-0.75, BELL_H + 2.2]], dark)
    decal(wu, wv, nu, nv, 0.06, [[-0.07, BELL_H + 0.2], [0.07, BELL_H + 0.2], [0.07, BELL_H + 1.8], [-0.07, BELL_H + 1.8]], shade(dark, 1.8))
    decal(wu, wv, nu, nv, 0.05, [[-0.12, 3.4], [0.12, 3.4], [0.12, 7.4], [-0.12, 7.4]], wood)       // the wall cross
    decal(wu, wv, nu, nv, 0.05, [[-0.9, 5.9], [0.9, 5.9], [0.9, 6.2], [-0.9, 6.2]], wood)
  }
  // the gold cross on the tower, standing in a plane across the tower (faces ±u)
  const cx = tu, cz = tv
  for (const s of [-1, 1] as const) {
    T.poly([P(cx + 0.02 * s, cz - 0.15, TOWER_H), P(cx + 0.02 * s, cz + 0.15, TOWER_H), P(cx + 0.02 * s, cz + 0.15, TOWER_H + CROSS_H), P(cx + 0.02 * s, cz - 0.15, TOWER_H + CROSS_H)], cross, [...en(s, 0), 0] as V3)
    T.poly([P(cx + 0.02 * s, cz - 1.6, TOWER_H + CROSS_H * 0.62), P(cx + 0.02 * s, cz + 1.6, TOWER_H + CROSS_H * 0.62), P(cx + 0.02 * s, cz + 1.6, TOWER_H + CROSS_H * 0.62 + 0.3), P(cx + 0.02 * s, cz - 1.6, TOWER_H + CROSS_H * 0.62 + 0.3)], cross, [...en(s, 0), 0] as V3)
  }

  // ── end wall: the Marian mosaic (a blue and white figure) beside the tower ──
  const [eu] = uv(loc([35.1, 6.4]))
  const ev = tv + 7.0
  const fig: [number, number][] = [[-0.5, 1.0], [0.9, 1.0], [1.2, 2.2], [1.0, 3.8], [0.45, 5.1], [0.1, 5.5], [-0.35, 5.1], [-0.7, 3.8], [-1.0, 2.2]]
  decal(eu - 1.2, ev, 1, 0, 0.05, fig, mosaic)
  void en

  // ── the slab: the tall housing block on its own outline, a window grid on the long faces ──
  T.prism(SLAB, 0, SLAB_H, slabC, hex(SLAB_ROOF), 3)
  const sc = SLAB.reduce((a, [e, n]) => [a[0] + e / SLAB.length, a[1] + n / SLAB.length], [0, 0])
  for (let i = 0; i < SLAB.length; i++) {
    const a = SLAB[i], b = SLAB[(i + 1) % SLAB.length]
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (L < 8) continue
    const d: P2 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]
    let nrm: P2 = [d[1], -d[0]]
    if ((a[0] - sc[0]) * nrm[0] + (a[1] - sc[1]) * nrm[1] < 0) nrm = [-nrm[0], -nrm[1]]
    const nb = Math.floor(L / SLAB_BAY)
    for (let k = 0; k < nb; k++) {
      const t0 = (k + 0.5) * (L / nb)
      const base: P2 = [a[0] + d[0] * t0 + nrm[0] * 0.05, a[1] + d[1] * t0 + nrm[1] * 0.05]
      for (let f = 0; f < SLAB_FLOORS; f++) {
        const y = 1.1 + f * SLAB_FLOOR, h = WIN_H, w = WIN_W / 2
        const q = (s: number, hh: number): V3 => [base[0] + d[0] * s, base[1] + d[1] * s, hh]
        T.poly([q(-w, y), q(w, y), q(w, y + h), q(-w, y + h)], glass, [nrm[0], nrm[1], 0])
        if ((k + f) % 3 === 0) T.poly([q(-w - 0.25, y + h), q(w + 0.25, y + h), q(w + 0.25, y + h + 0.9), q(-w - 0.25, y + h + 0.9)], panel, [nrm[0], nrm[1], 0])
      }
    }
  }
}
