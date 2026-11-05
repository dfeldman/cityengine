/**
 * ÉGLISE NOUVELLE SAINT-HONORÉ-D'EYLAU (avenue Raymond-Poincaré, 16e; OSM way/112237139). A brick parish church in
 * the Romano-Byzantine manner: ochre brick with pale stone bands and piers, a broad low-pitched gable front 27 m wide
 * with five round-arched doors, a frieze of gold mosaic saints in arches, three tall dark-blue arched windows and a
 * three-bell gable on the apex; a clerestoried nave under slate with a lean-to aisle each side, and a lower east end.
 * Plan and heights from the OSM outline and its building:part (13 m nave strip, 7 m aisles); photos
 * docs/landmarks/refs/st-honore-eylau-nouvelle/. Drawn in the church's (u, v) frame — u along the nave from the west
 * front toward the east end — turned AXIS_DEG from east, registered onto the footprint by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 9.3                  // the nave's direction (west front toward the east end), degrees anticlockwise from east
const U_FRONT = -29.7, U_AISLE_END = 21, U_NAVE_END = 28.5, U_EAST = 30.8
const AISLE_V = 13.4, NAVE_V = 5.4                       // half-widths
const AISLE_EAVE = 8.2, AISLE_HI = 10.6                  // lean-to roof: eave at the outer wall, top at the clerestory
const CLERE_EAVE = 13.0, RIDGE_H = 15.4
const FACADE_EAVE = 10.8, FACADE_APEX = 16.4             // raking gable of the front, outer edge and apex
const BELL_H = 21.0, BELL_PEAK = 22.6, BELL_V = 3.7
const EAST_V0 = -10.2, EAST_V1 = 8.6, EAST_H = 8.6       // the lower east end (chapels and apse)
const DOORS = [-10.8, -5.4, 0, 5.4, 10.8]
const BRICK = '#c9964f', BRICK_DK = '#b7803f', STONE = '#d9cfb4', ROOF = '#5a626d', GLASS = '#2b3a66', DOOR = '#6a4020', GOLD = '#e8c24e', DARK = '#2a2622'

export const RING: P2[] = [[15.7, 16.1], [0.6, 13.6], [-15.1, 10.9], [-31.0, 8.3], [-30.0, 0.3], [-28.2, -9.7], [-26.9, -17.5], [-26.4, -17.9], [-11.2, -15.4], [5.1, -12.8], [21.0, -10.2], [20.5, -7.2], [24.1, -6.7], [24.1, -4.3], [27.0, -1.1], [29.6, -0.6], [30.9, 2.1], [29.8, 8.6], [27.2, 10.1], [26.7, 12.8], [25.9, 17.5], [20.7, 16.9]]

export function saintHonoreEylauNouvelle(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  void F
  const brick: Rgb = hex(BRICK), brickDk: Rgb = hex(BRICK_DK), stone: Rgb = hex(STONE), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), gold: Rgb = hex(GOLD), dark: Rgb = hex(DARK)
  const { en, P, solid, decal, round, cornice, ridge, gable } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone: brick, trim: stone, discN: 12, corniceH: 0.5, corniceOut: 0.25 })
  const band = (u0: number, u1: number, v0: number, v1: number, y: number, h = 0.4, o = 0.12): void => solid(u0 - o, u1 + o, v0 - o, v1 + o, y, y + h, stone, stone, 0)

  // ── aisles: brick walls with pale bands, buttress piers, round-arched windows, lean-to slate roofs ──
  for (const s of [-1, 1]) {
    solid(U_FRONT, U_AISLE_END, s * NAVE_V, s * AISLE_V, 0, AISLE_EAVE, brick, null, 3)
    T.poly([P(U_FRONT - 0.3, s * (AISLE_V + 0.35), AISLE_EAVE - 0.2), P(U_AISLE_END + 0.3, s * (AISLE_V + 0.35), AISLE_EAVE - 0.2), P(U_AISLE_END + 0.3, s * NAVE_V, AISLE_HI), P(U_FRONT - 0.3, s * NAVE_V, AISLE_HI)], roofC, [...en(0, s), 0.8] as V3)
    cornice(U_FRONT, U_AISLE_END, s > 0 ? AISLE_V - 0.1 : -AISLE_V, s > 0 ? AISLE_V : -AISLE_V + 0.1, AISLE_EAVE, 0.5, 0.2)
    band(U_FRONT, U_AISLE_END, s > 0 ? AISLE_V : -AISLE_V - 0.1, s > 0 ? AISLE_V + 0.1 : -AISLE_V, 3.0, 0.35, 0.1)
  }
  const nb = 9, bl = (U_AISLE_END - U_FRONT) / nb
  for (let i = 0; i <= nb; i++) for (const s of [-1, 1]) solid(U_FRONT + i * bl - 0.35, U_FRONT + i * bl + 0.35, s > 0 ? AISLE_V : -AISLE_V - 0.35, s > 0 ? AISLE_V + 0.35 : -AISLE_V, 0, AISLE_EAVE + 0.4, stone, stone, 0)
  for (let i = 0; i < nb; i++) for (const s of [-1, 1]) {
    const u = U_FRONT + (i + 0.5) * bl
    decal(u, s * AISLE_V, 0, s, 0.05, round(0, 3.6, 2.2, 3.8), stone); decal(u, s * AISLE_V, 0, s, 0.1, round(0, 3.7, 1.7, 3.5), glass)
  }

  // ── nave: clerestory, slate gable roof, round-arched windows ──
  solid(U_FRONT, U_NAVE_END, -NAVE_V, NAVE_V, AISLE_HI - 0.5, CLERE_EAVE, brick, null, 3)
  cornice(U_FRONT, U_NAVE_END, -NAVE_V, NAVE_V, CLERE_EAVE, 0.5, 0.25)
  ridge('u', U_FRONT, U_NAVE_END, 0, NAVE_V + 0.3, CLERE_EAVE, RIDGE_H)
  for (let i = 0; i < nb; i++) for (const s of [-1, 1]) {
    const u = U_FRONT + (i + 0.5) * bl
    decal(u, s * NAVE_V, 0, s, 0.05, round(0, 10.8, 1.7, 2.1), stone); decal(u, s * NAVE_V, 0, s, 0.1, round(0, 10.9, 1.3, 1.9), glass)
  }
  gable('v', U_NAVE_END, 0, NAVE_V + 0.3, CLERE_EAVE, RIDGE_H, 1, brick)
  decal(U_NAVE_END, 0, 1, 0, 0.06, round(0, 7.5, 2.4, 5.2), glass)

  // ── lower east end: chapels and apse block ──
  solid(U_AISLE_END, U_EAST, EAST_V0, EAST_V1, 0, EAST_H, brick, roofC, 3)
  cornice(U_AISLE_END, U_EAST, EAST_V0, EAST_V1, EAST_H, 0.5, 0.2)
  for (let k = 0; k < 3; k++) decal(U_AISLE_END + 3 + k * 2.8, EAST_V0, 0, -1, 0.05, round(0, 3.4, 1.6, 3.2), glass)

  // ── west front: broad raking gable, piers, five doors, mosaic saints, three tall windows, bell gable ──
  solid(U_FRONT - 0.3, U_FRONT + 0.5, -AISLE_V, AISLE_V, 0, FACADE_EAVE, brick, null, 3)
  gable('v', U_FRONT - 0.3, 0, AISLE_V, FACADE_EAVE, FACADE_APEX, -1, brick)
  // the raking coping, a pale band stepped along each slope
  for (const s of [-1, 1]) T.poly([P(U_FRONT - 0.4, s * AISLE_V, FACADE_EAVE - 0.1), P(U_FRONT - 0.4, s * (AISLE_V - 0.4), FACADE_EAVE + 0.5), P(U_FRONT - 0.4, 0, FACADE_APEX + 0.4), P(U_FRONT - 0.4, 0, FACADE_APEX - 0.1)], stone, [...en(-1, 0), 0] as V3)
  ridge('u', U_FRONT - 0.2, U_FRONT + 0.8, 0, AISLE_V, FACADE_EAVE - 0.1, FACADE_APEX)
  // piers dividing the front into bays, the pale string courses
  for (const v of [-AISLE_V, -4.4, 4.4, AISLE_V]) solid(U_FRONT - 0.6, U_FRONT + 0.4, v - 0.7, v + 0.7, 0, v === -4.4 || v === 4.4 ? FACADE_APEX - (FACADE_APEX - FACADE_EAVE) * 4.4 / AISLE_V + 0.2 : FACADE_EAVE + 0.5, stone, stone, 0)
  for (const v of [-4.4, 4.4]) solid(U_FRONT - 0.7, U_FRONT + 0.5, v - 0.85, v + 0.85, FACADE_APEX - (FACADE_APEX - FACADE_EAVE) * 4.4 / AISLE_V + 0.2, FACADE_APEX - (FACADE_APEX - FACADE_EAVE) * 4.4 / AISLE_V + 0.7, stone, stone, 0)
  for (const y of [5.2, 9.1]) band(U_FRONT - 0.5, U_FRONT, -AISLE_V, AISLE_V, y, 0.45, 0.0)
  for (const v of DOORS) {
    const w = v === 0 ? 3.4 : 2.7, h = v === 0 ? 5.4 : 4.6
    decal(U_FRONT, 0, -1, 0, 0.28, round(v, 0, w + 0.7, h + 0.35), stone); decal(U_FRONT, 0, -1, 0, 0.34, round(v, 0, w, h), door)
    decal(U_FRONT, 0, -1, 0, 0.4, round(v, h * 0.62, w * 0.8, h * 0.36), glass)
  }
  // frieze of gold mosaic saints in arches: three groups of 3, 4, 3
  for (const v of [-10.8, -8.6, -6.4, -3.0, -1.0, 1.0, 3.0, 6.4, 8.6, 10.8]) {
    decal(U_FRONT, 0, -1, 0, 0.3, round(v, 5.8, 1.9, 3.1), shade(stone, 0.95)); decal(U_FRONT, 0, -1, 0, 0.36, round(v, 5.95, 1.6, 2.8), gold)
    decal(U_FRONT, 0, -1, 0, 0.42, [[v - 0.28, 6.1], [v + 0.28, 6.1], [v + 0.22, 8.2], [v - 0.22, 8.2]], shade(hex('#4d6aa0'), 1))
  }
  const win = (v: number, w: number, y0: number, h: number): void => {
    decal(U_FRONT, 0, -1, 0, 0.3, round(v, y0 - 0.3, w + 0.9, h + 0.55), stone); decal(U_FRONT, 0, -1, 0, 0.36, round(v, y0, w, h), glass)
    for (let k = 1; k < 6; k++) decal(U_FRONT, 0, -1, 0, 0.42, [[v - w / 2, y0 + (h - w / 2) * k / 6], [v + w / 2, y0 + (h - w / 2) * k / 6], [v + w / 2, y0 + (h - w / 2) * k / 6 + 0.1], [v - w / 2, y0 + (h - w / 2) * k / 6 + 0.1]], shade(glass, 1.5))
  }
  win(0, 3.4, 9.9, 6.0); win(-8.6, 2.7, 9.9, 3.7); win(8.6, 2.7, 9.9, 3.7)
  // bell gable on the apex
  solid(U_FRONT - 0.1, U_FRONT + 1.0, -BELL_V, BELL_V, FACADE_APEX - 0.6, BELL_H, brick, null, 3)
  for (const v of [-2.2, 0, 2.2]) { decal(U_FRONT - 0.1, 0, -1, 0, 0.06, round(v, 17.8, 1.5, 2.6), stone); decal(U_FRONT - 0.1, 0, -1, 0, 0.12, round(v, 17.9, 1.2, 2.4), dark) }
  T.poly([P(U_FRONT - 0.3, -BELL_V - 0.3, BELL_H), P(U_FRONT - 0.3, BELL_V + 0.3, BELL_H), P(U_FRONT - 0.3, 0, BELL_PEAK)], stone, [...en(-1, 0), 0] as V3)
  T.poly([P(U_FRONT + 1.2, -BELL_V - 0.3, BELL_H), P(U_FRONT + 1.2, BELL_V + 0.3, BELL_H), P(U_FRONT + 1.2, 0, BELL_PEAK)], stone, [...en(1, 0), 0] as V3)
  for (const s of [-1, 1]) T.poly([P(U_FRONT - 0.3, s * (BELL_V + 0.3), BELL_H), P(U_FRONT + 1.2, s * (BELL_V + 0.3), BELL_H), P(U_FRONT + 1.2, 0, BELL_PEAK), P(U_FRONT - 0.3, 0, BELL_PEAK)], stone, [...en(0, s), 1] as V3)
  solid(U_FRONT + 0.1, U_FRONT + 0.6, -0.15, 0.15, BELL_PEAK, BELL_PEAK + 1.4, stone, stone, 0)
  solid(U_FRONT + 0.1, U_FRONT + 0.6, -0.6, 0.6, BELL_PEAK + 0.8, BELL_PEAK + 1.1, stone, stone, 0)
  void brickDk
}
