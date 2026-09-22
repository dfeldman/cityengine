import { describe, expect, it } from 'vitest'
import { GAP_NODE_BASE, joinNearMisses, type GapWay } from '../tools/gaps.ts'

// a local frame where 1e-5 degrees = 1 m, near enough for a test
const toLocal = (g: { lat: number; lon: number }) => ({ x: g.lon * 1e5, z: g.lat * 1e5 })
const way = (id: number, nodes: number[], pts: [number, number][], tags: Record<string, string> = { highway: 'footway' }): GapWay =>
  ({ id, nodes, geometry: pts.map(([x, z]) => ({ lat: z / 1e5, lon: x / 1e5 })), tags })

describe('joining the paths that nearly meet', () => {
  it('joins a path that stops 3 m short of a street, on a new node inserted into the street', () => {
    const street = way(1, [1, 2], [[0, 0], [100, 0]], { highway: 'residential' })
    const path = way(2, [3, 4], [[50, 30], [50, 3]])
    expect(joinNearMisses([street, path], toLocal)).toBe(1)
    expect(street.nodes).toHaveLength(3)
    const joint = street.nodes[1]
    // positive and far above OSM's ids: the ride graph owns the negative ones
    expect(joint).toBeGreaterThanOrEqual(GAP_NODE_BASE)
    expect(path.nodes[path.nodes.length - 1]).toBe(joint)
    expect(toLocal(street.geometry[1]).x).toBeCloseTo(50)
  })

  it('snaps to an existing node when one is within 2 m', () => {
    const street = way(1, [1, 2, 3], [[0, 0], [49, 0], [100, 0]], { highway: 'residential' })
    const path = way(2, [4, 5], [[50, 30], [50, 2.5]])
    joinNearMisses([street, path], toLocal)
    expect(street.nodes).toEqual([1, 2, 3])
    expect(path.nodes[path.nodes.length - 1]).toBe(2)
  })

  it('leaves real dead ends, ends already joined, and a path under a bridge alone', () => {
    const street = way(1, [1, 2], [[0, 0], [100, 0]], { highway: 'residential' })
    const far = way(2, [3, 4], [[50, 30], [50, 9]])
    const joinedAlready = way(3, [2, 5], [[100, 0], [100, 20]])
    const bridge = way(4, [6, 7], [[0, 40], [100, 40]], { highway: 'residential', bridge: 'yes', layer: '1' })
    const under = way(5, [8, 9], [[30, 80], [30, 42]])
    expect(joinNearMisses([street, far, joinedAlready, bridge, under], toLocal)).toBe(0)
  })
})
