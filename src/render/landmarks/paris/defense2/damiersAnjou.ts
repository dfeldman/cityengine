/**
 * Les Damiers d'Anjou (Courbevoie, 1978, 12 storeys, 39 m BD TOPO; OSM way/82467023): an L of stepped housing whose
 * two passages stay open for the rider — Passage de Seine across the main block, Voie de l'Ancre under the west arm.
 * Drawn by damiers-kit.ts: storeys of cream balcony parapet over dark glazing, stepping back into planted terraces.
 * Sources: fr.wikipedia "Les Damiers" (storeys, architects Binoux, Folliasson, Abro, Kandjian, 1976–78); Panoramax street
 * photos round 48.890,2.252 (cream concrete bands, stepped cascading ends); local IGN BD TOPO batiment heights; OSM ring.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { stack, type Step, type Passage } from './damiers-kit.ts'
import type { P2 } from '../museums/enframe.ts'

const WALL = hex('#d9d2c2'), GLASS = hex('#4a5560'), ROOF = hex('#a39c8e'), PLANTER = hex('#5d7a45'), LOBBY = hex('#5b5650')
const STOREYS = 12, FLOOR = 3.1, SOLID = 0.42
/** the OSM ring, paris-centre x,z */
const RING: P2[] = [[-5764.9,3143.8],[-5764.6,3144.4],[-5764.0,3144.1],[-5761.4,3142.9],[-5758.8,3141.7],[-5758.4,3141.4],[-5755.4,3140.0],[-5742.9,3134.0],[-5736.4,3147.6],[-5740.2,3149.5],[-5752.3,3155.3],[-5754.9,3156.5],[-5757.4,3157.7],[-5758.8,3158.4],[-5772.1,3164.8],[-5778.9,3150.6],[-5781.9,3144.4],[-5794.3,3118.6],[-5787.6,3115.4],[-5780.3,3111.9],[-5775.6,3121.6],[-5772.6,3127.8],[-5767.9,3137.6]]
/** terraces: which faces step back, from which storey, how far per storey (tunable, from photographs) */
const STEPS: Step[] = [{ bearing: 115, from: 4, run: 1.6 }, { bearing: 205, from: 6, run: 2.4 }, { bearing: 25, from: 8, run: 2.0 }]
const PASSAGES: Passage[] = [
  // Passage de Seine: deck 7.8→8.3 m, ~7 m wide, 4 m clear
  { a: [-5761.4, 3142.9], b: [-5755.5, 3156.6], width: 7.5, floorA: 7.8, floorB: 8.3, clear: 4 },
  // Voie de l'Ancre under the west half: 3.8→2.5 m, 5 m wide, 4.5 m clear
  { a: [-5777.9, 3140.8], b: [-5771.3, 3137.7], width: 5.5, floorA: 3.8, floorB: 2.5, clear: 4.5 },
]

export const damiersAnjou = (out: MeshBuilder, fit: Fit): void => stack(out, fit, {
  ring: RING, storeys: STOREYS, floor: FLOOR, solid: SOLID, wall: WALL, glass: GLASS, roof: ROOF, planter: PLANTER,
  steps: STEPS, passages: PASSAGES, soffit: LOBBY, baseY: -0.5, lobby: { height: FLOOR, colour: LOBBY },
})
