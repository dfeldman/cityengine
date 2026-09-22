/**
 * What a baked city is, on disk and in memory.
 *
 * The rule Trail Trainer set and this game keeps: **the game touches no network service while it runs.** Everything
 * comes from Overpass once, offline, and ships as a static file. A rider halfway through a session does not
 * want a tile server outage, and a platform that runs on a machine in a garage may not have internet at all.
 *
 * JSON rather than a binary format, for now: a square kilometre of Paris is about a megabyte and gzips to
 * a fraction of that, and being able to read a city package in a text editor while debugging is worth more
 * at this stage than the bytes. If a city ever gets big enough for that to hurt, the geometry arrays are
 * already shaped so they can become typed arrays without touching anything that reads them.
 */
import type { StyleId } from './facade.ts'
import type { PackedTerrain } from './terrain.ts'

export interface PackedEdge {
  id: number
  a: number
  b: number
  /** flattened x,z pairs in local metres */
  points: number[]
  surface: 'asphalt' | 'concrete' | 'cobblestone' | 'gravel' | 'dirt' | 'wood'
  /**
   * The CARRIAGEWAY, not the corridor. The pavement is carved out of what OSM calls the street's width
   * rather than added outside it, so that `width + 2 * walk` is the building-to-building corridor and every
   * street that should have a pavement visibly has one. Adding it outside instead made the carriageway fill
   * the gap between the buildings on Paris's narrow streets and squeezed the pavement to nothing.
   */
  width: number
  /** the pavement either side, in metres; 0 on a lane too narrow to have one */
  walk: number
  name?: string
  foot: boolean
  /** a marked place where a footway crosses a carriageway — drawn as a zebra rather than as pavement */
  crossing?: boolean
  /** ground height at each point of `points`, in metres; absent on a city baked flat */
  heights?: number[]
  /** the OSM `highway` value — what kind of way this is, which decides whether the rider is steered down it */
  kind: string
  /** OSM `service=*`: a parking aisle or a driveway is not a street */
  service?: string
  oneway?: boolean
  /** OSM `layer`, for keeping a bridge and the street under it apart */
  layer?: number
  bridge?: boolean
  tunnel?: boolean
  /** through a building at grade (tunnel=building_passage, covered=yes): rideable, drawn as an arch */
  passage?: boolean
  /** a way the bake lifted onto a bridge's deck (tools/bridges.ts): drawn as a structure, like the bridge */
  ramp?: true
}

export type RoofShape = 'flat' | 'gabled' | 'hipped' | 'pyramidal' | 'skillion' | 'mansard' | 'dome'

export interface PackedBuilding {
  /** the OSM way id, which is also the seed: a re-bake leaves every building exactly as it was */
  id: number
  /** flattened x,z pairs, counter-clockwise, first point not repeated */
  ring: number[]
  style: StyleId
  levels?: number
  height?: number
  minHeight?: number
  /** what the roof is, after OSM's own tags and the style's default have both had their say */
  roof: RoofShape
  /** how tall the roof is above the eaves, in metres */
  roofHeight: number
  /** the ridge bearing in radians, where a shape has a ridge */
  roofDirection?: number
  /** rgb 0–1 */
  roofColour: [number, number, number]
  /**
   * Courtyards: the inner rings of a multipolygon building, flattened x,z pairs, CLOCKWISE — so the wall
   * builder's outward normal for each points into the court. 726 of the Marais's 730 building relations have
   * one; without them every courtyard was roofed over.
   */
  holes?: number[][]
  /** nobody tagged a height and the bake guessed the level count (tools/heights.ts); for the report and debugging */
  levelsInferred?: true
}

/**
 * A building beyond the rideable box, drawn as plain massing so the city does not end in a field (the
 * "fringe", render/fringe.ts). Only what massing needs: footprint, height, the style whose far page and
 * palette it wears, and its roof.
 */
export interface PackedFringe {
  ring: number[]
  height: number
  style: StyleId
  roof: RoofShape
  roofHeight: number
  roofColour: [number, number, number]
  /** the OSM way id: the seed for its palette */
  id: number
}

export interface PackedArea {
  kind: 'park' | 'grass' | 'water' | 'wood' | 'pitch' | 'paved'
  ring: number[]
  /** inner rings: the islands in a river, the courtyard in a park */
  holes?: number[][]
  /** drawn over the other areas (a square paved by hand over the park OSM spreads across it) */
  top?: boolean
}

/**
 * A named place — a café, a pharmacy, a museum. OSM has thousands of these and almost none of them has a
 * modelled building, which is precisely why they are worth drawing: a name on a fascia needs no building to
 * hang on and does more for "this is the Marais" than another window variant would.
 */
export interface PackedPoi {
  x: number
  z: number
  name: string
  kind: 'shop' | 'food' | 'culture' | 'service'
}

/**
 * A piece of street furniture OSM mapped at a point: the things that say which city this is. Placed where
 * the mapper put it; the renderer turns it to face the nearest street.
 */
export interface PackedFurniture {
  x: number
  z: number
  kind: 'metro' | 'fountain' | 'column' | 'kiosk' | 'bikeshare' | 'signals'
  /** a Wallace fountain, as opposed to any drinking tap */
  wallace?: true
}

/**
 * A named building worth naming on the street (item K): a church, a school, a museum, a town hall. Ranked by
 * tools/landmark-rank.ts; placed by src/city/landmark-place.ts.
 */
export interface PackedLandmark {
  /** the packed building id it belongs to */
  id: number
  name: string
  kind: 'church' | 'school' | 'museum' | 'civic' | 'shop' | 'historic' | 'other'
  /** 1: a big plate and a totem on the pavement; 2: a smaller plate */
  tier: 1 | 2
  /** the building's centre */
  x: number
  z: number
  /** the wall the plate hangs on: its midpoint, outward normal and length */
  frontage: { x: number; z: number; nx: number; nz: number; len: number }
  /** where the totem stands, tier 1 only, when there is a pavement to stand it on */
  totem?: { x: number; z: number }
}

/** A boat moored on a river (OSM `building=boat|houseboat`): the Seine's péniches — bars, homes, a fire station. */
export interface PackedBoat {
  id: number
  /** its footprint, flattened x,z */
  ring: number[]
  name?: string
}

/** A bridge's outline (OSM `man_made=bridge`), what render/bridges.ts builds its structure from. */
export interface PackedBridge {
  id: number
  /** the outline, flattened x,z */
  ring: number[]
  name?: string
}

/** A railway, for the trains that run on it. Straight through; trains do not steer. */
export interface PackedRail {
  id: number
  points: number[]
  kind: 'rail' | 'tram' | 'subway'
  /** an elevated structure — the Loop's L — and how high it runs (tools/bridges.ts) */
  bridge?: boolean
  layer?: number
  heights?: number[]
}

export interface CityPackage {
  id: string
  name: string
  origin: { lat: number; lon: number }
  radius: number
  /** the rideable box in local metres (x east, z north); absent on an older package, which is ±radius */
  box?: { x0: number; x1: number; z0: number; z1: number }
  /** what the ground is where nothing is mapped */
  ground: 'grass' | 'sand' | 'dirt'
  /** regional character (src/city/regions.json) */
  region?: string
  /** where a session starts: an edge id and how far along it */
  start: { edgeId: number; s: number }
  edges: PackedEdge[]
  buildings: PackedBuilding[]
  areas: PackedArea[]
  /** x,z pairs of individual mapped trees */
  trees: number[]
  rails: PackedRail[]
  pois: PackedPoi[]
  /** named buildings, for their name plates and totems */
  landmarks?: PackedLandmark[]
  /** far landmarks on the horizon, in local metres (tools/cities.ts `skyline`) */
  skyline?: { name: string; x: number; z: number; procedural: string; heightM: number; baseY?: number }[]
  /** mapped street furniture (tools/overpass.ts `furnitureQuery`); absent on a package baked before it */
  furniture?: PackedFurniture[]
  /** the ground, sampled on a grid; absent on a city baked flat */
  terrain?: PackedTerrain
  attribution: string[]
  baked: string
  /** buildings beyond the box, as massing (optional: older packages have none) */
  fringe?: PackedFringe[]
  /** moored boats (render/boats.ts); drawn afloat, never as buildings */
  boats?: PackedBoat[]
  /** the bridges' outlines (render/bridges.ts) */
  bridges?: PackedBridge[]
  /** every tree, decided at bake time (city/plantings.ts): x, z, height, spin, park (0/1) per tree */
  plantings?: number[]
  /** the water bodies WHOLE, when `areas` are tile pieces (quays, the occluder and the crowd need the whole) */
  water?: PackedArea[]
}

export const unpackPoints = (flat: number[]): { x: number; z: number }[] => {
  const out: { x: number; z: number }[] = []
  for (let i = 0; i < flat.length; i += 2) out.push({ x: flat[i], z: flat[i + 1] })
  return out
}

export const packPoints = (pts: { x: number; z: number }[]): number[] =>
  pts.flatMap((p) => [Math.round(p.x * 100) / 100, Math.round(p.z * 100) / 100])

/** A structure (a bridge, or a ramp standing off the ground) rather than painted ground. */
export function isRaised(e: PackedEdge, _terrain?: { heightAt(x: number, z: number): number }): boolean {
  // marked at bake (tools/bake.ts, from tools/bridges.ts): inferring it from how far the heights stand off the
  // terrain stopped working once every street on a hillside was levelled above it (BUGS.md #38) — ordinary
  // streets came out as decks on embankments
  return !!e.bridge || !!e.ramp
}

/** The water bodies whole: from the index when `areas` are tile pieces, else the package's own. */
export const wholeWater = (pkg: Pick<CityPackage, 'areas' | 'water'>): PackedArea[] =>
  pkg.water ?? pkg.areas.filter((a) => a.kind === 'water')

/** On or above the ground: not a tunnel, not mapped below grade (a bridge over a cutting is still above it). */
/**
 * Is a way on the open ground (drawn, and ridden)? Not a tunnel; and at layer −1 only a walk or a cycle track
 * that is not a tunnel: the Seine's riverside promenades (the Berges, André Gorz) are layer −1 where they pass
 * under the bridges, in the open, and dropping them made every bridge a dead end on the river path (BUGS.md
 * #20). A layer −1 ROAD is an underpass or a car park's ramp, and stays out.
 */
const SHALLOW = new Set(['footway', 'path', 'pedestrian', 'cycleway'])
export const onSurface = (e: { tunnel?: boolean; layer?: number; bridge?: boolean; kind?: string }): boolean =>
  !e.tunnel && ((e.layer ?? 0) >= 0 || !!e.bridge || ((e.layer ?? 0) === -1 && SHALLOW.has(e.kind ?? '')))

/**
 * The level of each body of water: its lowest bank less the region's drop — and ONE level for bodies that
 * touch, the lowest of them. OSM maps the Seine as several polygons meeting along lines across the river,
 * each with its own lowest bank; drawn at their own levels they stepped a metre at the seam, and the depth
 * occluder of the higher cut shards out of the lower (BUGS.md #36). Touching = a vertex of one within 3 m of
 * a vertex of the other.
 */
export function waterLevels(water: PackedArea[], heightAt: (x: number, z: number) => number, drop: number): number[] {
  const own = water.map((a) => {
    let lv = Infinity
    for (let i = 0; i < a.ring.length; i += 2) lv = Math.min(lv, heightAt(a.ring[i], a.ring[i + 1]))
    return lv - drop
  })
  const parent = water.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const CELL = 3
  const grid = new Map<string, number[]>()
  water.forEach((a, k) => {
    for (let i = 0; i < a.ring.length; i += 2) {
      const gx = Math.floor(a.ring[i] / CELL)
      const gz = Math.floor(a.ring[i + 1] / CELL)
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        for (const o of grid.get(`${gx + dx},${gz + dz}`) ?? []) if (o !== k) parent[find(o)] = find(k)
      }
      const key = `${gx},${gz}`
      const list = grid.get(key)
      if (!list) grid.set(key, [k])
      else if (!list.includes(k)) list.push(k)
    }
  })
  const low = new Map<number, number>()
  own.forEach((lv, k) => { const r = find(k); low.set(r, Math.min(low.get(r) ?? Infinity, lv)) })
  return own.map((_, k) => low.get(find(k))!)
}
