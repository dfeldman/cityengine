/**
 * Central Parc (Puteaux, residential, 20 levels; OSM way/67855365): a large block of flats on OSM's ring, terraced back
 * in its upper storeys, cream concrete with balcony bands over darker window strips, a recessed dark ground floor and a flat parapet. No local
 * BD TOPO match at the centroid, so the manifest's 66 m stands; tone and terracing from two Panoramax street photos.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 66
const LOBBY_H = 4
const WALL = '#e4ddcc', WINDOW = '#73828b', LOBBY = '#4a4b4a', ROOF = '#8e8e8a'
/** terraced upper storeys, as the Panoramax photos show: tier tops (fractions of the height) and the setback each */
const STEPS = [0.6, 0.8, 1], STEP_INSET = 5
const FLOOR = 3.0, SOLID = 0.4, DEPTH = 0.9, PARAPET_H = 1.2

export const centralParc = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex('#3c4448'), floor: LOBBY_H, pitch: 3 } },
  tiers: STEPS.map((to, i) => ({ to, inset: i ? STEP_INSET : 0, face: { kind: 'bands' as const, wall: hex(WALL), glass: hex(WINDOW), floor: FLOOR, solid: SOLID, depth: DEPTH } })),
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(WALL) },
})
