/**
 * Tour Nuages 2 (Nanterre, Émile Aillaud, 1972-78, 105 m, 39 storeys of flats; OSM way/67865482, no parts): one of
 * Aillaud's cloud towers on OSM's rounded lobed ring, pale render with a sky-blue mosaic cast, small scattered punched
 * windows (tight, mostly wall), a low dark entrance base and a flat concrete roof. From memory of photographs; the
 * cloud mosaic itself is only a tint here.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 105
const LOBBY_H = 4
const WALL = '#b9c9d6', GLASS = '#2a3138', ROOF = '#8e9296', LOBBY = '#5c6266', PARAPET = '#a9b8c4'
const FLOOR = 2.7, PITCH = 2.4, SOLID = 0.65, PARAPET_H = 1.2

export const tourNuages2 = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
