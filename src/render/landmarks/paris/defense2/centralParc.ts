/**
 * Central Parc (Résidence Central Parc, MH6; Jacques Kalisz, Puteaux; 20 levels, ~66 m; OSM way/67855365, no parts): the
 * large residential block on OSM's ring, pale warm concrete with punched windows, a dark recessed ground floor and a
 * flat parapet. From tags and footprint, not photographs.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 66
const LOBBY_H = 5
const WALL = '#cfc6b8', GLASS = '#56626b', ROOF = '#8f8c86', LOBBY = '#3b3e40', PARAPET = '#bfb6a8'
const FLOOR = 3.1, PITCH = 3.2, SOLID = 0.8, PARAPET_H = 1.2

export const centralParc = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
