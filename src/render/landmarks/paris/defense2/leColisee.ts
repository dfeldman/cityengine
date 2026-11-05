/**
 * Le Colisée (Courbevoie, ~40 m, 12 levels of offices; OSM way/82486313, no parts, cadastre 2010): a broad slab on OSM's
 * ring, pale stone-grey spandrels with ribbon glazing, a recessed dark lobby and a flat plant parapet. From tags and footprint.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40
const LOBBY_H = 5
const WALL = '#b3b0a8', GLASS = '#44545e', ROOF = '#6a6d6e', LOBBY = '#2a343b', LOBBY_WALL = '#7d7f7d', PARAPET = '#8d8f8e'
const FLOOR = 3.1, PITCH = 1.6, PARAPET_H = 1.8

export const leColisee = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
