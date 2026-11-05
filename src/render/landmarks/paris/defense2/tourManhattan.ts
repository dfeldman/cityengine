/**
 * Tour Manhattan (Courbevoie, 1975, 110 m, 32 storeys; OSM way/82467043, no parts): the wavy, curved plan of OSM's ring
 * in dark bronze-green reflective glass: continuous horizontal spandrel bands, no vertical mullions, a dark glazed lobby and a flush glass parapet.
 * From memory of photographs; the green tint of the glass is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 110
const LOBBY_H = 6
// spandrel a shade darker/browner than the vision glass so the bands read without shouting
const WALL = '#262a20', GLASS = '#34402f', ROOF = '#4a4f50', LOBBY = '#1a2026', LOBBY_WALL = '#2e3230', PARAPET = '#262a20'
const FLOOR = 3.5, SPANDREL = 0.32, PARAPET_H = 2

export const tourManhattan = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: SPANDREL, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'glass' },
})
