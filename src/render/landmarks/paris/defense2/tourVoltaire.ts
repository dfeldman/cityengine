/**
 * Tour Voltaire (Courbevoie, 1970s, 81 m, 22 storeys of offices; OSM way/68850347, no parts): a plain slab on OSM's
 * ring, pale concrete grid with punched blue-grey windows, a recessed dark lobby and a plant parapet.
 * From memory of photographs: the tones are the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 81
const LOBBY_H = 5
const WALL = '#c4c0b6', GLASS = '#56687a', ROOF = '#6e6c68', LOBBY = '#2a2d30', PARAPET = '#98958e'
const FLOOR = 3.5, PITCH = 2.2, SOLID = 0.35, PARAPET_H = 2.5

export const tourVoltaire = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
