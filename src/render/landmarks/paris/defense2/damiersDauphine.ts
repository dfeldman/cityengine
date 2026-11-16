/**
 * Les Damiers du Dauphiné (Courbevoie, 1976, 23 storeys ~72 m, the tallest of the four; OSM way/82467066).
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
const STOREYS = 23, FLOOR = 3.1, SOLID = 0.42
/** the OSM ring, paris-centre x,z */
const RING: P2[] = [[-5873.1,3311.6],[-5872.7,3312.4],[-5872.6,3312.7],[-5871.8,3314.3],[-5864.2,3330.1],[-5857.5,3343.9],[-5856.3,3346.6],[-5834.2,3335.9],[-5816.1,3327.2],[-5802.0,3320.4],[-5800.1,3324.4],[-5795.5,3333.9],[-5803.2,3337.5],[-5804.4,3338.1],[-5806.9,3339.4],[-5809.4,3340.5],[-5811.9,3341.7],[-5825.5,3348.3],[-5859.1,3364.5],[-5863.4,3366.5],[-5873.8,3344.8],[-5874.7,3343.0],[-5885.4,3320.8],[-5886.7,3318.1]]
/** terraces: which faces step back, from which storey, how far per storey (tunable, from photographs) */
const STEPS: Step[] = [{ bearing: 115, from: 7, run: 1.3 }, { bearing: 295, from: 12, run: 1.0 }, { bearing: 25, from: 10, run: 2.0 }]
const PASSAGES: Passage[] = []

export const damiersDauphine = (out: MeshBuilder, fit: Fit): void => stack(out, fit, {
  ring: RING, storeys: STOREYS, floor: FLOOR, solid: SOLID, wall: WALL, glass: GLASS, roof: ROOF, planter: PLANTER,
  steps: STEPS, passages: PASSAGES, soffit: LOBBY, baseY: -0.5, lobby: { height: FLOOR, colour: LOBBY },
})
