/**
 * ÉGLISE SAINTE-ROSALIE (4 rue Corvisart / boulevard Auguste-Blanqui, 13e; OSM way/78407279; 1867). A small neo-Gothic
 * parish church hidden behind a two-storey cream-rendered front block along the boulevard (two arched doors, shuttered
 * upper windows), over which only the buff stone gable of the nave shows: a stepped, crenellated raking edge with corner
 * pinnacles, a diamond lozenge and a round rose. The nave is a slate gable (ridge ~16.5 m by IGN LiDAR MNS) with large
 * round windows in its rendered flanks, a lower annex along one side and a plain east end. Tightly walled by apartment
 * blocks (26 m on the north). Photos: docs/landmarks/refs/sainte-rosalie/; notes docs/landmarks/MODEL-SAINTE-ROSALIE.md.
 * Drawn in the church's (u, v) frame — u along the nave from the boulevard front toward the east end, v across —
 * turned AXIS_DEG from east, registered onto the footprint by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = -55                    // the nave's direction (front toward the east end), degrees anticlockwise from east
const FRONT_U0 = -15.5, FRONT_U1 = -3, FRONT_V0 = -14, FRONT_V1 = 9.5, FRONT_H = 9.2   // the street block
const NAVE_U0 = -4, NAVE_U1 = 21, NAVE_V0 = -8.8, NAVE_V1 = 7.6, EAVE_H = 11.4, RIDGE_H = 16.6
const ANNEX_U0 = 6, ANNEX_U1 = 21.5, ANNEX_V1 = 11.5, ANNEX_H = 9
const DOORS_V = [-9.5, -2.5, 4.5], DOOR_W = 2.6, DOOR_H = 3.6
const OCULI_U = [3.5, 9.5, 15.5], OCULUS_R = 1.7, OCULUS_Y = 7.6
const MERLON_STEP = 1.15, MERLON_H = 0.55
const PLASTER = '#e9e1cc', STONE = '#cdb88c', TRIM = '#d9ccaa', ROOF = '#555c68', GLASS = '#3a4660', DOOR = '#6b3f26', SHUTTER = '#e8e6dc', DARK = '#2c2c30'

export const RING: P2[] = [[2.9, 14.9], [-0.9, 19.5], [-1.1, 19.6], [-7.7, 14.2], [-6.1, 12.4], [-8.0, 10.9], [-8.5, 11.7], [-13.4, 7.6], [-14.0, 7.1], [-13.0, 5.8], [-15.3, 4.0], [-17.1, 2.5], [-18.9, 0.5], [-14.0, -5.4], [-13.4, -5.2], [-11.0, -3.1], [-10.6, -2.2], [-6.8, -7.0], [-7.5, -7.5], [-6.4, -7.4], [-4.9, -9.4], [-2.9, -11.8], [-2.6, -12.2], [-0.9, -14.3], [-0.6, -14.7], [1.0, -16.7], [1.4, -17.2], [2.6, -18.6], [4.4, -18.6], [4.8, -20.1], [9.3, -17.9], [12.3, -16.5], [20.0, -12.8], [16.5, -5.7], [15.2, -3.0], [13.2, 1.2], [9.8, -1.5], [5.3, 3.9], [7.4, 5.5], [5.3, 8.0], [3.3, 6.4], [1.2, 8.9], [5.2, 12.1]]

export function sainteRosalie(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const plaster: Rgb = hex(PLASTER), stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), shutter: Rgb = hex(SHUTTER), dark: Rgb = hex(DARK)
  const { solid, decal, round, disc, cornice, ridge, gable } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 16, corniceH: 0.5, corniceOut: 0.35 })
  const ncv = (NAVE_V0 + NAVE_V1) / 2, nhalf = (NAVE_V1 - NAVE_V0) / 2

  // ── the street block: rendered, flat-roofed, with a heavy cornice, two-three arched doors and shuttered windows ──
  solid(FRONT_U0, FRONT_U1, FRONT_V0, FRONT_V1, 0, FRONT_H, plaster, shade(plaster, 0.85), 2)
  cornice(FRONT_U0, FRONT_U1, FRONT_V0, FRONT_V1, FRONT_H, 0.55, 0.45)
  for (const v of DOORS_V) {
    decal(FRONT_U0, v, -1, 0, 0.05, round(0, 0, DOOR_W + 0.6, DOOR_H + 0.3), trim)
    decal(FRONT_U0, v, -1, 0, 0.1, round(0, 0, DOOR_W, DOOR_H), dark)
    decal(FRONT_U0, v, -1, 0, 0.14, round(0, 0, DOOR_W * 0.55, DOOR_H * 0.88), door)
    // shuttered window above each door
    decal(FRONT_U0, v, -1, 0, 0.05, [[-0.7, 5.3], [0.7, 5.3], [0.7, 7.6], [-0.7, 7.6]], glass)
    for (const s of [-1, 1]) decal(FRONT_U0, v, -1, 0, 0.09, [[s * 0.75, 5.2], [s * 1.5, 5.2], [s * 1.5, 7.7], [s * 0.75, 7.7]], shutter)
  }

  // ── the nave: rendered walls, slate gable roof, large round windows in the flanks ──
  solid(NAVE_U0, NAVE_U1, NAVE_V0, NAVE_V1, 0, EAVE_H, plaster, null, 2)
  cornice(NAVE_U0 + 0.3, NAVE_U1, NAVE_V0, NAVE_V1, EAVE_H, 0.5, 0.3)
  ridge('u', NAVE_U0 - 0.3, NAVE_U1, ncv, nhalf + 0.1, EAVE_H, RIDGE_H)
  solid(NAVE_U0 - 0.35, NAVE_U0 + 0.2, NAVE_V0, NAVE_V1, FRONT_H, EAVE_H, stone, stone, 3)   // stone wall over the block
  gable('v', NAVE_U0 - 0.35, ncv, nhalf, EAVE_H, RIDGE_H, -1, stone)
  gable('v', NAVE_U1, ncv, nhalf, EAVE_H, RIDGE_H, 1, plaster)
  const gu = NAVE_U0 - 0.36
  decal(gu, ncv, -1, 0, 0.04, disc(0, 11.2, 2.15), trim); decal(gu, ncv, -1, 0, 0.08, disc(0, 11.2, 1.75), glass)
  decal(gu, ncv, -1, 0, 0.12, [[-0.1, 9.45], [0.1, 9.45], [0.1, 12.95], [-0.1, 12.95]], trim); decal(gu, ncv, -1, 0, 0.12, [[-1.75, 11.1], [1.75, 11.1], [1.75, 11.3], [-1.75, 11.3]], trim)
  decal(gu, ncv, -1, 0, 0.06, [[0, 14.3], [0.85, 15.0], [0, 15.7], [-0.85, 15.0]], trim)   // the lozenge
  // crenellated raking edges and corner pinnacles
  const nm = Math.floor(nhalf / MERLON_STEP)
  for (let i = 0; i <= nm; i++) for (const s of [-1, 1]) {
    const f = i / nm, v = ncv + s * (nhalf * (1 - f)), h = EAVE_H + (RIDGE_H - EAVE_H) * f
    solid(NAVE_U0 - 0.5, NAVE_U0 + 0.1, v - 0.3, v + 0.3, h - 0.1, h + MERLON_H + 0.3, stone, trim, 1)
  }
  for (const s of [-1, 1]) solid(NAVE_U0 - 0.7, NAVE_U0 + 0.35, ncv + s * (nhalf + 0.4) - 0.5, ncv + s * (nhalf + 0.4) + 0.5, FRONT_H - 0.3, EAVE_H + 2.2, stone, trim, 2)
  solid(NAVE_U0 - 0.5, NAVE_U0 + 0.1, ncv - 0.35, ncv + 0.35, RIDGE_H, RIDGE_H + 1.4, stone, trim, 1)
  for (const s of [-1, 1] as const) {
    const vw = s > 0 ? NAVE_V1 : NAVE_V0
    for (const u of OCULI_U) {
      decal(u, vw, 0, s, 0.05, disc(0, OCULUS_Y, OCULUS_R + 0.3), trim); decal(u, vw, 0, s, 0.1, disc(0, OCULUS_Y, OCULUS_R), glass)
      decal(u, vw, 0, s, 0.14, [[-OCULUS_R, OCULUS_Y - 0.06], [OCULUS_R, OCULUS_Y - 0.06], [OCULUS_R, OCULUS_Y + 0.06], [-OCULUS_R, OCULUS_Y + 0.06]], trim)
      decal(u, vw, 0, s, 0.14, [[-0.06, OCULUS_Y - OCULUS_R], [0.06, OCULUS_Y - OCULUS_R], [0.06, OCULUS_Y + OCULUS_R], [-0.06, OCULUS_Y + OCULUS_R]], trim)
      decal(u, vw, 0, s, 0.06, [[-1.0, 2.6], [1.0, 2.6], [1.0, 4.0], [-1.0, 4.0]], glass)
    }
    for (const u of [0, 6.5, 12.5, 18.5]) solid(u - 0.35, u + 0.35, s > 0 ? NAVE_V1 : NAVE_V0 - 0.3, s > 0 ? NAVE_V1 + 0.3 : NAVE_V0, 0, EAVE_H - 0.5, shade(plaster, 0.96), null, 1)
  }

  // ── the lower annex along the +v flank and the east-end wall ──
  solid(ANNEX_U0, ANNEX_U1, NAVE_V1, ANNEX_V1, 0, ANNEX_H, shade(plaster, 0.97), shade(plaster, 0.78), 2)
  cornice(ANNEX_U0, ANNEX_U1, NAVE_V1, ANNEX_V1, ANNEX_H, 0.4, 0.25)
  for (const u of [9, 14, 19]) decal(u, ANNEX_V1, 0, 1, 0.05, [[-0.6, 3], [0.6, 3], [0.6, 5.2], [-0.6, 5.2]], glass)
  decal(NAVE_U1, ncv, 1, 0, 0.05, round(0, 0, 2.0, 3.4), dark)
}
