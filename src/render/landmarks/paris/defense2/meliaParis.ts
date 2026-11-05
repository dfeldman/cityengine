/**
 * Meliá Paris La Défense (4-star hotel, 3 boulevard de Neuilly, Courbevoie; 20 levels, ~66 m; OSM way/361806048, no
 * parts): a glazed hotel slab on OSM's ring, blue-grey curtain wall in a fine mullion grid, a dark recessed lobby and a
 * flat plant parapet. From tags and footprint, not photographs.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 66
const LOBBY_H = 5
const WALL = '#8a959c', GLASS = '#4f6676', ROOF = '#6d7377', LOBBY = '#2d3438', PARAPET = '#7c8387'
const FLOOR = 3.1, PITCH = 1.6, PARAPET_H = 1.5

export const meliaParis = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
