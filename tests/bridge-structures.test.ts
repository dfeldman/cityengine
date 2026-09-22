import { describe, expect, it } from 'vitest'
import { axisOf, inOutline, styleFor, PARIS_BRIDGES } from '../src/render/bridge-structures.ts'

describe('bridge structures (BUGS.md #37)', () => {
  it('finds the long axis of a turned rectangle', () => {
    // 120 m by 20 m, turned 30°
    const a = (30 * Math.PI) / 180
    const c = Math.cos(a)
    const s = Math.sin(a)
    const pts = [[0, -10], [120, -10], [120, 10], [0, 10]].map(([x, z]) => ({ x: 50 + x * c - z * s, z: 20 + x * s + z * c }))
    const ax = axisOf(pts)!
    expect(ax.L).toBeCloseTo(120, 3)
    expect(ax.half).toBeCloseTo(10, 3)
    expect(Math.abs(ax.ux * c + ax.uz * s)).toBeCloseTo(1, 5)
    // the origin is the middle of one short end
    const ends = [{ x: 50, z: 20 }, { x: 50 + 120 * c, z: 20 + 120 * s }]
    expect(Math.min(...ends.map((e) => Math.hypot(e.x - ax.o.x, e.z - ax.o.z)))).toBeLessThan(1e-6)
  })
  it('tests a point against an outline with a margin', () => {
    const r = [{ x: 0, z: 0 }, { x: 10, z: 0 }, { x: 10, z: 4 }, { x: 0, z: 4 }]
    expect(inOutline(r, 5, 2)).toBe(true)
    expect(inOutline(r, 5, 4.8, 1)).toBe(true)
    expect(inOutline(r, 5, 6, 1)).toBe(false)
  })
  it('knows the Seine bridges by the names on their outlines', () => {
    expect(styleFor({ id: 1, ring: [], name: 'Pont Neuf' }, PARIS_BRIDGES)?.bastions).toBe(true)
    expect(styleFor({ id: 1, ring: [], name: 'Petit-Pont - Cardinal Lustiger' }, PARIS_BRIDGES)?.kind).toBe('stone')
    expect(styleFor({ id: 1, ring: [], name: 'Pont Nowhere' }, PARIS_BRIDGES)).toBeUndefined()
  })
})
