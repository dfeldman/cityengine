/**
 * Tour Initiale (ex Tour Nobel, 1966, Jean de Mailly; reclad 2003; OSM way/79864257, no parts): a slim slab of warm
 * bronze-gold glass in a fine dark grid, the top floors a darker plant band. Source: fr.wikipedia page photo
 * Tour_Initiale_Juin_2020.jpeg; height IGN BD TOPO batiment.hauteur 107.5 m (Wikipedia 109 m).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 107.5
const LOBBY_H = 7
const GLASS = '#9a8566', GRID = '#4a3d30', ROOF = '#5a5650', LOBBY = '#2a2622', TOP = '#3c342c'
const FLOOR = 3.3, PITCH = 1.4, TOP_H = 7

export const tourInitiale = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(GRID), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [
    { to: HEIGHT - TOP_H, face: { kind: 'curtain', wall: hex(GRID), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } },
    { to: 1, face: { kind: 'curtain', wall: hex(TOP), glass: hex(GRID), floor: FLOOR, pitch: PITCH, material: 'glass' } },
  ],
  crown: { kind: 'parapet', height: 1.2, colour: hex(TOP), material: 'metal' },
})
