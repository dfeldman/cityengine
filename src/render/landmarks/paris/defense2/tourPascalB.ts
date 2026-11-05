/**
 * Tour Pascal B (Courbevoie, 1983, 95 m, 28 storeys of offices; OSM way/61118184, no parts): a plain shaft on OSM's ring
 * in blue-grey reflective ribbon glazing between slim pale-grey spandrels, a dark recessed lobby and a flat plant parapet.
 * From memory of photographs; the glass tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 95
const LOBBY_H = 6
const WALL = '#8d949a', GLASS = '#3f5666', ROOF = '#5d6368', LOBBY = '#23292d', LOBBY_WALL = '#555b60', PARAPET = '#6e757a'
const FLOOR = 3.2, PITCH = 1.6, SOLID = 0.25, PARAPET_H = 3

export const tourPascalB = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
