/**
 * Tour Exaltis / Mazars (Courbevoie, 2006, Arquitectonica with Bridot-Willerval; 71.3 m BD TOPO; OSM way/82468241):
 * curved full-height glass faces north and south (OSM's ring carries the curves), a fine-gridded reflective
 * blue-silver curtain wall that reads pale sky-blue in daylight, and the sloping "fifth facade" roof falling toward
 * Courbevoie. Sources: fr.wikipedia infobox photo Tour_Exaltis_Aout_2022_1.jpeg, Panoramax street photo, arquitectonica.com, parisladefense.com, pss-archi forum.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 71.3
const LOBBY_H = 6
const GLASS = '#7b9cc0', MULLION = '#9fb0c0', LOBBY = '#6e8796', ROOF = '#9aa7b0'
const FLOOR = 4.0, PITCH = 1.5
const SLOPE_H = 4

export const exaltis = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3 } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH } }],
  crown: { kind: 'sliced', height: SLOPE_H, colour: hex(GLASS), material: 'glass' },
})
