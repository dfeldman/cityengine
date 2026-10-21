/**
 * THE EMBARCADERO CENTER TOWERS (John Portman, 1971–82) and Embarcadero Center West (1989): one builder for the five
 * manifest entries — EC1 `way/32612608` (45 floors, 173 m), EC2 `way/32612520` and EC3 `way/32612538` (30–31, 130 m),
 * EC4 `way/616812910` (45, 174 m) and West `way/32947500` (34, 123 m). It replaces the one-line `embarcaderoCenter`
 * preset in ring-tower.ts, a fluted box (581 triangles) with none of the profile the towers are known for.
 *
 * What the photographs show (Mapillary frames along Clay/Sacramento looking east at EC1's end, and along Davis/Front
 * at EC2's long face, 2026-10-21):
 *  - four thin parallel slabs of warm white precast concrete, the windows small, deep-set and dark, a regular grid a
 *    bay wide and a floor high, so the long faces read as a fine white lattice;
 *  - the SERRATED ends: each end of the slab is broken back in a series of vertical notches, so end-on the tower is a
 *    cluster of thin fins. OSM draws these notches in every EC1–4 footprint (18–24 points, a pinwheel of offsets at
 *    each end), so the builder raises the REAL outline and does not invent them; end-on from the street the nearest
 *    fin rises highest and the rest step down behind it — the stepped crown of the photographs;
 *  - flat tops behind a plain parapet; the lowest floors (the podium storeys) recessed behind the slab's line on
 *    plain concrete piers, the slab oversailing them;
 *  - West (275 Battery) is the later, warmer one: buff stone, notched corners, a dark recessed glazing strip up the
 *    middle of each face and a scalloped parapet against the sky (frame way-32947500-05). Its OSM outline is a plain
 *    rectangle, so its corner notches are cut here.
 *
 * NOT drawn here (other builders own them, so nothing is doubled): the podium decks and bridges between the towers
 * (src/city/sf/bridges.ts EMBARCADERO_PODIUM_DECKS at EC_PODIUM_Y, sf/embarcadero.ts), EC4's podium and gateway
 * (sf/ec4-podium.ts), the podium blocks either side of Davis (districts/notable.ts `ecPodium_Davis`), the Hyatt
 * (districts/market-east.ts). This draws the tower inside its own footprint only.
 *
 * Budget: no per-window geometry (45 floors × 100 bays would be 9k quads). The facade is dark glass behind proud
 * concrete piers a bay apart and proud spandrels a floor apart, which leaves exactly the grid of deep dark windows.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { simplifyRing } from '../../tower.ts'
import { offsetRing } from '../../parts.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const T = { concrete: surfaceTag('concrete'), glass: surfaceTag('glass'), granite: surfaceTag('granite') }

/** the two looks: Portman's white precast slabs, and West's buff stone */
interface Look { wall: Rgb; pier: Rgb; glass: Rgb; base: Rgb; roof: Rgb; tag: number; pitch: number; window: number; sill: number }
const SLAB: Look = {
  wall: [0.91, 0.9, 0.86], pier: [0.93, 0.92, 0.88], glass: [0.17, 0.19, 0.23], base: [0.74, 0.73, 0.7],
  roof: [0.6, 0.6, 0.6], tag: T.concrete, pitch: 1.95, window: 0.55, sill: 0.42,
}
const WEST: Look = {
  wall: [0.76, 0.7, 0.64], pier: [0.78, 0.72, 0.66], glass: [0.2, 0.2, 0.23], base: [0.64, 0.6, 0.55],
  roof: [0.55, 0.53, 0.52], tag: T.granite, pitch: 3.0, window: 0.45, sill: 0.4,
}

// ------------------------------------------------------------------------------------------------ the outline

function area(r: P2[]): number {
  let a = 0
  for (let i = 0; i < r.length; i++) { const p = r[i]; const q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z }
  return a / 2
}
/** The fitted outline, de-duplicated, wound as towerRing() winds it (faces then point out). */
function outline(fit: Fit): P2[] {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const r = simplifyRing(raw, 0.8, 0.05)
  return area(r) >= 0 ? r : [...r].reverse()
}

/**
 * West's corners notched: each corner of a plain (≤ 8-point) outline replaced by a two-step staircase cut `a` then
 * `b` metres in along each edge — the faceted corners of the photograph.
 */
function notchCorners(r: P2[], a: number, b: number): P2[] {
  const out: P2[] = []
  const n = r.length
  for (let i = 0; i < n; i++) {
    const p = r[(i - 1 + n) % n]
    const c = r[i]
    const q = r[(i + 1) % n]
    const l1 = Math.hypot(c.x - p.x, c.z - p.z)
    const l2 = Math.hypot(q.x - c.x, q.z - c.z)
    if (l1 < 4 * b || l2 < 4 * b) { out.push(c); continue }
    const ux = (c.x - p.x) / l1, uz = (c.z - p.z) / l1    // along the incoming edge
    const vx = (q.x - c.x) / l2, vz = (q.z - c.z) / l2    // along the outgoing edge
    // walk: back b along the incoming edge, in a; forward to back a, in b (staircase), out onto the outgoing edge
    out.push({ x: c.x - ux * b, z: c.z - uz * b })
    out.push({ x: c.x - ux * b + vx * a, z: c.z - uz * b + vz * a })
    out.push({ x: c.x - ux * a + vx * a, z: c.z - uz * a + vz * a })
    out.push({ x: c.x - ux * a + vx * b, z: c.z - uz * a + vz * b })
  }
  return out
}

// ------------------------------------------------------------------------------------------------ the facade

/**
 * One storey-gridded wall on every edge of `ring` from y0 to y1: dark glass set back, concrete piers a bay apart
 * and spandrels a floor apart standing `d` proud of it. The piers carry their cheeks (they are what shades the
 * windows from an angle); on the long faces the spandrels carry a soffit too, so from the pavement looking up each
 * window has its dark head.
 */
function grid(out: MeshBuilder, ring: P2[], y0: number, y1: number, floor: number, L: Look, d = 0.45): void {
  const floors = Math.max(1, Math.round((y1 - y0) / floor))
  const fh = (y1 - y0) / floors
  const m = ring.length
  // a convex corner leaves a d × d slot between the two faces' proud planes: each front runs on past it by d
  const convex = ring.map((b, i) => {
    const a = ring[(i - 1 + m) % m], c = ring[(i + 1) % m]
    return (b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x) > 1e-6
  })
  for (let i = 0; i < m; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % m]
    const len = Math.hypot(b.x - a.x, b.z - a.z)
    if (len < 0.3) continue
    const e0 = convex[i] ? -d : 0, e1 = convex[(i + 1) % m] ? len + d : len
    const tx = (b.x - a.x) / len, tz = (b.z - a.z) / len
    const nx = tz, nz = -tx
    const n: V3 = [nx, 0, nz]
    const P = (u: number, o: number, y: number): V3 => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
    const R = (u0: number, u1: number, ya: number, yb: number, o: number, c: Rgb, tag: number, uv = UV): void =>
      out.quad([P(u0, o, ya), P(u1, o, ya), P(u1, o, yb), P(u0, o, yb)], n, uv, c, tag)
    // too short for a window (a notch's return): plain wall flush with the piers
    if (len < L.pitch * 0.9) { R(e0, e1, y0, y1, d, L.wall, L.tag); continue }
    const bays = Math.max(1, Math.round(len / L.pitch))
    const bw = len / bays
    // the glass, its uv in rooms (bays along, floors up) so a whole window lights after dark
    // (a notch's short return is seen edge-on from the street, where the glass's sky reflection drew a white crack
    // down the tower: there it is dark without the mirror)
    R(0, len, y0, y1, 0, L.glass, len < 7 ? 0 : T.glass, [[0, 0], [bays, 0], [bays, floors], [0, floors]])
    // the piers: one at each end of the edge (half-width, flush with the corner) and between every bay
    const pw = bw * (1 - L.window) / 2
    for (let k = 0; k <= bays; k++) {
      const u0 = k === 0 ? e0 : k * bw - pw, u1 = k === bays ? e1 : k * bw + pw
      R(u0, u1, y0, y1, d, L.pier, L.tag)
      if (k > 0) out.quad([P(u0, 0, y0), P(u0, d, y0), P(u0, d, y1), P(u0, 0, y1)], [-tx, 0, -tz], UV, L.pier, L.tag)
      if (k < bays) out.quad([P(u1, d, y0), P(u1, 0, y0), P(u1, 0, y1), P(u1, d, y1)], [tx, 0, tz], UV, L.pier, L.tag)
    }
    // the spandrels, a floor apart: the sill below each window row to the head of the one under it
    const sh = fh * L.sill
    for (let f = 0; f < floors; f++) {
      const ya = y0 + f * fh
      R(e0, e1, ya, ya + sh, d * 0.98, L.wall, L.tag)
      if (len > 12 && f > 0) out.quad([P(0, 0, ya), P(len, 0, ya), P(len, d * 0.98, ya), P(0, d * 0.98, ya)], [0, -1, 0], UV, L.wall, L.tag)
    }
  }
}

/** The part of `ring` with z0 ≤ z ≤ z1 (Sutherland–Hodgman against the two lines). */
function clipZ(ring: P2[], z0: number, z1: number): P2[] {
  const half = (r: P2[], inside: (p: P2) => boolean, zc: number): P2[] => {
    const o: P2[] = []
    for (let i = 0; i < r.length; i++) {
      const p = r[i], q = r[(i + 1) % r.length]
      const pi = inside(p), qi = inside(q)
      if (pi) o.push(p)
      if (pi !== qi) { const t = (zc - p.z) / (q.z - p.z); o.push({ x: p.x + (q.x - p.x) * t, z: zc }) }
    }
    return o
  }
  const r = half(half(ring, (p) => p.z >= z0, z0), (p) => p.z <= z1, z1)
  // a clip line lying along one of the outline's own edges leaves doubled and collinear points, which offsetRing
  // turns into spikes
  return r.length >= 3 ? simplifyRing(r, 0.3, 0.02) : r
}

/** A plain band of wall round the ring, `o` proud (the parapet, the podium's piers). */
function band(out: MeshBuilder, ring: P2[], y0: number, y1: number, o: number, c: Rgb, tag: number): void {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const len = Math.hypot(b.x - a.x, b.z - a.z)
    if (len < 0.05) continue
    const tx = (b.x - a.x) / len, tz = (b.z - a.z) / len
    const nx = tz, nz = -tx
    const P = (u: number, y: number): V3 => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
    out.quad([P(0, y0), P(len, y0), P(len, y1), P(0, y1)], [nx, 0, nz], UV, c, tag)
  }
}

/** The flat annulus between a ring and the same ring offset (a ledge, or a soffit when `down`). */
function ledge(out: MeshBuilder, outer: P2[], inner: P2[], y: number, c: Rgb, tag: number, down = false): void {
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length
    const q: V3[] = [[outer[i].x, y, outer[i].z], [outer[j].x, y, outer[j].z], [inner[j].x, y, inner[j].z], [inner[i].x, y, inner[i].z]]
    out.quad((down ? [q[3], q[2], q[1], q[0]] : q) as [V3, V3, V3, V3], [0, down ? -1 : 1, 0], UV, c, tag)
  }
}

// ------------------------------------------------------------------------------------------------ the tower

function embarcaderoCenter(out: MeshBuilder, fit: Fit): void {
  let ring = outline(fit)
  const H = fit.height > 40 ? fit.height : 130
  // West: the near-square, un-notched outline (OSM gives it 7 points); EC1–4 are 2.2:1 slabs drawn notched
  const xs = ring.map((p) => p.x), zs = ring.map((p) => p.z)
  const w = Math.max(...xs) - Math.min(...xs), dep = Math.max(...zs) - Math.min(...zs)
  const west = ring.length <= 8 && Math.max(w, dep) / Math.min(w, dep) < 1.6
  const L = west ? WEST : SLAB
  // an un-notched outline (West's own, or a slab's arriving as a hull or a bare rectangle) gets its corners
  // notched here, so the serration never depends on OSM having drawn it
  if (ring.length <= 8) ring = notchCorners(ring, 3, 6.5)
  const floors = west ? 34 : H > 150 ? 45 : 31
  const g = Math.max(0, Math.min(fit.grade ?? 0, 12))
  const parapet = 1.4
  const roofY = H - parapet
  const baseTop = g + (3 * H) / (floors + 0.4)
  const floor = (roofY - baseTop) / (floors - 3)

  // the podium storeys: recessed 2 m behind the slab, the slab's soffit over them
  const recess = offsetRing(ring, -2)
  band(out, recess, 0, baseTop, 0, L.base, L.tag)
  band(out, recess, g + 0.3, g + 4.6, 0.06, L.glass, T.glass)
  band(out, recess, g + 4.6, g + 5.2, 0.12, L.base, L.tag)
  ledge(out, ring, recess, baseTop, L.base, L.tag, true)

  /*
   * The shaft, in TIERS across the slab's width: the end-on photographs (way-32612608-03/05/06, looking east along
   * Clay) show a stepped crown, the middle third of the slab highest and each fin either side of it stopping a
   * couple of floors lower, the outermost lower again. Each tier is the real outline clipped to a band of z (the
   * slab's short axis) and stops a whole number of floors down, so the grids of all three line up.
   */
  const zs2 = ring.map((p) => p.z)
  const z0 = Math.min(...zs2), z1 = Math.max(...zs2)
  const zc = (z0 + z1) / 2, W = z1 - z0
  // a band's edge falls on one of the outline's own notch lines where one is near, or a sliver of the next fin
  // out stands up beside it as a spike
  const snap = (z: number): number => {
    let best = z, d = W * 0.09
    for (const p of ring) if (Math.abs(p.z - z) < d && Math.abs(p.z - zc) > 1) { best = p.z; d = Math.abs(p.z - z) }
    return best
  }
  const tiers: { ring: P2[]; top: number }[] = west
    ? [{ ring, top: roofY }]
    : [
      { ring, top: roofY - floor * STEP[1] },
      { ring: clipZ(ring, snap(zc - W * BAND[0]), snap(zc + W * BAND[0])), top: roofY - floor * STEP[0] },
      { ring: clipZ(ring, snap(zc - W * BAND[1]), snap(zc + W * BAND[1])), top: roofY },
    ]
  let y = baseTop
  for (const t of tiers) {
    if (t.ring.length < 3) continue
    grid(out, t.ring, y, t.top, floor, L)
    // the parapet: a plain band the piers' depth proud, round the tier's whole notched outline, and its roof
    const proud = offsetRing(t.ring, 0.45)
    band(out, proud, t.top, t.top + parapet, 0, L.wall, L.tag)
    ledge(out, proud, t.ring, t.top + parapet, L.wall, L.tag)
    capPolygon(out, t.ring, t.top + parapet - 0.3, L.roof, 0)
    y = t.top
  }
  if (west) westDress(out, ring, baseTop, roofY, parapet, floor, L)
}

/**
 * West's own marks (way-32947500-05): a dark recessed band of glazing up the middle of each long face, and over
 * it the parapet rising in a shallow segmental arch — the scalloped skyline of the photograph.
 */
function westDress(out: MeshBuilder, ring: P2[], y0: number, roofY: number, parapet: number, floor: number, L: Look): void {
  const top = roofY + parapet
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const len = Math.hypot(b.x - a.x, b.z - a.z)
    if (len < 18) continue
    const tx = (b.x - a.x) / len, tz = (b.z - a.z) / len
    const nx = tz, nz = -tx
    const n: V3 = [nx, 0, nz]
    const P = (u: number, o: number, y: number): V3 => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
    const mid = len / 2
    // the glazing strip: dark glass a little proud of the piers, a thin mullion a floor apart
    const hw = Math.min(2.6, len * 0.08)
    const o = 0.5
    out.quad([P(mid - hw, o, y0), P(mid + hw, o, y0), P(mid + hw, o, roofY), P(mid - hw, o, roofY)], n,
      [[0, 0], [1, 0], [1, (roofY - y0) / floor], [0, (roofY - y0) / floor]], L.glass, T.glass)
    for (const [u, s] of [[mid - hw, -1], [mid + hw, 1]] as const) {
      out.quad([P(u, 0.45, y0), P(u, o + 0.05, y0), P(u, o + 0.05, roofY), P(u, 0.45, roofY)], [tx * s, 0, tz * s], UV, L.pier, L.tag)
    }
    for (let y = y0 + floor; y < roofY - 0.5; y += floor) {
      out.quad([P(mid - hw, o + 0.03, y - 0.12), P(mid + hw, o + 0.03, y - 0.12), P(mid + hw, o + 0.03, y + 0.12), P(mid - hw, o + 0.03, y + 0.12)], n, UV, L.pier, L.tag)
    }
    // the arched parapet over the middle of the face: a thin wall, its face, its back and its curved top
    const span = len * 0.62
    const rise = Math.min(5, span * 0.18)
    const seg = 8
    const t = 0.4
    for (let k = 0; k < seg; k++) {
      const u0 = mid - span / 2 + (span * k) / seg, u1 = mid - span / 2 + (span * (k + 1)) / seg
      const h0 = top + rise * Math.sin((Math.PI * k) / seg), h1 = top + rise * Math.sin((Math.PI * (k + 1)) / seg)
      out.quad([P(u0, 0.45, top), P(u1, 0.45, top), P(u1, 0.45, h1), P(u0, 0.45, h0)], n, UV, L.wall, L.tag)
      out.quad([P(u1, 0.45 - t, top - 0.2), P(u0, 0.45 - t, top - 0.2), P(u0, 0.45 - t, h0), P(u1, 0.45 - t, h1)], [-nx, 0, -nz], UV, L.wall, L.tag)
      out.quad([P(u0, 0.45, h0), P(u1, 0.45, h1), P(u1, 0.45 - t, h1), P(u0, 0.45 - t, h0)], [0, 1, 0], UV, L.wall, L.tag)
    }
  }
}

/** The slab's tiers: half-widths of the two upper bands (fractions of the slab's depth), and floors each stops short */
const BAND = [0.36, 0.18]
const STEP = [2, 4]

export const EMBARCADERO_CENTER: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  embarcaderoCenter,
}
