/**
 * Résidence Louis Pouey (Puteaux; OSM way/50004059, 16 levels; BD TOPO h 42.6 m): a plain white rendered slab with flush
 * punched windows in tight rows and a dark recessed ground floor (Panoramax street frames). Flat roof, thin parapet.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 42.6
const LOBBY_H = 3.6
const WALL = '#ecebe6', GLASS = '#6f8292', ROOF = '#9a9892', LOBBY = '#4a4f53', PARAPET = '#e2e1db'
const FLOOR = 2.45, PITCH = 2.6, SOLID = 0.45, PARAPET_H = 0.9

export const residenceLouisPouey = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex(GLASS), floor: LOBBY_H, pitch: 3, material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})