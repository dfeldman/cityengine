/**
 * Mission San Francisco de Asís — Old Mission Dolores (1791), way/256442765 on Dolores Street, the oldest intact
 * building in San Francisco — rebuilt by hand from Mapillary frames (2026-10-21). It replaces manual-1.ts's
 * `church()` kit call, which drew a grey gabled shed with a row of twelve windows down each side.
 *
 * References (Mapillary, all 360 crops toward the building): 1685559212242153 (straight on, the best),
 * 924512332876921 (the front past a palm, the lean-to's front at left), 879518820373547 (front beside the 1918
 * Basilica), 3634025323529851 (the south side: lean-to, eaves, the battered pedestals). The stored ref
 * p3/refs/way-256442765/01 is a wrong fallback (a brick building in another city).
 *
 * What the frames show, and this builds:
 *  - a long whitewashed ADOBE NAVE, its side walls almost blank (a few tiny high openings), under a red clay
 *    TILE gable roof with deep overhanging eaves on dark exposed rafters; the roof runs out well PAST the front
 *    wall, its dark barge boards and purlin ends heavy over the facade, a dark wooden CROSS on the apex;
 *  - the DOLORES FRONT, counted from 1685559212242153: the lower storey has FOUR big plain engaged columns, a pair
 *    each side of the door, standing on two tall battered PEDESTALS; between them the round-arched dark plank
 *    DOOR in a plain raised surround, up four red brick STEPS; over the columns a beam carrying the dark timber
 *    BALCONY right across the front (dark posts, rails and floor, white balusters); the upper storey has FOUR
 *    broad flat pilasters alternating with THREE BELL OPENINGS — arched either side, the middle one square
 *    and taller — each with its bell; a cornice, then the gable under the overhanging roof;
 *  - the LEAN-TO on the south side by the front (the outline's bump): a lower whitewashed wing under a single tile
 *    slope down from the nave wall, its front set back, with an arched door and a doorway up red steps.
 *
 * The frame: the outline as given. The front is the END edge (one of the two short edges) nearer the lean-to —
 * the two ends are the same length, and which one faces -z differs between the city and the shot tool, so the
 * wing's position is what tells them apart. Everything is laid out in that edge's frame: `u` along the front
 * (left to right as seen from the street), `o` out of it (negative into the building), y up, front work at
 * `fit.grade`.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { classicalColumn } from '../../column.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const FIXED = 0
const T = { stucco: surfaceTag('stucco'), tile: surfaceTag('tile'), wood: surfaceTag('planks'), brick: surfaceTag('brick') }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

// whitewash, brighter than the Basilica's cream next door; its raised trim a touch greyer in the shade
const WHITE: Rgb = [0.95, 0.95, 0.92]
const TRIM: Rgb = [0.88, 0.88, 0.85]
const SHADOW: Rgb = [0.8, 0.8, 0.78]
const SHADE: Rgb = [0.55, 0.55, 0.54]
const TILE: Rgb = [0.56, 0.3, 0.21]
const TIMBER: Rgb = [0.27, 0.19, 0.13]
const DOOR: Rgb = [0.34, 0.23, 0.15]
const DARK: Rgb = [0.14, 0.13, 0.13]
const BELL: Rgb = [0.36, 0.29, 0.18]
const BRICK: Rgb = [0.6, 0.31, 0.24]
const CROSS: Rgb = [0.2, 0.17, 0.15]

/**
 * Heights over the grade at the front, metres, measured off the straight-on frame (1685559212242153) with the
 * front taken as 10 m across between its upper corners. (OSM's outline is 12.2 m across, which would make the door
 * 3 m wide and the gable 16 m high; the frame's proportions are kept, scaled to the smaller width, and the parts
 * are spread across the outline's.)
 */
const Y = {
  ped: 2.95,        // the battered base: its cap, under the column bases
  ped2: 3.33,       // the lower columns' bases
  sill: 1.0,        // the door's sill, at the head of the brick steps
  doorTop: 5.25,    // the door arch's crown
  doorW: 2.55,
  beam: 7.3,        // the beam over the lower columns
  floor: 7.75,      // the balcony floor's top
  rail: 8.65,       // the balcony's top rail
  bell0: 9.3,       // the side bell openings' sill (arched, crowns 10.77)
  bell1: 10.77,
  mid0: 9.74,       // the middle opening (square, 9.74 to 11.2)
  mid1: 11.2,
  bellW: 0.8,
  cornice: 11.3,    // the cornice over the upper columns, tucked under the roof's rakes
  eaves: 10.6,      // the front's corners and the side walls' eaves
  leanIn: 6.0,      // the lean-to roof against the nave
  leanOut: 4.2,     // the lean-to's outer eaves
}
/** the gable's rise over its half-width (the frame's roof is about 23°) */
const PITCH = 0.44

// ------------------------------------------------------------------------------------------- an edge's frame

/** A wall's frame: `u` along it from `o`rigin, `o` outward (negative into the building), y up. */
interface Fr { ox: number; oz: number; tx: number; tz: number; nx: number; nz: number; L: number }

const frameOf = (a: P2, b: P2): Fr => {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { ox: a.x, oz: a.z, tx, tz, nx: tz, nz: -tx, L }
}
const P = (f: Fr, u: number, o: number, y: number): V3 => [f.ox + f.tx * u + f.nx * o, y, f.oz + f.tz * u + f.nz * o]
const pt = (f: Fr, u: number, o: number): P2 => ({ x: f.ox + f.tx * u + f.nx * o, z: f.oz + f.tz * u + f.nz * o })
const inFr = (f: Fr, p: P2): { u: number; o: number } =>
  ({ u: (p.x - f.ox) * f.tx + (p.z - f.oz) * f.tz, o: (p.x - f.ox) * f.nx + (p.z - f.oz) * f.nz })
const dir = (f: Fr, du: number, dy: number, dn: number): V3 => [f.tx * du + f.nx * dn, dy, f.tz * du + f.nz * dn]

/** Any four points, listed bottom-left, bottom-right, top-right, top-left as seen from the side that shows. */
function face(out: MeshBuilder, a: V3, b: V3, c: V3, d: V3, col: Rgb, tag = FIXED): void {
  const e1: V3 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]]
  let e2: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  if (Math.hypot(...e2) < 1e-6) e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const n: V3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
  const k = Math.hypot(...n) || 1
  out.quad([a, b, c, d], [n[0] / k, n[1] / k, n[2] / k], UV, col, tag)
}

/** A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up; `bottom` false drops the underside. */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, bottom = false, back = false): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], dir(f, 0, 0, 1), UV, c, tag)
  if (back) out.quad([Q(u1, o0, y0), Q(u0, o0, y0), Q(u0, o0, y1), Q(u1, o0, y1)], dir(f, 0, 0, -1), UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], dir(f, -1, 0, 0), UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], dir(f, 1, 0, 0), UV, c, tag)
  out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (bottom) out.quad([Q(u0, o1, y0), Q(u0, o0, y0), Q(u1, o0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}

/** A flat rectangle facing out of the wall, `o` off it. */
function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  if (u1 - u0 < 0.01 || y1 - y0 < 0.01) return
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], dir(f, 0, 0, 1), UV, c, tag)
}

/** A round-headed shape `w` wide, `h` tall from `y0`, centred `u`, facing out at `o`. */
function arch(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, w: number, h: number, c: Rgb, seg = 6, tag = FIXED): void {
  const r = w / 2
  const spring = y0 + h - r
  if (spring > y0) panel(out, f, u - r, u + r, o, y0, spring, c, tag)
  for (let i = 0; i < seg; i++) {
    const a0 = Math.PI - (i / seg) * Math.PI
    const a1 = Math.PI - ((i + 1) / seg) * Math.PI
    out.quad([P(f, u, o, spring), P(f, u + Math.cos(a0) * r, o, spring + Math.sin(a0) * r), P(f, u + Math.cos(a1) * r, o, spring + Math.sin(a1) * r), P(f, u, o, spring)],
      dir(f, 0, 0, 1), UV, c, tag)
  }
}

/** The ring of an arch between radii `r0` and `r1` round (u, spring), facing out at `o`. */
function archRing(out: MeshBuilder, f: Fr, u: number, spring: number, r0: number, r1: number, o: number, c: Rgb, seg = 8, tag = FIXED): void {
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI
    const a1 = ((i + 1) / seg) * Math.PI
    const at = (r: number, a: number): V3 => P(f, u + Math.cos(a) * r, o, spring + Math.sin(a) * r)
    out.quad([at(r1, a0), at(r0, a0), at(r0, a1), at(r1, a1)], dir(f, 0, 0, 1), UV, c, tag)
  }
}

/** A plain wall on a frame from `y0` to `y1`, `u0..u1`, at o = 0. */
const wall = (out: MeshBuilder, f: Fr, u0: number, u1: number, y0: number, y1: number, c = WHITE): void =>
  panel(out, f, u0, u1, 0, y0, y1, c, T.stucco)

/**
 * A battered block against the wall: `u0..u1` at its top, splayed out by `du0`/`du1` at its foot; its face `ob`
 * out at the foot drawn in to `ot` at the top.
 */
function batter(out: MeshBuilder, f: Fr, u0: number, u1: number, du0: number, du1: number, ob: number, ot: number, y0: number, y1: number, c: Rgb): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  const tag = T.stucco
  face(out, Q(u0 - du0, ob, y0), Q(u1 + du1, ob, y0), Q(u1, ot, y1), Q(u0, ot, y1), c, tag)
  face(out, Q(u0 - du0, -0.05, y0), Q(u0 - du0, ob, y0), Q(u0, ot, y1), Q(u0, -0.05, y1), c, tag)
  face(out, Q(u1 + du1, ob, y0), Q(u1 + du1, -0.05, y0), Q(u1, -0.05, y1), Q(u1, ot, y1), c, tag)
  face(out, Q(u0, -0.05, y1), Q(u0, ot, y1), Q(u1, ot, y1), Q(u1, -0.05, y1), c, tag)
}

// ------------------------------------------------------------------------------------------- the outline

interface Plan { F: Fr; W: number; D: number; wing: { u0: number; u1: number; o0: number; o1: number } | null }

/** Find the front and the lean-to on the outline (see the header). */
function planOf(fit: Fit): Plan {
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring = [...ring].reverse()
  const N = ring.length
  // the long axis: the longest edge's direction
  let li = 0, lL = 0
  for (let i = 0; i < N; i++) {
    const a = ring[i], b = ring[(i + 1) % N]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L > lL) { lL = L; li = i }
  }
  const A = frameOf(ring[li], ring[(li + 1) % N])
  // in the long edge's frame: the nave's strip across (o) and its run along (u)
  const pts = ring.map((p) => inFr(A, p))
  const uMin = Math.min(...pts.map((p) => p.u)), uMax = Math.max(...pts.map((p) => p.u))
  // the nave's far side: the longest edge parallel to the long one and well across from it; past it (or before
  // the near side) lies the wing
  let farO = -2 * fit.hz, farL = 0
  for (let i = 0; i < N; i++) {
    const p = pts[i], q = pts[(i + 1) % N]
    const L = Math.hypot(q.u - p.u, q.o - p.o)
    if (Math.abs(q.o - p.o) > 0.2 * L) continue
    const o = (p.o + q.o) / 2
    if (o < -3 && L > farL) { farL = L; farO = o }
  }
  const wingPts = pts.filter((p) => p.o < farO - 1.0 || p.o > 1.0)
  const naveW = -farO
  // the two ends; the front is the end nearer the wing, else the end facing -z (where the city stands a front)
  let frontAtMax: boolean
  if (wingPts.length) {
    const wu = wingPts.reduce((t, p) => t + p.u, 0) / wingPts.length
    frontAtMax = uMax - wu < wu - uMin
  } else frontAtMax = pt(A, uMax, -naveW / 2).z < pt(A, uMin, -naveW / 2).z
  // the front frame: u left to right as seen from the street, o out of the front
  const F = frontAtMax ? frameOf(pt(A, uMax, 0), pt(A, uMax, -naveW)) : frameOf(pt(A, uMin, -naveW), pt(A, uMin, 0))
  const D = uMax - uMin
  let wing: Plan['wing'] = null
  if (wingPts.length) {
    const wp = wingPts.map((p) => inFr(F, pt(A, p.u, p.o)))
    const wu = wp.map((p) => p.u), wo = wp.map((p) => p.o)
    const side = Math.min(...wu) < 0 ? -1 : 1
    wing = side < 0
      ? { u0: Math.min(...wu), u1: 0, o0: Math.min(...wo), o1: Math.max(...wo) }
      : { u0: F.L, u1: Math.max(...wu), o0: Math.min(...wo), o1: Math.max(...wo) }
  }
  return { F, W: F.L, D, wing }
}

// ------------------------------------------------------------------------------------------- the building

function missionDolores(out: MeshBuilder, fit: Fit): void {
  const { F, W, D, wing } = planOf(fit)
  const G = fit.grade ?? 0
  const st = T.stucco
  const uc = W / 2
  const rise = PITCH * (W / 2)
  const Ye = G + Y.eaves
  const Ya = Ye + rise

  // ---- the nave's walls: the front, the two sides, the back gable
  const Bk = frameOf(pt(F, W, -D), pt(F, 0, -D))
  const Sl = frameOf(pt(F, 0, -D), pt(F, 0, 0))     // the left (lean-to) side, facing out to the left
  const Sr = frameOf(pt(F, W, 0), pt(F, W, -D))     // the right side
  wall(out, F, 0, W, 0, Ye)
  face(out, P(F, 0, 0, Ye), P(F, W, 0, Ye), P(F, uc, 0, Ya), P(F, uc, 0, Ya), WHITE, st)
  wall(out, Bk, 0, W, 0, Ye, SHADOW)
  face(out, P(Bk, 0, 0, Ye), P(Bk, W, 0, Ye), P(Bk, W / 2, 0, Ya), P(Bk, W / 2, 0, Ya), SHADOW, st)
  wall(out, Sl, 0, D, 0, Ye)
  wall(out, Sr, 0, D, 0, Ye)
  // a few tiny high openings along each side, as the frames show — nothing like a row of windows
  for (const s of [Sl, Sr]) for (const k of [0.22, 0.47, 0.72]) panel(out, s, D * k, D * k + 0.45, 0.02, Ye - 1.6, Ye - 1.1, DARK)

  // ---- the roof: two tile slopes on deep eaves, running out past the front; dark timber underneath
  const ovS = 0.8, ovF = 1.6, ovB = 0.5
  const drop = ovS * PITCH
  const roofSlope = (sgn: number): void => {
    const ue = sgn < 0 ? -ovS : W + ovS
    const Q = (u: number, o: number, y: number) => P(F, u, o, y)
    const ye = Ye - drop
    // top (tile) and soffit (timber)
    if (sgn < 0) {
      face(out, Q(ue, ovF, ye), Q(uc, ovF, Ya + 0.25), Q(uc, -D - ovB, Ya + 0.25), Q(ue, -D - ovB, ye), TILE, T.tile)
      face(out, Q(ue, -D - ovB, ye - 0.05), Q(uc, -D - ovB, Ya - 0.05), Q(uc, ovF, Ya - 0.05), Q(ue, ovF, ye - 0.05), TIMBER, T.wood)
    } else {
      face(out, Q(uc, ovF, Ya + 0.25), Q(ue, ovF, ye), Q(ue, -D - ovB, ye), Q(uc, -D - ovB, Ya + 0.25), TILE, T.tile)
      face(out, Q(uc, -D - ovB, Ya - 0.05), Q(ue, -D - ovB, ye - 0.05), Q(ue, ovF, ye - 0.05), Q(uc, ovF, Ya - 0.05), TIMBER, T.wood)
    }
    // the heavy barge board along the front rake, and the eaves fascia down the side
    const bb = 0.42
    const [ua, ub] = sgn < 0 ? [ue, uc] : [uc, ue]
    const [ya, yb] = sgn < 0 ? [ye, Ya] : [Ya, ye]
    face(out, Q(ua, ovF, ya - bb), Q(ub, ovF, yb - bb), Q(ub, ovF, yb + 0.25), Q(ua, ovF, ya + 0.25), TIMBER, T.wood)
    face(out, Q(ub, -D - ovB, yb - bb), Q(ua, -D - ovB, ya - bb), Q(ua, -D - ovB, ya + 0.25), Q(ub, -D - ovB, yb + 0.25), TIMBER, T.wood)
    const se = sgn < 0 ? frameOf(pt(F, ue, -D - ovB), pt(F, ue, ovF)) : frameOf(pt(F, ue, ovF), pt(F, ue, -D - ovB))
    panel(out, se, 0, se.L, 0, ye - 0.22, ye + 0.05, TIMBER, T.wood)
    // rafter tails under the side eaves
    for (let o = -0.6; o > -D; o -= 1.6) {
      const u0 = sgn < 0 ? ue + 0.05 : W
      const u1 = sgn < 0 ? 0 : ue - 0.05
      slab(out, F, u0, u1, o - 0.09, o + 0.09, ye - 0.3, ye - 0.05, TIMBER, T.wood, true)
    }
  }
  roofSlope(-1)
  roofSlope(1)
  // the purlin ends and the ridge beam under the front overhang
  for (const k of [-0.62, 0, 0.62]) {
    const u = uc + k * (W / 2)
    const y = Ya - Math.abs(k) * rise - 0.35
    slab(out, F, u - 0.18, u + 0.18, -0.1, ovF - 0.05, y - 0.3, y, TIMBER, T.wood, true)
  }
  // the cross on the apex, over the front
  slab(out, F, uc - 0.09, uc + 0.09, ovF - 0.35, ovF - 0.15, Ya + 0.2, Ya + 2.1, CROSS, T.wood)
  slab(out, F, uc - 0.5, uc + 0.5, ovF - 0.35, ovF - 0.15, Ya + 1.35, Ya + 1.55, CROSS, T.wood)

  // ---- the lower storey: the battered base in two masses either side of the door, four engaged columns on it,
  // the arched door up brick steps between
  const doorW = Y.doorW
  const pedL: [number, number] = [-0.05, uc - doorW / 2 - 0.55]
  const pedR: [number, number] = [uc + doorW / 2 + 0.55, W + 0.05]
  for (const [u0, u1] of [pedL, pedR]) {
    // battered: deep at the foot, its outer corner splayed outward, drawn in to the cap
    const outer = u0 < uc ? -1 : 1
    const du0 = outer < 0 ? 0.55 : 0, du1 = outer > 0 ? 0.55 : 0
    batter(out, F, u0, u1, du0, du1, 1.35, 0.85, G - 0.6, G + Y.ped - 0.2, WHITE)
    slab(out, F, u0 - 0.05, u1 + 0.05, -0.05, 0.95, G + Y.ped - 0.2, G + Y.ped, TRIM, T.stucco)
    // the column bases' plinth, stepped back
    slab(out, F, u0 + 0.1, u1 - 0.1, -0.05, 0.8, G + Y.ped, G + Y.ped2, WHITE, T.stucco)
  }
  // the lower columns, at the frame's spacing: a pair on each mass
  const colsLow = [0.073, 0.207, 0.793, 0.927].map((k) => k * W)
  const rLow = 0.42
  for (const u of colsLow) {
    const p = pt(F, u, 0.36)
    classicalColumn(out, p.x, p.z, G + Y.ped2, G + Y.beam, rLow, WHITE, { order: 'tuscan', tier: 'mid', tag: T.stucco, heading: Math.atan2(F.nx, F.nz) })
  }
  // the beam over them, right across
  slab(out, F, -0.15, W + 0.15, -0.05, 0.85, G + Y.beam, G + Y.floor - 0.18, WHITE, T.stucco, true)
  // the door: its raised surround on imposts, the dark plank door, the brick steps
  const dSpring = G + Y.doorTop - doorW / 2
  slab(out, F, uc - doorW / 2 - 0.35, uc - doorW / 2, -0.05, 0.12, G + Y.sill, dSpring, TRIM, T.stucco)
  slab(out, F, uc + doorW / 2, uc + doorW / 2 + 0.35, -0.05, 0.12, G + Y.sill, dSpring, TRIM, T.stucco)
  slab(out, F, uc - doorW / 2 - 0.45, uc - doorW / 2 + 0.05, -0.05, 0.18, dSpring - 0.2, dSpring, TRIM, T.stucco)
  slab(out, F, uc + doorW / 2 - 0.05, uc + doorW / 2 + 0.45, -0.05, 0.18, dSpring - 0.2, dSpring, TRIM, T.stucco)
  archRing(out, F, uc, dSpring, doorW / 2, doorW / 2 + 0.35, 0.12, TRIM, 8, T.stucco)
  arch(out, F, uc, 0.03, G + Y.sill, doorW, Y.doorTop - Y.sill, DOOR, 8, T.wood)
  panel(out, F, uc - 0.03, uc + 0.03, 0.05, G + Y.sill, dSpring + doorW / 2 - 0.05, DARK, T.wood)
  const steps = 5
  for (let i = 0; i < steps; i++) {
    const h = ((i + 1) * Y.sill) / steps
    slab(out, F, pedL[1] - 0.05, pedR[0] + 0.05, -0.05, 1.6 - i * 0.32, G - 0.4, G + h, BRICK, T.brick)
  }

  // ---- the balcony across the front: a dark timber floor on the beam, posts, rails and white balusters
  const bo = 1.0
  slab(out, F, -0.35, W + 0.35, -0.05, bo, G + Y.floor - 0.22, G + Y.floor, TIMBER, T.wood, true)
  slab(out, F, -0.35, W + 0.35, bo - 0.1, bo + 0.02, G + Y.rail - 0.12, G + Y.rail, TIMBER, T.wood, true)
  slab(out, F, -0.35, W + 0.35, bo - 0.1, bo + 0.02, G + Y.floor, G + Y.floor + 0.12, TIMBER, T.wood)
  for (const u of [-0.35, W + 0.23]) slab(out, F, u, u + 0.12, bo - 0.13, bo + 0.02, G + Y.floor, G + Y.rail, TIMBER, T.wood)
  // the solid middle panel under the middle bell
  slab(out, F, uc - 0.55, uc + 0.55, bo - 0.12, bo + 0.01, G + Y.floor, G + Y.rail, TIMBER, T.wood)
  // the wall behind the rail in the balcony's shade, so the balusters read against it
  panel(out, F, 0, W, 0.02, G + Y.floor, G + Y.rail, SHADE, T.stucco)
  for (let u = 0; u < W; u += 0.3) {
    if (Math.abs(u + 0.04 - uc) < 0.65) continue
    const Q = (uu: number, o: number, y: number) => P(F, uu, o, y)
    const y0 = G + Y.floor + 0.12, y1 = G + Y.rail - 0.12
    face(out, Q(u, bo - 0.05, y0), Q(u + 0.09, bo - 0.05, y0), Q(u + 0.09, bo - 0.05, y1), Q(u, bo - 0.05, y1), WHITE, T.stucco)
  }
  // the balcony's two ends
  for (const u of [-0.35, W + 0.35]) {
    const sf = u < 0 ? frameOf(pt(F, u, -0.05), pt(F, u, bo)) : frameOf(pt(F, u, bo), pt(F, u, -0.05))
    panel(out, sf, 0, sf.L, 0, G + Y.floor + 0.12, G + Y.rail - 0.12, TIMBER, T.wood)
  }

  // ---- the upper storey: four engaged columns between three bell openings, a cornice under the rakes
  const sp = 0.21 * W
  const colsUp = [uc - sp * 1.5, uc - sp * 0.5, uc + sp * 0.5, uc + sp * 1.5]
  // (broad flat pilasters in the frame, not round shafts: a base, the shaft, a capital block)
  for (const u of colsUp) {
    slab(out, F, u - 0.32, u + 0.32, -0.05, 0.22, G + Y.floor, G + Y.cornice - 0.25, WHITE, T.stucco)
    slab(out, F, u - 0.4, u + 0.4, -0.05, 0.3, G + Y.cornice - 0.25, G + Y.cornice, TRIM, T.stucco, true)
  }
  const cw = sp * 1.5 + 0.55
  slab(out, F, uc - cw, uc + cw, -0.05, 0.5, G + Y.cornice, G + Y.cornice + 0.3, TRIM, T.stucco, true)
  // the bells: arched openings either side, the middle one square and higher
  const bw = Y.bellW
  for (const [u, sq] of [[uc - sp, false], [uc, true], [uc + sp, false]] as [number, boolean][]) {
    const y0 = G + (sq ? Y.mid0 : Y.bell0), y1 = G + (sq ? Y.mid1 : Y.bell1)
    if (sq) {
      panel(out, F, u - bw / 2 - 0.15, u + bw / 2 + 0.15, 0.04, y0 - 0.15, y1 + 0.05, TRIM, T.stucco)
      panel(out, F, u - bw / 2, u + bw / 2, 0.06, y0, y1, DARK)
    } else {
      archRing(out, F, u, y1 - bw / 2, bw / 2, bw / 2 + 0.15, 0.05, TRIM, 6, T.stucco)
      panel(out, F, u - bw / 2 - 0.15, u + bw / 2 + 0.15, 0.04, y0 - 0.15, y0, TRIM, T.stucco)
      arch(out, F, u, 0.06, y0, bw, y1 - y0, DARK, 6)
    }
    const b = pt(F, u, 0.0)
    const by = y1 - (sq ? 0.25 : 0.5)
    prism(out, b.x, b.z, by - 0.62, by, 0.33, 8, BELL, surfaceTag('metal'), 0.15)
  }
  // the moulding in the gable: a raised band following each rake a little inside it, scrolled down at its foot
  const rr = (u: number) => Ye + rise * (1 - Math.abs(u - uc) / (W / 2))
  for (const [a, b] of [[0.4, uc - 0.6], [uc + 0.6, W - 0.4]] as [number, number][]) {
    const Q = (u: number, y: number) => P(F, u, 0.06, y)
    face(out, Q(a, rr(a) - 0.85), Q(b, rr(b) - 0.85), Q(b, rr(b) - 0.6), Q(a, rr(a) - 0.6), TRIM, T.stucco)
  }

  // ---- the lean-to: a lower whitewashed wing under a single tile slope down from the nave wall
  if (wing) {
    const left = wing.u1 <= 0.01
    const uo = left ? wing.u0 : wing.u1          // the outer wall
    const ui = left ? 0 : W                      // against the nave
    const of = Math.min(wing.o1, -0.3), ob = wing.o0
    const yIn = G + Y.leanIn, yOut = G + Y.leanOut
    const Ff = left ? frameOf(pt(F, uo, of), pt(F, ui, of)) : frameOf(pt(F, ui, of), pt(F, uo, of))
    const Fo = left ? frameOf(pt(F, uo, ob), pt(F, uo, of)) : frameOf(pt(F, uo, of), pt(F, uo, ob))
    const Fb = left ? frameOf(pt(F, ui, ob), pt(F, uo, ob)) : frameOf(pt(F, uo, ob), pt(F, ui, ob))
    const wl = Math.abs(uo - ui)
    // the front and back: a sloped top; the outer wall to the low eaves
    const yAt = (s: number, f: Fr) => (left === (f === Ff)) ? yOut + (yIn - yOut) * (s / wl) : yIn - (yIn - yOut) * (s / wl)
    for (const f of [Ff, Fb]) {
      const y0 = yAt(0, f), y1 = yAt(f.L, f)
      face(out, P(f, 0, 0, 0), P(f, f.L, 0, 0), P(f, f.L, 0, y1), P(f, 0, 0, y0), f === Ff ? WHITE : SHADOW, st)
    }
    panel(out, Fo, 0, Fo.L, 0, 0, yOut, WHITE, st)
    // its roof, out over the walls
    const Q = (u: number, o: number, y: number) => P(F, u, o, y)
    const ue = left ? uo - 0.5 : uo + 0.5
    const yl = yOut - 0.5 * (yIn - yOut) / wl
    if (left) {
      face(out, Q(ue, of + 0.5, yl), Q(ui, of + 0.5, yIn + 0.1), Q(ui, ob - 0.4, yIn + 0.1), Q(ue, ob - 0.4, yl), TILE, T.tile)
      face(out, Q(ue, ob - 0.4, yl - 0.06), Q(ui, ob - 0.4, yIn), Q(ui, of + 0.5, yIn), Q(ue, of + 0.5, yl - 0.06), TIMBER, T.wood)
    } else {
      face(out, Q(ui, of + 0.5, yIn + 0.1), Q(ue, of + 0.5, yl), Q(ue, ob - 0.4, yl), Q(ui, ob - 0.4, yIn + 0.1), TILE, T.tile)
      face(out, Q(ui, ob - 0.4, yIn), Q(ue, ob - 0.4, yl - 0.06), Q(ue, of + 0.5, yl - 0.06), Q(ui, of + 0.5, yIn), TIMBER, T.wood)
    }
    face(out, Q(left ? ue : ui, of + 0.5, (left ? yl : yIn + 0.1) - 0.2), Q(left ? ui : ue, of + 0.5, (left ? yIn + 0.1 : yl) - 0.2),
      Q(left ? ui : ue, of + 0.5, left ? yIn + 0.1 : yl), Q(left ? ue : ui, of + 0.5, left ? yl : yIn + 0.1), TIMBER, T.wood)
    // its front: an arched door on the outer side, a doorway up red steps by the nave, a dark plaque between
    const L = Ff.L
    const s = (k: number) => (left ? k : L - k)
    arch(out, Ff, s(Math.min(1.0, L * 0.22)), 0.03, G, 1.0, 2.5, DOOR, 6, T.wood)
    const dw = s(Math.max(L - 1.0, L * 0.75))
    panel(out, Ff, dw - 0.5, dw + 0.5, 0.03, G + 0.5, G + 2.8, DARK)
    panel(out, Ff, (s(Math.min(1.0, L * 0.22)) + dw) / 2 - 0.4, (s(Math.min(1.0, L * 0.22)) + dw) / 2 + 0.4, 0.03, G + 1.5, G + 2.3, DARK)
    for (let i = 0; i < 3; i++) slab(out, Ff, dw - 0.8, dw + 0.8, -0.05, 1.1 - i * 0.33, G - 0.4, G + ((i + 1) * 0.5) / 3, BRICK, T.brick)
  }
}

export const MISSION_DOLORES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Old Mission Dolores (way/256442765): the whitewashed adobe nave under its tile roof, the two-storey front of
   *  four columns and four pilasters, the timber balcony, the three bells, the cross, the lean-to at its side. */
  missionDolores,
}
