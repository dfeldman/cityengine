/**
 * Tour PB5 (Puteaux, ex-Tour Scor, 60 m office tower; OSM way/50008592, no parts): a slab on OSM's ring,
 * a pale grey-blue curtain wall with ribbon glazing, a recessed glazed lobby and a flat roof with a low parapet.
 * From tags and footprint; the tone is a guess to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 60
const LOBBY_H = 6
const WALL = '#8a9096', GLASS = '#4a6075', ROOF = '#6e7276', LOBBY = '#2f3b46', PARAPET = '#7c8186'
const FLOOR = 3.9, PITCH = 1.5, SOLID = 0.3, PARAPET_H = 1.2

export const tourPb5 = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
