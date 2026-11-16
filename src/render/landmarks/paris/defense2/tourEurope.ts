/**
 * Tour Europe (Courbevoie, 1969, 28 storeys; OSM way/82468216). BD TOPO h 96.8 m. One of the 1970s quartet with
 * Atlantique/Franklin (ladefense.fr/en/tour/europe); photo fr.wikipedia File:Tour_Europe_Aout_2022.jpeg: a pale grey-beige precast grid of small square windows; facade of pale precast concrete diamond-section mullions that shed
 * rain off grey-silver glass — a light tower, not a dark one. Shaft + slightly recessed plant floor + parapet.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower, type Face } from '../../tower.ts'

const HEIGHT = 96.8, LOBBY_H = 6, PLANT_H = 4, PLANT_INSET = 1.2
const MULLION = '#c8c5bc', GLASS = '#6d7b84', ROOF = '#7d7e7b', LOBBY = '#4a5258', PARAPET = '#bdbbb4', PLANT = '#9a9a96'
const FLOOR = 3.4, PITCH = 1.8, SOLID = 0.45, FIN_DEPTH = 0.3

const shaft: Face = { kind: 'punched', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, depth: FIN_DEPTH, material: 'concrete' }
export const tourEurope = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: (HEIGHT - PLANT_H) / HEIGHT, face: shaft },
    { to: 1, inset: PLANT_INSET, face: { kind: 'blank', wall: hex(PLANT), material: 'metal' } }],
  crown: { kind: 'parapet', height: 1.2, colour: hex(PARAPET), material: 'concrete' },
})
