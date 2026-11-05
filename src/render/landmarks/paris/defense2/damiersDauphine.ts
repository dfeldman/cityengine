/**
 * Les Damiers du Dauphiné (Courbevoie, 1970s, 23 storeys of offices, ~76 m; OSM way/82467066, no parts): a slab on OSM's
 * ring whose facade is a chequerboard (damier) of pale concrete panels and dark glass squares, two storeys by two bays
 * per square. A dark recessed lobby and a plain parapet. From memory of photographs; square size and tones are tunable.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 76
const LOBBY_H = 6
const WALL = '#c4bfb4', GLASS = '#232c33', ROOF = '#55524e', LOBBY = '#23282b', PARAPET = '#98948c'
const FLOOR = 6.2, PITCH = 6, SOLID = 0.5, PARAPET_H = 2.5

export const damiersDauphine = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
