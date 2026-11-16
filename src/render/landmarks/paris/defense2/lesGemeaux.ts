/**
 * Les Gémeaux (Courbevoie, 1970s, 22 storeys; OSM way/82322820, no parts): one long thin slab on OSM's ring, a fat
 * block at each end joined by a narrower middle, all one height. Ribbon bands of pale blue-grey glass between cream
 * spandrels, a dark recessed lobby and a plant parapet. Height IGN BD TOPO batiment.hauteur 63.7 m (the same over the
 * whole ring, so no twin towers over a low link). No usable photograph found (Panoramax had none aimed at it, Commons
 * none): facade tones follow the neighbouring 1970s Courbevoie slabs and are the thing to check.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 63.7
const LOBBY_H = 4.5
const WALL = '#cfc8b8', GLASS = '#7d93a3', ROOF = '#7a7770', LOBBY = '#33373b', PARAPET = '#b3ad9f'
const FLOOR = 2.85, SOLID = 0.45, PARAPET_H = 1.8

export const lesGemeaux = (out: MeshBuilder, fit: Fit): void => tower(out, { ...fit, height: HEIGHT }, {
  height: HEIGHT, roof: hex(ROOF), penthouse: 2,
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex('#2d363d'), pitch: 3, material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
