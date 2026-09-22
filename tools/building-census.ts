/**
 * What OSM actually says about a city's buildings (for inferring building types — SF_PLAN.md §1): reads the
 * Overpass cache the bake filled, keeps the building ways inside the city's box, and tallies the tags that tell
 * one kind of building from another — building=*, levels and height, material, roof, start_date, amenity/shop/
 * office/tourism, architect and architecture, name — plus how often each is present at all.
 *   node --experimental-strip-types tools/building-census.ts [city] [--tag=building:material] [--top=25]
 */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bboxOf, city as cityOf } from './cities.ts'

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const id = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'san-francisco'
const c = cityOf(id)
const bb = bboxOf(c)
const top = Number(arg('top', '20'))
const dir = resolve(import.meta.dirname, 'cache')

type El = { type: string; id: number; tags?: Record<string, string>; geometry?: { lat: number; lon: number }[]; center?: { lat: number; lon: number } }
const seen = new Map<string, El>()
for (const f of readdirSync(dir)) {
  if (!f.startsWith('overpass-')) continue
  let d: { elements?: El[] }
  try { d = JSON.parse(readFileSync(resolve(dir, f), 'utf8')) } catch { continue }
  for (const e of d.elements ?? []) {
    if (!e.tags?.building && !e.tags?.['building:part']) continue
    const p = e.center ?? e.geometry?.[0]
    if (!p || p.lat < bb.south || p.lat > bb.north || p.lon < bb.west || p.lon > bb.east) continue
    seen.set(`${e.type}/${e.id}`, e)
  }
}
const els = [...seen.values()].filter((e) => e.tags!.building)
console.log(`${id}: ${els.length} buildings (+${seen.size - els.length} parts) in the box`)

const tally = (key: (t: Record<string, string>) => string | undefined, label: string): void => {
  const m = new Map<string, number>()
  let have = 0
  for (const e of els) {
    const v = key(e.tags!)
    if (v === undefined) continue
    have++
    m.set(v, (m.get(v) ?? 0) + 1)
  }
  const rows = [...m].sort((a, b) => b[1] - a[1]).slice(0, top)
  console.log(`\n${label}: present on ${have} (${((have / els.length) * 100).toFixed(1)}%)`)
  for (const [v, n] of rows) console.log(`  ${String(n).padStart(6)}  ${v}`)
}

if (arg('tag')) {
  tally((t) => t[arg('tag')], arg('tag'))
} else {
  tally((t) => t.building, 'building')
  tally((t) => t['building:levels'] ? String(Math.min(60, Math.round(Number(t['building:levels'])))) : undefined, 'building:levels')
  tally((t) => t.height ? `${Math.min(300, Math.round(Number(t.height) / 10) * 10)} m` : undefined, 'height (10 m bins)')
  tally((t) => t['building:material'], 'building:material')
  tally((t) => t['building:colour'], 'building:colour')
  tally((t) => t['roof:shape'], 'roof:shape')
  tally((t) => t['roof:material'], 'roof:material')
  tally((t) => t.start_date ? `${Math.floor(Number(String(t.start_date).slice(0, 4)) / 10) * 10}s` : undefined, 'start_date (decade)')
  tally((t) => t['building:architecture'] ?? t.architecture, 'architecture')
  tally((t) => t.amenity, 'amenity')
  tally((t) => t.shop ? 'shop' : t.office ? 'office' : t.tourism ?? undefined, 'shop / office / tourism')
  tally((t) => (t.name ? 'named' : undefined), 'name')
  tally((t) => (t['addr:housenumber'] ? 'address' : undefined), 'addr:housenumber')
  tally((t) => (t['sfgov:blklot'] || t['sf:blklot'] ? 'blklot' : undefined), 'SF assessor block/lot (import)')
  tally((t) => Object.keys(t).find((k) => /^(sfgov|sf|lacounty|nycdoitt|chicago):/.test(k))?.split(':')[0], 'import prefix')
}
