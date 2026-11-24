/**
 * The ride graph, built at BAKE time and shipped beside the tiles (PARIS_EXPAND.md §3): the rider must be
 * able to plan a turn 400 m away and the navigator walks it continuously, so it is global — but it is small
 * next to the map, and building it at load meant holding every map edge of the city at once.
 *
 * `rideFor` is the ONE way it is built, with the city's hand overrides (city/overrides.ts), used by the bake
 * and by the game for a city baked before this — so the two cannot drift. `packRide`/`unpackRide` are the file.
 */
import { buildGraph, lengthOf, type Edge } from './graph.ts'
import { Projection } from './geo.ts'
import { RIDE_OVERRIDES, type ClosedSpec, type WalkSpec } from './overrides.ts'
import { region as regionOf } from './region.ts'
import { rideGraph, type RideEdge, type RideGraph, type RideMode } from './ridegraph.ts'
import { isRaised, onSurface, unpackPoints, type CityPackage, type PackedEdge } from './package.ts'

/** The map edges as the graph wants them, bridges and ramps marked `raised` the way the renderer marks them. */
export function mapEdges(edges: PackedEdge[], terrain: { heightAt(x: number, z: number): number }): Edge[] {
  return edges.map((e) => {
    const points = unpackPoints(e.points)
    return {
      id: e.id, a: e.a, b: e.b, points, length: lengthOf(points), surface: e.surface, width: e.width, walk: e.walk,
      name: e.name, foot: e.foot, crossing: e.crossing, heights: e.heights, kind: e.kind, service: e.service, oneway: e.oneway,
      layer: e.layer, bridge: e.bridge, tunnel: e.tunnel, passage: e.passage, ...(e.bore ? { bore: true } : {}),
      ...(e.ridden ? { ridden: true } : {}), ...(e.authored ? { authored: true } : {}), ...(e.trail ? { trail: true } : {}),
      ...(e.park ? { park: true } : {}),
      ...(e.onModel ? { onModel: true } : {}),
      ...(e.noBike ? { noBike: true } : {}),
      // a street tunnel (`bore`) is off the ground too: what drives and walks in it follows its own heights
      ...((onSurface(e) && isRaised(e, terrain)) || e.bore ? { raised: true } : {}),
    }
  })
}

export function rideFor(city: string, origin: CityPackage['origin'], edges: Edge[], mode: RideMode,
  heightAt: (x: number, z: number) => number, region?: string, buildings?: number[][],
  /** the roundabouts the bake found in OSM (CityPackage.roundabouts): each one no hand-made one already covers */
  found: NonNullable<CityPackage['roundabouts']> = []): RideGraph {
  const proj = new Projection(origin)
  const o = RIDE_OVERRIDES[city] ?? (region ? RIDE_OVERRIDES[region] : undefined)
  const hand = o?.roundabouts ?? []
  const near = (a: { lat: number; lon: number }, b: { lat: number; lon: number }): number => {
    const p = proj.toLocal(a), q = proj.toLocal(b)
    return Math.hypot(p.x - q.x, p.z - q.z)
  }
  const extra = found.filter((f) => !hand.some((h) => near(h, f) < h.R + f.r))
    .map((f) => ({ name: f.name ?? 'roundabout', lat: f.lat, lon: f.lon, r: f.r, R: f.R }))
  const closed = closedTest(proj, o?.closed ?? [])
  const kept = closed ? edges.filter((e) => !closed(e)) : edges
  const walks = handWalks(proj, o?.walks ?? [], kept, heightAt)
  return rideGraph(walks.length ? [...kept, ...walks] : kept, mode, {
    corridors: (o?.corridors ?? []).map((c) => ({ street: c.street, from: proj.toLocal(c.from), to: proj.toLocal(c.to), lane: c.lane })),
    roundabouts: [...hand, ...extra].map((r) => {
      const p = proj.toLocal({ lat: r.lat, lon: r.lon })
      return { name: r.name, r: r.r, R: r.R, x: p.x, z: p.z }
    }),
    heightAt,
    ground: heightAt,
    oneDeck: region === 'paris',
    buildings,
    keep: (regionOf(region ?? city).ferryIslands ?? []).map((k) => ({ ...proj.toLocal({ lat: k.lat, lon: k.lon }), r: k.radius })),
  })
}

/** the OSM way kinds a closed area keeps out: walks, not streets */
const CLOSED_KINDS = new Set(['footway', 'pedestrian', 'path', 'steps', 'corridor'])

/**
 * Is this map edge one of a closed area's interior walks (overrides.ts `ClosedSpec`)? A walk kind, from OSM (the
 * bake's own garden walks, negative ids, are laid round buildings already), with most of its points in the box or an
 * end in it — the end rule takes the stub from outside up to a door the model has not got.
 */
function closedTest(proj: Projection, specs: ClosedSpec[]): ((e: Edge) => boolean) | null {
  if (!specs.length) return null
  const boxes = specs.map((c) => {
    const p = proj.toLocal(c), t = (c.rotateDeg * Math.PI) / 180
    // local +z along bearing rotateDeg, +x along bearing rotateDeg + 90 (x east, z north)
    return { x: p.x, z: p.z, zx: Math.sin(t), zz: Math.cos(t), xx: Math.cos(t), xz: -Math.sin(t), hx: c.hx, hz: c.hz }
  })
  const inside = (q: { x: number; z: number }): boolean => boxes.some((b) => {
    const dx = q.x - b.x, dz = q.z - b.z
    return Math.abs(dx * b.xx + dz * b.xz) < b.hx && Math.abs(dx * b.zx + dz * b.zz) < b.hz
  })
  return (e) => {
    if (e.id < 0 || !CLOSED_KINDS.has(e.kind ?? '')) return false
    const n = e.points.filter(inside).length
    return n > e.points.length / 2 || inside(e.points[0]) || inside(e.points[e.points.length - 1])
  }
}

/** a hand-laid walk's loose end joins the nearest way's end this near (m) */
const WALK_SNAP = 12

/** overrides.ts `WalkSpec`s as map edges: ids and nodes from −800 000 000 down, clear of the garden walks' */
function handWalks(proj: Projection, specs: WalkSpec[], edges: Edge[], heightAt: (x: number, z: number) => number): Edge[] {
  if (!specs.length) return []
  const ends: { n: number; p: { x: number; z: number } }[] = []
  for (const e of edges) if (!e.tunnel && !e.crossing) ends.push({ n: e.a, p: e.points[0] }, { n: e.b, p: e.points[e.points.length - 1] })
  const out: Edge[] = []
  let next = -800_000_000
  for (const w of specs) {
    const c = proj.toLocal(w), t = (w.rotateDeg * Math.PI) / 180
    const world = ([x, z]: [number, number]) => ({ x: c.x + x * Math.cos(t) + z * Math.sin(t), z: c.z - x * Math.sin(t) + z * Math.cos(t) })
    const mine: { n: number; p: { x: number; z: number } }[] = []
    const node = (p: { x: number; z: number }): { n: number; p: { x: number; z: number } } => {
      const own = mine.find((m) => Math.hypot(m.p.x - p.x, m.p.z - p.z) < 0.5)
      if (own) return own
      const shared = w.paths.flatMap((q) => [q[0], q[q.length - 1]]).map(world).filter((q) => Math.hypot(q.x - p.x, q.z - p.z) < 0.5).length > 1
      let best: { n: number; p: { x: number; z: number } } | null = null, bd = w.snap ?? WALK_SNAP
      if (!shared) for (const e of ends) { const d = Math.hypot(e.p.x - p.x, e.p.z - p.z); if (d < bd) { bd = d; best = e } }
      if (!shared && !best) console.warn(`hand walk ${w.name}: an end at ${p.x.toFixed(0)},${p.z.toFixed(0)} joins nothing`)
      const m = best ?? { n: next--, p }
      mine.push({ n: m.n, p })
      return m
    }
    for (const path of w.paths) {
      const pts = path.map(world)
      const a = node(pts[0]), b = node(pts[pts.length - 1])
      // a joined end runs on to the way's own end point
      if (Math.hypot(a.p.x - pts[0].x, a.p.z - pts[0].z) > 0.01) pts.unshift(a.p)
      if (Math.hypot(b.p.x - pts[pts.length - 1].x, b.p.z - pts[pts.length - 1].z) > 0.01) pts.push(b.p)
      out.push({ id: next--, a: a.n, b: b.n, points: pts, length: lengthOf(pts), surface: 'gravel', width: 3, walk: 0, name: w.name,
        foot: true, kind: 'footway', heights: pts.map((q) => Math.round(heightAt(q.x, q.z) * 100) / 100) })
    }
  }
  return out
}

/** One ride edge on disk: its points flat, `over` as [id, reversed 0/1, length] triples. */
export type PackedRideEdge = Omit<RideEdge, 'points' | 'length' | 'over'> & { points: number[]; over: number[] }
export interface RideFile { mode: RideMode; edges: PackedRideEdge[] }

const r2 = (v: number): number => Math.round(v * 100) / 100

export function packRide(g: RideGraph, mode: RideMode): RideFile {
  const edges: PackedRideEdge[] = []
  for (const e of g.edges.values()) {
    const { points, length: _l, over, ...rest } = e
    void _l
    const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) as typeof rest
    edges.push({
      ...clean, points: points.flatMap((p) => [r2(p.x), r2(p.z)]),
      ...(e.heights ? { heights: e.heights.map(r2) } : {}),
      over: over.flatMap((o) => [o.id, o.reversed ? 1 : 0, r2(o.length)]),
    })
  }
  return { mode, edges }
}

export function unpackRide(f: RideFile): RideGraph {
  /*
   * Emptied as it is read, which is the point of the loop rather than a `map`.
   *
   * The whole city's ride graph arrives as one JSON file, and unpacking it is the largest single
   * allocation the game makes — measured at +116 MB of a 377 MB peak on the iOS tier, where the tab is
   * killed at 384. A `map` holds the entire packed array alive until it returns, so for the length of the
   * unpacking BOTH forms of every edge are on the heap at once. Dropping each packed edge as its unpacked
   * one is built lets the collector take them while the loop is still running.
   *
   * `f` is the parsed file and nothing else has a reference to it, so emptying it is safe.
   */
  const packed = f.edges as (PackedRideEdge | null)[]
  const es: RideEdge[] = new Array(packed.length)
  for (let i = 0; i < packed.length; i++) {
    const e = packed[i]!
    packed[i] = null
    const points = unpackPoints(e.points)
    const over = []
    for (let k = 0; k + 2 < e.over.length; k += 3) over.push({ id: e.over[k], reversed: e.over[k + 1] === 1, length: e.over[k + 2] })
    es[i] = { ...e, points, length: lengthOf(points), over }
  }
  return buildGraph(es) as RideGraph
}
