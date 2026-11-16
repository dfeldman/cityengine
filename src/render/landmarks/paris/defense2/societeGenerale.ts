/**
 * Société Générale block (Courbevoie, Tours Chassagne/Alicante site; OSM way/226235093): read from two Panoramax
 * frames as one of La Défense's genuinely DARK buildings — swelling, curved walls of dark blue-grey mirror glass in
 * fine horizontal and vertical lines, which bulge out over a recessed glazed entrance. Here: a recessed dark glass
 * ground storey, the body cantilevered back out to OSM's ring on a dark soffit, dark mirror curtain wall, flat roof.
 * Height 42.8 m from the local IGN BD TOPO cache (h); OSM says 37.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 42.8, LOBBY_H = 6, LOBBY_RECESS = 2, FLOOR = 3.5, PITCH = 1.5, SOLID = 0.1, PARAPET_H = 0.6
const GLASS = '#3f5363', MULLION = '#6e7f8b', LOBBY = '#2c3a44', SOFFIT = '#4a565e', ROOF = '#5e6468'

export const societeGenerale = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  tiers: [
    { to: LOBBY_H, inset: LOBBY_RECESS, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
    { to: 1, inset: -LOBBY_RECESS, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'glass' } },
  ],
  cornices: [{ at: LOBBY_H, depth: 0.05, height: 0.6, colour: hex(SOFFIT) }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(GLASS), material: 'glass' },
})
