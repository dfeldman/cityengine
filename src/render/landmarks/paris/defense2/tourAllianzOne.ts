/**
 * Tour Allianz One (Puteaux, 1 cours Michelet, 100 m, 25 office storeys; OSM way/64226472, no parts): an office shaft
 * on OSM's ring in pale blue-grey curtain glass with light mullions, a tall dark glazed lobby and a recessed metal plant
 * crown. From memory of photographs; the glass tone and the crown are the things to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 100
const LOBBY_H = 8
const WALL = '#b9c2c6', GLASS = '#6a8796', ROOF = '#70777b', LOBBY = '#263036', LOBBY_WALL = '#5d666b'
const FLOOR = 3.6, PITCH = 1.5, CROWN_H = 5, CROWN_INSET = 1.2, CROWN_STEPS = 1

export const tourAllianzOne = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'stepped', steps: CROWN_STEPS, height: CROWN_H, inset: CROWN_INSET, material: 'metal' },
})
