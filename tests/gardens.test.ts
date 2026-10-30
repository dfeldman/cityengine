/**
 * The gardens: a plan is data somebody traced, so what it cannot catch by eye is caught here. Every plan lands inside the city, its
 * rings are rings, and the bake makes a package part out of it (tools/gardens/index.ts).
 */
import { describe, expect, it } from 'vitest'
import { bakeGardens, rowPoints } from '../tools/gardens/index.ts'
import { GARDENS } from '../tools/gardens/paris.ts'

const local = (q: { lat: number; lon: number }): { x: number; z: number } => ({ x: (q.lon - 2.332) * 73270, z: (q.lat - 48.8605) * 111320 })

describe('the traced gardens', () => {
  it('have distinct names and stand in the Paris box', () => {
    expect(new Set(GARDENS.map((g) => g.name)).size).toBe(GARDENS.length)
    for (const g of GARDENS) {
      for (const [lat, lon] of g.ring) {
        expect(lat, g.name).toBeGreaterThan(48.78)
        expect(lat, g.name).toBeLessThan(48.95)
        expect(lon, g.name).toBeGreaterThan(2.19)
        expect(lon, g.name).toBeLessThan(2.48)
      }
    }
  })

  it('say where the scatter stops, and draw something', () => {
    for (const g of GARDENS) {
      expect(g.ring.length, g.name).toBeGreaterThanOrEqual(3)
      const parts = (g.gravel?.length ?? 0) + (g.lawn?.length ?? 0) + (g.beds?.length ?? 0) + (g.hedges?.length ?? 0) + (g.pleached?.length ?? 0) + (g.rows?.length ?? 0) + (g.topiary?.length ?? 0)
      expect(parts, g.name).toBeGreaterThan(0)
    }
  })

  it('bake: OSM\'s parts and the plans together', () => {
    const ways: { id: number; tags: Record<string, string>; geometry: { lat: number; lon: number }[] }[] = [
      { id: 1, tags: { barrier: 'hedge' }, geometry: [{ lat: 48.86, lon: 2.33 }, { lat: 48.8601, lon: 2.33 }] },
      { id: 2, tags: { natural: 'tree_row' }, geometry: [{ lat: 48.86, lon: 2.33 }, { lat: 48.8605, lon: 2.33 }] },
      { id: 3, tags: { landuse: 'flowerbed' }, geometry: [{ lat: 48.86, lon: 2.33 }, { lat: 48.8601, lon: 2.33 }, { lat: 48.8601, lon: 2.3301 }, { lat: 48.86, lon: 2.33 }] },
    ]
    const g = bakeGardens(ways, local)
    expect(g.counts).toMatchObject({ hedges: 1, beds: 1, rows: 1, plans: GARDENS.length })
    expect(g.garden.formal.length).toBe(GARDENS.length)
  })

  it('space a row of trees evenly along its line', () => {
    const pts = rowPoints({ points: [{ x: 0, z: 0 }, { x: 40, z: 0 }], spacing: 8 })
    expect(pts.map((p) => p.x)).toEqual([4, 12, 20, 28, 36])
  })
})
