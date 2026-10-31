import type { MeshBuilder } from '../../../buildings.ts'
import { block, classicalColumn, prism, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, extrude, fitted, palette, pedimentOn, pts, rectOn, slabOn, statue } from '../palaces/common.ts'

const FIXED = 0
/** the design footprint: OSM way 68804399's box turned to its walls (local −z faces bearing 176.5, the Boulevard Haussmann) */
const HX = 27.45
const HZ = 30.4

/** OSM's outline in this frame (osmium, 2026-10-30): the straight side to the boulevard, a court cut out of the +z side */
const OUTER = pts([-27.2, 12.4, -27.4, -30.3, 27.4, -30.4, 27.4, 30.4, 18.6, 26, 23.6, 16.8, 24, 2.9, 19.3, 3.2, 19.5, 6.6, 4.2, 7.2, -19.5, 6.6, -19.4, 3.4, -24.5, 3, -24.7, 12.3])

/**
 * Le Musée Jacquemart-André (Henri Parent, 1869–75), the private palace Édouard André built on Haussmann's new boulevard and
 * filled with Italian pictures, set back from the boulevard on its raised bank. What a rider sees, going by at the level
 * of the road (local −z):
 *
 * - the long pale front at the top of the bank, two tall storeys of Corinthian pilasters, its rounded middle
 *   standing out between two end pavilions, statues on the skyline, a balustrade with its urns along the rest;
 * - a low roof behind, hardly seen.
 *
 * fr.wikipedia (Batch 4, 2026-10-31) settles which side is which: the portico and its lions are on the cour d'honneur, the
 * hemicycle in OSM's north notch; to the boulevard, a high terrace on a rusticated base with two carriage gates, and the rounded
 * front drawn here. The dressing is from memory, and the terrace, its gates and the garden are still not modelled.
 */
export function jacquemartAndre(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#ddd3bc', '#5a6268')
  const E = 14.5
  extrude(out, [OUTER], p, { eaves: E, bay: 4, win: 1.7, rise: 2, inset: 1.4, dormers: false,
    storeys: [{ y: 0, h: 3.9, sill: 1 }, { y: 7, h: 3.9, sill: 1 }] })
  // ---- the boulevard front, plated on the −z edge
  const f = -30.7
  const a = -27.4
  const b = 27.4
  block(out, a, b, f, f + 2, 0, E + 0.3, p.stone)
  for (let y = 0.65; y < 1.25; y += 0.3) rectOn(out, '-z', f, a, b, y - 0.03, y + 0.03, p.deep, 0.03)
  slabOn(out, '-z', f, a - 0.1, b + 0.1, 6.5, 7, 0.22, p.trim)
  const n = 13
  const bay = (b - a) / n
  for (let i = 0; i < n; i++) {
    const t = a + (i + 0.5) * bay
    const mid = i >= 4 && i <= 8
    // the French windows, arched below; pedimented above
    rectOn(out, '-z', f, t - 1.2, t + 1.2, 1.05, 5.4, p.trim, 0.04)
    archOn(out, '-z', f, t, 1.2, 1.9, 4.4, p.glass, 0.08)
    rectOn(out, '-z', f, t - 1.15, t + 1.15, 7.8, 11.8, p.trim, 0.04)
    rectOn(out, '-z', f, t - 0.9, t + 0.9, 8, 11.6, p.glass, 0.08)
    if (!mid) pedimentOn(out, '-z', f, t - 1.35, t + 1.35, 11.9, 0.6, 0.25, p.trim)
  }
  for (let i = 0; i <= n; i++) {
    const t = a + i * bay
    slabOn(out, '-z', f, t - 0.3, t + 0.3, 7, E - 1.2, 0.16, p.trim)
    slabOn(out, '-z', f, t - 0.42, t + 0.42, E - 1.8, E - 1.2, 0.22, shade(p.trim, 1.03))
    slabOn(out, '-z', f, t - 0.3, t + 0.3, 1.2, 6.5, 0.14, p.stone)
  }
  slabOn(out, '-z', f, a - 0.2, b + 0.2, E - 1.2, E - 0.5, 0.25, p.trim)
  slabOn(out, '-z', f, a - 0.5, b + 0.5, E - 0.5, E + 0.3, 0.55, p.trim)
  balustrade(out, a, b, f, f + 1.4, E + 0.3, p, { sides: ['-z'], h: 1.1 })
  for (let i = 0; i <= n; i += 2) statue(out, a + i * bay, f + 0.1, E + 1.4, 1.1, p.trim)
  // ---- the middle (Batch 4, 2026-10-31; fr.wikipedia: to the boulevard "un avant-corps central arrondi", after the Petit Trianon, between two pavilions; the portico with its four columns and lions is the court's, behind):
  // a drum standing out of the front, its columns round it over the arched ground storey, the balustrade carried round. It was a pedimented front, which is the court side's
  const R = 8.6
  const cz = f + 3.6
  prism(out, 0, cz, 0, E - 1.2, R, 22, p.stone)
  prism(out, 0, cz, 6.5, 7, R + 0.2, 22, p.trim)
  prism(out, 0, cz, E - 1.2, E + 0.3, R + 0.45, 22, p.trim)
  const round = (th: number, r: number): [number, number] => [Math.sin(th) * r, cz - Math.cos(th) * r]
  for (let i = -3; i <= 3; i++) {
    const [x, z] = round(i * 0.31, R)
    block(out, x - 0.75, x + 0.75, z - 0.14, z + 0.14, 1, 5.6, p.glass)
    block(out, x - 0.7, x + 0.7, z - 0.14, z + 0.14, 7.6, E - 2.4, p.glass)
  }
  for (let i = -4; i <= 4; i++) {
    const [x, z] = round((i - 0.5 * Math.sign(i || 1)) * 0.31 + (i === 0 ? 0.155 : 0), R + 0.5)
    classicalColumn(out, x, z, 7, E - 1.4, 0.38, p.stone, { order: 'corinthian', tier: 'mid', tag: FIXED, trim: p.trim })
  }
  for (let i = -3; i <= 3; i += 2) { const [x, z] = round(i * 0.31, R); statue(out, x, z, E + 0.3, 1.3, p.trim) }
  // the pavilions at either end, a step forward, pediments of their own
  for (const s of [-1, 1]) {
    const x0 = s * (b - bay), x1 = s * b, lo = Math.min(x0, x1), hi = Math.max(x0, x1)
    block(out, lo, hi, f - 0.9, f, 0, E + 0.3, p.stone)
    slabOn(out, '-z', f - 0.9, lo - 0.1, hi + 0.1, 6.5, 7, 0.22, p.trim)
    rectOn(out, '-z', f - 0.9, (x0 + x1) / 2 - 1.1, (x0 + x1) / 2 + 1.1, 7.8, 11.8, p.trim, 0.04)
    rectOn(out, '-z', f - 0.9, (x0 + x1) / 2 - 0.85, (x0 + x1) / 2 + 0.85, 8, 11.6, p.glass, 0.08)
    archOn(out, '-z', f - 0.9, (x0 + x1) / 2, 1.2, 1.9, 4.4, p.glass, 0.08)
    pedimentOn(out, '-z', f - 0.9, lo - 0.2, hi + 0.2, E + 0.3, 1.1, 0.5, p.trim)
  }
}
