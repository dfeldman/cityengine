import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { beam, block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * ARC DÉPLACÉ (Christine O'Loughlin, 1994): on the esplanade lawn a half-disc of turf 22 m across was cut out and turned a half
 * turn, so the lawn's edge bulges as a stone-kerbed half-circle (Wikipedia fr; Panoramax 2017 shows a long curved kerb round the
 * lawn). Drawn as the kerbed half-disc of grass, flat on the chord side (x axis, bulging toward +z). Which way it bulges and the
 * kerb's section are guessed; the radius is the published 11 m.
 */
export const R = 11
export const HX = R + 0.5
export const HZ = R / 2 + 0.3

// tunables (metres)
const KERB_W = 0.3, KERB_H = 0.14, TURF_H = 0.06, SEG = 28
const KERB: Rgb = hex('#a8a59c')
const TURF: Rgb = hex('#4d7a3a')

function draw(q: MeshBuilder): void {
  const zc = -R / 2
  // turf: horizontal strips across the half-disc
  const N = 14
  for (let i = 0; i < N; i++) {
    const z0 = (i / N) * R, z1 = ((i + 1) / N) * R
    const w = Math.sqrt(Math.max(0, R * R - ((z0 + z1) / 2) ** 2))
    block(q, -w, w, z0 + zc, z1 + zc, G, G + TURF_H, TURF)
  }
  // kerb: short blocks along the arc
  for (let i = 0; i < SEG; i++) {
    const a0 = (i / SEG) * Math.PI, a1 = ((i + 1) / SEG) * Math.PI
    const r = R + KERB_W / 2, y = G + KERB_H / 2
    beam(q, [Math.cos(a0) * r, y, Math.sin(a0) * r + zc], [Math.cos(a1) * r, y, Math.sin(a1) * r + zc], KERB_W / 2, shade(KERB, 0.95 + (i % 2) * 0.08), KERB_H / 2)
  }
  block(q, -R - KERB_W, R + KERB_W, zc - KERB_W, zc, G, G + KERB_H, shade(KERB, 0.9))
}

export function arcDeplace(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
