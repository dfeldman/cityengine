/**
 * The gardens: a plan is data somebody traced, so what it cannot catch by eye is caught here. Every plan lands inside the city, its
 * rings are rings, and the bake makes a package part out of it (tools/gardens/index.ts).
 */
import { describe, expect, it } from 'vitest'
import { bakeGardens, cutLine, rowPoints } from '../tools/gardens/index.ts'
import { unpackPoints } from '../src/city/package.ts'
import type { GardenPlan } from '../tools/gardens/plan.ts'
import { GARDENS } from '../tools/gardens/paris.ts'
import { bboxOf, city } from '../tools/cities.ts'

/** the Paris box, which grows with the detail regions (docs/VERSAILLES.md) */
const BOX = bboxOf(city('paris-centre'))

const local = (q: { lat: number; lon: number }): { x: number; z: number } => ({ x: (q.lon - 2.332) * 73270, z: (q.lat - 48.8605) * 111320 })

describe('the traced gardens', () => {
  it('have distinct names and stand in the Paris box', () => {
    expect(new Set(GARDENS.map((g) => g.name)).size).toBe(GARDENS.length)
    for (const g of GARDENS) {
      for (const [lat, lon] of g.ring) {
        expect(lat, g.name).toBeGreaterThan(BOX.south)
        expect(lat, g.name).toBeLessThan(BOX.north)
        expect(lon, g.name).toBeGreaterThan(BOX.west)
        expect(lon, g.name).toBeLessThan(BOX.east)
      }
    }
  })

  it('say where the scatter stops, and draw something', () => {
    for (const g of GARDENS) {
      expect(g.ring.length, g.name).toBeGreaterThanOrEqual(3)
      const parts = (g.gravel?.length ?? 0) + (g.lawn?.length ?? 0) + (g.beds?.length ?? 0) + (g.hedges?.length ?? 0) + (g.pleached?.length ?? 0) + (g.rows?.length ?? 0) + (g.topiary?.length ?? 0)
      // (a ring alone is a plan too: it clears the scatter for what a model lays on the grass, as at Auteuil)
      if (!g.ringOnly) expect(parts, g.name).toBeGreaterThan(0)
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

  it('cut a line where it is blocked, keeping the runs', () => {
    const runs = cutLine([{ x: 0, z: 0 }, { x: 20, z: 0 }], (p) => p.x > 8 && p.x < 12)
    expect(runs.length).toBe(2)
    expect(runs[0][runs[0].length - 1].x).toBeLessThanOrEqual(8)
    expect(runs[1][0].x).toBeGreaterThanOrEqual(12)
  })

  it('cut a hedge where a way crosses it, and wall a plan\'s paths without walling them shut', () => {
    // a hedge 40 m east-west, a footway 2 m wide crossing it north-south at x = 0
    const L = (x: number, z: number): { lat: number; lon: number } => ({ lat: 48.8605 + z / 111320, lon: 2.332 + x / 73270 })
    const hedge = { id: 1, tags: { barrier: 'hedge' }, geometry: [L(-20, 0), L(20, 0)] }
    const path = { points: [{ x: 0, z: -30 }, { x: 0, z: 30 }], half: 1, kind: 'footway' }
    const cross = { points: [{ x: -30, z: 10 }, { x: 30, z: 10 }], half: 1, kind: 'footway' }
    const g = bakeGardens([hedge], local, { ways: [path], open: [] }, [])
    expect(g.garden.hedges.length).toBe(2)
    for (const h of g.garden.hedges) for (const p of unpackPoints(h.points)) expect(Math.abs(p.x)).toBeGreaterThan(1.3)
    // a plan walling its paths: walls either side of both, each cut where the other path crosses it
    const ll = (x: number, z: number): [number, number] => { const q = L(x, z); return [q.lat, q.lon] }
    const plan: GardenPlan = { name: 'test', ring: [ll(-25, -25), ll(25, -25), ll(25, 25), ll(-25, 25)], pathWalls: { h: 3, w: 1 } }
    const w = bakeGardens([], local, { ways: [path, cross], open: [] }, [plan])
    // two walls a path, each cut once by the other path: 8 runs
    expect(w.garden.hedges.length).toBe(8)
    for (const h of w.garden.hedges) for (const p of unpackPoints(h.points)) {
      expect(Math.abs(p.x) > 1.3 || Math.abs(p.z - 10) > 1.3).toBe(true)
    }
  })
})
