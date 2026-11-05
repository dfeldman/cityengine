/**
 * Tour Michelet (Puteaux, 1985, ex-Tour Total, 117 m, 34 storeys of offices; OSM way/64227095, no parts): a faceted slab
 * on OSM's ring with ribbon windows of dark bronze glass between pale gold-beige spandrel bands (OSM facade #E8DCAE), a
 * dark recessed lobby and a grey plant parapet. From memory of photographs; band/glass ratio is the thing to check.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 117
const LOBBY_H = 7
const WALL = '#d9cba0', GLASS = '#3b342c', ROOF = '#c4c4c4', LOBBY = '#24221f', LOBBY_WALL = '#8f8670', PARAPET = '#a8a294'
const FLOOR = 3.3, PITCH = 1.6, PARAPET_H = 3.5

export const tourMichelet = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
