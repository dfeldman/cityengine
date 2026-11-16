/**
 * Résidence du Parc (Courbevoie, apart-hotel; OSM way/82486094, 14 levels; BD TOPO h 29.5 m at the centroid, likely a
 * low wing, so the 14 levels set ~42 m): a curved white tower with a rounded end, a balcony slab every floor and pale
 * glazing; a setback attic floor (Panoramax street frame). Balconies are per-floor cornices.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 42
const LOBBY_H = 4.5
const WALL = '#efeee9', GLASS = '#8da0ae', ROOF = '#9c9a94', LOBBY = '#59636a', SLAB = '#f5f4f0'
const FLOOR = 2.8, BALCONY = 1.1, SLAB_H = 0.28, ATTIC = 0.94, ATTIC_IN = 1.5

const balconies = () => Array.from({ length: Math.floor((HEIGHT * ATTIC - LOBBY_H) / FLOOR) }, (_, i) =>
  ({ at: LOBBY_H + FLOOR * (i + 1), depth: BALCONY, height: SLAB_H, colour: hex(SLAB) }))

export const residenceDuParc = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex(GLASS), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [
    { to: ATTIC, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: 0.4, material: 'concrete' } },
    { to: 1, inset: ATTIC_IN, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: 0.4, material: 'concrete' } },
  ],
  cornices: balconies(),
  crown: { kind: 'parapet', height: 1, colour: hex(SLAB) },
})