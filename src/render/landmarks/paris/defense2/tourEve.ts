/**
 * Tour Ève (Courbevoie, 1983 as Tour Descartes, reclad 2022, 109 m, 37 storeys; OSM way/68851623, no parts): a slim
 * office shaft on OSM's ring in pale blue-green curtain glass, a tall dark glazed lobby and a stepped plant crown.
 * From memory of photographs; the glass tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 109
const LOBBY_H = 7
const WALL = '#a7b2b4', GLASS = '#5c7f8a', ROOF = '#6d7377', LOBBY = '#2a3236', LOBBY_WALL = '#646c70'
const FLOOR = 2.95, PITCH = 1.4, CROWN_H = 6, CROWN_INSET = 1.5, CROWN_STEPS = 2

export const tourEve = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'stepped', steps: CROWN_STEPS, height: CROWN_H, inset: CROWN_INSET, material: 'metal' },
})
