/**
 * Tour Vista (Puteaux, 1971, 23 storeys of offices, ~79 m; OSM way/68850753, no parts): a 1970s slab on OSM's ring,
 * pale concrete spandrels with dark ribbon windows, a recessed dark lobby and a low plant parapet.
 * From memory of photographs; the concrete tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 79
const LOBBY_H = 6
const WALL = '#b9b4aa', GLASS = '#2f3a42', ROOF = '#5a5753', LOBBY = '#23282b', PARAPET = '#8f8b84'
const FLOOR = 3.3, PITCH = 1.8, SOLID = 0.35, PARAPET_H = 2.5

export const tourVista = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
