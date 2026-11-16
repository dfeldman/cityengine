/**
 * Tour W (Puteaux, ex-Tour Winterthur, 1974, 119 m; OSM way/50006440, no parts). One of La Défense's few genuinely DARK
 * towers: a plain box of navy-black reflective curtain glass on a tight square grid with thin dark mullions, a flat top
 * with a slim parapet, a dark glazed lobby on the dalle. Reference: fr.wikipedia "Tour W" page image
 * (Tour_W_Septembre_2022.jpeg). Height from Wikipedia (BD TOPO/MNS queries returned nothing here).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 119
const LOBBY_H = 6
const GLASS = '#26364a', MULLION = '#323d4a', ROOF = '#4a4f55', LOBBY = '#1c2229', LOBBY_WALL = '#2c333b', PARAPET = '#2f3945'
const FLOOR = 3.5, PITCH = 1.5, PARAPET_H = 2

export const tourW = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'glass' },
})
