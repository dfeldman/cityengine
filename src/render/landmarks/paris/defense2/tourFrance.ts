/**
 * Tour France (Puteaux, 1973, 126 m, 41 storeys of flats; architect Jean de Mailly; OSM way/64220590, no parts): a
 * round-ended white shaft on OSM's ring. Photo (fr.wikipedia page image File:Tour_France_Septembre_2022.jpeg) shows
 * bright white continuous floor bands (balcony fronts) alternating with dark ribbon glazing all the way up, a slightly
 * set-back glazed base and a white flat top. Height: fr.wikipedia infobox 126 m roof.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 126
const LOBBY_H = 5
const BAND = '#eceae4', GLASS = '#4b5459', ROOF = '#cfcdc8', LOBBY = '#39434a', LOBBY_WALL = '#d8d6d0', PARAPET = '#f0eee8'
const FLOOR = 2.95, SOLID = 0.5, PARAPET_H = 2.5

export const tourFrance = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(BAND), glass: hex(GLASS), floor: FLOOR, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'concrete' },
})
