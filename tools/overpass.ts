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
);
out qt;`
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
