/**
 * Canopy (9 quai Paul Doumer, Courbevoie; ex-Calyon / CACIB offices, 12 levels, ~40 m; OSM way/82467083, no parts):
 * a glass-skinned office block on OSM's irregular ring, pale-green-blue curtain wall with thin metal mullions, a
 * recessed glazed ground floor and a low plant parapet. From tags and footprint; the glass tint is the thing to check.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40
const LOBBY_H = 5
const WALL = '#aeb8bb', GLASS = '#6f8f9a', ROOF = '#8d9294', LOBBY = '#34454d', LOBBY_WALL = '#5a6469', PARAPET = '#a4a9ab'
const FLOOR = 3.3, PITCH = 1.5, PARAPET_H = 1.5

export const canopy = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
