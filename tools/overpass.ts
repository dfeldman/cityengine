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
  way["highway"~"^(residential|living_street|unclassified|tertiary|secondary|primary|pedestrian|footway|path|cycleway|service)$"]["area"!~"yes"](${box});
  way["highway"~"^(motorway|trunk|motorway_link|trunk_link)$"]["bridge"](${box});
  way["railway"~"^(rail|light_rail|tram|subway)$"](${box});
  way["natural"~"^(water|wood|coastline)$"](${box});
  way["waterway"="riverbank"](${box});
  way["man_made"="bridge"](${box});
  relation["natural"="water"](${box});
);
out geom qt;`
}

export function cityQuery(b: Bbox): string {
  const box = `${b.south},${b.west},${b.north},${b.east}`
  return `[out:json][timeout:240];
(
  way["highway"~"^(residential|living_street|unclassified|tertiary|secondary|primary|pedestrian|footway|path|cycleway|service)$"]["area"!~"yes"](${box});
  way["railway"~"^(rail|light_rail|tram|subway)$"](${box});
  way["building"](${box});
  way["building:part"](${box});
  way["leisure"~"^(park|garden|pitch)$"](${box});
  way["landuse"~"^(grass|forest|meadow)$"](${box});
  way["natural"~"^(water|wood)$"](${box});
  way["waterway"="riverbank"](${box});
  node["natural"="tree"](${box});
  node["name"]["shop"](${box});
  node["name"]["amenity"~"^(cafe|restaurant|bar|pub|pharmacy|bank|bakery|theatre|cinema|library|museum|post_office|hotel)$"](${box});
  node["name"]["tourism"~"^(museum|gallery|hotel|attraction)$"](${box});
  relation["natural"="water"](${box});
  relation["waterway"="riverbank"](${box});
  relation["leisure"~"^(park|garden)$"](${box});
  relation["building"](${box});
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
export function squaresQuery(b: Bbox): string {
  const box = `${b.south},${b.west},${b.north},${b.east}`
  return `[out:json][timeout:120];
(
  way["highway"="pedestrian"]["area"="yes"](${box});
  way["area:highway"~"^(pedestrian|footway|living_street)$"](${box});
  way["place"="square"](${box});
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
  if (w <= single && h <= single) return overpass(query(b))
  const nx = Math.ceil(w / step)
  const nz = Math.ceil(h / step)
  const ways = new Map<number, OsmWay>()
  const nodes = new Map<number, OsmNode>()
  const relations = new Map<number, OsmRelation>()
  let copyright = ''
  let timestamp = ''
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const chunk: Bbox = {
        west: b.west + ((b.east - b.west) * i) / nx, east: b.west + ((b.east - b.west) * (i + 1)) / nx,
        south: b.south + ((b.north - b.south) * j) / nz, north: b.south + ((b.north - b.south) * (j + 1)) / nz,
      }
      process.stderr.write(`  overpass: chunk ${j * nx + i + 1}/${nx * nz}\n`)
      for (const r of await fetchSplitting(query, chunk, 2)) {
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
async function fetchSplitting(query: (b: Bbox) => string, b: Bbox, depth: number): Promise<OverpassResult[]> {
  try {
    return [await overpass(query(b))]
  } catch (e) {
    if (depth <= 0) throw e
    process.stderr.write('  overpass: chunk refused, fetching it in quarters\n')
    const mx = (b.west + b.east) / 2
    const mz = (b.south + b.north) / 2
    const out: OverpassResult[] = []
    for (const q of [
      { west: b.west, east: mx, south: b.south, north: mz }, { west: mx, east: b.east, south: b.south, north: mz },
      { west: b.west, east: mx, south: mz, north: b.north }, { west: mx, east: b.east, south: mz, north: b.north },
    ]) out.push(...await fetchSplitting(query, q, depth - 1))
    return out
  }
}

/** Run an Overpass QL query, caching the raw JSON by query hash. */
export async function overpass(query: string): Promise<OverpassResult> {
  mkdirSync(CACHE, { recursive: true })
  const file = resolve(CACHE, `overpass-${createHash('sha1').update(query).digest('hex').slice(0, 16)}.json`)
  let text: string
  if (existsSync(file)) {
    text = readFileSync(file, 'utf8')
    process.stderr.write('  overpass: cached\n')
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
