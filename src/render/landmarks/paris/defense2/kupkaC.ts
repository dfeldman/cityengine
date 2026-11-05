/**
 * Kupka C (Puteaux, 1990s, 40 m, 14 levels of offices; OSM way/68850222, no parts): the lower sibling of Kupka A & B on
 * a 65 x 33 m ring, read as a pale-grey stone-banded block with deep ribbon glazing, a glazed lobby and a flat parapet.
 * From OSM's tags and ring; tones are from memory of photographs, unchecked against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40
const LOBBY_H = 4.5
const WALL = '#aeb2b3', GLASS = '#4a6c78', ROOF = '#666b6d', LOBBY = '#2d3d44', LOBBY_WALL = '#7d8587', PARAPET = '#8c9193'
const FLOOR = 2.8, PITCH = 1.6, SOLID = 0.4, PARAPET_H = 1.4

export const kupkaC = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
