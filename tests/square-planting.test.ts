import { describe, expect, it } from 'vitest'
import { MeshBuilder } from '../src/render/buildings.ts'
import { GardenTiles, type SquareGround } from '../src/render/garden.ts'
import { packPoints } from '../src/city/package.ts'

const box = (x0: number, z0: number, x1: number, z1: number) => [{ x: x0, z: z0 }, { x: x1, z: z0 }, { x: x1, z: z1 }, { x: x0, z: z1 }]
const ground = (o: Partial<SquareGround> = {}): SquareGround => ({
  parks: [{ ring: box(20, 20, 120, 120), holes: [] }],
  closed: [],
  ways: [{ pts: [{ x: 20, z: 70 }, { x: 120, z: 70 }], half: 1.3, walk: true }],
  paved: [],
  lawns: false,
  statues: [],
  ...o,
})
const planted = (g: SquareGround, formal: number[][] = []): number[] => {
  const out = new MeshBuilder()
  new GardenTiles({ hedges: [], flats: [], topiary: [], formal }, 200).squarePlanting(out, g, 0, 0)
  return out.positions
}
const each = (p: number[], f: (x: number, y: number, z: number) => void): void => { for (let i = 0; i < p.length; i += 3) f(p[i], p[i + 1], p[i + 2]) }

describe('squarePlanting', () => {
  it('plants a square, and the same each time', () => {
    const a = planted(ground())
    expect(a.length).toBeGreaterThan(0)
    expect(planted(ground())).toEqual(a)
  })
  it('stays on the park and off its walk', () => {
    each(planted(ground()), (x, _y, z) => {
      expect(x).toBeGreaterThan(17)
      expect(x).toBeLessThan(123)
      expect(z).toBeGreaterThan(17)
      expect(z).toBeLessThan(123)
      expect(Math.abs(z - 70)).toBeGreaterThan(1.1) // (the walk's drawn half-width: footways are 2.2 m)
    })
  })
  it('keeps out of what is closed', () => {
    each(planted(ground({ closed: [{ ring: box(30, 30, 110, 60) }] })), (x, y, z) => {
      if (y > 0.3) expect(x > 33 && x < 107 && z > 33 && z < 57).toBe(false)
    })
  })
  it('leaves a planned garden alone', () => {
    expect(planted(ground(), [packPoints(box(0, 0, 200, 200))]).length).toBe(0)
  })
})
