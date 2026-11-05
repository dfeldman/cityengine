/**
 * Kupka A & B (Puteaux, 1990s, ~50 m, offices; OSM way/68851519, no parts): two linked glass blocks on one 35-node ring,
 * read here as a single blue-green curtain-wall shaft with horizontal spandrel bands, a glazed lobby and a low plant parapet.
 * From OSM's ring and the ~50 m brief; tones are from memory of photographs, unchecked against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 50
const LOBBY_H = 5
const WALL = '#8a9ba3', GLASS = '#3f6f7c', ROOF = '#5d6468', LOBBY = '#2b3a40', LOBBY_WALL = '#59666b', PARAPET = '#6f7a7e'
const FLOOR = 3.5, PITCH = 1.5, SOLID = 0.35, PARAPET_H = 1.8

export const kupkaAB = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
