/**
 * Résidence Modigliani (Courbevoie; OSM way/82486138, 13 levels; BD TOPO h 50.6 m): a white residential block with deep
 * balcony slabs on every floor and shops in a dark ground floor (Panoramax street frame along the boulevard). Balconies
 * are per-floor cornices.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 50.6
const LOBBY_H = 4.5
const WALL = '#eeede8', GLASS = '#7d91a0', ROOF = '#9a9892', LOBBY = '#4a4f54', SLAB = '#f4f3ef'
const FLOOR = 3.3, BALCONY = 1.2, SLAB_H = 0.3

const balconies = () => Array.from({ length: Math.floor((HEIGHT - LOBBY_H) / FLOOR) - 1 }, (_, i) =>
  ({ at: LOBBY_H + FLOOR * (i + 1), depth: BALCONY, height: SLAB_H, colour: hex(SLAB) }))

export const residenceModigliani = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex(GLASS), floor: LOBBY_H, pitch: 4, material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: 2.4, solid: 0.4, material: 'concrete' } }],
  cornices: balconies(),
  crown: { kind: 'parapet', height: 1.1, colour: hex(SLAB) },
})