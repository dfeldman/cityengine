/**
 * A city cut into tiles, for streaming (PARIS_EXPAND.md §2, §8).
 *
 * The bake and the renderer share THIS grid: one constant, imported by both, so a tile on disk is exactly a
 * tile the renderer builds. The rules, and why:
 *
 * - **Edges are filed whole into every tile they pass through** and de-duplicated by id when loaded. Never
 *   split at a tile border: a split invents a node, the renderer paints a junction pad at every one, and an
 *   edge's `s` (always measured from `a`) stops meaning the same thing on both sides.
 * - **Buildings, fringe buildings and landmarks by their centre**, so a block straddling a border is whole
 *   in one tile.
 * - **Areas clipped to the tile**, holes too — the Seine is one polygon seven kilometres long. Water keeps
 *   the level of its WHOLE body (`level`), worked out here, so every piece of the river agrees.
 * - **Points by point**: trees, places, furniture.
 *
 * The index holds what is small and needed everywhere: where the city is, its box, its ground, its start,
 * the terrain grid, the skyline, the named landmarks (menu, minimap), and the tile list.
 */
import type {
  CityPackage, PackedArea, PackedBoat, PackedBuilding, PackedEdge, PackedFringe, PackedFurniture, PackedLandmark, PackedPoi, PackedRail,
} from './package.ts'
import type { PackedTerrain } from './terrain.ts'

/** Tile size in metres. Small enough that a tile is cheap to build, big enough not to thrash. */
export const TILE = 200

export const tileKey = (tx: number, tz: number): string => `${tx},${tz}`
export const tileOf = (x: number, z: number): [number, number] => [Math.floor(x / TILE), Math.floor(z / TILE)]

type Point = { x: number; z: number }

/** A clipped piece of an area, with the index of the area it came from and its water level. */
export interface TileArea extends PackedArea {
  /** which of the package's areas this is a piece of */
  of: number
  /** water: the level of the whole body, metres (the lowest ground under it, less the region's river drop) */
  level?: number
}

export interface TileData {
  key: string
  edges: PackedEdge[]
  buildings: PackedBuilding[]
  fringe: PackedFringe[]
  areas: TileArea[]
  /** x,z pairs */
  trees: number[]
  pois: PackedPoi[]
  furniture: PackedFurniture[]
  landmarks: PackedLandmark[]
  rails: PackedRail[]
  /** the trees (city/plantings.ts), five numbers each */
  plantings: number[]
  /** moored boats, by their centre (optional: tiles baked before boats have none) */
  boats?: PackedBoat[]
}

export interface TileEntry {
  key: string
  tx: number
  tz: number
  /** bytes of its file, for the loader's budget */
  bytes: number
  buildings: number
  edges: number
}

export interface CityIndex {
  id: string
  name: string
  origin: { lat: number; lon: number }
  radius: number
  box?: CityPackage['box']
  ground: CityPackage['ground']
  region?: string
  start: CityPackage['start']
  terrain?: PackedTerrain
  skyline?: CityPackage['skyline']
  /** every named landmark, for the menu and the minimap (they are also in their tiles, for the plates) */
  landmarks: PackedLandmark[]
  /** the water bodies whole: quays, the ground occluder and the crowd need the river, not its tile pieces */
  water: PackedArea[]
  attribution: string[]
  baked: string
  tile: number
  tiles: TileEntry[]
}

/**
 * Sutherland–Hodgman against an axis-aligned rectangle. A concave polygon can come out as one ring with
 * zero-width seams along the rectangle's edge, which triangulate to nothing and fill correctly.
 */
export function clipToRect(ring: Point[], x0: number, z0: number, x1: number, z1: number): Point[] {
  let out = ring
  const edges: [(p: Point) => boolean, (a: Point, b: Point) => Point][] = [
    [(p) => p.x >= x0, (a, b) => ({ x: x0, z: a.z + ((x0 - a.x) / (b.x - a.x)) * (b.z - a.z) })],
    [(p) => p.x <= x1, (a, b) => ({ x: x1, z: a.z + ((x1 - a.x) / (b.x - a.x)) * (b.z - a.z) })],
    [(p) => p.z >= z0, (a, b) => ({ x: a.x + ((z0 - a.z) / (b.z - a.z)) * (b.x - a.x), z: z0 })],
    [(p) => p.z <= z1, (a, b) => ({ x: a.x + ((z1 - a.z) / (b.z - a.z)) * (b.x - a.x), z: z1 })],
  ]
  for (const [inside, cut] of edges) {
    if (out.length === 0) break
    const src = out
    out = []
    for (let i = 0; i < src.length; i++) {
      const cur = src[i]
      const prev = src[(i + src.length - 1) % src.length]
      if (inside(cur)) {
        if (!inside(prev)) out.push(cut(prev, cur))
        out.push(cur)
      } else if (inside(prev)) {
        out.push(cut(prev, cur))
      }
    }
  }
  return out
}

const centre = (flat: number[]): Point => {
  let x = 0
  let z = 0
  const n = flat.length / 2
  for (let i = 0; i < flat.length; i += 2) { x += flat[i]; z += flat[i + 1] }
  return { x: x / n, z: z / n }
}

const unflat = (flat: number[]): Point[] => {
  const out: Point[] = []
  for (let i = 0; i < flat.length; i += 2) out.push({ x: flat[i], z: flat[i + 1] })
  return out
}

const r2 = (v: number): number => Math.round(v * 100) / 100

/**
 * Every tile a polyline passes through: each segment walked in steps shorter than a tile, so a long straight
 * segment that crosses a tile corner-to-corner still files itself in every tile it touches.
 */
export function tilesOfLine(flat: number[]): Set<string> {
  const out = new Set<string>()
  for (let i = 0; i < flat.length; i += 2) {
    const [tx, tz] = tileOf(flat[i], flat[i + 1])
    out.add(tileKey(tx, tz))
    if (i < 2) continue
    const ax = flat[i - 2]
    const az = flat[i - 1]
    const len = Math.hypot(flat[i] - ax, flat[i + 1] - az)
    const n = Math.ceil(len / (TILE / 4))
    for (let k = 1; k < n; k++) {
      const [sx, sz] = tileOf(ax + ((flat[i] - ax) * k) / n, az + ((flat[i + 1] - az) * k) / n)
      out.add(tileKey(sx, sz))
    }
  }
  return out
}

/**
 * Cut a package into tiles and an index. `waterLevel` gives a water area's level (the renderer's rule: the
 * lowest ground under the whole ring, less the region's river drop), worked out once for the whole body.
 */
export function splitPackage(pkg: CityPackage, waterLevel: (ring: Point[], area: PackedArea) => number | undefined): { index: Omit<CityIndex, 'tiles'>; tiles: Map<string, TileData> } {
  const tiles = new Map<string, TileData>()
  const get = (k: string): TileData => {
    let t = tiles.get(k)
    if (!t) {
      t = { key: k, edges: [], buildings: [], fringe: [], areas: [], trees: [], pois: [], furniture: [], landmarks: [], rails: [], plantings: [], boats: [] }
      tiles.set(k, t)
    }
    return t
  }
  const at = (x: number, z: number): TileData => { const [tx, tz] = tileOf(x, z); return get(tileKey(tx, tz)) }

  for (const e of pkg.edges) for (const k of tilesOfLine(e.points)) get(k).edges.push(e)
  for (const r of pkg.rails) for (const k of tilesOfLine(r.points)) get(k).rails.push(r)
  for (const b of pkg.buildings) { const c = centre(b.ring); at(c.x, c.z).buildings.push(b) }
  for (const f of pkg.fringe ?? []) { const c = centre(f.ring); at(c.x, c.z).fringe.push(f) }
  for (const b of pkg.boats ?? []) { const c = centre(b.ring); at(c.x, c.z).boats!.push(b) }
  for (const l of pkg.landmarks ?? []) at(l.x, l.z).landmarks.push(l)
  for (const p of pkg.pois) at(p.x, p.z).pois.push(p)
  for (const f of pkg.furniture ?? []) at(f.x, f.z).furniture.push(f)
  for (let i = 0; i < pkg.trees.length; i += 2) at(pkg.trees[i], pkg.trees[i + 1]).trees.push(pkg.trees[i], pkg.trees[i + 1])
  const pl = pkg.plantings ?? []
  for (let i = 0; i + 4 < pl.length; i += 5) at(pl[i], pl[i + 1]).plantings.push(pl[i], pl[i + 1], pl[i + 2], pl[i + 3], pl[i + 4])

  pkg.areas.forEach((a, of) => {
    const ring = unflat(a.ring)
    if (ring.length < 3) return
    // a piece already cut from a whole body keeps that body's level
    const given = (a as Partial<TileArea>).level
    const level = given !== undefined ? given : a.kind === 'water' ? waterLevel(ring, a) : undefined
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    const [ta, tb] = tileOf(x0, z0)
    const [tc, td] = tileOf(x1, z1)
    for (let tx = ta; tx <= tc; tx++) {
      for (let tz = tb; tz <= td; tz++) {
        const rect = [tx * TILE, tz * TILE, (tx + 1) * TILE, (tz + 1) * TILE] as const
        const piece = clipToRect(ring, ...rect)
        if (piece.length < 3) continue
        const holes: number[][] = []
        for (const h of a.holes ?? []) {
          const cut = clipToRect(unflat(h), ...rect)
          if (cut.length >= 3) holes.push(cut.flatMap((q) => [r2(q.x), r2(q.z)]))
        }
        get(tileKey(tx, tz)).areas.push({
          kind: a.kind, ring: piece.flatMap((q) => [r2(q.x), r2(q.z)]), ...(holes.length ? { holes } : {}), of,
          ...(level !== undefined && Number.isFinite(level) ? { level: Math.round(level * 100) / 100 } : {}),
        })
      }
    }
  })

  const index: Omit<CityIndex, 'tiles'> = {
    id: pkg.id, name: pkg.name, origin: pkg.origin, radius: pkg.radius, box: pkg.box, ground: pkg.ground,
    region: pkg.region, start: pkg.start, terrain: pkg.terrain, skyline: pkg.skyline, landmarks: pkg.landmarks ?? [],
    water: pkg.areas.filter((a) => a.kind === 'water'),
    attribution: pkg.attribution, baked: pkg.baked, tile: TILE,
  }
  return { index, tiles }
}

/**
 * Put tiles back together as one package — what the renderer is fed until it streams (and what the bake's
 * check compares with the monolith). Edges and rails de-duplicated by id; areas are the tiles' pieces.
 */
export type JoinedCity = Omit<CityPackage, 'areas' | 'fringe' | 'landmarks' | 'furniture' | 'plantings' | 'water'>
  & { areas: TileArea[]; fringe: PackedFringe[]; landmarks: PackedLandmark[]; furniture: PackedFurniture[]; plantings: number[]; water: PackedArea[] }

export function joinTiles(index: Omit<CityIndex, 'tiles'> | CityIndex, tiles: Iterable<TileData>): JoinedCity {
  const edges = new Map<number, PackedEdge>()
  const rails = new Map<number, PackedRail>()
  const out = {
    id: index.id, name: index.name, origin: index.origin, radius: index.radius, box: index.box, ground: index.ground,
    region: index.region, start: index.start, terrain: index.terrain, skyline: index.skyline,
    attribution: index.attribution, baked: index.baked,
    edges: [] as PackedEdge[], buildings: [] as PackedBuilding[], fringe: [] as PackedFringe[], areas: [] as TileArea[],
    trees: [] as number[], pois: [] as PackedPoi[], furniture: [] as PackedFurniture[], landmarks: [] as PackedLandmark[],
    rails: [] as PackedRail[], plantings: [] as number[], water: index.water, boats: [] as PackedBoat[],
  }
  for (const t of tiles) {
    for (const e of t.edges) edges.set(e.id, e)
    for (const r of t.rails) rails.set(r.id, r)
    out.buildings.push(...t.buildings)
    out.fringe.push(...t.fringe)
    out.areas.push(...t.areas)
    for (const v of t.trees) out.trees.push(v)
    out.pois.push(...t.pois)
    out.furniture.push(...t.furniture)
    out.landmarks.push(...t.landmarks)
    for (const v of t.plantings) out.plantings.push(v)
    out.boats.push(...(t.boats ?? []))
  }
  out.edges = [...edges.values()]
  out.rails = [...rails.values()]
  return out
}

/** Where tiles come from: the prepared whole city cut in memory now, a streaming store later. */
export interface TileSource { get(key: string): TileData | undefined }

/**
 * A tile and its eight neighbours as one: what a per-tile layer needs to build the things ANCHORED in the
 * middle tile (a café's terrace, a sign) while reading the streets and buildings round it, which may lie in
 * the next tile. Edges and rails de-duplicated by id. Null until all nine tiles that exist are present.
 */
export interface Near { key: string; tile: TileData; around: Omit<TileData, 'key'> }

export function nearOf(source: TileSource, key: string, exists: (k: string) => boolean = () => true): Near | null {
  const tile = source.get(key)
  if (!tile) return null
  const [tx, tz] = key.split(',').map(Number)
  const around: Omit<TileData, 'key'> = { edges: [], buildings: [], fringe: [], areas: [], trees: [], pois: [], furniture: [], landmarks: [], rails: [], plantings: [], boats: [] }
  const edges = new Set<number>()
  const rails = new Set<number>()
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const k = tileKey(tx + dx, tz + dz)
      const t = source.get(k)
      if (!t) { if (exists(k)) return null; continue }
      for (const e of t.edges) if (!edges.has(e.id)) { edges.add(e.id); around.edges.push(e) }
      for (const r of t.rails) if (!rails.has(r.id)) { rails.add(r.id); around.rails.push(r) }
      around.buildings.push(...t.buildings)
      around.fringe.push(...t.fringe)
      around.areas.push(...t.areas)
      for (const v of t.trees) around.trees.push(v)
      around.pois.push(...t.pois)
      around.furniture.push(...t.furniture)
      around.landmarks.push(...t.landmarks)
      for (const v of t.plantings) around.plantings.push(v)
      around.boats!.push(...(t.boats ?? []))
    }
  }
  return { key, tile, around }
}

/** A tile source over tiles held in memory. */
export class MemoryTiles implements TileSource {
  readonly tiles: Map<string, TileData>
  constructor(tiles: Map<string, TileData>) { this.tiles = tiles }
  get(key: string): TileData | undefined { return this.tiles.get(key) }
}
