import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G, spout } from '../plaza-common.ts'
import { roundBasin } from './monument-kit.ts'

/*
 * THE FONTAINE DU MARCHÉ-AUX-CARMES (square Gabriel-Pierné, rue de Seine / rue Mazarine, 6e; Alexandre-Évariste Fragonard,
 * 1830, moved here when the Marché des Carmes closed in 1930; Wikidata Q3076266): a low round stone basin with a tall
 * slab pillar standing in the water; a spout at the middle of each broad face; and on top a herm — a two-faced head
 * (Abondance one way, Commerce the other) crowned with a fruit basket, above a carved bust-front on each face. The head and
 * crown are a Modly model (statues manifest: carmes-head); the pillar, the shoulder pieces, the spouts and the basin
 * are procedural. Frame: the pillar's broad faces look ±z, x across, y up, pavement at G.
 * Basin radius 1.32 m is OSM way 1200620877 (a kerb ring, 22 nodes, ±0.07 m); the pillar's size and the heights are
 * scaled off three Commons photographs against the basin's width (a low-angle view inflates the height, so shaved by a
 * tenth), not surveyed.
 */
export const HX = 1.5
export const HZ = 1.5

// tunables
const BASIN_R = 1.32          // outer radius of the kerb
const BASIN_RIM = 0.3         // kerb width
const BASIN_H = 0.42          // wall above the pavement
const PIER_W = 0.64           // pillar width (x), the broad faces
const PIER_D = 0.46           // pillar depth (z)
const PIER_TOP = 2.5          // pillar top above the pavement (shoulder line)
const PLINTH_H = 0.5          // the pillar's stepped foot above the pavement
const SPOUT_Y = 1.0           // the spout's centre above the pavement
const BUST_H = 0.55           // the carved bust front, below the shoulder line
const WATER_DROP = 0.08       // water surface below the kerb top

const STONE: Rgb = hex('#cbc3b0')
const PALE: Rgb = hex('#d8d1bf')
const DARK: Rgb = hex('#9f9684')
const BRONZE: Rgb = hex('#5b5a4c')
const WATER: Rgb = hex('#6d93a0')
const FALL: Rgb = hex('#c4d8dc')

/** The head sits on the pillar's top, on the axis (landmark frame): for the statues manifest */
export const HEAD_AT: [number, number, number] = [0, G + PIER_TOP, 0]

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // basin: a round kerb with the water in it, a little pavement apron (hidden by the pavement itself if flush)
  roundBasin(q, 0, 0, y(0), BASIN_R, { rim: BASIN_RIM, depth: BASIN_H, lip: 0.04, stone: STONE, water: WATER })
  // the pillar: a stepped foot, the shaft, a cornice-like cap under the herm
  block(q, -PIER_W / 2 - 0.12, PIER_W / 2 + 0.12, -PIER_D / 2 - 0.12, PIER_D / 2 + 0.12, y(BASIN_H - 0.08 - WATER_DROP), y(PLINTH_H - 0.12), DARK)
  block(q, -PIER_W / 2 - 0.06, PIER_W / 2 + 0.06, -PIER_D / 2 - 0.06, PIER_D / 2 + 0.06, y(PLINTH_H - 0.12), y(PLINTH_H), STONE)
  block(q, -PIER_W / 2, PIER_W / 2, -PIER_D / 2, PIER_D / 2, y(PLINTH_H), y(PIER_TOP), PALE)
  // the shoulder pieces: a shallow bust front on each broad face (flat stand-in for the relief; the head above is Modly)
  for (const s of [-1, 1]) {
    const z = s * PIER_D / 2
    const z1 = z + s * 0.05
    block(q, -PIER_W / 2 + 0.05, PIER_W / 2 - 0.05, Math.min(z, z1), Math.max(z, z1), y(PIER_TOP - BUST_H), y(PIER_TOP - 0.04), shade(PALE, 0.94))
    // the spout: a bronze mask-boss on the face and a thin arc of water falling into the basin
    block(q, -0.09, 0.09, Math.min(z, z + s * 0.12), Math.max(z, z + s * 0.12), y(SPOUT_Y - 0.09), y(SPOUT_Y + 0.09), BRONZE)
    spout(q, [0, y(SPOUT_Y - 0.04), z + s * 0.12], [0, y(BASIN_H - 0.1), z + s * 0.55], 0.12, 0.02, FALL)
  }
  // a thin cap slab under the herm
  block(q, -PIER_W / 2 - 0.04, PIER_W / 2 + 0.04, -PIER_D / 2 - 0.04, PIER_D / 2 + 0.04, y(PIER_TOP), y(PIER_TOP + 0.05), STONE)
}

export function fontaineMarcheCarmes(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
