import type { MeshBuilder } from '../../../../buildings.ts'
import { block, hex, shade, type Rgb } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G, kerbedBed, pavedPatch, plaque, wallRun } from './monument-kit.ts'

/*
 * THE MUR DES FÉDÉRÉS (Père-Lachaise, division 76; the Communards shot against it 28 May 1871; the plaque "AUX MORTS DE
 * LA COMMUNE 21-28 MAI 1871" of 1883): a stretch of the cemetery's old south-east boundary wall, grey rubble with a red
 * tile coping, the grey marble plaque with gilt letters set in it at eye height, and in front a small paved court of
 * setts between two kerbed beds, ivy and shrubs along the wall. Frame: the wall runs along x with its centre line at
 * z = 0 (the OSM wall way 13859706 passes through the plaque), −z the cemetery side where the plaque faces, toward bearing 334.
 * Wall height, plaque size and the court from two Commons photographs scaled on the plaque (estimated ~2.3 × 1.5 m)
 * and the wall (~2.8 m); not surveyed.
 */
export const HX = 24
export const HZ = 7

// tunables
const WALL_H = 2.9
const WALL_T = 0.6
const PLAQUE_W = 2.3
const PLAQUE_H = 1.45
const PLAQUE_Y = 0.85
const COURT_W = 4.3        // half-width of the paved court in front of the plaque
const COURT_D = 5.5        // its depth from the wall
const BED_D = 2.4          // depth of the beds either side
const IVY_FROM = -4.2      // ivy covers the wall from here to the far left end

const STONE: Rgb = hex('#8a857b')
const COPING: Rgb = hex('#a2503a')
const MARBLE: Rgb = hex('#9aa0a5')
const GILT: Rgb = hex('#c9a64a')
const SETT: Rgb = hex('#8c8b86')
const DRAIN: Rgb = hex('#2e3033')
const KERB: Rgb = hex('#a39f94')
const SOIL: Rgb = hex('#4a3a2c')
const IVY: Rgb = hex('#3e6a32')
const GREENS: Rgb[] = [hex('#4f7d3a'), hex('#678c40'), hex('#3b6a35'), hex('#7a9a4a')]
const FLOWERS: Rgb[] = [hex('#c8503c'), hex('#d9a53a'), hex('#b45a8c'), hex('#e0e0d0')]

export function murDesFederes(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q, fit.groundAt ? fit.groundAt(0, -4) : G))
}

/** `g`: the cemetery ground at the court, above the model's base (the base is the lowest ground under the box, i.e. outside the wall). */
function draw(out: MeshBuilder, g: number): void {
  const h = WALL_T / 2
  // the ground the model stands on (below the loader's half metre) up to the court's setts
  block(out, -HX, HX, -HZ, 0, 0, g - 0.02, shade(SETT, 0.9))
  wallRun(out, { x0: -HX, x1: HX, y0: 0, y1: g + WALL_H, t: WALL_T, stone: STONE, course: 0.28, coping: COPING, cope: 0.2, over: 0.07 })
  // the plaque
  plaque(out, { x: 0, z: -h - 0.02, y0: g + PLAQUE_Y, w: PLAQUE_W, h: PLAQUE_H, panel: MARBLE, frame: shade(MARBLE, 0.8), letters: GILT, lines: [0.45, 0, 0.85, 0.7, 0, 0.5] })
  // ivy over the left of the wall
  block(out, -HX, IVY_FROM, -h - 0.16, -h, g, g + WALL_H - 0.1, IVY)
  // the paved court, with the drain channel across it
  pavedPatch(out, -COURT_W, COURT_W, -COURT_D, -h, g - 0.02, g, SETT, 0.45)
  block(out, -COURT_W, COURT_W, -3.6, -3.45, g, g + 0.005, DRAIN)
  // beds either side, along the wall foot
  const flank = (x0: number, x1: number, seed: number) => kerbedBed(out, { x0, x1, z0: -h - BED_D, z1: -h, y: g - 0.02, kerb: KERB, soil: SOIL, plants: GREENS, n: 26, seed, top: 0.7 })
  flank(-HX + 2, -COURT_W - 0.1, 3)
  flank(COURT_W + 0.1, HX - 2, 11)
  // flowers laid at the foot of the plaque
  kerbedBed(out, { x0: -1.9, x1: 1.9, z0: -h - 0.45, z1: -h, y: g - 0.02, kerb: KERB, kw: 0.08, kh: 0.1, soil: SOIL, plants: FLOWERS, n: 14, seed: 5, top: 0.45 })
}
