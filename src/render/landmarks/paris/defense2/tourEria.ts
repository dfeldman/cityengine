/**
 * Tour Eria (Puteaux, Campus Cyber, 13 levels, 60 m; OSM way/68849364, no parts): an office tower on OSM's ring,
 * a blue-grey glazed curtain wall with thin metal mullions, a recessed glazed lobby and a flat roof with a low parapet.
 * From tags and footprint; the tone is a guess to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 60
const LOBBY_H = 6
const WALL = '#6f7a84', GLASS = '#3d5468', ROOF = '#70747a', LOBBY = '#2f3b46', PARAPET = '#80858b'
const FLOOR = 4.2, PITCH = 1.5, SOLID = 0.25, PARAPET_H = 1.2

export const tourEria = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
