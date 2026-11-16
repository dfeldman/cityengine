/**
 * Le Colisée (Courbevoie; OSM way/82486313, 12 levels, ~40 m from tags; not in the local BD TOPO cache): an office block
 * clad in pale beige panels with ribbon windows, standing on a two-storey base of brown polished granite (Panoramax
 * street frame of the corner). Flat roof, parapet.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40
const BASE_H = 7
const WALL = '#ddd3bf', GLASS = '#7b93a6', ROOF = '#7f7c76', GRANITE = '#7a4a3a', GRANITE_GLASS = '#3a434a', PARAPET = '#d4cab6'
const FLOOR = 3.1, SOLID = 0.5, PARAPET_H = 1.2

export const leColisee = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: BASE_H, face: { kind: 'punched', wall: hex(GRANITE), glass: hex(GRANITE_GLASS), floor: BASE_H / 2, pitch: 3, solid: 0.45, material: 'granite' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})