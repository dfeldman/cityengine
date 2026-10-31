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
export interface StreetLine { points: number[]; heights?: number[]; foot?: boolean; tunnel?: boolean; bridge?: boolean; layer?: number; kind?: string; width?: number; walk?: number }

/** how far either side of a street to look for the top of the embankment */
const SHOULDER = 35
/** the nearest the shoulder is taken to be: half a street and its pavements */
const NEAREST = 6
/** the shoulders' least height over the street, for a train to clear it */
const CLEAR = 3.5

/** the longest street made a bridge for crossing a cutting: a longer way would wear parapets for blocks */
const MAX_BRIDGE = 150
const lengthOf = (e: StreetLine): number => {
  const q = unpackPoints(e.points)
  let L = 0
  for (let i = 1; i < q.length; i++) L += Math.hypot(q[i].x - q[i - 1].x, q[i].z - q[i - 1].z)
  return L
}

/**
 * Surface tracks joined where two ways, and only two, meet: OSM cuts a line every few dozen metres, and a street is often just past
 * a way's end, so the top of the bank beyond it lay on the next way and the crossing was judged with one shoulder.
 */
export function joinTracks(rails: PackedRail[]): PackedRail[] {
  const open = (r: PackedRail): boolean => r.kind === 'rail' && !r.bridge && !r.funicular && !r.heights
  const key = (x: number, z: number): string => `${Math.round(x * 2)},${Math.round(z * 2)}`
  const ends = (r: PackedRail): [string, string] => [key(r.points[0], r.points[1]), key(r.points[r.points.length - 2], r.points[r.points.length - 1])]
  const at = new Map<string, PackedRail[]>()
  // (any rail at a node counts: a junction, or a tagged bridge's end, is where a chain stops)
  for (const r of rails) for (const k of ends(r)) (at.get(k) ?? at.set(k, []).get(k)!).push(r)
  const used = new Set<PackedRail>()
  const out: PackedRail[] = []
  const step = (from: PackedRail, k: string): PackedRail | null => {
    const here = at.get(k) ?? []
    if (here.length !== 2) return null
    const next = here[0] === from ? here[1] : here[0]
    return open(next) && !used.has(next) && next !== from && !!next.disused === !!from.disused ? next : null
  }
  for (const r of rails) {
    if (used.has(r)) continue
    if (!open(r)) { out.push(r); continue }
    used.add(r)
    let pts = [...r.points]
    // forwards, then backwards
    for (let n = step(r, ends(r)[1]), last = r, k = ends(r)[1]; n; ) {
      used.add(n)
      const [a, b] = ends(n)
      const q = a === k ? n.points : reversed(n.points)
      pts = [...pts, ...q.slice(2)]
      k = a === k ? b : a
      last = n
      n = step(last, k)
    }
    for (let n = step(r, ends(r)[0]), last = r, k = ends(r)[0]; n; ) {
      used.add(n)
      const [a, b] = ends(n)
      const q = b === k ? n.points : reversed(n.points)
      pts = [...q.slice(0, -2), ...pts]
      k = b === k ? a : b
      last = n
      n = step(last, k)
    }
    out.push({ ...r, points: pts })
  }
  return out
}
const reversed = (p: number[]): number[] => {
  const o: number[] = []
  for (let i = p.length - 2; i >= 0; i -= 2) o.push(p[i], p[i + 1])
  return o
}

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
export function bridgesOverStreets(railWays: PackedRail[], streets: StreetLine[], ground: (x: number, z: number) => number,
  levelled: Set<PackedRail>, nextId: () => number): { rails: PackedRail[]; spans: number; flat: number; over: number } {
  const rails = joinTracks(railWays)
  const CELL = 100
  const grid = new Map<string, { a: Pt; b: Pt; ha: number; hb: number; e: StreetLine }[]>()
  for (const e of streets) {
    if (e.foot || e.tunnel || e.bridge || !e.heights) continue
    const q = unpackPoints(e.points)
    for (let i = 1; i < q.length; i++) {
      const seg = { a: q[i - 1], b: q[i], ha: e.heights[i - 1], hb: e.heights[i], e }
      const keys = new Set([q[i - 1], q[i], { x: (q[i - 1].x + q[i].x) / 2, z: (q[i - 1].z + q[i].z) / 2 }].map((p) => `${Math.floor(p.x / CELL)},${Math.floor(p.z / CELL)}`))
      for (const k of keys) (grid.get(k) ?? grid.set(k, []).get(k)!).push(seg)
    }
  }
  const out: PackedRail[] = []
  let spans = 0, flat = 0, over = 0
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
        if (Math.min(h0, h1) - street < CLEAR) {
          /*
           * …or the other way up: the track either side lies well under the street, in its cutting, and the street is a bridge nobody
           * tagged (bare earth has a dip where the deck is, so the track follows the ground under it once the street stops lifting it).
           */
          let side = -Infinity
          for (const d of [12, 20]) { if (s - d >= 0) side = Math.max(side, g(s - d)); if (s + d <= L) side = Math.max(side, g(s + d)) }
          if (side > -Infinity && street - side >= CLEAR && lengthOf(seg.e) < MAX_BRIDGE) { if (!seg.e.bridge) over++; seg.e.bridge = true; seg.e.layer ??= 1 } else flat++
          continue
        }
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
  over += overTheBed(out, streets, ground)
  return { rails: out, spans, flat, over }
}

/**
 * A street whose corridor reaches over a track in its bed, its centre line never crossing it (2026-10-31, the Place de l'Europe, 48.8794, 2.3235: the Rue de Vienne, the Rue de Constantinople and the Rue de
 * Saint-Pétersbourg stand on the bridge over the Saint-Lazare tracks, their own centre lines stopping at the place's edge, and the track rose 7 m to their level inside their corridors). A short way
 * that stands clear of a surface track under its corridor is a deck: a corridor has nothing under it but fill.
 */
export function overTheBed(rails: PackedRail[], streets: StreetLine[], ground: (x: number, z: number) => number): number {
  const CELL = 40
  const grid = new Map<string, { a: Pt; b: Pt; ha: number; hb: number; half: number; e: StreetLine }[]>()
  for (const e of streets) {
    if (e.tunnel || e.bridge || !e.heights || e.width === undefined || lengthOf(e) >= MAX_BRIDGE) continue
    // (and the pavements OSM maps as foot ways of their own, which are most of what stood over the tracks there)
    const q = unpackPoints(e.points), half = e.foot ? e.width / 2 + 0.3 : e.width / 2 + Math.max(e.walk ?? 0, 0.6) + 0.3
    for (let i = 1; i < q.length; i++) {
      const seg = { a: q[i - 1], b: q[i], ha: e.heights[i - 1], hb: e.heights[i], half, e }
      const n = Math.ceil(Math.hypot(q[i].x - q[i - 1].x, q[i].z - q[i - 1].z) / CELL) || 1
      const keys = new Set<string>()
      for (let k = 0; k <= n; k++) keys.add(`${Math.floor((q[i - 1].x + ((q[i].x - q[i - 1].x) * k) / n) / CELL)},${Math.floor((q[i - 1].z + ((q[i].z - q[i - 1].z) * k) / n) / CELL)}`)
      for (const k of keys) (grid.get(k) ?? grid.set(k, []).get(k)!).push(seg)
    }
  }
  let n = 0
  for (const r of rails) {
    if (r.kind !== 'rail' || r.heights || r.funicular) continue
    const p = unpackPoints(r.points)
    for (let i = 1; i < p.length; i++) {
      const L = Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z), m = Math.ceil(L / 4) || 1
      for (let k = 0; k <= m; k++) {
        const x = p[i - 1].x + ((p[i].x - p[i - 1].x) * k) / m, z = p[i - 1].z + ((p[i].z - p[i - 1].z) * k) / m
        const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL)
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const s of grid.get(`${cx + a},${cz + b}`) ?? []) {
          if (s.e.bridge) continue
          const dx = s.b.x - s.a.x, dz = s.b.z - s.a.z, t = Math.max(0, Math.min(1, ((x - s.a.x) * dx + (z - s.a.z) * dz) / (dx * dx + dz * dz || 1)))
          if (Math.hypot(s.a.x + dx * t - x, s.a.z + dz * t - z) >= s.half) continue
          if (s.ha + (s.hb - s.ha) * t - ground(x, z) < CLEAR) continue
          s.e.bridge = true
          s.e.layer ??= 1
          n++
        }
      }
    }
  }
  return n
}

/** how far along a street, either way from a railway under it, its own level may be found again */
const OVER_REACH = 45
/** how far a street must drop to the railway, on both sides, to be taken for the hole in the ground under a deck */
const OVER_DIP = 2
/** …no more than this (a street that falls further over a railway has a reason), and at this grade at least: a valley is gentler */
const OVER_MOST = 8
/** …or this, over tracks on the surface: the 4 m ground has the whole of a main line's trench under it now, 10 m and more at the Batignolles */
const OVER_MOST_TRENCH = 16
const OVER_GRADE = 0.07
/** a tunnel counts this far in from its mouth: a street over the middle of the RER is on its own hill */
const OVER_MOUTH = 90

export type OverLine = StreetLine & { a?: number; b?: number; name?: string; ramp?: boolean }

/**
 * THE DIP WHERE A DECK WAS (owner, 2026-10-30, the Boulevard des Batignolles, 48.882230, 2.320778: "the overpass has a steep dip to train
 * track level - it should be an overpass"). The trains go under the boulevard in a tunnel from one mouth to the other, 30 m apart, and
 * nobody tagged a bridge. Bare earth has no deck in it, so the street followed the lidar 5 m down to the tracks' level and up again. A
 * street crossing a railway it does not stand under (`under`: tracks in a tunnel, near its mouth; `over`: tracks on the surface, unless
 * they are on a bank there, which is `bridgesOverStreets`'s) that falls to it steeply from both sides runs straight between the two tops:
 * the way over the railway is a bridge, the rest of what is lifted a ramp. Returns how many crossings it spanned.
 */
export function spanOverRailways(streets: OverLine[], under: { points: number[] }[], over: { points: number[]; bridge?: boolean; heights?: number[] }[],
  ground: (x: number, z: number) => number): number {
  const byNode = new Map<number, OverLine[]>()
  for (const e of streets) for (const n of [e.a, e.b]) if (n !== undefined) (byNode.get(n) ?? byNode.set(n, []).get(n)!).push(e)
  const usable = (e: OverLine): boolean => !e.tunnel && !e.bridge && !!e.heights && (e.layer ?? 0) >= 0
  // the way a street goes on past a node: the same name, or the only other way of its sort there
  const onward = (e: OverLine, n: number): OverLine | null => {
    const others = (byNode.get(n) ?? []).filter((o) => o !== e && usable(o) && !!o.foot === !!e.foot)
    if (e.name) return others.find((o) => o.name === e.name) ?? null
    return others.length === 1 && !others[0].name ? others[0] : null
  }
  const CELL = 100
  const lines = new Map<string, { a: Pt; b: Pt; surface: boolean }[]>()
  const file = (a: Pt, b: Pt, surface: boolean): void => {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / CELL) || 1
    const keys = new Set<string>()
    for (let k = 0; k <= n; k++) keys.add(`${Math.floor((a.x + ((b.x - a.x) * k) / n) / CELL)},${Math.floor((a.z + ((b.z - a.z) * k) / n) / CELL)}`)
    for (const k of keys) (lines.get(k) ?? lines.set(k, []).get(k)!).push({ a, b, surface })
  }
  for (const r of under) {
    const q = unpackPoints(r.points)
    const cum = [0]
    for (let i = 1; i < q.length; i++) cum.push(cum[i - 1] + Math.hypot(q[i].x - q[i - 1].x, q[i].z - q[i - 1].z))
    const L = cum[cum.length - 1]
    for (let i = 1; i < q.length; i++) {
      // (in pieces: OSM's straight run through a long tunnel is one segment)
      const n = Math.ceil((cum[i] - cum[i - 1]) / 30) || 1
      const piece = (k: number): Pt => ({ x: q[i - 1].x + ((q[i].x - q[i - 1].x) * k) / n, z: q[i - 1].z + ((q[i].z - q[i - 1].z) * k) / n })
      for (let k = 0; k < n; k++) {
        const s0 = cum[i - 1] + ((cum[i] - cum[i - 1]) * k) / n, s1 = cum[i - 1] + ((cum[i] - cum[i - 1]) * (k + 1)) / n
        if (s0 < OVER_MOUTH || L - s1 < OVER_MOUTH) file(piece(k), piece(k + 1), false)
      }
    }
  }
  for (const r of over) {
    if (r.bridge || r.heights) continue
    const q = unpackPoints(r.points)
    for (let i = 1; i < q.length; i++) file(q[i - 1], q[i], true)
  }
  type Run = { e: OverLine; i: number; d: number; h: number }
  let spanned = 0
  for (const e of streets) {
    if (!usable(e)) continue
    const p = unpackPoints(e.points)
    // (the lowest of its crossings: a main line is eight tracks, and the first of them is up the side of the dip)
    let hit: { i: number; t: number; surface: boolean; at: Pt; y: number } | null = null
    for (let i = 1; i < p.length; i++) {
      const keys = new Set([p[i - 1], p[i]].map((q) => `${Math.floor(q.x / CELL)},${Math.floor(q.z / CELL)}`))
      for (const k of keys) for (const s of lines.get(k) ?? []) {
        const x = cross(p[i - 1], p[i], s.a, s.b)
        if (!x) continue
        const y = e.heights![i - 1] + (e.heights![i] - e.heights![i - 1]) * x.t
        if (!hit || y < hit.y) hit = { i, t: x.t, surface: s.surface, y, at: { x: p[i - 1].x + (p[i].x - p[i - 1].x) * x.t, z: p[i - 1].z + (p[i].z - p[i - 1].z) * x.t } }
      }
    }
    if (!hit) continue
    const { i: at, surface, at: cx, y: here } = hit
    // the street as one line away from the crossing, each point with its way and how far along
    const walk = (first: 1 | -1): Run[] => {
      const out: Run[] = []
      let cur = e, pts = p, step: number = first, idx = first > 0 ? at : at - 1
      let d = Math.hypot(pts[idx].x - cx.x, pts[idx].z - cx.z)
      const seen = new Set<OverLine>([e])
      while (d <= OVER_REACH) {
        out.push({ e: cur, i: idx, d, h: cur.heights![idx] })
        const next = idx + step
        if (next >= 0 && next < pts.length) {
          d += Math.hypot(pts[next].x - pts[idx].x, pts[next].z - pts[idx].z)
          idx = next
          continue
        }
        const node = step > 0 ? cur.b : cur.a
        const o = node === undefined ? null : onward(cur, node)
        if (!o || seen.has(o)) break
        seen.add(o)
        cur = o
        pts = unpackPoints(o.points)
        step = o.b === node ? -1 : 1
        idx = step > 0 ? 0 : pts.length - 1
      }
      return out
    }
    const fore = walk(1), aft = walk(-1)
    if (!fore.length || !aft.length) continue
    const top = (r: Run[]): Run => r.reduce((b, q) => (q.h > b.h ? q : b))
    const t0 = top(aft), t1 = top(fore)
    const rise = Math.min(t0.h, t1.h) - here
    if (rise < OVER_DIP || rise > (surface ? OVER_MOST_TRENCH : OVER_MOST)) continue
    if ((t0.h - here) / Math.max(t0.d, 1) < OVER_GRADE || (t1.h - here) / Math.max(t1.d, 1) < OVER_GRADE) continue
    // (a surface track standing clear of the street is over it, not under it)
    if (surface && ground(cx.x, cx.z) - here > 1) continue
    const span = t0.d + t1.d
    const lift = (r: Run[], sign: number, end: Run): void => {
      for (const q of r) {
        if (q.d > end.d) break
        const v = Math.round((t0.h + ((t1.h - t0.h) * (sign * q.d + t0.d)) / (span || 1)) * 100) / 100
        if (v > q.h) q.e.heights![q.i] = v
        if (q.e !== e && v > q.h) q.e.ramp = true
      }
    }
    lift(fore, 1, t1)
    lift(aft, -1, t0)
    e.bridge = true
    e.layer ??= 1
    spanned++
  }
  return spanned
}

/** how near a track's centre a foot way counts as on it: the ties and the ballast */
const ON_TRACK = 3
/** …for this share of its length, and at least this far */
const ON_TRACK_SHARE = 0.4
const ON_TRACK_LEAST = 6

/**
 * PEOPLE ON THE TRACKS (owner, 2026-10-30, the Place de l'Europe, 48.878789, 2.323370: "there are NPCs walking on the tracks"). OSM's foot
 * ways round the Gare Saint-Lazare, its platforms and its service paths among them, are drawn at the ground the tracks lie on, with no
 * platform under them, and the crowd walked them. A foot way on the surface that runs along a track for much of its length is
 * not somewhere to walk. Returns their ids; a foot bridge over the tracks, or a tunnel under them, is not in it.
 */
export function footWaysOnTracks(edges: { id: number; points: number[]; foot?: boolean; bridge?: boolean; tunnel?: boolean; layer?: number }[], rails: PackedRail[]): Set<number> {
  const CELL = 20
  const grid = new Map<string, { a: Pt; b: Pt }[]>()
  for (const r of rails) {
    // (nobody runs a train on the Petite Ceinture, and in the 15e and the 12e the walk beside its rails is the point)
    if (r.kind !== 'rail' || r.disused) continue
    const q = unpackPoints(r.points)
    for (let i = 1; i < q.length; i++) {
      const L = Math.hypot(q[i].x - q[i - 1].x, q[i].z - q[i - 1].z), n = Math.ceil(L / CELL) || 1
      const seg = { a: q[i - 1], b: q[i] }
      const keys = new Set<string>()
      for (let k = 0; k <= n; k++) {
        const x = q[i - 1].x + ((q[i].x - q[i - 1].x) * k) / n, z = q[i - 1].z + ((q[i].z - q[i - 1].z) * k) / n
        for (const dx of [-ON_TRACK, ON_TRACK]) for (const dz of [-ON_TRACK, ON_TRACK]) keys.add(`${Math.floor((x + dx) / CELL)},${Math.floor((z + dz) / CELL)}`)
      }
      for (const k of keys) (grid.get(k) ?? grid.set(k, []).get(k)!).push(seg)
    }
  }
  const onTrack = (x: number, z: number): boolean => (grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`) ?? []).some(({ a, b }) => {
    const dx = b.x - a.x, dz = b.z - a.z, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
    return Math.hypot(a.x + dx * t - x, a.z + dz * t - z) < ON_TRACK
  })
  const out = new Set<number>()
  for (const e of edges) {
    if (!e.foot || e.bridge || e.tunnel || (e.layer ?? 0) !== 0) continue
    const p = unpackPoints(e.points)
    let on = 0, all = 0
    for (let i = 1; i < p.length; i++) {
      const L = Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z), n = Math.max(1, Math.ceil(L))
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n
        all += L / n
        if (onTrack(p[i - 1].x + (p[i].x - p[i - 1].x) * t, p[i - 1].z + (p[i].z - p[i - 1].z) * t)) on += L / n
      }
    }
    if (on >= ON_TRACK_LEAST && on >= ON_TRACK_SHARE * all) out.add(e.id)
  }
  return out
}

/*
 * ---- THE AUDIT OF EVERY LINE (owner, 2026-10-31: "take a look at all the train tracks. I'm pretty sure many of the tunnels and overpasses
 * are wrong"; tools/rail-audit.ts is the list). What follows is the Paris rail stage whole, so the bake and the audit's dry run are one code.
 */

export type RailFate = 'buried' | 'sunk' | 'open'

/**
 * What OSM's tags say of a Paris way. A tunnel or a covered way is under something. `layer` below zero, `level` below zero or `cutting=yes` is NOT
 * (2026-10-31, the throat of the Gare du Nord, 48.8895, 2.3575: nine tracks of layer=-1 side by side in the open with the layer=0 ones, and 15 km of
 * main line like them, dropped as tunnels, in the photograph as plain as their neighbours): it is below something, somewhere along it. `lyingSunk`
 * looks at the ground.
 */
export function railFate(t: { tunnel?: string; covered?: string; layer?: string; level?: string; cutting?: string }): RailFate {
  if ((t.tunnel && t.tunnel !== 'no') || t.covered === 'yes') return 'buried'
  const layer = parseInt(t.layer ?? '', 10)
  if (layer < 0) return 'sunk'
  return !(layer >= 0) && (parseFloat(t.level ?? '') < 0 || t.cutting === 'yes') ? 'sunk' : 'open'
}

/**
 * A Paris way as a track, and which list it goes on. Beyond `railFate`:
 *  - a métro line's way that is neither a tunnel nor tagged a bridge is the ramp between the two (2026-10-31: Colonel-Fabien's 186 m, Barbès's 128 m, Passy's 43 m, the two
 *    either side of Austerlitz's 136 m: 40 ways). Undrawn, every viaduct came down to the ground and stopped short of its tunnel: part of the viaduct's chain now, down to the ground at its mouth;
 *  - the métro's own yards and its open trenches (Bel-Air, Bastille) are track in the open: drawn as track, no train;
 *  - short ways are kept: OSM's last 20 m to a junction left a gap in the line (the bake's `len < 30` is for San Francisco's scraps of yard).
 */
export function parisRailRecord(t: Record<string, string | undefined>, id: number, points: number[]): { fate: RailFate; rail: PackedRail } | { fate: 'buried'; rail?: undefined; buried: boolean } {
  const fate = railFate(t)
  const r = t.railway
  if (fate === 'buried') return { fate, buried: r === 'rail' || r === 'disused' }
  const subway = r === 'subway'
  const yard = subway && !!t.service
  const trench = subway && fate === 'sunk'
  const layer = parseInt(t.layer ?? '', 10)
  const bridge = (!!t.bridge && t.bridge !== 'no') || (subway && !yard && !trench)
  return { fate, rail: {
    id, points,
    kind: r === 'tram' || r === 'light_rail' ? 'tram' : (subway && !yard && !trench) ? 'subway' : 'rail',
    ...(r === 'light_rail' ? { light: true as const } : {}),
    ...(r === 'funicular' ? { funicular: true as const } : {}),
    ...(r === 'disused' || yard || trench ? { disused: true as const } : {}),
    ...(bridge ? { bridge: true } : {}),
    ...(Number.isFinite(layer) && layer !== 0 ? { layer } : {}),
  } }
}

/** how far either side of a sunk track its banks are looked for */
const BANKS = [12, 18, 25, 40, 60, 80]
/** a cutting the ground has: this deep at the median */
const CUTTING = 3
/** a track in the bed of its neighbours: within this of a track in the open, for this share of it */
const BUNDLE = 12
const BUNDLE_SHARE = 0.6

/**
 * Which sunk ways are drawn, and which are under something. A way in a cutting the ground has lies in it (the median depth to the lower of its
 * two banks), and a way alongside tracks in the open is in their bed whatever its layer says. The rest are roofed, or the lidar reads their roof:
 * the RER C under the trees of the Quai André-Citroën (48.8495, 2.2815), a concrete deck in the photograph, stays undrawn. No way counts another
 * sunk way as its neighbour, or a double track in a covered trench would vouch for itself.
 */
export function lyingSunk(sunk: PackedRail[], open: PackedRail[], ground: (x: number, z: number) => number): { lying: PackedRail[]; roofed: PackedRail[] } {
  const CELL = 20
  const grid = new Map<string, { a: Pt; b: Pt }[]>()
  for (const r of open) {
    if (r.kind !== 'rail') continue
    const q = unpackPoints(r.points)
    for (let i = 1; i < q.length; i++) {
      const n = Math.ceil(Math.hypot(q[i].x - q[i - 1].x, q[i].z - q[i - 1].z) / CELL) || 1
      const keys = new Set<string>()
      for (let k = 0; k <= n; k++) keys.add(`${Math.floor((q[i - 1].x + ((q[i].x - q[i - 1].x) * k) / n) / CELL)},${Math.floor((q[i - 1].z + ((q[i].z - q[i - 1].z) * k) / n) / CELL)}`)
      for (const k of keys) (grid.get(k) ?? grid.set(k, []).get(k)!).push({ a: q[i - 1], b: q[i] })
    }
  }
  const beside = (x: number, z: number): boolean => {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL)
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const { a: p, b: q } of grid.get(`${cx + a},${cz + b}`) ?? []) {
      const dx = q.x - p.x, dz = q.z - p.z, t = Math.max(0, Math.min(1, ((x - p.x) * dx + (z - p.z) * dz) / (dx * dx + dz * dz || 1)))
      if (Math.hypot(p.x + dx * t - x, p.z + dz * t - z) < BUNDLE) return true
    }
    return false
  }
  const lying: PackedRail[] = [], roofed: PackedRail[] = []
  for (const r of sunk) {
    const ps = unpackPoints(r.points)
    const depths: number[] = []
    let near = 0, all = 0
    for (let i = 1; i < ps.length; i++) {
      const dx = ps[i].x - ps[i - 1].x, dz = ps[i].z - ps[i - 1].z, len = Math.hypot(dx, dz)
      for (let d = 7; d < len; d += 15) {
        const x = ps[i - 1].x + (dx / len) * d, z = ps[i - 1].z + (dz / len) * d
        const side = (s: number): number => Math.max(...BANKS.map((o) => ground(x + (s * dz / len) * o, z - (s * dx / len) * o)))
        depths.push(Math.min(side(1), side(-1)) - ground(x, z))
        all++
        if (beside(x, z)) near++
      }
    }
    depths.sort((a, b) => a - b)
    if ((depths.length && depths[depths.length >> 1] >= CUTTING) || (all && near / all >= BUNDLE_SHARE)) lying.push(r)
    else roofed.push(r)
  }
  return { lying, roofed }
}

/** The ground tiles a surface railway needs at 4 m: within `reach` of its centre line. */
export function railFineTiles(rails: { points: number[]; kind: string }[], tile: number, reach = 30): Set<string> {
  const out = new Set<string>()
  for (const r of rails) {
    if (r.kind !== 'rail') continue
    const p = r.points
    for (let i = 2; i < p.length; i += 2) {
      const n = Math.ceil(Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]) / 20) || 1
      for (let k = 0; k <= n; k++) {
        const x = p[i - 2] + ((p[i] - p[i - 2]) * k) / n, z = p[i - 1] + ((p[i + 1] - p[i - 1]) * k) / n
        for (const dx of [-reach, 0, reach]) for (const dz of [-reach, 0, reach]) out.add(`${Math.floor((x + dx) / tile)},${Math.floor((z + dz) / tile)}`)
      }
    }
  }
  return out
}

/** a run of decks end to end, each way in its order and which way round */
interface Chain { ways: { r: PackedRail; flip: boolean }[]; pts: Pt[]; cum: number[] }
const nodeKey = (x: number, z: number): string => `${Math.round(x * 2)},${Math.round(z * 2)}`
const endKeys = (r: PackedRail): [string, string] => [nodeKey(r.points[0], r.points[1]), nodeKey(r.points[r.points.length - 2], r.points[r.points.length - 1])]

/**
 * Decks joined end to end where two ways, and only two, meet. OSM cuts a bridge wherever a track changes, and a way's end is as often as not over the
 * street: a deck's two ends read from the ground there stood at the bottom of the hole it was crossing, and a viaduct lifted way by way stepped
 * wherever two ways' smoothing disagreed (rail-audit.ts: 99 steps of over a metre, up to 6.7 m).
 */
export function deckChains(decks: PackedRail[]): Chain[] {
  const at = new Map<string, PackedRail[]>()
  for (const r of decks) for (const k of endKeys(r)) (at.get(k) ?? at.set(k, []).get(k)!).push(r)
  const used = new Set<PackedRail>()
  const chains: Chain[] = []
  const next = (from: PackedRail, k: string): PackedRail | null => {
    const here = (at.get(k) ?? []).filter((o) => o !== from)
    return here.length === 1 && !used.has(here[0]) && here[0].kind === from.kind && !!here[0].disused === !!from.disused ? here[0] : null
  }
  for (const r of decks) {
    if (used.has(r)) continue
    used.add(r)
    const ways: { r: PackedRail; flip: boolean }[] = [{ r, flip: false }]
    let [k0, k1] = endKeys(r)
    for (let n = next(r, k1); n; ) {
      used.add(n)
      const [a, b] = endKeys(n)
      ways.push({ r: n, flip: b === k1 })
      k1 = a === k1 ? b : a
      n = next(n, k1)
    }
    for (let n = next(r, k0); n; ) {
      used.add(n)
      const [a, b] = endKeys(n)
      ways.unshift({ r: n, flip: a === k0 })
      k0 = b === k0 ? a : b
      n = next(n, k0)
    }
    const pts: Pt[] = []
    for (const w of ways) {
      const q = unpackPoints(w.r.points)
      if (w.flip) q.reverse()
      for (const p of pts.length ? q.slice(1) : q) pts.push(p)
    }
    const cum = [0]
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z))
    chains.push({ ways, pts, cum })
  }
  return chains
}

/** Write a chain's heights, one per point of its line, back onto its ways. */
function setChain(c: Chain, h: number[]): void {
  let i = 0
  for (const w of c.ways) {
    const n = w.r.points.length / 2
    const part = h.slice(i, i + n).map((v) => Math.round(v * 100) / 100)
    w.r.heights = w.flip ? part.reverse() : part
    i += n - 1
  }
}

/** a chain of decks up to this long runs straight from bank to bank: longer, it is a viaduct at its own height over the ground */
const STRAIGHT = 150
const LIFT_STEP = 5
/** how near a road bridge's centre line, and for what share of a métro's chain, it is running in that road */
const ROAD_BRIDGE_NEAR = 12
const ON_ROAD_SHARE = 0.3
/** what a viaduct on its banks' level must clear, under it */
const VIADUCT_CLEAR = 4.5
/** how far along a viaduct the ground is looked at for its highest, and how far its level is smoothed */
const HIGH_REACH = 40
const SMOOTH_REACH = 20
/** an end's ramp down to the ground: a métro's, not a cliff (at Bastille a 40 m chain eased 6 m in 18 m) */
const EASE_GRADE = 0.05

/**
 * The long decks: a viaduct's own height over the ground, chain by chain so no way disagrees with the next, and each TRUE end comes down to the ground
 * at a ramp's grade. An end is true unless another chain's end is at the very node (2026-10-31: "within 5 m" was the track beside it, 4 m off: the T2's decks
 * at Puteaux, 48.8802, 2.2305, stood 8 m over their own track, joined to nothing: owner, "train overpasses that are not connected at all to the train tracks").
 */
export function liftViaducts(decks: PackedRail[], ground: (x: number, z: number) => number, streets: StreetLine[] = []): { ways: number; eased: number } {
  const chains = deckChains(decks)
  // the road bridges, for a métro that runs across one in the middle of the roadway
  const CELL = 40
  const roads = new Map<string, { ax: number; az: number; bx: number; bz: number; ha?: number; hb?: number }[]>()
  for (const e of streets) {
    if (!e.bridge || e.foot || e.tunnel) continue
    const p = e.points
    for (let i = 2; i < p.length; i += 2) {
      const sg = { ax: p[i - 2], az: p[i - 1], bx: p[i], bz: p[i + 1], ha: e.heights?.[i / 2 - 1], hb: e.heights?.[i / 2] }
      const n = Math.ceil(Math.hypot(sg.bx - sg.ax, sg.bz - sg.az) / CELL) || 1
      const keys = new Set<string>()
      for (let k = 0; k <= n; k++) keys.add(`${Math.floor((sg.ax + ((sg.bx - sg.ax) * k) / n) / CELL)},${Math.floor((sg.az + ((sg.bz - sg.az) * k) / n) / CELL)}`)
      for (const k of keys) (roads.get(k) ?? roads.set(k, []).get(k)!).push(sg)
    }
  }
  /** the road bridge's own level here: NaN off any; a road with no heights of its own counts, and gives no level */
  const onRoadBridge = (x: number, z: number): { near: boolean; y: number } => {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL)
    let near = false, y = NaN, bd = ROAD_BRIDGE_NEAR
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const s of roads.get(`${cx + a},${cz + b}`) ?? []) {
      const dx = s.bx - s.ax, dz = s.bz - s.az, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / (dx * dx + dz * dz || 1)))
      const d = Math.hypot(s.ax + dx * t - x, s.az + dz * t - z)
      if (d >= ROAD_BRIDGE_NEAR) continue
      near = true
      if (d < bd && s.ha !== undefined && s.hb !== undefined) { bd = d; y = s.ha + (s.hb - s.ha) * t }
    }
    return { near, y }
  }
  const endsAt = new Map<string, number>()
  for (const c of chains) {
    const a = c.pts[0], b = c.pts[c.pts.length - 1]
    for (const q of [a, b]) { const k = nodeKey(q.x, q.z); endsAt.set(k, (endsAt.get(k) ?? 0) + 1) }
  }
  let ways = 0, eased = 0
  for (const c of chains) {
    const layer = c.ways[0].r.layer ?? 1
    // a metre and a half per layer at most: Paris's métro viaducts are layer 2, and 5.5 m a layer put Line 6 twelve metres over the Boulevard de Grenelle (BUGS.md #34)
    const lift = 6.5 + 1.5 * Math.min(2, Math.max(0, layer - 1))
    // (on the line every 5 m, not at OSM's points: 40 m apart on the straight, a window of them saw one post, and the deck stepped)
    const L = c.cum[c.cum.length - 1]
    const n = Math.max(2, Math.round(L / LIFT_STEP) + 1), ds = L / (n - 1)
    const line = { ways: [], pts: c.pts, cum: c.cum } as unknown as Line
    const g: number[] = [], roadAt: number[] = []
    let onRoad = 0
    for (let i = 0; i < n; i++) { const q = sampleLine(line, ds * i); g.push(ground(q.x, q.z)); const on = onRoadBridge(q.x, q.z); roadAt.push(on.y); if (on.near) onRoad++ }
    const hr = Math.round(HIGH_REACH / ds), sr = Math.round(SMOOTH_REACH / ds)
    const high = g.map((_, i) => {
      let m = -Infinity
      for (let k = Math.max(0, i - hr); k <= Math.min(n - 1, i + hr); k++) m = Math.max(m, g[k])
      return m + lift
    })
    /*
     * …a main line or a tram's own way goes from bank to bank at the banks' level, higher only where that would not clear what is under it: the RER C's 550 m at Issy (48.8242, 2.2626) comes off an embankment
     * 11.6 m up, and 6.5 m on top of the bank was a bridge with a ramp up to it, 20 m over the Seine's bank. The métro's viaducts have no banks: they stand on the boulevard.
     */
    const banked = c.ways[0].r.kind !== 'subway'
    /*
     * …and the Line 1 across the Pont de Neuilly (48.8866, 2.2545) is in the middle of the road, at the road's level: a line that takes its layer from a road bridge it shares, as the Line 6 on the upper deck of the
     * Bir-Hakeim (layer 2) does not, runs from end to end with nothing to clear. Up on a viaduct of its own it stood 10 m over the traffic.
     */
    const inRoad = !banked && layer < 2 && onRoad / n >= ON_ROAD_SHARE
    const line0 = (i: number): number => g[0] + ((g[n - 1] - g[0]) * i) / (n - 1)
    const onDeck = (): number[] => {
      // the road's level where it is on the road; from there straight to the chain's ends
      const out = roadAt.slice()
      if (Number.isNaN(out[0])) out[0] = g[0]
      if (Number.isNaN(out[n - 1])) out[n - 1] = g[n - 1]
      for (let i = 0, last = 0; i < n; i++) {
        if (Number.isNaN(out[i])) continue
        for (let k = last + 1; k < i; k++) out[k] = out[last] + ((out[i] - out[last]) * (k - last)) / (i - last)
        last = i
      }
      return out
    }
    const base = inRoad ? onDeck() : banked ? high.map((_, i) => Math.max(line0(i), high[i] - lift + VIADUCT_CLEAR)) : high
    const smooth = base.map((_, i) => {
      let sum = 0, q = 0
      for (let k = Math.max(0, i - sr); k <= Math.min(n - 1, i + sr); k++) { sum += base[k]; q++ }
      return sum / q
    })
    const atA = endsAt.get(nodeKey(c.pts[0].x, c.pts[0].z))! < 2, atB = endsAt.get(nodeKey(c.pts[c.pts.length - 1].x, c.pts[c.pts.length - 1].z))! < 2
    let hs = smooth
    if (atA || atB) {
      const g0 = g[0], g1 = g[n - 1]
      hs = smooth.map((v, i) => {
        const fromA = atA ? g0 + EASE_GRADE * ds * i : Infinity, fromB = atB ? g1 + EASE_GRADE * ds * (n - 1 - i) : Infinity
        return Math.min(v, Math.max(Math.min(fromA, fromB), g[i] + 0.5))
      })
      if (atA) hs[0] = g0
      if (atB) hs[n - 1] = g1
      eased++
    }
    const h = c.cum.map((d) => {
      const u = d / ds, i = Math.min(n - 2, Math.floor(u))
      return hs[i] + (hs[i + 1] - hs[i]) * (u - i)
    })
    setChain(c, h)
    ways += c.ways.length
  }
  return { ways, eased }
}

/*
 * ---- THE TRACK'S OWN LEVEL
 *
 * A railway does not dip 7 m in 30 m. Where its line does, that is the hole in bare earth under a bridge, and OSM's `bridge=yes` stops where the mapper stopped: at Pantin (48.8979, 2.3832) the way
 * after the Est's bridge starts in the middle of the hole, 19.4 m on the bank and 12.1 m at its end. Nor does it hump: that is a deck over it the survey kept. So each line's level is its ground's,
 * through a wide median and limited to a railway's grade; a run standing well clear of the ground with a rim both sides is a deck, tagged or not; and the ground under the rest is laid to the level.
 */

/** how far along a line its ground is read for its level, either way */
const BED_REACH = 60
/** a railway's steepest (the RER's ramps into their tunnels are about this; a street's hole is far past it) */
const BED_GRADE = 0.04
/** the line sampled this often */
const BED_STEP = 4
/** a run this far under the level, with a rim both sides, is a deck: the ground has the hole under a bridge */
const HOLE_DEEP = 2.5
/** …from where the ground comes back to within this of the level */
const HOLE_RIM = 0.7
/** …and no longer than this: longer is a valley */
const HOLE_LONG = 150
/** …and at least this long, or it is a culvert's dimple */
const HOLE_SHORT = 8
/** a line this short takes its level from the longer line beside it (a crossover's window is all hole) */
const BED_SHORT = 150
const BED_BESIDE = 20
/** the ground's posts within this of a line go to its level */
export const BED_WIDE = 6

interface Line { ways: { r: PackedRail; flip: boolean; s0: number; s1: number }[]; pts: Pt[]; cum: number[] }

/**
 * The lines through the yards: ways joined end to end, at a junction the two that run straightest through it. The rest of a junction are branches of their own.
 */
export function railLines(rails: PackedRail[]): Line[] {
  type End = { r: PackedRail; end: 0 | 1; dx: number; dz: number; mate?: End }
  const at = new Map<string, End[]>()
  const endsOf = new Map<PackedRail, [End, End]>()
  for (const r of rails) {
    const p = r.points, n = p.length
    const out = (x0: number, z0: number, x1: number, z1: number): [number, number] => { const L = Math.hypot(x1 - x0, z1 - z0) || 1; return [(x1 - x0) / L, (z1 - z0) / L] }
    const [ax, az] = out(p[0], p[1], p[2], p[3]), [bx, bz] = out(p[n - 2], p[n - 1], p[n - 4], p[n - 3])
    const a: End = { r, end: 0, dx: ax, dz: az }, b: End = { r, end: 1, dx: bx, dz: bz }
    endsOf.set(r, [a, b])
    for (const [e, x, z] of [[a, p[0], p[1]], [b, p[n - 2], p[n - 1]]] as const) (at.get(nodeKey(x, z)) ?? at.set(nodeKey(x, z), []).get(nodeKey(x, z))!).push(e)
  }
  for (const list of at.values()) {
    const pairs: { a: End; b: End; dot: number }[] = []
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      if (list[i].r === list[j].r || !!list[i].r.disused !== !!list[j].r.disused || list[i].r.kind !== list[j].r.kind) continue
      const dot = list[i].dx * list[j].dx + list[i].dz * list[j].dz
      if (dot < -0.8) pairs.push({ a: list[i], b: list[j], dot })
    }
    pairs.sort((p, q) => p.dot - q.dot)
    for (const { a, b } of pairs) if (!a.mate && !b.mate) { a.mate = b; b.mate = a }
  }
  const used = new Set<PackedRail>()
  const lines: Line[] = []
  for (const r of rails) {
    if (used.has(r)) continue
    used.add(r)
    const order: { r: PackedRail; flip: boolean }[] = [{ r, flip: false }]
    const [a0, b0] = endsOf.get(r)!
    for (let e = b0.mate; e && !used.has(e.r); ) {
      used.add(e.r)
      order.push({ r: e.r, flip: e.end === 1 })
      e = endsOf.get(e.r)![e.end === 1 ? 0 : 1].mate
    }
    for (let e = a0.mate; e && !used.has(e.r); ) {
      used.add(e.r)
      order.unshift({ r: e.r, flip: e.end === 0 })
      e = endsOf.get(e.r)![e.end === 1 ? 0 : 1].mate
    }
    const pts: Pt[] = []
    const ways: Line['ways'] = []
    const cum: number[] = []
    let run = 0
    for (const w of order) {
      const q = unpackPoints(w.r.points)
      if (w.flip) q.reverse()
      const s0 = run
      q.forEach((p, i) => {
        if (i === 0 && pts.length) return
        if (pts.length) run += Math.hypot(p.x - pts[pts.length - 1].x, p.z - pts[pts.length - 1].z)
        pts.push(p)
        cum.push(run)
      })
      ways.push({ ...w, s0, s1: run })
    }
    lines.push({ ways, pts, cum })
  }
  return lines
}

const sampleLine = (l: Line, s: number): Pt => {
  let lo = 0, hi = l.cum.length - 1
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (l.cum[m] <= s) lo = m; else hi = m }
  const t = (s - l.cum[lo]) / ((l.cum[hi] - l.cum[lo]) || 1)
  return { x: l.pts[lo].x + (l.pts[hi].x - l.pts[lo].x) * t, z: l.pts[lo].z + (l.pts[hi].z - l.pts[lo].z) * t }
}

/** the level at each sample, given the ground at each and which samples the way itself calls a bridge */
export function bedProfile(g: number[], tagged: boolean[], step = BED_STEP): number[] {
  const n = g.length
  const reach = Math.round(BED_REACH / step)
  const b = new Array<number>(n).fill(NaN)
  for (let i = 0; i < n; i++) {
    const w: number[] = []
    for (let k = Math.max(0, i - reach); k <= Math.min(n - 1, i + reach); k++) if (!tagged[k]) w.push(g[k])
    if (w.length >= 3) { w.sort((p, q) => p - q); b[i] = w[w.length >> 1] }
  }
  // (a long run of bridge has no ground of its own in the window: between the levels either side)
  let last = -1
  for (let i = 0; i <= n; i++) {
    if (i < n && Number.isNaN(b[i])) continue
    if (i - last > 1) for (let k = last + 1; k < i; k++) {
      if (last < 0 && i >= n) b[k] = g[k]
      else if (last < 0) b[k] = b[i]
      else if (i >= n) b[k] = b[last]
      else b[k] = b[last] + ((b[i] - b[last]) * (k - last)) / (i - last)
    }
    last = i
  }
  // the grade: a level can only fall so fast either way, so a hole wider than the window fills from its rims
  for (let i = 1; i < n; i++) b[i] = Math.max(b[i], b[i - 1] - BED_GRADE * step)
  for (let i = n - 2; i >= 0; i--) b[i] = Math.max(b[i], b[i + 1] - BED_GRADE * step)
  return b
}

/** which samples are a deck: `tagged`, and each run standing clear of the ground with a rim either side, from rim to rim */
export function holeRuns(g: number[], b: number[], step = BED_STEP): boolean[] {
  const n = g.length
  const deck = new Array<boolean>(n).fill(false)
  for (let i = 0; i < n; i++) {
    if (deck[i] || b[i] - g[i] < HOLE_DEEP) continue
    let a = i, e = i
    while (a > 0 && b[a] - g[a] >= HOLE_RIM) a--
    while (e < n - 1 && b[e] - g[e] >= HOLE_RIM) e++
    const rims = b[a] - g[a] < HOLE_RIM && b[e] - g[e] < HOLE_RIM
    const L = (e - a) * step
    if (rims && L <= HOLE_LONG && L >= HOLE_SHORT) for (let k = a; k <= e; k++) deck[k] = true
    i = e
  }
  return deck
}

/**
 * Each track's level, and its bridges from it. Returns the ways cut into pieces (a deck with its heights; the open pieces lying on the ground; a long tagged viaduct left for `liftViaducts`) and
 * the level to lay the ground's posts to.
 */
export function bedLines(rails: PackedRail[], ground: (x: number, z: number) => number, nextId: () => number): { rails: PackedRail[]; beds: { x: number; z: number; y: number }[]; holes: number; decks: number; levelled: Set<PackedRail> } {
  // (a tram's own way too: the T2 runs on the old Moulineaux line's banks, with the same holes in them, and it had every one of these faults)
  const on = (r: PackedRail): boolean => (r.kind === 'rail' || r.kind === 'tram') && !r.funicular
  const mine = rails.filter(on)
  const out: PackedRail[] = rails.filter((r) => !on(r))
  const lines = railLines(mine)
  const levelled = new Set<PackedRail>()
  const beds: { x: number; z: number; y: number }[] = []
  type S = { ss: number[]; pts: Pt[]; g: number[]; tagged: boolean[]; b: number[] }
  const data = new Map<Line, S>()
  // the long lines first
  for (const l of lines) {
    const L = l.cum[l.cum.length - 1]
    const n = Math.max(2, Math.round(L / BED_STEP) + 1)
    const ss: number[] = [], pts: Pt[] = [], g: number[] = [], tagged: boolean[] = []
    for (let i = 0; i < n; i++) {
      const s = (L * i) / (n - 1), q = sampleLine(l, s)
      ss.push(s); pts.push(q); g.push(ground(q.x, q.z))
      tagged.push(l.ways.some((w) => w.r.bridge && s >= w.s0 && s <= w.s1))
    }
    const big = L >= BED_SHORT
    data.set(l, { ss, pts, g, tagged, b: big ? bedProfile(g, tagged, L / (n - 1)) : [] })
  }
  const CELL = 30
  const grid = new Map<string, { x: number; z: number; y: number }[]>()
  for (const [l, d] of data) {
    if (!d.b.length) continue
    void l
    d.pts.forEach((p, i) => { const k = `${Math.floor(p.x / CELL)},${Math.floor(p.z / CELL)}`; (grid.get(k) ?? grid.set(k, []).get(k)!).push({ x: p.x, z: p.z, y: d.b[i] }) })
  }
  const besideLevel = (x: number, z: number): number | null => {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL)
    let best: number | null = null, bd = BED_BESIDE
    for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) for (const q of grid.get(`${cx + a},${cz + c}`) ?? []) {
      const d = Math.hypot(q.x - x, q.z - z)
      if (d < bd) { bd = d; best = q.y }
    }
    return best
  }
  let holes = 0, decks = 0
  for (const l of lines) {
    const d = data.get(l)!
    const L = l.cum[l.cum.length - 1]
    if (!d.b.length) {
      const near = d.pts.map((p) => besideLevel(p.x, p.z))
      const known = near.filter((v) => v !== null).length
      // (a short line alone is its own: its ground, straightened between its ends only by the same rule)
      d.b = known >= near.length / 2 ? near.map((v, i) => v ?? d.g[i]) : bedProfile(d.g, d.tagged, L / Math.max(1, d.g.length - 1))
    }
    const run = holeRuns(d.g, d.b, L / Math.max(1, d.g.length - 1))
    const deckAt = (i: number): boolean => run[i] || d.tagged[i]
    // a tagged run too long to be a bank-to-bank deck goes on as a viaduct, its way whole
    const longTagged = new Set<PackedRail>()
    {
      let i = 0
      while (i < d.ss.length) {
        if (!d.tagged[i]) { i++; continue }
        let e = i
        while (e + 1 < d.ss.length && d.tagged[e + 1]) e++
        if (d.ss[e] - d.ss[i] >= STRAIGHT) for (const w of l.ways) if (w.r.bridge && w.s1 >= d.ss[i] && w.s0 <= d.ss[e]) longTagged.add(w.r)
        i = e + 1
      }
    }
    const levelAt = (s: number): number => {
      const u = (s / (L || 1)) * (d.ss.length - 1), i = Math.min(d.ss.length - 2, Math.floor(u))
      return d.b[i] + (d.b[i + 1] - d.b[i]) * (u - i)
    }
    // the ground's posts go to the level: every sample not on a deck
    const viaductAt = (s: number): boolean => l.ways.some((w) => longTagged.has(w.r) && s >= w.s0 && s <= w.s1)
    d.ss.forEach((s, i) => { if (!deckAt(i) && !viaductAt(s)) beds.push({ x: d.pts[i].x, z: d.pts[i].z, y: d.b[i] }) })
    // each way, cut wherever deck and open change along it
    for (const w of l.ways) {
      if (longTagged.has(w.r)) { out.push(w.r); continue }
      const ptsOf = unpackPoints(w.r.points)
      if (w.flip) ptsOf.reverse()
      const local = [0]
      for (let i = 1; i < ptsOf.length; i++) local.push(local[i - 1] + Math.hypot(ptsOf[i].x - ptsOf[i - 1].x, ptsOf[i].z - ptsOf[i - 1].z))
      const Lw = local[local.length - 1]
      const cuts: { from: number; to: number; deck: boolean }[] = []
      for (let i = 0; i < d.ss.length - 1; i++) {
        const a = Math.max(d.ss[i], w.s0) - w.s0, e = Math.min(d.ss[i + 1], w.s1) - w.s0
        if (e <= a) continue
        const dk = deckAt(i) && deckAt(i + 1)
        const last = cuts[cuts.length - 1]
        if (last && last.deck === dk) last.to = e
        else cuts.push({ from: a, to: e, deck: dk })
      }
      if (!cuts.length) cuts.push({ from: 0, to: Lw, deck: !!w.r.bridge })
      // (a sliver of a piece goes to its neighbour)
      for (let i = cuts.length - 1; i > 0; i--) if (cuts[i].to - cuts[i].from < 2) { cuts[i - 1].to = cuts[i].to; cuts.splice(i, 1) }
      if (cuts.length > 1 && cuts[0].to - cuts[0].from < 2) { cuts[1].from = cuts[0].from; cuts.shift() }
      let first = true
      for (const c of cuts) {
        const at = (u: number): Pt => {
          let i = 1
          while (i < local.length - 1 && local[i] < u) i++
          const t = (u - local[i - 1]) / ((local[i] - local[i - 1]) || 1)
          return { x: ptsOf[i - 1].x + (ptsOf[i].x - ptsOf[i - 1].x) * t, z: ptsOf[i - 1].z + (ptsOf[i].z - ptsOf[i - 1].z) * t }
        }
        const q: Pt[] = [at(c.from)]
        const us = [c.from]
        for (let i = 0; i < ptsOf.length; i++) if (local[i] > c.from + 0.01 && local[i] < c.to - 0.01) { q.push(ptsOf[i]); us.push(local[i]) }
        q.push(at(c.to)); us.push(c.to)
        if (w.flip) { q.reverse(); us.reverse() }
        const { bridge: _b, heights: _h, ...base } = w.r
        const piece: PackedRail = { ...base, id: first ? w.r.id : nextId(), points: packPoints(q) }
        first = false
        if (c.deck) {
          piece.bridge = true
          piece.layer ??= 1
          piece.heights = us.map((u) => Math.round(levelAt(w.s0 + u) * 100) / 100)
          levelled.add(piece)
          decks++
          if (!w.r.bridge) holes++
        }
        out.push(piece)
      }
    }
  }
  return { rails: out, beds, holes, decks, levelled }
}

/** The ground's posts on a lattice (`x0 + c * step`) that a track's bed lays flat: nearest track's level within `reach`. */
export function bedPosts(beds: { x: number; z: number; y: number }[], x0: number, z0: number, step: number, reach = BED_WIDE): Map<string, number> {
  const best = new Map<string, { d: number; y: number }>()
  for (const q of beds) {
    const c0 = Math.ceil((q.x - reach - x0) / step), c1 = Math.floor((q.x + reach - x0) / step)
    const r0 = Math.ceil((q.z - reach - z0) / step), r1 = Math.floor((q.z + reach - z0) / step)
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const d = Math.hypot(x0 + c * step - q.x, z0 + r * step - q.z)
      if (d > reach) continue
      const k = `${c},${r}`, o = best.get(k)
      if (!o || d < o.d) best.set(k, { d, y: q.y })
    }
  }
  const out = new Map<string, number>()
  for (const [k, v] of best) out.set(k, v.y)
  return out
}

export interface RailStage { rails: PackedRail[]; roofed: PackedRail[]; spans: number; over: number; flat: number; holes: number; straight: number; dips: number; viaducts: number; eased: number; lying: number; posts: number }

/**
 * The Paris rail stage, from the ways as tagged to the tracks as drawn. `ground` reads the 4 m ground: every surface railway's tile ships it (`railFineTiles`). `layBed` lays its posts to the tracks' level
 * and returns how many it moved; `ground` reads them afterwards.
 */
export function levelParisRails(open: PackedRail[], sunk: PackedRail[], buried: { points: number[] }[], streets: OverLine[], ground: (x: number, z: number) => number,
  layBed: (beds: { x: number; z: number; y: number }[]) => number, nextId: () => number): RailStage {
  const { lying, roofed } = lyingSunk(sunk, open, ground)
  const bed = bedLines([...open, ...lying], ground, nextId)
  const posts = layBed(bed.beds)
  const levelled = bed.levelled
  const got = bridgesOverStreets(bed.rails, streets, ground, levelled, nextId)
  const lifted = liftViaducts(got.rails.filter((r) => r.bridge && !r.funicular && !levelled.has(r)), ground, streets)
  // (the roofed ways are as much under the streets as the tunnels are)
  const dips = spanOverRailways(streets.filter((e) => !(e as { authored?: boolean }).authored), [...buried, ...roofed], got.rails.filter((r) => r.kind === 'rail'), ground)
  return { rails: got.rails, roofed, spans: got.spans, over: got.over, flat: got.flat, holes: bed.holes, straight: bed.decks, dips, viaducts: lifted.ways, eased: lifted.eased, lying: lying.length, posts }
}

export interface OsmWayEnd { points: number[]; under: boolean }
export interface RailMouth { x: number; z: number; ox: number; oz: number; half: number; tracks: number; tight: boolean }

/** tracks side by side, one mouth: within 12 m and facing the same way. (Not 22: the two EOLE mouths in the Gare de l'Est's yard, 48.888912, 2.365957, are 22 m apart with the running lines
 *  between them, and the one wall across all of it had trains passing through it: owner, "i assume this is a train tunnel entrance but it doesn't go anywhere and looks like a wall") */
const MOUTH_GROUP = 12
/** a mouth's half-width round a single track: its opening and a pier either side */
const MOUTH_HALF = 6
/** the narrowest it is made, to let a train by on the next track */
const MOUTH_LEAST = 2.6
/** how far a train on the next track stands out from its centre line */
const TRAIN_HALF = 1.6
const BRANCH_BACK = 10

/**
 * Where a track goes under: every drawn track's end that meets a way OSM has under something (a tunnel, a covered way, a sunk way the ground has no cutting for), of any kind of railway: the
 * bake drew the surface of all of them, and took mouths only for main lines' tunnels, so the métro's ramps, the T2's tunnels, the RER C's roofed trench and the Petite Ceinture just ended.
 * The wall stops short of a track passing it (2026-10-31, the audit: mouths in the bundles of Saint-Lazare, Nord and Austerlitz stood across the next track, with the train through them).
 */
export function railMouths(under: { points: number[] }[], drawn: { points: number[]; kind: string; heights?: number[] }[]): RailMouth[] {
  type End = { x: number; z: number; ox: number; oz: number }
  const key = (x: number, z: number): string => `${Math.round(x / 3)},${Math.round(z / 3)}`
  const drawnEnds = new Map<string, Pt[]>()
  for (const r of drawn) {
    const p = r.points, n = p.length
    for (const q of [{ x: p[0], z: p[1] }, { x: p[n - 2], z: p[n - 1] }]) (drawnEnds.get(key(q.x, q.z)) ?? drawnEnds.set(key(q.x, q.z), []).get(key(q.x, q.z))!).push(q)
  }
  const meets = (x: number, z: number): boolean => {
    const cx = Math.round(x / 3), cz = Math.round(z / 3)
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const q of drawnEnds.get(`${cx + a},${cz + b}`) ?? []) if (Math.hypot(q.x - x, q.z - z) < 3) return true
    return false
  }
  // what passes a mouth: every drawn line's segments near it
  const CELL = 30
  const lineSegs = new Map<string, { ax: number; az: number; bx: number; bz: number }[]>()
  for (const r of drawn) {
    if (r.heights) continue
    const p = r.points
    for (let i = 2; i < p.length; i += 2) {
      const n = Math.ceil(Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]) / CELL) || 1
      const keys = new Set<string>()
      for (let k = 0; k <= n; k++) keys.add(`${Math.floor((p[i - 2] + ((p[i] - p[i - 2]) * k) / n) / CELL)},${Math.floor((p[i - 1] + ((p[i + 1] - p[i - 1]) * k) / n) / CELL)}`)
      const sg = { ax: p[i - 2], az: p[i - 1], bx: p[i], bz: p[i + 1] }
      for (const k of keys) (lineSegs.get(k) ?? lineSegs.set(k, []).get(k)!).push(sg)
    }
  }
  const onLine = (x: number, z: number): boolean => {
    const cx = Math.floor(x / 30), cz = Math.floor(z / 30)
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const s of lineSegs.get(`${cx + a},${cz + b}`) ?? []) {
      const dx = s.bx - s.ax, dz = s.bz - s.az, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / (dx * dx + dz * dz || 1)))
      if (Math.hypot(s.ax + dx * t - x, s.az + dz * t - z) < 1.5) return true
    }
    return false
  }
  const ends: End[] = []
  for (const w of under) {
    const c = w.points, n = c.length
    if (n < 4) continue
    const end = (x: number, z: number, ix: number, iz: number): void => {
      const dx = x - ix, dz = z - iz, L = Math.hypot(dx, dz) || 1
      if (meets(x, z)) ends.push({ x, z, ox: dx / L, oz: dz / L })
      // (a branch off the side of a track that runs on: its mouth a little way along it, clear of the track it leaves)
      else if (onLine(x, z)) ends.push({ x: x - (dx / L) * BRANCH_BACK, z: z - (dz / L) * BRANCH_BACK, ox: dx / L, oz: dz / L })
    }
    end(c[0], c[1], c[2], c[3])
    end(c[n - 2], c[n - 1], c[n - 4], c[n - 3])
  }
  const groups: End[][] = []
  for (const m of ends) {
    const g = groups.find((q) => q.some((o) => Math.hypot(o.x - m.x, o.z - m.z) < MOUTH_GROUP && o.ox * m.ox + o.oz * m.oz > 0.7))
    if (g) g.push(m)
    else groups.push([m])
  }
  return groups.map((g) => {
    const x = g.reduce((a, m) => a + m.x, 0) / g.length, z = g.reduce((a, m) => a + m.z, 0) / g.length
    const ox = g[0].ox, oz = g[0].oz
    // across the mouth, right of the way out (+) and left (−)
    const across = (px: number, pz: number): number => (px - x) * oz - (pz - z) * ox
    const offs = g.map((m) => across(m.x, m.z))
    const lo = Math.min(...offs) - MOUTH_HALF, hi = Math.max(...offs) + MOUTH_HALF
    let left = lo, right = hi
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL)
    const seen = new Set<unknown>()
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const s of lineSegs.get(`${cx + a},${cz + b}`) ?? []) {
      if (seen.has(s)) continue
      seen.add(s)
      // where this segment crosses the wall's line, just in front of the mouth
      const a0 = across(s.ax, s.az), a1 = across(s.bx, s.bz)
      const u0 = (s.ax - x) * ox + (s.az - z) * oz, u1 = (s.bx - x) * ox + (s.bz - z) * oz
      if ((u0 > 1 && u1 > 1) || (u0 < -5 && u1 < -5)) continue
      const t = Math.max(0, Math.min(1, u1 === u0 ? 0 : (-2 - u0) / (u1 - u0)))
      const off = a0 + (a1 - a0) * t
      // (a track of this mouth's own, ending at it, is in `offs`)
      if (offs.some((o) => Math.abs(o - off) < 1.5)) continue
      if (off > Math.max(...offs)) right = Math.min(right, off - TRAIN_HALF)
      else if (off < Math.min(...offs)) left = Math.max(left, off + TRAIN_HALF)
    }
    // (about its own centre: the opening is on the track)
    const least = Math.max(...offs.map(Math.abs)) + MOUTH_LEAST
    const half = Math.min(-left, right)
    return { x, z, ox, oz, half: Math.max(least, half), tracks: g.length, tight: half < least }
  })
}

/**
 * The shells of the viaducts' stations (2026-10-31; ortho and shot at Dupleix, 48.85062, 2.29294): OSM's outline of a station's long canopy, height 24-28 m by its levels, came out as a glass office block
 * standing on the Boulevard de Grenelle with the viaduct through it; the viaduct draws its own canopy (render/bridges.ts `parisViaduct`). Near a station, and not a great hall (the Gare d'Austerlitz is one), with
 * the viaduct inside it for a good length. A building the line really goes through (Passy's, on the Rue de l'Alboni) is not at a station's canopy, or stands wider than one.
 */
export function stationShells(buildings: { id: number; ring: number[]; minHeight?: number }[], rails: PackedRail[], stations: Pt[]): Set<number> {
  const out = new Set<number>()
  const decks = rails.filter((r) => r.kind === 'subway' && r.heights)
  for (const b of buildings) {
    const r = b.ring
    let a2 = 0, cx = 0, cz = 0
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) { a2 += r[j] * r[i + 1] - r[i] * r[j + 1]; cx += r[i]; cz += r[i + 1] }
    cx /= r.length / 2
    cz /= r.length / 2
    if (Math.abs(a2) / 2 > SHELL_AREA || !stations.some((s) => Math.hypot(s.x - cx, s.z - cz) < SHELL_NEAR)) continue
    const inside = (x: number, z: number): boolean => {
      let on = false
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) on = !on
      return on
    }
    let run = 0
    for (const d of decks) {
      const p = d.points
      for (let i = 2; i < p.length; i += 2) {
        const L = Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]), n = Math.ceil(L / 2) || 1
        for (let k = 0; k < n; k++) if (inside(p[i - 2] + ((p[i] - p[i - 2]) * (k + 0.5)) / n, p[i - 1] + ((p[i + 1] - p[i - 1]) * (k + 0.5)) / n)) run += L / n
      }
    }
    if (run >= SHELL_RUN) out.add(b.id)
  }
  return out
}
/** a station's shell: no bigger than a long canopy, this near its station, and with this much of the viaducts (both tracks' worth) inside it */
const SHELL_AREA = 2500
const SHELL_NEAR = 70
const SHELL_RUN = 12
