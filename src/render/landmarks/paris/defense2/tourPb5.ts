/**
 * Tour PB5 / Hyfive (Puteaux, 1983, ex-SCOR headquarters, renovated by Icade; OSM way/50008592): a three-armed office
 * tower on OSM's ring, 73 m per the local BD TOPO cache (OSM's 60 m is low). Ribbon glazing: silver-grey reflective
 * glass bands between pale aluminium spandrels, a glazed lobby under the dalle canopy (Panoramax frames), a parapet.
 * The upper facade was not photo-checked; its tone follows the renovation's descriptions as a light building.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 73
const SPANDREL = '#c9cdd0', GLASS = '#8d9eab', LOBBY = '#d8dadb', LOBBY_GLASS = '#5b6873', ROOF = '#8e9093'
const LOBBY_H = 6, FLOOR = 3.6, SOLID = 0.36

export const tourPb5 = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY), glass: hex(LOBBY_GLASS), floor: LOBBY_H, pitch: 3 } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(SPANDREL), glass: hex(GLASS), floor: FLOOR, solid: SOLID, depth: 0.25 } }],
  crown: { kind: 'parapet', height: 1.6, colour: hex(SPANDREL) },
  penthouse: 1,
})
