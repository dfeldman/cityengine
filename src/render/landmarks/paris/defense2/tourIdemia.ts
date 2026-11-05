/**
 * Tour IDEMIA (Courbevoie, ex Tour T2, ~43 m, 13 levels of offices; OSM way/82486078, no parts): a low glass slab on OSM's
 * ring, blue-grey curtain wall with pale floor bands, a recessed glazed lobby and a flat plant parapet. From tags and footprint.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 43
const LOBBY_H = 5
const WALL = '#8a949a', GLASS = '#3c5566', ROOF = '#666b6e', LOBBY = '#26343d', LOBBY_WALL = '#59636a', PARAPET = '#7a8085'
const FLOOR = 3.1, PITCH = 1.5, PARAPET_H = 2

export const tourIdemia = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
