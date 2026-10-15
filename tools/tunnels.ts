/**
 * STREET TUNNELS YOU CAN RIDE (owner, 2026-09-29, the Stockton Tunnel: "it would be so cool if we could zoom through
 * street tunnels… still ignoring highway and train tunnels"). Until now every tunnel was left out — not drawn, not
 * ridden — and its heights were the ground ABOVE it, which is meaningless for a way under a hill.
 *
 * A BORE is a chain of tunnel carriageways of an ordinary street class (not a motorway, trunk or service road)
 * with two mouths, running under ground that stands well above it. It gets:
 *
 *   * its own profile: straight from one mouth to the other, at the heights of the streets it opens onto — the
 *     explicit Z the map format carries (MAP-FORMAT §14);
 *   * `bore: true`, which lets it into the ride graph and the traffic, and tells the renderer to draw it as a
 *     tunnel (render/tunnels.ts) rather than as a street;
 *   * the same for the footways inside it (its pavements), their heights taken from the bore beside them.
 *
 * A tunnel that is not under a hill — an underpass beneath a railway, a street under a plaza, where the straight
 * line would come out above the ground — is left as it was: that needs ramps down into it, which is another job.
 */
import { unpackPoints } from '../src/city/package.ts'

export interface TunnelEdge {
  id: number
  a: number
  b: number
  points: number[]
  heights?: number[]
  tunnel?: boolean
  layer?: number
  foot?: boolean
  kind?: string
  bore?: boolean
  cut?: boolean
  name?: string
  width?: number
  walk?: number
}

/** street classes a bore may be (never motorway, trunk or service: a highway tunnel, a garage ramp) */
const STREET = new Set(['primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link',
  'unclassified', 'residential', 'living_street'])
/**
 * Under a hill: the ground never below the bore (this much over it, everywhere but near its mouths) and well above
 * it somewhere. A cover of 4 m throughout failed the Broadway Tunnel, whose east end runs in under a slope rising
 * 1 m in 20 m on the coarse ground — and under the Geary Boulevard underpasses the ground is 2 m over at most.
 */
export const COVER = 0.5
export const PEAK = 8
/** …where "near" is this far in from either mouth */
const MOUTH = 20
/** a mouth with a street crossing right over it is at least this far below that street (the tube is 5.4 m high) */
export const CLEAR = 6.5
/** longer than this is not a street tunnel a rider zooms through */
const LONGEST = 2000
/** a footway carrying a tunnel's pavement out of a mouth eases from the pavement's level to its own over this far */
const PAVEMENT_EASE = 40
/** how far out from a mouth a street into it may follow a trench in the ground (`fine`) */
const TRENCH_RUN = 80
/** a pavement belongs to a bore if every point of it is this close to the bore's line */
const BESIDE = 10

type P = { x: number; z: number }

function lengths(p: P[]): number[] {
  const c = [0]
  for (let i = 1; i < p.length; i++) c.push(c[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z))
  return c
}

/** the nearest point of a polyline: its distance along it and how far off it */
function nearest(line: P[], cum: number[], q: P): { along: number; off: number } {
  let best = { along: 0, off: Infinity }
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1]
    const dx = line[i].x - a.x
    const dz = line[i].z - a.z
    const l2 = dx * dx + dz * dz || 1e-9
    const t = Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.z - a.z) * dz) / l2))
    const off = Math.hypot(a.x + dx * t - q.x, a.z + dz * t - q.z)
    if (off < best.off) best = { along: cum[i - 1] + (cum[i] - cum[i - 1]) * t, off }
  }
  return best
}

/**
 * Find the bores among `edges`, give them (and their pavements) mouth-to-mouth heights and `bore: true`. Mutates
 * `edges`; returns the ids made bores. `ground` is the terrain.
 */
export function boreTunnels(edges: TunnelEdge[], ground: (x: number, z: number) => number,
  report?: (name: string, why: string) => void, fine?: (x: number, z: number) => number): Set<number> {
  const done = new Set<number>()
  const isBore = (e: TunnelEdge): boolean => !!e.tunnel && !e.foot && STREET.has(e.kind ?? '')
  const candidates = edges.filter(isBore)
  const byNode = new Map<number, TunnelEdge[]>()
  for (const e of edges) for (const n of [e.a, e.b]) (byNode.get(n) ?? byNode.set(n, []).get(n)!).push(e)
  const seen = new Set<number>()
  /** the streets into a lowered mouth, sloped down to it: straight from their far end, over at most 60 m */
  const approach = (node: number, y: number): void => {
    for (const o of byNode.get(node) ?? []) {
      if (o.tunnel || (o.layer ?? 0) < 0 || !o.heights?.length) continue
      const p = unpackPoints(o.points)
      const c = lengths(p)
      const Lo = c[c.length - 1]
      const fromA = o.a === node
      const far = fromA ? o.heights[o.heights.length - 1] : o.heights[0]
      const run = Math.min(60, Lo)
      // a scrap of street at the mouth (Stockton's is 2 m) is simply lowered whole
      if (Lo < 15) { o.heights = o.heights.map((h) => Math.round(Math.min(h, y) * 100) / 100); continue }
      o.heights = o.heights.map((h, i) => {
        const d = fromA ? c[i] : Lo - c[i]
        if (d > run) return h
        const target = y + (far - y) * (d / run)
        return Math.round(Math.min(h, target) * 100) / 100
      })
    }
  }

  for (const start of candidates) {
    if (seen.has(start.id)) continue
    // the chain: every bore candidate joined to this one end to end
    const chain: TunnelEdge[] = []
    const todo = [start]
    seen.add(start.id)
    while (todo.length) {
      const e = todo.pop()!
      chain.push(e)
      for (const n of [e.a, e.b]) for (const o of byNode.get(n) ?? []) if (isBore(o) && !seen.has(o.id)) { seen.add(o.id); todo.push(o) }
    }
    // its mouths: the nodes only one of its edges reaches
    const count = new Map<number, number>()
    for (const e of chain) for (const n of [e.a, e.b]) count.set(n, (count.get(n) ?? 0) + 1)
    const mouths = [...count].filter(([, c]) => c === 1).map(([n]) => n)
    const name = (start as { name?: string }).name ?? `tunnel ${start.id}`
    if (mouths.length !== 2) { report?.(name, `${mouths.length} mouths`); continue }
    // walked from one mouth to the other, as one polyline
    const line: P[] = []
    const order: { e: TunnelEdge; reversed: boolean; from: number }[] = []
    let node = mouths[0]
    const used = new Set<number>()
    for (let guard = 0; guard < chain.length; guard++) {
      const e = chain.find((c) => !used.has(c.id) && (c.a === node || c.b === node))
      if (!e) break
      used.add(e.id)
      const reversed = e.b === node
      const p = unpackPoints(e.points)
      const pts = reversed ? [...p].reverse() : p
      order.push({ e, reversed, from: line.length === 0 ? 0 : line.length - 1 })
      line.push(...(line.length === 0 ? pts : pts.slice(1)))
      node = reversed ? e.a : e.b
    }
    if (used.size !== chain.length || node !== mouths[1]) { report?.(name, 'not one chain end to end'); continue }
    const cum = lengths(line)
    const L = cum[cum.length - 1]
    if (L > LONGEST || L < 30) { report?.(name, `${Math.round(L)} m long`); continue }
    // the mouths' heights: where the streets outside meet them (their own profile at that node), else the ground
    const at = (n: number, p: P): number => {
      for (const o of byNode.get(n) ?? []) {
        if (o.tunnel || !o.heights?.length) continue
        return o.a === n ? o.heights[0] : o.heights[o.heights.length - 1]
      }
      return ground(p.x, p.z)
    }
    /*
     * A STREET IN A TRENCH (2026-10-14, Broadway's west approach): a street's level is the highest ground across its
     * corridor, which in a walled trench is the BANK, so the road into the mouth floated 4 m over the trench floor,
     * the mouth was set at the bank's level, and the bridge over the trench (Hyde Street) was lifted to clear a road
     * that was not there. Where the fine ground along a street into a mouth (the lidar's, in a lidar zone) lies well
     * below its profile, the street follows it down — over its last TRENCH_RUN metres to the mouth only.
     */
    if (fine) for (const n of mouths) {
      for (const o of byNode.get(n) ?? []) {
        if (o.tunnel || (o.layer ?? 0) < 0 || !o.heights?.length) continue
        const p = unpackPoints(o.points)
        const c = lengths(p)
        const Lo = c[c.length - 1]
        const fromA = o.a === n
        const floor = p.map((q, i) => ({ i, d: fromA ? c[i] : Lo - c[i], g: fine(q.x, q.z) }))
        // (NaN: no trustworthy ground there — outside the lidar, the bake says)
        const deep = floor.filter((f) => f.d <= TRENCH_RUN && Number.isFinite(f.g) && f.g < o.heights![f.i] - 1.5)
        if (deep.length < 2) continue
        const before = o.heights.slice()
        o.heights = o.heights.map((h, i) => (floor[i].d <= TRENCH_RUN && Number.isFinite(floor[i].g) ? Math.round(Math.min(h, floor[i].g + 0.2) * 100) / 100 : h))
        // (under a bridge the lidar has no ground — the street over it, not the trench, or nothing: there the floor is
        //  the line between the lowered points either side, else the road humped 2 m under Hyde Street)
        const low = floor.filter((f) => f.d <= TRENCH_RUN && o.heights![f.i] < before[f.i] - 0.5).sort((a, b) => a.d - b.d)
        for (const f of floor) {
          if (f.d > TRENCH_RUN) continue
          const lo = [...low].reverse().find((q) => q.d < f.d), hi = low.find((q) => q.d > f.d)
          if (!lo || !hi) continue
          const t = (f.d - lo.d) / (hi.d - lo.d || 1)
          const line = o.heights[lo.i] + (o.heights[hi.i] - o.heights[lo.i]) * t
          if (o.heights[f.i] > line + 0.3) o.heights[f.i] = Math.round(line * 100) / 100
        }
        // (no step where the run ends: eased back up over the next 20 m)
        for (const f of floor) if (f.d > TRENCH_RUN && f.d < TRENCH_RUN + 20) {
          const edge = floor.filter((q) => q.d <= TRENCH_RUN).sort((a, b) => b.d - a.d)[0]
          if (edge) { const t = (f.d - TRENCH_RUN) / 20; o.heights[f.i] = Math.round((o.heights[edge.i] + (before[f.i] - o.heights[edge.i]) * t) * 100) / 100 }
        }
        report?.(name, `the street into a mouth follows its trench: ${deep.length} points lowered up to ${Math.max(...deep.map((f) => before[f.i] - f.g)).toFixed(1)} m`)
      }
    }
    let y0 = at(mouths[0], line[0])
    let y1 = at(mouths[1], line[line.length - 1])
    /*
     * A STREET OVER THE MOUTH (the Stockton Tunnel's south portal is right under Bush Street, 2026-09-29): the mouth
     * is at least CLEAR below it, whatever the ground data says — at 3.8 m under Bush the tube's crown came up
     * through the street and the trees on it. The street leading in is sloped down to meet it (`approach`).
     */
    const over = (i: number, dir: 1 | -1): number => {
      let top = -Infinity
      for (const o of edges) {
        if (o.tunnel || o.foot || (o.layer ?? 0) < 0 || !o.heights?.length || o.a === mouths[0] || o.b === mouths[0]
          || o.a === mouths[1] || o.b === mouths[1]) continue
        const op = unpackPoints(o.points)
        const ocum = lengths(op)
        // where it crosses the first 20 m of the bore, from this mouth
        for (let d = 0; d <= 20; d += 2) {
          const q = nearestPoint(line, cum, dir > 0 ? d : L - d)
          const n = nearest(op, ocum, q)
          if (n.off > 3) continue
          const k = Math.min(o.heights.length - 1, Math.round((n.along / (ocum[ocum.length - 1] || 1)) * (o.heights.length - 1)))
          top = Math.max(top, o.heights[k])
        }
      }
      return top
    }
    const low0 = over(0, 1) - CLEAR
    const low1 = over(line.length - 1, -1) - CLEAR
    const lowered: [number, number][] = []
    if (Number.isFinite(low0) && y0 > low0) { y0 = low0; lowered.push([mouths[0], y0]) }
    if (Number.isFinite(low1) && y1 > low1) { y1 = low1; lowered.push([mouths[1], y1]) }
    const y = (d: number): number => y0 + (y1 - y0) * (L > 0 ? d / L : 0)
    // under a hill: the ground over the line all the way along, away from the mouths, and well over it somewhere
    let covered = true
    let peak = -Infinity
    for (let d = 0; d <= L; d += 10) { const q = nearestPoint(line, cum, d); peak = Math.max(peak, ground(q.x, q.z) - y(d)) }
    if (peak < PEAK) { report?.(name, `not under a hill: at most ${peak.toFixed(1)} m of ground over it`); continue }
    for (let i = 0; i < line.length && covered; i++) {
      if (cum[i] < MOUTH || cum[i] > L - MOUTH) continue
      if (ground(line[i].x, line[i].z) - y(cum[i]) < COVER) { covered = false; report?.(name, `only ${(ground(line[i].x, line[i].z) - y(cum[i])).toFixed(1)} m of ground over it ${Math.round(cum[i])} m in`) }
    }
    // (and between the vertices, every 10 m)
    for (let d = MOUTH; d <= L - MOUTH && covered; d += 10) {
      const q = nearestPoint(line, cum, d)
      if (ground(q.x, q.z) - y(d) < COVER) { covered = false; report?.(name, `only ${(ground(q.x, q.z) - y(d)).toFixed(1)} m of ground over it ${Math.round(d)} m in`) }
    }
    if (!covered) continue
    // (only now, a bore for certain, are the streets into a lowered mouth sloped down to it)
    for (const [n, y] of lowered) approach(n, y)
    /*
     * A STUB OF CARRIAGEWAY from a mouth to where only footways go is a footway (2026-10-15, Broadway's west mouth:
     * OSM's 6 m of "Broadway, primary" from the mouth north to the node where the tunnel's pavement meets the sidewalk
     * outside, drawn 9.2 m wide across the mouth — a dark slab slicing the left arch).
     */
    for (const n of mouths) for (const o of byNode.get(n) ?? []) {
      if (o.tunnel || o.foot || (o.layer ?? 0) < 0) continue
      const far = o.a === n ? o.b : o.a
      const p = unpackPoints(o.points)
      const len = lengths(p)[p.length - 1]
      if (len >= 12 || !(byNode.get(far) ?? []).every((x) => x === o || x.foot)) continue
      o.foot = true
      o.kind = 'footway'
      o.width = 3
      o.walk = 0
      report?.(name, `the street into a mouth: a ${len.toFixed(0)} m stub of carriageway to the pavements only, made a footway`)
    }
    // and every street into either mouth is in a CUT: drawn at its own level, below the ground beside it
    for (const n of mouths) for (const o of byNode.get(n) ?? []) if (!o.tunnel && (o.layer ?? 0) >= 0) o.cut = true

    // (each edge's heights in its own point order: `nearest` measures along from mouth 0 whichever way it runs)
    for (const { e } of order) {
      const p = unpackPoints(e.points)
      e.heights = p.map((q) => Math.round(y(nearest(line, cum, q).along) * 100) / 100)
      e.bore = true
      done.add(e.id)
    }
    // its pavements: tunnel footways lying along it
    for (const f of edges) {
      if (!f.tunnel || !f.foot || f.bore) continue
      const p = unpackPoints(f.points)
      const near = p.map((q) => nearest(line, cum, q))
      // (its two ends a little further: at a mouth a pavement turns to meet the sidewalk outside — Broadway's south one
      //  ends 11 m off the line, and left out it was a footway over the top of the hill, 15 m above the tunnel)
      if (near.some((n, i) => n.off > (i === 0 || i === near.length - 1 ? BESIDE + 6 : BESIDE))) continue
      f.heights = near.map((n) => Math.round(y(n.along) * 100) / 100)
      f.bore = true
      done.add(f.id)
      /*
       * …and the footway carrying a pavement on OUT of the mouth starts where the pavement ends (2026-10-15, Broadway's
       * west mouth: the pavement inside ended at the mouth's level, the sidewalk outside began 4 m higher, at its own,
       * and its first metres stood in the air across the portal), easing back to its own over PAVEMENT_EASE metres.
       */
      for (const end of [f.a, f.b]) {
        const hEnd = end === f.a ? f.heights[0] : f.heights[f.heights.length - 1]
        for (const o of byNode.get(end) ?? []) {
          if (o === f || o.tunnel || !o.foot || !o.heights?.length) continue
          const op = unpackPoints(o.points)
          const oc = lengths(op)
          const OL = oc[oc.length - 1]
          const fromA = o.a === end
          // (in a trench it is the trench's sidewalk: down to the floor first, as the street beside it is)
          if (fine) o.heights = o.heights.map((h, i) => {
            const d = fromA ? oc[i] : OL - oc[i]
            const g = fine(op[i].x, op[i].z)
            return d <= TRENCH_RUN && Number.isFinite(g) && g < h - 1.5 ? Math.round((g + 0.2) * 100) / 100 : h
          })
          const start = fromA ? o.heights[0] : o.heights[o.heights.length - 1]
          if (Math.abs(start - hEnd) < 0.3) continue
          o.heights = o.heights.map((h, i) => {
            const d = fromA ? oc[i] : OL - oc[i]
            if (d >= PAVEMENT_EASE) return h
            const t = d / PAVEMENT_EASE
            return Math.round((hEnd + (h - hEnd) * t) * 100) / 100
          })
        }
      }
    }
  }
  return done
}

function nearestPoint(line: P[], cum: number[], d: number): P {
  let i = 1
  while (i < line.length - 1 && cum[i] < d) i++
  const t = Math.max(0, Math.min(1, (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)))
  return { x: line[i - 1].x + (line[i].x - line[i - 1].x) * t, z: line[i - 1].z + (line[i].z - line[i - 1].z) * t }
}
