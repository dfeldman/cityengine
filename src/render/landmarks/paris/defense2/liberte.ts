/**
 * Liberté (Puteaux, Jacques Kalisz's Liberté-Égalité-Fraternité residential group; OSM way/552869771; 54.5 m BD TOPO,
 * OSM's 69 m is too tall): a long block of flats on OSM's ring, pale off-white concrete with continuous balcony
 * slabs and darker window strips, a recessed dark ground floor. Height from local BD TOPO; tone not photo-checked.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 54.5
const LOBBY_H = 4
const WALL = '#e2ded5', WINDOW = '#76848c', LOBBY = '#4c4d4c', ROOF = '#8f8f8b'
const FLOOR = 2.9, SOLID = 0.42, DEPTH = 0.9, PARAPET_H = 1.2

export const liberte = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex('#3c4448'), floor: LOBBY_H, pitch: 3 } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(WINDOW), floor: FLOOR, solid: SOLID, depth: DEPTH } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(WALL) },
})
