import type { MeshBuilder } from '../../../buildings.ts'
import { block, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, clockOn, extrude, fitted, hipRoof, palette, pedimentOn, pts, rectOn, slabOn } from '../palaces/common.ts'
import { archesRound, bands, rustic } from './civic.ts'

/** the design footprint: OSM relation 2449758's box turned to its walls (local −z faces bearing 205.5, the Parvis) */
const HX = 68.2
const HZ = 85.3

/** OSM's outline in this frame (osmium, 2026-10-30), the walls' jogs ironed flat; its ward pavilions stick out either side with open courts between */
const OUTER = pts([-54.6, -84.5, 67.2, -84.8, 67.4, -35.7, 31.0, -36.4, 29.5, 1.4, 67.6, 2.0, 67.7, 12.7, 29.1, 12.2, 28.8, 20.2, 62.4, 19.6, 64.3, 42.9, 41.6, 42.4, 41.5, 48.3,
  67.9, 50.4, 68.2, 84.6, -26.6, 84.4, -68.2, 82.0, -65.4, 47.9, -25.4, 48.7, -25.1, 41.6, -64.9, 42.2, -63.1, 19.0, -24.3, 20.3, -24.0, 11.9, -62.5, 13.3, -61.7, 2.7, -31.2, 1.5,
  -31.2, -2.1, -49.4, 0.1, -47.9, -30.9, -27.1, -31.3, -27.0, -35.6, -58.7, -34.3])
/** the light courts behind the fronts, and the long garden on the axis (OSM draws it as a part of one level; it is the garden, under its galleries) */
const COURTS = [
  pts([-48.9, -74.4, -50.3, -45.7, -21.7, -46.3, -20.7, -74.8]),
  pts([-6.6, -71.1, -7.4, -47.5, 17.3, -47.6, 18.0, -71.2]),
  pts([32.5, -74.6, 31.6, -46.4, 61.2, -46.4, 60.7, -74.7]),
  pts([-61.3, 58.7, -62.4, 72.1, -42.1, 72.5, -41.6, 59.1]),
  pts([27.4, 60.4, 26.9, 73.7, 63.2, 74.4, 63.1, 61.0]),
  pts([-5.2, -37.8, -3.6, 41.8, 14.6, 41.4, 13.4, -37.4]),
]

/**
 * L'Hôtel-Dieu (Émile Gilbert and Arthur Diet, 1866–78), the oldest hospital in Paris on its third site, filling the
 * north side of the Parvis de Notre-Dame from the Rue de la Cité to the Rue d'Arcole. Haussmann's hospital: pale stone,
 * round arches, steep slate, a plan of parallel ward pavilions off a long garden, every ward with air on both sides.
 * Nothing about it is Parisian cream flats, and it is the first thing behind the rider's shoulder looking at the cathedral:
 *
 * - from the PARVIS (local −z): the long front, a corner pavilion at each end with its own hipped roof, and in the middle
 *   the entrance pavilion, three tall arches, the name band, a pediment with the clock;
 * - along the RUE DE LA CITÉ (−x) and the RUE D'ARCOLE (+x): the
 *   ends of the ward pavilions, gabled and arched, and between them the low arcaded wall across each open court;
 * - from the QUAI DE LA CORSE (+z) and the Pont d'Arcole: the same long range and its roofs over the Seine.
 *
 * The plan is OSM's relation 2449758 with its courts. OSM's parts say 9–15 m, which reads low against the Parvis; I could
 * not get a photograph of the front (Mapillary's frames there are of a works site), so the 16 m cornice, the arches and the
 * central pavilion are from memory of the building.
 */
export function hotelDieu(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d9d3c2', '#4a5157')
  const E = 16
  extrude(out, [OUTER, ...COURTS], p, { eaves: E, bay: 4.6, win: 1.9, rise: 4.4, inset: 1.5, dormers: false,
    storeys: [{ y: 6.2, h: 4.2, sill: 1 }, { y: 11.6, h: 2.3, sill: 0.9 }] })
  // the ground storey's round arches in a rusticated base, and the string courses over it: all the street walls
  rustic(out, OUTER, 0.2, 5.9, 0.75, p.deep, 6)
  bands(out, OUTER, [5.9], 0.36, 0.2, p.trim, 6)
  bands(out, OUTER, [11.4], 0.2, 0.12, p.trim, 6)
  archesRound(out, OUTER, 1, 4.4, 2.3, 4.6, p.glass, 0.1, 8)
  // the low arcaded wall across each open court, on the street
  for (const [x, z0, z1] of [[67.4, -35.7, 2], [66, 12.7, 19.6], [-63, -2, 2.7], [-60.5, -34.3, -2.1]] as const) screen(out, p, x, z0, z1)

  // ---- the Parvis front: two corner pavilions and the entrance pavilion between them
  const f = -84.8
  for (const [a, b] of [[-55.2, -31.5], [44, 67.8]] as const) {
    const pf = f - 0.8
    block(out, a, b, pf, f + 11, 0, E + 1.2, p.stone)
    for (let y = 0.95; y < 5.9; y += 0.75) rectOn(out, '-z', pf, a, b, y - 0.05, y + 0.04, p.deep, 0.03)
    slabOn(out, '-z', pf, a - 0.1, b + 0.1, 5.9, 6.3, 0.2, p.trim)
    slabOn(out, '-z', pf, a - 0.4, b + 0.4, E + 0.3, E + 1.2, 0.45, p.trim)
    const m = (a + b) / 2
    for (const dx of [-7.2, 0, 7.2]) {
      archOn(out, '-z', pf, m + dx, 1, 2.6, 4.5, p.glass, 0.08)
      rectOn(out, '-z', pf, m + dx - 1.25, m + dx + 1.25, 7, 11.6, p.trim, 0.05)
      archOn(out, '-z', pf, m + dx, 7.2, 2.1, 4.2, p.glass, 0.08)
      rectOn(out, '-z', pf, m + dx - 1.05, m + dx + 1.05, 12.7, 15.2, p.glass, 0.08)
    }
    for (const x of [a + 0.55, b - 0.55]) {
      for (let y = 6.6; y < E; y += 1.05) rectOn(out, '-z', pf, x - 0.6, x + 0.6, y, y + 0.68, p.trim, 0.09)
    }
    hipRoof(out, a, b, pf, f + 11, E + 1.2, 6, p.slate, 0.25)
  }
  // the entrance pavilion, on the axis at x 6.3: three great arches, the name band, the pediment and its clock
  const cx = 6.3
  const hw = 15.4
  const pf = f - 1.6
  block(out, cx - hw, cx + hw, pf, f + 13, 0, E + 3, p.stone)
  for (let y = 0.95; y < 9.4; y += 0.75) rectOn(out, '-z', pf, cx - hw, cx + hw, y - 0.05, y + 0.04, p.deep, 0.03)
  for (let i = 0; i < 3; i++) block(out, cx - 10.5 + i * 0.3, cx + 10.5 - i * 0.3, pf - 1.6 + i * 0.5, pf, 0, 0.22 * (i + 1), shade(p.stone, 0.88 + (i % 2) * 0.05))
  for (const dx of [-6.2, 0, 6.2]) {
    rectOn(out, '-z', pf, cx + dx - 2.7, cx + dx + 2.7, 0.7, 9.3, shade(p.stone, 0.88), 0.03)
    archOn(out, '-z', pf, cx + dx, 0.7, 4.4, 8.2, p.dark, 0.06)
    // the first floor's arched windows over the arches, and the small ones in the corners
    rectOn(out, '-z', pf, cx + dx - 1.5, cx + dx + 1.5, 10.8, 14.7, p.trim, 0.05)
    archOn(out, '-z', pf, cx + dx, 11, 2.4, 3.5, p.glass, 0.08)
  }
  for (const x of [cx - hw + 2.6, cx + hw - 2.6]) {
    archOn(out, '-z', pf, x, 1.2, 1.9, 4.5, p.glass, 0.08)
    archOn(out, '-z', pf, x, 11, 1.9, 3.5, p.glass, 0.08)
  }
  slabOn(out, '-z', pf, cx - hw - 0.1, cx + hw + 0.1, 9.4, 10.1, 0.3, p.trim)
  rectOn(out, '-z', pf, cx - 10, cx + 10, 9.5, 10, shade(p.trim, 0.72), 0.31)       // the name band
  for (const x of [cx - hw + 0.6, cx + hw - 0.6, cx - 9.2, cx + 9.2]) block(out, x - 0.5, x + 0.5, pf - 0.3, pf, 10.1, E + 1.6, p.trim)
  slabOn(out, '-z', pf, cx - hw - 0.5, cx + hw + 0.5, E + 1.8, E + 3, 0.6, p.trim)
  pedimentOn(out, '-z', pf, cx - 10, cx + 10, E + 3, 3.1, 0.6, p.stone)
  clockOn(out, '-z', pf - 0.55, cx, E + 4.1, 0.85, p)
  hipRoof(out, cx - hw, cx + hw, pf + 0.2, f + 13, E + 3, 7, p.slate, 0.1)
}

/** The low arcaded wall across an open court, on a street plane at x. */
function screen(out: MeshBuilder, p: ReturnType<typeof palette>, x: number, z0: number, z1: number): void {
  const f = x > 0 ? '+x' : '-x'
  block(out, x - 0.45, x + 0.45, z0, z1, 0, 5.2, p.stone)
  block(out, x - 0.65, x + 0.65, z0, z1, 5, 5.6, p.trim)
  const n = Math.max(1, Math.round((z1 - z0) / 4.2))
  for (let i = 0; i < n; i++) {
    const z = z0 + ((i + 0.5) * (z1 - z0)) / n
    archOn(out, f, x + (x > 0 ? 0.45 : -0.45), z, 0.7, 2.4, 3.8, shade(p.stone, 0.62), 0.05)
  }
}
