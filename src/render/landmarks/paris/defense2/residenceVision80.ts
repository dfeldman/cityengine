/**
 * Résidence Vision 80 (Puteaux, on the Esplanade; OSM way/82467088, 15 levels; BD TOPO h 44.3 m): a pale cream rendered
 * block with horizontal window ribbons between white spandrels, over the dalle's concrete undercroft (Panoramax frames at
 * the foot only show the undercroft). Dark recessed ground floor, flat roof.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 44.3
const LOBBY_H = 4
const WALL = '#e9e5da', GLASS = '#7b8e9c', ROOF = '#9a9892', LOBBY = '#4c5257', PARAPET = '#dedad0'
const FLOOR = 2.7, SOLID = 0.5, PARAPET_H = 1

export const residenceVision80 = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: SOLID, depth: 0.4, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})