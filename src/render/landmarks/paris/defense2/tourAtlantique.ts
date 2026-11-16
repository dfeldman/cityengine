/**
 * Tour Atlantique (Courbevoie, 1970, 106 m, 27 storeys of offices; OSM way/19446485, no parts): a plain flat-topped
 * slab in smoked bronze-grey curtain glass with fine continuous silver-grey vertical mullions, a recessed glazed
 * lobby and a low plant parapet. Ref: Commons "1972-10 Tours Atlantique et Crédit Lyonnais.jpg" (the darker slab);
 * the glass is kept a sky-lit grey rather than black.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 106
const LOBBY_H = 6
const MULLION = '#aeb2b3', GLASS = '#767b7f', ROOF = '#6a6e72', LOBBY = '#2c3338', LOBBY_WALL = '#7d8286', PARAPET = '#8a8e91'
const FLOOR = 3.6, PITCH = 1.4, FIN_DEPTH = 0.15, FIN_SOLID = 0.12, PARAPET_H = 2.5

export const tourAtlantique = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'fins', continuous: true, wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: FIN_SOLID, depth: FIN_DEPTH, material: 'metal' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
