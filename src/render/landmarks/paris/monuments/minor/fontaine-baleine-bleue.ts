import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { roundBasin } from './monument-kit.ts'

/*
 * LA FONTAINE DE LA BALEINE BLEUE (square Saint-Eloi, rue de Reuilly, 12e; Wikidata Q23321581, 1982; OSM way 661816194,
 * ~11.9 x 10.9 m): a wide, very shallow round pool of pale blue tiles with a white stone kerb, a raised round inner basin
 * (blue tiles) at its middle and, on it, a blue mosaic whale standing on its tail. Seen in Commons 'Whale fountain @ Square
 * Saint-Eloi' photos; radii from the OSM ring, heights by eye against the benches. The whale is the Modly piece
 * baleine-bleue-whale (attached at the middle of the inner basin). Frame: x east, z north, centred on the pool.
 */
export const HX = 5.95
export const HZ = 5.45

// tunables (metres)
const POOL_R = 5.45, POOL_RIM = 0.4, POOL_H = 0.14
const INNER_R = 1.95, INNER_RIM = 0.3, INNER_H = 0.62
const KERB: Rgb = hex('#d9d8d2')
const TILE: Rgb = hex('#8fb3d4')
const WATER: Rgb = hex('#6fa3cc')

function draw(q: MeshBuilder): void {
  const y0 = G
  roundBasin(q, 0, 0, y0, POOL_R, { rim: POOL_RIM, depth: POOL_H, stone: KERB, water: shade(WATER, 1.1), sides: 40 })
  roundBasin(q, 0, 0, y0 + POOL_H - 0.06, INNER_R, { rim: INNER_RIM, depth: INNER_H, lip: 0.06, stone: TILE, water: WATER, sides: 28 })
}

export function fontaineBaleineBleue(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
