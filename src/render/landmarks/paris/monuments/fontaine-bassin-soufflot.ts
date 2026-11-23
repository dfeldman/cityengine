import type { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { FIXED } from './common.ts'
import { G } from './plaza-common.ts'
import { jetRing, roundBasin } from './monument-kit.ts'

/*
 * LA FONTAINE DU BASSIN SOUFFLOT ("Bassin pastoral", place Edmond-Rostand, 6e; Davioud's basin 1862, Crauk's bronze Triton and
 * nereid holding a shell 1864/1884; Wikidata Q3076290; OSM way 685770760, amenity=fountain + natural=water, ~14 m across): a wide
 * shallow round basin with a thick pale-stone rim (~0.5 m above the paving), a ring of small jets playing inward from the
 * rim, and at the centre eight stone blocks carrying a round bronze slab with the group (Modly: statues manifest `soufflot-triton`).
 * Frame: x across, y up from the pavement (G), the basin centred. Dimensions: OSM ring radius ~7 m and the rim height tag
 * 0.5; the rim width, jets and blocks are by eye off Commons photos (Bassin Soufflot Paris 6e, Fontaine du bassin Soufflot).
 */
export const HX = 7.3
export const HZ = 7.3

// tunables (metres)
const BASIN_R = 7.0
const RIM_W = 0.85
const RIM_H = 0.5
const BLOCKS = 8, BLOCK_R = 0.82, BLOCK_W = 0.34, BLOCK_H = 0.5
export const STATUE_AT: [number, number, number] = [0, G + BLOCK_H, 0]
const JETS = 40, JET_R0 = BASIN_R - RIM_W - 0.05, JET_R1 = 4.6

const STONE: Rgb = hex('#c9c3b3')
const WATER: Rgb = hex('#7fa3ad')
const JET: Rgb = hex('#dfeaec')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  roundBasin(q, 0, 0, y(0), BASIN_R, { rim: RIM_W, depth: RIM_H, lip: 0.04, stone: STONE, water: WATER, sides: 48 })
  // eight stone blocks under the group's slab
  for (let i = 0; i < BLOCKS; i++) {
    const a = ((i + 0.5) / BLOCKS) * Math.PI * 2, x = Math.sin(a) * BLOCK_R, z = Math.cos(a) * BLOCK_R
    block(q, x - BLOCK_W / 2, x + BLOCK_W / 2, z - BLOCK_W / 2, z + BLOCK_W / 2, y(0.36), y(BLOCK_H), shade(STONE, 0.95))
  }
  prism(q, 0, 0, y(0.36), y(0.4), 1.0, 16, shade(STONE, 0.9), FIXED, 1.0, true)
  // the ring of small jets, from the rim's foot inward
  jetRing(q, 0, 0, JETS, JET_R0, y(0.42), JET_R1, y(0.4), { rise: 0.35, r: 0.012, c: JET })
}

export function fontaineBassinSoufflot(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
