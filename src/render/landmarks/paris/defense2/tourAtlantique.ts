/**
 * Tour Atlantique (Courbevoie, 1970, 106 m, 27 storeys of offices; OSM way/19446485, no parts): a faceted shaft on OSM's
 * ring in dark blue-grey curtain glass with pale metal spandrel bands, a glazed lobby and a flat plant crown.
 * From memory of photographs; the glass tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 106
const LOBBY_H = 6
const WALL = '#8d979c', GLASS = '#34505f', ROOF = '#5c6266', LOBBY = '#232d33', LOBBY_WALL = '#555d62'
const FLOOR = 3.7, PITCH = 1.5, CROWN_H = 4, CROWN_INSET = 1.2, CROWN_STEPS = 1

export const tourAtlantique = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'stepped', steps: CROWN_STEPS, height: CROWN_H, inset: CROWN_INSET, material: 'metal' },
})
