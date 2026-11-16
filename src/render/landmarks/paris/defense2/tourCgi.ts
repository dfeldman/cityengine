/**
 * Tour CGI (Courbevoie, the CB16 tower, first-generation 1970s, 26 storeys + plant at R+28, 117 m; OSM way/82466949, no
 * parts; restructured 2002-03 and recladded 2018-19). Today a slab of pale TEAL-GREEN reflective glass on a fine square
 * grid with silver-green mullions, a white plant parapet carrying the CGI sign, a light glazed lobby. Reference: fr.wikipedia
 * "Tour CGI" page image (Tour_CGI_Juillet_2020.jpeg). Height from Wikipedia / brief (BD TOPO/MNS queries returned nothing).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 117
const LOBBY_H = 6
const GLASS = '#5d9a94', MULLION = '#8fb5ae', ROOF = '#9a9e9f', LOBBY = '#4b6b6a', LOBBY_WALL = '#c9cfcd', PARAPET = '#e6e9e8'
const FLOOR = 3.8, PITCH = 1.5, PARAPET_H = 4

export const tourCgi = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
