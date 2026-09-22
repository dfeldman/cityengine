/**
 * Every tree in a city, decided ONCE (at bake time) so the renderer only places what it is given and a
 * streamed tile always gets the same trees: the mapped ones, parks and gardens scattered by rejection
 * sampling, and street trees along the boulevards. Moved out of render/vegetation.ts for tiling
 * (PARIS_EXPAND §8); the rules are unchanged.
 */
import { onSurface, unpackPoints, type CityPackage } from './package.ts'
import { Carriageways, type Near } from './carriageways.ts'

export interface Planting {
  x: number; z: number; height: number; spin: number; park: boolean
  /** the tree's form where the bake knows it (city/tree-forms.ts), 0 where it does not */
  form?: number
}

/**
 * Plantings as the package stores them: x, z, height, spin, and park + 2 × form — five numbers a tree. (The fifth
 * was park 0/1 alone before forms, which reads back as form 0, so an old package still plants.)
 */
export const packPlantings = (ps: Planting[]): number[] => ps.flatMap((p) => [
  Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10, Math.round(p.height * 10) / 10, Math.round(p.spin * 100) / 100,
  (p.park ? 1 : 0) + 2 * (p.form ?? 0),
])

export const unpackPlantings = (flat: number[]): Planting[] => {
  const out: Planting[] = []
  for (let i = 0; i + 4 < flat.length; i += 5) {
    const f = flat[i + 4]
    out.push({ x: flat[i], z: flat[i + 1], height: flat[i + 2], spin: flat[i + 3], park: (f & 1) === 1, form: f >> 1 })
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
                          given?: Planting[]): Planting[] {
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

  // 2. parks, gardens and grass, scattered by rejection sampling inside the polygon
  for (const a of pkg.areas) {
    if (a.kind === 'water' || a.kind === 'pitch' || a.kind === 'paved') continue
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
  return street ? [...street, ...rest] : rest
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
  const CELL = 24
  const key = (i: number, j: number): string => `${i},${j}`
  // the buildings, bucketed the same way
  const rings = (pkg.buildings ?? []).map((b) => unpackPoints(b.ring))
  const bgrid = new Map<string, number[]>()
  rings.forEach((r, k) => {
    let x0 = Infinity; let x1 = -Infinity; let z0 = Infinity; let z1 = -Infinity
    for (const q of r) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    for (let gi = Math.floor(x0 / CELL); gi <= Math.floor(x1 / CELL); gi++) {
      for (let gj = Math.floor(z0 / CELL); gj <= Math.floor(z1 / CELL); gj++) {
        const l = bgrid.get(key(gi, gj)) ?? []
        l.push(k)
        bgrid.set(key(gi, gj), l)
      }
    }
  })
  /** the ring a point is inside, and how far in it is (to the nearest wall) */
  const inBuilding = (x: number, z: number): { depth: number; out: { x: number; z: number } } | null => {
    for (const k of bgrid.get(key(Math.floor(x / CELL), Math.floor(z / CELL))) ?? []) {
      const r = rings[k]
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

/** Even-odd point in polygon. */
function inside(ring: { x: number; z: number }[], x: number, z: number): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) hit = !hit
  }
  return hit
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
