import type { MeshBuilder } from '../../../buildings.ts'
import { block, roof, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, extrude, fitted, palette, pts, rectOn, slabOn, statue } from '../palaces/common.ts'
import { bands, stack } from './civic.ts'
import { railX } from './modern.ts'

const FIXED = 0
/** the design footprint: OSM relation 3403133's box (local −z faces bearing 296, the Boulevard de l'Hôpital) */
const HX = 79.7
const HZ = 67.7

/** OSM's outline and six courts in this frame (osmium, 2026-10-30), its metre jogs on the boulevard's front ironed flat */
const OUTER = pts([79.3, -67.6, 79.7, 67.7, 33.7, 67.7, 33.6, 58.6, 25.6, 60.5, 25.6, 67.7, -42.1, 67.7, -42.3, 54.6, -48.4, 54.7, -48.6, 63.1, -56.3, 63, -56.2, 67.7, -79.4, 67.7, -79.7, -67.6])
const COURTS = [
  pts([68.8, -56.3, 27.4, -56.1, 27.9, -11.9, 69.2, -12.3]),
  pts([17.8, -56.3, 9, -56.2, 9.1, -39, 17.8, -39]),
  pts([-8.5, -56, -17.3, -56, -17.4, -38.9, -8.8, -39]),
  pts([-27.8, -56.2, -69, -56.3, -69.2, -11.9, -27.4, -12.4]),
  pts([17.7, -30.1, -17.5, -29.8, -17.5, -11.9, 17.3, -12]),
  pts([75.3, 1.6, -72.8, 0.8, -72.7, 18.3, -61.7, 18.3, -61.7, 9.7, -50.3, 9.7, -50.2, 18.3, -39.2, 18.3, -39.3, 9.7, 40.4, 11.8, 40.6, 20.5, 74.3, 20.6]),
]

/**
 * L'École nationale supérieure d'Arts et Métiers, the Paris centre (OSM's date is 1912), on the Boulevard de l'Hôpital. It
 * does not read as the stone city round it: a long banded front under a great red-tiled roof, the only one for a long way, and
 * from the boulevard its middle stops a rider:
 *
 * - the central pavilion: a door and a balcony on two tall storeys, and over the eaves a stone half-circle
 *   standing up through the tiles, ÉCOLE NATIONALE D'ARTS ET MÉTIERS cut round its rim, the tympanum carved with two seated
 *   figures, a woman and a workman, clasping hands before a shield;
 * - the banded ground floor, the stone either side in long horizontal stripes, its tall square windows, the chimneys and
 *   little lanterns along the ridge;
 * - and the long sides and courts behind: the same stone and tile on lower workshop ranges.
 *
 * Plan from OSM's relation 3403133. Centre, stripes and roof from the Commons photographs "Facade ENSAM.jpg", "P1000874 Paris
 * XIII Boulevard de l'Hopital ENSAM" and "Ecole National d'Arts et Métiers @ Paris (34885316876)". The two end
 * pavilions are placed from OSM's jogs in the front; the ranges behind are from the plan alone, and their roofs are a guess.
 */
export function ensam(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const tile = '#a4482f'
  const p = palette('#cfc2a0', tile)
  const band = shade(p.stone, 0.8)
  const E = 15.5
  extrude(out, [OUTER, ...COURTS], p, { eaves: E, bay: 4, win: 1.8, rise: 5.5, inset: 4, dormers: false,
    storeys: [{ y: 0, h: 2.8, sill: 1.5 }, { y: 5.2, h: 3.4, sill: 0.8 }, { y: 10.3, h: 3, sill: 0.8 }] })
  // the stripes on the street walls: stone and a darker stone in courses up to the first floor
  const ys: number[] = []
  for (let y = 0.9; y < 5; y += 0.9) ys.push(y)
  bands(out, OUTER, ys, 0.42, 0.05, band, 12)
  bands(out, OUTER, [4.95], 0.3, 0.2, p.trim, 8)
  bands(out, OUTER, [10.05], 0.22, 0.12, p.trim, 8)

  // ---- the middle on the boulevard: a block a little proud, its own high hip, the half-circle up through it
  const f = -68.4
  const x0 = -28
  const x1 = 27.6
  block(out, x0, x1, f, -56, 0, E + 0.3, p.stone)
  for (const y of ys) rectOn(out, '-z', f, x0, x1, y, y + 0.42, band, 0.04)
  slabOn(out, '-z', f, x0 - 0.1, x1 + 0.1, 4.95, 5.3, 0.22, p.trim)
  slabOn(out, '-z', f, x0 - 0.3, x1 + 0.3, E - 0.4, E + 0.3, 0.7, p.trim)
  roof(out, x0 - 0.3, x1 + 0.3, f - 0.3, -52, E + 0.3, 8, 8, 8, p.slate)
  for (const a of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = a * (11 + i * 4.2)
      rectOn(out, '-z', f, x - 1.05, x + 1.05, 1.5, 4.2, p.trim, 0.05)
      rectOn(out, '-z', f, x - 0.85, x + 0.85, 1.7, 4, p.glass, 0.09)
      rectOn(out, '-z', f, x - 1.15, x + 1.15, 6, 9.6, p.trim, 0.05)
      rectOn(out, '-z', f, x - 0.95, x + 0.95, 6.2, 9.4, p.glass, 0.09)
      slabOn(out, '-z', f, x - 1.3, x + 1.3, 9.6, 9.85, 0.16, p.trim)
      rectOn(out, '-z', f, x - 1.15, x + 1.15, 10.7, 13.7, p.trim, 0.05)
      rectOn(out, '-z', f, x - 0.95, x + 0.95, 10.9, 13.5, p.glass, 0.09)
    }
  }
  // the centre: door, balcony, tall window bay between pilasters
  const w = 7.5
  const ff = f - 0.7
  block(out, -w, w, ff, f, 0, E + 0.9, p.stone)
  for (const y of ys) rectOn(out, '-z', ff, -w, w, y, y + 0.42, band, 0.03)
  rectOn(out, '-z', ff, -2.3, 2.3, 0.6, 4.8, p.trim, 0.04)
  archOn(out, '-z', ff, 0, 0.3, 3.1, 4.3, p.dark, 0.08)
  for (const s of [-5.2, 5.2]) {
    rectOn(out, '-z', ff, s - 1, s + 1, 1.5, 4.2, p.trim, 0.04)
    rectOn(out, '-z', ff, s - 0.8, s + 0.8, 1.7, 4, p.glass, 0.08)
  }
  slabOn(out, '-z', ff, -w - 0.2, w + 0.2, 4.95, 5.35, 0.2, p.trim)
  for (const s of [-w + 0.4, -2.7, 2.7, w - 0.4]) slabOn(out, '-z', ff, s - 0.4, s + 0.4, 5.35, E - 0.1, 0.2, p.trim)
  rectOn(out, '-z', ff, -2, 2, 5.9, 10, p.glass, 0.08)
  rectOn(out, '-z', ff, -2, 2, 10.9, 14, p.glass, 0.08)
  for (const s of [-5.15, 5.15]) {
    rectOn(out, '-z', ff, s - 1.4, s + 1.4, 5.9, 10, p.glass, 0.08)
    rectOn(out, '-z', ff, s - 1.4, s + 1.4, 10.9, 14, p.glass, 0.08)
  }
  block(out, -3.6, 3.6, ff - 1.2, ff, 5.4, 5.65, p.trim)
  railX(out, -3.5, 3.5, ff - 1.15, 5.65, 1, 0.3, p.dark)
  slabOn(out, '-z', ff, -w - 0.3, w + 0.3, E - 0.3, E + 0.9, 0.5, p.trim)
  halfCircle(out, 0, ff + 0.1, E + 0.9, 7.2, p.stone, p.trim, shade(p.stone, 0.84))

  // ---- the two end pavilions, at the outline's jogs on the front
  for (const [a, b] of [[-79.7, -69.1], [68.8, 79.5]] as const) {
    block(out, a, b, f + 0.1, f + 9, 0, E + 0.8, p.stone)
    for (const y of ys) rectOn(out, '-z', f + 0.1, a, b, y, y + 0.42, band, 0.03)
    slabOn(out, '-z', f + 0.1, a - 0.2, b + 0.2, E, E + 0.8, 0.5, p.trim)
    const m = (a + b) / 2
    for (const s of [-2.6, 2.6]) {
      for (const [y0, y1] of [[1.5, 4.2], [6, 9.6], [10.7, 13.7]] as const) {
        rectOn(out, '-z', f + 0.1, m + s - 1.15, m + s + 1.15, y0 - 0.2, y1 + 0.2, p.trim, 0.04)
        rectOn(out, '-z', f + 0.1, m + s - 0.95, m + s + 0.95, y0, y1, p.glass, 0.08)
      }
    }
    roof(out, a - 0.3, b + 0.3, f - 0.2, f + 9.3, E + 0.8, 6, 4.5, 4.5, p.slate)
  }

  // ---- the chimneys and the small square lanterns along the ridge
  const brick: Rgb = [0.62, 0.36, 0.27]
  for (const x of [-16, 16, -22, 22]) stack(out, x, -58, E + 3.5, E + 10.5, 0.85, 0.6, p.trim, brick)
  for (const x of [-25, 25]) {
    block(out, x - 1.3, x + 1.3, -60.5, -57.9, E + 5.5, E + 7.6, p.trim)
    roof(out, x - 1.7, x + 1.7, -60.9, -57.5, E + 7.6, 1.1, 1.7, 1.7, shade(p.lead, 0.9))
  }
}

/** The half-circle pediment: a disc of stone in the wall's plane on a moulded rim, the carved group on it, and its thickness. */
function halfCircle(out: MeshBuilder, x: number, z: number, y: number, r: number, stone: Rgb, trim: Rgb, shadow: Rgb): void {
  const n = 14
  const P = (a: number, rr: number, d = 0): [number, number, number] => [x + Math.cos(a) * rr, y + Math.sin(a) * rr, z - d]
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI
    const a1 = ((i + 1) / n) * Math.PI
    // the tympanum, set back; the rim's face, proud of it; the top of the rim going back into the roof
    out.quad([P(0, 0, 0.05), P(a1, r - 1.2, 0.05), P(a0, r - 1.2, 0.05), P(0, 0, 0.05)], [0, 0, -1], UV, shadow, FIXED)
    out.quad([P(a0, r - 1.2, 0.4), P(a0, r, 0.4), P(a1, r, 0.4), P(a1, r - 1.2, 0.4)], [0, 0, -1], UV, trim, FIXED)
    out.quad([P(a1, r, 0.4), P(a0, r, 0.4), P(a0, r, -3), P(a1, r, -3)], [Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2), 0], UV, stone, FIXED)
    out.quad([P(a1, r - 1.2, 0.4), P(a0, r - 1.2, 0.4), P(a0, r - 1.2, 0.05), P(a1, r - 1.2, 0.05)], [0, 0, -1], UV, shade(shadow, 0.8), FIXED)
  }
  // the shield over the clasped hands, the two seated figures either side
  block(out, x - 1.1, x + 1.1, z - 0.35, z - 0.05, y + 1.5, y + 4.2, trim)
  block(out, x - 0.5, x + 0.5, z - 0.32, z - 0.05, y + 0.4, y + 1.5, trim)
  for (const s of [-1, 1]) {
    statue(out, x + s * 2.7, z - 0.32, y + 0.05, 2.3, trim)
    block(out, x + s * 3.5 - 0.9, x + s * 3.5 + 0.9, z - 0.35, z - 0.05, y, y + 0.9, trim)
  }
}
