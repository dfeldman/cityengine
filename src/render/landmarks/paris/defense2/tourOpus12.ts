/**
 * Opus 12 (Puteaux, 2002, 100 m, 27 office storeys; OSM way/19449852, no parts): a slim glass shaft on OSM's ring, dark
 * blue-grey curtain glass with a fine pale grid, a glazed double-height lobby and a plain flat roof with a low plant
 * parapet. From memory of photographs; the glass tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 100
const LOBBY_H = 7
const WALL = '#8c98a0', GLASS = '#3f5666', ROOF = '#5e666b', LOBBY = '#2a3a44', LOBBY_WALL = '#59636a'
const FLOOR = 3.6, PITCH = 1.5, PARAPET_H = 2.2, PARAPET = '#6c757a'

export const tourOpus12 = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
