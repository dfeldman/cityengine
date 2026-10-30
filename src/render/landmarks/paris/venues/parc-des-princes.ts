/**
 * The PARC DES PRINCES (Roger Taillibert, 1972), PSG's ground at the Porte de Saint-Cloud, the Périphérique running
 * underneath it. OSM: `relation/152838` (building=stadium, height 48, an outer ring and the pitch's void), inside the
 * `leisure=stadium` way/53559935; the pitch is way/88005247.
 *
 * What a rider sees from the boulevard: FIFTY curved concrete PORTIQUES round an ellipse — each a post outside the
 * stands that bends over at the top into a cantilever arm reaching in over the seats, the arms carrying the ring of
 * roof. The posts are of different heights (the longer the arm, the taller the post), so the crest undulates round
 * the bowl. Between them the backs of the stands in grey concrete, the concourse glazed at the foot. From above: the
 * fins running radially over a pale roof ring, the roof's inner edge with its floodlights, two tiers of seats, the
 * striped pitch.
 *
 * Measured from OSM (vtools superfit, the pitch's axis at bearing 35°): the outer ring an ellipse 238 × 177 m; the
 * void at the stands' front a rounded rectangle 165 × 112 (Wikipedia fr: the Auteuil and Boulogne stands 164 m
 * apart, the pitch 105 × 68, no seat more than 45 m from a touchline). Structure (Inventaire Île-de-France via the
 * fr search, structurae): 50 prestressed portiques, each a column and a cantilever "fléau" carrying the roof's
 * edge band; lighting built into the roof, a first in Europe. Seats blue, with the 2016 red and white bands.
 *
 * Local frame: x along the pitch, z across; built from the fit's half-sizes (the manifest's `front` lays the pitch
 * along x), clamped so a test's small footprint still builds.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, EMIT, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { band, evenly, fin, footballPitch, groundMid, supAt, supR, type Sup, type V3 } from './bowl.ts'

const CONC: Rgb = [0.74, 0.73, 0.7]
const CONC_DK: Rgb = [0.55, 0.55, 0.53]
const GLASS: Rgb = [0.16, 0.19, 0.22]
const ROOF: Rgb = [0.7, 0.71, 0.72]
const SOFFIT: Rgb = [0.5, 0.51, 0.52]
const BLUE: Rgb = [0.1, 0.18, 0.42]
const BLUE2: Rgb = [0.13, 0.22, 0.5]
const RED: Rgb = [0.62, 0.1, 0.12]
const WHITE: Rgb = [0.88, 0.88, 0.88]

export function parcDesPrinces(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  // the outer ellipse, and everything else in proportion to the real one (119 × 88)
  const A = Math.min(Math.max(fit.hx, 60), 125)
  const B = Math.min(Math.max(fit.hz, 45), 95)
  const kx = A / 119
  const kz = B / 88
  const S = (a: number, b: number, n: number): Sup => ({ a: a * kx, b: b * kz, n })
  const outer = S(119, 88, 2.1)
  const voidS = S(82.5, 56, 3)
  const g = groundMid(fit)

  // ---- the pitch and its run-off, a little over the ground so the city's own pitch polygon stays under it
  footballPitch(out, g + 0.6, 105 * Math.min(kx, 1), 68 * Math.min(kz, 1), voidS)

  // ---- the stands: a lower tier from the pitch wall, the boxes' level, the upper tier to the back wall
  const low0 = S(82.5, 56, 3)
  const low1 = S(100, 72, 2.6)
  const up0 = S(101.5, 73.5, 2.5)
  const up1 = S(113, 83, 2.2)
  const yL0 = g + 1.8
  const yL1 = g + 12
  const yU0 = g + 15
  const yU1 = g + 29
  // the pitch wall, in front of the first row
  band(out, S(82.3, 55.8, 3), g + 0.5, S(82.3, 55.8, 3), yL0, 'in', () => CONC_DK, { segs: 96, tag: conc })
  // the 2016 seats: blue, red rows at the front of each tier, the Paris stand (−z) in red and white bands
  const seat = (tier: number, row: number) => (_i: number, th: number): Rgb => {
    const paris = Math.sin(th) < -0.55
    if (paris && tier === 1) return row % 2 ? RED : WHITE
    if (row === 0) return RED
    return row % 2 ? BLUE : BLUE2
  }
  const rows = 6
  const lerpS = (s0: Sup, s1: Sup, f: number): Sup => ({ a: s0.a + (s1.a - s0.a) * f, b: s0.b + (s1.b - s0.b) * f, n: s0.n + (s1.n - s0.n) * f })
  for (let r = 0; r < rows; r++) {
    band(out, lerpS(low0, low1, r / rows), yL0 + ((yL1 - yL0) * r) / rows, lerpS(low0, low1, (r + 1) / rows), yL0 + ((yL1 - yL0) * (r + 1)) / rows, 'in', seat(0, r), { segs: 96 })
    band(out, lerpS(up0, up1, r / rows), yU0 + ((yU1 - yU0) * r) / rows, lerpS(up0, up1, (r + 1) / rows), yU0 + ((yU1 - yU0) * (r + 1)) / rows, 'in', seat(1, r), { segs: 96 })
  }
  // the boxes' level between the tiers: a riser under the upper tier's front, glazed, and its walkway
  band(out, low1, yL1, up0, yL1, 'up', () => CONC, { segs: 96, tag: conc })
  band(out, up0, yL1, up0, yU0, 'in', () => GLASS, { segs: 96 })
  // the back wall of the upper tier, seen between the portiques from outside: stacked concrete bands, the shadowed
  // slots between them where the stands' rows of vomitories open
  band(out, up1, g, up1, yU1 + 1.2, 'out', () => CONC_DK, { segs: 100, tag: conc })
  for (const [y0, y1] of [[9, 10.6], [17, 18.6], [24.5, 26]]) band(out, S(113.1, 83.1, 2.2), g + y0, S(113.1, 83.1, 2.2), g + y1, 'out', () => GLASS, { segs: 100 })
  band(out, up1, yU1 + 1.2, S(112, 82, 2.2), yU1 + 1.2, 'up', () => CONC, { segs: 100, tag: conc })
  // the concourse at the foot: dark glass under a concrete lintel, a little outside the back wall
  band(out, S(115, 85, 2.15), g - 0.5, S(115, 85, 2.15), g + 5, 'out', () => GLASS, { segs: 100 })
  band(out, S(115.2, 85.2, 2.15), g + 5, S(115.2, 85.2, 2.15), g + 6.2, 'out', () => CONC, { segs: 100, tag: conc })
  band(out, S(113, 83, 2.2), g + 6.2, S(115.2, 85.2, 2.15), g + 6.2, 'up', () => CONC, { segs: 100, tag: conc })

  // ---- the portiques and the roof they carry
  const roofIn = S(84.5, 58, 3)
  const yr = g + 33                       // the roof's inner edge
  // the crest of each portique: the longer its arm, the taller it stands — 40 m to 48 m round the bowl
  const arm = (th: number): number => supR(outer, th) - supR(roofIn, th)
  const armMin = 26 * Math.min(kx, kz)
  const armMax = 37 * Math.max(kx, kz)
  const crest = (th: number): number => g + 37 + 11 * Math.min(1, Math.max(0, (arm(th) - armMin) / Math.max(1, armMax - armMin)))
  const ths = evenly(outer, 50, 0.5)
  for (const th of ths) {
    const R = supR(outer, th)
    const Ri = supR(roofIn, th)
    const L = R - Ri
    const yc = crest(th)
    const ym = (yc + yr) / 2
    // (r, y) sections: the post rising and leaning out a little, the knee, the arm reaching in over the seats
    const sec: [[number, number], [number, number]][] = [
      [[R - 4.2, g - 0.5], [R - 1.4, g - 0.5]],
      [[R - 4.6, g + 0.3 * (yc - g)], [R - 0.7, g + 0.3 * (yc - g)]],
      [[R - 5.4, g + 0.6 * (yc - g)], [R - 0.2, g + 0.62 * (yc - g)]],
      [[R - 6.2, g + 0.8 * (yc - g)], [R, g + 0.85 * (yc - g)]],
      [[R - 6.8, yc - 4.2], [R - 1.2, yc]],
      [[R - 0.28 * L, yc - 4], [R - 0.28 * L, yc - 0.7]],
      [[R - 0.62 * L, ym - 2.1], [R - 0.62 * L, ym + 0.1]],
      [[Ri - 0.4, yr - 1.3], [Ri - 0.4, yr + 0.4]],
    ]
    fin(out, sec, Math.cos(th), Math.sin(th), 1.3, CONC, conc)
  }
  // the roof ring: from under the knees to the inner edge, its top pale and its underside grey, the fascia at the
  // inner edge with the floodlights along it
  const roofOut = S(115, 84.6, 2.15)
  const yRoofOut = (th: number): number => crest(th) - 3.6
  band(out, roofOut, yRoofOut, roofIn, yr - 1.2, 'in', () => ROOF, { segs: 150 })
  band(out, roofOut, (th) => yRoofOut(th) - 0.5, roofIn, yr - 1.7, 'down', () => SOFFIT, { segs: 150 })
  band(out, S(84.4, 57.9, 3), yr - 2.6, S(84.4, 57.9, 3), yr - 1.0, 'in', () => CONC, { segs: 150, tag: conc })
  band(out, S(84.4, 57.9, 3), yr - 2.6, S(85.4, 58.9, 3), yr - 2.6, 'down', () => CONC_DK, { segs: 150, tag: conc })
  // the roof's outer edge, closing the gap over the stands' back wall
  band(out, S(113.4, 83.4, 2.2), yU1 + 1.2, roofOut, (th) => yRoofOut(th) - 0.5, 'out', () => CONC_DK, { segs: 100, tag: conc })
  // the lights, a row of lamps under the fascia
  for (let i = 0; i < 120; i++) {
    const th = (i / 120) * Math.PI * 2
    const p: V3 = supAt(S(85, 58.5, 3), th, yr - 2.75)
    box(out, p[0], p[1], p[2], 0.5, 0.12, 0.5, [1, 0.97, 0.86], EMIT)
  }
}
