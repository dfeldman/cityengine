import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { classicalColumn } from '../column.ts'
import { beam, block, hex, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'
import { arcade, archRing } from './palaces/common.ts'
import { Relief, figure } from './minor/sculpt.ts'

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
 * The entrance redrawn in the top-25 audit (2026-10-30), off "Paris Petit Palais facade W entrance 01a.jpg" (Commons): the great round arch breaking
 * through the attic, its dentilled ring, the deep recess with the tympanum's relief and the small arch inside it; the gold gate; three Ionic
 * columns a side; the flight of steps and the groups at its foot; the two winged figures at the arch's shoulders. It had a pyramid over a door.
 *
 * Local frame: long axis x, the avenue front facing −z; fitted to OSM's outline (~130 × 90 m).
 */
export function petitPalais(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#c6bca6')
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
        classicalColumn(out, x + dx, front + 1.5, 1.5, wall - 1, 0.42, shade(stone, 1.08), { order: 'ionic', tier: 'mid', heading: Math.PI })
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

  // the entrance. The arch, a stone ring standing clear over the attic, its recess, the walls round it
  const zE = front - 4
  const yS = 15.5                                     // the great arch's springing
  const R0 = 8.3, R1 = 10.9
  block(out, -16.5, 16.5, zE + 7, front + 6, 0, wall + 2, stone)
  for (const s of [-1, 1]) {
    block(out, Math.min(s * R0, s * 16.5), Math.max(s * R0, s * 16.5), zE, zE + 6.6, 2.6, yS, stone)
  }
  // the ring: its face, its crown, its soffit, all the way back
  for (let i = 0; i < 18; i++) {
    const a0 = (i / 18) * Math.PI, a1 = ((i + 1) / 18) * Math.PI, am = (a0 + a1) / 2
    const P = (a: number, r: number, z: number): [number, number, number] => [Math.cos(a) * r, yS + Math.sin(a) * r, z]
    const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
    out.quad([P(a0, R0, zE), P(a1, R0, zE), P(a1, R1, zE), P(a0, R1, zE)], [0, 0, -1], UVQ, shade(stone, 1.05), FIXED)
    out.quad([P(a0, R1, zE), P(a1, R1, zE), P(a1, R1, zE + 6.6), P(a0, R1, zE + 6.6)], [Math.cos(am), Math.sin(am), 0], UVQ, shade(stone, 0.9), FIXED)
    out.quad([P(a1, R0, zE), P(a0, R0, zE), P(a0, R0, zE + 6.6), P(a1, R0, zE + 6.6)], [-Math.cos(am), -Math.sin(am), 0], UVQ, shade(stone, 0.66), FIXED)
    // the dentils round its outer edge
    if (i % 1 === 0) box(out, Math.cos(am) * (R1 + 0.1), yS + Math.sin(am) * (R1 + 0.1), zE - 0.1, 0.17, 0.17, 0.25, shade(stone, 1.08), FIXED)
    out.quad([P(a0, R0 + 0.5, zE - 0.05), P(a1, R0 + 0.5, zE - 0.05), P(a1, R0 + 0.8, zE - 0.05), P(a0, R0 + 0.8, zE - 0.05)], [0, 0, -1], UVQ, shade(stone, 0.8), FIXED)
    // and the wall at the back of the recess, round the inner arch: the tympanum
    out.quad([P(a0, 5.1, zE + 6.6), P(a1, 5.1, zE + 6.6), P(a1, R0, zE + 6.6), P(a0, R0, zE + 6.6)], [0, 0, -1], UVQ, shade(stone, 0.82), FIXED)
  }
  // the back wall under the springing, the inner arch with the gate and the glass over it
  const yI = 8.9
  arcade(out, zE + 6.6, -R0, R0, 2.6, yS, [0], 9.2, yI - 2.6 + 4.6, 0.3, shade(stone, 0.82), shade(stone, 0.6), [0.16, 0.24, 0.3], 12)
  archRing(out, zE + 6.6, 0, yI, 4.6, 5.3, 0.25, shade(stone, 0.96), shade(stone, 1.05), 10)
  // the gilded gate across the opening: its bars, its rails, the scrolls in its head and its crest
  const zg = zE + 6.4
  for (let x = -4.5; x <= 4.51; x += 0.6) box(out, x, 5.8, zg, 0.045, 3.2, 0.045, gold, FIXED)
  box(out, 0, 5.8, zg, 0.1, 3.2, 0.08, gold, FIXED)
  for (const y of [2.8, 5.2, 7.2, 9]) box(out, 0, y, zg, 4.6, 0.07, 0.05, gold, FIXED)
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI, a1 = ((i + 1) / 12) * Math.PI
    beam(out, [Math.cos(a0) * 2.7, 6.4 + Math.sin(a0) * 2.7, zg], [Math.cos(a1) * 2.7, 6.4 + Math.sin(a1) * 2.7, zg], 0.06, gold)
    beam(out, [Math.cos(a0) * 4.6, yI + Math.sin(a0) * 4.6, zg - 0.1], [Math.cos(a1) * 4.6, yI + Math.sin(a1) * 4.6, zg - 0.1], 0.06, gold)
  }
  // the tympanum's relief: the group in the middle, those leaning away either side (Commons; massed, not read figure by figure)
  const ty = new Relief(out, 0, yS, zE + 6.55, shade(stone, 0.98), 0.5)
  figure(ty, { k: 0.75, coarse: true, hip: [0, 0.8, 0.25], chest: [0.1, 2, 0.3], head: [0.15, 3, 0.3], armL: [[-0.8, 2.1, 0.32], [-1.2, 3, 0.32]], armR: [[0.9, 2, 0.32], [1.3, 1.1, 0.32]], skirt: { to: [0, -0.6, 0.25], w: 1 } })
  for (const s of [-1, 1]) {
    figure(ty, { k: 0.72, coarse: true, hip: [s * 3.8, -1.2, 0.2], chest: [s * 3.1, -0.1, 0.25], head: [s * 2.6, 0.75, 0.28], armL: [[s * 4, 0.2, 0.28], [s * 4.6, 0.9, 0.28]], legL: [[s * 5, -1.7, 0.22], [s * 6.2, -2, 0.22]], legR: [[s * 4.6, -2, 0.22], [s * 5.8, -2.6, 0.22]] })
    // and the scrolled carving of the jambs, as long panels
    block(out, s * 7.1 - 0.55, s * 7.1 + 0.55, zE + 6.4, zE + 6.6, 2.6, yS, shade(stone, 0.92))
  }
  // the three columns a side on their pedestals, the entablature breaking over them, the attic returning to the colonnade's
  for (const s of [-1, 1]) {
    for (const x of [9.7, 12.2, 15]) {
      block(out, s * x - 0.95, s * x + 0.95, zE - 1.7, zE, 2.6, 4.2, shade(stone, 1.03))
      classicalColumn(out, s * x, zE - 0.85, 4.2, yS - 0.9, 0.82, shade(stone, 1.08), { order: 'ionic', tier: 'near', heading: Math.PI })
    }
    block(out, Math.min(s * 8.3, s * 16.7), Math.max(s * 8.3, s * 16.7), zE - 1.7, zE + 6.6, yS - 0.9, yS + 1.5, shade(stone, 1.05))
    // the winged figure at the arch's shoulder
    block(out, s * 13.4 - 1.5, s * 13.4 + 1.5, zE - 1.2, zE + 2, yS + 1.5, yS + 2.2, stone)
    const sh = new Relief(out, s * 13.4, yS + 2.2, zE - 0.2, shade(stone, 1.06), 0.8)
    figure(sh, { k: 0.45, hip: [0, 1.2, 0.3], chest: [-s * 0.15, 2.4, 0.35], head: [-s * 0.25, 3.25, 0.35], armL: [[-0.75, 2.5, 0.4], [s * 0.2 - 1.2, 3.3, 0.4]], armR: [[0.75, 2.5, 0.4], [s * 0.2 + 1.1, 3.3, 0.4]], legL: [[-0.3, 0.6, 0.35], [-0.5, 0.02, 0.45]], legR: [[0.3, 0.6, 0.35], [0.5, 0.02, 0.45]] })
    sh.wing([s * 0.5, 2.5, 0.05], s > 0 ? 1 : 2.15, s > 0 ? 1.3 : 1.85, 2.4, 5)
    // the group at the stairs' foot
    block(out, s * 16.4 - 2.1, s * 16.4 + 2.1, zE - 6.4, zE - 2.6, 0, 2.2, shade(stone, 0.92))
    const g = new Relief(out, s * 16.4, 2.2, zE - 5, shade(stone, 1.05), 0.8)
    figure(g, { k: 0.62, hip: [0, 1.75, 0.35], chest: [s * -0.1, 3, 0.35], head: [s * -0.15, 4, 0.35], armL: [[-0.75, 3.1, 0.4], [-0.5, 2, 0.45]], armR: [[0.8, 3.1, 0.4], [0.45, 2, 0.45]], skirt: { to: [0, 0.05, 0.3], w: 0.9 } })
    for (const d of [-1, 1]) figure(g, { k: 0.48, hip: [d * 1.2, 0.8, 0.45], chest: [d * 1.15, 1.75, 0.45], head: [d * 1.1, 2.5, 0.45], armL: [[d * 0.75, 1.7, 0.5], [d * 0.5, 1.2, 0.55]], legL: [[d * 1.55, 0.45, 0.6], [d * 1.8, 0.03, 0.7]] })
  }
  // the attic across the back of the arch, over the colonnade's balustrade
  block(out, -16.7, 16.7, zE + 7, front + 6, yS + 1.5, yS + 2.4, shade(stone, 1.03))
  // the flight of steps, its middle carpet of stone
  for (let i = 0; i < 12; i++) {
    const zs = zE - 7.2 + i * 0.6
    block(out, -13 - (11 - i) * 0.2, 13 + (11 - i) * 0.2, zs, i === 11 ? zE + 6.4 : zs + 0.6, 0, 0.2 + i * 0.21, shade(stone, 0.88))
  }

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
