/**
 * ÉGLISE SAINT-JOSEPH-DES-NATIONS (rue Saint-Maur, 11e; OSM relation/1589962). A neo-Gothic parish church of buff
 * limestone: a three-aisled nave under a slate gable with a lower lean-to roof over each aisle, a transept, a polygonal
 * apse, and a square belfry tower at the middle of the west front — three arched portals at its foot, clock roundels,
 * twin louvred lancets in the belfry, four corner pinnacles and an octagonal stone spire. Measured from the IGN LiDAR HD
 * surface model (docs/landmarks/MODEL-ST-JOSEPH-NATIONS.md): aisles 9-11 m, nave and transept ridges 21 m, belfry 33 m,
 * spire tip ~52 m. Photos: docs/landmarks/refs/st-joseph-nations/. Drawn in the church's (u, v) frame — u along the nave
 * toward the apse, v across — turned AXIS_DEG from east, registered onto the footprint by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism as cyl } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 214.5        // the nave's direction (west front toward the apse), degrees anticlockwise from east
const U_FRONT = -45, U_END = 43       // west front and the east end of the aisle block
const AISLE_V = 13.3                  // half-width of the aisle block
const AISLE_EAVE = 8.8, AISLE_HI = 11.2   // lean-to roof: eave at the outer wall, top at the clerestory
const NAVE_V = 5.5, NAVE_U1 = 31
const EAVE_H = 17.5, RIDGE_H = 21.3
const TR_U0 = -9.5, TR_U1 = 0.5, TR_V = 16.5          // transept
const APSE_R = 5.5, APSE_ROOF = 4.5
const TOWER_U0 = -45, TOWER_U1 = -38, TOWER_V = 3.6, TOWER_H = 33, PIN_H = 38, SPIRE_Y1 = 53, SPIRE_R = 2.9
const BAY = 5.2
const STONE = '#cdbf9f', TRIM = '#ddd0ae', ROOF = '#4d5663', GLASS = '#303a50', DOOR = '#5a3a2a', DARK = '#26272c', CLOCK = '#e8e1c8'

export const RING: P2[] = [[-42.9, -12.5], [-40.8, -15.0], [-37.2, -20.5], [-37.7, -23.1], [-36.7, -25.5], [-33.7, -26.1], [-29.9, -31.3], [-28.3, -33.7], [-20.0, -29.3], [-15.6, -25.4], [-12.2, -23.1], [-9.9, -26.1], [7.0, -14.7], [15.1, -9.1], [12.7, -4.6], [15.9, -2.0], [19.8, 0.7], [23.9, 3.3], [28.7, 6.5], [31.8, 8.7], [34.7, 7.8], [36.9, 11.0], [37.6, 13.6], [41.7, 16.6], [39.6, 20.9], [38.8, 24.0], [35.7, 27.0], [34.2, 29.3], [31.4, 33.3], [26.2, 30.6], [23.6, 31.2], [19.5, 30.3], [19.5, 27.6], [16.3, 25.2], [12.2, 22.4], [8.3, 19.7], [4.2, 16.8], [0.6, 14.3], [-2.4, 17.5], [-10.9, 12.4], [-14.8, 9.9], [-28.4, 1.0], [-26.6, -1.4], [-28.4, -3.8], [-33.8, -7.4], [-42.0, -12.1]]

const A = (AXIS_DEG * Math.PI) / 180, CA = Math.cos(A), SA = Math.sin(A)

export function saintJosephDesNations(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK), clock: Rgb = hex(CLOCK)
  const { en, P, solid, decal, round, pointed, disc, cornice, ridge, gable } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 14, corniceH: 0.6, corniceOut: 0.25 })
  const lancet = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.04, pointed(t, y0 - 0.2, w + 0.6, h + 0.4), trim)
    decal(u, v, nu, nv, 0.09, pointed(t, y0, w, h), glass)
    decal(u, v, nu, nv, 0.13, [[t - 0.06, y0], [t + 0.06, y0], [t + 0.06, y0 + h * 0.7], [t - 0.06, y0 + h * 0.7]], trim)
  }
  // ── aisle block: walls, lean-to slate roofs, buttress piers, lancet windows ──
  const u0 = U_FRONT + 0.4
  for (const s of [-1, 1]) {
    solid(u0, U_END, s * NAVE_V, s * AISLE_V, 0, AISLE_EAVE, stone, null, 3)
    T.poly([P(u0 - 0.3, s * (AISLE_V + 0.35), AISLE_EAVE - 0.2), P(U_END + 0.3, s * (AISLE_V + 0.35), AISLE_EAVE - 0.2), P(U_END + 0.3, s * NAVE_V, AISLE_HI), P(u0 - 0.3, s * NAVE_V, AISLE_HI)], roofC, [...en(0, s), 0.8] as V3)
  }
  solid(U_END - 0.1, U_END + 0.2, -AISLE_V, AISLE_V, AISLE_EAVE, AISLE_HI - 0.3, stone, null, 3)
  for (const s of [-1, 1]) cornice(u0, U_END, s > 0 ? AISLE_V - 0.1 : -AISLE_V, s > 0 ? AISLE_V : -AISLE_V + 0.1, AISLE_EAVE, 0.5, 0.2)
  const nb = Math.round((U_END - u0) / BAY), bl = (U_END - u0) / nb
  for (let i = 0; i <= nb; i++) for (const s of [-1, 1]) solid(u0 + i * bl - 0.4, u0 + i * bl + 0.4, s > 0 ? AISLE_V : -AISLE_V - 0.45, s > 0 ? AISLE_V + 0.45 : -AISLE_V, 0, AISLE_EAVE + 0.8, shade(stone, 0.97), trim, 2)
  for (let i = 0; i < nb; i++) {
    const u = u0 + (i + 0.5) * bl
    if (u < U_FRONT + 4.5) continue
    for (const s of [-1, 1]) {
      lancet(u, s * AISLE_V, 0, s, 0, 2.6, 1.7, 4.8)
      if (u > TR_U0 - 3 && u < TR_U1 + 3) continue
    }
  }

  // ── nave: clerestory, slate gable roof, lancets ──
  solid(U_FRONT, NAVE_U1, -NAVE_V, NAVE_V, AISLE_HI - 0.5, EAVE_H, stone, null, 3)
  cornice(U_FRONT, NAVE_U1, -NAVE_V, NAVE_V, EAVE_H, 0.55, 0.25)
  ridge('u', U_FRONT, NAVE_U1, 0, NAVE_V + 0.3, EAVE_H, RIDGE_H)
  const nn = Math.round((NAVE_U1 - U_FRONT) / BAY), nl = (NAVE_U1 - U_FRONT) / nn
  for (let i = 0; i < nn; i++) {
    const u = U_FRONT + (i + 0.5) * nl
    if (u < U_FRONT + 4.5 || (u > TR_U0 - 0.5 && u < TR_U1 + 0.5)) continue
    for (const s of [-1, 1]) {
      // round oculus under the lean-to roof line, then the lancet in the clerestory
      lancet(u, s * NAVE_V, 0, s, 0, 12.2, 1.5, 4.2)
    }
  }
  // oculi in the aisle walls' gables are not drawn; the nave's front gable is under the tower

  // ── transept: end walls with a lancet triple and a rose, gabled slate roof ──
  const tc = (TR_U0 + TR_U1) / 2, th = (TR_U1 - TR_U0) / 2
  solid(TR_U0, TR_U1, -TR_V, TR_V, AISLE_HI - 0.5, EAVE_H, stone, null, 3)
  for (const s of [-1, 1]) solid(TR_U0, TR_U1, s > 0 ? AISLE_V : -TR_V, s > 0 ? TR_V : -AISLE_V, 0, AISLE_HI - 0.5, stone, null, 3)
  cornice(TR_U0, TR_U1, -TR_V, TR_V, EAVE_H, 0.55, 0.25)
  ridge('v', -TR_V, TR_V, tc, th + 0.3, EAVE_H, RIDGE_H)
  for (const s of [-1, 1] as const) {
    const v = s * TR_V
    gable('v', v, tc, th + 0.3, EAVE_H, RIDGE_H, s)
    decal(tc, v, 0, s, 0.06, disc(0, 17.8, 1.7), trim); decal(tc, v, 0, s, 0.1, disc(0, 17.8, 1.4), glass)
    lancet(tc, v, 0, s, 0, 3.6, 1.7, 9.4); lancet(tc, v, 0, s, -2.6, 3.6, 1.2, 6.4); lancet(tc, v, 0, s, 2.6, 3.6, 1.2, 6.4)
    for (const e of [TR_U0 + 0.2, TR_U1 - 0.2]) solid(e - 0.4, e + 0.4, s > 0 ? v - 0.2 : v - 0.45, s > 0 ? v + 0.45 : v + 0.2, 0, EAVE_H + 0.8, shade(stone, 0.97), trim, 2)
  }

  // ── apse: half-octagon with a slate half-cone ──
  const AN = 6, aq = (k: number, r: number): P2 => { const a = -Math.PI / 2 + (k / AN) * Math.PI; return [NAVE_U1 + r * Math.cos(a), r * Math.sin(a)] }
  const apse: P2[] = [[NAVE_U1, NAVE_V], [NAVE_U1, -NAVE_V]]
  for (let k = 0; k <= AN; k++) apse.unshift(aq(k, APSE_R))
  T.prism(apse.map(([u, v]) => en(u, v)), AISLE_HI - 0.5, EAVE_H, stone, null, 3)
  for (let k = 0; k < AN; k++) {
    const a = aq(k, APSE_R + 0.3), b = aq(k + 1, APSE_R + 0.3), mid = (-Math.PI / 2 + ((k + 0.5) / AN) * Math.PI)
    T.poly([P(a[0], a[1], EAVE_H - 0.2), P(b[0], b[1], EAVE_H - 0.2), P(NAVE_U1, 0, EAVE_H + APSE_ROOF)], roofC, [...en(Math.cos(mid), Math.sin(mid)), 0.8] as V3)
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    lancet(NAVE_U1 + (APSE_R) * Math.cos(mid), APSE_R * Math.sin(mid), Math.cos(mid), Math.sin(mid), 0, 11.8, 1.4, 4.4)
    void m
  }

  // ── west front: aisle fronts with portals and the tower in the middle ──
  for (const s of [-1, 1]) {
    const v = s * 9.4
    decal(U_FRONT + 0.4, v, -1, 0, 0.06, pointed(0, 0, 3.0, 6.0), trim); decal(U_FRONT + 0.4, v, -1, 0, 0.12, pointed(0, 0, 2.2, 5.2), door)
    lancet(U_FRONT + 0.4, v, -1, 0, 0, 6.4, 1.2, 2.0)
    solid(U_FRONT - 0.4, U_FRONT + 0.9, s * AISLE_V - 0.4, s * AISLE_V + 0.4, 0, AISLE_EAVE + 1.4, shade(stone, 0.97), trim, 2)
    cornice(U_FRONT, U_FRONT + 0.8, s * NAVE_V - 0.1, s * NAVE_V + 0.1, AISLE_EAVE, 0.1, 0.1)
  }
  const tcu = (TOWER_U0 + TOWER_U1) / 2
  solid(TOWER_U0, TOWER_U1, -TOWER_V, TOWER_V, 0, TOWER_H, stone, null, 2.4)
  cornice(TOWER_U0, TOWER_U1, -TOWER_V, TOWER_V, TOWER_H, 0.9, 0.4)
  cornice(TOWER_U0, TOWER_U1, -TOWER_V, TOWER_V, 17.6, 0.45, 0.2)
  cornice(TOWER_U0, TOWER_U1, -TOWER_V, TOWER_V, 26.6, 0.45, 0.2)
  // three arched portals at the foot of the front face, a twin window over, then the clock
  for (const t of [-2.1, 0, 2.1]) {
    const w = t === 0 ? 2.5 : 1.9
    decal(TOWER_U0, 0, -1, 0, 0.05, round(t, 0, w + 0.6, (t === 0 ? 5.6 : 4.6) + 0.3), trim); decal(TOWER_U0, 0, -1, 0, 0.11, round(t, 0, w, t === 0 ? 5.6 : 4.6), door)
  }
  lancet(TOWER_U0, 0, -1, 0, -0.9, 9.0, 1.1, 5.6); lancet(TOWER_U0, 0, -1, 0, 0.9, 9.0, 1.1, 5.6)
  for (const [u, v, nu, nv, hw] of [[TOWER_U0, 0, -1, 0, TOWER_V], [TOWER_U1, 0, 1, 0, TOWER_V], [tcu, TOWER_V, 0, 1, (TOWER_U1 - TOWER_U0) / 2], [tcu, -TOWER_V, 0, -1, (TOWER_U1 - TOWER_U0) / 2]] as [number, number, number, number, number][]) {
    decal(u, v, nu, nv, 0.06, disc(0, 22.2, 1.15), trim); decal(u, v, nu, nv, 0.1, disc(0, 22.2, 0.95), clock)
    decal(u, v, nu, nv, 0.14, [[-0.05, 22.2], [0.05, 22.2], [0.05, 22.9], [-0.05, 22.9]], dark); decal(u, v, nu, nv, 0.14, [[0, 22.15], [0.55, 22.15], [0.55, 22.25], [0, 22.25]], dark)
    for (const t of [-hw * 0.38, hw * 0.38]) {      // belfry: tall twin lancets, louvred
      decal(u, v, nu, nv, 0.05, round(t, 27.4, 2.3, 5.4), trim)
      decal(u, v, nu, nv, 0.1, round(t, 27.6, 1.8, 5.0), dark)
      for (let k = 0; k < 6; k++) decal(u, v, nu, nv, 0.13, [[t - 0.8, 28.0 + k * 0.6], [t + 0.8, 28.0 + k * 0.6], [t + 0.8, 28.1 + k * 0.6], [t - 0.8, 28.1 + k * 0.6]], shade(stone, 0.9))
    }
  }
  const spot = (u: number, v: number): { x: number; z: number } => { const [e, n] = en(u, v); return F.xz(e, n) }
  const aU = Math.atan2(F.n([CA, SA, 0])[0], F.n([CA, SA, 0])[2])
  const y0 = F.y0
  for (const su of [-1, 1]) for (const sv of [-1, 1]) {      // four corner pinnacles with pointed caps
    const p = spot((su < 0 ? TOWER_U0 : TOWER_U1) - su * 0.45, sv * (TOWER_V - 0.45))
    cyl(out, p.x, p.z, y0 + TOWER_H, y0 + PIN_H - 2.2, 0.55, 8, stone, 0, 0.5, true, aU)
    cyl(out, p.x, p.z, y0 + PIN_H - 2.2, y0 + PIN_H, 0.62, 8, roofC, 0, 0.03, true, aU)
  }
  const pc = spot(tcu, 0), ph = aU - Math.PI / 8
  cyl(out, pc.x, pc.z, y0 + TOWER_H, y0 + SPIRE_Y1 - 14, SPIRE_R, 8, stone, 0, SPIRE_R * 0.7, true, ph)
  cyl(out, pc.x, pc.z, y0 + SPIRE_Y1 - 14, y0 + SPIRE_Y1, SPIRE_R * 0.7, 8, shade(stone, 0.9), 0, 0.05, true, ph)
  cyl(out, pc.x, pc.z, y0 + SPIRE_Y1 - 0.2, y0 + SPIRE_Y1 + 2.0, 0.1, 4, dark, 0, 0.02, true, 0)
  for (let k = 0; k < 4; k++) {                          // gabled lucarnes on the cardinal faces
    const a = aU + (k * Math.PI) / 2, r = SPIRE_R * 0.78
    cyl(out, pc.x + Math.sin(a) * r, pc.z + Math.cos(a) * r, y0 + TOWER_H + 5.5, y0 + TOWER_H + 8.5, 0.5, 4, trim, 0, 0.05, true, a + Math.PI / 4)
  }
  // the front steps
  for (let k = 0; k < 3; k++) solid(U_FRONT - 0.8 - k * 0.6, U_FRONT + 0.2, -TOWER_V - 1.2 + k * 0.3, TOWER_V + 1.2 - k * 0.3, 0, 0.5 - k * 0.12, shade(stone, 0.94), shade(stone, 0.9), 0)
}
