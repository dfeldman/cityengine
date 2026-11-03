/**
 * The Philharmonie de Paris (Jean Nouvel, 2015) at the Porte de Pantin: a faceted hill of pale grey tiles with a tall
 * dark blade along its south edge, the "eye" cut under the blade with the concert hall's chrome waves inside it, and the
 * ramps climbing to it from the plaza.
 *
 * Built from measurements, not from the photographs' impressions (PARIS_BUGS.md #16–17: the Blender model was "perhaps
 * 50% accurate"): IGN's LiDAR HD surface model (MNS, 0.5 m) over the building, its HR orthophoto, OSM's outline
 * (way/21502894) and the owner's annotated photographs (2026-11-02: the slab, the eye, the ramps, the spiral, the rear).
 * Everything here is in METRES EAST and NORTH of the outline's centroid (48.891768 N, 2.394414 E) and metres above the
 * park's ground, and `frame()` registers that onto whatever footprint the loader hands the builder.
 *
 * What the lidar says (heights above the park, which the Périphérique side sits 5 m above):
 *   - the roof summit is a nearly flat polygon at 36.5–37 m over the middle; the eaves 31–34 m; the whole roof tilts
 *     down to the north, 30 m at N+40, 24 at N+52, 17 at N+70, with six sawtooth fins lying on that slope;
 *   - the SLAB's top is a strip 9 m wide at 47 m (west) rising to 52 m (east), bearing 70°, from a tip at the
 *     south-west corner that comes down to the ground to a cantilevered end past the street corner; its south face
 *     stands nearly vertical above the eye's upper lip, and its west end leans back over a steep north-west face;
 *   - the eye's UPPER LIP is a thick visor whose top is a 33–35 m plateau 8–11 m deep; its LOWER LIP the 12.5 m
 *     terrace; the opening between them holds the waves;
 *   - east of the eye a wedge slopes from 35 m under the slab down to 27 m at its south-east edge, the X on its face;
 *   - terraces at 10 m (west), 21 m (north-west), 19 m (east, along the Périphérique); a 16 m block and a 6 m tip at
 *     the north end; the ramp's deck at 12.5 m south of the eye, the plaza at 0.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

const FIXED = 0
/** the cladding: small mirror-like tiles, drawn by the landmark material's `mirror` surface — each tile at its own
 *  tilt, half of them polished, so for any eye some flash and some stay dark (owner, 2026-11-03) */
const MIRROR = surfaceTag('mirror')
/** the forecourt, the deck and the ramps: a tessellation of pale stone tiles with grey ones scattered through it
 *  (owner, 2026-11-03: "NOT metal, it's a unique multishade tessellation of tiles") */
const TESSERA = surfaceTag('tessera')
/** the foyer's glazing under the lifted roof: the sky in it */
const GLAZED = surfaceTag('glass')

type V3 = [number, number, number]
type P2 = [number, number]

/** OSM's outline, metres east/north of its centroid, anticlockwise — the same ring the loader fits. */
const RING: P2[] = [[-73.2, 38.9], [-61.6, -41.0], [-53.8, -72.0], [-39.0, -69.6], [-34.0, -68.5], [-19.9, -63.3], [-5.5, -57.8],
  [28.6, -45.0], [40.3, -40.6], [31.1, -37.2], [31.9, -11.2], [31.3, 0.5], [28.1, 33.4], [25.8, 50.5], [22.7, 44.5], [18.1, 71.3],
  [23.4, 75.7], [16.8, 104.3], [-11.0, 87.1]]

// the tiles: pale and mottled on the roof, darker on the blade; the rest
const TILE: Rgb = [0.54, 0.55, 0.57]
const TILE_DARK: Rgb = [0.36, 0.38, 0.41]
const PALE: Rgb = [0.72, 0.72, 0.70]
const CONCRETE: Rgb = [0.68, 0.66, 0.62]
const GLASS: Rgb = [0.12, 0.14, 0.16]
const VOID: Rgb = [0.05, 0.05, 0.06]
const SOLAR: Rgb = [0.24, 0.27, 0.34]
const CHROME: Rgb = [0.93, 0.95, 0.98]
const CHROME_DARK: Rgb = [0.22, 0.25, 0.29]

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const tone = (c: Rgb, f: number): Rgb => [c[0] * f, c[1] * f, c[2] * f]
/** a deterministic jitter in [0, 1) for the mottling, from a cell's position */
const hash = (a: number, b: number): number => {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
  return s - Math.floor(s)
}

/**
 * The frame: (east, north, height) → the builder's local (x, y, z). The loader gives `fit.ring` as OSM's outline in its
 * frame, the same vertices as RING in some cyclic order, forward or reversed — so an affine map fitted over the best
 * correspondence recovers its rotation (and the east/north → x/z handedness) exactly. Without a ring (tests, a bare
 * `?model=`), the frame the loader computes for the manifest's bearing of 260° is used.
 */
function frame(fit: Fit): { p: (e: number, n: number, h: number) => V3; n: (v: V3) => V3 } {
  // x = a e + b n + c; z = d e + f n + g. The nominal frame: the city's x is east and z north (city/geo.ts), and
  // fitSnug(ring, 260) turns it 81.5° about a centre at (−18.9 E, +16.1 N): the eye lands at local (+75, −12), the park
  // side at −z
  let M: [number, number, number, number, number, number] = [0.14781, -0.98902, 18.707, 0.98902, 0.14781, 16.326]
  const ring = fit.ring
  if (ring && ring.length === RING.length) {
    const n = RING.length
    let best = Infinity
    for (const dir of [1, -1]) {
      for (let k = 0; k < n; k++) {
        // least squares for x and for z over the pairing RING[i] ↔ ring[(k + dir·i) mod n]
        let see = 0, sen = 0, se = 0, snn = 0, sn = 0, sx = 0, sxe = 0, sxn = 0, sz = 0, sze = 0, szn = 0
        for (let i = 0; i < n; i++) {
          const [e, nn] = RING[i]
          const q = ring[(((k + dir * i) % n) + n) % n]
          see += e * e; sen += e * nn; se += e; snn += nn * nn; sn += nn
          sx += q.x; sxe += q.x * e; sxn += q.x * nn; sz += q.z; sze += q.z * e; szn += q.z * nn
        }
        // normal equations [see sen se; sen snn sn; se sn n]·[a b c] = [sxe sxn sx], by Cramer
        const det = see * (snn * n - sn * sn) - sen * (sen * n - sn * se) + se * (sen * sn - snn * se)
        if (Math.abs(det) < 1e-6) continue
        const solve = (r0: number, r1: number, r2: number): [number, number, number] => [
          (r0 * (snn * n - sn * sn) - sen * (r1 * n - sn * r2) + se * (r1 * sn - snn * r2)) / det,
          (see * (r1 * n - sn * r2) - r0 * (sen * n - sn * se) + se * (sen * r2 - r1 * se)) / det,
          (see * (snn * r2 - r1 * sn) - sen * (sen * r2 - r1 * se) + r0 * (sen * sn - snn * se)) / det,
        ]
        const [a, b, c] = solve(sxe, sxn, sx)
        const [d, f, g] = solve(sze, szn, sz)
        let err = 0
        for (let i = 0; i < n; i++) {
          const [e, nn] = RING[i]
          const q = ring[(((k + dir * i) % n) + n) % n]
          err += (a * e + b * nn + c - q.x) ** 2 + (d * e + f * nn + g - q.z) ** 2
        }
        if (err < best) { best = err; M = [a, b, c, d, f, g] }
      }
    }
  }
  if (ring && ring.length >= 4 && ring.length !== RING.length) {
    // the bake may have simplified the outline: take the rotation from its longest edge (the park side, 81 m, which
    // survives any simplification) in both senses, the centre from the box the loader centred it in, and keep the
    // sense whose vertices land nearest the given ones
    const longest = (r: P2[]): P2 => {
      let best: P2 = [1, 0], L = 0
      for (let i = 0; i < r.length; i++) {
        const p = r[i], q = r[(i + 1) % r.length]
        const l = Math.hypot(q[0] - p[0], q[1] - p[1])
        if (l > L) { L = l; best = [(q[0] - p[0]) / l, (q[1] - p[1]) / l] }
      }
      return best
    }
    const mine = longest(RING)                                   // east/north
    const theirs = longest(ring.map((p) => [p.x, p.z] as P2))    // local x/z
    let best = Infinity
    for (const flip of [1, -1]) for (const mirror of [1, -1]) {
      // the map turns (e, n) — or its mirror (e, −n), should the bake have handed the ring the other way up — so that
      // the longest edge lands on theirs, in either sense
      const [ex, en] = [mine[0], mine[1] * mirror], [tx, tz] = [theirs[0] * flip, theirs[1] * flip]
      const th = Math.atan2(tz, tx) - Math.atan2(en, ex)
      const c = Math.cos(th), s = Math.sin(th)
      const a = c, b = -s * mirror, d = s, f = c * mirror    // x = c e − s n' ; z = s e + c n' with n' = mirror·n
      // centre: the given ring's box is centred on the origin
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const [e, n] of RING) { const x = a * e + b * n, z = d * e + f * n; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z) }
      const cc = -(x0 + x1) / 2, gg = -(z0 + z1) / 2
      let err = 0
      for (const [e, n] of RING) {
        const x = a * e + b * n + cc, z = d * e + f * n + gg
        let near = Infinity
        for (const q of ring) near = Math.min(near, (q.x - x) ** 2 + (q.z - z) ** 2)
        err += near
      }
      if (err < best) { best = err; M = [a, b, cc, d, f, gg] }
    }
  }
  const [a, b, c, d, f, g] = M
  const y0 = fit.grade ?? 0.5
  return {
    p: (e, n, h) => [a * e + b * n + c, y0 + h, d * e + f * n + g],
    n: (v) => [a * v[0] + b * v[1], v[2], d * v[0] + f * v[1]],
  }
}

export function philharmonie(out: MeshBuilder, fit: Fit): void {
  const F = frame(fit)
  const P = F.p

  // ---- the primitives, all in east/north/height
  /** a planar polygon as a fan; `inside` a point the face must look away from */
  // the surface tag every face takes until it is changed: FIXED (flat colour) or MIRROR (the tiles)
  let tag = FIXED
  const poly = (pts: V3[], colour: Rgb, inside: V3): void => {
    if (pts.length < 3) return
    // Newell's normal in east/north/height (east × north = up)
    let nx = 0, ny = 0, nz = 0
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length]
      nx += (p[1] - q[1]) * (p[2] + q[2]); ny += (p[2] - q[2]) * (p[0] + q[0]); nz += (p[0] - q[0]) * (p[1] + q[1])
    }
    const l = Math.hypot(nx, ny, nz)
    if (l < 1e-6) return
    nx /= l; ny /= l; nz /= l
    const c: V3 = [0, 0, 0]
    for (const p of pts) { c[0] += p[0] / pts.length; c[1] += p[1] / pts.length; c[2] += p[2] / pts.length }
    if ((c[0] - inside[0]) * nx + (c[1] - inside[1]) * ny + (c[2] - inside[2]) * nz < 0) { nx = -nx; ny = -ny; nz = -nz }
    const n = F.n([nx, ny, nz])
    for (let i = 1; i + 1 < pts.length; i++) {
      out.quad([P(...pts[0]), P(...pts[i]), P(...pts[i + 1]), P(...pts[i + 1])], n, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
    }
  }
  /** a quad split into cells of about `cell` metres, each its own tone: the mottled tiles (the city's sun makes even a
   *  few percent read as blocks — the blade is kept all but uniform, the roof's facets carry the variation) */
  const mottled = (q: [V3, V3, V3, V3], colour: Rgb, inside: V3, cell = 7, spread = 0.04): void => {
    const [p00, p10, p11, p01] = q
    const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
    const at = (u: number, v: number): V3 => lerp(lerp(p00, p10, u), lerp(p01, p11, u), v)
    const nu = Math.max(1, Math.round(Math.hypot(p10[0] - p00[0], p10[1] - p00[1], p10[2] - p00[2]) / cell))
    const nv = Math.max(1, Math.round(Math.hypot(p01[0] - p00[0], p01[1] - p00[1], p01[2] - p00[2]) / cell))
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const t = 1 + (hash(p00[0] + i * 3.1 + p00[1], p00[2] + j * 1.7) - 0.5) * 2 * spread
        poly([at(i / nu, j / nv), at((i + 1) / nu, j / nv), at((i + 1) / nu, (j + 1) / nv), at(i / nu, (j + 1) / nv)], tone(colour, t), inside)
      }
    }
  }
  const centroid = (ring: P2[]): P2 => {
    const c: P2 = [0, 0]
    for (const p of ring) { c[0] += p[0] / ring.length; c[1] += p[1] / ring.length }
    return c
  }
  /** a prism over a plan polygon, floor and ceiling flat or planes h(e, n); the sides `side`, the top `top` */
  const prism = (ring: P2[], lo: number | ((e: number, n: number) => number), hi: number | ((e: number, n: number) => number),
                 side: Rgb, top: Rgb | null = side, bottom: Rgb | null = null, mottle = 0): void => {
    const L = typeof lo === 'number' ? () => lo : lo
    const H = typeof hi === 'number' ? () => hi : hi
    const c = centroid(ring)
    const mid: V3 = [c[0], c[1], (L(c[0], c[1]) + H(c[0], c[1])) / 2]
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length]
      const q: [V3, V3, V3, V3] = [[a[0], a[1], L(...a)], [b[0], b[1], L(...b)], [b[0], b[1], H(...b)], [a[0], a[1], H(...a)]]
      if (mottle) mottled(q, side, mid, mottle)
      else poly(q, side, mid)
    }
    if (top) poly(ring.map(([e, n]) => [e, n, H(e, n)] as V3), top, [mid[0], mid[1], mid[2] - 1000])
    if (bottom) poly(ring.map(([e, n]) => [e, n, L(e, n)] as V3), bottom, [mid[0], mid[1], mid[2] + 1000])
  }
  /**
   * A roof lofted between an outer ring (each vertex with its own height) and an inner ring at one height: the hill's
   * facets. Both rings anticlockwise and star-shaped about the inner ring's centre; walked by angle.
   */
  const loft = (outer: V3[], inner: V3[], colour: Rgb, jitter = 0.05): void => {
    const c = centroid(inner.map((p) => [p[0], p[1]] as P2))
    const ang = (p: V3): number => Math.atan2(p[1] - c[1], p[0] - c[0])
    // start both at their smallest angle so the walk is monotonic
    const sortBy = (r: V3[]): V3[] => [...r].sort((p, q) => ang(p) - ang(q))
    const A = sortBy(outer), B = sortBy(inner)
    const below: V3 = [c[0], c[1], -1000]
    let i = 0, j = 0
    let k = 0
    const tri = (p: V3, q: V3, r: V3): void => poly([p, q, r], tone(colour, 1 + (hash(k++, 3) - 0.5) * 2 * jitter), below)
    while (i < A.length || j < B.length) {
      const a0 = A[i % A.length], a1 = A[(i + 1) % A.length], b0 = B[j % B.length], b1 = B[(j + 1) % B.length]
      const na = i < A.length ? ang(a1) + (i + 1 >= A.length ? Math.PI * 2 : 0) : Infinity
      const nb = j < B.length ? ang(b1) + (j + 1 >= B.length ? Math.PI * 2 : 0) : Infinity
      if (na <= nb) { tri(a0, a1, b0); i++ } else { tri(a0, b1, b0); j++ }
    }
  }
  const beamAt = (a: V3, b: V3, r: number, colour: Rgb, rv = r): void => {
    // a square tube between two points in east/north/height
    const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const len = Math.hypot(...d)
    if (len < 1e-3) return
    const dn: V3 = [d[0] / len, d[1] / len, d[2] / len]
    let u: V3 = [-dn[1], dn[0], 0]
    const ul = Math.hypot(u[0], u[1])
    u = ul < 1e-3 ? [1, 0, 0] : [u[0] / ul, u[1] / ul, 0]
    const v: V3 = [dn[1] * u[2] - dn[2] * u[1], dn[2] * u[0] - dn[0] * u[2], dn[0] * u[1] - dn[1] * u[0]]
    const c = (p: V3, su: number, sv: number): V3 => [p[0] + u[0] * r * su + v[0] * rv * sv, p[1] + u[1] * r * su + v[1] * rv * sv, p[2] + u[2] * r * su + v[2] * rv * sv]
    const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
    for (const [su0, sv0, su1, sv1] of [[1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1], [-1, -1, 1, -1]] as const) {
      poly([c(a, su0, sv0), c(b, su0, sv0), c(b, su1, sv1), c(a, su1, sv1)], colour, mid)
    }
    poly([c(a, -1, -1), c(a, 1, -1), c(a, 1, 1), c(a, -1, 1)], colour, mid)
    poly([c(b, -1, -1), c(b, 1, -1), c(b, 1, 1), c(b, -1, 1)], colour, mid)
  }

  // ---- the slab's axis: its top strip's centre line, bearing 70°, through (−22, −50.5)
  const U: P2 = [0.938, 0.347]            // along the slab, west → east
  const Q: P2 = [0.347, -0.938]           // across it, toward the south-east (out of the building)
  const C0: P2 = [-22, -50.5]
  const along = (s: number, q: number): P2 => [C0[0] + U[0] * s + Q[0] * q, C0[1] + U[1] * s + Q[1] * q]
  const sOf = (e: number, n: number): number => (e - C0[0]) * U[0] + (n - C0[1]) * U[1]
  const qOf = (e: number, n: number): number => (e - C0[0]) * Q[0] + (n - C0[1]) * Q[1]
  const topH = (s: number): number => 49.2 + 0.05 * s   // 47 at the west tip (s −43), 52.5 at the east end (s 66)
  const S_W = -43, S_E = 66
  // the top's half-width: the owner's close-up from the street corner (2026-11-02) shows a thin blade with a sharp top
  // edge, not the 9 m band the lidar's resampling drew — 5.5 m, the solar strip filling most of it
  const HALF = 2.75
  const VISOR_TOP = 34.6, VISOR_BOT = 31.4
  const LIP = 12.5                                     // the eye's floor, the ramps' arrival
  const GAP_H = 26                                     // the sky gap: nothing stands in the eye's lower left below this
  const BASE = -3                                      // below the ground, so no gap shows on a slope

  // ================================================================ the body under everything
  // the lower mass over OSM's whole outline, dark glass to 10 m (the plaza-level floors), the deck south of the eye
  // (short of the north tip, which is a single storey: the lidar reads 6 m there, not 10)
  prism([...RING.slice(0, 17), [-25.3, 76]], BASE, 10, GLASS, CONCRETE)
  tag = TESSERA                                        // the deck and the terrace under the eye are paved
  const DECK: P2[] = [[-40, -62], [-34, -70], [-33, -78], [-25, -86], [-6, -86], [0, -80], [4, -74], [6, -62]]
  prism(DECK, BASE, LIP, GLASS, CONCRETE)
  // the eye's lower lip: a thick pale edge along the deck's front, and a low parapet along it
  const lipEdge: P2[] = [[-44, -66], [-34, -70], [-6, -70.5], [6, -62]]
  for (let i = 0; i + 1 < lipEdge.length; i++) {
    const a = lipEdge[i], b = lipEdge[i + 1]
    beamAt([a[0], a[1], LIP - 0.9], [b[0], b[1], LIP - 0.9], 0.9, PALE, 0.9)
  }
  // the terrace under the eye between the deck and the slab's foot, and its parapet
  prism([[-44, -62], [-44, -70], [-6, -71], [8, -60], [8, -52], [-40, -60]], 10, LIP, PALE, CONCRETE)

  tag = FIXED
  // ================================================================ the hill: eaves, summit, the north slope
  // the eave ring, anticlockwise from the south-west corner, each vertex at its own height (lidar)
  // few vertices on purpose: the real roof is a handful of big planes meeting at crisp folds, and every extra eave
  // vertex is another facet (the first version's 21 made a crumpled dome). The north end is the pleated tongue
  // running down to 12 m at N+84.
  tag = MIRROR                                         // the hill is tiled all over
  const EAVE: V3[] = [
    [-54, -37, 34], [-58, -30, 32], [-58, 24, 32], [-48, 40, 30], [-30, 54, 26], [-14, 68, 19], [-4, 78, 14], [8, 85, 12],
    [17, 82, 12.5], [21, 60, 20], [22, 30, 29], [22, -30, 33], [19, -36, 34],
    // the south edge runs along the slab's back
    [...along(40, -HALF), 35], [...along(-12, -HALF), 35], [-46, -52, 34], [-50, -45, 34],
  ]
  const SUMMIT: V3[] = [[-30, -30, 36.8], [12, -30, 36.8], [18, -8, 37], [10, 12, 36.6], [-14, 16, 36.5], [-34, 2, 36.4]]
  loft(EAVE, SUMMIT, TILE, 0)
  poly(SUMMIT, tone(TILE, 1.02), [-8, -8, -1000])
  // the walls under the eaves, from the plaza-level floors to the eave: tiles, mottled
  // (lifted clear of the ground at the south-west corner — the owner: the roof "almost touches the ground on the back
  // right corner", and the eye's lower left looks straight through under it to the sky)
  // the roof is lifted clear of the plaza-level floors along the whole west flank and round the south-west corner:
  // the foyer's glazing stands there from 10 m up to the roof's underside, and the eye's lower left looks through it
  // (the owner's sky gap — the sky in the glass reads as the sky beyond it, which is what the photographs show)
  const eaveLo = (e: number, n: number): number => (e < -50 || (n < -28 && e < -28) ? GAP_H : 10)
  const eaveHi = (e: number, n: number): number => {
    // the eave height at (e, n): the nearest eave vertex's
    let best = EAVE[0]
    for (const v of EAVE) if (Math.hypot(v[0] - e, v[1] - n) < Math.hypot(best[0] - e, best[1] - n)) best = v
    return best[2]
  }
  for (let i = 0; i < EAVE.length; i++) {
    // not the south edge across the eye (along(40) → along(−12)): the hollow's own walls stand behind it, and a wall
    // here closed the sky gap at the eye's lower left (owner, 2026-11-03: "did we lose the notch?")
    if (i === 13) continue
    const a = EAVE[i], b = EAVE[(i + 1) % EAVE.length]
    mottled([[a[0], a[1], eaveLo(a[0], a[1])], [b[0], b[1], eaveLo(b[0], b[1])], [b[0], b[1], eaveHi(b[0], b[1])], [a[0], a[1], eaveHi(a[0], a[1])]], TILE, [-8, -8, 20], 5)
    if (eaveLo(a[0], a[1]) > 10 || eaveLo(b[0], b[1]) > 10) {
      tag = GLAZED
      poly([[a[0], a[1], 10], [b[0], b[1], 10], [b[0], b[1], eaveLo(b[0], b[1])], [a[0], a[1], eaveLo(a[0], a[1])]], GLASS, [-8, -8, 20])
      tag = MIRROR
    }
  }
  // the pleats on the north tongue (the orthophoto's six long pale triangles): ridges 26 m long, bearing 330°, from
  // bases along the summit's north-east side to tips near the tongue's north-west edge, each a fold 1.8 m proud
  const slopeH = (n: number): number => 36.8 - Math.max(0, n - 16) * 0.36
  for (let i = 0; i < 6; i++) {
    const base: P2 = [-24 + 7.2 * i, 46 + 2.4 * i]
    const tip: P2 = [base[0] - 13, base[1] + 22.5]
    const side: P2 = [0.866 * 3.0, 0.5 * 3.0]
    const hb = slopeH(base[1]), ht = slopeH(tip[1])
    const ridge0: V3 = [base[0], base[1], hb + 2.6], ridge1: V3 = [tip[0], tip[1], ht + 2.6]
    const inside: V3 = [(base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2, (hb + ht) / 2 - 2]
    poly([[base[0] + side[0], base[1] + side[1], hb - 0.5], [tip[0] + side[0], tip[1] + side[1], ht - 0.5], ridge1, ridge0], tone(TILE, 1.06), inside)
    poly([[base[0] - side[0], base[1] - side[1], hb - 0.5], [tip[0] - side[0], tip[1] - side[1], ht - 0.5], ridge1, ridge0], tone(TILE, 0.9), inside)
    poly([[base[0] + side[0], base[1] + side[1], hb - 0.5], [base[0] - side[0], base[1] - side[1], hb - 0.5], ridge0], tone(TILE, 0.95), inside)
  }

  tag = FIXED
  // ================================================================ the terraces and the lesser parts
  // the west terrace at 10 m along the park, the north-west one at 21 m with its glazed storey under it
  prism([[-61, -40], [-57, -40], [-57, 26], [-50, 38], [-44, 46], [-36, 52], [-46, 58], [-56, 48], [-65, 40], [-71, 33], [-70, -10]], 10, 10.9, PALE, CONCRETE)
  prism([[-57, 26], [-50, 38], [-44, 46], [-36, 52], [-40, 60], [-50, 54], [-58, 46], [-64, 36]], 10.9, 20, GLASS, null)
  prism([[-57, 26], [-50, 38], [-44, 46], [-36, 52], [-40, 60], [-50, 54], [-58, 46], [-64, 36]], 20, 21.2, PALE, CONCRETE)
  // the ramp up the north-west flank, from the 10 m terrace to the 21 m one
  prism([[-66, 6], [-61, 8], [-60, 40], [-65, 38]], 10.9, (e, n) => 11.2 + (n - 6) * 0.28, CONCRETE, CONCRETE)
  // the east terrace at 19 m along the Périphérique, its glazed storeys below
  prism([[22, -36], [29, -36], [29, 40], [20, 52], [18, 52]], 10, 18.2, GLASS, null)
  prism([[22, -36], [29.5, -36], [29.5, 40], [20, 52], [18, 52]], 18.2, 19.4, PALE, CONCRETE)
  // the north end: the 16 m block, the single-storey tip at 6 m
  prism([[-25.3, 76], [23.4, 75.7], [16.8, 104.3], [-11, 87.1]], BASE, 6, GLASS, CONCRETE)

  // ================================================================ the slab (the blade)
  const H = (s: number): number => topH(s)
  // the slab's "dog-eared" west corner (owner): the top-left corner folds BACK about a line from the top edge at
  // s = −20 down to the tip's edge at 24 m, so the tip's top sits 8 m north of the front line (the lidar's lobe)
  const EAR_TOP: P2 = [-60, -61]
  const lobeNW: P2[] = [[-45.5, -54.5], EAR_TOP]
  const TOP: V3[] = [
    [...along(-20, HALF), H(-20)], [...along(S_E, HALF), H(S_E)], [...along(S_E, -HALF), H(S_E)], [...along(6, -HALF), H(6)],
    [lobeNW[0][0], lobeNW[0][1], H(sOf(...lobeNW[0]))], [EAR_TOP[0], EAR_TOP[1], H(sOf(...EAR_TOP))],
  ]
  const inSlab: V3 = [...along(10, 0), 40]
  // the top: the solar strip along its middle, pale walkways either side
  poly(TOP, PALE, [inSlab[0], inSlab[1], 0])
  prism([along(-30, -1.6), along(62, -1.6), along(62, 1.6), along(-30, 1.6)], (e, n) => H(sOf(e, n)) + 0.02, (e, n) => H(sOf(e, n)) + 0.5, SOLAR, SOLAR)
  tag = MIRROR                                         // the blade's faces
  // the south face: the top's front edge down to the lip of the eye (the visor), to the ground at the west end,
  // to the wedge and the cantilever's underside at the east; leaning back a little, the west panel more
  const LEAN = 0.18
  const frontTop = (s: number): V3 => [...along(s, HALF), H(s)]
  const frontBot = (s: number): V3 => {
    if (s < -20) return [...along(s, HALF + 3.5), 0]
    if (s <= 22) { const h = VISOR_TOP - 0.2; return [...along(s, HALF + (H(s) - h) * LEAN), h] }
    const h = 34.4 - (s - 22) * (7.4 / (S_E - 22))
    return [...along(s, HALF + (H(s) - h) * LEAN), h]
  }
  for (const [s0, s1] of [[-20, 22], [22, 44], [44, S_E]] as const) {
    mottled([frontBot(s0), frontBot(s1), frontTop(s1), frontTop(s0)], TILE_DARK, inSlab, 4, 0.006)
  }
  // the west panel, the owner's "yellow bend": angled back from the main face, its foot 5.5 m further out on the
  // plaza and down to the ground; and its return at the bend, facing the eye
  const panelFoot = (s: number): V3 => [...along(s, HALF + 3.5), 0]
  const EAR_H = 24
  const earEdge: V3 = [...along(S_W, HALF + 3.5 * (1 - EAR_H / H(S_W))), EAR_H]   // on the tip's edge, where the fold meets it
  mottled([panelFoot(S_W), panelFoot(-20), frontTop(-20), earEdge], TILE_DARK, inSlab, 4, 0.006)
  // the folded corner itself, and the sliver of top it opens behind the fold
  poly([frontTop(-20), earEdge, [EAR_TOP[0], EAR_TOP[1], H(sOf(...EAR_TOP))]], tone(TILE_DARK, 0.9), inSlab)
  poly([frontTop(-20), [EAR_TOP[0], EAR_TOP[1], H(sOf(...EAR_TOP))], [...along(-20, HALF - 1), H(-20)]], PALE, [inSlab[0], inSlab[1], 0])
  poly([frontTop(-20), panelFoot(-20), [...along(-20, HALF + 1.6), 0]], tone(TILE_DARK, 0.85), [...along(-30, HALF + 2), 20])
  // the back face: vertical from the top down into the roof; at the west end the steep face down to the ground
  mottled([[...along(6, -HALF), 30], [...along(S_E, -HALF), 27], [...along(S_E, -HALF), H(S_E)], [...along(6, -HALF), H(6)]], TILE_DARK, inSlab, 4, 0.006)
  const NW_FOOT = 11
  mottled([[-51, -43, NW_FOOT], [-61, -51, NW_FOOT], [lobeNW[1][0], lobeNW[1][1], H(sOf(...lobeNW[1]))], [lobeNW[0][0], lobeNW[0][1], H(sOf(...lobeNW[0]))]], TILE_DARK, inSlab, 4, 0.006)
  // its underside, and between the north-west face and the back face
  poly([[-51, -43, NW_FOOT], [-61, -51, NW_FOOT], [...along(S_W, -1.5), NW_FOOT], [...along(6, -HALF), NW_FOOT]], tone(TILE_DARK, 0.75), [inSlab[0], inSlab[1], 60])
  // (its lower edge at the sky gap's height, not the foot: the face is two-sided in the city, and down to 11 m it
  //  closed the gap from behind — the ray-cast of 2026-11-03; a sliver at the west end still reaches the foot)
  poly([[-49.2, -43.1, GAP_H], [-51, -43, GAP_H], [lobeNW[0][0], lobeNW[0][1], H(sOf(...lobeNW[0]))], [...along(6, -HALF), H(6)], [...along(6, -HALF), GAP_H]], TILE_DARK, inSlab)
  poly([[-51, -43, NW_FOOT], [-49.2, -43.1, NW_FOOT], [-49.2, -43.1, GAP_H], [-51, -43, GAP_H]], TILE_DARK, inSlab)
  // the west tip (a narrow end) and the east end
  poly([frontBot(S_W), earEdge, [EAR_TOP[0], EAR_TOP[1], H(sOf(...EAR_TOP))], [-61, -51, NW_FOOT], [...along(S_W, -1.5), NW_FOOT]], TILE_DARK, inSlab)
  poly([frontBot(S_E), frontTop(S_E), [...along(S_E, -HALF), H(S_E)], [...along(S_E, -HALF), 27]], TILE_DARK, inSlab)
  // the underside east of the eye: the slab hangs clear over the recessed glazing (the owner: "it does not touch the
  // ground on the right"), its soffit visible from the forecourt all the way to the cantilevered end
  for (const [s0, s1] of [[22, 44], [44, S_E]] as const) {
    poly([frontBot(s0), frontBot(s1), [...along(s1, -HALF), frontBot(s1)[2]], [...along(s0, -HALF), frontBot(s0)[2]]], tone(TILE_DARK, 0.7), inSlab)
  }

  // ================================================================ the eye
  // The opening is framed by two "lips" (the owner, 2026-11-03: "the lips at the top and bottom of the eye, that the
  // right side of the slab rests on … the LEFT side of the eye has no lips"):
  //  - the upper lip: at the left a pale, thin canopy 12–16 m deep (the lidar's 33–35 m plateau, the lobe reaching
  //    (−14, −67.5)); from the eye's middle rightward a tile-clad beam hugging the slab's bottom edge, which past
  //    s = 46 leaves the slab and drops to the street corner at 20 m;
  //  - the lower lip: a tile-clad beam rising from the deck at the eye's middle (s = 5, 14.5 m) to meet the slab's
  //    bottom edge at s = 50 (29.7 m), then running on under the slab to its end: the slab's right side rests on it.
  // The lens closes where the lower lip's top meets the upper lip's underside (s ≈ 44); the two beams cross just
  // past that (the X seen from the forecourt), and between them to the right only a small glazed triangle is left
  // over the street corner.
  const foot = (s: number): P2 => along(s, HALF + 1.6)
  const frontBotH = (s: number): number => (s <= 22 ? 34.4 : 34.4 - (s - 22) * (7.4 / (S_E - 22)))
  const LIP_T = 3.0                                     // the beams' height
  // the front plane of the beams: the slab's leaning face continued, half a metre proud
  const lipQ = (s: number, h: number): number => HALF + (H(s) - h) * LEAN + 0.5
  const LIP_D = 4.5                                     // the beams' depth into the building
  const upperTop = (s: number): number => (s <= 46 ? frontBotH(s) : frontBotH(46) - (s - 46) * ((frontBotH(46) - 22) / 15))
  const lowerTop = (s: number): number => (s <= 50 ? 14.5 + (s - 5) * ((frontBotH(50) - 14.5) / 45) : frontBotH(s))
  /** a straight length of lip between s0 and s1, its top line given, LIP_T tall, LIP_D deep, tile-clad */
  const lipRun = (s0: number, s1: number, top: (s: number) => number, colour: Rgb, mottle = true): void => {
    const pt = (s: number, h: number, dq: number): V3 => [...along(s, lipQ(s, h) - dq), h]
    const h0 = top(s0), h1 = top(s1)
    const f: [V3, V3, V3, V3] = [pt(s0, h0 - LIP_T, 0), pt(s1, h1 - LIP_T, 0), pt(s1, h1, 0), pt(s0, h0, 0)]
    const b: [V3, V3, V3, V3] = [pt(s0, h0 - LIP_T, LIP_D), pt(s1, h1 - LIP_T, LIP_D), pt(s1, h1, LIP_D), pt(s0, h0, LIP_D)]
    const mid: V3 = [(f[0][0] + b[2][0]) / 2, (f[0][1] + b[2][1]) / 2, (h0 + h1) / 2 - LIP_T / 2]
    if (mottle) mottled(f, colour, mid, 4, 0.006); else poly(f, colour, mid)
    poly(b, colour, mid)
    poly([f[3], f[2], b[2], b[3]], tone(colour, 1.08), mid)        // top
    poly([f[0], f[1], b[1], b[0]], tone(colour, 0.7), mid)         // underside
    poly([f[0], f[3], b[3], b[0]], colour, mid)                    // the ends
    poly([f[1], f[2], b[2], b[1]], colour, mid)
  }
  // the canopy: the plateau south of the slab's foot, its top at the slab's bottom edge falling away southward (the
  // lidar: 34 at the foot, 29–31 at the outer edge), pale and thin at the left — no lip there — tile-clad from the
  // eye's middle to s = 46, where it has narrowed to the beam's depth
  const canopyTop = (e: number, n: number): number => {
    const s = sOf(e, n), q = qOf(e, n)
    return frontBotH(s) - 0.1 - Math.max(0, q - HALF - 1.6) * (0.1 + Math.max(0, Math.min(s, 40)) * 0.005)
  }
  tag = MIRROR                                         // paler tiles on the canopy (owner: its edge "is not shaded")
  const CANOPY_W: P2[] = [foot(-20), foot(6), [-4, -65.5], [-14, -67.5], [-24, -67], [-34, -65.5], [-41, -63.5]]
  prism(CANOPY_W, (e, n) => canopyTop(e, n) - 2.4, canopyTop, tone(PALE, 0.9), tone(TILE, 1.04), tone(PALE, 0.8))
  tag = MIRROR
  const CANOPY_E: P2[] = [foot(5), foot(46), along(46, 7.5), along(38, 13), along(28, 16.5), [3, -61], [-4, -65.5]]
  prism(CANOPY_E, (e, n) => canopyTop(e, n) - LIP_T, canopyTop, TILE_DARK, tone(TILE, 1.04), tone(TILE_DARK, 0.7), 4)
  // the upper lip's drop to the street corner, and the lower lip in its two runs
  lipRun(46, 61, upperTop, TILE_DARK)
  lipRun(5, 50, lowerTop, TILE_DARK)
  lipRun(50, 62, lowerTop, TILE_DARK)
  // the slab's face continues down to the upper lip's top past s = 46 (tile, in the slab's own leaning plane)
  const leanPt = (s: number, h: number): V3 => [...along(s, HALF + (H(s) - h) * LEAN), h]
  poly([leanPt(46, frontBotH(46)), leanPt(61, frontBotH(61)), leanPt(61, upperTop(61))], TILE_DARK, inSlab)

  tag = FIXED
  // the hollow: a dark cavity set 9 m back from the slab's face, floored by the deck at the left and by the foyer's
  // rising roof under the lower lip at the right, its ceiling the slab's underside
  const back = (s: number): P2 => along(s, HALF - 9)
  const hole: V3[] = [[...foot(-20), LIP], [...foot(20), LIP], [...foot(20), VISOR_BOT], [...foot(-20), VISOR_BOT]]
  const inHole: V3 = [...along(0, HALF - 4), 21]
  // (the owner: "the sky gap is critical" — the spiral stops short of the slab at the left, and the eye's lower left
  //  looks through under the lifted roof corner to the park and the sky: no wall there below 22 m)
  const GAP_S = -11
  const LENS_E = 44
  poly([[...back(GAP_S), LIP], [...back(LENS_E), LIP], [...back(LENS_E), 34.4], [...back(GAP_S), 34.4]], VOID, [...along(0, HALF + 5), 21])
  poly([[...back(-20), GAP_H], [...back(GAP_S), GAP_H], [...back(GAP_S), VISOR_BOT], [...back(-20), VISOR_BOT]], VOID, [...along(0, HALF + 5), 21])
  poly([[...back(-20), GAP_H], [...back(-20), VISOR_BOT], hole[3], [...foot(-20), GAP_H]], VOID, inHole)
  tag = MIRROR
  // the slab's face continues behind the canopy, so nothing shows through the slot above the opening
  poly([[...along(-20, HALF + 0.4), VISOR_BOT - 0.5], [...along(46, HALF + 0.4), VISOR_BOT - 0.5], [...along(46, HALF + 0.4), VISOR_TOP], [...along(-20, HALF + 0.4), VISOR_TOP]], TILE_DARK, inHole)
  tag = FIXED
  // the ceiling: the canopy's underside continued back to the cavity's wall, stepping down with the slab's edge
  for (const [s0, s1] of [[-20, 22], [22, LENS_E]] as const) {
    poly([[...back(s0), frontBotH(s0) - LIP_T], [...back(s1), frontBotH(s1) - LIP_T], [...foot(s1), frontBotH(s1) - LIP_T], [...foot(s0), frontBotH(s0) - LIP_T]], VOID, inHole)
  }
  poly([[...back(-20), LIP], [...back(8), LIP], [...foot(8), LIP], hole[0]], tone(PALE, 0.7), inHole)
  tag = MIRROR
  // the lens's upper-left corner: the canopy's edge climbs from the left to its peak — tile fills the spare corner
  const fp = (s: number, h: number): V3 => [...along(s, HALF + 0.4), h]
  poly([fp(-20, VISOR_BOT), fp(-20, 20), fp(-7, VISOR_BOT)], TILE_DARK, [...along(0, HALF - 4), 21])
  tag = FIXED
  // the waves: three chrome ridges stacked in the lens, each a rounded bulge toward the plaza, fading at the ends;
  // they fill the lens, so the lowest follows the lower lip up to the right and the top one the canopy's edge
  const waves = 3
  const segs = 18, arcs = 7
  const lensLo = (s: number): number => Math.max(LIP + 0.6, lowerTop(s) + 0.3)
  const lensHi = (s: number): number => frontBotH(s) - LIP_T - 0.3
  for (let w = 0; w < waves; w++) {
    const pt = (i: number, k: number): V3 => {
      const t = i / segs
      const s = GAP_S + (LENS_E - 1 - GAP_S) * t
      const y0 = lensLo(s) + (w / waves) * (lensHi(s) - lensLo(s))
      const y1 = lensLo(s) + ((w + 1) / waves) * (lensHi(s) - lensLo(s))
      // the bulge: fullest past the middle (the waves "face the top right"), dying out at both ends
      const swell = Math.sin(Math.PI * Math.pow(t, 0.85)) * (1 - 0.25 * w)
      const a = (k / arcs) * Math.PI
      const h = y0 + (1 - Math.cos(a)) / 2 * (y1 - y0)
      const depth = HALF - 7.6 + Math.sin(a) * 8.2 * swell
      return [...along(s, depth), h]
    }
    for (let i = 0; i < segs; i++) {
      for (let k = 0; k < arcs; k++) {
        const tint = mix(CHROME_DARK, CHROME, Math.pow(Math.sin((k + 0.5) / arcs * Math.PI), 0.45))
        poly([pt(i, k), pt(i + 1, k), pt(i + 1, k + 1), pt(i, k + 1)], tint, [...along(0, HALF - 9.5), 22])
      }
    }
  }

  // ================================================================ east of the eye: the foyer's glazing and the X
  // under the lower lip, from the podium up to the beam's underside: dark glass on a face half a metre behind the
  // beams' front plane; its roof is the cavity's floor behind the lip. Only the triangle between the two beams right
  // of their crossing shows from the forecourt (the owner: the grey chunk "does exist, but it is much smaller")
  const WEDGE: P2[] = [along(5, 7), [36.5, -36.5], [29, -27.5], [24, -27.5], along(44, -HALF + 0.5), along(5, -HALF + 0.5)]
  prism(WEDGE, 10, (e, n) => lowerTop(sOf(e, n)) - LIP_T - 0.3, GLASS, tone(TILE, 0.98))
  // the terrace band at the street corner, under the glazed triangle
  prism([[26.9, -40.3], [36.5, -36.5], [29, -27.5], [26, -27.5], [34, -36], [25.5, -39.5]], 17.4, 18.5, PALE, CONCRETE)
  // the X (owner: "on the right side of the building, not the front … around the corner from the end of the slab"):
  // the lips carry on round the chamfered street corner as two tile-clad beams crossing on the EAST face, the
  // Périphérique side, from the podium up to the upper lip's end
  const xa: V3 = [37.4, -36.1, 20], xb: V3 = [30, -27.1, 10.8]
  const xc: V3 = [37.4, -36.1, 10.8], xd: V3 = [30, -27.1, 20]
  beamAt(xa, xb, 1.7, PALE, 1.3)
  beamAt(xc, xd, 1.7, PALE, 1.3)
  // the deck's pale edge running on along the street to the corner, under the glazing
  beamAt([6, -62, LIP - 0.9], [36.5, -37, LIP - 0.5], 1.0, PALE, 0.9)
  // ================================================================ the ramps
  tag = TESSERA                                        // the ramps and their walls are paved in the same tiles
  // the main ramp: straight north from the plaza, rising to the deck, then west along the lip to the entrance
  // (the owner: "very long, and narrows to a point") — 19 m wide at the deck, a point 90 m out, 1 in 8.5
  const R_TIP: P2 = [-20, -154], R_L: P2 = [-25, -86], R_R: P2 = [-6, -86]
  const rampH = (e: number, n: number): number => Math.max(0.2, (n - R_TIP[1]) * (10.5 / (R_L[1] - R_TIP[1])))
  prism([R_TIP, R_R, R_L], BASE, rampH, CONCRETE, CONCRETE)
  for (const [a, b] of [[R_TIP, R_L], [R_TIP, R_R]] as const) {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / d * 0.35, nz = (b[0] - a[0]) / d * 0.35
    prism([[a[0] - nx, a[1] - nz], [a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz]], rampH, (e, n) => rampH(e, n) + 1.2, PALE, PALE)
  }
  prism([[-40, -60], [-40, -66], [-6, -72], [-6, -86], [4, -86], [4, -60]], 10, (e, n) => Math.min(LIP, 11 + Math.max(0, -22 - e) * 0.09), CONCRETE, CONCRETE)
  // the lower ramp at the left, down to the basement entrance under the terrace: its stone walls and the dark mouth
  for (const e of [-41, -30]) prism([[e - 0.4, -100], [e + 0.4, -100], [e + 0.4, -70], [e - 0.4, -70]], 0, (ee, n) => 1.4 + (n + 100) * 0.05, PALE, PALE)
  poly([[-40.5, -70.5, 0], [-30.5, -70.5, 0], [-30.5, -70.5, 9.5], [-40.5, -70.5, 9.5]], VOID, [-35, -60, 5])
  // the second pointed ramp (owner: "another pointed ramp into the plaza from the left", the architectural model): a
  // thin wedge from a point 70 m west, rising to the deck's west edge on three posts
  const L_TIP: P2 = [-104, -90], L_A: P2 = [-37, -79], L_B: P2 = [-37, -72]
  const leftH = (e: number, n: number): number => Math.max(0.2, (e - L_TIP[0]) * (LIP / (L_A[0] - L_TIP[0])))
  prism([L_TIP, L_A, L_B], (e, n) => leftH(e, n) - 1.0, leftH, CONCRETE, CONCRETE, tone(CONCRETE, 0.8))
  for (const [a, b] of [[L_TIP, L_A], [L_TIP, L_B]] as const) {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / d * 0.3, nz = (b[0] - a[0]) / d * 0.3
    prism([[a[0] - nx, a[1] - nz], [a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz]], leftH, (e, n) => leftH(e, n) + 1.1, PALE, PALE)
  }
  for (const e of [-88, -72, -56]) prism([[e - 0.5, -82.5], [e + 0.5, -82.5], [e + 0.5, -81.5], [e - 0.5, -81.5]], BASE, (ee, n) => leftH(ee, n) - 1.0, CONCRETE, null)
  // the plaza: paved at street level across the whole forecourt, with low concrete edges along the deck and the trench
  // (the owner: "the plaza isn't round" — a parallelogram on the slab's own line, from the slab's foot 95 m out)
  out.grounds.push([along(-70, HALF + 2), along(72, HALF + 2), along(72, HALF + 97), along(-70, HALF + 97)].map(([e, n]) => { const q = P(e, n, 0); return { x: q[0], z: q[2] } }))
  for (const [a, b] of [[[-40, -62], [-33, -78]], [[-33, -78], [-25, -86]], [[-6, -86], [4, -74]]] as [P2, P2][]) {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / d * 0.35, nz = (b[0] - a[0]) / d * 0.35
    prism([[a[0] - nx, a[1] - nz], [a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz]], LIP, LIP + 1.1, PALE, PALE)
  }
  // the third ramp, up the west flank into the lower levels
  prism([[-62, -40], [-57, -40], [-57, 0], [-62, 0]], 0, (e, n) => Math.max(0.3, (n + 40) * 0.24), CONCRETE, CONCRETE)
}
