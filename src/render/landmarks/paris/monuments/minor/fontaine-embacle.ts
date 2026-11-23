import { capPolygonWithHoles, type MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { ccw, FIXED } from '../common.ts'
import { G, tiltedSlab } from './monument-kit.ts'

/*
 * L'EMBACLE (place du Québec, Paris 6e, facing Saint-Germain-des-Prés; Charles Daudelin, inaugurated 25 Oct 1984; Wikidata
 * Q3076308): a heap of weathered bronze plates tilted up out of the paving, as the pack ice of the St Lawrence heaves a
 * pavement, with water welling in the hollow among them. All of it is structure (flat plates, a pool), so it is procedural
 * and there is no Modly piece. The pool plan is OSM way 664223075 (amenity=fountain, ~7 × 4.5 m, claimed so it is not drawn
 * as water twice). The plates' sizes, tilts and heights are scaled by eye off two Commons photos (the group stands ~1.6 m
 * at its highest, plates ~1.5–4 m long, ~0.12 m thick), not surveyed. Frame: x east, z north, y up from the pavement (G).
 */
export const HX = 3.6
export const HZ = 2.4

const BRONZE: Rgb = hex('#4a3b2f')
const WATER: Rgb = hex('#2d4448')
/** The pool outline, metres from the centre: [x, z, …]. */
const POOL: [number, number][] = [
  [-2.6, -0.6], [-1.6, -1.6], [0.2, -1.8], [2.0, -1.5], [3.0, -0.4], [2.8, 0.8], [1.2, 1.5], [-0.6, 1.4], [-2.2, 0.9],
]
const POOL_Y = 0.03
/** The plates: low end (x, z, height above pavement), heading (0 = east, 90 = north), pitch, length, width, thickness. Tune freely. */
const PLATES: { a: [number, number, number]; yaw: number; pitch: number; len: number; wid: number; t: number }[] = [
  // the long apron that slopes down from the pavement on the west into the water, then a second plate lifting off its far end
  { a: [-3.5, -0.2, 0.0], yaw: 8, pitch: 4, len: 3.4, wid: 2.4, t: 0.12 },
  { a: [-1.0, 0.1, -0.05], yaw: 16, pitch: 24, len: 3.6, wid: 1.5, t: 0.12 },
  // a small block tipped up at the north-west
  { a: [-2.0, 1.2, 0.0], yaw: -30, pitch: 28, len: 1.4, wid: 1.1, t: 0.12 },
  // the right-hand group: a long plate rising to the back, and two crossing it
  { a: [1.0, -1.6, 0.0], yaw: 95, pitch: 18, len: 3.0, wid: 1.4, t: 0.12 },
  { a: [0.6, 0.1, 0.0], yaw: 150, pitch: 20, len: 2.6, wid: 1.2, t: 0.12 },
  { a: [3.0, -1.2, 0.0], yaw: 125, pitch: 14, len: 2.4, wid: 1.3, t: 0.12 },
  { a: [2.4, 0.5, 0.0], yaw: 40, pitch: 34, len: 2.2, wid: 1.0, t: 0.12 },
]

function draw(q: MeshBuilder): void {
  const pool = ccw(POOL.map(([x, z]) => ({ x, z })))
  capPolygonWithHoles(q, [pool], G + POOL_Y, WATER, FIXED)
  for (const p of PLATES) {
    tiltedSlab(q, p.a[0], G + p.a[2], p.a[1], { yawDeg: p.yaw, pitchDeg: p.pitch, len: p.len, wid: p.wid, thick: p.t, c: shade(BRONZE, 1 + ((p.yaw % 7) - 3) * 0.03) })
  }
}

export function fontaineEmbacle(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
