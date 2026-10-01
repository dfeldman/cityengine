/**
 * Convert a city ALREADY BAKED in v2 to map format v3 (docs/MAP-FORMAT.md) — for a city that has not been
 * re-baked since the bake learned to write v3 itself. It reads `public/cities/<id>/{index.json, terrain.bin,
 * tiles/}` and writes `public/cities/<id>/v3/`.
 *
 *   npm run map:v3 -- paris-centre
 *
 * The ground is the tiles' own blocks over the coarse grid — whatever that bake shipped. The zones and the datum's
 * true elevation are the bake's to know: where a v3 index is already there (a bake wrote it, and this is a
 * re-conversion after the v2 tiles were edited — `npm run bake -- <city> --decks`), they are carried over from it.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CityIndex, TileData } from '../src/city/tiles.ts'
import { Terrain } from '../src/city/terrain.ts'
import { writeV3 } from './v3-writer.ts'
import type { MapIndex } from '../src/map/format.ts'

const id = process.argv.slice(2).find((a) => !a.startsWith('-'))
if (!id) { console.error('usage: map-v3 <city>'); process.exit(1) }
const dir = join('public/cities', id)
const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8')) as CityIndex
if (index.terrain?.bin) {
  const buf = readFileSync(join(dir, index.terrain.bin))
  const dm = new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2)
  index.terrain.heights = Float32Array.from(dm, (d) => d / 10)
}
const t0 = Date.now()
const tiles: TileData[] = []
for (const e of index.tiles) {
  const f = join(dir, 'tiles', `${e.tx}_${e.tz}.json`)
  if (existsSync(f)) tiles.push(JSON.parse(readFileSync(f, 'utf8')) as TileData)
}
const terrain = new Terrain(index.terrain ?? null, index.tile)
for (const t of tiles) { const [tx, tz] = t.key.split(',').map(Number); terrain.addTile(tx, tz, t.terrain) }
const old = existsSync(join(dir, 'v3', 'index.json')) ? JSON.parse(readFileSync(join(dir, 'v3', 'index.json'), 'utf8')) as MapIndex : null
const { index: m, stats, bytes } = writeV3(dir, index, tiles, { raw: (x, z) => terrain.rawHeightAt(x, z), keep: old ? { zones: old.zones, datumMsl: old.datumMsl } : undefined })
if (old?.zones?.length) console.log(`  kept from the index already there: ${old.zones.length} zones, datum ${old.datumMsl} m`)
const v2 = index.tiles.reduce((s, e) => s + e.bytes, 0)
console.log(`${id}: ${stats.tiles} tiles in ${((Date.now() - t0) / 1000).toFixed(1)} s · ${(bytes / 1e6).toFixed(1)} MB (v2 ${(v2 / 1e6).toFixed(1)} MB) · zFloor ${m.zFloor} cm`)
console.log(`  dict: ${m.dict.names.length} names, ${m.dict.kinds.length} kinds, ${m.dict.items.length} item types, ${m.dict.styles.length} styles`)
console.log(`  streets carrying their own z at a junction: ${stats.zOverrides} · unshared junctions: ${stats.unsharedJunctions} · below zFloor: ${stats.belowFloor}`)
