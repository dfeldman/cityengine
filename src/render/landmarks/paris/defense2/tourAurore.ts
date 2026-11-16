/**
 * Tour Aurore (Courbevoie, 1970, renovated 2020-22; OSM way/82467065, no parts). Since the renovation a slab of pale
 * blue-grey reflective glass cut by thin light floor bands, the glass carried a few metres past the roof as a screen
 * round the plant. Source: fr.wikipedia page photo Tour_Aurore_Mai_2022.jpeg; height IGN BD TOPO batiment.hauteur 105.4 m
 * (Wikipedia 110 m).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 105.4
const LOBBY_H = 6
const GLASS = '#7f96aa', BAND = '#c3cad0', ROOF = '#6a6f73', LOBBY = '#3a444c', LOBBY_WALL = '#9aa1a6', SCREEN = '#8ea3b5'
const FLOOR = 3.4, BAND_SHARE = 0.18, SCREEN_H = 4

export const tourAurore = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(BAND), glass: hex(GLASS), floor: FLOOR, solid: BAND_SHARE, material: 'metal' } }],
  crown: { kind: 'parapet', height: SCREEN_H, colour: hex(SCREEN), material: 'glass' },
})
