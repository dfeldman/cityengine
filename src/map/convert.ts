/**
 * v2 tile → v3 tile (MAP-FORMAT §12 step 1). Pure: the caller supplies the ground, the city's zFloor, the
 * shared dictionaries and the street refs, all of which need the whole city (tools/map-v3.ts does that pass).
 *
 * Nothing is lost that `adapt.ts` needs to give the v2 tile back exactly — `tests/map-v3.test.ts` holds that
 * over every tile of a real city. The only lossy fields are ones stored as floats with more precision than a
 * v3 integer carries (a roof's bearing, a colour not on the 1/255 grid), and those are measured there.
 *
 * FRAME: v2 {x, z} metres → v3 {x, y} centimetres from the tile's corner; v2 heights (y, metres) → v3 z,
 * centimetres above zFloor.
 */
import type { TileData } from '../city/tiles.ts'
import { TILE } from '../city/tiles.ts'
import type { PackedBuilding, PackedEdge, PackedFringe } from '../city/package.ts'
import { TREE_FORMS } from '../city/tree-forms.ts'
import { buildingFoot, simplifyRing } from './footing.ts'
import {
  IF, RF, SF, type Area, type Building, type Items, type MapDict, type MapTile, type Part, type Place,
  type Roof, type Way,
} from './format.ts'

/** Interns strings into the city's dictionaries. One per city, shared by every tile. */
export class DictBuilder {
  readonly dict: MapDict = { names: [], styles: [], kinds: [], items: [], archetypes: [] }
  private readonly maps = new Map<keyof MapDict, Map<string, number>>()
  id(which: keyof MapDict, s: string): number {
    let m = this.maps.get(which)
    if (!m) { m = new Map(this.dict[which].map((v, i) => [v, i])); this.maps.set(which, m) }
    let i = m.get(s)
    if (i === undefined) { i = this.dict[which].length; this.dict[which].push(s); m.set(s, i) }
    return i
  }
}

export interface ConvertContext {
  /** cm, v2 datum frame */
  zFloor: number
  dict: DictBuilder
  /** the raw ground, v2 frame metres — the shipped terrain model; what AREAS are draped on */
  heightAt: (x: number, z: number) => number
  /**
   * The ground things STAND on: the raw ground raised to a street's level inside its corridor (city/grade.ts) —
   * exactly `Terrain.heightAt` in the renderer, which is what building feet and point things have always been
   * placed with. Defaults to `heightAt` (a converter run without the streets' levelling).
   */
  groundAt?: (x: number, z: number) => number
  /** the stable ref of a street (needs every edge in the city to number dual carriageways consistently) */
  edgeRef: (e: PackedEdge) => string
  /** counters for the report */
  stats?: ConvertStats
}

export interface ConvertStats {
  tiles: number
  /** ways that disagreed with a shared junction node's z and carry their own */
  zOverrides: number
  /** junctions whose two streets' end points were not the same coordinate, so were not shared */
  unsharedJunctions: number
  /** heights at or below zFloor (would read as "none") — must stay 0 */
  belowFloor: number
}

export const newStats = (): ConvertStats => ({ tiles: 0, zOverrides: 0, unsharedJunctions: 0, belowFloor: 0 })

/** A street's stable ref before dual carriageways are numbered: its two junctions, lower first. */
export const edgePair = (e: { a: number; b: number }): string => (e.a <= e.b ? `s${e.a}-${e.b}` : `s${e.b}-${e.a}`)

/**
 * Refs for every edge in a city: `s<a>-<b>`, and `~2`, `~3`… for further edges between the same two junctions,
 * in edge-id order. Built once over the whole city so every tile holding an edge gives it the same ref.
 */
export function edgeRefs(edges: Iterable<PackedEdge>): Map<number, string> {
  const byPair = new Map<string, number[]>()
  for (const e of edges) {
    const k = edgePair(e)
    const l = byPair.get(k)
    if (!l) byPair.set(k, [e.id])
    else if (!l.includes(e.id)) l.push(e.id)
  }
  const out = new Map<number, string>()
  for (const [k, ids] of byPair) {
    ids.sort((a, b) => a - b)
    ids.forEach((id, i) => out.set(id, i === 0 ? k : `${k}~${i + 1}`))
  }
  return out
}

export const rgbToInt = (c: [number, number, number]): number =>
  (Math.round(c[0] * 255) << 16) | (Math.round(c[1] * 255) << 8) | Math.round(c[2] * 255)

const RAD_TO_CDEG = 18000 / Math.PI

/** v2 furniture kinds → v3 item types. No city-specific flags: a Wallace fountain is a type (MAP-FORMAT §2.7). */
export const FURNITURE_TYPE: Record<string, string> = {
  metro: 'metro.entrance', fountain: 'fountain', column: 'column.advert', kiosk: 'kiosk', bikeshare: 'bikeshare',
  signals: 'signals', tramstop: 'tramstop', billboard: 'billboard', stop: 'sign.stop', busstop: 'busstop',
  postbox: 'postbox', hydrant: 'hydrant',
}

export function convertTile(t: TileData, ctx: ConvertContext): MapTile {
  const [tx, ty] = t.key.split(',').map(Number)
  const ox = tx * TILE * 100
  const oy = ty * TILE * 100
  const { dict } = ctx
  const lx = (x: number): number => Math.round(x * 100) - ox
  const ly = (z: number): number => Math.round(z * 100) - oy
  const zc = (h: number): number => {
    const v = Math.round(h * 100) - ctx.zFloor
    if (v < 1 && ctx.stats) ctx.stats.belowFloor++
    return v
  }
  const standAt = ctx.groundAt ?? ctx.heightAt
  const ground = (x: number, z: number): number => zc(standAt(x, z))
  const rawGround = (x: number, z: number): number => zc(ctx.heightAt(x, z))

  const nodes: number[] = []
  const nodeIds: Record<number, number> = {}
  const node = (x: number, z: number, h: number): number => {
    nodes.push(lx(x), ly(z), h)
    return nodes.length / 3 - 1
  }
  /** junctions shared by id AND coordinate: two ends that merely share an id but not a place are not one node */
  const junctions = new Map<string, number>()
  const junctionIds = new Set<number>()
  const junction = (id: number, x: number, z: number, h: number): number => {
    const k = `${id}:${lx(x)}:${ly(z)}`
    const had = junctions.get(k)
    if (had !== undefined) return had
    const i = node(x, z, h)
    nodeIds[i] = id
    if (ctx.stats && junctionIds.has(id)) ctx.stats.unsharedJunctions++
    junctionIds.add(id)
    junctions.set(k, i)
    return i
  }
  /** a way over a flat x,z list, every node its own, z from the ground */
  const ringWay = (flat: number[], role: Way['role']): Way => {
    // areas are draped on the raw ground (terrain.drapeRaw); everything else stands on the levelled ground
    const g = role === 'area' || role === 'hole' ? rawGround : ground
    const ns: number[] = []
    for (let i = 0; i < flat.length; i += 2) ns.push(node(flat[i], flat[i + 1], g(flat[i], flat[i + 1])))
    return { role, nodes: ns }
  }

  const ways: Way[] = []
  const addWay = (w: Way): number => { ways.push(w); return ways.length - 1 }

  // ---- streets
  for (const e of t.edges) {
    const n = e.points.length / 2
    const zs: number[] = []
    for (let i = 0; i < n; i++) zs.push(e.heights ? zc(e.heights[i]) : 0)
    const ns: number[] = []
    for (let i = 0; i < n; i++) {
      const x = e.points[2 * i]
      const z = e.points[2 * i + 1]
      ns.push(i === 0 ? junction(e.a, x, z, zs[i]) : i === n - 1 ? junction(e.b, x, z, zs[i]) : node(x, z, zs[i]))
    }
    let flags = 0
    if (e.foot) flags |= SF.foot
    if (e.oneway) flags |= SF.oneway
    if (e.bridge) flags |= SF.bridge
    if (e.tunnel) flags |= SF.tunnel
    if (e.passage) flags |= SF.passage
    if (e.ramp) flags |= SF.ramp
    if (e.bore) flags |= SF.bore
    if (e.cut) flags |= SF.cut
    if (e.authored) flags |= SF.authored
    if (e.crossing) flags |= SF.crossing
    if (e.park) flags |= SF.park
    const w: Way = {
      ref: ctx.edgeRef(e), role: 'street', nodes: ns, id: e.id, a: e.a, b: e.b, kind: dict.id('kinds', e.kind), flags,
      surface: e.surface, width: Math.round(e.width * 100), walk: Math.round(e.walk * 100),
    }
    if (ns.some((k, i) => nodes[3 * k + 2] !== zs[i])) {
      w.z = zs
      if (ctx.stats) ctx.stats.zOverrides++
    }
    if (e.name !== undefined) w.name = dict.id('names', e.name)
    if (e.layer !== undefined) w.layer = e.layer
    if (e.service !== undefined) w.service = e.service
    addWay(w)
  }

  // ---- rails
  for (const r of t.rails) {
    const ns: number[] = []
    for (let i = 0; i < r.points.length; i += 2) ns.push(node(r.points[i], r.points[i + 1], r.heights ? zc(r.heights[i / 2]) : 0))
    let flags = 0
    if (r.bridge) flags |= RF.bridge
    if (r.cable) flags |= RF.cable
    if (r.light) flags |= RF.light
    const w: Way = { ref: `t${r.id}`, role: 'rail', nodes: ns, id: r.id, kind: dict.id('kinds', r.kind), flags }
    if (r.layer !== undefined) w.layer = r.layer
    addWay(w)
  }

  // ---- bridge outlines
  for (const b of t.bridges ?? []) {
    const w = ringWay(b.ring, 'bridge')
    w.id = b.id
    if (b.name !== undefined) w.name = dict.id('names', b.name)
    addWay(w)
  }

  // ---- buildings, parts folded into their owner, fringe as far massing
  const roofOf = (b: { roof: PackedBuilding['roof']; roofHeight: number; roofDirection?: number; roofColour: [number, number, number] }): Roof => {
    const r: Roof = { shape: b.roof, h: Math.round(b.roofHeight * 100), colour: rgbToInt(b.roofColour) }
    if (b.roofDirection !== undefined) r.dir = Math.round(b.roofDirection * RAD_TO_CDEG)
    return r
  }
  const footOf = (ring: number[]): number => {
    const pts: { x: number; z: number }[] = []
    for (let i = 0; i < ring.length; i += 2) pts.push({ x: ring[i], z: ring[i + 1] })
    return zc(buildingFoot(simplifyRing(pts), standAt))
  }
  const centreOf = (ring: number[]): [number, number] => {
    let x = 0
    let z = 0
    for (let i = 0; i < ring.length; i += 2) { x += ring[i]; z += ring[i + 1] }
    return [x / (ring.length / 2), z / (ring.length / 2)]
  }
  const holesOf = (holes: number[][] | undefined): number[] | undefined =>
    holes && holes.length ? holes.map((h) => addWay(ringWay(h, 'hole'))) : undefined

  const buildings: Building[] = []
  const owners = new Map<number, Building>()
  const partSums = new Map<number, [number, number, number]>()
  for (const b of t.buildings) {
    const way = addWay(ringWay(b.ring, 'footprint'))
    const holes = holesOf(b.holes)
    const common = {
      way, z: footOf(b.ring), roof: roofOf(b), style: dict.id('styles', b.style), seed: b.id,
      ...(holes ? { holes } : {}),
      ...(b.height !== undefined ? { h: Math.round(b.height * 100) } : {}),
      ...(b.minHeight !== undefined ? { minH: Math.round(b.minHeight * 100) } : {}),
      ...(b.levels !== undefined ? { levels: b.levels } : {}),
      ...(b.levelsInferred ? { levelsInferred: true as const } : {}),
      ...(b.archetype !== undefined ? { archetype: dict.id('archetypes', b.archetype) } : {}),
      ...(b.form ? { form: b.form } : {}),
      ...(b.stretch !== undefined ? { stretch: b.stretch } : {}),
      ...(b.palette ? { palette: b.palette } : {}),
    }
    const [cx, cz] = centreOf(b.ring)
    if (b.partOf === undefined) {
      buildings.push({ ref: `b${b.id}`, kind: b.palette ? 'restyled' : 'generic', cx: lx(cx), cy: ly(cz), ...common })
      continue
    }
    // a part whose outline the bake dropped: the outline comes back as the part's owner (MAP-FORMAT §5.3)
    let o = owners.get(b.partOf)
    if (!o) {
      o = { ref: `b${b.partOf}`, kind: 'generic', cx: 0, cy: 0, z: common.z, seed: b.partOf, parts: [] }
      owners.set(b.partOf, o)
      buildings.push(o)
    }
    const part: Part = { ref: `b${b.id}`, ...common }
    o.parts!.push(part)
    o.z = Math.min(o.z, part.z)
    const s = partSums.get(b.partOf) ?? [0, 0, 0]
    s[0] += cx
    s[1] += cz
    s[2]++
    partSums.set(b.partOf, s)
  }
  for (const [id, [sx, sz, n]] of partSums) {
    const o = owners.get(id)!
    o.cx = lx(sx / n)
    o.cy = ly(sz / n)
  }
  for (const f of t.fringe as PackedFringe[]) {
    const way = addWay(ringWay(f.ring, 'footprint'))
    const [cx, cz] = centreOf(f.ring)
    // far massing keeps its own, cheaper rule (render/fringe.ts): the lowest CORNER, less 0.3 m
    let low = Infinity
    for (let i = 0; i < f.ring.length; i += 2) low = Math.min(low, standAt(f.ring[i], f.ring[i + 1]))
    buildings.push({
      ref: `b${f.id}`, kind: f.palette ? 'restyled' : 'generic', lod: 'far', way, cx: lx(cx), cy: ly(cz), z: zc(low - 0.3),
      h: Math.round(f.height * 100), roof: roofOf(f), style: dict.id('styles', f.style), seed: f.id,
      ...(f.palette ? { palette: f.palette } : {}),
    })
  }

  // ---- areas (clipped already; each keeps `of`)
  const areas: Area[] = []
  for (const a of t.areas) {
    const way = addWay(ringWay(a.ring, 'area'))
    const holes = holesOf(a.holes)
    const r: Area = { kind: a.kind, way, of: a.of }
    if (holes) r.holes = holes
    if (a.top) r.top = true
    if (a.sea) r.sea = true
    if (a.level !== undefined) r.level = zc(a.level)
    areas.push(r)
  }

  // ---- items: mapped trees, plantings, furniture
  const data: number[] = []
  const flags: number[] = []
  let anyFlag = false
  const item = (x: number, z: number, rot: number, type: string, size: number, f = 0): void => {
    data.push(lx(x), ly(z), ground(x, z), rot, dict.id('items', type), size, -1, -1)
    flags.push(f)
    if (f) anyFlag = true
  }
  for (let i = 0; i + 1 < t.trees.length; i += 2) item(t.trees[i], t.trees[i + 1], 0, 'tree.osm', 0)
  for (let i = 0; i + 4 < t.plantings.length; i += 5) {
    const p = t.plantings
    const form = p[i + 4] >> 1
    const name = TREE_FORMS[form]
    // an unknown code keeps its number, so a newer bake's forms survive an older reader
    const type = form === 0 ? 'tree' : `tree.${name || `f${form}`}`
    item(p[i], p[i + 1], Math.round(p[i + 3] * RAD_TO_CDEG), type, Math.round(p[i + 2] * 100), p[i + 4] & 1 ? IF.park : 0)
  }
  for (const f of t.furniture) {
    const base = FURNITURE_TYPE[f.kind] ?? f.kind
    item(f.x, f.z, -1, f.kind === 'fountain' && f.wallace ? 'fountain.wallace' : base, 0)
  }
  const items: Items | undefined = data.length ? { data, ...(anyFlag ? { flags } : {}) } : undefined

  // ---- places: POIs and landmark plates
  const places: Place[] = []
  for (const p of t.pois) places.push({ x: lx(p.x), y: ly(p.z), z: ground(p.x, p.z), name: dict.id('names', p.name), kind: p.kind })
  for (const l of t.landmarks) {
    const f = l.frontage
    const pl: Place = {
      ref: `p${l.id}`, x: lx(l.x), y: ly(l.z), z: ground(l.x, l.z), name: dict.id('names', l.name), kind: l.kind,
      building: `b${l.id}`, tier: l.tier,
      plate: [lx(f.x), ly(f.z), Math.round(f.nx * 1e4), Math.round(f.nz * 1e4), Math.round(f.len * 100)],
    }
    if (l.totem) pl.totem = [lx(l.totem.x), ly(l.totem.z)]
    places.push(pl)
  }

  const out: MapTile = { v: 3, key: t.key, tx, ty, nodes, ways, buildings }
  if (Object.keys(nodeIds).length) out.nodeIds = nodeIds
  if (areas.length) out.areas = areas
  if (items) out.items = items
  if (places.length) out.places = places
  if (t.boats?.length) out.boats = t.boats.map((b) => ({ id: b.id, ring: b.ring.map((v, i) => (i % 2 ? ly(v) : lx(v))), ...(b.name !== undefined ? { name: b.name } : {}) }))
  if (t.courts?.length) {
    out.courts = t.courts.map((c) => ({
      sport: c.sport, x: lx(c.x), y: ly(c.z), heading: c.heading, len: Math.round(c.len * 100), wid: Math.round(c.wid * 100),
      ...(c.half ? { half: true } : {}),
    }))
  }
  if (t.terrain) {
    const g = t.terrain
    out.terrain = { step: g.step, cols: g.cols, z: g.dm.map((d) => d * 10 - ctx.zFloor), ...(g.src ? { src: g.src } : {}), ...(g.resM ? { resM: g.resM } : {}) }
  }
  if (ctx.stats) ctx.stats.tiles++
  return out
}
