/**
 * Tour Ève (Puteaux, 1975, flats; OSM way/68851623, no parts): a white concrete slab with rounded ends, wrapped in
 * continuous balcony slabs over dark ribbon windows every floor, a plain white parapet. Source: fr.wikipedia page
 * photo Tour_Ève_Mai_2022.jpeg; height IGN BD TOPO batiment.hauteur 103.7 m (Wikipedia 109 m).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 103.7
const LOBBY_H = 5
const WHITE = '#e6e6e1', WINDOW = '#56616b', ROOF = '#8d8f8e', LOBBY = '#3a4248', PARAPET = '#eeeeea'
const FLOOR = 2.9, SLAB_SHARE = 0.42, PARAPET_H = 2.5

export const tourEve = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(WHITE), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WHITE), glass: hex(WINDOW), floor: FLOOR, solid: SLAB_SHARE, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'concrete' },
})
