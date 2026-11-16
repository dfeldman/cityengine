/**
 * Résidence la Sirène (OSM way/82486015, Courbevoie): a curved block of flats in three BD TOPO parts, 54.1 / 52.2 m
 * along the curve and a 37.6 m south wing; pale concrete balcony bands. Heights and parts from local BD TOPO; no
 * usable photo was found, the tone follows its 1970s neighbours.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import type { P2 } from '../museums/enframe.ts'
import { steppedParts, type StepPart, type StepLook} from './egalite.ts'

const WALL = '#d9d4ca', WINDOW = '#6f7a82', LOBBY = '#545556', ROOF = '#8f8e8a'
const LOOK: StepLook = {
  face: { kind: 'bands', wall: hex(WALL), glass: hex(WINDOW), floor: 2.9, solid: 0.5, depth: 1.0 },
  lobby: { kind: 'curtain', wall: hex(LOBBY), glass: hex('#3e4548'), floor: 4, pitch: 3 },
  lobbyH: 4, roof: ROOF, parapet: 1.1, parapetColour: WALL,
}

const OSM: P2[] = [[-17.2, -6.4], [-17.1, -8.3], [-15.3, -8.3], [-15.3, -10.1], [-14.7, -14.0], [-12.7, -13.7], [-11.5, -18.8], [-10.2, -18.5], [-8.9, -22.0], [-8.2, -23.5], [-5.3, -27.8], [-4.3, -27.3], [2.1, -23.2], [1.5, -22.1], [0.7, -20.8], [0.1, -19.4], [-0.5, -17.9], [-1.0, -16.4], [-1.4, -14.9], [-1.8, -13.4], [-2.1, -11.9], [-2.3, -10.3], [-2.4, -8.8], [-2.4, -7.2], [-2.4, -5.7], [-2.3, -4.6], [-2.1, -3.1], [15.6, 8.0], [17.6, 9.5], [18.7, 10.8], [19.6, 12.1], [20.2, 13.5], [20.9, 15.5], [21.1, 17.4], [20.9, 20.0], [20.5, 21.9], [17.0, 31.4], [13.9, 30.5], [13.3, 31.8], [10.2, 30.4], [9.5, 31.8], [6.6, 30.2], [5.7, 31.6], [-1.1, 27.0], [-2.4, 25.9], [-7.6, 20.2], [-9.0, 18.5], [-13.1, 11.3], [-14.7, 6.6], [-16.6, -0.2]]
const PARTS: StepPart[] = [
  { h: 54.1, ring: [[6.1, 31.9], [2.8, 30.2], [-0.1, 28.1], [-3.1, 25.5], [-5.1, 23.4], [5.6, 12.7], [8.8, 15.8], [11.5, 18.0], [14.6, 19.8], [20.7, 21.6], [16.9, 31.6], [13.9, 30.5], [13.3, 31.8], [10.2, 30.6], [9.7, 31.9], [6.6, 30.6]] },
  { h: 37.6, ring: [[-15.2, -9.7], [-2.4, -9.3], [-1.8, -13.3], [-0.9, -16.9], [1.0, -20.9], [3.1, -24.5], [-5.1, -29.3], [-7.5, -25.0], [-9.8, -20.3], [-11.2, -20.7], [-11.6, -19.2], [-12.4, -15.3], [-14.9, -15.7]] },
  { h: 52.2, ring: [[-5.1, 23.4], [5.6, 12.7], [3.1, 9.8], [1.0, 6.3], [-0.7, 2.6], [-1.8, -1.1], [-2.4, -5.3], [-2.4, -9.3], [-15.2, -9.7], [-17.5, -9.8], [-17.3, -3.8], [-16.5, 2.2], [-14.7, 8.2], [-12.4, 13.3], [-9.0, 19.0]] },
]

export const residenceLaSirene = (out: MeshBuilder, fit: Fit): void => steppedParts(out, fit, OSM, PARTS, LOOK)
