/**
 * Espace 21 (Puteaux/Courbevoie, 40 m, 12 levels of offices; OSM way/637461248, no parts): a 38 x 46 m block on OSM's ring,
 * read as warm-beige precast spandrel bands with continuous dark ribbon glazing, a recessed dark lobby and a flat parapet.
 * From OSM's tags and ring; tones are guessed, unchecked against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40
const LOBBY_H = 4.5
const WALL = '#cbbfa8', GLASS = '#34444d', ROOF = '#6f6a62', LOBBY = '#262e32', LOBBY_WALL = '#a89d89', PARAPET = '#b5aa94'
const FLOOR = 3.1, PITCH = 3.2, SOLID = 0.42, PARAPET_H = 1.2

export const espace21 = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
