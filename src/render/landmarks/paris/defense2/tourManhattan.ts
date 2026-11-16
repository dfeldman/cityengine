/**
 * Tour Manhattan (Courbevoie, 1975; OSM way/82467043, no parts): OSM's wavy, curved ring in pale sky-blue mirror
 * glass, a faint panel grid and no spandrel bands, flush glass parapet. Source: fr.wikipedia page photo
 * Tour_Manhattan_Septembre_2026.jpeg (glass reads light sky-blue, not dark); height IGN BD TOPO batiment.hauteur
 * 111.4 m (Wikipedia 110 m).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 111.4
const LOBBY_H = 6
const GLASS = '#8ea8c2', GRID = '#a3b6c8', ROOF = '#5f6466', LOBBY = '#2f3a44', LOBBY_WALL = '#7a8894', PARAPET = '#93abc3'
const FLOOR = 3.5, PITCH = 1.5, PARAPET_H = 2

export const tourManhattan = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(GRID), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'glass' },
})
