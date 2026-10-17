import { describe, it, expect } from 'vitest'
import { Carriageways } from '../src/city/carriageways.ts'

// two one-way carriageways 10 m apart, each 9 m wide with 3 m pavements: OSM's divided streets (Drumm, Geary)
const edge = (id: number, x: number) => ({ id, a: id * 10, b: id * 10 + 1, points: [x, -100, x, 100], width: 9, walk: 3, foot: false, kind: 'tertiary', surface: 'asphalt' as const })

describe('Carriageways.whyNoFurniture', () => {
  const two = new Carriageways([edge(1, 0), edge(2, 10)] as never)
  it('finds the median between two parallel carriageways', () => {
    expect(two.whyNoFurniture(5, 0)).toBe('median')
  })
  it('allows the outer pavements', () => {
    expect(two.whyNoFurniture(-5.5, 0)).toBe(null)
    expect(two.whyNoFurniture(15.5, 0)).toBe(null)
  })
  it('the road is the road', () => {
    expect(two.whyNoFurniture(1, 0)).toBe('road')
  })
  it("a single street's pavements are allowed", () => {
    const one = new Carriageways([edge(1, 0)] as never)
    expect(one.whyNoFurniture(5, 0)).toBe(null)
    expect(one.whyNoFurniture(-5, 0)).toBe(null)
  })
})
