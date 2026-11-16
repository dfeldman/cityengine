/**
 * Tour Michelet (Puteaux, ex-Tour Total / Kodak-Pathé HQ, 1985, 117 m; OSM way/64227095, no parts). A PALE tower: off-white
 * cream panels punched by a tight grid of small grey-blue windows, massed as stepped blocks — the centre rises highest, the
 * flanks stop lower — with a flat roof. Reference: fr.wikipedia "Tour Michelet" page image (Tour_Michelet_Septembre_2022.jpeg).
 * Height from Wikipedia / brief (BD TOPO/MNS queries returned nothing). Setback heights/insets are estimates from the photo.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 117
const LOBBY_H = 6
const WALL = '#e4e0d4', GLASS = '#7f8d98', ROOF = '#bdbab2', LOBBY = '#3a4046', LOBBY_WALL = '#cfcabd', PARAPET = '#dcd8cc'
const FLOOR = 3.3, PITCH = 1.6, SOLID = 0.45, PARAPET_H = 2
const STEP1 = 0.86, STEP2 = 0.94, INSET1 = 4, INSET2 = 4

const face = { kind: 'punched' as const, wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' as const }
export const tourMichelet = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: STEP1, face }, { to: STEP2, inset: INSET1, face }, { to: 1, inset: INSET2, face }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'concrete' },
})
