/**
 * THE MAISON DES ÉTUDIANTS CANADIENS (Pierre Leprince-Ringuet, 1926): four storeys of red-rendered brick on a grey
 * ground floor, every window framed in white stone, the second floor with little white balconies, a white cornice
 * and a steep slate mansard with a row of white dormers. A U: a long main block on the Boulevard Jourdan with two
 * wings forward into the campus, the entrance in the courtyard between them under a glazed canopy; a small side
 * annex carrying a pergola terrace, and a stair bay behind.
 * Refs: ciup.fr (docs/landmarks/refs/citeu/canada/, 2026-11-04). Plan from OSM way 52090400, rotated.
 * Local frame: −z toward bearing 199 (the courtyard, the campus), x toward bearing 289; origin the plan's bbox centre.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { hipRoof, rectOn } from '../palaces/common.ts'

const RED: Rgb = hex('#a8393f'), STONE: Rgb = hex('#ece8de'), GLASS: Rgb = hex('#2f363c'), GROUND: Rgb = hex('#8e9294')
const SLATE: Rgb = hex('#4a4e55'), CANOPY: Rgb = hex('#b8c4c8'), DOOR: Rgb = hex('#c0282c'), TIMBER: Rgb = hex('#e4e0d6')
const brick = surfaceTag('brick'), stone = surfaceTag('stucco')

// boxes [x0, x1, z0, z1] in the bbox-centre frame, from the OSM ring
const MAIN = [-20, 26.7, -6.6, 16], WING_W = [15.6, 26.7, -19.2, -6.6], WING_E = [-20, -9, -19, -6.6]
const BACK = [-5.8, 12.5, 16, 19.2], ANNEX = [-26.7, -20, -3.6, -0.3]
const FL = 3.1, LEVELS = 4, GF = 3.6, CORNICE = 0.5
const ROOF_H = 4.2, DORMER_W = 1.3, DORMER_H = 1.5, DORMER_EVERY = 2
const WIN_W = 1.2, WIN_H = 1.6, SILL = 0.8, FR = 0.18, BAY = 3.0, BALC_LEVEL = 2, BALC_D = 0.5
const ANNEX_H = 7, CANOPY_W = 14, CANOPY_D = 2.5, CANOPY_Y = 3.2

type Face = '-z' | '+z' | '-x' | '+x'
type Box = number[]

function face(out: MeshBuilder, f: Face, plane: number, a: number, b: number, g: number): void {
  const n = Math.max(1, Math.floor((b - a) / BAY)), step = (b - a) / n, top = g + GF + (LEVELS - 1) * FL
  const out1 = f === '-z' || f === '-x' ? -1 : 1
  rectOn(out, f, plane, a + 0.05, b - 0.05, g, g + GF, GROUND, 0.03)
  for (let i = 0; i < n; i++) {
    const t = a + step * (i + 0.5)
    for (let s = 0; s < LEVELS; s++) {
      const y = g + (s === 0 ? 0.6 : GF + (s - 1) * FL + SILL), h = s === 0 ? 2.2 : WIN_H
      if (s > 0) rectOn(out, f, plane, t - WIN_W / 2 - FR, t + WIN_W / 2 + FR, y - FR, y + h + FR, STONE, 0.05)
      rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y, y + h, GLASS, 0.07)
      if (s === BALC_LEVEL) {
        const w = WIN_W / 2 + 0.35, d = out1 * BALC_D
        if (f === '-z' || f === '+z') block(out, t - w, t + w, Math.min(plane, plane + d), Math.max(plane, plane + d), y - 0.25, y + 0.55, STONE, stone)
        else block(out, Math.min(plane, plane + d), Math.max(plane, plane + d), t - w, t + w, y - 0.25, y + 0.55, STONE, stone)
      }
    }
    // dormers on the mansard, set back a little from the cornice
    if (i % DORMER_EVERY === 0) {
      const dz = out1 * -0.9, p0 = plane + dz, w = DORMER_W / 2, y0 = top + CORNICE
      if (f === '-z' || f === '+z') block(out, t - w, t + w, Math.min(p0, p0 - dz * 0.9), Math.max(p0, p0 - dz * 0.9), y0, y0 + DORMER_H, STONE, stone)
      else block(out, Math.min(p0, p0 - dz * 0.9), Math.max(p0, p0 - dz * 0.9), t - w, t + w, y0, y0 + DORMER_H, STONE, stone)
      rectOn(out, f, p0, t - w + 0.25, t + w - 0.25, y0 + 0.2, y0 + DORMER_H - 0.25, GLASS, 0.02)
    }
  }
}

function wing(out: MeshBuilder, [x0, x1, z0, z1]: Box, g: number, faces: Face[]): void {
  const top = g + GF + (LEVELS - 1) * FL
  block(out, x0, x1, z0, z1, g - 0.3, top, RED, brick)
  block(out, x0 - 0.25, x1 + 0.25, z0 - 0.25, z1 + 0.25, top, top + CORNICE, STONE, stone)
  hipRoof(out, x0, x1, z0, z1, top + CORNICE, ROOF_H, SLATE, 0.05)
  for (const f of faces) {
    if (f === '-z') face(out, f, z0, x0, x1, g)
    if (f === '+z') face(out, f, z1, x0, x1, g)
    if (f === '-x') face(out, f, x0, z0, z1, g)
    if (f === '+x') face(out, f, x1, z0, z1, g)
  }
}

export function maisonCanada(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  wing(out, MAIN, g, ['+z', '-x', '+x'])
  // the courtyard face of the main block, between the wings
  face(out, '-z', MAIN[2], WING_E[1], WING_W[0], g)
  wing(out, WING_W, g, ['-z', '+x', '-x'])
  wing(out, WING_E, g, ['-z', '-x', '+x'])
  wing(out, BACK, g, ['+z'])
  // the entrance canopy and red door, centred in the courtyard
  const cx = (WING_E[1] + WING_W[0]) / 2, cz = MAIN[2]
  block(out, cx - CANOPY_W / 2, cx + CANOPY_W / 2, cz - CANOPY_D, cz, g + CANOPY_Y, g + CANOPY_Y + 0.35, CANOPY, stone)
  rectOn(out, '-z', cz, cx - 1.4, cx + 1.4, g, g + 2.6, DOOR, 0.09)
  // the low side annex with its pergola terrace
  const [ax0, ax1, az0, az1] = ANNEX
  block(out, ax0, ax1, az0, az1, g - 0.3, g + ANNEX_H, RED, brick)
  block(out, ax0 - 0.2, ax1, az0 - 0.2, az1 + 0.2, g + ANNEX_H, g + ANNEX_H + 0.3, STONE, stone)
  for (const [px, pz] of [[ax0, az0], [ax0, az1], [ax0, (az0 + az1) / 2], [ax1 - 0.3, az0], [ax1 - 0.3, az1]])
    block(out, px, px + 0.3, pz - 0.15, pz + 0.15, g + ANNEX_H + 0.3, g + ANNEX_H + 2.6, TIMBER, stone)
  for (let z = az0; z <= az1; z += 1.2) block(out, ax0, ax1, z - 0.08, z + 0.08, g + ANNEX_H + 2.6, g + ANNEX_H + 2.8, TIMBER, stone)
  // a chimney on the main ridge
  block(out, 6, 7.2, 4, 5.2, g + GF + (LEVELS - 1) * FL, g + GF + (LEVELS - 1) * FL + CORNICE + ROOF_H + 1, RED, brick)
}
