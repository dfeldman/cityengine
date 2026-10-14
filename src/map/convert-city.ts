/**
 * The whole-city half of the v2 → v3 conversion: the things one tile cannot know. Kept apart from
 * `convert.ts` so it stays pure and the tool (tools/map-v3.ts) can stream San Francisco's 111 000 tiles
 * through it rather than holding them.
 */
import type { CityIndex, TileData } from '../city/tiles.ts'
import type { MapDict, MapIndex } from './format.ts'

/** Metres below the lowest thing in the city that zFloor sits: every real z is then ≥ 1000 cm (MAP-FORMAT §3). */
export const FLOOR_MARGIN_M = 10

/** Running minimum of every height a city's tiles and coarse grid carry, v2 frame metres. */
export class FloorScan {
  min = Infinity
  add(v: number): void { if (v < this.min) this.min = v }
  addArray(vs: ArrayLike<number>, scale = 1): void {
    for (let i = 0; i < vs.length; i++) { const v = vs[i] * scale; if (v < this.min) this.min = v }
  }
  tile(t: TileData): void {
    for (const e of t.edges) if (e.heights) this.addArray(e.heights)
    for (const r of t.rails) if (r.heights) this.addArray(r.heights)
    for (const a of t.areas) if (a.level !== undefined) this.add(a.level)
    if (t.terrain) this.addArray(t.terrain.dm, 0.1)
  }
  /** cm, v2 frame; a city with no heights at all gets a floor 10 m under its datum */
  get zFloor(): number {
    const m = Number.isFinite(this.min) ? Math.min(this.min, 0) : 0
    return Math.floor(m * 100) - FLOOR_MARGIN_M * 100
  }
}

export function convertIndex(v2: CityIndex, zFloor: number, dict: MapDict, tiles: MapIndex['tiles'], seaLevel?: number | null): MapIndex {
  const m: MapIndex = {
    v: 3, id: v2.id, name: v2.name, origin: v2.origin, tile: v2.tile, unit: 'cm', zFloor, radius: v2.radius,
    ground: v2.ground, start: v2.start, attribution: v2.attribution, baked: v2.baked, dict, zones: [],
    legacy: { water: v2.water, landmarks: v2.landmarks, ...(v2.walls ? { walls: v2.walls } : {}) },
    tiles,
  }
  if (v2.box) m.box = v2.box
  if (v2.region) m.region = v2.region
  if (v2.skyline) m.skyline = v2.skyline
  // the coarse grid keeps its v2 shape; the writer (tools/v3-writer.ts) puts its numbers in v3/terrain.bin
  if (v2.terrain) m.terrain = { ...v2.terrain }
  // the sea is at true MSL, which in the datum frame is −datumRaw (BUGS.md #161): so the datum's elevation is −seaLevel
  if (typeof seaLevel === 'number') m.datumMsl = -seaLevel
  return m
}
