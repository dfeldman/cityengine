/**
 * The cemeteries of a city, for render/cemeteries.ts: every `landuse=cemetery` / `amenity=grave_yard` area in the
 * city's DETAIL box, from the local pbf (no bake: nothing here is a computed stage, only OSM outlines and a style).
 *
 *   node --experimental-strip-types tools/cemeteries.ts --city=paris-centre
 *   node --experimental-strip-types tools/cemeteries.ts --city=san-francisco
 *
 * Writes public/landmarks/<region>-cemeteries.json: [{ name, osm, style, ring: [[lat, lon]…], holes? }].
 * The style is a rule on the name (STYLE_RULES), else the region's default. Outlines under MIN_AREA m² are left
 * out (a churchyard corner). Cemeteries already drawn by a landmark builder are in SKIP.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { city, detailBboxOf } from './cities.ts'

const MIN_AREA = 600
/** drawn elsewhere: puteauxCemetery (landmarks/paris/minor), the SF National Cemetery's own renderer (render/sf/cemetery.ts) */
const SKIP = /Nouveau de Puteaux|San Francisco National Cemetery|Parc du Vieux Cimeti/i
/** first match wins; style ids are render/cemeteries.ts STYLES */
const STYLE_RULES: [RegExp, string][] = [
  [/militaire am[ée]ricain|american|national cemetery/i, 'military-cross'],
  [/pet cemetery/i, 'pet'],
  [/Mission Dolores/i, 'us-old'],
  // the romantic hillside cemeteries of 1800–1830 and the old village churchyards: chapels, statues, moss
  [/P[èe]re[- ]Lachaise|Montmartre|Passy|Picpus|Charonne|Belleville|Saint-Vincent|Calvaire|Saint-Pierre/i, 'paris-old'],
  // the other intra-muros ones: a mix of chapels and polished granite slabs, gridded
  [/Montparnasse|Batignolles|Vaugirard|Grenelle|Auteuil|Bercy|La Villette/i, 'paris-classic'],
]
const DEFAULT: Record<string, string> = { paris: 'paris-suburban', 'san-francisco': 'us-old' }
const PBF: Record<string, string> = { paris: 'ile-de-france-latest.osm.pbf', 'san-francisco': 'norcal-latest.osm.pbf' }

const id = process.argv.find((a) => a.startsWith('--city='))?.slice(7) ?? 'paris-centre'
const spec = city(id)
const region = spec.region ?? id
const b = detailBboxOf(spec)
const tmp = mkdtempSync(join(tmpdir(), 'cem-'))
const src = join('tools/cache/osm', PBF[region])
execFileSync('osmium', ['extract', '-b', `${b.west},${b.south},${b.east},${b.north}`, src, '-o', join(tmp, 'box.pbf'), '--overwrite'])
execFileSync('osmium', ['tags-filter', join(tmp, 'box.pbf'), 'a/landuse=cemetery', 'a/amenity=grave_yard', '-o', join(tmp, 'cem.pbf'), '--overwrite'])
const geo = execFileSync('osmium', ['export', join(tmp, 'cem.pbf'), '-f', 'geojsonseq', '--add-unique-id=type_id'], { maxBuffer: 1 << 28 }).toString()

const mLat = 111_320
const mLon = 111_320 * Math.cos((spec.centre.lat * Math.PI) / 180)
const area = (r: number[][]): number => {
  let s = 0
  for (let i = 0; i + 1 < r.length; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]
  return Math.abs(s / 2) * mLat * mLon
}
const out: { name: string; osm: string; style: string; ring: [number, number][]; holes?: [number, number][][] }[] = []
for (const line of geo.split('\n')) {
  const t = line.replace(/^\x1e/, '').trim()
  if (!t) continue
  const f = JSON.parse(t)
  const g = f.geometry
  const p = f.properties ?? {}
  const name: string = p.name ?? ''
  if (SKIP.test(name)) continue
  const polys: number[][][][] = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
  for (const poly of polys) {
    if (area(poly[0]) < MIN_AREA) continue
    const style = STYLE_RULES.find(([re]) => re.test(name))?.[1] ?? DEFAULT[region] ?? 'us-old'
    const ll = (r: number[][]): [number, number][] => r.map(([lon, lat]) => [+lat.toFixed(7), +lon.toFixed(7)])
    out.push({ name, osm: String(f.id ?? ''), style, ring: ll(poly[0]), ...(poly.length > 1 ? { holes: poly.slice(1).map(ll) } : {}) })
  }
}
out.sort((a, c) => a.name.localeCompare(c.name))
writeFileSync(`public/landmarks/${region}-cemeteries.json`, JSON.stringify(out) + '\n')
const by: Record<string, number> = {}
for (const c of out) by[c.style] = (by[c.style] ?? 0) + 1
console.log(`${region}: ${out.length} cemeteries`, by)
for (const c of out) console.log(`  ${c.style.padEnd(15)} ${Math.round(area(c.ring.map(([la, lo]) => [lo, la])))} m²  ${c.name || '(unnamed)'}`)
