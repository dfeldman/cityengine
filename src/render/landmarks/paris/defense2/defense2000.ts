/**
 * Tour Défense 2000 (Puteaux, 1974, 134 m, 47 storeys of flats; OSM way/68852619, no parts): a plain slab on OSM's ring in
 * dark bronze-smoked glass, ribbon windows between thin dark spandrels, a recessed dark lobby and a flat plant parapet.
 * From memory of photographs: the tone (near-black brown) is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 134
const LOBBY_H = 6
const WALL = '#2e2925', GLASS = '#1a1c1e', ROOF = '#45413d', LOBBY = '#1f2224', PARAPET = '#3a3633'
const FLOOR = 2.85, PITCH = 1.8, SOLID = 0.3, PARAPET_H = 3

export const defense2000 = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
