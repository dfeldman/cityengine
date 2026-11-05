/**
 * Tour Franklin (Puteaux, 1972, 120 m, 33 storeys of offices; OSM way/64212582 PB3 and way/64212673 PB4, no parts): two
 * slabs joined along a shared edge, one tower on the union of the two rings, in dark smoked curtain glass with thin
 * dark-metal mullion bands, a recessed dark lobby and a flat plant parapet. From memory of photographs.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 120
const LOBBY_H = 7
const WALL = '#33373b', GLASS = '#1d2328', ROOF = '#4a4a48', LOBBY = '#24282b', PARAPET = '#3c4044'
const FLOOR = 3.5, PITCH = 1.5, SOLID = 0.25, PARAPET_H = 3

export const tourFranklin = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'metal' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
