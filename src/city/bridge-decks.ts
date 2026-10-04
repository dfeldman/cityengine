/**
 * BRIDGE DECKS: the ways over a modelled bridge take their heights from the MODEL (2026-09-29, the owner: "the paths
 * all need to line up to bike over the bridge models, which are not exactly the same shape as the data from OSM").
 *
 * A bridge model (render/landmarks/sf/golden-gate.ts …) declares its walkable decks in its own frame — a strip along
 * its z axis with a half-width and a height at each z (`DeckDecl`). Placed by its manifest entry (the same transform
 * as render/landmarks.ts `place`, `placement` below), every way that is a bridge, a ramp or off layer 0, lies inside
 * a deck and is on its layer, takes the deck's height where it is on it — the rider, the camera, the cars and the
 * GPS line are then on the steel, not 20 m above or below it (BUGS.md #217: they had been, both ways, for weeks).
 *
 * PLAN IS NOT TOUCHED: measured, the OSM ways over the bridges lie inside the models' decks (tools/bridge-fit.ts);
 * moving points would part edges from their neighbours at junctions.
 *
 * OFF THE END OF A DECK the ways go on: an approach viaduct, the ramps that leave it, the freeway it becomes. The
 * bake's heights for those were made for a bridge it guessed (tools/bridges.ts: a hump a few metres over the water),
 * so they cannot be trusted near a deck that stands fifty metres up — the Golden Gate's sidewalks lay draped on the
 * ground under the Marin viaduct, the Bay Bridge's upper deck came in BELOW its lower one on Rincon Hill. So the
 * whole CHAIN hanging off a deck is regraded (`conformGraph`), by where it goes rather than by what it was given:
 *
 *   * a STRUCTURE (a way OSM calls a bridge, or puts above layer 0, or a short piece of freeway between two such)
 *     is a straight grade between its two ends. The chain of structures off a deck is held where it is KNOWN — on
 *     the deck (the model), at a junction with any way that is NOT a structure, and `REACH` along the chain from
 *     the deck (the bake's own height) — and between those every junction takes the height that makes each
 *     stretch a straight grade (the harmonic solution, each stretch weighing by one over its length): where ramps
 *     part, the junction sits where all of them agree. Nothing is left under the ground.
 *   * a LANDING — a junction of the chain with an ordinary street — is on the ground, whatever the bake had
 *     lifted that street to (it ramps the streets at a bridge's end up to the bridge it guessed), and that ramp
 *     is taken back out of the streets round it.
 *   * a regraded structure is HELD UP where it would pass too low over a way it crosses.
 *   * a way ON THE GROUND that leaves a deck (a freeway OSM maps at grade off the end of the span, a path off the
 *     sidewalk down to the car park) keeps its own heights, and is brought to the deck's within a CONE from it: no
 *     further from the deck's height than `RAMP_GRADE` times the distance along the way, through as many ways as
 *     that takes. A way so left standing off the ground is a `bridge` (or, barely off it, a `ramp`), and is drawn
 *     as a structure.
 *
 * This runs IN THE BAKE (tools/bake.ts, and alone as `npm run bake -- <city> --decks`), before the ride graphs and
 * the tiles are written, so the drawn road, the cars' graph and the rider's graph all carry the same heights. It ran
 * at load on each tile for a day (2026-09-29), which could not see a chain whole.
 *
 * Code frame: x east, z north, y up, metres. Heights of a way are in `heights`, one per point.
 */
import { Projection } from './geo.ts'

/**
 * A deck in its model's own frame: from z `from` to `to`, `half` either side of x = `x`, at height `y(z)` — or, with
 * a `path`, `half` either side of that line from `from` to `to` metres ALONG it, at height `y(along)`: a span that
 * curves (the Bay Bridge's east span swings 50° on its way to Oakland).
 */
export interface DeckDecl {
  from: number
  to: number
  half: number
  x?: number
  y: (z: number) => number
  /** the deck's centre line, in the model's frame, where it is not the z axis */
  path?: { x: number; z: number }[]
  /**
   * A deck that is an AREA, not a strip: a podium's roof (Embarcadero Center's Maritime Plaza, 2026-10-03). A point is
   * on it only INSIDE the ring (no margin: the street's own sidewalk runs along the podium's edge, at layer 1 like
   * the walks on it), always at `y(0)`; `from`, `to`, `half` are unused.
   */
  ring?: { x: number; z: number }[]
  /**
   * What the MODEL draws of this deck: its roadway slab, `half` either side of the line from `from` to `to`. A deck
   * is declared wider and longer than that (the ways take its heights for some way past the steel, and a sidewalk
   * hung outboard of the slab is still on the bridge) — but only inside this is there anything under the wheel;
   * outside it the way's own structure has to be drawn (render/city.ts `outsideCovers`). Absent: the model draws
   * none of it.
   */
  model?: { from: number; to: number; half: number }
  /** the freeway ways on this deck are RIDDEN by bike — the bridge is part of the ride network (ridegraph.ts) */
  ride?: boolean
  /** only ways on this OSM layer (a double-deck bridge: the upper deck and the lower) */
  layer?: number
  /**
   * ways of these kinds are on the deck WHATEVER they are flagged (OSM maps the Bay Bridge's lower deck across
   * Yerba Buena as a plain motorway on layer 0 for 130 m between the span and the tunnel). Without it only a
   * bridge, a ramp or a way off layer 0 is: a street passing under the deck is not on it.
   */
  kinds?: string[]
  /**
   * Reached by stairs and lifts, not ramps (Salesforce Park, 2026-10-02): the ways ON it take its height, and nothing
   * off it is regraded — no chain of structures graded down from it, no cone lifting the streets round it. Without it
   * the park's 21 m deck pulled 1 266 ways up, ordinary streets blocks away among them (docs/SALESFORCE-PARK.md).
   */
  vertical?: boolean
  /**
   * With `vertical`: the foot ways that JOIN the deck from off it — the stairs and paths up from the street to a podium,
   * which OSM maps at the street's level — are graded from the deck's height at the junction down to their far end,
   * and drawn as structures where they stand off the ground. Without it they kept the street's height at a junction on
   * the deck, a step as tall as the deck (Embarcadero Center, 2026-10-03). Nothing further off is touched.
   */
  joins?: boolean
}

/** Where a model stands: as a manifest entry says, the arithmetic of render/landmarks.ts `place`. */
export interface Placement { cx: number; cz: number; rotation: number; scale: number; baseY: number }

export function placement(e: { lat: number; lon: number; rotateDeg?: number; baseY?: number; scale?: number; offset?: [number, number, number] },
  proj: Projection): Placement {
  const c = proj.toLocal({ lat: e.lat, lon: e.lon })
  const [ox, oy, oz] = e.offset ?? [0, 0, 0]
  return { cx: c.x + ox, cz: c.z + oz, rotation: ((e.rotateDeg ?? 0) * Math.PI) / 180, scale: e.scale ?? 1, baseY: (e.baseY ?? 0) + oy }
}

/** model frame → world, as the mesh is placed (Babylon's rotation.y, left-handed) */
export function toWorld(p: Placement, m: { x: number; z: number }): { x: number; z: number } {
  const cos = Math.cos(p.rotation)
  const sin = Math.sin(p.rotation)
  return { x: p.cx + (m.x * cos + m.z * sin) * p.scale, z: p.cz + (-m.x * sin + m.z * cos) * p.scale }
}

/** world → model frame */
export function toModel(p: Placement, q: { x: number; z: number }): { x: number; z: number } {
  const cos = Math.cos(p.rotation)
  const sin = Math.sin(p.rotation)
  const dx = (q.x - p.cx) / p.scale
  const dz = (q.z - p.cz) / p.scale
  return { x: dx * cos - dz * sin, z: dx * sin + dz * cos }
}

/** A way as the conformer sees it: its ends (junction ids), its plan, its heights and what it is. */
export interface GraphEdge {
  id: number
  a: number
  b: number
  points: { x: number; z: number }[]
  heights?: number[]
  kind?: string
  bridge?: boolean
  ramp?: boolean
  raised?: boolean
  tunnel?: boolean
  /** a street tunnel with its own mouth-to-mouth profile (tools/tunnels.ts): never regraded */
  bore?: boolean
  /** a way below the ground beside it, open to the sky (the bake carves the ground down to it) */
  cut?: boolean
  /** heights the region authored (`AuthoredWay`): held as they are, like a deck's */
  fixed?: boolean
  /** set here: a freeway way on a deck the bike rides (`DeckDecl.ride`) */
  ridden?: boolean
  layer?: number
}

export interface ConformReport {
  /** ways with a point on a deck */
  pinned: number
  /** ways off the decks regraded as part of a chain */
  regraded: number
  /** ways newly marked a `bridge` or a `ramp` (standing off the ground with nothing saying so) */
  flagged: number
  /** junctions put on the ground because a straight grade would have buried them */
  grounded: number
  /** crossings where a regraded structure was held up to clear the way under it */
  heldUp: number
  /** tunnel ways a deck runs through, made bores */
  bored: number
  /** points of ways brought in onto a model's roadway (a bulge past its edge) */
  snapped: number
  /** the steepest regraded way, and where */
  steepest: { grade: number; id: number; at: { x: number; z: number } }
  /** every way whose heights changed, by id */
  changed: Set<number>
}

const FREEWAY = new Set(['motorway', 'motorway_link', 'trunk', 'trunk_link', 'busway'])
/** how far outside a deck's half-width a way may run and still be on it (a sidewalk hung outboard of the cables) */
const MARGIN = 3
/** …and how far inside the edge of a model's roadway a way brought onto it is put */
const INSET = 0.9
/** …and how far past a declared deck's edge a bulge may go and still be one */
const BULGE = 12
/** how far along a chain of structures from a deck the bake's heights are replaced; beyond it they stand */
export const REACH = 900
/** …and only this far where the deck's end already agrees with the way on it (a deck that lands on its plaza) */
const REACH_AGREED = 60
const AGREES = 0.75
/** a way on the ground comes to a deck's height no steeper than this */
const RAMP_GRADE = 0.05
/** how far the bake ramps the streets at a bridge's end up to it (tools/bridges.ts RAMP) */
const BAKE_RAMP = 60
/** …and how far over the ground a street may stand per metre from a landing, once that ramp is taken out */
const LANDING_GRADE = 0.015
/** …and where there is not the length for that (a ramp that crosses a street just before it lands), this */
const CAP_GRADE = 0.08
/** a way standing this far off the ground is a structure */
const STANDS = 1
/** …and this far, a bridge */
const STANDS_CLEAR = 2.5
/** a regraded junction this far under the ground is put on it */
const BURIED = 0.5
/** what a structure clears where it crosses a street, and a footpath */
const CLEAR = 5
const CLEAR_FOOT = 3
const FOOT = new Set(['footway', 'path', 'steps', 'pedestrian', 'cycleway', 'track', 'bridleway'])

/**
 * A structure: a straight grade from end to end. What OSM calls a bridge or puts above layer 0 — and a SHORT piece
 * of freeway or freeway ramp, which is never a street on the ground: the 5 m of `motorway_link` between two ramp
 * bridges on Yerba Buena. (Not a busway: through the short pieces of the Transbay bus ramp the chain ran on into
 * the Transit Center's bus deck, three storeys up inside the building, and laid it on the ground.)
 */
const SHORT = 100
const SHORT_KINDS = new Set(['motorway', 'motorway_link', 'trunk', 'trunk_link'])
const lengths = new WeakMap<GraphEdge, number>()
const lengthOf = (e: GraphEdge): number => {
  let l = lengths.get(e)
  if (l === undefined) {
    l = 0
    for (let i = 1; i < e.points.length; i++) l += Math.hypot(e.points[i].x - e.points[i - 1].x, e.points[i].z - e.points[i - 1].z)
    lengths.set(e, l)
  }
  return l
}
const structure = (e: GraphEdge): boolean => !e.bore && !e.tunnel
  && (!!e.bridge || (e.layer ?? 0) > 0 || (SHORT_KINDS.has(e.kind ?? '') && lengthOf(e) < SHORT))

/** Where a point of the model's frame is on a deck: how far along it, and how far outside its edge (negative: on it). */
function locate(d: DeckDecl, m: { x: number; z: number }): { along: number; off: number } | null {
  if (d.ring) {
    let inside = false
    for (let i = 0, j = d.ring.length - 1; i < d.ring.length; j = i++) {
      const a = d.ring[i], b = d.ring[j]
      if ((a.z > m.z) !== (b.z > m.z) && m.x < a.x + ((m.z - a.z) * (b.x - a.x)) / (b.z - a.z)) inside = !inside
    }
    return inside ? { along: 0, off: -1 } : null
  }
  if (!d.path) {
    if (m.z < d.from || m.z > d.to) return null
    return { along: m.z, off: Math.abs(m.x - (d.x ?? 0)) - d.half }
  }
  let best: { along: number; dist: number } | null = null
  let acc = 0
  for (let i = 1; i < d.path.length; i++) {
    const a = d.path[i - 1]
    const dx = d.path[i].x - a.x
    const dz = d.path[i].z - a.z
    const len = Math.hypot(dx, dz) || 1e-9
    const t = ((m.x - a.x) * dx + (m.z - a.z) * dz) / (len * len)
    // (off the end of the first or the last piece is off the deck, not at its end)
    if ((t >= 0 || i > 1) && (t <= 1 || i < d.path.length - 1)) {
      const u = Math.max(0, Math.min(1, t))
      const dist = Math.hypot(a.x + dx * u - m.x, a.z + dz * u - m.z)
      if (!best || dist < best.dist) best = { along: acc + u * len, dist }
    }
    acc += len
  }
  if (!best || best.along < d.from || best.along > d.to) return null
  return { along: best.along, off: best.dist - d.half }
}

export class BridgeDecks {
  private readonly list: { p: Placement; d: DeckDecl }[] = []

  add(p: Placement, decks: DeckDecl[]): void { for (const d of decks) this.list.push({ p, d }) }

  get size(): number { return this.list.length }

  /** Is (x, z) on a `vertical` deck (any layer)? Then nothing leaves it by ramp. */
  vertical(x: number, z: number): boolean {
    for (const { p, d } of this.list) {
      if (!d.vertical) continue
      const on = locate(d, toModel(p, { x, z }))
      if (on && on.off <= MARGIN) return true
    }
    return false
  }

  /** Is (x, z) on a `vertical` deck that grades the ways joining it (`DeckDecl.joins`)? `area`: an AREA deck only. */
  joinsAt(x: number, z: number, area = false): boolean {
    for (const { p, d } of this.list) {
      if (!d.vertical || !d.joins || (area && !d.ring)) continue
      const on = locate(d, toModel(p, { x, z }))
      if (on && on.off <= MARGIN) return true
    }
    return false
  }

  /**
   * The deck under a point (in plan) for a way on `layer`, with its height there; null off every deck. `kind`
   * lets a deck that names kinds take a way of that kind (see `DeckDecl.kinds`).
   */
  at(x: number, z: number, layer = 0, kind?: string): { y: number; along: number; off: number; named: boolean; ride: boolean } | null {
    for (const { p, d } of this.list) {
      if (d.layer !== undefined && d.layer !== layer) continue
      if (d.kinds && !(kind !== undefined && d.kinds.includes(kind))) continue
      const on = locate(d, toModel(p, { x, z }))
      if (!on || on.off > MARGIN) continue
      return { y: p.baseY + d.y(on.along) * p.scale, along: on.along, off: on.off, named: !!d.kinds, ride: !!d.ride }
    }
    return null
  }

  /** Is there a deck over this point at all, whatever the layer (no tree grows on one)? */
  covers(x: number, z: number): boolean {
    for (const { p, d } of this.list) {
      const on = locate(d, toModel(p, { x, z }))
      if (on && on.off <= MARGIN) return true
    }
    return false
  }

  /** Is this point on a roadway some model DRAWS (`DeckDecl.model`) — at height `y`, if one is given? */
  drawn(x: number, z: number, y?: number): boolean {
    for (const { p, d } of this.list) {
      if (!d.model) continue
      const on = locate(d, toModel(p, { x, z }))
      if (!on || on.along < d.model.from || on.along > d.model.to || on.off + d.half > d.model.half) continue
      if (y === undefined || Math.abs(p.baseY + d.y(on.along) * p.scale - y) <= 1.5) return true
    }
    return false
  }

  /** The lowest deck over a point that is above `y` (the rider on a lower deck: the ceiling over the camera). */
  above(x: number, z: number, y: number): number | null {
    let best: number | null = null
    for (const { p, d } of this.list) {
      const on = locate(d, toModel(p, { x, z }))
      if (!on || on.off > 0) continue
      const h = p.baseY + d.y(on.along) * p.scale
      if (h > y + 2.5 && (best === null || h < best)) best = h
    }
    return best
  }

  /** a quick test before the per-point work: could any point of this way be on a deck? */
  private near(e: { points: { x: number; z: number }[] }): boolean {
    for (const { p, d } of this.list) {
      const line = d.ring ?? d.path
      const far = line ? Math.max(...line.map((q) => Math.hypot(q.x, q.z))) : Math.max(Math.abs(d.from), Math.abs(d.to))
      const reach = far * p.scale + d.half + 50
      for (const q of e.points) if (Math.abs(q.x - p.cx) < reach && Math.abs(q.z - p.cz) < reach) return true
    }
    return false
  }

  /**
   * A way that swings out past the edge of the roadway a model draws, and comes back, is brought in onto it — the
   * one place the PLAN is touched. OSM's Golden Gate sidewalks bulge 3.5 m round the outside of each tower, as the
   * real ones do on their balconies; the model has no balcony, and the rider went round the tower in the air,
   * through its leg. Only a bulge: a way that leaves the roadway for good (the approach curving off a straight
   * deck) is left where it is, and its own structure is drawn under it (render/city.ts `outsideCovers`).
   * Returns how many points it moved.
   */
  private snap(e: GraphEdge): number {
    if (!(e.bridge || e.ramp || e.raised || (e.layer ?? 0) !== 0) || !this.near(e)) return 0
    let moved = 0
    for (const { p, d } of this.list) {
      if (!d.model || d.path || (d.layer !== undefined && d.layer !== (e.layer ?? 0))) continue
      const cx = d.x ?? 0
      // the way's centre no nearer the slab's edge than this
      const limit = d.model.half - INSET
      const ms = e.points.map((q) => toModel(p, q))
      // (off it: its centre within a hand of the edge, or beyond)
      const edge = d.model.half - 0.3
      // (…and no further out than a balcony goes: a way 30 m off is not on this bridge)
      const inZ = (m: { z: number }): boolean => m.z >= d.model!.from && m.z <= d.model!.to
      const out = ms.map((m) => inZ(m) && Math.abs(m.x - cx) > edge && Math.abs(m.x - cx) <= d.half + BULGE)
      for (let i = 0; i < ms.length; i++) {
        if (!out[i]) continue
        let j = i
        while (j < ms.length && out[j]) j++
        // [i, j) is off the slab: a bulge if the way is on it both before and after
        const on = (k: number): boolean => k >= 0 && k < ms.length && inZ(ms[k]) && Math.abs(ms[k].x - cx) <= edge
        if (on(i - 1) && on(j)) {
          for (let k = i; k < j; k++) {
            const w = toWorld(p, { x: cx + Math.sign(ms[k].x - cx) * limit, z: ms[k].z })
            e.points[k] = { x: Math.round(w.x * 100) / 100, z: Math.round(w.z * 100) / 100 }
            moved++
          }
        }
        i = j
      }
    }
    return moved
  }

  /** the deck's height at each point of a way, or null where it is off every deck (or is not a way decks take) */
  private pins(e: GraphEdge): (number | null)[] | null {
    if (!this.near(e)) return null
    const structure = !!e.bridge || !!e.ramp || !!e.raised || (e.layer ?? 0) !== 0
    let any = false
    const hits = e.points.map((q) => this.at(q.x, q.z, e.layer ?? 0, e.kind))
    // a plain way on layer 0 is on a deck only where the deck names its kind — and only if it ENDS on the deck: a
    // ramp of the same kind that merely crosses the strip passes under it, or over
    const joins = !!hits[0] || !!hits[hits.length - 1]
    const out = hits.map((hit) => {
      if (!hit || (hit.named ? !joins : !structure)) return null
      any = true
      if (hit.ride) e.ridden = true
      return hit.y
    })
    return any ? out : null
  }

  /**
   * Conform a city's ways to the decks (see the top of the file): on a deck, the deck's height; the chain off its
   * ends regraded between the deck, its touchdowns and where it passes out of reach. Mutates `heights` and `ramp`.
   */
  conformGraph(edges: GraphEdge[], ground: (x: number, z: number) => number, reach = REACH): ConformReport {
    const report: ConformReport = { pinned: 0, regraded: 0, flagged: 0, grounded: 0, heldUp: 0, bored: 0, snapped: 0, steepest: { grade: 0, id: 0, at: { x: 0, z: 0 } }, changed: new Set() }
    if (this.list.length === 0) return report
    const at = new Map<number, GraphEdge[]>()
    for (const e of edges) for (const n of [e.a, e.b]) { let l = at.get(n); if (!l) at.set(n, l = []); l.push(e) }
    const cumOf = (e: GraphEdge): number[] => {
      const c = [0]
      for (let i = 1; i < e.points.length; i++) c.push(c[i - 1] + Math.hypot(e.points[i].x - e.points[i - 1].x, e.points[i].z - e.points[i - 1].z))
      return c
    }
    const ownAt = (e: GraphEdge, n: number): number => (e.heights ?? [])[e.a === n ? 0 : e.points.length - 1] ?? ground(e.points[0].x, e.points[0].z)

    // ---- 1. on the decks
    const pins = new Map<GraphEdge, (number | null)[]>()
    /** junctions on a deck, and the deck's height there */
    const deckNode = new Map<number, number>()
    for (const e of edges) {
      if (!e.heights || e.heights.length !== e.points.length || e.bore) continue
      // (an authored way is held where the region put it, every point)
      if (e.fixed) {
        const p = e.heights.slice()
        pins.set(e, p)
        deckNode.set(e.a, p[0])
        deckNode.set(e.b, p[p.length - 1])
        continue
      }
      report.snapped += this.snap(e)
      const p = this.pins(e)
      if (!p) continue
      pins.set(e, p)
      report.pinned++
      if (p[0] !== null) deckNode.set(e.a, p[0])
      if (p[p.length - 1] !== null) deckNode.set(e.b, p[p.length - 1]!)
    }
    if (pins.size === 0) return report
    /*
     * A VERTICAL deck's ways and junctions (`DeckDecl.vertical`) are pinned and left there: dropped from what the
     * chain and the cones start from, so nothing off them is regraded.
     */
    const onVertical = (e: GraphEdge): boolean => {
      const m = e.points[Math.floor(e.points.length / 2)]
      return this.vertical(m.x, m.z)
    }
    const isolated = new Set<GraphEdge>([...pins.keys()].filter(onVertical))
    for (const e of isolated) { deckNode.delete(e.a); deckNode.delete(e.b) }
    /** the bake's heights of the ways on a deck, before the deck's */
    const own = new Map<GraphEdge, number[]>()
    for (const e of pins.keys()) own.set(e, e.heights!.slice())

    // ---- 2. the chain of structures off the decks, and the stretches (runs) to grade
    const cums = new Map<GraphEdge, number[]>()
    const cum = (e: GraphEdge): number[] => { let c = cums.get(e); if (!c) cums.set(e, c = cumOf(e)); return c }
    const usable = (x: GraphEdge): boolean => !!x.heights && x.heights.length === x.points.length && !x.bore
    /** a junction with a way that is not a structure: the chain is known there (the ground, or the bake's ramp) */
    const held = (n: number): GraphEdge | undefined => (deckNode.has(n) ? undefined : (at.get(n) ?? []).find((x) => !structure(x) && !pins.has(x) && usable(x)))
    /** a stretch: points i0..i1 of a way, each end a junction (n) or a height that is known (h) */
    interface Run { e: GraphEdge; i0: number; i1: number; n0: number | null; h0: number; n1: number | null; h1: number; len: number }
    const runs: Run[] = []
    const fixed = new Map<number, number>(deckNode)
    const unknown = new Set<number>()
    /** touchdowns put back on the ground, and the height the bake had lifted each to */
    const landed = new Map<number, number>()
    {
      const dist = new Map<number, number>()
      const frontier: { n: number; d: number }[] = []
      const reachNode = (n: number, d: number): void => { if (d < (dist.get(n) ?? Infinity)) { dist.set(n, d); frontier.push({ n, d }) } }
      /** ways already run end to end */
      const whole = new Set<GraphEdge>()
      /** Leave point `start` of structure `e` (a junction end, or the deck's edge) towards the end at `to`. */
      const leave = (e: GraphEdge, start: number, to: number, d: number, n0: number | null, h0: number): void => {
        const c = cum(e)
        const total = Math.abs(c[to] - c[start])
        const dir = to > start ? 1 : -1
        const want = reach - d
        if (want <= 0) return
        const far = to === 0 ? e.a : e.b
        /*
         * The whole way, however long: a structure is a straight grade from end to end, and one that runs out of
         * reach is held at its far end by the bake's own height there (the search stops at that junction). A way
         * cut short at the reach instead kept a bake's guess from there on — the Bay Bridge's east span dived from
         * Yerba Buena to the water in 600 m and ran the other 2.5 km at sea level.
         */
        runs.push({ e, i0: Math.min(start, to), i1: Math.max(start, to), ...(dir > 0 ? { n0, h0, n1: far, h1: 0 } : { n0: far, h0: 0, n1: n0, h1: h0 }), len: total || 0.01 })
        reachNode(far, d + total)
        if (start === 0 || start === e.points.length - 1) whole.add(e)
      }
      // off each deck's edge, along the structure that was on it
      for (const [e, p] of pins) {
        if (!structure(e) || isolated.has(e)) continue
        const last = p.length - 1
        const first = p.findIndex((v) => v !== null)
        let end = last
        while (p[end] === null) end--
        const from = (i: number): number => (Math.abs(p[i]! - own.get(e)![i]) > AGREES ? 0 : reach - REACH_AGREED)
        if (first > 0) leave(e, first, 0, from(first), null, p[first]!)
        if (end < last) leave(e, end, last, from(end), null, p[end]!)
      }
      // off each junction on a deck
      for (const [n, h] of deckNode) {
        const others = (at.get(n) ?? []).filter((x) => !pins.has(x) && usable(x) && structure(x))
        if (others.length) reachNode(n, Math.max(...others.map((x) => Math.abs(ownAt(x, n) - h))) > AGREES ? 0 : reach - REACH_AGREED)
      }
      const left = new Set<string>()
      while (frontier.length) {
        frontier.sort((p, q) => p.d - q.d)
        const { n, d } = frontier.shift()!
        if (d > (dist.get(n) ?? Infinity)) continue
        if (!deckNode.has(n)) {
          const plain = held(n)
          if (plain) {
            /*
             * A touchdown is ON THE GROUND. The bake lifted the streets a bridge lands on towards the height it
             * guessed for the bridge (tools/bridges.ts: 5.5 m a layer, ramped over 60 m) — Macalla Road stood 9 m up
             * where the Bay Bridge's on-ramp leaves it, on an embankment with retaining walls. So where the way
             * there stands off the ground, the junction is put back on it, and the bake's ramp is taken out of the
             * ways on the ground there (`unramp`, below).
             */
            const own = ownAt(plain, n)
            const q = plain.a === n ? plain.points[0] : plain.points[plain.points.length - 1]
            const g = ground(q.x, q.z)
            // (a junction with an ORDINARY street, that is: one held only by a long stretch of freeway keeps the
            // bake's height — a freeway off the ground is on an embankment of its own)
            const street = (at.get(n) ?? []).some((x) => !structure(x) && !pins.has(x) && usable(x) && !FREEWAY.has(x.kind ?? '') && !FOOT.has(x.kind ?? ''))
            if (street && own > g + STANDS) { fixed.set(n, g); landed.set(n, own) } else fixed.set(n, own)
            continue
          }
          if (d >= reach) { const any = (at.get(n) ?? []).find(usable); if (any) fixed.set(n, ownAt(any, n)); continue }
          unknown.add(n)
        }
        for (const x of at.get(n) ?? []) {
          if (pins.has(x) || !usable(x) || !structure(x) || whole.has(x)) continue
          const fromA = x.a === n
          if (left.has(`${x.id}:${fromA ? 0 : 1}`)) continue
          left.add(`${x.id}:${fromA ? 0 : 1}`)
          if (x.a === x.b) continue
          leave(x, fromA ? 0 : x.points.length - 1, fromA ? x.points.length - 1 : 0, d, n, 0)
        }
      }
      // a junction a run ends on that the search never settled: the bake's height
      for (const r of runs) for (const n of [r.n0, r.n1]) if (n !== null && !fixed.has(n) && !unknown.has(n)) fixed.set(n, ownAt(r.e, n))
    }

    // ---- 3. the straight grades between what is known
    const y = new Map<number, number>()
    const hOf = (n: number | null, h: number): number => (n === null ? h : fixed.get(n) ?? y.get(n) ?? 0)
    const solve = (): void => {
      const touching = new Map<number, Run[]>()
      for (const r of runs) for (const n of [r.n0, r.n1]) if (n !== null && unknown.has(n)) { let l = touching.get(n); if (!l) touching.set(n, l = []); l.push(r) }
      // the unknowns start from the mean of what is known, which the iteration then spreads
      const known = [...fixed.values()]
      const mean = known.reduce((t, v) => t + v, 0) / (known.length || 1)
      for (const n of unknown) if (!y.has(n)) y.set(n, mean)
      // Gauss–Seidel on a few hundred junctions: each takes the mean of its neighbours, weighed by 1/length
      for (let it = 0; it < 20000; it++) {
        let worst = 0
        for (const n of unknown) {
          let sum = 0
          let w = 0
          for (const r of touching.get(n) ?? []) {
            sum += (r.n0 === n ? hOf(r.n1, r.h1) : hOf(r.n0, r.h0)) / r.len
            w += 1 / r.len
          }
          if (w === 0) continue
          const v = sum / w
          worst = Math.max(worst, Math.abs(v - y.get(n)!))
          y.set(n, v)
        }
        if (worst < 1e-4) break
      }
    }
    for (let pass = 0; pass < 12; pass++) {
      solve()
      // a junction a straight grade would bury is on the ground instead
      let buried = 0
      for (const n of [...unknown]) {
        const e = (at.get(n) ?? [])[0]
        const q = e.a === n ? e.points[0] : e.points[e.points.length - 1]
        const g = ground(q.x, q.z)
        if (y.get(n)! < g - BURIED) { unknown.delete(n); fixed.set(n, g); buried++ }
      }
      report.grounded += buried
      if (buried === 0) break
    }

    // ---- 4. the heights, written: the decks, then the structures off them
    for (const [e, p] of pins) {
      const c = cum(e)
      const h = e.heights!
      let k = -1
      for (let i = 0; i < p.length; i++) {
        if (p[i] === null) continue
        // a gap in the declaration between two stretches on the deck: straight across
        if (k >= 0 && i - k > 1) for (let j = k + 1; j < i; j++) h[j] = p[k]! + (p[i]! - p[k]!) * ((c[j] - c[k]) / (c[i] - c[k] || 1))
        h[i] = p[i]!
        k = i
      }
      report.changed.add(e.id)
    }
    const touched = new Set<GraphEdge>()
    const steep = (grade: number, len: number, e: GraphEdge, i: number): void => {
      if (len > 15 && grade > report.steepest.grade) report.steepest = { grade, id: e.id, at: e.points[i] }
    }
    for (const r of runs) {
      const h = r.e.heights!
      const c = cum(r.e)
      const h0 = hOf(r.n0, r.h0)
      const h1 = hOf(r.n1, r.h1)
      for (let i = r.i0; i <= r.i1; i++) {
        const v = h0 + (h1 - h0) * ((c[i] - c[r.i0]) / r.len)
        h[i] = Math.max(v, ground(r.e.points[i].x, r.e.points[i].z))
      }
      touched.add(r.e)
      steep(Math.abs(h1 - h0) / r.len, r.len, r.e, r.i1)
    }

    // ---- 5. the ways on the ground that leave a deck: brought to its height within a cone from it
    /**
     * one cone: from point `start` of `e`, going `dir`, the height `h` there. `up`: a floor only (a way held up
     * where it crosses another: it may be higher, never lower than the cone) — and one that lifts structures and
     * freeways only: it stops at a junction with an ordinary street, which is on the ground whatever crosses nearby.
     */
    const cones: { e: GraphEdge; start: number; dir: 1 | -1; h: number; up?: boolean; cap?: boolean }[] = []
    /** where a floor cone met a junction it could not pass: the way has to come DOWN to it, no steeper than `CAP_GRADE` */
    const caps: typeof cones = []
    for (const [e, p] of pins) {
      if (structure(e) || isolated.has(e)) continue
      const last = p.length - 1
      const first = p.findIndex((v) => v !== null)
      let end = last
      while (p[end] === null) end--
      if (first > 0) cones.push({ e, start: first, dir: -1, h: p[first]! })
      if (end < last) cones.push({ e, start: end, dir: 1, h: p[end]! })
    }
    for (const [n, h] of deckNode) {
      for (const x of at.get(n) ?? []) {
        if (pins.has(x) || !usable(x) || structure(x)) continue
        if (x.a === n) cones.push({ e: x, start: 0, dir: 1, h })
        if (x.b === n) cones.push({ e: x, start: x.points.length - 1, dir: -1, h })
      }
    }
    /*
     * The bake's ramp, taken back out (tools/bridges.ts: from a bridge's end, every road within `BAKE_RAMP` metres
     * lifted towards the bridge's height). Within that reach of a landing, a road stands no higher over the ground
     * than a gentle grade from the landing allows.
     */
    const unramp = (start: number): void => {
      const seen = new Map<number, number>([[start, 0]])
      const queue = [{ n: start, d: 0 }]
      while (queue.length) {
        const { n, d: dist } = queue.shift()!
        for (const e of at.get(n) ?? []) {
          if (pins.has(e) || !usable(e) || structure(e) || e.tunnel || FOOT.has(e.kind ?? '') && e.kind !== 'cycleway') continue
          const c = cum(e)
          const L = c[c.length - 1]
          const fromA = e.a === n
          let moved = false
          for (let i = 0; i < e.points.length; i++) {
            const d = dist + (fromA ? c[i] : L - c[i])
            if (d >= BAKE_RAMP) continue
            const g = ground(e.points[i].x, e.points[i].z)
            // (not by matching the bake's ramp exactly: it eased the junctions afterwards. No higher over the
            // ground than a shallow wedge from the landing allows, within the ramp's reach: at 5% the streets
            // round Macalla Road still stood 3 m up on retaining walls)
            const cap = g + LANDING_GRADE * d
            if (e.heights![i] > cap + 0.01) { e.heights![i] = cap; moved = true }
          }
          if (moved) touched.add(e)
          const other = fromA ? e.b : e.a
          if (dist + L < BAKE_RAMP && (seen.get(other) ?? Infinity) > dist + L) { seen.set(other, dist + L); queue.push({ n: other, d: dist + L }) }
        }
      }
    }
    for (const n of landed.keys()) unramp(n)

    const sweep = (): void => {
      for (const cone of cones) {
        const seen = new Map<number, number>()
        const queue: { e: GraphEdge; start: number; dir: 1 | -1; s: number }[] = [{ e: cone.e, start: cone.start, dir: cone.dir, s: 0 }]
        while (queue.length) {
          const { e, start, dir, s } = queue.shift()!
          const c = cum(e)
          const h = e.heights!
          const last = e.points.length - 1
          let moved = false
          let i = start
          const far = dir > 0 ? e.b : e.a
          const open = !(cone.up || cone.cap) || (at.get(far) ?? []).every((x) => x === e || structure(x) || FREEWAY.has(x.kind ?? ''))
          const pinned = pins.get(e)
          for (; i >= 0 && i <= last; i += dir) {
            // (the deck is the model's: a cone stops at its edge)
            if (pinned && pinned[i] !== null && i !== start) break
            // (a junction the cone may not pass keeps its height: the way comes down to it)
            if (!open && (i === 0 || i === last) && i !== start) {
              if (cone.up && moved) caps.push({ e, start: i, dir: (-dir) as 1 | -1, h: h[i], cap: true })
              i += dir
              break
            }
            const d = s + Math.abs(c[i] - c[start])
            const lo = cone.h - RAMP_GRADE * d
            let v = cone.cap ? Math.min(h[i], cone.h + CAP_GRADE * d)
              : cone.up ? Math.max(lo, h[i]) : Math.min(cone.h + RAMP_GRADE * d, Math.max(lo, h[i]))
            if (!e.tunnel && v < h[i]) v = Math.max(v, Math.min(h[i], ground(e.points[i].x, e.points[i].z)))
            if (Math.abs(v - h[i]) < 0.01) { if (i !== start || s > 0) break; continue }
            h[i] = v
            moved = true
          }
          if (moved) { touched.add(e); steep(RAMP_GRADE, 20, e, Math.max(0, Math.min(last, i - dir))) }
          // through the far junction, if the cone still held the way there
          if ((i >= 0 && i <= last) || !open) continue
          const n = far
          const d = s + Math.abs(c[dir > 0 ? last : 0] - c[start])
          if (deckNode.has(n) || d >= (seen.get(n) ?? Infinity) || d > 2 * reach) continue
          seen.set(n, d)
          for (const x of at.get(n) ?? []) {
            if (x === e || pins.has(x) || !usable(x)) continue
            if (x.a === n) queue.push({ e: x, start: 0, dir: 1, s: d })
            if (x.b === n && x.a !== x.b) queue.push({ e: x, start: x.points.length - 1, dir: -1, s: d })
          }
        }
      }
      cones.length = 0
    }
    sweep()

    /*
     * ---- 6. held up where it crosses: a regraded structure that now passes too low over a way it crosses (an
     * exit ramp drawn straight from the deck to its touchdown skims the street it bridges just before it lands) is
     * lifted to clear it, and comes down either side no steeper than a ramp does — through its touchdown, if the
     * street is that close to it: the way beyond was a ramp on fill all along.
     */
    const crossAt = (p1: { x: number; z: number }, p2: { x: number; z: number }, q1: { x: number; z: number }, q2: { x: number; z: number }): [number, number] | null => {
      const d = (p2.x - p1.x) * (q2.z - q1.z) - (p2.z - p1.z) * (q2.x - q1.x)
      if (Math.abs(d) < 1e-9) return null
      const t = ((q1.x - p1.x) * (q2.z - q1.z) - (q1.z - p1.z) * (q2.x - q1.x)) / d
      const u = ((q1.x - p1.x) * (p2.z - p1.z) - (q1.z - p1.z) * (p2.x - p1.x)) / d
      return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [t, u] : null
    }
    const box = (e: GraphEdge): [number, number, number, number] => {
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const q of e.points) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
      return [x0, x1, z0, z1]
    }
    // (the ways on a deck too, for their stretch off it: the Golden Gate's roadway and sidewalks pass over a path
    // 55 m past the south end of the declared deck)
    const lifted = [...touched].filter((e) => structure(e))
    if (lifted.length) {
      const boxes = lifted.map(box)
      const all: [number, number, number, number] = [Math.min(...boxes.map((b) => b[0])), Math.max(...boxes.map((b) => b[1])), Math.min(...boxes.map((b) => b[2])), Math.max(...boxes.map((b) => b[3]))]
      const under = edges.filter((o) => usable(o) && !o.tunnel && !pins.has(o) && o.points.some((q) => q.x >= all[0] && q.x <= all[1] && q.z >= all[2] && q.z <= all[3]))
      lifted.forEach((e, k) => {
        const b = boxes[k]
        for (const o of under) {
          // what it passes over: a way on a lower layer, or on the ground; not one it meets at a junction
          if (o === e || (o.layer ?? 0) >= (e.layer ?? 0) && structure(o)) continue
          if (o.a === e.a || o.a === e.b || o.b === e.a || o.b === e.b) continue
          if (!o.points.some((q) => q.x >= b[0] - 1 && q.x <= b[1] + 1 && q.z >= b[2] - 1 && q.z <= b[3] + 1)) continue
          // (a cycleway is ridden under it, with the camera 3.5 m up behind the rider)
          const clear = FOOT.has(o.kind ?? '') && o.kind !== 'cycleway' ? CLEAR_FOOT : CLEAR
          for (let i = 1; i < e.points.length; i++) for (let j = 1; j < o.points.length; j++) {
            const hit = crossAt(e.points[i - 1], e.points[i], o.points[j - 1], o.points[j])
            if (!hit) continue
            const ho = o.heights![j - 1] + (o.heights![j] - o.heights![j - 1]) * hit[1]
            const he = e.heights![i - 1] + (e.heights![i] - e.heights![i - 1]) * hit[0]
            // (a way passing UNDER the other is the other's business)
            if (he < ho - 0.5 || he >= ho + clear) continue
            const near = hit[0] < 0.5 ? i - 1 : i
            if (pins.get(e)?.[near] != null) continue
            cones.push({ e, start: near, dir: 1, h: ho + clear, up: true }, { e, start: near, dir: -1, h: ho + clear, up: true })
            report.heldUp++
          }
        }
      })
      sweep()
      cones.push(...caps)
      sweep()
    }

    // ---- 7. the foot ways joining a `joins` vertical deck: from the deck's height at the junction to their far end
    /** each junction where a way on such a deck ends ON it (its pinned end), and the deck's height there */
    const deckEnd = new Map<number, number>()
    const joined = [...isolated].filter((e) => { const m = e.points[Math.floor(e.points.length / 2)]; return this.joinsAt(m.x, m.z) })
    for (const e of joined) {
      const p = pins.get(e)!
      const h = e.heights!
      if (p[0] !== null) deckEnd.set(e.a, h[0])
      if (p[p.length - 1] !== null) deckEnd.set(e.b, h[h.length - 1])
    }
    /** the foot ways that join the deck (graded below) */
    const joining = new Set<GraphEdge>()
    for (const n of deckEnd.keys()) for (const x of at.get(n) ?? []) if (!pins.has(x) && FOOT.has(x.kind ?? '')) joining.add(x)
    /** the height the rest of the network has at junction n — any way there that is not on the deck, not `self`, and not
     * itself one of the ways joining it (whose heights are about to change) */
    const outside = (n: number, self: GraphEdge): number | undefined => {
      for (const o of at.get(n) ?? []) {
        if (o === self || pins.has(o) || joining.has(o) || !usable(o)) continue
        return o.heights![o.a === n ? 0 : o.heights!.length - 1]
      }
      return undefined
    }
    const graded = new Set<GraphEdge>()
    // a way on the deck whose end runs off it: from its last point on the deck to what it meets there
    for (const e of joined) {
      const p = pins.get(e)!
      const h = e.heights!
      const c = cum(e)
      const lastPin = p.length - 1 - [...p].reverse().findIndex((v) => v !== null)
      const firstPin = p.findIndex((v) => v !== null)
      const tail = (from: number, to: number, n: number): void => {
        const hEnd = deckEnd.get(n) ?? outside(n, e)
        if (hEnd === undefined || from === to) return
        const span = Math.abs(c[to] - c[from]) || 1
        const step = to > from ? 1 : -1
        for (let i = from + step; i !== to + step; i += step) h[i] = h[from] + (hEnd - h[from]) * (Math.abs(c[i] - c[from]) / span)
      }
      if (lastPin < p.length - 1) tail(lastPin, p.length - 1, e.b)
      if (firstPin > 0) tail(firstPin, 0, e.a)
    }
    for (const [n, hn] of deckEnd) {
      for (const x of at.get(n) ?? []) {
        if (pins.has(x) || graded.has(x) || touched.has(x) || !usable(x) || x.tunnel || !FOOT.has(x.kind ?? '')) continue
        const h = x.heights!
        const last = h.length - 1
        // (a far end the rest of the network meets is at ITS height; one that meets nothing, on an AREA deck, is on the
        // deck — a walk on the roof mapped at the street's layer; never a flight of steps, which goes somewhere else)
        const far = (i: number, node: number): number => {
          const o = outside(node, x)
          if (o !== undefined) return o
          return x.kind !== 'steps' && this.joinsAt(x.points[i].x, x.points[i].z, true) ? hn : h[i]
        }
        const h0 = x.a === n ? hn : deckEnd.get(x.a) ?? far(0, x.a)
        const h1 = x.b === n ? hn : deckEnd.get(x.b) ?? far(last, x.b)
        if (Math.abs(h0 - h[0]) < 0.05 && Math.abs(h1 - h[last]) < 0.05) continue
        const c = cum(x)
        const len = c[last] || 1
        for (let i = 0; i <= last; i++) h[i] = Math.max(h0 + (h1 - h0) * (c[i] / len), ground(x.points[i].x, x.points[i].z))
        graded.add(x)
        touched.add(x)
        steep(Math.abs(h1 - h0) / len, len, x, last)
      }
    }

    for (const e of pins.keys()) touched.add(e)
    for (const e of touched) {
      if (!pins.has(e)) report.regraded++
      report.changed.add(e.id)
      const h = e.heights!
      let stands = 0
      let sunk = 0
      for (let i = 0; i < h.length; i++) {
        h[i] = Math.round(h[i] * 100) / 100
        const g = ground(e.points[i].x, e.points[i].z)
        stands = Math.max(stands, h[i] - g)
        sunk = Math.max(sunk, g - h[i])
      }
      /*
       * A TUNNEL a deck runs through (the Bay Bridge's two roadways under Yerba Buena Island) is a bore: ridden and
       * drawn as a tunnel (render/tunnels.ts), at the deck's heights — tools/tunnels.ts leaves a motorway's tunnel
       * alone. And a deck's way that comes out of the hill below the ground beside it is in a cut.
       */
      const p = pins.get(e)
      if (e.tunnel) { if (p && p.every((v) => v !== null) && !e.bore) { e.bore = true; report.bored++ } continue }
      if (p && sunk > STANDS && stands < STANDS) e.cut = true
      if (e.bridge) continue
      /*
       * What stands off the ground is a structure, and has to say so: a BRIDGE where it stands well clear (nothing
       * is levelled up to a bridge — src/city/grade.ts would otherwise raise the ground, and every building foot
       * and tree in the corridor, 28 m to the Bay Bridge's approach), a ramp where it is only coming off the ground.
       */
      if (stands > STANDS_CLEAR) { e.bridge = true; report.flagged++ }
      else if (stands > STANDS && !e.ramp) { e.ramp = true; report.flagged++ }
    }
    for (const e of pins.keys()) for (let i = 0; i < e.heights!.length; i++) e.heights![i] = Math.round(e.heights![i] * 100) / 100
    return report
  }
}
