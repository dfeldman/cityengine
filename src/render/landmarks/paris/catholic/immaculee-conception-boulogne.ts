/**
 * ÉGLISE DE L'IMMACULÉE-CONCEPTION (63 rue du Dôme, Boulogne-Billancourt; OSM relation/3926538). Maurice Grandjean's
 * church of 1965-68: one trapezoidal hall under a great roof that sags between a high front rim and a rear crest (the
 * "voûte inversée", after Ronchamp), carried on pillars so the walls are free. From the street: a concrete front with a
 * dark glazed band under the roof's deep pink-purple soffit ribbed in white, red doors below, and a tall white cross
 * standing in the forecourt. Heights from IGN LiDAR MNS (front rim 15.7 m, trough 11 m, rear crest 13 m, rear annex
 * 7 m, east wing 5 m); photo: Commons "Église de l'Immaculée-Conception de Boulogne-Billancourt" (frwiki infobox).
 * Notes docs/landmarks/MODEL-IMMACULEE-BOULOGNE.md, lidar docs/landmarks/refs/immaculee-boulogne/.
 * Frame: metres east/north of ORIGIN (the OSM outline's rough centre); u along the front (AXIS_DEG), v toward the street.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres) ──────────────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 20             // the front's direction, anticlockwise from east; v = +110° is toward rue du Dôme
const V_FRONT = 23, V_REAR = -12            // the hall's front and rear walls
const W_FRONT = 14, W_REAR = 8.5            // half-widths there (the plan is a trapezoid, narrower at the back)
const ROOF_T = 0.7, OVER_FRONT = 5.5, RIM_RISE = 0.3, RIM_N = 28, OVER_SIDE = 0.9, OVER_REAR = 0.6
/** the roof's underside height along v: high front rim, trough, a rear crest */
const PROFILE: [number, number][] = [[23, 15.0], [18, 14.3], [12, 13.0], [6, 11.6], [1, 10.4], [-4, 12.1], [-9, 10.8], [-12, 10.2]]
const GLASS_Y0 = 5.6, PIER_STEP = 3.6, PIER_W = 0.9, DOOR_W = 2.2, DOOR_H = 3.2
const ANNEX = { u0: -16, u1: 15, v0: -24, v1: -14, h: 7 }          // the rear parish block
const WING = { u0: 14, u1: 19.5, v0: -12, v1: 8, h: 4.8 }          // the low east wing
const CROSS = { u: 4, v: V_FRONT + 4.2, h: 19, arm: 7.2, armY: 14.8, post: 0.8 }
const CONCRETE = '#b9b19d', ROOFTOP = '#8c8c88', UNDER = '#a14d80', GLASS = '#3b4658', RIB = '#f1efe9', DOORS = '#a3281f', CROSSC = '#f3f1ea', ANNEXC = '#cbc4b1'
const ORIGIN: P2 = [7, -18]
const OSM: P2[] = [[-17.1, -1.3], [-15.3, -4.3], [-12.7, -8.8], [-13.4, -9.3], [-11.9, -11.8], [-11.1, -11.4], [-7.2, -17.9], [-7.9, -18.4], [-6.4, -20.8], [-5.7, -20.4], [-3.1, -24.5], [-4.8, -25.6], [-2.1, -29.9], [-0.5, -29], [0.2, -30.2], [2, -29.5], [3.8, -34.6], [-2.7, -36.8], [0.3, -45.5], [31.1, -34.8], [28.9, -28.6], [28.5, -28.6], [23.8, -14.9], [20.4, -4.8], [18, 2.2], [15.5, 1.4], [14.8, 6.7], [14.4, 9.9], [13.8, 9.9], [14.2, 6.5], [10, 4.9], [3.5, 6.1], [-11.1, 1.1], [-9.9, -2.3], [-14.6, -4.1], [-16.6, -1]]
export const RING: P2[] = OSM.map(([e, n]) => [e - ORIGIN[0], n - ORIGIN[1]] as P2)

const under = (v: number): number => {
  if (v >= PROFILE[0][0]) return PROFILE[0][1]
  for (let i = 0; i + 1 < PROFILE.length; i++) {
    const [v0, h0] = PROFILE[i], [v1, h1] = PROFILE[i + 1]
    if (v <= v0 && v >= v1) return h1 + ((h0 - h1) * (v - v1)) / (v0 - v1)
  }
  return PROFILE[PROFILE.length - 1][1]
}
const halfW = (v: number): number => W_REAR + ((W_FRONT - W_REAR) * (v - V_REAR)) / (V_FRONT - V_REAR)

export function immaculeeConceptionBoulogne(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const concrete: Rgb = hex(CONCRETE), rooftop: Rgb = hex(ROOFTOP), soffit: Rgb = hex(UNDER), glass: Rgb = hex(GLASS), rib: Rgb = hex(RIB), doors: Rgb = hex(DOORS), crossC: Rgb = hex(CROSSC), annexC: Rgb = hex(ANNEXC)
  const { en, P, solid, decal } = churchKit({ axisDeg: AXIS_DEG, T, roofC: rooftop, stone: concrete, trim: concrete })
  const UP: V3 = [0, 0, 1], DOWN: V3 = [0, 0, -1]
  void en

  // ── low blocks: rear parish annex and east wing, flat roofs with a parapet ──
  for (const b of [ANNEX, WING]) {
    solid(b.u0, b.u1, b.v0, b.v1, 0, b.h, annexC, shade(annexC, 0.8), 2)
    solid(b.u0 - 0.1, b.u1 + 0.1, b.v0 - 0.1, b.v1 + 0.1, b.h - 0.1, b.h + 0.4, shade(annexC, 0.92), shade(annexC, 0.7), 0)
  }
  for (let u = ANNEX.u0 + 2.5; u < ANNEX.u1 - 1; u += 3.2) decal(u, ANNEX.v1, 0, 1, 0.04, [[-0.6, 2.2], [0.6, 2.2], [0.6, 5.2], [-0.6, 5.2]], glass)

  // ── the hall: side and rear walls up to the soffit, strip by strip along v ──
  const vs: number[] = []
  for (let v = V_FRONT; v > V_REAR + 0.01; v -= 2) vs.push(v)
  vs.push(V_REAR)
  for (let i = 0; i + 1 < vs.length; i++) {
    const va = vs[i], vb = vs[i + 1], ha = under(va), hb = under(vb), wa = halfW(va), wb = halfW(vb)
    for (const s of [-1, 1] as const) {
      T.poly([P(s * wa, va, 0), P(s * wb, vb, 0), P(s * wb, vb, hb), P(s * wa, va, ha)], concrete, [...en(s, 0), 0] as V3)
      // rim of the roof slab
      T.poly([P(s * (wa + OVER_SIDE), va, ha - 0.1), P(s * (wb + OVER_SIDE), vb, hb - 0.1), P(s * (wb + OVER_SIDE), vb, hb + ROOF_T), P(s * (wa + OVER_SIDE), va, ha + ROOF_T)], shade(rooftop, 1.05), [...en(s, 0), 0] as V3)
      // narrow clerestory slits between piers
      if (i % 2 === 0) {
        const t = 0.5, um = s * (wa + (wb - wa) * t), vm = va + (vb - va) * t, hm = under(vm)
        const nu = en(s, 0)
        T.poly([P(um, vm - 0.5, hm - 3.6), P(um, vm + 0.5, hm - 3.6), P(um, vm + 0.5, hm - 0.7), P(um, vm - 0.5, hm - 0.7)].map(([e, n, h]) => [e + nu[0] * 0.04, n + nu[1] * 0.04, h] as V3), glass, [nu[0], nu[1], 0] as V3)
      }
    }
    // roof: top, and the soffit (visible from below at the overhangs)
    const wa2 = wa + OVER_SIDE, wb2 = wb + OVER_SIDE, vTop = va, vBot = i + 2 === vs.length ? vb - OVER_REAR : vb
    const ha2 = ha, hb2 = hb
    T.poly([P(-wa2, vTop, ha2 + ROOF_T), P(wa2, vTop, ha2 + ROOF_T), P(wb2, vBot, hb2 + ROOF_T), P(-wb2, vBot, hb2 + ROOF_T)], rooftop, UP)
    T.poly([P(-wa2, vTop, ha2), P(wa2, vTop, ha2), P(wb2, vBot, hb2), P(-wb2, vBot, hb2)], soffit, DOWN)
  }
  // rear wall
  T.poly([P(-W_REAR, V_REAR, 0), P(W_REAR, V_REAR, 0), P(W_REAR, V_REAR, under(V_REAR)), P(-W_REAR, V_REAR, under(V_REAR))], concrete, [...en(0, -1), 0] as V3)

  // ── the front: concrete piers, a dark glazed band under the soffit, red doors, the rim ──
  const hF = under(V_FRONT)
  // the sloping front fascia of the slab between wall top and projecting rim, plus concrete beneath the glass
  const wallFace = (u0: number, u1: number, y0: number, y1: number, col: Rgb, off = 0.03): void => decal(0, V_FRONT, 0, 1, off, [[-u0, y0], [-u1, y0], [-u1, y1], [-u0, y1]], col)
  T.poly([P(-W_FRONT, V_FRONT, 0), P(W_FRONT, V_FRONT, 0), P(W_FRONT, V_FRONT, hF), P(-W_FRONT, V_FRONT, hF)], concrete, [...en(0, 1), 0] as V3)
  wallFace(-W_FRONT + 0.6, W_FRONT - 0.6, GLASS_Y0, hF - 0.9, glass, 0.06)
  for (let u = -W_FRONT; u <= W_FRONT + 0.01; u += PIER_STEP) wallFace(u - PIER_W / 2, u + PIER_W / 2, GLASS_Y0, hF - 0.9, concrete, 0.1)
  wallFace(-W_FRONT + 0.6, W_FRONT - 0.6, hF - 1.2, hF - 0.9, shade(concrete, 0.85), 0.1)
  for (const du of [-5.5, -2.8, 2.2, 5.0]) wallFace(du - DOOR_W / 2, du + DOOR_W / 2, 0.1, DOOR_H, doors, 0.07)
  for (const du of [-9.5, 9.5]) wallFace(du - 1.2, du + 1.2, 1.4, 3.4, glass, 0.07)

  // ── the front overhang: the soffit runs out past the wall as a half-ellipse in plan, rising a little, with radial white ribs ──
  const rimV = (u: number): number => V_FRONT + OVER_FRONT * Math.sqrt(Math.max(0, 1 - (u / (W_FRONT + OVER_SIDE)) ** 2))
  const rimH = (v: number): number => hF + RIM_RISE * (v - V_FRONT)
  const WR = W_FRONT + OVER_SIDE
  for (let k = 0; k < RIM_N; k++) {
    const u0 = -WR + (2 * WR * k) / RIM_N, u1 = -WR + (2 * WR * (k + 1)) / RIM_N
    const a0: [number, number] = [u0, rimV(u0)], a1: [number, number] = [u1, rimV(u1)]
    const hi = (u: number): number => (Math.abs(u) <= W_FRONT ? V_FRONT : V_FRONT + (rimV(u) - V_FRONT) * 0)
    const i0: [number, number] = [u0, hi(u0)], i1: [number, number] = [u1, hi(u1)]
    T.poly([P(i0[0], i0[1], hF), P(i1[0], i1[1], hF), P(a1[0], a1[1], rimH(a1[1])), P(a0[0], a0[1], rimH(a0[1]))], soffit, DOWN)
    T.poly([P(i0[0], i0[1], hF + ROOF_T), P(i1[0], i1[1], hF + ROOF_T), P(a1[0], a1[1], rimH(a1[1]) + ROOF_T), P(a0[0], a0[1], rimH(a0[1]) + ROOF_T)], rooftop, UP)
    T.poly([P(a0[0], a0[1], rimH(a0[1])), P(a1[0], a1[1], rimH(a1[1])), P(a1[0], a1[1], rimH(a1[1]) + ROOF_T), P(a0[0], a0[1], rimH(a0[1]) + ROOF_T)], shade(rooftop, 1.12), [(a0[0] + a1[0]) / 2 * 0, 1, 0].length ? [...en(0, 1), 0] as V3 : DOWN)
    // radial rib from the wall line to the rim, at every second segment
    if (k % 2 === 0) {
      const um = (u0 + u1) / 2, vm = rimV(um), w = 0.22
      T.poly([P(um - w, V_FRONT, hF - 0.04), P(um + w, V_FRONT, hF - 0.04), P(um + w, vm, rimH(vm) - 0.04), P(um - w, vm, rimH(vm) - 0.04)], rib, DOWN)
    }
  }

  // ── the white cross in the forecourt: a tall post and arm on a plinth ──
  const { u: cu, v: cv, h: ch, arm, armY, post } = CROSS
  solid(cu - 1.0, cu + 1.0, cv - 1.0, cv + 1.0, 0, 0.8, shade(crossC, 0.9), shade(crossC, 0.85), 0)
  solid(cu - post / 2, cu + post / 2, cv - post / 2, cv + post / 2, 0.8, ch, crossC, crossC, 0)
  solid(cu - arm / 2, cu + arm / 2, cv - post / 2, cv + post / 2, armY, armY + post, crossC, crossC, 0)
}
