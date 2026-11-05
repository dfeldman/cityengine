/**
 * Résidence Les Dauphins (Puteaux/Courbevoie, 1970s, 15 levels, 50 m; OSM way/82486104, no parts, ref CH3): a plain
 * residential slab on OSM's ring, pale precast concrete with ribbon windows, a recessed dark ground floor, flat roof.
 * From tags and footprint; the pale tone is a guess to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 50
const LOBBY_H = 4
const WALL = '#cfc8bb', GLASS = '#4a5560', ROOF = '#8a8782', LOBBY = '#3a3d40', PARAPET = '#b5afa4'
const FLOOR = 3.1, PITCH = 2.2, SOLID = 0.4, PARAPET_H = 1

export const residenceLesDauphins = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
