/**
 * v3 tile → v2 `TileData`, so the renderer runs unchanged on the new format (MAP-FORMAT §12 step 1). The exact
 * inverse of `convert.ts`; `tests/map-v3.test.ts` holds the round trip.
 *
 * What v2 cannot say is dropped here, loudly where it matters: a `simple`, `kit` or `mesh` building has no v2
 * shape (nothing writes one yet), and decks have no v2 record (landmarks build them at run time).
 *
 * FRAME: v3 {x, y} cm from the tile corner → v2 {x, z} metres; v3 z (cm above zFloor) → v2 metres.
 */
import type { CityIndex, TileArea, TileData } from '../city/tiles.ts'
import type {
  PackedBoat, PackedBridge, PackedBuilding, PackedCourt, PackedEdge, PackedFurniture, PackedLandmark,
  PackedPoi, PackedRail, RoofShape,
} from '../city/package.ts'
import type { StyleId } from '../city/facade.ts'
import { TREE_FORMS } from '../city/tree-forms.ts'
import { FURNITURE_TYPE } from './convert.ts'
import { IF, ITEM_STRIDE, RF, SF, type Building, type MapIndex, type MapTile, type Part, type Roof } from './format.ts'

const CDEG_TO_RAD = Math.PI / 18000
const r2 = (v: number): number => Math.round(v * 100) / 100
const intToRgb = (c: number): [number, number, number] => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255]
const FURNITURE_KIND = new Map(Object.entries(FURNITURE_TYPE).map(([k, v]) => [v, k]))

/** The game's view of a v3 index: the `CityIndex` `game.ts` and the renderer read. */
export function adaptIndex(m: MapIndex): CityIndex {
  return {
    id: m.id, name: m.name, origin: m.origin, radius: m.radius, ground: m.ground, start: m.start,
    ...(m.box ? { box: m.box } : {}), ...(m.region ? { region: m.region } : {}),
    ...(m.terrain ? { terrain: m.terrain } : {}), ...(m.skyline ? { skyline: m.skyline } : {}),
    // the sea's surface in the code frame: the bake writes `datumMsl` only for a city with a sea (convert-city.ts)
    ...(typeof m.datumMsl === 'number' ? { sea: -m.datumMsl } : {}),
    landmarks: m.legacy.landmarks, water: m.legacy.water, ...(m.legacy.walls ? { walls: m.legacy.walls } : {}),
    attribution: m.attribution, baked: m.baked, tile: m.tile,
    tiles: m.tiles.map((t) => ({ key: t.key, tx: t.tx, tz: t.ty, bytes: t.bytes, buildings: t.buildings, edges: t.edges })),
    // city centimetres, x east y north → local metres, x east z north (the code frame)
    ...(m.zones.length ? {
      zones: m.zones.map((zn) => {
        const ring = zn.ring.map((v) => v / 100)
        let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity
        for (let i = 0; i < ring.length; i += 2) { x0 = Math.min(x0, ring[i]); x1 = Math.max(x1, ring[i]); z0 = Math.min(z0, ring[i + 1]); z1 = Math.max(z1, ring[i + 1]) }
        return { ref: zn.ref, ring, priority: zn.priority ?? 0, props: zn.props, bbox: [x0, z0, x1, z1] as [number, number, number, number] }
      }),
    } : {}),
  }
}

export function adaptTile(m: MapTile, idx: Pick<MapIndex, 'zFloor' | 'dict' | 'tile'>): TileData {
  const ox = m.tx * idx.tile * 100
  const oy = m.ty * idx.tile * 100
  const zf = idx.zFloor
  const { dict } = idx
  const X = (v: number): number => (v + ox) / 100
  const Z = (v: number): number => (v + oy) / 100
  const H = (z: number): number => (z + zf) / 100
  const nx = (i: number): number => X(m.nodes[3 * i])
  const nz = (i: number): number => Z(m.nodes[3 * i + 1])
  const flat = (way: number): number[] => {
    const out: number[] = []
    for (const n of m.ways[way].nodes) out.push(nx(n), nz(n))
    return out
  }
  const zsOf = (way: number): number[] => m.ways[way].z ?? m.ways[way].nodes.map((n) => m.nodes[3 * n + 2])

  const t: TileData = {
    key: m.key, edges: [], buildings: [], fringe: [], areas: [], trees: [], pois: [], furniture: [], landmarks: [],
    rails: [], plantings: [], boats: [], bridges: [], courts: [],
  }

  m.ways.forEach((w, wi) => {
    if (w.role === 'street') {
      const zs = zsOf(wi)
      const f = w.flags ?? 0
      const e: PackedEdge = {
        id: w.id!, a: w.a!, b: w.b!, points: flat(wi), surface: w.surface!, width: w.width! / 100, walk: w.walk! / 100,
        foot: !!(f & SF.foot), kind: dict.kinds[w.kind!],
      }
      if (w.name !== undefined) e.name = dict.names[w.name]
      if (zs.some((z) => z !== 0)) e.heights = zs.map(H)
      if (w.service !== undefined) e.service = w.service
      if (f & SF.oneway) e.oneway = true
      if (w.layer !== undefined) e.layer = w.layer
      if (f & SF.bridge) e.bridge = true
      if (f & SF.tunnel) e.tunnel = true
      if (f & SF.passage) e.passage = true
      if (f & SF.ramp) e.ramp = true
      if (f & SF.bore) e.bore = true
      if (f & SF.cut) e.cut = true
      if (f & SF.authored) e.authored = true
      if (f & SF.crossing) e.crossing = true
      if (f & SF.park) e.park = true
      if (f & (SF.busRight | SF.busLeft)) e.busSide = (((f & SF.busRight) ? 1 : 0) | ((f & SF.busLeft) ? 2 : 0)) as 1 | 2 | 3
      if (f & (SF.paintTransit | SF.paintBike)) e.paint = ((f & SF.paintTransit) ? 1 : 0) | ((f & SF.paintBike) ? 2 : 0)
      t.edges.push(e)
    } else if (w.role === 'rail') {
      const zs = zsOf(wi)
      const f = w.flags ?? 0
      const r: PackedRail = { id: w.id!, points: flat(wi), kind: dict.kinds[w.kind!] as PackedRail['kind'] }
      if (f & RF.bridge) r.bridge = true
      if (w.layer !== undefined) r.layer = w.layer
      if (zs.some((z) => z !== 0)) r.heights = zs.map(H)
      if (f & RF.cable) r.cable = true
      if (f & RF.light) r.light = true
      t.rails.push(r)
    } else if (w.role === 'bridge') {
      const b: PackedBridge = { id: w.id!, ring: flat(wi) }
      if (w.name !== undefined) b.name = dict.names[w.name]
      t.bridges!.push(b)
    }
  })

  const roofFields = (r: Roof): Pick<PackedBuilding, 'roof' | 'roofHeight' | 'roofColour' | 'roofDirection'> => ({
    roof: r.shape as RoofShape, roofHeight: r.h / 100, roofColour: intToRgb(r.colour),
    ...(r.dir !== undefined ? { roofDirection: r.dir * CDEG_TO_RAD } : {}),
  })
  const packed = (b: Building | Part, id: number, partOf?: number): PackedBuilding => {
    const p: PackedBuilding = {
      id, ring: flat(b.way!), style: dict.styles[b.style!] as StyleId, ...roofFields(b.roof!),
    }
    if (b.levels !== undefined) p.levels = b.levels
    if (b.h !== undefined) p.height = b.h / 100
    if (b.minH !== undefined) p.minHeight = b.minH / 100
    if (partOf !== undefined) p.partOf = partOf
    if (b.stretch !== undefined) p.stretch = b.stretch
    if (b.noShops) p.noShops = true
    if (b.palette) p.palette = b.palette
    if (b.holes) p.holes = b.holes.map(flat)
    if (b.levelsInferred) p.levelsInferred = true
    if (b.archetype !== undefined) p.archetype = dict.archetypes[b.archetype]
    if (b.form) p.form = b.form
    // explicit Z: the foot the bake decided, so the renderer need not sample the ground for it
    if (b.z > 0) p.baseY = H(b.z)
    return p
  }
  for (const b of m.buildings) {
    if (b.kind === 'simple' || b.kind === 'kit' || b.kind === 'mesh' || b.kind === 'procedural') {
      // no v2 shape: these are drawn by the landmark path until the renderer reads v3 (MAP-FORMAT §12)
      console.warn(`map v3: ${b.kind} building ${b.ref} has no v2 form and is not drawn`)
      continue
    }
    if (b.lod === 'far') {
      const r = b.roof!
      t.fringe.push({
        ring: flat(b.way!), height: b.h! / 100, style: dict.styles[b.style!] as StyleId, id: b.seed,
        roof: r.shape, roofHeight: r.h / 100, roofColour: intToRgb(r.colour), ...(b.palette ? { palette: b.palette } : {}),
        ...(b.z > 0 ? { baseY: H(b.z) } : {}),
      })
      continue
    }
    if (b.way !== undefined) t.buildings.push(packed(b, b.seed))
    for (const p of b.parts ?? []) t.buildings.push(packed(p, p.seed, b.way === undefined ? b.seed : undefined))
  }

  for (const a of m.areas ?? []) {
    const r: TileArea = { kind: a.kind, ring: flat(a.way), of: a.of }
    if (a.holes) r.holes = a.holes.map(flat)
    if (a.top) r.top = true
    if (a.sea) r.sea = true
    if (a.brick) r.brick = true
    if (a.surface) r.surface = a.surface
    if (a.beds) r.beds = true
    if (a.level !== undefined) r.level = H(a.level)
    t.areas.push(r)
  }

  const it = m.items
  if (it) {
    for (let i = 0, k = 0; i < it.data.length; i += ITEM_STRIDE, k++) {
      const d = it.data
      const x = X(d[i])
      const z = Z(d[i + 1])
      const type = dict.items[d[i + 4]]
      if (type === 'tree.osm') { t.trees.push(x, z); continue }
      if (type === 'tree' || type.startsWith('tree.')) {
        const name = type === 'tree' ? '' : type.slice(5)
        let form = name === '' ? 0 : (TREE_FORMS as readonly string[]).indexOf(name)
        if (form < 0) form = /^f\d+$/.test(name) ? Number(name.slice(1)) : 0
        const park = (it.flags?.[k] ?? 0) & IF.park ? 1 : 0
        t.plantings.push(x, z, d[i + 5] / 100, r2(d[i + 3] * CDEG_TO_RAD), park + 2 * form)
        ;(t.plantingY ??= []).push(d[i + 2] > 0 ? H(d[i + 2]) : Number.NaN)
        continue
      }
      const f: PackedFurniture = type === 'fountain.wallace'
        ? { x, z, kind: 'fountain', wallace: true }
        : { x, z, kind: (FURNITURE_KIND.get(type) ?? type) as PackedFurniture['kind'] }
      if (d[i + 2] > 0) f.y = H(d[i + 2])
      t.furniture.push(f)
    }
  }

  for (const p of m.places ?? []) {
    if (p.tier === undefined) {
      t.pois.push({ x: X(p.x), z: Z(p.y), name: dict.names[p.name], kind: p.kind as PackedPoi['kind'] })
      continue
    }
    const [fx, fy, fnx, fny, flen] = p.plate!
    const l: PackedLandmark = {
      id: Number(p.building!.slice(1)), name: dict.names[p.name], kind: p.kind as PackedLandmark['kind'], tier: p.tier,
      x: X(p.x), z: Z(p.y), frontage: { x: X(fx), z: Z(fy), nx: fnx / 1e4, nz: fny / 1e4, len: flen / 100 },
    }
    if (p.totem) l.totem = { x: X(p.totem[0]), z: Z(p.totem[1]) }
    t.landmarks.push(l)
  }

  for (const b of m.boats ?? []) {
    const boat: PackedBoat = { id: b.id, ring: b.ring.map((v, i) => (i % 2 ? Z(v) : X(v))) }
    if (b.name !== undefined) boat.name = b.name
    t.boats!.push(boat)
  }
  for (const c of m.courts ?? []) {
    const court: PackedCourt = { sport: c.sport, x: X(c.x), z: Z(c.y), heading: c.heading, len: c.len / 100, wid: c.wid / 100 }
    if (c.half) court.half = true
    t.courts!.push(court)
  }
  if (m.terrain) {
    const g = m.terrain
    t.terrain = { step: g.step, cols: g.cols, dm: g.z.map((z) => (z + zf) / 10), ...(g.src ? { src: g.src } : {}), ...(g.resM ? { resM: g.resM } : {}) }
  }
  return t
}
