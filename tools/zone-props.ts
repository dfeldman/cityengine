/**
 * The RUNTIME props of a city's zones into its baked index, without a bake (2026-10-02).
 *
 * Zones are bake input (docs/MAP-FORMAT.md §7): the terrain step and the planting are baked from them, and the index
 * carries them whole. But some props are only read by the game as it runs — how thick the traffic is (`traffic`), how
 * many people walk (`crowd`) — and a full bake to change a number is an hour wasted. This copies just those from
 * data/zones/<city>.json onto the index's zones of the same `ref`; everything baked is left as it is.
 *
 *   node --experimental-strip-types tools/zone-props.ts [city=san-francisco]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const RUNTIME = ['traffic', 'crowd'] as const

const city = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'san-francisco'
const root = resolve(import.meta.dirname, '..')
const source = JSON.parse(readFileSync(resolve(root, 'data', 'zones', `${city}.json`), 'utf8')) as { zones: { ref: string; props: Record<string, unknown> }[] }
const indexFile = resolve(root, 'public', 'cities', city, 'v3', 'index.json')
const index = JSON.parse(readFileSync(indexFile, 'utf8')) as { zones?: { ref: string; props: Record<string, unknown> }[] }

const byRef = new Map(source.zones.map((z) => [z.ref, z]))
let changed = 0
const missing: string[] = []
for (const z of index.zones ?? []) {
  const src = byRef.get(z.ref)
  if (!src) { missing.push(z.ref); continue }
  for (const k of RUNTIME) {
    const want = src.props[k]
    if (want === z.props[k]) continue
    if (want === undefined) delete z.props[k]
    else z.props[k] = want
    changed++
  }
}
const unbaked = source.zones.filter((z) => !(index.zones ?? []).some((i) => i.ref === z.ref)).map((z) => z.ref)
writeFileSync(indexFile, JSON.stringify(index))
console.log(`${city}: ${changed} runtime props written to ${index.zones?.length ?? 0} zones`
  + (missing.length ? `; in the index but not the source: ${missing.join(', ')}` : '')
  + (unbaked.length ? `; in the source but not baked yet (needs a bake): ${unbaked.join(', ')}` : ''))
