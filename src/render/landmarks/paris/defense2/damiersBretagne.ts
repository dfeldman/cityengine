/**
 * Les Damiers de Bretagne (Courbevoie, 1975-78, brutalist, 12 storeys of flats, ~40 m; OSM way/82467091 ref CH34, no
 * parts): the low sibling of the Damiers family, a chequerboard slab on OSM's ring in pale concrete panels and dark
 * glass squares. From tags and footprint, memory of photographs; square size and tones are tunable.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40
const LOBBY_H = 4.5
const WALL = '#c4bcab', GLASS = '#2b3136', ROOF = '#5a5650', LOBBY = '#2a2b2b', PARAPET = '#a29a88'
const FLOOR = 3.2, PITCH = 5.5, SOLID = 0.5, PARAPET_H = 1.8

export const damiersBretagne = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
