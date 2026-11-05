/**
 * CHAPELLE DE CONFLANS (Charenton-le-Pont, Sacré-Cœur seminary park; OSM way/149268044). A neo-Gothic chapel of buff
 * limestone: a long nave under a slate gable, a transept with a gabled front to the south-west (pointed portal with
 * banded jambs, a round window over it, stair, corner buttresses), low chapels flanking the polygonal apse, and a
 * slate apse roof with a cross. Measured from the IGN LiDAR HD surface model (docs/landmarks/MODEL-CHAPELLE-DE-CONFLANS.md,
 * refs/chapelle-de-conflans/): nave eave ~15 m, ridge ~18.4 m, transept ridge ~17.4 m, low chapels ~11 m. The north-west
 * end of the nave runs into the seminary block (23 m, not modelled). Frame: u along the nave toward the apse (south-east),
 * v across (north-east), origin the footprint's bounding-box centre, registered by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, chapel frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = -43                       // nave direction, degrees anticlockwise from east (towards the apse, south-east)
const U_W = -24.6, U_AP = 19.3             // west end of the nave; centre of the apse
const NAVE_V = 8.5                         // half-width of the nave
const EAVE = 15.2, RIDGE = 18.4
const BAY = 4.9                            // lancet / buttress rhythm along the nave
const LANCET_Y0 = 3.9, LANCET_H = 8.2, LANCET_W = 2.3, ROUND_Y = 12.9
const TR_C = 4.5, TR_HALF = 6.0, TR_V0 = -19.2, TR_V1 = 14.4, TR_EAVE = 11.8, TR_RIDGE = 17.4
const PORTAL_Y = 1.8, PORTAL_W = 4.4, PORTAL_H = 7.2, DOOR_W = 2.8, DOOR_H = 3.9, OCULUS_Y = 10.2, OCULUS_R = 1.7
const APSE_R = 8.0, APSE_N = 5, APSE_PEAK = 18.6, APSE_EAVE = 14.8
const LOW_H = 10.8                         // flanking chapels
const STONE = '#cfc3a4', TRIM = '#ddd2b6', ROOF = '#3d4650', GLASS = '#232b3b', DOOR = '#46301f'

export const RING: P2[] = [[-7.3, -18.3], [-2.8, -22.4], [-3.4, -23.1], [-2.8, -23.6], [-2.3, -23.0], [-1.6, -23.6], [-1.0, -23.0], [-1.7, -22.4], [1.8, -18.5], [2.1, -19.3], [3.0, -19.9], [3.7, -20.0], [4.5, -19.8], [5.1, -19.2], [5.6, -19.6], [5.9, -19.3], [6.5, -19.8], [7.1, -19.3], [6.4, -18.6], [8.1, -16.7], [10.0, -18.4], [9.4, -19.1], [9.9, -19.5], [10.4, -19.0], [11.1, -19.5], [11.7, -18.8], [11.0, -18.2], [12.9, -16.2], [15.2, -18.2], [14.9, -19.0], [15.6, -19.3], [16.0, -18.3], [19.0, -18.2], [19.4, -19.0], [20.1, -18.5], [19.7, -17.7], [21.7, -15.6], [22.6, -15.9], [22.9, -15.1], [22.1, -14.7], [21.7, -11.7], [22.6, -11.3], [22.3, -10.6], [21.3, -11.0], [19.3, -9.2], [21.2, -6.9], [21.9, -7.6], [22.4, -6.9], [21.8, -6.5], [22.3, -5.7], [21.7, -5.1], [21.2, -5.8], [19.3, -4.1], [21.1, -2.3], [21.8, -2.6], [22.3, -2.1], [21.7, -1.6], [22.3, -0.9], [21.6, -0.4], [21.0, -1.0], [19.0, 0.8], [19.6, 1.5], [18.8, 2.2], [18.5, 1.6], [13.3, 6.1], [13.7, 6.8], [13.0, 7.4], [12.4, 6.7], [10.3, 8.5], [10.8, 9.3], [10.3, 9.8], [9.7, 9.1], [9.2, 9.5], [8.8, 9.0], [9.3, 8.5], [7.5, 6.5], [-11.7, 23.6], [-22.9, 11.2], [-8.0, -2.3], [0.2, -9.6]]

export function chapelleDeConflans(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR)
  const { en, P, solid, decal, pointed, disc, cornice, ridge, gable } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 14, corniceH: 0.6, corniceOut: 0.25 })
  const lancet = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.04, pointed(t, y0 - 0.2, w + 0.7, h + 0.45), trim)
    decal(u, v, nu, nv, 0.09, pointed(t, y0, w, h), glass)
    decal(u, v, nu, nv, 0.13, [[t - 0.05, y0], [t + 0.05, y0], [t + 0.05, y0 + h * 0.75], [t - 0.05, y0 + h * 0.75]], trim)
  }
  const buttress = (u: number, v: number, s: number, h: number, depth = 0.9): void => {
    solid(u - 0.4, u + 0.4, s > 0 ? v : v - depth, s > 0 ? v + depth : v, 0, h, shade(stone, 0.97), trim, 2)
    solid(u - 0.5, u + 0.5, s > 0 ? v + depth - 0.4 : v - depth, s > 0 ? v + depth : v - depth + 0.4, h - 0.1, h + 1.3, trim, trim, 0)
  }

  // ── nave: walls, cornice, slate gable roof, lancets over a plinth, round windows under the eaves ──
  solid(U_W, U_AP, -NAVE_V, NAVE_V, 0, EAVE, stone, null, 3)
  cornice(U_W, U_AP, -NAVE_V, NAVE_V, EAVE, 0.6, 0.3)
  ridge('u', U_W, U_AP, 0, NAVE_V + 0.3, EAVE, RIDGE, 0.2)
  gable('u', U_W, 0, NAVE_V + 0.3, EAVE, RIDGE, -1)
  const nb = Math.round((U_AP - U_W) / BAY), bl = (U_AP - U_W) / nb
  for (let i = 0; i <= nb; i++) for (const s of [-1, 1]) {
    const u = U_W + i * bl
    if (u > TR_C - TR_HALF - 1.2 && u < TR_C + TR_HALF + 1.2) continue
    if (i > 0 && i < nb) buttress(u, s * NAVE_V, s, EAVE - 1.5)
  }
  for (let i = 0; i < nb; i++) {
    const u = U_W + (i + 0.5) * bl
    if (u > TR_C - TR_HALF - 1.2 && u < TR_C + TR_HALF + 1.2) continue
    for (const s of [-1, 1]) {
      lancet(u, s * NAVE_V, 0, s, 0, LANCET_Y0, LANCET_W, LANCET_H)
      decal(u, s * NAVE_V, 0, s, 0.05, [[-0.8, ROUND_Y], [0.8, ROUND_Y], [0.8, ROUND_Y + 1.5], [-0.8, ROUND_Y + 1.5]], trim)
      decal(u, s * NAVE_V, 0, s, 0.1, [[-0.6, ROUND_Y + 0.2], [0.6, ROUND_Y + 0.2], [0.6, ROUND_Y + 1.3], [-0.6, ROUND_Y + 1.3]], glass)
    }
  }

  // ── transept: walls, gabled slate roof along v, gabled ends, portal front to the south-west ──
  const t0 = TR_C - TR_HALF, t1 = TR_C + TR_HALF
  solid(t0, t1, TR_V0, TR_V1, 0, TR_EAVE, stone, null, 3)
  cornice(t0, t1, TR_V0, TR_V1, TR_EAVE, 0.55, 0.25)
  ridge('v', TR_V0, TR_V1, TR_C, TR_HALF + 0.3, TR_EAVE, TR_RIDGE, 0.2)
  for (const s of [-1, 1] as const) {
    const v = s < 0 ? TR_V0 : TR_V1
    gable('v', v, TR_C, TR_HALF + 0.3, TR_EAVE, TR_RIDGE, s)
    for (const e of [t0, t1]) { buttress(e, v, s, TR_EAVE - 0.8, 0.9); solid(e - 0.5, e + 0.5, s < 0 ? v - 0.9 : v, s < 0 ? v : v + 0.9, TR_EAVE + 0.5, TR_EAVE + 2.0, trim, trim, 0) }
  }
  // portal (south-west front): jambs, pointed arch, tympanum, doors, oculus, flanking lancets, stair
  const pv = TR_V0
  decal(TR_C, pv, 0, -1, 0.05, pointed(0, PORTAL_Y, PORTAL_W + 1.0, PORTAL_H + 0.8), trim)
  decal(TR_C, pv, 0, -1, 0.1, pointed(0, PORTAL_Y, PORTAL_W, PORTAL_H), shade(stone, 0.9))
  decal(TR_C, pv, 0, -1, 0.15, pointed(0, PORTAL_Y + DOOR_H, DOOR_W + 0.3, PORTAL_H - DOOR_H - 0.5), trim)
  decal(TR_C, pv, 0, -1, 0.18, [[-DOOR_W / 2, PORTAL_Y], [DOOR_W / 2, PORTAL_Y], [DOOR_W / 2, PORTAL_Y + DOOR_H], [-DOOR_W / 2, PORTAL_Y + DOOR_H]], door)
  for (const t of [-1.9, -1.55, 1.55, 1.9]) decal(TR_C, pv, 0, -1, 0.2, [[t - 0.08, PORTAL_Y], [t + 0.08, PORTAL_Y], [t + 0.08, PORTAL_Y + DOOR_H + 0.4], [t - 0.08, PORTAL_Y + DOOR_H + 0.4]], trim)
  decal(TR_C, pv, 0, -1, 0.06, disc(0, OCULUS_Y, OCULUS_R + 0.35), trim); decal(TR_C, pv, 0, -1, 0.1, disc(0, OCULUS_Y, OCULUS_R), glass)
  for (let k = 0; k < 8; k++) solid(TR_C - 3.4 + k * 0.1, TR_C + 3.4 - k * 0.1, pv - 0.4 - k * 0.3, pv - 0.1 - (k - 1) * 0.3 + (k === 0 ? 0.3 : 0), 0, PORTAL_Y - k * 0.2, shade(stone, 0.93), shade(stone, 0.88), 0)
  lancet(TR_C - 3.7, pv, 0, -1, 0, 5.2, 0.7, 2.4)
  // north-east end: a plain pair of lancets and the oculus
  lancet(TR_C - 1.6, TR_V1, 0, 1, 0, 5.2, 1.5, 6.4); lancet(TR_C + 1.6, TR_V1, 0, 1, 0, 5.2, 1.5, 6.4)
  decal(TR_C, TR_V1, 0, 1, 0.06, disc(0, 12.2, 1.4), trim); decal(TR_C, TR_V1, 0, 1, 0.1, disc(0, 12.2, 1.1), glass)
  // transept side walls: lancets
  for (const s of [-1, 1]) for (const u of [t0 + 0.0, t1 + 0.0]) void s, void u

  // ── low chapels flanking the apse (and the transept's east flank), ~11 m, lean-to slate ──
  const low = (u0: number, u1: number, v0: number, v1: number, s: number): void => {
    solid(u0, u1, v0, v1, 0, LOW_H, stone, null, 3)
    cornice(u0, u1, v0, v1, LOW_H, 0.45, 0.2)
    T.poly([P(u0, s > 0 ? v0 : v1, LOW_H + 0.1), P(u1, s > 0 ? v0 : v1, LOW_H + 0.1), P(u1, s > 0 ? v1 : v0, LOW_H + 0.9), P(u0, s > 0 ? v1 : v0, LOW_H + 0.9)], roofC, [0, 0, 1] as V3)
    for (let u = u0 + 2.2; u < u1 - 1; u += 3.4) lancet(u, s > 0 ? v1 : v0, 0, s, 0, 3.6, 1.4, 4.8)
  }
  low(t1, U_AP, NAVE_V, NAVE_V + 5.0, 1)
  low(t1, U_AP - 3.5, -NAVE_V - 4.4, -NAVE_V, -1)
  low(t1, t1 + 4.6, TR_V0, -NAVE_V - 4.4, -1)

  // ── apse: half-polygon, slate cone with cross, tall lancets between buttresses ──
  const Rc = APSE_R / Math.cos(Math.PI / (2 * APSE_N))
  const aq = (k: number, r: number): P2 => { const a = -Math.PI / 2 + (k / APSE_N) * Math.PI; return [U_AP + r * Math.cos(a), r * Math.sin(a)] }
  const apse: P2[] = [[U_AP, NAVE_V], [U_AP, -NAVE_V]]
  for (let k = 0; k <= APSE_N; k++) apse.unshift(aq(k, Rc))
  T.prism(apse.map(([u, v]) => en(u, v)), 0, APSE_EAVE, stone, null, 3)
  for (let k = 0; k < APSE_N; k++) {
    const a = aq(k, Rc + 0.3), b = aq(k + 1, Rc + 0.3), mid = -Math.PI / 2 + ((k + 0.5) / APSE_N) * Math.PI
    T.poly([P(a[0], a[1], APSE_EAVE - 0.1), P(b[0], b[1], APSE_EAVE - 0.1), P(U_AP, 0, APSE_PEAK)], roofC, [...en(Math.cos(mid), Math.sin(mid)), 0.8] as V3)
    const cu = U_AP + Rc * Math.cos(mid) * Math.cos(Math.PI / (2 * APSE_N)), cv = Rc * Math.sin(mid) * Math.cos(Math.PI / (2 * APSE_N))
    lancet(cu, cv, Math.cos(mid), Math.sin(mid), 0, 3.9, 2.4, 8.4)
    const pa = aq(k, Rc + 0.1)
    buttress(pa[0], pa[1], 1, APSE_EAVE - 1.2, 0.0)
  }
  { const pa = aq(APSE_N, Rc + 0.1); buttress(pa[0], pa[1], 1, APSE_EAVE - 1.2, 0.0) }
  // cross on the apse roof
  solid(U_AP - 0.07, U_AP + 0.07, -0.07, 0.07, APSE_PEAK, APSE_PEAK + 2.4, trim, trim, 0)
  solid(U_AP - 0.07, U_AP + 0.07, -0.55, 0.55, APSE_PEAK + 1.5, APSE_PEAK + 1.65, trim, trim, 0)
  void door
}
