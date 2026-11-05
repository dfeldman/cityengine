/**
 * THE MAISON DU MAROC (Albert Laprade / Jean Walter, 1953): cream rendered wings under green glazed-tile hipped roofs
 * around a courtyard open to the south — a seven-storey block at the north-east corner on the Boulevard Jourdan, a
 * five-storey wing running south from it, a four-storey west wing — and between them on the boulevard side a low glazed
 * hall: thin cream piers, a frieze of ochre grilles, a green hipped roof. A flat one-storey link joins it to the wings.
 * Refs: Commons (docs/landmarks/refs/citeu/maroc/, 2026-11-04). Plan from OSM way 29469843 and parts 867840000-4.
 * Front faces the Boulevard Jourdan to the north (bearing 10).
 * Local frame: −z toward bearing 10 (the front), x toward bearing 100; origin the plan's bbox centre.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { hipRoof, rectOn } from '../palaces/common.ts'

const CREAM: Rgb = hex('#e6dbb8'), GREEN: Rgb = hex('#2f7468'), GLASS: Rgb = hex('#33393c'), OCHRE: Rgb = hex('#b8955a')
const BASE: Rgb = hex('#cfc3a0'), FLAT: Rgb = hex('#8c8a84')
const stone = surfaceTag('stucco')

// boxes [x0, x1, z0, z1] in the bbox-centre frame, from the OSM parts
const WEST = [-31.6, -19.8, -36.5, 3], TOWER = [12.4, 31.6, -30.2, -15.2], EAST = [18.5, 30.4, -15.2, 37.5]
const HALL = [-9.4, 12.4, -29.2, -18.2], LINK = [-19.8, 12.4, -18.2, -15.2], LINK_W = [-19.8, -9.4, -37.5, -18.2]
const FL = 2.95, GF = 3.4, CORNICE = 0.35, EAVE = 0.6, ROOF_PITCH = 0.42
const BAY = 3.2, WIN_W = 1.3, WIN_H = 1.6, SILL = 0.8
const HALL_H = 4.6, HALL_PIER = 2.4, HALL_ROOF = 3.4, LINK_H = 4.0

type Face = '-z' | '+z' | '-x' | '+x'
type Box = number[]
const span = (f: Face, [x0, x1, z0, z1]: Box): [number, number, number] =>
  f === '-z' ? [z0, x0, x1] : f === '+z' ? [z1, x0, x1] : f === '-x' ? [x0, z0, z1] : [x1, z0, z1]

/** a rendered wing: a plinth, regular punched windows, a cornice and the green hipped roof */
function wing(out: MeshBuilder, b: Box, g: number, levels: number, faces: Face[]): void {
  const [x0, x1, z0, z1] = b, top = g + GF + (levels - 1) * FL
  block(out, x0, x1, z0, z1, g - 0.3, top, CREAM, stone)
  block(out, x0 - 0.05, x1 + 0.05, z0 - 0.05, z1 + 0.05, g - 0.3, g + 0.8, BASE, stone)
  block(out, x0 - 0.25, x1 + 0.25, z0 - 0.25, z1 + 0.25, top - CORNICE, top, CREAM, stone)
  hipRoof(out, x0, x1, z0, z1, top, Math.min(x1 - x0, z1 - z0) * ROOF_PITCH, GREEN, EAVE)
  for (const f of faces) {
    const [plane, a, c] = span(f, b), n = Math.max(1, Math.floor((c - a) / BAY))
    for (let s = 0; s < levels; s++) {
      const y = s === 0 ? g + 1.2 : g + GF + (s - 1) * FL + SILL
      for (let i = 0; i < n; i++) {
        const t = a + (c - a) * (i + 0.5) / n
        rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y, y + (s === 0 ? 2.0 : WIN_H), GLASS, 0.05)
      }
    }
  }
}

/** the low glazed hall on the boulevard: piers, glass, a grille frieze, a green hipped roof */
function hall(out: MeshBuilder, g: number): void {
  const [x0, x1, z0, z1] = HALL, y = g + HALL_H
  block(out, x0 + 0.4, x1 - 0.4, z0 + 0.4, z1 - 0.4, g - 0.3, y, GLASS)
  block(out, x0, x1, z0, z1, g - 0.3, g + 0.7, CREAM, stone)
  block(out, x0 - 0.2, x1 + 0.2, z0 - 0.2, z1 + 0.2, y - 0.9, y, CREAM, stone)
  for (const f of ['-z', '-x', '+x'] as Face[]) {
    const [plane, a, c] = span(f, HALL), n = Math.max(1, Math.round((c - a) / HALL_PIER))
    for (let i = 0; i <= n; i++) {
      const t = a + (c - a) * i / n
      rectOn(out, f, plane, Math.max(a, t - 0.25), Math.min(c, t + 0.25), g + 0.7, y - 0.9, CREAM, 0.25)
      if (i < n) rectOn(out, f, plane, t + 0.4, t + (c - a) / n - 0.4, y - 0.8, y - 0.15, OCHRE, 0.22)
    }
  }
  hipRoof(out, x0, x1, z0, z1, y, HALL_ROOF, GREEN, 0.9)
}

function flatLink(out: MeshBuilder, b: Box, g: number, faces: Face[]): void {
  const [x0, x1, z0, z1] = b, y = g + LINK_H
  block(out, x0, x1, z0, z1, g - 0.3, y, CREAM, stone)
  block(out, x0 + 0.3, x1 - 0.3, z0 + 0.3, z1 - 0.3, y, y + 0.05, FLAT)
  for (const f of faces) {
    const [plane, a, c] = span(f, b)
    for (let t = a + 0.6; t + 1.8 < c; t += 2.6) rectOn(out, f, plane, t, t + 1.8, g + 0.8, y - 0.6, GLASS, 0.05)
  }
}

export function maisonMaroc(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  wing(out, TOWER, g, 7, ['-z', '+x', '-x', '+z'])
  wing(out, EAST, g, 5, ['+x', '-x', '+z'])
  wing(out, WEST, g, 4, ['-x', '+x', '-z', '+z'])
  hall(out, g)
  flatLink(out, LINK, g, ['+z'])
  flatLink(out, LINK_W, g, ['-z', '-x'])
}
