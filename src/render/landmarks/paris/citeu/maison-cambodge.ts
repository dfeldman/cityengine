/**
 * THE MAISON DU CAMBODGE — ALFRED AUDOUL (1957): a pale stone-clad hollow block. Toward the campus (north-north-east)
 * two five-storey wings come forward round a shallow raised court; between them the front range, a glazed ground
 * floor behind square piers, the carved emblem and PAVILLON DU CAMBODGE over the door, and a stair up the court's
 * middle flanked by two guardian lions on plinths. Each wing's end carries a tall louvred slot; thin flat eaves; a
 * set-back attic on the front range with a small stepped Khmer spire. Behind, a closed courtyard; its back range low.
 * Refs: Commons (docs/landmarks/refs/citeu/cambodge/, 2026-11-04). Plan from OSM relation 6926792 (outer + court hole).
 * Front bearing 18 (the court faces the campus footway and steps; the long back faces the périphérique).
 * Local frame: −z toward bearing 18 (the front), x toward bearing 108; origin the bbox centre.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { prism } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn, type F } from '../palaces/common.ts'

const STONE: Rgb = hex('#e6e1d2'), TRIM: Rgb = hex('#c8c1ae'), DEEP: Rgb = hex('#a9a391'), GLASS: Rgb = hex('#36424a')
const DOOR: Rgb = hex('#2c3437'), LOUVRE: Rgb = hex('#5d6664'), GILT: Rgb = hex('#a59a6e'), ROOF: Rgb = hex('#9b978a')
const ash = surfaceTag('stucco')

// boxes [x0, x1, z0, z1] from the OSM outline in this frame
const WING_W = [-25.3, -10.8, -30.8, 24], WING_E = [11, 25.1, -30.6, 25.2]
const FRONT = [-10.8, 11, -20, -1.2], BACK = [-12.3, 12.5, 23.7, 27.9], BACK_BAY = [-3.8, 3, 27.9, 31]
const H = 19.5, GF = 4.2, FL = 3.05, LEVELS = 5, EAVE = 0.45, EAVE_OUT = 0.35, ATTIC_H = 3.0, ATTIC_IN = 2.2
const BACK_H = 4.5, WIN_W = 2.1, WIN_H = 1.15, BAY = 3.2, SLOT_W = 1.6
const TERR = 1.6, TERR_Z = -29.5, STAIR_W = 5, STEPS = 9, LION_H = 1.8
const SPIRE = [[2.6, 1.3], [2.0, 1.1], [1.45, 1.0], [0.95, 0.9]], SPIRE_TIP = 3.2

type Box = number[]
const span = (f: F, [x0, x1, z0, z1]: Box): [number, number, number] =>
  f === '-z' ? [z0, x0, x1] : f === '+z' ? [z1, x0, x1] : f === '-x' ? [x0, z0, z1] : [x1, z0, z1]

/** a stone range: wide low windows in rows over a taller ground floor, a thin eave */
function range(out: MeshBuilder, b: Box, g: number, faces: F[], top = H): void {
  const [x0, x1, z0, z1] = b
  block(out, x0, x1, z0, z1, g - 0.3, top, STONE, ash)
  block(out, x0 - EAVE_OUT, x1 + EAVE_OUT, z0 - EAVE_OUT, z1 + EAVE_OUT, top, top + EAVE, TRIM)
  block(out, x0 + 0.2, x1 - 0.2, z0 + 0.2, z1 - 0.2, top + EAVE, top + EAVE + 0.02, ROOF)
  for (const f of faces) {
    const [plane, a, c] = span(f, b), n = Math.max(1, Math.floor((c - a) / BAY))
    for (let s = 0; s < LEVELS; s++) {
      const y = g + GF + s * FL + 1.0
      if (y + WIN_H > top - 0.4) break
      for (let k = 0; k < n; k++) {
        const t = a + (c - a) * (k + 0.5) / n
        rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y, y + WIN_H, GLASS, 0.06)
      }
    }
    for (let k = 0; k < n; k++) { const t = a + (c - a) * (k + 0.5) / n; rectOn(out, f, plane, t - 0.9, t + 0.9, g + 1.0, g + 3.2, GLASS, 0.06) }
  }
}

/** a wing's end toward the court: the tall louvred slot up its middle, corner windows either side */
function wingEnd(out: MeshBuilder, b: Box, g: number): void {
  const [x0, x1, z0] = b, m = (x0 + x1) / 2
  rectOn(out, '-z', z0, m - SLOT_W / 2, m + SLOT_W / 2, g + GF, H - 1.2, LOUVRE, 0.08)
  for (let y = g + GF + 0.4; y < H - 1.4; y += 0.7) rectOn(out, '-z', z0, m - SLOT_W / 2, m + SLOT_W / 2, y, y + 0.12, TRIM, 0.12)
  for (let s = 0; s < LEVELS; s++) {
    const y = g + GF + s * FL + 1.0
    for (const t of [x0 + 2.2, x1 - 2.2]) rectOn(out, '-z', z0, t - 1.3, t + 1.3, y, y + WIN_H, GLASS, 0.06)
  }
  rectOn(out, '-z', z0, m - 2, m + 2, g + 0.8, g + 3.4, GLASS, 0.06)
}

/** the front range's court face: glazed doors behind piers, the emblem and the name band */
function frontFace(out: MeshBuilder, g: number): void {
  const [x0, x1, z0] = FRONT, y0 = g + TERR
  rectOn(out, '-z', z0, x0 + 0.6, x1 - 0.6, y0, y0 + 3.4, DOOR, 0.04)
  for (let i = 0; i <= 10; i++) { const x = x0 + 0.6 + (x1 - x0 - 1.2) * i / 10; block(out, x - 0.3, x + 0.3, z0 - 0.45, z0, y0, y0 + 3.4, STONE, ash) }
  block(out, x0, x1, z0 - 0.6, z0, y0 + 3.4, y0 + 3.8, TRIM)
  rectOn(out, '-z', z0, -5.2, 5.2, y0 + 3.95, y0 + 4.45, DEEP, 0.07)          // PAVILLON DU CAMBODGE
  rectOn(out, '-z', z0, -2.4, 2.4, y0 + 4.7, y0 + 7.3, TRIM, 0.12)            // the carved emblem
}

/** the raised court, its stair up the middle, the lions on their plinths */
function court(out: MeshBuilder, g: number): void {
  const x0 = WING_W[1], x1 = WING_E[0], z1 = FRONT[2]
  block(out, x0, x1, TERR_Z + 3, z1, g - 0.3, g + TERR, DEEP, ash)
  block(out, x0, -STAIR_W / 2 - 2, TERR_Z, TERR_Z + 3, g - 0.3, g + TERR + 0.8, STONE, ash)   // the low wall at its mouth
  block(out, STAIR_W / 2 + 2, x1, TERR_Z, TERR_Z + 3, g - 0.3, g + TERR + 0.8, STONE, ash)
  for (let i = 0; i < STEPS; i++) {
    const z = TERR_Z - 2 + i * 0.5
    block(out, -STAIR_W / 2, STAIR_W / 2, z, TERR_Z + 3.1, g - 0.3, g + (i + 1) * TERR / STEPS, i % 2 ? TRIM : STONE)
  }
  for (const x of [-STAIR_W / 2 - 1, STAIR_W / 2 + 1]) {
    block(out, x - 1, x + 1, TERR_Z - 2, TERR_Z + 1.5, g - 0.3, g + TERR + 0.9, STONE, ash)
    prism(out, x, TERR_Z - 0.3, g + TERR + 0.9, g + TERR + 0.9 + LION_H, 0.55, 6, TRIM, 0, 0.35)
  }
}

/** the attic on the front range and the small stepped spire on it */
function attic(out: MeshBuilder, g: number): void {
  const [x0, x1, z0, z1] = FRONT, i = ATTIC_IN, y = g + H + EAVE
  block(out, x0 + i, x1 - i, z0 + i, z1 - i, y, y + ATTIC_H, STONE, ash)
  rectOn(out, '-z', z0 + i, x0 + i + 1, x1 - i - 1, y + 0.8, y + ATTIC_H - 0.6, GLASS, 0.05)
  block(out, x0 + i - 0.25, x1 - i + 0.25, z0 + i - 0.25, z1 - i + 0.25, y + ATTIC_H, y + ATTIC_H + 0.3, TRIM)
  const zs = (z0 + z1) / 2
  let h = y + ATTIC_H + 0.3
  for (const [r, d] of SPIRE) { block(out, -r, r, zs - r, zs + r, h, h + d, STONE, ash); h += d }
  prism(out, 0, zs, h, h + SPIRE_TIP, 0.75, 8, STONE, 0, 0.12)
  prism(out, 0, zs, h + SPIRE_TIP, h + SPIRE_TIP + 0.9, 0.12, 6, GILT, 0, 0.02)
}

export function maisonCambodge(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  range(out, WING_W, g, ['-x', '+z', '+x'])
  range(out, WING_E, g, ['+x', '+z', '-x'])
  wingEnd(out, WING_W, g)
  wingEnd(out, WING_E, g)
  range(out, FRONT, g, ['+z'], H - 0.5)
  frontFace(out, g)
  court(out, g)
  attic(out, g)
  // the back range: low, a glazed gallery to the courtyard, a bay on the périphérique side
  block(out, BACK[0], BACK[1], BACK[2], BACK[3], g - 0.3, g + BACK_H, STONE, ash)
  block(out, BACK[0], BACK[1], BACK[2] - 0.2, BACK[3] + 0.2, g + BACK_H, g + BACK_H + 0.3, TRIM)
  rectOn(out, '-z', BACK[2], BACK[0] + 0.5, BACK[1] - 0.5, g + 0.6, g + 3.6, GLASS, 0.05)
  block(out, BACK_BAY[0], BACK_BAY[1], BACK_BAY[2], BACK_BAY[3], g - 0.3, g + BACK_H + 1.2, STONE, ash)
  rectOn(out, '+z', BACK_BAY[3], BACK_BAY[0] + 1, BACK_BAY[1] - 1, g + 1, g + BACK_H, DOOR, 0.05)
}
