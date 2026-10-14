/**
 * WHERE A BAKE LIVES (owner, 2026-10-14: every file the game loads is code from this repo, an assetmgr asset, or a
 * versioned file from the bake; "it's fine to have an easier-to-process file format that isn't used by the game
 * itself but is used by secondary tools, but we have to make sure it doesn't get stale").
 *
 *   public/cities/<id>/v3/                 SHIPPED — the only bake files the game reads, all stamped with the bake
 *     index.json   (its `bake`)              number (src/map/store.ts): the tiles, terrain.bin, ride-bike.json,
 *     <tx>_<ty>.json, terrain.bin,           ride-run.json, river.json (a city with a river)
 *     ride-*.json, river.json
 *
 *   tools/cache/bake/<id>/                 BAKE-PRIVATE — gitignored, never published, never read by the game; what the
 *     package.json                           secondary tools read, because it is whole and easy to process: the
 *     index.json, tiles/, terrain.bin        CityPackage (was public/cities/<id>.json), the v2 tiles v3 is converted
 *     decks-undo.json                        from (`npm run map:v3`), the bridge decks' undo (`bake --decks`)
 *     bake.json                              and the bake number they belong to
 *
 * NEVER STALE: every write to the shipped files records a NEW bake number in both places (`recordBake`), and the
 * tools read the private files only through `readPackage` / `readV2`, which refuse when the two numbers differ — a
 * tool cannot quietly work from yesterday's city.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { CityPackage } from '../src/city/package.ts'
import type { CityIndex, TileData } from '../src/city/tiles.ts'

const ROOT = resolve(import.meta.dirname, '..')
/** the shipped cities (each one's bake in `<id>/v3/`) */
export const SHIPPED = resolve(ROOT, 'public', 'cities')
/** the bake-private files, one folder per city */
export const WORK = resolve(ROOT, 'tools', 'cache', 'bake')

export const shippedDir = (id: string): string => resolve(SHIPPED, id, 'v3')
export const workDir = (id: string): string => resolve(WORK, id)
export const packageFile = (id: string): string => resolve(WORK, id, 'package.json')
export const decksUndoFile = (id: string): string => resolve(WORK, id, 'decks-undo.json')

/** A new bake number: when, to the minute, and four random characters (two bakes in one minute differ). */
export function newBakeId(): string {
  return `${new Date().toISOString().slice(0, 16).replace(/[-:]/g, '')}-${Math.random().toString(36).slice(2, 6)}`
}

/** the bake number the shipped files carry, or null (not baked) */
export function shippedBake(id: string): string | null {
  const f = resolve(shippedDir(id), 'index.json')
  if (!existsSync(f)) return null
  return (JSON.parse(readFileSync(f, 'utf8')) as { bake?: string }).bake ?? null
}

/** the bake number the private files belong to, or null */
export function workBake(id: string): string | null {
  const f = resolve(workDir(id), 'bake.json')
  if (!existsSync(f)) return null
  return (JSON.parse(readFileSync(f, 'utf8')) as { bake?: string }).bake ?? null
}

/**
 * The shipped files and the private files are now bake `bake` — after a bake, or anything that rewrote shipped
 * files (`map:v3`, `bake --decks`, `rides`, `river`). Writes the number into the shipped index (what the game
 * stamps its URLs with) and beside the private files (what `assertFresh` checks).
 */
export function recordBake(id: string, bake: string = newBakeId()): string {
  const f = resolve(shippedDir(id), 'index.json')
  if (existsSync(f)) {
    const idx = JSON.parse(readFileSync(f, 'utf8')) as { bake?: string }
    idx.bake = bake
    writeFileSync(f, JSON.stringify(idx))
  }
  mkdirSync(workDir(id), { recursive: true })
  writeFileSync(resolve(workDir(id), 'bake.json'), JSON.stringify({ bake, at: new Date().toISOString() }) + '\n')
  return bake
}

/** Is there a bake of `id`, private files and shipped, of the same number? */
export function isBaked(id: string): boolean {
  const s = shippedBake(id)
  return s !== null && s === workBake(id) && existsSync(packageFile(id))
}

/** Throws unless the private files belong to the bake that shipped (or there is none). */
export function assertFresh(id: string): void {
  const s = shippedBake(id), w = workBake(id)
  if (!existsSync(packageFile(id))) throw new Error(`${id} is not baked here (no ${packageFile(id)}): npm run bake -- ${id}`)
  if (s === null || w === null || s !== w) {
    throw new Error(`${id}: the bake-private files (bake ${w ?? 'none'}) are not the bake that shipped (${s ?? 'none'}) — `
      + `re-bake (npm run bake -- ${id}) before reading them`)
  }
}

/** The whole city as the bake made it (CityPackage), checked fresh. */
export function readPackage(id: string): CityPackage {
  assertFresh(id)
  return JSON.parse(readFileSync(packageFile(id), 'utf8')) as CityPackage
}

/** The v2 index and tiles v3 was converted from (bake-private), checked fresh; `withTiles: false` for the index alone. */
export function readV2(id: string, withTiles = true): { index: CityIndex; tiles: TileData[] } {
  assertFresh(id)
  const dir = workDir(id)
  const index = JSON.parse(readFileSync(resolve(dir, 'index.json'), 'utf8')) as CityIndex
  if (index.terrain?.bin) {
    const buf = readFileSync(resolve(dir, index.terrain.bin))
    const dm = new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2)
    index.terrain.heights = Array.from(dm, (d) => d / 10)
  }
  const tiles: TileData[] = []
  if (withTiles) {
    for (const e of index.tiles) {
      const f = resolve(dir, 'tiles', `${e.tx}_${e.tz}.json`)
      if (existsSync(f)) tiles.push(JSON.parse(readFileSync(f, 'utf8')) as TileData)
    }
  }
  return { index, tiles }
}

/** One v2 tile (bake-private), or null. Not freshness-checked per tile: call `assertFresh` once first. */
export function readV2Tile(id: string, tx: number, tz: number): TileData | null {
  const f = resolve(workDir(id), 'tiles', `${tx}_${tz}.json`)
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) as TileData : null
}
