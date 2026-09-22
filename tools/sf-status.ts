/**
 * Where San Francisco's individually modelled buildings stand (user, 2026-09-22: "maybe keep a huge csv of
 * building, coordinates, status for all our custom buildings. there are going to be a LOT. just to stay
 * organized"). Derived, never hand-kept: it reads the target list (docs/sf-targets.json, from
 * tools/sf-targets.ts), every manifest fragment under public/landmarks/san-francisco/, and the bail-out lists
 * (docs/sf-batches/*-hard.md), and writes docs/sf-buildings.csv with a row per building.
 *
 *   node --experimental-strip-types tools/sf-status.ts            rewrite the csv and print the tally
 *   node --experimental-strip-types tools/sf-status.ts --todo     …and list what is still to do, tallest first
 *
 * Columns: osm, name, kind (tall/civic/park/…), lat, lon, height, levels, status, how, district, note.
 * `status` is one of model (a builder), restyle (a facade style), hard (bailed out, waiting for a specialist),
 * todo. `how` is the builder's name or the style's.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const targets = JSON.parse(readFileSync(resolve(ROOT, 'docs', 'sf-targets.json'), 'utf8')) as
  { kind: string; id: string; name: string; height: number; levels: number; lat: number; lon: number; done: boolean; tags: string }[]

interface Entry { osm?: string | string[]; name: string; procedural?: string; restyle?: string; note?: string; lat?: number; lon?: number; height?: number }
const manifests: { district: string; entries: Entry[] }[] = []
const dir = resolve(ROOT, 'public', 'landmarks', 'san-francisco')
if (existsSync(dir)) {
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    try { manifests.push({ district: f.replace(/\.json$/, ''), entries: JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as Entry[] }) } catch { /* mid-write */ }
  }
}
// the city's own file, minus its includes
try {
  const own = JSON.parse(readFileSync(resolve(ROOT, 'public', 'landmarks', 'san-francisco.json'), 'utf8')) as (Entry & { include?: string })[]
  manifests.push({ district: 'san-francisco', entries: own.filter((e) => !e.include) })
} catch { /* ignore */ }

const byId = new Map<string, { district: string; e: Entry }>()
const clashes: string[] = []
for (const m of manifests) {
  for (const e of m.entries) {
    for (const id of Array.isArray(e.osm) ? e.osm : e.osm ? [e.osm] : []) {
      const had = byId.get(id)
      // two districts claiming one building: only the first is placed (render/landmarks.ts), so it wants fixing
      if (had && had.e !== e) clashes.push(`${id}: "${had.e.name}" (${had.district}) and "${e.name}" (${m.district})`)
      if (!had || (!had.e.procedural && e.procedural)) byId.set(id, { district: m.district, e })
    }
  }
}
// the bail-outs: a row per building in docs/sf-batches/<district>-hard.md, "| name | osm | …"
const hard = new Map<string, { district: string; why: string }>()
for (const f of readdirSync(resolve(ROOT, 'docs', 'sf-batches'))) {
  if (!f.endsWith('-hard.md')) continue
  const district = f.replace(/-hard\.md$/, '')
  for (const line of readFileSync(resolve(ROOT, 'docs', 'sf-batches', f), 'utf8').split('\n')) {
    const cells = line.split('|').map((c) => c.trim())
    if (cells.length < 4 || !/^(way|relation)\/\d+$/.test(cells[2] ?? '')) continue
    hard.set(cells[2], { district, why: cells[5] ?? cells[cells.length - 2] ?? '' })
  }
}

const rows: string[] = [['osm', 'name', 'kind', 'lat', 'lon', 'height', 'levels', 'status', 'how', 'district', 'note'].join(',')]
const q = (s: string): string => `"${(s ?? '').replace(/"/g, '""')}"`
const tally = new Map<string, number>()
const todo: typeof targets = []
const seen = new Set<string>()
for (const t of targets) {
  seen.add(t.id)
  const got = byId.get(t.id)
  const h = hard.get(t.id)
  const status = got?.e.procedural ? 'model' : got?.e.restyle ? 'restyle' : h ? 'hard' : 'todo'
  const how = got?.e.procedural ?? got?.e.restyle ?? ''
  if (status === 'todo') todo.push(t)
  tally.set(status, (tally.get(status) ?? 0) + 1)
  rows.push([t.id, q(t.name), t.kind, t.lat, t.lon, t.height, t.levels, status, how, got?.district ?? h?.district ?? '', q(got?.e.note ?? h?.why ?? t.tags)].join(','))
}
// and anything modelled that the target list does not have (the piers, the bridges, the small landmarks)
for (const [id, { district, e }] of byId) {
  if (seen.has(id)) continue
  tally.set('extra', (tally.get('extra') ?? 0) + 1)
  rows.push([id, q(e.name), 'other', e.lat ?? '', e.lon ?? '', e.height ?? '', '', e.procedural ? 'model' : 'restyle', e.procedural ?? e.restyle ?? '', district, q(e.note ?? '')].join(','))
}
writeFileSync(resolve(ROOT, 'docs', 'sf-buildings.csv'), rows.join('\n') + '\n')
console.log(`${rows.length - 1} buildings → docs/sf-buildings.csv`)
console.log([...tally].sort().map(([k, v]) => `${k} ${v}`).join(', '))
if (clashes.length > 0) {
  console.log(`\n${clashes.length} buildings claimed by more than one entry — take the wrong one out:`)
  for (const c of clashes) console.log(`  ${c}`)
}
if (process.argv.includes('--todo')) {
  for (const t of todo.sort((a, b) => b.height - a.height).slice(0, 60)) {
    console.log(`${String(t.height).padStart(4)} m  ${t.kind.padEnd(7)} ${t.id.padEnd(18)} ${t.name.slice(0, 44)}`)
  }
}
