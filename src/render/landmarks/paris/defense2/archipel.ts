/**
 * Archipel (Nanterre, 2021, Jean-Paul Viguier; Vinci HQ, ~73 m; OSM way/639745597, no parts): the tower of the
 * campus on OSM's ring, a clear pale glass skin wrapped in thin white horizontal sunshade bands floor by floor,
 * a tall glazed lobby and a flat white plant parapet. From memory of photographs.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 73
const LOBBY_H = 7
const BAND = '#e8e9e6', GLASS = '#7d909c', ROOF = '#9a9c9a', LOBBY = '#5d6e78', PARAPET = '#e3e4e1'
const FLOOR = 3.6, SOLID = 0.28, DEPTH = 0.5, PARAPET_H = 2.5

export const archipel = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(BAND), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3 } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(BAND), glass: hex(GLASS), floor: FLOOR, solid: SOLID, depth: DEPTH, material: 'metal' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})

/** The campus's low blocks (Pemba, Hydra, Tonga: way/639745596, /639745598, /639745554; 7 levels): same banded skin. */
const LOW_HEIGHT = 28, LOW_LOBBY_H = 5

export const archipelLow = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: LOW_HEIGHT, roof: hex(ROOF),
  base: { height: LOW_LOBBY_H, face: { kind: 'curtain', wall: hex(BAND), glass: hex(LOBBY), floor: LOW_LOBBY_H, pitch: 3 } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(BAND), glass: hex(GLASS), floor: FLOOR, solid: SOLID, depth: DEPTH, material: 'metal' } }],
  crown: { kind: 'parapet', height: 1.2, colour: hex(PARAPET) },
})
