/**
 * La Défense's raised decks from BD TOPO (docs/DEFENSE-WALKWAYS.md). The `footBridgeLayers` cap (one storey) left the real decks
 * 3–9 m low: BD TOPO `troncon_de_route` has La Jetée at NGF 65.6–66.7 and the Passerelle des Reflets at 58.2, 12–14 m over what
 * they cross. Inside a cap zone, a foot bridge's vertices matched to a BD TOPO line above ground (sol 1) take its z, in the
 * package's datum; the offset NGF → package is measured in the zone itself, from at-grade roads matched to sol 0 lines.
 * Pure functions; the bake (tools/bake.ts) fetches the BD TOPO pages (cached by fetchBdTopo) and calls them. Nothing is persisted.
 */
import { btMatchEdge, btSol, type BtSeg, type SegIndex } from './bdtopo-zones.ts'
import type { PackedEdge, PackedBuilding } from '../src/city/package.ts'
import { unpackPoints } from '../src/city/package.ts'

/** a matched vertex more than this off the median of the edge's other matches is a bad match (another level's line) */
export const BT_DECK_AGREE = 5
/** an edge with a single match takes it only within this of the height the bridge pass gave it */
export const BT_DECK_LONE_MOVE = 5
/** a deck end joined to nothing comes down to the ground at this grade (a ramp you could ride), unless it is already within 1 m */
export const BT_FREE_END_GRADE = Number(process.env.BT_FREE_END_GRADE ?? 0.08)
/** BT_FOOT_DECKS=0 in the env: the old layer cap only */
export const BT_FOOT_DECKS = process.env.BT_FOOT_DECKS !== '0'
/** a measured NGF → package offset needs this many matched at-grade vertices, else the decks are left as they are */
export const BT_OFFSET_MIN = 20
/** a deck vertex taken from BD TOPO must stand at least this far over the ground the game has (a real deck, not a sol-1 scrap) */
export const BT_DECK_MIN_OVER = 1.5
/** …and at most this far from the height the bridge pass gave it (a bad match onto another level) */
export const BT_DECK_MAX_MOVE = 15

type Cap = { x: number; z: number; radius: number }
const inCaps = (caps: Cap[], x: number, z: number): boolean => caps.some((c) => Math.hypot(x - c.x, z - c.z) < c.radius)
const median = (v: number[]): number => { const s = [...v].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2 }

/** NGF − package height, from at-grade roads in the zones matched to BD TOPO sol 0 (null when too few) */
export function btOffset(edges: PackedEdge[], segs: BtSeg[] | SegIndex, caps: Cap[]): number | null {
  const d: number[] = []
  for (const e of edges) {
    if (e.bridge || e.tunnel || e.foot || !e.heights || !inCaps(caps, e.points[0], e.points[1])) continue
    btMatchEdge(e, segs, (s) => btSol(s.f) === '0').forEach((m, i) => { if (m) d.push(m.z - e.heights![i]) })
  }
  return d.length >= BT_OFFSET_MIN ? median(d) : null
}

/**
 * Each foot bridge with a vertex in a zone: vertices matched to a sol-1 BD TOPO line take z − offset; the unmatched vertices
 * between matched ones are interpolated; those before the first / after the last ease back to the end the bridge pass left
 * (the end is where it meets the dalle, a stair or another deck — `alignDeckEnds` and `meetDecks` run after). Returns ids changed.
 */
export function btFootDecks(edges: PackedEdge[], segs: BtSeg[] | SegIndex, caps: Cap[], offset: number, ground: (x: number, z: number) => number): number[] {
  const out: number[] = []
  // (an end a way at grade, a stair or a ramp meets stays where it is: the deck eases to it, so no new drop at its foot)
  const pinned = new Set<number>()
  // (…and so does one a ROAD deck meets: the Promenade de la Rose de Cherbourg lands on the Rue des Michets Petray's own deck)
  for (const e of edges) if ((!e.bridge || !e.foot) && !e.tunnel && e.heights) { pinned.add(e.a); pinned.add(e.b) }
  for (const e of edges) {
    if (!e.bridge || !e.foot || !e.heights || e.heights.length < 2) continue
    const p = unpackPoints(e.points)
    if (!p.some((q) => inCaps(caps, q.x, q.z))) continue
    const m = btMatchEdge(e, segs, (s) => btSol(s.f) === '1')
    const want = m.map((v, i) => {
      if (!v) return null
      const h = v.z - offset
      return h - ground(p[i].x, p[i].z) >= BT_DECK_MIN_OVER && Math.abs(h - e.heights![i]) <= BT_DECK_MAX_MOVE ? h : null
    })
    // (Place du Sud: one vertex matched a line 20 m over the deck. A match off its neighbours', or a lone one far off the old height, is dropped)
    const got = want.filter((v): v is number => v !== null)
    if (got.length >= 3) { const md = median(got); want.forEach((v, i) => { if (v !== null && Math.abs(v - md) > BT_DECK_AGREE) want[i] = null }) }
    else want.forEach((v, i) => { if (v !== null && Math.abs(v - e.heights![i]) > BT_DECK_LONE_MOVE) want[i] = null })
    const idx = want.flatMap((v, i) => v === null ? [] : [i])
    const cum = [0]; for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z))
    const n = p.length, h0 = e.heights[0], h1 = e.heights[n - 1]
    // the ends: kept unless matched themselves
    if (pinned.has(e.a)) want[0] = null
    if (pinned.has(e.b)) want[n - 1] = null
    const mids = idx.filter((i) => want[i] !== null)
    const anchors = [...(want[0] === null ? [{ i: 0, h: h0 }] : []), ...mids.map((i) => ({ i, h: want[i]! })), ...(want[n - 1] === null ? [{ i: n - 1, h: h1 }] : [])]
    const hs = !mids.length ? [...e.heights] : e.heights.map((_, i) => {
      let k = 0; while (k < anchors.length - 1 && anchors[k + 1].i < i) k++
      const a = anchors[k], b = anchors[Math.min(k + 1, anchors.length - 1)]
      if (a.i === i || a === b) return Math.round(a.h * 100) / 100
      const t = (cum[i] - cum[a.i]) / Math.max(1e-6, cum[b.i] - cum[a.i])
      return Math.round((a.h + (b.h - a.h) * t) * 100) / 100
    })
    if (hs.some((h, i) => Math.abs(h - e.heights![i]) > 0.05)) { e.heights = hs; out.push(e.id) }
  }
  for (const id of rampFreeEnds(edges, caps, ground)) if (!out.includes(id)) out.push(id)
  return out
}

/**
 * A DECK END JOINED TO NOTHING is not left in the air (nor buried): from the end, along the deck and on through the ways it runs
 * into end to end (nodes of two ways), each vertex is held within BT_FREE_END_GRADE × its distance of the ground at the end — a
 * ramp you could ride down to the ground there. It stops at a junction of three ways or more, whose own height is never moved.
 * Inside the zones only. Returns the ids changed.
 */
export function rampFreeEnds(edges: PackedEdge[], caps: Cap[], ground: (x: number, z: number) => number): number[] {
  const byNode = new Map<number, PackedEdge[]>()
  for (const e of edges) for (const n of [e.a, e.b]) (byNode.get(n) ?? byNode.set(n, []).get(n)!).push(e)
  const changed = new Set<number>()
  for (const e0 of edges) {
    if (!e0.bridge || !e0.foot || !e0.heights) continue
    for (const fromA0 of [true, false]) {
      const node0 = fromA0 ? e0.a : e0.b
      if ((byNode.get(node0)?.length ?? 0) !== 1) continue
      const p0 = unpackPoints(e0.points), q = fromA0 ? p0[0] : p0[p0.length - 1]
      if (!inCaps(caps, q.x, q.z)) continue
      const g = ground(q.x, q.z), h0 = fromA0 ? e0.heights[0] : e0.heights[e0.heights.length - 1]
      if (Math.abs(h0 - g) <= 1) continue
      const reach = Math.abs(h0 - g) / BT_FREE_END_GRADE
      let e: PackedEdge | undefined = e0, fromA = fromA0, d = 0
      const seen = new Set<PackedEdge>()
      while (e && !seen.has(e) && d < reach && e.heights) {
        seen.add(e)
        const p = unpackPoints(e.points), n = p.length
        const cum = [0]; for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z))
        const L = cum[n - 1], far: number = fromA ? e.b : e.a, farJunction = (byNode.get(far)?.length ?? 0) !== 2
        const hs = e.heights.map((h, i) => {
          if (farJunction && i === (fromA ? n - 1 : 0)) return h
          const r = BT_FREE_END_GRADE * (d + (fromA ? cum[i] : L - cum[i]))
          return Math.round(Math.max(g - r, Math.min(g + r, h)) * 100) / 100
        })
        if (hs.some((h, i) => Math.abs(h - e!.heights![i]) > 0.05)) { e.heights = hs; changed.add(e.id) }
        d += L
        if (farJunction) break
        const next: PackedEdge | undefined = byNode.get(far)!.find((o) => o !== e)
        if (!next || !next.foot || next.tunnel) break
        fromA = next.a === far; e = next
      }
    }
  }
  return [...changed]
}

/** DALLE_BT=0 in the env: the lidar's smeared dalle edge as it was */
export const DALLE_BT = process.env.DALLE_BT !== '0'
/** BD TOPO at-grade vertices within this (m) of a ground post speak for it; at least DALLE_MIN of them, agreeing within DALLE_AGREE */
export const DALLE_R = 15, DALLE_MIN = 3, DALLE_AGREE = 2
/** the post is raised only where they stand this much over it (the dalle the lidar smeared down to the street below) */
export const DALLE_MIN_LIFT = 3

/**
 * THE DALLE WHERE THE LIDAR SMEARED IT (La Défense, the Terrasse des Reflets and Place du Sud: BD TOPO has the dalle's walks at
 * NGF ~58, ~25 m in bake metres, and the ground model 10–15 m, the slab's edge smoothed down to the roads under it). The height a
 * ground post should take, or null: the median of the BD TOPO sol-0 vertices (already in bake metres) within DALLE_R of it, when
 * there are DALLE_MIN of them, they agree within DALLE_AGREE (a mix of levels, the dalle and a road beside it, says nothing), and
 * they stand DALLE_MIN_LIFT or more over the post. Full weight within DALLE_R / 2, fading out to DALLE_R. Only ever up.
 */
export function dalleHeight(verts: { x: number; z: number; h: number }[], x: number, z: number, post: number): number | null {
  const near: number[] = []; let dmin = Infinity
  for (const v of verts) { const d = Math.hypot(v.x - x, v.z - z); if (d < DALLE_R) { near.push(v.h); dmin = Math.min(dmin, d) } }
  if (near.length < DALLE_MIN || Math.max(...near) - Math.min(...near) > DALLE_AGREE) return null
  const m = median(near)
  if (m - post < DALLE_MIN_LIFT) return null
  const k = Math.min(1, (DALLE_R - dmin) / (DALLE_R / 2))
  return post + (m - post) * k
}

/** CAP_UNDER_DECKS=0 in the env: generic buildings stand through the decks as before */
export const CAP_UNDER_DECKS = process.env.CAP_UNDER_DECKS !== '0'
/** the clear height kept under a deck's surface (its structure) */
export const DECK_THICKNESS = 1.5
/** a building is capped only when at least this many deck vertices fall in its ring (a deck clipping a corner is left) */
export const DECK_IN_RING_MIN = 2
/** a tower this tall or taller is never capped: a deck through it is a passage through its podium (Kupka A, 50 m, and the Japan Bridge) */
export const CAP_MAX_HEIGHT = 40
/** …and never below this */
export const CAP_MIN_HEIGHT = 3

/**
 * A GENERIC building a raised deck runs through (w82486000, the Boulevard Patrick Devedjian's viaduct through an 8-storey office
 * block's cadastre footprint, DEFENSE-WALKWAYS.md bug 6) is capped under the deck: its height becomes the lowest deck surface
 * inside it, less DECK_THICKNESS, over the ground there. Never a landmark (`claimed`). Returns the building ids capped.
 */
export function capUnderDecks(buildings: PackedBuilding[], edges: PackedEdge[], ground: (x: number, z: number) => number, claimed: Set<number>, within?: (x: number, z: number) => boolean): number[] {
  if (!CAP_UNDER_DECKS) return []
  const decks = edges.filter((e) => e.bridge && !e.tunnel && e.heights).map((e) => ({ e, p: unpackPoints(e.points) }))
  const out: number[] = []
  for (const b of buildings) {
    if (claimed.has(b.id) || b.height === undefined || b.height >= CAP_MAX_HEIGHT) continue
    const r = unpackPoints(b.ring)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of r) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    if (within && !within((x0 + x1) / 2, (z0 + z1) / 2)) continue
    const inside = (x: number, z: number): boolean => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i].z > z) !== (r[j].z > z) && x < (r[j].x - r[i].x) * (z - r[i].z) / (r[j].z - r[i].z) + r[i].x) c = !c; return c }
    let n = 0, low = Infinity, gAt = 0
    // (only a deck that passes THROUGH: both its ends outside the ring. The Japan Bridge ends in Kupka A, a 50 m tower, at its door)
    for (const { e, p } of decks) if (!inside(p[0].x, p[0].z) && !inside(p[p.length - 1].x, p[p.length - 1].z)) p.forEach((q, i) => {
      if (q.x < x0 || q.x > x1 || q.z < z0 || q.z > z1 || !inside(q.x, q.z)) return
      n++
      if (e.heights![i] < low) { low = e.heights![i]; gAt = ground(q.x, q.z) }
    })
    if (n < DECK_IN_RING_MIN) continue
    const base = (b.minHeight ?? 0)
    const room = low - DECK_THICKNESS - gAt
    if (room >= b.height || room < base + CAP_MIN_HEIGHT) continue
    b.height = Math.round(room * 10) / 10
    if (b.levels) b.levels = Math.max(1, Math.floor(room / 3.2))
    if (b.roofHeight) b.roofHeight = 0
    out.push(b.id)
  }
  return out
}

/** BD TOPO's at-grade vertices (sol 0, not stairs, with a z) in bake metres, for `dalleHeight` */
export function dalleVerts(fs: { coords: number[][][]; props: Record<string, unknown> }[], toLocal: (lat: number, lon: number) => { x: number; z: number }, datum: number): { x: number; z: number; h: number }[] {
  const out: { x: number; z: number; h: number }[] = []
  for (const f of fs) {
    if (String(f.props.position_par_rapport_au_sol ?? '0') !== '0' || f.props.nature === 'Escalier') continue
    for (const line of f.coords) for (const c of line) if (c.length > 2 && c[2] > -999) { const q = toLocal(c[1], c[0]); out.push({ x: q.x, z: q.z, h: c[2] - datum }) }
  }
  return out
}

/** STAIRS_AT_DECKS=0 in the env: a deck end with a path far under it is left to meetDecks */
export const STAIRS_AT_DECKS = process.env.STAIRS_AT_DECKS !== '0'
/** a foot way meeting a deck end this far (m) above or below it gets a flight; nearer, meetDecks ramps it */
export const STAIR_MIN = 4
/** an OSM flight this far (m) along the paths from the deck end is the way up: the paths between become its landing */
export const STAIR_SEARCH = 40
/** the longest way turned into a flight; a longer one comes up to the deck as a ramp at STAIR_RAMP_GRADE instead */
export const STAIR_FLIGHT_MAX = 60, STAIR_RAMP_GRADE = 0.08

/**
 * STAIRS WHERE A PATH MEETS A DECK FAR ABOVE OR BELOW IT (La Défense, DEFENSE-WALKWAYS.md round 5: 13 ends where the paths stood
 * 4–14 m off the passerelle they meet; La Défense has stairs at most of them). Per node in the zones where a foot bridge's end
 * meets a foot way (or a lower deck) more than STAIR_MIN off it:
 *   1. an OSM flight (`steps`) at the node, or reached along at-grade foot ways within STAIR_SEARCH m, is re-sloped from its far
 *      foot to the deck, and the ways between it and the deck are lifted to the deck as its landing (reconnected, not invented);
 *   2. otherwise the meeting way becomes a flight itself when it is at most STAIR_FLIGHT_MAX long (its far end kept);
 *   3. otherwise it comes up to the deck as a ramp at STAIR_RAMP_GRADE from the node.
 * Mutates `edges`; returns the ids changed.
 */
export function stairsAtDeckEnds(edges: PackedEdge[], caps: Cap[]): number[] {
  if (!STAIRS_AT_DECKS) return []
  const byNode = new Map<number, PackedEdge[]>()
  for (const e of edges) for (const n of [e.a, e.b]) (byNode.get(n) ?? byNode.set(n, []).get(n)!).push(e)
  const endH = (e: PackedEdge, n: number): number => e.a === n ? e.heights![0] : e.heights![e.heights!.length - 1]
  const lenOf = (e: PackedEdge): number[] => { const p = unpackPoints(e.points), c = [0]; for (let i = 1; i < p.length; i++) c.push(c[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z)); return c }
  // a way's heights laid linearly from `h` at node `n` to its own far end
  const slope = (e: PackedEdge, n: number, h: number): void => {
    const c = lenOf(e), L = c[c.length - 1] || 1, fromA = e.a === n, far = fromA ? e.heights![e.heights!.length - 1] : e.heights![0]
    e.heights = c.map((d) => { const t = (fromA ? d : L - d) / L; return Math.round((h + (far - h) * t) * 100) / 100 })
  }
  const changed = new Set<number>()
  for (const [n, es] of byNode) {
    const decks = es.filter((e) => e.bridge && e.foot && e.heights)
    if (!decks.length) continue
    const p0 = unpackPoints(decks[0].points), q = decks[0].a === n ? p0[0] : p0[p0.length - 1]
    if (!inCaps(caps, q.x, q.z)) continue
    const top = Math.max(...decks.map((d) => endH(d, n)))
    for (const w of es) {
      if (!w.foot || w.tunnel || !w.heights || (w.bridge && endH(w, n) === top)) continue
      const step = top - endH(w, n)
      if (Math.abs(step) <= STAIR_MIN) continue
      // 1. an OSM flight near: search the at-grade foot ways from the node
      let found: { e: PackedEdge; at: number; path: { e: PackedEdge; from: number }[] } | null = null
      if (w.kind === 'steps') found = { e: w, at: n, path: [] }
      else {
        const queue: { node: number; d: number; path: { e: PackedEdge; from: number }[] }[] = [{ node: n, d: 0, path: [] }]
        const seen = new Set<PackedEdge>(decks)
        while (queue.length && !found) {
          queue.sort((a, b) => a.d - b.d)
          const { node, d, path } = queue.shift()!
          for (const o of byNode.get(node) ?? []) {
            if (seen.has(o) || !o.foot || o.tunnel || o.bridge || !o.heights) continue
            seen.add(o)
            if (o.kind === 'steps') { found = { e: o, at: node, path }; break }
            const c = lenOf(o), L = c[c.length - 1]
            if (d + L < STAIR_SEARCH) queue.push({ node: o.a === node ? o.b : o.a, d: d + L, path: [...path, { e: o, from: node }] })
          }
        }
      }
      if (found) {
        for (const { e } of found.path) { e.heights = e.heights!.map(() => top); changed.add(e.id) }
        slope(found.e, found.at, top); changed.add(found.e.id)
        continue
      }
      const c = lenOf(w), L = c[c.length - 1]
      if (L <= STAIR_FLIGHT_MAX) { w.kind = 'steps'; delete w.trail; slope(w, n, top); changed.add(w.id); continue }
      const fromA = w.a === n
      w.heights = w.heights.map((h, i) => { const r = STAIR_RAMP_GRADE * (fromA ? c[i] : L - c[i]); return Math.round(Math.max(top - r, Math.min(top + r, h)) * 100) / 100 })
      w.ramp = true; changed.add(w.id)
    }
  }
  return [...changed]
}
