import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LE MONUMENT A LA MISSION MARCHAND (avenue Daumesnil, bois de Vincennes edge opposite the Palais de la Porte Dorée,
 * Paris 12e; Wikidata Q3323421; Léon Baudry, 1934/1949): a pale stone wall about 10 m long carrying a frieze in high relief
 * of the Congo-Nile column (six French soldiers and six tirailleurs, in profile like Trajan's column, left to right, a map
 * of the route behind), and at its right end a big round bronze shield naming Marchand and his officers. Frame: −z the
 * relief face, x across (shield end at +x), y up from the ground (G). Footprint is the OSM memorial way 62819232
 * (12.47 x 1.94 m, long axis bearing 299°); heights and the wall's thickness are scaled by eye off the one Commons photo
 * (the shield end), not surveyed. The frieze is a procedural stand-in of blocky profile figures: no photo of the frieze
 * exists on Commons, so there was nothing to give Modly.
 */
export const HX = 6.235
export const HZ = 0.97

// tunables (metres)
const STEP1_H = 0.3, STEP2_H = 0.3, STEP2_IN = 0.2         // two low steps round the wall foot
const WALL_T = 0.9, WALL_H = 2.3, WALL_END_IN = 0.45        // body thickness/height, set in from the base ends
const PIER_X0 = 3.3, PIER_OUT = 0.08                         // the right-hand block that carries the shield
const SHIELD_X = 4.5, SHIELD_Y = 1.15, SHIELD_R = 0.85, SHIELD_ROWS = 14
const FIG_N = 12, FIG_X0 = -5.2, FIG_PITCH = 0.66, FIG_H = 1.55, FIG_OUT = 0.13
const FIG_Y0 = 0.35                                          // feet above the wall foot
const MAP_Y0 = 0.25, MAP_Y1 = 1.95                           // the sunk map panel behind the figures

const STONE: Rgb = hex('#d3ccba')
const BRONZE: Rgb = hex('#4e6359')
const LETTER: Rgb = hex('#c9d3c6')

function figure(q: MeshBuilder, x: number, y0: number, z0: number, i: number): void {
  const french = i % 2 === 0
  const col = shade(STONE, french ? 0.9 : 0.8)
  const h = FIG_H * (french ? 1 : 0.96)
  const z1 = z0 - FIG_OUT
  // legs mid-stride, torso, head, helmet (French) or a bundle on the shoulder (porters, every third)
  block(q, x - 0.17, x - 0.03, z1, z0, y0, y0 + h * 0.5, col)
  block(q, x + 0.0, x + 0.16, z1, z0, y0, y0 + h * 0.5, shade(col, 0.95))
  block(q, x - 0.17, x + 0.17, z1 - 0.02, z0, y0 + h * 0.5, y0 + h * 0.84, french ? col : shade(col, 1.05))
  block(q, x - 0.08, x + 0.1, z1 - 0.03, z0, y0 + h * 0.84, y0 + h * 0.97, shade(col, 1.08))
  if (french && i % 4 === 0) block(q, x - 0.12, x + 0.14, z1 - 0.05, z0, y0 + h * 0.95, y0 + h * 1.02, shade(col, 0.85))
  if (!french && i % 3 === 1) block(q, x - 0.3, x + 0.25, z1 - 0.07, z0, y0 + h * 0.95, y0 + h * 1.12, shade(col, 0.82))
  // a rifle or staff behind each
  block(q, x + 0.17, x + 0.2, z1 + 0.02, z0, y0 + 0.1, y0 + h * 1.08, shade(col, 0.75))
}

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const fz = -WALL_T / 2   // front plane of the wall
  block(q, -HX, HX, -HZ, HZ, y(0), y(STEP1_H), shade(STONE, 0.88))
  block(q, -HX + STEP2_IN, HX - STEP2_IN, -HZ + STEP2_IN, HZ - STEP2_IN, y(STEP1_H), y(STEP1_H + STEP2_H), shade(STONE, 0.93))
  const b = STEP1_H + STEP2_H
  block(q, -HX + WALL_END_IN, HX - WALL_END_IN, fz, WALL_T / 2, y(b), y(b + WALL_H), STONE)
  // cornice band along the top and a weathering band under it
  block(q, -HX + WALL_END_IN - 0.05, HX - WALL_END_IN + 0.05, fz - 0.08, WALL_T / 2 + 0.08, y(b + WALL_H - 0.18), y(b + WALL_H), shade(STONE, 1.04))
  block(q, -HX + WALL_END_IN, HX - WALL_END_IN, fz - 0.01, fz, y(b + WALL_H - 0.4), y(b + WALL_H - 0.3), shade(STONE, 0.86))
  // the map panel behind the figures, with route marks
  const mx0 = FIG_X0 - 0.5, mx1 = PIER_X0 - 0.2
  block(q, mx0, mx1, fz - 0.03, fz, y(b + MAP_Y0), y(b + MAP_Y1), shade(STONE, 1.05))
  for (let k = 0; k < 9; k++) {
    const xx = mx0 + 0.4 + k * ((mx1 - mx0 - 0.8) / 8)
    block(q, xx - 0.05, xx + 0.05, fz - 0.045, fz - 0.03, y(b + 1.75 + (k % 3) * 0.04), y(b + 1.85 + (k % 3) * 0.04), shade(STONE, 0.7))
  }
  // the frieze: 12 profile figures marching to the shield
  for (let i = 0; i < FIG_N; i++) figure(q, FIG_X0 + i * FIG_PITCH, y(b + FIG_Y0), fz - 0.03, i)
  // right pier and the bronze shield (stacked strips make the disc)
  block(q, PIER_X0, HX - WALL_END_IN, fz - PIER_OUT, fz, y(b), y(b + WALL_H - 0.18), shade(STONE, 1.02))
  const sz1 = fz - PIER_OUT - 0.02, sz0 = fz - PIER_OUT
  for (let r = 0; r < SHIELD_ROWS; r++) {
    const v0 = -1 + (2 * r) / SHIELD_ROWS, v1 = -1 + (2 * (r + 1)) / SHIELD_ROWS
    const w = Math.sqrt(1 - Math.min(Math.abs(v0), Math.abs(v1)) ** 2) * SHIELD_R
    block(q, SHIELD_X - w, SHIELD_X + w, sz1 - 0.04, sz0, y(b + SHIELD_Y + v0 * SHIELD_R), y(b + SHIELD_Y + v1 * SHIELD_R), BRONZE)
  }
  // raised inner boss and the inscription
  plaque(q, { x: SHIELD_X, z: sz1 - 0.04, y0: y(b + SHIELD_Y - 0.5), w: 1.0, h: 1.0, panel: shade(BRONZE, 1.06), letters: LETTER, lines: [0.4, 0.7, 0.55, 0.9, 0.9, 0.9, 0.8, 0.9, 0.5] })
  // carved names high on the wall (Djibouti etc.) and the line of campaigns on the lower step face
  plaque(q, { x: -2.2, z: fz, y0: y(b + WALL_H - 0.38), w: 2.8, h: 0.2, panel: shade(STONE, 0.97), letters: shade(STONE, 0.55), lines: [0.9] })
  plaque(q, { x: SHIELD_X, z: -HZ, y0: y(0.05), w: 4.5, h: 0.2, panel: shade(STONE, 0.95), letters: shade(STONE, 0.55), lines: [0.95] })
}

export function monumentMissionMarchand(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
