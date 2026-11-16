/**
 * La Lutèce (Courbevoie, 12 levels of flats; OSM way/82486102): read from two Panoramax street frames as a cream-white
 * residential block, continuous white balcony slabs with railings at every floor over darker recessed window walls,
 * grey vertical panels at the corners, shops behind a dark ground floor, flat parapet. Height 40 m from 12 levels
 * (not in the local BD TOPO cache tiles).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40, LOBBY_H = 4.5, FLOOR = 3.0, SLAB_SHARE = 0.38, PARAPET_H = 1.2, BALCONY = 0.9
const SLAB = '#ece6da', WINDOW = '#5b646c', LOBBY = '#353c42', LOBBY_WALL = '#cfc8ba', ROOF = '#76736e'

export const laLutece = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 4, material: 'glass' }, canopy: { depth: BALCONY, colour: hex(SLAB) } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(SLAB), glass: hex(WINDOW), floor: FLOOR, solid: SLAB_SHARE, material: 'stucco' } }],
  cornices: [3, 5, 7, 9, 11].map((f) => ({ at: LOBBY_H + f * FLOOR, depth: BALCONY, height: 0.25, colour: hex(SLAB) })),
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(SLAB) },
})
