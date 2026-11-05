/**
 * Tour CGI (Courbevoie, 1970s as the EDF-GDF tower, 117 m, 27 storeys of offices; OSM way/82466949, no parts): a slab on
 * OSM's ring in smoked bronze-grey glass with pale horizontal spandrel bands, a recessed dark lobby and a flat plant
 * parapet. From memory of photographs; the glass tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 117
const LOBBY_H = 6
const WALL = '#8a8d8e', GLASS = '#3a4650', ROOF = '#5e6264', LOBBY = '#22282c', LOBBY_WALL = '#55595c', PARAPET = '#6a6e70'
const FLOOR = 4.0, PITCH = 1.8, PARAPET_H = 3

export const tourCgi = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
