/**
 * THE PARK IS ITS OWN PLACE, NOT A CITY WITH THE CITY TURNED DOWN.
 *
 * The owner, 2026-09-24: *"it's basically a totally different set of rules than rendering a city, because
 * it's NOT a city."*  ·  *"The park FEELS like a rural area, intentionally. Everything is designed like it
 * would be in a national park."*  ·  and, on why this must not be a San Francisco special case, *"we'll need
 * it for other parks in other cities though."*
 *
 * THE DEFAULTS INVERT, and that is the whole reason this file exists rather than a chain of `if (inPark)`
 * tests threaded through `render/city.ts`. In the city a way HAS pavements, kerbs, furniture and signs
 * unless something says otherwise. In a park it has NONE of those unless something says otherwise. Writing
 * the second as a long negation of the first is how the present mess arose (docs/PARKS.md), and every
 * suppression so written is one a future city change can step on.
 *
 * WHAT IT IS SELECTED BY: AREA, not city. A park is any `park`/`wood` polygon the bake already paints, over
 * a size threshold the region names — so Golden Gate Park and the Presidio qualify and a pocket square on
 * Nob Hill does not, with no list of names anywhere. Central Park and the Bois de Boulogne qualify the day
 * their cities are baked, which is the actual goal.
 *
 * WHY A TILE CAN ANSWER THIS ALONE. The bake clips an area polygon to the tile it lands in, so every tile
 * inside Golden Gate Park carries its own piece of the park polygon. The mask therefore needs nothing but
 * the tile in hand, which makes it independent of the order tiles stream in — a global registry accumulated
 * across arrivals would answer differently depending on what had loaded yet, and a tile is prepared exactly
 * once.
 *
 * THE THRESHOLD IS ON THE TILE'S PIECE, not on the whole park, for the same reason: the piece is all that is
 * here. A 200 m tile is 40 000 m², so "most of this tile is park" is a strong statement and a pocket garden
 * clipped into a tile cannot make it.
 */
import type { PackedArea, PackedEdge } from './package.ts'
import type { ParkStyle } from './region.ts'
import PARK_ROADS from './park-roads.json' with { type: 'json' }

/**
 * Which baked area kinds count as open country.
 *
 * `park` and `wood` on their own — the original rule — MISS THE OPEN HEADLAND ENTIRELY, and that is measured,
 * not suspected. The owner rode to the Marin headlands, which are already inside the box, and reported *"The
 * park is spartan and renders like a golf course more than anything"* (BUGS.md #208). Counted over the baked
 * package: of the 253 tiles across the headlands, **11 qualify under `park`/`wood` and 242 under the wider
 * set** — because OSM maps that ground as `natural=scrub` and `natural=grassland`, which the bake paints as
 * `grass`. So 96% of the headlands were being drawn with CITY rules on open ground: pavements, kerbs,
 * furniture, signs, signals, city widths. "Golf course" is an exact description of that.
 *
 * THE OLD COMMENT WAS RIGHT ABOUT THE DANGER AND WRONG ABOUT THE TEST. *"A lawn between two city blocks is
 * a lawn"* — true, and what makes it a lawn is the CITY BLOCKS, not the grass. So grass, sand and bare dirt
 * count as open country only where there is nothing built on the tile, which is a direct statement of the
 * thing that was actually meant. Measured citywide: the wider set adds 765 tiles, of which **five** have
 * enough buildings to be a city block, and the building test removes those five.
 *
 * Golden Gate Park barely moves (122 tiles → 123) and the Presidio hardly more (170 → 172), which is the
 * other half of the check: this changes the headlands and leaves the places that already worked alone.
 */
const WILD = new Set(['park', 'wood'])
/** Open ground that is only open country where nothing is built on the tile (see above). */
const BARE = new Set(['grass', 'sand', 'dirt'])
/**
 * How many buildings make a tile built-up. Eight, not one: a national park has a visitor centre, a boathouse
 * and a bison shelter, and the Presidio has a whole Main Post — none of which makes six square kilometres of
 * forest into a city. A 200 m tile with eight or more buildings on it is a block.
 */
const BUILT_UP = 8

const ringArea = (r: number[]): number => {
  let a = 0
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) a += r[j] * r[i + 1] - r[i] * r[j + 1]
  return Math.abs(a) / 2
}

const inRing = (r: number[], x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
  }
  return o
}

/**
 * A test for "is this point in open country", built from ONE tile's areas, or null when the tile has no
 * park piece big enough to be one. Null rather than a function that always says no, so the caller can skip
 * the whole park path for the overwhelming majority of tiles at no cost.
 */
export function parkMask(areas: readonly PackedArea[], minPieceM2: number, buildings = 0): ((x: number, z: number) => boolean) | null {
  /*
   * The threshold is on the TILE'S TOTAL open country, not on its largest single ring, and that correction
   * matters more than it sounds. The bake clips an area polygon to the tile it lands in, and a park boundary
   * that wanders — which is every real park's — leaves a tile holding three or four pieces of Golden Gate
   * Park, none of them ten thousand square metres on its own. Under the old test those tiles got no mask at
   * all, so the park rule simply switched off along strips of the park's own interior: city widths, city
   * pavements, and with the pavements back, the parking meters and newsracks the owner is still reporting.
   * Summing is the right question anyway — "how much of this tile is open country" — and a tile that is a
   * quarter park is a quarter park however many pieces the clipper left it in.
   */
  const rings: number[][] = []
  let total = 0, water = 0
  const open = buildings < BUILT_UP
  for (const a of areas) {
    if (open && a.kind === 'water') water += ringArea(a.ring)
    if (!WILD.has(a.kind) && !(open && BARE.has(a.kind))) continue
    rings.push(a.ring)
    total += ringArea(a.ring)
  }
  /*
   * …and a park's own LAKE counts toward the threshold (not toward the mask): Stow Lake fills most of its tile, so the
   * park piece left was under the bar and the drive round the lake was drawn by the city's rules — a levelled concrete
   * corridor standing over the park's hill like a ramp into the air (owner, 2026-10-06, at 37.767296, −122.4729). Only
   * on a tile that is not built up, so a waterfront block with a pocket park is still the city.
   */
  if (rings.length === 0 || total + water < minPieceM2) return null
  return maskOfRings(rings)
}

/**
 * The same question asked of a WHOLE CITY rather than of one tile, which is what the bake needs.
 *
 * The tile mask above sums its pieces, because a tile holds fragments of one park. A bake holds every park
 * in the city whole, so the threshold has to be per RING instead: Golden Gate Park and the Presidio are open
 * country and a 400 m² pocket garden on Nob Hill is not, and summing them would make the whole city a park.
 * Same selection rule, same lack of any city name in it — only the unit the threshold applies to differs,
 * and it differs because the geometry in hand does.
 */
export function cityParkMask(areas: readonly PackedArea[], minRingM2: number): ((x: number, z: number) => boolean) | null {
  /*
   * `BARE` counts here too, so the bake and the renderer agree about the headlands — but on SIZE alone,
   * because the bake has no tile to count buildings on. That is safe at this threshold rather than by luck:
   * the bar is four hectares in ONE ring, and the thing the building test exists to exclude — a lawn between
   * two city blocks — is a few hundred square metres. San Francisco has no 4 ha lawn that is not open
   * country. If a city ever does, this is the line that will need the building count.
   */
  const rings = areas.filter((a) => (WILD.has(a.kind) || BARE.has(a.kind)) && ringArea(a.ring) >= minRingM2).map((a) => a.ring)
  return rings.length === 0 ? null : maskOfRings(rings)
}

function maskOfRings(rings: number[][]): (x: number, z: number) => boolean {
  // a bounding box per ring, so the common answer (no) costs four comparisons rather than a ray cast
  const boxes = rings.map((r) => {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (let i = 0; i < r.length; i += 2) {
      if (r[i] < x0) x0 = r[i]
      if (r[i] > x1) x1 = r[i]
      if (r[i + 1] < z0) z0 = r[i + 1]
      if (r[i + 1] > z1) z1 = r[i + 1]
    }
    return [x0, x1, z0, z1] as const
  })
  return (x, z) => {
    for (let i = 0; i < rings.length; i++) {
      const b = boxes[i]
      if (x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue
      if (inRing(rings[i], x, z)) return true
    }
    return false
  }
}

/**
 * Where the open country is, accumulated as tiles arrive — so the rider can be asked "am I in the park?"
 * every frame without re-testing polygons the tile already answered.
 *
 * This is what pays for the density. The owner: *"There are almost no long sight lines, due to hills or
 * trees."* In the city the draw distance is forced by the skyline — you can see Sutro and the bridges from
 * most of San Francisco, so they have to be drawn. In the park you can see nothing beyond the next bend, so
 * a much shorter far plane and heavier fog are MORE accurate rather than a compromise, and the saving buys
 * the trees that do the occluding. Those two facts are the same fact.
 */
export class ParkMap {
  private readonly byTile = new Map<string, ((x: number, z: number) => boolean) | null>()
  /*
   * A plain field, NOT a constructor parameter property. `tools/bake.ts` runs under
   * `node --experimental-strip-types`, which erases types without transforming anything, and a parameter
   * property is the one piece of TypeScript that needs a transform — it emits an assignment. The bake now
   * imports `parkEdge` and `cityParkMask` from this file, so a parameter property anywhere in it kills a
   * four-hour bake at the import, before a line of work is done. Cheap to avoid, expensive to discover.
   */
  private readonly minPieceM2: number
  constructor(minPieceM2: number) { this.minPieceM2 = minPieceM2 }

  add(key: string, areas: readonly PackedArea[], buildings = 0): void {
    if (!this.byTile.has(key)) this.byTile.set(key, parkMask(areas, this.minPieceM2, buildings))
  }

  /**
   * Asked of the rider's own position, so the tile it is in is loaded by definition — no global index, and
   * an answer that costs one map lookup and at most a ray cast or two.
   */
  contains(x: number, z: number, tileSize: number): boolean {
    const m = this.byTile.get(`${Math.floor(x / tileSize)},${Math.floor(z / tileSize)}`)
    return m ? m(x, z) : false
  }
}

/**
 * The middle of the stretch of a way inside the tile: a way crossing into the next tile had its middle there, outside
 * every ring of this tile's mask, so this tile's piece of a drive through Golden Gate Park was drawn by the city's rules
 * (a levelled concrete corridor standing over the hill by Stow Lake — owner, 2026-10-06). Sampled every 2 m; the whole
 * way's middle where none of it is inside.
 */
function midWithin(points: number[], b: { x0: number; z0: number; x1: number; z1: number }): [number, number] {
  const inside: [number, number][] = []
  for (let i = 2; i < points.length; i += 2) {
    const ax = points[i - 2], az = points[i - 1], bx = points[i], bz = points[i + 1]
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2))
    for (let k = 0; k < n; k++) {
      const x = ax + ((bx - ax) * k) / n, z = az + ((bz - az) * k) / n
      if (x >= b.x0 && x < b.x1 && z >= b.z0 && z < b.z1) inside.push([x, z])
    }
  }
  return inside.length ? inside[inside.length >> 1] : midOf(points)
}

/** The middle of a way, which is what decides whether the way is in the park. */
function midOf(points: number[]): [number, number] {
  const n = points.length / 2
  const i = (n >> 1) * 2
  return [points[i], points[i + 1]]
}

/**
 * A CLASSIFIED THROUGH-ROUTE is not a park lane, and the park must not cap it.
 *
 * Crossover Drive is California State Route 1 crossing Golden Gate Park: four lanes, and a real highway that
 * happens to run through open country. Capping it to the park's 6.5 m makes a motorway into a footpath, and
 * the same is true of the Great Highway. This is a RULE about what a way carries, not a list of the two
 * roads that prompted it — Central Park's transverses and the Bois de Boulogne's boulevards take it
 * unchanged, which is the point of the whole file.
 *
 * `secondary` is in the set on purpose and the reason is worth recording, because it contradicts the
 * obvious guess: Crossover Drive is tagged `highway=secondary`, NOT `primary` or `trunk`, so a rule written
 * for those two would have missed the one road it was written for. Checked against the baked package rather
 * than assumed. `tertiary` is deliberately NOT here: MLK Drive and most of JFK Drive are tertiary, and they
 * are exactly the park lanes the cap exists for.
 */
const THROUGH = new Set(['motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link'])

/**
 * A way that is a ROAD in everything but its access tag — the former carriageway, closed to cars.
 *
 * The John F. Kennedy Promenade and Middle Drive West are both tagged `highway=pedestrian`, so both come
 * through the bake as `foot`, so both were being capped at the park's 3 m trail width — when the Promenade
 * is baked at up to 19.4 m and is, in fact, a two-lane road that people ride on. Neither number is the
 * place. A trail cap belongs to a `footway` or a `path`; a `pedestrian` way is a street with no cars on it
 * and keeps a road's width. This is the other half of *"the trails are very very wide"* (BUGS.md #201):
 * some of them are not trails.
 */
const CLOSED_ROAD = new Set(['pedestrian', 'living_street'])

const norm = (s: string): string => s.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim()

interface RoadFix { match: string; kind?: string; ways?: number[]; width?: number; kerb?: string; trail?: string; status?: string }

/**
 * The corrections read from photographs (`park-roads.json`), indexed by name once rather than searched per
 * way. A row with a `kind` wins over one without: a drive that is `tertiary` for cars and `pedestrian`
 * where it is closed to them is two different places sharing a name.
 */
const FIXES = ((): Map<string, RoadFix[]> => {
  const m = new Map<string, RoadFix[]>()
  for (const r of (PARK_ROADS as { roads: RoadFix[] }).roads) {
    const k = norm(r.match)
    m.set(k, [...(m.get(k) ?? []), r])
  }
  return m
})()

/** The photographed correction for this way, if anybody has looked at a picture of it. */
export function roadFix(e: Pick<PackedEdge, 'name' | 'kind' | 'id'>): RoadFix | null {
  const rows = e.name ? FIXES.get(norm(e.name)) : undefined
  if (!rows) return null
  return rows.find((r) => r.kind !== undefined && r.kind === e.kind) ?? rows.find((r) => r.kind === undefined) ?? null
}

/**
 * A way as the park would have it.
 *
 * The references (`~/Downloads/ggp-rural-road.png`, `ggp-mlk-dr.png`) are one narrow strip of worn asphalt
 * with no kerb at all on Middle Drive, and two narrow lanes with a kerb on ONE side on MLK — never the
 * multilane carriageway between two wide pavements that OSM's lane count and our city defaults produce.
 * The owner: *"OSM is right about the road and trail LOCATIONS, but often very wrong about the style, eg
 * specifying a multilane road when it's barely a 1-lane with a side trail (not a sidewalk)."* So the
 * geometry is kept untouched and only the style is corrected.
 *
 * What looks like a pavement in OSM inside a park is either the DETACHED trail — its own way, with its own
 * geometry, which we already draw — or nothing at all. Either way it is never a strip welded to the kerb,
 * so `walk` goes to zero rather than getting narrower.
 *
 * THREE WIDTHS, IN ORDER OF HOW MUCH IS KNOWN, because the blanket cap is a guess and a photograph is not:
 *   1. a measured width from `park-roads.json`, where somebody has looked at a picture of this road;
 *   2. no cap at all, on a classified through-route;
 *   3. otherwise the park's cap — a trail's if it is genuinely a trail, a road's if it is anything else.
 */
export function parkEdge(e: PackedEdge, style: ParkStyle): PackedEdge {
  const fix = roadFix(e)
  const trail = e.foot && !CLOSED_ROAD.has(e.kind ?? '')
  /*
   * A NAME-KEYED ROW MUST NOT WIDEN THE DETACHED TRAIL, and this nearly went in wrong. OSM gives the
   * separate cycle path beside a drive the DRIVE'S OWN NAME — "John F. Kennedy Drive" is nine baked
   * `cycleway` edges 2.5 m wide as well as seventy `tertiary` ones — so a row with no `kind` would have
   * set that 2.5 m path to the carriageway's nine metres and turned the centrepiece of the whole pattern,
   * the narrow trail a few metres off through the grass, into a second road. A measured carriageway width
   * therefore applies only where the row names its `kind` outright, or where the way is plainly the
   * carriageway itself: not a footway, and not a cycleway.
   */
  const carriageway = fix?.kind !== undefined || (!e.foot && e.kind !== 'cycleway')
  const width = fix?.width !== undefined && carriageway ? fix.width
    : THROUGH.has(e.kind ?? '') ? e.width
    : trail ? Math.min(e.width, style.maxTrailWidth)
    : Math.min(e.width, style.maxRoadWidth)
  const walk = style.pavements ? e.walk : 0
  /*
   * NOTHING IN A PARK IS MADE OF PAVEMENT CONCRETE. `surfaceOf` in the bake gives an untagged `footway` or
   * `pedestrian` way concrete, which is right for a city — that is what a sidewalk is — and it is why the
   * park's trails come out as broad pale slabs. Inside Golden Gate Park there are 18 400 baked edges in
   * that state. The owner: *"Most roads have a trail on one side, either asphalt or dirt, and are built
   * like rural roads."* Asphalt or dirt: those are the two, and concrete is neither.
   *
   * Asphalt rather than dirt for the substitution, because it is the safe half of the pair — a path OSM
   * actually knows to be unpaved is already tagged `surface=dirt|ground|gravel` and arrives here as `dirt`
   * or `gravel`, and those are left exactly as they are. What is being corrected is only the DEFAULT, and
   * the default the city applies out here is the one thing the references never show.
   */
  const surface = e.surface === 'concrete' ? 'asphalt' : e.surface
  return { ...e, width, walk, surface, park: true }
}

/**
 * The tile, rewritten as a park tile: narrow ways, no pavements, and none of the street furniture a
 * commercial kerb has. The owner counted *"thousands of parking meters"* in Golden Gate Park (BUGS.md #187);
 * the references have exactly one built object between them, a lamppost with a 25 mph plate on it.
 *
 * `keepFurniture` is the "unless something says otherwise" half of the inverted default: the region names
 * the few kinds a national park does have, and everything else goes.
 */
export function parkTile<T extends {
  edges: PackedEdge[]
  areas: PackedArea[]
  furniture: { kind: string; x: number; z: number }[]
  buildings?: unknown[]
}>(t: T, style: ParkStyle, bounds?: { x0: number; z0: number; x1: number; z1: number }): T {
  const mask = parkMask(t.areas, style.minPieceM2, t.buildings?.length ?? 0)
  if (!mask) return t
  const keep = new Set(style.keepFurniture)
  return {
    ...t,
    edges: t.edges.map((e) => {
      const [x, z] = bounds ? midWithin(e.points, bounds) : midOf(e.points)
      return mask(x, z) ? parkEdge(e, style) : e
    }),
    furniture: t.furniture.filter((f) => keep.has(f.kind) || !mask(f.x, f.z)),
  }
}

/** A tile's footways that run through a `park` of any size, drawn by the park's rules: a walk, not a pavement (Paris's squares). */
export function gardenWalks<T extends { edges: PackedEdge[]; areas: PackedArea[] }>(t: T, style: ParkStyle, bounds: { x0: number; z0: number; x1: number; z1: number }): T {
  const rings = t.areas.filter((a) => a.kind === 'park').map((a) => a.ring)
  if (!rings.length) return t
  const inRing = (r: number[], x: number, z: number): boolean => {
    let c = false
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) c = !c
    }
    return c
  }
  return {
    ...t,
    edges: t.edges.map((e) => {
      if (e.park || !e.foot || (e.kind !== 'footway' && e.kind !== 'path')) return e
      const [x, z] = midWithin(e.points, bounds)
      return rings.some((r) => inRing(r, x, z)) ? parkEdge(e, style) : e
    }),
  }
}
