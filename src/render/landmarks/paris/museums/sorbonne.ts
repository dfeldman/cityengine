import type { MeshBuilder } from '../../../buildings.ts'
import { block, dome, pane, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, dormers, extrude, fitted, palette, pedimentOn, pts, rectOn, slabOn, statue } from '../palaces/common.ts'
import { bands, rustic } from './civic.ts'

const FIXED = 0
/** the design footprint: OSM relation 572440's box turned 19.5° to its walls (local −z faces bearing 19.5, the Rue des Écoles) */
const HX = 43.5
const HZ = 125.6

/** OSM's outline and its courts in this frame (osmium, 2026-10-30), the walls' little jogs ironed flat; the notch at x 4…42, z 20…48 is the chapel's own and the Cour d'honneur (x 4…32, z −52…+19, OSM's wall between them only 1.7 m and the portico) opens into it */
const OUTER = pts([43.5, 110.6, -39.9, 125.6, -43.4, 123.6, -43.0, -121.1, -26.0, -122.8, 22.8, -124.6, 40.1, -125.0, 42.2, 19.5, 32.5, 19.5, 31.7, -52.1, 4.0, -51.5, 4.4, 19.9,
  -4.7, 21.2, -10.8, 33.2, -5.2, 40.5, -4.8, 46.4, 41.3, 47.6])
const COURTS = [
  pts([32.8, 101.2, 31.7, 74.9, 20.7, 75.6, 20.5, 103.7]),
  pts([31.5, 63.9, 31.4, 50.4, 20.7, 50.4, 20.7, 64.0]),
  pts([10.7, 96.7, 10.2, 76.1, -9.6, 76.2, -9.7, 96.4]),
  pts([-21.0, 110.7, -21.2, 75.9, -32.9, 75.9, -33.1, 110.9]),
  pts([29.5, -72.7, 29.1, -101.9, 20.9, -101.5, 22.6, -72.5]),
  pts([-21.7, 63.5, -21.4, 49.6, -32.7, 49.6, -32.8, 64.4]),
  pts([-22.0, -65.9, -22.2, -99.3, -31.5, -98.9, -31.3, -65.8]),
]

/**
 * La Sorbonne (Henri-Paul Nénot, 1885–1901): the university's long block between the Rue des Écoles and the Rue Cujas,
 * the Rue Saint-Jacques up one side and the Rue de la Sorbonne up the other, Richelieu's chapel let into the west side
 * (its own entry). Warm Paris limestone, its streets narrow, so a rider sees it from close and low:
 *
 * - from the RUE DES ÉCOLES (local −z, downhill): the main front. A rusticated basement with small arched windows, tall
 *   storeys over it under a heavy cornice, and in the middle the frontispiece, Ionic pilasters three storeys high on its
 *   arched doors with the statues along its attic (Science and Letters), end pavilions quoined either side;
 * - along the RUE SAINT-JACQUES (−x, climbing to the Panthéon) and the RUE DE LA SORBONNE (+x): 245 m of the same wall,
 *   the long unbroken side from the photograph, and over the Rue Saint-Jacques near its top the square observatory tower
 *   with its two small round domes, which is what shows above the roofs from the Rue Soufflot;
 * - everywhere the slate mansard, its dormers, the rows of chimneys.
 *
 * The plan is OSM's relation 572440 with its courts. OSM has no heights (4 levels); from the photograph, basement 0–3.6,
 * first storey to 9.4, second to 15.6, a low third to the cornice at 20. The front's frontispiece and the tower from
 * memory of the building and the Rue Saint-Jacques photograph.
 */
export function sorbonne(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d2c3a2', '#51585d')
  const eaves = 20
  extrude(out, [OUTER, ...COURTS], p, { eaves, bay: 4.1, win: 1.8, rise: 3.6, inset: 1.8, dormers: true,
    storeys: [{ y: 0, h: 1.2, sill: 1.5 }, { y: 3.6, h: 3.6, sill: 1.1 }, { y: 9.4, h: 3.9, sill: 1 }, { y: 15.6, h: 1.9, sill: 0.8 }] })
  // the basement's rusticated courses and plinth, the string courses over the storeys: the street walls only
  rustic(out, OUTER, 0.2, 3.5, 0.6, p.deep, 8)
  bands(out, OUTER, [0], 0.55, 0.14, shade(p.stone, 0.82), 8)
  bands(out, OUTER, [3.45], 0.34, 0.2, p.trim, 8)
  bands(out, OUTER, [9.2], 0.3, 0.16, p.trim, 8)
  bands(out, OUTER, [15.4], 0.24, 0.12, p.trim, 8)

  // ---- the front on the Rue des Écoles: the frontispiece and its two end pavilions
  const f = -124.6
  // the end pavilions, a step proud, quoined and pedimented over the second storey
  for (const [a, b] of [[-43, -27], [25, 40.5]] as const) {
    block(out, a, b, f - 1.0, f + 1, 0, eaves + 1.2, p.stone)
    for (let y = 0.6; y < 3.6; y += 0.6) rectOn(out, '-z', f - 1, a, b, y - 0.05, y + 0.04, p.deep, 0.03)
    slabOn(out, '-z', f - 1, a - 0.15, b + 0.15, 3.45, 3.8, 0.2, p.trim)
    slabOn(out, '-z', f - 1, a - 0.15, b + 0.15, 9.2, 9.5, 0.16, p.trim)
    slabOn(out, '-z', f - 1, a - 0.4, b + 0.4, eaves + 0.3, eaves + 1.2, 0.45, p.trim)
    for (const x of [a + 0.5, b - 0.5]) {
      for (let y = 4.1; y < eaves; y += 1.1) rectOn(out, '-z', f - 1, x - 0.65, x + 0.65, y, y + 0.72, p.trim, 0.09)
    }
    const m = (a + b) / 2
    for (const dx of [-5, 0, 5]) {
      archOn(out, '-z', f - 1, m + dx, 1.3, 1.5, 1.8, p.glass, 0.08)
      rectOn(out, '-z', f - 1, m + dx - 1.1, m + dx + 1.1, 4.5, 8.7, p.trim, 0.05)
      rectOn(out, '-z', f - 1, m + dx - 0.9, m + dx + 0.9, 4.7, 8.5, p.glass, 0.08)
      rectOn(out, '-z', f - 1, m + dx - 1.1, m + dx + 1.1, 10.4, 14.3, p.trim, 0.05)
      rectOn(out, '-z', f - 1, m + dx - 0.9, m + dx + 0.9, 10.6, 14.1, p.glass, 0.08)
      pedimentOn(out, '-z', f - 1, m + dx - 1.4, m + dx + 1.4, 14.5, 0.75, 0.32, p.trim)
      rectOn(out, '-z', f - 1, m + dx - 0.8, m + dx + 0.8, 16.5, 18.5, p.glass, 0.08)
    }
    // its own steep roof, higher than the range's
    pavilion(out, a, b, f - 1, f + 11, eaves + 1.2, p.slate, p.lead)
  }
  // the frontispiece: 26 m, proud of the wall, its four arched doors on the steps
  const a = -13
  const b = 13
  const pf = f - 2.2
  block(out, a, b, pf, f + 2, 0, eaves + 3.2, p.stone)
  for (let y = 0.6; y < 3.8; y += 0.6) rectOn(out, '-z', pf, a, b, y - 0.05, y + 0.04, p.deep, 0.03)
  for (let i = 0; i < 4; i++) block(out, a - 2 + i * 0.3, b + 2 - i * 0.3, pf - 3 + i * 0.7, pf, 0, 0.28 * (i + 1), shade(p.stone, 0.88 + (i % 2) * 0.05))
  for (const x of [-9, -3, 3, 9]) {
    rectOn(out, '-z', pf, x - 2.2, x + 2.2, 1.2, 7.8, shade(p.stone, 0.88), 0.03)
    archOn(out, '-z', pf, x, 1.15, 3.2, 6.1, p.dark, 0.06)
  }
  // Ionic pilasters over the doors, from the storey band to the cornice, the tall windows and panels between them
  slabOn(out, '-z', pf, a - 0.2, b + 0.2, 8.1, 9.3, 0.3, p.trim)
  const cols = [-12.2, -6, 0, 6, 12.2]
  for (const x of cols) {
    block(out, x - 0.55, x + 0.55, pf - 0.35, pf, 9.3, eaves - 1, p.trim)
    block(out, x - 0.8, x + 0.8, pf - 0.55, pf, eaves - 1.6, eaves - 1, shade(p.trim, 1.03))
    block(out, x - 0.75, x + 0.75, pf - 0.5, pf, 9.3, 9.8, shade(p.trim, 0.96))
  }
  for (const x of [-9.1, -3, 3, 9.1]) {
    rectOn(out, '-z', pf, x - 1.5, x + 1.5, 10.3, 14.6, p.trim, 0.05)
    archOn(out, '-z', pf, x, 10.5, 2.4, 4, p.glass, 0.08)
    rectOn(out, '-z', pf, x - 1.15, x + 1.15, 15.7, 17.9, p.glass, 0.08)
  }
  slabOn(out, '-z', pf, a - 0.5, b + 0.5, eaves - 1, eaves, 0.7, p.trim)
  block(out, a + 0.3, b - 0.3, pf + 0.1, f + 2, eaves, eaves + 3.2, shade(p.stone, 0.98))          // the attic
  for (const x of cols) statue(out, x, pf - 0.05, eaves, 2.7, shade(p.trim, 1.02))
  balustrade(out, -26, -14, f, f + 1, eaves, p, { sides: ['-z'], h: 0.95 })
  balustrade(out, 14, 25, f, f + 1, eaves, p, { sides: ['-z'], h: 0.95 })
  pavilion(out, a + 0.3, b - 0.3, f - 1, f + 12, eaves + 3.2, p.slate, p.lead)
  dormers(out, '-z', f + 2, -26, -14, eaves + 0.2, 4.1, p, { round: true, set: 0.4 })
  dormers(out, '-z', f + 2, 14, 25, eaves + 0.2, 4.1, p, { round: true, set: 0.4 })

  // ---- the observatory tower over the Rue Saint-Jacques, near its top: square, plain, its two little domes
  const tx = -36.5
  const tz = 104
  block(out, tx - 6.5, tx + 6.5, tz - 6.5, tz + 6.5, 0, 34, p.stone)
  for (const y of [23, 27, 30.8]) block(out, tx - 6.8, tx + 6.8, tz - 6.8, tz + 6.8, y, y + 0.35, p.trim)
  for (const s of [-3, 0, 3]) {
    for (const y of [24, 28]) {
      pane(out, '-x', tx - 6.5, tz + s, y, 1.4, 2.2, p.glass)
      pane(out, '+x', tx + 6.5, tz + s, y, 1.4, 2.2, p.glass)
      pane(out, '-z', tz - 6.5, tx + s, y, 1.4, 2.2, p.glass)
      pane(out, '+z', tz + 6.5, tx + s, y, 1.4, 2.2, p.glass)
    }
  }
  block(out, tx - 7, tx + 7, tz - 7, tz + 7, 33.4, 34.2, p.trim)
  balustrade(out, tx - 6.6, tx + 6.6, tz - 6.6, tz + 6.6, 34.2, p, { h: 0.9 })
  for (const dz of [-3, 3]) {
    block(out, tx - 2.2, tx + 2.2, tz + dz - 2.2, tz + dz + 2.2, 34.2, 36.2, p.stone)
    dome(out, tx, tz + dz, 36.2, 2.3, 2.3, shade(p.lead, 1.15), 12)
  }
}

/** A range's steeper pavilion roof, standing clear of the mansard behind it. */
function pavilion(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, slate: [number, number, number], lead: [number, number, number]): void {
  const h = 4.4
  const top = 1.6
  const q = (a: [number, number, number], b: [number, number, number], c: [number, number, number], d: [number, number, number], n: [number, number, number]): void =>
    out.quad([a, b, c, d], n, [[0, 0], [1, 0], [1, 1], [0, 1]], slate, FIXED)
  const i = Math.min(top + 1.4, (z1 - z0) / 2 - 0.2)
  q([x0, y, z0], [x1, y, z0], [x1 - i, y + h, z0 + i], [x0 + i, y + h, z0 + i], [0, 0.6, -0.8])
  q([x1, y, z1], [x0, y, z1], [x0 + i, y + h, z1 - i], [x1 - i, y + h, z1 - i], [0, 0.6, 0.8])
  q([x0, y, z1], [x0, y, z0], [x0 + i, y + h, z0 + i], [x0 + i, y + h, z1 - i], [-0.8, 0.6, 0])
  q([x1, y, z0], [x1, y, z1], [x1 - i, y + h, z1 - i], [x1 - i, y + h, z0 + i], [0.8, 0.6, 0])
  q([x0 + i, y + h, z0 + i], [x1 - i, y + h, z0 + i], [x1 - i, y + h, z1 - i], [x0 + i, y + h, z1 - i], [0, 1, 0])
  block(out, x0 + i - 0.05, x1 - i + 0.05, z0 + i - 0.05, z0 + i + 0.05, y + h, y + h + 0.35, lead)
}
