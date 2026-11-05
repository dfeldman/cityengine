/**
 * ÉGLISE SAINTE-CÉCILE (44 rue de l'Est, Boulogne-Billancourt; OSM relation/1074310). A small 1900s neo-classical parish
 * church in cream stucco on a raised parvis: a pedimented west-front block (rose window, three arched lights, portal
 * under a lunette with an iron trellis, a cross on a plinth) between two low lean-to wings with side doors, a slate
 * nave under a shallow gable, a broader south half and a rounded apse. Heights from the IGN LiDAR HD MNS
 * (nave ridge 16.5 m, aisles 9 m). Photos: docs/landmarks/refs/sainte-cecile-boulogne/ (Commons, 2026-11-05).
 * Frame: u along the nave from the front (north) toward the apse (south), v across (east positive); registered by enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = -70            // nave direction (front toward the apse), degrees anticlockwise from east
const U_F = -17, U_END = 14, U_SPLIT = 1          // front wall; end of the rectangular body; where the south half widens
const NAVE_V = 4.7, W_V = 9.0, E_V = 10.4, E_HI_V = 8.0   // nave half-width; west / east outer walls; east high block edge
const EAVE_H = 14.6, RIDGE_H = 16.5               // nave
const AISLE_EAVE = 7.0, AISLE_TOP = 9.0           // lean-to wings
const TERR = 2.8, TERR_D = 3.3                    // parvis height and depth
const APSE_R = 4.2, APSE_CV = 1.6, APSE_ROOF = 2.6
const BAY = 4.6
const CREAM = '#e6d6a6', TRIM = '#efe0b0', ROOF = '#6d727a', GLASS = '#2d3a4a', DOOR = '#2f4a3e', DARK = '#26272c', RAIL = '#1f2a24'

export const RING: P2[] = [[-12.0, 13.5], [-4.3, -13.7], [-1.0, -12.7], [-0.7, -13.7], [1.9, -15.3], [5.2, -14.4], [6.6, -12.0], [6.3, -10.7], [9.4, -9.8], [10.5, -14.0], [15.3, -12.7], [6.4, 20.4], [3.0, 19.4], [1.4, 18.9], [1.8, 17.4], [-5.1, 15.5]]

export function sainteCecileBoulogne(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const cream: Rgb = hex(CREAM), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK), rail: Rgb = hex(RAIL)
  const { en, P, solid, decal, round, cornice, ridge } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone: cream, trim, discN: 18, corniceH: 0.45, corniceOut: 0.25 })
  const arch = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.04, round(t, y0 - 0.15, w + 0.45, h + 0.3), trim)
    decal(u, v, nu, nv, 0.09, round(t, y0, w, h), glass)
    decal(u, v, nu, nv, 0.13, [[t - 0.05, y0], [t + 0.05, y0], [t + 0.05, y0 + h * 0.8], [t - 0.05, y0 + h * 0.8]], trim)
  }
  const slope = (u0: number, u1: number, v0: number, v1: number, h0: number, h1: number, nv: number): void =>
    T.poly([P(u0 - 0.3, v0, h0), P(u1 + 0.3, v0, h0), P(u1 + 0.3, v1, h1), P(u0 - 0.3, v1, h1)], roofC, [...en(0, nv), 0.8] as V3)

  // ── west wing (low, narrow) and east wing, lean-to slate roofs ──
  solid(U_F, U_SPLIT, -W_V, -NAVE_V, 0, AISLE_EAVE, cream, null, 2)
  slope(U_F, U_SPLIT, -W_V - 0.3, -NAVE_V, AISLE_EAVE - 0.2, AISLE_TOP, -1)
  solid(U_F, U_SPLIT, NAVE_V, E_V, 0, AISLE_EAVE, cream, null, 2)
  slope(U_F, U_SPLIT, E_V + 0.3, NAVE_V, AISLE_EAVE - 0.2, AISLE_TOP, 1)
  // ── nave: walls, shallow slate gable roof, round-headed clerestory lights ──
  solid(U_F, U_SPLIT, -NAVE_V, NAVE_V, AISLE_TOP - 0.5, EAVE_H, cream, null, 2)
  cornice(U_F, U_SPLIT, -NAVE_V, NAVE_V, EAVE_H, 0.45, 0.25)
  // ── south half: a broader high block on the east, then the apse ──
  solid(U_SPLIT, U_END, -NAVE_V, E_HI_V, 0, EAVE_H, cream, null, 2)
  cornice(U_SPLIT, U_END, -NAVE_V, E_HI_V, EAVE_H, 0.45, 0.25)
  const vc = (E_HI_V - NAVE_V) / 2, vh = (E_HI_V + NAVE_V) / 2
  ridge('u', U_SPLIT, U_END, vc, vh, EAVE_H, RIDGE_H)
  ridge('u', U_F, U_SPLIT, 0, NAVE_V + 0.1, EAVE_H, RIDGE_H)
  solid(U_SPLIT, U_END, E_HI_V, E_V, 0, AISLE_EAVE, cream, null, 2)
  slope(U_SPLIT, U_END, E_V + 0.3, E_HI_V, AISLE_EAVE - 0.2, AISLE_TOP + 1, 1)
  // the step where the wide roof meets the narrow one: a cream end wall under the roofs
  solid(U_SPLIT - 0.1, U_SPLIT + 0.1, NAVE_V, E_HI_V, AISLE_TOP - 0.5, EAVE_H + 0.9, cream, null, 2)
  // apse: half-octagon at the south end with a low slate cone
  const AN = 4, aq = (k: number, r: number): P2 => { const a = -Math.PI / 2 + (k / AN) * Math.PI; return [U_END + r * Math.cos(a), APSE_CV + r * Math.sin(a)] }
  const apse: P2[] = [[U_END, APSE_CV + APSE_R], [U_END, APSE_CV - APSE_R]]
  for (let k = 0; k <= AN; k++) apse.unshift(aq(k, APSE_R))
  T.prism(apse.map(([u, v]) => en(u, v)), 0, EAVE_H - 1.5, cream, null, 2)
  for (let k = 0; k < AN; k++) {
    const a = aq(k, APSE_R + 0.3), b = aq(k + 1, APSE_R + 0.3), mid = -Math.PI / 2 + ((k + 0.5) / AN) * Math.PI
    T.poly([P(a[0], a[1], EAVE_H - 1.6), P(b[0], b[1], EAVE_H - 1.6), P(U_END, APSE_CV, EAVE_H - 1.6 + APSE_ROOF)], roofC, [...en(Math.cos(mid), Math.sin(mid)), 0.8] as V3)
  }
  // windows along the flanks: round-headed lights in the clerestory (north half) and the south block
  const nb = Math.round((U_END - U_F - 6) / BAY), bl = (U_END - U_F - 6) / nb
  for (let i = 0; i < nb; i++) {
    const u = U_F + 3 + (i + 0.5) * bl
    arch(u, -NAVE_V, 0, -1, 0, 9.4, 1.1, 3.4)
    if (u < U_SPLIT) arch(u, NAVE_V, 0, 1, 0, 9.4, 1.1, 3.4); else arch(u, E_HI_V, 0, 1, 0, 6.0, 1.2, 4.4)
    if (u < U_SPLIT - 1) { arch(u, -W_V, 0, -1, 0, 2.6, 0.9, 2.6); arch(u, E_V, 0, 1, 0, 2.6, 0.9, 2.6) }
  }

  // ── the west front: the central block's wall and pediment, wings' fronts, portal, rose, three lights, cross ──
  const gabPts = [P(U_F - 0.1, -NAVE_V - 0.15, EAVE_H), P(U_F - 0.1, NAVE_V + 0.15, EAVE_H), P(U_F - 0.1, 0, RIDGE_H + 0.1)]
  T.poly(gabPts, cream, [...en(-1, 0), 0] as V3)
  decal(U_F, 0, -1, 0, 0.05, [[-NAVE_V, EAVE_H], [NAVE_V, EAVE_H], [0, RIDGE_H], [0, RIDGE_H - 0.5], [NAVE_V - 0.9, EAVE_H + 0.0]].slice(0, 3).map(([t, y]) => [t * 0.97, y - 0.55] as [number, number]), trim)
  solid(U_F - 0.35, U_F + 0.1, -NAVE_V - 0.3, NAVE_V + 0.3, EAVE_H - 0.55, EAVE_H + 0.05, trim, trim, 0)   // pediment cornice band
  const cx = [0, -2.1, 2.1]
  void cx
  // portal: rectangular door under an arched lunette, with the iron trellis frame
  decal(U_F, 0, -1, 0, 0.05, [[-1.5, TERR], [1.5, TERR], [1.5, TERR + 4.3], [-1.5, TERR + 4.3]], trim)
  decal(U_F, 0, -1, 0, 0.1, [[-1.15, TERR], [1.15, TERR], [1.15, TERR + 3.4], [-1.15, TERR + 3.4]], door)
  decal(U_F, 0, -1, 0, 0.07, round(0, TERR + 3.9, 3.9, 2.1), trim)
  for (const sgn of [-1, 1]) decal(U_F, 0, -1, 0, 0.15, [[sgn * 2.15, TERR], [sgn * 1.95, TERR], [sgn * 1.95, TERR + 4.9], [sgn * 2.15, TERR + 4.9]], dark)
  decal(U_F, 0, -1, 0, 0.15, [[-2.15, TERR + 4.8], [2.15, TERR + 4.8], [2.15, TERR + 5.0], [-2.15, TERR + 5.0]], dark)
  // three arched lights over the portal, then the rose window
  for (const t of [-1.45, 0, 1.45]) { decal(U_F, 0, -1, 0, 0.05, round(t, TERR + 5.6, 1.1, 1.5), trim); decal(U_F, 0, -1, 0, 0.1, round(t, TERR + 5.75, 0.8, 1.15), glass) }
  const disc = (t: number, y: number, r: number): [number, number][] => Array.from({ length: 20 }, (_, i) => [t + r * Math.cos((i / 20) * Math.PI * 2), y + r * Math.sin((i / 20) * Math.PI * 2)] as [number, number])
  const RY = TERR + 8.0
  decal(U_F, 0, -1, 0, 0.05, disc(0, RY, 1.6), trim); decal(U_F, 0, -1, 0, 0.1, disc(0, RY, 1.2), glass)
  decal(U_F, 0, -1, 0, 0.14, [[-1.2, RY - 0.04], [1.2, RY - 0.04], [1.2, RY + 0.04], [-1.2, RY + 0.04]], trim); decal(U_F, 0, -1, 0, 0.14, [[-0.04, RY - 1.2], [0.04, RY - 1.2], [0.04, RY + 1.2], [-0.04, RY + 1.2]], trim)
  // wing fronts: side doors with lintels, and the wings' raking cornice
  for (const sgn of [-1, 1]) {
    const t = sgn * 6.9
    decal(U_F, 0, -1, 0, 0.05, [[t - 0.95, TERR], [t + 0.95, TERR], [t + 0.95, TERR + 3.1], [t - 0.95, TERR + 3.1]], trim)
    decal(U_F, 0, -1, 0, 0.1, [[t - 0.7, TERR], [t + 0.7, TERR], [t + 0.7, TERR + 2.7], [t - 0.7, TERR + 2.7]], dark)
    decal(U_F, 0, -1, 0, 0.07, [[t - 1.2, TERR + 3.1], [t + 1.2, TERR + 3.1], [t + 1.2, TERR + 3.4], [t - 1.2, TERR + 3.4]], trim)
  }
  for (const sgn of [-1, 1]) solid(U_F, U_F + 0.3, sgn > 0 ? NAVE_V : -W_V, sgn > 0 ? E_V : -NAVE_V, AISLE_EAVE - 0.1, AISLE_TOP, cream, cream, 0)
  // cross on a plinth at the apex
  solid(-0.7 + U_F, 0.7 + U_F + 0.6, -0.7, 0.7, RIDGE_H, RIDGE_H + 1.1, trim, trim, 0)
  solid(U_F + 0.1, U_F + 0.4, -0.12, 0.12, RIDGE_H + 1.1, RIDGE_H + 3.0, shade(cream, 0.8), shade(cream, 0.8), 0)
  solid(U_F + 0.1, U_F + 0.4, -0.7, 0.7, RIDGE_H + 2.1, RIDGE_H + 2.4, shade(cream, 0.8), shade(cream, 0.8), 0)
  // ── the parvis: a raised terrace across the front with a railing, and a flight of steps down each side ──
  solid(U_F - TERR_D, U_F + 0.1, -W_V - 0.3, E_V + 0.3, 0, TERR, shade(cream, 0.97), shade(cream, 0.9), 0)
  solid(U_F - TERR_D, U_F - TERR_D + 0.08, -W_V - 0.3, E_V + 0.3, TERR + 0.85, TERR + 0.95, rail, rail, 0)
  for (let v = -W_V - 0.3; v <= E_V + 0.3; v += 0.75) solid(U_F - TERR_D, U_F - TERR_D + 0.06, v, v + 0.06, TERR, TERR + 0.9, rail, null, 0)
  for (const sgn of [-1, 1]) {
    const v0 = sgn > 0 ? E_V + 0.3 : -W_V - 0.3
    for (let k = 0; k < 9; k++) solid(U_F - TERR_D - 0.1 - (k + 1) * 0.45, U_F + 0.1, sgn > 0 ? v0 : v0 - 1.8, sgn > 0 ? v0 + 1.8 : v0, 0, TERR * (1 - (k + 1) / 10), shade(cream, 0.94), shade(cream, 0.88), 0)
  }
  // ground-floor arch under the parvis (dark opening)
  decal(U_F - TERR_D, 0, -1, 0, 0.05, [[-2.6, 0], [2.6, 0], [2.6, 2.3], [-2.6, 2.3]], dark)
}
