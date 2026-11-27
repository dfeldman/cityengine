import { describe, expect, it } from 'vitest'
import { rasterTile, GRASS_LAWN, GRASS_MANICURED, GRASS_MEADOW, GRASS_NONE } from '../src/render/grass-mask.ts'

describe('the grass mask (docs/GRASS-PLAN.md)', () => {
  const rect = { x0: 0, z0: 0, x1: 200, z1: 200 }
  const at = (m: Uint8Array, x: number, z: number): number => m[Math.floor(z) * 200 + Math.floor(x)]
  const park = { kind: 'park', ring: [10, 10, 190, 10, 190, 190, 10, 190], of: 0 }
  it('types each kind, in the painter’s order', () => {
    const lawn = { kind: 'grass', ring: [20, 20, 60, 20, 60, 60, 20, 60], of: 1 }
    const pitch = { kind: 'pitch', ring: [100, 100, 150, 100, 150, 140, 100, 140], of: 2 }
    const square = { kind: 'paved', ring: [30, 30, 40, 30, 40, 40, 30, 40], of: 3 }
    const m = rasterTile([pitch, lawn, park, square] as never, undefined, rect, { fullArea: () => 1000 })
    expect(at(m, 5, 5)).toBe(GRASS_NONE)
    expect(at(m, 80, 80)).toBe(GRASS_LAWN)
    expect(at(m, 50, 50)).toBe(GRASS_LAWN)
    expect(at(m, 120, 120)).toBe(GRASS_MANICURED)
    // a paved square ranks under the park and the lawn, so the lawn painted over it wins
    expect(at(m, 35, 35)).toBe(GRASS_LAWN)
  })
  it('holes and bare ground are not grass, a big polygon or a dry zone is meadow', () => {
    const holed = { ...park, holes: [[50, 50, 70, 50, 70, 70, 50, 70]] }
    const pond = { kind: 'water', ring: [120, 120, 140, 120, 140, 140, 120, 140], of: 4 }
    const m = rasterTile([holed, pond] as never, undefined, rect, { fullArea: () => 2000000, dry: (x) => x > 150 })
    expect(at(m, 60, 60)).toBe(GRASS_NONE)
    expect(at(m, 100, 30)).toBe(GRASS_MEADOW)
    const m2 = rasterTile([holed, pond] as never, undefined, rect, { fullArea: () => 1000, dry: (x) => x > 150 })
    expect(at(m2, 130, 130)).toBe(GRASS_NONE)
    expect(at(m2, 170, 30)).toBe(GRASS_MEADOW)
    expect(at(m2, 100, 30)).toBe(GRASS_LAWN)
  })
  it('a park the bake tagged big is meadow, the lawns mapped in it stay lawns', () => {
    const big = { ...park, meadow: true }
    const lawn = { kind: 'grass', ring: [20, 20, 60, 20, 60, 60, 20, 60], of: 1 }
    const m = rasterTile([big, lawn] as never, undefined, rect)
    expect(at(m, 100, 100)).toBe(GRASS_MEADOW)
    expect(at(m, 40, 40)).toBe(GRASS_LAWN)
  })
})
