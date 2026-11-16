/**
 * Hôtel Renaissance Paris La Défense (Puteaux; OSM way/68851427, 10 levels; BD TOPO h 40.7 m): a curved-front hotel of
 * beige stone piers framing tall bays of blue reflective glass, a dark glazed ground floor with a canopy, flat roof
 * (Panoramax street frame of the curved front with the RENAISSANCE HOTEL sign).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40.7
const LOBBY_H = 5.5
const STONE = '#d8ccb4', GLASS = '#5d7f9e', ROOF = '#77746e', LOBBY = '#2f383f', LOBBY_WALL = '#5b5650', CANOPY = '#3a3a3a'
const FLOOR = 3.5, PITCH = 6.5, SOLID = 0.38, DEPTH = 0.45, PARAPET_H = 1

export const hotelRenaissance = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' }, canopy: { depth: 2.5, colour: hex(CANOPY) } },
  tiers: [{ to: 1, face: { kind: 'fins', wall: hex(STONE), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, depth: DEPTH, continuous: true, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(STONE) },
})