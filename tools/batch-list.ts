/**
 * The id list for a modelling batch — filtered against the OSM tags, not against the queue alone.
 *
 * WHY THIS EXISTS. Kit batch 8 was handed 23 ids taken straight from the `pending` rows of
 * `docs/sf-queue.csv` and came back with **zero** buildings: 13 of the 23 were not buildings at all (four
 * Bay Bridge pylons tagged `bridge:support`, five `building:part`s, a `highway=unclassified` that is Pier 45,
 * a `man_made=pier`, two `leisure=stadium` park polygons and a `boundary=protected_area`), and the rest had
 * no usable reference. That cost ~97 000 tokens to discover, and every one of those rejections was decidable
 * from the tags before an agent was ever dispatched.
 *
 * `docs/sf-batches/FREE-IDS.txt` had the right filters in its header all along — no builder, no reface, not
 * infrastructure, not a `building:part`, carries a building tag, not `building=construction`, present in the
 * cut — but they lived in a comment and in whatever shell pipeline produced that file, so the next list built
 * by hand silently skipped them. Filters that are not code do not run.
 *
 *     node --experimental-strip-types tools/batch-list.ts <city> [--limit=N] [--out=path]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')

/** csv with quoted fields (names contain commas — a naive split silently shears the row) */
function cells(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"') { if (line[i + 1] === '"') { cur += c; i++ } else q = false } else cur += c
    } else if (c === '"') q = true
    else if (c === ',') { out.push(cur); cur = '' } else cur += c
  }
  out.push(cur)
  return out
}

/** Every reason an id is not a building a batch should model. Order matters only for the message. */
function reject(t: Record<string, string>): string | null {
  if (t['building:part'] !== undefined && t['building:part'] !== 'no') return 'building:part — belongs to a parent outline'
  if (t['bridge:support'] !== undefined) return `bridge:support=${t['bridge:support']} — bridge infrastructure`
  if (t.building === undefined) {
    // the tag that actually explains what it is, for the log
    for (const k of ['leisure', 'boundary', 'man_made', 'highway', 'landuse', 'natural', 'amenity', 'historic']) {
      if (t[k] !== undefined) return `no building tag (${k}=${t[k]})`
    }
    return 'no building tag'
  }
  if (t.building === 'construction') return 'building=construction'
  if (t.building === 'roof') return 'building=roof — a canopy, not an enclosure'
  if (/^(demolished|razed|removed|was):/.test(Object.keys(t).find((k) => /^(demolished|razed|removed|was):/.test(k)) ?? '')) {
    return 'demolished — the tag says it is gone'
  }
  return null
}

const city = process.argv[2] ?? 'san-francisco'
const limit = Number(process.argv.find((a) => a.startsWith('--limit='))?.slice(8) ?? 40)
const out = process.argv.find((a) => a.startsWith('--out='))?.slice(6)

// tags, from the bake's own OSM cut (OPL) — the same geometry the bake modelled from
const tags = new Map<string, Record<string, string>>()
const cuts = resolve(ROOT, 'tools', 'cache', 'osm', 'cuts')
/** OPL escapes %XX inside tag text; keys and values are separated by = and pairs by , */
const unesc = (v: string): string => v.replace(/%([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
for (const f of readdirSync(cuts)) {
  if (!f.endsWith('.opl')) continue
  for (const line of readFileSync(resolve(cuts, f), 'utf8').split('\n')) {
    if (line[0] !== 'w') continue
    const id = line.slice(1, line.indexOf(' '))
    const ti = line.indexOf(' T')
    if (ti < 0) continue
    let text = line.slice(ti + 2)
    const ni = text.indexOf(' N')
    if (ni >= 0) text = text.slice(0, ni)
    if (text === '') continue
    const t: Record<string, string> = {}
    for (const pair of text.split(',')) {
      const eq = pair.indexOf('=')
      if (eq > 0) t[unesc(pair.slice(0, eq))] = unesc(pair.slice(eq + 1))
    }
    tags.set(`way/${id}`, t)
  }
}

// already claimed: anything any manifest names at all
let manifests = readFileSync(resolve(ROOT, 'public', 'landmarks', `${city}.json`), 'utf8')
const walk = (dir: string): void => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.json')) manifests += readFileSync(p, 'utf8')
  }
}
walk(resolve(ROOT, 'public', 'landmarks', city))

/*
 * How many reference frames each id has (docs/shots/refs/sf-fetch/done.csv: osm,source,status,frames).
 * Batch 8's other eight rejections were all "no usable reference" — also decidable before dispatch, so a
 * batch can be asked for ids that CAN be modelled from evidence rather than ids that merely exist.
 */
const frames = new Map<string, number>()
try {
  const done = readFileSync(resolve(ROOT, 'docs', 'shots', 'refs', 'sf-fetch', 'done.csv'), 'utf8')
  for (const line of done.trim().split(/\r?\n/).slice(1)) {
    const c = cells(line.replace(/\r$/, ''))
    const n = Number(c[3])
    if (c[0] !== undefined && Number.isFinite(n)) frames.set(c[0], Math.max(frames.get(c[0]) ?? 0, n))
  }
} catch { /* no fetch log yet */ }
const withRefs = process.argv.includes('--with-refs')

const rows = readFileSync(resolve(ROOT, 'docs', 'sf-queue.csv'), 'utf8').trim().split(/\r?\n/).map((l) => cells(l.replace(/\r$/, '')))
const head = rows[0]
const col = (name: string): number => head.indexOf(name)
const kept: string[] = []
const why = new Map<string, number>()
let claimed = 0
let untagged = 0

for (const r of rows.slice(1)) {
  if (r[col('stage')] !== 'pending') continue
  const id = r[col('osm')]
  if (manifests.includes(id)) { claimed++; continue }
  const t = tags.get(id)
  if (t === undefined) { untagged++; why.set('not in the OSM cut', (why.get('not in the OSM cut') ?? 0) + 1); continue }
  const bad = reject(t)
  if (bad !== null) { why.set(bad.split(' —')[0], (why.get(bad.split(' —')[0]) ?? 0) + 1); continue }
  const f = frames.get(id) ?? 0
  if (withRefs && f === 0) { why.set('no reference frames', (why.get('no reference frames') ?? 0) + 1); continue }
  kept.push([id, `"${r[col('name')]}"`, r[col('kind')], r[col('height')], r[col('priority')], `${f} frames`].join(','))
}

console.log(`pending and unclaimed, with tags: ${kept.length} modellable`)
console.log(`  already in a manifest: ${claimed}`)
for (const [k, n] of [...why].sort((a, b) => b[1] - a[1])) console.log(`  rejected — ${k}: ${n}`)
if (untagged > 0) console.log(`  (not in the cut: ${untagged} — these need a re-bake or are outside the box)`)

/*
 * A HEADER LINE, because a batch misread the `priority` column as `height` when `height` was empty and
 * invented 90-210 m heights for 28 small civic buildings. Unlabelled columns with an empty field beside a
 * plausible-looking number are a trap; name them.
 */
const HEADER = '# osm,name,kind,height_m,priority   — height_m EMPTY means UNKNOWN: read the OSM tags or OMIT it, never guess'
const list = [HEADER, ...kept.slice(0, limit)].join('\n')
if (out) { writeFileSync(resolve(ROOT, out), list + '\n'); console.log(`→ ${out} (${Math.min(limit, kept.length)} ids)`) } else console.log(list)
