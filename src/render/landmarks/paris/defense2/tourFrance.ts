/**
 * Tour France (Puteaux, 1970s, 126 m, 40 storeys of flats; OSM way/64220590, building:colour white, no parts): a pale
 * rounded-plan residential shaft on OSM's ring, white concrete with rows of window openings, a low dark entrance
 * storey and a flat parapet. From memory of photographs; the white tone and window rhythm are the things to check.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 126
const LOBBY_H = 6
const WALL = '#e6e4de', GLASS = '#3a4650', ROOF = '#a9a7a2', LOBBY = '#7a7873', PARAPET = '#d6d4ce'
const FLOOR = 3.15, PITCH = 3, SOLID = 0.55, PARAPET_H = 2

export const tourFrance = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
