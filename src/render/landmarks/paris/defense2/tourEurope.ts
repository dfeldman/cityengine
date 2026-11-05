/**
 * Tour Europe (Courbevoie, 1969, 99 m, 28 storeys of offices, brutalist; OSM way/82468216 CB14, no parts): a plain
 * shaft on OSM's ring in bronze-grey glass with pale concrete spandrel bands, a recessed dark lobby and a flat plant
 * parapet. From memory of photographs; the glass tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 99
const LOBBY_H = 6
const WALL = '#8a8883', GLASS = '#3a4a52', ROOF = '#5d5e5c', LOBBY = '#25292b', LOBBY_WALL = '#5a5b59', PARAPET = '#6d6e6b'
const FLOOR = 3.5, PITCH = 1.7, PARAPET_H = 2.5

export const tourEurope = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
