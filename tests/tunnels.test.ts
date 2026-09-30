/**
 * Street tunnels a rider can go through (tools/tunnels.ts): a straight profile mouth to mouth, only under a hill,
 * only for street classes, and the pavements inside with it.
 */
import { describe, expect, it } from 'vitest'
import { boreTunnels, type TunnelEdge } from '../tools/tunnels.ts'

// a hill 30 m high over x = 0..300, the streets outside at 0 (west) and 10 (east)
const hill = (x: number): number => (x <= 0 ? 0 : x >= 300 ? 10 : 30 * Math.sin((Math.PI * x) / 300) + (10 * x) / 300)
const ground = (x: number): number => hill(x)

function town(kind = 'tertiary'): TunnelEdge[] {
  return [
    { id: 1, a: 10, b: 1, points: [-100, 0, 0, 0], heights: [0, 0], kind: 'tertiary' },
    { id: 2, a: 1, b: 2, points: [0, 0, 150, 0], heights: [0, 30], tunnel: true, layer: -1, kind },
    // the second piece runs the other way round, east mouth first
    { id: 3, a: 3, b: 2, points: [300, 0, 150, 0], heights: [10, 30], tunnel: true, layer: -1, kind },
    { id: 4, a: 3, b: 11, points: [300, 0, 400, 0], heights: [10, 10], kind: 'tertiary' },
    // its pavement, 4 m to the side
    { id: 5, a: 20, b: 21, points: [0, 4, 300, 4], heights: [0, 0], tunnel: true, layer: -1, foot: true, kind: 'footway' },
  ]
}

describe('street tunnels', () => {
  it('runs a hill tunnel straight from mouth to mouth, at the streets outside', () => {
    const es = town()
    const ids = boreTunnels(es, ground)
    expect([...ids].sort()).toEqual([2, 3, 5])
    expect(es[1].heights![0]).toBeCloseTo(0)      // west mouth
    expect(es[1].heights![1]).toBeCloseTo(5)      // halfway: between 0 and 10
    expect(es[2].heights![0]).toBeCloseTo(10)     // east mouth, the reversed piece
    expect(es[2].heights![1]).toBeCloseTo(5)
    expect(es[1].bore && es[2].bore).toBe(true)
    // the pavement goes with it
    expect(es[4].heights![0]).toBeCloseTo(0)
    expect(es[4].heights![1]).toBeCloseTo(10)
    // the streets outside are untouched
    expect(es[0].heights).toEqual([0, 0])
    // …but marked as in a cut, both of them: what is drawn along them follows them, not the ground
    expect(es[0].cut && es[3].cut).toBe(true)
  })

  it('puts a mouth well under a street that crosses right over it, and slopes the street in down to it', () => {
    const es = town()
    // a street crossing over the west mouth 5 m in, at 3 m — the data's mouth (0) is only 3 m under it
    es.push({ id: 9, a: 30, b: 31, points: [5, -50, 5, 50], heights: [3, 3], kind: 'secondary' })
    boreTunnels(es, ground)
    expect(es[1].heights![0]).toBeCloseTo(3 - 6.5)       // the mouth: 6.5 m under the street over it
    // the street leading in (100 m long) comes down to it over its last 60 m, and is untouched further out
    expect(es[0].heights![1]).toBeCloseTo(3 - 6.5)
    expect(es[0].heights![0]).toBeCloseTo(0)
  })

  it('leaves an underpass alone: the straight line would come out of the ground', () => {
    const es = town()
    boreTunnels(es, () => 0)   // flat: no hill to go under
    expect(es[1].bore).toBeUndefined()
    expect(es[1].heights).toEqual([0, 30])
  })

  it('never makes a bore of a motorway or a service road', () => {
    for (const kind of ['motorway', 'trunk', 'service']) {
      const es = town(kind)
      expect(boreTunnels(es, ground).size).toBe(0)
    }
  })
})

describe('a street in a cut (city/grade.ts)', () => {
  it('reports its level only where the nearest corridor is a cut', async () => {
    const { StreetGrade } = await import('../src/city/grade.ts')
    const g = new StreetGrade()
    g.add({ id: 1, points: [0, 0, 100, 0], heights: [-5, -5], width: 8, walk: 2, foot: false, cut: true })
    g.add({ id: 2, points: [0, 50, 100, 50], heights: [3, 3], width: 8, walk: 2, foot: false })
    expect(g.cutAt(50, 1)).toBeCloseTo(-5)
    expect(g.at(50, 1)).toBeCloseTo(-5)
    expect(g.cutAt(50, 49)).toBeNull()        // an ordinary street: the ground rule stands
    expect(g.at(50, 49)).toBeCloseTo(3)
  })
})

