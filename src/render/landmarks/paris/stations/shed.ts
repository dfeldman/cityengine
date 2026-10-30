/**
 * The termini's TRAIN SHEDS and the platforms under them, shared by every station in this folder.
 *
 * A shed is drawn over its OSM outline (stations/data.ts, in the shed entry's own frame — see that file) as a row of
 * SPANS side by side across the tracks, each running the length of the outline over its own strip: a gable (the
 * Gare du Nord's, the Gare de Lyon's), a barrel arch (Austerlitz's, the Gare de l'Est's), a lean-to aisle, or a flat
 * canopy. Each span is iron and glass — the zinc margins, the glazed band up the middle of each slope, the iron
 * trusses at every bay, the longitudinal girders on cast-iron columns standing on the platforms, and a glazed gable
 * screen with its valance closing each end — which is what a rider sees of a shed from the bridges and the streets
 * over the track fan.
 *
 * Nothing is drawn on the tracks: the trains (render/paris/trains.ts) run on the city's own rails at ground level,
 * so the columns stand only on the platforms or at the outline's edge, and a span's boundaries are moved onto the
 * nearest platform. The platforms are drawn here — the bake does not draw `railway=platform` — 0.76 m high (the
 * SNCF's main-line height), pale concrete with the white safety line along each edge.
 *
 * Frame: the kit's — local −z is the head of the tracks (the station's front), +z the throat; x across.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { beam } from '../../kit.ts'
import { rake } from '../../parts.ts'
import type { ShedData } from './data.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const METAL = surfaceTag('metal')
const GLASS = surfaceTag('glass')

export interface Span {
  /** the span's edges across the tracks, metres in the shed frame (moved onto the nearest platform: `snap`) */
  a: number
  b: number
  kind: 'gable' | 'arch' | 'lean' | 'flat'
  /** the height of the eaves (the springing of an arch), and how far the roof rises above it */
  eaves: number
  rise: number
  /** for a lean-to: which edge is high */
  high?: 'a' | 'b'
  /** the span's own extent along the tracks, where it is not the outline's (Lyon's halls stop short) */
  z0?: number
  z1?: number
}

export interface ShedSpec {
  spans: Span[]
  roof?: Rgb
  glass?: Rgb
  iron?: Rgb
  /** the truss spacing along the tracks, metres (default 9) */
  bay?: number
  /** the share of each slope that is glazed (default 0.55) */
  glazed?: number
  /** which ends get a glazed gable screen: the head (−z), the throat (+z) */
  ends?: { head?: boolean; throat?: boolean }
  /** move each interior span edge onto the nearest platform's middle, within this many metres (default 9) */
  snap?: number
  platform?: Rgb
}

/** the extent along z of the outline(s) over the strip a..b */
function stripZ(rings: P2[][], a: number, b: number): [number, number] | null {
  let z0 = Infinity, z1 = -Infinity
  for (const r of rings) {
    for (let i = 0; i < r.length; i++) {
      const p = r[i], q = r[(i + 1) % r.length]
      if (p.x >= a && p.x <= b) { z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
      // where the edge crosses the strip's sides
      for (const x of [a, b]) {
        if ((p.x - x) * (q.x - x) < 0) {
          const z = p.z + ((x - p.x) * (q.z - p.z)) / (q.x - p.x)
          z0 = Math.min(z0, z); z1 = Math.max(z1, z)
        }
      }
    }
  }
  return z1 > z0 ? [z0, z1] : null
}

/** the interval of each platform crossing the line z, as [x0, x1] */
function platformsAt(plats: P2[][], z: number): [number, number][] {
  const out: [number, number][] = []
  for (const r of plats) {
    const xs: number[] = []
    for (let i = 0; i < r.length; i++) {
      const p = r[i], q = r[(i + 1) % r.length]
      if ((p.z - z) * (q.z - z) < 0 || (p.z === z && q.z !== z)) xs.push(p.x + ((z - p.z) * (q.x - p.x)) / (q.z - p.z || 1))
    }
    xs.sort((m, n) => m - n)
    for (let i = 0; i + 1 < xs.length; i += 2) out.push([xs[i], xs[i + 1]])
  }
  return out
}

const toP = (r: [number, number][]): P2[] => r.map(([x, z]) => ({ x, z }))

/** The platforms: each OSM-derived outline raised 0.76 m, with a white line along its edges. */
export function platforms(out: MeshBuilder, data: ShedData, colour: Rgb = [0.7, 0.69, 0.66]): void {
  for (const r of data.platforms) {
    const ring = toP(r)
    rake(out, ring, [], 0, 0.76, { colour: [colour[0] * 0.8, colour[1] * 0.8, colour[2] * 0.8], material: 'concrete', roof: colour })
  }
}

/** The span's roof height at x (a..b), and the slope's own fraction 0 (eaves) .. 1 (ridge) there. */
function profile(s: Span, x: number): number {
  const w = s.b - s.a
  const t = (x - s.a) / w
  switch (s.kind) {
    case 'gable': return s.eaves + s.rise * (1 - Math.abs(2 * t - 1))
    case 'arch': return s.eaves + s.rise * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2))
    case 'lean': return s.eaves + s.rise * (s.high === 'a' ? 1 - t : t)
    default: return s.eaves + s.rise
  }
}

/** The cross-section of a span as points across it, each tagged glazed or not for the strip that ends there. */
function section(s: Span, glazed: number): { x: number; y: number; glass: boolean }[] {
  const pts: { x: number; y: number; glass: boolean }[] = []
  const w = s.b - s.a
  const at = (t: number, glass: boolean): void => { pts.push({ x: s.a + w * t, y: profile(s, s.a + w * t), glass }) }
  const m = (1 - glazed) / 2
  if (s.kind === 'gable') {
    // each slope: zinc at the eaves, the glazed band, zinc up to the ridge
    const g0 = 0.5 * m, g1 = 0.5 - 0.5 * m * 0.6
    at(0, false); at(g0, false); at(g1, true); at(0.5, false)
    at(1 - g1, false); at(1 - g0, true); at(1, false)
  } else if (s.kind === 'arch') {
    const n = 14
    for (let k = 0; k <= n; k++) {
      const t = k / n
      at(t, k > 0 && Math.abs(t - 1 / n / 2 - 0.5) < glazed / 2)
    }
  } else if (s.kind === 'lean') {
    at(0, false); at(m, false); at(1 - m, true); at(1, false)
  } else {
    at(0, false); at(m, false); at(1 - m, true); at(1, false)
  }
  return pts
}

/**
 * The shed: its spans, trusses, girders, columns and end screens, and the platforms under it. `data` is the
 * shed's generated outline and platforms (stations/data.ts).
 */
export function trainShed(out: MeshBuilder, data: ShedData, spec: ShedSpec): void {
  const rings = data.sheds.map(toP)
  const plats = data.platforms.map(toP)
  // the floor: under a roof of glass and iron the city's default ground is a lawn (owner, 2026-10-30, the Gare du Nord)
  for (const r of rings) out.grounds.push(r)
  const roofC = spec.roof ?? [0.4, 0.43, 0.45]
  const glassC = spec.glass ?? [0.46, 0.56, 0.6]
  const iron = spec.iron ?? [0.2, 0.24, 0.25]
  const bay = spec.bay ?? 9
  const glazed = spec.glazed ?? 0.55
  const ends = spec.ends ?? { head: false, throat: true }
  const snapW = spec.snap ?? 9
  const zMid = 0   // (the frame is centred on the sheds' box)
  // the interior edges moved onto the nearest platform's middle, so the columns between spans stand on it
  const snap = (x: number, edge: boolean): number => {
    if (edge) return x
    let best = x, d = snapW
    for (const z of [zMid - data.hz * 0.3, zMid, zMid + data.hz * 0.3]) {
      for (const [a, b] of platformsAt(plats, z)) {
        const c = (a + b) / 2
        if (Math.abs(c - x) < d) { d = Math.abs(c - x); best = c }
      }
    }
    return best
  }
  const xs = spec.spans.map((s) => [s.a, s.b])
  const lo = Math.min(...xs.flat()), hi = Math.max(...xs.flat())
  const spans = spec.spans.map((s) => ({ ...s, a: snap(s.a, s.a <= lo + 0.5), b: snap(s.b, s.b >= hi - 0.5) }))

  for (const s of spans) {
    const got = stripZ(rings, s.a, s.b)
    if (!got) continue
    const z0 = Math.max(got[0], s.z0 ?? -Infinity), z1 = Math.min(got[1], s.z1 ?? Infinity)
    if (z1 - z0 < 4) continue
    const sec = section(s, glazed)
    // the roof: one strip per section segment, in lengths of four bays (a 200 m quad lights badly)
    const chunk = bay * 4
    for (let za = z0; za < z1 - 0.01; za += chunk) {
      const zb = Math.min(z1, za + chunk)
      for (let k = 0; k + 1 < sec.length; k++) {
        const p = sec[k], q = sec[k + 1]
        const nx = -(q.y - p.y), ny = q.x - p.x
        const L = Math.hypot(nx, ny) || 1
        const g = q.glass
        out.quad([[p.x, p.y, za], [q.x, q.y, za], [q.x, q.y, zb], [p.x, p.y, zb]], [nx / L, Math.abs(ny / L), 0],
          [[0, 0], [1, 0], [1, 1], [0, 1]], g ? glassC : roofC, g ? GLASS : METAL)
      }
    }
    // the ridge's lantern: a raised strip along the top of a gable, its sides louvred dark
    if (s.kind === 'gable') {
      const m = (s.a + s.b) / 2, y = s.eaves + s.rise, w = Math.min(2.4, (s.b - s.a) * 0.06)
      box(out, m, y + 0.55, (z0 + z1) / 2, w, 0.55, (z1 - z0) / 2 - 0.5, [0.16, 0.18, 0.19], FIXED)
      box(out, m, y + 1.15, (z0 + z1) / 2, w + 0.5, 0.06, (z1 - z0) / 2 - 0.4, roofC, METAL)
    }
    // the trusses: rafters under the roof and the tie across each bay, and a king post at a gable's ridge
    const n = Math.max(2, Math.round((z1 - z0) / bay))
    for (let i = 0; i <= n; i++) {
      const z = z0 + ((z1 - z0) * i) / n
      for (let k = 0; k + 1 < sec.length; k++) {
        beam(out, [sec[k].x, sec[k].y - 0.35, z], [sec[k + 1].x, sec[k + 1].y - 0.35, z], 0.16, iron)
      }
      if (s.kind !== 'flat') beam(out, [s.a, s.eaves - 0.2, z], [s.b, s.eaves - 0.2, z], 0.06, iron)
      if (s.kind === 'gable' || s.kind === 'arch') {
        const m = (s.a + s.b) / 2
        beam(out, [m, s.eaves - 0.2, z], [m, s.eaves + s.rise - 0.4, z], 0.06, iron)
        // the Polonceau struts, from the tie's thirds up to the rafters
        for (const f of [0.25, 0.75]) beam(out, [s.a + (s.b - s.a) * f, s.eaves - 0.2, z], [s.a + (s.b - s.a) * f, profile(s, s.a + (s.b - s.a) * f) - 0.4, z], 0.05, iron)
      }
    }
    // the longitudinal girders at the eaves, either side
    for (const x of [s.a, s.b]) {
      const y = profile(s, x)
      box(out, x, y - 0.6, (z0 + z1) / 2, 0.25, 0.6, (z1 - z0) / 2, iron, METAL)
    }
    // the end screens: glazed gables with their mullions, and the valance along the bottom
    const screen = (z: number): void => {
      const yb = Math.max(6.5, s.eaves - Math.min(6, s.rise * 0.6))
      for (let k = 0; k + 1 < sec.length; k++) {
        const p = sec[k], q = sec[k + 1]
        out.quad([[p.x, yb, z], [q.x, yb, z], [q.x, q.y, z], [p.x, p.y, z]], [0, 0, z > 0 ? 1 : -1], [[0, 0], [1, 0], [1, 1], [0, 1]], glassC, GLASS)
      }
      const nm = Math.max(2, Math.round((s.b - s.a) / 3.2))
      for (let k = 1; k < nm; k++) {
        const x = s.a + ((s.b - s.a) * k) / nm
        beam(out, [x, yb, z], [x, profile(s, x) - 0.1, z], 0.07, iron)
      }
      box(out, (s.a + s.b) / 2, yb - 0.6, z, (s.b - s.a) / 2, 0.6, 0.12, [0.82, 0.8, 0.76], FIXED)
      for (const y of [yb + (profile(s, (s.a + s.b) / 2) - yb) * 0.45]) beam(out, [s.a, y, z], [s.b, y, z], 0.06, iron)
    }
    if (ends.throat !== false) screen(z1)
    if (ends.head) screen(z0)
    // the columns: on the span's edges, every other bay, standing on a platform (or at the outline's edge)
    for (const [x, edge] of [[s.a, s.a <= lo + 0.5], [s.b, s.b >= hi - 0.5]] as const) {
      for (let i = 0; i <= n; i += 2) {
        const z = z0 + ((z1 - z0) * i) / n
        let cx = x
        let base = 0
        if (!edge) {
          const on = platformsAt(plats, z).find(([a, b]) => x >= a - 1 && x <= b + 1)
          if (!on) continue
          cx = Math.min(Math.max(x, on[0] + 0.8), on[1] - 0.8)
          base = 0.76
        }
        prism(out, cx, z, base, profile(s, x) - 1.1, 0.28, 8, iron, METAL)
        box(out, cx, profile(s, x) - 1.15, z, 0.45, 0.1, 0.45, iron, METAL)
      }
    }
  }
  platforms(out, data, spec.platform)
}

/**
 * Platform CANOPIES (marquises): on every platform between z0 and z1, a roof just wider than the platform, its two
 * halves falling to a gutter on the middle (the "umbrella" of the Gare de l'Est's and Saint-Lazare's long platforms),
 * on a row of columns down the platform's middle. They follow the platform where it curves.
 */
export function canopies(out: MeshBuilder, data: ShedData, z0: number, z1: number, o: { height?: number; colour?: Rgb; iron?: Rgb; step?: number } = {}): void {
  const plats = data.platforms.map(toP)
  const y = o.height ?? 5.4
  const c = o.colour ?? [0.36, 0.4, 0.39]
  const iron = o.iron ?? [0.22, 0.25, 0.25]
  const step = o.step ?? 9
  for (const r of plats) {
    const zs = r.map((p) => p.z)
    const za = Math.max(z0, Math.min(...zs) + 1), zb = Math.min(z1, Math.max(...zs) - 1)
    if (zb - za < 8) continue
    const n = Math.max(1, Math.round((zb - za) / step))
    let prev: [number, number, number] | null = null
    for (let k = 0; k <= n; k++) {
      const z = za + ((zb - za) * k) / n
      // this platform's own interval at z
      const iv = platformsAt([r], z)[0]
      if (!iv) { prev = null; continue }
      const a = iv[0] - 0.7, b = iv[1] + 0.7, m = (iv[0] + iv[1]) / 2
      if (prev) {
        const [pa, pb, pz] = prev, pm = (pa + pb) / 2
        out.quad([[pa, y + 0.45, pz], [pm, y, pz], [m, y, z], [a, y + 0.45, z]], [0.1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, METAL)
        out.quad([[pm, y, pz], [pb, y + 0.45, pz], [b, y + 0.45, z], [m, y, z]], [-0.1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, METAL)
        // the fascia along each edge, one strip each
        for (const [p0, p1] of [[pa, a], [pb, b]] as const) {
          out.quad([[p0, y + 0.05, pz], [p1, y + 0.05, z], [p1, y + 0.6, z], [p0, y + 0.6, pz]], [p0 === pa ? -1 : 1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], iron, METAL)
        }
      }
      if (k % 2 === 0) prism(out, m, z, 0.76, y, 0.16, 5, iron, METAL)
      prev = [a, b, z]
    }
  }
}
