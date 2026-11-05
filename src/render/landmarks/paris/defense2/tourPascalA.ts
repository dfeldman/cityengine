/**
 * Tour Pascal A (Courbevoie, 1983, ~59 m, 18 storeys of offices; OSM way/61118185, no parts): the shorter sibling of
 * Pascal B, same family of plain shaft on OSM's ring with ribbon glazing, here a lighter stone-grey spandrel.
 * From tags and the sibling's recipe; tones are unchecked against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 59
const LOBBY_H = 5
const WALL = '#9a9e9f', GLASS = '#46596a', ROOF = '#5d6368', LOBBY = '#23292d', LOBBY_WALL = '#555b60', PARAPET = '#767c80'
const FLOOR = 3.2, PITCH = 1.6, SOLID = 0.25, PARAPET_H = 2.5

export const tourPascalA = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
