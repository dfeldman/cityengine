/**
 * ÉGLISE SAINT-ANTOINE-DES-QUINZE-VINGTS (57 bis rue de Charenton side street, 12e; OSM way/94236417). A c.1903 parish
 * church dressed as a town house: a flat street front of cream brick and tan stone, three levels (stone plinth, tall
 * grilled ground-floor windows under blind round arches, tall upper windows), a stone cornice and a slate mansard with
 * five pedimented dormers; a round stone portal in the middle with a timber gabled porch. Behind it the nave is a plain
 * brick box under a slate gable. The IGN MNS shows a 27 m mass at the west corner of the outline; the photographs show a
 * neighbour's party wall there, not a tower, so none is drawn. Frames: B (street front, u' outward, v' to the viewer's
 * right) and A (nave, u east end-ward at -28.5 deg). Photos: docs/landmarks/refs/quinze-vingts/.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres) ──────────────────────────────────────────────────────────────────────────────────────────
const AXIS_A = -28.5, AXIS_B = 130.7        // nave direction; street-front outward normal (degrees anticlockwise from east)
const FRONT_M: P2 = [-21.05, 15.4]          // middle of the street front in the footprint's (e, n)
const FRONT_HALF = 10.75, FRONT_DEPTH = 11, DRIFT = 0.38   // front half-width; block depth; wall drift per metre of depth
const EAVE_FRONT = 12, RIDGE_FRONT = 16.5, RIDGE_AT = 5.5  // cornice height, mansard ridge, its depth behind the front
const EAVE_NAVE = 10.5, NAVE_U0 = -16, NAVE_U1 = 43, NAVE_V0 = -7.2, NAVE_V1 = 12.2
/** the nave roof in steps along u (IGN MNS: ridge 16 over the west bays, 19.5-20 over the middle, 17 to the east end) */
const RIDGES: [number, number, number][] = [[NAVE_U0, 2, 16.3], [2, 22, 19.5], [22, NAVE_U1, 17]]
const PLINTH = 2.2, SILL1 = 2.4, TOP1 = 4.9, ARCH_Y = 5.4, SILL2 = 7.5, TOP2 = 10.4
const BAYS_UP = [-8.1, -5.4, -3.7, -0.9, 0.9, 3.7, 5.4, 8.1], BAYS_LOW = [-5.2, -3.5, 3.5, 5.2], DOORS = [-8.1, 8.1]
const DORMERS = [-8, -4, 0, 4, 8]
const NAVE_BAY = 6.5
const BRICK = '#dcc990', STONE = '#b8a888', TRIM = '#cbbb96', ROOF = '#4a5058', GLASS = '#343a46', WOOD = '#4e3023', DARK = '#26272c'

export const RING: P2[] = [[37.7, -7.0], [36.3, -9.6], [33.9, -8.4], [35.3, -5.7], [25.4, -0.6], [22.6, 0.9], [21.5, 2.1], [17.3, 4.4], [15.7, 5.3], [11.8, 7.5], [6.3, 10.4], [0.9, 13.4], [-2.4, 15.2], [-4.5, 16.4], [-5.8, 17.1], [-10.0, 19.4], [-12.6, 22.1], [-12.9, 22.4], [-16.2, 19.5], [-17.1, 18.8], [-21.2, 15.2], [-24.3, 12.7], [-29.2, 8.4], [-28.0, 7.8], [-22.7, 4.8], [-19.1, 2.8], [-15.5, 0.7], [-13.7, -0.2], [-8.4, -3.2], [-3.0, -6.3], [2.5, -9.4], [6.4, -11.6], [7.9, -12.4], [16.1, -17.1], [25.7, -22.5], [30.7, -25.3], [34.4, -27.4], [38.6, -19.5], [41.8, -13.4], [43.6, -10.0], [40.3, -8.3], [38.3, -7.3]]

export function saintAntoineQuinzeVingts(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const brick: Rgb = hex(BRICK), stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), wood: Rgb = hex(WOOD), dark: Rgb = hex(DARK)
  const A = churchKit({ axisDeg: AXIS_A, T, roofC, stone: brick, trim, corniceH: 0.5, corniceOut: 0.2 })
  const B = churchKit({ axisDeg: AXIS_B, T, roofC, stone: brick, trim, corniceH: 0.5, corniceOut: 0.25 })
  const [me, mn] = FRONT_M
  const bE = (u: number, v: number): P2 => { const [e, n] = B.en(u, v); return [me + e, mn + n] }   // frame B -> footprint (e, n)
  const bP = (u: number, v: number, h: number): V3 => { const p = bE(u, v); return [p[0], p[1], h] }
  /** a flat shape on the street front (frame B, face u' = 0): t along the front, height */
  const fd = (off: number, pts: [number, number][], col: Rgb): void => T.poly(pts.map(([t, y]) => bP(off, t, y)), col, [1.0 * Math.cos((AXIS_B * Math.PI) / 180), Math.sin((AXIS_B * Math.PI) / 180), 0] as V3)
  const nB: V3 = [Math.cos((AXIS_B * Math.PI) / 180), Math.sin((AXIS_B * Math.PI) / 180), 0]
  const fpoly = (pts: V3[], col: Rgb, hint: V3): void => T.poly(pts, col, hint)
  const fbox = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, side: Rgb, top: Rgb | null = side): void =>
    T.prism([bE(u0, v0), bE(u1, v0), bE(u1, v1), bE(u0, v1)], y0, y1, side, top, 0)

  // ── walls: the whole footprint in brick, the street block taller ──
  T.prism(RING, 0, EAVE_NAVE, brick, null, 3)
  const wedge: P2[] = [bE(0, FRONT_HALF), bE(0, -FRONT_HALF), bE(-FRONT_DEPTH, -FRONT_HALF - DRIFT * FRONT_DEPTH), bE(-FRONT_DEPTH, FRONT_HALF - DRIFT * FRONT_DEPTH)]
  T.prism(wedge, EAVE_NAVE - 0.5, EAVE_FRONT, brick, null, 3)
  fbox(-0.05, 0.14, -FRONT_HALF, FRONT_HALF, 0, PLINTH, stone, stone)                     // rusticated plinth
  for (const y of [5.1, 7.0, 10.9]) fbox(-0.05, 0.1, -FRONT_HALF, FRONT_HALF, y, y + 0.3, trim, trim)   // string courses
  fbox(-0.1, 0.5, -FRONT_HALF - 0.1, FRONT_HALF + 0.1, EAVE_FRONT - 0.55, EAVE_FRONT, trim, trim)         // cornice
  for (const t of [-FRONT_HALF + 0.35, FRONT_HALF - 0.35]) fbox(-0.05, 0.12, t - 0.35, t + 0.35, PLINTH, EAVE_FRONT - 0.5, stone, stone)   // corner quoins

  // ── street-front windows ──
  const win = (t: number, y0: number, y1: number, w: number): void => {
    fd(0.04, [[t - w / 2 - 0.22, y0 - 0.2], [t + w / 2 + 0.22, y0 - 0.2], [t + w / 2 + 0.22, y1 + 0.1], [t - w / 2 - 0.22, y1 + 0.1]], trim)
    fd(0.09, [[t - w / 2, y0], [t + w / 2, y0], [t + w / 2, y1], [t - w / 2, y1]], wood)
    fd(0.12, [[t - w / 2 + 0.12, y0 + 0.12], [t + w / 2 - 0.12, y0 + 0.12], [t + w / 2 - 0.12, y1 - 0.12], [t - w / 2 + 0.12, y1 - 0.12]], glass)
  }
  for (const t of BAYS_UP) win(t, SILL2, TOP2, 1.05)
  for (const t of BAYS_LOW) {
    win(t, SILL1, TOP1, 1.3)
    for (let k = 0; k < 4; k++) fd(0.16, [[t - 0.55 + k * 0.37, SILL1], [t - 0.5 + k * 0.37, SILL1], [t - 0.5 + k * 0.37, TOP1], [t - 0.55 + k * 0.37, TOP1]], dark)   // window grille
    fd(0.04, B.round(t, ARCH_Y, 1.6, 1.5), shade(brick, 0.9)); fd(0.07, B.round(t, ARCH_Y + 0.12, 1.3, 1.3), shade(brick, 0.97))   // blind arch
  }
  for (const t of DOORS) { fd(0.05, B.round(t, 0, 1.9, 3.5), trim); fd(0.1, B.round(t, 0, 1.4, 3.3), wood) }

  // ── the portal and its timber porch ──
  fd(0.06, B.round(0, 0, 5.4, 7.2), stone); fd(0.11, B.round(0, 0, 4.4, 6.7), shade(stone, 0.88))
  fd(0.16, B.round(0, 0, 3.7, 6.3), wood)
  fd(0.2, [[-1.85, 3.8], [1.85, 3.8], [1.85, 4.2], [-1.85, 4.2]], dark)
  fd(0.2, [[-0.12, 4.6], [0.12, 4.6], [0.12, 6.0], [-0.12, 6.0]], hex('#c9a24a')); fd(0.2, [[-0.6, 5.3], [0.6, 5.3], [0.6, 5.5], [-0.6, 5.5]], hex('#c9a24a'))
  const PO = 2.3, PW = 3.0
  for (const s of [-1, 1]) {
    fpoly([bP(0, 0, 8.7), bP(PO, 0, 7.2), bP(PO, s * PW, 5.9), bP(0, s * PW, 7.4)], wood, [0, 0, 1] as V3)
    fpoly([bP(PO, 0, 7.2), bP(PO, s * PW, 5.9), bP(PO, s * PW, 5.7), bP(PO, 0, 7.0)], shade(wood, 0.8), nB)
  }
  for (const s of [-1, 1]) fbox(PO - 0.25, PO - 0.05, s * (PW - 0.3) - 0.1, s * (PW - 0.3) + 0.1, 2.4, 6.2, wood, wood)   // porch posts

  // ── mansard roof over the street block and its five dormers ──
  const rk = (u: number, v: number, h: number): V3 => bP(u, v, h)
  fpoly([rk(0.35, FRONT_HALF + 0.2, EAVE_FRONT - 0.2), rk(0.35, -FRONT_HALF - 0.2, EAVE_FRONT - 0.2), rk(-RIDGE_AT, -FRONT_HALF - 0.2 - DRIFT * RIDGE_AT, RIDGE_FRONT), rk(-RIDGE_AT, FRONT_HALF + 0.2 - DRIFT * RIDGE_AT, RIDGE_FRONT)], roofC, [nB[0], nB[1], 0.9] as V3)
  fpoly([rk(-RIDGE_AT, FRONT_HALF + 0.2 - DRIFT * RIDGE_AT, RIDGE_FRONT), rk(-RIDGE_AT, -FRONT_HALF - 0.2 - DRIFT * RIDGE_AT, RIDGE_FRONT), rk(-FRONT_DEPTH - 0.4, -FRONT_HALF - 0.2 - DRIFT * (FRONT_DEPTH + 0.4), EAVE_FRONT - 0.4), rk(-FRONT_DEPTH - 0.4, FRONT_HALF + 0.2 - DRIFT * (FRONT_DEPTH + 0.4), EAVE_FRONT - 0.4)], roofC, [-nB[0], -nB[1], 0.9] as V3)
  for (const t of DORMERS) {
    const w = 1.1, y0 = EAVE_FRONT, y1 = EAVE_FRONT + 2.6, ap = y1 + 1.5
    fbox(-1.6, -0.15, t - w, t + w, y0 - 0.1, y1, stone, null)
    fd(0.02, [[t - w - 0.12, y1], [t + w + 0.12, y1], [t, ap]], stone)                       // pediment
    fd(0.04, [[t - 0.45, y0 + 0.4], [t + 0.45, y0 + 0.4], [t + 0.45, y0 + 2.0], [t - 0.45, y0 + 2.0]], wood)
    fd(0.06, [[t - 0.37, y0 + 0.5], [t + 0.37, y0 + 0.5], [t + 0.37, y0 + 1.9], [t - 0.37, y0 + 1.9]], glass)
    for (const s of [-1, 1]) fpoly([rk(0.0, t + s * (w + 0.12), y1), rk(0.0, t, ap), rk(-1.8, t, ap - 0.2), rk(-1.8, t + s * (w + 0.12), y1 - 0.15)], roofC, [0, 0, 1] as V3)
  }
  void nB

  // ── nave: a plain brick box under a slate gable, arched windows and pilasters on both flanks ──
  const rc = (NAVE_V0 + NAVE_V1) / 2, half = (NAVE_V1 - NAVE_V0) / 2
  for (const [a0, a1, hr] of RIDGES) A.ridge('u', a0, a1, rc, half, EAVE_NAVE, hr, 0.3)
  for (let i = 0; i < RIDGES.length; i++) {          // brick gables where the roof steps, and at both ends
    const [a0, a1, hr] = RIDGES[i]
    if (i === 0) A.gable('v', a0 - 0.02, rc, half + 0.3, EAVE_NAVE, hr, -1, brick)
    const nx = RIDGES[i + 1]
    if (!nx) A.gable('v', a1 + 0.02, rc, half + 0.3, EAVE_NAVE, hr, 1, brick)
    else if (nx[2] > hr) A.gable('v', a1 + 0.02, rc, half + 0.3, EAVE_NAVE, nx[2], -1, brick)
    else A.gable('v', a1 - 0.02, rc, half + 0.3, EAVE_NAVE, hr, 1, brick)
  }
  A.cornice(NAVE_U0, NAVE_U1, NAVE_V1 - 0.1, NAVE_V1, EAVE_NAVE, 0.5, 0.2)
  A.cornice(NAVE_U0, NAVE_U1, NAVE_V0, NAVE_V0 + 0.1, EAVE_NAVE, 0.5, 0.2)
  const nb = Math.floor((NAVE_U1 - NAVE_U0 - 4) / NAVE_BAY)
  for (let i = 0; i < nb; i++) {
    const u = NAVE_U0 + 4 + (i + 0.5) * NAVE_BAY
    for (const [v, s] of [[NAVE_V1, 1], [NAVE_V0, -1]] as [number, number][]) {
      A.decal(u, v, 0, s, 0.04, A.round(0, 3.6, 2.5, 5.6), trim)
      A.decal(u, v, 0, s, 0.09, A.round(0, 3.8, 2.0, 5.2), glass)
      A.solid(u + NAVE_BAY / 2 - 0.3, u + NAVE_BAY / 2 + 0.3, s > 0 ? v : v - 0.4, s > 0 ? v + 0.4 : v, 0, EAVE_NAVE + 0.3, stone, stone, 2)
    }
  }
  A.decal(NAVE_U1, rc, 1, 0, 0.05, A.disc(0, 14.6, 1.6), trim); A.decal(NAVE_U1, rc, 1, 0, 0.09, A.disc(0, 14.6, 1.25), glass)
  A.decal(NAVE_U1, rc, 1, 0, 0.05, A.round(0, 3.0, 3.0, 7.0), trim); A.decal(NAVE_U1, rc, 1, 0, 0.09, A.round(0, 3.2, 2.5, 6.4), wood)
}
