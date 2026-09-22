/**
 * The tiles must BE the package (PARIS_EXPAND.md §8): read `public/cities/<id>.json` and the tiles beside it,
 * join the tiles (de-duplicated by id) and compare everything, by id where there are ids. Exits 1 on a
 * mismatch. Also checks every edge is in the tile of each of its points (so a tile's data is complete for it).
 *   node --experimental-strip-types tools/check-tiles.ts [city…]
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { CityPackage } from '../src/city/package.ts'
import { joinTiles, tileKey, tileOf, type CityIndex, type TileData } from '../src/city/tiles.ts'

const OUT = resolve(import.meta.dirname, '..', 'public', 'cities')
const ids = process.argv.slice(2).length ? process.argv.slice(2)
  : (JSON.parse(readFileSync(resolve(OUT, 'index.json'), 'utf8')) as { id: string }[]).map((c) => c.id)
let bad = 0
for (const id of ids) {
  const dir = resolve(OUT, id)
  if (!existsSync(resolve(dir, 'index.json'))) { console.log(`${id}: no tiles`); bad++; continue }
  const pkg = JSON.parse(readFileSync(resolve(OUT, `${id}.json`), 'utf8')) as CityPackage
  const index = JSON.parse(readFileSync(resolve(dir, 'index.json'), 'utf8')) as CityIndex
  const tiles = index.tiles.map((t) => JSON.parse(readFileSync(resolve(dir, 'tiles', `${t.tx}_${t.tz}.json`), 'utf8')) as TileData)
  const j = joinTiles(index, tiles)
  const problems: string[] = []
  const same = (what: string, a: (number | string)[], b: (number | string)[]): void => {
    const sa = [...a].map(String).sort()
    const sb = [...b].map(String).sort()
    if (sa.length !== sb.length || sa.some((v, i) => v !== sb[i])) problems.push(`${what}: package ${a.length}, tiles ${b.length}`)
  }
  same('edges', pkg.edges.map((e) => e.id), j.edges.map((e) => e.id))
  same('rails', pkg.rails.map((e) => e.id), j.rails.map((e) => e.id))
  same('buildings', pkg.buildings.map((b) => b.id), j.buildings.map((b) => b.id))
  same('fringe', (pkg.fringe ?? []).map((b) => b.id), j.fringe.map((b) => b.id))
  same('landmarks', (pkg.landmarks ?? []).map((l) => l.id), j.landmarks.map((l) => l.id))
  same('pois', pkg.pois.map((p) => `${p.x},${p.z},${p.name}`), j.pois.map((p) => `${p.x},${p.z},${p.name}`))
  same('furniture', (pkg.furniture ?? []).map((p) => `${p.x},${p.z},${p.kind}`), j.furniture.map((p) => `${p.x},${p.z},${p.kind}`))
  same('trees', [pkg.trees.length], [j.trees.length])
  same('boats', (pkg.boats ?? []).map((b) => b.id), (j.boats ?? []).map((b) => b.id))
  same('bridges', (pkg.bridges ?? []).map((b) => b.id), (j.bridges ?? []).map((b) => b.id))
  same('plantings', [(pkg.plantings ?? []).length], [j.plantings.length])
  same('water', [pkg.areas.filter((a) => a.kind === 'water').length], [index.water.length])
  // every area with a real ring has at least one piece
  const pieces = new Set(j.areas.map((a) => a.of))
  const missing = pkg.areas.map((a, i) => (a.ring.length >= 6 && !pieces.has(i) ? i : -1)).filter((i) => i >= 0)
  if (missing.length) problems.push(`areas with no piece: ${missing.length}`)
  // an edge is in the tile of every one of its points
  const inTile = new Map(tiles.map((t) => [t.key, new Set(t.edges.map((e) => e.id))]))
  let strays = 0
  for (const e of pkg.edges) {
    for (let i = 0; i < e.points.length; i += 2) {
      const [tx, tz] = tileOf(e.points[i], e.points[i + 1])
      if (!inTile.get(tileKey(tx, tz))?.has(e.id)) strays++
    }
  }
  if (strays) problems.push(`${strays} edge points outside their edge's tiles`)
  // and the index carries the rest
  for (const k of ['origin', 'start', 'terrain', 'skyline', 'box'] as const) {
    if (JSON.stringify(pkg[k]) !== JSON.stringify(index[k])) problems.push(`index ${k} differs`)
  }
  console.log(`${id}: ${index.tiles.length} tiles — ${problems.length ? problems.join('; ') : 'identical to the package'}`)
  if (problems.length) bad++
}
process.exit(bad ? 1 : 0)
