/**
 * The two libraries of Civic Center, either side of Fulton Street, built by hand from their photographs (Mapillary
 * frames in the brief's refs, and Commons: "SFPL Main Branch Exterior from Grove & Hyde St.jpg", "San Francisco
 * Public Library - Main Branch, exterior, from Grove Street.jpg"; the wHY rendering of the 2023 pavilion).
 *
 * - `asianArtMuseum` — the 1917 Main Library (George Kelham), the Asian Art Museum since 2003: on Larkin, facing the
 *   plaza, a broad low flight of steps to a terrace and three doors in a rusticated ground storey; above it a loggia
 *   of Ionic columns, single at the ends and paired between, five bays deep in shadow; end pavilions with one tall
 *   arched window each; an inscribed frieze, a plain attic, a heavy modillioned cornice with its cresting, a low
 *   hipped roof and three flagpoles. Down the sides the base runs on and the piano nobile is a row of arched
 *   windows between pilasters. On Hyde, the 2023 Yamazaki–Yang pavilion: a pale stone plinth, a band of faceted
 *   glass bays, the softly ribbed pale terracotta box above it and its roof terrace.
 * - `mainLibrary` — the 1996 Main Library (Pei Cobb Freed with SMWM): Larkin and Fulton answer the old library —
 *   Sierra White granite, a two-storey base, plain round columns between tall gridded windows, end blocks with one
 *   window each, a set-back attic and a thin projecting roof slab. Grove and Hyde are the modern half: a granite
 *   panel grid with punched, framed windows and dark bands, deep slots, the glazed Grove entrance; at the corner a
 *   tower with a big 45° chamfer and a slot cut under its top over a low chamfered corner block; along Hyde a
 *   podium whose roof is a terrace, and behind it the convex DRUM of pale panels with its staggered windows; on
 *   the roof, the diagonal glazed skylight over the atrium (OSM's `building:part=roof` diamond).
 *
 * Both are drawn in a frame of their own — the Larkin front toward −z, +z into the block — found from the real
 * outline by the length of a Larkin edge, which no rotation changes, and turned back onto the outline at the end.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { column, placed, roof } from '../../kit.ts'
import { entablature, railing, stair } from '../../parts.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
/** keeps its colour and glows after dark (models.ts EMIT) */
const EMIT = 0.5

const T = {
  granite: surfaceTag('granite'), ashlar: surfaceTag('ashlar'), metal: surfaceTag('metal'), glass: surfaceTag('glass'),
  terracotta: surfaceTag('terracotta'), concrete: surfaceTag('concrete'), stucco: surfaceTag('stucco'), tile: surfaceTag('tile'),
}

// ------------------------------------------------------------------------------------------------- the frame

interface Frame {
  /** the outline in the building's own frame: x along the front, z into the block, the front at zF facing −z */
  ring: P2[]
  /** the turn that puts the frame back on the outline (kit `placed`) */
  angle: number
  zF: number
}

/**
 * The building's own frame from its outline: the front is the outline edge nearest `frontLen` metres long (within
 * 2.5 m), +x running the way the anticlockwise outline runs along it; without one, the fitted box's −z side.
 */
function frameFor(fit: Fit, frontLen: number): Frame {
  const ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let best = -1
  let score = 2.5
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const d = Math.abs(Math.hypot(b.x - a.x, b.z - a.z) - frontLen)
    if (d < score) { score = d; best = i }
  }
  if (best < 0) {
    // the −z side: the longest-weighted edge facing most nearly −z
    let s = -Infinity
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
      const nz = -(b.x - a.x) / L
      const v = -nz * L
      if (v > s) { s = v; best = i }
    }
  }
  const a = ring[best]
  const b = ring[(best + 1) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  // inward: minus the outward normal (tz, −tx)
  const dx = -tz
  const dz = tx
  const to = (p: P2): P2 => ({ x: p.x * tx + p.z * tz, z: p.x * dx + p.z * dz })
  return { ring: ring.map(to), angle: Math.atan2(dx, dz), zF: to(a).z }
}

/** Where a line z = const crosses the outline: its least and greatest x. */
function spanAt(ring: P2[], z: number): [number, number] {
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    if ((a.z - z) * (b.z - z) > 0 || a.z === b.z) continue
    const x = a.x + ((z - a.z) / (b.z - a.z)) * (b.x - a.x)
    lo = Math.min(lo, x)
    hi = Math.max(hi, x)
  }
  if (lo > hi) { for (const p of ring) { lo = Math.min(lo, p.x); hi = Math.max(hi, p.x) } }
  return [lo, hi]
}

interface Rect { x0: number; x1: number; z0: number; z1: number }

/** The outline cut into strips across its depth, one per step in it (OSM's jogs), neighbours of a width merged. */
function strips(ring: P2[]): Rect[] {
  const zs = [...ring.map((p) => p.z)].sort((p, q) => p - q)
  const cuts: number[] = []
  for (const z of zs) if (cuts.length === 0 || z - cuts[cuts.length - 1] > 1.0) cuts.push(z)
  cuts[cuts.length - 1] = zs[zs.length - 1]
  const res: Rect[] = []
  for (let i = 0; i < cuts.length - 1; i++) {
    const [x0, x1] = spanAt(ring, (cuts[i] + cuts[i + 1]) / 2)
    const prev = res[res.length - 1]
    if (prev && Math.abs(prev.x0 - x0) < 0.8 && Math.abs(prev.x1 - x1) < 0.8) prev.z1 = cuts[i + 1]
    else res.push({ x0, x1, z0: cuts[i], z1: cuts[i + 1] })
  }
  return res
}

// ------------------------------------------------------------------------------------------------ the pieces

const quad = (q: MeshBuilder, p: V3[], n: V3, c: Rgb, tag = 0): void => q.quad(p, n, UV, c, tag)

/** A block from its extents. */
function blk(q: MeshBuilder, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: Rgb, tag = 0): void {
  box(q, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, Math.abs(z1 - z0) / 2, c, tag)
}

/**
 * A wall to draw on: the plane x = `plane` (axis 'x') or z = `plane` (axis 'z'), its outward normal along +axis
 * when `s` is 1. A point on it is (t along it, y, o out from it).
 */
interface Wall { axis: 'x' | 'z'; plane: number; s: 1 | -1 }
const P = (w: Wall, t: number, y: number, o: number): V3 =>
  w.axis === 'z' ? [t, y, w.plane + w.s * o] : [w.plane + w.s * o, y, t]
const N = (w: Wall): V3 => (w.axis === 'z' ? [0, 0, w.s] : [w.s, 0, 0])

/** A flat panel on a wall, `o` proud of it. */
function pnl(q: MeshBuilder, w: Wall, t0: number, t1: number, y0: number, y1: number, o: number, c: Rgb, tag = 0): void {
  quad(q, [P(w, t0, y0, o), P(w, t1, y0, o), P(w, t1, y1, o), P(w, t0, y1, o)], N(w), c, tag)
}

/** A block on a wall: `t0..t1` along it, `o0..o1` out from it. */
function onWall(q: MeshBuilder, w: Wall, t0: number, t1: number, y0: number, y1: number, o0: number, o1: number, c: Rgb, tag = 0): void {
  const a = P(w, t0, y0, o0)
  const b = P(w, t1, y1, o1)
  blk(q, Math.min(a[0], b[0]), Math.max(a[0], b[0]), y0, y1, Math.min(a[2], b[2]), Math.max(a[2], b[2]), c, tag)
}

/** A round-headed opening on a wall: the rectangle and its half-disc, `o` proud. */
function arch(q: MeshBuilder, w: Wall, t: number, y0: number, wd: number, h: number, o: number, c: Rgb, tag = 0): void {
  const r = wd / 2
  const cy = y0 + h - r
  pnl(q, w, t - r, t + r, y0, cy, o, c, tag)
  const n = 6
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI
    const a1 = ((i + 1) / n) * Math.PI
    quad(q, [P(w, t, cy, o), P(w, t + Math.cos(a0) * r, cy + Math.sin(a0) * r, o), P(w, t + Math.cos(a1) * r, cy + Math.sin(a1) * r, o), P(w, t, cy, o)], N(w), c, tag)
  }
}

/** Lettering cut in a band, as dark marks of a word's rhythm: the inscription over a door, legible as one. */
function lettering(q: MeshBuilder, w: Wall, t0: number, t1: number, y0: number, h: number, o: number, c: Rgb, seed: number): void {
  const pitch = h * 0.85
  let s = seed
  for (let t = t0; t < t1 - pitch * 0.6; t += pitch) {
    s = (s * 9301 + 49297) % 233280
    if (s / 233280 < 0.14) continue                  // a space between the words
    pnl(q, w, t + pitch * 0.12, t + pitch * 0.78, y0, y0 + h, o, c)
  }
}

/** Walls round a polygon from y0 to y1 (anticlockwise in plan), and its top. */
function prismPoly(q: MeshBuilder, pts: P2[], y0: number, y1: number, c: Rgb, tag = 0, top: Rgb = c): void {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    quad(q, [[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [(b.z - a.z) / L, 0, -(b.x - a.x) / L], c, tag)
  }
  capPolygon(q, pts, y1, top, tag)
}

/** A lamp standard: a dark iron post on a base and its lantern, which glows after dark. */
function lamp(q: MeshBuilder, x: number, z: number, y: number, h: number): void {
  const IRON: Rgb = [0.13, 0.14, 0.15]
  prism(q, x, z, y, y + 0.6, 0.22, 6, IRON, T.metal, 0.16)
  prism(q, x, z, y + 0.6, y + h, 0.08, 6, IRON, T.metal, 0.06, false)
  blk(q, x - 0.22, x + 0.22, y + h, y + h + 0.6, z - 0.22, z + 0.22, [1, 0.88, 0.6], EMIT)
  prism(q, x, z, y + h + 0.6, y + h + 0.85, 0.3, 4, IRON, T.metal, 0.04)
}

// ------------------------------------------------------------------------------------- the Asian Art Museum

const AAM = {
  granite: [0.83, 0.82, 0.78] as Rgb,
  rustic: [0.77, 0.76, 0.72] as Rgb,
  trim: [0.87, 0.86, 0.82] as Rgb,
  shade: [0.56, 0.56, 0.54] as Rgb,
  groove: [0.5, 0.5, 0.48] as Rgb,
  dark: [0.17, 0.18, 0.2] as Rgb,
  roof: [0.58, 0.6, 0.61] as Rgb,
  pale: [0.87, 0.86, 0.82] as Rgb,
  tiles: [0.88, 0.88, 0.86] as Rgb,
  bayGlass: [0.42, 0.5, 0.54] as Rgb,
}

/** heights of the 1917 building: the ground storey, the loggia, entablature, attic, cornice */
const Y = { base: 10, belt: 10.8, colTop: 20.3, ent: 22.2, attic: 24.0, cornice: 25.8 }

function asianArtMuseum(out: MeshBuilder, fit: Fit): void {
  const F = frameFor(fit, 29.9)
  const q = new MeshBuilder()
  const zF = F.zF
  const all = strips(F.ring)
  // the 1917 building runs back to the pavilion; the strips beyond it are the pavilion and the service wing
  const zBack = zF + 69.7
  const main = all.filter((r) => r.z0 < zBack - 1)
  for (const r of main) r.z1 = Math.min(r.z1, zBack)
  const rear = all.filter((r) => r.z1 > zBack + 1).map((r) => ({ ...r, z0: Math.max(r.z0, zBack) }))
  const front = main[0]
  const xN = front.x0
  const xS = front.x1
  const xc = (xN + xS) / 2
  const LH = 17.2                                                    // the loggia's half width

  // ---- the block: the rusticated base, the belt, the walls of the piano nobile, entablature, attic, cornice
  for (const r of main) {
    const isFront = r === front
    blk(q, r.x0, r.x1, 0, Y.base, r.z0, r.z1, AAM.rustic, T.ashlar)
    blk(q, r.x0 - 0.3, r.x1 + 0.3, Y.base, Y.belt, r.z0 - (isFront ? 0.3 : 0), r.z1, AAM.trim, T.ashlar)
    if (isFront) {
      // the end pavilions full depth; the middle stands back behind the loggia
      blk(q, r.x0, xc - LH, Y.belt, Y.colTop, r.z0, r.z1, AAM.granite, T.ashlar)
      blk(q, xc + LH, r.x1, Y.belt, Y.colTop, r.z0, r.z1, AAM.granite, T.ashlar)
      blk(q, xc - LH, xc + LH, Y.belt, Y.colTop, zF + 3.2, r.z1, AAM.granite, T.ashlar)
    } else blk(q, r.x0, r.x1, Y.belt, Y.colTop, r.z0, r.z1, AAM.granite, T.ashlar)
    blk(q, r.x0 - 0.15, r.x1 + 0.15, Y.colTop, Y.ent, r.z0 - (isFront ? 0.15 : 0), r.z1, AAM.trim, T.ashlar)
    blk(q, r.x0, r.x1, Y.ent, Y.attic, r.z0, r.z1, AAM.granite, T.ashlar)
    blk(q, r.x0 - 1.1, r.x1 + 1.1, Y.attic + 0.55, Y.cornice, r.z0 - (isFront ? 1.1 : 0), r.z1 + (r.z1 >= zBack - 0.5 ? 0.6 : 0), AAM.trim, T.ashlar)
    blk(q, r.x0 - 0.5, r.x1 + 0.5, Y.attic, Y.attic + 0.55, r.z0 - (isFront ? 0.5 : 0), r.z1, AAM.trim, T.ashlar)
    // the shadow under the cornice's overhang, where the modillions stand
    for (const s of [-1, 1] as const) {
      const w: Wall = { axis: 'x', plane: s < 0 ? r.x0 : r.x1, s }
      pnl(q, w, r.z0 + (isFront ? 0 : 0.2), r.z1, Y.attic - 0.05, Y.attic, 0.52, AAM.shade)
    }
  }
  // the low hipped roof, pale over the cornice, and the flat behind it
  const body = main.reduce((m, r) => (r.z1 - r.z0 > m.z1 - m.z0 ? r : m), main[0])
  const rx0 = Math.max(front.x0, body.x0) + 0.4
  const rx1 = Math.min(front.x1, body.x1) - 0.4
  const rz1 = body.z1 - 0.4
  roof(q, rx0, rx1, zF + 0.4, rz1, Y.cornice, 5.2, (rx1 - rx0) / 2 - 0.6, (rx1 - rx0) / 2 - 2, AAM.roof)
  // the cresting along the cornice, front and sides: a row of small antefixes
  const crest = (w: Wall, t0: number, t1: number): void => {
    const n = Math.max(2, Math.round((t1 - t0) / 1.5))
    for (let k = 0; k <= n; k++) {
      const t = t0 + ((t1 - t0) * k) / n
      quad(q, [P(w, t - 0.32, Y.cornice, 0.9), P(w, t + 0.32, Y.cornice, 0.9), P(w, t, Y.cornice + 0.62, 0.9), P(w, t, Y.cornice + 0.62, 0.9)], N(w), AAM.trim, T.ashlar)
    }
  }
  crest({ axis: 'z', plane: zF, s: -1 }, xN - 0.8, xS + 0.8)
  for (const r of main) {
    crest({ axis: 'x', plane: r.x0, s: -1 }, r.z0, r.z1)
    crest({ axis: 'x', plane: r.x1, s: 1 }, r.z0, r.z1)
  }
  // modillions under the cornice: front and both sides
  entablature(q, { x: xN - 0.5, z: zF }, { x: xS + 0.5, z: zF }, Y.attic - 0.2, 1.4, 0.55, 0, { colour: AAM.trim, tag: T.ashlar, frieze: 'modillion' })
  for (const r of main) {
    entablature(q, { x: r.x0, z: r.z1 }, { x: r.x0, z: r.z0 }, Y.attic - 0.2, 1.4, 0.55, 0, { colour: AAM.trim, tag: T.ashlar, frieze: 'modillion' })
    entablature(q, { x: r.x1, z: r.z0 }, { x: r.x1, z: r.z1 }, Y.attic - 0.2, 1.4, 0.55, 0, { colour: AAM.trim, tag: T.ashlar, frieze: 'modillion' })
  }

  // ---- the Larkin front
  const fw: Wall = { axis: 'z', plane: zF, s: -1 }
  // the rustication: deep horizontal joints across the ground storey
  for (let y = 1.9; y < Y.base - 0.3; y += 0.9) pnl(q, fw, xN, xS, y, y + 0.07, 0.02, AAM.groove)
  // three doors in the middle bays, each in a moulded frame under a cornice hood
  for (const k of [-1, 0, 1]) {
    const x = xc + k * 6.8
    pnl(q, fw, x - 1.9, x + 1.9, 0.9, 7.1, 0.06, AAM.trim, T.ashlar)
    pnl(q, fw, x - 1.4, x + 1.4, 0.9, 6.0, 0.1, AAM.dark)
    onWall(q, fw, x - 2.3, x + 2.3, 7.1, 7.7, 0, 0.55, AAM.trim, T.ashlar)
  }
  // a square window in each end bay of the ground storey
  for (const s of [-1, 1]) {
    const x = xc + s * (LH + (xS - xc - LH) / 2)
    pnl(q, fw, x - 1.2, x + 1.2, 3.4, 6.3, 0.06, AAM.trim, T.ashlar)
    pnl(q, fw, x - 0.9, x + 0.9, 3.6, 6.1, 0.1, AAM.dark)
  }
  // the end pavilions of the piano nobile: one tall arched window each, a balcony under it, two attic lights over it
  const pav = (w: Wall, t: number): void => {
    arch(q, w, t, Y.belt + 0.5, 3.9, 8.4, 0.05, AAM.trim, T.ashlar)
    arch(q, w, t, Y.belt + 0.8, 3.0, 7.8, 0.09, AAM.dark)
    onWall(q, w, t - 2.2, t + 2.2, Y.belt, Y.belt + 0.9, 0, 0.6, AAM.trim, T.ashlar)
    for (const d of [-1.3, 1.3]) pnl(q, w, t + d - 0.45, t + d + 0.45, Y.ent + 0.4, Y.ent + 1.4, 0.05, AAM.dark)
  }
  for (const s of [-1, 1]) pav(fw, xc + s * (LH + (xS - xc - LH) / 2))
  // the loggia: its back wall and windows (hung with the museum's banners), the balustrade, the columns
  const bw: Wall = { axis: 'z', plane: zF + 3.2, s: -1 }
  pnl(q, bw, xc - LH, xc + LH, Y.belt, Y.colTop, 0.02, AAM.shade, T.ashlar)
  const BANNERS: Rgb[] = [[0.62, 0.2, 0.22], [0.82, 0.74, 0.55], [0.3, 0.33, 0.42], [0.72, 0.68, 0.6], [0.68, 0.52, 0.3]]
  const bayX = [-13.3, -6.8, 0, 6.8, 13.3]
  bayX.forEach((bx, i) => {
    const x = xc + bx
    pnl(q, bw, x - 2.0, x + 2.0, Y.belt + 1.2, Y.colTop - 0.6, 0.05, AAM.dark)
    pnl(q, bw, x - 1.5, x + 1.5, Y.belt + 2.2, Y.colTop - 1.4, 0.2, BANNERS[i])
  })
  const colX = [-16.4, -10.9, -9.5, -4.1, -2.7, 2.7, 4.1, 9.5, 10.9, 16.4]
  // the balustrade between the column bases
  for (let i = 0; i < colX.length - 1; i++) {
    const a = xc + colX[i] + 0.6
    const b = xc + colX[i + 1] - 0.6
    if (b - a < 1) continue
    blk(q, a, b, Y.belt, Y.belt + 1.1, zF + 0.6, zF + 1.1, AAM.trim, T.ashlar)
    pnl(q, { axis: 'z', plane: zF + 0.6, s: -1 }, a + 0.2, b - 0.2, Y.belt + 0.2, Y.belt + 0.85, 0.01, AAM.shade)
  }
  // the ten Ionic columns ARE the front: the near tier
  for (const cx of colX) column(q, xc + cx, zF + 0.85, Y.belt, Y.colTop, 0.52, AAM.granite, { order: 'ionic', tier: 'near', heading: Math.PI, tag: T.ashlar })
  // the inscribed frieze over the loggia, in two lines
  lettering(q, fw, xc - 11, xc + 11, Y.colTop + 1.05, 0.34, 0.17, [0.6, 0.6, 0.58], 7)
  lettering(q, fw, xc - 14, xc + 14, Y.colTop + 0.45, 0.3, 0.17, [0.6, 0.6, 0.58], 11)
  // the flagpoles on the roof, behind the cornice
  const FLAGS: Rgb[] = [[0.75, 0.2, 0.22], [0.2, 0.3, 0.6], [0.85, 0.83, 0.78]]
  ;[-14, 0, 14].forEach((dx, i) => {
    const x = xc + dx
    const z = zF + 2.2
    prism(q, x, z, Y.cornice, Y.cornice + 10, 0.09, 6, [0.88, 0.88, 0.86], T.metal, 0.06)
    blk(q, x + 0.1, x + 2.0, Y.cornice + 8.7, Y.cornice + 9.9, z - 0.02, z + 0.02, FLAGS[i])
  })
  // the terrace and the broad flight of steps up from Larkin, its cheek walls, the lamps, the bronze on its plinth
  const tz = zF - 3.6
  const ty = 0.9
  blk(q, xc - LH - 1.6, xc + LH + 1.6, 0, ty, tz, zF, AAM.trim, T.granite)
  stair(q, { x: xc - LH + 0.2, z: tz }, { x: xc + LH - 0.2, z: tz }, 0, ty, { anchor: 'top', riser: 0.15, colour: AAM.trim, material: 'granite' })
  for (const s of [-1, 1]) {
    const x = xc + s * (LH + 0.7)
    blk(q, x - 0.9, x + 0.9, 0, ty + 0.7, tz - 2.4, zF, AAM.granite, T.granite)
  }
  for (const dx of [-10.2, -3.4, 3.4, 10.2]) lamp(q, xc + dx, zF - 1.0, ty, 3.6)
  blk(q, xc + LH - 1.2, xc + LH + 1.2, ty, ty + 1.9, tz + 0.3, tz + 2.6, AAM.granite, T.granite)
  prism(q, xc + LH, tz + 1.45, ty + 1.9, ty + 3.3, 0.55, 8, [0.24, 0.22, 0.18], T.metal, 0.35)
  prism(q, xc + LH, tz + 1.45, ty + 3.3, ty + 3.8, 0.22, 6, [0.24, 0.22, 0.18], T.metal, 0.16)

  // ---- the sides: the base runs on; arched windows between pilasters on the piano nobile; attic lights
  for (const r of main) {
    for (const s of [-1, 1] as const) {
      const w: Wall = { axis: 'x', plane: s < 0 ? r.x0 : r.x1, s }
      const t0 = r.z0 + (r === front ? 0 : 0.3)
      const t1 = r.z1 - 0.3
      for (let y = 1.9; y < Y.base - 0.3; y += 0.9) pnl(q, w, t0, t1, y, y + 0.07, 0.02, AAM.groove)
      if (r === front) {
        // the front pavilion's return: its arched window
        pav(w, (r.z0 + Math.min(r.z1, zF + 11)) / 2)
        continue
      }
      const n = Math.max(1, Math.round((t1 - t0) / 6.6))
      const bay = (t1 - t0) / n
      for (let i = 0; i < n; i++) {
        const t = t0 + (i + 0.5) * bay
        pnl(q, w, t - 0.9, t + 0.9, 3.4, 6.2, 0.06, AAM.dark)
        arch(q, w, t, Y.belt + 0.7, 2.9, 7.6, 0.05, AAM.trim, T.ashlar)
        arch(q, w, t, Y.belt + 0.9, 2.3, 7.2, 0.09, AAM.dark)
        pnl(q, w, t - 0.55, t + 0.55, Y.ent + 0.4, Y.ent + 1.4, 0.05, AAM.dark)
        if (i > 0) onWall(q, w, t - bay / 2 - 0.45, t - bay / 2 + 0.45, Y.belt, Y.colTop, 0, 0.18, AAM.trim, T.ashlar)
      }
    }
  }
  // the back wall over the pavilion: the old building's arched windows
  const back = main[main.length - 1]
  const bk: Wall = { axis: 'z', plane: back.z1, s: 1 }
  {
    const n = Math.max(1, Math.round((back.x1 - back.x0 - 4) / 7))
    for (let i = 0; i < n; i++) {
      const t = back.x0 + 2 + ((i + 0.5) * (back.x1 - back.x0 - 4)) / n
      arch(q, bk, t, Y.belt + 0.9, 2.3, 7.2, 0.05, AAM.dark)
      pnl(q, bk, t - 0.55, t + 0.55, Y.ent + 0.4, Y.ent + 1.4, 0.05, AAM.dark)
    }
  }

  // ---- the 2023 pavilion on Hyde, and the service wing south of it
  if (rear.length > 0) {
    const last = rear[rear.length - 1]
    const px0 = Math.max(last.x0, Math.min(...rear.map((r) => r.x0)))
    const px1 = last.x1
    const pz0 = zBack
    const pz1 = last.z1
    const PL = 4.2
    const GL = 8.6
    const TOP = 14.5
    // the plinth, the glass band (stood back), the tiled box
    blk(q, px0, px1, 0, PL, pz0, pz1, AAM.pale, T.ashlar)
    blk(q, px0 + 0.4, px1 - 0.4, PL, GL, pz0, pz1 - 0.4, [0.5, 0.56, 0.6], T.glass)
    blk(q, px0, px1, GL, TOP, pz0, pz1, AAM.tiles, T.terracotta)
    blk(q, px0 + 0.3, px1 - 0.3, TOP, TOP + 0.06, pz0 + 0.3, pz1 - 0.3, [0.6, 0.6, 0.6], T.concrete)
    blk(q, px0 - 0.15, px1 + 0.15, GL - 0.25, GL, pz0, pz1 + 0.15, AAM.pale, T.ashlar)
    // the terracotta tiles' soft relief: courses alternately proud, on the Hyde and McAllister faces
    const hy: Wall = { axis: 'z', plane: pz1, s: 1 }
    const mc: Wall = { axis: 'x', plane: px0, s: -1 }
    for (let y = GL, k = 0; y < TOP - 0.3; y += 0.75, k++) {
      if (k % 2) continue
      pnl(q, hy, px0, px1, y, y + 0.75, 0.05, [0.83, 0.83, 0.81], T.terracotta)
      pnl(q, mc, pz0, pz1, y, y + 0.75, 0.05, [0.83, 0.83, 0.81], T.terracotta)
    }
    // the faceted glass bays standing out of the glass band: a gem a bay
    const gem = (w: Wall, t: number): void => {
      const d = 1.0
      const h0 = PL + 0.1
      const h1 = GL - 0.2
      const a: V3[] = [P(w, t - 1.8, h0, 0), P(w, t, h0, d), P(w, t, h1, d), P(w, t - 1.8, h1, 0)]
      const b: V3[] = [P(w, t, h0, d), P(w, t + 1.8, h0, 0), P(w, t + 1.8, h1, 0), P(w, t, h1, d)]
      const n = N(w)
      const g: Rgb = [0.6, 0.68, 0.72]
      const tang: V3 = w.axis === 'z' ? [1, 0, 0] : [0, 0, 1]
      quad(q, a, [n[0] * 0.87 - tang[0] * 0.5, 0, n[2] * 0.87 - tang[2] * 0.5], g, T.glass)
      quad(q, b, [n[0] * 0.87 + tang[0] * 0.5, 0, n[2] * 0.87 + tang[2] * 0.5], g, T.glass)
      quad(q, [P(w, t - 1.8, h1, 0), P(w, t, h1, d), P(w, t + 1.8, h1, 0), P(w, t + 1.8, h1, 0)], [0, 1, 0], AAM.pale, T.ashlar)
      quad(q, [P(w, t - 1.8, h0, 0), P(w, t + 1.8, h0, 0), P(w, t, h0, d), P(w, t, h0, d)], [0, -1, 0], AAM.pale, T.ashlar)
    }
    for (let t = px0 + 3; t < px1 - 2.5; t += 5.2) gem(hy, t)
    for (let t = pz0 + 4; t < pz1 - 2.5; t += 5.2) gem(mc, t)
    // the mural on the plinth by the entrance, and the museum's sign
    const MURAL: Rgb[] = [[0.85, 0.3, 0.35], [0.95, 0.75, 0.25], [0.3, 0.6, 0.75], [0.55, 0.35, 0.65], [0.35, 0.7, 0.45], [0.9, 0.5, 0.25]]
    MURAL.forEach((c, i) => pnl(q, mc, pz1 - 14 + i * 1.6, pz1 - 12.4 + i * 1.6, 0.9, 3.5, 0.04, c))
    // the roof terrace: its glass rail and the glazed stair pavilion against the old building
    railing(q, [{ x: px0 + 0.3, z: pz0 + 0.5 }, { x: px0 + 0.3, z: pz1 - 0.3 }, { x: px1 - 0.3, z: pz1 - 0.3 }, { x: px1 - 0.3, z: pz0 + 0.5 }], TOP, { kind: 'glass' })
    blk(q, px0 + 1.5, px0 + 9.5, TOP, TOP + 4.2, pz0 + 0.3, pz0 + 6, [0.45, 0.55, 0.6], T.glass)
    blk(q, px0 + 1.3, px0 + 9.7, TOP + 4.2, TOP + 4.5, pz0 + 0.1, pz0 + 6.2, [0.35, 0.55, 0.52], T.metal)
    // the service wing on the Fulton side of it: a granite wall at the street, a metal-clad block behind
    for (const r of rear) {
      if (r.x1 <= px1 + 1) continue
      blk(q, px1, r.x1, 0, 5.5, r.z0, r.z1, AAM.granite, T.ashlar)
      blk(q, px1 + 1.5, r.x1 - 2, 5.5, 19, r.z0, r.z1 - 3, [0.58, 0.6, 0.62], T.metal)
      for (const dx of [2.5, 4.3, 6.1]) prism(q, px1 + dx + 1.5, r.z1 - 5, 19, 22, 0.75, 10, [0.62, 0.64, 0.66], T.metal)
    }
  }
  placed(out, q, F.angle, 0, 0)
}

// --------------------------------------------------------------------------------------- the Main Library

const ML = {
  granite: [0.78, 0.785, 0.78] as Rgb,
  panel: [0.76, 0.775, 0.79] as Rgb,
  light: [0.85, 0.855, 0.86] as Rgb,
  drum: [0.84, 0.85, 0.86] as Rgb,
  band: [0.47, 0.49, 0.52] as Rgb,
  frame: [0.72, 0.73, 0.73] as Rgb,
  glass: [0.25, 0.28, 0.31] as Rgb,
  mullion: [0.66, 0.68, 0.69] as Rgb,
  shade: [0.55, 0.56, 0.56] as Rgb,
  roof: [0.6, 0.6, 0.6] as Rgb,
  sky: [0.36, 0.46, 0.52] as Rgb,
}

/** A tall gridded window: dark glass, its light mullions and transoms. */
function gridWindow(q: MeshBuilder, w: Wall, t: number, y0: number, wd: number, h: number, o: number, cols = 3, rows = 4): void {
  pnl(q, w, t - wd / 2 - 0.25, t + wd / 2 + 0.25, y0 - 0.25, y0 + h + 0.25, o, ML.frame, T.granite)
  pnl(q, w, t - wd / 2, t + wd / 2, y0, y0 + h, o + 0.03, ML.glass)
  for (let i = 1; i < cols; i++) {
    const tt = t - wd / 2 + (wd * i) / cols
    pnl(q, w, tt - 0.07, tt + 0.07, y0, y0 + h, o + 0.06, ML.mullion)
  }
  for (let j = 1; j < rows; j++) {
    const yy = y0 + (h * j) / rows
    pnl(q, w, t - wd / 2, t + wd / 2, yy - 0.07, yy + 0.07, o + 0.06, ML.mullion)
  }
}

/** A punched window of the modern side: a deep granite frame standing proud round dark glass. */
function framed(q: MeshBuilder, w: Wall, t: number, y0: number, wd: number, h: number): void {
  onWall(q, w, t - wd / 2 - 0.3, t + wd / 2 + 0.3, y0 - 0.3, y0 + h + 0.3, 0, 0.28, ML.light, T.granite)
  pnl(q, w, t - wd / 2, t + wd / 2, y0, y0 + h, 0.3, ML.glass)
  pnl(q, w, t - 0.05, t + 0.05, y0, y0 + h, 0.32, ML.mullion)
}

/** levels of the 1996 library: the base and its inscription, the cornice, the attic, the roof slab */
const L = { base: 7.4, cornice: 26.4, eaves: 27.2, attic: 32.6, slab: 33.2, tower: 39 }

/**
 * A Larkin- or Fulton-style face: end blocks with one tall gridded window each, the middle `n` bays of gridded
 * windows between plain round columns (Larkin) or flat piers (Fulton), lower windows under them, the glazed base
 * and its inscription.
 */
function civicFace(q: MeshBuilder, w: Wall, t0: number, t1: number, endW: number, n: number, columns: boolean, doors: boolean, seed: number): void {
  const c0 = t0 + endW
  const c1 = t1 - endW
  const bay = (c1 - c0) / n
  // the end blocks stand forward of the middle
  const E = 0.6
  for (const [a, b] of [[t0, c0], [c1, t1]]) {
    onWall(q, w, a, b, 0, L.cornice, 0, E, ML.granite, T.granite)
    const t = (a + b) / 2
    gridWindow(q, w, t, 14.6, 3.6, 10.2, E + 0.02, 3, 7)
    gridWindow(q, w, t, 8.6, 3.0, 2.8, E + 0.02, 2, 1)
    pnl(q, w, t - 1.5, t + 1.5, 1.2, 5.0, E + 0.04, ML.glass)
  }
  pnl(q, w, c0, c1, L.base + 0.6, L.cornice, 0.01, [0.72, 0.725, 0.72], T.granite)
  for (let i = 0; i < n; i++) {
    const t = c0 + (i + 0.5) * bay
    gridWindow(q, w, t, 12.8, Math.min(4.4, bay * 0.7), 12.6, 0.03, 4, 9)
    gridWindow(q, w, t, 8.6, Math.min(3.2, bay * 0.5), 2.8, 0.03, 2, 1)
    if (doors) gridWindow(q, w, t, 0.25, 3.8, 4.75, 0.04, 3, 2)
    else pnl(q, w, t - 1.4, t + 1.4, 1.2, 5.0, 0.04, ML.glass)
    if (i > 0) {
      const tc = c0 + i * bay
      if (columns) {
        const p = P(w, tc, 0, 0.62)
        prism(q, p[0], p[2], 12.0, L.cornice, 0.58, 16, ML.light, T.granite, 0.58, false)
        prism(q, p[0], p[2], 11.4, 12.0, 0.75, 16, ML.light, T.granite)
      } else onWall(q, w, tc - 0.5, tc + 0.5, L.base + 1, L.cornice, 0, 0.35, ML.light, T.granite)
    }
  }
  // the band at the top of the base, its inscription, and the cornice
  onWall(q, w, t0, t1, L.base - 0.2, L.base + 0.6, 0, 0.25, ML.light, T.granite)
  lettering(q, w, c0 + bay * 0.6, c1 - bay * 0.6, L.base + 0.02, 0.42, 0.27, ML.shade, seed)
  onWall(q, w, t0 - 0.6, t1 + 0.6, L.cornice, L.eaves, 0, 0.7, ML.light, T.granite)
}

function mainLibrary(out: MeshBuilder, fit: Fit): void {
  const F = frameFor(fit, 30.4)
  const q = new MeshBuilder()
  const xs = F.ring.map((p) => p.x)
  const zs = F.ring.map((p) => p.z)
  const zF = F.zF
  const xF = Math.min(...xs)          // Fulton
  const xG = Math.max(...xs)          // Grove
  const zH = Math.max(...zs)          // Hyde
  const xc = (xF + xG) / 2
  const D = zH - zF
  const pod = Math.min(14, D * 0.13)  // the Hyde podium's depth
  const towerW = 15
  const towerD = 19
  const zBody = zH - towerD            // the body's Hyde face, behind the podium and the drum
  const fulton: Wall = { axis: 'x', plane: xF, s: -1 }
  const grove: Wall = { axis: 'x', plane: xG, s: 1 }
  const larkin: Wall = { axis: 'z', plane: zF, s: -1 }

  // ---- the body: granite walls to the cornice, the attic set back on Larkin and Fulton, the thin roof slab
  blk(q, xF, xG, 0, L.eaves, zF, zBody, ML.granite, T.granite)
  blk(q, xF + 1.2, xG, L.eaves, L.attic, zF + 1.2, zBody, ML.granite, T.granite)
  blk(q, xF - 0.6, xG + 0.25, L.attic, L.slab, zF - 0.6, zBody + 0.25, ML.light, T.granite)
  blk(q, xF + 0.4, xG - 0.6, L.slab, L.slab + 0.08, zF + 0.4, zBody - 0.6, ML.roof, T.concrete)
  // the attic's row of small windows
  for (const [w, t0, t1] of [[{ axis: 'z', plane: zF + 1.2, s: -1 }, xF + 2, xG - 1], [{ axis: 'x', plane: xF + 1.2, s: -1 }, zF + 2, zBody - 1]] as [Wall, number, number][]) {
    const n = Math.round((t1 - t0) / 3.1)
    for (let i = 0; i < n; i++) {
      const t = t0 + ((i + 0.5) * (t1 - t0)) / n
      pnl(q, w, t - 0.7, t + 0.7, 28.6, 30.4, 0.04, ML.glass)
    }
  }

  // ---- Larkin: the civic front, with its four round columns; Fulton: the same rhythm with piers
  civicFace(q, larkin, xF, xG, 13, 5, true, true, 3)
  for (const dx of [-9.3, -3.1, 3.1, 9.3]) lamp(q, xc + dx, zF - 2.2, 0, 4.2)
  const fultonEnd = zBody
  civicFace(q, fulton, zF, fultonEnd, 13, 9, false, false, 5)

  // ---- Grove: the modern side — framed windows on a panel grid, dark bands, deep slots, the glazed entrance
  const g0 = zF + 13
  const g1 = zBody
  const slotA = g1 - 6
  const slotB = g1 - 13
  const entrance = g1 - 26
  onWall(q, grove, g0, g1, 11.4, 12.3, 0, 0.06, ML.band, T.metal)
  onWall(q, grove, g0, g1, 24.9, 25.8, 0, 0.06, ML.band, T.metal)
  onWall(q, grove, g0, g1, L.cornice + 0.3, L.cornice + 0.9, 0, 0.35, ML.light, T.granite)
  {
    const pitch = 4.6
    const n = Math.floor((g1 - g0 - 2) / pitch)
    for (let i = 0; i < n; i++) {
      const t = g0 + 1 + (i + 0.5) * pitch
      if (Math.abs(t - slotA) < 2.6 || Math.abs(t - slotB) < 2.6) continue
      const nearDoor = Math.abs(t - entrance) < 4.5
      if (!nearDoor) pnl(q, grove, t - 1.7, t + 1.7, 1.0, 5.6, 0.04, ML.glass)
      for (const y of [8.6, 13.4, 17.6, 21.8, 27.6]) {
        if (nearDoor && y < 13) continue
        framed(q, grove, t, y, 2.5, 2.7)
      }
    }
  }
  // the deep slots by the corner, up through the building
  for (const t of [slotA, slotB]) {
    pnl(q, grove, t - 1.6, t + 1.6, 7.5, L.attic - 1, 0.02, [0.24, 0.26, 0.29])
    for (const s of [-1, 1]) onWall(q, grove, t + s * 1.6 - 0.25, t + s * 1.6 + 0.25, 7.5, L.attic - 1, 0, 0.45, ML.panel, T.granite)
    onWall(q, grove, t - 1.85, t + 1.85, L.attic - 1, L.attic - 0.3, 0, 0.45, ML.panel, T.granite)
  }
  // the Grove entrance: a tall glazed slot in a deep frame, a canopy over the doors, the LIBRARY banners
  pnl(q, grove, entrance - 3, entrance + 3, 0, 12.5, 0.03, ML.glass)
  for (let k = 1; k < 4; k++) pnl(q, grove, entrance - 3, entrance + 3, k * 3.1, k * 3.1 + 0.12, 0.06, ML.mullion)
  for (const s of [-1, 1]) onWall(q, grove, entrance + s * 3 - 0.4, entrance + s * 3 + 0.4, 0, 13.2, 0, 1.0, ML.light, T.granite)
  onWall(q, grove, entrance - 3.4, entrance + 3.4, 12.5, 13.2, 0, 1.0, ML.light, T.granite)
  onWall(q, grove, entrance - 4, entrance + 4, 4.2, 4.5, 0, 2.4, ML.band, T.metal)
  for (const dz of [-6, -8.4]) {
    const p = P(grove, entrance + dz, 0, 1.4)
    blk(q, p[0] - 0.04, p[0] + 0.04, 6, 13, p[2] - 0.5, p[2] + 0.5, [0.25, 0.42, 0.55])
  }

  // ---- the Grove/Hyde corner: a tower with a 45° chamfer and a slot under its top, a low chamfered block below it
  const c = 9
  const tower: P2[] = [{ x: xG - towerW, z: zBody }, { x: xG, z: zBody }, { x: xG, z: zH - c }, { x: xG - c, z: zH }, { x: xG - towerW, z: zH }]
  prismPoly(q, tower, 0, L.tower, ML.panel, T.granite, ML.roof)
  const c2 = 3.5
  const low: P2[] = [{ x: xG - c - 1, z: zH - c - 1 }, { x: xG, z: zH - c - 1 }, { x: xG, z: zH - c2 }, { x: xG - c2, z: zH }, { x: xG - c - 1, z: zH }]
  prismPoly(q, low, 0, 11, ML.granite, T.granite, ML.roof)
  {
    // the chamfer face, in its own frame: t along it from the Grove end, out along its normal
    const a = { x: xG, z: zH - c }
    const b = { x: xG - c, z: zH }
    const Lc = Math.hypot(b.x - a.x, b.z - a.z)
    const ux = (b.x - a.x) / Lc
    const uz = (b.z - a.z) / Lc
    const nx = uz
    const nz = -ux
    const at = (t: number, y: number, o: number): V3 => [a.x + ux * t + nx * o, y, a.z + uz * t + nz * o]
    const face = (t0: number, t1: number, y0: number, y1: number, o: number, col: Rgb, tag = 0): void =>
      quad(q, [at(t0, y0, o), at(t1, y0, o), at(t1, y1, o), at(t0, y1, o)], [nx, 0, nz], col, tag)
    // a stack of big windows up its middle, small ones beside, the dark bands, the slot under the top
    for (const y of [13.5, 18.5, 23.5, 28.5]) {
      face(Lc / 2 - 1.9, Lc / 2 + 1.9, y, y + 3.3, 0.05, ML.frame, T.granite)
      face(Lc / 2 - 1.6, Lc / 2 + 1.6, y + 0.2, y + 3.1, 0.08, ML.glass)
      face(Lc / 2 - 0.05, Lc / 2 + 0.05, y + 0.2, y + 3.1, 0.1, ML.mullion)
    }
    for (const [y, t0, t1] of [[15.6, 0, 3.8], [20.2, 9, Lc], [25.0, 0, 4.2], [29.8, 9.5, Lc], [11.3, 0, Lc]] as [number, number, number][]) {
      face(t0, t1, y, y + 1.1, 0.04, ML.band, T.metal)
    }
    for (const [t, y] of [[2.2, 18.8], [10.5, 23.4], [2.2, 28.4], [10.5, 14.2]] as [number, number][]) face(t - 0.6, t + 0.6, y, y + 1.3, 0.05, ML.glass)
    face(Lc / 2 - 4.5, Lc / 2 + 4.5, 34.2, 35.8, 0.05, [0.25, 0.27, 0.3])
  }
  // the tower's Grove and Hyde returns: narrow windows and the bands carried round
  const tg: Wall = { axis: 'x', plane: xG, s: 1 }
  const th: Wall = { axis: 'z', plane: zH, s: 1 }
  for (const y of [15.6, 25.0]) {
    pnl(q, tg, zBody + 1, zH - c, y, y + 1.1, 0.04, ML.band, T.metal)
    pnl(q, th, xG - towerW, xG - c, y, y + 1.1, 0.04, ML.band, T.metal)
  }
  for (const y of [12.6, 18.6, 22.0, 28.6, 33.4]) {
    pnl(q, tg, zBody + 6.5, zBody + 8.0, y, y + 1.6, 0.05, ML.glass)
    pnl(q, th, xG - towerW + 1.6, xG - towerW + 3.1, y, y + 1.6, 0.05, ML.glass)
  }
  pnl(q, tg, zBody + 2, zH - c - 1.5, 34.2, 35.8, 0.05, [0.25, 0.27, 0.3])
  // a glass rail on the tower's roof
  railing(q, tower.slice(0, 4), L.tower, { kind: 'glass', height: 1.1 })

  // ---- Hyde: the podium with its terrace, and the convex drum rising behind it
  const PH = 15.5
  blk(q, xF, xG - towerW, 0, PH, zH - pod, zH, ML.panel, T.granite)
  blk(q, xF, xG - towerW, 0, PH, zBody, zH - pod, ML.panel, T.granite)
  const hw: Wall = { axis: 'z', plane: zH, s: 1 }
  pnl(q, hw, xF, xG - towerW, 11.6, 12.6, 0.04, ML.band, T.metal)
  {
    const n = Math.floor((xG - towerW - xF - 2) / 5)
    for (let i = 0; i < n; i++) {
      const t = xF + 1 + (i + 0.5) * ((xG - towerW - xF - 2) / n)
      gridWindow(q, hw, t, 1.4, 3.2, 4.4, 0.03, 3, 2)
      pnl(q, hw, t - 0.6, t + 0.6, 9.0, 11.0, 0.05, ML.glass)
      if (i % 2 === 0) pnl(q, hw, t - 1.6, t + 1.6, 13.0, 14.6, 0.05, ML.glass)
    }
  }
  railing(q, [{ x: xF + 0.3, z: zH - 0.3 }, { x: xG - towerW - 0.3, z: zH - 0.3 }], PH, { kind: 'posts', height: 1.1 })
  // the podium's Fulton end
  for (const t of [zH - pod + 3.5, zH - pod / 2, zH - 3.5]) {
    gridWindow(q, fulton, t, 1.4, 2.6, 4.4, 0.03, 2, 2)
    pnl(q, fulton, t - 0.6, t + 0.6, 9.0, 11.0, 0.05, ML.glass)
  }
  pnl(q, fulton, zH - pod, zH, 11.6, 12.6, 0.04, ML.band, T.metal)
  // the drum: a segment of a cylinder, its chord on the body's Hyde face, bulging toward Hyde
  {
    const d0 = xF + 5
    const d1 = xG - towerW
    const chord = d1 - d0
    const sag = Math.min(8, pod * 0.55 + 1)
    const R = (chord * chord) / (8 * sag) + sag / 2
    const cx = (d0 + d1) / 2
    const cz = zBody + sag - R
    const half = Math.asin(chord / 2 / R)
    const segs = 14
    const top = 36
    const pts: P2[] = []
    for (let i = 0; i <= segs; i++) {
      const a = -half + (2 * half * i) / segs
      pts.push({ x: cx + Math.sin(a) * R, z: cz + Math.cos(a) * R })
    }
    for (let i = 0; i < segs; i++) {
      const a = pts[i]
      const b = pts[i + 1]
      const am = -half + (2 * half * (i + 0.5)) / segs
      quad(q, [[a.x, PH, a.z], [b.x, PH, b.z], [b.x, top, b.z], [a.x, top, a.z]], [Math.sin(am), 0, Math.cos(am)], ML.drum, T.granite)
    }
    // the roof over it (a fan to the chord) and the slab's lip round it
    capPolygon(q, [...pts].reverse(), top, ML.roof, T.concrete)
    for (let i = 0; i < segs; i++) {
      const a = pts[i]
      const b = pts[i + 1]
      const am = -half + (2 * half * (i + 0.5)) / segs
      const o = 0.5
      quad(q, [[a.x + Math.sin(am) * o, top - 0.6, a.z + Math.cos(am) * o], [b.x + Math.sin(am) * o, top - 0.6, b.z + Math.cos(am) * o],
        [b.x + Math.sin(am) * o, top, b.z + Math.cos(am) * o], [a.x + Math.sin(am) * o, top, a.z + Math.cos(am) * o]], [Math.sin(am), 0, Math.cos(am)], ML.light, T.granite)
    }
    // the staggered windows, a row a storey
    const cols = 9
    for (let r = 0; r < 8; r++) {
      const y = PH + 1.6 + r * 2.35
      for (let k = 0; k < cols; k++) {
        const f = (k + 0.5 + (r % 2 ? 0.5 : 0)) / (cols + 0.5)
        const a = -half + 2 * half * f
        const sx = Math.sin(a)
        const czz = Math.cos(a)
        const px = cx + sx * (R + 0.04)
        const pz = cz + czz * (R + 0.04)
        const hw2 = 0.6
        quad(q, [[px - czz * hw2, y, pz + sx * hw2], [px + czz * hw2, y, pz - sx * hw2], [px + czz * hw2, y + 1.3, pz - sx * hw2], [px - czz * hw2, y + 1.3, pz + sx * hw2]], [sx, 0, czz], ML.glass)
      }
    }
  }
  // the body's Hyde face beside the drum, toward Fulton: a stack of windows
  for (const y of [17, 21.5, 26, 30.5]) pnl(q, { axis: 'z', plane: zBody, s: 1 }, xF + 1.2, xF + 3.6, y, y + 1.8, 0.05, ML.glass)

  // ---- the roof: the diagonal glazed skylight over the atrium (OSM's roof part), plant on the roof
  {
    const sk: P2[] = [{ x: xG - 33.1, z: zF + 21.7 }, { x: xG - 14.9, z: zF + 33.8 }, { x: xG - 22.9, z: zF + 46.1 }, { x: xG - 41.1, z: zF + 34.0 }]
    // anticlockwise as an outline is (the frame keeps the outline's winding)
    let area = 0
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; area += sk[i].x * sk[j].z - sk[j].x * sk[i].z }
    if (area < 0) sk.reverse()
    prismPoly(q, sk, L.slab - 0.2, L.slab + 1.0, ML.light, T.granite, ML.sky)
    // the glazed hip over the curb, to a ridge along its long axis
    const m = { x: sk.reduce((s, p) => s + p.x, 0) / 4, z: sk.reduce((s, p) => s + p.z, 0) / 4 }
    const inner = sk.map((p) => ({ x: m.x + (p.x - m.x) * 0.45, z: m.z + (p.z - m.z) * 0.45 }))
    const yb = L.slab + 1.0
    const yt = yb + 3.2
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4
      const ex = sk[j].x - sk[i].x
      const ez = sk[j].z - sk[i].z
      const el = Math.hypot(ex, ez) || 1
      quad(q, [[sk[i].x, yb, sk[i].z], [sk[j].x, yb, sk[j].z], [inner[j].x, yt, inner[j].z], [inner[i].x, yt, inner[i].z]],
        [(ez / el) * 0.7, 0.7, (-ex / el) * 0.7], ML.sky, T.glass)
    }
    capPolygon(q, inner, yt, ML.sky, T.glass)
    // its steel ribs
    for (let i = 0; i < 4; i++) {
      const a = sk[i]
      const b = inner[i]
      quad(q, [[a.x - 0.1, yb + 0.02, a.z], [a.x + 0.1, yb + 0.02, a.z], [b.x + 0.1, yt + 0.02, b.z], [b.x - 0.1, yt + 0.02, b.z]], [0, 1, 0], [0.3, 0.32, 0.35], T.metal)
    }
  }
  blk(q, xc - 8, xc + 2, L.slab, L.slab + 3.2, zBody - 16, zBody - 6, [0.62, 0.63, 0.64], T.metal)
  blk(q, xF + 6, xF + 13, L.slab, L.slab + 2.4, zF + 60, zF + 70, [0.62, 0.63, 0.64], T.metal)
  placed(out, q, F.angle, 0, 0)
}

export const CIVIC_LIBRARIES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  asianArtMuseum,
  mainLibrary,
}
