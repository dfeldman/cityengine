/**
 * ÉGLISE NOTRE-DAME-DE-LA-CROIX DE MÉNILMONTANT (Héret, 1863-80; OSM way/70001850). A Romano-Byzantine basilica on the
 * hill: a buff-limestone west front with a great rose window under a gable, a square belfry tower behind it with corner
 * turrets and an octagonal stone spire (78 m), a gabled nave and transept above flat balustraded aisles, and a lower
 * semicircular apse at the east end. Measured from the IGN LiDAR HD surface model (docs/landmarks/MODEL-ND-CROIX.md):
 * aisles 14.5 m, nave and transept ridges 30 m, apse 19 m, tower 50 m to the spire's foot. Photos: docs/landmarks/refs/nd-croix/.
 * Drawn in the church's own (u, v) frame — u along the nave toward the apse, v across — turned AXIS_DEG from east, then
 * registered onto the loader's footprint by museums/enframe.ts (origin = the OSM outline's centre 48.86861, 2.38747).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism as cyl } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 20.5         // the nave's direction, degrees anticlockwise from east
const U_WEST = -46            // the west front
const AISLE_U1 = 43.5         // east end of the aisle terraces
const AISLE_V = 18.2          // half-width of the aisle block
const AISLE_H = 14.5          // aisle terrace
const PARAPET_H = 1.2
const NAVE_U0 = -34, NAVE_U1 = 30, NAVE_V = 7.2
const EAVE_H = 23.5, RIDGE_H = 30
const TR_U0 = -2, TR_U1 = 10, TR_V = 19.7     // transept
const CHOIR_U1 = 43.5, CHOIR_V0 = -5.2, CHOIR_V1 = 8.2, CHOIR_H = 19
const FRONT_V = 6.4, FRONT_H = 33, GABLE_H = 37.5       // west front block and its gable apex
const TOWER_U0 = -44.8, TOWER_U1 = -35.2, TOWER_V = 4.8, TOWER_H = 50, TURRET_H = 55
const SPIRE_Y0 = 50, SPIRE_Y1 = 78, SPIRE_R = 4.6
const BAY = 6.2               // aisle and clerestory bay
const ROSE_Y = 28.5, ROSE_R = 3.5
const STONE = '#d9c9a2', TRIM = '#e6d9b8', ROOF = '#767c84', LEAD = '#5e646b', GLASS = '#343c52', DOOR = '#86362e', DARK = '#26272c'

export const RING: P2[] = [[-46.6, -6.3], [-45.1, -10.8], [-44.1, -13.4], [-40.5, -22.6], [-38.7, -26.5], [-35.5, -29.6], [-32.4, -31.7], [-31.5, -31.7], [6.8, -18.5], [16.8, -14.7], [42.6, -4.1], [43.3, -3.8], [43.8, -2.7], [48.2, 17.1], [48.1, 17.9], [46.7, 20.6], [46.2, 21.1], [30.2, 31.8], [29.1, 32.3], [3.4, 23.0], [-6.7, 19.1], [-7.7, 18.7], [-45.0, 2.4], [-45.6, 1.6], [-46.3, -1.8]]

const A = (AXIS_DEG * Math.PI) / 180, CA = Math.cos(A), SA = Math.sin(A)

export function notreDameDeLaCroix(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK)
  const { en, P, solid, decal, round: archPts, disc, cornice, ridge, gable } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 16, corniceH: 0.7, corniceOut: 0.3 })
  const win = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number, glassC = glass): void => {
    decal(u, v, nu, nv, 0.04, archPts(t, y0 - 0.2, w + 0.7, h + 0.4), trim)
    decal(u, v, nu, nv, 0.09, archPts(t, y0, w, h), glassC)
    decal(u, v, nu, nv, 0.13, [[t - 0.07, y0], [t + 0.07, y0], [t + 0.07, y0 + h - w / 2], [t - 0.07, y0 + h - w / 2]], trim)
  }
  const rose = (u: number, v: number, nu: number, nv: number, t: number, y: number, r: number): void => {
    decal(u, v, nu, nv, 0.04, disc(t, y, r * 1.18), trim)
    decal(u, v, nu, nv, 0.09, disc(t, y, r), glass)
    decal(u, v, nu, nv, 0.13, disc(t, y, r * 0.22), trim)
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2
      decal(u, v, nu, nv, 0.13, [[t + 0.05 * Math.sin(a) * r, y - 0.05 * Math.cos(a) * r], [t - 0.05 * Math.sin(a) * r, y + 0.05 * Math.cos(a) * r], [t + r * Math.cos(a) - 0.05 * Math.sin(a) * r, y + r * Math.sin(a) + 0.05 * Math.cos(a) * r], [t + r * Math.cos(a) + 0.05 * Math.sin(a) * r, y + r * Math.sin(a) - 0.05 * Math.cos(a) * r]], trim)
    }
  }
  // ── aisle terraces with balustrade, buttress piers, round-headed windows ──
  const u0 = U_WEST + 0.5
  solid(u0, AISLE_U1, -AISLE_V, AISLE_V, 0, AISLE_H, stone, hex(LEAD), 3)
  cornice(u0, AISLE_U1, -AISLE_V, AISLE_V, AISLE_H, 0.6, 0.25)
  const bal = (a0: number, a1: number, b0: number, b1: number): void => solid(a0, a1, b0, b1, AISLE_H, AISLE_H + PARAPET_H, trim, trim, 0)
  bal(u0 - 0.2, AISLE_U1 + 0.2, AISLE_V - 0.5, AISLE_V + 0.2); bal(u0 - 0.2, AISLE_U1 + 0.2, -AISLE_V - 0.2, -AISLE_V + 0.5)
  bal(AISLE_U1 - 0.5, AISLE_U1 + 0.2, -AISLE_V, AISLE_V)
  const nb = Math.round((AISLE_U1 - u0) / BAY), bl = (AISLE_U1 - u0) / nb
  for (let i = 0; i <= nb; i++) {
    const u = u0 + i * bl
    for (const s of [-1, 1]) solid(u - 0.5, u + 0.5, s > 0 ? AISLE_V : -AISLE_V - 0.5, s > 0 ? AISLE_V + 0.5 : -AISLE_V, 0, AISLE_H + 1.8, shade(stone, 0.97), trim, 3)
  }
  for (let i = 0; i < nb; i++) {
    const u = u0 + (i + 0.5) * bl
    if (u > TR_U0 - 3 && u < TR_U1 + 3) continue
    if (u < NAVE_U0 + 1) continue
    win(u, AISLE_V, 0, 1, 0, 3.8, 2.4, 7.4)
    win(u, -AISLE_V, 0, -1, 0, 3.8, 2.4, 7.4)
  }

  // ── nave: clerestory walls, windows, gabled roof ──
  solid(NAVE_U0, NAVE_U1, -NAVE_V, NAVE_V, AISLE_H, EAVE_H, stone, null, 3)
  cornice(NAVE_U0, NAVE_U1, -NAVE_V, NAVE_V, EAVE_H)
  ridge('u', NAVE_U0, NAVE_U1, 0, NAVE_V + 0.3, EAVE_H, RIDGE_H)
  gable('u', NAVE_U1, 0, NAVE_V + 0.3, EAVE_H, RIDGE_H, 1)
  const nn = Math.round((NAVE_U1 - NAVE_U0) / BAY), nl = (NAVE_U1 - NAVE_U0) / nn
  for (let i = 0; i < nn; i++) {
    const u = NAVE_U0 + (i + 0.5) * nl
    if (u > TR_U0 - 0.5 && u < TR_U1 + 0.5) continue
    win(u, NAVE_V, 0, 1, 0, 16.4, 2.2, 5.6)
    win(u, -NAVE_V, 0, -1, 0, 16.4, 2.2, 5.6)
  }

  // ── transept: end walls with a rose over three windows, gabled roof ──
  const tc = (TR_U0 + TR_U1) / 2, th = (TR_U1 - TR_U0) / 2
  solid(TR_U0, TR_U1, -TR_V, TR_V, AISLE_H, EAVE_H, stone, null, 3)
  solid(TR_U0, TR_U1, TR_V - 1.7, TR_V, 0, AISLE_H, stone, null, 3), solid(TR_U0, TR_U1, -TR_V, -TR_V + 1.7, 0, AISLE_H, stone, null, 3)
  cornice(TR_U0, TR_U1, -TR_V, TR_V, EAVE_H)
  ridge('v', -TR_V, TR_V, tc, th + 0.3, EAVE_H, RIDGE_H)
  for (const s of [-1, 1] as const) {
    const v = s * TR_V
    gable('v', v, tc, th + 0.3, EAVE_H, RIDGE_H, s)
    rose(tc, v, 0, s, 0, 18.8, 2.4)
    win(tc, v, 0, s, 0, 3, 2.6, 8.4); win(tc, v, 0, s, -3.3, 3, 1.6, 7); win(tc, v, 0, s, 3.3, 3, 1.6, 7)
    for (const e of [TR_U0 + 0.3, TR_U1 - 0.3]) solid(e - 0.45, e + 0.45, s > 0 ? v - 0.2 : v - 0.45, s > 0 ? v + 0.45 : v + 0.2, 0, EAVE_H + 1.2, shade(stone, 0.97), trim, 3)
  }

  // ── choir and apse ──
  const cv = (CHOIR_V0 + CHOIR_V1) / 2, cr = (CHOIR_V1 - CHOIR_V0) / 2
  solid(NAVE_U1, CHOIR_U1, CHOIR_V0, CHOIR_V1, AISLE_H, CHOIR_H, stone, hex(LEAD), 3)
  cornice(NAVE_U1, CHOIR_U1, CHOIR_V0, CHOIR_V1, CHOIR_H, 0.7, 0.3)
  const arcN = 14, apse: P2[] = []
  for (let i = 0; i <= arcN; i++) { const a = -Math.PI / 2 + (i / arcN) * Math.PI; apse.push(en(CHOIR_U1 + cr * Math.cos(a), cv + cr * Math.sin(a))) }
  T.prism([...apse, ...[[CHOIR_U1, CHOIR_V1], [CHOIR_U1, CHOIR_V0]].map(([u, v]) => en(u, v))], 0, CHOIR_H, stone, null, 3)
  const ring2: P2[] = []
  for (let i = 0; i <= arcN; i++) { const a = -Math.PI / 2 + (i / arcN) * Math.PI; ring2.push(en(CHOIR_U1 + (cr + 0.35) * Math.cos(a), cv + (cr + 0.35) * Math.sin(a))) }
  T.prism([...ring2, ...[[CHOIR_U1, CHOIR_V1 + 0.35], [CHOIR_U1, CHOIR_V0 - 0.35]].map(([u, v]) => en(u, v))], CHOIR_H - 0.7, CHOIR_H, trim, null, 0)
  for (let i = 0; i < arcN; i++) {                       // the half-cone roof
    const a0 = -Math.PI / 2 + (i / arcN) * Math.PI, a1 = -Math.PI / 2 + ((i + 1) / arcN) * Math.PI, R = cr + 0.35
    T.poly([P(CHOIR_U1 + R * Math.cos(a0), cv + R * Math.sin(a0), CHOIR_H), P(CHOIR_U1 + R * Math.cos(a1), cv + R * Math.sin(a1), CHOIR_H), P(CHOIR_U1, cv, CHOIR_H + 3.4)], roofC, [...en(Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2)), 0.8] as V3)
  }
  for (const k of [-1, 0, 1]) {                          // three windows over three round lights on the drum
    const a = k * 0.85, u = CHOIR_U1 + cr * Math.cos(a), v = cv + cr * Math.sin(a), nu = Math.cos(a), nv = Math.sin(a)
    const dec = (off: number, pts: [number, number][], col: Rgb): void => T.poly(pts.map(([t, y]) => P(u - nv * t + nu * off, v + nu * t + nv * off, y)), col, [...en(nu, nv), 0] as V3)
    dec(0.05, archPts(0, 5.6, 2.2, 6.2), glass); dec(0.05, disc(0, 15.2, 1.15), glass)
    dec(0.03, archPts(0, 5.4, 2.8, 6.6), trim); dec(0.03, disc(0, 15.2, 1.6), trim)
  }
  for (const s of [-1, 1]) for (const [u, v] of [[AISLE_U1 - 0.3, s * (AISLE_V - 0.3)], [u0 + 0.2, s * (AISLE_V - 0.3)]] as [number, number][]) {
    solid(u - 0.8, u + 0.8, v - 0.8, v + 0.8, AISLE_H, AISLE_H + 3.2, trim, trim, 0)
    solid(u - 0.5, u + 0.5, v - 0.5, v + 0.5, AISLE_H + 3.2, AISLE_H + 4.4, shade(trim, 0.95), roofC, 0)
  }

  // ── west front: gabled block, portals, windows, rose; the belfry tower and spire behind ──
  const fU1 = TOWER_U1 + 0.5, WU = U_WEST
  solid(U_WEST, fU1, -FRONT_V, FRONT_V, 0, FRONT_H, stone, null, 2.6)
  cornice(U_WEST, fU1, -FRONT_V, FRONT_V, FRONT_H, 0.7, 0.3)
  ridge('u', U_WEST, fU1, 0, FRONT_V + 0.3, FRONT_H, GABLE_H)
  gable('u', U_WEST, 0, FRONT_V, FRONT_H, GABLE_H, -1)
  // great portal: stepped archivolts round the red doors, a tympanum, then a triple window, a gallery of little arches and the rose
  for (let k = 3; k >= 0; k--) decal(WU, 0, -1, 0, 0.05 + (3 - k) * 0.03, archPts(0, 0, 5.8 + k * 0.9, 8.8 + k * 0.45), k % 2 ? stone : trim)
  decal(WU, 0, -1, 0, 0.2, archPts(0, 0, 4.6, 6.4), door)
  decal(WU, 0, -1, 0, 0.21, [[-0.06, 0], [0.06, 0], [0.06, 5.2], [-0.06, 5.2]], dark)
  decal(WU, 0, -1, 0, 0.1, archPts(0, 7.2, 4.8, 3.2), shade(trim, 0.92))
  for (const t of [-1.9, 0, 1.9]) win(WU, 0, -1, 0, t, 12.2, t === 0 ? 2.3 : 1.6, t === 0 ? 8.8 : 7.4)
  for (let i = 0; i < 9; i++) decal(WU, 0, -1, 0, 0.09, archPts(-4.4 + i * 1.1, 22.2, 0.8, 1.5), dark)
  rose(WU, 0, -1, 0, 0, ROSE_Y, ROSE_R)
  for (const y of [10.4, 21.7]) decal(WU, 0, -1, 0, 0.06, [[-FRONT_V, y], [FRONT_V, y], [FRONT_V, y + 0.35], [-FRONT_V, y + 0.35]], trim)
  for (const s of [-1, 1]) {
    solid(U_WEST - 0.5, U_WEST + 1.1, s * FRONT_V - 0.55, s * FRONT_V + 0.55, 0, FRONT_H + 1.4, shade(stone, 0.97), trim, 2.6)
    // aisle-front doors and a window over each
    const v = s * 12.4
    decal(U_WEST + 0.5, v, -1, 0, 0.1, archPts(0, 0, 3.4, 6.4), trim); decal(U_WEST + 0.5, v, -1, 0, 0.15, archPts(0, 0, 2.6, 5.6), door)
    win(U_WEST + 0.5, v, -1, 0, 0, 8.4, 1.8, 4.2)
  }

  // belfry tower: square, with paired louvred openings, a cornice, corner turrets, then an octagonal stage and the spire
  const tcu = (TOWER_U0 + TOWER_U1) / 2
  solid(TOWER_U0, TOWER_U1, -TOWER_V, TOWER_V, FRONT_H - 1, TOWER_H, stone, null, 2.6)
  cornice(TOWER_U0, TOWER_U1, -TOWER_V, TOWER_V, TOWER_H, 0.8, 0.35)
  cornice(TOWER_U0, TOWER_U1, -TOWER_V, TOWER_V, FRONT_H + 5.2, 0.5, 0.2)
  for (const [u, v, nu, nv, hw] of [[TOWER_U0, 0, -1, 0, TOWER_V], [TOWER_U1, 0, 1, 0, TOWER_V], [tcu, TOWER_V, 0, 1, (TOWER_U1 - TOWER_U0) / 2], [tcu, -TOWER_V, 0, -1, (TOWER_U1 - TOWER_U0) / 2]] as [number, number, number, number, number][]) {
    for (const t of [-hw * 0.4, hw * 0.4]) {
      decal(u, v, nu, nv, 0.05, archPts(t, 40, 2.4, 6.8), trim)
      decal(u, v, nu, nv, 0.1, archPts(t, 40.2, 1.9, 6.4), dark)
    }
    decal(u, v, nu, nv, 0.06, disc(0, 36, 0.8), dark)
  }
  const spot = (u: number, v: number): { x: number; z: number } => { const [e, n] = en(u, v); return F.xz(e, n) }
  const aU = Math.atan2(F.n([CA, SA, 0])[0], F.n([CA, SA, 0])[2])
  const stoneC = stone, y0 = F.y0
  for (const su of [-1, 1]) for (const sv of [-1, 1]) {      // four corner turrets with pointed caps
    const p = spot((su < 0 ? TOWER_U0 : TOWER_U1) - su * 0.1, sv * (TOWER_V - 0.1))
    cyl(out, p.x, p.z, y0 + TOWER_H - 5, y0 + TURRET_H - 3.2, 0.95, 8, stoneC, 0, 0.95, true, aU)
    cyl(out, p.x, p.z, y0 + TURRET_H - 3.2, y0 + TURRET_H, 1.05, 8, roofC, 0, 0.03, true, aU)
  }
  const pc = spot(tcu, 0), ph = aU - Math.PI / 8 + 0
  cyl(out, pc.x, pc.z, y0 + TOWER_H, y0 + SPIRE_Y0 + 4.2, SPIRE_R, 8, stoneC, 0, SPIRE_R * 0.95, true, ph)
  cyl(out, pc.x, pc.z, y0 + SPIRE_Y0 + 4.2, y0 + SPIRE_Y1, SPIRE_R * 0.95, 8, shade(stoneC, 0.88), 0, 0.05, true, ph)
  cyl(out, pc.x, pc.z, y0 + SPIRE_Y1 - 0.2, y0 + SPIRE_Y1 + 2.6, 0.12, 4, dark, 0, 0.02, true, 0)
  for (let k = 0; k < 4; k++) {                          // lucarnes on the cardinal faces
    const a = aU + (k * Math.PI) / 2, r = SPIRE_R * 0.8
    cyl(out, pc.x + Math.sin(a) * r, pc.z + Math.cos(a) * r, y0 + SPIRE_Y0 + 6, y0 + SPIRE_Y0 + 9, 0.6, 4, trim, 0, 0.05, true, a + Math.PI / 4)
  }
  // the facade's front stair
  for (let k = 0; k < 4; k++) solid(U_WEST - 1.0 - k * 0.7, U_WEST + 0.2, -8.4 + k * 0.3, 8.4 - k * 0.3, 0, 0.6 - k * 0.12 + 0.05, shade(stone, 0.94), shade(stone, 0.9), 0)
}
