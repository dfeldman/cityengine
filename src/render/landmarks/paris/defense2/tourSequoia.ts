/**
 * Tour Séquoia (Puteaux, 1990 as Tour Bull, reclad 2018, 119 m, 33 storeys; OSM way/68852986, no parts): a glass office
 * shaft on OSM's ring, blue-grey curtain wall with fine mullions and floor lines, a tall glazed lobby and a flat plant
 * parapet. From memory of photographs; the glass tone is the thing to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 119
const LOBBY_H = 8
const WALL = '#8c949a', GLASS = '#4a6272', ROOF = '#6d7175', LOBBY = '#2c3438', LOBBY_WALL = '#5e6468', PARAPET = '#7f878c'
const FLOOR = 3.5, PITCH = 1.5, PARAPET_H = 3

export const tourSequoia = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
