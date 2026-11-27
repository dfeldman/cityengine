import { describe, expect, it } from 'vitest'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { MeshBuilder } from '../src/render/buildings.ts'
import { addLeafShade, addShadow, shadowOffset } from '../src/render/shadows.ts'

const off = shadowOffset(new Vector3(-0.42, -0.72, 0.55))
const area = (b: MeshBuilder): number => {
  let a = 0
  const P = b.positions, I = b.indices
  for (let i = 0; i < I.length; i += 3) {
    const [p, q, r] = [I[i], I[i + 1], I[i + 2]].map((k) => [P[k * 3], P[k * 3 + 2]])
    a += Math.abs((q[0] - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (q[1] - p[1])) / 2
  }
  return a
}
const finite = (...bs: MeshBuilder[]): boolean => bs.every((b) => [...b.positions, ...b.colors].every(Number.isFinite))

describe('soft shadows', () => {
  const cases: [string, { x: number; z: number }[], number][] = [
    ['box', [{ x: 0, z: 0 }, { x: 20, z: 0 }, { x: 20, z: 12 }, { x: 0, z: 12 }], 22],
    ['thin', [{ x: 0, z: 0 }, { x: 30, z: 0 }, { x: 30, z: 0.4 }, { x: 0, z: 0.4 }], 15],
    ['dupes', [{ x: 0, z: 0 }, { x: 0, z: 0 }, { x: 5, z: 0 }, { x: 5, z: 5 }, { x: 5, z: 5 }], 8],
    ['tall', [{ x: 0, z: 0 }, { x: 8, z: 0 }, { x: 8, z: 8 }, { x: 0, z: 8 }], 180],
  ]
  for (const [name, ring, h] of cases) {
    it(`${name}: finite, and the 50% line is the hard shadow's edge`, () => {
      const core = new MeshBuilder(), skirt = new MeshBuilder(), hard = new MeshBuilder()
      addShadow(core, ring, h, off, 0.172, skirt)
      addShadow(hard, ring, h, off, 0.172)
      expect(finite(core, skirt)).toBe(true)
      // core + half the skirt ≈ the hard polygon (rounded corners shave a little)
      const est = area(core) + area(skirt) / 2
      expect(Math.abs(est - area(hard)) / area(hard)).toBeLessThan(0.06)
    })
  }
  it('collinear footprint adds nothing broken', () => {
    const core = new MeshBuilder(), skirt = new MeshBuilder()
    addShadow(core, [{ x: 0, z: 0 }, { x: 5, z: 0 }, { x: 10, z: 0 }], 8, off, 0.172, skirt)
    expect(finite(core, skirt)).toBe(true)
  })
  it('tree shade is finite at any height', () => {
    for (const h of [0.5, 3, 12, 30]) {
      const b = new MeshBuilder()
      addLeafShade(b, 0, 0, h, h * 0.2, off, 0.172, 123456)
      expect(b.triangles).toBeGreaterThan(0)
      expect(finite(b)).toBe(true)
    }
  })
})
