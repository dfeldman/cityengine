/**
 * ÉGLISE NOTRE-DAME-DU-TRAVAIL (59 rue Vercingétorix, 14e; OSM way/79687825; Astruc 1899-1902, MH 1976). A basilica of
 * cream limestone on an iron frame: a nave of ten bays under a shallow zinc gable between lean-to aisles, a round-arched
 * west front with a wide central portal, two lower side portals, a gable carrying a big blind arch, pinnacle pilasters,
 * and a corner stair turret each side; a low choir at the east and a taller parish block across the east end.
 * Measured from the IGN LiDAR HD surface model (docs/landmarks/MODEL-NOTRE-DAME-DU-TRAVAIL.md): aisle roofs 9-12 m,
 * nave eaves 18 m and ridge 21 m, east block 19-21 m. Photos: docs/landmarks/refs/nd-travail/. Drawn in the church's
 * (u, v) frame — u along the nave toward the east end, v across, centred on the nave — turned AXIS_DEG from east.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism as cyl } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 305.2                 // nave direction, west front toward the east end, degrees anticlockwise from east
const U_FRONT = -31.6, NAVE_U1 = 17.5, AISLE_U1 = 15
const NAVE_V = 5.3, AISLE_V = 13.2     // half-widths: nave, and the whole aisled block
const AISLE_EAVE = 9.3, AISLE_HI = 12.0 // lean-to roof: eave at the outer wall, top against the clerestory
const EAVE_H = 18.2, RIDGE_H = 21.2    // nave
const FRONT_HW = 6.9                    // half-width of the raised central front
const FRONT_EAVE = 19.0, FRONT_APEX = 23.0, PIN_H = 24.4
const AISLE_FRONT_H = 11.0
const TURRET_W = 3.2, TURRET_H = 11.8, TURRET_CAP = 13.6
const BAYS = 10, BAY0 = U_FRONT + 5.2
const WIN_NAVE = [13.2, 17.2, 1.5] as const, WIN_AISLE = [2.8, 7.0, 1.6] as const // y0, y1, width
const CHOIR_U1 = 24, CHOIR_V = 4.9, CHOIR_H = 12.5
const BLOCK_H = 17.8, BLOCK_RIDGE = 21
const STONE = '#d9ca9f', TRIM = '#e4d8b4', ROOF = '#5d636b', GLASS = '#2f394b', DOOR = '#4a3426', DARK = '#26272c', BLOCK = '#cdbd95'

const RING_UV: P2[] = [[-32.5, -18.5], [-28.0, -18.5], [-28.2, -15.8], [-20.9, -15.9], [-20.9, -12.6], [-14.9, -12.7], [-14.6, -15.6], [-8.6, -15.5], [-8.5, -12.8], [9.9, -13.3], [10.8, -13.2], [11.5, -13.3], [12.5, -13.3], [12.6, -14.8], [21.2, -14.8], [19.9, -20.2], [28.8, -22.8], [29.6, -20.0], [30.3, -17.4], [33.1, -7.5], [37.3, 7.2], [23.9, 11.0], [15.8, 13.2], [12.4, 13.2], [12.4, 12.3], [-25.2, 13.2], [-25.3, 13.5], [-26.0, 13.5], [-26.5, 13.8], [-27.8, 13.9], [-29.2, 12.8], [-29.0, 11.2], [-28.5, 10.7], [-31.6, 10.7], [-31.6, 3.1], [-31.2, 3.1], [-31.3, 0.1], [-31.3, -2.9], [-31.6, -2.9], [-31.7, -10.3], [-31.7, -11.4], [-32.5, -11.3]]

/** the outline in the builder's own east/north frame: the (u, v) outline turned AXIS_DEG */
export const RING: P2[] = RING_UV.map(([u, v]) => { const a = (AXIS_DEG * Math.PI) / 180; return [u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)] as P2 })

export function notreDameDuTravail(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK), blockC: Rgb = hex(BLOCK)
  const { en, P, solid, decal, round, cornice, ridge } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 14, corniceH: 0.5, corniceOut: 0.22 })
  const arch = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number, frame = true): void => {
    if (frame) decal(u, v, nu, nv, 0.04, round(t, y0 - 0.2, w + 0.7, h + 0.45), trim)
    decal(u, v, nu, nv, 0.09, round(t, y0, w, h), glass)
  }
  const front = U_FRONT
  // ── aisle block: walls, lean-to zinc roofs, buttress piers, round-arched windows ──
  for (const s of [-1, 1]) {
    solid(front + 0.3, AISLE_U1, s * NAVE_V, s * AISLE_V, 0, AISLE_EAVE, stone, null, 3)
    T.poly([P(front - 0.3, s * (AISLE_V + 0.35), AISLE_EAVE - 0.2), P(AISLE_U1 + 0.3, s * (AISLE_V + 0.35), AISLE_EAVE - 0.2), P(AISLE_U1 + 0.3, s * NAVE_V, AISLE_HI), P(front - 0.3, s * NAVE_V, AISLE_HI)], roofC, [...en(0, s), 0.8] as V3)
    cornice(front + 0.3, AISLE_U1, s > 0 ? AISLE_V - 0.1 : -AISLE_V, s > 0 ? AISLE_V : -AISLE_V + 0.1, AISLE_EAVE, 0.45, 0.2)
  }
  solid(AISLE_U1 - 0.1, AISLE_U1 + 0.2, -AISLE_V, AISLE_V, AISLE_EAVE, AISLE_HI - 0.3, stone, null, 3)
  const bl = (AISLE_U1 - 1.6 - BAY0) / BAYS
  for (let i = 0; i <= BAYS; i++) for (const s of [-1, 1]) {
    const u = BAY0 + i * bl - bl / 2
    solid(u - 0.35, u + 0.35, s > 0 ? AISLE_V : -AISLE_V - 0.4, s > 0 ? AISLE_V + 0.4 : -AISLE_V, 0, AISLE_EAVE + 0.5, shade(stone, 0.97), trim, 2)
  }
  for (let i = 0; i < BAYS; i++) {
    const u = BAY0 + i * bl
    for (const s of [-1, 1]) {
      arch(u, s * AISLE_V, 0, s, 0, WIN_AISLE[0], WIN_AISLE[2], WIN_AISLE[1] - WIN_AISLE[0])
      arch(u, s * NAVE_V, 0, s, 0, WIN_NAVE[0], WIN_NAVE[2], WIN_NAVE[1] - WIN_NAVE[0])
    }
  }
  // ── nave: clerestory wall, shallow zinc gable roof ──
  solid(front, NAVE_U1, -NAVE_V, NAVE_V, AISLE_HI - 0.5, EAVE_H, stone, null, 3)
  cornice(front, NAVE_U1, -NAVE_V, NAVE_V, EAVE_H, 0.5, 0.25)
  ridge('u', front, NAVE_U1, 0, NAVE_V + 0.3, EAVE_H, RIDGE_H)
  T.poly([P(NAVE_U1, -NAVE_V, EAVE_H), P(NAVE_U1, NAVE_V, EAVE_H), P(NAVE_U1, 0, RIDGE_H)], stone, [...en(1, 0), 0] as V3)

  // ── choir, and the parish block across the east end ──
  solid(NAVE_U1 - 0.2, CHOIR_U1, -CHOIR_V, CHOIR_V, 0, CHOIR_H, stone, roofC, 3)
  const blockPoly: P2[] = [[CHOIR_U1 - 0.3, -13.6], [30.0, -17.0], [33.1, -7.5], [37.3, 7.2], [CHOIR_U1 + 1, 11.0], [CHOIR_U1 - 0.3, 11.0]]
  T.prism(blockPoly.map(([u, v]) => en(u, v)), 0, BLOCK_H, blockC, roofC, 3)
  for (let k = 0; k < 4; k++) {            // a band of windows on the choir-side face of the block
    const v = -9.5 + k * 5.3
    for (const y of [3.2, 7.2, 11.2, 14.8]) decal(CHOIR_U1 - 0.3, v, -1, 0, 0.06, [[-0.55, y], [0.55, y], [0.55, y + 1.8], [-0.55, y + 1.8]], dark)
  }
  ridge('v', -13.6, 11.0, (CHOIR_U1 + 6) , 3.4, BLOCK_H, BLOCK_RIDGE, 0.2)

  // ── west front ──
  // aisle fronts: lower walls with a portal and a pair of windows, a raking cornice
  for (const s of [-1, 1]) {
    solid(front - 0.4, front + 0.5, s * FRONT_HW, s * AISLE_V, 0, AISLE_FRONT_H, stone, roofC, 3)
    const vc = s * (FRONT_HW + AISLE_V) / 2, hw = (AISLE_V - FRONT_HW) / 2
    decal(front - 0.4, vc, -1, 0, 0.05, round(0, 0, 3.6, 6.4), trim); decal(front - 0.4, vc, -1, 0, 0.1, round(0, 0, 2.6, 5.4), door)
    arch(front - 0.4, vc, -1, 0, -0.9, 7.6, 0.7, 2.0, false); arch(front - 0.4, vc, -1, 0, 0.9, 7.6, 0.7, 2.0, false)
    cornice(front - 0.4, front + 0.5, s * FRONT_HW, s * AISLE_V, AISLE_FRONT_H, 0.4, 0.2)
    void hw
  }
  // central front: raised wall, gable, pilasters topped by pinnacles
  solid(front - 0.4, front + 1.0, -FRONT_HW, FRONT_HW, 0, FRONT_EAVE, stone, null, 3)
  T.poly([P(front - 0.4, -FRONT_HW, FRONT_EAVE), P(front - 0.4, FRONT_HW, FRONT_EAVE), P(front - 0.4, 0, FRONT_APEX)], stone, [...en(-1, 0), 0] as V3)
  for (const s of [-1, 1]) {             // raking cornice up each gable slope
    const a = P(front - 0.5, s * FRONT_HW, FRONT_EAVE), b = P(front - 0.5, 0, FRONT_APEX), c = P(front - 0.5, 0, FRONT_APEX + 0.5), d = P(front - 0.5, s * FRONT_HW, FRONT_EAVE + 0.5)
    T.poly([a, b, c, d], trim, [...en(-1, 0), 0.4] as V3)
    solid(front - 0.7, front + 0.3, s > 0 ? FRONT_HW - 1.5 : -FRONT_HW - 0.1, s > 0 ? FRONT_HW + 0.1 : -FRONT_HW + 1.5, 0, PIN_H - 2.4, shade(stone, 0.96), trim, 2)
  }
  cornice(front - 0.4, front + 0.4, -FRONT_HW, FRONT_HW, 12.2, 0.45, 0.25)
  cornice(front - 0.4, front + 0.4, -FRONT_HW, FRONT_HW, FRONT_EAVE, 0.45, 0.25)
  // central portal: three orders of round arches, double doors
  decal(front - 0.4, 0, -1, 0, 0.05, round(0, 0, 8.4, 10.0), shade(trim, 0.9)); decal(front - 0.4, 0, -1, 0, 0.1, round(0, 0, 7.4, 9.2), trim)
  decal(front - 0.4, 0, -1, 0, 0.15, round(0, 0, 6.4, 8.4), dark); decal(front - 0.4, 0, -1, 0, 0.2, round(0, 0, 4.2, 5.6), door)
  decal(front - 0.4, 0, -1, 0, 0.2, round(0, 5.8, 4.2, 2.6), glass)
  // shoulder windows, pairs either side of the centre, and the big gable arch
  for (const t of [-3.3, -4.9, 3.3, 4.9]) arch(front - 0.4, 0, -1, 0, t, 12.9, 0.9, 2.8)
  decal(front - 0.4, 0, -1, 0, 0.05, round(0, 15.6, 5.8, 5.4), trim); decal(front - 0.4, 0, -1, 0, 0.1, round(0, 15.8, 4.8, 4.8), shade(stone, 0.93))
  for (const t of [-2.0, 2.0]) decal(front - 0.4, 0, -1, 0, 0.14, [[t - 0.15, 15.8], [t + 0.15, 15.8], [t + 0.15, 18.6], [t - 0.15, 18.6]], trim)
  // corner stair turrets with hip caps; low annex on the south-west
  const spot = (u: number, v: number): { x: number; z: number } => { const [e, n] = en(u, v); return F.xz(e, n) }
  const aU = Math.atan2(F.n([Math.cos((AXIS_DEG * Math.PI) / 180), Math.sin((AXIS_DEG * Math.PI) / 180), 0])[0], F.n([Math.cos((AXIS_DEG * Math.PI) / 180), Math.sin((AXIS_DEG * Math.PI) / 180), 0])[2])
  const y0 = F.y0
  for (const s of [-1, 1]) {
    const vc = s * (AISLE_V - 1.0)
    solid(front - 0.6, front + TURRET_W * 1.2, vc - TURRET_W / 2 - 0.2, vc + TURRET_W / 2 + 0.2, 0, TURRET_H, shade(stone, 0.97), trim, 3)
    cornice(front - 0.6, front + TURRET_W * 1.2, vc - TURRET_W / 2 - 0.2, vc + TURRET_W / 2 + 0.2, TURRET_H, 0.5, 0.2)
    const p = spot(front + TURRET_W * 0.3, vc)
    cyl(out, p.x, p.z, y0 + TURRET_H, y0 + TURRET_CAP, 2.3, 4, roofC, 0, 0.12, true, aU + Math.PI / 4)
    for (const y of [3.0, 7.0]) decal(front - 0.6, vc, -1, 0, 0.05, [[-0.25, y], [0.25, y], [0.25, y + 1.5], [-0.25, y + 1.5]], dark)
    const pp = spot(front - 0.1, s * (FRONT_HW - 0.7))
    cyl(out, pp.x, pp.z, y0 + PIN_H - 2.4, y0 + PIN_H, 0.62, 8, stone, 0, 0.1, true, aU)
  }
  solid(front - 0.9, front + 3.0, -AISLE_V - 5.3, -AISLE_V - 0.3, 0, 4.2, shade(stone, 0.95), roofC, 3)
  // the front steps
  for (let k = 0; k < 4; k++) solid(front - 1.0 - k * 0.55, front, -5.2 + k * 0.4, 5.2 - k * 0.4, 0, 0.55 - k * 0.13, shade(stone, 0.94), shade(stone, 0.9), 0)
  // east face of the nave above the choir, the small bell-frame on the nave's east end
  const bc = spot(NAVE_U1 - 1.5, 0)
  cyl(out, bc.x, bc.z, y0 + RIDGE_H - 0.3, y0 + RIDGE_H + 1.8, 0.35, 6, dark, 0, 0.25, true, 0)
}
