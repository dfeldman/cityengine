import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import { sign } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archOn, clockOn, extrude, fitted, palette, pedimentOn, pts, rectOn, slabOn } from '../palaces/common.ts'
import { bands } from './civic.ts'

const FIXED = 0
/** the design footprint: OSM relation 976402's outer box (local −z faces bearing 97.4, east across the Place Saint-Sulpice) */
const HX = 32.8
const HZ = 25.2

/** OSM's outline and its inner court in this frame (osmium, 2026-11-05) */
const OUTER = pts([31.1, 25.2, 31.9, 23.6, 32.1, 23.0, 32.5, 21.8, 32.6, 21.3, 32.7, 20.6, 32.8, 19.9, 32.4, 18.1, 32.0, 16.3, 31.3, 14.6, 32.1, 14.2, 30.6, 1.6, 30.4, 0.2, 27.9, -21.9, 26.3, -23.4, 25.0, -24.5, 24.6, -24.8, 8.8, -24.7, 7.9, -24.7, 7.9, -25.2, 5.8, -25.2, 5.8, -24.6, 2.7, -24.6, 2.7, -25.2, 1.3, -25.2, 1.3, -24.6, -0.2, -24.6, -1.8, -24.6, -1.8, -25.1, -3.2, -25.1, -3.2, -24.6, -6.3, -24.5, -6.3, -25.1, -8.3, -25.0, -8.3, -24.5, -8.9, -24.5, -30.3, -24.3, -30.5, -20.3, -26.4, -20.3, -26.3, -5.3, -31.1, -5.5, -31.1, -4.8, -31.4, 0.6, -31.8, 8.0, -32.5, 19.0, -32.8, 25.2, -19.6, 25.2, -1.7, 25.2, 18.5, 25.2, 30.9, 25.2])
const COURT = pts([18.5, 10.9, -18.4, 11.0, -18.5, -8.6, -9.7, -8.6, -9.7, -6.0, -0.1, -6.0, 9.5, -6.1, 9.5, -8.8, 18.4, -8.8])

/** heights: Commons photograph PH77328 (the place under snow, c.1900), checked against the IGN lidar MNS (2026-11-05):
 *  cornice ~15.5 m, roof plateau ~20 m, the clock gable ~22 m; the bell lantern is too thin for lidar and is read off the print */
const E = 15.5 // the cornice
const RISE = 4.5 // the low hipped slate roof
const INSET = 7 // how far the roof's top is drawn in
const G = 6.4 // the first floor
const F = -24.6 // the front plane
const PX = 8.8 // the central pavilion's half width
const WL = -30.3 // the left end of the front
const WR = 24.6 // the right end
const PITCH = 5.3 // window to window along the wings
const GABLE = 3.4 // the clock gable's half width
const GABLE_Y = 6.8 // its height above the cornice
const STACK = 4.5 // chimney height above the roof plateau

/**
 * La Mairie du 6e (Auguste-Joseph Magne, 1848–49) on the Place Saint-Sulpice: a long, plain cream-stone front of two storeys,
 * the ground floor drawn in horizontal joints, the first floor in tall windows with simple surrounds, a cornice, then a low
 * hipped slate roof with tall chimneys. The central pavilion stands forward with a triple arcade, two windows above and a
 * clock gable carrying a small domed bell lantern.
 */
export function mairie6e(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
  sign(out, { type: 'flat', text: 'MAIRIE DU VIᵉ ARRᵗ', h: 0.5, face: 'roman', colour: [0.3, 0.26, 0.2], tracking: 0.14, lit: 'none', w: 8 },
    { x: 0, y: G - 0.7, z: (F - 0.65) * fit.hz / HZ, heading: Math.PI })
}

function draw(out: MeshBuilder): void {
  const p = palette('#d6cdb6', '#454b51')
  const stone = hex('#d6cdb6')
  p.trim = shade(stone, 1.03)
  p.deep = shade(stone, 0.86)
  extrude(out, [OUTER, COURT], p, { eaves: E, bay: 4.4, win: 1.5, rise: RISE, inset: INSET, dormers: false,
    storeys: [{ y: 0, h: 3.4, sill: 1.2 }, { y: G, h: 4.4, sill: 1.1 }] })
  bands(out, OUTER, [G - 0.2], 0.5, 0.18, stone, 5)
  bands(out, OUTER, [E - 0.9], 0.9, 0.3, stone, 5)

  // ---- the front skin
  const f = F - 0.3
  block(out, WL, WR, f, F + 1.8, 0, E, p.stone)
  for (let y = 0.9; y < G - 0.4; y += 0.8) rectOn(out, '-z', f, WL, WR, y, y + 0.22, stone, 0.03)
  slabOn(out, '-z', f, WL - 0.1, WR + 0.1, 0, 0.6, 0.12, shade(stone, 0.85))
  slabOn(out, '-z', f, WL - 0.1, WR + 0.1, G - 0.4, G + 0.3, 0.25, stone)
  // wings: ground floor windows with a stone surround, first floor tall windows with a sill and a lintel
  const wing = (x0: number, x1: number): void => {
    const n = Math.round((x1 - x0) / PITCH)
    const step = (x1 - x0) / n
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.5) * step
      rectOn(out, '-z', f, x - 0.8, x + 0.8, 1.5, 4.4, stone, 0.05)
      rectOn(out, '-z', f, x - 0.62, x + 0.62, 1.7, 4.2, p.glass, 0.09)
      rectOn(out, '-z', f, x - 1.05, x + 1.05, G + 1.0, G + 6.2, stone, 0.08)
      rectOn(out, '-z', f, x - 0.8, x + 0.8, G + 1.3, G + 5.9, p.glass, 0.12)
      rectOn(out, '-z', f, x - 0.8, x + 0.8, G + 3.9, G + 4.05, stone, 0.14)
      slabOn(out, '-z', f, x - 1.25, x + 1.25, G + 6.2, G + 6.5, 0.25, stone)
      slabOn(out, '-z', f, x - 1.15, x + 1.15, G + 0.7, G + 1.0, 0.22, stone)
    }
  }
  wing(WL + 0.6, -PX - 0.2)
  wing(PX + 0.2, WR - 0.6)
  // end pilasters
  for (const x of [WL + 0.3, WR - 0.3, -PX - 0.3, PX + 0.3]) slabOn(out, '-z', f, x - 0.3, x + 0.3, G + 0.3, E - 1.2, 0.3, shade(stone, 1.03))

  // ---- the central pavilion: stands forward, triple arcade, two windows between pilasters
  const pf = f - 0.5
  block(out, -PX, PX, pf, F + 1.8, 0, E, p.stone)
  for (let y = 0.9; y < G - 0.4; y += 0.8) rectOn(out, '-z', pf, -PX, PX, y, y + 0.22, stone, 0.03)
  slabOn(out, '-z', pf, -PX - 0.1, PX + 0.1, 0, 0.6, 0.12, shade(stone, 0.85))
  slabOn(out, '-z', pf, -PX - 0.15, PX + 0.15, G - 0.4, G + 0.3, 0.28, stone)
  for (const x of [-5.6, 0, 5.6]) {
    archOn(out, '-z', pf, x, 0.5, 3.6, 5.6, shade(stone, 0.8), 0.07)
    archOn(out, '-z', pf, x, 0.8, 3.0, 5.0, p.dark, 0.11)
  }
  for (const x of [-2.8, 2.8, -8.3, 8.3]) slabOn(out, '-z', pf, x - 0.35, x + 0.35, 0.6, G - 0.4, 0.3, shade(stone, 1.03))
  for (const x of [-2.8, 2.8]) {
    rectOn(out, '-z', pf, x - 1.2, x + 1.2, G + 0.9, G + 6.5, stone, 0.08)
    rectOn(out, '-z', pf, x - 0.95, x + 0.95, G + 1.2, G + 6.2, p.glass, 0.12)
    rectOn(out, '-z', pf, x - 0.95, x + 0.95, G + 4.1, G + 4.25, stone, 0.14)
    slabOn(out, '-z', pf, x - 1.4, x + 1.4, G + 6.5, G + 6.8, 0.25, stone)
  }
  for (const x of [-PX + 0.4, 0, PX - 0.4]) slabOn(out, '-z', pf, x - 0.3, x + 0.3, G + 0.3, E - 1.2, 0.3, shade(stone, 1.03))
  // between-window pilasters
  for (const x of [-5.6, 5.6]) slabOn(out, '-z', pf, x - 0.3, x + 0.3, G + 0.3, E - 1.2, 0.3, shade(stone, 1.03))
  slabOn(out, '-z', f, WL - 0.1, WR + 0.1, E - 1.4, E - 1.2, 0.3, stone)
  // the cornice on brackets, stepping out round the pavilion
  for (let x = WL + 0.4; x < WR; x += 0.9) slabOn(out, '-z', f, x - 0.14, x + 0.14, E - 1.2, E - 0.2, 0.3, shade(stone, 0.93))
  slabOn(out, '-z', f, WL - 0.4, WR + 0.4, E - 0.2, E + 0.35, 0.7, stone)
  slabOn(out, '-z', pf, -PX - 0.3, PX + 0.3, E - 0.2, E + 0.35, 0.75, stone)

  // ---- the roof: plateau crest, chimneys, the clock gable and the bell lantern
  const top = E + RISE
  for (const x of [-25, -22, -12, 12, 21, 25]) {
    block(out, x - 0.6, x + 0.6, -20.5, -19.3, top - 1.5, top + STACK, shade(p.stone, 0.88))
    block(out, x - 0.75, x + 0.75, -20.65, -19.15, top + STACK, top + STACK + 0.3, p.stone)
  }
  const gz = F + 0.5
  block(out, -GABLE, GABLE, gz, gz + 3.2, E, E + GABLE_Y, stone)
  clockOn(out, '-z', gz, 0, E + 3.4, 1.05, p)
  rectOn(out, '-z', gz, -0.8, 0.8, E + 0.6, E + 1.9, p.glass, 0.06)
  slabOn(out, '-z', gz, -GABLE - 0.25, GABLE + 0.25, E + GABLE_Y, E + GABLE_Y + 0.3, 0.25, stone)
  pedimentOn(out, '-z', gz, -GABLE - 0.25, GABLE + 0.25, E + GABLE_Y + 0.3, 1.3, 0.22, stone)
  for (const s of [-1, 1]) block(out, s * (GABLE + 0.9) - 0.5, s * (GABLE + 0.9) + 0.5, gz, gz + 1.6, E, E + 2.6, stone)
  const lz = -19.5
  block(out, -0.9, 0.9, lz - 0.9, lz + 0.9, top, top + 3.4, stone)
  prism(out, 0, lz, top + 3.4, top + 5.0, 0.5, 8, p.dark, FIXED, 0.5)
  prism(out, 0, lz, top + 5.0, top + 6.6, 1.0, 8, p.slate, FIXED, 0.1)
  prism(out, 0, lz, top + 6.6, top + 8.4, 0.06, 4, p.dark, FIXED, 0.04)
}
