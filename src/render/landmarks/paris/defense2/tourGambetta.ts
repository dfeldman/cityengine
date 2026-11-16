/**
 * Tour Gambetta (Courbevoie, 1975, 37 storeys of flats; OSM way/82486306): a tall cream-white slab, its faces cut by
 * narrow full-height window strips between white piers (Commons "Tour Gambetta 2.jpg"); the top storeys step in at
 * the corners. Height: BD TOPO batiment hauteur 103.3 m.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 103.3
const LOBBY_H = 5
const WALL = '#cfcbc1', GLASS = '#56636c', ROOF = '#8a877f', LOBBY = '#4a4c4c'
const FLOOR = 103.3 / 37, PITCH = 2.4, SOLID = 0.55, DEPTH = 0.35
const TOP_FROM = 0.94, TOP_INSET = 1.8, PARAPET_H = 1.5

export const tourGambetta = (out: MeshBuilder, fit: Fit): void => {
  const face = { kind: 'fins' as const, wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, depth: DEPTH, material: 'concrete' as const }
  tower(out, fit, {
    height: HEIGHT, roof: hex(ROOF),
    base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
    tiers: [{ to: TOP_FROM, face }, { to: 1, inset: TOP_INSET, face }],
    crown: { kind: 'parapet', height: PARAPET_H, colour: hex(WALL), material: 'concrete' },
  })
}
