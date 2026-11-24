import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { sweptTube } from './monument-kit.ts'
import { basin } from '../plaza-common.ts'
import { ccw, type P2 } from '../common.ts'

/*
 * LA FONTAINE SAUSSURE (square Paul-Paray, between rue de Saussure and rue des Tapisseries, 17e; no Wikidata id; OSM way
 * 1518303..., amenity=fountain, ~16 x 15.8 m): a wide shallow pool of pale tiles whose back is a straight wall of pale tiled
 * stone (~1.1 m) carrying, at its middle, a small stone ring/arch sculpture ~1.5 m high with two pale blocks and copper-brown
 * lumps along the wall. Seen in ONE Commons photo (Fontaine Rue Tapisseries 2021-08-21 1); the outline is OSM's, the wall's
 * side (north chord) and all heights are by eye. Frame: x east, z north, centred on the ring's box; pavement at G.
 */
export const HX = 8.0
export const HZ = 8.0

// tunables (metres)
const WALL_Z = 5.6, WALL_T = 0.45, WALL_H = 1.15
const POOL_H = 0.28, RIM = 0.45
const RING_R = 0.62, RING_T = 0.17, RING_H = 0.35
const STONE: Rgb = hex('#cfc8b8')
const TILE: Rgb = hex('#a39c88')
const WATER: Rgb = hex('#9fb4a8')
const COPPER: Rgb = hex('#9a6038')

// OSM ring, metres east/north of the box centre (-1792.8, 3106.0)
const RING: P2[] = ([
  [0.2, 7.9], [6.6, 5.4], [8.0, -0.5], [5.2, -6.1], [0.5, -7.9], [-5.5, -5.1], [-8.0, 0.1], [-4.7, 5.9], [-2.3, 7.1],
] as const).map(([x, z]) => ({ x, z }))

function draw(q: MeshBuilder): void {
  const y0 = G
  const outer = ccw(RING)
  const inner = ccw(RING.map((p) => ({ x: p.x * (1 - RIM / 8), z: p.z * (1 - RIM / 8) })))
  basin(q, outer, inner, y0, y0 + POOL_H, shade(TILE, 1.05), WATER)
  // the back wall along the north chord, with its two end blocks and the lumps
  block(q, -6.2, 6.2, WALL_Z - WALL_T, WALL_Z, y0, y0 + WALL_H, STONE)
  block(q, -6.4, 6.4, WALL_Z - WALL_T - 0.05, WALL_Z + 0.03, y0 + WALL_H, y0 + WALL_H + 0.06, shade(STONE, 1.06))
  for (const x of [-3.9, 3.9]) block(q, x - 0.7, x + 0.7, WALL_Z - 1.0, WALL_Z - WALL_T, y0 + POOL_H, y0 + 0.55, shade(STONE, 0.95))
  for (const x of [-4.4, 0, 4.4]) block(q, x - 0.5, x + 0.5, WALL_Z - WALL_T - 0.45, WALL_Z - WALL_T, y0 + POOL_H, y0 + 0.62, COPPER)
  block(q, -1.6, 1.6, WALL_Z - 1.1, WALL_Z - WALL_T, y0 + POOL_H, y0 + 0.5, shade(STONE, 0.9))
  // the ring: an upright stone hoop on the low plinth, in the plane of the wall
  const cx = 0, cz = WALL_Z - WALL_T - 0.55, cy = y0 + 0.5 + RING_H + RING_R
  const path: [number, number, number][] = []
  for (let i = 0; i <= 28; i++) {
    const a = (i / 28) * Math.PI * 2
    path.push([cx + Math.cos(a) * RING_R, cy + Math.sin(a) * RING_R, cz])
  }
  sweptTube(q, path, { r: RING_T, sides: 10, c: shade(STONE, 1.04) })
  block(q, cx - 0.5, cx + 0.5, cz - 0.3, cz + 0.3, y0 + 0.5, y0 + 0.5 + RING_H, shade(STONE, 0.97))
}

export function fontaineSaussure(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
