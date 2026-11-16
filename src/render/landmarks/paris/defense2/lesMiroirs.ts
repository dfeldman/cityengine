/**
 * Les Miroirs (CB20, 1981, La Fonta, 16 levels; OSM way/82467053): angular faceted blocks wrapped entirely in
 * mirror glass with dark thin mullions; in Panoramax frames it reads as a dark sky-reflecting mirror, darker than
 * its neighbours. Height 62.4 m from BD TOPO (fr.wikipedia's list: 65 m).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 62.4, LOBBY_H = 4.5, FLOOR = 3.6, PITCH = 1.5, SOLID = 0.06, CAP_H = 0.6
// a low faceted wrap block (to LOW) with the taller faceted mass set back above it (Panoramax frames)
const LOW = 0.38, SETBACK = 5, LEDGE = '#3a424a'
const MULLION = '#2e3640', MIRROR = '#4c6278', LOBBY = '#262b31', ROOF = '#6c7074', CAP = '#3a424a'

export const lesMiroirs = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex(MIRROR), floor: LOBBY_H, pitch: 3, material: 'mirror' } },
  tiers: [
    { to: LOW, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(MIRROR), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'mirror' }, cornice: { depth: 0.4, height: 0.6, colour: hex(LEDGE) } },
    { to: 1, inset: SETBACK, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(MIRROR), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'mirror' } },
  ],
  crown: { kind: 'parapet', height: CAP_H, colour: hex(CAP), material: 'metal' },
})
