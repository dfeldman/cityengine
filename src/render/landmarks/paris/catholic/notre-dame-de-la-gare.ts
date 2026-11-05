/**
 * ÉGLISE NOTRE-DAME-DE-LA-GARE (place Jeanne-d'Arc, 13e; OSM way/79084116; Claude Naissant, 1847-59). A neo-Romanesque
 * parish church of pale limestone on a basilica plan: a round-arched nave under a low slate gable (ridge 22 m by IGN
 * LiDAR) between lean-to aisles (~11 m), low side chapels (~8 m) at mid-length, a half-octagon apse ringed by a low
 * ambulatory, and a west front with a round portal, a rose, a clock and a belfry tower with a slate spire (35 m).
 * Photos and lidar: docs/landmarks/refs/notre-dame-de-la-gare/; notes docs/landmarks/MODEL-NOTRE-DAME-DE-LA-GARE.md.
 * Frame: metres east/north of the footprint's centre, shifted so the nave axis is v = 0; u runs along the nave from the
 * west front (U_FRONT) toward the apse, AXIS_DEG anticlockwise from east.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism as cyl } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────
const AXIS_DEG = -48                    // west front toward the apse, degrees anticlockwise from east
const U_FRONT = -29.3, NAVE_U1 = 14.1   // front wall; end of nave and aisles (the apse starts here)
const NAVE_V = 6, AISLE_V = 11.45       // nave half-width, outer aisle wall
const AISLE_EAVE = 9.6, AISLE_HI = 12.2 // aisle wall top, lean-to's top against the clerestory
const EAVE_H = 17.6, RIDGE_H = 22       // nave eaves and ridge
const APSE_R = 6, APSE_N = 8, AMB_R = 11.2, AMB_H = 10.4   // half-octagon radius, ambulatory outer radius and height
const CH_U0 = -5.3, CH_U1 = 9.2, CH_H = 8, CH_V1 = 15.4, CH_V2 = 18.95, CH_STEP_U = -0.6   // side chapels
const TW_U0 = U_FRONT, TW_U1 = -23.3, TW_HW = 3.25, TW_BASE = 15, BELF0 = 22.4, TW_H = 26.8, SP_H = 35, CROSS_H = 38
const BAY = 5.43
const STONE = '#cfc3a4', TRIM = '#e2d8bb', ROOF = '#4f545e', SPIRE = '#3d424b', GLASS = '#2f394e', DOOR = '#4a3426', DARK = '#26272c', CLOCK = '#ece4cc'

export const RING: P2[] = [[-10.6,28.9],[-15.1,25.7],[-27.3,14.9],[-28.4,13.9],[-24.7,10.4],[-12.1,-3.6],[-15.2,-6.4],[-12.1,-9.8],[-14.7,-12.2],[-8.1,-19.6],[-3.2,-15.1],[0.8,-18.2],[5.1,-20.9],[9.9,-19.5],[14.5,-19.7],[18.3,-15.3],[18.0,-12.0],[16.6,-9.9],[20.0,-7.2],[19.8,-4.9],[15.4,-0.1],[20.4,5.7],[13.7,13.1],[11.2,10.8],[8.1,14.2],[5.0,11.6],[2.4,14.5],[-3.7,21.2],[-7.0,24.9]]
const A = (AXIS_DEG * Math.PI) / 180, CA = Math.cos(A), SA = Math.sin(A)

export function notreDameDeLaGare(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK), clock: Rgb = hex(CLOCK)
  const { en, P, solid, decal, round, disc, cornice, ridge, gable } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 16, corniceH: 0.6, corniceOut: 0.25 })
  const win = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.04, round(t, y0 - 0.2, w + 0.5, h + 0.35), trim)
    decal(u, v, nu, nv, 0.09, round(t, y0, w, h), glass)
  }
  const u0 = U_FRONT + 0.4, nb = Math.round((NAVE_U1 - u0) / BAY), bl = (NAVE_U1 - u0) / nb
  const inChapel = (u: number): boolean => u > CH_U0 - 1.5 && u < CH_U1 + 1.5

  // ── aisles: walls, lean-to slate roofs, buttress piers, round windows ──
  for (const s of [-1, 1]) {
    solid(u0, NAVE_U1, s * NAVE_V, s * AISLE_V, 0, AISLE_EAVE, stone, null, 3)
    T.poly([P(u0 - 0.3, s * (AISLE_V + 0.3), AISLE_EAVE - 0.2), P(NAVE_U1 + 0.3, s * (AISLE_V + 0.3), AISLE_EAVE - 0.2), P(NAVE_U1 + 0.3, s * NAVE_V, AISLE_HI), P(u0 - 0.3, s * NAVE_V, AISLE_HI)], roofC, [...en(0, s), 0.8] as V3)
    cornice(u0, NAVE_U1, s > 0 ? AISLE_V - 0.1 : -AISLE_V, s > 0 ? AISLE_V : -AISLE_V + 0.1, AISLE_EAVE, 0.5, 0.2)
    for (let i = 0; i <= nb; i++) solid(u0 + i * bl - 0.4, u0 + i * bl + 0.4, s > 0 ? AISLE_V : -AISLE_V - 0.45, s > 0 ? AISLE_V + 0.45 : -AISLE_V, 0, AISLE_EAVE + 0.3, shade(stone, 0.97), trim, 2)
    for (let i = 0; i < nb; i++) {
      const u = u0 + (i + 0.5) * bl
      if (u < U_FRONT + 3 || inChapel(u)) continue
      win(u, s * AISLE_V, 0, s, 0, 3.0, 1.4, 4.4)
    }
  }
  // ── side chapels: low blocks at mid-length, stepped out, flat grey roofs ──
  for (const s of [-1, 1]) {
    for (const [a, b, v] of [[CH_U0, CH_STEP_U, CH_V1], [CH_STEP_U, CH_U1, CH_V2]] as [number, number, number][]) {
      solid(a, b, s > 0 ? AISLE_V - 0.2 : -v, s > 0 ? v : -AISLE_V + 0.2, 0, CH_H, stone, shade(roofC, 1.2), 3)
      cornice(a, b, s > 0 ? v - 0.1 : -v, s > 0 ? v : -v + 0.1, CH_H, 0.45, 0.15)
      for (let u = a + 1.8; u < b - 1; u += 3.2) win(u, s * v, 0, s, 0, 2.6, 1.3, 3.8)
    }
  }
  // ── nave: clerestory, slate gable roof, corbel frieze, round windows ──
  solid(U_FRONT, NAVE_U1, -NAVE_V, NAVE_V, AISLE_HI - 0.5, EAVE_H, stone, null, 3)
  cornice(U_FRONT, NAVE_U1, -NAVE_V, NAVE_V, EAVE_H, 0.55, 0.3)
  ridge('u', U_FRONT, NAVE_U1, 0, NAVE_V + 0.3, EAVE_H, RIDGE_H)
  for (let i = 0; i < nb; i++) {
    const u = u0 + (i + 0.5) * bl
    for (const s of [-1, 1]) {
      if (u > U_FRONT + 3) win(u, s * NAVE_V, 0, s, 0, 13.0, 1.5, 3.6)
      for (let k = -2; k <= 2; k++) decal(u, s * NAVE_V, 0, s, 0.05, round(k * 1.0, 15.9, 0.7, 1.1), shade(stone, 0.82))  // corbel arcade
    }
  }
  for (const s of [-1, 1]) for (let i = 0; i <= nb; i++) solid(u0 + i * bl - 0.3, u0 + i * bl + 0.3, s > 0 ? NAVE_V : -NAVE_V - 0.3, s > 0 ? NAVE_V + 0.3 : -NAVE_V, AISLE_HI - 0.4, EAVE_H, shade(stone, 0.97), trim, 2)

  // ── apse: half-octagon at the choir's end under a slate half-cone, ringed by the ambulatory ──
  const cu = NAVE_U1
  const half = (r: number, k: number): P2 => { const a = -Math.PI / 2 + (k / APSE_N) * Math.PI; return [cu + r * Math.cos(a), r * Math.sin(a)] }
  const apse: P2[] = []
  for (let k = 0; k <= APSE_N; k++) apse.push(half(APSE_R, k))
  T.prism(apse.map(([u, v]) => en(u, v)), AISLE_HI - 0.5, EAVE_H, stone, null, 3)
  const amb: P2[] = []
  for (let k = 0; k <= APSE_N; k++) amb.push(half(AMB_R, k))
  T.prism(amb.map(([u, v]) => en(u, v)), 0, AMB_H, stone, null, 3)
  for (let k = 0; k < APSE_N; k++) {
    const a = half(APSE_R + 0.3, k), b = half(APSE_R + 0.3, k + 1), mid = -Math.PI / 2 + ((k + 0.5) / APSE_N) * Math.PI
    T.poly([P(a[0], a[1], EAVE_H - 0.2), P(b[0], b[1], EAVE_H - 0.2), P(cu, 0, RIDGE_H)], roofC, [...en(Math.cos(mid), Math.sin(mid)), 0.8] as V3)
    const wa = half(AMB_R + 0.3, k), wb = half(AMB_R + 0.3, k + 1)
    T.poly([P(wa[0], wa[1], AMB_H - 0.2), P(wb[0], wb[1], AMB_H - 0.2), P(half(APSE_R, k + 1)[0], half(APSE_R, k + 1)[1], AISLE_HI), P(half(APSE_R, k)[0], half(APSE_R, k)[1], AISLE_HI)], roofC, [...en(Math.cos(mid), Math.sin(mid)), 0.8] as V3)
    win(cu + (APSE_R + 0.05) * Math.cos(mid), (APSE_R + 0.05) * Math.sin(mid), Math.cos(mid), Math.sin(mid), 0, 12.6, 1.1, 3.6)
    win(cu + (AMB_R + 0.05) * Math.cos(mid), (AMB_R + 0.05) * Math.sin(mid), Math.cos(mid), Math.sin(mid), 0, 3.4, 1.0, 3.6)
  }

  // ── west front: central gable with a round portal, rose and clock; aisle fronts; corner pilasters; steps ──
  const uf = U_FRONT
  gable('v', uf, 0, NAVE_V + 0.3, EAVE_H, RIDGE_H, -1)
  solid(uf - 0.1, uf + 0.5, -NAVE_V - 0.2, NAVE_V + 0.2, AISLE_HI - 0.5, EAVE_H, stone, null, 3)
  cornice(uf - 0.1, uf + 0.5, -NAVE_V - 0.3, NAVE_V + 0.3, EAVE_H, 0.5, 0.15)
  decal(uf, 0, -1, 0, 0.05, round(0, 0, 5.4, 8.4), trim); decal(uf, 0, -1, 0, 0.1, round(0, 0, 4.2, 7.7), shade(stone, 0.78)); decal(uf, 0, -1, 0, 0.14, round(0, 0, 3.0, 6.8), door)
  decal(uf, 0, -1, 0, 0.06, disc(0, 14.0, 2.1), trim); decal(uf, 0, -1, 0, 0.1, disc(0, 14.0, 1.7), glass)
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; decal(uf, 0, -1, 0, 0.13, [[-0.06 + 1.3 * Math.cos(a), 14 + 1.3 * Math.sin(a)], [0.06 + 1.3 * Math.cos(a), 14 + 1.3 * Math.sin(a)], [0.06, 14], [-0.06, 14]], trim) }
  win(uf, 0, -1, 0, -3.9, 9.4, 0.9, 3.0); win(uf, 0, -1, 0, 3.9, 9.4, 0.9, 3.0)
  for (let k = -4; k <= 4; k++) decal(uf, 0, -1, 0, 0.05, round(k * 1.1, 16.4, 0.7, 1.0), shade(stone, 0.82))
  for (const s of [-1, 1]) {
    const v = s * (NAVE_V + AISLE_V) / 2
    decal(uf, v, -1, 0, 0.05, round(0, 0, 2.3, 4.6), trim); decal(uf, v, -1, 0, 0.1, round(0, 0, 1.8, 4.2), door)
    win(uf, v, -1, 0, 0, 5.8, 1.1, 2.6)
    for (const vv of [s * (NAVE_V + 0.2), s * AISLE_V]) solid(uf - 0.5, uf + 0.5, vv - 0.55, vv + 0.55, 0, vv === s * AISLE_V ? AISLE_EAVE + 0.4 : EAVE_H, shade(stone, 0.97), trim, 2)
  }
  for (let k = 0; k < 4; k++) solid(uf - 0.5 - k * 0.5, uf + 0.2, -7 + k * 0.4, 7 - k * 0.4, 0, 0.45 - k * 0.1, shade(stone, 0.94), shade(stone, 0.9), 0)

  // ── belfry tower on the front: square shaft, clock, twin louvred arches, slate spire with dormers ──
  const tuc = (TW_U0 + TW_U1) / 2
  solid(TW_U0, TW_U1, -TW_HW, TW_HW, TW_BASE, TW_H, stone, null, 2.4)
  cornice(TW_U0, TW_U1, -TW_HW, TW_HW, TW_H, 0.8, 0.35)
  cornice(TW_U0, TW_U1, -TW_HW, TW_HW, BELF0, 0.45, 0.2)
  const faces: [number, number, number, number][] = [[tuc, -TW_HW, 0, -1], [tuc, TW_HW, 0, 1], [TW_U0, 0, -1, 0], [TW_U1, 0, 1, 0]]
  for (const [u, v, nu, nv] of faces) {
    if (nu !== 1) { decal(u, v, nu, nv, 0.14, disc(0, 20.0, 1.0), trim); decal(u, v, nu, nv, 0.18, disc(0, 20.0, 0.82), clock) }   // clock roundel above the gable
    for (const t of [-0.95, 0.95]) {
      decal(u, v, nu, nv, 0.05, round(t, BELF0 + 0.6, 1.7, 3.6), trim)
      decal(u, v, nu, nv, 0.1, round(t, BELF0 + 0.8, 1.3, 3.2), dark)
      for (let k = 0; k < 4; k++) decal(u, v, nu, nv, 0.13, [[t - 0.6, BELF0 + 1.0 + k * 0.6], [t + 0.6, BELF0 + 1.0 + k * 0.6], [t + 0.6, BELF0 + 1.1 + k * 0.6], [t - 0.6, BELF0 + 1.1 + k * 0.6]], shade(stone, 0.9))
    }
    for (let k = -2; k <= 2; k++) decal(u, v, nu, nv, 0.05, round(k * 1.1, TW_H - 0.9, 0.7, 0.8), shade(stone, 0.82))
  }
  const spot = (u: number, v: number): { x: number; z: number } => { const [e, n] = en(u, v); return F.xz(e, n) }
  const aU = Math.atan2(F.n([CA, SA, 0])[0], F.n([CA, SA, 0])[2]), y0 = F.y0
  const pc = spot(tuc, 0), R = TW_HW * Math.SQRT2 * 0.9
  cyl(out, pc.x, pc.z, y0 + TW_H, y0 + SP_H, R, 4, hex(SPIRE), 0, R * 0.1, true, aU + Math.PI / 4)
  cyl(out, pc.x, pc.z, y0 + SP_H - 0.2, y0 + CROSS_H, 0.1, 4, dark, 0, 0.05, true, 0)
  cyl(out, pc.x, pc.z, y0 + CROSS_H - 1.3, y0 + CROSS_H - 1.1, 0.55, 4, dark, 0, 0.55, true, 0)
  for (const [nu, nv] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as [number, number][]) {          // a little dormer on each spire face
    const du = tuc + nu * 1.5, dv = nv * 1.5
    solid(du - 0.5 - Math.abs(nv) * 0.0, du + 0.5, dv - 0.5, dv + 0.5, TW_H + 1.0, TW_H + 2.6, shade(hex(SPIRE), 1.15), shade(hex(SPIRE), 0.9), 0)
    decal(du + nu * 0.5, dv + nv * 0.5, nu, nv, 0.03, round(0, TW_H + 1.2, 0.5, 1.2), dark)
  }
}
