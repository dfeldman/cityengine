/**
 * Manhattan square (Courbevoie, 16 levels, ~53 m; OSM way/82467079, no parts, cadastre outline): a long, slightly bent
 * 1970s block on OSM's ring. Grey-beige precast panels with continuous dark window strips, a dark recessed ground
 * floor and a low parapet. From tags and footprint; the tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 53
const LOBBY_H = 4.5
const WALL = '#bdb8ae', GLASS = '#3f4a54', ROOF = '#7d7a76', LOBBY = '#35393d', PARAPET = '#a8a39a'
const FLOOR = 3.1, SOLID = 0.5, PARAPET_H = 1

export const manhattanSquare = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: SOLID, depth: 0.4, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
