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
import { boxAlong, edgeAt, longestEdge, offsetRing } from '../../parts.ts'
import { column } from '../../kit.ts'
import { fromRecipe } from '../recipes.ts'
import { sign } from '../../signage.ts'

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
 * underneath. Words on the board (`lines`) and the name (`nameText`) go through the sign system, which drops them
 * beyond legible range; without them the marquee is its colours and its glow.
 */
function marquee(out: MeshBuilder, e: Edge, u: number, w: number, y0: number, h: number, depth: number, o: {
  frame: Rgb; board: Rgb; name?: Rgb; nameShare?: number; soffit?: Rgb
  /** the panel behind the name, and how many letters it has (0: one lit strip) */
  nameBack?: Rgb; letters?: number
  /** the bulbs round its edges */
  bulb?: Rgb
  /** words on the readerboard, top line first — dark letters on the lit board, through the sign system */
  lines?: string[]
  /** the name written on its band in `name`'s colour, instead of a lit block a letter */
  nameText?: string
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
  if (o.lines?.length) {
    const n = o.lines.length, row = (yt - yb) / n, cu = u, heading = Math.atan2(e.nx, e.nz)
    o.lines.forEach((t, k) => {
      const y = yt - row * (k + 0.5)
      sign(out, { type: 'flat', text: t, h: Math.min(0.55, row * 0.62), face: 'grotesque', weight: 'bold', colour: [0.1, 0.1, 0.12], lit: 'back', w: Math.min(w - 0.9, t.length * row * 0.62) },
        { x: e.a.x + e.tx * cu + e.nx * (depth + 0.05), y, z: e.a.z + e.tz * cu + e.nz * (depth + 0.05), heading })
    })
  }
  if (o.name) {
    // the name: a panel, and a lamp-lit block per letter on it
    const ya = yt + h * 0.05
    const yz = y0 + h * 0.9
    panel(out, e, u0 + 0.4, u1 - 0.4, depth + 0.05, ya, yz, o.nameBack ?? o.frame, T.metal)
    const n = o.nameText ? -1 : o.letters ?? 0
    if (o.nameText) {
      sign(out, { type: 'flat', text: o.nameText, h: (yz - ya) * 0.62, face: 'grotesque', weight: 'bold', colour: o.name, lit: 'self', w: Math.min(w - 1.8, o.nameText.length * (yz - ya) * 0.7) },
        { x: e.a.x + e.tx * u + e.nx * (depth + 0.08), y: (ya + yz) / 2, z: e.a.z + e.tz * u + e.nz * (depth + 0.08), heading: Math.atan2(e.nx, e.nz) })
    }
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
 * name down both faces — its letters when `text` is given, else a lit strip.
 */
function blade(out: MeshBuilder, e: Edge, u: number, y0: number, y1: number, depth: number, t: number, body: Rgb, lit: Rgb, text?: string): void {
  slab(out, e, u - t / 2, u + t / 2, 0.3, 0.3 + depth, y0, y1, body, T.metal)
  for (const s of [-1, 1]) {
    const uu = u + s * (t / 2 + 0.02)
    if (text) {
      const oo = 0.3 + depth / 2
      sign(out, { type: 'flat', text, h: Math.min(depth * 0.8, (y1 - y0 - 1.2) / (text.length * 1.35)), face: 'grotesque', weight: 'bold', colour: lit, vertical: true, lit: 'self' },
        { x: e.a.x + e.tx * uu + e.nx * oo, y: (y0 + y1) / 2, z: e.a.z + e.tz * uu + e.nz * oo, heading: Math.atan2(e.tx * s, e.tz * s) })
      continue
    }
    const P = (oo: number, y: number): [number, number, number] => [e.a.x + e.tx * uu + e.nx * oo, y, e.a.z + e.tz * uu + e.nz * oo]
    quad(out, [P(0.3 + depth * 0.8, y0 + 0.6), P(0.3 + depth * 0.2, y0 + 0.6), P(0.3 + depth * 0.2, y1 - 0.6), P(0.3 + depth * 0.8, y1 - 0.6)], [e.tx * s, 0, e.tz * s], lit, EMIT)
  }
}

/** A tower spec raised on the fitted ring, then `extra` drawn on the same ring. */
/** The ring moved `d` metres OUT (negative: in), whichever way it winds: an overlay on a wall stands proud of it */
function nudge(r: P2[], d: number): P2[] {
  let a = 0
  for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; a += r[i].x * r[j].z - r[j].x * r[i].z }
  return offsetRing(r, a > 0 ? d : -d)
}

const specPlus = (s: TowerSpec, extra: (out: MeshBuilder, ring: P2[], H: number) => void) => (out: MeshBuilder, fit: Fit): void => {
  tower(out, fit, s)
  const H = fit.height > 0.6 * s.height && fit.height < 1.6 * s.height ? fit.height : s.height
  // the extras stand ON the walls (fins, frames, panels): given a ring 3 cm outside them, never in their plane —
  // drawn on the ring itself they doubled the walls, and NEMA, Market Square, 1145 Market z-fought top to bottom
  // (2026-10-03 coplanar scan)
  extra(out, nudge(towerRing(fit), 0.03), H)
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
    marquee(out, e, e.L * 0.68, 13, 4.6, 5.2, 3.2, { frame: [0.36, 0.17, 0.17], board: [0.95, 0.94, 0.9], name: [0.98, 0.6, 0.16], nameShare: 0.4, nameBack: [0.42, 0.3, 0.26], nameText: 'THE WARFIELD', lines: ['LIVE MUSIC', 'TONIGHT'] })
  }),

  /**
   * The Warfield's auditorium (1922) behind the office block: a plain stucco box the colour of the terracotta,
   * lower, with the fly tower at its back. Nothing on it but the fire escapes and some murals.
   */
  warfieldAuditorium: (out: MeshBuilder, fit: Fit): void => {
    /*
     * Rebuilt 2026-09-22. It was a blank stucco box, which is defensible — a theatre's auditorium really is
     * windowless — and read as a featureless slab on the contact sheet. The back of a 1922 theatre has a
     * SHAPE: a brick wall articulated by buttress strips between the structural bays, a FLYTOWER standing
     * higher than the rest over the stage, roof plant, and a fire escape zig-zagging down to the alley. Those
     * cost a few lines and turn a slab into a building you can tell is a theatre from behind.
     */
    const ring = towerRing(fit)
    const BRICK: [number, number, number] = [0.66, 0.53, 0.44]
    const TRIM: [number, number, number] = [0.74, 0.71, 0.64]
    const H = 22
    faceBand(out, ring, 0, 3.2, { kind: 'blank', wall: [0.42, 0.4, 0.38], material: 'brick' })
    faceBand(out, ring, 3.2, H, { kind: 'blank', wall: BRICK, material: 'brick' })
    faceBand(out, ring, H, H + 1.0, { kind: 'blank', wall: TRIM, material: 'ashlar' })
    capPolygon(out, ring, H + 1.0, [0.46, 0.45, 0.43], 0)
    // buttress strips between the bays, on every side
    for (let i = 0; i < ring.length; i++) {
      const e = edgeAt(ring, i)
      const n = Math.max(2, Math.round(e.L / 6))
      for (let k = 1; k < n; k++) {
        const t = k / n
        boxAlong(out, e.a.x + e.tx * e.L * t + e.nx * 0.2, (3.2 + H) / 2, e.a.z + e.tz * e.L * t + e.nz * 0.2,
          0.5, (H - 3.2) / 2, 0.2, e.heading, [0.6, 0.48, 0.4], surfaceTag('brick'))
      }
    }
    /*
     * The flytower over the stage: a real VOLUME over one end of the plan. Slicing the first half of the
     * ring's vertices gives a sliver, not half the area — an irregular footprint's vertices are not evenly
     * spread — so this takes the plan's bounding box and builds a rectangle over the deeper end of it.
     */
    const xs = ring.map((p2) => p2.x)
    const zs = ring.map((p2) => p2.z)
    const x0 = Math.min(...xs) + 1.5
    const x1 = Math.max(...xs) - 1.5
    const z0 = Math.min(...zs) + 1.5
    const z1 = Math.max(...zs) - 1.5
    const deep = (x1 - x0) > (z1 - z0)
    const fly = deep
      ? [{ x: x0, z: z0 }, { x: x0 + (x1 - x0) * 0.45, z: z0 }, { x: x0 + (x1 - x0) * 0.45, z: z1 }, { x: x0, z: z1 }]
      : [{ x: x0, z: z0 }, { x: x1, z: z0 }, { x: x1, z: z0 + (z1 - z0) * 0.45 }, { x: x0, z: z0 + (z1 - z0) * 0.45 }]
    faceBand(out, fly, H, H + 7, { kind: 'blank', wall: BRICK, material: 'brick' })
    faceBand(out, fly, H + 7, H + 7.8, { kind: 'blank', wall: TRIM, material: 'ashlar' })
    capPolygon(out, fly, H + 7.8, [0.44, 0.43, 0.41], 0)
    // roof plant, and the fire escape down the longest wall
    const e0 = edgeAt(ring, longestEdge(ring))
    for (const f of [-0.2, 0.15]) {
      boxAlong(out, e0.mid.x + e0.tx * e0.L * f, H + 1.9, e0.mid.z + e0.tz * e0.L * f, 1.6, 0.9, 1.2, e0.heading, [0.5, 0.5, 0.5], surfaceTag('metal'))
    }
    // the fire escape: landings down the wall, with the uprights that carry them
    for (let k = 0; k < 5; k++) {
      const y = 5.5 + k * 3.4
      boxAlong(out, e0.mid.x + e0.nx * 1.1, y, e0.mid.z + e0.nz * 1.1, 2.4, 0.09, 1.1, e0.heading, [0.22, 0.22, 0.24], surfaceTag('metal'))
      boxAlong(out, e0.mid.x + e0.nx * 1.1, y + 0.55, e0.mid.z + e0.nz * 1.1, 2.4, 0.5, 0.06, e0.heading, [0.22, 0.22, 0.24], surfaceTag('metal'))
    }
    for (const sgn of [-1, 1]) {
      boxAlong(out, e0.mid.x + e0.tx * sgn * 2.3 + e0.nx * 1.1, 11.5, e0.mid.z + e0.tz * sgn * 2.3 + e0.nz * 1.1,
        0.08, 8.5, 0.08, e0.heading, [0.22, 0.22, 0.24], surfaceTag('metal'))
    }
  },

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
      // GOLDEN GATE down its face, lit letters on the dark blade
      const um = (u0 + u1) / 2
      sign(out, { type: 'flat', text: 'GOLDEN GATE', h: 1.05, face: 'grotesque', weight: 'bold', colour: lit, vertical: true, lit: 'self' },
        { x: corner.a.x + corner.tx * um + corner.nx * 0.72, y: (9.5 + H - 1) / 2, z: corner.a.z + corner.tz * um + corner.nz * 0.72, heading: Math.atan2(corner.nx, corner.nz) })
    }
    const frame: Rgb = [0.13, 0.13, 0.14]
    const board: Rgb = [0.94, 0.95, 0.97]
    marquee(out, corner, corner.L / 2, corner.L + 0.4, 4.4, 2.4, 2.6, { frame, board, lines: ['GOLDEN GATE', 'THEATRE'] })
    marquee(out, sides[0], sides[0].L - 4, 7.6, 4.4, 2.4, 2.6, { frame, board, lines: ['BROADWAY SF', 'NOW PLAYING'] })
    marquee(out, sides[1], 4, 7.6, 4.4, 2.4, 2.6, { frame, board, lines: ['BROADWAY SF', 'TICKETS'] })
  }),

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
    faceBand(out, nudge(ring, 0.03), 6, H * 0.98, { kind: 'fins', material: 'terracotta', wall: white, glass: [0.46, 0.53, 0.55], pitch: 2.1, solid: 0.12, depth: 0.14, floor: 3.9 })
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
   * CCSF Civic Center, 1170 Market (1960s college block): the owner's own words are "ugly, but unique with a
   * curved corner and arcades", and those two features are the whole model. Mapillary way-403951329-01/02/03.jpg
   * (all kept) show pale concrete, 6 storeys, a single corner rounded into a drum that rises a little past the
   * roofline into an open colonnade (a loggia under the flat roof, columns visible against the sky), plain
   * round-arched punched windows on the shaft, and big arched openings recessed at the pavement. No `facade()`
   * slot draws a curved plan, so this is hand-built on a `roundRing`-rounded footprint rather than the flat
   * `towerRing` `facade()` requires.
   */
  ccsfCivicCenter: (out: MeshBuilder, fit: Fit): void => {
    const raw = towerRing(fit)
    // only ONE corner is curved in the reference (the street corner), the rest of the plan stays square —
    // round just the sharpest corner rather than every corner `roundRing` would touch
    const ring = roundOneCorner(raw, sharpestCorner(raw), Math.min(7, longestEdgeLen(raw) * 0.3), 8)
    const H = fit.height || 22 // OSM carries no height/levels tag beyond the manifest's 6 storeys
    const storeys = 6
    const floorH = H / storeys
    const wall: Rgb = [0.78, 0.77, 0.72]
    const glass: Rgb = [0.15, 0.17, 0.19]
    const dark: Rgb = [0.13, 0.13, 0.14]
    const groundH = floorH * 1.15
    const loggiaH = floorH * 0.9
    // the shaft: plain round-arched punched windows, the ordinary storeys either side of the two features
    faceBand(out, ring, groundH, H - loggiaH, { kind: 'punched', wall, glass, pitch: 3.2, floor: floorH, solid: 0.44, material: 'concrete', arched: true })
    // the ground floor: big arched openings recessed behind the wall plane
    faceBand(out, insetRing(ring, 0.35), 0, groundH, { kind: 'punched', wall: dark, glass: dark, pitch: 4.5, floor: groundH, solid: 0.15, material: 'concrete', arched: true })
    // the loggia: a recessed dark backdrop with free-standing columns in front of it, open to the sky above
    const loggiaRing = insetRing(ring, 1.1)
    faceBand(out, loggiaRing, H - loggiaH, H, { kind: 'blank', wall: dark, material: 'concrete' })
    for (let i = 0; i < loggiaRing.length; i++) {
      const e = edgeAt(loggiaRing, i)
      if (e.L < 1.5) continue
      const n = Math.max(1, Math.round(e.L / 3.2))
      for (let k = 0; k < n; k++) {
        const u = (k + 0.5) / n
        const x = e.a.x + e.tx * (e.L * u) + e.nx * 0.15
        const z = e.a.z + e.tz * (e.L * u) + e.nz * 0.15
        column(out, x, z, H - loggiaH, H, 0.28, wall)
      }
    }
    capPolygon(out, ring, H, wall, 0)
  },

  /**
   * CCSF, 33 Gough Street: a two-storey administrative office building (per public reporting on CCSF's Gough
   * Street headquarters — no photograph, no distinctive feature reported anywhere, just "a two-story
   * administrative building"). Nothing here argues against the plain recipe outcome the owner has said is the
   * right result whenever a building has no feature the recipe vocabulary lacks a word for.
   */
  ccsfGoughStreet: fromRecipe('hotel-punched', { height: 8, wall: [0.8, 0.78, 0.72], glass: [0.24, 0.26, 0.28], base: 0 }),
}

/** The longest edge's length, ignoring which one it is. */
function longestEdgeLen(ring: { x: number; z: number }[]): number {
  return edgeAt(ring, longestEdge(ring)).L
}

/** The index of the corner turning through the sharpest angle — the one a curved-corner building rounds. */
function sharpestCorner(ring: { x: number; z: number }[]): number {
  let best = 0
  let bestDot = 2
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const prev = ring[(i - 1 + ring.length) % ring.length]
    const next = ring[(i + 1) % ring.length]
    const ax = p.x - prev.x, az = p.z - prev.z
    const bx = next.x - p.x, bz = next.z - p.z
    const al = Math.hypot(ax, az) || 1, bl = Math.hypot(bx, bz) || 1
    const dot = (ax * bx + az * bz) / (al * bl)
    if (dot < bestDot) { bestDot = dot; best = i }
  }
  return best
}

/** `roundRing`, but only at ONE named corner — the rest of the polygon stays exactly as given. */
function roundOneCorner(ring: { x: number; z: number }[], i: number, r: number, n = 8): { x: number; z: number }[] {
  const p = ring[i]
  const prev = ring[(i - 1 + ring.length) % ring.length]
  const next = ring[(i + 1) % ring.length]
  const d0 = Math.hypot(p.x - prev.x, p.z - prev.z) || 1
  const d1 = Math.hypot(next.x - p.x, next.z - p.z) || 1
  const rr = Math.min(r, d0 / 2, d1 / 2)
  const a = { x: p.x + ((prev.x - p.x) / d0) * rr, z: p.z + ((prev.z - p.z) / d0) * rr }
  const b = { x: p.x + ((next.x - p.x) / d1) * rr, z: p.z + ((next.z - p.z) / d1) * rr }
  const arc: { x: number; z: number }[] = []
  for (let k = 0; k <= n; k++) {
    const t = k / n
    const u = 1 - t
    arc.push({ x: u * u * a.x + 2 * u * t * p.x + t * t * b.x, z: u * u * a.z + 2 * u * t * p.z + t * t * b.z })
  }
  const out: { x: number; z: number }[] = []
  for (let k = 0; k < ring.length; k++) {
    if (k === i) { out.push(...arc); continue }
    out.push(ring[k])
  }
  return out
}

