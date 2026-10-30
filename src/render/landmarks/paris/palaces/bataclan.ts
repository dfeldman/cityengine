import type { MeshBuilder } from '../../../buildings.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, extrude, fitted, palette, pts, rectOn } from './common.ts'
import { discFront, EMIT, lettersOn, litOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM way 63648846's box turned to the boulevard (local −z faces bearing 41.6, the Boulevard Voltaire) */
const HX = 22.15
const HZ = 23.1
const RED = hex('#c7303a')
const WINE = hex('#7a1f33')
const YELLOW = hex('#e3c92f')
const TEAL = hex('#54b09c')
const CREAM = hex('#ece6d4')
const TILE = hex('#4a3a33')

const PLAN = pts([22.1, 11.9, 0.2, 23.1, -18, -14, 9.3, -14])

/**
 * Le Bataclan (Charles Duval, 1865, a "Chinese" café-concert; the pagoda's tiers survive, cut down, and the colours were
 * restored in 2006), 50 Boulevard Voltaire. A rider going by sees the most improbable front on the boulevards:
 *
 * - the painted storey, the width of the front, over the café: wine-red ARCHED windows and narrow square ones turn about
 *   behind an iron balcony, between yellow pilasters, in panels of turquoise and red chevrons; the grinning ROUNDELS;
 *   the fat red cornice over it all;
 * - on that the TIERS of the old pagoda, stepping in: a cream storey with yellow pilasters and the big red ring window,
 *   a flaring brown-tiled eave, the dormers in turquoise, and a top lantern framed in red under its hat;
 * - at the street, the café's yellow-striped awning and black fascia on the left; on the right the pale stone entrance
 *   with BATACLAN in red over its black doors.
 *
 * Plan is OSM's (way 63648846, the wedge running back to its point). Heights off photographs from the boulevard (Commons,
 * 2009–2019), scaled on the doors: balcony 5.6 m, cornice 14.8, the tiers to 30. The hall behind is plain.
 */
export function bataclan(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#ece6d4', '#585e62')
  extrude(out, [PLAN], p, { eaves: 13.5, bay: 9, storeys: [], rise: 1.2, inset: 1, dormers: false })
  const z = -23.2
  const X0 = -22
  const X1 = 4.8
  const cx = -8.6
  block(out, X0, X1, z, -14, 0, 14.6, CREAM)
  // ---- the painted storey
  const yA = 5.9
  const yB = 14
  rectOn(out, '-z', z, X0, X1, yA, yB, hex('#e7d9a6'), 0.03)
  const n = 9
  const step = (X1 - X0) / n
  for (let i = 0; i < n; i++) {
    const x = X0 + step * (i + 0.5)
    // the pilaster at the left of the bay
    rectOn(out, '-z', z, x - step / 2 + 0.05, x - step / 2 + 0.5, yA, yB, YELLOW, 0.06)
    if (i % 2 === 0) {
      // the wide bay: chevron panels round a red arched window
      rectOn(out, '-z', z, x - 1.08, x + 1.08, yA, yB - 0.1, TEAL, 0.04)
      chevrons(out, z, x, yB - 0.3, 1.0, 3)
      archOn(out, '-z', z, x, yA + 0.1, 2.3, 5.3, RED, 0.06)
      archOn(out, '-z', z, x, yA + 0.15, 1.82, 5, WINE, 0.08)
      rectOn(out, '-z', z, x - 0.03, x + 0.03, yA + 0.15, yA + 4.9, shade(WINE, 1.6), 0.09)
      rectOn(out, '-z', z, x - 0.9, x + 0.9, yA + 3.3, yA + 3.36, shade(WINE, 1.6), 0.09)
    } else {
      // the narrow bay: square window, red frame, the roundel over it
      rectOn(out, '-z', z, x - 0.72, x + 0.72, yA + 0.05, yA + 5.2, RED, 0.05)
      rectOn(out, '-z', z, x - 0.5, x + 0.5, yA + 0.3, yA + 4.95, WINE, 0.08)
      rectOn(out, '-z', z, x - 0.55, x + 0.55, yA + 5.2, yB - 0.1, TEAL, 0.04)
      roundel(out, z, x, yB - 1.35)
    }
  }
  // the balcony: iron, and its slab
  block(out, X0, X1, z - 0.7, z, yA - 0.2, yA, shade(CREAM, 1.03))
  block(out, X0, X1, z - 0.72, z - 0.68, yA + 1, yA + 1.08, p.dark)
  for (let x = X0; x <= X1; x += 0.5) block(out, x - 0.02, x + 0.02, z - 0.72, z - 0.68, yA, yA + 1.04, p.dark)
  // the fat red cornice, its brackets
  block(out, X0 - 0.1, X1 + 0.1, z - 0.35, -14, 14, 14.4, RED)
  block(out, X0 - 0.25, X1 + 0.25, z - 0.6, -14, 14.4, 14.85, shade(RED, 1.05))
  for (let x = X0 + 0.4; x < X1; x += 1.3) block(out, x - 0.1, x + 0.1, z - 0.3, z, 13.65, 14, RED)
  // ---- the tiers
  tiers(out, p, cx, z)
  // ---- the street: the café on the left, the entrance on the right
  const eX0 = -0.9
  rectOn(out, '-z', z, X0, eX0, 0, 3.1, shade(p.dark, 1.2), 0.05)
  for (let x = X0 + 0.8; x < eX0; x += 2) rectOn(out, '-z', z, x - 0.07, x + 0.07, 0, 3.1, shade(p.dark, 0.7), 0.08)
  // its black fascia and yellow letters; the striped awning
  block(out, X0, eX0, z - 0.2, z, 4.4, 5.7, hex('#17171a'))
  lettersOn(out, '-z', z - 0.2, (X0 + eX0) / 2, 4.75, 'BA-TA-CLAN CAFE', { h: 0.56, c: YELLOW, wide: 0.6, th: 0.08, gap: 0.09, tag: EMIT, d: 0.02 })
  const az0 = z - 2.3
  const stripes = 28
  for (let i = 0; i < stripes; i++) {
    const a = X0 + ((eX0 - X0) * i) / stripes
    const b = X0 + ((eX0 - X0) * (i + 1)) / stripes
    out.quad([[a, 3.5, az0], [b, 3.5, az0], [b, 4.4, z], [a, 4.4, z]], [0, 0.85, -0.5], [[0, 0], [1, 0], [1, 1], [0, 1]], i % 2 ? hex('#ece5c3') : hex('#ddb724'), FIXED)
  }
  rectOn(out, '-z', az0, X0, eX0, 3.1, 3.5, hex('#ddb724'), 0.01)
  // the entrance: pale stone, BATACLAN in red, black canopy and doors
  rectOn(out, '-z', z, eX0, X1, 0, 5.8, hex('#e0d8c2'), 0.03)
  rectOn(out, '-z', z, eX0 + 0.7, X1 - 0.7, 0, 2.9, hex('#201f22'), 0.06)
  litOn(out, '-z', z, eX0 + 1.5, X1 - 1.5, 0.3, 2.5, hex('#4f5a5c'), 0.07)
  block(out, eX0 + 0.5, X1 - 0.5, z - 0.9, z, 2.9, 3.25, hex('#1a1a1c'))
  lettersOn(out, '-z', z, (eX0 + X1) / 2, 3.95, 'BATACLAN', { h: 0.95, c: hex('#c5232a'), wide: 0.56, th: 0.16, gap: 0.11, tag: EMIT, d: 0.05 })
}

/** Rows of red chevrons in a bay's spandrel, downward from y. */
function chevrons(out: MeshBuilder, z: number, x: number, y: number, hw: number, rows: number): void {
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let r = 0; r < rows; r++) {
    const yy = y - r * 0.5
    for (const s of [-1, 1]) {
      out.quad([[x, yy - 0.34, z - 0.06], [x + s * hw, yy - 0.05, z - 0.06], [x + s * hw, yy + 0.08, z - 0.06], [x, yy - 0.2, z - 0.06]], [0, 0, -1], UV, RED, FIXED)
    }
  }
}

/** The grinning face in its ring: a wine rim, a pale disc, the teal of the mouth and the two eyes. */
function roundel(out: MeshBuilder, z: number, x: number, y: number): void {
  discFront(out, x, y, z - 0.07, 0.72, hex('#b22d3f'))
  discFront(out, x, y, z - 0.09, 0.55, hex('#ebe2cc'))
  discFront(out, x, y - 0.14, z - 0.1, 0.34, TEAL, FIXED, 10)
  for (const s of [-1, 1]) discFront(out, x + s * 0.18, y + 0.2, z - 0.11, 0.08, hex('#222'), FIXED, 6)
}

/** The old pagoda's tiers, on the middle of the front. */
function tiers(out: MeshBuilder, p: ReturnType<typeof palette>, cx: number, z: number): void {
  // the first: cream, yellow pilasters, the great ring window
  const hw1 = 9.4
  const d1 = z + 2
  const zb = -8
  block(out, cx - hw1, cx + hw1, d1, zb, 14.8, 20.2, CREAM)
  for (const t of [-8.8, -3.4, 3.4, 8.8]) rectOn(out, '-z', d1, cx + t - 0.34, cx + t + 0.34, 14.8, 20.2, YELLOW, 0.05)
  rectOn(out, '-z', d1, cx - hw1, cx + hw1, 19.8, 20.2, YELLOW, 0.06)
  for (const t of [-6.1, 6.1]) {
    rectOn(out, '-z', d1, cx + t - 1.15, cx + t + 1.15, 16, 18.6, hex('#ded8c3'), 0.03)
    rectOn(out, '-z', d1, cx + t - 1.0, cx + t + 1.0, 16.2, 18.4, WINE, 0.05)
    rectOn(out, '-z', d1, cx + t - 0.03, cx + t + 0.03, 16.2, 18.4, CREAM, 0.07)
  }
  discFront(out, cx, 17.4, d1 - 0.05, 2.25, RED, FIXED, 18)
  discFront(out, cx, 17.4, d1 - 0.08, 1.85, hex('#59636a'), FIXED, 18)
  rectOn(out, '-z', d1, cx - 1.05, cx + 1.05, 16.5, 18.3, WINE, 0.1)
  rectOn(out, '-z', d1, cx - 1.05, cx + 1.05, 17.5, 17.56, CREAM, 0.12)
  // the flaring eave of brown tile
  flare(out, cx - hw1, cx + hw1, d1, zb, 20.2, 1.8)
  // the second: dormers in teal and a central pediment
  const hw2 = 6.8
  const d2 = d1 + 3
  block(out, cx - hw2, cx + hw2, d2, zb - 1, 21.6, 24.6, CREAM)
  for (const t of [-5, -2.6, 2.6, 5]) {
    rectOn(out, '-z', d2, cx + t - 0.85, cx + t + 0.85, 22.2, 24.2, TEAL, 0.03)
    rectOn(out, '-z', d2, cx + t - 0.58, cx + t + 0.58, 22.5, 24, WINE, 0.05)
    block(out, cx + t - 1.1, cx + t + 1.1, d2 - 0.9, d2, 24.2, 24.5, TEAL)
  }
  const nx = 0
  out.quad([[cx - 1.7, 22.2, d2 - 0.1], [cx + 1.7, 22.2, d2 - 0.1], [cx + 1.7, 23.7, d2 - 0.1], [cx - 1.7, 23.7, d2 - 0.1]], [nx, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], CREAM, FIXED)
  out.quad([[cx - 2, 23.7, d2 - 0.1], [cx + 2, 23.7, d2 - 0.1], [cx, 24.9, d2 - 0.1], [cx, 24.9, d2 - 0.1]], [nx, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], TEAL, FIXED)
  discFront(out, cx, 23.2, d2 - 0.14, 0.44, RED)
  discFront(out, cx, 23.2, d2 - 0.16, 0.3, hex('#59636a'))
  // the third, a lantern framed in red with its hat
  const hw3 = 5.1
  const d3 = d2 + 1.2
  block(out, cx - hw3, cx + hw3, d3, zb - 2, 24.6, 28, CREAM)
  for (const t of [-3, 0, 3]) {
    rectOn(out, '-z', d3, cx + t - 0.72, cx + t + 0.72, 25.2, 27.3, hex('#59636a'), 0.04)
    rectOn(out, '-z', d3, cx + t - 0.03, cx + t + 0.03, 25.2, 27.3, CREAM, 0.06)
  }
  for (const t of [-1.6, 1.6]) rectOn(out, '-z', d3, cx + t - 0.3, cx + t + 0.3, 24.6, 28, RED, 0.05)
  rectOn(out, '-z', d3, cx - 1.9, cx + 1.9, 27.6, 28, RED, 0.06)
  flare(out, cx - hw3, cx + hw3, d3, zb - 2, 28, 1.3)
  block(out, cx - 0.5, cx + 0.5, d3 + 2, zb - 4, 29.3, 30.6, shade(CREAM, 0.9))
}

/** A flared roof over a rectangle: a wide shallow skirt, a steeper top. */
function flare(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, h: number): void {
  const e = 1.1
  const skirt = h * 0.35
  roof(out, x0 - e, x1 + e, z0 - e, z1 + e, y, skirt, e + 0.7, e + 0.7, TILE)
  roof(out, x0 + 0.7, x1 - 0.7, z0 + 0.7, z1 - 0.7, y + skirt, h - skirt, Math.min(2.4, (x1 - x0) / 2 - 1), Math.min(2.4, (z1 - z0) / 2 - 1), shade(TILE, 0.92))
}
