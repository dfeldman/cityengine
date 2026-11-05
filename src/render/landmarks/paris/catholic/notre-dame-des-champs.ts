/**
 * ÉGLISE NOTRE-DAME-DES-CHAMPS (91 boulevard du Montparnasse, 6e; OSM way/64121803; Ginain, 1867-76). A neo-Romanesque
 * parish church of buff limestone: a round-arched nave under a slate gable (ridge ~24 m) between low lean-to aisles (~11 m),
 * a short transept, an apse, and a square belfry tower beside the choir on the east flank — clock roundel, twin louvred
 * arches, hipped slate roof, cross (tower top ~42 m, cross ~46 m). Measured from the IGN LiDAR HD surface model
 * (docs/landmarks/MODEL-ND-DES-CHAMPS.md). Drawn in the church's (u, v) frame — u along the nave toward the apse, v across,
 * the axis shifted onto v = 0 — turned AXIS_DEG from east, registered onto the footprint by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism as cyl } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 64.5                 // west front toward the apse, degrees anticlockwise from east
const U_FRONT = -35, U_AISLE_END = 25, NAVE_U1 = 25
const AISLE_V = 11, NAVE_V = 6.3
const AISLE_EAVE = 8.5, AISLE_HI = 12.5
const EAVE_H = 20.5, RIDGE_H = 24
const TR_U0 = -5.5, TR_U1 = 3.5, TR_V0 = -16.9, TR_V1 = 15
const APSE_R = 6.3, APSE_DEPTH = 6, APSE_N = 6
const TW_U0 = 15.4, TW_U1 = 23.4, TW_V0 = -20.9, TW_V1 = -12.9
const TW_H = 34.5, TW_ROOF = 42, TW_CROSS = 46
const BAY = 5
const STONE = '#cfc0a0', TRIM = '#ddd0b0', ROOF = '#4f5560', GLASS = '#303a50', DOOR = '#5a3a2a', DARK = '#26272c', CLOCK = '#e8e1c8'

export const RING: P2[] = [[14.1,32],[14.1,32.9],[14,33.4],[13.8,34],[13.3,34.5],[12.9,34.6],[12.3,34.8],[11.6,34.7],[11.1,34.5],[10.7,34],[9.6,34.7],[4.3,25],[-0.8,27.7],[-2.4,24.9],[-4,22],[-4.4,21.4],[-8.8,13],[-9,13.1],[-14.7,3.8],[-10.6,1.5],[-9.5,0.9],[-17.6,-13.7],[-24.6,-26],[-25.3,-25.6],[-25.7,-26.3],[-26.5,-26],[-27.5,-26],[-28,-26.1],[-28.7,-26.5],[-29,-26.8],[-29.6,-27.6],[-29.9,-28.2],[-29.9,-29.1],[-29.7,-29.8],[-29.5,-30.3],[-28.6,-31.3],[-28.6,-31.5],[-28.8,-31.8],[-28.1,-32.2],[-28.3,-32.5],[-27.5,-32.9],[-27.3,-32.6],[-25.3,-33.8],[-23.7,-34.7],[-24.2,-35.6],[-23.3,-36.1],[-23.1,-35.8],[-14.9,-40.4],[-15.1,-40.6],[-14.1,-41.2],[-13.6,-40.3],[-9.9,-42.4],[-10.1,-42.7],[-9.2,-43.2],[-9,-42.9],[-8.4,-43.3],[-8,-42.6],[-7.1,-42.8],[-6.1,-42.8],[-5.7,-42.7],[-4.9,-42.3],[-4.3,-41.5],[-4,-40.8],[-3.9,-39.9],[-4,-39],[-4.3,-38.5],[-4.8,-37.9],[-5.2,-37.7],[-4.8,-37.1],[-5.5,-36.7],[9.7,-9.7],[10.9,-10.4],[14.9,-12.6],[20.4,-3.2],[20.2,-3.1],[25.2,5.3],[25.5,5.1],[29.3,11.9],[29,12.1],[27.2,13.1],[27.3,13.2],[26.9,14.2],[25.9,14.8],[24.9,14.5],[24.8,14.4],[23.8,14.9],[28.9,24],[27.8,24.6],[27.9,25.3],[27.7,25.9],[27.5,26.2],[27.1,26.7],[26.5,27],[25.9,27.1],[25.3,27],[24.7,26.8],[24.2,26.4],[23.7,26.7],[23.2,27],[23.7,28.5],[23.7,29.7],[23.5,30.6],[23,31.7],[22.3,32.5],[21.8,32.9],[20.7,33.5],[19.4,33.8],[18.1,33.7],[17,33.2],[16.1,32.6],[15.1,31.5],[14.5,31.8]]

const A = (AXIS_DEG * Math.PI) / 180, CA = Math.cos(A), SA = Math.sin(A)

export function notreDameDesChamps(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK), clock: Rgb = hex(CLOCK)
  const { en, P, solid, decal, round, disc, cornice, ridge, gable } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 16, corniceH: 0.6, corniceOut: 0.3 })
  const win = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.04, round(t, y0 - 0.2, w + 0.6, h + 0.4), trim)
    decal(u, v, nu, nv, 0.09, round(t, y0, w, h), glass)
    decal(u, v, nu, nv, 0.13, [[t - 0.05, y0], [t + 0.05, y0], [t + 0.05, y0 + h * 0.7], [t - 0.05, y0 + h * 0.7]], trim)
  }
  const pier = (u: number, v: number, s: number, h: number): void => {
    solid(u - 0.4, u + 0.4, s > 0 ? v : v - 0.5, s > 0 ? v + 0.5 : v, 0, h, shade(stone, 0.97), trim, 2)
  }
  // ── aisle block: walls, lean-to slate roofs, piers, round windows ──
  const u0 = U_FRONT + 0.4
  for (const s of [-1, 1]) {
    solid(u0, U_AISLE_END, s * NAVE_V, s * AISLE_V, 0, AISLE_EAVE, stone, null, 3)
    T.poly([P(u0 - 0.3, s * (AISLE_V + 0.35), AISLE_EAVE - 0.2), P(U_AISLE_END + 0.3, s * (AISLE_V + 0.35), AISLE_EAVE - 0.2), P(U_AISLE_END + 0.3, s * NAVE_V, AISLE_HI), P(u0 - 0.3, s * NAVE_V, AISLE_HI)], roofC, [...en(0, s), 0.8] as V3)
    cornice(u0, U_AISLE_END, s > 0 ? AISLE_V - 0.1 : -AISLE_V, s > 0 ? AISLE_V : -AISLE_V + 0.1, AISLE_EAVE, 0.5, 0.2)
  }
  solid(U_AISLE_END - 0.1, U_AISLE_END + 0.2, -AISLE_V, AISLE_V, AISLE_EAVE, AISLE_HI - 0.3, stone, null, 3)
  const nb = Math.round((U_AISLE_END - u0) / BAY), bl = (U_AISLE_END - u0) / nb
  for (let i = 0; i <= nb; i++) for (const s of [-1, 1]) pier(u0 + i * bl, s * AISLE_V, s, AISLE_EAVE + 0.5)
  for (let i = 0; i < nb; i++) {
    const u = u0 + (i + 0.5) * bl
    if (u < U_FRONT + 3 || (u > TR_U0 - 3 && u < TR_U1 + 3)) continue
    for (const s of [-1, 1]) win(u, s * AISLE_V, 0, s, 0, 2.2, 1.9, 4.6)
  }
  // ── nave: clerestory, slate gable roof, round windows ──
  solid(U_FRONT, NAVE_U1, -NAVE_V, NAVE_V, AISLE_HI - 0.5, EAVE_H, stone, null, 3)
  cornice(U_FRONT, NAVE_U1, -NAVE_V, NAVE_V, EAVE_H, 0.55, 0.3)
  ridge('u', U_FRONT, NAVE_U1, 0, NAVE_V + 0.3, EAVE_H, RIDGE_H)
  gable('u', NAVE_U1, 0, NAVE_V + 0.3, EAVE_H, RIDGE_H, 1)
  for (let i = 0; i < nb; i++) {
    const u = u0 + (i + 0.5) * bl
    if (u < U_FRONT + 3 || (u > TR_U0 - 1 && u < TR_U1 + 1)) continue
    for (const s of [-1, 1]) win(u, s * NAVE_V, 0, s, 0, 14.2, 1.9, 4.6)
  }
  // ── transept: gabled arms, end walls with a rose and a window triple ──
  const tc = (TR_U0 + TR_U1) / 2, th = (TR_U1 - TR_U0) / 2
  solid(TR_U0, TR_U1, TR_V0, TR_V1, AISLE_HI - 0.5, EAVE_H, stone, null, 3)
  for (const [a, b] of [[TR_V0, -AISLE_V], [AISLE_V, TR_V1]]) solid(TR_U0, TR_U1, a, b, 0, AISLE_HI - 0.5, stone, null, 3)
  cornice(TR_U0, TR_U1, TR_V0, TR_V1, EAVE_H, 0.55, 0.3)
  ridge('v', TR_V0, TR_V1, tc, th + 0.3, EAVE_H, RIDGE_H)
  for (const [v, s] of [[TR_V0, -1], [TR_V1, 1]] as [number, 1 | -1][]) {
    gable('v', v, tc, th + 0.3, EAVE_H, RIDGE_H, s)
    decal(tc, v, 0, s, 0.06, disc(0, 18.6, 1.6), trim); decal(tc, v, 0, s, 0.1, disc(0, 18.6, 1.3), glass)
    win(tc, v, 0, s, -2.2, 5.4, 1.3, 5.4); win(tc, v, 0, s, 0, 5.4, 1.5, 6.4); win(tc, v, 0, s, 2.2, 5.4, 1.3, 5.4)
  }
  // ── apse: half-octagon at the choir's end under a slate half-cone, with a straight choir bay ──
  const apse: P2[] = [[NAVE_U1, NAVE_V], [NAVE_U1, -NAVE_V]]
  const cu = NAVE_U1 + APSE_DEPTH - APSE_R         // centre of the half-octagon
  const ap = (k: number, r: number): P2 => { const a = -Math.PI / 2 + (k / APSE_N) * Math.PI; return [cu + r * Math.cos(a), r * Math.sin(a)] }
  for (let k = 0; k <= APSE_N; k++) apse.unshift(ap(k, APSE_R))
  T.prism(apse.map(([u, v]) => en(u, v)), AISLE_HI - 0.5, EAVE_H - 3, stone, null, 3)
  for (let k = 0; k < APSE_N; k++) {
    const a = ap(k, APSE_R + 0.3), b = ap(k + 1, APSE_R + 0.3), mid = -Math.PI / 2 + ((k + 0.5) / APSE_N) * Math.PI
    T.poly([P(a[0], a[1], EAVE_H - 3.2), P(b[0], b[1], EAVE_H - 3.2), P(cu, 0, EAVE_H + 1.5)], roofC, [...en(Math.cos(mid), Math.sin(mid)), 0.8] as V3)
    win(cu + APSE_R * Math.cos(mid), APSE_R * Math.sin(mid), Math.cos(mid), Math.sin(mid), 0, 10, 1.6, 4.6)
  }
  // ── west front: central gable with a triple portal and a rose, aisle fronts with doors ──
  const uf = U_FRONT
  gable('u', uf, 0, NAVE_V + 0.3, EAVE_H, RIDGE_H, -1)
  solid(uf - 0.5, uf + 0.5, -NAVE_V - 0.2, NAVE_V + 0.2, AISLE_HI - 0.5, EAVE_H, stone, null, 3)
  cornice(uf - 0.4, uf + 0.5, -NAVE_V - 0.3, NAVE_V + 0.3, EAVE_H, 0.5, 0.15)
  for (const t of [-2.2, 0, 2.2]) {
    const w = t === 0 ? 2.8 : 2.0, h = t === 0 ? 6.2 : 5.0
    decal(uf, 0, -1, 0, 0.05, round(t, 0, w + 0.7, h + 0.35), trim); decal(uf, 0, -1, 0, 0.11, round(t, 0, w, h), door)
  }
  decal(uf, 0, -1, 0, 0.06, disc(0, 16.6, 2.2), trim); decal(uf, 0, -1, 0, 0.1, disc(0, 16.6, 1.8), glass)
  win(uf, 0, -1, 0, -3.2, 10.0, 1.2, 4.0); win(uf, 0, -1, 0, 3.2, 10.0, 1.2, 4.0); win(uf, 0, -1, 0, 0, 9.6, 1.6, 4.6)
  for (const s of [-1, 1]) {
    const v = s * 8.7
    decal(u0 + 0.0, v, -1, 0, 0.06, round(0, 0, 2.6, 5.2), trim); decal(u0, v, -1, 0, 0.12, round(0, 0, 2.0, 4.6), door)
    win(u0, v, -1, 0, 0, 6.0, 1.4, 2.0)
    solid(uf - 0.4, uf + 0.9, s * AISLE_V - 0.4, s * AISLE_V + 0.4, 0, AISLE_EAVE + 1.4, shade(stone, 0.97), trim, 2)
  }
  for (let k = 0; k < 3; k++) solid(uf - 0.8 - k * 0.6, uf + 0.2, -4.6 + k * 0.3, 4.6 - k * 0.3, 0, 0.45 - k * 0.1, shade(stone, 0.94), shade(stone, 0.9), 0)
  // ── belfry tower beside the choir ──
  const tuc = (TW_U0 + TW_U1) / 2, tvc = (TW_V0 + TW_V1) / 2, hw = (TW_U1 - TW_U0) / 2
  solid(TW_U0, TW_U1, TW_V0, TW_V1, 0, TW_H, stone, null, 2.4)
  solid(TW_U0 + 0.1, TW_U1 - 0.1, TW_V1 - 0.1, -AISLE_V + 0.1, 0, 8.5, stone, null, 3)     // low link to the aisle
  cornice(TW_U0, TW_U1, TW_V0, TW_V1, TW_H, 0.9, 0.4)
  cornice(TW_U0, TW_U1, TW_V0, TW_V1, 17.2, 0.5, 0.2)
  cornice(TW_U0, TW_U1, TW_V0, TW_V1, 25.6, 0.4, 0.15)
  const faces: [number, number, number, number][] = [[tuc, TW_V0, 0, -1], [tuc, TW_V1, 0, 1], [TW_U0, tvc, -1, 0], [TW_U1, tvc, 1, 0]]
  for (const [u, v, nu, nv] of faces) {
    decal(u, v, nu, nv, 0.05, round(0, 17.7, hw * 1.7, 6.2), trim)          // blind arch holding the clock
    decal(u, v, nu, nv, 0.09, round(0, 17.7, hw * 1.7 - 0.6, 5.8), shade(stone, 0.96))
    decal(u, v, nu, nv, 0.14, disc(0, 21, 1.3), trim); decal(u, v, nu, nv, 0.18, disc(0, 21, 1.1), clock)
    decal(u, v, nu, nv, 0.22, [[-0.05, 21], [0.05, 21], [0.05, 21.9], [-0.05, 21.9]], dark); decal(u, v, nu, nv, 0.22, [[0, 20.95], [0.6, 20.95], [0.6, 21.05], [0, 21.05]], dark)
    for (const t of [-hw * 0.4, hw * 0.4]) win(u, v, nu, nv, t, 11, 1.1, 3.6)    // lower stage windows
    for (const t of [-hw * 0.42, hw * 0.42]) {                                       // belfry: two tall louvred arches over a column
      decal(u, v, nu, nv, 0.05, round(t, 26.5, 2.4, 6.4), trim)
      decal(u, v, nu, nv, 0.1, round(t, 26.7, 1.9, 6.0), dark)
      for (let k = 0; k < 7; k++) decal(u, v, nu, nv, 0.13, [[t - 0.9, 27.0 + k * 0.6], [t + 0.9, 27.0 + k * 0.6], [t + 0.9, 27.1 + k * 0.6], [t - 0.9, 27.1 + k * 0.6]], shade(stone, 0.9))
    }
    for (let k = 0; k < 4; k++) decal(u, v, nu, nv, 0.08, round(-hw * 0.6 + k * hw * 0.4, 33.0, 0.7, 1.3), dark)  // frieze of little arches
  }
  const spot = (u: number, v: number): { x: number; z: number } => { const [e, n] = en(u, v); return F.xz(e, n) }
  const aU = Math.atan2(F.n([CA, SA, 0])[0], F.n([CA, SA, 0])[2]), y0 = F.y0
  const pc = spot(tuc, tvc), R = hw * Math.SQRT2 * 1.06
  cyl(out, pc.x, pc.z, y0 + TW_H, y0 + TW_ROOF, R, 4, roofC, 0, R * 0.12, true, aU + Math.PI / 4)
  cyl(out, pc.x, pc.z, y0 + TW_H + 2.2, y0 + TW_H + 4.2, 0.9, 4, trim, 0, 0.1, true, aU + Math.PI / 4)    // little lantern
  cyl(out, pc.x, pc.z, y0 + TW_ROOF - 0.2, y0 + TW_CROSS, 0.12, 4, dark, 0, 0.06, true, 0)
  cyl(out, pc.x, pc.z, y0 + TW_CROSS - 1.6, y0 + TW_CROSS - 1.4, 0.7, 4, dark, 0, 0.7, true, 0)
}
