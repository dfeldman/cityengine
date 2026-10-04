/**
 * POINT BONITA (Marin Headlands, 2026-10-04 foot-bridges audit): the 1877 LIGHTHOUSE, a small white tower carrying a
 * black lantern room and gallery under a red roof, and the little SUSPENSION FOOTBRIDGE (1954, rebuilt 2012) that
 * reaches it across the gap — two white towers, a pair of main cables, hangers, a timber deck. The lighthouse was a
 * 4 m stucco box and the bridge a bare plank (NPS "Point Bonita Lighthouse"; Wikipedia).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const WHITE: Rgb = [0.93, 0.93, 0.9]
const BLACK: Rgb = [0.12, 0.12, 0.13]
const RED: Rgb = [0.62, 0.15, 0.12]

export function pointBonitaLighthouse(out: MeshBuilder, fit: Fit): void {
  void fit
  const st = surfaceTag('stucco'), metal = surfaceTag('metal')
  prism(out, 0, 0, 0, 5.5, 1.9, 8, WHITE, st, 1.6)
  prism(out, 0, 0, 5.5, 5.8, 2.3, 12, BLACK, metal, 2.3)
  prism(out, 0, 0, 5.8, 7.4, 1.2, 12, [0.75, 0.82, 0.85], surfaceTag('glass'), 1.2)
  prism(out, 0, 0, 7.4, 8.4, 1.35, 12, RED, metal, 0.2)
  box(out, 0, 8.8, 0, 0.06, 0.4, 0.06, BLACK, metal)
  // the fog-signal house beside it
  box(out, 3.4, 1.5, 0, 1.6, 1.5, 2.2, WHITE, st)
  box(out, 3.4, 3.15, 0, 1.75, 0.15, 2.35, RED, metal)
}

/** The suspension footbridge, laid along its own length (local x), deck at ground level at the ends. */
export function pointBonitaBridge(out: MeshBuilder, fit: Fit): void {
  const L = fit.hx, metal = surfaceTag('metal')
  const T = 6.5, sag = 4.2
  for (const s of [-1, 1]) {
    // the towers: two white posts and a cross beam at each end
    for (const zz of [-1.4, 1.4]) box(out, s * (L - 1), T / 2, zz, 0.25, T / 2, 0.25, WHITE, metal)
    box(out, s * (L - 1), T - 0.2, 0, 0.3, 0.2, 1.6, WHITE, metal)
  }
  // the main cables and the hangers down to the deck
  for (const zz of [-1.4, 1.4]) {
    const N = 12
    let prev: [number, number, number] = [-(L - 1), T, zz]
    for (let k = 1; k <= N; k++) {
      const x = -(L - 1) + (2 * (L - 1) * k) / N, f = x / (L - 1)
      const y = T - sag * (1 - f * f)
      const p: [number, number, number] = [x, y, zz]
      strut(out, prev, p, 0.09, 0.09, BLACK, metal, false)
      if (k < N) strut(out, [x, y, zz], [x, 0.7, zz], 0.02, 0.02, BLACK, metal, false)
      prev = p
    }
  }
  // the deck and its rails
  box(out, 0, 0.55, 0, L - 1, 0.1, 1.2, [0.5, 0.4, 0.3], surfaceTag('clapboard'))
  for (const zz of [-1.2, 1.2]) box(out, 0, 1.6, zz, L - 1, 0.04, 0.04, BLACK, metal)
}

export const POINT_BONITA: Record<string, (out: MeshBuilder, fit: Fit) => void> = { pointBonitaLighthouse, pointBonitaBridge }
