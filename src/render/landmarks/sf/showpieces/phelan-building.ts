/**
 * The Phelan Building (William Curlett, 1908), 760 Market Street, on the triangular block where O'Farrell and Grant
 * run into Market. From the Mapillary frames (p3/refs/relation-1547962, 2026-10-21): 01 from the south across Market
 * (the prow and the whole Market front), 04-06 head-on at the prow from the west.
 *
 * What the photographs show — an eleven-storey FLATIRON of cream-white glazed terracotta:
 *  - the PROW is ROUNDED: a drum the full height of the building, ringed by a moulding at every floor, its windows
 *    running round the curve with narrow piers between; the storefront curves round it too;
 *  - a two-storey STOREFRONT BASE of near-black bronze and glass — shop windows, a mezzanine above them — under a
 *    dark bronze cornice, then a cream band;
 *  - the third storey under a moulded string course; then storeys four to ten, the SHAFT: tall white piers proud
 *    of the wall, a PAIR of windows a bay a storey between them (no projecting bays on the straight fronts);
 *  - the eleventh storey: a ROUND ARCH a bay over a band, the piers carried up through it;
 *  - a deep BRACKETED CORNICE all round the two fronts and the prow, a low parapet with cresting above, and a
 *    flagpole over the prow.
 *
 * The frame: the real outline. The two longest edges are Market and O'Farrell; the prow is rebuilt between them as a
 * tangent arc of fixed radius, so it is the same drum whether the city hands over the relation's own outline (a
 * rounded tip of ~11 points, a notch at the rear) or its convex hull. Everything else is the rear: party walls
 * against the neighbours, plain cream with punched windows. Each wall is laid out in its own frame: u along it,
 * o out of it, y up.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const T = { terra: surfaceTag('terracotta'), metal: surfaceTag('metal'), glass: surfaceTag('glass'), stucco: surfaceTag('stucco') }

// cream-white glazed terracotta, whiter on the piers and mouldings, a shade darker in the recesses
const CREAM: Rgb = [0.88, 0.85, 0.77]
const PIER: Rgb = [0.92, 0.9, 0.84]
const TRIM: Rgb = [0.91, 0.89, 0.83]
const SHADE: Rgb = [0.6, 0.58, 0.53]
const BRONZE: Rgb = [0.1, 0.1, 0.1]
const BRONZE_LIT: Rgb = [0.14, 0.14, 0.13]
const SHOP: Rgb = [0.13, 0.15, 0.17]
const GLASS: Rgb = [0.17, 0.19, 0.22]
const ROOF: Rgb = [0.5, 0.49, 0.47]

/** The prow drum's radius, metres. */
const R = 3.2

/** The heights, metres over the pavement, for the 42 m of the manifest (scaled to `fit.height`). */
const Y0 = {
  mezz: 4.5,        // the transom bar between the shop windows and the mezzanine
  base: 8.1,        // the storefront's bronze cornice starts
  band: 8.6,        // the cream band over it starts
  s3: 9.4,          // the third storey's floor; the piers stand here
  string: 12.9,     // the string course over the third storey
  shaft: 13.4,      // storey four's floor
  shaftTop: 35.9,   // the band under the attic storey
  attic: 36.3,      // storey eleven's floor
  frieze: 39.7,     // the frieze
  corona: 40.6,     // the cornice's corona
  roof: 41.3,       // the cornice's top, the roof deck
  parapet: 42.0,    // the parapet's top
}
type Ys = typeof Y0
let Y: Ys = Y0
/** Storeys four to ten. */
const SHAFT_STOREYS = 7

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
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up (`bottom` adds the underside). */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, bottom = false): void {
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
/** A round-headed opening `w` wide, `h` tall from `y0`, centred `u` along, `o` proud. */
function arch(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, w: number, h: number, c: Rgb, seg = 5): void {
  const r = w / 2
  const spring = y0 + h - r
  if (spring > y0) panel(out, f, u - r, u + r, o, y0, spring, c)
  for (let i = 0; i < seg; i++) {
    const a0 = Math.PI - (i / seg) * Math.PI
    const a1 = Math.PI - ((i + 1) / seg) * Math.PI
    out.quad([P(f, u, o, spring), P(f, u + Math.cos(a0) * r, o, spring + Math.sin(a0) * r), P(f, u + Math.cos(a1) * r, o, spring + Math.sin(a1) * r), P(f, u, o, spring)],
      [f.nx, 0, f.nz], UV, c, FIXED)
  }
}

// --------------------------------------------------------------------------------- a moulding round a path

/** The points of a path pushed `d` out of it, mitred at every inner vertex. */
function offsetPath(pts: P2[], closed: boolean, d: number): P2[] {
  const n = pts.length
  const res: P2[] = []
  const normal = (i: number): P2 => {
    const a = pts[i]
    const b = pts[(i + 1) % n]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { x: (b.z - a.z) / L, z: -(b.x - a.x) / L }
  }
  for (let i = 0; i < n; i++) {
    const hasPrev = closed || i > 0
    const hasNext = closed || i < n - 1
    const np = hasPrev ? normal((i + n - 1) % n) : normal(i)
    const nn = hasNext ? normal(i) : np
    const dot = np.x * nn.x + np.z * nn.z
    const k = d / Math.max(0.35, 1 + dot)
    res.push({ x: pts[i].x + (np.x + nn.x) * k, z: pts[i].z + (np.z + nn.z) * k })
  }
  return res
}

/**
 * A moulding along a path (the fronts and the prow, or the whole ring): its outer face `o1` out of the wall from
 * `y0` to `y1`, its top, and (with `soffit`) its underside back to `o0`; the open ends capped.
 */
function band(out: MeshBuilder, pts: P2[], closed: boolean, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, soffit = false): void {
  const A = offsetPath(pts, closed, o0)
  const B = offsetPath(pts, closed, o1)
  const n = pts.length
  const segs = closed ? n : n - 1
  const V = (p: P2, y: number): [number, number, number] => [p.x, y, p.z]
  for (let i = 0; i < segs; i++) {
    const j = (i + 1) % n
    const f = frameOf(pts[i], pts[j])
    out.quad([V(B[i], y0), V(B[j], y0), V(B[j], y1), V(B[i], y1)], [f.nx, 0, f.nz], UV, c, tag)
    out.quad([V(A[i], y1), V(B[i], y1), V(B[j], y1), V(A[j], y1)], [0, 1, 0], UV, c, tag)
    if (soffit) out.quad([V(B[i], y0), V(A[i], y0), V(A[j], y0), V(B[j], y0)], [0, -1, 0], UV, c, tag)
  }
  if (!closed) {
    const f0 = frameOf(pts[0], pts[1])
    out.quad([V(A[0], y0), V(B[0], y0), V(B[0], y1), V(A[0], y1)], [-f0.tx, 0, -f0.tz], UV, c, tag)
    const f1 = frameOf(pts[n - 2], pts[n - 1])
    out.quad([V(B[n - 1], y0), V(A[n - 1], y0), V(A[n - 1], y1), V(B[n - 1], y1)], [f1.tx, 0, f1.tz], UV, c, tag)
  }
}

/** The parapet's inner face, seen from the roof. */
function innerFace(out: MeshBuilder, pts: P2[], o: number, y0: number, y1: number, c: Rgb): void {
  const A = offsetPath(pts, true, o)
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const f = frameOf(pts[i], pts[j])
    out.quad([[A[j].x, y0, A[j].z], [A[i].x, y0, A[i].z], [A[i].x, y1, A[i].z], [A[j].x, y1, A[j].z]], [-f.nx, 0, -f.nz], UV, c, FIXED)
  }
}

// ------------------------------------------------------------------------------------------- the prow drum

/** A run of short segments (the drum) measured by arc length, so a window can straddle a vertex. */
interface Run { frames: Fr[]; s: number[]; L: number }
const runOf = (pts: P2[]): Run => {
  const frames: Fr[] = []
  const s: number[] = []
  let acc = 0
  for (let i = 0; i + 1 < pts.length; i++) {
    const f = frameOf(pts[i], pts[i + 1])
    frames.push(f)
    s.push(acc)
    acc += f.L
  }
  return { frames, s, L: acc }
}
/** A panel from arc length `s0` to `s1` round the run, cut at the run's vertices. */
function panelAlong(out: MeshBuilder, run: Run, s0: number, s1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  for (let i = 0; i < run.frames.length; i++) {
    const a = Math.max(s0, run.s[i])
    const b = Math.min(s1, run.s[i] + run.frames[i].L)
    if (b - a > 0.01) panel(out, run.frames[i], a - run.s[i], b - run.s[i], o, y0, y1, c, tag)
  }
}
/** The frame of the segment at arc length `s`, and how far along it `s` falls. */
function at(run: Run, s: number): { f: Fr; u: number } {
  let i = 0
  while (i < run.frames.length - 1 && run.s[i + 1] <= s) i++
  return { f: run.frames[i], u: s - run.s[i] }
}

function drum(out: MeshBuilder, arc: P2[]): void {
  const run = runOf(arc)
  // the cream wall of the drum from the base's cornice up, the bronze below
  for (const f of run.frames) {
    panel(out, f, 0, f.L, 0, Y.band, Y.roof, CREAM, T.terra)
    panel(out, f, 0, f.L, 0, -1.5, Y.band, BRONZE, T.metal)
  }
  // the windows round the curve: four a storey, narrow piers between them
  const nWin = Math.max(3, Math.round(run.L / 1.85))
  const pitch = run.L / nWin
  const ww = pitch * 0.62
  const storey = (Y.shaftTop - Y.shaft) / SHAFT_STOREYS
  for (let k = 0; k < nWin; k++) {
    const m = (k + 0.5) * pitch
    // the storefront round the prow: tall shop glass, the mezzanine over the transom
    panelAlong(out, run, m - pitch * 0.42, m + pitch * 0.42, 0.04, 0.2, Y.mezz - 0.1, SHOP, T.glass)
    panelAlong(out, run, m - pitch * 0.42, m + pitch * 0.42, 0.04, Y.mezz + 0.35, Y.base - 0.2, SHOP, T.glass)
    // storey three and the shaft
    panelAlong(out, run, m - ww / 2, m + ww / 2, 0.04, Y.s3 + 0.7, Y.string - 0.35, GLASS, T.glass)
    for (let s = 0; s < SHAFT_STOREYS; s++) {
      const y = Y.shaft + s * storey
      panelAlong(out, run, m - ww / 2, m + ww / 2, 0.04, y + 0.65, y + storey - 0.35, GLASS, T.glass)
      // the white sash: a mullion up the middle, the meeting rail across
      const c = at(run, m)
      panel(out, c.f, c.u - 0.05, c.u + 0.05, 0.07, y + 0.65, y + storey - 0.35, TRIM, T.terra)
      const rail = y + 0.65 + (storey - 1) * 0.58
      panelAlong(out, run, m - ww / 2, m + ww / 2, 0.06, rail - 0.05, rail + 0.05, TRIM, T.terra)
    }
    // the attic storey's arches, one a window
    const { f, u } = at(run, m)
    arch(out, f, u, 0.04, Y.attic + 0.45, ww, Y.frieze - Y.attic - 0.75, GLASS, 6)
    // the bronze mullion between shop windows
    const b = at(run, k * pitch)
    if (k > 0) slab(out, b.f, b.u - 0.12, b.u + 0.12, 0, 0.12, -1.5, Y.base, BRONZE_LIT, T.metal)
  }
  // a moulding at every floor, ringing the drum (the stacked look of the photographs), the sills between
  const ext = [...arc]
  band(out, ext, false, 0, 0.18, Y.s3 + 0.35, Y.s3 + 0.6, TRIM, T.terra, true)
  for (let s = 0; s <= SHAFT_STOREYS; s++) {
    const y = Y.shaft + s * storey
    band(out, ext, false, 0, 0.2, y + 0.3, y + 0.6, TRIM, T.terra, true)
  }
  // the bracket under each window's sill course on the third storey, the keystone over each arch
  for (let k = 0; k < nWin; k++) {
    const { f, u } = at(run, (k + 0.5) * pitch)
    slab(out, f, u - 0.08, u + 0.08, 0, 0.16, Y.frieze - 0.35, Y.frieze, PIER, T.terra)
  }
}

// ------------------------------------------------------------------------------------------- a straight front

/** The pier positions along a front: `u` and width. Wide piers at the rear corner and the drum. */
function piersOf(L: number, startIsDrum: boolean, endIsDrum: boolean): { u: number; w: number }[] {
  const e0 = startIsDrum ? 0.35 : 0.6
  const e1 = endIsDrum ? 0.35 : 0.6
  const n = Math.max(1, Math.round((L - e0 - e1) / 3.7))
  const step = (L - e0 - e1) / n
  const res: { u: number; w: number }[] = []
  for (let k = 0; k <= n; k++) {
    const end = k === 0 || k === n
    const w = end ? (((k === 0 && startIsDrum) || (k === n && endIsDrum)) ? 0.7 : 1.2) : 0.62
    res.push({ u: e0 + k * step, w })
  }
  return res
}

/** A pair of windows: dark glass, the white mullion between, the meeting rail of the sashes, a sill. */
function pairAt(out: MeshBuilder, f: Fr, u: number, half: number, y0: number, y1: number): void {
  const ww = half * 2 - 0.42
  for (const s of [-1, 1]) {
    const c = u + s * (ww / 4 + 0.105)
    panel(out, f, c - ww / 4, c + ww / 4, 0.04, y0, y1, GLASS, T.glass)
  }
  const rail = y0 + (y1 - y0) * 0.58
  panel(out, f, u - ww / 2, u + ww / 2, 0.06, rail - 0.05, rail + 0.05, TRIM, T.terra)
  panel(out, f, u - ww / 2 - 0.12, u + ww / 2 + 0.12, 0.08, y0 - 0.16, y0, TRIM, T.terra)
}

function front(out: MeshBuilder, f: Fr, startIsDrum: boolean, endIsDrum: boolean): void {
  const L = f.L
  // the wall: cream terracotta over the bronze storefront
  panel(out, f, 0, L, 0, Y.band, Y.roof, CREAM, T.terra)
  panel(out, f, 0, L, 0, -1.5, Y.band, BRONZE, T.metal)
  const piers = piersOf(L, startIsDrum, endIsDrum)
  const storey = (Y.shaftTop - Y.shaft) / SHAFT_STOREYS
  for (let k = 0; k < piers.length; k++) {
    const { u, w } = piers[k]
    const h = w / 2
    // the bronze pier of the storefront under it
    slab(out, f, u - Math.min(h, 0.3), u + Math.min(h, 0.3), 0, 0.2, -1.5, Y.base, BRONZE_LIT, T.metal)
    // the terracotta pier up the shaft and through the attic
    slab(out, f, u - h, u + h, 0, 0.24, Y.s3, Y.frieze, PIER, T.terra)
    // its cap block under the frieze
    slab(out, f, u - h - 0.08, u + h + 0.08, 0, 0.34, Y.frieze - 0.4, Y.frieze, TRIM, T.terra, true)
    if (k === piers.length - 1) break
    const n = piers[k + 1]
    const m = (u + h + n.u - n.w / 2) / 2
    const half = (n.u - n.w / 2 - (u + h)) / 2
    // the shop window and the mezzanine light
    panel(out, f, m - half + 0.1, m + half - 0.1, 0.04, 0.25, Y.mezz - 0.1, SHOP, T.glass)
    panel(out, f, m - half + 0.1, m + half - 0.1, 0.04, Y.mezz + 0.35, Y.base - 0.2, SHOP, T.glass)
    panel(out, f, m - 0.06, m + 0.06, 0.08, Y.mezz + 0.35, Y.base - 0.2, BRONZE_LIT, T.metal)
    // storey three and the shaft: a pair of windows a bay a storey
    pairAt(out, f, m, half, Y.s3 + 0.7, Y.string - 0.35)
    for (let s = 0; s < SHAFT_STOREYS; s++) {
      const y = Y.shaft + s * storey
      pairAt(out, f, m, half, y + 0.65, y + storey - 0.35)
    }
    // the attic: a round arch a bay, a mullion up it, a keystone
    const aw = Math.min(half * 2 - 0.3, 3)
    arch(out, f, m, 0.04, Y.attic + 0.45, aw, Y.frieze - Y.attic - 0.65, GLASS, 7)
    panel(out, f, m - 0.07, m + 0.07, 0.07, Y.attic + 0.45, Y.frieze - 0.2 - aw / 2, TRIM, T.terra)
    slab(out, f, m - 0.14, m + 0.14, 0, 0.16, Y.frieze - 0.35, Y.frieze, PIER, T.terra)
  }
}

/** The rear: party walls, plain cream, a window a bay above the neighbours' roofs, a dark base. */
function rear(out: MeshBuilder, f: Fr): void {
  const L = f.L
  panel(out, f, 0, L, 0, -1.5, Y.roof, CREAM, T.stucco)
  if (L < 3) return
  const n = Math.max(1, Math.round(L / 3.7))
  const step = L / n
  const storey = (Y.shaftTop - Y.shaft) / SHAFT_STOREYS
  for (let k = 0; k < n; k++) {
    const m = (k + 0.5) * step
    const w = Math.min(1.3, step - 1)
    for (let s = 0; s <= SHAFT_STOREYS; s++) {
      const y = Y.shaft + s * storey
      panel(out, f, m - w / 2, m + w / 2, 0.03, y + 0.75, y + storey - 0.45, GLASS, T.glass)
    }
  }
}

// ------------------------------------------------------------------------------------------- the building

const dirOf = (a: P2, b: P2): P2 => { const L = Math.hypot(b.x - a.x, b.z - a.z) || 1; return { x: (b.x - a.x) / L, z: (b.z - a.z) / L } }
const cross = (a: P2, b: P2): number => a.x * b.z - a.z * b.x

/**
 * The outline with the prow rebuilt: the two longest edges that converge (Market and O'Farrell), whatever lies
 * between them replaced by a tangent arc of radius R. Returns the clean ring, where the arc starts and ends in it,
 * and the arc's centre; null when there is no prow to find.
 */
function withProw(ring: P2[]): { ring: P2[]; i0: number; i1: number; centre: P2 } | null {
  const n = ring.length
  const len = (i: number) => Math.hypot(ring[(i + 1) % n].x - ring[i].x, ring[(i + 1) % n].z - ring[i].z)
  const order = [...Array(n).keys()].sort((p, q) => len(q) - len(p))
  for (let ai = 0; ai < Math.min(4, n); ai++) {
    for (let bi = ai + 1; bi < Math.min(5, n); bi++) {
      for (const [a, b] of [[order[ai], order[bi]], [order[bi], order[ai]]]) {
        // a runs into the prow, b runs out of it; the stretch between them must be short
        let gap = 0
        for (let i = (a + 1) % n; i !== b; i = (i + 1) % n) gap += len(i)
        if (gap > 14) continue
        const da = dirOf(ring[a], ring[(a + 1) % n])
        const db = dirOf(ring[b], ring[(b + 1) % n])
        const turn = cross(da, db)
        if (turn < 0.2) continue
        // the virtual apex where the two lines meet
        const pa = ring[a]
        const pb = ring[b]
        const den = cross(da, db)
        const t = cross({ x: pb.x - pa.x, z: pb.z - pa.z }, db) / den
        const V = { x: pa.x + da.x * t, z: pa.z + da.z * t }
        const theta = Math.acos(Math.max(-1, Math.min(1, -(da.x * db.x + da.z * db.z))))
        const tt = R / Math.tan(theta / 2)
        const T1 = { x: V.x - da.x * tt, z: V.z - da.z * tt }
        const T2 = { x: V.x + db.x * tt, z: V.z + db.z * tt }
        if (Math.hypot(T1.x - pa.x, T1.z - pa.z) < 6 || Math.hypot(ring[(b + 1) % n].x - T2.x, ring[(b + 1) % n].z - T2.z) < 6) continue
        const bis = dirOf({ x: 0, z: 0 }, { x: -da.x + db.x, z: -da.z + db.z })
        const dc = R / Math.sin(theta / 2)
        const C = { x: V.x + bis.x * dc, z: V.z + bis.z * dc }
        const f1 = Math.atan2(T1.z - C.z, T1.x - C.x)
        let sweep = Math.atan2(T2.z - C.z, T2.x - C.x) - f1
        while (sweep > Math.PI) sweep -= 2 * Math.PI
        while (sweep < -Math.PI) sweep += 2 * Math.PI
        const segs = 12
        const arc: P2[] = []
        for (let k = 0; k <= segs; k++) {
          const ang = f1 + (sweep * k) / segs
          arc.push({ x: C.x + Math.cos(ang) * R, z: C.z + Math.sin(ang) * R })
        }
        // the rest of the ring, from where b ends round to where a starts
        const rest: P2[] = []
        for (let i = (b + 1) % n; ; i = (i + 1) % n) { rest.push(ring[i]); if (i === a) break }
        const clean = [...rest, ...arc]
        return { ring: clean, i0: rest.length, i1: rest.length + segs, centre: C }
      }
    }
  }
  return null
}

function phelanBuilding(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx - 4, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < raw.length; i++) { const a = raw[i]; const b = raw[(i + 1) % raw.length]; area += a.x * b.z - b.x * a.z }
  let ring0 = area >= 0 ? [...raw] : [...raw].reverse()
  // drop near-duplicate points
  ring0 = ring0.filter((p, i) => { const q = ring0[(i + 1) % ring0.length]; return Math.hypot(q.x - p.x, q.z - p.z) > 0.2 })
  const prow = withProw(ring0)
  const s = fit.height > 0 ? fit.height / 42 : 1
  Y = Object.fromEntries(Object.entries(Y0).map(([k, v]) => [k, v * s])) as Ys
  const v0 = out.positions.length

  const ring = prow ? prow.ring : ring0
  const n = ring.length
  // the street path: Market's start, round the prow, to O'Farrell's end
  let path: P2[] = []
  if (prow) {
    const a = (prow.i0 - 1 + n) % n
    for (let i = a; ; i = (i + 1) % n) { path.push(ring[i]); if (i === (prow.i1 + 1) % n) break }
  }
  const isFront = (i: number) => prow !== null && (i === (prow.i0 - 1 + n) % n || i === prow.i1)
  const isArc = (i: number) => prow !== null && i >= prow.i0 && i < prow.i1

  // the drop to the street at the prow, so the shopfronts stand on Market's pavement
  let drop = 0
  if (prow && fit.groundAt) drop = Math.max(0, Math.min(4, fit.groundAt(prow.centre.x, prow.centre.z)))

  for (let i = 0; i < n; i++) {
    if (isArc(i)) continue
    const f = frameOf(ring[i], ring[(i + 1) % n])
    if (isFront(i)) front(out, f, i === prow!.i1, i !== prow!.i1)
    else rear(out, f)
  }
  if (prow) drum(out, ring.slice(prow.i0, prow.i1 + 1))
  else path = []

  // the mouldings along the street path: the storefront's bronze cornice, the cream band, the string course,
  // the band under the attic, the frieze, the brackets, the corona and its crown moulding
  if (path.length >= 2) {
    band(out, path, false, 0, 0.45, Y.base, Y.band, BRONZE, T.metal, true)
    band(out, path, false, 0, 0.12, Y.mezz - 0.1, Y.mezz + 0.35, BRONZE_LIT, T.metal, true)
    band(out, path, false, 0, 0.3, Y.band, Y.s3, TRIM, T.terra, true)
    band(out, path, false, 0, 0.36, Y.string, Y.shaft, TRIM, T.terra, true)
    band(out, path, false, 0, 0.3, Y.shaftTop, Y.attic, TRIM, T.terra, true)
    band(out, path, false, 0, 0.34, Y.frieze, Y.corona - 0.2, CREAM, T.terra, true)
    band(out, path, false, 0, 0.36, Y.corona - 0.2, Y.corona, SHADE, T.terra, true)
    band(out, path, false, 0, 1.35, Y.corona, Y.roof - 0.2, TRIM, T.terra, true)
    band(out, path, false, 0, 1.5, Y.roof - 0.2, Y.roof, PIER, T.terra, true)
    // the scrolled brackets (modillions) under the corona, close-set round the fronts and the prow, the dentils
    const run = runOf(path)
    const nb = Math.round(run.L / 1.0)
    for (let k = 0; k <= nb; k++) {
      const { f, u } = at(run, (k * run.L) / nb)
      slab(out, f, u - 0.09, u + 0.09, 0.3, 1.15, Y.corona - 0.45, Y.corona, PIER, T.terra, true)
    }
    band(out, path, false, 0, 0.42, Y.frieze + 0.25, Y.frieze + 0.42, TRIM, T.terra, true)
  }
  // the parapet round the whole ring, the cresting on the fronts, the roof deck
  band(out, ring, true, -0.3, 0.05, Y.roof, Y.parapet, CREAM, T.terra)
  innerFace(out, ring, -0.3, Y.roof, Y.parapet, SHADE)
  band(out, ring, true, -0.35, 0.12, Y.parapet, Y.parapet + 0.15, TRIM, T.terra)
  capPolygon(out, ring, Y.roof - 0.05, ROOF, T.metal)
  if (prow) {
    // the flagpole over the prow
    const C = prow.centre
    prism(out, C.x, C.z, Y.roof, Y.parapet + 9, 0.07, 6, [0.86, 0.86, 0.84], T.metal, 0.05)
    prism(out, C.x, C.z, Y.parapet + 9, Y.parapet + 9.25, 0.13, 6, [0.82, 0.66, 0.3], FIXED, 0.05)
  }
  // everything onto the street datum at the prow
  if (drop > 0) for (let k = v0 + 1; k < out.positions.length; k += 3) out.positions[k] += drop
  Y = Y0
}

export const PHELAN_BUILDING: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** relation/1547962 — the Phelan Building, Market at O'Farrell and Grant. */
  phelanBuilding,
}
