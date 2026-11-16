/**
 * Tour Pascal A — now part of Landscape (Dominique Perrault refurbishment of the Pascal towers, delivered 2021;
 * way/61118185). BD TOPO h 60 m. New double skin of hundreds of glass scales and silver threads (parisladefense.com Landscape;
 * perraultarchitecture.com) — en.wikipedia photo File:Tour_Landscape.jpg: deep square grid of silver frames over blue-grey glass.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 60, LOBBY_H = 7
const FRAME = '#b9c0c4', GLASS = '#6c8494', ROOF = '#8e908e', LOBBY = '#5c666c', PARAPET = '#d0d2d0'
const FLOOR = 3.3, PITCH = 2.7, SOLID = 0.22, RELIEF = 0.4, CROWN_H = 2.5

export const tourPascalA = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(FRAME), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(FRAME), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, depth: RELIEF, material: 'metal' } }],
  crown: { kind: 'parapet', height: CROWN_H, colour: hex(PARAPET), material: 'glass' },
})
