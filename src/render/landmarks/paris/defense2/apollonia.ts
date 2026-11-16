/**
 * Apollonia (Courbevoie, 12 levels; OSM way/82486240, 77-node curved ring): a white office block read from a Panoramax
 * street frame as continuous white horizontal spandrel bands sweeping round rounded corners, with dark-blue ribbon
 * glazing between, a darker glazed ground floor under the first band and a thin white parapet.
 * Height 40 m (12 levels x ~3.3 m; not in the local BD TOPO cache tiles).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40, LOBBY_H = 4.5, FLOOR = 3.3, BAND_SHARE = 0.48, PARAPET_H = 1.2
const BAND = '#eceae4', RIBBON = '#56687a', LOBBY = '#3e4b56', LOBBY_WALL = '#d9d7d0', ROOF = '#8a8c8e'

export const apollonia = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 2.4, material: 'glass' }, canopy: { depth: 0.8, colour: hex(BAND) } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(BAND), glass: hex(RIBBON), floor: FLOOR, solid: BAND_SHARE, material: 'metal' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(BAND), material: 'metal' },
})
