/**
 * Tour Initiale (ex Tour Nobel, 1966, ~109 m, La Défense's first tower; OSM way/79864257, no parts): a slim slab on
 * OSM's ring in a silver aluminium curtain wall with close vertical mullions over grey-blue glass, a recessed dark
 * glazed lobby and a flat metal plant crown. From memory of photographs; the mullion rhythm is the thing to check.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 109
const LOBBY_H = 7
const WALL = '#a9adb0', GLASS = '#4a5966', ROOF = '#6d7073', LOBBY = '#24292d', PARAPET = '#9a9ea1'
const FLOOR = 3.3, PITCH = 1.35, SOLID = 0.28, PARAPET_H = 4

export const tourInitiale = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'metal' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
