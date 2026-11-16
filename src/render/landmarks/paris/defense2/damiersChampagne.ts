/**
 * Les Damiers de Champagne (Courbevoie, 1977, 18 storeys ~56 m; BD TOPO has only its 17.6 m wing; OSM way/82467024).
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
const STOREYS = 18, FLOOR = 3.1, SOLID = 0.42
/** the OSM ring, paris-centre x,z */
const RING: P2[] = [[-5744.6,3268.2],[-5759.7,3275.4],[-5787.1,3288.6],[-5790.1,3282.3],[-5791.2,3280.0],[-5792.3,3277.8],[-5812.6,3235.8],[-5813.7,3233.4],[-5820.5,3236.7],[-5823.9,3238.3],[-5827.2,3239.9],[-5826.0,3242.3],[-5825.1,3244.3],[-5822.7,3249.2],[-5818.3,3258.5],[-5815.8,3263.6],[-5805.8,3284.3],[-5804.7,3286.5],[-5803.6,3288.8],[-5800.3,3295.7],[-5798.3,3300.0],[-5794.0,3308.7],[-5792.8,3308.2],[-5779.7,3301.8],[-5750.3,3287.7],[-5738.0,3281.8]]
/** terraces: which faces step back, from which storey, how far per storey (tunable, from photographs) */
const STEPS: Step[] = [{ bearing: 115, from: 5, run: 1.5 }, { bearing: 205, from: 8, run: 2.2 }, { bearing: 25, from: 11, run: 2.2 }]
const PASSAGES: Passage[] = []

export const damiersChampagne = (out: MeshBuilder, fit: Fit): void => stack(out, fit, {
  ring: RING, storeys: STOREYS, floor: FLOOR, solid: SOLID, wall: WALL, glass: GLASS, roof: ROOF, planter: PLANTER,
  steps: STEPS, passages: PASSAGES, soffit: LOBBY, baseY: -0.5, lobby: { height: FLOOR, colour: LOBBY },
})
