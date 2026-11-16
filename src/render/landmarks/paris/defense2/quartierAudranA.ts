/**
 * quartierAudran A — Quartier Audran, Courbevoie (OSM way/82467009): one of a pair of square point blocks of flats, white
 * rendered concrete with a grid of dark punched windows (Panoramax frames along rue Louis Blanc), dark glazed ground
 * floor. Height 44.4 m from the local BD TOPO cache (OSM's 56 m is too tall). Recipe shared with its twin.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 44.4
const WALL = '#ecebe6', WINDOW = '#4d555c', LOBBY = '#5a5b5c', ROOF = '#8e8d89'
const FLOOR = 2.6, PITCH = 2.7, SOLID = 0.48, LOBBY_H = 4

export const quartierAudranA = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex('#3e4548'), floor: LOBBY_H, pitch: 3 } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(WINDOW), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: 1.2, colour: hex(WALL) },
})
