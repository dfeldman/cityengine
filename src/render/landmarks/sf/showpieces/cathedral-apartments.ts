/**
 * The Cathedral Apartments, 1201 California Street at Jones, Nob Hill (Weeks & Day, 1930), across Jones Street
 * from Grace Cathedral. From the NoeHill photographs (the street view with a cable car, the entrance, the portico;
 * 2026-10-21) and Mapillary frames 02, 03 and 06 of way/259920940.
 *
 * What the photographs show — the manifest's "Gothic Revival" is wrong: the ornament is Spanish Baroque
 * (Churrigueresque), on a plain cream terracotta tower:
 *  - a SETBACK TOWER, not a box: the whole lot rises 13 storeys; along Jones a two-bay-deep pavilion rises to 16
 *    storeys, its parapet set with cartouches; the tower behind it, flush with the California front, rises to
 *    19 storeys; the west end of California and the south end of Jones step down at the 13th;
 *  - plain cream walls with flat-headed punched windows (white double-hung sash) in pairs between pilaster strips
 *    (the piers), a tall ground storey, shaped pediments over the second-floor window pairs;
 *  - at each step a cornice and parapet, the piers rising through it, a SHAPED (scrolled) GABLE over the middle
 *    of each face with a cartouche and an urn; at the top the corner piers rise as pinnacles with urn finials;
 *  - the top five storeys of the tower's middle bays are tall recessed strips (windows over dark spandrels between
 *    colonnettes) under round heads — the "vertical" crown read from the street;
 *  - the ENTRANCE on California towards the west end: a round arch in a deep carved surround, stacked ornamented
 *    pilasters with urns, a scrolled crest; a short stair inside, a green barrel awning on brass posts to the
 *    curb, and low planter walls with quatrefoils along the front.
 *
 * The frame: the outline is a clean rectangle (31.5 m on California, 36.4 m on Jones). The STREET CORNER is found
 * as the rectangle's corner on the highest ground (Nob Hill: California falls west, Jones falls south); its
 * shorter side is California. Everything is laid out in that plan frame: `a` metres west along California from
 * the corner, `b` metres south along Jones, `y` up from the pavement at the corner.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const FIXED = 0
const T = { terra: surfaceTag('terracotta'), granite: surfaceTag('granite'), metal: surfaceTag('metal'), foliage: surfaceTag('foliage') }

// cream terracotta, warm and pale in the sun; the ornament a shade lighter, its sunk fields darker
const CREAM: Rgb = [0.89, 0.85, 0.75]
const TRIM: Rgb = [0.94, 0.92, 0.85]
const RELIEF: Rgb = [0.72, 0.69, 0.62]
const SHADE: Rgb = [0.5, 0.48, 0.44]
const PLINTH: Rgb = [0.74, 0.71, 0.65]
const GLASS: Rgb = [0.15, 0.17, 0.21]
const SPANDREL: Rgb = [0.3, 0.29, 0.28]
const SASH: Rgb = [0.9, 0.9, 0.87]
const VOID: Rgb = [0.12, 0.11, 0.1]
const ROOF: Rgb = [0.5, 0.5, 0.49]
const STEP: Rgb = [0.62, 0.42, 0.34]
const AWNING: Rgb = [0.1, 0.36, 0.22]
const BRASS: Rgb = [0.78, 0.62, 0.3]
const HEDGE: Rgb = [0.2, 0.32, 0.17]

/** Storeys: a 5 m ground storey, then 3.2 m floors; the three roof levels; the grid. */
const GROUND = 5.0
const FLOOR = 3.2
const N_WING = 13
const N_PAV = 16
const N_TOWER = 19
const base = (k: number): number => (k <= 1 ? 0 : GROUND + (k - 2) * FLOOR)
const H1 = base(N_WING + 1)
const H2 = base(N_PAV + 1)
const HT = base(N_TOWER + 1)
/** The top of the tallest urn, which the manifest height is fitted to. */
const TOP = HT + 1.5 + 3.4 + 1.6

// ------------------------------------------------------------------------------------------------ the frame

/** The plan: the street corner K, unit vectors west along California (c) and south along Jones (j). */
interface Plan { K: P2; c: P2; j: P2; Lc: number; Lj: number; s: number }
let PL: Plan = { K: { x: 0, z: 0 }, c: { x: 1, z: 0 }, j: { x: 0, z: 1 }, Lc: 30, Lj: 36, s: 1 }

const W = (a: number, b: number, y: number): V3 =>
  [PL.K.x + PL.c.x * a + PL.j.x * b, y * PL.s, PL.K.z + PL.c.z * a + PL.j.z * b]
const W2 = (a: number, b: number): P2 => ({ x: PL.K.x + PL.c.x * a + PL.j.x * b, z: PL.K.z + PL.c.z * a + PL.j.z * b })

/**
 * A face: `axis` 'a' runs along California (fixed b), 'b' along Jones (fixed a); `out` ±1 is which way it faces
 * along the other axis. u is the plan coordinate along the face, o metres out of it.
 */
interface Face { axis: 'a' | 'b'; fixed: number; out: 1 | -1 }
const FP = (f: Face, u: number, o: number, y: number): V3 =>
  f.axis === 'a' ? W(u, f.fixed + f.out * o, y) : W(f.fixed + f.out * o, u, y)
const nrm = (f: Face): V3 => {
  const v = f.axis === 'a' ? PL.j : PL.c
  return [v.x * f.out, 0, v.z * f.out]
}
const tan = (f: Face): V3 => {
  const v = f.axis === 'a' ? PL.c : PL.j
  return [v.x, 0, v.z]
}
const neg = (v: V3): V3 => [-v[0], -v[1], -v[2]]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A flat rectangle `o` proud of the face. */
function panel(out: MeshBuilder, f: Face, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  out.quad([FP(f, u0, o, y0), FP(f, u1, o, y0), FP(f, u1, o, y1), FP(f, u0, o, y1)], nrm(f), UV, c, tag)
}
/** A triangle on the face (a pediment): base u0..u1 at y0, apex at y1. */
function gable(out: MeshBuilder, f: Face, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb): void {
  const m = (u0 + u1) / 2
  out.quad([FP(f, u0, o, y0), FP(f, u1, o, y0), FP(f, m, o, y1), FP(f, m, o, y1)], nrm(f), UV, c, FIXED)
}
/** A block on the face: u0..u1 along, o0..o1 out, y0..y1 up. */
function slab(out: MeshBuilder, f: Face, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, back = false): void {
  const Q = (u: number, o: number, y: number) => FP(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], nrm(f), UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], neg(tan(f)), UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], tan(f), UV, c, tag)
  out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (back) out.quad([Q(u1, o0, y0), Q(u0, o0, y0), Q(u0, o0, y1), Q(u1, o0, y1)], neg(nrm(f)), UV, c, tag)
}
/** A round-headed shape `w` wide, `h` tall from y0, centred at u, `o` proud. */
function arch(out: MeshBuilder, f: Face, u: number, o: number, y0: number, w: number, h: number, c: Rgb, seg = 6): void {
  const r = w / 2
  const spring = y0 + h - r
  if (spring > y0) panel(out, f, u - r, u + r, o, y0, spring, c)
  for (let i = 0; i < seg; i++) {
    const a0 = Math.PI - (i / seg) * Math.PI
    const a1 = Math.PI - ((i + 1) / seg) * Math.PI
    out.quad([FP(f, u, o, spring), FP(f, u + Math.cos(a0) * r, o, spring + Math.sin(a0) * r),
      FP(f, u + Math.cos(a1) * r, o, spring + Math.sin(a1) * r), FP(f, u, o, spring)], nrm(f), UV, c, FIXED)
  }
}
/** An urn finial standing at (a, b): foot, bowl, lid and knob. */
function urn(out: MeshBuilder, p: P2, y: number, size = 1): void {
  const s = PL.s
  const k = size
  prism(out, p.x, p.z, y * s, (y + 0.25 * k) * s, 0.22 * k, 6, TRIM, T.terra, 0.16 * k, false)
  prism(out, p.x, p.z, (y + 0.25 * k) * s, (y + 0.75 * k) * s, 0.24 * k, 6, TRIM, T.terra, 0.4 * k, false)
  prism(out, p.x, p.z, (y + 0.75 * k) * s, (y + 1.25 * k) * s, 0.4 * k, 6, TRIM, T.terra, 0.12 * k)
  prism(out, p.x, p.z, (y + 1.25 * k) * s, (y + 1.6 * k) * s, 0.1 * k, 6, TRIM, T.terra, 0.0)
}

// ------------------------------------------------------------------------------------------------ the pieces

/** Ground (relative to the corner's pavement) at a point of the plan. */
let groundRel: (a: number, b: number) => number = () => 0

/** A window from y0 to y1 at u, `w` wide: dark glass, and on the fronts the white meeting rail and a sill. */
function windowAt(out: MeshBuilder, f: Face, u: number, w: number, y0: number, y1: number, rich: boolean): void {
  panel(out, f, u - w / 2, u + w / 2, 0.04, y0, y1, GLASS)
  if (rich) {
    const m = (y0 + y1) / 2 + 0.1
    panel(out, f, u - w / 2, u + w / 2, 0.06, m - 0.05, m + 0.05, SASH)
    panel(out, f, u - w / 2 - 0.12, u + w / 2 + 0.12, 0.1, y0 - 0.16, y0, TRIM, T.terra)
  }
}

/** A relief cartouche: a raised tablet, a darker sunk field and a boss. */
function cartouche(out: MeshBuilder, f: Face, u: number, w: number, y0: number, y1: number, o = 0.06): void {
  panel(out, f, u - w / 2, u + w / 2, o, y0, y1, TRIM, T.terra)
  panel(out, f, u - w / 2 + 0.12, u + w / 2 - 0.12, o + 0.01, y0 + 0.12, y1 - 0.12, RELIEF)
  panel(out, f, u - w * 0.18, u + w * 0.18, o + 0.02, (y0 + y1) / 2 - w * 0.2, (y0 + y1) / 2 + w * 0.22, TRIM)
}

/** The window columns along a face of length L: pairs between piers. */
const columns = (L: number): { pitch: number; n: number } => {
  const n = Math.max(2, 2 * Math.round(L / 6.2))
  return { pitch: L / n, n }
}

/**
 * The wall of one face between u0 and u1, from the ground (y0) to `y1`: the face itself, the windows of storeys
 * k0..k1, the piers. `street` faces get sashes and sills, the string courses and the second-floor pediments.
 */
function wall(out: MeshBuilder, f: Face, L: number, u0: number, u1: number, y0: number, y1: number, k0: number, k1: number, street: boolean,
  strips: number[] = [], stripFrom = 99): void {
  panel(out, f, u0, u1, 0, y0, y1, CREAM, T.terra)
  const g = columns(L)
  for (let i = 0; i < g.n; i++) {
    const u = (i + 0.5) * g.pitch
    if (u < u0 + 0.6 || u > u1 - 0.6) continue
    const strip = strips.includes(i)
    for (let k = k0; k <= k1; k++) {
      if (k === 1) continue // the ground storey is drawn by `groundStorey`
      const yb = base(k)
      if (strip && k >= stripFrom) continue // drawn by `strip`
      windowAt(out, f, u, 1.35, yb + 0.8, yb + 2.8, street)
    }
  }
  // the piers between window pairs, wider at the corners; they stop under the cornice at y1
  for (let i = 0; i <= g.n; i += 2) {
    const u = i * g.pitch
    if (u < u0 - 0.01 || u > u1 + 0.01) continue
    const end = i === 0 || i === g.n
    const w = end ? 0.9 : 0.55
    const lo = Math.max(u0, u - w / 2)
    const hi = Math.min(u1, u + w / 2)
    slab(out, f, lo, hi, 0, end ? 0.3 : 0.22, Math.max(y0, street ? GROUND + 0.4 : y0), y1, CREAM, T.terra)
  }
}

/** The tall recessed strip in the tower's crown: dark spandrels, the windows, colonnettes, a round head. */
function strip(out: MeshBuilder, f: Face, u: number, k0: number, k1: number): void {
  const w = 1.5
  const y0 = base(k0) + 0.6
  const y1 = base(k1 + 1) - 0.4
  panel(out, f, u - w / 2, u + w / 2, 0.02, y0, y1 - w / 2, SPANDREL)
  arch(out, f, u, 0.02, y1 - w, w, w, SPANDREL, 5)
  for (let k = k0; k <= k1; k++) {
    const yb = base(k)
    panel(out, f, u - 0.6, u + 0.6, 0.04, yb + 0.85, yb + 2.7, GLASS)
    panel(out, f, u - 0.6, u + 0.6, 0.05, yb + 1.75, yb + 1.85, SASH)
  }
  for (const s of [-1, 1]) slab(out, f, u + s * (w / 2 + 0.08) - 0.1, u + s * (w / 2 + 0.08) + 0.1, 0, 0.16, y0, y1, TRIM, T.terra)
  arch(out, f, u, 0.03, y1 - w - 0.15, w + 0.36, w + 0.3, TRIM, 5)
  arch(out, f, u, 0.04, y1 - w - 0.05, w, w, SPANDREL, 5)
  cartouche(out, f, u, 1.3, y1 + 0.05, y1 + 1.3, 0.05)
}

/**
 * A roof line between u0 and u1 at y: the cornice, the parapet and coping; the piers rising through it as
 * pinnacles (urns on the corner ones); a shaped gable with a cartouche and an urn over the middle. `ends` says
 * which ends are building corners.
 */
function parapet(out: MeshBuilder, f: Face, L: number, u0: number, u1: number, y: number, ends: [boolean, boolean], big = false): void {
  const ph = big ? 1.5 : 1.2
  slab(out, f, u0 - 0.3, u1 + 0.3, -0.2, 0.45, y - 0.55, y, TRIM, T.terra, true)
  panel(out, f, u0 - 0.3, u1 + 0.3, 0.451, y - 0.35, y - 0.25, SHADE)
  slab(out, f, u0, u1, -0.3, 0.05, y, y + ph, CREAM, T.terra, true)
  slab(out, f, u0 - 0.05, u1 + 0.05, -0.35, 0.12, y + ph, y + ph + 0.18, TRIM, T.terra)
  // the piers through it
  const g = columns(L)
  for (let i = 0; i <= g.n; i += 2) {
    const u = i * g.pitch
    if (u < u0 - 0.01 || u > u1 + 0.01) continue
    const corner = (i === 0 && ends[0]) || (i === g.n && ends[1]) || Math.abs(u - u0) < 0.05 || Math.abs(u - u1) < 0.05
    const w = corner ? (big ? 1.3 : 1.0) : 0.7
    const top = y + ph + (corner ? (big ? 3.2 : 1.9) : 1.2)
    const lo = u - w / 2
    const hi = u + w / 2
    slab(out, f, lo, hi, -0.4, 0.32, y, top, CREAM, T.terra, true)
    slab(out, f, lo - 0.1, hi + 0.1, -0.5, 0.42, top, top + 0.25, TRIM, T.terra)
    cartouche(out, f, u, w - 0.1, top - (corner ? 2.2 : 1.1), top - 0.2, 0.33)
    const p = f.axis === 'a' ? W2(u, f.fixed - f.out * 0.05) : W2(f.fixed - f.out * 0.05, u)
    if (corner) urn(out, p, top + 0.25, big ? 1.0 : 0.75)
    else prism(out, p.x, p.z, (top + 0.25) * PL.s, (top + 0.85) * PL.s, 0.22, 4, TRIM, T.terra, 0)
  }
  // the shaped gable over the middle of the run: shoulders, the raised centre, a cartouche, an urn
  const span = u1 - u0
  if (span > 5) {
    const m = (u0 + u1) / 2
    const gw = Math.min(big ? 6.5 : 5, span * 0.45)
    const top = y + ph + (big ? 2.2 : 1.6)
    slab(out, f, m - gw / 2, m + gw / 2, -0.3, 0.08, y + ph, y + ph + 0.6, CREAM, T.terra, true)
    slab(out, f, m - gw / 3, m + gw / 3, -0.3, 0.08, y + ph + 0.6, top - 0.5, CREAM, T.terra, true)
    slab(out, f, m - gw / 5, m + gw / 5, -0.3, 0.08, top - 0.5, top, CREAM, T.terra, true)
    slab(out, f, m - gw / 5 - 0.08, m + gw / 5 + 0.08, -0.35, 0.14, top, top + 0.16, TRIM, T.terra)
    for (const s of [-1, 1]) {
      // the scrolls at the shoulders
      const p = f.axis === 'a' ? W2(m + s * gw / 3, f.fixed + f.out * 0.0) : W2(f.fixed + f.out * 0.0, m + s * gw / 3)
      prism(out, p.x, p.z, (y + ph + 0.6) * PL.s, (y + ph + 1.0) * PL.s, 0.28, 6, TRIM, T.terra, 0.2)
    }
    cartouche(out, f, m, gw * 0.42, y + ph + 0.15, top - 0.15, 0.1)
    const p = f.axis === 'a' ? W2(m, f.fixed - f.out * 0.1) : W2(f.fixed - f.out * 0.1, m)
    urn(out, p, top + 0.16, big ? 1.0 : 0.8)
  }
}

/**
 * The ground storey of a street front: the plinth carried down to the lowest ground, the tall lobby windows in
 * moulded surrounds, the string courses over the ground and second storeys, the shaped pediments over the
 * second-floor window pairs. `skip` is a u range left for the entrance.
 */
function groundStorey(out: MeshBuilder, f: Face, L: number, u0: number, u1: number, floorY: number, skip: [number, number] | null): void {
  const at = (u: number): number => (f.axis === 'a' ? groundRel(u, f.fixed) : groundRel(f.fixed, u))
  slab(out, f, u0, u1, -0.2, 0.18, floorY, 0.7, PLINTH, T.granite)
  slab(out, f, u0 - 0.1, u1 + 0.1, -0.2, 0.32, GROUND - 0.25, GROUND + 0.2, TRIM, T.terra)
  slab(out, f, u0 - 0.1, u1 + 0.1, -0.2, 0.26, base(3) - 0.3, base(3) - 0.05, TRIM, T.terra)
  const g = columns(L)
  for (let i = 0; i < g.n; i++) {
    const u = (i + 0.5) * g.pitch
    if (u < u0 + 0.6 || u > u1 - 0.6) continue
    const off = skip && u > skip[0] && u < skip[1]
    const gu = at(u)
    if (!off) {
      // the lobby window, raised over the pavement where the street falls away; basement lights under it
      const sill = Math.max(1.0, gu + 1.0)
      panel(out, f, u - 0.95, u + 0.95, 0.05, sill - 0.2, GROUND - 0.6, TRIM, T.terra)
      panel(out, f, u - 0.75, u + 0.75, 0.07, sill, GROUND - 0.85, GLASS)
      panel(out, f, u - 0.75, u + 0.75, 0.09, GROUND - 1.9, GROUND - 1.8, SASH)
      if (gu < -1.4) panel(out, f, u - 0.6, u + 0.6, 0.2, gu + 0.3, Math.min(0.4, gu + 1.1), GLASS)
    }
    // the second floor: a shaped pediment over each window pair
    if (i % 2 === 0 && i + 1 < g.n) {
      const m = (i + 1) * g.pitch
      if (m - g.pitch / 2 >= u0 && m + g.pitch / 2 <= u1) {
        const y = base(2) + 2.85
        slab(out, f, m - g.pitch + 0.1, m + g.pitch - 0.1, 0, 0.14, y, y + 0.16, TRIM, T.terra)
        gable(out, f, m - g.pitch + 0.2, m + g.pitch - 0.2, 0.1, y + 0.16, y + 1.0, TRIM)
        gable(out, f, m - g.pitch + 0.7, m + g.pitch - 0.7, 0.11, y + 0.3, y + 0.75, RELIEF)
      }
    }
  }
}

/** The entrance on California: the carved round-arched portal, its stair and the green awning to the curb. */
function portal(out: MeshBuilder, f: Face, u: number): void {
  const gy = groundRel(u, f.fixed - f.out * 1.5)
  const th = gy + 0.5
  const ow = 3.2
  const oh = 5.0
  // the surround: a deep frame, the archivolt, the dark passage
  slab(out, f, u - 3.4, u + 3.4, 0, 0.6, gy - 0.3, th + 8.4, CREAM, T.terra)
  panel(out, f, u - 3.4, u + 3.4, 0.601, gy - 0.3, th + 0.15, PLINTH, T.granite)
  arch(out, f, u, 0.62, th, ow + 1.0, oh + 0.5, TRIM, 8)
  arch(out, f, u, 0.64, th, ow + 0.5, oh + 0.25, RELIEF, 8)
  arch(out, f, u, 0.66, th, ow, oh, VOID, 8)
  // the stacked ornamented pilasters each side, an urn on each
  for (const s of [-1, 1]) {
    const c = u + s * 2.75
    slab(out, f, c - 0.55, c + 0.55, 0.6, 1.1, gy - 0.3, th + 8.0, TRIM, T.terra)
    for (let k = 0; k < 4; k++) cartouche(out, f, c, 0.9, th + 1.0 + k * 1.75, th + 2.45 + k * 1.75, 1.11)
    slab(out, f, c - 0.7, c + 0.7, 0.5, 1.25, th + 8.0, th + 8.4, TRIM, T.terra)
    const p = f.axis === 'a' ? W2(c, f.fixed + f.out * 0.85) : W2(f.fixed + f.out * 0.85, c)
    urn(out, p, th + 8.4, 0.9)
  }
  // the carved field over the arch and the scrolled crest with its cartouche
  cartouche(out, f, u, 3.0, th + oh + 0.6, th + 8.0, 0.62)
  slab(out, f, u - 1.6, u + 1.6, 0.2, 0.75, th + 8.4, th + 9.3, CREAM, T.terra)
  slab(out, f, u - 0.8, u + 0.8, 0.2, 0.75, th + 9.3, th + 10.2, CREAM, T.terra)
  cartouche(out, f, u, 1.3, th + 8.5, th + 10.0, 0.76)
  // the steps up into the passage
  for (let k = 0; k < 3; k++) slab(out, f, u - ow / 2, u + ow / 2, 0.6 - 0.35 * (3 - k), 0.65, gy + k * 0.17 - 0.3, gy + (k + 1) * 0.17, STEP, T.granite)
  // the green barrel awning out to the curb on its brass posts
  const r = 1.3
  const ys = th + 2.3
  const o0 = 0.7
  const o1 = 6.2
  const seg = 8
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI
    const a1 = ((i + 1) / seg) * Math.PI
    const am = (a0 + a1) / 2
    const t = tan(f)
    const n: V3 = [t[0] * Math.cos(am), Math.sin(am), t[2] * Math.cos(am)]
    out.quad([FP(f, u + Math.cos(a0) * r, o0, ys + Math.sin(a0) * r), FP(f, u + Math.cos(a1) * r, o0, ys + Math.sin(a1) * r),
      FP(f, u + Math.cos(a1) * r, o1, ys + Math.sin(a1) * r), FP(f, u + Math.cos(a0) * r, o1, ys + Math.sin(a0) * r)], n, UV, AWNING, FIXED)
  }
  arch(out, f, u, o1 + 0.01, ys - 0.35, 2 * r, r + 0.35, AWNING, seg)
  arch(out, f, u, o1 + 0.02, ys - 0.15, 2 * r - 0.4, r, VOID, seg)
  for (const s of [-1, 1]) {
    const p = f.axis === 'a' ? W2(u + s * r, f.fixed - f.out * (o1 - 0.1)) : W2(f.fixed - f.out * (o1 - 0.1), u + s * r)
    const gp = f.axis === 'a' ? groundRel(u + s * r, f.fixed - f.out * (o1 - 0.1)) : groundRel(f.fixed - f.out * (o1 - 0.1), u + s * r)
    prism(out, p.x, p.z, gp * PL.s, ys * PL.s, 0.05, 6, BRASS, T.metal)
  }
}

/** The low planter walls along the front, with quatrefoil roundels and the hedges behind them. */
function planter(out: MeshBuilder, f: Face, u0: number, u1: number): void {
  if (u1 - u0 < 2) return
  const at = (u: number): number => groundRel(u, f.fixed - f.out * 1.4)
  const lo = Math.min(at(u0), at(u1))
  const top = Math.max(at(u0), at(u1)) + 1.0
  slab(out, f, u0, u1, 0.2, 1.4, lo - 0.3, top, PLINTH, T.granite)
  slab(out, f, u0 - 0.05, u1 + 0.05, 0.15, 1.45, top, top + 0.15, TRIM, T.terra)
  slab(out, f, u0 + 0.2, u1 - 0.2, 0.4, 1.1, top + 0.15, top + 0.9, HEDGE, T.foliage)
  for (let u = u0 + 1.2; u < u1 - 0.8; u += 2.4) {
    const y = top - 0.5
    const p = (du: number, dy: number) => FP(f, u + du, 1.41, y + dy)
    out.quad([p(0, -0.3), p(0.3, 0), p(0, 0.3), p(-0.3, 0)], nrm(f), UV, SHADE, FIXED)
  }
}

// ------------------------------------------------------------------------------------------------ the building

/** The street corner and the two street directions, from the outline and the ground under it. */
function planFor(fit: Fit): Plan {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const ring = simplifyRing(raw, 0.8)
  // the longest edge gives the grid's direction; the outline's box in that direction is the plan
  let ex = 1
  let ez = 0
  let best = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L > best) { best = L; ex = (b.x - a.x) / L; ez = (b.z - a.z) / L }
  }
  const fx = -ez
  const fz = ex
  let p0 = Infinity, p1 = -Infinity, q0 = Infinity, q1 = -Infinity
  for (const p of ring) {
    const pu = p.x * ex + p.z * ez
    const pv = p.x * fx + p.z * fz
    p0 = Math.min(p0, pu); p1 = Math.max(p1, pu); q0 = Math.min(q0, pv); q1 = Math.max(q1, pv)
  }
  const corner = (pu: number, pv: number): P2 => ({ x: ex * pu + fx * pv, z: ez * pu + fz * pv })
  const C = [corner(p0, q0), corner(p1, q0), corner(p1, q1), corner(p0, q1)]
  // the street corner: the highest ground (the hill's top is up California and up Jones); without a ground
  // sampler, the north-east corner of a north-up frame (model-shots with --front=180)
  let ki = 0
  let top = -Infinity
  for (let i = 0; i < 4; i++) {
    const v = fit.groundAt ? fit.groundAt(C[i].x, C[i].z) : C[i].x + C[i].z
    if (v > top) { top = v; ki = i }
  }
  const K = C[ki]
  const A = C[(ki + 1) % 4]
  const B = C[(ki + 3) % 4]
  const la = Math.hypot(A.x - K.x, A.z - K.z)
  const lb = Math.hypot(B.x - K.x, B.z - K.z)
  // California is the shorter street front (31.5 m against Jones' 36.4 m)
  const [Cn, Lc, Jn, Lj] = la <= lb ? [A, la, B, lb] : [B, lb, A, la]
  return {
    K,
    c: { x: (Cn.x - K.x) / Lc, z: (Cn.z - K.z) / Lc },
    j: { x: (Jn.x - K.x) / Lj, z: (Jn.z - K.z) / Lj },
    Lc, Lj, s: Math.max(0.9, Math.min(1.12, fit.height / TOP)),
  }
}

/** Anticlockwise (as capPolygon wants) rectangle a0..a1 × b0..b1 of the plan. */
function rect(a0: number, a1: number, b0: number, b1: number): P2[] {
  const r = [W2(a0, b0), W2(a1, b0), W2(a1, b1), W2(a0, b1)]
  let area = 0
  for (let i = 0; i < 4; i++) { const p = r[i]; const q = r[(i + 1) % 4]; area += p.x * q.z - q.x * p.z }
  return area >= 0 ? r : r.reverse()
}

function cathedralApartments(out: MeshBuilder, fit: Fit): void {
  PL = planFor(fit)
  const { Lc, Lj, s } = PL
  const gc = columns(Lc)
  const gj = columns(Lj)
  // the setbacks fall on the piers: the pavilion two bays deep off Jones, the wings two bays at each far end
  const dJ = 2 * gc.pitch
  const aT = Lc - 2 * gc.pitch
  const bT = Lj - 2 * gj.pitch
  // the street datum: the pavement at the corner; everything is drawn from it and lifted at the end
  const gK = fit.groundAt ? Math.max(0, Math.min(14, fit.groundAt(PL.K.x, PL.K.z))) : 0
  groundRel = (a, b) => {
    if (!fit.groundAt) return 0
    const p = W2(a, b)
    return Math.max(-gK, Math.min(1, fit.groundAt(p.x, p.z) - gK)) / s
  }
  const lo = -gK / s - 0.3
  const v0 = out.positions.length

  const CAL: Face = { axis: 'a', fixed: 0, out: -1 }
  const JON: Face = { axis: 'b', fixed: 0, out: -1 }
  const REAR: Face = { axis: 'a', fixed: Lj, out: 1 }
  const WEST: Face = { axis: 'b', fixed: Lc, out: 1 }
  const portalU = Math.min(Lc - 4.2, (Math.round(0.7 * gc.n) + 0.5) * gc.pitch)

  // California: the pavilion's end, the tower (its middle bays the crown's strips), the west wing
  const midC = [Math.floor((gc.n - 1) / 2), Math.ceil((gc.n - 1) / 2)]
  wall(out, CAL, Lc, 0, dJ, lo, H2, 2, N_PAV, true)
  wall(out, CAL, Lc, dJ, aT, lo, HT, 2, N_TOWER, true, midC, N_TOWER - 4)
  wall(out, CAL, Lc, aT, Lc, lo, H1, 2, N_WING, true)
  for (const i of midC) strip(out, CAL, (i + 0.5) * gc.pitch, N_TOWER - 4, N_TOWER)
  groundStorey(out, CAL, Lc, 0, Lc, lo, [portalU - 3.6, portalU + 3.6])
  portal(out, CAL, portalU)
  planter(out, CAL, 1.2, portalU - 4.4)
  planter(out, CAL, portalU + 4.4, Lc - 0.4)
  // Jones: the pavilion, the south wing
  wall(out, JON, Lj, 0, bT, lo, H2, 2, N_PAV, true)
  wall(out, JON, Lj, bT, Lj, lo, H1, 2, N_WING, true)
  groundStorey(out, JON, Lj, 0, Lj, lo, null)
  // the rear and the west side: plain punched walls over the neighbours
  wall(out, REAR, Lc, 0, Lc, lo, H1, 2, N_WING, false)
  wall(out, WEST, Lj, 0, Lj, lo, H1, 2, N_WING, false)
  // the tower's other faces over the setbacks, and the pavilion's south end
  const midJ = [Math.floor((gj.n - 1) / 2) - 1, Math.floor((gj.n - 1) / 2)]
  wall(out, { axis: 'b', fixed: dJ, out: -1 }, Lj, 0, bT, H2, HT, N_PAV + 1, N_TOWER, true, midJ, N_TOWER - 4)
  for (const i of midJ) strip(out, { axis: 'b', fixed: dJ, out: -1 }, (i + 0.5) * gj.pitch, N_TOWER - 4, N_TOWER)
  wall(out, { axis: 'b', fixed: aT, out: 1 }, Lj, 0, bT, H1, HT, N_WING + 1, N_TOWER, false)
  wall(out, { axis: 'a', fixed: bT, out: 1 }, Lc, dJ, aT, H1, HT, N_WING + 1, N_TOWER, false)
  wall(out, { axis: 'a', fixed: bT, out: 1 }, Lc, 0, dJ, H1, H2, N_WING + 1, N_PAV, false)

  // the roof lines: the wings at the 13th, the pavilion at the 16th, the tower's crown at the 19th
  parapet(out, CAL, Lc, aT, Lc, H1, [false, true])
  parapet(out, JON, Lj, bT, Lj, H1, [false, true])
  parapet(out, REAR, Lc, 0, Lc, H1, [true, true])
  parapet(out, WEST, Lj, 0, Lj, H1, [true, true])
  parapet(out, CAL, Lc, 0, dJ, H2, [true, false])
  parapet(out, JON, Lj, 0, bT, H2, [true, false])
  parapet(out, { axis: 'a', fixed: bT, out: 1 }, Lc, 0, dJ, H2, [true, false])
  parapet(out, CAL, Lc, dJ, aT, HT, [true, true], true)
  parapet(out, { axis: 'b', fixed: dJ, out: -1 }, Lj, 0, bT, HT, [true, true], true)
  parapet(out, { axis: 'b', fixed: aT, out: 1 }, Lj, 0, bT, HT, [true, true], true)
  parapet(out, { axis: 'a', fixed: bT, out: 1 }, Lc, dJ, aT, HT, [true, true], true)
  // the roofs
  capPolygon(out, rect(aT, Lc, 0, Lj), H1 * s, ROOF, T.metal)
  capPolygon(out, rect(0, aT, bT, Lj), H1 * s, ROOF, T.metal)
  capPolygon(out, rect(0, dJ, 0, bT), H2 * s, ROOF, T.metal)
  capPolygon(out, rect(dJ, aT, 0, bT), HT * s, ROOF, T.metal)
  // the penthouse on the tower roof, over the lifts, and the water tank house behind it
  const ph: Face = { axis: 'a', fixed: bT * 0.62, out: 1 }
  slab(out, ph, dJ + 5, aT - 6, -6, 0, HT, HT + 3.0, CREAM, T.terra, true)
  slab(out, ph, dJ + 4.9, aT - 5.9, -6.1, 0.1, HT + 3.0, HT + 3.25, TRIM, T.terra)
  capPolygon(out, rect(dJ + 5, aT - 6, bT * 0.62 - 6, bT * 0.62), (HT + 3.25) * s, ROOF, T.metal)

  // everything was drawn on the corner's datum (W and FP scale y by s); lift it onto the street
  if (gK > 0) for (let k = v0 + 1; k < out.positions.length; k += 3) out.positions[k] += gK
}

export const CATHEDRAL_APARTMENTS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/259920940 — the Cathedral Apartments, 1201 California Street at Jones (Weeks & Day, 1930). */
  cathedralApartments,
}
