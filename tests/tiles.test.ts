import { describe, expect, it } from 'vitest'
import { TILE, joinTiles, splitPackage, tilesOfLine } from '../src/city/tiles.ts'
import type { CityPackage } from '../src/city/package.ts'

const pkg = (over: Partial<CityPackage>): CityPackage => ({
  id: 't', name: 't', origin: { lat: 0, lon: 0 }, radius: 500, ground: 'grass', start: { edgeId: 1, s: 0 },
  edges: [], buildings: [], areas: [], trees: [], rails: [], pois: [], attribution: [], baked: '', ...over,
})

describe('tiles (PARIS_EXPAND §8)', () => {
  it('files a long straight line in every tile it crosses, not just its end tiles', () => {
    // corner to corner across three tiles diagonally: the middle one has no vertex in it
    const got = tilesOfLine([10, 10, 3 * TILE - 10, 3 * TILE - 10])
    for (const k of ['0,0', '1,1', '2,2']) expect(got.has(k)).toBe(true)
  })

  it('keeps edges whole in each tile and joins them back without duplicates', () => {
    const e = { id: 7, a: 1, b: 2, points: [-50, 10, 250, 10], surface: 'asphalt' as const, width: 6, walk: 2, foot: false, kind: 'residential' }
    const { index, tiles } = splitPackage(pkg({ edges: [e] }), () => 0)
    expect([...tiles.keys()].sort()).toEqual(['-1,0', '0,0', '1,0'])
    for (const t of tiles.values()) expect(t.edges[0].points).toEqual(e.points)
    expect(joinTiles(index, tiles.values()).edges).toHaveLength(1)
  })

  it('puts a building in the tile of its centre only', () => {
    const b = { id: 3, ring: [190, 10, 230, 10, 230, 50, 190, 50], style: 'haussmann' as const, roof: 'flat' as const, roofHeight: 0, roofColour: [0, 0, 0] as [number, number, number] }
    const { tiles } = splitPackage(pkg({ buildings: [b] }), () => 0)
    expect([...tiles.keys()]).toEqual(['1,0'])
  })

  it('clips an area into pieces that keep the whole body\'s water level', () => {
    const a = { kind: 'water' as const, ring: [-100, 20, 300, 20, 300, 60, -100, 60] }
    const { tiles } = splitPackage(pkg({ areas: [a] }), () => -3.5)
    const pieces = [...tiles.values()].flatMap((t) => t.areas)
    expect(pieces).toHaveLength(3)
    for (const p of pieces) {
      expect(p.level).toBe(-3.5)
      expect(p.of).toBe(0)
      for (let i = 0; i < p.ring.length; i += 2) expect(p.ring[i]).toBeGreaterThanOrEqual(-100)
    }
  })
})
