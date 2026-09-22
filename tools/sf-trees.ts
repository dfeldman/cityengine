/**
 * San Francisco's street trees, every one (SF_PLAN.md §5): DataSF's "Street Tree List" (tkzw-k3nq), kept by Public
 * Works — species, position and trunk diameter for the trees on the city's pavements and medians. It is how the
 * city's plants come out right: the Canary palms on the Embarcadero where they are, the London planes, ficus,
 * Brisbane box, New Zealand Christmas trees and Victorian box of the side streets, each where it stands and at its
 * size.
 *
 * Fetched through the Socrata API a page at a time, compacted, cached in tools/cache/ (like the parcels). The data is
 * the City and County of San Francisco's, under the PDDL.
 *
 *   node --experimental-strip-types tools/sf-trees.ts          fetch (or re-use) and list the commonest species
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CACHE = resolve(import.meta.dirname, 'cache')
const DATASET = 'https://data.sfgov.org/resource/tkzw-k3nq.json'

/** One tree: [lon, lat, species (the Latin name), trunk diameter in inches (0 unknown)] */
export type StreetTree = [number, number, string, number]

export async function fetchStreetTrees(b: { south: number; north: number; west: number; east: number }): Promise<StreetTree[]> {
  mkdirSync(CACHE, { recursive: true })
  const file = resolve(CACHE, `sf-trees-${b.south.toFixed(4)}_${b.west.toFixed(4)}_${b.north.toFixed(4)}_${b.east.toFixed(4)}.json`)
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as StreetTree[]
  const out: StreetTree[] = []
  const page = 20000
  for (let offset = 0; ; offset += page) {
    const q = new URLSearchParams({
      $limit: String(page), $offset: String(offset), $order: 'treeid',
      $where: `latitude > ${b.south} AND latitude < ${b.north} AND longitude > ${b.west} AND longitude < ${b.east}`,
    })
    let rows: Record<string, string>[] = []
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(`${DATASET}?${q}`, { headers: { 'User-Agent': 'streetrunner-bake/0.1 (offline city bake)' } })
      if (res.ok) { rows = (await res.json()) as Record<string, string>[]; break }
      process.stderr.write(`  sf-trees: ${res.status}, retrying\n`)
      await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)))
    }
    for (const r of rows) {
      const lat = Number(r.latitude)
      const lon = Number(r.longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
      // "Platanus x hispanica :: Sycamore: London Plane" → the Latin half
      const latin = String(r.species ?? '').split('::')[0].trim()
      out.push([lon, lat, latin, Number(r.mapdbh) || 0])
    }
    process.stderr.write(`  sf-trees: ${out.length} trees\n`)
    if (rows.length < page) break
  }
  writeFileSync(file, JSON.stringify(out))
  return out
}

if (import.meta.main) {
  const { bboxOf, city } = await import('./cities.ts')
  const trees = await fetchStreetTrees(bboxOf(city('san-francisco')))
  const m = new Map<string, number>()
  for (const t of trees) m.set(t[2], (m.get(t[2]) ?? 0) + 1)
  console.log(`${trees.length} street trees`)
  for (const [k, v] of [...m].sort((a, b) => b[1] - a[1]).slice(0, 45)) console.log(`  ${String(v).padStart(6)}  ${k}`)
}
