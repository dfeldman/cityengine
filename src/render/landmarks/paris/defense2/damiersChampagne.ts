/**
 * Les Damiers de Champagne (Courbevoie, 1970s, 18 storeys of flats, ~59 m; OSM way/82467024 ref CH33, no parts): a
 * stepped-chequerboard slab on OSM's ring like its Dauphiné sibling, in warmer champagne panels and dark glass squares.
 * From tags and footprint, memory of photographs; square size and tones are tunable.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 59
const LOBBY_H = 5
const WALL = '#cdbf9f', GLASS = '#2a3238', ROOF = '#5a5650', LOBBY = '#2a2b2b', PARAPET = '#a29880'
const FLOOR = 6.2, PITCH = 6, SOLID = 0.5, PARAPET_H = 2.2

export const damiersChampagne = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
