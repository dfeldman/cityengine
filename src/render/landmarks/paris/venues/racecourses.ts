/**
 * The Bois de Boulogne's racecourses:
 *
 * - LONGCHAMP's 2018 GRANDSTAND (Dominique Perrault; Wikipedia fr "Hippodrome de Longchamp": a 160 m building of the
 *   "Nouvel Hippodrome"): a stack of thin horizontal trays over the track, each floor reaching further out than the
 *   one below, bronze soffits and glass balustrades, terracotta seats on the low rake in front, yellow stair cores
 *   through the stack, and on top the glazed panoramic box cantilevered far out past the north end (Commons: "Paris
 *   Longchamp©Dominique Perrault architecte Adagp (2).jpg", "PHOTO HIPPODROME DE LONGCHAMP Paris 2018 DOMINIQUE PERRAULT
 *   ARCHITECTURE DESIGN 2.jpg"). OSM way/584395763 (152 × 30 m, along bearing 21); the track lies east, so front 111;
 *   the cantilever is at local +x (bearing 21, the north end, as in the photograph from the track).
 * - AUTEUIL's GRANDSTANDS of 1924 (Wikipedia fr: "de nouvelles tribunes … inaugurées en 1924"; Commons: "Tribune
 *   hippodrome d'Auteuil - panoramio.jpg"): two tiers of seats over an arcade of round arches, the upper tier under a
 *   cantilevered concrete canopy on a row of square piers, the stair pavilions at the ends a storey higher with their
 *   attics. Four stands in a row along bearing 25, facing the steeplechase course to the west-north-west (front 296).
 *
 * Local frames: front −z (the manifest's `front` turns it), y up from the model's base.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { quadN } from './bowl.ts'

/* ----------------------------------------------------------------------------------------- Longchamp, Perrault 2018 */

export function longchampGrandstand(out: MeshBuilder, fit: Fit): void {
  const met = surfaceTag('metal')
  const gl = surfaceTag('glass')
  const con = surfaceTag('concrete')
  const hx = Math.min(Math.max(fit.hx, 50), 82)
  const hz = Math.min(Math.max(fit.hz, 10), 17)
  const g = fit.grade ?? 0.5
  const WHITE: Rgb = [0.86, 0.86, 0.84]
  const BRONZE: Rgb = [0.62, 0.48, 0.3]
  const YELLOW: Rgb = [0.86, 0.72, 0.28]
  const GLASS: Rgb = [0.32, 0.4, 0.44]
  const SEAT: Rgb = [0.72, 0.4, 0.26]
  // the glazed body behind the trays, the full height of the stack
  const zb0 = -hz + 9, zb1 = hz
  box(out, 0, g + 10, (zb0 + zb1) / 2, hx - 6, 10, (zb1 - zb0) / 2, GLASS, gl)
  // the back to the Route des Tribunes: bronze louvres over the glass, every 1.5 m
  for (let x = -hx + 6; x <= hx - 6 + 0.01; x += 1.5) box(out, x, g + 10, hz + 0.15, 0.08, 10, 0.15, BRONZE, met)
  // the low rake of seats in front, terracotta, with its aisles
  const r0 = -hz, r1 = zb0
  const rows = 14
  for (let i = 0; i < rows; i++) {
    const z0 = r0 + ((r1 - r0) * i) / rows, z1 = r0 + ((r1 - r0) * (i + 1)) / rows
    const y = g + 0.6 + 0.42 * i
    box(out, 0, (g - 0.3 + y + 0.21) / 2, (z0 + z1) / 2, hx - 10, (y + 0.21 - g + 0.3) / 2, (z1 - z0) / 2, [0.7, 0.7, 0.68], con)
    box(out, 0, y + 0.3, z0 + 0.25, hx - 10.1, 0.12, 0.2, SEAT, 0)
  }
  // the trays: each floor further out over the track than the one below, bronze underneath, glass balustrade on the lip
  const trays: [number, number, number, number][] = [
    // y, front z, x0, x1
    [g + 7.4, -hz + 2.5, -hx + 4, hx - 2],
    [g + 11.2, -hz + 0.5, -hx + 2, hx],
    [g + 15.0, -hz - 2.0, -hx + 1, hx + 2],
    [g + 19.0, -hz - 4.5, -hx * 0.55, hx + 6],
  ]
  for (const [y, zf, x0, x1] of trays) {
    box(out, (x0 + x1) / 2, y, (zf + zb1) / 2, (x1 - x0) / 2, 0.35, (zb1 - zf) / 2, WHITE, con)
    quadN(out, [[x0, y - 0.36, zf], [x1, y - 0.36, zf], [x1, y - 0.36, zb0], [x0, y - 0.36, zb0]], [0, -1, 0], BRONZE, met)
    quadN(out, [[x0, y + 0.36, zf + 0.05], [x1, y + 0.36, zf + 0.05], [x1, y + 1.4, zf + 0.05], [x0, y + 1.4, zf + 0.05]], [0, 0, -1], [0.55, 0.65, 0.68], gl)
    strut(out, [x0, y + 1.4, zf + 0.05], [x1, y + 1.4, zf + 0.05], 0.08, 0.08, [0.75, 0.75, 0.75], met, false)
    // the glazed floor behind each lip, set back
    box(out, (x0 + x1) / 2, y + 2, (zf + 4 + zb0) / 2 + 1, (x1 - x0) / 2 - 1, 1.6, Math.max(0.5, (zb0 - zf - 4) / 2), GLASS, gl)
  }
  // the yellow stair cores through the stack
  for (const x of [-hx * 0.62, -hx * 0.12, hx * 0.38]) box(out, x, g + 10.5, zb0 + 2.5, 3.2, 10.5, 2.6, YELLOW, con)
  // the panoramic box on top: glazed, slender raking struts, the thin roof plate, all cantilevered past the north end
  const bx0 = -hx * 0.45, bx1 = hx + 14
  const by = g + 19.4, bt = g + 24.6
  box(out, (bx0 + bx1) / 2, (by + bt) / 2, (-hz - 3 + zb1) / 2, (bx1 - bx0) / 2 - 0.5, (bt - by) / 2, (zb1 + hz + 3) / 2 - 0.5, GLASS, gl)
  box(out, (bx0 + bx1) / 2, bt + 0.4, (-hz - 6 + zb1 + 1) / 2, (bx1 - bx0) / 2 + 1, 0.4, (zb1 + 1 + hz + 6) / 2, WHITE, con)
  quadN(out, [[bx0 - 1, bt - 0.01, -hz - 6], [bx1 + 1, bt - 0.01, -hz - 6], [bx1 + 1, bt - 0.01, zb1 + 1], [bx0 - 1, bt - 0.01, zb1 + 1]], [0, -1, 0], BRONZE, met)
  // the underside of the cantilever, a deep bronze wedge
  quadN(out, [[hx - 6, g + 19.0 - 0.36, -hz - 4.5], [bx1, by, -hz - 3], [bx1, by, zb1], [hx - 6, g + 19.0 - 0.36, zb1]], [0, -1, 0], BRONZE, met)
  for (let x = bx0 + 2; x <= bx1 - 1; x += 4) strut(out, [x, by, -hz - 2.6], [x + 2, bt, -hz - 2.6], 0.12, 0.12, [0.25, 0.25, 0.25], met, false)
}

/* ---------------------------------------------------------------------------------------- Auteuil, the 1924 stands */

export function auteuilStand(out: MeshBuilder, fit: Fit): void {
  const con = surfaceTag('concrete')
  const hx = Math.min(Math.max(fit.hx, 15), 55)
  const hz = Math.min(Math.max(fit.hz, 5), 12)
  const g = fit.grade ?? 0.5
  const CONC: Rgb = [0.74, 0.7, 0.62]
  const DARK: Rgb = [0.24, 0.24, 0.23]
  const SEAT: Rgb = [0.6, 0.58, 0.54]
  const ex = hx - 4                       // the end pavilions' inner face
  const zf = -hz, zb = hz
  // the arcade storey: a wall of round arches to the track, the lower tier's rake over it
  box(out, 0, g + 3.5, (zf + 2 + zb) / 2, ex, 3.5, (zb - zf - 2) / 2, CONC, con)
  const n = Math.max(4, Math.round((2 * ex) / 4.2))
  for (let i = 0; i < n; i++) {
    const x = -ex + ((i + 0.5) * 2 * ex) / n
    box(out, x, g + 3.8, zf + 1.95, 1.3, 1.2, 0.05, DARK, 0)
    for (let k = 0; k < 5; k++) {
      const a0 = -Math.PI / 2 + (k / 5) * Math.PI, a1 = -Math.PI / 2 + ((k + 1) / 5) * Math.PI
      quadN(out, [[x, g + 5, zf + 1.94], [x + Math.sin(a0) * 1.3, g + 5 + Math.cos(a0) * 1.3, zf + 1.94], [x + Math.sin(a1) * 1.3, g + 5 + Math.cos(a1) * 1.3, zf + 1.94], [x, g + 5, zf + 1.94]], [0, 0, -1], DARK)
    }
  }
  // the lower tier: rows of seats stepping up from the lawn's edge to the upper deck
  const rows = 6
  for (let i = 0; i < rows; i++) {
    const z0 = zf - 3 + (4.5 * i) / rows
    const top = g + 0.4 + 0.38 * i
    box(out, 0, (g - 0.3 + top) / 2, z0 + 0.375, ex, (top - g + 0.3) / 2, 0.375, SEAT, con)
  }
  // the upper deck: its slab with the balustrade on its lip, the second rake, the back wall with its windows
  const uy = g + 7
  box(out, 0, uy, (zf - 0.8 + zb) / 2, ex, 0.3, (zb - zf + 0.8) / 2, CONC, con)
  box(out, 0, uy + 0.75, zf - 0.75, ex, 0.45, 0.12, CONC, con)
  for (let i = 0; i < 7; i++) box(out, 0, uy + 0.6 + 0.5 * i, zf + 0.6 + i * 1.1, ex - 0.2, 0.3 + 0.0, 0.5, SEAT, con)
  box(out, 0, uy + 4.5, zb - 1.2, ex, 4.5, 1.2, CONC, con)
  for (let i = 0; i < n; i++) {
    const x = -ex + ((i + 0.5) * 2 * ex) / n
    box(out, x, uy + 5.6, zb - 2.45, 1.0, 1.3, 0.05, DARK, 0)
  }
  // the back, to the road: pilasters every bay, two rows of windows, the doors at ground level
  for (let i = 0; i < n; i++) {
    const x = -ex + ((i + 0.5) * 2 * ex) / n
    box(out, x - ex / n, (g + uy + 9) / 2, zb + 0.15, 0.3, (uy + 9 - g) / 2, 0.15, [0.66, 0.62, 0.55], con)
    box(out, x, g + 2.2, zb + 0.04, 0.9, 1.4, 0.05, DARK, 0)
    box(out, x, g + 5.4, zb + 0.04, 0.8, 0.9, 0.05, DARK, 0)
    box(out, x, uy + 4.4, zb + 0.04, 0.8, 1.6, 0.05, DARK, 0)
  }
  box(out, 0, uy + 9.3, zb + 0.2, ex, 0.3, 0.3, [0.66, 0.62, 0.55], con)
  // the canopy: square piers along the deck's front third, the thin cantilevered slab over the upper tier
  const cy = g + 14.6
  for (let i = 0; i <= Math.round(n / 2); i++) {
    const x = -ex + (i * 2 * ex) / Math.round(n / 2)
    box(out, x, (uy + cy) / 2, zb - 3.2, 0.35, (cy - uy) / 2, 0.35, CONC, con)
  }
  box(out, 0, cy + 0.25, (zf - 1.5 + zb) / 2, ex + 0.3, 0.25, (zb - zf + 1.5) / 2, CONC, con)
  box(out, 0, cy - 0.3, zf - 1.3, ex + 0.3, 0.35, 0.2, CONC, con)
  // the end pavilions: a storey above the canopy, an attic and a cornice
  for (const s of [-1, 1]) {
    const px = s * (ex + 2)
    box(out, px, g + 8.6, 0, 2.2, 8.6, hz + 0.3, CONC, con)
    box(out, px, g + 17.7, 0, 2.5, 0.5, hz + 0.6, [0.66, 0.62, 0.55], con)
    box(out, px, g + 18.8, 0, 1.8, 0.6, hz - 1.5, CONC, con)
    for (const y of [g + 2.5, g + 7.5, g + 11.5]) box(out, px, y, zf - 0.32, 0.8, 1.4, 0.05, DARK, 0)
  }
}

/** one name per stand (a builder named by two entries reads as a dead duplicate to the audits) */
export const AUTEUIL = { auteuilStandA: auteuilStand, auteuilStandB: auteuilStand, auteuilStandC: auteuilStand, auteuilStandD: auteuilStand }
