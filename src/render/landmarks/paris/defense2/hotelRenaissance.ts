/**
 * Hôtel Renaissance Paris La Defense (60 cours Valmy, Puteaux, 10 levels, 43 m, architects Andrault and Parat;
 * OSM way/68851427, no parts): a 1970s-80s hotel slab on OSM's 6-point ring, pale concrete with dark window bands,
 * a recessed dark glazed lobby and a flat parapet. From the tags and footprint only: check tone against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 43
const LOBBY_H = 5
const WALL = '#cfc8ba', GLASS = '#3d4a54', ROOF = '#66645f', LOBBY = '#2b3237', PARAPET = '#b9b2a4'
const FLOOR = 3.8, PITCH = 3.0, SOLID = 0.9, PARAPET_H = 1.0

export const hotelRenaissance = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
