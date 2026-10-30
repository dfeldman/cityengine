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
  /** foot bridges near these points take at most this layer (Region.footBridgeLayers, in local metres) */
  layerCaps?: { x: number; z: number; radius: number; layer: number }[]
  /** the railways drawn at the surface (not on a viaduct): a bridge over one clears a train (`RAIL_CLEARANCE`) */
  rails?: { points: number[]; layer?: number }[]
  /** decks a model draws (Region.straightDecks): a straight line from bank to bank, no crown and no clearance over what is under */
  straight?: Set<number>
}

/** above the water's surface: with Paris's 2.5 m drop to the river, a gentle 1 m hump over its quays */
const CLEARANCE_WATER = 3.5
const PER_LAYER = 5.5
/** over a railway at the surface: a train and its contact wire under the deck */
const RAIL_CLEARANCE = 5.8
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
  const cap = e.foot ? world.layerCaps?.find((c) => p.some((q) => Math.hypot(q.x - c.x, q.z - c.z) < c.radius)) : undefined
  const layer = Math.min(e.layer ?? 1, cap?.layer ?? Infinity)
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
        /*
         * A footpath under a FOOT bridge is cleared by one storey, whatever the layers say. A spiral ramp overlaps
         * itself in plan, so OSM numbers its turns layer 3, 4, 5 — and over the ground path beneath it each turn
         * was lifted 5.5 m per layer: the Market Street overpass's helix (37.752148, −122.442793) stood 36 m up on
         * a pier, when Mapillary shows one concrete deck ~5 m over the road (BUGFIX #323). Roads keep the per-layer
         * rule: the Transit Center's park is a foot bridge four layers over the streets and 18 m up. (The helix's
         * span over Market is itself tagged layer 5: that is the region's `layerCaps`, below — no rule tells
         * it from the park, whose four layers are real.)
         */
        const per = o.foot && e.foot ? 1 : Math.max(1, layer - (o.layer ?? 0))
        need = Math.max(need, under + PER_LAYER * per - top)
      }
    }
  }
  /*
   * A RAILWAY passing under it (owner, 2026-10-30: "several overpasses over the train tracks … displayed as tiny hops
   * that wouldn't actually clear a train"). The rails were not counted at all, so a road bridge over the tracks fell
   * through to the 2 m of a culvert. Measured from the ground under the rail where it crosses: a line in a trench the
   * terrain shows needs little or nothing; one the terrain has at grade lifts the deck clear of the wire.
   */
  for (const r of world.rails ?? []) {
    if ((r.layer ?? 0) >= layer) continue
    const q = pts(r.points)
    for (let i = 1; i < p.length; i++) {
      for (let j = 1; j < q.length; j++) {
        if (cross(p[i - 1], p[i], q[j - 1], q[j]) === null) continue
        need = Math.max(need, world.ground((q[j - 1].x + q[j].x) / 2, (q[j - 1].z + q[j].z) / 2) + RAIL_CLEARANCE - top)
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
  /*
   * A SCRAP of way between two bridge pieces is bridge (owner, 2026-10-30, Pont Mirabeau: "notice the discontinuous path
   * and car in the air" — "essentially every seine bridge is messed up. they all have an underpass on each side"). OSM
   * maps a Seine bridge as its span over the river, a short deck over the riverside road below, and between them a few
   * metres of way with no bridge tag. That scrap cut the chain, so the river span started on the ground under its end —
   * the lower quay, 5.8 m below the street — and climbed 15 m to its crest while the street met it in the air.
   */
  {
    const bridgeAt = new Map<number, number>()
    for (const e of edges) if (e.bridge) for (const n of [e.a, e.b]) bridgeAt.set(n, (bridgeAt.get(n) ?? 0) + 1)
    let joined = 0
    for (const e of edges) {
      if (e.bridge || e.tunnel || !bridgeAt.has(e.a) || !bridgeAt.has(e.b)) continue
      const q = pts(e.points)
      let L = 0
      for (let i = 1; i < q.length; i++) L += Math.hypot(q[i].x - q[i - 1].x, q[i].z - q[i - 1].z)
      if (L >= 8) continue
      e.bridge = true
      joined++
    }
    if (joined) console.log(`  bridges: ${joined} scraps of way between bridge pieces joined to their bridges`)
  }
  const deckEdges = edges.filter((e) => e.bridge)
  for (const e of deckEdges) densify(e, world)
  /*
   * ---- FREEWAY JUNCTIONS IN THE AIR (2026-10-05, the Central Freeway at Bryant and Division)
   *
   * A chain ends wherever three deck edges meet, and each chain eased down to the GROUND height at its ends — right for
   * a viaduct's touchdown, wrong where three freeway decks meet 7 m up: the Central Freeway's westbound deck and two
   * ramps all came down to the street at their shared node, in the middle of the Bryant/Division junction, and the
   * deck's fascia stood across Bryant Street as a wall. So a node where only freeway decks meet, three or more, is a
   * junction in the air: its height is the highest top of the chains that meet there, and those chains end AT it.
   */
  const ends = (chain: { e: BridgeEdge; reversed: boolean }[]): [number, number] => {
    const first = chain[0]
    const end = chain[chain.length - 1]
    return [first.reversed ? first.e.b : first.e.a, end.reversed ? end.e.a : end.e.b]
  }
  const deckAtNode = new Map<number, BridgeEdge[]>()
  for (const e of deckEdges) for (const n of [e.a, e.b]) deckAtNode.set(n, [...(deckAtNode.get(n) ?? []), e])
  /*
   * …and not only a freeway's (owner, 2026-10-30, the Pont de Sully: "sunk into the bridge"). Where a Seine bridge's own
   * sidewalks, mapped as foot bridges, meet its roadway in mid-river, three deck edges meet, the chains end there, and each
   * was eased down to the GROUND under that node — the river: the Pont de Sully's deck dipped to −3.7 m between banks at
   * +0.7 and the boulevard. A node where three or more deck edges meet and no way at grade touches it is in the air,
   * whatever the class of road.
   */
  const atGrade = new Set<number>()
  for (const e of edges) if (!e.bridge && !e.tunnel) { atGrade.add(e.a); atGrade.add(e.b) }
  const airJunction = (n: number): boolean => {
    const es = deckAtNode.get(n) ?? []
    return es.length >= 3 && (es.every((x) => FREEWAY.has(x.kind ?? '')) || !atGrade.has(n))
  }
  const allChains = chains(deckEdges)
  const junctionY = new Map<number, number>()
  for (const chain of allChains) {
    if (!chain.every(({ e }) => FREEWAY.has(e.kind ?? ''))) continue
    const [na, nb] = ends(chain)
    if (!airJunction(na) && !airJunction(nb)) continue
    const fe = chain[0].e, le = chain[chain.length - 1].e
    const fp = pts(fe.points), lp = pts(le.points)
    const fh = fe.heights ?? fp.map((q) => world.ground(q.x, q.z))
    const lh = le.heights ?? lp.map((q) => world.ground(q.x, q.z))
    const g0 = chain[0].reversed ? fh[fh.length - 1] : fh[0]
    const g1 = chain[chain.length - 1].reversed ? lh[0] : lh[lh.length - 1]
    let rise = FREEWAY_MIN_RISE
    for (const { e } of chain) rise = Math.max(rise, bridgeRise(e, edges, world, [g0, g1]).rise)
    const top = Math.max(g0, g1) + rise
    for (const n of [na, nb]) if (airJunction(n)) junctionY.set(n, Math.max(junctionY.get(n) ?? -Infinity, top))
  }
  for (const chain of allChains) {
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
    const last = segs[segs.length - 1]
    const g0 = segs[0].h[0]
    const g1 = last.h[last.h.length - 1]
    if (chain.some(({ e }) => world.straight?.has(e.id))) {
      segs.forEach((sg, k) => {
        const hs = cumulative(sg.p).map((c) => Math.round((g0 + (g1 - g0) * (L > 0 ? (starts[k] + c) / L : 0)) * 100) / 100)
        sg.e.heights = sg.reversed ? hs.reverse() : hs
        raised.add(sg.e.id)
      })
      bridges++
      continue
    }
    const isFreeway = chain.every(({ e }) => FREEWAY.has(e.kind ?? ''))
    // (an end at a junction in the air is that junction's height, not the ground's: see above)
    const [na, nb] = ends(chain)
    const j0 = junctionY.get(na)
    const j1 = junctionY.get(nb)
    const h0 = j0 ?? g0
    const h1 = j1 ?? g1
    let rise = 0
    // a bridge chain of a few metres is a culvert or a scrap of a bridge's pavement: it follows the ground
    if (L >= 12) for (const sg of segs) rise = Math.max(rise, bridgeRise(sg.e, edges, world, [g0, g1]).rise)
    // …unless it turns out to sit inside a structure the rest of this loop raises: see the second pass below
    else for (const sg of segs) shortChain.add(sg.e.id)
    if (isFreeway) rise = Math.max(rise, FREEWAY_MIN_RISE)
    const top = Math.max(Math.max(g0, g1) + rise, j0 ?? -Infinity, j1 ?? -Infinity)
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
  // (each point with its way's direction there: a footway only joins a roadway it runs ALONG — Mariposa Street's 43 m
  //  sidewalk passes under I-280, every point of it within 25 m of the freeway, and was lifted 15 m onto its deck)
  const carriage: { x: number; z: number; y: number; ux: number; uz: number }[] = []
  for (const e of deckEdges) {
    if (e.foot || !raised.has(e.id) || !e.heights) continue
    const p = pts(e.points)
    for (let i = 0; i < p.length; i++) {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)]
      const l = Math.hypot(b.x - a.x, b.z - a.z) || 1
      carriage.push({ x: p[i].x, z: p[i].z, y: e.heights[i], ux: (b.x - a.x) / l, uz: (b.z - a.z) / l })
    }
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
        const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)]
        const l = Math.hypot(b.x - a.x, b.z - a.z) || 1
        const fx = (b.x - a.x) / l, fz = (b.z - a.z) / l
        for (const c of carriage) {
          // alongside: within 30° of parallel either way
          if (Math.abs(c.ux * fx + c.uz * fz) < 0.866) continue
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
  /*
   * Where a ramp must stop (San Francisco, Stockton at Bush, 2026-09-29): a node where a way goes UNDERGROUND — a
   * tunnel mouth. A garage's service bridge beside the Stockton Tunnel's south portal ramped the carriageway going
   * into the tunnel up to its deck, 6 m above the cut the street runs in, and everything drawn along it with it.
   */
  const mouth = (n: number): boolean => (byNode.get(n) ?? []).some((o) => o.tunnel || (o.layer ?? 0) < 0)
  for (const [start, deck] of deckAt) {
    // breadth-first by distance; each visited point gets max(current, the ramp's height there)
    const queue: { node: number; dist: number }[] = [{ node: start, dist: 0 }]
    const seen = new Map<number, number>([[start, 0]])
    while (queue.length > 0) {
      const { node, dist } = queue.shift()!
      for (const e of byNode.get(node) ?? []) {
        // only along ROADS: a road bridge's deck is reached by road. Through the footways round it the same ramp
        // reached a street the bridge never touches (only road bridges ramp at all — see `deckAt`)
        if (e.bridge || e.foot || e.tunnel) continue
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
        if (d < RAMP && !mouth(other) && (seen.get(other) ?? Infinity) > d) {
          seen.set(other, d)
          queue.push({ node: other, dist: d })
        }
      }
    }
  }
  /*
   * ---- THE FOOT WAYS OFF A DECK meet it (owner, 2026-10-30, the Seine bridges: "they all have an underpass on each side";
   * the scan of the lidar bake, 2026-10-30: 995 bridge ends more than 1.5 m off a way that meets them, most of them foot
   * ways). The stairs down to a lower quay and the pavement stubs at a bridge's end were levelled with the streets before
   * the deck was lifted, and the ramps above follow roads only, so the foot way stood 2–6 m under the deck at the node
   * they share: a step down into nothing (the Pont de Sully, +2.7 against −1.4). Each one's end at a deck node now takes
   * the deck's height there, eased back into its own over up to 15 m — a flight of steps steeply, as steps are
   * (`meetDecks`, below; run again by the bake after a modelled bridge's deck is conformed to its model).
   */
  for (const id of meetDecks(edges)) raised.add(id)
  return { bridges, ramps, raised }
}

/**
 * A FOOT BRIDGE'S ENDS, graded down to the paths they join (owner, 2026-10-03: "footbridge at 37.753044, -122.455970
 * does not connect to the ground on either end"). `bridgeHeights` gives a bridge one level; the footbridge over
 * Clarendon Avenue is mapped as one way with its spiral ramps at both ends, so the whole of it — ramps included — stood
 * at 79.1 m, its ends 3–5 m over the paths at 75.7 and 74.0. Where an end of a foot bridge (footway, path, cycleway,
 * pedestrian; never steps) stands more than a metre over the highest non-bridge way meeting it there, the end is graded
 * down to it along the bridge's own line over `drop / 0.1` metres (at most 45 % of its length), smoothly, so the middle
 * — over the road — keeps its clearance. Returns the ids changed.
 */
export function rampFootBridgeEnds(edges: { id: number; a: number; b: number; kind?: string; foot?: boolean; bridge?: boolean; ramp?: boolean; points: number[]; heights?: number[] }[]): Set<number> {
  const at = new Map<number, number[]>()   // node → heights of the non-bridge ways ending there
  for (const e of edges) {
    if (e.bridge || !e.heights?.length) continue
    for (const [node, h] of [[e.a, e.heights[0]], [e.b, e.heights[e.heights.length - 1]]] as const) {
      const l = at.get(node) ?? []; l.push(h); at.set(node, l)
    }
  }
  // the road bridges' middles: a foot bridge alongside one is its SIDEWALK and keeps the road's level (the Fillmore
  // overpass over Geary: graded on their own, its sidewalks dipped 4 m below the road deck at both ends)
  const roadMids = edges.filter((e) => e.bridge && !e.foot && !/^(footway|path|cycleway|pedestrian|steps)$/.test(e.kind ?? '')).map((e) => {
    const m = Math.floor(e.points.length / 4) * 2
    return { x: e.points[m], z: e.points[m + 1] }
  })
  const changed = new Set<number>()
  for (const e of edges) {
    if (!e.bridge || !e.heights || e.heights.length < 3 || !/^(footway|path|cycleway|pedestrian)$/.test(e.kind ?? '')) continue
    const m = Math.floor(e.points.length / 4) * 2
    if (roadMids.some((r) => Math.hypot(r.x - e.points[m], r.z - e.points[m + 1]) < 18)) {
      // (and one a previous pass graded is put back level, at its top)
      const top = Math.max(...e.heights)
      if (e.heights.some((h) => top - h > 0.05)) { e.heights.fill(top); changed.add(e.id) }
      continue
    }
    const n = e.heights.length
    const cum = [0]
    for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(e.points[i * 2] - e.points[i * 2 - 2], e.points[i * 2 + 1] - e.points[i * 2 - 1]))
    const total = cum[n - 1]
    for (const end of [0, 1] as const) {
      const node = end === 0 ? e.a : e.b
      const there = at.get(node)
      if (!there?.length) continue
      const ground = Math.max(...there)
      const top = e.heights[end === 0 ? 0 : n - 1]
      const drop = top - ground
      if (drop <= 1) continue
      const D = Math.min(total * 0.45, drop / 0.1)
      for (let i = 0; i < n; i++) {
        const s = end === 0 ? cum[i] : total - cum[i]
        if (s >= D) continue
        const t = s / D
        const f = t * t * (3 - 2 * t)
        e.heights[i] = Math.min(e.heights[i], ground + drop * f)
      }
      changed.add(e.id)
    }
  }
  return changed
}

/**
 * WALKS OFF THE SEA BED (waterfront audit, 2026-10-04): a pier is mapped as an area (`man_made=pier`) with its walks drawn
 * over it as footways — and the footways took the ground under them, which over the bay is the flattened sea bed: 273 ways
 * baked a metre UNDER the water (Pier 7, Pier 14, the Hyde Street and Fisherman's Wharf piers, Sausalito's docks).
 * Every point of a foot way (footway, path, pedestrian, steps, cycleway) inside a fixed pier's outline goes to the pier
 * deck, `deck` m over the sea; inside a floating pier, to a float, 0.5 m over it; and any other foot-way point still
 * below the sea, to a float's height. A street is never moved. Returns the ids changed.
 */
export function liftWalksOffTheSea(edges: { id: number; kind?: string; tunnel?: boolean; bore?: boolean; bridge?: boolean; points: number[]; heights?: number[] }[],
  sea: number, piers: { ring: { x: number; z: number }[]; floating: boolean }[], deck = 3.5,
  wet?: (x: number, z: number) => boolean): Set<number> {
  const boxes = piers.map((p) => {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of p.ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    return { ...p, x0, x1, z0, z1 }
  })
  const inRing = (r: { x: number; z: number }[], x: number, z: number): boolean => {
    let c = false
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) c = !c
    }
    return c
  }
  const within = (b: (typeof boxes)[number], x: number, z: number): boolean =>
    x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && inRing(b.ring, x, z)
  const foot = (e: { kind?: string; tunnel?: boolean; bore?: boolean; heights?: number[] }): boolean =>
    !!e.heights && !e.tunnel && !e.bore && /^(footway|path|pedestrian|steps|cycleway)$/.test(e.kind ?? '')
  /*
   * WHICH POINTS ARE ON THE DECK. A pier outline also takes in DRY land — the Ferry Building's covers its whole plaza —
   * and lifting that walled every walk on it in. With the water (`wet`, the bake's sea and lakes: the coastline is the
   * shore) a point is on the deck when it is over the water; without it, when it is down at the water (at most 0.3 m
   * over the sea), which misses a deck the elevation tiles read as low land (the Ferry Terminal's South Basin).
   */
  const onWater = (x: number, z: number, h: number): boolean => (wet ? wet(x, z) : h <= sea + 0.3)
  /*
   * A fixed pier that LEAVES FROM LAND is level with it (2026-10-04, the South Basin): where the outline takes in dry
   * walks — the promenade, a building's arcade — its deck is the highest of them, held to 1.5–4.5 m over the sea (0.05 m
   * with the water given, where land that low is still known to be land); the
   * generic `deck` stood it 0.7 m over the promenade it joins.
   */
  const dry = boxes.map((b) => {
    if (b.floating) return null
    let top = -Infinity
    for (const e of edges) {
      if (!foot(e)) continue
      for (let i = 0; i < e.heights!.length; i++) {
        const x = e.points[i * 2], z = e.points[i * 2 + 1], h = e.heights![i]
        // (with the water given, a walk off it is LAND however low: the Wharf's ground reads 0.1 m over the sea, and
        //  Pier 45's walks were stood on the generic 3.5 m deck, a step up and down off the land — 2026-10-17)
        if (onWater(x, z, h) || (!wet && h <= sea + 0.3) || !within(b, x, z)) continue
        top = Math.max(top, h)
      }
    }
    return Number.isFinite(top) ? Math.min(sea + 4.5, Math.max(wet ? sea + 0.05 : sea + 1.5, top)) : null
  })
  const changed = new Set<number>()
  for (const e of edges) {
    if (!foot(e)) continue
    /*
     * A pier with no dry walks inside its outline gets the generic deck — unless this walk itself comes off LAND (the
     * water given): then its run over the water is level with its own dry end. Pier 45's apron by the chapel was stood
     * 3.5 m up between two points on the Wharf's ground (2026-10-17).
     */
    let ownDry = -Infinity
    if (wet) for (let i = 0; i < e.heights!.length; i++) {
      const x = e.points[i * 2], z = e.points[i * 2 + 1]
      if (!onWater(x, z, e.heights![i])) ownDry = Math.max(ownDry, e.heights![i])
    }
    const ownDeck = Number.isFinite(ownDry) ? Math.min(sea + 4.5, Math.max(sea + 0.05, ownDry)) : null
    for (let i = 0; i < e.heights!.length; i++) {
      const x = e.points[i * 2], z = e.points[i * 2 + 1], h = e.heights![i]
      if (!onWater(x, z, h)) continue
      // on a fixed deck the walk takes the deck's level exactly (a deck is flat, whatever the tiles say under it); on a
      // float, or loose on the water, it is only ever lifted
      let deckAt: number | null = null, floatAt: number | null = null
      boxes.forEach((b, k) => {
        if (!within(b, x, z)) return
        if (b.floating) floatAt = sea + 0.5
        else deckAt = Math.max(deckAt ?? -Infinity, dry[k] ?? ownDeck ?? sea + deck)
      })
      const want: number | null = deckAt ?? floatAt ?? (h < sea - 0.2 ? sea + 0.5 : null)
      if (want === null) continue
      // (a foot BRIDGE on a pier — a gangway's head, a raised walk — is only ever lifted onto it, never flattened)
      if (deckAt !== null && !e.bridge ? Math.abs(h - want) > 0.05 : h < want - 0.05) { e.heights![i] = want; changed.add(e.id) }
    }
  }
  return changed
}

/**
 * Every way that meets a bridge deck at a node, and stands off it by a step a stair or a short ramp takes (0.3–6 m), meets
 * it: its end at the node takes the deck's height, eased back into its own — over up to 15 m for a foot way, up to 30 m for
 * a road (owner, 2026-10-30: the Seine bridges "all have an underpass on each side"; the Port de Javel's ramp roads stood
 * 2.9 m under Pont Mirabeau's deck). Mutates `edges`; returns the ids it changed. Run after `bridgeHeights` and again after
 * a modelled bridge's deck is conformed to its model (tools/deck-conform.ts), which moves the deck after the first pass.
 */
export function meetDecks(edges: BridgeEdge[], upOnly = false): number[] {
  const changedIds: number[] = []
  const deckEnd = new Map<number, number>()
  for (const e of edges) {
    if (!e.bridge || !e.heights) continue
    const h = e.heights
    deckEnd.set(e.a, Math.max(deckEnd.get(e.a) ?? -Infinity, h[0]))
    deckEnd.set(e.b, Math.max(deckEnd.get(e.b) ?? -Infinity, h[h.length - 1]))
  }
  for (const e of edges) {
    if (e.bridge || e.tunnel || !e.heights) continue
    const p = pts(e.points)
    const cum = cumulative(p)
    const L = cum[cum.length - 1]
    if (L < 1) continue
    const EASE = Math.min(e.foot ? 15 : 30, L * 0.6)
    let hs = e.heights
    let changed = false
    for (const [node, fromA] of [[e.a, true], [e.b, false]] as const) {
      const deck = deckEnd.get(node)
      if (deck === undefined) continue
      const own = fromA ? hs[0] : hs[hs.length - 1]
      // (a step a flight of stairs takes — not a skyway's 16 m, whose ends are in buildings: see the footbridge rule above)
      if (Math.abs(deck - own) < 0.3 || Math.abs(deck - own) > 6) continue
      // (once the ground is final: a way under its deck climbs to it, but none is taken down into the ground)
      if (upOnly && deck < own) continue
      hs = hs.map((h, i) => {
        const d = fromA ? cum[i] : L - cum[i]
        return d >= EASE ? h : Math.round((deck + (h - deck) * (d / EASE)) * 100) / 100
      })
      changed = true
    }
    if (changed) { e.heights = hs; changedIds.push(e.id) }
  }
  return changedIds
}
