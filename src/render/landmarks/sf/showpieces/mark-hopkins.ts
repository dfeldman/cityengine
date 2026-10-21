/**
 * THE INTERCONTINENTAL MARK HOPKINS, 1 Nob Hill — California and Mason (Weeks & Day, 1926; way/1361492525). From the
 * Mapillary frames in p3/refs/way-1361492525/ (05 and 06 from the California/Mason corner, 01–04 from Pine), and
 * OSM's eleven building:parts under the outline, 2026-10-21.
 *
 * What it is:
 *  - a cream/buff terracotta hotel in a French Château / Spanish Renaissance mix, on the crest of Nob Hill;
 *  - a Y PLAN: the CENTRAL TOWER (~24 × 16.5 m, its corners chamfered) set at 45° to the street grid in the crook of
 *    two seventeen-storey WINGS — one down Mason, one along California — so from the corner the wings splay away
 *    either side of the tower's face and the FORECOURT is the triangle between them and the corner;
 *  - in the forecourt, the ENTRANCE FRONTISPIECE before the tower's face: three tall arches under a dark canopy,
 *    a two-storey bay over them, a balustrade, flags; gate piers with lanterns, planting either side of the drive;
 *  - a rusticated two-storey base, string courses, ranks of punched windows in pale surrounds;
 *  - the wings' tops: a cornice, an attic of arched windows, a parapet with corner pinnacles;
 *  - the tower's CROWN, three storeys clear of the wings: the cornice, the glazed "Top of the Mark" lounge in tall
 *    arched windows between piers, the ornate pinnacled parapet with corner turrets, the big flagpole and flag;
 *  - behind (down the hill to Pine and Powell): a 23 m infill block, a 9 m strip on Pine, a small hipped annex.
 *
 * The parts are OSM's own (measured in the outline's frame, east/north metres about its vertex centroid). The city
 * hands the builder the outline turned into the model's frame (and, for some loaders, its convex hull), so the
 * known outline is REGISTERED to `fit.ring` — the rotation (and mirror) that lays its corners on the ring's — and
 * every part is carried over with it. Heights are measured from the ground in the forecourt (Fit.groundAt), the
 * hill's top; the model's base is the lowest ground, down at Pine, so the walls run down to it.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { beam, pinnacle } from '../../kit.ts'
import { stripRoof } from '../../parts.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const EMIT = 0.5
const T = { granite: surfaceTag('granite'), terracotta: surfaceTag('terracotta'), metal: surfaceTag('metal'), concrete: surfaceTag('concrete'), foliage: surfaceTag('foliage'), glass: surfaceTag('glass'), tile: surfaceTag('tile') }

/** the buff terracotta of the walls (frames 05/06 in sun: warm tan, darker than the Fairmont's white) */
const WALL: Rgb = [0.82, 0.73, 0.58]
/** the base, a shade deeper */
const RUSTIC: Rgb = [0.74, 0.66, 0.53]
const JOINT: Rgb = [0.5, 0.45, 0.37]
const TRIM: Rgb = [0.88, 0.83, 0.72]
const SHADOW: Rgb = [0.55, 0.5, 0.42]
const GLASS: Rgb = [0.17, 0.19, 0.22]
const LOUNGE: Rgb = [0.26, 0.31, 0.36]
const DARK: Rgb = [0.11, 0.11, 0.12]
const ROOF: Rgb = [0.5, 0.49, 0.47]
const TILE: Rgb = [0.55, 0.3, 0.22]
const BACK: Rgb = [0.76, 0.71, 0.62]
const PAVING: Rgb = [0.54, 0.52, 0.49]
const HEDGE: Rgb = [0.18, 0.31, 0.16]
const TREE: Rgb = [0.2, 0.36, 0.18]
const BRONZE: Rgb = [0.2, 0.19, 0.16]
const LAMP: Rgb = [1, 0.86, 0.56]
const POLE: Rgb = [0.88, 0.88, 0.86]
const RED: Rgb = [0.72, 0.13, 0.15]
const WHITE: Rgb = [0.93, 0.92, 0.9]
const BLUE: Rgb = [0.13, 0.18, 0.42]
const FLAGS: Rgb[] = [[0.72, 0.13, 0.15], [0.14, 0.22, 0.52], [0.93, 0.92, 0.9]]

/** Heights over the ground in the forecourt, metres. */
const Y = {
  base: 9.6,        // top of the rusticated lobby storeys
  band: 10.4,       // top of the string course over them
  storey: 3.22,     // the guest-room storeys
  first: 11.0,      // sill of the first guest-room storey
  wingCornice: 55.0, // the wings' cornice, under their attic
  wing: 62.0,       // the wings' roof
  towerCornice: 73.2, // the tower's cornice, under the Top of the Mark
  tower: 79.0,      // the tower's roof
  porch: 17.2,      // the frontispiece's top
  infill: 12.0,     // the block behind, over the forecourt's level
  strip: -3.0,      // the strip on Pine, below it
  annex: 7.0,       // the hipped annex's eaves
}

// ------------------------------------------------------------------------------------------------ the data

/** way/1361492525, east/north metres about its vertex centroid (37.7915664, −122.4103873), anticlockwise. */
const OUTER: [number, number][] = [
  [0.71, 19.17], [30.8, 23.74], [37.72, 24.79], [40.47, 6.4], [45.41, -25.76], [47.24, -37.58], [3.48, -44.2], [3.34, -43.31],
  [-11.27, -45.52], [-13.0, -34.31], [-17.34, -6.18], [-12.5, -5.44], [-8.89, -0.43], [-10.27, 0.49], [-10.77, 1.21], [-10.77, 2.28],
  [-10.96, 2.99], [-10.81, 3.64], [-10.16, 4.05], [-9.22, 4.2], [-8.26, 5.46], [-8.44, 6.22], [-8.29, 7.0], [-7.44, 7.46],
  [-6.84, 7.38], [-5.82, 8.79], [-6.12, 9.61], [-5.94, 10.33], [-5.39, 10.75], [-4.39, 10.84], [-3.8, 11.37], [-3.35, 11.37],
  [-1.36, 10.03], [1.5, 14.01],
]

type Kind = 'tower' | 'wing' | 'infill' | 'strip' | 'annex'
/** OSM's building:parts in the same frame (the four 4 m roof boxes left out; the frontispiece drawn on its own). */
const PARTS: { kind: Kind; ring: [number, number][] }[] = [
  { kind: 'tower', ring: [[1.5, 14.0], [-12.5, -5.4], [-12.2, -7.7], [1.3, -17.1], [3.8, -16.7], [17.6, 2.6], [17.2, 4.8], [3.8, 14.4]] },
  { kind: 'wing', ring: [[-17.3, -6.2], [-13.0, -34.3], [6.0, -31.5], [3.8, -16.7], [1.3, -17.1], [-12.2, -7.7], [-12.5, -5.4]] },
  { kind: 'wing', ring: [[1.5, 14.0], [3.8, 14.4], [17.2, 4.8], [17.6, 2.6], [33.7, 5.25], [30.8, 23.8], [0.7, 19.2]] },
  { kind: 'annex', ring: [[33.7, 5.25], [40.5, 6.4], [37.7, 24.8], [30.8, 23.8]] },
  { kind: 'infill', ring: [[6.1, -31.8], [45.4, -25.8], [40.5, 6.4], [33.7, 5.25], [17.6, 2.6], [3.8, -16.7], [6.0, -31.5]] },
  { kind: 'strip', ring: [[-11.3, -45.6], [3.4, -43.8], [47.2, -37.6], [45.4, -25.8], [6.1, -31.8], [6.0, -31.5], [-13.0, -34.3]] },
]
/** the tower's face behind the frontispiece (SW end, NE end), and the corner of the two street lines */
const PORCH_A: [number, number] = [-8.9, -0.4]
const PORCH_B: [number, number] = [-1.4, 10.0]
const PORCH_DEPTH = 3.4
const CORNER: [number, number] = [-20.7, 15.9]
const WING_W: [number, number] = [-17.3, -6.2]
const WING_N: [number, number] = [0.7, 19.2]

// ------------------------------------------------------------------------------------------- registration

/** The rigid map (rotation, optional mirror, translation) laying the known outline on the ring the builder got. */
function register(fit: Fit): (p: [number, number]) => P2 {
  const ring = fit.ring && fit.ring.length >= 3 ? fit.ring : null
  const bbox = (pts: P2[]) => {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
    return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 }
  }
  const turn = (m: number, a: number) => (p: [number, number]): P2 => {
    const x = p[0], z = p[1] * m
    return { x: x * Math.cos(a) - z * Math.sin(a), z: x * Math.sin(a) + z * Math.cos(a) }
  }
  if (!ring) {
    const b = bbox(OUTER.map((p) => ({ x: p[0], z: p[1] })))
    return (p) => ({ x: p[0] - b.cx, z: p[1] - b.cz })
  }
  const rb = bbox(ring)
  const score = (m: number, a: number): number => {
    const f = turn(m, a)
    const pts = OUTER.map(f)
    const b = bbox(pts)
    let s = 0
    for (const r of ring) {
      let d = Infinity
      for (const q of pts) d = Math.min(d, Math.hypot(q.x - b.cx + rb.cx - r.x, q.z - b.cz + rb.cz - r.z))
      s += Math.min(d, 6)
    }
    return s
  }
  let best = { m: 1, a: 0, s: Infinity }
  for (const m of [1, -1]) {
    for (let k = 0; k < 360; k += 2) {
      const a = (k * Math.PI) / 180
      const s = score(m, a)
      if (s < best.s) best = { m, a, s }
    }
  }
  for (let d = -2; d <= 2; d += 0.1) {
    const a = best.a + (d * Math.PI) / 180
    const s = score(best.m, a)
    if (s < best.s) best = { ...best, a, s }
  }
  const f = turn(best.m, best.a)
  const b = bbox(OUTER.map(f))
  // a last nudge: the mean offset of the ring's corners to the nearest known corners
  let dx = rb.cx - b.cx, dz = rb.cz - b.cz
  const pts = OUTER.map(f)
  let sx = 0, sz = 0, n = 0
  for (const r of ring) {
    let bq: P2 | null = null
    let bd = 1.5
    for (const q of pts) { const d = Math.hypot(q.x + dx - r.x, q.z + dz - r.z); if (d < bd) { bd = d; bq = q } }
    if (bq) { sx += r.x - bq.x - dx; sz += r.z - bq.z - dz; n++ }
  }
  if (n > 3) { dx += sx / n; dz += sz / n }
  return (p) => { const q = f(p); return { x: q.x + dx, z: q.z + dz } }
}

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

/** A flagpole from `a` up to `b` and its flag on the top, hung along the frame `f`. */
function flagpole(out: MeshBuilder, a: [number, number, number], b: [number, number, number], f: Fr, w: number, h: number, c: Rgb, stars = false): void {
  beam(out, a, b, Math.max(0.04, w * 0.025), POLE)
  const at = (du: number, dy: number): [number, number, number] => [b[0] + f.tx * du, b[1] + dy, b[2] + f.tz * du]
  const q: [number, number, number][] = [at(0.1, -h - 0.2), at(w, -h - 0.2), at(w, -0.2), at(0.1, -0.2)]
  out.quad(q, [f.nx, 0, f.nz], UV, c, FIXED)
  out.quad([...q].reverse(), [-f.nx, 0, -f.nz], UV, c, FIXED)
  if (stars) {
    // the Stars and Stripes: white stripes across the red, the blue canton
    for (const k of [1, 3, 5]) {
      const y0 = -0.2 - h + (h * k) / 7, y1 = y0 + h / 7
      const s: [number, number, number][] = [at(0.1, y0), at(w, y0), at(w, y1), at(0.1, y1)]
      for (const d of [1, -1]) {
        const q2 = s.map((p) => [p[0] + f.nx * 0.02 * d, p[1], p[2] + f.nz * 0.02 * d]) as [number, number, number][]
        out.quad(d > 0 ? q2 : q2.reverse(), [f.nx * d, 0, f.nz * d], UV, WHITE, FIXED)
      }
    }
    const cq: [number, number, number][] = [at(0.1, -0.2 - h * 0.55), at(0.1 + w * 0.4, -0.2 - h * 0.55), at(0.1 + w * 0.4, -0.2), at(0.1, -0.2)]
    for (const d of [1, -1]) {
      const q2 = cq.map((p) => [p[0] + f.nx * 0.04 * d, p[1], p[2] + f.nz * 0.04 * d]) as [number, number, number][]
      out.quad(d > 0 ? q2 : q2.reverse(), [f.nx * d, 0, f.nz * d], UV, BLUE, FIXED)
    }
  }
}

/** Point in polygon (even-odd). */
function inside(p: P2, ring: P2[]): boolean {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j]
    if ((a.z > p.z) !== (b.z > p.z) && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) c = !c
  }
  return c
}
const area = (r: P2[]): number => { let s = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; s += a.x * b.z - b.x * a.z } return s / 2 }

// ------------------------------------------------------------------------------------------------ the walls

interface Part { kind: Kind; ring: P2[]; top: number }

/**
 * One exposed wall of a part: the buff face from `yb` up to the part's top; where it reaches the forecourt's level
 * the rusticated base and the string course; the ranks of windows (in pale surrounds on the street faces); for the
 * tower and the wings their cornice, attic or lounge, and parapet. `occl(u)` is the top of whatever stands against
 * the wall at `u` (the frontispiece, a lower wing) — no windows below it.
 */
function wall(out: MeshBuilder, f: Fr, part: Part, yb: number, g: number, front: boolean, occl: (u: number) => number, ground: (p: P2) => number): void {
  const L = f.L
  const top = part.top
  const tall = part.kind === 'tower' || part.kind === 'wing'
  const col = tall ? WALL : BACK
  panel(out, f, 0, L, 0, yb, top, col, T.terracotta)
  if (L < 1.5) return
  // ---- the base: rusticated where it shows below the string course, its courses on the street faces
  if (tall && yb < g + Y.base) {
    panel(out, f, 0, L, 0.01, yb, g + Y.base, RUSTIC, T.granite)
    if (front) for (let y = g + Y.base - 0.9; y > yb + 0.2; y -= 1.1) panel(out, f, 0, L, 0.03, y - 0.06, y + 0.06, JOINT)
    slab(out, f, -0.15, L + 0.15, -0.3, 0.3, g + Y.base, g + Y.band, TRIM, T.granite)
    slab(out, f, -0.1, L + 0.1, -0.3, 0.18, g + Y.band + 6.1, g + Y.band + 6.4, TRIM, T.terracotta)
  }
  // ---- the bays
  const n = Math.max(1, Math.round((L - 1.6) / 3.1))
  const step = (L - 1.6) / n
  const crownAt = part.kind === 'tower' ? g + Y.towerCornice : part.kind === 'wing' ? g + Y.wingCornice : top - 0.8
  for (let i = 0; i < n; i++) {
    const u = 0.8 + step * (i + 0.5)
    const lo = Math.max(yb, occl(u))
    const gy = ground(pt(f, u, 1))
    // the guest-room storeys, up to the cornice
    // (the tower's inner bays carry twin windows, frame 06; the wings' and the ends' are single)
    const twin = part.kind === 'tower' && n >= 4 && i > 0 && i < n - 1
    for (let y = g + Y.first; y + 1.9 < crownAt - 0.3; y += Y.storey) {
      if (y < lo + 0.3) continue
      if (front) panel(out, f, u - (twin ? 1.2 : 0.78), u + (twin ? 1.2 : 0.78), 0.03, y - 0.22, y + 2.05, TRIM)
      if (twin) for (const s of [-1, 1]) panel(out, f, u + s * 0.55 - 0.42, u + s * 0.55 + 0.42, 0.05, y, y + 1.85, GLASS)
      else panel(out, f, u - 0.56, u + 0.56, 0.05, y, y + 1.85, GLASS)
    }
    // the lobby storeys: a tall arched window on the street faces, two ranks behind
    if (lo < g + Y.base - 2) {
      if (tall && front && gy < g + 1.5 && gy > g - 2.5) {
        arch(out, f, u, 0.04, Math.max(gy, g) + 1.0, 2.1, 7.2, SHADOW, 3)
        arch(out, f, u, 0.06, Math.max(gy, g) + 1.3, 1.5, 6.6, GLASS, 3)
      } else {
        for (const y of [g + 1.4, g + 5.6]) if (y > Math.max(lo, gy) + 0.5 && y + 2.1 < top - 0.4) panel(out, f, u - 0.56, u + 0.56, 0.05, y, y + 2.1, GLASS)
      }
    }
    // down the hill: the storeys below the forecourt's level
    for (let y = Math.min(g - 2.4, top - 2.6); y > Math.max(lo, gy) + 0.6; y -= Y.storey) panel(out, f, u - 0.56, u + 0.56, 0.05, y, y + 1.8, GLASS)
    // the crown storeys: arched windows in the wings' attic, the lounge's tall glazing in the tower's
    if (part.kind === 'wing') {
      for (const y of [g + Y.wingCornice + 1.3, g + Y.wingCornice + 4.4]) arch(out, f, u, 0.05, y, 1.2, 2.2, GLASS, 2)
    } else if (part.kind === 'tower') {
      arch(out, f, u, 0.05, g + Y.towerCornice + 1.0, 1.5, 2.3, GLASS, 2)
      arch(out, f, u, 0.05, g + Y.tower - 3.9, 2.0, 3.4, LOUNGE, 3)
    }
  }
  if (!tall) {
    // a plain coping on the back blocks
    slab(out, f, -0.1, L + 0.1, -0.3, 0.15, top, top + 0.7, BACK, T.concrete)
    return
  }
  // ---- the corner piers, a pale strip at each end through the shaft
  if (front && L > 4) for (const u of [0.45, L - 0.45]) slab(out, f, u - 0.45, u + 0.45, 0, 0.22, Math.max(yb, g + Y.band), crownAt, TRIM, T.terracotta)
  // ---- the cornice under the crown storeys, and the light band over the shaft's top storey
  slab(out, f, -0.4, L + 0.4, -0.3, 0.7, crownAt, crownAt + 0.7, TRIM, T.terracotta, true)
  panel(out, f, -0.4, L + 0.4, 0.71, crownAt + 0.15, crownAt + 0.3, SHADOW)
  // ---- the parapet, its cresting against the sky
  const ph = part.kind === 'tower' ? 2.2 : 1.6
  slab(out, f, -0.3, L + 0.3, -0.3, 0.35, top - 0.4, top, TRIM, T.terracotta)
  slab(out, f, -0.2, L + 0.2, -0.25, 0.2, top, top + ph, col, T.terracotta)
  const k = Math.max(1, Math.round(L / 1.6))
  for (let i = 0; i < k; i++) {
    const u = (L / k) * (i + 0.5)
    const y = top + ph
    out.quad([P(f, u - 0.42, 0.2, y), P(f, u + 0.42, 0.2, y), P(f, u, 0.2, y + 0.8), P(f, u, 0.2, y + 0.8)], [f.nx, 0, f.nz], UV, TRIM, FIXED)
  }
}

// --------------------------------------------------------------------------------------------- the entrance

/**
 * The frontispiece before the tower's face, in the forecourt: rusticated, three tall arches with the doors' dark
 * and the canopy before them, the two-storey bay over them with its windows, the balustrade, the flags.
 */
function frontispiece(out: MeshBuilder, f: Fr, g: number): void {
  const L = f.L
  const D = PORCH_DEPTH
  const top = g + Y.porch
  // the block itself (its back is in the tower's face), its rusticated lower half
  slab(out, f, 0, L, -0.5, D, -1, top, TRIM, T.granite)
  const F: Fr = { ...f, ox: f.ox + f.nx * D, oz: f.oz + f.nz * D }
  panel(out, F, 0, L, 0.01, -1, g + 8.4, RUSTIC, T.granite)
  for (let y = g + 7.5; y > g; y -= 1.1) panel(out, F, 0, L, 0.03, y - 0.06, y + 0.06, JOINT)
  // the three arches, their voussoirs, the doors' dark, the keystones
  const m = L / 2
  for (const s of [-1, 0, 1]) {
    const u = m + s * (L / 3.3)
    arch(out, F, u, 0.05, g, 3.3, 7.4, SHADOW, 5)
    arch(out, F, u, 0.07, g, 2.7, 6.9, DARK, 5)
    slab(out, F, u - 0.3, u + 0.3, 0, 0.25, g + 6.7, g + 7.6, TRIM, T.granite)
  }
  // the string course, and the two-storey bay over the arches: windows in a frame, pilasters at its ends
  slab(out, F, -0.2, L + 0.2, -0.2, 0.35, g + 8.4, g + 9.0, TRIM, T.granite)
  slab(out, F, 1.4, L - 1.4, 0, 0.6, g + 9.0, g + 15.6, TRIM, T.terracotta)
  for (const s of [-1, 0, 1]) {
    const u = m + s * (L / 3.3)
    for (const y of [g + 9.8, g + 12.9]) {
      panel(out, F, u - 1.0, u + 1.0, 0.62, y - 0.2, y + 2.4, SHADOW)
      for (const d of [-0.42, 0.42]) panel(out, F, u + d - 0.36, u + d + 0.36, 0.64, y, y + 2.2, GLASS)
    }
  }
  for (const u of [1.4, L - 1.4]) slab(out, F, u - 0.5, u + 0.5, 0, 0.8, g + 9.0, top, TRIM, T.terracotta)
  // the cornice and the balustrade on the top
  slab(out, F, -0.3, L + 0.3, -D, 0.9, top - 0.9, top - 0.3, TRIM, T.terracotta, true)
  slab(out, F, -0.2, L + 0.2, 0.55, 0.85, top - 0.3, top + 0.9, TRIM, T.terracotta)
  for (let u = 0.4; u < L - 0.2; u += 0.5) panel(out, F, u - 0.08, u + 0.08, 0.86, top - 0.2, top + 0.7, SHADOW)
  capPolygon(out, [pt(f, 0, 0), pt(f, 0, D), pt(f, L, D), pt(f, L, 0)].reverse(), top - 0.3, ROOF, T.concrete)
  // the canopy before the doors, on two bronze posts at its front
  slab(out, F, m - 5.8, m + 5.8, 0, 3.4, g + 4.6, g + 5.1, DARK, T.metal, true)
  for (const s of [-1, 1]) { const p = pt(F, m + s * 5.4, 3.1); prism(out, p.x, p.z, g - 1, g + 4.6, 0.09, 6, BRONZE, T.metal) }
  // the flags on their poles in the forecourt, south-west of the doors (frame 06)
  for (let i = 0; i < 3; i++) {
    const p = pt(F, -3.2 - i * 1.7, 2.4)
    flagpole(out, [p.x, g - 0.5, p.z], [p.x, g + 7.5, p.z], F, 1.6, 1.0, FLAGS[i])
  }
  // the steps up into the arches
  slab(out, F, m - 6, m + 6, 0, 1.0, g - 1.5, g + 0.15, PAVING, T.granite)
}

/** A gate pier in the forecourt: a square stone shaft, a cap, a lantern on top. */
function gatePier(out: MeshBuilder, p: P2, y0: number): void {
  prism(out, p.x, p.z, y0 - 1, y0 + 4.2, 0.72, 4, RUSTIC, T.granite, 0.72)
  prism(out, p.x, p.z, y0 + 4.2, y0 + 4.7, 0.95, 4, TRIM, T.granite, 0.85)
  prism(out, p.x, p.z, y0 + 4.7, y0 + 5.6, 0.3, 6, LAMP, EMIT, 0.38)
  prism(out, p.x, p.z, y0 + 5.6, y0 + 5.95, 0.45, 6, BRONZE, T.metal, 0.06)
}

// ------------------------------------------------------------------------------------------- the building

function intercontinentalMarkHopkins(out: MeshBuilder, fit: Fit): void {
  const map = register(fit)
  const M = (p: [number, number]): P2 => map(p)
  const ground = (p: P2): number => fit.groundAt?.(p.x, p.z) ?? fit.grade ?? 0
  // the frontispiece's frame: along the tower's face, outward into the forecourt
  let pa = M(PORCH_A), pb = M(PORCH_B)
  {
    // the mirror (if any) flips which side is out: the corner must be on the outward side
    const f0 = frameOf(pa, pb)
    const c = M(CORNER)
    if ((c.x - pa.x) * f0.nx + (c.z - pa.z) * f0.nz < 0) [pa, pb] = [pb, pa]
  }
  const PF = frameOf(pa, pb)
  // everything is measured from the forecourt's ground, the hill's top
  const g = Math.max(0, ground(pt(PF, PF.L / 2, PORCH_DEPTH + 4)))

  const tops: Record<Kind, number> = {
    tower: g + Y.tower, wing: g + Y.wing, infill: Math.max(4, g + Y.infill), strip: Math.max(4, g + Y.strip), annex: Math.max(4, g + Y.annex),
  }
  const parts: Part[] = PARTS.map((p) => {
    let ring = p.ring.map(M)
    if (area(ring) < 0) ring = ring.reverse()
    return { kind: p.kind, ring, top: tops[p.kind] }
  })
  const porch = [pt(PF, 0, 0), pt(PF, 0, PORCH_DEPTH), pt(PF, PF.L, PORCH_DEPTH), pt(PF, PF.L, 0)]
  const fwd = { x: PF.nx, z: PF.nz }
  // the top of whatever stands just outside a point of a wall (another part, the frontispiece), or −1
  const against = (q: P2, self: Part): number => {
    let t = -1
    for (const o of parts) if (o !== self && inside(q, o.ring)) t = Math.max(t, o.top)
    if (self.kind === 'tower' && inside(q, porch)) t = Math.max(t, g + Y.porch)
    return t
  }

  // ---- every part's exposed walls, its roof
  for (const part of parts) {
    const r = part.ring
    for (let i = 0; i < r.length; i++) {
      const f = frameOf(r[i], r[(i + 1) % r.length])
      if (f.L < 0.3) continue
      // the lowest of what stands against it along its length (the frontispiece covers only the tower face's middle)
      let yb = Infinity
      for (const t of [0.1, 0.3, 0.5, 0.7, 0.9]) yb = Math.min(yb, against(pt(f, f.L * t, 0.5), part))
      yb = Math.max(-1, yb)
      if (yb >= part.top - 0.1) continue
      // the street faces: Mason, California, the forecourt — everything not turned away from the corner
      const front = f.nx * fwd.x + f.nz * fwd.z > -0.25
      const occl = (u: number): number => Math.max(yb, against(pt(f, u, 0.5), part))
      wall(out, f, part, yb, g, front, occl, ground)
    }
    if (part.kind === 'annex') {
      stripRoof(out, r, part.top + 0.7, 3.2, TILE, 'tile')
    } else capPolygon(out, r, part.top - 0.05, ROOF, T.concrete)
  }

  const tower = parts[0]
  const tr = tower.ring
  const yt = tower.top
  // ---- the tower's crown: turrets on the chamfered corners, pinnacles at the main corners, a penthouse, the flag
  for (let i = 0; i < tr.length; i++) {
    const a = tr[i], b = tr[(i + 1) % tr.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 4) {
      // a chamfer: a little octagonal turret standing on the parapet over it, a pointed cap
      const c = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }
      prism(out, c.x, c.z, yt - 0.4, yt + 3.4, 0.85, 8, WALL, T.terracotta)
      prism(out, c.x, c.z, yt + 3.4, yt + 3.8, 1.0, 8, TRIM, T.terracotta)
      prism(out, c.x, c.z, yt + 3.8, yt + 6.0, 0.85, 8, TRIM, T.terracotta, 0.05)
    }
  }
  // pinnacles at the third points of the long crown faces
  for (let i = 0; i < tr.length; i++) {
    const f = frameOf(tr[i], tr[(i + 1) % tr.length])
    if (f.L < 12) continue
    for (const t of [1 / 3, 2 / 3]) { const p = pt(f, f.L * t, 0); pinnacle(out, p.x, p.z, yt + 2.2, 3.4, 0.7, TRIM) }
  }
  // the penthouse on the roof and the flagpole over it
  let cx = 0, cz = 0
  for (const p of tr) { cx += p.x; cz += p.z }
  cx /= tr.length; cz /= tr.length
  const along: Fr = { ox: cx, oz: cz, tx: PF.tx, tz: PF.tz, nx: PF.nx, nz: PF.nz, L: 1 }
  slab(out, along, -5, 5, -4, 2.5, yt, yt + 4.2, WALL, T.terracotta)
  slab(out, along, -5.3, 5.3, -4.3, 2.8, yt + 4.2, yt + 4.7, TRIM, T.terracotta)
  for (const u of [-2.5, 0, 2.5]) arch(out, along, u, 2.51, yt + 0.8, 1.2, 2.6, GLASS, 2)
  flagpole(out, [cx, yt + 4.7, cz], [cx, yt + 18, cz], along, 4.2, 2.6, RED, true)

  // ---- the wings' outer corners: pinnacles on their parapets
  for (const w of [parts[1], parts[2]]) {
    for (let i = 0; i < w.ring.length; i++) {
      const a = w.ring[(i + w.ring.length - 1) % w.ring.length], p = w.ring[i], b = w.ring[(i + 1) % w.ring.length]
      // only the convex corners that are not against the tower
      const cr = (p.x - a.x) * (b.z - p.z) - (p.z - a.z) * (b.x - p.x)
      if (cr <= 0 || inside({ x: p.x + (p.x - cx) * 0.02, z: p.z + (p.z - cz) * 0.02 }, tr)) continue
      let near = false
      for (const q of tr) if (Math.hypot(q.x - p.x, q.z - p.z) < 3) near = true
      if (near) continue
      pinnacle(out, p.x, p.z, w.top + 1.6, 3.0, 0.8, TRIM)
    }
  }

  // ---- the frontispiece, and the forecourt before it
  frontispiece(out, PF, g)
  const ww = M(WING_W), wn = M(WING_N), corner = M(CORNER)
  // the forecourt's paving, inset from the two streets; its gate piers at the drive's mouths; planting by the wings
  const inset = (p: P2, toward: P2, d: number): P2 => { const L = Math.hypot(toward.x - p.x, toward.z - p.z) || 1; return { x: p.x + (toward.x - p.x) * d / L, z: p.z + (toward.z - p.z) * d / L } }
  const fc = { x: (ww.x + wn.x + corner.x + pa.x + pb.x) / 5, z: (ww.z + wn.z + corner.z + pa.z + pb.z) / 5 }
  const court = [M([-12.5, -5.4]), M([1.5, 14.0]), inset(wn, fc, 1.5), inset(corner, fc, 3.0), inset(ww, fc, 1.5)]
  if (area(court) < 0) court.reverse()
  capPolygon(out, court, g + 0.06, PAVING, T.granite)
  // the two lantern piers that flank the frontispiece (frame 06), and a pair at the drive's mouths by the wings
  for (const at of [pt(PF, -1.6, PORCH_DEPTH + 1.6), pt(PF, PF.L + 1.6, PORCH_DEPTH + 1.6), inset(ww, fc, 3.2), inset(wn, fc, 3.2)]) gatePier(out, at, g)
  // the planted beds either side of the drive, a tree in each
  const bedF: Fr = frameOf(ww, wn)
  for (const t of [0.1, 0.9]) {
    const c = inset(pt(bedF, bedF.L * t, 0), fc, 4.5)
    const bf: Fr = { ...bedF, ox: c.x, oz: c.z }
    slab(out, bf, -2.4, 2.4, -1.2, 1.2, g - 0.5, g + 0.7, HEDGE, T.foliage)
    prism(out, c.x, c.z, g + 0.7, g + 2.4, 0.18, 5, BRONZE, FIXED)
    prism(out, c.x, c.z, g + 2.4, g + 6.4, 1.8, 7, TREE, T.foliage, 0.6)
  }
}

export const MARK_HOPKINS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** InterContinental Mark Hopkins (way/1361492525): the diagonal tower, its two wings, the forecourt and crown. */
  intercontinentalMarkHopkins,
}
