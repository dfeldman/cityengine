/**
 * Résidence Égalité (Nanterre, 144 rue Salvador Allende, architect Jacques Kalisz, 18 levels, 57 m; OSM way/50783214, no
 * parts): one large irregular block, ~80 x 135 m, on OSM's ring. Pale concrete with continuous balcony bands and dark
 * window strips, a dark recessed ground floor and a flat parapet. From tags and footprint; the tone is the thing to check.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 57
const LOBBY_H = 5
const WALL = '#cfc8ba', GLASS = '#505a64', ROOF = '#8a8782', LOBBY = '#3a3f44', PARAPET = '#b8b2a6'
const FLOOR = 3.1, SOLID = 0.55, PARAPET_H = 1.1

export const egalite = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: SOLID, depth: 0.5, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
