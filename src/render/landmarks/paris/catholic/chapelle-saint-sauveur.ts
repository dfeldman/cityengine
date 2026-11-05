/**
 * CHAPELLE SAINT-SAUVEUR / ÉGLISE MARONITE SAINTS-SAUVEUR-ET-MAROUN (former Maison de retraite des Ménages, now the
 * Corentin-Celton hospital garden, Issy-les-Moulineaux; OSM way/42268952, wikidata Q60387438). A cream-rendered
 * cruciform chapel, buttressed by shallow pilaster bays: a nave with lean-to aisle roofs, a gabled transept, a short
 * chancel with a three-sided apse, and a belfry tower with a slate spire at the west end (shown in scaffolding in the
 * Commons photos, docs/landmarks/refs/chapelle-saint-sauveur/). Plan and roof heights from the IGN LiDAR HD MNS
 * (nave ridge ~18.5 m, nave eaves ~14.5 m, aisle walls ~8.5 m, transept ridge ~18 m); the tower is photo-estimated
 * (the MNS shows no peak above the nave there). Drawn in the church's (u, v) frame — u along the nave from the tower
 * toward the apse, v across — turned AXIS_DEG from east, registered onto the footprint by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism as cyl } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = -47          // the nave's direction (tower toward the apse), degrees anticlockwise from east
const NAVE_U0 = -25, NAVE_U1 = 11              // nave and aisle block
const AIS_V0 = -6.4, AIS_V1 = 7.4              // outer aisle walls
const NV0 = -3.2, NV1 = 4.2                    // nave (clerestory) walls
const AIS_EAVE = 8.5, AIS_TOP = 13.2, NAVE_EAVE = 14.5, NAVE_RIDGE = 18.5
const TR_U0 = 11.2, TR_U1 = 21, TR_V0 = -9.6, TR_V1 = 9.8, TR_EAVE = 13.5, TR_RIDGE = 18
const CH_U1 = 25.2, CH_V0 = -4.7, CH_V1 = 4.8, CH_EAVE = 12.5, CH_RIDGE = 17, APSE_TIP = 29.5, APSE_HALF = 1.8
const TW_U0 = -26.4, TW_U1 = -20.2, TW_V0 = -2.8, TW_V1 = 3.8, TW_H = 25, SPIRE_TIP = 34
const BAY = 3.7, PIL_W = 0.55
const WALL = '#e6dabb', TRIM = '#efe6cf', ROOF = '#4a5058', GLASS = '#323a4e', DOOR = '#5a3a2a', DARK = '#26272c'

export const RING: P2[] = [[8.4, -21.4], [11.1, -18.7], [13.9, -21.5], [14.5, -22.1], [18.2, -22.2], [18.8, -22.8], [19.3, -22.4], [18.7, -21.7], [20.5, -20.1], [21.5, -20.3], [21, -19.7], [21.3, -15.9], [22, -15.3], [20.7, -15.3], [17.8, -12.1], [20.4, -9.7], [21.5, -8.7], [14.7, -1.1], [12.7, -2.9], [10.2, -0.2], [7.5, 2.7], [5, 5.5], [2.5, 8.2], [-0.2, 11.1], [-2.8, 13.9], [-5.4, 16.7], [-11.6, 23.3], [-13.3, 21.8], [-17.6, 19.7], [-20.4, 15.8], [-21.9, 14.1], [-16.1, 7.7], [-13.5, 5], [-10.9, 2.1], [-8.2, -0.7], [-5.6, -3.4], [-3.1, -6], [-0.5, -8.7], [3.2, -12.4], [-0.6, -16.1], [6.4, -23.3]]

export function chapelleSaintSauveur(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const wall: Rgb = hex(WALL), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK)
  const { en, P, solid, decal, round, disc, cornice, ridge, gable } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone: wall, trim, discN: 14, corniceH: 0.5, corniceOut: 0.25 })
  const win = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.04, round(t, y0 - 0.15, w + 0.5, h + 0.3), trim)
    decal(u, v, nu, nv, 0.09, round(t, y0, w, h), glass)
  }
  const ncv = (NV0 + NV1) / 2, nhalf = (NV1 - NV0) / 2

  // ── aisle block with lean-to slate roofs on both flanks ──
  solid(NAVE_U0, NAVE_U1, AIS_V0, NV0, 0, AIS_EAVE, wall, null, 3)
  solid(NAVE_U0, NAVE_U1, NV1, AIS_V1, 0, AIS_EAVE, wall, null, 3)
  for (const [vo, vi, s] of [[AIS_V0, NV0, -1], [AIS_V1, NV1, 1]] as [number, number, number][])
    T.poly([P(NAVE_U0 - 0.2, vo + s * 0.3, AIS_EAVE - 0.2), P(NAVE_U1 + 0.2, vo + s * 0.3, AIS_EAVE - 0.2), P(NAVE_U1 + 0.2, vi, AIS_TOP), P(NAVE_U0 - 0.2, vi, AIS_TOP)], roofC, [...en(0, s), 0.8] as [number, number, number])
  cornice(NAVE_U0, NAVE_U1, AIS_V0, AIS_V0 + 0.1, AIS_EAVE, 0.4, 0.2); cornice(NAVE_U0, NAVE_U1, AIS_V1 - 0.1, AIS_V1, AIS_EAVE, 0.4, 0.2)
  // ── nave clerestory and gable ──
  solid(NAVE_U0, NAVE_U1, NV0, NV1, AIS_TOP - 0.5, NAVE_EAVE, wall, null, 3)
  cornice(NAVE_U0, NAVE_U1, NV0, NV1, NAVE_EAVE, 0.5, 0.25)
  ridge('u', NAVE_U0, NAVE_U1, ncv, nhalf + 0.05, NAVE_EAVE, NAVE_RIDGE)
  gable('v', NAVE_U0 - 0.02, ncv, nhalf, NAVE_EAVE, NAVE_RIDGE, -1, wall)
  // pilaster bays and tall arched windows in the aisle walls and clerestory
  const nb = Math.round((NAVE_U1 - NAVE_U0 - 4) / BAY), bl = (NAVE_U1 - NAVE_U0 - 4) / nb
  for (let i = 0; i <= nb; i++) {
    const u = NAVE_U0 + 2 + i * bl
    solid(u - PIL_W / 2, u + PIL_W / 2, AIS_V0 - 0.3, AIS_V0, 0, AIS_EAVE, shade(wall, 0.96), trim, 1)
    solid(u - PIL_W / 2, u + PIL_W / 2, AIS_V1, AIS_V1 + 0.3, 0, AIS_EAVE, shade(wall, 0.96), trim, 1)
  }
  for (let i = 0; i < nb; i++) {
    const u = NAVE_U0 + 2 + (i + 0.5) * bl
    for (const s of [-1, 1]) {
      win(u, s > 0 ? AIS_V1 : AIS_V0, 0, s, 0, 2.2, 1.3, 4.6)
      if (u < NAVE_U1 - 2) win(u, s > 0 ? NV1 : NV0, 0, s, 0, AIS_TOP + 0.3, 1.2, 3.4)
    }
  }
  // ── transept: end walls with a tall window and a rose, slate gable ──
  const tc = (TR_V0 + TR_V1) / 2, th = (TR_V1 - TR_V0) / 2
  solid(TR_U0, TR_U1, TR_V0, TR_V1, 0, TR_EAVE, wall, null, 3)
  cornice(TR_U0, TR_U1, TR_V0, TR_V1, TR_EAVE, 0.5, 0.25)
  ridge('v', TR_V0, TR_V1, (TR_U0 + TR_U1) / 2, (TR_U1 - TR_U0) / 2 + 0.05, TR_EAVE, TR_RIDGE)
  for (const s of [-1, 1] as const) {
    const v = s > 0 ? TR_V1 : TR_V0, uc = (TR_U0 + TR_U1) / 2
    gable('u', v, uc, (TR_U1 - TR_U0) / 2, TR_EAVE, TR_RIDGE, s, wall)
    win(uc, v, 0, s, 0, 4.2, 1.8, 6.6)
    decal(uc, v, 0, s, 0.06, disc(0, 15.6, 1.2), trim); decal(uc, v, 0, s, 0.1, disc(0, 15.6, 0.95), glass)
  }
  void tc; void th
  // ── chancel and three-sided apse ──
  solid(TR_U1 - 0.2, CH_U1, CH_V0, CH_V1, 0, CH_EAVE, wall, null, 3)
  cornice(TR_U1 - 0.2, CH_U1, CH_V0, CH_V1, CH_EAVE, 0.45, 0.2)
  ridge('u', TR_U1 - 0.2, CH_U1, (CH_V0 + CH_V1) / 2, (CH_V1 - CH_V0) / 2 + 0.05, CH_EAVE, CH_RIDGE, 0.1)
  const cc = (CH_V0 + CH_V1) / 2
  const ap: P2[] = [[CH_U1, CH_V1], [(CH_U1 + APSE_TIP) / 2 + 0.8, cc + APSE_HALF], [APSE_TIP, cc + APSE_HALF], [APSE_TIP, cc - APSE_HALF], [(CH_U1 + APSE_TIP) / 2 + 0.8, cc - APSE_HALF], [CH_U1, CH_V0]]
  T.prism(ap.map(([u, v]) => en(u, v)), 0, CH_EAVE, wall, null, 3)
  const apTop = P((CH_U1 + APSE_TIP) / 2 - 0.3, cc, CH_RIDGE)
  for (let k = 0; k < ap.length - 1; k++) {
    const a = ap[k], b = ap[k + 1], mx = (a[0] + b[0]) / 2 - (CH_U1 + APSE_TIP) / 2, mv = (a[1] + b[1]) / 2 - cc
    T.poly([P(a[0], a[1], CH_EAVE - 0.1), P(b[0], b[1], CH_EAVE - 0.1), apTop], roofC, [...en(mx, mv), 0.8] as [number, number, number])
    if (k === 1 || k === 3) win((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, mx, mv, 0, 3.2, 1.2, 4.2)
  }
  win(APSE_TIP, cc, 1, 0, 0, 3.2, 1.2, 4.2)
  // ── west tower: rendered shaft, belfry louvres, slate octagonal spire ──
  const tcu = (TW_U0 + TW_U1) / 2, tcv = (TW_V0 + TW_V1) / 2
  solid(TW_U0, TW_U1, TW_V0, TW_V1, 0, TW_H, wall, null, 2.4)
  cornice(TW_U0, TW_U1, TW_V0, TW_V1, TW_H, 0.7, 0.3)
  cornice(TW_U0, TW_U1, TW_V0, TW_V1, 15.5, 0.35, 0.15)
  // front portal, rose in the gable, clock-less belfry arches on the four faces
  decal(TW_U0, tcv, -1, 0, 0.05, round(0, 0, 2.6, 4.6), trim); decal(TW_U0, tcv, -1, 0, 0.1, round(0, 0, 2.1, 4.1), door)
  win(TW_U0, tcv, -1, 0, 0, 7.2, 1.2, 3.2)
  for (const [u, v, nu, nv] of [[TW_U0, tcv, -1, 0], [TW_U1, tcv, 1, 0], [tcu, TW_V1, 0, 1], [tcu, TW_V0, 0, -1]] as [number, number, number, number][]) {
    decal(u, v, nu, nv, 0.05, round(0, 17.3, 2.3, 5.2), trim); decal(u, v, nu, nv, 0.1, round(0, 17.5, 1.8, 4.8), dark)
    for (let k = 0; k < 5; k++) decal(u, v, nu, nv, 0.13, [[-0.8, 17.9 + k * 0.6], [0.8, 17.9 + k * 0.6], [0.8, 18.0 + k * 0.6], [-0.8, 18.0 + k * 0.6]], shade(wall, 0.85))
  }
  const spot = (u: number, v: number): { x: number; z: number } => { const [e, n] = en(u, v); return F.xz(e, n) }
  const aU = Math.atan2(F.n([Math.cos((AXIS_DEG * Math.PI) / 180), Math.sin((AXIS_DEG * Math.PI) / 180), 0])[0], F.n([Math.cos((AXIS_DEG * Math.PI) / 180), Math.sin((AXIS_DEG * Math.PI) / 180), 0])[2])
  const y0 = F.y0, pc = spot(tcu, tcv)
  const R = Math.min(TW_U1 - TW_U0, TW_V1 - TW_V0) * 0.7
  cyl(out, pc.x, pc.z, y0 + TW_H, y0 + SPIRE_TIP - 1.5, R, 8, roofC, 0, 0.35, true, aU - Math.PI / 8)
  cyl(out, pc.x, pc.z, y0 + SPIRE_TIP - 1.6, y0 + SPIRE_TIP + 1.3, 0.1, 4, dark, 0, 0.02, true, 0)
}
