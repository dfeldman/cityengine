/**
 * Tour Gambetta (Courbevoie, 1975, 101 m, 37 storeys of flats; OSM way/82486306, no parts): a slab on OSM's ring in
 * warm grey concrete with ribbon windows between solid spandrels, a recessed dark lobby and a flat plant parapet.
 * From memory of photographs; the wall tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 101
const LOBBY_H = 6
const WALL = '#a39d92', GLASS = '#3b4348', ROOF = '#6b6862', LOBBY = '#2a2d2f', PARAPET = '#8a857c'
const FLOOR = 101 / 37, PITCH = 2.2, SOLID = 0.4, PARAPET_H = 2.5

export const tourGambetta = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
