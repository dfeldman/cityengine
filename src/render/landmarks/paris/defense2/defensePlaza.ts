/**
 * Défense Plaza (Puteaux, ~50 m, 12 levels of offices; OSM way/68849380, no parts): one slab on OSM's ring, read as pale
 * grey-beige cladding with continuous dark ribbon windows, a glazed revolving-door lobby and a low plant parapet.
 * From OSM's tags (height 50, levels 12) and memory of photographs; tones unchecked against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 50
const LOBBY_H = 5
const WALL = '#b9b4a8', GLASS = '#3c4650', ROOF = '#6a6761', LOBBY = '#2a3238', LOBBY_WALL = '#8a867d', PARAPET = '#8f8b83'
const FLOOR = 3.75, PITCH = 1.8, SOLID = 0.4, PARAPET_H = 1.5

export const defensePlaza = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
