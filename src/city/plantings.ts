/**
 * Every tree in a city, decided ONCE (at bake time) so the renderer only places what it is given and a
 * streamed tile always gets the same trees: the mapped ones, parks and gardens scattered by rejection
 * sampling, and street trees along the boulevards. Moved out of render/vegetation.ts for tiling
 * (PARIS_EXPAND §8); the rules are unchanged.
 */
import { onSurface, unpackPoints, type CityPackage } from './package.ts'
import { Carriageways, type Near } from './carriageways.ts'
import { GREEN, inside, plantParks, type ParkRule } from './park-planting.ts'
import { crownRadius, formCode, type TreeForm } from './tree-forms.ts'
import { zonePlantRule, type PlantZones } from './zone-planting.ts'

export interface Planting {
  x: number; z: number; height: number; spin: number; park: boolean
  /** the tree's form where the bake knows it (city/tree-forms.ts), 0 where it does not */
  form?: number
  /**
   * An EXPLICIT height, absent for every tree the bake places. A tree on the ground takes its height from
   * the terrain, which is right for every street and park in the city.
   *
   * It exists for the one shape the terrain cannot express — a tree on a RAISED DECK (docs/SKYPARKS.md).
   * The ground is a heightfield, one elevation per x/z, so a tree on Salesforce Park's roof has nowhere to
   * say it is 21 m up and sinks into the road below. The same optional `y` `Planted` (render/plants.ts)
   * carries for the shrubs, so one deck entry serves both layers. It is never packed: a deck is built by a
   * landmark at run time, not baked.
   */
  y?: number
  /**
   * EXPLICIT Z (map format v3): the ground under the tree as the bake decided it, metres, datum frame. Not a deck
   * height — `y` is that — just the ground, so the renderer need not sample it. Absent on a v2 city.
   */
  ground?: number
}

/**
 * Plantings as the package stores them: x, z, height, spin, and park + 2 × form — five numbers a tree. (The fifth
 * was park 0/1 alone before forms, which reads back as form 0, so an old package still plants.)
 */
export const packPlantings = (ps: Planting[]): number[] => ps.flatMap((p) => [
  Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10, Math.round(p.height * 10) / 10, Math.round(p.spin * 100) / 100,
  (p.park ? 1 : 0) + 2 * (p.form ?? 0),
])

export const unpackPlantings = (flat: number[], ground?: number[]): Planting[] => {
  const out: Planting[] = []
  for (let i = 0; i + 4 < flat.length; i += 5) {
    const f = flat[i + 4]
    const p: Planting = { x: flat[i], z: flat[i + 1], height: flat[i + 2], spin: flat[i + 3], park: (f & 1) === 1, form: f >> 1 }
    const g = ground?.[i / 5]
    if (g !== undefined && Number.isFinite(g)) p.ground = g
    out.push(p)
  }
  return out
}

/** A stable small hash of a position, for choosing a tree's model where it stands. */
export function plantHash(x: number, z: number): number {
  let h = Math.imul(Math.round(x * 10) | 0, 0x27d4eb2d) ^ Math.imul(Math.round(z * 10) | 0, 0x165667b1)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  return (h ^ (h >>> 13)) >>> 0
}

/** How many trees at most. A ceiling, so a city with a lot of mapped green does not become a forest. */
export const TREE_CAP = 1900
/** …and at most this many a square kilometre, for a big box (the first Marais box: 1,900 over 1.96 km²) */
export const TREES_PER_KM2 = 1000

/**
 * `street`, where a region has its city's own record of its street trees (San Francisco: city/sf/trees.ts), is used
 * in place of step 3's guessed boulevard rows, and kept whole: the cap thins only
 * the park scatter then, since a tree that is really there is not one to thin.
 */
export function plantCity(pkg: Pick<CityPackage, 'trees' | 'areas' | 'edges'> & Partial<Pick<CityPackage, 'buildings'>>, cap = TREE_CAP,
                          given?: Planting[], parks?: ParkRule | PlantZones, report?: PlantReport): Planting[] {
  // zones, where the city has planting zones (data/zones/): the zone-driven pass below
  if (parks && typeof parks !== 'function' && parks.count > 0) return plantZoned(pkg, cap, given, parks, report)
  const rule = typeof parks === 'function' ? parks : undefined
  return spaced(plantLegacy(pkg, cap, given, rule), report)
}

/** What a planting pass placed, and what it turned away — the bake logs it. */
export interface PlantReport {
  register: number
  mapped: number
  streetRows: number
  parks: number
  /** turned away because another tree already stood within `MIN_SPACING` */
  tooClose: number
  /** park trees turned away because their crown would have reached into a building */
  crownInBuilding: number
  /** mapped and invented street trees dropped by the city-wide ceiling (`cap`), which predates zones */
  capped: number
  /** false for a city with no planting zones: then only the total and `tooClose` mean anything */
  zoned: boolean
}
export const newPlantReport = (): PlantReport => ({ register: 0, mapped: 0, streetRows: 0, parks: 0, tooClose: 0, crownInBuilding: 0, capped: 0, zoned: false })

/** metres two trunks must keep apart, whatever planted them (owner: "careful to not plant a tree on top of another") */
export const MIN_SPACING = 2.5

/**
 * The zone-driven planting (docs/MAP-FORMAT.md §7, src/city/zone-planting.ts), in priority order — each source
 * only where nothing earlier already stands within `MIN_SPACING`:
 *
 *   1. the city's own register of its street trees (`given`: San Francisco's DataSF list), seated at the kerb;
 *   2. the trees OSM maps (a plaza's, a courtyard's), where the register does not already have them;
 *   3. INVENTED tree-lined streets, only where the zone says there is no register (`street` a rule: a town
 *      outside the city whose list this is — Sausalito), with the zone's own species;
 *   4. the parks, woods and lawns, by the zone's planting (city/park-planting.ts, unchanged), each tree's CROWN
 *      kept out of every building (the Conservatory, the de Young in Golden Gate Park).
 */
function plantZoned(pkg: Pick<CityPackage, 'trees' | 'areas' | 'edges'> & Partial<Pick<CityPackage, 'buildings'>>, cap: number,
  given: Planting[] | undefined, zones: PlantZones, report?: PlantReport): Planting[] {
  const rep = report ?? newPlantReport()
  const r = mulberry(0x5eed ^ pkg.edges.length)
  const register = given ? seatTrees(given, pkg) : []

  // 2. mapped, where the register has nothing within 3 m
  const reg = new PointGrid(3)
  for (const p of register) reg.add(p)
  const mapped: Planting[] = []
  for (let i = 0; i < pkg.trees.length; i += 2) {
    const x = pkg.trees[i]
    const z = pkg.trees[i + 1]
    if (reg.near(x, z, 3)) continue
    mapped.push({ x, z, height: 6.5 + r() * 3, spin: r() * 6.28, park: false })
  }

  // 3. invented street rows, where a zone asks for them
  const rows: Planting[] = []
  for (const e of pkg.edges) {
    if (e.foot || !onSurface(e)) continue
    const pts = unpackPoints(e.points)
    let total = 0
    for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
    if (total < 30) continue
    // the street's rule, from its middle: a street is planted as one thing
    const mid = pts[Math.floor(pts.length / 2)]
    const rule = zones.street(mid.x, mid.z)
    if (!rule || rule === 'register' || rule.species.length === 0) continue
    if (e.walk < rule.minWalk || e.width < rule.minWidth) continue
    const clear = 12
    let acc = clear
    let run = 0
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x
      const dz = pts[i].z - pts[i - 1].z
      const seg = Math.hypot(dx, dz)
      while (acc < seg) {
        if (run + acc > total - clear) break
        const t = acc / seg
        const px = pts[i - 1].x + dx * t
        const pz = pts[i - 1].z + dz * t
        const off = e.width / 2 + e.walk * 0.75
        for (const side of [-1, 1]) {
          const sp = pick(rule.species, r())
          rows.push({
            x: px + (-dz / seg) * off * side, z: pz + (dx / seg) * off * side,
            height: sp.h[0] + r() * (sp.h[1] - sp.h[0]), spin: r() * 6.28, park: false, form: formCode(sp.form as TreeForm),
          })
        }
        acc += rule.spacing + (rule.jitter ?? 0) * (r() * 2 - 1)
      }
      acc -= seg
      run += seg
    }
  }
  const kept = thin([...mapped, ...rows], cap)
  rep.capped += mapped.length + rows.length - kept.length
  const rest = pkg.buildings ? seatTrees(kept, pkg, false) : kept

  // 4. the parks, crowns clear of the buildings
  const blds = pkg.buildings ? new Buildings(pkg.buildings) : null
  const inParks: Planting[] = []
  for (const p of plantParks(pkg, zonePlantRule(zones))) {
    if (blds && blds.wallDistance(p.x, p.z) < crownRadius(p.form, p.height)) { rep.crownInBuilding++; continue }
    inParks.push(p)
  }

  const out = spaced([...register, ...rest, ...inParks], rep)
  // counted AFTER spacing, so the sources add up to the total
  const regSet = new Set(register)
  const parkSet = new Set(inParks)
  rep.zoned = true
  for (const p of out) {
    if (regSet.has(p)) rep.register++
    else if (parkSet.has(p)) rep.parks++
    else if (p.form === undefined) rep.mapped++
    else rep.streetRows++
  }
  return out
}

/** Keep each tree only if none kept before it stands within `MIN_SPACING`: the order is the priority. */
function spaced(trees: Planting[], report?: PlantReport): Planting[] {
  const grid = new PointGrid(MIN_SPACING)
  const out: Planting[] = []
  for (const p of trees) {
    if (grid.near(p.x, p.z, MIN_SPACING)) { if (report) report.tooClose++; continue }
    grid.add(p)
    out.push(p)
  }
  return out
}

/** points bucketed by a cell no smaller than the radius they are queried at */
class PointGrid {
  private readonly cells = new Map<string, { x: number; z: number }[]>()
  // (a plain field, not a parameter property: the bake runs under Node's type stripping, which has none)
  private readonly cell: number
  constructor(cell: number) { this.cell = cell }
  add(p: { x: number; z: number }): void {
    const k = `${Math.floor(p.x / this.cell)},${Math.floor(p.z / this.cell)}`
    const l = this.cells.get(k)
    if (l) l.push(p)
    else this.cells.set(k, [p])
  }
  near(x: number, z: number, d: number): boolean {
    const i0 = Math.floor(x / this.cell)
    const j0 = Math.floor(z / this.cell)
    for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) {
      for (const q of this.cells.get(`${i},${j}`) ?? []) if ((q.x - x) ** 2 + (q.z - z) ** 2 < d * d) return true
    }
    return false
  }
}

const pick = <T extends { weight: number }>(l: T[], u: number): T => {
  let t = 0
  for (const s of l) t += s.weight
  let v = u * t
  for (const s of l) { v -= s.weight; if (v <= 0) return s }
  return l[l.length - 1]
}

/** The rules before zones, which a city with no planting zones (Paris) still plants by. */
function plantLegacy(pkg: Pick<CityPackage, 'trees' | 'areas' | 'edges'> & Partial<Pick<CityPackage, 'buildings'>>, cap: number,
                     given?: Planting[], parks?: ParkRule): Planting[] {
  const street = given ? seatTrees(given, pkg) : undefined
  const out: Planting[] = []
  const r = mulberry(0x5eed ^ pkg.edges.length)

  // 1. the trees somebody actually mapped — with a city list, only those it does not have (a park's, a plaza's:
  // the city's list is of its street trees), which are the ones not within 3 m of one of its own
  const listed = new Set<string>()
  const cell = (x: number, z: number): string => `${Math.floor(x / 3)},${Math.floor(z / 3)}`
  for (const p of street ?? []) listed.add(cell(p.x, p.z))
  const near = (x: number, z: number): boolean => {
    for (let dx = -3; dx <= 3; dx += 3) for (let dz = -3; dz <= 3; dz += 3) if (listed.has(cell(x + dx, z + dz))) return true
    return false
  }
  const trees = pkg.trees
  for (let i = 0; i < trees.length; i += 2) {
    if (street && near(trees[i], trees[i + 1])) continue
    out.push({ x: trees[i], z: trees[i + 1], height: 6.5 + r() * 3, spin: r() * 6.28, park: false })
  }

  /*
   * 2. Parks, gardens and grass.
   *
   * With a region's own park rule (San Francisco's is ZONE DATA now: data/zones/, city/zone-planting.ts) the interiors get the real pass in
   * city/park-planting.ts — density, species and clumping by where you are standing, nothing on the paths,
   * a ceiling per tile — and those trees are kept out of the city-wide thinning below: a park that is a
   * forest is a forest, and decimating it to make room for boulevard rows is how it stopped being one.
   * Without a rule, the old rejection scatter, which is what Paris is tuned for.
   */
  const parked = parks ? plantParks(pkg, parks) : []
  for (const a of parks ? [] : pkg.areas) {
    if (!GREEN.has(a.kind)) continue
    const ring = unpackPoints(a.ring)
    let minx = Infinity; let maxx = -Infinity; let minz = Infinity; let maxz = -Infinity
    for (const p of ring) {
      minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x)
      minz = Math.min(minz, p.z); maxz = Math.max(maxz, p.z)
    }
    const span = (maxx - minx) * (maxz - minz)
    if (span < 60) continue
    /*
     * Trees per square metre. These were set for a forest and produced one: the Loop came out with six
     * thousand trees and read as parkland with a city somewhere behind it. A city park is mostly grass
     * with trees round its edge and along its paths, not a canopy.
     */
    const density = a.kind === 'wood' ? 0.006 : a.kind === 'park' ? 0.0018 : 0.0007
    const want = Math.min(70, Math.floor(span * density))
    for (let i = 0, tries = 0; i < want && tries < want * 8; tries++) {
      const x = minx + r() * (maxx - minx)
      const z = minz + r() * (maxz - minz)
      if (!inside(ring, x, z)) continue
      out.push({ x, z, height: 8 + r() * 4, spin: r() * 6.28, park: true })
      i++
    }
  }

  /*
   * 3. Street trees along anything with a pavement wide enough to hold one.
   *
   * The rule used to be an eleven-metre carriageway, which in a city where the carriageway is now the
   * corridor MINUS its pavements meant almost nothing qualified — a boulevard with a plane tree every
   * fifteen metres came out bare. What actually decides whether a street is planted is whether there is
   * somewhere to plant: a pavement of about a metre and a half.
   */
  for (const e of street ? [] : pkg.edges) {
    // A BOULEVARD, not every street with a kerb. Relaxing this to "anything with a pavement" planted five
    // thousand trees in the Loop, several of them within touching distance of the rider's own line — a
    // forest with a city somewhere behind it.
    if (e.foot || e.walk < 1.8 || e.width < 9 || !onSurface(e)) continue
    const pts = unpackPoints(e.points)
    const spacing = 13 + r() * 5
    let total = 0
    for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
    // clear of the junctions at both ends: the cross street and its pavements are in the first metres,
    // and trees planted from 6 m stood in the middle of Washington & Hyde
    const clear = 12
    let acc = clear
    let run = 0
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x
      const dz = pts[i].z - pts[i - 1].z
      const seg = Math.hypot(dx, dz)
      while (acc < seg) {
        if (run + acc > total - clear) break
        const t = acc / seg
        const px = pts[i - 1].x + dx * t
        const pz = pts[i - 1].z + dz * t
        // out at the kerb edge of the pavement, not against the carriageway where the rider is
        const off = e.width / 2 + e.walk * 0.75
        for (const side of [-1, 1]) {
          out.push({
            x: px + (-dz / seg) * off * side, z: pz + (dx / seg) * off * side,
            height: 6 + r() * 2.5, spin: r() * 6.28, park: false,
          })
        }
        acc += spacing
      }
      acc -= seg
      run += seg
    }
  }

  // the ceiling: every k-th tree kept, evenly, so no one place is thinned more than another
  // (and none of them growing out of a building either, however it got there: BUGS.md #47)
  const rest = pkg.buildings ? seatTrees(thin(out, cap), pkg, false) : thin(out, cap)
  // the park pass has already kept off the roads and the paths; it still goes through seatTrees for the
  // buildings, which the park polygons happily cover (the Conservatory, the de Young, the Main Post)
  const inParks = parked.length > 0 && pkg.buildings ? seatTrees(parked, pkg, false) : parked
  return [...(street ?? []), ...rest, ...inParks]
}

function thin(out: Planting[], cap: number): Planting[] {
  if (out.length <= cap) return out
  const keep = cap / out.length
  let acc = 0
  const kept: Planting[] = []
  for (const p of out) {
    acc += keep
    if (acc >= 1) { acc -= 1; kept.push(p) }
  }
  return kept
}

/**
 * A city's own list of its street trees, seated in THIS city (BUGS.md #47).
 *
 * The list's points are surveyed and OSM's footprints and street widths are not, and the two disagree by a metre
 * or three — which is the difference between a tree on the pavement and one growing out of a shopfront or the
 * middle of the lane. Planted where the list said, one tree in nine stood inside a building.
 *
 * So a tree near a street is put where that street's trees go in the city as drawn: at the kerb, a little in from
 * the carriageway's edge, on the side of the street it was on and at the same point along it — which is where
 * the guessed boulevard rows always stood, and where a San Francisco street tree actually is. One that then lands
 * in another carriageway (a corner) or in a building is dropped. A tree away from the streets (a median, a
 * plaza, a front garden) keeps its place, pushed out of a building it has strayed a little way into, or dropped
 * if it is deep inside one. With `kerb` false only that last part is done: the mapped and scattered trees.
 */
export function seatTrees(trees: Planting[], pkg: Pick<CityPackage, 'edges'> & Partial<Pick<CityPackage, 'buildings'>>, kerb = true): Planting[] {
  const roads = new Carriageways(pkg.edges)
  const near = (x: number, z: number): Near[] => roads.near(x, z)
  const blds = new Buildings(pkg.buildings ?? [])
  const inBuilding = (x: number, z: number): { depth: number; out: { x: number; z: number } } | null => blds.inBuilding(x, z)
  const inCarriageway = (x: number, z: number): boolean => roads.inside(x, z)

  const out: Planting[] = []
  for (const tree of trees) {
    // the street it belongs to: the nearest whose pavement (and a little beyond, for the survey's slack) it is on
    let best: Near | null = null
    if (kerb) for (const n of near(tree.x, tree.z)) if (n.d <= n.s.half + n.s.walk + 2.5 && (!best || n.d - n.s.half < best.d - best.s.half)) best = n
    let x = tree.x
    let z = tree.z
    if (best) {
      const { s, t, side } = best
      const L = Math.hypot(s.bx - s.ax, s.bz - s.az)
      const nx = -(s.bz - s.az) / L
      const nz = (s.bx - s.ax) / L
      // in from the kerb by the width of a tree basin, never past the middle of a narrow pavement
      const off = s.half + Math.min(0.75, Math.max(0.35, s.walk * 0.4))
      x = s.ax + (s.bx - s.ax) * t + nx * off * side
      z = s.az + (s.bz - s.az) * t + nz * off * side
      if (inCarriageway(x, z) || inBuilding(x, z)) continue
    } else {
      const b = inBuilding(x, z)
      if (b) {
        if (b.depth > 3) continue
        x = b.out.x
        z = b.out.z
        if (inBuilding(x, z) || inCarriageway(x, z)) continue
      }
    }
    out.push({ ...tree, x, z })
  }
  return out
}

/**
 * The buildings, bucketed in 24 m cells: which one a point is inside (and how to get out of it), and how far a point
 * is from the nearest wall — which is what keeps a planted tree's crown out of a building.
 */
export class Buildings {
  private static readonly CELL = 24
  private readonly rings: { x: number; z: number }[][]
  private readonly grid = new Map<string, number[]>()

  constructor(buildings: { ring: number[] }[]) {
    this.rings = buildings.map((b) => unpackPoints(b.ring))
    const C = Buildings.CELL
    this.rings.forEach((r, k) => {
      let x0 = Infinity; let x1 = -Infinity; let z0 = Infinity; let z1 = -Infinity
      for (const q of r) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
      for (let gi = Math.floor(x0 / C); gi <= Math.floor(x1 / C); gi++) {
        for (let gj = Math.floor(z0 / C); gj <= Math.floor(z1 / C); gj++) {
          const key = `${gi},${gj}`
          const l = this.grid.get(key)
          if (l) l.push(k)
          else this.grid.set(key, [k])
        }
      }
    })
  }

  /** the ring a point is inside, how far in it is (to the nearest wall), and the nearest point 1.2 m outside */
  inBuilding(x: number, z: number): { depth: number; out: { x: number; z: number } } | null {
    const C = Buildings.CELL
    for (const k of this.grid.get(`${Math.floor(x / C)},${Math.floor(z / C)}`) ?? []) {
      const r = this.rings[k]
      if (!inside(r, x, z)) continue
      let best = Infinity
      let exit = { x, z }
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const a = r[j]
        const b = r[i]
        const dx = b.x - a.x
        const dz = b.z - a.z
        const L2 = dx * dx + dz * dz || 1
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L2))
        const px = a.x + dx * t
        const pz = a.z + dz * t
        const d = Math.hypot(x - px, z - pz)
        if (d < best) { best = d; exit = { x: px + ((px - x) / (d || 1)) * 1.2, z: pz + ((pz - z) / (d || 1)) * 1.2 } }
      }
      return { depth: best, out: exit }
    }
    return null
  }

  /**
   * Distance from a point to the nearest wall of any building, 0 inside one; Infinity past one cell's reach
   * (24 m — further than any crown).
   */
  wallDistance(x: number, z: number): number {
    const C = Buildings.CELL
    const i0 = Math.floor(x / C)
    const j0 = Math.floor(z / C)
    let best = Infinity
    const seen = new Set<number>()
    for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) {
      for (const k of this.grid.get(`${i},${j}`) ?? []) {
        if (seen.has(k)) continue
        seen.add(k)
        const r = this.rings[k]
        if (inside(r, x, z)) return 0
        for (let a = 0, b = r.length - 1; a < r.length; b = a++) {
          const p = r[b]
          const q = r[a]
          const dx = q.x - p.x
          const dz = q.z - p.z
          const L2 = dx * dx + dz * dz || 1
          const t = Math.max(0, Math.min(1, ((x - p.x) * dx + (z - p.z) * dz) / L2))
          best = Math.min(best, Math.hypot(x - p.x - dx * t, z - p.z - dz * t))
        }
      }
    }
    return best
  }
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
