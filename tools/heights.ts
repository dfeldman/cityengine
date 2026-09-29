/**
 * How tall a building is when nobody said.
 *
 * The vendored tag layer defaults an untagged building to ONE storey, and the package cannot tell a
 * defaulted level count from a tagged one. In the Marais four buildings in ten are untagged, so four in ten
 * came out as one-storey sheds — and one storey is a height only `brick` can accommodate, so they were all
 * brick as well. One bug, two complaints (IMPROVEMENTS §1.1).
 *
 * So the bake guesses before the tag layer is asked, from the RAW tags, and hands the guess over as if a
 * mapper had written it. The method is the region's (`levelInference` in regions.json), because the right
 * witness differs by city: in Paris the tagged neighbours are all six storeys and so is the untagged block
 * between them; in the Loop the tagged neighbours are towers and the untagged block is a walk-up.
 */
import type { DefaultLevels, LevelInference } from '../src/city/region.ts'

/** A building whose level count a mapper did write down, for asking the neighbours. */
export interface TaggedNeighbour { x: number; z: number; levels: number }

const COMMERCIAL = new Set(['commercial', 'retail', 'office', 'hotel', 'supermarket'])

/** Any of these means the tag layer knows the height already and must be left to it. */
export const hasHeightTag = (tags: Record<string, string>): boolean =>
  tags['building:levels'] !== undefined || tags.height !== undefined
  || tags['building:height'] !== undefined || tags.est_height !== undefined

/** The level count a mapper wrote, as a number, or undefined. */
export function taggedLevels(tags: Record<string, string>): number | undefined {
  const n = parseFloat(tags['building:levels'] ?? '')
  return Number.isFinite(n) && n >= 1 && n < 200 ? Math.round(n) : undefined
}

/**
 * The level count to hand the tag layer for a building with no height tags, or undefined when it has
 * some. Pure: `neighbours` may be the whole city or a pre-filtered handful; only those within the
 * region's radius of the footprint's centre are counted.
 */
export function inferLevels(
  tags: Record<string, string>,
  ring: { x: number; z: number }[],
  neighbours: readonly TaggedNeighbour[],
  defaults: DefaultLevels,
  method: LevelInference,
): number | undefined {
  if (hasHeightTag(tags)) return undefined

  // a shed is a shed, whatever stands next to it
  const area = ringArea(ring)
  if (area < 30) return 1

  /*
   * BUGS.md #155, second pass. The footprint cap was first applied ONLY inside the neighbour branch, and
   * the bake then still gave "The Bike Hut" (7 x 5 m, way/572156641) three storeys — because that building
   * never reaches the neighbour branch at all. With too few tagged neighbours it falls through to the
   * regional default, and with a matching `building=*` it takes `method.types`. Both were uncapped.
   *
   * So the cap belongs on EVERY inferred answer, not one branch. A building cannot plausibly be tall on a
   * plan this small however we arrived at the guess. Calibrated against `bake-heights.test.ts`, which infers
   * on a 15 x 12 m ring (180 m2) and rightly expects 6 storeys in Paris and 8 in the Loop — an ordinary
   * apartment block — so the caps only bite well below that.
   */
  const cap = area < 50 ? 1 : area < 100 ? 2 : area < 150 ? 3 : method.maxLevels
  const capped = (v: number): number => Math.max(1, Math.min(method.maxLevels, cap, v))

  const type = tags.building ?? 'yes'
  const byType = method.types[type]
  if (byType !== undefined) return capped(typeof byType === 'number' ? byType : defaults[byType])

  const c = centroid(ring)
  const near: number[] = []
  const r2 = method.radius * method.radius
  for (const n of neighbours) {
    const dx = n.x - c.x
    const dz = n.z - c.z
    if (dx * dx + dz * dz <= r2) near.push(n.levels)
  }
  if (near.length >= method.minNeighbours) {
    near.sort((a, b) => a - b)
    const v = near[Math.min(near.length - 1, Math.floor(method.percentile * near.length))]
    /*
     * BUGS.md #155. The neighbour guess knew nothing about how big the building is, so a shack standing
     * among towers inherited a tower's height. The owner found three of them beside Pier 40 — "a few small
     * shacks around it. these are rendering as tall buildings" — including "The Bike Hut" at 7 x 5 m, which
     * came out the height of the South Beach residential blocks around it.
     *
     * The shed rule above (< 30 m2 => 1) missed them: the Bike Hut is 35 m2, the next 100 m2, the next 216.
     * Rather than nudge that threshold, cap the NEIGHBOUR guess by footprint — a building cannot plausibly
     * be tall on a plan that small, whatever stands next to it.
     *
     * CALIBRATION MATTERS HERE and my first attempt was far too tight (a < 300 => 4). `bake-heights.test.ts`
     * infers on a 15 x 12 m ring — 180 m2 — and expects 6 storeys in Paris and 8 in the Loop, which is an
     * ordinary apartment block and exactly right. A small footprint is NOT evidence of a low building: a
     * narrow San Francisco house is ~7 x 15 m and three storeys, and plenty of towers stand on 200 m2.
     *
     * So cap only where the plan is too small for anything else to be plausible, and leave everything from a
     * normal town house upward to the neighbours. These only ever reduce a guess, never raise one.
     */
    return capped(v)
  }

  return capped(COMMERCIAL.has(type) ? defaults.commercial : defaults.residential)
}

/**
 * A coarse grid of tagged centres, so asking the neighbours of 3 000 buildings is not 3 000 × 3 000.
 * `near(x, z, r)` returns everyone in the cells a circle of radius r touches; `inferLevels` does the exact
 * distance test itself.
 */
export class NeighbourGrid {
  private readonly cells = new Map<string, TaggedNeighbour[]>()
  private readonly cell: number
  constructor(items: readonly TaggedNeighbour[], cell = 50) {
    this.cell = cell
    for (const n of items) {
      const k = `${Math.floor(n.x / cell)},${Math.floor(n.z / cell)}`
      let list = this.cells.get(k)
      if (!list) this.cells.set(k, (list = []))
      list.push(n)
    }
  }
  near(x: number, z: number, r: number): TaggedNeighbour[] {
    const out: TaggedNeighbour[] = []
    const c0 = Math.floor((x - r) / this.cell)
    const c1 = Math.floor((x + r) / this.cell)
    const w0 = Math.floor((z - r) / this.cell)
    const w1 = Math.floor((z + r) / this.cell)
    for (let c = c0; c <= c1; c++) {
      for (let w = w0; w <= w1; w++) {
        const list = this.cells.get(`${c},${w}`)
        if (list) out.push(...list)
      }
    }
    return out
  }
}

export function centroid(ring: { x: number; z: number }[]): { x: number; z: number } {
  let x = 0
  let z = 0
  for (const p of ring) { x += p.x; z += p.z }
  return { x: x / ring.length, z: z / ring.length }
}

function ringArea(ring: { x: number; z: number }[]): number {
  let a = 0
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    a += p.x * q.z - q.x * p.z
  }
  return Math.abs(a) / 2
}
