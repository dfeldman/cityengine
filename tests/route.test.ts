import { describe, expect, it } from 'vitest'
import { buildGraph, type Edge } from '../src/city/graph.ts'
import { planRoute, TURN_ROUND_COST } from '../src/sim/route.ts'

// a 3 × 3 grid of nodes 100 m apart: node id = 10 * row + col, x = col * 100, z = row * 100
const nodes = (r: number, c: number): { id: number; x: number; z: number } => ({ id: 10 * r + c, x: c * 100, z: r * 100 })
let eid = 1
const edges: Edge[] = []
const add = (a: { id: number; x: number; z: number }, b: { id: number; x: number; z: number }): void => {
  edges.push({ id: eid++, a: a.id, b: b.id, points: [{ x: a.x, z: a.z }, { x: b.x, z: b.z }], length: 100, surface: 'asphalt', width: 6, walk: 2 } as unknown as Edge)
}
for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
  if (c < 2) add(nodes(r, c), nodes(r, c + 1))
  if (r < 2) add(nodes(r, c), nodes(r + 1, c))
}
const g = buildGraph(edges)
const edgeBetween = (a: number, b: number): Edge => [...g.edges.values()].find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))!

describe('the GPS route (PARIS_EXPAND §6 item 11)', () => {
  it('goes the short way round the grid and says which edge to leave each junction by', () => {
    // on the edge 0→1, 50 m along, heading to 1; destination: node 22 (200, 200)
    const e01 = edgeBetween(0, 1)
    const r = planRoute(g, { edgeId: e01.id, s: 50, reversed: false }, { x: 200, z: 200 })!
    expect(r).not.toBeNull()
    expect(r.turnRound).toBe(false)
    // 50 m to node 1, then three 100 m edges to (200, 200)
    expect(r.length).toBeCloseTo(350, 3)
    expect(r.nodes[0]).toBe(1)
    const first = g.edges.get(r.leave.get(1)!)!
    expect([first.a, first.b]).toContain(1)
    expect(r.line.length).toBeGreaterThan(3)
  })
  it('turns round when the destination is just behind', () => {
    const e01 = edgeBetween(0, 1)
    // heading towards 1 at s = 90; the destination is node 0's side, 10 m back along the same edge is ahead-of-behind
    const r = planRoute(g, { edgeId: e01.id, s: 90, reversed: false }, { x: 0, z: 100 })!
    // going on: 10 + 100 (1→11) + 100 (11→10) = 210; turning round: 90 + 100 (0→10) + 250 = 440
    expect(r.turnRound).toBe(false)
    expect(r.length).toBeCloseTo(210, 3)
    const r2 = planRoute(g, { edgeId: e01.id, s: 90, reversed: false }, { x: 50, z: 0 })!
    // the target 40 m behind on the same edge: round the block is 10 + 300 + 50 = 360, turning round 40 + 250
    expect(r2.turnRound).toBe(true)
    expect(r2.length).toBeCloseTo(40 + TURN_ROUND_COST, 3)
    // 80 m behind, round the block (10 + 300 + 10 = 320) beats turning round (330)
    const r3 = planRoute(g, { edgeId: e01.id, s: 90, reversed: false }, { x: 10, z: 0 })!
    expect(r3.turnRound).toBe(false)
    expect(r3.length).toBeCloseTo(320, 3)
  })
  it('reaches a point on the rider’s own edge ahead with no junction', () => {
    const e01 = edgeBetween(0, 1)
    const r = planRoute(g, { edgeId: e01.id, s: 10, reversed: false }, { x: 70, z: 0 })!
    expect(r.nodes.length).toBe(0)
    expect(r.length).toBeCloseTo(60, 3)
  })
})
