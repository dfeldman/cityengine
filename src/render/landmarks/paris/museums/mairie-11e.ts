import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import { sign } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archOn, clockOn, extrude, fitted, palette, pts, rectOn, slabOn } from '../palaces/common.ts'
import { bands, rustic, stack } from './civic.ts'

const FIXED = 0
/** the design footprint: OSM relation 1002474's box (local −z faces bearing 143.1, the Place Léon-Blum) */
const HX = 24.5
const HZ = 27.9

/** OSM's outline and court in this frame (osmium, 2026-11-05) */
const OUTER = pts([24.5, 25.3, 19.8, 1.1, 14.3, -27.4, 8.1, -27.3, 8.1, -27.9, 0.8, -27.9, -7.9, -27.9, -7.9, -27.3, -13.8, -27.3, -14.1, -27.4, -17.5, -11.0, -17.3, -11.0, -19.3, -1.1, -19.4, -1.1, -19.6, -0.2, -19.5, -0.2, -19.7, 1.2, -20.0, 2.7, -20.2, 2.6, -20.3, 3.6, -20.2, 3.6, -22.0, 13.5, -22.1, 13.5, -23.5, 19.8, -24.5, 25.3, -24.3, 25.3, -22.4, 27.7, -22.4, 27.9, -21.4, 27.8, -21.4, 27.7, -14.9, 27.7, -14.9, 27.9, -14.0, 27.9, -14.0, 27.7, -2.5, 27.7, -2.5, 27.9, -1.5, 27.9, -1.5, 27.8, -0.0, 27.8, 1.6, 27.7, 1.6, 27.9, 2.5, 27.9, 2.5, 27.8, 14.0, 27.8, 14.0, 27.9, 14.5, 27.9, 14.9, 27.9, 14.9, 27.8, 21.4, 27.6, 21.4, 27.8, 22.4, 27.8, 22.4, 27.7, 24.3, 25.3])
const COURTS = [pts([14.4, 14.5, 14.1, 14.9, 2.5, 14.9, 2.3, 14.8, 1.5, 14.8, 1.3, 15.0, -1.8, 14.9, -1.9, 14.8, -2.7, 14.8, -2.7, 15.0, -13.9, 15.0, -14.2, 14.9, -14.2, 14.6, -9.8, -9.0, -9.5, -9.3, -9.2, -9.5, -8.8, -9.5, -6.3, -9.5, -6.3, -9.1, -6.1, -9.1, -6.1, -5.6, -6.3, -5.3, -6.3, -4.6, -5.3, -4.5, -5.2, -4.8, -2.3, -4.8, -2.3, -4.6, -1.6, -4.6, -1.6, -4.8, 1.7, -4.8, 1.7, -4.6, 2.5, -4.6, 2.5, -4.7, 5.5, -4.8, 5.6, -4.6, 6.3, -4.6, 6.4, -5.4, 6.2, -5.4, 6.2, -9.2, 6.4, -9.2, 6.4, -9.6, 9.6, -9.6, 9.9, -9.2])]

/** heights read off the Commons/Wikipedia photograph of the front (28 m ≈ 536 px), checked against the IGN lidar MNS (ridge ~22–25 m) */
const E = 16.4 // the cornice
const RISE = 5 // the hipped slate
const ATTIC = 17.1 // the low attic course above the cornice
const F = -27.3 // the front plane of the wings
const PF = -27.9 // the central bays, 0.6 m forward
const XW = 14.2 // half the front width

/**
 * La Mairie du 11e (Étienne-François Gancel, 1862–65) on the Place Léon-Blum. What the rider sees from the place: a single
 * stone block 28 m wide — three arched doorways under a balcony, three tall arched windows with pediments between four
 * pilasters, a small pedimented window in each end bay, a bracketed cornice, a slate hipped roof with chimneys and a clock
 * aedicule over a carved cartouche on the front.
 */
export function mairie11e(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
  sign(out, { type: 'flat', text: 'MAIRIE DU XIᵉ ARRᵗ', h: 0.5, face: 'roman', colour: [0.3, 0.26, 0.2], tracking: 0.12, lit: 'none', w: 8 },
    { x: 0, y: E - 0.9, z: (PF - 0.15) * fit.hz / HZ, heading: Math.PI })
}

function draw(out: MeshBuilder): void {
  const p = palette('#cdbf9f', '#4a5058')
  const stone = hex('#d6c9a8')
  p.trim = stone
  p.deep = shade(stone, 0.86)
  extrude(out, [OUTER, ...COURTS], p, { eaves: E, bay: 3.6, win: 1.4, rise: RISE, inset: 4, dormers: false,
    storeys: [{ y: 0, h: 3, sill: 1.8 }], frames: false })
  rustic(out, OUTER, 0.4, 6.4, 0.8, stone, 5)
  bands(out, OUTER, [6.6], 0.5, 0.18, stone, 5)
  bands(out, OUTER, [E - 1], 1.0, 0.3, stone, 5)

  // ---- the front: a skin proud of the plan
  const f = PF
  block(out, -XW, XW, F - 0.3, F + 0.4, 0, E, stone)
  block(out, -7.9, 8.1, PF, F, 0, E, stone)
  for (let y = 0.9; y < 6.4; y += 0.8) rectOn(out, '-z', f, -XW, XW, y, y + 0.2, shade(stone, 0.9), 0.03)
  slabOn(out, '-z', f, -XW - 0.1, XW + 0.1, 0, 0.5, 0.12, shade(stone, 0.85))
  // ground floor: three arched doorways with iron gates, under keystones
  for (const x of [-4.7, 0, 4.7]) {
    archOn(out, '-z', f, x, 0.5, 3.2, 6.4, p.dark, 0.08)
    for (const g of [-1.0, -0.33, 0.33, 1.0]) rectOn(out, '-z', f, x + g - 0.04, x + g + 0.04, 0.5, 4.6, [0.07, 0.07, 0.08], 0.12)
    slabOn(out, '-z', f, x - 0.3, x + 0.3, 6.6, 7.2, 0.2, shade(stone, 0.9))
  }
  // the end bays' ground windows
  for (const s of [-1, 1]) {
    rectOn(out, '-z', F - 0.3, s * 10.3 - 0.7, s * 10.3 + 0.7, 2.0, 4.8, p.glass, 0.09)
    rectOn(out, '-z', F - 0.3, s * 10.3 - 0.95, s * 10.3 + 0.95, 1.8, 5.0, stone, 0.05)
  }
  // the string course and the balcony under the three windows
  slabOn(out, '-z', f, -XW, XW, 7.2, 7.7, 0.3, stone)
  slabOn(out, '-z', f, -7.4, 7.4, 8.3, 8.8, 0.7, stone)
  for (let x = -7; x <= 7; x += 0.5) block(out, x - 0.05, x + 0.05, f - 0.7, f - 0.65, 8.8, 9.7, stone)
  slabOn(out, '-z', f, -7.4, 7.4, 9.7, 9.85, 0.75, stone)
  // first floor: three tall arched windows, each under a pediment, between paired pilasters
  for (const x of [-4.7, 0, 4.7]) {
    archOn(out, '-z', f, x, 8.8, 3.0, 4.6, stone, 0.1)
    archOn(out, '-z', f, x, 9.0, 2.2, 4.2, p.glass, 0.14)
    rectOn(out, '-z', f, x - 0.05, x + 0.05, 9.0, 12.4, stone, 0.17)
    slabOn(out, '-z', f, x - 1.9, x + 1.9, 13.4, 13.7, 0.3, stone)
    ped(out, f, x - 1.9, x + 1.9, 13.7, 0.9, 0.3, stone)
    rectOn(out, '-z', f, x - 1.3, x + 1.3, 13.75, 14.3, shade(stone, 0.88), 0.34)
  }
  for (const x of [-7.1, -2.35, 2.35, 7.1]) {
    block(out, x - 0.35, x + 0.35, f - 0.5, f - 0.05, 7.7, 14.5, stone)
    block(out, x - 0.5, x + 0.5, f - 0.7, f - 0.05, 14.5, 15.0, stone)
  }
  // the end bays: a small window in an aedicule with a pediment
  for (const s of [-1, 1]) {
    const x = s * 10.4
    rectOn(out, '-z', F - 0.3, x - 0.9, x + 0.9, 8.3, 11.6, stone, 0.06)
    rectOn(out, '-z', F - 0.3, x - 0.65, x + 0.65, 8.6, 11.3, p.glass, 0.1)
    slabOn(out, '-z', F - 0.3, x - 1.2, x + 1.2, 11.6, 11.9, 0.22, stone)
    ped(out, F - 0.3, x - 1.2, x + 1.2, 11.9, 0.9, 0.22, stone)
    rectOn(out, '-z', F - 0.3, x - 0.7, x + 0.7, 13.2, 14.6, shade(stone, 0.9), 0.05)
  }
  // the frieze with its inscription band, the bracketed cornice and the low attic
  rectOn(out, '-z', f, -XW + 0.2, XW - 0.2, 15.0, 15.8, shade(stone, 0.95), 0.2)
  slabOn(out, '-z', F - 0.3, -XW - 0.1, XW + 0.1, 15.5, 15.8, 0.5, stone)
  for (let x = -XW + 0.4; x < XW; x += 0.7) slabOn(out, '-z', F - 0.3, x - 0.12, x + 0.12, 15.8, 16.1, 0.65, shade(stone, 0.93))
  slabOn(out, '-z', F - 0.3, -XW - 0.4, XW + 0.4, 16.1, E, 0.95, stone)
  slabOn(out, '-z', F - 0.3, -XW - 0.1, XW + 0.1, E, ATTIC, 0.3, stone)
  for (const x of [-XW + 0.3, XW - 0.3, -7.1, 7.1]) block(out, x - 0.35, x + 0.35, F - 0.5, F + 0.1, E, ATTIC + 0.5, stone)

  // ---- the roof's front: the aedicule with its cartouche, the clock tower, the chimneys
  const cx = 0
  const af = F + 0.4
  block(out, cx - 3.2, cx + 3.2, af, af + 2.4, ATTIC, ATTIC + 3.0, stone)
  rectOn(out, '-z', af, cx - 1.2, cx + 1.2, ATTIC + 0.5, ATTIC + 2.6, shade(stone, 0.8), 0.06)
  prism(out, cx, af - 0.1, ATTIC + 0.9, ATTIC + 2.4, 0.7, 8, shade(stone, 1.06), FIXED, 0.3)
  slabOn(out, '-z', af, cx - 3.4, cx + 3.4, ATTIC + 3.0, ATTIC + 3.3, 0.2, stone)
  const tz = af + 1.4
  block(out, cx - 1.7, cx + 1.7, tz - 1.3, tz + 1.3, ATTIC + 3.3, ATTIC + 6.0, stone)
  clockOn(out, '-z', tz - 1.3, cx, ATTIC + 4.7, 0.95, p)
  slabOn(out, '-z', tz - 1.3, cx - 2.0, cx + 2.0, ATTIC + 6.0, ATTIC + 6.4, 0.3, stone, 1.3)
  roof(out, cx - 1.7, cx + 1.7, tz - 1.2, tz + 1.2, ATTIC + 6.4, 1.8, 1.6, 1.1, p.slate)
  prism(out, cx, tz, ATTIC + 8.2, ATTIC + 8.9, 0.05, 4, p.dark, FIXED, 0.04)
  for (const s of [-1, 1]) {
    stack(out, s * 6.5, F + 5, E + 2.5, E + RISE + 3.2, 0.7, 1.0, shade(stone, 0.92), p.lead)
    stack(out, s * 6.5, 5, E + 2.5, E + RISE + 3.2, 0.7, 1.0, shade(stone, 0.92), p.lead)
  }
}

/** a stepped stand-in for a pediment: three slabs narrowing upward (the kit's triangle shows dark gaps) */
function ped(out: MeshBuilder, plane: number, t0: number, t1: number, y0: number, h: number, d: number, c: [number, number, number]): void {
  const n = 3
  for (let i = 0; i < n; i++) {
    const m = ((t1 - t0) / 2) * (i / n) * 0.9
    slabOn(out, '-z', plane, t0 + m, t1 - m, y0 + (h * i) / n, y0 + (h * (i + 1)) / n, d, c)
  }
}
