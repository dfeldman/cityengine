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
async function json<T>(url: string, init?: RequestInit): Promise<T | null> {
  const r = await fetch(url, init).catch(() => null)
  if (!r || !r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return null
  return await r.json() as T
}

/**
 * THE BAKE STAMP: which bake an index is, for the URLs of everything that has to come from the same one. A tile's
 * kinds, roles and styles are numbers into its index's dictionaries, and two bakes number them differently — so a
 * tile from one bake read with another's index turns cable-car track into a "path", which runs Caltrain double-
 * deckers up Mason Street (owner, 2026-10-14: the phone kept an old index.json and fetched new tiles, the bucket
 * serving no Cache-Control). The bake's date and a hash of its dictionaries: a new bake is new URLs, every time.
 */
export function bakeStamp(m: Pick<MapIndex, 'dict'> & { baked?: string }): string {
  let h = 0x811c9dc5
  const s = JSON.stringify(m.dict)
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return `${m.baked ?? 'x'}-${(h >>> 0).toString(36)}`
}

export async function openV3(root: string, id: string): Promise<CitySource | null> {
  const base = `${root}cities/${id}/v3/`
  // the index is asked about every time (a 304 when it has not changed): it decides the stamp on everything else
  const m = await json<MapIndex>(`${base}index.json`, { cache: 'no-cache' })
  if (!m || m.v !== 3) return null
  const index = adaptIndex(m)
  const stamp = bakeStamp(m as MapIndex & { baked?: string })
  await readTerrainBin(base, index, `?b=${stamp}`)

  const sets: PatchSet[] = []
  for (const name of m.region && m.region !== id ? [m.region, id] : [id]) {
    // (patch sets are edited between bakes, and ship with the game, not the bake: asked about every time)
    const s = await json<PatchSet>(`${root}patches/${name}.json`, { cache: 'no-cache' })
    if (s) sets.push(s)
  }
  const patches = indexPatches(sets, m.tile)
  if (patches.count) console.info(`map v3: ${patches.count} patch ops for ${id}`)

  const byKey = new Map(m.tiles.map((t) => [t.key, t]))
  const pending = new Map<string, Promise<TileData | null>>()
  return {
    index,
    stamp,
    has: (k) => byKey.has(k),
    load(k) {
      const e = byKey.get(k)
      if (!e) return Promise.resolve(null)
      const had = pending.get(k)
      if (had) return had
      const p = json<MapTile>(`${base}${e.tx}_${e.ty}.json?b=${stamp}`).then((t) => {
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
