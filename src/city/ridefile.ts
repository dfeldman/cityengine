/**
 * The ride graph, built at BAKE time and shipped beside the tiles (PARIS_EXPAND.md §3): the rider must be
 * able to plan a turn 400 m away and the navigator walks it continuously, so it is global — but it is small
 * next to the map, and building it at load meant holding every map edge of the city at once.
 *
 * `rideFor` is the ONE way it is built, with the city's hand overrides (city/overrides.ts), used by the bake
 * and by the game for a city baked before this — so the two cannot drift. `packRide`/`unpackRide` are the file.
 */
import { buildGraph, lengthOf, type Edge } from './graph.ts'
import { Projection } from './geo.ts'
import { RIDE_OVERRIDES } from './overrides.ts'
import { region as regionOf } from './region.ts'
import { rideGraph, type RideEdge, type RideGraph, type RideMode } from './ridegraph.ts'
import { isRaised, onSurface, unpackPoints, type CityPackage, type PackedEdge } from './package.ts'

/** The map edges as the graph wants them, bridges and ramps marked `raised` the way the renderer marks them. */
export function mapEdges(edges: PackedEdge[], terrain: { heightAt(x: number, z: number): number }): Edge[] {
  return edges.map((e) => {
    const points = unpackPoints(e.points)
    return {
      id: e.id, a: e.a, b: e.b, points, length: lengthOf(points), surface: e.surface, width: e.width, walk: e.walk,
      name: e.name, foot: e.foot, crossing: e.crossing, heights: e.heights, kind: e.kind, service: e.service, oneway: e.oneway,
      layer: e.layer, bridge: e.bridge, tunnel: e.tunnel, passage: e.passage, ...(e.bore ? { bore: true } : {}),
      ...(e.ridden ? { ridden: true } : {}), ...(e.authored ? { authored: true } : {}), ...(e.trail ? { trail: true } : {}),
      // a street tunnel (`bore`) is off the ground too: what drives and walks in it follows its own heights
      ...((onSurface(e) && isRaised(e, terrain)) || e.bore ? { raised: true } : {}),
    }
  })
}

export function rideFor(city: string, origin: CityPackage['origin'], edges: Edge[], mode: RideMode,
  heightAt: (x: number, z: number) => number, region?: string, buildings?: number[][]): RideGraph {
  const proj = new Projection(origin)
  return rideGraph(edges, mode, {
    roundabouts: ((RIDE_OVERRIDES[city] ?? (region ? RIDE_OVERRIDES[region] : undefined))?.roundabouts ?? []).map((r) => {
      const p = proj.toLocal({ lat: r.lat, lon: r.lon })
      return { name: r.name, r: r.r, R: r.R, x: p.x, z: p.z }
    }),
    heightAt,
    buildings,
    keep: (regionOf(region ?? city).ferryIslands ?? []).map((k) => ({ ...proj.toLocal({ lat: k.lat, lon: k.lon }), r: k.radius })),
  })
}

/** One ride edge on disk: its points flat, `over` as [id, reversed 0/1, length] triples. */
export type PackedRideEdge = Omit<RideEdge, 'points' | 'length' | 'over'> & { points: number[]; over: number[] }
export interface RideFile { mode: RideMode; edges: PackedRideEdge[] }

const r2 = (v: number): number => Math.round(v * 100) / 100

export function packRide(g: RideGraph, mode: RideMode): RideFile {
  const edges: PackedRideEdge[] = []
  for (const e of g.edges.values()) {
    const { points, length: _l, over, ...rest } = e
    void _l
    const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) as typeof rest
    edges.push({
      ...clean, points: points.flatMap((p) => [r2(p.x), r2(p.z)]),
      ...(e.heights ? { heights: e.heights.map(r2) } : {}),
      over: over.flatMap((o) => [o.id, o.reversed ? 1 : 0, r2(o.length)]),
    })
  }
  return { mode, edges }
}

export function unpackRide(f: RideFile): RideGraph {
  const es: RideEdge[] = f.edges.map((e) => {
    const points = unpackPoints(e.points)
    const over = []
    for (let i = 0; i + 2 < e.over.length; i += 3) over.push({ id: e.over[i], reversed: e.over[i + 1] === 1, length: e.over[i + 2] })
    return { ...e, points, length: lengthOf(points), over }
  })
  return buildGraph(es) as RideGraph
}
