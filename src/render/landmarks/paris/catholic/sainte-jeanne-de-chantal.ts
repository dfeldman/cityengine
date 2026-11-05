/**
 * ÉGLISE SAINTE-JEANNE-DE-CHANTAL (96 boulevard Murat, place de la Porte-de-Saint-Cloud, 16e; OSM way/87959071 with the
 * separate bell tower way/87959097). A romano-byzantine parish church of 1933-38 (Julien Barbier; restored by Nicod):
 * grey-tan ashlar, a broad low-pitched gabled front with one huge round recess over the wooden doors, a crossing under a
 * stone drum and a ribbed zinc dome (~25 m), a transept, a nave closing in a half-round apse, side chapels, a round
 * baptistery with a green roof beside the front, and the independent slab belfry (~40 m, tall cross) at the left corner.
 * Heights from the IGN LiDAR MNS and OSM building:parts; photo: docs/landmarks/refs/ste-jeanne-chantal/front.jpg.
 * Frame: metres east/north of the two ways' box centre; u along the nave toward the apse (AXIS_DEG from east), v to the
 * left of someone facing +u (the tower is at +v, the baptistery at -v, seen from the front).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism as cyl } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ─────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 123.5
const U_F = -29.2, U_T0 = -5.2, U_T1 = 9.0                 // front wall, transept west and east faces
const FV0 = -17.1, FV1 = 12.8, FEAVE = 7, FRIDGE = 15      // the wide gabled front block
const TV0 = -18.4, TV1 = 14.3, TEAVE = 8.5, TRIDGE = 15    // transept
const NV = 7.6, NVC = -1.9, NEAVE = 11, NRIDGE = 15        // nave core half-width, axis v, eave, ridge
const CH_U = 24, CH_R = 9.5, CH_EAVE = 7.5, CH_TOP = 11.5, CH_V0 = -11.4, CH_V1 = 7.5   // chevet block: aisles round the apse
const DOME_C: P2 = [2.5, -1.8], DRUM_R = 9, DRUM_Y0 = 12, DRUM_Y1 = 20.5, DOME_TOP = 25.5, DOME_STEPS = 7
const TW_U0 = -26.6, TW_U1 = -21.1, TW_V0 = 14.4, TW_V1 = 19.4, TW_H = 40, TW_CROSS_TOP = 43.5, TW_CROSS_FOOT = 28.5
const BAP: P2 = [-23.6, -21], BAP_R = 3.3, BAP_H = 4.2, BAP_ROOF = 8
const ARCH_W = 8.4, ARCH_Y0 = 5.5, ARCH_H = 8.4, DOOR_W = 3.6, DOOR_H = 4.4
const STONE = '#9a958a', TRIM = '#aeaa9e', ROOF = '#5e564f', ZINC = '#3f4753', GLASS = '#2f3846', DOOR = '#85552f', DARK = '#3e392f', GREEN = '#5f8a72'

const CH: P2[] = [[-10.7, 30.1], [-10.8, 32.5], [-14.2, 32.4], [-14.2, 31.9], [-15.3, 31.8], [-16.1, 31.4], [-16.4, 30.2], [-15.7, 29.3], [-16.6, 28.8], [-17.4, 28.2], [-18.2, 27.6], [-18.8, 26.9], [-19.5, 26.0], [-20.0, 25.2], [-20.4, 24.3], [-20.7, 23.3], [-20.8, 22.3], [-20.9, 21.4], [-20.8, 20.3], [-20.7, 19.2], [-20.3, 18.0], [-19.7, 16.5], [-18.4, 14.6], [-23.3, 11.3], [-24.2, 10.6], [-28.0, 12.4], [-33.9, 1.0], [-27.2, -2.0], [-23.3, 5.5], [-20.5, 7.2], [-17.7, 3.0], [-15.8, 0.3], [-16.9, -0.4], [-16.0, -1.9], [-9.2, -12.1], [-7.9, -11.3], [-6.6, -13.3], [-2.3, -10.5], [-0.9, -12.6], [0.2, -14.2], [9.5, -28.8], [11.5, -27.4], [17.7, -23.3], [24.0, -19.0], [26.4, -17.4], [23.9, -13.9], [28.6, -10.8], [29.2, -11.1], [30.2, -11.4], [31.2, -11.3], [32.1, -11.0], [32.9, -10.5], [33.5, -9.7], [33.9, -8.8], [33.9, -7.8], [33.5, -6.4], [32.5, -5.3], [31.2, -4.8], [30.2, -4.7], [29.3, -5.0], [28.8, -5.2], [28.1, -5.9], [27.5, -6.7], [27.2, -8.1], [27.4, -9.1], [22.7, -12.2], [17.1, -4.1], [15.4, -1.7], [13.9, 0.4], [18.3, 3.4], [17.0, 5.1], [18.2, 5.8], [10.5, 17.5], [9.2, 16.7], [7.9, 18.9], [2.1, 27.5], [-2.8, 24.3], [-4.5, 26.8], [-5.2, 27.5], [-5.8, 28.1], [-6.8, 28.8], [-8.0, 29.5], [-8.7, 29.7], [-9.4, 29.9]]
const TW: P2[] = [[-1.0, -32.5], [-0.7, -32.3], [-1.0, -31.9], [1.7, -30.2], [1.9, -30.6], [2.2, -30.5], [1.9, -30.1], [2.3, -29.9], [2.1, -29.5], [1.6, -29.8], [-0.5, -26.5], [-0.2, -26.3], [-0.3, -26.0], [-0.7, -26.2], [-0.9, -25.9], [-1.1, -26.0], [-0.9, -26.4], [-3.2, -27.9], [-3.4, -27.5], [-3.7, -27.7], [-3.5, -28.0], [-3.9, -28.3], [-3.7, -28.6], [-3.5, -28.5], [-1.4, -31.8], [-1.7, -32.0], [-1.5, -32.3], [-1.2, -32.2]]
export const RING: P2[] = [...CH, ...TW]

export function sainteJeanneDeChantal(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), zinc: Rgb = hex(ZINC), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK), green: Rgb = hex(GREEN)
  const { en, P, solid, decal, round, disc, cornice, ridge } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 16, corniceH: 0.5, corniceOut: 0.25 })
  const spot = (u: number, v: number): { x: number; z: number } => { const [e, n] = en(u, v); return F.xz(e, n) }
  const y0 = F.y0
  const win = (u: number, v: number, nu: number, nv: number, t: number, y: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.04, round(t, y - 0.2, w + 0.5, h + 0.35), trim)
    decal(u, v, nu, nv, 0.09, round(t, y, w, h), glass)
  }
  /** a gable end in the plane u = u (outward s along u), centred at v = vc, half-width half */
  const gableU = (u: number, vc: number, half: number, hE: number, hR: number, s: 1 | -1): void =>
    T.poly([P(u, vc - half, hE), P(u, vc + half, hE), P(u, vc, hR)], stone, [...en(s, 0), 0] as V3)
  const gableV = (v: number, uc: number, half: number, hE: number, hR: number, s: 1 | -1): void =>
    T.poly([P(uc - half, v, hE), P(uc + half, v, hE), P(uc, v, hR)], stone, [...en(0, s), 0] as V3)
  /** a hipped roof over a box */
  const hip = (u0: number, u1: number, v0: number, v1: number, hE: number, hR: number, col: Rgb, over = 0.3): void => {
    const a0 = u0 - over, a1 = u1 + over, b0 = v0 - over, b1 = v1 + over, w = b1 - b0, l = a1 - a0, d = Math.min(w, l) / 2
    const alongU = l >= w
    const r0: [number, number] = alongU ? [a0 + d, (b0 + b1) / 2] : [(a0 + a1) / 2, b0 + d], r1: [number, number] = alongU ? [a1 - d, (b0 + b1) / 2] : [(a0 + a1) / 2, b1 - d]
    const c = [[a0, b0], [a1, b0], [a1, b1], [a0, b1]]
    const top = (p: [number, number]): V3 => P(p[0], p[1], hR)
    const side = (i: number, j: number, ta: [number, number], tb: [number, number], nu: number, nv: number): void =>
      T.poly([P(c[i][0], c[i][1], hE - 0.2), P(c[j][0], c[j][1], hE - 0.2), top(tb), top(ta)], col, [...en(nu, nv), 1] as V3)
    side(0, 1, r0, r1, 0, -1); side(1, 2, r1, r1, 1, 0); side(2, 3, r1, r0, 0, 1); side(3, 0, r0, r0, -1, 0)
  }

  // ── the wide front block: ashlar walls, a low gable roof, the gable end to the place ──
  const VC = (FV0 + FV1) / 2, HW = (FV1 - FV0) / 2
  solid(U_F, U_T0 + 0.5, FV0, FV1, 0, FEAVE, stone, null, 3)
  ridge('u', U_F, U_T0 + 0.5, VC, HW, FEAVE, FRIDGE, 0.5)
  gableU(U_F, VC, HW, FEAVE, FRIDGE, -1)
  cornice(U_F, U_T0, FV0, FV1, FEAVE, 0.45, 0.2)
  // portal: a dark frame, two wooden leaves, a transom; the huge round recess above, banded by a trim arch
  decal(U_F, VC, -1, 0, 0.05, round(0, ARCH_Y0 - 0.3, ARCH_W + 1.6, ARCH_H + 0.9), trim)
  decal(U_F, VC, -1, 0, 0.09, round(0, ARCH_Y0, ARCH_W, ARCH_H), dark)
  decal(U_F, VC, -1, 0, 0.12, round(0, ARCH_Y0 + 0.5, ARCH_W - 1.6, ARCH_H - 1.0), shade(dark, 1.25))
  decal(U_F, VC, -1, 0, 0.14, [[-ARCH_W / 2 + 0.8, 0], [ARCH_W / 2 - 0.8, 0], [ARCH_W / 2 - 0.8, ARCH_Y0 + 0.6], [-ARCH_W / 2 + 0.8, ARCH_Y0 + 0.6]], dark)
  decal(U_F, VC, -1, 0, 0.16, [[-DOOR_W / 2 - 0.5, 0], [DOOR_W / 2 + 0.5, 0], [DOOR_W / 2 + 0.5, DOOR_H + 0.9], [-DOOR_W / 2 - 0.5, DOOR_H + 0.9]], shade(dark, 0.8))
  for (const s of [-1, 1]) decal(U_F, VC, -1, 0, 0.2, [[s * 0.04, 0], [s * (DOOR_W / 2), 0], [s * (DOOR_W / 2), DOOR_H], [s * 0.04, DOOR_H]], door)
  decal(U_F, VC, -1, 0, 0.2, [[-DOOR_W / 2, DOOR_H + 0.1], [DOOR_W / 2, DOOR_H + 0.1], [DOOR_W / 2, DOOR_H + 0.7], [-DOOR_W / 2, DOOR_H + 0.7]], glass)
  for (const s of [-1, 1]) {      // shallow piers between the recess and the corners, rising to the eave line
    solid(U_F - 0.35, U_F, VC + s * 7.6 - 0.5, VC + s * 7.6 + 0.5, 0, FEAVE + 0.4, shade(stone, 1.04), trim, 2)
    solid(U_F - 0.35, U_F, VC + s * (HW - 0.5) - 0.5, VC + s * (HW - 0.5) + 0.5, 0, FEAVE + 0.4, shade(stone, 1.04), trim, 2)
  }
  // flank walls of the front block: tall round windows
  for (const [v, nv] of [[FV0, -1], [FV1, 1]] as [number, number][])
    for (let u = U_F + 5; u < U_T0 - 2; u += 4.6) win(u, v, 0, nv, 0, 2.6, 1.1, 3.2)
  // ── transept ──
  const tc = (U_T0 + U_T1) / 2, th = (U_T1 - U_T0) / 2
  solid(U_T0, U_T1, TV0, TV1, 0, TEAVE, stone, null, 3)
  ridge('v', TV0, TV1, tc, th, TEAVE, TRIDGE, 0.5)
  for (const [v, s] of [[TV0, -1], [TV1, 1]] as [number, 1 | -1][]) {
    gableV(v, tc, th, TEAVE, TRIDGE, s)
    cornice(U_T0, U_T1, s < 0 ? v : v - 0.1, s < 0 ? v + 0.1 : v, TEAVE, 0.4, 0.2)
    win(tc, v, 0, s, 0, 2.8, 2.0, 5.0)
    decal(tc, v, 0, s, 0.06, disc(0, 11.8, 1.1), trim); decal(tc, v, 0, s, 0.1, disc(0, 11.8, 0.85), glass)
  }
  // ── crossing, drum and dome ──
  solid(-7, 12.1, -11.8, 7.6, 0, 14, stone, null, 3)
  const DN = 16, ring = (r: number): P2[] => Array.from({ length: DN }, (_, i) => { const a = ((i + 0.5) / DN) * Math.PI * 2; return en(DOME_C[0] + r * Math.cos(a), DOME_C[1] + r * Math.sin(a)) })
  T.prism(ring(DRUM_R), DRUM_Y0, DRUM_Y1, stone, trim, 3)
  T.prism(ring(DRUM_R + 0.35), DRUM_Y1 - 0.6, DRUM_Y1, trim, trim, 0)
  const rf = DRUM_R * Math.cos(Math.PI / DN)
  for (let i = 0; i < DN; i++) {      // drum windows: a row of small round-headed lights on each facet
    const a = ((i + 0.5) / DN) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a)
    win(DOME_C[0] + rf * c, DOME_C[1] + rf * s, c, s, 0, 16.2, 0.9, 2.4)
  }
  const dc = spot(DOME_C[0], DOME_C[1]), K = DOME_STEPS, rd = DRUM_R + 0.2
  for (let k = 0; k < K; k++) {      // a slightly flattened dome in zinc: stacked frusta on a spherical profile
    const f0 = k / K, f1 = (k + 1) / K
    const r0 = rd * Math.cos(f0 * Math.PI / 2), r1 = rd * Math.cos(f1 * Math.PI / 2)
    cyl(out, dc.x, dc.z, y0 + DRUM_Y1 + (DOME_TOP - DRUM_Y1) * Math.sin(f0 * Math.PI / 2), y0 + DRUM_Y1 + (DOME_TOP - DRUM_Y1) * Math.sin(f1 * Math.PI / 2), r0, 24, k % 2 ? zinc : shade(zinc, 1.08), 0, Math.max(r1, 0.05), true, 0)
  }
  cyl(out, dc.x, dc.z, y0 + DOME_TOP - 0.2, y0 + DOME_TOP + 1.2, 0.25, 6, dark, 0, 0.05, true, 0)
  // ── nave, chevet with the half-round apse ──
  solid(U_T1 - 0.2, CH_U, NVC - NV, NVC + NV, 0, NEAVE, stone, null, 3)
  ridge('u', U_T1 - 0.2, CH_U, NVC, NV, NEAVE, NRIDGE, 0.3)
  solid(U_T1 - 0.2, CH_U, CH_V0, CH_V1, 0, CH_EAVE, stone, null, 3)
  T.poly([P(U_T1, CH_V1 + 0.3, CH_EAVE - 0.2), P(CH_U, CH_V1 + 0.3, CH_EAVE - 0.2), P(CH_U, NVC + NV, CH_TOP), P(U_T1, NVC + NV, CH_TOP)], roofC, [...en(0, 1), 1] as V3)
  T.poly([P(U_T1, CH_V0 - 0.3, CH_EAVE - 0.2), P(CH_U, CH_V0 - 0.3, CH_EAVE - 0.2), P(CH_U, NVC - NV, CH_TOP), P(U_T1, NVC - NV, CH_TOP)], roofC, [...en(0, -1), 1] as V3)
  const AN = 8, aq = (k: number, r: number): P2 => { const a = -Math.PI / 2 + (k / AN) * Math.PI; return [CH_U + r * Math.cos(a), NVC + r * Math.sin(a)] }
  const apseRing = (r: number): P2[] => { const p: P2[] = []; for (let k = 0; k <= AN; k++) p.push(en(...aq(k, r))); return p }
  T.prism([...apseRing(NV), en(CH_U, NVC - NV)].reverse(), NEAVE - 0.5, NEAVE, stone, null, 0)
  for (let k = 0; k < AN; k++) {
    const a = aq(k, NV + 0.3), b = aq(k + 1, NV + 0.3), mid = -Math.PI / 2 + ((k + 0.5) / AN) * Math.PI
    T.poly([P(a[0], a[1], NEAVE - 0.2), P(b[0], b[1], NEAVE - 0.2), P(CH_U, NVC, NRIDGE + 0.4)], roofC, [...en(Math.cos(mid), Math.sin(mid)), 1] as V3)
  }
  const outer: P2[] = []; for (let k = 0; k <= AN; k++) outer.push(en(...aq(k, CH_R)))
  T.prism([...outer, en(CH_U, NVC - CH_R)].reverse(), 0, CH_EAVE, stone, null, 3)
  for (let k = 0; k < AN; k++) {
    const a = aq(k, CH_R + 0.3), b = aq(k + 1, CH_R + 0.3), mid = -Math.PI / 2 + ((k + 0.5) / AN) * Math.PI
    T.poly([P(a[0], a[1], CH_EAVE - 0.2), P(b[0], b[1], CH_EAVE - 0.2), P(CH_U, NVC, CH_TOP)], roofC, [...en(Math.cos(mid), Math.sin(mid)), 1] as V3)
    const rm = CH_R * Math.cos(Math.PI / (2 * AN))
    win(CH_U + rm * Math.cos(mid), NVC + rm * Math.sin(mid), Math.cos(mid), Math.sin(mid), 0, 2.4, 0.9, 3.0)
  }
  for (let u = U_T1 + 3; u < CH_U - 1; u += 4.5) for (const [v, nv] of [[NVC + NV, 1], [NVC - NV, -1]] as [number, number][]) win(u, v, 0, nv, 0, NEAVE - 5.2, 1.0, 3.4)
  // ── side chapels (hipped), the wing at the left, the low links ──
  solid(11.4, 21.8, -17, -11.1, 0, 7.2, stone, null, 3); hip(11.4, 21.8, -17, -11.1, 7.2, 9.4, roofC)
  solid(12.2, 22.3, 7.3, 13.2, 0, 7.2, stone, null, 3); hip(12.2, 22.3, 7.3, 13.2, 7.2, 9.4, roofC)
  solid(13.3, 25.8, 13.1, 27.7, 0, 8.6, stone, null, 3); hip(13.3, 25.8, 13.1, 27.7, 8.6, 11.2, roofC)
  solid(8.8, 13.6, 5.6, 13.1, 0, 5.4, stone, trim, 2); solid(8.8, 13.4, -17, -9.4, 0, 5.4, stone, trim, 2)
  // ── the baptistery: a round stone room with a green conical roof, joined to the front block by a low neck ──
  const bp = spot(BAP[0], BAP[1])
  solid(-24.8, -22.7, -17.9, -12.2, 0, BAP_H - 0.4, stone, trim, 2)
  cyl(out, bp.x, bp.z, y0, y0 + BAP_H, BAP_R, 16, shade(stone, 1.02), 0, BAP_R, true, 0)
  cyl(out, bp.x, bp.z, y0 + BAP_H, y0 + BAP_ROOF, BAP_R + 0.4, 16, green, 0, 0.12, true, 0)
  // ── the independent belfry: a slab of ashlar with two louvred slots and a tall cross standing on the front face ──
  const tcv = (TW_V0 + TW_V1) / 2, tcu = (TW_U0 + TW_U1) / 2
  solid(TW_U0, TW_U1, TW_V0, TW_V1, 0, TW_H, stone, null, 2.4)
  solid(TW_U0 - 0.25, TW_U1 + 0.25, TW_V0 - 0.25, TW_V1 + 0.25, TW_H - 0.1, TW_H + 0.7, trim, trim, 0)
  for (const [u, v, nu, nv, hw] of [[TW_U0, tcv, -1, 0, (TW_V1 - TW_V0) / 2], [TW_U1, tcv, 1, 0, (TW_V1 - TW_V0) / 2], [tcu, TW_V0, 0, -1, (TW_U1 - TW_U0) / 2], [tcu, TW_V1, 0, 1, (TW_U1 - TW_U0) / 2]] as [number, number, number, number, number][]) {
    decal(u, v, nu, nv, 0.04, [[-hw + 0.1, 0], [-hw + 0.5, 0], [-hw + 0.5, TW_H - 0.3], [-hw + 0.1, TW_H - 0.3]], trim)
    decal(u, v, nu, nv, 0.04, [[hw - 0.5, 0], [hw - 0.1, 0], [hw - 0.1, TW_H - 0.3], [hw - 0.5, TW_H - 0.3]], trim)
    for (const t of [-hw * 0.5, hw * 0.5]) {
      decal(u, v, nu, nv, 0.06, [[t - 0.45, 31], [t + 0.45, 31], [t + 0.45, 39], [t - 0.45, 39]], dark)
      for (let k = 0; k < 8; k++) decal(u, v, nu, nv, 0.1, [[t - 0.42, 31.2 + k], [t + 0.42, 31.2 + k], [t + 0.42, 31.55 + k], [t - 0.42, 31.55 + k]], shade(stone, 0.9))
    }
  }
  // the cross: a long upright on the front face rising above the roof, one arm
  solid(TW_U0 - 0.5, TW_U0, tcv - 0.2, tcv + 0.2, TW_CROSS_FOOT, TW_CROSS_TOP, shade(stone, 1.08), trim, 0)
  solid(TW_U0 - 0.5, TW_U0, tcv - 1.3, tcv + 1.3, TW_CROSS_TOP - 1.7, TW_CROSS_TOP - 1.2, shade(stone, 1.08), trim, 0)
  void green
}
