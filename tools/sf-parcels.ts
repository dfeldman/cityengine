/**
 * San Francisco's own records of its buildings, for the bake's classifier (SF_PLAN.md §2; user, 2026-09-22: "if we
 * can get construction date on buildings, we could adjust style based on that"). OSM has almost no dates or
 * materials here; the city's Assessor has both, for every parcel:
 *
 *   DataSF "Assessor Historical Secured Property Tax Rolls" (wv5m-vpq2), the 2025 roll:
 *   year_property_built, number_of_stories, number_of_units, use_code (SRES, MRES, COMM, IND, …), and
 *   construction_type — A steel frame, B reinforced concrete, C masonry, D wood frame, S steel.
 *
 * Fetched once through the Socrata API a page at a time (their gateway refuses aggregate and $select queries, so
 * whole rows), compacted to the fields used, and cached in tools/cache/ like the Overpass results. The data is
 * the City and County of San Francisco's, under the PDDL (public domain dedication).
 *
 *   node --experimental-strip-types tools/sf-parcels.ts          fetch (or re-use) the cache and summarise it
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CACHE = resolve(import.meta.dirname, 'cache')
const DATASET = 'https://data.sfgov.org/resource/wv5m-vpq2.json'
const YEAR = '2025'

/** One parcel's record: [lon, lat, year built, stories, units, use code, construction type] */
export type Roll = [number, number, number, number, number, string, string]

export async function fetchRolls(b: { south: number; north: number; west: number; east: number }): Promise<Roll[]> {
  mkdirSync(CACHE, { recursive: true })
  const key = `sf-rolls-${YEAR}-${b.south.toFixed(4)}_${b.west.toFixed(4)}_${b.north.toFixed(4)}_${b.east.toFixed(4)}.json`
  const file = resolve(CACHE, key)
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as Roll[]
  const out: Roll[] = []
  const page = 20000
  for (let offset = 0; ; offset += page) {
    const q = new URLSearchParams({
      $limit: String(page), $offset: String(offset), $order: 'row_id',
      $where: `closed_roll_year='${YEAR}' AND within_box(the_geom, ${b.north}, ${b.west}, ${b.south}, ${b.east})`,
    })
    let rows: Record<string, unknown>[] = []
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(`${DATASET}?${q}`, { headers: { 'User-Agent': 'streetrunner-bake/0.1 (offline city bake)' } })
      if (res.ok) { rows = (await res.json()) as Record<string, unknown>[]; break }
      process.stderr.write(`  sf-parcels: ${res.status}, retrying\n`)
      await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)))
    }
    for (const r of rows) {
      const g = r.the_geom as { coordinates?: [number, number] } | undefined
      if (!g?.coordinates) continue
      const n = (k: string): number => { const v = Number(r[k]); return Number.isFinite(v) ? v : 0 }
      out.push([g.coordinates[0], g.coordinates[1], n('year_property_built'), n('number_of_stories'), n('number_of_units'),
        String(r.use_code ?? ''), String(r.construction_type ?? '')])
    }
    process.stderr.write(`  sf-parcels: ${out.length} parcels\n`)
    if (rows.length < page) break
  }
  writeFileSync(file, JSON.stringify(out))
  return out
}

/** What the rolls say about a building: the parcels whose points lie inside its outline, summarised. */
export interface ParcelFacts { year?: number; stories?: number; units: number; use?: string; construction?: string; parcels: number }

/** A grid over the parcels, and the lookup by outline (lat/lon ring). */
export function parcelIndex(rolls: Roll[]): (ring: { lat: number; lon: number }[]) => ParcelFacts | null {
  const cell = 0.0004                     // about 40 m
  const grid = new Map<string, Roll[]>()
  for (const r of rolls) {
    const k = `${Math.floor(r[0] / cell)}:${Math.floor(r[1] / cell)}`
    const l = grid.get(k)
    if (l) l.push(r)
    else grid.set(k, [r])
  }
  const inside = (ring: { lat: number; lon: number }[], x: number, y: number): boolean => {
    let o = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      if ((ring[i].lat > y) !== (ring[j].lat > y) && x < ((ring[j].lon - ring[i].lon) * (y - ring[i].lat)) / (ring[j].lat - ring[i].lat) + ring[i].lon) o = !o
    }
    return o
  }
  const mode = <T,>(xs: T[]): T | undefined => {
    const m = new Map<T, number>()
    for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1)
    let best: T | undefined
    let bn = 0
    for (const [k, v] of m) if (v > bn) { best = k; bn = v }
    return best
  }
  return (ring) => {
    let w = Infinity, e = -Infinity, s = Infinity, n = -Infinity
    for (const p of ring) { w = Math.min(w, p.lon); e = Math.max(e, p.lon); s = Math.min(s, p.lat); n = Math.max(n, p.lat) }
    const hits: Roll[] = []
    for (let gx = Math.floor(w / cell); gx <= Math.floor(e / cell); gx++) {
      for (let gy = Math.floor(s / cell); gy <= Math.floor(n / cell); gy++) {
        for (const r of grid.get(`${gx}:${gy}`) ?? []) if (inside(ring, r[0], r[1])) hits.push(r)
      }
    }
    if (hits.length === 0) return null
    // the building's age is its OLDEST parcel's: a condo conversion re-dates its units, not the walls
    const years = hits.map((h) => h[2]).filter((y) => y > 1840 && y < 2030)
    const stories = Math.max(0, ...hits.map((h) => h[3]))
    return {
      year: years.length ? Math.min(...years) : undefined,
      stories: stories > 0 ? stories : undefined,
      units: hits.reduce((t, h) => t + h[4], 0),
      use: mode(hits.map((h) => h[5]).filter(Boolean)),
      construction: mode(hits.map((h) => h[6]).filter((c) => c && c !== 'NA')),
      parcels: hits.length,
    }
  }
}

if (import.meta.main) {
  const { bboxOf, city } = await import('./cities.ts')
  const rolls = await fetchRolls(bboxOf(city('san-francisco')))
  const tally = (f: (r: Roll) => string): void => {
    const m = new Map<string, number>()
    for (const r of rolls) m.set(f(r), (m.get(f(r)) ?? 0) + 1)
    console.log([...m].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${k}:${v}`).join('  '))
  }
  console.log(`${rolls.length} parcels`)
  tally((r) => (r[2] > 0 ? `${Math.floor(r[2] / 10) * 10}s` : '?'))
  tally((r) => r[5] || '?')
  tally((r) => r[6] || '?')
}
