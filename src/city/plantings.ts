/**
 * Every tree in a city, decided ONCE (at bake time) so the renderer only places what it is given and a
 * streamed tile always gets the same trees: the mapped ones, parks and gardens scattered by rejection
 * sampling, and street trees along the boulevards. Moved out of render/vegetation.ts for tiling
 * (PARIS_EXPAND §8); the rules are unchanged.
 */
import { onSurface, unpackPoints, type CityPackage } from './package.ts'

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
export function plantCity(pkg: Pick<CityPackage, 'trees' | 'areas' | 'edges'>, cap = TREE_CAP, street?: Planting[]): Planting[] {
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
  if (street) return [...street, ...thin(out, cap)]
  return thin(out, cap)
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
