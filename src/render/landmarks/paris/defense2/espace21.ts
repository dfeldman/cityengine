/**
 * Espace 21 (Puteaux/Courbevoie, 12 levels of offices; OSM way/637461248, 44-node ring): read from two Panoramax
 * frames as a white-panelled block (large off-white cladding panels, rows of square punched windows, rounded
 * corners) wrapped round a courtyard whose curved inner walls are green-blue mirror glass, entered under a
 * storey-high arch. Here: white punched outer walls, a glazed recessed ground floor, thin white parapet.
 * Height 40 m (OSM height; not in the local BD TOPO cache tiles).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40, LOBBY_H = 4.5, FLOOR = 3.3, PITCH = 2.4, SOLID = 0.5, PARAPET_H = 1
const PANEL = '#e6e4de', WINDOW = '#5f7484', LOBBY = '#4f6670', LOBBY_WALL = '#d6d4cd', ROOF = '#85888a'

export const espace21 = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(PANEL), glass: hex(WINDOW), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'granite' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PANEL), material: 'metal' },
})
