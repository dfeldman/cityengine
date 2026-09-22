/**
 * The buildings San Francisco must have modelled one by one (user, 2026-09-22: "we should individually model every
 * building over 10 stories, as well as every civic building/park. at least"): from the Overpass cache the bake
 * filled, every building of ten storeys or 35 m and over, every civic building, and every park, with whether the
 * landmark manifest (public/landmarks/san-francisco.json) has it yet. Writes docs/sf-targets.json and prints the
 * list, tallest first.
 *   node --experimental-strip-types tools/sf-targets.ts [--missing]
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bboxOf, city } from './cities.ts'

const bb = bboxOf(city('san-francisco'))
const dir = resolve(import.meta.dirname, 'cache')
type El = { type: string; id: number; tags?: Record<string, string>; geometry?: { lat: number; lon: number }[]; center?: { lat: number; lon: number }; members?: { geometry?: { lat: number; lon: number }[] }[] }
const seen = new Map<string, El>()
for (const f of readdirSync(dir)) {
  if (!f.startsWith('overpass-')) continue
  let d: { elements?: El[] }
  try { d = JSON.parse(readFileSync(resolve(dir, f), 'utf8')) } catch { continue }
  for (const e of d.elements ?? []) {
    if (!e.tags) continue
    const g = e.geometry ?? e.members?.flatMap((m) => m.geometry ?? [])
    const p = e.center ?? (g && g.length ? { lat: g.reduce((a, q) => a + q.lat, 0) / g.length, lon: g.reduce((a, q) => a + q.lon, 0) / g.length } : undefined)
    if (!p || p.lat < bb.south || p.lat > bb.north || p.lon < bb.west || p.lon > bb.east) continue
    seen.set(`${e.type}/${e.id}`, { ...e, center: p })
  }
}
const { readManifestFile } = await import('../src/city/manifest.ts')
const list = await readManifestFile<{ osm?: string | string[] }>(resolve(import.meta.dirname, '..', 'public', 'landmarks', 'san-francisco.json'))
const done = new Set(list.flatMap((l) => (Array.isArray(l.osm) ? l.osm : l.osm ? [l.osm] : [])))
const CIVIC_AMENITY = /^(townhall|courthouse|library|fire_station|police|community_centre|post_office|arts_centre|theatre|place_of_worship|school|college|university|hospital|social_facility)$/
const CIVIC_BUILDING = /^(civic|government|public|cathedral|church|temple|train_station|transportation|museum)$/
const out: { kind: string; id: string; name: string; height: number; levels: number; lat: number; lon: number; done: boolean; tags: string }[] = []
for (const [id, e] of seen) {
  const t = e.tags!
  const levels = Number(t['building:levels']) || 0
  const height = parseFloat(t.height ?? '') || levels * 3.4
  const b = t.building ?? t['building:part']
  let kind = ''
  if (b && (levels >= 10 || height >= 35)) kind = 'tall'
  else if (b && (CIVIC_BUILDING.test(b) || CIVIC_AMENITY.test(t.amenity ?? '') || t.tourism === 'museum' || t.office === 'government')) kind = 'civic'
  else if (!b && (t.leisure === 'park' || t.leisure === 'garden' || t.leisure === 'playground') && t.name) kind = t.leisure
  if (!kind) continue
  out.push({ kind, id, name: t.name ?? t['addr:housenumber'] ? `${t.name ?? ''}${t.name ? '' : `${t['addr:housenumber']} ${t['addr:street'] ?? ''}`}`.trim() : '', height: Math.round(height), levels, lat: +e.center!.lat.toFixed(6), lon: +e.center!.lon.toFixed(6), done: done.has(id),
    tags: [t.building && `building=${t.building}`, t.amenity && `amenity=${t.amenity}`, t.religion, t['building:material'] && `material=${t['building:material']}`, t['roof:shape'] && `roof=${t['roof:shape']}`].filter(Boolean).join(' ') })
}
out.sort((a, b) => (a.kind === b.kind ? b.height - a.height : a.kind.localeCompare(b.kind)))
writeFileSync(resolve(import.meta.dirname, '..', 'docs', 'sf-targets.json'), JSON.stringify(out, null, 1))
const by = new Map<string, number>()
for (const o of out) by.set(o.kind, (by.get(o.kind) ?? 0) + 1)
console.log([...by].map(([k, v]) => `${k} ${v}`).join(', '), `— ${out.filter((o) => o.done).length} modelled`)
const missing = process.argv.includes('--missing')
for (const o of out) if (!missing || !o.done) console.log(`${o.kind.padEnd(10)} ${String(o.height).padStart(4)} m ${String(o.levels).padStart(3)} fl  ${o.done ? '✓' : ' '} ${o.id.padEnd(18)} ${o.name.slice(0, 44).padEnd(44)} ${o.tags}`)
