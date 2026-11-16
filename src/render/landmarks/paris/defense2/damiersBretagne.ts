/**
 * Les Damiers de Bretagne (Courbevoie, 1978, 12 storeys, 36 m BD TOPO; OSM way/82467091): a long stepped housing block.
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
const RING: P2[] = [[-5782.0,3179.0],[-5774.7,3194.1],[-5772.0,3199.7],[-5769.7,3204.6],[-5771.6,3205.5],[-5769.6,3209.7],[-5768.6,3209.3],[-5763.0,3206.6],[-5757.3,3203.9],[-5741.0,3196.0],[-5740.2,3195.6],[-5735.3,3205.7],[-5736.2,3206.1],[-5739.6,3207.7],[-5741.1,3208.4],[-5743.9,3209.8],[-5744.4,3210.0],[-5744.9,3210.2],[-5749.4,3212.4],[-5749.9,3212.7],[-5752.5,3213.9],[-5753.9,3214.6],[-5758.2,3216.6],[-5762.8,3218.9],[-5763.4,3219.2],[-5767.3,3221.0],[-5768.3,3221.5],[-5776.1,3225.2],[-5780.9,3215.2],[-5782.9,3210.9],[-5783.9,3209.0],[-5785.0,3206.6],[-5785.2,3206.1],[-5786.6,3203.3],[-5788.0,3200.4],[-5790.7,3194.7],[-5795.5,3184.9],[-5803.7,3167.7],[-5790.5,3161.3]]
/** terraces: which faces step back, from which storey, how far per storey (tunable, from photographs) */
const STEPS: Step[] = [{ bearing: 115, from: 4, run: 1.6 }, { bearing: 205, from: 6, run: 2.4 }, { bearing: 25, from: 8, run: 2.0 }]
const PASSAGES: Passage[] = []

export const damiersBretagne = (out: MeshBuilder, fit: Fit): void => stack(out, fit, {
  ring: RING, storeys: STOREYS, floor: FLOOR, solid: SOLID, wall: WALL, glass: GLASS, roof: ROOF, planter: PLANTER,
  steps: STEPS, passages: PASSAGES, soffit: LOBBY, baseY: -0.5, lobby: { height: FLOOR, colour: LOBBY },
})
