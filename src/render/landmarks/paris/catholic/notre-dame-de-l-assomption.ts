/**
 * ÉGLISE NOTRE-DAME-DE-L'ASSOMPTION (former Visitandines chapel by Charles Errard, 1670-76; rue Saint-Honoré, 1er;
 * OSM way/54168792, now the Polish church). A domed rotunda in weathered buff stone: a hexastyle Corinthian portico
 * under a pediment on the east, two low slate-roofed wings flanking it, a squat lower drum with a garland frieze, an
 * upper drum of tall windows alternating with round niches, a cornice, and a ribbed slate hemispherical dome with a
 * small lantern and cross. Measured from the IGN LiDAR HD surface model (docs/landmarks/MODEL-NOTRE-DAME-ASSOMPTION.md):
 * wings 13-15 m, pediment ridge ~14.5 m, drum cornice ~30 m, dome crown ~40 m, lantern ~46 m. Photos: refs/notre-dame-de-l-assomption/.
 * Drawn in the church's (u, v) frame — origin the dome's centre, u from the portico (front, -u) toward the back — turned
 * AXIS_DEG from east and registered onto the footprint by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism as cyl } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 153               // front (portico) toward -u; u points WNW, so the portico faces ESE
const BLOCK_U0 = -11.3, BLOCK_U1 = 14.8, BLOCK_V0 = -14.8, BLOCK_V1 = 15.4   // the square block around the rotunda
const EAVE = 9.5, ROOF_TOP = 13.2, ROOF_INSET = 2.4                          // wings' cornice and the slate hip up to the drum
const R_LOW = 11.3, LOW_Y0 = 13, LOW_Y1 = 17.2                               // lower drum
const R_UP = 10.4, UP_Y1 = 28.4                                              // upper drum
const R_DOME = 10.5, DOME_Y0 = 29.8, DOME_H = 10.4, GORES = 24, TIERS = 6    // dome
const LANT_R = 1.5, LANT_Y1 = 43.4, CROSS_Y = 46.5
const PORT_U = -15.6, PORT_V = 5.5, COLS = 6, COL_R = 0.66, COL_Y1 = 9.6, ENT_Y1 = 11.9, PED_Y = 14.6, PORT_BACK = BLOCK_U0, STEPS = 4
const NICHES = 10                                                            // alternating windows and niches round the upper drum
const STONE = '#b9ae94', TRIM = '#cbc1a6', ROOF = '#586270', DOMEA = '#7a838c', DOMEB = '#8d949b', GLASS = '#3b4d66', DOOR = '#2c4a3e', DARK = '#26272c'

const RAW: P2[] = [[6.7, -16.4], [5.7, -15.9], [2.0, -14.2], [0.3, -17.9], [-10.5, -12.5], [-9.2, -9.4], [-18.2, -5.6], [-6.3, 17.9], [6.3, 12.4], [17.0, 7.8], [17.5, 7.6], [16.3, 4.8], [15.5, 3.2], [13.9, -0.4], [18.2, -2.3], [15.8, -7.5], [13.1, -13.2], [9.0, -11.4]]
export const RING: P2[] = RAW.map(([e, n]) => [e - 0.8, n + 0.8])

const A = (AXIS_DEG * Math.PI) / 180, CA = Math.cos(A), SA = Math.sin(A)

export function notreDameDeLAssomption(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK)
  const domeA: Rgb = hex(DOMEA), domeB: Rgb = hex(DOMEB)
  const { en, P, solid, decal, round, ridge, gable } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 14, corniceH: 0.7, corniceOut: 0.3 })
  const circle = (r: number, n = 32): P2[] => Array.from({ length: n }, (_, i) => en(r * Math.cos((i / n) * Math.PI * 2), r * Math.sin((i / n) * Math.PI * 2)))
  const box = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, c: Rgb): void => solid(u0, u1, v0, v1, y0, y1, c, c, 0)
  const rect = (t: number, y0: number, w: number, h: number): [number, number][] => [[t - w / 2, y0], [t + w / 2, y0], [t + w / 2, y0 + h], [t - w / 2, y0 + h]]
  const spot = (u: number, v: number): { x: number; z: number } => { const [e, n] = en(u, v); return F.xz(e, n) }
  const aU = Math.atan2(F.n([CA, SA, 0])[0], F.n([CA, SA, 0])[2])
  const y0 = F.y0

  // ── the block: walls, cornice, slate hip rising to the drum ──
  solid(BLOCK_U0, BLOCK_U1, BLOCK_V0, BLOCK_V1, 0, EAVE, stone, null, 3)
  solid(BLOCK_U0 - 0.3, BLOCK_U1 + 0.3, BLOCK_V0 - 0.3, BLOCK_V1 + 0.3, EAVE - 0.7, EAVE, trim, trim, 0)
  const iu0 = BLOCK_U0 + ROOF_INSET + 0.6, iu1 = BLOCK_U1 - ROOF_INSET, iv0 = BLOCK_V0 + ROOF_INSET, iv1 = BLOCK_V1 - ROOF_INSET
  const ou0 = BLOCK_U0 - 0.3, ou1 = BLOCK_U1 + 0.3, ov0 = BLOCK_V0 - 0.3, ov1 = BLOCK_V1 + 0.3, hE = EAVE - 0.2
  T.poly([P(ou0, ov0, hE), P(ou1, ov0, hE), P(iu1, iv0, ROOF_TOP), P(iu0, iv0, ROOF_TOP)], roofC, [...en(0, -1), 0.7] as V3)
  T.poly([P(ou0, ov1, hE), P(ou1, ov1, hE), P(iu1, iv1, ROOF_TOP), P(iu0, iv1, ROOF_TOP)], roofC, [...en(0, 1), 0.7] as V3)
  T.poly([P(ou0, ov0, hE), P(ou0, ov1, hE), P(iu0, iv1, ROOF_TOP), P(iu0, iv0, ROOF_TOP)], roofC, [...en(-1, 0), 0.7] as V3)
  T.poly([P(ou1, ov0, hE), P(ou1, ov1, hE), P(iu1, iv1, ROOF_TOP), P(iu1, iv0, ROOF_TOP)], roofC, [...en(1, 0), 0.7] as V3)
  T.poly([P(iu0, iv0, ROOF_TOP), P(iu1, iv0, ROOF_TOP), P(iu1, iv1, ROOF_TOP), P(iu0, iv1, ROOF_TOP)], roofC, [0, 0, 1])
  for (const su of [-1, 1]) for (const sv of [-1, 1]) {        // corner pilasters
    const u = su < 0 ? BLOCK_U0 : BLOCK_U1, v = sv < 0 ? BLOCK_V0 : BLOCK_V1
    box(u - 0.5, u + 0.5, v - 0.5, v + 0.5, 0, EAVE - 0.7, shade(stone, 1.04))
  }
  // wing windows and doors on the front, plain windows round the sides and rear
  for (const s of [-1, 1]) {
    decal(BLOCK_U0, 0, -1, 0, 0.05, rect(s * 10.2, 3.1, 1.9, 3.2), trim); decal(BLOCK_U0, 0, -1, 0, 0.1, rect(s * 10.2, 3.3, 1.4, 2.8), glass)
    decal(BLOCK_U0, 0, -1, 0, 0.05, rect(s * 12.9, 0, 2.4, 4.2), trim); decal(BLOCK_U0, 0, -1, 0, 0.1, rect(s * 12.9, 0, 1.8, 3.8), door)
    for (const u of [-6.5, -2, 2.5, 7, 11.5]) {
      const v = s > 0 ? BLOCK_V1 : BLOCK_V0
      decal(u, v, 0, s, 0.05, rect(0, 3.3, 1.8, 3.2), trim); decal(u, v, 0, s, 0.1, rect(0, 3.5, 1.3, 2.8), glass)
    }
  }
  for (const v of [-9, -4.5, 0, 4.5, 9]) { decal(BLOCK_U1, v, 1, 0, 0.05, rect(0, 3.3, 1.8, 3.2), trim); decal(BLOCK_U1, v, 1, 0, 0.1, rect(0, 3.5, 1.3, 2.8), glass) }

  // ── lower drum with garland frieze, upper drum of windows and niches, cornice ──
  T.prism(circle(R_LOW), LOW_Y0, LOW_Y1, stone, null, 3)
  T.prism(circle(R_LOW + 0.12), LOW_Y0 + 2.2, LOW_Y1 - 1.0, shade(stone, 0.9), null, 0)         // the swagged frieze band
  T.prism(circle(R_LOW + 0.35), LOW_Y1 - 0.8, LOW_Y1, shade(stone, 1.03), shade(stone, 1.03), 0)
  T.prism(circle(R_UP), LOW_Y1, UP_Y1, stone, null, 3)
  for (let k = 0; k < NICHES; k++) {
    const th = Math.PI + (k / NICHES) * Math.PI * 2, nu = Math.cos(th), nv = Math.sin(th)
    const u = nu * (R_UP + 0.04), v = nv * (R_UP + 0.04)
    if (k % 2 === 0) {          // tall window, framed, with a mullion
      decal(u, v, nu, nv, 0.05, rect(0, 19.4, 3.2, 7.4), trim); decal(u, v, nu, nv, 0.1, rect(0, 19.8, 2.6, 6.6), glass)
      decal(u, v, nu, nv, 0.14, rect(0, 19.8, 0.14, 6.6), trim)
    } else {                    // blind round-headed niche with a small garland swag
      decal(u, v, nu, nv, 0.05, round(0, 20.8, 2.9, 5.0), trim); decal(u, v, nu, nv, 0.1, round(0, 21.2, 2.4, 4.4), shade(stone, 0.86))
      decal(u, v, nu, nv, 0.14, rect(0, 18.2, 2.6, 0.5), shade(stone, 0.8))
    }
  }
  T.prism(circle(R_UP + 0.4), UP_Y1 - 1.5, UP_Y1 - 0.4, shade(stone, 1.03), shade(stone, 1.03), 0)
  T.prism(circle(R_UP + 0.9), UP_Y1 - 0.5, DOME_Y0, trim, trim, 0)

  // ── the ribbed slate dome ──
  const ring = (j: number, g: number): V3 => {
    const phi = (j / TIERS) * (Math.PI / 2), r = R_DOME * Math.cos(phi), a = (g / GORES) * Math.PI * 2
    return P(r * Math.cos(a), r * Math.sin(a), DOME_Y0 + DOME_H * Math.sin(phi))
  }
  for (let g = 0; g < GORES; g++) {
    const am = ((g + 0.5) / GORES) * Math.PI * 2, c = g % 2 ? domeB : domeA
    for (let j = 0; j < TIERS; j++) {
      const q: V3[] = [ring(j, g), ring(j, g + 1), ring(j + 1, g + 1), ring(j + 1, g)]
      if (j === TIERS - 1) q.splice(2, 2, ring(TIERS, g))      // the crown: a triangle
      T.poly(q, c, [...en(Math.cos(am), Math.sin(am)), 0.6] as V3)
    }
  }
  const dc = spot(0, 0)
  for (let k = 0; k < 10; k++) {                                // round lucarnes high on the dome
    const a = Math.PI + ((k + 0.5) / 10) * Math.PI * 2, p = spot(Math.cos(a) * 9.7, Math.sin(a) * 9.7)
    cyl(out, p.x, p.z, y0 + 31.6, y0 + 33.4, 0.62, 8, trim, 0, 0.5, true, 0)
    cyl(out, p.x, p.z, y0 + 33.4, y0 + 33.55, 0.42, 8, dark, 0, 0.42, true, 0)
  }
  cyl(out, dc.x, dc.z, y0 + DOME_Y0 + DOME_H - 0.6, y0 + LANT_Y1, LANT_R, 8, trim, 0, LANT_R * 0.92, true, aU)
  for (let k = 0; k < 4; k++) { const a = aU + (k * Math.PI) / 2 + Math.PI / 8; cyl(out, dc.x + Math.sin(a) * LANT_R * 0.9, dc.z + Math.cos(a) * LANT_R * 0.9, y0 + DOME_Y0 + DOME_H + 0.6, y0 + LANT_Y1 - 0.8, 0.12, 4, dark, 0, 0.12, true, 0) }
  cyl(out, dc.x, dc.z, y0 + LANT_Y1, y0 + CROSS_Y - 1.2, LANT_R * 0.95, 8, roofC, 0, 0.12, true, aU)
  cyl(out, dc.x, dc.z, y0 + CROSS_Y - 1.3, y0 + CROSS_Y + 1.6, 0.1, 4, dark, 0, 0.1, true, 0)
  cyl(out, dc.x, dc.z, y0 + CROSS_Y + 0.5, y0 + CROSS_Y + 0.75, 0.55, 4, dark, 0, 0.55, true, 0)

  // ── the hexastyle Corinthian portico, entablature, pediment, steps and door ──
  box(PORT_U - 0.9, PORT_BACK, -PORT_V - 1.5, PORT_V + 1.5, 0, 0.9, shade(stone, 0.95))
  for (let k = 0; k < STEPS; k++) box(PORT_U - 0.9 - (k + 1) * 0.55, PORT_BACK, -PORT_V - 1.5 - 0.15 * (k + 1), PORT_V + 1.5 + 0.15 * (k + 1), 0, 0.9 - (k + 1) * 0.2, shade(stone, 0.93))
  for (const s of [-1, 1]) box(PORT_U - 0.4, PORT_BACK, s * (PORT_V + 0.8) - 0.5, s * (PORT_V + 0.8) + 0.5, 0.9, ENT_Y1 - 1.1, stone)     // side piers
  for (let k = 0; k < COLS; k++) {
    const p = spot(PORT_U, -PORT_V + (k / (COLS - 1)) * 2 * PORT_V)
    cyl(out, p.x, p.z, y0 + 0.9, y0 + COL_Y1, COL_R, 12, stone, 0, COL_R * 0.88, true, 0)
    cyl(out, p.x, p.z, y0 + 0.9, y0 + 1.5, COL_R * 1.2, 12, trim, 0, COL_R * 1.1, true, 0)
    cyl(out, p.x, p.z, y0 + COL_Y1, y0 + COL_Y1 + 1.1, COL_R * 1.15, 8, trim, 0, COL_R * 1.55, true, aU)
  }
  box(PORT_U - 0.5, PORT_BACK, -PORT_V - 1.5, PORT_V + 1.5, COL_Y1 + 1.0, ENT_Y1 - 0.9, shade(stone, 1.03))
  box(PORT_U - 0.7, PORT_BACK, -PORT_V - 1.7, PORT_V + 1.7, ENT_Y1 - 0.9, ENT_Y1, trim)
  ridge('u', PORT_U - 0.7, PORT_BACK, 0, PORT_V + 1.7, ENT_Y1, PED_Y, 0.3)
  gable('u', PORT_U - 0.7, 0, PORT_V + 1.7, ENT_Y1, PED_Y - 0.05, -1, stone)
  decal(PORT_U - 0.7, 0, -1, 0, 0.05, [[-PORT_V - 0.9, ENT_Y1 + 0.2], [PORT_V + 0.9, ENT_Y1 + 0.2], [0, PED_Y - 0.5]], shade(stone, 0.9))
  decal(PORT_BACK, 0, -1, 0, 0.05, rect(0, 0.9, 3.8, 7.6), trim); decal(PORT_BACK, 0, -1, 0, 0.1, rect(0, 0.9, 3.2, 7.0), door)
  decal(PORT_BACK, 0, -1, 0, 0.14, rect(0, 5.9, 3.0, 1.6), dark)
  for (const s of [-1, 1]) { decal(PORT_BACK, 0, -1, 0, 0.1, rect(s * 4.7, 0.9, 1.5, 5.8), shade(stone, 0.84)) }
}
