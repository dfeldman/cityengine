/**
 * Kupka A & B (Facto Kupka, 1992, Andrault & Parat, 19 levels, 70 m per fr.wikipedia's list; OSM way/68851519):
 * white-framed offices with a regular grid of square windows (seen behind the Basalte in the fr.wikipedia photo),
 * pale grey glass, glazed lobby. The Japan Bridge footbridge lands against it: nothing here projects past the ring.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 70, LOBBY_H = 5, FLOOR = 3.6, PITCH = 2.7, SOLID = 0.42, PARAPET_H = 1.4
const FRAME = '#eceeec', GLASS = '#6f8492', LOBBY = '#46555e', LOBBY_WALL = '#c9cdcd', ROOF = '#8b8f91', PARAPET = '#e4e6e4'

export const kupkaAB = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(FRAME), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'panel' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'panel' },
})
