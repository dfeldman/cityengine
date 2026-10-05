/**
 * YERBA BUENA ISLAND LIGHT STATION (1873/1875), from the owner's photograph from the water (2026-10-04): high on the
 * island's south cliff, three white buildings with red roofs.
 *
 *  - The tower (way/291189057): SQUARE, white, two storeys of small windows, a railed gallery, a white lantern with
 *    dark glazing under a red cap and a little finial. (The old builder was an octagonal frustum.)
 *  - The fog-signal house (way/291189002), below and in front of it toward the water: a small white gabled house
 *    with a red roof, standing on a long white concrete retaining wall / terrace at the cliff's lip. Front 180:
 *    the water is south, local +z.
 *  - The keeper's house (way/291188942) up the slope behind: a restyle (two storeys of white clapboard under a
 *    steep red cross-gabled roof, the porch along the front) — manifest b12.json.
 *
 * The cliff itself is ground: a `terrain: fine`, `relief: raw` zone over this shore (data/zones, `ybi-light`).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { roof } from '../kit.ts'

const WHITE: Rgb = [0.94, 0.94, 0.92]
const RED: Rgb = [0.7, 0.22, 0.18]
const DARK: Rgb = [0.16, 0.18, 0.2]

export function ybiLightTower(out: MeshBuilder, _fit: Fit): void {
  const st = surfaceTag('clapboard'), metal = surfaceTag('metal')
  const W = 1.9, H = 7.5
  box(out, 0, H / 2, 0, W, H / 2, W, WHITE, st)
  // windows, two storeys, each face
  for (let s = 0; s < 4; s++) {
    const a = (s * Math.PI) / 2, nx = Math.sin(a), nz = Math.cos(a)
    for (const y of [2.2, 5.2]) box(out, nx * (W + 0.02), y, nz * (W + 0.02), Math.abs(nz) * 0.35 + 0.02, 0.55, Math.abs(nx) * 0.35 + 0.02, DARK, 0)
  }
  // the gallery: a slab and its railing
  box(out, 0, H + 0.1, 0, W + 0.5, 0.1, W + 0.5, WHITE, st)
  for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    box(out, sx * (W + 0.45), H + 0.65, sz * (W + 0.45), sx ? 0.03 : W + 0.48, 0.03, sz ? 0.03 : W + 0.48, DARK, metal)
    box(out, sx * (W + 0.45), H + 0.4, sz * (W + 0.45), sx ? 0.02 : W + 0.48, 0.02, sz ? 0.02 : W + 0.48, DARK, metal)
  }
  // the lantern: a low white base, dark glazing, the red cap and the finial
  prism(out, 0, 0, H + 0.2, H + 0.9, 1.15, 8, WHITE, st)
  prism(out, 0, 0, H + 0.9, H + 2.3, 1.05, 8, DARK, surfaceTag('glass'))
  prism(out, 0, 0, H + 2.3, H + 3.2, 1.35, 8, RED, metal, 0.15)
  prism(out, 0, 0, H + 3.2, H + 3.7, 0.08, 6, DARK, metal, 0.02)
}

export function ybiFogSignal(out: MeshBuilder, fit: Fit): void {
  const st = surfaceTag('clapboard'), conc = surfaceTag('concrete')
  const hx = Math.max(2.6, fit.hx), hz = Math.max(3.5, fit.hz)
  // the white retaining wall / terrace it stands on, running out along the cliff lip and down its face
  box(out, 0, -1.5, hz + 1, hx + 9, 2.5, 2.2, WHITE, conc)
  box(out, 0, -0.9, 0, hx + 3, 1.9, hz + 1.5, WHITE, conc)
  // the house: white walls, a red gable roof, windows on the seaward end
  box(out, 0, 1.6, 0, hx, 1.6, hz, WHITE, st)
  roof(out, -hx - 0.3, hx + 0.3, -hz - 0.3, hz + 0.3, 3.2, 1.8, hx + 0.3, 0, RED)
  for (const u of [-0.9, 0.9]) box(out, u, 1.8, hz + 0.02, 0.35, 0.55, 0.03, DARK, 0)
}

export const YBI_LIGHT: Record<string, (out: MeshBuilder, fit: Fit) => void> = { ybiLightTower, ybiFogSignal }
