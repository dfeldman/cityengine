/**
 * A city read from map format v3 (MAP-FORMAT §12 step 1): the v3 index and tiles, patched as each tile lands,
 * then handed to the game as the v2 `TileData` it already draws. `?map=v3` selects it (city/tilestore.ts).
 *
 * The patch sets are `patches/<region>.json` then `patches/<city>.json`, both optional; the city's wins.
 */
import { readTerrainBin, type CitySource } from '../city/tilestore.ts'
import type { TileData } from '../city/tiles.ts'
import { adaptIndex, adaptTile } from './adapt.ts'
import type { MapIndex, MapTile } from './format.ts'
import { applyPatches, indexPatches, type PatchSet } from './patch.ts'

/** a JSON file, or null — a dev server answers a missing file with the app's own HTML page and a 200 */
async function json<T>(url: string): Promise<T | null> {
  const r = await fetch(url).catch(() => null)
  if (!r || !r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return null
  return await r.json() as T
}

export async function openV3(root: string, id: string): Promise<CitySource | null> {
  const base = `${root}cities/${id}/v3/`
  const m = await json<MapIndex>(`${base}index.json`)
  if (!m || m.v !== 3) return null
  const index = adaptIndex(m)
  await readTerrainBin(base, index)

  const sets: PatchSet[] = []
  for (const name of m.region && m.region !== id ? [m.region, id] : [id]) {
    const s = await json<PatchSet>(`${root}patches/${name}.json`)
    if (s) sets.push(s)
  }
  const patches = indexPatches(sets, m.tile)
  if (patches.count) console.info(`map v3: ${patches.count} patch ops for ${id}`)

  const byKey = new Map(m.tiles.map((t) => [t.key, t]))
  const pending = new Map<string, Promise<TileData | null>>()
  return {
    index,
    has: (k) => byKey.has(k),
    load(k) {
      const e = byKey.get(k)
      if (!e) return Promise.resolve(null)
      const had = pending.get(k)
      if (had) return had
      const p = json<MapTile>(`${base}${e.tx}_${e.ty}.json`).then((t) => {
        pending.delete(k)
        return t ? adaptTile(applyPatches(t, patches, m), m) : null
      })
      pending.set(k, p)
      return p
    },
    // nothing retained per tile: each load parses, patches and adapts afresh, so there is nothing to free
    forget: () => {},
  }
}
