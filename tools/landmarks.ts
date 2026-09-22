/**
 * The landmarks in each city, as a plain list a person can read and act on.
 *
 * OSM's building data is good enough for a street of houses and nowhere near good enough for the Colonne
 * de Juillet, which it knows as a round footprint with a height — so the one thing in the Place de la
 * Bastille that everyone recognises renders as a blank drum. The fix for that is a hand-made or sourced
 * model per landmark, and the first step is knowing which landmarks each map actually contains.
 *
 * This writes docs/landmarks/<city>.txt: every named monument, memorial, place of worship, tower, palace,
 * museum and attraction inside the city's box, most important first, each with its OSM id (which is what a
 * replacement model will be keyed to), its coordinates, and links to compare it with reality.
 *
 *   npm run landmarks                  every city
 *   npm run landmarks -- paris-marais  just the one
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CITIES, bboxOf, type CitySpec } from './cities.ts'
import { cityQuery, overpass } from './overpass.ts'
import { kindOf, landmarkQuery as query, score } from './landmark-rank.ts'

type Element = {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: Record<string, string>
}

async function run(c: CitySpec): Promise<void> {
  const res = await overpass(query(c)) as unknown as {
    ways: Element[]; nodes: Element[]; relations: Element[]
  }
  const all = [...res.nodes, ...res.ways, ...res.relations]
    .map((e) => ({ e, at: e.center ?? (e.lat !== undefined ? { lat: e.lat, lon: e.lon! } : null) }))
    .filter((x) => x.at && x.e.tags.name)
  // one entry per name: a church is often mapped as a building AND a place of worship AND a node
  const byName = new Map<string, (typeof all)[number]>()
  for (const x of all) {
    const held = byName.get(x.e.tags.name)
    if (!held || score(x.e.tags) > score(held.e.tags)) byName.set(x.e.tags.name, x)
  }
  const list = [...byName.values()].sort((a, b) => score(b.e.tags) - score(a.e.tags))

  const lines: string[] = [
    `${c.name} — landmarks (${list.length})`,
    `Generated ${new Date().toISOString().slice(0, 10)} from OpenStreetMap (© OpenStreetMap contributors, ODbL).`,
    `Most important first. A replacement model is keyed to the OSM id: "${'way/123'}" etc.`,
    '',
  ]
  for (const { e, at } of list) {
    const t = e.tags
    const facts = [kindOf(t), t.height ? `${t.height} m` : '', t['building:levels'] ? `${t['building:levels']} levels` : '',
      t.start_date ? `built ${t.start_date}` : ''].filter(Boolean).join(', ')
    lines.push(`* ${t.name}${t['name:en'] && t['name:en'] !== t.name ? `  (${t['name:en']})` : ''}`)
    lines.push(`    ${facts}`)
    lines.push(`    osm: ${e.type}/${e.id}   https://www.openstreetmap.org/${e.type}/${e.id}`)
    lines.push(`    at:  ${at!.lat.toFixed(6)}, ${at!.lon.toFixed(6)}   https://www.google.com/maps?q=${at!.lat.toFixed(6)},${at!.lon.toFixed(6)}`)
    if (t.wikipedia) lines.push(`    wikipedia: ${t.wikipedia}`)
    if (t.wikidata) lines.push(`    wikidata: https://www.wikidata.org/wiki/${t.wikidata}`)
    lines.push('')
  }
  /*
   * Named bridges, for sourcing bridge models (a manifest entry with "fit": "span", PLAN item D step 8):
   * every way with `bridge` and a name, grouped by name, with the way ids the entry must list. Read from the
   * bake's own cached query, so this costs no new request.
   */
  const main = await overpass(cityQuery(bboxOf(c)))
  const bridges = new Map<string, number[]>()
  for (const w of main.ways) {
    if (!w.tags.bridge || w.tags.bridge === 'no' || !w.tags.name || !(w.tags.highway || w.tags.railway)) continue
    bridges.set(w.tags.name, [...(bridges.get(w.tags.name) ?? []), w.id])
  }
  if (bridges.size > 0) {
    lines.push('', `Named bridges (${bridges.size}) — a model entry lists all of a bridge's ways, "fit": "span"`, '')
    for (const [name, ids] of [...bridges].sort()) {
      lines.push(`* ${name}`, `    osm: ${ids.map((i) => `way/${i}`).join(', ')}`, '')
    }
  }
  const dir = resolve(import.meta.dirname, '..', 'docs', 'landmarks')
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, `${c.id}.txt`), lines.join('\n'))
  console.log(`  ${c.id}: ${list.length} landmarks → docs/landmarks/${c.id}.txt`)
}

/**
 * The credit lines for every model a manifest uses (public/landmarks/<city>.json), for CREDITS.md — and a
 * flag on every licence that is not Creative Commons, because shipping a 3D Warehouse model under the
 * General Model Licence is redistribution and has to be decided per model (tools/skp2glb/README.md).
 */
function credits(c: CitySpec): void {
  const file = resolve(import.meta.dirname, '..', 'public', 'landmarks', `${c.id}.json`)
  if (!existsSync(file)) return
  const entries = JSON.parse(readFileSync(file, 'utf8')) as { name: string; file?: string; procedural?: string
    source?: string; licence?: string; author?: string }[]
  const models = entries.filter((e) => e.file)
  console.log(`  ${c.id}: ${entries.length} landmarks in the manifest (${entries.filter((e) => e.procedural).length} procedural, ${models.length} models)`)
  for (const e of models) {
    const cc = /\bCC[- ]?(BY|0|ZERO)|creative commons|public domain/i.test(e.licence ?? '')
    console.log(`    - "${e.name}" by ${e.author ?? 'UNKNOWN AUTHOR'}, ${e.licence ?? 'NO LICENCE RECORDED'}, ${e.source ?? 'no source URL'}`
      + (cc ? '' : '   ← NOT CC: decide before shipping'))
  }
}

const only = process.argv[2]
for (const c of CITIES.filter((c) => !only || c.id === only)) {
  credits(c)
  await run(c)
}
