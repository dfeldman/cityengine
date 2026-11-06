import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import { sign } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archOn, clockOn, extrude, fitted, palette, pedimentOn, pts, rectOn, slabOn } from '../palaces/common.ts'
import { bands, rustic } from './civic.ts'

const FIXED = 0
/** the design footprint: OSM way 63203297's box turned to the Rue du Faubourg-Saint-Martin (local −z faces bearing 292) */
const HX = 27.4
const HZ = 28.8

/** OSM's outline in this frame (osmium, 2026-11-05) */
const OUTER = pts([-14.2, -26.9, -17.4, -16.9, -16.4, -16.6, -17.9, -11.8, -23.3, 5.2, -24.2, 4.9, -25.8, 10.1, -27.4, 15.1, -26.8, 15.7, -26.6, 16.1, -23.0, 17.2,
  -22.9, 16.8, -19.3, 17.9, -19.4, 18.3, -15.9, 19.4, -15.8, 19.0, -7.9, 21.4, 4.7, 25.2, 4.6, 25.6, 8.0, 26.7, 8.0, 26.5, 11.4, 27.5, 14.8, 28.8,
  15.3, 28.3, 16.3, 24.9, 16.0, 24.9, 16.8, 21.4, 17.0, 21.5, 17.7, 18.0, 17.1, 17.9, 21.2, -1.5, 24.5, -17.1, 25.1, -17.0, 27.4, -27.7, 26.8, -28.2,
  26.5, -28.8, 23.3, -28.6, 17.0, -28.3, 17.0, -27.6, 14.5, -27.5, 2.8, -27.0, -4.4, -26.7, -4.4, -27.4, -10.2, -27.1])

/** heights: Commons photograph PH58580 (the front ≈ 37 m wide), checked against the IGN lidar MNS (plateau 29–30 m) */
const E = 17 // the cornice and balustrade
const G = 8.3 // the first floor
const RISE = 12.5 // the high slate roof up to its flat top
const INSET = 7 // how far the roof's top is drawn in
const F = -27.7 // the front plane
const CX = 7 // the front's centre
const PITCH = 5.4 // bay to bay (seven bays)
const TOWER_Z = -16
const TOWER_Y0 = 22 // the belfry's foot, buried in the roof
const TOWER_W = 1.8 // the shaft's half width
const CLOCK_Y = 31.5
const LANTERN_Y = 37
const SPIRE = 5

/**
 * La Mairie du 10e (Eugène Rouyer, 1892–96), neo-Renaissance on the Rue du Faubourg-Saint-Martin. Seen from the street:
 * a seven-bay stone front, rusticated ground floor of five arcades between two end windows, tall first-floor windows between
 * pilasters, a balustrade, then a high slate roof with a row of pedimented dormers, two end pavilions with steep pyramids
 * and finials, and the belfry rising from the ridge: clock stage, open lantern, domed cap and spire.
 */
export function mairie10e(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
  sign(out, { type: 'flat', text: 'MAIRIE DU Xᵉ ARRᵗ', h: 0.5, face: 'roman', colour: [0.3, 0.26, 0.2], tracking: 0.14, lit: 'none', w: 8 },
    { x: CX * fit.hx / HX, y: G - 0.9, z: (F - 0.5) * fit.hz / HZ, heading: Math.PI })
}

function draw(out: MeshBuilder): void {
  const p = palette('#d8ceb8', '#3a4046')
  const stone = hex('#d8ceb8')
  p.trim = stone
  p.deep = shade(stone, 0.86)
  extrude(out, [OUTER], p, { eaves: E, bay: 4.2, win: 1.5, rise: RISE, inset: INSET, dormers: false,
    storeys: [{ y: 0, h: 3.6, sill: 1.2 }, { y: G, h: 5, sill: 1.3 }] })
  rustic(out, OUTER, 0.4, G - 0.4, 0.8, stone, 5)
  bands(out, OUTER, [G - 0.2], 0.5, 0.18, stone, 5)
  bands(out, OUTER, [E - 0.9], 0.9, 0.3, stone, 5)

  // ---- the front skin
  const f = F - 0.3
  const a = CX - 3.5 * PITCH
  const b = CX + 3.5 * PITCH
  block(out, a, b, f, F + 1.8, 0, E, p.stone)
  for (let y = 0.9; y < G - 0.4; y += 0.8) rectOn(out, '-z', f, a, b, y, y + 0.24, stone, 0.03)
  slabOn(out, '-z', f, a - 0.1, b + 0.1, 0, 0.6, 0.12, shade(stone, 0.85))
  slabOn(out, '-z', f, a - 0.15, b + 0.15, G - 0.4, G + 0.3, 0.3, stone)
  for (let i = -3; i <= 3; i++) {
    const x = CX + i * PITCH
    const end = Math.abs(i) === 3
    // ground floor: five arcades between two square end windows
    if (end) {
      rectOn(out, '-z', f, x - 0.9, x + 0.9, 1.4, 4.4, stone, 0.05)
      rectOn(out, '-z', f, x - 0.7, x + 0.7, 1.6, 4.2, p.glass, 0.09)
    } else {
      archOn(out, '-z', f, x, 0.6, 2.6, 5.4, shade(stone, 0.8), 0.07)
      archOn(out, '-z', f, x, 0.6, 2.0, 4.8, p.dark, 0.11)
    }
    // first floor: tall windows with a surround, a keystone, and a pediment on the end bays and the centre
    rectOn(out, '-z', f, x - 1.25, x + 1.25, G + 0.9, G + 6.4, stone, 0.08)
    rectOn(out, '-z', f, x - 0.95, x + 0.95, G + 1.2, G + 6.1, p.glass, 0.12)
    rectOn(out, '-z', f, x - 0.95, x + 0.95, G + 4.2, G + 4.35, stone, 0.14)
    slabOn(out, '-z', f, x - 1.45, x + 1.45, G + 6.4, G + 6.7, 0.28, stone)
    if (end || i === 0) pedimentOn(out, '-z', f, x - 1.45, x + 1.45, G + 6.7, 0.9, 0.25, stone)
    // the pilasters between bays
    if (i < 3) slabOn(out, '-z', f, x + PITCH / 2 - 0.3, x + PITCH / 2 + 0.3, G + 0.3, E - 1.2, 0.3, shade(stone, 1.03))
  }
  slabOn(out, '-z', f, a - 0.1, b + 0.1, E - 1.4, E - 1.2, 0.3, stone)
  // the balustrade band and cornice on brackets
  for (let x = a + 0.3; x < b; x += 0.55) slabOn(out, '-z', f, x - 0.07, x + 0.07, E - 1.2, E - 0.55, 0.15, shade(stone, 0.95))
  slabOn(out, '-z', f, a - 0.2, b + 0.2, E - 0.55, E - 0.4, 0.3, stone)
  for (let x = a + 0.4; x < b; x += 0.9) slabOn(out, '-z', f, x - 0.14, x + 0.14, E - 0.4, E + 0.15, 0.35, shade(stone, 0.93))
  slabOn(out, '-z', f, a - 0.4, b + 0.4, E, E + 0.35, 0.7, stone)
  // the end pavilions project a little
  for (const s of [-1, 1]) {
    const x = CX + s * 3 * PITCH
    block(out, x - PITCH / 2, x + PITCH / 2, f - 0.5, F + 1.8, 0, E + 0.35, p.stone)
    slabOn(out, '-z', f - 0.5, x - PITCH / 2 - 0.2, x + PITCH / 2 + 0.2, E, E + 0.35, 0.45, stone)
    rectOn(out, '-z', f - 0.5, x - 1.25, x + 1.25, G + 0.9, G + 6.4, stone, 0.08)
    rectOn(out, '-z', f - 0.5, x - 0.95, x + 0.95, G + 1.2, G + 6.1, p.glass, 0.12)
    slabOn(out, '-z', f - 0.5, x - PITCH / 2 - 0.2, x + PITCH / 2 + 0.2, G - 0.4, G + 0.3, 0.3, stone)
    rectOn(out, '-z', f - 0.5, x - 0.9, x + 0.9, 1.4, 4.4, stone, 0.05)
    rectOn(out, '-z', f - 0.5, x - 0.7, x + 0.7, 1.6, 4.2, p.glass, 0.09)
    // steep pyramid roof and finial
    const rf = f - 0.5
    roof(out, x - PITCH / 2 - 0.1, x + PITCH / 2 + 0.1, rf, F + 7, E + 0.35, 12.5, PITCH / 2 - 0.2, 3.1, p.slate)
    prism(out, x, F + 3.5, E + 12.8, E + 17.5, 0.07, 4, p.dark, FIXED, 0.05)
    prism(out, x, F + 3.5, E + 14.5, E + 14.8, 0.35, 8, stone, FIXED, 0.2)
    // dormer in the pyramid's face
    block(out, x - 0.9, x + 0.9, rf + 0.2, rf + 1.6, E + 3, E + 6.2, stone)
    rectOn(out, '-z', rf + 0.2, x - 0.6, x + 0.6, E + 3.4, E + 5.7, p.glass, 0.06)
    pedimentOn(out, '-z', rf + 0.2, x - 1.1, x + 1.1, E + 6.2, 1.0, 0.2, stone)
    // chimney stacks flanking the front
    block(out, x - s * 3.2 - 0.4, x - s * 3.2 + 0.4, F + 5, F + 5.8, E + 4, E + 12, shade(stone, 0.9))
  }

  // ---- the row of dormers in the high roof between the pavilions
  for (let i = -2; i <= 2; i++) {
    const x = CX + i * PITCH
    const dz = F + 1.8
    block(out, x - 1.0, x + 1.0, dz, dz + 2.4, E + 0.4, E + 4.0, stone)
    rectOn(out, '-z', dz, x - 0.65, x + 0.65, E + 0.9, E + 3.6, p.glass, 0.08)
    slabOn(out, '-z', dz, x - 1.2, x + 1.2, E + 4.0, E + 4.3, 0.2, stone)
    pedimentOn(out, '-z', dz, x - 1.2, x + 1.2, E + 4.3, 1.1, 0.2, stone)
    prism(out, x, dz + 0.8, E + 5.4, E + 6.4, 0.06, 4, p.dark, FIXED, 0.05)
  }
  // roof-top crest along the plateau
  const top = E + RISE
  for (let x = a + INSET; x < b - INSET; x += 0.6) block(out, x - 0.05, x + 0.05, F + INSET - 0.1, F + INSET, top, top + 0.7, p.dark)
  slabOn(out, '-z', F + INSET, a + INSET, b - INSET, top + 0.7, top + 0.85, 0.12, p.dark)
  stack4(out, a + 8, top, p)
  stack4(out, b - 8, top, p)

  // ---- the belfry on the ridge: clock stage, open lantern, domed cap, spire
  const cx = CX
  const tz = TOWER_Z
  const w = TOWER_W
  block(out, cx - w, cx + w, tz - w, tz + w, TOWER_Y0, CLOCK_Y + 2.6, stone)
  clockOn(out, '-z', tz - w, cx, CLOCK_Y, 1.0, p)
  rectOn(out, '-z', tz - w, cx - 0.6, cx + 0.6, CLOCK_Y - 5.0, CLOCK_Y - 2.8, p.glass, 0.06)
  slabOn(out, '-z', tz - w, cx - w - 0.2, cx + w + 0.2, CLOCK_Y + 2.6, CLOCK_Y + 3.0, 0.25, stone)
  pedimentOn(out, '-z', tz - w, cx - w, cx + w, CLOCK_Y + 3.0, 0.8, 0.2, stone)
  for (const s of [-1, 1]) block(out, cx + s * (w + 0.35) - 0.3, cx + s * (w + 0.35) + 0.3, tz - w - 0.4, tz - w + 0.1, TOWER_Y0 + 2, CLOCK_Y + 2.6, shade(stone, 0.95))
  block(out, cx - w - 0.2, cx + w + 0.2, tz - w - 0.2, tz + w + 0.2, LANTERN_Y - 1.0, LANTERN_Y, stone)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) block(out, cx + sx * (w - 0.3) - 0.2, cx + sx * (w - 0.3) + 0.2, tz + sz * (w - 0.3) - 0.2, tz + sz * (w - 0.3) + 0.2, LANTERN_Y, LANTERN_Y + 3.6, stone)
  prism(out, cx, tz, LANTERN_Y, LANTERN_Y + 3.6, 0.5, 8, p.dark, FIXED, 0.5)
  slabOn(out, '-z', tz - w - 0.1, cx - w - 0.3, cx + w + 0.3, LANTERN_Y + 3.6, LANTERN_Y + 4.0, 0.2, stone)
  prism(out, cx, tz, LANTERN_Y + 4.0, LANTERN_Y + 6.0, 1.9, 8, p.slate, FIXED, 0.35)
  prism(out, cx, tz, LANTERN_Y + 6.0, LANTERN_Y + 6.0 + SPIRE, 0.1, 4, p.dark, FIXED, 0.05)
}

function stack4(out: MeshBuilder, x: number, top: number, p: ReturnType<typeof palette>): void {
  block(out, x - 0.6, x + 0.6, -6, -4.8, top - 0.5, top + 3.2, shade(p.stone, 0.88))
  block(out, x - 0.75, x + 0.75, -6.15, -4.65, top + 3.2, top + 3.5, p.stone)
}
