/**
 * THE STATE BUILDINGS ON THE NORTH SIDE OF CIVIC CENTER PLAZA, and their neighbours across Polk and Van Ness — rebuilt
 * to City Hall's standard (the owner, 2026-10-21: "only City Hall looks right"), each from its Mapillary frames
 * (refs/<osm id>/) and what is known of it:
 *
 * - the EARL WARREN BUILDING (1922, Bliss & Faville; the Supreme Court of California), 350 McAllister: Sierra granite,
 *   Renaissance Revival, a 115 m palazzo on the plaza — rusticated base, piano nobile of round-arched windows, a frieze
 *   of little square windows, the great bracketed cornice and the attic over it, end pavilions, three great arches;
 * - the HIRAM W. JOHNSON STATE OFFICE BUILDING (1998), 455 Golden Gate, behind it: a pale fourteen-storey slab whose
 *   courtyard face bows in plan, crowned by bands of green glass;
 * - the STATE OF CALIFORNIA BUILDING at 505 Van Ness (the California Public Utilities Commission's, the Edmund G. Brown
 *   building, 1986): a drum of cream precast on the Van Ness / McAllister corner, the state seal over the entrance
 *   between two round towers and a grand flight of steps down to the corner;
 * - the CIVIC CENTER COURTHOUSE (1997), 400 McAllister: grey granite, rusticated base, lunette windows, a domed drum on
 *   the Polk corner;
 * - the SFPUC HEADQUARTERS (2012, KMD), 525 Golden Gate: a warm stone grid over a glazed base under a long sunshade, a
 *   glass west bay and the mast of stacked wind turbines on Golden Gate.
 *
 * Every builder finds its faces on the real outline (`fit.ring`) by length and shape — never a fixed offset — so it
 * dresses the same walls in the showcase and in the city. Faces are drawn in an edge's own frame: `u` along the wall
 * from its start, `o` out from it (negative: into the building), `y` up.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { faceBand, towerRing, type Face } from '../../tower.ts'
import { beam, dome } from '../../kit.ts'
import { offsetRing, stair } from '../../parts.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]

const TAG = {
  granite: surfaceTag('granite'), ashlar: surfaceTag('ashlar'), concrete: surfaceTag('concrete'), glass: surfaceTag('glass'),
  metal: surfaceTag('metal'), stucco: surfaceTag('stucco'),
}
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

// ------------------------------------------------------------------------------------------------ the ring and its walls

interface Edge { a: P2; b: P2; tx: number; tz: number; nx: number; nz: number; L: number; i: number }

function edgeOf(ring: P2[], i: number): Edge {
  const a = ring[i]
  const b = ring[(i + 1) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { a, b, tx, tz, nx: tz, nz: -tx, L, i }
}

const area2 = (r: P2[]): number => {
  let s = 0
  for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; s += r[i].x * r[j].z - r[j].x * r[i].z }
  return s
}

/** The outline made into walls: anticlockwise, and a run of nearly collinear points (OSM's mid-edge nodes) one wall. */
function walls(fit: Fit, bend = 0.05): P2[] {
  let r = towerRing(fit).slice()
  if (area2(r) < 0) r.reverse()
  for (let pass = 0; pass < 3; pass++) {
    const keep: P2[] = []
    for (let i = 0; i < r.length; i++) {
      const p = r[(i - 1 + r.length) % r.length]
      const c = r[i]
      const n = r[(i + 1) % r.length]
      if (Math.hypot(c.x - p.x, c.z - p.z) < 0.4) continue
      const a1 = Math.atan2(c.z - p.z, c.x - p.x)
      const a2 = Math.atan2(n.z - c.z, n.x - c.x)
      let d = Math.abs(a2 - a1)
      if (d > Math.PI) d = 2 * Math.PI - d
      if (d > bend) keep.push(c)
    }
    if (keep.length === r.length || keep.length < 3) break
    r = keep
  }
  return r
}

/** The raw outline, anticlockwise (for a curve the cleaned one would keep anyway, but whose every node matters). */
function rawRing(fit: Fit): P2[] {
  const r = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : towerRing(fit).slice()
  if (area2(r) < 0) r.reverse()
  return r
}

/** Drawing on one wall, in its own frame. */
class Wall {
  constructor(readonly out: MeshBuilder, readonly e: Edge) {}
  pt(u: number, o: number): P2 {
    const e = this.e
    return { x: e.a.x + e.tx * u + e.nx * o, z: e.a.z + e.tz * u + e.nz * o }
  }
  P(u: number, y: number, o: number): V3 {
    const p = this.pt(u, o)
    return [p.x, y, p.z]
  }
  /** a solid block u0..u1 along, y0..y1 up, o0..o1 out */
  slab(u0: number, u1: number, y0: number, y1: number, o0: number, o1: number, c: Rgb, tag = TAG.granite): void {
    const e = this.e
    const c0 = this.pt((u0 + u1) / 2, (o0 + o1) / 2)
    const hx = Math.abs(u1 - u0) / 2
    const hz = Math.abs(o1 - o0) / 2
    const hy = Math.abs(y1 - y0) / 2
    // a box turned so its local x runs along the wall: (cos h, −sin h) = (tx, tz)
    const h = Math.atan2(-e.tz, e.tx)
    const s = Math.sin(h)
    const co = Math.cos(h)
    const cy = (y0 + y1) / 2
    const Q = (dx: number, dy: number, dz: number): V3 => [c0.x + dx * co + dz * s, cy + dy, c0.z - dx * s + dz * co]
    const faces: [V3[], V3][] = [
      [[Q(-hx, -hy, hz), Q(hx, -hy, hz), Q(hx, hy, hz), Q(-hx, hy, hz)], [s, 0, co]],
      [[Q(hx, -hy, -hz), Q(-hx, -hy, -hz), Q(-hx, hy, -hz), Q(hx, hy, -hz)], [-s, 0, -co]],
      [[Q(hx, -hy, hz), Q(hx, -hy, -hz), Q(hx, hy, -hz), Q(hx, hy, hz)], [co, 0, -s]],
      [[Q(-hx, -hy, -hz), Q(-hx, -hy, hz), Q(-hx, hy, hz), Q(-hx, hy, -hz)], [-co, 0, s]],
      [[Q(-hx, hy, hz), Q(hx, hy, hz), Q(hx, hy, -hz), Q(-hx, hy, -hz)], [0, 1, 0]],
      [[Q(-hx, -hy, -hz), Q(hx, -hy, -hz), Q(hx, -hy, hz), Q(-hx, -hy, hz)], [0, -1, 0]],
    ]
    for (const [q, n] of faces) this.out.quad(q as [V3, V3, V3, V3], n, UV, c, tag)
  }
  /** a flat rectangle facing out, `o` off the wall */
  face(u0: number, u1: number, y0: number, y1: number, o: number, c: Rgb, tag = 0): void {
    const e = this.e
    this.out.quad([this.P(u0, y0, o), this.P(u1, y0, o), this.P(u1, y1, o), this.P(u0, y1, o)], [e.nx, 0, e.nz], UV, c, tag)
  }
  /** a round-headed opening: `w` wide, `h` tall to the crown of its arch */
  arch(uc: number, w: number, y0: number, h: number, o: number, c: Rgb, tag = 0, seg = 6): void {
    const r = w / 2
    const spring = y0 + h - r
    if (spring > y0 + 0.01) this.face(uc - r, uc + r, y0, spring, o, c, tag)
    const e = this.e
    for (let k = 0; k < seg; k++) {
      const a0 = (k / seg) * Math.PI
      const a1 = ((k + 1) / seg) * Math.PI
      const C = this.P(uc, spring, o)
      this.out.quad([C, this.P(uc + Math.cos(a0) * r, spring + Math.sin(a0) * r, o), this.P(uc + Math.cos(a1) * r, spring + Math.sin(a1) * r, o), C],
        [e.nx, 0, e.nz], UV, c, tag)
    }
  }
  /** a gable over a window, facing out */
  gable(uc: number, w: number, y0: number, h: number, o0: number, o1: number, c: Rgb, tag = TAG.granite): void {
    const e = this.e
    const L = this.P(uc - w / 2, y0, o1), R = this.P(uc + w / 2, y0, o1), T = this.P(uc, y0 + h, o1)
    this.out.quad([L, R, T, T], [e.nx, 0, e.nz], UV, c, tag)
    const Lb = this.P(uc - w / 2, y0, o0), Rb = this.P(uc + w / 2, y0, o0), Tb = this.P(uc, y0 + h, o0)
    this.out.quad([Lb, L, T, Tb], [-e.tx * 0.6, 0.8, -e.tz * 0.6], UV, c, tag)
    this.out.quad([R, Rb, Tb, T], [e.tx * 0.6, 0.8, e.tz * 0.6], UV, c, tag)
  }
}

/** A band proud of every wall of a ring (a cornice, a string course): the ring offset, its face, top and soffit. */
function band(out: MeshBuilder, ring: P2[], y0: number, y1: number, d: number, c: Rgb, tag = TAG.granite): void {
  const r = offsetRing(ring, d)
  faceBand(out, r, y0, y1, { kind: 'blank', wall: c, material: 'granite' })
  for (let i = 0; i < r.length; i++) {
    const j = (i + 1) % r.length
    const a = ring[i], b = ring[j], A = r[i], B = r[j]
    out.quad([[a.x, y1, a.z], [b.x, y1, b.z], [B.x, y1, B.z], [A.x, y1, A.z]].reverse() as [V3, V3, V3, V3], [0, 1, 0], UV, c, tag)
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [B.x, y0, B.z], [A.x, y0, A.z]], [0, -1, 0], UV, c, tag)
  }
  void tag
}

/** Edges of at least `min` metres, longest first. */
const longEdges = (ring: P2[], min: number): Edge[] =>
  ring.map((_, i) => edgeOf(ring, i)).filter((e) => e.L >= min).sort((p, q) => q.L - p.L)

/** A flag on a pole, flying along `t` from the pole top: two faces back to back. */
function flag(out: MeshBuilder, at: P2, y0: number, y1: number, t: P2, kind: 'us' | 'ca'): void {
  prism(out, at.x, at.z, y0, y1, 0.07, 6, [0.82, 0.82, 0.8], TAG.metal, 0.05)
  const w = 2.4, h = 1.4
  const parts: [number, number, number, number, Rgb][] = kind === 'us'
    ? [[0, w, y1 - h - 0.2, y1 - 0.2, [0.72, 0.16, 0.18]], [0, w, y1 - h * 0.62, y1 - h * 0.48, [0.92, 0.92, 0.9]], [0, w, y1 - h * 0.34, y1 - h * 0.2 - 0.02, [0.92, 0.92, 0.9]],
      [0, w * 0.42, y1 - h * 0.55 - 0.2, y1 - 0.2, [0.16, 0.2, 0.42]]]
    : [[0, w, y1 - h - 0.2, y1 - 0.2, [0.93, 0.92, 0.88]], [0, w, y1 - h - 0.2, y1 - h * 0.84 - 0.2, [0.72, 0.16, 0.18]], [w * 0.3, w * 0.62, y1 - h * 0.7, y1 - h * 0.4, [0.45, 0.3, 0.2]]]
  for (const [s0, s1, ya, yb, c] of parts) {
    const A: V3 = [at.x + t.x * s0, ya, at.z + t.z * s0], B: V3 = [at.x + t.x * s1, ya, at.z + t.z * s1]
    const C: V3 = [B[0], yb, B[2]], D: V3 = [A[0], yb, A[2]]
    const d = 0.01 * (c === parts[0][4] ? 0 : 1)
    const off = (p: V3, s: number): V3 => [p[0] - t.z * d * s, p[1], p[2] + t.x * d * s]
    out.quad([off(A, 1), off(B, 1), off(C, 1), off(D, 1)], [-t.z, 0, t.x], UV, c, 0)
    out.quad([off(B, -1), off(A, -1), off(D, -1), off(C, -1)], [t.z, 0, -t.x], UV, c, 0)
  }
}

/** A cast-iron lamp standard: a post on a plinth and a lantern on top. */
function lampStandard(out: MeshBuilder, at: P2, y0: number, h: number): void {
  const IRON: Rgb = [0.12, 0.14, 0.13]
  prism(out, at.x, at.z, y0, y0 + 0.5, 0.22, 8, IRON, TAG.metal, 0.16)
  prism(out, at.x, at.z, y0 + 0.5, y0 + h - 0.9, 0.08, 6, IRON, TAG.metal, 0.06)
  prism(out, at.x, at.z, y0 + h - 0.9, y0 + h - 0.2, 0.18, 6, [1.0, 0.9, 0.62], 0.5, 0.26)
  prism(out, at.x, at.z, y0 + h - 0.2, y0 + h, 0.28, 6, IRON, TAG.metal, 0.04)
}

// ------------------------------------------------------------------------------------------------ the Earl Warren Building

const EW_GRANITE: Rgb = [0.73, 0.72, 0.69]
const EW_RUSTIC: Rgb = [0.67, 0.66, 0.63]
const EW_TRIM: Rgb = [0.78, 0.77, 0.74]
const EW_JOINT: Rgb = [0.46, 0.46, 0.45]
const EW_DARK: Rgb = [0.17, 0.19, 0.21]
const EW_BRONZE: Rgb = [0.2, 0.18, 0.13]
const EW_ROOF: Rgb = [0.5, 0.5, 0.49]

/**
 * THE EARL WARREN BUILDING, way/260137839 (Mapillary refs/way-260137839 and refs/way-35176304, whose frames show its
 * plaza front best). The McAllister front is the outline's one 115 m wall; the three 10 m light courts behind are the
 * rear on Hiram Johnson's courtyard.
 *
 * From the street, bottom to top: a granite plinth and a rusticated base of two storeys (small grilled windows in each,
 * the three great entrance arches in the middle of the front, up a short flight between lamp standards); the sill
 * course; the PIANO NOBILE — tall round-arched windows over little balustrades between flat pilasters, and at each end a
 * pavilion of three bays, a great arched window over a balcony between pedimented windows; a frieze of small square
 * windows; the deep bracketed cornice; the attic, its own small windows, its cornice and the cresting along the top.
 * A low granite garden wall stands off the front, as the photographs show.
 */
export function earlWarrenBuilding(out: MeshBuilder, fit: Fit): void {
  const ring = walls(fit)
  const Y = { plinth: 0.9, base: 8.0, sill: 8.7, pn: 17.6, frieze: 20.2, cornice: 21.4, attic: 24.8, top: 25.4 }
  const front = longEdges(ring, 0)[0]
  const g = 'granite' as const
  // ---- the walls: the front is dressed by hand below; every other wall by the grammar, in the same storeys
  // the two end walls beside the front (Polk and Larkin): their front ends are pavilions too, dressed by hand
  const ends = [edgeOf(ring, (front.i - 1 + ring.length) % ring.length), edgeOf(ring, (front.i + 1) % ring.length)].filter((e) => e.L >= 12)
  const handDrawn = new Set([front.i, ...ends.map((e) => e.i)])
  const others = ring.map((_, i) => i).filter((i) => !handDrawn.has(i))
  const pf = (f: Omit<Face, 'material'>): Face => ({ ...f, material: g })
  faceBand(out, ring, 0, Y.plinth, pf({ kind: 'blank', wall: EW_RUSTIC }))
  faceBand(out, ring, Y.plinth, Y.base, pf({ kind: 'punched', wall: EW_RUSTIC, glass: EW_DARK, pitch: 3.8, floor: 3.55, solid: 0.72 }), others)
  faceBand(out, ring, Y.sill, Y.pn, pf({ kind: 'punched', wall: EW_GRANITE, glass: EW_DARK, pitch: 5.4, floor: 8.9, solid: 0.6, arched: true }), others)
  faceBand(out, ring, Y.pn, Y.frieze, pf({ kind: 'punched', wall: EW_GRANITE, glass: EW_DARK, pitch: 5.4, floor: 2.6, solid: 0.78 }), others)
  faceBand(out, ring, Y.cornice, Y.attic, pf({ kind: 'punched', wall: EW_GRANITE, glass: EW_DARK, pitch: 5.4, floor: 3.4, solid: 0.8 }), others)
  faceBand(out, ring, Y.plinth, Y.attic, pf({ kind: 'blank', wall: EW_GRANITE }), [...handDrawn])
  // the courses round the whole block: the sill course, the cornice in two steps, the attic's cornice
  band(out, ring, Y.base, Y.sill, 0.35, EW_TRIM)
  band(out, ring, Y.frieze, Y.frieze + 0.5, 0.45, EW_TRIM)
  band(out, ring, Y.frieze + 0.5, Y.cornice, 1.15, EW_TRIM)
  band(out, ring, Y.attic, Y.top, 0.5, EW_TRIM)
  capPolygon(out, ring, Y.top, EW_ROOF, TAG.concrete)

  // ---- the front
  const w = new Wall(out, front)
  const L = front.L
  const mid = L / 2
  // the rustication: deep joints every course of the base
  for (let y = Y.plinth + 1.15; y < Y.base - 0.3; y += 1.15) w.face(0, L, y, y + 0.09, 0.02, EW_JOINT)
  // the pavilions: three bays at each end, standing a little forward through the piano nobile and the frieze
  const PW = Math.min(15, L * 0.13)
  const PO = 0.5
  const BAYS = Math.max(7, Math.round((L - 2 * PW) / 5.7) | 1)
  const bw = (L - 2 * PW) / BAYS
  const entrance = new Set([Math.floor(BAYS / 2) - 1, Math.floor(BAYS / 2), Math.floor(BAYS / 2) + 1])
  for (let i = 0; i <= BAYS; i++) {
    const u = PW + i * bw
    w.slab(u - 0.45, u + 0.45, Y.sill, Y.frieze, 0, 0.3, EW_GRANITE)                       // the pilaster
    w.slab(u - 0.55, u + 0.55, Y.pn - 0.5, Y.pn, 0, 0.4, EW_TRIM)                        // its capital
  }
  for (let i = 0; i < BAYS; i++) {
    const u = PW + (i + 0.5) * bw
    // the piano nobile: an arched window in a moulded surround, a keystone, a little balustrade under it
    w.slab(u - 1.55, u + 1.55, Y.sill + 0.5, Y.sill + 7.7, 0, 0.12, EW_TRIM)
    w.arch(u, 2.4, Y.sill + 0.8, 6.7, 0.13, EW_DARK, TAG.glass)
    w.slab(u - 0.28, u + 0.28, Y.sill + 7.0, Y.sill + 7.9, 0.1, 0.32, EW_TRIM)
    w.slab(u - 1.5, u + 1.5, Y.sill, Y.sill + 0.85, 0.1, 0.42, EW_TRIM)
    w.face(u - 1.25, u + 1.25, Y.sill + 0.15, Y.sill + 0.68, 0.43, [0.42, 0.42, 0.41])
    // the frieze window and the attic window over it
    w.face(u - 0.55, u + 0.55, Y.pn + 0.6, Y.pn + 1.75, 0.02, EW_DARK, TAG.glass)
    w.face(u - 0.5, u + 0.5, Y.cornice + 0.9, Y.cornice + 2.2, 0.02, EW_DARK, TAG.glass)
    if (entrance.has(i)) {
      // the three great entrance arches, through both storeys of the base, bronze doors deep within
      w.slab(u - 2.35, u + 2.35, Y.plinth, Y.base, 0, 0.3, EW_TRIM)
      w.arch(u, 3.3, Y.plinth + 0.3, 6.5, 0.31, EW_DARK, 0, 8)
      w.face(u - 1.1, u + 1.1, Y.plinth + 0.3, Y.plinth + 3.6, 0.32, EW_BRONZE, TAG.metal)
      w.slab(u - 0.32, u + 0.32, Y.base - 0.9, Y.base, 0.25, 0.5, EW_TRIM)
    } else {
      // two storeys of small grilled windows
      for (const [y0, y1] of [[Y.plinth + 0.9, Y.plinth + 2.9], [Y.plinth + 4.2, Y.plinth + 5.8]]) {
        w.face(u - 0.85, u + 0.85, y0 - 0.15, y1 + 0.15, 0.02, EW_TRIM)
        w.face(u - 0.7, u + 0.7, y0, y1, 0.03, EW_DARK, TAG.glass)
      }
    }
  }
  // bronze lanterns between and beside the arches
  for (const i of [...entrance].concat([Math.max(...entrance) + 1])) {
    const u = PW + i * bw
    w.slab(u - 0.18, u + 0.18, Y.plinth + 3.7, Y.plinth + 4.7, 0.3, 0.75, EW_BRONZE, TAG.metal)
    w.slab(u - 0.12, u + 0.12, Y.plinth + 3.9, Y.plinth + 4.5, 0.75, 0.78, [1.0, 0.86, 0.55], 0.5)
  }
  const pavilion = (w: Wall, u0: number, u1: number, PO: number): void => {
    if (PO > 0) w.slab(u0, u1, Y.plinth, Y.attic, -0.1, PO, EW_GRANITE)
    for (let y = Y.plinth + 1.15; y < Y.base - 0.3; y += 1.15) w.face(u0, u1, y, y + 0.09, PO + 0.02, EW_JOINT)
    w.slab(u0 - 0.05, u1 + 0.05, Y.base, Y.sill, PO, PO + 0.35, EW_TRIM)
    const side = (u1 - u0 - 6) / 2
    const cols = [u0, u0 + side, u1 - side, u1]
    for (const u of cols) {
      const a = Math.max(u0, u - 0.5), b = Math.min(u1, u + 0.5)
      w.slab(a, b, Y.sill, Y.frieze, PO, PO + 0.3, EW_GRANITE)
      w.slab(a - 0.1, b + 0.1, Y.pn - 0.5, Y.pn, PO, PO + 0.4, EW_TRIM)
    }
    const uc = (u0 + u1) / 2
    // the great window: arched, in its surround, over a balcony on two brackets
    w.slab(uc - 2.3, uc + 2.3, Y.sill + 0.9, Y.sill + 8.6, PO, PO + 0.14, EW_TRIM)
    w.arch(uc, 3.4, Y.sill + 1.2, 7.3, PO + 0.15, EW_DARK, TAG.glass, 8)
    w.slab(uc - 0.35, uc + 0.35, Y.sill + 7.7, Y.sill + 8.8, PO + 0.1, PO + 0.38, EW_TRIM)
    w.slab(uc - 2.6, uc + 2.6, Y.sill, Y.sill + 0.25, PO, PO + 1.0, EW_TRIM)
    w.slab(uc - 2.6, uc + 2.6, Y.sill + 0.25, Y.sill + 1.2, PO + 0.75, PO + 1.0, EW_TRIM)
    w.face(uc - 2.3, uc + 2.3, Y.sill + 0.35, Y.sill + 1.05, PO + 1.01, [0.42, 0.42, 0.41])
    for (const s of [-1.9, 1.9]) w.slab(uc + s - 0.2, uc + s + 0.2, Y.sill - 0.9, Y.sill, PO, PO + 0.9, EW_TRIM)
    // the flanking bays: a pedimented window, a small square one over it
    for (const uf of [u0 + side / 2, u1 - side / 2]) {
      w.slab(uf - 1.0, uf + 1.0, Y.sill + 1.5, Y.sill + 4.6, PO, PO + 0.12, EW_TRIM)
      w.face(uf - 0.75, uf + 0.75, Y.sill + 1.7, Y.sill + 4.4, PO + 0.13, EW_DARK, TAG.glass)
      w.slab(uf - 1.15, uf + 1.15, Y.sill + 4.6, Y.sill + 4.85, PO, PO + 0.35, EW_TRIM)
      w.gable(uf, 2.3, Y.sill + 4.85, 0.6, PO, PO + 0.35, EW_TRIM)
      w.face(uf - 0.6, uf + 0.6, Y.sill + 6.0, Y.sill + 7.3, PO + 0.02, EW_DARK, TAG.glass)
      w.slab(uf - 0.6, uf + 0.6, Y.sill + 1.2, Y.sill + 1.5, PO, PO + 0.25, EW_TRIM)
    }
    for (const uf of [u0 + side / 2, uc, u1 - side / 2]) {
      for (const [y0, y1] of [[Y.plinth + 0.9, Y.plinth + 2.9], [Y.plinth + 4.2, Y.plinth + 5.8]]) {
        w.face(uf - 0.85, uf + 0.85, y0 - 0.15, y1 + 0.15, PO + 0.02, EW_TRIM)
        w.face(uf - 0.7, uf + 0.7, y0, y1, PO + 0.03, EW_DARK, TAG.glass)
      }
      w.face(uf - 0.55, uf + 0.55, Y.pn + 0.6, Y.pn + 1.75, PO + 0.02, EW_DARK, TAG.glass)
      w.face(uf - 0.5, uf + 0.5, Y.cornice + 0.9, Y.cornice + 2.2, 0.02, EW_DARK, TAG.glass)
    }
    w.slab(u0 - 0.1, u1 + 0.1, Y.frieze, Y.frieze + 0.5, PO, PO + 0.45, EW_TRIM)
    w.slab(u0 - 0.1, u1 + 0.1, Y.frieze + 0.5, Y.cornice, PO, PO + 1.15, EW_TRIM)
  }
  pavilion(w, 0, PW, PO)
  pavilion(w, L - PW, L, PO)
  for (const e of ends) {
    const we = new Wall(out, e)
    const pw = Math.min(15, e.L)
    const atStart = e.i === (front.i + 1) % ring.length
    const [u0, u1] = atStart ? [0, pw] : [e.L - pw, e.L]
    for (let y = Y.plinth + 1.15; y < Y.base - 0.3; y += 1.15) we.face(0, e.L, y, y + 0.09, 0.02, EW_JOINT)
    pavilion(we, u0, u1, 0)
    // the rest of the wall, back toward the courts: the grammar's bays, drawn as the long front's are
    const r0 = atStart ? pw : 0, r1 = atStart ? e.L : e.L - pw
    for (let u = r0 + 2.7; u < r1 - 1; u += 5.4) {
      we.arch(u, 2.2, Y.sill + 0.8, 6.4, 0.03, EW_DARK, TAG.glass)
      for (const y of [Y.plinth + 0.9, Y.plinth + 4.2]) we.face(u - 0.7, u + 0.7, y, y + 1.8, 0.03, EW_DARK, TAG.glass)
      we.face(u - 0.55, u + 0.55, Y.pn + 0.6, Y.pn + 1.75, 0.02, EW_DARK, TAG.glass)
      we.face(u - 0.5, u + 0.5, Y.cornice + 0.9, Y.cornice + 2.2, 0.02, EW_DARK, TAG.glass)
    }
    for (let u = 0.7; u < e.L - 0.4; u += 1.4) we.face(u - 0.22, u + 0.22, Y.top, Y.top + 0.55, 0.42, EW_TRIM, TAG.granite)
  }
  // the cornice's modillions: deep brackets under the corona, all along the front
  for (let u = 0.6; u < L - 0.4; u += 1.25) {
    const o = u < PW || u > L - PW ? PO : 0
    w.slab(u - 0.14, u + 0.14, Y.frieze + 0.5 - 0.35, Y.frieze + 0.5, o + 0.45, o + 1.05, EW_TRIM)
  }
  // the cresting along the top of the attic
  for (let u = 0.7; u < L - 0.4; u += 1.4) w.face(u - 0.22, u + 0.22, Y.top, Y.top + 0.55, 0.42, EW_TRIM, TAG.granite)

  // ---- the way in: a terrace before the three arches, a broad flight down to McAllister between two plinths and
  // their lamp standards, and the low garden wall along the rest of the front
  const span = 1.5 * bw + 2.6
  const tY = Y.plinth + 0.3
  w.slab(mid - span, mid + span, 0, tY, 0, 2.2, EW_TRIM)
  stair(out, w.pt(mid - span + 0.6, 2.2), w.pt(mid + span - 0.6, 2.2), 0, tY, { anchor: 'top', riser: 0.15, run: 2.6, colour: EW_TRIM, material: 'granite' })
  for (const s of [-1, 1]) {
    const u = mid + s * (span - 0.3)
    w.slab(u - 0.6, u + 0.6, 0, tY + 0.9, 0, 4.9, EW_GRANITE)
    lampStandard(out, w.pt(u, 4.2), tY + 0.9, 3.4)
  }
  for (const [u0, u1] of [[1.2, mid - span - 0.9], [mid + span + 0.9, L - 1.2]]) w.slab(u0, u1, 0, 1.0, 3.2, 3.6, EW_RUSTIC)
}

// ------------------------------------------------------------------------------------------------ the Civic Center Courthouse

const CT_GRANITE: Rgb = [0.62, 0.63, 0.64]
const CT_BASE: Rgb = [0.52, 0.53, 0.54]
const CT_TRIM: Rgb = [0.68, 0.69, 0.7]
const CT_JOINT: Rgb = [0.4, 0.41, 0.42]
const CT_GLASS: Rgb = [0.18, 0.21, 0.24]

/**
 * THE CIVIC CENTER COURTHOUSE, 400 McAllister (way/108389188; refs/way-108389188): the 1990s granite courthouse on the
 * McAllister / Polk corner, across Polk from the Earl Warren Building — classical in outline, modern in its flat
 * panels. The outline's short chamfer IS that corner; McAllister is the long wall beside it, Polk the short one.
 *
 * A dark rusticated base of two storeys; grey granite panels above, where tall recessed bays run up two storeys of
 * windows to a LUNETTE — a great half-round window — under the cornice, with narrow single windows between; a row of
 * small square attic windows like a dentil course; the cornice and a parapet. On the corner a faceted pavilion, its
 * flags, its glazed doors up a few steps, and on it the drum ringed with oculi and its pale dome.
 */
export function sfCivicCenterCourthouse_108389188(out: MeshBuilder, fit: Fit): void {
  const ring = walls(fit, 0.08)
  const Y = { base: 7.0, band: 7.6, cornice: 19.2, attic: 23.0, top: 24.4 }
  const all = ring.map((_, i) => edgeOf(ring, i))
  // the chamfer: a short wall between two long ones, turned about 45 degrees to both
  let ci = -1
  for (const e of all) {
    if (e.L < 3 || e.L > 14) continue
    const p = all[(e.i - 1 + ring.length) % ring.length]
    const n = all[(e.i + 1) % ring.length]
    if (p.L < 20 || n.L < 20) continue
    if (ci < 0 || Math.abs(e.L - 6) < Math.abs(all[ci].L - 6)) ci = e.i
  }
  const pg = (f: Omit<Face, 'material'>): Face => ({ ...f, material: 'granite' })
  const dressed = new Set<number>()
  if (ci >= 0) {
    const p = all[(ci - 1 + ring.length) % ring.length]
    const n = all[(ci + 1) % ring.length]
    dressed.add(p.i)
    dressed.add(n.i)
  }
  const plain = all.filter((e) => !dressed.has(e.i) && e.i !== ci).map((e) => e.i)
  faceBand(out, ring, 0, Y.base, pg({ kind: 'punched', wall: CT_BASE, glass: CT_GLASS, pitch: 4.4, floor: 3.5, solid: 0.7 }), plain)
  faceBand(out, ring, 0, Y.base, pg({ kind: 'blank', wall: CT_BASE }), [...dressed, ...(ci >= 0 ? [ci] : [])])
  band(out, ring, Y.base, Y.band, 0.3, CT_TRIM)
  faceBand(out, ring, Y.band, Y.cornice, pg({ kind: 'punched', wall: CT_GRANITE, glass: CT_GLASS, pitch: 3.6, floor: 3.9, solid: 0.62 }), plain)
  faceBand(out, ring, Y.band, Y.cornice, pg({ kind: 'blank', wall: CT_GRANITE }), [...dressed])
  faceBand(out, ring, Y.cornice + 0.9, Y.attic, pg({ kind: 'punched', wall: CT_GRANITE, glass: CT_GLASS, pitch: 2.4, floor: Y.attic - Y.cornice - 0.9, solid: 0.6 }))
  band(out, ring, Y.cornice, Y.cornice + 0.9, 0.9, CT_TRIM)
  band(out, ring, Y.attic, Y.attic + 0.5, 0.45, CT_TRIM)
  faceBand(out, ring, Y.attic + 0.5, Y.top, pg({ kind: 'blank', wall: CT_GRANITE }))
  capPolygon(out, ring, Y.top, [0.52, 0.53, 0.54], TAG.concrete)

  // the rusticated base's joints, on every wall
  for (const e of all) {
    const w = new Wall(out, e)
    for (let y = 1.4; y < Y.base - 0.2; y += 1.4) w.face(0, e.L, y, y + 0.08, 0.02, CT_JOINT)
  }
  // the two street fronts: lunette bays between pilaster strips, plain bays of narrow windows between them
  const CORNER = 10
  for (const i of dressed) {
    const e = all[i]
    const w = new Wall(out, e)
    // which end of this wall meets the corner: the pavilion takes that end
    const atEnd = (e.i + 1) % ring.length === ci
    const u0 = atEnd ? 0 : CORNER
    const u1 = atEnd ? e.L - CORNER : e.L
    const n = Math.max(1, Math.round((u1 - u0) / 10.5))
    const bw = (u1 - u0) / n
    for (let k = 0; k < n; k++) {
      const u = u0 + (k + 0.5) * bw
      // the tall recessed bay, its two windows and the lunette over them
      w.slab(u - 2.9, u + 2.9, Y.band, Y.cornice - 0.6, 0, 0.18, CT_TRIM)
      w.face(u - 2.4, u + 2.4, Y.band + 0.2, Y.cornice - 0.9, 0.19, [0.56, 0.57, 0.58], TAG.granite)
      for (const [y0, y1] of [[Y.band + 1.0, Y.band + 3.3], [Y.band + 4.6, Y.band + 6.9]]) {
        w.face(u - 1.9, u - 0.15, y0, y1, 0.2, CT_GLASS, TAG.glass)
        w.face(u + 0.15, u + 1.9, y0, y1, 0.2, CT_GLASS, TAG.glass)
      }
      w.arch(u, 4.2, Y.band + 7.6, 3.4, 0.2, CT_GLASS, TAG.glass, 8)
      w.slab(u - 0.12, u + 0.12, Y.band + 7.6, Y.band + 10.6, 0.19, 0.24, [0.4, 0.42, 0.44], TAG.metal)
      // the narrow windows in the plain bays either side
      for (const s of [-1, 1]) {
        const v = u + s * bw / 2
        if (v < u0 + 0.5 || v > u1 - 0.5) continue
        for (let f = 0; f < 3; f++) w.face(v - 0.55, v + 0.55, Y.band + 1.0 + f * 3.6, Y.band + 3.2 + f * 3.6, 0.02, CT_GLASS, TAG.glass)
      }
      // the base's windows under the bay
      for (const s of [-1.2, 1.2]) for (const y of [1.2, 4.6]) w.face(u + s - 0.6, u + s + 0.6, y, y + 1.5, 0.03, CT_GLASS, TAG.glass)
    }
  }
  if (ci < 0) return
  // ---- the corner pavilion: the corner region of the block, stood forward and carried up a storey higher
  const ch = all[ci]
  const pe = all[(ci - 1 + ring.length) % ring.length]
  const ne = all[(ci + 1) % ring.length]
  const Pp = (e: Edge, u: number): P2 => ({ x: e.a.x + e.tx * u, z: e.a.z + e.tz * u })
  const poly0: P2[] = [Pp(pe, pe.L - CORNER), ch.a, ch.b, Pp(ne, CORNER)]
  // close it round the inside corner (the two street walls' lines met there before the chamfer was cut)
  const inner = { x: poly0[0].x + (poly0[3].x - ch.b.x), z: poly0[0].z + (poly0[3].z - ch.b.z) }
  const inner2 = { x: poly0[3].x - (ch.a.x - poly0[0].x), z: poly0[3].z - (ch.a.z - poly0[0].z) }
  let poly: P2[] = [poly0[0], ch.a, ch.b, poly0[3], { x: (inner.x + inner2.x) / 2, z: (inner.z + inner2.z) / 2 }]
  if (area2(poly) < 0) poly = poly.reverse()
  const pav = offsetRing(poly, 0.7)
  const PH = Y.top + 0.4
  faceBand(out, pav, 0, Y.base, pg({ kind: 'blank', wall: CT_BASE }))
  faceBand(out, pav, Y.band, Y.cornice, pg({ kind: 'punched', wall: CT_GRANITE, glass: CT_GLASS, pitch: 3.4, floor: 3.9, solid: 0.55 }))
  band(out, pav, Y.base, Y.band, 0.3, CT_TRIM)
  band(out, pav, Y.cornice, Y.cornice + 0.9, 0.9, CT_TRIM)
  faceBand(out, pav, Y.cornice + 0.9, PH, pg({ kind: 'blank', wall: CT_GRANITE }))
  band(out, pav, PH, PH + 0.5, 0.45, CT_TRIM)
  capPolygon(out, pav, PH + 0.5, [0.55, 0.56, 0.57], TAG.concrete)
  // the pavilion's walls on the streets: the chamfer's entrance, the faceted walls' windows, joints and flags
  const pr = offsetRing(poly, 0.7)
  let flags = 0
  for (let i = 0; i < pr.length; i++) {
    const e = edgeOf(pr, i)
    if (e.L < 3) continue
    const w = new Wall(out, e)
    for (let y = 1.4; y < Y.base - 0.2; y += 1.4) w.face(0, e.L, y, y + 0.08, 0.02, CT_JOINT)
    const isCh = Math.abs(e.L - ch.L) < 2.5 && Math.abs(e.tx * ch.tx + e.tz * ch.tz) > 0.95
    if (isCh) {
      // the entrance: tall glazed doors in a deep surround, steps up to them
      w.slab(e.L / 2 - 2.2, e.L / 2 + 2.2, 0.6, Y.base + 0.4, 0, 0.4, CT_TRIM)
      w.face(e.L / 2 - 1.7, e.L / 2 + 1.7, 0.6, Y.base - 0.3, 0.41, CT_GLASS, TAG.glass)
      stair(out, w.pt(0.3, 0), w.pt(e.L - 0.3, 0), 0, 0.6, { anchor: 'top', riser: 0.15, colour: CT_TRIM, material: 'granite', splay: 0.3 })
      // the attic of the corner: a round window under the cornice
      w.arch(e.L / 2, 1.4, Y.cornice + 1.6, 1.4, 0.02, CT_GLASS, TAG.glass, 6)
    } else if (e.L > 5) {
      // the flags: out over the street on short staffs from the second floor
      const mid = w.pt(e.L / 2, 0.1)
      const tip = w.pt(e.L / 2, 2.4)
      beam(out, [mid.x, Y.band + 2.4, mid.z], [tip.x, Y.band + 4.2, tip.z], 0.04, [0.8, 0.8, 0.78])
      const t = { x: e.nx, z: e.nz }
      flag(out, w.pt(e.L / 2, 2.4), Y.band + 4.1, Y.band + 4.2, t, flags++ === 0 ? 'us' : 'ca')
    }
  }
  // the drum, ringed with oculi, and its low pale dome
  const cm = { x: (ch.a.x + ch.b.x) / 2 - ch.nx * 6.2, z: (ch.a.z + ch.b.z) / 2 - ch.nz * 6.2 }
  const dy = PH + 0.5
  prism(out, cm.x, cm.z, dy, dy + 0.6, 5.6, 16, CT_TRIM, TAG.granite)
  prism(out, cm.x, cm.z, dy + 0.6, dy + 3.6, 5.2, 16, CT_GRANITE, TAG.granite)
  prism(out, cm.x, cm.z, dy + 3.6, dy + 4.1, 5.5, 16, CT_TRIM, TAG.granite)
  // the oculi: round windows all round the drum
  for (let k = 0; k < 8; k++) {
    const a = ((k + 0.5) / 8) * Math.PI * 2
    const nx = Math.sin(a), nz = Math.cos(a)
    const r0 = 5.22, R = 0.75, cy = dy + 2.1
    const C: V3 = [cm.x + nx * r0, cy, cm.z + nz * r0]
    for (let j = 0; j < 8; j++) {
      const b0 = (j / 8) * Math.PI * 2, b1 = ((j + 1) / 8) * Math.PI * 2
      const P = (b: number): V3 => [C[0] + nz * Math.cos(b) * R, cy + Math.sin(b) * R, C[2] - nx * Math.cos(b) * R]
      out.quad([C, P(b1), P(b0), C], [nx, 0, nz], UV, CT_GLASS, TAG.glass)
    }
  }
  dome(out, cm.x, cm.z, dy + 4.1, 5.0, 3.6, [0.84, 0.84, 0.82], 16)
  prism(out, cm.x, cm.z, dy + 7.6, dy + 8.4, 0.9, 8, CT_TRIM, TAG.granite, 0.6)
}

// ------------------------------------------------------------------------------------------------ the State of California Building

const SC_CREAM: Rgb = [0.83, 0.81, 0.76]
const SC_TRIM: Rgb = [0.9, 0.88, 0.82]
const SC_GLASS: Rgb = [0.17, 0.3, 0.32]
const SC_DEEP: Rgb = [0.74, 0.72, 0.67]

/**
 * THE STATE OF CALIFORNIA BUILDING, relation/1735766 (refs/relation-1735766), at Van Ness and McAllister: by its place
 * and its seal the California Public Utilities Commission's building at 505 Van Ness (the Edmund G. Brown building,
 * 1980s). A quarter-drum of cream precast swings round the corner — the outline's long curve — five storeys of deep-set
 * square windows in a strict grid over a plain podium, a thin cornice and a set-back top storey of ribbon glass under a
 * projecting roof. In the middle of the curve the entrance bay: two round towers, between them a recess with the great
 * blue-and-gold STATE SEAL and the flags, and the grand flight of steps fanning down to the corner between plinth walls.
 * The straight wings carry ribbon windows of the same green glass.
 */
export function stateOfCaliforniaBuilding(out: MeshBuilder, fit: Fit): void {
  const raw = rawRing(fit)
  const ring = walls(fit, 0.02)
  const Y = { podium: 4.2, top: 22.4, roof: 25.6 }
  // the curve: the longest run of short walls turning the same way
  const es = raw.map((_, i) => edgeOf(raw, i))
  let best: number[] = []
  let run: number[] = []
  const turn = (i: number): number => {
    const a = es[i], b = es[(i + 1) % es.length]
    return a.tx * b.tz - a.tz * b.tx
  }
  for (let k = 0; k < es.length * 2; k++) {
    const i = k % es.length
    const ok = es[i].L < 14 && es[i].L > 0.8 && turn(i) > -0.03 && turn(i) < 0.6
    if (ok) {
      run.push(i)
      if (run.length > best.length && run.length <= es.length) best = run.slice()
    } else run = []
  }
  const arcEdges = new Set(best.concat(best.length ? [(best[best.length - 1] + 1) % es.length] : []))
  // the dressed band: the curve and the long straight walls as punched grid, the rest as ribbon windows
  const punched: Face = { kind: 'punched', wall: SC_CREAM, glass: SC_GLASS, pitch: 4.0, floor: 3.64, solid: 0.36, material: 'concrete' }
  const ribbon: Face = { kind: 'bands', wall: SC_CREAM, glass: SC_GLASS, floor: 3.64, solid: 0.42, material: 'concrete' }
  const curveIdx = [...arcEdges]
  const rest = es.map((e) => e.i).filter((i) => !arcEdges.has(i))
  faceBand(out, raw, 0, Y.podium, { kind: 'punched', wall: SC_DEEP, glass: [0.3, 0.32, 0.33], pitch: 8, floor: Y.podium, solid: 0.88, material: 'concrete' })
  band(out, raw, Y.podium, Y.podium + 0.5, 0.25, SC_TRIM)
  faceBand(out, raw, Y.podium + 0.5, Y.top, punched, curveIdx)
  faceBand(out, raw, Y.podium + 0.5, Y.top, ribbon, rest)
  band(out, raw, Y.top, Y.top + 0.7, 0.5, SC_TRIM)
  // the top storey: set back, a ribbon of glass under the roof's thin overhanging edge
  const back = offsetRing(ring, -1.6)
  faceBand(out, back, Y.top + 0.7, Y.roof, { kind: 'bands', wall: SC_TRIM, glass: [0.2, 0.32, 0.36], floor: Y.roof - Y.top - 0.7, solid: 0.3, material: 'concrete' })
  capPolygon(out, ring, Y.top + 0.7, [0.6, 0.6, 0.58], TAG.concrete)
  band(out, back, Y.roof, Y.roof + 0.45, 1.4, SC_TRIM)
  capPolygon(out, back, Y.roof + 0.45, [0.62, 0.62, 0.6], TAG.concrete)
  if (!best.length) return

  // ---- the entrance at the middle of the curve
  let total = 0
  for (const i of best) total += es[i].L
  let acc = 0
  let me = es[best[0]]
  let mu = 0
  for (const i of best) {
    if (acc + es[i].L >= total / 2) { me = es[i]; mu = total / 2 - acc; break }
    acc += es[i].L
  }
  // the bay's own straight frame, tangent to the curve there
  const M = { x: me.a.x + me.tx * mu, z: me.a.z + me.tz * mu }
  const fe: Edge = { a: { x: M.x - me.tx * 12, z: M.z - me.tz * 12 }, b: { x: M.x + me.tx * 12, z: M.z + me.tz * 12 }, tx: me.tx, tz: me.tz, nx: me.nx, nz: me.nz, L: 24, i: -1 }
  const w = new Wall(out, fe)
  const c = 12
  // the recess between the towers, its louvred bands and the seal on it
  w.slab(c - 6.2, c + 6.2, Y.podium, Y.top + 0.7, -1.5, 0.6, SC_TRIM, TAG.concrete)
  w.face(c - 5.2, c + 5.2, Y.podium + 0.5, Y.top - 0.4, 0.62, [0.8, 0.78, 0.72], TAG.concrete)
  for (let y = Y.podium + 1.4; y < Y.top - 0.6; y += 1.15) w.slab(c - 5.2, c + 5.2, y, y + 0.22, 0.6, 0.95, SC_TRIM, TAG.concrete)
  const seal = (r: number, col: Rgb, o: number, n = 20): void => {
    const C = w.P(c, 13.2, o)
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2
      out.quad([C, w.P(c + Math.cos(a0) * r, 13.2 + Math.sin(a0) * r, o), w.P(c + Math.cos(a1) * r, 13.2 + Math.sin(a1) * r, o), C], [fe.nx, 0, fe.nz], UV, col, 0)
    }
  }
  seal(3.1, [0.78, 0.64, 0.3], 1.0)
  seal(2.65, [0.36, 0.56, 0.74], 1.02)
  seal(1.7, [0.72, 0.76, 0.7], 1.04, 12)
  seal(0.8, [0.62, 0.48, 0.3], 1.06, 8)
  // the two round towers
  for (const s of [-1, 1]) {
    const p = w.pt(c + s * 7.6, 0.4)
    prism(out, p.x, p.z, Y.podium, Y.top + 0.7, 2.3, 14, SC_TRIM, TAG.concrete)
    prism(out, p.x, p.z, Y.top + 0.7, Y.top + 1.3, 2.5, 14, SC_TRIM, TAG.concrete)
    for (let y = Y.podium + 3.64; y < Y.top; y += 3.64) prism(out, p.x, p.z, y, y + 0.12, 2.36, 14, SC_DEEP, TAG.concrete, 2.36, false)
  }
  // the doors at the head of the steps
  w.face(c - 4.5, c + 4.5, 2.4, Y.podium + 0.1, 0.63, [0.2, 0.22, 0.23], TAG.glass)
  // the terrace, the grand flight, its plinth walls and rails
  const T = 2.4
  const land = 3.2
  w.slab(c - 9.5, c + 9.5, 0, T, 0, land, SC_TRIM, TAG.concrete)
  const runL = 4.6
  stair(out, w.pt(c - 8.6, land), w.pt(c + 8.6, land), 0, T, { anchor: 'top', riser: 0.16, run: runL, splay: 0.35, colour: SC_TRIM, material: 'concrete' })
  for (const s of [-1, 1]) {
    // the plinth walls, stepping down beside the flight
    w.slab(c + s * 9.5 - 0.9, c + s * 9.5 + 0.9, 0, T + 0.9, -0.2, land + 0.4, SC_TRIM, TAG.concrete)
    w.slab(c + s * (9.5 + 1.5) - 0.6, c + s * (9.5 + 1.5) + 0.6, 0, T * 0.55, land + 0.4, land + runL, SC_TRIM, TAG.concrete)
    // the flagpoles on the terrace
    const fp = w.pt(c + s * 5.2, land - 1.0)
    flag(out, fp, T, 15.5, { x: fe.tx * -s, z: fe.tz * -s }, s < 0 ? 'us' : 'ca')
  }
  for (const u of [c - 4.2, c, c + 4.2]) {
    const a = w.pt(u * 1 + (u - c) * 0, land), b = w.pt(u + (u - c) * 0.35, land + runL)
    beam(out, [a.x, T + 0.9, a.z], [b.x, 0.9, b.z], 0.035, [0.72, 0.73, 0.74])
    for (const f of [0.08, 0.5, 0.92]) {
      const x = a.x + (b.x - a.x) * f, z = a.z + (b.z - a.z) * f, y = T + (0 - T) * f
      beam(out, [x, y, z], [x, y + 0.9, z], 0.03, [0.72, 0.73, 0.74])
    }
  }
}

// ------------------------------------------------------------------------------------------------ the Hiram W. Johnson Building

const HJ_WALL: Rgb = [0.83, 0.84, 0.83]
const HJ_TRIM: Rgb = [0.92, 0.92, 0.9]
const HJ_GLASS: Rgb = [0.2, 0.38, 0.4]
const HJ_BAND_GLASS: Rgb = [0.3, 0.48, 0.48]

/**
 * THE HIRAM W. JOHNSON STATE OFFICE BUILDING, way/35176304 (refs/way-35176304, seen over the Earl Warren Building from
 * McAllister): 455 Golden Gate, 1998, the state's offices and the other half of the Ronald M. George complex, the
 * courtyard between them. A long pale precast slab of fourteen storeys: a grid of deep-set green-tinted windows, the
 * ends standing forward as the outline's notches say; the courtyard face (the manifest's front, −z) BOWS in plan, its
 * ends drawn back behind the end bays, and its top three storeys are continuous bands of green glass under a thin
 * cornice. The Golden Gate face is the plain grid, over a glazed lobby storey.
 */
export function hiramJohnsonBuilding(out: MeshBuilder, fit: Fit): void {
  const ring0 = walls(fit)
  const H = 51.6
  const longs = longEdges(ring0, 30)
  // the courtyard face: the long wall facing −z (where the manifest's front puts it)
  const S = longs.filter((e) => e.L > longs[0].L * 0.6).sort((p, q) => p.nz - q.nz)[0] ?? longs[0]
  // the bow: the courtyard wall replaced by an arc, on the outline at its middle, `sag` in at its ends
  const sag = Math.min(6, S.L * 0.05)
  const N = 14
  const bow: P2[] = []
  for (let k = 0; k <= N; k++) {
    const t = k / N
    const d = sag * (2 * t - 1) ** 2
    bow.push({ x: S.a.x + (S.b.x - S.a.x) * t - S.nx * d, z: S.a.z + (S.b.z - S.a.z) * t - S.nz * d })
  }
  const ring: P2[] = []
  for (let i = 0; i < ring0.length; i++) {
    if (i === S.i) { ring.push(...bow) } else ring.push(ring0[i])
  }
  // (S.b is ring0[S.i + 1], pushed next as itself; the bow's last point already sits sag in from it — keep both: the step
  // between them is the end bay standing forward of the bowed face)
  const bowIdx: number[] = []
  for (let k = 0; k < N; k++) bowIdx.push(S.i + k + (k === 0 ? 0 : 0))
  // indices of the bow's edges in the new ring: from S.i (the old S.a, now bow[0] = S.a pulled in) …
  const start = ring.indexOf(bow[0])
  const arc = new Set<number>()
  for (let k = 0; k < N; k++) arc.add(start + k)
  const rest = ring.map((_, i) => i).filter((i) => !arc.has(i))
  const shortOnes = rest.filter((i) => edgeOf(ring, i).L < 12)
  const plain = rest.filter((i) => edgeOf(ring, i).L >= 12)
  const grid = (o: Partial<Face> = {}): Face => ({ kind: 'punched', wall: HJ_WALL, glass: HJ_GLASS, pitch: 3.2, floor: 3.6, solid: 0.5, material: 'concrete', ...o })
  // the lobby storey all round, glazed behind piers
  faceBand(out, ring, 0, 6.0, { kind: 'fins', wall: [0.78, 0.78, 0.76], glass: [0.18, 0.22, 0.24], pitch: 4.8, solid: 0.25, depth: 0.4, floor: 6, material: 'concrete' })
  band(out, ring, 6.0, 6.6, 0.4, HJ_TRIM)
  const bandsAt = H - 3 * 3.6
  faceBand(out, ring, 6.6, bandsAt, grid(), [...arc, ...plain])
  faceBand(out, ring, 6.6, H, grid({ kind: 'curtain', wall: [0.62, 0.66, 0.68], glass: [0.16, 0.22, 0.26], pitch: 1.6 }), shortOnes)
  faceBand(out, ring, bandsAt, H, grid(), plain)
  faceBand(out, ring, bandsAt, H, { kind: 'bands', wall: HJ_TRIM, glass: HJ_BAND_GLASS, floor: 3.6, solid: 0.3, material: 'concrete' }, [...arc])
  // horizontal joints every four storeys up the grid
  for (let y = 6.6 + 4 * 3.6; y < bandsAt - 1; y += 4 * 3.6) band(out, ring, y - 0.1, y + 0.15, 0.12, HJ_TRIM)
  band(out, ring, bandsAt - 0.3, bandsAt, 0.25, HJ_TRIM)
  band(out, ring, H, H + 0.6, 0.7, HJ_TRIM)
  faceBand(out, ring, H + 0.6, H + 1.5, { kind: 'blank', wall: HJ_WALL, material: 'concrete' })
  capPolygon(out, ring, H + 1.5, [0.6, 0.6, 0.6], TAG.concrete)
  // the plant on the roof and its masts
  const core = offsetRing(ring0, -10)
  if (Math.abs(area2(core)) > 100 && area2(core) > 0) {
    let cx = 0, cz = 0
    for (const p of core) { cx += p.x; cz += p.z }
    cx /= core.length; cz /= core.length
    const e = edgeOf(ring0, S.i)
    const w = new Wall(out, { ...e, a: { x: cx - e.tx * 12, z: cz - e.tz * 12 }, L: 24 })
    w.slab(0, 24, H + 1.5, H + 4.2, -5, 2, [0.8, 0.8, 0.79], TAG.metal)
    for (const u of [3, 21]) { const p = w.pt(u, 0); prism(out, p.x, p.z, H + 4.2, H + 9, 0.08, 6, [0.6, 0.6, 0.6], TAG.metal, 0.04) }
  }
  void bowIdx
}

// ------------------------------------------------------------------------------------------------ the SFPUC Headquarters

const PUC_STONE: Rgb = [0.8, 0.76, 0.7]
const PUC_TRIM: Rgb = [0.84, 0.8, 0.74]
const PUC_GLASS: Rgb = [0.24, 0.41, 0.54]
const PUC_CURTAIN: Rgb = [0.28, 0.42, 0.5]
const PUC_DARK: Rgb = [0.24, 0.25, 0.27]

/**
 * THE SFPUC HEADQUARTERS, 525 Golden Gate (2012, KMD Architects with Stevens & Associates; way/173725078;
 * refs/way-173725078, looking west along Golden Gate from Polk, and back east): thirteen storeys, the "greenest office
 * building in America". On Golden Gate (the manifest's front, −z): a grid of warm pale stone with deep blue-glazed
 * windows of upright proportion; the three lowest storeys tall and glazed between stone piers, under a long dark
 * SUNSHADE that leans out over the pavement; the west bay a glass curtain wall, and before it the MAST — the tall
 * blade carrying the stack of wind-turbine frames, one at every floor. A glazed pavilion and the solar canopy on the
 * roof; the west end a blank grey party wall.
 */
export function sfpucHq(out: MeshBuilder, fit: Fit): void {
  const ring = walls(fit)
  const H = 53
  const longs = longEdges(ring, 20)
  const F = longs.filter((e) => e.L > longs[0].L * 0.8).sort((p, q) => p.nz - q.nz)[0] ?? longs[0]
  const all = ring.map((_, i) => edgeOf(ring, i))
  // the west end: the short wall at the front's far end (its b end: the street is −z, so west is +x)
  const westEnd = all.find((e) => e.i === (F.i + 1) % ring.length)!
  const base = 12.6
  const stone = (o: Partial<Face> = {}): Face => ({ kind: 'punched', wall: PUC_STONE, glass: PUC_GLASS, pitch: 2.3, floor: 3.7, solid: 0.42, material: 'granite', ...o })
  const others = all.filter((e) => e.i !== westEnd.i && e.i !== F.i).map((e) => e.i)
  // the base: three tall glazed storeys between stone piers
  faceBand(out, ring, 0, base, stone({ pitch: 6.9, floor: 4.2, solid: 0.22 }), others)
  faceBand(out, ring, base, H, stone(), others)
  faceBand(out, ring, 0, H, { kind: 'blank', wall: [0.58, 0.59, 0.6], material: 'concrete' }, [westEnd.i])
  // the front: stone grid for most of it, the west bay glass
  const glassW = Math.min(18, F.L * 0.3)
  const w = new Wall(out, F)
  const sub = (u0: number, u1: number): P2[] => [w.pt(u0, 0), w.pt(u1, 0)]
  faceBand(out, sub(0, F.L - glassW), base, H, stone())
  faceBand(out, sub(0, F.L - glassW), 0, base, stone({ pitch: 6.9, floor: 4.2, solid: 0.22 }))
  faceBand(out, sub(F.L - glassW, F.L), base, H, { kind: 'curtain', wall: PUC_DARK, glass: PUC_CURTAIN, pitch: 1.5, floor: 3.7, material: 'glass' })
  faceBand(out, sub(F.L - glassW, F.L), 0, base, { kind: 'curtain', wall: PUC_DARK, glass: [0.2, 0.26, 0.3], pitch: 3, floor: 4.2, material: 'glass' })
  band(out, ring, H, H + 0.8, 0.3, PUC_TRIM)
  capPolygon(out, ring, H + 0.8, [0.5, 0.5, 0.5], TAG.concrete)
  // the sunshade: a long dark plane leaning out over the pavement on brackets, along the stone part of the front
  const sy = base + 0.6
  const s0 = 1.0, s1 = F.L - glassW - 0.6
  const A = w.P(s0, sy, 0.1), B = w.P(s1, sy, 0.1), C = w.P(s1, sy - 1.5, 3.2), D = w.P(s0, sy - 1.5, 3.2)
  out.quad([D, C, B, A], [F.nx * 0.4, 0.9, F.nz * 0.4], UV, [0.3, 0.31, 0.33], TAG.metal)
  out.quad([A, B, C, D], [-F.nx * 0.4, -0.9, -F.nz * 0.4], UV, [0.22, 0.23, 0.25], TAG.metal)
  for (let u = s0 + 1; u < s1; u += 7) {
    const p = w.pt(u, 0.1), q = w.pt(u, 3.0)
    beam(out, [p.x, sy + 1.6, p.z], [q.x, sy - 1.4, q.z], 0.06, [0.7, 0.71, 0.72])
  }
  // the stone piers of the glazed base, standing proud on the front
  for (let u = 0; u <= F.L - glassW + 0.1; u += (F.L - glassW) / Math.round((F.L - glassW) / 6.9)) w.slab(u - 0.5, u + 0.5, 0, base, 0, 0.35, PUC_STONE)
  // the entrance canopy at the east end
  w.slab(3, 9, 4.0, 4.3, 0, 2.8, [0.88, 0.88, 0.86], TAG.metal)
  // the mast and the turbine frames: a slim blade standing out from the west bay, a frame at every floor
  const mu = F.L - 1.2
  const mo = 4.2
  w.slab(mu - 0.35, mu + 0.35, 0, H + 7, mo - 0.6, mo + 0.6, [0.74, 0.75, 0.76], TAG.metal)
  for (let y = base + 3.7; y < H; y += 3.7) {
    w.slab(F.L - 6.5, mu, y - 0.12, y + 0.12, 0, mo, [0.85, 0.86, 0.86], TAG.metal)
    w.face(F.L - 6.3, mu - 0.4, y - 3.4, y - 0.15, mo - 0.2, [0.42, 0.56, 0.62], TAG.glass)
  }
  // the roof: the glazed pavilion set back from the street, the solar canopy on posts over the rest
  const core = offsetRing(ring, -5)
  faceBand(out, core, H + 0.8, H + 4.0, { kind: 'curtain', wall: PUC_DARK, glass: [0.3, 0.38, 0.44], pitch: 2, floor: 3.2, material: 'glass' })
  capPolygon(out, core, H + 4.0, [0.42, 0.43, 0.45], TAG.metal)
  // (the solar canopy: a dark plane over the pavilion, out past it on slim posts)
  const pv = offsetRing(ring, -3)
  capPolygon(out, pv, H + 4.6, [0.13, 0.15, 0.2], TAG.glass)
  capPolygon(out, [...pv].reverse(), H + 4.45, [0.3, 0.3, 0.3], TAG.metal)
  for (const p of pv) prism(out, p.x, p.z, H + 0.8, H + 4.45, 0.12, 6, [0.6, 0.6, 0.6], TAG.metal)
}

export const STATE_BUILDINGS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  earlWarrenBuilding,
  hiramJohnsonBuilding,
  stateOfCaliforniaBuilding,
  sfCivicCenterCourthouse_108389188,
  sfpucHq,
}
