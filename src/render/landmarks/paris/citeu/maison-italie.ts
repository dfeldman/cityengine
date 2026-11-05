/**
 * THE MAISON DE L'ITALIE (Piero Portaluppi, 1958): a long slab in pale pink render, five storeys of square shuttered
 * windows over a ground-storey arcade of round arches on slender grey-marble columns, under a low tiled roof whose wings
 * end in classical pediments with attic windows. A short pavilion projects at the front (the "ITALIA" lettering over its
 * door) onto the Avenue David Weill; a wing runs back at the centre into the garden of cypresses. Refs: Commons
 * (docs/landmarks/refs/citeu/italie/, 2026-11-04). Plan from OSM way 28754627 rotated to its axes.
 * Local frame: x along bearing 150, −z toward bearing 240 (the Avenue David Weill, which runs along the front, and the
 * entrance pavilion on it), origin the OSM outline's vertex mean.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { column, hex, pediment, roof, windows, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { archOn, rectOn } from '../palaces/common.ts'

const RENDER: Rgb = hex('#e8d8cc'), TRIM: Rgb = hex('#f1e9e1'), SHADOW: Rgb = hex('#b9a89c'), TILE: Rgb = hex('#9a6a55')
const GLASS: Rgb = hex('#3a3f44'), MARBLE: Rgb = hex('#8f9294'), LETTER: Rgb = hex('#8a7a6c')
const stucco = surfaceTag('stucco')

type Box = [number, number, number, number]   // x0, x1, z0, z1
type Face = '-z' | '+z' | '-x' | '+x'

// storeys
const PLINTH = 0.6, GROUND = 4.4, FL = 3.0, UPPER = 5, EAVES = GROUND + UPPER * FL, CORNICE = 0.4
const BAY = 3.2, WIN_W = 1.3, WIN_H = 1.5
// the arcade: arches on columns, the ground wall set back behind them
const ARCADE_BAY = 3.6, ARCADE_DEPTH = 2.2, ARCH_SPRING = 3.0, COL_R = 0.2
// roofs
const ROOF_H = 3.0, PED_H = 3.0
// plan (OSM, rotated)
const SLAB: Box = [-19.5, 27.6, -6.2, 4.7]
const FRONT: Box = [-9.5, 1.2, -11.2, -6.2]   // the entrance pavilion on the avenue
const BACK: Box = [-4.3, 4.4, 4.7, 15.0]      // the garden wing
const DOOR_W = 2.4, DOOR_H = 3.6, LETTER_W = 5, LETTER_H = 0.6

function shell(out: MeshBuilder, b: Box, g: number, open: Record<Face, boolean>): void {
  const [x0, x1, z0, z1] = b
  block(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, g, g + PLINTH, SHADOW, stucco)
  block(out, x0, x1, z0, z1, g + PLINTH, g + EAVES, RENDER, stucco)
  block(out, x0 - 0.35, x1 + 0.35, z0 - 0.35, z1 + 0.35, g + EAVES - CORNICE, g + EAVES, TRIM, stucco)
  const faces: [Face, number, number, number][] = [['-z', z0, x0, x1], ['+z', z1, x0, x1], ['-x', x0, z0, z1], ['+x', x1, z0, z1]]
  for (const [f, plane, t0, t1] of faces) {
    if (!open[f]) continue
    for (let s = 0; s < UPPER; s++) {
      const y = g + GROUND + s * FL + 0.8
      windows(out, f, plane, t0 + 0.8, t1 - 0.8, y, WIN_W, WIN_H, BAY, GLASS, TRIM)
    }
    const n = Math.max(1, Math.floor((t1 - t0 - 1) / ARCADE_BAY)), step = (t1 - t0) / n
    for (let i = 0; i < n; i++) archOn(out, f, plane, t0 + step * (i + 0.5), g + PLINTH, 1.6, ARCH_SPRING - 0.2, GLASS)
  }
}

/** the garden arcade along the slab's back face: the ground wall set back, columns at the face, the spandrel wall over them */
function arcade(out: MeshBuilder, x0: number, x1: number, z: number, g: number): void {
  const n = Math.max(1, Math.round((x1 - x0) / ARCADE_BAY)), step = (x1 - x0) / n
  block(out, x0, x1, z, z + ARCADE_DEPTH, g, g + 0.3, SHADOW, stucco)   // the loggia floor
  for (let i = 0; i <= n; i++) column(out, x0 + i * step, z + ARCADE_DEPTH - COL_R, g + 0.3, g + ARCH_SPRING, COL_R, MARBLE)
  block(out, x0, x1, z, z + ARCADE_DEPTH, g + ARCH_SPRING + step / 2, g + GROUND, RENDER, stucco)   // the floor over
  // the spandrels: arch shapes cut in shadow on a pale band between spring and the floor over
  rectOn(out, '+z', z + ARCADE_DEPTH, x0, x1, g + ARCH_SPRING, g + ARCH_SPRING + step / 2, RENDER, 0.02)
  for (let i = 0; i < n; i++) archOn(out, '+z', z + ARCADE_DEPTH, x0 + step * (i + 0.5), g + ARCH_SPRING - 0.4, step - 0.5, step / 2 + 0.3, SHADOW, 0.04)
}

export function maisonItalie(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  const [sx0, sx1, sz0, sz1] = SLAB
  // the slab: its back face at ground storey sits behind the arcade, so the shell is the full depth less the loggia
  shell(out, [sx0, sx1, sz0, sz1 - ARCADE_DEPTH], g, { '-z': true, '+z': false, '-x': true, '+x': true })
  block(out, sx0, sx1, sz1 - ARCADE_DEPTH, sz1, g + GROUND, g + EAVES, RENDER, stucco)
  block(out, sx0 - 0.35, sx1 + 0.35, sz1 - ARCADE_DEPTH, sz1 + 0.35, g + EAVES - CORNICE, g + EAVES, TRIM, stucco)
  for (let s = 0; s < UPPER; s++) {
    const y = g + GROUND + s * FL + 0.8
    windows(out, '+z', sz1, sx0 + 0.8, BACK[0] - 0.6, y, WIN_W, WIN_H, BAY, GLASS, TRIM)
    windows(out, '+z', sz1, BACK[1] + 0.6, sx1 - 0.8, y, WIN_W, WIN_H, BAY, GLASS, TRIM)
  }
  arcade(out, sx0, BACK[0], sz1 - ARCADE_DEPTH, g)
  arcade(out, BACK[1], sx1, sz1 - ARCADE_DEPTH, g)
  roof(out, sx0 - 0.3, sx1 + 0.3, sz0 - 0.3, sz1 + 0.3, g + EAVES, ROOF_H, 5.8, 5.8, TILE)

  // the pavilion on the avenue and the garden wing, each gable-roofed with a pediment on its end
  shell(out, FRONT, g, { '-z': true, '+z': false, '-x': true, '+x': true })
  shell(out, BACK, g, { '-z': false, '+z': true, '-x': true, '+x': true })
  for (const [b, f] of [[FRONT, -1], [BACK, 1]] as [Box, number][]) {
    const [x0, x1, z0, z1] = b, y = g + EAVES
    const za = f < 0 ? z0 - 0.3 : sz0, zb = f < 0 ? sz1 : z1 + 0.3
    roof(out, x0 - 0.3, x1 + 0.3, za, zb, y, PED_H, (x1 - x0) / 2 + 0.3, 0, TILE)
    const zEnd = f < 0 ? z0 - 0.35 : z1 + 0.35
    if (f < 0) pediment(out, x0 - 0.35, x1 + 0.35, zEnd, y, PED_H, 0.3, TRIM)
    else rectOn(out, '+z', zEnd, x0 - 0.35, x1 + 0.35, y, y + 0.05, TRIM)   // the back pediment is the roof's own gable
    // attic windows in the tympanum
    for (const t of [-1.6, 0, 1.6]) rectOn(out, f < 0 ? '-z' : '+z', zEnd + (f < 0 ? -0.02 : 0.02), (x0 + x1) / 2 + t - 0.4,
      (x0 + x1) / 2 + t + 0.4, y + 0.5, y + 1.3 - Math.abs(t) * 0.3, GLASS, 0.03)
  }
  // the door and the ITALIA lettering on the pavilion
  const [fx0, fx1, fz0] = FRONT, mid = (fx0 + fx1) / 2
  rectOn(out, '-z', fz0, mid - DOOR_W / 2 - 0.5, mid + DOOR_W / 2 + 0.5, g, g + DOOR_H + 0.6, TRIM, 0.1)
  archOn(out, '-z', fz0, mid, g + 0.2, DOOR_W, DOOR_H, GLASS, 0.14)
  rectOn(out, '-z', fz0, mid - LETTER_W / 2, mid + LETTER_W / 2, g + GROUND - 0.4, g + GROUND - 0.4 + LETTER_H, LETTER, 0.1)
  block(out, mid - DOOR_W, mid + DOOR_W, fz0 - 1.6, fz0, g, g + 0.25, TRIM, stucco)
}
