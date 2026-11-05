/**
 * THE MAISON DU MEXIQUE (Jorge & Roberto Medellín, 1953): pale limestone-clad modernist blocks. A narrow six-storey slab
 * runs north–south; its north end rises as a tower over the entrance, lettered "MEXICO", each storey a window over a
 * terracotta spandrel. At its foot a long two-storey front block with a flat cornice and a deep canopy over the door,
 * reached by broad steps; a stone relief frieze on its wall. A four-storey wing runs parallel to the west, joined by a
 * low link; long faces carry ribbon windows framed in brick red. Refs: Commons (docs/landmarks/refs/citeu/mexique/,
 * 2026-11-04). Plan from OSM way 52090404 and parts 860140466–8, rotated to its axes.
 * Local frame: −z toward bearing 18 (the north entrance and its steps), x toward bearing 288; origin the outline's vertex mean.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

const STONE: Rgb = hex('#ddd6c6'), BASE: Rgb = hex('#a9a191'), TRIM: Rgb = hex('#ece7dc'), SPANDREL: Rgb = hex('#b0603e')
const GLASS: Rgb = hex('#353b40'), FRAME: Rgb = hex('#7a3a2a'), RELIEF: Rgb = hex('#bdb5a5'), LETTER: Rgb = hex('#3a3a3a')
const stucco = surfaceTag('stucco')

type Box = [number, number, number, number]   // x0, x1, z0, z1
type Face = '-z' | '+z' | '-x' | '+x'

// storeys
const FL = 3.0, PLINTH = 0.5, PARAPET = 0.6
const SLAB_LEVELS = 7, WING_LEVELS = 4, LOW_LEVELS = 2, LINK_LEVELS = 1
// ribbons: glass band height and sill, the frame proud of the wall
const RIB_H = 1.3, RIB_SILL = 0.9, RIB_INSET = 0.8
// the tower end: one window per storey over a spandrel
const TWIN_W = 3.2, TWIN_H = 1.8
// plan (OSM, rotated)
const SLAB: Box = [2.1, 9.1, -23.0, 22.9]
const SLAB_BULGE: Box = [9.1, 11.3, 9.4, 22.9]
const WING: Box = [-22.3, -15.6, -1.0, 33.6]
const LINK: Box = [-15.6, 2.1, 13.5, 22.9]
const FRONT: Box = [-13.3, 19.7, -22.4, -11.5]   // the two-storey entrance block
const MID: Box = [-15.6, 2.1, -11.5, 13.5]       // two storeys between slab and wing
const BACK: Box = [-2.0, 11.3, 22.9, 34.0]       // two storeys at the south end
// entrance canopy, steps and lettering
const CANOPY_W = 12, CANOPY_D = 4.5, CANOPY_Y = 3.6, STEP_N = 6, STEP_RISE = 0.17, STEP_RUN = 0.4
const LETTER_W = 4.5, LETTER_H = 0.7

function ribbons(out: MeshBuilder, f: Face, plane: number, t0: number, t1: number, g: number, levels: number, from = 0): void {
  for (let s = from; s < levels; s++) {
    const y = g + s * FL + RIB_SILL
    rectOn(out, f, plane, t0 + RIB_INSET - 0.15, t1 - RIB_INSET + 0.15, y - 0.15, y + RIB_H + 0.15, FRAME, 0.05)
    rectOn(out, f, plane, t0 + RIB_INSET, t1 - RIB_INSET, y, y + RIB_H, GLASS, 0.08)
  }
}

function mass(out: MeshBuilder, b: Box, g: number, levels: number, open: Partial<Record<Face, boolean>>, from = 0): void {
  const [x0, x1, z0, z1] = b, top = g + levels * FL
  block(out, x0 - 0.05, x1 + 0.05, z0 - 0.05, z1 + 0.05, g, g + PLINTH, BASE, stucco)
  block(out, x0, x1, z0, z1, g + PLINTH, top + PARAPET, STONE, stucco)
  block(out, x0 - 0.15, x1 + 0.15, z0 - 0.15, z1 + 0.15, top + PARAPET - 0.25, top + PARAPET, TRIM, stucco)
  const faces: [Face, number, number, number][] = [['-z', z0, x0, x1], ['+z', z1, x0, x1], ['-x', x0, z0, z1], ['+x', x1, z0, z1]]
  for (const [f, plane, t0, t1] of faces) if (open[f]) ribbons(out, f, plane, t0, t1, g, levels, from)
}

export function maisonMexique(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  mass(out, FRONT, g, LOW_LEVELS, { '-x': true, '+x': true })
  mass(out, MID, g, LOW_LEVELS, { '-z': false, '+x': false })
  mass(out, BACK, g, LOW_LEVELS, { '+z': true, '-x': true, '+x': true })
  mass(out, LINK, g, LINK_LEVELS, {})
  mass(out, WING, g, WING_LEVELS, { '-x': true, '+x': true, '-z': true, '+z': true })
  mass(out, SLAB, g, SLAB_LEVELS, { '-x': true, '+x': true, '+z': true }, LOW_LEVELS)
  mass(out, SLAB_BULGE, g, SLAB_LEVELS, { '+x': true, '+z': true }, LOW_LEVELS)

  // the tower end over the entrance: a window per storey on a terracotta spandrel strip, the lettering at the top
  const [sx0, sx1, sz0] = SLAB, mid = (sx0 + sx1) / 2
  rectOn(out, '-z', sz0, mid - TWIN_W / 2 - 0.3, mid + TWIN_W / 2 + 0.3, g + LOW_LEVELS * FL, g + SLAB_LEVELS * FL, SPANDREL, 0.04)
  for (let s = LOW_LEVELS; s < SLAB_LEVELS; s++)
    rectOn(out, '-z', sz0, mid - TWIN_W / 2, mid + TWIN_W / 2, g + s * FL + 0.9, g + s * FL + 0.9 + TWIN_H, GLASS, 0.08)
  const ly = g + SLAB_LEVELS * FL - 0.2
  rectOn(out, '-z', sz0, sx0 + 0.3, sx0 + 0.3 + LETTER_W * 0.6, ly - LETTER_H, ly, LETTER, 0.1)

  // the canopy, glazed door and steps on the front block
  const fz = FRONT[2]
  block(out, mid - CANOPY_W / 2, mid + CANOPY_W / 2, fz - CANOPY_D, fz, g + CANOPY_Y, g + CANOPY_Y + 0.5, TRIM, stucco)
  rectOn(out, '-z', fz, mid - 4, mid + 4, g + PLINTH, g + CANOPY_Y - 0.2, GLASS, 0.06)
  for (let i = 0; i < STEP_N; i++) {
    const w = CANOPY_W + i * 1.2, z1 = fz - CANOPY_D - i * STEP_RUN
    block(out, mid - w / 2, mid + w / 2, z1 - STEP_RUN, z1, g - (i + 1) * STEP_RISE, g - i * STEP_RISE, BASE, stucco)
  }
  // the relief frieze on the front wall west of the door, and the ribbon of the upper storey east of it
  rectOn(out, '-z', fz, FRONT[0] + 1, mid - CANOPY_W / 2 - 0.5, g + FL + 0.4, g + LOW_LEVELS * FL, RELIEF, 0.1)
  ribbons(out, '-z', fz, mid + CANOPY_W / 2, FRONT[1], g, LOW_LEVELS, 1)
  ribbons(out, '-z', fz, FRONT[0], mid - CANOPY_W / 2, g, 1)
}
