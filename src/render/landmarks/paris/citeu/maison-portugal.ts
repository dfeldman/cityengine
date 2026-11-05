/**
 * THE MAISON DU PORTUGAL — ANDRÉ DE GOUVEIA (Fondation Calouste Gulbenkian, 1967): grey concrete slabs on a cranked
 * plan — a northern block and a long southern wing bent ~12° toward Avenue Pierre de Coubertin, regular punched
 * windows, a set-back top storey — and before the northern block a low gold-clad hall (a diamond-patterned metal
 * skin) with a glazed box at its southern end, where the entrance is.
 * Refs: Commons (docs/landmarks/refs/citeu/portugal/, 2026-11-04). Plan from OSM way 37524403 (one outline, no parts).
 * Front faces Avenue Pierre de Coubertin to the east (bearing 110, square to the slab).
 * Local frame: −z toward bearing 110 (the front), x toward bearing 200 (south-south-west); origin the bbox centre.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, placed, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

const CONC: Rgb = hex('#8e9193'), ATTIC: Rgb = hex('#a2a5a7'), GLASS: Rgb = hex('#2e3437'), FRAME: Rgb = hex('#6d7174')
const GOLD: Rgb = hex('#9a7836'), GOLD_D: Rgb = hex('#7a5c26'), BOX: Rgb = hex('#3d6763'), FLAT: Rgb = hex('#8a8c8c')
const conc = surfaceTag('concrete'), metal = surfaceTag('metal'), glass = surfaceTag('glass')

// boxes [x0, x1, z0, z1] in the bbox-centre frame, from the OSM outline
const NORTH = [-33.7, -5.5, -1, 11.5], HALL = [-33.7, -9.6, -17.2, -1], GBOX = [-9.6, 5.6, -15.2, -4.9]
const KNEE = [-9.6, 4, -4.9, 10.5]
// the south wing in its own frame, then turned and set down
const WING_L = 35, WING_D = 9.6, WING_ANG = -11.5 * Math.PI / 180, WING_X = 14.6, WING_Z = 8.2
const LEVELS = 5, FL = 2.9, GF = 3.3, ATTIC_H = 2.8, ATTIC_IN = 1.5, PARAPET = 0.6
const BAY = 3.0, WIN_W = 1.5, WIN_H = 1.45, SILL = 0.85
const HALL_H = 8.2, BOX_H = 6.0, DIAMOND = 2.6

type Face = '-z' | '+z' | '-x' | '+x'
type Box = number[]
const span = (f: Face, [x0, x1, z0, z1]: Box): [number, number, number] =>
  f === '-z' ? [z0, x0, x1] : f === '+z' ? [z1, x0, x1] : f === '-x' ? [x0, z0, z1] : [x1, z0, z1]

/** a concrete slab: punched windows on every storey, a parapet, a set-back attic storey with a ribbon window */
function slab(out: MeshBuilder, b: Box, g: number, faces: Face[], attic = true): void {
  const [x0, x1, z0, z1] = b, top = g + GF + (LEVELS - 1) * FL
  block(out, x0, x1, z0, z1, g - 0.3, top, CONC, conc)
  block(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, top, top + PARAPET, ATTIC, conc)
  if (attic) {
    const i = ATTIC_IN
    block(out, x0 + i, x1 - i, z0 + i, z1 - i, top, top + ATTIC_H, ATTIC, conc)
    block(out, x0 + i - 0.3, x1 - i + 0.3, z0 + i - 0.3, z1 - i + 0.3, top + ATTIC_H, top + ATTIC_H + 0.3, FRAME, conc)
  }
  for (const f of faces) {
    const [plane, a, c] = span(f, b), n = Math.max(1, Math.floor((c - a) / BAY))
    for (let s = 0; s < LEVELS; s++) {
      const y = s === 0 ? g + 1.0 : g + GF + (s - 1) * FL + SILL
      for (let k = 0; k < n; k++) {
        const t = a + (c - a) * (k + 0.5) / n
        rectOn(out, f, plane, t - WIN_W / 2 - 0.12, t + WIN_W / 2 + 0.12, y - 0.12, y + WIN_H + 0.12, FRAME, 0.04)
        rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y, y + WIN_H, GLASS, 0.07)
      }
    }
    if (attic) {
      const ai = ATTIC_IN, [ap, aa, ac] = span(f, [x0 + ai, x1 - ai, z0 + ai, z1 - ai])
      rectOn(out, f, ap, aa + 0.8, ac - 0.8, top + 0.8, top + ATTIC_H - 0.5, GLASS, 0.05)
    }
  }
}

/** the low gold hall: a metal skin of staggered diamonds (raised darker squares), a flat roof */
function hall(out: MeshBuilder, g: number): void {
  const [x0, x1, z0, z1] = HALL, y = g + HALL_H
  block(out, x0, x1, z0, z1, g - 0.3, y, GOLD, metal)
  block(out, x0 + 0.3, x1 - 0.3, z0 + 0.3, z1 - 0.3, y, y + 0.05, FLAT)
  for (const f of ['-z', '-x', '+x'] as Face[]) {
    const [plane, a, c] = span(f, HALL), n = Math.floor((c - a) / DIAMOND), rows = Math.floor(HALL_H / DIAMOND)
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? DIAMOND / 2 : 0, yy = g + 0.3 + r * DIAMOND
      for (let k = 0; k < n; k++) {
        const t = a + off + k * DIAMOND + DIAMOND * 0.25
        if (t + DIAMOND * 0.5 > c) continue
        rectOn(out, f, plane, t, t + DIAMOND * 0.5, yy + DIAMOND * 0.25, yy + DIAMOND * 0.75, GOLD_D, 0.05)
      }
    }
  }
  // the dark doorway on the front
  rectOn(out, '-z', z0, -14.5, -11.5, g, g + 4.2, GLASS, 0.08)
}

/** the glazed entrance box between the hall and the south wing */
function glassBox(out: MeshBuilder, g: number): void {
  const [x0, x1, z0, z1] = GBOX, y = g + BOX_H
  block(out, x0, x1, z0, z1, g - 0.3, y, BOX, glass)
  block(out, x0 - 0.15, x1 + 0.15, z0 - 0.15, z1 + 0.15, y - 0.4, y, FRAME, metal)
  for (const f of ['-z', '+x'] as Face[]) {
    const [plane, a, c] = span(f, GBOX)
    for (let t = a + 1.6; t < c; t += 1.6) rectOn(out, f, plane, t - 0.06, t + 0.06, g, y - 0.4, FRAME, 0.05)
  }
}

export function maisonPortugal(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  slab(out, NORTH, g, ['-x', '+z', '-z'])
  slab(out, KNEE, g, ['-z'], false)
  const w = new MeshBuilder()
  slab(w, [-WING_L / 2, WING_L / 2, -WING_D / 2, WING_D / 2], g, ['-z', '+z', '+x'])
  placed(out, w, WING_ANG, WING_X, WING_Z)
  hall(out, g)
  glassBox(out, g)
}
