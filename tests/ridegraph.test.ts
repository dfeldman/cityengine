/**
 * The ride graph's rules, each on a hand-built graph small enough to draw on a napkin.
 */
import { describe, expect, it } from 'vitest'
import { buildGraph, lengthOf, type Edge } from '../src/city/graph.ts'
import type { Point } from '../src/city/geo.ts'
import {
  Ids, againstFreeway, classify, collapseClusters, contract, dropSidePaths, locate, mapEdgeAt, mergeParallel, pruneFreewayTraps,
  pruneStubs, rideExits,
  rideGraph,
  reverseEdge, straightCorridor,
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
  it('drops parking aisles and tunnels; steps only on foot', () => {
    expect(classify([road, aisle, tunnel, steps], 'bike').map((e) => e.id)).toEqual([road.id])
    expect(classify([road, aisle, tunnel, steps], 'run').map((e) => e.id)).toEqual([road.id, steps.id])
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
    // one each way: the road down the middle is ridden both ways
    expect(out[0].oneway).toBe(false)
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

describe('freeways', () => {
  // a one-way freeway from 1 to 2 to 3; an exit at 2 down to a street (2 → 4 → 5); beyond 3 it runs off the map
  const fw = (a: number, b: number, pts: [number, number][]): Edge => edge(a, b, pts, { kind: 'motorway', oneway: true, name: 'Freeway', ridden: true })
  const on = edge(0, 1, [[-100, 0], [0, 0]], { name: 'Approach' })
  const f1 = fw(1, 2, [[0, 0], [0, 500]])
  const f2 = fw(2, 3, [[0, 500], [0, 3000]])
  const exit = edge(2, 4, [[0, 500], [60, 560]], { kind: 'motorway_link', oneway: true, ridden: true })
  const street = edge(4, 5, [[60, 560], [200, 560]], { name: 'Island Road' })

  it('rides no freeway the region has not chosen, and every street, trunk roads included', () => {
    const plain = edge(50, 51, [[0, 0], [0, 300]], { kind: 'motorway', oneway: true })
    const link = edge(51, 52, [[0, 300], [50, 350]], { kind: 'motorway_link', oneway: true })
    const trunk = edge(52, 53, [[50, 350], [50, 600]], { kind: 'trunk', name: 'Van Ness Avenue' })
    expect(classify([plain, link, trunk], 'bike').map((e) => e.id)).toEqual([trunk.id])
    expect(classify([{ ...plain, ridden: true }], 'bike')).toHaveLength(1)
  })
  it('prunes a one-way freeway that leads nowhere back to its last exit', () => {
    const kept = pruneFreewayTraps(ride([on, f1, f2, exit, street])).map((e) => e.id)
    expect(kept).toEqual([on.id, f1.id, exit.id, street.id])
  })
  it('prunes one nobody can get onto, up to the first ramp that joins it', () => {
    // the other carriageway: from off the map (13) to 12, where a ramp from the street joins, and on to 11
    const g2 = fw(13, 12, [[10, 3000], [10, 500]])
    const g1 = fw(12, 11, [[10, 500], [10, 0]])
    const ramp = edge(14, 12, [[70, 560], [10, 500]], { kind: 'motorway_link', oneway: true, ridden: true })
    const from = edge(15, 14, [[200, 570], [70, 560]], { name: 'Island Road' })
    const off = edge(11, 16, [[10, 0], [-100, 10]], { name: 'Approach' })
    expect(pruneFreewayTraps(ride([g2, g1, ramp, from, off])).map((e) => e.id)).toEqual([g1.id, ramp.id, from.id, off.id])
  })
  it('knows the wrong way up a freeway, through a reversal, and lets a street be ridden either way', () => {
    const [r] = ride([f1])
    expect(againstFreeway(r, 1)).toBe(false)
    expect(againstFreeway(r, 2)).toBe(true)
    const back = reverseEdge(r)
    expect(againstFreeway(back, 1)).toBe(false)
    expect(againstFreeway(back, 2)).toBe(true)
    const [oneWayStreet] = ride([edge(20, 21, [[0, 0], [0, 100]], { oneway: true })])
    expect(againstFreeway(oneWayStreet, 21)).toBe(false)
  })
  it('does not offer the wrong way up a freeway as an exit', () => {
    // at 2, arriving up the exit's street end is not possible; at 3 of a through freeway, arriving from a side street
    const side = edge(30, 2, [[-80, 500], [0, 500]], { name: 'Side Street' })
    const g = buildGraph(ride([f1, f2, side, exit]))
    const offered = rideExits(g, 2, side.id).map((x) => x.edgeId)
    expect(offered).toContain(f2.id)
    expect(offered).not.toContain(f1.id)
  })
  it('does not merge two carriageways one over the other into one road', () => {
    const lower = edge(40, 41, [[0, 0], [0, 1000]], { kind: 'motorway', oneway: true, name: 'Bridge', heights: [20, 20], ridden: true })
    const upper = edge(42, 43, [[4, 1000], [4, 0]], { kind: 'motorway', oneway: true, name: 'Bridge', heights: [29.5, 29.5], ridden: true })
    expect(mergeParallel(ride([lower, upper]))).toHaveLength(2)
  })
})

describe('straightCorridor', () => {
  // a divided street (carriageways 16 m apart) from z 0 to 400, entered from the south by both carriageways, and
  // crossed at z 200 by a street whose two arms end on different carriageways, with a link between them
  const es = () => ride([
    edge(1, 10, [[0, -100], [-8, 0]], { name: 'Main' }), edge(1, 20, [[0, -100], [8, 0]], { name: 'Main' }),
    edge(10, 11, [[-8, 0], [-8, 200]], { name: 'Main' }), edge(11, 12, [[-8, 200], [-8, 400]], { name: 'Main' }),
    edge(20, 21, [[8, 0], [8, 200]], { name: 'Main' }), edge(21, 22, [[8, 200], [8, 400]], { name: 'Main' }),
    edge(11, 21, [[-8, 200], [8, 200]]),
    edge(30, 11, [[-100, 200], [-8, 200]], { name: 'Cross' }), edge(21, 31, [[8, 200], [100, 200]], { name: 'Cross' }),
  ])
  const out = straightCorridor(es(), { street: 'Main', from: { x: 0, z: 0 }, to: { x: 0, z: 400 } }, new Ids(), () => 0)
  const g = buildGraph(out)

  it('rides the street as one path down its middle', () => {
    const main = out.filter((e) => e.name === 'Main' && e.points.every((p) => p.z >= 0))
    expect(main).toHaveLength(2)
    for (const e of main) for (const p of e.points) expect(Math.abs(p.x)).toBeLessThan(0.5)
    expect(main.every((e) => !e.oneway && e.lane === 7)).toBe(true)
    // the link between the carriageways is gone
    expect(out.some((e) => !e.name)).toBe(false)
  })

  it('meets a cross street at one node, straight over', () => {
    const arms = out.filter((e) => e.name === 'Cross')
    const node = (e: RideEdge): number => (e.points[0].x === 0 ? e.a : e.b)
    expect(node(arms[0])).toBe(node(arms[1]))
    expect(g.nodes.get(node(arms[0]))!.edges).toHaveLength(4)
  })

  it('keeps one of two ways into the corridor from the same node', () => {
    expect(out.filter((e) => e.a === 1 || e.b === 1)).toHaveLength(1)
  })
})
