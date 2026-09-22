import { describe, expect, it } from 'vitest'
import { applyRoundabout, Ids, type RideEdge } from '../src/city/ridegraph.ts'

const edge = (id: number, a: number, b: number, pts: [number, number][], name: string): RideEdge => ({
  id, a, b, points: pts.map(([x, z]) => ({ x, z })), length: 0, surface: 'asphalt', width: 6, walk: 2, name,
  foot: false, kind: 'residential', over: [{ id, reversed: false, length: 200 }],
})

describe('a tangled place replaced by a circle and spokes', () => {
  it('cuts the ways at the boundary, joins each with a spoke, and rings them', () => {
    // two streets crossing at the centre, plus a lane entirely inside the place
    const es = [
      edge(1, 1, 2, [[-200, 0], [200, 0]], 'East–West'),
      edge(2, 3, 4, [[0, -200], [0, 200]], 'North–South'),
      edge(3, 5, 6, [[-10, -10], [10, 10]], 'Lane'),
    ]
    const out = applyRoundabout(es, { name: 'Place', x: 0, z: 0, r: 30, R: 60 }, new Ids(), () => 0)
    const byName = (n: string) => out.filter((e) => e.name === n)
    expect(byName('Lane')).toHaveLength(0)
    // each street: two outside pieces, and a spoke from each cut
    expect(byName('East–West')).toHaveLength(4)
    expect(byName('North–South')).toHaveLength(4)
    expect(byName('Place')).toHaveLength(4)
    for (const e of byName('Place')) {
      for (const p of e.points) expect(Math.hypot(p.x, p.z)).toBeCloseTo(30, 0)
    }
    // the cut pieces end on the boundary, and every node is shared by at least two edges or is an outer end
    const cutEnd = byName('East–West').find((e) => e.a === 1)!
    expect(Math.hypot(cutEnd.points[cutEnd.points.length - 1].x, cutEnd.points[cutEnd.points.length - 1].z)).toBeCloseTo(60, 1)
    const uses = new Map<number, number>()
    for (const e of out) for (const n of [e.a, e.b]) uses.set(n, (uses.get(n) ?? 0) + 1)
    const outer = new Set([1, 2, 3, 4])
    for (const [n, k] of uses) if (!outer.has(n)) expect(k).toBeGreaterThanOrEqual(2)
  })
})

describe('which streets get a spoke (BUGS.md #2)', () => {
  const place = { name: 'Place', x: 0, z: 0, r: 30, R: 100 }
  const near = (e: RideEdge): number => Math.min(...e.points.map((p) => Math.hypot(p.x, p.z)))

  it('joins a street that ends at a real junction inside the boundary, short of the circle', () => {
    // the Faubourg Saint-Antoine case: its line stops 80 m out, at a junction of the place's outer lanes
    const es = [
      edge(1, 1, 10, [[200, 0], [80, 0]], 'Faubourg'),
      edge(2, 10, 11, [[80, 0], [70, 20]], 'Lane'),
      edge(3, 10, 12, [[80, 0], [70, -20]], 'Lane'),
    ]
    const out = applyRoundabout(es, place, new Ids(), () => 0)
    const faubourg = out.filter((e) => e.name === 'Faubourg')
    // the piece outside, and a spoke from the boundary in to the circle
    expect(faubourg).toHaveLength(2)
    expect(Math.min(...faubourg.map(near))).toBeCloseTo(30, 0)
  })

  it('does not spoke a mere name change inside the boundary (it ran through a block)', () => {
    // Rue Jean Beausire becoming Rue de la Bastille, 90 m out: degree 2, not part of the place
    const es = [
      edge(1, 1, 10, [[200, 0], [90, 0]], 'Beausire'),
      edge(2, 10, 2, [[90, 0], [90, 200]], 'Bastille'),
      edge(3, 3, 4, [[-200, -10], [200, -10]], 'Through'),
    ]
    const out = applyRoundabout(es, place, new Ids(), () => 0)
    for (const e of out.filter((q) => q.name === 'Beausire' || q.name === 'Bastille')) expect(near(e)).toBeGreaterThan(60)
  })

  it('treats a cycle track named for its street as the street, but not one named for the place', () => {
    const es = [
      { ...edge(1, 1, 2, [[-200, 0], [200, 0]], 'Boulevard'), kind: 'cycleway' },
      { ...edge(2, 3, 4, [[0, -200], [0, 200]], 'Place'), kind: 'cycleway' },
    ]
    const out = applyRoundabout(es, place, new Ids(), () => 0)
    expect(out.filter((e) => e.name === 'Boulevard' && near(e) < 35).length).toBe(2)
  })
})
