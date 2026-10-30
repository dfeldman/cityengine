/**
 * The PISCINE MOLITOR (Lucien Pollet, 1929; demolished but for the east wall in 2012 and rebuilt to its old form, reopened
 * 2014 as a hotel and club: Wikipedia fr), at the Porte Molitor. OSM: relation/3950441, a wedge 146 × 55 m with one
 * courtyard, the summer pool.
 *
 * "Le paquebot blanc", which outside is painted its first "tango" yellow again:
 * - from the street (Commons "Hôtel Piscine Molitor"): yellow walls under dark brown bands and a dark cornice, the name
 *   MOLITOR high on the block at Rue Nungesser-et-Coli, 13, where the door is;
 * - from above, and through the gaps: the SUMMER POOL (46 m since 2014), turquoise in its pale deck, walled by three
 *   tiers of galleries with white railings and blue cabin doors, the liner's look of the place (Commons "Piscine Molitor,
 *   Paris, France", the 1930s photograph);
 * - the winter pool's long glass roof over the wedge's east half (Wikipedia fr: Barillet's glass roof over a 33 m pool).
 *
 * The heights (13 m, 16 m at the entrance block) are estimated from the photographs. Local −z faces south to the Avenue de la
 * Porte Molitor (`front` 163), +x east; the entrance block is at −x. The hole and the pool are OSM's, in this frame.
 */
import { capPolygonWithHoles, type MeshBuilder } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { signText } from '../../parts.ts'
import { ccw, plan } from '../museums/shapes.ts'
import { towerRing } from '../../tower.ts'
import { groundMid, quadN } from './bowl.ts'
import { clamp, edgesOf, row, sheet, walls } from './shell.ts'

const HX = 73.1
const HZ = 27.8
const COURT: [number, number][] = [[-58, -10], [-40, 16], [-33, 18], [10, 3], [7, -18], [-54, -18]]

const YELLOW: Rgb = [0.93, 0.68, 0.17]
const YELLOW_DK: Rgb = [0.82, 0.58, 0.14]
const BROWN: Rgb = [0.2, 0.15, 0.12]
const GLASS: Rgb = [0.16, 0.2, 0.24]
const WHITE: Rgb = [0.93, 0.93, 0.9]
const CABIN: Rgb = [0.1, 0.42, 0.66]
const DECK: Rgb = [0.83, 0.8, 0.72]
const WATER: Rgb = [0.18, 0.66, 0.74]
const WATER2: Rgb = [0.22, 0.72, 0.78]
const ROOF: Rgb = [0.56, 0.54, 0.5]
const GLAZE: Rgb = [0.56, 0.72, 0.78]

export function piscineMolitor(out: MeshBuilder, fit: Fit): void {
  const stucco = surfaceTag('stucco')
  const conc = surfaceTag('concrete')
  const glass = surfaceTag('glass')
  const metal = surfaceTag('metal')
  const sx = fit.hx / HX
  const sz = fit.hz / HZ
  const g = groundMid(fit)
  const H = g + clamp(fit.height, 10, 15)
  const ring = towerRing(fit)
  const court = ccw(plan(COURT, sx, sz))
  const levels = 3
  const fl = (H - g) / levels

  // ---- the yellow outer walls: a dark band over the ground floor, windows in rows, the dark cornice
  walls(out, ring, g - 0.5, H, YELLOW, stucco)
  for (const e of edgesOf(ring)) {
    if (e.L < 5) continue
    sheet(out, e, 0.1, e.L - 0.1, g + fl - 0.5, g + fl + 0.15, 0.35, BROWN, conc)
    sheet(out, e, 0.1, e.L - 0.1, H - 0.5, H + 0.3, 0.45, BROWN, conc)
    row(out, e, g + 1, fl - 2, 3.8, 2.2, 0.06, GLASS, glass, 1.5)
    for (let l = 1; l < levels; l++) {
      row(out, e, g + l * fl + 0.8, fl - 1.9, 3.8, 2, 0.06, GLASS, glass, 1.5)
      row(out, e, g + l * fl + 0.64, 0.16, 3.8, 2.4, 0.12, YELLOW_DK, stucco, 1.5)
    }
  }

  // ---- the roof round the court, a parapet of railing round the court's edge
  capPolygonWithHoles(out, [ring, [...court].reverse()], H, ROOF, conc)

  // ---- the court's walls, facing in: white, three tiers of blue doors behind gallery slabs and white rails
  const inside = [...court].reverse()
  walls(out, inside, g - 0.5, H, WHITE, stucco)
  for (const e of edgesOf(inside)) {
    for (let l = 0; l < levels; l++) {
      const y = g + l * fl
      row(out, e, y + 0.2, fl - 1.1, 2.1, 1.4, 0.06, CABIN, conc, 0.6)
      if (l > 0) {
        // the gallery slab and its rail
        sheet(out, e, 0.4, e.L - 0.4, y - 0.14, y + 0.08, 1.9, WHITE, conc)
        quadN(out, [[e.a.x + e.nx * 1.9, y + 0.08, e.a.z + e.nz * 1.9], [e.b.x + e.nx * 1.9, y + 0.08, e.b.z + e.nz * 1.9], [e.b.x, y + 0.08, e.b.z], [e.a.x, y + 0.08, e.a.z]], [0, 1, 0], DECK, conc)
        sheet(out, e, 0.4, e.L - 0.4, y + 0.12, y + 1.05, 1.95, WHITE, conc)
        row(out, e, y - 0.14, 0.22, 4.2, 0.4, 1.0, WHITE, conc, 0.6)
      }
    }
    sheet(out, e, 0, e.L, H - 0.1, H + 0.9, 0.04, WHITE, conc)
  }

  // ---- the deck and the pool: 46 m, its pale rim, a lighter shallow end
  capPolygonWithHoles(out, [court], g + 0.2, DECK, conc)
  const x0 = -48 * sx
  const x1 = -2 * sx
  const z0 = -14 * sz
  const z1 = 6 * sz
  const flat = (a: number, b: number, c: number, d: number, y: number, col: Rgb, tag = 0): void => quadN(out, [[a, y, c], [b, y, c], [b, y, d], [a, y, d]], [0, 1, 0], col, tag)
  flat(x0 - 1, x1 + 1, z0 - 1, z1 + 1, g + 0.26, WHITE, conc)
  flat(x0, x1, z0, z1, g + 0.3, WATER, glass)
  flat(x0, x0 + (x1 - x0) * 0.32, z0, z1, g + 0.32, WATER2, glass)
  // the rows of loungers along the deck
  for (let i = 0; i < 12; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / 12
    box(out, x, g + 0.5, z0 - 2.4, 0.4, 0.14, 0.95, WHITE, conc)
  }

  // ---- the winter pool's long glass roof over the east half: a ridge along the wedge, white bars
  const rx0 = 16 * sx
  const rx1 = 50 * sx
  const rz0 = -21 * sz
  const rz1 = -1 * sz
  const ridge = H + 4
  const zm = (rz0 + rz1) / 2
  box(out, (rx0 + rx1) / 2, H + 0.45, zm, (rx1 - rx0) / 2 + 0.5, 0.45, (rz1 - rz0) / 2 + 0.5, WHITE, conc)
  for (const [zEdge, s] of [[rz0, -1], [rz1, 1]] as [number, number][]) {
    quadN(out, [[rx0, H + 0.9, zEdge], [rx1, H + 0.9, zEdge], [rx1, ridge, zm], [rx0, ridge, zm]], [0, 0.7, s], GLAZE, glass)
    for (let i = 0; i <= 12; i++) {
      const x = rx0 + ((rx1 - rx0) * i) / 12
      quadN(out, [[x - 0.1, H + 0.95, zEdge], [x + 0.1, H + 0.95, zEdge], [x + 0.1, ridge + 0.05, zm], [x - 0.1, ridge + 0.05, zm]], [0, 0.7, s], WHITE, metal)
    }
  }
  for (const x of [rx0, rx1]) quadN(out, [[x, H + 0.9, rz0], [x, H + 0.9, rz1], [x, ridge, zm], [x, ridge, zm]], [x === rx0 ? -1 : 1, 0, 0], GLAZE, glass)
  box(out, (rx0 + rx1) / 2, ridge + 0.1, zm, (rx1 - rx0) / 2, 0.15, 0.2, WHITE, metal)

  // ---- the entrance block at Rue Nungesser-et-Coli: higher, dark-trimmed, the name high on it, the door under a dark canopy
  const bx0 = -HX * sx
  const bx1 = -58 * sx
  const bz0 = -25 * sz
  const bz1 = -10 * sz
  const bTop = H + 3
  const bm = (bx0 + bx1) / 2
  const zb = (bz0 + bz1) / 2
  box(out, bm, (g + bTop) / 2, zb, (bx1 - bx0) / 2, (bTop - g) / 2 + 0.5, (bz1 - bz0) / 2, YELLOW, stucco)
  box(out, bm, bTop + 0.2, zb, (bx1 - bx0) / 2 + 0.35, 0.3, (bz1 - bz0) / 2 + 0.35, BROWN, conc)
  box(out, bm, bTop + 0.54, zb, (bx1 - bx0) / 2 - 0.3, 0.05, (bz1 - bz0) / 2 - 0.3, ROOF, conc)
  // the window strip up the west face, and the name beside it
  const fx = bx0 - 0.08
  box(out, fx, g + 8.8, zb + 3 * sz, 0.05, 4, 1.5, GLASS, glass)
  box(out, bx0 - 1.3, g + fl - 0.2, zb, 1.3, 0.3, (bz1 - bz0) / 2, BROWN, conc)
  box(out, fx, g + 1.7, zb, 0.05, 1.8, 2.2, GLASS, glass)
  signText(out, 'MOLITOR', fx - 0.12, bTop - 2.2, zb - 2.2 * sz, 1.9, BROWN, { heading: -Math.PI / 2 })
}
