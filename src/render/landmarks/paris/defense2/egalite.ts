import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower, type Face, type TowerSpec } from '../../tower.ts'
import { registerRing, type P2 } from '../museums/enframe.ts'

/**
 * STEPPED-PARTS KIT shared by the Puteaux/Courbevoie residential blocks (Égalité, Fraternité, Minerve, la Sirène):
 * each BD TOPO `batiment` polygon under the OSM ring is its own prism at its own BD TOPO height, registered onto the
 * fitted footprint by the OSM ring's hull moments (museums/enframe.ts). Rings are east/north metres from the OSM
 * centroid, from the local BD TOPO cache (tools/cache/bdtopo, properties.h).
 */
export interface StepPart { h: number; ring: P2[] }
export interface StepLook { face: Face; lobby: Face; lobbyH: number; roof: string; parapet: number; parapetColour: string }

export function steppedParts(out: MeshBuilder, fit: Fit, osm: P2[], parts: StepPart[], look: StepLook): void {
  const F = registerRing(osm, fit)
  for (const p of parts) {
    const ring = p.ring.map(([e, n]) => F.xz(e, n))
    const sub: Fit = { ...fit, ring, holes: undefined, height: p.h }
    const spec: TowerSpec = {
      height: p.h, roof: hex(look.roof),
      base: p.h > look.lobbyH * 3 ? { height: look.lobbyH, face: look.lobby } : undefined,
      tiers: [{ to: 1, face: look.face }],
      crown: { kind: 'parapet', height: look.parapet, colour: hex(look.parapetColour) },
    }
    tower(out, sub, spec)
  }
}

/**
 * Jacques Kalisz's Liberté-Égalité-Fraternité group (Puteaux, 1970s): terraced blocks stepping from ~22 to ~54 m,
 * grey-beige concrete with deep continuous balcony slabs and dark window strips (Panoramax street frames).
 */
export const KALISZ_WALL = '#bdb5a8', KALISZ_WINDOW = '#6c7276', KALISZ_LOBBY = '#55534f', KALISZ_ROOF = '#8c8984'
export const KALISZ_FLOOR = 2.9, KALISZ_SOLID = 0.45, KALISZ_DEPTH = 1.1
export const KALISZ: StepLook = {
  face: { kind: 'bands', wall: hex(KALISZ_WALL), glass: hex(KALISZ_WINDOW), floor: KALISZ_FLOOR, solid: KALISZ_SOLID, depth: KALISZ_DEPTH },
  lobby: { kind: 'curtain', wall: hex(KALISZ_LOBBY), glass: hex('#3e4548'), floor: 4, pitch: 3 },
  lobbyH: 4, roof: KALISZ_ROOF, parapet: 1.1, parapetColour: KALISZ_WALL,
}

const OSM: P2[] = [[-39.4, 21.2], [-8.3, 6.3], [-1.6, -12.9], [-31.8, -75.4], [-19.0, -81.6], [-17.1, -82.5], [8.7, -29.0], [15.7, -26.5], [33.0, -34.7], [37.0, -26.4], [40.0, -20.1], [13.8, -7.5], [7.1, 11.6], [23.1, 45.0], [16.1, 48.4], [13.4, 49.7], [8.5, 52.1], [-3.3, 27.7], [-5.0, 27.0], [-9.0, 25.7], [-10.3, 25.2], [-32.3, 35.8]]
const PARTS: StepPart[] = [
  { h: 51.4, ring: [[-18.4, 11.1], [-12.4, 8.1], [-8.3, 6.2], [-1.5, -12.9], [-2.3, -14.3], [-5.8, -21.6], [6.7, -27.7], [8.8, -28.9], [15.7, -26.5], [16.9, -25.2], [23.3, -12.1], [13.8, -7.5], [7.1, 11.7], [9.7, 17.2], [12.2, 22.6], [10.5, 23.5], [-2.6, 29.2], [-4.5, 25.5], [-8.4, 24.4], [-11.1, 25.6], [-12.2, 23.4]] },
  { h: 22.2, ring: [[-28.8, -69.2], [-31.8, -75.5], [-27.1, -77.7], [-22.0, -80.1], [-17.1, -82.4], [-4.0, -55.4], [-18.9, -48.7], [-25.0, -61.5]] },
  { h: 33.8, ring: [[-39.3, 21.2], [-36.3, 19.6], [-34.6, 18.8], [-18.4, 11.1], [-12.2, 23.4], [-11.1, 25.6], [-15.2, 27.6], [-26.6, 33.0], [-32.3, 35.9]] },
  { h: 33.8, ring: [[-5.8, -21.6], [-18.9, -48.7], [-4.0, -55.4], [8.8, -28.9], [6.7, -27.7], [-5.3, -21.7]] },
  { h: 33.8, ring: [[8.3, 51.7], [-2.6, 29.2], [10.5, 23.5], [12.2, 22.6], [18.8, 35.9], [23.2, 45.0], [8.5, 52.0]] },
  { h: 33.8, ring: [[16.9, -25.2], [15.8, -26.6], [33.0, -34.8], [38.9, -22.3], [40.0, -20.1], [37.3, -18.8], [23.3, -12.1]] },
]

/** Égalité (OSM way/50783214): a 51.4 m core with four 33.8 m wings and a 22.2 m tail, per BD TOPO. */
export const egalite = (out: MeshBuilder, fit: Fit): void => steppedParts(out, fit, OSM, PARTS, KALISZ)
