/**
 * La Chancellerie (Courbevoie, 19 levels, ~63 m; OSM way/82322824, no parts): a residential block on OSM's ring, warm
 * grey-beige concrete with ribbon windows, a recessed dark ground floor and a flat parapet.
 * From tags and footprint; the tone is a guess to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 63
const LOBBY_H = 4.5
const WALL = '#bfb6a6', GLASS = '#46505a', ROOF = '#85827c', LOBBY = '#383634', PARAPET = '#aaa294'
const FLOOR = 3.1, PITCH = 2.8, SOLID = 0.5, PARAPET_H = 1.2

export const laChancellerie = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
