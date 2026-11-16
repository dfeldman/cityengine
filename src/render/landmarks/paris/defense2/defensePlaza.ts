/**
 * Défense Plaza (2004, SOM with SRA, 12 levels; OSM way/68849380): a curved glass office block, pale blue-grey
 * glazing striped by light metal spandrel bands at every floor, glazed lobby. Height 50 m from BD TOPO (matches
 * fr.wikipedia's list); look from a Panoramax street frame.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 50, LOBBY_H = 6, FLOOR = 3.8, PITCH = 1.5, SOLID = 0.28, PARAPET_H = 1.5
const BAND = '#c9ced2', GLASS = '#7f98ab', LOBBY = '#4a5c68', LOBBY_WALL = '#9aa3a8', ROOF = '#80878b', PARAPET = '#bfc5c9'

export const defensePlaza = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(BAND), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
