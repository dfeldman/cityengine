/**
 * THE MARINA BRANCH LIBRARY, 1890 Chestnut Street (1954; OSM way/288394771). The owner, 2026-10-06: "marina branch
 * library needs a custom model" — it was restyled as a classical Carnegie cottage, which it is not. From Mapillary on
 * Chestnut and Webster: a single storey of mid-century modern — red brick walls and piers, a long ribbon of green-
 * tinted glazing on thin mullions along the street, a flat roof slab running out in a deep thin overhang, the
 * entrance under it, brick planters and a paved forecourt before it.
 *
 * Fitted to the outline: local x along it, the street front on +z (manifest `front`).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { sign } from '../signage.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const BRICK: Rgb = [0.5, 0.25, 0.2]
const GLAZING: Rgb = [0.3, 0.42, 0.38]
const MULLION: Rgb = [0.2, 0.22, 0.22]
const SLAB: Rgb = [0.42, 0.41, 0.39]
const SOFFIT: Rgb = [0.62, 0.6, 0.57]

export function marinaLibrary(out: MeshBuilder, fit: Fit): void {
  const brick = surfaceTag('brick'), glass = surfaceTag('glass'), conc = surfaceTag('concrete')
  const L = Math.max(10, fit.hx), W = Math.max(6, fit.hz)
  const H = 3.9
  // the brick box
  box(out, 0, H / 2, 0, L, H / 2, W, BRICK, brick)
  // the street front: a ribbon of glazing over most of it, between brick piers at each end and one at the door
  const g0 = -L + 2.2, g1 = L - 2.2
  out.quad([[g0, 0.7, W + 0.02], [g1, 0.7, W + 0.02], [g1, H - 0.5, W + 0.02], [g0, H - 0.5, W + 0.02]], [0, 0, 1], UV, GLAZING, glass)
  for (let x = g0; x <= g1 + 0.01; x += 1.25) box(out, x, (0.7 + H - 0.5) / 2, W + 0.05, 0.04, (H - 1.2) / 2, 0.04, MULLION, 0)
  box(out, 0, (0.7 + H - 0.5) / 2, W + 0.05, (g1 - g0) / 2, 0.035, 0.04, MULLION, 0)
  box(out, g0 + (g1 - g0) * 0.3, H / 2, W + 0.15, 0.45, H / 2, 0.2, BRICK, brick)
  // the glazing turns the street corners for a bay
  for (const s of [-1, 1]) {
    out.quad([[s * (L + 0.02), 0.7, W - 0.4], [s * (L + 0.02), 0.7, W - 4], [s * (L + 0.02), H - 0.5, W - 4], [s * (L + 0.02), H - 0.5, W - 0.4]], [s, 0, 0], UV, GLAZING, glass)
  }
  // the roof slab, thin, overhanging deep on the street side and a little elsewhere
  const over = 1.8
  box(out, 0, H + 0.15, over / 2 - 0.3, L + 0.6, 0.15, W + over / 2 + 0.3, SLAB, conc)
  out.quad([[-L - 0.6, H - 0.01, W + over], [L + 0.6, H - 0.01, W + over], [L + 0.6, H - 0.01, W], [-L - 0.6, H - 0.01, W]], [0, -1, 0], UV, SOFFIT, conc)
  // the entrance: glass doors under the overhang, by the pier
  const dx = g0 + (g1 - g0) * 0.3 + 1.6
  box(out, dx, 1.15, W + 0.08, 0.9, 1.15, 0.04, [0.15, 0.17, 0.18], glass)
  sign(out, { type: 'flat', text: 'MARINA BRANCH LIBRARY', h: 0.28, face: 'grotesque', colour: [0.95, 0.94, 0.9], lit: 'none' },
    { x: g0 + (g1 - g0) * 0.62, y: H + 0.15, z: W + over + 0.32, heading: 0 })
  // brick planters along the forecourt
  for (const x of [-L * 0.65, L * 0.15, L * 0.7]) {
    box(out, x, 0.35, W + over + 2.5, Math.min(2.4, L * 0.18), 0.35, 0.6, BRICK, brick)
    box(out, x, 0.78, W + over + 2.5, Math.min(2.2, L * 0.16), 0.12, 0.45, [0.3, 0.45, 0.22], 0)
  }
}

export const MARINA_LIBRARY: Record<string, (out: MeshBuilder, fit: Fit) => void> = { marinaLibrary }
