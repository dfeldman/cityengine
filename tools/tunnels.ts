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
  /** a lid tunnel's clearance, road to the street over it (`lidTunnels`) */
  lid?: number
  bridge?: boolean
  cut?: boolean
  name?: string
  width?: number
  walk?: number
}

/** street classes a bore may be (never motorway, trunk or service: a highway tunnel, a garage ramp) */
const STREET = new Set(['primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link',
  'unclassified', 'residential', 'living_street',
  // Paris's bike tunnels under its great squares (Tunnel de l'Étoile, Tunnel Concorde) are cycleways
  'cycleway'])
/** bike tunnels whatever OSM's class: the Tunnel des Tuileries is `service` (owner, 2026-11-05: "reserved for pedestrians and bicycles") */
const BIKE_TUNNELS = new Set(['Tunnel des Tuileries', 'Tunnel Concorde', "Tunnel de l'Étoile"])
/**
 * Under a hill: the ground never below the bore (this much over it, everywhere but near its mouths) and well above
 * it somewhere. A cover of 4 m throughout failed the Broadway Tunnel, whose east end runs in under a slope rising
 * 1 m in 20 m on the coarse ground — and under the Geary Boulevard underpasses the ground is 2 m over at most.
 */
export const COVER = 0.5
export const PEAK = 8
/** …but for a street under a great building and not a hill: the Avenue du Maine under the Gare Montparnasse (owner, 2026-10-31: "it doesn't go into the terrain"), 5.9 m of cover */
const UNDER_A_BUILDING = new Set(['Avenue du Maine'])
const SHALLOW_PEAK = 5
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
  const isBore = (e: TunnelEdge): boolean => !!e.tunnel && !e.foot && (STREET.has(e.kind ?? '') || BIKE_TUNNELS.has(e.name ?? ''))
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
    // (a known bike tunnel is a tunnel whatever the ground says: the Tuileries' quay is low on the coarse ground, and
    //  the fill in tools/bake.ts raises the ground over its crown)
    const known = BIKE_TUNNELS.has(name)
    if (known) report?.(name, `the street is a known bike tunnel, ridden with at most ${peak.toFixed(1)} m of ground over it`)
    else if (peak < (UNDER_A_BUILDING.has(name) ? SHALLOW_PEAK : PEAK)) { report?.(name, `not under a hill: at most ${peak.toFixed(1)} m of ground over it`); continue }
    for (let i = 0; i < line.length && covered && !known; i++) {
      if (cum[i] < MOUTH || cum[i] > L - MOUTH) continue
      if (ground(line[i].x, line[i].z) - y(cum[i]) < COVER) { covered = false; report?.(name, `only ${(ground(line[i].x, line[i].z) - y(cum[i])).toFixed(1)} m of ground over it ${Math.round(cum[i])} m in`) }
    }
    // (and between the vertices, every 10 m)
    for (let d = MOUTH; d <= L - MOUTH && covered && !known; d += 10) {
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

/** a road tunnel no bore takes (tools/paris-portals.ts draws its mouth): these classes, as there */
const ROAD_TUNNEL = /^(motorway|trunk|primary|secondary)(_link)?$/
/** a sunk mouth's road climbs back to its own level over this far (≈7% for CLEAR) */
export const SINK_RAMP = 90
/** a street counts as over the mouth if it crosses the tunnel within this far of it */
const SINK_OVER = 25
/** a near-miss join (tools/gaps.ts) at a sunk mouth is dropped when shorter than this: it would be a cliff */
const SINK_STUB = 20
const GAP_NODE_BASE = 9e14
/** a road tunnel this near a bridge deck, its whole chain no longer than this, is a road under the bridge: not sunk (0 sinks all) */
const UNDER_DECK_R = Number(process.env.UNDER_DECK_R ?? 40), UNDER_DECK_LEN = 90
/** …and only a quay road (or an unnamed piece of street): the Périphérique under an overpass, a street under a railway, still sink */
const QUAY_NAME = /^(Quai|Port|Voie|Berges?|Rampe)\b/

/**
 * SUNK MOUTHS (owner, 2026-11-05, the Voie Georges-Pompidou under the Place de l'Alma: "the road doesn't descend…
 * the route goes right through a tunnel entrance, when it is really supposed to be going over a submerged tunnel
 * entrance"). A road tunnel no bore takes is neither drawn nor ridden, but its mouth is (paris-portals.ts) — and the
 * road into it ran in at grade, the street over the tunnel crossing the portal at the same level. Where a street
 * crosses the tunnel near a mouth, the mouth is sunk CLEAR below it and the road in ramps down to it in a cut, so the
 * portal's headwall comes up to the street and no higher. Returns the ids of near-miss stubs to drop.
 */
export function sinkRoadMouths(edges: TunnelEdge[], report?: (name: string, why: string) => void, exempt?: (x: number, z: number) => boolean): Set<number> {
  const drop = new Set<number>()
  const byNode = new Map<number, TunnelEdge[]>()
  for (const e of edges) for (const n of [e.a, e.b]) (byNode.get(n) ?? byNode.set(n, []).get(n)!).push(e)
  const isT = (e: TunnelEdge): boolean => !!e.tunnel && !e.bore && !e.foot && ROAD_TUNNEL.test(e.kind ?? '')
  const open = (e: TunnelEdge): boolean => !e.tunnel && !e.foot && (e.layer ?? 0) >= 0 && !!e.heights?.length
  // a short road "tunnel" by a bridge deck is the road under the bridge (a quay under its bridgehead, owner 2026-11-06:
  // "not really a tunnel and don't need a terrain tweak, since the bridge deck is above") — not a mouth to sink. Short
  // is the whole tunnel chain, so the Voie Georges-Pompidou under the Alma still sinks.
  const decks = edges.filter((e) => e.bridge && !e.tunnel).map((e) => unpackPoints(e.points))
  const segD = (p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number => {
    const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz
    const s = L ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / L)) : 0
    return Math.hypot(p.x - a.x - s * dx, p.z - a.z - s * dz)
  }
  const nearDeck = (tp: { x: number; z: number }[]): number => {
    let m = Infinity
    for (const d of decks) for (let j = 1; j < d.length; j++) for (const p of tp) m = Math.min(m, segD(p, d[j - 1], d[j]))
    return m
  }
  const chainLen = (t0: TunnelEdge): number => {
    const seen = new Set([t0]), todo = [t0]
    let len = 0
    while (todo.length) {
      const t = todo.pop()!
      const tp = unpackPoints(t.points)
      len += lengths(tp)[tp.length - 1]
      for (const n of [t.a, t.b]) for (const o of byNode.get(n) ?? []) if (isT(o) && !seen.has(o)) { seen.add(o); todo.push(o) }
    }
    return len
  }
  for (const t of edges) {
    if (!isT(t)) continue
    const tp = unpackPoints(t.points)
    if (UNDER_DECK_R > 0 && (t.name ? QUAY_NAME.test(t.name) : !/^(motorway|trunk)/.test(t.kind ?? '')) && nearDeck(tp) < UNDER_DECK_R && chainLen(t) <= UNDER_DECK_LEN) { report?.(t.name ?? `tunnel ${t.id}`, 'under a bridge: left at its own level'); continue }
    for (const n of [t.a, t.b]) {
      const into = (byNode.get(n) ?? []).filter(open)
      if (!into.length) continue
      // the tunnel's first SINK_OVER metres from this mouth
      const fromN = t.a === n ? tp : [...tp].reverse()
      const fc = lengths(fromN)
      const mouth = fromN[0]
      // a mouth in a bridgehead's deck zone (tools/deck-zones.ts): the zone grades its roads; sinking dug a pit (owner 2026-11-07)
      if (exempt?.(mouth.x, mouth.z)) { report?.(t.name ?? `tunnel ${t.id}`, `mouth at ${mouth.x.toFixed(0)},${mouth.z.toFixed(0)} by a deck zone: left at its own level`); continue }
      let top = -Infinity
      for (const o of edges) {
        if (!open(o) || o.a === n || o.b === n || /^(service|footway|cycleway|path|steps)$/.test(o.kind ?? '')) continue
        const op = unpackPoints(o.points)
        if (op.every((q) => Math.hypot(q.x - mouth.x, q.z - mouth.z) > SINK_OVER + 60)) continue
        const oc = lengths(op)
        for (let d = 2; d <= Math.min(SINK_OVER, fc[fc.length - 1]); d += 2) {
          const hit = nearest(op, oc, nearestPoint(fromN, fc, d))
          if (hit.off > (o.width ?? 8) / 2 + 1) continue
          const k = Math.min(o.heights!.length - 1, Math.round((hit.along / (oc[oc.length - 1] || 1)) * (o.heights!.length - 1)))
          top = Math.max(top, o.heights![k])
        }
      }
      if (!Number.isFinite(top)) continue
      const y = top - CLEAR
      const here = Math.min(...into.map((o) => (o.a === n ? o.heights![0] : o.heights![o.heights!.length - 1])))
      if (here <= y + 0.3) continue
      const name = t.name ?? `tunnel ${t.id}`
      // the road straight on out of the mouth ramps down to it, along its chain for SINK_RAMP metres
      const out = { x: fromN[0].x - fromN[Math.min(1, fromN.length - 1)].x, z: fromN[0].z - fromN[Math.min(1, fromN.length - 1)].z }
      const ol = Math.hypot(out.x, out.z) || 1
      let ramped = 0
      for (const o of into) {
        const op = unpackPoints(o.points)
        const len = lengths(op)[op.length - 1]
        const far = o.a === n ? o.b : o.a
        // a near-miss join or a scrap to another road: a cliff once the mouth is sunk
        if (len < SINK_STUB && (far >= GAP_NODE_BASE || n >= GAP_NODE_BASE)) { drop.add(o.id); continue }
        const away = o.a === n ? op : [...op].reverse()
        const k = Math.min(away.length - 1, 1)
        const dir = { x: away[k].x - away[0].x, z: away[k].z - away[0].z }
        if ((dir.x * out.x + dir.z * out.z) / (ol * (Math.hypot(dir.x, dir.z) || 1)) < 0.5) continue
        // walk the chain on from the mouth
        let node = n, cur: TunnelEdge | undefined = o, run = 0
        while (cur && run < SINK_RAMP) {
          const p = unpackPoints(cur.points)
          const c = lengths(p)
          const L = c[c.length - 1]
          const fromA = cur.a === node
          const start = run
          cur.heights = cur.heights!.map((h, i) => {
            const d = start + (fromA ? c[i] : L - c[i])
            if (d >= SINK_RAMP) return h
            const s = d / SINK_RAMP
            return Math.round(Math.min(h, y + (h - y) * s * s * (3 - 2 * s)) * 100) / 100
          })
          cur.cut = true
          ramped++
          run += L
          node = fromA ? cur.b : cur.a
          const prev: TunnelEdge = cur
          const next = (byNode.get(node) ?? []).filter((x) => x !== prev && open(x) && x.name === prev.name && x.kind === prev.kind)
          cur = next.length === 1 ? next[0] : undefined
        }
      }
      if (ramped) report?.(name, `mouth at ${mouth.x.toFixed(0)},${mouth.z.toFixed(0)} sunk ${(here - y).toFixed(1)} m under the street over it, ${ramped} way(s) ramped down to it`)
    }
  }
  return drop
}

/** a lid's slab: an outline over its trench (the package's `bridges`, `lid` set), `dir` along the trench, `y` the street on it */
export type LidSlab = { ring: P[]; dir: P; y: number }

/** one slab over each lid trench, or over two or three side by side (a quai's two carriageways): the hull of their corridors */
function lidSlabs(decks: LidDeck[]): LidSlab[] {
  const unit = (k: LidDeck): P => { const a = k.line[0], b = k.line[k.line.length - 1], l = Math.hypot(b.x - a.x, b.z - a.z) || 1; return { x: (b.x - a.x) / l, z: (b.z - a.z) / l } }
  const mid = (k: LidDeck): P => nearestPoint(k.line, k.cum, k.L / 2)
  const group: number[] = decks.map((_, i) => i)
  const root = (i: number): number => (group[i] === i ? i : (group[i] = root(group[i])))
  for (let i = 0; i < decks.length; i++) for (let j = i + 1; j < decks.length; j++) {
    const ui = unit(decks[i]), uj = unit(decks[j])
    const mi = mid(decks[i]), mj = mid(decks[j])
    if (Math.abs(ui.x * uj.x + ui.z * uj.z) > 0.8 && Math.hypot(mi.x - mj.x, mi.z - mj.z) < decks[i].half + decks[j].half + 2 * LID_SLAB_MARGIN + 4) group[root(j)] = root(i)
  }
  const out: LidSlab[] = []
  for (const g of new Set(decks.map((_, i) => root(i)))) {
    const ks = decks.filter((_, i) => root(i) === g)
    const u0 = unit(ks[0])
    const pts: P[] = []
    let dx = 0, dz = 0
    for (const k of ks) {
      const u = unit(k), sg = u.x * u0.x + u.z * u0.z < 0 ? -1 : 1
      dx += u.x * sg; dz += u.z * sg
      const r = k.half + LID_SLAB_MARGIN
      for (let i = 0; i < k.line.length; i++) {
        const a = k.line[Math.max(0, i - 1)], b = k.line[Math.min(k.line.length - 1, i + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
        const nx = -(b.z - a.z) / l, nz = (b.x - a.x) / l
        pts.push({ x: k.line[i].x + nx * r, z: k.line[i].z + nz * r }, { x: k.line[i].x - nx * r, z: k.line[i].z - nz * r })
      }
    }
    const dl = Math.hypot(dx, dz) || 1
    // an oriented rectangle on the trench's axis: two long sides along it, two mouths across (a hull's corners made a
    // staircase of short edges, each taking a parapet or not)
    const ux = dx / dl, uz = dz / dl
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity
    for (const q of pts) { const a = q.x * ux + q.z * uz, b = -q.x * uz + q.z * ux; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b) }
    const at = (a: number, b: number): P => ({ x: Math.round((a * ux - b * uz) * 100) / 100, z: Math.round((a * uz + b * ux) * 100) / 100 })
    const y = Math.max(...ks.map((k) => k.top))
    const ring = [at(a0, b0), at(a1, b0), at(a1, b1), at(a0, b1)]
    for (const k of ks) { k.top = y; k.slab = ring }
    out.push({ ring, dir: { x: ux, z: uz }, y })
  }
  return out
}

/**
 * The ways crossing over an open lid trench become short bridges: the stretch of each on the lid's slab is cut out of
 * it as its own edge with `bridge`, flat at the slab's level, drawn as a surface on the slab (render/city.ts
 * `structured`) and never levelled into the ground, so the trench stays open beneath it.
 */
type LidDeck = { line: P[]; cum: number[]; ys: number[]; L: number; half: number; chain: Set<TunnelEdge>; top: number; slab?: P[] }
function overLids(edges: TunnelEdge[], decks: LidDeck[], drop: Set<number>): number {
  let id = edges.reduce((m, e) => Math.max(m, e.id), 0) + 1
  let node = LID_NODE0
  for (const e of edges) for (const v of [e.a, e.b]) if (v >= LID_NODE0 && v < LID_NODE0 + 1e12) node = Math.max(node, v + 1)
  let made = 0
  const mouthNodes = new Set<number>()
  for (const k of decks) { const c = new Map<number, number>(); for (const e of k.chain) for (const n of [e.a, e.b]) c.set(n, (c.get(n) ?? 0) + 1); for (const [n, m] of c) if (m === 1) mouthNodes.add(n) }
  for (const o of [...edges]) {
    if (o.tunnel || o.bore || o.bridge || drop.has(o.id) || !o.heights?.length || o.heights.length * 2 !== o.points.length) continue
    // (never a lid's own road or ramp, nor a way out of a lid's mouth: Quai de Bercy 156 left one trench's mouth inside
    //  the other's corridor, became a deck, and the bridge ramps then pulled that trench up to the deck — 1.6 m at its mouth)
    if (lidRoadIds.has(o.id) || mouthNodes.has(o.a) || mouthNodes.has(o.b) || decks.some((k) => k.chain.has(o))) continue
    const p = unpackPoints(o.points)
    const oc = lengths(p)
    const Lo = oc[oc.length - 1]
    const hAt0 = (s: number): number => { let i = 1; while (i < oc.length - 1 && oc[i] < s) i++; const t = Math.max(0, Math.min(1, (s - oc[i - 1]) / ((oc[i] - oc[i - 1]) || 1))); return o.heights![i - 1] + (o.heights![i] - o.heights![i - 1]) * t }
    const xzAt0 = (s: number): P => { let i = 1; while (i < oc.length - 1 && oc[i] < s) i++; const t = Math.max(0, Math.min(1, (s - oc[i - 1]) / ((oc[i] - oc[i - 1]) || 1))); return { x: p[i - 1].x + (p[i].x - p[i - 1].x) * t, z: p[i - 1].z + (p[i].z - p[i - 1].z) * t } }
    // the stretches of the way ON a lid's slab (inside its rectangle, LID_SLAB_EDGE beyond its edge) and up at the
    // street (no lower than LID_DECK_MIN under the slab's level): every way across the slab is a deck the whole way
    // over — a deck only over the trench road left the street under the slab's concrete either side of it
    const spans: [number, number][] = []
    let pin = -Infinity
    const slabs = [...new Set(decks.map((k) => k.slab).filter((r): r is P[] => !!r))]
    for (const ring of slabs) {
      const y = decks.find((k) => k.slab === ring)!.top
      const onIt = (q: P): boolean => {
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i], b = ring[(i + 1) % ring.length], ex = b.x - a.x, ez = b.z - a.z, el = Math.hypot(ex, ez) || 1
          if ((ex * (q.z - a.z) - ez * (q.x - a.x)) / el < -LID_SLAB_EDGE) return false
        }
        return true
      }
      let run: number | null = null
      const close = (s: number): void => { if (run !== null && s - run > 0.5) { spans.push([run, s]); pin = Math.max(pin, y) } run = null }
      for (let s = 0; s <= Lo + 1e-6; s += LID_DECK_STEP) {
        const q = xzAt0(Math.min(s, Lo))
        if (onIt(q) && hAt0(Math.min(s, Lo)) >= y - LID_DECK_MIN) { if (run === null) run = s } else close(s)
      }
      close(Lo)
    }
    if (!spans.length) continue
    spans.sort((x, y) => x[0] - y[0])
    const merged: [number, number][] = []
    for (const sp of spans) { const m = merged.at(-1); if (m && sp[0] <= m[1] + 2) m[1] = Math.max(m[1], sp[1]); else merged.push([...sp]) }
    const cuts: { s: number; bridge: boolean }[] = []
    for (const [s0, s1] of merged) cuts.push({ s: s0 < 2 ? 0 : s0, bridge: true }, { s: s1 > Lo - 2 ? Lo : s1, bridge: false })
    const pieces: { from: number; to: number; bridge: boolean }[] = []
    let at = 0, br = false
    for (const c of cuts) { if (c.s > at + 0.01) pieces.push({ from: at, to: c.s, bridge: br }); at = c.s; br = c.bridge }
    if (Lo > at + 0.01) pieces.push({ from: at, to: Lo, bridge: br })
    const out: TunnelEdge[] = []
    let nodeA = o.a
    pieces.forEach(({ from, to, bridge }, k) => {
      const pts: number[] = [], hs: number[] = []
      const add = (s: number): void => { const q = xzAt0(s); pts.push(Math.round(q.x * 100) / 100, Math.round(q.z * 100) / 100); hs.push(Math.round(hAt0(s) * 100) / 100) }
      add(from)
      for (let i = 0; i < oc.length; i++) if (oc[i] > from + 0.01 && oc[i] < to - 0.01) { pts.push(o.points[2 * i], o.points[2 * i + 1]); hs.push(o.heights![i]) }
      add(to)
      const nodeB = k === pieces.length - 1 ? o.b : node++
      const piece: TunnelEdge = { ...o, id: k === 0 ? o.id : id++, a: nodeA, b: nodeB, points: pts, heights: hs }
      // (flat at the slab's level: the slab is drawn just under it; footway 721 had sagged to 0.5 over a −2.6 road)
      if (bridge) { piece.bridge = true; piece.layer = Math.max(1, o.layer ?? 0); delete piece.cut; piece.heights = hs.map(() => Math.round(pin * 100) / 100); lidDeckIds.add(piece.id); made++ }
      out.push(piece)
      nodeA = nodeB
    })
    // the way either side of a deck eases to the slab's level over LID_EASE (no step where the flat deck meets it)
    out.forEach((q, k) => {
      if (q.bridge) return
      const qc = lengths(unpackPoints(q.points)), Lq = qc[qc.length - 1] || 1
      const ease = (h: number, d: number): number => { const t = Math.min(1, d / Math.min(LID_EASE, Lq)); return pin + (h - pin) * t * t * (3 - 2 * t) }
      q.heights = q.heights!.map((h, i) => {
        let v = h
        if (out[k - 1]?.bridge) v = ease(v, qc[i])
        if (out[k + 1]?.bridge) v = ease(v, Lq - qc[i])
        return Math.round(v * 100) / 100
      })
    })
    edges.splice(edges.indexOf(o), 1, ...out)
  }
  return made
}

/** a LID TUNNEL: a road under a street in a short covered trench, not a bore through a hill (`lidTunnels`) */
const LID_KIND = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential)(_link)?$/
/** longest lid chain, mouth to mouth (the Porte de Bercy slips under the Périphérique are 60–200 m) */
export const LID_MAX = Number(process.env.LID_MAX ?? 250)
/** the road under a lid is this far below the street over it (IGN: ≈ 4 m under the Quai de Bercy junction) */
export const LID_CLEAR = Number(process.env.LID_CLEAR ?? 4.6)
/** the roads out of a lid's mouth come back up to their own level over this far (≈ 9% at the steepest for 5.5 m) */
export const LID_RAMP = 100
/** a cycle track or pavement this far beyond a lid road's kerb is beside its trench, up on the street */
export const LID_BESIDE = Number(process.env.LID_BESIDE ?? 12)
/** OPEN (default): the lid is an open trench and every way crossing over it a short bridge; LID_OPEN=0 → the old low bore */
export const LID_OPEN = process.env.LID_OPEN !== '0'
/** a way crossing the trench this much or more over its road is a deck over it; less, it is a way down in the trench */
export const LID_DECK_MIN = 2.5
/** the street over a lid stands no more than this over the ground beside its mouths (more: an embankment, not a lid) */
export const LID_EMBANK = Number(process.env.LID_EMBANK ?? 2)
/** …and the road into it, LID_RAMP out (the mean of its two ends), no more than this under that street: it came at grade */
export const LID_GRADE = Number(process.env.LID_GRADE ?? 3)
/** a road out of a lid's mouth shorter than this, to no other road, is a stub and dropped */
const LID_STUB = 15
/** a way on a lid's slab is a deck to this far past the slab's edge (more, and a way alongside the edge became a deck drawn with its own structure) */
const LID_SLAB_EDGE = 0.5
/** the corridor test steps along a crossing way this often, metres */
const LID_DECK_STEP = 0.5
/** a deck piece is flat at its slab's level; the way either side eases to it over this, metres */
const LID_EASE = 10
/** a lid's slab reaches this far past its trench road's kerb, each side (over the trench's banks) */
export const LID_SLAB_MARGIN = Number(process.env.LID_SLAB_MARGIN ?? 3)
/** the roads of open lids, trench and ramps: the bake grades the ground to them and never calls them structures */
export const lidRoadIds = new Set<number>()
/** the decks cut out over open lids: their heights are the street's, and nothing after re-levels them */
export const lidDeckIds = new Set<number>()
/** new ids for the decks cut out of the crossing ways */
const LID_NODE0 = 8.5e14

/**
 * LID TUNNELS (owner, 2026-11-07, the Quai de Bercy under the Avenue des Terroirs de France: "not real tunnels in the
 * way the Tuileries tunnel is — more of just a lid on a normal road… ideally cyclists could go through or go over").
 * A short road tunnel no bore took (no hill over it) with a street crossing it anywhere along it was sunk CLEAR (6.5 m,
 * the SF tube) under that street and left unridden, or opened and ridden through the ground: a 4 m too-deep dip.
 * Instead it is a BORE (ridden, drawn by render/tunnels.ts, the ground filled back to the street over it) at
 * LID_CLEAR under the street, and the roads into it ramp down over LID_RAMP in a cut. Cycleways and footways beside
 * them are never ramped: they stay on the street. `skip(x, z)`: a mouth there is left alone (a deck zone grades it).
 * Run after `boreTunnels`, before `sinkRoadMouths` (which skips bores). Returns the ids of near-miss stubs to drop.
 */
export function lidTunnels(edges: TunnelEdge[], report?: (name: string, why: string) => void, skip?: (x: number, z: number) => boolean, slabs?: LidSlab[], ground?: (x: number, z: number) => number): Set<number> {
  const drop = new Set<number>()
  const byNode = new Map<number, TunnelEdge[]>()
  for (const e of edges) for (const n of [e.a, e.b]) (byNode.get(n) ?? byNode.set(n, []).get(n)!).push(e)
  const isT = (e: TunnelEdge): boolean => !!e.tunnel && !e.bore && !e.foot && LID_KIND.test(e.kind ?? '')
  const open = (e: TunnelEdge): boolean => !e.tunnel && !e.bore && !e.foot && (e.layer ?? 0) >= 0 && !!e.heights?.length
  const road = (e: TunnelEdge): boolean => open(e) && !/^(service|footway|cycleway|path|steps|pedestrian|track)$/.test(e.kind ?? '')
  const seen = new Set<number>()
  /** the street level beside each lid and its ramps: the cycle tracks and pavements alongside stay up on it */
  const beside: { x: number; z: number; h: number; r: number }[] = []
  const decks: { line: P[]; cum: number[]; ys: number[]; L: number; half: number; chain: Set<TunnelEdge>; top: number }[] = []
  const mouthY = new Map<number, number>()
  for (const start of edges) {
    if (!isT(start) || seen.has(start.id)) continue
    const chain: TunnelEdge[] = []
    const todo = [start]
    seen.add(start.id)
    while (todo.length) {
      const e = todo.pop()!
      chain.push(e)
      for (const n of [e.a, e.b]) for (const o of byNode.get(n) ?? []) if (isT(o) && !seen.has(o.id)) { seen.add(o.id); todo.push(o) }
    }
    const name = chain.find((e) => e.name)?.name ?? `tunnel ${start.id}`
    const count = new Map<number, number>()
    for (const e of chain) for (const n of [e.a, e.b]) count.set(n, (count.get(n) ?? 0) + 1)
    const mouths = [...count].filter(([, c]) => c === 1).map(([n]) => n)
    if (mouths.length !== 2) continue
    const line: P[] = []
    const order: TunnelEdge[] = []
    let node = mouths[0]
    const used = new Set<number>()
    for (let g = 0; g < chain.length; g++) {
      const e = chain.find((c) => !used.has(c.id) && (c.a === node || c.b === node))
      if (!e) break
      used.add(e.id)
      order.push(e)
      const p = unpackPoints(e.points)
      const pts = e.b === node ? [...p].reverse() : p
      line.push(...(line.length ? pts.slice(1) : pts))
      node = e.b === node ? e.a : e.b
    }
    if (used.size !== chain.length || node !== mouths[1]) continue
    const cum = lengths(line)
    const L = cum[cum.length - 1]
    if (L > LID_MAX) continue
    const ends = [line[0], line[line.length - 1]]
    if (skip && ends.some((q) => skip(q.x, q.z))) { report?.(name, 'lid tunnel by a deck zone: left to the zone'); continue }
    // the street over it, anywhere along it
    let top = -Infinity
    for (const o of edges) {
      if (!road(o) || o.bridge || mouths.includes(o.a) || mouths.includes(o.b)) continue
      const op = unpackPoints(o.points)
      const oc = lengths(op)
      if (op.every((q) => Math.min(...ends.map((m) => Math.hypot(q.x - m.x, q.z - m.z))) > L + 60)) continue
      for (let d = 2; d < L - 1; d += 2) {
        const hit = nearest(op, oc, nearestPoint(line, cum, d))
        if (hit.off > (o.width ?? 8) / 2 + 1) continue
        const k = Math.min(o.heights!.length - 1, Math.round((hit.along / (oc[oc.length - 1] || 1)) * (o.heights!.length - 1)))
        top = Math.max(top, o.heights![k])
      }
    }
    if (!Number.isFinite(top)) continue
    /*
     * CUT-AND-COVER only (2026-11-08): a lid is a street over a road sunk under flat ground. Where the street over it
     * already stands on an embankment — the Porte de Bercy slips under the Périphérique, `top` 6–12 m with the ground
     * beside the mouths 4–6 m lower — the trench carved a corridor through the bank and floated a slab on its crown.
     * The ground is read beside each mouth, off the road (at the mouth itself the lidar sees the trench floor).
     */
    let gBeside = NaN
    if (ground) {
      const beside: number[] = []
      for (const [m, q] of [[ends[0], line[1]], [ends[1], line[line.length - 2]]] as [P, P][]) {
        const l = Math.hypot(q.x - m.x, q.z - m.z) || 1, nx = -(q.z - m.z) / l, nz = (q.x - m.x) / l, r = (order[0].width ?? 8) / 2 + LID_BESIDE
        beside.push(ground(m.x + nx * r, m.z + nz * r), ground(m.x - nx * r, m.z - nz * r))
      }
      const g = beside.sort((a, b) => a - b)[Math.floor(beside.length / 2)]
      gBeside = g
      if (top - g > LID_EMBANK) { report?.(name, `under an embankment (street over it ${top.toFixed(1)}, ground beside ${g.toFixed(1)}): not a lid`); continue }
    }
    const lidY = top - LID_CLEAR
    const heres = mouths.map((n) => {
      const into = (byNode.get(n) ?? []).filter(road)
      return into.length ? Math.min(...into.map((o) => (o.a === n ? o.heights![0] : o.heights![o.heights!.length - 1]))) : lidY
    })
    // …and the road came to it AT GRADE: a road meeting its mouths well under the street over it is already in its
    // own cut or running into a rise (the 93 m Quai de Bercy chain, 2.4 under 7.0; tunnel 389, 1.5 under 6.1) — a tunnel
    // (its level LID_RAMP out along the road, as the ramps take it: at the mouth boreTunnels' trench-following has
    //  already pulled the road down to the lidar's trench floor)
    const level = mouths.map((n, mi) => {
      const fromN = mi === 0 ? line : [...line].reverse()
      const out = { x: fromN[0].x - fromN[1].x, z: fromN[0].z - fromN[1].z }
      const ol = Math.hypot(out.x, out.z) || 1
      let best = -Infinity
      for (const o of (byNode.get(n) ?? []).filter(road)) {
        const op = unpackPoints(o.points)
        const away = o.a === n ? op : [...op].reverse()
        const dir = { x: away[1].x - away[0].x, z: away[1].z - away[0].z }
        if ((dir.x * out.x + dir.z * out.z) / (ol * (Math.hypot(dir.x, dir.z) || 1)) < 0.5) continue
        let nd = n, cur: TunnelEdge | undefined = o, run = 0, H = NaN
        for (let g = 0; cur && g < 20 && Number.isNaN(H); g++) {
          const p = unpackPoints(cur.points), c = lengths(p), Lc = c[c.length - 1], fromA = cur.a === nd
          for (let i = 0; i < p.length && Number.isNaN(H); i++) { const j = fromA ? i : p.length - 1 - i; if (run + (fromA ? c[j] : Lc - c[j]) >= LID_RAMP) H = cur.heights![j] }
          run += Lc
          nd = fromA ? cur.b : cur.a
          const prev: TunnelEdge = cur
          const next = (byNode.get(nd) ?? []).filter((x) => x !== prev && road(x) && x.name === prev.name && x.kind === prev.kind)
          cur = next.length === 1 ? next[0] : undefined
        }
        if (!Number.isNaN(H)) best = Math.max(best, H)
      }
      return best
    })
    const known = level.filter((h) => Number.isFinite(h))
    if (!known.length || known.reduce((a, b) => a + b, 0) / known.length < top - LID_GRADE) { report?.(name, `its road ${LID_RAMP} m out is at ${level.map((h) => h.toFixed(1)).join(' / ')}, under the street over it at ${top.toFixed(1)}: not a lid`); continue }
    const ys = heres.map((here) => Math.min(here, lidY))
    let ramped = 0
    mouths.forEach((n, mi) => {
      const y = ys[mi]
      const fromN = mi === 0 ? line : [...line].reverse()
      const out = { x: fromN[0].x - fromN[1].x, z: fromN[0].z - fromN[1].z }
      const ol = Math.hypot(out.x, out.z) || 1
      for (const o of (byNode.get(n) ?? []).filter(road)) {
        const op = unpackPoints(o.points)
        const len = lengths(op)[op.length - 1]
        const far = o.a === n ? o.b : o.a
        if (len < SINK_STUB && (far >= GAP_NODE_BASE || n >= GAP_NODE_BASE)) { drop.add(o.id); continue }
        const away = o.a === n ? op : [...op].reverse()
        const dir = { x: away[1].x - away[0].x, z: away[1].z - away[0].z }
        if ((dir.x * out.x + dir.z * out.z) / (ol * (Math.hypot(dir.x, dir.z) || 1)) < 0.5) continue
        // walk the chain on from the mouth; the ramp runs from the mouth up to the height LID_RAMP out, whatever lies
        // between (boreTunnels' trench-following had already pulled the last 80 m down to the lidar's floor in steps)
        const visits: { e: TunnelEdge; i: number; d: number }[] = []
        let nd = n, cur: TunnelEdge | undefined = o, run = 0, H = NaN, Hd = Infinity
        while (cur && run < LID_RAMP) {
          const p = unpackPoints(cur.points)
          const c = lengths(p)
          const Lc = c[c.length - 1]
          const fromA = cur.a === nd
          for (let i = 0; i < p.length; i++) {
            const d = run + (fromA ? c[i] : Lc - c[i])
            if (d < LID_RAMP) visits.push({ e: cur, i, d })
            else if (d < Hd) { Hd = d; H = cur.heights![i] }
          }
          cur.cut = true
          if (LID_OPEN) lidRoadIds.add(cur.id)
          ramped++
          run += Lc
          nd = fromA ? cur.b : cur.a
          const prev: TunnelEdge = cur
          const next = (byNode.get(nd) ?? []).filter((x) => x !== prev && road(x) && x.name === prev.name && x.kind === prev.kind)
          cur = next.length === 1 ? next[0] : undefined
          if (Number.isFinite(H)) break
        }
        if (!visits.length) continue
        const span = Number.isFinite(H) ? LID_RAMP : Math.max(1, ...visits.map((v) => v.d))
        if (!Number.isFinite(H)) { const last = visits.reduce((a, b) => (b.d > a.d ? b : a)); H = last.e.heights![last.i] }
        for (const v of visits) {
          const s = Math.min(1, v.d / span)
          v.e.heights![v.i] = Math.round((y + (H - y) * s * s * (3 - 2 * s)) * 100) / 100
          beside.push({ x: unpackPoints(v.e.points)[v.i].x, z: unpackPoints(v.e.points)[v.i].z, h: H, r: (v.e.width ?? 8) / 2 + LID_BESIDE })
        }
      }
    })
    for (let d = 0; d <= L; d += 4) { const q = nearestPoint(line, cum, d); beside.push({ x: q.x, z: q.z, h: top, r: (order[0].width ?? 8) / 2 + LID_BESIDE }) }
    for (const e of order) {
      const p = unpackPoints(e.points)
      e.heights = p.map((q) => { const t = L > 0 ? nearest(line, cum, q).along / L : 0; return Math.round((ys[0] + (ys[1] - ys[0]) * t) * 100) / 100 })
      if (LID_OPEN) { delete e.tunnel; if ((e.layer ?? 0) < 0) delete e.layer; e.cut = true; lidRoadIds.add(e.id) }
      else { e.bore = true; e.lid = LID_CLEAR }
    }
    if (LID_OPEN) decks.push({ line, cum, ys, L, half: Math.max(...order.map((e) => e.width ?? 8)) / 2, chain: new Set(order), top })
    if (LID_OPEN) mouths.forEach((n, mi) => mouthY.set(n, ys[mi]))
    report?.(name, `lid tunnel, ${Math.round(L)} m: ridden ${LID_CLEAR} m under the street over it at ${top.toFixed(1)}, ground beside ${gBeside.toFixed(1)} (mouths ${ys.map((y) => y.toFixed(1)).join(' / ')}), ${ramped} way(s) ramped down to it`)
  }
  /*
   * Every other road out of a lid's mouth comes down to it as well (the Quai de Bercy's link between its two trenches'
   * mouths, 86, stood 1.8 m over both; a branch, 156, as much over one): between two mouths straight from one to the
   * other, out of one blended from the mouth's level back to its own over its length (LID_RAMP at most).
   */
  if (mouthY.size) {
    let met = 0
    for (const e of edges) {
      if (!road(e) || lidRoadIds.has(e.id) || drop.has(e.id) || e.heights!.length * 2 !== e.points.length) continue
      const ya = mouthY.get(e.a), yb = mouthY.get(e.b)
      if (ya === undefined && yb === undefined) continue
      const c = lengths(unpackPoints(e.points))
      const Le = c[c.length - 1] || 1
      // (a stub out of a mouth to nothing but footways — Quai de Bercy 156, 6 m up 3.4 m to a crossing — is dropped)
      const far = ya !== undefined ? e.b : e.a
      if ((ya === undefined || yb === undefined) && Le < LID_STUB && !(byNode.get(far) ?? []).some((o) => o !== e && road(o) && !drop.has(o.id))) { drop.add(e.id); continue }
      const span = Math.min(Le, LID_RAMP)
      const blend = (h: number, y: number, d: number): number => { const t = Math.min(1, d / span); return y + (h - y) * t * t * (3 - 2 * t) }
      e.heights = e.heights!.map((h, i) => Math.round((ya !== undefined && yb !== undefined ? ya + (yb - ya) * (c[i] / Le)
        : ya !== undefined ? blend(h, ya, c[i]) : blend(h, yb!, Le - c[i])) * 100) / 100)
      e.cut = true
      lidRoadIds.add(e.id)
      met++
    }
    if (met) report?.('lid tunnels', `${met} more roads out of their mouths brought down to them`)
  }
  // the cycle tracks and pavements beside a lid's trench, which the lidar's trench pulled down with it, back up on the street
  let raised = 0
  for (const f of edges) {
    if (f.tunnel || f.bore || f.bridge || !f.heights?.length || !(f.foot || /^(cycleway|footway|path|pedestrian)$/.test(f.kind ?? ''))) continue
    const p = unpackPoints(f.points)
    let hit = false
    f.heights = f.heights.map((h, i) => {
      let want = -Infinity
      for (const b of beside) if (Math.hypot(p[i].x - b.x, p[i].z - b.z) < b.r) want = Math.max(want, b.h)
      if (want > h + 0.5) { hit = true; return Math.round(want * 100) / 100 }
      return h
    })
    if (hit) raised++
  }
  if (raised) report?.('lid tunnels', `${raised} cycle tracks and pavements beside them kept up on the street`)
  if (decks.length) { const made = lidSlabs(decks); slabs?.push(...made); report?.('lid tunnels', `${made.length} lid slabs over ${decks.length} trenches`) }
  if (decks.length) report?.('lid tunnels', `${overLids(edges, decks, drop)} decks cut out of the ways crossing over their trenches`)
  return drop
}
