/**
 * Tour Défense 2000 (Puteaux, 1974, 134 m, 47 storeys of flats; architects Proux, Demones, Srot; OSM way/68852619, no
 * parts): a thin sheer slab on OSM's ring. Photos (en.wikipedia page image File:Tour_Défense_2000.jpg; Commons
 * "Panorama La Défense.jpg") show mid-grey concrete piers running unbroken foot to head with recessed dark-grey
 * window/loggia strips between them, a darker glazed lobby and a plain flat top. Height: fr.wikipedia infobox 134 m.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 134
const LOBBY_H = 6
const PIER = '#a6a8a7', WINDOW = '#566068', ROOF = '#6e706f', LOBBY = '#2c3236', LOBBY_WALL = '#7a7c7c', PARAPET = '#858787'
const FLOOR = 2.8, PITCH = 2.6, SOLID = 0.42, DEPTH = 0.45, PARAPET_H = 2.5

export const defense2000 = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'fins', wall: hex(PIER), glass: hex(WINDOW), floor: FLOOR, pitch: PITCH, solid: SOLID, depth: DEPTH, continuous: true, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'concrete' },
})
