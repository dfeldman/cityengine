/**
 * Writes a city in map format v3 (docs/MAP-FORMAT.md) — shared by the bake, which has every tile in memory and
 * the terrain model it shipped, and by `npm run map:v3`, which converts a city already baked.
 *
 * Heights: `raw` is the ground the tiles ship (the bake's `GroundModel`, or a `Terrain` over the tiles' own blocks);
 * the levelled ground things stand on is `raw` raised to a street's level in its corridor (src/city/grade.ts),
 * built here from every street at grade — the renderer's `Terrain.heightAt`, exactly.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CityIndex, TileData } from '../src/city/tiles.ts'
import type { PackedEdge } from '../src/city/package.ts'
import { onSurface } from '../src/city/package.ts'
import { StreetGrade } from '../src/city/grade.ts'
import { convertTile, DictBuilder, edgeRefs, newStats, type ConvertStats } from '../src/map/convert.ts'
import { convertIndex, FloorScan } from '../src/map/convert-city.ts'
import type { MapIndex, Zone } from '../src/map/format.ts'
import type { LocalZone } from '../src/map/zones.ts'

export interface V3Options {
  /** the shipped raw ground, v2 frame metres */
  raw: (x: number, z: number) => number
  /** zones, local metres (the bake's); written into the index in city centimetres */
  zones?: LocalZone[]
  /** the true elevation of the v2 datum, metres, when known (the bake knows it) */
  datumMsl?: number
}

/** Zones as the index carries them: city centimetres, x east and y north (MAP-FORMAT §3, §7). */
export const indexZones = (zones: LocalZone[]): Zone[] => zones.map((zn) => ({
  ref: zn.ref, ring: zn.ring.map((v) => Math.round(v * 100)), ...(zn.priority ? { priority: zn.priority } : {}), props: zn.props,
}))

/**
 * Convert and write. `tiles` in any order; the streets of ALL of them feed the levelling and the refs first, so
 * every tile sees the whole city's streets whatever tile it is.
 */
export function writeV3(dir: string, index: CityIndex, tiles: TileData[], opt: V3Options): { index: MapIndex; stats: ConvertStats; bytes: number } {
  const floor = new FloorScan()
  if (index.terrain) floor.addArray(index.terrain.heights)
  const grade = new StreetGrade()
  const edges = new Map<number, PackedEdge>()
  for (const t of tiles) {
    floor.tile(t)
    for (const e of t.edges) {
      if (!edges.has(e.id)) edges.set(e.id, e)
      if (onSurface(e)) grade.add(e)
    }
  }
  const refs = edgeRefs(edges.values())
  const zFloor = floor.zFloor
  const dict = new DictBuilder()
  const stats = newStats()
  const groundAt = (x: number, z: number): number => {
    const r = opt.raw(x, z)
    const g = grade.at(x, z)
    return g === null ? r : Math.max(r, g)
  }
  const out = join(dir, 'v3')
  mkdirSync(out, { recursive: true })
  // stale tiles from an earlier write would be served as if current
  for (const f of readdirSync(out)) if (f.endsWith('.json')) rmSync(join(out, f))
  const byKey = new Map(index.tiles.map((e) => [e.key, e]))
  const written: MapIndex['tiles'] = []
  let bytes = 0
  for (const t of tiles) {
    const m = convertTile(t, { zFloor, dict, heightAt: opt.raw, groundAt, edgeRef: (e) => refs.get(e.id)!, stats })
    const text = JSON.stringify(m)
    writeFileSync(join(out, `${m.tx}_${m.ty}.json`), text)
    bytes += text.length
    const e = byKey.get(t.key)
    written.push({ key: t.key, tx: m.tx, ty: m.ty, bytes: text.length, buildings: e?.buildings ?? t.buildings.length, edges: e?.edges ?? t.edges.length })
  }
  written.sort((a, b) => a.ty - b.ty || a.tx - b.tx)
  const idx = convertIndex(index, zFloor, dict.dict, written)
  if (opt.datumMsl !== undefined) idx.datumMsl = Math.round(opt.datumMsl * 100) / 100
  idx.zones = indexZones(opt.zones ?? [])
  writeFileSync(join(out, 'index.json'), JSON.stringify(idx))
  return { index: idx, stats, bytes }
}
