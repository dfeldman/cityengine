/**
 * Résidence Maréchal Leclerc (CH1, 1974, Badani & Roux-Dorlut, 18 levels, 55 m; OSM way/82486286): a pale concrete
 * flats slab whose continuous balcony slabs read as white horizontal stripes over recessed dark window bands, on a
 * dark recessed ground floor at dalle level. Height and levels from fr.wikipedia's list of La Défense buildings.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 55, LOBBY_H = 4, FLOOR = 3, SOLID = 0.45, PARAPET_H = 1.2
const BALCONY = '#e4e1d8', WINDOW = '#56616a', LOBBY = '#3a4045', ROOF = '#8d8f8e', PARAPET = '#d8d5cc'

export const residenceMarechalLeclerc = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex(LOBBY), floor: LOBBY_H, pitch: 4 } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(BALCONY), glass: hex(WINDOW), floor: FLOOR, solid: SOLID, depth: 0.6, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'concrete' },
})
