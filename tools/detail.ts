/**
 * Where the city is modelled: the detail box and the DETAIL REGIONS beyond it (tools/cities.ts `regions`,
 * docs/VERSAILLES.md). One membership test, and the filter that cuts a region's fetch down to the region.
 *
 * Distances are flat metres about the point asked (an equirectangular frame per test): a region is a few kilometres
 * across, where that is good to a few centimetres.
 */
import { detailBboxOf, type CitySpec, type DetailRegion } from './cities.ts'
import type { Bbox, OsmRelation, OsmWay, OverpassResult } from './overpass.ts'
import type { DetailOutline } from '../src/city/package.ts'

const M_LAT = 111_320
const mLon = (lat: number): number => 111_320 * Math.cos((lat * Math.PI) / 180)
/** a segment longer than this is sampled at this pitch, so a straight track through a corridor with no node inside it still counts */
const SAMPLE_M = 20

type LL = [number, number]

export const regionsOf = (spec: Pick<CitySpec, 'regions'>): DetailRegion[] => spec.regions ?? []

/** metres from (lat, lon) to segment a–b */
function segDist(lat: number, lon: number, a: LL, b: LL): number {
  const k = mLon(lat)
  const ax = (a[1] - lon) * k, ay = (a[0] - lat) * M_LAT
  const bx = (b[1] - lon) * k, by = (b[0] - lat) * M_LAT
  const dx = bx - ax, dy = by - ay
  const L = dx * dx + dy * dy
  const t = L > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L)) : 0
  return Math.hypot(ax + t * dx, ay + t * dy)
}

function insideRing(ring: LL[], lat: number, lon: number): boolean {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ai, oi] = ring[i], [aj, oj] = ring[j]
    if ((ai > lat) !== (aj > lat) && lon < ((oj - oi) * (lat - ai)) / (aj - ai) + oi) c = !c
  }
  return c
}

/** metres from the point to the region's edge beyond its margin: 0 inside it */
export function regionDistance(r: DetailRegion, lat: number, lon: number): number {
  let best = Infinity
  for (const ring of r.rings ?? []) {
    if (insideRing(ring, lat, lon)) return 0
    for (let i = 0; i < ring.length; i++) best = Math.min(best, segDist(lat, lon, ring[(i + ring.length - 1) % ring.length], ring[i]))
  }
  const line = r.line ?? []
  for (let i = 1; i < line.length; i++) best = Math.min(best, segDist(lat, lon, line[i - 1], line[i]))
  if (line.length === 1) best = Math.min(best, segDist(lat, lon, line[0], line[0]))
  return Math.max(0, best - r.margin)
}

export const inRegion = (r: DetailRegion, lat: number, lon: number, pad = 0): boolean => regionDistance(r, lat, lon) <= pad

/** the region's lat/lon rectangle, its margin and `pad` metres bigger all round */
export function regionBbox(r: DetailRegion, pad = 0): Bbox {
  const pts = [...(r.rings ?? []).flat(), ...(r.line ?? [])]
  if (pts.length === 0) throw new Error(`detail region "${r.name}" has neither rings nor a line`)
  let south = Infinity, north = -Infinity, west = Infinity, east = -Infinity
  for (const [la, lo] of pts) { south = Math.min(south, la); north = Math.max(north, la); west = Math.min(west, lo); east = Math.max(east, lo) }
  const m = r.margin + pad
  const k = mLon((south + north) / 2)
  return { south: south - m / M_LAT, north: north + m / M_LAT, west: west - m / k, east: east + m / k }
}

const inBbox = (b: Bbox, lat: number, lon: number): boolean => lat >= b.south && lat <= b.north && lon >= b.west && lon <= b.east

/** inside the detail box (padded by `pad` metres) or any region (within `pad` of it) */
export function detailTest(spec: CitySpec): (lat: number, lon: number, pad?: number) => boolean {
  const regs = regionsOf(spec)
  const boxes = regs.map((r) => regionBbox(r))
  return (lat, lon, pad = 0) => {
    if (inBbox(detailBboxOf(spec, pad), lat, lon)) return true
    for (let i = 0; i < regs.length; i++) {
      const b = boxes[i]
      const k = pad / M_LAT, kl = pad / mLon(lat)
      if (lat < b.south - k || lat > b.north + k || lon < b.west - kl || lon > b.east + kl) continue
      if (inRegion(regs[i], lat, lon, pad)) return true
    }
    return false
  }
}

/** does the polyline come within the region? (each long segment sampled at SAMPLE_M, so one with no node inside still counts) */
function lineTouches(r: DetailRegion, pts: { lat: number; lon: number }[]): boolean {
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    if (inRegion(r, p.lat, p.lon)) return true
    if (i === 0) continue
    const q = pts[i - 1]
    const len = Math.hypot((p.lon - q.lon) * mLon(p.lat), (p.lat - q.lat) * M_LAT)
    const n = Math.floor(len / SAMPLE_M)
    for (let s = 1; s < n; s++) {
      const t = s / n
      if (inRegion(r, q.lat + (p.lat - q.lat) * t, q.lon + (p.lon - q.lon) * t)) return true
    }
  }
  return false
}

const isBuilding = (w: OsmWay): boolean => w.tags.building !== undefined || w.tags['building:part'] !== undefined

/** a building by its centroid (the mean of its corners: what the fringe and the tiles file it by too) */
function centroidIn(r: DetailRegion, g: { lat: number; lon: number }[]): boolean {
  const ring = g.length > 1 && g[0].lat === g[g.length - 1].lat && g[0].lon === g[g.length - 1].lon ? g.slice(0, -1) : g
  let la = 0, lo = 0
  for (const p of ring) { la += p.lat; lo += p.lon }
  return inRegion(r, la / ring.length, lo / ring.length)
}

/**
 * A region's fetch cut down to the region. Overpass answers by 1.2 km grid cell and returns ways whole, so the raw
 * answer for a 240 m corridor is a few square kilometres of suburb. Kept: a building whose centroid is inside, any
 * other way that comes within the region (whole — a street is not cut at the edge), a node inside, a relation with a
 * member that comes within it.
 */
export function filterToRegion(res: OverpassResult, r: DetailRegion): OverpassResult {
  const ways = res.ways.filter((w) => w.geometry && w.geometry.length > 0
    && (isBuilding(w) ? centroidIn(r, w.geometry) : lineTouches(r, w.geometry)))
  const nodes = res.nodes.filter((n) => inRegion(r, n.lat, n.lon))
  const relations = res.relations.filter((rel: OsmRelation) => rel.members.some((m) => m.geometry && m.geometry.length > 0 && lineTouches(r, m.geometry)))
  return { ...res, ways, nodes, relations }
}

/** merge OSM answers by id, the first seen winning */
export function mergeResults(parts: OverpassResult[]): OverpassResult {
  const ways = new Map<number, OsmWay>(), nodes = new Map<number, OverpassResult['nodes'][number]>(), rels = new Map<number, OsmRelation>()
  let copyright = '', timestamp = ''
  for (const p of parts) {
    for (const w of p.ways) if (!ways.has(w.id)) ways.set(w.id, w)
    for (const n of p.nodes) if (!nodes.has(n.id)) nodes.set(n.id, n)
    for (const x of p.relations) if (!rels.has(x.id)) rels.set(x.id, x)
    copyright ||= p.copyright
    if (p.timestamp > timestamp) timestamp = p.timestamp
  }
  return { ways: [...ways.values()], nodes: [...nodes.values()], relations: [...rels.values()], copyright, timestamp }
}

/** the area modelled, km² (the detail box and each region, rings by shoelace plus margin × perimeter, a line as a strip) */
export function detailKm2(spec: CitySpec): number {
  const d = detailBboxOf(spec)
  const k0 = mLon((d.south + d.north) / 2)
  let m2 = (d.north - d.south) * M_LAT * (d.east - d.west) * k0
  for (const r of regionsOf(spec)) {
    for (const ring of r.rings ?? []) {
      const k = mLon(ring[0][0])
      let a = 0, per = 0
      for (let i = 0; i < ring.length; i++) {
        const p = ring[i], q = ring[(i + 1) % ring.length]
        a += (p[1] * k) * (q[0] * M_LAT) - (q[1] * k) * (p[0] * M_LAT)
        per += Math.hypot((q[1] - p[1]) * k, (q[0] - p[0]) * M_LAT)
      }
      m2 += Math.abs(a) / 2 + per * r.margin
    }
    const line = r.line ?? []
    for (let i = 1; i < line.length; i++) {
      m2 += Math.hypot((line[i][1] - line[i - 1][1]) * mLon(line[i][0]), (line[i][0] - line[i - 1][0]) * M_LAT) * 2 * r.margin
    }
  }
  return m2 / 1e6
}

/** what the package carries for the map: each region's rings or line in local metres, flat [x, z, x, z, …] */
export type { DetailOutline }

export function detailOutlines(spec: CitySpec, toLocal: (p: { lat: number; lon: number }) => { x: number; z: number }): DetailOutline[] {
  const regs = regionsOf(spec)
  if (regs.length === 0) return []
  const flat = (pts: LL[]): number[] => pts.flatMap(([lat, lon]) => { const p = toLocal({ lat, lon }); return [Math.round(p.x), Math.round(p.z)] })
  const d = detailBboxOf(spec)
  // the detail box first, as a ring, so the map shows all of what is modelled
  const box: LL[] = [[d.south, d.west], [d.south, d.east], [d.north, d.east], [d.north, d.west]]
  return [
    { name: spec.name, margin: 0, rings: [flat(box)] },
    ...regs.map((r) => ({ name: r.name, margin: r.margin, ...(r.rings ? { rings: r.rings.map(flat) } : {}), ...(r.line ? { line: flat(r.line) } : {}) })),
  ]
}
