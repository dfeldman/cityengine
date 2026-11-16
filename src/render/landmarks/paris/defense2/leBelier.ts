/**
 * Le Bélier (Courbevoie, residential; OSM way/82322950; 53.9 m BD TOPO, OSM's 63 m too tall): a slab of flats on OSM's
 * canted-rectangle ring, pale grey panels with a dense even grid of small square windows, a recessed dark ground floor
 * and a flat parapet. Height from local BD TOPO; tone from a Panoramax street photo.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 53.9
const LOBBY_H = 4
const WALL = '#cfd2d1', WINDOW = '#5f6e78', LOBBY = '#4a4a49', ROOF = '#8e8d89'
const FLOOR = 2.9, PITCH = 1.6, SOLID = 0.4, DEPTH = 0.3, PARAPET_H = 1.2

export const leBelier = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex('#3c4448'), floor: LOBBY_H, pitch: 3 } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(WINDOW), floor: FLOOR, pitch: PITCH, solid: SOLID, depth: DEPTH } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(WALL) },
})
