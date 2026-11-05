/**
 * Résidence étudiante Campuséa (Puteaux, 2018, Ateliers Jean Nouvel, 75 m, 20 storeys of student flats; OSM way/547648868,
 * no parts): a slim slab on OSM's quadrilateral, pale grey-white concrete skin punched by deep dark window openings at a
 * close pitch, a recessed dark ground floor and a flat parapet. From memory of photographs: tone is the thing to check.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 75
const LOBBY_H = 5
const WALL = '#b9b7b0', GLASS = '#2a3036', ROOF = '#8a8985', LOBBY = '#24282b', PARAPET = '#a09e98'
const FLOOR = 3.5, PITCH = 2.2, SOLID = 0.35, PARAPET_H = 1.5

export const campusea = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
