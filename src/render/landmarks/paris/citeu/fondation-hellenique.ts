/**
 * THE FONDATION HELLÉNIQUE (Nikolaos Zahos, 1932): a neo-classical block of pale ashlar, narrow end on to the campus
 * walk. A long five-storey body with a raised end pavilion at each end; the front (NNE) pavilion stands higher, under a
 * stepped attic carrying an eagle relief, with a tetrastyle Ionic portico and pediment before the door, stairs at its
 * sides. A grey Greek-key frieze runs under the cornice; tall ground-floor windows, regular rows above.
 * Refs: Commons (docs/landmarks/refs/citeu/hellenique/, 2026-11-04; gr-4 is the architect's elevation). Plan from OSM
 * way 260196621, rotated. Local frame: −z toward bearing 19 (the portico), x toward bearing 109; origin the bbox centre.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { column, hex, pediment, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

const STONE: Rgb = hex('#e2d8c0'), TRIM: Rgb = hex('#efe8d6'), FRIEZE: Rgb = hex('#8e98a2'), GLASS: Rgb = hex('#3a4046')
const SHUTTER: Rgb = hex('#f2f0ea'), DOOR: Rgb = hex('#6a2a22'), BASE: Rgb = hex('#c8bea8'), ROOF: Rgb = hex('#9a958c')
const ashlar = surfaceTag('ashlar')

type Box = number[]
// plan boxes [x0, x1, z0, z1] in the local frame
const BODY: Box = [-6.5, 6.6, -13.8, 16.6], SOUTH: Box = [-7.5, 7.6, 16.5, 22.55], NORTH: Box = [-7.6, 7.4, -19.95, -13.7]
const PORCH: Box = [-4.0, 3.8, -22.55, -19.95]
// heights
const PLINTH = 1.0, GROUND = 4.6, FL = 3.2, UPPER = 3, ATTIC = 1.6, CORNICE = 0.5
const BODY_H = PLINTH + GROUND + UPPER * FL + ATTIC            // top of the frieze band
const PAV_UP = 1.0, FRONT_UP = 2.6, CROWN_UP = 1.6, CROWN_INSET = 3.2
const COL_R = 0.42, COL_H = 7.2, PED_H = 1.7
const BAY = 2.9, WIN_W = 1.25, WIN_H = 2.0, G_WIN_H = 3.2

type F = '-z' | '+z' | '-x' | '+x'

function windows(out: MeshBuilder, f: F, plane: number, a: number, b: number, g: number, groundToo = true): void {
  const n = Math.max(1, Math.round((b - a) / BAY)), step = (b - a) / n
  for (let i = 0; i < n; i++) {
    const t = a + step * (i + 0.5)
    if (groundToo) {
      const y = g + PLINTH + 0.6
      rectOn(out, f, plane, t - WIN_W / 2 - 0.15, t + WIN_W / 2 + 0.15, y - 0.15, y + G_WIN_H + 0.15, TRIM, 0.05)
      rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y, y + G_WIN_H, SHUTTER, 0.07)
    }
    for (let s = 0; s < UPPER; s++) {
      const y = g + PLINTH + GROUND + s * FL + 0.7
      rectOn(out, f, plane, t - WIN_W / 2 - 0.12, t + WIN_W / 2 + 0.12, y - 0.12, y + WIN_H + 0.12, TRIM, 0.05)
      rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y, y + WIN_H, s === 0 ? SHUTTER : GLASS, 0.07)
    }
    const ya = g + PLINTH + GROUND + UPPER * FL + 0.2
    rectOn(out, f, plane, t - 0.45, t + 0.45, ya, ya + 0.8, GLASS, 0.07)
  }
}

/** a stone mass with plinth, Greek-key frieze band under a cornice, and a flat roof */
function mass(out: MeshBuilder, [x0, x1, z0, z1]: Box, g: number, top: number): void {
  block(out, x0, x1, z0, z1, g - 0.3, g + PLINTH, BASE, ashlar)
  block(out, x0, x1, z0, z1, g + PLINTH, g + top, STONE, ashlar)
  const fb = g + top - 1.1
  for (const [f, p, a, b] of [['-z', z0, x0, x1], ['+z', z1, x0, x1], ['-x', x0, z0, z1], ['+x', x1, z0, z1]] as [F, number, number, number][])
    rectOn(out, f, p, a + 0.2, b - 0.2, fb, fb + 0.6, FRIEZE, 0.04)
  block(out, x0 - 0.35, x1 + 0.35, z0 - 0.35, z1 + 0.35, g + top, g + top + CORNICE, TRIM, ashlar)
  block(out, x0 + 0.3, x1 - 0.3, z0 + 0.3, z1 - 0.3, g + top + CORNICE, g + top + CORNICE + 0.05, ROOF)
}

export function fondationHellenique(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  mass(out, BODY, g, BODY_H)
  mass(out, SOUTH, g, BODY_H + PAV_UP)
  mass(out, NORTH, g, BODY_H + FRONT_UP)
  // the front pavilion's stepped attic and crown, the eagle relief on its face
  const [nx0, nx1, nz0, nz1] = NORTH, ft = g + BODY_H + FRONT_UP + CORNICE
  block(out, nx0 + CROWN_INSET, nx1 - CROWN_INSET, nz0 + 0.4, nz1 - 0.6, ft, ft + CROWN_UP, STONE, ashlar)
  block(out, nx0 + CROWN_INSET - 0.3, nx1 - CROWN_INSET + 0.3, nz0 + 0.1, nz1 - 0.3, ft + CROWN_UP, ft + CROWN_UP + 0.35, TRIM, ashlar)
  const cx = (nx0 + nx1) / 2
  rectOn(out, '-z', nz0, cx - 1.3, cx + 1.3, ft - 3.6, ft - 1.6, BASE, 0.12)
  rectOn(out, '-z', nz0, cx - 0.5, cx + 0.5, ft - 3.3, ft - 1.9, FRIEZE, 0.16)
  // long sides and the ends
  const [bx0, bx1, bz0, bz1] = BODY
  windows(out, '-x', bx0, bz0 + 0.5, bz1 - 0.5, g)
  windows(out, '+x', bx1, bz0 + 0.5, bz1 - 0.5, g)
  for (const [x0, x1, z0, z1] of [SOUTH, NORTH]) {
    windows(out, '-x', x0, z0 + 0.6, z1 - 0.6, g)
    windows(out, '+x', x1, z0 + 0.6, z1 - 0.6, g)
  }
  windows(out, '+z', SOUTH[3], SOUTH[0] + 1, SOUTH[1] - 1, g)
  // front face: a window each side of the portico, upper floors only
  windows(out, '-z', nz0, nx0 + 0.6, nx0 + 3.4, g, false)
  windows(out, '-z', nz0, nx1 - 3.4, nx1 - 0.6, g, false)
  // the portico: podium, four Ionic columns, entablature, pediment, the door behind
  const [px0, px1, pz0, pz1] = PORCH
  block(out, px0, px1, pz0, pz1, g - 0.3, g + PLINTH, BASE, ashlar)
  rectOn(out, '-z', nz0, -1.0 + (px0 + px1) / 2, 1.0 + (px0 + px1) / 2, g + PLINTH, g + PLINTH + 3.6, DOOR, 0.05)
  const yc = g + PLINTH
  for (let i = 0; i < 4; i++) column(out, px0 + 0.6 + i * ((px1 - px0 - 1.2) / 3), pz0 + 0.6, yc, yc + COL_H, COL_R, TRIM)
  block(out, px0 - 0.2, px1 + 0.2, pz0 - 0.1, pz1, yc + COL_H, yc + COL_H + 1.0, TRIM, ashlar)
  rectOn(out, '-z', pz0 - 0.1, px0 + 0.5, px1 - 0.5, yc + COL_H + 0.3, yc + COL_H + 0.7, FRIEZE, 0.03)
  pediment(out, px0 - 0.2, px1 + 0.2, pz0 - 0.1, yc + COL_H + 1.0, PED_H, pz1 - pz0 + 0.1, TRIM)
  // side stairs up to the podium
  for (let s = 0; s < 4; s++) {
    const h = PLINTH * (s + 1) / 4
    block(out, px0 - 2.4 + s * 0.6, px0, pz0 + 0.2, pz1, g - 0.3, g + h, BASE, ashlar)
    block(out, px1, px1 + 2.4 - s * 0.6, pz0 + 0.2, pz1, g - 0.3, g + h, BASE, ashlar)
  }
}
