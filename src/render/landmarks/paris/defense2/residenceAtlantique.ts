/**
 * Résidence Atlantique (Puteaux, 1970s, 50 m, 17 storeys of flats; OSM way/1311610926, no parts; not Tour Atlantique,
 * way/19446485, the 106 m office tower in Courbevoie): a 47 x 16 m slab on OSM's ring, pale concrete spandrels with
 * ribbon windows, a recessed dark ground floor and a flat parapet. From the tags only: check tone against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 50
const LOBBY_H = 4
const WALL = '#c9c4b8', GLASS = '#3a4650', ROOF = '#6b6a66', LOBBY = '#2a2f33', PARAPET = '#b4afa4'
const FLOOR = 2.8, PITCH = 2.2, SOLID = 0.4, PARAPET_H = 1.5

export const residenceAtlantique = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
