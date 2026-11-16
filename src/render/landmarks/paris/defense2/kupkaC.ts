/**
 * Kupka C (Puteaux, Andrault & Parat; OSM way/68850222): the lower sibling of Kupka A & B, a rounded pale glass
 * block banded by white floor spandrels, glazed lobby, flat parapet. Height 36 m from BD TOPO; look from a
 * Panoramax street frame and the fr.wikipedia Immeuble Basalte photo (Kupka behind).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 36, LOBBY_H = 4.5, FLOOR = 3.5, PITCH = 1.6, SOLID = 0.35, PARAPET_H = 1.2
const BAND = '#e2e3df', GLASS = '#8aa0ae', LOBBY = '#4d5d67', LOBBY_WALL = '#b8bcbc', ROOF = '#8a8e90', PARAPET = '#dcddd9'

export const kupkaC = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(BAND), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
