/**
 * THE MAISON D'ÉGYPTE — SAM ARCHITECTURE + DAR ARAFA (2023): a nine-storey block like a cut stone, its front a
 * concave glass curtain wall swung between two blind ochre concrete pylons carved all over with hieroglyph columns;
 * the curtain's top edge sags toward the middle; the back and ends are the same carved ochre concrete.
 * Refs: ArchDaily 1014218 (docs/landmarks/refs/citeu/egypte/, 2026-11-04). Plan from OSM way 954179936 (one outline,
 * fixme "position et forme approximatives": a fan whose concave side faces east-north-east toward the park).
 * Local frame: −z toward bearing 74 (the glass front), x toward bearing 164; origin the bbox centre.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

const OCHRE: Rgb = hex('#ddc89c'), GLYPH: Rgb = hex('#c2ad82'), GLASS: Rgb = hex('#56707e'), MULL: Rgb = hex('#b9bec0')
const ROOF: Rgb = hex('#8c8a84'), DOOR: Rgb = hex('#2e3437')
const conc = surfaceTag('concrete'), glass = surfaceTag('glass')

export const W = 46, D = 28, H = 30          // overall width (x), depth (z), height
const PYLON = 9                               // width of each blind end pylon
const SAG = 9                                 // how far the glass arc recedes at the middle
const TOP_SAG = 2.2                           // the curtain top drops this much at the middle
const GLASS_D = 2.5                         // facet depth, so neighbouring facets close their steps
const SEGS = 16, FLOOR = 3.2, GF = 4.2        // arc facets; storey heights
const GLYPH_COL = 1.15, GLYPH_ROW = 2.0, GLYPH_W = 0.55, GLYPH_H = 1.2   // the carved glyph grid

/** the glass recess at x (0 at the pylons' inner edges, SAG at the middle) */
const recess = (x: number): number => { const a = W / 2 - PYLON, u = x / a; return SAG * (1 - u * u) }

type Face = '-z' | '+z' | '-x' | '+x'

/** carve a face with staggered glyph cells */
function glyphs(out: MeshBuilder, f: Face, plane: number, t0: number, t1: number, g: number): void {
  const n = Math.floor((t1 - t0 - 0.6) / GLYPH_COL), rows = Math.floor((H - 1.5) / GLYPH_ROW)
  const off = t0 + (t1 - t0 - n * GLYPH_COL) / 2
  for (let r = 0; r < rows; r++) for (let k = 0; k < n; k++) {
    const t = off + (k + 0.5) * GLYPH_COL, y = g + 0.8 + r * GLYPH_ROW + ((k * 7 + r * 3) % 4) * 0.12
    const h = GLYPH_H * (0.6 + ((k + r * 5) % 3) * 0.2)
    rectOn(out, f, plane, t - GLYPH_W / 2, t + GLYPH_W / 2, y, y + h, GLYPH, 0.03)
  }
}

export function maisonEgypte(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0, x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2, a = W / 2 - PYLON
  // the two pylons and the carved shell
  block(out, x0, x0 + PYLON, z0, z1, g - 0.3, H + g, OCHRE, conc)
  block(out, x1 - PYLON, x1, z0, z1, g - 0.3, H + g, OCHRE, conc)
  glyphs(out, '-z', z0, x0 + 0.3, x0 + PYLON - 0.3, g)
  glyphs(out, '-z', z0, x1 - PYLON + 0.3, x1 - 0.3, g)
  glyphs(out, '-x', x0, z0 + 0.3, z1 - 0.3, g)
  glyphs(out, '+x', x1, z0 + 0.3, z1 - 0.3, g)
  glyphs(out, '+z', z1, x0 + 0.3, x1 - 0.3, g)
  // the body behind the curtain, sliced along the arc, and the glass facets
  for (let i = 0; i < SEGS; i++) {
    const xa = -a + 2 * a * i / SEGS, xb = -a + 2 * a * (i + 1) / SEGS, xm = (xa + xb) / 2
    const zf = z0 + recess(xm), top = g + H - TOP_SAG * (1 - (xm / a) ** 2)
    block(out, xa, xb, zf + GLASS_D, z1, g - 0.3, g + H - TOP_SAG - 0.6, OCHRE, conc)
    block(out, xa, xb, zf, zf + GLASS_D, g - 0.3, top, GLASS, glass)
    rectOn(out, '-z', zf, xa - 0.05, xa + 0.09, g, top, MULL, 0.05)
    for (let y = g + GF; y < top - 0.5; y += FLOOR) rectOn(out, '-z', zf, xa, xb, y - 0.12, y + 0.12, MULL, 0.04)
  }
  // flat roof behind the parapet, and the dark entrance at the foot of the curtain
  block(out, -a, a, z0 + SAG + 0.5, z1 - 0.5, g + H - TOP_SAG - 0.6, g + H - TOP_SAG - 0.5, ROOF)
  rectOn(out, '-z', z0 + SAG, -3, 3, g, g + 3.4, DOOR, 0.3)
}
