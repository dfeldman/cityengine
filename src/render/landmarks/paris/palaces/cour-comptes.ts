import type { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, extrude, fitted, mansard, palette, pedimentOn, pts, rectOn, segmentOn, slabOn, type Pal } from './common.ts'
import { lettersOn } from './showfront.ts'

/** the design footprint: OSM relation 542460's box turned to the Rue Cambon (local −z faces bearing 119) */
const HX = 29.5
const HZ = 42.4
const FRONT = -41.6

/** The relation's outer ring and its two courts, in the model's frame. */
const OUTER = pts([
  -25, 40.5, -24.8, 37.2, -29.5, 36.9, -25.8, -41.2, 25.8, -41.1, 27.1, -40, 27.1, -32.2, 26, -32.1, 25.4, -15.2, 29.5, -14.6, 29.2, -10.6, 25.1, -10.9, 24.6, 1.2, 20.2, 1, 19.5, 10.4,
  24.2, 10.9, 22.6, 40.9, -1.3, 40.6, -1.3, 42.4, -10.2, 42.3, -9.7, 29.6, -18.1, 29.1, -18.7, 40.5,
])
const COURTS = [
  pts([-18, 26.1, -9.6, 26.6, -8.9, 17.1, 23.3, 19.1, 23.6, 13.7, 8.6, 12.7, 8.7, 10.3, -17.1, 8.6]),
  pts([-12.5, -1.6, 9, -0.5, 13.8, -3.9, 14.6, -25.2, -14.9, -25.8, -16.5, -6]),
]
const EAVES = 18.8

/**
 * Le Palais Cambon, the Cour des comptes (Constant Moyaux, finished 1912), 13 Rue Cambon: a court's house dressed to be looked up
 * at from a narrow street. What a rider sees on the Rue Cambon:
 *
 * - the great PORTAL: the round-headed carriage arch with its iron gate, in a banded frontispiece between two pairs of huge
 *   drum-coursed columns, carved trophies either side, COUR DES COMPTES on the tablet over the arch;
 * - the first floor's long iron BALCONY over it, the flags, tall windows under alternating pediments;
 * - the rusticated ground floor running the width of the street, an attic storey with its pairs of consoles, and a slate
 *   mansard with its dormers.
 *
 * Plan is OSM's, with both courts. The relief and the bands from Commons "Cour des comptes Paris entrée", "Cambon" and the
 * BnF photographs of the Rue Cambon front; heights scaled off the gate and the people under it: portal to 9.6 m, balcony
 * 9.9, cornice 18.8, the mansard's top 23.6. The Rue du Mont-Thabor's side is the same stone with plain windows.
 */
export function courComptes(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d9cfba', '#4d5459')
  extrude(out, [OUTER, ...COURTS], p, { eaves: EAVES, bay: 3.8, win: 1.6, rise: 4, inset: 2, dormers: true,
    storeys: [{ y: 0.3, h: 3 }, { y: 6, h: 2.9 }, { y: 10.5, h: 3 }, { y: 15, h: 1.9 }] })
  const X0 = -25.8
  const X1 = 25.8
  // ---- the Rue Cambon front: a stone slab over the extruded wall
  block(out, X0, X1, FRONT, -38, 0, EAVES, p.stone)
  // the rusticated ground floor
  for (let y = 0.6; y < 8.8; y += 0.6) rectOn(out, '-z', FRONT, X0, X1, y - 0.05, y + 0.05, p.deep, 0.03)
  for (const x of [-22.4, -18.4, -14.4, -10.4, 10.4, 14.4, 18.4, 22.4]) {
    rectOn(out, '-z', FRONT, x - 1.2, x + 1.2, 1.1, 7, shade(p.stone, 1.03), 0.05)
    archOn(out, '-z', FRONT, x, 1.4, 1.9, 5.3, p.glass, 0.07)
    rectOn(out, '-z', FRONT, x - 0.95, x + 0.95, 1.4, 2.4, p.dark, 0.09)
    // a console over the head
    slabOn(out, '-z', FRONT, x - 0.4, x + 0.4, 6.7, 7.5, 0.25, p.trim)
  }
  slabOn(out, '-z', FRONT, X0 - 0.2, X1 + 0.2, 8.8, 9.75, 0.42, p.trim)
  // ---- the storeys above, tall windows under alternating pediments
  const storey = [[10.6, 3.2], [15, 2]] as const
  for (const x of [-23.2, -19.8, -16.4, -13, 13, 16.4, 19.8, 23.2]) {
    window(out, x, storey[0][0], storey[0][1], p)
    rectOn(out, '-z', FRONT, x - 1.14, x + 1.14, storey[1][0] - 0.12, storey[1][0] + storey[1][1] + 0.12, p.trim, 0.04)
    rectOn(out, '-z', FRONT, x - 0.9, x + 0.9, storey[1][0], storey[1][0] + storey[1][1], p.glass, 0.07)
    const i = Math.round((x + 23.2) / 3.4)
    if (i % 2 === 0) pedimentOn(out, '-z', FRONT, x - 1.3, x + 1.3, 14.04, 0.62, 0.3, p.trim)
    else segmentOn(out, '-z', FRONT, x, 14.06, 2.6, 0.55, p.trim, 0.3)
    slabOn(out, '-z', FRONT, x - 1.3, x + 1.3, 13.92, 14.06, 0.33, p.trim)
  }
  slabOn(out, '-z', FRONT, X0, X1, 14.56, 14.74, 0.14, p.trim)
  // ---- the frontispiece
  frontispiece(out, p)
  // ---- the cornice and the mansard on the street range (the dormers are the extruded plan's)
  block(out, X0 - 0.3, X1 + 0.3, FRONT - 0.45, -38, EAVES - 0.8, EAVES, p.trim)
  for (let x = X0 + 0.5; x < X1; x += 1.9) slabOn(out, '-z', FRONT - 0.2, x - 0.14, x + 0.14, EAVES - 1.25, EAVES - 0.8, 0.22, p.trim)
  mansard(out, X0 + 0.1, X1 - 0.1, FRONT + 0.2, -32, EAVES, 3.8, 1, p.slate, 1.5)
}

function window(out: MeshBuilder, x: number, y: number, h: number, p: Pal): void {
  rectOn(out, '-z', FRONT, x - 1.14, x + 1.14, y - 0.14, y + h + 0.12, p.trim, 0.04)
  rectOn(out, '-z', FRONT, x - 0.92, x + 0.92, y, y + h, p.glass, 0.07)
  rectOn(out, '-z', FRONT, x - 0.05, x + 0.05, y, y + h, p.trim, 0.09)
}

function frontispiece(out: MeshBuilder, p: Pal): void {
  const iron: Rgb = [0.1, 0.1, 0.11]
  const gold = p.gold
  const Z = FRONT - 0.7
  // it stands forward, the whole height
  block(out, -9.4, 9.4, Z, FRONT, 0, EAVES, shade(p.stone, 1.02))
  for (let y = 0.6; y < 8.8; y += 0.6) rectOn(out, '-z', Z, -9.4, 9.4, y - 0.05, y + 0.05, p.deep, 0.03)
  // the arch: the moulded surround, the void, the gate
  archOn(out, '-z', Z, 0, 0, 7.4, 8.8, p.trim, 0.04)
  archOn(out, '-z', Z, 0, 0, 6.4, 8.3, p.glass, 0.06)
  for (let t = -2.9; t <= 2.95; t += 0.46) rectOn(out, '-z', Z, t - 0.05, t + 0.05, 0, 4.6 + 3.2 * Math.sqrt(Math.max(0, 1 - (t / 3.2) ** 2)), iron, 0.08)
  rectOn(out, '-z', Z, -3.2, 3.2, 4.4, 4.72, iron, 0.09)
  rectOn(out, '-z', Z, -3.2, 3.2, 2.2, 2.32, gold, 0.09)
  // the trophies carved in the wall beside the arch
  for (const s of [-1, 1]) {
    for (const [dy, w] of [[2.6, 1.2], [3.9, 1.8], [5.1, 1.5], [6.2, 0.9]] as const) rectOn(out, '-z', Z, s * 5.15 - w / 2, s * 5.15 + w / 2, dy, dy + 0.9, shade(p.stone, 0.88), 0.05)
    // the two pairs of huge drum-coursed columns
    for (const x of [s * 6.8, s * 8.5]) {
      const cz = Z - 0.55
      prism(out, x, cz, 0.9, 8.2, 0.68, 12, p.stone, 0)
      block(out, x - 0.82, x + 0.82, cz - 0.82, cz + 0.82, 0, 0.9, shade(p.stone, 0.92))
      block(out, x - 0.86, x + 0.86, cz - 0.86, cz + 0.86, 8.2, 8.8, p.trim)
      for (let y = 1.5; y < 8; y += 1.05) prism(out, x, cz, y - 0.2, y + 0.2, 0.74, 12, shade(p.stone, 1.04), 0)
    }
  }
  // the entablature over the columns, the tablet, the name
  slabOn(out, '-z', Z, -9.9, 9.9, 8.8, 9.75, 1.3, p.trim)
  rectOn(out, '-z', Z - 1.3, -5.1, 5.1, 8.9, 9.65, hex('#59554d'), 0.02)
  lettersOn(out, '-z', Z - 1.32, 0, 9.03, 'COUR DES COMPTES', { h: 0.5, c: hex('#e6d9b2'), wide: 0.62, th: 0.07, gap: 0.12, d: 0.02 })
  // ---- the balcony across it, with its iron, and the flags
  slabOn(out, '-z', Z, -9.6, 9.6, 9.75, 10, 1.5, p.trim)
  rectOn(out, '-z', Z - 1.45, -9.6, 9.6, 10, 11, iron, 0.02)
  for (let t = -9.4; t < 9.5; t += 0.42) rectOn(out, '-z', Z - 1.45, t - 0.12, t + 0.12, 10.1, 10.9, shade(p.stone, 0.72), 0.03)
  // three tall windows under their pediments, the middle the broadest
  for (const [x, w, h] of [[-5.6, 2.3, 3.4], [0, 2.8, 3.6], [5.6, 2.3, 3.4]] as const) {
    rectOn(out, '-z', Z, x - w / 2 - 0.35, x + w / 2 + 0.35, 10.1, 10.2 + h + 0.2, p.trim, 0.04)
    rectOn(out, '-z', Z, x - w / 2, x + w / 2, 10.2, 10.2 + h, p.glass, 0.07)
    rectOn(out, '-z', Z, x - 0.05, x + 0.05, 10.2, 10.2 + h, p.trim, 0.09)
    slabOn(out, '-z', Z, x - w / 2 - 0.5, x + w / 2 + 0.5, 13.8, 14.05, 0.4, p.trim)
    pedimentOn(out, '-z', Z, x - w / 2 - 0.5, x + w / 2 + 0.5, 14.05, 0.72, 0.38, p.trim)
    rectOn(out, '-z', Z, x - w / 2 + 0.1, x + w / 2 - 0.1, 15.5, 17.2, p.trim, 0.04)
    rectOn(out, '-z', Z, x - w / 2 + 0.26, x + w / 2 - 0.26, 15.65, 17.05, p.glass, 0.07)
  }
  block(out, -9.9, 9.9, Z - 0.5, FRONT, EAVES - 0.9, EAVES, p.trim)
  // the flags, from the balcony's middle
  for (const s of [-1, 1]) {
    const x = s * 1.8
    prism(out, x, Z - 1.1, 10.9, 14.2, 0.04, 5, iron, 0)
    for (const [i, c] of [[0, '#23408e'], [1, '#f2f2f2'], [2, '#d0232b']] as const) {
      const x0 = x + s * (0.1 + i * 0.5)
      block(out, Math.min(x0, x0 + s * 0.5), Math.max(x0, x0 + s * 0.5), Z - 1.14, Z - 1.08, 12.6, 14.1, hex(c))
    }
  }
}
