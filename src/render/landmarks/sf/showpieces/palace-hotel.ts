/**
 * The Palace Hotel (Trowbridge & Livingston, 1909, rebuilt on the 1875 hotel's site after the fire), 2 New
 * Montgomery Street at Market: relation/3492933. From the Mapillary frames in refs/relation-3492933/ (2026-10-21:
 * 01 and 04 the Market / New Montgomery corner, 05 and 07 the New Montgomery front, 02 the Market / Annie corner;
 * the Market front itself was under scaffold netting) and Wikipedia (nine storeys, about 35 m).
 *
 * What it is, from the frames:
 *  - a whole block, a plain rectangle (Market 79 m, New Montgomery 102 m), every corner ROUNDED full height: a
 *    curved bay with one window a floor, iron balconies on them, flanked by channelled ("banded") brick strips;
 *  - a two-storey base of cream terracotta: tall dark shopfronts in black metal frames, a mezzanine transom in
 *    each, between broad plain cream piers; a frieze and a strong projecting cornice over it;
 *  - six storeys of buff brick, single windows in an even rhythm, the long fronts divided into a CORNER
 *    PAVILION at each end (a little proud, edged with the banded strips) and the long run between;
 *  - a cream string course, the TOP STOREY of round-arched windows in cream terracotta, then the heavy bracketed
 *    cornice and a cresting along its lip;
 *  - the hotel's own entrance mid-way down New Montgomery under a dark canopy with the name and flags;
 *  - inside the block, the GARDEN COURT: its glass roof sits low in a court open to the sky, seen from above.
 *
 * The frame: the real outline (simplified to its four walls). New Montgomery and Annie are both 102 m and Market
 * and Jessie both 79 m, so which is which is read off the FRONT the city gives (+z): the edge facing +z is taken
 * as Market if it is a short edge and New Montgomery if long, and the CCW order gives the rest (New Montgomery
 * is followed by Market). The manifest should carry front 315 (Market's bearing) so the front is Market.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygonWithHoles } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { signText, edgeFacing } from '../../parts.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const EMIT = 0.5
const T = { brick: surfaceTag('brick'), terracotta: surfaceTag('terracotta'), metal: surfaceTag('metal'), glass: surfaceTag('glass'), concrete: surfaceTag('concrete') }

/** the buff brick of the shaft (frames 05, 07: a warm tan, lighter in sun) */
const BRICK: Rgb = [0.82, 0.69, 0.5]
/** the channelled strips: the same brick, read darker for their shadow lines */
const BAND: Rgb = [0.74, 0.61, 0.44]
const JOINT: Rgb = [0.5, 0.41, 0.3]
/** the cream terracotta of the base, the string course, the top storey and the cornice */
const CREAM: Rgb = [0.91, 0.87, 0.77]
const CREAM_D: Rgb = [0.8, 0.76, 0.66]
const SOFFIT: Rgb = [0.6, 0.57, 0.5]
const DARK: Rgb = [0.12, 0.13, 0.14]
const FRAME: Rgb = [0.08, 0.08, 0.09]
const GLASS: Rgb = [0.24, 0.26, 0.28]
const IRON: Rgb = [0.13, 0.13, 0.13]
const ROOF: Rgb = [0.45, 0.43, 0.41]
const SKY: Rgb = [0.6, 0.68, 0.72]
const BAR: Rgb = [0.3, 0.32, 0.33]
const GOLD: Rgb = [0.85, 0.7, 0.36]
const FLAGS: Rgb[] = [[0.7, 0.14, 0.14], [0.15, 0.2, 0.45], [0.9, 0.88, 0.82]]

/** Heights over the pavement. */
const Y = {
  base: 8.4,       // top of the two-storey base's wall, the frieze above
  baseTop: 9.6,    // top of the base's cornice
  shaft: 29.4,     // six brick storeys of 3.3 m
  string: 30.1,    // the cream string course under the top storey
  top: 33.6,       // the top storey's wall: the cornice's frieze starts
  corn: 34.4,      // the cornice's corona
  eaves: 35.4,     // the cornice's top: the roof
  court: 15.5,     // the Garden Court's glass roof springs here
}
const FLOOR = 3.3

// ------------------------------------------------------------------------------------------- an edge's frame

/** A wall's frame: `u` along it from `o`rigin, `o` outward (negative into the building), y up. */
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

/** A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up (`bottom` false drops the underside). */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, bottom = true, back = true): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], [f.nx, 0, f.nz], UV, c, tag)
  if (back) out.quad([Q(u1, o0, y0), Q(u0, o0, y0), Q(u0, o0, y1), Q(u1, o0, y1)], [-f.nx, 0, -f.nz], UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], [-f.tx, 0, -f.tz], UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], [f.tx, 0, f.tz], UV, c, tag)
  out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (bottom) out.quad([Q(u0, o1, y0), Q(u0, o0, y0), Q(u1, o0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}

/** A flat rectangle facing out of the wall, `o` metres proud of it. */
function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], [f.nx, 0, f.nz], UV, c, tag)
}

/** A round-headed opening `w` wide, `h` tall from `y0`, centred `u` along, `o` proud: a rectangle and a half-disc. */
function arch(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, w: number, h: number, c: Rgb, seg = 4, tag = FIXED): void {
  const r = w / 2
  const spring = y0 + h - r
  if (spring > y0) panel(out, f, u - r, u + r, o, y0, spring, c, tag)
  for (let i = 0; i < seg; i++) {
    const a0 = Math.PI - (i / seg) * Math.PI
    const a1 = Math.PI - ((i + 1) / seg) * Math.PI
    out.quad([P(f, u, o, spring), P(f, u + Math.cos(a0) * r, o, spring + Math.sin(a0) * r), P(f, u + Math.cos(a1) * r, o, spring + Math.sin(a1) * r), P(f, u, o, spring)],
      [f.nx, 0, f.nz], UV, c, tag)
  }
}

// -------------------------------------------------------------------------------------------- the pieces

/** The channelled brick of a strip: its joints as shadow lines through the six brick storeys. */
function banded(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number): void {
  panel(out, f, u0, u1, o, Y.baseTop, Y.shaft, BAND, T.brick)
  for (let y = Y.baseTop + 0.7; y < Y.shaft - 0.2; y += 0.7) panel(out, f, u0, u1, o + 0.02, y - 0.07, y + 0.07, JOINT)
}

/** A shaft window: the dark glass, the cream lintel over it and the sill under it, `bal` an iron balcony. */
function shaftWindow(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, w: number, bal: boolean): void {
  panel(out, f, u - w / 2, u + w / 2, o + 0.03, y0 + 0.85, y0 + 2.85, GLASS, T.glass)
  panel(out, f, u - w / 2 - 0.2, u + w / 2 + 0.2, o + 0.02, y0 + 2.85, y0 + 3.15, CREAM_D, T.terracotta)
  if (bal) {
    // a little iron balcony on its cream slab: the slab's front and top, the railing as a dark band
    slab(out, f, u - w / 2 - 0.25, u + w / 2 + 0.25, o, o + 0.45, y0 + 0.65, y0 + 0.85, CREAM, T.terracotta, true, false)
    panel(out, f, u - w / 2 - 0.25, u + w / 2 + 0.25, o + 0.46, y0 + 1.25, y0 + 1.4, IRON, T.metal)
  } else {
    panel(out, f, u - w / 2 - 0.1, u + w / 2 + 0.1, o + 0.02, y0 + 0.7, y0 + 0.85, CREAM_D, T.terracotta)
  }
}

/** A round-arched top-storey window in its cream surround with a keystone. */
function topWindow(out: MeshBuilder, f: Fr, u: number, o: number, w: number): void {
  arch(out, f, u, o + 0.02, Y.string + 0.5, w + 0.6, 2.85, CREAM_D, 4, T.terracotta)
  arch(out, f, u, o + 0.04, Y.string + 0.6, w, 2.55, GLASS, 4, T.glass)
  panel(out, f, u - 0.18, u + 0.18, o + 0.05, Y.string + 2.75, Y.string + 3.35, CREAM)
}

/**
 * The ground storeys of one stretch: cream piers, and in each bay a tall dark shopfront in a black frame with a
 * mezzanine transom (frames 01, 05, 07). `skip` returns the bays to leave plain (the hotel door's).
 */
function base(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, pitch: number): void {
  panel(out, f, u0, u1, o, 0, Y.base, CREAM, T.terracotta)
  const n = Math.max(1, Math.round((u1 - u0) / pitch))
  const step = (u1 - u0) / n
  for (let i = 0; i < n; i++) {
    const u = u0 + step * (i + 0.5)
    const w = Math.min(4.6, step - 2.0)
    if (w < 1.2) continue
    panel(out, f, u - w / 2 - 0.25, u + w / 2 + 0.25, o + 0.02, 0.3, 7.2, FRAME, T.metal)
    panel(out, f, u - w / 2, u + w / 2, o + 0.04, 0.4, 4.6, DARK, T.glass)
    panel(out, f, u - w / 2, u + w / 2, o + 0.04, 5.3, 7.0, GLASS, T.glass)
    // the mullions through it
    for (const k of [-1, 1]) panel(out, f, u + (k * w) / 6 - 0.1, u + (k * w) / 6 + 0.1, o + 0.05, 0.4, 7.0, FRAME, T.metal)
  }
  // the plinth
  panel(out, f, u0, u1, o + 0.01, 0, 0.3, CREAM_D, T.terracotta)
}

/** The base's frieze and cornice, the string course, the top storey's frieze and the main cornice, along a stretch. */
function bands(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, ext: number): void {
  panel(out, f, u0, u1, o + 0.04, Y.base - 0.1, Y.base + 0.5, CREAM_D, T.terracotta)
  slab(out, f, u0 - ext, u1 + ext, o - 0.4, o + 0.55, Y.base + 0.5, Y.baseTop, CREAM, T.terracotta, true, false)
  slab(out, f, u0 - ext * 0.5, u1 + ext * 0.5, o - 0.3, o + 0.25, Y.shaft, Y.string, CREAM, T.terracotta, true, false)
  // the iron railing along the string course (the dark line under the top storey in frame 04)
  panel(out, f, u0, u1, o + 0.24, Y.string + 0.35, Y.string + 0.5, IRON, T.metal)
  // the top storey's wall is the brick again, its arches in cream; the cream frieze under the cornice
  panel(out, f, u0, u1, o, Y.string, Y.top - 0.8, BRICK, T.brick)
  panel(out, f, u0, u1, o, Y.top - 0.8, Y.corn, CREAM, T.terracotta)
  slab(out, f, u0 - ext * 1.4, u1 + ext * 1.4, o - 0.4, o + 0.35, Y.top, Y.corn, CREAM_D, T.terracotta, false, false)
  slab(out, f, u0 - ext * 2.4, u1 + ext * 2.4, o - 0.5, o + 1.3, Y.corn, Y.eaves, CREAM, T.terracotta, true, false)
  panel(out, f, u0 - ext * 2.4, u1 + ext * 2.4, o + 1.31, Y.corn + 0.15, Y.corn + 0.25, SOFFIT)
}

/** The brackets (modillions) under the cornice and the cresting along its lip, every `pitch` metres. */
function brackets(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, pitch: number): void {
  const n = Math.max(1, Math.round((u1 - u0) / pitch))
  const step = (u1 - u0) / n
  for (let i = 0; i <= n; i++) {
    const u = u0 + step * i
    // the bracket: front and sides only (its top is under the corona, its back in the wall)
    const Q = (uu: number, oo: number, y: number) => P(f, uu, oo, y)
    const a = u - 0.17, b = u + 0.17, y0 = Y.corn - 0.75, y1 = Y.corn, o1 = o + 1.1
    out.quad([Q(a, o1, y0 + 0.35), Q(b, o1, y0 + 0.35), Q(b, o1, y1), Q(a, o1, y1)], [f.nx, 0, f.nz], UV, CREAM, T.terracotta)
    out.quad([Q(a, o, y0), Q(a, o1, y0 + 0.35), Q(a, o1, y1), Q(a, o, y1)], [-f.tx, 0, -f.tz], UV, CREAM_D, T.terracotta)
    out.quad([Q(b, o1, y0 + 0.35), Q(b, o, y0), Q(b, o, y1), Q(b, o1, y1)], [f.tx, 0, f.tz], UV, CREAM_D, T.terracotta)
    out.quad([Q(a, o, y0), Q(b, o, y0), Q(b, o1, y0 + 0.35), Q(a, o1, y0 + 0.35)], [0, -1, 0], UV, SOFFIT, T.terracotta)
    // the cresting: a shell-topped antefix on the lip, both faces
    const c = u + step / 2
    if (i < n) {
      const ol = o + 1.15
      const s = 0.38
      out.quad([Q(c - s, ol, Y.eaves), Q(c + s, ol, Y.eaves), Q(c + s * 0.45, ol, Y.eaves + 0.75), Q(c - s * 0.45, ol, Y.eaves + 0.75)], [f.nx, 0, f.nz], UV, CREAM, T.terracotta)
      out.quad([Q(c + s, ol, Y.eaves), Q(c - s, ol, Y.eaves), Q(c - s * 0.45, ol, Y.eaves + 0.75), Q(c + s * 0.45, ol, Y.eaves + 0.75)], [-f.nx, 0, -f.nz], UV, CREAM_D, T.terracotta)
    }
  }
}

// -------------------------------------------------------------------------------------------- the walls

/**
 * One long front between two rounded corners (`u` 0..L of the straight wall): base, banded strips and the corner
 * pavilions, the shaft's windows, the top storey, the cornice.
 */
function front(out: MeshBuilder, f: Fr): void {
  const L = f.L
  const strip = 1.7
  const pavW = Math.min(7.2, L * 0.12)       // the corner pavilion: two windows wide
  const proud = 0.35
  const pitch = 3.3
  // the stretches: [pavilion][strip] run [strip][pavilion], the strips edging the pavilions
  const p0 = [0, pavW] as const
  const s0 = [pavW, pavW + strip] as const
  const r = [pavW + strip, L - pavW - strip] as const
  const s1 = [L - pavW - strip, L - pavW] as const
  const p1 = [L - pavW, L] as const

  base(out, f, 0, L, 0, 6.6)
  bands(out, f, 0, L, 0, 0.3)
  // the run's brick, the pavilions' brick proud of it, their returns
  panel(out, f, r[0], r[1], 0, Y.baseTop, Y.shaft, BRICK, T.brick)
  for (const [a, b] of [p0, p1]) {
    slab(out, f, a, b, -0.1, proud, Y.baseTop, Y.shaft, BRICK, T.brick, false, false)
  }
  for (const [a, b] of [s0, s1]) banded(out, f, a, b, 0.12)
  // the shaft's windows: the run at an even pitch, two in each pavilion
  const n = Math.max(1, Math.round((r[1] - r[0]) / pitch))
  const step = (r[1] - r[0]) / n
  const cols: [number, number][] = []
  for (let i = 0; i < n; i++) cols.push([r[0] + step * (i + 0.5), 0])
  for (const [a, b] of [p0, p1]) for (const t of [0.3, 0.7]) cols.push([a + (b - a) * t, proud])
  for (const [u, o] of cols) {
    for (let k = 0; k < 6; k++) {
      // balconies on the pavilions every floor, along the run on the third and the seventh floors (frame 05)
      const bal = o > 0 ? k % 2 === 0 : k === 0 || k === 4
      shaftWindow(out, f, u, o, Y.baseTop + k * FLOOR, 1.25, bal)
    }
    topWindow(out, f, u, 0, 1.3)
  }
  brackets(out, f, -0.3, L + 0.3, 0, 1.9)
}

/** A rounded corner's facet: base, brick, a window a floor with its balcony on the middle facet, the bands. */
function cornerFacet(out: MeshBuilder, f: Fr, middle: boolean, door: boolean): void {
  const L = f.L
  panel(out, f, 0, L, 0, 0, Y.base, CREAM, T.terracotta)
  if (middle) {
    if (door) {
      panel(out, f, L / 2 - 1.3, L / 2 + 1.3, 0.02, 0.2, 7.2, FRAME, T.metal)
      panel(out, f, L / 2 - 1.05, L / 2 + 1.05, 0.04, 0.3, 4.4, DARK, T.glass)
      panel(out, f, L / 2 - 1.05, L / 2 + 1.05, 0.04, 5.0, 7.0, GLASS, T.glass)
    } else panel(out, f, L / 2 - 1.0, L / 2 + 1.0, 0.03, 0.4, 7.0, DARK, T.glass)
    panel(out, f, 0, L, 0, Y.baseTop, Y.shaft, BRICK, T.brick)
    for (let k = 0; k < 6; k++) shaftWindow(out, f, L / 2, 0, Y.baseTop + k * FLOOR, 1.15, true)
    topWindow(out, f, L / 2, 0, 1.15)
  } else banded(out, f, 0, L, 0)
  bands(out, f, 0, L, 0, 0.05)
  brackets(out, f, 0, L, 0, L)
}

// ------------------------------------------------------------------------------------------ the building

function palaceHotel(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < raw.length; i++) { const a = raw[i]; const b = raw[(i + 1) % raw.length]; area += a.x * b.z - b.x * a.z }
  const ring0 = area >= 0 ? raw : [...raw].reverse()
  const ring = simplifyRing(ring0, 1.0)
  const N = ring.length

  // ---- which edge is which: Market faces the front (+z) if short; if the front is long it is New Montgomery
  const fi = edgeFacing(ring, 0)
  const lens = ring.map((_, i) => frameOf(ring[i], ring[(i + 1) % N]).L)
  const neighbours = (lens[(fi + 1) % N] + lens[(fi - 1 + N) % N]) / 2
  // in CCW order New Montgomery is followed by Market
  const market = lens[fi] <= neighbours ? fi : (fi + 1) % N
  const newMont = (market - 1 + N) % N

  // ---- the rounded corners: each vertex replaced by a circular arc of three facets
  const R = 5
  const SEG = 3
  type Corner = { pts: P2[] }
  const corners: Corner[] = []
  const trims: number[] = []
  for (let i = 0; i < N; i++) {
    const p = ring[i]
    const prev = ring[(i - 1 + N) % N]
    const next = ring[(i + 1) % N]
    const d0 = Math.hypot(p.x - prev.x, p.z - prev.z) || 1
    const d1 = Math.hypot(next.x - p.x, next.z - p.z) || 1
    const ux = (prev.x - p.x) / d0, uz = (prev.z - p.z) / d0
    const vx = (next.x - p.x) / d1, vz = (next.z - p.z) / d1
    const cosA = ux * vx + uz * vz
    const half = Math.acos(Math.max(-1, Math.min(1, cosA))) / 2
    // a tangent arc of radius R: trimmed back `t` along both edges
    let t = R / Math.tan(half || 1e-3)
    t = Math.min(t, d0 / 3, d1 / 3)
    trims.push(t)
    const a = { x: p.x + ux * t, z: p.z + uz * t }
    const b = { x: p.x + vx * t, z: p.z + vz * t }
    // the arc's centre: along the bisector
    const bx = ux + vx, bz = uz + vz
    const bl = Math.hypot(bx, bz) || 1
    const rr = t * Math.tan(half)
    const cd = Math.hypot(t, rr)
    const c = { x: p.x + (bx / bl) * cd, z: p.z + (bz / bl) * cd }
    const a0 = Math.atan2(a.z - c.z, a.x - c.x)
    let a1 = Math.atan2(b.z - c.z, b.x - c.x)
    // the short way round
    while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI
    while (a1 - a0 < -Math.PI) a1 += 2 * Math.PI
    const pts: P2[] = []
    for (let k = 0; k <= SEG; k++) {
      const ang = a0 + ((a1 - a0) * k) / SEG
      pts.push({ x: c.x + Math.cos(ang) * rr, z: c.z + Math.sin(ang) * rr })
    }
    corners.push({ pts })
  }
  // the working outline: each corner's arc, then on to the next
  const outline: P2[] = []
  for (const c of corners) outline.push(...c.pts)

  // ---- the walls
  for (let i = 0; i < N; i++) {
    const a = corners[i].pts[SEG]
    const b = corners[(i + 1) % N].pts[0]
    front(out, frameOf(a, b))
    // the corner at vertex i+1 (between this edge and the next)
    const c = corners[(i + 1) % N].pts
    const mnCorner = i === newMont // New Montgomery's end: the Market corner, with its door (frame 01)
    for (let k = 0; k < SEG; k++) cornerFacet(out, frameOf(c[k], c[k + 1]), k === 1, mnCorner)
  }

  // ---- the Garden Court: a court open to the sky in the middle of the block, its glass roof low in it
  const M = frameOf(ring[market], ring[(market + 1) % N])
  // Market's frame runs from New Montgomery's corner to Annie's; the court sits behind the middle of it (OSM's inner way)
  const depth = frameOf(ring[newMont], ring[market]).L
  const cu0 = M.L * 0.22, cu1 = M.L * 0.78
  const co0 = -Math.min(42, depth * 0.42), co1 = -13
  let hole = [pt(M, cu0, co1), pt(M, cu1, co1), pt(M, cu1, co0), pt(M, cu0, co0)]
  let ha = 0
  for (let i = 0; i < 4; i++) { const p = hole[i]; const q = hole[(i + 1) % 4]; ha += p.x * q.z - q.x * p.z }
  // clockwise, so each court wall's frame normal points into the court
  if (ha > 0) hole = hole.reverse()
  capPolygonWithHoles(out, [outline, hole], Y.eaves - 0.1, ROOF, T.concrete)
  for (let i = 0; i < 4; i++) {
    const f = frameOf(hole[i], hole[(i + 1) % 4])
    panel(out, f, 0, f.L, 0, Y.court, Y.eaves - 0.1, BRICK, T.brick)
    // the court's windows: plain, a floor apart
    const n = Math.max(1, Math.round((f.L - 2) / 3.6))
    const step = (f.L - 2) / n
    for (let k = 0; k < n; k++) {
      const u = 1 + step * (k + 0.5)
      for (let y = Y.court + 3.2; y < Y.shaft; y += FLOOR) panel(out, f, u - 0.6, u + 0.6, 0.03, y, y + 1.9, GLASS, T.glass)
    }
    // the court's coping
    slab(out, f, 0, f.L, -0.2, 0.35, Y.eaves - 0.1, Y.eaves + 0.35, CREAM_D, T.terracotta, false, false)
  }
  // the glass roof: a long gable of glass in dark glazing bars, ridge along Market
  {
    const g = frameOf(pt(M, cu0, co1), pt(M, cu1, co1))
    // in g's frame the court lies at negative o (into the building from Market): from 0 to co0-co1
    const w = co1 - co0
    const om = -w / 2
    const rise = 3.6
    const y0 = Y.court, y1 = Y.court + rise
    const k = Math.hypot(rise, w / 2)
    // the Market-side slope faces +o and up; the far one faces −o and up
    out.quad([P(g, 0, 0, y0), P(g, g.L, 0, y0), P(g, g.L, om, y1), P(g, 0, om, y1)], [g.nx * rise / k, (w / 2) / k, g.nz * rise / k], UV, SKY, T.glass)
    out.quad([P(g, g.L, -w, y0), P(g, 0, -w, y0), P(g, 0, om, y1), P(g, g.L, om, y1)], [-g.nx * rise / k, (w / 2) / k, -g.nz * rise / k], UV, SKY, T.glass)
    // the gable ends
    out.quad([P(g, 0, -w, y0), P(g, 0, 0, y0), P(g, 0, om, y1), P(g, 0, om, y1)], [-g.tx, 0, -g.tz], UV, SKY, T.glass)
    out.quad([P(g, g.L, 0, y0), P(g, g.L, -w, y0), P(g, g.L, om, y1), P(g, g.L, om, y1)], [g.tx, 0, g.tz], UV, SKY, T.glass)
    // the glazing bars across both slopes, and the ridge
    const nb = Math.round(g.L / 2.4)
    for (let i = 1; i < nb; i++) {
      const u = (g.L * i) / nb
      for (const [oa, ob] of [[0, om], [-w, om]]) {
        const s = oa === 0 ? 1 : -1
        const lift = 0.04
        out.quad([P(g, u - 0.12, oa, y0 + lift), P(g, u + 0.12, oa, y0 + lift), P(g, u + 0.12, ob, y1 + lift), P(g, u - 0.12, ob, y1 + lift)],
          [g.nx * s * rise / k, (w / 2) / k, g.nz * s * rise / k], UV, BAR, T.metal)
      }
    }
    slab(out, g, 0, g.L, om - 0.2, om + 0.2, y1 - 0.05, y1 + 0.3, BAR, T.metal, false, false)
    // the court's floor under the glass is the roof of the lower floors: a deck round the glass
    slab(out, g, -0.5, g.L + 0.5, -w - 0.5, 0.5, y0 - 0.4, y0, ROOF, T.concrete, false, false)
  }

  // ---- the roof: a few plant houses, and the water tank on the Jessie side
  {
    const J = frameOf(ring[(market + 2) % N], ring[(market + 3) % N])
    slab(out, J, J.L * 0.3, J.L * 0.3 + 9, -14, -6, Y.eaves - 0.1, Y.eaves + 3.2, CREAM_D, T.concrete, false)
    slab(out, J, J.L * 0.62, J.L * 0.62 + 6, -24, -17, Y.eaves - 0.1, Y.eaves + 2.6, CREAM_D, T.concrete, false)
    const c = pt(M, M.L * 0.5, -Math.max(-co0 + 8, depth - 18))
    prism(out, c.x, c.z, Y.eaves - 0.1, Y.eaves + 4.5, 2.2, 8, [0.4, 0.37, 0.34], T.metal, 0)
  }

  // ---- the hotel's entrance on New Montgomery: the dark canopy with the name, and the flags over it
  {
    const nm = newMont
    const a = corners[nm].pts[SEG]
    const b = corners[(nm + 1) % N].pts[0]
    const f = frameOf(a, b)
    // u runs from the Jessie end toward Market; the entrance is a little past the middle from Market
    const u = f.L * 0.42
    const hw = 6
    slab(out, f, u - hw, u + hw, 0, 4.6, 4.6, 5.3, FRAME, T.metal)
    // the lit soffit
    out.quad([P(f, u - hw + 0.2, 4.4, 4.58), P(f, u + hw - 0.2, 4.4, 4.58), P(f, u + hw - 0.2, 0.2, 4.58), P(f, u - hw + 0.2, 0.2, 4.58)], [0, -1, 0], UV, [1, 0.92, 0.75], EMIT)
    // its posts at the kerb
    for (const s of [-1, 1]) {
      const p = pt(f, u + s * (hw - 0.3), 4.3)
      prism(out, p.x, p.z, 0, 4.6, 0.09, 6, FRAME, T.metal, 0)
    }
    const nameAt = pt(f, u, 4.62)
    signText(out, 'PALACE HOTEL', nameAt.x, 4.95, nameAt.z, 0.42, GOLD, { heading: Math.atan2(f.nx, f.nz), lit: true })
    // the doors under it
    panel(out, f, u - 3.2, u + 3.2, 0.05, 0.2, 4.4, DARK, T.glass)
    // the flags: three poles out from the wall over the canopy
    for (let k = -1; k <= 1; k++) {
      const pu = u + k * 3.6
      const p0 = P(f, pu, 0.1, 7.6)
      const p1 = P(f, pu, 3.6, 10.2)
      const d = 0.06
      out.quad([[p0[0], p0[1] - d, p0[2]], [p1[0], p1[1] - d, p1[2]], [p1[0], p1[1] + d, p1[2]], [p0[0], p0[1] + d, p0[2]]], [f.tx, 0, f.tz], UV, IRON, T.metal)
      out.quad([[p1[0], p1[1] - d, p1[2]], [p0[0], p0[1] - d, p0[2]], [p0[0], p0[1] + d, p0[2]], [p1[0], p1[1] + d, p1[2]]], [-f.tx, 0, -f.tz], UV, IRON, T.metal)
      // the flag hangs from the pole's outer half
      const q0 = P(f, pu, 1.4, 8.6)
      const flag = FLAGS[k + 1]
      const qs: [number, number, number][] = [[q0[0], q0[1] - 2.6, q0[2]], [p1[0], p1[1] - 2.6, p1[2]], [p1[0], p1[1] - 0.05, p1[2]], [q0[0], q0[1] - 0.05, q0[2]]]
      out.quad(qs, [f.tx, 0, f.tz], UV, flag, FIXED)
      out.quad([qs[1], qs[0], qs[3], qs[2]], [-f.tx, 0, -f.tz], UV, flag, FIXED)
    }
  }
}

export const PALACE_HOTEL: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** The Palace Hotel (relation/3492933), Market at New Montgomery: the 1909 block, rounded corners, the Garden Court. */
  palaceHotel,
}
