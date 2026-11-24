import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, roof, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'

/*
 * LE PAVILLON DE LA REUNION (Jardin d'agronomie tropicale, Paris 12e; Wikidata Q3373069; OSM way 62819542): the
 * "kiosque de la Réunion" of the 1900 Trocadéro exhibition, re-erected here in 1907 and left to decay since: a small
 * two-stage timber pavilion in dark weathered boards, a glazed ground storey under a wide hipped skirt roof, a narrower
 * upper stage with window strips under a shingled hip roof with deep eaves. Frame: −z the front, x across, y up from
 * the ground (fit.grade). Footprint from the OSM way; heights and the stage proportions are read off Commons photographs
 * (Jardin tropical - Paris - Pavillon de la Réunion 01-03), not surveyed.
 */

// tunables (metres)
const PLINTH_H = 0.35, PLINTH_OUT = 0.1
const WALL_IN = 0.25                       // ground-storey wall inset from the footprint
const G_TOP = 3.1                          // top of the ground storey above the ground
const SKIRT_OUT = 0.7, SKIRT_H = 0.75
const UP_IN = 1.05, UP_H = 1.9            // upper stage: inset from the footprint, height
const TOP_OUT = 0.65, TOP_H = 1.5          // top roof overhang, rise
const FINIAL_H = 0.5

const BOARDS: Rgb = hex('#3b2d24')
const FRAME: Rgb = hex('#d8d0be')
const GLASS: Rgb = hex('#566064')
const ROOF: Rgb = hex('#5f5a52')
const STONE: Rgb = hex('#9a9484')

function windowRow(q: MeshBuilder, face: '-z' | '+z' | '-x' | '+x', plane: number, t0: number, t1: number, y0: number, y1: number, n: number): void {
  const w = (t1 - t0) / n
  for (let i = 0; i < n; i++) {
    const a = t0 + i * w + w * 0.12, b = t0 + (i + 1) * w - w * 0.12
    const s = face[0] === '-' ? -1 : 1
    const d = 0.03 * s
    if (face === '-z' || face === '+z') {
      block(q, a - 0.04, b + 0.04, plane + d - 0.02, plane + d + 0.02, y0 - 0.04, y1 + 0.04, FRAME)
      block(q, a, b, plane + d * 1.6 - 0.015, plane + d * 1.6 + 0.015, y0, y1, GLASS)
    } else {
      block(q, plane + d - 0.02, plane + d + 0.02, a - 0.04, b + 0.04, y0 - 0.04, y1 + 0.04, FRAME)
      block(q, plane + d * 1.6 - 0.015, plane + d * 1.6 + 0.015, a, b, y0, y1, GLASS)
    }
  }
}

export function pavillonReunion(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  const hx = fit.hx, hz = fit.hz
  block(out, -hx - PLINTH_OUT, hx + PLINTH_OUT, -hz - PLINTH_OUT, hz + PLINTH_OUT, g, g + PLINTH_H, STONE)
  // ground storey
  const gx = hx - WALL_IN, gz = hz - WALL_IN, y0 = g + PLINTH_H
  block(out, -gx, gx, -gz, gz, y0, g + G_TOP, BOARDS)
  windowRow(out, '-z', -gz, -gx + 0.3, gx - 0.3, y0 + 0.5, g + G_TOP - 0.45, 3)
  windowRow(out, '+z', gz, -gx + 0.3, gx - 0.3, y0 + 0.5, g + G_TOP - 0.45, 3)
  windowRow(out, '-x', -gx, -gz + 0.3, gz - 0.3, y0 + 0.5, g + G_TOP - 0.45, 2)
  windowRow(out, '+x', gx, -gz + 0.3, gz - 0.3, y0 + 0.5, g + G_TOP - 0.45, 2)
  // skirt roof between the stages (a low truncated hip, deep eaves)
  const sx = gx + SKIRT_OUT, sz = gz + SKIRT_OUT
  block(out, -sx, sx, -sz, sz, g + G_TOP, g + G_TOP + 0.08, shade(ROOF, 0.8))
  roof(out, -sx, sx, -sz, sz, g + G_TOP + 0.08, SKIRT_H, sx - (hx - UP_IN) - 0.1, sz - (hz - UP_IN) - 0.1, ROOF)
  // upper stage
  const ux = hx - UP_IN, uz = hz - UP_IN, uy0 = g + G_TOP + 0.08 + SKIRT_H
  block(out, -ux, ux, -uz, uz, uy0, uy0 + UP_H, shade(BOARDS, 1.08))
  windowRow(out, '-z', -uz, -ux + 0.2, ux - 0.2, uy0 + 0.5, uy0 + UP_H - 0.4, 3)
  windowRow(out, '+z', uz, -ux + 0.2, ux - 0.2, uy0 + 0.5, uy0 + UP_H - 0.4, 3)
  windowRow(out, '-x', -ux, -uz + 0.2, uz - 0.2, uy0 + 0.5, uy0 + UP_H - 0.4, 2)
  windowRow(out, '+x', ux, -uz + 0.2, uz - 0.2, uy0 + 0.5, uy0 + UP_H - 0.4, 2)
  // top roof: hip with a short ridge along x
  const ty = uy0 + UP_H, tx = ux + TOP_OUT, tz = uz + TOP_OUT
  block(out, -tx, tx, -tz, tz, ty, ty + 0.08, shade(ROOF, 0.8))
  roof(out, -tx, tx, -tz, tz, ty + 0.08, TOP_H, Math.min(tx * 0.6, tx - 0.4), tz - 0.05, shade(ROOF, 1.05))
  block(out, -0.04, 0.04, -0.04, 0.04, ty + 0.08 + TOP_H, ty + 0.08 + TOP_H + FINIAL_H, BOARDS)
}
