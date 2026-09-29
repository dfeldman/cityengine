/**
 * Where a city's tiles come from in the game (PARIS_EXPAND.md §2, §8): the index, then tiles fetched on
 * demand, a few at a time, each fetched once. `loadWhole` fetches every tile and joins them — what the game
 * does until each subsystem streams; a city baked before tiling falls back to its single package.
 */
import type { CityPackage } from './package.ts'
import { joinTiles, splitPackage, type CityIndex, type TileData } from './tiles.ts'
import { unpackRide, type RideFile } from './ridefile.ts'
import type { RideGraph, RideMode } from './ridegraph.ts'
import { openV3 } from '../map/store.ts'

export class TileStore {
  readonly base: string
  index: CityIndex | null = null
  private readonly got = new Map<string, TileData>()
  private readonly pending = new Map<string, Promise<TileData | null>>()
  /*
   * The index by key, built once. `load()` used to do `this.index.tiles.find(t => t.key === key)` — a LINEAR
   * SCAN of the tile list on every single tile fetch. San Francisco's index has 108 800 tiles, and a startup
   * that pulls a few hundred of them was doing tens of millions of string comparisons on the main thread
   * before a frame could be drawn (BUGS.md #164).
   */
  private byKey: Map<string, CityIndex['tiles'][number]> | null = null

  /** keep what was fetched (for `loadWhole`); a streaming game prepares each tile and needs no raw copy */
  keep = true

  constructor(base: string) { this.base = base }

  async open(): Promise<CityIndex | null> {
    const r = await fetch(`${this.base}index.json`)
    // a dev server answers a missing file with the app's own HTML page and a 200
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return null
    this.index = await r.json() as CityIndex
    this.byKey = new Map(this.index.tiles.map((t) => [t.key, t]))
    await readTerrainBin(this.base, this.index)
    return this.index
  }

  /** does the city HAVE this tile (not: is it already fetched) — the key index answers without a second table */
  has(key: string): boolean { return this.byKey ? this.byKey.has(key) : this.got.has(key) }
  /** already fetched and retained */
  cached(key: string): boolean { return this.got.has(key) }
  get(key: string): TileData | undefined { return this.got.get(key) }

  /** Fetch one tile (once); null for a tile the city does not have. */
  load(key: string): Promise<TileData | null> {
    const have = this.got.get(key)
    if (have) return Promise.resolve(have)
    const inFlight = this.pending.get(key)
    if (inFlight) return inFlight
    const entry = this.byKey?.get(key)
    if (!entry) return Promise.resolve(null)
    const p = fetch(`${this.base}tiles/${entry.tx}_${entry.tz}.json`).then((r) => r.json() as Promise<TileData>).then((t) => {
      if (this.keep) this.got.set(key, t)
      this.pending.delete(key)
      return t
    })
    this.pending.set(key, p)
    return p
  }

  /** Fetch many, at most `parallel` at once. */
  async loadMany(keys: string[], parallel = 12): Promise<void> {
    let next = 0
    const worker = async (): Promise<void> => { while (next < keys.length) await this.load(keys[next++]) }
    await Promise.all(Array.from({ length: Math.min(parallel, keys.length) }, worker))
  }

  /** Drop a tile's data (it is fetched again if wanted). */
  forget(key: string): void { this.got.delete(key) }
}

/**
 * The coarse ground grid's binary sidecar, read into the index in place (shared by the v2 store and the v3 one,
 * src/map/store.ts).
 */
export async function readTerrainBin(base: string, index: Pick<CityIndex, 'terrain'>): Promise<void> {
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
      const b = await fetch(`${base}${t.bin}`)
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

/**
 * The whole city as one package: from its tiles when it has them (edges and buildings back in id order, so
 * everything that walks them sees the order the single package had), else from the single file.
 */
export async function loadWhole(base: string, id: string): Promise<CityPackage> {
  // resolved, not concatenated: the page's base URI carries its ?city=… query
  const root = new URL('./', base).href
  const store = new TileStore(`${root}cities/${id}/`)
  const index = await store.open().catch(() => null)
  if (!index) return await fetch(`${root}cities/${id}.json`).then((r) => r.json()) as CityPackage
  await store.loadMany(index.tiles.map((t) => t.key))
  const j = joinTiles(index, index.tiles.map((t) => store.get(t.key)!).filter(Boolean))
  j.edges.sort((a, b) => a.id - b.id)
  j.buildings.sort((a, b) => a.id - b.id)
  return j as unknown as CityPackage
}

/** The baked ride graph for this device, or null when the city has none (baked before ride files). */
export async function loadRide(base: string, id: string, mode: RideMode): Promise<RideGraph | null> {
  const r = await fetch(new URL(`cities/${id}/ride-${mode}.json`, new URL('./', base)).href).catch(() => null)
  if (!r || !r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return null
  return unpackRide(await r.json() as RideFile)
}

/**
 * A city to stream from: its index and its tiles, each fetched when asked for. A city baked before tiling
 * (one package) is cut into tiles in memory and served the same way, so the game has one code path.
 */
export interface CitySource {
  index: CityIndex
  has(key: string): boolean
  load(key: string): Promise<TileData | null>
  /**
   * Drop a tile's parsed data. The store keeps every tile it has ever fetched, and nothing called this, so a
   * session retained the raw JSON — buildings, rings, streets — of everywhere it had been (BUGS.md #121).
   * Chrome's heap is a hard ~3 GB, so jumping around the city eventually killed the tab. `game.ts` calls
   * this as tiles leave the ring; `load()` fetches again if one comes back.
   */
  forget(key: string): void
}

export async function openCity(base: string, id: string): Promise<CitySource> {
  const root = new URL('./', base).href
  /*
   * MAP FORMAT v3 (docs/MAP-FORMAT.md) whenever the city has it: the bake writes it beside v2, with every height
   * baked, and the patch sets are applied as each tile lands. `?map=v2` reads the old tiles instead, for
   * comparing the two; a city baked before v3 (and not converted) simply has none and is read as v2.
   */
  const want = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('map') : null
  if (want !== 'v2') {
    const v3 = await openV3(root, id)
    if (v3) return v3
    if (want === 'v3') console.warn(`?map=v3: ${id} has no v3 (re-bake, or npm run map:v3 -- ${id}) — reading v2`)
  }
  const store = new TileStore(`${root}cities/${id}/`)
  const index = await store.open().catch(() => null)
  if (index) {
    store.keep = false
    /*
     * `has` asks the store's own key index rather than a second Set of the same 108 800 strings. Chrome's
     * heap here is a hard ~3 GB and the tab simply dies above it (BUGS.md #121), so a duplicate table of
     * every key in the city is worth not having — and it can only ever drift from the real one.
     */
    return { index, has: (k) => store.has(k), load: (k) => store.load(k), forget: (k) => store.forget(k) }
  }
  const pkg = await fetch(`${root}cities/${id}.json`).then((r) => r.json()) as CityPackage
  const { index: meta, tiles } = splitPackage(pkg, () => undefined)
  const full: CityIndex = { ...meta, tiles: [...tiles.values()].map((t) => {
    const [tx, tz] = t.key.split(',').map(Number)
    return { key: t.key, tx, tz, bytes: 0, buildings: t.buildings.length, edges: t.edges.length }
  }) }
  // the whole-package path holds every tile in one object that was parsed once: there is nothing per-tile
  // to release, so forgetting is a no-op rather than a lie
  return { index: full, has: (k) => tiles.has(k), load: async (k) => tiles.get(k) ?? null, forget: () => {} }
}
