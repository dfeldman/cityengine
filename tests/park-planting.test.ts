import { describe, expect, it } from 'vitest'
import { GREEN, TILE_TREES, plantParks, treesPerTile, type ParkRule, type ParkSpot } from '../src/city/park-planting.ts'
import { formCode } from '../src/city/tree-forms.ts'
import type { PackedArea, PackedEdge } from '../src/city/package.ts'

/** a 400 × 400 m square of park with its south-west corner at the origin */
const square = (kind: PackedArea['kind'], x0: number, z0: number, s: number): PackedArea =>
  ({ kind, ring: [x0, z0, x0 + s, z0, x0 + s, z0 + s, x0, z0 + s] })

const forest: ParkSpot = { density: 0.0078, clump: 0, species: [{ form: 'cypress', weight: 1, h: [12, 20] }] }
const lawn: ParkSpot = { density: 0.0004, clump: 0, species: [{ form: 'evergreen', weight: 1, h: [8, 12] }] }
const rule: ParkRule = (_x, _z, kind) => (kind === 'grass' ? lawn : forest)

const path = (pts: number[]): PackedEdge => ({
  id: 1, points: pts, width: 3, walk: 0, foot: true, kind: 'footway',
} as unknown as PackedEdge)
const road = (pts: number[]): PackedEdge => ({
  id: 2, points: pts, width: 12, walk: 2, foot: false, kind: 'residential',
} as unknown as PackedEdge)

describe('what grows inside a park (city/park-planting.ts)', () => {
  it('fills a wood at something like the density it was asked for, and the same every bake', () => {
    const pkg = { areas: [square('wood', 0, 0, 400)], edges: [] }
    const a = plantParks(pkg, rule)
    const b = plantParks(pkg, rule)
    expect(a).toEqual(b)
    // 400 × 400 m at the densest the pass allows is about 1 250 trees, under the ceiling of four tiles
    expect(a.length).toBeGreaterThan(900)
    expect(a.length).toBeLessThanOrEqual(4 * TILE_TREES)
    for (const p of a) {
      expect(p.x).toBeGreaterThan(0)
      expect(p.x).toBeLessThan(400)
      expect(p.park).toBe(true)
      expect(p.form).toBe(formCode('cypress'))
      expect(p.height).toBeGreaterThanOrEqual(12)
      expect(p.height).toBeLessThanOrEqual(20)
    }
  })

  it('never puts more than the tile ceiling in one tile', () => {
    const got = plantParks({ areas: [square('wood', 0, 0, 1200)], edges: [] }, rule)
    for (const n of treesPerTile(got).values()) expect(n).toBeLessThanOrEqual(TILE_TREES)
  })

  it('leaves a lawn drawn inside a park as a lawn: the smallest polygon owns the ground', () => {
    const park = square('park', 0, 0, 400)
    const meadow = square('grass', 100, 100, 200)
    const got = plantParks({ areas: [park, meadow], edges: [] }, rule)
    const inMeadow = got.filter((p) => p.x > 110 && p.x < 290 && p.z > 110 && p.z < 290)
    expect(inMeadow.length).toBeGreaterThan(0)
    // the meadow is planted at the lawn's rate and with the lawn's species, not the forest's
    for (const p of inMeadow) expect(p.form).toBe(formCode('evergreen'))
    expect(inMeadow.length / (180 * 180)).toBeLessThan(0.002)
  })

  it('plants nothing on a path or a road, and thins towards them', () => {
    const pkg = { areas: [square('wood', 0, 0, 400)], edges: [path([0, 200, 400, 200]), road([200, 0, 200, 400])] }
    const got = plantParks(pkg, rule)
    // the footpath is 3 m wide; nothing within its half-width and the clearance beyond it
    for (const p of got) {
      expect(Math.abs(p.z - 200)).toBeGreaterThan(3.5)
      expect(Math.abs(p.x - 200)).toBeGreaterThan(7.5)
    }
  })

  it('plants nothing in water, on a ball field or on paving drawn inside the park', () => {
    const pkg = {
      areas: [square('park', 0, 0, 400), square('water', 50, 50, 100), square('pitch', 250, 50, 80),
        { ...square('paved', 50, 250, 80), top: true }],
      edges: [],
    }
    for (const p of plantParks(pkg, rule)) {
      expect(p.x > 50 && p.x < 150 && p.z > 50 && p.z < 150).toBe(false)
      expect(p.x > 250 && p.x < 330 && p.z > 50 && p.z < 130).toBe(false)
      expect(p.x > 50 && p.x < 130 && p.z > 250 && p.z < 330).toBe(false)
    }
  })

  it('leaves clearings and makes thickets when asked to clump', () => {
    const clumpy: ParkRule = () => ({ ...forest, clump: 0.85 })
    const got = plantParks({ areas: [square('wood', 0, 0, 800)], edges: [] }, clumpy)
    const cells = new Map<string, number>()
    for (const p of got) {
      const k = `${Math.floor(p.x / 40)},${Math.floor(p.z / 40)}`
      cells.set(k, (cells.get(k) ?? 0) + 1)
    }
    // 20 × 20 forty-metre cells; a clumped wood leaves a good few of them empty and crowds others
    expect(400 - cells.size).toBeGreaterThan(20)
    expect(Math.max(...cells.values())).toBeGreaterThan(2 * (got.length / 400))
  })

  it('knows which area kinds are green', () => {
    expect([...GREEN].sort()).toEqual(['grass', 'park', 'wood'])
  })
})
