/**
 * La Pacific (Puteaux, Kisho Kurokawa 1992, 90 m; OSM way/68852287, no parts): a curved office slab on OSM's ring,
 * pale grey-white cladding with punched blue-grey glass, a dark recessed lobby and a low pale parapet.
 * From memory of photographs: the big gate-like opening through the slab is not modelled.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 90
const LOBBY_H = 6
const WALL = '#d6d8d6', GLASS = '#4a5a68', ROOF = '#8a8c8a', LOBBY = '#2a2e32', PARAPET = '#c8cac8'
const FLOOR = 3.6, PITCH = 1.6, SOLID = 0.4, PARAPET_H = 2.5

export const laPacific = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'metal' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
