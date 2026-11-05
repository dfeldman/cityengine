/**
 * Tour W (Puteaux, 1967 as Tour Winterthur, 119 m, 31 storeys of offices; OSM way/50006440 PB2, no parts): a slim slab on
 * OSM's ring in dark blue-grey curtain glass with fine pale mullion and floor lines, a recessed glazed lobby and a flat
 * plant parapet. From memory of photographs; the glass tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 119
const LOBBY_H = 7
const WALL = '#6f777c', GLASS = '#2f3f4b', ROOF = '#5b5f62', LOBBY = '#23292d', LOBBY_WALL = '#4f5559', PARAPET = '#646a6e'
const FLOOR = 3.6, PITCH = 1.5, PARAPET_H = 3

export const tourW = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
