/**
 * THE MAISON DE NORVÈGE (Reidar Lund, 1969): a six-storey block of dark red-brown brick, heavily ivied, with a low
 * hipped grey roof on deep boarded eaves. An L of two wings: a long slab running NNE and a squarer south block, joined
 * by a short link whose inside corner holds a round brick stair tower rising a little above the eaves. Regular rows of
 * white-framed square windows with white railings. A low entrance porch on the west, toward the campus walk.
 * Refs: Commons (docs/landmarks/refs/citeu/norvege/, 2026-11-04). Plan from OSM way 32530570, rotated.
 * Local frame: −z toward bearing 289 (the entrance side), x toward bearing 19 (along the slab); origin the plan's bbox centre.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { hipRoof, rectOn } from '../palaces/common.ts'

const BRICK: Rgb = hex('#6e3a2e'), IVY: Rgb = hex('#4f6a32'), FRAME: Rgb = hex('#f0eee8'), GLASS: Rgb = hex('#2e3438')
const ROOF: Rgb = hex('#55585c'), SOFFIT: Rgb = hex('#d8d4cc'), BASE: Rgb = hex('#5a3028')
const brick = surfaceTag('brick')

// plan offset (OSM ring centroid → bbox centre), wings as [x0, x1, z0, z1] in the OSM-centroid frame
const OX = 6.9, OZ = 3.5
const SLAB = [-1.3, 31.7, -8.0, 4.0], SOUTH = [-17.9, -2.3, 3.8, 21.8], LINK = [-8.7, -1.3, -8.1, 3.8]
const PORCH = [-6.3, 2.1, -14.8, -8.1], TOWER = [0.2, 6.0], TOWER_R = 2.2
const FL = 2.9, LEVELS = 6, PLINTH = 0.4, PORCH_H = 3.4
const ROOF_H = 2.6, EAVE = 0.9, TOWER_UP = 1.6
const WIN_W = 1.3, WIN_H = 1.35, SILL = 0.85, FR = 0.1, BAY = 3.0
// ivy sheets: fraction of each long face covered, from the bottom up to this level
const IVY_TOP = 5.2

type Face = '-z' | '+z' | '-x' | '+x'
type Box = number[]

function face(out: MeshBuilder, f: Face, plane: number, a: number, b: number, g: number, ivy: boolean): void {
  const n = Math.max(1, Math.floor((b - a) / BAY)), step = (b - a) / n
  if (ivy) rectOn(out, f, plane, a + 0.6, b - 0.6, g + PLINTH + 1.2, g + PLINTH + IVY_TOP * FL, IVY, 0.03)
  for (let i = 0; i < n; i++) {
    const t = a + step * (i + 0.5)
    for (let s = 0; s < LEVELS; s++) {
      const y = g + PLINTH + s * FL + SILL
      rectOn(out, f, plane, t - WIN_W / 2 - FR, t + WIN_W / 2 + FR, y - FR, y + WIN_H + FR, FRAME, 0.05)
      rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y, y + WIN_H, GLASS, 0.07)
    }
  }
}

function wing(out: MeshBuilder, [x0, x1, z0, z1]: Box, g: number, faces: Face[], ivy: Face[]): void {
  const top = g + PLINTH + LEVELS * FL
  block(out, x0, x1, z0, z1, g - 0.3, g + PLINTH, BASE, brick)
  block(out, x0, x1, z0, z1, g + PLINTH, top, BRICK, brick)
  block(out, x0 - EAVE, x1 + EAVE, z0 - EAVE, z1 + EAVE, top - 0.1, top + 0.15, SOFFIT, brick)
  hipRoof(out, x0, x1, z0, z1, top + 0.15, ROOF_H, ROOF, EAVE)
  for (const f of faces) {
    const v = ivy.includes(f)
    if (f === '-z') face(out, f, z0, x0, x1, g, v)
    if (f === '+z') face(out, f, z1, x0, x1, g, v)
    if (f === '-x') face(out, f, x0, z0, z1, g, v)
    if (f === '+x') face(out, f, x1, z0, z1, g, v)
  }
}

const sh = (b: Box): Box => [b[0] - OX, b[1] - OX, b[2] - OZ, b[3] - OZ]

export function maisonNorvege(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0, top = g + PLINTH + LEVELS * FL
  wing(out, sh(SLAB), g, ['-z', '+z', '+x'], ['-z', '+z'])
  wing(out, sh(SOUTH), g, ['-x', '+x', '+z', '-z'], ['+z', '-x'])
  wing(out, sh(LINK), g, ['-z'], [])
  // the low entrance porch, flat-roofed, glazed front
  const [px0, px1, pz0, pz1] = sh(PORCH)
  block(out, px0, px1, pz0, pz1, g - 0.3, g + PORCH_H, BRICK, brick)
  block(out, px0 - 0.4, px1 + 0.4, pz0 - 0.4, pz1, g + PORCH_H, g + PORCH_H + 0.3, SOFFIT, brick)
  rectOn(out, '-z', pz0, px0 + 1, px1 - 1, g, g + 2.6, GLASS, 0.05)
  // the round stair tower in the inside corner, a little above the eaves, under a shallow cap
  const tx = TOWER[0] - OX, tz = TOWER[1] - OZ, N = 10
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, c = TOWER_R * Math.cos(a), s = TOWER_R * Math.sin(a), w = TOWER_R * 0.66
    block(out, tx + c - w / 2, tx + c + w / 2, tz + s - w / 2, tz + s + w / 2, g, top + TOWER_UP, BRICK, brick)
  }
  block(out, tx - TOWER_R * 0.8, tx + TOWER_R * 0.8, tz - TOWER_R * 0.8, tz + TOWER_R * 0.8, g, top + TOWER_UP, BRICK, brick)
  hipRoof(out, tx - TOWER_R, tx + TOWER_R, tz - TOWER_R, tz + TOWER_R, top + TOWER_UP, 0.8, ROOF, 0.3)
}
