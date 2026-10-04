import { describe, expect, it } from 'vitest'
import { plantTile } from '../src/render/plants.ts'

describe('the parks’ planting (PARIS_EXPAND §6 item 8)', () => {
  const park = { kind: 'park' as const, ring: [0, 0, 100, 0, 100, 80, 0, 80], of: 0 }
  const rect = { x0: -50, z0: -50, x1: 150, z1: 150 }
  it('plants shrubs along the edges and a few flower beds inside, the same every time', () => {
    const a = plantTile([park as never], rect)
    const b = plantTile([park as never], rect)
    expect(a).toEqual(b)
    expect(a.filter((p) => p.kind === 'shrub').length).toBeGreaterThan(20)
    for (const p of a) expect(p.x >= 0 && p.x <= 100 && p.z >= 0 && p.z <= 80).toBe(true)
  })
  it('plants nothing outside parks, but along the lawns inside one', () => {
    expect(plantTile([{ ...park, kind: 'grass' } as never], rect).length).toBe(0)
    const lawn = { kind: 'grass' as const, ring: [20, 20, 60, 20, 60, 50, 20, 50], of: 1 }
    expect(plantTile([park as never, lawn as never], rect).length).toBeGreaterThan(plantTile([park as never], rect).length)
  })
  it('a park of planted BEDS is shrubs all through, but never on its mapped lawns (the Tunnel Tops)', () => {
    const lawn = { kind: 'grass' as const, ring: [20, 20, 60, 20, 60, 50, 20, 50], of: 1 }
    const beds = plantTile([{ ...park, beds: true } as never, lawn as never], rect)
    const plain = plantTile([park as never, lawn as never], rect)
    expect(beds.filter((p) => p.kind === 'shrub').length).toBeGreaterThan(3 * plain.filter((p) => p.kind === 'shrub').length)
    const inLawn = (p: { x: number; z: number }): boolean => p.x > 20.5 && p.x < 59.5 && p.z > 20.5 && p.z < 49.5
    expect(beds.filter(inLawn).length).toBe(0)
    // and right across the middle of the beds, not only along their edges
    expect(beds.filter((p) => p.x > 70 && p.x < 90 && p.z > 30 && p.z < 50).length).toBeGreaterThan(5)
  })
})
