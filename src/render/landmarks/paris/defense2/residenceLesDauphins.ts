/**
 * Résidence Les Dauphins (CH3, 1974, Chesneau & Verola, 15 levels; OSM way/82486104): pale precast flats with
 * deep continuous balcony bands over dark glazing, a dark ground floor and a thin parapet. BD TOPO h 37.5 m at the
 * centroid is a low wing; fr.wikipedia's list gives 50 m / 15 levels, used here.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 48, LOBBY_H = 4, FLOOR = 2.95, SOLID = 0.4, PARAPET_H = 1.1
const BALCONY = '#dcd8cc', WINDOW = '#4f5961', LOBBY = '#383d42', ROOF = '#8a8b88', PARAPET = '#cfcbc0'

export const residenceLesDauphins = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex(LOBBY), floor: LOBBY_H, pitch: 4 } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(BALCONY), glass: hex(WINDOW), floor: FLOOR, solid: SOLID, depth: 0.5, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'concrete' },
})
