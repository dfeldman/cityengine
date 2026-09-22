import { describe, expect, it } from 'vitest'
import { insetNested, insetRing, NEST_INSET } from '../src/city/nesting.ts'

const square = (x0: number, z0: number, w: number): number[] => [x0, z0, x0 + w, z0, x0 + w, z0 + w, x0, z0 + w]

describe('buildings mapped inside other buildings', () => {
  it('pulls a ring in by the same distance on every side, either winding', () => {
    for (const r of [square(0, 0, 10), [...square(0, 0, 10)].reverse().flatMap((_, i, a) => i % 2 ? [] : [a[i + 1], a[i]])]) {
      const q = insetRing(r, 0.5)
      const xs = q.filter((_, i) => i % 2 === 0)
      const zs = q.filter((_, i) => i % 2 === 1)
      expect(Math.min(...xs)).toBeCloseTo(0.5)
      expect(Math.max(...xs)).toBeCloseTo(9.5)
      expect(Math.min(...zs)).toBeCloseTo(0.5)
      expect(Math.max(...zs)).toBeCloseTo(9.5)
    }
  })

  it('pulls in the inner building sharing a wall with the outer one, and leaves the rest alone', () => {
    const outer = { id: 1, ring: square(0, 0, 20) }
    const inner = { id: 2, ring: square(0, 0, 8) }          // shares two walls with the outer one
    const apart = { id: 3, ring: square(40, 0, 8) }
    const aloft = { id: 4, ring: square(2, 2, 4), minHeight: 12 }
    const [o, i, a, up] = insetNested([outer, inner, apart, aloft])
    expect(o.ring).toEqual(outer.ring)
    expect(a.ring).toEqual(apart.ring)
    expect(up.ring).toEqual(aloft.ring)
    expect(Math.min(...i.ring.filter((_, k) => k % 2 === 0))).toBeCloseTo(NEST_INSET)
  })

  it('pulls in only one of two identical outlines', () => {
    const [a, b] = insetNested([{ id: 1, ring: square(0, 0, 10) }, { id: 2, ring: square(0, 0, 10) }])
    expect(a.ring).toEqual(square(0, 0, 10))
    expect(b.ring).not.toEqual(square(0, 0, 10))
  })
})
