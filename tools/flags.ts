/**
 * THE FLAGS OF A CITY, from OSM's flagpoles (owner, 2026-10-03: "SF is festooned with many flags … we should have
 * flags on many of the buildings that do in real life … not just US but city, county, state, other countries"; "flags
 * will be important when we add other cities, to remind the rider where they are").
 *
 *   node --experimental-strip-types tools/flags.ts [city]
 *
 * Every `man_made=flagpole` in the city's OSM cut, sorted into a flag design by its tags (`flag:name`, `flag:type`,
 * `subject`, `country`), and stood on the roof of the building it is inside (OSM's own outline and height), else on
 * the ground. Writes public/flags/<city>.json, which render/flags.ts draws. A pole that says nothing flies the
 * country's flag, which is what most untagged poles here carry.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseOpl, OSM_DIR } from './osm-local.ts'
import { CITIES } from './cities.ts'

const city = process.argv[2] ?? 'san-francisco'
const spec = CITIES.find((c) => c.id === city)
if (!spec) throw new Error(`no city ${city}`)
const cuts = resolve(OSM_DIR, 'cuts')
const newest = readdirSync(cuts).filter((f) => f.endsWith('.opl')).map((f) => resolve(cuts, f)).sort((a, b) => statSync(b).size - statSync(a).size)[0]
const { nodes, ways } = parseOpl(readFileSync(newest, 'utf8'))

/** a flag's design, from what OSM says it flies */
function kindOf(t: Record<string, string>): string {
  const said = `${t['flag:name'] ?? ''} ${t['flag:type'] ?? ''} ${t.subject ?? ''} ${t.country ?? ''} ${t['flag:wikidata'] ?? ''}`.toLowerCase()
  const rules: [RegExp, string][] = [
    [/pride|rainbow|lgbt/, 'pride'], [/california/, 'california'], [/san francisco/, 'sanfrancisco'],
    // (the People's Republic first: its name contains the Republic of China's)
    [/people.?s republic|\bprc\b/, 'china'], [/taiwan|republic of china/, 'taiwan'], [/\bchina\b/, 'china'], [/ukraine/, 'ukraine'], [/united nations/, 'un'],
    [/united kingdom/, 'uk'], [/\bindia\b/, 'india'], [/emirates/, 'uae'], [/philippines/, 'philippines'],
    [/mexico/, 'mexico'], [/canada/, 'canada'], [/japan/, 'japan'], [/france/, 'france'], [/germany/, 'germany'],
    [/ital/, 'italy'], [/korea/, 'korea'], [/ireland/, 'ireland'], [/united states|national|\bus\b|usa/, 'us'],
  ]
  for (const [re, k] of rules) if (re.test(said)) return k
  if (/advertis|warriors|giants|49ers|sharks|university|asean|team|brand/.test(said)) return 'banner'
  return 'us'
}

// buildings near enough to matter: their outline and height, for a pole on a roof
type B = { ring: { lat: number; lon: number }[]; h: number }
const buildings: B[] = []
for (const w of ways.values()) {
  const t = w.tags
  if (!t.building || !w.geometry || w.geometry.length < 4) continue
  const h = parseFloat(t.height ?? '') || (parseFloat(t['building:levels'] ?? '') ? parseFloat(t['building:levels']) * 3.3 : 0)
  buildings.push({ ring: w.geometry, h: h || 10 })
}
const inside = (r: { lat: number; lon: number }[], lat: number, lon: number): boolean => {
  let c = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const a = r[i], b = r[j]
    if ((a.lat > lat) !== (b.lat > lat) && lon < a.lon + ((lat - a.lat) * (b.lon - a.lon)) / (b.lat - a.lat)) c = !c
  }
  return c
}

const out: { lat: number; lon: number; flag: string; pole: number; roof?: number; osm: number }[] = []
for (const n of nodes.values()) {
  if (n.tags.man_made !== 'flagpole') continue
  const pole = Math.min(30, Math.max(4, parseFloat(n.tags.height ?? '') || 9))
  let roof: number | undefined
  for (const b of buildings) {
    if (inside(b.ring, n.lat, n.lon)) { roof = Math.max(roof ?? 0, b.h); }
  }
  out.push({ lat: +n.lat.toFixed(7), lon: +n.lon.toFixed(7), flag: kindOf(n.tags), pole: roof ? Math.min(pole, 6) : pole, ...(roof ? { roof: +roof.toFixed(1) } : {}), osm: n.id })
}
mkdirSync(resolve(import.meta.dirname, '..', 'public', 'flags'), { recursive: true })
const file = resolve(import.meta.dirname, '..', 'public', 'flags', `${city}.json`)
writeFileSync(file, JSON.stringify(out))
const by = new Map<string, number>()
for (const f of out) by.set(f.flag, (by.get(f.flag) ?? 0) + 1)
console.log(`${out.length} flagpoles (${out.filter((f) => f.roof).length} on roofs) → ${file}`)
console.log([...by.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '))
