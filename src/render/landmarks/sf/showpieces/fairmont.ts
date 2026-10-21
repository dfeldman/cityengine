/**
 * THE FAIRMONT, 950 Mason Street on the crest of Nob Hill (Reid Brothers, 1906–07; restored after the fire by Julia
 * Morgan; relation/16217497). From the Mapillary frames in p2/refs/relation-16217497/ (Mason Street, looking east)
 * and the Commons photograph "Fairmont Hotel, San Francisco.jpg" (the Mason/California corner), 2026-10-21.
 *
 * What it is:
 *  - a white terracotta-and-granite Beaux-Arts palace: a two-storey RUSTICATED base of deep banded courses pierced
 *    by round arches, standing up out of a plinth where California and Sacramento fall away east of the hill's top;
 *  - seven storeys of cream terracotta over a string course, punched windows in even ranks;
 *  - END PAVILIONS at every corner, a little proud of the wall, their edges in paired giant pilasters through the
 *    upper storeys, the windows of the first upper storey under small pediments;
 *  - on Mason Street the CENTRAL PAVILION, stepping forward between lawns: the entrance under a great rusticated
 *    arch between two pairs of Corinthian columns, the porte-cochère's black canopy in the drive before it, the
 *    balcony over the porch with its fan of a dozen flags, and over that a GIANT ORDER of six Corinthian columns
 *    through the upper storeys;
 *  - a frieze, the heavy bracketed cornice and its cresting of antefixes against the sky, two flagpoles on the roof;
 *  - a light court in the middle of the block (OSM's inner way; drawn from the Mason front's frame, since the loader
 *    passes only the outer ring).
 *
 * The outline covers the whole block, Mason to Powell. Only its west ~64 m is the 1907 building; east of that is the
 * low wing under the Fairmont's roof garden (OSM's leisure=garden way/32947179), and its north-east corner is the
 * 1961 tower — way/436477702, its own entry ("Fairmont Hotel Tower", tierA-6.ts `fairmontHotelTower`), so it is
 * left to that model; the low wing here runs under it, its walls drawn in a little so the two never fight.
 *
 * The frame: the Mason front is FOUND on the outline, not assumed — the ~21 m edge that steps forward between two
 * long collinear edges (the central pavilion). Everything is laid out from it: u along Mason, o out of it.
 * Heights are measured from the ground at the entrance (Fit.groundAt), which is the top of the hill; the model's
 * base is the lowest ground under the block, down the Powell side, so the walls run down to it.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon, capPolygonWithHoles } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { classicalColumn } from '../../column.ts'
import { beam } from '../../kit.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const EMIT = 0.5
const T = { granite: surfaceTag('granite'), terracotta: surfaceTag('terracotta'), metal: surfaceTag('metal'), concrete: surfaceTag('concrete'), foliage: surfaceTag('foliage'), glass: surfaceTag('glass') }

/** the cream terracotta of the upper storeys (the photographs read it warm, not white) */
const STONE: Rgb = [0.88, 0.87, 0.83]
/** the granite of the rusticated base, a shade greyer */
const RUSTIC: Rgb = [0.78, 0.76, 0.71]
const JOINT: Rgb = [0.52, 0.51, 0.48]
const TRIM: Rgb = [0.92, 0.91, 0.87]
const SHADOW: Rgb = [0.58, 0.57, 0.54]
const GLASS: Rgb = [0.19, 0.21, 0.24]
const DARK: Rgb = [0.12, 0.12, 0.13]
const ROOF: Rgb = [0.55, 0.55, 0.54]
const SKYLIGHT: Rgb = [0.42, 0.47, 0.5]
const GRASS: Rgb = [0.29, 0.43, 0.21]
const HEDGE: Rgb = [0.17, 0.3, 0.15]
const CYPRESS: Rgb = [0.12, 0.24, 0.13]
const BRONZE: Rgb = [0.2, 0.19, 0.16]
const LAMP: Rgb = [1, 0.86, 0.56]
const POLE: Rgb = [0.86, 0.86, 0.84]
const ANNEX: Rgb = [0.84, 0.82, 0.77]
const PAVING: Rgb = [0.66, 0.64, 0.6]
/** the flags of the balcony over the entrance, in the frames' colours */
const FLAGS: Rgb[] = [[0.7, 0.14, 0.15], [0.16, 0.24, 0.55], [0.92, 0.9, 0.86], [0.12, 0.45, 0.25], [0.85, 0.65, 0.12], [0.62, 0.12, 0.18], [0.2, 0.3, 0.62]]

/** Heights over the ground at the entrance, metres. */
const Y = {
  arch: 1.0,       // the base's arches spring from a low plinth course
  base: 10.4,      // top of the rusticated base
  band: 11.2,      // top of the string course over it
  storey: 3.4,     // the upper storeys
  frieze: 34.2,    // the frieze under the cornice
  eaves: 35.0,     // the cornice starts
  cornice: 36.4,   // the cornice's top: the roof
  crest: 0.8,      // the antefixes over the cornice
}
const STOREYS = 7
/** how far behind the Mason front the 1907 building runs (the outline's north and south edges step there) */
const DEPTH = 64
/** an end pavilion's width along its wall */
const PAV = 14

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
const uOf = (f: Fr, p: P2): number => (p.x - f.ox) * f.tx + (p.z - f.oz) * f.tz
const oOf = (f: Fr, p: P2): number => (p.x - f.ox) * f.nx + (p.z - f.oz) * f.nz
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up; the underside only if asked. */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, bottom = false): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], [f.nx, 0, f.nz], UV, c, tag)
  out.quad([Q(u1, o0, y0), Q(u0, o0, y0), Q(u0, o0, y1), Q(u1, o0, y1)], [-f.nx, 0, -f.nz], UV, c, tag)
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

/** A small triangular pediment over a window, flat on the wall. */
function gable(out: MeshBuilder, f: Fr, u: number, o: number, y: number, w: number, h: number, c: Rgb): void {
  out.quad([P(f, u - w / 2, o, y), P(f, u + w / 2, o, y), P(f, u, o, y + h), P(f, u, o, y + h)], [f.nx, 0, f.nz], UV, c, FIXED)
}

// ----------------------------------------------------------------------------------------- the ring's shape

/** The part of a ring on one side of a line in a frame: `o >= at` (keep 'out') or `o <= at` (keep 'in'). */
function clip(ring: P2[], f: Fr, at: number, keep: 'out' | 'in'): P2[] {
  const s = keep === 'out' ? 1 : -1
  const d = (p: P2) => s * (oOf(f, p) - at)
  const res: P2[] = []
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const da = d(a)
    const db = d(b)
    if (da >= 0) res.push(a)
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db)
      res.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t })
    }
  }
  // a point on the line comes out twice (kept, and as the crossing): no zero-length edges for the roof's earcut
  return res.filter((p, i) => { const q = res[(i + 1) % res.length]; return Math.hypot(p.x - q.x, p.z - q.z) > 0.05 })
}

interface Mason { M: Fr; u0: number; u1: number; pu0: number; pu1: number; proj: number }

/** The convex hull, anticlockwise (Andrew's monotone chain). */
function hull(pts: P2[]): P2[] {
  const p = [...pts].sort((a, b) => a.x - b.x || a.z - b.z)
  const cross = (o: P2, a: P2, b: P2) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x)
  const lo: P2[] = []
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 1e-9) lo.pop(); lo.push(q) }
  const up: P2[] = []
  for (const q of [...p].reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 1e-9) up.pop(); up.push(q) }
  return lo.slice(0, -1).concat(up.slice(0, -1))
}

/**
 * The Mason front, found on the outline's CONVEX HULL — because that is what the city hands this builder (the
 * loader's ring for the hotel is its hull: the pavilion's two returns are gone, its corners joined straight to the
 * front's ends), while the showcase hands it the full OSM outline; the hull of either is the same. On it the front
 * is an edge of 12–32 m (the central pavilion's face) between two long edges each turned a little from it — the
 * chords from the pavilion's corners back to the front's ends. The front's line runs between those ends: `M`,
 * o = 0 on it, outward positive; `pu0..pu1` is the pavilion's span along it, `proj` how far it steps out.
 */
function findMason(h: P2[]): Mason {
  const n = h.length
  const E = (i: number) => frameOf(h[((i % n) + n) % n], h[(((i + 1) % n) + n) % n])
  let best: Mason | null = null
  let score = -Infinity
  for (let i = 0; i < n && n >= 4; i++) {
    const c = E(i)
    if (c.L < 12 || c.L > 32) continue
    const p = E(i - 1)
    const q = E(i + 1)
    if (p.L < 15 || q.L < 15) continue
    const turn = (a: Fr, b: Fr) => Math.acos(Math.max(-1, Math.min(1, a.tx * b.tx + a.tz * b.tz)))
    const t1 = turn(p, c), t2 = turn(c, q)
    if (t1 < 0.06 || t1 > 0.6 || t2 < 0.06 || t2 > 0.6) continue
    const A = h[((i - 1) % n + n) % n]
    const B = h[(i + 2) % n]
    const M = frameOf(A, B)
    const proj = (oOf(M, h[i]) + oOf(M, h[(i + 1) % n])) / 2
    if (proj < 2 || proj > 15) continue
    const s = M.L - Math.abs(t1 - t2) * 60 - Math.abs(p.L - q.L)
    if (s > score) { score = s; best = { M, u0: 0, u1: M.L, pu0: uOf(M, h[i]), pu1: uOf(M, h[(i + 1) % n]), proj } }
  }
  if (best) return best
  // no pavilion on it: the longest edge, a shallow pavilion in its middle
  let L = 0
  let f = E(0)
  for (let i = 0; i < n; i++) { const e = E(i); if (e.L > L) { L = e.L; f = e } }
  return { M: f, u0: 0, u1: f.L, pu0: f.L / 2 - 10.5, pu1: f.L / 2 + 10.5, proj: 1.5 }
}

/** The outline behind the front's line, with the pavilion put back on the front's edge. */
function withPavilion(h: P2[], m: Mason): P2[] {
  const { M, pu0, pu1, proj } = m
  const behind = clip(h, M, 0, 'in')
  const res: P2[] = []
  for (let i = 0; i < behind.length; i++) {
    const a = behind[i]
    const b = behind[(i + 1) % behind.length]
    res.push(a)
    if (Math.abs(oOf(M, a)) < 0.3 && Math.abs(oOf(M, b)) < 0.3 && Math.hypot(b.x - a.x, b.z - a.z) > 1) {
      const fwd = uOf(M, b) > uOf(M, a)
      const [s0, s1] = fwd ? [pu0, pu1] : [pu1, pu0]
      res.push(pt(M, s0, 0), pt(M, s0, proj), pt(M, s1, proj), pt(M, s1, 0))
    }
  }
  return res
}

// ---------------------------------------------------------------------------------------------- the pieces

/** A bronze lamp standard: a post and a lit lantern. */
function lampStandard(out: MeshBuilder, p: P2, y0: number): void {
  prism(out, p.x, p.z, y0, y0 + 3.4, 0.09, 6, BRONZE, T.metal, 0.07)
  prism(out, p.x, p.z, y0 + 3.4, y0 + 4.1, 0.24, 6, LAMP, EMIT, 0.28)
  prism(out, p.x, p.z, y0 + 4.1, y0 + 4.4, 0.32, 6, BRONZE, T.metal, 0.05)
}

/** A flagpole and its flag, the pole from `a` to `b`, the flag hung off its outer end. */
function flag(out: MeshBuilder, a: [number, number, number], b: [number, number, number], c: Rgb, r = 0.04): void {
  beam(out, a, b, r, POLE)
  const at = (t: number, dy = 0): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + dy, a[2] + (b[2] - a[2]) * t]
  const q: [number, number, number][] = [at(0.45), at(0.97), at(0.97, -1.3), at(0.45, -1.3)]
  // the flag's plane holds the pole and the vertical: its normal is square to both
  const dx = b[0] - a[0], dz = b[2] - a[2]
  const k = Math.hypot(dx, dz) || 1
  const n: [number, number, number] = [-dz / k, 0, dx / k]
  out.quad(q, n, UV, c, FIXED)
  out.quad([...q].reverse(), [-n[0], 0, -n[2]], UV, c, FIXED)
}

/** The rusticated courses of a stretch of the base, from the ground (y = 0 at the lowest corner) up to `top`. */
function courses(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, top: number, g: number): void {
  for (let y = top - 0.8; y > -0.5 - g; y -= 0.8) panel(out, f, u0, u1, o + 0.03, g + y - 0.07, g + y + 0.07, JOINT)
}

/**
 * The upper storeys' windows in a run of `n` bays over `u0..u1`, `o` proud: a dark pane in a pale surround a storey.
 * `heads` puts a pediment over the first upper storey's windows (the pavilions).
 */
function windowBays(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, g: number, heads = false): void {
  const n = Math.max(1, Math.round((u1 - u0) / 3.3))
  const step = (u1 - u0) / n
  for (let i = 0; i < n; i++) {
    const u = u0 + step * (i + 0.5)
    for (let k = 0; k < STOREYS; k++) {
      const y0 = g + Y.band + 0.8 + k * Y.storey
      const h = k === STOREYS - 1 ? 1.4 : 2.1
      panel(out, f, u - 0.85, u + 0.85, o + 0.03, y0 - 0.25, y0 + h + 0.15, TRIM)
      panel(out, f, u - 0.6, u + 0.6, o + 0.05, y0, y0 + h, GLASS)
      if (heads && k === 1) gable(out, f, u, o + 0.06, y0 + h + 0.25, 2.1, 0.7, TRIM)
    }
  }
}

/** Plain square windows in two ranks through the base, where it has no arches (the back, over the low wing). */
function baseWindows(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, g: number): void {
  const n = Math.max(1, Math.round((u1 - u0) / 3.3))
  const step = (u1 - u0) / n
  for (let i = 0; i < n; i++) {
    const u = u0 + step * (i + 0.5)
    for (const y of [2.0, 6.4]) panel(out, f, u - 0.6, u + 0.6, o + 0.05, g + y, g + y + 2.2, GLASS)
  }
}

/** The base's round arches over `u0..u1`: a ring of voussoirs, the dark opening, a small mezzanine window over it. */
function arcade(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, g: number): void {
  const n = Math.max(1, Math.round((u1 - u0) / 3.6))
  const step = (u1 - u0) / n
  for (let i = 0; i < n; i++) {
    const u = u0 + step * (i + 0.5)
    arch(out, f, u, o + 0.05, g + Y.arch, 3.0, 6.6, SHADOW, 4)
    arch(out, f, u, o + 0.07, g + Y.arch + 0.3, 2.2, 6.0, GLASS, 4)
    panel(out, f, u - 0.25, u + 0.25, o + 0.09, g + Y.arch + 5.6, g + Y.arch + 6.7, RUSTIC)   // the keystone
    panel(out, f, u - 0.7, u + 0.7, o + 0.06, g + 8.3, g + 9.6, GLASS)
  }
}

/** An end pavilion over `u0..u1` of a wall: stepped forward, paired giant pilasters at its edges, three bays. */
function endPavilion(out: MeshBuilder, f: Fr, u0: number, u1: number, g: number, arches: boolean): void {
  const pr = 0.5
  // the pavilion's face, carried down through the base
  slab(out, f, u0, u1, -0.2, pr, -1, g + Y.frieze, STONE, T.terracotta)
  panel(out, f, u0, u1, pr + 0.01, -1, g + Y.base, RUSTIC, T.granite)
  courses(out, f, u0, u1, pr, Y.base, g)
  if (arches) arcade(out, f, u0 + 1.5, u1 - 1.5, pr, g)
  else baseWindows(out, f, u0 + 3, u1 - 3, pr, g)
  // the paired pilasters, with a capital block each
  for (const [a, s] of [[u0, 1], [u1, -1]] as const) {
    for (const k of [0.35, 1.55]) {
      const c = a + s * (k + 0.45)
      slab(out, f, c - 0.45, c + 0.45, pr, pr + 0.35, g + Y.band, g + Y.frieze - 0.6, TRIM, T.terracotta)
      slab(out, f, c - 0.6, c + 0.6, pr, pr + 0.5, g + Y.frieze - 0.6, g + Y.frieze, TRIM, T.terracotta)
    }
  }
  windowBays(out, f, u0 + 3.0, u1 - 3.0, pr, g, true)
}

/** The cornice along a wall: the frieze, the bracketed cornice and its shadow line, the antefixes. */
function cornice(out: MeshBuilder, f: Fr, u0: number, u1: number, g: number, o = 0): void {
  slab(out, f, u0 - 0.3, u1 + 0.3, o - 0.4, o + 0.3, g + Y.frieze, g + Y.eaves, TRIM, T.terracotta)
  slab(out, f, u0 - 1.4, u1 + 1.4, o - 1.4, o + 1.4, g + Y.eaves, g + Y.cornice, STONE, T.terracotta, true)
  panel(out, f, u0 - 1.4, u1 + 1.4, o + 1.41, g + Y.eaves + 0.25, g + Y.eaves + 0.45, SHADOW)   // the brackets' shadow
  const n = Math.max(1, Math.round((u1 - u0 + 2.8) / 1.9))
  const step = (u1 - u0 + 2.8) / n
  const y = g + Y.cornice
  for (let i = 0; i < n; i++) {
    const u = u0 - 1.4 + step * (i + 0.5)
    out.quad([P(f, u - 0.38, o + 1.25, y), P(f, u + 0.38, o + 1.25, y), P(f, u, o + 1.25, y + Y.crest), P(f, u, o + 1.25, y + Y.crest)], [f.nx, 0, f.nz], UV, TRIM, FIXED)
  }
}

type Kind = 'mason' | 'centre' | 'return' | 'side' | 'back' | 'plain'

/**
 * One wall of the 1907 building: the terracotta face, the rusticated base with its courses and string course, the
 * cornice, and its openings by kind. `cornerA`/`cornerB` put an end pavilion at that end.
 */
function wall(out: MeshBuilder, f: Fr, kind: Kind, g: number, cornerA: boolean, cornerB: boolean): void {
  const L = f.L
  panel(out, f, 0, L, 0, -1, g + Y.frieze, STONE, T.terracotta)
  panel(out, f, 0, L, 0.01, -1, g + Y.base, RUSTIC, T.granite)
  courses(out, f, 0, L, 0, Y.base, g)
  slab(out, f, -0.2, L + 0.2, -0.3, 0.35, g + Y.base, g + Y.band, TRIM, T.granite)
  cornice(out, f, 0, L, g)
  if (kind === 'plain' || L < 4) return
  if (kind === 'return') {
    windowBays(out, f, 1, L - 1, 0, g)
    if (L > 5) arcade(out, f, 1, L - 1, 0, g)
    return
  }
  const a = cornerA && L > 2 * PAV ? PAV : 0
  const b = cornerB && L > 2 * PAV ? PAV : 0
  if (a) endPavilion(out, f, 0, a, g, kind !== 'back')
  if (b) endPavilion(out, f, L - b, L, g, kind !== 'back')
  windowBays(out, f, a + 0.6, L - b - 0.6, 0, g)
  if (kind === 'back') baseWindows(out, f, a + 0.6, L - b - 0.6, 0, g)
  else arcade(out, f, a + 0.6, L - b - 0.6, 0, g)
}

/**
 * The central pavilion on Mason Street, on its own edge: the porch below (the great arch between two pairs of
 * Corinthian columns, side arches, the entablature and the balcony with its flags, the canopy in the drive), and
 * above it the giant order of six Corinthian columns through the upper storeys.
 */
function centre(out: MeshBuilder, f: Fr, g: number): void {
  const L = f.L
  const m = L / 2
  panel(out, f, 0, L, 0, -1, g + Y.frieze, STONE, T.terracotta)
  panel(out, f, 0, L, 0.01, -1, g + Y.base, RUSTIC, T.granite)
  courses(out, f, 0, L, 0, Y.base, g)
  cornice(out, f, 0, L, g, 0.9)
  // ---- the porch: the front stepped forward a metre, the arch, the columns on their pedestals
  slab(out, f, 0.4, L - 0.4, 0, 1.0, -1, g + Y.base - 1.2, RUSTIC, T.granite)
  courses(out, f, 0.4, L - 0.4, 1.0, Y.base - 1.2, g)
  // the great arch: its voussoirs, the doors' dark, the keystone
  arch(out, f, m, 1.05, g + 0.3, 6.0, 8.3, SHADOW, 6)
  arch(out, f, m, 1.07, g + 0.3, 4.6, 7.6, DARK, 6)
  panel(out, f, m - 2.3, m + 2.3, 1.09, g + 3.6, g + 3.8, BRONZE)
  slab(out, f, m - 0.45, m + 0.45, 1.0, 1.3, g + 7.4, g + 8.7, TRIM, T.granite)
  // the smaller arched windows either side
  for (const s of [-1, 1]) {
    const u = m + s * (L / 2 - 2.6)
    arch(out, f, u, 1.05, g + 1.4, 2.6, 5.2, SHADOW, 4)
    arch(out, f, u, 1.07, g + 1.7, 1.9, 4.6, GLASS, 4)
  }
  // the four columns: free-standing in front of the porch, the building's face (the near tier)
  const heading = Math.atan2(f.nx, f.nz)
  for (const s of [-1, 1]) {
    for (const d of [3.6, 5.3]) {
      const u = m + s * d
      slab(out, f, u - 0.6, u + 0.6, 1.0, 2.6, g, g + 1.5, RUSTIC, T.granite)
      const c = pt(f, u, 1.8)
      classicalColumn(out, c.x, c.z, g + 1.5, g + 7.9, 0.4, TRIM, { order: 'corinthian', tier: 'near', tag: T.terracotta, heading })
    }
  }
  // the entablature over them, and the balcony on it: its floor, balustrade, and the dozen flags fanned out over the drive
  slab(out, f, 0.4, L - 0.4, 0, 2.7, g + 7.9, g + 9.2, TRIM, T.terracotta, true)
  panel(out, f, 0.4, L - 0.4, 2.71, g + 8.5, g + 8.6, SHADOW)
  slab(out, f, 0.2, L - 0.2, 0, 3.0, g + 9.2, g + 9.5, TRIM, T.terracotta, true)
  slab(out, f, 0.2, L - 0.2, 2.75, 3.0, g + 9.5, g + 10.4, SHADOW)
  slab(out, f, 0.2, L - 0.2, 2.7, 3.05, g + 10.4, g + 10.6, TRIM, T.terracotta)
  for (let uu = 0.6; uu < L - 0.4; uu += 0.45) panel(out, f, uu - 0.1, uu + 0.1, 3.01, g + 9.5, g + 10.4, TRIM)
  const nf = 12
  for (let i = 0; i < nf; i++) {
    const u = 1.2 + ((L - 2.4) * i) / (nf - 1)
    const spread = (u - m) * 0.25
    const a: [number, number, number] = P(f, u, 2.9, g + 10.4)
    const tip = pt(f, u + spread, 7.2)
    flag(out, a, [tip.x, g + 15.0, tip.z], FLAGS[i % FLAGS.length])
  }
  // ---- the giant order: six engaged Corinthian columns from the balcony to the frieze, windows between them
  const n = 6
  for (let k = 0; k < n; k++) {
    const u = 1.2 + ((L - 2.4) * k) / (n - 1)
    slab(out, f, u - 0.75, u + 0.75, 0, 1.15, g + Y.band, g + Y.band + 1.2, TRIM, T.terracotta)
    const c = pt(f, u, 0.5)
    classicalColumn(out, c.x, c.z, g + Y.band + 1.2, g + Y.frieze, 0.62, TRIM, { order: 'corinthian', tier: 'mid', tag: T.terracotta, heading })
    if (k < n - 1) {
      const mid = u + (L - 2.4) / (n - 1) / 2
      for (let s = 0; s < STOREYS; s++) {
        const y0 = g + Y.band + 0.8 + s * Y.storey
        const h = s === STOREYS - 1 ? 1.4 : 2.1
        panel(out, f, mid - 0.85, mid + 0.85, 0.03, y0 - 0.25, y0 + h + 0.15, TRIM)
        panel(out, f, mid - 0.6, mid + 0.6, 0.05, y0, y0 + h, GLASS)
        // the balconies' rails across the windows of the first upper storey
        if (s === 0) panel(out, f, mid - 0.9, mid + 0.9, 0.25, y0 - 0.3, y0 + 0.5, TRIM)
      }
    }
  }
  // the entablature line the columns carry, broken forward over them
  slab(out, f, -0.2, L + 0.2, 0, 1.2, g + Y.frieze - 0.6, g + Y.eaves, TRIM, T.terracotta)
  // ---- the porte-cochère: the black canopy over the drive before the doors, on slim posts, a light name band
  const c0 = 4.2, c1 = 12.5
  slab(out, f, m - 4.6, m + 4.6, c0, c1, g + 3.9, g + 4.5, DARK, T.metal, true)
  out.quad([P(f, m - 4.6, c0, g + 4.5), P(f, m - 4.6, c1, g + 4.5), P(f, m + 4.6, c1, g + 4.5), P(f, m + 4.6, c0, g + 4.5)].reverse() as [number, number, number][], [0, 1, 0], UV, DARK, T.metal)
  slab(out, f, m - 4.6, m + 4.6, c1 - 0.6, c1, g + 4.5, g + 5.0, DARK, T.metal)
  panel(out, f, m - 1.4, m + 1.4, c1 + 0.01, g + 4.0, g + 4.4, TRIM)
  for (const su of [-4.2, 4.2]) {
    for (const so of [c0 + 0.6, c1 - 0.6]) {
      const p = pt(f, m + su, so)
      prism(out, p.x, p.z, g, g + 3.9, 0.08, 6, DARK, T.metal)
    }
  }
  // the porch floor and its two steps, and the lamps at its corners
  slab(out, f, 0.4, L - 0.4, 2.6, 3.8, g - 0.5, g + 0.3, RUSTIC, T.granite)
  slab(out, f, 0.4, L - 0.4, 3.8, 4.2, g - 0.5, g + 0.15, RUSTIC, T.granite)
  for (const s of [-1, 1]) lampStandard(out, pt(f, m + s * 6.6, 3.5), g + 0.3)
}

// ------------------------------------------------------------------------------------------ the building

function fairmontHotel(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < raw.length; i++) { const a = raw[i]; const b = raw[(i + 1) % raw.length]; area += a.x * b.z - b.x * a.z }
  const h = hull(simplifyRing(area >= 0 ? raw : [...raw].reverse(), 0.6))
  const mason = findMason(h)
  const { M, u0, u1, pu0, pu1, proj } = mason
  const ring = withPavilion(h, mason)
  const uc = (pu0 + pu1) / 2
  const ground = (p: P2): number => fit.groundAt?.(p.x, p.z) ?? fit.grade ?? 0
  // everything is measured from the ground at the entrance, the hill's top
  const g = Math.max(0, ground(pt(M, uc, proj + 3)))

  // ---- the 1907 building: the outline as far back as DEPTH; the low wing beyond it
  const deepest = Math.max(...ring.map((p) => -oOf(M, p)))
  const cut = Math.min(DEPTH, deepest)
  const hist = cut < deepest - 2 ? clip(ring, M, -cut, 'out') : ring
  const annex = cut < deepest - 2 ? clip(ring, M, -cut, 'in') : []

  for (let i = 0; i < hist.length; i++) {
    const a = hist[i]
    const b = hist[(i + 1) % hist.length]
    const f = frameOf(a, b)
    if (f.L < 0.5) continue
    const facing = f.nx * M.nx + f.nz * M.nz
    const mo = oOf(M, pt(f, f.L / 2, 0))
    let kind: Kind
    if (facing > 0.95 && mo > 2.5 && f.L > 10) kind = 'centre'
    else if (facing > 0.95 && Math.abs(mo) <= 2.5) kind = 'mason'
    else if (Math.abs(facing) < 0.35 && mo > -1 && f.L < 14) kind = 'return'
    else if (facing < -0.95 && mo < -cut + 3) kind = 'back'
    else kind = f.L >= 8 ? 'side' : 'plain'
    if (kind === 'centre') { centre(out, f, g); continue }
    // which ends turn a corner of the block (an end pavilion there): on Mason the end away from the centre,
    // on the sides both ends; never the end against the central pavilion
    let cA = false
    let cB = false
    if (kind === 'mason') {
      const ua = uOf(M, a), ub = uOf(M, b)
      if (Math.abs(ua - uc) > Math.abs(ub - uc)) cA = true
      else cB = true
    } else if (kind === 'side' || kind === 'back') { cA = true; cB = true }
    wall(out, f, kind, g, cA, cB)
  }

  // ---- the roof, with the light court open in its middle
  const court: P2[] = [pt(M, uc - 19.3, -44.8), pt(M, uc + 19.3, -44.8), pt(M, uc + 19.3, -22.6), pt(M, uc - 19.3, -22.6)]
  const haveCourt = cut > 50 && u1 - u0 > 60
  const yr = g + Y.cornice - 0.05
  if (haveCourt) {
    // (`court` runs clockwise seen from above — the (u, o) frame is mirrored — so its edges' outward side is the court's inside)
    capPolygonWithHoles(out, [hist, court], yr, ROOF, T.concrete)
    // the court's four walls facing in, a rank of windows a storey, and its skylit floor over the lobby
    const cyc = court
    for (let i = 0; i < 4; i++) {
      const f = frameOf(cyc[i], cyc[(i + 1) % 4])
      panel(out, f, 0, f.L, 0, g + Y.band, yr, STONE, T.terracotta)
      windowBays(out, f, 1, f.L - 1, 0, g)
    }
    capPolygon(out, [...court].reverse(), g + Y.band, SKYLIGHT, T.glass)
  } else capPolygon(out, hist, yr, ROOF, T.concrete)
  // the roof's machine rooms, low and set back
  for (const [du, o, w, d] of [[-16, -12, 5, 4], [14, -54, 7, 5], [-22, -56, 4, 4]] as const) {
    const fr: Fr = M
    slab(out, fr, uc + du - w / 2, uc + du + w / 2, o - d / 2, o + d / 2, yr, yr + 3.2, ANNEX, T.concrete)
  }
  // the two flagpoles on the roof over the Mason front (the Commons photograph: the Stars and Stripes and the Bear)
  for (const [du, c] of [[-9, [0.7, 0.14, 0.15]], [9, [0.92, 0.9, 0.86]]] as const) {
    const p = pt(M, uc + du, -5)
    prism(out, p.x, p.z, yr, yr + 11, 0.1, 6, POLE, T.metal, 0.06)
    const f2: Fr = { ...M, ox: p.x, oz: p.z }
    slab(out, f2, 0.1, 2.6, -0.01, 0.01, yr + 9.2, yr + 10.8, c as Rgb)
  }

  // ---- the lawns before the Mason front, either side of the central pavilion: grass, a hedge, the cypresses
  for (const s of [-1, 1]) {
    const a = s < 0 ? u0 + PAV : pu1
    const b = s < 0 ? pu0 : u1 - PAV
    if (b - a < 4) continue
    const mid = pt(M, (a + b) / 2, 3)
    const gy = ground(mid)
    slab(out, M, a, b, 0.3, 5.6, gy - 3, gy + 0.12, GRASS, T.foliage)
    slab(out, M, a, b, 5.6, 6.1, gy - 3, gy + 0.6, HEDGE, T.foliage)
    // the tall dark cypresses that stand by the porch, and a bronze figure on a plinth on the lawn
    const cy = pt(M, s < 0 ? b - 2.2 : a + 2.2, 3.4)
    prism(out, cy.x, cy.z, gy, gy + 1.5, 0.3, 6, BRONZE, FIXED, 0.3)
    prism(out, cy.x, cy.z, gy + 1.5, gy + 10.5, 1.7, 6, CYPRESS, T.foliage, 0.15)
    const st = pt(M, (a + b) / 2, 3.2)
    prism(out, st.x, st.z, gy + 0.1, gy + 1.0, 0.7, 6, RUSTIC, T.granite, 0.6)
    prism(out, st.x, st.z, gy + 1.0, gy + 2.8, 0.22, 6, BRONZE, T.metal, 0.14)
  }

  // ---- the low wing east of it (the roof garden's): cream walls drawn in 0.4 m so the tower's own walls win where
  // they share the outline, windows a storey, a terrace on top at about the lobby's level
  if (annex.length >= 3) {
    const top = Math.max(4, g + 1.2)
    for (let i = 0; i < annex.length; i++) {
      const f = frameOf(annex[i], annex[(i + 1) % annex.length])
      if (f.L < 1) continue
      const mo = oOf(M, pt(f, f.L / 2, 0))
      if (Math.abs(mo + cut) < 0.5 && f.nx * M.nx + f.nz * M.nz > 0.95) continue   // against the old building
      panel(out, f, 0, f.L, -0.4, -1, top, ANNEX, T.concrete)
      slab(out, f, 0, f.L, -0.7, -0.15, top, top + 1.1, TRIM, T.concrete)
      const n = Math.floor(f.L / 3.4)
      for (let k = 0; k < n; k++) {
        const u = (f.L / n) * (k + 0.5)
        for (let y = top - 3; y > ground(pt(f, u, 0)) + 0.5; y -= 3.4) panel(out, f, u - 0.7, u + 0.7, -0.36, y - 1.6, y, GLASS)
      }
    }
    capPolygon(out, annex, top, PAVING, T.concrete)
    // the roof garden: lawn over most of the terrace, behind its parapet
    const lawn = clip(clip(annex, M, -cut - 3, 'in'), M, -deepest + 3, 'out')
    if (lawn.length >= 3) capPolygon(out, lawn, top + 0.12, GRASS, T.foliage)
  }
}

export const FAIRMONT: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** The Fairmont San Francisco (relation/16217497): the 1907 palace on the Mason front, the low wing to Powell. */
  fairmontHotel,
}
