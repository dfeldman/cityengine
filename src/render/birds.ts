/**
 * Scenery birds on the ground — pigeons, wood pigeons, doves, crows, ravens, magpies, blackbirds, starlings, gulls and
 * sparrows — from birdkit (assetkit/birdkit): one parametric bird, its size, colouring and habits set per species,
 * drawn as thin instances. (The unique-looking birds — peacocks, swans, geese — are models: render/zoo.ts.)
 *
 * They are not common: the city is cut into CELL-metre squares and each one, by its own seeded dice, may hold one
 * small flock — so a rider meets a cluster every few minutes. Where it sits decides who it is (WEIGHTS): a street's
 * pavement, a park's path or lawn, or within WATERSIDE of the water.
 *
 * A flock keeps to its own ground: a street flock to the pavement band of its street (both sides), a park flock to
 * dry land clear of the roads and the buildings. Its perches are the bake's trees and the nearest buildings' eaves.
 * The rider is the threat: ridden through, they flutter up into a tree or onto an eave, or a few metres along the
 * ground, and come back down once it has gone (birdkit's behaviour). Real flight is the sky birds' business.
 */
import type { Scene } from '@babylonjs/core/scene'
import { BirdDrawer, Flock, PRESETS, rng, type BirdSpec, type BirdWorld, type Spot } from 'birdkit'
import type { PackedBuilding, PackedEdge } from '../city/package.ts'
import { unpackPoints } from '../city/package.ts'
import type { Terrain } from '../city/terrain.ts'
import { PEOPLE } from './layers.ts'
import { Projection, type LatLon } from '../city/geo.ts'

/** the city's squares, each with at most one flock (m) */
const CELL = 160
/** the chance a square has birds, by the zone of the first spot found; and how many flocks then. Town is sparse
 *  (a cluster every few minutes); natural areas are dense (owner, 2026-11-23: "natural areas should be pretty bird dense") */
const CHANCE: Record<Site, number> = { street: 0.28, park: 0.45, water: 0.5, forest: 0.9, scrub: 0.85, coast: 0.85 }
const FLOCKS: Record<Site, [number, number]> = { street: [1, 1], park: [1, 1], water: [1, 2], forest: [2, 4], scrub: [2, 4], coast: [2, 3] }
/** squares within this of the rider are decided and their flocks moved; beyond FORGET they are dropped (m) */
const ACTIVE = 150
const FORGET = 420
/** birds are drawn out to DRAW, growing in over the last GROW (m) */
const DRAW = 95
const GROW = 12
/** a street needs a pavement at least this wide (m) to have birds on it */
const MIN_WALK = 1.4
/** a pavement flock keeps this far off the kerb and this far from the walls (m) */
const KERB = 0.35
const WALL = 0.4
/** a flock keeps within this of where it was put (m), fleeing included */
const RANGE = 28
/** a park flock keeps this far clear of a carriageway's edge (m) */
const ROAD_CLEAR = 2.5
/** the water this near makes a site waterside (m), sampled in WATER_RAYS directions */
const WATERSIDE = 70
const WATER_RAYS = 8
/** perches: trees within this of the flock, birds sit at this share of the tree's height and this far out from the
 *  trunk; eaves no taller than ROOF_MAX (m) */
const TREE_UP: [number, number] = [0.5, 0.85]
const TREE_OUT: [number, number] = [0.6, 2.2]
const ROOF_MAX = 32
/**
 * Birds that live in a few known places, not across a zone: hand-placed colonies, each a centre, a radius and how many
 * flocks. The wild parrots of San Francisco (red-masked parakeets) keep to Telegraph Hill's gardens and the Filbert
 * and Greenwich Steps, the Embarcadero's palms by the Ferry Building, and Fort Mason; they are in the treetops far more
 * than on the ground (birdkit's `redMasked` habits).
 */
interface Colony { region: string; at: LatLon; r: number; kind: BirdSpec; flocks: [number, number] }
const COLONIES: Colony[] = [
  { region: 'san-francisco', at: { lat: 37.8022, lon: -122.4056 }, r: 140, kind: PRESETS.redMasked, flocks: [2, 3] },
  { region: 'san-francisco', at: { lat: 37.7957, lon: -122.3935 }, r: 120, kind: PRESETS.redMasked, flocks: [1, 2] },
  { region: 'san-francisco', at: { lat: 37.8058, lon: -122.4308 }, r: 150, kind: PRESETS.redMasked, flocks: [1, 2] },
]
/** spots tried for each colony flock */
const COLONY_TRIES = 30
/** and how far from the trunk, for a tree-dweller (m) */
const COLONY_TREE: [number, number] = [2, 7]
/** a way this far off the ground (m) is a bridge: no birds on it */
const BRIDGE_OFF = 1.5
/** tries at finding a site in a square */
const SITE_TRIES = 16
/**
 * Who lives where: relative weights by region and site, from the city bird counts (2026-11-23). Paris: the Louvre's
 * survey ranks feral pigeon, wood pigeon, house sparrow, blackbird; the LPO's 196-site sparrow census shows the
 * sparrow's fall has levelled off; carrion crows and magpies are everyday birds, black-headed gulls own the quays.
 * San Francisco: rock pigeons downtown, American crows everywhere, Brewer's blackbirds and starlings in flocks on
 * plazas and lawns, western gulls dominant on the shore and the big lawns, ravens on the Presidio and headland edges.
 * (SF's weights are field knowledge, not counts: eBird's US-CA-075 bar chart would firm them up.)
 */
/**
 * Zones: a street's pavement; a town park's path (a way not in open country); the waterside; and open country (the
 * bake's `park` ways: the Bois, the Presidio, the headlands) split by the ground under it — woods are 'forest', grass
 * (OSM's scrub and grassland too) is 'scrub', sand and bare rock by the sea are 'coast'. Pigeons are town birds only.
 */
type Site = 'street' | 'park' | 'water' | 'forest' | 'scrub' | 'coast'
type Kind = 'pigeon' | 'woodPigeon' | 'dove' | 'mourningDove' | 'crow' | 'raven' | 'magpie' | 'jackdaw' | 'blackbird' | 'brewers' | 'starling' | 'gull' | 'gullWestern' | 'bhGull' | 'sparrow'
  | 'houseFinch' | 'americanRobin' | 'junco' | 'whiteCrowned' | 'chaffinch' | 'greatTit' | 'robin' | 'scrubJay' | 'jay' | 'parakeet' | 'blackPhoebe'
  | 'heron' | 'greatEgret' | 'snowyEgret' | 'cormorant'
const WEIGHTS: Record<'paris' | 'san-francisco', Partial<Record<Site, Partial<Record<Kind, number>>>>> = {
  paris: {
    street: { pigeon: 6, sparrow: 3, woodPigeon: 2.5, blackbird: 2, crow: 2, magpie: 1.5, dove: 1, starling: 1, jackdaw: 0.5, parakeet: 0.3, chaffinch: 0.3, bhGull: 0.3, greatTit: 0.2, gull: 0.2 },
    park: { woodPigeon: 5, crow: 3.5, blackbird: 3, magpie: 2.5, pigeon: 1, sparrow: 1.5, chaffinch: 1.2, starling: 1, dove: 1, jackdaw: 1, greatTit: 1, robin: 1, parakeet: 1, jay: 0.8 },
    water: { pigeon: 5, bhGull: 3, crow: 2.5, woodPigeon: 2, gull: 1.5, sparrow: 1.5, cormorant: 1, heron: 0.8, jackdaw: 0.5 },
    // the Bois de Boulogne and de Vincennes, Meudon, Saint-Cloud
    forest: { woodPigeon: 5, chaffinch: 3, blackbird: 3, crow: 3, jay: 2.5, robin: 2.5, greatTit: 2.5, magpie: 1.5, parakeet: 1, starling: 0.5 },
    scrub: { crow: 3, magpie: 3, woodPigeon: 3, starling: 2, blackbird: 1.5, jackdaw: 1, chaffinch: 1 },
  },
  'san-francisco': {
    street: { pigeon: 6, crow: 2.5, sparrow: 2, houseFinch: 2, brewers: 2, starling: 2, mourningDove: 1, gullWestern: 1, whiteCrowned: 0.8, scrubJay: 0.8, junco: 0.5, americanRobin: 0.5, blackPhoebe: 0.4 },
    park: { crow: 4, brewers: 3, gullWestern: 2.5, sparrow: 1.5, mourningDove: 1.5, raven: 1.5, starling: 1.5, americanRobin: 1.5, scrubJay: 1.5, junco: 1.2, whiteCrowned: 1.2, houseFinch: 1, pigeon: 0.5, blackPhoebe: 0.6 },
    water: { gullWestern: 7, pigeon: 3, crow: 2, cormorant: 1.5, raven: 1.5, brewers: 1, greatEgret: 0.6, snowyEgret: 0.5, heron: 0.3, blackPhoebe: 0.3 },
    // the Presidio's cypress and eucalyptus, Golden Gate Park's woods, Sutro
    forest: { scrubJay: 3, junco: 3, americanRobin: 2.5, crow: 2.5, raven: 1.5, whiteCrowned: 1.5, mourningDove: 1, blackPhoebe: 0.5 },
    // the Presidio's and Twin Peaks' scrub and grassland, the Marin headlands
    scrub: { whiteCrowned: 4, raven: 2.5, junco: 2, crow: 2, scrubJay: 2, mourningDove: 1, americanRobin: 1, brewers: 1, starling: 1 },
    // Ocean Beach, Baker Beach, Lands End's cliffs, the headland bluffs
    coast: { gullWestern: 6, raven: 2.5, cormorant: 2, crow: 1, snowyEgret: 0.5, blackPhoebe: 0.5 },
  },
}
/** each kind's plumages, a bird each: a pigeon flock is mixed, cocks and hens go together; gulls hooded in summer */
const VARIANTS: Record<Kind, [BirdSpec, number][]> = {
  pigeon: [[PRESETS.pigeon, 0.55], [PRESETS.pigeonChecker, 0.25], [PRESETS.pigeonDark, 0.1], [PRESETS.pigeonPale, 0.1]],
  woodPigeon: [[PRESETS.woodPigeon, 1]],
  dove: [[PRESETS.dove, 1]],
  mourningDove: [[PRESETS.mourningDove, 1]],
  crow: [[PRESETS.crow, 1]],
  raven: [[PRESETS.raven, 1]],
  magpie: [[PRESETS.magpie, 1]],
  blackbird: [[PRESETS.blackbird, 1], [PRESETS.blackbirdHen, 1]],
  brewers: [[PRESETS.brewers, 1], [PRESETS.brewersHen, 1]],
  starling: [[PRESETS.starling, 1]],
  gull: [[PRESETS.gull, 1]],
  gullWestern: [[PRESETS.gullWestern, 1]],
  bhGull: [[PRESETS.bhGull, 1], [PRESETS.bhGullHooded, 1]],
  sparrow: [[PRESETS.sparrow, 1], [PRESETS.sparrowHen, 1]],
  jackdaw: [[PRESETS.jackdaw, 1]],
  houseFinch: [[PRESETS.houseFinch, 1], [PRESETS.houseFinchHen, 1]],
  americanRobin: [[PRESETS.americanRobin, 1]],
  junco: [[PRESETS.junco, 1]],
  whiteCrowned: [[PRESETS.whiteCrowned, 1]],
  chaffinch: [[PRESETS.chaffinch, 1], [PRESETS.chaffinchHen, 1]],
  greatTit: [[PRESETS.greatTit, 1]],
  robin: [[PRESETS.robin, 1]],
  scrubJay: [[PRESETS.scrubJay, 1]],
  jay: [[PRESETS.jay, 1]],
  parakeet: [[PRESETS.parakeet, 1]],
  blackPhoebe: [[PRESETS.blackPhoebe, 1]],
  heron: [[PRESETS.heron, 1]],
  greatEgret: [[PRESETS.greatEgret, 1]],
  snowyEgret: [[PRESETS.snowyEgret, 1]],
  cormorant: [[PRESETS.cormorant, 1]],
}

/** what game.ts gives it: render/city.ts's accessors */
export interface BirdCity {
  edgeObjectsNear(x: number, z: number): PackedEdge[]
  treesNear(x: number, z: number, r: number): { x: number; z: number; height: number }[]
  buildingsNear(x: number, z: number): readonly PackedBuilding[]
  dryAt(x: number, z: number): boolean
  areaKindsAt(x: number, z: number): string[]
  readonly terrain: Terrain
}

interface Seg { ax: number; az: number; bx: number; bz: number }
const segDist = (s: Seg, x: number, z: number) => {
  const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz || 1
  const t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / l2))
  return Math.hypot(x - s.ax - dx * t, z - s.az - dz * t)
}
const segsOf = (e: PackedEdge): Seg[] => {
  const p = unpackPoints(e.points), out: Seg[] = []
  for (let i = 0; i + 1 < p.length; i++) out.push({ ax: p[i].x, az: p[i].z, bx: p[i + 1].x, bz: p[i + 1].z })
  return out
}
const nearest = (segs: Seg[], x: number, z: number) => segs.reduce((m, s) => Math.min(m, segDist(s, x, z)), Infinity)
function inRing(ring: number[], x: number, z: number): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i], zi = ring[i + 1], xj = ring[j], zj = ring[j + 1]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
}

export class Birds {
  private readonly drawer: BirdDrawer
  private readonly cells = new Map<string, Flock[]>()
  /** this region's colonies in local metres, and the flocks of those decided (by index) */
  private readonly colonies: { x: number; z: number; c: Colony }[]
  private readonly colonyFlocks = new Map<number, Flock[]>()
  private clock = 0
  private last: { x: number; z: number } | null = null
  private speed = 0
  /** for tools and tests: every flock decided so far, and how many birds were drawn last frame */
  get flocks(): Flock[] { return [...this.cells.values(), ...this.colonyFlocks.values()].flat() }
  get drawnCount(): number { return this.drawer.drawn }

  /** `dense`: every square has a flock (?birds=1, for looking at them) */
  constructor(scene: Scene, private readonly city: BirdCity, private readonly region: string, origin: LatLon, private readonly dense = false) {
    const proj = new Projection(origin)
    this.colonies = COLONIES.filter((c) => c.region === region).map((c) => ({ ...proj.toLocal(c.at), c }))
    this.drawer = new BirdDrawer(scene, { layerMask: 0x0fffffff | PEOPLE, renderingGroupId: 3 })
  }

  update(dt: number, at: { x: number; z: number }): void {
    if (this.last && dt > 0) this.speed += (Math.hypot(at.x - this.last.x, at.z - this.last.z) / dt - this.speed) * Math.min(1, dt * 4)
    this.last = { x: at.x, z: at.z }
    this.clock -= dt
    if (this.clock <= 0) { this.clock = 1; this.decide(at) }
    const threats = [{ x: at.x, z: at.z, speed: this.speed }]
    const live: Flock[] = []
    for (const f of this.flocks) {
      if (Math.hypot(f.x - at.x, f.z - at.z) > ACTIVE + RANGE) continue
      f.update(Math.min(dt, 0.1), threats)
      live.push(f)
    }
    this.drawer.draw(live, (x, z) => {
      const d = Math.hypot(x - at.x, z - at.z)
      return d > DRAW ? 0 : Math.min(1, (DRAW - d) / GROW)
    })
  }

  /** decide the squares round the rider, forget the far ones */
  private decide(at: { x: number; z: number }) {
    for (const k of this.cells.keys()) {
      const [cx, cz] = k.split(',').map(Number)
      if (Math.hypot((cx + 0.5) * CELL - at.x, (cz + 0.5) * CELL - at.z) > FORGET) this.cells.delete(k)
    }
    this.colonies.forEach((col, i) => {
      const d = Math.hypot(col.x - at.x, col.z - at.z)
      if (d > FORGET + col.c.r) this.colonyFlocks.delete(i)
      else if (d < ACTIVE + col.c.r && !this.colonyFlocks.has(i)) this.colonyFlocks.set(i, this.colony(col, i))
    })
    const r = Math.ceil(ACTIVE / CELL)
    const c0 = Math.floor(at.x / CELL), c1 = Math.floor(at.z / CELL)
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const cx = c0 + dx, cz = c1 + dz, k = `${cx},${cz}`
      if (this.cells.has(k)) continue
      if (Math.hypot((cx + 0.5) * CELL - at.x, (cz + 0.5) * CELL - at.z) > ACTIVE + CELL * 0.71) continue
      this.cells.set(k, this.site(cx, cz))
    }
  }

  /** a square's flocks (often none): the same every time the square is decided */
  private site(cx: number, cz: number): Flock[] {
    const seed = (Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ (this.region === 'paris' ? 0x5eed : 0xb1d5)) >>> 0
    const r = rng(seed)
    const x0 = cx * CELL, z0 = cz * CELL
    const out: Flock[] = []
    const edges = this.city.edgeObjectsNear(x0 + CELL / 2, z0 + CELL / 2).filter((e) => {
      if (e.onModel) return false
      const q = e.points
      for (let i = 0; i + 1 < q.length; i += 2) if (q[i] >= x0 && q[i] < x0 + CELL && q[i + 1] >= z0 && q[i + 1] < z0 + CELL) return true
      return false
    })
    if (!edges.length) return out
    let want = -1
    for (let i = 0; i < SITE_TRIES * 3 && (want < 0 || out.length < want); i++) {
      const e = edges[Math.floor(r() * edges.length)]
      const p = unpackPoints(e.points)
      if (p.length < 2) continue
      const j = Math.floor(r() * (p.length - 1)), t = r()
      const ex = p[j].x + (p[j + 1].x - p[j].x) * t, ez = p[j].z + (p[j + 1].z - p[j].z) * t
      if (ex < x0 || ex >= x0 + CELL || ez < z0 || ez >= z0 + CELL) continue
      // a bridge or a raised deck: its heights stand off the ground
      if (e.heights && Math.abs(e.heights[j] - this.city.terrain.heightAt(p[j].x, p[j].z)) > BRIDGE_OFF) continue
      const off = e.foot || e.park
      if (!off && e.walk < MIN_WALK) continue
      // a street flock sits on one pavement; any other on the way's verge
      const dx = p[j + 1].x - p[j].x, dz = p[j + 1].z - p[j].z, l = Math.hypot(dx, dz) || 1, side = r() < 0.5 ? 1 : -1
      const o = off ? e.width / 2 + 1.5 + r() * 4 : e.width / 2 + e.walk / 2
      const hx = ex + (-dz / l) * o * side, hz = ez + (dx / l) * o * side
      const zone = this.zone(e, hx, hz)
      if (want < 0) {
        const [lo, hi] = FLOCKS[zone]
        want = this.dense || r() < CHANCE[zone] ? lo + Math.floor(r() * (hi - lo + 1)) : 0
        if (want === 0) return out
      }
      const world = off ? this.parkWorld(hx, hz) : this.streetWorld(e, hx, hz)
      if (world.ground(hx, hz) === null) continue
      if (out.some((f) => Math.hypot(f.x - hx, f.z - hz) < RANGE)) continue
      const kind = this.pick(zone, r)
      const v = kind === 'cormorant' && this.region !== 'paris' ? [[PRESETS.cormorantSF, 1] as [BirdSpec, number]] : VARIANTS[kind]
      out.push(new Flock(v[0][0], hx, hz, (seed ^ 0x9e3779b9) + i, world, undefined, v))
    }
    return out
  }

  /** a colony's flocks: on open ground clear of the roads and the buildings, somewhere within its radius */
  private colony(col: { x: number; z: number; c: Colony }, i: number): Flock[] {
    const seed = (0xc010 + i * 7919) >>> 0, r = rng(seed), [lo, hi] = col.c.flocks
    const want = lo + Math.floor(r() * (hi - lo + 1)), out: Flock[] = []
    // tree-dwellers settle beside a tree of the colony's, so they have somewhere to go up to
    const trees = col.c.kind.habits.perch === 'tree' ? this.city.treesNear(col.x, col.z, col.c.r) : []
    for (let k = 0; k < COLONY_TRIES && out.length < want; k++) {
      const a = r() * Math.PI * 2, t = trees.length ? trees[Math.floor(r() * trees.length)] : null
      const d = t ? COLONY_TREE[0] + r() * (COLONY_TREE[1] - COLONY_TREE[0]) : Math.sqrt(r()) * col.c.r
      const hx = (t?.x ?? col.x) + Math.cos(a) * d, hz = (t?.z ?? col.z) + Math.sin(a) * d
      if (out.some((f) => Math.hypot(f.x - hx, f.z - hz) < RANGE)) continue
      const world = this.parkWorld(hx, hz)
      if (world.ground(hx, hz) === null) continue
      out.push(new Flock(col.c.kind, hx, hz, seed + k, world))
    }
    return out
  }

  /** which zone a spot beside this way is in */
  private zone(e: PackedEdge, x: number, z: number): Site {
    let wet = false
    for (let k = 0; k < WATER_RAYS && !wet; k++) {
      const a = (k / WATER_RAYS) * Math.PI * 2
      wet = !this.city.dryAt(x + Math.cos(a) * WATERSIDE, z + Math.sin(a) * WATERSIDE)
    }
    const kinds = this.city.areaKindsAt(x, z), sf = this.region !== 'paris'
    if (sf && wet && (kinds.includes('sand') || kinds.includes('dirt') || e.park)) return 'coast'
    if (!e.park) return wet ? 'water' : e.foot ? 'park' : 'street'
    if (wet) return 'water'
    return kinds.includes('wood') ? 'forest' : 'scrub'
  }

  private pick(zone: Site, r: () => number): Kind {
    const w = WEIGHTS[this.region === 'paris' ? 'paris' : 'san-francisco']
    const all = Object.entries(w[zone] ?? w.water ?? {}) as [Kind, number][]
    let n = r() * all.reduce((a, [, k]) => a + k, 0)
    for (const [k, v] of all) if ((n -= v) <= 0) return k
    return all[0][0]
  }

  /** the pavements of this street, both sides, near the flock */
  private streetWorld(e: PackedEdge, hx: number, hz: number): BirdWorld {
    const segs = segsOf(e), inner = e.width / 2 + KERB, outer = e.width / 2 + e.walk - WALL
    const terrain = this.city.terrain
    return {
      ground: (x, z) => {
        if (Math.hypot(x - hx, z - hz) > RANGE) return null
        const d = nearest(segs, x, z)
        return d >= inner && d <= outer ? terrain.heightAt(x, z) : null
      },
      perch: (x, z, r, kind, rnd) => this.perch(x, z, r, kind, rnd),
    }
  }

  /** dry land in the park, clear of the roads and out of the buildings */
  private parkWorld(hx: number, hz: number): BirdWorld {
    const roads = this.city.edgeObjectsNear(hx, hz).filter((e) => !e.foot && !e.park).map((e) => ({ segs: segsOf(e), clear: e.width / 2 + e.walk + ROAD_CLEAR }))
      .filter((rd) => nearest(rd.segs, hx, hz) < RANGE + rd.clear + 10)
    const blds = this.city.buildingsNear(hx, hz).filter((b) => (b.minHeight ?? 0) < 2 && b.ring.some((_, i) => i % 2 === 0 && Math.hypot(b.ring[i] - hx, b.ring[i + 1] - hz) < RANGE + 40))
    const terrain = this.city.terrain
    return {
      ground: (x, z) => {
        if (Math.hypot(x - hx, z - hz) > RANGE || !this.city.dryAt(x, z)) return null
        for (const rd of roads) if (nearest(rd.segs, x, z) < rd.clear) return null
        for (const b of blds) if (inRing(b.ring, x, z)) return null
        return terrain.heightAt(x, z)
      },
      perch: (x, z, r, kind, rnd) => this.perch(x, z, r, kind, rnd),
    }
  }

  private perch(x: number, z: number, r: number, kind: 'tree' | 'roof' | 'any', rnd: () => number): Spot | null {
    const tree = (): Spot | null => {
      const ts = this.city.treesNear(x, z, r)
      if (!ts.length) return null
      const t = ts[Math.floor(rnd() * ts.length)], a = rnd() * Math.PI * 2, o = TREE_OUT[0] + rnd() * (TREE_OUT[1] - TREE_OUT[0])
      const px = t.x + Math.cos(a) * o, pz = t.z + Math.sin(a) * o
      return { x: px, z: pz, y: this.city.terrain.heightAt(t.x, t.z) + t.height * (TREE_UP[0] + rnd() * (TREE_UP[1] - TREE_UP[0])) }
    }
    const roof = (): Spot | null => {
      const eaves: [number, number, number, number, number][] = []
      for (const b of this.city.buildingsNear(x, z)) {
        const h = b.height
        if (!h || h > ROOF_MAX || (b.minHeight ?? 0) > 0) continue
        const g = b.ring
        for (let i = 0; i + 3 < g.length; i += 2) {
          const mx = (g[i] + g[i + 2]) / 2, mz = (g[i + 1] + g[i + 3]) / 2
          if (Math.hypot(mx - x, mz - z) < r) eaves.push([g[i], g[i + 1], g[i + 2], g[i + 3], h])
        }
      }
      if (!eaves.length) return null
      const [ax, az, bx, bz, h] = eaves[Math.floor(rnd() * eaves.length)], t = 0.15 + rnd() * 0.7
      const px = ax + (bx - ax) * t, pz = az + (bz - az) * t
      return { x: px, z: pz, y: this.city.terrain.heightAt(px, pz) + h }
    }
    if (kind === 'tree') return tree() ?? roof()
    if (kind === 'roof') return roof() ?? tree()
    return rnd() < 0.5 ? tree() ?? roof() : roof() ?? tree()
  }

  dispose(): void { this.drawer.dispose(); this.cells.clear() }
}
