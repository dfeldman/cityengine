/**
 * Map format v3, as types. docs/MAP-FORMAT.md is the spec; this file and that one must say the same thing.
 *
 * THE FRAME IS NOT THE CODE'S FRAME. Here x is east, y is NORTH and z is UP, in integer centimetres, x and y
 * from the tile's south-west corner and z above the city's `zFloor`. Everything else in the project (v2 tiles,
 * the renderer, Babylon) is x east, z north, y up, in float metres. Only `convert.ts` and `adapt.ts` cross
 * between the two.
 */
import type { RingForm } from '../city/ring-forms.ts'
import type { PackedArea, PackedLandmark, PackedWall, RoofShape } from '../city/package.ts'
import type { PackedTerrain } from '../city/terrain.ts'
import type { CityIndex } from '../city/tiles.ts'

export const MAP_VERSION = 3
/** centimetres in a metre: every length in a v3 file is a whole number of these */
export const CM = 100

/** A stable name that survives a re-bake (MAP-FORMAT §9): `b123`, `s111-222`, `t45`, `n67`, `x:slug`. */
export type Ref = string

export interface MapDict {
  names: string[]
  styles: string[]
  kinds: string[]
  items: string[]
  archetypes: string[]
}

/** A zone: style for everything inside a ring the map, not OSM, draws (MAP-FORMAT §7). */
export interface Zone {
  ref: Ref
  /** x,y pairs in CITY centimetres (not tile-local: a zone lives in the index, whole) */
  ring: number[]
  priority?: number
  props: ZoneProps
}

export interface ZoneProps {
  itemColour?: Record<string, number>
  palette?: Record<string, unknown>
  crowd?: number
  traffic?: number
  exclude?: string[]
  water?: 'calm' | 'waves'
  park?: Record<string, unknown>
  furniture?: Record<string, unknown>
}

/** A facade cluster (MAP-FORMAT §6.1): one look, shared by many buildings and jittered by seed. */
export interface Cluster {
  id: string
  name: string
  style: string
  colours: number[]
  accents: number[]
  levels?: [number, number]
  params?: Record<string, unknown>
}

export interface MapIndex {
  v: 3
  id: string
  name: string
  origin: { lat: number; lon: number }
  tile: number
  unit: 'cm'
  /** centimetres, in the v2 datum frame: a v3 z of 1 is `zFloor + 1` cm there */
  zFloor: number
  /** true elevation of the v2 datum, metres, when the bake knew it */
  datumMsl?: number
  radius: number
  box?: CityIndex['box']
  ground: CityIndex['ground']
  region?: string
  start: CityIndex['start']
  skyline?: CityIndex['skyline']
  attribution: string[]
  baked: string
  dict: MapDict
  /** the coarse grid, unchanged from v2 (metres, v2 frame; its numbers are in `terrain.bin`) */
  terrain?: PackedTerrain
  zones: Zone[]
  clusters?: Cluster[]
  /**
   * v2 index records not yet moved into tiles (MAP-FORMAT §11), carried verbatim IN THE V2 FRAME: whole water
   * bodies, retaining walls, the landmark list the menu and minimap read.
   */
  legacy: { water: PackedArea[]; walls?: PackedWall[]; landmarks: PackedLandmark[] }
  /**
   * `buildings` and `edges` are counts, and not decoration: game.ts bounds the ground occluder by the tiles that
   * hold anything (BUGS.md #225), so a zero here changes what hides what.
   */
  tiles: { key: string; tx: number; ty: number; bytes: number; buildings: number; edges: number }[]
}

export type WayRole = 'street' | 'rail' | 'footprint' | 'hole' | 'area' | 'coast' | 'wall' | 'bridge' | 'zone' | 'deck'

export interface Way {
  ref?: Ref
  role: WayRole
  /** indices into the tile's node table */
  nodes: number[]
  /** one z per node, overriding the nodes' own (MAP-FORMAT §5.1): only where this way disagrees with them */
  z?: number[]
  /** the v2 numeric id (an edge's, a rail's, a bridge's): the ride files and `start` still name edges by it */
  id?: number
  /** dict.kinds */
  kind?: number
  /** dict.names */
  name?: number
  flags?: number
  // street
  surface?: 'asphalt' | 'concrete' | 'cobblestone' | 'gravel' | 'dirt' | 'wood'
  width?: number
  walk?: number
  layer?: number
  service?: string
  /** v2 junction node ids at the two ends, while refs are derived from them */
  a?: number
  b?: number
}

/** Street flag bits (MAP-FORMAT §5.5). */
export const SF = { foot: 1, oneway: 2, bridge: 4, tunnel: 8, passage: 16, ramp: 32, crossing: 64, park: 128 } as const
/** Rail flag bits. */
export const RF = { bridge: 1, cable: 2, light: 4 } as const

export interface Roof {
  shape: RoofShape
  /** cm above the eaves */
  h: number
  /** centidegrees; the v2 ridge bearing in radians × 18000/π */
  dir?: number
  /** 0xRRGGBB */
  colour: number
}

export type BuildingKind = 'generic' | 'restyled' | 'simple' | 'kit' | 'procedural' | 'mesh'

export interface Part {
  ref: Ref
  way: number
  holes?: number[]
  z: number
  h?: number
  minH?: number
  levels?: number
  roof: Roof
  style: number
  seed: number
  levelsInferred?: true
  archetype?: number
  form?: RingForm
  stretch?: boolean
  palette?: { wall: string; trim: string; roof: string; accent: string; ground?: string }
}

export interface Building {
  ref: Ref
  kind: BuildingKind
  /** the footprint way; absent on an owner whose outline v2 dropped (its parts are the building) */
  way?: number
  holes?: number[]
  cx: number
  cy: number
  /** the foot: where the walls meet the ground (MAP-FORMAT §5.3) */
  z: number
  h?: number
  minH?: number
  levels?: number
  roof?: Roof
  style?: number
  colour?: number
  accent?: number
  palette?: { wall: string; trim: string; roof: string; accent: string; ground?: string }
  parts?: Part[]
  archetype?: number
  cluster?: string
  levelsInferred?: true
  form?: RingForm
  stretch?: boolean
  seed: number
  lod?: 'far'
  originalRef?: Ref
  patched?: true
  // per kind
  kit?: Record<string, unknown>
  proc?: { name: string; params?: Record<string, unknown> }
  mesh?: { file: string; rot: number; scale?: number; offset?: [number, number, number] }
  simple?: { polys: { way: number; z: number; h: number; style?: number; colour?: number }[]; roofColour: number }
}

export interface Deck {
  ref: Ref
  way: number
  z: number
  garden?: true
}

export interface Area {
  ref?: Ref
  kind: PackedArea['kind']
  way: number
  holes?: number[]
  top?: true
  sea?: true
  /** water: the whole body's level, cm above zFloor */
  level?: number
  /** which whole area this is a clipped piece of */
  of: number
}

export interface Place {
  ref?: Ref
  x: number
  y: number
  z: number
  /** dict.names */
  name: number
  kind: string
  /** the building it belongs to */
  building?: Ref
  /** a landmark plate: its tier, the wall it hangs on (x, y, nx·10⁴, ny·10⁴, len) and its totem (x, y) */
  tier?: 1 | 2
  plate?: [number, number, number, number, number]
  totem?: [number, number]
}

/** Items: one flat array, stride `ITEM_STRIDE` (MAP-FORMAT §5.4). */
export const ITEM_STRIDE = 8
export const IT = { x: 0, y: 1, z: 2, rot: 3, type: 4, size: 5, colour: 6, colour2: 7 } as const
/** item flag bits */
export const IF = { park: 1 } as const

export interface Items {
  /** x, y, z, rot, type, size, colour, colour2 — per item */
  data: number[]
  /** parallel, one per item, only when any item has a flag */
  flags?: number[]
  /** item index → stable ref, for the few that have one */
  refs?: Record<number, Ref>
}

export interface TileGround {
  step: number
  cols: number
  /** cm above zFloor, row-major from the south-west, cols × cols */
  z: number[]
  src?: string
  resM?: number
}

/** A v2 record the format has not folded in yet, carried in v3 units (MAP-FORMAT §11). */
export interface Boat3 { id: number; ring: number[]; name?: string }
export interface Court3 {
  sport: 'tennis' | 'pickleball' | 'basketball' | 'four_square' | 'volleyball'
  x: number
  y: number
  /** radians, verbatim */
  heading: number
  len: number
  wid: number
  half?: boolean
}

export interface MapTile {
  v: 3
  key: string
  tx: number
  ty: number
  /** stride 3: x, y, z */
  nodes: number[]
  /** node index → the v2 junction id it carries */
  nodeIds?: Record<number, number>
  ways: Way[]
  buildings: Building[]
  decks?: Deck[]
  areas?: Area[]
  items?: Items
  places?: Place[]
  terrain?: TileGround
  boats?: Boat3[]
  courts?: Court3[]
}
