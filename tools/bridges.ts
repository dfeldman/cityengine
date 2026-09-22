/**
 * Heights for bridges and the ways that climb onto them (IMPROVEMENTS §2.4).
 *
 * Every street was at ground level: the Loop's L ran down the middle of the street, an overpass was coplanar
 * with the road it crossed, and the trainer was sent 0% on a bridge approach. A bridge edge gets its own
 * `heights[]` here, and the edges leading onto it a ramp, so the deck is somewhere and the grade is real.
 *
 * The rise is what the crossing needs, not a constant. Over water it is the clearance a boat needs above the
 * water, measured from the ends — which on the Seine's high quays is almost nothing, so the Pont Marie keeps
 * its gentle hump instead of a 17% ramp — clamped to 0.8–5 m. Over another way it is 5.5 m per layer above
 * that way. Otherwise 2 m.
 *
 * The profile: a raised-cosine hump within the span when that stays under 6%; otherwise a level deck at the
 * full rise, and the connected non-bridge edges ramped down to the ground over up to 60 m.
 */
export type Pt = { x: number; z: number }

export interface BridgeEdge {
  id: number
  a: number
  b: number
  points: number[]
  heights?: number[]
  bridge?: boolean
  tunnel?: boolean
  layer?: number
  foot?: boolean
}

export interface BridgeWorld {
  /** water polygons, each with its surface level */
  water: { ring: Pt[]; level: number }[]
  /** the ground under a point */
  ground: (x: number, z: number) => number
  /** water that runs UNDERGROUND (a canal in a tunnel): a "bridge" over it is a street over the vault, at grade */
  buried?: Pt[][]
}

/** above the water's surface: with Paris's 2.5 m drop to the river, a gentle 1 m hump over its quays */
const CLEARANCE_WATER = 3.5
const PER_LAYER = 5.5
const RAMP = 60
const MAX_HUMP_GRADE = 0.06

const pts = (flat: number[]): Pt[] => {
  const out: Pt[] = []
  for (let i = 0; i < flat.length; i += 2) out.push({ x: flat[i], z: flat[i + 1] })
  return out
}

function cumulative(p: Pt[]): number[] {
  const c = [0]
  for (let i = 1; i < p.length; i++) c.push(c[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z))
  return c
}

function inside(ring: Pt[], x: number, z: number): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) hit = !hit
  }
  return hit
}

/** Where segments p1p2 and q1q2 cross, as a parameter along the first, or null. */
function cross(p1: Pt, p2: Pt, q1: Pt, q2: Pt): number | null {
  const d = (p2.x - p1.x) * (q2.z - q1.z) - (p2.z - p1.z) * (q2.x - q1.x)
  if (Math.abs(d) < 1e-9) return null
  const t = ((q1.x - p1.x) * (q2.z - q1.z) - (q1.z - p1.z) * (q2.x - q1.x)) / d
  const u = ((q1.x - p1.x) * (p2.z - p1.z) - (q1.z - p1.z) * (p2.x - p1.x)) / d
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null
}

/**
 * Points every 10 m or closer, heights alongside. A bridge mapped as two points has no vertex in the middle
 * of its span for a hump to be at — the deck would be a straight line from end to end.
 */
function densify(e: BridgeEdge, world: BridgeWorld): void {
  const p = pts(e.points)
  const h = e.heights ?? p.map((q) => world.ground(q.x, q.z))
  const np: number[] = [p[0].x, p[0].z]
  const nh: number[] = [h[0]]
  for (let i = 1; i < p.length; i++) {
    const L = Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z)
    const n = Math.max(1, Math.ceil(L / 10))
    for (let k = 1; k <= n; k++) {
      const t = k / n
      np.push(Math.round((p[i - 1].x + (p[i].x - p[i - 1].x) * t) * 100) / 100,
        Math.round((p[i - 1].z + (p[i].z - p[i - 1].z) * t) * 100) / 100)
      nh.push(h[i - 1] + (h[i] - h[i - 1]) * t)
    }
  }
  e.points = np
  e.heights = nh
}

/**
 * Consecutive bridge edges as one bridge. OSM splits a long bridge at every node another way touches (the
 * Brooklyn Bridge promenade is six edges); humped edge by edge it would be a washboard. A chain runs through
 * nodes where exactly two bridge edges meet, each edge marked with whether it runs backwards in the chain.
 */
export function chains(deck: BridgeEdge[]): { e: BridgeEdge; reversed: boolean }[][] {
  const at = new Map<number, BridgeEdge[]>()
  for (const e of deck) for (const n of [e.a, e.b]) at.set(n, [...(at.get(n) ?? []), e])
  const used = new Set<number>()
  const out: { e: BridgeEdge; reversed: boolean }[][] = []
  const through = (n: number): boolean => (at.get(n)?.length ?? 0) === 2
  for (const seed of deck) {
    if (used.has(seed.id)) continue
    used.add(seed.id)
    const chain: { e: BridgeEdge; reversed: boolean }[] = [{ e: seed, reversed: false }]
    // forward from seed.b, then backward from seed.a
    for (const dir of [1, -1] as const) {
      let node = dir === 1 ? seed.b : seed.a
      for (let guard = 0; guard < 1000 && through(node); guard++) {
        const next = at.get(node)!.find((x) => !used.has(x.id))
        if (!next) break
        used.add(next.id)
        if (dir === 1) {
          const rev = next.b === node
          chain.push({ e: next, reversed: rev })
          node = rev ? next.a : next.b
        } else {
          const rev = next.a === node
          chain.unshift({ e: next, reversed: rev })
          node = rev ? next.b : next.a
        }
      }
    }
    out.push(chain)
  }
  return out
}

/** How high a bridge edge has to rise above its higher end, and why. */
export function bridgeRise(e: BridgeEdge, all: BridgeEdge[], world: BridgeWorld, ends: [number, number])
  : { rise: number; over: 'water' | 'way' | 'nothing' } {
  const p = pts(e.points)
  const cum = cumulative(p)
  const total = cum[cum.length - 1]
  // the midpoint, along the polyline
  let mid = p[0]
  for (let i = 1; i < p.length; i++) {
    if (cum[i] >= total / 2) {
      const t = (total / 2 - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1])
      mid = { x: p[i - 1].x + (p[i].x - p[i - 1].x) * t, z: p[i - 1].z + (p[i].z - p[i - 1].z) * t }
      break
    }
  }
  const top = Math.max(ends[0], ends[1])
  /*
   * Over water that runs underground, a bridge is the street over the vault: at grade. OSM maps Rue
   * Saint-Sabin across the Canal Saint-Martin's tunnel under Boulevard Richard-Lenoir as bridge=yes, layer 1,
   * and counting the median's footpath as a way passing under it lifted a 5.6 m deck on a pier over the lawn.
   */
  if (world.buried?.some((r) => inside(r, mid.x, mid.z))) return { rise: 0, over: 'nothing' }
  const water = world.water.find((w) => inside(w.ring, mid.x, mid.z))
  if (water) return { rise: Math.max(0.8, Math.min(5, water.level + CLEARANCE_WATER - top)), over: 'water' }

  // a way on a lower layer passing under it
  const layer = e.layer ?? 1
  let need = -Infinity
  let footOnlyUnder = false
  for (const o of all) {
    // a way below grade (a tunnel, the Pedway, Lower Wacker) is not drawn and needs no clearing: counting
    // it lifted the Loop's footbridges 11–16 m over corridors that are underground
    if (o.id === e.id || o.bridge || o.tunnel || (o.layer ?? 0) < 0 || (o.layer ?? 0) >= layer) continue
    // a way that JOINS the bridge (its own continuation, a cycle track meeting its end) touches it and does not
    // pass under it: counted, it lifted the Pont Morland 3.3 m over its own next piece (BUGS.md #31)
    if (o.a === e.a || o.a === e.b || o.b === e.a || o.b === e.b) continue
    const q = pts(o.points)
    if (o.foot && !e.foot) {
      for (let i = 1; i < p.length && !footOnlyUnder; i++) {
        for (let j = 1; j < q.length; j++) if (cross(p[i - 1], p[i], q[j - 1], q[j]) !== null) { footOnlyUnder = true; break }
      }
      continue
    }
    for (let i = 1; i < p.length; i++) {
      for (let j = 1; j < q.length; j++) {
        if (cross(p[i - 1], p[i], q[j - 1], q[j]) === null) continue
        const under = o.heights ? (o.heights[j - 1] + o.heights[j]) / 2 : world.ground(q[j].x, q[j].z)
        need = Math.max(need, under + PER_LAYER * Math.max(1, layer - (o.layer ?? 0)) - top)
      }
    }
  }
  if (need > -Infinity) return { rise: Math.max(0, need), over: 'way' }
  /*
   * Over nothing but footpaths — the Pont Morland over the Port de l'Arsenal promenade, which runs beneath in a
   * vault the terrain cannot show: at grade. Lifted 5.5 m over the path, it stood on ramps 60 m long with the
   * place round it painted at the foot of them (BUGS.md #31).
   */
  if (footOnlyUnder) return { rise: 0, over: 'nothing' }
  return { rise: 2, over: 'nothing' }
}

/**
 * Give every bridge edge its heights, and ramp the ways that lead onto a raised deck. Mutates `edges`;
 * returns the ids it raised (bridges and ramps), for the report and for the renderer's own test.
 */
export function bridgeHeights(edges: BridgeEdge[], world: BridgeWorld): { bridges: number; ramps: number; raised: Set<number> } {
  const raised = new Set<number>()
  // the deck height at each bridge end node, for the ramps
  const deckAt = new Map<number, number>()
  let bridges = 0
  const deckEdges = edges.filter((e) => e.bridge)
  for (const e of deckEdges) densify(e, world)
  for (const chain of chains(deckEdges)) {
    // the chain as one polyline: each edge's points in travel order, with its distance from the chain start
    const segs = chain.map(({ e, reversed }) => {
      const p = pts(e.points)
      const h = e.heights ?? p.map((q) => world.ground(q.x, q.z))
      return { e, reversed, p: reversed ? [...p].reverse() : p, h: reversed ? [...h].reverse() : h }
    })
    let acc = 0
    const starts: number[] = []
    for (const sg of segs) {
      starts.push(acc)
      acc += cumulative(sg.p)[sg.p.length - 1]
    }
    const L = acc
    const h0 = segs[0].h[0]
    const last = segs[segs.length - 1]
    const h1 = last.h[last.h.length - 1]
    let rise = 0
    // a bridge chain of a few metres is a culvert or a scrap of a bridge's pavement: it follows the ground
    if (L >= 12) for (const sg of segs) rise = Math.max(rise, bridgeRise(sg.e, edges, world, [h0, h1]).rise)
    const top = Math.max(h0, h1) + rise
    const hump = Math.PI * rise / Math.max(1, L) <= MAX_HUMP_GRADE
    segs.forEach((sg, k) => {
      const cum = cumulative(sg.p)
      const hs = cum.map((c) => {
        const t = L > 0 ? (starts[k] + c) / L : 0
        const base = h0 + (h1 - h0) * t
        const v = hump ? base + (top - base) * (1 - Math.cos(2 * Math.PI * t)) / 2 : top
        return Math.round(v * 100) / 100
      })
      sg.e.heights = sg.reversed ? hs.reverse() : hs
      raised.add(sg.e.id)
      bridges++
    })
    // a footbridge's ends are in buildings or on stairs, not ramps down to the pavement: a skyway 16 m up
    // ramped 60 m to the ground came out as an embankment down the middle of the street
    if (!hump && !segs.every((sg) => sg.e.foot)) {
      const first = chain[0]
      const end = chain[chain.length - 1]
      const a = first.reversed ? first.e.b : first.e.a
      const b = end.reversed ? end.e.a : end.e.b
      for (const node of [a, b]) deckAt.set(node, Math.max(deckAt.get(node) ?? -Infinity, top))
    }
  }

  // ---- the ramps: outward from every raised bridge end, along ways that are not bridges, over RAMP metres
  const byNode = new Map<number, BridgeEdge[]>()
  for (const e of edges) {
    for (const n of [e.a, e.b]) {
      const list = byNode.get(n)
      if (list) list.push(e)
      else byNode.set(n, [e])
    }
  }
  let ramps = 0
  for (const [start, deck] of deckAt) {
    // breadth-first by distance; each visited point gets max(current, the ramp's height there)
    const queue: { node: number; dist: number }[] = [{ node: start, dist: 0 }]
    const seen = new Map<number, number>([[start, 0]])
    while (queue.length > 0) {
      const { node, dist } = queue.shift()!
      for (const e of byNode.get(node) ?? []) {
        if (e.bridge) continue
        const p = pts(e.points)
        const cum = cumulative(p)
        const L = cum[cum.length - 1]
        const fromA = e.a === node
        const hs = e.heights ?? p.map((q) => world.ground(q.x, q.z))
        let changed = false
        const next = hs.map((h, i) => {
          const d = dist + (fromA ? cum[i] : L - cum[i])
          if (d >= RAMP) return h
          const g = world.ground(p[i].x, p[i].z)
          const ramp = g + (deck - g) * (1 - d / RAMP)
          if (ramp > h + 0.01) { changed = true; return Math.round(ramp * 100) / 100 }
          return h
        })
        if (changed) {
          e.heights = next
          if (!raised.has(e.id)) ramps++
          raised.add(e.id)
        }
        const other = fromA ? e.b : e.a
        const d = dist + L
        if (d < RAMP && (seen.get(other) ?? Infinity) > d) {
          seen.set(other, d)
          queue.push({ node: other, dist: d })
        }
      }
    }
  }
  return { bridges, ramps, raised }
}
