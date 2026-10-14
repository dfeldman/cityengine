/**
 * Where a city comes from in the game: its shipped bake, map format v3 (docs/MAP-FORMAT.md; src/map/store.ts) —
 * the index, then tiles fetched on demand — and the two things beside it, the coarse ground grid's sidecar and the
 * baked ride graph. Every file of the bake is fetched stamped with the bake number (`?b=`, store.ts `bakeStamp`).
 *
 * (The v2 tiles and the single-file package, and their loaders, are gone from the game since 2026-10-14: they are the
 * bake's private files now, for the secondary tools — tools/bake-files.ts.)
 */
import type { CityIndex, TileData } from './tiles.ts'
import { unpackRide, type RideFile } from './ridefile.ts'
import type { RideGraph, RideMode } from './ridegraph.ts'
import { openV3 } from '../map/store.ts'

/**
 * The coarse ground grid's binary sidecar (v3/terrain.bin), read into the index in place (src/map/store.ts).
 */
export async function readTerrainBin(base: string, index: Pick<CityIndex, 'terrain'>, query = ''): Promise<void> {
  /*
   * The coarse ground grid arrives as an `ArrayBuffer` beside the index, not inside it (BUGS.md #176).
   * It was 20.5 MB of a 26.2 MB index — 78% of the one file that must be fetched and parsed on the main
   * thread before anything renders — and as `Int16` decimetres it is 5.2 MB with no parse at all.
   *
   * Expanded to a `Float32Array` of metres here rather than left as decimetres, so that every reader
   * downstream indexes it exactly as it indexed the old `number[]` and none of them had to learn about
   * the encoding. It is still half the heap the JS array was.
   *
   * A failure is not fatal: the grid goes empty, `Terrain.flat` is true beyond the loaded tiles, and the
   * city is playable but level in the distance — which is a great deal better than not starting.
   */
  const t = index.terrain
  if (t?.bin) {
    try {
      const b = await fetch(`${base}${t.bin}${query}`)
      if (b.ok) {
        const dm = new Int16Array(await b.arrayBuffer())
        const m = new Float32Array(dm.length)
        for (let i = 0; i < dm.length; i++) m[i] = dm[i] / 10
        if (m.length === t.cols * t.rows) t.heights = m
        else throw new Error(`terrain.bin is ${m.length} samples, index says ${t.cols * t.rows}`)
      } else throw new Error(`terrain.bin: ${b.status}`)
    } catch (e) {
      /*
       * DELETE the grid rather than leave it empty. `distantGround` and `groundOccluder` test `if (!t)`,
       * not `t.heights.length`, so an empty grid would not turn them off — it would send them indexing
       * past the end of an array and building meshes out of NaN vertices, which is a black screen rather
       * than a flat one.
       */
      console.warn('terrain.bin could not be read — the distant ground will be flat', e)
      delete index.terrain
    }
  }
}

/** The baked ride graph for this device, or null when the city has none (baked before ride files). */
export async function loadRide(base: string, id: string, mode: RideMode, stamp: string): Promise<RideGraph | null> {
  // (in the bake's v3/ folder, stamped with its bake like the tiles: map/store.ts `bakeStamp`)
  const r = await fetch(new URL(`cities/${id}/v3/ride-${mode}.json?b=${stamp}`, new URL('./', base)).href).catch(() => null)
  if (!r || !r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return null
  return unpackRide(await r.json() as RideFile)
}

/** A city to stream from: its index and its tiles, each fetched when asked for. */
export interface CitySource {
  index: CityIndex
  /** the bake this source is (map/store.ts `bakeStamp`), for the URLs of the bake's other files */
  stamp: string
  has(key: string): boolean
  load(key: string): Promise<TileData | null>
  /**
   * Drop a tile's parsed data, as tiles leave the ring (game.ts); `load()` fetches again if one comes back. (A store
   * that kept every tile it had fetched once held a session's whole journey in the heap, BUGS.md #121.)
   */
  forget(key: string): void
}

/** The city's shipped bake (v3). A city with none is not playable: there is no other format to fall back to. */
export async function openCity(base: string, id: string): Promise<CitySource> {
  const v3 = await openV3(new URL('./', base).href, id)
  if (!v3) throw new Error(`${id} has no shipped bake (public/cities/${id}/v3/): npm run bake -- ${id}`)
  return v3
}
