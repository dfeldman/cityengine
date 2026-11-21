/**
 * The statues and sculptures of the Paris box that want a real model (owner, 2026-10-30: "we should also make a list of statues
 * and sculptures that need glb models"; "for sf i had you make a list of monuments and assemble pictures, and then i manually
 * sent to tripo ai"). Writes docs/landmarks/PARIS-STATUES.md, ranked, and with --photos=N a folder for each of the first N in
 * ../assetkit/statues_to_model/paris/<slug>/: Wikimedia Commons photographs, their licences, and an about.md with a prompt to
 * paste into the modeller. The folders are gitignored there, like San Francisco's, because the photographs are not ours to publish.
 *
 * The rank is what a rider gets: in the middle of a place, beside a street they can ride, by a known sculptor. Nothing is written
 * into an about.md that did not come from OSM, Wikidata or Commons, and a photograph comes from the work's own Commons category, or
 * from a search with a geotag within 200 m. Finding none is an answer, and is said so.
 *
 * A folder that already has an about.md is left as it is (--refresh makes it again).
 * --photos=N works through Paris A–C, then the hand-written sections' Paris works (D on), then Versailles (V, then G).
 *   node --experimental-strip-types tools/paris-statues.ts [--photos=60] [--refresh] [--dry]
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string): string | undefined => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1]
const X = (lon: number): number => (lon - 2.332) * 73270
const Z = (lat: number): number => (lat - 48.8605) * 111320
const OUT = resolve(ROOT, '..', 'assetkit', 'statues_to_model', 'paris')
const UA = 'cityengine-reference/0.1 (reference photographs for a city model; low volume, serial)'

type Tags = Record<string, string>
interface Work {
  name: string; kind: string; lat: number; lon: number; artist: string; date: string; height: string; material: string
  wikidata: string; commons: string; wikipedia: string; done: string; place: boolean; street: number; score: number; note?: string; own?: string
  /** where it stands, for the photo search and about.md: Paris unless Versailles' list or a hand section says otherwise */
  town?: string
}

/** Not in OSM by name, or known to the owner: the owner's own finds, and the last list's (docs/landmarks/statues.md) that stand on something else. */
const HAND: Partial<Work>[] = [
  { name: 'Fontaine de la place Gambetta', kind: 'fountain', lat: 48.86491, lon: 2.398468, note: "The owner's find: pale green blades fanning out of a low round stone basin, dark ribs at their feet, tall jets in the middle.",
    own: '/private/tmp/claude-501/-Users-dfeldman-cityengine/254d1912-69ea-4514-9468-4bf3e6f3c0f2/images/3.webp' },
  { name: 'Renommées of the Pont Alexandre III', kind: 'statue', lat: 48.8637, lon: 2.3136, note: 'The four gilded figures with Pegasus, on the pylons.' },
  { name: 'Colonne Vendôme statue of Napoleon', kind: 'statue', lat: 48.8675, lon: 2.3294, note: 'Napoleon as Caesar, on top of the column.' },
  { name: 'Fontaine du Palmier', kind: 'fountain', lat: 48.8576, lon: 2.347, note: 'The gilded Victory on the palm column, Place du Châtelet.' },
  { name: 'Fontaine des Mers', kind: 'fountain', lat: 48.8657, lon: 2.3211 },
  { name: 'Fontaine des Fleuves', kind: 'fountain', lat: 48.8652, lon: 2.3208 },
  // (owner, 2026-10-30, 48.863762, 2.335686: "this is a fountain but looks more like a hole. we can add it to the list to model in tripo")
  // (OSM has Pol Bury's two as ways 440281436 and 440281437 with no name, which the list above skips)
  { name: 'Fontaines de Pol Bury', kind: 'fountain', lat: 48.863975, lon: 2.336981, artist: 'Pol Bury', date: '1985', wikidata: '', note: 'The steel spheres in the Palais-Royal, two fountains (OSM ways 440281436 and 440281437; the other at 48.863864, 2.33747).' },
  { name: 'Fontaine du Théâtre Français - Nymphe fluviale', kind: 'fountain', lat: 48.863745, lon: 2.335562, wikidata: 'Q28861345', note: "The owner's find, on the Place André-Malraux: the city has only OSM's round of water for it. Its twin, the Nymphe marine, is 40 m west across the place." },
]

/** The Paris box, and Versailles' detail regions (the park, the old town, the Trianons) beyond its west edge. Versailles isn't
 * baked into paris-centre, so its works get their own section, ranked without the ride-graph terms. */
const PARIS_BOX = '2.20,48.80,2.43,48.92'
const VERSAILLES_BOX = '2.06,48.79,2.145,48.83'

function readOsm(bbox: string): Work[] {
  const dir = mkdtempSync(resolve(tmpdir(), 'statues-'))
  try {
    const pbf = resolve(ROOT, 'tools', 'cache', 'osm', 'ile-de-france-latest.osm.pbf')
    const box = resolve(dir, 'box.pbf')
    execFileSync('osmium', ['extract', '-b', bbox, '--overwrite', '-o', box, pbf], { stdio: 'ignore' })
    const art = resolve(dir, 'art.pbf')
    execFileSync('osmium', ['tags-filter', box, 'nwr/tourism=artwork', 'nwr/historic=memorial', 'nwr/historic=monument', 'nwr/amenity=fountain', '--overwrite', '-o', art], { stdio: 'ignore' })
    const text = execFileSync('osmium', ['export', art, '-f', 'geojsonseq'], { maxBuffer: 1 << 30 }).toString()
    const out: Work[] = []
    const seen = new Set<string>()
    for (const l of text.split('\n')) {
      const s = l.replace(/^\x1e/, '').trim()
      if (!s) continue
      const f = JSON.parse(s) as { properties: Tags; geometry: { type: string; coordinates: unknown } }
      const t = f.properties
      const kind = t.artwork_type ?? t.memorial ?? (t.amenity === 'fountain' ? 'fountain' : t.historic === 'monument' ? 'monument' : '')
      if (!/^(statue|bust|sculpture|fountain|monument|group)$/.test(kind) || !t.name || /^(indoor|yes)$/.test(t.indoor ?? '')) continue
      // (a fountain worth a model has a name of its own: "Fontaine Wallace" is a street fitting the city already draws)
      if (kind === 'fountain' && (/wallace|buvette|albien|arceau|d'eau/i.test(t.name) || !/^fontaine|^bassin/i.test(t.name))) continue
      let c = f.geometry.coordinates as number[] | number[][] | number[][][] | number[][][][]
      while (Array.isArray(c[0])) c = (c as number[][]).flat() as unknown as typeof c
      const flat = c as number[]
      let lo = 0, la = 0
      for (let i = 0; i < flat.length; i += 2) { lo += flat[i]; la += flat[i + 1] }
      lo /= flat.length / 2; la /= flat.length / 2
      const key = `${t.name}|${Math.round(la * 2000)}|${Math.round(lo * 2000)}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ name: t.name, kind, lat: la, lon: lo, artist: t.artist_name ?? t.artist ?? '', date: t.start_date ?? '', height: t.height ?? '', material: t.material ?? '',
        wikidata: t.wikidata ?? t['subject:wikidata'] ?? '', commons: t.wikimedia_commons ?? '', wikipedia: t.wikipedia ?? '', done: '', place: false, street: 1e9, score: 0 })
    }
    return out
  } finally { rmSync(dir, { recursive: true, force: true }) }
}

// ---- how much a rider gets from it
const works = readOsm(PARIS_BOX)
const vWorks = readOsm(VERSAILLES_BOX)
for (const h of HAND) works.push({ name: '', kind: '', lat: 0, lon: 0, artist: '', date: '', height: '', material: '', wikidata: '', commons: '', wikipedia: '', done: '', place: false, street: 1e9, score: 0, ...h })
const normal = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const statues = JSON.parse(readFileSync(resolve(ROOT, 'public', 'landmarks', 'paris-statues.json'), 'utf8')) as { id: string; name: string; lat?: number; lon?: number }[]
const list = Array.isArray(statues) ? statues : (statues as unknown as { statues: typeof statues }).statues
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'public', 'cities', 'paris-centre', 'v3', 'ride-bike.json'), 'utf8')) as { edges: { points: number[] | { x: number; z: number }[] }[] }
const CELL = 40
/** Same name within about this many metres is one work drawn several times. */
const SAME_WORK_M = 200
/** A name found inside another names the same work only when it is at least this share of its length. */
const NAME_SHARE = 0.6
const grid = new Set<string>()
for (const e of pkg.edges) {
  const p = e.points as number[]
  for (let i = 0; i + 1 < p.length; i += 2) grid.add(`${Math.floor(p[i] / CELL)},${Math.floor(p[i + 1] / CELL)}`)
}
const nearStreet = (x: number, z: number): number => {
  const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL)
  for (let r = 0; r <= 4; r++) for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) {
    if (Math.max(Math.abs(a), Math.abs(b)) === r && grid.has(`${cx + a},${cz + b}`)) return r * CELL
  }
  return 1e9
}
const index = JSON.parse(readFileSync(resolve(ROOT, 'public', 'cities', 'paris-centre', 'v3', 'index.json'), 'utf8')) as { legacy?: { roundabouts?: { lat?: number; lon?: number; x?: number; z?: number; r?: number }[] }; roundabouts?: { lat?: number; lon?: number; r?: number }[] }
const rings = (index.legacy?.roundabouts ?? index.roundabouts ?? []).filter((r) => r.lat !== undefined)
for (const w of works) {
  const x = X(w.lon), z = Z(w.lat)
  // (a name inside a much longer one is another work: OSM's "Lion" is not the GLB "Lion of the Monument à la République")
  const alike = (a: string, b: string): boolean => (a.includes(b) || b.includes(a)) && Math.min(a.length, b.length) >= NAME_SHARE * Math.max(a.length, b.length)
  const had = list.find((s) => (s.lat !== undefined && Math.hypot(X(s.lon!) - x, Z(s.lat) - z) < 40) || alike(normal(s.name), normal(w.name)))
  if (had) w.done = had.id
  w.place = rings.some((r) => Math.hypot(X(r.lon!) - x, Z(r.lat!) - z) < Math.max(r.r ?? 0, 14))
  w.street = nearStreet(x, z)
  w.score = (w.wikidata ? 3 : 0) + (w.artist ? 2 : 0) + (w.commons || w.wikipedia ? 1 : 0) + (w.place ? 4 : 0) + (w.street <= 40 ? 2 : w.street <= 80 ? 1 : -1)
    + (w.kind === 'bust' ? -2 : w.kind === 'statue' || w.kind === 'group' || w.kind === 'fountain' ? 1 : 0)
    + (Math.abs(x) < 5000 && Math.abs(z) < 4500 ? 1 : -1) + (w.own || w.note ? 6 : 0)
}
// (one row a work: OSM has "Les enfants du monde" as five nodes and the Arc de Triomphe, which has its own model, as its sculptures;
// the key holds the place too, or Rodin's Baiser in the Tuileries vanishes behind Brâncuși's in Montparnasse)
const once = new Map<string, Work>()
const onceKey = (w: Work): string => `${normal(w.name)}|${Math.round(Z(w.lat) / SAME_WORK_M)}|${Math.round(X(w.lon) / SAME_WORK_M)}`
for (const w of works) if (!w.done && !/^arc de triomphe$/i.test(w.name) && !(once.get(onceKey(w)) && once.get(onceKey(w))!.score >= w.score)) once.set(onceKey(w), w)
const todo = [...once.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
// Versailles: no ride graph or roundabouts there yet, and the GLB list is Paris's (a shared name like "Apollon" is another work),
// so it ranks on documentation and kind alone and is written whole, below C
const vOnce = new Map<string, Work>()
for (const w of vWorks) {
  w.score = (w.wikidata ? 3 : 0) + (w.artist ? 2 : 0) + (w.commons || w.wikipedia ? 1 : 0) + (w.kind === 'bust' ? -2 : w.kind === 'statue' || w.kind === 'group' || w.kind === 'fountain' ? 1 : 0)
  const k = onceKey(w)
  if (!(vOnce.get(k) && vOnce.get(k)!.score >= w.score)) vOnce.set(k, w)
}
const vTodo = [...vOnce.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
for (const w of vTodo) w.town = 'Versailles'
const townOf = (w: Work): string => w.town ?? 'Paris'

// The hand-written sections (from "## D" on: the Louvre and Tuileries, Wikidata's works that OSM lacks, La Défense,
// Versailles' gardens), read back from the list so their works get photo folders too (owner, 2026-11-21). A row needs a
// lat, lon (a leading ≈ is fine); its Wikidata id is any Q… in the row; one that repeats a listed work is left out.
const MD_PATH = resolve(ROOT, 'docs', 'landmarks', 'PARIS-STATUES.md')
const HAND_TOWNS: Record<string, string> = { F: 'La Défense', G: 'Versailles' }
const handRows: Work[] = []
{
  const text = existsSync(MD_PATH) ? readFileSync(MD_PATH, 'utf8') : ''
  const listed = new Set([...todo, ...vTodo].map(onceKey))
  for (const sec of text.split('\n## ').slice(1)) {
    const letter = sec[0]
    if (!/[D-Z]/.test(letter) || letter === 'V') continue
    for (const line of sec.split('\n')) {
      const c = line.split('|').map((x) => x.trim())
      if (!/^\d+$/.test(c[1] ?? '') || c.length < 8) continue
      const ll = c[6].match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
      if (!ll || !c[2]) continue
      const w: Work = { name: c[2], kind: c[3] || 'sculpture', lat: +ll[1], lon: +ll[2], artist: c[4], date: '', height: '', material: '',
        wikidata: line.match(/\bQ\d+\b/)?.[0] ?? '', commons: '', wikipedia: '', done: '', place: false, street: 1e9, score: 0,
        town: HAND_TOWNS[letter] ?? 'Paris' }
      if (!listed.has(onceKey(w))) { listed.add(onceKey(w)); handRows.push(w) }
    }
  }
}
// what --photos=N works through, in order: Paris A–C, the hand-written Paris sections, then Versailles (V, then G)
const photoQueue = [...todo, ...handRows.filter((w) => w.town !== 'Versailles'), ...vTodo, ...handRows.filter((w) => w.town === 'Versailles')]
const tier = (w: Work): string => (w.score >= 9 ? 'A' : w.score >= 6 ? 'B' : 'C')
const slugOf = (s: string): string => normal(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

// ---- one reference folder a work. Works sharing a name ("Apollon", "Lion") would share a folder and each other's photographs.
// A folder already made stays with the work its about.md places it at (img2glb specs name folders by path); the others get
// the sculptor's surname, or the place when that doesn't tell them apart. Before any folder exists the best-ranked one keeps the bare name.
const OWNER_M = 100
const folderAt = (slug: string): { lat: number; lon: number } | undefined => {
  const f = resolve(OUT, slug, 'about.md')
  if (!existsSync(f)) return undefined
  const m = readFileSync(f, 'utf8').match(/Location: [^(]*\(([-\d.]+), ([-\d.]+)\)/)
  return m ? { lat: +m[1], lon: +m[2] } : { lat: NaN, lon: NaN }
}
const slugs = new Map<Work, string>()
{
  const groups = new Map<string, Work[]>()
  for (const w of photoQueue) { const s = slugOf(w.name); (groups.get(s) ?? groups.set(s, []).get(s)!).push(w) }
  for (const [base, ws] of groups) {
    if (ws.length === 1) { slugs.set(ws[0], base); continue }
    const at = folderAt(base)
    const owner = at ? ws.find((w) => Math.hypot(X(w.lon) - X(at.lon), Z(w.lat) - Z(at.lat)) < OWNER_M) : [...ws].sort((a, b) => b.score - a.score)[0]
    const surname = (w: Work): string => slugOf(w.artist.split(/[;,&]/)[0].trim().split(/\s+/).pop() ?? '')
    for (const w of ws) {
      if (w === owner) { slugs.set(w, base); continue }
      const s = surname(w)
      const unique = s && ws.filter((o) => o !== owner && surname(o) === s).length === 1
      slugs.set(w, `${base}-${unique ? s : `${w.lat.toFixed(4)}-${w.lon.toFixed(4)}`.replace(/\./g, '')}`)
    }
  }
}
const slugFor = (w: Work): string => slugs.get(w) ?? slugOf(w.name)
if (process.argv.includes('--slugs')) for (const [w, s] of slugs) if (s !== slugOf(w.name)) console.log(`  ${s}  (${w.name}, ${w.artist || 'no sculptor'})`)

// ---- Commons, one request at a time
let last = 0
async function fetchWait(url: string): Promise<Response> {
  for (let n = 0; ; n++) {
    const wait = last + 1300 - Date.now()
    if (wait > 0) await new Promise((ok) => setTimeout(ok, wait))
    last = Date.now()
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (r.status !== 429 && r.status < 500) return r
    if (n >= 3) return r
    await new Promise((ok) => setTimeout(ok, 5000 * 3 ** n))
  }
}
interface Pic { title: string; url: string; w: number; h: number; licence: string; author: string; lat?: number; lon?: number }
async function commons(params: Record<string, string>): Promise<Pic[]> {
  const q = new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo|coordinates', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600', iiextmetadatafilter: 'LicenseShortName|Artist', colimit: '50', ...params })
  const r = await fetchWait(`https://commons.wikimedia.org/w/api.php?${q}`)
  if (!r.ok) return []
  const j = await r.json() as { query?: { pages?: Record<string, { title: string; coordinates?: { lat: number; lon: number }[]; imageinfo?: { thumburl?: string; url: string; width: number; height: number; mime: string; extmetadata?: Record<string, { value: string }> }[] }> } }
  const out: Pic[] = []
  for (const p of Object.values(j.query?.pages ?? {})) {
    const i = p.imageinfo?.[0]
    if (!i || !/jpeg|png/.test(i.mime) || Math.min(i.width, i.height) < 800) continue
    out.push({ title: p.title.replace(/^File:/, ''), url: i.thumburl ?? i.url, w: i.width, h: i.height, licence: i.extmetadata?.LicenseShortName?.value ?? '?',
      author: (i.extmetadata?.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim().slice(0, 80), lat: p.coordinates?.[0]?.lat, lon: p.coordinates?.[0]?.lon })
  }
  return out
}
/** the Commons category and a short description, from Wikidata */
async function wikidata(id: string): Promise<{ category: string; image: string; about: string }> {
  const r = await fetchWait(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|descriptions&languages=en|fr&ids=${id}`)
  if (!r.ok) return { category: '', image: '', about: '' }
  const j = await r.json() as { entities?: Record<string, { claims?: Record<string, { mainsnak?: { datavalue?: { value?: unknown } } }[]>; descriptions?: Record<string, { value: string }> }> }
  const e = j.entities?.[id]
  return { category: String(e?.claims?.P373?.[0]?.mainsnak?.datavalue?.value ?? ''), image: String(e?.claims?.P18?.[0]?.mainsnak?.datavalue?.value ?? ''),
    about: e?.descriptions?.en?.value ?? e?.descriptions?.fr?.value ?? '' }
}
const NOT_THE_WORK = /plaque|inscription|signature|d[ée]tail|panel|map\b|plan\b|panorama|carte|postcard|carte.postale|engraving|gravure|drawing|dessin|night|nuit|\bbnf\b|gallica|portrait de/i
async function picsFor(w: Work): Promise<{ pics: Pic[]; about: string; from: string }> {
  let category = w.commons.startsWith('Category:') ? w.commons.slice(9) : ''
  let about = ''
  const first: Pic[] = []
  if (w.wikidata) {
    const d = await wikidata(w.wikidata.split(';')[0])
    about = d.about
    if (!category) category = d.category
    if (d.image) first.push(...await commons({ titles: `File:${d.image}` }))
  }
  if (w.commons.startsWith('File:')) first.push(...await commons({ titles: w.commons }))
  let from = 'wikidata'
  let found: Pic[] = []
  if (category) {
    found = await commons({ generator: 'categorymembers', gcmtitle: `Category:${category}`, gcmtype: 'file', gcmlimit: '60' })
    from = `Category:${category}`
  }
  if (found.length + first.length < 2) {
    // the search, and only what is geotagged at the work: "Jeanne d'Arc" is in every town in France
    const near = await commons({ generator: 'search', gsrnamespace: '6', gsrlimit: '30',
      gsrsearch: `"${w.name.replace(/\s*\([^)]*\)/g, '').trim()}" ${townOf(w)}` })
    found.push(...near.filter((p) => p.lat !== undefined && Math.hypot(X(p.lon!) - X(w.lon), Z(p.lat!) - Z(w.lat)) < 200))
    from = category ? `${from} and a geotagged search` : 'a geotagged search'
  }
  const seen = new Set<string>()
  const ok = [...first, ...found].filter((p) => !NOT_THE_WORK.test(p.title) && !seen.has(p.title) && !!seen.add(p.title))
  // spread through the category rather than the first few, which are one person's one visit
  const rest = ok.slice(first.length ? 1 : 0)
  const step = Math.max(1, Math.floor(rest.length / 4))
  const pics = [...(first.length && ok[0] ? [ok[0]] : []), ...rest.filter((_, i) => i % step === 0)].slice(0, 4)
  return { pics, about, from }
}

const promptOf = (w: Work, about: string): string => {
  const what = w.kind === 'bust' ? 'A portrait bust' : w.kind === 'fountain' ? 'A sculptural fountain' : w.kind === 'statue' ? 'A public statue' : 'A public sculpture'
  return `${what}, ${w.name}${w.artist ? ` by ${w.artist}` : ''}, in ${townOf(w)}${about ? ` (${about})` : ''}.${w.note ? ` ${w.note}` : ''}${w.material ? ` Material: ${w.material}.` : ''} Follow the reference photographs for the pose, the proportions and the surface. A single solid object, the sculpture only, without the surroundings, people, or street behind it; keep its pedestal only if the photographs show it as part of the work.`
}

async function main(): Promise<void> {
  const N = Number(arg('photos') ?? 0)
  const found = new Map<string, { n: number; from: string }>()
  if (N > 0) console.log(`photo queue: ${todo.length} Paris A–C, ${handRows.filter((w) => w.town !== 'Versailles').length} hand-written Paris, `
      + `${vTodo.length} Versailles V, ${handRows.filter((w) => w.town === 'Versailles').length} hand-written Versailles; taking the first ${N}`)
  if (N > 0 && !process.argv.includes('--dry')) {
    mkdirSync(OUT, { recursive: true })
    for (const w of photoQueue.slice(0, N)) {
      const slug = slugFor(w)
      const dir = resolve(OUT, slug)
      // a folder already made keeps its photographs and about.md: Commons may answer differently now, and a rewritten
      // about.md would then credit the old photographs to new files (--refresh to make them again)
      if (existsSync(resolve(dir, 'about.md')) && !process.argv.includes('--refresh')) {
        found.set(slugFor(w), { n: readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).length, from: 'kept' })
        continue
      }
      mkdirSync(dir, { recursive: true })
      const { pics, about, from } = await picsFor(w)
      const used: string[] = []
      if (w.own && existsSync(w.own)) {
        writeFileSync(resolve(dir, '0-owner-view.webp'), readFileSync(w.own))
        used.push("  - `0-owner-view.webp`: the owner's Google Street View capture, 2026-10-30. Reference only; not for publishing")
      }
      let k = 0
      for (const p of pics) {
        const file = `${++k}.${/png/i.test(p.url) ? 'png' : 'jpg'}`
        const to = resolve(dir, file)
        if (!existsSync(to)) {
          const r = await fetchWait(p.url)
          if (!r.ok) { k--; continue }
          writeFileSync(to, Buffer.from(await r.arrayBuffer()))
        }
        used.push(`  - \`${file}\`: "${p.title}" (Wikimedia Commons), ${p.licence}${p.author ? `, ${p.author}` : ''}`)
      }
      found.set(slugFor(w), { n: k + (w.own ? 1 : 0), from })
      writeFileSync(resolve(dir, 'about.md'), `# ${w.name}\n\n`
        + (w.artist ? `- Sculptor: ${w.artist}${w.date ? `, ${w.date}` : ''}\n` : w.date ? `- Date: ${w.date}\n` : '')
        + `- Location: ${townOf(w)} (${w.lat.toFixed(5)}, ${w.lon.toFixed(5)})\n`
        + (w.height ? `- Height (OSM): ${w.height} m\n` : '')
        + (about ? `- Wikidata: ${about} (${w.wikidata})\n` : '')
        + (w.note ? `- Note: ${w.note}\n` : '')
        + `- Tier: ${tier(w)}${w.place ? ', the middle of a place' : ''}\n`
        + `- Images, from ${from}:\n${used.join('\n') || '  - none found'}\n\n`
        + `**Model prompt:** ${promptOf(w, about)}\n\n`
        + `**cityengine has now:** ${w.place ? 'a generic place monument, or nothing' : "a generic figure from OSM's point (render/paris/street.ts), or nothing"}.\n`)
      console.log(`${String(k).padStart(2)} photos  ${w.name}`)
    }
  }
  // (a run without --photos still reports the folders an earlier run made)
  for (const w of [...todo, ...vTodo]) {
    const dir = resolve(OUT, slugFor(w))
    if (!found.has(slugFor(w)) && existsSync(resolve(dir, 'about.md'))) found.set(slugFor(w), { n: readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).length, from: 'kept' })
  }
  const row = (w: Work, i: number): string => `| ${i + 1} | ${w.name.replace(/\|/g, '/')} | ${w.kind} | ${w.artist.replace(/\|/g, '/')} | ${vOnce.has(onceKey(w)) && vTodo.includes(w) ? 'unbaked' : w.place ? 'place' : w.street <= 40 ? 'street' : w.street <= 160 ? 'near' : 'off'} | ${w.lat.toFixed(5)}, ${w.lon.toFixed(5)} | ${found.has(slugFor(w)) ? found.get(slugFor(w))!.n : ''} |`
  const head = '| # | Work | Kind | Sculptor | Seen from | lat, lon | Photos |\n|---|---|---|---|---|---|---|\n'
  const by = (t: string): Work[] => todo.filter((w) => tier(w) === t)
  const a = by('A'), b = by('B'), c = by('C')
  // (sections from "## D" on are written by hand, from sources other than OSM: a rerun carries them over unchanged)
  const md = MD_PATH
  const old = existsSync(md) ? readFileSync(md, 'utf8') : ''
  const hand = old.indexOf('\n## D') >= 0 ? old.slice(old.indexOf('\n## D')) : ''
  writeFileSync(md, `# Paris statues and sculptures that want a real model\n\n`
    + `Written by tools/paris-statues.ts from OSM (owner, 2026-10-30). ${works.length} named works in the box; ${works.length - todo.length} already have a GLB (public/landmarks/paris-statues.json). Reference folders for the first ones: \`../assetkit/statues_to_model/paris/<slug>/\`, each with photographs and an \`about.md\` holding a prompt for the modeller.\n\n`
    + `The rank: in the middle of a place, beside a rideable street, a known sculptor, documented. "Seen from": place = the centre of a roundabout the bake found; street = within about 40 m of a rideable way. A rank is a guess at what a rider gets, not a judgement of the work; move any of them.\n\n`
    + `## A: first (${a.length})\n\n${head}${a.map(row).join('\n')}\n\n## B: worth it (${b.length})\n\n${head}${b.map(row).join('\n')}\n\n## C: if models turn up (${c.length})\n\n${head}${c.slice(0, 200).map(row).join('\n')}\n`
    + (c.length > 200 ? `\n(${c.length - 200} more, by the same rule: rerun the tool to change the cut.)\n` : '')
    + `\n## V: Versailles, from OSM (${vTodo.length})\n\nThe park, the old town and the Trianons (box ${VERSAILLES_BOX}), every named work, ranked on documentation and kind only: Versailles isn't baked, so there is no ride distance or roundabout yet, and Paris's GLB list isn't matched against it. Vases are left out, as everywhere.\n\n${head}${vTodo.map(row).join('\n')}\n`
    + hand)
  console.log(`${works.length} works, ${works.length - todo.length} with a model; A ${a.length}, B ${b.length}, C ${c.length} → docs/landmarks/PARIS-STATUES.md`)
}
void main()
