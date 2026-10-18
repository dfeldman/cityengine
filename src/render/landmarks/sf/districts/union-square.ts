/**
 * San Francisco's individually modelled buildings: union-square (SF_PLAN.md §10; the batch list is docs/sf-batches/union-square.md).
 * One builder per building, most of them a tower-grammar spec (render/landmarks/tower.ts) from Street View and
 * photographs; the few that need more, their own geometry here. Registered through render/landmarks/sf/index.ts;
 * placed by public/landmarks/san-francisco/union-square.json.
 *
 * The buildings that are more than their outline raised (the St. Francis's three wings, Macy's two buildings on one
 * OSM way, Neiman Marcus's rotunda corner) are drawn in the STREET-GRID frame: metres from the footprint's centroid,
 * +x east along Geary/Post/Sutter (bearing 81°), +z north along Powell/Stockton (bearing 351°). Each carries its
 * OSM outline in that frame (`REF`), and `gridFrame` finds how the fit's own ring is turned against it — the model
 * shots hand the builder the ring as it lies on the map, the city hands it turned to face its street, and the
 * features have to land on the same walls either way.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower, towerRing, faceBand, insetRing, type TowerSpec, type Face } from '../../tower.ts'
import { prism, strut, EMIT, type Rgb } from '../../../models.ts'
import { surfaceTag, type Surface } from '../../../cartoon-material.ts'
import { offsetRing, boxAlong } from '../../parts.ts'
import { sign } from '../../signage.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]

const spec = (s: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, s)

// ---------------------------------------------------------------------------------------------------------------
// the street-grid frame

function centroidOf(r: P2[]): P2 {
  let a = 0
  let cx = 0
  let cz = 0
  for (let i = 0; i < r.length; i++) {
    const p = r[i]
    const q = r[(i + 1) % r.length]
    const c = p.x * q.z - q.x * p.z
    a += c; cx += (p.x + q.x) * c; cz += (p.z + q.z) * c
  }
  if (Math.abs(a) < 1e-6) return { x: r.reduce((s, p) => s + p.x, 0) / r.length, z: r.reduce((s, p) => s + p.z, 0) / r.length }
  return { x: cx / (3 * a), z: cz / (3 * a) }
}

function segDist(p: P2, a: P2, b: P2): number {
  const dx = b.x - a.x
  const dz = b.z - a.z
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)))
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t)
}

function ringDist(p: P2, r: P2[]): number {
  let d = Infinity
  for (let i = 0; i < r.length; i++) d = Math.min(d, segDist(p, r[i], r[(i + 1) % r.length]))
  return d
}

interface Frame {
  /** the fit's footprint, anticlockwise, in the model's own frame */
  ring: P2[]
  /** a grid-frame point in the model's frame */
  at(x: number, z: number): P2
  /** a grid-frame direction in the model's frame */
  dir(x: number, z: number): P2
}

/**
 * How the fit's ring lies against the building's outline in the grid frame (`ref`, flat x, z pairs about its
 * centroid): the turn that lays one on the other best, found by trying them all.
 *
 * One thing makes this more than a fit. A rectangular footprint matches its outline equally well four (or two)
 * ways round, and the model shots and the city turn the ring differently: the shots hand it over as it lies on the
 * map, while `front: "street"` turns it so the model's local −z faces the frontage the bake found (the longest wall
 * with a carriageway in front of it). So where the turns tie, the one that lays the building's own street front
 * (`fx, fz` in the grid frame, worked out from the OSM footprint and the streets round it) against local −z is the
 * one the city means; where the footprint has a shape to it, the fit decides and the hint never comes into it.
 */
function gridFrame(fit: Fit, ref: number[], fx = 0, fz = 0): Frame {
  const ring = towerRing(fit)
  const R: P2[] = []
  for (let i = 0; i + 1 < ref.length; i += 2) R.push({ x: ref[i], z: ref[i + 1] })
  const c = centroidOf(ring)
  const score = (th: number): number => {
    const cs = Math.cos(th)
    const sn = Math.sin(th)
    const T = R.map((p) => ({ x: c.x + p.x * cs - p.z * sn, z: c.z + p.x * sn + p.z * cs }))
    let s = 0
    for (const p of T) s += ringDist(p, ring)
    for (const p of ring) s += ringDist(p, T)
    return s / (T.length + ring.length)
  }
  const at: number[] = []
  for (let d = 0; d < 360; d += 1) at.push(score((d * Math.PI) / 180))
  // every turn that is a local best, refined
  const minima: { d: number; s: number }[] = []
  for (let d = 0; d < 360; d++) {
    if (at[d] > at[(d + 359) % 360] || at[d] > at[(d + 1) % 360]) continue
    let bd = d
    let bs = at[d]
    for (let e = d - 1; e <= d + 1; e += 0.1) { const s = score((e * Math.PI) / 180); if (s < bs) { bs = s; bd = e } }
    minima.push({ d: bd, s: bs })
  }
  if (minima.length === 0) minima.push({ d: 0, s: at[0] })
  const bestS = Math.min(...minima.map((m) => m.s))
  const near = minima.filter((m) => m.s < bestS + 0.15)
  // of those, the one that turns the street front toward local −z (and, where that does not tell them apart, the closest fit)
  const aim = (m: { d: number }): number => {
    if (!fx && !fz) return 0
    const th = (m.d * Math.PI) / 180
    return -(fx * Math.sin(th) + fz * Math.cos(th))
  }
  near.sort((p, q) => (aim(q) - aim(p) > 0.3 ? 1 : aim(p) - aim(q) > 0.3 ? -1 : p.s - q.s))
  const th = (near[0].d * Math.PI) / 180
  const cs = Math.cos(th)
  const sn = Math.sin(th)
  return {
    ring,
    at: (x, z) => ({ x: c.x + x * cs - z * sn, z: c.z + x * sn + z * cs }),
    dir: (x, z) => ({ x: x * cs - z * sn, z: x * sn + z * cs }),
  }
}

/** The ring cut by a grid-frame half-plane: keeps what is on the side of (px, pz) away from the normal (nx, nz). */
function clip(ring: P2[], f: Frame, px: number, pz: number, nx: number, nz: number): P2[] {
  const o = f.at(px, pz)
  const n = f.dir(nx, nz)
  const side = (p: P2): number => (p.x - o.x) * n.x + (p.z - o.z) * n.z
  const outp: P2[] = []
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const sa = side(a)
    const sb = side(b)
    if (sa <= 0) outp.push(a)
    if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
      const t = sa / (sa - sb)
      outp.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t })
    }
  }
  return outp
}

/** The ring cut to a grid-frame box x0..x1, z0..z1. */
const clipBox = (ring: P2[], f: Frame, x0: number, x1: number, z0: number, z1: number): P2[] =>
  clip(clip(clip(clip(ring, f, x1, 0, 1, 0), f, x0, 0, -1, 0), f, 0, z1, 0, 1), f, 0, z0, 0, -1)

/** The ring without the vertices that are only points along a straight wall. */
function straighten(ring0: P2[]): P2[] {
  return ring0.filter((b, i) => {
    const a = ring0[(i + ring0.length - 1) % ring0.length]
    const c = ring0[(i + 1) % ring0.length]
    const l1 = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const l2 = Math.hypot(c.x - b.x, c.z - b.z) || 1
    return Math.abs(((b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x)) / (l1 * l2)) > 0.08
  })
}

/**
 * The ring with its convex corners rounded to radius r (where the two edges either side are long enough), `seg`
 * facets each: 450 Sutter's rounded corners, Neiman Marcus's rotunda.
 */
function roundRing(ring0: P2[], r: number, seg = 4, only?: (p: P2) => boolean): P2[] {
  const ring = straighten(ring0)
  const n = ring.length
  const outp: P2[] = []
  for (let i = 0; i < n; i++) {
    const a = ring[(i + n - 1) % n]
    const b = ring[i]
    const c = ring[(i + 1) % n]
    const l1 = Math.hypot(b.x - a.x, b.z - a.z)
    const l2 = Math.hypot(c.x - b.x, c.z - b.z)
    const u1 = { x: (b.x - a.x) / l1, z: (b.z - a.z) / l1 }
    const u2 = { x: (c.x - b.x) / l2, z: (c.z - b.z) / l2 }
    const cross = u1.x * u2.z - u1.z * u2.x
    const turn = Math.acos(Math.max(-1, Math.min(1, u1.x * u2.x + u1.z * u2.z)))
    const t = r * Math.tan(turn / 2)
    if (cross <= 0.2 || t > l1 * 0.48 || t > l2 * 0.48 || (only && !only(b))) { outp.push(b); continue }
    const p0 = { x: b.x - u1.x * t, z: b.z - u1.z * t }
    // the arc from p0 to p1 about the centre r in from both
    const cx = p0.x - u1.z * r
    const cz = p0.z + u1.x * r
    const a0 = Math.atan2(p0.z - cz, p0.x - cx)
    for (let k = 0; k <= seg; k++) {
      const ang = a0 + (turn * k) / seg
      outp.push({ x: cx + Math.cos(ang) * r, z: cz + Math.sin(ang) * r })
    }
  }
  return outp
}

/** A tower-grammar mass on a ring of its own. */
function mass(out: MeshBuilder, ring: P2[], height: number, s: TowerSpec): void {
  if (ring.length < 3) return
  tower(out, { hx: 1, hz: 1, height, ring }, { ...s, height })
}

/** Whatever `draw` adds, raised by dy (a mass that starts on a podium). */
function raised(out: MeshBuilder, dy: number, draw: () => void): void {
  const from = out.positions.length
  draw()
  for (let i = from + 1; i < out.positions.length; i += 3) out.positions[i] += dy
}

/** A box in the grid frame: x0..x1 along the street, z0..z1 across, y0..y1 up. */
function gbox(out: MeshBuilder, f: Frame, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, c: Rgb, tag = 0): void {
  const P = (x: number, y: number, z: number): V3 => { const p = f.at(x, z); return [p.x, y, p.z] }
  const N = (x: number, z: number): V3 => { const d = f.dir(x, z); return [d.x, 0, d.z] }
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  out.quad([P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], N(0, -1), uv, c, tag)
  out.quad([P(x1, y0, z1), P(x0, y0, z1), P(x0, y1, z1), P(x1, y1, z1)], N(0, 1), uv, c, tag)
  out.quad([P(x0, y0, z1), P(x0, y0, z0), P(x0, y1, z0), P(x0, y1, z1)], N(-1, 0), uv, c, tag)
  out.quad([P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], N(1, 0), uv, c, tag)
  out.quad([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], [0, 1, 0], uv, c, tag)
  out.quad([P(x0, y0, z1), P(x1, y0, z1), P(x1, y0, z0), P(x0, y0, z0)], [0, -1, 0], uv, c, tag)
}

/** An upright n-sided column at a grid-frame point. */
function gcol(out: MeshBuilder, f: Frame, x: number, z: number, y0: number, y1: number, r: number, c: Rgb, sides = 8, r1 = r, tag = 0): void {
  const p = f.at(x, z)
  prism(out, p.x, p.z, y0, y1, r, sides, c, tag, r1)
}

/** A strut between two grid-frame points. */
function gstrut(out: MeshBuilder, f: Frame, a: V3, b: V3, w: number, h: number, c: Rgb): void {
  const A = f.at(a[0], a[2])
  const B = f.at(b[0], b[2])
  strut(out, [A.x, a[1], A.z], [B.x, b[1], B.z], w, h, c)
}


// ---------------------------------------------------------------------------------------------------------------
// store names (Macy's, Saks, Tiffany…), in a real typeface on the wall


/**
 * Words on a wall: from the grid-frame point (x, z) along (ux, uz), `out` metres proud along the wall's outward normal
 * (nx, nz), letters `h` tall with their foot at y; `vertical` stacks them (a blade). A real typeface (the flat signs
 * of landmarks/signage.ts) since 2026-10-17 — the owner: "block based text which is not necessary and is hard to read".
 * Placed where the block letters' middle was, so every store name stays where it was.
 */
function letters(out: MeshBuilder, f: Frame, text: string, x: number, z: number, ux: number, uz: number, nx: number, nz: number,
                 y: number, h: number, c: Rgb, vertical = false, depth = 0.25, tag = LIT): void {
  const px = h / 7
  const n = f.dir(nx, nz)
  const len = [...text].length
  const w = vertical ? px * 5 : lettersWidth(text, h)
  const mid = f.at(x + ux * (vertical ? 0 : w / 2) + nx * Math.min(depth, 0.1), z + uz * (vertical ? 0 : w / 2) + nz * Math.min(depth, 0.1))
  const cy = vertical ? y + (len * h * 1.25) / 2 + h * 0.6 : y + h / 2
  sign(out, { type: 'flat', text, h: vertical ? h * 0.9 : h, w: vertical ? undefined : w, face: 'grotesque', weight: 'bold', colour: c,
    lit: tag === LIT || tag === EMIT ? 'self' : 'none', vertical },
    { x: mid.x, y: cy, z: mid.z, heading: Math.atan2(n.x, n.z) })
}

/** How wide `letters` draws a word h tall. */
const lettersWidth = (text: string, h: number): number => (h / 7) * (6 * text.length - 1)

/** A word centred on the grid-frame point (cx, cz) of a wall facing (nx, nz), reading left to right from outside. */
function wallText(out: MeshBuilder, f: Frame, text: string, cx: number, cz: number, nx: number, nz: number, y: number, h: number, c: Rgb, depth = 0.25, tag = LIT): void {
  const ux = -nz
  const uz = nx
  const w = lettersWidth(text, h)
  letters(out, f, text, cx - ux * w / 2, cz - uz * w / 2, ux, uz, nx, nz, y, h, c, false, depth, tag)
}

/** The model's own frame as a Frame (for features placed on the ring's edges, not by the street grid). */
const ownFrame = (ring: P2[]): Frame => ({ ring, at: (x, z) => ({ x, z }), dir: (x, z) => ({ x, z }) })

/** The ring's edges, with their length, midpoint and outward normal. */
function edgesOf(ring: P2[]): { a: P2; b: P2; L: number; m: P2; n: P2; t: P2 }[] {
  return ring.map((a, i) => {
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const t = { x: (b.x - a.x) / L, z: (b.z - a.z) / L }
    return { a, b, L, m: { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }, n: { x: t.z, z: -t.x }, t }
  })
}

/** A word on the longest `count` walls of the ring, centred `at` of the way along each (0..1), at height y. */
function edgeText(out: MeshBuilder, ring: P2[], text: string, y: number, h: number, c: Rgb, count = 2, at = 0.5, depth = 0.05): void {
  const f = ownFrame(ring)
  const es = edgesOf(ring).sort((p, q) => q.L - p.L).slice(0, count)
  for (const e of es) {
    if (lettersWidth(text, h) > e.L * 0.9) continue
    const cx = e.a.x + (e.b.x - e.a.x) * at
    const cz = e.a.z + (e.b.z - e.a.z) * at
    wallText(out, f, text, cx + e.n.x * 0.15, cz + e.n.z * 0.15, e.n.x, e.n.z, y, h, c, depth)
  }
}

/**
 * Solid piers standing proud at each corner of the ring (turned more than 60°), `w` along each wall, from y0 to
 * y1: the Grand Hyatt's blank corner piers, which run past the roof.
 */
function cornerPiers(out: MeshBuilder, ring0: P2[], w: number, y0: number, y1: number, c: Rgb, proud = 0.3, material: Surface = 'concrete'): void {
  const ring = straighten(ring0)
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const a = ring[(i + n - 1) % n]
    const b = ring[i]
    const d = ring[(i + 1) % n]
    const l1 = Math.hypot(b.x - a.x, b.z - a.z)
    const l2 = Math.hypot(d.x - b.x, d.z - b.z)
    if (l1 < w * 2 || l2 < w * 2) continue
    const u1 = { x: (b.x - a.x) / l1, z: (b.z - a.z) / l1 }
    const u2 = { x: (d.x - b.x) / l2, z: (d.z - b.z) / l2 }
    if (u1.x * u2.z - u1.z * u2.x < 0.85) continue
    const sq = [{ x: b.x - u1.x * w, z: b.z - u1.z * w }, b, { x: b.x + u2.x * w, z: b.z + u2.z * w }, { x: b.x - u1.x * w + u2.x * w, z: b.z - u1.z * w + u2.z * w }]
    const ring4 = [sq[0], sq[1], sq[2], sq[3]]
    const grown = insetRing(ring4, -proud)
    raised(out, y0, () => mass(out, grown, y1 - y0, { height: y1 - y0, tiers: [{ to: 1, face: { kind: 'blank', material, wall: c } }], roof: c }))
  }
}

/** Pointed gables along every wall of the ring at y, about `pitch` apart, `h` tall (the Drake's gothic crown). */
function gables(out: MeshBuilder, ring: P2[], y: number, h: number, pitch: number, c: Rgb): void {
  for (const e of edgesOf(ring)) {
    const k = Math.floor(e.L / pitch)
    if (k < 1) continue
    const step = e.L / k
    for (let i = 0; i < k; i++) {
      const u = step * (i + 0.5)
      const w = Math.min(step * 0.42, 2.2)
      const P = (uu: number, yy: number, o: number): V3 => [e.a.x + e.t.x * uu + e.n.x * o, yy, e.a.z + e.t.z * uu + e.n.z * o]
      const apex = P(u, y + h, 0.02)
      out.quad([P(u - w, y, 0.02), P(u + w, y, 0.02), apex, apex], [e.n.x, 0, e.n.z], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
      // and its two sloping tops, back to the wall, so it reads from the side
      const back = (uu: number, yy: number): V3 => P(uu, yy, -0.8)
      out.quad([P(u - w, y, 0.02), apex, back(u, y + h), back(u - w, y)], [e.n.x * 0.5 - e.t.x * 0.8, 0.4, e.n.z * 0.5 - e.t.z * 0.8], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
      out.quad([apex, P(u + w, y, 0.02), back(u + w, y), back(u, y + h)], [e.n.x * 0.5 + e.t.x * 0.8, 0.4, e.n.z * 0.5 + e.t.z * 0.8], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
    }
  }
}

/**
 * A harlequin chequer of diamonds on every wall of the ring, between y0 and y1: `w` across and `h` up each, the
 * dark half of the pattern painted on (Neiman Marcus's granite).
 */
function diamonds(out: MeshBuilder, ring: P2[], y0: number, y1: number, w: number, h: number, c: Rgb): void {
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (const e of edgesOf(ring)) {
    const P = (u: number, y: number): V3 => [e.a.x + e.t.x * u + e.n.x * 0.04, y, e.a.z + e.t.z * u + e.n.z * 0.04]
    const n: V3 = [e.n.x, 0, e.n.z]
    for (let j = 0; y0 + j * h < y1; j++) {
      for (let i = 0; i * w < e.L; i++) {
        if ((i + j) % 2 === 1) continue
        const u = i * w + (j % 2) * w / 2
        const y = y0 + j * h
        if (u - w / 2 < 0 || u + w / 2 > e.L || y - h / 2 < y0 || y + h / 2 > y1) continue
        out.quad([P(u - w / 2, y), P(u, y - h / 2), P(u + w / 2, y), P(u, y + h / 2)], n, uv, c, surfaceTag('granite'))
      }
    }
  }
}


/** A five-pointed star on a wall facing (nx, nz): Macy's. */
function wallStar(out: MeshBuilder, f: Frame, cx: number, cz: number, nx: number, nz: number, y: number, r: number, c: Rgb, o = 0.3, tag = LIT): void {
  const ux = -nz
  const uz = nx
  const P = (a: number, rr: number): V3 => { const p = f.at(cx + ux * Math.sin(a) * rr + nx * o, cz + uz * Math.sin(a) * rr + nz * o); return [p.x, y + Math.cos(a) * rr, p.z] }
  const d = f.dir(nx, nz)
  const C: V3 = (() => { const p = f.at(cx + nx * o, cz + nz * o); return [p.x, y, p.z] })()
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2
    out.quad([C, P(a - Math.PI / 5, r * 0.4), P(a, r), P(a + Math.PI / 5, r * 0.4)], [d.x, 0, d.z], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
}

// ---------------------------------------------------------------------------------------------------------------
// colours

const DARK_GLASS: Rgb = [0.17, 0.19, 0.21]
const COPPER_GREEN: Rgb = [0.24, 0.36, 0.3]
const AWNING_RED: Rgb = [0.6, 0.12, 0.12]
const GOLD_LEAF: Rgb = [0.78, 0.63, 0.25]
/** a sign's tag: a colour the landmark material lights up after dark (cartoon-material.ts, alpha 0.4–0.9) */
const LIT = 0.5

// ---------------------------------------------------------------------------------------------------------------
// the outlines, grid frame (tools: the Overpass cache, turned −9° so the streets run square)

// ---------------------------------------------------------------------------------------------------------------

/**
 * The Westin St. Francis (1904, Bliss & Faville; the third wing 1913), Powell Street across from Union Square. What
 * everyone knows is the Powell front: three twelve-storey wings of rusticated grey-brown sandstone with two deep
 * light courts between them, open to the square above a four-storey base; a balcony course two floors from the
 * top, an ornamented attic and a heavy green copper cornice on each wing; at the foot, the columned portico with
 * the red entrance canopy and the arched ground-floor windows under red awnings. The courts cut ~30 m back to a
 * rear block, which joins the modern tower behind. (Commons: "The Westin St. Francis Hotel San Francisco.jpg",
 * "Westin St. Francis 01.JPG", "San Francisco (CA, USA), The Westin St. Francis -- 2022 -- 2912.jpg".)
 */
function westinStFrancis(out: MeshBuilder, fit: Fit): void {
  /*
   * The frame is SET, not fitted (2026-10-04): the city fits the union of the hotel's parts, the modern tower behind
   * included, and `gridFrame`'s best turn of WESTIN_REF on that union is a quarter round — the three wings and their
   * courts opened onto Post Street and the awnings stood in the road (owner: "large red cubes in the street"). With
   * the manifest's front pinned to 90 (Powell), local −z is east: the grid's +x (the Powell face) is local −z and its
   * +z (north) local +x.
   */
  const ring0 = towerRing(fit)
  const c0 = centroidOf(ring0)
  const f: Frame = { ring: ring0, at: (x, z) => ({ x: c0.x + z, z: c0.z - x }), dir: (x, z) => ({ x: z, z: -x }) }
  // the Powell face, measured: the grid's x of the footprint's easternmost wall (the street-front pieces were drawn
  // for a face at 43.4 about the OUTLINE's centroid; the union's lies further west, behind the modern tower)
  const faceX = Math.max(...ring0.map((p) => c0.z - p.z))
  const faceZ = Math.max(...ring0.map((p) => p.x - c0.x))
  const H = fit.height > 40 && fit.height < 80 ? fit.height : 60
  const STONE: Rgb = [0.5, 0.46, 0.41]
  const shaft: Face = { kind: 'punched', material: 'ashlar', wall: STONE, glass: DARK_GLASS, pitch: 2.7, solid: 0.55, floor: 3.7 }
  const baseH = 15
  const ground: Face = { kind: 'punched', material: 'ashlar', wall: [0.6, 0.55, 0.48], glass: [0.3, 0.22, 0.16], pitch: 5, solid: 0.45, floor: 5, arched: true }
  const wing: TowerSpec = {
    height: H,
    tiers: [
      { to: H - 9, face: shaft, cornice: { depth: 0.6, height: 0.5 } },
      { to: H - 1.6, face: { ...shaft, solid: 0.62, floor: 3.4 } },
      { to: H, face: { kind: 'blank', material: 'copper', wall: COPPER_GREEN }, cornice: { depth: 1.5, height: 1.1, colour: COPPER_GREEN } },
    ],
    roof: [0.4, 0.38, 0.36],
  }
  // the base: the whole footprint, four storeys
  mass(out, f.ring, baseH, {
    height: baseH,
    tiers: [
      { to: 6, face: ground },
      { to: baseH, face: shaft, cornice: { depth: 0.7, height: 0.7 } },
    ],
    roof: [0.4, 0.38, 0.36],
  })
  // above it: the rear block behind the courts, and the three wings reaching out to Powell
  const back = 12
  const rear = clip(f.ring, f, back, 0, 1, 0)
  const up = (ring: P2[]): void => {
    raised(out, baseH, () => mass(out, ring, H - baseH, { ...wing, tiers: wing.tiers.map((t) => ({ ...t, to: t.to - baseH })) }))
  }
  // (25 cm in: the wings overlap it by a metre and their outer walls lay in its plane, and fought)
  up(shrinkRing(rear, 0.25))
  const courts: [number, number][] = [[-15.5, -7.5], [12.5, 20.5]]
  const cuts = [-43, ...courts.flat(), 42]
  for (let k = 0; k < cuts.length; k += 2) up(clipBox(f.ring, f, back - 1, 60, cuts[k], cuts[k + 1]))
  /*
   * The Powell and Post fronts at street level, from the owner's Street View frame at the corner (2026-10-04):
   * - the COLONNADE before the middle wing: a row of tall stone columns standing off the wall, carrying an
   *   entablature with a balustraded balcony on top, the red marquee hung with flowers between them and the wall;
   * - over the shop windows, square red shed awnings that STEP with the street's grade;
   * - above them, over the arched windows, red half-dome awnings at ONE height along each front, however the
   *   street falls — "weirdly the square ones follow the grade of the street, while the upper hemispherical ones are
   *   arranged horizontally" (owner).
   * Powell climbs to Post, so everything is set from `fit.groundAt` under it, not the base's lowest corner.
   */
  const street = (x: number, z: number): number => { const p = f.at(x, z); return Math.max(0, fit.groundAt?.(p.x, p.z) ?? 0) }
  const footprint = towerRing(fit)
  const onWall = (x: number, z: number): boolean => {
    const p = f.at(x, z)
    let c = false
    for (let i = 0, j = footprint.length - 1; i < footprint.length; j = i++) {
      const a = footprint[i], b = footprint[j]
      if ((a.z > p.z) !== (b.z > p.z) && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) c = !c
    }
    return c
  }
  const STONE_LIGHT: Rgb = [0.7, 0.66, 0.58]
  const ashlar = surfaceTag('ashlar')
  // the colonnade, before the middle wing
  const cz0 = -7, cz1 = 12.5
  const g0 = street(faceX, (cz0 + cz1) / 2)
  const cx = faceX + 2.2
  const nCol = 8
  for (let k = 0; k < nCol; k++) {
    const z = cz0 + ((cz1 - cz0) * k) / (nCol - 1)
    gbox(out, f, cx - 0.55, cx + 0.55, z - 0.55, z + 0.55, 0, g0 + 0.8, STONE_LIGHT, ashlar)
    gcol(out, f, cx, z, g0 + 0.8, g0 + 9.2, 0.4, STONE_LIGHT, 12, 0.34, ashlar)
    gbox(out, f, cx - 0.55, cx + 0.55, z - 0.55, z + 0.55, g0 + 9.2, g0 + 9.7, STONE_LIGHT, ashlar)
  }
  // the entablature from the wall out over the columns, and the balcony's balustrade on it
  gbox(out, f, faceX, cx + 0.7, cz0 - 0.9, cz1 + 0.9, g0 + 9.7, g0 + 10.9, [0.6, 0.55, 0.48], ashlar)
  gbox(out, f, cx + 0.45, cx + 0.65, cz0 - 0.8, cz1 + 0.8, g0 + 10.9, g0 + 11.9, STONE_LIGHT, ashlar)
  for (let z = cz0 - 0.6; z <= cz1 + 0.6; z += 2.4) gbox(out, f, cx + 0.3, cx + 0.7, z - 0.2, z + 0.2, g0 + 10.9, g0 + 12.1, STONE_LIGHT, ashlar)
  // the marquee between wall and columns, its valance hung with flowers
  gbox(out, f, faceX, cx + 0.2, cz0 + 1, cz1 - 1, g0 + 3.9, g0 + 4.2, AWNING_RED)
  gbox(out, f, cx + 0.2, cx + 0.45, cz0 + 1, cz1 - 1, g0 + 3.4, g0 + 4.2, AWNING_RED)
  const BLOOMS: Rgb[] = [[0.93, 0.85, 0.3], [0.95, 0.5, 0.6], [0.95, 0.95, 0.9], [0.55, 0.35, 0.75], [0.35, 0.6, 0.3]]
  for (let z = cz0 + 1.2, k = 0; z < cz1 - 1; z += 0.45, k++) {
    gbox(out, f, cx + 0.45, cx + 0.6, z - 0.2, z + 0.2, g0 + 3.5 + (k % 3) * 0.2, g0 + 3.8 + (k % 3) * 0.2, BLOOMS[k % BLOOMS.length])
  }

  // the awnings on a front: `face` puts a point `u` along it and `o` out from it in the grid frame
  const SHED: Rgb = [0.72, 0.16, 0.15], DOME: Rgb = [0.8, 0.42, 0.4], BAND: Rgb = [0.72, 0.66, 0.56]
  type Front = { at: (u: number, o: number) => [number, number]; out: P2; along: P2; from: number; to: number; skip?: [number, number] }
  const fronts: Front[] = [
    // Powell: u is the grid's z, out is +x
    { at: (u, o) => [faceX + o, u], out: f.dir(1, 0), along: f.dir(0, 1), from: -40, to: 40, skip: [cz0 - 2, cz1 + 2] },
    // Post: u is the grid's x, out is +z
    { at: (u, o) => [u, faceZ + o], out: f.dir(0, 1), along: f.dir(1, 0), from: faceX - 60, to: faceX - 2 },
  ]
  const P3 = (fr: Front, u: number, o: number, y: number): [number, number, number] => {
    const [gx, gz] = fr.at(u, o); const q = f.at(gx, gz); return [q.x, y, q.z]
  }
  for (const fr of fronts) {
    const us: number[] = []
    for (let u = fr.from + 2.5; u <= fr.to - 2.5; u += 5) {
      if (fr.skip && u > fr.skip[0] && u < fr.skip[1]) continue
      const [ax, az] = fr.at(u - 1.6, -1), [bx, bz] = fr.at(u + 1.6, -1)
      if (onWall(ax, az) && onWall(bx, bz)) us.push(u)
    }
    if (us.length === 0) continue
    // the half-domes at one height along the front: over the highest pavement under them
    const top = Math.max(...us.map((u) => street(...fr.at(u, 0.5))))
    const Y = top + 6.6
    for (const u of us) {
      const g = street(...fr.at(u, 0.5))
      // the shed awning: sloping out and down from the wall, cheeks at the ends, a valance along the front
      const w = 1.5, d = 1.4, y1 = g + 4.3, y0 = g + 3.6
      out.quad([P3(fr, u - w, 0.02, y1), P3(fr, u + w, 0.02, y1), P3(fr, u + w, d, y0), P3(fr, u - w, d, y0)],
        [fr.out.x * 0.5, 1, fr.out.z * 0.5], [[0, 0], [1, 0], [1, 1], [0, 1]], SHED, 0)
      out.quad([P3(fr, u - w, d, y0), P3(fr, u + w, d, y0), P3(fr, u + w, d, y0 - 0.3), P3(fr, u - w, d, y0 - 0.3)],
        [fr.out.x, 0, fr.out.z], [[0, 0], [1, 0], [1, 1], [0, 1]], SHED, 0)
      for (const s of [-1, 1]) {
        out.quad([P3(fr, u + s * w, 0.02, y1), P3(fr, u + s * w, d, y0), P3(fr, u + s * w, d, y0 - 0.3), P3(fr, u + s * w, 0.02, y0 - 0.3)],
          [fr.along.x * s, 0, fr.along.z * s], [[0, 0], [1, 0], [1, 1], [0, 1]], SHED, 0)
      }
      // the half-dome over the arched window: a quarter sphere against the wall, a pale band at its rim
      const R = 1.25, D = 1.05, nT = 8, nP = 4
      for (let a = 0; a < nT; a++) {
        for (let b = 0; b < nP; b++) {
          const pt = (ia: number, ib: number): [number, number, number] => {
            const th = (Math.PI * ia) / nT, ph = (Math.PI / 2) * (ib / nP)
            return P3(fr, u + R * Math.cos(th) * Math.cos(ph), 0.03 + D * Math.sin(ph), Y + R * Math.sin(th) * Math.cos(ph))
          }
          const th = (Math.PI * (a + 0.5)) / nT, ph = (Math.PI / 2) * ((b + 0.5) / nP)
          const n: [number, number, number] = [fr.along.x * Math.cos(th) * Math.cos(ph) + fr.out.x * Math.sin(ph), Math.sin(th) * Math.cos(ph),
            fr.along.z * Math.cos(th) * Math.cos(ph) + fr.out.z * Math.sin(ph)]
          out.quad([pt(a, b), pt(a + 1, b), pt(a + 1, b + 1), pt(a, b + 1)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], DOME, 0)
        }
      }
      out.quad([P3(fr, u - R, D * 0.98, Y - 0.25), P3(fr, u + R, D * 0.98, Y - 0.25), P3(fr, u + R, D * 0.98, Y), P3(fr, u - R, D * 0.98, Y)],
        [fr.out.x, 0, fr.out.z], [[0, 0], [1, 0], [1, 1], [0, 1]], BAND, 0)
      // the arched window under it, dark
      out.quad([P3(fr, u - 1.0, 0.06, g + 4.4), P3(fr, u + 1.0, 0.06, g + 4.4), P3(fr, u + 1.0, 0.06, Y), P3(fr, u - 1.0, 0.06, Y)],
        [fr.out.x, 0, fr.out.z], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.2, 0.18, 0.17], 0)
    }
  }
}

/** way/32863633 */
const MACYS_REF = [50.2, 41.5, -51.6, 41.0, -51.6, 14.3, -51.5, -0.7, -49.6, -0.7, -49.5, -12.0, -49.4, -19.6, -49.2, -42.0, 9.5, -41.6, 50.9, -41.4]

const MACY_RED: Rgb = [0.8, 0.1, 0.12]
const WHITE: Rgb = [0.95, 0.95, 0.94]

/**
 * Macy's Union Square: one OSM way for the whole Geary–Stockton–O'Farrell block, which is three buildings to the eye.
 * - At Geary and Stockton, the former I. Magnin (Timothy Pflueger, 1948): a white Vermont-marble box, ten tall
 *   floors of big square windows set far apart, "macy's" in grey at the top of the Geary face.
 * - Along Geary facing the square, the 1980s glass front: seven floors of pale reflective glass on a grey grid,
 *   the middle bay standing forward, between two plain grey stone end piers; white "MACY'S" and the red star on
 *   the roof edge over the middle, three flagpoles.
 * - Behind and along Stockton and O'Farrell, the 1928 store: a plain cream stone block of tall department-store
 *   floors, and on O'Farrell the dark vertical MACY★S blade.
 * (Commons: "Macy's Union Square San Francisco.jpg", "2017 Macy's on Union Square San Francisco.jpg",
 * "IMagnin-Macy's.jpg", "Macy´s(o´farrell st.) - panoramio.jpg".)
 */
/** a ring drawn `d` metres in, whichever way it winds */
function shrinkRing(r: P2[], d: number): P2[] {
  let a = 0
  for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; a += r[i].x * r[j].z - r[j].x * r[i].z }
  return offsetRing(r, a > 0 ? -d : d)
}

function macys(out: MeshBuilder, fit: Fit): void {
  const f = gridFrame(fit, MACYS_REF, 0, 1)
  const H = fit.height > 30 && fit.height < 70 ? fit.height : 45
  const MARBLE: Rgb = [0.87, 0.86, 0.83]
  const CREAM: Rgb = [0.8, 0.76, 0.68]
  const GREY_STONE: Rgb = [0.66, 0.65, 0.62]
  const shops: Face = { kind: 'curtain', wall: [0.2, 0.2, 0.21], glass: [0.16, 0.18, 0.2], pitch: 4, floor: 6 }
  // the 1928 store, the south two-thirds of the block
  // (25 cm in: the I. Magnin corner and the Geary glass front are drawn over parts of the same outline, and their walls
  // lay in this one's plane — 4 400 m² of wall fighting itself, the goal's Union Square z-fighting)
  mass(out, shrinkRing(clip(f.ring, f, 0, 0.5, 0, 1), 0.25), H - 3, {
    height: H - 3,
    base: { height: 6, face: shops, canopy: { depth: 1.2, colour: [0.3, 0.29, 0.28] } },
    tiers: [{ to: 1, face: { kind: 'punched', material: 'ashlar', wall: CREAM, glass: DARK_GLASS, pitch: 3.4, solid: 0.55, floor: 4.8 }, cornice: { depth: 0.5, height: 0.6 } }],
    roof: [0.5, 0.49, 0.47],
    crown: { kind: 'parapet', height: 1, colour: CREAM },
    penthouse: 2,
  })
  // I. Magnin, the Geary–Stockton corner
  mass(out, clipBox(f.ring, f, 12, 70, 0, 60), H + 1, {
    height: H + 1,
    base: { height: 5.5, face: shops },
    tiers: [{ to: 1, face: { kind: 'punched', material: 'ashlar', wall: MARBLE, glass: [0.14, 0.15, 0.17], pitch: 4.8, solid: 0.58, floor: 4.3 } }],
    roof: [0.6, 0.6, 0.58],
    crown: { kind: 'parapet', height: 1.4, colour: MARBLE },
  })
  wallText(out, f, "MACY'S", 31, 41.5, 0, 1, H - 3.2, 2.4, [0.35, 0.35, 0.36])
  // the glass front on Geary, with its stone end piers
  const G = 36
  const gz = 41.2
  mass(out, clipBox(f.ring, f, -70, 12, 0.5, 60), G, {
    height: G,
    base: { height: 6, face: shops, canopy: { depth: 1.5, colour: [0.35, 0.36, 0.38] } },
    tiers: [{ to: 1, face: { kind: 'curtain', material: 'metal', wall: [0.62, 0.64, 0.66], glass: [0.5, 0.57, 0.63], pitch: 3.2, floor: 4.3 } }],
    roof: [0.5, 0.5, 0.5],
    crown: { kind: 'parapet', height: 1.2, colour: [0.6, 0.62, 0.64] },
  })
  gbox(out, f, -51.6, -46, gz - 0.2, gz + 0.5, 6, G + 1.2, GREY_STONE, surfaceTag('granite'))
  gbox(out, f, 6, 12, gz - 0.2, gz + 0.5, 6, G + 1.2, GREY_STONE, surfaceTag('granite'))
  // the middle bay, stood forward, and the stone band over the door
  gbox(out, f, -28, -12, gz, gz + 1.6, 7.5, G - 1, [0.5, 0.57, 0.63], surfaceTag('glass'))
  for (let y = 7.5 + 4.3; y < G - 1; y += 4.3) gbox(out, f, -28.1, -11.9, gz + 1.6, gz + 1.8, y - 0.15, y + 0.15, [0.62, 0.64, 0.66])
  gbox(out, f, -28.5, -11.5, gz, gz + 2, 6, 7.5, GREY_STONE, surfaceTag('granite'))
  wallText(out, f, "MACY'S", -20, gz + 0.6, 0, 1, G + 1.3, 2.6, WHITE, 0.3)
  wallStar(out, f, -20 - lettersWidth("MACY'S", 2.6) / 2 - 1.6, gz + 0.6, 0, 1, G + 2.6, 1.1, MACY_RED)
  for (const x of [-25.5, -20, -14.5]) gcol(out, f, x, 36, G, G + 9, 0.08, [0.8, 0.8, 0.8], 4)
  // the O'Farrell blade: dark brown, white letters down both faces, near Stockton
  const bx = 38
  const bz = -41.6
  gbox(out, f, bx - 0.25, bx + 0.25, bz - 3.2, bz, 9, 27, [0.28, 0.2, 0.16], surfaceTag('metal'))
  for (const s of [-1, 1]) letters(out, f, 'MACY*S', bx + s * 0.25, bz - 1.6, 0, s, s, 0, 9.6, 2.1, WHITE, true, 0.12)
}

/** way/1186086081 */
const SUTTER450_REF = [-20.2, -23.7, -17.6, -23.7, 18.8, -23.9, 21.1, -23.9, 21.0, 2.4, 21.0, 5.9, 20.9, 17.5, 20.9, 21.5, 3.4, 21.6, 3.4, 25.4, -20.3, 25.4, -20.3, 17.2, -20.2, -2.5]

/**
 * 450 Sutter (1929, Timothy Pflueger), the doctors' and dentists' building: 26 storeys of pinkish-buff terracotta
 * moulded all over in Mayan-revival ornament, the corners rounded, the walls ribbed top to bottom by close,
 * unbroken piers with the windows between them, and no cornice: the piers just stop in a notched parapet. Two
 * masses side by side, the west one a few floors taller, a penthouse on it. (Commons: "450 Sutter Street.jpg",
 * "450 Sutter Street, San Francisco 2023-07-20 (1).jpg".)
 */
function fourFiftySutter(out: MeshBuilder, fit: Fit): void {
  const f = gridFrame(fit, SUTTER450_REF, 0, -1)
  const H = fit.height > 70 && fit.height < 140 ? fit.height : 105
  const TC: Rgb = [0.86, 0.78, 0.69]
  const ring = roundRing(f.ring, 5, 5)
  const shaft: Face = { kind: 'fins', material: 'terracotta', wall: TC, glass: [0.34, 0.35, 0.37], pitch: 2.35, solid: 0.56, depth: 0.32, floor: 3.4 }
  const s = (h: number): TowerSpec => ({
    height: h,
    base: { height: 7.5, face: { kind: 'punched', material: 'terracotta', wall: [0.74, 0.67, 0.6], glass: [0.2, 0.2, 0.2], pitch: 3.2, solid: 0.4, floor: 7.5 } },
    tiers: [{ to: 1, face: shaft }],
    roof: [0.62, 0.58, 0.54],
    crown: { kind: 'parapet', height: 1.2, colour: TC },
  })
  mass(out, clip(ring, f, 3.4, 0, 1, 0), H - 4, s(H - 4))
  mass(out, clip(ring, f, 3.4, 0, -1, 0), H - 14, s(H - 14))
  // the penthouse's own ribbed tower, set back on the tall mass
  const top = clipBox(f.ring, f, -12, 0, -6, 12)
  raised(out, H - 4, () => mass(out, top, 7, { height: 7, tiers: [{ to: 1, face: { ...shaft, pitch: 1.8 } }], roof: [0.62, 0.58, 0.54], crown: { kind: 'parapet', height: 0.8, colour: TC } }))
}

/**
 * The Grand Hyatt (1972, Skidmore, Owings & Merrill), Stockton at Sutter: a 36-storey cream concrete slab whose
 * corners are wide blank piers running the full height and on past the roof like horns; between them, rows of
 * pale green-grey windows with thin balcony rails, a floor apart; the top two floors dark louvres, set back.
 * (Commons: "Grand Hyatt San Francisco 2021.jpg".)
 */
function grandHyatt(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 60 && fit.height < 140 ? fit.height : 94
  const CREAM: Rgb = [0.87, 0.84, 0.77]
  const ring = towerRing(fit)
  tower(out, fit, {
    height: H,
    base: { height: 9, face: { kind: 'curtain', wall: [0.3, 0.3, 0.31], glass: [0.2, 0.23, 0.25], pitch: 3, floor: 4.5 }, canopy: { depth: 2.5, colour: CREAM } },
    tiers: [
      { to: H - 7, face: { kind: 'bands', material: 'concrete', wall: CREAM, glass: [0.42, 0.5, 0.52], solid: 0.42, floor: 2.75 } },
      { to: H, face: { kind: 'fins', material: 'concrete', wall: CREAM, glass: [0.16, 0.17, 0.18], pitch: 1.5, solid: 0.3, depth: 0.1, floor: 3.5 }, inset: 0.8 },
    ],
    roof: [0.6, 0.58, 0.55],
    penthouse: 1,
  })
  cornerPiers(out, ring, 4.5, 9, H + 4, CREAM, 0.35)
  edgeText(out, ring, 'GRAND HYATT', 6, 1.1, [0.7, 0.12, 0.12], 1, 0.8)
}

/**
 * The San Francisco Marriott Union Square (1970, as the Holiday Inn), Sutter at Powell: a 30-storey slab stacked with
 * angled bay windows in beige pebble-aggregate, a sawtooth of them up every face between flat white strips; a
 * pale grey panelled podium, glass at the street, and the red Marriott script on it. (Commons: "San Francisco
 * Marriott Union Square 01.jpg".)
 */
function marriottUnionSquare(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 60 && fit.height < 140 ? fit.height : 95
  const ring = towerRing(fit)
  tower(out, fit, {
    height: H,
    base: { height: 5.5, face: { kind: 'curtain', wall: [0.78, 0.78, 0.77], glass: [0.2, 0.24, 0.26], pitch: 2.4, floor: 5.5 } },
    tiers: [
      { to: 14, face: { kind: 'blank', material: 'concrete', wall: [0.8, 0.8, 0.79] }, cornice: { depth: 0.6, height: 0.5, colour: [0.86, 0.86, 0.85] } },
      { to: 1, face: { kind: 'bands', material: 'concrete', wall: [0.72, 0.66, 0.56], glass: [0.2, 0.21, 0.22], solid: 0.5, floor: 2.9 } },
    ],
    roof: [0.62, 0.62, 0.6],
    crown: { kind: 'parapet', height: 1.5, colour: [0.9, 0.9, 0.89] },
    penthouse: 1,
  })
  // the flat white strips at the corners, between the stacks of bays
  cornerPiers(out, ring, 3, 14, H, [0.9, 0.9, 0.89], 0.4, 'concrete')
  edgeText(out, ring, 'MARRIOTT', 9.4, 2.4, [0.72, 0.1, 0.12], 4, 0.5)
}

/**
 * The Hotel Nikko (1987, Whisler-Patri), Mason at O'Farrell: 25 storeys of pale grey-beige concrete panels with a
 * close grid of punched windows, the top stepping back twice in angled blocks; a four-storey base of pinkish
 * granite with dark projecting window bays. (Commons: "Hotel Nikko San Francisco 2021.jpg".)
 */
const hotelNikko = spec({
  height: 90,
  base: { height: 15, face: { kind: 'punched', material: 'granite', wall: [0.6, 0.54, 0.51], glass: [0.16, 0.17, 0.18], pitch: 4.2, solid: 0.45, floor: 3.75 }, canopy: { depth: 2, colour: [0.25, 0.25, 0.26] } },
  tiers: [
    { to: 0.84, face: { kind: 'punched', material: 'concrete', wall: [0.73, 0.72, 0.69], glass: [0.24, 0.27, 0.3], pitch: 2.3, solid: 0.5, floor: 2.9 }, cornice: { depth: 0.2, height: 0.3 } },
    { to: 0.93, inset: 3.5, face: { kind: 'punched', material: 'concrete', wall: [0.74, 0.73, 0.7], glass: [0.24, 0.27, 0.3], pitch: 2.3, solid: 0.5, floor: 2.9 } },
    { to: 1, inset: 3.5, face: { kind: 'punched', material: 'concrete', wall: [0.76, 0.75, 0.72], glass: [0.24, 0.27, 0.3], pitch: 2.6, solid: 0.6, floor: 2.9 } },
  ],
  roof: [0.6, 0.6, 0.58],
  crown: { kind: 'parapet', height: 1.2, colour: [0.8, 0.78, 0.74] },
  penthouse: 1,
})

/**
 * The Beacon Grand, built as the Sir Francis Drake (1928, Weeks & Day), Powell at Sutter: 22 storeys of buff brick
 * over a three-storey base of cream terracotta with gothic tracery; the brick shaft's windows in pairs between
 * cream piers; on top, set back, the glass band of the Starlight Room, and over it the Gothic crown: a ring of
 * pointed gables in buff and cream, and the gilded star on its mast. (Commons: "Sir Francis Drake Hotel San
 * Francisco 01.jpg", "Top of Beacon Grand Hotel, San Francisco 2023-07-13.jpg".)
 */
function beaconGrand(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 45 && fit.height < 90 ? fit.height : 62
  const BRICK: Rgb = [0.72, 0.64, 0.53]
  const CREAM: Rgb = [0.86, 0.82, 0.73]
  const main = H - 9
  tower(out, { ...fit, height: main }, {
    height: main,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.14, 0.13, 0.13], glass: [0.22, 0.2, 0.18], pitch: 3, floor: 4.5 }, canopy: { depth: 1.4, colour: [0.12, 0.12, 0.12] } },
    tiers: [
      { to: 13, face: { kind: 'punched', material: 'terracotta', wall: CREAM, glass: [0.22, 0.22, 0.22], pitch: 2.6, solid: 0.5, floor: 4.2, arched: true }, cornice: { depth: 0.4, height: 0.5 } },
      { to: 1, face: { kind: 'punched', material: 'brick', wall: BRICK, glass: [0.2, 0.21, 0.23], pitch: 2.2, solid: 0.55, floor: 3 }, cornice: { depth: 0.35, height: 0.6, colour: CREAM } },
    ],
    roof: [0.5, 0.46, 0.42],
  })
  // the Starlight Room, and the crown over it
  const r1 = insetRing(towerRing(fit), 4)
  raised(out, main, () => mass(out, r1, 4, { height: 4, tiers: [{ to: 1, face: { kind: 'curtain', wall: CREAM, glass: [0.28, 0.3, 0.3], pitch: 3, floor: 4 } }], roof: CREAM }))
  const r2 = insetRing(r1, 0.6)
  raised(out, main + 4, () => mass(out, r2, 5, { height: 5, tiers: [{ to: 1, face: { kind: 'punched', material: 'brick', wall: BRICK, glass: [0.18, 0.18, 0.2], pitch: 3.2, solid: 0.7, floor: 5, arched: true } }], roof: [0.55, 0.3, 0.25] }))
  gables(out, r2, main + 9, 3.2, 6.5, CREAM)
  // the gilded star on its mast
  const c = centroidOf(r2)
  prism(out, c.x, c.z, main + 9, main + 16, 0.08, 4, [0.3, 0.3, 0.3], 0)
  const gold: Rgb = [0.85, 0.66, 0.2]
  const own = ownFrame(r2)
  for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) wallStar(out, own, c.x, c.z, nx, nz, main + 15, 2.2, gold, 0.02, surfaceTag('metal'))
}

/**
 * The JW Marriott (1987, John Portman, as the Pan Pacific), Post at Mason: 21 storeys of red-brown brick gridded by
 * cream stone lines, the corners rounded, and on every floor a row of semicircular arched window heads, like a
 * brick honeycomb; the arched windows are taller over a cream stone band at the third floor; the street floor set
 * back behind round cream columns, with blue-framed glass canopies. (Commons: "JW Marriott SF Union Square exterior
 * 1.JPG", "… 2.JPG".)
 */
function jwMarriott(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 50 && fit.height < 100 ? fit.height : 73
  const BRICK: Rgb = [0.55, 0.31, 0.24]
  const STONE: Rgb = [0.84, 0.81, 0.74]
  const ring = roundRing(towerRing(fit), 3, 3)
  mass(out, ring, H, {
    height: H,
    base: { height: 7.5, face: { kind: 'punched', material: 'concrete', wall: [0.74, 0.72, 0.68], glass: [0.18, 0.2, 0.22], pitch: 5, solid: 0.3, floor: 7.5 }, canopy: { depth: 2.4, colour: [0.28, 0.3, 0.68] } },
    tiers: [
      { to: 11, face: { kind: 'blank', material: 'ashlar', wall: STONE }, cornice: { depth: 0.3, height: 0.4 } },
      { to: 17, face: { kind: 'punched', material: 'brick', wall: BRICK, glass: [0.16, 0.17, 0.19], pitch: 2.3, solid: 0.45, floor: 6, arched: true }, cornice: { depth: 0.35, height: 0.5, colour: STONE } },
      { to: H - 1.5, face: { kind: 'punched', material: 'brick', wall: BRICK, glass: [0.2, 0.21, 0.23], pitch: 3.3, solid: 0.35, floor: 2.95, arched: true } },
      { to: H, face: { kind: 'blank', material: 'ashlar', wall: STONE }, cornice: { depth: 0.6, height: 0.6, colour: STONE } },
    ],
    roof: [0.5, 0.48, 0.46],
    penthouse: 1,
  })
}

/** way/79375215 */
const CHANCELLOR_REF = [-12.7, 8.2, -12.7, 4.0, -12.5, -8.4, 12.7, -8.2, 12.5, 8.4]

/**
 * The Chancellor Hotel (1914), Powell between Post and Sutter: a narrow sixteen-storey slot of a hotel. The Powell
 * front is buff brick with paired windows, its top three floors cream terracotta with arched windows under a
 * deep bracketed cornice; the side walls are plain cream stucco with light wells, and down the south wall, by the
 * front, the tall white painted sign, CHANCELLOR HOTEL in red outlined capitals, that everyone in the square sees.
 * (Commons: "Chancellor Hotel, San Francisco (2013).JPG", "San Francisco, Union Square (6).jpg".)
 */
function chancellorHotel(out: MeshBuilder, fit: Fit): void {
  const f = gridFrame(fit, CHANCELLOR_REF, 1, 0)
  const H = fit.height > 35 && fit.height < 70 ? fit.height : 52
  const STUCCO: Rgb = [0.83, 0.79, 0.71]
  const BUFF: Rgb = [0.74, 0.62, 0.45]
  const TC: Rgb = [0.86, 0.8, 0.68]
  mass(out, f.ring, H, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'punched', material: 'stucco', wall: STUCCO, glass: [0.2, 0.21, 0.23], pitch: 3.6, solid: 0.72, floor: 3.2 } }],
    roof: [0.5, 0.48, 0.46],
  })
  // the Powell front, laid over the wall
  const a = f.at(12.75, -8.35)
  const b = f.at(12.75, 8.45)
  const front = [a, b]
  faceBand(out, front, 0, 4.5, { kind: 'curtain', wall: [0.2, 0.2, 0.2], glass: [0.18, 0.2, 0.2], pitch: 2.5, floor: 4.5 })
  faceBand(out, front, 4.5, H - 11, { kind: 'punched', material: 'brick', wall: BUFF, glass: [0.2, 0.21, 0.23], pitch: 1.6, solid: 0.42, floor: 3.2 })
  faceBand(out, front, H - 11, H - 1.4, { kind: 'punched', material: 'terracotta', wall: TC, glass: [0.2, 0.21, 0.23], pitch: 3.2, solid: 0.5, floor: 3.2, arched: true })
  // the bracketed cornice, wrapping a few metres round the sides
  gbox(out, f, 9.5, 14.4, -10, 10, H - 1.4, H, TC, surfaceTag('terracotta'))
  gbox(out, f, 9.5, 13.4, -9.3, 9.3, H - 2.4, H - 1.4, [0.7, 0.64, 0.55], surfaceTag('terracotta'))
  // the painted sign down the south wall
  gbox(out, f, 9.9, 12.2, -8.75, -8.3, 13, H - 5, [0.93, 0.92, 0.88], surfaceTag('stucco'))
  letters(out, f, 'CHANCELLOR HOTEL', 11.05, -8.75, 1, 0, 0, -1, 13.8, 1.45, [0.66, 0.15, 0.14], true, 0.04)
}

/** way/32863589 */
const SAKS_REF = [-25.4, 20.7, -25.8, -10.2, -25.1, -16.0, -24.2, -17.8, -22.4, -19.4, -19.5, -20.9, -14.3, -20.9, 22.9, -20.9, 25.4, -19.7, 25.3, 20.6, 10.3, 20.7, -8.2, 20.7]

/**
 * Saks Fifth Avenue (1981, Hellmuth, Obata & Kassabaum), Post at Powell: six storeys of pale buff stone in a
 * grid of stepped pilasters and deep-set square windows, the Post–Powell corner a rounded tower of curved bays
 * under the big rounded overhang of the roof band; SAKS FIFTH AVENUE in dark capitals along the band over Post, and
 * black awnings over the shop windows. (Commons: "Saks Fifth Avenue San Francisco 01.jpg", "San Francisco, Union
 * Square (6).jpg".)
 */
function saks(out: MeshBuilder, fit: Fit): void {
  const f = gridFrame(fit, SAKS_REF, 0, -1)
  const H = fit.height > 18 && fit.height < 40 ? fit.height : 27
  const STONE: Rgb = [0.83, 0.79, 0.71]
  const ring = roundRing(f.ring, 7, 5)
  mass(out, ring, H, {
    height: H,
    base: { height: 5, face: { kind: 'curtain', wall: [0.55, 0.45, 0.25], glass: [0.18, 0.2, 0.21], pitch: 3.6, floor: 5 }, canopy: { depth: 1.3, colour: [0.1, 0.1, 0.1] } },
    tiers: [
      { to: H - 3.2, face: { kind: 'fins', material: 'ashlar', wall: STONE, glass: [0.8, 0.76, 0.68], pitch: 4.2, solid: 0.3, depth: 0.35, floor: 4.3 } },
      { to: H, face: { kind: 'blank', material: 'ashlar', wall: STONE }, cornice: { depth: 1.3, height: 3.2, colour: [0.85, 0.81, 0.74] } },
    ],
    roof: [0.55, 0.53, 0.5],
  })
  // the deep-set windows between the pilasters, one per bay a floor, drawn as dark panes on the stone
  faceBand(out, insetRing(ring, -0.02), 6.2, H - 3.2, { kind: 'punched', material: 'ashlar', wall: STONE, glass: [0.14, 0.15, 0.17], pitch: 4.2, solid: 0.5, floor: 4.3 })
  wallText(out, f, 'SAKS FIFTH AVENUE', 4, -22.3, 0, -1, H - 2.6, 1.9, [0.14, 0.14, 0.15], 0.12)
}

/** way/35536963 */
const TIFFANY_REF = [-9.7, -18.4, 12.7, -18.6, 12.5, 0.1, 6.2, 0.1, 6.2, 21.8, -9.7, 21.9]

/**
 * The Tiffany Building (1972), 350 Post on the square: eleven storeys of pale grey speckled granite with a plain
 * grid of deep dark square windows; at its foot a tall portal of red granite round the steel doors, and TIFFANY &
 * CO. in silver capitals across the top of the Post face. (Commons: "Tiffany & Co. SF exterior.JPG", "San
 * Francisco, Union Square (6).jpg".)
 */
function tiffany(out: MeshBuilder, fit: Fit): void {
  const f = gridFrame(fit, TIFFANY_REF, 0, -1)
  const H = fit.height > 30 && fit.height < 60 ? fit.height : 42
  const GRANITE: Rgb = [0.78, 0.77, 0.76]
  mass(out, f.ring, H, {
    height: H,
    base: { height: 5.5, face: { kind: 'curtain', material: 'granite', wall: [0.42, 0.41, 0.4], glass: [0.16, 0.17, 0.18], pitch: 4, floor: 5.5 } },
    tiers: [{ to: 1, face: { kind: 'punched', material: 'granite', wall: GRANITE, glass: [0.13, 0.14, 0.16], pitch: 3.1, solid: 0.42, floor: 3.4 } }],
    roof: [0.55, 0.55, 0.54],
    crown: { kind: 'parapet', height: 1.8, colour: GRANITE },
  })
  // the red granite portal on Post
  gbox(out, f, -2.5, 5.5, -19.3, -18.4, 0, 8, [0.5, 0.35, 0.33], surfaceTag('granite'))
  gbox(out, f, -0.8, 3.8, -19.35, -19.25, 0, 6.2, [0.2, 0.2, 0.21], surfaceTag('metal'))
  wallText(out, f, 'TIFFANY & CO.', 1.5, -18.6, 0, -1, H - 0.2, 1.4, [0.82, 0.83, 0.85], 0.1)
}

/**
 * Apple Union Square (2016, Foster + Partners), Post at Stockton: a two-storey pavilion under one thin, wide roof
 * slab. The long sides, to Post and the square and to the plaza behind, are walls of glass, each split by the
 * 13 m sliding doors that open the whole store to the street; the short ends are pale grey metal panels. The
 * mezzanine floor shows through the glass. Both long sides are drawn alike, so it reads the same whichever way
 * the city turns its box. (Commons: "Back entrance of Apple Store, San Francisco (2018).jpg".)
 */
function appleUnionSquare(out: MeshBuilder, fit: Fit): void {
  const ring = straighten(towerRing(fit))
  const H = fit.height > 10 && fit.height < 20 ? fit.height : 15
  const PANEL: Rgb = [0.66, 0.67, 0.68]
  const GL: Rgb = [0.55, 0.62, 0.64]
  const es = edgesOf(ring)
  const longest = Math.max(...es.map((e) => e.L))
  es.forEach((e, i) => {
    const long = e.L > longest * 0.8
    // (by its index in the ring: given the edge alone, [a, b], faceBand closed it into a ring and drew the wall twice,
    // back to back — and landmarks are drawn without back-face culling, so the two fought: the glass front's blotches,
    // owner 2026-10-03, 37.788715, -122.407202)
    if (!long) { faceBand(out, ring, 0, H - 1.2, { kind: 'curtain', material: 'metal', wall: [0.58, 0.59, 0.6], glass: PANEL, pitch: 1.6, floor: 3.3 }, [i]); return }
    faceBand(out, ring, 0, H - 1.2, { kind: 'curtain', material: 'metal', wall: [0.3, 0.31, 0.33], glass: GL, pitch: e.L / 4, floor: H - 1.2 }, [i])
    // the sliding doors: their deep steel frames, the two middle bays
    const own = ownFrame(ring)
    for (const u of [e.L * 0.25, e.L * 0.5, e.L * 0.75]) {
      const c = { x: e.a.x + e.t.x * u, z: e.a.z + e.t.z * u }
      gbox(out, own, c.x - 0.2, c.x + 0.2, c.z - 0.2, c.z + 0.2, 0, H - 1.2, [0.28, 0.29, 0.3], surfaceTag('metal'))
    }
  })
  capPolygon(out, ring, 0.02, [0.8, 0.8, 0.79], 0)
  // the mezzanine, seen through the glass, and the thin roof slab overhanging all round
  faceBand(out, insetRing(ring, 4), 6.2, 6.8, { kind: 'blank', material: 'stucco', wall: [0.9, 0.9, 0.89] })
  capPolygon(out, insetRing(ring, 4), 6.8, [0.75, 0.66, 0.5], 0)
  const roof = insetRing(ring, -1.6)
  faceBand(out, roof, H - 1.2, H, { kind: 'blank', material: 'metal', wall: [0.88, 0.88, 0.87] })
  capPolygon(out, roof, H, [0.45, 0.46, 0.47], surfaceTag('metal'))
  const under = [...roof].reverse()
  capPolygon(out, under, H - 1.2, [0.92, 0.92, 0.91], 0)
}

/** way/332521036 */
const NEIMAN_REF = [46.6, 21.0, -46.2, 20.8, -46.2, -21.4, 31.8, -20.6, 43.6, -20.6, 46.4, -20.6, 46.4, -12.5, 46.5, -4.1, 46.5, 4.8, 46.5, 12.8]

/**
 * Neiman Marcus (1982, Philip Johnson and John Burgee), Stockton at Geary: a near-windowless block faced all over
 * in a harlequin chequer of pink-mauve and cream granite diamonds; at the Geary–Stockton corner, cut out of it, a
 * four-storey glass box, and behind the glass the round drum of the old City of Paris rotunda with its tiers of
 * little lights. The script name sits on the granite beside the glass. (Commons: "San Francisco Neiman Marcus
 * 04.jpg", "… 01.jpg".)
 */
function neimanMarcus(out: MeshBuilder, fit: Fit): void {
  const f = gridFrame(fit, NEIMAN_REF, 0, 1)
  const H = fit.height > 18 && fit.height < 45 ? fit.height : 28
  const PINK: Rgb = [0.6, 0.45, 0.44]
  const PALE: Rgb = [0.74, 0.66, 0.62]
  // the block, less the corner the glass box takes
  const cut = 15
  const body = clip(f.ring, f, -46.2 + cut / 2, 20.8 - cut / 2, -1, 1)
  mass(out, body, H, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'blank', material: 'granite', wall: PINK } }],
    roof: [0.5, 0.42, 0.4],
    crown: { kind: 'parapet', height: 0.8, colour: PINK },
  })
  diamonds(out, body, 0.4, H - 0.5, 3.4, 2.9, PALE)
  // the glass corner, and the rotunda drum inside it
  const gx = -46.2
  const gz = 20.8
  const glass: Face = { kind: 'curtain', material: 'metal', wall: [0.62, 0.68, 0.66], glass: [0.62, 0.72, 0.72], pitch: 3.4, floor: 4.6 }
  const corner = [f.at(gx, gz - cut), f.at(gx, gz), f.at(gx + cut, gz)]
  faceBand(out, [corner[0], corner[1]], 0, H - 1.5, glass)
  faceBand(out, [corner[1], corner[2]], 0, H - 1.5, glass)
  const cc = f.at(gx + 8.5, gz - 8.5)
  for (let k = 0; k < 4; k++) {
    prism(out, cc.x, cc.z, 1 + k * 6, 5.4 + k * 6, 7.4, 14, [0.86, 0.8, 0.66], surfaceTag('stucco'), 7.4, false)
    prism(out, cc.x, cc.z, 5.4 + k * 6, 6.2 + k * 6, 7.6, 14, [0.9, 0.72, 0.3], 0.5, 7.6, false)
  }
  capPolygon(out, [f.at(gx, gz - cut), f.at(gx, gz), f.at(gx + cut, gz)], H - 1.5, [0.5, 0.42, 0.4], 0)
  gbox(out, f, gx, gx + cut + 1, gz - 1, gz + 0.6, H - 1.5, H + 0.3, PINK, surfaceTag('granite'))
  gbox(out, f, gx - 1, gx + 0.6, gz - cut - 1, gz + 0.6, H - 1.5, H + 0.3, PINK, surfaceTag('granite'))
  wallText(out, f, 'NEIMAN MARCUS', gx + cut + 13, gz + 0.3, 0, 1, H - 5.5, 1.7, [0.96, 0.96, 0.95], 0.15)
}

/** way/151195286 */
const HALLIDIE_REF = [-15.4, -23.1, 16.6, -23.0, 16.3, 3.2, 16.2, 11.3, 16.2, 14.9, 16.2, 22.5, 13.7, 22.5, 9.1, 22.5, 0.3, 22.4, -4.2, 22.4, -9.2, 22.4, -18.2, 22.2, -18.1, 12.1, -18.0, 8.5, -15.6, 8.5, -15.6, -3.8]

/**
 * The Hallidie Building (1918, Willis Polk), 130–150 Sutter: the first glass curtain wall in America. The whole
 * north front is a thin grid of glass hung a metre in front of the frame, banded by ornate gilt-and-blue cast iron
 * at the third and sixth floors and crowned by an openwork iron cornice with pointed finials; two black-and-gold
 * fire escapes with round balconies run down it. The other three walls are plain painted brick.
 * (Commons: "Hallidie Building in San Francisco dllu.jpg".)
 */
function hallidieBuilding(out: MeshBuilder, fit: Fit): void {
  const f = gridFrame(fit, HALLIDIE_REF, 1, 0)
  const H = fit.height > 20 && fit.height < 45 ? fit.height : 30
  const IRON: Rgb = [0.1, 0.12, 0.16]
  const GOLD: Rgb = [0.72, 0.58, 0.22]
  mass(out, f.ring, H, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'punched', material: 'stucco', wall: [0.72, 0.7, 0.66], glass: [0.2, 0.21, 0.23], pitch: 4, solid: 0.8, floor: 3.9 } }],
    roof: [0.5, 0.49, 0.47],
  })
  const a = f.at(16.2, 22.6)
  const b = f.at(-18.2, 22.5)
  const front = [a, b]
  faceBand(out, front, 0, 4.6, { kind: 'curtain', material: 'metal', wall: [0.12, 0.12, 0.13], glass: [0.17, 0.18, 0.2], pitch: 3.4, floor: 4.6 })
  faceBand(out, front, 4.6, H - 2.4, { kind: 'curtain', material: 'metal', wall: [0.16, 0.17, 0.2], glass: [0.62, 0.72, 0.74], pitch: 1.55, floor: 3.55 })
  // the two gilt iron bands, the cornice, and its finials
  for (const y of [11.5, 22.2]) {
    gbox(out, f, -18.4, 16.4, 22.4, 23.4, y, y + 0.9, GOLD, surfaceTag('metal'))
    gbox(out, f, -18.4, 16.4, 22.4, 23.6, y + 0.9, y + 1.3, IRON, surfaceTag('metal'))
  }
  gbox(out, f, -18.6, 16.6, 22.4, 24.1, H - 2.4, H - 0.4, IRON, surfaceTag('metal'))
  gbox(out, f, -18.6, 16.6, 22.4, 24.1, H - 1.4, H - 0.9, GOLD, surfaceTag('metal'))
  for (let x = -18; x < 16.5; x += 1.7) gbox(out, f, x, x + 0.5, 23.4, 23.9, H - 0.4, H + 0.9, IRON, surfaceTag('metal'))
  // the fire escapes: a ladder each side of the middle, a round balcony a floor
  for (const x of [-12.5, 10.5]) {
    for (let y = 5.2; y < H - 3; y += 3.55) {
      gbox(out, f, x - 1.5, x + 1.5, 23.3, 24.6, y, y + 0.2, IRON, surfaceTag('metal'))
      gbox(out, f, x - 1.5, x + 1.5, 24.5, 24.7, y, y + 1, IRON, surfaceTag('metal'))
      gbox(out, f, x - 0.15, x + 0.15, 23.6, 23.9, y, y + 3.55, IRON, surfaceTag('metal'))
    }
  }
}

/** way/135174113 */
const GUMPS_REF = [13.6, 18.8, -12.4, 18.9, -12.3, 3.2, -14.3, 3.2, -14.4, -18.2, 13.5, -18.2]

/**
 * Gump's (at 250 Post since 1995 and again since 2019), the San Francisco emporium of jade, porcelain and glass:
 * a low cream stone front of four bays with arched first-floor windows, a black shopfront and the gold GUMP'S over
 * the door — a frontage rather than a building, which is what it is on Post Street.
 */
function gumps(out: MeshBuilder, fit: Fit): void {
  const f = gridFrame(fit, GUMPS_REF, 0, -1)
  const H = fit.height > 8 && fit.height < 25 ? fit.height : 13
  const CREAM: Rgb = [0.84, 0.81, 0.73]
  mass(out, f.ring, H, {
    height: H,
    base: { height: 5, face: { kind: 'curtain', material: 'metal', wall: [0.09, 0.09, 0.1], glass: [0.15, 0.16, 0.17], pitch: 3.4, floor: 5 }, canopy: { depth: 0.8, colour: [0.09, 0.09, 0.1] } },
    tiers: [
      { to: H - 1.4, face: { kind: 'punched', material: 'ashlar', wall: CREAM, glass: [0.2, 0.21, 0.23], pitch: 3.6, solid: 0.42, floor: 4.2, arched: true } },
      { to: H, face: { kind: 'blank', material: 'ashlar', wall: CREAM }, cornice: { depth: 0.7, height: 0.7, colour: CREAM } },
    ],
    roof: [0.5, 0.49, 0.47],
  })
  wallText(out, f, "GUMP'S", 0, -18.3, 0, -1, 5.4, 1.1, GOLD_LEAF, 0.1)
}

/** way/147689079 */
const HOTEL_US_REF = [-12.9, -24.5, 5.0, -24.6, 5.1, -11.7, 5.1, 4.7, 7.7, 4.7, 7.7, 8.0, 5.0, 8.0, 5.0, 10.7, 17.8, 10.6, 17.8, 9.3, 24.1, 9.2, 24.1, 10.5, 27.6, 10.4, 27.7, 17.8, -12.7, 18.0]

/**
 * The Hotel Union Square (1913, for the Panama-Pacific visitors), 114 Powell at Ellis: six storeys of dark red
 * brick with white-framed windows in threes, a black-and-gold shopfront band along Powell, and the hotel's name in
 * gold on the corner. Bought its character back in a 1920s Art Deco refit, which the model keeps to the dark brick
 * and the white window frames.
 */
function hotelUnionSquare(out: MeshBuilder, fit: Fit): void {
  const f = gridFrame(fit, HOTEL_US_REF, -1, 0)
  const H = fit.height > 15 && fit.height < 35 ? fit.height : 25
  mass(out, f.ring, H, {
    height: H,
    base: { height: 4.6, face: { kind: 'curtain', material: 'metal', wall: [0.1, 0.1, 0.11], glass: [0.16, 0.17, 0.18], pitch: 3, floor: 4.6 }, canopy: { depth: 1, colour: [0.1, 0.1, 0.11] } },
    tiers: [{ to: 1, face: { kind: 'punched', material: 'brick', wall: [0.48, 0.28, 0.24], glass: [0.85, 0.85, 0.83], pitch: 2.4, solid: 0.45, floor: 3.4 }, cornice: { depth: 0.5, height: 0.6, colour: [0.86, 0.84, 0.8] } }],
    roof: [0.45, 0.42, 0.4],
  })
  wallText(out, f, 'HOTEL UNION SQUARE', -13.4, -3, -1, 0, 5, 0.9, GOLD_LEAF, 0.08)
}

/** way/32863657 */
const MENS_REF = [-35.5, 19.5, -34.8, -20.7, 32.6, -21.0, 32.7, 1.7, 25.7, 1.7, 25.7, 8.3, 42.4, 8.2, 42.5, 20.3, -3.3, 19.6]

/**
 * Macy's Men's Store (1974, as Liberty House), 120 Stockton at O'Farrell: a travertine box, blank for its lower
 * half, its upper floors opened in deep recessed bays behind square piers with pink soffits; "macy's" in small
 * dark letters high on the corner. Closed in 2019, and the second of the two Macy's buildings on the square.
 * (Commons: "Macy's Men's Store (built 1974 as Liberty House) May 2016.jpg".)
 */
function macysMens(out: MeshBuilder, fit: Fit): void {
  const f = gridFrame(fit, MENS_REF, 0, -1)
  const H = fit.height > 20 && fit.height < 45 ? fit.height : 33
  const TRAV: Rgb = [0.82, 0.79, 0.73]
  mass(out, f.ring, H, {
    height: H,
    base: { height: 6, face: { kind: 'curtain', material: 'metal', wall: [0.25, 0.25, 0.26], glass: [0.17, 0.18, 0.19], pitch: 4, floor: 6 }, canopy: { depth: 1.6, colour: TRAV } },
    tiers: [
      { to: H * 0.55, face: { kind: 'blank', material: 'ashlar', wall: TRAV } },
      { to: H - 3.5, face: { kind: 'fins', material: 'ashlar', wall: TRAV, glass: [0.18, 0.19, 0.2], pitch: 7, solid: 0.22, depth: 1.4, floor: 3.4 } },
      { to: H, face: { kind: 'blank', material: 'ashlar', wall: TRAV } },
    ],
    roof: [0.55, 0.53, 0.5],
  })
  wallText(out, f, "MACY'S", 20, -21.1, 0, -1, H - 2.4, 1.2, [0.2, 0.2, 0.21], 0.1)
}

/** way/939466400 */
const MORRIS_REF = [-7.2, -9.3, 7.2, -9.3, 7.2, 9.3, -0.3, 9.3, -7.2, 9.3]

/**
 * The V. C. Morris Gift Shop (1948, Frank Lloyd Wright), 140 Maiden Lane: a blank wall of honey Roman brick with
 * no windows at all, broken only by the great half-round arch of concentric brick rings over the door, and a
 * vertical slit of pierced brick up the left edge. The spiral ramp inside was Wright's trial run for the
 * Guggenheim. (Commons: "Frank Lloyd Wright - V.C. Morris Gift Shop, SF - 2.jpg".)
 */
function vcMorris(out: MeshBuilder, fit: Fit): void {
  const f = gridFrame(fit, MORRIS_REF, 0, -1)
  const H = fit.height > 6 && fit.height < 20 ? fit.height : 11
  const BRICK: Rgb = [0.74, 0.62, 0.44]
  mass(out, f.ring, H, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'blank', material: 'brick', wall: BRICK } }],
    roof: [0.5, 0.46, 0.42],
    crown: { kind: 'parapet', height: 0.5, colour: [0.86, 0.84, 0.8] },
  })
  // the arch: concentric brick rings round a dark opening, on the Maiden Lane front
  const cx = -1.5
  const cz = -9.4
  const seg = 12
  const arcOf = (r0: number, r1: number, c: Rgb, o: number, tag: number): void => {
    for (let k = 0; k < seg; k++) {
      const a0 = (k / seg) * Math.PI
      const a1 = ((k + 1) / seg) * Math.PI
      const P = (a: number, r: number): V3 => { const p = f.at(cx - Math.cos(a) * r, cz - o); return [p.x, 1.2 + Math.sin(a) * r, p.z] }
      const n = f.dir(0, -1)
      out.quad([P(a0, r0), P(a1, r0), P(a1, r1), P(a0, r1)], [n.x, 0, n.z], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
    }
  }
  const arc = (r0: number, r1: number, c: Rgb, o: number): void => arcOf(r0, r1, c, o, surfaceTag('brick'))
  const arcDark = (r0: number, r1: number): void => arcOf(r0, r1, [0.08, 0.08, 0.09], 0.16, surfaceTag('metal'))
  arcDark(0, 3.1)
  arc(3.1, 3.9, [0.78, 0.66, 0.48], 0.3)
  arc(3.9, 4.6, [0.7, 0.58, 0.4], 0.2)
  arc(4.6, 5.2, [0.78, 0.66, 0.48], 0.1)
  gbox(out, f, cx - 3.1, cx + 3.1, cz - 0.2, cz + 0.1, 0, 1.4, [0.08, 0.08, 0.09], surfaceTag('metal'))
  // the pierced brick slit up the left edge
  for (let y = 2; y < H - 1; y += 0.9) gbox(out, f, -6.9, -6.1, cz - 0.12, cz, y, y + 0.45, [0.3, 0.26, 0.2], surfaceTag('brick'))
}

/**
 * The Geary Theater (1909, Bliss & Faville; now the Toni Rembe Theater, home of A.C.T.), 415 Geary: a buff
 * terracotta front in the Italian manner — three tall arched windows between coupled columns over a marquee of
 * three scalloped arches, panels of blue-green glazed ornament between them, a heavy dentilled cornice, and plain
 * brick flanks. (Commons: "San Francisco Geary Theatre.jpg".) A.C.T.'s three tall banners hang between the columns —
 * A on dark blue, C on light blue, T on green, each letter white near the banner's foot (docs/shots/refs/notable/geary).
 */
const gearyTheaterBody = spec({
  height: 23,
  base: { height: 6.5, face: { kind: 'curtain', material: 'metal', wall: [0.35, 0.3, 0.22], glass: [0.5, 0.42, 0.24], pitch: 3.5, floor: 6.5 }, canopy: { depth: 2.2, colour: [0.72, 0.66, 0.52] } },
  tiers: [
    { to: 17.5, face: { kind: 'punched', material: 'terracotta', wall: [0.8, 0.76, 0.66], glass: [0.22, 0.24, 0.26], pitch: 5.2, solid: 0.42, floor: 11, arched: true }, cornice: { depth: 0.5, height: 0.5 } },
    { to: 23, face: { kind: 'punched', material: 'terracotta', wall: [0.8, 0.76, 0.66], glass: [0.4, 0.44, 0.4], pitch: 5.2, solid: 0.75, floor: 5.5 }, cornice: { depth: 1.3, height: 1.2 } },
  ],
  roof: [0.5, 0.48, 0.44],
})

function gearyTheater(out: MeshBuilder, fit: Fit): void {
  gearyTheaterBody(out, fit)
  // the street face: of the edges over 4 m, the one whose middle lies furthest toward −z
  const r = towerRing(fit)
  let fi = 0, lowest = Infinity
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length]
    if (Math.hypot(b.x - a.x, b.z - a.z) > 4 && (a.z + b.z) / 2 < lowest) { lowest = (a.z + b.z) / 2; fi = i }
  }
  const a = r[fi], b = r[(fi + 1) % r.length], L = Math.hypot(b.x - a.x, b.z - a.z)
  const tz = (b.z - a.z) / L, tx = (b.x - a.x) / L
  // the outward normal of this edge, whichever way the ring winds: away from the centre
  const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2
  let nx = tz, nz = -tx
  if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz }
  const h = Math.atan2(nx, nz)
  // across the face from the viewer's left to right
  const rx = -nz, rz = nx
  const banners: [number, string, Rgb][] = [[-0.2, 'A', [0.1, 0.17, 0.45]], [-0.05, 'C', [0.36, 0.58, 0.82]], [0.13, 'T', [0.45, 0.6, 0.22]]]
  for (const [f, letter, col] of banners) {
    const x = mx + rx * f * L + nx * 0.5, z = mz + rz * f * L + nz * 0.5
    boxAlong(out, x, 11.8, z, 0.6, 3.3, 0.02, h, col, 0)
    sign(out, { type: 'flat', text: letter, h: 0.9, face: 'grotesque', weight: 'bold', colour: [0.97, 0.97, 0.95], lit: 'none' },
      { x: x + nx * 0.04, y: 9.4, z: z + nz * 0.04, heading: h })
  }
}

/**
 * The Kensington Park Hotel (1924, as the Elks Club), 450 Post: fourteen storeys of buff brick and terracotta in
 * the Gothic manner — tall pointed windows with tracery over a richly carved two-storey base, narrow piers running
 * up the shaft, and a pierced parapet. (Commons: "San Francisco Playhouse at 450 Post Street.jpg".)
 */
const kensingtonPark = spec({
  height: 54,
  base: { height: 11, face: { kind: 'punched', material: 'terracotta', wall: [0.82, 0.76, 0.62], glass: [0.2, 0.19, 0.18], pitch: 4.4, solid: 0.35, floor: 5.5, arched: true }, canopy: { depth: 1.2, colour: [0.35, 0.3, 0.2] } },
  tiers: [
    { to: 0.93, face: { kind: 'fins', material: 'brick', wall: [0.76, 0.68, 0.53], glass: [0.24, 0.25, 0.26], pitch: 2.4, solid: 0.42, depth: 0.25, floor: 3.3 } },
    { to: 1, face: { kind: 'punched', material: 'terracotta', wall: [0.82, 0.76, 0.62], glass: [0.26, 0.26, 0.26], pitch: 2.4, solid: 0.55, floor: 3.6, arched: true }, cornice: { depth: 0.8, height: 0.9 } },
  ],
  roof: [0.5, 0.47, 0.42],
})

/**
 * The Medico-Dental Building (1925), 490 Post at Mason: fifteen storeys of pale grey terracotta for the city's
 * doctors and dentists, its piers running unbroken up the shaft, a moulded band at the third floor and a plain
 * parapet — the model is the type rather than a close likeness (no good photograph came to hand).
 */
const medicoDental = spec({
  height: 51,
  base: { height: 9, face: { kind: 'punched', material: 'terracotta', wall: [0.8, 0.78, 0.73], glass: [0.2, 0.2, 0.2], pitch: 3.8, solid: 0.4, floor: 4.5 } },
  tiers: [
    { to: 0.94, face: { kind: 'fins', material: 'terracotta', wall: [0.82, 0.8, 0.75], glass: [0.26, 0.27, 0.29], pitch: 2.5, solid: 0.45, depth: 0.22, floor: 3.2 } },
    { to: 1, face: { kind: 'punched', material: 'terracotta', wall: [0.82, 0.8, 0.75], glass: [0.26, 0.27, 0.29], pitch: 2.5, solid: 0.55, floor: 3.4 }, cornice: { depth: 0.9, height: 1 } },
  ],
  roof: [0.52, 0.5, 0.48],
})

/**
 * The Donatello (1971), 501 Post at Mason: a grey concrete hotel whose walls are ribbed by fluted piers from the
 * street to the cornice, with a ring cut in the top of each pier under the deep flat cornice; the windows are dark
 * slots between them. (Commons: "Donatello Hotel, San Francisco.jpg".)
 */
const donatello = spec({
  height: 45,
  base: { height: 5, face: { kind: 'curtain', material: 'metal', wall: [0.35, 0.35, 0.36], glass: [0.18, 0.19, 0.2], pitch: 3.2, floor: 5 } },
  tiers: [
    { to: 0.95, face: { kind: 'fins', material: 'concrete', wall: [0.72, 0.71, 0.67], glass: [0.2, 0.21, 0.22], pitch: 2.1, solid: 0.5, depth: 0.3, floor: 3.2 } },
    { to: 1, face: { kind: 'punched', material: 'concrete', wall: [0.74, 0.73, 0.69], glass: [0.3, 0.3, 0.3], pitch: 2.1, solid: 0.62, floor: 2.4 }, cornice: { depth: 1.1, height: 0.9 } },
  ],
  roof: [0.5, 0.5, 0.48],
})

/**
 * Hotel G (1908), 386 Geary at Mason: thirteen storeys of red-brown brick with white-framed sash windows in
 * threes, a painted band at the second floor and a simple cornice — one of the small hotels thrown up after the
 * fire, done here as its type.
 */
const hotelG = spec({
  height: 47,
  base: { height: 5, face: { kind: 'curtain', material: 'metal', wall: [0.14, 0.14, 0.15], glass: [0.17, 0.18, 0.19], pitch: 3, floor: 5 }, canopy: { depth: 1, colour: [0.14, 0.14, 0.15] } },
  tiers: [{ to: 1, face: { kind: 'punched', material: 'brick', wall: [0.52, 0.34, 0.28], glass: [0.82, 0.82, 0.8], pitch: 2.4, solid: 0.45, floor: 3.2 }, cornice: { depth: 0.6, height: 0.7, colour: [0.85, 0.83, 0.78] } }],
  roof: [0.45, 0.42, 0.4],
})

/**
 * The Native Sons Building (1911), 414 Mason: the Native Sons of the Golden West's hall — white glazed terracotta,
 * a great arched entrance under a bracketed hood, arched windows at the top floor and a bold cornice.
 */
const nativeSons = spec({
  height: 37,
  base: { height: 9, face: { kind: 'punched', material: 'terracotta', wall: [0.88, 0.87, 0.83], glass: [0.2, 0.19, 0.18], pitch: 4.6, solid: 0.4, floor: 9, arched: true }, canopy: { depth: 1.1, colour: [0.86, 0.85, 0.8] } },
  tiers: [
    { to: 0.88, face: { kind: 'punched', material: 'terracotta', wall: [0.88, 0.87, 0.83], glass: [0.24, 0.25, 0.26], pitch: 2.8, solid: 0.45, floor: 3.6 }, cornice: { depth: 0.4, height: 0.5 } },
    { to: 1, face: { kind: 'punched', material: 'terracotta', wall: [0.88, 0.87, 0.83], glass: [0.24, 0.25, 0.26], pitch: 2.8, solid: 0.5, floor: 3.8, arched: true }, cornice: { depth: 1.2, height: 1.1 } },
  ],
  roof: [0.55, 0.54, 0.52],
})

/**
 * The Elkan Gunst Building (1908), 301 Geary at Powell: a white glazed-terracotta Chicago-school block on the
 * corner opposite the square — wide windows between slim piers, a heavy cornice, shops all along the ground floor.
 */
const elkanGunst = spec({
  height: 33,
  base: { height: 5.5, face: { kind: 'curtain', material: 'metal', wall: [0.2, 0.2, 0.2], glass: [0.18, 0.2, 0.22], pitch: 3.2, floor: 5.5 }, canopy: { depth: 1.2, colour: [0.2, 0.2, 0.2] } },
  tiers: [
    { to: 0.9, face: { kind: 'punched', material: 'terracotta', wall: [0.87, 0.86, 0.82], glass: [0.24, 0.26, 0.28], pitch: 3.2, solid: 0.35, floor: 3.7 } },
    { to: 1, face: { kind: 'punched', material: 'terracotta', wall: [0.87, 0.86, 0.82], glass: [0.24, 0.26, 0.28], pitch: 3.2, solid: 0.5, floor: 3.4 }, cornice: { depth: 1.3, height: 1.1 } },
  ],
  roof: [0.55, 0.54, 0.5],
})

/**
 * The Sutter-Stockton Garage (1960), 444 Stockton: ten decks of bare concrete, the ramps' sloping bands showing
 * through the open sides, a blank stair core at each end — the biggest thing on the block and the least dressed.
 */
const sutterStocktonGarage = spec({
  height: 30,
  base: { height: 4.5, face: { kind: 'curtain', material: 'concrete', wall: [0.62, 0.62, 0.6], glass: [0.16, 0.17, 0.18], pitch: 6, floor: 4.5 } },
  tiers: [{ to: 1, face: { kind: 'bands', material: 'concrete', wall: [0.68, 0.68, 0.65], glass: [0.12, 0.13, 0.14], solid: 0.42, floor: 2.8 } }],
  roof: [0.6, 0.6, 0.58],
  crown: { kind: 'parapet', height: 1, colour: [0.68, 0.68, 0.65] },
  penthouse: 1,
})

/**
 * Taj Campton Place (1907, much rebuilt), 340 Stockton: a quiet ten-storey hotel of pale buff brick with tall
 * white-framed windows, a stone base and a slim cornice — the type of the small Stockton Street hotel.
 */
const camptonPlace = spec({
  height: 33,
  base: { height: 6, face: { kind: 'punched', material: 'ashlar', wall: [0.8, 0.78, 0.72], glass: [0.2, 0.2, 0.2], pitch: 3.4, solid: 0.4, floor: 6 }, canopy: { depth: 1.4, colour: [0.25, 0.22, 0.2] } },
  tiers: [{ to: 1, face: { kind: 'punched', material: 'brick', wall: [0.78, 0.72, 0.6], glass: [0.8, 0.8, 0.78], pitch: 2.6, solid: 0.5, floor: 3.2 }, cornice: { depth: 0.7, height: 0.7, colour: [0.85, 0.83, 0.78] } }],
  roof: [0.5, 0.48, 0.45],
})

/**
 * The Marines' Memorial Club (1926, as the Western Women's Club), 609 Sutter at Mason: twelve storeys of buff
 * brick over a stone base, the windows paired between piers, a corbelled band near the top and a flat parapet.
 */
const marinesMemorial = spec({
  height: 64,
  base: { height: 10, face: { kind: 'punched', material: 'ashlar', wall: [0.82, 0.79, 0.72], glass: [0.2, 0.2, 0.2], pitch: 3.6, solid: 0.42, floor: 5 } },
  tiers: [
    { to: 0.92, face: { kind: 'punched', material: 'brick', wall: [0.75, 0.67, 0.53], glass: [0.24, 0.25, 0.26], pitch: 2.5, solid: 0.5, floor: 3.3 }, cornice: { depth: 0.4, height: 0.5, colour: [0.84, 0.8, 0.72] } },
    { to: 1, face: { kind: 'punched', material: 'terracotta', wall: [0.84, 0.8, 0.72], glass: [0.24, 0.25, 0.26], pitch: 2.5, solid: 0.55, floor: 3.3, arched: true }, cornice: { depth: 0.9, height: 0.9 } },
  ],
  roof: [0.5, 0.47, 0.43],
})

/**
 * The I. Magnin & Co. Building (1905, rebuilt 1908), Grant at Geary: the couturier's first store — white glazed
 * terracotta, eight storeys, the windows in threes between piers, a deep bracketed cornice.
 */
const iMagninGrant = spec({
  height: 43,
  base: { height: 8, face: { kind: 'curtain', material: 'metal', wall: [0.18, 0.18, 0.19], glass: [0.2, 0.22, 0.24], pitch: 3.4, floor: 4 } },
  tiers: [
    { to: 0.9, face: { kind: 'punched', material: 'terracotta', wall: [0.88, 0.87, 0.84], glass: [0.24, 0.25, 0.27], pitch: 2.8, solid: 0.42, floor: 4 } },
    { to: 1, face: { kind: 'punched', material: 'terracotta', wall: [0.88, 0.87, 0.84], glass: [0.24, 0.25, 0.27], pitch: 2.8, solid: 0.5, floor: 3.8, arched: true }, cornice: { depth: 1.4, height: 1.2 } },
  ],
  roof: [0.55, 0.54, 0.52],
})

/** A flat panel of ground in the grid frame (paving band, lawn panel): one upward quad, nothing more. */
function gslab(out: MeshBuilder, f: Frame, x0: number, x1: number, z0: number, z1: number, y: number, c: Rgb, tag = 0): void {
  const P = (x: number, z: number): V3 => { const p = f.at(x, z); return [p.x, y, p.z] }
  out.quad([P(x0, z0), P(x1, z0), P(x1, z1), P(x0, z1)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
}

/**
 * Union Square (laid out 1850; rebuilt over its garage in 2002 by April Philips and Michael Fotheringham).
 *
 * What the model has to get right, from the photographs (Commons: "2015 Union Square, San Francisco.jpg" — the
 * column from the paved deck, the maroon lamp standards with their steel globes, the café pavilion and the
 * amphitheatre steps; "2017 Union Square San Francisco 1.jpg" — the banded granite paving, the broad stair with
 * its steel handrails, the trellised pavilion): the square is a GRANITE DECK on the roof of its garage, about
 * 1.5 m over the four streets, not a park at grade. Powell (−x) and Geary (−z) fall to the street in broad
 * flights; Stockton (+x) and Post (+z) are held by a low granite wall with narrow stair cuts; the garage's
 * vehicle ramps go down at two opposite corners. The middle is hard paving — an amphitheatre for the buskers and
 * the art fair — with the lawn as flat panels at the Post and Geary ends, and the Dewey Monument (1903, Robert
 * Aitken and Newton Tharp) on its stepped pedestal in the centre.
 *
 * The figure on the column is DELIBERATELY PLAIN: Victory is priority 1 in MODELS_NEEDED.md and gets a real model
 * from the user; this is only a bronze mass so the column is not bare. And nothing grows here — the vegetation
 * layer plants the square (docs/BUILDINGS.md, "Never plant anything"); the lawn is flat coloured ground.
 *
 * Grid frame: +x east to Stockton, −x west to Powell, +z north to Post, −z south to Geary.
 */
function unionSquarePlaza(out: MeshBuilder, fit: Fit): void {
  const hx = Math.min(72, Math.max(42, fit.hx || 60))
  const hz = Math.min(50, Math.max(28, fit.hz || 39))
  const f = ownFrame([{ x: -hx, z: -hz }, { x: hx, z: -hz }, { x: hx, z: hz }, { x: -hx, z: hz }])
  const GRAN = surfaceTag('granite')
  const CONC = surfaceTag('concrete')
  const MET = surfaceTag('metal')
  const GLS = surfaceTag('glass')
  // (the paving is mostly UP faces, lit by sky and full sun at once — about 1.8× — so pale greys clipped to pure white
  //  and the lawn to lime at rider height, 2026-10-05; set darker than the granite looks, the light brings them up)
  const DARK: Rgb = [0.36, 0.36, 0.35]
  const MID: Rgb = [0.48, 0.47, 0.45]
  const PALE: Rgb = [0.6, 0.58, 0.55]
  const LAWN: Rgb = [0.23, 0.33, 0.17]
  const MAROON: Rgb = [0.33, 0.16, 0.14]
  const STEEL: Rgb = [0.86, 0.87, 0.89]
  const STONE: Rgb = [0.88, 0.86, 0.82]
  const deck = 1.5
  // the deck over the garage: back from Powell and Geary to leave room for their flights, close to Stockton and Post
  const xW = -hx + 7
  const xE = hx - 2.5
  const zS = -hz + 7
  const zN = hz - 2.5
  gbox(out, f, xW, xE, zS, zN, -0.4, deck, MID, GRAN)

  // the paving: bands of pale and dark granite across the deck, and the wide pale spine down the middle
  for (let x = xW; x < xE; x += 5.5) {
    gslab(out, f, x, Math.min(x + 5.5, xE), zS, zN, deck + 0.04, (Math.round((x - xW) / 5.5) % 2 ? MID : DARK), GRAN)
  }
  gslab(out, f, xW, xE, -6.5, 6.5, deck + 0.08, PALE, GRAN)
  gslab(out, f, -7.5, 7.5, zS, zN, deck + 0.08, PALE, GRAN)

  // the lawn panels at the Post and Geary ends: flat coloured ground, nothing planted on them
  gslab(out, f, -30, 30, zN - 18, zN - 6, deck + 0.12, LAWN)
  gslab(out, f, -30, 30, zS + 6, zS + 18, deck + 0.12, LAWN)

  // the broad flight down to Powell, and the one down to Geary: four granite treads, nested back to the deck
  // (each tread its own block, front to the next tread's front — nested back to the deck, all four shared their cheeks
  // and z-fought in alternating colours down both flights, 2026-10-03)
  for (let i = 0; i < 4; i++) {
    const y = (i + 1) * (deck / 4)
    gbox(out, f, -hx + 1 + i * 1.5, i === 3 ? xW : -hx + 1 + (i + 1) * 1.5, zS + 9, zN - 9, -0.3, y, i % 2 ? PALE : MID, GRAN)
    gbox(out, f, xW + 12, xE - 12, -hz + 1 + i * 1.5, i === 3 ? zS : -hz + 1 + (i + 1) * 1.5, -0.3, y, i % 2 ? PALE : MID, GRAN)
  }
  // their cheek walls, and the steel handrails that split the Geary flight
  for (const z of [zS + 9, zN - 9]) gbox(out, f, -hx + 1, xW + 0.6, z - 0.55, z + 0.55, -0.3, deck + 0.75, DARK, GRAN)
  for (const x of [xW + 12, xE - 12]) gbox(out, f, x - 0.55, x + 0.55, -hz + 1, zS + 0.6, -0.3, deck + 0.75, DARK, GRAN)
  for (const x of [-18, 6]) gstrut(out, f, [x, deck + 1.0, zS + 0.4], [x, 0.95, -hz + 1.4], 0.05, 0.05, STEEL)
  for (const z of [-12, 12]) gstrut(out, f, [xW + 0.4, deck + 1.0, z], [-hx + 1.4, 0.95, z], 0.05, 0.05, STEEL)

  // Stockton and Post: the low granite wall along the deck's edge, cut by a narrow stair at two places each
  const cutsX = [-22, 20]
  const cutsZ = [-16, 16]
  for (const [a, b] of [[zS, cutsZ[0] - 4], [cutsZ[0] + 4, cutsZ[1] - 4], [cutsZ[1] + 4, zN]] as [number, number][]) {
    if (b > a) gbox(out, f, xE - 0.7, xE, a, b, deck, deck + 0.55, PALE, GRAN)
  }
  for (const [a, b] of [[xW, cutsX[0] - 4], [cutsX[0] + 4, cutsX[1] - 4], [cutsX[1] + 4, xE]] as [number, number][]) {
    if (b > a) gbox(out, f, a, b, zN - 0.7, zN, deck, deck + 0.55, PALE, GRAN)
  }
  for (let i = 0; i < 3; i++) {
    const y = (i + 1) * (deck / 3)
    for (const z of cutsZ) gbox(out, f, i === 2 ? xE : hx - 0.4 - (i + 1) * 0.7, hx - 0.4 - i * 0.7, z - 3.6, z + 3.6, -0.3, y, i % 2 ? MID : PALE, GRAN)
    for (const x of cutsX) gbox(out, f, x - 3.6, x + 3.6, i === 2 ? zN : hz - 0.4 - (i + 1) * 0.7, hz - 0.4 - i * 0.7, -0.3, y, i % 2 ? MID : PALE, GRAN)
  }

  /*
   * The garage: a vehicle entrance at two opposite corners (Geary–Powell, Post–Stockton), each a dark portal in
   * the deck's flank with its ramp sloping down to it between concrete parapets. Most of the ramp is below the
   * street and the city's ground covers it; what a rider sees is the portal, the parapets and the dark mouth.
   */
  for (const s of [-1, 1]) {
    const zEdge = s > 0 ? zN : zS
    const zOut = s > 0 ? hz - 0.5 : -hz + 0.5
    const x0 = s > 0 ? 40 : -50
    const x1 = s > 0 ? 50 : -40
    gbox(out, f, x0 + 0.6, x1 - 0.6, Math.min(zEdge, zEdge + s * 0.7), Math.max(zEdge, zEdge + s * 0.7), -0.4, 1.45, [0.07, 0.07, 0.08], CONC)
    for (const x of [x0, x1]) gbox(out, f, x - 0.5, x + 0.5, Math.min(zEdge, zOut), Math.max(zEdge, zOut), -0.6, 0.95, [0.58, 0.58, 0.57], CONC)
    const P = (x: number, y: number, z: number): V3 => { const p = f.at(x, z); return [p.x, y, p.z] }
    const q: V3[] = [P(x0 + 0.5, 0, zOut), P(x1 - 0.5, 0, zOut), P(x1 - 0.5, -3.2, zEdge), P(x0 + 0.5, -3.2, zEdge)]
    out.quad((s > 0 ? [q[3], q[2], q[1], q[0]] : q) as V3[], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.22, 0.22, 0.23], CONC)
  }

  // the Dewey Monument: the stepped base, the pedestal, the granite shaft, its Corinthian capital
  for (let i = 0; i < 3; i++) {
    const w = 6.6 - i * 0.95
    gbox(out, f, -w, w, -w, w, deck + i * 0.4, deck + (i + 1) * 0.4, STONE, GRAN)
  }
  gbox(out, f, -3.2, 3.2, -3.2, 3.2, deck + 1.2, deck + 4.6, STONE, GRAN)
  gbox(out, f, -3.7, 3.7, -3.7, 3.7, deck + 4.6, deck + 5.2, STONE, GRAN)
  gcol(out, f, 0, 0, deck + 5.2, deck + 23.2, 1.3, STONE, 24, 1.14, GRAN)
  gcol(out, f, 0, 0, deck + 23.2, deck + 24.7, 1.16, STONE, 16, 2.0, GRAN)         // the capital's bell
  gbox(out, f, -2.1, 2.1, -2.1, 2.1, deck + 24.7, deck + 25.3, STONE, GRAN)        // the abacus
  // (Victory herself, on her globe, is the assetkit model `dewey-victory`, placed on the abacus by
  //  public/landmarks/san-francisco-statues.json — attach to Union Square at [0, deck + 25.3, 0], 2026-10-18)

  // the two glass café pavilions, at opposite corners, each under its metal trellis
  for (const s of [-1, 1]) {
    const cx = s * (hx - 16)
    const cz = s * (hz - 13)
    gbox(out, f, cx - 6.5, cx + 6.5, cz - 4.5, cz + 4.5, deck, deck + 3.6, [0.42, 0.52, 0.56], GLS)
    gbox(out, f, cx - 6.9, cx + 6.9, cz - 4.9, cz + 4.9, deck + 3.6, deck + 4.1, [0.22, 0.22, 0.23], MET)
    for (const dx of [-6.9, 6.9]) for (const dz of [-4.9, 4.9]) gcol(out, f, cx + dx, cz + dz, deck, deck + 4.1, 0.16, [0.22, 0.22, 0.23], 6, 0.16, MET)
    // the trellis out over the tables, on its posts
    const tz = cz - s * 8.5
    gbox(out, f, cx - 6.9, cx + 6.9, Math.min(cz, tz) - 0.2, Math.max(cz, tz) + 0.2, deck + 4.0, deck + 4.16, [0.26, 0.26, 0.27], MET)
    for (const dx of [-6.4, 0, 6.4]) gcol(out, f, cx + dx, tz, deck, deck + 4.0, 0.14, [0.22, 0.22, 0.23], 6, 0.14, MET)
  }

  // the stage terrace on the Powell side, two steps up off the plaza
  for (let i = 0; i < 2; i++) gbox(out, f, xW + 3 - i * 0.9, xW + 17 + i * 0.9, -8 - i * 0.9, 8 + i * 0.9, deck, deck + 0.55 - i * 0.25, i ? MID : DARK, GRAN)
  // and the seating bank in the Geary–Stockton corner, stepping up away from the plaza
  for (let i = 0; i < 4; i++) gbox(out, f, 30, 50, zS + 3, zS + 14 - i * 2.4, deck, deck + 0.45 * (i + 1), i % 2 ? MID : DARK, GRAN)

  // the granite benches down both sides of the spine, the bollards along the top of the two flights
  for (const z of [-10.5, 10.5]) for (let x = -26; x <= 26; x += 10.5) gbox(out, f, x - 1.2, x + 1.2, z - 0.28, z + 0.28, deck, deck + 0.46, PALE, GRAN)
  for (let z = zS + 10; z <= zN - 10; z += 6) gcol(out, f, xW + 0.9, z, deck, deck + 0.85, 0.17, [0.2, 0.2, 0.21], 8, 0.15, MET)
  for (let x = xW + 13; x <= xE - 13; x += 6) gcol(out, f, x, zS + 0.9, deck, deck + 0.85, 0.17, [0.2, 0.2, 0.21], 8, 0.15, MET)

  // the flag poles by the Post lawn
  for (const x of [-13, 0, 13]) {
    gbox(out, f, x - 0.7, x + 0.7, zN - 4.3, zN - 2.9, deck, deck + 0.5, PALE, GRAN)
    gcol(out, f, x, zN - 3.6, deck + 0.5, deck + 16, 0.16, [0.9, 0.9, 0.89], 8, 0.09, MET)
  }

  /*
   * The lamp standards round the deck: a maroon cast shaft carrying a steel globe, the square's own light
   * (Commons "2015 Union Square, San Francisco.jpg"). Lit after dark.
   */
  const lamps: [number, number][] = []
  for (let z = zS + 7; z <= zN - 7; z += 13) lamps.push([xW + 2.5, z], [xE - 2.5, z])
  for (let x = xW + 14; x <= xE - 14; x += 15) lamps.push([x, zS + 2.5], [x, zN - 2.5])
  for (const [x, z] of lamps) {
    gcol(out, f, x, z, deck, deck + 0.35, 0.34, MAROON, 8, 0.26, MET)
    gcol(out, f, x, z, deck + 0.35, deck + 4.3, 0.22, MAROON, 8, 0.17, MET)
    gcol(out, f, x, z, deck + 4.3, deck + 4.72, 0.18, STEEL, 12, 0.46, MET)
    gcol(out, f, x, z, deck + 4.72, deck + 5.14, 0.46, STEEL, 12, 0.18, MET)
    gcol(out, f, x, z, deck + 4.6, deck + 4.84, 0.48, [1, 0.93, 0.76], 12, 0.48, EMIT)
  }
}

/**
 * The Westin St. Francis TOWER (1972, William Pereira; OSM part way/435582543, 120 m), behind the old hotel on Post
 * Street (owner, 2026-10-03: "a unique old building with then a unique modernist building behind it. look at commons
 * images"; Commons "Westin St Francis, San Francisco 2023-07-13.jpg", "Union Square and the Westin seen from Macy's"):
 * a slab of taupe precast in a close grid of punched windows; down the middle of its long faces a full-height slot of
 * dark glass — the outside glass lifts the tower is known for, cars riding up and down in it; at the top a crown of
 * tan, finned storeys under a projecting cap. Was a pale banded preset (ring-tower.ts).
 */
function westinTower(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = fit.height > 90 && fit.height < 150 ? fit.height : 120
  const TAUPE: Rgb = [0.5, 0.47, 0.42]
  const TAN: Rgb = [0.62, 0.56, 0.45]
  tower(out, fit, {
    height: H,
    base: { height: 9, face: { kind: 'curtain', material: 'granite', wall: [0.36, 0.33, 0.3], glass: [0.18, 0.2, 0.22], pitch: 3.2, floor: 4.5 } },
    tiers: [
      // (horizontal BANDS of dark glass between taupe spandrels, as the photographs show it from Union Square — the
      //  punched grid read as an ordinary office block; 2026-10-05)
      { to: H - 12, face: { kind: 'bands', material: 'concrete', wall: TAUPE, glass: [0.13, 0.14, 0.16], floor: 3.2, solid: 0.5 } },
      { to: H - 1.8, face: { kind: 'fins', material: 'concrete', wall: TAN, glass: [0.2, 0.2, 0.2], pitch: 1.5, solid: 0.45, depth: 0.5, floor: 3.4 } },
      { to: H, face: { kind: 'blank', material: 'concrete', wall: TAN }, cornice: { depth: 1.2, height: 0.9, colour: TAN } },
    ],
    roof: [0.42, 0.42, 0.42],
  })
  // the rounded corner piers, full height in the precast, the bands running into them
  for (const p of ring) prism(out, p.x, p.z, 9, H - 1.8, 2.2, 10, TAUPE, surfaceTag('concrete'))
  // the glass lifts: a slot of dark glass standing out of the middle of each long face, base to crown, a cab or two in it
  const es = ring.map((a, i) => { const b = ring[(i + 1) % ring.length]; const L = Math.hypot(b.x - a.x, b.z - a.z); return { a, b, L } })
  const longest = Math.max(...es.map((e) => e.L))
  for (const e of es) {
    if (e.L < longest * 0.75) continue
    const tx = (e.b.x - e.a.x) / e.L, tz = (e.b.z - e.a.z) / e.L
    const nx = tz, nz = -tx
    const mx = (e.a.x + e.b.x) / 2, mz = (e.a.z + e.b.z) / 2
    const w = 3.2, d = 1.4
    const P = (u: number, v: number, y: number): [number, number, number] => [mx + tx * u + nx * v, y, mz + tz * u + nz * v]
    const y0 = 9, y1 = H - 12
    const GL: Rgb = [0.1, 0.13, 0.17]
    out.quad([P(-w, d, y0), P(w, d, y0), P(w, d, y1), P(-w, d, y1)], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], GL, surfaceTag('glass'))
    for (const sgn of [-1, 1]) out.quad([P(sgn * w, 0, y0), P(sgn * w, d, y0), P(sgn * w, d, y1), P(sgn * w, 0, y1)], [tx * sgn, 0, tz * sgn], [[0, 0], [1, 0], [1, 1], [0, 1]], GL, surfaceTag('glass'))
    // two lift cabs, lit, at different heights
    for (const [u, y] of [[-1.4, H * 0.3], [1.4, H * 0.62]]) {
      out.quad([P(u - 1, d + 0.02, y), P(u + 1, d + 0.02, y), P(u + 1, d + 0.02, y + 2.6), P(u - 1, d + 0.02, y + 2.6)], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.95, 0.85, 0.6], EMIT)
    }
  }
}

export const UNION_SQUARE: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  westinStFrancis,
  westinTower,
  macys,
  fourFiftySutter,
  grandHyatt,
  marriottUnionSquare,
  hotelNikko,
  beaconGrand,
  jwMarriott,
  chancellorHotel,
  saks,
  tiffany,
  appleUnionSquare,
  neimanMarcus,
  hallidieBuilding,
  gumps,
  hotelUnionSquare,
  macysMens,
  vcMorris,
  gearyTheater,
  kensingtonPark,
  medicoDental,
  donatello,
  hotelG,
  nativeSons,
  elkanGunst,
  sutterStocktonGarage,
  camptonPlace,
  marinesMemorial,
  iMagninGrant,
  unionSquarePlaza,
}
