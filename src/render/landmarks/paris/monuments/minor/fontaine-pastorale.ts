import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G, spout } from '../plaza-common.ts'

/*
 * THE FONTAINE PASTORALE (square Félix-Desruelles, boulevard Saint-Germain, 6e; Félix Desruelles' relief of 1923, built by
 * the architect Ollivier 1925, Chauvigny stone; Wikidata Q3076051): a wall fountain against the south face of the church
 * Saint-Germain-des-Prés' chapel wall — a low stone base with three rosette spouts whose thin streams fall into a shallow
 * trough, and over it a flat slab carrying the high relief of a shepherd with his staff, a sheep, and a girl facing him.
 * The relief group is a Modly model (statues manifest: pastorale-group); the base, trough, water and slab are procedural.
 * Frame: −z the front (the square), x across, y up, the church wall's face at z = WALL_Z, pavement at G.
 * Sizes are scaled off two Commons photographs (Fontaine Pastorale.jpg, ...(vue d'ensemble).jpg) against the figures
 * taken as ~1.4 m tall, not surveyed; the slab height is the shakiest figure (its top is out of frame).
 */
export const HX = 1.9
export const HZ = 1.4

// tunables
const WALL_Z = 0.9            // the church wall's face (OSM way 1461285705/6 south edge)
const BASE_W = 2.8            // base width (x)
const BASE_D = 0.75           // base depth, proud of the wall
const BASE_H = 0.95           // base top above the pavement
const CAP_H = 0.1             // the moulded top
const SLAB_W = 2.4
const SLAB_H = 2.0            // relief slab height above the base
const SLAB_T = 0.3            // slab thickness, proud of the wall
const SPOUT_Y = 0.55
const SPOUT_X = 0.8           // spout spacing
const TROUGH_D = 0.5          // trough depth in front of the base
const KERB = 0.12
const KERB_H = 0.16

const STONE: Rgb = hex('#cfc8b6')
const PALE: Rgb = hex('#ddd7c6')
const DARK: Rgb = hex('#a39b88')
const WATER: Rgb = hex('#6d93a0')
const FALL: Rgb = hex('#c4d8dc')

/** The relief group stands on the base top against the slab's face (landmark frame): for the statues manifest */
export const GROUP_AT: [number, number, number] = [0, G + BASE_H + CAP_H, WALL_Z - SLAB_T - 0.2]

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const zf = WALL_Z - BASE_D     // base front face
  const zs = WALL_Z - SLAB_T     // slab front face
  // the base: a foot, the body, a moulded top
  block(q, -BASE_W / 2 - 0.08, BASE_W / 2 + 0.08, zf - 0.06, WALL_Z, y(0), y(0.12), DARK)
  block(q, -BASE_W / 2, BASE_W / 2, zf, WALL_Z, y(0.12), y(BASE_H), STONE)
  block(q, -BASE_W / 2 - 0.07, BASE_W / 2 + 0.07, zf - 0.07, WALL_Z, y(BASE_H), y(BASE_H + CAP_H), PALE)
  // three rosette spouts, thin streams into the trough
  for (const sx of [-1, 0, 1]) {
    const x = sx * SPOUT_X
    block(q, x - 0.12, x + 0.12, zf - 0.03, zf, y(SPOUT_Y - 0.12), y(SPOUT_Y + 0.12), shade(PALE, 0.96))
    block(q, x - 0.04, x + 0.04, zf - 0.07, zf - 0.03, y(SPOUT_Y - 0.04), y(SPOUT_Y + 0.04), DARK)
    spout(q, [x, y(SPOUT_Y - 0.04), zf - 0.07], [x, y(KERB_H - 0.1), zf - TROUGH_D * 0.55], 0.03, 0.012, FALL)
  }
  // the shallow trough in front: a kerb round three sides, water between
  const tz = zf - 0.07 - TROUGH_D
  block(q, -BASE_W / 2 - 0.08, BASE_W / 2 + 0.08, tz, tz + KERB, y(0), y(KERB_H), STONE)
  block(q, -BASE_W / 2 - 0.08, -BASE_W / 2 - 0.08 + KERB, tz, zf - 0.06, y(0), y(KERB_H), STONE)
  block(q, BASE_W / 2 + 0.08 - KERB, BASE_W / 2 + 0.08, tz, zf - 0.06, y(0), y(KERB_H), STONE)
  block(q, -BASE_W / 2 - 0.08 + KERB, BASE_W / 2 + 0.08 - KERB, tz + KERB, zf - 0.06, y(0), y(KERB_H - 0.05), WATER)
  // the slab the relief is carved on: a plain panel with a thin frame, set against the wall
  const sy0 = BASE_H + CAP_H
  block(q, -SLAB_W / 2, SLAB_W / 2, zs, WALL_Z + 0.05, y(sy0), y(sy0 + SLAB_H), shade(STONE, 1.02))
  block(q, -SLAB_W / 2 - 0.05, SLAB_W / 2 + 0.05, zs - 0.03, zs, y(sy0), y(sy0 + 0.08), PALE)
  block(q, -SLAB_W / 2 - 0.05, SLAB_W / 2 + 0.05, zs - 0.03, zs, y(sy0 + SLAB_H - 0.08), y(sy0 + SLAB_H), PALE)
  block(q, -SLAB_W / 2 - 0.05, -SLAB_W / 2 + 0.03, zs - 0.03, zs, y(sy0), y(sy0 + SLAB_H), PALE)
  block(q, SLAB_W / 2 - 0.03, SLAB_W / 2 + 0.05, zs - 0.03, zs, y(sy0), y(sy0 + SLAB_H), PALE)
}

export function fontainePastorale(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
