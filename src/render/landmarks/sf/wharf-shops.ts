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
import { tube, lozenge, type V3 } from './wharf-carnival.ts'

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
  signAt(out, e, ui, MY + 1.42, 0.35 + MD + 0.04, { type: 'flat', w: 2 * MW - 0.6, text: "IT'SUGAR", h: 0.8, face: 'grotesque', weight: 'bold', colour: [0.95, 0.93, 0.96], lit: 'self', tracking: 0.08 })
  // the box sign over the door: magenta, gold lettering, bulbs round its face, on its two faces out and one side
  slab(out, e, ui, 1.2, 2.7, 3.6, 1.5, 2.2, MAG, MT)
  for (const [y0, y1] of [[2.72, 2.72], [4.18, 4.18]]) bulbs(out, on(e, ui - 1.8, y0, 2.33), on(e, ui + 1.8, y1, 2.33), 0.22, 0.035)
  bulbs(out, on(e, ui - 1.8, 2.72, 2.33), on(e, ui - 1.8, 4.18, 2.33), 0.22, 0.035)
  bulbs(out, on(e, ui + 1.8, 2.72, 2.33), on(e, ui + 1.8, 4.18, 2.33), 0.22, 0.035)
  signAt(out, e, ui, 3.75, 2.36, { type: 'flat', w: 3.3, text: "WORLD'S LARGEST", h: 0.17, face: 'grotesque', weight: 'bold', colour: [0.98, 0.9, 0.9], lit: 'back' })
  signAt(out, e, ui, 3.35, 2.36, { type: 'flat', w: 3.3, text: 'CANDY', h: 0.36, face: 'block', colour: YEL, lit: 'back', tracking: 0.05 })
  signAt(out, e, ui, 2.95, 2.36, { type: 'flat', w: 3.3, text: 'DEPARTMENT STORE', h: 0.15, face: 'grotesque', weight: 'bold', colour: [0.98, 0.9, 0.9], lit: 'back' })
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
    signAt(out, e, tm, 4.2, 0.52, { type: 'flat', w: tw - 1.2, text: 'Madame Tussauds', h: 0.75, face: 'brush', colour: YEL, lit: 'front' })
    // the vertical banner, hung off the wall on a bracket, both faces
    const bu = t1 - 1.5
    slab(out, e, bu, 0.9, 5.6, 0.12, 5.0, 1.0, RED, MT)
    for (const sd of [1, -1]) {
      const p = on(e, bu + sd * 0.07, 8.1, 0.9)
      sign(out, { type: 'flat', w: 0.9, text: 'TUSSAUDS', h: 0.36, face: 'didone', weight: 'bold', colour: YEL, lit: 'front', vertical: true },
        { x: p[0], y: 8.1, z: p[2], heading: e.heading + (sd > 0 ? -Math.PI / 2 : Math.PI / 2) })
    }
    tube(out, on(e, bu, 10.8, 0.05), on(e, bu, 10.6, 1.5), 0.04, 5, IRON, MT)
  }
  // -- the SAN FRANCISCO CHOCOLATE STORE, the east end: brown fascia, gold letters, a cream-and-brown striped awning
  const c0 = 1.0, c1 = Math.max(c0 + 6, Math.min(ue, piers[0] - 1.2))
  const cm = (c0 + c1) / 2, cw = c1 - c0
  slab(out, e, cm, 0.25, 3.5, cw, 0.9, 0.3, CHOC, WT)
  signAt(out, e, cm, 3.95, 0.42, { type: 'flat', w: cw - 0.6, text: 'San Francisco Chocolate Store', h: 0.55, face: 'roman', weight: 'bold', colour: GOLD, lit: 'front' })
  const stripes = Math.max(4, Math.round(cw / 0.6))
  for (let k = 0; k < stripes; k++) {
    const u0 = c0 + (cw * k) / stripes, u1 = c0 + (cw * (k + 1)) / stripes
    out.quad([on(e, u0, 3.4, 0.4), on(e, u1, 3.4, 0.4), on(e, u1, 2.75, 1.6), on(e, u0, 2.75, 1.6)], [e.nx * 0.5, 0.85, e.nz * 0.5], UVQ, k % 2 ? CREAM : CHOC, WT)
    out.quad([on(e, u0, 2.75, 1.6), on(e, u1, 2.75, 1.6), on(e, u1, 2.45, 1.6), on(e, u0, 2.45, 1.6)], [e.nx, 0, e.nz], UVQ, k % 2 ? CREAM : CHOC, WT)
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
      signAt(out, e, m, 5.5, 0.26, { type: 'flat', w: cwid * 0.9, text: 'MUSÉE MÉCANIQUE', h: 0.6, face: 'didone', weight: 'bold', colour: [0.7, 0.12, 0.12], lit: 'front', tracking: 0.08 })
      for (const sd of [-1, 1]) {
        const p = on(e, m + sd * (cwid * 0.4 + 0.6), 0.55, 1.3)
        boxAlong(out, p[0], p[1], p[2], 0.35, 0.55, 0.06, e.heading, [0.75, 0.1, 0.1], MT)
        signAt(out, e, m + sd * (cwid * 0.4 + 0.6), 0.65, 1.37, { type: 'flat', w: 0.6, text: 'FREE', h: 0.18, face: 'block', colour: [1, 0.85, 0.3], lit: 'none' })
      }
    }
    signAt(out, e, m, H + 2.6, 0.32, { type: 'flat', w: Math.min(L - 4, gw + 6), text: name, h: 0.75, face: 'engraved', colour: [0.42, 0.4, 0.36], lit: 'front', tracking: 0.25 })
  }
}

/**
 * The RED AND WHITE FLEET at Pier 43½ (way/1092477935, the booth; Mapillary 464203832503192, 1803507563334446, Jun 2022,
 * and the owner's photo 2026-10-17): (1) a low white KIOSK, a thin red band at its foot, red-trimmed door, dark ticket
 * windows, a deep white fascia reading FAMILY OWNED · SINCE 1892 with the round red-and-white logo at its corner; (2)
 * beside and behind it a round DRUM up on a white column and short legs — a red-banded deck at about 4.5 m, a white
 * cylinder lettered RED & WHITE FLEET in red with red wave marks; (3) rising from the drum a tall white A-FRAME MAST, two
 * splayed legs cross-braced, carrying PIER 43½ (small, upper) and BAY CRUISE & FERRY TERMINAL (larger, lower) in red on
 * white, and on top a flat cut-out of a white ferry with red stripes on blue-and-white waves, tilted a little. `front`
 * 181: the booth faces the Embarcadero, local −z.
 */
export function redWhiteBooth(out: MeshBuilder, fit: Fit): void {
  const RED: Rgb = [0.8, 0.1, 0.12], BLUE: Rgb = [0.15, 0.35, 0.75], GLASSD: Rgb = [0.15, 0.18, 0.2]
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring, 180)), L = e.L
  // the kiosk
  faceBand(out, ring, 0, 0.35, { kind: 'blank', wall: RED, material: 'metal' })
  faceBand(out, ring, 0.35, 2.7, { kind: 'blank', wall: WHITE, material: 'clapboard' })
  faceBand(out, offsetRing(ring, 0.25), 2.7, 3.6, { kind: 'blank', wall: WHITE, material: 'metal' })
  capPolygon(out, offsetRing(ring, 0.25), 3.6, [0.82, 0.82, 0.82], MT)
  capPolygon(out, offsetRing(ring, 0.25), 2.7, WHITE, MT)
  for (const s of [-1, 1]) {
    slab(out, e, L / 2 + s * L * 0.24, 0.03, 1.0, L * 0.34, 1.4, 0.05, GLASSD, GT)
    slab(out, e, L / 2 + s * L * 0.24, 0.25, 0.95, L * 0.38, 0.06, 0.5, [0.75, 0.75, 0.75], MT)
  }
  signAt(out, e, L / 2, 3.15, 0.3, { type: 'flat', text: 'FAMILY OWNED · SINCE 1892', h: 0.24, w: L * 0.7, face: 'grotesque', weight: 'bold', colour: RED, lit: 'front' })
  const lc = on(e, L - 0.1, 3.15, 0.45)
  lozenge(out, lc, [e.tx, 0, e.tz], [0, 1, 0], [e.nx, 0, e.nz], 0.55, 0.55, 0.08, RED, MT, 18)
  lozenge(out, [lc[0] + e.nx * 0.05, lc[1], lc[2] + e.nz * 0.05], [e.tx, 0, e.tz], [0, 1, 0], [e.nx, 0, e.nz], 0.38, 0.38, 0.04, WHITE, MT, 18)
  const side = edgeToward(ring, -e.tx, -e.tz, 1)
  slab(out, side, side.L / 2, 0.03, 0, 1.0, 2.2, 0.05, [0.2, 0.2, 0.22], MT)
  for (const s of [-1, 1]) slab(out, side, side.L / 2 + s * 0.55, 0.06, 0, 0.1, 2.3, 0.08, RED, MT)
  // the drum: behind the kiosk, a little to one side, up on a column and three legs
  const d = on(e, -2.8, 0, 1.2)                                                 // beside the kiosk, west, on the pier head (behind it is water)
  const R = 2.5
  prism(out, d[0], d[2], 0, 4.2, 0.45, 12, WHITE, MT)
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.4; tube(out, [d[0] + Math.sin(a) * 1.6, 0, d[2] + Math.cos(a) * 1.6], [d[0] + Math.sin(a) * 1.0, 4.2, d[2] + Math.cos(a) * 1.0], 0.12, 6, WHITE, MT) }
  prism(out, d[0], d[2], 4.2, 4.6, R + 0.3, 24, RED, MT)
  prism(out, d[0], d[2], 4.6, 6.0, R, 24, WHITE, MT)
  prism(out, d[0], d[2], 6.0, 6.15, R + 0.1, 24, RED, MT)
  for (const hd of [e.heading, e.heading + Math.PI]) {
    const nx = Math.sin(hd), nz = Math.cos(hd)
    sign(out, { type: 'flat', text: 'RED & WHITE FLEET', h: 0.3, w: 3.4, face: 'grotesque', weight: 'bold', colour: RED, lit: 'front' }, { x: d[0] + nx * (R + 0.05), y: 5.3, z: d[2] + nz * (R + 0.05), heading: hd })
    for (const s of [-1, 1]) {
      const c: V3 = [d[0] + nx * (R - 0.4) + Math.cos(hd) * s * 2.0, 5.3, d[2] + nz * (R - 0.4) - Math.sin(hd) * s * 2.0]
      for (let k = 0; k < 3; k++) box(out, c[0] + nx * 0.4, c[1] - 0.3 + k * 0.25, c[2] + nz * 0.4, 0.2, 0.05, 0.2, RED, MT)
    }
  }
  // the A-frame mast from the drum, two splayed legs braced, the boards, the ferry on top
  const TOP = 17
  const ft = (s: number, y: number): V3 => { const k = (TOP - y) / (TOP - 6.1); return [d[0] + e.tx * s * 1.9 * k, y, d[2] + e.tz * s * 1.9 * k] }
  for (const s of [-1, 1]) tube(out, ft(s, 6.1), ft(s, TOP), 0.13, 6, WHITE, MT, 0.08)
  for (const y of [8.4, 11.6, 14.4]) tube(out, ft(-1, y), ft(1, y), 0.06, 5, WHITE, MT)
  for (const [y0, y1] of [[8.4, 11.6], [11.6, 14.4]]) { tube(out, ft(-1, y0), ft(1, y1), 0.04, 4, WHITE, MT); tube(out, ft(1, y0), ft(-1, y1), 0.04, 4, WHITE, MT) }
  const mast = { ...e, a: { x: d[0], z: d[2] } }
  for (const [y, txt, hh, w] of [[13.0, 'PIER 43½', 0.42, 2.6], [10.0, 'BAY CRUISE & FERRY TERMINAL', 0.4, 4.6]] as [number, string, number, number][]) {
    slab(out, mast, 0, 0.2, y - hh * 1.3 - (w > 3 ? 0.35 : 0), w, hh * 2.6 + (w > 3 ? 0.7 : 0), 0.12, WHITE, MT)
    if (w > 3) {
      signAt(out, mast, 0, y + 0.3, 0.3, { type: 'flat', text: 'BAY CRUISE &', h: hh, w: w - 0.4, face: 'grotesque', weight: 'bold', colour: RED, lit: 'front' })
      signAt(out, mast, 0, y - 0.45, 0.3, { type: 'flat', text: 'FERRY TERMINAL', h: hh, w: w - 0.4, face: 'grotesque', weight: 'bold', colour: RED, lit: 'front' })
    } else signAt(out, mast, 0, y, 0.3, { type: 'flat', text: txt, h: hh, w: w - 0.4, face: 'grotesque', weight: 'bold', colour: RED, lit: 'front' })
  }
  // the ferry cut-out: waves, hull, cabins, red stripes, tilted
  const tilt = 0.12
  const F = (x: number, y: number, o = 0.25): V3 => {
    const xr = x * Math.cos(tilt) - y * Math.sin(tilt), yr = x * Math.sin(tilt) + y * Math.cos(tilt)
    return [d[0] + e.tx * xr + e.nx * o, TOP + 0.8 + yr, d[2] + e.tz * xr + e.nz * o]
  }
  const QD = (x0: number, y0: number, x1: number, y1: number, c: Rgb, o = 0.25): void => {
    out.quad([F(x0, y0, o), F(x1, y0, o), F(x1, y1, o), F(x0, y1, o)], [e.nx, 0, e.nz], UVQ, c, MT)
    out.quad([F(x1, y0, o - 0.05), F(x0, y0, o - 0.05), F(x0, y1, o - 0.05), F(x1, y1, o - 0.05)], [-e.nx, 0, -e.nz], UVQ, c, MT)
  }
  QD(-2.6, -0.9, 2.6, -0.3, BLUE)
  for (let k = 0; k < 6; k++) QD(-2.5 + k * 0.85, -0.45, -2.1 + k * 0.85, -0.3, WHITE, 0.28)
  QD(-2.2, -0.3, 2.3, 0.5, WHITE)
  QD(-2.0, 0.05, 2.1, 0.25, RED, 0.28)
  QD(-1.4, 0.5, 1.4, 1.1, WHITE)
  QD(-0.6, 1.1, 0.7, 1.6, WHITE)
  QD(-1.3, 0.75, 1.3, 0.85, RED, 0.28)
  tube(out, ft(0, TOP - 0.2), F(0, -0.9, 0.2), 0.07, 4, WHITE, MT)
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
    sign(out, { type: 'flat', w: 1.9, text: "AUNT FANNY'S", h: 0.17, face: 'slab', weight: 'bold', colour: CREAM, lit: 'self' }, { x: Math.sin(hd) * (R + 0.08), y: 2.42, z: Math.cos(hd) * (R + 0.08), heading: hd })
    sign(out, { type: 'flat', w: 1.6, text: 'HOT PRETZELS', h: 0.09, face: 'slab', weight: 'bold', colour: [1, 0.85, 0.4], lit: 'self' }, { x: Math.sin(hd) * (R + 0.08), y: 2.27, z: Math.cos(hd) * (R + 0.08), heading: hd })
  }
  for (const hd of [Math.PI / 2, -Math.PI / 2]) sign(out, { type: 'flat', w: 1.9, text: 'PRETZELS', h: 0.18, face: 'slab', weight: 'bold', colour: CREAM, lit: 'self' }, { x: Math.sin(hd) * (R + 0.08), y: 2.38, z: Math.cos(hd) * (R + 0.08), heading: hd })
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
  sign(out, { type: 'flat', w: 0.75, text: 'KLAMATH', h: 0.1, face: 'slab', weight: 'bold', colour: [0.95, 0.92, 0.85], lit: 'none' }, { x: 0, y: 1.18, z: 1.0, heading: 0 })
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
  signAt(out, e, im, 5.75, 0.6, { type: 'flat', w: IW - 1, text: 'IN-N-OUT', h: 0.7, face: 'block', colour: [1, 1, 1], halo: [0.1, 0.1, 0.1], lit: 'self', tracking: 0.04 })
  signAt(out, e, im + 2.2, 5.05, 0.6, { type: 'flat', w: IW * 0.4, text: 'BURGER', h: 0.32, face: 'block', colour: [1, 1, 1], lit: 'self' })
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
    signAt(out, e, u, 3.7, 0.27, { type: 'flat', w: sw - 1.4, text: names[k], h: 0.36, face: k === 2 ? 'slab' : 'roman', weight: 'bold', colour: k === 1 ? [1, 1, 1] : [0.2, 0.2, 0.25], lit: 'front' })
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
  signAt(out, { ...back, a: { x: pc.x - back.tx * 4, z: pc.z - back.tz * 4 } }, 4, H + 1.1, 0.09, { type: 'flat', w: 7.0, text: "SCOMA'S", h: 1.0, face: 'roman', weight: 'bold', colour: RED, lit: 'front' })
  for (const d of [-2.5, 2.5]) slab(out, { ...back, a: { x: pc.x - back.tx * 4, z: pc.z - back.tz * 4 } }, 4 + d, -0.6, H + 0.35, 0.1, 1.2, 1.2, [0.4, 0.4, 0.42], MT)
}

/**
 * THE FISHERMEN'S AND SEAMEN'S MEMORIAL CHAPEL on Pier 45 (way/1092465159, untagged in OSM; the owner's street photo of
 * 2026-10-17, Commons "Fisherman's and Seamen's Memorial Chapel, San Francisco"): a small chapel of PALE GREY-WHITE
 * clapboard under a steep roof of dark grey asphalt shingle, white barge boards and white knee-brace brackets under the
 * rakes, a tall POINTED stained-glass window in the gable (blues and greens, leaded), double doors of leaded glass in a
 * warm natural-wood frame with a brass lamp each side; to its left a free-standing square WHITE clapboard BELL TOWER with
 * louvred vents, an open belfry with the bell in it and a low hipped dark cap on wide white eaves; a plank deck before it
 * with wooden rails capped grey, and a short ramp with steel handrails up to the doors. `front` 90: the door gable faces
 * east, the edge facing local −z.
 */
export function memorialChapel(out: MeshBuilder, fit: Fit): void {
  const CLAP: Rgb = [0.9, 0.91, 0.9], TRIMW: Rgb = [0.98, 0.98, 0.97], SHINGLE: Rgb = [0.27, 0.28, 0.3]
  const DECK: Rgb = [0.55, 0.47, 0.38], RAIL: Rgb = [0.55, 0.56, 0.57], WOOD: Rgb = [0.6, 0.4, 0.22], BRASS: Rgb = [0.78, 0.62, 0.3]
  const SG: Rgb[] = [[0.15, 0.35, 0.7], [0.2, 0.55, 0.5], [0.3, 0.6, 0.85], [0.12, 0.42, 0.35]]
  const RT = surfaceTag('tile')
  const hx = Math.min(fit.hx, 5.2), hz = Math.min(fit.hz, 6)
  const E = 3.4, R = E + hx * 1.05, OV = 0.55
  box(out, 0, E / 2, 0, hx, E / 2, hz, CLAP, WT)
  for (const sz of [-1, 1]) {
    const z = sz * hz
    out.quad([[-hx, E, z], [hx, E, z], [0, R, z], [0, R, z]], [0, 0, sz], UVQ, CLAP, WT)
    const gz = z + sz * 0.04
    // the pointed window: leaded panes in blues and greens, a white frame, rising into the gable
    const w = 1.1, y0 = 2.7, y1 = E + 1.3, yt = E + 2.6
    const rows = 6
    for (let r = 0; r < rows; r++) {
      const ya = y0 + ((y1 - y0) * r) / rows, yb = y0 + ((y1 - y0) * (r + 1)) / rows
      for (let c = 0; c < 3; c++) {
        const xa = -w + (2 * w * c) / 3, xb = -w + (2 * w * (c + 1)) / 3
        out.quad([[xa, ya, gz], [xb, ya, gz], [xb, yb, gz], [xa, yb, gz]], [0, 0, sz], UVQ, SG[(r + c) % 4], GT)
      }
    }
    out.quad([[-w, y1, gz], [w, y1, gz], [0, yt, gz], [0, yt, gz]], [0, 0, sz], UVQ, SG[2], GT)
    for (const x of [-w / 3, w / 3]) box(out, x, (y0 + y1) / 2, gz + sz * 0.02, 0.03, (y1 - y0) / 2, 0.02, [0.2, 0.2, 0.22], MT)
    for (const sx of [-1, 1]) tube(out, [sx * (w + 0.08), y0 - 0.1, gz + sz * 0.03], [sx * (w + 0.08), y1, gz + sz * 0.03], 0.07, 4, TRIMW, WT)
    for (const sx of [-1, 1]) tube(out, [sx * (w + 0.08), y1, gz + sz * 0.03], [0, yt + 0.1, gz + sz * 0.03], 0.07, 4, TRIMW, WT)
    box(out, 0, y0 - 0.12, gz + sz * 0.03, w + 0.2, 0.06, 0.05, TRIMW, WT)
    // white barge boards along both rakes, white knee braces under them
    for (const sx of [-1, 1]) {
      const a: V3 = [sx * (hx + OV), E - OV * 1.05, z + sz * 0.35], b: V3 = [0, R + 0.1, z + sz * 0.35]
      tube(out, a, b, 0.13, 4, TRIMW, WT)
      tube(out, [sx * (hx - 0.05), E - 0.9, z + sz * 0.3], [sx * (hx + 0.35), E - 0.3, z + sz * 0.3], 0.07, 4, TRIMW, WT)
      tube(out, [sx * (hx - 0.05), E - 0.9, z + sz * 0.3], [sx * (hx - 0.05), E - 0.3, z + sz * 0.3], 0.06, 4, TRIMW, WT)
    }
    for (const sx of [-1, 1]) box(out, sx * (hx - 0.06), E / 2, z + sz * 0.04, 0.08, E / 2, 0.05, TRIMW, WT)  // corner boards
  }
  for (const sx of [-1, 1]) {
    out.quad([[sx * (hx + OV), E - OV * 1.05, -hz - 0.45], [sx * (hx + OV), E - OV * 1.05, hz + 0.45], [0, R + 0.08, hz + 0.45], [0, R + 0.08, -hz - 0.45]],
      [sx * 0.7, 0.7, 0], UVQ, SHINGLE, RT)
    for (let z = -hz + 1.5; z < hz; z += 2.6) box(out, sx * (hx + 0.04), 1.7, z, 0.04, 0.7, 0.45, [0.3, 0.33, 0.36], GT)
  }
  // the door end: leaded-glass double doors in a natural-wood frame, brass lamps each side
  const fz = -hz - 0.04
  box(out, 0, 1.3, fz, 1.0, 1.3, 0.04, WOOD, WT)
  for (const sx of [-1, 1]) box(out, sx * 0.47, 1.25, fz - 0.03, 0.36, 1.05, 0.02, [0.45, 0.6, 0.7], GT)
  for (const sx of [-1, 1]) for (const y of [0.7, 1.25, 1.8]) box(out, sx * 0.47, y, fz - 0.05, 0.36, 0.015, 0.01, WOOD, WT)
  box(out, 0, 2.7, fz - 0.03, 1.4, 0.13, 0.03, TRIMW, WT)
  sign(out, { type: 'flat', text: "FISHERMEN'S AND SEAMEN'S MEMORIAL CHAPEL", h: 0.09, w: 2.6, face: 'roman', weight: 'bold', colour: [0.25, 0.25, 0.3], lit: 'front' },
    { x: 0, y: 2.7, z: fz - 0.07, heading: Math.PI })
  for (const sx of [-1, 1]) { box(out, sx * 1.35, 2.0, fz - 0.1, 0.1, 0.16, 0.08, BRASS, MT); box(out, sx * 1.35, 1.96, fz - 0.12, 0.06, 0.1, 0.05, WARM, EMIT) }
  // Pier 45's plank apron round it and the tower, on piles
  const x0 = -(hx + 3.4), x1 = hx + 0.8, z0 = -hz - 4.6, z1 = hz + 0.8
  box(out, (x0 + x1) / 2, 0.05, (z0 + z1) / 2, (x1 - x0) / 2, 0.12, (z1 - z0) / 2, [0.5, 0.43, 0.35], WT)
  for (let x = x0 + 0.3; x <= x1; x += 2.4) for (const z of [z0 + 0.3, z1 - 0.3]) box(out, x, -1.6, z, 0.16, 1.6, 0.16, [0.28, 0.24, 0.2], WT)
  for (let z = z0 + 2.7; z < z1 - 1; z += 2.4) for (const x of [x0 + 0.3, x1 - 0.3]) box(out, x, -1.6, z, 0.16, 1.6, 0.16, [0.28, 0.24, 0.2], WT)
  // the deck before the door, wooden rails capped grey, and the ramp up to the sill with its steel handrails
  box(out, 0, 0.32, -hz - 1.3, 1.6, 0.06, 1.3, DECK, WT)
  for (const sx of [-1, 1]) {
    for (const z of [-hz - 0.3, -hz - 1.4, -hz - 2.5]) box(out, sx * 1.6, 0.85, z, 0.06, 0.5, 0.06, DECK, WT)
    box(out, sx * 1.6, 1.38, -hz - 1.4, 0.09, 0.04, 1.2, RAIL, WT)
  }
  out.quad([[-0.7, 0.12, -hz - 5.0], [0.7, 0.12, -hz - 5.0], [0.7, 0.38, -hz - 2.6], [-0.7, 0.38, -hz - 2.6]], [0, 0.99, -0.1], UVQ, DECK, WT)
  for (const sx of [-0.75, 0.75]) {
    tube(out, [sx, 1.0, -hz - 5.0], [sx, 1.26, -hz - 2.6], 0.03, 4, [0.7, 0.72, 0.75], MT)
    for (const z of [-hz - 5.0, -hz - 3.8, -hz - 2.6]) tube(out, [sx, 0.12 + (z + hz + 5.0) * 0.11, z], [sx, 1.0 + (z + hz + 5.0) * 0.11, z], 0.025, 4, [0.7, 0.72, 0.75], MT)
  }
  // the bell tower, free-standing at the door's left: white boards, louvres, the open belfry and its bell, the low cap
  const tx = -(hx + 2.0), tz = -hz + 0.6, TH = 6.2
  box(out, tx, TH / 2, tz, 0.95, TH / 2, 0.95, CLAP, WT)
  for (const [nx, nz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    for (let k = 0; k < 5; k++) box(out, tx + nx * 0.98, 4.5 + k * 0.18, tz + nz * 0.98, nz ? 0.45 : 0.03, 0.03, nx ? 0.45 : 0.03, [0.75, 0.76, 0.76], WT)
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(out, tx + sx * 0.82, TH + 0.75, tz + sz * 0.82, 0.1, 0.75, 0.1, TRIMW, WT)
  box(out, tx, TH + 0.05, tz, 1.0, 0.06, 1.0, TRIMW, WT)
  prism(out, tx, tz, TH + 0.5, TH + 1.15, 0.12, 10, BRASS, MT, 0.38)
  box(out, tx, TH + 1.55, tz, 1.4, 0.07, 1.4, TRIMW, WT)
  for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]] as [number, number][][]) {
    out.quad([[tx + a[0] * 1.3, TH + 1.6, tz + a[1] * 1.3], [tx + b[0] * 1.3, TH + 1.6, tz + b[1] * 1.3], [tx, TH + 2.4, tz], [tx, TH + 2.4, tz]],
      [(a[0] + b[0]) / 2, 0.8, (a[1] + b[1]) / 2], UVQ, SHINGLE, RT)
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
 * FISHERMEN'S GROTTO No. 9 (way/103339449; Commons "No. 9 Fishermans Grotto, San Francisco", "Fisherman's Wharf… panoramio
 * (125)"): white Spanish stucco under red tile, arched windows, blue awnings lettered No 9 FISHERMEN'S GROTTO, and over
 * the roof on a steel truss the long yellow board — No 9 in a blue roundel at one end, Fishermen's Grotto in blue along
 * it, and at the other end the blue panel with the old fisherman in his yellow oilskins and sou'wester, rod over his
 * shoulder (neon at night). `front` 81: the Taylor / Embarcadero face is the edge facing local −z.
 */
export function grotto9(out: MeshBuilder, fit: Fit): void {
  const WALL: Rgb = [0.95, 0.94, 0.9], TILE: Rgb = [0.5, 0.25, 0.19], BLUE: Rgb = [0.12, 0.2, 0.55], YEL: Rgb = [0.98, 0.82, 0.2]
  const STEEL: Rgb = [0.42, 0.44, 0.47]
  const H = Math.max(7, Math.min(10, fit.height))
  tower(out, fit, {
    height: H,
    tiers: [{ to: H, face: { kind: 'punched', wall: WALL, glass: DARKGL, floor: H / 2, pitch: 3.4, solid: 0.6, arched: true, material: 'stucco' } }],
    crown: { kind: 'hip', height: 2.6, inset: 0.4, colour: TILE, material: 'tile' },
  })
  const ring = towerRing(fit)
  const e = frontEdge(ring, facingFront(ring, 10))
  /*
   * The street front (Mapillary 2723595057776031, 1304393406647064): navy DOME awnings lettered No 9 Fishermen's Grotto
   * in yellow, a row of Venetian BARBER-POLE posts striped black and white with lanterns on top, a white lattice fence on
   * planter boxes round the outdoor tables, and a navy oriel bay of diamond-leaded glass on the upper floor.
   */
  const n = Math.max(1, Math.min(3, Math.floor(e.L / 11)))
  for (let k = 0; k < n; k++) {
    const u = (e.L * (k + 0.5)) / n, w = Math.min(8, e.L / n - 2)
    for (let s2 = 0; s2 < 10; s2++) {
      const a0 = (s2 / 10) * Math.PI, a1 = ((s2 + 1) / 10) * Math.PI
      const P = (a: number, uu: number): V3 => on(e, uu, 2.8 + Math.sin(a) * 1.1, 0.05 + (1 - Math.cos(a)) * 0.85)
      out.quad([P(a0, u - w / 2), P(a0, u + w / 2), P(a1, u + w / 2), P(a1, u - w / 2)], [e.nx * Math.cos(a0 + 0.15), Math.sin(a0 + 0.15), e.nz * Math.cos(a0 + 0.15)], UVQ, BLUE, WT)
    }
    for (const s2 of [-1, 1]) for (let a = 0; a < 8; a++) {
      const a0 = (a / 8) * Math.PI, a1 = ((a + 1) / 8) * Math.PI
      out.quad([on(e, u + s2 * w / 2, 2.8, 0.05), on(e, u + s2 * w / 2, 2.8 + Math.sin(a0) * 1.1, 0.05 + (1 - Math.cos(a0)) * 0.85), on(e, u + s2 * w / 2, 2.8 + Math.sin(a1) * 1.1, 0.05 + (1 - Math.cos(a1)) * 0.85), on(e, u + s2 * w / 2, 2.8, 0.05)], [e.tx * s2, 0, e.tz * s2], UVQ, BLUE, WT)
    }
    signAt(out, e, u, 3.25, 1.62, { type: 'flat', text: "No9 Fishermen's Grotto", h: 0.34, w: w * 0.85, face: 'roman', weight: 'bold', colour: YEL, lit: 'front' })
  }
  for (let u = 1.5; u < e.L - 1; u += 4.5) {
    const b = on(e, u, 0, 3.2)
    for (let k = 0; k < 10; k++) tube(out, [b[0], k * 0.32, b[2]], [b[0], (k + 1) * 0.32, b[2]], 0.09, 6, k % 2 ? [0.96, 0.96, 0.95] : [0.1, 0.1, 0.12], WT)
    prism(out, b[0], b[2], 3.2, 3.6, 0.2, 6, [0.15, 0.15, 0.15], MT, 0.26)
    box(out, b[0], 3.45, b[2], 0.12, 0.1, 0.12, WARM, EMIT)
  }
  for (let u = 0.5; u < e.L - 0.5; u += 2.2) {
    slab(out, e, u + 1.1, 3.2, 0, 2.0, 0.45, 0.5, [0.18, 0.22, 0.38], WT)                 // the planter box
    for (let d = -0.9; d <= 0.9; d += 0.3) { slab(out, e, u + 1.1 + d, 3.2, 0.45, 0.04, 0.8, 0.04, WHITE, WT) }
    slab(out, e, u + 1.1, 3.2, 1.2, 2.0, 0.06, 0.06, WHITE, WT)
    for (let d = 0.45; d < 1.25; d += 0.27) slab(out, e, u + 1.1, 3.2, d, 2.0, 0.03, 0.04, WHITE, WT)
  }
  const ob = e.L * 0.35
  slab(out, e, ob, 0.45, H * 0.5 + 0.4, 2.6, 2.4, 0.9, BLUE, WT)
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const p = on(e, ob - 0.9 + c * 0.6, H * 0.5 + 0.8 + r * 0.5, 0.92)
    lozenge(out, p, [e.tx, 0, e.tz], [0, 1, 0], [e.nx, 0, e.nz], 0.26, 0.22, 0.02, [0.45, 0.5, 0.6], GT, 4)
  }
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
    signAt(out, f2, lx, Y + 0.1, fo + 0.02, { type: 'flat', w: 2.0, text: 'No9', h: 1.0, face: 'grotesque', weight: 'bold', colour: YEL, lit: 'self' })
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

/**
 * THE BUENA VISTA, 2765 Hyde at Beach (way/262749432; OSM node 388205890; Commons "Buena Vista Cafe, exterior, San
 * Francisco (May 2025) 01, 03"): a pale sage Edwardian of four storeys, its upper floors in deep angled bays; the bar on the ground floor behind sage panelled piers and big windows, a ribbon of red and
 * blue neon running along over them (COCKTAILS in red in one window), and on the Hyde–Beach corner the hanging sign:
 * "the buena vista" in red neon script on a shaped cream board. `front` 0: the Beach face is the edge facing local −z;
 * Hyde is its +x end.
 */
export function buenaVista(out: MeshBuilder, fit: Fit): void {
  const SAGE: Rgb = [0.86, 0.89, 0.8], DSAGE: Rgb = [0.62, 0.67, 0.58], TRIMC: Rgb = [0.9, 0.9, 0.84], RED: Rgb = [1.0, 0.18, 0.12]
  const NEONB: Rgb = [0.3, 0.75, 1.0]
  const ring = towerRing(fit)
  const H = Math.max(12, Math.min(15, fit.height))
  faceBand(out, ring, 0, 4.2, { kind: 'punched', wall: DSAGE, glass: [0.24, 0.2, 0.15], floor: 4.2, pitch: 4.4, solid: 0.32, material: 'clapboard' })
  faceBand(out, ring, 4.2, H - 0.8, { kind: 'bays', wall: SAGE, glass: DARKGL, floor: (H - 5) / 3, pitch: 4.4, bay: { depth: 0.75 }, material: 'stucco' })
  faceBand(out, offsetRing(ring, 0.25), H - 0.8, H, { kind: 'blank', wall: TRIMC, material: 'stucco' })
  faceBand(out, offsetRing(ring, 0.12), 4.0, 4.35, { kind: 'blank', wall: TRIMC, material: 'stucco' })
  capPolygon(out, ring, H, [0.36, 0.34, 0.33], CT)
  // the neon ribbons along the ground floor, on every street face, and the window sign
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 4) continue
    slab(out, e, e.L / 2, 0.14, 3.35, e.L - 0.6, 0.05, 0.04, RED, EMIT)
    slab(out, e, e.L / 2, 0.14, 3.47, e.L - 0.6, 0.04, 0.04, NEONB, EMIT)
  }
  const e = frontEdge(ring, facingFront(ring, 6))
  const hyde = e.tx > 0 ? 0 : e.L, dir = e.tx > 0 ? 1 : -1
  signAt(out, e, hyde + dir * 6.5, 2.6, 0.06, { type: 'flat', w: 3.0, text: 'COCKTAILS', h: 0.28, face: 'grotesque', weight: 'bold', colour: RED, lit: 'self' })
  // the hanging sign on the corner: a shaped cream board on a bracket, the name in red neon script, both faces
  const c = on(e, hyde, 0, 0)
  const ox = c[0] + e.nx * 1.3 - e.tx * dir * 0.2, oz = c[2] + e.nz * 1.3 - e.tz * dir * 0.2
  const hd = e.heading + (dir > 0 ? Math.PI / 2 : -Math.PI / 2)
  tube(out, [c[0], 5.4, c[2]], [ox + e.nx * 0.8, 5.4, oz + e.nz * 0.8], 0.05, 5, [0.2, 0.2, 0.2], MT)
  boxAlong(out, ox, 5.0, oz, 1.15, 0.85, 0.08, hd, [0.92, 0.9, 0.82], MT)
  for (const sd of [1, -1]) {
    const h2 = hd + (sd > 0 ? 0 : Math.PI), dx = Math.sin(h2) * 0.1, dz = Math.cos(h2) * 0.1
    sign(out, { type: 'flat', w: 2.0, text: 'the', h: 0.32, face: 'script', colour: RED, lit: 'self' }, { x: ox + dx, y: 5.5, z: oz + dz, heading: h2 })
    sign(out, { type: 'flat', w: 2.0, text: 'buena', h: 0.38, face: 'script', colour: RED, lit: 'self' }, { x: ox + dx, y: 5.0, z: oz + dz, heading: h2 })
    sign(out, { type: 'flat', w: 2.0, text: 'vista', h: 0.38, face: 'script', colour: RED, lit: 'self' }, { x: ox + dx, y: 4.5, z: oz + dz, heading: h2 })
  }
}

/**
 * CASTAGNOLA'S, 286 Jefferson at Al Scoma Way (way/229326454; Mapillary 1300527804795812, 1353802022974978, 1272994787953175,
 * Aug 2025; the restaurant closed in March 2020): SHOPS ON THE STREET, THE RESTAURANT UPSTAIRS (owner, 2026-10-17). The
 * ground floor on Jefferson is red brick, four wide segmental arches on royal-blue piers, a shopfront in each, and the
 * green arched board over the middle — Since 1916 / CASTAGNOLA'S / STEAK · SEAFOOD · COCKTAILS on a red strip; round the
 * lagoon side the ground floor is white boards and windows. Over it the terrace runs all round behind a teal railing on
 * a teal fascia; the dining room is set back behind it in glass under a green-and-white striped valance, a skirt of red
 * tile at its eaves and a cream board parapet lettered CASTAGNOLA'S on every face. Everything stands on the sidewalk's
 * level (graded()). `front` 180: Jefferson is the edge facing local −z.
 */
export function castagnolas(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.62, 0.27, 0.19], TEAL: Rgb = [0.15, 0.38, 0.38], TILE: Rgb = [0.74, 0.34, 0.22], CREAM: Rgb = [0.92, 0.9, 0.84]
  const GREEN: Rgb = [0.12, 0.5, 0.25], INK: Rgb = [0.2, 0.2, 0.22], RBLUE: Rgb = [0.2, 0.32, 0.72], RED: Rgb = [0.82, 0.16, 0.12]
  const ring = towerRing(fit)
  const e = frontEdge(ring, facingFront(ring, 8)), L = e.L
  const F = 3.7                                                                    // the terrace floor
  // the ground floor: white boards and windows all round, the brick front over it on Jefferson (returning 3 m)
  faceBand(out, ring, 0, F, { kind: 'punched', wall: WHITE, glass: DARKGL, floor: F, pitch: 2.4, solid: 0.35, material: 'clapboard' }, offFront(ring, e))
  slab(out, e, L / 2, 0.15, 2.75, L + 0.3, F - 2.75, 0.3, BRICK, BT)
  slab(out, e, L / 2, -1.6, 0, L - 0.6, 2.75, 0.1, [0.25, 0.22, 0.2], CT)                     // the back of the arcade
  for (const s of [0, L]) {
    const side = edgeToward(ring, e.tx * (s ? 1 : -1), e.tz * (s ? 1 : -1), 2)
    const near = Math.hypot(side.a.x - (e.a.x + e.tx * s), side.a.z - (e.a.z + e.tz * s)) < Math.hypot(side.b.x - (e.a.x + e.tx * s), side.b.z - (e.a.z + e.tz * s))
    slab(out, side, near ? 1.5 : side.L - 1.5, 0.15, 0, 3.0, F, 0.3, BRICK, BT)
  }
  // the four arches: a shop in each, blue piers between
  const n = 4, bw = (L - 1) / n
  const shops: [string, Rgb][] = [['SOUVENIRS', [0.98, 0.82, 0.2]], ['SWEATSHIRTS · T-SHIRTS', [0.95, 0.95, 0.95]], ['CHOCOLATE · CANDY', [0.95, 0.55, 0.75]], ['SF GIFTS', [0.6, 0.85, 0.98]]]
  for (let k = 0; k < n; k++) {
    const u = 0.5 + bw * (k + 0.5)
    goodsWindow(out, e, u, 0.15, bw - 1.2, 2.4, k * 2)
    for (const sd of [-1, 1]) slab(out, e, u + sd * (bw / 2 - 0.25), 0.15, 0, 0.5, 2.8, 0.3, BRICK, BT)   // the brick jambs
    slab(out, e, u, 0.32, 0, bw - 1.0, 0.15, 0.05, [0.3, 0.3, 0.3], MT)
    // the arch's head: a segment of brick voussoirs, a painted board in the tympanum with the shop's name
    for (let a = 0; a <= 8; a++) {
      const t = (a / 8) * Math.PI
      slab(out, e, u - Math.cos(t) * (bw - 0.8) / 2, 0.32, 2.75 + Math.sin(t) * 0.45, 0.4, 0.2, 0.06, [0.5, 0.2, 0.14], BT)
    }
    if (k !== 1) {
      slab(out, e, u, 0.34, 2.6, bw - 1.6, 0.42, 0.04, [0.15, 0.15, 0.17], MT)
      signAt(out, e, u, 2.81, 0.38, { type: 'flat', text: shops[k][0], h: 0.22, w: bw - 1.9, face: 'grotesque', weight: 'bold', colour: shops[k][1], lit: 'self' })
    }
  }
  for (let k = 0; k <= n; k++) slab(out, e, 0.5 + bw * k, 0.4, 0, 0.55, 3.3, 0.25, RBLUE, MT)
  // the green arched board over the second arch, Since 1916 / CASTAGNOLA'S / the red strip
  const du = 0.5 + bw * 1.5, bwid = Math.min(5.2, bw - 0.4)
  slab(out, e, du, 0.45, 2.45, bwid, 0.9, 0.08, GREEN, MT)
  for (let a = 0; a < 8; a++) {
    const t0 = (a / 8) * Math.PI, t1 = ((a + 1) / 8) * Math.PI
    out.quad([on(e, du, 3.35, 0.49), on(e, du - Math.cos(t0) * bwid / 2, 3.35 + Math.sin(t0) * 0.35, 0.49), on(e, du - Math.cos(t1) * bwid / 2, 3.35 + Math.sin(t1) * 0.35, 0.49), on(e, du, 3.35, 0.49)], [e.nx, 0, e.nz], UVQ, GREEN, MT)
  }
  slab(out, e, du, 0.5, 2.45, bwid, 0.24, 0.05, RED, MT)
  signAt(out, e, du, 3.45, 0.55, { type: 'flat', text: 'Since 1916', h: 0.15, w: 1.6, face: 'script', colour: [1, 0.95, 0.8], lit: 'front' })
  signAt(out, e, du, 3.0, 0.55, { type: 'flat', text: "CASTAGNOLA'S", h: 0.36, w: bwid - 0.4, face: 'roman', weight: 'bold', colour: [1, 0.95, 0.8], lit: 'front' })
  signAt(out, e, du, 2.57, 0.57, { type: 'flat', text: 'STEAK · SEAFOOD · COCKTAILS', h: 0.13, w: bwid - 0.5, face: 'grotesque', weight: 'bold', colour: [1, 0.9, 0.5], lit: 'front' })
  // the terrace all round at F: deck, teal fascia, railing
  const deck = offsetRing(ring, 0.05)
  capPolygon(out, deck, F + 0.02, [0.5, 0.44, 0.38], WT)
  faceBand(out, offsetRing(ring, 0.32), F - 0.15, F + 0.3, { kind: 'blank', wall: TEAL, material: 'clapboard' })
  for (let i = 0; i < ring.length; i++) {
    const q = edgeAt(ring, i)
    if (q.L < 1) continue
    slab(out, q, q.L / 2, 0.3, F + 1.15, q.L, 0.08, 0.1, TEAL, MT)
    for (let u = 0.2; u < q.L; u += 0.3) slab(out, q, u, 0.3, F + 0.3, 0.04, 0.85, 0.04, TEAL, MT)
  }
  // the dining room, set back, glass between white posts; the striped valance; the tile skirt; the parapet and name
  const room = offsetRing(ring, -2.0)
  faceBand(out, room, F, 6.6, { kind: 'curtain', wall: WHITE, glass: DARKGL, pitch: 2.0, material: 'clapboard' })
  for (let i = 0; i < room.length; i++) {
    const q = edgeAt(room, i)
    if (q.L < 2) continue
    const m = Math.max(4, Math.round(q.L / 0.45))
    for (let k = 0; k < m; k++) {
      const u0 = (q.L * k) / m, u1 = (q.L * (k + 1)) / m
      out.quad([on(q, u0, 6.55, 0.02), on(q, u1, 6.55, 0.02), on(q, u1, 6.1, 0.75), on(q, u0, 6.1, 0.75)], [q.nx * 0.6, 0.8, q.nz * 0.6], UVQ, k % 2 ? WHITE : [0.1, 0.42, 0.28], WT)
    }
  }
  const eave = offsetRing(ring, -0.7)
  for (let i = 0; i < eave.length; i++) {
    const j = (i + 1) % eave.length
    const a = eave[i], b = eave[j], c = room[j], d = room[i]
    const mx = (a.x + b.x) / 2 - (c.x + d.x) / 2, mz = (a.z + b.z) / 2 - (c.z + d.z) / 2, ml = Math.hypot(mx, mz) || 1
    // only at the corners: the photographs show the tile skirt on the ends of the room, the striped valance between
    const q = edgeAt(room, i)
    if (q.L > 9) {
      for (const [s0, s1] of [[0, 0.18], [0.82, 1]]) {
        const A = { x: a.x + (b.x - a.x) * s0, z: a.z + (b.z - a.z) * s0 }, B = { x: a.x + (b.x - a.x) * s1, z: a.z + (b.z - a.z) * s1 }
        const C = { x: d.x + (c.x - d.x) * s1, z: d.z + (c.z - d.z) * s1 }, D = { x: d.x + (c.x - d.x) * s0, z: d.z + (c.z - d.z) * s0 }
        out.quad([[A.x, 6.3, A.z], [B.x, 6.3, B.z], [C.x, 7.1, C.z], [D.x, 7.1, D.z]], [(mx / ml) * 0.6, 0.8, (mz / ml) * 0.6], UVQ, TILE, TT)
      }
    } else out.quad([[a.x, 6.3, a.z], [b.x, 6.3, b.z], [c.x, 7.1, c.z], [d.x, 7.1, d.z]], [(mx / ml) * 0.6, 0.8, (mz / ml) * 0.6], UVQ, TILE, TT)
  }
  faceBand(out, room, 6.6, 8.4, { kind: 'blank', wall: CREAM, material: 'clapboard' })
  capPolygon(out, room, 8.4, [0.4, 0.4, 0.4], CT)
  for (let i = 0; i < room.length; i++) {
    const q = edgeAt(room, i)
    if (q.L < 8) continue
    signAt(out, q, q.L / 2, 7.6, 0.06, { type: 'flat', text: "CASTAGNOLA'S", h: 0.8, w: q.L * 0.8, face: 'didone', weight: 'bold', colour: INK, lit: 'front' })
  }
}

/**
 * LONGSHOREMEN'S HALL, 400 North Point (way/24744117, the ILWU's 1959 hall by Marquis & Stoller; Commons "Longshoremen's
 * Hall, San Francisco (July 2020) -1, -5"): a hexagon whose whole upper body is a great hipped tent of bronze standing-seam
 * metal, its faces crossed by battens in big zigzag triangles, sitting on a low wall of buff exposed-aggregate concrete;
 * at each corner a raking concrete buttress leaning out to the ground; on the North Point face a long flat concrete
 * canopy on teal posts over the doors, the ILWU credit union's blue ATM. `front` 180: North Point faces local −z.
 */
export function longshoremensHall(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.7, 0.64, 0.5], BRONZE: Rgb = [0.3, 0.27, 0.25], BATTEN: Rgb = [0.21, 0.19, 0.18], TEAL: Rgb = [0.24, 0.48, 0.48]
  const CON: Rgb = [0.76, 0.73, 0.66]
  const ring = towerRing(fit)
  const B = 3.4, H = 14
  faceBand(out, ring, 0, B, { kind: 'blank', wall: BUFF, material: 'concrete' })
  let cx = 0, cz = 0
  for (const q of ring) { cx += q.x; cz += q.z }
  cx /= ring.length; cz /= ring.length
  // the tent: from the wall head, flaring a little out, up to a small flat crown
  const base = offsetRing(ring, 0.6)
  const top = ring.map((q) => ({ x: cx + (q.x - cx) * 0.55, z: cz + (q.z - cz) * 0.55 }))
  for (let i = 0; i < base.length; i++) {
    const j = (i + 1) % base.length
    const a = base[i], b = base[j], c = top[j], d = top[i]
    const mx = (a.x + b.x) / 2 - cx, mz = (a.z + b.z) / 2 - cz, ml = Math.hypot(mx, mz) || 1
    const n: [number, number, number] = [(mx / ml) * 0.8, 0.6, (mz / ml) * 0.8]
    out.quad([[a.x, B, a.z], [b.x, B, b.z], [c.x, H, c.z], [d.x, H, d.z]], n, UVQ, BRONZE, MT)
    // the zigzag battens: up and down across the face, a little proud of it
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const k = Math.max(2, Math.round(L / 9))
    const lift = (p: V3): V3 => [p[0] + n[0] * 0.08, p[1] + n[1] * 0.08, p[2] + n[2] * 0.08]
    const at = (t: number, h: number): V3 => {
      const lo = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }, hi = { x: d.x + (c.x - d.x) * t, z: d.z + (c.z - d.z) * t }
      const f = (h - B) / (H - B)
      return lift([lo.x + (hi.x - lo.x) * f, h, lo.z + (hi.z - lo.z) * f])
    }
    const mid = B + (H - B) * 0.55
    for (let m = 0; m < k; m++) {
      const t0 = m / k, t1 = (m + 0.5) / k, t2 = (m + 1) / k
      tube(out, at(t0, B + 0.2), at(t1, mid), 0.1, 4, BATTEN, MT)
      tube(out, at(t1, mid), at(t2, B + 0.2), 0.1, 4, BATTEN, MT)
      tube(out, at(t0, mid), at(t1, H - 0.3), 0.08, 4, BATTEN, MT)
      tube(out, at(t1, H - 0.3), at(t2, mid), 0.08, 4, BATTEN, MT)
    }
    tube(out, at(0, mid), at(1, mid), 0.08, 4, BATTEN, MT)
    // the hip: a heavier rib up the corner
    tube(out, [a.x, B, a.z], [d.x, H, d.z], 0.18, 5, BATTEN, MT)
    // the raking buttress at the corner, leaning out to the ground
    const ox = (ring[i].x - cx), oz = (ring[i].z - cz), ol = Math.hypot(ox, oz) || 1
    tube(out, [ring[i].x + (ox / ol) * 0.4, B + 1.2, ring[i].z + (oz / ol) * 0.4], [ring[i].x + (ox / ol) * 3.2, 0, ring[i].z + (oz / ol) * 3.2], 0.45, 4, CON, CT)
  }
  capPolygon(out, top, H, BRONZE, MT)
  // the North Point face: the long canopy on teal posts, the doors, the ATM
  const e = frontEdge(ring, facingFront(ring, 10))
  const u = e.L / 2
  slab(out, e, u, 1.6, 2.6, Math.min(18, e.L * 0.6), 0.22, 3.2, CON, CT)
  for (const d of [-0.22, 0.22]) slab(out, e, u + d * e.L, 0.1, B - 0.6, 0.5, 0.6, 0.2, TEAL, MT)
  slab(out, e, u, 0.05, 0, Math.min(14, e.L * 0.45), 2.5, 0.05, [0.92, 0.9, 0.85], CT)
  for (const d of [-0.12, 0.12]) slab(out, e, u + d * e.L, 0.1, 0, 0.3, 2.6, 0.2, TEAL, MT)
  slab(out, e, u + e.L * 0.17, 0.08, 0.3, 2.4, 2.0, 0.04, DARKGL, GT)
  slab(out, e, u - e.L * 0.2, 0.1, 0.2, 1.4, 2.0, 0.08, [0.12, 0.2, 0.55], MT)
  signAt(out, e, u - e.L * 0.2, 1.95, 0.16, { type: 'flat', w: 1.2, text: 'ILWU', h: 0.2, face: 'grotesque', weight: 'bold', italic: true, colour: [0.12, 0.2, 0.55], panel: [1, 1, 1], lit: 'front' } as SignSpec)
}

/**
 * CIOPPINO'S, Jefferson at Leavenworth (way/229326455; Commons "Cioppino's Restaurant near Fisherman's Wharf, San Francisco
 * USA - panoramio"): one storey of warm yellow stucco under a green cornice, a run of Italian-flag awnings — green, white
 * and red stripes, a green valance lettered RESTAURANT · BAR, SEAFOOD, PASTA, PIZZA and CIOPPINO'S on a green arc — round
 * both street faces, gooseneck lamps over them, and on the corner a cream tower panel with CIOPPINO'S in red neon down it,
 * RESTAURANT, the crab and BAR. `front` 180: Jefferson faces local −z, Leavenworth at its east (+x) end.
 */
export function cioppinos(out: MeshBuilder, fit: Fit): void {
  const YEL: Rgb = [0.84, 0.64, 0.27], GREEN: Rgb = [0.1, 0.42, 0.26], RED: Rgb = [0.82, 0.12, 0.1], CREAM: Rgb = [0.96, 0.92, 0.8]
  const ring = towerRing(fit)
  const H = 5.2
  faceBand(out, ring, 0, H - 0.5, { kind: 'punched', wall: YEL, glass: [0.18, 0.15, 0.12], floor: H - 0.5, pitch: 3.6, solid: 0.38, material: 'stucco' })
  faceBand(out, offsetRing(ring, 0.15), H - 0.5, H, { kind: 'blank', wall: [0.42, 0.5, 0.36], material: 'stucco' })
  capPolygon(out, offsetRing(ring, 0.15), H, [0.42, 0.42, 0.42], CT)
  const words = ["RESTAURANT · BAR", 'SEAFOOD', 'PASTA', 'PIZZA']
  // the striped awning: three bands across its slope
  const flagAwning = (e: Edge, u: number, w: number, word: string): void => {
    const y = 3.0, d = 1.3
    const a = on(e, u - w / 2, y + 0.9, 0.05), b = on(e, u + w / 2, y + 0.9, 0.05), a2 = on(e, u - w / 2, y, d), b2 = on(e, u + w / 2, y, d)
    const cols: Rgb[] = [GREEN, CREAM, RED, CREAM, GREEN, CREAM, RED]
    for (let k = 0; k < cols.length; k++) {
      const t0 = k / cols.length, t1 = (k + 1) / cols.length
      const L = (p: V3, q: V3, t: number): V3 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]
      out.quad([L(a, b, t0), L(a, b, t1), L(a2, b2, t1), L(a2, b2, t0)], [e.nx * 0.6, 0.8, e.nz * 0.6], UVQ, cols[k], WT)
    }
    slab(out, e, u, d, y - 0.4, w, 0.4, 0.04, GREEN, WT)
    signAt(out, e, u, y - 0.2, d + 0.03, { type: 'flat', text: word, h: 0.18, w: w * 0.8, face: 'roman', weight: 'bold', colour: CREAM, lit: 'front' })
    signAt(out, e, u, y + 0.45, (0.05 + d) / 2 + 0.25, { type: 'flat', w: w * 0.45, text: "CIOPPINO'S", h: 0.2, face: 'roman', weight: 'bold', colour: CREAM, panel: GREEN, lit: 'front' })
    const lamp = on(e, u, H - 0.6, 0.1), arm = on(e, u, H - 0.6, 0.7)
    tube(out, lamp, arm, 0.03, 4, [0.15, 0.15, 0.15], MT)
    box(out, arm[0], arm[1] - 0.12, arm[2], 0.14, 0.08, 0.14, WARM, EMIT)
  }
  let k = 0
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 6) continue
    const n = Math.max(1, Math.floor(e.L / 4.2)), w = e.L / n
    for (let m = 0; m < n; m++) flagAwning(e, w * (m + 0.5), w - 0.5, words[k++ % words.length])
  }
  // the corner tower panel at Jefferson & Leavenworth
  const e = frontEdge(ring, facingFront(ring, 6))
  const cu = e.tx > 0 ? e.L - 1.4 : 1.4
  slab(out, e, cu, 0.25, 2.6, 2.8, 4.4, 0.5, CREAM, ST)
  signAt(out, e, cu, 6.4, 0.53, { type: 'flat', text: "CIOPPINO'S", h: 0.42, w: 2.5, face: 'roman', weight: 'bold', colour: RED, lit: 'self' })
  signAt(out, e, cu, 5.75, 0.53, { type: 'flat', text: 'RESTAURANT', h: 0.28, w: 2.3, face: 'roman', weight: 'bold', colour: [0.92, 0.38, 0.2], lit: 'self' })
  signAt(out, e, cu, 4.6, 0.53, { type: 'flat', w: 2.3, text: 'BAR', h: 0.34, face: 'roman', weight: 'bold', colour: [0.92, 0.38, 0.2], lit: 'self' })
}


/**
 * THE HARD ROCK CAFE's frontage at Pier 39's entrance (OSM node 643445596 in Building Q, way/288396171; Commons "Hard Rock
 * Café Pier 39 (San Francisco) July 2022"): laid against Building Q's south wall as its own point model — maroon boards
 * and a white-railed window band, HARD ROCK CAFE in red neon script and the round logo, and over it on the parapet the two
 * royal-blue PIER 39 boards in white serif; red umbrellas on the terrace. Faces local +z (rotateDeg in the manifest).
 */
export function hardRockFront(out: MeshBuilder, _fit: Fit): void {
  const MAROON: Rgb = [0.2, 0.08, 0.08], RED: Rgb = [1.0, 0.14, 0.1], BLUE: Rgb = [0.12, 0.32, 0.7], W = 20
  box(out, 0, 2.1, 0.06, W / 2, 2.1, 0.06, MAROON, WT)
  box(out, 0, 2.05, 0.14, W / 2 - 0.6, 1.05, 0.02, [0.2, 0.16, 0.12], GT)
  for (let x = -W / 2 + 0.6; x <= W / 2 - 0.5; x += 2.4) box(out, x, 2.05, 0.17, 0.06, 1.05, 0.03, WHITE, WT)
  box(out, 0, 3.35, 0.18, W / 2, 0.05, 0.04, WHITE, WT)
  sign(out, { type: 'flat', w: 8.5, text: 'Hard Rock Cafe', h: 0.6, face: 'script', colour: RED, lit: 'self' }, { x: -3.5, y: 3.8, z: 0.16, heading: 0 })
  for (let k = 0; k < 16; k++) {
    const a0 = (k / 16) * Math.PI * 2, a1 = ((k + 1) / 16) * Math.PI * 2
    out.quad([[5, 3.8, 0.15], [5 + Math.cos(a0) * 0.75, 3.8 + Math.sin(a0) * 0.75, 0.15], [5 + Math.cos(a1) * 0.75, 3.8 + Math.sin(a1) * 0.75, 0.15], [5, 3.8, 0.15]],
      [0, 0, 1], UVQ, [0.85, 0.72, 0.4], MT)
  }
  sign(out, { type: 'flat', w: 1.4, text: 'Hard Rock', h: 0.22, face: 'script', colour: RED, lit: 'self' }, { x: 5, y: 3.8, z: 0.18, heading: 0 })
  for (const x of [-6, 6]) {
    box(out, x, 8.0, -0.3, 2.7, 0.8, 0.1, WHITE, MT)
    box(out, x, 8.0, -0.18, 2.55, 0.7, 0.03, BLUE, MT)
    sign(out, { type: 'flat', w: 5.0, text: 'PIER 39', h: 0.95, face: 'didone', weight: 'bold', colour: [0.98, 0.98, 0.96], lit: 'front' }, { x, y: 8.0, z: -0.13, heading: 0 })
    box(out, x, 6.6, -0.4, 0.09, 0.65, 0.09, [0.3, 0.3, 0.3], MT)
  }
  for (const x of [-7, -2.5, 2.5, 7]) {
    tube(out, [x, 0, 3.2], [x, 2.5, 3.2], 0.04, 4, [0.2, 0.2, 0.2], MT)
    for (let k = 0; k < 8; k++) {
      const a0 = (k / 8) * Math.PI * 2, a1 = ((k + 1) / 8) * Math.PI * 2
      out.quad([[x, 2.75, 3.2], [x + Math.cos(a0) * 1.4, 2.25, 3.2 + Math.sin(a0) * 1.4], [x + Math.cos(a1) * 1.4, 2.25, 3.2 + Math.sin(a1) * 1.4], [x, 2.75, 3.2]], [0, 1, 0], UVQ, [0.7, 0.12, 0.12], WT)
    }
  }
}

/**
 * SALT WATER PUMPING STATION No. 2, at the foot of Fort Mason by Aquatic Park (way/93703732, the fire department's 1912
 * high-pressure station; HAER CAL,38-SANFRA,143 and Commons "San Francisco Fire Dept Pumping Station No 2"): white
 * stucco, tall round-arched windows with many-paned sashes along every face, over each run of them a pent roof of red tile
 * on carved brackets, a parapet notched like battlements, the corner block stepping up higher, and the tall plain
 * concrete chimney rising from that corner — the landmark from the cove. Drawn on its box; the door on the shorter side.
 */
export function pumpingStation2(out: MeshBuilder, fit: Fit): void {
  const WALL: Rgb = [0.92, 0.91, 0.87], TILE: Rgb = [0.62, 0.28, 0.2], CON: Rgb = [0.74, 0.73, 0.7], FRAME: Rgb = [0.95, 0.95, 0.93]
  const hx = fit.hx, hz = fit.hz, H = 8.4
  box(out, 0, H / 2, 0, hx, H / 2, hz, WALL, ST)
  capPolygon(out, [{ x: -hx, z: -hz }, { x: hx, z: -hz }, { x: hx, z: hz }, { x: -hx, z: hz }], H, [0.5, 0.5, 0.5], CT)
  // each face: arched windows, a tile pent over them on brackets, the notched parapet
  const faces: { c: [number, number]; t: [number, number]; n: [number, number]; L: number; door: boolean }[] = [
    { c: [0, -hz], t: [1, 0], n: [0, -1], L: hx * 2, door: hx < hz },
    { c: [0, hz], t: [-1, 0], n: [0, 1], L: hx * 2, door: false },
    { c: [hx, 0], t: [0, 1], n: [1, 0], L: hz * 2, door: hz <= hx },
    { c: [-hx, 0], t: [0, -1], n: [-1, 0], L: hz * 2, door: false },
  ]
  for (const f of faces) {
    const P = (u: number, y: number, o: number): V3 => [f.c[0] + f.t[0] * u + f.n[0] * o, y, f.c[1] + f.t[1] * u + f.n[1] * o]
    const hd = Math.atan2(f.n[0], f.n[1])
    const n = Math.max(3, Math.floor((f.L - 4) / 3.4)), sp = (f.L - 4) / n
    for (let k = 0; k < n; k++) {
      const u = -f.L / 2 + 2 + sp * (k + 0.5)
      if (f.door && k === Math.floor(n / 2)) {
        const d = P(u, 1.3, 0.04)
        boxAlong(out, d[0], d[1], d[2], 0.9, 1.3, 0.04, hd, [0.82, 0.8, 0.74], WT)
        const c = P(u, 2.9, 0.06)
        boxAlong(out, c[0], c[1], c[2], 1.1, 0.12, 0.12, hd, FRAME, ST)
        continue
      }
      const w = Math.min(1.5, sp * 0.6)
      // the sash: glass with a white frame grid, the round head as a fan of panes
      const g = P(u, 3.2, 0.04)
      boxAlong(out, g[0], g[1], g[2], w / 2, 2.6, 0.03, hd, DARKGL, GT)
      for (const yy of [1.4, 2.6, 3.8, 5.0]) { const q = P(u, yy, 0.07); boxAlong(out, q[0], q[1], q[2], w / 2, 0.04, 0.02, hd, FRAME, WT) }
      for (const uu of [-w / 4, w / 4]) { const q = P(u + uu, 3.2, 0.07); boxAlong(out, q[0], q[1], q[2], 0.03, 2.6, 0.02, hd, FRAME, WT) }
      for (let a = 0; a < 6; a++) {
        const t0 = (a / 6) * Math.PI, t1 = ((a + 1) / 6) * Math.PI
        out.quad([P(u, 5.8, 0.05), P(u - Math.cos(t0) * w / 2, 5.8 + Math.sin(t0) * w / 2, 0.05), P(u - Math.cos(t1) * w / 2, 5.8 + Math.sin(t1) * w / 2, 0.05), P(u, 5.8, 0.05)],
          [f.n[0], 0, f.n[1]], UVQ, DARKGL, GT)
      }
    }
    // the tile pent on its brackets, the run of the face less the corners
    const r = f.L / 2 - 1.6
    out.quad([P(-r, 7.1, 0.05), P(r, 7.1, 0.05), P(r, 6.6, 1.3), P(-r, 6.6, 1.3)], [f.n[0] * 0.5, 0.85, f.n[1] * 0.5], UVQ, TILE, surfaceTag('tile'))
    for (let u = -r + 0.4; u <= r; u += 1.6) { const q = P(u, 6.55, 0.6); boxAlong(out, q[0], q[1], q[2], 0.08, 0.25, 0.6, hd, FRAME, ST) }
    // the notched parapet
    for (let u = -f.L / 2 + 0.8; u < f.L / 2 - 0.4; u += 2.6) { const q = P(u, H + 0.4, 0.0); boxAlong(out, q[0], q[1], q[2], 0.45, 0.4, 0.2, hd, WALL, ST) }
  }
  // the corner block, stepping up, and the chimney rising from it
  const cx = hx - 2.2, cz = hz - 2.2
  box(out, cx, (H + 2.2) / 2, cz, 2.3, (H + 2.2) / 2, 2.3, WALL, ST)
  for (const [ox, oz] of [[-1.7, -2.35], [1.7, -2.35], [-2.35, -1.7], [-2.35, 1.7]] as [number, number][]) box(out, cx + ox, H + 2.6, cz + oz, 0.4, 0.4, 0.4, WALL, ST)
  prism(out, cx, cz, H, H + 21, 1.0, 16, CON, CT)
  prism(out, cx, cz, H + 21, H + 21.4, 1.08, 16, [0.66, 0.65, 0.62], CT)
}

/**
 * THE AQUATIC PARK BOATHOUSES: the Dolphin Club (way/288391828) and the South End Rowing Club (way/288391837), side by
 * side on the beach at the foot of Jefferson (Commons "Dolphin Club and South End Rowing Club 20170906-8513"): two storeys
 * of white clapboard with blue trim on every corner, window and rail, a hipped roof of grey shingle, a balcony along the
 * beach side behind a blue-capped white railing, an octagonal white cupola with a little hip roof and a weathervane, and
 * the club's board over the boat doors — DOLPHIN CLUB in blue on white; the South End's "Since 1877" and its monogram.
 * Built on the outline as it is; the beach face is the ring's edge facing local −z (`front` in the manifest).
 */
function boathouse(name: string, sub?: string): (out: MeshBuilder, fit: Fit) => void {
  return (out, fit) => {
    const BLUE: Rgb = [0.13, 0.3, 0.6], ROOF: Rgb = [0.36, 0.37, 0.39]
    const ring = towerRing(fit)
    const H = 7.2
    faceBand(out, ring, 0, 3.4, { kind: 'punched', wall: WHITE, glass: DARKGL, floor: 3.4, pitch: 3.2, solid: 0.55, material: 'clapboard' })
    faceBand(out, offsetRing(ring, 0.05), 3.3, 3.5, { kind: 'blank', wall: BLUE, material: 'clapboard' })
    faceBand(out, ring, 3.5, H, { kind: 'bands', wall: WHITE, glass: DARKGL, floor: H - 3.5, solid: 0.45, material: 'clapboard' })
    faceBand(out, offsetRing(ring, 0.05), H - 0.25, H, { kind: 'blank', wall: BLUE, material: 'clapboard' })
    // the hipped roof
    let cx = 0, cz = 0
    for (const q of ring) { cx += q.x; cz += q.z }
    cx /= ring.length; cz /= ring.length
    const eave = offsetRing(ring, 0.5)
    const top = ring.map((q) => ({ x: cx + (q.x - cx) * 0.25, z: cz + (q.z - cz) * 0.25 }))
    const RISE = Math.min(3.2, Math.min(fit.hx, fit.hz) * 0.45)
    for (let i = 0; i < eave.length; i++) {
      const j = (i + 1) % eave.length
      const mx = (eave[i].x + eave[j].x) / 2 - cx, mz = (eave[i].z + eave[j].z) / 2 - cz, ml = Math.hypot(mx, mz) || 1
      out.quad([[eave[i].x, H, eave[i].z], [eave[j].x, H, eave[j].z], [top[j].x, H + RISE, top[j].z], [top[i].x, H + RISE, top[i].z]],
        [(mx / ml) * 0.7, 0.7, (mz / ml) * 0.7], UVQ, ROOF, surfaceTag('tile'))
    }
    capPolygon(out, top, H + RISE, ROOF, surfaceTag('tile'))
    // the cupola: an octagon of white boards and glass on the ridge, a little hip roof, the weathervane
    const Y = H + RISE
    prism(out, cx, cz, Y, Y + 1.6, 1.3, 8, WHITE, WT)
    prism(out, cx, cz, Y + 0.5, Y + 1.4, 1.33, 8, DARKGL, GT)
    prism(out, cx, cz, Y + 1.6, Y + 1.8, 1.55, 8, BLUE, WT)
    for (let k = 0; k < 8; k++) {
      const a0 = (k / 8) * Math.PI * 2, a1 = ((k + 1) / 8) * Math.PI * 2
      out.quad([[cx + Math.cos(a0) * 1.6, Y + 1.8, cz + Math.sin(a0) * 1.6], [cx + Math.cos(a1) * 1.6, Y + 1.8, cz + Math.sin(a1) * 1.6],
        [cx, Y + 2.9, cz], [cx, Y + 2.9, cz]], [Math.cos((a0 + a1) / 2) * 0.7, 0.7, Math.sin((a0 + a1) / 2) * 0.7], UVQ, ROOF, surfaceTag('tile'))
    }
    tube(out, [cx, Y + 2.9, cz], [cx, Y + 3.8, cz], 0.03, 4, [0.15, 0.15, 0.15], MT)
    box(out, cx + 0.25, Y + 3.6, cz, 0.3, 0.03, 0.02, [0.15, 0.15, 0.15], MT)
    // the beach face: the balcony on posts along it, its railing, and the club's board over the boat doors
    const e = frontEdge(ring, facingFront(ring, 6))
    slab(out, e, e.L / 2, 1.0, 3.3, e.L - 1, 0.2, 2.0, [0.55, 0.47, 0.38], WT)
    for (let u = 0.6; u <= e.L - 0.5; u += 2.4) slab(out, e, u, 1.9, 0, 0.16, 3.3, 0.16, WHITE, WT)
    slab(out, e, e.L / 2, 1.95, 4.4, e.L - 1, 0.08, 0.1, BLUE, WT)
    for (let u = 0.6; u <= e.L - 0.5; u += 0.4) slab(out, e, u, 1.95, 3.5, 0.05, 0.9, 0.05, WHITE, WT)
    slab(out, e, e.L / 2, 0.08, 2.35, Math.min(5, e.L * 0.6), 0.55, 0.06, WHITE, WT)
    signAt(out, e, e.L / 2, 2.62, 0.13, { type: 'flat', w: Math.min(5, e.L * 0.6) - 0.4, text: name, h: 0.3, face: sub ? 'script' : 'grotesque', weight: 'bold', colour: BLUE, lit: 'front' })
    if (sub) signAt(out, e, e.L / 2, 2.25, 0.13, { type: 'flat', w: Math.min(5, e.L * 0.6) - 0.4, text: sub, h: 0.18, face: 'grotesque', weight: 'bold', colour: BLUE, lit: 'front' })
    // the boat doors: two wide blue-framed doors under the board
    for (const d of [-1, 1]) {
      slab(out, e, e.L / 2 + d * 1.4, 0.04, 0, 2.4, 2.1, 0.06, WHITE, WT)
      slab(out, e, e.L / 2 + d * 1.4, 0.09, 0.05, 2.4, 0.08, 0.04, BLUE, WT)
      slab(out, e, e.L / 2 + d * 1.4, 0.09, 2.05, 2.4, 0.08, 0.04, BLUE, WT)
    }
  }
}


/* ================================================================================================================
 * THE WATER SIDE OF JEFFERSON, building by building (audit of 2026-10-17, owner: "most of the buildings on the water
 * side are white, low, and many have gabled roofs … more shoddy looking wood … every store is trying to get your
 * attention"). Each builder names the Mapillary image it follows; the ledger is in the audit's scratch folder.
 * ================================================================================================================ */

const TT = surfaceTag('tile')

/** the edge of `ring` whose outward normal points most nearly along (dx, dz), at least `min` long */
function edgeToward(ring: P2[], dx: number, dz: number, min = 3): Edge {
  let best = 0, score = -Infinity
  for (let i = 0; i < ring.length; i++) {
    const q = edgeAt(ring, i)
    if (q.L < min) continue
    const s = q.nx * dx + q.nz * dz
    if (s > score) { score = s; best = i }
  }
  return edgeAt(ring, best)
}

/** the part of `ring` on the near side of the line across edge `e` at `u` — `keepLow` keeps u below it */
function clipAcross(ring: P2[], e: Edge, u: number, keepLow: boolean): P2[] {
  const p = on(e, u, 0, 0), s = keepLow ? 1 : -1
  const cut = { ...e, a: { x: p[0], z: p[2] }, nx: e.tx * s, nz: e.tz * s }
  return clipBehind(ring, cut, 0)
}

/** the indices of `ring`'s edges that are NOT pieces of the front `e` (for drawing a ground floor everywhere but there) */
function offFront(ring: P2[], e: Edge): number[] {
  return ring.map((_, i) => i).filter((i) => {
    const q = edgeAt(ring, i)
    const onLine = Math.abs((q.mid.x - e.a.x) * e.nx + (q.mid.z - e.a.z) * e.nz) < 1.5
    return !(onLine && q.nx * e.nx + q.nz * e.nz > 0.9)
  })
}

/** a striped awning (two colours alternating across it), its valance lettered */
function stripedAwning(out: MeshBuilder, e: Edge, u: number, w: number, y: number, c1: Rgb, c2: Rgb, name: string, ink: Rgb, d = 1.5, face: SignSpec['face'] = 'grotesque'): void {
  const n = Math.max(3, Math.round(w / 0.55))
  for (let k = 0; k < n; k++) {
    const u0 = u - w / 2 + (w * k) / n, u1 = u - w / 2 + (w * (k + 1)) / n
    out.quad([on(e, u0, y + 0.75, 0.05), on(e, u1, y + 0.75, 0.05), on(e, u1, y, d), on(e, u0, y, d)], [e.nx * 0.6, 0.8, e.nz * 0.6], UVQ, k % 2 ? c2 : c1, WT)
  }
  slab(out, e, u, d, y - 0.4, w, 0.4, 0.04, c1, WT)
  if (name) signAt(out, e, u, y - 0.2, d + 0.03, { type: 'flat', text: name, h: 0.2, w: w * 0.88, face, weight: 'bold', colour: ink, lit: 'front' })
}

/** a white gooseneck "barn" lamp on the wall at `u`, `y` */
function barnLamp(out: MeshBuilder, e: Edge, u: number, y: number, c: Rgb = WHITE): void {
  tube(out, on(e, u, y - 0.3, 0.02), on(e, u, y, 0.05), 0.025, 4, c, MT)
  tube(out, on(e, u, y, 0.05), on(e, u, y + 0.1, 0.45), 0.025, 4, c, MT)
  const h = on(e, u, y - 0.02, 0.55)
  prism(out, h[0], h[2], h[1] - 0.14, h[1] + 0.06, 0.24, 8, c, MT, 0.06)
  box(out, h[0], h[1] - 0.16, h[2], 0.07, 0.03, 0.07, WARM, EMIT)
}

/** a dark shop window with goods in it — a few bright blocks on shelves behind the glass */
function goodsWindow(out: MeshBuilder, e: Edge, u: number, y0: number, w: number, h: number, seed: number): void {
  slab(out, e, u, -0.25, y0, w, h, 0.05, [0.95, 0.9, 0.75], EMIT)
  const C: Rgb[] = [[0.9, 0.2, 0.2], [0.2, 0.45, 0.85], [0.98, 0.8, 0.2], [0.2, 0.65, 0.4], [0.95, 0.5, 0.15], [0.85, 0.3, 0.6]]
  for (let r = 0; r < 3; r++) for (let k = 0; k < Math.max(2, Math.round(w / 0.5)); k++) {
    const uu = u - w / 2 + 0.25 + k * 0.5
    if (uu > u + w / 2 - 0.2) break
    slab(out, e, uu, -0.15, y0 + 0.1 + r * (h / 3), 0.38, h / 3 - 0.2, 0.12, C[(seed + r * 3 + k) % C.length], MT)
  }
  slab(out, e, u, 0.03, y0, w, h, 0.03, [0.32, 0.38, 0.42], GT)
}

/** a gabled shed on the fit's box: walls `E` high, ridge along local x (`ridgeX`) or z, eaves out `ov` */
function gabledBox(out: MeshBuilder, hx: number, hz: number, E: number, rise: number, wall: Rgb, roof: Rgb, ridgeX: boolean, wallTag = WT, roofTag = MT, ov = 0.4): void {
  box(out, 0, E / 2, 0, hx, E / 2, hz, wall, wallTag)
  const R = E + rise
  if (ridgeX) {
    for (const sx of [-1, 1]) out.quad([[sx * hx, E, -hz], [sx * hx, E, hz], [sx * hx, R, 0], [sx * hx, R, 0]], [sx, 0, 0], UVQ, wall, wallTag)
    for (const sz of [-1, 1]) out.quad([[-hx - ov, E - ov * rise / hz, sz * (hz + ov)], [hx + ov, E - ov * rise / hz, sz * (hz + ov)], [hx + ov, R + 0.05, 0], [-hx - ov, R + 0.05, 0]], [0, 0.8, sz * 0.6], UVQ, roof, roofTag)
  } else {
    for (const sz of [-1, 1]) out.quad([[-hx, E, sz * hz], [hx, E, sz * hz], [0, R, sz * hz], [0, R, sz * hz]], [0, 0, sz], UVQ, wall, wallTag)
    for (const sx of [-1, 1]) out.quad([[sx * (hx + ov), E - ov * rise / hx, -hz - ov], [sx * (hx + ov), E - ov * rise / hx, hz + ov], [0, R + 0.05, hz + ov], [0, R + 0.05, -hz - ov]], [sx * 0.6, 0.8, 0], UVQ, roof, roofTag)
  }
}

/** a low hipped roof over `ring` from `y`, rising `rise` to a ridge ring scaled by `k` toward the middle */
function hipOver(out: MeshBuilder, ring: P2[], y: number, rise: number, c: Rgb, tag: number, ov = 0.5, k = 0.3): void {
  let cx = 0, cz = 0
  for (const q of ring) { cx += q.x; cz += q.z }
  cx /= ring.length; cz /= ring.length
  const eave = offsetRing(ring, ov)
  const top = ring.map((q) => ({ x: cx + (q.x - cx) * k, z: cz + (q.z - cz) * k }))
  for (let i = 0; i < eave.length; i++) {
    const j = (i + 1) % eave.length
    const mx = (eave[i].x + eave[j].x) / 2 - cx, mz = (eave[i].z + eave[j].z) / 2 - cz, ml = Math.hypot(mx, mz) || 1
    out.quad([[eave[i].x, y, eave[i].z], [eave[j].x, y, eave[j].z], [top[j].x, y + rise, top[j].z], [top[i].x, y + rise, top[i].z]], [(mx / ml) * 0.6, 0.8, (mz / ml) * 0.6], UVQ, c, tag)
  }
  capPolygon(out, top, y + rise, c, tag)
}

/**
 * CAPURRO'S, 498 Jefferson at the Hyde Street Pier lane (way/288391839; Mapillary 1588899552070570, Aug 2025): one tall
 * storey of BARN-RED clapboard under a false front with stepped corners and a cream coping; CAPURRO'S in big raised
 * cream-gold capitals with "Restaurant & Bar" in script under them and CUCINA SICILIANA · SERVING FRESH FISH SINCE 1946
 * along a band; four windows and the door in frames painted like a Sicilian cart, a yellow patterned valance over each,
 * white gooseneck barn lamps along the top, a round logo disc standing off the west corner; on the sidewalk the patio of
 * painted planter boxes, a blue picket fence and yellow picnic tables. `front` 173: Jefferson is local −z, Hyde at −x.
 */
export function capurros(out: MeshBuilder, fit: Fit): void {
  const RED: Rgb = [0.66, 0.11, 0.1], CREAM: Rgb = [0.95, 0.88, 0.62], YEL: Rgb = [0.98, 0.82, 0.18], BLUE: Rgb = [0.18, 0.45, 0.85]
  const TEAL: Rgb = [0.15, 0.62, 0.62], DRED: Rgb = [0.42, 0.05, 0.05]
  const ring = towerRing(fit)
  const B = 5.4, H = 6.8
  faceBand(out, ring, 0, B, { kind: 'blank', wall: RED, material: 'clapboard' })
  capPolygon(out, ring, B, [0.42, 0.4, 0.4], MT)
  const e = frontEdge(ring, facingFront(ring, 8)), L = e.L
  const west = e.tx > 0 ? 0 : L, wd = e.tx > 0 ? 1 : -1          // u at the Hyde end, and the way east
  const U = (d: number): number => west + wd * d                     // d metres east of the west corner
  // the false front: red boards up to the coping, the corners stepping up, cream trim round it all
  slab(out, e, L / 2, -0.05, B, L, H - B - 0.3, 0.3, RED, WT)
  for (const s of [0, 1]) {
    const cu = s ? L - 1.2 : 1.2
    slab(out, e, cu, -0.05, H - 0.3, 2.4, 0.45, 0.3, RED, WT)
    slab(out, e, cu, 0.0, H + 0.15, 2.6, 0.16, 0.42, CREAM, WT)
    slab(out, e, cu > L / 2 ? L - 0.2 : 0.2, 0.08, 0, 0.4, H + 0.15, 0.2, CREAM, WT)   // the corner boards
  }
  slab(out, e, L / 2, 0.0, H - 0.4, L - 4.8, 0.14, 0.4, CREAM, WT)
  slab(out, e, L / 2, 0.06, 3.85, L, 0.12, 0.12, CREAM, WT)                             // the band's rule
  signAt(out, e, L / 2, H - 1.35, 0.12, { type: 'flat', text: "CAPURRO'S", h: 0.95, w: L * 0.62, face: 'slab', weight: 'bold', colour: CREAM, halo: DRED, lit: 'front', tracking: 0.04 })
  signAt(out, e, L / 2 + 1.2, B - 0.9, 0.1, { type: 'flat', text: 'Restaurant & Bar', h: 0.4, w: L * 0.3, face: 'script', colour: [0.98, 0.85, 0.7], lit: 'front' })
  signAt(out, e, L / 2, 4.25, 0.1, { type: 'flat', text: 'CUCINA SICILIANA · SERVING FRESH FISH SINCE 1946', h: 0.24, w: L * 0.82, face: 'grotesque', weight: 'bold', colour: CREAM, lit: 'front' })
  // the windows and the door, their frames painted in cart colours, a yellow valance over each, fish between
  const bays = [0.12, 0.3, 0.6, 0.8], door = 0.45
  for (const [k, f] of bays.entries()) {
    const u = U(f * L), w = Math.min(3.0, L * 0.15)
    goodsWindow(out, e, u, 0.9, w, 1.9, k)
    for (const [dy, hh] of [[0.8, 0.12], [2.8, 0.12]] as [number, number][]) slab(out, e, u, 0.06, dy, w + 0.3, hh, 0.08, [YEL, TEAL, BLUE, YEL][k], WT)
    for (const s of [-1, 1]) slab(out, e, u + s * (w / 2 + 0.08), 0.06, 0.8, 0.16, 2.1, 0.08, [TEAL, YEL, YEL, BLUE][k], WT)
    stripedAwning(out, e, u, w + 0.4, 3.1, YEL, [0.9, 0.3, 0.15], '', DRED, 0.6)
    const fu = u + (k % 2 ? 1 : -1) * (w / 2 + 0.55)
    const fp = on(e, fu, 2.2, 0.08)
    lozenge(out, fp, [e.tx, 0, e.tz], [0, 1, 0], [e.nx, 0, e.nz], 0.42, 0.16, 0.04, [0.7, 0.74, 0.78], MT, 10)
  }
  const du = U(door * L)
  slab(out, e, du, 0.04, 0, 2.2, 2.6, 0.05, [0.2, 0.14, 0.1], WT)
  slab(out, e, du, 0.07, 0.15, 1.7, 2.2, 0.03, [0.3, 0.36, 0.4], GT)
  slab(out, e, du, 0.06, 2.6, 2.6, 0.25, 0.08, YEL, WT)
  for (let u = 1.6; u < L - 1; u += 2.6) barnLamp(out, e, u, 3.55)
  // the logo disc, standing off the west corner on a bracket: a cream disc in a red rim, both faces
  const lc = on(e, west, 4.7, 0.9)
  tube(out, on(e, west, 5.4, 0), [lc[0], 5.4, lc[2]], 0.04, 4, [0.2, 0.2, 0.2], MT)
  const hd = e.heading + Math.PI / 2
  lozenge(out, lc, [e.nx, 0, e.nz], [0, 1, 0], [Math.sin(hd), 0, Math.cos(hd)], 0.72, 0.72, 0.12, [0.66, 0.1, 0.1], MT, 20)
  sign(out, { type: 'flat', text: "CAPURRO'S", h: 0.12, face: 'slab', weight: 'bold', colour: [0.3, 0.05, 0.05], panel: CREAM, lit: 'front', ring: { below: 'RESTAURANT & BAR' }, twoSided: true },
    { x: lc[0], y: lc[1], z: lc[2], heading: hd })
  // the lane (Hyde Street Pier) face: the red board and its name again (Mapillary 1126088902792319)
  const lane = edgeToward(ring, -e.tx * wd, -e.tz * wd, 4)
  slab(out, lane, lane.L / 2, 0.02, B - 0.4, lane.L - 0.4, 1.6, 0.12, RED, WT)
  signAt(out, lane, lane.L / 2, B + 0.35, 0.1, { type: 'flat', text: "CAPURRO'S", h: 0.75, w: lane.L * 0.7, face: 'slab', weight: 'bold', colour: CREAM, halo: DRED, lit: 'front' })
  for (let u = 1.5; u < lane.L - 1; u += 2.6) barnLamp(out, lane, u, 3.55)
  // the patio on the sidewalk: painted planter boxes and a blue picket fence 2.6 m out, yellow picnic tables inside
  const PC: Rgb[] = [[0.2, 0.4, 0.85], [0.95, 0.75, 0.15], [0.85, 0.2, 0.2], [0.15, 0.6, 0.55]]
  for (let u = 0.8, k = 0; u < L - 0.8; u += 2.2, k++) {
    if (Math.abs(u - du) < 1.6) continue
    if (k % 2 === 0) {
      slab(out, e, u, 2.6, 0, 1.6, 0.6, 0.55, PC[k % PC.length], WT)
      const g = on(e, u, 0.6, 2.6)
      prism(out, g[0], g[2], 0.6, 1.05, 0.55, 6, [0.25, 0.5, 0.22], FT, 0.25)
    } else {
      slab(out, e, u, 2.6, 0, 2.0, 0.1, 0.06, BLUE, WT)
      for (let p = -0.9; p <= 0.9; p += 0.3) slab(out, e, u + p, 2.6, 0, 0.09, 1.0, 0.05, BLUE, WT)
      slab(out, e, u, 2.6, 0.75, 2.0, 0.09, 0.06, BLUE, WT)
      slab(out, e, u, 1.45, 0.7, 1.6, 0.06, 0.75, YEL, WT)                  // a picnic table
      for (const s of [-1, 1]) slab(out, e, u, 1.45 + s * 0.6, 0.42, 1.6, 0.05, 0.25, YEL, WT)
      for (const s of [-0.6, 0.6]) slab(out, e, u + s, 1.45, 0, 0.08, 0.7, 0.6, YEL, WT)
    }
  }
}

/**
 * 490 JEFFERSON (way/288391830; Mapillary 700777169642818, 3765812980391910, Aug 2025): the empty Port building next to
 * Capurro's — grey-beige clapboard, a two-storey MISSION FALSE FRONT whose parapet swells into a round hump over the
 * middle between stepped shoulders, a row of little clerestory windows under it, and a one-storey front of panelled
 * boards over three open garage bays (LEASE OPPORTUNITIES). `front` 173: Jefferson is local −z.
 */
export function jefferson490(out: MeshBuilder, fit: Fit): void {
  const W: Rgb = [0.74, 0.72, 0.66], TR: Rgb = [0.84, 0.82, 0.77], IN: Rgb = [0.8, 0.78, 0.73]
  const ring = towerRing(fit)
  const H = 7.4
  const e = frontEdge(ring, facingFront(ring, 6)), L = e.L
  faceBand(out, ring, 0, 4.0, { kind: 'blank', wall: W, material: 'clapboard' }, offFront(ring, e))
  faceBand(out, ring, 4.0, H, { kind: 'blank', wall: W, material: 'clapboard' })
  capPolygon(out, ring, H, [0.5, 0.5, 0.5], MT)
  // the one-storey front: three open bays recessed 2.4 m, panelled boards over them, a cornice
  const n = 3, bw = (L - 1.2) / n
  for (let k = 0; k < n; k++) {
    const u = 0.6 + bw * (k + 0.5)
    slab(out, e, u, -1.25, 0, bw - 0.5, 4.0, 2.4, [0.22, 0.21, 0.2], CT)          // the hollow of the bay
    slab(out, e, u, -2.45, 0.02, bw - 0.6, 3.9, 0.06, IN, WT)                       // its back wall, a door in it
    slab(out, e, u, -2.38, 0, 1.6, 2.4, 0.05, [0.92, 0.9, 0.86], WT)
  }
  for (let k = 0; k <= n; k++) slab(out, e, 0.6 + bw * k, 0.05, 0, 0.45, 4.1, 0.3, TR, WT)
  for (let k = 0; k < 4; k++) slab(out, e, 0.6 + ((L - 1.2) * (k + 0.5)) / 4, 0.1, 4.4, (L - 1.2) / 4 - 0.3, 0.9, 0.06, IN, WT)
  slab(out, e, L / 2, 0.2, 5.45, L, 0.2, 0.5, TR, WT)
  signAt(out, e, 0.6 + bw * 2 + 0.08, 2.3, 0.22, { type: 'flat', text: '490', h: 0.28, w: 0.4, face: 'grotesque', weight: 'bold', colour: [0.25, 0.25, 0.25], lit: 'none', vertical: true })
  signAt(out, e, L / 2, 4.0, 0.12, { type: 'flat', text: 'LEASE OPPORTUNITIES', h: 0.1, w: 1.2, face: 'grotesque', weight: 'bold', colour: [0.15, 0.3, 0.6], panel: [1, 1, 1], lit: 'none' })
  // the clerestory windows, and the Mission parapet: shoulders stepping up to a round hump in the middle
  for (let k = 0; k < 5; k++) slab(out, e, L * (0.2 + k * 0.15), 0.04, 6.3, 1.3, 0.35, 0.05, DARKGL, GT)
  slab(out, e, L / 2, 0.0, H, L - 0.4, 0.8, 0.3, W, WT)
  for (const s of [-1, 1]) slab(out, e, L / 2 + s * (L / 2 - 0.6), 0.0, H, 1.2, 1.3, 0.34, W, WT)
  for (const s of [-1, 1]) slab(out, e, L / 2 + s * 2.8, 0.0, H, 1.6, 1.2, 0.32, W, WT)
  const R = Math.min(2.6, L * 0.17), cy = H + 0.8
  for (let k = 0; k < 12; k++) {
    const a0 = (k / 12) * Math.PI, a1 = ((k + 1) / 12) * Math.PI
    const P = (a: number, r: number, o: number): V3 => on(e, L / 2 + Math.cos(a) * r, cy + Math.sin(a) * r * 0.75, o)
    out.quad([P(a0, 0, 0.02), P(a0, R, 0.02), P(a1, R, 0.02), P(a1, 0, 0.02)], [e.nx, 0, e.nz], UVQ, W, WT)
    out.quad([P(a0, 0, -0.3), P(a1, 0, -0.3), P(a1, R, -0.3), P(a0, R, -0.3)], [-e.nx, 0, -e.nz], UVQ, W, WT)
    tube(out, P(a0, R + 0.06, 0.05), P(a1, R + 0.06, 0.05), 0.09, 4, TR, WT)
  }
  slab(out, e, L / 2, 0.06, cy - 0.2, L - 0.4, 0.14, 0.12, TR, WT)
}

/**
 * ALIOTO–LAZIO FISH CO., 440 Jefferson (way/229326475; Mapillary 1348062383560287, Aug 2025): the working fish market — a
 * plain white two-storey block, F. ALIOTO FISH CO. small over ALIOTO - LAZIO in red across the front, a steel-sashed
 * window above, two big open bays framed in blue full of crates and yellow signs. `front` 173: Jefferson is local −z.
 */
export function aliotoLazio(out: MeshBuilder, fit: Fit): void {
  const W: Rgb = [0.95, 0.95, 0.93], BLUE: Rgb = [0.16, 0.32, 0.66], RED: Rgb = [0.75, 0.12, 0.12], YEL: Rgb = [0.98, 0.85, 0.15]
  const ring = towerRing(fit)
  const H = 8
  faceBand(out, ring, 0, H, { kind: 'blank', wall: W, material: 'stucco' })
  faceBand(out, offsetRing(ring, 0.08), H - 0.35, H + 0.4, { kind: 'blank', wall: W, material: 'stucco' })
  capPolygon(out, ring, H, [0.5, 0.5, 0.5], CT)
  const e = frontEdge(ring, facingFront(ring, 6)), L = e.L
  const bw = Math.min(4.2, (L - 3) / 2.4)
  for (const f of [0.38, 0.72]) {
    const u = L * f
    slab(out, e, u, -1.2, 0, bw, 3.6, 2.2, [0.12, 0.12, 0.13], CT)
    goodsWindow(out, e, u, 0.2, bw - 0.4, 2.6, Math.round(f * 10))
    for (const s of [-1, 1]) slab(out, e, u + s * (bw / 2 + 0.12), 0.04, 0, 0.25, 3.8, 0.12, BLUE, MT)
    slab(out, e, u, 0.04, 3.65, bw + 0.5, 0.22, 0.12, BLUE, MT)
    slab(out, e, u, 0.12, 3.0, bw * 0.55, 0.5, 0.05, YEL, MT)
    signAt(out, e, u, 3.25, 0.16, { type: 'flat', text: f < 0.5 ? 'FRESH CRAB' : 'LIVE CRAB', h: 0.2, w: bw * 0.5, face: 'block', colour: RED, lit: 'front' })
  }
  slab(out, e, L * 0.92, 0.03, 0, 1.0, 2.2, 0.04, [0.4, 0.42, 0.45], MT)
  signAt(out, e, L * 0.55, 5.1, 0.06, { type: 'flat', text: 'F. ALIOTO FISH CO.', h: 0.22, w: L * 0.4, face: 'grotesque', weight: 'bold', colour: [0.25, 0.25, 0.28], lit: 'front' })
  signAt(out, e, L * 0.55, 4.45, 0.06, { type: 'flat', text: 'ALIOTO - LAZIO', h: 0.5, w: L * 0.6, face: 'grotesque', weight: 'bold', colour: RED, lit: 'front', tracking: 0.08 })
  gridWindow(out, e, L * 0.75, 5.6, 2.0, 1.4, 4, 3, [0.25, 0.27, 0.28])
}

/**
 * THE JEFFERSON & TAYLOR CORNER BLOCK (way/103339436 — NOT Alioto's, which is the next way north on Taylor; Mapillary
 * 1280197440176160, 2217044922129857, 958597956412771 (Aug 2025), 1048502846417659, 205306128566845 (Jun 2022)):
 *  · TARANTINO'S, the west two-thirds on Jefferson: two storeys of pale grey stucco under a low hipped roof, a teal-green
 *    ground floor behind a RED-BROWN TIMBER PERGOLA standing out over the sidewalk, green awnings (Tarantino's, FINE WINE
 *    BEER COCKTAILS, DUNGENESS CRAB est. 1946), and on the roof its tall T sign — a green "Tarantino's" board over a
 *    vertical RESTAURANT blade on a steel truss;
 *  · GUARDINO'S on the corner: a one-storey white stall under a grey shingle pent roof on posts wrapping the corner, a
 *    white parapet box over it with GUARDINO'S in blue on both streets;
 *  · up Taylor, the crab stands under their awnings: a green one with the crab, SABELLA & LA TORRE (cream parapet board,
 *    navy awning), NICK'S LIGHTHOUSE (maroon awning, the LIGHTHOUSE board painted above), blue-checked tables out front.
 * `front` 171: Jefferson is local −z; Taylor is the +x end.
 */
export function taylorCorner(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.78, 0.77, 0.74], TEALG: Rgb = [0.22, 0.42, 0.38], GREEN: Rgb = [0.05, 0.36, 0.26], TIMBER: Rgb = [0.55, 0.25, 0.18]
  const SH: Rgb = [0.34, 0.34, 0.35], NAVY: Rgb = [0.1, 0.16, 0.42], MAROON: Rgb = [0.45, 0.1, 0.12], CREAMB: Rgb = [0.93, 0.9, 0.78], GBLUE: Rgb = [0.12, 0.45, 0.78]
  const ring = towerRing(fit)
  const e = frontEdge(ring, facingFront(ring, 10)), L = e.L
  const tay = e.tx > 0 ? L : 0, dir = e.tx > 0 ? -1 : 1                       // u at the Taylor corner, and the way west
  const U = (d: number): number => tay + dir * d
  const GW = 9                                                                 // Guardino's frontage on each street
  // the one-storey stalls everywhere first: white boards, 4.4 m, a flat roof
  faceBand(out, ring, 0, 4.4, { kind: 'bands', wall: WHITE, glass: [0.3, 0.33, 0.35], floor: 4.4, solid: 0.45, material: 'clapboard' })
  capPolygon(out, ring, 4.4, [0.45, 0.45, 0.45], MT)
  // TARANTINO'S: the part of the block west of Guardino's, back to 24 m from Jefferson
  const tRing = clipBehind(clipAcross(ring, e, U(GW + 1), dir > 0 ? false : true), { ...e, a: on2(e, 0, -24), nx: -e.nx, nz: -e.nz }, 0)
  if (tRing.length >= 3) {
    faceBand(out, tRing, 0, 3.6, { kind: 'punched', wall: TEALG, glass: DARKGL, floor: 3.6, pitch: 3.4, solid: 0.45, material: 'clapboard' })
    faceBand(out, tRing, 3.6, 7.6, { kind: 'bands', wall: GREY, glass: [0.35, 0.38, 0.4], floor: 4, solid: 0.55, material: 'stucco' })
    hipOver(out, tRing, 7.6, 1.6, [0.52, 0.52, 0.5], MT, 0.7, 0.45)
  }
  const t0 = GW + 1.5, t1 = L - 0.5                                            // Tarantino's run along Jefferson (metres from Taylor)
  // the pergola: posts 2.2 m out every ~4.5 m, two beams, rafters back to the wall
  for (let d = t0; d <= t1 + 0.01; d += (t1 - t0) / Math.max(1, Math.round((t1 - t0) / 4.5))) {
    slab(out, e, U(d), 2.2, 0, 0.32, 6.6, 0.32, TIMBER, WT)
    slab(out, e, U(d), 1.1, 6.3, 0.18, 0.28, 2.3, TIMBER, WT)
  }
  for (const y of [5.4, 6.4]) slab(out, e, U((t0 + t1) / 2), 2.2, y, t1 - t0 + 0.4, 0.3, 0.26, TIMBER, WT)
  for (let d = t0; d < t1; d += 1.1) slab(out, e, U(d), 1.2, 6.7, 0.1, 0.16, 2.4, TIMBER, WT)
  // its awnings under the pergola
  const aw: [string, number][] = [["Tarantino's", 0.25], ['FINE WINE · BEER · COCKTAILS', 0.55], ['DUNGENESS CRAB est. 1946', 0.82]]
  for (const [txt, f] of aw) {
    const u = U(t0 + (t1 - t0) * f), w = Math.min(6.5, (t1 - t0) * 0.28)
    awning(out, e, u, w, 3.0, GREEN, txt, WHITE, 1.3)
  }
  signAt(out, e, U(t0 + (t1 - t0) * 0.25), 3.45, 0.75, { type: 'flat', text: "Tarantino's", h: 0.38, w: 4.5, face: 'script', colour: WHITE, lit: 'front' })
  // the T sign on the roof: a steel lattice mast, the vertical RESTAURANT blade, the green name board across the top
  const m = on(e, U(t0 + (t1 - t0) * 0.3), 0, -12)
  for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [0.6, 0.6], [-0.6, 0.6]]) tube(out, [m[0] + dx, 8.4, m[2] + dz], [m[0] + dx * 0.4, 14.5, m[2] + dz * 0.4], 0.06, 4, [0.6, 0.6, 0.62], MT)
  for (let y = 9; y < 14.5; y += 1.4) tube(out, [m[0] - 0.55, y, m[2] - 0.55], [m[0] + 0.55, y + 0.7, m[2] + 0.55], 0.03, 4, [0.6, 0.6, 0.62], MT)
  const blade = { ...e, a: { x: m[0], z: m[2] } }
  slab(out, blade, 0, 0.7, 10.0, 1.1, 4.6, 0.25, [0.9, 0.9, 0.86], MT)
  sign(out, { type: 'flat', text: 'RESTAURANT', h: 0.34, w: 4.2, face: 'grotesque', weight: 'bold', colour: [0.1, 0.35, 0.3], lit: 'front', vertical: true },
    { x: m[0] + e.nx * 0.84, y: 12.3, z: m[2] + e.nz * 0.84, heading: e.heading })
  slab(out, blade, 0, 0.7, 14.6, 5.2, 1.5, 0.3, [0.2, 0.55, 0.45], MT)
  slab(out, blade, 0, 0.86, 14.75, 4.9, 1.2, 0.03, [0.92, 0.94, 0.9], MT)
  sign(out, { type: 'flat', text: "Tarantino's", h: 0.6, w: 4.6, face: 'script', colour: [0.1, 0.4, 0.32], lit: 'self', twoSided: true },
    { x: m[0] + e.nx * 0.9, y: 15.35, z: m[2] + e.nz * 0.9, heading: e.heading })
  // GUARDINO'S: the pent roof on posts round the corner, the parapet box over it, its name on both streets
  const tf = edgeToward(ring, e.tx * -dir, e.tz * -dir, 6)                     // Taylor's face
  const tc = (tf.a.x - (e.a.x + e.tx * tay)) * tf.tx + (tf.a.z - (e.a.z + e.tz * tay)) * tf.tz   // corner's u on Taylor (negated)
  const tdir = Math.abs(tc) < 2 ? 1 : -1, t0u = Math.abs(tc) < 2 ? 0 : tf.L      // Taylor's u at the corner, and its way north
  const T = (d: number): number => t0u + tdir * d
  for (const [q, uu, dd] of [[e, U(GW / 2), 1], [tf, T(GW / 2), tdir]] as [Edge, number, number][]) {
    void dd
    out.quad([on(q, uu - GW / 2 - 0.1, 3.9, 0.05), on(q, uu + GW / 2 + 0.1, 3.9, 0.05), on(q, uu + GW / 2 + 0.1, 3.0, 2.3), on(q, uu - GW / 2 - 0.1, 3.0, 2.3)], [q.nx * 0.5, 0.85, q.nz * 0.5], UVQ, SH, TT)
    slab(out, q, uu, 2.3, 2.9, GW + 0.2, 0.14, 0.12, WHITE, WT)
    for (let k = 0; k <= 3; k++) slab(out, q, uu - GW / 2 + (GW * k) / 3, 2.2, 0, 0.2, 3.0, 0.2, [0.4, 0.33, 0.25], WT)
    slab(out, q, uu, -1.0, 4.4, GW, 1.4, 0.2, WHITE, WT)
    signAt(out, q, uu, 5.1, -0.87, { type: 'flat', text: "GUARDINO'S", h: 0.75, w: GW - 1, face: 'block', colour: GBLUE, halo: [0.95, 0.95, 0.98], lit: 'front' })
    goodsWindow(out, q, uu, 0.6, GW * 0.5, 2.0, 3)
  }
  // up Taylor: the crab stands
  const stands: [string, Rgb, Rgb, string | null, Rgb][] = [
    ["CRAB STATION · SEAFOOD", GREEN, WHITE, null, WHITE],
    ['Sabella & LaTorre · Since 1927', NAVY, WHITE, 'SABELLA ⁄ LA TORRE', CREAMB],
    ["NICK'S LIGHTHOUSE · FRESH FISH · PASTA", MAROON, WHITE, 'LIGHTHOUSE', [0.55, 0.72, 0.85]],
  ]
  const run = Math.max(6, tf.L - GW - 0.5), sw = run / stands.length
  stands.forEach(([name, c, ink, board, bc], k) => {
    const uu = T(GW + 0.3 + sw * (k + 0.5))
    goodsWindow(out, tf, uu, 0.8, sw - 1.6, 1.6, k + 4)
    slab(out, tf, uu, 0.6, 0.85, sw - 1.4, 0.15, 1.0, [0.85, 0.87, 0.9], MT)            // the counter / ice bed
    awning(out, tf, uu, sw - 0.4, 3.2, c, name, ink, 1.8)
    if (board) {
      slab(out, tf, uu, 0.15, 4.4, sw - 0.6, 1.1, 0.12, bc, WT)
      signAt(out, tf, uu, 4.95, 0.23, { type: 'flat', text: board, h: 0.5, w: sw - 1.2, face: k === 1 ? 'grotesque' : 'didone', weight: 'bold', colour: k === 1 ? [0.15, 0.15, 0.2] : MAROON, lit: 'front' })
    }
    // blue-checked tables on the sidewalk
    for (const s of [-1, 1]) {
      const p = on(tf, uu + s * sw * 0.25, 0.75, 3.0)
      box(out, p[0], 0.75, p[2], 0.45, 0.03, 0.45, [0.3, 0.5, 0.85], WT)
      tube(out, [p[0], 0, p[2]], [p[0], 0.73, p[2]], 0.03, 4, [0.2, 0.2, 0.2], MT)
    }
  })
}

/** a point `o` out from edge `e`'s first corner along its normal, `u` along it, as a P2 */
function on2(e: Edge, u: number, o: number): P2 { return { x: e.a.x + e.tx * u + e.nx * o, z: e.a.z + e.tz * u + e.nz * o } }

/**
 * ALIOTO'S No. 8, on Taylor between Nick's Lighthouse and the Grotto (way/103339444; Mapillary 665751065030692,
 * 668559711440485 (Jun 2022), 1526843651633790 (Aug 2025)): three storeys of TERRACOTTA-ORANGE stucco; at the Jefferson
 * end a tall plain stair tower with the big turquoise 8 on it; the dining floor above in a band of dark glass under a
 * deep brown bracketed eave, white half-moon valances in its windows; on the roof edge the turquoise ALIOTO'S board and
 * behind it the green neon "Alioto's" script sign; on the street a long dark-green awning "ALIOTO'S since 1925", a little
 * terracotta pediment over the door and a steel stair up the tower's side. Closed 2020 and demolished January 2026 for
 * Alioto's Plaza (opened 2 September 2026) — modelled as it stood, the owner to decide. `front` 90: Taylor is local −z,
 * north the +x end.
 */
export function aliotos8(out: MeshBuilder, fit: Fit): void {
  const TC: Rgb = [0.66, 0.37, 0.28], TCD: Rgb = [0.55, 0.3, 0.23], TURQ: Rgb = [0.25, 0.68, 0.66], BROWN: Rgb = [0.3, 0.2, 0.14], GREEN: Rgb = [0.08, 0.26, 0.18]
  const ring = towerRing(fit)
  const H = 11
  faceBand(out, ring, 0, 3.6, { kind: 'blank', wall: TCD, material: 'stucco' })
  faceBand(out, ring, 3.6, H, { kind: 'punched', wall: TC, glass: DARKGL, floor: (H - 3.6) / 2, pitch: 3.2, solid: 0.55, material: 'stucco' })
  capPolygon(out, ring, H, [0.45, 0.42, 0.4], CT)
  const e = frontEdge(ring, facingFront(ring, 8)), L = e.L
  const south = e.tx > 0 ? 0 : L, nd = e.tx > 0 ? 1 : -1
  const N = (d: number): number => south + nd * d
  // the stair tower at the south end, its 8 facing Taylor and Jefferson
  const TW = 6
  const tp = on(e, N(TW / 2), 0, -4)
  boxAlong(out, tp[0], 7.4, tp[2], TW / 2, 7.4, 4, e.heading, TC, ST)
  signAt(out, e, N(TW / 2), 11.0, 0.06, { type: 'flat', text: '8', h: 3.4, w: 3.6, face: 'grotesque', weight: 'bold', colour: TURQ, halo: [0.1, 0.25, 0.25], lit: 'self' })
  const sth = edgeToward(ring, -e.tx * nd, -e.tz * nd, 3)
  signAt(out, sth, sth.L / 2, 11.0, 4 + 0.06 - Math.min(4, sth.L / 2), { type: 'flat', text: '8', h: 3.0, w: 3.2, face: 'grotesque', weight: 'bold', colour: TURQ, lit: 'self' })
  // the steel stair zigzagging up the tower's north side, on the Taylor face
  for (let k = 0; k < 3; k++) {
    const y0 = 3.6 + k * 2.4
    tube(out, on(e, N(TW + 0.3 + (k % 2 ? 3 : 0)), y0, 0.6), on(e, N(TW + 0.3 + (k % 2 ? 0 : 3)), y0 + 2.4, 0.6), 0.05, 4, [0.25, 0.25, 0.27], MT)
  }
  // the dining floor: a band of dark glass between terracotta mullions, white half-moon valances, the brown bracketed eave
  const g0 = TW + 0.5, g1 = L - 0.5
  slab(out, e, N((g0 + g1) / 2), 0.04, 6.3, g1 - g0, 3.4, 0.05, DARKGL, GT)
  for (let d = g0; d <= g1 + 0.01; d += (g1 - g0) / Math.max(1, Math.round((g1 - g0) / 2.4))) slab(out, e, N(d), 0.1, 6.3, 0.3, 3.4, 0.16, TC, ST)
  for (let d = g0 + 1.2; d < g1; d += 2.4) {
    for (let s = 0; s < 6; s++) {
      const a0 = (s / 6) * Math.PI, a1 = ((s + 1) / 6) * Math.PI, c = on(e, N(d), 9.6, 0.12)
      const P = (a: number): V3 => [c[0] + e.tx * nd * Math.cos(a) * 1.0, 9.6 - Math.sin(a) * 0.7, c[2] + e.tz * nd * Math.cos(a) * 1.0]
      out.quad([c, P(a0), P(a1), c], [e.nx, 0, e.nz], UVQ, [0.96, 0.95, 0.92], WT)
    }
  }
  slab(out, e, N((g0 + g1) / 2), 0.7, 9.8, g1 - g0 + 0.6, 0.45, 1.4, BROWN, WT)
  for (let d = g0; d <= g1; d += 1.6) slab(out, e, N(d), 0.55, 9.3, 0.18, 0.5, 1.0, BROWN, WT)
  // the roof board on the Taylor edge, and the green neon script behind
  slab(out, e, N((g0 + g1) / 2), 0.1, H, Math.min(13, g1 - g0), 1.7, 0.15, TURQ, MT)
  signAt(out, e, N((g0 + g1) / 2), H + 0.85, 0.2, { type: 'flat', text: "ALIOTO'S", h: 1.15, w: Math.min(12, g1 - g0 - 1), face: 'didone', weight: 'bold', colour: [0.08, 0.2, 0.2], lit: 'front', tracking: 0.12 })
  const ns = on(e, N(L * 0.45), 0, -10)
  const sb = { ...sth, a: { x: ns[0] - sth.tx * 4, z: ns[2] - sth.tz * 4 } }
  for (const s of [-2.5, 2.5]) tube(out, on(sb, 4 + s, H, -0.4), on(sb, 4 + s, H + 3.0, 0), 0.06, 4, [0.4, 0.4, 0.42], MT)
  lozenge(out, on(sb, 4, H + 2.6, 0), [sb.tx, 0, sb.tz], [0, 1, 0], [sb.nx, 0, sb.nz], 4.2, 1.1, 0.2, [0.45, 0.72, 0.55], MT, 18)
  signAt(out, sb, 4, H + 2.6, 0.12, { type: 'flat', text: "Alioto's", h: 0.9, w: 6.6, face: 'script', colour: [0.4, 1.0, 0.55], halo: GREEN, lit: 'self' })
  // the street: the green awning along Taylor, the terracotta pediment over the door
  awning(out, e, N((g0 + L * 0.65) / 2), L * 0.65 - g0, 3.0, GREEN, '', WHITE, 1.4)
  signAt(out, e, N((g0 + L * 0.65) / 2), 3.4, 0.8, { type: 'flat', text: "ALIOTO'S", h: 0.42, w: 5, face: 'roman', colour: [0.95, 0.94, 0.88], lit: 'front', tracking: 0.08 })
  signAt(out, e, N((g0 + L * 0.65) / 2), 2.95, 1.2, { type: 'flat', text: 'since 1925', h: 0.2, w: 3, face: 'roman', colour: [0.95, 0.94, 0.88], lit: 'front' })
  const pu = N(L * 0.8)
  slab(out, e, pu, 0.6, 2.7, 3.6, 1.0, 1.2, TC, ST)
  for (const s of [-1, 1]) out.quad([on(e, pu - 1.9, 3.7, 1.25 + (s > 0 ? 0 : -1.2)), on(e, pu + 1.9, 3.7, 1.25 + (s > 0 ? 0 : -1.2)), on(e, pu, 5.1, 1.25 + (s > 0 ? 0 : -1.2)), on(e, pu, 5.1, 1.25 + (s > 0 ? 0 : -1.2))], [e.nx * s, 0, e.nz * s], UVQ, TC, ST)
  awning(out, e, pu, 3.4, 2.6, GREEN, 'CRAB STAND', WHITE, 1.6)
}

/**
 * THE FRANCISCAN CRAB RESTAURANT, Pier 43½ (way/288472567; Mapillary 1190184554941387, 190325623495572, 1805446189820665,
 * Jun 2022, and two owner photos 2026-10-17): white STREAMLINE MODERNE. At the west, a two-storey ROUNDED PAVILION — a
 * curved wall of tall dark glass between white tapering fins under a deep oversailing roof with three thin dark-blue
 * speed lines on its fascia and a row of blue seagull cut-outs on the edge; a royal-blue base and the Pier 43½ shop with
 * red-framed windows under a scalloped canopy. Out to the street the ROUNDED CORNER TOWER: a white band of round
 * PORTHOLES with "Franciscan Crab Restaurant" in script, teal glass between white columns over it, a rounded balcony of
 * three white speed-line rails, and a crown of stacked white rings. East of it the tall plain parapet wall with its
 * stepped coping: FRANCISCAN in big dark capitals, CRAB RESTAURANT in red under it, the crab-and-mermaid emblem, three
 * wavy lines; below, the black canopy over Frankie's / Pier 43 and WORLD FAMOUS FISHWICH, orange bollards at the kerb.
 * `front` 180: the Embarcadero is local −z.
 */
export function franciscanCrab(out: MeshBuilder, fit: Fit): void {
  const W: Rgb = [0.96, 0.96, 0.95], NAVY: Rgb = [0.12, 0.18, 0.4], TEAL: Rgb = [0.18, 0.62, 0.7], RBLUE: Rgb = [0.15, 0.3, 0.75], RED: Rgb = [0.8, 0.12, 0.1]
  const DGR: Rgb = [0.24, 0.25, 0.27], BLACK: Rgb = [0.08, 0.08, 0.09]
  const ring = towerRing(fit)
  // the tower: the ring's corner standing furthest out toward the street
  let ti = 0
  for (let i = 0; i < ring.length; i++) if (ring[i].z < ring[ti].z) ti = i
  const tq = ring[ti]
  const e = frontEdge(ring, facingFront(ring, 8)), L = e.L
  const tu = (tq.x - e.a.x) * e.tx + (tq.z - e.a.z) * e.tz
  const wEnd = tu < L / 2 ? 0 : L, wd = tu < L / 2 ? 1 : -1                     // the pavilion's end, and the way east
  const split = Math.abs(tu - wEnd) + 3                                         // pavilion to the west of here, parapet east
  // the whole: white walls to 4.2 (the shops), then the two parts above
  faceBand(out, ring, 0, 0.7, { kind: 'blank', wall: RBLUE, material: 'stucco' })
  faceBand(out, ring, 0.7, 4.2, { kind: 'curtain', wall: W, glass: [0.2, 0.22, 0.25], pitch: 2.4, material: 'stucco' })
  const west = clipAcross(ring, e, wEnd + wd * split, wd > 0)
  const east = clipAcross(ring, e, wEnd + wd * split, wd < 0)
  if (west.length >= 3) {
    faceBand(out, west, 4.2, 8.2, { kind: 'fins', wall: W, glass: [0.12, 0.15, 0.2], floor: 4, pitch: 2.2, solid: 0.2, depth: 0.7, material: 'stucco' })
    const lip = offsetRing(west, 1.1)
    faceBand(out, lip, 8.2, 9.0, { kind: 'blank', wall: W, material: 'stucco' })
    for (const y of [8.35, 8.6, 8.85]) faceBand(out, offsetRing(west, 1.13), y - 0.05, y, { kind: 'blank', wall: NAVY, material: 'metal' })
    capPolygon(out, lip, 9.0, [0.85, 0.85, 0.83], CT)
    capPolygon(out, lip, 8.2, W, CT)
    // the seagulls along the roof edge: flat blue cut-outs, wings up
    for (let i = 0; i < lip.length; i++) {
      const q = edgeAt(lip, i)
      for (let u = 1; u < q.L - 0.5; u += 3) {
        const c = on(q, u, 9.6, -0.2)
        for (const s of [-1, 1]) out.quad([[c[0], c[1] - 0.15, c[2]], [c[0] + q.tx * s * 0.6, c[1] + 0.35, c[2] + q.tz * s * 0.6], [c[0] + q.tx * s * 0.65, c[1] + 0.2, c[2] + q.tz * s * 0.65], [c[0], c[1] - 0.3, c[2]]], [q.nx, 0, q.nz], UVQ, RBLUE, MT)
        tube(out, [c[0], 9.0, c[2]], [c[0], c[1] - 0.2, c[2]], 0.02, 3, [0.3, 0.3, 0.3], MT)
      }
    }
  }
  if (east.length >= 3) {
    faceBand(out, east, 4.2, 9.6, { kind: 'blank', wall: W, material: 'stucco' })
    capPolygon(out, east, 9.6, [0.8, 0.8, 0.78], CT)
    for (const [o, y] of [[0.25, 9.6], [0.45, 9.85]] as [number, number][]) faceBand(out, offsetRing(east, o), y, y + 0.22, { kind: 'blank', wall: y > 9.7 ? W : NAVY, material: 'stucco' })
  }
  // the parapet wall's face: the name, the emblem, the waves
  const pm = wEnd + wd * (split + (L - split) * 0.38)
  signAt(out, e, pm, 8.1, 0.08, { type: 'flat', text: 'FRANCISCAN', h: 1.15, w: Math.min(13, (L - split) * 0.7), face: 'grotesque', weight: 'bold', colour: DGR, lit: 'front', tracking: 0.12 })
  signAt(out, e, pm, 7.15, 0.08, { type: 'flat', text: 'CRAB RESTAURANT', h: 0.55, w: Math.min(11, (L - split) * 0.6), face: 'grotesque', weight: 'bold', colour: RED, halo: [0.3, 0.05, 0.05], lit: 'self' })
  // the crab emblem, flat on the wall: a red shell, its legs and two claws (the mermaid riding it is a TRIPO.md row)
  const em = on(e, pm, 6.0, 0.1)
  lozenge(out, em, [e.tx, 0, e.tz], [0, 1, 0], [e.nx, 0, e.nz], 1.05, 0.62, 0.06, RED, MT, 18)
  lozenge(out, [em[0] + e.nx * 0.04, em[1] + 0.12, em[2] + e.nz * 0.04], [e.tx, 0, e.tz], [0, 1, 0], [e.nx, 0, e.nz], 0.7, 0.3, 0.03, [0.92, 0.35, 0.2], MT, 14)
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) tube(out, on(e, pm + s * 0.9, 5.85 - k * 0.18, 0.08), on(e, pm + s * (1.45 + k * 0.08), 5.55 - k * 0.25, 0.08), 0.05, 4, RED, MT)
    tube(out, on(e, pm + s * 0.8, 6.2, 0.08), on(e, pm + s * 1.3, 6.5, 0.08), 0.07, 4, RED, MT)
    lozenge(out, on(e, pm + s * 1.35, 6.62, 0.08), [e.tx, 0, e.tz], [0, 1, 0], [e.nx, 0, e.nz], 0.28, 0.18, 0.05, RED, MT, 10)
  }
  for (let k = 0; k < 3; k++) {
    const y = 4.9 + k * 0.28
    for (let s = 0; s < 16; s++) {
      const a = (s / 16) * (L - split) * 0.7, b = ((s + 1) / 16) * (L - split) * 0.7
      const u0 = pm - (L - split) * 0.35 + a, u1 = pm - (L - split) * 0.35 + b
      tube(out, on(e, u0, y + Math.sin(s * 0.9) * 0.08, 0.08), on(e, u1, y + Math.sin((s + 1) * 0.9) * 0.08, 0.08), 0.025, 3, DGR, MT)
    }
  }
  // the black canopy along the east front, lettered, the bollards
  const c0 = split + 0.5, c1 = L - 0.5
  slab(out, e, wEnd + wd * (c0 + c1) / 2, 1.2, 3.6, c1 - c0, 0.6, 2.4, BLACK, MT)
  signAt(out, e, wEnd + wd * (c0 + (c1 - c0) * 0.3), 3.9, 2.43, { type: 'flat', text: 'COFFEE BAR', h: 0.3, w: 4, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'self' })
  signAt(out, e, wEnd + wd * (c0 + (c1 - c0) * 0.72), 3.9, 2.43, { type: 'flat', text: 'WORLD FAMOUS FISHWICH', h: 0.34, w: (c1 - c0) * 0.42, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'self' })
  for (let d = c0; d < c1; d += 2.2) slab(out, e, wEnd + wd * d, 3.0, 0, 0.25, 1.0, 0.25, [0.85, 0.42, 0.15], MT)
  // the pavilion shop: red frames, the scalloped canopy
  const pu = wEnd + wd * (split / 2)
  for (let k = -2; k <= 2; k++) slab(out, e, pu + k * (split / 5.5), 0.1, 0.7, 0.14, 3.0, 0.1, RED, MT)
  for (let s = 0; s < Math.round(split / 1.6); s++) {
    const u = wEnd + wd * (1 + s * 1.6)
    const c = on(e, u, 3.7, 1.3)
    out.quad([on(e, u - 0.8, 4.0, 0.1), on(e, u + 0.8, 4.0, 0.1), on(e, u + 0.8, 3.5, 1.4), on(e, u - 0.8, 3.5, 1.4)], [e.nx * 0.5, 0.85, e.nz * 0.5], UVQ, W, MT)
    for (let a = 0; a < 6; a++) {
      const a0 = (a / 6) * Math.PI, a1 = ((a + 1) / 6) * Math.PI
      out.quad([[c[0], 3.5, c[2]], on(e, u - Math.cos(a0) * 0.8, 3.5 - Math.sin(a0) * 0.3, 1.4), on(e, u - Math.cos(a1) * 0.8, 3.5 - Math.sin(a1) * 0.3, 1.4), [c[0], 3.5, c[2]]], [e.nx, 0, e.nz], UVQ, RBLUE, MT)
    }
  }
  signAt(out, e, pu, 4.45, 0.1, { type: 'flat', text: 'PIER 43½ · GIFTS · SNACKS', h: 0.24, w: split * 0.8, face: 'grotesque', weight: 'bold', colour: RBLUE, lit: 'front' })
  // THE TOWER at the street corner: porthole band, the teal glass storey, balcony rails, the crown of rings
  const R = 3.3, tx = tq.x - e.nx * (R - 0.6), tz = tq.z - e.nz * (R - 0.6)
  prism(out, tx, tz, 0, 3.0, R - 0.4, 24, [0.14, 0.5, 0.6], GT)
  prism(out, tx, tz, 3.0, 4.6, R, 24, W, ST)
  for (let k = 0; k < 24; k += 2) {
    const a = (k / 24) * Math.PI * 2, n: V3 = [Math.sin(a), 0, Math.cos(a)]
    if (n[0] * e.nx + n[2] * e.nz < -0.3) continue
    const c: V3 = [tx + n[0] * (R + 0.03), 3.8, tz + n[2] * (R + 0.03)]
    lozenge(out, c, [Math.cos(a), 0, -Math.sin(a)], [0, 1, 0], n, 0.36, 0.36, 0.06, TEAL, GT, 12)
    lozenge(out, [c[0] - n[0] * 0.02, c[1], c[2] - n[2] * 0.02], [Math.cos(a), 0, -Math.sin(a)], [0, 1, 0], n, 0.44, 0.44, 0.04, W, ST, 12)
  }
  sign(out, { type: 'flat', text: 'Franciscan Crab Restaurant', h: 0.3, w: 3.6, face: 'script', colour: RBLUE, lit: 'front' },
    { x: tx + e.nx * (R + 0.08), y: 3.35, z: tz + e.nz * (R + 0.08), heading: e.heading })
  for (const [y, r] of [[4.6, R + 0.5], [4.85, R + 0.5], [5.1, R + 0.5]] as [number, number][]) prism(out, tx, tz, y, y + 0.12, r, 24, y === 4.85 ? NAVY : W, ST)
  prism(out, tx, tz, 4.6, 8.6, R - 0.6, 24, TEAL, GT)
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; prism(out, tx + Math.sin(a) * (R - 0.5), tz + Math.cos(a) * (R - 0.5), 4.6, 8.6, 0.35, 8, W, ST) }
  prism(out, tx, tz, 8.6, 9.0, R + 0.2, 24, W, ST)
  for (let k = 0; k < 4; k++) prism(out, tx, tz, 9.4 + k * 0.45, 9.52 + k * 0.45, R - 0.1 - k * 0.25, 24, W, ST, R - 0.1 - k * 0.25, false)
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.3; tube(out, [tx + Math.sin(a) * (R - 0.4), 9.0, tz + Math.cos(a) * (R - 0.4)], [tx + Math.sin(a) * (R - 0.9), 10.9, tz + Math.cos(a) * (R - 0.9)], 0.05, 4, W, ST) }
}


/** One plain Wharf shop building, as photographed: its walls, roof, the board across its front, an awning, its windows. */
interface ShopSpec {
  wall: Rgb
  material: 'clapboard' | 'stucco'
  /** wall height at the street */
  H: number
  /** 'flat' (a parapet), 'gable' (gable end to the street), 'side' (eaves to the street, ridge along it) */
  roof: 'flat' | 'gable' | 'side'
  rise?: number
  roofColour?: Rgb
  /** a sign board across the front: its words, its second line, colours, face, centre height */
  board?: { text: string; sub?: string; bg: Rgb; ink: Rgb; face?: SignSpec['face']; y: number; h?: number; halo?: Rgb; lit?: SignSpec['lit'] }
  awning?: { c1: Rgb; c2?: Rgb; text: string; ink: Rgb; y?: number }
  /** two storeys: a row of sash windows upstairs */
  upper?: boolean
  /** storefront glass full of goods, or plain windows and a door (a shed) */
  shop?: boolean
  trim?: Rgb
  extra?: (out: MeshBuilder, e: Edge, fit: Fit) => void
}

function wharfShop(sp: ShopSpec): (out: MeshBuilder, fit: Fit) => void {
  return (out, fit) => {
    const ring = towerRing(fit)
    const e = frontEdge(ring, facingFront(ring, 4))
    const trim = sp.trim ?? WHITE
    const roofC = sp.roofColour ?? [0.42, 0.43, 0.44]
    if (sp.roof === 'flat') {
      faceBand(out, ring, 0, sp.H, { kind: 'blank', wall: sp.wall, material: sp.material })
      faceBand(out, offsetRing(ring, 0.08), sp.H - 0.3, sp.H + 0.5, { kind: 'blank', wall: trim, material: sp.material })
      capPolygon(out, ring, sp.H, roofC, MT)
    } else {
      // the gabled shed on the fit's box: local −z is the street
      gabledBox(out, fit.hx, fit.hz, sp.H, sp.rise ?? Math.min(3, (sp.roof === 'gable' ? fit.hx : fit.hz) * 0.35), sp.wall, roofC, sp.roof === 'side', sp.material === 'stucco' ? ST : WT)
    }
    const fe: Edge = sp.roof === 'flat' ? e : edgeAt([{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }], 0)
    const FL = fe.L
    // the ground floor: shop glass full of goods between trim piers, or windows and a door
    if (sp.shop !== false) {
      const n = Math.max(1, Math.round(FL / 4.5)), bw = (FL - 0.6) / n
      for (let k = 0; k < n; k++) {
        const u = 0.3 + bw * (k + 0.5)
        if (k === Math.floor(n / 2)) { slab(out, fe, u, 0.03, 0, Math.min(1.8, bw * 0.4), 2.4, 0.05, [0.3, 0.36, 0.4], GT); goodsWindow(out, fe, u + bw * 0.3, 0.6, bw * 0.3, 2.0, k); continue }
        goodsWindow(out, fe, u, 0.5, bw - 0.7, 2.3, k + Math.round(FL))
      }
      for (let k = 0; k <= n; k++) slab(out, fe, 0.3 + bw * k, 0.05, 0, 0.35, 3.0, 0.12, trim, sp.material === 'stucco' ? ST : WT)
    } else {
      for (const f of [0.2, 0.8]) gridWindow(out, fe, FL * f, 1.0, Math.min(2.2, FL * 0.2), 1.5, 2, 2, trim)
      slab(out, fe, FL / 2, 0.04, 0, 1.1, 2.3, 0.05, [0.45, 0.5, 0.55], WT)
    }
    if (sp.upper) for (let u = 2; u < FL - 1.5; u += 3.2) gridWindow(out, fe, u + 0.6, Math.min(sp.H - 2.2, 4.6), 1.6, 1.4, 2, 2, trim)
    if (sp.awning) {
      const a = sp.awning
      if (a.c2) stripedAwning(out, fe, FL / 2, FL - 0.8, a.y ?? 2.9, a.c1, a.c2, a.text, a.ink, 1.4)
      else awning(out, fe, FL / 2, FL - 0.8, a.y ?? 2.9, a.c1, a.text, a.ink, 1.4)
    }
    if (sp.board) {
      const b = sp.board, bh = b.h ?? (b.sub ? 1.5 : 1.0)
      slab(out, fe, FL / 2, 0.12, b.y - bh / 2, FL - 0.8, bh, 0.16, b.bg, MT)
      signAt(out, fe, FL / 2, b.y + (b.sub ? bh * 0.17 : 0), 0.22, { type: 'flat', text: b.text, h: bh * (b.sub ? 0.36 : 0.5), w: FL - 1.6, face: b.face ?? 'grotesque', weight: 'bold', colour: b.ink, halo: b.halo, lit: b.lit ?? 'front' })
      if (b.sub) signAt(out, fe, FL / 2, b.y - bh * 0.3, 0.22, { type: 'flat', text: b.sub, h: bh * 0.14, w: FL - 1.8, face: 'grotesque', weight: 'bold', colour: b.ink, lit: b.lit ?? 'front' })
    }
    sp.extra?.(out, fe, fit)
  }
}

/** a string of orange fishing floats hung along edge `e` at `y`, from u0 to u1 */
function floats(out: MeshBuilder, e: Edge, u0: number, u1: number, y: number): void {
  for (let u = u0; u < u1; u += 0.9) { const p = on(e, u, y - 0.25 * Math.abs(Math.sin(u * 1.7)), 0.35); prism(out, p[0], p[2], p[1] - 0.18, p[1] + 0.18, 0.18, 8, [0.95, 0.45, 0.15], MT, 0.12) }
}

const WHARF_ROW = {
  /** THE WHARF STORE, 398 Jefferson at Leavenworth (way/229326471; Mapillary 632460753240577, Aug 2025): two storeys of beige stucco, a navy board THE WHARF STORE / GIFTS · SOUVENIRS · SPORTSWEAR, ribbon windows upstairs, shop glass full of sweatshirts. `front` 171. */
  wharfStore: wharfShop({ wall: [0.86, 0.8, 0.68], material: 'stucco', H: 7.6, roof: 'flat', trim: [0.92, 0.88, 0.8], upper: true,
    board: { text: 'THE WHARF STORE', sub: 'GIFTS · SOUVENIRS · SPORTSWEAR', bg: [0.18, 0.24, 0.4], ink: [0.97, 0.97, 0.95], face: 'slab', y: 3.6 } }),
  /** the Wharf Store's long low wing (way/229326458; Mapillary 632460753240577): a one-storey wall painted with a mural of the Golden Gate and the bay, THE WHARF STORE in white letters along its top, ENTRANCE. `front` 171. */
  wharfStoreWing: wharfShop({ wall: [0.9, 0.88, 0.84], material: 'stucco', H: 4.6, roof: 'flat', shop: false,
    extra: (out, e) => {
      const L = e.L
      slab(out, e, L / 2, 0.06, 0.4, L - 0.6, 3.4, 0.04, [0.45, 0.68, 0.85], ST)          // the bay
      slab(out, e, L / 2, 0.08, 0.4, L - 0.6, 0.9, 0.04, [0.3, 0.52, 0.72], ST)
      slab(out, e, L * 0.3, 0.09, 1.0, L * 0.3, 1.0, 0.04, [0.75, 0.62, 0.42], ST)        // the headlands
      slab(out, e, L * 0.75, 0.09, 1.0, L * 0.2, 0.7, 0.04, [0.85, 0.82, 0.6], ST)
      for (const f of [0.18, 0.42]) slab(out, e, L * f, 0.1, 1.4, 0.18, 2.3, 0.04, [0.85, 0.35, 0.2], ST)   // the bridge's towers
      tube(out, on(e, L * 0.18, 3.6, 0.12), on(e, L * 0.42, 3.6, 0.12), 0.05, 4, [0.85, 0.35, 0.2], ST)
      slab(out, e, L / 2, 0.06, 4.0, L - 0.4, 0.5, 0.1, [0.3, 0.32, 0.35], MT)
      signAt(out, e, L * 0.7, 4.25, 0.14, { type: 'flat', text: 'THE WHARF STORE', h: 0.32, w: L * 0.45, face: 'slab', weight: 'bold', colour: WHITE, lit: 'front' })
      signAt(out, e, L * 0.25, 4.25, 0.14, { type: 'flat', text: 'ENTRANCE', h: 0.18, w: 2.4, face: 'grotesque', weight: 'bold', colour: [0.2, 0.2, 0.2], panel: WHITE, lit: 'front' })
    } }),
  /** FRANK'S FISHERMAN, 366 Jefferson (way/224941192; Mapillary 4635265953366739, Aug 2025): beige stucco two storeys under a deep cornice, the navy board FRANK'S FISHERMAN with GIFTS · CLOTHING / Since 1946 / MARINE SUPPLIES, orange fishing floats hung along the windows. `front` 171. */
  franksFisherman: wharfShop({ wall: [0.88, 0.83, 0.7], material: 'stucco', H: 7.4, roof: 'flat', trim: [0.93, 0.9, 0.82], upper: true,
    board: { text: "FRANK'S FISHERMAN", sub: 'GIFTS · CLOTHING · SINCE 1946 · MARINE SUPPLIES', bg: [0.16, 0.3, 0.6], ink: [0.98, 0.98, 0.95], face: 'roman', y: 3.7 },
    extra: (out, e) => floats(out, e, 0.8, e.L - 0.8, 2.75) }),
  /** the GENERAL STORE (Only in California), 360 Jefferson (way/93703727; Mapillary 1677664382947889, Aug 2025): a grey BOARD-AND-BATTEN shed with its gable to the street, a window in the gable, a long orange awning GENERAL STORE peaked over the door with ONLY IN CALIFORNIA and the bear. `front` 171. */
  generalStore: wharfShop({ wall: [0.52, 0.56, 0.6], material: 'clapboard', H: 4.4, roof: 'gable', rise: 2.6, roofColour: [0.48, 0.5, 0.52], trim: [0.92, 0.92, 0.9],
    awning: { c1: [0.92, 0.35, 0.22], text: 'GENERAL STORE · ONLY IN CALIFORNIA · GENERAL STORE', ink: [1, 0.85, 0.2], y: 3.3 },
    extra: (out, e, fit) => {
      for (let u = 0.3; u < e.L; u += 0.6) slab(out, e, u, 0.04, 0, 0.08, 4.4, 0.05, [0.48, 0.52, 0.56], WT)      // the battens
      gridWindow(out, e, e.L / 2, 4.9, 1.4, 1.0, 2, 1, WHITE)
      void fit
    } }),
  /** the grey-blue clapboard shed next to Lou's (way/229326476; Mapillary 673192261722622, Aug 2025): one storey, white-trimmed sash windows under little navy awnings, gooseneck lamps, FOR LEASE. `front` 171. */
  leaseShed: wharfShop({ wall: [0.56, 0.62, 0.68], material: 'clapboard', H: 4.6, roof: 'flat', shop: false, trim: WHITE,
    extra: (out, e) => {
      for (const f of [0.15, 0.32, 0.68, 0.85]) { gridWindow(out, e, e.L * f, 1.0, 1.4, 1.6, 2, 2, WHITE); slab(out, e, e.L * f, 0.3, 2.7, 1.7, 0.3, 0.6, [0.15, 0.2, 0.35], WT) }
      for (const f of [0.24, 0.6, 0.94]) barnLamp(out, e, e.L * f, 3.9, [0.15, 0.15, 0.15])
      slab(out, e, e.L * 0.22, 0.06, 3.3, 1.6, 0.9, 0.04, [0.2, 0.18, 0.35], MT)
      signAt(out, e, e.L * 0.22, 3.75, 0.1, { type: 'flat', text: 'FOR LEASE', h: 0.18, w: 1.4, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'none' })
    } }),
  /** LOU'S FISH SHACK, 300 Jefferson (way/229326456; Mapillary 750262764600839, Aug 2025): two storeys of weathered brown boards, the east half a gable of maroon CORRUGATED iron, gridded windows upstairs, glass roll-up doors between timber posts below, a barn door, two round red Lou's signs. `front` 171. */
  lousFishShack: wharfShop({ wall: [0.45, 0.32, 0.24], material: 'clapboard', H: 7.2, roof: 'flat', shop: false, trim: [0.55, 0.4, 0.3],
    extra: (out, e) => {
      const L = e.L, MR: Rgb = [0.42, 0.14, 0.12]
      slab(out, e, L * 0.72, 0.1, 3.3, L * 0.5, 3.9, 0.12, MR, MT)
      for (const s of [-1, 1]) out.quad([on(e, L * 0.72 + s * L * 0.25, 7.2, 0.16), on(e, L * 0.72, 9.2, 0.16), on(e, L * 0.72, 9.2, 0.16), on(e, L * 0.72 + s * L * 0.25, 7.2, 0.16)], [e.nx, 0, e.nz], UVQ, MR, MT)
      out.quad([on(e, L * 0.47, 7.2, 0.16), on(e, L * 0.97, 7.2, 0.16), on(e, L * 0.72, 9.2, 0.16), on(e, L * 0.72, 9.2, 0.16)], [e.nx, 0, e.nz], UVQ, MR, MT)
      for (let k = 0; k < 8; k++) gridWindow(out, e, L * (0.12 + k * 0.105), 4.0, L * 0.09, 1.9, 2, 3, [0.2, 0.15, 0.12], 0.2)
      for (const f of [0.45, 0.78]) { slab(out, e, L * f, 0.05, 0, L * 0.22, 3.0, 0.05, [0.15, 0.16, 0.17], GT); for (let y = 0.6; y < 3; y += 0.6) slab(out, e, L * f, 0.09, y, L * 0.22, 0.05, 0.03, [0.1, 0.1, 0.1], MT) }
      for (const f of [0.32, 0.6, 0.92]) slab(out, e, L * f, 0.15, 0, 0.5, 3.3, 0.3, [0.55, 0.38, 0.26], WT)
      slab(out, e, L * 0.1, 0.06, 0, L * 0.16, 2.9, 0.06, [0.62, 0.5, 0.42], WT)                 // the barn door, its Z
      tube(out, on(e, L * 0.02, 0.2, 0.1), on(e, L * 0.18, 2.7, 0.1), 0.07, 4, [0.62, 0.5, 0.42], WT)
      for (const [f, y] of [[0.72, 8.0], [0.04, 5.6]] as [number, number][]) {
        const c = on(e, L * f, y, f < 0.5 ? 0.6 : 0.25)
        lozenge(out, c, [e.tx, 0, e.tz], [0, 1, 0], [e.nx, 0, e.nz], 0.85, 0.85, 0.12, [0.82, 0.12, 0.12], MT, 18)
        sign(out, { type: 'flat', text: "Lou's", h: 0.38, w: 1.3, face: 'script', colour: WHITE, lit: 'self' }, { x: c[0] + e.nx * 0.08, y: y + 0.1, z: c[2] + e.nz * 0.08, heading: e.heading })
        sign(out, { type: 'flat', text: 'FISH SHACK', h: 0.12, w: 1.1, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'self' }, { x: c[0] + e.nx * 0.08, y: y - 0.32, z: c[2] + e.nz * 0.08, heading: e.heading })
      }
      for (let u = 1; u < L * 0.45; u += 1.2) box(out, on(e, u, 6.5, 0.4)[0], 6.5 - 0.2 * Math.abs(Math.sin(u)), on(e, u, 6.5, 0.4)[2], 0.05, 0.05, 0.05, WARM, EMIT)   // string lights
    } }),
  /** CALIFORNIA SHELLFISH CO., next to Cioppino's (way/229326468; Mapillary 4259374474387637, Aug 2025): a white two-storey working building with its low gable to Jefferson, CALIFORNIA SHELLFISH CO. in green letters across it, a green stripe at the floor line, two rows of windows, a green door and a big roll-up door, a turbine ventilator on the ridge. `front` 180. */
  shellfishShed: wharfShop({ wall: [0.95, 0.95, 0.93], material: 'stucco', H: 6.8, roof: 'gable', rise: 1.4, roofColour: [0.6, 0.62, 0.62], shop: false,
    extra: (out, e, fit) => {
      const L = e.L, G: Rgb = [0.1, 0.38, 0.25]
      slab(out, e, L / 2, 0.05, 3.25, L, 0.16, 0.05, G, WT)
      signAt(out, e, L / 2, 5.95, 0.08, { type: 'flat', text: 'CALIFORNIA  SHELLFISH  CO.', h: 0.42, w: L * 0.8, face: 'grotesque', weight: 'bold', colour: G, lit: 'front' })
      for (const f of [0.15, 0.32, 0.5]) gridWindow(out, e, L * f, 4.0, L * 0.13, 1.1, 2, 1, [0.2, 0.2, 0.2])
      for (const f of [0.12, 0.25, 0.48, 0.6]) gridWindow(out, e, L * f, 1.2, L * 0.09, 1.0, 2, 1, [0.2, 0.2, 0.2])
      slab(out, e, L * 0.37, 0.04, 0, 1.0, 2.3, 0.05, G, WT)
      slab(out, e, L * 0.84, 0.04, 0, L * 0.2, 3.2, 0.05, [0.3, 0.32, 0.33], MT)
      slab(out, e, L * 0.84, 0.04, 3.6, L * 0.2, 2.6, 0.05, [0.85, 0.85, 0.83], MT)
      const R = 6.8 + 1.4
      prism(out, 0, 0, R, R + 0.6, 0.2, 8, [0.5, 0.52, 0.55], MT)
      prism(out, 0, 0, R + 0.6, R + 1.1, 0.4, 10, [0.5, 0.52, 0.55], MT)
      void fit
    } }),
}

/**
 * AT THE STREET'S LEVEL: a model's base is the LOWEST ground under its footprint, and on the Wharf a building that stands
 * out over the water has the sea bed under it — Alioto's and the Grotto were built 3–4 m down, their awnings lying on the
 * sidewalk (owner, 2026-10-17: "awnings on the ground on multiple buildings, including Aliotos and No 9"). The builder
 * draws as if its front's ground were y 0; everything is then lifted to `fit.grade`, and a skirt of wall closes the gap.
 */
function graded(build: (out: MeshBuilder, fit: Fit) => void, skirt: Rgb = [0.42, 0.4, 0.38]): (out: MeshBuilder, fit: Fit) => void {
  return (out, fit) => {
    const g = fit.grade ?? 0
    if (Math.abs(g) < 0.1) { build(out, fit); return }
    const v0 = out.positions.length / 3, s0 = out.signs.length
    build(out, { ...fit, grade: 0, groundAt: fit.groundAt ? (x, z) => fit.groundAt!(x, z) - g : undefined })
    for (let i = v0; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += g
    // and the signs, which go to their own list: left behind, every sign of a lifted model sat g metres down its wall
    // (Castagnola's name under its board, 2026-10-17)
    for (let i = s0; i < out.signs.length; i++) out.signs[i] = { ...out.signs[i], y: out.signs[i].y + g }
    if (g > 0) faceBand(out, towerRing(fit), 0, g + 0.05, { kind: 'blank', wall: skirt, material: 'concrete' })
  }
}

export const WHARF_SHOPS: Record<string, (out: MeshBuilder, fit: Fit) => void> = Object.fromEntries(Object.entries({
  jeffersonAttractions, jeffersonInNOut, redWhiteBooth, scomas, memorialChapel, grotto9,
  capurros, jefferson490, aliotoLazio, taylorCorner, aliotos8, franciscanCrab, chowderHut, buenaVista, castagnolas, longshoremensHall, cioppinos, ...WHARF_ROW, hardRockFront, pumpingStation2,
  dolphinClubBoathouse: boathouse('DOLPHIN CLUB'), southEndRowingClub: boathouse('Since 1877', 'SOUTH END ROWING CLUB'), pretzelKiosk, klamathPropellers,
  pier45ShedA: pier45Shed('PIER 45', true),
  pier45ShedB: pier45Shed('PIER 45', false),
  pier45ShedD: pier45Shed('PIER 45', false),
}).map(([k, f]) => [k, graded(f)]))
