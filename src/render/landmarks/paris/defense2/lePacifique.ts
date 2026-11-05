/**
 * Le Pacifique (Puteaux/La Défense, residential, 14 levels, 40 m; OSM way/1311610277, no parts): a plain apartment block,
 * pale rendered walls with punched windows, a recessed ground floor and a low parapet. From OSM tags, not photographs.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 40
const LOBBY_H = 4
const WALL = '#cfc8ba', GLASS = '#3b4650', ROOF = '#66625c', LOBBY = '#34383a', PARAPET = '#a8a296'
const FLOOR = 2.7, PITCH = 2.4, SOLID = 0.45, PARAPET_H = 1.2

export const lePacifique = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
