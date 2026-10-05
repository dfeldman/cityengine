/**
 * What grows INSIDE a park, which is the one thing a street tree register cannot tell you.
 *
 * San Francisco's plantings come from DataSF's Street Tree List (city/sf/trees.ts): every tree Public Works
 * keeps on a pavement, surveyed, with its species. It is an excellent record of the kerb and it knows almost
 * nothing about the other side of the railings — so Golden Gate Park, four hundred hectares of the densest
 * planting in the city, came out of the bake as mown grass with a scatter of trees on it, and the Presidio's
 * cypress and eucalyptus forest came out as a lawn. For a game whose rider spends much of the ride in those
 * parks that is the wrong way round from the truth.
 *
 * So the park interiors get their own pass, here, at bake time like everything else about a tree
 * (city/plantings.ts). A region supplies a RULE — a function of where you are standing and what kind of green
 * it is, answering with a density, a clumpiness and a species mix (now from ZONES: city/zone-planting.ts, data/zones/<region>.json) — and
 * this file turns that into trees:
 *
 *   * **jittered grid, not rejection sampling.** A grid cell per tree at the target spacing, the point jittered
 *     inside it and kept with a probability, which gives a varying density without ever putting two trunks in
 *     the same square metre. Rejection sampling at forest density spends most of its tries on collisions.
 *   * **clumps and clearings** from a cheap value-noise field at two scales, so a wood is a wood — thickets, a
 *     glade, a thin edge — rather than a lattice. A park at one density in one species reads worse than no
 *     park at all.
 *   * **thicker at the edges.** A park's boundary planting is what you actually see from the street.
 *   * **nothing on the paths, the roads, the water, the ball fields or the paving.** The roads and the paths
 *     both go through `Carriageways` (city/carriageways.ts), the same machinery that seats the street trees at
 *     the kerb; a rider on a park path must not be riding through trunks.
 *   * **the smallest polygon wins.** OSM draws Golden Gate Park as one big `leisure=park` with the lakes, the
 *     meadows, the ball fields and the woods drawn on top of it. A point is planted by the SMALLEST green area
 *     that contains it, so a meadow inside the park is a meadow and not park-density forest.
 *   * **a ceiling per tile.** The renderer streams 200 m tiles and holds a 7 × 7 block of them, so what costs
 *     money is trees per tile, not trees per city. `TILE_TREES` is the honest limit; the density above it is
 *     thinned evenly rather than truncated at one edge of the tile.
 */
import { tileKey, tileOf } from './tiles.ts'
import { Carriageways } from './carriageways.ts'
import { formCode, type TreeForm } from './tree-forms.ts'
import { packPoints, unpackPoints, type CityPackage, type PackedArea } from './package.ts'
import type { Planting } from './plantings.ts'

/** A species in a park's mix: its form (tree-forms.ts), its share, and how tall it grows HERE. */
export interface ParkSpecies { form: TreeForm; weight: number; h: [number, number] }

/** What grows on a particular patch of park. */
export interface ParkSpot {
  /** trees a square metre, before clumping — 0.008 is a closed wood, 0.0006 an open lawn with specimens */
  density: number
  /** 0 an even orchard, 1 all thicket and glade */
  clump: number
  species: ParkSpecies[]
  /** grows right up to its trails (PlantSpot `trailside`) */
  trailside?: boolean
}

/** A region's park planting: what grows at a point, or null to leave that ground bare. */
export type ParkRule = (x: number, z: number, kind: 'park' | 'wood' | 'grass') => ParkSpot | null

/** The green a park pass fills. Everything else — water, ball fields, paving — is a hole in it. */
export const GREEN: ReadonlySet<PackedArea['kind']> = new Set<PackedArea['kind']>(['park', 'wood', 'grass'])

/**
 * At most this many park trees in a 200 m tile, and the densest a rule is allowed to ask for.
 *
 * The renderer keeps VIEW = 3 tiles around the rider (a 7 × 7 block, 196 hectares), so the near ring is the
 * whole cost of a forest: 380 a tile is about 18 500 trees in the block. 0.0078 a square metre is a trunk
 * every eleven metres, which from the saddle is a closed canopy.
 *
 * The two are deliberately not the same number. `MAX_DENSITY` is below `TILE_TREES / TILE²` so that a
 * thicket can run a third over the nominal density and still fit; the ceiling is a backstop for the tile
 * that goes further, not the thing that decides how thick a wood is. When the ceiling does bite it thins
 * evenly, which flattens exactly the clumping the noise field just put in — so it wants to bite rarely.
 */
export const TILE_TREES = 380
export const MAX_DENSITY = 0.0078
/**
 * …except in a SMALL park (under a hectare) whose zone asks for more: the Seward Mini Park, "heavily wooded" (owner,
 * 2026-10-03), asked 0.03 and got 11 trees on 3 000 m². A small park cannot make a forest's cost; `TILE_TREES` still
 * bounds the tile. Up to a trunk every seven metres.
 */
export const SMALL_PARK_M2 = 10000
export const SMALL_PARK_MAX_DENSITY = 0.02
const capFor = (size: number): number => (size < SMALL_PARK_M2 ? SMALL_PARK_MAX_DENSITY : MAX_DENSITY)

/** Every tree inside the region's parks. Street trees and the mapped ones are `plantCity`'s own business. */
/** a green polygon wider than this is a reserve's boundary (a marine sanctuary, a national recreation area), not a park */
export const HUGE_AREA_SPAN = 40000
export const tooBigForAnArea = (ring: { x: number; z: number }[]): boolean => {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
  return x1 - x0 > HUGE_AREA_SPAN || z1 - z0 > HUGE_AREA_SPAN
}

export function plantParks(pkg: Pick<CityPackage, 'areas' | 'edges'>, rule: ParkRule, seed = 0x9e3779b9): Planting[] {
  const areas = pkg.areas.map((a) => {
    const ring = unpackPoints(a.ring)
    const holes = (a.holes ?? []).map(unpackPoints)
    return { kind: a.kind, ring, holes, ...boundsOf(ring), size: ringArea(ring) }
  })
  // (and not a reserve's boundary, which packages baked before the bake dropped them still carry)
  const green = areas.map((a, i) => ({ a, i })).filter(({ a }) => GREEN.has(a.kind) && a.size >= 200 && !tooBigForAnArea(a.ring))
  // the holes in the green: a lake, a ball field, a paved concourse. `top` paving included — that is exactly
  // the case it exists for, a square drawn over the park polygon that spreads under it.
  const blocked = areas.filter((a) => !GREEN.has(a.kind))

  const greenIndex = new AreaGrid(green.map(({ a, i }) => ({ ...a, i })))
  const blockIndex = new AreaGrid(blocked.map((a, i) => ({ ...a, i })))

  /*
   * The roads and the paths, both through Carriageways. A path is carried with an inflated `walk` only so the
   * class buckets it over a wider radius: its `near` looks in one 24 m cell and a segment is filed in every
   * cell its corridor plus three metres can reach, so a path with no pavement is invisible from eight metres
   * away — which is the distance over which a tree should be thinning towards the path, not appearing on it.
   */
  const roads = new Carriageways(pkg.edges)
  const paths = new Carriageways(pkg.edges.filter((e) => e.foot).map((e) => ({ ...e, foot: false, walk: PATH_REACH })))

  const perTile = new Map<string, Planting[]>()
  for (const { a, i } of green) {
    const r = mulberry(seed ^ Math.imul(i + 1, 0x85ebca6b))
    const edges = new SegGrid(a.ring, a.holes)
    // the spacing the densest species here would want: the grid step, one candidate a cell
    const step = 1 / Math.sqrt(Math.max(1e-6, peakDensity(rule, a, capFor(a.size))))
    const cell = step * step
    for (let z = a.z0 + r() * step; z < a.z1; z += step) {
      for (let x = a.x0 + r() * step; x < a.x1; x += step) {
        const px = x + (r() - 0.5) * step * 0.9
        const pz = z + (r() - 0.5) * step * 0.9
        if (!inside(a.ring, px, pz) || a.holes.some((h) => inside(h, px, pz))) continue
        // the smallest green containing the point owns it: a meadow drawn inside the park is a meadow
        if (greenIndex.smallestAt(px, pz) !== i) continue
        if (blockIndex.anyAt(px, pz)) continue
        const spot = rule(px, pz, a.kind as 'park' | 'wood' | 'grass')
        if (!spot || spot.density <= 0 || spot.species.length === 0) continue
        // nothing in the carriageway, and a good two metres clear of its edge
        if (roads.inside(px, pz, ROAD_CLEAR)) continue
        const toPath = clearance(paths, px, pz)
        if (toPath < PATH_CLEAR) continue
        let f = clumping(px, pz, spot.clump, seed)
        // thicker at the boundary, which is the planting the street actually sees
        const d = edges.distance(px, pz)
        if (d < EDGE_BAND) f *= 1 + EDGE_BOOST * (1 - d / EDGE_BAND)
        // and thinning towards a path rather than stopping dead at it
        if (toPath < PATH_REACH && !spot.trailside) f *= (toPath - PATH_CLEAR) / (PATH_REACH - PATH_CLEAR)
        if (r() > Math.min(capFor(a.size), spot.density) * f * cell) continue
        const sp = weighted(spot.species, r())
        const key = tileKey(...tileOf(px, pz))
        const list = perTile.get(key) ?? []
        list.push({
          x: px, z: pz,
          height: sp.h[0] + r() * (sp.h[1] - sp.h[0]),
          spin: r() * 6.28, park: true, form: formCode(sp.form),
        })
        perTile.set(key, list)
      }
    }
  }

  // the ceiling, per tile and evenly within it, so a tile thinned is thinner everywhere rather than bare on
  // one side (the same even keep-every-kth the city-wide cap uses)
  const out: Planting[] = []
  for (const list of perTile.values()) {
    if (list.length <= TILE_TREES) { out.push(...list); continue }
    const keep = TILE_TREES / list.length
    let acc = 0
    for (const p of list) {
      acc += keep
      if (acc >= 1) { acc -= 1; out.push(p) }
    }
  }
  return out
}

/** How many park trees each tile carries — for the budget, and for the tests. */
export function treesPerTile(ps: Planting[]): Map<string, number> {
  const n = new Map<string, number>()
  for (const p of ps) {
    const k = tileKey(...tileOf(p.x, p.z))
    n.set(k, (n.get(k) ?? 0) + 1)
  }
  return n
}

/** metres a trunk must keep from the edge of a carriageway */
const ROAD_CLEAR = 2
/** …and from the edge of a footpath: a rider on a park path is not riding through trunks */
const PATH_CLEAR = 2.5
/** over this distance the planting thins towards a path instead of stopping at it */
const PATH_REACH = 9
/** the band inside the boundary where the planting thickens, and by how much at the very edge */
const EDGE_BAND = 22
const EDGE_BOOST = 0.55

/** distance from the point to the nearest path's edge (Infinity where there is none near) */
function clearance(c: Carriageways, x: number, z: number): number {
  let best = Infinity
  for (const n of c.near(x, z)) best = Math.min(best, n.d - n.s.half)
  return best
}

/**
 * The density multiplier at a point: two octaves of value noise, so a wood has thickets and glades at about
 * eighty metres and texture at twenty-five. A clearing is a real hole, not a thin patch — a park with no
 * clearings has nowhere to ride to.
 */
function clumping(x: number, z: number, clump: number, seed: number): number {
  if (clump <= 0) return 1
  const big = valueNoise(x / 80, z / 80, seed)
  const fine = valueNoise(x / 26, z / 26, seed ^ 0x5bd1e995)
  /*
   * Stretched about the middle before anything is done with it. Bilinear value noise is the average of four
   * uniforms, so it piles up around a half and almost never reaches either end — a field left as it comes
   * out gives a wood that is faintly thicker here and there and has no glades in it at all. Pulling it apart
   * by 1.8 and clamping is what puts the ends back.
   */
  const spread = (v: number): number => Math.max(0, Math.min(1, (v - 0.5) * 1.8 + 0.5))
  const b = spread(big)
  if (b < 0.34 * clump) return 0
  const n = 0.65 * b + 0.35 * spread(fine)
  return Math.max(0, 1 - clump + clump * 2.4 * n)
}

/** The densest the rule gets anywhere in this area — the grid step has to be fine enough for it. */
function peakDensity(rule: ParkRule, a: { kind: PackedArea['kind']; x0: number; z0: number; x1: number; z1: number }, cap = MAX_DENSITY): number {
  let peak = 0
  const n = 4
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) {
      const s = rule(a.x0 + ((a.x1 - a.x0) * i) / n, a.z0 + ((a.z1 - a.z0) * j) / n, a.kind as 'park' | 'wood' | 'grass')
      if (s) peak = Math.max(peak, s.density)
    }
  }
  // the clumping can reach a little over twice the nominal density; sample fine enough to draw it
  return Math.max(1e-5, Math.min(cap, peak) * 2.2)
}

function weighted(species: ParkSpecies[], u: number): ParkSpecies {
  let total = 0
  for (const s of species) total += s.weight
  let acc = u * total
  for (const s of species) { acc -= s.weight; if (acc <= 0) return s }
  return species[species.length - 1]
}

/** Areas bucketed on a grid, for "which polygon is this point in?" without testing all of them. */
class AreaGrid {
  private static readonly CELL = 64
  private readonly grid = new Map<string, { ring: { x: number; z: number }[]; holes: { x: number; z: number }[][]
    size: number; i: number }[]>()

  constructor(areas: { ring: { x: number; z: number }[]; holes: { x: number; z: number }[][]; size: number
    x0: number; z0: number; x1: number; z1: number; i: number }[]) {
    const C = AreaGrid.CELL
    for (const a of areas) {
      for (let gi = Math.floor(a.x0 / C); gi <= Math.floor(a.x1 / C); gi++) {
        for (let gj = Math.floor(a.z0 / C); gj <= Math.floor(a.z1 / C); gj++) {
          const k = `${gi},${gj}`
          const l = this.grid.get(k) ?? []
          l.push(a)
          this.grid.set(k, l)
        }
      }
    }
  }

  private at(x: number, z: number): { ring: { x: number; z: number }[]; holes: { x: number; z: number }[][]
    size: number; i: number }[] {
    return this.grid.get(`${Math.floor(x / AreaGrid.CELL)},${Math.floor(z / AreaGrid.CELL)}`) ?? []
  }

  /** the index of the smallest area containing the point, or -1 */
  smallestAt(x: number, z: number): number {
    let best = -1
    let size = Infinity
    for (const a of this.at(x, z)) {
      if (a.size >= size || !inside(a.ring, x, z) || a.holes.some((h) => inside(h, x, z))) continue
      best = a.i
      size = a.size
    }
    return best
  }

  anyAt(x: number, z: number): boolean {
    for (const a of this.at(x, z)) if (inside(a.ring, x, z) && !a.holes.some((h) => inside(h, x, z))) return true
    return false
  }
}

/** A polygon's boundary segments on a grid, for "how far in from the edge am I?" */
class SegGrid {
  private static readonly CELL = 32
  private readonly grid = new Map<string, number[][]>()

  constructor(ring: { x: number; z: number }[], holes: { x: number; z: number }[][]) {
    for (const r of [ring, ...holes]) {
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const s = [r[j].x, r[j].z, r[i].x, r[i].z]
        const C = SegGrid.CELL
        for (let gi = Math.floor(Math.min(s[0], s[2]) / C); gi <= Math.floor(Math.max(s[0], s[2]) / C); gi++) {
          for (let gj = Math.floor(Math.min(s[1], s[3]) / C); gj <= Math.floor(Math.max(s[1], s[3]) / C); gj++) {
            const k = `${gi},${gj}`
            const l = this.grid.get(k) ?? []
            l.push(s)
            this.grid.set(k, l)
          }
        }
      }
    }
  }

  /** distance to the nearest boundary, or EDGE_BAND where none is within a cell of here */
  distance(x: number, z: number): number {
    const C = SegGrid.CELL
    let best = EDGE_BAND
    const gi = Math.floor(x / C)
    const gj = Math.floor(z / C)
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        for (const s of this.grid.get(`${gi + di},${gj + dj}`) ?? []) {
          const dx = s[2] - s[0]
          const dz = s[3] - s[1]
          const L2 = dx * dx + dz * dz || 1
          const t = Math.max(0, Math.min(1, ((x - s[0]) * dx + (z - s[1]) * dz) / L2))
          best = Math.min(best, Math.hypot(x - (s[0] + dx * t), z - (s[1] + dz * t)))
        }
      }
    }
    return best
  }
}

/** Even-odd point in polygon. Shared with city/plantings.ts. */
export function inside(ring: { x: number; z: number }[], x: number, z: number): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) hit = !hit
  }
  return hit
}

function boundsOf(ring: { x: number; z: number }[]): { x0: number; z0: number; x1: number; z1: number } {
  let x0 = Infinity; let x1 = -Infinity; let z0 = Infinity; let z1 = -Infinity
  for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
  return { x0, z0, x1, z1 }
}

function ringArea(ring: { x: number; z: number }[]): number {
  let a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j].x * ring[i].z - ring[i].x * ring[j].z
  return Math.abs(a / 2)
}

/** Smoothed value noise in 0..1 on a unit lattice. */
function valueNoise(x: number, z: number, seed: number): number {
  const xi = Math.floor(x)
  const zi = Math.floor(z)
  const fx = x - xi
  const fz = z - zi
  const sx = fx * fx * (3 - 2 * fx)
  const sz = fz * fz * (3 - 2 * fz)
  const a = lattice(xi, zi, seed)
  const b = lattice(xi + 1, zi, seed)
  const c = lattice(xi, zi + 1, seed)
  const d = lattice(xi + 1, zi + 1, seed)
  return (a + (b - a) * sx) * (1 - sz) + (c + (d - c) * sx) * sz
}

function lattice(x: number, z: number, seed: number): number {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(z | 0, 0x165667b1) ^ seed
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The trees of a RAISED DECK — a skypark (docs/SKYPARKS.md): Salesforce Park first, and any deck after it.
 *
 * The same `plantParks` scatter the ground parks get, over the deck's own ring and nothing else: a synthetic
 * one-area package, no edges (a deck has no carriageways in the package — its paths are drawn by the
 * landmark), and the deck's height stamped onto every result. That `y` is what `Vegetation` honours in place
 * of the terrain, exactly as `Plants.addDeck` does for the shrubs.
 *
 * `keepOff` metres inside the ring are left bare, because a deck's outer band IS its path loop and its
 * parapet — and `plantParks` deliberately THICKENS a park's boundary planting, which here put trunks down
 * the middle of the half-mile loop the rider rides. Salesforce Park's loop lies between 1.8 m and 6.2 m
 * inside the ring this is given (`skinRing` insets 4.0 and 8.4 against the deck's own 2.2), so 6.5 m is the
 * loop plus a little; the first render was taken at 4 m and had trees standing on the path.
 */
export function deckPlantings(ring: { x: number; z: number }[], y: number, keepOff = 6.5,
                              rule: ParkRule = DECK_PLANTING, spacing?: number): Planting[] {
  if (ring.length < 3) return []
  if (spacing) return deckRow(ring, y, keepOff, spacing, rule)
  const pkg = { areas: [{ kind: 'park' as const, ring: packPoints(ring) }], edges: [] }
  const edges = new SegGrid(ring, [])
  return plantParks(pkg, rule, 0x5ca1eb1e)
    .filter((p) => edges.distance(p.x, p.z) > keepOff)
    .map((p) => ({ ...p, y }))
}

/**
 * Trees at a GIVEN pitch on a deck bed, past `MAX_DENSITY`: a row along a path is a few dozen trees on a strip a
 * couple of metres wide, which an area density can never put there (0.0078 a square metre is half a tree on a 22 m
 * strip). A jittered grid at `spacing`, the same species mix, the same keep-off from the bed's edge.
 */
function deckRow(ring: { x: number; z: number }[], y: number, keepOff: number, spacing: number, rule: ParkRule): Planting[] {
  // the bed's own axes (a deck ring arrives in world space, turned however the landmark stands): its long axis by
  // the second moments, so a strip at 45° is planted down its length and not by a grid across it
  let mx = 0, mz = 0
  for (const p of ring) { mx += p.x; mz += p.z }
  mx /= ring.length; mz /= ring.length
  let sxx = 0, szz = 0, sxz = 0
  for (const p of ring) { const dx = p.x - mx, dz = p.z - mz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz }
  const t = 0.5 * Math.atan2(2 * sxz, sxx - szz)
  const c = Math.cos(t), sn = Math.sin(t)
  const toU = (x: number, z: number): [number, number] => [(x - mx) * c + (z - mz) * sn, -(x - mx) * sn + (z - mz) * c]
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
  for (const p of ring) { const [u, v] = toU(p.x, p.z); u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v) }
  const r = mulberry(Math.round(mx * 7 + mz * 13) ^ 0x7ee5)
  const edges = new SegGrid(ring, [])
  const out: Planting[] = []
  // rows centred in the bed, at least one each way: a strip narrower than the pitch is one row down its middle
  const nu = Math.max(1, Math.floor((u1 - u0) / spacing))
  const nv = Math.max(1, Math.floor((v1 - v0) / spacing))
  for (let iv = 0; iv < nv; iv++) {
    for (let iu = 0; iu < nu; iu++) {
      const u = u0 + ((iu + 0.5 + (r() - 0.5) * 0.4) * (u1 - u0)) / nu
      const v = v0 + ((iv + 0.5 + (r() - 0.5) * 0.2) * (v1 - v0)) / nv
      const px = mx + u * c - v * sn
      const pz = mz + u * sn + v * c
      if (!inside(ring, px, pz) || edges.distance(px, pz) < Math.min(keepOff, 0.4)) continue
      const spot = rule(px, pz, 'park')
      if (!spot || spot.species.length === 0) continue
      const sp = weighted(spot.species, r())
      out.push({ x: px, z: pz, y, height: sp.h[0] + r() * (sp.h[1] - sp.h[0]), spin: r() * 6.28, park: true, form: formCode(sp.form) })
    }
  }
  return out
}

/**
 * What grows on a skypark, where nothing says otherwise.
 *
 * Salesforce Park's real planting is thirteen zoned gardens — desert, palms, a great lawn, an oak meadow,
 * redwoods, a wetland. The zones live in the landmark's LOCAL frame and a deck ring arrives here already in
 * world space, so this is a GENERAL mix of what the whole park is made of rather than a zoning of it: coast
 * live oak in the lead, with redwood, olive and laurel under it and a few palms, which is the species list
 * the aerials show and the same forms the city's own parks use (data/zones/san-francisco.json).
 *
 * The density is the point of the place, and it is `MAX_DENSITY` — the most park-planting.ts will accept,
 * set by what a 7 × 7 block of tiles can afford. The real park has 600 trees over about 22 000 m², which is
 * 0.027 a square metre, three and a half times the ceiling: matching it is not on offer at any framerate.
 * What this asks for is 0.0078, a trunk every eleven metres, which over the deck's plantable core comes out
 * at about 130 trees. With crowns of eight to seventeen metres that closes over from above, which is what
 * the aerials read as, and it is a twentieth of the 2 500-odd trees a Presidio tile block already carries.
 * Lightly clumped rather than even, so the great lawn keeps a clearing or two in it.
 */
export const DECK_PLANTING: ParkRule = () => ({
  density: MAX_DENSITY,
  clump: 0.1,
  species: [
    { form: 'oak', weight: 4, h: [8, 13] },
    { form: 'cypress', weight: 2, h: [11, 17] },
    { form: 'olive', weight: 2, h: [5, 8] },
    { form: 'laurel', weight: 2, h: [6, 10] },
    { form: 'queen', weight: 1, h: [7, 11] },
  ],
})
