/**
 * ÉGLISE SAINT-JACQUES-DU-HAUT-PAS (252 rue Saint-Jacques, 5e; OSM way/60279510, with the building=yes way/1457837352 on
 * the street beside its front). A classical parish church (17th-18th c., Gittard and others): a four-storey belfry tower
 * at the south corner of the east front, a pedimented tetrastyle portico on the nave with a big round window over it,
 * round-windowed aisle bays, a slate-roofed nave (ridge ~22 m) between lean-to aisles (~10 m), a low choir with
 * ambulatory at the west end. Measured from the IGN LiDAR HD surface model and one Commons facade photograph
 * (docs/landmarks/refs/st-jacques-haut-pas/; notes docs/landmarks/MODEL-ST-JACQUES-HAUT-PAS.md).
 * Frame: metres east/north of the two ways' box centre; u along the nave toward the front (AXIS_DEG from east), v across
 * (v increases to the left of someone facing +u, i.e. the tower is at the -v side).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism as cyl } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = -22                       // nave direction, apse toward front, anticlockwise from east
const UF = 32.5, U_NAVE0 = -22             // the front wall; the nave's west end
const S_V0 = -16.3, NV0 = -11, NV1 = -1.8, N_V1 = 3.8   // the south aisle's outer wall, nave sides, the north aisle's outer wall
const AISLE_EAVE = 9.6, AISLE_HI = 12.4
const EAVE_H = 17.5, RIDGE_H = 22.2
const TW_U0 = 26.2, TW_V0 = -16.3, TW_V1 = -10.2, TW_H = 32.5, TW_ROOF = 34.2, TW_CROSS = 36.5, TW_STAGE = 27.5
const POR_V0 = -9.4, POR_V1 = -2.6, POR_D = 1.0, POR_H = 9.3, POR_PED = 12.6  // portico projection, entablature, pediment apex
const CHOIR_H = 11.2, ANNEX_H = 9
const ANNEX2_H = 19                        // the street building beside the front
const BAY = 5
const STONE = '#c8bda8', TRIM = '#d8cfbc', ROOF = '#575c66', GLASS = '#35404f', DOOR = '#7a2a28', DARK = '#26272c', CLOCK = '#e8e1c8', FLAT = '#8e8c84', OTHER = '#cbbd9f'

// OSM way/60279510 and way/1457837352, metres east/north of their joint box centre (48.843691, 2.341128)
const CHURCH_OSM: P2[] = [[26.8, -6.7], [17.8, -2.9], [16.9, -2.6], [18.3, 1.2], [13.1, 3.3], [12.4, 3.6], [8.2, 5.3], [7.3, 5.9], [7.1, 5.5], [-0.9, 8.8], [1.3, 14], [-7.7, 17.8], [-8.3, 18], [-7.1, 21.7], [-26.8, 27.6], [-28, 24.2], [-31.2, 14.9], [-32.2, 12.1], [-35.5, 2.6], [-37.3, -2.5], [-34.8, -3.5], [-24.6, -7.6], [-15.5, -11.3], [-10.1, -13.5], [-2.1, -16.8], [2.9, -18.9], [8.7, -21.2], [19.5, -25.7], [23.3, -27.3], [24.1, -27.6], [24.3, -27.1], [24.7, -24], [25.3, -22.4], [26.4, -22.3], [28, -18], [29.6, -14], [30.6, -10], [31.1, -8.7]]
const OTHER_OSM: P2[] = [[18.3, 1.2], [16.9, -2.6], [17.8, -2.9], [26.8, -6.7], [31.1, -8.5], [31.5, -9], [33.4, -3.6], [37.3, 7.7], [26.6, 11.2], [22.5, -0.6]]
export const RING: P2[] = [...CHURCH_OSM, ...OTHER_OSM]

export function saintJacquesHautPas(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK), clock: Rgb = hex(CLOCK)
  const { en, P, solid, decal, round, disc, cornice, ridge, gable } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 16, corniceH: 0.6, corniceOut: 0.3 })
  const win = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.04, round(t, y0 - 0.2, w + 0.6, h + 0.4), trim)
    decal(u, v, nu, nv, 0.09, round(t, y0, w, h), glass)
    decal(u, v, nu, nv, 0.13, [[t - 0.05, y0], [t + 0.05, y0], [t + 0.05, y0 + h * 0.7], [t - 0.05, y0 + h * 0.7]], trim)
  }
  const oculus = (u: number, v: number, nu: number, nv: number, t: number, y: number, r: number): void => {
    decal(u, v, nu, nv, 0.05, disc(t, y, r + 0.35), trim); decal(u, v, nu, nv, 0.1, disc(t, y, r), glass)
    decal(u, v, nu, nv, 0.13, [[t - r, y - 0.05], [t + r, y - 0.05], [t + r, y + 0.05], [t - r, y + 0.05]], trim)
    decal(u, v, nu, nv, 0.13, [[t - 0.05, y - r], [t + 0.05, y - r], [t + 0.05, y + r], [t - 0.05, y + r]], trim)
  }
  const doorway = (u: number, v: number, nu: number, nv: number, t: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.05, [[t - w / 2 - 0.35, 0], [t + w / 2 + 0.35, 0], [t + w / 2 + 0.35, h + 0.3], [t - w / 2 - 0.35, h + 0.3]], trim)
    decal(u, v, nu, nv, 0.11, [[t - w / 2, 0], [t + w / 2, 0], [t + w / 2, h], [t - w / 2, h]], door)
  }

  // ── aisles: walls, lean-to slate roofs, round windows on the flanks ──
  const aisles: [number, number, 1 | -1][] = [[S_V0, NV0, -1], [NV1, N_V1, 1]]
  for (const [va, vb, s] of aisles) {
    solid(U_NAVE0, UF, va, vb, 0, AISLE_EAVE, stone, null, 3)
    const vo = s > 0 ? vb : va, vi = s > 0 ? va : vb
    T.poly([P(U_NAVE0 - 0.3, vo + s * 0.35, AISLE_EAVE - 0.2), P(UF + 0.3, vo + s * 0.35, AISLE_EAVE - 0.2), P(UF + 0.3, vi, AISLE_HI), P(U_NAVE0 - 0.3, vi, AISLE_HI)], roofC, [...en(0, s), 0.8] as V3)
    cornice(U_NAVE0, UF, s > 0 ? vb - 0.1 : va, s > 0 ? vb : va + 0.1, AISLE_EAVE, 0.5, 0.2)
    const nb = Math.round((UF - 4 - U_NAVE0) / BAY), bl = (UF - 4 - U_NAVE0) / nb
    for (let i = 0; i < nb; i++) win(U_NAVE0 + (i + 0.5) * bl, vo, 0, s, 0, 2.6, 1.7, 4.4)
  }
  // ── nave: clerestory, slate gable roof, round windows ──
  solid(U_NAVE0, UF, NV0, NV1, AISLE_HI - 0.5, EAVE_H, stone, null, 3)
  cornice(U_NAVE0, UF, NV0, NV1, EAVE_H, 0.55, 0.3)
  const nc = (NV0 + NV1) / 2, nh = (NV1 - NV0) / 2
  ridge('u', U_NAVE0, UF, nc, nh + 0.3, EAVE_H, RIDGE_H)
  gable('u', U_NAVE0, nc, nh + 0.3, EAVE_H, RIDGE_H, -1)
  const nb2 = Math.round((UF - 4 - U_NAVE0) / BAY), bl2 = (UF - 4 - U_NAVE0) / nb2
  for (let i = 0; i < nb2; i++) for (const [v, s] of [[NV0, -1], [NV1, 1]] as [number, number][]) win(U_NAVE0 + (i + 0.5) * bl2, v, 0, s, 0, 12.6, 1.7, 3.6)

  // ── choir with ambulatory, a low flat-roofed block at the west end; the north annexes ──
  const choir: P2[] = [[-22, -16.3], [-33.6, -16.3], [-34.4, -0.8], [-35, 11.9], [-35.2, 15.6], [-14.7, 17.5], [-14.4, 13.6], [-4, 13.5], [-4.1, 7.8], [-22, 7.8]]
  T.prism(choir.map(([u, v]) => en(u, v)), 0, CHOIR_H, shade(stone, 0.96), hex(FLAT), 3)
  solid(4.6, 16.5, N_V1 - 0.1, 8, 0, ANNEX_H, shade(stone, 0.95), hex(FLAT), 3)

  // ── east front: pedimented portico on the nave, round window over it, aisle bays with door and oculus ──
  const pc = (POR_V0 + POR_V1) / 2, ph = (POR_V1 - POR_V0) / 2
  gable('u', UF, nc, nh + 0.3, EAVE_H, RIDGE_H, 1)
  solid(UF - 0.4, UF + 0.1, NV0 - 0.3, NV1 + 0.3, AISLE_EAVE, EAVE_H, stone, null, 3)
  cornice(UF - 0.4, UF + 0.1, NV0 - 0.3, NV1 + 0.3, EAVE_H, 0.5, 0.15)
  oculus(UF + 0.1, nc, 1, 0, 0, 13.4, 2.0)
  for (const t of [-3.4, 3.4]) win(UF + 0.1, nc, 1, 0, t, 11.2, 1.0, 3.2)
  solid(UF + 0.1, UF + POR_D, POR_V0 - 0.3, POR_V1 + 0.3, POR_H - 0.9, POR_H, trim, trim, 0)            // entablature
  for (const k of [0, 1, 2, 3]) {
    const v = POR_V0 + 0.2 + k * ((POR_V1 - POR_V0 - 0.4) / 3)
    solid(UF + 0.1, UF + POR_D, v - 0.3, v + 0.3, 0, POR_H - 0.9, shade(stone, 0.97), trim, 1)               // the four columns
  }
  decal(UF + 0.1, pc, 1, 0, 0.03, [[-ph, 0], [ph, 0], [ph, POR_H - 0.9], [-ph, POR_H - 0.9]], shade(stone, 0.8))   // the shaded recess behind
  gable('u', UF + POR_D + 0.08, pc, ph + 0.5, POR_H, POR_PED, 1, shade(trim, 0.82))
  doorway(UF + 0.1, pc, 1, 0, 0, 2.6, 5.4)
  for (const t of [-2.2, 2.2]) decal(UF + 0.1, pc, 1, 0, 0.04, [[t - 0.5, 4.8], [t + 0.5, 4.8], [t + 0.5, 6.8], [t - 0.5, 6.8]], shade(trim, 0.9))
  // north aisle bay: door and oculus, then a window under the eave
  const nac = (NV1 + N_V1) / 2
  solid(UF - 0.2, UF + 0.1, NV1, N_V1, 0, AISLE_EAVE, stone, null, 2)
  cornice(UF - 0.4, UF + 0.1, NV1 - 0.1, N_V1 + 0.1, AISLE_EAVE, 0.5, 0.15)
  doorway(UF + 0.1, nac, 1, 0, 0, 1.9, 3.9); oculus(UF + 0.1, nac, 1, 0, 0, 6.4, 1.0)
  win(UF + 0.1, nac, 1, 0, 0, 10.2, 1.0, 2.6)
  // ── the belfry tower at the south corner of the front ──
  const tuc = (TW_U0 + UF) / 2, tvc = (TW_V0 + TW_V1) / 2, hw = (UF - TW_U0) / 2, hv = (TW_V1 - TW_V0) / 2
  solid(TW_U0, UF, TW_V0, TW_V1, 0, TW_H, stone, null, 2.4)
  solid(TW_U0 - 0.1, UF + 0.1, TW_V1 - 0.1, NV0 + 0.1, 0, AISLE_EAVE, stone, null, 2)
  for (const [y, h, o] of [[AISLE_EAVE, 0.5, 0.2], [17.2, 0.5, 0.2], [22.2, 0.45, 0.2], [TW_STAGE, 0.5, 0.2], [TW_H, 0.9, 0.4]] as [number, number, number][]) cornice(TW_U0, UF, TW_V0, TW_V1, y, h, o)
  const faces: [number, number, number, number, number][] = [[UF, tvc, 1, 0, hv], [tuc, TW_V0, 0, -1, hw]]
  for (const [u, v, nu, nv, half] of faces) {
    if (nu === 1) { doorway(u, v, nu, nv, 0, 1.9, 4.2); oculus(u, v, nu, nv, 0, 6.4, 0.8) }
    win(u, v, nu, nv, 0, 11, half * 0.7, 4.8)                                                    // tall arched window, second stage
    decal(u, v, nu, nv, 0.05, [[-half * 0.6, 17.7], [half * 0.6, 17.7], [half * 0.6, 22], [-half * 0.6, 22]], shade(stone, 0.93))
    decal(u, v, nu, nv, 0.14, disc(0, 19.9, 1.15), trim); decal(u, v, nu, nv, 0.18, disc(0, 19.9, 0.95), clock)
    decal(u, v, nu, nv, 0.22, [[-0.05, 19.9], [0.05, 19.9], [0.05, 20.7], [-0.05, 20.7]], dark); decal(u, v, nu, nv, 0.22, [[0, 19.85], [0.5, 19.85], [0.5, 19.95], [0, 19.95]], dark)
    decal(u, v, nu, nv, 0.05, round(0, 23.0, half * 1.1, 4.6), trim)                            // belfry: one tall louvred arch
    decal(u, v, nu, nv, 0.1, round(0, 23.2, half * 1.1 - 0.5, 4.2), dark)
    for (let k = 0; k < 6; k++) decal(u, v, nu, nv, 0.13, [[-half * 0.55 + 0.2, 23.4 + k * 0.55], [half * 0.55 - 0.2, 23.4 + k * 0.55], [half * 0.55 - 0.2, 23.5 + k * 0.55], [-half * 0.55 + 0.2, 23.5 + k * 0.55]], shade(stone, 0.9))
  }
  const spot = (u: number, v: number): { x: number; z: number } => { const [e, n] = en(u, v); return F.xz(e, n) }
  const aU = Math.atan2(F.n([Math.cos((AXIS_DEG * Math.PI) / 180), Math.sin((AXIS_DEG * Math.PI) / 180), 0])[0], F.n([Math.cos((AXIS_DEG * Math.PI) / 180), Math.sin((AXIS_DEG * Math.PI) / 180), 0])[2]), y0 = F.y0
  const pt = spot(tuc, tvc), R = Math.max(hw, hv) * Math.SQRT2 * 1.06
  cyl(out, pt.x, pt.z, y0 + TW_H, y0 + TW_ROOF, R, 4, roofC, 0, R * 0.14, true, aU + Math.PI / 4)
  cyl(out, pt.x, pt.z, y0 + TW_ROOF - 0.2, y0 + TW_CROSS, 0.12, 4, dark, 0, 0.06, true, 0)
  cyl(out, pt.x, pt.z, y0 + TW_CROSS - 1.6, y0 + TW_CROSS - 1.4, 0.7, 4, dark, 0, 0.7, true, 0)

  // ── the street building beside the front (way/1457837352), a plain block ──
  T.prism(OTHER_OSM, 0, ANNEX2_H, hex(OTHER), hex(FLAT), 3)
}
