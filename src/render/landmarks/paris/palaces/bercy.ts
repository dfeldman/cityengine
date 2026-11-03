import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { beam, block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, rectOn, type F } from './common.ts'

const FIXED = 0
/** the design footprint: OSM way 217512456's box (336 × 31.6 m), its river foot left out of it (the manifest note) */
const HX = 168
const HZ = 15.8

/*
 * THE PLAN, in OSM's metres about the entry's point: x along the slab (+x to the Rue de Bercy, bearing 50.5),
 * z across it (+z north-west, to the ministry's gardens; −z the Boulevard de Bercy and the Seine's quai).
 * Measured 2026-11-03 from IGN's LiDAR HD surface model and orthophoto and OSM's parts (docs/landmarks/MODEL-BERCY.md).
 */
const RIVER = -194.4
/** the river tower: a near-solid block the full height, on round piers at the water (its foot 26 m past the footprint) */
const END: [number, number] = [-194.4, -178]
/** the span over the Quai de la Rapée: the roads cross at x −170…−122 */
const SPAN1: [number, number] = [-178, -121]
const PYLON1: [number, number] = [-121, -104]
/** the long middle, on the ground */
const MID: [number, number] = [-104, 107]
const PYLON2: [number, number] = [107, 112]
/** the span over the Rue de Bercy: the street at x 133…156 */
const SPAN2: [number, number] = [112, 166]
/** the far pylon on the street's far pavement: beyond OSM's outline (which stops at 168) but in the lidar and the ortho */
const PYLON3: [number, number] = [166, 179]
/** the slab is 21.5 m wide (OSM: z −15.5…+6), not the 31.6 m of its box: the box also holds the wedge pavilion */
const Z0 = -15.5
const Z1 = 6
/** the spans' bodies are narrower, set back 2 m behind the pylons' faces */
const S0 = -13
const S1 = 4
/** the roof: lidar 71.5 m NGF over a 34 m quai; the two set-back glazed storeys from 30; the arcade storey to 6.5 */
const TOP = 38
const ATTIC = 30
const BASE = 6.5
const STOREY = 3.9
const BAY = 3.9
/** the spans' underside over the roads (the photographs: ~13 m, not OSM's 20) and their roof deck under the trusses */
const UNDER = 13
const DECK = 33.5

/**
 * The Ministère de l'Économie et des Finances at Bercy, the Bâtiment Colbert (Paul Chemetov and Borja Huidobro,
 * 1982–88): a 360 m slab of pale concrete laid across the Quai de la Rapée and the Rue de Bercy like a viaduct and
 * striding out into the Seine. What a rider sees, from the Pont de Bercy, the quai or the boulevard:
 *
 * - the RIVER TOWER: a near-solid pale block the slab's full height standing on short round piers right at the water,
 *   a boat dock between them, a tall dark glazed slot up each flank and a glass box at the top of its river face;
 * - the two SPANS, 13 m clear over the roads, their bodies set back between massive PYLONS (each with its vertical
 *   glazed slot), and over each span an open TRUSS storey — two white lattice girders along the deck's edges, X-braced
 *   across the top — in place of the attic;
 * - the long FLANKS: a square grid of pale piers and floor bands over dark glass, an open arcade of square piers along
 *   the boulevard's foot, and under the thin white fascia two set-back storeys of dark glass;
 * - the HELIPAD: a railed saucer on raking struts over the roof by the quai pylon, overhanging the boulevard side;
 * - the WEDGE PAVILION on the garden side at the main entrance, a glazed block 27 m high.
 *
 * OSM: the outline way 217512456 and its parts (the spans 227664483 / 227751355 from 20 m, the pavilion 1227184965,
 * the helipad's circle 1227184966). Local frame: the slab along x, the river end at −x; −z faces bearing 140.5
 * (south-east, the boulevard). The garden-side office bridges (OSM, min_height 13) are drawn by the kit, not here.
 */
export function bercyMinistry(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const stone: Rgb = hex('#d6cdba')
  const stoneD: Rgb = shade(stone, 0.9)
  const soffit: Rgb = shade(stone, 0.5)
  const white: Rgb = hex('#ebe7de')
  const glass: Rgb = [0.12, 0.15, 0.18]
  const mullion: Rgb = [0.78, 0.78, 0.76]

  // ---- the long middle: body, set-back attic, fascia
  block(out, MID[0], MID[1], Z0, Z1, -1, ATTIC, stone)
  block(out, MID[0], MID[1], Z0 + 1.5, Z1 - 1.5, ATTIC, TOP, glass)
  block(out, MID[0], MID[1], Z0 - 0.2, Z1 + 0.2, TOP, TOP + 0.8, white)
  for (const [f, plane, inner] of [['-z', Z0, Z0 + 1.5], ['+z', Z1, Z1 - 1.5]] as [F, number, number][]) {
    // the storeys: dark glass behind a grid of pale piers and floor bands, one bay a storey, square
    rectOn(out, f, plane, MID[0], MID[1], BASE, ATTIC, glass, 0.03)
    for (let x = MID[0] + BAY / 2; x < MID[1]; x += BAY) rectOn(out, f, plane, x - 0.45, x + 0.45, BASE - 0.5, ATTIC, stone, 0.35)
    for (let y = BASE; y <= ATTIC + 0.01; y += STOREY) rectOn(out, f, plane, MID[0], MID[1], y - 0.45, y + 0.45, stone, 0.3)
    // the attic's mullions
    rectOn(out, f, inner, MID[0], MID[1], ATTIC + 3.9, ATTIC + 4.3, mullion, 0.06)
    for (let x = MID[0] + BAY / 2; x < MID[1]; x += BAY) rectOn(out, f, inner, x - 0.08, x + 0.08, ATTIC, TOP, mullion, 0.06)
  }
  // the arcade along the boulevard's foot: a dark gallery behind square piers, open where the service road goes through
  rectOn(out, '-z', Z0, MID[0], MID[1], -1, BASE, glass, 0.02)
  for (let x = MID[0] + BAY / 2; x < MID[1]; x += BAY) {
    if (x > -58 && x < -49) continue
    block(out, x - 0.6, x + 0.6, Z0 - 0.7, Z0 + 0.6, -1, BASE, stone)
  }
  rectOn(out, '-z', Z0 - 0.7, MID[0], MID[1], BASE - 0.5, BASE + 0.4, stone, 0.05)
  // the garden side's base: glass between piers, down to the sunken gardens
  rectOn(out, '+z', Z1, MID[0], MID[1], -1, BASE, glass, 0.03)
  for (let x = MID[0] + BAY / 2; x < MID[1]; x += BAY) rectOn(out, '+z', Z1, x - 0.45, x + 0.45, -1, BASE, stone, 0.3)
  // the roof's plant along the middle
  for (let x = -86; x < 100; x += 24) block(out, x - 6, x + 6, -9, -2, TOP, TOP + 2.6, stoneD)

  // ---- the pylons: pale towers a storey proud of the roof, a tall dark slot up each flank
  const pylon = (x0: number, x1: number, y0: number, head = (x0 + x1) / 2): void => {
    block(out, x0, x1, Z0 - 0.4, Z1 + 0.4, y0, TOP + 1.5, stone)
    const w = Math.min(5, x1 - x0 - 4)
    const xm = (x0 + x1) / 2
    for (const [f, plane] of [['-z', Z0 - 0.4], ['+z', Z1 + 0.4]] as [F, number][]) {
      rectOn(out, f, plane, xm - w / 2, xm + w / 2, 4, TOP + 0.8, glass, 0.05)
      for (let y = 4 + STOREY; y < TOP; y += STOREY) rectOn(out, f, plane, xm - w / 2, xm + w / 2, y - 0.12, y + 0.12, mullion, 0.08)
    }
    block(out, head - 3, head + 3, -6, 0, TOP + 1.5, TOP + 3.5, stoneD)                // the stair head
  }
  pylon(PYLON1[0], PYLON1[1], -1, PYLON1[0] + 4)                                      // its head clear of the helipad's saucer
  pylon(PYLON2[0], PYLON2[1], -1)
  pylon(PYLON3[0], PYLON3[1], -1)
  // the far pylon's street face
  rectOn(out, '+x', PYLON3[1], -7, -2.5, 4, TOP + 0.8, glass, 0.05)

  // ---- the river tower: the block's underside 5 m over the water (the game's Seine is 2 m under the quai), on four
  // round piers; a boat dock between them
  pylon(END[0], END[1], 2.5)
  for (const x of [-190.5, -182]) for (const z of [-9.5, 0]) prism(out, x, z, -10, 2.5, 2.3, 12, stoneD)
  // its river face: two rows of square windows, and the glass box at the top rising past the roof
  for (let z = Z0 + 1.6; z < Z1 - 2; z += 3.2) for (const y of [12, 17]) rectOn(out, '-x', RIVER, z, z + 2.2, y, y + 2.6, glass, 0.05)
  block(out, RIVER - 1, RIVER + 0.3, -8.5, -1, 24, TOP + 3, glass)
  for (let y = 24; y <= TOP + 3; y += STOREY) rectOn(out, '-x', RIVER - 1, -8.5, -1, y - 0.12, y + 0.12, mullion, 0.06)
  for (const z of [-8.5, -1]) rectOn(out, '-x', RIVER - 1, z - 0.15, z + 0.15, 24, TOP + 3, mullion, 0.06)

  // ---- the spans: a set-back body over the road, then the open truss storey along the deck's edges
  const span = (x0: number, x1: number): void => {
    block(out, x0, x1, S0, S1, UNDER + 0.12, DECK, stone)
    block(out, x0, x1, S0, S1, UNDER, UNDER + 0.12, soffit)
    for (const [f, plane] of [['-z', S0], ['+z', S1]] as [F, number][]) {
      rectOn(out, f, plane, x0, x1, UNDER + 0.12, 18, glass, 0.03)                        // the lowest storey, dark
      rectOn(out, f, plane, x0, x1, 18, 26, glass, 0.03)                                  // two storeys in the pale grid
      for (let x = x0 + BAY / 2; x < x1; x += BAY) rectOn(out, f, plane, x - 0.45, x + 0.45, 18, 26, stone, 0.35)
      for (const y of [18, 22, 26]) rectOn(out, f, plane, x0, x1, y - 0.45, y + 0.45, stone, 0.3)
      rectOn(out, f, plane, x0, x1, 26, DECK, glass, 0.03)                                // the upper storeys, dark
      rectOn(out, f, plane, x0, x1, 29.6, 29.9, mullion, 0.06)
      for (let x = x0 + BAY / 4; x < x1; x += BAY / 2) rectOn(out, f, plane, x - 0.07, x + 0.07, 26, DECK, mullion, 0.06)
    }
    // the trusses: top chord at the fascia's height, bottom chord on the deck, posts and an X in every panel
    const n = Math.max(3, Math.round((x1 - x0) / 11.5))
    const yt = TOP + 0.4
    const yb = DECK + 0.4
    const edges = [S0 + 0.7, S1 - 0.7]
    for (const z of edges) {
      beam(out, [x0, yt, z], [x1, yt, z], 0.5, white)
      beam(out, [x0, yb, z], [x1, yb, z], 0.4, white)
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n
        beam(out, [x, yb, z], [x, yt, z], 0.3, white)
        if (k < n) {
          const xn = x0 + ((x1 - x0) * (k + 1)) / n
          beam(out, [x, yb, z], [xn, yt, z], 0.2, white)
          beam(out, [x, yt, z], [xn, yb, z], 0.2, white)
        }
      }
    }
    // the X-bracing across the top, between the girders
    for (let k = 0; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n
      beam(out, [x, yt, edges[0]], [x, yt, edges[1]], 0.3, white)
      if (k < n) {
        const xn = x0 + ((x1 - x0) * (k + 1)) / n
        beam(out, [x, yt, edges[0]], [xn, yt, edges[1]], 0.18, white)
        beam(out, [x, yt, edges[1]], [xn, yt, edges[0]], 0.18, white)
      }
    }
  }
  span(SPAN1[0], SPAN1[1])
  span(SPAN2[0], SPAN2[1])

  // ---- the wedge pavilion on the garden side, at the main entrance (OSM 1227184965, 30 m): glass in a white frame
  {
    const ring: [number, number][] = [[-89.4, 5.7], [-65.3, 5.8], [-67.7, 15.8], [-90.6, 10.3]]
    const h = 27
    for (let i = 0; i < ring.length; i++) {
      const [ax, az] = ring[i]
      const [bx, bz] = ring[(i + 1) % ring.length]
      const l = Math.hypot(bx - ax, bz - az)
      out.quad([[ax, 0, az], [bx, 0, bz], [bx, h, bz], [ax, h, az]], [(bz - az) / l, 0, -(bx - ax) / l], [[0, 0], [1, 0], [1, 1], [0, 1]], glass, FIXED)
      beam(out, [ax, 0, az], [ax, h + 0.3, az], 0.35, white)
      beam(out, [ax, h + 0.3, az], [bx, h + 0.3, bz], 0.35, white)
      for (let y = 4; y < h; y += STOREY) beam(out, [ax, y, az], [bx, y, bz], 0.12, mullion)
    }
    const [a, b, c, d] = ring
    out.quad([[a[0], h, a[1]], [d[0], h, d[1]], [c[0], h, c[1]], [b[0], h, b[1]]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], white, FIXED)
  }

  /*
   * THE HELIPAD (owner, 2026-10-30, from street view: "it also has a helipad!"): the round deck over the roof by the
   * quai pylon, on its ring of raking struts, its rim railed — seen from the quai as the dark curved underside of a
   * saucer overhanging the boulevard side. OSM's circle 1227184966 (centre −98.5, −4.7; r 12.5); the lidar puts the
   * pad 5.5 m over the roof. The pad white with its H and its circle.
   */
  {
    const hx = -98.5
    const hz = -4.7
    const deck = TOP + 5
    const R = 13
    const steel: Rgb = [0.55, 0.57, 0.58]
    prism(out, hx, hz, deck - 1.4, deck, R, 32, shade(stone, 0.55))                     // the deck's dark underside
    prism(out, hx, hz, deck, deck + 0.15, R - 0.4, 32, [0.86, 0.86, 0.84])              // the pad
    prism(out, hx, hz, TOP, deck - 1.4, 3.2, 12, stoneD)                               // the core it stands on
    for (let k = 0; k < 12; k++) {                                                     // raking struts out to the rim
      const a = (k / 12) * Math.PI * 2
      beam(out, [hx + Math.cos(a) * 3, TOP + 0.6, hz + Math.sin(a) * 3], [hx + Math.cos(a) * (R - 1), deck - 1.5, hz + Math.sin(a) * (R - 1)], 0.2, steel)
    }
    for (let k = 0; k < 36; k++) {                                                     // the rim's railing posts
      const a = (k / 36) * Math.PI * 2
      box(out, hx + Math.cos(a) * (R - 0.2), deck + 0.7, hz + Math.sin(a) * (R - 0.2), 0.05, 0.55, 0.05, steel, FIXED)
    }
    const mark: Rgb = [0.18, 0.2, 0.22]
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2
      box(out, hx + Math.cos(a) * 8.5, deck + 0.17, hz + Math.sin(a) * 8.5, 0.45, 0.02, 0.45, mark, FIXED)
    }
    for (const dz of [-2.4, 2.4]) box(out, hx, deck + 0.17, hz + dz, 3, 0.02, 0.4, mark, FIXED)
    box(out, hx, deck + 0.17, hz, 0.4, 0.02, 2.4, mark, FIXED)
  }
}
