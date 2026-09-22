/**
 * Where a city's tiles come from in the game (PARIS_EXPAND.md §2, §8): the index, then tiles fetched on
 * demand, a few at a time, each fetched once. `loadWhole` fetches every tile and joins them — what the game
 * does until each subsystem streams; a city baked before tiling falls back to its single package.
 */
import type { CityPackage } from './package.ts'
import { joinTiles, splitPackage, type CityIndex, type TileData } from './tiles.ts'
import { unpackRide, type RideFile } from './ridefile.ts'
import type { RideGraph, RideMode } from './ridegraph.ts'

export class TileStore {
  readonly base: string
  index: CityIndex | null = null
  private readonly got = new Map<string, TileData>()
  private readonly pending = new Map<string, Promise<TileData | null>>()

  /** keep what was fetched (for `loadWhole`); a streaming game prepares each tile and needs no raw copy */
  keep = true

  constructor(base: string) { this.base = base }

  async open(): Promise<CityIndex | null> {
    const r = await fetch(`${this.base}index.json`)
    // a dev server answers a missing file with the app's own HTML page and a 200
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return null
    this.index = await r.json() as CityIndex
    return this.index
  }

  has(key: string): boolean { return this.got.has(key) }
  get(key: string): TileData | undefined { return this.got.get(key) }

  /** Fetch one tile (once); null for a tile the city does not have. */
  load(key: string): Promise<TileData | null> {
    const have = this.got.get(key)
    if (have) return Promise.resolve(have)
    const inFlight = this.pending.get(key)
    if (inFlight) return inFlight
    const entry = this.index?.tiles.find((t) => t.key === key)
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
}

export async function openCity(base: string, id: string): Promise<CitySource> {
  const root = new URL('./', base).href
  const store = new TileStore(`${root}cities/${id}/`)
  const index = await store.open().catch(() => null)
  if (index) {
    store.keep = false
    const keys = new Set(index.tiles.map((t) => t.key))
    return { index, has: (k) => keys.has(k), load: (k) => store.load(k) }
  }
  const pkg = await fetch(`${root}cities/${id}.json`).then((r) => r.json()) as CityPackage
  const { index: meta, tiles } = splitPackage(pkg, () => undefined)
  const full: CityIndex = { ...meta, tiles: [...tiles.values()].map((t) => {
    const [tx, tz] = t.key.split(',').map(Number)
    return { key: t.key, tx, tz, bytes: 0, buildings: t.buildings.length, edges: t.edges.length }
  }) }
  return { index: full, has: (k) => tiles.has(k), load: async (k) => tiles.get(k) ?? null }
}
