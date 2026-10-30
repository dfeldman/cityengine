import type { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, classicalColumn, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, fitted, palette, rectOn, slabOn, statue, terrace, type Pal } from './common.ts'
import { wallOn } from './wall.ts'

/** the design footprint: OSM way 188108997's box turned to the Avenue Franklin-Roosevelt (local −z faces bearing 268) */
const HX = 74.5
const HZ = 26

const CORNICE = 16.6
const POD = 2.2

/**
 * Le Palais de la Découverte, the west wing of the Grand Palais (Albert Thomas, 1897–1900), on the Avenue Franklin-Roosevelt. The
 * Grand Palais entry (render/landmarks/paris/grand-palais.ts) draws the nave and the avenue front and stops where this way begins,
 * with a low stone stand-in on the seam behind this model. What a rider sees:
 *
 * - the great PORTAL: a colossal round arch between pairs of columns, on steps, the bronze groups on their pedestals before it, the
 *   tall attic over it with its two pylons;
 * - the COLONNADE either side, a column to every bay on the podium, a frieze of colour along the wall behind it;
 * - the END PAVILIONS with their niches, a balustrade and urns along the skyline.
 *
 * Plan is OSM's, simplified to its projections (the portal block, the wings, the pavilions). Commons "Paris 8e - Palais de la
 * découverte - Façade principale 01"; heights scaled off the cars before it: podium 2.2, cornice 16.6, attic to 26.
 */
export function decouverte(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d9cfb8', '#50565a')
  const frieze = hex('#8a7a58')
  const WALL = -17
  const PZ = -21
  // ---- the body behind the colonnade and the podium under everything
  block(out, -71, 71, WALL, 24, 0, CORNICE - 0.2, p.stone)
  block(out, -74.5, 74.5, -23, -9, 0, POD, shade(p.stone, 0.95))
  for (let y = 0.55; y < POD; y += 0.55) rectOn(out, '-z', -23, -74.5, 74.5, y - 0.03, y + 0.03, p.deep, 0.03)
  // ---- the two wings
  for (const s of [-1, 1]) wing(out, s, WALL, PZ, p, frieze)
  // ---- the flat roof behind its balustrade, and the urns on it
  terrace(out, -71, 71, PZ - 0.7, 24, CORNICE + 0.5, p, { sides: ['-z'], h: 1 })
  block(out, -71, 71, PZ - 0.7, PZ + 0.8, CORNICE, CORNICE + 0.5, p.trim)
  block(out, -71, 71, PZ + 0.8, 24, CORNICE, CORNICE + 0.42, p.lead)
  for (const s of [-1, 1]) for (let x = 20; x < 61; x += 8.25) prism(out, s * x, PZ - 0.5, CORNICE + 1.5, CORNICE + 2.7, 0.34, 8, shade(p.stone, 1.02), 0, 0.14)
  // ---- the portal
  portal(out, p)
  // ---- the end pavilions, standing forward, the plain wall with a niche
  for (const s of [-1, 1]) pavilion(out, s, p)
  // the plain ends and back of the wing, a window to every bay
  for (const f of [['+z', 24]] as const) for (let x = -66; x < 67; x += 6.6) rectOn(out, f[0], f[1], x - 1.3, x + 1.3, 3, 11, p.glass, 0.05)
}

function wing(out: MeshBuilder, s: number, WALL: number, PZ: number, p: Pal, frieze: Rgb): void {
  const X0 = 15.4
  const X1 = 61.2
  const n = 7
  const bay = (X1 - X0) / n
  const lo = s < 0 ? -X1 : X0
  const hi = s < 0 ? -X0 : X1
  // the wall behind: a tall window to every bay, the frieze of colour over them
  for (let i = 0; i < n; i++) {
    const x = lo + bay * (i + 0.5)
    rectOn(out, '-z', WALL, x - 2.1, x + 2.1, POD + 0.8, 11.2, p.trim, 0.04)
    rectOn(out, '-z', WALL, x - 1.75, x + 1.75, POD + 1, 11, p.glass, 0.07)
    rectOn(out, '-z', WALL, x - 0.06, x + 0.06, POD + 1, 11, p.trim, 0.09)
    rectOn(out, '-z', WALL, x - 1.75, x + 1.75, 7.2, 7.32, p.trim, 0.09)
  }
  rectOn(out, '-z', WALL, lo, hi, 12, 14.4, frieze, 0.05)
  for (let x = lo; x < hi; x += 1.3) rectOn(out, '-z', WALL, x + 0.1, x + 1, 12.3, 14.1, shade(frieze, 1.24 - ((Math.abs(x) * 3) % 5) * 0.09), 0.07)
  // the columns, the entablature over them, the soffit of the walk
  for (let i = 0; i <= n; i++) {
    const x = lo + bay * i
    block(out, x - 0.82, x + 0.82, PZ - 0.82, PZ + 0.82, POD, POD + 0.9, shade(p.stone, 0.94))
    classicalColumn(out, x, PZ, POD + 0.9, 14.5, 0.62, p.stone, { order: 'ionic', tier: 'mid', trim: p.trim, heading: Math.PI })
  }
  slabOn(out, '-z', PZ + 0.8, lo, hi, 14.5, CORNICE, 0.8, p.trim)
  rectOn(out, '-z', PZ, lo, hi, 15.2, 15.3, p.deep, 0.03)
  block(out, lo, hi, PZ - 0.7, WALL, 14.45, 14.55, shade(p.stone, 0.72))
  block(out, lo, hi, PZ - 0.7, PZ - 0.3, POD, POD + 0.05, p.deep)
}

function pavilion(out: MeshBuilder, s: number, p: Pal): void {
  const a = s < 0 ? -74.4 : 61.2
  const b = s < 0 ? -61.2 : 74.4
  const Z = -22.6
  const cx = (a + b) / 2
  block(out, a, b, Z, 24, 0, CORNICE, p.stone)
  for (let y = 0.6; y < 10; y += 0.6) rectOn(out, '-z', Z, a, b, y - 0.04, y + 0.04, p.deep, 0.03)
  archOn(out, '-z', Z, cx, POD + 0.4, 4.6, 8.2, p.trim, 0.04)
  archOn(out, '-z', Z, cx, POD + 0.6, 3.8, 7.6, shade(p.stone, 0.66), 0.07)
  statue(out, cx, Z - 0.3, POD + 0.6, 3.2, shade(p.stone, 0.95))
  rectOn(out, '-z', Z, a + 1.2, b - 1.2, 12, 14.6, shade(p.stone, 0.94), 0.05)
  block(out, a - 0.3, b + 0.3, Z - 0.5, 24, CORNICE - 0.6, CORNICE + 0.5, p.trim)
  block(out, a + 0.5, b - 0.5, Z + 0.5, 24, CORNICE + 0.5, CORNICE + 2.4, shade(p.stone, 0.96))
  block(out, a + 0.3, b - 0.3, Z + 0.3, Z + 1.3, CORNICE + 2.4, CORNICE + 2.8, p.trim)
  block(out, a + 0.3, b - 0.3, Z + 1.3, 24, CORNICE + 2.4, CORNICE + 2.7, p.lead)
}

function portal(out: MeshBuilder, p: Pal): void {
  const FRONT = -24.2
  const W = 15.3
  const TOP = 19
  const bronze: Rgb = hex('#3f4a42')
  // the block
  block(out, -W, W, FRONT, -17, 0, TOP, p.stone)
  // ---- the arch: the surround, the void, the door and its fanlight
  const aw = 11.4
  const w = wallOn(out, { x: -W, z: FRONT }, { x: W, z: FRONT })
  w.arch(W, POD, aw + 1.6, 14.2, p.trim, 0.04)
  w.arch(W, POD, aw, 13.4, shade(p.glass, 0.82), 0.07)
  for (let t = -4.4; t <= 4.5; t += 2.2) rectOn(out, '-z', FRONT, t - 0.09, t + 0.09, POD, POD + 8 + 4.6 * Math.sqrt(Math.max(0, 1 - (t / 5.7) ** 2)), hex('#3a3a36'), 0.09)
  rectOn(out, '-z', FRONT, -5.7, 5.7, POD + 7.6, POD + 7.9, hex('#3a3a36'), 0.09)
  rectOn(out, '-z', FRONT, -2.4, 2.4, POD, POD + 5.2, hex('#403c35'), 0.1)
  // the carved spandrels
  for (const s of [-1, 1]) rectOn(out, '-z', FRONT, s * 6.9 - 1, s * 6.9 + 1, 11.4, 15.2, shade(p.stone, 0.9), 0.05)
  // ---- the pairs of columns either side
  for (const s of [-1, 1]) {
    for (const x of [s * 9.4, s * 12.4]) {
      block(out, x - 1, x + 1, FRONT - 2.2, FRONT - 0.2, POD, POD + 1.5, shade(p.stone, 0.93))
      classicalColumn(out, x, FRONT - 1.2, POD + 1.5, 15.7, 0.72, p.stone, { order: 'corinthian', tier: 'near', trim: p.trim, heading: Math.PI })
    }
    // the entablature broken forward over them
    block(out, s * 10.9 - 3.1, s * 10.9 + 3.1, FRONT - 2.4, FRONT, 15.7, 17.5, p.trim)
    // the great pylon standing over each pair, with its wreath
    block(out, s * 10.9 - 2.3, s * 10.9 + 2.3, FRONT - 1.2, FRONT + 2.4, 17.5, 25, shade(p.stone, 1.02))
    block(out, s * 10.9 - 2.7, s * 10.9 + 2.7, FRONT - 1.5, FRONT + 2.7, 24.6, 25.4, p.trim)
    rectOn(out, '-z', FRONT - 1.2, s * 10.9 - 1.3, s * 10.9 + 1.3, 19.3, 22.8, shade(p.stone, 0.88), 0.04)
    // the bronze group before it, on its pedestal at the foot of the steps
    const gx = s * 10.9
    const gz = FRONT - 5.2
    block(out, gx - 1.7, gx + 1.7, gz - 1.5, gz + 1.5, 0, 2.8, shade(p.stone, 0.93))
    block(out, gx - 1.9, gx + 1.9, gz - 1.7, gz + 1.7, 2.8, 3.1, p.trim)
    block(out, gx - 0.45, gx + 0.45, gz - 1.25, gz + 1.25, 3.9, 5, bronze)
    prism(out, gx, gz - 1, 4.8, 6.4, 0.3, 6, bronze, 0, 0.18)
    prism(out, gx, gz + 0.2, 4.8, 7.2, 0.44, 6, bronze, 0, 0.25)
    for (const [dx, dz] of [[-0.3, -1], [0.3, -1], [-0.3, 1], [0.3, 1]] as const) block(out, gx + dx - 0.12, gx + dx + 0.12, gz + dz - 0.12, gz + dz + 0.12, 3.1, 4, bronze)
  }
  // ---- the attic between the pylons, sculpted panels, the cornice
  block(out, -W, W, FRONT, -17, TOP - 2.1, TOP - 1, p.trim)
  block(out, -8.6, 8.6, FRONT + 1, -17, TOP, 23.4, shade(p.stone, 1.01))
  rectOn(out, '-z', FRONT + 1, -7.4, 7.4, 19.7, 22.3, shade(p.stone, 0.88), 0.05)
  block(out, -8.9, 8.9, FRONT + 0.7, -17, 23.4, 24.1, p.trim)
  // ---- the steps
  for (let k = 0; k < 7; k++) {
    const z = FRONT - 3.6 + k * 0.42
    block(out, -6.4 - (6 - k) * 0.16, 6.4 + (6 - k) * 0.16, z, FRONT, 0, 0.31 * (k + 1), shade(p.stone, 0.96))
  }
}
