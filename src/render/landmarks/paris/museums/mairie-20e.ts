import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import { sign } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archOn, clockOn, extrude, fitted, palette, pedimentOn, pts, rectOn, slabOn } from '../palaces/common.ts'
import { bands, rustic, stack } from './civic.ts'

const FIXED = 0
/** the design footprint: OSM relation 1103270's box (local −z faces bearing 241.5, the Place Gambetta) */
const HX = 44.0
const HZ = 29.9

/** OSM's outline and its two courts in this frame (osmium, 2026-11-05): a chevron, the pavilion at the apex, wings splayed back */
const OUTER = pts([9.7, -29.8, 0.4, -29.8, -9.2, -29.9, -9.2, -27.4, -12.6, -27.4, -19.8, -16.4, -17.3, -14.8, -34.4, 12.6, -37.0, 11.0, -44.0, 22.4,
  -42.0, 26.0, -39.8, 29.9, -26.6, 29.9, -26.6, 29.7, -11.8, 29.7, -11.8, 29.9, 11.9, 29.9, 12.0, 29.7, 26.7, 29.6, 26.7, 29.9, 40.0, 29.9, 44.0, 22.6,
  40.5, 16.9, 37.2, 11.3, 34.6, 13.0, 25.2, -2.2, 17.5, -14.7, 20.0, -16.3, 16.0, -22.6, 14.2, -25.6, 13.2, -27.2, 13.1, -27.4, 9.7, -27.5])
const COURTS = [
  pts([8.8, -9.6, 22.3, 12.1, 19.6, 16.7, 9.1, 16.7, 9.2, 5.2, 2.1, 5.2, 2.1, 2.7, 2.0, -7.7, 3.6, -7.8, 3.7, -9.7]),
  pts([-3.6, -9.7, -3.5, -7.9, -1.9, -7.8, -1.9, 5.1, -8.9, 5.1, -9.0, 16.7, -19.2, 16.8, -22.2, 11.8, -9.0, -9.7]),
]

/** heights read off the Commons photograph "Mairie du 20e arrondissement de Paris.JPG" (pavilion 19 m ≈ 275 px), checked against the IGN lidar (2026-11-05) */
const E = 13.4 // the wings' stone cornice
const RISE = 4.2 // the wings' slate mansard (lidar 17–18)
const ARCH = 6.2 // the ground arcade
const G = 7 // the first floor's sill line
const PE = 15.5 // the pavilion's entablature
const ATTIC = 17.4 // the attic with the inscription
const MANS = 4 // the pavilion's mansard (lidar 23–24)
const P0 = -9.2
const P1 = 9.7
const PF = -29.8 // the pavilion's front
const PB = -12 // its back
const BAY = 5.4 // window spacing on the pavilion
const TOWER = 5.8 // the clock tower's width
const CLOCK_Y = 19
const BELFRY = 22.6

/**
 * La Mairie du 20e (Salleron, 1867–77) on the Place Gambetta. A chevron in plan: the pavilion at the apex faces the place,
 * the two wings splay back along the Avenue Gambetta and the Rue Belgrand. What the rider sees from the place:
 *
 * - the stone pavilion: three arches below, three tall windows between paired pilasters, the entablature with
 *   "RÉPUBLIQUE FRANÇAISE", the attic with "MAIRIE DU 20e ARRt", a slate mansard;
 * - the clock tower up the mansard's front: the clock, an open belfry between corner colonnettes, a slate dome and flagstaff;
 * - the stone wings, two storeys under a slate mansard with dormers.
 */
export function mairie20e(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
  sign(out, { type: 'flat', text: 'MAIRIE DU 20ᵉ ARRᵗ', h: 0.5, face: 'roman', colour: [0.28, 0.24, 0.18], tracking: 0.12, lit: 'none', w: 8 },
    { x: ((P0 + P1) / 2) * fit.hx / HX, y: ATTIC - 0.9, z: (PF - 0.12) * fit.hz / HZ, heading: Math.PI })
}

function draw(out: MeshBuilder): void {
  const p = palette('#d8cdb4', '#4a4f57')
  const stone = hex('#d8cdb4')
  p.trim = shade(stone, 1.04)
  p.deep = shade(stone, 0.86)
  extrude(out, [OUTER, ...COURTS], p, { eaves: E, bay: 3.6, win: 1.3, rise: RISE, inset: 3.2, dormers: true,
    storeys: [{ y: 0, h: 3.0, sill: 1.6 }, { y: 4.6, h: 3.4, sill: 1.1 }, { y: 8.8, h: 3.0, sill: 1.1 }] })
  rustic(out, OUTER, 0.2, 4.4, 0.7, stone, 5)
  bands(out, OUTER, [4.5], 0.4, 0.18, stone, 5)
  bands(out, OUTER, [8.7], 0.3, 0.14, stone, 5)
  bands(out, OUTER, [E - 0.6], 0.6, 0.28, stone, 5)
  for (const s of [-1, 1]) {
    stack(out, s * 30, 22, E + 1, E + RISE + 1.8, 0.5, 0.9, shade(stone, 0.88), p.lead)
    stack(out, s * 18, -12, E + 1, E + RISE + 1.6, 0.5, 0.9, shade(stone, 0.88), p.lead)
  }

  // ---- the stone pavilion, standing proud of the wings
  const cx = (P0 + P1) / 2
  const pf = PF
  block(out, P0, P1, pf, PB, 0, ATTIC, stone)
  slabOn(out, '-z', pf, P0 - 0.1, P1 + 0.1, 0, 0.6, 0.12, shade(stone, 0.85))
  for (let y = 0.6; y < ARCH - 0.5; y += 0.7) rectOn(out, '-z', pf, P0, P1, y, y + 0.2, shade(stone, 0.93), 0.03)
  // three arches
  for (const s of [-1, 0, 1]) archOn(out, '-z', pf, cx + s * BAY, 0.6, 3.1, ARCH - 0.6, p.dark, 0.08)
  slabOn(out, '-z', pf, P0 - 0.1, P1 + 0.1, ARCH, G + 0.3, 0.3, stone)
  slabOn(out, '-z', pf, P0 - 0.2, P1 + 0.2, G + 0.2, G + 0.5, 0.45, stone)
  // first floor: three windows between paired pilasters
  for (const s of [-1, 0, 1]) {
    const x = cx + s * BAY
    rectOn(out, '-z', pf, x - 1.6, x + 1.6, G + 1.2, G + 6.4, shade(stone, 1.05), 0.06)
    rectOn(out, '-z', pf, x - 1.3, x + 1.3, G + 1.4, G + 5.2, p.glass, 0.1)
    rectOn(out, '-z', pf, x - 0.05, x + 0.05, G + 1.4, G + 5.2, stone, 0.13)
    slabOn(out, '-z', pf, x - 1.5, x + 1.5, G + 5.2, G + 5.5, 0.22, stone)
    slabOn(out, '-z', pf, x - 1.5, x + 1.5, G + 1.2, G + 1.5, 0.3, stone)
  }
  for (const dx of [-8.6, -2.7, 2.7, 8.6]) for (const o of [-0.4, 0.4]) slabOn(out, '-z', pf, cx + dx + o - 0.22, cx + dx + o + 0.22, G + 0.5, PE - 0.9, 0.22, stone)
  // the frieze and the entablature, the attic, its cornice and the vases
  rectOn(out, '-z', pf, P0 + 0.5, P1 - 0.5, PE - 0.9, PE - 0.1, shade(stone, 0.94), 0.05)
  slabOn(out, '-z', pf, P0 - 0.4, P1 + 0.4, PE - 0.1, PE + 0.5, 0.7, stone)
  rectOn(out, '-z', pf, cx - 6.5, cx + 6.5, PE + 0.7, ATTIC - 0.9, shade(stone, 0.95), 0.04)
  slabOn(out, '-z', pf, P0 - 0.3, P1 + 0.3, ATTIC - 0.5, ATTIC, 0.5, stone)
  for (const s of [-1, 1]) prism(out, cx + s * (P1 - P0) / 2 - s * 0.5, pf + 0.4, ATTIC, ATTIC + 1.2, 0.3, 8, stone, FIXED, 0.18)

  // ---- the pavilion's slate mansard and the tower up its front
  roof(out, P0 + 0.1, P1 - 0.1, pf + 0.2, PB + 0.3, ATTIC, MANS, 3.2, 3.2, p.slate)
  const tz = pf + 1.6
  block(out, cx - TOWER / 2, cx + TOWER / 2, tz, tz + TOWER, ATTIC - 0.3, BELFRY, stone)
  slabOn(out, '-z', tz, cx - TOWER / 2 - 0.2, cx + TOWER / 2 + 0.2, ATTIC + 0.5, ATTIC + 0.8, 0.2, stone)
  clockOn(out, '-z', tz, cx, CLOCK_Y, 0.8, p)
  pedimentOn(out, '-z', tz, cx - TOWER / 2, cx + TOWER / 2, CLOCK_Y + 1.2, 0.8, 0.2, stone)
  for (const s of [-1, 1]) block(out, cx + s * TOWER / 2 - 0.4, cx + s * TOWER / 2 + 0.4, tz - 0.5, tz + 0.3, ATTIC, CLOCK_Y + 1.6, stone)
  // the open belfry
  const bz = tz + TOWER / 2
  slabOn(out, '-z', tz, cx - TOWER / 2 - 0.2, cx + TOWER / 2 + 0.2, BELFRY, BELFRY + 0.4, 0.25, stone)
  const by0 = BELFRY + 0.4
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    block(out, cx + sx * 1.9 - 0.3, cx + sx * 1.9 + 0.3, bz + sz * 1.9 - 0.3, bz + sz * 1.9 + 0.3, by0, by0 + 3.6, stone)
  }
  prism(out, cx, bz, by0, by0 + 3.4, 0.7, 8, p.dark, FIXED, 0.7)
  prism(out, cx, bz, by0 + 3.6, by0 + 3.9, 2.9, 8, stone, FIXED, 2.9)
  prism(out, cx, bz, by0 + 3.9, by0 + 6.0, 2.3, 8, p.slate, FIXED, 0.5)
  prism(out, cx, bz, by0 + 6.0, by0 + 8.0, 0.08, 4, p.dark, FIXED, 0.05)
}
