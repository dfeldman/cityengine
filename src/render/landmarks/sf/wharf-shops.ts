/**
 * FISHERMAN'S WHARF, the shops (BUGS.md #290 g–m; owner 2026-10-17: "the feel of Fisherman's Wharf, with the unique
 * buildings, restaurants, stores, and decorations… It does NOT need to be a perfect copy"). The frontages a rider passes
 * on Jefferson Street and the pieces of the Wharf that are known by one look — a candy store's pink marquee, a row of
 * black boxes with green roofs, the art-deco head of a pier shed — each built from a photograph named in its note.
 *
 * Buildings claimed from OSM are given a numeric `front` in the manifest, so their street face is the ring's edge
 * facing local −z (`edgeFacing(ring, 180)`); point models are placed with `rotateDeg` and face local +z.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, EMIT, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { sign, type SignSpec } from '../signage.ts'
import { tower, towerRing, faceBand } from '../tower.ts'
import { edgeAt, edgeFacing, boxAlong, offsetRing } from '../parts.ts'
import { tube, ellipse, lozenge, type V3 } from './wharf-carnival.ts'

type P2 = { x: number; z: number }
type Edge = ReturnType<typeof edgeAt>
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const BT = surfaceTag('brick'), CT = surfaceTag('concrete'), MT = surfaceTag('metal'), GT = surfaceTag('glass')
const WT = surfaceTag('clapboard'), ST = surfaceTag('stucco'), AT = surfaceTag('ashlar'), FT = surfaceTag('foliage')
const WARM: Rgb = [1.0, 0.86, 0.55], WHITE: Rgb = [0.96, 0.96, 0.94], DARKGL: Rgb = [0.16, 0.19, 0.22]

/** a point `u` along edge `e` from its first corner, `y` up, `o` out from the wall (negative: inside) */
const on = (e: Edge, u: number, y: number, o = 0): V3 => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]

/** a box squared to edge `e`: centred `u` along it and `o` out, from `y0` up `h`, `w` along the wall and `d` across it */
function slab(out: MeshBuilder, e: Edge, u: number, o: number, y0: number, w: number, h: number, d: number, c: Rgb, tag: number): void {
  const p = on(e, u, y0 + h / 2, o)
  boxAlong(out, p[0], p[1], p[2], w / 2, h / 2, d / 2, e.heading, c, tag)
}

/** a flat sign on edge `e`, its centre `u` along it, `y` up, `o` out */
function signAt(out: MeshBuilder, e: Edge, u: number, y: number, o: number, spec: SignSpec): void {
  const p = on(e, u, y, o)
  sign(out, spec, { x: p[0], y, z: p[2], heading: e.heading })
}

/** a row of lit bulbs from p0 to p1 about `step` apart */
function bulbs(out: MeshBuilder, p0: V3, p1: V3, step: number, s = 0.06, c: Rgb = WARM): void {
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2])
  const n = Math.max(1, Math.round(L / step))
  for (let k = 0; k <= n; k++) {
    const t = k / n
    box(out, p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t, s, s, s, c, EMIT)
  }
}

/** the part of a ring at least `d` behind edge `e`'s line (Sutherland–Hodgman against one half-plane) */
function clipBehind(ring: P2[], e: Edge, d: number): P2[] {
  const f = (p: P2): number => (p.x - e.a.x) * e.nx + (p.z - e.a.z) * e.nz + d
  const outR: P2[] = []
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length]
    const fp = f(p), fq = f(q)
    if (fp <= 0) outR.push(p)
    if ((fp <= 0) !== (fq <= 0)) {
      const t = fp / (fp - fq)
      outR.push({ x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t })
    }
  }
  return outR
}

/** the edge of the ring facing most squarely local −z (no preference for a long edge, unlike `edgeFacing`), ≥ `min` long */
function facingFront(ring: P2[], min = 8): number {
  let best = 0, score = -Infinity
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < min) continue
    if (-e.nz > score) { score = -e.nz; best = i }
  }
  return best
}

/**
 * The street front as ONE straight edge: the ring's edge facing local −z, run out over every corner that lies on or near
 * its line — OSM draws a long frontage as several pieces with little jogs, and the shops must be laid along all of it.
 */
function frontEdge(ring: P2[], index = edgeFacing(ring, 180)): Edge {
  const e0 = edgeAt(ring, index)
  let u0 = 0, u1 = e0.L, o = 0
  for (const p of ring) {
    const d = (p.x - e0.a.x) * e0.nx + (p.z - e0.a.z) * e0.nz
    if (d < -2.5) continue
    const u = (p.x - e0.a.x) * e0.tx + (p.z - e0.a.z) * e0.tz
    u0 = Math.min(u0, u); u1 = Math.max(u1, u); o = Math.max(o, d)
  }
  const a = { x: e0.a.x + e0.tx * u0 + e0.nx * o, z: e0.a.z + e0.tz * u0 + e0.nz * o }
  const b = { x: e0.a.x + e0.tx * u1 + e0.nx * o, z: e0.a.z + e0.tz * u1 + e0.nz * o }
  return { ...e0, a, b, L: u1 - u0, mid: { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 } }
}

/** a window of glass with a steel grid over it, on edge `e` (an industrial sash): `cols` × `rows` panes */
function gridWindow(out: MeshBuilder, e: Edge, u: number, y0: number, w: number, h: number, cols: number, rows: number, frame: Rgb, o = 0.04): void {
  slab(out, e, u, o, y0, w, h, 0.04, DARKGL, GT)
  for (let c = 0; c <= cols; c++) slab(out, e, u - w / 2 + (w * c) / cols, o + 0.04, y0, 0.07, h, 0.05, frame, MT)
  for (let r = 0; r <= rows; r++) slab(out, e, u, o + 0.04, y0 + (h * r) / rows - 0.035, w, 0.07, 0.05, frame, MT)
}

/**
 * THE JEFFERSON STREET ATTRACTIONS BLOCK, 105–145 Jefferson (way/288473107): the old Wax Museum building — a three-storey
 * front of buff brick with tall round-arched windows, a cream cornice and iron balconettes — and its shops. In the middle
 * IT'SUGAR: a tall arched window over the door, a curved magenta marquee with IT'SUGAR in white capitals across the foot
 * of the arch, a lit magenta box sign WORLD'S LARGEST CANDY DEPARTMENT STORE over the door and clusters of yellow bulbs
 * on the piers (Mapillary 1879093319539210). West of it the red MADAME TUSSAUDS fascia in yellow script under rows of
 * bulbs, with a vertical red banner (Commons "Madame Tussauds San Francisco"). East of it the San Francisco Chocolate
 * Store, a chocolate-brown fascia in gold over a striped awning (its OSM node; no photograph of the shopfront itself).
 * `front` 351 in the manifest: the Jefferson face is the ring's edge facing local −z.
 */
export function jeffersonAttractions(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.84, 0.72, 0.5], CREAM: Rgb = [0.93, 0.88, 0.76], SILL: Rgb = [0.8, 0.74, 0.62]
  const MAG: Rgb = [0.78, 0.1, 0.42], MAGD: Rgb = [0.55, 0.06, 0.3], RED: Rgb = [0.66, 0.08, 0.1], YEL: Rgb = [0.98, 0.82, 0.25]
  const CHOC: Rgb = [0.3, 0.17, 0.1], GOLD: Rgb = [0.9, 0.72, 0.32], IRON: Rgb = [0.16, 0.16, 0.17]
  const H = fit.height > 9 && fit.height < 16 ? fit.height : 12
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 4.4, face: { kind: 'punched', wall: SILL, glass: DARKGL, pitch: 4.6, floor: 4.4, solid: 0.3, material: 'ashlar' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BUFF, glass: [0.24, 0.28, 0.33], pitch: 4.2, floor: (H - 4.4) / 2, solid: 0.45, arched: true, material: 'brick' }, cornice: { depth: 0.45, height: 0.6, colour: CREAM } }],
    cornices: [{ at: 4.4, depth: 0.3, height: 0.35, colour: CREAM }],
    crown: { kind: 'parapet', height: 1.0, colour: CREAM, material: 'ashlar' },
  })
  const ring = towerRing(fit)
  const e = frontEdge(ring)
  const L = e.L
  const ui = L * 0.55, AW = 4.0
  // the iron balconettes along the top floor, the length of the front
  for (let u = 2; u < L - 2; u += 4.2) {
    if (Math.abs(u - ui) < AW + 3.6) continue
    slab(out, e, u, 0.35, H - 3.6, 2.4, 0.08, 0.7, IRON, MT)
    for (let k = 0; k <= 6; k++) slab(out, e, u - 1.2 + k * 0.4, 0.68, H - 3.52, 0.04, 0.9, 0.04, IRON, MT)
    slab(out, e, u, 0.68, H - 2.66, 2.4, 0.06, 0.06, IRON, MT)
  }
  /*
   * The three shops. The ring runs anticlockwise, so along the front edge u runs from the east corner to the west one:
   * the Chocolate Store at the east end, It'Sugar a little west of the middle, Madame Tussauds the west third.
   */
  const ue = Math.min(L * 0.36, 26)
  // -- IT'SUGAR: the arch, its surround, the curved marquee, the box sign, the bulb clusters
  const AR = AW, AY = 5.2                                              // the arch's radius and springing
  const piers = [ui - AW - 1.2, ui + AW + 1.2]
  for (const pu of piers) {
    slab(out, e, pu, 0.3, 0, 2.0, H - 0.4, 0.6, CREAM, AT)                       // the stone piers either side
    // a cluster of yellow bulbs on a dark frame on each pier, high up
    slab(out, e, pu, 0.66, H - 2.4, 1.3, 1.0, 0.12, IRON, MT)
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const p = on(e, pu - 0.45 + c * 0.3, H - 2.15 + r * 0.28, 0.76); box(out, p[0], p[1], p[2], 0.1, 0.1, 0.06, YEL, EMIT) }
  }
  // the arch: dark glass filling a round head over a tall opening, mullions radiating, a stone ring round it
  slab(out, e, ui, 0.08, 0, AW * 2, AY, 0.1, DARKGL, GT)
  const SEG = 14
  for (let k = 0; k < SEG; k++) {
    const a0 = (k / SEG) * Math.PI, a1 = ((k + 1) / SEG) * Math.PI
    const P = (a: number, r: number, o: number): V3 => on(e, ui + Math.cos(a) * r, AY + Math.sin(a) * r, o)
    out.quad([P(a0, 0, 0.14), P(a0, AR, 0.14), P(a1, AR, 0.14), P(a1, 0, 0.14)], [e.nx, 0, e.nz], UVQ, [0.2, 0.27, 0.36], GT)
    out.quad([P(a0, AR, 0.15), P(a0, AR + 0.7, 0.15), P(a1, AR + 0.7, 0.15), P(a1, AR, 0.15)], [e.nx, 0, e.nz], UVQ, CREAM, AT)
    if (k % 2 === 0) { const m = P(a0, AR / 2, 0.17); boxAlong(out, m[0], m[1], m[2], 0.04, 0.04, 0.03, e.heading, IRON, MT); tube(out, P(a0, 0.1, 0.17), P(a0, AR, 0.17), 0.04, 4, IRON, MT) }
  }
  for (let c = -2; c <= 2; c++) slab(out, e, ui + c * (AW / 2.5), 0.16, 4.6, 0.07, AY - 4.6, 0.05, IRON, MT)
  // the marquee: a magenta band curved out over the street across the arch's foot, bulbs along its edges
  const MY = 4.6, MD = 1.4, MW = AW + 1.6
  const MS = 12
  for (let k = 0; k < MS; k++) {
    const t0 = k / MS, t1 = (k + 1) / MS
    const bow = (t: number): number => 0.35 + MD * Math.sin(t * Math.PI)       // how far out the band stands
    const lift = (t: number): number => 0.9 * Math.sin(t * Math.PI)            // and it rises in the middle, like the arch
    const u = (t: number): number => ui - MW + 2 * MW * t
    const Q = (t: number, dy: number): V3 => on(e, u(t), MY + lift(t) + dy, bow(t))
    out.quad([Q(t0, 0), Q(t1, 0), Q(t1, 1.25), Q(t0, 1.25)], [e.nx, 0, e.nz], UVQ, MAG, MT)
    out.quad([Q(t0, 1.25), Q(t1, 1.25), on(e, u(t1), MY + lift(t1) + 1.25, 0.2), on(e, u(t0), MY + lift(t0) + 1.25, 0.2)], [0, 1, 0], UVQ, MAGD, MT)
    out.quad([Q(t0, 0), on(e, u(t0), MY + lift(t0), 0.2), on(e, u(t1), MY + lift(t1), 0.2), Q(t1, 0)], [0, -1, 0], UVQ, MAGD, MT)
    bulbs(out, Q(t0, 0.06), Q(t1, 0.06), 0.4, 0.045)
    bulbs(out, Q(t0, 1.2), Q(t1, 1.2), 0.4, 0.045)
  }
  signAt(out, e, ui, MY + 1.42, 0.35 + MD + 0.04, { type: 'flat', text: "IT'SUGAR", h: 0.8, face: 'grotesque', weight: 'bold', colour: [0.95, 0.93, 0.96], lit: 'self', tracking: 0.08 })
  // the box sign over the door: magenta, gold lettering, bulbs round its face, on its two faces out and one side
  slab(out, e, ui, 1.2, 2.7, 3.6, 1.5, 2.2, MAG, MT)
  for (const [y0, y1] of [[2.72, 2.72], [4.18, 4.18]]) bulbs(out, on(e, ui - 1.8, y0, 2.33), on(e, ui + 1.8, y1, 2.33), 0.22, 0.035)
  bulbs(out, on(e, ui - 1.8, 2.72, 2.33), on(e, ui - 1.8, 4.18, 2.33), 0.22, 0.035)
  bulbs(out, on(e, ui + 1.8, 2.72, 2.33), on(e, ui + 1.8, 4.18, 2.33), 0.22, 0.035)
  signAt(out, e, ui, 3.75, 2.36, { type: 'flat', text: "WORLD'S LARGEST", h: 0.17, face: 'grotesque', weight: 'bold', colour: [0.98, 0.9, 0.9], lit: 'back' })
  signAt(out, e, ui, 3.35, 2.36, { type: 'flat', text: 'CANDY', h: 0.36, face: 'block', colour: YEL, lit: 'back', tracking: 0.05 })
  signAt(out, e, ui, 2.95, 2.36, { type: 'flat', text: 'DEPARTMENT STORE', h: 0.15, face: 'grotesque', weight: 'bold', colour: [0.98, 0.9, 0.9], lit: 'back' })
  // candy posters on the piers, at eye level
  for (const pu of piers) {
    slab(out, e, pu, 0.62, 1.2, 1.1, 1.9, 0.06, MAG, MT)
    slab(out, e, pu, 0.66, 1.3, 0.9, 1.7, 0.04, pu < ui ? [0.2, 0.35, 0.75] : [0.98, 0.95, 0.9], MT)
  }
  // -- MADAME TUSSAUDS, the west third: a red fascia band in yellow script with bulb rows above and below it, a red
  // vertical banner at the west end, red panels in the arched windows above
  const t0 = Math.min(L - 4, piers[1] + 1.5), t1 = L - 1
  const tw = t1 - t0, tm = (t0 + t1) / 2
  if (tw > 6) {
    slab(out, e, tm, 0.3, 3.4, tw, 1.6, 0.4, RED, MT)
    // the canopy under it, grey, a row of bulbs on its lip
    slab(out, e, tm, 1.1, 3.25, tw, 0.18, 2.0, [0.62, 0.62, 0.64], MT)
    bulbs(out, on(e, t0, 3.3, 2.12), on(e, t1, 3.3, 2.12), 0.3, 0.05)
    bulbs(out, on(e, t0, 5.08, 0.52), on(e, t1, 5.08, 0.52), 0.3, 0.05)
    signAt(out, e, tm, 4.2, 0.52, { type: 'flat', text: 'Madame Tussauds', h: 0.75, face: 'brush', colour: YEL, lit: 'front' })
    // the vertical banner, hung off the wall on a bracket, both faces
    const bu = t1 - 1.5
    slab(out, e, bu, 0.9, 5.6, 0.12, 5.0, 1.0, RED, MT)
    for (const sd of [1, -1]) {
      const p = on(e, bu + sd * 0.07, 8.1, 0.9)
      sign(out, { type: 'flat', text: 'TUSSAUDS', h: 0.36, face: 'didone', weight: 'bold', colour: YEL, lit: 'front', vertical: true },
        { x: p[0], y: 8.1, z: p[2], heading: e.heading + (sd > 0 ? -Math.PI / 2 : Math.PI / 2) })
    }
    tube(out, on(e, bu, 10.8, 0.05), on(e, bu, 10.6, 1.5), 0.04, 5, IRON, MT)
  }
  // -- the SAN FRANCISCO CHOCOLATE STORE, the east end: brown fascia, gold letters, a cream-and-brown striped awning
  const c0 = 1.0, c1 = Math.max(c0 + 6, Math.min(ue, piers[0] - 1.2))
  const cm = (c0 + c1) / 2, cw = c1 - c0
  slab(out, e, cm, 0.25, 3.5, cw, 0.9, 0.3, CHOC, WT)
  signAt(out, e, cm, 3.95, 0.42, { type: 'flat', text: 'San Francisco Chocolate Store', h: 0.55, face: 'roman', weight: 'bold', colour: GOLD, lit: 'front' })
  const stripes = Math.max(4, Math.round(cw / 0.6))
  for (let k = 0; k < stripes; k++) {
    const u0 = c0 + (cw * k) / stripes, u1 = c0 + (cw * (k + 1)) / stripes
    out.quad([on(e, u0, 3.4, 0.4), on(e, u1, 3.4, 0.4), on(e, u1, 2.75, 1.6), on(e, u0, 2.75, 1.6)], [e.nx * 0.5, 0.85, e.nz * 0.5], UVQ, k % 2 ? CREAM : CHOC, WT)
    out.quad([on(e, u0, 2.75, 1.6), on(e, u1, 2.75, 1.6), on(e, u1, 2.45, 1.6), on(e, u0, 2.45, 1.6)], [e.nx, 0, e.nz], UVQ, k % 2 ? CREAM : CHOC, WT)
  }
}

/**
 * HOTEL ZEPHYR, 250 Beach Street (relation/1358120), and its JEFFERSON STREET FRONT (owner: "the black storefronts round
 * Hotel Zephyr"): along Jefferson a row of one-storey boxes clad in black boards, each a shop behind a glass front with a
 * white street number, rust-brick piers between them, planted roofs, tall white light masts with spotlight arms, and the
 * hotel's white ZEPHYR pylon (Mapillary 1295248042335348, 512970293136899) — and set back behind them the hotel, a
 * charcoal 1960s block of window bands. At the Mason Street end a theatre marquee for BURGERS & BEST PIES (the owner's
 * report; no photograph of it found, so its marquee is the generic theatre kind). `front` 352: Jefferson is the ring's
 * edge facing local −z.
 */
export function hotelZephyr(out: MeshBuilder, fit: Fit): void {
  const BLACK: Rgb = [0.08, 0.08, 0.09], RUST: Rgb = [0.56, 0.29, 0.17], CHAR: Rgb = [0.36, 0.36, 0.37], GREEN: Rgb = [0.3, 0.45, 0.22]
  /*
   * The ring this builder receives is missing the Jefferson & Mason corner of the relation's outer way (seen in a
   * top-down shot, 2026-10-17; where it is lost — the fit of a relation, simplifyRing — is not yet found), which cut
   * the block on a diagonal. A WORKAROUND: the block is all but square to its streets, so where the ring covers much
   * less than its own box, the box is the footprint.
   */
  let ring = towerRing(fit)
  const area = Math.abs(ring.reduce((a, p, i) => { const q = ring[(i + 1) % ring.length]; return a + p.x * q.z - q.x * p.z }, 0)) / 2
  if (area < 0.85 * 4 * fit.hx * fit.hz) ring = [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const e = frontEdge(ring)
  const L = e.L
  const D = 8                                                                     // how deep the row of shops is
  const body = clipBehind(ring, e, D)
  const H = fit.height > 9 && fit.height < 20 ? fit.height : 13
  if (body.length >= 3) {
    tower(out, { ...fit, ring: body, height: H }, {
      height: H,
      base: { height: 4.2, face: { kind: 'curtain', wall: [0.14, 0.14, 0.15], glass: [0.24, 0.28, 0.3], pitch: 3, floor: 4.2, material: 'glass' } },
      tiers: [{ to: 1, face: { kind: 'bands', wall: CHAR, glass: [0.42, 0.45, 0.47], floor: (H - 4.2) / 3, solid: 0.5, material: 'stucco' }, cornice: { depth: 0.5, height: 0.5, colour: [0.86, 0.86, 0.84] } }],
      crown: { kind: 'flat' },
    })
  }
  // the strip in front: paved, then the boxes on it
  const strip = [on(e, 0, 0, 0), on(e, L, 0, 0), on(e, L, 0, -D), on(e, 0, 0, -D)].map((p) => ({ x: p[0], z: p[2] }))
  capPolygon(out, strip.slice().reverse(), 0.04, [0.58, 0.57, 0.55], CT)
  /*
   * The shops from the WEST end (u = L at the Mason corner: the ring runs anticlockwise, so u grows westward), with
   * their OSM nodes' order along Jefferson. Widths in metres; a 0 name is the hotel's walk-through to its courtyard.
   */
  const shops: [string, number, number][] = [
    ['BURGERS & BEST PIES', 9, 5.2], ['Harley-Davidson', 11, 4.6], ['Aquamassage', 6, 4.4], ['Made in San Francisco', 9, 5.0],
    ['The Socialite', 8, 4.6], ['', 5, 0], ['Lids', 8, 5.4], ['LUSH', 7, 4.6], ['Pearl Factory', 7, 5.0],
    ['Museum of 3D Illusions', 9, 5.2], ['Mango Crazy', 6, 4.4], ['Starbucks', 8, 4.8],
  ]
  const total = shops.reduce((a, s) => a + s[1], 0)
  const k = (L - 2) / total
  let w0 = L - 1
  let num = 61
  for (const [name, wRaw, h] of shops) {
    const w = wRaw * k, u = w0 - w / 2
    w0 -= w
    if (!name) {
      // the walk-through: a black steel frame over it, HOTEL ZEPHYR on its beam
      for (const s of [-1, 1]) slab(out, e, u + s * (w / 2 - 0.2), -0.4, 0, 0.3, 5.2, 0.3, BLACK, MT)
      slab(out, e, u, -0.4, 4.6, w, 0.6, 0.35, BLACK, MT)
      signAt(out, e, u, 4.9, -0.2, { type: 'flat', text: 'HOTEL ZEPHYR', h: 0.32, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'back', tracking: 0.15 })
      continue
    }
    // the box: black boards, a glass front from the sill to the transom, the door
    slab(out, e, u, -D / 2 + 0.1, 0, w - 0.25, h, D - 0.2, BLACK, WT)
    slab(out, e, u, 0.04, 0.35, w - 1.4, 2.75, 0.08, [0.2, 0.24, 0.27], GT)
    slab(out, e, u, 0.09, 3.1, w - 1.4, 0.08, 0.06, [0.2, 0.2, 0.2], MT)
    slab(out, e, u + w * 0.22, 0.1, 0.0, 1.1, 2.5, 0.05, [0.12, 0.12, 0.12], MT)
    // the rust-brick pier at its west side
    slab(out, e, u + w / 2 - 0.1, 0.05, 0, 0.75, 3.2, 0.4, RUST, BT)
    // the planted roof: a low bed of green and a few shrubs standing up out of it
    slab(out, e, u, -D / 2, h, w - 1.2, 0.35, D - 1.4, GREEN, FT)
    for (let s = 0; s < 3; s++) {
      const p = on(e, u - w * 0.3 + s * w * 0.3, h + 0.35, -1.4 - s * 1.7)
      prism(out, p[0], p[2], p[1], p[1] + 0.7 + 0.4 * ((s + num) % 3), 0.45 + 0.1 * s, 6, [0.24 + 0.04 * s, 0.4, 0.2], FT, 0.15)
    }
    // the number, white, at the top corner; the shop's name on a dark board in the middle
    signAt(out, e, u + w / 2 - 0.9, h - 0.9, 0.06, { type: 'flat', text: String(num), h: 0.32, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'none' })
    num += 4
    if (name === 'BURGERS & BEST PIES') {
      /*
       * A THEATRE MARQUEE: a deep box over the street with chaser bulbs round its faces, a white letterboard
       * with red letters, a red crest on top with the name in lit script.
       */
      const MO = 2.2
      slab(out, e, u, MO / 2, 3.4, w - 0.6, 1.3, MO, [0.72, 0.1, 0.12], MT)
      slab(out, e, u, MO + 0.02, 3.55, w - 1.2, 1.0, 0.04, [0.97, 0.95, 0.88], MT)
      signAt(out, e, u, 4.3, MO + 0.07, { type: 'flat', text: 'BURGERS & BEST PIES', h: 0.32, face: 'condensed', weight: 'bold', colour: [0.75, 0.08, 0.1], lit: 'back', tracking: 0.08 })
      signAt(out, e, u, 3.82, MO + 0.07, { type: 'flat', text: 'OPEN DAILY · SHAKES · FRIES', h: 0.16, face: 'condensed', colour: [0.15, 0.15, 0.15], lit: 'back' })
      for (const y of [3.42, 4.68]) bulbs(out, on(e, u - w / 2 + 0.35, y, MO + 0.05), on(e, u + w / 2 - 0.35, y, MO + 0.05), 0.25, 0.04)
      for (const s of [-1, 1]) bulbs(out, on(e, u + s * (w / 2 - 0.35), 3.42, MO + 0.05), on(e, u + s * (w / 2 - 0.35), 4.68, MO + 0.05), 0.25, 0.04)
      // the crest over it: a half-disc of red with the name in lit cream script
      const cy = 4.7, cr = 1.5
      for (let s = 0; s < 10; s++) {
        const a0 = (s / 10) * Math.PI, a1 = ((s + 1) / 10) * Math.PI
        out.quad([on(e, u, cy, MO - 0.3), on(e, u + Math.cos(a0) * cr * 1.7, cy + Math.sin(a0) * cr, MO - 0.3), on(e, u + Math.cos(a1) * cr * 1.7, cy + Math.sin(a1) * cr, MO - 0.3), on(e, u, cy, MO - 0.3)], [e.nx, 0, e.nz], UVQ, [0.72, 0.1, 0.12], MT)
        const b = on(e, u + Math.cos(a0) * cr * 1.7, cy + Math.sin(a0) * cr, MO - 0.26)
        box(out, b[0], b[1], b[2], 0.05, 0.05, 0.05, WARM, EMIT)
      }
      signAt(out, e, u, cy + 0.55, MO - 0.24, { type: 'flat', text: 'Burgers', h: 0.5, face: 'brush', colour: [1, 0.93, 0.7], lit: 'self' })
      continue
    }
    slab(out, e, u, 0.06, h - 1.7, Math.min(w - 1.6, 5.2), 0.75, 0.06, [0.12, 0.13, 0.15], MT)
    const face = name === 'LUSH' ? 'block' : name === 'Starbucks' ? 'grotesque' : name === 'Lids' ? 'grotesque' : name === 'Harley-Davidson' ? 'block' : 'roman'
    const col: Rgb = name === 'Harley-Davidson' ? [0.95, 0.5, 0.12] : name === 'Starbucks' ? [0.25, 0.7, 0.45] : WHITE
    signAt(out, e, u, h - 1.32, 0.1, { type: 'flat', text: name, h: name.length > 12 ? 0.24 : 0.4, face, weight: 'bold', italic: name === 'Lids', colour: col, lit: 'back' })
  }
  // the light masts: tall white poles a little out on the pavement, two spotlight arms near the top
  for (let u = 6; u < L - 3; u += 17) {
    const b = on(e, u, 0, 1.3), t = on(e, u, 9.0, 1.3)
    tube(out, b, t, 0.11, 8, WHITE, MT, 0.08)
    for (const s of [-1, 1]) {
      const arm = on(e, u + s * 0.7, 8.6, 1.3)
      tube(out, on(e, u, 8.6, 1.3), arm, 0.035, 5, WHITE, MT)
      box(out, arm[0], arm[1] - 0.12, arm[2], 0.1, 0.1, 0.1, [0.85, 0.85, 0.85], MT)
    }
  }
  // the ZEPHYR pylon at the Powell end: two black posts, a tall white panel, the name and its round mark
  const pu = 9
  for (const s of [-1, 1]) slab(out, e, pu + s * 0.75, 1.2, 0, 0.18, 10.5, 0.18, BLACK, MT)
  slab(out, e, pu, 1.2, 4.6, 0.35, 5.6, 1.5, WHITE, MT)
  for (const sd of [1, -1]) {
    const nx = Math.sin(e.heading + Math.PI / 2) * sd, nz = Math.cos(e.heading + Math.PI / 2) * sd
    const c = on(e, pu, 0, 1.2)
    const hd = e.heading + (sd > 0 ? Math.PI / 2 : -Math.PI / 2)
    sign(out, { type: 'flat', text: 'ZEPHYR', h: 0.5, face: 'grotesque', colour: [0.25, 0.27, 0.3], lit: 'back', vertical: true }, { x: c[0] + nx * 0.19, y: 7.0, z: c[2] + nz * 0.19, heading: hd })
    sign(out, { type: 'flat', text: 'HOTEL', h: 0.2, face: 'grotesque', weight: 'bold', colour: [0.85, 0.15, 0.15], lit: 'back' }, { x: c[0] + nx * 0.19, y: 9.9, z: c[2] + nz * 0.19, heading: hd })
    ellipse(out, [c[0] + nx * 0.19, 4.0, c[2] + nz * 0.19], [Math.cos(hd), 0, -Math.sin(hd)], [0, 1, 0], [nx, 0, nz], 0.5, 0.5, 16, [0.25, 0.27, 0.3], MT)
  }
}

/**
 * THE PIER 45 SHEDS (ways 25372350 A, 25372352 B, 25372355 D; were "Fort Mason Shed A/B/D", plain boxes): long
 * reinforced-concrete transit sheds of the 1920s in buff-grey paint — pilasters every bay, a high band of small steel
 * sash windows under the eaves, big roll-up doors along the apron, and at the land end an ART-DECO HEAD: a stepped
 * parapet rising to a centre gable with capped pilasters, a tall gridded window under a pointed head, a green roll door
 * and big steel-gridded windows either side (Commons "Pier 45 (San Francisco)"). On Shed A's head MUSÉE MÉCANIQUE, the
 * arcade museum inside it (Mapillary 1002286390585334). `front` 130 in the manifest — the sheds' own axis, because the
 * manifest's bearing snaps to the footprint's box (a land end cut square to Jefferson at 182 would be fitted to 220, the
 * long side): the land end is then the edge facing most nearly local −z.
 */
function pier45Shed(name: string, musee: boolean): (out: MeshBuilder, fit: Fit) => void {
  return (out, fit) => {
    const WALL: Rgb = [0.7, 0.69, 0.64], PIL: Rgb = [0.77, 0.76, 0.71], ROOF: Rgb = [0.46, 0.46, 0.45], STEEL: Rgb = [0.2, 0.22, 0.22]
    const DOOR: Rgb = [0.36, 0.46, 0.33], DOORD: Rgb = [0.32, 0.33, 0.33]
    const H = 9.5
    const ring = towerRing(fit)
    faceBand(out, ring, 0, H + 0.9, { kind: 'blank', wall: WALL, material: 'concrete' })
    capPolygon(out, ring, H, ROOF, MT)
    const fi = facingFront(ring, 12)
    const ef = edgeAt(ring, fi)
    for (let i = 0; i < ring.length; i++) {
      const e = edgeAt(ring, i)
      if (e.L < 4) continue
      if (e.nx * ef.nx + e.nz * ef.nz > 0.97 && Math.abs((e.a.x - ef.a.x) * ef.nx + (e.a.z - ef.a.z) * ef.nz) < 3) continue   // the head's own pieces
      // the bays: pilasters, the high window band between them, a roll-up door every third bay
      const n = Math.max(1, Math.round(e.L / 7)), bw = e.L / n
      for (let b = 0; b <= n; b++) slab(out, e, b * bw, 0.15, 0, 0.7, H + 1.1, 0.3, PIL, CT)
      for (let b = 0; b < n; b++) {
        const u = (b + 0.5) * bw
        if (e.L > 25) {
          // two small sash windows a bay, high under the eaves
          for (const s of [-1, 1]) gridWindow(out, e, u + s * bw * 0.22, 6.6, bw * 0.3, 1.5, 3, 2, STEEL)
          if (b % 3 === 1) { slab(out, e, u, 0.05, 0, bw * 0.6, 4.6, 0.08, DOORD, MT); slab(out, e, u, 0.12, 4.6, bw * 0.66, 0.25, 0.2, PIL, CT) }
        }
      }
      slab(out, e, e.L / 2, 0.2, H + 0.75, e.L, 0.3, 0.4, PIL, CT)                 // the coping
    }
    // THE HEAD
    const e = frontEdge(ring, fi), L = e.L, m = L / 2
    const gw = Math.min(L * 0.36, 16)                                            // the centre bay's width
    // the stepped parapet: rising in three steps to the centre, a capped pilaster at each step
    const steps: [number, number][] = [[L / 2, H + 1.2], [gw / 2 + 4.5, H + 2.4], [gw / 2 + 1.2, H + 3.6], [gw / 2 - 1.2, H + 4.6]]
    for (let s = 1; s < steps.length; s++) {
      const half = steps[s][0], top = steps[s][1], base = steps[s - 1][1] - 0.2
      slab(out, e, m, 0.05, base, half * 2, top - base, 0.5, WALL, CT)
      for (const sd of [-1, 1]) {
        slab(out, e, m + sd * half, 0.3, 0, 1.0, top + 0.5, 0.55, PIL, CT)
        slab(out, e, m + sd * half, 0.34, top + 0.4, 1.25, 0.35, 0.65, PIL, CT)     // the cap
      }
    }
    for (const sd of [-1, 1]) slab(out, e, m + sd * (L / 2 - 0.5), 0.3, 0, 1.0, H + 1.6, 0.55, PIL, CT)
    // the centre: a tall gridded window under a pointed head, the green roll door under it
    const cwid = gw - 3.4
    gridWindow(out, e, m, 5.4, cwid, 4.2, 8, 4, STEEL, 0.06)
    for (let s = 0; s < 6; s++) {
      const t = s / 6
      gridWindow(out, e, m, 9.6 + s * 0.42, cwid * (1 - t * 0.9), 0.42, Math.max(1, Math.round(8 * (1 - t))), 1, STEEL, 0.06)
    }
    slab(out, e, m, 0.08, 0, cwid * 0.8, 4.9, 0.1, DOOR, MT)
    for (let k = 1; k < 10; k++) slab(out, e, m, 0.14, k * 0.49, cwid * 0.8, 0.04, 0.03, [0.3, 0.38, 0.27], MT)
    // the side bays of the head: two tall gridded windows a side, an upper row over a lower
    for (const sd of [-1, 1]) {
      const span = L / 2 - gw / 2 - 1.5
      const nw = Math.max(1, Math.round(span / 4.2))
      for (let k = 0; k < nw; k++) {
        const u = m + sd * (gw / 2 + 0.8 + (span * (k + 0.5)) / nw)
        gridWindow(out, e, u, 5.4, (span / nw) * 0.72, 3.0, 5, 4, STEEL)
        gridWindow(out, e, u, 1.0, (span / nw) * 0.72, 3.0, 5, 4, STEEL)
      }
    }
    // a flagpole on the gable
    tube(out, on(e, m, H + 4.6, -0.8), on(e, m, H + 13, -0.8), 0.07, 6, [0.88, 0.88, 0.86], MT, 0.04)
    // the names
    if (musee) {
      // the museum's long cream banner over the door, red letters, and its sandwich boards by the door
      slab(out, e, m, 0.2, 4.95, cwid * 0.95, 1.1, 0.06, [0.96, 0.92, 0.8], MT)
      signAt(out, e, m, 5.5, 0.26, { type: 'flat', text: 'MUSÉE MÉCANIQUE', h: 0.6, face: 'didone', weight: 'bold', colour: [0.7, 0.12, 0.12], lit: 'front', tracking: 0.08 })
      for (const sd of [-1, 1]) {
        const p = on(e, m + sd * (cwid * 0.4 + 0.6), 0.55, 1.3)
        boxAlong(out, p[0], p[1], p[2], 0.35, 0.55, 0.06, e.heading, [0.75, 0.1, 0.1], MT)
        signAt(out, e, m + sd * (cwid * 0.4 + 0.6), 0.65, 1.37, { type: 'flat', text: 'FREE', h: 0.18, face: 'block', colour: [1, 0.85, 0.3], lit: 'none' })
      }
    }
    signAt(out, e, m, H + 2.6, 0.32, { type: 'flat', text: name, h: 0.75, face: 'engraved', colour: [0.42, 0.4, 0.36], lit: 'front', tracking: 0.25 })
  }
}

/**
 * The RED AND WHITE FLEET's booth at Pier 43½ (way/1092477935): a white ticket booth with a red band and the fleet's
 * name, a round red-and-white drum sign on its roof, and over it the tall white tapered mast of white tubes — a tripod
 * of legs braced in rings — carrying PIER 43½ and BAY CRUISE & FERRY TERMINAL boards, topped by a blue and red finial
 * (Mapillary 267159458189554). `front` 181: the booth faces the Embarcadero, local −z.
 */
export function redWhiteBooth(out: MeshBuilder, fit: Fit): void {
  const RED: Rgb = [0.78, 0.1, 0.12], BLUE: Rgb = [0.15, 0.3, 0.65]
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring, 180))
  faceBand(out, ring, 0, 3.0, { kind: 'blank', wall: WHITE, material: 'clapboard' })
  faceBand(out, ring, 3.0, 3.6, { kind: 'blank', wall: RED, material: 'metal' })
  capPolygon(out, ring, 3.6, [0.8, 0.8, 0.8], MT)
  // the ticket windows on the front
  for (const s of [-1, 1]) {
    slab(out, e, e.L / 2 + s * e.L * 0.22, 0.03, 1.1, e.L * 0.3, 1.3, 0.05, DARKGL, GT)
    slab(out, e, e.L / 2 + s * e.L * 0.22, 0.25, 1.0, e.L * 0.34, 0.06, 0.5, [0.7, 0.7, 0.7], MT)
  }
  signAt(out, e, e.L / 2, 3.3, 0.04, { type: 'flat', text: 'RED AND WHITE FLEET', h: 0.2, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'back' })
  // the drum on the roof: a white ring with a red band, the name round the front
  const c = on(e, e.L / 2, 0, -2)
  prism(out, c[0], c[2], 3.6, 4.1, 2.1, 20, WHITE, MT)
  prism(out, c[0], c[2], 4.1, 4.9, 2.3, 20, RED, MT)
  prism(out, c[0], c[2], 4.9, 5.1, 2.4, 20, WHITE, MT)
  signAt(out, e, e.L / 2, 4.5, -2 + 2.3 + 0.03, { type: 'flat', text: 'RED & WHITE FLEET', h: 0.26, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'self' })
  // the mast: three white legs from the drum's rim rising to a point, braced by rings, the boards on its front
  const TOP = 17
  const legs: V3[] = [0, 1, 2].map((k) => { const a = (k / 3) * Math.PI * 2 + Math.PI / 2; return [c[0] + Math.sin(a + e.heading) * 1.7, 5.1, c[2] + Math.cos(a + e.heading) * 1.7] })
  const apex: V3 = [c[0], TOP, c[2]]
  for (const l of legs) tube(out, l, apex, 0.12, 6, WHITE, MT, 0.06)
  for (const t of [0.3, 0.55, 0.78]) {
    const pts = legs.map((l): V3 => [l[0] + (apex[0] - l[0]) * t, l[1] + (apex[1] - l[1]) * t, l[2] + (apex[2] - l[2]) * t])
    for (let k = 0; k < 3; k++) tube(out, pts[k], pts[(k + 1) % 3], 0.05, 5, WHITE, MT)
  }
  tube(out, apex, [c[0], TOP + 2.5, c[2]], 0.09, 6, BLUE, MT)
  lozenge(out, [c[0], TOP + 2.0, c[2]], [1, 0, 0], [0, 0, 1], [0, 1, 0], 0.3, 0.3, 0.5, RED, MT, 10)
  // the boards, hung on the front legs
  for (const [y, txt, hh, w] of [[11.4, 'PIER 43½', 0.45, 2.6], [9.6, 'BAY CRUISE & FERRY TERMINAL', 0.24, 4.6]] as [number, string, number, number][]) {
    slab(out, e, e.L / 2, -2 + 1.2, y - hh * 1.1, w, hh * 2.2, 0.1, WHITE, MT)
    signAt(out, e, e.L / 2, y, -2 + 1.27, { type: 'flat', text: txt, h: hh, face: 'grotesque', weight: 'bold', colour: [0.15, 0.15, 0.18], lit: 'front' })
  }
}

/**
 * AUNT FANNY'S HOT PRETZELS, the kiosk on Pier 39 (OSM node 4611835603 is inside Building L; the kiosk stands in the
 * walk beside it): a round RED DRUM of a counter, glass all round above it, and over it a SCALLOPED GLASS CANOPY — a
 * low cone of pale green glass on a red ring, its rim hung with scallops — with a big golden pretzel on the top and the
 * name on the band (the owner's description; no photograph found). Placed by lat/lon, rotateDeg 0.
 */
export function pretzelKiosk(out: MeshBuilder, _fit: Fit): void {
  const RED: Rgb = [0.8, 0.12, 0.12], REDD: Rgb = [0.6, 0.08, 0.08], CREAM: Rgb = [0.96, 0.92, 0.8], GLASS: Rgb = [0.72, 0.86, 0.84]
  const BROWN: Rgb = [0.62, 0.36, 0.14], SALT: Rgb = [0.97, 0.97, 0.95], GOLDC: Rgb = [0.9, 0.72, 0.3]
  const R = 1.35
  prism(out, 0, 0, 0, 0.12, R + 0.1, 20, [0.4, 0.38, 0.36], CT)
  prism(out, 0, 0, 0.12, 1.05, R, 20, RED, MT)                                   // the drum
  for (const y of [0.3, 0.75]) prism(out, 0, 0, y, y + 0.06, R + 0.02, 20, GOLDC, MT)
  prism(out, 0, 0, 1.05, 1.13, R + 0.18, 20, CREAM, WT)                          // the counter
  // the glass above the counter, and its thin mullions
  prism(out, 0, 0, 1.13, 2.2, R - 0.05, 20, [0.55, 0.68, 0.7], GT, R - 0.05, false)
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; tube(out, [Math.sin(a) * (R - 0.02), 1.13, Math.cos(a) * (R - 0.02)], [Math.sin(a) * (R - 0.02), 2.2, Math.cos(a) * (R - 0.02)], 0.025, 4, RED, MT) }
  // the band: a red ring with the name on two sides
  prism(out, 0, 0, 2.2, 2.55, R + 0.05, 20, RED, MT)
  for (const hd of [0, Math.PI]) {
    sign(out, { type: 'flat', text: "AUNT FANNY'S", h: 0.17, face: 'slab', weight: 'bold', colour: CREAM, lit: 'self' }, { x: Math.sin(hd) * (R + 0.08), y: 2.42, z: Math.cos(hd) * (R + 0.08), heading: hd })
    sign(out, { type: 'flat', text: 'HOT PRETZELS', h: 0.09, face: 'slab', weight: 'bold', colour: [1, 0.85, 0.4], lit: 'self' }, { x: Math.sin(hd) * (R + 0.08), y: 2.27, z: Math.cos(hd) * (R + 0.08), heading: hd })
  }
  for (const hd of [Math.PI / 2, -Math.PI / 2]) sign(out, { type: 'flat', text: 'PRETZELS', h: 0.18, face: 'slab', weight: 'bold', colour: CREAM, lit: 'self' }, { x: Math.sin(hd) * (R + 0.08), y: 2.38, z: Math.cos(hd) * (R + 0.08), heading: hd })
  // the canopy: a shallow glass cone out past the drum, a red rim, scallops hanging off it
  const CR = 2.05, N = 24, Y0 = 2.6, Y1 = 3.25
  for (let k = 0; k < N; k++) {
    const a0 = (k / N) * Math.PI * 2, a1 = ((k + 1) / N) * Math.PI * 2, am = (a0 + a1) / 2
    const rim = (a: number, r = CR, y = Y0): V3 => [Math.sin(a) * r, y, Math.cos(a) * r]
    out.quad([rim(a0), rim(a1), rim(a1, 0.35, Y1), rim(a0, 0.35, Y1)], [Math.sin(am) * 0.4, 1, Math.cos(am) * 0.4], UVQ, GLASS, GT)
    // the scallop: a half-round of red glass hanging from the rim
    const lo: V3 = [Math.sin(am) * (CR + 0.01), Y0 - 0.28, Math.cos(am) * (CR + 0.01)]
    const q1: V3 = [Math.sin(a0 + (a1 - a0) * 0.2) * (CR + 0.01), Y0 - 0.17, Math.cos(a0 + (a1 - a0) * 0.2) * (CR + 0.01)]
    const q2: V3 = [Math.sin(a1 - (a1 - a0) * 0.2) * (CR + 0.01), Y0 - 0.17, Math.cos(a1 - (a1 - a0) * 0.2) * (CR + 0.01)]
    out.quad([rim(a0, CR + 0.01), q1, lo, lo], [Math.sin(am), 0, Math.cos(am)], UVQ, k % 2 ? REDD : RED, GT)
    out.quad([rim(a0, CR + 0.01), lo, q2, rim(a1, CR + 0.01)], [Math.sin(am), 0, Math.cos(am)], UVQ, k % 2 ? REDD : RED, GT)
    box(out, Math.sin(a0) * CR, Y0 + 0.02, Math.cos(a0) * CR, 0.05, 0.05, 0.05, WARM, EMIT)
  }
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; tube(out, [Math.sin(a) * R * 0.9, 2.55, Math.cos(a) * R * 0.9], [Math.sin(a) * CR, Y0, Math.cos(a) * CR], 0.03, 4, RED, MT) }
  prism(out, 0, 0, Y1 - 0.05, Y1 + 0.12, 0.4, 12, RED, MT)
  // the PRETZEL on top, upright, facing both ways: a knot of golden-brown tube, salt on it
  const P = (x: number, y: number): V3 => [x, Y1 + 0.95 + y, 0]
  const pts: V3[] = []
  for (let k = 0; k <= 40; k++) {
    // a pretzel's knot as one curve: the two loops and the crossed arms (a lemniscate over a U)
    const t = (k / 40) * Math.PI * 2
    const x = 0.62 * Math.sin(t) * (1 + 0.15 * Math.cos(t))
    const y = 0.36 * Math.sin(2 * t) * 0.9 + 0.25 * Math.cos(t) - 0.05
    pts.push(P(x, y))
  }
  for (let k = 0; k + 1 < pts.length; k++) tube(out, pts[k], pts[k + 1], 0.11, 6, BROWN, WT)
  tube(out, P(-0.25, -0.55), P(-0.08, 0.05), 0.1, 6, BROWN, WT)
  tube(out, P(0.25, -0.55), P(0.08, 0.05), 0.1, 6, BROWN, WT)
  for (let k = 0; k < 14; k++) { const p = pts[(k * 3) % pts.length]; box(out, p[0], p[1] + 0.1, p[2] + (k % 2 ? 0.09 : -0.09), 0.025, 0.025, 0.025, SALT, WT) }
  tube(out, [0, Y1 + 0.1, 0], P(0, -0.55), 0.04, 5, GOLDC, MT)
}

/**
 * THE KLAMATH'S PROPELLERS (historical marker "Propellers from Klamath", Aquatic Park end of Jefferson Street): the two
 * steel propellers of the 1925 auto ferry Klamath, taken off in 1964, standing on a steel frame on their shafts — four
 * broad blades each, pitted by cavitation — with the park's brown marker plaque. A stand-in (TRIPO.md has the row for a
 * real model): the blades are flat twisted paddles. Placed by lat/lon, rotateDeg 180: faces south, to the street.
 */
export function klamathPropellers(out: MeshBuilder, _fit: Fit): void {
  const STEELC: Rgb = [0.3, 0.29, 0.28], FRAME: Rgb = [0.2, 0.22, 0.23], BROWN: Rgb = [0.34, 0.24, 0.16], CONC: Rgb = [0.62, 0.6, 0.57]
  box(out, 0, 0.15, 0, 3.6, 0.15, 1.2, CONC, CT)
  const HY = 2.0, R = 1.5
  for (const px of [-1.85, 1.85]) {
    // the frame: an A of steel each side of the prop, the shaft between
    for (const pz of [-0.55, 0.55]) {
      tube(out, [px - 0.9, 0.3, pz], [px, HY, pz * 0.3], 0.07, 6, FRAME, MT)
      tube(out, [px + 0.9, 0.3, pz], [px, HY, pz * 0.3], 0.07, 6, FRAME, MT)
    }
    tube(out, [px, HY, -0.75], [px, HY, 0.75], 0.12, 10, FRAME, MT)
    // the hub and four blades, turned a little so they read as a propeller, not a cross
    tube(out, [px, HY, -0.32], [px, HY, 0.32], 0.3, 12, STEELC, MT, 0.22)
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + (px > 0 ? 0.4 : 0.1)
      const S = 8
      for (let s = 0; s < S; s++) {
        const r0 = 0.25 + ((R - 0.25) * s) / S, r1 = 0.25 + ((R - 0.25) * (s + 1)) / S
        // the blade's half-width (broad in the middle, round at the tip) and its pitch (steep at the root)
        const wd = (r: number): number => 0.3 * Math.sin(Math.min(1, (r - 0.1) / (R - 0.1)) * Math.PI * 0.92) + 0.08
        const tw = (r: number): number => 0.9 - 0.45 * (r / R)
        const pt = (r: number, side: number): V3 => {
          const da = (side * wd(r)) / r
          const ang = a + da
          return [px + Math.cos(ang) * r, HY + Math.sin(ang) * r, side * wd(r) * Math.sin(tw(r))]
        }
        out.quad([pt(r0, -1), pt(r1, -1), pt(r1, 1), pt(r0, 1)], [0, 0, 1], UVQ, STEELC, MT)
      }
    }
  }
  // the marker: a brown post and a sloped plaque before the frame
  box(out, 0, 0.7, 1.0, 0.06, 0.4, 0.06, BROWN, WT)
  out.quad([[-0.4, 0.95, 1.12], [0.4, 0.95, 1.12], [0.4, 1.25, 0.92], [-0.4, 1.25, 0.92]], [0, 0.6, 0.8], UVQ, BROWN, MT)
  sign(out, { type: 'flat', text: 'KLAMATH', h: 0.1, face: 'slab', weight: 'bold', colour: [0.95, 0.92, 0.85], lit: 'none' }, { x: 0, y: 1.18, z: 1.0, heading: 0 })
}

/**
 * IN-N-OUT BURGER at 333 Jefferson, and the hotel wing it is in (way/103339434, the Courtyard Marriott's Jefferson
 * block): three storeys of pale yellow stucco over a row of shopfronts — Pepper Palace, Lola, The Crêpe Cafe on white
 * fascias — and at the east corner, on the walk through to the hotel's court, In-N-Out's RED box with the YELLOW
 * boomerang canopy swooping across it and the name in white over a yellow arrow (Mapillary 374524814224857,
 * 1163130182336946). `front` 352: Jefferson is local −z.
 */
export function jeffersonInNOut(out: MeshBuilder, fit: Fit): void {
  const YELW: Rgb = [0.93, 0.82, 0.52], RED: Rgb = [0.84, 0.1, 0.1], YEL: Rgb = [0.99, 0.8, 0.1], CREAMW: Rgb = [0.95, 0.94, 0.9]
  const H = fit.height > 9 && fit.height < 18 ? fit.height : 12
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 4.3, face: { kind: 'curtain', wall: [0.85, 0.84, 0.8], glass: [0.22, 0.26, 0.3], pitch: 3.2, floor: 4.3, material: 'glass' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: YELW, glass: [0.3, 0.36, 0.42], pitch: 3.0, floor: (H - 4.3) / 2.5, solid: 0.4, material: 'stucco' }, cornice: { depth: 0.6, height: 0.4, colour: CREAMW } }],
    cornices: [{ at: 4.3, depth: 0.5, height: 0.35, colour: CREAMW }],
    crown: { kind: 'flat' },
  })
  const ring = towerRing(fit)
  const fi = facingFront(ring, 10)
  const e = frontEdge(ring, fi)
  const L = e.L
  // IN-N-OUT: the east 11 m of the front, and the corner wall round onto the walk
  const IW = Math.min(11, L * 0.3), im = IW / 2
  slab(out, e, im, 0.35, 0, IW, 6.4, 0.4, RED, ST)
  slab(out, e, im, 0.57, 0.3, IW - 2, 2.6, 0.05, [0.2, 0.22, 0.25], GT)
  const side = edgeAt(ring, (fi - 1 + ring.length) % ring.length)
  if (side.L > 3) slab(out, side, side.L - Math.min(side.L, 9) / 2, 0.12, 0, Math.min(side.L, 9), 6.4, 0.25, RED, ST)
  // the boomerang canopy: a yellow band rising across the front from the corner, standing out over the door
  const segs = 6
  for (let k = 0; k < segs; k++) {
    const t0 = k / segs, t1 = (k + 1) / segs
    const y = (t: number): number => 3.0 + 1.2 * t
    out.quad([on(e, IW * t0, y(t0), 1.6), on(e, IW * t1, y(t1), 1.6), on(e, IW * t1, y(t1), 0.55), on(e, IW * t0, y(t0), 0.55)], [0, 1, 0], UVQ, YEL, MT)
    out.quad([on(e, IW * t0, y(t0) - 0.45, 1.6), on(e, IW * t1, y(t1) - 0.45, 1.6), on(e, IW * t1, y(t1), 1.6), on(e, IW * t0, y(t0), 1.6)], [e.nx, 0, e.nz], UVQ, YEL, MT)
    out.quad([on(e, IW * t0, y(t0) - 0.45, 0.55), on(e, IW * t1, y(t1) - 0.45, 0.55), on(e, IW * t1, y(t1) - 0.45, 1.6), on(e, IW * t0, y(t0) - 0.45, 1.6)], [0, -1, 0], UVQ, [0.9, 0.7, 0.08], MT)
  }
  // the sign: IN-N-OUT in white with a black edge, BURGER under it, the yellow arrow beneath
  signAt(out, e, im, 5.75, 0.6, { type: 'flat', text: 'IN-N-OUT', h: 0.7, face: 'block', colour: [1, 1, 1], halo: [0.1, 0.1, 0.1], lit: 'self', tracking: 0.04 })
  signAt(out, e, im + 2.2, 5.05, 0.6, { type: 'flat', text: 'BURGER', h: 0.32, face: 'block', colour: [1, 1, 1], lit: 'self' })
  for (const [u0, y0, u1, y1] of [[im + 3.0, 4.75, im - 3.6, 4.75], [im - 3.6, 4.75, im - 3.1, 4.5], [im - 3.6, 4.75, im - 3.1, 5.0]] as [number, number, number, number][]) {
    const a = on(e, u0, y0, 0.64), b = on(e, u1, y1, 0.64)
    tube(out, a, b, 0.09, 4, YEL, EMIT)
  }
  // the other shops along the front: white fascia boards with their names, every ~8 m, west of In-N-Out
  const names = ['The Crêpe Cafe', 'Lola', 'Pepper Palace', 'Sunglass Hut']
  const n = Math.max(1, Math.min(names.length, Math.floor((L - IW - 2) / 8)))
  const sw = (L - IW - 1) / n
  for (let k = 0; k < n; k++) {
    const u = IW + 0.5 + sw * (k + 0.5)
    slab(out, e, u, 0.15, 3.3, sw - 1.0, 0.8, 0.2, k === 1 ? [0.92, 0.35, 0.55] : CREAMW, WT)
    signAt(out, e, u, 3.7, 0.27, { type: 'flat', text: names[k], h: 0.36, face: k === 2 ? 'slab' : 'roman', weight: 'bold', colour: k === 1 ? [1, 1, 1] : [0.2, 0.2, 0.25], lit: 'front' })
  }
}

/**
 * SCOMA'S, 1965 Al Scoma Way (way/288391506): the seafood house out on Pier 47 — a long low building of white-painted
 * boards on the pier's pilings, a ribbon of dining-room windows along the water under a slate-blue trim band, a grey roof
 * with a deep fascia, and SCOMA'S in red on a white board over the door at the pier end, again on the roof facing the
 * harbour (Commons "Boats moored at Fisherman's Wharf, San Francisco 11"; its own boat, the SCOMA, ties up alongside).
 * `front` 81 in the manifest: the door end, facing Al Scoma Way to the east, is the edge facing local −z.
 */
export function scomas(out: MeshBuilder, fit: Fit): void {
  const TRIM: Rgb = [0.36, 0.45, 0.56], RED: Rgb = [0.75, 0.1, 0.1], ROOF: Rgb = [0.5, 0.52, 0.54]
  const ring = towerRing(fit)
  const H = 4.6
  faceBand(out, ring, 0, 0.9, { kind: 'blank', wall: WHITE, material: 'clapboard' })
  faceBand(out, ring, 0.9, 2.7, { kind: 'bands', wall: WHITE, glass: DARKGL, floor: 1.8, solid: 0.12, material: 'clapboard' })
  faceBand(out, ring, 2.7, 3.1, { kind: 'blank', wall: TRIM, material: 'clapboard' })
  faceBand(out, ring, 3.1, H, { kind: 'blank', wall: WHITE, material: 'clapboard' })
  faceBand(out, ring, H, H + 0.35, { kind: 'blank', wall: ROOF, material: 'metal' })
  capPolygon(out, ring, H + 0.35, ROOF, MT)
  // the door end on Al Scoma Way: an entry canopy, the name board over it
  const e = edgeAt(ring, facingFront(ring, 4))
  const u = e.L / 2
  slab(out, e, u, 0.06, 0, Math.min(3.2, e.L * 0.5), 2.5, 0.06, [0.25, 0.2, 0.16], WT)
  slab(out, e, u, 0.9, 2.6, Math.min(4.2, e.L * 0.7), 0.16, 1.8, TRIM, MT)
  slab(out, e, u, 0.08, 3.2, Math.min(5.0, e.L * 0.8), 1.1, 0.12, WHITE, WT)
  signAt(out, e, u, 3.75, 0.16, { type: 'flat', text: "SCOMA'S", h: 0.7, face: 'roman', weight: 'bold', colour: RED, lit: 'front', w: Math.min(4.6, e.L * 0.75) })
  // and on the roof, a long board facing the harbour: a long side (local +x, the north side with front 81)
  let bi = 0
  for (let i = 0; i < ring.length; i++) { const q = edgeAt(ring, i); if (q.L > 6 && q.nx > edgeAt(ring, bi).nx) bi = i }
  const back = edgeAt(ring, bi)
  const c = on(back, back.L / 2, 0, -3)
  const pc = { x: c[0], z: c[2] }
  slab(out, { ...back, a: { x: pc.x - back.tx * 4, z: pc.z - back.tz * 4 } }, 4, 0, H + 0.35, 7.5, 1.5, 0.15, WHITE, WT)
  signAt(out, { ...back, a: { x: pc.x - back.tx * 4, z: pc.z - back.tz * 4 } }, 4, H + 1.1, 0.09, { type: 'flat', text: "SCOMA'S", h: 1.0, face: 'roman', weight: 'bold', colour: RED, lit: 'front' })
  for (const d of [-2.5, 2.5]) slab(out, { ...back, a: { x: pc.x - back.tx * 4, z: pc.z - back.tz * 4 } }, 4 + d, -0.6, H + 0.35, 0.1, 1.2, 1.2, [0.4, 0.4, 0.42], MT)
}

/**
 * THE FISHERMEN'S AND SEAMEN'S MEMORIAL CHAPEL on Pier 45 (way/1092465159, untagged in OSM; Commons "Fisherman's and
 * Seamen's Memorial Chapel, San Francisco", taken 13 m east of it): a small chapel of barn-red boards under a steep roof
 * of dark shingles, a tall STAINED-GLASS window filling each gable (blue waves round a ship's wheel), timber knee braces
 * under the rakes, black double doors with the name on a board above, a plank deck with white-capped rails before the
 * door, and beside it a free-standing square BELL TOWER of the same boards with louvres and an open belfry under a
 * pyramid cap. `front` 90: the door gable faces east, the edge facing local −z.
 */
export function memorialChapel(out: MeshBuilder, fit: Fit): void {
  const RED: Rgb = [0.5, 0.2, 0.18], TRIMR: Rgb = [0.42, 0.16, 0.14], SHINGLE: Rgb = [0.3, 0.31, 0.33]
  const GLASS: Rgb = [0.22, 0.36, 0.62], BLACK: Rgb = [0.08, 0.08, 0.09], DECK: Rgb = [0.55, 0.47, 0.38]
  const RT = surfaceTag('tile')
  const hx = Math.min(fit.hx, 5.2), hz = Math.min(fit.hz, 6)
  const E = 3.4, R = E + hx * 1.05, OV = 0.55
  box(out, 0, E / 2, 0, hx, E / 2, hz, RED, WT)
  // the gables and their glass, both ends
  for (const sz of [-1, 1]) {
    const z = sz * hz
    out.quad([[-hx, E, z], [hx, E, z], [0, R, z], [0, R, z]], [0, 0, sz], UVQ, RED, WT)
    const gz = z + sz * 0.04
    // the window: a tall pane rising into the gable's point, a black frame and cross
    const w = 1.25, y0 = 2.95, y1 = E + 1.4, yt = E + 2.7
    out.quad([[-w, y0, gz], [w, y0, gz], [w, y1, gz], [-w, y1, gz]], [0, 0, sz], UVQ, GLASS, GT)
    out.quad([[-w, y1, gz], [w, y1, gz], [0, yt, gz], [0, yt, gz]], [0, 0, sz], UVQ, GLASS, GT)
    box(out, 0, (y0 + yt) / 2, gz + sz * 0.02, 0.06, (yt - y0) / 2, 0.03, BLACK, MT)
    box(out, 0, y1 - 0.4, gz + sz * 0.02, w, 0.05, 0.03, BLACK, MT)
    // the barge boards along both rakes, and a knee brace under each
    for (const sx of [-1, 1]) {
      const a: V3 = [sx * (hx + OV), E - OV * 1.05, z + sz * 0.35], b: V3 = [0, R + 0.1, z + sz * 0.35]
      tube(out, a, b, 0.14, 4, TRIMR, WT)
      tube(out, [sx * (hx - 0.6), E - 1.3, z + sz * 0.3], [sx * (hx - 0.6), E + 0.6, z + sz * 0.3], 0.08, 4, TRIMR, WT)
    }
  }
  // the roof: two slopes of shingle, overhanging all round
  for (const sx of [-1, 1]) {
    out.quad([[sx * (hx + OV), E - OV * 1.05, -hz - 0.45], [sx * (hx + OV), E - OV * 1.05, hz + 0.45], [0, R + 0.08, hz + 0.45], [0, R + 0.08, -hz - 0.45]],
      [sx * 0.7, 0.7, 0], UVQ, SHINGLE, RT)
  }
  // the door end: black double doors in a red-brown frame, the name board above, two lamps
  const fz = -hz - 0.04
  box(out, 0, 1.3, fz, 1.0, 1.3, 0.04, BLACK, WT)
  for (const sx of [-1, 1]) box(out, sx * 0.5, 1.3, fz - 0.03, 0.34, 1.05, 0.02, [0.62, 0.36, 0.32], WT)
  box(out, 0, 1.3, fz - 0.05, 0.03, 1.3, 0.02, BLACK, MT)
  box(out, 0, 2.78, fz - 0.03, 1.5, 0.16, 0.03, [0.32, 0.22, 0.14], WT)
  sign(out, { type: 'flat', text: "FISHERMEN'S AND SEAMEN'S MEMORIAL CHAPEL", h: 0.1, w: 2.8, face: 'roman', weight: 'bold', colour: [0.85, 0.75, 0.5], lit: 'front' },
    { x: 0, y: 2.78, z: fz - 0.07, heading: Math.PI })
  for (const sx of [-1, 1]) box(out, sx * 1.9, 2.5, fz - 0.12, 0.09, 0.14, 0.09, WARM, EMIT)
  // the chapel stands on Pier 45's plank apron over the water: a deck round it and the tower, on piles
  const x0 = -(hx + 3.4), x1 = hx + 0.8, z0 = -hz - 4.6, z1 = hz + 0.8
  box(out, (x0 + x1) / 2, 0.05, (z0 + z1) / 2, (x1 - x0) / 2, 0.12, (z1 - z0) / 2, [0.5, 0.43, 0.35], WT)
  for (let x = x0 + 0.3; x <= x1; x += 2.4) for (const z of [z0 + 0.3, z1 - 0.3]) box(out, x, -1.6, z, 0.16, 1.6, 0.16, [0.28, 0.24, 0.2], WT)
  for (let z = z0 + 2.7; z < z1 - 1; z += 2.4) for (const x of [x0 + 0.3, x1 - 0.3]) box(out, x, -1.6, z, 0.16, 1.6, 0.16, [0.28, 0.24, 0.2], WT)
  // the deck before the door, rails capped in white
  box(out, 0, 0.22, -hz - 2.2, 2.6, 0.06, 2.2, DECK, WT)
  for (const sx of [-1, 1]) {
    for (const z of [-hz - 0.4, -hz - 2.2, -hz - 4.2]) box(out, sx * 1.4, 0.6, z, 0.07, 0.5, 0.07, DECK, WT)
    box(out, sx * 1.4, 1.12, -hz - 2.3, 0.1, 0.04, 1.95, WHITE, WT)
  }
  // the bell tower, free-standing at the door's left
  const tx = -(hx + 2.0), tz = -hz + 0.6, TH = 6.8
  box(out, tx, TH / 2, tz, 0.95, TH / 2, 0.95, RED, WT)
  for (const [nx, nz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    box(out, tx + nx * 0.97, 5.3, tz + nz * 0.97, nz ? 0.5 : 0.02, 0.7, nx ? 0.5 : 0.02, [0.2, 0.12, 0.1], WT)
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(out, tx + sx * 0.8, TH + 0.7, tz + sz * 0.8, 0.1, 0.7, 0.1, TRIMR, WT)
  box(out, tx, TH + 0.9, tz, 0.22, 0.3, 0.22, [0.45, 0.38, 0.2], MT)
  box(out, tx, TH + 1.45, tz, 1.15, 0.06, 1.15, TRIMR, WT)
  for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]] as [number, number][][]) {
    out.quad([[tx + a[0] * 1.2, TH + 1.5, tz + a[1] * 1.2], [tx + b[0] * 1.2, TH + 1.5, tz + b[1] * 1.2], [tx, TH + 3.0, tz], [tx, TH + 3.0, tz]],
      [(a[0] + b[0]) / 2, 0.7, (a[1] + b[1]) / 2], UVQ, SHINGLE, RT)
  }
}

/**
 * THE HASLETT WAREHOUSE, Jefferson & Hyde (way/25372348; 1909, now the Argonaut Hotel and the Maritime park's visitor
 * centre; Commons "Haslett Warehouse (San Francisco)", "Argonaut Hotel - San Francisco, CA - DSC02048"): four storeys of
 * red brick, rows of segmental-arched windows with dark sashes under brick hoods, string courses at every floor, the
 * parapet stepping up over the end bays; at the Jefferson–Hyde corner the navy ARGONAUT HOTEL blade sign standing out
 * from the wall, the BLUE MERMAID marquee at the corner's foot, and on the parapet over Hyde a NATIONAL PARK VISITOR
 * CENTER board under four gooseneck lamps. `front` 90: the Hyde face is the edge facing local −z; Jefferson is +x.
 */
export function haslettWarehouse(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.6, 0.24, 0.16], NAVY: Rgb = [0.12, 0.16, 0.3], STEEL: Rgb = [0.5, 0.52, 0.55]
  const ring = towerRing(fit)
  const H = Math.max(14, Math.min(18, fit.height))
  faceBand(out, ring, 0, H - 1.2, { kind: 'punched', wall: BRICK, glass: DARKGL, floor: (H - 1.2) / 4, pitch: 3.4, solid: 0.6, arched: true, material: 'brick' })
  faceBand(out, ring, H - 1.2, H, { kind: 'blank', wall: BRICK, material: 'brick' })
  // string courses at each floor, a little proud
  for (let k = 1; k <= 4; k++) faceBand(out, offsetRing(ring, 0.06), (k * (H - 1.2)) / 4 - 0.12, (k * (H - 1.2)) / 4, { kind: 'blank', wall: [0.52, 0.2, 0.14], material: 'brick' })
  faceBand(out, offsetRing(ring, 0.1), H - 0.3, H, { kind: 'blank', wall: [0.5, 0.2, 0.14], material: 'brick' })
  capPolygon(out, ring, H, [0.36, 0.34, 0.33], CT)
  // the Hyde face, and the Jefferson corner: its end of the front edge that lies to local +x
  const e = frontEdge(ring, facingFront(ring, 10))
  const cu = e.tx > 0 ? e.L - 0.4 : 0.4
  // the blade sign, standing out from the Hyde wall at the corner, both faces lettered down
  const out1 = 1.3
  const bc = on(e, cu - (e.tx > 0 ? 0.6 : -0.6), 0, out1)
  boxAlong(out, bc[0], 9.0, bc[2], 0.08, 3.4, 0.55, e.heading, NAVY, MT)
  boxAlong(out, bc[0], 12.55, bc[2], 0.12, 0.15, 0.8, e.heading, STEEL, MT)
  boxAlong(out, bc[0], 5.4, bc[2], 0.12, 0.3, 0.72, e.heading, NAVY, MT)
  for (const sd of [-1, 1]) {
    const hd = e.heading + (sd * Math.PI) / 2
    const ox = Math.sin(hd) * 0.1, oz = Math.cos(hd) * 0.1
    'ARGONAUT'.split('').forEach((ch, k) => sign(out, { type: 'flat', text: ch, h: 0.62, face: 'didone', colour: [0.95, 0.95, 0.92], lit: 'front' },
      { x: bc[0] + ox, y: 11.8 - k * 0.78, z: bc[2] + oz, heading: hd }))
    sign(out, { type: 'flat', text: 'HOTEL', h: 0.32, face: 'didone', colour: [0.95, 0.95, 0.92], lit: 'front' }, { x: bc[0] + ox * 1.3, y: 5.3, z: bc[2] + oz * 1.3, heading: hd })
  }
  // the Blue Mermaid marquee at the corner's foot
  const mu = cu - (e.tx > 0 ? 3.2 : -3.2)
  slab(out, e, mu, 0.8, 3.2, 3.6, 0.7, 1.4, [0.96, 0.95, 0.9], MT)
  signAt(out, e, mu, 3.7, 1.52, { type: 'flat', text: 'BLUE MERMAID', h: 0.3, face: 'roman', weight: 'bold', colour: [0.15, 0.3, 0.6], lit: 'back' })
  bulbs(out, on(e, mu - 1.7, 3.15, 1.52), on(e, mu + 1.7, 3.15, 1.52), 0.3)
  // the visitor centre's board on the parapet over Hyde, four gooseneck lamps over it
  const vu = e.tx > 0 ? e.L - 9 : 9
  slab(out, e, vu, 0.05, H, 6.5, 1.2, 0.2, [0.3, 0.36, 0.33], MT)
  signAt(out, e, vu, H + 0.6, 0.17, { type: 'flat', text: 'National Park Visitor Center', h: 0.36, face: 'grotesque', weight: 'bold', colour: [0.97, 0.97, 0.95], lit: 'front' })
  for (const d of [-2.4, -0.8, 0.8, 2.4]) {
    const b = on(e, vu + d, H + 1.2, -0.1), t = on(e, vu + d, H + 2.6, -0.1), h = on(e, vu + d, H + 2.5, 0.5)
    tube(out, b, t, 0.04, 5, STEEL, MT)
    tube(out, t, h, 0.04, 5, STEEL, MT)
    box(out, h[0], h[1] - 0.12, h[2], 0.16, 0.08, 0.16, STEEL, MT)
  }
}

/** the same wall seen from behind: edge `q` turned round, its far end its start, its normal reversed */
function flip(q: Edge): Edge {
  const b = on(q, q.L, 0, 0)
  return { ...q, a: { x: b[0], z: b[2] }, b: q.a, tx: -q.tx, tz: -q.tz, nx: -q.nx, nz: -q.nz, heading: q.heading + Math.PI }
}

/** a striped canvas awning on edge `e`, centred `u`, `w` wide, its valance lettered with `name` */
function awning(out: MeshBuilder, e: Edge, u: number, w: number, y: number, c: Rgb, name: string, ink: Rgb, d = 1.6): void {
  const a = on(e, u - w / 2, y + 0.7, 0.05), b = on(e, u + w / 2, y + 0.7, 0.05)
  const a2 = on(e, u - w / 2, y, d), b2 = on(e, u + w / 2, y, d)
  out.quad([a, b, b2, a2], [e.nx * 0.6, 0.8, e.nz * 0.6], UVQ, c, WT)
  slab(out, e, u, d, y - 0.38, w, 0.38, 0.04, c, WT)
  signAt(out, e, u, y - 0.19, d + 0.03, { type: 'flat', text: name, h: 0.22, w: w * 0.9, face: 'grotesque', weight: 'bold', colour: ink, lit: 'front' })
}

/**
 * ALIOTO'S No. 8, the corner of Jefferson and Taylor (way/103339436; Commons "Fisherman's Wharf, San Francisco, CA, USA -
 * panoramio (125)", "Boats moored at fisherman's wharf… against the backdrop of Alioto's"): a dark red-brown block,
 * glazed in bands where the dining rooms look over the lagoon, a huge turquoise 8 on the Taylor corner and ALIOTO'S in
 * turquoise along the top; a turquoise board on the roof facing the boats; along Jefferson the turquoise awnings of
 * Alioto's Waterside Cafe and Crab Stand, then Sabella & La Torre's and Nick's Lighthouse's. `front` 171: Jefferson is
 * the edge facing local −z, Taylor at its +x end.
 */
export function aliotos(out: MeshBuilder, fit: Fit): void {
  const WALL: Rgb = [0.33, 0.19, 0.16], TURQ: Rgb = [0.3, 0.78, 0.74], DGREEN: Rgb = [0.06, 0.26, 0.22]
  const ring = towerRing(fit)
  const H = Math.max(10, Math.min(13, fit.height))
  faceBand(out, ring, 0, 3.6, { kind: 'punched', wall: WALL, glass: DARKGL, floor: 3.6, pitch: 3.2, solid: 0.4, material: 'stucco' })
  faceBand(out, ring, 3.6, H - 1.4, { kind: 'punched', wall: WALL, glass: DARKGL, floor: (H - 5) / 2, pitch: 2.6, solid: 0.3, material: 'stucco' })
  faceBand(out, ring, H - 1.4, H, { kind: 'blank', wall: WALL, material: 'stucco' })
  capPolygon(out, ring, H, [0.36, 0.34, 0.33], CT)
  const e = frontEdge(ring, facingFront(ring, 10))
  const tay = e.tx > 0 ? e.L : 0, dir = e.tx > 0 ? -1 : 1
  // ALIOTO'S along the top of the Jefferson face from the corner, and the 8 on the corner
  signAt(out, e, tay + dir * 10, H - 0.75, 0.08, { type: 'flat', text: "ALIOTO'S", h: 1.6, face: 'condensed', weight: 'bold', colour: TURQ, lit: 'self' })
  signAt(out, e, tay + dir * 2.2, H - 2.9, 0.08, { type: 'flat', text: '8', h: 3.6, face: 'grotesque', weight: 'bold', colour: TURQ, lit: 'self' })
  // the turquoise board on the roof, facing the lagoon behind
  let bi = 0
  for (let i = 0; i < ring.length; i++) { const q = edgeAt(ring, i); if (q.L > 6 && q.nz > edgeAt(ring, bi).nz) bi = i }
  const back = edgeAt(ring, bi)
  slab(out, back, back.L / 2, -1.5, H, Math.min(14, back.L * 0.7), 2.0, 0.18, TURQ, MT)
  signAt(out, back, back.L / 2, H + 1.0, -1.5 + 0.1, { type: 'flat', text: "ALIOTO'S", h: 1.3, face: 'condensed', weight: 'bold', colour: DGREEN, lit: 'front' })
  for (const d of [-4, 0, 4]) slab(out, back, back.L / 2 + d, -2.4, H, 0.12, 1.6, 0.12, [0.3, 0.3, 0.32], MT)
  // the awnings along Jefferson, from the corner west
  const shops: [string, Rgb, Rgb][] = [["ALIOTO'S WATERSIDE CAFE", TURQ, DGREEN], ["ALIOTO'S CRAB STAND", TURQ, DGREEN],
    ['SABELLA & LA TORRE', [0.16, 0.3, 0.62], WHITE], ["NICK'S LIGHTHOUSE", [0.72, 0.12, 0.12], WHITE]]
  const sw = Math.min(8, (e.L - 6) / shops.length)
  shops.forEach(([n, c, ink], k) => awning(out, e, tay + dir * (6 + sw * (k + 0.5)), sw - 0.6, 3.0, c, n, ink))
}

/**
 * FISHERMEN'S GROTTO No. 9 (way/103339449; Commons "No. 9 Fishermans Grotto, San Francisco", "Fisherman's Wharf… panoramio
 * (125)"): white Spanish stucco under red tile, arched windows, blue awnings lettered No 9 FISHERMEN'S GROTTO, and over
 * the roof on a steel truss the long yellow board — No 9 in a blue roundel at one end, Fishermen's Grotto in blue along
 * it, and at the other end the blue panel with the old fisherman in his yellow oilskins and sou'wester, rod over his
 * shoulder (neon at night). `front` 81: the Taylor / Embarcadero face is the edge facing local −z.
 */
export function grotto9(out: MeshBuilder, fit: Fit): void {
  const WALL: Rgb = [0.95, 0.94, 0.9], TILE: Rgb = [0.66, 0.27, 0.18], BLUE: Rgb = [0.12, 0.2, 0.55], YEL: Rgb = [0.98, 0.82, 0.2]
  const STEEL: Rgb = [0.42, 0.44, 0.47]
  const H = Math.max(7, Math.min(10, fit.height))
  tower(out, fit, {
    height: H,
    tiers: [{ to: H, face: { kind: 'punched', wall: WALL, glass: DARKGL, floor: H / 2, pitch: 3.4, solid: 0.6, arched: true, material: 'stucco' } }],
    crown: { kind: 'hip', height: 2.6, inset: 0.4, colour: TILE, material: 'tile' },
  })
  const ring = towerRing(fit)
  const e = frontEdge(ring, facingFront(ring, 10))
  // the blue awnings along the front
  const n = Math.max(1, Math.min(4, Math.floor(e.L / 9)))
  for (let k = 0; k < n; k++) awning(out, e, (e.L * (k + 0.5)) / n, Math.min(7, e.L / n - 1), 3.0, BLUE, "No 9 FISHERMEN'S GROTTO", YEL)
  // the rooftop sign on its truss, over the front half, both faces lettered
  const L = Math.min(18, e.L * 0.8), Y = H + 4.2, o = -6
  for (const t of [-L / 2 + 0.5, -L / 4, 0, L / 4, L / 2 - 0.5]) {
    const p = on(e, e.L / 2 + t, 0, o)
    tube(out, [p[0], H + 1.5, p[2]], [p[0], Y - 1.2, p[2]], 0.08, 5, STEEL, MT)
    tube(out, [p[0] - e.nx * 2, H + 1.5, p[2] - e.nz * 2], [p[0], Y - 1.2, p[2]], 0.05, 5, STEEL, MT)
  }
  tube(out, on(e, e.L / 2 - L / 2, Y - 1.2, o), on(e, e.L / 2 + L / 2, Y - 1.2, o), 0.07, 5, STEEL, MT)
  slab(out, e, e.L / 2, o, Y - 1.1, L, 2.2, 0.2, YEL, MT)
  for (const sd of [1, -1]) {
    // each face read from its own side: the back is the front edge turned round, its far end its start
    const f2 = sd > 0 ? e : flip(e)
    const fo = sd > 0 ? o + 0.12 : -o + 0.12
    const mid = e.L / 2
    signAt(out, f2, mid, Y, fo, { type: 'flat', text: "Fishermen's Grotto", h: 1.1, w: L * 0.62, face: 'roman', weight: 'bold', colour: BLUE, lit: 'front' })
    // No 9 in a blue roundel at the left end, the fisherman's panel at the right
    const lx = mid - L / 2 + 1.3, rx = mid + L / 2 - 1.4
    slab(out, f2, lx, fo - 0.05, Y - 1.3, 2.2, 2.6, 0.08, BLUE, MT)
    signAt(out, f2, lx, Y + 0.1, fo + 0.02, { type: 'flat', text: 'No9', h: 1.0, face: 'grotesque', weight: 'bold', colour: YEL, lit: 'self' })
    slab(out, f2, rx, fo - 0.05, Y - 1.4, 2.6, 4.2, 0.08, BLUE, MT)
    // the old fisherman: oilskin coat, sou'wester, the rod
    slab(out, f2, rx, fo + 0.03, Y - 1.0, 0.9, 2.0, 0.04, YEL, EMIT)
    slab(out, f2, rx, fo + 0.03, Y + 1.0, 0.5, 0.45, 0.04, [0.95, 0.8, 0.65], MT)
    slab(out, f2, rx, fo + 0.04, Y + 1.45, 1.0, 0.25, 0.04, YEL, EMIT)
    const r0 = on(f2, rx + 0.4, Y + 0.3, fo + 0.06), r1 = on(f2, rx + 1.2, Y + 2.2, fo + 0.06)
    tube(out, r0, r1, 0.03, 4, [0.95, 0.95, 0.9], EMIT)
  }
}

/**
 * THE CHOWDER HUT, the octagonal pavilion on the corner of Taylor and Jefferson (way/37312394, "The Chowder Hut Grill";
 * Commons "Fisherman's Wharf, San Francisco, CA, USA - panoramio (125)", left): one storey of dark painted panels and
 * glass under a standing-seam metal roof rising to a little lantern, and round every face a blue awning with the menu on
 * its valance — GRILLED SHRIMP, COLD BEER, FRIED CALAMARI, FULL BAR. Faces the same all round, so no `front`.
 */
export function chowderHut(out: MeshBuilder, fit: Fit): void {
  const WALL: Rgb = [0.18, 0.24, 0.26], ROOF: Rgb = [0.34, 0.4, 0.38], BLUE: Rgb = [0.12, 0.34, 0.68]
  const ring = towerRing(fit)
  const H = 4.2
  faceBand(out, ring, 0, 0.7, { kind: 'blank', wall: WALL, material: 'metal' })
  faceBand(out, ring, 0.7, 3.3, { kind: 'curtain', wall: WALL, glass: DARKGL, pitch: 1.6, material: 'metal' })
  faceBand(out, ring, 3.3, H, { kind: 'blank', wall: WALL, material: 'metal' })
  // the roof: from eaves standing out 0.6 m all round, up to a small ring under the lantern
  let cx = 0, cz = 0
  for (const q of ring) { cx += q.x; cz += q.z }
  cx /= ring.length; cz /= ring.length
  const eave = offsetRing(ring, 0.6)
  const top = ring.map((q) => ({ x: cx + (q.x - cx) * 0.14, z: cz + (q.z - cz) * 0.14 }))
  for (let i = 0; i < eave.length; i++) {
    const j = (i + 1) % eave.length
    const mx = (eave[i].x + eave[j].x) / 2 - cx, mz = (eave[i].z + eave[j].z) / 2 - cz, ml = Math.hypot(mx, mz) || 1
    out.quad([[eave[i].x, H, eave[i].z], [eave[j].x, H, eave[j].z], [top[j].x, H + 3.2, top[j].z], [top[i].x, H + 3.2, top[i].z]],
      [(mx / ml) * 0.7, 0.7, (mz / ml) * 0.7], UVQ, ROOF, MT)
  }
  capPolygon(out, top, H + 3.2, ROOF, MT)
  // the lantern on the top
  prism(out, cx, cz, H + 3.2, H + 4.0, 1.0, 8, WALL, MT)
  prism(out, cx, cz, H + 4.0, H + 4.5, 1.2, 8, ROOF, MT)
  const menu = ['GRILLED SHRIMP', 'COLD BEER', 'FRIED CALAMARI', 'FULL BAR']
  let k = 0
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 3) continue
    awning(out, e, e.L / 2, e.L - 0.4, 3.2, BLUE, menu[k++ % menu.length], WHITE, 1.4)
  }
}

export const WHARF_SHOPS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  jeffersonAttractions, hotelZephyr, jeffersonInNOut, redWhiteBooth, scomas, memorialChapel, haslettWarehouse, aliotos, grotto9, chowderHut, pretzelKiosk, klamathPropellers,
  pier45ShedA: pier45Shed('PIER 45', true),
  pier45ShedB: pier45Shed('PIER 45', false),
  pier45ShedD: pier45Shed('PIER 45', false),
}
