/**
 * CHAPELLE SAINTE-JEANNE-D'ARC (avenue Reille / rue de la Glacière side, 14e; OSM way/118528607; Wikidata Q2957104). A
 * neo-Gothic chapel of weathered buff stone: one gabled nave (16 m wide, walls to 13 m under an open parapet, buttresses
 * stepping up between tall lancets), a steep slate roof (ridge ~19 m), a narrow west tower mid front with a pointed
 * portal, twin lancets, a belfry of louvred lancets, corner pinnacles and an octagonal spire (~36 m with its cross), and
 * a polygonal apse (13 m, roses in the lancets, slate cone) over a low ring of chapels (~4.6 m) with arched doors.
 * Measured from the IGN LiDAR HD surface model (docs/landmarks/refs/chapelle-sainte-jeanne-d-arc/grid.txt, bands.png);
 * photos (Commons "Paris 14e - Chapelle Sainte-Jeanne-d'Arc (Paris)") in the same folder.
 * Drawn in the chapel's (u, v) frame: u toward the apse (north), v across; registered onto the footprint by enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism as cyl } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, chapel frame; origin = centre of the OSM box) ────────────────────────────────────────────
const AXIS_DEG = 90                    // toward the apse = north
const U_FRONT = -20.9, U_NAVE = 12.3, HALF = 7.85           // nave front, nave/apse joint, half width
const WALL_H = 13, PARAPET = 0.9, EAVE_H = 12.4, RIDGE_H = 18.8, ROOF_HALF = 4.0
const BAY = 5.5, BUTT = 0.5
const TW_U0 = -24.8, TW_HALF = 2.15, TW_STAGE1 = 15.6, TW_TOP = 24, SPIRE_TIP = 35.2, SPIRE_R = 2.3, PIN_H = 3.2
const APSE_N = 6, APSE_R = 7.85, CONE_H = 5.4
const LOW_U1 = 24.4, LOW_HALF = 9.1, LOW_H = 4.6
const STONE = '#94856a', TRIM = '#ab9c7e', ROOF = '#4c5260', GLASS = '#2e3648', DOOR = '#7a4a2a', DARK = '#27282c'

export const RING: P2[] = [[-7.7, 7.7], [-7.5, -12.1], [-7.4, -20.8], [-1.8, -20.8], [-1.8, -24.8], [2.5, -24.8], [2.5, -23.2], [3.8, -23.2], [4.7, -22.4], [4.7, -20.9], [8.2, -20.9], [7.9, 12.3], [8.7, 12.4], [8.7, 18.8], [9.2, 18.8], [9.2, 24.0], [3.8, 23.9], [3.8, 24.8], [-3.8, 24.7], [-3.8, 23.8], [-9.2, 23.8], [-9.1, 18.7], [-8.9, 11.7], [-7.7, 11.7]]
  .map(([x, y]) => [x + 0.2, y - 0.1] as P2)

export function chapelleSainteJeanneDArc(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK)
  const { en, P, solid, decal, pointed, disc, cornice, ridge, gable } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 12, corniceH: 0.5, corniceOut: 0.2 })
  const spot = (u: number, v: number): { x: number; z: number } => { const [e, n] = en(u, v); return F.xz(e, n) }
  const lancet = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.04, pointed(t, y0 - 0.25, w + 0.7, h + 0.5), trim)
    decal(u, v, nu, nv, 0.09, pointed(t, y0, w, h), glass)
    decal(u, v, nu, nv, 0.13, [[t - 0.05, y0], [t + 0.05, y0], [t + 0.05, y0 + h * 0.8], [t - 0.05, y0 + h * 0.8]], trim)
  }
  const rose = (u: number, v: number, nu: number, nv: number, t: number, y: number, r: number): void => {
    decal(u, v, nu, nv, 0.05, disc(t, y, r + 0.2), trim); decal(u, v, nu, nv, 0.1, disc(t, y, r), glass)
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; decal(u, v, nu, nv, 0.14, disc(t + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.3), trim) }
  }
  /** an open stone parapet: a plinth band, a dark pierced band, a coping */
  const parapet = (u0: number, u1: number, v0: number, v1: number): void => {
    solid(u0, u1, v0, v1, WALL_H, WALL_H + PARAPET, shade(stone, 0.9), trim, 2)
  }
  const buttress = (u: number, v: number, s: number, along: 'v' | 'u', h = WALL_H + 1.3): void => {
    if (along === 'v') solid(u - BUTT / 2, u + BUTT / 2, s > 0 ? v : v - 0.55, s > 0 ? v + 0.55 : v, 0, h, shade(stone, 0.97), trim, 2)
    else solid(s > 0 ? u : u - 0.55, s > 0 ? u + 0.55 : u, v - BUTT / 2, v + BUTT / 2, 0, h, shade(stone, 0.97), trim, 2)
  }

  // ── nave: walls, parapet, steep slate gable, buttresses and lancets ──
  solid(U_FRONT, U_NAVE, -HALF, HALF, 0, WALL_H, stone, null, 3)
  cornice(U_FRONT, U_NAVE, -HALF, HALF, WALL_H, 0.5, 0.2)
  for (const s of [-1, 1]) parapet(U_FRONT - 0.2, U_NAVE + 0.2, s > 0 ? HALF - 0.1 : -HALF - 0.2, s > 0 ? HALF + 0.2 : -HALF + 0.1)
  parapet(U_FRONT - 0.2, U_FRONT + 0.1, -HALF, HALF)
  ridge('u', U_FRONT + 0.2, U_NAVE, 0, ROOF_HALF, EAVE_H, RIDGE_H, 0.1)
  const nb = Math.round((U_NAVE - U_FRONT) / BAY), bl = (U_NAVE - U_FRONT) / nb
  for (let i = 0; i <= nb; i++) for (const s of [-1, 1]) buttress(U_FRONT + i * bl, s * HALF, s, 'v')
  for (let i = 0; i < nb; i++) {
    const u = U_FRONT + (i + 0.5) * bl
    for (const s of [-1, 1]) {
      lancet(u, s * HALF, 0, s, 0, 3.6, 1.9, 7.8)
      rose(u, s * HALF, 0, s, 0, 12.0, 0.45)
    }
  }
  // ── west front: lancets either side of the tower, front pinnacles ──
  for (const s of [-1, 1]) {
    const t = s * 5.0
    decal(U_FRONT, 0, -1, 0, 0.03, pointed(t, 1.2, 3.0, 11.2), shade(stone, 0.93))
    lancet(U_FRONT, 0, -1, 0, t, 3.0, 2.0, 8.3)
    rose(U_FRONT, 0, -1, 0, t, 12.0, 0.45)
    const pp = spot(U_FRONT - 0.2, s * (HALF - 0.1)); cyl(out, pp.x, pp.z, F.y0 + WALL_H, F.y0 + WALL_H + 2.2, 0.38, 6, trim, 0, 0.04, true, 0)
  }

  // ── tower: stage 1 with portal and twin lancets, stringcourse, belfry stage with louvred lancets, spire ──
  const tu1 = U_FRONT + 3.0, tcu = (TW_U0 + tu1) / 2, thu = (tu1 - TW_U0) / 2
  solid(TW_U0, tu1, -TW_HALF, TW_HALF, 0, TW_STAGE1, stone, null, 2.4)
  cornice(TW_U0, tu1, -TW_HALF, TW_HALF, TW_STAGE1, 0.7, 0.3)
  solid(TW_U0 + 0.25, tu1 - 0.1, -TW_HALF + 0.2, TW_HALF - 0.2, TW_STAGE1, TW_TOP, shade(stone, 1.02), null, 2.4)
  cornice(TW_U0 + 0.25, tu1 - 0.1, -TW_HALF + 0.2, TW_HALF - 0.2, TW_TOP, 0.6, 0.3)
  for (const su of [-1, 1]) for (const sv of [-1, 1]) {            // corner buttresses of stage 1
    const cu = su < 0 ? TW_U0 - 0.2 : tu1 - 0.35, cv = sv * (TW_HALF - 0.1)
    solid(cu, cu + 0.55, sv > 0 ? cv - 0.55 : cv, sv > 0 ? cv : cv + 0.55, 0, TW_STAGE1 - 0.4, shade(stone, 0.96), trim, 2)
  }
  decal(TW_U0, 0, -1, 0, 0.05, pointed(0, 0, 2.5, 5.6), trim); decal(TW_U0, 0, -1, 0, 0.11, pointed(0, 0, 1.9, 5.0), door)
  lancet(TW_U0, 0, -1, 0, -0.5, 8.0, 0.7, 4.0); lancet(TW_U0, 0, -1, 0, 0.5, 8.0, 0.7, 4.0)
  for (const [u, v, nu, nv, hw] of [[TW_U0 + 0.25, 0, -1, 0, TW_HALF - 0.2], [tu1 - 0.1, 0, 1, 0, TW_HALF - 0.2], [tcu, TW_HALF - 0.2, 0, 1, thu], [tcu, -TW_HALF + 0.2, 0, -1, thu]] as [number, number, number, number, number][]) {
    for (const t of [-hw * 0.4, hw * 0.4]) {
      decal(u, v, nu, nv, 0.05, pointed(t, 16.8, 1.0, 5.2), trim)
      decal(u, v, nu, nv, 0.1, pointed(t, 17.0, 0.7, 4.8), dark)
      for (let k = 0; k < 5; k++) decal(u, v, nu, nv, 0.13, [[t - 0.4, 17.4 + k * 0.7], [t + 0.4, 17.4 + k * 0.7], [t + 0.4, 17.5 + k * 0.7], [t - 0.4, 17.5 + k * 0.7]], shade(stone, 0.85))
    }
  }
  const aU = Math.atan2(F.n([Math.cos(Math.PI / 2), Math.sin(Math.PI / 2), 0])[0], F.n([Math.cos(Math.PI / 2), Math.sin(Math.PI / 2), 0])[2])
  const y0 = F.y0
  for (const su of [-1, 1]) for (const sv of [-1, 1]) {     // four corner pinnacles at the belfry top
    const p = spot(su < 0 ? TW_U0 + 0.45 : tu1 - 0.45, sv * (TW_HALF - 0.4))
    cyl(out, p.x, p.z, y0 + TW_TOP, y0 + TW_TOP + PIN_H - 1.6, 0.3, 4, stone, 0, 0.2, true, aU + Math.PI / 4)
    cyl(out, p.x, p.z, y0 + TW_TOP + PIN_H - 1.6, y0 + TW_TOP + PIN_H, 0.3, 4, roofC, 0, 0.02, true, aU + Math.PI / 4)
  }
  const pc = spot(tcu, 0), ph = aU - Math.PI / 8
  cyl(out, pc.x, pc.z, y0 + TW_TOP, y0 + SPIRE_TIP - 5, SPIRE_R, 8, shade(stone, 0.95), 0, SPIRE_R * 0.55, true, ph)
  cyl(out, pc.x, pc.z, y0 + SPIRE_TIP - 5, y0 + SPIRE_TIP, SPIRE_R * 0.55, 8, shade(stone, 0.9), 0, 0.05, true, ph)
  cyl(out, pc.x, pc.z, y0 + SPIRE_TIP - 0.2, y0 + SPIRE_TIP + 1.6, 0.07, 4, dark, 0, 0.02, true, 0)
  cyl(out, pc.x, pc.z, y0 + SPIRE_TIP + 0.8, y0 + SPIRE_TIP + 0.95, 0.4, 4, dark, 0, 0.4, true, aU)

  // ── low ring of chapels around the apse, with buttresses stepped to the walls above ──
  solid(U_NAVE - 0.3, LOW_U1, -LOW_HALF, LOW_HALF, 0, LOW_H, stone, shade(stone, 0.85), 3)
  cornice(U_NAVE - 0.3, LOW_U1, -LOW_HALF, LOW_HALF, LOW_H, 0.4, 0.2)
  for (let i = 0; i <= 6; i++) { const v = -LOW_HALF + (i / 6) * 2 * LOW_HALF; solid(LOW_U1 - 0.1, LOW_U1 + 0.5, v - 0.28, v + 0.28, 0, LOW_H + 1.0, shade(stone, 0.96), trim, 2) }
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const u = U_NAVE + 1.2 + k * 3.9; solid(u, u + 0.55, s > 0 ? LOW_HALF - 0.1 : -LOW_HALF - 0.45, s > 0 ? LOW_HALF + 0.45 : -LOW_HALF + 0.1, 0, LOW_H + 1.0, shade(stone, 0.96), trim, 2) }
  for (let i = 0; i < 6; i++) {
    const v = -LOW_HALF + ((i + 0.5) / 6) * 2 * LOW_HALF
    decal(LOW_U1, v, 1, 0, 0.04, pointed(0, 1.6, 1.3, 2.4), trim)
    decal(LOW_U1, v, 1, 0, 0.09, pointed(0, 1.7, 1.0, 2.1), i === 1 || i === 4 ? door : glass)
  }
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const u = U_NAVE + 3.2 + k * 3.9; if (u > LOW_U1 - 1.5) continue; lancet(u, s * LOW_HALF, 0, s, 0, 1.4, 1.1, 2.6) }

  // ── apse: half-hexagon at 13 m with lancets and roses, open parapet, slate cone ──
  const aq = (k: number, r: number): P2 => { const a = -Math.PI / 2 + (k / APSE_N) * Math.PI; return [U_NAVE + r * Math.cos(a), r * Math.sin(a)] }
  const apse: P2[] = [[U_NAVE, HALF], [U_NAVE, -HALF]]
  for (let k = 0; k <= APSE_N; k++) apse.unshift(aq(k, APSE_R / Math.cos(Math.PI / (2 * APSE_N))))
  T.prism(apse.map(([u, v]) => en(u, v)), 0, WALL_H, stone, null, 3)
  const Rc = APSE_R / Math.cos(Math.PI / (2 * APSE_N))
  for (let k = 0; k < APSE_N; k++) {
    const a = aq(k, Rc + 0.15), b = aq(k + 1, Rc + 0.15), mid = -Math.PI / 2 + ((k + 0.5) / APSE_N) * Math.PI
    T.poly([P(a[0], a[1], WALL_H - 0.2), P(b[0], b[1], WALL_H - 0.2), P(U_NAVE, 0, WALL_H + CONE_H)], roofC, [...en(Math.cos(mid), Math.sin(mid)), 0.8] as V3)
    const w = aq(k, Rc + 0.4), w2 = aq(k + 1, Rc + 0.4)
    T.poly([P(w[0], w[1], WALL_H), P(w2[0], w2[1], WALL_H), P(w2[0], w2[1], WALL_H + PARAPET), P(w[0], w[1], WALL_H + PARAPET)], shade(stone, 0.9), [...en(Math.cos(mid), Math.sin(mid)), 0] as V3)
    const cu = U_NAVE + (Rc * Math.cos(mid)) * Math.cos(Math.PI / (2 * APSE_N)), cv = (Rc * Math.sin(mid)) * Math.cos(Math.PI / (2 * APSE_N))
    const nu = Math.cos(mid), nv = Math.sin(mid)
    decal(cu, cv, nu, nv, 0.04, pointed(0, 5.7, 3.6, 7.0), trim)
    lancet(cu, cv, nu, nv, 0, 5.9, 3.0, 6.0)
    rose(cu, cv, nu, nv, 0, 9.6, 0.9)
    const pa = aq(k, Rc + 0.1)
    solid(pa[0] - 0.3, pa[0] + 0.3, pa[1] - 0.3, pa[1] + 0.3, 0, WALL_H + 1.5, shade(stone, 0.96), trim, 2)
  }
  { const pa = aq(APSE_N, Rc + 0.1); solid(pa[0] - 0.3, pa[0] + 0.3, pa[1] - 0.3, pa[1] + 0.3, 0, WALL_H + 1.5, shade(stone, 0.96), trim, 2) }
  void gable
  // ── front steps ──
  for (let k = 0; k < 3; k++) solid(TW_U0 - 0.5 - k * 0.45, TW_U0 + 0.1, -1.8 + k * 0.2, 1.8 - k * 0.2, 0, 0.4 - k * 0.12, shade(stone, 0.94), shade(stone, 0.9), 0)
}
