/**
 * ÉGLISE SAINTE-MARIE-DES-BATIGNOLLES (place du Docteur-Félix-Lobligeois, 17e; OSM way/75750389, MH 1975). A Restoration
 * church (Lusson, 1828) of cream limestone with a plain neoclassical front: a tetrastyle portico (four unfluted columns,
 * entablature with a frieze of rosettes and the dedication, a pediment with a clock and a cross) before a blank nave end
 * wall, flanked by lower wings. Measured from the IGN LiDAR HD surface model (docs/landmarks/MODEL-SAINTE-MARIE-BATIGNOLLES.md):
 * portico ridge ~9.5 m, aisle wings 9-10 m, nave 15 m at the eaves and 17.3 m at the shallow zinc ridge, a full-width
 * choir block behind (u 12..22), then a low chevet (6.5 m) with a 13 m apse. Photos: docs/landmarks/refs/sainte-marie-batignolles/.
 * Frame: metres east/north of the church's centroid; u along the nave from the front (south-east) toward the apse, v across.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism as cyl } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 138.6                   // nave direction, front toward apse, degrees anticlockwise from east
const U_FRONT = -19.2, U_CHOIR0 = 12, U_CHOIR1 = 22, U_END = 29.3      // main front wall, choir block, chevet end
const V0 = -12.2, V1 = 12.7              // outer walls
const NAVE_V0 = -6.2, NAVE_V1 = 6.7      // nave wall faces (aisles beyond)
const NAVE_EAVE = 15, NAVE_RIDGE = 17.3
const AISLE_EAVE = 8.4, AISLE_HI = 10.4  // lean-to roof from the outer wall to the nave wall
const WING_PARAPET = 7.8                 // the wings' cornice height at the front
const CHEVET_H = 6.6, APSE_V = 3.3, APSE_H = 13, APSE_U0 = 22
// portico
const POR_U0 = -22.0, POR_V = 0.6, POR_HALF = 4.3, COL_H = 6.4, COL_R = 0.52, ENT_H = 1.35, PED_RISE = 1.75, COLS = 4
const STEPS = 3, STEP_H = 0.18, STEP_D = 0.5
const DOOR_W = 2.3, DOOR_H = 4.4
const BAY = 3.7, WIN_W = 1.5, WIN_H = 4.2, WIN_Y = 2.5
const STONE = '#d4cbb2', TRIM = '#e1dac6', ROOF = '#7f8892', GLASS = '#3c4658', DOOR = '#3f3228', DARK = '#26272c', CLOCK = '#efe9d6', IRON = '#1f2024'

export const RING: P2[] = [[5.4, -22.1], [9.7, -17.3], [10.2, -17.8], [11.5, -16.3], [13.4, -17.9], [18.8, -12.0], [17.0, -10.3], [18.3, -8.9], [17.9, -8.5], [19.8, -6.5], [22.2, -3.8], [1.1, 15.2], [-6.9, 22.4], [-7.2, 22.0], [-13.9, 28.0], [-21.0, 20.3], [-24.2, 16.7], [-30.0, 10.4], [-23.6, 4.6], [-23.9, 4.3], [-15.7, -3.1]]

export function saintMarieBatignolles(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK), clock: Rgb = hex(CLOCK), iron: Rgb = hex(IRON)
  const { en, P, solid, decal, round, disc, cornice } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 16, corniceH: 0.5, corniceOut: 0.25 })
  const nrm = (u: number, v: number, up = 1): V3 => [...en(u, v), up] as V3
  const win = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.04, round(t, y0 - 0.2, w + 0.5, h + 0.35), trim)
    decal(u, v, nu, nv, 0.09, round(t, y0, w, h), glass)
    decal(u, v, nu, nv, 0.13, [[t - 0.05, y0], [t + 0.05, y0], [t + 0.05, y0 + h * 0.75], [t - 0.05, y0 + h * 0.75]], trim)
  }
  const vc = (V0 + V1) / 2, vh = (V1 - V0) / 2

  // ── aisle block, nave and choir walls ──
  solid(U_FRONT, U_CHOIR1, V0, V1, 0, AISLE_EAVE, stone, null, 3)
  solid(U_FRONT, U_CHOIR0, NAVE_V0, NAVE_V1, AISLE_EAVE - 0.5, NAVE_EAVE, stone, null, 3)
  solid(U_CHOIR0, U_CHOIR1, V0, V1, AISLE_EAVE - 0.5, NAVE_EAVE + 0.2, stone, null, 3)
  for (const [v0, v1, vo, vi] of [[V0, NAVE_V0, V0, NAVE_V0], [NAVE_V1, V1, V1, NAVE_V1]] as [number, number, number, number][]) {
    // aisle lean-to roof
    T.poly([P(U_FRONT - 0.3, vo + Math.sign(vo - vi) * 0.35, AISLE_EAVE - 0.1), P(U_CHOIR0, vo + Math.sign(vo - vi) * 0.35, AISLE_EAVE - 0.1), P(U_CHOIR0, vi, AISLE_HI), P(U_FRONT - 0.3, vi, AISLE_HI)], roofC, nrm(0, Math.sign(vo - vi), 0.8))
    void v0; void v1
  }
  cornice(U_FRONT, U_CHOIR1, V0, V0 + 0.1, AISLE_EAVE, 0.55, 0.3)
  cornice(U_FRONT, U_CHOIR1, V1 - 0.1, V1, AISLE_EAVE, 0.55, 0.3)
  cornice(U_FRONT, U_FRONT + 0.1, V0, V1, AISLE_EAVE, 0.55, 0.3)

  // ── nave: shallow zinc gable, ridge along u ──
  for (const s of [-1, 1]) {
    const vE = s < 0 ? NAVE_V0 : NAVE_V1
    T.poly([P(U_FRONT - 0.3, vE + s * 0.3, NAVE_EAVE - 0.15), P(U_CHOIR1 - 0.5, vE + s * 0.3, NAVE_EAVE - 0.15), P(U_CHOIR1 - 0.5, (NAVE_V0 + NAVE_V1) / 2, NAVE_RIDGE), P(U_FRONT - 0.3, (NAVE_V0 + NAVE_V1) / 2, NAVE_RIDGE)], roofC, nrm(0, s, 1))
  }
  cornice(U_FRONT, U_CHOIR0, NAVE_V0, NAVE_V1, NAVE_EAVE, 0.55, 0.3)
  // the blank gable wall over the portico
  const nc = (NAVE_V0 + NAVE_V1) / 2
  T.poly([P(U_FRONT - 0.05, NAVE_V0, NAVE_EAVE), P(U_FRONT - 0.05, NAVE_V1, NAVE_EAVE), P(U_FRONT - 0.05, nc, NAVE_RIDGE)], stone, nrm(-1, 0, 0))
  // corner pilasters of the nave front
  for (const v of [NAVE_V0, NAVE_V1]) solid(U_FRONT - 0.35, U_FRONT, v - 0.55, v + 0.55, 0, NAVE_EAVE - 0.4, shade(stone, 0.97), trim, 2)

  // ── choir block: full width, low gable along u, end gables ──
  for (const s of [-1, 1]) {
    const vE = s < 0 ? V0 : V1
    T.poly([P(U_CHOIR0 - 0.2, vE + s * 0.3, NAVE_EAVE), P(U_CHOIR1 + 0.3, vE + s * 0.3, NAVE_EAVE), P(U_CHOIR1 + 0.3, vc, NAVE_RIDGE), P(U_CHOIR0 - 0.2, vc, NAVE_RIDGE)], roofC, nrm(0, s, 1))
  }
  cornice(U_CHOIR0, U_CHOIR1, V0, V1, NAVE_EAVE + 0.2, 0.5, 0.3)
  for (const [u, o] of [[U_CHOIR0 - 0.05, -1], [U_CHOIR1 + 0.05, 1]] as [number, number][])
    T.poly([P(u, V0, NAVE_EAVE + 0.2), P(u, V1, NAVE_EAVE + 0.2), P(u, vc, NAVE_RIDGE)], stone, nrm(o, 0, 0))

  // ── chevet: low block with a taller half-round apse ──
  solid(U_CHOIR1, U_END, V0, V1, 0, CHEVET_H, stone, trim, 3)
  cornice(U_CHOIR1, U_END, V0, V1, CHEVET_H, 0.45, 0.25)
  const AN = 6, AC = U_END - APSE_V
  const aq = (k: number, r: number): P2 => { const a = -Math.PI / 2 + (k / AN) * Math.PI; return [AC + r * Math.cos(a), vc + r * Math.sin(a)] }
  const apse: P2[] = [[APSE_U0, vc - APSE_V], [APSE_U0, vc + APSE_V]]
  for (let k = 0; k <= AN; k++) apse.unshift(aq(k, APSE_V))
  T.prism(apse.map(([u, v]) => en(u, v)), 0, APSE_H, stone, null, 3)
  for (let k = 0; k < AN; k++) {
    const a = aq(k, APSE_V + 0.25), b = aq(k + 1, APSE_V + 0.25), mid = -Math.PI / 2 + ((k + 0.5) / AN) * Math.PI
    T.poly([P(a[0], a[1], APSE_H - 0.1), P(b[0], b[1], APSE_H - 0.1), P(AC, vc, APSE_H + 1.4)], roofC, [...en(Math.cos(mid), Math.sin(mid)), 0.8] as V3)
  }

  // ── windows: round-headed, along the aisle walls and the choir ──
  const nb = Math.floor((U_CHOIR0 - U_FRONT - 4) / BAY)
  for (let i = 0; i < nb; i++) {
    const u = U_FRONT + 3.4 + i * BAY
    win(u, V0, 0, -1, 0, WIN_Y, WIN_W, WIN_H); win(u, V1, 0, 1, 0, WIN_Y, WIN_W, WIN_H)
    for (const s of [-1, 1]) win(u, s < 0 ? NAVE_V0 : NAVE_V1, 0, s, 0, 11.4, 1.0, 2.4)      // nave wall above the aisle roof
  }
  for (const u of [U_CHOIR0 + 3.2, U_CHOIR0 + 6.8]) { win(u, V0, 0, -1, 0, 3.2, WIN_W, 5.4); win(u, V1, 0, 1, 0, 3.2, WIN_W, 5.4) }
  win(U_CHOIR1 - 0, vc, 1, 0, 0, 7.4, 1.4, 4.4)

  // ── front: wings with a stringcourse, the portico, the door ──
  for (const [v0, v1] of [[V0, NAVE_V0 - 0.6], [NAVE_V1 + 0.6, V1]] as [number, number][]) {
    solid(U_FRONT - 0.2, U_FRONT, v0, v1, 0, WING_PARAPET, stone, trim, 3)
    solid(U_FRONT - 0.5, U_FRONT, v0, v1, WING_PARAPET - 0.55, WING_PARAPET, trim, trim, 0)
    solid(U_FRONT - 0.3, U_FRONT, v0, v1, 3.2, 3.5, trim, trim, 0)
    solid(U_FRONT - 0.3, U_FRONT, v0, v1, 0, 0.7, shade(stone, 0.93), shade(stone, 0.9), 2)
  }
  const pu = POR_U0, pv0 = POR_V - POR_HALF, pv1 = POR_V + POR_HALF
  // columns (slightly tapering) and antae against the wall
  const bay = (2 * (POR_HALF - 0.55)) / (COLS - 1)
  for (let k = 0; k < COLS; k++) {
    const [e, n] = en(pu + 0.85, POR_V - POR_HALF + 0.55 + k * bay), p = F.xz(e, n)
    cyl(out, p.x, p.z, F.y0 + 0.0, F.y0 + COL_H, COL_R, 14, shade(stone, 0.96), 0, COL_R * 0.88, true, 0)
    cyl(out, p.x, p.z, F.y0 + COL_H, F.y0 + COL_H + 0.25, COL_R * 1.25, 4, trim, 0, COL_R * 1.25, true, Math.PI / 4 + 0)
    cyl(out, p.x, p.z, F.y0 + 0.0, F.y0 + 0.28, COL_R * 1.2, 4, trim, 0, COL_R * 1.2, true, Math.PI / 4)
  }
  for (const v of [pv0 + 0.1, pv1 - 0.1]) solid(U_FRONT - 0.75, U_FRONT, v - 0.35, v + 0.35, 0, COL_H + 0.2, shade(stone, 0.97), trim, 2)
  // entablature, pediment, steps
  solid(pu, U_FRONT, pv0 - 0.25, pv1 + 0.25, COL_H, COL_H + ENT_H * 0.7, shade(trim, 0.96), trim, 0)
  solid(pu - 0.1, U_FRONT, pv0 - 0.35, pv1 + 0.35, COL_H + ENT_H * 0.7, COL_H + ENT_H, trim, trim, 0)
  const yB = COL_H + ENT_H, yR = yB + PED_RISE
  T.poly([P(pu - 0.1, pv0 - 0.4, yB), P(pu - 0.1, pv1 + 0.4, yB), P(pu - 0.1, POR_V, yR)], shade(stone, 1.02), nrm(-1, 0, 0))
  for (const s of [-1, 1]) T.poly([P(pu - 0.2, POR_V + s * (POR_HALF + 0.45), yB - 0.05), P(U_FRONT, POR_V + s * (POR_HALF + 0.45), yB - 0.05), P(U_FRONT, POR_V, yR + 0.05), P(pu - 0.2, POR_V, yR + 0.05)], roofC, nrm(0, s, 1))
  cornice(pu, pu + 0.05, pv0 - 0.4, pv1 + 0.4, yB + 0.05, 0.3, 0.15)
  // frieze: rosette roundels, the clock in the pediment, the cross
  const nr = 7
  for (let i = 0; i < nr; i++) {
    const t = (i - (nr - 1) / 2) * ((2 * POR_HALF) / nr)
    decal(pu - 0.1, POR_V, -1, 0, 0.05, disc(t, COL_H + ENT_H * 0.35, 0.28), shade(trim, 0.88))
  }
  decal(pu - 0.1, POR_V, -1, 0, 0.07, [[-POR_HALF + 0.3, COL_H + ENT_H * 0.1], [POR_HALF - 0.3, COL_H + ENT_H * 0.1], [POR_HALF - 0.3, COL_H + ENT_H * 0.18], [-POR_HALF + 0.3, COL_H + ENT_H * 0.18]], shade(trim, 0.82))
  decal(pu - 0.1, POR_V, -1, 0, 0.08, disc(0, yB + PED_RISE * 0.42, 0.52), trim)
  decal(pu - 0.1, POR_V, -1, 0, 0.12, disc(0, yB + PED_RISE * 0.42, 0.42), clock)
  decal(pu - 0.1, POR_V, -1, 0, 0.16, [[-0.03, yB + PED_RISE * 0.42], [0.03, yB + PED_RISE * 0.42], [0.03, yB + PED_RISE * 0.42 + 0.34], [-0.03, yB + PED_RISE * 0.42 + 0.34]], dark)
  decal(pu - 0.1, POR_V, -1, 0, 0.16, [[0, yB + PED_RISE * 0.42 - 0.03], [0.26, yB + PED_RISE * 0.42 - 0.03], [0.26, yB + PED_RISE * 0.42 + 0.03], [0, yB + PED_RISE * 0.42 + 0.03]], dark)
  const cp = (() => { const [e, n] = en(pu - 0.1, POR_V); return F.xz(e, n) })()
  cyl(out, cp.x, cp.z, F.y0 + yR, F.y0 + yR + 0.5, 0.22, 4, trim, 0, 0.2, true, 0)
  cyl(out, cp.x, cp.z, F.y0 + yR + 0.5, F.y0 + yR + 1.7, 0.07, 4, shade(trim, 0.92), 0, 0.07, true, 0)
  cyl(out, cp.x, cp.z, F.y0 + yR + 1.15, F.y0 + yR + 1.3, 0.38, 4, shade(trim, 0.92), 0, 0.38, true, Math.PI / 4 + (AXIS_DEG * Math.PI) / 180)
  // door under the portico, with a plain surround and a slim cornice over it
  decal(U_FRONT, POR_V, -1, 0, 0.05, [[-DOOR_W / 2 - 0.35, 0], [DOOR_W / 2 + 0.35, 0], [DOOR_W / 2 + 0.35, DOOR_H + 0.35], [-DOOR_W / 2 - 0.35, DOOR_H + 0.35]], trim)
  decal(U_FRONT, POR_V, -1, 0, 0.1, [[-DOOR_W / 2, 0], [DOOR_W / 2, 0], [DOOR_W / 2, DOOR_H], [-DOOR_W / 2, DOOR_H]], door)
  decal(U_FRONT, POR_V, -1, 0, 0.13, [[-0.04, 0], [0.04, 0], [0.04, DOOR_H], [-0.04, DOOR_H]], dark)
  for (const t of [-DOOR_W / 4, DOOR_W / 4]) decal(U_FRONT, POR_V, -1, 0, 0.13, [[t - 0.3, DOOR_H - 1.3], [t + 0.3, DOOR_H - 1.3], [t + 0.3, DOOR_H - 0.3], [t - 0.3, DOOR_H - 0.3]], glass)
  solid(U_FRONT - 0.5, U_FRONT, POR_V - DOOR_W / 2 - 0.7, POR_V + DOOR_W / 2 + 0.7, DOOR_H + 0.4, DOOR_H + 0.7, trim, trim, 0)
  // steps and a low iron railing along the street edge
  for (let k = 0; k < STEPS; k++) solid(pu - (k + 1) * STEP_D + 0.5, pu + 0.5 - k * STEP_D, pv0 - 0.6 - k * 0.1, pv1 + 0.6 + k * 0.1, 0, (STEPS - k) * STEP_H, shade(stone, 0.94), shade(stone, 0.9), 0)
  void iron; void vh
}
