/**
 * Nest Paris La Défense (ex-Sofitel, "Accacia", Gino Valle / Urquijo / Macola; OSM way/50027241, no parts; height=69 (roof altitude, not height),
 * building:levels=8 above the dalle): the curved hotel on OSM's ring, pale beige stone with deep punched windows in a
 * regular grid, a dark recessed lobby at dalle level and a plain parapet. From tags and memory of photographs.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 32 // 8 levels x 3.2 + 6 m lobby; OSM height=69 reads as roof altitude NGF
const LOBBY_H = 6
const WALL = '#cfc4b0', GLASS = '#2f3a42', ROOF = '#8e8a84', LOBBY = '#2a3036', PARAPET = '#bfb39e'
const FLOOR = 3.2, PITCH = 2.4, SOLID = 0.45, PARAPET_H = 1.5

export const nestParis = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: PITCH } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'ashlar' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
