/**
 * The ride graph's rules, each on a hand-built graph small enough to draw on a napkin.
 */
import { describe, expect, it } from 'vitest'
import { buildGraph, lengthOf, type Edge } from '../src/city/graph.ts'
import type { Point } from '../src/city/geo.ts'
import {
  Ids, classify, collapseClusters, contract, dropSidePaths, locate, mapEdgeAt, mergeParallel, pruneStubs, rideExits,
  rideGraph,
  reverseEdge,
  type RideEdge,
} from '../src/city/ridegraph.ts'

let nextId = 1
function edge(a: number, b: number, pts: [number, number][], more: Partial<Edge> = {}): Edge {
  const points: Point[] = pts.map(([x, z]) => ({ x, z }))
  return { id: nextId++, a, b, points, length: lengthOf(points), surface: 'asphalt', width: 7, walk: 1.8,
    foot: false, kind: 'residential', ...more }
}
const ride = (es: Edge[]): RideEdge[] => classify(es, 'run')
const DEG = Math.PI / 180

describe('classify', () => {
  const road = edge(1, 2, [[0, 0], [0, 100]])
  const foot = edge(2, 3, [[0, 100], [0, 200]], { kind: 'footway', foot: true })
  const aisle = edge(2, 4, [[0, 100], [50, 100]], { kind: 'service', service: 'parking_aisle' })
  const tunnel = edge(2, 5, [[0, 100], [-50, 100]], { tunnel: true })
  const steps = edge(2, 6, [[0, 100], [30, 130]], { kind: 'steps', foot: true })

  it('drops a footway on a bike and keeps it on foot', () => {
    expect(classify([road, foot], 'bike').map((e) => e.id)).toEqual([road.id])
    expect(classify([road, foot], 'run').map((e) => e.id)).toEqual([road.id, foot.id])
  })
  it('drops parking aisles, tunnels and steps', () => {
    expect(classify([road, aisle, tunnel, steps], 'run').map((e) => e.id)).toEqual([road.id])
  })
  it('counts an edge with no kind as a street', () => {
    const { kind: _, ...bare } = edge(7, 8, [[0, 0], [10, 0]])
    expect(classify([bare as Edge], 'bike')).toHaveLength(1)
  })
})

describe('collapseClusters', () => {
  it('turns a dual-carriageway crossroads into one node with four exits', () => {
    // four nodes on an 8 m square, four stubs round it, and two arms leaving each corner
    const sq: Record<number, [number, number]> = { 1: [-4, -4], 2: [4, -4], 3: [4, 4], 4: [-4, 4] }
    const stub = (a: number, b: number): Edge => edge(a, b, [sq[a], sq[b]])
    const arm = (n: number, to: number, x: number, z: number): Edge => edge(n, to, [sq[n], [x, z]])
    const es = ride([
      stub(1, 2), stub(2, 3), stub(3, 4), stub(4, 1),
      arm(1, 11, -4, -100), arm(2, 12, 4, -100),   // south, two carriageways
      arm(2, 13, 100, -4), arm(3, 14, 100, 4),      // east
      arm(3, 15, 4, 100), arm(4, 16, -4, 100),      // north
      arm(4, 17, -100, 4), arm(1, 18, -100, -4),    // west
    ])
    const out = collapseClusters(es, new Ids())
    expect(out).toHaveLength(8)
    const centre = new Set(out.flatMap((e) => [e.a, e.b]).filter((n) => n < 0))
    expect(centre.size).toBe(1)
    // and after the parallel carriageways merge, the rider sees four ways out, not eight
    const g = buildGraph(mergeParallel(out.map((e) => ({ ...e, name: `Arm ${Math.round(Math.atan2(e.points[1].x, e.points[1].z) / (Math.PI / 2))}` })), new Ids()))
    const hub = [...g.nodes.values()].sort((p, q) => q.edges.length - p.edges.length)[0]
    const xs = rideExits(g, hub.id, hub.edges[0])
    expect(xs.length).toBe(3)   // four arms, arriving on one of them
  })

  it('never merges across layers', () => {
    const es = ride([
      edge(1, 2, [[0, 0], [8, 0]], { layer: 1 }),
      edge(1, 3, [[0, 0], [0, 100]], { layer: 1 }), edge(1, 4, [[0, 0], [0, -100]]),
      edge(2, 5, [[8, 0], [8, 100]], { layer: 1 }), edge(2, 6, [[8, 0], [8, -100]], { layer: 1 }),
    ])
    expect(collapseClusters(es, new Ids())).toHaveLength(5)
  })
})

describe('contract', () => {
  it('joins two same-name edges into one, and keeps heights parallel to points', () => {
    const es = ride([
      edge(1, 2, [[0, 0], [0, 50]], { name: 'Rue X', heights: [0, 1] }),
      edge(3, 2, [[0, 120], [0, 50]], { name: 'Rue X', heights: [3, 1] }),   // stored the other way round
    ])
    const out = contract(es, new Ids())
    expect(out).toHaveLength(1)
    expect(out[0].points).toHaveLength(3)
    expect(out[0].heights).toEqual([0, 1, 3])
    expect(out[0].length).toBeCloseTo(120)
    expect(out[0].over.map((o) => o.reversed)).toEqual([false, true])
  })

  it('does not join two differently named edges', () => {
    const es = ride([
      edge(1, 2, [[0, 0], [0, 50]], { name: 'Rue X' }),
      edge(2, 3, [[0, 50], [0, 120]], { name: 'Rue Y' }),
    ])
    expect(contract(es, new Ids())).toHaveLength(2)
  })

  it('finds the map edge under the rider through a reversed, contracted pair', () => {
    const m1 = edge(1, 2, [[0, 0], [0, 50]], { name: 'Rue X' })
    const m2 = edge(3, 2, [[0, 120], [0, 50]], { name: 'Rue X' })
    const map = buildGraph([m1, m2])
    const g = rideGraph([m1, m2], 'bike')
    const only = [...g.edges.values()][0]
    // 10 m along m2 from ITS a end is 110 m from the start of the joined edge, or 10 m from its far end
    const p = locate(g, map, m2.id, 10)!
    expect(p.edgeId).toBe(only.id)
    const fromA = only.a === 1 ? 110 : 10
    expect(p.s).toBeCloseTo(fromA, 1)
    expect(mapEdgeAt(only, p.s)).toBe(m2.id)
    expect(mapEdgeAt(only, only.a === 1 ? 20 : 100)).toBe(m1.id)
    // and a reversed edge reverses cleanly back
    expect(reverseEdge(reverseEdge(only)).over).toEqual(only.over)
  })
})

describe('mergeParallel', () => {
  it('makes a boulevard drawn twice, 12 m apart, one edge down its middle', () => {
    const es = ride([
      edge(1, 2, [[0, 0], [100, 0]], { name: 'Boulevard X', oneway: true }),
      edge(4, 3, [[100, 12], [0, 12]], { name: 'Boulevard X', oneway: true }),
    ])
    const out = mergeParallel(es, new Ids())
    expect(out).toHaveLength(1)
    for (const p of out[0].points) expect(Math.abs(p.z - 6)).toBeLessThan(0.5)
    expect(out[0].over.map((o) => o.id).sort()).toEqual(es.map((e) => e.id).sort())
  })

  it('leaves two different streets alone', () => {
    const es = ride([
      edge(1, 2, [[0, 0], [100, 0]], { name: 'Rue A' }),
      edge(3, 4, [[0, 12], [100, 12]], { name: 'Rue B' }),
    ])
    expect(mergeParallel(es, new Ids())).toHaveLength(2)
  })
})

describe('rideExits', () => {
  it('never offers two exits within 20° of each other', () => {
    const inbound = edge(0, 1, [[0, -100], [0, 0]], { name: 'In' })
    const g = buildGraph(ride([
      inbound,
      edge(1, 2, [[0, 0], [0, 100]], { name: 'On' }),
      edge(1, 3, [[0, 0], [15, 100]]),               // 8.5° off the straight, unnamed: the same choice
      edge(1, 4, [[0, 0], [100, 0]], { name: 'Right' }),
    ]))
    const xs = rideExits(g, 1, inbound.id)
    expect(xs.map((x) => g.edges.get(x.edgeId)!.name)).toEqual(['On', 'Right'])
  })

  it('does not offer a 170° exit when a straight exists, but does when nothing else does', () => {
    const back = (id0: number): Edge => edge(1, id0, [[0, 0], [17, -100]])
    const inbound = edge(0, 1, [[0, -100], [0, 0]])
    const g = buildGraph(ride([inbound, edge(1, 2, [[0, 0], [0, 100]]), back(3)]))
    const xs = rideExits(g, 1, inbound.id)
    expect(xs).toHaveLength(1)
    expect(Math.abs(xs[0].angle)).toBeLessThan(10 * DEG)
    const only = buildGraph(ride([edge(0, 1, [[0, -100], [0, 0]]), back(3)]))
    expect(rideExits(only, 1, only.nodes.get(1)!.edges.find((id) => only.edges.get(id)!.a === 0)!)).toHaveLength(1)
  })
})

describe('pruneStubs', () => {
  it('drops an unnamed driveway that leads nowhere, and keeps a named cul-de-sac', () => {
    const es = ride([
      edge(1, 2, [[0, 0], [0, 100]], { name: 'Main' }),
      edge(2, 3, [[0, 100], [0, 200]], { name: 'Main' }),
      edge(2, 4, [[0, 100], [30, 100]], { kind: 'service' }),
      edge(4, 5, [[30, 100], [30, 120]], { kind: 'service' }),
      edge(2, 6, [[0, 100], [-40, 100]], { kind: 'service', name: 'Golden Court' }),
    ])
    expect(pruneStubs(es).map((e) => e.name ?? '?').sort()).toEqual(['Golden Court', 'Main', 'Main'])
  })
})

describe('dropSidePaths', () => {
  it('drops a pedestrian way running beside the road of the same name, and keeps a pedestrian street', () => {
    const es = ride([
      edge(1, 2, [[0, 0], [100, 0]], { name: 'Rue Saint-Antoine', kind: 'secondary' }),
      edge(3, 4, [[0, 9], [100, 9]], { name: 'Rue Saint-Antoine', kind: 'pedestrian', foot: true }),
      edge(5, 6, [[0, 60], [100, 60]], { name: 'Rue des Rosiers', kind: 'pedestrian', foot: true }),
    ])
    expect(dropSidePaths(es).map((e) => e.name)).toEqual(['Rue Saint-Antoine', 'Rue des Rosiers'])
  })
})
