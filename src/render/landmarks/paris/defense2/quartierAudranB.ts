/**
 * Quartier Audran B (Courbevoie, 17 levels, ~56 m; OSM way/82467055, no parts, Bing outline): a 1970s flats block on OSM's
 * ring, sibling of Quartier Audran A. Light grey-buff concrete with continuous balcony bands and dark window strips, a
 * dark recessed ground floor and a low parapet. From tags and footprint; the tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 56
const LOBBY_H = 4.5
const WALL = '#cfc9bd', GLASS = '#4a545e', ROOF = '#7f7c77', LOBBY = '#3a3f44', PARAPET = '#b8b2a6'
const FLOOR = 3.1, SOLID = 0.55, PARAPET_H = 1.1

export const quartierAudranB = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: SOLID, depth: 0.5, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
