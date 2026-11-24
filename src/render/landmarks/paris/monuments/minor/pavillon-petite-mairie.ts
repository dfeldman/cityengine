import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { hex, pane, roof, shade } from '../../../kit.ts'
import { box } from '../../../../models.ts'
import { surfaceTag } from '../../../../cartoon-material.ts'
import type { Fit } from '../../../fit.ts'

/*
 * LA PETITE MAIRIE (place d'Aligre, Paris 12e; Wikidata Q3377363; OSM way 78146411): the one-storey pavilion in the middle
 * of the square opposite the marché Beauvau: a plain cream rendered box under a flat roof with a low parapet, a grey
 * plinth, and a small clock tower rising from the roof (louvred belfry, clock face on each side, a dark cornice, a
 * pyramidal metal roof). Frame: x across, z along, y up from the ground (fit.grade); the box is the OSM footprint's
 * minimum rectangle (about 6.9 x 7.3 m). Heights are scaled by eye off the Commons photo "Place d'Aligre, la Petite
 * Mairie, Paris 2020", not surveyed; the tower stands in the middle of the roof, which the photo roughly shows.
 */

// tunables (metres)
const PLINTH_H = 0.4, PLINTH_OUT = 0.04
const WALL_H = 3.5                         // top of the wall above the ground
const PARAPET_H = 0.28, PARAPET_OUT = 0.08
const TOWER_HW = 1.0, TOWER_BASE_H = 1.3   // half width; plain shaft up to the clock stage
const CLOCK_H = 1.1                        // the clock stage above it
const BELFRY_H = 1.2, BELFRY_IN = 0.12     // louvred belfry, inset on each side
const CORNICE_H = 0.18, CORNICE_OUT = 0.14
const ROOF_H = 0.85, FINIAL_H = 0.5
const CLOCK_R = 0.42

const STUCCO = surfaceTag('stucco')
/** A solid block from its footprint box and heights, tagged stucco so pale faces stay smooth render. */
function block(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, c: Rgb): void {
  box(out, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, c, STUCCO)
}

const WALL: Rgb = hex('#ece3cd')
const BASE: Rgb = hex('#8a8c8c')
const TRIM: Rgb = hex('#6a6c6e')
const LOUVRE: Rgb = hex('#4a4a48')
const ROOFC: Rgb = hex('#6b6f73')
const CLOCK: Rgb = hex('#f4efe2')

/** A clock face on each side of a tower of half width `hw`, centred at (0, y). */
function clocks(q: MeshBuilder, hw: number, y: number): void {
  const w = CLOCK_R * 2
  for (const face of ['-z', '+z', '-x', '+x'] as const) {
    const plane = face[0] === '-' ? -hw : hw
    pane(q, face, plane, 0, y - CLOCK_R, w, w, CLOCK, 0.03)
    pane(q, face, plane, 0, y - 0.03, CLOCK_R * 1.3, 0.06, LOUVRE, 0.04)
    pane(q, face, plane, 0.0, y, 0.06, CLOCK_R * 0.8, LOUVRE, 0.04)
  }
}

export function pavillonPetiteMairie(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  const hx = fit.hx, hz = fit.hz
  const y = (v: number): number => g + v
  block(out, -hx - PLINTH_OUT, hx + PLINTH_OUT, -hz - PLINTH_OUT, hz + PLINTH_OUT, y(0), y(PLINTH_H), BASE)
  block(out, -hx, hx, -hz, hz, y(PLINTH_H), y(WALL_H), WALL)
  // parapet ring on the roof edge
  block(out, -hx - PARAPET_OUT, hx + PARAPET_OUT, -hz - PARAPET_OUT, hz + PARAPET_OUT, y(WALL_H), y(WALL_H + 0.1), shade(WALL, 0.8))
  const t = 0.18
  block(out, -hx, hx, -hz, -hz + t, y(WALL_H), y(WALL_H + PARAPET_H), WALL)
  block(out, -hx, hx, hz - t, hz, y(WALL_H), y(WALL_H + PARAPET_H), WALL)
  block(out, -hx, -hx + t, -hz + t, hz - t, y(WALL_H), y(WALL_H + PARAPET_H), WALL)
  block(out, hx - t, hx, -hz + t, hz - t, y(WALL_H), y(WALL_H + PARAPET_H), WALL)
  block(out, -hx + t, hx - t, -hz + t, hz - t, y(WALL_H), y(WALL_H + 0.05), ROOFC)
  // tower
  const w = Math.min(TOWER_HW, hx * 0.5, hz * 0.5)
  let y0 = WALL_H + 0.05
  block(out, -w, w, -w, w, y(y0), y(y0 + TOWER_BASE_H), WALL)
  y0 += TOWER_BASE_H
  block(out, -w, w, -w, w, y(y0), y(y0 + CLOCK_H), WALL)
  clocks(out, w, y(y0 + CLOCK_H / 2))
  y0 += CLOCK_H
  block(out, -w - CORNICE_OUT, w + CORNICE_OUT, -w - CORNICE_OUT, w + CORNICE_OUT, y(y0), y(y0 + CORNICE_H), TRIM)
  y0 += CORNICE_H
  const b = w - BELFRY_IN
  block(out, -b, b, -b, b, y(y0), y(y0 + BELFRY_H), WALL)
  for (const face of ['-z', '+z', '-x', '+x'] as const) {
    const plane = face[0] === '-' ? -b : b
    pane(out, face, plane, 0, y(y0 + 0.2), b * 1.1, BELFRY_H - 0.4, LOUVRE, 0.03)
  }
  y0 += BELFRY_H
  block(out, -b - 0.1, b + 0.1, -b - 0.1, b + 0.1, y(y0), y(y0 + 0.1), TRIM)
  y0 += 0.1
  roof(out, -b - 0.1, b + 0.1, -b - 0.1, b + 0.1, y(y0), ROOF_H, b + 0.07, b + 0.07, ROOFC)
  block(out, -0.03, 0.03, -0.03, 0.03, y(y0 + ROOF_H), y(y0 + ROOF_H + FINIAL_H), TRIM)
}
