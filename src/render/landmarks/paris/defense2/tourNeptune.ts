/**
 * Tour Neptune / Allianz-Neptune (Courbevoie, 1975, Michel Folliasson, 113 m; OSM way/82467058, no parts). A PALE slab:
 * dense continuous light-grey/white vertical fins over pale grey-blue glass, a flat top with a white plant band. Reference:
 * fr.wikipedia "Tour Neptune" page image (Tour_Neptune_Octobre_2022.jpeg, seen from the Seine). Height from Wikipedia /
 * brief (BD TOPO/MNS queries returned nothing here).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 113
const LOBBY_H = 6
const WALL = '#dcdfe0', GLASS = '#8d9ba7', ROOF = '#a8acae', LOBBY = '#3b434a', LOBBY_WALL = '#c8cccd', PARAPET = '#e2e4e4'
const FLOOR = 3.6, PITCH = 1.4, SOLID = 0.3, DEPTH = 0.25, PARAPET_H = 3

export const tourNeptune = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'fins', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, depth: DEPTH, continuous: true, material: 'metal' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
