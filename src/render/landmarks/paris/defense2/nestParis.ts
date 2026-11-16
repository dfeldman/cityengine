/**
 * Nest Paris La Défense (ex-Sofitel; OSM way/50027241; height=69 in OSM is a roof altitude): the curved hotel on OSM's
 * ring, ~8 levels above the dalle. BD TOPO gives only 6.3 m (the slab-level piece), so the manifest's 32 m stands.
 * Pale grey-white panels with a regular grid of deep punched windows, a dark recessed lobby at dalle level (the game's dalle
 * ground carries it) and a plain parapet. Tone from a Panoramax photo (grey-white grid, darker top storey, pilotis at the dalle).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 32
const LOBBY_H = 4.5
const STONE = '#dcdcd5', WINDOW = '#6d808b', LOBBY = '#3f3f3d', ROOF = '#9a958c'
const FLOOR = 3.3, PITCH = 2.6, SOLID = 0.5, DEPTH = 0.45, PARAPET_H = 1.2

export const nestParis = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex('#39434a'), floor: LOBBY_H, pitch: 3 } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(STONE), glass: hex(WINDOW), floor: FLOOR, pitch: PITCH, solid: SOLID, depth: DEPTH } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(STONE) },
})
