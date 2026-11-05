/**
 * Résidence Minerve (Courbevoie, 1970s, 18 levels, ~59 m; OSM way/50011897, no parts): the residential slab on OSM's
 * ring, pale grey-beige concrete with ribbon balconies/loggia bands and dark window strips, a recessed lobby and a flat
 * parapet. From tags and footprint; the tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 59
const LOBBY_H = 5
const WALL = '#c9c2b4', GLASS = '#4a5560', ROOF = '#8d8a85', LOBBY = '#3a3f44', PARAPET = '#b4aea2'
const FLOOR = 3.1, SOLID = 0.5, PARAPET_H = 1.2

export const residenceMinerve = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: SOLID, depth: 0.5, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
