/**
 * Tour Emblem (Puteaux/Courbevoie, 103 m, 28 storeys of offices; OSM way/82486366, no parts): a glass shaft on OSM's ring
 * in cool blue-grey curtain glass with pale spandrel bands, a glazed lobby and a flat plant crown.
 * From memory of photographs; the glass tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 103
const LOBBY_H = 6
const WALL = '#a3adb3', GLASS = '#4a6a7c', ROOF = '#666d71', LOBBY = '#2a3840', LOBBY_WALL = '#5f676b'
const FLOOR = 3.6, PITCH = 1.5, CROWN_H = 4, CROWN_INSET = 1.5, CROWN_STEPS = 1

export const tourEmblem = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'stepped', steps: CROWN_STEPS, height: CROWN_H, inset: CROWN_INSET, material: 'metal' },
})
