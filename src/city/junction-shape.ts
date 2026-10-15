/**
 * The shape of a street's approach to a junction (tools/junctions.ts measures it; ridegraph.ts `straightenJunctions`
 * repairs it). Owner, 2026-10-14: "paths shouldn't take sharp turns right before a crossing".
 *
 * Code frame: x east, z north, metres.
 */
type Point = { x: number; z: number }

/** how far back from the junction an approach is judged (and straightened) */
export const APPROACH = 25

export interface ApproachShape {
  /** the approach's own points, from the junction outward, up to and including the judged span's far end */
  pts: Point[]
  /** how far along the edge that far end is */
  reach: number
  /** the chord from the junction to the far end, unit */
  dx: number
  dz: number
  /** the farthest any point of the span lies off that chord (m) */
  stray: number
  /** the sharpest turn between consecutive segments within the span (degrees) */
  bend: number
  name?: string
}

/** A point `d` metres along a polyline (clamped to its ends). */
export function along(pts: Point[], d: number): { p: Point; i: number } {
  let left = d
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
    if (left <= L) {
      const t = L > 0 ? left / L : 0
      return { p: { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, z: pts[i - 1].z + (pts[i].z - pts[i - 1].z) * t }, i }
    }
    left -= L
  }
  return { p: pts[pts.length - 1], i: pts.length - 1 }
}

/**
 * The approach of edge `e` to node `node`, judged over APPROACH metres or 40% of the edge, whichever is less (the
 * other end has a junction of its own). Null for an edge too short to have an approach (under 6 m).
 */
export function approachShape(e: { a: number; b: number; points: Point[]; length: number; name?: string }, node: number,
  upTo = APPROACH): ApproachShape | null {
  if (e.length < 6) return null
  const pts = e.a === node ? e.points : [...e.points].reverse()
  const reach = Math.min(upTo, e.length * 0.4)
  const end = along(pts, reach)
  const span = [...pts.slice(0, end.i), end.p]
  const o = span[0]
  const cx = end.p.x - o.x
  const cz = end.p.z - o.z
  const cl = Math.hypot(cx, cz) || 1
  const dx = cx / cl
  const dz = cz / cl
  let stray = 0
  for (const q of span) stray = Math.max(stray, Math.abs((q.x - o.x) * dz - (q.z - o.z) * dx))
  let bend = 0
  for (let i = 1; i < span.length - 1; i++) {
    const ax = span[i].x - span[i - 1].x, az = span[i].z - span[i - 1].z
    const bx = span[i + 1].x - span[i].x, bz = span[i + 1].z - span[i].z
    const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz)
    if (la < 0.3 || lb < 0.3) continue
    bend = Math.max(bend, (Math.acos(Math.max(-1, Math.min(1, (ax * bx + az * bz) / (la * lb)))) * 180) / Math.PI)
  }
  return { pts: span, reach, dx, dz, stray, bend, name: e.name }
}

/** a street's pieces as `straightenJunctions` reads them: the ride graph's edges, or any graph's */
export interface ShapedEdge {
  id: number
  a: number
  b: number
  points: Point[]
  length: number
  heights?: number[]
  name?: string
  foot: boolean
  bridge?: boolean
  tunnel?: boolean
  raised?: boolean
}

/** how far a path strays OUTSIDE the drawn carriageways, worst over it (sampled every metre); 0 on them */
export type Outside = (pts: Point[]) => number

/** what `straightenJunctions` did, for the bake's report */
export interface StraightenCount { junctions: number; moved: number; approaches: number; declined: number }

const ZIG_STRAY = 0.75
const ZIG_BEND = 20
const MAX_MOVE = 4
/** a turn sharper than this within 12 m of the crossing is a sharp turn before it */
const NEAR_BEND = 30
const THROUGH = 15

/**
 * STRAIGHTEN EVERY ORDINARY JUNCTION'S APPROACHES (owner, 2026-10-14: "the paths at 4-way intersections; often several
 * of the paths are zigzaggy, not meeting perpendicularly, and this throws the user off every time ... paths shouldn't
 * take sharp turns right before a crossing"). Run on the finished ride graph: measured with tools/junctions.ts, of San
 * Francisco's 5114 street junctions of three or four ways, 762 had an approach wandering 0.75–4 m off its chord (or
 * turning 20–60°) in its last 25 m — some the street's own OSM geometry, more the ride graph's own passes (a cluster
 * collapsed to its centre, a boulevard's two carriageways merged).
 *
 * Per junction of three or four streets (no footway, bridge or tunnel among them) with a pair running straight through
 * (within 15°) and some approach zigzagging:
 *   - the junction moves to where its streets' lines cross — each through pair's line is drawn between the far ends
 *     of its two approaches, which the jitter at the corner does not reach — but by no more than 4 m, and not at all
 *     if an approach is a real corner (a turn over 60°, or 4 m off its chord: a street that bends there);
 *   - every approach that is not a real corner runs straight from its far end (APPROACH m out, or 40% of a short
 *     edge) into the junction;
 *   - and only if no approach then strays further off the drawn carriageways than it did (`outside`, 0.5 m of
 *     grace), nor runs through a building (`blocked`): first with the junction moved, then without, else the
 *     junction is left as it was.
 * Heights at the kept points stay; the far end's is interpolated. Nothing else about an edge changes.
 */
export function straightenJunctions<E extends ShapedEdge>(edges: E[], outside: Outside,
  blocked?: (a: Point, b: Point) => boolean): { edges: E[]; count: StraightenCount } {
  const count: StraightenCount = { junctions: 0, moved: 0, approaches: 0, declined: 0 }
  const at = new Map<number, number[]>()
  edges.forEach((e, i) => { for (const n of [e.a, e.b]) (at.get(n) ?? at.set(n, []).get(n)!).push(i) })
  // per edge, the new span at each end: [junction, far end] replacing the original span
  const ends = new Map<number, { a?: { node: Point; shape: ApproachShape }; b?: { node: Point; shape: ApproachShape } }>()
  for (const [nid, list] of at) {
    if (list.length < 3 || list.length > 4) continue
    const es = list.map((i) => edges[i])
    // (an edge that is a loop on this node is no approach)
    if (es.some((e) => e.foot || e.bridge || e.tunnel || e.raised || e.a === e.b)) continue
    const shapes = es.map((e) => approachShape(e, nid))
    if (shapes.some((s) => s === null)) continue
    const ss = shapes as ApproachShape[]
    const judged = es.map((e) => !!e.name || e.length >= 40)
    const corner = ss.map((s) => s.bend > 60 || s.stray > 4)
    // (or a sharp turn in the last 12 m though the 25 m span is a corner: a street that bends further out, and kinks
    //  again just before the crossing — Valencia, Church, Potrero)
    // (12 m, else 6 m: a street that jogs ten metres out — Kearny below Vallejo — is a corner over 12 m and still kinked
    //  at 5)
    const nearSharp = es.map((e, k) => { if (!judged[k]) return false; return [12, 6].some((r) => { const n = approachShape(e, nid, r); return !!n && n.bend > NEAR_BEND && n.bend <= 60 }) })
    const zig = ss.some((s, k) => judged[k] && !corner[k] && (s.stray > ZIG_STRAY || s.bend > ZIG_BEND)) || nearSharp.some(Boolean)
    if (!zig) continue
    // the through pairs, straightest first, each approach in one pair at most
    const pairs: [number, number, number][] = []
    for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) {
      const off = 180 - (Math.acos(Math.max(-1, Math.min(1, ss[i].dx * ss[j].dx + ss[i].dz * ss[j].dz))) * 180) / Math.PI
      if (off < THROUGH) pairs.push([i, j, off])
    }
    pairs.sort((p, q) => p[2] - q[2])
    const used = new Set<number>()
    const through: [number, number][] = []
    for (const [i, j] of pairs) if (!used.has(i) && !used.has(j)) { used.add(i); used.add(j); through.push([i, j]) }
    // (no straight pair — a skewed junction, "much more complicated" (the owner): its node stays where it is, but its
    //  zigzagging approaches still run straight into it — no sharp turn just before the crossing)
    count.junctions++
    const o = ss[0].pts[0]
    const far = ss.map((s) => s.pts[s.pts.length - 1])
    // where the streets' lines cross
    let moved: Point = o
    if (!corner.some(Boolean) && through.length > 0) {
      const line = ([i, j]: [number, number]) => ({ p: far[i], d: { x: far[j].x - far[i].x, z: far[j].z - far[i].z } })
      if (through.length >= 2) {
        const A = line(through[0]), B = line(through[1])
        const den = A.d.x * B.d.z - A.d.z * B.d.x
        if (Math.abs(den) > 1e-6) {
          const t = ((B.p.x - A.p.x) * B.d.z - (B.p.z - A.p.z) * B.d.x) / den
          moved = { x: A.p.x + A.d.x * t, z: A.p.z + A.d.z * t }
        }
      } else if (ss.length === 4) {
        /*
         * One straight pair and a cross street that is not straight through: its two approaches are the cross street
         * all the same, and the line between their far ends is where it runs (Turk at Taylor, 2026-10-15: Taylor kinks
         * 40° into a node 4 m off the real crossing, and projecting onto Turk alone moved the node 0.3 m).
         */
        const rest = [0, 1, 2, 3].filter((k) => !through[0].includes(k)) as [number, number]
        const A = line(through[0]), B = line(rest)
        const den = A.d.x * B.d.z - A.d.z * B.d.x
        if (Math.abs(den) > 1e-6) {
          const t = ((B.p.x - A.p.x) * B.d.z - (B.p.z - A.p.z) * B.d.x) / den
          moved = { x: A.p.x + A.d.x * t, z: A.p.z + A.d.z * t }
        }
      } else {
        const A = line(through[0])
        const l2 = A.d.x * A.d.x + A.d.z * A.d.z || 1e-9
        const t = ((o.x - A.p.x) * A.d.x + (o.z - A.p.z) * A.d.z) / l2
        moved = { x: A.p.x + A.d.x * t, z: A.p.z + A.d.z * t }
      }
      if (Math.hypot(moved.x - o.x, moved.z - o.z) > MAX_MOVE) moved = o
    }
    /*
     * An approach left as it is, when the node moves: its points within 6 m of the OLD node are dropped, so it runs
     * straight into the new one — kept, the first of them (4–5 m out) made a fresh kink just before the crossing
     * (Harrison at 14th, 7th at Brannan, Beale at Mission…, 2026-10-15). Its far end always stays.
     */
    const rest = (k: number, n: Point): Point[] => {
      const p = ss[k].pts.slice(1)
      if (n === o) return p
      const kept = p.filter((q, i) => i === p.length - 1 || Math.hypot(q.x - o.x, q.z - o.z) > 6)
      return kept
    }
    // accepted only if no approach then strays further off the drawn streets than it did
    const tryAt = (n: Point): boolean[] | null => {
      const take: boolean[] = []
      for (let k = 0; k < ss.length; k++) {
        const straight = !corner[k]
        const path = straight ? [n, far[k]] : [n, ...rest(k, n)]
        // (nor through a building: a straightened approach in a narrow alley cut the corner of one — Rose Pak's Way)
        const through = straight && blocked?.(n, far[k])
        if (through || outside(path) > Math.max(outside(ss[k].pts), 0.5)) {
          // a corner approach must take the node wherever it goes; a straight one may only be declined if it stays
          if (!straight || n !== o) return null
          take.push(false)
        } else take.push(straight)
      }
      return take
    }
    /*
     * One attempt at node `n`: which approaches run straight (in full, else over their last 12…4 m). Each attempt has its
     * own copy of the shapes. A MOVED node is refused if it leaves a sharp kink (> NEAR_BEND) within 6 m of the crossing
     * on any approach: the node is better where it was (owner, 2026-10-14, "no sharp turns right before a crossing" —
     * Harrison at 14th, 7th at Brannan…, 2026-10-15, straight before the move and kinked after it).
     */
    const attempt = (n: Point): { take: boolean[]; ss: ApproachShape[]; far: Point[] } | null => {
      const t0 = tryAt(n)
      if (!t0) return null
      const sx = [...ss], fx = [...far], take = [...t0]
      for (let k = 0; k < sx.length; k++) {
        if (take[k] || (corner[k] && !nearSharp[k])) continue
        for (const r of [12, 10, 8, 6, 4]) {
          const s2 = approachShape(es[k], nid, r)
          if (!s2 || (s2.stray <= ZIG_STRAY && s2.bend <= ZIG_BEND && n === o)) break
          const f2 = s2.pts[s2.pts.length - 1]
          // (over the last 8 m the junction's own paving (render/city.ts `junctionHull`) is round the corner: a metre and a
          //  half off the carriageway there is still paved — never through a building)
          if (blocked?.(n, f2) || outside([n, f2]) > Math.max(outside(s2.pts), r <= 8 ? 1.5 : r <= 10 ? 1 : 0.5)) continue
          sx[k] = s2
          fx[k] = f2
          take[k] = true
          break
        }
      }
      if (n !== o) {
        for (let k = 0; k < sx.length; k++) {
          const pts = take[k] ? [n, fx[k], ...(() => { const q = es[k].a === nid ? es[k].points : [...es[k].points].reverse(); return [along(q, sx[k].reach + 3).p] })()]
            : [n, ...rest(k, n)]
          const s6 = approachShape({ a: 0, b: 1, points: pts, length: pts.slice(1).reduce((acc, q, i) => acc + Math.hypot(q.x - pts[i].x, q.z - pts[i].z), 0) }, 0, 6)
          if (s6 && s6.bend > NEAR_BEND && !corner[k]) return null
        }
      }
      return { take, ss: sx, far: fx }
    }
    let np = moved
    let got = attempt(np)
    if (!got && np !== o) { np = o; got = attempt(o) }
    if (!got) { count.declined++; continue }
    const take = got.take
    for (let k = 0; k < ss.length; k++) { ss[k] = got.ss[k]; far[k] = got.far[k] }
    if (np !== o) count.moved++
    for (let k = 0; k < ss.length; k++) {
      if (!take[k] && np === o) continue
      const e = es[k]
      const shape: ApproachShape = take[k] ? { ...ss[k], pts: [np, far[k]] } : { ...ss[k], pts: [np, ...rest(k, np)] }
      const rec = ends.get(e.id) ?? {}
      if (e.a === nid) rec.a = { node: np, shape }
      else rec.b = { node: np, shape }
      ends.set(e.id, rec)
      if (take[k]) count.approaches++
    }
  }
  if (ends.size === 0) return { edges, count }
  const out = edges.map((e) => {
    const rec = ends.get(e.id)
    if (!rec) return e
    let pts = e.points
    let hs = e.heights && e.heights.length === e.points.length ? e.heights : undefined
    const apply = (spanEnd: ApproachShape, ps: Point[], h: number[] | undefined): { ps: Point[]; h?: number[] } => {
      // the original span reached `reach` metres along; keep everything beyond it
      const cut = along(ps, spanEnd.reach)
      const tail = ps.slice(cut.i)
      const farH = h ? interpAt(ps, h, spanEnd.reach) : undefined
      return {
        ps: [...spanEnd.pts.slice(0, -1), cut.p, ...tail],
        h: h ? [h[0], ...spanEnd.pts.slice(1, -1).map((q) => interpAt(ps, h, nearestAlong(ps, q))), farH!, ...h.slice(cut.i)] : undefined,
      }
    }
    /*
     * A SHORT edge repaired at both ends (under 30 m: the two spans overlap) is one straight line from junction to
     * junction — repaired end by end, the second repair bent the first (14th at Harrison, 13 m: a 35° kink 4.7 m from
     * the crossing, 2026-10-15). Heights: straight between its ends' too.
     */
    // (and repaired at ONE end only: its first 40 % straightened, its rest met it at an angle — the same kink; straight
    //  to its other end instead)
    if ((rec.a || rec.b) && e.length < 30) {
      const A = rec.a?.node ?? e.points[0], B = rec.b?.node ?? e.points[e.points.length - 1]
      const h0 = hs?.[0], h1 = hs?.[hs.length - 1]
      const L = Math.hypot(B.x - A.x, B.z - A.z)
      return { ...e, points: [A, B], heights: hs ? [h0!, h1!] : undefined, length: L }
    }
    if (rec.a) { const r = apply(rec.a.shape, pts, hs); pts = r.ps; hs = r.h }
    if (rec.b) {
      const r = apply(rec.b.shape, [...pts].reverse(), hs ? [...hs].reverse() : undefined)
      pts = r.ps.reverse()
      hs = r.h?.reverse()
    }
    let length = 0
    for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
    return { ...e, points: pts, heights: hs, length }
  })
  return { edges: out, count }
}

/** the height `d` metres along a polyline, from the heights at its points */
function interpAt(pts: Point[], h: number[], d: number): number {
  let left = d
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
    if (left <= L) return h[i - 1] + (h[i] - h[i - 1]) * (L > 0 ? left / L : 0)
    left -= L
  }
  return h[h.length - 1]
}

/** how far along a polyline the point nearest `q` is */
function nearestAlong(pts: Point[], q: Point): number {
  let best = Infinity
  let at = 0
  let acc = 0
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x, dz = pts[i].z - pts[i - 1].z
    const L2 = dx * dx + dz * dz
    const t = L2 > 0 ? Math.max(0, Math.min(1, ((q.x - pts[i - 1].x) * dx + (q.z - pts[i - 1].z) * dz) / L2)) : 0
    const d = Math.hypot(pts[i - 1].x + dx * t - q.x, pts[i - 1].z + dz * t - q.z)
    if (d < best) { best = d; at = acc + Math.sqrt(L2) * t }
    acc += Math.sqrt(L2)
  }
  return at
}
