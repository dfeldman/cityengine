/**
 * The Merchants Exchange Building, 465 California Street (Willis Polk for D. H. Burnham & Co., 1903–04, rebuilt
 * inside after 1906): fifteen storeys on the south side of California between Montgomery and Leidesdorff. OSM's
 * way/256067740 is named for a tenant, "California Bank and Trust" (its sign hangs in the banking hall, Commons
 * "465 California St - Merchants Exchange Building.jpg"); its wikidata (Q6818435) is the Merchants Exchange, and
 * the old builder's "1959 pale midcentury slab" was a different building (the American Trust Company's, across
 * the street at 464). From the Commons photographs "465 California St - Merchants Exchange Building.jpg" (the
 * base, square on), "Merchants' Exchange Building in San Francisco - July 2025.jpg" (the base and the lower
 * shaft, from the north-east), and the Mapillary frames refs/way-256067740/01, 02 and 04 (the whole California
 * front from the west, beyond 300 Montgomery's corner), 2026-10-21.
 *
 * What the photographs show, from the pavement up:
 *  - a pale grey granite BASE of two storeys under a giant order: broad square pilasters a bay apart, eight bays;
 *    in the third to fifth bays from Leidesdorff the ENTRANCE, a deep loggia with two free-standing fluted IONIC
 *    COLUMNS in antis (not an arch); in the other bays a tall shop window, a moulded band, the second-storey window;
 *  - over the order an ENTABLATURE across the whole front, its frieze lettered THE MERCHANTS' EXCHANGE, and a
 *    cornice; then a granite third storey, a pilaster strip between every window, under the heavy BASE CORNICE;
 *  - the SHAFT: ten storeys of buff, horizontally channelled masonry, a pair of windows a bay;
 *  - the CROWN: a belt course, two storeys of paired windows set back between broad pilasters, a frieze and a
 *    deep MODILLIONED CORNICE.
 * The Leidesdorff flank is dressed the same way bay for bay without the entrance; the west wall is a party wall
 * under 300 Montgomery's (58 m); behind the tower OSM draws a one-storey strip across the lot (part 944039724)
 * and a light court over the banking hall (part 256067739).
 *
 * The frame: the real outline, a near-rectangle 36.6 m on California by 54.6 m deep. Its two pairs of edges are
 * equal, so the California front is not the longest edge: it is the edge facing −z, where the city puts the
 * manifest front (front: 351). Laid out in that edge's frame: u along the front (u = 0 at the Leidesdorff end,
 * since the outline runs anticlockwise), o out of the wall, d = −o back into the lot, y up.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { column } from '../../kit.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const T = { granite: surfaceTag('granite'), ashlar: surfaceTag('ashlar'), glass: surfaceTag('glass') }

// pale warm grey granite in the base (the July 2025 photograph); the shaft a buff a shade warmer; trim paler
const GRANITE: Rgb = [0.75, 0.74, 0.7]
const GTRIM: Rgb = [0.8, 0.79, 0.75]
const BUFF: Rgb = [0.79, 0.74, 0.64]
const BTRIM: Rgb = [0.84, 0.8, 0.71]
const SHADE: Rgb = [0.46, 0.45, 0.43]
const SOFFIT: Rgb = [0.56, 0.55, 0.52]
const LETTER: Rgb = [0.42, 0.41, 0.39]
const GLASS: Rgb = [0.17, 0.19, 0.22]
const DOOR: Rgb = [0.12, 0.12, 0.13]
const SASH: Rgb = [0.3, 0.3, 0.3]
const ROOF: Rgb = [0.5, 0.5, 0.49]
const SKY: Rgb = [0.34, 0.37, 0.4]

/** Heights at 61 m (OSM's), scaled by the entry's height. */
const H0 = {
  plinth: 0.9,
  shop: 7.0,       // top of the shop windows
  band: 8.2,       // top of the moulded band over them
  win2: 10.8,      // top of the second-storey windows
  order: 11.0,     // the giant order's capitals
  arch: 11.6,      // the architrave
  frieze: 12.9,
  cor1: 13.6,      // the entablature's cornice
  att: 17.3,       // the third storey's top
  base: 18.6,      // top of the base cornice: the shaft starts
  floor: 3.4,      // the shaft's storey (ten of them)
  belt: 52.6,
  belt1: 53.1,
  frz: 59.2,       // the crown's frieze
  top: 61,
}

// ------------------------------------------------------------------------------------------- an edge's frame

interface Fr { ox: number; oz: number; tx: number; tz: number; nx: number; nz: number; L: number }
const frameOf = (a: P2, b: P2): Fr => {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { ox: a.x, oz: a.z, tx, tz, nx: tz, nz: -tx, L }
}
const P = (f: Fr, u: number, o: number, y: number): [number, number, number] =>
  [f.ox + f.tx * u + f.nx * o, y, f.oz + f.tz * u + f.nz * o]
const pt = (f: Fr, u: number, o: number): P2 => ({ x: f.ox + f.tx * u + f.nx * o, z: f.oz + f.tz * u + f.nz * o })
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A flat rectangle facing out of the wall, `o` metres proud of it. */
function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], [f.nx, 0, f.nz], UV, c, tag)
}
/** A block in a frame: its face, its two ends, optionally its lid, its back and its underside. */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb,
              tag = FIXED, lid = true, back = false, under = false): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], [f.nx, 0, f.nz], UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], [-f.tx, 0, -f.tz], UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], [f.tx, 0, f.tz], UV, c, tag)
  if (lid) out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (back) out.quad([Q(u1, o0, y0), Q(u0, o0, y0), Q(u0, o0, y1), Q(u1, o0, y1)], [-f.nx, 0, -f.nz], UV, c, tag)
  if (under) out.quad([Q(u0, o1, y0), Q(u0, o0, y0), Q(u1, o0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}
/** A horizontal rectangle in the frame (a roof, a soffit when `down`). */
function flat(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y: number, c: Rgb, tag = FIXED, down = false): void {
  const q: [number, number, number][] = [P(f, u0, o0, y), P(f, u0, o1, y), P(f, u1, o1, y), P(f, u1, o0, y)]
  out.quad(down ? [q[0], q[3], q[2], q[1]] : q, [0, down ? -1 : 1, 0], UV, c, tag)
}

// ------------------------------------------------------------------------------------------- the elevations

type Y = typeof H0

/**
 * A dressed street front `L` long in `n` bays: the granite base under its giant order, the entablature, the
 * third storey and the base cornice, the buff shaft, the crown and its modillioned cornice. `portico` names the
 * bays [i0, i1) that open into the entrance loggia instead.
 */
function streetFront(out: MeshBuilder, f: Fr, L: number, n: number, Y: Y, drop: number, portico: [number, number] | null): void {
  const b = L / n
  const isPort = (i: number): boolean => !!portico && i >= portico[0] && i < portico[1]
  const R = 0.32                                          // the window recess
  // ---- the base
  slab(out, f, -0.05, L + 0.05, -R, 0.12, -drop, Y.plinth, GTRIM, T.granite, true)
  for (let i = 0; i < n; i++) {
    if (isPort(i)) continue
    const u0 = i * b
    const u1 = (i + 1) * b
    // the glazing behind, the band over the shop window, the sill of the upper window and the lintel
    panel(out, f, u0, u1, -R, Y.plinth, Y.win2, GLASS, T.glass)
    slab(out, f, u0, u1, -R, 0, Y.shop, Y.band, GRANITE, T.granite, false, false, true)
    slab(out, f, u0 + 0.6, u1 - 0.6, 0, 0.22, Y.band - 0.35, Y.band, GTRIM, T.granite, true, false, true)
    slab(out, f, u0, u1, -R, 0, Y.win2, Y.arch, GRANITE, T.granite, false, false, true)
    // the shop window's door-height transom and the upper window's mullion
    const m = (u0 + u1) / 2
    panel(out, f, u0 + 0.7, u1 - 0.7, -R + 0.04, Y.shop - 2.1, Y.shop - 1.9, SASH)
    panel(out, f, m - 0.07, m + 0.07, -R + 0.04, Y.band, Y.win2, SASH)
  }
  // the giant order: a broad square pilaster on every pier, the wall round it; the antae of the loggia broader
  for (let i = 0; i <= n; i++) {
    // (inside the loggia the free-standing columns stand where the piers would)
    if (portico && i > portico[0] && i < portico[1]) continue
    const anta = !!portico && (i === portico[0] || i === portico[1])
    const end = i === 0 || i === n
    const half = anta ? 1.15 : end ? 1.1 : 0.95
    const u0 = Math.max(0, i * b - half)
    const u1 = Math.min(L, i * b + half)
    slab(out, f, u0, u1, -R, 0, Y.plinth, Y.arch, GRANITE, T.granite, false)
    const pw = anta ? 0.9 : 0.68
    const p0 = Math.max(end ? 0 : -1, i * b - pw)
    const p1 = Math.min(end ? L : L + 1, i * b + pw)
    slab(out, f, p0, p1, 0, 0.42, Y.plinth, Y.order, GRANITE, T.granite, false)
    // the capital: a moulded block a little broader
    slab(out, f, p0 - 0.12, p1 + 0.12, 0, 0.56, Y.order, Y.arch, GTRIM, T.granite, true, false, true)
    slab(out, f, p0 - 0.05, p1 + 0.05, 0, 0.5, Y.plinth, Y.plinth + 0.5, GTRIM, T.granite, true)
  }
  // ---- the entablature: architrave, the lettered frieze, the cornice
  slab(out, f, 0, L, 0, 0.5, Y.arch, Y.frieze, GTRIM, T.granite, false, false, true)
  slab(out, f, 0, L, 0, 0.42, Y.frieze, Y.cor1 - 0.35, GRANITE, T.granite, false)
  slab(out, f, -0.1, L + 0.1, 0, 0.95, Y.cor1 - 0.35, Y.cor1, GTRIM, T.granite, true, false, true)
  if (portico) {
    // THE MERCHANTS' EXCHANGE, as a line of lettering over the loggia
    const u0 = portico[0] * b + 0.8
    const u1 = portico[1] * b - 0.8
    const yl = (Y.frieze + Y.cor1 - 0.35) / 2
    const words = [0.08, 0.36, 0.42]
    let u = u0
    const tot = words.reduce((s, w) => s + w, 0) + 0.06 * (words.length - 1)
    for (const w of words) {
      const span = ((u1 - u0) * w) / tot
      panel(out, f, u, u + span, 0.43, yl - 0.13, yl + 0.13, LETTER)
      u += span + ((u1 - u0) * 0.06) / tot
    }
  }
  // ---- the third storey: a pilaster strip between every window, granite to the base cornice
  panel(out, f, 0, L, -R, Y.cor1, Y.att, GLASS, T.glass)
  slab(out, f, 0, L, -R, 0, Y.cor1, Y.cor1 + 0.5, GRANITE, T.granite, false, false, false)
  slab(out, f, 0, L, -R, 0, Y.att - 0.55, Y.att, GRANITE, T.granite, false, false, true)
  for (let k = 0; k <= 2 * n; k++) {
    const u = (k * b) / 2
    const end = k === 0 || k === 2 * n
    const w = k % 2 === 0 ? 0.55 : 0.35
    slab(out, f, Math.max(0, u - w - (end ? 0.3 : 0)), Math.min(L, u + w + (end ? 0.3 : 0)), -R, 0.15, Y.cor1, Y.att, GRANITE, T.granite, false)
  }
  // the base cornice: a bed moulding and the deep corona
  slab(out, f, -0.2, L + 0.2, 0, 0.5, Y.att, Y.att + 0.45, GTRIM, T.granite, false, false, true)
  slab(out, f, -0.6, L + 0.6, 0, 1.05, Y.att + 0.45, Y.base, GTRIM, T.granite, true, false, true)

  // ---- the shaft: buff, a pair of windows a bay, piers and spandrels
  shaftBays(out, f, L, n, Y.base, Y.belt, Y.floor, R, BUFF, T.ashlar, 0.6, 0.3)
  // the belt course
  slab(out, f, -0.25, L + 0.25, 0, 0.42, Y.belt, Y.belt1, BTRIM, T.ashlar, true, false, true)
  // ---- the crown: two storeys between broad pilasters, the windows set back
  const cf = (Y.frz - Y.belt1) / 2
  panel(out, f, 0, L, -0.55, Y.belt1, Y.frz, GLASS, T.glass)
  for (let i = 0; i < n; i++) {
    const m = (i + 0.5) * b
    // the mullion, the spandrel between the two storeys, a sill and a lintel
    slab(out, f, m - 0.38, m + 0.38, -0.55, -0.15, Y.belt1, Y.frz, BUFF, T.ashlar, false)
    slab(out, f, i * b, (i + 1) * b, -0.55, -0.15, Y.belt1 + cf - 0.5, Y.belt1 + cf + 0.6, BUFF, T.ashlar, false, false, true)
    slab(out, f, i * b, (i + 1) * b, -0.55, -0.15, Y.belt1, Y.belt1 + 0.5, BUFF, T.ashlar, true)
    slab(out, f, i * b, (i + 1) * b, -0.55, -0.15, Y.frz - 0.5, Y.frz, BUFF, T.ashlar, false, false, true)
  }
  for (let i = 0; i <= n; i++) {
    const end = i === 0 || i === n
    const half = end ? 1.0 : 0.82
    slab(out, f, Math.max(0, i * b - half), Math.min(L, i * b + half), -0.55, 0.12, Y.belt1, Y.frz, BTRIM, T.ashlar, false)
  }
  crownCornice(out, f, L, Y)
}

/**
 * Rows of paired windows between piers and spandrels, `y0..y1` in storeys of `fl`: the glass recessed `R`, the
 * piers a bay apart (`pw` half-wide), a mullion between each pair (`mw` half-wide).
 */
function shaftBays(out: MeshBuilder, f: Fr, L: number, n: number, y0: number, y1: number, fl: number, R: number,
                   c: Rgb, tag: number, pw: number, mw: number): void {
  const b = L / n
  panel(out, f, 0, L, -R, y0, y1, GLASS, T.glass)
  const floors = Math.max(1, Math.round((y1 - y0) / fl))
  const h = (y1 - y0) / floors
  for (let k = 0; k < floors; k++) {
    // the spandrel and sill under each storey's windows; the lintel band under the next
    const y = y0 + k * h
    slab(out, f, 0, L, -R, 0, y, y + 0.8, c, tag, true, false, k === 0)
    slab(out, f, 0, L, -R, 0, y + h - 0.3, y + h, c, tag, false, false, true)
  }
  for (let i = 0; i <= n; i++) {
    const end = i === 0 || i === n
    const half = end ? pw + 0.3 : pw
    slab(out, f, Math.max(0, i * b - half), Math.min(L, i * b + half), -R, 0, y0, y1, c, tag, false)
    if (i < n) {
      const m = (i + 0.5) * b
      slab(out, f, m - mw, m + mw, -R, -0.04, y0, y1, c, tag, false)
    }
  }
}

/** The crown's frieze and its deep modillioned cornice, along one wall. */
function crownCornice(out: MeshBuilder, f: Fr, L: number, Y: Y): void {
  slab(out, f, 0, L, -0.1, 0.12, Y.frz, Y.top - 1.35, BTRIM, T.ashlar, false)
  slab(out, f, -0.3, L + 0.3, 0, 0.45, Y.top - 1.35, Y.top - 1.0, BTRIM, T.ashlar, false, false, true)
  slab(out, f, -1.4, L + 1.4, 0, 1.55, Y.top - 0.75, Y.top - 0.25, BTRIM, T.ashlar, false, false, true)
  slab(out, f, -1.3, L + 1.3, 0, 1.45, Y.top - 0.25, Y.top, BTRIM, T.ashlar, true, false, false)
  // the modillions under the corona
  const nm = Math.max(2, Math.round(L / 0.95))
  for (let k = 0; k < nm; k++) {
    const u = ((k + 0.5) * L) / nm
    slab(out, f, u - 0.14, u + 0.14, 0.4, 1.35, Y.top - 1.0, Y.top - 0.75, BTRIM, T.ashlar, false, false, true)
  }
}

/** A plain wall with a grid of punched windows (the rear and the light court). */
function punched(out: MeshBuilder, f: Fr, u0: number, u1: number, y0: number, y1: number, fl: number, pitch: number, c: Rgb, tag: number): void {
  panel(out, f, u0, u1, 0, y0, y1, c, tag)
  const L = u1 - u0
  const nw = Math.max(1, Math.floor(L / pitch))
  const s = L / nw
  for (let y = y0 + 0.9; y + 1.8 < y1; y += fl) {
    for (let i = 0; i < nw; i++) {
      const m = u0 + (i + 0.5) * s
      panel(out, f, m - 0.6, m + 0.6, 0.03, y, y + 1.9, GLASS, T.glass)
    }
  }
}

// ------------------------------------------------------------------------------------------- the building

function merchantsExchange(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < raw.length; i++) { const a = raw[i]; const b = raw[(i + 1) % raw.length]; area += a.x * b.z - b.x * a.z }
  const ring = simplifyRing(area >= 0 ? raw : [...raw].reverse(), 0.5)
  const N = ring.length
  // the California front: the edge (of any length worth the name) that faces −z, where the city puts the front
  let fi = 0
  let best = Infinity
  for (let i = 0; i < N; i++) {
    const f = frameOf(ring[i], ring[(i + 1) % N])
    if (f.L < 8) continue
    if (f.nz < best) { best = f.nz; fi = i }
  }
  // `front: "street"` resolves to the Leidesdorff flank (the bake's frontage, the longer street edge): the
  // California front then follows it round the outline, anticlockwise
  const len = (i: number): number => frameOf(ring[(i + N) % N], ring[(i + 1 + N) % N]).L
  if (len(fi) > 1.2 * len(fi + 1)) fi = (fi + 1) % N
  const F0 = frameOf(ring[fi], ring[(fi + 1) % N])
  // the lot in that frame: u along California, d back from it
  let uMin = Infinity
  let uMax = -Infinity
  let dMax = 0
  for (const p of ring) {
    const u = (p.x - F0.ox) * F0.tx + (p.z - F0.oz) * F0.tz
    const d = -((p.x - F0.ox) * F0.nx + (p.z - F0.oz) * F0.nz)
    uMin = Math.min(uMin, u)
    uMax = Math.max(uMax, u)
    dMax = Math.max(dMax, d)
  }
  const F = frameOf(pt(F0, uMin, 0), pt(F0, uMax, 0))
  const W = F.L
  const D = Math.max(10, dMax)
  // the tower stands on the front 44.5 m; the one-storey strip behind it (OSM's part) runs to the rear lot line
  const DT = D > 30 ? D - 10.2 : D
  const k = Math.max(0.6, Math.min(1.4, (fit.height || 61) / 61))
  const Y = Object.fromEntries(Object.entries(H0).map(([key, v]) => [key, v * k])) as Y
  const at = (u: number, d: number): P2 => pt(F, u, -d)

  // the street datum: the city sinks a model to its lowest ground; California's pavement at the door
  const door = at(W * 0.44, -2)
  const drop = fit.groundAt ? Math.max(0, Math.min(5, fit.groundAt(door.x, door.z))) : 0
  const v0 = out.positions.length

  // eight bays on California (≈4.6 m), the loggia in the third to fifth from Leidesdorff
  const n = Math.max(3, Math.round(W / 4.57))
  const b = W / n
  const port: [number, number] = n >= 8 ? [2, 5] : [Math.floor(n / 2) - 1, Math.floor(n / 2) + 2]
  streetFront(out, F, W, n, Y, drop, port)

  // the Leidesdorff flank: the wall from the front's u = 0 corner back to the tower's rear, dressed alike
  const E = frameOf(at(0, DT), at(0, 0))
  const nE = Math.max(3, Math.round(DT / 4.57))
  streetFront(out, E, DT, nE, Y, drop, null)

  // the west party wall, under 300 Montgomery's: plain, but its cornice is seen over the neighbour
  const Wp = frameOf(at(W, 0), at(W, DT))
  panel(out, Wp, 0, DT, 0, -drop, Y.frz, BUFF, T.ashlar)
  crownCornice(out, Wp, DT, Y)
  // the rear wall over the low strip
  const low = 6.5 * k
  const Rr = frameOf(at(W, DT), at(0, DT))
  punched(out, Rr, 0, W, low, Y.frz, Y.floor, 2.3, BUFF, T.ashlar)
  if (D - DT < 0.5) panel(out, Rr, 0, W, 0, -drop, low, BUFF, T.ashlar)
  crownCornice(out, Rr, W, Y)

  // the light court over the banking hall (OSM's part: u 16.5–30.5 m from Leidesdorff, d 16–32 m)
  const cu0 = W * 0.45
  const cu1 = W * 0.835
  const cd0 = DT * 0.36
  const cd1 = DT * 0.72
  const court = cu1 - cu0 > 4 && cd1 - cd0 > 4
  if (court) {
    const yc = 7.5 * k
    const walls: [P2, P2][] = [
      [at(cu0, cd0), at(cu1, cd0)], [at(cu1, cd0), at(cu1, cd1)], [at(cu1, cd1), at(cu0, cd1)], [at(cu0, cd1), at(cu0, cd0)],
    ]
    for (const [a, c] of walls) {
      // the court's walls face into it: from the court's side the outline runs clockwise
      const f = frameOf(c, a)
      punched(out, f, 0, f.L, yc, Y.frz + 1.0, Y.floor, 2.4, BUFF, T.ashlar)
    }
    // the hall's skylight at the bottom
    flat(out, F, cu0, cu1, -cd1, -cd0, yc, SKY, T.glass)
  }
  // the roof, round the court; the cornice's lid already caps the walls' line
  const yr = Y.top - 0.05
  if (court) {
    flat(out, F, 0, W, -cd0, 0, yr, ROOF)
    flat(out, F, 0, W, -DT, -cd1, yr, ROOF)
    flat(out, F, 0, cu0, -cd1, -cd0, yr, ROOF)
    flat(out, F, cu1, W, -cd1, -cd0, yr, ROOF)
  } else flat(out, F, 0, W, -DT, 0, yr, ROOF)
  // a parapet over the court's rim and the penthouse of the lifts, behind the front
  slab(out, F, 1.5 * b, 3.2 * b, -cd0 + 0.2, -6, yr, yr + 3.2, BUFF, T.ashlar, true, true)

  // the one-storey strip behind, to the rear lot line
  if (D - DT >= 0.5) {
    const S = frameOf(at(W, D), at(0, D))
    panel(out, S, 0, W, 0, -drop, low, BUFF, T.ashlar)
    const Se = frameOf(at(0, D), at(0, DT))
    panel(out, Se, 0, D - DT, 0, -drop, low, GRANITE, T.granite)
    for (let i = 0; i < 2; i++) panel(out, Se, 1.5 + i * 4.5, 4.5 + i * 4.5, 0.03, 0.4, 3.6, DOOR)
    slab(out, Se, -0.1, D - DT, 0, 0.3, low - 0.5, low, GTRIM, T.granite, true, false, true)
    flat(out, F, 0, W, -D, -DT, low, ROOF)
  }

  // ---- the entrance loggia: two free-standing fluted Ionic columns in antis, the doors behind
  const pu0 = port[0] * b + 1.15
  const pu1 = port[1] * b - 1.15
  const LD = 3.2                                          // the loggia's depth
  panel(out, F, pu0, pu1, -LD, -drop, Y.arch, SHADE, T.granite)
  for (const u of [pu0, pu1]) {
    // the antae's returns into the loggia
    const s = u === pu0 ? 1 : -1
    const q0 = P(F, u, -LD, -drop)
    const q1 = P(F, u, 0, -drop)
    const q2 = P(F, u, 0, Y.arch)
    const q3 = P(F, u, -LD, Y.arch)
    out.quad(s > 0 ? [q1, q0, q3, q2] : [q0, q1, q2, q3], [s * F.tx, 0, s * F.tz], UV, SOFFIT, T.granite)
  }
  flat(out, F, pu0, pu1, -LD, 0, Y.arch, SOFFIT, T.granite, true)
  flat(out, F, pu0, pu1, -LD, 0, 0.3, GRANITE, T.granite)
  // a step up into it across the front
  slab(out, F, pu0, pu1, -0.2, 0.5, -drop, 0.15, GTRIM, T.granite, true)
  for (let i = port[0]; i < port[1]; i++) {
    const m = (i + 0.5) * b
    const w = Math.min(1.5, b * 0.33)
    // the bronze doors and their transom, the window of the floor over them
    panel(out, F, m - w, m + w, -LD + 0.03, 0.3, Y.shop - 1.6, DOOR)
    panel(out, F, m - w, m + w, -LD + 0.03, Y.shop - 1.3, Y.shop + 0.4, GLASS, T.glass)
    panel(out, F, m - w, m + w, -LD + 0.03, Y.band + 0.2, Y.win2 - 0.1, GLASS, T.glass)
    slab(out, F, m - w - 0.3, m + w + 0.3, -LD, -LD + 0.25, Y.shop + 0.6, Y.band - 0.1, GTRIM, T.granite, true, false, true)
  }
  const heading = Math.atan2(F.nx, F.nz)
  for (let i = port[0] + 1; i < port[1]; i++) {
    const c = pt(F, i * b, -0.45)
    column(out, c.x, c.z, 0.3, Y.order + 0.15, 0.85, GRANITE, { order: 'ionic', tier: 'near', heading, flutes: true, tag: T.granite, trim: GTRIM })
  }

  if (drop > 0) for (let q = v0 + 1; q < out.positions.length; q += 3) out.positions[q] += drop
}

export const CALIFORNIA_465: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/256067740 — the Merchants Exchange Building, 465 California Street (OSM names it for a tenant). */
  californiaBankAndTrust: merchantsExchange,
}
