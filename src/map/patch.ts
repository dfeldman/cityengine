/**
 * Patches (MAP-FORMAT §8): hand corrections applied AFTER the bake, so fixing a street or a building never needs
 * a re-bake. A patch set is JSON for a whole city; it is indexed once, and each tile is patched as it loads, one
 * `Map` lookup per record.
 *
 * Coordinates in a patch are CITY centimetres (x east, y north, z up above zFloor), not tile-local: a patch is
 * written by a person or the editor looking at the whole map, and the loader files each add into its tile.
 */
import { ITEM_STRIDE, type Building, type Deck, type MapDict, type MapIndex, type MapTile, type Place, type Ref, type Way } from './format.ts'

export interface PatchSet {
  v: 1
  city: string
  ops: PatchOp[]
}

export type PatchOp =
  | { op: 'suppress'; ref: Ref; note?: string }
  | { op: 'override'; ref: Ref; set: Record<string, unknown>; note?: string }
  | { op: 'add'; type: 'building'; record: AddBuilding; note?: string }
  | { op: 'add'; type: 'item'; record: AddItem; note?: string }
  | { op: 'add'; type: 'place'; record: AddPlace; note?: string }
  | { op: 'add'; type: 'deck'; record: AddDeck; note?: string }

/** A new building: its footprint as city-cm x,y pairs; `z` 0 or absent = on the ground here. */
export type AddBuilding = Omit<Building, 'way' | 'holes' | 'cx' | 'cy' | 'z' | 'style' | 'archetype' | 'parts'> & {
  pts: number[]
  z?: number
  style?: string
}
export interface AddItem {
  ref: Ref
  x: number
  y: number
  z?: number
  type: string
  rot?: number
  size?: number
  colour?: number
  colour2?: number
}
export type AddPlace = Omit<Place, 'name' | 'z'> & { name: string; z?: number }
export type AddDeck = Omit<Deck, 'way'> & { pts: number[] }

/**
 * Fields a patch writes as strings that the tile stores as dictionary indices — per record type, because `kind`
 * is a dictionary index on a way and a plain string on a building or a place.
 */
type DictFields = Record<string, keyof MapDict>
const WAY_DICT: DictFields = { kind: 'kinds', name: 'names' }
const BUILDING_DICT: DictFields = { style: 'styles', archetype: 'archetypes' }
const PLACE_DICT: DictFields = { name: 'names' }

export interface PatchIndex {
  /** by ref: the LAST op naming it wins (a city's set is applied after its region's) */
  byRef: Map<Ref, PatchOp>
  /** adds, by the key of the tile holding their centre */
  adds: Map<string, PatchOp[]>
  count: number
}

const centreOf = (pts: number[]): [number, number] => {
  let x = 0
  let y = 0
  for (let i = 0; i < pts.length; i += 2) { x += pts[i]; y += pts[i + 1] }
  return [x / (pts.length / 2), y / (pts.length / 2)]
}

export function indexPatches(sets: PatchSet[], tile: number): PatchIndex {
  const byRef = new Map<Ref, PatchOp>()
  const adds = new Map<string, PatchOp[]>()
  let count = 0
  const T = tile * 100
  for (const s of sets) {
    for (const op of s.ops) {
      count++
      if (op.op !== 'add') { byRef.set(op.ref, op); continue }
      const r = op.record as { pts?: number[]; x?: number; y?: number }
      const [x, y] = r.pts ? centreOf(r.pts) : [r.x!, r.y!]
      const key = `${Math.floor(x / T)},${Math.floor(y / T)}`
      const l = adds.get(key)
      if (l) l.push(op)
      else adds.set(key, [op])
    }
  }
  return { byRef, adds, count }
}

/** The tile's own ground at a tile-local point, cm above zFloor; 0 where the tile has none. */
function groundIn(m: MapTile, x: number, y: number): number {
  const g = m.terrain
  if (!g) return 0
  const s = g.step * 100
  const fx = Math.max(0, Math.min(g.cols - 1.0001, x / s))
  const fy = Math.max(0, Math.min(g.cols - 1.0001, y / s))
  const ix = Math.floor(fx)
  const iy = Math.floor(fy)
  const tx = fx - ix
  const ty = fy - iy
  const at = (c: number, r: number): number => g.z[r * g.cols + c]
  const a = at(ix, iy) * (1 - tx) + at(ix + 1, iy) * tx
  const b = at(ix, iy + 1) * (1 - tx) + at(ix + 1, iy + 1) * tx
  return Math.round(a * (1 - ty) + b * ty)
}

/**
 * Apply a patch index to one tile, in place, and return it. `dict` is the city's (the index's): a patch naming a
 * style or a street name the bake never saw extends it. `ground` answers "the ground here" for an add or a moved
 * way with no z of its own (city cm → cm above zFloor); by default the tile's own grid.
 */
export function applyPatches(m: MapTile, p: PatchIndex, idx: Pick<MapIndex, 'dict' | 'tile'>,
  ground?: (x: number, y: number) => number): MapTile {
  if (p.count === 0) return m
  const ox = m.tx * idx.tile * 100
  const oy = m.ty * idx.tile * 100
  const groundAt = (x: number, y: number): number => (ground ? ground(x, y) : groundIn(m, x - ox, y - oy))
  const intern = (which: keyof MapDict, s: string): number => {
    const l = idx.dict[which]
    const i = l.indexOf(s)
    if (i >= 0) return i
    l.push(s)
    return l.length - 1
  }
  /** set fields, turning dictionary strings into indices and city-cm geometry into this tile's nodes */
  const assign = (target: Record<string, unknown>, set: Record<string, unknown>, fields: DictFields = {}): void => {
    for (const [k, v] of Object.entries(set)) {
      if (k === 'pts') continue
      const d = fields[k]
      target[k] = d && typeof v === 'string' ? intern(d, v) : v
    }
  }
  /** new nodes for a city-cm polyline (x,y pairs, or x,y,z triples when `withZ`) */
  const nodesFor = (pts: number[], withZ: boolean): number[] => {
    const out: number[] = []
    const stride = withZ ? 3 : 2
    for (let i = 0; i < pts.length; i += stride) {
      const z = withZ && pts[i + 2] ? pts[i + 2] : groundAt(pts[i], pts[i + 1])
      m.nodes.push(pts[i] - ox, pts[i + 1] - oy, z)
      out.push(m.nodes.length / 3 - 1)
    }
    return out
  }

  // ---- suppress and override, by ref
  const dropWay = new Set<number>()
  m.ways.forEach((w, i) => {
    const op = w.ref ? p.byRef.get(w.ref) : undefined
    if (!op) return
    if (op.op === 'suppress') { dropWay.add(i); return }
    if (op.op !== 'override') return
    assign(w as unknown as Record<string, unknown>, op.set, WAY_DICT)
    // moved geometry: `pts` is x,y,z triples in city cm (z 0 = on the ground), replacing the nodes and any z override
    const pts = op.set.pts as number[] | undefined
    if (pts) { w.nodes = nodesFor(pts, true); delete w.z }
  })
  m.buildings = m.buildings.filter((b) => {
    const op = p.byRef.get(b.ref)
    if (op?.op === 'suppress') return false
    if (op?.op === 'override') { assign(b as unknown as Record<string, unknown>, op.set, BUILDING_DICT); b.patched = true }
    if (b.parts) {
      b.parts = b.parts.filter((q) => {
        const po = p.byRef.get(q.ref)
        if (po?.op === 'suppress') return false
        if (po?.op === 'override') assign(q as unknown as Record<string, unknown>, po.set, BUILDING_DICT)
        return true
      })
    }
    return true
  })
  if (m.places) {
    m.places = m.places.filter((q) => {
      const op = q.ref ? p.byRef.get(q.ref) : undefined
      if (op?.op === 'suppress') return false
      if (op?.op === 'override') assign(q as unknown as Record<string, unknown>, op.set, PLACE_DICT)
      return true
    })
  }
  if (m.decks) {
    m.decks = m.decks.filter((q) => {
      const op = p.byRef.get(q.ref)
      if (op?.op === 'suppress') return false
      if (op?.op === 'override') assign(q as unknown as Record<string, unknown>, op.set)
      return true
    })
  }
  if (m.items?.refs) {
    const it = m.items
    const drop = new Set<number>()
    for (const [k, ref] of Object.entries(it.refs!)) {
      const op = p.byRef.get(ref)
      const i = Number(k)
      if (op?.op === 'suppress') drop.add(i)
      else if (op?.op === 'override') {
        const s = op.set as Partial<AddItem>
        const o = i * ITEM_STRIDE
        if (s.x !== undefined) it.data[o] = s.x - ox
        if (s.y !== undefined) it.data[o + 1] = s.y - oy
        if (s.z !== undefined) it.data[o + 2] = s.z
        if (s.rot !== undefined) it.data[o + 3] = s.rot
        if (s.type !== undefined) it.data[o + 4] = intern('items', s.type)
        if (s.size !== undefined) it.data[o + 5] = s.size
        if (s.colour !== undefined) it.data[o + 6] = s.colour
        if (s.colour2 !== undefined) it.data[o + 7] = s.colour2
      }
    }
    if (drop.size) compactItems(m, drop)
  }
  if (dropWay.size) compactWays(m, dropWay)

  // ---- adds filed here
  for (const op of p.adds.get(m.key) ?? []) {
    if (op.op !== 'add') continue
    if (op.type === 'building') {
      const { pts, z, style, ...rest } = op.record
      const way = m.ways.push({ role: 'footprint', nodes: nodesFor(pts, false) }) - 1
      const [cx, cy] = centreOf(pts)
      const b: Building = {
        ...rest, way, cx: Math.round(cx - ox), cy: Math.round(cy - oy), z: z || groundAt(cx, cy), patched: true,
        ...(style !== undefined ? { style: intern('styles', style) } : {}),
      }
      m.buildings.push(b)
    } else if (op.type === 'item') {
      const r = op.record
      const it = (m.items ??= { data: [] })
      const n = it.data.length / ITEM_STRIDE
      it.data.push(r.x - ox, r.y - oy, r.z || groundAt(r.x, r.y), r.rot ?? -1, intern('items', r.type), r.size ?? 0, r.colour ?? -1, r.colour2 ?? -1)
      if (it.flags) it.flags.push(0)
      ;(it.refs ??= {})[n] = r.ref
    } else if (op.type === 'place') {
      const { name, z, ...r } = op.record
      ;(m.places ??= []).push({ ...r, x: r.x - ox, y: r.y - oy, z: z || groundAt(r.x, r.y), name: intern('names', name) })
    } else if (op.type === 'deck') {
      const { pts, ...r } = op.record
      const way = m.ways.push({ role: 'deck', nodes: nodesFor(pts, false).map((k) => { m.nodes[3 * k + 2] = r.z; return k }) }) - 1
      ;(m.decks ??= []).push({ ...r, way })
    }
  }
  return m
}

/** Remove ways and renumber every reference to the ones that stay. Nodes are left: unreferenced ones are harmless. */
function compactWays(m: MapTile, drop: Set<number>): void {
  const map = new Map<number, number>()
  const kept: Way[] = []
  m.ways.forEach((w, i) => { if (!drop.has(i)) { map.set(i, kept.length); kept.push(w) } })
  m.ways = kept
  const re = (i: number): number => {
    const v = map.get(i)
    if (v === undefined) throw new Error(`map v3 patch: way ${i} was suppressed but is still referenced`)
    return v
  }
  for (const b of m.buildings) {
    if (b.way !== undefined) b.way = re(b.way)
    if (b.holes) b.holes = b.holes.map(re)
    for (const q of b.parts ?? []) { q.way = re(q.way); if (q.holes) q.holes = q.holes.map(re) }
  }
  for (const a of m.areas ?? []) { a.way = re(a.way); if (a.holes) a.holes = a.holes.map(re) }
  for (const d of m.decks ?? []) d.way = re(d.way)
}

function compactItems(m: MapTile, drop: Set<number>): void {
  const it = m.items!
  const data: number[] = []
  const flags: number[] = []
  const refs: Record<number, Ref> = {}
  const n = it.data.length / ITEM_STRIDE
  for (let i = 0; i < n; i++) {
    if (drop.has(i)) continue
    const k = data.length / ITEM_STRIDE
    for (let j = 0; j < ITEM_STRIDE; j++) data.push(it.data[i * ITEM_STRIDE + j])
    if (it.flags) flags.push(it.flags[i])
    if (it.refs?.[i]) refs[k] = it.refs[i]
  }
  it.data = data
  if (it.flags) it.flags = flags
  it.refs = refs
}
