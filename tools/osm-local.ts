/**
 * The same OSM data, out of a local extract instead of Overpass.
 *
 * Every bake used to ask a public Overpass instance for its data, one grid chunk at a time, and a San
 * Francisco bake spent hours being told 429 and 504 by servers run on donated hardware. Chicago and New York
 * are larger still. So: download a Geofabrik extract once (`npm run osm:fetch`), cut the city's box out of it
 * with osmium, and answer the bake's queries from that — the same JSON shape Overpass returns, written into
 * the same `tools/cache/` files, so nothing downstream knows the difference.
 *
 * The seam is `overpass()`/`overpassTiled()` in overpass.ts: they call in here first and fall back to the
 * network when there is no osmium, no extract covering the box, or a query this file does not understand.
 * Understanding is deliberately narrow — a strict subset of Overpass QL, exactly the shape the queries in
 * overpass.ts are written in — because answering a query WRONG is far worse than answering it slowly. A
 * query with anything unexpected in it parses to `null` and goes to the network.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Bbox, LatLon, OsmNode, OsmRelation, OsmWay } from './overpass.ts'

export const OSM_DIR = resolve(import.meta.dirname, 'cache', 'osm')
const CUTS = resolve(OSM_DIR, 'cuts')

/**
 * The tag keys the cut keeps. `osmium tags-filter` throws away everything else, which is what makes a 144 km²
 * cut of San Francisco small enough to parse in seconds — and it is why a query naming a key that is NOT in
 * this list must go to the network: the data to answer it is not in the cut. Matched objects keep ALL their
 * tags, so a *negative* clause (`["area"!~"yes"]`) may name any key at all.
 */
export const KEPT_KEYS = [
  'highway', 'railway', 'building', 'building:part', 'leisure', 'landuse', 'natural', 'waterway',
  'man_made', 'place', 'area:highway', 'shop', 'amenity', 'tourism', 'advertising', 'emergency',
  'barrier', 'bridge', 'tunnel', 'route', 'boundary', 'historic', 'name',
  // `area` is here for squaresQuery's `["highway"="pedestrian"]["area"="yes"]`: a POSITIVE clause, so the key
  // has to survive the cut (without it the squares query fell back to Overpass, silently and slowly)
  'area',
  /*
   * `surface` is here for sandQuery's `["surface"~"^(sand)$"]["area"="yes"]` (BUGS.md #200). Without it that
   * ONE clause made the whole beach query unanswerable locally, so the query that decides whether Ocean
   * Beach is sand or lawn went to a public Overpass instance — and the bake's own handling of that is a
   * `console.warn` and an empty result. The beach is too important to hang on a donated server answering.
   * The cut's cache key includes this list, so adding a key simply re-cuts.
   */
  'surface',
]

// ---------------------------------------------------------------------------------------------- extracts

export interface Extract {
  path: string
  /** the extract's own bounding box, out of the PBF header */
  bbox: Bbox
  /** the OSM replication timestamp in the header: the vintage of the data, for the package's attribution */
  timestamp: string
}

export function osmiumAvailable(): boolean {
  try {
    execFileSync('osmium', ['--version'], { stdio: 'pipe' })
    return true
  } catch { return false }
}

/** Every `.osm.pbf` in `tools/cache/osm/`, with its header box and vintage. Read once per process. */
let EXTRACTS: Extract[] | null = null
export function extracts(): Extract[] {
  if (EXTRACTS) return EXTRACTS
  if (!existsSync(OSM_DIR)) return []
  const out: Extract[] = []
  for (const f of readdirSync(OSM_DIR)) {
    if (!f.endsWith('.osm.pbf') && !f.endsWith('.pbf')) continue
    const path = resolve(OSM_DIR, f)
    try {
      // no `-e`: the extended info reads the whole 650 MB file, and the header alone has everything wanted
      const info = execFileSync('osmium', ['fileinfo', '-j', path], { encoding: 'utf8', maxBuffer: 1 << 24 })
      // osmium fileinfo -j: header.boxes is [[left, bottom, right, top]], header.option the key/value block
      const j = JSON.parse(info) as { header?: { boxes?: number[][]; option?: Record<string, string> } }
      const box = j.header?.boxes?.[0]
      if (!box || box.length !== 4) continue
      out.push({
        path,
        bbox: { west: box[0], south: box[1], east: box[2], north: box[3] },
        timestamp: j.header?.option?.osmosis_replication_timestamp ?? j.header?.option?.timestamp ?? '',
      })
    } catch { /* not a readable extract; ignore */ }
  }
  EXTRACTS = out
  return out
}

const covers = (e: Bbox, b: Bbox): boolean =>
  e.west <= b.west && e.east >= b.east && e.south <= b.south && e.north >= b.north

/** The smallest extract that wholly contains `b`, or null — a box half outside the extract must not be cut. */
export function extractFor(b: Bbox): Extract | null {
  const fit = extracts().filter((e) => covers(e.bbox, b))
  if (!fit.length) return null
  const area = (x: Bbox): number => (x.east - x.west) * (x.north - x.south)
  return fit.sort((p, q) => area(p.bbox) - area(q.bbox))[0]
}

// ---------------------------------------------------------------------------------------------- the cut

export interface Region {
  box: Bbox
  ways: Map<number, OsmWay>
  nodes: Map<number, OsmNode>
  relations: Map<number, OsmRelation>
  timestamp: string
  source: string
}

/** `%c3%a9%`-style OPL escapes back to text. */
function unescapeOpl(s: string): string {
  if (!s.includes('%')) return s
  return s.replace(/%([0-9a-fA-F]+)%/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
}

function oplTags(field: string): Record<string, string> {
  const tags: Record<string, string> = {}
  if (!field) return tags
  for (const kv of field.split(',')) {
    const i = kv.indexOf('=')
    if (i < 0) continue
    tags[unescapeOpl(kv.slice(0, i))] = unescapeOpl(kv.slice(i + 1))
  }
  return tags
}

/** Parse an OPL file (nodes with locations, ways with locations inline, relations with members). */
export function parseOpl(text: string): Pick<Region, 'ways' | 'nodes' | 'relations'> {
  const ways = new Map<number, OsmWay>()
  const nodes = new Map<number, OsmNode>()
  const relations = new Map<number, OsmRelation>()
  for (const line of text.split('\n')) {
    if (!line) continue
    const kind = line[0]
    if (kind !== 'n' && kind !== 'w' && kind !== 'r') continue
    // fields are space-separated and each is tagged by its first letter; nothing but the leading id is
    // positional, because the columns present differ between files (Geofabrik strips user and changeset)
    const fields = line.split(' ')
    const id = Number(fields[0].slice(1))
    let tags: Record<string, string> = {}
    let refs = ''
    let members = ''
    let x = NaN
    let y = NaN
    for (let i = 1; i < fields.length; i++) {
      const f = fields[i]
      if (!f) continue
      const c = f[0]
      if (c === 'T') tags = oplTags(f.slice(1))
      else if (c === 'N') refs = f.slice(1)
      else if (c === 'M') members = f.slice(1)
      else if (c === 'x') x = Number(f.slice(1))
      else if (c === 'y') y = Number(f.slice(1))
    }
    if (kind === 'n') {
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue
      nodes.set(id, { type: 'node', id, lat: y, lon: x, tags })
    } else if (kind === 'w') {
      const ids: number[] = []
      const geometry: LatLon[] = []
      if (refs) {
        for (const r of refs.split(',')) {
          // with locations added: `n123x-122.41y37.79`; without: `n123`
          const m = /^n(-?\d+)(?:x(-?[\d.]+)y(-?[\d.]+))?$/.exec(r)
          if (!m) continue
          ids.push(Number(m[1]))
          if (m[2] !== undefined) geometry.push({ lat: Number(m[3]), lon: Number(m[2]) })
        }
      }
      // a way whose nodes were not all located is one reaching outside the cut: Overpass would have given it
      // whole, so dropping it is honest — a half-drawn street is worse than none
      if (geometry.length !== ids.length) continue
      ways.set(id, { type: 'way', id, nodes: ids, geometry, tags })
    } else {
      const mem: OsmRelation['members'] = []
      if (members) {
        for (const m of members.split(',')) {
          const mm = /^([nwr])(-?\d+)@(.*)$/.exec(m)
          if (!mm) continue
          mem.push({ type: mm[1] === 'n' ? 'node' : mm[1] === 'w' ? 'way' : 'relation', ref: Number(mm[2]), role: unescapeOpl(mm[3]) })
        }
      }
      relations.set(id, { type: 'relation', id, tags, members: mem })
    }
  }
  return { ways, nodes, relations }
}

const key = (s: string): string => createHash('sha1').update(s).digest('hex').slice(0, 16)
const down = (v: number): number => Math.floor(v * 1e6) / 1e6
const up = (v: number): number => Math.ceil(v * 1e6) / 1e6

/**
 * Cut `box` out of the extract and parse it: `osmium extract` (smart, so a multipolygon's members outside the
 * box come too — Overpass's `out geom` returns them and the ring stitching needs them), then `tags-filter`
 * down to the keys we ever ask about, then `add-locations-to-ways` so every way carries its own geometry and
 * the millions of untagged nodes can be dropped. The cut is kept on disk, so a second bake of the same city
 * skips straight to parsing.
 */
export function cut(ex: Extract, box: Bbox): Region {
  mkdirSync(CUTS, { recursive: true })
  /*
   * The cut's box is rounded OUTWARD, never inward: it is compared against the query's own (unrounded) box to
   * decide whether the region can answer, and a cut a millionth of a degree short of the query would send the
   * bake quietly back to Overpass.
   */
  const b = { west: down(box.west), south: down(box.south), east: up(box.east), north: up(box.north) }
  const stamp = key(`${ex.path}|${ex.timestamp}|${b.west},${b.south},${b.east},${b.north}|${KEPT_KEYS.join(',')}|v2`)
  const opl = resolve(CUTS, `cut-${stamp}.osm.opl`)
  if (!existsSync(opl)) {
    const tmpA = resolve(CUTS, `tmp-${stamp}-a.osm.pbf`)
    const tmpB = resolve(CUTS, `tmp-${stamp}-b.osm.pbf`)
    const t0 = Date.now()
    process.stderr.write(`  osm: cutting ${b.west},${b.south},${b.east},${b.north} out of ${ex.path.split('/').pop()}…\n`)
    execFileSync('osmium', ['extract', '-b', `${b.west},${b.south},${b.east},${b.north}`,
      '--strategy', 'smart', '-S', 'types=any', '--overwrite', '-o', tmpA, ex.path], { stdio: ['ignore', 'ignore', 'inherit'] })
    execFileSync('osmium', ['tags-filter', '--overwrite', '-o', tmpB, tmpA, ...KEPT_KEYS.map((k) => `nwr/${k}`)],
      { stdio: ['ignore', 'ignore', 'inherit'] })
    execFileSync('osmium', ['add-locations-to-ways', '--ignore-missing-nodes', '--overwrite', '-o', opl, tmpB],
      { stdio: ['ignore', 'ignore', 'inherit'] })
    for (const f of [tmpA, tmpB]) rmSync(f, { force: true })
    process.stderr.write(`  osm: cut in ${((Date.now() - t0) / 1000).toFixed(1)} s (${(statSync(opl).size / 1e6).toFixed(0)} MB)\n`)
  }
  const parsed = parseOpl(readFileSync(opl, 'utf8'))
  return { box: b, ...parsed, timestamp: ex.timestamp, source: ex.path }
}

/** The region for a box, cut and parsed at most once per process. */
const REGIONS = new Map<string, Region>()
export function regionFor(box: Bbox): Region | null {
  const b = { west: down(box.west), south: down(box.south), east: up(box.east), north: up(box.north) }
  const k = `${b.west},${b.south},${b.east},${b.north}`
  const had = REGIONS.get(k)
  if (had) return had
  /*
   * A region already in memory that CONTAINS this box answers it: a bake asks for the whole box, the detail
   * box, the steps grid, the squares and the furniture in turn, and cutting and parsing each separately would
   * cost a minute and a gigabyte for data already in hand. `answer()` filters by the query's own bbox, so a
   * bigger region cannot return more than the query asked for.
   */
  for (const r of REGIONS.values()) if (covers(r.box, b)) return r
  if (process.env.SR_NO_LOCAL_OSM) return null
  if (!osmiumAvailable()) return null
  const ex = extractFor(b)
  if (!ex) return null
  const r = cut(ex, b)
  REGIONS.set(k, r)
  return r
}

// ------------------------------------------------------------------------------------- the query subset

type Clause = { k: string; op: '' | '=' | '~' | '!=' | '!~'; v: string }
interface Selector { kind: 'way' | 'node' | 'relation'; clauses: Clause[]; bbox: Bbox }
export interface ParsedQuery { selectors: Selector[]; bbox: Bbox; geom: boolean }

/**
 * The subset: `[out:json][timeout:N]; ( <statement>; … ); out [geom] qt;` where every statement is
 * `way|node|relation` followed by `["k"]`, `["k"="v"]`, `["k"~"re"]`, `["k"!="v"]` or `["k"!~"re"]` clauses
 * and one `(south,west,north,east)`. Anything else — a recursion, a union of unions, an `area`, an
 * out-of-cut key — returns null and the caller goes to Overpass.
 */
export function parseQuery(text: string): ParsedQuery | null {
  const body = text
    .split('\n')
    .map((l) => l.replace(/\/\/.*$/, '').trim())
    .filter(Boolean)
    .join(' ')
  const m = /^\[out:json\]\[timeout:\d+\];\s*\((.*)\);\s*out\s+(geom\s+)?qt;$/.exec(body)
  if (!m) return null
  const geom = Boolean(m[2])
  const selectors: Selector[] = []
  let bbox: Bbox | null = null
  for (const raw of m[1].split(';')) {
    const s = raw.trim()
    if (!s) continue
    const sm = /^(way|node|relation)((?:\[[^\]]*\])*)\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/.exec(s)
    if (!sm) return null
    const box: Bbox = { south: Number(sm[3]), west: Number(sm[4]), north: Number(sm[5]), east: Number(sm[6]) }
    if (!bbox) bbox = box
    else if (bbox.south !== box.south || bbox.west !== box.west || bbox.north !== box.north || bbox.east !== box.east) return null
    const clauses: Clause[] = []
    for (const c of sm[2].match(/\[[^\]]*\]/g) ?? []) {
      const cm = /^\["([^"]+)"(?:(!=|!~|=|~)"([^"]*)")?\]$/.exec(c)
      if (!cm) return null
      const op = (cm[2] ?? '') as Clause['op']
      // a positive clause needs the key to have survived the cut's tags-filter; a negative one does not,
      // because a matched object keeps every tag it had
      if ((op === '' || op === '=' || op === '~') && !KEPT_KEYS.includes(cm[1])) return null
      clauses.push({ k: cm[1], op, v: cm[3] ?? '' })
    }
    selectors.push({ kind: sm[1] as Selector['kind'], clauses, bbox: box })
  }
  if (!selectors.length || !bbox) return null
  return { selectors, bbox, geom }
}

function matches(tags: Record<string, string>, clauses: Clause[]): boolean {
  for (const c of clauses) {
    const v = tags[c.k]
    if (c.op === '') { if (v === undefined) return false }
    else if (c.op === '=') { if (v !== c.v) return false }
    else if (c.op === '!=') { if (v === c.v) return false }
    else if (c.op === '~') { if (v === undefined || !new RegExp(c.v).test(v)) return false }
    // `!~` on an absent key matches, as it does in Overpass — that is why `["area"!~"yes"]` keeps plain streets
    else if (c.op === '!~') { if (v !== undefined && new RegExp(c.v).test(v)) return false }
  }
  return true
}

const inBox = (p: LatLon, b: Bbox): boolean =>
  p.lat >= b.south && p.lat <= b.north && p.lon >= b.west && p.lon <= b.east

function wayInBox(w: OsmWay, b: Bbox): boolean {
  for (const p of w.geometry) if (inBox(p, b)) return true
  return false
}

function relationInBox(rel: OsmRelation, r: Region, b: Bbox): boolean {
  for (const m of rel.members) {
    if (m.type === 'node') { const n = r.nodes.get(m.ref); if (n && inBox(n, b)) return true }
    else if (m.type === 'way') { const w = r.ways.get(m.ref); if (w && wayInBox(w, b)) return true }
  }
  return false
}

/**
 * Answer a parsed query from a region, in the shape Overpass would have: `{elements}` with `geometry` and
 * `nodes` on ways and `members` (each with its own `geometry`) on relations, plus the `osm3s` block the
 * caller reads the copyright and the data's vintage out of.
 */
export function answer(r: Region, q: ParsedQuery): string {
  const elements: (OsmWay | OsmNode | OsmRelation)[] = []
  const seenW = new Set<number>()
  const seenN = new Set<number>()
  const seenR = new Set<number>()
  for (const sel of q.selectors) {
    if (sel.kind === 'node') {
      for (const n of r.nodes.values()) {
        if (seenN.has(n.id) || !inBox(n, sel.bbox) || !matches(n.tags, sel.clauses)) continue
        seenN.add(n.id)
        elements.push(n)
      }
    } else if (sel.kind === 'way') {
      for (const w of r.ways.values()) {
        if (seenW.has(w.id) || !matches(w.tags, sel.clauses) || !wayInBox(w, sel.bbox)) continue
        seenW.add(w.id)
        elements.push(q.geom ? w : { type: 'way', id: w.id, nodes: [], geometry: [], tags: w.tags })
      }
    } else {
      for (const rel of r.relations.values()) {
        if (seenR.has(rel.id) || !matches(rel.tags, sel.clauses) || !relationInBox(rel, r, sel.bbox)) continue
        seenR.add(rel.id)
        elements.push({
          ...rel,
          members: rel.members.map((m) => {
            if (!q.geom) return m
            if (m.type === 'way') {
              const w = r.ways.get(m.ref)
              return w ? { ...m, geometry: w.geometry } : m
            }
            if (m.type === 'node') {
              const n = r.nodes.get(m.ref)
              return n ? { ...m, lat: n.lat, lon: n.lon } : m
            }
            return m
          }),
        })
      }
    }
  }
  return JSON.stringify({
    version: 0.6,
    generator: 'streetrunner osm-local (osmium)',
    source: 'local-extract',
    osm3s: {
      timestamp_osm_base: r.timestamp,
      copyright: 'The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.',
    },
    elements,
  })
}

/** The whole path: a query string and a region, to the JSON text the cache would have held. Null = not ours. */
export function localAnswer(query: string, region: Region | null): string | null {
  const q = parseQuery(query)
  if (!q) return null
  const r = region ?? regionFor(q.bbox)
  if (!r) return null
  if (!covers(r.box, q.bbox)) return null
  return answer(r, q)
}
