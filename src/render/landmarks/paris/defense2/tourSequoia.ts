/**
 * Tour Séquoia (Puteaux, 1990 as Tour Bull by Ayoub, Andrault & Parat, later reclad; 119 m roof, 33 storeys; OSM
 * way/68852986, no parts): a glass office shaft on OSM's ring whose curved face is "stretched" by a straight one
 * (fr.wikipedia). Photo (fr.wikipedia page image File:Tour_Séquoia_-_La_Défense.jpg) shows pale silver-blue reflective
 * glass with fine vertical mullions, the top cut on a slant so one end rises like a sail, and a glazed lobby.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 119
const LOBBY_H = 8
const MULLION = '#c4ccd2', GLASS = '#8ea6b8', ROOF = '#7d858b', LOBBY = '#4a5c68', LOBBY_WALL = '#9aa3a9', SAIL = '#9fb3c2'
const FLOOR = 3.6, PITCH = 1.35, SAIL_H = 10

export const tourSequoia = (out: MeshBuilder, fit: Fit): void => tower(out, { ...fit, height: HEIGHT - SAIL_H / 2 }, {
  height: HEIGHT - SAIL_H / 2, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'sliced', height: SAIL_H, colour: hex(SAIL), material: 'glass' },
})
