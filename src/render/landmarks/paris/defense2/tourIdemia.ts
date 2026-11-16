/**
 * Tour IDEMIA (Courbevoie; OSM way/82486078, 13 levels; BD TOPO h 45.6 m): a rounded office block in light blue-grey
 * reflective glass, a full curtain wall with fine silver mullions and thin floor lines, on a dark glazed base
 * (Panoramax street frames). Flat roof behind a glass-coloured parapet.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 45.6
const LOBBY_H = 5
const MULLION = '#c3cbd1', GLASS = '#8aa3b8', ROOF = '#7d8286', LOBBY = '#3d4b55', LOBBY_WALL = '#6f7a82', PARAPET = '#a9b5be'
const FLOOR = 3.3, PITCH = 1.5, PARAPET_H = 1.5

export const tourIdemia = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'glass' },
})