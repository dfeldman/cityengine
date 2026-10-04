import { describe, expect, it } from 'vitest'
import { applyStreetPaint, markBrickSquares, PAINT_BIKE, PAINT_TRANSIT } from '../tools/street-paint.ts'
import type { PackedArea } from '../src/city/package.ts'

describe('a region\'s street paint (Market Street, owner 2026-10-04)', () => {
  const street = (x0: number, x1: number, extra: object = {}) => ({ name: 'Market Street', points: [x0, 0, x1, 0], ...extra })
  it('paints the stretch between the two points and nothing past them', () => {
    const edges = [street(0, 100), street(100, 200), street(300, 400), { name: 'Mission Street', points: [0, 0, 100, 0] }]
    const n = applyStreetPaint(edges, [{ street: 'Market Street', from: { x: 0, z: 0 }, to: { x: 250, z: 0 }, paint: 'transit' }])
    expect(n).toEqual([2])
    expect(edges.map((e) => (e as { paint?: number }).paint)).toEqual([PAINT_TRANSIT, PAINT_TRANSIT, undefined, undefined])
  })
  it('takes the kerbside bus red off a street painted for transit, and adds bike paint alongside', () => {
    const e = street(0, 100, { busSide: 3 as const })
    applyStreetPaint([e], [{ street: 'Market Street', from: { x: 0, z: 0 }, to: { x: 200, z: 0 }, paint: 'transit' },
      { street: 'Market Street', from: { x: 0, z: 0 }, to: { x: 200, z: 0 }, paint: 'bike' }])
    expect((e as { busSide?: number }).busSide).toBeUndefined()
    expect((e as { paint?: number }).paint).toBe(PAINT_TRANSIT | PAINT_BIKE)
  })
})

describe('brick squares', () => {
  it('lays a paved square that opens off a brick street in brick, and leaves one across town', () => {
    const sq = (x: number, z: number): PackedArea => ({ kind: 'paved', ring: [x, z, x + 30, z, x + 30, z + 30, x, z + 30] })
    const areas = [sq(10, 12), sq(10, 500), { kind: 'park', ring: [10, 12, 40, 12, 40, 40, 10, 40] } as PackedArea]
    const n = markBrickSquares(areas, [{ name: 'Market Street', points: [0, 0, 200, 0], width: 14, walk: 4 }], ['Market Street'])
    expect(n).toBe(1)
    expect(areas.map((a) => a.brick)).toEqual([true, undefined, undefined])
  })
})
