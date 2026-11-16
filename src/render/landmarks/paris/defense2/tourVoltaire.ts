/**
 * Tour Voltaire (Courbevoie, 1970s, 22 storeys of offices; OSM way/68850347, no parts): a squat block with chamfered
 * corners (OSM's ring), clad all round in a fine pale grey-beige concrete grid with small punched windows, a flat roof
 * with a mast. Sources: Commons "Voltaire La Défense.JPG" (the pale chamfered grid block from the railway cutting);
 * height IGN BD TOPO batiment.hauteur 87.6 m (roof plant included; OSM says 81).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 84, MAST_H = 4
const LOBBY_H = 6
const WALL = '#cdc9bf', GLASS = '#5f6e7a', ROOF = '#8a8780', LOBBY = '#3a3e42', PARAPET = '#bdb9af'
const FLOOR = 3.6, PITCH = 1.5, SOLID = 0.45, PARAPET_H = 2

export const tourVoltaire = (out: MeshBuilder, fit: Fit): void => tower(out, { ...fit, height: HEIGHT }, {
  height: HEIGHT, roof: hex(ROOF), penthouse: 2,
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex('#2f3a42'), pitch: 3, material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'mast', height: MAST_H + PARAPET_H, colour: hex(PARAPET), width: 0.6 },
})
