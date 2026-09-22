import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam, block, hex, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/**
 * The Petit Palais (Girault, 1900), across the avenue from the Grand Palais (PARIS_EXPAND §5 A). The gist:
 *
 * - the long low stone front with its Ionic COLONNADE of paired columns under a balustrade;
 * - the monumental ENTRANCE in the middle: a great round arch with the GILDED GATE, framed by columns, under
 *   a sculpted attic, and the DOME behind it with its ribs and lantern;
 * - the end pavilions, a little proud, with arched windows;
 * - the grey slate roofs behind the balustrade.
 *
 * Local frame: long axis x, the avenue front facing −z; fitted to OSM's outline (~130 × 90 m).
 */
export function petitPalais(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#e7ddc8')
  const deep = shade(stone, 0.82)
  const shadow: Rgb = [0.32, 0.31, 0.3]
  const slate = hex('#6c747a')
  const gold: Rgb = [0.86, 0.68, 0.28]
  const hx = Math.min(Math.max(fit.hx, 55), 70)
  const hz = Math.min(Math.max(fit.hz, 38), 48)
  const front = -hz
  const wall = 17
  // the body, round the courtyard garden (a solid block here: the court is out of sight from the avenue)
  block(out, -hx, hx, front + 3, hz, 0, wall, stone)
  block(out, -hx - 0.3, hx + 0.3, front + 2.6, hz + 0.3, wall, wall + 1, deep)
  // the slate roofs, hipped, behind the balustrade
  const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  out.quad([[-hx, wall + 1, front + 3], [hx, wall + 1, front + 3], [hx - 5, wall + 6, front + 8], [-hx + 5, wall + 6, front + 8]], [0, 0.7, -0.7], UVQ, slate, FIXED)
  block(out, -hx + 5, hx - 5, front + 8, hz - 5, wall + 1, wall + 6, slate)
  // the balustrade along the front
  block(out, -hx, hx, front + 2.4, front + 3.2, wall + 1, wall + 1.25, shade(stone, 1.03))
  for (let x = -hx + 0.3; x < hx; x += 0.45) box(out, x, wall + 1.7, front + 2.8, 0.07, 0.45, 0.07, stone, FIXED)
  block(out, -hx, hx, front + 2.4, front + 3.2, wall + 2.15, wall + 2.4, shade(stone, 1.05))

  // the colonnade: paired Ionic columns along the front, the tall arched windows in shadow behind them
  const colonnade = (x0: number, x1: number): void => {
    for (let x = x0 + 2; x <= x1 - 2 + 0.01; x += 5.2) {
      for (const dx of [-0.6, 0.6]) {
        prism(out, x + dx, front + 1.5, 1.5, wall - 1.2, 0.42, 10, stone, FIXED, 0.37)
        box(out, x + dx, wall - 1, front + 1.5, 0.62, 0.2, 0.62, shade(stone, 1.05), FIXED)
      }
      block(out, x + 1.4, x + 3.8, front + 2.95, front + 3, 2.5, wall - 3, shadow)
      prism(out, x + 2.6, front + 2.97, wall - 3, wall - 1.6, 1.2, 10, shadow, FIXED, 0.3)
    }
    block(out, x0, x1, front, front + 3, 0, 1.5, shade(stone, 0.92))
    block(out, x0, x1, front + 0.8, front + 3, wall - 0.8, wall + 1, shade(stone, 1.02))
  }
  colonnade(-hx + 12, -12)
  colonnade(12, hx - 12)

  // the end pavilions, a little proud
  for (const sx of [-1, 1]) {
    const xa = sx > 0 ? hx - 12 : -hx
    const xb = sx > 0 ? hx : -hx + 12
    block(out, xa, xb, front - 1, front + 4, 0, wall + 3, stone)
    block(out, xa - 0.3, xb + 0.3, front - 1.3, front + 4, wall + 3, wall + 4, deep)
    const cx = (xa + xb) / 2
    block(out, cx - 2, cx + 2, front - 1.05, front - 1, 3, wall - 2, shadow)
    prism(out, cx, front - 1.02, wall - 2, wall - 0.4, 2, 10, shadow, FIXED, 0.4)
  }

  // the entrance: a projecting frontispiece, the great arch with the gilded gate, columns, attic, sculpture
  block(out, -12, 12, front - 3, front + 6, 0, wall + 8, stone)
  block(out, -12.4, 12.4, front - 3.4, front + 6, wall + 8, wall + 9.4, deep)
  // the arch's opening, in shadow, and the gate in gilt bars across it
  block(out, -5, 5, front - 3.05, front - 2.95, 2, 13, shadow)
  prism(out, 0, front - 3, 13, 18, 5, 16, shadow, FIXED, 0.1)
  for (let x = -4.6; x <= 4.6; x += 0.5) box(out, x, 7, front - 3.1, 0.04, 5, 0.04, gold, FIXED)
  for (const y of [2.5, 7, 11.5]) box(out, 0, y, front - 3.12, 4.8, 0.06, 0.04, gold, FIXED)
  // the columns framing it, and the sculpted group on the attic
  for (const x of [-9.5, -7, 7, 9.5]) prism(out, x, front - 3.8, 0.5, wall + 7.5, 0.6, 10, stone, FIXED, 0.52)
  prism(out, 0, front - 1.5, wall + 9.4, wall + 13, 2.8, 8, shade(stone, 0.9), FIXED, 1.2)

  // the dome over the entrance: a square base, the drum, the ribbed dome, the lantern
  const dz = front + 12
  block(out, -9, 9, dz - 9, dz + 9, wall + 1, wall + 5, stone)
  prism(out, 0, dz, wall + 5, wall + 10, 7.5, 16, stone, FIXED)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    box(out, Math.sin(a) * 7.55, wall + 7.5, dz + Math.cos(a) * 7.55, 0.5, 1.4, 0.5, shadow, FIXED)
  }
  const bands = 6
  for (let b = 0; b < bands; b++) {
    const t0 = b / bands
    const t1 = (b + 1) / bands
    prism(out, 0, dz, wall + 10 + Math.sin((t0 * Math.PI) / 2) * 10, wall + 10 + Math.sin((t1 * Math.PI) / 2) * 10,
      Math.max(1, 7.8 * Math.cos((t0 * Math.PI) / 2)), 16, slate, FIXED, Math.max(1, 7.8 * Math.cos((t1 * Math.PI) / 2)))
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    let prev: [number, number, number] | null = null
    for (let b = 0; b <= bands; b++) {
      const t = b / bands
      const r = Math.max(1, 7.8 * Math.cos((t * Math.PI) / 2)) + 0.08
      const p: [number, number, number] = [Math.sin(a) * r, wall + 10 + Math.sin((t * Math.PI) / 2) * 10, dz + Math.cos(a) * r]
      if (prev) beam(out, prev, p, 0.12, shade(stone, 1.05))
      prev = p
    }
  }
  prism(out, 0, dz, wall + 20, wall + 23, 1.1, 8, stone, FIXED, 0.9)
  prism(out, 0, dz, wall + 23, wall + 24.5, 0.9, 8, slate, FIXED, 0.1)
  prism(out, 0, dz, wall + 24.5, wall + 25.5, 0.1, 6, gold, FIXED, 0.02)
}
