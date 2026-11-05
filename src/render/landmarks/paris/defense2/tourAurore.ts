/**
 * Tour Aurore (Courbevoie, 1970, 110 m; OSM way/82467065, no parts, tagged "démolition 2010" by the cadastre but standing
 * and renovated): a slab on OSM's ring in pale grey-blue curtain glass with fine light mullions and floor lines, a recessed
 * glazed lobby and a flat plant parapet. From memory of photographs; the glass tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 110
const LOBBY_H = 6
const WALL = '#8a9297', GLASS = '#4d6272', ROOF = '#5f6366', LOBBY = '#2b3237', LOBBY_WALL = '#59606a', PARAPET = '#70767a'
const FLOOR = 3.5, PITCH = 1.6, PARAPET_H = 2.5

export const tourAurore = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
