/**
 * ÉGLISE SAINT-JEAN-BAPTISTE DE BELLEVILLE (rue de Belleville, 19e; OSM way/63212231). Lassus's neo-Gothic parish church
 * (1854-59) of pale limestone: a south-facing west-type front with a pointed central portal, two small side portals,
 * a rose window over an arcade, and two square towers whose louvred belfries carry tall octagonal stone spires (~49 m).
 * Behind: a steep slate nave (ridge 25 m) with low aisles (~10 m), a short transept, a low chevet and presbytery block.
 * Measured from the IGN LiDAR HD surface model (docs/landmarks/MODEL-BELLEVILLE-STJEAN.md); photo
 * docs/landmarks/refs/belleville-stjean/. Drawn in the church's (u, v) frame — u along the nave from the front toward the
 * chevet, v across (west positive) — turned AXIS_DEG from east and registered onto the footprint by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism as cyl } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 95.5             // the nave's direction (front toward the chevet), degrees anticlockwise from east
const U_FRONT = 0.3, U_END = 50.5 // front wall; end of the nave and its aisles
const AISLE_V = 12.9              // half-width of the aisle block
const AISLE_EAVE = 8.2, AISLE_HI = 10.0
const NAVE_V = 4.4, NAVE_EAVE = 19.8, RIDGE_H = 25.3, RIDGE_U0 = 7.6      // the nave roof starts behind the front block
const FRONT_H = 20.4              // the front block between the towers (flat, balustraded)
const TOWER_U1 = 7.6, TOWER_V0 = 4.7, TOWER_V1 = 12.7, TOWER_H = 33, SPIRE_TIP = 49.5, SPIRE_R = 2.9, SPIRE_MID = 38.5, SPIRE_RMID = 2.0
const TR_U0 = 29.5, TR_U1 = 39.0, TR_V = 14.3, TR_EAVE = 20.0, TR_RIDGE = 24.3                // transept
const CHEVET_U1 = 58.0, CHEVET_V = 11.0, CHEVET_H = 9.6                                       // low chevet block
const PRES_U0 = 58.6, PRES_U1 = 69.0, PRES_V0 = -14.6, PRES_V1 = 13.5, PRES_H = 9.4           // presbytery block behind
const BAY = 6.0
const ROSE_Y = 15.8, ROSE_R = 3.4
const STONE = '#cdc4ab', TRIM = '#dcd4bc', ROOF = '#5a616c', SPIRE = '#b9ae95', GLASS = '#2e3648', DOOR = '#4e3526', DARK = '#26272c', PLASTER = '#d8cfbf'

export const RING: P2[] = [[-19.7, 66.6], [-18.3, 46.4], [-16.7, 28.3], [-16.6, 27.5], [-13.8, 5.5], [-11.5, 0.5], [-10.2, -0.6], [-9.2, -0.6], [9.4, 0.8], [10.5, 2.1], [12.3, 7.4], [11.4, 30.5], [10.0, 48.8], [8.2, 68.9], [-3.2, 68.0]]

const A = (AXIS_DEG * Math.PI) / 180, CA = Math.cos(A), SA = Math.sin(A)

export function saintJeanBaptisteBelleville(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), spireC: Rgb = hex(SPIRE), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK), plaster: Rgb = hex(PLASTER)
  const { en, P, solid, decal, round, pointed, disc, cornice, ridge } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 14, corniceH: 0.5, corniceOut: 0.25 })
  const lancet = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.04, pointed(t, y0 - 0.2, w + 0.6, h + 0.4), trim)
    decal(u, v, nu, nv, 0.09, pointed(t, y0, w, h), glass)
    decal(u, v, nu, nv, 0.13, [[t - 0.05, y0], [t + 0.05, y0], [t + 0.05, y0 + h * 0.7], [t - 0.05, y0 + h * 0.7]], trim)
  }
  const rect = (t0: number, t1: number, y0: number, y1: number): [number, number][] => [[t0, y0], [t1, y0], [t1, y1], [t0, y1]]
  const tri = (u: number, v: number, nu: number, nv: number, off: number, t0: number, t1: number, y0: number, y1: number, col: Rgb): void =>
    decal(u, v, nu, nv, off, [[t0, y0], [t1, y0], [(t0 + t1) / 2, y1]], col)

  // ── aisle block: walls, lean-to slate roofs, buttress piers, lancet windows ──
  const u0 = U_FRONT + 0.1
  for (const s of [-1, 1]) {
    solid(u0, U_END, s * NAVE_V, s * AISLE_V, 0, AISLE_EAVE, stone, null, 3)
    T.poly([P(u0, s * (AISLE_V + 0.3), AISLE_EAVE - 0.2), P(U_END + 0.3, s * (AISLE_V + 0.3), AISLE_EAVE - 0.2), P(U_END + 0.3, s * NAVE_V, AISLE_HI), P(u0, s * NAVE_V, AISLE_HI)], roofC, [...en(0, s), 0.8] as V3)
    cornice(u0, U_END, s > 0 ? AISLE_V - 0.1 : -AISLE_V, s > 0 ? AISLE_V : -AISLE_V + 0.1, AISLE_EAVE, 0.45, 0.2)
  }
  const bu0 = TOWER_U1, nb = Math.round((U_END - bu0) / BAY), bl = (U_END - bu0) / nb
  for (let i = 0; i <= nb; i++) for (const s of [-1, 1]) solid(bu0 + i * bl - 0.35, bu0 + i * bl + 0.35, s > 0 ? AISLE_V : -AISLE_V - 0.45, s > 0 ? AISLE_V + 0.45 : -AISLE_V, 0, AISLE_EAVE + 0.8, shade(stone, 0.97), trim, 2)
  for (let i = 0; i < nb; i++) {
    const u = bu0 + (i + 0.5) * bl
    if (u > TR_U0 - 1 && u < TR_U1 + 1) continue
    for (const s of [-1, 1]) lancet(u, s * AISLE_V, 0, s, 0, 2.8, 1.7, 4.6)
  }

  // ── nave: clerestory, steep slate roof, lancets, front gablet ──
  solid(u0, U_END, -NAVE_V, NAVE_V, AISLE_HI - 0.5, NAVE_EAVE, stone, null, 3)
  cornice(RIDGE_U0, U_END, -NAVE_V, NAVE_V, NAVE_EAVE, 0.5, 0.25)
  ridge('u', RIDGE_U0, U_END, 0, NAVE_V + 0.3, NAVE_EAVE, RIDGE_H, 0.3)
  for (let i = 0; i < nb; i++) {
    const u = bu0 + (i + 0.5) * bl
    if (u > TR_U0 - 1 && u < TR_U1 + 1) continue
    for (const s of [-1, 1]) lancet(u, s * NAVE_V, 0, s, 0, 11.6, 1.4, 6.2)
  }
  T.poly([P(RIDGE_U0 - 0.05, -NAVE_V - 0.3, NAVE_EAVE - 0.25), P(RIDGE_U0 - 0.05, NAVE_V + 0.3, NAVE_EAVE - 0.25), P(RIDGE_U0 - 0.05, 0, RIDGE_H + 0.2)], stone, [...en(-1, 0), 0] as V3)
  decal(RIDGE_U0, 0, -1, 0, 0.06, pointed(0, 20.9, 1.6, 3.2), glass)
  T.poly([P(U_END + 0.05, -NAVE_V - 0.3, NAVE_EAVE - 0.25), P(U_END + 0.05, NAVE_V + 0.3, NAVE_EAVE - 0.25), P(U_END + 0.05, 0, RIDGE_H + 0.2)], stone, [...en(1, 0), 0] as V3)

  // ── transept: full-width block, gabled slate roof, end walls with a rose and lancets ──
  const tc = (TR_U0 + TR_U1) / 2, th = (TR_U1 - TR_U0) / 2
  solid(TR_U0, TR_U1, -TR_V, TR_V, 0, TR_EAVE, stone, null, 3)
  cornice(TR_U0, TR_U1, -TR_V, TR_V, TR_EAVE, 0.5, 0.25)
  ridge('v', -TR_V, TR_V, tc, th + 0.3, TR_EAVE, TR_RIDGE, 0.4)
  for (const s of [-1, 1] as const) {
    const v = s * TR_V
    T.poly([P(TR_U0 - 0.3, v + s * 0.05, TR_EAVE - 0.25), P(TR_U1 + 0.3, v + s * 0.05, TR_EAVE - 0.25), P(tc, v + s * 0.05, TR_RIDGE + 0.15)], stone, [...en(0, s), 0] as V3)
    decal(tc, v, 0, s, 0.06, disc(0, 21.7, 1.1), trim); decal(tc, v, 0, s, 0.1, disc(0, 21.7, 0.85), glass)
    lancet(tc, v, 0, s, 0, 3.4, 1.8, 9.6); lancet(tc, v, 0, s, -2.6, 3.4, 1.2, 6.6); lancet(tc, v, 0, s, 2.6, 3.4, 1.2, 6.6)
    for (const e of [TR_U0 + 0.2, TR_U1 - 0.2]) solid(e - 0.4, e + 0.4, s > 0 ? v - 0.2 : v - 0.45, s > 0 ? v + 0.45 : v + 0.2, 0, TR_EAVE + 0.6, shade(stone, 0.97), trim, 2)
  }

  // ── chevet and presbytery: low blocks behind the nave ──
  solid(U_END, CHEVET_U1, -CHEVET_V, CHEVET_V, 0, CHEVET_H, stone, shade(roofC, 1.05), 3)
  cornice(U_END, CHEVET_U1, -CHEVET_V, CHEVET_V, CHEVET_H, 0.45, 0.2)
  for (let k = -2; k <= 2; k++) lancet(CHEVET_U1, k * 3.6, 1, 0, 0, 2.6, 1.3, 4.6)
  solid(PRES_U0, PRES_U1, PRES_V0, PRES_V1, 0, PRES_H, plaster, shade(roofC, 1.05), 3)
  cornice(PRES_U0, PRES_U1, PRES_V0, PRES_V1, PRES_H, 0.45, 0.2)
  for (const [u, v, nu, nv, n] of [[PRES_U1, 0, 1, 0, 8], [PRES_U0 + 0.1, 0, -1, 0, 8]] as [number, number, number, number, number][])
    for (let k = 0; k < n; k++) for (const y of [1.6, 5.2]) decal(u, v, nu, nv, 0.05, rect(-11.5 + k * 3.1, -10.3 + k * 3.1, y, y + 2.0), glass)

  // ── front: aisle fronts with side portals, central block with portal, arcade and rose; two towers ──
  const tcu = (U_FRONT + TOWER_U1) / 2
  const front = (nu: number, nv: number, uu: number, vv: number, off: number, pts: [number, number][], col: Rgb): void => decal(uu, vv, nu, nv, off, pts, col)
  void front
  // walls: aisle ends and towers share the full front width (towers drawn full height over them)
  solid(U_FRONT, U_FRONT + 0.7, -AISLE_V, AISLE_V, 0, 9.6, stone, null, 3)
  solid(U_FRONT, TOWER_U1, -TOWER_V0, TOWER_V0, 0, FRONT_H, stone, shade(stone, 0.92), 3)
  // front block: balustrade
  solid(U_FRONT - 0.1, U_FRONT + 0.45, -TOWER_V0, TOWER_V0, FRONT_H, FRONT_H + 0.25, trim, trim, 0)
  for (let k = -9; k <= 9; k++) decal(U_FRONT - 0.1, 0, -1, 0, 0.05, rect(k * 0.5 - 0.1, k * 0.5 + 0.1, FRONT_H + 0.25, FRONT_H + 1.1), trim)
  solid(U_FRONT - 0.1, U_FRONT + 0.4, -TOWER_V0, TOWER_V0, FRONT_H + 1.1, FRONT_H + 1.25, trim, trim, 0)
  // horizontal bands across the whole front
  for (const [y, h] of [[9.3, 0.5], [12.3, 0.45], [FRONT_H - 0.3, 0.6]] as [number, number][]) solid(U_FRONT - 0.2, U_FRONT + 0.3, -AISLE_V - 0.1, AISLE_V + 0.1, y, y + h, trim, trim, 0)
  // central pointed portal, deeply moulded
  decal(U_FRONT, 0, -1, 0, 0.05, pointed(0, 0, 7.4, 10.2), trim)
  decal(U_FRONT, 0, -1, 0, 0.1, pointed(0, 0, 6.3, 9.4), shade(stone, 0.78))
  decal(U_FRONT, 0, -1, 0, 0.14, pointed(0, 0, 5.0, 8.6), shade(trim, 0.92))     // tympanum
  decal(U_FRONT, 0, -1, 0, 0.18, rect(-1.9, 1.9, 0, 4.7), dark)
  for (const t of [-1.0, 1.0]) decal(U_FRONT, 0, -1, 0, 0.22, rect(t - 0.85, t + 0.85, 0, 4.4), door)
  decal(U_FRONT, 0, -1, 0, 0.2, rect(-0.1, 0.1, 0, 4.7), trim)
  // side portals and quatrefoils
  for (const s of [-1, 1]) {
    const t = s * 9.6
    decal(U_FRONT, 0, -1, 0, 0.05, pointed(t, 0, 3.8, 6.6), trim)
    decal(U_FRONT, 0, -1, 0, 0.1, pointed(t, 0, 2.9, 5.7), shade(stone, 0.75))
    decal(U_FRONT, 0, -1, 0, 0.15, rect(t - 0.95, t + 0.95, 0, 3.7), door)
    decal(U_FRONT, 0, -1, 0, 0.06, disc(t, 8.0, 0.8), trim); decal(U_FRONT, 0, -1, 0, 0.1, disc(t, 8.0, 0.55), shade(stone, 0.7))
  }
  // gallery of small round arches (the whole front) and the rose over the middle
  for (const ts of [-1, 1]) for (let k = 0; k < 4; k++) {
    const t = ts * (6.1 + k * 1.35) + 0
    decal(U_FRONT, 0, -1, 0, 0.05, round(t, 9.9, 0.95, 2.1), trim); decal(U_FRONT, 0, -1, 0, 0.09, round(t, 10.0, 0.7, 1.9), dark)
  }
  for (let k = -3; k <= 3; k++) { const t = k * 1.1; decal(U_FRONT, 0, -1, 0, 0.05, round(t, 10.0, 0.9, 2.0), trim); decal(U_FRONT, 0, -1, 0, 0.09, round(t, 10.1, 0.65, 1.8), dark) }
  decal(U_FRONT, 0, -1, 0, 0.05, disc(0, ROSE_Y, ROSE_R + 0.8), shade(stone, 0.88))
  decal(U_FRONT, 0, -1, 0, 0.09, disc(0, ROSE_Y, ROSE_R + 0.15), trim)
  decal(U_FRONT, 0, -1, 0, 0.13, disc(0, ROSE_Y, ROSE_R - 0.15), glass)
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; decal(U_FRONT, 0, -1, 0, 0.17, disc(Math.cos(a) * 1.85, ROSE_Y + Math.sin(a) * 1.85, 0.5), trim) }
  decal(U_FRONT, 0, -1, 0, 0.17, disc(0, ROSE_Y, 0.7), trim)

  // towers: blank-arched middle stage, louvred belfry, parapet with gablets, and the octagonal spire
  const spot = (u: number, v: number): { x: number; z: number } => { const [e, n] = en(u, v); return F.xz(e, n) }
  const aU = Math.atan2(F.n([CA, SA, 0])[0], F.n([CA, SA, 0])[2])
  const y0 = F.y0
  for (const s of [-1, 1]) {
    const vc = s * (TOWER_V0 + TOWER_V1) / 2, hw = (TOWER_V1 - TOWER_V0) / 2
    solid(U_FRONT, TOWER_U1, s * TOWER_V0, s * TOWER_V1, 0, TOWER_H, stone, shade(stone, 0.9), 2.4)
    for (const y of [9.3, 12.3, 20.2, 29.3]) cornice(U_FRONT, TOWER_U1, Math.min(s * TOWER_V0, s * TOWER_V1), Math.max(s * TOWER_V0, s * TOWER_V1), y + 0.4, 0.45, 0.2)
    cornice(U_FRONT, TOWER_U1, Math.min(s * TOWER_V0, s * TOWER_V1), Math.max(s * TOWER_V0, s * TOWER_V1), TOWER_H, 0.7, 0.35)
    // faces: [wall point u, v, normal nu, nv, half-width]
    const faces: [number, number, number, number, number][] = [[U_FRONT, vc, -1, 0, hw], [TOWER_U1, vc, 1, 0, hw], [tcu, s * TOWER_V1, 0, s, (TOWER_U1 - U_FRONT) / 2], [tcu, s * TOWER_V0, 0, -s, (TOWER_U1 - U_FRONT) / 2]]
    for (const [u, v, nu, nv, w2] of faces) {
      const isFront = nu === -1
      // middle stage: a pair of round-headed windows on a shaft, over the gallery
      if (!(isFront === false && nv === -s)) for (const t of [-w2 * 0.38, w2 * 0.38]) {
        if (isFront) { decal(u, v, nu, nv, 0.05, round(t, 13.2, 1.5, 4.6), trim); decal(u, v, nu, nv, 0.09, round(t, 13.4, 1.1, 4.2), glass) }
        else { decal(u, v, nu, nv, 0.05, round(t, 13.4, 1.3, 4.3), trim); decal(u, v, nu, nv, 0.09, round(t, 13.6, 0.9, 3.9), glass) }
      }
      // belfry: twin louvred arches under a gablet
      for (const t of [-w2 * 0.4, w2 * 0.4]) {
        decal(u, v, nu, nv, 0.05, round(t, 21.4, 2.0, 7.2), trim)
        decal(u, v, nu, nv, 0.1, round(t, 21.6, 1.55, 6.8), dark)
        for (let k = 0; k < 8; k++) decal(u, v, nu, nv, 0.13, rect(t - 0.78, t + 0.78, 22.0 + k * 0.78, 22.1 + k * 0.78), shade(stone, 0.92))
      }
      tri(u, v, nu, nv, 0.06, -w2 * 0.8, w2 * 0.8, 29.6, 32.6, trim)
      tri(u, v, nu, nv, 0.1, -w2 * 0.5, w2 * 0.5, 29.8, 31.8, shade(stone, 0.88))
    }
    const p0 = spot(tcu, vc)
    // corner pinnacles beside the spire base
    for (const su of [-1, 1]) for (const sv of [-1, 1]) {
      const p = spot(tcu + su * (TOWER_U1 - U_FRONT) / 2 - su * 0.5, vc + sv * (hw - 0.5))
      cyl(out, p.x, p.z, y0 + TOWER_H, y0 + TOWER_H + 3.0, 0.5, 8, stone, 0, 0.42, true, aU)
      cyl(out, p.x, p.z, y0 + TOWER_H + 3.0, y0 + TOWER_H + 4.4, 0.55, 8, spireC, 0, 0.03, true, aU)
    }
    // the spire: octagon, slightly concave, with four small gabled lucarnes and a cross
    const ph = aU - Math.PI / 8
    cyl(out, p0.x, p0.z, y0 + TOWER_H, y0 + SPIRE_MID, SPIRE_R, 8, spireC, 0, SPIRE_RMID, true, ph)
    cyl(out, p0.x, p0.z, y0 + SPIRE_MID, y0 + SPIRE_TIP, SPIRE_RMID, 8, shade(spireC, 0.96), 0, 0.06, true, ph)
    cyl(out, p0.x, p0.z, y0 + SPIRE_TIP - 0.2, y0 + SPIRE_TIP + 2.3, 0.1, 4, dark, 0, 0.02, true, 0)
    for (let k = 0; k < 4; k++) {
      const a = aU + (k * Math.PI) / 2, r = SPIRE_R * 0.8
      cyl(out, p0.x + Math.sin(a) * r, p0.z + Math.cos(a) * r, y0 + TOWER_H + 3.0, y0 + TOWER_H + 5.8, 0.5, 4, trim, 0, 0.04, true, a + Math.PI / 4)
    }
  }
  // buttress piers on the front: the towers' outer and inner corners step up past the gallery
  for (const s of [-1, 1]) for (const [vc, top] of [[TOWER_V0, 24.5], [TOWER_V1 - 0.55, 29.3]] as [number, number][])
    solid(U_FRONT - 0.55, U_FRONT, s * vc - 0.55, s * vc + 0.55, 0, top, shade(stone, 0.96), trim, 2)
  // the front steps
  for (let k = 0; k < 3; k++) solid(U_FRONT - 0.5 - k * 0.5, U_FRONT, -4.2 + k * 0.4, 4.2 - k * 0.4, 0, 0.45 - k * 0.12, shade(stone, 0.94), shade(stone, 0.9), 0)
}
