import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { ball } from '../../../sf/embarcadero-plaza.ts'
import { surfaceTag } from '../../../../cartoon-material.ts'

/*
 * L'ARC (Urs Fischer, cast aluminium, unveiled 2022; parvis Alan-Turing, Paris 13e, beside Station F's Halle Freyssinet): a
 * lumpy, hand-modelled-looking silver arch that stands straight on the paving. Three Modly attempts (2026-11-23) fused the
 * Halle's glass front into the model (seen through the arch and behind it), so the arch is a procedural stand-in: overlapping
 * metal blobs along a parabola, fat at the feet and the crown, a little irregular. Frame: x across, z through the arch, y up
 * from the ground (G). Size scaled by eye from Commons / Panoramax photos against the Halle's facade, not surveyed.
 */
export const HX = 4.6
export const HZ = 2.8

// tunables (metres)
const PLATE_HX = 3.9, PLATE_HZ = 1.6, PLATE_H = 0.03
const SPAN = 7.0            // outer width at the feet
const RISE = 7.6            // crown height above the plate
const BLOBS = 15            // blobs along the arch
const R_FOOT = 1.35, R_CROWN = 1.25, R_MID = 0.95   // blob radius at the feet, crown and haunches
const DEPTH_JITTER = 0.35   // blobs wander this far through the arch (z), for the hand-modelled look
const ALU: Rgb = hex('#b6b9bc')

function draw(q: MeshBuilder): void {
  block(q, -PLATE_HX, PLATE_HX, -PLATE_HZ, PLATE_HZ, G, G + PLATE_H, hex('#8e9093'))
  const tag = surfaceTag('metal')
  const half = SPAN / 2 - R_FOOT * 0.6
  for (let i = 0; i < BLOBS; i++) {
    const t = i / (BLOBS - 1)                       // 0 left foot .. 1 right foot
    const s = 2 * t - 1                             // -1 .. 1
    const x = s * half
    const y = G + PLATE_H + RISE * (1 - s * s) * 0.86 + R_FOOT * 0.5
    const edge = Math.abs(s)
    const r = edge > 0.75 ? R_FOOT : edge < 0.25 ? R_CROWN : R_MID
    const jitter = Math.sin(i * 2.17) * DEPTH_JITTER
    const wob = 1 + 0.12 * Math.sin(i * 3.3)
    ball(q, x, y, jitter, r * wob, ALU, tag, 10, 16)
  }
}

export function sculptureLArc(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
