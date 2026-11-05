/**
 * The EUROPEAN BUSINESS SCHOOL building on the west side of the Stade Charléty (OSM way/62373992, building=stadium,
 * 8 levels, about 153 × 23 m): a long, skinny block of glass and metal along the avenue. Glass curtain wall in
 * floor bands, slim metal mullions and spandrels, a recessed dark ground floor and a metal roof parapet.
 * Heights from OSM's levels; the rest is tunable below.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { towerRing } from '../../tower.ts'
import { groundMid } from './bowl.ts'
import { edgesOf, pier, sheet, walls } from './shell.ts'

const GLASS: Rgb = [0.24, 0.34, 0.42]
const GLASS_LO: Rgb = [0.1, 0.14, 0.18]
const METAL: Rgb = [0.72, 0.74, 0.76]
const METAL_DK: Rgb = [0.42, 0.44, 0.46]
const ROOF: Rgb = [0.5, 0.51, 0.52]

const FLOOR = 3.4 // storey height, m
const BASE = 4.2 // the ground floor, taller and recessed
const SPANDREL = 0.55 // metal band at each floor line
const MULLION = 1.5 // mullion pitch
const FIN = 6 // a deeper metal fin every this many metres
const PARAPET = 1.0

export function europeanBusinessSchool(out: MeshBuilder, fit: Fit): void {
  const glass = surfaceTag('glass')
  const metal = surfaceTag('metal')
  const g = groundMid(fit)
  const ring = towerRing(fit)
  const floors = Math.max(2, Math.round((fit.height - BASE - PARAPET) / FLOOR))
  const top = g + BASE + floors * FLOOR

  walls(out, ring, g - 0.5, top, GLASS, glass)
  capPolygon(out, ring, top, ROOF, metal)
  for (const e of edgesOf(ring)) {
    if (e.L < 1.5) continue
    // dark recessed ground floor under a deep metal band
    sheet(out, e, 0, e.L, g, g + BASE - 0.6, 0.02, GLASS_LO, glass)
    sheet(out, e, 0, e.L, g + BASE - 0.6, g + BASE, 0.12, METAL_DK, metal)
    // floor spandrels
    for (let i = 1; i <= floors; i++) {
      const y = g + BASE + i * FLOOR
      sheet(out, e, 0, e.L, y - SPANDREL, y, 0.06, METAL, metal)
    }
    // the parapet
    sheet(out, e, 0, e.L, top, top + PARAPET, 0, METAL, metal)
    if (e.L < 4) continue
    // mullions and fins
    const n = Math.floor(e.L / MULLION)
    const finEvery = Math.max(1, Math.round(FIN / MULLION))
    for (let i = 1; i < n; i++) {
      const t = (e.L * i) / n
      const isFin = i % finEvery === 0
      pier(out, e, t, isFin ? 0.3 : 0.08, isFin ? 0.45 : 0.08, g + BASE, top, isFin ? METAL : METAL_DK, metal)
    }
  }
}
