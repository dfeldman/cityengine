/**
 * Apollonia (Courbevoie, 12 levels, ~40 m; OSM way/82486240, no parts): an office block on OSM's ring, pale stone-grey
 * spandrel bands with ribbon glazing, a recessed glazed ground floor and a flat roof with a low parapet.
 * From tags and footprint; the tone is a guess to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40
const LOBBY_H = 4.5
const WALL = '#b9b6ae', GLASS = '#46586a', ROOF = '#75777a', LOBBY = '#34414d', PARAPET = '#a7a59f'
const FLOOR = 3.3, PITCH = 1.8, SOLID = 0.3, PARAPET_H = 1

export const apollonia = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
