/**
 * Three neighbours of the Civic Center's east side, between Sixth/Seventh and Larkin, rebuilt by hand to City Hall's
 * standard (owner, 2026-10-21: "only City Hall looks right"). Each replaces a grammar box of the same builder name.
 *
 * SAINT BONIFACE (1900–02, rebuilt 1908), 133 Golden Gate Avenue (way/127740039). From Commons "San Francisco -
 * Saint Boniface church - 1.jpg" and "- 2.jpg" and Mapillary 221761650280416, 187264747193286, 1134200120634189:
 * a cream stucco Romanesque church, its street face (north, set back behind a forecourt) ONE tall central
 * campanile —
 *   - the shaft in stages parted by string courses on corbel tables, a triple window over the porch, a niche with
 *     the saint's statue under a little gable, a round rose window;
 *   - the belfry with paired round-arched louvred openings on each face, a gable on all four faces;
 *   - a rose-pink bell-shaped cupola, an open octagonal lantern, a pink spirelet and a cross (≈ 39 m);
 *   - two slender octagonal stair turrets flanking it, with pink bell caps and crosses;
 *   - the PINK PORCH at its foot: a steep gable, two round-arched doors between dark colonnettes, a cross;
 *   - behind, the body under a slate gable roof, its walls lit by tall round-arched windows in salmon surrounds
 *     under a corbelled cornice.
 *
 * ODD FELLOWS TEMPLE (1909), 26 Seventh Street at Market (way/35536533). From Mapillary 35536533-01/-02/-08: tan
 * brick and terracotta over a dark storefront base; a mezzanine of wide windows; pale giant pilasters parting
 * the bays; two rows of paired windows; then the TALL ROUND-ARCHED top storey, one great arch a bay; a frieze, the
 * heavy dark-green bracketed cornice and its cresting; the blue ODD FELLOWS blade on the Seventh Street face at
 * the Market corner. Seventh is the long street face (the edge next to the 3 m jog), Market the 21 m one.
 *
 * UC LAW SF PARKING GARAGE, 376 Larkin (way/387313434). From Mapillary 387313434-01/-02: a beige precast garage,
 * ground-floor shops, six open decks behind horizontal precast spandrels with vertical louvre slats in the
 * openings, piers rising past the parapet, and a GLASS STAIR TOWER on the chamfered corner. OSM's 46 m is twice
 * the building; it is built to the photo's ≈ 24 m.
 *
 * Every front is found on the real outline by its shape, never its compass direction or a fixed offset.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { boxAlong, offsetRing } from '../../parts.ts'
import { faceBand } from '../../tower.ts'
import { lathe } from '../../column.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Rgb } from '../../../models.ts'
import { sign } from '../../signage.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const T = {
  stucco: surfaceTag('stucco'), tile: surfaceTag('tile'), brick: surfaceTag('brick'), terracotta: surfaceTag('terracotta'),
  metal: surfaceTag('metal'), glass: surfaceTag('glass'), concrete: surfaceTag('concrete'), granite: surfaceTag('granite'),
}

// ------------------------------------------------------------------------------------------------ frames on a wall

/** A frame on a wall: origin `o`, unit direction along it (tx, tz), outward normal (nx, nz) = (tz, −tx). */
interface Fr { ox: number; oz: number; tx: number; tz: number; nx: number; nz: number; L: number }
const frame = (a: P2, b: P2): Fr => {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { ox: a.x, oz: a.z, tx, tz, nx: tz, nz: -tx, L }
}
const edgeFr = (ring: P2[], i: number): Fr => frame(ring[i], ring[(i + 1) % ring.length])
/** a point `u` along and `o` out (negative: into the building) */
const pt = (f: Fr, u: number, o: number): P2 => ({ x: f.ox + f.tx * u + f.nx * o, z: f.oz + f.tz * u + f.nz * o })
const P = (f: Fr, u: number, o: number, y: number): V3 => { const p = pt(f, u, o); return [p.x, y, p.z] }
const headingOf = (f: Fr): number => Math.atan2(f.nx, f.nz)

/**
 * The four sides of a box standing on frame `f` (u0..u1 along, o0..o1 out), each as a frame facing outward with
 * its origin at its left end seen from outside: front (+n), right (+t), back (−n), left (−t).
 */
function sidesOf(f: Fr, u0: number, u1: number, o0: number, o1: number): Fr[] {
  const mk = (p: P2, tx: number, tz: number, L: number): Fr => ({ ox: p.x, oz: p.z, tx, tz, nx: tz, nz: -tx, L })
  return [
    mk(pt(f, u0, o1), f.tx, f.tz, u1 - u0),
    mk(pt(f, u1, o1), -f.nx, -f.nz, o1 - o0),
    mk(pt(f, u1, o0), -f.tx, -f.tz, u1 - u0),
    mk(pt(f, u0, o0), f.nx, f.nz, o1 - o0),
  ]
}

/** a rectangle facing out, `o` proud of the frame's plane */
function rect(out: MeshBuilder, f: Fr, u0: number, u1: number, y0: number, y1: number, o: number, c: Rgb, tag = 0): void {
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], [f.nx, 0, f.nz], UV, c, tag)
}
/** a block in the frame: u0..u1 along, o0..o1 out, y0..y1 up */
function blk(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = 0): void {
  const m = pt(f, (u0 + u1) / 2, (o0 + o1) / 2)
  boxAlong(out, m.x, (y0 + y1) / 2, m.z, Math.abs(u1 - u0) / 2, (y1 - y0) / 2, Math.abs(o1 - o0) / 2, headingOf(f), c, tag)
}
/** a round-headed opening facing out: the jambs' rectangle and the head as a fan of slices */
function arch(out: MeshBuilder, f: Fr, u: number, y0: number, w: number, h: number, o: number, c: Rgb, tag = 0, n = 6): void {
  const spring = y0 + h - w / 2
  if (spring > y0) rect(out, f, u - w / 2, u + w / 2, y0, spring, o, c, tag)
  const c0 = P(f, u, o, spring)
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI - (i / n) * Math.PI
    const a1 = Math.PI - ((i + 1) / n) * Math.PI
    out.quad([c0, P(f, u + Math.cos(a0) * w / 2, o, spring + Math.sin(a0) * w / 2), P(f, u + Math.cos(a1) * w / 2, o, spring + Math.sin(a1) * w / 2), c0],
      [f.nx, 0, f.nz], UV, c, tag)
  }
}
/** a flat round disc facing out (a rose window, a clock, an oculus) */
function roundel(out: MeshBuilder, f: Fr, u: number, y: number, r: number, o: number, c: Rgb, tag = 0, n = 10): void {
  const c0 = P(f, u, o, y)
  for (let i = 0; i < n; i += 2) {
    const a = (k: number): V3 => P(f, u + Math.cos((k / n) * Math.PI * 2) * r, o, y + Math.sin((k / n) * Math.PI * 2) * r)
    out.quad([c0, a(i), a(i + 1), a(i + 2)], [f.nx, 0, f.nz], UV, c, tag)
  }
}
/** a gable standing on y0 across u0..u1, its face `o` out, `depth` deep back into the wall, rising `h` */
function gable(out: MeshBuilder, f: Fr, u0: number, u1: number, y0: number, h: number, o: number, depth: number, c: Rgb, tag = 0): void {
  const um = (u0 + u1) / 2
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, um, o, y0 + h), P(f, um, o, y0 + h)], [f.nx, 0, f.nz], UV, c, tag)
  const s = Math.hypot(h, (u1 - u0) / 2) || 1
  const up = (u1 - u0) / 2 / s
  const side = h / s
  out.quad([P(f, u0, o - depth, y0), P(f, u0, o, y0), P(f, um, o, y0 + h), P(f, um, o - depth, y0 + h)], [-f.tx * side, up, -f.tz * side], UV, c, tag)
  out.quad([P(f, u1, o, y0), P(f, u1, o - depth, y0), P(f, um, o - depth, y0 + h), P(f, um, o, y0 + h)], [f.tx * side, up, f.tz * side], UV, c, tag)
}
/**
 * A gabled roof on a rectangle of the frame (u0..u1, o0..o1) at y0, ridge `h` up, the ridge running along u:
 * two slopes and the two end triangles (`ends`: their colour, the wall's).
 */
function gableRoof(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, h: number, c: Rgb, ends: Rgb, tag = 0, endTag = 0): void {
  const om = (o0 + o1) / 2
  const half = (o1 - o0) / 2
  const s = Math.hypot(h, half) || 1
  const ny = half / s
  const nh = h / s
  out.quad([P(f, u1, o1, y0), P(f, u0, o1, y0), P(f, u0, om, y0 + h), P(f, u1, om, y0 + h)], [f.nx * nh, ny, f.nz * nh], UV, c, tag)
  out.quad([P(f, u0, o0, y0), P(f, u1, o0, y0), P(f, u1, om, y0 + h), P(f, u0, om, y0 + h)], [-f.nx * nh, ny, -f.nz * nh], UV, c, tag)
  out.quad([P(f, u0, o1, y0), P(f, u0, o0, y0), P(f, u0, om, y0 + h), P(f, u0, om, y0 + h)], [-f.tx, 0, -f.tz], UV, ends, endTag)
  out.quad([P(f, u1, o0, y0), P(f, u1, o1, y0), P(f, u1, om, y0 + h), P(f, u1, om, y0 + h)], [f.tx, 0, f.tz], UV, ends, endTag)
}
/**
 * A regular prism with one face turned to `heading` (0 = +z): the turrets' octagons, so a window on the face
 * toward the street sits flat on it. `r` is the corner radius; r1 the top's.
 */
function polyPrism(out: MeshBuilder, cx: number, cz: number, y0: number, y1: number, r: number, sides: number, heading: number, c: Rgb, tag = 0, r1 = r, cap = true): void {
  const ang = (i: number): number => heading + ((i - 0.5) / sides) * Math.PI * 2
  for (let i = 0; i < sides; i++) {
    const a0 = ang(i)
    const a1 = ang(i + 1)
    const am = heading + (i / sides) * Math.PI * 2
    out.quad([[cx + Math.sin(a0) * r, y0, cz + Math.cos(a0) * r], [cx + Math.sin(a1) * r, y0, cz + Math.cos(a1) * r],
      [cx + Math.sin(a1) * r1, y1, cz + Math.cos(a1) * r1], [cx + Math.sin(a0) * r1, y1, cz + Math.cos(a0) * r1]],
    [Math.sin(am), (r - r1) / Math.max(0.01, y1 - y0), Math.cos(am)], UV, c, tag)
  }
  if (!cap || r1 < 0.01) return
  for (let i = 0; i < sides; i += 2) {
    const p = (k: number): V3 => [cx + Math.sin(ang(k)) * r1, y1, cz + Math.cos(ang(k)) * r1]
    out.quad([p(i), p(i + 1), p(i + 2), [cx, y1, cz]], [0, 1, 0], UV, c, tag)
  }
}
/** a Latin cross standing at (x, y0, z), turned to face `heading` */
function cross(out: MeshBuilder, x: number, z: number, y0: number, h: number, heading: number, c: Rgb, tag = 0): void {
  const w = h * 0.07
  boxAlong(out, x, y0 + h / 2, z, w, h / 2, w, heading, c, tag)
  boxAlong(out, x, y0 + h * 0.7, z, h * 0.28, w, w, heading, c, tag)
}

// ------------------------------------------------------------------------------------------------- the outline

/** the real outline when the loader gave one (anticlockwise, lightly simplified), else the fitted box */
function outline(fit: Fit, tol: number): P2[] {
  let r: P2[] = fit.ring && fit.ring.length >= 3 ? simplifyRing(fit.ring, tol) : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  // drop near-duplicate points
  r = r.filter((p, i) => { const q = r[(i + 1) % r.length]; return Math.hypot(q.x - p.x, q.z - p.z) > 0.15 })
  let area = 0
  for (let i = 0; i < r.length; i++) { const a = r[i]; const b = r[(i + 1) % r.length]; area += a.x * b.z - b.x * a.z }
  return area >= 0 ? r : [...r].reverse()
}
const lenOf = (ring: P2[], i: number): number => {
  const n = ring.length
  const a = ring[((i % n) + n) % n]
  const b = ring[(((i + 1) % n) + n) % n]
  return Math.hypot(b.x - a.x, b.z - a.z)
}
const longestOf = (ring: P2[]): number => {
  let best = 0
  for (let i = 1; i < ring.length; i++) if (lenOf(ring, i) > lenOf(ring, best)) best = i
  return best
}
/** the ring pushed `d` metres out (a skin over the walls, never in their plane) */
const skin = (ring: P2[], d: number): P2[] => offsetRing(ring, d)

// =========================================================================================== SAINT BONIFACE

const CREAM: Rgb = [0.97, 0.92, 0.72]
const CREAM_SHADE: Rgb = [0.86, 0.8, 0.62]
const SALMON: Rgb = [0.86, 0.6, 0.55]
const SALMON_DEEP: Rgb = [0.74, 0.48, 0.45]
const ROSE: Rgb = [0.78, 0.5, 0.48]
const SLATE: Rgb = [0.38, 0.37, 0.39]
const CHURCH_GLASS: Rgb = [0.2, 0.17, 0.17]
const IRON: Rgb = [0.2, 0.21, 0.22]

function saintBoniface(out: MeshBuilder, fit: Fit): void {
  const ring = outline(fit, 0.35)
  const n = ring.length
  // the back wall: the longest edge (the 37 m south wall); the street lies the other way
  const bi = longestOf(ring)
  const B = edgeFr(ring, bi)
  const depth = (p: P2): number => -((p.x - B.ox) * B.nx + (p.z - B.oz) * B.nz)   // metres in from the back wall
  // the facade: the forward-most long edge facing away from the back wall
  let fi = -1
  let far = -Infinity
  for (let i = 0; i < n; i++) {
    const e = edgeFr(ring, i)
    if (e.L < 9 || e.nx * B.nx + e.nz * B.nz > -0.9) continue
    const d = depth(pt(e, e.L / 2, 0))
    if (d > far) { far = d; fi = i }
  }
  if (fi < 0) fi = (bi + Math.floor(n / 2)) % n
  const F = edgeFr(ring, fi)
  const D = depth(pt(F, F.L / 2, 0))
  const EAVES = 14
  const ROOF_H = 6.2

  // ---- the body: cream stucco walls, a grey socle, a corbelled cornice, the slate roof
  faceBand(out, ring, 1.1, EAVES, { kind: 'blank', wall: CREAM, material: 'stucco' })
  faceBand(out, ring, 0, 1.1, { kind: 'blank', wall: [0.62, 0.6, 0.56], material: 'granite' })
  faceBand(out, skin(ring, 0.25), EAVES - 0.75, EAVES - 0.35, { kind: 'blank', wall: CREAM_SHADE, material: 'stucco' })
  faceBand(out, skin(ring, 0.4), EAVES - 0.35, EAVES, { kind: 'blank', wall: CREAM, material: 'stucco' })
  capPolygon(out, ring, EAVES, SLATE, T.tile)
  // the nave's gable roof, its ridge along the back wall, over the body behind the tower block
  const tower0 = D - 6.2
  gableRoof(out, B, 0.4, B.L - 0.4, -Math.max(8, tower0 - 0.3), -0.4, EAVES, ROOF_H, SLATE, CREAM, T.tile, T.stucco)

  // the tall round-arched windows of the body, in salmon surrounds, and small ones under them
  for (let i = 0; i < n; i++) {
    if (i === fi) continue
    const e = edgeFr(ring, i)
    if (e.L < 4.5) continue
    const k = Math.max(1, Math.floor(e.L / 4.6))
    const step = e.L / k
    for (let j = 0; j < k; j++) {
      const u = step * (j + 0.5)
      arch(out, e, u, 5.2, 2.1, 6.6, 0.03, SALMON, T.stucco)
      arch(out, e, u, 5.5, 1.5, 6.0, 0.06, CHURCH_GLASS, T.glass)
      arch(out, e, u, 1.8, 0.9, 1.9, 0.04, CHURCH_GLASS, T.glass, 4)
    }
  }

  // ---- the street front on F: the campanile in the middle, a turret either side, the porch at its foot
  const uc = F.L / 2
  const hw = Math.min(3.5, F.L * 0.23)
  const tf = 0.5        // the tower stands this far proud of the facade line
  const tb = -6.2       // and runs this far back
  const oc = (tf + tb) / 2
  const tc = pt(F, uc, oc)
  const H = headingOf(F)
  // the facade wall between the features, up to the body's eaves, with a band of corbels
  blk(out, F, 0, F.L, -0.6, 0.05, 0, EAVES + 1.2, CREAM, T.stucco)
  // the shaft
  blk(out, F, uc - hw, uc + hw, tb, tf, 0, 19.6, CREAM, T.stucco)
  // its corner pilasters (front) and the string courses round it, each over a row of corbels
  for (const s of [-1, 1]) blk(out, F, uc + s * (hw - 0.3) - 0.3, uc + s * (hw - 0.3) + 0.3, tf - 0.1, tf + 0.22, 0, 19.6, CREAM, T.stucco)
  for (const y of [11.4, 15.8, 19.3]) {
    blk(out, F, uc - hw - 0.15, uc + hw + 0.15, tb - 0.15, tf + 0.35, y, y + 0.35, CREAM_SHADE, T.stucco)
    for (const side of sidesOf(F, uc - hw, uc + hw, tb, tf)) {
      if (side.nx * F.nx + side.nz * F.nz < -0.5) continue   // not on the back
      const k = Math.floor((side.L - 0.6) / 0.75)
      for (let j = 0; j < k; j++) {
        const u = 0.3 + (side.L - 0.6) * (j + 0.5) / k
        blk(out, side, u - 0.13, u + 0.13, 0, 0.22, y - 0.38, y, CREAM_SHADE, T.stucco)
      }
    }
  }
  const front = sidesOf(F, uc - hw, uc + hw, tb, tf)[0]
  const fu = (u: number): number => u - (uc - hw)     // F's u to the tower front's
  // the triple window over the porch, and the cross between it and the porch's gable
  for (const d of [-1.05, 0, 1.05]) arch(out, front, fu(uc + d), 9.1, 0.62, 1.9, 0.24, CHURCH_GLASS, T.glass, 4)
  // the niche with the saint under its little gable, flanked by two narrow windows
  arch(out, front, fu(uc), 12.3, 1.3, 2.9, 0.24, CREAM_SHADE, T.stucco)
  arch(out, front, fu(uc), 12.5, 0.9, 2.4, 0.26, [0.3, 0.3, 0.3], T.stucco)
  gable(out, front, fu(uc - 0.85), fu(uc + 0.85), 15.2, 0.6, 0.4, 0.2, CREAM_SHADE, T.stucco)
  for (const s of [-1, 1]) arch(out, front, fu(uc + s * 2.1), 12.4, 0.52, 2.6, 0.24, CHURCH_GLASS, T.glass, 4)
  // the rose window
  roundel(out, front, fu(uc), 17.55, 1.3, 0.25, SALMON_DEEP, T.stucco, 12)
  roundel(out, front, fu(uc), 17.55, 1.0, 0.27, [0.32, 0.18, 0.18], T.glass, 12)
  // the belfry: a little narrower, paired louvred arches on every face, a corbel cornice, a gable each side
  const bw = hw - 0.3
  blk(out, F, uc - bw, uc + bw, tb + 0.3, tf - 0.3, 19.65, 25.2, CREAM, T.stucco)
  blk(out, F, uc - bw - 0.25, uc + bw + 0.25, tb + 0.05, tf - 0.05, 25.0, 25.4, CREAM_SHADE, T.stucco)
  const belfry = sidesOf(F, uc - bw, uc + bw, tb + 0.3, tf - 0.3)
  for (const side of belfry) {
    for (const s of [-1, 1]) {
      arch(out, side, side.L / 2 + s * 0.85, 20.9, 1.25, 3.2, 0.02, SALMON_DEEP, T.stucco)
      arch(out, side, side.L / 2 + s * 0.85, 21.1, 0.95, 2.85, 0.04, [0.24, 0.17, 0.15], T.glass)
    }
    gable(out, side, -0.2, side.L + 0.2, 25.4, 2.9, 0.2, side.L / 2, CREAM, T.stucco)
    roundel(out, side, side.L / 2, 26.5, 0.32, 0.22, CHURCH_GLASS, T.glass, 8)
  }
  // the bell-shaped cupola, the open lantern, the spirelet and the cross
  const rr = bw * 0.94
  lathe(out, tc.x, tc.z, [[rr * 0.92, 25.4], [rr, 26.6], [rr * 1.03, 27.7], [rr * 0.92, 28.9], [rr * 0.66, 30.1], [rr * 0.36, 31.0], [0.9, 31.3]], 16, ROSE, T.tile)
  prism8(out, tc.x, tc.z, 31.3, 31.7, 1.05, H, CREAM)
  polyPrism(out, tc.x, tc.z, 31.7, 33.7, 0.7, 8, H, [0.22, 0.2, 0.2], 0)
  for (let k = 0; k < 8; k++) {
    const a = H + ((k + 0.5) / 8) * Math.PI * 2
    boxAlong(out, tc.x + Math.sin(a) * 0.9, 32.7, tc.z + Math.cos(a) * 0.9, 0.13, 1.0, 0.13, a, CREAM, T.stucco)
  }
  prism8(out, tc.x, tc.z, 33.7, 34.1, 1.08, H, CREAM)
  polyPrism(out, tc.x, tc.z, 34.1, 37.4, 1.0, 8, H, ROSE, T.tile, 0.04)
  cross(out, tc.x, tc.z, 37.3, 1.9, H, IRON, T.metal)

  // the turrets: slender octagons either side of the tower, rings at the string courses, slit windows, pink caps
  const tr = Math.min(1.7, Math.max(1.1, (F.L / 2 - hw) / 2 - 0.05))
  for (const s of [-1, 1]) {
    const u = uc + s * (hw + tr + 0.05)
    const c = pt(F, u, -tr + 0.3)
    polyPrism(out, c.x, c.z, 0, 20.0, tr, 8, H, CREAM, T.stucco)
    for (const y of [11.4, 15.8]) polyPrism(out, c.x, c.z, y, y + 0.3, tr + 0.14, 8, H, CREAM_SHADE, T.stucco)
    polyPrism(out, c.x, c.z, 19.5, 20.0, tr + 0.22, 8, H, CREAM_SHADE, T.stucco)
    const apothem = tr * Math.cos(Math.PI / 8)
    const tf8: Fr = { ...front, ox: c.x + F.nx * apothem - F.tx * 0.5, oz: c.z + F.nz * apothem - F.tz * 0.5, L: 1 }
    for (const y of [4.2, 8.0, 12.6, 16.6]) arch(out, tf8, 0.5, y, 0.5, y > 15 ? 2.3 : 2.0, 0.03, CHURCH_GLASS, T.glass, 4)
    lathe(out, c.x, c.z, [[tr * 1.05, 20.0], [tr * 1.1, 20.8], [tr * 0.95, 21.8], [tr * 0.62, 22.8], [tr * 0.32, 23.7], [0.05, 24.6]], 12, ROSE, T.tile)
    cross(out, c.x, c.z, 24.5, 1.5, H, IRON, T.metal)
  }

  // the porch: pink, a steep gable, two round-arched doors between dark colonnettes, a cross on the apex
  const pw = Math.min(3.4, hw - 0.3)
  const p0 = tf
  const p1 = tf + 2.2
  blk(out, F, uc - pw, uc + pw, p0 - 0.1, p1, 0, 6.0, SALMON, T.stucco)
  gableRoofAcross(out, F, uc - pw - 0.15, uc + pw + 0.15, p0 - 0.1, p1 + 0.15, 6.0, 4.4, SALMON_DEEP, SALMON)
  const porch = sidesOf(F, uc - pw, uc + pw, p0, p1)[0]
  gable(out, porch, 0.9, porch.L - 0.9, 6.25, 3.1, 0.18, 0.05, [0.9, 0.7, 0.64], T.stucco)
  for (const s of [-1, 1]) {
    arch(out, porch, porch.L / 2 + s * 1.45, 0.2, 2.3, 4.9, 0.02, SALMON_DEEP, T.stucco)
    arch(out, porch, porch.L / 2 + s * 1.45, 0.2, 1.7, 4.2, 0.05, [0.14, 0.12, 0.11], T.glass)
  }
  roundel(out, porch, porch.L / 2, 5.2, 0.45, 0.04, [0.3, 0.26, 0.24], T.stucco, 8)
  for (const d of [-pw + 0.35, 0, pw - 0.35]) {
    const c = pt(F, uc + d, p1 + 0.25)
    polyPrism(out, c.x, c.z, 0, 3.6, 0.18, 6, H, [0.26, 0.27, 0.28], T.granite)
  }
  const apex = pt(F, uc, p1 + 0.1)
  cross(out, apex.x, apex.z, 10.3, 1.3, H, IRON, T.metal)
}

/** a short octagonal ring (a cornice round the lantern) */
function prism8(out: MeshBuilder, x: number, z: number, y0: number, y1: number, r: number, heading: number, c: Rgb): void {
  polyPrism(out, x, z, y0, y1, r, 8, heading, c, T.stucco)
}

/** a gabled roof whose ridge runs OUT from the wall (a porch's): the frame turned a quarter */
function gableRoofAcross(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, h: number, c: Rgb, ends: Rgb): void {
  // the left side's frame: along it runs out from the wall, its normal is −t
  const side = sidesOf(f, u0, u1, o0, o1)[3]
  // in the side frame u runs o0→o1 and "out" is toward −t (u decreasing), so the rectangle is o ∈ [−(u1−u0), 0]
  gableRoof(out, side, 0, o1 - o0, -(u1 - u0), 0, y0, h, c, ends, T.tile, T.stucco)
}

// =========================================================================================== ODD FELLOWS TEMPLE

const TAN: Rgb = [0.68, 0.6, 0.48]
const PILASTER: Rgb = [0.79, 0.73, 0.61]
const OF_GREEN: Rgb = [0.17, 0.25, 0.23]
const OF_GLASS: Rgb = [0.16, 0.18, 0.21]

function oddFellowsTemple(out: MeshBuilder, fit: Fit): void {
  const ring = outline(fit, 0.3)
  const n = ring.length
  /*
   * The plan is a near-rectangle whose opposite sides match to 0.2 m, so no length tells the streets apart. What
   * does is OSM's extra vertex on the Seventh Street wall, 3.3 m from its far (south-east) end, where the
   * neighbour meets it: a straight-through vertex the simplified ring drops, so it is looked for on the raw
   * outline. Seventh is the long wall through it; Market the wall at Seventh's OTHER end. On a bare box, the
   * longest edge and the one after it.
   */
  let seventh = -1
  let jog: P2 | null = null
  const raw = outline({ ...fit, ring: fit.ring }, 0)
  for (let i = 0; i < raw.length && fit.ring; i++) {
    const a = edgeFr(raw, i)
    const b = edgeFr(raw, (i + 1) % raw.length)
    if (a.tx * b.tx + a.tz * b.tz < 0.995) continue
    if ((a.L < 6 && b.L > 25) || (b.L < 6 && a.L > 25)) jog = raw[(i + 1) % raw.length]
  }
  if (jog) {
    let best = Infinity
    for (let i = 0; i < n; i++) {
      const e = edgeFr(ring, i)
      if (e.L < 25) continue
      const d = Math.abs((jog.x - e.ox) * e.nx + (jog.z - e.oz) * e.nz)
      if (d < best) { best = d; seventh = i }
    }
  }
  let market: number
  if (seventh >= 0) {
    const e = edgeFr(ring, seventh)
    const along = (jog!.x - e.ox) * e.tx + (jog!.z - e.oz) * e.tz
    // the jog is near Seventh's far end; Market meets the near one
    market = along > e.L / 2 ? (seventh - 1 + n) % n : (seventh + 1) % n
  } else { seventh = longestOf(ring); market = (seventh + 1) % n }
  const streets = new Set([seventh, market])
  const GROUND = 5.2
  const MEZZ = 9.4
  const ARCH0 = 18.2
  const FRIEZE = 24.4
  const CORNICE = 25.0
  const TOP = 26.3

  // the side walls (party walls toward the alley and the neighbour): plain tan brick, a few windows
  const rest = ring.map((_, i) => i).filter((i) => !streets.has(i))
  faceBand(out, ring, 0, GROUND, { kind: 'blank', wall: [0.5, 0.45, 0.38], material: 'brick' }, rest)
  faceBand(out, ring, GROUND, CORNICE, { kind: 'punched', wall: TAN, glass: OF_GLASS, pitch: 4.2, solid: 0.6, floor: 4.6, material: 'brick' }, rest)
  // the street walls: the tan body behind the pilasters
  faceBand(out, ring, GROUND, CORNICE, { kind: 'blank', wall: TAN, material: 'brick' }, [...streets])
  capPolygon(out, ring, TOP, [0.42, 0.42, 0.4], T.concrete)

  for (const i of streets) {
    const e = edgeFr(ring, i)
    // the storefronts: dark glass in dark green frames under a fascia
    rect(out, e, 0, e.L, 0, GROUND, 0, [0.12, 0.17, 0.16], T.metal)
    const shops = Math.max(2, Math.round(e.L / 4.5))
    for (let k = 0; k < shops; k++) {
      const a = (e.L * k) / shops
      const b = (e.L * (k + 1)) / shops
      rect(out, e, a + 0.35, b - 0.35, 0.4, GROUND - 1.0, 0.04, [0.2, 0.24, 0.27], T.glass)
    }
    blk(out, e, -0.1, e.L + 0.1, 0, 0.25, GROUND - 0.8, GROUND, OF_GREEN, T.metal)
    // the bays, parted by pale giant pilasters
    const bays = Math.max(2, Math.round(e.L / 5.3))
    const bw = e.L / bays
    for (let k = 0; k <= bays; k++) {
      const u = bw * k
      const w = k === 0 || k === bays ? 0.75 : 0.5
      blk(out, e, Math.max(0, u - w), Math.min(e.L, u + w), 0, 0.28, MEZZ, FRIEZE, PILASTER, T.terracotta)
    }
    // the belt over the mezzanine and the frieze under the cornice
    blk(out, e, 0, e.L, 0, 0.3, MEZZ - 0.1, MEZZ + 0.35, [0.72, 0.66, 0.54], T.terracotta)
    blk(out, e, 0, e.L, 0, 0.32, FRIEZE, CORNICE, PILASTER, T.terracotta)
    for (let k = 0; k < bays; k++) {
      const u = bw * (k + 0.5)
      const inner = bw - 1.2
      // the mezzanine: one wide window, two mullions
      rect(out, e, u - inner / 2, u + inner / 2, GROUND + 0.6, MEZZ - 0.5, 0.03, OF_GLASS, T.glass)
      for (const d of [-inner / 6, inner / 6]) rect(out, e, u + d - 0.07, u + d + 0.07, GROUND + 0.6, MEZZ - 0.5, 0.05, TAN, T.brick)
      // the bay's tall recess: a dark-framed column of windows rising into the arch, dark spandrels between
      const aw = Math.min(2.8, bw * 0.56)
      rect(out, e, u - aw / 2 - 0.15, u + aw / 2 + 0.15, 10.2, ARCH0 + 0.3, 0.02, [0.27, 0.26, 0.23], T.metal)
      for (const y of [10.6, 14.3]) {
        rect(out, e, u - aw / 2, u + aw / 2, y, y + 2.9, 0.04, OF_GLASS, T.glass)
        rect(out, e, u - 0.06, u + 0.06, y, y + 2.9, 0.06, [0.27, 0.26, 0.23], T.metal)          // the mullion
        rect(out, e, u - aw / 2 - 0.3, u + aw / 2 + 0.3, y - 0.25, y - 0.05, 0.07, PILASTER, T.terracotta)   // the sill
      }
      // the great arch of the top storey, in a pale surround, a transom across it
      arch(out, e, u, ARCH0, aw + 0.5, FRIEZE - ARCH0 - 0.25, 0.03, PILASTER, T.terracotta)
      arch(out, e, u, ARCH0 + 0.2, aw, FRIEZE - ARCH0 - 0.6, 0.06, OF_GLASS, T.glass)
      rect(out, e, u - aw / 2, u + aw / 2, ARCH0 + 2.4, ARCH0 + 2.6, 0.08, OF_GREEN, T.metal)
      // the small square panels between the arch heads
      if (k > 0) rect(out, e, bw * k - 0.4, bw * k + 0.4, 22.3, 23.1, 0.3, TAN, T.brick)
    }
    // the heavy dark-green cornice on its brackets, and the cresting over it
    blk(out, e, -0.8, e.L + 0.8, 0, 1.55, CORNICE + 0.35, TOP, OF_GREEN, T.metal)
    blk(out, e, -0.3, e.L + 0.3, 0, 0.55, CORNICE, CORNICE + 0.35, OF_GREEN, T.metal)
    const nb = Math.round(e.L / 1.3)
    for (let k = 0; k <= nb; k++) {
      const u = (e.L * k) / nb
      blk(out, e, u - 0.16, u + 0.16, 0.32, 1.35, CORNICE - 0.5, CORNICE + 0.35, OF_GREEN, T.metal)
    }
    blk(out, e, -0.4, e.L + 0.4, 0.5, 0.75, TOP, TOP + 0.75, OF_GREEN, T.metal)
    for (let k = 0; k <= bays; k++) blk(out, e, bw * k - 0.35, bw * k + 0.35, 0.4, 0.85, TOP, TOP + 1.15, OF_GREEN, T.metal)
  }

  // the blade: blue, ODD FELLOWS down both faces, on Seventh at the Market corner
  const e = edgeFr(ring, seventh)
  const atStart = (market + 1) % n === seventh
  const u = atStart ? 1.3 : e.L - 1.3
  const y0 = GROUND + 1.0
  const y1 = 21.5
  const depth = 1.25
  const t = 0.38
  blk(out, e, u - t / 2, u + t / 2, 0.3, 0.3 + depth, y0, y1, [0.1, 0.19, 0.42], T.metal)
  blk(out, e, u - 0.06, u + 0.06, 0, 0.32, y0 + 0.5, y0 + 0.7, IRON, T.metal)
  blk(out, e, u - 0.06, u + 0.06, 0, 0.32, y1 - 0.7, y1 - 0.5, IRON, T.metal)
  for (const s of [-1, 1]) {
    const p = pt(e, u + s * (t / 2 + 0.02), 0.3 + depth / 2)
    sign(out, { type: 'flat', text: 'ODD FELLOWS', h: Math.min(depth * 0.7, (y1 - y0 - 1.2) / (11 * 1.35)), face: 'grotesque', weight: 'bold', colour: [0.94, 0.94, 0.96], vertical: true, lit: 'self' },
      { x: p.x, y: (y0 + y1) / 2, z: p.z, heading: Math.atan2(e.tx * s, e.tz * s) })
  }
}

// =========================================================================================== UC LAW GARAGE

const PRECAST: Rgb = [0.86, 0.79, 0.65]
const PRECAST_SHADE: Rgb = [0.72, 0.67, 0.56]
const DECK_DARK: Rgb = [0.2, 0.2, 0.2]
const STAIR_GLASS: Rgb = [0.72, 0.84, 0.82]

function ucLawGarage(out: MeshBuilder, fit: Fit): void {
  const ring = outline(fit, 0.4)
  const n = ring.length
  // the stair tower's corner: a chamfer of 4–9 m between two long walls; on a bare box, none
  let stair = -1
  for (let i = 0; i < n; i++) {
    const L = lenOf(ring, i)
    if (L > 4 && L < 9.5 && lenOf(ring, i - 1) > 15 && lenOf(ring, i + 1) > 15) stair = i
  }
  const GROUND = 4.6
  const DECK = 3.15
  const DECKS = 6
  const ROOF = GROUND + DECK * DECKS         // 23.5
  const PARAPET = ROOF + 1.0
  const walls = ring.map((_, i) => i).filter((i) => i !== stair)

  // the ground floor: shops behind a precast frame on a stone base
  faceBand(out, ring, 0, GROUND, { kind: 'curtain', wall: PRECAST, glass: [0.24, 0.27, 0.29], pitch: 4.2, floor: GROUND, material: 'concrete' }, walls)
  // the open decks: the dark interior behind, louvre slats, then the precast spandrels proud of them
  faceBand(out, offsetRing(ring, -0.45), GROUND, PARAPET, { kind: 'blank', wall: DECK_DARK, material: 'concrete' }, walls)
  capPolygon(out, ring, ROOF, [0.5, 0.5, 0.49], T.concrete)
  for (const i of walls) {
    const e = edgeFr(ring, i)
    if (e.L < 1) continue
    // the slats, full height in one quad each, between the spandrels
    const k = Math.floor(e.L / 0.8)
    for (let j = 1; j < k; j++) {
      const u = (e.L * j) / k
      rect(out, e, u - 0.09, u + 0.09, GROUND, ROOF, -0.25, [0.62, 0.6, 0.55], T.metal)
    }
    // the spandrels: one per deck and the parapet
    for (let d = 1; d <= DECKS; d++) {
      const y = GROUND + DECK * d
      blk(out, e, 0, e.L, -0.4, 0.05, y - 1.0, d === DECKS ? PARAPET : y + 0.05, PRECAST, T.concrete)
    }
    blk(out, e, 0, e.L, -0.45, 0.08, GROUND - 0.5, GROUND + 0.15, PRECAST, T.concrete)
    // the piers, proud and running past the parapet with a stepped head
    const piers = Math.max(1, Math.round(e.L / 8.5))
    for (let j = 0; j <= piers; j++) {
      const u = Math.min(e.L - 0.5, Math.max(0.5, (e.L * j) / piers))
      blk(out, e, u - 0.5, u + 0.5, -0.45, 0.4, GROUND - 0.5, PARAPET + 0.9, PRECAST, T.concrete)
      blk(out, e, u - 0.32, u + 0.32, -0.45, 0.25, PARAPET + 0.9, PARAPET + 1.5, PRECAST, T.concrete)
    }
  }
  // the vehicle entrance on the longest wall: a dark opening under a band
  const li = longestOf(ring)
  if (li !== stair) {
    const e = edgeFr(ring, li)
    rect(out, e, e.L * 0.62, e.L * 0.62 + 7, 0, GROUND - 0.6, 0.06, [0.1, 0.1, 0.11], T.concrete)
  }

  // the glass stair tower on the chamfered corner, from over the ground floor to above the roof
  if (stair >= 0) {
    const e = edgeFr(ring, stair)
    const top = PARAPET + 2.2
    blk(out, e, -0.8, e.L + 0.8, -1.0, 1.6, GROUND - 0.6, top, STAIR_GLASS, T.glass)
    // its fine grid: a mullion a metre and a half, a transom a storey
    const k = Math.max(2, Math.round(e.L / 1.5))
    for (let j = 0; j <= k; j++) {
      const u = -0.8 + ((e.L + 1.6) * j) / k
      rect(out, e, u - 0.05, u + 0.05, GROUND - 0.6, top, 1.63, [0.78, 0.8, 0.78], T.metal)
    }
    for (let y = GROUND + DECK * 0.5; y < top; y += DECK) rect(out, e, -0.8, e.L + 0.8, y - 0.06, y + 0.06, 1.63, [0.78, 0.8, 0.78], T.metal)
    blk(out, e, -0.95, e.L + 0.95, -1.1, 1.75, top, top + 0.35, PRECAST, T.concrete)
    // the entrance canopy and doors beneath it
    blk(out, e, -0.6, e.L + 0.6, 0, 2.2, 3.4, 3.65, [0.75, 0.76, 0.75], T.metal)
    rect(out, e, -0.8, e.L + 0.8, 0, GROUND - 0.5, 0, PRECAST_SHADE, T.concrete)
    rect(out, e, 0.6, e.L - 0.6, 0, 3.3, 0.04, [0.22, 0.26, 0.28], T.glass)
  }
}

export const SIXTH_STREET: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  saintBoniface,
  oddFellowsTemple,
  b4_garage_387313434: ucLawGarage,
}
