import type { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, clockOn, pedimentOn, rectOn, type Pal } from '../palaces/common.ts'
import { pal, pinnacle, roseOn } from './churches.ts'
import { apseWall, archesOn, band, FIXED, graded, ring, walls } from './common.ts'

/*
 * SAINT-AMBROISE (Théodore Ballu, 1863–68), on the Boulevard Voltaire: bright pale limestone, a Romanesque-Gothic front between TWIN
 * TOWERS of 68 m. Three deep round-arched portals, a gallery of little arches across the whole front, a great wheel of
 * a rose, an arcade over it, a steep gable with its cross and pinnacles at its shoulders; the towers set back behind the
 * narthex, square, each with paired belfry lights over a round clock and a corbelled cornice, a tall slate spire on them, four
 * small spires at its corners, a balustrade between. Behind, the long nave and its rounded apse.
 *
 * In the city the outline (way 63638108, no height) came out low and flat. The model replaces it: the walls are its ring, the front from
 * one Commons photograph, the spires' height Wikipedia's. The nave and apse above the ring's walls are plausible, not
 * checked. Frame: −z the portals toward the boulevard at bearing 235 (osmium, 2026-10-30).
 */
const HZ = 43.8
const P: Pal = pal('#e4dcc6', '#5e656a')
const GLASS: Rgb = hex('#242a33')
const DOOR: Rgb = hex('#2a2520')

/** The way's ring, simplified, without the towers' and the narthex's reach. */
const PLAN = ring([19.1, -1.1, 18.4, 28.5, 15.8, 28.2, 14.5, 29.7, 14.1, 28.2, 11.6, 28.6, 12.8, 30.3, 11.8, 33.6, 8.6, 35.2, 6.2, 34.3, 6.9, 37.6, 5.0, 41.7, 1.4, 43.8, 1.0, 42.7, -2.4, 43.6, -5.6, 40.8, -6.8, 37.6,
  -6.0, 33.9, -8.1, 35.4, -11.6, 33.7, -12.7, 30.4, -11.4, 28.6, -18.3, 28.6, -18.8, -1.0, -13.0, -1.6, -12.9, -11.6, -16.1, -13.8, -16.1, -16.6, -12.8, -18.9, -12.7, -28.9, 13.1, -28.9, 13.0, -19.1,
  16.0, -16.8, 16.0, -13.8, 12.9, -11.8, 12.9, -1.8])

export function saintAmbroise(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, 19.1, HZ, (q) => ambroise(q))
}

function ambroise(out: MeshBuilder): void {
  // the aisles' walls on the ring, the nave and transept over them, the apse
  walls(out, PLAN, 0, 13, P.stone, P.slate)
  band(out, PLAN, 12.6, 0.4, 0.2, P.trim)
  archesOn(out, PLAN, 5.0, 2.0, 5.6, 5.0, GLASS, 4.0)
  block(out, -7.6, 7.6, -37, 28, 13, 24, P.stone)
  block(out, -7.9, 7.9, -37.2, 28.2, 24, 24.5, P.trim)
  roof(out, -7.9, 7.9, -37.2, 28.2, 24.5, 6.4, 7.9, 0.01, P.slate)
  for (const [f, pl] of [['-x', -7.6], ['+x', 7.6]] as const) {
    for (let z = -26; z < 26; z += 5.0) archOn(out, f, pl, z, 15.5, 2.4, 6.2, GLASS)
  }
  apseWall(out, 0, 28, 7.4, 13, 22, 29, P.stone, P.slate, GLASS, 8)

  // THE FRONT, standing forward of the towers
  const z = -HZ + 0.65
  const w = 11.8
  block(out, -w, w, z, -28, 0, 28, P.stone)
  // three portals, each deep in its arch; the blind band and medallions over them
  for (const [x, r, h] of [[0, 3.1, 9.6], [-7.3, 2.3, 7.8], [7.3, 2.3, 7.8]] as const) {
    block(out, x - r - 0.8, x + r + 0.8, z - 0.8, z, 0, h + 1.7, P.trim)
    pedimentOn(out, '-z', z - 0.8, x - r - 1.0, x + r + 1.0, h + 1.7, 1.2, 0.3, P.trim)
    archOn(out, '-z', z - 0.8, x, 0, r * 2 + 0.9, h + 0.6, P.deep, 0.05)
    archOn(out, '-z', z - 0.8, x, 0, r * 2, h, DOOR, 0.1)
  }
  // the gallery of small arches right across, its sill and its balustrade
  block(out, -w - 0.2, w + 0.2, z - 0.35, z, 12.5, 13.0, P.trim)
  for (let i = 0; i < 12; i++) archOn(out, '-z', z, -w + (2 * w * (i + 0.5)) / 12, 13.1, 1.15, 3.1, GLASS)
  block(out, -w - 0.2, w + 0.2, z - 0.3, z, 16.5, 16.85, P.trim)
  // the rose in its round frame, statues in niches either side
  roseOn(out, '-z', z, 0, 21.6, 3.6, GLASS, P.trim)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    rectOn(out, '-z', z, Math.cos(a) * 2.9 - 0.14, Math.cos(a) * 2.9 + 0.14, 21.6 + Math.sin(a) * 2.9 - 0.14, 21.6 + Math.sin(a) * 2.9 + 0.14, P.trim, 0.14)
  }
  for (const x of [-7.4, 7.4]) {
    archOn(out, '-z', z, x, 18.0, 1.3, 4.4, P.deep, 0.06)
    prism(out, x, z - 0.2, 18.0, 21.8, 0.32, 6, P.trim, FIXED, 0.24, true)
  }
  // the arcade under the gable, the gable with its windows and cross, the two pinnacles at its shoulders
  block(out, -w - 0.1, w + 0.1, z - 0.3, z, 26.2, 26.6, P.trim)
  for (const x of [-2.2, 0, 2.2]) archOn(out, '-z', z, x, 27.0, 1.1, 2.6, GLASS)
  pedimentOn(out, '-z', z, -w, w, 28, 7.6, 2.0, P.trim)
  roof(out, -w, w, z + 2, -28, 28, 7.6, w, 0.01, P.slate)
  crossOn(out, z)
  for (const x of [-w + 0.2, w - 0.2]) {
    block(out, x - 0.55, x + 0.55, z - 0.3, z + 0.8, 0, 28, P.trim)
    pinnacle(out, x, z + 0.25, 28, 6.0, 1.4, P.trim)
  }

  // THE TOWERS
  for (const s of [-1, 1]) tower(out, s * 15.7)
}

/** The stone cross on the gable's point. */
function crossOn(out: MeshBuilder, z: number): void {
  block(out, -0.12, 0.12, z + 0.3, z + 0.55, 35.4, 38.0, P.trim)
  block(out, -0.75, 0.75, z + 0.3, z + 0.55, 36.7, 37.0, P.trim)
}

/** One tower at x: square stages, the clock, the double lights, a corbel table, the spire with its four spirelets. */
function tower(out: MeshBuilder, x: number): void {
  const h = 3.45
  const z0 = -36.9
  const z1 = -29.6
  const zc = (z0 + z1) / 2
  block(out, x - h, x + h, z0, z1, 0, 37.5, P.stone)
  for (const y of [13.0, 26.4, 37.4]) block(out, x - h - 0.22, x + h + 0.22, z0 - 0.22, z1 + 0.22, y, y + 0.55, P.trim)
  block(out, x - h - 0.45, x + h + 0.45, z0 - 0.45, z1 + 0.45, 37.95, 38.65, shade(P.trim, 1.03))
  for (const [f, pl, t] of [['-z', z0, x], ['+z', z1, x], ['-x', x - h, zc], ['+x', x + h, zc]] as const) {
    for (const u of [-1.05, 1.05]) archOn(out, f, pl, t + u, 16.0, 1.2, 5.6, GLASS)
    clockOn(out, f, pl, t, 24.1, 1.35, P)
    for (const u of [-1.05, 1.05]) archOn(out, f, pl, t + u, 28.0, 1.5, 7.8, GLASS)
    rectOn(out, f, pl, t - 0.18, t + 0.18, 28, 35.2, P.trim, 0.1)
  }
  // the spire and its corner spirelets, the balustrade between them
  prism(out, x, zc, 38.65, 66.5, 3.4, 8, P.slate, FIXED, 0.3, true)
  for (let i = 0; i < 4; i++) {
    const a = ((i + 0.5) / 4) * Math.PI * 2
    pinnacle(out, x + Math.sin(a) * 3.8, zc + Math.cos(a) * 3.8, 38.65, 6.6, 1.5, P.slate)
  }
  for (const [nx, nz] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
    block(out, x + nx * 2.6 - (nz ? 0.8 : 0.18), x + nx * 2.6 + (nz ? 0.8 : 0.18), zc + nz * 2.6 - (nx ? 0.8 : 0.18), zc + nz * 2.6 + (nx ? 0.8 : 0.18), 42.2, 45.6, shade(P.slate, 1.08))
  }
  block(out, x - 0.05, x + 0.05, zc - 0.05, zc + 0.05, 66.3, 68.0, P.dark)
  block(out, x - 0.45, x + 0.45, zc - 0.05, zc + 0.05, 67.1, 67.2, P.dark)
}
