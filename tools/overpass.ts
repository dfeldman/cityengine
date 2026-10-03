/**
 * OpenStreetMap, the way a city needs it: everything inside a bounding box, once, offline.
 *
 * The caching is the important part. Overpass is a shared public service run on donated hardware, and a baker
 * that re-queries it on every run while someone iterates on the geometry is abusing it. Responses are cached
 * under `tools/cache/` by query hash, so a bake re-runs offline until the query itself changes.
 *
 * Adapted from `trailtrainer/tools/overpass.ts`, which asks the same service a different question: that one
 * wants the ways between two points to find a route through them, this one wants everything in a box to build
 * a city out of.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { localAnswer, regionFor, type Region as LocalRegion } from './osm-local.ts'

/**
 * The main instance first, then the public mirrors: overpass-api.de answers 504 when it is busy, which can
 * last an hour, and the mirrors serve the same data. OVERPASS_URL pins one.
 */
const ENDPOINTS = process.env.OVERPASS_URL ? [process.env.OVERPASS_URL] : [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
// Overpass turns away requests with no User-Agent, and asks that one identify the tool.
const UA = 'streetrunner/0.1 (Dandyhorse exergame city baker; https://openstreetmap.org/copyright)'
const CACHE = resolve(import.meta.dirname, 'cache')

export interface LatLon { lat: number; lon: number }

export interface OsmWay {
  type: 'way'
  id: number
  nodes: number[]
  geometry: LatLon[]
  tags: Record<string, string>
}

export interface OsmNode {
  type: 'node'
  id: number
  lat: number
  lon: number
  tags: Record<string, string>
}

/**
 * A relation, as Overpass returns it with `out geom`: each member carries its own geometry, so a
 * multipolygon arrives as a pile of ways that still have to be stitched into rings.
 */
export interface OsmRelation {
  type: 'relation'
  id: number
  tags: Record<string, string>
  members: { type: string; ref: number; role: string; geometry?: LatLon[] }[]
}

export interface OverpassResult {
  ways: OsmWay[]
  nodes: OsmNode[]
  relations: OsmRelation[]
  /** the copyright line Overpass returns; it goes into the package's attribution */
  copyright: string
  timestamp: string
}

export interface Bbox { south: number; west: number; north: number; east: number }

/**
 * Streets, buildings and the green bits, in one query.
 *
 * `highway` is filtered to what a person can actually ride or run on — no motorways, no slip roads, no
 * driveways — because a city you can steer through is made of streets, and offering a left turn onto a
 * motorway slip road would be both wrong and unrideable.
 *
 * `track` and `bridleway` joined the list for San Francisco's parks (user, 2026-09-22: "the stairs down to
 * the Presidio (and trail) are also huge for runners"): the Presidio's unpaved fire roads are `highway=track`
 * (five in the Presidio/Golden Gate Park box, mostly `tracktype=grade4/5`, one explicitly `bicycle=no`) and
 * without them here they were never fetched at all, regardless of what the ride graph would have done with
 * them. `bridleway` is added for the same reason though none actually exist tagged that way inside this box
 * today (Golden Gate Park's bridle trails are mapped as plain `footway`/`path`, not `highway=bridleway`) — it
 * costs nothing to ask for and stops a future edit from silently dropping one.
 */
/**
 * The WIDE query: what a city needs far beyond the blocks it models in detail — the roads, the railways, the
 * water and the coast (SF_PLAN.md: the box reaches the Bay Bridge and the Golden Gate so they can be ridden,
 * but nobody wants Oakland's buildings). Motorways come in only where they are a BRIDGE: the two bridges'
 * decks, not the freeway network, which a rider does not want and which clutters everything it touches.
 */
export function wideQuery(b: Bbox): string {
  const box = `${b.south},${b.west},${b.north},${b.east}`
  return `[out:json][timeout:240];
(
  way["highway"~"^(residential|living_street|unclassified|tertiary|secondary|primary|pedestrian|footway|path|track|bridleway|cycleway|service)$"]["area"!~"yes"](${box});
  way["highway"~"^(motorway|trunk|motorway_link|trunk_link)$"]["bridge"](${box});
  way["railway"~"^(rail|light_rail|tram|subway)$"](${box});
  way["natural"~"^(water|wood|coastline)$"](${box});
  way["waterway"="riverbank"](${box});
  way["man_made"="bridge"](${box});
  relation["natural"="water"](${box});
);
out geom qt;`
}

/**
 * The city in detail. WIDENED 2026-09-25 (owner: "we need motorways. as well as anything else form osm you
 * can think of that could possibly be useful").
 *
 * Motorways were excluded because a freeway is useless on a bike — true of RIDING one, every one is
 * `bicycle=no`, and false of DRAWING one. Their absence cost real work: the Golden Gate's walkways sit 18 m
 * below its deck and the fix (follow the carriageway you are bolted to) had nothing to follow, because along
 * the whole corridor we had 32 cycleways, 4 footways and NO roadway (BUGS.md #217, #218a). The Bay Bridge
 * works precisely BECAUSE its approaches are elevated motorways, which the wide query already carried.
 *
 * Also added, from the tag audit (#216) and the week's bugs: the sports enclosures the court kit needs
 * (#214a), sand/beach/shingle/bare_rock/reef/cliff for the beaches and the coast (#200, #206i), streams and
 * ditches for the culverts phantom overpasses cross (#189), retaining walls for the rip-rap (#200b), piers
 * and breakwaters, forts and batteries, and the 1,161 mapped street lamps we had been ignoring while
 * generating our own off the pavement width (#202).
 *
 * NOTHING IN THE QUERY STRING MAY BE A COMMENT. `tools/osm-local.ts` parses this text to answer from the
 * local extract, and its parser does not know block comments — a commented query silently falls through to
 * PUBLIC OVERPASS, which on the first attempt meant 108 chunks of a 5.7 KB query against a 429ing server.
 * explanation lives here, above the string, for exactly that reason.
 */
export function cityQuery(b: Bbox): string {
  const box = `${b.south},${b.west},${b.north},${b.east}`
  return `[out:json][timeout:240];
(
  way["highway"~"^(motorway|motorway_link|trunk|trunk_link|residential|living_street|unclassified|tertiary|secondary|primary|primary_link|secondary_link|tertiary_link|pedestrian|footway|path|steps|track|bridleway|cycleway|service|busway)$"]["area"!~"yes"](${box});
  way["railway"~"^(rail|light_rail|tram|subway|funicular|narrow_gauge)$"](${box});
  way["building"](${box});
  way["building:part"](${box});
  way["leisure"~"^(park|garden|pitch|nature_reserve|sports_centre|stadium|track|swimming_pool|playground|dog_park|marina|bandstand)$"](${box});
  way["landuse"~"^(grass|forest|meadow|cemetery|orchard|vineyard|recreation_ground|village_green)$"](${box});
  way["natural"~"^(water|wood|scrub|sand|beach|shingle|bare_rock|reef|cliff|heath|grassland|wetland)$"](${box});
  way["waterway"~"^(riverbank|stream|ditch|canal|dam|weir)$"](${box});
  way["barrier"~"^(retaining_wall|city_wall|hedge)$"](${box});
  way["man_made"~"^(pier|breakwater|bridge|lighthouse|water_tower|storage_tank|chimney|windmill|obelisk)$"](${box});
  way["historic"~"^(fort|battery|ruins|memorial|monument|naval|castle)$"](${box});
  node["natural"~"^(tree|rock|spring)$"](${box});
  node["highway"~"^(street_lamp|traffic_signals|crossing|elevator|motorway_junction)$"](${box});
  node["amenity"~"^(waste_basket|bench|drinking_water|toilets|bicycle_parking|fountain|clock|shelter)$"](${box});
  node["man_made"~"^(lighthouse|water_tower|flagpole|obelisk|cross)$"](${box});
  node["historic"~"^(memorial|monument|fort|battery|ruins|wayside_cross|boundary_stone)$"](${box});
  node["railway"="level_crossing"](${box});
  node["tourism"~"^(artwork|viewpoint|information)$"](${box});
  node["name"]["shop"](${box});
  node["name"]["amenity"~"^(cafe|restaurant|bar|pub|pharmacy|bank|bakery|theatre|cinema|library|museum|post_office|hotel)$"](${box});
  node["name"]["tourism"~"^(museum|gallery|hotel|attraction)$"](${box});
  relation["natural"="water"](${box});
  relation["waterway"="riverbank"](${box});
  relation["leisure"~"^(park|garden|nature_reserve)$"](${box});
  relation["landuse"~"^(grass|forest|meadow)$"](${box});
  relation["natural"~"^(wood|scrub|sand|beach|heath|grassland|wetland|bare_rock)$"](${box});
  relation["building"](${box});
  relation["leisure"~"^(pitch|sports_centre|stadium|track|swimming_pool|playground)$"](${box});
  relation["historic"~"^(fort|battery|ruins|castle)$"](${box});
  relation["man_made"~"^(pier|breakwater|bridge)$"](${box});
);
out geom qt;`
}

/**
 * The buildings beyond the city's box, for the fringe of plain massing round it — buildings only, and only
 * their outlines (parts would double them). Its own query, cached like the others.
 */
export function fringeQuery(b: Bbox): string {
  const box = `${b.south},${b.west},${b.north},${b.east}`
  return `[out:json][timeout:300];
(
  way["building"](${box});
);
out geom qt;`
}

/**
 * The small things that stand in a street and say where it is: a Guimard Métro entrance, a Wallace
 * fountain, a Morris column, a news kiosk, a bike-share dock — and the traffic signals, which are far denser
 * in some cities than any rule would guess. Its own query, so adding it did not change the main query's
 * hash and force every city to be fetched again.
 */
export function furnitureQuery(b: Bbox): string {
  const box = `${b.south},${b.west},${b.north},${b.east}`
  return `[out:json][timeout:120];
(
  node["railway"="subway_entrance"](${box});
  node["amenity"="drinking_water"](${box});
  node["advertising"="column"](${box});
  node["shop"="kiosk"](${box});
  node["amenity"="kiosk"](${box});
  node["amenity"="bicycle_rental"](${box});
  node["highway"="traffic_signals"](${box});
  node["railway"="tram_stop"](${box});
  node["advertising"="billboard"](${box});
  node["highway"="stop"](${box});
  node["highway"="bus_stop"](${box});
  node["amenity"="post_box"](${box});
  node["emergency"="fire_hydrant"](${box});
);
out qt;`
}

/**
 * The bridges' own outlines (`man_made=bridge`): the structure a Seine bridge is drawn from, one per bridge,
 * where its carriageways, cycle tracks and pavements are each a way of their own (render/bridges.ts). Its own
 * query, like the furniture's, so no city's main query changed and nothing else was fetched again.
 */
export function bridgesQuery(b: Bbox): string {
  const box = `${b.south},${b.west},${b.north},${b.east}`
  return `[out:json][timeout:120];
(
  way["man_made"="bridge"](${box});
  relation["man_made"="bridge"](${box});
);
out geom qt;`
}

/**
 * The paved squares (BUGS.md #22): pedestrian areas, `area:highway` and `place=square` — the Concorde, the
 * République, the parvis. The main query leaves `area=yes` highways out (they are not streets to ride), so
 * without these a square with no mapped ground came out as the city's default grass. Its own query.
 */
/**
 * The BARE ground: sand and dirt (BUGS.md #200).
 *
 * The owner: *"the beach should also have sand"*, and Ocean Beach, Baker Beach and China Beach have been
 * rendering as bright mown lawn — the single most obviously wrong thing at the west end of the park. The
 * bake painted `park`, `grass`, `wood`, `pitch`, `paved` and `water` and had no `sand` kind at all.
 *
 * ITS OWN QUERY, AND THAT IS THE WHOLE POINT OF THE FILE IT IS IN. These tags could have gone into
 * `cityQuery` in one line, and doing so would change that query's text, which is its cache key — so every
 * Overpass chunk of every city already on disk would be refetched, over a tiled query that takes the best
 * part of an hour for San Francisco. A new query caches on its own and leaves the street query's cache
 * untouched, exactly as `squaresQuery` and `stepsQuery` were added.
 *
 * `natural=beach` and `natural=sand` are the beaches and the dunes; `shingle` is a pebble beach and reads
 * the same at rider height; `scree` and `bare_rock` are the coastal bluffs. `mud` is the bay's tidal flats.
 */
export function sandQuery(b: Bbox): string {
  const box = `${b.south},${b.west},${b.north},${b.east}`
  return `[out:json][timeout:180];
(
  way["natural"~"^(beach|sand|shingle|dune|scree|bare_rock|mud)$"](${box});
  way["surface"~"^(sand)$"]["area"="yes"](${box});
  relation["natural"~"^(beach|sand|shingle|dune|scree|bare_rock|mud)$"](${box});
);
out geom qt;`
}

/**
 * THE SEAWALL, for the beach's first band (docs/PARKS.md "Beaches are BANDS", BUGS.md #200).
 *
 * The rip-rap at the top of Ocean Beach is not natural ground and OSM does not tag it as any: counted in the
 * Ocean Beach strip (37.758-37.780, -122.516 to -122.506) there is NO `natural=shingle` and NO
 * `natural=bare_rock` anywhere along it — but there are **33 `barrier=retaining_wall` ways**, which is the
 * seawall itself and is exactly where the revetment belongs. That is the usual split: the man-made edge is
 * mapped because somebody built it, and the natural gradient below it is not mapped because nobody drew it,
 * so band 1 comes from data and bands 2-4 are generated from the coastline.
 *
 * Its own query for the same reason as `sandQuery`: adding a line to `cityQuery` changes that query's text,
 * which is its cache key, and would refetch every chunk of every city on disk. `barrier` is already in
 * `osm-local.ts`'s `KEPT_KEYS`, so this answers from the local extract and never touches the network.
 */
export function wallsQuery(b: Bbox): string {
  const box = `${b.south},${b.west},${b.north},${b.east}`
  return `[out:json][timeout:180];
(
  way["barrier"~"^(retaining_wall|seawall)$"](${box});
);
out geom qt;`
}

export function squaresQuery(b: Bbox): string {
  const box = `${b.south},${b.west},${b.north},${b.east}`
  return `[out:json][timeout:120];
(
  way["highway"="pedestrian"]["area"="yes"](${box});
  way["area:highway"~"^(pedestrian|footway|living_street)$"](${box});
  way["place"="square"](${box});
  way["amenity"="parking"](${box});
  relation["highway"="pedestrian"](${box});
  relation["place"="square"](${box});
);
out geom qt;`
}

/**
 * The public stairways (SF_PLAN.md §10: "there are SO MANY public stairs… we need to have a way to insert
 * stairs"). `highway=steps` was never in the street query, so the city had none: its own query, so adding it
 * does not change the street query's cache. Merged into the ways before the ride graph is built; the run graph
 * takes them, the bike graph does not (you carry a bike up the Filbert Steps).
 */
export function stepsQuery(b: Bbox): string {
  const box = `${b.south},${b.west},${b.north},${b.east}`
  return `[out:json][timeout:120];
(
  way["highway"="steps"](${box});
);
out geom qt;`
}

/**
 * A query over a box too big for one request (central Paris is 7 × 3.5 km; one query timed out on every
 * server): the box cut into a grid of chunks about `step` metres a side, each fetched and cached on its own,
 * and the results merged by id — Overpass returns a way, node or relation whole even when only part of it
 * is in the chunk, so nothing is cut. A box small enough for one request is one request, exactly as before
 * (the same query, so its cache still answers).
 */
export async function overpassTiled(query: (b: Bbox) => string, b: Bbox, step = 1200, single = 2000): Promise<OverpassResult> {
  const mLat = 111_320
  const mLon = 111_320 * Math.cos((((b.south + b.north) / 2) * Math.PI) / 180)
  const w = (b.east - b.west) * mLon
  const h = (b.north - b.south) * mLat
  if (w <= single && h <= single) return overpass(query(b), regionFor(b))
  /*
   * Chunks snap to a FIXED grid of whole degrees/`CELL`, not to the box (user, 2026-09-22: "we should cache OSM
   * data since it takes hours to fetch"). The cache is keyed by the query text, which contains the chunk's
   * bbox, so a box that moves or grows used to miss every entry and refetch the lot — hours, against servers
   * that answer one request in five. Aligned, a chunk's key is the same whatever box asked for it, so growing
   * San Francisco's box west to the park refetches the new cells only.
   */
  // the pitch is rounded to a fixed 0.005 deg, and its longitude stretch taken at a WHOLE degree of latitude, so
  // the grid depends only on `step` and roughly where on earth we are -- not on the box that happens to ask
  const q = (v: number): number => Math.max(0.005, Math.round(v / 0.005) * 0.005)
  const cell = q(step / mLat)         // the grid's pitch in degrees of latitude
  const cellLon = q(step / (111_320 * Math.cos((Math.round((b.south + b.north) / 2) * Math.PI) / 180)))
  const r6 = (v: number): number => Math.round(v * 1e6) / 1e6
  const w0 = Math.floor(b.west / cellLon) * cellLon
  const s0 = Math.floor(b.south / cell) * cell
  const nx = Math.ceil((b.east - w0) / cellLon)
  const nz = Math.ceil((b.north - s0) / cell)
  /*
   * One local cut for the WHOLE grid, not one per chunk: the grid is snapped to fixed cells and so reaches a
   * little outside `b`, and a chunk must be answered with everything Overpass would have returned for it —
   * otherwise a truncated edge chunk would sit in the cache forever. Null when there is no osmium, no extract
   * covering the grid, or the data simply is not local: every chunk then goes to the network as before.
   */
  const region = regionFor({
    west: r6(w0), east: r6(w0 + nx * cellLon), south: r6(s0), north: r6(s0 + nz * cell),
  })
  const ways = new Map<number, OsmWay>()
  const nodes = new Map<number, OsmNode>()
  const relations = new Map<number, OsmRelation>()
  let copyright = ''
  let timestamp = ''
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      // the cell's own bounds, rounded to a fixed number of places so the text (and so the cache key) is stable
      const chunk: Bbox = {
        west: r6(w0 + i * cellLon), east: r6(w0 + (i + 1) * cellLon),
        south: r6(s0 + j * cell), north: r6(s0 + (j + 1) * cell),
      }
      process.stderr.write(`  overpass: chunk ${j * nx + i + 1}/${nx * nz}\n`)
      for (const r of await fetchSplitting(query, chunk, 2, region)) {
        for (const x of r.ways) ways.set(x.id, x)
        for (const x of r.nodes) nodes.set(x.id, x)
        for (const x of r.relations) relations.set(x.id, x)
        copyright ||= r.copyright
        if (r.timestamp > timestamp) timestamp = r.timestamp
      }
    }
  }
  return { ways: [...ways.values()], nodes: [...nodes.values()], relations: [...relations.values()], copyright, timestamp }
}

/** One chunk; if every server times out on it, its four quarters instead (a dense chunk of the centre did). */
async function fetchSplitting(query: (b: Bbox) => string, b: Bbox, depth: number, region?: LocalRegion | null): Promise<OverpassResult[]> {
  try {
    return [await overpass(query(b), region)]
  } catch (e) {
    if (depth <= 0) throw e
    process.stderr.write('  overpass: chunk refused, fetching it in quarters\n')
    const mx = (b.west + b.east) / 2
    const mz = (b.south + b.north) / 2
    const out: OverpassResult[] = []
    for (const q of [
      { west: b.west, east: mx, south: b.south, north: mz }, { west: mx, east: b.east, south: b.south, north: mz },
      { west: b.west, east: mx, south: mz, north: b.north }, { west: mx, east: b.east, south: mz, north: b.north },
    ]) out.push(...await fetchSplitting(query, q, depth - 1, region))
    return out
  }
}

/**
 * Run an Overpass QL query, caching the raw JSON by query hash.
 *
 * Three sources, in order: the disk cache, the local extract (osm-local.ts — osmium over a Geofabrik file,
 * which is why a bake no longer takes hours), and only then the public servers. `region` is an already-cut
 * local region to answer from, which is how `overpassTiled` cuts once for a whole box instead of once per
 * chunk. A local answer is written into the very same cache file, in the very same shape.
 */
export async function overpass(query: string, region?: LocalRegion | null): Promise<OverpassResult> {
  mkdirSync(CACHE, { recursive: true })
  const file = resolve(CACHE, `overpass-${createHash('sha1').update(query).digest('hex').slice(0, 16)}.json`)
  let text: string
  let local: string | null = null
  if (existsSync(file)) {
    text = readFileSync(file, 'utf8')
    process.stderr.write('  overpass: cached\n')
  } else if ((local = localAnswer(query, region ?? null)) !== null) {
    text = local
    process.stderr.write('  overpass: local extract\n')
    writeFileSync(file, text)
  } else {
    process.stderr.write(`  overpass: fetching (${query.length} chars)…\n`)
    let got: string | null = null
    let last = ''
    for (const url of ENDPOINTS) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
          body: new URLSearchParams({ data: query }),
        })
        const body = await res.text()
        if (res.ok && body.trimStart().startsWith('{')) { got = body; break }
        last = `${new URL(url).host} ${res.status} ${res.statusText}: ${body.slice(0, 200)}`
      } catch (e) {
        last = `${new URL(url).host}: ${(e as Error).message}`
      }
      process.stderr.write(`  overpass: ${last.split(':')[0]} failed, trying the next\n`)
    }
    if (got === null && !process.env.OVERPASS_NO_RETRY) {
      // every server busy: one more round after a pause, which is what a 429 asks for
      process.stderr.write('  overpass: all busy, waiting 30 s\n')
      await new Promise((r) => setTimeout(r, 30_000))
      for (const url of ENDPOINTS) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
            body: new URLSearchParams({ data: query }),
          })
          const body = await res.text()
          if (res.ok && body.trimStart().startsWith('{')) { got = body; break }
          last = `${new URL(url).host} ${res.status} ${res.statusText}: ${body.slice(0, 200)}`
        } catch (e) {
          last = `${new URL(url).host}: ${(e as Error).message}`
        }
      }
    }
    if (got === null) throw new Error(`overpass: every endpoint failed; last: ${last}`)
    text = got
    // Overpass answers a timed-out or rate-limited query with an HTML error page and a 200, so the status is
    // not enough. Caching that page would poison every later run with a JSON parse error and no clue why,
    // which is exactly what happened the first time the Loop was baked.
    if (!text.trimStart().startsWith('{')) {
      const why = /<p>([^<]*(?:error|timed out|rate|limit)[^<]*)/i.exec(text)?.[1]?.trim()
      throw new Error(`overpass refused the query: ${why ?? text.trim().slice(0, 200)}\n`
        + '  (not cached; a smaller radius or a retry in a minute usually fixes it)')
    }
    writeFileSync(file, text)
  }

  if (!text.trimStart().startsWith('{')) {
    // a cache file written before the check above, or one truncated by an interrupted run
    throw new Error(`cached overpass response is not JSON: ${file}\n  delete it and re-run`)
  }
  const json = JSON.parse(text) as {
    elements: (OsmWay | OsmNode | OsmRelation)[]
    osm3s?: { copyright?: string; timestamp_osm_base?: string }
  }
  const ways = json.elements.filter((e): e is OsmWay => e.type === 'way').map((w) => ({ ...w, tags: w.tags ?? {} }))
  const nodes = json.elements.filter((e): e is OsmNode => e.type === 'node').map((n) => ({ ...n, tags: n.tags ?? {} }))
  const relations = json.elements
    .filter((r): r is OsmRelation => r.type === 'relation')
    .map((r) => ({ ...r, tags: r.tags ?? {}, members: r.members ?? [] }))
  return {
    ways,
    nodes,
    relations,
    copyright: json.osm3s?.copyright ?? '© OpenStreetMap contributors, ODbL',
    timestamp: json.osm3s?.timestamp_osm_base ?? '',
  }
}


/**
 * Stitch a multipolygon relation's outer members into closed rings.
 *
 * This is why relations were skipped at first and why the water shader had nothing to draw: a river is not
 * one closed way, it is a dozen open ways that only form a bank when joined end to end, in no particular
 * order and in no particular direction. Members are taken greedily — start with one, keep attaching whichever
 * unused member shares an endpoint with the current tail, flipping it if need be, and close the ring when the
 * tail meets the head.
 */
/** The islands: a relation's `inner` members, stitched into rings the same way. */
export function innerRings(rel: OsmRelation): LatLon[][] {
  return stitch(rel, (role) => role === 'inner')
}

export function outerRings(rel: OsmRelation): LatLon[][] {
  return stitch(rel, (role) => role !== 'inner')
}

function stitch(rel: OsmRelation, want: (role: string) => boolean): LatLon[][] {
  const same = (a: LatLon, b: LatLon): boolean =>
    Math.abs(a.lat - b.lat) < 1e-9 && Math.abs(a.lon - b.lon) < 1e-9

  const parts = rel.members
    .filter((m) => want(m.role) && m.geometry && m.geometry.length > 1)
    .map((m) => m.geometry!.filter(Boolean))
  const used = new Array(parts.length).fill(false)
  const rings: LatLon[][] = []

  for (let i = 0; i < parts.length; i++) {
    if (used[i]) continue
    used[i] = true
    const ring = [...parts[i]]
    let grew = true
    while (grew) {
      grew = false
      const tail = ring[ring.length - 1]
      if (same(tail, ring[0]) && ring.length > 3) break
      for (let j = 0; j < parts.length; j++) {
        if (used[j]) continue
        const p = parts[j]
        if (same(tail, p[0])) { ring.push(...p.slice(1)); used[j] = true; grew = true; break }
        if (same(tail, p[p.length - 1])) { ring.push(...[...p].reverse().slice(1)); used[j] = true; grew = true; break }
      }
    }
    // an unclosed ring is a river running out of the bounding box; closing it across the gap is what OSM
    // renderers do too, and is right here because the box is the edge of the world anyway
    if (ring.length >= 4) rings.push(ring)
  }
  return rings
}
