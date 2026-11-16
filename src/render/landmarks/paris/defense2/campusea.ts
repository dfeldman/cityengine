/**
 * Résidence étudiante Campuséa / YouFirst Campus (Puteaux, 2018, Ateliers Jean Nouvel, R+21 student flats; OSM
 * way/547648868, no parts): a slim tower on OSM's quadrilateral in close-set grey-blue glass with fine vertical fins,
 * a darker glazed ground floor, its roof cut on a slant. Sources: Panoramax street photos round 48.8884,2.2352 (slim
 * dark-glass faceted tower, slanted top); pss-archi.eu FR-92062-45921 (Nouvel, R+21, 75.2 m total); height IGN BD TOPO
 * batiment.hauteur 62.9 m for the main roof, the slanted crown taking it toward pss-archi's total.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 62.9, CROWN_H = 8
const LOBBY_H = 5
const WALL = '#55606a', GLASS = '#6f8496', ROOF = '#4a5157', LOBBY = '#2a3036', CROWN = '#5c6873'
const FLOOR = 2.85, PITCH = 1.2, SOLID = 0.2, DEPTH = 0.25

export const campusea = (out: MeshBuilder, fit: Fit): void => tower(out, { ...fit, height: HEIGHT }, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex('#33404a'), pitch: 2.5 } },
  tiers: [{ to: 1, face: { kind: 'fins', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, depth: DEPTH } }],
  crown: { kind: 'sliced', height: CROWN_H, colour: hex(CROWN) },
})
