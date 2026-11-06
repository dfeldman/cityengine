import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import { sign } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archOn, clockOn, extrude, fitted, palette, pedimentOn, pts, rectOn, slabOn, statue } from '../palaces/common.ts'
import { bands, stack } from './civic.ts'

const FIXED = 0
/** the design footprint: OSM relation 1708164's box (local −z faces bearing 308.6, the fork of the Avenue Daumesnil) */
const HX = 37.8
const HZ = 24.3

/** OSM's outline and its two courts in this frame (osmium, 2026-11-05) */
const OUTER = pts([-24.8, -19.1, -27.1, -13.3, -26.7, -13.2, -31.0, -1.9, -37.8, 15.7, -36.2, 16.2, -33.1, 17.7, -31.6, 18.3, -29.2, 19.1, -28.5, 19.7,
  -28.0, 18.4, -26.7, 14.4, -26.4, 13.9, -17.1, 19.3, -17.2, 24.3, -9.9, 24.3, -9.9, 23.1, 9.9, 23.2, 9.9, 24.3, 17.0, 24.3, 17.1, 23.4, 16.8, 23.3,
  17.0, 19.3, 26.5, 13.9, 26.5, 14.3, 26.8, 14.3, 28.3, 19.2, 32.9, 17.6, 35.7, 16.6, 37.8, 15.8, 37.5, 14.9, 35.9, 10.2, 35.4, 10.3, 31.3, -1.5,
  27.0, -13.3, 27.4, -13.4, 25.3, -19.1, 4.5, -19.0, 4.4, -24.2, -4.0, -24.2, -4.0, -19.1])
const COURTS = [
  pts([-20.7, -3.1, -7.1, -3.0, -7.1, 0.9, -6.0, 0.9, -6.1, 10.8, -9.9, 10.7, -9.9, 9.7, -17.2, 9.7, -17.2, 10.5, -17.1, 14.7, -25.5, 10.0]),
  pts([7.3, -2.9, 21.0, -2.9, 25.6, 10.0, 16.9, 14.9, 17.0, 10.6, 10.2, 10.8, 6.3, 10.8, 6.2, 1.0, 7.2, 0.9])]

/** heights from the Commons photographs (Chabe01, "Mairie 12e arrondissement Paris 4.jpg") and the IGN lidar MNS (2026-11-05):
 *  mansards top at 17–18 m, the pavilion's pyramid at 20 m; the belfry is too thin for the lidar and is read off the photo */
const E = 12.6 // the wings' cornice
const RISE = 5.4 // the wings' slate mansard (lidar 18)
const G = 5.6 // the first floor
const PE = 13.8 // the pavilion's cornice
const PYR = 7 // the pavilion's truncated pyramid, to ~21 m (lidar 20 on its flat)
const BELFRY = 13 // the belfry above the pyramid's flat top
const PF = -24.2 // the pavilion's front
const F = -19.1 // the wings' front
const PW = 6 // the pavilion's half width
const PBACK = -8

/**
 * La Mairie du 12e (Antoine-Julien Hénard, 1873–77) on the Avenue Daumesnil: a long cream-stone Louis XIII/Second-Empire front of
 * two storeys under a slate mansard with pedimented dormers and tall chimneys, brick-and-stone lozenge panels between the windows,
 * the centre pavilion standing forward with its triple arcade, statue niches and big window, a steep truncated pyramid with a
 * clock aedicule on its front, and the open iron-balconied belfry that makes the skyline mark.
 */
export function mairie12e(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
  sign(out, { type: 'flat', text: 'MAIRIE DU XIIᵉ ARRᵗ', h: 0.5, face: 'roman', colour: [0.28, 0.24, 0.18], tracking: 0.14, lit: 'none', w: 8 },
    { x: 0, y: PE - 1.6, z: (PF - 0.12) * fit.hz / HZ, heading: Math.PI })
}

function draw(out: MeshBuilder): void {
  const p = palette('#d9cba4', '#434a52')
  const stone = hex('#dccfa8')
  const brick = hex('#a8573e')
  p.trim = shade(stone, 1.03)
  p.deep = shade(stone, 0.86)
  extrude(out, [OUTER, ...COURTS], p, { eaves: E, bay: 3.4, win: 1.3, rise: RISE, inset: 3.2, dormers: true,
    storeys: [{ y: 0, h: 3.0, sill: 1.4 }, { y: G, h: 3.8, sill: 1.0 }] })
  bands(out, OUTER, [G - 0.2], 0.5, 0.18, stone, 5)
  bands(out, OUTER, [E - 0.9], 0.9, 0.3, stone, 5)

  // ---- the front wings: a skin proud of the plan, brick-and-stone lozenge panels between the window pairs, brackets under the cornice
  const f = F - 0.3
  for (const [a, b] of [[-24.8, -PW], [PW, 25.3]] as const) {
    block(out, a, b, f, F + 0.4, 0, E, p.stone)
    slabOn(out, '-z', f, a - 0.1, b + 0.1, 0, 0.6, 0.12, shade(stone, 0.88))
    slabOn(out, '-z', f, a - 0.1, b + 0.1, G - 0.3, G + 0.3, 0.2, stone)
    for (let x = a + 1.7; x < b - 1; x += 3.4) {
      // pairs of windows with a brick lozenge between them
      rectOn(out, '-z', f, x - 0.75, x + 0.75, 1.5, 4.5, stone, 0.05)
      rectOn(out, '-z', f, x - 0.55, x + 0.55, 1.7, 4.4, p.glass, 0.09)
      rectOn(out, '-z', f, x - 0.8, x + 0.8, G + 1.0, G + 4.8, stone, 0.06)
      rectOn(out, '-z', f, x - 0.6, x + 0.6, G + 1.2, G + 4.6, p.glass, 0.1)
      slabOn(out, '-z', f, x - 0.95, x + 0.95, G + 4.8, G + 5.0, 0.22, stone)
    }
    for (let x = a + 3.4; x < b - 1.5; x += 6.8) {
      rectOn(out, '-z', f, x - 0.5, x + 0.5, 1.6, 4.4, brick, 0.07)
      rectOn(out, '-z', f, x - 0.5, x + 0.5, G + 1.0, G + 4.6, brick, 0.07)
    }
    slabOn(out, '-z', f, a, b, E - 1.1, E - 0.9, 0.18, stone)
    for (let x = a + 0.4; x < b; x += 0.8) slabOn(out, '-z', f, x - 0.12, x + 0.12, E - 0.9, E - 0.35, 0.35, shade(stone, 0.93))
    slabOn(out, '-z', f, a - 0.3, b + 0.3, E - 0.35, E, 0.6, stone)
  }
  for (const x of [-16, -8.5, 8.5, 16, 22]) stack(out, x, F + 7, E + 1, E + RISE + 2.4, 0.5, 0.9, shade(stone, 0.95), p.lead)

  // ---- the stone pavilion
  const pf = PF
  block(out, -PW, PW, pf, PBACK, 0, PE, stone)
  slabOn(out, '-z', pf, -PW - 0.1, PW + 0.1, 0, 0.6, 0.12, shade(stone, 0.88))
  // the arcade: three arches
  archOn(out, '-z', pf, 0, 0.6, 2.6, 4.6, p.dark, 0.08)
  for (const s of [-1, 1]) archOn(out, '-z', pf, s * 3.6, 0.6, 1.9, 4.0, p.dark, 0.08)
  for (const dx of [-1.9, 1.9, -5.2, 5.2]) prism(out, dx, pf - 0.4, 0.6, 4.8, 0.3, 10, stone, FIXED, 0.28)
  slabOn(out, '-z', pf, -PW - 0.3, PW + 0.3, 4.8, G + 0.3, 0.5, stone)
  // the first floor: triple window, a balcony, statues in niches, the paired pilasters
  rectOn(out, '-z', pf, -2.0, 2.0, G + 1.0, G + 5.6, shade(stone, 1.04), 0.06)
  for (const dx of [-1.3, 0, 1.3]) rectOn(out, '-z', pf, dx - 0.5, dx + 0.5, G + 1.2, G + 5.3, p.glass, 0.1)
  slabOn(out, '-z', pf, -2.3, 2.3, G + 0.5, G + 0.9, 0.5, stone)
  for (const s of [-1, 1]) {
    archOn(out, '-z', pf, s * 3.7, G + 1.2, 0.95, 3.2, shade(stone, 0.7), 0.15)
    statue(out, s * 3.7, pf - 0.1, G + 1.4, 2.3, shade(stone, 1.05))
    for (const dx of [2.5, 5.1]) slabOn(out, '-z', pf, s * dx - 0.28, s * dx + 0.28, G + 0.4, PE - 1.0, 0.25, stone)
  }
  slabOn(out, '-z', pf, -PW - 0.2, PW + 0.2, PE - 1.0, PE - 0.5, 0.3, stone)
  slabOn(out, '-z', pf, -PW - 0.5, PW + 0.5, PE - 0.5, PE, 0.8, stone)
  for (const s of [-1, 1]) prism(out, s * (PW - 0.5), pf + 0.5, PE, PE + 1.0, 0.3, 8, stone, FIXED, 0.18)

  // ---- the pyramid roof with the clock aedicule up its front
  const rz0 = pf + 0.2
  roof(out, -PW + 0.2, PW - 0.2, rz0, PBACK, PE, PYR, 3.8, 5.5, p.slate)
  const af = pf + 0.4
  block(out, -2.2, 2.2, af, af + 3, PE, PE + 5.2, stone)
  clockOn(out, '-z', af, 0, PE + 3.1, 0.95, p)
  slabOn(out, '-z', af, -2.4, 2.4, PE + 5.2, PE + 5.5, 0.2, stone)
  pedimentOn(out, '-z', af, -2.4, 2.4, PE + 5.5, 0.9, 0.2, stone)

  // ---- the belfry on the flat top: a stone drum, an iron balcony, an open lantern, a slate cap and a finial
  const top = PE + PYR
  const lz = (rz0 + PBACK) / 2 - 1
  block(out, -2.2, 2.2, lz - 2.2, lz + 2.2, top, top + 3.4, stone)
  slabOn(out, '-z', lz - 2.2, -3.0, 3.0, top + 3.4, top + 3.8, 0.8, stone)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    block(out, Math.cos(a) * 2.9 - 0.05, Math.cos(a) * 2.9 + 0.05, lz + Math.sin(a) * 2.9 - 0.05, lz + Math.sin(a) * 2.9 + 0.05, top + 3.8, top + 4.9, p.dark)
  }
  prism(out, 0, lz, top + 3.8, top + 5.0, 2.2, 8, shade(stone, 0.95), FIXED, 2.2)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    block(out, Math.cos(a) * 1.8 - 0.18, Math.cos(a) * 1.8 + 0.18, lz + Math.sin(a) * 1.8 - 0.18, lz + Math.sin(a) * 1.8 + 0.18, top + 5.0, top + 8.2, stone)
  }
  prism(out, 0, lz, top + 5.2, top + 8.0, 1.2, 8, p.dark, FIXED, 1.2)
  prism(out, 0, lz, top + 8.2, top + 8.6, 2.4, 8, stone, FIXED, 2.4)
  prism(out, 0, lz, top + 8.6, top + BELFRY, 2.0, 12, p.slate, FIXED, 0.25)
  prism(out, 0, lz, top + BELFRY, top + BELFRY + 3, 0.06, 4, p.dark, FIXED, 0.05)
}
