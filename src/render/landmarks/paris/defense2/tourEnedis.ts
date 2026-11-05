/**
 * Tour Enedis, once Tour Aquitaine, "Tour Blanche" (Courbevoie, 1967, 99 m, 27 storeys of offices; OSM way/82466967 CB15,
 * no parts): a square shaft on OSM's ring in white precast, continuous white vertical fins with dark glazing recessed
 * between, a dark glazed lobby and a flat white parapet. From memory of photographs; the fin pitch is the thing to check.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 99
const LOBBY_H = 6
const WALL = '#e6e4de', GLASS = '#2b3a46', ROOF = '#c9c8c3', LOBBY = '#23292d', LOBBY_WALL = '#cfcdc7', PARAPET = '#dcdad4'
const FLOOR = 3.5, PITCH = 1.6, SOLID = 0.45, FIN_DEPTH = 0.45, PARAPET_H = 2.5

export const tourEnedis = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'fins', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, depth: FIN_DEPTH, continuous: true, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'concrete' },
})
