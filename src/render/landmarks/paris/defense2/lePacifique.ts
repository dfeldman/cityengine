/**
 * Le Pacifique (Puteaux, 14 levels of flats; OSM way/1311610277, 4-corner ring): a plain apartment slab, pale cream
 * render with white balcony slabs at each floor over recessed windows, shops behind a dark glazed ground floor and a
 * low parapet. Height 44 m from the local IGN BD TOPO cache (h). The one Panoramax frame in range shows only the
 * arcade at its foot, so the upper wall is the usual Puteaux slab, not photo-checked.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 44, LOBBY_H = 4.5, FLOOR = 2.85, SLAB_SHARE = 0.36, PARAPET_H = 1
const SLAB = '#ebe5d8', WINDOW = '#5e676e', LOBBY = '#3a4248', LOBBY_WALL = '#c9c1b2', ROOF = '#78756f'

export const lePacifique = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 4, material: 'glass' }, canopy: { depth: 1.2, colour: hex(SLAB) } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(SLAB), glass: hex(WINDOW), floor: FLOOR, solid: SLAB_SHARE, material: 'stucco' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(SLAB) },
})
