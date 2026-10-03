/**
 * Two of the Mission Street towers backing onto Salesforce Park (docs/SALESFORCE-PARK.md; the owner: "every single
 * building on the mission street side is architecturally significant"):
 *
 * - 555 MISSION (2008; Kohn Pedersen Fox with Heller Manus; 148 m): "translucent green glass, vertical glass fin
 *   mullions, a series of setbacks, and a dramatizing crown" — the fins catch the light ("a prism effect"), the crown
 *   is lit at night.
 * - 535 MISSION (2014; HOK; 115 m): "a slender, graceful urban form with TAPERED façade corners" in a sleek unitized
 *   skin, "each side reads as a single blue or silver pane": the corners are cut back more and more as it rises.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import type { Fit } from '../fit.ts'
import { faceBand, tower, type TowerSpec } from '../tower.ts'

const GREEN_GLASS: Rgb = [0.40, 0.58, 0.56]
const FIN: Rgb = [0.72, 0.80, 0.78]

const spec555: TowerSpec = {
  height: 148,
  base: { height: 9, face: { kind: 'curtain', wall: FIN, glass: [0.48, 0.62, 0.60], pitch: 3, floor: 9, material: 'glass' } },
  tiers: [
    { to: 0.78, face: { kind: 'fins', wall: FIN, glass: GREEN_GLASS, floor: 4.0, pitch: 1.5, solid: 0.08, depth: 0.4, material: 'glass' } },
    { to: 0.88, inset: 2.5, face: { kind: 'fins', wall: FIN, glass: GREEN_GLASS, floor: 4.0, pitch: 1.5, solid: 0.08, depth: 0.4, material: 'glass' } },
    { to: 0.95, inset: 2.5, face: { kind: 'fins', wall: FIN, glass: GREEN_GLASS, floor: 4.0, pitch: 1.5, solid: 0.08, depth: 0.4, material: 'glass' } },
  ],
  // the crown: a tall glass lantern, lit
  crown: { kind: 'lantern', height: 9, inset: 2, face: { kind: 'curtain', wall: FIN, glass: [0.78, 0.92, 0.88], pitch: 1.5, floor: 9, material: 'glass' } },
}

export function fiveFiveFiveMission(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 148 }, spec555)
}

const BLUE_SILVER: Rgb = [0.52, 0.62, 0.70]
const MULL: Rgb = [0.74, 0.77, 0.80]
const GLASS = surfaceTag('glass')

/** an octagon: a hx × hz box with its corners cut `c` metres back along each face */
function chamfered(hx: number, hz: number, c: number): { x: number; z: number }[] {
  return [
    { x: -hx + c, z: -hz }, { x: hx - c, z: -hz }, { x: hx, z: -hz + c }, { x: hx, z: hz - c },
    { x: hx - c, z: hz }, { x: -hx + c, z: hz }, { x: -hx, z: hz - c }, { x: -hx, z: -hz + c },
  ]
}

export function fiveThreeFiveMission(out: MeshBuilder, fit: Fit): void {
  const H = 115
  const hx = Math.max(12, fit.hx)
  const hz = Math.max(12, fit.hz)
  // (fine enough that the taper reads as a slope, not a stair: a quarter-metre a band)
  const bands = 36
  for (let k = 0; k < bands; k++) {
    const y0 = (H * k) / bands
    const y1 = (H * (k + 1)) / bands
    // the corners taper: cut back 1.5 m at the foot, a fifth of the narrow side at the top
    const c = 1.5 + (Math.min(hx, hz) * 0.42 - 1.5) * ((k + 0.5) / bands)
    faceBand(out, chamfered(hx, hz, c), y0, y1, { kind: 'curtain', wall: MULL, glass: k < 3 ? [0.60, 0.70, 0.76] : BLUE_SILVER, pitch: 1.5, floor: 4.1, material: 'glass' })
    if (k === bands - 1) capPolygon(out, chamfered(hx, hz, c), y1, MULL, GLASS)
  }
}
