/**
 * THE FONDATION DES ÉTATS-UNIS of the Cité Universitaire (Pierre Leprince-Ringuet, 1930), on the boulevard Jourdan: a long
 * five-storey range of buff brick with cream rendered bands and dressings, the top storey cream with round-headed windows, under
 * a steep brown tile roof with skylights. Two wings run south from its ends into the campus and a low two-storey pavilion with a
 * balustraded roof terrace stands between them (the salons). Plan from OSM way/52072807, rotated to its axes. Refs: Commons
 * (garden court views, docs/landmarks/refs/citeu/etats-unis/, 2026-11-04).
 * Local frame: x along the garden front (west → east), −z the garden front (bearing 198), origin the OSM outline's vertex mean.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, roof, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { archOn, rectOn } from '../palaces/common.ts'

const BRICK: Rgb = hex('#bb8a66'), CREAM: Rgb = hex('#e9dfc6'), TILE: Rgb = hex('#7d5040'), GLASS: Rgb = hex('#3a4248'), SKY: Rgb = hex('#55606a')
const brick = surfaceTag('brick'), render = surfaceTag('stucco')

// storeys: ground, then four; the top storey rendered cream with arched windows
const G = 4.0, FL = 3.1, LEVELS = 5, EAVES = G + (LEVELS - 1) * FL
const WIN_W = 1.3, WIN_H = 1.9, BAY = 3.3, SUR = 0.18, CORNICE = 0.6
const ROOF_H = 6.5, SKY_N = 14
// the salon pavilion: two storeys and a balustrade
const PAV_H = 7.6, BAL_H = 1.0

/** [x0, x1, z0, z1] in the local frame */
const SPINE: [number, number, number, number] = [-41, 40.5, 7, 18.5]
const WINGS: [number, number, number, number][] = [[-34, -21, -19, 7], [27, 40.5, -19, 7]]
const PAVILION: [number, number, number, number] = [-10, 16, -3, 7]

type Face = '-z' | '+z' | '-x' | '+x'
function faces(x0: number, x1: number, z0: number, z1: number): [Face, number, number, number][] {
  return [['-z', z0, x0, x1], ['+z', z1, x0, x1], ['-x', x0, z0, z1], ['+x', x1, z0, z1]]
}

function range(out: MeshBuilder, y: number, x0: number, x1: number, z0: number, z1: number): void {
  const e = EAVES, top = G + (LEVELS - 2) * FL
  block(out, x0, x1, z0, z1, y, y + top, BRICK, brick)
  block(out, x0 - 0.05, x1 + 0.05, z0 - 0.05, z1 + 0.05, y + top, y + e, CREAM, render)                  // the cream top storey
  block(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, y + G + FL - 0.2, y + G + 2 * FL - 0.9, CREAM, render) // the wide band
  block(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, y + e - CORNICE, y + e, CREAM, render)
  block(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, y, y + 0.8, CREAM, render)
  for (const [f, plane, t0, t1] of faces(x0, x1, z0, z1)) {
    const n = Math.max(1, Math.floor((t1 - t0 - 1.5) / BAY)), step = (t1 - t0) / n
    for (let i = 0; i < n; i++) {
      const t = t0 + step * (i + 0.5)
      for (let s = 0; s < LEVELS; s++) {
        const ys = y + (s === 0 ? 1.2 : G + (s - 1) * FL + 0.6)
        if (s === LEVELS - 1) { archOn(out, f, plane, t, ys - 0.2, WIN_W + 2 * SUR, WIN_H + SUR + 0.4, CREAM, 0.04); archOn(out, f, plane, t, ys, WIN_W, WIN_H + 0.3, GLASS); continue }
        rectOn(out, f, plane, t - WIN_W / 2 - SUR, t + WIN_W / 2 + SUR, ys - SUR, ys + WIN_H + SUR, CREAM, 0.04)
        rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, ys, ys + WIN_H, GLASS, 0.07)
      }
    }
  }
}

export function fondationEtatsUnis(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, yr = y + EAVES
  const [sx0, sx1, sz0, sz1] = SPINE
  range(out, y, sx0, sx1, sz0, sz1)
  roof(out, sx0 - 0.4, sx1 + 0.4, sz0 - 0.4, sz1 + 0.4, yr, ROOF_H, (sz1 - sz0) / 2 + 0.4, (sz1 - sz0) / 2 + 0.4, TILE)
  for (let i = 0; i < SKY_N; i++) {                                                                       // skylights, both slopes
    const x = sx0 + 6 + i * (sx1 - sx0 - 12) / (SKY_N - 1)
    for (const s of [-1, 1]) block(out, x - 0.9, x + 0.9, (sz0 + sz1) / 2 + s * 3.6 - 0.6, (sz0 + sz1) / 2 + s * 3.6 + 0.6, yr + 1.8, yr + 2.2, SKY)
  }
  for (const [x0, x1, z0] of WINGS) {
    range(out, y, x0, x1, z0, sz0)
    roof(out, x0 - 0.4, x1 + 0.4, z0 - 0.4, sz0 + 2, yr, ROOF_H, (x1 - x0) / 2 + 0.4, (x1 - x0) / 2 + 0.4, TILE)
  }
  const [px0, px1, pz0, pz1] = PAVILION
  block(out, px0, px1, pz0, pz1, y, y + PAV_H, BRICK, brick)
  block(out, px0 - 0.2, px1 + 0.2, pz0 - 0.2, pz1 + 0.2, y + PAV_H - 0.5, y + PAV_H, CREAM, render)
  for (const [f, plane, t0, t1] of faces(px0, px1, pz0, pz1)) {
    if (f === '+z') continue
    const n = Math.max(1, Math.floor((t1 - t0) / 3.2)), step = (t1 - t0) / n
    for (let i = 0; i < n; i++) rectOn(out, f, plane, (t0 + step * (i + 0.5)) - 0.8, t0 + step * (i + 0.5) + 0.8, y + 0.6, y + 3.4, GLASS, 0.06)
  }
  // the terrace balustrade: a cream rail on posts round three sides
  for (const [a, b, c, d] of [[px0, px1, pz0, pz0 + 0.3], [px0, px0 + 0.3, pz0, pz1], [px1 - 0.3, px1, pz0, pz1]]) {
    block(out, a, b, c, d, y + PAV_H, y + PAV_H + BAL_H, CREAM, render)
  }
}
