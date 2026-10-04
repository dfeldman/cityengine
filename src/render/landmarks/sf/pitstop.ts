/**
 * THE GREEN PUBLIC TOILETS (owner, 2026-10-03: "ooh we should do the automated public pay toilets — iconic green. there
 * are not many of them"): JCDecaux's self-cleaning toilets, the Parisian design San Francisco installed from 1995 — a
 * dark green cast kiosk with rounded ends and moulded panels, a low dome with a finial, a brushed-steel sliding door
 * under a sign. Twenty-five of them, by the Public Works "Pit Stop" list (sfpublicworks.org/pitstop); the ones inside
 * the city's box are placed in public-toilets.json, each on the pavement by its corner, the door to the street.
 *
 * Local frame: the door on −z (the manifest's `front` turns it to the street), x along the kiosk.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { dome } from '../kit.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const GREEN: Rgb = [0.11, 0.25, 0.19]
const GREEN_LIGHT: Rgb = [0.17, 0.33, 0.25]
const STEEL: Rgb = [0.62, 0.64, 0.65]
const WHITE: Rgb = [0.92, 0.92, 0.9]

export function pitStopToilet(out: MeshBuilder, _fit: Fit): void {
  const L = 1.25, W = 0.95, H = 2.55
  const metal = surfaceTag('metal')
  // the body: a box with half-round ends
  box(out, 0, H / 2, 0, L, H / 2, W, GREEN, metal)
  for (const s of [-1, 1]) prism(out, s * L, 0, 0, H, W, 14, GREEN, metal)
  // the plinth and the cornice
  box(out, 0, 0.08, 0, L + 0.06, 0.08, W + 0.06, [0.3, 0.31, 0.3], 0)
  for (const s of [-1, 1]) prism(out, s * L, 0, 0, 0.16, W + 0.06, 14, [0.3, 0.31, 0.3], 0)
  box(out, 0, H + 0.08, 0, L + 0.08, 0.08, W + 0.08, GREEN_LIGHT, metal)
  for (const s of [-1, 1]) prism(out, s * L, 0, H, H + 0.16, W + 0.08, 14, GREEN_LIGHT, metal)
  // the moulded panels round the ends and along the back: raised green ribs
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) {
    const a = (Math.PI / 2) * (k / 4) * 2 - Math.PI / 2
    const x = s * (L + Math.cos(a) * (W + 0.02)), z = Math.sin(a) * (W + 0.02)
    box(out, x, H * 0.5, z, 0.05, H * 0.4, 0.05, GREEN_LIGHT, metal)
  }
  for (let k = -2; k <= 2; k++) box(out, k * 0.5, H * 0.5, W + 0.03, 0.05, H * 0.4, 0.03, GREEN_LIGHT, metal)
  // the roof: a low dome over each end and the middle, a finial on top
  dome(out, 0, 0, H + 0.16, W * 0.95, 0.5, GREEN, 12)
  prism(out, 0, 0, H + 0.62, H + 0.95, 0.05, 6, GREEN_LIGHT, metal)
  prism(out, 0, 0, H + 0.95, H + 1.05, 0.1, 8, GREEN_LIGHT, metal, 0.02)
  // the door: brushed steel, in a frame, on the street side (−z); the sign band over it, its pictograms
  box(out, 0, 1.05, -W - 0.02, 0.5, 1.0, 0.03, STEEL, metal)
  box(out, 0, 2.1, -W - 0.03, 0.62, 0.05, 0.03, GREEN_LIGHT, metal)
  box(out, 0, 2.32, -W - 0.04, 0.85, 0.15, 0.03, WHITE, 0)
  for (const x of [-0.25, 0, 0.25]) box(out, x, 2.32, -W - 0.06, 0.05, 0.1, 0.02, GREEN, 0)
  // the push button and the panel beside the door
  box(out, 0.8, 1.2, -W - 0.03, 0.12, 0.2, 0.03, [0.2, 0.2, 0.22], 0)
}

export const PITSTOP: Record<string, (out: MeshBuilder, fit: Fit) => void> = { pitStopToilet }
