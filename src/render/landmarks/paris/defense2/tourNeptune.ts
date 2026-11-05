/**
 * Allianz-Neptune (Courbevoie, 1976 as Tour Neptune, 113 m, 28 storeys of offices; OSM way/82467058 CB33, no parts): a
 * faceted many-sided shaft on OSM's ring in dark blue-black curtain glass between grey spandrel bands, a recessed dark
 * glazed lobby and a flat plant parapet. From memory of photographs; the glass tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 113
const LOBBY_H = 7
const WALL = '#5d666c', GLASS = '#26343f', ROOF = '#53585b', LOBBY = '#1f262b', LOBBY_WALL = '#454c50', PARAPET = '#5e6468'
const FLOOR = 4, PITCH = 2.2, PARAPET_H = 3

export const tourNeptune = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
