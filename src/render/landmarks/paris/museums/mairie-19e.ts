import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import { sign } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archOn, clockOn, extrude, fitted, palette, pedimentOn, pts, rectOn, slabOn, statue } from '../palaces/common.ts'
import { bands, rustic, stack } from './civic.ts'

const FIXED = 0
/** the design footprint: OSM relation 13114180's box (local −z faces bearing 154.1, the Place Armand-Carrel and the park) */
const HX = 23.6
const HZ = 25.2

/** OSM's outline and court in this frame (osmium, 2026-11-05) */
const OUTER = pts([18.8, 25.2, 18.9, 19.4, 18.9, 12.9, 18.9, 11.5, 21.2, 11.5, 23.6, 11.5, 22.8, 3.7, 22.4, 3.7, 21.0, -13.1, 21.3, -13.2, 21.0, -20.5,
  19.6, -20.5, 5.2, -20.8, 5.3, -25.2, -0.3, -25.1, -5.6, -25.2, -5.7, -20.8, -19.6, -20.7, -21.1, -20.8, -23.6, 11.6, -21.2, 11.5, -18.8, 11.5,
  -18.9, 13.0, -19.0, 14.9, -19.3, 25.0, -13.8, 25.1, -13.7, 24.0, 13.5, 24.0, 13.5, 25.2])
const COURTS = [pts([14.2, 11.2, -14.1, 11.3, -14.1, 9.0, -14.0, 5.8, -14.2, 4.2, -14.5, 3.4, -13.7, -10.2, -5.6, -10.1, -5.5, -8.4, -5.7, -1.7, -3.7, 0.0,
  3.0, 0.4, 5.1, -1.6, 5.0, -8.2, 4.8, -10.2, 13.0, -10.2, 14.6, 4.0, 14.0, 6.1, 13.6, 9.2])]

/** heights read off the Commons photograph "Paris mairie XIX.jpg" (front 42 m ≈ 870 px), checked against the IGN lidar (2026-11-05) */
const E = 14.4 // the wings' cornice
const RISE = 4.6 // the wings' hipped slate (lidar ridges 19–20)
const G = 7 // the first floor
const PE = 15.4 // the pavilion's cornice
const ATTIC = 18.3 // the attic with the inscription
const PYR = 5 // the pavilion's pyramid (lidar 23)
const F = -20.8 // the wings' front
const PF = -25.2 // the pavilion's front
const P0 = -6.1
const P1 = 5.8
const W1 = 21.2 // the wings' outer corners (±)

/**
 * La Mairie du 19e (Gabriel Davioud, 1876–78) on the Place Armand-Carrel, facing the Buttes-Chaumont. What the rider sees from the place:
 *
 * - two red-brick wings banded in stone, four bays each: square ground-floor windows, tall first-floor windows under triangular
 *   pediments, a stone cornice on brackets, a hipped slate roof with brick chimneys;
 * - the stone centre pavilion standing forward: a porch of three arches on four columns, the big window between two statue niches
 *   (Croisy's and Clère's), the attic with "MAIRIE DU XIXe ARRt", the steep pyramid roof with the clock aedicule up its front,
 *   and the little domed lantern and flagstaff on top.
 */
export function mairie19e(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
  sign(out, { type: 'flat', text: 'MAIRIE DU XIXᵉ ARRᵗ', h: 0.55, face: 'roman', colour: [0.28, 0.24, 0.18], tracking: 0.14, lit: 'none', w: 8 },
    { x: ((P0 + P1) / 2) * fit.hx / HX, y: PE + 1.1, z: (PF - 0.12) * fit.hz / HZ, heading: Math.PI })
}

function draw(out: MeshBuilder): void {
  const p = palette('#a5523a', '#3f464c')
  const stone = hex('#d8cdb4')
  p.trim = stone
  p.deep = shade(stone, 0.86)
  extrude(out, [OUTER, ...COURTS], p, { eaves: E, bay: 3.6, win: 1.4, rise: RISE, inset: 4, dormers: false,
    storeys: [{ y: 0, h: 2.8, sill: 1.8 }, { y: G, h: 3.4, sill: 1.3 }] })
  rustic(out, OUTER, 0.4, G - 0.4, 0.7, stone, 5)
  bands(out, OUTER, [G - 0.2], 0.5, 0.18, stone, 5)
  bands(out, OUTER, [E - 0.9], 0.9, 0.3, stone, 5)

  // ---- the two wings' fronts, a skin a little proud of the plan
  for (const s of [-1, 1]) {
    const a = s < 0 ? -W1 : P1
    const b = s < 0 ? P0 : W1
    const f = F - 0.3
    block(out, a, b, f, F + 0.4, 0, E, p.stone)
    for (let y = 0.9; y < G - 0.4; y += 0.7) rectOn(out, '-z', f, a, b, y, y + 0.22, stone, 0.03)
    slabOn(out, '-z', f, a - 0.1, b + 0.1, 0, 0.6, 0.12, shade(stone, 0.85))
    slabOn(out, '-z', f, a - 0.1, b + 0.1, G - 0.3, G + 0.3, 0.2, stone)
    // the quoins at the outer corner
    const qx = s * W1
    for (let y = 0; y < E; y += 0.9) slabOn(out, '-z', f, qx - (s < 0 ? 0 : 1.3) - (y % 1.8 ? 0.4 : 0), qx + (s < 0 ? 1.3 : 0) + (y % 1.8 ? 0.4 : 0), y, y + 0.8, 0.05, stone)
    for (const d of [2.6, 6.1, 9.6, 13.1]) {
      const x = s < 0 ? P0 - d : P1 + d
      rectOn(out, '-z', f, x - 0.95, x + 0.95, 1.6, 5.0, stone, 0.05)
      rectOn(out, '-z', f, x - 0.7, x + 0.7, 1.8, 4.8, p.glass, 0.09)
      rectOn(out, '-z', f, x - 1.0, x + 1.0, G + 1.0, G + 4.9, stone, 0.06)
      rectOn(out, '-z', f, x - 0.75, x + 0.75, G + 1.2, G + 4.6, p.glass, 0.1)
      rectOn(out, '-z', f, x - 0.75, x + 0.75, G + 3.6, G + 3.7, stone, 0.12)
      slabOn(out, '-z', f, x - 1.2, x + 1.2, G + 4.9, G + 5.1, 0.22, stone)
      pedimentOn(out, '-z', f, x - 1.25, x + 1.25, G + 5.1, 0.8, 0.22, stone)
    }
    // the cornice on its brackets
    slabOn(out, '-z', f, a, b, E - 1.1, E - 0.9, 0.18, stone)
    for (let x = a + 0.4; x < b; x += 0.8) slabOn(out, '-z', f, x - 0.12, x + 0.12, E - 0.9, E - 0.35, 0.35, shade(stone, 0.93))
    slabOn(out, '-z', f, a - 0.3, b + 0.3, E - 0.35, E, 0.6, stone)
    // brick chimneys at the hips
    stack(out, s * 13.5, F + 5, E + 1, E + RISE + 1.6, 0.5, 0.9, shade(p.stone, 0.9), p.lead)
    stack(out, s * 16, 18, E + 1, E + RISE + 1.6, 0.5, 0.9, shade(p.stone, 0.9), p.lead)
  }

  // ---- the stone pavilion
  const cx = (P0 + P1) / 2
  const pf = PF
  block(out, P0, P1, pf, -12, 0, ATTIC, stone)
  slabOn(out, '-z', pf, P0 - 0.1, P1 + 0.1, 0, 0.6, 0.12, shade(stone, 0.85))
  // the porch: three arches, the middle one wider, on four columns
  archOn(out, '-z', pf, cx, 0.6, 3.4, 5.4, p.dark, 0.08)
  for (const s of [-1, 1]) archOn(out, '-z', pf, cx + s * 3.9, 0.6, 2.2, 4.6, p.dark, 0.08)
  for (const dx of [-2.6, 2.6, -5.1, 5.1]) {
    prism(out, cx + dx, pf - 0.5, 0.6, 1.2, 0.5, 8, stone, FIXED, 0.5)
    prism(out, cx + dx, pf - 0.5, 1.2, 5.5, 0.32, 12, stone, FIXED, 0.28)
    block(out, cx + dx - 0.45, cx + dx + 0.45, pf - 0.95, pf - 0.05, 5.5, 6.0, stone)
  }
  slabOn(out, '-z', pf, P0 - 0.1, P1 + 0.1, 6.0, G + 0.4, 0.5, stone)
  // the first floor: the big window, the two statues in their niches, the paired pilasters
  rectOn(out, '-z', pf, cx - 1.7, cx + 1.7, G + 1.0, G + 6.0, shade(stone, 1.04), 0.06)
  rectOn(out, '-z', pf, cx - 1.4, cx + 1.4, G + 1.2, G + 5.7, p.glass, 0.1)
  rectOn(out, '-z', pf, cx - 0.06, cx + 0.06, G + 1.2, G + 5.7, stone, 0.13)
  for (const s of [-1, 1]) {
    archOn(out, '-z', pf, cx + s * 3.6, G + 1.4, 1.4, 3.2, shade(stone, 0.7), 0.15)
    statue(out, cx + s * 3.6, pf - 0.1, G + 1.6, 2.4, shade(stone, 1.05))
    pedimentOn(out, '-z', pf, cx + s * 3.6 - 1, cx + s * 3.6 + 1, G + 4.9, 0.6, 0.2, stone)
    for (const dx of [2.2, 2.8, 4.9, 5.5]) slabOn(out, '-z', pf, cx + s * dx - 0.22, cx + s * dx + 0.22, G + 0.4, PE - 0.8, 0.22, stone)
  }
  slabOn(out, '-z', pf, P0 - 0.2, P1 + 0.2, PE - 0.8, PE - 0.4, 0.3, stone)
  slabOn(out, '-z', pf, P0 - 0.5, P1 + 0.5, PE - 0.4, PE, 0.75, stone)
  // the attic and its cornice, the vases on its corners
  rectOn(out, '-z', pf, cx - 4.4, cx + 4.4, PE + 0.6, ATTIC - 0.9, shade(stone, 0.95), 0.04)
  slabOn(out, '-z', pf, P0 - 0.3, P1 + 0.3, ATTIC - 0.4, ATTIC, 0.45, stone)
  for (const s of [-1, 1]) prism(out, cx + s * (P1 - P0) / 2 - s * 0.4, pf + 0.4, ATTIC, ATTIC + 1.1, 0.3, 8, stone, FIXED, 0.18)

  // ---- the pyramid roof, the clock aedicule up its front, the lantern and flagstaff on top
  const rz0 = pf + 0.2
  const rz1 = -13
  const w = P1 - P0
  roof(out, P0 + 0.2, P1 - 0.2, rz0, rz1, ATTIC, PYR, w / 2 - 0.4, (rz1 - rz0) / 2 - 0.4, p.slate)
  const af = pf + 0.4
  block(out, cx - 1.7, cx + 1.7, af, af + 3, ATTIC, ATTIC + 3.6, stone)
  clockOn(out, '-z', af, cx, ATTIC + 1.7, 0.95, p)
  slabOn(out, '-z', af, cx - 1.9, cx + 1.9, ATTIC + 3.6, ATTIC + 3.9, 0.2, stone)
  pedimentOn(out, '-z', af, cx - 1.9, cx + 1.9, ATTIC + 3.9, 0.9, 0.2, stone)
  for (const s of [-1, 1]) block(out, cx + s * 2 - 0.35, cx + s * 2 + 0.35, af, af + 1.4, ATTIC, ATTIC + 2.2, stone)
  const lz = (rz0 + rz1) / 2
  const ly = ATTIC + PYR - 0.3
  block(out, cx - 1, cx + 1, lz - 1, lz + 1, ly, ly + 1.2, stone)
  prism(out, cx, lz, ly + 1.2, ly + 1.4, 1.15, 8, stone, FIXED, 1.15)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    const x = cx + Math.cos(a) * 0.65
    const z = lz + Math.sin(a) * 0.65
    block(out, x - 0.18, x + 0.18, z - 0.18, z + 0.18, ly + 1.4, ly + 3, stone)
  }
  prism(out, cx, lz, ly + 1.4, ly + 3, 0.4, 8, p.dark, FIXED, 0.4)
  prism(out, cx, lz, ly + 3, ly + 3.25, 1.05, 8, stone, FIXED, 1.05)
  prism(out, cx, lz, ly + 3.25, ly + 4.4, 0.95, 12, p.lead, FIXED, 0.25)
  prism(out, cx, lz, ly + 4.4, ly + 8.5, 0.05, 4, p.dark, FIXED, 0.04)
}
