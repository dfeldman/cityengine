import type { MeshBuilder } from '../../../buildings.ts'
import { prism, strut, type Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, hipRoof, mansard, palette, pts, range, rectOn } from './common.ts'
import { bandRound, capRound, discFront, EMIT, lettersOn, lettersRound, litOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM ways 77806977, 77807519 and relation 1528981 together, boxed at 22° (local −z faces bearing 202, the boulevard) */
const HX = 39.25
const HZ = 42.3
const RED = hex('#b5261f')
const CRIMSON = hex('#a31a22')
const DEEP = hex('#7e1a1d')
const CREAM = hex('#e9dfca')
const WHITE: Rgb = [0.93, 0.92, 0.88]

/** The hall behind the fronts: way 77806977 north of its low front on the boulevard, in the model's frame. */
const HALL = pts([
  -39.2, -27.2, 7.8, -26.3, 8.2, 0, 25.2, -1.5, 31.9, -2.1, 35.8, 14.6, 39.2, 29.3, 3.9, 32.6, -15.4, 34.2, -15.1, 42.3, -36.1, 41.9, -36.4, 35.3,
  -30.3, 34.9, -32.4, 26.3, -36.9, 24.1, -37.4, 13.4, -38.3, -7.1,
])

/**
 * The Moulin Rouge (Joseph Oller and Charles Zidler, 1889; the hall rebuilt after the fire of 1915), 82 Boulevard de
 * Clichy, under the Butte by the Place Blanche. Not a large building and not a tall one: what a rider going along the
 * boulevard sees, left to right, is:
 *
 * - the LOW FRONT, 30 m of it (the old Élysée-Montmartre side, now La Machine): the dark glazed doors, the long red poster
 *   fascia over them, the flared cream hood ribbed like a shell, and along the top of the hood the red letters MOULIN
 *   ROUGE against the sky with a white rail behind them;
 * - on its roof, THE MILL: a red drum with its row of little pointed windows, a flared dark-red cap, and the four red
 *   lattice sails on their disc, widening to the tips, outlined in neon after dark;
 * - hard against it on the right, THE ENTRANCE: the bent band round the front of a tall cream house, pale between its
 *   crimson rims with MOULIN ROUGE in tall thin letters running round it, the black mouth under it between fluted red
 *   piers, and on top the little striped kiosk of the BAL, with its scalloped red-and-white tent;
 * - the lower cream house next door with the red Billetterie awning.
 *
 * The hall behind is a plain shed under the neighbours' party walls; the mill reads against them and the sky.
 *
 * Positions off OSM (osmium, 2026-10-30): the low front is way 77806977's stem, x −22…8 at z −41.5; the sliver 77807519
 * and relation 1528981 are the two houses. Heights and everything above the street off photographs from the boulevard
 * (Commons, 2010–2024, and Mapillary), scaled on the doorways and cars: hood at 6.4, mill 6.8 to its cap at 15.7, hub
 * at 15, sail reach 6.4, band 4.8–7.2, kiosk to 12.4. The hall's roof is not seen in any photograph; its 11 m eaves are a
 * guess, kept below the sightline over the mill.
 */
export function moulinRouge(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e9dfca', '#585e62')
  const plain = palette('#cfc6b5', '#5d6367')
  // ---- the hall behind: a plain shed
  extrude(out, [HALL], plain, { eaves: 11, bay: 9, storeys: [], rise: 3, inset: 2.2, dormers: false })
  lowFront(out, p)
  mill(out, 0.6, -34.5, 6.8)
  houses(out, p)
  entrance(out, p)
}

/** The low front on the boulevard: doors, poster fascia, the hood, the letters and rail on top. */
function lowFront(out: MeshBuilder, p: ReturnType<typeof palette>): void {
  const x0 = -22.1
  const x1 = 8
  const z = -41.5
  block(out, x0, x1, z, -26.3, 0, 6.8, shade(CREAM, 0.96))
  block(out, x0, x1, z + 0.4, -26.6, 6.8, 6.9, p.lead)                                                     // the terrace
  // the glazed doors and the dark band over them
  rectOn(out, '-z', z, x0 + 0.5, x1 - 0.2, 0, 2.7, p.dark, 0.06)
  for (let x = x0 + 1; x < x1; x += 2.6) rectOn(out, '-z', z, x - 0.08, x + 0.08, 0, 2.7, shade(p.lead, 1.5), 0.09)
  // the poster fascia: red from end to end, its big pale panels, the name of the Machine at the west end
  rectOn(out, '-z', z, x0 + 0.2, x1 - 0.1, 2.7, 5.1, RED, 0.07)
  rectOn(out, '-z', z, x0 + 0.2, x1 - 0.1, 2.68, 2.82, DEEP, 0.1)
  for (const [a, b, y0, y1, c] of [[-9, -5.5, 3.1, 4.9, '#e8c49a'], [-3.8, -1.2, 3.0, 4.8, '#3d1216'], [0.2, 3.6, 3.2, 5.0, '#e8a982'], [4.6, 6.8, 3.0, 4.7, '#3d1216']] as const) {
    rectOn(out, '-z', z, a, b, y0, y1, hex(c), 0.09)
  }
  lettersOn(out, '-z', z, -15.5, 3.35, 'MACHINE', { h: 1.05, c: hex('#f4e4c4'), wide: 0.7, th: 0.17, d: 0.1 })
  // the hood: flared forward and up from the fascia's head, cream, ribbed; drawn in two falls so that it bends
  const H0 = 5.1
  const H1 = 5.8
  const H2 = 6.45
  const Z1 = z - 0.45
  const Z2 = z - 1.7
  const hood = (ya: number, za: number, yb: number, zb: number, c: Rgb): void => {
    const l = Math.hypot(yb - ya, zb - za) || 1
    // the hood's underside is what the street sees
    out.quad([[x0, ya, za], [x1, ya, za], [x1, yb, zb], [x0, yb, zb]], [0, -(za - zb) / l, -(yb - ya) / l], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
  hood(H0, z - 0.02, H1, Z1, shade(CREAM, 0.93))
  hood(H1, Z1, H2, Z2, CREAM)
  for (let x = x0 + 0.6; x < x1; x += 1.3) {
    strut(out, [x, H0, z - 0.06], [x, H1, Z1 - 0.04], 0.09, 0.04, shade(CREAM, 0.62), FIXED, false)
    strut(out, [x, H1, Z1 - 0.04], [x, H2, Z2 - 0.04], 0.09, 0.04, shade(CREAM, 0.62), FIXED, false)
  }
  // its lip, and the top of it back to the wall
  block(out, x0, x1, Z2 - 0.08, Z2 + 0.08, H2 - 0.05, H2 + 0.2, CREAM)
  block(out, x0, x1, Z2, z + 0.4, H2 + 0.15, H2 + 0.25, shade(p.lead, 1.3))
  // the white rail along the terrace's edge, behind the letters
  const ry = 6.7
  for (let x = x0 + 0.5; x <= x1; x += 2) strut(out, [x, ry, z - 0.3], [x, ry + 1.05, z - 0.3], 0.05, 0.05, WHITE, FIXED, false)
  for (const y of [ry + 1.05, ry + 0.55]) strut(out, [x0 + 0.5, y, z - 0.3], [x1 - 0.1, y, z - 0.3], 0.05, 0.05, WHITE, FIXED, false)
  // the name along the hood's lip: red tube letters standing free against the rail and the sky
  lettersOn(out, '-z', Z2 - 0.1, -7, H2 + 0.22, 'MOULIN ROUGE', { h: 1.45, c: RED, wide: 0.5, th: 0.17, gap: 0.2, tag: EMIT, d: 0.02, both: true })
}

/**
 * The mill on its roof: `x`, `z` the drum's axis, standing on `y`. Red drum, a row of pointed windows, the flared cap,
 * the disc and the four sails — each a lattice widening to its tip, the rails in neon.
 */
function mill(out: MeshBuilder, x: number, z: number, y: number): void {
  const yTop = 13.4
  prism(out, x, z, y, yTop, 3.15, 16, RED, FIXED, 2.75, false)
  prism(out, x, z, yTop - 0.15, yTop, 2.82, 16, shade(RED, 0.8), FIXED, 2.82, false)
  // the row of little windows round it, pointed, in their pale frames, and a second row of little lozenges above
  const n = 10
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2
    const r0 = 3.15 - (0.4 * (9.6 - y)) / (yTop - y) - 0.02
    const windowAt = (rr: number, y0: number, w: number, h: number, c: Rgb): void => {
      const sx = Math.sin(a)
      const sz = -Math.cos(a)
      const tx = Math.cos(a)
      const tz = Math.sin(a)
      const P = (u: number, v: number): [number, number, number] => [x + sx * rr + tx * u, y0 + v, z + sz * rr + tz * u]
      out.quad([P(-w / 2, 0), P(w / 2, 0), P(w / 2, h * 0.68), P(-w / 2, h * 0.68)], [sx, 0, sz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
      out.quad([P(-w / 2, h * 0.68), P(w / 2, h * 0.68), P(0, h), P(0, h)], [sx, 0, sz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
    }
    windowAt(r0 + 0.1, 9.0, 1.05, 1.75, hex('#e6d9c8'))
    windowAt(r0 + 0.13, 9.1, 0.8, 1.45, hex('#39343a'))
    if (i % 2 === 0) windowAt(r0 - 0.08, 11.6, 0.7, 0.75, hex('#39343a'))
  }
  // the cap: its soffit, then a bell of three falls
  prism(out, x, z, yTop - 0.05, yTop, 2.8, 16, DEEP, FIXED, 4.05, false)
  prism(out, x, z, yTop, yTop + 0.75, 4.05, 16, shade(RED, 0.82), FIXED, 3.35, false)
  prism(out, x, z, yTop + 0.75, yTop + 1.6, 3.35, 16, shade(RED, 0.74), FIXED, 2.1, false)
  prism(out, x, z, yTop + 1.6, yTop + 2.2, 2.1, 16, shade(RED, 0.68), FIXED, 0.5)
  // the little dormer in the cap, to the street
  block(out, x - 0.42, x + 0.42, z - 3.1, z - 2.0, yTop + 0.75, yTop + 1.5, shade(RED, 0.74))
  rectOn(out, '-z', z - 3.1, x - 0.26, x + 0.26, yTop + 0.88, yTop + 1.38, hex('#39343a'), 0.03)
  // the windshaft and the disc
  const hubY = 15.1
  const face = z - 4.15
  strut(out, [x, hubY, z - 2], [x, hubY, face], 0.5, 0.5, DEEP, FIXED, false)
  discFront(out, x, hubY, face - 0.02, 0.85, DEEP)
  discFront(out, x, hubY, face - 0.04, 0.68, RED, EMIT)
  discFront(out, x, hubY, face - 0.06, 0.46, DEEP)
  discFront(out, x, hubY, face - 0.08, 0.26, RED, EMIT)
  // the sails: a little off the cross, as they stand most days. Each from the disc out to 6.4 m, narrow at the root and
  // wide at the tip, rails and tip in neon, square bays with their crosses
  const turn = (11 * Math.PI) / 180
  for (let k = 0; k < 4; k++) {
    const a = turn + (k * Math.PI) / 2
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    const Q = (along: number, across: number, dz = 0): [number, number, number] =>
      [x + ca * along - sa * across, hubY + sa * along + ca * across, face - 0.1 + dz]
    const reach = 6.4
    const root = 0.75
    const half = (s: number): number => 0.18 + (0.72 * (s - root)) / (reach - root)
    strut(out, Q(root * 0.5, 0), Q(reach, 0), 0.09, 0.09, DEEP, FIXED, false)                                  // the whip
    for (const side of [-1, 1]) strut(out, Q(root, side * half(root)), Q(reach, side * half(reach)), 0.11, 0.08, RED, EMIT, false)
    strut(out, Q(reach, -half(reach)), Q(reach, half(reach)), 0.11, 0.08, RED, EMIT, false)
    const bays = 5
    for (let b = 0; b < bays; b++) {
      const s0 = root + ((reach - root) * b) / bays
      const s1 = root + ((reach - root) * (b + 1)) / bays
      strut(out, Q(s0, -half(s0)), Q(s0, half(s0)), 0.07, 0.05, RED, FIXED, false)
      strut(out, Q(s0, -half(s0)), Q(s1, half(s1)), 0.05, 0.04, CRIMSON, FIXED, false)
      strut(out, Q(s0, half(s0)), Q(s1, -half(s1)), 0.05, 0.04, CRIMSON, FIXED, false)
    }
  }
}

/** The two cream houses the entrance stands in front of, and what lies behind them to the hall. */
function houses(out: MeshBuilder, p: ReturnType<typeof palette>): void {
  const z = -41
  // the tall one, three bays, the entrance across its foot: stone, balconied, an attic behind a long balcony, its chimneys
  block(out, 8, 17, z, -26, 0, 19.6, p.stone)
  for (const x of [9.9, 12.5, 15.1]) {
    for (const [y, h] of [[7.6, 2.0], [10.6, 2.0], [13.6, 2.0], [16.5, 1.9]] as const) {
      rectOn(out, '-z', z, x - 0.72, x + 0.72, y - 0.15, y + h + 0.15, p.trim, 0.05)
      rectOn(out, '-z', z, x - 0.55, x + 0.55, y, y + h, p.glass, 0.08)
      rectOn(out, '-z', z, x - 0.7, x + 0.7, y + 0.02, y + 0.1, p.dark, 0.2)                                    // the iron balconette: rail, bars
      rectOn(out, '-z', z, x - 0.7, x + 0.7, y + 0.46, y + 0.54, p.dark, 0.2)
      for (let u = -0.6; u < 0.7; u += 0.3) rectOn(out, '-z', z, x + u - 0.02, x + u + 0.02, y + 0.05, y + 0.5, p.dark, 0.2)
    }
  }
  for (const y of [7.2, 10.3, 16.2]) block(out, 7.9, 17.1, z - 0.15, z + 0.2, y - 0.1, y + 0.1, p.trim)
  block(out, 7.8, 17.2, z - 0.35, z + 0.2, 19.2, 19.7, p.trim)
  block(out, 8.2, 16.8, z + 0.8, -26.4, 19.6, 22.3, shade(p.stone, 0.97))                                      // the attic, set back
  for (const x of [9.9, 12.5, 15.1]) rectOn(out, '-z', z + 0.8, x - 0.55, x + 0.55, 19.9, 21.8, p.glass, 0.06)
  block(out, 7.9, 17.1, z - 0.3, z + 0.8, 19.7, 19.78, p.lead)
  block(out, 7.9, 17.1, z - 0.32, z - 0.28, 20.5, 20.75, p.dark)                                               // its long iron rail
  for (let x = 8; x <= 17.05; x += 1.0) block(out, x - 0.025, x + 0.025, z - 0.32, z - 0.28, 19.75, 20.55, p.dark)
  block(out, 7.9, 17.1, z + 0.6, -26.2, 22.3, 22.5, p.trim)
  for (const x of [8.5, 16.5]) block(out, x - 0.5, x + 0.5, z + 0.8, -26.2, 22.3, 24.6, shade(p.stone, 0.92))  // the party-wall chimneys
  // the lower one, two bays, a mansard: the Billetterie's house
  const q = palette('#e6dcc8', '#6c7276')
  range(out, 17, 22.6, z + 0.35, -25.5, q, { eaves: 10.8, bay: 2.75, win: 1.15, faces: ['-z'], courses: true, cornice: 0.25,
    storeys: [{ y: 4.0, h: 2.1, sill: 0.3 }, { y: 7.2, h: 2.1, sill: 0.3 }] })
  mansard(out, 17, 22.6, z + 0.35, -25.5, 10.8, 2.0, 0.6, q.slate, 1.1)
  // the awning and fascia of the Billetterie
  const fz = z + 0.35
  rectOn(out, '-z', fz, 17.2, 22.5, 0, 2.5, p.dark, 0.05)
  block(out, 17.2, 22.5, fz - 0.15, fz, 2.5, 3.1, CRIMSON)
  lettersOn(out, '-z', fz - 0.15, 19.85, 2.62, 'BILLETTERIE', { h: 0.36, c: WHITE, wide: 0.62, th: 0.055, d: 0.02 })
  out.quad([[17.2, 3.1, fz - 0.15], [22.5, 3.1, fz - 0.15], [22.5, 4.0, fz], [17.2, 4.0, fz]], [0, 0.6, -0.8], [[0, 0], [1, 0], [1, 1], [0, 1]], RED, FIXED)
  // behind them, the rest of relation 1528981 to the hall: a plain block under a mansard
  range(out, 7.8, 25.4, -26, -0.4, q, { eaves: 15, bay: 3.2, win: 1.2, faces: ['+x'], courses: false, cornice: 0.2,
    storeys: [{ y: 4, h: 2 }, { y: 7.4, h: 2 }, { y: 10.8, h: 2 }] })
  hipRoof(out, 7.8, 25.4, -26, -0.4, 15, 2.2, q.slate, 0.1)
}

/** The entrance: the band bent round the house's foot, the black mouth and fluted piers, the striped kiosk of the BAL. */
function entrance(out: MeshBuilder, p: ReturnType<typeof palette>): void {
  const cx = 12.5
  const z = -41
  const rx = 4.45
  const rz = 2.6
  const end = Math.PI / 2
  const yb = 4.85
  const yt = 7.2
  // the mouth: black, the lobby's lights in it, the neon script of the show in pale gold
  block(out, 8.1, 16.9, z - 1.0, z, 0, yb, p.dark)
  lettersOn(out, '-z', z - 1.0, cx, 2.5, 'FEERIE', { h: 1.05, c: hex('#ecd98f'), wide: 0.62, th: 0.07, gap: 0.16, tag: EMIT, d: 0.03 })
  litOn(out, '-z', z - 1.0, cx - 2.8, cx + 2.8, 1.95, 2.05, hex('#f3f0e6'), 0.03)
  rectOn(out, '-z', z - 1.0, cx - 2.2, cx + 2.2, 0, 1.75, hex('#5b2a22'), 0.03)                                // the doors, the lobby's warmth in them
  for (const x of [-1.1, 0, 1.1]) rectOn(out, '-z', z - 1.0, cx + x - 0.04, cx + x + 0.04, 0, 1.75, p.dark, 0.05)
  // the fluted piers each side, standing out to the band's front
  for (const s of [-1, 1]) {
    const x = cx + s * 3.7
    block(out, x - 0.75, x + 0.75, z - 1.9, z, 0, yb, CRIMSON)
    for (const t of [-0.5, 0, 0.5]) rectOn(out, '-z', z - 1.9, x + t - 0.08, x + t + 0.08, 0, yb, shade(CRIMSON, 0.6), 0.03)
    block(out, x - s * 0.75 - 0.06, x - s * 0.75 + 0.06, z - 1.9, z - 1.0, 0, yb, shade(CRIMSON, 0.6))
  }
  // the head of the mouth, stepped
  rectOn(out, '-z', z - 1.92, cx - 3, cx + 3, 4.35, yb, DEEP, 0.02)
  // the band: pale between its crimson rims, the letters round it in tall thin tube
  const pale = hex('#cfc6b4')
  bandRound(out, cx, z, rx, rz, -end, end, yb + 0.22, yt - 0.24, pale, { segs: 14 })
  bandRound(out, cx, z, rx + 0.07, rz + 0.07, -end, end, yb - 0.1, yb + 0.25, CRIMSON, { segs: 14 })
  bandRound(out, cx, z, rx + 0.07, rz + 0.07, -end, end, yt - 0.27, yt, CRIMSON, { segs: 14 })
  bandRound(out, cx, z, rx + 0.09, rz + 0.09, -end, end, yb + 0.26, yb + 0.31, RED, { segs: 14, tag: EMIT })
  bandRound(out, cx, z, rx + 0.09, rz + 0.09, -end, end, yt - 0.33, yt - 0.28, RED, { segs: 14, tag: EMIT })
  capRound(out, cx, z, rx + 0.07, rz + 0.07, -end, end, yb - 0.1, shade(p.dark, 1.2), false, 14)
  capRound(out, cx, z, rx + 0.07, rz + 0.07, -end, end, yt, shade(CRIMSON, 0.8), true, 14)
  lettersRound(out, cx, z, rx, rz, 0, yb + 0.36, 'MOULIN ROUGE', { h: 1.55, c: CRIMSON, wide: 0.27, th: 0.12, gap: 0.14, tag: EMIT, d: 0.1 })
  // ---- the kiosk of the BAL on top of the band
  kiosk(out, cx, z - 1.5, yt)
}

/** The little kiosk: a scalloped collar, the letters of BAL stacked on a red drum, a striped tent, a finial. */
function kiosk(out: MeshBuilder, x: number, z: number, y: number): void {
  const n = 12
  const R = 1.3
  // the collar: alternate red and white, and DU on it
  prism(out, x, z, y, y + 0.1, R + 0.15, n, DEEP, FIXED, R + 0.15)
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    bandRound(out, x, z, R + 0.02, R + 0.02, a0, a1, y + 0.1, y + 0.55, i % 2 ? WHITE : RED, { segs: 1 })
  }
  // the drum and its stacked letters, to the street and to each side
  prism(out, x, z, y + 0.1, y + 3.3, 0.5, 8, DEEP, FIXED, 0.5, false)
  for (const at of [0, -1.2, 1.2]) {
    for (const [ch, yy] of [['B', 2.32], ['A', 1.42], ['L', 0.52]] as const) {
      lettersRound(out, x, z, 1.28, 1.28, at, y + yy, ch, { h: 0.84, c: RED, wide: 1.05, th: 0.2, tag: EMIT, d: 0, both: true })
    }
  }
  // posts holding the tent, the tent's own collar of scallops, the striped cone
  for (let i = 0; i < 6; i++) {
    const a = ((i + 0.5) / 6) * Math.PI * 2 + 0.26
    strut(out, [x + Math.sin(a) * 1.25, y + 0.5, z + Math.cos(a) * 1.25], [x + Math.sin(a) * 1.25, y + 3.35, z + Math.cos(a) * 1.25], 0.07, 0.07, DEEP, FIXED, false)
  }
  const yt = y + 3.3
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    const c = i % 2 ? WHITE : RED
    bandRound(out, x, z, R + 0.2, R + 0.2, a0, a1, yt - 0.32, yt, c, { segs: 1 })
    const P = (a: number, r: number, yy: number): [number, number, number] => [x + Math.sin(a) * r, yy, z - Math.cos(a) * r]
    const m = (a0 + a1) / 2
    out.quad([P(a0, R + 0.2, yt), P(a1, R + 0.2, yt), P(m, 0.05, yt + 1.25), P(m, 0.05, yt + 1.25)], [Math.sin(m) * 0.7, 0.7, -Math.cos(m) * 0.7], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
  prism(out, x, z, yt + 1.2, yt + 1.75, 0.05, 6, RED, FIXED, 0.02, false)
}
