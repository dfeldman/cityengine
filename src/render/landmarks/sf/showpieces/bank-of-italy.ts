/**
 * The Bank of Italy Building, 552 Montgomery Street at Clay (1908): A.P. Giannini's bank, later Bank of America's
 * first head office, a block south of the Transamerica Pyramid. From the Mapillary frames in
 * refs/way-256068381/ (01 looks up the Clay front from across Clay, 02 the Montgomery/Clay corner), 2026-10-21.
 *
 * A pale granite and terracotta Renaissance Revival tower of ten storeys on a corner lot. Both street fronts are
 * dressed alike, bay for bay; the two lot-line walls behind are plain. From the pavement up:
 *  - the BANKING HALL: a two-storey rusticated granite base of tall round ARCHES, one a bay, each in a ring of
 *    voussoirs with a keystone and a deep reveal, the glazing behind with its transom;
 *  - a modillioned belt cornice; the third storey, still rusticated, a smaller round-arched window a bay;
 *  - a balcony course with a short balustrade under each window of the fourth storey;
 *  - the SHAFT: five storeys of broad mullioned windows in moulded surrounds, alternate floors with hoods and
 *    keystones, the whole wall channelled in horizontal courses, quoins up the corners, a string course under
 *    the eighth storey and balconettes at its sills;
 *  - the CROWN: a storey of round-arched windows between pilasters, a frieze with a small attic window a bay
 *    between wreathed medallions and swags, and the heavy projecting modillioned CORNICE.
 *
 * The frame: the real outline as given. The Montgomery front is its longest edge; the Clay front is the longer
 * of that edge's two neighbours (the other is the 3 m stub of the lot's back corner). Each front is laid out in
 * its own edge frame: u along it, o out of it (negative into the building), y up.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const T = { granite: surfaceTag('granite'), terracotta: surfaceTag('terracotta'), stucco: surfaceTag('stucco'), metal: surfaceTag('metal') }

// warm pale grey granite in the base, the terracotta above a shade creamier (frames 01, 02)
const GRANITE: Rgb = [0.74, 0.73, 0.69]
const TERRA: Rgb = [0.81, 0.79, 0.73]
const TRIM: Rgb = [0.77, 0.75, 0.69]
const VOUSSOIR: Rgb = [0.7, 0.69, 0.65]
const JOINT: Rgb = [0.55, 0.54, 0.51]
const SHADE: Rgb = [0.6, 0.59, 0.56]
const REVEAL: Rgb = [0.4, 0.4, 0.39]
const GLASS: Rgb = [0.19, 0.21, 0.24]
const SASH: Rgb = [0.62, 0.61, 0.58]
const PLAIN: Rgb = [0.72, 0.7, 0.65]
const ROOF: Rgb = [0.48, 0.48, 0.47]

/** The heights at 35 m (OSM's); everything scales with the entry's height. */
const H0 = {
  plinth: 0.9,
  base: 9.0,       // top of the rusticated banking hall
  belt: 9.7,       // top of the belt cornice over it
  s3: 13.1,        // top of the arched third storey
  balc: 13.6,      // top of the balcony course
  floor: 3.0,      // the shaft's storey
  shaft: 28.6,     // top of the shaft (five storeys)
  course: 29.0,    // the string course under the arched storey
  arches: 31.7,    // top of the arched storey
  frieze: 33.7,    // top of the frieze: the cornice starts
  top: 35.0,
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

/** A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up (`bottom` false drops the underside). */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, bottom = true): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], [f.nx, 0, f.nz], UV, c, tag)
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
function arch(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, w: number, h: number, c: Rgb, seg = 6, tag = FIXED): void {
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

/** A disc on the wall: a medallion or wreath, `seg` fan quads. */
function roundel(out: MeshBuilder, f: Fr, u: number, o: number, y: number, r: number, c: Rgb, seg = 4): void {
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2
    const a1 = ((i + 0.5) / seg) * Math.PI * 2
    const a2 = ((i + 1) / seg) * Math.PI * 2
    out.quad([P(f, u, o, y), P(f, u + Math.cos(a0) * r, o, y + Math.sin(a0) * r), P(f, u + Math.cos(a1) * r, o, y + Math.sin(a1) * r), P(f, u + Math.cos(a2) * r, o, y + Math.sin(a2) * r)],
      [f.nx, 0, f.nz], UV, c, FIXED)
  }
}

/** A thin radial joint of an arch's voussoirs, at angle `a` from the springing centre, `r0..r1` out. */
function voussoirJoint(out: MeshBuilder, f: Fr, u: number, o: number, cy: number, r0: number, r1: number, a: number, c: Rgb): void {
  const d0 = 0.05 / r0
  const d1 = 0.05 / r1
  out.quad([P(f, u + Math.cos(a + d0) * r0, o, cy + Math.sin(a + d0) * r0), P(f, u + Math.cos(a - d0) * r0, o, cy + Math.sin(a - d0) * r0),
    P(f, u + Math.cos(a - d1) * r1, o, cy + Math.sin(a - d1) * r1), P(f, u + Math.cos(a + d1) * r1, o, cy + Math.sin(a + d1) * r1)],
  [f.nx, 0, f.nz], UV, c, FIXED)
}

/** A swag hung between two points along the frieze: a band sagging `sag` in the middle, in four pieces. */
function swag(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y: number, sag: number, c: Rgb): void {
  const n = 4
  const at = (k: number): [number, number] => {
    const t = k / n
    return [u0 + (u1 - u0) * t, y - sag * 4 * t * (1 - t)]
  }
  for (let k = 0; k < n; k++) {
    const [ua, ya] = at(k)
    const [ub, yb] = at(k + 1)
    const ta = 0.12 + 0.14 * Math.sin((k / n) * Math.PI)
    const tb = 0.12 + 0.14 * Math.sin(((k + 1) / n) * Math.PI)
    out.quad([P(f, ua, o, ya - ta), P(f, ub, o, yb - tb), P(f, ub, o, yb + 0.08), P(f, ua, o, ya + 0.08)], [f.nx, 0, f.nz], UV, c, FIXED)
  }
}

/** A short balustrade on the wall: base, rail, the shade behind and the balusters as pale strips. */
function balustrade(out: MeshBuilder, f: Fr, u0: number, u1: number, y0: number, y1: number, proj: number): void {
  slab(out, f, u0 - 0.1, u1 + 0.1, 0, proj + 0.05, y0 - 0.15, y0, TRIM, T.terracotta)
  slab(out, f, u0, u1, 0, proj, y1 - 0.12, y1, TRIM, T.terracotta, false)
  panel(out, f, u0, u1, proj * 0.45, y0, y1 - 0.12, SHADE)
  for (let u = u0 + 0.18; u < u1 - 0.08; u += 0.28) panel(out, f, u - 0.07, u + 0.07, proj * 0.75, y0, y1 - 0.12, TRIM)
}

// --------------------------------------------------------------------------------------------- a street front

/** One dressed street front, on its edge, `n` bays, every height in `Y`. */
function streetFront(out: MeshBuilder, f: Fr, n: number, Y: typeof H0): void {
  const L = f.L
  const q = 0.8                       // the quoined corner strip at each end
  const step = (L - 2 * q) / n
  const mid = (k: number): number => q + (k + 0.5) * step
  const edge = (k: number): number => q + k * step

  // ---- the walls: granite base, terracotta above
  panel(out, f, 0, L, 0, 0, Y.base, GRANITE, T.granite)
  panel(out, f, 0, L, 0, Y.base, Y.top, TERRA, T.terracotta)
  slab(out, f, -0.1, L + 0.1, 0, 0.18, 0, Y.plinth, VOUSSOIR, T.granite, false)

  // ---- the banking hall: deep channelled courses, the arches
  for (let y = Y.plinth + 0.6; y < Y.base - 0.2; y += 0.62) panel(out, f, 0, L, 0.03, y - 0.06, y + 0.06, JOINT)
  // the hall's arches are fewer and broader than the bays over them: three under Clay's four (frame 01)
  const nb = Math.max(2, n - 1)
  const bstep = (L - 2 * q) / nb
  const aw = Math.min(3.1, bstep * 0.6)
  const ay = Y.plinth + 0.35
  const ah = Y.base - 1.35 - ay       // crown under the keystone and the belt
  for (let k = 0; k < nb; k++) {
    const u = q + (k + 0.5) * bstep
    const r = aw / 2
    const spring = ay + ah - r
    // the voussoir ring, its radiating joints, the deep reveal, the glazing and its bronze transom
    arch(out, f, u, 0.05, ay - 0.1, aw + 1.4, ah + 0.8, VOUSSOIR, 6, T.granite)
    for (let j = 1; j < 9; j++) if (j !== 4 && j !== 5) voussoirJoint(out, f, u, 0.06, spring, r + 0.02, r + 0.7, (j / 9) * Math.PI, JOINT)
    arch(out, f, u, 0.07, ay, aw, ah, REVEAL, 6)
    arch(out, f, u, 0.09, ay + 0.2, aw - 0.55, ah - 0.45, GLASS, 6)
    panel(out, f, u - r + 0.27, u + r - 0.27, 0.1, spring - 0.9, spring - 0.72, SASH)
    for (const d of [-0.33, 0.33]) panel(out, f, u + d * (aw - 0.55) - 0.04, u + d * (aw - 0.55) + 0.04, 0.1, ay + 0.2, spring - 0.9, SASH)
    // the keystone, up into the belt; the sill
    slab(out, f, u - 0.34, u + 0.34, 0, 0.22, ay + ah - 0.15, Y.base - 0.3, TRIM, T.granite, false)
    slab(out, f, u - r - 0.2, u + r + 0.2, 0, 0.25, ay - 0.2, ay + 0.05, VOUSSOIR, T.granite)
  }

  // ---- the belt cornice over the hall: its shadow, the modillions, the heavy slab
  panel(out, f, -0.3, L + 0.3, 0.02, Y.base - 0.45, Y.base, SHADE)
  for (let u = 0.35; u < L - 0.1; u += 0.85) slab(out, f, u - 0.1, u + 0.1, 0, 0.6, Y.base - 0.3, Y.base, VOUSSOIR, FIXED)
  slab(out, f, -0.75, L + 0.75, -0.3, 0.8, Y.base, Y.belt, TRIM, T.granite)
  panel(out, f, -0.75, L + 0.75, 0.81, Y.base + 0.12, Y.base + 0.2, JOINT)

  // ---- the third storey: rusticated still, a round-arched window a bay
  for (let y = Y.belt + 0.6; y < Y.s3 - 0.3; y += 0.62) panel(out, f, 0, L, 0.03, y - 0.05, y + 0.05, JOINT)
  for (let k = 0; k < n; k++) {
    const u = mid(k)
    const w = Math.min(1.8, step * 0.5)
    arch(out, f, u, 0.05, Y.belt + 0.5, w + 0.6, Y.s3 - Y.belt - 0.6, VOUSSOIR, 6, T.terracotta)
    arch(out, f, u, 0.07, Y.belt + 0.6, w, Y.s3 - Y.belt - 0.95, GLASS, 6)
    panel(out, f, u - 0.04, u + 0.04, 0.08, Y.belt + 0.6, Y.s3 - 0.75, SASH)
    slab(out, f, u - 0.18, u + 0.18, 0, 0.15, Y.s3 - 0.6, Y.s3 - 0.15, TRIM, FIXED, false)
  }

  // ---- the balcony course, and the short balustrade under each fourth-storey window
  slab(out, f, -0.4, L + 0.4, -0.2, 0.42, Y.s3, Y.balc, TRIM, T.terracotta)
  panel(out, f, -0.4, L + 0.4, 0.43, Y.s3 + 0.08, Y.s3 + 0.16, JOINT)

  // ---- the shaft: channelled courses, five storeys of mullioned windows
  for (let y = Y.balc + 0.75; y < Y.shaft - 0.1; y += 0.75) panel(out, f, 0, L, 0.025, y - 0.035, y + 0.035, JOINT)
  const ww = Math.min(1.9, step * 0.55)
  for (let s = 0; s < 5; s++) {
    const y0 = Y.balc + s * Y.floor + 0.55
    const y1 = y0 + Y.floor - 1.05
    for (let k = 0; k < n; k++) {
      const u = mid(k)
      panel(out, f, u - ww / 2 - 0.2, u + ww / 2 + 0.2, 0.04, y0 - 0.1, y1 + 0.2, TRIM)
      panel(out, f, u - ww / 2, u + ww / 2, 0.06, y0, y1, GLASS)
      panel(out, f, u - 0.05, u + 0.05, 0.07, y0, y1, SASH)
      panel(out, f, u - ww / 2, u + ww / 2, 0.07, y0 + (y1 - y0) * 0.55 - 0.04, y0 + (y1 - y0) * 0.55 + 0.04, SASH)
      slab(out, f, u - ww / 2 - 0.3, u + ww / 2 + 0.3, 0, 0.2, y0 - 0.22, y0 - 0.06, TRIM, FIXED)
      if (s === 0) balustrade(out, f, u - ww / 2 - 0.15, u + ww / 2 + 0.15, Y.balc, Y.balc + 0.5, 0.3)
      if (s === 4) balustrade(out, f, u - ww / 2 - 0.15, u + ww / 2 + 0.15, y0 - 0.06, y0 + 0.5, 0.35)
      if (s % 2 === 0) {
        // the hood on its keystone
        slab(out, f, u - ww / 2 - 0.35, u + ww / 2 + 0.35, 0, 0.28, y1 + 0.3, y1 + 0.5, TRIM, FIXED)
        slab(out, f, u - 0.2, u + 0.2, 0, 0.12, y1 - 0.02, y1 + 0.3, TRIM, FIXED, false)
      }
    }
  }
  // the string course under the eighth storey
  const s8 = Y.balc + 4 * Y.floor
  slab(out, f, -0.25, L + 0.25, -0.1, 0.25, s8 - 0.05, s8 + 0.2, TRIM, T.terracotta)
  // the quoins up the shaft at both ends: a strip proud of the wall, its blocks in joints
  for (const [u0, u1] of [[0, q], [L - q, L]]) {
    slab(out, f, u0, u1, 0, 0.08, Y.balc, Y.shaft, TERRA, T.terracotta, false)
    for (let y = Y.balc + 0.75; y < Y.shaft - 0.1; y += 0.75) panel(out, f, u0, u1, 0.09, y - 0.04, y + 0.04, JOINT)
  }

  // ---- the crown: the course, the arched storey between pilasters, the frieze
  slab(out, f, -0.35, L + 0.35, -0.2, 0.35, Y.shaft, Y.course, TRIM, T.terracotta)
  for (let k = 0; k <= n; k++) {
    const u0 = k === 0 ? 0 : k === n ? L - q : edge(k) - 0.3
    const u1 = k === 0 ? q : k === n ? L : edge(k) + 0.3
    slab(out, f, u0, u1, 0, 0.18, Y.course, Y.arches, TRIM, T.terracotta, false)
    // the capital block on the pilaster, carrying a wreathed medallion in the frieze
    slab(out, f, u0 - 0.08, u1 + 0.08, 0, 0.26, Y.arches - 0.3, Y.arches, TRIM, FIXED, false)
  }
  for (let k = 0; k < n; k++) {
    const u = mid(k)
    const w = Math.min(1.9, step * 0.55)
    arch(out, f, u, 0.04, Y.course + 0.2, w + 0.45, Y.arches - Y.course - 0.45, TRIM, 6)
    arch(out, f, u, 0.06, Y.course + 0.3, w, Y.arches - Y.course - 0.75, GLASS, 6)
    panel(out, f, u - 0.04, u + 0.04, 0.07, Y.course + 0.3, Y.arches - 0.45 - w / 2, SASH)
    slab(out, f, u - 0.18, u + 0.18, 0, 0.16, Y.arches - 0.55, Y.arches - 0.1, TRIM, FIXED, false)
    // the frieze: a small attic window, flanked by swags hung from the medallions
    const fy = (Y.arches + Y.frieze) / 2
    panel(out, f, u - 0.5, u + 0.5, 0.05, fy - 0.38, fy + 0.38, TRIM)
    panel(out, f, u - 0.38, u + 0.38, 0.07, fy - 0.28, fy + 0.28, GLASS)
    swag(out, f, edge(k) + 0.35, u - 0.55, 0.06, fy + 0.35, 0.35, TRIM)
    swag(out, f, u + 0.55, edge(k + 1) - 0.35, 0.06, fy + 0.35, 0.35, TRIM)
  }
  for (let k = 0; k <= n; k++) {
    const u = k === 0 ? q / 2 : k === n ? L - q / 2 : edge(k)
    const fy = (Y.arches + Y.frieze) / 2
    roundel(out, f, u, 0.07, fy + 0.05, 0.45, TRIM, 6)
    roundel(out, f, u, 0.09, fy + 0.05, 0.26, SHADE)
  }
  panel(out, f, -0.2, L + 0.2, 0.02, Y.arches, Y.arches + 0.08, JOINT)

  // ---- the cornice: bed moulding, the dentil band, the modillions, the corona, the cymatium
  const fz = Y.frieze
  slab(out, f, -0.3, L + 0.3, -0.2, 0.3, fz, fz + 0.3, TRIM, T.terracotta)
  panel(out, f, -0.3, L + 0.3, 0.31, fz + 0.02, fz + 0.12, SHADE)
  for (let u = 0.25; u < L - 0.1; u += 0.6) slab(out, f, u - 0.09, u + 0.09, 0.3, 1.25, fz + 0.3, fz + 0.62, TRIM, FIXED)
  panel(out, f, -1.3, L + 1.3, 0.31, fz + 0.3, fz + 0.62, SHADE)
  slab(out, f, -1.35, L + 1.35, -0.2, 1.35, fz + 0.62, Y.top - 0.25, TRIM, T.terracotta)
  panel(out, f, -1.35, L + 1.35, 1.36, fz + 0.72, fz + 0.8, JOINT)
  slab(out, f, -1.45, L + 1.45, -0.2, 1.45, Y.top - 0.25, Y.top, TERRA, T.terracotta)
}

// ---------------------------------------------------------------------------------------- a lot-line wall

/** A plain wall: rendered brick-cream, a few punched windows over the neighbours, a plain coping. */
function plainWall(out: MeshBuilder, f: Fr, Y: typeof H0): void {
  const L = f.L
  panel(out, f, 0, L, 0, 0, Y.top, PLAIN, T.stucco)
  slab(out, f, -0.1, L + 0.1, -0.2, 0.3, Y.top - 0.6, Y.top, PLAIN, T.stucco)
  if (L < 4) return
  const n = Math.max(1, Math.round((L - 2) / 3.6))
  const step = (L - 2) / n
  for (let s = 0; s < 6; s++) {
    const y0 = Y.balc + s * Y.floor + 0.7
    for (let k = 0; k < n; k++) {
      const u = 1 + step * (k + 0.5)
      panel(out, f, u - 0.6, u + 0.6, 0.04, y0, y0 + 1.6, GLASS)
    }
  }
}

// ------------------------------------------------------------------------------------------ the building

function bankOfItaly(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < raw.length; i++) { const a = raw[i]; const b = raw[(i + 1) % raw.length]; area += a.x * b.z - b.x * a.z }
  const ring = area >= 0 ? raw : [...raw].reverse()

  const k = (fit.height || 35) / 35
  const Y = Object.fromEntries(Object.entries(H0).map(([n, v]) => [n, v * k])) as typeof H0

  // the Montgomery front: the longest edge; the Clay front: the longer of its two neighbours
  const N = ring.length
  const len = (i: number): number => { const a = ring[(i + N) % N]; const b = ring[(i + 1) % N]; return Math.hypot(b.x - a.x, b.z - a.z) }
  let front = 0
  for (let i = 1; i < N; i++) if (len(i) > len(front)) front = i
  const side = len(front - 1) > len(front + 1) ? (front - 1 + N) % N : (front + 1) % N
  const dressed = new Set([front, side])

  for (let i = 0; i < N; i++) {
    const f = frameOf(ring[i], ring[(i + 1) % N])
    if (dressed.has(i)) {
      // one bay pitch for both fronts: four bays on Clay, six on Montgomery (frame 02)
      streetFront(out, f, Math.max(2, Math.round((f.L - 1) / 3.3)), Y)
    } else plainWall(out, f, Y)
  }
  capPolygon(out, ring, Y.top - 0.1, ROOF, T.metal)

  // the elevator penthouse, set back on the roof, and the flagpole over the corner (frame 04)
  const F = frameOf(ring[front], ring[(front + 1) % N])
  const pc = pt(F, F.L * 0.62, -Math.min(8, F.L * 0.4))
  prism(out, pc.x, pc.z, Y.top - 0.1, Y.top + 2.6, 2.2, 4, PLAIN, T.stucco)
  const cornerAtEnd = side === (front + 1) % N
  const fp = pt(F, cornerAtEnd ? F.L - 1.6 : 1.6, -1.6)
  prism(out, fp.x, fp.z, Y.top, Y.top + 7, 0.07, 6, [0.86, 0.86, 0.84], T.metal, 0.05)
  prism(out, fp.x, fp.z, Y.top + 7, Y.top + 7.2, 0.13, 6, [0.82, 0.66, 0.3], FIXED, 0.13)
}

export const BANK_OF_ITALY: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** The Bank of Italy Building, 552 Montgomery at Clay (way/256068381): arched granite banking hall, terracotta shaft, modillioned cornice. */
  bankOfItaly: bankOfItaly,
}
