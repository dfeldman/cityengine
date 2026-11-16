/**
 * Tour Enedis = Tour Blanche (34 place des Corolles, 1967, renovated 2012–14, Enedis HQ since 2014; OSM way/82466967).
 * BD TOPO h 92 m. Name says it: white — photo fr.wikipedia File:Tour_Blanche_Aout_2022_2.jpeg: plain white grid of small punched windows.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 92, LOBBY_H = 7
const BLADE = '#eceae4', GLASS = '#7f8f9a', ROOF = '#8c8d8b', LOBBY = '#56636c', PARAPET = '#e6e4de'
const FLOOR = 3.4, PITCH = 1.5, SOLID = 0.5, BLADE_DEPTH = 0.2, CROWN_H = 1.5

export const tourEnedis = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(BLADE), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3.4, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(BLADE), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, depth: BLADE_DEPTH, material: 'concrete' } }],
  crown: { kind: 'parapet', height: CROWN_H, colour: hex(PARAPET), material: 'metal' },
})
