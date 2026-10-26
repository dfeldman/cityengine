/**
 * The ways of a city onto its bridge models' decks (src/city/bridge-decks.ts), for the bake: every landmark manifest
 * entry of the region whose `procedural` has declared decks is placed, and the package's ways are conformed to them
 * — on the deck, the deck's height; the chain off it regraded. Mutates the edges' `heights`, `bridge` and `ramp`.
 *
 * Called by tools/bake.ts once the streets have their heights (after the bridges and the bored tunnels, before the
 * ride graphs and the tiles), and by `npm run bake -- <city> --decks` on a package already baked.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'
import { packPoints, unpackPoints, type PackedEdge } from '../src/city/package.ts'
import { BridgeDecks, placement, toWorld, type ConformReport, type DeckDecl, type GraphEdge } from '../src/city/bridge-decks.ts'
import { SF_BRIDGE_DECKS, BAY_BIKEWAY, BAY_RIDDEN_RAMPS, SALESFORCE_PARK_WAYS, type AuthoredEnd, type AuthoredWay } from '../src/city/sf/bridges.ts'
import { PIER39_ROUTE, PIER39_ROUTE_MODEL } from '../src/city/sf/pier39-route.ts'
import type { OsmWay } from './overpass.ts'

/** the decks each region's bridge models declare, by `procedural` */
const REGION_DECKS: Record<string, Record<string, DeckDecl[]>> = { 'san-francisco': SF_BRIDGE_DECKS }

interface Entry { name?: string; procedural?: string; lat?: number; lon?: number; rotateDeg?: number; baseY?: number; scale?: number; offset?: [number, number, number] }

/** The region's bridge decks, placed; empty where the region has none. */
export function decksOf(region: string, origin: { lat: number; lon: number }): BridgeDecks {
  const decks = new BridgeDecks()
  const decls = REGION_DECKS[region]
  const dir = resolve(import.meta.dirname, '..', 'public', 'landmarks', region)
  if (!decls || !existsSync(dir)) return decks
  const proj = new Projection(origin)
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    const list = JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as Entry[] | { entries?: Entry[] }
    for (const e of Array.isArray(list) ? list : list.entries ?? []) {
      const d = e.procedural ? decls[e.procedural] : undefined
      if (d && e.lat !== undefined && e.lon !== undefined) decks.add(placement({ ...e, lat: e.lat, lon: e.lon }, proj), d)
    }
  }
  return decks
}

/**
 * Each region's authored ways, by the model whose frame they are drawn in (any manifest of the region may place it),
 * and the freeway ramps it rides. The Bay Bridge Bikeway; since 2026-10-02 Salesforce Park's gondola
 * (docs/SALESFORCE-PARK.md); since 2026-10-17 the Pier 39 Bikeway (src/city/sf/pier39-route.ts), on the deck.
 */
const REGION_WAYS: Record<string, { models: { model: string; ways: AuthoredWay[] }[]; ridden: [number, number][] }> = {
  'san-francisco': { models: [{ model: 'bayBridgeNear', ways: BAY_BIKEWAY }, { model: 'salesforceTransitCenter', ways: SALESFORCE_PARK_WAYS },
    { model: PIER39_ROUTE_MODEL, ways: PIER39_ROUTE }], ridden: BAY_RIDDEN_RAMPS },
}

function placementOf(region: string, procedural: string, origin: { lat: number; lon: number }): ReturnType<typeof placement> | null {
  const dir = resolve(import.meta.dirname, '..', 'public', 'landmarks', region)
  if (!existsSync(dir)) return null
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    const list = JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as Entry[] | { entries?: Entry[] }
    const e = (Array.isArray(list) ? list : list.entries ?? []).find((x) => x.procedural === procedural)
    if (e && e.lat !== undefined && e.lon !== undefined) return placement({ ...e, lat: e.lat, lon: e.lon }, new Projection(origin))
  }
  return null
}

/**
 * The region's AUTHORED ways (src/city/sf/bridges.ts `BAY_BIKEWAY`) as OSM ways the bake takes in with the rest, and
 * the height of each of their nodes (local metres). An end that names an OSM node is that node; one that names a
 * kind of way and a layer is the nearest node of such a way to it; a free end is shared with whichever other
 * authored way ends within half a metre. The geometry is snapped onto the nodes it joins.
 */
export function authoredWays(region: string, origin: { lat: number; lon: number }, osm: OsmWay[],
  box?: { x0: number; x1: number; z0: number; z1: number }): { ways: OsmWay[]; y: Map<number, number> } {
  const spec = REGION_WAYS[region]
  const y = new Map<number, number>()
  if (!spec) return { ways: [], y }
  const proj = new Projection(origin)
  // every OSM node's place
  const nodeAt = new Map<number, { lat: number; lon: number }>()
  for (const w of osm) w.nodes.forEach((n, i) => { if (w.geometry?.[i]) nodeAt.set(n, w.geometry[i]) })
  /*
   * The area this bake covers, from the OSM it was given. A region's authored ways are drawn for the whole region;
   * a bake of part of it (a test area such as sausalito-mini) leaves out the ones that are not inside it, instead
   * of failing to find the bridge deck they join (the bake crashed on exactly that, 2026-10-14).
   */
  // (the bake's own box where it says — the OSM a test area is given can carry a way that runs far outside it, and the
  //  box of every node then took in the whole city: jtg-mini, 450 m round the Japanese Tea Garden, reached Salesforce
  //  Park and crashed on its gondola's end, 2026-10-26)
  let { x0, x1, z0, z1 } = box ?? { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity }
  if (!box) for (const at of nodeAt.values()) {
    const q = proj.toLocal(at)
    x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z)
  }
  const inside = (q: { x: number; z: number }): boolean => q.x >= x0 && q.x <= x1 && q.z >= z0 && q.z <= z1
  /*
   * The nearest point ON a way of this kind and layer — and a node put in the way there. OSM maps the Bay Bridge's
   * three-kilometre spans with three nodes each (the bake densifies them later), so there is no junction to join
   * a way onto in the middle of a span: one is made, in the OSM way itself, before the bake splits ways at junctions.
   */
  let made = -810_000_000
  const nearestOn = (kind: string, layer: number, p: { x: number; z: number }): number | null => {
    let best: { w: OsmWay; i: number; t: number; d: number } | null = null
    for (const w of osm) {
      if (w.tags.highway !== kind || Number(w.tags.layer ?? 0) !== layer || !w.geometry) continue
      for (let i = 1; i < w.geometry.length; i++) {
        const a = proj.toLocal(w.geometry[i - 1]), b = proj.toLocal(w.geometry[i])
        const dx = b.x - a.x, dz = b.z - a.z
        const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1e-9)))
        const d = Math.hypot(a.x + dx * t - p.x, a.z + dz * t - p.z)
        if (d < 40 && (!best || d < best.d)) best = { w, i, t, d }
      }
    }
    if (!best) return null
    const { w, i, t } = best
    // an existing node close by will do
    if (t < 0.01) return w.nodes[i - 1]
    if (t > 0.99) return w.nodes[i]
    const a = proj.toLocal(w.geometry[i - 1]), b = proj.toLocal(w.geometry[i])
    const id = made--
    const at = proj.toLatLon({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t })
    w.nodes.splice(i, 0, id)
    w.geometry.splice(i, 0, at)
    nodeAt.set(id, at)
    return id
  }
  let next = -800_000_000
  const free = new Map<string, number>()
  const out: OsmWay[] = []
  let k = 0
  for (const group of spec.models) {
  const pl = placementOf(region, group.model, origin)
  if (!pl) continue
  for (const w of group.ways) {
    const world = w.points.map((q) => ({ ...toWorld(pl, q), y: pl.baseY + q.y * pl.scale }))
    if (!world.every(inside)) {
      console.log(`  authored way ${w.name}: outside this bake, left out`)
      continue
    }
    const end = (e: AuthoredEnd, q: { x: number; z: number }): number => {
      if ('node' in e) return e.node
      if ('onto' in e) {
        const n = nearestOn(e.onto.kind, e.onto.layer, q)
        if (n === null) throw new Error(`authored way ${w.name} #${k}: no ${e.onto.kind} on layer ${e.onto.layer} within 40 m of its end (${q.x.toFixed(0)}, ${q.z.toFixed(0)})`)
        return n
      }
      const key = `${Math.round(q.x * 2)},${Math.round(q.z * 2)}`
      let n = free.get(key)
      if (n === undefined) { n = next--; free.set(key, n) }
      return n
    }
    const nodes = world.map(() => next--)
    nodes[0] = end(w.a, world[0])
    nodes[nodes.length - 1] = end(w.b, world[world.length - 1])
    const geometry = world.map((q, i) => nodeAt.get(nodes[i]) ?? proj.toLatLon(q))
    nodes.forEach((n, i) => y.set(n, Math.round(world[i].y * 100) / 100))
    out.push({ type: 'way', id: -(700_000_000 + k), nodes, geometry,
      tags: { highway: w.kind, name: w.name, bridge: 'yes', layer: String(w.layer ?? 1), width: '4', bicycle: 'designated', 'sr:authored': 'yes' } } as OsmWay)
    k++
  }
  }
  return { ways: out, y }
}

export function conformToDecks(region: string, origin: { lat: number; lon: number }, edges: PackedEdge[],
  ground: (x: number, z: number) => number): ConformReport | null {
  const decks = decksOf(region, origin)
  if (decks.size === 0) return null
  // the authored ways' own heights (tools/bake.ts kept them aside as `_y` while it graded the streets)
  for (const e of edges as (PackedEdge & { _y?: number[][] })[]) {
    if (!e._y) continue
    // each point onto the authored line it lies on, in order (the bake may have put points between the nodes)
    const line = e._y
    const pts = unpackPoints(e.points)
    let seg = 0
    e.heights = pts.map((q) => {
      for (let s = seg; s < line.length - 1; s++) {
        const [ax, az, ay] = line[s], [bx, bz, by] = line[s + 1]
        const dx = bx - ax, dz = bz - az
        const t = ((q.x - ax) * dx + (q.z - az) * dz) / (dx * dx + dz * dz || 1e-9)
        if (t >= -0.01 && t <= 1.01 && Math.hypot(ax + dx * t - q.x, az + dz * t - q.z) < 0.3) {
          seg = s
          return Math.round((ay + (by - ay) * Math.max(0, Math.min(1, t))) * 100) / 100
        }
      }
      return line[Math.min(seg + 1, line.length - 1)][2]
    })
    delete e._y
  }
  // the freeway ramps the region rides, by the nodes at their ends
  const ramps = new Set((REGION_WAYS[region]?.ridden ?? []).flatMap(([a, b]) => [`${a}-${b}`, `${b}-${a}`]))
  for (const e of edges) if (ramps.has(`${e.a}-${e.b}`)) e.ridden = true
  // (each view has its OWN heights: the conformer writes in place, and a caller keeping what was there — the
  // `--decks` undo — must not find it changed under it)
  const views = edges.map((e) => ({ ...e, points: unpackPoints(e.points), heights: e.heights?.slice(), ...(e.authored ? { fixed: true } : {}) })) as unknown as GraphEdge[]
  const r = decks.conformGraph(views, ground)
  views.forEach((v, i) => {
    if (v.ridden) edges[i].ridden = true
    if (!r.changed.has(v.id)) return
    const e = edges[i]
    e.heights = v.heights
    // (the plan too, where a bulge was brought in onto a model's roadway: `BridgeDecks.snap`)
    const flat = packPoints(v.points)
    if (flat.some((c, k) => c !== e.points[k])) e.points = flat
    if (v.bridge) e.bridge = true
    if (v.ramp) e.ramp = true
    if (v.bore) e.bore = true
    if (v.cut) e.cut = true
    if (v.ridden) e.ridden = true
  })
  alongside(edges, r.changed, decks)
  return r
}

const PATHS = new Set(['footway', 'path', 'cycleway', 'pedestrian', 'steps'])
/** narrowest a carriageway is drawn when it has to give way to a neighbour (two lanes) */
const MIN_ROAD = 6
/** a footway on a structure stands this much above the carriageway beside it: the kerb */
const KERB = 0.15

/**
 * SIDE BY SIDE ON ONE STRUCTURE (owner, 2026-10-02, the Golden Gate's south approach: "the path goes right through the
 * bottom of the bridge, and the user is stuck inside the bridge deck for quite a while"). Off a model's deck, every
 * way of a chain is graded on its own, down to its own landing — and OSM's carriageways are drawn as wide as their
 * width tag says. On the curved approach the two carriageways (12.6 m each, 9.8 m apart) overlapped each other, the
 * east one's deck and parapet reached over the sidewalk 7.3 m from its middle, and the sidewalk, graded to its own
 * end, ran 1.8 m under the road's surface: the rider rode inside the deck, through its parapet, head showing.
 *
 * So, for the ways the conform changed, off a model's own roadway, where two on the same level run alongside:
 *   1. a CARRIAGEWAY is drawn no wider than leaves room for its neighbour (never under `MIN_ROAD`);
 *   2. a FOOTWAY or cycleway beside a carriageway is at the carriageway's height, a kerb above it — blended back to
 *      its own as the two part, so where it leaves for its own landing it still gets there.
 */
function alongside(edges: PackedEdge[], changed: Set<number>, decks: BridgeDecks): void {
  interface Seg { e: PackedEdge; ax: number; az: number; bx: number; bz: number; ha: number; hb: number }
  const CELL = 25
  const grid = new Map<string, Seg[]>()
  const cands = edges.filter((e) => changed.has(e.id) && (e.bridge || e.ramp) && !e.tunnel && e.heights)
  const pts = new Map<PackedEdge, { x: number; z: number }[]>()
  for (const e of cands) {
    const p = unpackPoints(e.points)
    pts.set(e, p)
    for (let i = 1; i < p.length; i++) {
      const s: Seg = { e, ax: p[i - 1].x, az: p[i - 1].z, bx: p[i].x, bz: p[i].z, ha: e.heights![i - 1], hb: e.heights![i] }
      for (let gx = Math.floor(Math.min(s.ax, s.bx) / CELL); gx <= Math.floor(Math.max(s.ax, s.bx) / CELL); gx++) {
        for (let gz = Math.floor(Math.min(s.az, s.bz) / CELL); gz <= Math.floor(Math.max(s.az, s.bz) / CELL); gz++) {
          const k = `${gx},${gz}`
          const l = grid.get(k)
          if (l) l.push(s); else grid.set(k, [s])
        }
      }
    }
  }
  const road = (e: PackedEdge): boolean => !e.foot && !PATHS.has(e.kind)
  /** the nearest point of each OTHER way running the same way as `dir` near (x, z), with its height and distance */
  const neighbours = (self: PackedEdge, x: number, z: number, dx: number, dz: number): Map<PackedEdge, { d: number; h: number }> => {
    const out = new Map<PackedEdge, { d: number; h: number }>()
    const gx = Math.floor(x / CELL), gz = Math.floor(z / CELL)
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const s of grid.get(`${gx + i},${gz + j}`) ?? []) {
      if (s.e === self || (s.e.layer ?? 0) !== (self.layer ?? 0)) continue
      const ux = s.bx - s.ax, uz = s.bz - s.az
      const L = Math.hypot(ux, uz) || 1e-9
      // parallel only: a way crossing over or under is not alongside
      if (Math.abs((ux * dx + uz * dz) / L) < 0.9) continue
      const t = Math.max(0, Math.min(1, ((x - s.ax) * ux + (z - s.az) * uz) / (L * L)))
      const d = Math.hypot(s.ax + ux * t - x, s.az + uz * t - z)
      const was = out.get(s.e)
      if (!was || d < was.d) out.set(s.e, { d, h: s.ha + (s.hb - s.ha) * t })
    }
    return out
  }
  const halfOf = (e: PackedEdge): number => e.width / 2 + (road(e) ? Math.max(e.walk ?? 0, 0) : 0)
  // 1. widths
  const narrowest = new Map<PackedEdge, number>()
  for (const e of cands) {
    const p = pts.get(e)!
    for (let i = 0; i < p.length; i++) {
      if (decks.covers(p[i].x, p[i].z)) continue
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)]
      const l = Math.hypot(b.x - a.x, b.z - a.z) || 1e-9
      for (const [n, { d }] of neighbours(e, p[i].x, p[i].z, (b.x - a.x) / l, (b.z - a.z) / l)) {
        if (!road(n)) continue
        // the room n leaves e here: half the gap between two carriageways, all of it beside a path
        const room = road(e) ? d / 2 - 0.2 : d - halfOf(e) - 0.35
        if (room < halfOf(n)) narrowest.set(n, Math.min(narrowest.get(n) ?? Infinity, room))
      }
    }
  }
  for (const [n, half] of narrowest) {
    const w = Math.max(MIN_ROAD, Math.round(2 * (half - Math.max(n.walk ?? 0, 0)) * 10) / 10)
    if (w < n.width) n.width = w
  }
  // 2. a path's heights beside a carriageway
  for (const e of cands) {
    if (road(e)) continue
    const p = pts.get(e)!
    const h = e.heights!
    for (let i = 0; i < p.length; i++) {
      if (decks.covers(p[i].x, p[i].z)) continue
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)]
      const l = Math.hypot(b.x - a.x, b.z - a.z) || 1e-9
      let best: { d: number; h: number; reach: number } | null = null
      for (const [n, v] of neighbours(e, p[i].x, p[i].z, (b.x - a.x) / l, (b.z - a.z) / l)) {
        if (!road(n)) continue
        const reach = halfOf(n) + halfOf(e) + 1
        if (v.d < reach + 2 && (!best || v.d - reach < best.d - best.reach)) best = { ...v, reach }
      }
      if (!best) continue
      // wholly alongside within `reach`, back to its own over the next two metres apart
      const w = Math.max(0, Math.min(1, (best.reach + 2 - best.d) / 2))
      h[i] = Math.round((h[i] + (best.h + KERB - h[i]) * w) * 100) / 100
    }
  }
}

/** what a way was before it was conformed — all that `conformToDecks` changes of it */
export type DeckUndo = Record<string, { heights?: number[]; points?: number[]; width?: number; bridge?: boolean; ramp?: boolean; bore?: boolean; cut?: boolean }>

/** Put back what an earlier conform changed (so a changed declaration does not build on the last one's heights). */
export function undoDecks(edges: PackedEdge[], undo: DeckUndo): Set<number> {
  const touched = new Set<number>()
  for (const e of edges) {
    const u = undo[e.id]
    if (!u) continue
    e.heights = u.heights
    if (u.points) e.points = u.points
    if (u.width !== undefined) e.width = u.width
    for (const k of ['bridge', 'ramp', 'bore', 'cut'] as const) { if (u[k]) e[k] = true; else delete e[k] }
    touched.add(e.id)
  }
  return touched
}

/** `conformToDecks`, and what it changed as it was before — written beside the package as `decks-undo.json`. */
export function conformWithUndo(region: string, origin: { lat: number; lon: number }, edges: PackedEdge[],
  ground: (x: number, z: number) => number): { report: ConformReport; undo: DeckUndo } | null {
  const before = new Map(edges.map((e) => [e.id, { heights: e.heights, points: e.points, width: e.width, bridge: e.bridge, ramp: e.ramp, bore: e.bore, cut: e.cut }]))
  const report = conformToDecks(region, origin, edges, ground)
  if (!report) return null
  const undo: DeckUndo = {}
  for (const id of report.changed) undo[id] = before.get(id)!
  return { report, undo }
}

export const describe = (r: ConformReport): string =>
  `${r.pinned} ways on a modelled deck, ${r.regraded} regraded off them (${r.flagged} newly structures, ${r.heldUp} crossings held up, `
  + `${r.bored} tunnel ways bored, ${r.snapped} points brought onto a roadway); steepest ${(r.steepest.grade * 100).toFixed(1)}% on ${r.steepest.id}`
