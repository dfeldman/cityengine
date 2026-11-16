/**
 * La Chancellerie (Courbevoie, OSM way/82322824): a 19-level block of flats. BD TOPO (local cache) gives one 51.8 m
 * part, an L wider than OSM's ring, which is drawn here in its place; warm beige concrete with punched ribbon windows,
 * a recessed dark ground floor. Panoramax frames near it showed only hoardings, so the tone is not photo-checked.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import type { P2 } from '../museums/enframe.ts'
import { steppedParts, type StepLook } from './egalite.ts'

const WALL = '#cbc2b2', GLASS = '#56616a', LOBBY = '#46443f', ROOF = '#8a877f'
const LOOK: StepLook = {
  face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: 2.75, pitch: 2.8, solid: 0.42, material: 'concrete' },
  lobby: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' },
  lobbyH: 4.2, roof: ROOF, parapet: 1.2, parapetColour: WALL,
}
const OSM: P2[] = [[-15.3, -4.6], [-8.1, -16.1], [18.7, 0.4], [14.5, 7.1], [11.5, 11.9], [2.7, 6.5], [-8.8, -0.6]]
const PART: P2[] = [[-8.8, -0.6], [-15.3, -4.7], [-5.2, -20.6], [0.9, -17.0], [-0.5, -14.8], [7.1, -10.1], [10.1, -7.5], [17.4, -3.7], [20.4, -2.9], [14.5, 7.1], [11.5, 12.0], [2.8, 6.5]]

export const laChancellerie = (out: MeshBuilder, fit: Fit): void => steppedParts(out, fit, OSM, [{ h: 51.8, ring: PART }], LOOK)
