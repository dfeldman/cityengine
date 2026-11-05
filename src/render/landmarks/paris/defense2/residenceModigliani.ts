/**
 * Résidence Modigliani (Courbevoie, 13 levels of flats, ~43 m, architect Marc Rolinet; OSM way/82486138, no parts):
 * a 1970s-80s residential block on OSM's 12-point ring, pale render with balcony bands and dark window strips, a recessed
 * dark ground floor and a flat parapet. From the tags and footprint only: check tone against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 43
const LOBBY_H = 4
const WALL = '#d9d3c6', GLASS = '#3b4750', ROOF = '#6c6a66', LOBBY = '#2d3135', PARAPET = '#c0baad'
const FLOOR = 3.0, PITCH = 2.1, SOLID = 0.45, PARAPET_H = 1.2

export const residenceModigliani = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
