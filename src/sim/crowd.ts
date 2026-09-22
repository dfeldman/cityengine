/**
 * People on the pavement.
 *
 * They are the thing that turns a street from architecture into a place, and they are cheap: a walker is a
 * position along an edge, a side, and a phase in a walk cycle. Same lifecycle as the traffic — spawned on
 * streets as they come into range, retired as they leave — so the count follows what is on screen.
 *
 * Two details earn their keep. **They walk on the pavement, not on the centre line**, offset by half the
 * carriageway plus half the footway, which is what makes a street read as having sides. And **they vary in
 * speed and size**: a crowd where everyone is the same height moving at the same pace reads as a marching
 * band.
 *
 * And **they are not all alone** (user, 2026-09-21): a solo walker is the exception — people go about in
 * couples, families and pairs of colleagues. A group is spawned together and walks together: its first member
 * walks the streets and the rest keep station beside (or, on a narrow pavement, behind) them. **Nobody walks
 * through anybody**: on each pavement, a group meeting another coming the other way sidesteps to its own
 * right, one catching up with a slower group passes on the outside or, with no room, falls in behind. And
 * **some are exercising**: runners on the pavements in athletic kit, cyclists in the road on the right.
 */
import { distance, type Point } from '../city/geo.ts'
import { exits, type CityGraph, type Edge } from '../city/graph.ts'
import { pointAlong } from './navigate.ts'
import { profileAt } from '../city/terrain.ts'

export interface Walker {
  /**
   * Who this is, for as long as they exist. NOT their position in the crowd's array: walkers are added
   * and retired every frame as the rider moves, and anything that remembered a walker by index was
   * silently handed a different person each time the array shifted — which is how a stranger's avatar-kit
   * body kept jumping to somebody else mid-stride.
   */
  id: number
  edgeId: number
  s: number
  dir: 1 | -1
  /** which pavement: +1 one side, −1 the other */
  side: 1 | -1
  speed: number
  height: number
  /** walk-cycle phase in radians */
  phase: number
  shirt: [number, number, number]
  trousers: [number, number, number]
  skin: [number, number, number]
  hair: [number, number, number]
  /**
   * The same four colours as hex, for the avatar-kit body this walker is given when they come close.
   * One look, two renderings: a walker who changes from a box into a real body keeps their clothes, their
   * skin and their hair, so the change reads as more detail rather than as a different person.
   */
  look: { skin: string; hair: string; top: string; bottom: string }
  at: Point
  heading: number
  /** height, on a raised edge (a bridge's pavement); absent means "on the ground" */
  y?: number
  /** walking, out for a run (athletic kit, running gait), or cycling in the road */
  kind: 'walk' | 'run' | 'cycle'
  /** the walker this one walks with (a group follows its first member), absent for the first/only one */
  leader?: number
  /** within a group: metres behind the leader (single file) and across (abreast) */
  back: number
  across: number
  /** the sidestep being made round somebody, metres across the pavement, eased */
  dodge: number
}

export interface CrowdConfig { perKm: number; range: number }

export const CROWD: Record<'none' | 'some' | 'busy' | 'crowded', CrowdConfig> = {
  none: { perKm: 0, range: 0 },
  some: { perKm: 26, range: 150 },
  busy: { perKm: 58, range: 165 },
  // a Saturday in the Marais: thousands out at once, the far ones as boxes
  crowded: { perKm: 95, range: 260 },
}

// the avatar kit's own palettes (a subset: natural hair, wearable clothes), so both renderings can use them
const SKIN = ['#ffe3d3', '#fdd3bb', '#f3c3a2', '#e9b08b', '#dc9c70', '#c98657',
  '#b06f43', '#935933', '#784528', '#5e341e', '#472616']
const HAIR = ['#16110e', '#2e1f17', '#4b3122', '#704628', '#94421f', '#d8a346', '#ecd394', '#8e8b88', '#e9e7e4']
/*
 * What a city street wears (BUGS.md #13, user: more recolouring): mostly the everyday colours — navy, black,
 * charcoal, grey, white, cream, camel, olive, burgundy, denim — and a quarter bright, rather than the primary
 * colours of a toy box. Each person's also shaded a little (`jitter`), so two strangers in the same garment
 * and the same colour are still not the same.
 */
const TOPS = ['#1c2541', '#101114', '#2b2d31', '#4a4e57', '#8a8f98', '#f2f0ea', '#e8e0cf', '#c8a97e', '#a47148',
  '#5b5f3a', '#6b2737', '#7a1f2b', '#3e5c76', '#6f8faf', '#b9c7d6', '#d9c3a5', '#3b3a36', '#556b2f',
  '#1f6bff', '#e03131', '#ffd42a', '#12a874', '#e5157f', '#f59e0b', '#22c7ee', '#7c3aed']
const BOTTOMS = ['#111111', '#1f2937', '#263066', '#0d1233', '#3b4a63', '#5a6f8f', '#6b7280', '#c8b596', '#8b5a2b',
  '#4b4f3a', '#2e2a26', '#d0d4e0']
/** a little darker or lighter, per person */
const jitter = (r: () => number, hex: string): string => {
  const k = 0.84 + r() * 0.3
  const c = (i: number): string => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k))).toString(16).padStart(2, '0')
  return `#${c(1)}${c(3)}${c(5)}`
}

const rgb = (hex: string): [number, number, number] =>
  [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255]
const pick = <T>(r: () => number, a: readonly T[]): T => a[Math.floor(r() * a.length)]

let nextWalkerId = 1
/** after the first frame, walkers are only created further away than people are drawn (crowd-baked.ts) */
const SPAWN_BEYOND = 120

function rng(seed: number): () => number {
  let a = (seed ^ 0x2545f491) >>> 0
  return () => {
    a = (a + 0x9e3779b9) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Crowd {
  private readonly g: CityGraph
  private readonly cfg: CrowdConfig
  private readonly walkers: Walker[] = []
  private readonly populated = new Set<number>()
  /** this frame's sidestep and pace for each group leader (see `update`) */
  private readonly goals = new Map<number, { dodge: number; speed: number }>()

  /** which edges cross water, worked out once per edge; see `bridge` */
  private readonly overWater = new Map<number, boolean>()
  private readonly water: { ring: Point[]; holes: Point[][]; x0: number; x1: number; z0: number; z1: number }[] = []

  /** Water, so a street that crosses it is known to be a bridge. */
  setWater(rings: (Point[] | { ring: Point[]; holes: Point[][] })[]): void {
    for (const item of rings) {
      // an island is a hole in the river: land, where people walk
      const ring = Array.isArray(item) ? item : item.ring
      const holes = Array.isArray(item) ? [] : item.holes
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
      this.water.push({ ring, holes, x0, x1, z0, z1 })
    }
    this.overWater.clear()
  }

  private bridge(e: Edge): boolean {
    let v = this.overWater.get(e.id)
    if (v !== undefined) return v
    const mid = pointAlong(e.points, e.length / 2)
    v = this.water.some((w) => mid.x >= w.x0 && mid.x <= w.x1 && mid.z >= w.z0 && mid.z <= w.z1 && inside(w.ring, mid.x, mid.z) && !w.holes.some((h) => inside(h, mid.x, mid.z)))
    this.overWater.set(e.id, v)
    return v
  }

  constructor(graph: CityGraph, level: keyof typeof CROWD = 'some') {
    this.g = graph
    this.cfg = CROWD[level]
  }

  /**
   * Does this path run mostly over water? OSM's quayside footways — the Bassin de l'Arsenal's lower quay,
   * the Seine's banks — often lie on or just inside the water's own outline, and walkers follow the centre
   * line, so a crowd on them walked on the water (user report). The midpoint test in `bridge` missed them,
   * and walkers reached them anyway by walking on from the next edge; this samples the whole length and is
   * part of `walkable`, which the choice of where to walk next also asks.
   */
  private wet(e: Edge): boolean {
    if (this.water.length === 0 || e.bridge) return false
    let wet = 0
    let n = 0
    for (let s = 0; s <= e.length; s += Math.max(2, e.length / 12)) {
      const p = pointAlong(e.points, s)
      n++
      if (this.water.some((w) => p.x >= w.x0 && p.x <= w.x1 && p.z >= w.z0 && p.z <= w.z1 && inside(w.ring, p.x, p.z) && !w.holes.some((h) => inside(h, p.x, p.z)))) wet++
    }
    return n > 0 && wet / n > 0.4
  }

  get all(): readonly Walker[] { return this.walkers }

  /**
   * Somewhere people walk ALONG. Not a crossing — OSM draws a zebra as its own 8–12 m footway straight across
   * the carriageway, and walkers put on one paced back and forth across the road, through the rider, for ever
   * (IMPROVEMENTS §1.6). Not a short footway with a road at both ends either: that is a crossing nobody
   * tagged. Not a road whose pavement is too narrow to walk. Park paths and pedestrian streets keep their people.
   */
  walkable(e: Edge): boolean {
    let v = this.walkableCache.get(e.id)
    if (v !== undefined) return v
    v = !e.crossing && !(e.foot && this.wet(e)) && (e.foot
      ? !(e.length < 15 && this.touchesRoad(e.a, e.id) && this.touchesRoad(e.b, e.id)) && !this.overRoad(e)
      : e.walk >= 1.2)
    this.walkableCache.set(e.id, v)
    return v
  }
  private readonly walkableCache = new Map<number, boolean>()
  /** road edges bucketed by 50 m cell, built the first time a footway is asked about */
  private roadGrid: Map<string, Edge[]> | null = null

  /**
   * A footway that lies on a carriageway anywhere along it: a crossing drawn diagonally, or a sidewalk
   * mapped as its own way where the street's width puts the road over it. Walking it puts people on the road.
   */
  private overRoad(e: Edge): boolean {
    if (!this.roadGrid) {
      this.roadGrid = new Map()
      for (const r of this.g.edges.values()) {
        if (r.foot) continue
        const seen = new Set<string>()
        for (let s = 0; s <= r.length; s += 25) {
          const p = pointAlong(r.points, s)
          const k = `${Math.floor(p.x / 50)},${Math.floor(p.z / 50)}`
          if (seen.has(k)) continue
          seen.add(k)
          let list = this.roadGrid.get(k)
          if (!list) this.roadGrid.set(k, (list = []))
          list.push(r)
        }
      }
    }
    for (let s = 0; s <= e.length; s += Math.max(1, e.length / 8)) {
      const p = pointAlong(e.points, s)
      const cx = Math.floor(p.x / 50)
      const cz = Math.floor(p.z / 50)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          for (const r of this.roadGrid.get(`${cx + dx},${cz + dz}`) ?? []) {
            if (distanceToLine(r.points, p) < r.width / 2 - 0.3) return true
          }
        }
      }
    }
    return false
  }

  private touchesRoad(nodeId: number, except: number): boolean {
    const n = this.g.nodes.get(nodeId)
    return !!n && n.edges.some((id) => id !== except && !this.g.edges.get(id)!.foot)
  }
  private generation = 0

  /**
   * At the end of an edge a walker carries on along the street — onto the exit closest to straight on,
   * within 35°, that people walk along — rather than turning round. Turning round at the end of every
   * short edge made people pace a few metres of pavement like sentries, and on a crossing it walked them
   * across the road. Only with nowhere to go on do they turn back.
   */
  private carryOn(w: Walker, e: Edge): void {
    const atB = w.s > e.length
    const over = atB ? w.s - e.length : -w.s
    const node = atB ? e.b : e.a
    const xs = exits(this.g, node, e.id).filter((x) => {
      const ne = this.g.edges.get(x.edgeId)!
      return w.kind === 'cycle' ? !ne.foot && ne.width >= 2.8 && !ne.crossing : this.walkable(ne)
    })
    const next = xs.length > 0 && Math.abs(xs[0].angle) < (35 * Math.PI) / 180 ? xs[0] : null
    if (!next) {
      w.dir = (-w.dir) as 1 | -1
      w.s = Math.max(0, Math.min(e.length, w.s))
      return
    }
    const ne = this.g.edges.get(next.edgeId)!
    const dir: 1 | -1 = ne.a === node ? 1 : -1
    /*
     * `side` is relative to the street's stored direction (a→b), so it survives turning round on one edge.
     * Onto a NEW edge it must keep the same side relative to the WALKER: entering the next edge against its
     * stored direction flips which way a→b points, so the side flips with it — or they would step across
     * the street at every junction.
     */
    w.side = (w.side * w.dir * dir) as 1 | -1
    w.dir = dir
    w.edgeId = ne.id
    w.s = dir > 0 ? Math.min(ne.length, over) : Math.max(0, ne.length - over)
    this.populated.add(ne.id)
  }
  private first = true

  update(dt: number, rider: Point, edgesNear: Iterable<Edge>): void {
    if (this.cfg.perKm === 0) return

    for (const e of edgesNear) {
      if (this.populated.has(e.id)) continue
      if (!this.walkable(e)) continue   // a crossing, or a lane with no real pavement, has nobody on it
      this.populated.add(e.id)
      /*
       * Nobody on a footway over water. OSM maps a bridge's sidewalks as separate ways, and where they are
       * does not reliably match the deck that is drawn — people walking them stood on the river beside the
       * bridge. The deck's own edges (a road over water, see `bridge`) are where a bridge's people walk.
       */
      if (e.foot && this.bridge(e)) continue
      const mid = e.points[Math.floor(e.points.length / 2)]
      if (distance(mid, rider) > this.cfg.range) { this.populated.delete(e.id); continue }

      // a different draw each time the street is populated: the same seed twice gave exact clones
      const r = rng(e.id ^ 0x51ed270b ^ Math.imul(++this.generation, 0x9e3779b9))
      const want = (e.length / 1000) * this.cfg.perKm
      let n = Math.floor(want)
      if (r() < want - n) n++
      for (let i = 0; i < n; i++) {
        const dir: 1 | -1 = r() < 0.5 ? 1 : -1
        /*
         * Out of sight. Once the ride is under way nobody is created where the rider can see them — only
         * beyond the distance people are drawn at — so a street fills from its far end rather than people
         * materialising on the pavement ahead. The very first population, at load, may go anywhere.
         */
        let s0 = r() * e.length
        if (!this.first) {
          let tries = 0
          while (tries < 8 && distance(pointAlong(e.points, s0), rider) < SPAWN_BEYOND) { s0 = r() * e.length; tries++ }
          if (tries === 8) continue
        }
        const side = (r() < 0.75 ? dir : (-dir as 1 | -1)) as 1 | -1
        const roll = r()
        const road = !e.foot && e.width >= 2.8 && !e.crossing
        const base = { edgeId: e.id, s: s0, dir, at: { x: 0, z: 0 }, heading: 0, back: 0, across: 0, dodge: 0 }
        if (road && roll < 0.15) {
          // a cyclist, in the road on their right (side = dir), at a town pace
          this.walkers.push({ ...base, id: nextWalkerId++, side: dir, kind: 'cycle', speed: 4 + r() * 2.5,
            height: 0.95 + r() * 0.15, phase: r() * Math.PI * 2, ...dressed(r, true) })
          continue
        }
        if (roll < 0.24) {
          // a runner, alone, in athletic kit
          this.walkers.push({ ...base, id: nextWalkerId++, side, kind: 'run', speed: 2.6 + r() * 0.9,
            height: 0.95 + r() * 0.15, phase: r() * Math.PI * 2, ...dressed(r, true) })
          continue
        }
        // a group: alone a quarter of the time, a couple most often, then threes and fours (a family)
        const g = r()
        const size = g < 0.25 ? 1 : g < 0.7 ? 2 : g < 0.9 ? 3 : 4
        const pace = 1.0 + r() * 0.4
        // abreast where the pavement takes it, else one behind another
        const abreast = e.foot ? e.width >= 2.2 : e.walk >= 2.2
        const leader = nextWalkerId
        for (let k = 0; k < size; k++) {
          const child = size >= 3 && k === size - 1
          this.walkers.push({
            ...base, id: nextWalkerId++, side, kind: 'walk',
            speed: pace,
            height: child ? 0.62 + r() * 0.1 : 0.9 + r() * 0.22,
            phase: r() * Math.PI * 2,
            ...dressed(r),
            ...(k > 0 ? { leader } : {}),
            back: abreast ? (r() - 0.5) * 0.3 : k * 0.9,
            across: abreast ? (k - (size - 1) / 2) * 0.62 : 0,
          })
        }
      }
    }

    // ---- who is near whom: the leaders (a group moves as its leader) by pavement, for the sidesteps
    const byId = new Map<number, Walker>()
    for (const w of this.walkers) byId.set(w.id, w)
    const lanes = new Map<string, Walker[]>()
    for (const w of this.walkers) {
      if (w.leader !== undefined && byId.has(w.leader)) continue
      const k = `${w.edgeId}|${w.kind === 'cycle' ? 'road' : w.side}`
      const list = lanes.get(k)
      if (list) list.push(w)
      else lanes.set(k, [w])
    }
    const width = new Map<number, number>()      // a group's half-width across
    for (const w of this.walkers) {
      const lid = w.leader !== undefined && byId.has(w.leader) ? w.leader : w.id
      width.set(lid, Math.max(width.get(lid) ?? 0.3, Math.abs(w.across) + 0.3))
    }
    for (const list of lanes.values()) {
      if (list.length < 2) { for (const w of list) this.goals.set(w.id, { dodge: 0, speed: w.speed }); continue }
      for (const w of list) {
        let dodge = 0
        let speed = w.speed
        const hw = width.get(w.id) ?? 0.3
        for (const o of list) {
          if (o === w) continue
          // ahead of w, along w's own direction, and close
          const gap = (o.s - w.s) * w.dir
          if (gap <= 0 || gap > 5) continue
          const room = hw + (width.get(o.id) ?? 0.3) + 0.25
          const across = Math.abs(o.dodge - w.dodge)
          if (o.dir !== w.dir) {
            // oncoming: step to one's own right (in street terms: −dir), enough to clear them
            dodge = -w.dir * room * 0.55
          } else if (w.speed > o.speed + 0.1) {
            // catching up: pass on the outside if there is room, else fall in behind at their pace
            if (gap < 2.5 && across < room) speed = Math.min(speed, o.speed)
            dodge = w.dir * room * 0.6
          }
        }
        this.goals.set(w.id, { dodge, speed })
      }
    }

    const gone = new Set<number>()
    for (let i = this.walkers.length - 1; i >= 0; i--) {
      const w = this.walkers[i]
      const e = this.g.edges.get(w.edgeId)
      if (!e) { this.walkers.splice(i, 1); continue }

      const lead = w.leader !== undefined ? byId.get(w.leader) : undefined
      if (lead) {
        // keeping station with the leader: their street, their direction and pavement, a step behind or beside
        const le = this.g.edges.get(lead.edgeId)
        if (!le) { this.walkers.splice(i, 1); continue }
        w.edgeId = lead.edgeId
        w.dir = lead.dir
        w.side = lead.side
        w.s = Math.max(0, Math.min(le.length, lead.s - lead.dir * w.back))
        w.dodge = lead.dodge
        w.phase += dt * lead.speed * 4.4
      } else {
        const goal = this.goals.get(w.id) ?? { dodge: 0, speed: w.speed }
        // eased: a sidestep over about a second, not a jump
        w.dodge += Math.max(-dt * 0.8, Math.min(dt * 0.8, goal.dodge - w.dodge))
        w.s += w.dir * goal.speed * dt
        // the legs swing at a rate that suits the speed, or the walk looks like skating; a runner's faster
        w.phase += dt * goal.speed * (w.kind === 'run' ? 3.2 : w.kind === 'cycle' ? 1.6 : 4.4)
        if (w.s < 0 || w.s > e.length) this.carryOn(w, e)
      }
      // they may have walked onto the next street; that street is theirs now, and so is its geometry
      const eNow = this.g.edges.get(w.edgeId)!

      const p = pointAlong(eNow.points, w.s)
      /*
       * The street's own direction here, a→b, from a short chord that stays on the edge at both ends.
       * Everything below is measured from it rather than from the direction of travel. Measured from travel
       * it went wrong twice: a walker going b→a was given the heading of the chord REVERSED again, and so
       * walked backwards (half the crowd), and the pavement offset flipped sides whenever a walker turned
       * round at the end of an edge, so they jumped across the street.
       */
      const s0 = Math.max(0, Math.min(eNow.length - 1.2, w.s - 0.6))
      const a = pointAlong(eNow.points, s0)
      const b = pointAlong(eNow.points, Math.min(eNow.length, s0 + 1.2))
      let dx = b.x - a.x
      let dz = b.z - a.z
      const len = Math.hypot(dx, dz) || 1
      dx /= len
      dz /= len
      w.heading = w.dir > 0 ? Math.atan2(dx, dz) : Math.atan2(-dx, -dz)
      /*
       * On a bridge, the pavement is the edge of the deck, not a strip beyond the carriageway: offset to
       * where a pavement would be, walkers on the Pont Marie stood on the Seine beside it. On a footpath
       * they walk down the middle of it; on a street, out on the pavement.
       */
      const lane = w.kind === 'cycle' ? Math.max(0.7, eNow.width / 2 - 0.9)
        : eNow.foot ? 0
        : this.bridge(eNow) ? Math.max(0.6, eNow.width / 2 - 0.5) : eNow.width / 2 + eNow.walk * 0.5
      // the group's formation and the sidestep, kept inside the pavement (or the path)
      const halfWalk = w.kind === 'cycle' ? 0.4 : eNow.foot ? Math.max(0.3, eNow.width / 2 - 0.3) : Math.max(0.2, eNow.walk / 2 - 0.25)
      const off = Math.max(-halfWalk, Math.min(halfWalk, w.dodge + w.across * w.dir))
      // onto the pavement: `side` is relative to the STREET, so it does not change when they turn round
      const l = lane * w.side + off
      w.at = { x: p.x - dz * l, z: p.z + dx * l }
      // on a bridge, the pavement is 0.15 m above the deck's own height (render/bridges.ts)
      w.y = eNow.raised ? profileAt(eNow.points, eNow.heights, w.s).y + (eNow.foot ? 0.05 : 0.15) : undefined

      /*
       * A street's people leave with the STREET, all together, once it is well out of range — never one by
       * one. Retiring a single walker used to mark the whole street unpopulated, and it was then populated
       * again next frame on top of everybody still on it: on the long Brooklyn Bridge Promenade that
       * stacked copy after copy into a solid column of people.
       */
      const mid = eNow.points[Math.floor(eNow.points.length / 2)]
      if (distance(mid, rider) > this.cfg.range * 1.4) {
        this.walkers.splice(i, 1)
        gone.add(eNow.id)
      }
    }
    for (const id of gone) this.populated.delete(id)
    this.first = false
  }
}

/** One person's colours, in both forms. */
const SPORT_TOPS = ['#1f6bff', '#22c7ee', '#e03131', '#e5157f', '#ffd42a', '#12a874', '#ffffff', '#111111']
const SPORT_BOTTOMS = ['#111111', '#1f2937', '#263066']

function dressed(r: () => number, sport = false): Pick<Walker, 'shirt' | 'trousers' | 'skin' | 'hair' | 'look'> {
  const look = { skin: pick(r, SKIN), hair: pick(r, HAIR), top: jitter(r, pick(r, sport ? SPORT_TOPS : TOPS)),
    bottom: jitter(r, pick(r, sport ? SPORT_BOTTOMS : BOTTOMS)) }
  return { look, skin: rgb(look.skin), hair: rgb(look.hair), shirt: rgb(look.top), trousers: rgb(look.bottom) }
}

function distanceToLine(points: Point[], p: Point): number {
  let best = Infinity
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const q = points[i]
    const dx = q.x - a.x
    const dz = q.z - a.z
    const l2 = dx * dx + dz * dz || 1
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2))
    best = Math.min(best, Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t))
  }
  return best
}

function inside(ring: Point[], x: number, z: number): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) hit = !hit
  }
  return hit
}

