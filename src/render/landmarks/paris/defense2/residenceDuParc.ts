/**
 * Résidence du Parc (Puteaux, ~46 m, 14 storeys, tagged building=hotel; OSM way/82486094, no parts, 45-node curved ring):
 * a curved apart-hotel block on OSM's ring, pale render with continuous balcony bands and dark window strips, a recessed
 * dark ground floor and a flat parapet. From the tags and footprint only: check tone against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 46
const LOBBY_H = 4
const WALL = '#d6d0c2', GLASS = '#3e4a54', ROOF = '#6e6c68', LOBBY = '#2c3034', PARAPET = '#bdb7aa'
const FLOOR = 3.0, PITCH = 2.0, SOLID = 0.45, PARAPET_H = 1.2

export const residenceDuParc = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
