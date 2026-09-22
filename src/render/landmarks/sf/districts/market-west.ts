/**
 * San Francisco's individually modelled buildings: market-west (SF_PLAN.md §10; the batch list is docs/sf-batches/market-west.md).
 * One builder per building, most of them a tower-grammar spec (render/landmarks/tower.ts) from Street View and
 * photographs; the few that need more, their own geometry here. Registered through render/landmarks/sf/index.ts;
 * placed by public/landmarks/san-francisco/market-west.json.
 *
 * Market Street from Sixth and Taylor to Octavia, and the Civic Center: the theatre blocks (the Warfield, the
 * Golden Gate, the Orpheum), the domed Hibernia Bank, the hotels and lofts of the 1910s–20s, the Art Deco
 * Furniture Mart, the 1960s–70s slabs by Van Ness (Fox Plaza, 1 South Van Ness, 1455 Market), the 2010s towers
 * (NEMA, 100 Van Ness), and the Beaux-Arts Civic Center round City Hall.
 *
 * The frame: a builder is handed a footprint ring either in the city's fitted frame (the front toward −z) or, in
 * tools/model-shots.ts, in plain map axes (x east, z north). So the geometry a grammar spec cannot draw — a
 * marquee, a blade sign, a corner dome — is placed on an edge of the ring found by its LENGTH (`edgeNear`), which
 * no rotation changes, and never at a fixed offset from the centre.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { faceBand, insetRing, tower, towerRing, type Face, type TowerSpec } from '../../tower.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

type P2 = { x: number; z: number }
const FIXED = 0
/** a light source: keeps its colour and glows after dark (models.ts EMIT) */
const EMIT = 0.5

const T = {
  terracotta: surfaceTag('terracotta'), granite: surfaceTag('granite'), metal: surfaceTag('metal'), copper: surfaceTag('copper'),
  tile: surfaceTag('tile'), stucco: surfaceTag('stucco'), concrete: surfaceTag('concrete'), glass: surfaceTag('glass'), ashlar: surfaceTag('ashlar'),
}

/** A dome of stacked rings, like kit.ts's, but in a surface of its own (copper, terracotta). */
function dome(out: MeshBuilder, cx: number, cz: number, y0: number, r: number, h: number, colour: Rgb, sides = 16, tag = T.copper): void {
  const rings = 6
  for (let k = 0; k < rings; k++) {
    const a0 = (k / rings) * (Math.PI / 2)
    const a1 = ((k + 1) / rings) * (Math.PI / 2)
    prism(out, cx, cz, y0 + Math.sin(a0) * h, y0 + Math.sin(a1) * h, Math.cos(a0) * r, sides, colour, tag, Math.max(0.01, Math.cos(a1) * r), k === rings - 1)
  }
}

const spec = (s: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, s)

// ---------------------------------------------------------------------------------------------- the ring's edges

/** Douglas–Peucker on a closed ring: OSM's long notchy outlines (the Opera House is 96 points) drawn as walls. */
export function simplifyRing(ring: P2[], tol: number): P2[] {
  if (ring.length <= 4) return ring
  // start from the two points furthest apart, and simplify each half as an open line
  let i0 = 0
  let i1 = 0
  let best = -1
  for (let i = 0; i < ring.length; i++) {
    for (let j = i + 1; j < ring.length; j++) {
      const d = Math.hypot(ring[i].x - ring[j].x, ring[i].z - ring[j].z)
      if (d > best) { best = d; i0 = i; i1 = j }
    }
  }
  const line = (from: number, to: number): P2[] => {
    const pts: P2[] = []
    for (let k = from; ; k = (k + 1) % ring.length) { pts.push(ring[k]); if (k === to) break }
    return pts
  }
  const dp = (pts: P2[]): P2[] => {
    if (pts.length <= 2) return pts
    const a = pts[0]
    const b = pts[pts.length - 1]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    let far = 0
    let at = 0
    for (let k = 1; k < pts.length - 1; k++) {
      const d = Math.abs((b.x - a.x) * (a.z - pts[k].z) - (a.x - pts[k].x) * (b.z - a.z)) / L
      if (d > far) { far = d; at = k }
    }
    if (far <= tol) return [a, b]
    const left = dp(pts.slice(0, at + 1))
    return [...left.slice(0, -1), ...dp(pts.slice(at))]
  }
  const h1 = dp(line(i0, i1))
  const h2 = dp(line(i1, i0))
  return [...h1.slice(0, -1), ...h2.slice(0, -1)]
}

interface Edge { a: P2; b: P2; tx: number; tz: number; nx: number; nz: number; L: number }

/** Edge i of an anticlockwise ring: its unit direction, its outward normal (tz, −tx), its length. */
function edgeOf(ring: P2[], i: number): Edge {
  const a = ring[i]
  const b = ring[(i + 1) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { a, b, tx, tz, nx: tz, nz: -tx, L }
}

/**
 * The edge nearest `len` metres long: how a builder finds its street front in either frame. Ties (the fitted
 * rectangle's two long sides, in the city) go to the one toward −z, the front.
 */
function edgeNear(ring: P2[], len: number): Edge {
  let best = 0
  let score = Infinity
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    const s = Math.abs(e.L - len) + ((e.a.z + e.b.z) / 2) * 0.01
    if (s < score) { score = s; best = i }
  }
  return edgeOf(ring, best)
}

/**
 * True when the fit came without a footprint and the ring is the fitted BOX (render/landmarks.ts only passes the
 * real outline for a `court` entry, so in the city this is the ordinary case): the front is then the −z side and
 * the corners and curves a builder looks for are not there to find.
 */
/** A point `u` along an edge and `o` out from it (negative: into the building). */
const at = (e: Edge, u: number, o: number): P2 => ({ x: e.a.x + e.tx * u + e.nx * o, z: e.a.z + e.tz * u + e.nz * o })

const boxed = (ring: P2[]): boolean => ring.length === 4

/** The −z side of the fitted box: the front, in the city's frame. */
const frontOfBox = (ring: P2[]): Edge => {
  let best = edgeOf(ring, 0)
  for (let i = 1; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    if (e.nz < best.nz) best = e
  }
  return best
}

/** A piece of one edge as an edge of its own (the same outward normal): a corner bay on a plain box. */
const partOf = (e: Edge, u0: number, u1: number): Edge => {
  const a = at(e, u0, 0)
  const b = at(e, u1, 0)
  return { a, b, tx: e.tx, tz: e.tz, nx: e.nx, nz: e.nz, L: Math.abs(u1 - u0) }
}

const quad = (out: MeshBuilder, p: [number, number, number][], n: [number, number, number], c: Rgb, tag = FIXED): void =>
  out.quad(p, n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)

/**
 * A block in an edge's frame: `u0..u1` along it from its first corner, `o0..o1` out from the wall (negative is
 * into the building), `y0..y1` up. Six faces.
 */
function slab(out: MeshBuilder, e: Edge, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  const P = (u: number, o: number, y: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]
  quad(out, [P(u0, o1, y0), P(u1, o1, y0), P(u1, o1, y1), P(u0, o1, y1)], [e.nx, 0, e.nz], c, tag)
  quad(out, [P(u1, o0, y0), P(u0, o0, y0), P(u0, o0, y1), P(u1, o0, y1)], [-e.nx, 0, -e.nz], c, tag)
  quad(out, [P(u0, o0, y0), P(u0, o1, y0), P(u0, o1, y1), P(u0, o0, y1)], [-e.tx, 0, -e.tz], c, tag)
  quad(out, [P(u1, o1, y0), P(u1, o0, y0), P(u1, o0, y1), P(u1, o1, y1)], [e.tx, 0, e.tz], c, tag)
  quad(out, [P(u0, o0, y1), P(u0, o1, y1), P(u1, o1, y1), P(u1, o0, y1)], [0, 1, 0], c, tag)
  quad(out, [P(u0, o1, y0), P(u0, o0, y0), P(u1, o0, y0), P(u1, o1, y0)], [0, -1, 0], c, tag)
}

/** A flat panel on the wall, facing out, `o` metres proud of it. */
function panel(out: MeshBuilder, e: Edge, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  const P = (u: number, y: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]
  quad(out, [P(u0, y0), P(u1, y0), P(u1, y1), P(u0, y1)], [e.nx, 0, e.nz], c, tag)
}

/**
 * A theatre marquee: a box `w` wide and `h` tall hung `depth` out over the pavement at `y0`, centred `u` along
 * the edge; a lit readerboard on its front and cheeks, the name's band of lamps above it, the soffit lit
 * underneath. The letters themselves are not drawn: at a rider's distance a marquee is its colours and its glow.
 */
function marquee(out: MeshBuilder, e: Edge, u: number, w: number, y0: number, h: number, depth: number, o: {
  frame: Rgb; board: Rgb; name?: Rgb; nameShare?: number; soffit?: Rgb
  /** the panel behind the name, and how many letters it has (0: one lit strip) */
  nameBack?: Rgb; letters?: number
  /** the bulbs round its edges */
  bulb?: Rgb
}): void {
  const u0 = u - w / 2
  const u1 = u + w / 2
  slab(out, e, u0, u1, 0, depth, y0, y0 + h, o.frame, T.metal)
  // the chaser bulbs along its top and bottom edges
  const bulb: Rgb = o.bulb ?? [1, 0.86, 0.5]
  for (let uu = u0 + 0.3; uu < u1 - 0.2; uu += 0.6) {
    for (const yy of [y0 + 0.12, y0 + h - 0.12]) panel(out, e, uu - 0.1, uu + 0.1, depth + 0.06, yy - 0.1, yy + 0.1, bulb, EMIT)
  }
  const share = o.name ? (o.nameShare ?? 0.35) : 0
  const yb = y0 + h * 0.1
  const yt = y0 + h * (0.92 - share)
  // the readerboard on the front, and wrapping round the cheeks
  panel(out, e, u0 + 0.25, u1 - 0.25, depth + 0.03, yb, yt, o.board, EMIT)
  const cheek = (uu: number, s: number): void => {
    const P = (oo: number, y: number): [number, number, number] => [e.a.x + e.tx * (uu + s * 0.03) + e.nx * oo, y, e.a.z + e.tz * (uu + s * 0.03) + e.nz * oo]
    quad(out, [P(depth - 0.2, yb), P(0.4, yb), P(0.4, yt), P(depth - 0.2, yt)], [e.tx * s, 0, e.tz * s], o.board, EMIT)
  }
  cheek(u0, -1)
  cheek(u1, 1)
  if (o.name) {
    // the name: a panel, and a lamp-lit block per letter on it
    const ya = yt + h * 0.05
    const yz = y0 + h * 0.9
    panel(out, e, u0 + 0.4, u1 - 0.4, depth + 0.05, ya, yz, o.nameBack ?? o.frame, T.metal)
    const n = o.letters ?? 0
    if (n === 0) panel(out, e, u0 + 0.8, u1 - 0.8, depth + 0.08, ya + (yz - ya) * 0.18, yz - (yz - ya) * 0.18, o.name, EMIT)
    const span = (u1 - u0 - 1.6) / Math.max(1, n)
    for (let k = 0; k < n; k++) {
      const c = u0 + 0.8 + span * (k + 0.5)
      panel(out, e, c - span * 0.32, c + span * 0.32, depth + 0.08, ya + (yz - ya) * 0.14, yz - (yz - ya) * 0.14, o.name, EMIT)
    }
  }
  // the soffit, lit
  const P = (uu: number, oo: number): [number, number, number] => [e.a.x + e.tx * uu + e.nx * oo, y0 - 0.02, e.a.z + e.tz * uu + e.nz * oo]
  quad(out, [P(u0 + 0.2, depth - 0.2), P(u0 + 0.2, 0.1), P(u1 - 0.2, 0.1), P(u1 - 0.2, depth - 0.2)], [0, -1, 0], o.soffit ?? [1, 0.92, 0.7], EMIT)
}

/**
 * A vertical blade sign standing out from the wall at `u` along the edge, `y0..y1`, `depth` out, `t` thick; the
 * name down both faces as a lit strip.
 */
function blade(out: MeshBuilder, e: Edge, u: number, y0: number, y1: number, depth: number, t: number, body: Rgb, lit: Rgb): void {
  slab(out, e, u - t / 2, u + t / 2, 0.3, 0.3 + depth, y0, y1, body, T.metal)
  for (const s of [-1, 1]) {
    const uu = u + s * (t / 2 + 0.02)
    const P = (oo: number, y: number): [number, number, number] => [e.a.x + e.tx * uu + e.nx * oo, y, e.a.z + e.tz * uu + e.nz * oo]
    quad(out, [P(0.3 + depth * 0.8, y0 + 0.6), P(0.3 + depth * 0.2, y0 + 0.6), P(0.3 + depth * 0.2, y1 - 0.6), P(0.3 + depth * 0.8, y1 - 0.6)], [e.tx * s, 0, e.tz * s], lit, EMIT)
  }
}

/** A tower spec raised on the fitted ring, then `extra` drawn on the same ring. */
const specPlus = (s: TowerSpec, extra: (out: MeshBuilder, ring: P2[], H: number) => void) => (out: MeshBuilder, fit: Fit): void => {
  tower(out, fit, s)
  const H = fit.height > 0.6 * s.height && fit.height < 1.6 * s.height ? fit.height : s.height
  extra(out, towerRing(fit), H)
}


/** The middle of the short edges (≤ `max` m) of a ring: a rounded corner, as OSM draws one. */
function roundCorner(ring: P2[], max: number): { c: P2; toward: P2 } {
  let x = 0
  let z = 0
  let n = 0
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    if (e.L > max) continue
    x += (e.a.x + e.b.x) / 2
    z += (e.a.z + e.b.z) / 2
    n++
  }
  const c = { x: x / Math.max(1, n), z: z / Math.max(1, n) }
  let mx = 0
  let mz = 0
  for (const p of ring) { mx += p.x; mz += p.z }
  mx /= ring.length
  mz /= ring.length
  const l = Math.hypot(mx - c.x, mz - c.z) || 1
  // the way into the building from the corner
  return { c, toward: { x: (mx - c.x) / l, z: (mz - c.z) / l } }
}

/** A face drawn on part of one wall only, `o` metres proud of it (the grammar's faces go round the whole ring). */
function faceOn(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, f: Face, o = 0.02): void {
  faceBand(out, [at(e, u0, o), at(e, u1, o), at(e, u1, o - 1), at(e, u0, o - 1)], y0, y1, f)
}

/** The long walls of a slab: every edge of `min` metres or more running with its longest edge. */
function longWalls(ring: P2[], min: number): Edge[] {
  let L = edgeOf(ring, 0)
  for (let i = 1; i < ring.length; i++) if (edgeOf(ring, i).L > L.L) L = edgeOf(ring, i)
  const res: Edge[] = []
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    if (e.L >= min && Math.abs(e.tx * L.tx + e.tz * L.tz) > 0.95) res.push(e)
  }
  return res
}

/** The end walls of a slab: every edge of `min` metres or more square to its longest edge. */
function endWalls(ring: P2[], min: number): Edge[] {
  let L = edgeOf(ring, 0)
  for (let i = 1; i < ring.length; i++) if (edgeOf(ring, i).L > L.L) L = edgeOf(ring, i)
  const res: Edge[] = []
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    if (e.L >= min && Math.abs(e.tx * L.tx + e.tz * L.tz) < 0.3) res.push(e)
  }
  return res
}

/** A strip of the building along an edge, `u0..u1` along it and `d` deep: anticlockwise, like a footprint. */
const strip = (e: Edge, u0: number, u1: number, d: number): P2[] => [at(e, u0, 0), at(e, u1, 0), at(e, u1, -d), at(e, u0, -d)]

/** The part of a ring more than `d` metres in from an edge's line (Sutherland–Hodgman on one half-plane). */
function behind(ring: P2[], e: Edge, d: number): P2[] {
  const o = (p: P2): number => (p.x - e.a.x) * e.nx + (p.z - e.a.z) * e.nz + d
  const res: P2[] = []
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    const op = o(p)
    const oq = o(q)
    if (op <= 0) res.push(p)
    if ((op < 0 && oq > 0) || (op > 0 && oq < 0)) {
      const t = op / (op - oq)
      res.push({ x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t })
    }
  }
  return res
}

/** A mansard (or hip) on a ring at height y: sloping in by `inset` over `h`, capped. */
function mansardOn(out: MeshBuilder, ring: P2[], y: number, h: number, inset: number, c: Rgb, tag = T.metal, given?: P2[]): void {
  const top = given ?? insetRing(ring, inset)
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    const e = edgeOf(ring, i)
    const n = Math.hypot(h, inset) || 1
    quad(out, [[ring[i].x, y, ring[i].z], [ring[j].x, y, ring[j].z], [top[j].x, y + h, top[j].z], [top[i].x, y + h, top[i].z]], [e.nx * h / n, inset / n, e.nz * h / n], c, tag)
  }
  capPolygon(out, top, y + h, c, tag)
}

/** A hip or mansard roof over a strip along an edge (insetRing shrinks a long strip toward its middle). */
function stripRoof(out: MeshBuilder, e: Edge, u0: number, u1: number, d: number, y: number, h: number, inset: number, c: Rgb, tag: number): void {
  const i = Math.min(inset, d / 2 - 0.2)
  mansardOn(out, strip(e, u0, u1, d), y, h, inset, c, tag, [at(e, u0 + i, -i), at(e, u1 - i, -i), at(e, u1 - i, -(d - i)), at(e, u0 + i, -(d - i))])
}

/**
 * A screen standing up from the roof edge along a wall, its top a curve: `hMid` above the roof in the middle of
 * the wall, `hEnd` at its ends (the Federal Building's scooped skyline).
 */
function crest(out: MeshBuilder, e: Edge, y: number, hMid: number, hEnd: number, c: Rgb, tag: number, n = 10): void {
  const h = (u: number): number => hMid + (hEnd - hMid) * (2 * u / e.L - 1) ** 2
  for (let k = 0; k < n; k++) {
    const u0 = (k / n) * e.L
    const u1 = ((k + 1) / n) * e.L
    const A = at(e, u0, 0.1)
    const B = at(e, u1, 0.1)
    quad(out, [[A.x, y, A.z], [B.x, y, B.z], [B.x, y + h(u1), B.z], [A.x, y + h(u0), A.z]], [e.nx, 0, e.nz], c, tag)
  }
}

/**
 * A colonnade standing in front of a wall: round columns `r` thick every `pitch` metres (in pairs `pair` apart
 * when given), `o` out, from y0 to y1, over a darker panel for the loggia behind them.
 */
function colonnade(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, o: number, r: number, pitch: number, c: Rgb, tag: number, back?: Rgb, pair = 0): void {
  if (back) panel(out, e, u0, u1, 0.04, y0, y1, back, tag)
  const n = Math.max(1, Math.round((u1 - u0) / pitch))
  const step = (u1 - u0) / n
  for (let k = 0; k <= n; k++) {
    for (const d of pair ? [-pair / 2, pair / 2] : [0]) {
      const u = u0 + k * step + d
      if (u < u0 - 0.01 || u > u1 + 0.01) continue
      const p = at(e, u, o)
      prism(out, p.x, p.z, y0, y0 + 0.6, r * 1.35, 6, c, tag)
      prism(out, p.x, p.z, y0 + 0.6, y1 - 0.7, r, 8, c, tag, r * 0.88)
      prism(out, p.x, p.z, y1 - 0.7, y1, r * 1.3, 6, c, tag, r * 1.4)
    }
  }
  // the entablature over them
  slab(out, e, u0, u1, 0, o + r * 1.5, y1, y1 + 1.2, c, tag)
}

/** A tower spec raised on a ring of the builder's own (a front range, a wing, a tower on its podium). */
const raise = (out: MeshBuilder, ring: P2[], height: number, s: TowerSpec): void => tower(out, { hx: 0, hz: 0, height, ring }, s)

// --------------------------------------------------------------------------------------------------- palettes

const CREAM_TERRACOTTA: Rgb = [0.88, 0.86, 0.8]
const WARM_GLASS: Rgb = [0.24, 0.26, 0.28]

export const MARKET_WEST: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * The Warfield Building (1922, G. Albert Lansburgh), 982–988 Market at Taylor: nine storeys of cream glazed
   * terracotta over the theatre's lobby. A two-storey base of big arched openings; two storeys of ornamented
   * piers; a plain shaft of paired windows; an arcade of round-headed windows under a deep modillioned cornice.
   * The marquee is the 1940s–50s one: a deep maroon box, a faceted panel with the orange WARFIELD letters over a
   * white readerboard, on the Market front towards Fifth. (Commons: "Warfield Theatre, 982-988 Market St., ...
   * 9-3-2012 5-07-20 PM.JPG", "San Francisco Warfield.jpg".)
   */
  warfieldBuilding: specPlus({
    height: 40,
    base: { height: 8.5, face: { kind: 'punched', material: 'terracotta', wall: CREAM_TERRACOTTA, glass: [0.18, 0.2, 0.22], pitch: 5.6, solid: 0.22, floor: 8.5, arched: true } },
    tiers: [
      { to: 16.5, face: { kind: 'fins', material: 'terracotta', wall: CREAM_TERRACOTTA, glass: WARM_GLASS, pitch: 5.2, solid: 0.3, depth: 0.35, floor: 4 }, cornice: { depth: 0.7, height: 1.1 } },
      { to: 35, face: { kind: 'fins', material: 'terracotta', wall: CREAM_TERRACOTTA, glass: WARM_GLASS, pitch: 5.2, solid: 0.3, depth: 0.25, floor: 3.7 } },
      { to: 1, face: { kind: 'punched', material: 'terracotta', wall: CREAM_TERRACOTTA, glass: WARM_GLASS, pitch: 2.6, solid: 0.42, floor: 5, arched: true }, cornice: { depth: 1.3, height: 1.5 } },
    ],
    roof: [0.55, 0.53, 0.5],
    crown: { kind: 'mast', height: 9, width: 0.14, colour: [0.85, 0.85, 0.85] },
  }, (out, ring) => {
    // the mullion down the middle of each pair of windows in the shaft
    faceBand(out, ring, 16.5, 35, { kind: 'fins', material: 'terracotta', wall: CREAM_TERRACOTTA, glass: WARM_GLASS, pitch: 2.6, solid: 0.07, depth: 0.12, floor: 3.7 })
    const e = edgeNear(ring, 46.7)
    marquee(out, e, e.L * 0.68, 13, 4.6, 5.2, 3.2, { frame: [0.36, 0.17, 0.17], board: [0.95, 0.94, 0.9], name: [0.98, 0.6, 0.16], nameShare: 0.4, nameBack: [0.42, 0.3, 0.26], letters: 8 })
  }),

  /**
   * The Warfield's auditorium (1922) behind the office block: a plain stucco box the colour of the terracotta,
   * lower, with the fly tower at its back. Nothing on it but the fire escapes and some murals.
   */
  warfieldAuditorium: spec({
    height: 22,
    tiers: [{ to: 1, face: { kind: 'blank', material: 'stucco', wall: [0.8, 0.77, 0.7] }, cornice: { depth: 0.3, height: 0.6 } }],
    roof: [0.5, 0.49, 0.47],
    crown: { kind: 'parapet', height: 0.8, colour: [0.78, 0.75, 0.68] },
  }),

  /**
   * The Golden Gate Theatre (1922, G. Albert Lansburgh), 1 Taylor at Market and Golden Gate Avenue: the theatre
   * under an eight-storey office block of brown brick on a two-storey arcade of cream terracotta, round-arched
   * windows along the top floor, a cornice. Its corner is cut off to face up Market, and it rises into an
   * octagonal terracotta cupola with a little dome; the two tall GOLDEN GATE blades flank it, and the marquee
   * wraps the corner over the entrance. (Commons: "Golden Gate Theatre - San Francisco, CA - DSC06532.jpg",
   * "Golden Gate Theatre, 1-35 Taylor St., ... 9-3-2012 5-09-19 PM.JPG".)
   */
  goldenGateTheatre: specPlus({
    height: 31,
    base: { height: 8.5, face: { kind: 'punched', material: 'terracotta', wall: [0.86, 0.8, 0.68], glass: [0.2, 0.2, 0.21], pitch: 5, solid: 0.26, floor: 8.5, arched: true } },
    tiers: [
      { to: 26.5, face: { kind: 'punched', material: 'brick', wall: [0.5, 0.36, 0.25], glass: [0.2, 0.21, 0.23], pitch: 2.4, solid: 0.5, floor: 3.6 } },
      { to: 1, face: { kind: 'punched', material: 'brick', wall: [0.5, 0.36, 0.25], glass: [0.2, 0.21, 0.23], pitch: 2.1, solid: 0.45, floor: 4.5, arched: true }, cornice: { depth: 0.9, height: 1.1, colour: [0.84, 0.78, 0.66] } },
    ],
    roof: [0.45, 0.42, 0.4],
  }, (out, ring, H) => {
    const cream: Rgb = [0.87, 0.82, 0.7]
    // (on a plain fitted box the cut corner is not in the outline: take the east end of the front instead)
    const corner = boxed(ring) ? partOf(frontOfBox(ring), frontOfBox(ring).L - 8, frontOfBox(ring).L - 1.5) : edgeNear(ring, 6.1)
    // the corner bay goes up a storey more, into the octagonal cupola and its dome
    const c = at(corner, corner.L / 2, -4.2)
    prism(out, c.x, c.z, H - 2, H + 3.5, 4.6, 8, cream, T.terracotta)
    prism(out, c.x, c.z, H + 3.5, H + 4.3, 5.1, 8, cream, T.terracotta)
    prism(out, c.x, c.z, H + 4.3, H + 8.5, 3.8, 8, [0.84, 0.79, 0.68], T.terracotta)
    // the round windows of the lantern
    for (let k = 0; k < 8; k++) {
      const a = ((k + 0.5) / 8) * Math.PI * 2
      const r = 3.8 * Math.cos(Math.PI / 8) + 0.03
      prism(out, c.x + Math.sin(a) * r, c.z + Math.cos(a) * r, H + 5.6, H + 7.4, 0.55, 6, [0.25, 0.25, 0.26], T.glass)
    }
    dome(out, c.x, c.z, H + 8.5, 4, 2.6, [0.8, 0.76, 0.66], 8, T.terracotta)
    prism(out, c.x, c.z, H + 11, H + 14, 0.14, 4, [0.6, 0.58, 0.5], T.metal)
    // the two blades either side of the corner, and the marquee round it
    const i0 = ring.indexOf(corner.a)
    const sides = boxed(ring) || i0 < 0
      ? [partOf(corner, -9, -2.5), partOf(corner, corner.L + 2.5, corner.L + 9)]
      : [edgeOf(ring, (i0 + ring.length - 1) % ring.length), edgeOf(ring, (i0 + 1) % ring.length)]
    const body: Rgb = [0.3, 0.29, 0.28]
    const lit: Rgb = [0.93, 0.88, 0.72]
    // (the blades stand at the ends of the cut corner, square to it, so from up Market they read face on)
    for (const [u0, u1] of [[-2.1, -0.2], [corner.L + 0.2, corner.L + 2.1]]) {
      slab(out, corner, u0, u1, 0.1, 0.7, 9.5, H - 1, body, T.metal)
      // G-O-L-D-E-N G-A-T-E down it, a lit block a letter
      const step = (H - 11.5) / 11
      for (let k = 0; k < 11; k++) if (k !== 6) panel(out, corner, u0 + 0.45, u1 - 0.45, 0.72, H - 1.8 - step * (k + 1) + step * 0.2, H - 1.8 - step * k, lit, EMIT)
    }
    const frame: Rgb = [0.13, 0.13, 0.14]
    const board: Rgb = [0.94, 0.95, 0.97]
    marquee(out, corner, corner.L / 2, corner.L + 0.4, 4.4, 2.4, 2.6, { frame, board })
    marquee(out, sides[0], sides[0].L - 4, 7.6, 4.4, 2.4, 2.6, { frame, board })
    marquee(out, sides[1], 4, 7.6, 4.4, 2.4, 2.6, { frame, board })
  }),

  /**
   * The Orpheum (1926, B. Marcus Priteca), 1192 Market at Hyde: a Spanish-Plateresque front range of cream
   * terracotta four tall storeys high under a red tile hip roof: a ground-floor arcade, a row of arched windows
   * over it, two storeys of big grouped windows between thick ornamented piers, an attic of little oculi. The
   * bronze ORPHEUM blade stands up past the eaves in the middle of the Market front over a small dark marquee;
   * the plain auditorium and stage house rise behind. (Commons: "San Francisco Orpheum Theatre 01.jpg",
   * "Orpheum Theatre Market st.jpg".)
   */
  orpheumTheatre: (out: MeshBuilder, fit: Fit): void => {
    const ring = towerRing(fit)
    const H = fit.height > 20 && fit.height < 60 ? fit.height : 46
    const stone: Rgb = [0.89, 0.86, 0.78]
    const e = edgeNear(ring, 59.6)
    // the auditorium and stage house: plain, behind
    raise(out, behind(ring, e, 13.5), Math.min(H, 28), {
      height: 30,
      tiers: [{ to: 1, face: { kind: 'blank', material: 'stucco', wall: [0.84, 0.83, 0.79] } }],
      roof: [0.5, 0.5, 0.5],
      crown: { kind: 'parapet', height: 0.8, colour: [0.8, 0.79, 0.75] },
    })
    raise(out, strip(e, -0.3, e.L + 0.3, 14), 22, {
      height: 22,
      base: { height: 7.5, face: { kind: 'punched', material: 'terracotta', wall: stone, glass: [0.2, 0.21, 0.22], pitch: 6.4, solid: 0.2, floor: 7.5, arched: true } },
      tiers: [
        { to: 11.5, face: { kind: 'punched', material: 'terracotta', wall: stone, glass: [0.26, 0.29, 0.3], pitch: 3.2, solid: 0.42, floor: 4, arched: true }, cornice: { depth: 0.4, height: 0.5 } },
        { to: 19.5, face: { kind: 'fins', material: 'terracotta', wall: stone, glass: [0.33, 0.38, 0.4], pitch: 9.6, solid: 0.14, depth: 0.5, floor: 4 } },
        { to: 1, face: { kind: 'punched', material: 'terracotta', wall: stone, glass: [0.3, 0.3, 0.3], pitch: 4.8, solid: 0.82, floor: 2.5 }, cornice: { depth: 0.9, height: 0.7 } },
      ],
      roof: [0.62, 0.3, 0.22],
    })
    // the red tile hip roof
    stripRoof(out, e, -0.3, e.L + 0.3, 14, 22, 3.4, 5.5, [0.62, 0.3, 0.22], T.tile)
    // the mullions of the big windows
    faceBand(out, [at(e, 0.2, 0.01), at(e, e.L - 0.2, 0.01), at(e, e.L - 0.2, -1), at(e, 0.2, -1)].slice(0), 11.5, 19.5, { kind: 'fins', material: 'terracotta', wall: stone, glass: [0.33, 0.38, 0.4], pitch: 2.4, solid: 0.08, depth: 0.12, floor: 4 })
    // the blade, up past the eaves, and its little crowned top; the marquee under it
    const u = e.L * 0.5
    const bronze: Rgb = [0.6, 0.52, 0.32]
    blade(out, e, u, 9.5, 31, 1.5, 0.9, bronze, [0.95, 0.9, 0.72])
    slab(out, e, u - 0.7, u + 0.7, 0.2, 2.2, 31, 32.2, bronze, T.metal)
    prism(out, at(e, u, 1.2).x, at(e, u, 1.2).z, 32.2, 34, 0.5, 4, bronze, T.metal, 0.05)
    marquee(out, e, u + 1.5, 10, 4.2, 2.2, 2.4, { frame: [0.13, 0.2, 0.18], board: [0.9, 0.85, 0.66] })
  },

  /**
   * The Hibernia Bank (1892, Albert Pissis; enlarged 1905), 1 Jones at Market and McAllister: a single tall
   * storey of white granite, pilasters and tall windows down both flanks under a balustrade, and on the rounded
   * corner a portico of four Corinthian columns carrying a drum and the green copper dome with its lantern. The
   * first of the city's domed corner banks. (Commons: "2017 Hibernia Bank 1 Jones Street.jpg", "Hibernia Bank
   * Building San Francisco 2019.jpg".)
   */
  hiberniaBank: specPlus({
    height: 14,
    base: { height: 1.4, face: { kind: 'blank', material: 'granite', wall: [0.78, 0.77, 0.74] } },
    tiers: [
      { to: 1, face: { kind: 'fins', material: 'granite', wall: [0.9, 0.89, 0.86], glass: [0.3, 0.32, 0.33], pitch: 4.6, solid: 0.42, depth: 0.45, floor: 12.6 }, cornice: { depth: 0.8, height: 1.4 } },
    ],
    roof: [0.55, 0.55, 0.55],
    crown: { kind: 'parapet', height: 1.3, colour: [0.88, 0.87, 0.84] },
  }, (out, ring, H) => {
    const stone: Rgb = [0.91, 0.9, 0.87]
    const copper: Rgb = [0.44, 0.63, 0.56]
    // (a plain fitted box has no rounded corner: the dome then goes over the east end of the front)
    const f = frontOfBox(ring)
    const { c: corner, toward } = boxed(ring)
      ? { c: at(f, f.L - 9, 0), toward: { x: -f.nx, z: -f.nz } }
      : roundCorner(ring, 5)
    const d = 7.5
    const c = { x: corner.x + toward.x * d, z: corner.z + toward.z * d }
    // the portico: four columns round the corner, an entablature over them
    const face = Math.atan2(-toward.x, -toward.z)
    for (let k = 0; k < 4; k++) {
      const a = face + (k - 1.5) * 0.36
      const r = d + 1.6
      const x = c.x + Math.sin(a) * r
      const z = c.z + Math.cos(a) * r
      prism(out, x, z, 1.4, 2.3, 0.85, 8, stone, T.granite)
      prism(out, x, z, 2.3, 11.6, 0.6, 10, stone, T.granite, 0.52)
      prism(out, x, z, 11.6, 12.6, 0.62, 8, stone, T.granite, 0.85)
    }
    prism(out, c.x, c.z, 12.6, H + 1.3, d + 2.2, 16, stone, T.granite)
    // the drum, its windows, the dome and lantern
    const R = 6.4
    prism(out, c.x, c.z, H + 1.3, H + 6.5, R, 16, stone, T.granite)
    prism(out, c.x, c.z, H + 6.5, H + 7.3, R + 0.5, 16, stone, T.granite)
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2
      const x = c.x + Math.sin(a) * (R + 0.02)
      const z = c.z + Math.cos(a) * (R + 0.02)
      prism(out, x, z, H + 2.8, H + 5.4, 0.7, 4, [0.25, 0.27, 0.28], T.glass)
    }
    dome(out, c.x, c.z, H + 7.3, R, 6.2, copper, 16)
    prism(out, c.x, c.z, H + 13.3, H + 15.5, 1.3, 8, copper, T.copper)
    dome(out, c.x, c.z, H + 15.5, 1.5, 1.2, copper, 8)
    prism(out, c.x, c.z, H + 16.5, H + 19.5, 0.08, 4, [0.5, 0.5, 0.5], T.metal)
  }),

  /**
   * The San Francisco Furniture Mart (1937, Lewis Hobart), 1355 Market: Market Square, Twitter's headquarters from
   * 2012. A whole block of buff Art Deco terracotta, eleven storeys: deep piers running the full height with
   * the windows in pairs between them over dark spandrels, a carved frieze over the two-storey base and another
   * along the parapet, and in the middle of the Market front a wider tower bay that rises two storeys more to a
   * glazed penthouse set back on it. (Commons: "Twitter Headquarters.jpg", "Twitter headquarters building.JPG",
   * "TwitterHeadquarters2022.jpg".)
   */
  furnitureMart: specPlus({
    height: 41,
    base: { height: 9, face: { kind: 'fins', material: 'terracotta', wall: [0.8, 0.72, 0.6], glass: [0.2, 0.21, 0.22], pitch: 4.6, solid: 0.3, depth: 0.5, floor: 4.5 } },
    tiers: [
      { to: 10.2, face: { kind: 'blank', material: 'terracotta', wall: [0.76, 0.68, 0.56] } },
      { to: 0.96, face: { kind: 'fins', material: 'terracotta', wall: [0.8, 0.72, 0.6], glass: [0.27, 0.27, 0.28], pitch: 4.6, solid: 0.36, depth: 0.5, floor: 3.4 } },
      { to: 1, face: { kind: 'blank', material: 'terracotta', wall: [0.76, 0.68, 0.56] } },
    ],
    roof: [0.5, 0.48, 0.46],
    crown: { kind: 'parapet', height: 1.2, colour: [0.78, 0.7, 0.58] },
  }, (out, ring, H) => {
    const buff: Rgb = [0.8, 0.72, 0.6]
    // the mullion between each pair of windows
    faceBand(out, ring, 10.2, H * 0.96, { kind: 'fins', material: 'terracotta', wall: buff, glass: [0.27, 0.27, 0.28], pitch: 2.3, solid: 0.07, depth: 0.15, floor: 3.4 })
    // the tower bay in the middle of the Market front, up two storeys more, the penthouse set back on it
    // (the frontage's middle is where its 61.7 m and 42.2 m lengths meet)
    const e = boxed(ring) ? frontOfBox(ring) : edgeNear(ring, 61.7)
    const g = edgeNear(ring, 42.2)
    const mid = boxed(ring) ? e.L / 2 : (g.a === e.b || g.b === e.b ? e.L : 0)
    const bay = strip(e, mid - 12.5, mid + 12.5, 20)
    raise(out, bay, H + 7.5, {
      height: H + 7.5,
      tiers: [
        { to: H - 0.5, face: { kind: 'fins', material: 'terracotta', wall: buff, glass: [0.27, 0.27, 0.28], pitch: 3.2, solid: 0.4, depth: 0.7, floor: 3.4 } },
        { to: 1, face: { kind: 'fins', material: 'terracotta', wall: buff, glass: [0.27, 0.27, 0.28], pitch: 3.2, solid: 0.5, depth: 0.7, floor: 3.6 } },
      ],
      roof: [0.5, 0.48, 0.46],
      crown: { kind: 'lantern', height: 4, inset: 3.2, face: { kind: 'curtain', wall: [0.3, 0.3, 0.3], glass: [0.3, 0.34, 0.37], pitch: 2, floor: 4 } },
    })
  }),

  /**
   * The Hotel Whitcomb (1911, Reid Bros.), 1231 Market: built as the Whitcomb, City Hall while the new one was
   * going up. Nine storeys of pale grey-white, plain punched windows up the shaft, the top floor an arcade of
   * round-headed windows in an ornamented frieze under a heavy bracketed cornice, a glazed mansard penthouse set
   * back on the roof, a tall two-storey base of piers and shopfronts, the maroon HOTEL WHITCOMB blade on the
   * Market front. (Commons: "San Francisco - Hotel Whitcomb.jpg", "Hotel Whitcomb 1 2017-04-05.jpg".)
   */
  hotelWhitcomb: specPlus({
    height: 37,
    base: { height: 8.5, face: { kind: 'fins', material: 'terracotta', wall: [0.9, 0.9, 0.88], glass: [0.22, 0.23, 0.25], pitch: 5.2, solid: 0.26, depth: 0.4, floor: 4.25 }, canopy: { depth: 0.6, colour: [0.72, 0.62, 0.42] } },
    tiers: [
      { to: 32.5, face: { kind: 'punched', material: 'terracotta', wall: [0.86, 0.87, 0.87], glass: [0.23, 0.25, 0.27], pitch: 3.3, solid: 0.55, floor: 3.4 } },
      { to: 1, face: { kind: 'punched', material: 'terracotta', wall: [0.88, 0.88, 0.86], glass: [0.23, 0.25, 0.27], pitch: 3.3, solid: 0.55, floor: 4.5, arched: true }, cornice: { depth: 1.4, height: 1.4, colour: [0.82, 0.82, 0.8] } },
    ],
    roof: [0.5, 0.5, 0.5],
  }, (out, ring, H) => {
    const e = edgeNear(ring, 64.9)
    // the glazed mansard penthouse, on the Market range only (the back is light courts)
    stripRoof(out, e, 3.5, e.L - 3.5, 14, H, 3.6, 1.8, [0.56, 0.62, 0.64], T.metal)
    blade(out, e, e.L * 0.72, 9.5, 27, 1.3, 0.35, [0.42, 0.14, 0.18], [0.92, 0.78, 0.5])
  }),

  /**
   * Fox Plaza (1966), 1390 Market on the site of the Fox Theatre: a 29-storey slab of white concrete, its narrow
   * ends blank but for a strip of windows up the middle, its broad faces a fine grid of glass over the office
   * floors and, above, the flats' balconies in columns; a plain parapet. (Commons: "Archstone Fox Plaza.jpg", "Fox Plaza San Francisco.jpg".)
   */
  foxPlaza: (out: MeshBuilder, fit: Fit): void => {
    const ring = simplifyRing(towerRing(fit), 1.2)
    const H = fit.height > 80 && fit.height < 140 ? fit.height : 107
    const white: Rgb = [0.88, 0.87, 0.83]
    raise(out, ring, H, {
      height: H,
      tiers: [{ to: 1, face: { kind: 'blank', material: 'concrete', wall: white } }],
      roof: [0.55, 0.55, 0.55],
      crown: { kind: 'parapet', height: 2.5, colour: white },
      penthouse: 1,
    })
    const office = H * 0.45
    for (const e of longWalls(ring, 8)) {
      // the office floors: a fine grid of white mullions over the glass; the flats: balconies in columns
      faceOn(out, e, 0.6, e.L - 0.6, 7, office, { kind: 'curtain', wall: white, glass: [0.3, 0.36, 0.42], pitch: 1.7, floor: 3.7 })
      faceOn(out, e, 0.6, e.L - 0.6, office, H - 2, { kind: 'fins', material: 'concrete', wall: white, glass: [0.42, 0.44, 0.45], pitch: 3.2, solid: 0.22, depth: 0.9, floor: 2.9 })
      faceOn(out, e, 0.6, e.L - 0.6, office, H - 2, { kind: 'bands', material: 'concrete', wall: white, glass: [0.36, 0.38, 0.4], solid: 0.3, floor: 2.9 }, 0.5)
      faceOn(out, e, 0.6, e.L - 0.6, 0, 7, { kind: 'curtain', wall: [0.3, 0.3, 0.3], glass: [0.2, 0.22, 0.24], pitch: 3, floor: 7 })
    }
    for (const e of endWalls(ring, 8)) {
      // the ends are blank, but for the recess up the middle, glazed floor by floor
      if (e.L > 10.5) continue
      faceOn(out, e, 0.4, e.L - 0.4, 7, H - 3, { kind: 'curtain', wall: white, glass: [0.3, 0.36, 0.42], pitch: 1.8, floor: 3.2 })
      faceOn(out, e, 0.4, e.L - 0.4, 0, 7, { kind: 'curtain', wall: [0.3, 0.3, 0.3], glass: [0.2, 0.22, 0.24], pitch: 2.4, floor: 7 })
    }
  },

  /**
   * 100 Van Ness (1974 as the AAA building; re-clad as flats in 2015), Van Ness at Hayes: 29 storeys of
   * blue-green glass with white floor lines, a white panel pattern on the ends, a white frame strip up the long
   * faces, the white open frame of the crown; a glazed podium on white columns. (Commons: "100 Van Ness
   * Corner.jpg".)
   */
  vanNess100: specPlus({
    height: 122,
    base: { height: 8, face: { kind: 'fins', material: 'metal', wall: [0.88, 0.89, 0.9], glass: [0.2, 0.25, 0.28], pitch: 7, solid: 0.12, depth: 0.6, floor: 8 } },
    tiers: [
      { to: 24, face: { kind: 'curtain', wall: [0.8, 0.83, 0.84], glass: [0.2, 0.42, 0.5], pitch: 1.6, floor: 4 } },
      { to: 1, face: { kind: 'curtain', wall: [0.85, 0.88, 0.89], glass: [0.18, 0.44, 0.54], pitch: 1.5, floor: 3.4 } },
    ],
    roof: [0.5, 0.52, 0.53],
    crown: { kind: 'parapet', height: 2.5, colour: [0.3, 0.45, 0.5] },
  }, (out, ring, H) => {
    const white: Rgb = [0.9, 0.91, 0.92]
    for (const e of endWalls(ring, 20)) {
      // the ends' white spandrel panels, staggered floor by floor (as bands, which is their gist)
      faceOn(out, e, 0.3, e.L - 0.3, 24, H - 3, { kind: 'bands', material: 'metal', wall: white, glass: [0.24, 0.42, 0.48], solid: 0.3, floor: 3.4 }, 0.03)
    }
    for (const e of longWalls(ring, 20)) {
      // the white frame strip up the face, and the white frame of the crown along its top
      slab(out, e, e.L * 0.72, e.L * 0.72 + 3.2, 0, 0.35, 26, H - 6, white, T.metal)
      slab(out, e, 0, e.L, 0, 0.4, H + 5, H + 6.2, white, T.metal)
      slab(out, e, 0, 0.9, 0, 0.4, H - 1, H + 6.2, white, T.metal)
      slab(out, e, e.L - 0.9, e.L, 0, 0.4, H - 1, H + 6.2, white, T.metal)
    }
  }),

  /**
   * 1 South Van Ness (1959; the city's offices, the SFMTA's headquarters), Market at Van Ness: eight storeys of
   * grey-beige precast panels, the windows deep in metal frames a floor high, thin white lines along each floor,
   * a two-storey glazed base. (Commons: "One South Van Ness (SFMTA offices), April 2026.jpg".)
   */
  oneSouthVanNess: spec({
    height: 36,
    base: { height: 7, face: { kind: 'curtain', wall: [0.6, 0.62, 0.64], glass: [0.3, 0.36, 0.38], pitch: 2.4, floor: 3.5 }, canopy: { depth: 1.2, colour: [0.55, 0.56, 0.58] } },
    tiers: [
      { to: 1, face: { kind: 'punched', material: 'concrete', wall: [0.67, 0.65, 0.61], glass: [0.3, 0.32, 0.34], pitch: 3.4, solid: 0.5, floor: 3.9 }, cornice: { depth: 0.3, height: 0.4, colour: [0.82, 0.82, 0.8] } },
    ],
    roof: [0.5, 0.5, 0.5],
    penthouse: 1,
  }),

  /**
   * 1455 Market (1979, Steven Tipping & Associates; built as the Bank of America's data centre, Square's
   * headquarters from 2013): a 22-storey tower of cream precast concrete with its corners cut off, long ribbons
   * of dark windows in threes between plain piers, louvred plant floors at the top, on a broad low podium.
   * (Commons: "1455marketstreet.jpg".)
   */
  market1455: (out: MeshBuilder, fit: Fit): void => {
    const ring = towerRing(fit)
    const H = fit.height > 70 && fit.height < 140 ? fit.height : 100
    const cream: Rgb = [0.86, 0.84, 0.78]
    raise(out, ring, H, {
      height: H,
      tiers: [{ to: 1, face: { kind: 'blank', material: 'concrete', wall: cream }, cornice: { depth: 0.3, height: 0.5 } }],
      roof: [0.55, 0.55, 0.55],
      penthouse: 2,
    })
    for (let i = 0; i < ring.length; i++) {
      const e = edgeOf(ring, i)
      if (e.L < 22) continue
      // three ribbon windows a floor, the top two floors louvred; the corners stay blank
      faceOn(out, e, 1.5, e.L - 1.5, 14, H - 9, { kind: 'punched', material: 'concrete', wall: cream, glass: [0.18, 0.2, 0.23], pitch: e.L / 3.2, solid: 0.14, floor: 4.4 })
      faceOn(out, e, 1.5, e.L - 1.5, H - 9, H - 1, { kind: 'punched', material: 'concrete', wall: cream, glass: [0.28, 0.28, 0.28], pitch: e.L / 3.2, solid: 0.14, floor: 4 })
      faceOn(out, e, 1.5, e.L - 1.5, 0, 14, { kind: 'fins', material: 'concrete', wall: cream, glass: [0.2, 0.22, 0.24], pitch: 6, solid: 0.2, depth: 0.4, floor: 4.6 })
    }
  },

  /** 1455 Market's podium: eight storeys of the same cream precast, ribbon windows, a glazed ground floor. */
  market1455Podium: spec({
    height: 32,
    base: { height: 5, face: { kind: 'curtain', material: 'metal', wall: [0.5, 0.5, 0.5], glass: [0.22, 0.25, 0.27], pitch: 3, floor: 5 } },
    tiers: [{ to: 1, face: { kind: 'bands', material: 'concrete', wall: [0.86, 0.84, 0.78], glass: [0.2, 0.22, 0.25], solid: 0.6, floor: 3.4 } }],
    roof: [0.55, 0.55, 0.55],
    crown: { kind: 'parapet', height: 1, colour: [0.84, 0.82, 0.76] },
  }),

  /**
   * Dolby's headquarters, 1275 Market (1970s; refitted 2016): sixteen storeys of dark red-brown granite, the
   * windows in long ribbons of four between broad granite piers and deep spandrels, and two white DOLBY blades.
   * (Commons: "Dolby Laboratories, Inc. headquarters in San Francisco (TK1).jpg".)
   */
  dolbyBuilding: specPlus({
    height: 64,
    base: { height: 9, face: { kind: 'fins', material: 'granite', wall: [0.34, 0.3, 0.29], glass: [0.2, 0.22, 0.24], pitch: 7, solid: 0.25, depth: 0.6, floor: 4.5 } },
    tiers: [
      { to: 1, face: { kind: 'punched', material: 'granite', wall: [0.33, 0.3, 0.29], glass: [0.3, 0.36, 0.42], pitch: 7, solid: 0.26, floor: 3.45 } },
    ],
    roof: [0.4, 0.38, 0.37],
    crown: { kind: 'parapet', height: 1, colour: [0.36, 0.32, 0.3] },
    penthouse: 1,
  }, (out, ring, H) => {
    const e = edgeNear(ring, 73.9)
    const white: Rgb = [0.93, 0.93, 0.92]
    const grey: Rgb = [0.45, 0.46, 0.47]
    for (const [u, y0, y1] of [[1.2, 12, H * 0.62], [e.L - 1.5, 6, 26]]) {
      blade(out, e, u, y0, y1, 2.4, 0.5, white, white)
      // the name down it, dark on the white
      for (const s of [-1, 1]) {
        const uu = u + s * 0.3
        for (let k = 0; k < 5; k++) {
          const ya = y1 - 1.5 - ((y1 - y0 - 3) / 5) * (k + 1) + 0.4
          const yb = y1 - 1.5 - ((y1 - y0 - 3) / 5) * k - 0.4
          const P = (oo: number, y: number): [number, number, number] => [e.a.x + e.tx * uu + e.nx * oo, y, e.a.z + e.tz * uu + e.nz * oo]
          out.quad([P(1.9, ya), P(1.0, ya), P(1.0, yb), P(1.9, yb)], [e.tx * s, 0, e.tz * s], [[0, 0], [1, 0], [1, 1], [0, 1]], grey, FIXED)
        }
      }
    }
  }),

  /**
   * NEMA (2014, Handel Architects), 8 Tenth Street: two towers of dark glass on dark podiums at Market and Tenth,
   * the north one 37 storeys on a many-sided plan, the south one 24; a grid of thin dark mullions with dark
   * fins scattered up it in columns, balconies notched into one face. (Commons: "NEMA San Francisco.jpg".)
   */
  nemaTower: specPlus({
    height: 106,
    base: { height: 6, face: { kind: 'curtain', wall: [0.14, 0.15, 0.16], glass: [0.3, 0.36, 0.38], pitch: 3, floor: 6 } },
    tiers: [{ to: 1, face: { kind: 'curtain', wall: [0.14, 0.15, 0.17], glass: [0.26, 0.42, 0.5], pitch: 1.5, floor: 2.9 } }],
    roof: [0.3, 0.3, 0.32],
    crown: { kind: 'parapet', height: 3.5, colour: [0.28, 0.36, 0.4] },
  }, (out, ring, H) => {
    faceBand(out, ring, 6, H, { kind: 'fins', wall: [0.14, 0.15, 0.17], glass: [0.3, 0.4, 0.45], pitch: 4.6, solid: 0.09, depth: 0.25, floor: 2.9 })
  }),
  nemaPodium: spec({
    height: 36,
    base: { height: 6, face: { kind: 'curtain', wall: [0.14, 0.15, 0.16], glass: [0.3, 0.36, 0.38], pitch: 3, floor: 6 } },
    tiers: [{ to: 1, face: { kind: 'punched', material: 'metal', wall: [0.19, 0.2, 0.21], glass: [0.4, 0.5, 0.54], pitch: 2.6, solid: 0.35, floor: 3.1 } }],
    roof: [0.32, 0.32, 0.33],
    crown: { kind: 'parapet', height: 1.1, colour: [0.2, 0.21, 0.22] },
  }),

  /**
   * The San Francisco Federal Building (2007, Thom Mayne / Morphosis), 90 Seventh Street at Mission: an 18-storey
   * slab 110 m long and only 20 m thick. The south-east face is a skin of perforated stainless steel, silver, with
   * slots of window behind it, a solid panel with three boxed windows, and a three-storey sky garden cut into it;
   * the north-west face is hung with tall frosted-glass sunshades; the metal skin rises past the roof in a
   * scooped crest, high at the ends. (Commons: "San Francisco Federal Building (main structure, seen from Mission
   * and 7th, 2020).jpg", "San Francisco Federal Building.jpg".)
   */
  federalBuilding: specPlus({
    height: 72,
    base: { height: 6, face: { kind: 'curtain', material: 'metal', wall: [0.55, 0.56, 0.56], glass: [0.26, 0.3, 0.32], pitch: 3, floor: 6 } },
    tiers: [{ to: 1, face: { kind: 'bands', material: 'metal', wall: [0.62, 0.65, 0.67], glass: [0.26, 0.29, 0.32], solid: 0.78, floor: 3.65 } }],
    roof: [0.55, 0.56, 0.56],
  }, (out, ring, H) => {
    const steel: Rgb = [0.64, 0.67, 0.69]
    const nw = edgeNear(ring, 109.8)
    // the sunshades: frosted glass fins the height of the north-west face
    faceOn(out, nw, 1, nw.L - 1, 8, H - 1, { kind: 'fins', material: 'glass', wall: [0.82, 0.86, 0.84], glass: [0.3, 0.36, 0.38], pitch: 1.6, solid: 0.3, depth: 1.1, floor: 3.65 })
    crest(out, nw, H, 1.5, 8, steel, T.metal)
    const se = edgeNear(ring, 49.8)
    crest(out, se, H, 2, 7, steel, T.metal, 6)
    const sw = edgeNear(ring, 34.8)
    crest(out, sw, H, 7, 3, steel, T.metal, 4)
    // the solid panel with its three boxed windows, and the sky garden
    const u = se.L * 0.25
    panel(out, se, u - 5, u + 5, 0.16, 18, H - 2, [0.72, 0.74, 0.75], T.metal)
    for (const y of [24, 36, 48]) {
      slab(out, se, u - 1.8, u + 1.8, 0, 1.2, y, y + 3.4, [0.9, 0.91, 0.92], T.metal)
      panel(out, se, u - 1.2, u + 1.2, 1.22, y + 0.6, y + 2.8, [0.25, 0.3, 0.34], T.glass)
    }
    panel(out, se, se.L * 0.42, se.L * 0.68, 0.2, H * 0.5, H * 0.5 + 11, [0.1, 0.11, 0.12], FIXED)
  }),

  /** The Federal Building's annex: five storeys of dark glass between white end walls, on the plaza. */
  federalBuildingAnnex: spec({
    height: 21,
    tiers: [{ to: 1, face: { kind: 'curtain', material: 'metal', wall: [0.82, 0.84, 0.85], glass: [0.22, 0.32, 0.38], pitch: 2.2, floor: 4.2 } }],
    roof: [0.6, 0.6, 0.6],
    crown: { kind: 'parapet', height: 1, colour: [0.9, 0.9, 0.9] },
  }),

  /**
   * The Asian Art Museum (1917, George Kelham, as the Main Library; the museum since 2003, Gae Aulenti), 200
   * Larkin on Civic Center Plaza: grey granite Beaux-Arts, a rusticated ground storey, a piano nobile of tall
   * round-arched windows down the long sides, the Larkin front a loggia of paired columns under an inscribed
   * frieze, a mezzanine and a deep bracketed cornice; the 2023 pavilion, a white box, on the Hyde Street wing.
   * (Commons: "2017 Asian Art Museum.jpg", "Asian Art Museum - San Francisco - Joy of Museums.jpg".)
   */
  asianArtMuseum: specPlus({
    height: 29,
    base: { height: 10, face: { kind: 'punched', material: 'granite', wall: [0.74, 0.74, 0.72], glass: [0.26, 0.28, 0.3], pitch: 5.4, solid: 0.72, floor: 5 } },
    tiers: [
      { to: 22, face: { kind: 'punched', material: 'granite', wall: [0.76, 0.76, 0.74], glass: [0.3, 0.32, 0.33], pitch: 5.4, solid: 0.45, floor: 12, arched: true }, cornice: { depth: 0.4, height: 0.5 } },
      { to: 1, face: { kind: 'punched', material: 'granite', wall: [0.76, 0.76, 0.74], glass: [0.28, 0.3, 0.31], pitch: 5.4, solid: 0.72, floor: 7 }, cornice: { depth: 1.5, height: 1.4 } },
    ],
    roof: [0.55, 0.55, 0.55],
    crown: { kind: 'parapet', height: 1.2, colour: [0.74, 0.74, 0.72] },
  }, (out, ring, H) => {
    const granite: Rgb = [0.78, 0.78, 0.76]
    // the loggia on Larkin: paired columns across the front's two lengths
    for (const len of [29.9, 19.1]) {
      const e = edgeNear(ring, len)
      colonnade(out, e, 1.5, e.L - 1.5, 10, 21, 1.6, 0.65, 5.2, granite, T.granite, [0.32, 0.33, 0.34], 1.9)
    }
    // the 2023 pavilion over the Hyde Street wing: a white box with a band of glass
    const h = edgeNear(ring, 26)
    const pav = strip(h, 0.5, h.L - 0.5, 30)
    faceBand(out, pav, H, H + 2.2, { kind: 'blank', material: 'stucco', wall: [0.88, 0.88, 0.87] })
    faceBand(out, pav, H + 2.2, H + 5, { kind: 'curtain', material: 'metal', wall: [0.7, 0.72, 0.73], glass: [0.3, 0.4, 0.44], pitch: 2, floor: 2.8 })
    faceBand(out, pav, H + 5, H + 9, { kind: 'blank', material: 'stucco', wall: [0.93, 0.93, 0.92] })
    capPolygon(out, pav, H + 9, [0.85, 0.85, 0.84], T.stucco)
  }),

  /**
   * The Main Library (1996, Pei Cobb Freed with Simon Martin-Vegue Winkelstein Moris), 100 Larkin: a grey granite
   * block that answers the old library across Fulton Street: a grid of tall windows between plain piers, a
   * rusticated base, a thin cornice; the south and east sides are the modern ones. (Commons: "San Francisco
   * Public Library - Main Branch, exterior, from McAllister and Larkin Street.jpg".)
   */
  mainLibrary: spec({
    height: 38,
    base: { height: 8, face: { kind: 'punched', material: 'granite', wall: [0.72, 0.73, 0.73], glass: [0.26, 0.29, 0.31], pitch: 4.4, solid: 0.55, floor: 4 } },
    tiers: [
      { to: 30, face: { kind: 'punched', material: 'granite', wall: [0.75, 0.76, 0.76], glass: [0.3, 0.33, 0.35], pitch: 4.4, solid: 0.48, floor: 5.5 }, cornice: { depth: 0.4, height: 0.6 } },
      { to: 1, face: { kind: 'punched', material: 'granite', wall: [0.75, 0.76, 0.76], glass: [0.3, 0.33, 0.35], pitch: 4.4, solid: 0.6, floor: 4 }, cornice: { depth: 0.9, height: 0.8 } },
    ],
    roof: [0.55, 0.56, 0.56],
    crown: { kind: 'parapet', height: 1, colour: [0.72, 0.73, 0.73] },
  }),

  /**
   * 50 United Nations Plaza (1936, Arthur Brown Jr.), the Federal Office Building on UN Plaza: six storeys of grey
   * granite, a rusticated base, a giant order of engaged columns down the long plaza front, rounded corner
   * pavilions, an attic storey under a balustrade and a low grey roof. (Commons: "2017 50 United Nations Plaza
   * Federal Office Building.jpg".)
   */
  unPlazaFederal: specPlus({
    height: 29,
    base: { height: 8.5, face: { kind: 'punched', material: 'granite', wall: [0.72, 0.72, 0.7], glass: [0.26, 0.28, 0.3], pitch: 4.2, solid: 0.62, floor: 4.25 }, canopy: { depth: 0.3, colour: [0.7, 0.7, 0.68] } },
    tiers: [
      { to: 22, face: { kind: 'punched', material: 'granite', wall: [0.76, 0.76, 0.74], glass: [0.28, 0.3, 0.32], pitch: 4.2, solid: 0.55, floor: 4.5 }, cornice: { depth: 1.1, height: 1.2 } },
      { to: 1, face: { kind: 'punched', material: 'granite', wall: [0.76, 0.76, 0.74], glass: [0.28, 0.3, 0.32], pitch: 4.2, solid: 0.6, floor: 4 }, cornice: { depth: 0.4, height: 0.5 } },
    ],
    roof: [0.5, 0.52, 0.53],
    crown: { kind: 'parapet', height: 1.1, colour: [0.74, 0.74, 0.72] },
  }, (out, ring) => {
    const granite: Rgb = [0.78, 0.78, 0.76]
    for (const len of [49.7, 49]) {
      const e = edgeNear(ring, len)
      colonnade(out, e, 2, e.L - 2, 8.5, 21, 0.6, 0.55, 4.2, granite, T.granite)
    }
  }),

  /**
   * The War Memorial Opera House (1932, Arthur Brown Jr.) and, beside it, the Veterans Building (the same
   * architects and the same front, holding the Herbst Theatre and once the Museum of Modern Art): grey granite
   * on Van Ness, a rusticated ground storey of tall arches, a giant Doric colonnade in front of a loggia, an
   * attic of little windows under a heavy cornice, and a grey metal mansard. The Opera's stage house stands up
   * behind. (Commons: "War Memorial Opera House (San Francisco).JPG".)
   */
  warMemorialOperaHouse: (out: MeshBuilder, fit: Fit): void => warMemorial(out, fit, 48.7, true),
  warMemorialVeterans: (out: MeshBuilder, fit: Fit): void => warMemorial(out, fit, 45.5, false),

  /**
   * The Bill Graham Civic Auditorium (1915, John Galen Howard, Frederick Meyer and John Reid Jr.), 99 Grove on
   * Civic Center Plaza: grey granite, a long arcade of tall round-arched windows over a rusticated base, a heavy
   * bracketed cornice, and the shallow lead dome of the hall behind it. (Commons: "Bill Graham Civic Auditorium
   * from Larkin and Grove St, SF.jpg".)
   */
  billGrahamAuditorium: (out: MeshBuilder, fit: Fit): void => {
    const ring = simplifyRing(towerRing(fit), 1.6)
    const H = fit.height > 25 && fit.height < 50 ? fit.height : 37
    const granite: Rgb = [0.78, 0.77, 0.74]
    raise(out, ring, H, {
      height: H,
      base: { height: 9, face: { kind: 'punched', material: 'granite', wall: [0.74, 0.73, 0.71], glass: [0.24, 0.26, 0.28], pitch: 6.6, solid: 0.68, floor: 4.5 } },
      tiers: [
        { to: 27, face: { kind: 'punched', material: 'granite', wall: granite, glass: [0.28, 0.3, 0.32], pitch: 6.6, solid: 0.5, floor: 15, arched: true }, cornice: { depth: 0.5, height: 0.6 } },
        { to: 1, face: { kind: 'punched', material: 'granite', wall: granite, glass: [0.26, 0.28, 0.3], pitch: 6.6, solid: 0.72, floor: 6 }, cornice: { depth: 1.5, height: 1.5 } },
      ],
      roof: [0.55, 0.55, 0.54],
      crown: { kind: 'parapet', height: 1.2, colour: granite },
    })
    // the dome over the hall, shallow and lead grey
    let cx = 0
    let cz = 0
    for (const q of ring) { cx += q.x; cz += q.z }
    cx /= ring.length
    cz /= ring.length
    const r = Math.min(...ring.map((q) => Math.hypot(q.x - cx, q.z - cz))) * 0.8
    dome(out, cx, cz, H, r, 6, [0.6, 0.62, 0.62], 16, T.metal)
  },

  /**
   * Louise M. Davies Symphony Hall (1980, SOM), Van Ness at Grove: grey precast concrete, the hall's box behind a
   * sweep of curved glass wall round the corner, a long tube of a canopy flying across it, and the low pitched
   * roof over the auditorium. (Commons: "San Francisco Davies Symphony Hall 1.jpg".)
   */
  daviesSymphonyHall: (out: MeshBuilder, fit: Fit): void => {
    const ring = simplifyRing(towerRing(fit), 1.6)
    const H = fit.height > 22 && fit.height < 45 ? fit.height : 30
    const precast: Rgb = [0.74, 0.74, 0.72]
    raise(out, ring, H, {
      height: H,
      tiers: [
        { to: 9, face: { kind: 'bands', material: 'concrete', wall: [0.7, 0.7, 0.68], glass: [0.26, 0.28, 0.3], solid: 0.86, floor: 4.5 } },
        { to: 1, face: { kind: 'bands', material: 'concrete', wall: precast, glass: [0.28, 0.3, 0.32], solid: 0.88, floor: 5.5 }, cornice: { depth: 0.5, height: 0.7 } },
      ],
      roof: [0.55, 0.55, 0.54],
      crown: { kind: 'parapet', height: 1, colour: [0.72, 0.72, 0.7] },
    })
    // the pitched roof over the auditorium, a box in the middle of the block
    const hall = insetRing(ring, 16)
    faceBand(out, hall, H, H + 4, { kind: 'blank', material: 'concrete', wall: [0.72, 0.72, 0.7] })
    mansardOn(out, hall, H + 4, 4.5, 7, [0.5, 0.51, 0.52], T.metal)
    // the curved front: where the outline turns through a corner in short steps, it is the glass wall, and the
    // canopy tube runs along it
    const curved: Edge[] = []
    for (let i = 0; i < ring.length; i++) {
      const e = edgeOf(ring, i)
      const prev = edgeOf(ring, (i + ring.length - 1) % ring.length)
      const turn = Math.acos(Math.max(-1, Math.min(1, e.tx * prev.tx + e.tz * prev.tz)))
      if (turn < 0.15 || turn > 1.1 || e.L > 30) continue
      curved.push(e)
    }
    // on a plain fitted box there is no curve to find: the glass wall is the whole front
    if (curved.length === 0) curved.push(frontOfBox(ring))
    for (const e of curved) {
      faceOn(out, e, 0, e.L, 8, H - 3, { kind: 'curtain', material: 'metal', wall: [0.72, 0.73, 0.74], glass: [0.32, 0.44, 0.48], pitch: 2.4, floor: 4.4 }, 0.22)
      slab(out, e, 0, e.L, 0, 1.3, 17.4, 18.6, [0.8, 0.8, 0.78], T.concrete)
    }
  },

  /**
   * 1145 Market Street (1936; the Federal Reserve's old annex is next door): a white terracotta Art Deco front of
   * four wide bays of steel window between fluted piers, dark green spandrels and little balconies, over a black
   * and white banded shopfront; a glazed penthouse of the 1990s steps back on top in three stages. (Commons:
   * "1145 Market Street.jpg".)
   */
  market1145: (out: MeshBuilder, fit: Fit): void => {
    const ring = towerRing(fit)
    const white: Rgb = [0.9, 0.89, 0.86]
    const H = 42
    raise(out, ring, H, {
      height: H,
      base: { height: 6, face: { kind: 'curtain', material: 'granite', wall: [0.2, 0.2, 0.2], glass: [0.26, 0.3, 0.32], pitch: 2.6, floor: 6 } },
      tiers: [
        { to: 0.98, face: { kind: 'fins', material: 'terracotta', wall: white, glass: [0.46, 0.53, 0.55], pitch: 6.4, solid: 0.34, depth: 0.5, floor: 3.9 } },
        { to: 1, face: { kind: 'blank', material: 'terracotta', wall: white }, cornice: { depth: 0.5, height: 0.6 } },
      ],
      roof: [0.55, 0.55, 0.54],
    })
    // the mullions in each bay, and the glass penthouse stepping back
    faceBand(out, ring, 6, H * 0.98, { kind: 'fins', material: 'terracotta', wall: white, glass: [0.46, 0.53, 0.55], pitch: 2.1, solid: 0.12, depth: 0.14, floor: 3.9 })
    let r = ring
    let y = H
    for (const step of [3.4, 3.4, 3.4]) {
      faceBand(out, r, y, y + step, { kind: 'curtain', material: 'metal', wall: [0.8, 0.82, 0.83], glass: [0.5, 0.58, 0.6], pitch: 1.8, floor: step })
      capPolygon(out, r, y + step, [0.6, 0.6, 0.6], T.metal)
      y += step
      r = insetRing(r, 3)
    }
  },

  /**
   * A green-glass tower of the 1960s, as 1145 Market's neighbours are (1150 and 1155 Market, the LightHouse for
   * the Blind): a plain shaft of curtain wall, blue-green glass in a fine pale grid, a dark recessed ground floor
   * and a thin parapet. (Seen behind "1145 Market Street.jpg" and "2017 Odd Fellows Temple 26 7th Street.jpg".)
   */
  greenGlassTower: spec({
    height: 66,
    base: { height: 6, face: { kind: 'curtain', material: 'metal', wall: [0.3, 0.3, 0.31], glass: [0.22, 0.26, 0.28], pitch: 3, floor: 6 } },
    tiers: [{ to: 1, face: { kind: 'curtain', material: 'metal', wall: [0.72, 0.74, 0.74], glass: [0.3, 0.45, 0.44], pitch: 1.7, floor: 3.5 } }],
    roof: [0.5, 0.5, 0.5],
    crown: { kind: 'parapet', height: 1.2, colour: [0.7, 0.72, 0.72] },
  }),

  /**
   * The Odd Fellows Temple (1909, Meyer & O'Brien), 26 Seventh at Market: five storeys of tan brick and
   * terracotta, a run of tall round-arched windows across the top floor, green-painted metal balconies and fire
   * escapes, a heavy bracketed cornice, and the blue ODD FELLOWS blade on the corner. (Commons: "2017 Odd Fellows
   * Temple 26 7th Street.jpg".)
   */
  oddFellowsTemple: specPlus({
    height: 27,
    base: { height: 5.5, face: { kind: 'curtain', material: 'metal', wall: [0.13, 0.22, 0.2], glass: [0.24, 0.28, 0.3], pitch: 3, floor: 5.5 } },
    tiers: [
      { to: 19, face: { kind: 'punched', material: 'brick', wall: [0.68, 0.6, 0.48], glass: [0.26, 0.28, 0.3], pitch: 3.2, solid: 0.42, floor: 4.5 }, cornice: { depth: 0.35, height: 0.5, colour: [0.74, 0.68, 0.56] } },
      { to: 1, face: { kind: 'punched', material: 'brick', wall: [0.68, 0.6, 0.48], glass: [0.24, 0.26, 0.28], pitch: 3.2, solid: 0.38, floor: 6.5, arched: true }, cornice: { depth: 1.2, height: 1.2, colour: [0.2, 0.3, 0.27] } },
    ],
    roof: [0.4, 0.4, 0.38],
  }, (out, ring) => {
    const e = edgeNear(ring, 42.4)
    blade(out, e, 2.5, 7, 22, 1.3, 0.35, [0.1, 0.2, 0.42], [0.9, 0.92, 0.95])
  }),

  /**
   * The San Francisco Proper Hotel (1904, Albert Pissis), 1100 Market where McAllister and Jones cut it to a
   * triangle: twelve storeys of dark brick with cream terracotta quoins and trim, arched windows in the top
   * storey under a bracketed cornice, and the hotel's banner down the prow. (Seen in Commons: "Hibernia Bank
   * Building San Francisco 2019.jpg".)
   */
  properHotel: specPlus({
    height: 47,
    base: { height: 7, face: { kind: 'curtain', material: 'granite', wall: [0.25, 0.24, 0.24], glass: [0.24, 0.27, 0.29], pitch: 3.2, floor: 7 } },
    tiers: [
      { to: 40, face: { kind: 'punched', material: 'brick', wall: [0.52, 0.42, 0.35], glass: [0.26, 0.28, 0.3], pitch: 3.1, solid: 0.45, floor: 3.4 } },
      { to: 1, face: { kind: 'punched', material: 'brick', wall: [0.54, 0.44, 0.37], glass: [0.26, 0.28, 0.3], pitch: 3.1, solid: 0.42, floor: 4.5, arched: true }, cornice: { depth: 1.2, height: 1.2, colour: [0.78, 0.74, 0.64] } },
    ],
    roof: [0.42, 0.4, 0.38],
  }, (out, ring) => {
    const e = edgeNear(ring, 44.7)
    blade(out, e, 3, 9, 26, 1.1, 0.3, [0.12, 0.12, 0.13], [0.92, 0.9, 0.86])
  }),

  /**
   * St Boniface (1900, rebuilt 1908), 133 Golden Gate Avenue: the German parish church of the Tenderloin, a
   * Romanesque basilica of cream and salmon stucco — round-arched windows in the nave under a corbel table, a
   * gabled front between two towers with pyramid roofs and a cross over the pointed porch. (Commons: "San
   * Francisco - Saint Boniface church - 2.jpg".)
   */
  saintBoniface: (out: MeshBuilder, fit: Fit): void => {
    const ring = simplifyRing(towerRing(fit), 1.2)
    const cream: Rgb = [0.89, 0.85, 0.7]
    const salmon: Rgb = [0.84, 0.62, 0.55]
    raise(out, ring, 22, {
      height: 22,
      tiers: [
        { to: 6, face: { kind: 'blank', material: 'stucco', wall: salmon } },
        { to: 1, face: { kind: 'punched', material: 'stucco', wall: cream, glass: [0.3, 0.33, 0.28], pitch: 4.6, solid: 0.55, floor: 16, arched: true }, cornice: { depth: 0.4, height: 0.6, colour: [0.82, 0.78, 0.64] } },
      ],
      roof: [0.5, 0.42, 0.36],
    })
    // the front: a gable between two towers, on the street end of the nave
    let front = edgeOf(ring, 0)
    for (let i = 1; i < ring.length; i++) {
      const e = edgeOf(ring, i)
      if (e.L > 8 && (e.a.z + e.b.z) / 2 < (front.a.z + front.b.z) / 2) front = e
    }
    mansardOn(out, ring, 22, 5, 6, [0.52, 0.43, 0.37], T.tile)
    for (const u of [2.5, front.L - 2.5]) {
      const c = at(front, u, -3)
      prism(out, c.x, c.z, 0, 30, 3.4, 4, cream, T.stucco)
      prism(out, c.x, c.z, 30, 31, 3.9, 4, salmon, T.stucco)
      prism(out, c.x, c.z, 31, 39, 3.2, 4, [0.55, 0.45, 0.4], T.tile, 0.05)
    }
    // the gable and its pointed porch
    const g = at(front, front.L / 2, 0)
    slab(out, front, 4, front.L - 4, 0, 0.6, 0, 24, cream, T.stucco)
    mansardOn(out, [at(front, 4, 0.6), at(front, front.L - 4, 0.6), at(front, front.L - 4, -0.6), at(front, 4, -0.6)], 24, 6, 3, salmon, T.stucco)
    // the porch, its doors and the rose window over them
    slab(out, front, front.L / 2 - 3.4, front.L / 2 + 3.4, 0.6, 1.5, 0, 9.5, salmon, T.stucco)
    panel(out, front, front.L / 2 - 2.2, front.L / 2 + 2.2, 1.55, 0.5, 7.5, [0.22, 0.17, 0.14], T.glass)
    panel(out, front, front.L / 2 - 2.6, front.L / 2 + 2.6, 0.65, 12, 18, [0.26, 0.3, 0.26], T.glass)
    void g
  },
}

/** The two War Memorial buildings: the same front, one with the Opera's stage house behind it. */
function warMemorial(out: MeshBuilder, fit: Fit, frontLen: number, stage: boolean): void {
  const ring = simplifyRing(towerRing(fit), 1.5)
  const granite: Rgb = [0.79, 0.78, 0.76]
  const H = 27
  raise(out, ring, H, {
    height: H,
    base: { height: 10, face: { kind: 'punched', material: 'granite', wall: [0.75, 0.74, 0.72], glass: [0.24, 0.26, 0.28], pitch: 7.6, solid: 0.42, floor: 10, arched: true }, canopy: { depth: 0.4, colour: [0.72, 0.71, 0.69] } },
    tiers: [
      { to: 22, face: { kind: 'punched', material: 'granite', wall: granite, glass: [0.28, 0.3, 0.32], pitch: 4.6, solid: 0.62, floor: 12 }, cornice: { depth: 0.4, height: 0.5 } },
      { to: 1, face: { kind: 'punched', material: 'granite', wall: granite, glass: [0.26, 0.28, 0.3], pitch: 4.6, solid: 0.74, floor: 5 }, cornice: { depth: 1.5, height: 1.4 } },
    ],
    roof: [0.5, 0.52, 0.53],
    crown: { kind: 'mansard', height: 5, inset: 7, colour: [0.52, 0.54, 0.55] },
  })
  const front = edgeNear(ring, frontLen)
  colonnade(out, front, 4, front.L - 4, 10, 22, 1.8, 0.8, 4.6, granite, T.granite, [0.3, 0.31, 0.32])
  if (stage) {
    // the stage house: the back half of the block, up to the OSM height
    const back = behind(ring, front, 34)
    if (back.length >= 3) raise(out, back, Math.max(38, fit.height), { height: 40, tiers: [{ to: 1, face: { kind: 'blank', material: 'concrete', wall: [0.72, 0.72, 0.7] } }], roof: [0.5, 0.5, 0.5], crown: { kind: 'parapet', height: 1, colour: [0.7, 0.7, 0.68] } })
  }
}
