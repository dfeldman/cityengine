/**
 * La Lutèce (Courbevoie, ~40 m, 12 levels of flats; OSM way/82486102, no parts, cadastre 2010): a residential block on OSM's
 * ring, cream-grey render with punched windows and thin spandrels, a recessed dark ground floor and a flat parapet.
 * From tags and footprint; the render tone wants a street-view check.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40
const LOBBY_H = 4.5
const WALL = '#c9c3b6', GLASS = '#4a5560', ROOF = '#6d6b68', LOBBY = '#2e3438', PARAPET = '#aaa597'
const FLOOR = 3.1, PITCH = 2.6, SOLID = 0.4, PARAPET_H = 1.2

export const laLutece = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
