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
  /** OSM `highway`, so a freeway chain can be told from an ordinary bridge (BUGS.md #157) */
  kind?: string
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
/** A freeway through a city runs elevated or in a cut, not at grade (BUGS.md #157). */
const FREEWAY = new Set(['motorway', 'trunk', 'motorway_link', 'trunk_link'])
/** An urban freeway's minimum clearance where nothing under it says otherwise: a plain overcrossing, not a
 *  culvert's 2 m default (the `over: 'nothing'` case in `bridgeRise`, tuned for a footbridge). */
const FREEWAY_MIN_RISE = 6
/** A freeway chain longer than this is a viaduct, not a hump: ease up near a real at-grade end and hold a
 *  level deck between, rather than crest once in the middle (see `bridgeHeights`). */
const VIADUCT_LENGTH = 200
const VIADUCT_EASE = 80

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
 * OSM tags `bridge=yes`/`layer` on some ways of a viaduct and not others — the same physical structure comes
 * through as bridge / gap / bridge (BUGS.md #157: I-280 through Mission Bay and Potrero is one continuous
 * elevated run in reality — confirmed against Caltrans' own road log and Street View, not assumed — but a
 * couple of its OSM ways carry no `bridge` or `layer` at all). Treated independently, the untagged way falls
 * back to bare ground height and the deck appears to touch down and take off again mid-run: jagged, and the
 * freeway "never changes level" because every such gap resets it to the one level it never left.
 *
 * Closed only when the gap is SANDWICHED between two bridge-tagged edges of the same freeway chain — an edge
 * at the OUTSIDE end of a chain is left alone, because that is the one place (I-280 lowering onto King
 * Street) the road genuinely does return to grade.
 */
function closeFreewayGaps(edges: BridgeEdge[]): void {
  const freeway = edges.filter((e) => FREEWAY.has(e.kind ?? ''))
  if (freeway.length === 0) return
  for (const chain of chains(freeway)) {
    for (let i = 1; i < chain.length - 1; i++) {
      const e = chain[i].e
      if (e.bridge) continue
      if (chain[i - 1].e.bridge && chain[i + 1].e.bridge) {
        e.bridge = true
        e.layer = e.layer ?? Math.max(chain[i - 1].e.layer ?? 1, chain[i + 1].e.layer ?? 1)
      }
    }
  }
}

/**
 * Give every bridge edge its heights, and ramp the ways that lead onto a raised deck. Mutates `edges`;
 * returns the ids it raised (bridges and ramps), for the report and for the renderer's own test.
 */
export function bridgeHeights(edges: BridgeEdge[], world: BridgeWorld): { bridges: number; ramps: number; raised: Set<number> } {
  closeFreewayGaps(edges)
  const raised = new Set<number>()
  /** chains too short to profile on their own — revisited after the loop, in case they are inside a bridge */
  const shortChain = new Set<number>()
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
    // …unless it turns out to sit inside a structure the rest of this loop raises: see the second pass below
    else for (const sg of segs) shortChain.add(sg.e.id)
    const isFreeway = chain.every(({ e }) => FREEWAY.has(e.kind ?? ''))
    if (isFreeway) rise = Math.max(rise, FREEWAY_MIN_RISE)
    const top = Math.max(h0, h1) + rise
    const hump = Math.PI * rise / Math.max(1, L) <= MAX_HUMP_GRADE
    // a viaduct holds a level deck and eases only near a genuine at-grade end — a single mid-span crest
    // (right, for a Seine bridge a few hundred metres long) would put a several-hundred-metre-tall hill under
    // a kilometres-long freeway run instead of the flat elevated run it actually is
    const viaduct = isFreeway && L > VIADUCT_LENGTH
    const ease = Math.min(VIADUCT_EASE, L / 3)
    segs.forEach((sg, k) => {
      const cum = cumulative(sg.p)
      const hs = cum.map((c) => {
        const t = L > 0 ? (starts[k] + c) / L : 0
        if (viaduct) {
          const d = starts[k] + c
          let v = top
          if (d < ease) v = h0 + (top - h0) * (1 - Math.cos(Math.PI * (d / ease))) / 2
          else if (L - d < ease) v = h1 + (top - h1) * (1 - Math.cos(Math.PI * ((L - d) / ease))) / 2
          return Math.round(v * 100) / 100
        }
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

  /*
   * ---- A BRIDGE'S FOOTWAYS BELONG TO ITS ROADWAY (BUGS.md #217, second pass)
   *
   * The Golden Gate's two sidewalks came out at -30 to -35 while its deck sits near -17: THIRTEEN TO
   * EIGHTEEN METRES BELOW the structure they are bolted to, and 12 m apart from each other. The owner rode
   * it — *"on the west side you're actually biking meters underneath the bridge"*.
   *
   * The cause is that every chain is profiled in its own right above: its own end heights from the ground,
   * its own rise from `bridgeRise`, its own hump-or-level decision. A suspension bridge's carriageway gets
   * a rise worth hundreds of metres of span; a footway bolted to its side, split by OSM into its own ways,
   * gets whatever its own ends happen to say. Two footways and a carriageway that are physically ONE
   * STRUCTURE end up with three unrelated profiles.
   *
   * So: a raised FOOT chain takes its height from the nearest raised CARRIAGEWAY point, where one runs
   * alongside it. Proximity and nothing else — a footway that merely crosses a bridge is metres away at one
   * point and far away at the rest, so it never qualifies; a sidewalk runs within a deck's half-width for
   * its whole length. This is the "they are one structure" idea that `coversRaised` expresses for drawing,
   * applied to heights.
   */
  const ALONGSIDE = 25
  const carriage: { x: number; z: number; y: number }[] = []
  for (const e of deckEdges) {
    if (e.foot || !raised.has(e.id) || !e.heights) continue
    const p = pts(e.points)
    for (let i = 0; i < p.length; i++) carriage.push({ x: p[i].x, z: p[i].z, y: e.heights[i] })
  }
  let adopted = 0
  if (carriage.length > 0) {
    for (const e of deckEdges) {
      if (!e.foot || !raised.has(e.id) || !e.heights) continue
      const p = pts(e.points)
      const next: number[] = []
      let hits = 0
      for (let i = 0; i < p.length; i++) {
        let best = Infinity
        let y = e.heights[i]
        for (const c of carriage) {
          const d = Math.hypot(c.x - p[i].x, c.z - p[i].z)
          if (d < best) { best = d; y = c.y }
        }
        if (best <= ALONGSIDE) { hits++; next.push(Math.round(y * 100) / 100) } else next.push(e.heights[i])
      }
      // most of it has to run alongside, or it is a footway crossing the bridge rather than part of it
      if (hits >= p.length * 0.6) {
        const before = e.heights[Math.floor(e.heights.length / 2)]
        e.heights = next
        if (Math.abs(next[Math.floor(next.length / 2)] - before) > 0.5) adopted++
      }
    }
  }
  if (adopted > 0) console.log(`  ${adopted} bridge footways lifted onto their own roadway (BUGS #217)`)

  /*
   * ---- SHORT FRAGMENTS INSIDE A RAISED STRUCTURE ARE NOT CULVERTS (BUGS.md #217)
   *
   * The `L >= 12` test above is right in general — a two-metre bridge way really is a culvert or a scrap of
   * pavement, and it should follow the ground. It is wrong for a SHORT FRAGMENT OF A LONG BRIDGE. OSM splits
   * a deck at every node another way touches, so the Golden Gate's east sidewalk comes through as chains of
   * wildly different lengths, and the short ones were draped on the sea bed: that is where its -46.7 m
   * sample came from, 12 m below its own neighbours, while the west sidewalk stayed flat. The rider floated
   * over one and not the other.
   *
   * So: a short chain whose ends meet edges that the loop above RAISED is part of that structure. Take its
   * height from those neighbours rather than from the ground. This has to be a second pass, because the
   * neighbours' heights are not known until the first one has finished.
   */
  const heightAtNode = new Map<number, number[]>()
  for (const e of deckEdges) {
    if (!raised.has(e.id) || !e.heights || e.heights.length === 0) continue
    if (shortChain.has(e.id)) continue
    const push = (n: number, v: number): void => { heightAtNode.set(n, [...(heightAtNode.get(n) ?? []), v]) }
    push(e.a, e.heights[0])
    push(e.b, e.heights[e.heights.length - 1])
  }
  let lifted = 0
  for (const e of deckEdges) {
    if (!shortChain.has(e.id) || !e.heights) continue
    const mean = (n: number): number | null => {
      const v = heightAtNode.get(n)
      return v && v.length > 0 ? v.reduce((a, b) => a + b, 0) / v.length : null
    }
    const ha = mean(e.a)
    const hb = mean(e.b)
    if (ha === null && hb === null) continue
    const y0 = ha ?? hb!
    const y1 = hb ?? ha!
    const cum = cumulative(pts(e.points))
    const L = cum[cum.length - 1]
    const before = e.heights[Math.floor(e.heights.length / 2)]
    e.heights = cum.map((c) => Math.round((y0 + (y1 - y0) * (L > 0 ? c / L : 0)) * 100) / 100)
    if (Math.abs(e.heights[Math.floor(e.heights.length / 2)] - before) > 0.5) lifted++
  }
  if (lifted > 0) console.log(`  ${lifted} short bridge fragments lifted onto their neighbours' deck (BUGS #217)`)

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
