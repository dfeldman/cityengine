import { describe, expect, it } from 'vitest'
import { waterLevels } from '../src/city/package.ts'
import type { PackedArea } from '../src/city/package.ts'

const square = (x: number, half: number): PackedArea => ({ kind: 'water', ring: [x - half, -half, x + half, -half, x + half, half, x - half, half] })

describe('the drop is a river\'s, not a fountain\'s (the Place André-Malraux, 2026-10-30)', () => {
  it('lays a river its full drop under its lowest bank, and a basin just under its kerb', () => {
    const [river, basin] = waterLevels([square(0, 200), square(1000, 6)], () => 10, 2.5)
    expect(river).toBeCloseTo(7.5)
    expect(basin).toBeCloseTo(9.7)
  })
  it('counts pieces that touch as one body', () => {
    const lv = waterLevels([square(0, 40), square(79, 40), square(158, 40)], () => 10, 2.5)
    expect(lv[0]).toBeCloseTo(7.5)
  })
  it('changes nothing where the region has no drop', () => {
    expect(waterLevels([square(1000, 6)], () => 10, 0)[0]).toBeCloseTo(10)
  })
  it('a river whose level is known takes it, whatever its lowest bank', () => {
    const bank = (x: number): number => (x > 100 ? -20 : 0)
    const lv = waterLevels([{ ...square(0, 100), level: -6 }, square(199, 100)], (x) => bank(x), 2.5)
    expect(lv[0]).toBeCloseTo(-6)
    expect(lv[1]).toBeCloseTo(-6)
  })
})
