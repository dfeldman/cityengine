/**
 * Meliá Paris La Défense (3 bd de Neuilly, Courbevoie; OSM way/361806048; 76.1 m BD TOPO): a glazed hotel slab on
 * OSM's ring, a charcoal-grey glass box (Panoramax: one of the few dark towers) in a fine mullion grid with a darker lobby storey and a flat
 * plant parapet. Height from local BD TOPO; colour from two Panoramax frames; fr.wikipedia gives 82.7 m.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 76.1
const LOBBY_H = 6
const GLASS = '#5d6a74', MULLION = '#8e979d', LOBBY = '#46525a', ROOF = '#9a9fa3'
const FLOOR = 3.2, PITCH = 1.5, PARAPET_H = 2.5

export const meliaParis = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3 } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(MULLION), material: 'metal' },
})
