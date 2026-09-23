/**
 * Download a Geofabrik extract once, so the bake never has to ask Overpass again.
 *
 *   node --experimental-strip-types tools/osm-fetch.ts              # what we have, and how old it is
 *   node --experimental-strip-types tools/osm-fetch.ts norcal       # fetch a known region
 *   node --experimental-strip-types tools/osm-fetch.ts <url>        # anything on download.geofabrik.de
 *
 * The files live in `tools/cache/osm/` (gitignored, like the rest of the cache) beside a `.source.json`
 * saying where each came from and when it was fetched. A file is re-downloaded only when asked for again:
 * OSM data goes stale slowly, and a bake of a two-week-old extract is a bake of a two-week-old city, which is
 * almost always what you want. See docs/OSM-DATA.md.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { OSM_DIR, extracts, osmiumAvailable } from './osm-local.ts'

/** The regions the cities need. A name not here can be given as a full Geofabrik URL instead. */
export const REGIONS: Record<string, string> = {
  norcal: 'https://download.geofabrik.de/north-america/us/california/norcal-latest.osm.pbf',
  california: 'https://download.geofabrik.de/north-america/us/california-latest.osm.pbf',
  illinois: 'https://download.geofabrik.de/north-america/us/illinois-latest.osm.pbf',
  'new-york': 'https://download.geofabrik.de/north-america/us/new-york-latest.osm.pbf',
  'ile-de-france': 'https://download.geofabrik.de/europe/france/ile-de-france-latest.osm.pbf',
}

async function fetchExtract(url: string): Promise<void> {
  mkdirSync(OSM_DIR, { recursive: true })
  const name = url.split('/').pop()!
  const out = resolve(OSM_DIR, name)
  const part = `${out}.part`
  process.stderr.write(`osm: downloading ${url}\n`)
  // curl, not fetch(): a 1 GB download wants resume and a progress bar more than it wants to be in-process
  execFileSync('curl', ['-fL', '--retry', '3', '-C', '-', '-o', part, url], { stdio: 'inherit' })
  renameSync(part, out)
  writeFileSync(`${out}.source.json`, `${JSON.stringify({ url, fetched: new Date().toISOString() }, null, 2)}\n`)
  process.stderr.write(`osm: ${name} — ${(statSync(out).size / 1e9).toFixed(2)} GB\n`)
}

function status(): void {
  process.stdout.write(osmiumAvailable() ? 'osmium: installed\n' : 'osmium: NOT installed (brew install osmium-tool) — bakes will use Overpass\n')
  const have = extracts()
  if (!have.length) {
    process.stdout.write(`no extracts in ${OSM_DIR}\n  try: node --experimental-strip-types tools/osm-fetch.ts norcal\n`)
    return
  }
  for (const e of have) {
    const days = e.timestamp ? (Date.now() - Date.parse(e.timestamp)) / 86_400_000 : NaN
    process.stdout.write(`${e.path.split('/').pop()}  ${(statSync(e.path).size / 1e9).toFixed(2)} GB  `
      + `data of ${e.timestamp || 'unknown date'}${Number.isFinite(days) ? ` (${days.toFixed(0)} days old)` : ''}\n`
      + `  covers ${e.bbox.west.toFixed(3)},${e.bbox.south.toFixed(3)} .. ${e.bbox.east.toFixed(3)},${e.bbox.north.toFixed(3)}\n`)
  }
}

const arg = process.argv[2]
if (!arg) status()
else {
  const url = arg.startsWith('http') ? arg : REGIONS[arg]
  if (!url) {
    process.stderr.write(`unknown region ${arg}; known: ${Object.keys(REGIONS).join(', ')} (or give a URL)\n`)
    process.exit(1)
  }
  await fetchExtract(url)
  status()
}
