/**
 * Le Bélier (Courbevoie, Henri Pottier, 19 levels, ~63 m; OSM way/82322950, no parts): a residential slab on OSM's
 * canted-rectangle ring, pale concrete with ribbon windows, a recessed dark ground floor and a flat parapet.
 * From tags and footprint; the tone is a guess to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 63
const LOBBY_H = 4.5
const WALL = '#cfc8bb', GLASS = '#4a5560', ROOF = '#8d8a84', LOBBY = '#3a3836', PARAPET = '#b9b2a6'
const FLOOR = 3.1, PITCH = 2.6, SOLID = 0.45, PARAPET_H = 1.2

export const leBelier = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
