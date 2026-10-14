/**
 * Re-convert a city's bake-private v2 tiles (tools/bake-files.ts: tools/cache/bake/<id>/) to the shipped map format v3
 * (docs/MAP-FORMAT.md, public/cities/<id>/v3/) — after the v2 tiles were edited without a full bake
 * (`npm run bake -- <city> --decks`). Writes a new bake number into both, so nothing reads the old v3 with the new.
 *
 *   npm run map:v3 -- san-francisco
 *
 * The ground is the tiles' own blocks over the coarse grid. The zones and the datum's true elevation are the bake's to
 * know: they are carried over from the v3 index already there.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { Terrain } from '../src/city/terrain.ts'
import { writeV3 } from './v3-writer.ts'
import type { MapIndex } from '../src/map/format.ts'
import { SHIPPED, newBakeId, readV2, recordBake, shippedDir } from './bake-files.ts'

const id = process.argv.slice(2).find((a) => !a.startsWith('-'))
if (!id) { console.error('usage: map-v3 <city>'); process.exit(1) }
const { index, tiles } = readV2(id)
const t0 = Date.now()
const terrain = new Terrain(index.terrain ?? null, index.tile)
for (const t of tiles) { const [tx, tz] = t.key.split(',').map(Number); terrain.addTile(tx, tz, t.terrain) }
const oldFile = join(shippedDir(id), 'index.json')
const old = existsSync(oldFile) ? JSON.parse(readFileSync(oldFile, 'utf8')) as MapIndex : null
const bake = newBakeId()
const { index: m, stats, bytes } = writeV3(resolve(SHIPPED, id), index, tiles, { raw: (x, z) => terrain.rawHeightAt(x, z), keep: old ? { zones: old.zones, datumMsl: old.datumMsl } : undefined, bake })
recordBake(id, bake)
if (old?.zones?.length) console.log(`  kept from the index already there: ${old.zones.length} zones, datum ${old.datumMsl} m`)
const v2 = index.tiles.reduce((s, e) => s + e.bytes, 0)
console.log(`${id}: bake ${bake} · ${stats.tiles} tiles in ${((Date.now() - t0) / 1000).toFixed(1)} s · ${(bytes / 1e6).toFixed(1)} MB (v2 ${(v2 / 1e6).toFixed(1)} MB) · zFloor ${m.zFloor} cm`)
console.log(`  dict: ${m.dict.names.length} names, ${m.dict.kinds.length} kinds, ${m.dict.items.length} item types, ${m.dict.styles.length} styles`)
console.log(`  streets carrying their own z at a junction: ${stats.zOverrides} · unshared junctions: ${stats.unsharedJunctions} · below zFloor: ${stats.belowFloor}`)
