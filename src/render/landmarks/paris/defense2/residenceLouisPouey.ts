/**
 * Résidence Louis Pouey (Puteaux, 1970s, 16 levels, 50 m; OSM way/50004059, no parts): a small residential block on OSM's
 * four-sided ring, pale concrete with balcony bands and dark window strips, a recessed lobby and a flat parapet.
 * From tags and footprint; the tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 50
const LOBBY_H = 4.5
const WALL = '#cdc6b8', GLASS = '#4d5963', ROOF = '#8d8a85', LOBBY = '#3a3f44', PARAPET = '#b8b2a6'
const FLOOR = 2.9, SOLID = 0.5, PARAPET_H = 1.1

export const residenceLouisPouey = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: SOLID, depth: 0.5, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
