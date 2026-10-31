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
  name?: string
  /** lifted to meet a deck: said outright, for the renderer (city/package.ts isRaised) */
  ramp?: boolean
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
  /** the ground is lidar (an MNT, bare earth): it has no bridge in it, so it dips to the quay road under an abutment */
  liftAbutments?: boolean
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
        /*
         * …and a freeway over a street in a city of lidar is one storey too, whatever layer it is mapped at (the Seine audit, 2026-10-30): the Boulevard Périphérique's
         * Pont Amont, mapped at layer 2, stood its outer carriageway at 20.7 m and its inner at 12.7, one deck 8 m apart.
         */
        const per = (o.foot && e.foot) || (world.liftAbutments && FREEWAY.has(e.kind ?? '')) ? 1 : Math.max(1, layer - (o.layer ?? 0))
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
/**
 * A bridge's cycle lanes, drawn as the lanes they are (owner, 2026-10-30, the Pont du Carrousel, the first bridge after loading: "two paths
 * connected in a loop that is hard to escape"). OSM maps a painted lane either side of a roadway as a one-way way of its own, joined to the
 * road at each end: in the ride graph a loop, and on the deck strips of paving between three narrow roads. A same-named cycleway beside a
 * bridge's roadway goes, and the roadway widens over it; so do the stubs of lane on land that led to nothing else.
 */
export function mergeBridgeLanes<E extends { id: number; a: number; b: number; points: number[]; bridge?: boolean; foot?: boolean; kind?: string; name?: string; width: number }>(edges: E[]): { edges: E[]; lanes: number; stubs: number } {
  const REACH = 14, CAP = 20
  const distance = (x: number, z: number, p: number[]): number => {
    let best = Infinity
    for (let i = 2; i < p.length; i += 2) {
      const ax = p[i - 2], az = p[i - 1], dx = p[i] - ax, dz = p[i + 1] - az
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)))
      best = Math.min(best, Math.hypot(ax + dx * t - x, az + dz * t - z))
    }
    return best
  }
  const roads = edges.filter((e) => e.bridge && !e.foot && e.kind !== 'cycleway' && e.name)
  const gone = new Set<number>()
  const widen = new Map<E, number>()
  for (const e of edges) {
    if (!e.bridge || e.kind !== 'cycleway' || !e.name) continue
    /*
     * …the NEAREST roadway of its name (the Seine audit, 2026-10-30). The first found took it: where a bridge is two carriageways the lane on
     * the far side of the other one, 14 m off, widened the first to 20 m: the Pont de Saint-Cloud's one road 20 m wide and its other 4.8, the
     * Sèvres, Puteaux, Billancourt and Issy the same, one laid over the other. And no wider than its fellow carriageway leaves room for.
     */
    let best: { r: E; far: number; score: number } | null = null
    for (const r of roads) {
      if (r.name !== e.name) continue
      let beside = 0, far = 0, sum = 0
      const n = e.points.length / 2
      for (let i = 0; i < e.points.length; i += 2) {
        const d = distance(e.points[i], e.points[i + 1], r.points)
        if (d < REACH) { beside++; far = Math.max(far, d); sum += d }
      }
      if (beside < n * 0.6) continue
      const score = sum / beside
      if (!best || score < best.score) best = { r, far, score }
    }
    if (!best) continue
    gone.add(e.id)
    let w = Math.min(CAP, 2 * best.far + 2.8)
    const mx = best.r.points[Math.floor(best.r.points.length / 4) * 2], mz = best.r.points[Math.floor(best.r.points.length / 4) * 2 + 1]
    for (const o of roads) {
      if (o === best.r || o.name !== best.r.name) continue
      const d = distance(mx, mz, o.points)
      // (its fellow carriageway beside it: the road takes the lane's width on, and stays on its own side)
      if (d < 30) w = Math.min(w, Math.max(best.r.width + 2.8, 2 * (d - o.width / 2)))
    }
    widen.set(best.r, Math.max(widen.get(best.r) ?? 0, w))
  }
  if (!gone.size) return { edges, lanes: 0, stubs: 0 }
  for (const [r, w] of widen) r.width = Math.max(r.width, w)
  const lanes = gone.size
  // the lane's stubs: from where a lane went, cycleways that now lead nowhere, up to 100 m of them
  const degree = new Map<number, number>()
  for (const e of edges) if (!gone.has(e.id)) for (const k of [e.a, e.b]) degree.set(k, (degree.get(k) ?? 0) + 1)
  const opened = new Set<number>()
  for (const e of edges) if (gone.has(e.id)) { opened.add(e.a); opened.add(e.b) }
  const lengthOf = (p: number[]): number => { let L = 0; for (let i = 2; i < p.length; i += 2) L += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]); return L }
  let stubs = 0, run = 0
  for (let changed = true; changed;) {
    changed = false
    for (const e of edges) {
      if (gone.has(e.id) || e.kind !== 'cycleway' || e.bridge) continue
      const end = opened.has(e.a) && (degree.get(e.a) ?? 0) <= 1 ? e.a : opened.has(e.b) && (degree.get(e.b) ?? 0) <= 1 ? e.b : null
      if (end === null) continue
      const L = lengthOf(e.points)
      if (run + L > 100 * lanes) continue
      run += L
      gone.add(e.id)
      stubs++
      const other = end === e.a ? e.b : e.a
      degree.set(e.a, (degree.get(e.a) ?? 1) - 1)
      degree.set(e.b, (degree.get(e.b) ?? 1) - 1)
      opened.add(other)
      changed = true
    }
  }
  return { edges: edges.filter((e) => !gone.has(e.id)), lanes, stubs }
}

/**
 * THE NAMED FOOT BRIDGES, OPEN TO BIKES (owner, 2026-10-30: "the seine is a natural focal point for cyclists"; 41 of them,
 * the Pont des Arts and the Passerelles Debilly and Senghor among them, were footways and so not in the bike graph). A bridge
 * goes with the footways that join each of its ends to a way a bike rides, within `reach` metres, and only if it can be crossed
 * so: half a bridge is a dead end over the river, and the graph would prune it. Stairs do not count. Returns the ways to open.
 */
export function footBridgeLinks(edges: (Pick<BridgeEdge, 'id' | 'a' | 'b' | 'points' | 'bridge' | 'kind'> & { name?: string; trail?: boolean })[], reach = 300): Set<number> {
  const FOOT = /^(footway|path|pedestrian)$/
  const notBike = /^(footway|path|steps|track|bridleway)$/
  /*
   * A few steps on the way off a foot bridge do not stop a bike that is carried up them (the Seine audit, 2026-10-30: the Passerelle Debilly, named by the
   * owner, lands five metres of steps short of the Port Debilly's walk; the Passerelle Sud twelve). A flight this short is joined; a stair down a quay is not.
   */
  const SHORT_FLIGHT = 15
  const at = new Map<number, typeof edges>()
  for (const e of edges) for (const n of [e.a, e.b]) (at.get(n) ?? at.set(n, []).get(n)!).push(e)
  const rideable = (e: typeof edges[number]): boolean => !!e.trail || !notBike.test(e.kind ?? 'residential')
  const lengthOf = (e: typeof edges[number]): number => {
    const q = pts(e.points)
    let L = 0
    for (let i = 1; i < q.length; i++) L += Math.hypot(q[i].x - q[i - 1].x, q[i].z - q[i - 1].z)
    return L
  }
  const groups = new Map<string, typeof edges>()
  for (const e of edges) {
    if (e.bridge && e.name && FOOT.test(e.kind ?? '') && /^(Pont|Passerelle)\b/.test(e.name)) (groups.get(e.name) ?? groups.set(e.name, []).get(e.name)!).push(e)
  }
  /*
   * …and a pavement is not a foot bridge (the Seine audit, 2026-10-30). OSM names a road bridge's sidewalks for the bridge too: the Pont National,
   * Sèvres, Suresnes, Daydé, Renault, Neuilly, Invalides and Courbevoie each came out in the ride graph as a road and a footway side by side, a
   * loop joined at both ends and the rider asked which. Where a road of the same name is on a bridge the group's ways stay footways.
   */
  const roadNames = new Set(edges.filter((e) => e.bridge && e.name && !notBike.test(e.kind ?? 'residential') && e.kind !== 'cycleway' && e.kind !== 'pedestrian').map((e) => e.name))
  const open = new Set<number>()
  for (const [name, group] of groups) {
    if (roadNames.has(name)) continue
    const own = new Set(group.map((e) => e.id))
    const count = new Map<number, number>()
    for (const e of group) for (const n of [e.a, e.b]) count.set(n, (count.get(n) ?? 0) + 1)
    let ends = [...count].filter(([, c]) => c === 1).map(([n]) => n)
    // (the Passerelle Senghor's two walks are a closed lens, no node of it an end: it ends where anything else meets it)
    if (ends.length < 2) ends = [...count.keys()].filter((n) => (at.get(n) ?? []).some((o) => !own.has(o.id) && o.kind !== 'steps' && !o.bridge) || (at.get(n) ?? []).some((o) => !own.has(o.id) && !o.bridge))
    if (ends.length < 2) continue
    // (a big bridge is many ways with many ends, its stairs' landings among them: two that reach the network from opposite
    //  sides are a way across, and a piece that goes nowhere is pruned with the other stubs)
    const links = new Map<number, number[]>()
    for (const end of ends) {
      const best = new Map<number, { d: number; via: number | null; from: number | null }>([[end, { d: 0, via: null, from: null }]])
      const todo = [end]
      while (todo.length) {
        todo.sort((p, q) => best.get(p)!.d - best.get(q)!.d)
        const n = todo.shift()!
        const here = at.get(n) ?? []
        // (not on its own way: the Passerelle Nord is a pedestrian way, rideable, and its far end stopped there, a dead end on the Île Seguin)
        if (here.some((e) => !own.has(e.id) && rideable(e))) {
          const via: number[] = []
          for (let k: number | null = n; k !== null && best.get(k)!.via !== null; k = best.get(k)!.from) via.push(best.get(k)!.via!)
          links.set(end, via)
          break
        }
        for (const e of here) {
          if (own.has(e.id) || !(FOOT.test(e.kind ?? '') || (e.kind === 'steps' && lengthOf(e) <= SHORT_FLIGHT))) continue
          const m = e.a === n ? e.b : e.a
          const d = best.get(n)!.d + lengthOf(e)
          if (d > reach || d >= (best.get(m)?.d ?? Infinity)) continue
          best.set(m, { d, via: e.id, from: n })
          todo.push(m)
        }
      }
    }
    const where = new Map<number, Pt>()
    let span = 0
    for (const e of group) {
      const q = pts(e.points)
      where.set(e.a, q[0])
      where.set(e.b, q[q.length - 1])
      for (const u of q) span = Math.max(span, Math.hypot(u.x - q[0].x, u.z - q[0].z))
    }
    const all = [...where.values()]
    for (const u of all) for (const v of all) span = Math.max(span, Math.hypot(u.x - v.x, u.z - v.z))
    const reached = [...links.keys()]
    const across = reached.some((u) => reached.some((v) => Math.hypot(where.get(u)!.x - where.get(v)!.x, where.get(u)!.z - where.get(v)!.z) >= span * 0.6))
    if (across) {
      for (const e of group) open.add(e.id)
      for (const via of links.values()) for (const id of via) open.add(id)
    }
  }
  return open
}

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
  /*
   * THE HOLE UNDER AN ABUTMENT (owner, 2026-10-30, the Pont de Puteaux, 48.878156, 2.243674). Bare earth has no bridge in it: where
   * the deck comes ashore it reads the quay road passing beneath, so the bridge's end stood at -7 m and the street it meets at
   * -1.6, the road diving into the hole and climbing out in 16 m, with spikes of parapet along it. A short way of the bridge's own
   * name that climbs away from its end like that is still the bridge: the chain then ends on the street.
   */
  if (world.liftAbutments) {
    let lifted = 0
    for (let pass = 0; pass < 3; pass++) {
      const decksAt = new Map<number, Set<string>>()
      for (const e of edges) if (e.bridge && e.name) for (const n of [e.a, e.b]) (decksAt.get(n) ?? decksAt.set(n, new Set()).get(n)!).add(e.name)
      for (const e of edges) {
        if (e.bridge || e.tunnel || e.foot || !e.name || !e.heights || e.heights.length < 2) continue
        const q = pts(e.points)
        let L = 0
        for (let i = 1; i < q.length; i++) L += Math.hypot(q[i].x - q[i - 1].x, q[i].z - q[i - 1].z)
        if (L >= 45) continue
        const first = e.heights[0], last = e.heights[e.heights.length - 1]
        const away = decksAt.get(e.a)?.has(e.name) ? last - first : decksAt.get(e.b)?.has(e.name) ? first - last : -1
        if (away < 1.5 || away / Math.max(L, 1) < 0.08) continue
        e.bridge = true
        e.layer ??= 1
        lifted++
      }
    }
    if (lifted) console.log(`  bridges: ${lifted} ways out of the hole under an abutment joined to their bridges`)
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
    // (…and at a grade a road has: the Périphérique came off the Pont Aval at 30%, 15 m down in the 80 m allowed here, to the ground at the Quai d'Issy)
    const ease = world.liftAbutments ? Math.min(L / 2.2, Math.max(VIADUCT_EASE, (top - Math.min(h0, h1)) / 0.05)) : Math.min(VIADUCT_EASE, L / 3)
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
  /*
   * …and a bridge's cycle tracks are the same deck, and all of it meets at its ends (owner, 2026-10-30, the Pont du Carrousel, 48.860091,
   * 2.333402: "bridge appears to have a gap with the quay"). OSM's five ways over it came out as five decks: the roadway from −2.8 m (its
   * south end on the lower quay in the lidar, while the four other decks at that node stood at +0.5 to +2.5) to −0.1, a footway and a cycle
   * track at a flat 3.1, another pair at 1.1, a white sheet of parapets across the end of the Rue du Louvre. Where the ground is lidar,
   * a roadway's end sunk under the others at a node comes up to them, eased along its length, and the cycle tracks follow the roadway
   * as the footways do.
   */
  const onDeck = (e: BridgeEdge): boolean => !!e.foot || (!!world.liftAbutments && e.kind === 'cycleway')
  if (world.liftAbutments) {
    const atNode = new Map<number, number>()
    for (const e of deckEdges) {
      if (onDeck(e) || !raised.has(e.id) || !e.heights) continue
      atNode.set(e.a, Math.max(atNode.get(e.a) ?? -Infinity, e.heights[0]))
      atNode.set(e.b, Math.max(atNode.get(e.b) ?? -Infinity, e.heights[e.heights.length - 1]))
    }
    let met = 0
    for (const chain of allChains) {
      if (chain.some(({ e }) => onDeck(e) || !e.heights)) continue
      const line = chain.map(({ e, reversed }) => ({ e, reversed, c: cumulative(pts(e.points)) }))
      const L = line.reduce((a, q) => a + q.c[q.c.length - 1], 0)
      if (L < 40) continue
      const [na, nb] = ends(chain)
      const first = line[0], last = line[line.length - 1]
      const y0 = first.reversed ? first.e.heights![first.e.heights!.length - 1] : first.e.heights![0]
      const y1 = last.reversed ? last.e.heights![0] : last.e.heights![last.e.heights!.length - 1]
      const up0 = (atNode.get(na) ?? y0) - y0 > 1.5 ? atNode.get(na)! - y0 : 0
      const up1 = (atNode.get(nb) ?? y1) - y1 > 1.5 ? atNode.get(nb)! - y1 : 0
      if (!up0 && !up1) continue
      let run = 0
      for (const { e, reversed, c } of line) {
        const len = c[c.length - 1]
        e.heights = e.heights!.map((h, i) => {
          const d = run + (reversed ? len - c[i] : c[i])
          return Math.round((h + up0 * (1 - d / L) + up1 * (d / L)) * 100) / 100
        })
        run += len
      }
      met++
    }
    if (met) console.log(`  bridges: ${met} roadways' sunk ends met the decks at their nodes`)
  }
  const carriage: { x: number; z: number; y: number; ux: number; uz: number }[] = []
  for (const e of deckEdges) {
    if (onDeck(e) || !raised.has(e.id) || !e.heights) continue
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
      if (!onDeck(e) || !raised.has(e.id) || !e.heights) continue
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

  const riverDecks = world.liftAbutments ? oneDeck(edges, world) : null
  if (riverDecks) {
    for (const n of riverDecks.nodes) deckAt.delete(n)
    for (const id of riverDecks.ids) raised.add(id)
    console.log(`  bridges: ${riverDecks.decks} river bridges drawn as one deck each, ${riverDecks.ids.size} ways on them`)
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
  for (const id of meetDecks(edges, false, world.liftAbutments)) raised.add(id)
  return { bridges, ramps, raised }
}

/** the crowns the river bridges have to them, where it is not `ONE_DECK_CROWN`: the Pont Marie's hump and the Alexandre III's famously flat deck */
const CROWNS: Record<string, number> = { 'Pont Marie': 2.6, 'Pont Royal': 2.2, 'Pont Louis-Philippe': 2.2, 'Pont de la Tournelle': 2, 'Pont Neuf': 1.6, 'Pont Alexandre III': 0.7, "Pont d'Iéna": 0.6, 'Pont de la Concorde': 1 }
const ONE_DECK_CROWN = 1.2
/** the deck's middle over the river, at least: a Seine bridge carries its roadway about 6 m over the normal level, and every boat under it */
const ONE_DECK_CLEARANCE = 6
const ONE_DECK_GRADE = 0.045
/** the river and not a lake or a canal: the Seine's pieces are all of this size or much more */
const RIVER_AREA = 300_000
/** two levels on purpose, drawn from their own ways: the lens of the Passerelle Simone-de-Beauvoir (`ownLevelDeck`) */
const OWN_LEVELS = /^Passerelle Simone/

/**
 * ONE BRIDGE, ONE DECK (the owner, 2026-10-30: "We should audit every seine bridge too"; tools/, the audit of the 54 crossings). A Seine bridge is
 * mapped as up to six ways side by side, and split at every node a stair touches, and `bridgeHeights` above made each of those a chain of its own
 * on the bare earth under its own ends: the Pont au Change's roadway dipped to −5.6 m in mid-bridge at the head of a stair, between +2 either side;
 * the Pont Neuf's to −4.2 at the Cité, the Pont d'Iéna's two carriageways 2.4 m apart, the Pont de Saint-Cloud's 13 m. So every way of a river
 * bridge, once it is known what they all are, takes one profile: the line from bank to bank over its whole length, the street at each end as the
 * ground has it a little way off the abutment, and a gentle crown. Its ends are the streets', so there is nothing left to ramp.
 *
 * The ways of a bridge: each bridge way with ten metres or more over the river; the ways joined to those, of the same name or a scrap of pavement,
 * and any cycle or foot way running alongside; not a freeway, nor anything off to the side of the bridge's line (a slip road). Returns what it did.
 */
export function oneDeck(edges: BridgeEdge[], world: BridgeWorld): { decks: number; ids: Set<number>; nodes: Set<number> } {
  const out = { decks: 0, ids: new Set<number>(), nodes: new Set<number>() }
  const ringArea = (r: Pt[]): number => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j].x * r[i].z - r[i].x * r[j].z; return Math.abs(a) / 2 }
  const rivers = world.water.filter((w) => ringArea(w.ring) >= RIVER_AREA).map((w) => {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of w.ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    return { ring: w.ring, level: w.level, x0, x1, z0, z1 }
  })
  if (!rivers.length) return out
  ownLevelDecks(edges, out)
  const wetAt = (x: number, z: number): number | null => { for (const w of rivers) if (x >= w.x0 && x <= w.x1 && z >= w.z0 && z <= w.z1 && inside(w.ring, x, z)) return w.level; return null }
  const lengthOf = (e: BridgeEdge): number => { const c = cumulative(pts(e.points)); return c[c.length - 1] }
  const deck = edges.filter((e) => e.bridge && !e.tunnel && e.heights && e.kind !== 'steps' && e.kind !== 'elevator' && !OWN_LEVELS.test(e.name ?? ''))
  const freeway = (e: BridgeEdge): boolean => FREEWAY.has(e.kind ?? '') && !/^(Pont|Viaduc)\b/.test(e.name ?? '')
  const light = (e: BridgeEdge): boolean => !!e.foot || e.kind === 'cycleway' || e.kind === 'path' || e.kind === 'footway' || e.kind === 'pedestrian' || e.kind === 'service'
  // the seeds, with the points they have over the river
  const wetOf = new Map<number, { x: number; z: number }[]>()
  for (const e of deck) {
    if (freeway(e)) continue
    const p = pts(e.points)
    const wet: Pt[] = []
    let L = 0
    for (let i = 1; i < p.length; i++) {
      const mx = (p[i].x + p[i - 1].x) / 2, mz = (p[i].z + p[i - 1].z) / 2
      if (wetAt(mx, mz) === null) continue
      L += Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z)
      wet.push({ x: mx, z: mz })
    }
    if (L >= 10) wetOf.set(e.id, wet)
  }
  const atNode = new Map<number, BridgeEdge[]>()
  for (const e of deck) for (const n of [e.a, e.b]) (atNode.get(n) ?? atNode.set(n, []).get(n)!).push(e)
  const byId = new Map(deck.map((e) => [e.id, e]))
  // a bridge at a time: the seeds that touch or run with one another
  const used = new Set<number>()
  const midOf = (e: BridgeEdge): Pt => { const p = pts(e.points); return p[Math.floor(p.length / 2)] }
  const near = (a: Pt, e: BridgeEdge): number => {
    const q = pts(e.points)
    let best = Infinity
    for (let i = 1; i < q.length; i++) {
      const dx = q[i].x - q[i - 1].x, dz = q[i].z - q[i - 1].z
      const t = Math.max(0, Math.min(1, ((a.x - q[i - 1].x) * dx + (a.z - q[i - 1].z) * dz) / (dx * dx + dz * dz || 1)))
      best = Math.min(best, Math.hypot(q[i - 1].x + dx * t - a.x, q[i - 1].z + dz * t - a.z))
    }
    return best
  }
  // (against all the ways so far, together: a pavement the length of the bridge runs beside a roadway split in two at the island)
  const along = (e: BridgeEdge, ms: BridgeEdge[]): boolean => {
    const p = pts(e.points)
    let hit = 0
    for (const q of p) if (ms.some((m) => near(q, m) < 30)) hit++
    if (hit < p.length * 0.6) return false
    const m0 = midOf(e)
    let best: BridgeEdge | null = null, d = Infinity
    for (const m of ms) { const v = near(m0, m); if (v < d) { d = v; best = m } }
    if (!best) return false
    const q = pts(best.points), u0 = p[0], u1 = p[p.length - 1], v0 = q[0], v1 = q[q.length - 1]
    const ax = u1.x - u0.x, az = u1.z - u0.z, bx = v1.x - v0.x, bz = v1.z - v0.z
    return Math.abs(ax * bx + az * bz) >= 0.8 * Math.hypot(ax, az) * Math.hypot(bx, bz)
  }
  // (its roadway first, and the pavements come to it: taken the other way round a pavement is a bridge of its own)
  const rank = (id: number): number => { const e = byId.get(id)!; return !light(e) ? 0 : e.name ? 1 : 2 }
  for (const seed of [...wetOf.keys()].sort((p, q) => rank(p) - rank(q))) {
    if (used.has(seed)) continue
    const members = new Map<number, BridgeEdge>([[seed, byId.get(seed)!]])
    used.add(seed)
    for (let changed = true; changed;) {
      changed = false
      const ms = [...members.values()]
      const names = new Set(ms.map((m) => m.name).filter(Boolean))
      for (const e of deck) {
        if (members.has(e.id) || used.has(e.id) || freeway(e)) continue
        const touches = (atNode.get(e.a) ?? []).concat(atNode.get(e.b) ?? []).some((o) => members.has(o.id))
        const sameName = !!e.name && names.has(e.name)
        const short = lengthOf(e) < 25
        const m0 = midOf(e)
        const closeBy = ms.some((m) => near(m0, m) < 40)
        const ok = (touches && (sameName || (!e.name && light(e)) || (short && light(e))))
          || (closeBy && (sameName || light(e)) && along(e, ms))
        if (!ok) continue
        members.set(e.id, e)
        used.add(e.id)
        changed = true
      }
    }
    // the bridge's line, from its points over the water
    const wet = [...members.keys()].flatMap((id) => wetOf.get(id) ?? [])
    if (wet.length < 2) continue
    const cx = wet.reduce((a, q) => a + q.x, 0) / wet.length, cz = wet.reduce((a, q) => a + q.z, 0) / wet.length
    let xx = 0, xz = 0, zz = 0
    for (const q of wet) { xx += (q.x - cx) ** 2; xz += (q.x - cx) * (q.z - cz); zz += (q.z - cz) ** 2 }
    const th = 0.5 * Math.atan2(2 * xz, xx - zz)
    const ux = Math.cos(th), uz = Math.sin(th)
    const station = (q: Pt): number => (q.x - cx) * ux + (q.z - cz) * uz
    const off = (q: Pt): number => Math.abs(-(q.x - cx) * uz + (q.z - cz) * ux)
    // (not a slip road that left the line: those keep their own heights and meet the deck at the node they share)
    const footOnly = [...members.values()].every(light)
    // (…nor, on a foot bridge, a long way on inland: the Passerelle de l'Avre's climbs the hill at Saint-Cloud, 19 m up, and the whole span climbed with it)
    let w0 = Infinity, w1 = -Infinity
    for (const q of wet) { const v = station(q); w0 = Math.min(w0, v); w1 = Math.max(w1, v) }
    const ways = [...members.values()].filter((e) => {
      const m = midOf(e)
      return wetOf.has(e.id) || (off(m) <= 35 && !(footOnly && (station(m) < w0 - 40 || station(m) > w1 + 40)))
    })
    if (!ways.length) continue
    let s0 = Infinity, s1 = -Infinity
    for (const e of ways) for (const q of pts(e.points)) { const s = station(q); s0 = Math.min(s0, s); s1 = Math.max(s1, s) }
    const L = s1 - s0
    if (L < 15) continue
    const own = new Set(ways.map((e) => e.id))
    // the streets at its two ends
    const degree = new Map<number, number>()
    for (const e of ways) for (const n of [e.a, e.b]) degree.set(n, (degree.get(n) ?? 0) + 1)
    const nodeAt = new Map<number, Pt>()
    for (const e of ways) { const p = pts(e.points); nodeAt.set(e.a, p[0]); nodeAt.set(e.b, p[p.length - 1]) }
    const others = new Map<number, BridgeEdge[]>()
    for (const n of nodeAt.keys()) others.set(n, [])
    for (const e of edges) for (const n of [e.a, e.b]) if (others.has(n) && !own.has(e.id) && !e.tunnel) others.get(n)!.push(e)
    const bank = (lo: boolean): number => {
      const mid = (s0 + s1) / 2
      const line: number[] = [], road: number[] = [], foot: number[] = [], raised: number[] = [], here: number[] = []
      for (const [n, q] of nodeAt) {
        const s = station(q)
        if (lo ? s > mid : s < mid) continue
        // the ways of the deck's end that reach out to its end only
        if (Math.abs(s - (lo ? s0 : s1)) > Math.max(30, L * 0.2)) continue
        for (const o of others.get(n) ?? []) {
          if (o.kind === 'steps' || o.kind === 'elevator') continue
          const p = pts(o.points)
          const c = cumulative(p)
          const run = c[c.length - 1]
          const from = o.a === n
          const d = Math.min(run, 25)
          let i = 0
          while (i < p.length - 1 && (from ? c[i] : run - c[p.length - 1 - i]) < d) i++
          const k = from ? i : p.length - 1 - i
          const atNode = (from ? o.heights?.[0] : o.heights?.[o.heights.length - 1]) ?? world.ground(q.x, q.z)
          // a raised way going on in the bridge's line is the bridge going on: the N118 off the Pont de Sèvres, 10 m up, is where that end is
          const raisedWay = !!o.bridge || FREEWAY.has(o.kind ?? '')
          // (in line over its first 20 m, whatever it does later: the N118 bends away uphill)
          let n20 = 0
          while (n20 < p.length - 1 && (from ? c[n20] : run - c[p.length - 1 - n20]) < 20) n20++
          const far = p[from ? n20 : p.length - 1 - n20]
          const dx = far.x - q.x, dz = far.z - q.z
          const inLine = raisedWay && !o.foot && !light(o) && !/_link$/.test(o.kind ?? '') && Math.abs(dx * ux + dz * uz) >= 0.96 * Math.hypot(dx, dz) && off(far) <= 25
          if (inLine) line.push(atNode)
          else if (FREEWAY.has(o.kind ?? '')) continue
          // (a slip road on a bridge of its own has a height at the node, and it may be anything: only if nothing at grade says)
          else if (o.bridge) raised.push(atNode)
          // (at grade, the way's own level a little way off the abutment's hole, which is what is drawn: the ground grid is blurred with the river there)
          else (o.foot || light(o) ? foot : road).push(o.heights?.[k] ?? world.ground(p[k].x, p[k].z))
        }
        here.push(world.ground(q.x, q.z))
      }
      const v = line.length ? line : road.length ? road : foot.length ? foot : raised.length ? raised : here
      // the street's level is the highest of them: a way lower down is on the quay under the bridge, or in its hole
      return v.length ? Math.max(...v) : 0
    }
    const level = rivers.reduce((m, w) => Math.min(m, w.level), Infinity)
    const low = level + 2.5
    const rawA = bank(true), rawB = bank(false)
    // (a way along the lower quay, over an inlet or under a bridge's arch, is at the water's level and stays there)
    if ((rawA + rawB) / 2 < low) continue
    // (an end on a stair down to the port is not where the deck is: it stands clear at the bank, and the stair comes up to it)
    const a = Math.max(rawA, level + 4.5), b = Math.max(rawB, level + 4.5)
    const name = ways.find((e) => e.name && !light(e))?.name ?? ways.find((e) => e.name)?.name ?? ''
    const crownWant = Math.max(CROWNS[name] ?? ONE_DECK_CROWN, level + ONE_DECK_CLEARANCE - (a + b) / 2)
    // (what grade the line from bank to bank leaves it: the Pont Marie climbs 4 m to the Île Saint-Louis in 92)
    const crown = Math.min(crownWant, Math.max(0.3, ((ONE_DECK_GRADE - Math.abs(b - a) / L) * L) / Math.PI))
    const at = (q: Pt): number => {
      const t = Math.max(0, Math.min(1, (station(q) - s0) / L))
      return a + (b - a) * t + crown * Math.sin(Math.PI * t) ** 2
    }
    for (const e of ways) {
      e.heights = pts(e.points).map((q) => Math.round(at(q) * 100) / 100)
      out.ids.add(e.id)
      out.nodes.add(e.a)
      out.nodes.add(e.b)
    }
    /*
     * …and the slip roads that left the bridge's line, on decks of their own, come to it at the node they share. Each had been lifted on its own
     * reckoning: the N118's start at the Pont de Sèvres stood 10 m over the bridge it leaves. Eased from the deck's height back to their own, at a grade
     * a road can have; a way of the deck's own stays as it is. (A motorway's main line stays, and a step down off a stair core is not a slip.)
     */
    for (const n of nodeAt.keys()) {
      const y = deckY(n, ways)
      for (const o of others.get(n) ?? []) {
        // (a flight of steps on the deck's structure too, whatever height it stood: the stair at the Pont de Bir-Hakeim's middle, down to the Allée des Cygnes)
        if (!o.bridge || o.kind === 'elevator' || !o.heights || o.kind === 'motorway') continue
        const from = o.a === n
        const end = from ? o.heights[0] : o.heights[o.heights.length - 1]
        const step = y - end
        if (Math.abs(step) < 0.3) continue
        const c = cumulative(pts(o.points))
        const run = c[c.length - 1]
        const reach = Math.min(run, Math.max(30, Math.abs(step) / 0.06))
        o.heights = o.heights.map((h, i) => {
          const d = from ? c[i] : run - c[i]
          return d >= reach ? h : Math.round((h + step * (1 - d / reach)) * 100) / 100
        })
        out.ids.add(o.id)
      }
    }
    out.decks++
  }
  return out
}

/**
 * The Passerelle Simone-de-Beauvoir (owner's list, 2026-10-30; its Wikipedia page: "meets the high banks directly … double supports on the low quays"): four
 * arms that meet in pairs on one central span, the BnF's esplanade high on the left bank, the Parc de Bercy's terrace on the right, a quay low on each. OSM's
 * layers stood two arms up to 8 m in the air with nothing at their ends, and the central span at −2.5 m, 3.5 m over the water. Each arm now runs straight from
 * the central span to whatever way meets its far end; the span stands level half way between the two high banks, clear of the barges.
 */
function ownLevelDecks(edges: BridgeEdge[], out: { ids: Set<number>; nodes: Set<number>; decks: number }): void {
  const groups = new Map<string, BridgeEdge[]>()
  for (const e of edges) if (e.bridge && e.name && e.heights && OWN_LEVELS.test(e.name)) (groups.get(e.name) ?? groups.set(e.name, []).get(e.name)!).push(e)
  for (const ways of groups.values()) {
    const lengths = new Map(ways.map((e) => { const c = cumulative(pts(e.points)); return [e, c[c.length - 1]] as const }))
    const own = new Set(ways.map((e) => e.id))
    const at = new Map<number, BridgeEdge[]>()
    for (const e of edges) for (const n of [e.a, e.b]) if (!own.has(e.id) && !e.tunnel && e.heights?.length) (at.get(n) ?? at.set(n, []).get(n)!).push(e)
    // the central span joins two nodes each with two more of the group's ways: that is, both its ends are shared
    const degree = new Map<number, number>()
    for (const e of ways) for (const n of [e.a, e.b]) degree.set(n, (degree.get(n) ?? 0) + 1)
    const span = ways.filter((e) => (degree.get(e.a) ?? 0) >= 3 && (degree.get(e.b) ?? 0) >= 3).sort((p, q) => lengths.get(q)! - lengths.get(p)!)[0]
    if (!span) continue
    const farLevel = (e: BridgeEdge, hub: number): number => {
      const far = e.a === hub ? e.b : e.a
      const v = (at.get(far) ?? []).filter((o) => o.kind !== 'steps').map((o) => {
        // (the far end of the short way that meets it: its own end at the node may have been lifted to the old arm)
        const h = o.heights!
        return o.a === far ? h[h.length - 1] : h[0]
      })
      const end = e.a === hub ? e.heights![e.heights!.length - 1] : e.heights![0]
      return v.length ? Math.max(...v) : end
    }
    const arms = ways.filter((e) => e !== span && (e.a === span.a || e.b === span.a || e.a === span.b || e.b === span.b))
    const levels = arms.map((e) => farLevel(e, e.a === span.a || e.b === span.a ? span.a : span.b))
    if (!levels.length) continue
    const sideA = arms.map((e, i) => (e.a === span.a || e.b === span.a ? levels[i] : -Infinity))
    const sideB = arms.map((e, i) => (e.a === span.b || e.b === span.b ? levels[i] : -Infinity))
    const hub = (Math.max(...sideA) + Math.max(...sideB)) / 2
    span.heights = span.heights!.map(() => Math.round(hub * 100) / 100)
    out.ids.add(span.id)
    arms.forEach((e, i) => {
      const fromA = e.a === span.a || e.a === span.b
      const c = cumulative(pts(e.points))
      const L = c[c.length - 1]
      e.heights = c.map((d) => { const t = (fromA ? d : L - d) / Math.max(L, 1); return Math.round((hub + (levels[i] - hub) * t) * 100) / 100 })
      out.ids.add(e.id)
      out.nodes.add(e.a)
      out.nodes.add(e.b)
    })
    out.decks++
  }
}

function deckY(n: number, ways: BridgeEdge[]): number {
  for (const e of ways) {
    if (e.a === n) return e.heights![0]
    if (e.b === n) return e.heights![e.heights!.length - 1]
  }
  return 0
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
export function rampFootBridgeEnds(edges: { id: number; a: number; b: number; kind?: string; foot?: boolean; bridge?: boolean; ramp?: boolean; points: number[]; heights?: number[] }[], humped = false): Set<number> {
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
      // (and one a previous pass graded is put back level, at its top: not a deck that humps, as every Seine bridge does, whose sidewalks follow
      //  its roadway — filled to the crown they stood flat up to 4 m over it at the ends, the Pont Marie's and the Alma's, a wall each side of the road)
      if (humped) continue
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
export function meetDecks(edges: BridgeEdge[], upOnly = false, rampOn = false): number[] {
  const changedIds: number[] = []
  const deckEnd = new Map<number, number>()
  for (const e of edges) {
    if (!e.bridge || !e.heights) continue
    const h = e.heights
    deckEnd.set(e.a, Math.max(deckEnd.get(e.a) ?? -Infinity, h[0]))
    deckEnd.set(e.b, Math.max(deckEnd.get(e.b) ?? -Infinity, h[h.length - 1]))
  }
  const onward = new Map<number, { deck: number; own: number }>()
  const onwardFoot = new Map<number, { deck: number; own: number }>()
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
      // (…and on a river bridge a way walked up from a low island or quay: the Allée des Cygnes's foot to the Pont de Bir-Hakeim, 6.6 m, over the distance a path takes it)
      if (Math.abs(deck - own) < 0.3 || Math.abs(deck - own) > (rampOn ? 8 : 6)) continue
      // (once the ground is final: a way under its deck climbs to it, but none is taken down into the ground)
      if (upOnly && deck < own) continue
      // (a road too short to take the step at a grade you could ride: see `rampOnward`, below; and in Paris a path the bridge opens to bikes: the
      //  Allée des Cygnes's 2 m to the Pont de Grenelle's deck climbed 3 m, rose more than it ran, and the ride graph dropped it, the island's path cut off)
      if (rampOn && !e.foot && Math.abs(deck - own) / Math.max(EASE, 0.5) > STEEPEST) {
        if (Math.abs(deck - own) > Math.abs(deck - (onward.get(node)?.own ?? deck))) onward.set(node, { deck, own })
        continue
      }
      if (rampOn && e.foot && e.kind !== 'steps' && Math.abs(deck - own) > Math.max(1.5, L)) {
        if (Math.abs(deck - own) > Math.abs(deck - (onwardFoot.get(node)?.own ?? deck))) onwardFoot.set(node, { deck, own })
        continue
      }
      const ease = rampOn && e.foot && e.kind !== 'steps' ? Math.min(Math.max(EASE, Math.abs(deck - own) / 0.1), L * 0.6) : EASE
      hs = hs.map((h, i) => {
        const d = fromA ? cum[i] : L - cum[i]
        return d >= ease ? h : Math.round((deck + (h - deck) * (d / ease)) * 100) / 100
      })
      changed = true
    }
    if (changed) { e.heights = hs; changedIds.push(e.id) }
  }
  if (onward.size || onwardFoot.size) {
    const byNode = new Map<number, BridgeEdge[]>()
    for (const e of edges) for (const n of [e.a, e.b]) (byNode.get(n) ?? byNode.set(n, []).get(n)!).push(e)
    for (const [node, o] of onward) changedIds.push(...rampOnward(byNode, node, o.deck, o.own))
    for (const [node, o] of onwardFoot) changedIds.push(...rampOnward(byNode, node, o.deck, o.own, true))
  }
  return changedIds
}

/** the steepest a road off a deck may take its step (…`rampOnward` lays it at `RAMP_GRADE`) */
const STEEPEST = 0.12
const RAMP_GRADE = 0.07

/**
 * A ROAD TOO SHORT FOR THE STEP (owner, 2026-10-30, the Rue du Département, 48.886241, 2.363147: "bizarrely steep tiny hill here which
 * can't exist in real life - the bridge must extend further to even it out"). The deck stood at 20.6 and the 3 m of way OSM has before
 * the next node took the whole of the step down to the street at 17.3: 100%. So the ramp goes on past the node, along every road, at a
 * grade you could ride, each way's own profile lifted by what is left of the step there. Not past a tunnel mouth, as the ramps above.
 */
function rampOnward(byNode: Map<number, BridgeEdge[]>, start: number, deck: number, own: number, foot = false): number[] {
  const step = deck - own
  const reach = Math.min(RAMP, Math.abs(step) / RAMP_GRADE)
  const under = (n: number): boolean => (byNode.get(n) ?? []).some((o) => o.tunnel || (o.layer ?? 0) < 0)
  const done = new Set<BridgeEdge>()
  const changed: number[] = []
  const queue: { node: number; dist: number }[] = [{ node: start, dist: 0 }]
  while (queue.length) {
    queue.sort((a, b) => a.dist - b.dist)
    const { node, dist } = queue.shift()!
    for (const e of byNode.get(node) ?? []) {
      if (e.bridge || (foot ? !e.foot || e.kind === 'steps' : e.foot) || e.tunnel || !e.heights || done.has(e)) continue
      done.add(e)
      const c = cumulative(pts(e.points))
      const L = c[c.length - 1]
      const fromA = e.a === node
      // (the way that meets the deck, whose own end may stand a little off the others': it comes to the deck exactly)
      const base = dist === 0 ? deck - (fromA ? e.heights[0] : e.heights[e.heights.length - 1]) : step
      e.heights = e.heights.map((h, i) => {
        const d = dist + (fromA ? c[i] : L - c[i])
        return d >= reach ? h : Math.round((h + base * (1 - d / reach)) * 100) / 100
      })
      e.ramp = true
      changed.push(e.id)
      const other = fromA ? e.b : e.a
      if (dist + L < reach && !under(other)) queue.push({ node: other, dist: dist + L })
    }
  }
  return changed
}
