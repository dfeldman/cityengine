/**
 * Les Miroirs (Courbevoie, 1981, 16 levels, ~53 m; OSM way/82467053, no parts): the zig-zag faceted office block
 * wrapped entirely in mirror glass, on OSM's many-sided ring. Silvery reflective curtain wall with thin mullions,
 * a dark recessed lobby and a flat metal-capped roof. From tags, footprint and memory of photos.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 53
const LOBBY_H = 4.5
const MULLION = '#9aa3aa', MIRROR = '#8fa4b4', ROOF = '#7a7e82', LOBBY = '#2e3338', CAP = '#a9b0b5'
const FLOOR = 3.1, PITCH = 1.6, CAP_H = 0.8

export const lesMiroirs = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3 } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(MIRROR), floor: FLOOR, pitch: PITCH } }],
  crown: { kind: 'parapet', height: CAP_H, colour: hex(CAP), material: 'metal' },
})
