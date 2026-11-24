/**
 * The Pont Rouelle (RER C over the Seine and the Île aux Cygnes, 1900): drawn from its OSM outline (way 623828794) and the two tracks on it, as a
 * rail-only structure like the Viaduc d'Austerlitz (render/bridge-structures.ts `RAIL_ARCHES`). Source, fr.wikipedia "Pont Rouelle" (read 2026-11-16):
 * about 370 m long and 20 m wide, steel, concrete and dressed stone, no road. From the right bank: three flattened masonry arches over the
 * voie Georges-Pompidou; one steel arch of 85.7 m with an intermediate deck over the right arm, no pier in the river; a small stone arch of 6.6 m over
 * the Île aux Cygnes' path; three steel arches of 28 m on two piers over the left arm. The generic rail viaduct's deck (render/bridges.ts) stays
 * on top at the rail heights; this is what carries it, drawn beneath and beside it.
 * The colour is not in the source: the ironwork a grey-green like the Austerlitz bows, the masonry the pale Paris stone (a guess to check on a photo).
 */
import type { MeshBuilder } from './buildings.ts'
import type { PackedRail } from '../city/package.ts'

type Rgb = [number, number, number]
type P = { x: number; z: number }
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** the deck's half width (two tracks and their edges), and the ribs' and parapets' lateral offset (m) */
export const ROUELLE_DECK_HALF = 6.2, ROUELLE_RIB_HALF = 6.6
/** the deck structure's depth under the rail height (m): a slab's underside; the generic viaduct's girders hang to 1.65 */
export const ROUELLE_SLAB_DOWN = 1.7, ROUELLE_SLAB_TOP = 0.12
/** the steel arch over the right arm: springing under the deck this far, crown above the deck by RISE - SPRING; ribs' member sizes */
export const ROUELLE_ARCH_SPRING = 6, ROUELLE_ARCH_RISE = 17, ROUELLE_ARCH_LOWER = 0.55, ROUELLE_ARCH_UPPER = 0.32, ROUELLE_ARCH_SEGS = 30
/** the left arm's three arches: a rise under the deck, spans, the posts' spacing */
export const ROUELLE_SMALL_SPANS = 3, ROUELLE_SMALL_RISE = 4.5, ROUELLE_SMALL_POSTS = 3.5
/** the masonry arches over the voie Pompidou, the island's arch (opening m) and the piers' half thickness along the track */
export const ROUELLE_APPROACH_ARCHES = 3, ROUELLE_APPROACH_RISE = 2.6, ROUELLE_ISLAND_OPENING = 6.6, ROUELLE_PIER_HALF = 1.6
/** a span's end is the water's edge plus this (the abutment sits on the bank) and a run of water shorter than MIN_RUN is not a span */
export const ROUELLE_BANK_PAD = 4, ROUELLE_MIN_RUN = 15
/** the moving mean over the rail heights, ±m: the baked heights sag in mid-river, the deck is drawn with them */
export const ROUELLE_HEIGHT_MEAN = 3
const IRON: Rgb = [0.3, 0.36, 0.34]
const STONE: Rgb = [0.7, 0.66, 0.58]
const SOFFIT: Rgb = [0.5, 0.48, 0.44]
const SLAB: Rgb = [0.42, 0.41, 0.39]

interface Line { n: number; x: number[]; z: number[]; y: number[]; nx: number[]; nz: number[] }

function inRing(r: P[], x: number, z: number): boolean {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
  }
  return o
}

/** the tracks on the outline, as one centre line resampled every metre: point, rail height, normal (to the left of the way along) */
function centreLine(ring: P[], rails: PackedRail[]): Line | null {
  const tracks: { x: number; z: number; y: number }[][] = []
  for (const r of rails) {
    if (!r.heights) continue
    const pts: { x: number; z: number; y: number }[] = []
    for (let i = 0; i < r.heights.length; i++) {
      const x = r.points[2 * i], z = r.points[2 * i + 1]
      if (inRing(ring, x, z)) pts.push({ x, z, y: r.heights[i] })
    }
    if (pts.length >= 4) tracks.push(pts)
  }
  if (!tracks.length) return null
  tracks.sort((a, b) => b.length - a.length)
  let a = tracks[0]
  // (the two tracks' middle: the first track moved half way to the nearest point of the second)
  if (tracks[1]) {
    const b = tracks[1]
    let mx = 0, mz = 0
    for (const p of a) {
      let best = b[0], bd = Infinity
      for (const q of b) { const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2; if (d < bd) { bd = d; best = q } }
      mx += (best.x - p.x) / 2; mz += (best.z - p.z) / 2
    }
    mx /= a.length; mz /= a.length
    a = a.map((p) => ({ x: p.x + mx, z: p.z + mz, y: p.y }))
  }
  // from the east (the right bank) to the west
  if (a[0].x < a[a.length - 1].x) a = a.slice().reverse()
  const cum = [0]
  for (let i = 1; i < a.length; i++) cum.push(cum[i - 1] + Math.hypot(a[i].x - a[i - 1].x, a[i].z - a[i - 1].z))
  const n = Math.floor(cum[cum.length - 1]) + 1
  if (n < 40) return null
  const L: Line = { n, x: [], z: [], y: [], nx: [], nz: [] }
  let k = 0
  for (let s = 0; s < n; s++) {
    while (k < a.length - 2 && cum[k + 1] < s) k++
    const f = Math.min(1, Math.max(0, (s - cum[k]) / ((cum[k + 1] - cum[k]) || 1)))
    L.x.push(a[k].x + (a[k + 1].x - a[k].x) * f)
    L.z.push(a[k].z + (a[k + 1].z - a[k].z) * f)
    L.y.push(a[k].y + (a[k + 1].y - a[k].y) * f)
  }
  const raw = L.y.slice()
  for (let s = 0; s < n; s++) {
    let t = 0, c = 0
    for (let d = -ROUELLE_HEIGHT_MEAN; d <= ROUELLE_HEIGHT_MEAN; d++) { const j = s + d; if (j >= 0 && j < n) { t += raw[j]; c++ } }
    L.y[s] = t / c
  }
  for (let s = 0; s < n; s++) {
    const i0 = Math.max(0, s - 2), i1 = Math.min(n - 1, s + 2)
    const tx = L.x[i1] - L.x[i0], tz = L.z[i1] - L.z[i0], l = Math.hypot(tx, tz) || 1
    L.nx.push(-tz / l); L.nz.push(tx / l)
  }
  return L
}

export function rouelle(out: MeshBuilder, ring: P[], rails: PackedRail[], wetAt: (x: number, z: number) => number | null,
  groundAt: (x: number, z: number) => number): void {
  const L = centreLine(ring, rails)
  if (!L) return
  const at = (s: number): { x: number; z: number; y: number; nx: number; nz: number } => {
    const c = Math.min(L.n - 1.001, Math.max(0, s)), i = Math.floor(c), f = c - i
    const m = (a: number[]): number => a[i] + (a[i + 1] - a[i]) * f
    return { x: m(L.x), z: m(L.z), y: m(L.y), nx: m(L.nx), nz: m(L.nz) }
  }
  const pt = (s: number, o: number, y: number): V3 => { const q = at(s); return [q.x + q.nx * o, y, q.z + q.nz * o] }
  const deckY = (s: number): number => at(s).y
  // the river's runs along the line, and the water level there
  const wet: boolean[] = []
  let level = Infinity
  for (let s = 0; s < L.n; s++) { const q = at(s), w = wetAt(q.x, q.z); wet.push(w !== null); if (w !== null) level = Math.min(level, w) }
  const runs: [number, number][] = []
  for (let s = 0; s < L.n; s++) {
    if (!wet[s]) continue
    let e = s
    while (e + 1 < L.n && wet[e + 1]) e++
    runs.push([s, e]); s = e
  }
  // (the island's path splits the river in two: a run is closed over a gap shorter than this)
  const merged: [number, number][] = []
  for (const r of runs) {
    const last = merged[merged.length - 1]
    if (last && r[0] - last[1] < 3) last[1] = r[1]; else merged.push([r[0], r[1]])
  }
  const rs = merged.filter((r) => r[1] - r[0] >= ROUELLE_MIN_RUN)
  if (!rs.length) return
  const main = rs[0], left = rs.length > 1 ? rs[rs.length - 1] : null
  const bed = (s: number, o = 0): number => { const q = at(s), w = wetAt(q.x + q.nx * o, q.z + q.nz * o); return w !== null ? w - 2.5 : groundAt(q.x + q.nx * o, q.z + q.nz * o) - 0.3 }
  const H = ROUELLE_DECK_HALF
  const top = (s: number): number => deckY(s) - ROUELLE_SLAB_TOP
  const under = (s: number): number => deckY(s) - ROUELLE_SLAB_DOWN

  /** a vertical wall at lateral offset o between s0 and s1, from lo(s) to hi(s), facing outward (sign) */
  const wall = (s0: number, s1: number, o: number, lo: (s: number) => number, hi: (s: number) => number, col: Rgb, sign: number): void => {
    for (let s = s0; s < s1 - 1e-6; s++) {
      const e = Math.min(s1, s + 1)
      const l0 = lo(s), l1 = lo(e), h0 = hi(s), h1 = hi(e)
      if (h0 - l0 < 0.02 && h1 - l1 < 0.02) continue
      const a = at(s)
      out.quad([pt(s, o, l0), pt(e, o, l1), pt(e, o, h1), pt(s, o, h0)], [a.nx * sign, 0, a.nz * sign], UV, col, 0)
    }
  }
  /** a horizontal strip between laterals o0 and o1 at height y(s), facing up (up true) or down */
  const strip = (s0: number, s1: number, o0: number, o1: number, y: (s: number) => number, col: Rgb, upward: boolean): void => {
    for (let s = s0; s < s1 - 1e-6; s++) {
      const e = Math.min(s1, s + 1)
      out.quad([pt(s, o0, y(s)), pt(s, o1, y(s)), pt(e, o1, y(e)), pt(e, o0, y(e))], [0, upward ? 1 : -1, 0], UV, col, 0)
    }
  }
  /** an arched wall run: piers at the given s, arches (segmental, rising `rise` under the deck) between, both faces; the soffit under each */
  const arches = (s0: number, s1: number, n: number, rise: number, col: Rgb, springBelow: number): void => {
    const span = (s1 - s0) / n
    for (const side of [-1, 1]) {
      const o = side * H
      // the crown is 0.9 under the slab; the springing `rise` below the crown; a flat circular curve between
      const intr = (s: number): number => {
        const u = ((s - s0) % span + span) % span / span
        const edge = Math.min(u, 1 - u)
        if (edge * span < ROUELLE_PIER_HALF) return bed(s, o)
        const w = (span - 2 * ROUELLE_PIER_HALF) / 2
        const d = Math.min(1, Math.abs(u * span - span / 2) / w)
        const crown = under(s) - 0.4
        return crown - rise * d * d
      }
      wall(s0, s1, o, intr, (s) => deckY(s) + 0.9, col, side)
    }
    // the soffit, and the piers' sides under the deck are the walls themselves
    strip(s0, s1, -H, H, (s) => {
      const u = ((s - s0) % span + span) % span / span
      const edge = Math.min(u, 1 - u)
      const w = (span - 2 * ROUELLE_PIER_HALF) / 2
      const d = Math.min(1, Math.abs(u * span - span / 2) / w)
      return edge * span < ROUELLE_PIER_HALF ? under(s) - 0.4 : under(s) - 0.4 - rise * d * d
    }, SOFFIT, false)
  }
  /** a stone pier of the given centre s and half length, from the bed to just under the deck, across the deck's width */
  const pier = (s: number, half: number, top0: number): void => {
    for (const side of [-1, 1]) wall(s - half, s + half, side * (H + 0.5), (q) => bed(q, side * H), (q) => (top0 > -1e8 ? top0 : under(q)), STONE, side)
    for (const e of [-1, 1]) {
      const q = at(s + e * half)
      const lo = bed(s + e * half, 0), hi = top0 > -1e8 ? top0 : under(s + e * half)
      out.quad([pt(s + e * half, -(H + 0.5), lo), pt(s + e * half, H + 0.5, lo), pt(s + e * half, H + 0.5, hi), pt(s + e * half, -(H + 0.5), hi)], [(L.nz[Math.round(s)] ?? 0) * e, 0, -(L.nx[Math.round(s)] ?? 0) * e], UV, STONE, 0)
      void q
    }
  }

  // the deck's slab over the whole line: its top just under the generic deck, its underside, its two fascias, and a parapet each side
  strip(0, L.n - 1, -H, H, top, SLAB, true)
  strip(0, L.n - 1, -H, H, under, SOFFIT, false)
  for (const side of [-1, 1]) {
    wall(0, L.n - 1, side * H, under, (s) => deckY(s) + 0.8, STONE, side)
    wall(0, L.n - 1, side * (H - 0.25), (s) => deckY(s) - 0.1, (s) => deckY(s) + 0.8, IRON, -side)
  }

  // the right bank: three flattened masonry arches up to the river's first abutment
  const eastEnd = Math.max(8, main[0] - ROUELLE_BANK_PAD)
  arches(0, eastEnd, ROUELLE_APPROACH_ARCHES, ROUELLE_APPROACH_RISE, STONE, 0)

  // the steel arch over the right arm: bows beside the deck, hangers above it, posts under it, stone abutments
  {
    const sa = main[0] - ROUELLE_BANK_PAD, sb = main[1] + ROUELLE_BANK_PAD, span = sb - sa, mid = (sa + sb) / 2
    const yRef = (deckY(sa) + deckY(sb)) / 2
    const crown = (s: number): number => yRef - ROUELLE_ARCH_SPRING + ROUELLE_ARCH_RISE * (1 - ((s - mid) / (span / 2)) ** 2)
    for (const side of [-1, 1]) {
      const o = side * ROUELLE_RIB_HALF
      const N = ROUELLE_ARCH_SEGS
      for (let i = 0; i < N; i++) {
        const s0 = sa + (span * i) / N, s1 = sa + (span * (i + 1)) / N
        member(out, pt(s0, o, crown(s0) - 0.5), pt(s1, o, crown(s1) - 0.5), ROUELLE_ARCH_LOWER, IRON)
        member(out, pt(s0, o, crown(s0) + 0.5), pt(s1, o, crown(s1) + 0.5), ROUELLE_ARCH_UPPER, IRON)
        if (i % 2 === 0) member(out, pt(s0, o, crown(s0) - 0.5), pt(s1, o, crown(s1) + 0.5), 0.1, IRON)
      }
      for (let i = 1; i < N; i++) {
        const s = sa + (span * i) / N
        // hangers where the bow is above the deck, posts where it is below
        member(out, pt(s, o, deckY(s)), pt(s, o, crown(s) - 0.5), 0.1, IRON)
      }
    }
    // the portal bracing across the top of the bows
    for (const f of [0.35, 0.42, 0.5, 0.58, 0.65]) {
      const s = sa + span * f
      member(out, pt(s, -ROUELLE_RIB_HALF, crown(s) + 0.2), pt(s, ROUELLE_RIB_HALF, crown(s) + 0.2), 0.18, IRON)
    }
    pier(sa + 1.5, 2.5, -1e9)
    pier(sb - 1.5, 2.5, -1e9)
  }

  // the island's small stone arch (opening 6.6 m) between the two arms
  if (left) {
    const g0 = main[1] + ROUELLE_BANK_PAD, g1 = left[0] - ROUELLE_BANK_PAD
    if (g1 - g0 > 2) arches(g0, g1, 1, 2.2, STONE, 0)
    // the left arm: three steel arches on two piers, posts to the deck
    const sa = left[0] - ROUELLE_BANK_PAD, sb = left[1] + ROUELLE_BANK_PAD, span = (sb - sa) / ROUELLE_SMALL_SPANS
    for (let k = 0; k < ROUELLE_SMALL_SPANS; k++) {
      const s0 = sa + k * span, s1 = s0 + span
      const springY = (s: number): number => under(s) - ROUELLE_SMALL_RISE
      const rib = (s: number): number => { const u = (s - s0) / span; return springY(s) + ROUELLE_SMALL_RISE * 0.92 * (1 - (2 * u - 1) ** 2) }
      for (const side of [-1, 1]) {
        const o = side * (H - 0.4)
        const N = 12
        for (let i = 0; i < N; i++) {
          const a0 = s0 + (span * i) / N, a1 = s0 + (span * (i + 1)) / N
          member(out, pt(a0, o, rib(a0)), pt(a1, o, rib(a1)), 0.38, IRON)
        }
        for (let s = s0 + ROUELLE_SMALL_POSTS; s < s1 - 1; s += ROUELLE_SMALL_POSTS) member(out, pt(s, o, rib(s)), pt(s, o, under(s)), 0.12, IRON)
      }
      for (const s of [s0 + span * 0.25, s0 + span * 0.5, s0 + span * 0.75]) member(out, pt(s, -H + 0.4, rib(s)), pt(s, H - 0.4, rib(s)), 0.14, IRON)
    }
    for (let k = 0; k <= ROUELLE_SMALL_SPANS; k++) pier(sa + k * span, k === 0 || k === ROUELLE_SMALL_SPANS ? 2 : 1.6, -1e9)
    // the left bank: the line runs on past the river, on a stone wall down to the ground
    const wFrom = sb
    for (const side of [-1, 1]) wall(wFrom, L.n - 1, side * H, (s) => groundAt(at(s).x + at(s).nx * side * H, at(s).z + at(s).nz * side * H) - 0.3, under, STONE, side)
  }
}

/** a square member between two points (as bridge-structures.ts `member`) */
function member(out: MeshBuilder, a: V3, b: V3, r: number, c: Rgb): void {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]
  const l = Math.hypot(dx, dy, dz) || 1
  let sx = -dz, sz = dx
  const hl = Math.hypot(sx, sz)
  if (hl < 1e-6) { sx = 1; sz = 0 } else { sx /= hl; sz /= hl }
  const ux = (sz * dy) / l, uy = (sx * dz - sz * dx) / l, uz = (-sx * dy) / l
  const v = (p: V3, s: number, u: number): V3 => [p[0] + (sx * s + ux * u) * r, p[1] + uy * u * r, p[2] + (sz * s + uz * u) * r]
  const faces: [number, number, number, number, V3][] = [
    [-1, 1, 1, 1, [ux, uy, uz]], [1, -1, -1, -1, [-ux, -uy, -uz]],
    [-1, -1, -1, 1, [-sx, 0, -sz]], [1, 1, 1, -1, [sx, 0, sz]],
  ]
  for (const [s0, u0, s1, u1, n] of faces) out.quad([v(a, s0, u0), v(b, s0, u0), v(b, s1, u1), v(a, s1, u1)], n, UV, c, 0)
}
