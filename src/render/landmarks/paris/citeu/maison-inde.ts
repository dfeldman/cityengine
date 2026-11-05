/**
 * THE MAISON DE L'INDE (Mahendra Raj / Pierre-Charles Blanc, 1968) and its annexe: a seven-storey slab framed in white
 * concrete, its long faces a staggered checker of windows each beside a sage-green or rust-brown panel; at its foot,
 * running past its north end, a low two-storey entrance wing — glazed ground floor recessed behind thin columns, an
 * upper band of tall windows between brown timber piers, a heavy brown fascia. A plain south wing behind; the annexe
 * (six storeys and a roof storey) to the north-east, joined to the slab by a bridge over an open passage.
 * Refs: ciup.fr (Antoine Meyssonnier photos, docs/landmarks/refs/citeu/inde/, 2026-11-04). Plan from OSM ways
 * 32530598, 377159256, 864351026-7, rotated. Front faces the campus footways to the west-south-west.
 * Local frame: −z toward bearing 253 (the front), x toward bearing 343 (along the slab); origin the plan's bbox centre.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

const WHITE: Rgb = hex('#e9e7e1'), GREEN: Rgb = hex('#8fa58a'), RUST: Rgb = hex('#8a4a32'), GLASS: Rgb = hex('#2e3539')
const BROWN: Rgb = hex('#5a3a2c'), TIMBER: Rgb = hex('#7a4a30'), GROUND: Rgb = hex('#3a3f42'), ROOF: Rgb = hex('#8c8c88')
const stone = surfaceTag('stucco')

// boxes [x0, x1, z0, z1] in the bbox-centre frame, from the OSM rings
const SLAB = [-18.5, 17.4, -14.1, -2.9], LOW = [4, 26.3, -23.6, -6], SOUTH = [-27.2, -15.4, -7.5, 5.7]
const SOUTH_NUB = [-25.4, -18.4, -16.1, -7.5], ANNEX = [-1.9, 20.2, 10.5, 24.8], BRIDGE = [12.9, 20.3, -2.9, 10.5]
const FL = 2.9, LEVELS = 7, GF = 3.4, PARAPET = 0.9, FRAME = 0.5
const BAY = 3.0, WIN_W = 1.5, PANEL_W = 1.1, WIN_H = 1.9, SILL = 0.6
const LOW_H1 = 3.6, LOW_H2 = 3.4, FASCIA = 1.1, LOW_EAVE = 1.2, COL = 0.25, COL_EVERY = 4.5, PIER_EVERY = 2.2
const SOUTH_H = 7, ANNEX_LEVELS = 6, ANNEX_ROOF = 2.6, BRIDGE_Y = 3.4

type Face = '-z' | '+z' | '-x' | '+x'
type Box = number[]
const span = (f: Face, [x0, x1, z0, z1]: Box): [number, number, number] =>
  f === '-z' ? [z0, x0, x1] : f === '+z' ? [z1, x0, x1] : f === '-x' ? [x0, z0, z1] : [x1, z0, z1]

/** the checker face: per bay a window and a coloured panel, the panel side and colour alternating floor by floor */
function checker(out: MeshBuilder, f: Face, b: Box, g: number, levels: number, from = 1): void {
  const [plane, a, c] = span(f, b), n = Math.max(1, Math.floor((c - a - 2 * FRAME) / BAY)), step = (c - a - 2 * FRAME) / n
  for (let s = from; s < levels; s++) {
    const y = g + GF + (s - 1) * FL + SILL
    for (let i = 0; i < n; i++) {
      const t = a + FRAME + step * (i + 0.5), left = (i + s) % 2 === 0
      const w0 = left ? t - (WIN_W + PANEL_W) / 2 + PANEL_W : t - (WIN_W + PANEL_W) / 2
      rectOn(out, f, plane, w0, w0 + WIN_W, y, y + WIN_H, GLASS, 0.05)
      const p0 = left ? w0 - PANEL_W : w0 + WIN_W
      rectOn(out, f, plane, p0, p0 + PANEL_W, y - 0.2, y + WIN_H + 0.2, (i + s) % 3 === 0 ? RUST : GREEN, 0.07)
    }
  }
}

function slab(out: MeshBuilder, g: number): void {
  const [x0, x1, z0, z1] = SLAB, top = g + GF + (LEVELS - 1) * FL
  block(out, x0, x1, z0, z1, g - 0.3, top + PARAPET, WHITE, stone)
  block(out, x0 + 0.6, x1 - 0.6, z0 + 0.6, z1 - 0.6, top + PARAPET, top + PARAPET + 0.05, ROOF)
  // a plant room on the roof
  block(out, -4, 3, z0 + 3, z1 - 3, top + PARAPET, top + PARAPET + 2.4, WHITE, stone)
  checker(out, '-z', SLAB, g, LEVELS)
  checker(out, '+z', SLAB, g, LEVELS)
  // the ends: the north blind end in brown, the south end white with a glazed stair slot
  rectOn(out, '+x', x1, z0 + FRAME, z1 - FRAME, g + GF + 2 * FL, top, BROWN, 0.05)
  rectOn(out, '-x', x0, (z0 + z1) / 2 - 0.8, (z0 + z1) / 2 + 0.8, g + GF, top, GLASS, 0.05)
  // the slab's own ground floor where the low wing does not hide it
  rectOn(out, '-z', z0, x0 + FRAME, LOW[0] - 0.3, g, g + GF - 0.4, GROUND, 0.05)
  rectOn(out, '+z', z1, x0 + FRAME, BRIDGE[0] - 0.3, g + 0.4, g + GF - 0.4, GLASS, 0.05)
}

function lowWing(out: MeshBuilder, g: number): void {
  const [x0, x1, z0, z1] = LOW, y1 = g + LOW_H1, y2 = y1 + LOW_H2, r = 1.4
  // ground floor recessed behind its columns, the upper storey and fascia flush with the outline
  block(out, x0, x1 - r, z0 + r, z1, g - 0.3, y1, GLASS)
  block(out, x0, x1, z0, z1, y1, y2, WHITE, stone)
  block(out, x0, x1 + LOW_EAVE, z0 - LOW_EAVE, z1, y2, y2 + FASCIA, BROWN)
  block(out, x0, x1 + LOW_EAVE - 0.4, z0 - LOW_EAVE + 0.4, z1 - 0.4, y2 + FASCIA, y2 + FASCIA + 0.05, ROOF)
  block(out, x0, x1, z0, z1, y1 - 0.35, y1, WHITE, stone)
  for (let x = x0 + 0.6; x < x1; x += COL_EVERY) block(out, x - COL / 2, x + COL / 2, z0 + 0.3, z0 + 0.3 + COL, g, y1 - 0.35, WHITE, stone)
  for (let z = z0 + 0.6; z < z1; z += COL_EVERY) block(out, x1 - 0.3 - COL, x1 - 0.3, z - COL / 2, z + COL / 2, g, y1 - 0.35, WHITE, stone)
  // upper band: tall windows between brown timber piers, on the front and the north end
  const band = (f: Face, a: number, b: number, plane: number): void => {
    for (let t = a + 0.4; t < b - 0.4; t += PIER_EVERY) {
      rectOn(out, f, plane, t, t + 0.45, y1 + 0.1, y2 - 0.1, TIMBER, 0.08)
      rectOn(out, f, plane, t + 0.6, t + PIER_EVERY - 0.15, y1 + 0.5, y2 - 0.3, GLASS, 0.06)
    }
  }
  band('-z', x0, x1, z0)
  band('+x', z0, z1, x1)
  // the entrance: a brown door panel under the fascia, mid-front
  rectOn(out, '-z', z0 + r, (x0 + x1) / 2 - 2, (x0 + x1) / 2 + 2, g, g + 2.6, BROWN, 0.08)
}

function plainBlock(out: MeshBuilder, b: Box, g: number, h: number, faces: Face[], colour = WHITE): void {
  const [x0, x1, z0, z1] = b
  block(out, x0, x1, z0, z1, g - 0.3, g + h, colour, stone)
  block(out, x0 - 0.15, x1 + 0.15, z0 - 0.15, z1 + 0.15, g + h, g + h + 0.4, WHITE, stone)
  for (const f of faces) {
    const [plane, a, c] = span(f, b), n = Math.max(1, Math.floor((c - a) / BAY))
    for (let s = 0; s * FL + 2.4 < h; s++)
      for (let i = 0; i < n; i++) {
        const t = a + (c - a) * (i + 0.5) / n, y = g + 0.9 + s * FL
        rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y, y + 1.6, GLASS, 0.05)
      }
  }
}

export function maisonInde(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0, top = g + GF + (LEVELS - 1) * FL
  slab(out, g)
  lowWing(out, g)
  plainBlock(out, SOUTH, g, SOUTH_H, ['-x', '+z', '-z'])
  plainBlock(out, SOUTH_NUB, g, SOUTH_H - FL, ['-x', '-z'])
  // the bridge to the annexe, open underneath
  const [bx0, bx1, bz0, bz1] = BRIDGE
  block(out, bx0, bx1, bz0, bz1, g + BRIDGE_Y, top, WHITE, stone)
  checker(out, '-x', BRIDGE, g, LEVELS, 1)
  checker(out, '+x', BRIDGE, g, LEVELS, 1)
  for (const [px, pz] of [[bx0, bz1 - 0.5], [bx1 - 0.5, bz1 - 0.5], [bx0, (bz0 + bz1) / 2], [bx1 - 0.5, (bz0 + bz1) / 2]])
    block(out, px, px + 0.5, pz, pz + 0.5, g, g + BRIDGE_Y, WHITE, stone)
  // the annexe: six storeys of the same checker and a set-back roof storey
  const [ax0, ax1, az0, az1] = ANNEX, ah = GF + (ANNEX_LEVELS - 1) * FL
  block(out, ax0, ax1, az0, az1, g - 0.3, g + ah + PARAPET, WHITE, stone)
  for (const f of ['-x', '+x', '+z', '-z'] as Face[]) checker(out, f, ANNEX, g, ANNEX_LEVELS)
  rectOn(out, '-z', az0, ax0 + 0.5, bx0 - 0.2, g + 0.4, g + GF - 0.4, GLASS, 0.05)
  rectOn(out, '+z', az1, ax0 + 0.5, ax1 - 0.5, g + 0.4, g + GF - 0.4, GLASS, 0.05)
  block(out, ax0 + 1.5, ax1 - 1.5, az0 + 1.5, az1 - 1.5, g + ah + PARAPET, g + ah + PARAPET + ANNEX_ROOF, WHITE, stone)
  rectOn(out, '-x', ax0 + 1.5, az0 + 2, az1 - 2, g + ah + PARAPET + 0.4, g + ah + PARAPET + ANNEX_ROOF - 0.4, GLASS, 0.05)
  rectOn(out, '+x', ax1 - 1.5, az0 + 2, az1 - 2, g + ah + PARAPET + 0.4, g + ah + PARAPET + ANNEX_ROOF - 0.4, GLASS, 0.05)
}
