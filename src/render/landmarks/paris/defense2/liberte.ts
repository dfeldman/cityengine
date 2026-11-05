/**
 * Liberté (La Défense, Puteaux, 20 levels of flats, ~69 m; OSM way/552869771, building=residential, no parts): a long
 * residential block on OSM's ring, pale warm concrete with regular punched windows, a recessed dark ground floor and a
 * plain parapet. From the tags and the footprint, not from photographs: check the tone against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 69
const LOBBY_H = 5
const WALL = '#cfc8bb', GLASS = '#56687a', ROOF = '#8d8a85', LOBBY = '#3d4448', PARAPET = '#b9b2a6'
const FLOOR = 3.3, PITCH = 3.4, SOLID = 0.45, PARAPET_H = 1.2

export const liberte = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
