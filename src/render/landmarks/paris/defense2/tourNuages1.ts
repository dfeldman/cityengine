/**
 * Tour Nuages 1 (Nanterre, Émile Aillaud, 1972-78, 100 m, 39 storeys of flats; OSM way/67865771, no parts): one of
 * Aillaud's cloud towers on OSM's rounded lobed ring, pale render with a warmer pink-grey mosaic cast, small scattered punched
 * windows (tight, mostly wall), a low dark entrance base and a flat concrete roof. From memory of photographs; the
 * cloud mosaic itself is only a tint here.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 100
const LOBBY_H = 4
const WALL = '#cdbfc2', GLASS = '#2a3138', ROOF = '#8e9296', LOBBY = '#5c6266', PARAPET = '#bdb0b3'
const FLOOR = 2.7, PITCH = 2.4, SOLID = 0.65, PARAPET_H = 1.2

export const tourNuages1 = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
