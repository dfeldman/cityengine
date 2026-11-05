/**
 * Tour Exaltis Mazars (Courbevoie/Puteaux, 2012, 70 m, 16 levels; OSM way/82468241, no parts): the Mazars HQ on OSM's
 * ring, a grey-blue glass skin with thin pale spandrel bands floor by floor, a glazed lobby and a two-step roof
 * terrace. OSM tags a skillion roof; the stepped crown stands in for it. From memory of photographs.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 70
const LOBBY_H = 6
const BAND = '#c9ccce', GLASS = '#5f7482', ROOF = '#8b8f92', LOBBY = '#4d5f6b', CROWN = '#aeb3b6'
const FLOOR = 4.0, SOLID = 0.3, DEPTH = 0.3
const STEPS = 2, CROWN_H = 5, CROWN_INSET = 3

export const exaltis = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(BAND), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3 } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(BAND), glass: hex(GLASS), floor: FLOOR, solid: SOLID, depth: DEPTH, material: 'metal' } }],
  crown: { kind: 'stepped', steps: STEPS, height: CROWN_H, inset: CROWN_INSET, face: { kind: 'blank', wall: hex(CROWN), material: 'metal' } },
})
