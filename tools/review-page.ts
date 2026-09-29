/**
 * The human scan: every modelled or refaced building as a real PHOTOGRAPH beside its RENDER, one row each,
 * verdicts typed with single keys.
 *
 * LADDER.md §3c ends with "after rendering, by a human scan of real photograph against render, which is the
 * only step that catches a confident wrong answer. That is what the review page exists for." This tool builds
 * that page. The verdict vocabulary IS the treatment ladder — 0 fine, 2 haiku+kit, 3 sonnet+kit, 4 sonnet
 * from scratch, 5 opus from scratch, x wrong building/bad data — so the export drops straight into the
 * decision §3c describes, instead of a pile of "needs work".
 *
 * Nothing here knows about San Francisco. The city is an argument and every path comes from it:
 *   public/landmarks/<city>.json   the manifests, in precedence order (FIRST ENTRY WINS, §7)
 *   docs/<city>-archetypes.csv     lat/lon/height for every building in the bake
 *   docs/<city>-queue.csv          priority, where a queue exists (else height is the proxy)
 *   docs/shots/refs/**             photographs, --refs= adds more directories
 *
 * Three phases, each resumable, each usable without the others:
 *
 *   node --experimental-strip-types tools/review-page.ts --city=san-francisco            index + page
 *   node --experimental-strip-types tools/review-page.ts --city=san-francisco --render   renders, resumable
 *   node --experimental-strip-types tools/review-page.ts --city=san-francisco --coverage what exists
 *
 * --render drives the real city on the dev server (5200, SHOTS_BASE overrides) and skips every render it
 * already has, so it can be stopped and restarted; --limit=N renders the top N by priority first, which is
 * the only sane order when a city has thousands. The page is built from whatever images exist: a building
 * with no photograph is SHOWN and marked, never hidden, because a render with no reference is still worth
 * scanning for obvious breakage — and the export carries that fact.
 *
 * Output: docs/review/<city>/index.html (self-contained, no network at view time), refs/, renders/,
 * missing-refs.txt (what to fetch next, highest priority first).
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, join, basename } from 'node:path'
import { readManifestFile } from '../src/city/manifest.ts'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string, f = ''): string => {
  const h = process.argv.slice(2).find((a) => a === `--${n}` || a.startsWith(`--${n}=`))
  if (!h) return f
  return h.includes('=') ? h.slice(n.length + 3) : 'true'
}
const city = arg('city')
if (!city) {
  console.log('which city? --city=<id>, as public/landmarks/<id>.json is named')
  process.exit(1)
}
const OUT = arg('out') ? resolve(arg('out')) : resolve(ROOT, 'docs', 'review', city)

/* ---------------------------------------------------------------- the entries */

export interface Entry {
  osm?: string[]
  name?: string
  procedural?: string
  restyle?: string
  height?: number
  levels?: number
  lat?: number
  lon?: number
  note?: string
  by?: string
  image?: string
  front?: string | number
  /** filled in here: which manifest file the entry came from */
  manifest?: string
}

/** One row of the page. */
export interface Item {
  id: string
  name: string
  /** the address, where the entry's note starts with one — the notes are where addresses actually live */
  address: string
  note: string
  lat?: number
  lon?: number
  height?: number
  priority: number
  /** 0–5, LADDER §3c */
  treatment: number
  /** how the treatment was arrived at, shown on the row so a wrong guess is visible */
  treatmentWhy: string
  model: string
  manifest: string
  builder: string
  /** how it was made, for grouping a scan by RUN rather than by building */
  prov: Provenance
  photos: string[]
  /** what the fetch recorded about each photograph, in the same order */
  frames: Frame[]
  /** the compass bearing the front faces, where the manifest gives one: used to aim Street View */
  front?: number
  render: string
  /** where the sort order came from for this row: the queue's priority, or height as the proxy */
  priorityFrom: 'queue' | 'height' | 'none'
}

/** Which manifest files an entry can come from, in precedence order, with the entry. */
async function entries(): Promise<Entry[]> {
  const file = resolve(ROOT, 'public', 'landmarks', `${city}.json`)
  if (!existsSync(file)) throw new Error(`no manifest for ${city}: ${file}`)
  // readManifestFile flattens includes and loses which file an entry came from, and the file is the only
  // record of WHICH PASS produced a building — so the includes are walked here as well, to label each entry.
  const label = new Map<string, string>()
  const dir = resolve(ROOT, 'public', 'landmarks')
  const walk = (rel: string): void => {
    const f = resolve(dir, rel)
    if (!existsSync(f)) return
    for (const e of JSON.parse(readFileSync(f, 'utf8')) as (Entry & { include?: string })[]) {
      if (e.include) { walk(e.include); continue }
      const k = (e.osm ?? [])[0] ?? e.name ?? ''
      if (k && !label.has(k)) label.set(k, basename(rel, '.json'))
    }
  }
  walk(`${city}.json`)
  const all = await readManifestFile<Entry>(file)
  return all.map((e) => ({ ...e, manifest: label.get((e.osm ?? [])[0] ?? e.name ?? '') ?? city }))
}

/* ---------------------------------------------------------------- geometry and priority */

const csv = (file: string): string[][] => {
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => {
    const out: string[] = []
    let cur = ''
    let q = false
    for (const ch of l) {
      if (ch === '"') { q = !q; continue }
      if (ch === ',' && !q) { out.push(cur); cur = ''; continue }
      cur += ch
    }
    out.push(cur)
    return out
  })
}

/** lat/lon/height per bare osm id, from the bake's archetype table (every building in the city). */
function archetypes(): Map<string, { lat: number; lon: number; height: number }> {
  const rows = csv(resolve(ROOT, 'docs', `${city}-archetypes.csv`))
  const m = new Map<string, { lat: number; lon: number; height: number }>()
  for (const r of rows.slice(1)) if (r.length > 3) m.set(r[0], { lat: +r[1], lon: +r[2], height: +r[3] })
  return m
}

/** where the city's queue lives, if it has one: docs/<city>-queue.csv, --queue=, or the only one in docs/ */
function queueFile(): string {
  const want = arg('queue') ? resolve(arg('queue')) : resolve(ROOT, 'docs', `${city}-queue.csv`)
  if (existsSync(want)) return want
  const cands = existsSync(resolve(ROOT, 'docs')) ? readdirSync(resolve(ROOT, 'docs')).filter((f) => /-queue\.csv$/.test(f)) : []
  return cands.length === 1 ? resolve(ROOT, 'docs', cands[0]) : want
}

/**
 * Which model actually did a building, from the append-only queue log beside the queue
 * (`<queue>-log*.csv`, LADDER §7). This is the only honest source: a manifest's NAME says which pass wrote
 * the file and the log says who was asked. Last row wins — a building redone later was done by whoever
 * redid it.
 */
function loggedModels(): Map<string, string> {
  const q = queueFile()
  const dir = resolve(ROOT, 'docs')
  const stem = basename(q, '.csv')
  const m = new Map<string, string>()
  if (!existsSync(dir)) return m
  // the logs are several files and readdir's order is alphabetical, not chronological, so the rows are
  // pooled and sorted by their own date before last-wins is applied. A log marked voided is not evidence.
  const rows: [string, string, string][] = []
  for (const f of readdirSync(dir).filter((f) => f.startsWith(`${stem}-log`) && f.endsWith('.csv') && !f.includes('voided'))) {
    const got = csv(resolve(dir, f))
    if (!got.length) continue
    const head = got[0]
    const io = head.indexOf('osm')
    const im = head.indexOf('model')
    const id = head.indexOf('date')
    if (io < 0 || im < 0) continue
    for (const r of got.slice(1)) if (r[im]) rows.push([r[io], r[im], id >= 0 ? r[id] ?? '' : ''])
  }
  rows.sort((a, b) => a[2].localeCompare(b[2]))
  for (const [osm, model] of rows) m.set(osm, model)
  return m
}

/** priority and geometry per full osm id, from the city's queue, where it has one. */
function queue(): Map<string, { lat: number; lon: number; height: number; priority: number }> {
  const rows = csv(queueFile())
  const m = new Map<string, { lat: number; lon: number; height: number; priority: number }>()
  if (!rows.length) return m
  const head = rows[0]
  const i = (n: string): number => head.indexOf(n)
  for (const r of rows.slice(1)) {
    if (r.length < head.length) continue
    m.set(r[i('osm')], { lat: +r[i('lat')], lon: +r[i('lon')], height: +r[i('height')], priority: +r[i('priority')] })
  }
  return m
}

/* ---------------------------------------------------------------- treatment (LADDER §3c) */

/**
 * What the shared kit exports (kit.ts, parts.ts, facade.ts, tower.ts, column.ts). Treatment 2/3 is "through
 * `facade()` and the shared parts" and 4/5 is "raw primitives, the kit used only where it happens to fit", so
 * the difference between them is readable from the builder's own source and is never guessed here.
 */
function kitNames(): Set<string> {
  const out = new Set<string>()
  const files = ['kit.ts', 'parts.ts', 'facade.ts', 'tower.ts', 'column.ts']
    .map((f) => resolve(ROOT, 'src', 'render', 'landmarks', f))
  // every city's recipe table counts as the kit too: LADDER §8 measures "recipes + kit" as one path
  const walk = (d: string): void => {
    if (!existsSync(d)) return
    for (const f of readdirSync(d)) {
      const q = join(d, f)
      if (statSync(q).isDirectory()) walk(q)
      else if (f === 'recipes.ts') files.push(q)
    }
  }
  walk(resolve(ROOT, 'src', 'render', 'landmarks'))
  for (const p of files) {
    if (!existsSync(p)) continue
    for (const m of readFileSync(p, 'utf8').matchAll(/^export (?:function|const) (\w+)/gm)) out.add(m[1])
  }
  return out
}

/** every source file under src/render/landmarks, so a builder's own code can be looked at */
function builderSources(): Map<string, string> {
  const out = new Map<string, string>()
  const walk = (d: string): void => {
    for (const f of readdirSync(d)) {
      const p = join(d, f)
      if (statSync(p).isDirectory()) walk(p)
      else if (f.endsWith('.ts')) out.set(p, readFileSync(p, 'utf8'))
    }
  }
  const base = resolve(ROOT, 'src', 'render', 'landmarks')
  if (existsSync(base)) walk(base)
  return out
}

/** How a building came to look the way it does — what the scan needs in order to blame a RUN, not a building. */
export interface Provenance {
  /** reface | generator | classifier */
  kind: 'reface' | 'generator' | 'classifier'
  /** the style a reface applied */
  style: string
  /** the classifier rule that chose it, where the note records one ("rule 4: ...") */
  rule: string
  /** the run that produced it: the manifest file, which is one pass of the ladder */
  run: string
  /** rejected/superseded runs are kept on disk and mean something: say so on the row */
  runNote: string
  model: string
  /** false where the model is not recorded anywhere — the treatment number then carries a "?" */
  modelSure: boolean
  kit: boolean | null
  kitCalls: number
  rawCalls: number
  builder: string
  file: string
  /** the experiment a builder came out of, where its name says so (e10_*) */
  experiment: string
  /** the commit that first added the builder's file, where git can say */
  added: string
}

/** The commit that first added a file, cached per file: provenance the manifests do not record. */
const ADDED = new Map<string, string>()
function firstCommit(file: string): string {
  if (!file) return ''
  if (ADDED.has(file)) return ADDED.get(file)!
  let out = ''
  try {
    out = execFileSync('git', ['log', '--diff-filter=A', '--format=%ad %s', '--date=short', '-1', '--', file],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n')[0] ?? ''
  } catch { out = '' }
  if (out.length > 120) out = `${out.slice(0, 117)}…`
  ADDED.set(file, out)
  return out
}

/**
 * Treatment 0–5 for an entry, and one line saying how it was decided.
 *
 * The three facts available are deterministic: whether the entry has a BUILDER at all (2+) or only a style
 * (0/1); WHICH MODEL made it, from the manifest name and the `by` field; and whether the builder's own source
 * uses the shared kit (2/3) or raw primitives (4/5). None of it is inferred from the look of the thing, and
 * where a fact is missing the row says so rather than guessing.
 */
function treatmentOf(e: Entry, src: Map<string, string>, kit: Set<string>, logged: Map<string, string>):
{ t: number; why: string; model: string; builder: string; prov: Provenance } {
  const mf = (e.manifest ?? '').toLowerCase()
  const modelOf = (): string => {
    if (e.by === 'human' || /manual|hand/.test(mf)) return 'human'
    if (e.by) return e.by
    const lg = logged.get((e.osm ?? [])[0] ?? '')
    if (lg) return lg
    if (mf.includes('opus')) return 'opus'
    if (mf.includes('sonnet')) return 'sonnet'
    if (mf.includes('haiku')) return 'haiku'
    return '?'
  }
  const model = modelOf()
  const sure = model !== '?'
  const run = e.manifest ?? ''
  // the manifests keep what failed and what was replaced, and both change how a row should be read
  const runNote = existsSync(resolve(ROOT, 'docs', 'sf-batches', `${run}-rejected.json`)) ? 'this run has rejected entries' : ''
  // the classifier writes its reason into the note: "rule 4: Russian Hill/Nob Hill apartment with >= 5 levels"
  const ruleM = /\brule\s+[\w.-]+\s*:\s*([^.;]+)/i.exec(e.note ?? '')
  const base: Provenance = {
    kind: 'classifier', style: e.restyle ?? '', rule: ruleM ? ruleM[0].trim() : '', run, runNote,
    model, modelSure: sure, kit: null, kitCalls: 0, rawCalls: 0, builder: '', file: '', experiment: '', added: '',
  }
  if (!e.procedural) {
    const t = e.restyle ? 1 : 0
    const prov: Provenance = { ...base, kind: t ? 'reface' : 'classifier' }
    return { t, why: t ? `restyle "${e.restyle}" from ${run}` : 'classifier only', model, builder: '', prov }
  }
  // find the builder's source: the district files are named after their manifest, so the search is cheap
  let body = ''
  let where = ''
  let file = ''
  for (const [p, text] of src) {
    // A DEFINITION, not a mention: `function name(`, `const name =`, or `name: (out` in a table of builders.
    // An index file that merely re-exports the name matches too loosely and yields an empty body, which then
    // reads as "no kit calls" — a wrong provenance rather than an honest unknown.
    const re = new RegExp(`(^|\\n)(export )?(function |const )${e.procedural}\\b|(^|\\n) {2}${e.procedural} ?:`)
    const m = re.exec(text)
    if (!m) continue
    const rest = text.slice(m.index)
    const end = rest.slice(1).search(/\n(export |function |const )|\n {2}\w+ ?:/)
    body = end > 0 ? rest.slice(0, end + 1) : rest.slice(0, 6000)
    where = p.replace(`${ROOT}/`, '')
    file = text
    break
  }
  const strong = model === 'opus' || model === 'human'
  const exp = (/^(e\d+)_/.exec(e.procedural) ?? [])[1] ?? ''
  const gen: Provenance = { ...base, kind: 'generator', builder: e.procedural, file: where, experiment: exp, added: firstCommit(where) }
  if (!body) {
    return { t: strong ? 5 : 3, why: `builder ${e.procedural} — source not found, kit/scratch UNKNOWN`, model, builder: e.procedural, prov: gen }
  }
  // A district file's builders mostly call LOCAL helpers (`mass`, `gridFrame`) which are themselves thin
  // wrappers over the kit. Counting only the builder's own line therefore reports "no kit calls" for a
  // builder that is nothing but kit, so each local helper it calls is expanded ONCE and its calls counted
  // too. One level, no recursion: enough to see through a wrapper, not enough to swallow the whole file.
  const callsIn = (t: string): string[] => [...t.matchAll(/\b([A-Za-z_]\w*)\s*\(/g)].map((m) => m[1])
  const rawIn = (t: string): number => [...t.matchAll(/\bout\.\w+\s*\(|\b(?:prism|strut|capPolygon|extrude)\s*\(/g)].length
  const localBody = (n: string): string => {
    const re = new RegExp(`(^|\\n)(export )?(function |const )${n}\\b`)
    const m = re.exec(file)
    if (!m) return ''
    const rest = file.slice(m.index)
    const end = rest.slice(1).search(/\n(export |function |const )|\n {2}\w+: ?\(?out/)
    return end > 0 ? rest.slice(0, end + 1) : rest.slice(0, 4000)
  }
  const calls = callsIn(body)
  let nKit = calls.filter((c) => kit.has(c)).length
  let nRaw = rawIn(body)
  let viaHelpers = 0
  for (const c of new Set(calls.filter((c) => !kit.has(c) && c !== e.procedural))) {
    const lb = localBody(c)
    if (!lb) continue
    const k = callsIn(lb).filter((x) => kit.has(x)).length
    const r = rawIn(lb)
    if (k || r) { nKit += k; nRaw += r; viaHelpers++ }
  }
  if (nKit === 0 && nRaw === 0) {
    // neither kind of call found: the body was not read properly, and saying "from scratch" would be a guess
    return { t: strong ? 5 : 3, why: `builder ${e.procedural} — could not read its calls, kit/scratch UNKNOWN · ${where}`,
      model, builder: e.procedural, prov: gen }
  }
  const usesKit = nKit > 0 && nKit >= nRaw
  const t = usesKit ? (model === 'haiku' ? 2 : 3) : (strong ? 5 : 4)
  const via = viaHelpers ? `, counting ${viaHelpers} local helper${viaHelpers > 1 ? 's' : ''}` : ''
  const why = `${usesKit ? `through the kit (${nKit} kit calls, ${nRaw} primitives${via})` : `from scratch (${nRaw} primitives, ${nKit} kit calls${via})`} · ${where}`
  return { t, why, model, builder: e.procedural, prov: { ...gen, kit: usesKit, kitCalls: nKit, rawCalls: nRaw } }
}

/* ---------------------------------------------------------------- photographs */

const IMG = /^(way|relation)[-/](\d+)(?:[-_].*)?\.(jpe?g|png|webp)$/i

/** what a fetch recorded about one frame: which Mapillary image it is, and where the camera stood */
export interface Frame { pkey?: string; bearing?: number; distance?: number }

/**
 * What the fetch wrote next to the frames (`photos.csv`), per file. Two shapes exist and both are read: one
 * row per FRAME (rank/file/bearing/distance/ref, what tools/photo.ts writes now) and one row per BUILDING
 * with parallel `files` and `sources` lists (the older batches). Everything here is optional — a frame with
 * no row still shows, it just cannot be linked to its Mapillary page or used to aim Street View.
 */
function frameMeta(dir: string): Map<string, Frame> {
  const out = new Map<string, Frame>()
  const rows = csv(join(dir, 'photos.csv'))
  if (rows.length < 2) return out
  const head = rows[0]
  const at = (n: string): number => head.indexOf(n)
  const key = (t: string): string | undefined => (/mapillary:(?:mapillary:)?(\d+)/.exec(t ?? '') ?? [])[1]
  for (const r of rows.slice(1)) {
    if (at('file') >= 0) {
      const f = r[at('file')]
      if (!f) continue
      out.set(f, { pkey: key(r[at('ref')] ?? ''), bearing: +r[at('bearing')] || undefined, distance: +r[at('distance')] || undefined })
      continue
    }
    // the per-building shape: "a.jpg b.jpg" against "mapillary:1 (360) | mapillary:2 (360)", in order
    const files = (r[at('files')] ?? '').split(/\s+/).filter(Boolean)
    const srcs = (r[at('sources')] ?? '').split('|')
    files.forEach((f, i) => out.set(f, { pkey: key(srcs[i] ?? '') }))
  }
  return out
}

/** every photograph on disk, per full osm id, best first. Sources are flattened away on purpose: the page
 *  must not care whether a frame came from Mapillary, Commons or somewhere added later. */
function photoIndex(dirs: string[], meta: Map<string, Frame>): Map<string, string[]> {
  const m = new Map<string, string[]>()
  const add = (id: string, f: string): void => { if (!m.has(id)) m.set(id, []); if (!m.get(id)!.includes(f)) m.get(id)!.push(f) }
  const walk = (d: string): void => {
    if (!existsSync(d)) return
    for (const [f, v] of frameMeta(d)) meta.set(join(d, f), v)
    for (const f of readdirSync(d)) {
      const p = join(d, f)
      let st
      try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) { walk(p); continue }
      const mm = IMG.exec(f)
      if (mm) add(`${mm[1]}/${mm[2]}`, p)
    }
  }
  for (const d of dirs) walk(resolve(ROOT, d))
  // "-01", "-02" is the fetch's own ranking; plain "<id>.jpg" is a single chosen frame and sorts first
  for (const v of m.values()) v.sort((a, b) => basename(a).length - basename(b).length || a.localeCompare(b))
  return m
}

/* ---------------------------------------------------------------- the index */

const slug = (s: string): string => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()

async function index(): Promise<Item[]> {
  const es = await entries()
  const arch = archetypes()
  const q = queue()
  const src = builderSources()
  const kit = kitNames()
  const logged = loggedModels()
  const refDirs = [...(arg('refs') ? arg('refs').split(',') : []), 'docs/shots/refs']
  const meta = new Map<string, Frame>()
  const photos = photoIndex(refDirs, meta)

  const seen = new Set<string>()
  const items: Item[] = []
  for (const e of es) {
    const id = (e.osm ?? [])[0] ?? `${e.manifest}/${slug(e.name ?? 'unnamed')}`
    if (seen.has(id)) continue // FIRST ENTRY WINS (LADDER §7): a later cheap pass never supersedes this one
    seen.add(id)
    // the archetype table's ids are bare WAY ids: a relation's id looked up there is a different building
    const bare = id.startsWith('relation/') ? '' : id.split('/')[1]
    const g = q.get(id) ?? (bare ? arch.get(bare) : undefined)
    const lat = e.lat ?? g?.lat
    const lon = e.lon ?? g?.lon
    const height = e.height ?? g?.height
    const { t, why, model, builder, prov } = treatmentOf(e, src, kit, logged)
    const note = e.note ?? ''
    const addr = /^(\d[\w\d –-]{0,30}(?:St|Street|Ave|Avenue|Blvd|Road|Rd|Way|Place|Pl|Sq|Drive|Dr|Lane|Ln|Terrace)\b\.?)/i.exec(note)
    const ph = [...(photos.get(id) ?? [])]
    if (e.image) {
      const own = resolve(ROOT, e.image)
      if (existsSync(own)) { const k = ph.indexOf(own); if (k >= 0) ph.splice(k, 1); ph.unshift(own) }
    }
    items.push({
      id,
      name: e.name || `Unnamed ${id}`,
      address: addr ? addr[1] : '',
      note,
      lat,
      lon,
      height,
      priority: q.get(id)?.priority ?? height ?? 0,
      priorityFrom: q.has(id) ? 'queue' : height !== undefined ? 'height' : 'none',
      treatment: t,
      treatmentWhy: why,
      model,
      manifest: e.manifest ?? '',
      builder,
      prov,
      photos: ph,
      frames: ph.map((f) => meta.get(f) ?? {}),
      front: typeof e.front === 'number' ? e.front : undefined,
      render: '',
    })
  }
  // most prominent first: a scan abandoned halfway must still have covered the buildings that matter
  items.sort((a, b) => b.priority - a.priority)
  return items
}

/* ---------------------------------------------------------------- phases */

function coverage(items: Item[]): void {
  const withPhoto = items.filter((i) => i.photos.length).length
  const withRender = items.filter((i) => existsSync(join(OUT, 'renders', `${slug(i.id)}.png`))).length
  const byT = new Map<number, number>()
  for (const i of items) byT.set(i.treatment, (byT.get(i.treatment) ?? 0) + 1)
  console.log(`${city}: ${items.length} buildings (deduped, first entry wins)`)
  console.log(`  photographs: ${withPhoto} have at least one, ${items.length - withPhoto} have none`)
  console.log(`  renders:     ${withRender} on disk, ${items.length - withRender} to shoot`)
  console.log(`  treatments:  ${[...byT].sort((a, b) => a[0] - b[0]).map(([t, n]) => `${t}:${n}`).join('  ')}`)
  const byM = new Map<string, number>()
  for (const i of items) byM.set(i.model, (byM.get(i.model) ?? 0) + 1)
  console.log(`  models:      ${[...byM].sort((a, b) => b[1] - a[1]).map(([m, n]) => `${m}:${n}`).join('  ')}`)
  const kitN = items.filter((i) => i.prov.kit === true).length
  const rawN = items.filter((i) => i.prov.kit === false).length
  const unk = items.filter((i) => i.prov.kind === 'generator' && i.prov.kit === null).length
  console.log(`  measured:    kit:${kitN}  scratch:${rawN}  unreadable:${unk} — kit-vs-scratch is read from the builder's source`)
  console.log(`  recorded:    ${items.filter((i) => i.prov.modelSure).length} of ${items.length} rows say which model did the work; the rest show a "?" on the treatment`)
  const byP = new Map<string, number>()
  for (const i of items) byP.set(i.priorityFrom, (byP.get(i.priorityFrom) ?? 0) + 1)
  console.log(`  sorted by:   ${[...byP].map(([k, n]) => `${k}:${n}`).join('  ')}`)
  const frames = items.reduce((n, i) => n + i.photos.length, 0)
  console.log(`  frames:      ${frames} image files in total`)
}

function writePage(items: Item[]): void {
  const sight = readSight()
  mkdirSync(join(OUT, 'refs'), { recursive: true })
  mkdirSync(join(OUT, 'renders'), { recursive: true })
  const page = items.map((i) => {
    const s = slug(i.id)
    const ph: string[] = []
    i.photos.slice(0, 8).forEach((p, n) => {
      const ext = p.split('.').pop()!.toLowerCase()
      const dest = join(OUT, 'refs', `${s}-${n}.${ext}`)
      try { if (!existsSync(dest)) copyFileSync(p, dest) } catch { return }
      ph.push(`refs/${s}-${n}.${ext}`)
    })
    // every view that exists, standalone first: it is the one that answers "is the model any good" when a
    // neighbour is across the street-level views
    const shots: { key: string; src: string }[] = []
    for (const [k, label] of [['solo', 'on its own'], ['a', 'in context'], ['b', 'other side'], ['air', 'from above']] as const) {
      const f = `${s}-${k}.png`
      if (existsSync(join(OUT, 'renders', f))) shots.push({ key: label, src: `renders/${f}` })
    }
    // the first pass's single fixed-bearing shot, kept only while a row has nothing better
    if (shots.length < 2 && existsSync(join(OUT, 'renders', `${s}.png`))) shots.push({ key: 'first pass', src: `renders/${s}.png` })
    const r = shots.length ? shots[0].src : ''
    const g = sight[i.id]
    return {
      id: i.id, name: i.name, address: i.address, note: i.note, height: i.height, priority: Math.round(i.priority),
      treatment: i.treatment, why: i.treatmentWhy, model: i.model, manifest: i.manifest, builder: i.builder,
      sortedBy: i.priorityFrom, photos: ph, render: r,
      // the two provenance facts that matter most, at the top level as well as inside prov: kit-vs-scratch is
      // MEASURED from the builder's source, modelSure says whether the model is recorded anywhere at all
      kit: i.prov.kit, modelSure: i.prov.modelSure,
      shots,
      // what the geometry said about being able to see it at all
      openBearings: g ? g.open : null, totalBearings: g ? g.total : null, hemmed: g ? !!g.hemmed : false,
      // the OSM id is carried THROUGH, never rebuilt: a packed relation id is N*2+1 and a link derived from
      // one points confidently at the wrong object, which is worse than no link
      osm: i.id.startsWith('way/') || i.id.startsWith('relation/') ? i.id : '',
      lat: i.lat, lon: i.lon, front: i.front,
      frames: i.frames.slice(0, 8).map((f) => ({ pkey: f.pkey ?? '', bearing: f.bearing, distance: f.distance })),
      prov: i.prov,
    }
  })
  const missing = items.filter((i) => !i.photos.length)
  writeFileSync(join(OUT, 'missing-refs.txt'),
    `${missing.length} of ${items.length} buildings in ${city} have no photograph on disk, highest priority first.\n`
    + 'Fetch, respecting the rate limit (docs/sf-batches/FIND-PHOTOGRAPHS.md: quoted address first, city always,\n'
    + 'verify the geotag within 150 m, 4-5 seconds between calls), then re-run this tool to pick them up:\n'
    + '  node --experimental-strip-types tools/sf-photos.ts --list=<file>\n\n'
    + missing.map((i) => `${i.id}\t${Math.round(i.priority)}\t${i.name}\t${i.address}`).join('\n') + '\n')
  // where the live app is, for the per-row "open it in the app" link: ?city=<id>&at=<lat>,<lon> is read by
  // src/main.ts (parseLatLon → game opts.at), so the deep link needs nothing added to the app
  const app = arg('app', `http://localhost:${arg('port', '5200')}`)
  const basis = { queue: items.filter((i) => i.priorityFrom === 'queue').length, height: items.filter((i) => i.priorityFrom === 'height').length }
  const recorded = items.filter((i) => i.prov.modelSure).length
  const data = JSON.stringify({ city, generated: new Date().toISOString(), basis, recorded, app, items: page })
  writeFileSync(join(OUT, 'index.html'), html(data))
  console.log(`${join(OUT, 'index.html')}  (${page.length} rows, ${page.filter((p) => p.photos.length).length} with a photograph, ${page.filter((p) => p.render).length} with a render)`)
  console.log(join(OUT, 'missing-refs.txt'))
}

/* ---------------------------------------------------------------- the renders */

/**
 * WHERE THE BUILDING CAN BE SEEN FROM, computed from the baked footprints before a single frame is shot.
 *
 * The first version of this tool stood in one fixed place, and over half the rows came back with a
 * neighbour's wall across them: the owner could not tell a bad model from a blocked camera. Shooting four
 * angles and hoping is the expensive way to fix that — 960 rows times six seconds an angle — so the open
 * directions are worked out from geometry instead, and only the open ones are shot.
 *
 * For each of 36 bearings a corridor is marched out from the subject: any neighbour whose top rises above
 * the sight line from the camera down to the middle of the subject blocks it, in proportion to how far
 * above. The two most open bearings at least 50 degrees apart become the two street-level views; a raised
 * oblique goes with them as a matter of course, because a camera above the roofline is rarely blocked by
 * anything. Where every bearing is blocked the row is MARKED as such — "this cannot be seen from the
 * street" is a true answer about the city, and it stops a reviewer scoring the model for it.
 */
const SIGHT = `(sub, H, cam, osmId) => {
  const tiles = window.__tiles
  if (!tiles) return null
  const near = []
  let own = null
  // A MODELLED landmark's outline is dropped from the tile footprints (render/landmarks.ts isReplaced), so
  // the buildings most likely to stand in front of the subject — the modelled ones, downtown — are invisible
  // to a footprint-only check. __placed() gives them back as oriented boxes.
  try {
    for (const l of (window.__placed ? window.__placed() : [])) {
      const rad = Math.hypot(l.hx || 8, l.hz || 8)
      const d = Math.hypot(l.x - sub.x, l.z - sub.z)
      if (d > 320) continue
      const c = Math.cos(l.rotation || 0), s2 = Math.sin(l.rotation || 0)
      const ring = []
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const px = sx * (l.hx || 8), pz = sz * (l.hz || 8)
        ring.push(l.x + px * c - pz * s2, l.z + px * s2 + pz * c)
      }
      if (d < 8) continue
      near.push({ cx: l.x, cz: l.z, rad, d, ring, h: l.height || 20, min: 0 })
    }
  } catch (e) { /* a city without placed landmarks is fine */ }
  for (const t of tiles.values()) for (const b of t.buildings) {
    const r = b.ring
    if (!r || r.length < 6) continue
    let cx = 0, cz = 0, n = 0, rad = 0
    for (let k = 0; k + 1 < r.length; k += 2) { cx += r[k]; cz += r[k + 1]; n++ }
    cx /= n; cz /= n
    for (let k = 0; k + 1 < r.length; k += 2) rad = Math.max(rad, Math.hypot(r[k] - cx, r[k + 1] - cz))
    const d = Math.hypot(cx - sub.x, cz - sub.z)
    // the subject's own footprint: the ring it stands INSIDE, else the nearest centroid within 30 m. A
    // landmark-modelled building has had its outline replaced, so this often finds nothing and the
    // fallback size is used — which is why the standalone shot carries its own fit when it has one.
    let inside = false
    for (let k = 0, j2 = r.length - 2; k + 1 < r.length; j2 = k, k += 2) {
      if ((r[k + 1] > sub.z) !== (r[j2 + 1] > sub.z)
        && sub.x < ((r[j2] - r[k]) * (sub.z - r[k + 1])) / (r[j2 + 1] - r[k + 1]) + r[k]) inside = !inside
    }
    if ((inside || d < 30) && (!own || inside || d < own.d)) own = { d: inside ? 0 : d, cx, cz, rad, ring: r, h: (b.height || 0) + (b.roofHeight || 0) }
    if (d < 320) near.push({ cx, cz, rad, d, ring: r, h: (b.height || 0) + (b.roofHeight || 0), min: b.minHeight || 0 })
  }
  // THE REAL OUTLINE. A landmark's own footprint is dropped from the tile buildings, so the nearest-ring
  // search above misses exactly the modelled buildings; render/landmarks.ts keeps them in its byId table,
  // which is what it fits a builder to. Ask that first and fall back to the tiles.
  let plan = own ? own.ring : null
  try {
    const lm = window.__landmarks
    const kept = lm && lm.byId && osmId ? lm.byId.get(osmId) : null
    if (kept && kept.ring && kept.ring.length >= 6) plan = kept.ring
    else if (lm && lm.byId && osmId) {
      // a superseded outline (bake.ts drops one its grounded parts cover, BUGS.md #100) has no ring of its
      // own: the building is its PARTS, and the app fits to their hull. Salesforce Tower is ten of them.
      const pts = []
      // render/landmarks.ts keeps the parts of a superseded outline in partsOf, keyed by that outline's id
      const kept2 = lm.partsOf && lm.partsOf.get ? (lm.partsOf.get(osmId) || []) : []
      for (const b2 of kept2) if (b2 && b2.ring) for (let k = 0; k + 1 < b2.ring.length; k += 2) pts.push([b2.ring[k], b2.ring[k + 1]])
      for (const b2 of lm.byId.values()) if (b2 && b2.partOf === osmId && b2.ring) for (let k = 0; k + 1 < b2.ring.length; k += 2) pts.push([b2.ring[k], b2.ring[k + 1]])
      if (pts.length >= 3) {
        pts.sort((p, q) => p[0] - q[0] || p[1] - q[1])
        const cross = (o, a2, b3) => (a2[0] - o[0]) * (b3[1] - o[1]) - (a2[1] - o[1]) * (b3[0] - o[0])
        const lower = []
        for (const q of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q) }
        const upper = []
        for (let k = pts.length - 1; k >= 0; k--) { const q = pts[k]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q) }
        const hull = lower.slice(0, -1).concat(upper.slice(0, -1))
        if (hull.length >= 3) { plan = []; for (const q of hull) plan.push(q[0], q[1]) }
      }
    }
  } catch (e) { /* an older build without the table: the tile footprint stands */ }
  const size = own ? own.rad : 15
  const h = Math.max(6, H || (own ? own.h : 20))
  // the oriented box of the subject's own footprint, for the standalone shot on a real plot
  let hx = size, hz = size, heading = 0
  let frame = null
  if (plan) {
    // the model's own frame (render/landmarks.ts inFrame): world = centre + (x cos th + z sin th, -x sin th + z cos th)
    let px = 0, pz = 0, pn = 0
    for (let k = 0; k + 1 < plan.length; k += 2) { px += plan[k]; pz += plan[k + 1]; pn++ }
    px /= pn; pz /= pn
    let best = null
    for (let a = 0; a < 180; a += 2) {
      const th = (a * Math.PI) / 180
      const c = Math.cos(th), sn = Math.sin(th)
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9
      for (let k = 0; k + 1 < plan.length; k += 2) {
        const dx = plan[k] - px, dz = plan[k + 1] - pz
        const X = dx * c - dz * sn, Z = dx * sn + dz * c
        x0 = Math.min(x0, X); x1 = Math.max(x1, X); z0 = Math.min(z0, Z); z1 = Math.max(z1, Z)
      }
      const area = (x1 - x0) * (z1 - z0)
      if (!best || area < best.area) best = { area, x0, x1, z0, z1, th, c, sn }
    }
    if (best) {
      hx = (best.x1 - best.x0) / 2
      hz = (best.z1 - best.z0) / 2
      heading = best.th
      // the box's centre, not the centroid: that is what the fit is measured about
      const mx = (best.x0 + best.x1) / 2, mz = (best.z0 + best.z1) / 2
      const ring = []
      for (let k = 0; k + 1 < plan.length; k += 2) {
        const dx = plan[k] - px, dz = plan[k + 1] - pz
        ring.push({ x: dx * best.c - dz * best.sn - mx, z: dx * best.sn + dz * best.c - mz })
      }
      // anticlockwise, like an outline
      let area2 = 0
      for (let k = 0; k < ring.length; k++) { const j = (k + 1) % ring.length; area2 += ring[k].x * ring[j].z - ring[j].x * ring[k].z }
      frame = area2 < 0 ? ring.reverse() : ring
    }
  }
  const D = cam.dist, A = cam.alt
  const scored = []
  for (let deg = 0; deg < 360; deg += 10) {
    const th = (deg * Math.PI) / 180
    const ux = Math.sin(th), uz = Math.cos(th)
    let block = 0
    let firstAt = D
    // WHERE THE CAMERA STANDS matters as much as what is in front of it: a viewpoint inside a neighbour's
    // wall renders a wall, and the first version of this did exactly that on the ICA. A bearing whose camera
    // point falls inside (or right against) a footprint is not a bearing.
    const camX = sub.x + ux * D, camZ = sub.z + uz * D
    let occupied = false
    for (const b of near) {
      if (Math.hypot(b.cx - camX, b.cz - camZ) > b.rad + 6) continue
      const r = b.ring
      let inside = false
      for (let k = 0, j2 = r.length - 2; k + 1 < r.length; j2 = k, k += 2) {
        if ((r[k + 1] > camZ) !== (r[j2 + 1] > camZ)
          && camX < ((r[j2] - r[k]) * (camZ - r[k + 1])) / (r[j2 + 1] - r[k + 1]) + r[k]) inside = !inside
      }
      if (inside || Math.hypot(b.cx - camX, b.cz - camZ) < b.rad * 0.5) { occupied = true; break }
    }
    if (occupied) { scored.push({ deg, block: 900, firstAt: 0 }); continue }
    for (const b of near) {
      if (b.d < size * 0.9) continue
      const along = (b.cx - sub.x) * ux + (b.cz - sub.z) * uz
      const side = Math.abs(-(b.cx - sub.x) * uz + (b.cz - sub.z) * ux)
      if (along < size * 0.6 || along > D) continue
      if (side > Math.max(size, 10) + b.rad * 0.7) continue
      // the sight line runs from the camera down to the middle of the subject
      const line = h * 0.5 + ((A - h * 0.5) * along) / D
      const over = b.h - line
      if (over > 0) { block += over * Math.min(1, 40 / Math.max(10, along)); firstAt = Math.min(firstAt, along) }
    }
    scored.push({ deg, block, firstAt })
  }
  scored.sort((a, b) => a.block - b.block || b.firstAt - a.firstAt)
  const open = scored.filter((s) => s.block <= 0.5).length
  // two bearings, and they must be genuinely different: the same view twice is the same blind spot twice
  // Two bearings, and they must be genuinely different: the same view twice is the same blind spot twice.
  // Among equally open directions the WIDEST separation wins — two faces of the building rather than one
  // seen twice — and where openness differs the clearer view is worth more than the wider angle.
  const pick = [scored[0]]
  let second = null
  for (const s of scored) {
    const sep = Math.abs(((s.deg - pick[0].deg + 540) % 360) - 180)
    if (sep < 50) continue
    const score = -s.block * 4 + Math.min(sep, 140) / 140
    if (!second || score > second.score) second = { ...s, score }
  }
  if (second) pick.push(second)
  if (pick.length < 2) pick.push({ deg: (pick[0].deg + 120) % 360, block: pick[0].block, firstAt: pick[0].firstAt })
  // Where no outline survives at all (a superseded one whose parts the bake consumed), the app itself has
  // already fitted the builder: __placed() carries the hx/hz it used. That is not a ring, but it is the real
  // box rather than a guess, and it is what the context shots were drawn from.
  if (!frame) {
    try {
      let bestP = null
      for (const l of (window.__placed ? window.__placed() : [])) {
        const d = Math.hypot(l.x - sub.x, l.z - sub.z)
        if (d < 40 && (!bestP || d < bestP.d) && l.hx && l.hz) bestP = { d, hx: l.hx, hz: l.hz, rot: l.rotation || 0 }
      }
      if (bestP) { hx = bestP.hx; hz = bestP.hz; heading = bestP.rot }
    } catch (e) { /* no placed landmarks: the default box stands */ }
  }
  let tallest = 0
  for (const b of near) if (b.d < 140) tallest = Math.max(tallest, b.h)
  return { size, h, hx, hz, heading, tallest: Math.round(tallest),
    // the footprint in the model's own frame, which is what a builder raised from its own outline needs
    plan: frame ? frame.map((q) => [Math.round(q.x * 100) / 100, Math.round(q.z * 100) / 100]) : null,
    // where the footprint actually is: a manifest's lat/lon can sit in the road, and a camera aimed there
    // centres the ring on tarmac beside the building it is meant to be judging
    centre: own ? { x: own.cx, z: own.cz } : null, open, total: scored.length, bearings: pick.map((s) => s.deg),
    blocked: pick.map((s) => Math.round(s.block)), worst: Math.round(scored[scored.length - 1].block) }
}`

/** what the geometry said about one building, kept beside the renders so neither pass recomputes it */
interface Sight { plan?: [number, number][] | null; centre?: { x: number; z: number } | null; size: number; h: number; hx: number; hz: number; heading: number; tallest: number; open: number; total: number; bearings: number[]; blocked: number[]; hemmed?: boolean }

const sightFile = (): string => join(OUT, 'sight.json')
function readSight(): Record<string, Sight> {
  try { return JSON.parse(readFileSync(sightFile(), 'utf8')) as Record<string, Sight> } catch { return {} }
}

/** One log line, to the console and to a file, so a long pass can be watched without attaching to it. */
function logTo(file: string, line: string): void {
  console.log(line)
  try { appendFileSync(file, `${line}\n`) } catch { /* the log is a convenience, never the job */ }
}

/**
 * The in-context renders: two street-level views down the open bearings, and one raised oblique.
 *
 * Resumable at IMAGE granularity — every shot checks for its own file — because a pass that dies at row 700
 * with three of four images done must not redo the three. Several agents drive headless Chromium against
 * this city at once and it does die.
 */
async function render(items: Item[]): Promise<void> {
  const { chromium } = await import('playwright')
  const { Projection } = await import('../src/city/geo.ts')
  const BASE = process.env.SHOTS_BASE ?? `http://localhost:${arg('port', '5200')}`
  mkdirSync(join(OUT, 'renders'), { recursive: true })
  const log = arg('log') ? resolve(arg('log')) : join(OUT, 'render.log')
  const limit = Number(arg('limit', '0'))
  const angles = ['a', 'b', 'air']
  const sightOnly = !!arg('sight')
  const has = (i: Item): boolean => angles.every((k) => existsSync(join(OUT, 'renders', `${slug(i.id)}-${k}.png`)))
  let todo = items.filter((i) => i.lat !== undefined && (sightOnly || !has(i)))
  if (arg('only')) { const want = arg('only').split(','); todo = items.filter((i) => want.some((w) => i.id.includes(w) || i.name.includes(w))) }
  if (limit > 0) todo = todo.slice(0, limit)
  // --limit picks WHICH buildings by priority; the order they are shot in is geographic, because the city
  // streams round the camera and a jump across town costs seconds of tile loading. Serpentine by latitude
  // band: the camera walks the city instead of ping-ponging over it.
  todo.sort((a, b) => {
    const band = (i: Item): number => Math.floor(i.lat! * 555)
    const d = band(a) - band(b)
    return d !== 0 ? d : (band(a) % 2 ? b.lon! - a.lon! : a.lon! - b.lon!)
  })
  logTo(log, `${todo.length} to render (of ${items.length}; ${items.filter((i) => i.lat === undefined).length} have no position and cannot be)`)
  if (!todo.length) return
  const sight = readSight()
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
  const page = await browser.newPage({ viewport: { width: 760, height: 620 } })
  page.on('pageerror', () => { /* one broken builder must not stop the batch */ })
  // the dev server hot-reloads whenever anyone edits the app — and several agents work in this repo at once.
  // A reload throws away window.__view mid-batch, so readiness is a function that can be called again.
  const ready = async (): Promise<void> => {
    await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 240_000 })
    // the interface off: menus, HUD, minimap and toasts are not what is being judged (tools/views.ts does the same)
    await page.addStyleTag({ content: 'body > *:not(canvas):not(#app):not(.sr-keep), #minimap { visibility: hidden !important }' })
    await page.waitForTimeout(1200)
  }
  await page.goto(`${BASE}/?city=${city}&freeze=1&without=life`)
  await ready()
  const origin = await page.evaluate('window.__pkg.origin') as { lat: number; lon: number }
  const proj = new Projection(origin)
  const idle = Number(arg('idle', '8000'))
  const settle = Number(arg('settle', '350'))
  const t0 = Date.now()
  let done = 0
  let shots = 0
  for (const i of todo) {
    try {
      if (!await page.evaluate('typeof window.__view === "function"')) await ready()
      const h = Math.max(8, i.height ?? 20)
      const dist = Math.min(450, Math.max(58, h * 1.05 + 30))
      const alt = Math.max(18, h * 0.6)
      const sub = proj.toLocal({ lat: i.lat!, lon: i.lon! })
      // stream the city in round the building before asking what can be seen from where
      await page.evaluate(`window.__view([${i.lat}, ${i.lon}, ${Math.max(90, h * 1.4)}], [${i.lat}, ${i.lon}, 0])`)
      await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: idle }).catch(() => {})
      const bareId = Number(i.id.split('/')[1]) || 0
      const seen = await page.evaluate(`(${SIGHT})(${JSON.stringify(sub)}, ${h}, { dist: ${dist}, alt: ${alt} }, ${bareId})`) as Sight | null
      if (seen) {
        sight[i.id] = { ...seen, hemmed: seen.open === 0 }
        writeFileSync(sightFile(), JSON.stringify(sight, null, 0))
      }
      const bearings = seen?.bearings?.length ? seen.bearings : [140, 320]
      // aim at the footprint's own centre where the geometry found one
      const at = seen?.centre ? proj.toLatLon({ x: seen.centre.x, z: seen.centre.z }) : { lat: i.lat!, lon: i.lon! }
      const views: [string, number, number, number][] = [
        ['a', bearings[0], dist, alt],
        ['b', bearings[1] ?? (bearings[0] + 130) % 360, dist, alt],
        // The raised oblique, and it is STEEP on purpose: a long lateral offset at height simply puts the
        // camera inside the tower across the street. Close in and high above the tallest thing nearby, it
        // looks down into the block and cannot be blocked by it.
        ['air', bearings[0], Math.max(45, h * 1.1), Math.max((seen?.tallest ?? 0) + 30, h * 1.5 + 30, 60)],
      ]
      for (const [k, deg, D, A] of (sightOnly ? [] : views)) {
        const dest = join(OUT, 'renders', `${slug(i.id)}-${k}.png`)
        if (existsSync(dest)) continue
        const b = (deg * Math.PI) / 180
        const dLat = (Math.cos(b) * D) / 111320
        const dLon = (Math.sin(b) * D) / (111320 * Math.cos((at.lat * Math.PI) / 180))
        if (!await page.evaluate('typeof window.__view === "function"')) await ready()
        const aim = `window.__view([${at.lat + dLat}, ${at.lon + dLon}, ${A}], [${at.lat}, ${at.lon}, ${h * 0.5}])`
        await page.evaluate(aim)
        await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: idle }).catch(() => {})
        // AIM AGAIN. A view's altitude is measured from the ground under it, and the ground is not there
        // until its tile is: the first aim can put the camera below the terrain, which renders the inside of
        // a wall and reads as a ruined model. The second aim, after the city is idle, lands where it should.
        await page.evaluate(aim)
        await page.evaluate('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
        await page.waitForTimeout(settle)
        await page.screenshot({ path: dest })
        shots++
      }
      done++
      if (done % 10 === 0) {
        const s = (Date.now() - t0) / 1000
        logTo(log, `  ${done}/${todo.length} rows, ${shots} shots, ${(s / done).toFixed(1)} s/row`)
      }
    } catch (e) { logTo(log, `  x ${i.id}: ${String(e).split('\n')[0]}`) }
  }
  await browser.close()
  const s = (Date.now() - t0) / 1000
  logTo(log, `${done} rows, ${shots} shots in ${Math.round(s)} s — ${(s / Math.max(1, done)).toFixed(1)} s/row`)
}

/**
 * The standalone shot: the builder alone on its own footprint, no neighbours, which is the only view that
 * answers "is the MODEL any good" when the street view is blocked. It needs no city — `?model=<builder>`
 * loads one builder (tools/model-shots.ts, tools/exp-shots.ts) — so it is an order of magnitude cheaper and
 * can run while the machine is busy. A refaced row has no builder and gets no standalone shot; its "model"
 * is the classifier's box wearing a style, and the in-context views are all there is to see.
 */
async function solo(items: Item[]): Promise<void> {
  const { chromium } = await import('playwright')
  const BASE = process.env.SHOTS_BASE ?? `http://localhost:${arg('port', '5200')}`
  mkdirSync(join(OUT, 'renders'), { recursive: true })
  const log = arg('log') ? resolve(arg('log')) : join(OUT, 'render.log')
  const sight = readSight()
  let todo = items.filter((i) => i.builder && !existsSync(join(OUT, 'renders', `${slug(i.id)}-solo.png`)))
  if (arg('only')) { const want = arg('only').split(','); todo = todo.filter((i) => want.some((w) => i.id.includes(w) || i.name.includes(w))) }
  const limit = Number(arg('limit', '0'))
  if (limit > 0) todo = todo.slice(0, limit)
  logTo(log, `${todo.length} standalone shots to take`)
  if (!todo.length) return
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
  const page = await browser.newPage({ viewport: { width: 620, height: 620 } })
  page.on('pageerror', () => { /* a broken builder shows as a missing tile, not a dead batch */ })
  const t0 = Date.now()
  let done = 0
  for (const i of todo) {
    try {
      const g = sight[i.id]
      const h = Math.max(6, i.height ?? g?.h ?? 20)
      // The real plot where the geometry pass measured one. Where it did not — a landmark's outline is
      // dropped from the package, so this is common — the plot is estimated from the height rather than
      // fixed, or a 326 m tower is drawn on a 18 m square and comes out as a spike.
      const hx = g?.hx ?? Math.max(8, Math.min(30, h * 0.09))
      const hz = g?.hz ?? Math.max(10, Math.min(40, h * 0.12))
      // THE RING, not just the box. model-showcase.ts builds on a square plot unless it is given one, so a
      // block-face building came out a slender tower and a flatiron came out a box — the standalone shot was
      // of a different building from the context shots, and it is the shot a hemmed-in row sends you to.
      const ring = g?.plan?.length ? g.plan.map(([x, z]) => ({ x, z })) : undefined
      await page.goto(`${BASE}/?model=${i.builder}`)
      await page.waitForFunction('window.modelReady === true', null, { timeout: 60_000 })
      // the showcase's own "loading…" label is not part of the model
      await page.addStyleTag({ content: 'body > *:not(canvas):not(#app) { visibility: hidden !important }' })
      const b = await page.evaluate(`window.__rebuild(${JSON.stringify({ hx, hz, height: h, ring })})`) as { min: number[]; max: number[] }
      const H = b.max[1]
      const W = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2])
      const R = Math.max(W, H)
      // a long low building fills the frame across, not up: pulling back by the tallest dimension leaves the
      // Maritime Museum a smudge in the middle of the water
      const radius = R * (H / Math.max(1, W) < 0.5 ? 1.25 : 1.75)
      const cx = (b.min[0] + b.max[0]) / 2
      const cz = (b.min[2] + b.max[2]) / 2
      await page.evaluate(`window.__modelView(${Math.PI / 2 - 0.9},${1.22},${radius},${cx},${H * 0.45},${cz})`)
      await page.waitForTimeout(240)
      await page.screenshot({ path: join(OUT, 'renders', `${slug(i.id)}-solo.png`) })
      done++
      if (done % 25 === 0) logTo(log, `  solo ${done}/${todo.length}`)
    } catch (e) { logTo(log, `  x solo ${i.id}: ${String(e).split('\n')[0]}`) }
  }
  await browser.close()
  const s = (Date.now() - t0) / 1000
  logTo(log, `${done} standalone shots in ${Math.round(s)} s — ${(s / Math.max(1, done)).toFixed(1)} s each`)
}

/* ---------------------------------------------------------------- the page itself */

function html(data: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Building review</title>
<style>
  :root { color-scheme: dark; --bg:#141416; --fg:#eee; --dim:#8a8a90; --line:#2c2c31; }
  * { box-sizing: border-box }
  body { margin:0; background:var(--bg); color:var(--fg); font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif }
  header { display:flex; gap:18px; align-items:baseline; padding:8px 14px; border-bottom:1px solid var(--line); position:sticky; top:0; background:var(--bg); z-index:5 }
  header b { font-size:15px } header span { color:var(--dim) }
  button { background:#232329; color:var(--fg); border:1px solid var(--line); border-radius:5px; padding:4px 10px; font:inherit; cursor:pointer }
  main { display:grid; grid-template-columns:1fr 1fr 330px; gap:10px; padding:8px 12px; align-items:start }
  /* two photographs side by side, and every render of the building in a grid beside them: one angle is not
     enough when half the street-level views have a neighbour across them */
  .grid { display:grid; gap:6px; height:calc(100vh - 86px) }
  .grid.two { grid-template-columns:1fr 1fr; grid-template-rows:1fr }
  .grid.one { grid-template-columns:1fr }
  .grid.four { grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr }
  main > div:last-child { max-height:calc(100vh - 86px); overflow:auto }
  .pane { background:#000; border:1px solid var(--line); border-radius:6px; overflow:hidden; position:relative; min-height:0; display:flex; align-items:center; justify-content:center }
  .grid .pane img { width:100%; height:100%; object-fit:contain }
  .pane img { width:100%; height:100%; object-fit:contain }
  /* __view puts the target at the centre of the frame, so a ring at the centre is exactly the building being
     judged. Without it a refaced low-rise among identical low-rises is marked "wrong building" on a good
     model — the one confusion the vocabulary exists to avoid. */
  /* the ring marks the centre of the frame, which is exactly what the camera was aimed at. The standalone
     shot needs none: there is nothing else in it. */
  .pane.ctx::after { content:''; position:absolute; left:50%; top:50%; width:26px; height:26px; margin:-13px;
    border:2px dashed #e5484d; border-radius:50%; pointer-events:none }
  .pane .tag { position:absolute; left:0; top:0; background:#000a; padding:2px 8px; font-size:12px; color:var(--dim) }
  .none { color:#c2703e; font-size:15px; text-align:center; padding:20px }
  h1 { font-size:19px; margin:0 0 4px }
  .meta { color:var(--dim); font-size:13px }
  .note { margin:10px 0; max-height:8.5em; overflow:auto }
  .t { display:inline-block; border:1px solid var(--line); border-radius:4px; padding:1px 7px; margin-right:6px }
  ul.keys { list-style:none; padding:0; margin:14px 0 0; font-size:13px; color:var(--dim) }
  ul.keys li { padding:1px 0 } ul.keys kbd { display:inline-block; min-width:1.4em; text-align:center; background:#232329; border:1px solid var(--line); border-radius:3px; padding:0 4px; margin-right:6px; color:var(--fg) }
  .verdict { margin-top:10px; font-size:15px }
  .links { margin:8px 0 2px; display:flex; flex-wrap:wrap; gap:6px }
  .links a { color:var(--fg); text-decoration:none; background:#232329; border:1px solid var(--line); border-radius:5px; padding:2px 8px; font-size:13px }
  .links a:hover { border-color:#5b8dd6 }
  .links a b { color:var(--dim); font-weight:600; margin-right:5px }
  #where { margin-top:3px }
  #where b { color:var(--fg); font-weight:600 }
  #where button { font-size:12px; padding:1px 7px; margin-left:6px; vertical-align:baseline }
  .links span.off { color:#55555c; border:1px dashed var(--line); border-radius:5px; padding:2px 8px; font-size:13px }
  .prov { margin-top:8px; padding:7px 9px; background:#1b1b20; border:1px solid var(--line); border-radius:6px; font-size:13px }
  .prov div { color:var(--dim) } .prov b { color:var(--fg); font-weight:600 }
  .bar { height:3px; background:#232329 } .bar i { display:block; height:3px; background:#5b8dd6 }
  dialog { background:#1b1b20; color:var(--fg); border:1px solid var(--line); border-radius:8px; width:460px }
  dialog textarea { width:100%; height:80px; background:#101014; color:var(--fg); border:1px solid var(--line); border-radius:5px; font:inherit; padding:6px }
  .warn { color:#c2703e }
</style></head><body>
<div class="bar"><i id="bar"></i></div>
<header>
  <b id="pos"></b><span id="left"></span><span id="basis"></span><span id="filter" class="warn"></span><span id="tally"></span>
  <span style="flex:1"></span>
  <button id="exp">Export JSON</button><button id="imp">Import…</button>
  <input id="file" type="file" accept="application/json" hidden>
</header>
<main>
  <div class="grid" id="photo"></div>
  <div class="grid" id="render"></div>
  <div>
    <h1 id="name"></h1>
    <div class="meta" id="addr"></div>
    <div class="meta" id="ids"></div>
    <div class="meta" id="where"></div>
    <div class="links" id="links"></div>
    <div class="prov" id="prov"></div>
    <div style="margin-top:8px"><span class="t" id="treat"></span><span class="meta" id="why"></span></div>
    <div class="note meta" id="note"></div>
    <div class="verdict" id="verdict"></div>
    <ul class="keys">
      <li><kbd>0</kbd>fine as is</li>
      <li><kbd>2</kbd>promote to haiku + kit</li>
      <li><kbd>3</kbd>promote to sonnet + kit</li>
      <li><kbd>4</kbd>promote to sonnet from scratch</li>
      <li><kbd>5</kbd>promote to opus from scratch</li>
      <li><kbd>x</kbd>wrong building / bad data</li>
      <li><kbd>n</kbd>add a note (does not advance)</li>
      <li>the ring marks which building the render is of</li>
      <li><kbd>g</kbd>Street View &nbsp; <kbd>s</kbd>satellite &nbsp; <kbd>m</kbd>Mapillary &nbsp; <kbd>o</kbd>OSM &nbsp; <kbd>p</kbd>ride here (new tab, no advance)</li>
      <li><kbd>f</kbd>only this run &nbsp; <kbd>F</kbd>all rows again</li>
      <li><kbd>r</kbd>next reference frame &nbsp; <kbd>←</kbd>back &nbsp; <kbd>→</kbd>skip</li>
    </ul>
  </div>
</main>
<dialog id="dlg"><form method="dialog"><p style="margin-top:0">Note for <b id="dlgname"></b></p>
  <textarea id="dlgtext"></textarea>
  <p style="text-align:right;margin-bottom:0"><button value="cancel">Cancel</button> <button value="ok" id="dlgok">Save</button></p>
</form></dialog>
<script id="data" type="application/json">${data.replace(/</g, '\\u003c')}</script>
<script>
const DATA = JSON.parse(document.getElementById('data').textContent)
const ITEMS = DATA.items
// LIST is what the scan walks: everything, or one run's rows when the owner presses f
let LIST = ITEMS
let FILTER = ''
const KEY = 'review:' + DATA.city
// every storage touch is wrapped: a page that throws in private browsing is a page that is not used
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { return {} } }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(V)) } catch (e) { flash('not saved: storage unavailable') } }
let V = load()
let i = 0
try { i = Math.min(LIST.length - 1, Math.max(0, parseInt(localStorage.getItem(KEY + ':at') || '0', 10) || 0)) } catch (e) {}
let frame = 0

/*
 * The four ways out of the page, all opened in a new tab so the scan's state is untouched.
 *
 * Street View is AIMED where anything says how: the fetch records the bearing from the camera to the
 * building and how far away it stood, so the viewpoint is put back where that camera was and pointed at the
 * facade. Failing that the manifest's front bearing (the compass bearing the front faces) puts the viewer out in
 * front of it. Failing both, the viewpoint is the building itself and Google picks the heading.
 *
 * The OSM link uses the manifest's own id string. It is never rebuilt from a packed id: packed relation ids
 * are N*2+1 here, and a link derived from one points confidently at a different object.
 */
const ll = (lat, lon, d, brg) => {
  const r = brg * Math.PI / 180
  return [lat + (Math.cos(r) * d) / 111320, lon + (Math.sin(r) * d) / (111320 * Math.cos(lat * Math.PI / 180))]
}
function linksFor(it, frame) {
  const out = []
  const f = (it.frames || [])[frame] || {}
  if (it.lat !== undefined && it.lat !== null) {
    let vp = [it.lat, it.lon]
    let heading = null
    if (f.bearing !== undefined && f.bearing !== null) {
      vp = ll(it.lat, it.lon, Math.max(12, Math.min(120, f.distance || 35)), (f.bearing + 180) % 360)
      heading = f.bearing
    } else if (it.front !== undefined && it.front !== null) {
      vp = ll(it.lat, it.lon, Math.max(18, Math.min(80, (it.height || 20) * 0.7)), it.front)
      heading = (it.front + 180) % 360
    }
    const q = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + vp[0].toFixed(6) + ',' + vp[1].toFixed(6)
      + (heading === null ? '' : '&heading=' + Math.round(heading)) + '&pitch=5&fov=80'
    out.push(['g', 'Street View', q, heading === null ? 'nearest pano, heading not aimed' : 'aimed at the facade'])
    // a satellite view tight enough to read the footprint, not the district
    const span = Math.max(60, Math.min(300, (it.height || 20) * 3))
    out.push(['s', 'Satellite', 'https://www.google.com/maps/@' + it.lat + ',' + it.lon + ',' + Math.round(span) + 'm/data=!3m1!1e3', 'plan shape and footprint'])
  } else {
    out.push(['g', 'Street View', '', 'no position on this row'])
    out.push(['s', 'Satellite', '', 'no position on this row'])
  }
  if (f.pkey) out.push(['m', 'Mapillary', 'https://www.mapillary.com/app/?pKey=' + f.pkey + '&focus=photo', 'the frame on screen'])
  else if (it.lat !== undefined && it.lat !== null) out.push(['m', 'Mapillary', 'https://www.mapillary.com/app/?lat=' + it.lat + '&lng=' + it.lon + '&z=18', 'the map here — no frame key recorded'])
  else out.push(['m', 'Mapillary', '', 'no frame and no position'])
  if (it.osm) out.push(['o', 'OSM', 'https://www.openstreetmap.org/' + it.osm, 'the outline itself'])
  else out.push(['o', 'OSM', '', 'this row has no OSM id'])
  // the live app, put down at the building: src/main.ts reads ?at=<lat>,<lon> already
  if (it.lat !== undefined && it.lat !== null) {
    out.push(['p', 'Ride here', (DATA.app || '') + '/?city=' + DATA.city + '&at=' + it.lat.toFixed(6) + ',' + it.lon.toFixed(6),
      'the app, starting at this building'])
  } else out.push(['p', 'Ride here', '', 'no position on this row'])
  return out
}

const LABEL = { 0:'fine as is', 2:'haiku + kit', 3:'sonnet + kit', 4:'sonnet from scratch', 5:'opus from scratch', x:'wrong building / bad data' }
const $ = (id) => document.getElementById(id)
let msg = ''
function flash(t) { msg = t; draw(); setTimeout(() => { msg = ''; draw() }, 2500) }

function draw() {
  const it = LIST[i]
  if (!it) return
  $('pos').textContent = (i + 1) + ' / ' + LIST.length
  const done = Object.keys(V).filter((k) => V[k] && V[k].verdict).length
  $('left').textContent = done + ' judged, ' + (ITEMS.length - done) + ' left'
    + (LIST.length === ITEMS.length ? '' : ' · ' + LIST.length + ' in this run')
  $('tally').innerHTML = msg ? '<span class="warn">' + msg + '</span>' : ''
  $('bar').style.width = ((i + 1) / LIST.length * 100) + '%'
  $('name').textContent = it.name
  $('addr').innerHTML = esc([it.address, it.height ? it.height + ' m' : '', 'priority ' + it.priority].filter(Boolean).join(' · '))
    + (it.hemmed ? ' · <span class="warn">' + (it.height > 60
        ? 'a tall building among tall neighbours: no street-level line of sight to it — judge the aerial and the standalone shot'
        : 'hemmed in: no open line of sight from any direction — judge the standalone shot, not the street views') + '</span>'
      : (it.openBearings !== null && it.openBearings !== undefined && it.openBearings < 6
        ? ' · <span class="warn">only ' + it.openBearings + ' of ' + it.totalBearings + ' directions are open</span>' : ''))
  // the address and the coordinates, plainly and copyable: the stated use is pasting them into a search or
  // into the app's own go-to box
  const ll = (it.lat === undefined || it.lat === null) ? '' : it.lat.toFixed(6) + ', ' + it.lon.toFixed(6)
  $('where').innerHTML = (it.address ? '<b>' + esc(it.address) + '</b> · ' : '')
    + (ll ? '<b>' + ll + '</b><button id="copy">copy</button>' : '<span class="warn">no position on this row</span>')
  const cp = document.getElementById('copy')
  if (cp) cp.onclick = () => {
    try { navigator.clipboard.writeText(ll); flash('copied ' + ll) } catch (e) {
      const t = document.createElement('textarea'); t.value = ll; document.body.appendChild(t); t.select()
      try { document.execCommand('copy'); flash('copied ' + ll) } catch (e2) { flash('could not copy') }
      t.remove()
    }
  }
  $('ids').textContent = it.id + ' · ' + it.manifest + (it.builder ? ' · ' + it.builder : '') + ' · model: ' + it.model
  // the number is only as sure as its two facts: kit-vs-scratch is measured from the builder's source, the
  // MODEL usually is not recorded anywhere, so an unknown model shows as "4?" rather than as a fact
  const sure = !!it.modelSure
  const named = ['classifier only','refaced','haiku + kit','sonnet + kit','sonnet from scratch','opus from scratch'][it.treatment] || '?'
  // Treatment 3 means "sonnet + kit". The KIT half is measured from the builder's source; the SONNET half is
  // an assumption on 908 of these rows, and a number that quietly asserts it will be read back as fact. So an
  // unrecorded model shows as "3?" and the words say what is actually known.
  const measured = it.kit === true ? 'through the kit' : it.kit === false ? 'from scratch' : 'kit or scratch unknown'
  $('treat').textContent = 'treatment ' + it.treatment + (sure || it.treatment < 2 ? '' : '?') + ' — '
    + (sure || it.treatment < 2 ? named : measured + ', model not recorded')
  $('why').textContent = it.why + (sure || it.treatment < 2 ? '' : ' · nothing records which model wrote it, so "' + named + '" is an assumption, not a measurement')
  $('note').textContent = it.note
  const p = it.prov || {}
  const bits = []
  if (p.kind === 'reface') {
    bits.push('<div><b>refaced</b> — style <b>' + esc(p.style || '?') + '</b>' + (p.rule ? ', ' + esc(p.rule) : '') + '</div>')
  } else if (p.kind === 'generator') {
    bits.push('<div><b>generator</b> <b>' + esc(p.builder || '?') + '</b>' + (p.experiment ? ' · experiment ' + esc(p.experiment) : '')
      + ' — ' + (p.kit === null ? 'kit or scratch unknown' : p.kit ? 'through the kit' : 'raw primitives')
      + (p.kit === null ? '' : ' (' + p.kitCalls + ' kit, ' + p.rawCalls + ' primitive calls)') + '</div>')
    if (p.file) bits.push('<div>' + esc(p.file) + '</div>')
    if (p.added) bits.push('<div>added ' + esc(p.added) + '</div>')
  } else bits.push('<div><b>classifier only</b> — no entry beyond the procedural facade</div>')
  bits.push('<div>run <b>' + esc(p.run || '?') + '</b> · model <b>' + esc(p.model || '?') + '</b>'
    + (p.modelSure ? '' : ' (not recorded)') + (p.runNote ? ' · ' + esc(p.runNote) : '')
    + ' — <kbd>f</kbd> to scan only this run</div>')
  $('prov').innerHTML = bits.join('')
  $('links').innerHTML = linksFor(it, frame).map((l) =>
    l[2] ? '<a href="' + l[2] + '" target="_blank" rel="noreferrer" title="' + esc(l[3]) + '"><b>' + l[0] + '</b>' + l[1] + '</a>'
         : '<span class="off" title="' + esc(l[3]) + '">' + l[1] + ' —</span>').join('')
  // TWO photographs at once: a third of Mapillary frames are junk, and a pair makes that obvious at a glance
  const ph = $('photo')
  const n = it.photos.length
  if (n) {
    frame = frame % n
    const show = n > 1 ? [frame, (frame + 1) % n] : [frame]
    ph.className = 'grid ' + (show.length > 1 ? 'two' : 'one')
    ph.innerHTML = show.map((k) => '<a class="pane" href="' + it.photos[k] + '" target="_blank" rel="noreferrer">'
      + '<img src="' + it.photos[k] + '" alt=""><span class="tag">photograph ' + (k + 1) + ' / ' + n + (n > 2 ? ' — r for next' : '') + '</span></a>').join('')
  } else { ph.className = 'grid one'; ph.innerHTML = '<div class="pane"><div class="none">no photograph on disk<br><small>judge the render for obvious breakage only</small></div></div>' }
  const rd = $('render')
  const shots = it.shots && it.shots.length ? it.shots : (it.render ? [{ key: 'render', src: it.render }] : [])
  rd.className = 'grid ' + (shots.length > 2 ? 'four' : shots.length === 2 ? 'two' : 'one')
  rd.innerHTML = shots.length
    ? shots.map((sh) => '<a class="pane' + (sh.key === 'on its own' ? '' : ' ctx') + '" href="' + sh.src + '" target="_blank" rel="noreferrer">'
        + '<img src="' + sh.src + '" alt=""><span class="tag">' + sh.key + '</span></a>').join('')
    : '<div class="pane"><div class="none">not rendered yet</div></div>'
  const v = V[it.id]
  $('verdict').innerHTML = v
    ? '<b>' + (LABEL[v.verdict] || v.verdict) + '</b>' + (v.note ? ' — <i>' + esc(v.note) + '</i>' : '')
    : '<span class="meta">no verdict yet</span>'
  // the next item's images, so the scan is not paced by a cold image load
  const nx = LIST[i + 1]
  if (nx) {
    for (const src of [nx.photos[0], nx.photos[1], ...(nx.shots || []).map((x) => x.src)]) if (src) new Image().src = src
  }
}
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[c]))

function setVerdict(v) {
  const it = LIST[i]
  const prev = V[it.id] || {}
  V[it.id] = { verdict: v, note: prev.note || '', noRef: !it.photos.length, noRender: !it.render }
  save()
  go(1)
}
function go(d) {
  i = Math.min(LIST.length - 1, Math.max(0, i + d))
  frame = 0
  try { localStorage.setItem(KEY + ':at', String(i)) } catch (e) {}
  draw()
}

document.addEventListener('keydown', (e) => {
  if ($('dlg').open) return
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const k = e.key
  if (k === '0' || k === '2' || k === '3' || k === '4' || k === '5') { e.preventDefault(); setVerdict(k); return }
  if (k === 'x' || k === 'X') { e.preventDefault(); setVerdict('x'); return }
  if (k === 'r' || k === 'R') { e.preventDefault(); const it = LIST[i]; if (it.photos.length > 1) { frame = (frame + 1) % it.photos.length; draw() } return }
  if (k === 'ArrowLeft') { e.preventDefault(); go(-1); return }
  if (k === 'ArrowRight' || k === ' ') { e.preventDefault(); go(1); return }
  if (k === 'n' || k === 'N') { e.preventDefault(); openNote(); return }
  // a link opens in a new tab and changes NOTHING here: not the item, not the verdict, not storage
  if (k === 'g' || k === 's' || k === 'm' || k === 'o' || k === 'p') {
    e.preventDefault()
    const l = linksFor(LIST[i], frame).find((x) => x[0] === k)
    if (l && l[2]) window.open(l[2], '_blank', 'noreferrer')
    else flash(l ? l[1] + ': ' + l[3] : '')
    return
  }
  // group the scan by RUN: fifteen bad rows from one batch is one bad run, not fifteen bad buildings
  if (k === 'f' || k === 'F') {
    e.preventDefault()
    const here = LIST[i]
    if (k === 'F' || FILTER) { FILTER = ''; LIST = ITEMS } else { FILTER = (here.prov && here.prov.run) || ''; LIST = ITEMS.filter((x) => x.prov && x.prov.run === FILTER) }
    if (!LIST.length) { LIST = ITEMS; FILTER = '' }
    i = Math.max(0, LIST.indexOf(here))
    frame = 0
    $('filter').textContent = FILTER ? 'only run ' + FILTER + ' (F for all)' : ''
    draw()
    return
  }
})

function openNote() {
  const it = LIST[i]
  $('dlgname').textContent = it.name
  $('dlgtext').value = (V[it.id] && V[it.id].note) || ''
  $('dlg').showModal()
  setTimeout(() => $('dlgtext').focus(), 0)
}
$('dlg').addEventListener('close', () => {
  if ($('dlg').returnValue !== 'ok') return
  const it = LIST[i]
  const prev = V[it.id] || { verdict: '', noRef: !it.photos.length, noRender: !it.render }
  V[it.id] = Object.assign({}, prev, { note: $('dlgtext').value.trim() })
  save(); draw()
})

$('exp').onclick = () => {
  const out = { city: DATA.city, generated: DATA.generated, exportedAt: new Date().toISOString(),
    // provenance travels WITH the verdict: the useful question afterwards is which run produced the bad rows
    verdicts: ITEMS.filter((it) => V[it.id]).map((it) => Object.assign({
      id: it.id, name: it.name, treatment: it.treatment,
      run: (it.prov || {}).run || '', model: (it.prov || {}).model || '?', modelSure: !!(it.prov || {}).modelSure,
      kind: (it.prov || {}).kind || '', style: (it.prov || {}).style || '', rule: (it.prov || {}).rule || '',
      kit: (it.prov || {}).kit, builder: (it.prov || {}).builder || '', experiment: (it.prov || {}).experiment || '',
    }, V[it.id])) }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }))
  a.download = 'review-' + DATA.city + '.json'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
$('imp').onclick = () => $('file').click()
$('file').onchange = (e) => {
  const f = e.target.files[0]
  if (!f) return
  const r = new FileReader()
  r.onload = () => {
    try {
      const j = JSON.parse(r.result)
      if (j.city && j.city !== DATA.city) { flash('that file is a scan of ' + j.city + ', not ' + DATA.city); return }
      let n = 0
      for (const v of (j.verdicts || [])) { if (!v || !v.id) continue; V[v.id] = { verdict: v.verdict, note: v.note || '', noRef: !!v.noRef, noRender: !!v.noRender }; n++ }
      save(); draw(); flash(n + ' verdicts imported')
    } catch (err) { flash('could not read that file') }
  }
  r.readAsText(f)
  e.target.value = ''
}
$('basis').textContent = 'sorted most prominent first — ' + ((DATA.basis && DATA.basis.queue) || 0) + ' by queue priority, '
  + ((DATA.basis && DATA.basis.height) || 0) + ' by height · model recorded for ' + (DATA.recorded || 0) + ' of ' + ITEMS.length + ' rows'
draw()
</script></body></html>
`
}

/* ---------------------------------------------------------------- run */

const items = await index()
if (arg('coverage')) { coverage(items); process.exit(0) }
if (arg('render')) await render(items)
if (arg('solo')) await solo(items)
coverage(items)
writePage(items)