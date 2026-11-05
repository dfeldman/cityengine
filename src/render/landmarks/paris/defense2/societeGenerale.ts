/**
 * Société générale, La Défense (Courbevoie/Puteaux, 37 m; OSM way/226235093, no parts; wikipedia: Tours Chassagne et Alicante).
 * Pale glass curtain wall (OSM facade colour #A2E1FA) in narrow bays on OSM's ring, a darker glazed lobby, flat roof.
 * From OSM's tags and ring; the mullion tone is guessed.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 37
const LOBBY_H = 5
const GLASS = '#a2e1fa', MULLION = '#7f9fae', LOBBY = '#3b5360', LOBBY_WALL = '#b9c4c9', ROOF = '#8a9296', PARAPET = '#aab6bb'
const FLOOR = 3.5, PITCH = 1.5, PARAPET_H = 0.8

export const societeGenerale = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
