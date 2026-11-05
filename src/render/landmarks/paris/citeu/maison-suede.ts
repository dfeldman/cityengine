/**
 * THE MAISON DES ÉTUDIANTS SUÉDOIS (Peder Clason with Germain Debré, 1931): a near-square four-storey block in cream
 * render, Swedish-classical and plain, under a tall steep hipped roof of brown tile with flared eaves. The street front
 * (NNE) has a shallow three-bay central projection carried up into the roof, where two round oculus dormers sit over
 * the name plaque and door; two bays either side; blue shutters on the ground floor. The other slopes carry a row of
 * small hipped dormers. Refs: Commons (docs/landmarks/refs/citeu/suede/, 2026-11-04). Plan from OSM way 52090415
 * (≈16 × 17.4 m, the projection 9 × 1.9 m), facing the service road on its NNE side.
 * Local frame: −z toward bearing 24 (the street front), x toward bearing 114; origin the main block's centre.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { archOn, hipRoof, rectOn } from '../palaces/common.ts'

const RENDER: Rgb = hex('#e6dfcc'), BASE: Rgb = hex('#b8b09c'), FRAME: Rgb = hex('#f4f2ec'), GLASS: Rgb = hex('#2e3438')
const TILE: Rgb = hex('#7a4a36'), SLATE: Rgb = hex('#3c3a3c'), SHUTTER: Rgb = hex('#2e5a9a'), PLAQUE: Rgb = hex('#7a2a22')
const stucco = surfaceTag('stucco')

// plan (OSM, rotated): main block half-sizes, the front projection's half-width and depth
const HX = 8.0, HZ = 8.7, PX = 4.45, PD = 1.9
const FL = 3.1, LEVELS = 4, PLINTH = 0.5
// roof: rise of the main hip, eave overhang, the projection's own roof rise
const ROOF_H = 6.2, EAVE = 0.5, PROJ_ROOF_H = 5.2, CORNICE = 0.3
// windows
const WIN_W = 1.15, WIN_H = 1.6, SILL = 0.8, FR = 0.1, SHUT_W = 0.55
const WING_BAYS = 2, MID_BAYS = 3, SIDE_BAYS = 5, BACK_BAYS = 5
// door, plaque, oculi
const DOOR_W = 1.4, DOOR_H = 2.5, OCU_W = 1.1, OCU_X = 1.6
// small dormers on the other slopes
const DORM_W = 1.6, DORM_H = 1.3, DORM_ROOF = 0.7, DORM_IN = 2.0

type Face = '-z' | '+z' | '-x' | '+x'

function windowOn(out: MeshBuilder, f: Face, plane: number, t: number, y: number, shutters: boolean): void {
  rectOn(out, f, plane, t - WIN_W / 2 - FR, t + WIN_W / 2 + FR, y - FR, y + WIN_H + FR, FRAME, 0.05)
  rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y, y + WIN_H, GLASS, 0.07)
  if (!shutters) return
  const s0 = WIN_W / 2 + FR + 0.05
  rectOn(out, f, plane, t - s0 - SHUT_W, t - s0, y - 0.1, y + WIN_H + 0.1, SHUTTER, 0.08)
  rectOn(out, f, plane, t + s0, t + s0 + SHUT_W, y - 0.1, y + WIN_H + 0.1, SHUTTER, 0.08)
}

function row(out: MeshBuilder, f: Face, plane: number, ts: number[], g: number, skip?: (t: number, s: number) => boolean): void {
  for (const t of ts) for (let s = 0; s < LEVELS; s++) {
    if (skip?.(t, s)) continue
    windowOn(out, f, plane, t, g + PLINTH + s * FL + SILL, s === 0)
  }
}

const spread = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * (i + 0.5)) / n)

function dormer(out: MeshBuilder, f: Face, x: number, z: number, y: number): void {
  block(out, x - DORM_W / 2, x + DORM_W / 2, z - DORM_W / 2, z + DORM_W / 2, y, y + DORM_H, FRAME, stucco)
  const plane = f === '-x' ? x - DORM_W / 2 : f === '+x' ? x + DORM_W / 2 : f === '+z' ? z + DORM_W / 2 : z - DORM_W / 2
  const t = f === '-x' || f === '+x' ? z : x
  rectOn(out, f, plane, t - 0.5, t + 0.5, y + 0.2, y + DORM_H - 0.2, GLASS, 0.05)
  hipRoof(out, x - DORM_W / 2, x + DORM_W / 2, z - DORM_W / 2, z + DORM_W / 2, y + DORM_H, DORM_ROOF, SLATE, 0.15)
}

export function maisonSuede(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0, eaves = g + PLINTH + LEVELS * FL, fz = -HZ - PD
  block(out, -HX - 0.05, HX + 0.05, -HZ - 0.05, HZ + 0.05, g - 0.3, g + PLINTH, BASE, stucco)
  block(out, -HX, HX, -HZ, HZ, g + PLINTH, eaves, RENDER, stucco)
  block(out, -PX - 0.05, PX + 0.05, fz - 0.05, -HZ, g - 0.3, g + PLINTH, BASE, stucco)
  block(out, -PX, PX, fz, -HZ, g + PLINTH, eaves, RENDER, stucco)
  // a thin cornice under the eaves, then the roofs; the projection's steeper hip rises into the main one
  block(out, -HX - 0.2, HX + 0.2, -HZ - 0.2, HZ + 0.2, eaves - CORNICE, eaves, FRAME, stucco)
  block(out, -PX - 0.2, PX + 0.2, fz - 0.2, -HZ, eaves - CORNICE, eaves, FRAME, stucco)
  hipRoof(out, -HX, HX, -HZ, HZ, eaves, ROOF_H, TILE, EAVE)
  hipRoof(out, -PX, PX, fz, fz + 2 * PX, eaves, PROJ_ROOF_H, SLATE, EAVE)

  // the street front: two bays either side, three on the projection, the door and plaque in the middle
  const wingT = spread(PX, HX, WING_BAYS)
  row(out, '-z', -HZ, [...wingT, ...wingT.map(t => -t)], g)
  row(out, '-z', fz, spread(-PX, PX, MID_BAYS), g, (t, s) => Math.abs(t) < 0.1 && s === 0)
  rectOn(out, '-z', fz, -DOOR_W / 2 - FR, DOOR_W / 2 + FR, g + PLINTH, g + PLINTH + DOOR_H + FR, FRAME, 0.05)
  rectOn(out, '-z', fz, -DOOR_W / 2, DOOR_W / 2, g + PLINTH, g + PLINTH + DOOR_H, GLASS, 0.07)
  rectOn(out, '-z', fz, -0.9, 0.9, g + PLINTH + DOOR_H + 0.3, g + PLINTH + FL + 0.1, PLAQUE, 0.07)
  // the two oculi in the projection's roof slope, a little behind its foot
  const oz = fz + 1.0, oy = eaves + 0.6
  for (const x of [-OCU_X, OCU_X]) {
    block(out, x - OCU_W / 2 - 0.15, x + OCU_W / 2 + 0.15, oz, oz + 1.2, eaves, oy + OCU_W + 0.2, FRAME, stucco)
    archOn(out, '-z', oz, x, oy, OCU_W, OCU_W, GLASS, 0.05)
  }

  // the sides and the garden face
  row(out, '-x', -HX, spread(-HZ, HZ, SIDE_BAYS), g)
  row(out, '+x', HX, spread(-HZ, HZ, SIDE_BAYS), g)
  row(out, '+z', HZ, spread(-HX, HX, BACK_BAYS), g)

  // dormers on the garden and side slopes
  const dy = eaves + 0.4
  for (const x of spread(-HX + 2, HX - 2, 4)) dormer(out, '+z', x, HZ - DORM_IN, dy)
  for (const z of [-2.5, 2.5]) {
    dormer(out, '-x', -HX + DORM_IN, z, dy)
    dormer(out, '+x', HX - DORM_IN, z, dy)
  }
}
