import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { FIXED } from '../common.ts'
import { G } from '../plaza-common.ts'
import { jetRing, roundBasin } from './monument-kit.ts'

/*
 * LA FONTAINE EPHÉSIENNE (place de la Bataille-de-Stalingrad, bassin de la Villette, 19e; Georges Jeanclos, 1989, with
 * Bernard Huet; OSM way 1056726015 amenity=fountain, a ~3 m ring, no Wikidata): a low round stone basin and in it a dark bronze
 * column, wide at the foot and narrowing upward, its sides studded with rounded bosses (the many-breasted Artemis of Ephesus), a
 * seated bronze figure on top (Modly: statues manifest `ephresienne-figure`) and two pipes on each side that spill into the basin.
 * Frame: x across, y up from the paving (G), the basin centred. One Commons photo only (La fontaine Jeanclos, Paris, stalingrad):
 * the column ~3.3 m and the figure ~1.1 m are read off it against the trees, i.e. guessed (+-0.7 m).
 */
export const HX = 1.8
export const HZ = 1.8

// tunables (metres)
const BASIN_R = 1.5, RIM_W = 0.3, RIM_H = 0.45
const COL_H = 3.3, COL_R0 = 0.5, COL_R1 = 0.34
const TIERS = 6, BOSSES = 7, BOSS_R = 0.12
export const FIGURE_AT: [number, number, number] = [0, G + 0.3 + COL_H, 0]
const JETS = 4

const STONE: Rgb = hex('#c9c3b3')
const WATER: Rgb = hex('#7fa3ad')
const BRONZE: Rgb = hex('#4a4034')
const JET: Rgb = hex('#dfeaec')

const colR = (t: number): number => COL_R0 + (COL_R1 - COL_R0) * t

function draw(q: MeshBuilder): void {
  roundBasin(q, 0, 0, G, BASIN_R, { rim: RIM_W, depth: RIM_H, lip: 0.03, stone: STONE, water: WATER, sides: 28 })
  const y0 = G + 0.3
  // a low stone drum under the column, then the bronze shaft
  prism(q, 0, 0, G + 0.2, y0, COL_R0 + 0.12, 16, shade(STONE, 0.92), FIXED, 1.0, true)
  lathe(q, 0, 0, [[COL_R0, y0], [colR(0.5), y0 + COL_H * 0.5], [COL_R1, y0 + COL_H]], 16, BRONZE)
  // bosses in staggered tiers up the shaft
  for (let i = 0; i < TIERS; i++) {
    const t = (i + 0.6) / (TIERS + 0.3), y = y0 + t * COL_H
    for (let k = 0; k < BOSSES; k++) {
      const a = ((k + (i % 2) * 0.5) / BOSSES) * Math.PI * 2, r = colR(t) + 0.02
      prism(q, Math.sin(a) * r, Math.cos(a) * r, y - BOSS_R, y + BOSS_R, BOSS_R, 6, shade(BRONZE, 1.15), undefined, 0.6, true)
    }
  }
  // a cap under the figure, and the pipes spilling into the basin
  prism(q, 0, 0, y0 + COL_H - 0.05, y0 + COL_H + 0.06, COL_R1 + 0.1, 12, shade(BRONZE, 0.9), undefined, 1.0, true)
  jetRing(q, 0, 0, JETS, COL_R1 + 0.05, y0 + COL_H - 0.5, BASIN_R - RIM_W - 0.2, G + RIM_H - 0.12, { rise: 0.3, r: 0.02, c: JET })
}

export function fontaineEphresienne(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
