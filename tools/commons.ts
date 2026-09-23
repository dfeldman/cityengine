/**
 * Find a photograph of a building on Wikimedia Commons, deterministically — no model in the loop.
 *
 *   node --experimental-strip-types tools/commons.ts --osm=way/255960461 --out=<dir>
 *   node --experimental-strip-types tools/commons.ts --list=docs/sf-queue.csv --limit=5 --out=<dir>
 *
 * Research by agent cost 75k-127k tokens a building, which does not scale; every step below was tested by
 * hand first (docs/sf-batches/FIND-PHOTOGRAPHS.md) and is mechanical. Three queries, in order, stopping at
 * the first that yields a VERIFIED file:
 *
 *   1. the quoted address phrase — `"1127 Market" San Francisco`, suffix left off. The most precise query
 *      found: over ten buildings it verified four outright.
 *   2. name variants — with and without "The", `&`/`and`, old_name/alt_name, and the name plus the address.
 *   3. geosearch within 150 m, keeping only files whose FILENAME contains the number, the street or a name
 *      token. Geosearch alone is a dragnet (twenty files, one building, nineteen Pride parade photographs),
 *      but the titles are informative, so the filter does by text what a model was being paid to do by eye.
 *
 * Two filters make the result trustworthy, and they run on every step:
 *
 *   - IMAGES ONLY. `File:` also holds PDFs, DjVu scans and books; one query returned five scanned volumes.
 *   - A GEOTAG WITHIN 150 m, and anything without a geotag is DISCARDED. This is the filter that matters.
 *     The failure it prevents is not an absurd mismatch but a plausible one: "Army and Navy Y.M.C.A.
 *     Building" returns the one in Newport, Rhode Island — a real building of that name, correctly captioned,
 *     photographed from the street, and nothing about it looks wrong. Institutional names repeat in every
 *     American city and adding "San Francisco" does not fix it, because the search is full text.
 *     RETURNING NOTHING IS THE CORRECT ANSWER.
 *
 * Distance is measured to the nearest FOOTPRINT VERTEX, not the centroid: 245 Market is a block wide and a
 * camera across the street from one end is well over 150 m from the middle of it.
 *
 * Rate limits are the real constraint — Commons returned 429 after about ten requests at 1.2 s spacing — so
 * every call is spaced 4.5 s, carries a descriptive User-Agent, and is cached on disk under tools/cache, as
 * is every downloaded image. A re-run costs nothing. Coordinates and image info for up to 50 titles come
 * back in ONE call, which is where most of the saving is.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { resolveOsm, centroid, metresToRing, type Shape } from './osm-shape.ts'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')

const UA = 'streetrunner-refs/1.0 (research; https://github.com/; streetrunner)'
const API = 'https://commons.wikimedia.org/w/api.php'
const GAP = Number(arg('gap', '4500'))
const RADIUS = Number(arg('radius', '150'))
const CITY = arg('city', 'San Francisco')
const MAX_IMAGES = Number(arg('each', '4'))
/** `--from=3` skips the earlier steps: for checking that the geosearch path still works when nothing else ran */
const FROM = Number(arg('from', '1'))
const CACHE = resolve(ROOT, 'tools', 'cache', 'commons')
mkdirSync(resolve(CACHE, 'img'), { recursive: true })

const sleep = (ms: number): Promise<void> => new Promise((ok) => setTimeout(ok, ms))
let calls = 0

/** one GET against the Commons API: cached by its parameters, spaced when it is not, backing off on a 429 */
async function api(params: Record<string, string>): Promise<Record<string, unknown>> {
  const p = { format: 'json', formatversion: '2', ...params }
  const qs = new URLSearchParams(Object.entries(p).sort(([a], [b]) => a.localeCompare(b))).toString()
  const file = resolve(CACHE, `${createHash('sha1').update(qs).digest('hex')}.json`)
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'))
  for (let attempt = 0; attempt < 2; attempt++) {
    await sleep(GAP)
    calls++
    const r = await fetch(`${API}?${qs}&maxlag=5`, { headers: { 'User-Agent': UA } })
    if (r.status === 429 || r.status === 503) {
      // the owner has asked repeatedly not to get us rate-limited: wait what the server asks for, once
      const wait = Number(r.headers.get('retry-after') ?? '60') * 1000
      console.log(`  (commons ${r.status}: waiting ${Math.round(wait / 1000)} s)`)
      await sleep(wait)
      continue
    }
    if (!r.ok) { console.log(`  (commons ${r.status})`); return {} }
    const text = await r.text()
    writeFileSync(file, text)
    return JSON.parse(text)
  }
  return {}
}

const IMAGE = /\.(jpg|jpeg|png|tif|tiff|webp)$/i

/* ---------------------------------------------------------------- the building */

const SUFFIX = new Set(['street', 'st', 'avenue', 'ave', 'av', 'boulevard', 'blvd', 'road', 'rd', 'place', 'pl',
  'drive', 'dr', 'way', 'lane', 'ln', 'court', 'ct', 'terrace', 'ter', 'alley', 'plaza', 'square'])

type Building = { osm: string; name: string; numbers: string[]; street: string; names: string[]; point: [number, number]; ring: [number, number][] }

/** "Van Ness Avenue" → "Van Ness"; "The Embarcadero" is left alone. Titles abbreviate the suffix or drop it. */
const trimStreet = (s: string): string => {
  const w = s.trim().split(/\s+/)
  return w.length > 1 && SUFFIX.has(w[w.length - 1].toLowerCase().replace(/\.$/, '')) ? w.slice(0, -1).join(' ') : s.trim()
}

const building = (shape: Shape): Building => {
  const t = shape.tags
  const num = (t['addr:housenumber'] ?? '').trim()
  // a range — "245-255 Market" — is titled by either end, so try both
  const numbers = num ? Array.from(new Set(num.split(/[-–;,]/).map((n) => n.trim()).filter((n) => /^\d+$/.test(n)))) : []
  const street = trimStreet(t['addr:street'] ?? '')
  const raw = [t.name, t.official_name, t.old_name, t.alt_name, t.short_name, t['name:en']]
    .filter(Boolean).flatMap((n) => n!.split(';')).map((n) => n.trim()).filter(Boolean)
  const names = new Set<string>()
  for (const n of raw) {
    names.add(n)
    names.add(n.replace(/^The\s+/i, ''))
    if (!/^the\s/i.test(n)) names.add(`The ${n}`)
    if (n.includes('&')) names.add(n.replace(/&/g, 'and'))
    if (/\band\b/i.test(n)) names.add(n.replace(/\band\b/gi, '&'))
  }
  return { osm: shape.id, name: raw[0] ?? '', numbers, street, names: Array.from(names).filter(Boolean), point: centroid(shape.ring), ring: shape.ring }
}

/** the words of a name worth matching a filename against: nothing short, nothing every building has */
const STOP = new Set(['the', 'of', 'and', 'building', 'buildings', 'co', 'inc', 'company', 'san', 'francisco', 'general', 'office', 'new', 'old'])
const nameTokens = (b: Building): string[] =>
  Array.from(new Set(b.names.flatMap((n) => n.toLowerCase().split(/[^a-z0-9]+/)).filter((w) => w.length >= 4 && !STOP.has(w))))

/**
 * Does this filename carry the building's street number? A SHORT NUMBER MUST BE FOLLOWED BY THE STREET:
 * the Crown-Zellerbach is "1 Bush", and a bare `1` matches `panoramio (1).jpg`, `IMG_1.jpg` and every date
 * in every title — the junk class the ICA run showed off. Three digits or more is specific enough alone.
 */
const hasNumber = (low: string, b: Building): boolean => b.numbers.some((n) => n.length >= 3
  ? new RegExp(`(^|\\D)${n}(\\D|$)`).test(low)
  : new RegExp(`(^|\\D)${n}\\s+${b.street.toLowerCase().replace(/[^a-z0-9 ]/g, '')}`).test(low))

/* ---------------------------------------------------------------- Commons */

type Hit = { title: string; query: string }
type Verified = Hit & { distance: number; url: string; width: number; height: number; titled: boolean }

async function search(srsearch: string, limit = 10): Promise<string[]> {
  const j = await api({ action: 'query', list: 'search', srsearch, srnamespace: '6', srlimit: String(limit) }) as
    { query?: { search?: { title: string }[] } }
  return (j.query?.search ?? []).map((s) => s.title).filter((t) => IMAGE.test(t))
}

/**
 * Coordinates AND a 1280 px JPEG url for up to 50 titles in ONE call. `iiurlwidth` renders ANY file to a
 * JPEG at that width, TIFFs included — a 200 MB HABS scan comes back as a ~300 KB preview, which is all a
 * modeller needs. Anything with no `coordinates` is dropped here and never looked at again.
 */
async function verify(hits: Hit[], b: Building, rankByTitle = false): Promise<Verified[]> {
  const out: Verified[] = []
  const tokens = nameTokens(b)
  for (let i = 0; i < hits.length; i += 50) {
    const slice = hits.slice(i, i + 50)
    const j = await api({
      action: 'query', prop: 'coordinates|imageinfo', titles: slice.map((h) => h.title).join('|'),
      iiprop: 'url|size|mime', iiurlwidth: '1280',
    }) as { query?: { pages?: { title: string; coordinates?: { lat: number; lon: number }[]; imageinfo?: { thumburl?: string; url: string; thumbwidth?: number; thumbheight?: number; mime?: string }[] }[] } }
    for (const p of j.query?.pages ?? []) {
      const c = p.coordinates?.[0]
      if (!c) continue
      const d = metresToRing([c.lat, c.lon], b.ring)
      if (!(d <= RADIUS)) continue
      const ii = p.imageinfo?.[0]
      if (!ii || !(ii.mime ?? '').startsWith('image/')) continue
      const q = slice.find((h) => h.title.replace(/_/g, ' ') === p.title.replace(/_/g, ' '))?.query ?? ''
      /*
       * A TITLE THAT NAMES THE BUILDING IS WORTH MORE THAN PROXIMITY — checked for the NAME STEP ONLY.
       * Measured: the quoted-address query returned portraits of the building every time, but a name query
       * matches the DESCRIPTION as well as the title, so `Walking in the Streets - panoramio (5).jpg`
       * comes back for the Crown-Zellerbach — a street scene, geotagged 3 m away, with the building in it
       * somewhere. That is not wrong (it is the right place) but it is not a photograph OF the building,
       * so it sorts below anything whose own filename carries the number or the name, and is flagged
       * `weak` for whoever picks.
       */
      const low = p.title.toLowerCase()
      const titled = !rankByTitle || hasNumber(low, b) || tokens.some((t) => low.includes(t))
      out.push({ title: p.title, query: titled ? q : `${q} [weak: title does not name it]`, titled, distance: Math.round(d), url: ii.thumburl ?? ii.url, width: ii.thumbwidth ?? 0, height: ii.thumbheight ?? 0 })
    }
  }
  return out.sort((x, y) => (Number(y.titled) - Number(x.titled)) || (x.distance - y.distance))
}

/** geosearch already answers with a distance, so these need no coordinate call — only the filename filter */
async function geosearch(b: Building): Promise<{ hits: Hit[]; seen: number }> {
  const j = await api({
    action: 'query', list: 'geosearch', gscoord: `${b.point[0]}|${b.point[1]}`,
    gsradius: String(Math.max(RADIUS, 150)), gslimit: '30', gsnamespace: '6',
  }) as { query?: { geosearch?: { title: string }[] } }
  const all = (j.query?.geosearch ?? []).filter((g) => IMAGE.test(g.title))
  const tokens = nameTokens(b)
  const hits: Hit[] = []
  for (const g of all) {
    const low = g.title.toLowerCase()
    /*
     * THE STREET NAME ON ITS OWN IS NOT A MATCH, though FIND-PHOTOGRAPHS.md proposes it. Measured on the
     * ICA (345 Montgomery): a street-name filter kept four files, ALL of them geotagged within 50 m and all
     * of them of something else — the Russ Building twice, and two views along Montgomery Street. A street
     * is shared by a hundred buildings and every one of them is inside the radius, so the geotag cannot
     * break the tie. The number and the name can, and they are what found the address-titled file this
     * step exists for (`2017 ACT The Strand 1127 Market Street.jpg` matches on both).
     */
    const why = hasNumber(low, b) ? 'geosearch:number'
      : tokens.find((t) => low.includes(t)) ? 'geosearch:name'
      : ''
    if (why) hits.push({ title: g.title, query: why })
  }
  return { hits, seen: all.length }
}

/** the thumbnail bytes, cached; upload.wikimedia.org 403s without a User-Agent */
async function download(url: string, to: string): Promise<boolean> {
  const file = resolve(CACHE, 'img', `${createHash('sha1').update(url).digest('hex')}.jpg`)
  if (!existsSync(file)) {
    await sleep(GAP)
    calls++
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!r.ok) { console.log(`  (download ${r.status} ${url})`); return false }
    writeFileSync(file, Buffer.from(await r.arrayBuffer()))
  }
  writeFileSync(to, readFileSync(file))
  return true
}

/* ---------------------------------------------------------------- the recipe */

async function forBuilding(shape: Shape): Promise<{ b: Building; found: Verified[]; note: string }> {
  const b = building(shape)
  if (b.ring.length === 0) return { b, found: [], note: 'no footprint' }
  const notes: string[] = []

  // 1. the quoted address phrase: one call, and usually decisive. The BARE NUMBER is never tried — tested on
  //    four buildings it returned twelve images each and not one within 200 m.
  if (FROM <= 1 && b.numbers.length > 0 && b.street) {
    const hits: Hit[] = []
    for (const n of b.numbers) {
      const q = `"${n} ${b.street}" ${CITY}`
      for (const t of await search(q, 10)) hits.push({ title: t, query: `address: ${q}` })
    }
    const ok = await verify(hits, b)
    notes.push(`address ${hits.length}→${ok.length}`)
    if (ok.length > 0) return { b, found: ok, note: notes.join(', ') }
  } else if (FROM <= 1) notes.push('address (no addr tags)')

  // 2. the name variants
  if (FROM <= 2 && b.names.length > 0) {
    const queries = b.names.map((n) => `"${n}" ${CITY}`)
    if (b.numbers.length > 0 && b.street) queries.push(`"${b.names[0]}" ${b.numbers[0]} ${b.street} ${CITY}`)
    const hits: Hit[] = []
    const seen = new Set<string>()
    for (const q of queries.slice(0, 6)) for (const t of await search(q, 8)) if (!seen.has(t)) { seen.add(t); hits.push({ title: t, query: `name: ${q}` }) }
    const ok = await verify(hits, b, true)
    notes.push(`name ${hits.length}→${ok.length}`)
    if (ok.length > 0) return { b, found: ok, note: notes.join(', ') }
  } else if (FROM <= 2) notes.push('name (unnamed)')

  // 3. geosearch, filtered on the filename — the only thing that finds an address-titled file with no
  //    matching address tag, e.g. `2017 ACT The Strand 1127 Market Street.jpg`
  const g = await geosearch(b)
  const ok = await verify(g.hits, b)
  notes.push(`geosearch ${g.seen}→${g.hits.length}→${ok.length}`)
  return { b, found: ok, note: notes.join(', ') }
}

/* ---------------------------------------------------------------- main */

const out = resolve(arg('out', resolve(ROOT, 'docs', 'shots', 'commons')))
mkdirSync(out, { recursive: true })

const ids: string[] = []
const one = arg('osm')
const list = arg('list')
if (one) ids.push(one)
if (list) {
  for (const line of readFileSync(resolve(ROOT, list), 'utf8').split('\n')) {
    const first = line.split(',')[0].trim()
    if (/^(way|relation|node)\/\d+$/.test(first)) ids.push(first)
  }
}
const limit = Number(arg('limit', '0'))
const want = limit > 0 ? ids.slice(0, limit) : ids
if (want.length === 0) { console.error('usage: --osm=way/123 | --list=file.csv   [--out=dir]'); process.exit(1) }

const shapes = await resolveOsm(want)
const rows = ['file,osm,title,distance_m,source_query,width,height']
let hits = 0
for (const id of want) {
  const shape = shapes.get(id)
  if (!shape) { console.log(`· ${id.padEnd(18)} not in OSM`); rows.push(`,${id},,,(not in OSM),,`); continue }
  const { b, found, note } = await forBuilding(shape)
  const kept: string[] = []
  for (const v of found.slice(0, MAX_IMAGES)) {
    const file = `${id.replace('/', '-')}-${String(kept.length + 1).padStart(2, '0')}.jpg`
    if (!(await download(v.url, resolve(out, file)))) continue
    kept.push(file)
    rows.push([file, id, `"${v.title.replace(/"/g, "'")}"`, String(v.distance), `"${v.query.replace(/"/g, "'")}"`, String(v.width), String(v.height)].join(','))
  }
  if (kept.length > 0) hits++
  // nothing found is a RESULT, and it is written down as one
  else rows.push(`,${id},,,"(nothing verified: ${note.replace(/"/g, "'")})",,`)
  const label = `${b.name || '(unnamed)'}${b.numbers[0] ? ` — ${b.numbers[0]} ${b.street}` : ''}`
  console.log(`${kept.length > 0 ? '✓' : '·'} ${id.padEnd(18)} ${String(kept.length)} img  ${note.padEnd(46)} ${label}`)
}
writeFileSync(resolve(out, 'commons.csv'), rows.join('\n') + '\n')
console.log(`\n${hits} of ${want.length} buildings verified, ${calls} API calls → ${out}/commons.csv`)
