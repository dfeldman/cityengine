/**
 * Rides the real baked city, not a toy crossroads.
 *
 * The toy tests pin what a turn MEANS; this one pins that riding through thousands of them does not break.
 * The bug it exists to catch is the one that made turning feel wrong in play and looked fine in every
 * screenshot: the rider's position jumping across the map at a junction, because `s` was being mirrored on
 * edges travelled against their stored direction. A still frame cannot show it. A continuity check can.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildGraph, type Edge } from '../src/city/graph.ts'
import { locate, rideExits, rideGraph, rideStats } from '../src/city/ridegraph.ts'
import { Navigator, polylineLength } from '../src/sim/navigate.ts'
import { unpackPoints, type CityPackage } from '../src/city/package.ts'

function load(id: string) {
  const file = resolve(import.meta.dirname, '..', 'public', 'cities', `${id}.json`)
  const pkg = JSON.parse(readFileSync(file, 'utf8')) as CityPackage
  const edges: Edge[] = pkg.edges.map((e) => {
    const points = unpackPoints(e.points)
    return {
      id: e.id, a: e.a, b: e.b, points, length: polylineLength(points),
      surface: e.surface, width: e.width, walk: e.walk, name: e.name, foot: e.foot,
      kind: e.kind, service: e.service, layer: e.layer, bridge: e.bridge, tunnel: e.tunnel,
    }
  })
  // the rider is steered through the ride graph, exactly as the game does it; the map graph finds the start
  const map = buildGraph(edges)
  return { pkg, map, graph: rideGraph(edges, 'bike') }
}

describe('riding Le Marais', () => {
  const { pkg, map, graph } = load('paris-marais')
  // the package names its start by MAP edge; this is where that is on the ride graph
  const at = locate(graph, map, pkg.start.edgeId, pkg.start.s)!
  const start = { edgeId: at.edgeId, s: at.s, reversed: false }

  it('has a connected network with a start on it', () => {
    expect(graph.edges.has(locate(graph, map, pkg.start.edgeId, 0)!.edgeId)).toBe(true)
  })

  it('asks the rider a question at real junctions only', () => {
    const st = rideStats(graph)
    expect(st.perKm, 'decisions per road-km').toBeLessThanOrEqual(8)
    expect(st.medianSpacing, 'median metres between decisions').toBeGreaterThanOrEqual(60)
    expect(st.nearDuplicates).toBe(0)
  })

  it('turns round on the spot, and rides back the way it came', () => {
    const n = new Navigator(graph, { ...start }, rideExits)
    n.advance(20, 5)
    const here = n.at()
    const edge = n.position.edgeId
    const h = n.heading()
    n.turnAround()
    // same place, same street, facing the other way
    expect(n.position.edgeId).toBe(edge)
    expect(Math.hypot(n.at().x - here.x, n.at().z - here.z)).toBeLessThan(1e-6)
    // the change in heading, wrapped to [-π, π), should be a half turn
    const turned = ((n.heading() - h + 3 * Math.PI) % (2 * Math.PI)) - Math.PI
    expect(Math.abs(Math.abs(turned) - Math.PI)).toBeLessThan(0.05)
    // the side of the road does not jump: straight after, the rider is where they were
    const rp = n.ridePoint()
    n.advance(0, 0)
    expect(Math.hypot(n.ridePoint().x - rp.x, n.ridePoint().z - rp.z)).toBeLessThan(1e-6)
    // and riding on takes them back past where they turned
    n.advance(15, 5)
    expect(Math.hypot(n.at().x - here.x, n.at().z - here.z)).toBeGreaterThan(10)
  })

  // Twelve kilometres, not two: on the ride graph a junction is a real one, every 70 m or so rather than
  // every 11 (and a left-straight-right rider doubles back over some), so it takes this far to cross the
  // hundred-plus the test has always demanded.
  it('never teleports the rider, over twelve kilometres and hundreds of junctions', () => {
    const n = new Navigator(graph, { ...start }, rideExits)
    const turns = ['left', 'straight', 'right', 'straight'] as const
    let previous = n.at()
    let junctions = 0
    let worst = 0

    for (let step = 0; step < 24000; step++) {
      // a rider who keeps choosing: this is the case the toy tests do not cover
      n.request(turns[step % turns.length])
      const move = 0.5
      junctions += n.advance(move, 8).length
      const now = n.at()
      const jump = Math.hypot(now.x - previous.x, now.z - previous.z)
      worst = Math.max(worst, jump)
      previous = now
    }

    expect(junctions, 'the ride should cross plenty of junctions').toBeGreaterThan(100)
    // half a metre of travel may not move the rider more than half a metre, give or take rounding
    expect(worst, `worst position jump was ${worst.toFixed(1)} m`).toBeLessThan(1.0)
  })

  it('keeps the rider on the street they are supposed to be on', () => {
    const n = new Navigator(graph, { ...start }, rideExits)
    for (let step = 0; step < 2000; step++) {
      n.request(step % 3 === 0 ? 'left' : 'straight')
      n.advance(0.5, 8)
      const e = n.edge
      const at = n.at()
      // the rider's position must lie on the polyline of the edge they are on
      let nearest = Infinity
      for (let i = 1; i < e.points.length; i++) {
        const p = e.points[i - 1]
        const q = e.points[i]
        const dx = q.x - p.x
        const dz = q.z - p.z
        const len2 = dx * dx + dz * dz
        const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((at.x - p.x) * dx + (at.z - p.z) * dz) / len2))
        nearest = Math.min(nearest, Math.hypot(at.x - (p.x + dx * t), at.z - (p.z + dz * t)))
      }
      expect(nearest).toBeLessThan(0.05)
    }
  })

  it('turns when it is asked to, in a real street pattern', () => {
    const n = new Navigator(graph, { ...start }, rideExits)
    const streets = new Set<number>()
    for (let step = 0; step < 3000; step++) {
      n.request('left')
      n.advance(0.5, 6)
      streets.add(n.position.edgeId)
    }
    // a rider turning left at every opportunity goes round blocks; they should still see many streets
    expect(streets.size).toBeGreaterThan(3)
  })
})
