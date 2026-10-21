/**
 * The Mills Building, 220 Montgomery Street (Burnham & Root, 1891; restored after 1906 by Willis Polk), and the
 * Mills Tower behind it at 220 Bush Street (Lewis Hobart, 1931), built as one family. From the Commons
 * photographs "Mills Building wide.jpg" (the Montgomery/Bush corner from across the junction), "Mills Building
 * (San Francisco).jpg" (HABS, from above Montgomery), the HABS "DETAIL, ENTRANCE ARCH" plate, "Mills Building and
 * Tower (taken on 27Aug2012…)" (the tower's Bush Street door) and "Mills Building and Tower 2012-09-06 19-24-09"
 * (looking up the Bush front at the arcade, the tower's arched crown over it), and the Mapillary frames from Bush
 * (2026-10-21).
 *
 * What the photographs show of the BUILDING:
 *  - a two-storey BASE of pale warm-grey marble: shopfronts between marble piers, a square window a bay over
 *    them, a strong marble cornice;
 *  - on Montgomery, the ENTRANCE: a great Romanesque round ARCH in that marble, two storeys tall, its opening
 *    framed by three receding carved orders, clustered colonnettes in the jambs, in a flat surround up to the
 *    cornice;
 *  - over the base, buff brick and terracotta: a third storey of square windows and a belt course, then at
 *    each corner a PAVILION, plain wall with two windows a storey, and between the pavilions the giant ARCADE:
 *    piers of paired colonnettes rising five storeys to round ARCHES, a window a storey in each recessed bay, the
 *    top one round-headed under the arch;
 *  - an ornamented FRIEZE over the arches, a storey of square windows, a corbelled band, an attic of small
 *    paired windows, the bracketed CORNICE, a flagpole on the roof.
 * The TOWER on Bush: the same marble base and cornice at the same height, a square-headed door between marble
 * pilasters, the same buff brick in continuous piers for twenty storeys, round-arched heads to its top windows,
 * a frieze, an attic and a cornice like the building's.
 *
 * The frame: the real outline. Bush is the building's longest edge; Montgomery the longer of its two neighbours
 * (the other, the shorter, is the wall the tower shares). Both builders find their edges by length alone, so the
 * relation's outline and its convex hull give the same walls; the light courts are not modelled (flat roof).
 * Where the two touch, the TOWER draws the shared wall and the building's is set 23 cm inside it; the tower's
 * bands sit 5 cm higher and prouder than the building's so the two never share a plane.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const T = { brick: surfaceTag('brick'), marble: surfaceTag('ashlar'), terra: surfaceTag('terracotta'), metal: surfaceTag('metal') }

// the photographs' warm buff brick, the terracotta a shade paler, the frieze a shade darker; the marble warm grey
const BRICK: Rgb = [0.88, 0.67, 0.47]
const DEEP: Rgb = [0.74, 0.55, 0.39]
const TRIM: Rgb = [0.86, 0.72, 0.55]
const FRIEZE: Rgb = [0.72, 0.57, 0.42]
const TOWER_BRICK: Rgb = [0.84, 0.67, 0.5]
const MARBLE: Rgb = [0.86, 0.85, 0.81]
const CARVE: Rgb = [0.72, 0.71, 0.67]
const GLASS: Rgb = [0.15, 0.17, 0.2]
const DOOR: Rgb = [0.1, 0.1, 0.11]
const ROOF: Rgb = [0.46, 0.44, 0.41]

/** The shared datums: the marble base and its cornice, the same on both. */
const G = 5.8        // the ground storey's top
const B = 10.4       // the marble base's top
const BC = 11.2      // its cornice's top

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
  if (u1 - u0 < 0.01 || y1 - y0 < 0.01) return
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], [f.nx, 0, f.nz], UV, c, tag)
}
/** A block in a frame (`lid` its top, `back` the face into the wall, `under` its soffit). */
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

/** A row of window holes: `a..b` high, at each `[u0, u1]` of `cols`. */
interface Row { a: number; b: number; cols: [number, number][] }

/** A wall `u0..u1` × `y0..y1` at `o` with rectangular holes: strips between the rows, piers between the holes. */
function punched(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, rows: Row[], c: Rgb, tag: number): void {
  let y = y0
  for (const r of rows) {
    panel(out, f, u0, u1, o, y, r.a, c, tag)
    let u = u0
    for (const [c0, c1] of [...r.cols].sort((p, q) => p[0] - q[0])) {
      if (c1 <= u0 || c0 >= u1) continue
      panel(out, f, u, Math.max(u0, c0), o, r.a, r.b, c, tag)
      u = Math.min(u1, c1)
    }
    panel(out, f, u, u1, o, r.a, r.b, c, tag)
    y = r.b
  }
  panel(out, f, u0, u1, o, y, y1, c, tag)
}

/** The points of a semicircle over `m ± r` springing at `spring`, left to right. */
function semi(m: number, r: number, spring: number, seg: number): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i <= seg; i++) {
    const a = Math.PI - (Math.PI * i) / seg
    pts.push([m + r * Math.cos(a), spring + r * Math.sin(a)])
  }
  return pts
}
/** The wall over a round arch of radius `r`: what of `m ± half` × `spring..yTop` lies outside the semicircle. */
function archHead(out: MeshBuilder, f: Fr, m: number, r: number, half: number, spring: number, yTop: number, o: number, c: Rgb, tag: number, seg: number): void {
  const S = semi(m, r, spring, seg)
  for (let i = 0; i < seg; i++) {
    const [ua, ya] = S[i]
    const [ub, yb] = S[i + 1]
    out.quad([P(f, ua, o, ya), P(f, ub, o, yb), P(f, ub, o, yTop), P(f, ua, o, yTop)], [f.nx, 0, f.nz], UV, c, tag)
  }
  panel(out, f, m - half, m - r, o, spring, yTop, c, tag)
  panel(out, f, m + r, m + half, o, spring, yTop, c, tag)
}
/** A semicircular band between radii `r0` and `r1`: an archivolt, or the wall between a window's head and its arch. */
function ring(out: MeshBuilder, f: Fr, m: number, r0: number, r1: number, spring: number, o: number, c: Rgb, tag: number, seg: number): void {
  const A = semi(m, r0, spring, seg)
  const Bp = semi(m, r1, spring, seg)
  for (let i = 0; i < seg; i++) {
    out.quad([P(f, A[i][0], o, A[i][1]), P(f, A[i + 1][0], o, A[i + 1][1]), P(f, Bp[i + 1][0], o, Bp[i + 1][1]), P(f, Bp[i][0], o, Bp[i][1])],
      [f.nx, 0, f.nz], UV, c, tag)
  }
}
/** A colonnette standing `o` proud of the wall at `u`. */
function colonnette(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, y1: number, r: number, c: Rgb, tag: number): void {
  const p = pt(f, u, o)
  prism(out, p.x, p.z, y0, y1, r, r > 0.3 ? 8 : 6, c, tag, r, false)
}

/**
 * A projecting band along a front: at a corner the front OWNS it runs to the corner and turns it with a block
 * over the street; at a corner the other front owns it stops short by its own depth, so the two never overlap.
 */
interface Ends { own0: boolean; own1: boolean; cut0: boolean; cut1: boolean }
function band(out: MeshBuilder, f: Fr, e: Ends, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag: number, back = false): void {
  const u0 = e.cut0 ? -o0 : 0
  const u1 = e.cut1 ? f.L + o0 : f.L
  slab(out, f, u0, u1, o0, o1, y0, y1, c, tag, true, back, o1 > 0.05)
  if (o1 > 0.05 && e.own0) slab(out, f, -o1, 0, 0, o1, y0, y1, c, tag, true, false, true)
  if (o1 > 0.05 && e.own1) slab(out, f, f.L, f.L + o1, 0, o1, y0, y1, c, tag, true, false, true)
}

const ccw = (raw: P2[]): P2[] => {
  let a = 0
  for (let i = 0; i < raw.length; i++) { const p = raw[i]; const q = raw[(i + 1) % raw.length]; a += p.x * q.z - q.x * p.z }
  return a >= 0 ? raw : [...raw].reverse()
}
const ringOf = (fit: Fit): P2[] => ccw(fit.ring && fit.ring.length >= 3 ? fit.ring
  : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }])

// ======================================================================================== the Mills Building

// the building's storeys over the base: the third, the arcade's five, the frieze, the ninth, the attic, the cornice
const S3 = 14.6
const A0 = 15.1                       // the arcade's foot
const AS = 3.75                       // an arcade storey
const SPRING = 31.4                   // the arches' springing (the eighth storey's windows' too)
const YA = 33.85                      // the arcade's top
const YF = 35.05                      // the frieze's top
const S9 = 38.6
const S9B = 39.3                      // the corbelled band's top
const S10 = 42.6
const CORN = 43.4
const CORN_TOP = 44.25
const ROOF_Y = 44.9
const PARAPET = 45.2

/** One street front: base, portal (Montgomery), pavilions, arcade, frieze, attic, cornice. */
function millsFront(out: MeshBuilder, f: Fr, ends: Ends, portal: boolean, drop: number, sill: number): void {
  const L = f.L
  const pav = Math.max(6, Math.min(8, 0.13 * L))
  const n = Math.max(1, Math.round((L - 2 * pav) / 4.4))
  const b = (L - 2 * pav) / n
  const pw = Math.min(1.35, b * 0.27)                 // a pier
  const R = (b - pw) / 2                               // the arch's radius: the bay between the piers
  const w2 = Math.min(0.95, R * 0.52)                  // a window's half-width in the arcade
  const mid = (i: number): number => pav + (i + 0.5) * b
  // the columns: two windows in a pavilion, one in an arcade bay
  const pavCols = (hw: number): [number, number][] => [0.3, 0.7].flatMap((k) => [[pav * k - hw, pav * k + hw], [L - pav * k - hw, L - pav * k + hw]] as [number, number][])
  const bayCols = (hw: number): [number, number][] => Array.from({ length: n }, (_, i) => [mid(i) - hw, mid(i) + hw] as [number, number])
  const pairCols = (hw: number): [number, number][] => Array.from({ length: n }, (_, i) => [[mid(i) - b * 0.22 - hw, mid(i) - b * 0.22 + hw], [mid(i) + b * 0.22 - hw, mid(i) + b * 0.22 + hw]] as [number, number][]).flat()

  // the glass behind it all
  panel(out, f, 0, L, -0.8, -drop, S10, GLASS)

  // ---- the marble base: shopfronts between piers, a square window a bay over them; the portal's span left open
  const pm = L / 2
  const PH = 5.6                                       // the portal's half-width, surround and all
  const ground: [number, number][] = [...pavCols(0.95), ...bayCols(Math.min(1.7, b / 2 - 0.6))]
  const mezz: [number, number][] = [...pavCols(0.75), ...bayCols(Math.min(0.85, b * 0.2))]
  const clear = (cols: [number, number][]): [number, number][] => portal ? cols.filter(([a, c]) => c < pm - PH - 0.3 || a > pm + PH + 0.3) : cols
  const baseRows: Row[] = [{ a: 0.5, b: G - 0.6, cols: clear(ground) }, { a: G + 0.9, b: B - 0.9, cols: clear(mezz) }]
  if (portal) {
    punched(out, f, 0, pm - PH, 0.05, -drop, B, baseRows, MARBLE, T.marble)
    punched(out, f, pm + PH, L, 0.05, -drop, B, baseRows, MARBLE, T.marble)
    montgomeryArch(out, f, pm, drop, sill)
  } else {
    punched(out, f, 0, L, 0.05, -drop, B, baseRows, MARBLE, T.marble)
  }
  // the plinth, the sills of the mezzanine windows, the cornice
  band(out, f, ends, -0.2, 0.2, -drop, 0.45, MARBLE, T.marble)
  for (const [a, c] of baseRows[1].cols) slab(out, f, a - 0.15, c + 0.15, 0.05, 0.22, G + 0.75, G + 0.9, MARBLE, T.marble)
  band(out, f, ends, -0.5, 0.65, B, BC, MARBLE, T.marble)

  // ---- the third storey and its belt course
  punched(out, f, 0, L, 0, BC, S3, [{ a: BC + 0.75, b: S3 - 0.45, cols: [...pavCols(0.7), ...bayCols(w2)] }], BRICK, T.brick)
  band(out, f, ends, -0.5, 0.18, S3, A0, TRIM, T.terra)

  // ---- the pavilions: plain wall, two windows a storey, through the arcade's five storeys
  const arcRows = (hw: (k: number) => [number, number][]): Row[] => Array.from({ length: 5 }, (_, k) =>
    ({ a: A0 + k * AS + 0.75, b: A0 + (k + 1) * AS - 0.4, cols: hw(k) }))
  punched(out, f, 0, pav, 0, A0, YA, arcRows(() => pavCols(0.7).filter(([a]) => a < pav)), BRICK, T.brick)
  punched(out, f, L - pav, L, 0, A0, YA, arcRows(() => pavCols(0.7).filter(([a]) => a > L - pav)), BRICK, T.brick)

  // ---- the arcade: recessed bays, a window a storey, the top one round-headed under the arch
  for (let i = 0; i < n; i++) {
    const m = mid(i)
    const rows = arcRows(() => [[m - w2, m + w2]])
    rows[4] = { a: A0 + 4 * AS + 0.7, b: SPRING, cols: [[m - w2, m + w2]] }
    punched(out, f, m - R, m + R, -0.45, A0, SPRING, rows, DEEP, T.brick)
    ring(out, f, m, w2, R, SPRING, -0.45, DEEP, T.brick, 5)
    ring(out, f, m, R, R + 0.35, SPRING, -0.12, TRIM, T.terra, 6)
    archHead(out, f, m, R + 0.35, b / 2, SPRING, YA, 0, BRICK, T.brick, 6)
    // the reveals: the bay's sides, back to the recess
    slab(out, f, m - R - 0.01, m + R + 0.01, -0.45, 0, A0, A0 + 0.01, DEEP, T.brick, true)
  }
  // the piers: paired colonnettes on a brick pier, a carved capital at the springing
  for (let i = 0; i <= n; i++) {
    const u = pav + i * b
    const u0 = i === 0 ? u : u - pw / 2
    const u1 = i === n ? u : u + pw / 2
    slab(out, f, u0, u1, -0.45, 0, A0, SPRING, BRICK, T.brick, false)
    // (one round shaft, half proud of the pier; at the pavilions' edges a slimmer one)
    const end = i === 0 || i === n
    colonnette(out, f, end ? u + (i === 0 ? 0.28 : -0.28) : u, 0.02, A0 + 0.4, SPRING - 0.45, end ? 0.24 : 0.4, BRICK, T.brick)
    slab(out, f, Math.max(u0, u - 0.65) - 0.05, Math.min(u1, u + 0.65) + 0.05, -0.1, 0.32, SPRING - 0.45, SPRING, FRIEZE, T.terra, true, false, true)
    slab(out, f, Math.max(u0, u - 0.65) - 0.05, Math.min(u1, u + 0.65) + 0.05, -0.1, 0.32, A0, A0 + 0.4, FRIEZE, T.terra, true)
  }

  // ---- the frieze, the ninth storey, the corbelled band, the attic of small paired windows
  band(out, f, ends, -0.5, 0.14, YA, YF, FRIEZE, T.terra)
  punched(out, f, 0, L, 0, YF, S9, [{ a: YF + 0.6, b: S9 - 0.45, cols: [...pavCols(0.7), ...bayCols(w2)] }], BRICK, T.brick)
  band(out, f, ends, -0.5, 0.32, S9, S9B, TRIM, T.terra)
  punched(out, f, 0, L, 0, S9B, S10, [{ a: S9B + 0.6, b: S10 - 0.5, cols: [...pavCols(0.6), ...pairCols(0.55)] }], BRICK, T.brick)

  // ---- the cornice on its brackets, the parapet
  band(out, f, ends, -0.5, 0.3, S10, CORN, TRIM, T.terra)
  for (let u = 0.8; u < L - 0.5; u += 1.45) slab(out, f, u - 0.13, u + 0.13, 0.3, 1.05, CORN - 0.5, CORN, TRIM, T.terra, false, false, true)
  band(out, f, ends, -0.5, 1.2, CORN, CORN_TOP, TRIM, T.terra)
  band(out, f, ends, -0.45, 0.02, CORN_TOP, PARAPET, BRICK, T.brick, true)
}

/** The Montgomery Street arch (HABS CA-2223-3): three carved orders, clustered colonnettes, a flat surround. */
function montgomeryArch(out: MeshBuilder, f: Fr, m: number, drop: number, sill: number): void {
  const r = 2.7                     // the opening
  const sp = 4.6                    // its springing
  const rO = 4.4                    // the outermost order
  const W = 5.6                     // the surround's half-width
  // the doors and the fanlight, deep in the opening
  panel(out, f, m - r, m + r, -0.35, -drop, sp + r, DOOR)
  slab(out, f, m - r, m + r, -0.35, -0.2, sp - 1.25, sp - 1.05, CARVE, T.marble, true, false, true)
  slab(out, f, m - 0.07, m + 0.07, -0.35, -0.25, sill, sp - 1.25, CARVE, T.marble, false)
  // the reveal of the opening
  slab(out, f, m - r - 0.01, m - r, -0.35, 0.05, -drop, sp, MARBLE, T.marble, false)
  slab(out, f, m + r, m + r + 0.01, -0.35, 0.05, -drop, sp, MARBLE, T.marble, false)
  // the orders: receding rings, the inner two carved
  ring(out, f, m, r, r + 0.5, sp, 0.05, CARVE, T.marble, 8)
  ring(out, f, m, r + 0.5, r + 1.05, sp, 0.16, MARBLE, T.marble, 8)
  ring(out, f, m, r + 1.05, rO, sp, 0.27, CARVE, T.marble, 8)
  ring(out, f, m, rO, rO + 0.35, sp, 0.4, MARBLE, T.marble, 8)
  // the surround to the cornice, its ends closed back to the wall
  archHead(out, f, m, rO + 0.35, W, sp, B, 0.32, MARBLE, T.marble, 8)
  slab(out, f, m - W, m - W + 0.01, 0.05, 0.32, sp, B, MARBLE, T.marble, false)
  slab(out, f, m + W - 0.01, m + W, 0.05, 0.32, sp, B, MARBLE, T.marble, false)
  // the jambs: four colonnettes a side on a plinth, under a carved impost
  for (const s of [-1, 1]) {
    const a = s < 0 ? m - W : m + rO + 0.35
    const c = s < 0 ? m - rO - 0.35 : m + W
    slab(out, f, a, c, 0.05, 0.32, -drop, sp, MARBLE, T.marble, false)
    const j0 = s < 0 ? m - rO - 0.35 : m + r
    const j1 = s < 0 ? m - r : m + rO + 0.35
    panel(out, f, j0, j1, 0.05, -drop, sp, CARVE, T.marble)
    for (let k = 0; k < 4; k++) colonnette(out, f, m + s * (r + 0.25 + k * 0.47), 0.15, 0.7, sp - 0.55, 0.17, MARBLE, T.marble)
    slab(out, f, j0, j1, 0.05, 0.38, -drop, 0.7, MARBLE, T.marble, true)
    slab(out, f, Math.min(a, j0) - 0.05, Math.max(c, j1) + 0.05, 0.05, 0.45, sp - 0.55, sp, CARVE, T.marble, true, false, true)
  }
  // the step (two where Montgomery's pavement stands below the threshold)
  slab(out, f, m - r - 0.4, m + r + 0.4, -0.35, 0.7, -drop, sill + 0.16, MARBLE, T.marble, true)
}

/** A party wall: plain brick, a grid of windows where it shows over its neighbours, a coping. */
function plainWall(out: MeshBuilder, f: Fr, y1: number, drop: number, inset: number, c: Rgb, windows: boolean): void {
  panel(out, f, 0, f.L, -inset, -drop, y1, c, T.brick)
  if (!windows) return
  const n = Math.max(1, Math.round(f.L / 3.2))
  const b = f.L / n
  for (let k = 0; k < 8; k++) {
    const y = BC + 0.7 + k * 3.8
    if (y + 2 > y1 - 1.5) break
    for (let i = 0; i < n; i++) panel(out, f, i * b + b / 2 - 0.65, i * b + b / 2 + 0.65, 0.03, y, y + 2.0, GLASS)
  }
}

function millsBuilding(out: MeshBuilder, fit: Fit): void {
  const ring0 = simplifyRing(ringOf(fit), 0.5)
  const N = ring0.length
  const len = (i: number): number => frameOf(ring0[(i + N) % N], ring0[(i + 1 + N) % N]).L
  // Bush: the longest edge; Montgomery: the longer of its neighbours; the shorter is the tower's wall
  let bush = 0
  for (let i = 1; i < N; i++) if (len(i) > len(bush)) bush = i
  const prev = (bush - 1 + N) % N
  const next = (bush + 1) % N
  const mont = len(prev) >= len(next) ? prev : next
  const east = mont === prev ? next : prev
  const FB = frameOf(ring0[bush], ring0[next])
  const FM = frameOf(ring0[mont], ring0[(mont + 1) % N])
  // the street datum: the city sinks a model to its lowest ground. Taken on Bush at the tower's corner, the point the
  // tower takes its own from, so the two marble cornices run on at one height; Bush falls away from Montgomery, and
  // the door stands that much higher on its own pavement (its step makes it up)
  const montFirst = mont === prev
  const corner = pt(FB, montFirst ? FB.L : 0, 2)
  const door = pt(FM, FM.L / 2, 2)
  const drop = fit.groundAt ? Math.max(0, Math.min(6, fit.groundAt(corner.x, corner.z))) : 0
  const sill = fit.groundAt ? Math.max(0, Math.min(1.2, fit.groundAt(door.x, door.z) - drop)) : 0
  const v0 = out.positions.length

  // which front owns the Montgomery/Bush corner (Bush), and which ends stop against the other
  const bushEnds: Ends = { own0: montFirst, own1: !montFirst, cut0: false, cut1: false }
  const montEnds: Ends = { own0: false, own1: false, cut0: !montFirst, cut1: montFirst }
  millsFront(out, FB, bushEnds, false, drop, 0)
  millsFront(out, FM, montEnds, true, drop, sill)
  for (let i = 0; i < N; i++) {
    if (i === bush || i === mont) continue
    const f = frameOf(ring0[i], ring0[(i + 1) % N])
    // the tower's wall: the tower draws it; this one stands just inside, out of its way
    if (i === east) plainWall(out, f, ROOF_Y, drop, 0.23, BRICK, false)
    else plainWall(out, f, PARAPET, drop, 0, BRICK, f.L > 4)
  }
  capPolygon(out, ring0, ROOF_Y, ROOF, T.brick)

  // the penthouse and the flagpole (HABS, from above Montgomery)
  let dMax = 0
  for (const p of ring0) dMax = Math.max(dMax, -((p.x - FB.ox) * FB.nx + (p.z - FB.oz) * FB.nz))
  const uc = FB.L * 0.45
  const dc = dMax * 0.5
  slab(out, FB, uc - 5, uc + 5, -dc - 3, -dc + 3, ROOF_Y, ROOF_Y + 2.8, BRICK, T.brick, true, true)
  const fp = pt(FB, uc, -dc)
  prism(out, fp.x, fp.z, ROOF_Y + 2.8, ROOF_Y + 14, 0.09, 6, [0.86, 0.86, 0.84], T.metal, 0.05)

  if (drop > 0) for (let k = v0 + 1; k < out.positions.length; k += 3) out.positions[k] += drop
}

// ============================================================================================ the Mills Tower

/** The tower's datums: 22 storeys, the top one an attic under the cornice; its bands 5 cm off the building's. */
const E = 0.05

function towerFace(out: MeshBuilder, f: Fr, ends: Ends, short: boolean, H: number, drop: number): void {
  const L = f.L
  const n = short ? 3 : Math.max(2, Math.round(L / 4.4))
  const b = L / n
  const pitch = (H - 4 - BC) / 20
  const top = (k: number): number => BC + (k - 2) * pitch      // the top of storey k (3..22)
  const pw = Math.min(1.1, b * 0.25)
  const r = (b - pw) / 2
  const crown = top(21) - 0.35
  const spring = crown - r
  const mid = (i: number): number => (i + 0.5) * b
  const cols = (hw: number): [number, number][] => Array.from({ length: n }, (_, i) => [mid(i) - hw, mid(i) + hw] as [number, number])
  const pairs = (hw: number): [number, number][] => Array.from({ length: n }, (_, i) => [[mid(i) - b * 0.22 - hw, mid(i) - b * 0.22 + hw], [mid(i) + b * 0.22 - hw, mid(i) + b * 0.22 + hw]] as [number, number][]).flat()

  panel(out, f, 0, L, -0.75, -drop, top(22), GLASS)
  // ---- the marble base, its door between pilasters on the street ends, the cornice
  punched(out, f, 0, L, 0.1, -drop, B, [{ a: 0.4, b: G - 0.5, cols: cols(b / 2 - 0.65) }, { a: G + 0.9, b: B - 0.8, cols: cols(Math.min(0.95, b * 0.21)) }], MARBLE, T.marble)
  band(out, f, ends, -0.2, 0.25, -drop, 0.45, MARBLE, T.marble)
  for (const [a, c] of cols(Math.min(0.95, b * 0.21))) slab(out, f, a - 0.15, c + 0.15, 0.1, 0.27, G + 0.75, G + 0.9, MARBLE, T.marble)
  if (short) {
    const m = mid(1)
    for (const s of [-1, 1]) {
      const u = m + s * (b / 2)
      slab(out, f, u - 0.45, u + 0.45, 0.1, 0.32, -drop, G, MARBLE, T.marble, false)
      slab(out, f, u - 0.6, u + 0.6, 0.1, 0.42, G - 0.55, G, CARVE, T.marble, true, false, true)
    }
    slab(out, f, m - b / 2 + 0.45, m + b / 2 - 0.45, 0.1, 0.25, G - 1.4, G - 0.5, MARBLE, T.marble, true, false, true)
    slab(out, f, m - 1.1, m + 1.1, 0.1, 0.6, -drop, 0.16, MARBLE, T.marble, true)
  }
  band(out, f, ends, -0.5, 0.65 + E, B + E, BC + E, MARBLE, T.marble)

  // ---- the third storey and its band
  punched(out, f, 0, L, 0, BC + E, top(3), [{ a: BC + 0.75, b: top(3) - 0.45, cols: cols(b / 2 - 0.8) }], TOWER_BRICK, T.brick)
  band(out, f, ends, -0.5, 0.2 + E, top(3), top(3) + 0.4, FRIEZE, T.terra)

  // ---- the shaft: continuous piers, a recessed spandrel a floor, a mullion a bay; round heads to the top windows
  const y0 = top(3) + 0.4
  for (let k = 4; k <= 19; k++) panel(out, f, 0, L, -0.3, top(k) - 0.3, top(k) + 0.85, DEEP, T.brick)
  for (let i = 0; i < n; i++) {
    const m = mid(i)
    panel(out, f, m - 0.18, m + 0.18, -0.22, y0, spring + r * 0.7, TOWER_BRICK, T.brick)
    archHead(out, f, m, r, b / 2, spring, top(21), 0, TOWER_BRICK, T.brick, 5)
  }
  for (let i = 0; i <= n; i++) {
    const end = i === 0 || i === n
    const half = end ? pw * 0.7 : pw / 2
    // (a corner pier belongs to the short end; the long side's stops where it begins)
    const a = Math.max(i === 0 && ends.cut0 ? 0.76 : 0, i * b - half)
    const c = Math.min(i === n && ends.cut1 ? L - 0.76 : L, i * b + half)
    if (c > a + 0.05) slab(out, f, a, c, -0.75, 0, y0, spring, TOWER_BRICK, T.brick, false)
  }

  // ---- the frieze, the attic, the cornice on its brackets, the parapet
  band(out, f, ends, -0.5, 0.15 + E, top(21), top(21) + 0.8, FRIEZE, T.terra)
  punched(out, f, 0, L, 0, top(21) + 0.8, top(22), [{ a: top(21) + 1.3, b: top(22) - 0.5, cols: pairs(0.5) }], TOWER_BRICK, T.brick)
  band(out, f, ends, -0.5, 0.3 + E, top(22), top(22) + 0.8, TRIM, T.terra)
  for (let u = 0.8; u < L - 0.5; u += 1.45) slab(out, f, u - 0.13, u + 0.13, 0.3 + E, 1.05, top(22) + 0.3, top(22) + 0.8, TRIM, T.terra, false, false, true)
  band(out, f, ends, -0.5, 1.2 + E, top(22) + 0.8, top(22) + 1.65, TRIM, T.terra)
  band(out, f, ends, -0.45, 0.02, top(22) + 1.65, top(22) + 2.6, TOWER_BRICK, T.brick, true)
}

function millsTower(out: MeshBuilder, fit: Fit): void {
  const ring0 = simplifyRing(ringOf(fit), 0.5)
  const N = ring0.length
  const H = fit.height || 92
  const frames = ring0.map((p, i) => frameOf(p, ring0[(i + 1) % N]))
  const longest = Math.max(...frames.map((f) => f.L))
  const short = frames.map((f) => f.L < longest * 0.6)
  // the street datum: Bush is the lower of the two short ends (the other backs onto the block)
  let drop = 0
  if (fit.groundAt) {
    // on Bush, at its corner with the building (the higher one: Bush falls away from Montgomery), the point the
    // building takes its own datum from
    const at = (f: Fr, u: number): number => { const p = pt(f, u, 1.5); return fit.groundAt!(p.x, p.z) }
    const ends = frames.filter((_, i) => short[i]).sort((p, q) => at(p, p.L / 2) - at(q, q.L / 2))
    drop = ends.length ? Math.max(0, Math.min(6, Math.max(at(ends[0], 0), at(ends[0], ends[0].L)))) : 0
  }
  const v0 = out.positions.length
  frames.forEach((f, i) => {
    // the short ends own the corners; the long sides stop short of them
    const ends: Ends = short[i]
      ? { own0: true, own1: true, cut0: false, cut1: false }
      : { own0: false, own1: false, cut0: true, cut1: true }
    towerFace(out, f, ends, short[i], H, drop)
  })
  capPolygon(out, ring0, H - 4 + 1.55, ROOF, T.brick)
  // the flagpole over Bush
  const c = ring0.reduce((a, p) => ({ x: a.x + p.x / N, z: a.z + p.z / N }), { x: 0, z: 0 })
  prism(out, c.x, c.z, H - 4 + 1.55, H + 6, 0.08, 6, [0.86, 0.86, 0.84], T.metal, 0.05)
  if (drop > 0) for (let k = v0 + 1; k < out.positions.length; k += 3) out.positions[k] += drop
}

export const MILLS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** relation/3492808 — the Mills Building, 220 Montgomery Street. */
  millsBuilding_3492808: millsBuilding,
  /** way/256066232 — the Mills Tower, 220 Bush Street. */
  millsTower,
}
