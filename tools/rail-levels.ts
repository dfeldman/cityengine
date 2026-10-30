/**
 * WHICH IS ON TOP WHERE A STREET MEETS A RAILWAY (owner, 2026-10-30: "all train tracks from OSM are in bad shape vertically. most
 * are sunken or on embankments, with almost zero grade crossings"; "a lot of overpasses that are not on OSM at all", 48.830189,
 * 2.335043). The lidar has the embankments and the cuttings. What bare earth has not got is the bridge: where a street goes under
 * an embankment the ground dips to the street, a track laid on the ground dives down with it, and they cross at grade. So at every
 * crossing the ground either side says which is which: a track whose shoulders stand clear over the street is on a bridge, tagged or
 * not, and runs straight from shoulder to shoulder.
 */
import { packPoints, unpackPoints, type PackedRail } from '../src/city/package.ts'

type Pt = { x: number; z: number }
export interface StreetLine { points: number[]; heights?: number[]; foot?: boolean; tunnel?: boolean; bridge?: boolean; kind?: string }

/** how far either side of a street to look for the top of the embankment */
const SHOULDER = 35
/** the nearest the shoulder is taken to be: half a street and its pavements */
const NEAREST = 6
/** the shoulders' least height over the street, for a train to clear it */
const CLEAR = 3.5

const cross = (a: Pt, b: Pt, c: Pt, d: Pt): { t: number; u: number } | null => {
  const rx = b.x - a.x, rz = b.z - a.z, sx = d.x - c.x, sz = d.z - c.z
  const den = rx * sz - rz * sx
  if (Math.abs(den) < 1e-9) return null
  const t = ((c.x - a.x) * sz - (c.z - a.z) * sx) / den
  const u = ((c.x - a.x) * rz - (c.z - a.z) * rx) / den
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { t, u } : null
}

/** A tagged bridge's deck runs straight between its ends, where the track either side of it comes out of the ground it lies on. */
export function straightDeck(r: PackedRail, ground: (x: number, z: number) => number): void {
  const ps = unpackPoints(r.points)
  const a = ground(ps[0].x, ps[0].z), b = ground(ps[ps.length - 1].x, ps[ps.length - 1].z)
  let L = 0
  const cum = [0]
  for (let i = 1; i < ps.length; i++) cum.push(L += Math.hypot(ps[i].x - ps[i - 1].x, ps[i].z - ps[i - 1].z))
  r.heights = cum.map((c) => Math.round((a + ((b - a) * c) / (L || 1)) * 100) / 100)
}

/**
 * The untagged bridges: each surface track cut at the shoulders round every street it stands over, the piece between them a deck.
 * `levelled` collects the decks made, which the caller leaves alone. New pieces take ids from `nextId`.
 */
export function bridgesOverStreets(rails: PackedRail[], streets: StreetLine[], ground: (x: number, z: number) => number,
  levelled: Set<PackedRail>, nextId: () => number): { rails: PackedRail[]; spans: number; flat: number } {
  const CELL = 100
  const grid = new Map<string, { a: Pt; b: Pt; ha: number; hb: number }[]>()
  for (const e of streets) {
    if (e.foot || e.tunnel || e.bridge || !e.heights) continue
    const q = unpackPoints(e.points)
    for (let i = 1; i < q.length; i++) {
      const seg = { a: q[i - 1], b: q[i], ha: e.heights[i - 1], hb: e.heights[i] }
      const keys = new Set([q[i - 1], q[i], { x: (q[i - 1].x + q[i].x) / 2, z: (q[i - 1].z + q[i].z) / 2 }].map((p) => `${Math.floor(p.x / CELL)},${Math.floor(p.z / CELL)}`))
      for (const k of keys) (grid.get(k) ?? grid.set(k, []).get(k)!).push(seg)
    }
  }
  const out: PackedRail[] = []
  let spans = 0, flat = 0
  for (const r of rails) {
    if (r.kind !== 'rail' || r.bridge || r.funicular || r.heights) { out.push(r); continue }
    const ps = unpackPoints(r.points)
    const cum = [0]
    for (let i = 1; i < ps.length; i++) cum.push(cum[i - 1] + Math.hypot(ps[i].x - ps[i - 1].x, ps[i].z - ps[i - 1].z))
    const L = cum[cum.length - 1]
    const at = (s: number): Pt => {
      let i = 1
      while (i < cum.length - 1 && cum[i] < s) i++
      const t = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1)
      return { x: ps[i - 1].x + (ps[i].x - ps[i - 1].x) * t, z: ps[i - 1].z + (ps[i].z - ps[i - 1].z) * t }
    }
    const g = (s: number): number => { const q = at(s); return ground(q.x, q.z) }
    const cuts: { s0: number; s1: number; h0: number; h1: number }[] = []
    for (let i = 1; i < ps.length; i++) {
      const cx0 = Math.floor(Math.min(ps[i - 1].x, ps[i].x) / CELL), cx1 = Math.floor(Math.max(ps[i - 1].x, ps[i].x) / CELL)
      const cz0 = Math.floor(Math.min(ps[i - 1].z, ps[i].z) / CELL), cz1 = Math.floor(Math.max(ps[i - 1].z, ps[i].z) / CELL)
      const seen = new Set<unknown>()
      for (let cx = cx0; cx <= cx1; cx++) for (let cz = cz0; cz <= cz1; cz++) for (const seg of grid.get(`${cx},${cz}`) ?? []) {
        if (seen.has(seg)) continue
        seen.add(seg)
        const hit = cross(ps[i - 1], ps[i], seg.a, seg.b)
        if (!hit) continue
        const s = cum[i - 1] + (cum[i] - cum[i - 1]) * hit.t
        const street = seg.ha + (seg.hb - seg.ha) * hit.u
        // the top of the bank on each side, within reach and on this way
        let s0 = Math.max(0, s - NEAREST), s1 = Math.min(L, s + NEAREST)
        for (let d = NEAREST; d <= SHOULDER; d += 2) {
          if (s - d >= 0 && g(s - d) > g(s0)) s0 = s - d
          if (s + d <= L && g(s + d) > g(s1)) s1 = s + d
        }
        const h0 = g(s0), h1 = g(s1)
        if (Math.min(h0, h1) - street < CLEAR) { flat++; continue }
        cuts.push({ s0, s1, h0, h1 })
      }
    }
    if (!cuts.length) { out.push(r); continue }
    cuts.sort((a, b) => a.s0 - b.s0)
    const merged: typeof cuts = []
    for (const c of cuts) {
      const m = merged[merged.length - 1]
      if (m && c.s0 <= m.s1) { if (c.s1 > m.s1) { m.s1 = c.s1; m.h1 = c.h1 } } else merged.push({ ...c })
    }
    // the way in pieces, the deck between each pair of shoulders
    const between = (s0: number, s1: number): Pt[] => {
      const q: Pt[] = [at(s0)]
      for (let i = 0; i < ps.length; i++) if (cum[i] > s0 + 0.01 && cum[i] < s1 - 0.01) q.push(ps[i])
      q.push(at(s1))
      return q
    }
    let from = 0
    let first = true
    const piece = (pts: Pt[], extra: Partial<PackedRail>): PackedRail => {
      const p: PackedRail = { ...r, id: first ? r.id : nextId(), points: packPoints(pts), ...extra }
      first = false
      return p
    }
    for (const c of merged) {
      if (c.s0 - from > 1) out.push(piece(between(from, c.s0), {}))
      const q = between(c.s0, c.s1)
      let run = 0
      const hs = q.map((p, i) => { if (i) run += Math.hypot(p.x - q[i - 1].x, p.z - q[i - 1].z); return run })
      const deck = piece(q, { bridge: true, layer: 1, heights: hs.map((d) => Math.round((c.h0 + ((c.h1 - c.h0) * d) / (run || 1)) * 100) / 100) })
      levelled.add(deck)
      out.push(deck)
      spans++
      from = c.s1
    }
    if (L - from > 1) out.push(piece(between(from, L), {}))
  }
  return { rails: out, spans, flat }
}
