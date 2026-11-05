/**
 * The hôtel particulier: the noble town house of the Marais, the Faubourg Saint-Germain and the Faubourg Saint-Honoré,
 * drawn generically from its footprint (the owner's 300-odd unclaimed buildings named "Hôtel …", 2026-11-04), so that a rider
 * going by gets the idea of one. What reads at street level, and what this builds:
 *
 * - the walls are pierre de taille: limestone with ashlar courses, two or three tall storeys (about 4.8 m), tall dressed windows,
 *   a stone cornice, a slate mansard or a steep slate hip with dormers; never a shop on the ground floor;
 * - the COUR D'HONNEUR. Where the footprint has a courtyard (an inner ring, `Fit.holes`) the house is drawn as its ranges: the
 *   corps de logis at the back, the wings at the sides and, on the street, a LOW WING (one storey, a hip roof) with the
 *   porte cochère on the axis of the court. Where the footprint is a U open to the street, the mouth is shut with a tall
 *   stone wall carrying the porte cochère, and the corps de logis gets the court-side pavilion. Where there is no court to
 *   derive, the street front itself takes the central frontispiece and the porte cochère;
 * - the porte cochère is a big round-headed carriage door of dark wood in a stone surround with a keystone; the pavilion
 *   facing the court or the street has a frontispiece to the cornice, an iron balcony at the piano nobile, and (by the seed) a
 *   pediment;
 * - the seed draws the storeys, the roof, the pediment, the balcony, the rustication and the windows, so that three hundred of
 *   them are not stamped.
 *
 * Everything is a tunable in `HOTEL`. Called from `parisCivic` for the kit kind `hotel` (recipes.ts).
 */
import { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { facade, type FacadeSpec, type Windows } from '../../facade.ts'
import { placed } from '../../kit.ts'
import { edgeAt, offsetRing } from '../../parts.ts'
import { towerRing } from '../../tower.ts'
import { frontEdge, PALETTES, stream } from './civic.ts'

type P2 = { x: number; z: number }

/** knobs: metres, and odds in 0–1 */
export const HOTEL = {
  /** a storey, metres; the count is the footprint's height over this, within the limits */
  storey: 4.8, minStoreys: 2, maxStoreys: 3,
  /** the roof allowance taken off the building's height before it is counted in storeys */
  roofAllowance: 2.5,
  /** the low street wing of a court: its height (one storey) and the thickest it may be and still be a low wing */
  wingStorey: 5.4, wingMaxDepth: 11,
  wingRoof: { height: 1.8, inset: 1.6 },
  /** the roofs: a mansard's rise and inset; a hip's rise as a fraction of its inset (the inset being a fraction of the range's depth) */
  mansard: { height: 3.4, inset: 1.5 },
  hip: { insetOfDepth: 0.4, maxInset: 4.5, rise: 1.15 },
  /** dormers: one every `pitch` metres along a street range, on the slope at this fraction of its height, this size */
  dormer: { pitch: 6.6, at: 0.42, hw: 0.55, hh: 0.8, depth: 0.55, maxEdges: 2, minEdge: 6 },
  /** the porte cochère: opening width and height, the stone surround's width */
  porte: { w: 3.3, h: 4.2, surround: 0.45 },
  /** the stone wall that shuts a court's mouth: its height and thickness */
  wall: { height: 5.2, thick: 0.6 },
  /** the frontispiece: its share of the front's length, its largest width, how far it stands proud */
  pavilion: { share: 0.3, maxWidth: 7.6, minFront: 13, proud: 0.55 },
  /** the court-side door */
  door: { w: 1.7, h: 3.1 },
  /** the footprint's smallest courtyard, m², and the thinnest range worth drawing, m */
  minCourt: 40, minRange: 2.5, minArea: 14,
  /** more windows than this and the moulded ones go plain, for the triangle budget */
  maxTriangles: 4500, windowBudget: 130, sideWindows: 'balanced' as Windows,
  odds: { mansard: 0.6, pediment: 0.45, balcony: 0.7, filant: 0.25, rusticated: 0.4, quoins: 0.35, dormers: 0.9 },
}

const STONE: Rgb = [0.86, 0.83, 0.75]
const SLATE: Rgb = [0.3, 0.33, 0.37]
const WOOD: Rgb = [0.15, 0.095, 0.06]
const WOOD_DARK: Rgb = [0.07, 0.05, 0.04]
const IRON: Rgb = [0.08, 0.08, 0.09]
const GLASS: Rgb = [0.13, 0.15, 0.18]
const ASHLAR = surfaceTag('ashlar')
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export interface HotelArgs { p: number; seed?: number }

interface Look {
  roof: 'mansard' | 'hip'
  pediment: boolean
  balcony: boolean
  filant: boolean
  rusticated: boolean
  quoins: boolean
  windows: Windows
  cornice: 'cornice' | 'dentil' | 'modillion'
  dormers: boolean
  side: Windows
  hue: number
  r: () => number
}

function look(seed: number): Look {
  const r = stream(seed + 77)
  const wins = ['dressed', 'dressed', 'pedimented', 'segmental', 'arched'] as const
  return {
    roof: r() < HOTEL.odds.mansard ? 'mansard' : 'hip',
    pediment: r() < HOTEL.odds.pediment, balcony: r() < HOTEL.odds.balcony, filant: r() < HOTEL.odds.filant,
    rusticated: r() < HOTEL.odds.rusticated, quoins: r() < HOTEL.odds.quoins,
    windows: wins[Math.floor(r() * wins.length)],
    cornice: (['cornice', 'dentil', 'modillion'] as const)[Math.floor(r() * 3)],
    dormers: r() < HOTEL.odds.dormers,
    side: HOTEL.sideWindows,
    hue: Math.floor(r() * PALETTES.stone.length),
    r,
  }
}

const area = (ring: P2[]): number => {
  let a = 0
  for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; a += p.x * q.z - q.x * p.z }
  return a / 2
}
const perimeter = (ring: P2[]): number => ring.reduce((s, p, i) => s + Math.hypot(ring[(i + 1) % ring.length].x - p.x, ring[(i + 1) % ring.length].z - p.z), 0)
const bbox = (ring: P2[]): { x0: number; x1: number; z0: number; z1: number } => ({
  x0: Math.min(...ring.map((p) => p.x)), x1: Math.max(...ring.map((p) => p.x)), z0: Math.min(...ring.map((p) => p.z)), z1: Math.max(...ring.map((p) => p.z)),
})
/** the average depth of a range: twice its area over its perimeter, which is its thickness for a strip */
const thickness = (ring: P2[]): number => (2 * Math.abs(area(ring))) / Math.max(1, perimeter(ring))

/** the ring cut by an axis-aligned line, keeping one side (Sutherland–Hodgman: right for the near-convex ranges of a house) */
function clip(ring: P2[], axis: 'x' | 'z', v: number, keep: 'lt' | 'gt'): P2[] {
  const out: P2[] = []
  const inside = (p: P2): boolean => (keep === 'lt' ? p[axis] <= v : p[axis] >= v)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const ia = inside(a), ib = inside(b)
    if (ia) out.push(a)
    if (ia !== ib) {
      const t = (v - a[axis]) / (b[axis] - a[axis])
      out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t })
    }
  }
  // (the cut leaves repeated points where the line met a vertex)
  return out.filter((p, i) => Math.hypot(p.x - out[(i + 1) % out.length].x, p.z - out[(i + 1) % out.length].z) > 0.05)
}

/** the part of `ring` outside a courtyard's box, as the ranges round it: back (low z), front (high z), left, right */
function ranges(ring: P2[], court: { x0: number; x1: number; z0: number; z1: number }): Record<'back' | 'front' | 'left' | 'right', P2[]> {
  const mid = clip(clip(ring, 'z', court.z1, 'lt'), 'z', court.z0, 'gt')
  return {
    back: clip(ring, 'z', court.z0, 'lt'), front: clip(ring, 'z', court.z1, 'gt'),
    left: clip(mid, 'x', court.x0, 'lt'), right: clip(mid, 'x', court.x1, 'gt'),
  }
}

/** The convex hull's chords across a notch: [from, to] ring indices, the mouth's length and the notch's depth. */
function mouths(ring: P2[]): { a: number; b: number; L: number; depth: number; nx: number; nz: number }[] {
  const idx = ring.map((_, i) => i).sort((i, j) => ring[i].x - ring[j].x || ring[i].z - ring[j].z)
  const cross = (o: number, a: number, b: number): number => (ring[a].x - ring[o].x) * (ring[b].z - ring[o].z) - (ring[a].z - ring[o].z) * (ring[b].x - ring[o].x)
  const lower: number[] = [], upper: number[] = []
  for (const i of idx) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], i) <= 0) lower.pop(); lower.push(i) }
  for (const i of [...idx].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], i) <= 0) upper.pop(); upper.push(i) }
  const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)]
  const found: { a: number; b: number; L: number; depth: number; nx: number; nz: number }[] = []
  const n = ring.length
  for (let k = 0; k < hull.length; k++) {
    const a = hull[k], b = hull[(k + 1) % hull.length]
    if ((a + 1) % n === b) continue
    const L = Math.hypot(ring[b].x - ring[a].x, ring[b].z - ring[a].z)
    const tx = (ring[b].x - ring[a].x) / L, tz = (ring[b].z - ring[a].z) / L
    let depth = 0
    for (let i = (a + 1) % n; i !== b; i = (i + 1) % n) depth = Math.max(depth, Math.abs((ring[i].x - ring[a].x) * tz - (ring[i].z - ring[a].z) * tx))
    found.push({ a, b, L, depth, nx: tz, nz: -tx })
  }
  return found
}

/** a triangle fan face along +z: the door leaf's round head */
function fan(q: MeshBuilder, cx: number, cy: number, z: number, r: number, c: Rgb, from = 0, to = Math.PI, n = 8): void {
  for (let k = 0; k < n; k++) {
    const a0 = from + ((to - from) * k) / n, a1 = from + ((to - from) * (k + 1)) / n
    const p0: [number, number, number] = [cx + r * Math.cos(a0), cy + r * Math.sin(a0), z]
    const p1: [number, number, number] = [cx + r * Math.cos(a1), cy + r * Math.sin(a1), z]
    q.quad([[cx, cy, z], p0, p1, p1], [0, 0, 1], UV, c, 0)
  }
}

/** the porte cochère, at x in the frame of a part facing +z: stone surround, round head, keystone, the two dark leaves */
function porte(q: MeshBuilder, x: number, y0: number, w: number, h: number, trim: Rgb): void {
  const t = HOTEL.porte.surround, rr = w / 2, sp = y0 + h - rr
  for (const s of [-1, 1]) box(q, x + s * (rr + t / 2), (y0 + sp) / 2, 0.1, t / 2, (sp - y0) / 2, 0.1, trim, ASHLAR)
  q.quad([[x - rr, y0, 0.06], [x + rr, y0, 0.06], [x + rr, sp, 0.06], [x - rr, sp, 0.06]], [0, 0, 1], UV, WOOD, 0)
  fan(q, x, sp, 0.06, rr, WOOD)
  // the arch ring
  const N = 8
  for (let k = 0; k < N; k++) {
    const a0 = (Math.PI * k) / N, a1 = (Math.PI * (k + 1)) / N
    const P = (a: number, r: number): [number, number, number] => [x + r * Math.cos(a), sp + r * Math.sin(a), 0.2]
    q.quad([P(a0, rr), P(a0, rr + t), P(a1, rr + t), P(a1, rr)], [0, 0, 1], UV, trim, ASHLAR)
  }
  box(q, x, sp + rr + t, 0.26, t * 0.55, t * 0.8, 0.12, trim, ASHLAR)
  // the leaves' seam, a rail across them and a sill
  box(q, x, (y0 + sp) / 2, 0.075, 0.025, (sp - y0) / 2, 0.02, WOOD_DARK)
  box(q, x, sp, 0.075, rr, 0.05, 0.02, WOOD_DARK)
  box(q, x, y0 + 0.05, 0.25, rr + t, 0.05, 0.25, trim, ASHLAR)
}

/** a dark window with a stone surround */
function window(q: MeshBuilder, x: number, y: number, z: number, hw: number, hh: number, trim: Rgb): void {
  box(q, x, y, z, hw + 0.2, hh + 0.2, 0.02, trim, ASHLAR)
  box(q, x, y, z + 0.03, hw, hh, 0.02, GLASS)
}

/** an iron balcony on a slab, at y, centred at x, from the wall out */
function balcony(q: MeshBuilder, x: number, y: number, z: number, hw: number, posts: number): void {
  box(q, x, y, z - 0.1, hw + 0.1, 0.07, 0.4, STONE, ASHLAR)
  const zf = z + 0.28
  box(q, x, y + 0.95, zf, hw + 0.1, 0.03, 0.025, IRON)
  box(q, x, y + 0.3, zf, hw + 0.1, 0.025, 0.025, IRON)
  for (let k = 0; k <= posts; k++) box(q, x - hw + (2 * hw * k) / posts, y + 0.6, zf, 0.02, 0.35, 0.02, IRON)
}

/** a pediment over a width 2w at height y, depth d, rising h: stone face, slate slopes */
function pediment(q: MeshBuilder, w: number, y: number, h: number, d: number): void {
  const a: [number, number, number] = [-w, y, d], b: [number, number, number] = [w, y, d], t: [number, number, number] = [0, y + h, d]
  const l = Math.hypot(h, w)
  q.quad([a, b, t, t], [0, 0, 1], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], STONE, ASHLAR)
  q.quad([b, [w, y, 0], [0, y + h, 0], t], [h / l, w / l, 0], UV, SLATE, 0)
  q.quad([[-w, y, 0], a, t, [0, y + h, 0]], [-h / l, w / l, 0], UV, SLATE, 0)
  box(q, 0, y - 0.15, d / 2, w + 0.15, 0.15, d / 2 + 0.05, STONE, ASHLAR)
}

/**
 * The avant-corps on an edge, in the frame of a part facing +z with its foot at x: to the cornice, with its windows, its
 * balcony at the piano nobile and its pediment; and either the porte cochère or a court door at its foot.
 */
function pavilion(q: MeshBuilder, x: number, L: number, H: number, n: number, grade: number, S: Look, how: 'porte' | 'door'): void {
  const sh = H / n, proud = HOTEL.pavilion.proud
  const w = Math.min(L * HOTEL.pavilion.share, HOTEL.pavilion.maxWidth) / 2
  box(q, x, H / 2, proud / 2, w, H / 2, proud / 2, STONE, ASHLAR)
  box(q, x, H + 0.2, proud / 2 + 0.12, w + 0.22, 0.2, proud / 2 + 0.2, STONE, ASHLAR)
  const bays = Math.max(1, Math.round((2 * w) / 3.2))
  for (let f = 1; f < n; f++) {
    for (let k = 0; k < bays; k++) {
      const wx = x - w + (2 * w * (k + 0.5)) / bays
      window(q, wx, f * sh + sh * 0.5, proud + 0.01, 0.55, Math.min(1.6, sh * 0.32), STONE)
    }
  }
  if (S.balcony && n >= 2) balcony(q, x, sh + sh * 0.5 - 1.55, proud + 0.05, w - 0.3, Math.max(4, Math.round(w * 3)))
  if (S.pediment) pediment(q, w + 0.2, H + 0.45, Math.min(2.4, w * 0.42), proud + 0.25)
  if (how === 'porte') {
    porte(q, x, grade, Math.min(HOTEL.porte.w, w * 1.5), HOTEL.porte.h, STONE)
  } else {
    const dw = HOTEL.door.w / 2, dh = HOTEL.door.h
    box(q, x, grade + (dh + 0.5) / 2, proud + 0.04, dw + 0.4, (dh + 0.5) / 2, 0.04, STONE, ASHLAR)
    box(q, x, grade + dh / 2, proud + 0.09, dw, dh / 2, 0.02, WOOD)
    box(q, x, grade + dh / 2, proud + 0.115, 0.02, dh / 2, 0.01, WOOD_DARK)
    for (let s = 0; s < 3; s++) box(q, x, grade + 0.09 + s * 0.17, proud + 0.5 - s * 0.16, dw + 0.5, 0.09, 0.4 - s * 0.16, STONE, ASHLAR)
  }
}

/** dormers on the slope of a roof over the edge, every `pitch` metres, in the frame of that edge */
function dormers(q: MeshBuilder, L: number, H: number, rise: number, inset: number): void {
  const d = HOTEL.dormer
  const k = Math.max(1, Math.floor((L - 2) / d.pitch))
  for (let j = 0; j < k; j++) {
    const x = -((k - 1) * d.pitch) / 2 + j * d.pitch
    const y = H + rise * d.at + d.hh * 0.6, z = -inset * d.at + d.depth * 0.45
    box(q, x, y, z, d.hw, d.hh, d.depth, SLATE)
    box(q, x, y - 0.05, z + d.depth + 0.015, d.hw - 0.14, d.hh - 0.2, 0.015, GLASS)
    // a little gable over it
    const w = d.hw + 0.1, top = y + d.hh
    const a: [number, number, number] = [x - w, top, z + d.depth + 0.02], b: [number, number, number] = [x + w, top, z + d.depth + 0.02], t: [number, number, number] = [x, top + 0.5, z + d.depth + 0.02]
    q.quad([a, b, t, t], [0, 0, 1], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], STONE, ASHLAR)
    const l = Math.hypot(0.5, w)
    q.quad([b, [x + w, top, z - d.depth], [x, top + 0.5, z - d.depth], t], [0.5 / l, w / l, 0], UV, SLATE, 0)
    q.quad([[x - w, top, z - d.depth], a, t, [x, top + 0.5, z - d.depth]], [-0.5 / l, w / l, 0], UV, SLATE, 0)
  }
}

/** a roof of rise `rise`, its top drawn in by `inset` (a true offset, so a notched plan keeps its notch), and the slate cap */
function roof(out: MeshBuilder, ring: P2[], H: number, rise: number, inset: number): void {
  const top = offsetRing(ring, -inset)
  if (Math.abs(area(top)) < 1 || area(top) * area(ring) < 0) { capPolygon(out, ring, H + rise * 0.5, SLATE, 0); return }
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    const a = ring[i], b = ring[j], A = top[i], B = top[j]
    const e = { x: b.x - a.x, z: b.z - a.z }
    const L = Math.hypot(e.x, e.z) || 1
    const run = Math.max(0.2, Math.abs((A.x - a.x) * (e.z / L) - (A.z - a.z) * (e.x / L)))
    const nl = Math.hypot(rise / run, 1)
    out.quad([[a.x, H, a.z], [b.x, H, b.z], [B.x, H + rise, B.z], [A.x, H + rise, A.z]], [(e.z / L) * (rise / run) / nl, 1 / nl, (-e.x / L) * (rise / run) / nl], UV, SLATE, 0)
  }
  capPolygon(out, top, H + rise, SLATE, 0)
}

interface Piece { ring: P2[]; n: number; wing: boolean }

/** one range of the house: its walls on facade(), its slate roof, its street-facing dormers; returns its roof's rise and inset */
function range(out: MeshBuilder, fit: Fit, p: Piece, S: Look, win: Windows): { rise: number; inset: number; H: number } {
  const sh = p.wing ? HOTEL.wingStorey : HOTEL.storey
  const H = p.n * sh
  const ring = p.ring
  const bb = bbox(ring)
  const mat = 'limestone' as const
  const spec: FacadeSpec = {
    ground: p.n < 2 ? null : { kind: S.rusticated ? 'rusticated' : 'plain', storeys: 1, material: mat },
    // (the moulded windows go on the street-facing walls; the sides and the back keep plain ones, for the triangle budget)
    shaft: { storeys: Math.max(1, p.n - 1), windows: p.wing ? 'small' : S.side, material: mat,
      by: p.wing ? undefined : [{ on: 'front', windows: win, material: mat }] },
    top: null,
    bands: { aboveGround: p.n < 2 ? null : 'string', belowTop: null, top: S.cornice },
    crown: null,
    frame: S.quoins && !p.wing ? { verticals: { kind: 'quoins', width: 0.7, at: 'corners' }, horizontals: null, recess: 0, material: mat } : null,
    entrance: null,
    material: mat,
  }
  facade(out, { hx: (bb.x1 - bb.x0) / 2, hz: (bb.z1 - bb.z0) / 2, height: H, ring, grade: fit.grade, groundAt: fit.groundAt }, spec)
  const t = thickness(ring)
  const rf = p.wing ? { rise: HOTEL.wingRoof.height, inset: Math.min(HOTEL.wingRoof.inset, t * 0.3) }
    : S.roof === 'mansard' ? { rise: HOTEL.mansard.height, inset: Math.min(HOTEL.mansard.inset, t * 0.3) }
    : (() => { const inset = Math.max(1.2, Math.min(HOTEL.hip.maxInset, t * HOTEL.hip.insetOfDepth)); return { rise: inset * HOTEL.hip.rise, inset } })()
  roof(out, ring, H, rf.rise, rf.inset)
  // dormers on the longest street-facing edges
  if (S.dormers && !p.wing) {
    const idx = ring.map((_, i) => i).filter((i) => { const e = edgeAt(ring, i); return e.nz > 0.5 && e.L >= HOTEL.dormer.minEdge })
      .sort((a, b) => edgeAt(ring, b).L - edgeAt(ring, a).L).slice(0, HOTEL.dormer.maxEdges)
    for (const i of idx) {
      const e = edgeAt(ring, i)
      const q = new MeshBuilder()
      dormers(q, e.L, H, rf.rise, rf.inset)
      placed(out, q, e.heading, e.mid.x, e.mid.z)
    }
  }
  return { ...rf, H }
}

/** a part built in the frame of edge `e` of `ring`, `u` metres along it from its middle, placed on the ring */
function onEdge(out: MeshBuilder, ring: P2[], i: number, u: number, build: (q: MeshBuilder, L: number) => void): void {
  const e = edgeAt(ring, i)
  const q = new MeshBuilder()
  build(q, e.L)
  placed(out, q, e.heading, e.mid.x + e.tx * u, e.mid.z + e.tz * u)
}

/** where along edge `i` of `ring` the point `at` falls, from the edge's middle, kept clear of its ends */
function alongEdge(ring: P2[], i: number, at: P2 | null, clear: number): number {
  const e = edgeAt(ring, i)
  if (!at) return 0
  const u = (at.x - e.mid.x) * e.tx + (at.z - e.mid.z) * e.tz
  const room = Math.max(0, e.L / 2 - clear)
  return Math.max(-room, Math.min(room, u))
}

/**
 * The hôtel, within `HOTEL.maxTriangles`: built as the seed draws it, then, if that is too many (a court of four ranges with
 * moulded windows is), again plainer: plain windows, then no dormers, balconies or rustication.
 */
export function hotel(out: MeshBuilder, fit: Fit, a: HotelArgs): void {
  const mark = [out.positions.length, out.normals.length, out.uvs.length, out.colors.length, out.indices.length]
  const t0 = out.triangles
  for (let lean = 0; lean <= 2; lean++) {
    build(out, fit, a, lean)
    if (out.triangles - t0 <= HOTEL.maxTriangles || lean === 2) return
    out.positions.length = mark[0]; out.normals.length = mark[1]; out.uvs.length = mark[2]; out.colors.length = mark[3]; out.indices.length = mark[4]
  }
}

function build(out: MeshBuilder, fit: Fit, a: HotelArgs, lean: number): void {
  const from = out.colors.length
  const S = look(a.seed ?? 0)
  if (lean >= 1) { S.windows = 'balanced'; S.cornice = 'cornice' }
  if (lean >= 2) { S.windows = 'wide'; S.side = 'wide'; S.dormers = false; S.balcony = false; S.filant = false; S.rusticated = false; S.pediment = false }
  const grade = fit.grade ?? 0
  const H0 = fit.height > 3 ? fit.height : 14
  const n = Math.max(HOTEL.minStoreys, Math.min(HOTEL.maxStoreys, Math.round((H0 - HOTEL.roofAllowance) / HOTEL.storey)))
  const ring = towerRing(fit)
  // (a moulded head is sixty triangles a window)
  const moulded = S.windows === 'dressed' || S.windows === 'pedimented' || S.windows === 'segmental'
  const win: Windows = moulded && (ring.reduce((t, _, i) => { const e = edgeAt(ring, i); return e.nz > 0.5 ? t + e.L : t }, 0) / 3.8) * n > HOTEL.windowBudget ? 'wide' : S.windows
  const pw = HOTEL.porte.w + 2 * HOTEL.porte.surround + 0.8

  const holes = (fit.holes ?? []).filter((h) => h.length >= 3 && Math.abs(area(h)) >= HOTEL.minCourt).sort((p, q) => Math.abs(area(q)) - Math.abs(area(p)))
  const court = holes[0] ? bbox(holes[0]) : null
  const courtMid: P2 | null = court ? { x: (court.x0 + court.x1) / 2, z: (court.z0 + court.z1) / 2 } : null

  const pieces = court ? Object.entries(ranges(ring, court))
    .map(([role, r]) => ({ role, ring: r })).filter((p) => p.ring.length >= 3 && area(p.ring) >= HOTEL.minArea) : []
  const usable = court && pieces.some((p) => p.role === 'front' || p.role === 'back')

  if (court && usable) {
    // ---- a closed court: the ranges round it, the low wing on the street
    for (const p of pieces) {
      const bb = bbox(p.ring)
      const low = p.role === 'front' && bb.z1 - bb.z0 <= HOTEL.wingMaxDepth
      const side = p.role === 'left' || p.role === 'right'
      const r = range(out, fit, { ring: p.ring, n: low ? 1 : side && n > 2 && S.r() < 0.5 ? n - 1 : n, wing: low }, S, win)
      if (p.role === 'front' || p.role === 'back') {
        const i = frontEdge(p.ring)
        const e = edgeAt(p.ring, i)
        if (p.role === 'front') {
          if (e.L > pw) {
            const u = alongEdge(p.ring, i, courtMid, pw / 2)
            const full = !low && e.L >= HOTEL.pavilion.minFront
            onEdge(out, p.ring, i, u, (q, L) => full ? pavilion(q, 0, L, r.H, n, grade, S, 'porte') : porte(q, 0, grade, HOTEL.porte.w, HOTEL.porte.h, STONE))
          }
        } else if (e.L >= HOTEL.pavilion.minFront && e.nz > 0.6) {
          const u = alongEdge(p.ring, i, courtMid, HOTEL.pavilion.maxWidth / 2)
          onEdge(out, p.ring, i, u, (q, L) => pavilion(q, 0, L, r.H, n, grade, S, 'door'))
        }
      }
    }
  } else {
    // ---- a U open to the street: the mouth shut with a wall; else the street front itself
    const m = mouths(ring).filter((c) => c.L >= 5 && c.L <= 45 && c.depth >= 4 && c.nz > 0.3).sort((p, q) => q.depth * q.L - p.depth * p.L)[0]
    const r = range(out, fit, { ring, n, wing: false }, S, win)
    if (m) {
      const chord = [ring[m.a], ring[m.b]]
      const e = edgeAt(chord, 0)
      const q = new MeshBuilder()
      const wh = HOTEL.wall.height, th = HOTEL.wall.thick
      box(q, 0, wh / 2, -th / 2, e.L / 2, wh / 2, th / 2, STONE, ASHLAR)
      box(q, 0, wh + 0.12, -th / 2 + 0.05, e.L / 2 + 0.12, 0.12, th / 2 + 0.12, STONE, ASHLAR)
      for (const s of [-1, 1]) box(q, s * (e.L / 2 - 0.3), wh + 0.5, -th / 2, 0.45, 0.5, th / 2 + 0.1, STONE, ASHLAR)
      porte(q, 0, grade, HOTEL.porte.w, HOTEL.porte.h, STONE)
      placed(out, q, e.heading, e.mid.x, e.mid.z)
      // the court side of the corps de logis: the longest edge across the court from the mouth
      let best = -1, bl = 0
      for (let i = (m.a + 1) % ring.length; i !== m.b; i = (i + 1) % ring.length) {
        const ed = edgeAt(ring, i)
        if (ed.nx * m.nx + ed.nz * m.nz > 0.9 && ed.L > bl) { bl = ed.L; best = i }
      }
      if (best >= 0 && bl >= HOTEL.pavilion.minFront) {
        const u = alongEdge(ring, best, e.mid, HOTEL.pavilion.maxWidth / 2)
        onEdge(out, ring, best, u, (qq, L) => pavilion(qq, 0, L, r.H, n, grade, S, 'door'))
      }
    } else {
      const i = frontEdge(ring)
      const e = edgeAt(ring, i)
      if (e.L >= 5) {
        onEdge(out, ring, i, 0, (qq, L) => (L >= HOTEL.pavilion.minFront ? pavilion(qq, 0, L, r.H, n, grade, S, 'porte') : porte(qq, 0, grade, Math.min(HOTEL.porte.w, L * 0.5), HOTEL.porte.h, STONE)))
        // a continuous balcony across the whole front, now and then
        if (S.filant && n >= 2 && e.L >= 8) onEdge(out, ring, i, 0, (qq, L) => balcony(qq, 0, r.H / n + 1.0, 0.05, L / 2 - 0.4, Math.round(L * 1.2)))
      }
    }
  }
  // no two the same stone: the seed's tint, and a hue from the palette
  const hue = PALETTES.stone[S.hue]
  const t = 0.95 + (((a.seed ?? 0) * 2654435761) >>> 0) / 4294967296 * 0.1
  for (let k = from; k < out.colors.length; k += 4) {
    const c = out.colors
    const dark = c[k] + c[k + 1] + c[k + 2] < 0.75
    for (let j = 0; j < 3; j++) c[k + j] = Math.min(1, c[k + j] * t * (dark ? 1 : hue[j]))
  }
}
