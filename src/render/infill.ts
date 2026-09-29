/**
 * Closing the canopy at RENDER time, from the trees the bake already decided.
 *
 * The owner: *"Overall there's far too little vegetation. Parts of the real park feel like a forest."* And
 * the other half of the same complaint: *"Some areas that DON'T have vegetation, like fields and the polo
 * field and rideout fountain area, do in our render."* Those two are one problem — a thin EVEN scatter
 * everywhere — and anything that simply multiplies the density fixes the first and makes the second worse.
 *
 * The density itself is baked (`city/park-planting.ts`: `MAX_DENSITY`, `TILE_TREES`, the zone rules of
 * the park zones (data/zones/)) and the package cannot be re-baked here. So the canopy is closed the other way round:
 * every baked tree is given SATELLITES, a handful of trunks a few metres off it, and how many it gets
 * depends on how many neighbours it already has.
 *
 * **That neighbour test is what makes this safe, and it is the whole idea.** A tree in the deep of Golden
 * Gate Park stands eleven metres from four or five others, so it is in a wood and it thickens. A specimen
 * oak on Lindley Meadow, or the one tree at the edge of the Polo Field, has no neighbour within fourteen
 * metres, so it gets nothing and the meadow stays a meadow. The bake's own distinction between forest and
 * lawn (`grass` takes the zone's specimen planting, `wood` its closed one) is therefore carried through for
 * free, rather than re-decided here from a second copy of the zone list that could disagree with it.
 *
 * Everything a satellite inherits — its form, and so its species — comes from its parent, so the zoning
 * survives: a eucalyptus grove thickens into a eucalyptus grove. Its HEIGHT does not: a satellite is drawn
 * from a wide range below its parent, because a stand of one age reads as an orchard and what closes a real
 * canopy is a few big trees with smaller ones filling underneath them.
 *
 * Nothing is stored and nothing is random: a satellite's position, size and spin are functions of its
 * parent's position and its index, so a tile streamed twice grows the same wood both times — the property
 * `city/plantings.ts` already gives the baked trees, extended to these.
 *
 * The one thing the bake knows that this cannot is where the ground is unplantable, so that is tested
 * directly: `Carriageways.onPaving` over the tile's own ways, the same check `render/plants.ts` uses to keep
 * the shrubs out of the asphalt, plus a clear margin off any carriageway. A satellite is thrown two to four
 * metres, and the bake keeps its trees 2.5 m clear of a path, so without this test the thickening would put
 * trunks back on exactly the trails it was recently got off.
 */
import { Carriageways } from '../city/carriageways.ts'
import type { Planting } from '../city/plantings.ts'
import type { PackedEdge } from '../city/package.ts'

/** how far a satellite is thrown from its parent, in metres */
const NEAR = 2.2
const FAR = 4.6
/** a tree with a neighbour inside this is in a wood rather than standing on a lawn */
const NEIGHBOUR = 14
/** …and this many neighbours means a closed wood, worth thickening at the full rate */
const FOREST = 2
/** metres a satellite trunk must keep clear of a carriageway's edge, and of anything paved */
const ROAD_CLEAR = 1.6
const PAVING_CLEAR = 0.6

/** a stable hash of a position and a counter, in [0, 1) — the same tree grows the same wood every time */
function h01(x: number, z: number, salt: number): number {
  let h = Math.imul((Math.round(x * 10) | 0) ^ 0x27d4eb2d, 0x9e3779b1)
  h ^= Math.imul((Math.round(z * 10) | 0) + salt * 0x9e37, 0x85ebca77)
  h ^= h >>> 15
  h = Math.imul(h, 0xc2b2ae3d)
  h ^= h >>> 13
  return (h >>> 0) / 4294967296
}

/**
 * How much of a wood each point is in, 0 on a mown meadow and 1 under a closed canopy — the same neighbour
 * test `thicken` uses, exported so that the understorey is laid by the same signal the canopy is.
 *
 * A forest floor and a lawn are the same polygon in OSM (`leisure=park`, all four hundred hectares of it),
 * so nothing in the areas can tell `render/plants.ts` which it is standing on. The trees can: where they
 * stand close together there is duff and undergrowth under them, and where one stands alone in the middle
 * of Lindley Meadow there is mown grass. Deciding both from one field is also what keeps them agreeing —
 * a bracken understorey on the Polo Field would be exactly as wrong as a wood on it.
 */
export function woodAt(ps: Planting[]): (x: number, z: number) => number {
  const cell = NEIGHBOUR
  const grid = new Map<number, { x: number; z: number }[]>()
  const key = (x: number, z: number): number => (Math.floor(x / cell) & 0xffff) * 65536 + (Math.floor(z / cell) & 0xffff)
  for (const p of ps) {
    if (!p.park) continue
    const k = key(p.x, p.z)
    const list = grid.get(k)
    if (list) list.push(p); else grid.set(k, [p])
  }
  if (grid.size === 0) return () => 0
  return (x, z) => {
    let n = 0
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (const q of grid.get(key(x + dx * cell, z + dz * cell)) ?? []) {
          if (Math.hypot(q.x - x, q.z - z) < NEIGHBOUR) n++
        }
      }
    }
    // three trunks inside fourteen metres of where you are standing is a wood you cannot see through
    return Math.min(1, n / 3)
  }
}

/**
 * The tile's trees, thickened. `mult` is how many times the baked count a CLOSED wood should end up with;
 * 1 returns the plantings untouched, which is what every caller that does not ask for a canopy gets.
 */
export function thicken(ps: Planting[], edges: PackedEdge[] | undefined, mult: number): Planting[] {
  if (!(mult > 1) || ps.length === 0) return ps
  // only the park scatter thickens: a street tree stands where the city's own register says it does, and a
  // row of four trunks where the survey records one is not a denser boulevard, it is a wrong one
  const park = ps.filter((p) => p.park)
  if (park.length === 0) return ps

  // neighbours, from a grid at the test radius: three cells each way is the whole neighbourhood
  const cell = NEIGHBOUR
  const grid = new Map<number, Planting[]>()
  const key = (x: number, z: number): number => (Math.floor(x / cell) & 0xffff) * 65536 + (Math.floor(z / cell) & 0xffff)
  for (const p of park) {
    const k = key(p.x, p.z)
    const list = grid.get(k)
    if (list) list.push(p); else grid.set(k, [p])
  }
  const neighbours = (p: Planting): number => {
    let n = 0
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (const q of grid.get(key(p.x + dx * cell, p.z + dz * cell)) ?? []) {
          if (q !== p && Math.hypot(q.x - p.x, q.z - p.z) < NEIGHBOUR) n++
        }
      }
    }
    return n
  }

  const ways = edges && edges.length > 0 ? new Carriageways(edges, true) : null
  const blocked = (x: number, z: number): boolean =>
    !!ways && (ways.inside(x, z, ROAD_CLEAR) || ways.onPaving(x, z, PAVING_CLEAR))

  const out = ps.slice()
  for (const p of park) {
    // how much of a wood this tree is already in: none on a meadow, all of it in the deep of the park
    const f = Math.min(1, neighbours(p) / FOREST)
    if (f <= 0) continue
    const want = (mult - 1) * f
    // the fraction is spent by hash rather than rounded, so a thinning edge thins smoothly instead of
    // stepping from three satellites to two along a contour of the noise field
    const k = Math.floor(want) + (h01(p.x, p.z, 41) < want - Math.floor(want) ? 1 : 0)
    for (let i = 0; i < k; i++) {
      const a = h01(p.x, p.z, i * 7 + 1) * Math.PI * 2
      const r = NEAR + h01(p.x, p.z, i * 7 + 2) * (FAR - NEAR)
      const x = p.x + Math.cos(a) * r
      const z = p.z + Math.sin(a) * r
      if (blocked(x, z)) continue
      /*
       * Sizes spread wide and skewed small. A satellite at its parent's height doubles the canopy and leaves
       * the space under it as empty as before; the mix that reads as forest from the saddle is a few full
       * trees with half-grown ones between them, which is also what an actual planted wood looks like
       * eighty years on.
       */
      const s = 0.42 + h01(p.x, p.z, i * 7 + 3) ** 1.7 * 0.72
      out.push({
        x, z, height: Math.max(2.5, p.height * s), spin: h01(p.x, p.z, i * 7 + 4) * 6.283,
        park: true, form: p.form, ...(p.y !== undefined ? { y: p.y } : {}),
      })
    }
  }
  return out
}
