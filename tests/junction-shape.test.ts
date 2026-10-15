import { describe, expect, it } from 'vitest'
import { approachShape, straightenJunctions, type ShapedEdge } from '../src/city/junction-shape.ts'

const len = (p: { x: number; z: number }[]): number => p.slice(1).reduce((s, q, i) => s + Math.hypot(q.x - p[i].x, q.z - p[i].z), 0)
const edge = (id: number, a: number, b: number, points: { x: number; z: number }[], name = 'Street'): ShapedEdge =>
  ({ id, a, b, points, length: len(points), name, foot: false, heights: points.map(() => 10) })

/*
 * Two straight streets crossing at the origin, as OSM often has them (owner, 2026-10-14: "zigzaggy, not meeting
 * perpendicularly"): the junction node 1.2 m off the true crossing, and a jitter vertex 4 m out on two approaches.
 */
const J = { x: 1.2, z: -0.8 }
const crossing = (): ShapedEdge[] => [
  edge(1, 0, 1, [J, { x: 4, z: 1.5 }, { x: 10, z: 0 }, { x: 60, z: 0 }], 'East-West'),
  edge(2, 0, 2, [J, { x: -10, z: 0 }, { x: -60, z: 0 }], 'East-West'),
  edge(3, 0, 3, [J, { x: -1.5, z: 4 }, { x: 0, z: 10 }, { x: 0, z: 60 }], 'North-South'),
  edge(4, 0, 4, [J, { x: 0, z: -10 }, { x: 0, z: -60 }], 'North-South'),
]
const nowhere = (): number => 0

describe('straightenJunctions', () => {
  it('moves a crossing to where its streets cross, and runs every approach straight into it', () => {
    const { edges, count } = straightenJunctions(crossing(), nowhere)
    expect(count.junctions).toBe(1)
    expect(count.moved).toBe(1)
    for (const e of edges) {
      expect(Math.hypot(e.points[0].x, e.points[0].z)).toBeLessThan(0.05)
      const s = approachShape(e, 0)!
      expect(s.stray).toBeLessThan(0.05)
      expect(s.bend).toBeLessThan(1)
      expect(e.heights!.length).toBe(e.points.length)
    }
  })

  it('straightens without moving the junction when the move would take the rider further off the asphalt', () => {
    // any path that does not start at the junction as it was is "off the asphalt"
    const { edges, count } = straightenJunctions(crossing(), (pts) => (pts[0].x === J.x && pts[0].z === J.z ? 0 : 3))
    expect(count.moved).toBe(0)
    expect(count.approaches).toBeGreaterThan(0)
    for (const e of edges) expect(e.points[0]).toEqual(J)
    expect(approachShape(edges[0], 0)!.stray).toBeLessThan(0.05)
  })

  it('does not move a junction one of whose streets genuinely turns there, and keeps that turn', () => {
    const es = crossing()
    // the north approach turns a corner 8 m out: a real bend, not jitter
    es[2] = edge(3, 0, 3, [J, { x: J.x, z: 8 }, { x: 50, z: 10 }], 'North-South')
    const { edges } = straightenJunctions(es, nowhere)
    expect(edges[2].points[0]).toEqual(J)
    expect(edges[2].points).toContainEqual({ x: J.x, z: 8 })
  })
})
