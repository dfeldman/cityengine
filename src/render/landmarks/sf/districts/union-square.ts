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
import { prism, strut, type Rgb } from '../../../models.ts'
import { palm } from '../../../palms.ts'
import { surfaceTag, type Surface } from '../../../cartoon-material.ts'

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
 * Two things make this more than a fit. The city does NOT hand a landmark its footprint unless the entry is a
 * `court` one (landmarks.ts sets `fit.ring` only there), so in the game the ring is the fitted BOX, and a box
 * matches a rectangular building equally well four ways round. And `front: "street"` turns the model so that its
 * local −z faces the frontage the bake found (the longest wall with a carriageway in front of it). So where the
 * turns tie, the one that lays the building's own street front (`fx, fz` in the grid frame, worked out from the
 * OSM footprint and the streets round it) against local −z is the one the city means.
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
  const near = minima.filter((m) => m.s < bestS + 0.35)
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
// block letters, for the store names (Macy's, Saks, Tiffany…): a 5×7 bitmap, each row's runs one box

const GLYPHS: Record<string, string> = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01111 10000 10000 10000 10000 10000 01111', D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01111 10000 10000 10011 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
  I: '11111 00100 00100 00100 00100 00100 11111', J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 11001 10101 10011 10001 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
  "'": '00100 00100 01000 00000 00000 00000 00000', '&': '01100 10010 10100 01000 10101 10010 01101',
  '*': '00100 10101 01110 11111 01110 10101 00100', '.': '00000 00000 00000 00000 00000 00000 00100',
  '0': '01110 10011 10101 10101 10101 11001 01110', '1': '00100 01100 00100 00100 00100 00100 01110',
  '4': '00010 00110 01010 10010 11111 00010 00010', '5': '11111 10000 11110 00001 00001 10001 01110',
  ' ': '00000 00000 00000 00000 00000 00000 00000',
}

/**
 * Words in block letters on a wall: from the grid-frame point (x, z) along (ux, uz), standing `out` metres proud
 * along the wall's outward normal (nx, nz), letters `h` tall with their foot at y. `vertical` stacks them (a blade).
 */
function letters(out: MeshBuilder, f: Frame, text: string, x: number, z: number, ux: number, uz: number, nx: number, nz: number,
                 y: number, h: number, c: Rgb, vertical = false, depth = 0.25): void {
  const px = h / 7
  const adv = vertical ? h * 1.25 : px * 6
  const P = (u: number, yy: number, o: number): V3 => { const p = f.at(x + ux * u + nx * o, z + uz * u + nz * o); return [p.x, yy, p.z] }
  const n = f.dir(nx, nz)
  const t = f.dir(ux, uz)
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const plate = (u0: number, u1: number, y0: number, y1: number): void => {
    out.quad([P(u0, y0, depth), P(u1, y0, depth), P(u1, y1, depth), P(u0, y1, depth)], [n.x, 0, n.z], uv, c, 0)
    if (depth <= 0.08) return   // flat: painted on (one quad a run)
    out.quad([P(u0, y1, 0), P(u1, y1, 0), P(u1, y1, depth), P(u0, y1, depth)], [0, 1, 0], uv, c, 0)
    out.quad([P(u0, y0, 0), P(u0, y0, depth), P(u0, y1, depth), P(u0, y1, 0)], [-t.x, 0, -t.z], uv, c, 0)
    out.quad([P(u1, y0, depth), P(u1, y0, 0), P(u1, y1, 0), P(u1, y1, depth)], [t.x, 0, t.z], uv, c, 0)
  }
  const chars = [...text.toUpperCase()]
  chars.forEach((ch, k) => {
    const g = GLYPHS[ch] ?? GLYPHS[' ']
    const rows = g.split(' ')
    const u0 = vertical ? -px * 2.5 : k * adv
    const yTop = vertical ? y + (chars.length - k) * adv : y + h
    rows.forEach((row, r) => {
      let run = -1
      for (let i = 0; i <= 5; i++) {
        const on = i < 5 && row[i] === '1'
        if (on && run < 0) run = i
        if (!on && run >= 0) { plate(u0 + run * px, u0 + i * px, yTop - (r + 1) * px, yTop - r * px); run = -1 }
      }
    })
  })
}

/** How wide `letters` draws a word h tall. */
const lettersWidth = (text: string, h: number): number => (h / 7) * (6 * text.length - 1)

/** A word centred on the grid-frame point (cx, cz) of a wall facing (nx, nz), reading left to right from outside. */
function wallText(out: MeshBuilder, f: Frame, text: string, cx: number, cz: number, nx: number, nz: number, y: number, h: number, c: Rgb, depth = 0.25): void {
  const ux = -nz
  const uz = nx
  const w = lettersWidth(text, h)
  letters(out, f, text, cx - ux * w / 2, cz - uz * w / 2, ux, uz, nx, nz, y, h, c, false, depth)
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

/** Another builder's mesh copied in at a point, in one colour (the palms, which are built white to be tinted). */
function mergeInto(out: MeshBuilder, mb: MeshBuilder, x: number, y: number, z: number, c: Rgb, tag: number): void {
  const base = out.positions.length / 3
  for (let i = 0; i < mb.positions.length; i += 3) {
    out.positions.push(mb.positions[i] + x, mb.positions[i + 1] + y, mb.positions[i + 2] + z)
    out.normals.push(mb.normals[i], mb.normals[i + 1], mb.normals[i + 2])
    out.colors.push(c[0], c[1], c[2], tag)
  }
  for (let i = 0; i < mb.uvs.length; i++) out.uvs.push(mb.uvs[i])
  for (const k of mb.indices) out.indices.push(base + k)
}

/** A five-pointed star on a wall facing (nx, nz): Macy's. */
function wallStar(out: MeshBuilder, f: Frame, cx: number, cz: number, nx: number, nz: number, y: number, r: number, c: Rgb, o = 0.3): void {
  const ux = -nz
  const uz = nx
  const P = (a: number, rr: number): V3 => { const p = f.at(cx + ux * Math.sin(a) * rr + nx * o, cz + uz * Math.sin(a) * rr + nz * o); return [p.x, y + Math.cos(a) * rr, p.z] }
  const d = f.dir(nx, nz)
  const C: V3 = (() => { const p = f.at(cx + nx * o, cz + nz * o); return [p.x, y, p.z] })()
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2
    out.quad([C, P(a - Math.PI / 5, r * 0.4), P(a, r), P(a + Math.PI / 5, r * 0.4)], [d.x, 0, d.z], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
  }
}

// ---------------------------------------------------------------------------------------------------------------
// colours

const DARK_GLASS: Rgb = [0.17, 0.19, 0.21]
const COPPER_GREEN: Rgb = [0.24, 0.36, 0.3]
const AWNING_RED: Rgb = [0.6, 0.12, 0.12]
const GOLD_LEAF: Rgb = [0.78, 0.63, 0.25]

// ---------------------------------------------------------------------------------------------------------------
// the outlines, grid frame (tools: the Overpass cache, turned −9° so the streets run square)

/** way/332378158 */
const WESTIN_REF = [-48.9, 29.1, -43.3, 29.1, -43.3, 11.7, -48.9, 11.7, -48.8, -0.5, -40.0, -0.4, -39.9, -26.1, -39.9, -42.6, -31.4, -42.6, -22.3, -42.6, -7.1, -42.6, 43.6, -42.5, 43.5, -34.3, 43.5, -25.7, 43.5, -15.8, 43.4, 0.6, 43.3, 8.9, 43.2, 41.1, 1.1, 41.0, -24.0, 41.0, -49.0, 40.9]

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
  const f = gridFrame(fit, WESTIN_REF, 0, 1)
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
  up(rear)
  const courts: [number, number][] = [[-15.5, -7.5], [12.5, 20.5]]
  const cuts = [-43, ...courts.flat(), 42]
  for (let k = 0; k < cuts.length; k += 2) up(clipBox(f.ring, f, back - 1, 60, cuts[k], cuts[k + 1]))
  // the portico: four columns before the middle wing, and the red canopy over the door between them
  const px = 45.2
  for (const z of [-5, -1.7, 1.7, 5]) gcol(out, f, px, z, 0, 10.5, 0.55, [0.66, 0.62, 0.55], 10, 0.55, surfaceTag('ashlar'))
  gbox(out, f, 43.4, 46.2, -6.2, 6.2, 10.5, 11.6, [0.6, 0.55, 0.48], surfaceTag('ashlar'))
  gbox(out, f, 43.4, 47.8, -3.4, 3.4, 3.8, 4.6, AWNING_RED)
  // the red awnings over the arched ground-floor windows, both sides of the portico
  for (const z of [-38, -33, -28, -23, -18, -13, 12, 17, 22, 27, 32, 37]) gbox(out, f, 43.4, 44.6, z - 1.6, z + 1.6, 4.4, 5.6, AWNING_RED)
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
function macys(out: MeshBuilder, fit: Fit): void {
  const f = gridFrame(fit, MACYS_REF, 0, 1)
  const H = fit.height > 30 && fit.height < 70 ? fit.height : 45
  const MARBLE: Rgb = [0.87, 0.86, 0.83]
  const CREAM: Rgb = [0.8, 0.76, 0.68]
  const GREY_STONE: Rgb = [0.66, 0.65, 0.62]
  const shops: Face = { kind: 'curtain', wall: [0.2, 0.2, 0.21], glass: [0.16, 0.18, 0.2], pitch: 4, floor: 6 }
  // the 1928 store, the south two-thirds of the block
  mass(out, clip(f.ring, f, 0, 0.5, 0, 1), H - 3, {
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
  const TC: Rgb = [0.79, 0.72, 0.66]
  const ring = roundRing(f.ring, 3.2, 4)
  const shaft: Face = { kind: 'fins', material: 'terracotta', wall: TC, glass: [0.3, 0.31, 0.34], pitch: 2.05, solid: 0.46, depth: 0.32, floor: 3.4 }
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
  for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) wallStar(out, own, c.x, c.z, nx, nz, main + 15, 2.2, gold, 0.02)
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
    base: { height: 5.5, face: { kind: 'curtain', material: 'granite', wall: [0.5, 0.36, 0.34], glass: [0.16, 0.17, 0.18], pitch: 4, floor: 5.5 } },
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
  for (const e of es) {
    const long = e.L > longest * 0.8
    const seg = [e.a, e.b]
    if (!long) { faceBand(out, seg, 0, H - 1.2, { kind: 'curtain', material: 'metal', wall: [0.58, 0.59, 0.6], glass: PANEL, pitch: 1.6, floor: 3.3 }); continue }
    faceBand(out, seg, 0, H - 1.2, { kind: 'curtain', material: 'metal', wall: [0.3, 0.31, 0.33], glass: GL, pitch: e.L / 4, floor: H - 1.2 })
    // the sliding doors: their deep steel frames, the two middle bays
    const own = ownFrame(ring)
    for (const u of [e.L * 0.25, e.L * 0.5, e.L * 0.75]) {
      const c = { x: e.a.x + e.t.x * u, z: e.a.z + e.t.z * u }
      gbox(out, own, c.x - 0.2, c.x + 0.2, c.z - 0.2, c.z + 0.2, 0, H - 1.2, [0.28, 0.29, 0.3], surfaceTag('metal'))
    }
  }
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
 * brick flanks. (Commons: "San Francisco Geary Theatre.jpg".)
 */
const gearyTheater = spec({
  height: 23,
  base: { height: 6.5, face: { kind: 'curtain', material: 'metal', wall: [0.35, 0.3, 0.22], glass: [0.5, 0.42, 0.24], pitch: 3.5, floor: 6.5 }, canopy: { depth: 2.2, colour: [0.72, 0.66, 0.52] } },
  tiers: [
    { to: 17.5, face: { kind: 'punched', material: 'terracotta', wall: [0.8, 0.76, 0.66], glass: [0.22, 0.24, 0.26], pitch: 5.2, solid: 0.42, floor: 11, arched: true }, cornice: { depth: 0.5, height: 0.5 } },
    { to: 23, face: { kind: 'punched', material: 'terracotta', wall: [0.8, 0.76, 0.66], glass: [0.4, 0.44, 0.4], pitch: 5.2, solid: 0.75, floor: 5.5 }, cornice: { depth: 1.3, height: 1.2 } },
  ],
  roof: [0.5, 0.48, 0.44],
})

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

/**
 * Union Square itself (laid out 1850; rebuilt over its garage in 2002 by April Philips and Michael Fotheringham):
 * a granite deck a metre and a half over Geary, stepped down to the street on the Geary side in a broad
 * amphitheatre, with four lawn panels, palms round the edges, a glass café pavilion at two corners, and in the
 * middle the Dewey Monument (1903, Robert Aitken and Newton Tharp): a tall granite Corinthian column on a stepped
 * pedestal carrying the bronze Victory, a wreath in one hand and a trident in the other. Drawn in the street-grid
 * frame at the square's own point: +x east along Geary, +z north along Powell. (Commons: "Dewey Monument, Union
 * Square.jpg", "San Francisco, Union Square (6).jpg", "Union Square, San Francisco December 2016.jpg".)
 */
function unionSquarePlaza(out: MeshBuilder, fit: Fit): void {
  const R = [[-60.5, 26.3], [-60.4, -25.4], [-57.6, -32.2], [-54.2, -35.7], [-50.5, -37.9], [-46.0, -38.8], [46.4, -38.7], [51.3, -37.3], [55.3, -34.8], [58.4, -30.8], [60.0, -25.4], [59.9, 26.2], [58.9, 30.7], [56.5, 33.9], [52.2, 37.6], [45.1, 39.2], [-48.3, 39.0], [-51.9, 37.8], [-55.8, 35.0], [-58.9, 31.5]]
  const k = Math.min(1.6, Math.max(0.6, fit.hx / 60))
  const ring: P2[] = R.map(([x, z]) => ({ x: x * k, z: z * k }))
  const f = ownFrame(ring)
  const GRANITE: Rgb = [0.72, 0.7, 0.67]
  const PALE: Rgb = [0.8, 0.78, 0.75]
  const LAWN: Rgb = [0.34, 0.44, 0.26]
  const BRONZE: Rgb = [0.33, 0.3, 0.22]
  // the deck, and the steps down its four sides (the Geary flight the widest)
  const deck = 1.5
  faceBand(out, ring, 0, deck, { kind: 'blank', material: 'granite', wall: GRANITE })
  capPolygon(out, ring, deck, PALE, surfaceTag('granite'))
  for (let i = 0; i < 4; i++) {
    const r = insetRing(ring, -(i + 1) * 0.9)
    const y = deck - (i + 1) * 0.37
    faceBand(out, r, y, y + 0.37, { kind: 'blank', material: 'granite', wall: i % 2 ? GRANITE : PALE })
    capPolygon(out, r, y + 0.37, i % 2 ? GRANITE : PALE, surfaceTag('granite'))
  }
  // four lawn panels round the middle
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      gbox(out, f, sx * 13 * k, sx * 47 * k, sz * 9 * k, sz * 30 * k, deck, deck + 0.35, LAWN)
    }
  }
  // the Dewey Monument: three steps, the plinth, the fluted shaft, the capital, and Victory on top
  const col = 29 * Math.min(1.2, k)
  for (let i = 0; i < 3; i++) {
    const w = 6.5 - i * 0.9
    gbox(out, f, -w, w, -w, w, deck + i * 0.4, deck + (i + 1) * 0.4, PALE, surfaceTag('granite'))
  }
  gbox(out, f, -2.6, 2.6, -2.6, 2.6, deck + 1.2, deck + 5.2, GRANITE, surfaceTag('granite'))
  gbox(out, f, -3.0, 3.0, -3.0, 3.0, deck + 5.2, deck + 5.8, PALE, surfaceTag('granite'))
  const c = f.at(0, 0)
  prism(out, c.x, c.z, deck + 5.8, deck + col - 2.2, 1.2, 16, PALE, surfaceTag('granite'), 1.02)
  // the capital: two courses, the upper one wider, and the abacus
  prism(out, c.x, c.z, deck + col - 2.2, deck + col - 0.9, 1.15, 16, PALE, surfaceTag('granite'), 1.6)
  gbox(out, f, -1.8, 1.8, -1.8, 1.8, deck + col - 0.9, deck + col - 0.3, PALE, surfaceTag('granite'))
  // Victory: a standing bronze figure, the wreath out in one hand, the trident up in the other
  const y0 = deck + col - 0.3
  gbox(out, f, -0.9, 0.9, -0.9, 0.9, y0, y0 + 0.35, BRONZE, surfaceTag('metal'))
  prism(out, c.x, c.z, y0 + 0.35, y0 + 2.2, 0.62, 8, BRONZE, surfaceTag('metal'), 0.34)
  prism(out, c.x, c.z, y0 + 2.2, y0 + 3.0, 0.38, 8, BRONZE, surfaceTag('metal'), 0.3)
  const head = f.at(0, 0)
  prism(out, head.x, head.z, y0 + 3.0, y0 + 3.45, 0.3, 8, BRONZE, surfaceTag('metal'), 0.14)
  gstrut(out, f, [0, y0 + 2.5, 0], [2.1, y0 + 2.2, 0.2], 0.16, 0.16, BRONZE)          // the arm with the wreath
  const w = f.at(2.35, 0.2)
  prism(out, w.x, w.z, y0 + 2.05, y0 + 2.15, 0.5, 8, BRONZE, surfaceTag('metal'), 0.5, false)
  gstrut(out, f, [0, y0 + 2.5, 0], [-1.4, y0 + 3.3, -0.2], 0.16, 0.16, BRONZE)        // and the arm with the trident
  gstrut(out, f, [-1.5, y0 + 1.2, -0.2], [-1.5, y0 + 5.4, -0.2], 0.11, 0.11, BRONZE)
  // the wings, one either side
  for (const sz of [-1, 1]) gstrut(out, f, [-0.2, y0 + 1.9, sz * 0.3], [-0.8, y0 + 3.9, sz * 0.85], 0.06, 0.8, BRONZE)
  // the two glass café pavilions, at the south-west and north-east corners
  for (const [px, pz] of [[-43, -17], [45, 20]]) {
    gbox(out, f, px * k - 6, px * k + 6, pz * k - 4.5, pz * k + 4.5, deck, deck + 3.6, [0.45, 0.55, 0.58], surfaceTag('glass'))
    gbox(out, f, px * k - 6.6, px * k + 6.6, pz * k - 5.1, pz * k + 5.1, deck + 3.6, deck + 4.1, [0.85, 0.85, 0.84], surfaceTag('metal'))
  }
  // the palms round the edges (the square's own; the city's tree layer plants the streets)
  const TRUNK: Rgb = [0.45, 0.38, 0.3]
  const FROND: Rgb = [0.27, 0.42, 0.24]
  let seed = 7
  for (const [px, pz] of [[-52, 32], [-30, 33], [-8, 33], [14, 33], [36, 33], [52, 32], [-52, -31], [-30, -32], [-8, -32], [14, -32], [36, -32], [52, -31]]) {
    const b = palm('canary', (seed += 37), 2)
    const at = f.at(px * k, pz * k)
    mergeInto(out, b.trunk, at.x, deck, at.z, TRUNK, surfaceTag('clapboard'))
    mergeInto(out, b.collar, at.x, deck, at.z, [0.4, 0.34, 0.24], surfaceTag('clapboard'))
    mergeInto(out, b.leaves, at.x, deck, at.z, FROND, 0)
  }
}

export const UNION_SQUARE: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  westinStFrancis,
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
