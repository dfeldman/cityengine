/**
 * Convert a baked city's v2 tiles to map format v3 (docs/MAP-FORMAT.md §12 step 1). No re-bake: it reads
 * `public/cities/<id>/{index.json, terrain.bin, tiles/}` and writes `public/cities/<id>/v3/`.
 *
 *   npm run map:v3 -- paris-marais
 *   npm run map:v3 -- san-francisco          (111 000 tiles: a few minutes, streamed a row at a time)
 *
 * Two passes. The first finds what no single tile knows — the city's lowest height (zFloor) and every street's
 * junction pair (so dual carriageways number the same in every tile). The second converts, holding three rows
 * of tiles at once: a building filed in one tile may stand on its neighbour's ground.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CityIndex, TileData } from '../src/city/tiles.ts'
import { Terrain } from '../src/city/terrain.ts'
import { convertTile, DictBuilder, edgeRefs, newStats } from '../src/map/convert.ts'
import { convertIndex, FloorScan } from '../src/map/convert-city.ts'
import type { MapIndex } from '../src/map/format.ts'
import type { PackedEdge } from '../src/city/package.ts'

const id = process.argv.slice(2).find((a) => !a.startsWith('-'))
if (!id) { console.error('usage: map-v3 <city>'); process.exit(1) }
const dir = join('public/cities', id)
const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8')) as CityIndex
if (index.terrain?.bin) {
  const buf = readFileSync(join(dir, index.terrain.bin))
  const dm = new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2)
  index.terrain.heights = Float32Array.from(dm, (d) => d / 10)
}
const file = (tx: number, tz: number): string => join(dir, 'tiles', `${tx}_${tz}.json`)
const read = (tx: number, tz: number): TileData | null => (existsSync(file(tx, tz)) ? JSON.parse(readFileSync(file(tx, tz), 'utf8')) as TileData : null)
const entries = [...index.tiles].sort((a, b) => a.tz - b.tz || a.tx - b.tx)

// ---- pass 1
const t0 = Date.now()
const floor = new FloorScan()
if (index.terrain) floor.addArray(index.terrain.heights)
const edges = new Map<number, PackedEdge>()
for (const e of entries) {
  const t = read(e.tx, e.tz)
  if (!t) continue
  floor.tile(t)
  for (const g of t.edges) if (!edges.has(g.id)) edges.set(g.id, { id: g.id, a: g.a, b: g.b } as PackedEdge)
}
const refs = edgeRefs(edges.values())
const zFloor = floor.zFloor
console.log(`pass 1: ${entries.length} tiles, ${edges.size} streets, lowest ${floor.min.toFixed(2)} m → zFloor ${zFloor} cm (${((Date.now() - t0) / 1000).toFixed(1)} s)`)

// ---- pass 2
const out = join(dir, 'v3')
mkdirSync(out, { recursive: true })
// stale tiles from an earlier conversion would be served as if current
for (const f of readdirSync(out)) if (f.endsWith('.json')) rmSync(join(out, f))
const dict = new DictBuilder()
const stats = newStats()
const terrain = new Terrain(index.terrain ?? null, index.tile)
const rows = new Map<number, Map<number, TileData>>()
const rowOf = (tz: number): Map<number, TileData> => {
  let r = rows.get(tz)
  if (!r) {
    r = new Map()
    for (const e of entries) if (e.tz === tz) { const t = read(e.tx, e.tz); if (t) { r.set(e.tx, t); terrain.addTile(e.tx, e.tz, t.terrain) } }
    rows.set(tz, r)
  }
  return r
}
const written: MapIndex['tiles'] = []
let row = Number.NaN
for (const e of entries) {
  if (e.tz !== row) {
    row = e.tz
    for (const [tz, r] of rows) if (tz < row - 1) { for (const tx of r.keys()) terrain.dropTile(tx, tz); rows.delete(tz) }
    rowOf(row - 1)
    rowOf(row + 1)
  }
  const t = rowOf(row).get(e.tx)
  if (!t) continue
  const m = convertTile(t, {
    zFloor, dict, heightAt: (x, z) => terrain.rawHeightAt(x, z), edgeRef: (g) => refs.get(g.id)!, stats,
  })
  const text = JSON.stringify(m)
  writeFileSync(join(out, `${e.tx}_${e.tz}.json`), text)
  written.push({ key: e.key, tx: e.tx, ty: e.tz, bytes: text.length, buildings: e.buildings, edges: e.edges })
}
const idx3 = convertIndex(index, zFloor, dict.dict, written, (index as CityIndex & { seaLevel?: number | null }).seaLevel)
writeFileSync(join(out, 'index.json'), JSON.stringify(idx3))
const v2Bytes = entries.reduce((s, e) => s + e.bytes, 0)
const v3Bytes = written.reduce((s, e) => s + e.bytes, 0)
console.log(`pass 2: ${stats.tiles} tiles in ${((Date.now() - t0) / 1000).toFixed(1)} s · ${(v3Bytes / 1e6).toFixed(1)} MB (v2 ${(v2Bytes / 1e6).toFixed(1)} MB)`)
console.log(`  dict: ${dict.dict.names.length} names, ${dict.dict.kinds.length} kinds, ${dict.dict.items.length} item types, ${dict.dict.styles.length} styles`)
console.log(`  streets carrying their own z at a junction: ${stats.zOverrides} · unshared junctions: ${stats.unsharedJunctions} · below zFloor: ${stats.belowFloor}`)
