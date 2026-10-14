/**
 * IS EVERY BUILDING WE MODELLED IN THE CITY? (owner, 2026-10-02: "we should at some point audit that EVERY procedural
 * building we have is actually in use" — the de Young had no builder at all, and a dozen others had one that no
 * manifest placed.)
 *
 * Every builder in PROCEDURAL (src/render/landmarks/procedural.ts) against every manifest that can place one:
 * public/landmarks/<region>/*.json, public/landmarks/<region>.json, and the shipped cities' skylines. A builder no
 * manifest names is reported with the file it is in and the OSM way its doc comment was written for, and sorted:
 *
 *   SUPERSEDED  another manifest entry places that same OSM way, with another builder — nothing lost;
 *   UNPLACED    nothing places that building: modelled, and never seen;
 *   NO OSM ID   its comment names no way: look at it by hand;
 *   experiment  the e1–e15 trials, the kit samples (kit_*) and the like — counted, not listed (--all lists them).
 *
 *   npx vite-node tools/builder-audit.ts [-- --all]
 *
 * `npm run audit:builders` (tools/audit-builders.ts) asks the same question in its list 1, with four more about
 * entries that never reach a building; this one adds what each unplaced builder was FOR, and whether that building
 * is placed some other way.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { PROCEDURAL } from '../src/render/landmarks/procedural.ts'
import { SHIPPED, shippedDir } from './bake-files.ts'

const ROOT = resolve(import.meta.dirname, '..')
const all = process.argv.includes('--all')

interface Entry { procedural?: string; osm?: string | string[]; name?: string }
const read = (f: string): Entry[] => {
  const d = JSON.parse(readFileSync(f, 'utf8')) as Entry[] | { landmarks?: Entry[] }
  return Array.isArray(d) ? d : d.landmarks ?? []
}

// ---- what the manifests place, and which OSM ways they place it on
const used = new Map<string, string>()            // builder → manifest file
const placedWay = new Map<string, string>()       // "way/123" → builder that places it
const lm = join(ROOT, 'public', 'landmarks')
for (const name of readdirSync(lm)) {
  const p = join(lm, name)
  const files = statSync(p).isDirectory() ? readdirSync(p).filter((f) => f.endsWith('.json')).map((f) => join(p, f)) : name.endsWith('.json') ? [p] : []
  for (const f of files) {
    for (const e of read(f)) {
      if (!e.procedural) continue
      used.set(e.procedural, relative(ROOT, f))
      for (const w of e.osm ? (Array.isArray(e.osm) ? e.osm : [e.osm]) : []) placedWay.set(w, e.procedural)
    }
  }
}
// the skylines as the game reads them: each shipped city's v3 index carries its own
for (const id of readdirSync(SHIPPED).filter((d) => existsSync(join(shippedDir(d), 'index.json')))) {
  const f = join(shippedDir(id), 'index.json')
  const idx = JSON.parse(readFileSync(f, 'utf8')) as { skyline?: { procedural: string }[] }
  for (const s of idx.skyline ?? []) used.set(s.procedural, `${relative(ROOT, f)} (skyline)`)
}

// ---- where each builder is written, and the way its comment names
const sources: { file: string; text: string }[] = []
const walk = (d: string): void => {
  for (const n of readdirSync(d)) {
    const p = join(d, n)
    if (statSync(p).isDirectory()) walk(p)
    else if (n.endsWith('.ts')) sources.push({ file: relative(ROOT, p), text: readFileSync(p, 'utf8') })
  }
}
walk(join(ROOT, 'src', 'render', 'landmarks'))
const find = (name: string): { file: string; way: string | null } | null => {
  const def = new RegExp(`(?:^|\\n)\\s*(?:export\\s+)?(?:function\\s+${name}\\b|(?:const\\s+)?${name}\\s*[:=])`)
  for (const s of sources) {
    const m = def.exec(s.text)
    if (!m) continue
    // the comment just above (or on) the definition
    const before = s.text.slice(Math.max(0, m.index - 600), m.index + m[0].length + 200)
    const ways = [...before.matchAll(/(way|relation)\/(\d+)/g)].map((x) => `${x[1]}/${x[2]}`)
    // …and a builder named after its way (e7_unnamedMidRise_256067734)
    const inName = /_(\d{6,})$/.exec(name)
    return { file: s.file, way: ways.length ? ways[ways.length - 1] : inName ? `way/${inName[1]}` : null }
  }
  return null
}

const EXPERIMENT = /^(e\d+|r\d+|kit|exp|test|demo)_|^kit[A-Z]|Variant|Trial|Naive|_naive|_v\d+$/
const rows: { kind: string; name: string; file: string; way: string; by?: string }[] = []
let experiments = 0
for (const name of Object.keys(PROCEDURAL)) {
  if (used.has(name)) continue
  if (EXPERIMENT.test(name)) { experiments++; if (!all) continue }
  const at = find(name)
  const way = at?.way ?? null
  const by = way ? placedWay.get(way) : undefined
  rows.push({ kind: EXPERIMENT.test(name) ? 'experiment' : by ? 'SUPERSEDED' : way ? 'UNPLACED' : 'NO OSM ID', name, file: at?.file ?? '?', way: way ?? '-', by })
}
const order = ['UNPLACED', 'NO OSM ID', 'SUPERSEDED', 'experiment']
rows.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.file.localeCompare(b.file))
const count = (k: string): number => rows.filter((r) => r.kind === k).length
console.log(`${Object.keys(PROCEDURAL).length} builders; ${used.size} placed by a manifest; not placed: ${count('UNPLACED')} UNPLACED, `
  + `${count('NO OSM ID')} with no OSM id, ${count('SUPERSEDED')} superseded, ${experiments} experiments/kit samples${all ? '' : ' (--all lists them)'}`)
for (const r of rows) {
  console.log(`  ${r.kind.padEnd(10)} ${r.name.padEnd(40)} ${r.way.padEnd(18)} ${r.by ? `placed as ${r.by}` : ''}${r.by ? '' : r.file}`)
}
if (!existsSync(join(ROOT, 'public', 'landmarks'))) process.exit(1)
