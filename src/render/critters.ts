/**
 * Small mammals on the ground — squirrels, rabbits and hares, foxes, coyotes and the feral cats of Paris's cemeteries —
 * from critterkit (assetkit/critterkit): one parametric animal, its build, coat, gaits and habits set per species,
 * drawn as thin instances. (Deer are a model: render/zoo.ts.)
 *
 * Owner, 2026-11-24: "the model isn't as important as the motion - they should scurry around in select places, with the
 * wild ones more in forests and the squirrels pretty much everywhere … Feral cats are for the famous feral cat colony in
 * Paris. We may need coyotes for Marin."
 *
 * As render/birds.ts: the city is cut into CELL-metre squares and each, by its own seeded dice, may hold a group or two.
 * Where it sits decides who (WEIGHTS): a street's pavement, a town park, or open country split into woods ('forest')
 * and grass or scrub ('scrub': a big park's lawns and planting too). Squirrels need a tree within SQUIRREL_TREE of their spot (they bolt up it from the
 * rider); rabbits, foxes and coyotes keep to the parks and open country. The cats are COLONIES, hand-placed.
 * The rider is the threat (critterkit's behaviour); they never touch the bike.
 */
import type { Scene } from '@babylonjs/core/scene'
import { CritterDrawer, Group, PRESETS, CAT_COATS, rng, type CritterSpec, type CritterWorld, type Tree } from 'critterkit'
import type { PackedBuilding, PackedEdge } from '../city/package.ts'
import { unpackPoints } from '../city/package.ts'
import type { Terrain } from '../city/terrain.ts'
import { PEOPLE } from './layers.ts'
import { Projection, type LatLon } from '../city/geo.ts'

/** the city's squares (m), each with at most GROUPS groups */
const CELL = 140
type Site = 'street' | 'park' | 'forest' | 'scrub'
/** the chance a square has animals, by the zone of the first spot found; and how many groups then */
const CHANCE: Record<Site, number> = { street: 0.16, park: 0.45, forest: 0.85, scrub: 0.7 }
const GROUPS: Record<Site, [number, number]> = { street: [1, 1], park: [1, 2], forest: [1, 3], scrub: [1, 2] }
/** squares within ACTIVE of the rider are decided and moved; beyond FORGET dropped (m) */
const ACTIVE = 130
const FORGET = 380
/** drawn out to DRAW, growing in over the last GROW (m): they are small */
const DRAW = 75
const GROW = 10
/** a street needs a pavement this wide (m) to have a squirrel on it; it keeps KERB off the kerb and WALL off the walls */
const MIN_WALK = 1.6
const KERB = 0.3
const WALL = 0.3
/** a park group keeps this clear of a carriageway's edge (m) */
const ROAD_CLEAR = 3
/** a squirrel's spot needs a tree this near (m); a tree's trunk radius is TRUNK_R + TRUNK_K × height */
const SQUIRREL_TREE = 20
const TRUNK_R = 0.12
const TRUNK_K = 0.012
/** a group's ground reaches its habits' range plus its longest flight plus this (m) */
const WORLD_PAD = 10
/** a way this far off the ground (m) is a bridge */
const BRIDGE_OFF = 1.5
const SITE_TRIES = 16
/** groups in a square keep this far apart (m) */
const APART = 25

type Kind = 'squirrelSF' | 'squirrelParis' | 'rabbit' | 'brushRabbit' | 'jackrabbit' | 'redFox' | 'grayFox' | 'coyote'
const SQUIRRELS: Kind[] = ['squirrelSF', 'squirrelParis']
/**
 * Who lives where. Paris: the red squirrel in the big parks and the Bois (and along tree-lined avenues near them), the
 * rabbit on the Bois's and the périphérique's grass, the red fox in the Bois de Boulogne and de Vincennes. San Francisco:
 * eastern grey and fox squirrels in every park and street with trees; brush rabbits in the Presidio's and Golden Gate
 * Park's scrub, jackrabbits on the open grass; gray foxes and coyotes in the Presidio, Golden Gate Park and the Marin
 * headlands; red foxes rarer. (Field knowledge, not counts.)
 */
const WEIGHTS: Record<'paris' | 'san-francisco', Record<Site, Partial<Record<Kind, number>>>> = {
  paris: {
    street: { squirrelParis: 1 },
    park: { squirrelParis: 4, rabbit: 0.6, redFox: 0.1 },
    forest: { squirrelParis: 3, rabbit: 2, redFox: 1.2 },
    scrub: { rabbit: 4, redFox: 1, squirrelParis: 1.5 },
  },
  'san-francisco': {
    street: { squirrelSF: 1 },
    park: { squirrelSF: 4, brushRabbit: 0.3, coyote: 0.25, grayFox: 0.1 },
    forest: { squirrelSF: 2.5, brushRabbit: 1.2, grayFox: 0.8, coyote: 1, redFox: 0.2 },
    scrub: { brushRabbit: 2.5, jackrabbit: 0.8, coyote: 1.3, grayFox: 0.5, redFox: 0.2, squirrelSF: 2 },
  },
}
const VARIANTS: Record<Kind, [CritterSpec, number][]> = {
  squirrelSF: [[PRESETS.greySquirrel, 0.65], [PRESETS.foxSquirrel, 0.35]],
  squirrelParis: [[PRESETS.redSquirrel, 0.7], [PRESETS.redSquirrelDark, 0.3]],
  rabbit: [[PRESETS.rabbit, 1]],
  brushRabbit: [[PRESETS.brushRabbit, 1]],
  jackrabbit: [[PRESETS.jackrabbit, 1]],
  redFox: [[PRESETS.redFox, 1]],
  grayFox: [[PRESETS.grayFox, 1]],
  coyote: [[PRESETS.coyote, 1]],
}
/**
 * Hand-placed colonies: a centre, a radius and how many groups. The feral cats of Montmartre's and Père-Lachaise's
 * cemeteries (centres and radii from public/landmarks/paris-cemeteries.json's outlines, OSM a27724910 and a27719412).
 */
interface Colony { region: string; at: LatLon; r: number; variants: [CritterSpec, number][]; groups: [number, number] }
const CATS: [CritterSpec, number][] = CAT_COATS.map(([n, w]) => [PRESETS[n], w])
const COLONIES: Colony[] = [
  { region: 'paris', at: { lat: 48.88671, lon: 2.33033 }, r: 220, variants: CATS, groups: [3, 5] },
  { region: 'paris', at: { lat: 48.86118, lon: 2.39363 }, r: 320, variants: CATS, groups: [4, 6] },
]
const COLONY_TRIES = 40

/** what game.ts gives it: render/city.ts's accessors */
export interface CritterCity {
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
const reach = (s: CritterSpec) => s.habits.range + s.habits.flee[1] + WORLD_PAD

export class Critters {
  private readonly drawer: CritterDrawer
  private readonly cells = new Map<string, Group[]>()
  private readonly colonies: { x: number; z: number; c: Colony }[]
  private readonly colonyGroups = new Map<number, Group[]>()
  private clock = 0
  private last: { x: number; z: number } | null = null
  private speed = 0
  /** for tools and tests: every group decided so far, and how many animals were drawn last frame */
  get groups(): Group[] { return [...this.cells.values(), ...this.colonyGroups.values()].flat() }
  get drawnCount(): number { return this.drawer.drawn }

  /** `dense`: every square has a group (?critters=1, for looking at them) */
  constructor(scene: Scene, private readonly city: CritterCity, private readonly region: string, origin: LatLon, private readonly dense = false) {
    const proj = new Projection(origin)
    this.colonies = COLONIES.filter((c) => c.region === region).map((c) => ({ ...proj.toLocal(c.at), c }))
    this.drawer = new CritterDrawer(scene, { layerMask: 0x0fffffff | PEOPLE, renderingGroupId: 3 })
  }

  update(dt: number, at: { x: number; z: number }): void {
    if (this.last && dt > 0) this.speed += (Math.hypot(at.x - this.last.x, at.z - this.last.z) / dt - this.speed) * Math.min(1, dt * 4)
    this.last = { x: at.x, z: at.z }
    this.clock -= dt
    if (this.clock <= 0) { this.clock = 1; this.decide(at) }
    const threats = [{ x: at.x, z: at.z, speed: this.speed }]
    const live: Group[] = []
    for (const g of this.groups) {
      if (Math.hypot(g.x - at.x, g.z - at.z) > ACTIVE + g.spec.habits.range) continue
      g.update(Math.min(dt, 0.1), threats)
      live.push(g)
    }
    this.drawer.draw(live, (x, z) => {
      const d = Math.hypot(x - at.x, z - at.z)
      return d > DRAW ? 0 : Math.min(1, (DRAW - d) / GROW)
    })
  }

  private decide(at: { x: number; z: number }) {
    for (const k of this.cells.keys()) {
      const [cx, cz] = k.split(',').map(Number)
      if (Math.hypot((cx + 0.5) * CELL - at.x, (cz + 0.5) * CELL - at.z) > FORGET) this.cells.delete(k)
    }
    this.colonies.forEach((col, i) => {
      const d = Math.hypot(col.x - at.x, col.z - at.z)
      if (d > FORGET + col.c.r) this.colonyGroups.delete(i)
      else if (d < ACTIVE + col.c.r && !this.colonyGroups.has(i)) this.colonyGroups.set(i, this.colony(col, i))
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

  /** a square's groups (often none): the same every time it is decided */
  private site(cx: number, cz: number): Group[] {
    const seed = (Math.imul(cx, 83492791) ^ Math.imul(cz, 2654435761) ^ (this.region === 'paris' ? 0xc417 : 0x5c11)) >>> 0
    const r = rng(seed)
    const x0 = cx * CELL, z0 = cz * CELL, out: Group[] = []
    const edges = this.city.edgeObjectsNear(x0 + CELL / 2, z0 + CELL / 2).filter((e) => {
      if ((e as { onModel?: boolean }).onModel) return false // (onModel lands with the birds work's package.ts)
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
      if (e.heights && Math.abs(e.heights[j] - this.city.terrain.heightAt(p[j].x, p[j].z)) > BRIDGE_OFF) continue
      const off = e.foot || e.park
      if (!off && e.walk < MIN_WALK) continue
      const dx = p[j + 1].x - p[j].x, dz = p[j + 1].z - p[j].z, l = Math.hypot(dx, dz) || 1, side = r() < 0.5 ? 1 : -1
      const o = off ? e.width / 2 + 2 + r() * 6 : e.width / 2 + e.walk / 2
      const hx = ex + (-dz / l) * o * side, hz = ez + (dx / l) * o * side
      if (!this.city.dryAt(hx, hz)) continue
      const zone = this.zone(e, hx, hz)
      if (want < 0) {
        const [lo, hi] = GROUPS[zone]
        want = this.dense || r() < CHANCE[zone] ? lo + Math.floor(r() * (hi - lo + 1)) : 0
        if (want === 0) return out
      }
      if (out.some((g) => Math.hypot(g.x - hx, g.z - hz) < APART)) continue
      const trees = this.trees(hx, hz, SQUIRREL_TREE + 30)
      const kind = this.pick(zone, r, trees.some((tr) => Math.hypot(tr.x - hx, tr.z - hz) < SQUIRREL_TREE))
      if (!kind) continue
      const v = VARIANTS[kind]
      const world = off ? this.parkWorld(hx, hz, reach(v[0][0]), trees) : this.streetWorld(e, hx, hz, reach(v[0][0]), trees)
      if (world.ground(hx, hz) === null) continue
      out.push(new Group(v[0][0], hx, hz, (seed ^ 0x9e3779b9) + i, world, undefined, v))
    }
    return out
  }

  private colony(col: { x: number; z: number; c: Colony }, i: number): Group[] {
    const seed = (0xca75 + i * 7919) >>> 0, r = rng(seed), [lo, hi] = col.c.groups
    const want = lo + Math.floor(r() * (hi - lo + 1)), out: Group[] = [], spec = col.c.variants[0][0]
    for (let k = 0; k < COLONY_TRIES && out.length < want; k++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * col.c.r
      const hx = col.x + Math.cos(a) * d, hz = col.z + Math.sin(a) * d
      if (out.some((g) => Math.hypot(g.x - hx, g.z - hz) < APART)) continue
      const world = this.parkWorld(hx, hz, reach(spec), [])
      if (world.ground(hx, hz) === null) continue
      out.push(new Group(spec, hx, hz, seed + k, world, undefined, col.c.variants))
    }
    return out
  }

  private zone(e: PackedEdge, x: number, z: number): Site {
    if (!e.park) return e.foot ? 'park' : 'street'
    return this.city.areaKindsAt(x, z).includes('wood') ? 'forest' : 'scrub'
  }

  /** a kind for this zone; squirrels only with a tree at hand */
  private pick(zone: Site, r: () => number, treed: boolean): Kind | null {
    const w = WEIGHTS[this.region === 'paris' ? 'paris' : 'san-francisco'][zone]
    const all = (Object.entries(w) as [Kind, number][]).filter(([k]) => treed || !SQUIRRELS.includes(k))
    if (!all.length) return null
    let n = r() * all.reduce((a, [, k]) => a + k, 0)
    for (const [k, v] of all) if ((n -= v) <= 0) return k
    return all[0][0]
  }

  /** the bake's trees near a spot, as critterkit wants them */
  private trees(x: number, z: number, r: number): Tree[] {
    return this.city.treesNear(x, z, r).map((t) => ({ x: t.x, z: t.z, y: this.city.terrain.heightAt(t.x, t.z), height: t.height, r: TRUNK_R + TRUNK_K * t.height }))
  }

  private treeOf(trees: Tree[]) {
    return (x: number, z: number, r: number): Tree | null => {
      let best: Tree | null = null, bd = r
      for (const t of trees) { const d = Math.hypot(t.x - x, t.z - z); if (d < bd) { bd = d; best = t } }
      return best
    }
  }

  /** the pavements of this street, both sides */
  private streetWorld(e: PackedEdge, hx: number, hz: number, range: number, trees: Tree[]): CritterWorld {
    const segs = segsOf(e), inner = e.width / 2 + KERB, outer = e.width / 2 + e.walk - WALL, terrain = this.city.terrain
    return {
      ground: (x, z) => {
        if (Math.hypot(x - hx, z - hz) > range) return null
        const d = nearest(segs, x, z)
        return d >= inner && d <= outer ? terrain.heightAt(x, z) : null
      },
      tree: this.treeOf(trees),
    }
  }

  /** dry land, clear of the roads and out of the buildings */
  private parkWorld(hx: number, hz: number, range: number, trees: Tree[]): CritterWorld {
    const roads = this.city.edgeObjectsNear(hx, hz).filter((e) => !e.foot && !e.park).map((e) => ({ segs: segsOf(e), clear: e.width / 2 + e.walk + ROAD_CLEAR }))
      .filter((rd) => nearest(rd.segs, hx, hz) < range + rd.clear + 10)
    const blds = this.city.buildingsNear(hx, hz).filter((b) => (b.minHeight ?? 0) < 2 && b.ring.some((_, i) => i % 2 === 0 && Math.hypot(b.ring[i] - hx, b.ring[i + 1] - hz) < range + 40))
    const terrain = this.city.terrain
    return {
      ground: (x, z) => {
        if (Math.hypot(x - hx, z - hz) > range || !this.city.dryAt(x, z)) return null
        for (const rd of roads) if (nearest(rd.segs, x, z) < rd.clear) return null
        for (const b of blds) if (inRing(b.ring, x, z)) return null
        return terrain.heightAt(x, z)
      },
      tree: trees.length ? this.treeOf(trees) : undefined,
    }
  }

  dispose(): void { this.drawer.dispose(); this.cells.clear(); this.colonyGroups.clear() }
}
