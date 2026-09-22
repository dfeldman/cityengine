import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam, hex, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/**
 * A corner dome (PARIS_EXPAND §5 B, the department stores and the grand hotels): what crowns the corner of a
 * Paris block that wants to be seen down two boulevards — Printemps's copper cupolas, the Galeries
 * Lafayette's, the Samaritaine's on the quai. A drum with round windows, a ribbed dome in weathered copper
 * with gilded ribs, a lantern and a finial. Placed on the roof by the manifest (`offset` y = the eaves);
 * sized by `size` (its diameter).
 */
export function cornerDome(out: MeshBuilder, fit: Fit): void {
  const r = Math.max(2.5, Math.min(9, fit.hx))
  const stone = hex('#e2d8c3')
  const copper: Rgb = [0.36, 0.56, 0.5]
  const gold: Rgb = [0.84, 0.66, 0.26]
  // the drum, with its oculi
  prism(out, 0, 0, 0, r * 0.9, r, 16, stone, FIXED)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    box(out, Math.sin(a) * (r + 0.02), r * 0.5, Math.cos(a) * (r + 0.02), Math.abs(Math.cos(a)) * r * 0.16 + 0.03, r * 0.16, Math.abs(Math.sin(a)) * r * 0.16 + 0.03, [0.2, 0.22, 0.26], FIXED)
  }
  prism(out, 0, 0, r * 0.9, r * 1.05, r * 1.08, 16, shade(stone, 1.04), FIXED)
  // the dome, in bands, onion-ish: swelling a little before it closes
  const H = r * 1.5
  const bands = 7
  const prof = (t: number): number => r * Math.max(0.12, Math.cos(t * Math.PI / 2) * (1 + 0.12 * Math.sin(t * Math.PI)))
  for (let b = 0; b < bands; b++) {
    const t0 = b / bands
    const t1 = (b + 1) / bands
    prism(out, 0, 0, r * 1.05 + t0 * H, r * 1.05 + t1 * H, prof(t0), 16, copper, FIXED, prof(t1))
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    let prev: [number, number, number] | null = null
    for (let b = 0; b <= bands; b++) {
      const t = b / bands
      const p: [number, number, number] = [Math.sin(a) * (prof(t) + 0.05), r * 1.05 + t * H, Math.cos(a) * (prof(t) + 0.05)]
      if (prev) beam(out, prev, p, 0.08 * r / 4, gold)
      prev = p
    }
  }
  // the lantern and finial
  const top = r * 1.05 + H
  prism(out, 0, 0, top, top + r * 0.45, r * 0.22, 8, stone, FIXED, r * 0.18)
  prism(out, 0, 0, top + r * 0.45, top + r * 0.7, r * 0.24, 8, copper, FIXED, 0.05)
  prism(out, 0, 0, top + r * 0.7, top + r * 1.0, 0.08, 6, gold, FIXED, 0.02)
}
