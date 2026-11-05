/**
 * Les Damiers d'Anjou (Courbevoie, 1978, 12 storeys of flats, ~40 m; OSM way/82467023 ref CH35, no parts, architects
 * Binoux and Folliasson): the stepped chequerboard slab of the Damiers family, in pale concrete panels and dark glass
 * squares on OSM's ring. From tags and footprint; square size and tones are tunable.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40
const LOBBY_H = 5
const WALL = '#c4bfb2', GLASS = '#2a3238', ROOF = '#5a5650', LOBBY = '#2a2b2b', PARAPET = '#a8a396'
const FLOOR = 3.1, PITCH = 3.1, SOLID = 0.5, PARAPET_H = 1.5
/** Terraces: OSM has one 12-level way and no parts, so the setbacks are from photographs (Binoux & Folliasson ziggurat). */
const STEP_AT = [0.5, 0.75], STEP_INSET = 2.2

export const damiersAnjou = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [
    { to: STEP_AT[0], face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } },
    { to: STEP_AT[1], inset: STEP_INSET, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } },
    { to: 1, inset: STEP_INSET, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } },
  ],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
