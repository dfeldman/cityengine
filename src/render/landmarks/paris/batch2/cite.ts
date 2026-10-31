/**
 * The two Le Corbusiers of the Cité Internationale (Batch 2, 2026-10-31): the FONDATION SUISSE (Le Corbusier and Jeanneret, 1933) and the MAISON DU BRÉSIL (Le Corbusier and Lucio Costa, 1959). OSM's massing makes either an office block: the point of both is what they stand on. Plans: OSM's outlines (in the entries), the proportions from the aerial
 * (48.8180 2.3430) and Commons; heights from their levels. Local frame by each entry's `front`: −z the glass/loggia face, x along the slab.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { strut } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, prism, shade, type Rgb } from '../../kit.ts'
import { block } from './tag.ts'
import { rectOn } from '../palaces/common.ts'

const CONC: Rgb = hex('#b5b1a4'), CONC_DK: Rgb = hex('#85827a'), RUBBLE: Rgb = hex('#8b806c'), GLASS: Rgb = hex('#8fa9b3'), DARK: Rgb = hex('#2d3236')
const conc = surfaceTag('concrete')

/**
 * THE FONDATION SUISSE: the slab, 5 storeys (ground free) 43 × 11 m, lifted on six pairs of great bone-shaped concrete piers, its south face all glass for the four floors of rooms and the top floor solid; the north face stone panels with small windows; and behind it, on the ground, the stair tower in its curved concrete shell and the low common room with its famous
 * curving wall of rough rubble. The glass tag renders opaque: lightened, with a white frame at every room.
 */
export function fondationSuisse(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, HX = 21, HZ = 5.2, Y0 = y + 4, Y1 = Y0 + 12.6, Y2 = Y1 + 3.6
  // the piers, in pairs, narrowing up: a dark undercroft beyond them
  for (const x of [-14, -7, 0, 7, 14, 20].map((v) => v - 3)) {
    for (const z of [-2.2, 2.2]) {
      prism(out, x, z, y, Y0 - 0.35, 0.9, 10, CONC_DK, conc, 0.6)
      block(out, x - 0.9, x + 0.9, z - 0.65, z + 0.65, Y0 - 0.4, Y0, CONC_DK, conc)
    }
  }
  // the slab: its underside, two ends blank, the north side stone in panels with its small windows
  block(out, -HX, HX, -HZ, HZ, Y0, Y2, CONC, conc)
  block(out, -HX - 0.05, HX + 0.05, -HZ - 0.05, HZ + 0.05, Y2, Y2 + 0.45, shade(CONC, 1.06), conc)
  // the glass south: four floors, room by room, each a tall bay in thin white frame with a slight setback for spandrel
  const rooms = 15, BAY = (2 * HX) / rooms, FL = 3.15
  for (let f = 0; f < 4; f++) {
    const ya = Y0 + f * FL
    rectOn(out, '-z', -HZ, -HX, HX, ya, ya + FL, shade(GLASS, 1.05), 0.03)
    for (let i = 0; i <= rooms; i++) block(out, -HX + i * BAY - 0.05, -HX + i * BAY + 0.05, -HZ - 0.15, -HZ, ya, ya + FL, hex('#eaeae4'))
    block(out, -HX, HX, -HZ - 0.18, -HZ, ya + 2.05, ya + 2.14, hex('#eaeae4'))
    block(out, -HX, HX, -HZ - 0.2, -HZ, ya - 0.1, ya + 0.12, CONC, conc)
  }
  // the blind top floor's single row of openings, the roof garden's parapet
  for (let i = 0; i < 12; i++) {
    const x = -HX + 2 + i * 3.5
    rectOn(out, '-z', -HZ, x, x + 1.8, Y1 + 1.2, Y1 + 2.6, DARK, 0.04)
  }
  // north: squared stone panels, small windows in strips
  for (let f = 0; f < 5; f++) {
    const ya = Y0 + f * FL
    for (let i = 0; i < rooms; i++) rectOn(out, '+z', HZ, -HX + i * BAY + 0.9, -HX + i * BAY + BAY - 0.9, ya + 1.2, ya + 2.3, DARK, 0.04)
    rectOn(out, '+z', HZ, -HX, HX, ya, ya + 0.08, shade(CONC, 0.86), 0.03)
  }
  // the stair: a tall curved tower behind, its shell of plain concrete
  prism(out, 2, HZ + 3.4, y, Y2 + 0.2, 3.4, 12, CONC, conc)
  block(out, -0.4, 4.4, HZ - 0.4, HZ + 1.2, y, Y2, CONC, conc)
  // the common room: one storey on the ground behind, its long free curve of rough rubble
  const n = 12, R = 11
  for (let k = 0; k < n; k++) {
    const a0 = Math.PI * (0.05 + (k / n) * 0.72), a1 = Math.PI * (0.05 + ((k + 1) / n) * 0.72)
    const P = (a: number): [number, number] => [-8 + Math.cos(a) * R, HZ + 0.5 + Math.sin(a) * R * 0.75]
    const [ax, az] = P(a0), [bx, bz] = P(a1)
    strut(out, [ax, y, az], [bx, y, bz], 0.5, 3.8, RUBBLE, surfaceTag('rock'))
    strut(out, [ax, y + 3.85, az], [bx, y + 3.85, bz], 0.65, 0.2, CONC, conc)
  }
  block(out, -17, 2.5, HZ, HZ + 7, y, y + 3.6, shade(CONC, 0.84), conc)
  block(out, -18, 3, HZ - 0.2, HZ + 7.8, y + 3.6, y + 3.9, CONC, conc)
}

/**
 * THE MAISON DU BRÉSIL: the slab of seven floors on five massive sculpted pairs of pilotis, its long east front a grid of concrete loggias, their side walls painted in Corbusian red, yellow, blue and green; the west plain with a strip of windows; and under it, in rough stone and raw concrete, the low entrance hall and the director's house with their loose curves.
 * 58 × 14 m. −z the coloured front.
 */
export function maisonBresil(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, HX = Math.min(29, fit.hx), HZ = 7, Y0 = y + 5.6, FL = 3, N = 7
  const Y1 = Y0 + N * FL
  // the pilotis: pairs of wedges across the slab
  for (const x of [-22, -11, 0, 11, 22]) {
    for (const s of [-1, 1]) {
      prism(out, x, s * 3.2, y, Y0, 1.55, 6, CONC_DK, conc, 0.8)
      block(out, x - 1.1, x + 1.1, s * 3.2 - 1.4, s * 3.2 + 1.4, Y0 - 0.5, Y0, CONC_DK, conc)
    }
    block(out, x - 0.5, x + 0.5, -3.2, 3.2, Y0 - 1, Y0, CONC_DK, conc)
  }
  // the body behind the loggias
  block(out, -HX, HX, -HZ + 1.6, HZ, Y0, Y1, CONC, conc)
  block(out, -HX, HX, -HZ, HZ, Y0, Y0 + 0.3, CONC_DK, conc)
  block(out, -HX, HX, -HZ - 0.05, HZ + 0.05, Y1, Y1 + 0.5, shade(CONC, 1.08), conc)
  const BAYS = 30, B = (2 * HX) / BAYS, COL: Rgb[] = [hex('#c43a2d'), hex('#e8b93b'), hex('#2f62a6'), hex('#4a8a56'), hex('#e7e2d6'), hex('#e7e2d6')]
  const pick = (i: number, f: number): Rgb => COL[Math.abs(Math.floor(Math.sin(i * 12.9898 + f * 78.233) * 43758.5453)) % COL.length]
  for (let f = 0; f < N; f++) {
    const ya = Y0 + f * FL
    // each room's balcony: glass and a door at the back, a coloured party wall, a balcony front
    rectOn(out, '-z', -HZ + 1.6, -HX, HX, ya + 0.3, ya + FL, shade(GLASS, 0.9), 0.03)
    for (let i = 0; i < BAYS; i++) {
      const x0 = -HX + i * B
      block(out, x0 - 0.06, x0 + 0.06, -HZ, -HZ + 1.6, ya, ya + FL, pick(i, f), conc)
      if (i % 2 === 0) rectOn(out, '-z', -HZ + 1.6, x0 + 0.2, x0 + B - 0.2, ya + 0.3, ya + FL - 0.2, pick(i + 3, f + 2), 0.05)
      block(out, x0, x0 + B, -HZ, -HZ + 0.1, ya, ya + 1.05, CONC, conc)
    }
    block(out, -HX, HX, -HZ, -HZ + 1.6, ya + FL - 0.16, ya + FL, CONC, conc)
    // the west: plain concrete, a strip of windows
    rectOn(out, '+z', HZ, -HX + 1, HX - 1, ya + 1.3, ya + 2.3, DARK, 0.04)
  }
  block(out, HX - 0.05, HX + 0.05, -HZ, HZ, Y0, Y1, CONC, conc)
  block(out, -HX - 0.05, -HX + 0.05, -HZ, HZ, Y0, Y1, CONC, conc)
  // on the roof, the lift's and a stair's raw boxes
  block(out, -8, 0, -3, 3, Y1 + 0.5, Y1 + 3, CONC_DK, conc)
  // the low buildings under it: a free curve of rubble, a flat concrete lid
  const seg = (ax: number, az: number, bx: number, bz: number): void => { strut(out, [ax, y, az], [bx, y, bz], 0.5, 3.2, RUBBLE, surfaceTag('rock')); strut(out, [ax, y + 3.25, az], [bx, y + 3.25, bz], 0.65, 0.22, CONC, conc) }
  const line: [number, number][] = [[-24, 2], [-20, 8], [-12, 12], [-3, 11], [4, 7], [9, 8], [16, 13], [24, 11]]
  for (let k = 0; k + 1 < line.length; k++) seg(line[k][0], line[k][1], line[k + 1][0], line[k + 1][1])
  block(out, -24, 24, 1.5, 7, y, y + 3.2, shade(CONC, 0.8), conc)
  block(out, -25, 25, 1, 8.5, y + 3.2, y + 3.5, CONC, conc)
  block(out, -24.5, -14, 2, 2.1, y, y + 3.1, RUBBLE, surfaceTag('rock'))
}
