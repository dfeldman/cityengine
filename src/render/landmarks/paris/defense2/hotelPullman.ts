/**
 * Hôtel Pullman Paris La Défense (11 av. de l'Arche, 1999; 67.5 m BD TOPO; OSM way/82486391): the curved prow on
 * OSM's ring, a cream/pale-beige panel grid with square punched windows in even rows, a darker brown-glazed ground
 * storey and a plain cream parapet. Sources: Panoramax street photo (av. de l'Arche), local BD TOPO.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 67.5
const LOBBY_H = 6
const PANEL = '#e4dccb', WINDOW = '#6f8592', LOBBY = '#4f4a44', ROOF = '#9b968e'
const FLOOR = 3.0, PITCH = 2.4, SOLID = 0.45, DEPTH = 0.25, PARAPET_H = 1.6

export const hotelPullman = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex('#3d4950'), floor: LOBBY_H, pitch: 3 } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(PANEL), glass: hex(WINDOW), floor: FLOOR, pitch: PITCH, solid: SOLID, depth: DEPTH, material: 'panel' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PANEL), material: 'panel' },
})
