/**
 * Hôtel Pullman Paris La Défense (11 av. de l'Arche, 1990s, 69 m, 22 levels; OSM way/82486391, no parts): the hotel
 * slab on OSM's ring, pale grey-white cladding with continuous bands of blue-tinted ribbon windows, a glazed lobby and
 * a plain parapet. From memory of photographs.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 69
const LOBBY_H = 6
const WALL = '#d6d4cf', GLASS = '#5d7488', ROOF = '#9a9a98', LOBBY = '#4a5c68', PARAPET = '#c4c2bd'
const FLOOR = 3.0, PITCH = 3.0, SOLID = 0.45, PARAPET_H = 1.5

export const hotelPullman = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: PITCH } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: SOLID, depth: 0.2, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
